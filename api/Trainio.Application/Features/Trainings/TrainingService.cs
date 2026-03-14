using System.Globalization;
using Trainio.Application.Common.Persistence;
using Trainio.Domain.Common;
using Trainio.Domain.Features.Clients;
using Trainio.Domain.Features.Trainings;
using Trainio.Domain.ValueObjects;

namespace Trainio.Application.Features.Trainings;

public sealed class TrainingService : ITrainingService
{
    private readonly IRepository<Client> _clientRepository;
    private readonly IRepository<Training> _trainingRepository;
    private readonly IUnitOfWork _unitOfWork;

    public TrainingService(IRepositoryFactory repositoryFactory, IUnitOfWork unitOfWork)
    {
        _clientRepository = repositoryFactory.Get<Client>();
        _trainingRepository = repositoryFactory.Get<Training>();
        _unitOfWork = unitOfWork;
    }

    public async Task<TrainingsHomeDto> GetHomeAsync(
        DateOnly date,
        CancellationToken cancellationToken)
    {
        var allTrainings = await _trainingRepository.GetAllAsync(cancellationToken);
        var todayTrainings = allTrainings
            .Where(training => ResolveLocalDate(training.StartAt) == date)
            .OrderBy(training => training.StartAt)
            .ToArray();

        var clientNameById = await ResolveClientNameByIdAsync(
            todayTrainings
                .Select(training => training.ClientId.Value)
                .Distinct()
                .ToArray(),
            cancellationToken);

        var todayTrainingSummaries = todayTrainings
            .Select(training => ToTrainingHomeSummary(training, clientNameById))
            .ToArray();

        var utcNow = DateTimeOffset.UtcNow;
        var nextTraining = todayTrainings
            .FirstOrDefault(training =>
                training.Status == TrainingStatus.Planned &&
                training.StartAt >= utcNow);

        var activeTrainingId = allTrainings
            .Where(training => training.Status == TrainingStatus.Started)
            .OrderByDescending(training => training.StartAt)
            .Select(training => (Guid?)training.Id)
            .FirstOrDefault();

        return new TrainingsHomeDto(
            date,
            nextTraining is null ? null : ToTrainingHomeSummary(nextTraining, clientNameById),
            activeTrainingId,
            todayTrainingSummaries);
    }

    public async Task<IReadOnlyList<TrainingWarningDto>> CheckWarningsAsync(
        CheckTrainingWarningsCommand command,
        CancellationToken cancellationToken)
    {
        var clientId = EntityId.From(command.ClientId);
        _ = Training.CreatePlanned(clientId, command.StartAt, command.EndAt, TrainingNotes.Empty);

        await EnsureClientExistsAsync(command.ClientId, cancellationToken);

        var trainings = await _trainingRepository.GetAllAsync(cancellationToken);
        var warnings = new List<TrainingWarningDto>();

        var overlappingTraining = trainings
            .Where(training => training.OverlapsWith(command.StartAt, command.EndAt))
            .OrderBy(training => training.StartAt)
            .FirstOrDefault();

        if (overlappingTraining is not null)
        {
            var overlapStartTime = overlappingTraining.StartAt
                .ToOffset(command.StartAt.Offset)
                .ToString("HH:mm", CultureInfo.InvariantCulture);
            var overlapEndTime = overlappingTraining.EndAt
                .ToOffset(command.StartAt.Offset)
                .ToString("HH:mm", CultureInfo.InvariantCulture);

            warnings.Add(new TrainingWarningDto(
                "time_overlap",
                $"This training overlaps with existing training {overlapStartTime}-{overlapEndTime}."));
        }

        var sameDay = trainings
            .Where(training => training.IsForClient(clientId))
            .Select(training => ResolveSharedLocalDay(
                training.StartAt,
                training.EndAt,
                command.StartAt,
                command.EndAt,
                command.StartAt.Offset))
            .Where(sharedDay => sharedDay is not null)
            .Select(sharedDay => sharedDay!.Value)
            .OrderBy(sharedDay => sharedDay)
            .FirstOrDefault();

        if (sameDay != default)
        {
            warnings.Add(new TrainingWarningDto(
                "same_client_same_day",
                $"Client already has a training on {sameDay:yyyy-MM-dd}."));
        }

        return warnings;
    }

    public async Task<TrainingDto> CreateAsync(
        CreateTrainingCommand command,
        CancellationToken cancellationToken)
    {
        var clientId = EntityId.From(command.ClientId);
        var notes = TrainingNotes.From(command.Notes);

        await EnsureClientExistsAsync(command.ClientId, cancellationToken);

        var training = Training.CreatePlanned(clientId, command.StartAt, command.EndAt, notes);

        await _trainingRepository.AddAsync(training, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new TrainingDto(
            training.Id,
            training.ClientId.Value,
            training.StartAt,
            training.EndAt,
            training.Notes.Value);
    }

    private async Task EnsureClientExistsAsync(Guid clientId, CancellationToken cancellationToken)
    {
        var exists = await _clientRepository.ExistsByQueryAsync(
            client => client.Id == clientId,
            cancellationToken);

        if (!exists)
        {
            throw new DomainException("clientId must reference existing client.");
        }
    }

    private async Task<Dictionary<Guid, string>> ResolveClientNameByIdAsync(
        IReadOnlyCollection<Guid> clientIds,
        CancellationToken cancellationToken)
    {
        if (clientIds.Count == 0)
        {
            return [];
        }

        var ids = clientIds.ToArray();
        var clients = await _clientRepository.GetByQueryAsync(
            client => ids.Contains(client.Id),
            cancellationToken);

        return clients.ToDictionary(client => client.Id, client => client.FullName);
    }

    private static TrainingHomeSummaryDto ToTrainingHomeSummary(
        Training training,
        IReadOnlyDictionary<Guid, string> clientNameById)
    {
        var clientName = clientNameById.TryGetValue(training.ClientId.Value, out var resolvedName)
            ? resolvedName
            : "Unknown client";

        return new TrainingHomeSummaryDto(
            training.Id,
            training.StartAt.ToString("HH:mm", CultureInfo.InvariantCulture),
            clientName,
            training.Status.ToString().ToLowerInvariant());
    }

    private static DateOnly ResolveLocalDate(DateTimeOffset dateTimeOffset)
    {
        return DateOnly.FromDateTime(dateTimeOffset.DateTime);
    }

    private static DateOnly? ResolveSharedLocalDay(
        DateTimeOffset firstStartAt,
        DateTimeOffset firstEndAt,
        DateTimeOffset secondStartAt,
        DateTimeOffset secondEndAt,
        TimeSpan localOffset)
    {
        var firstDays = ResolveLocalDays(firstStartAt, firstEndAt, localOffset);
        var secondDays = ResolveLocalDays(secondStartAt, secondEndAt, localOffset);
        var sharedDays = firstDays.Intersect(secondDays).OrderBy(day => day).ToArray();

        if (sharedDays.Length == 0)
        {
            return null;
        }

        return sharedDays[0];
    }

    private static HashSet<DateOnly> ResolveLocalDays(
        DateTimeOffset startAt,
        DateTimeOffset endAt,
        TimeSpan localOffset)
    {
        var localStart = startAt.ToOffset(localOffset).DateTime;
        var localEndExclusive = endAt.ToOffset(localOffset).DateTime;
        var localEndInclusive = localEndExclusive.TimeOfDay == TimeSpan.Zero
            ? localEndExclusive.AddTicks(-1)
            : localEndExclusive;

        var startDate = DateOnly.FromDateTime(localStart);
        var endDate = DateOnly.FromDateTime(localEndInclusive);
        var days = new HashSet<DateOnly>();

        for (var date = startDate; date <= endDate; date = date.AddDays(1))
        {
            days.Add(date);
        }

        return days;
    }
}

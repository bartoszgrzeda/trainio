using Trainio.Application.Common.Persistence;
using Trainio.Domain.Common;
using Trainio.Domain.Features.Clients;
using Trainio.Domain.Features.PlanTemplates;
using Trainio.Domain.ValueObjects;

namespace Trainio.Application.Features.Clients;

public sealed class ClientService : IClientService
{
    private readonly IRepository<Client> _clientRepository;
    private readonly IRepository<PlanTemplate> _planTemplateRepository;
    private readonly IUnitOfWork _unitOfWork;

    public ClientService(IRepositoryFactory repositoryFactory, IUnitOfWork unitOfWork)
    {
        _clientRepository = repositoryFactory.Get<Client>();
        _planTemplateRepository = repositoryFactory.Get<PlanTemplate>();
        _unitOfWork = unitOfWork;
    }

    public async Task<ClientDto> CreateAsync(CreateClientCommand command, CancellationToken cancellationToken)
    {
        var firstName = FirstName.From(command.FirstName);
        var lastName = LastName.From(command.LastName);
        var birthDate = BirthDate.From(command.BirthDate);
        var phoneNumber = PhoneNumber.From(command.PhoneNumber);
        var gender = Gender.From(command.Gender);
        var notes = Notes.From(command.Notes);

        var client = Client.From(firstName, lastName, birthDate, phoneNumber, gender, notes);

        await _clientRepository.AddAsync(client, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ToDto(client);
    }

    public async Task<ClientDto?> GetAsync(Guid id, CancellationToken cancellationToken)
    {
        var client = await _clientRepository.GetByIdAsync(id, cancellationToken);
        if (client is null)
        {
            return null;
        }

        return ToDto(client);
    }

    public async Task<IReadOnlyList<ClientListItemDto>> ListAsync(string? query, CancellationToken cancellationToken)
    {
        var normalizedQuery = query?.Trim();

        IReadOnlyList<Client> clients;
        if (string.IsNullOrWhiteSpace(normalizedQuery))
        {
            clients = await _clientRepository.GetAllAsync(cancellationToken);
        }
        else
        {
            var value = normalizedQuery.ToLowerInvariant();
            clients = await _clientRepository.GetByQueryAsync(
                client => (client.FirstName.Value + " " + client.LastName.Value).ToLower().Contains(value),
                cancellationToken);
        }

        return clients
            .OrderBy(client => client.LastName.Value)
            .ThenBy(client => client.FirstName.Value)
            .Select(client => new ClientListItemDto(client.Id, client.FullName))
            .ToArray();
    }

    public async Task<ClientDto?> UpdateAsync(UpdateClientCommand command, CancellationToken cancellationToken)
    {
        var client = await _clientRepository.GetByIdAsync(command.Id, cancellationToken);
        if (client is null)
        {
            return null;
        }

        var firstName = FirstName.From(command.FirstName);
        var lastName = LastName.From(command.LastName);
        var birthDate = BirthDate.From(command.BirthDate);
        var phoneNumber = PhoneNumber.From(command.PhoneNumber);
        var gender = Gender.From(command.Gender);
        var notes = Notes.From(command.Notes);

        client.Update(firstName, lastName, birthDate, phoneNumber, gender, notes);
        _clientRepository.Update(client);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ToDto(client);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var client = await _clientRepository.GetByIdAsync(id, cancellationToken);
        if (client is null)
        {
            return false;
        }

        _clientRepository.Delete(client);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<ClientTrainingPlanDto?> GetTrainingPlanAsync(Guid clientId, CancellationToken cancellationToken)
    {
        var client = await _clientRepository.GetByIdAsync(clientId, cancellationToken);
        if (client is null)
        {
            return null;
        }

        var defaultTemplate = await ResolveDefaultTemplateAsync(cancellationToken);
        var trainingPlanName = client.TrainingPlanName?.Value ?? string.Empty;

        return new ClientTrainingPlanDto(
            client.Id,
            client.FullName,
            trainingPlanName,
            ToTrainingPlanDayDtos(client.TrainingPlanDays),
            defaultTemplate);
    }

    public async Task<UpdatedClientTrainingPlanDto?> UpdateTrainingPlanAsync(
        UpdateClientTrainingPlanCommand command,
        CancellationToken cancellationToken)
    {
        var client = await _clientRepository.GetByIdAsync(command.ClientId, cancellationToken);
        if (client is null)
        {
            return null;
        }

        var trainingPlanName = PlanName.From(command.Name);
        var trainingPlanDays = ToTrainingPlanDays(command.Days);

        client.UpdateTrainingPlan(trainingPlanName, trainingPlanDays);
        _clientRepository.Update(client);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new UpdatedClientTrainingPlanDto(
            client.Id,
            client.TrainingPlanName!.Value,
            ToTrainingPlanDayDtos(client.TrainingPlanDays),
            DateTimeOffset.UtcNow);
    }

    private async Task<ClientTrainingPlanDefaultTemplateDto> ResolveDefaultTemplateAsync(CancellationToken cancellationToken)
    {
        var templates = await _planTemplateRepository.GetAllAsync(cancellationToken);
        var defaultTemplate = templates.OrderBy(template => template.Name.Value).FirstOrDefault();

        if (defaultTemplate is null)
        {
            return new ClientTrainingPlanDefaultTemplateDto(null, null, false);
        }

        return new ClientTrainingPlanDefaultTemplateDto(defaultTemplate.Id, defaultTemplate.Name.Value, true);
    }

    private static IReadOnlyList<PlanDay> ToTrainingPlanDays(IReadOnlyList<ClientTrainingPlanDayCommand> days)
    {
        if (days is null)
        {
            throw new DomainException("days is required.");
        }

        var normalizedDays = new List<PlanDay>(days.Count);
        for (var dayIndex = 0; dayIndex < days.Count; dayIndex++)
        {
            var day = days[dayIndex] ?? throw new DomainException($"days[{dayIndex}] is required.");
            var exercises = day.Exercises ?? throw new DomainException("exercises is required.");

            var normalizedExercises = new List<PlanDayExercise>(exercises.Count);
            for (var exerciseIndex = 0; exerciseIndex < exercises.Count; exerciseIndex++)
            {
                var exercise = exercises[exerciseIndex] ??
                    throw new DomainException($"exercises[{exerciseIndex}] is required.");
                var series = exercise.Series ?? throw new DomainException("series is required.");

                var normalizedSeries = new List<ExerciseSet>(series.Count);
                for (var seriesIndex = 0; seriesIndex < series.Count; seriesIndex++)
                {
                    var set = series[seriesIndex] ?? throw new DomainException($"series[{seriesIndex}] is required.");
                    normalizedSeries.Add(ExerciseSet.From(RepeatsCount.From(set.RepeatsCount)));
                }

                normalizedExercises.Add(PlanDayExercise.From(
                    EntityId.From(exercise.ExerciseId),
                    exerciseIndex,
                    normalizedSeries));
            }

            normalizedDays.Add(PlanDay.From(PlanDayName.From(day.Name), normalizedExercises));
        }

        return normalizedDays;
    }

    private static IReadOnlyList<ClientTrainingPlanDayDto> ToTrainingPlanDayDtos(IReadOnlyList<PlanDay> days)
    {
        return days
            .Select(day => new ClientTrainingPlanDayDto(
                day.Name.Value,
                day.Exercises
                    .Select((exercise, index) => new { Exercise = exercise, Index = index })
                    .OrderBy(item => item.Exercise.Order)
                    .ThenBy(item => item.Index)
                    .Select(item => new ClientTrainingPlanDayExerciseDto(
                        item.Exercise.ExerciseId.Value,
                        item.Exercise.Series
                            .Select(set => new ClientTrainingPlanExerciseSetDto(set.RepeatsCount.Value))
                            .ToArray()))
                    .ToArray()))
            .ToArray();
    }

    private static ClientDto ToDto(Client client)
    {
        return new ClientDto(
            client.Id,
            client.FirstName.Value,
            client.LastName.Value,
            client.BirthDate.Value,
            client.PhoneNumber.Value,
            client.Gender.Value,
            client.Notes.Value,
            client.FullName);
    }
}

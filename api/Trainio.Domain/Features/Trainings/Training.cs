using System.Text.Json.Serialization;
using Trainio.Domain.Common;
using Trainio.Domain.ValueObjects;

namespace Trainio.Domain.Features.Trainings;

public sealed class Training : BaseEntity
{
    private Training()
    {
        ClientId = null!;
        Notes = null!;
        Status = TrainingStatus.Planned;
    }

    [JsonConstructor]
    private Training(
        Guid id,
        EntityId clientId,
        DateTimeOffset startAt,
        DateTimeOffset endAt,
        TrainingNotes notes,
        TrainingStatus status)
        : base(id)
    {
        ClientId = Require(clientId, nameof(clientId));
        StartAt = ValidateStartAt(startAt);
        EndAt = ValidateEndAt(startAt, endAt);
        Notes = Require(notes, nameof(notes));
        Status = status;
    }

    public EntityId ClientId { get; private set; }

    public DateTimeOffset StartAt { get; private set; }

    public DateTimeOffset EndAt { get; private set; }

    public TrainingNotes Notes { get; private set; }

    public TrainingStatus Status { get; private set; }

    public static Training CreatePlanned(
        EntityId clientId,
        DateTimeOffset startAt,
        DateTimeOffset endAt,
        TrainingNotes notes)
    {
        return new Training(
            Guid.NewGuid(),
            clientId,
            startAt,
            endAt,
            notes,
            TrainingStatus.Planned);
    }

    public bool OverlapsWith(DateTimeOffset startAt, DateTimeOffset endAt)
    {
        var validatedStartAt = ValidateStartAt(startAt);
        var validatedEndAt = ValidateEndAt(startAt, endAt);

        return StartAt < validatedEndAt && EndAt > validatedStartAt;
    }

    public void Start()
    {
        Status = TrainingStatus.Started;
    }

    public void Finish(TrainingNotes notes)
    {
        Notes = Require(notes, nameof(notes));
        Status = TrainingStatus.Finished;
    }

    public void Cancel()
    {
        Status = TrainingStatus.Canceled;
    }

    public bool IsForClient(EntityId clientId)
    {
        return ClientId == Require(clientId, nameof(clientId));
    }

    private static DateTimeOffset ValidateStartAt(DateTimeOffset startAt)
    {
        if (startAt == default)
        {
            throw new DomainException("startAt is required.");
        }

        return startAt;
    }

    private static DateTimeOffset ValidateEndAt(DateTimeOffset startAt, DateTimeOffset endAt)
    {
        if (endAt == default)
        {
            throw new DomainException("endAt is required.");
        }

        if (endAt <= startAt)
        {
            throw new DomainException("endAt must be later than startAt.");
        }

        return endAt;
    }

    private static T Require<T>(T? value, string fieldName) where T : class
    {
        if (value is null)
        {
            throw new DomainException($"{fieldName} is required.");
        }

        return value;
    }
}

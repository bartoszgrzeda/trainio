namespace Trainio.Application.Features.Trainings;

public sealed record TrainingsHomeDto(
    DateOnly Date,
    TrainingHomeSummaryDto? NextTraining,
    Guid? ActiveTrainingId,
    IReadOnlyList<TrainingHomeSummaryDto> Trainings);

public sealed record TrainingHomeSummaryDto(
    Guid Id,
    string StartTime,
    string Name,
    string Status);

public sealed record CreateTrainingCommand(
    Guid ClientId,
    DateTimeOffset StartAt,
    DateTimeOffset EndAt,
    string? Notes);

public sealed record CheckTrainingWarningsCommand(
    Guid ClientId,
    DateTimeOffset StartAt,
    DateTimeOffset EndAt);

public sealed record TrainingDto(
    Guid Id,
    Guid ClientId,
    DateTimeOffset StartAt,
    DateTimeOffset EndAt,
    string Notes);

public sealed record TrainingWarningDto(string Code, string Message);

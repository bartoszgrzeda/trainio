namespace Trainio.Application.Features.Clients;

public sealed record CreateClientCommand(
    string FirstName,
    string LastName,
    DateOnly BirthDate,
    string PhoneNumber,
    string Gender,
    string Notes);

public sealed record UpdateClientCommand(
    Guid Id,
    string FirstName,
    string LastName,
    DateOnly BirthDate,
    string PhoneNumber,
    string Gender,
    string Notes);

public sealed record ClientDto(
    Guid Id,
    string FirstName,
    string LastName,
    DateOnly BirthDate,
    string PhoneNumber,
    string Gender,
    string Notes,
    string FullName);

public sealed record ClientListItemDto(Guid Id, string FullName);

public sealed record UpdateClientTrainingPlanCommand(
    Guid ClientId,
    string Name,
    IReadOnlyList<ClientTrainingPlanDayCommand> Days);

public sealed record ClientTrainingPlanDayCommand(
    string Name,
    IReadOnlyList<ClientTrainingPlanDayExerciseCommand> Exercises);

public sealed record ClientTrainingPlanDayExerciseCommand(
    Guid ExerciseId,
    IReadOnlyList<ClientTrainingPlanExerciseSetCommand> Series);

public sealed record ClientTrainingPlanExerciseSetCommand(int RepeatsCount);

public sealed record ClientTrainingPlanDto(
    Guid ClientId,
    string ClientName,
    string Name,
    IReadOnlyList<ClientTrainingPlanDayDto> Days,
    ClientTrainingPlanDefaultTemplateDto DefaultTemplate);

public sealed record UpdatedClientTrainingPlanDto(
    Guid ClientId,
    string Name,
    IReadOnlyList<ClientTrainingPlanDayDto> Days,
    DateTimeOffset UpdatedAt);

public sealed record ClientTrainingPlanDayDto(
    string Name,
    IReadOnlyList<ClientTrainingPlanDayExerciseDto> Exercises);

public sealed record ClientTrainingPlanDayExerciseDto(
    Guid ExerciseId,
    IReadOnlyList<ClientTrainingPlanExerciseSetDto> Series);

public sealed record ClientTrainingPlanExerciseSetDto(int RepeatsCount);

public sealed record ClientTrainingPlanDefaultTemplateDto(
    Guid? Id,
    string? Name,
    bool IsConfigured);

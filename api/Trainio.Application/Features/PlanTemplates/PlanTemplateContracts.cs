namespace Trainio.Application.Features.PlanTemplates;

public sealed record CreatePlanTemplateCommand(
    string Name,
    IReadOnlyList<PlanTemplateDayCommand> Days);

public sealed record UpdatePlanTemplateCommand(
    Guid Id,
    string Name,
    IReadOnlyList<PlanTemplateDayCommand> Days);

public sealed record PlanTemplateDayCommand(
    string Name,
    IReadOnlyList<PlanTemplateDayExerciseCommand> Exercises);

public sealed record PlanTemplateDayExerciseCommand(
    Guid ExerciseId,
    IReadOnlyList<PlanTemplateExerciseSetCommand> Series);

public sealed record PlanTemplateExerciseSetCommand(int RepeatsCount);

public sealed record PlanTemplateDto(
    Guid Id,
    string Name,
    IReadOnlyList<PlanTemplateDayDto> Days);

public sealed record PlanTemplateDayDto(
    string Name,
    IReadOnlyList<PlanTemplateDayExerciseDto> Exercises);

public sealed record PlanTemplateDayExerciseDto(
    Guid ExerciseId,
    IReadOnlyList<PlanTemplateExerciseSetDto> Series);

public sealed record PlanTemplateExerciseSetDto(int RepeatsCount);

public sealed record PlanTemplateListItemDto(Guid Id, string Name);

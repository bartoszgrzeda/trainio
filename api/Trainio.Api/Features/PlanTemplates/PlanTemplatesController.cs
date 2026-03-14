using Microsoft.AspNetCore.Mvc;
using Trainio.Application.Features.PlanTemplates;

namespace Trainio.Api.Features.PlanTemplates;

[ApiController]
[Route("api/plan-templates")]
public sealed class PlanTemplatesController : ControllerBase
{
    private readonly IPlanTemplateService _planTemplateService;

    public PlanTemplatesController(IPlanTemplateService planTemplateService)
    {
        _planTemplateService = planTemplateService;
    }

    [HttpPost("create")]
    [ProducesResponseType(typeof(PlanTemplateResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PlanTemplateResponse>> CreateAsync(
        [FromBody] CreatePlanTemplateRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var created = await _planTemplateService.CreateAsync(
            new CreatePlanTemplateCommand(
                request.Name,
                request.Days.Select(day => new PlanTemplateDayCommand(
                    day.Name,
                    day.Exercises.Select(exercise => new PlanTemplateDayExerciseCommand(
                        exercise.ExerciseId,
                        exercise.Order,
                        exercise.Series.Select(set => new PlanTemplateExerciseSetCommand(set.RepeatsCount)).ToArray()))
                    .ToArray()))
                .ToArray()),
            cancellationToken);

        return Ok(ToResponse(created));
    }

    [HttpGet("get")]
    [ProducesResponseType(typeof(PlanTemplateResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PlanTemplateResponse>> GetAsync(
        [FromQuery] Guid id,
        CancellationToken cancellationToken)
    {
        var planTemplate = await _planTemplateService.GetAsync(id, cancellationToken);
        if (planTemplate is null)
        {
            return NotFound();
        }

        return Ok(ToResponse(planTemplate));
    }

    [HttpGet("list")]
    [ProducesResponseType(typeof(PlanTemplateListResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<PlanTemplateListResponse>> ListAsync(
        [FromQuery] string? query,
        CancellationToken cancellationToken)
    {
        var planTemplates = await _planTemplateService.ListAsync(query, cancellationToken);

        return Ok(new PlanTemplateListResponse(
            planTemplates.Select(item => new PlanTemplateListItemResponse(item.Id, item.Name)).ToArray()));
    }

    [HttpPost("update")]
    [ProducesResponseType(typeof(PlanTemplateResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PlanTemplateResponse>> UpdateAsync(
        [FromBody] UpdatePlanTemplateRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var updated = await _planTemplateService.UpdateAsync(
            new UpdatePlanTemplateCommand(
                request.Id,
                request.Name,
                request.Days.Select(day => new PlanTemplateDayCommand(
                    day.Name,
                    day.Exercises.Select(exercise => new PlanTemplateDayExerciseCommand(
                        exercise.ExerciseId,
                        exercise.Order,
                        exercise.Series.Select(set => new PlanTemplateExerciseSetCommand(set.RepeatsCount)).ToArray()))
                    .ToArray()))
                .ToArray()),
            cancellationToken);

        if (updated is null)
        {
            return NotFound();
        }

        return Ok(ToResponse(updated));
    }

    [HttpPost("delete")]
    [ProducesResponseType(typeof(DeletePlanTemplateResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DeletePlanTemplateResponse>> DeleteAsync(
        [FromBody] DeletePlanTemplateRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var deleted = await _planTemplateService.DeleteAsync(request.Id, cancellationToken);
        if (!deleted)
        {
            return NotFound();
        }

        return Ok(new DeletePlanTemplateResponse(true));
    }

    private static PlanTemplateResponse ToResponse(PlanTemplateDto planTemplate)
    {
        return new PlanTemplateResponse(
            planTemplate.Id,
            planTemplate.Name,
            planTemplate.Days
                .Select(day => new PlanTemplateDayResponse(
                    day.Name,
                    day.Exercises
                        .Select(exercise => new PlanTemplateDayExerciseResponse(
                            exercise.ExerciseId,
                            exercise.Order,
                            exercise.Series.Select(set => new PlanTemplateExerciseSetResponse(set.RepeatsCount)).ToArray()))
                        .ToArray()))
                .ToArray());
    }
}

public sealed record CreatePlanTemplateRequest(string Name, IReadOnlyList<PlanTemplateDayRequest> Days);

public sealed record UpdatePlanTemplateRequest(Guid Id, string Name, IReadOnlyList<PlanTemplateDayRequest> Days);

public sealed record DeletePlanTemplateRequest(Guid Id);

public sealed record PlanTemplateDayRequest(string Name, IReadOnlyList<PlanTemplateDayExerciseRequest> Exercises);

public sealed record PlanTemplateDayExerciseRequest(
    Guid ExerciseId,
    int Order,
    IReadOnlyList<PlanTemplateExerciseSetRequest> Series);

public sealed record PlanTemplateExerciseSetRequest(int RepeatsCount);

public sealed record PlanTemplateResponse(
    Guid Id,
    string Name,
    IReadOnlyList<PlanTemplateDayResponse> Days);

public sealed record PlanTemplateDayResponse(
    string Name,
    IReadOnlyList<PlanTemplateDayExerciseResponse> Exercises);

public sealed record PlanTemplateDayExerciseResponse(
    Guid ExerciseId,
    int Order,
    IReadOnlyList<PlanTemplateExerciseSetResponse> Series);

public sealed record PlanTemplateExerciseSetResponse(int RepeatsCount);

public sealed record DeletePlanTemplateResponse(bool Success);

public sealed record PlanTemplateListResponse(IReadOnlyList<PlanTemplateListItemResponse> PlanTemplates);

public sealed record PlanTemplateListItemResponse(Guid Id, string Name);

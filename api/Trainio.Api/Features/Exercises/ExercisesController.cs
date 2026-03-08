using Microsoft.AspNetCore.Mvc;
using Trainio.Application.Features.Exercises;

namespace Trainio.Api.Features.Exercises;

[ApiController]
[Route("api/[controller]")]
public sealed class ExercisesController : ControllerBase
{
    private readonly IExerciseService _exerciseService;

    public ExercisesController(IExerciseService exerciseService)
    {
        _exerciseService = exerciseService;
    }

    [HttpPost("create")]
    [ProducesResponseType(typeof(ExerciseResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ExerciseResponse>> CreateAsync(
        [FromBody] CreateExerciseRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var created = await _exerciseService.CreateAsync(new CreateExerciseCommand(request.Name), cancellationToken);

        return Ok(ToResponse(created));
    }

    [HttpPost("update")]
    [ProducesResponseType(typeof(ExerciseResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ExerciseResponse>> UpdateAsync(
        [FromBody] UpdateExerciseRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var updated = await _exerciseService.UpdateAsync(
            new UpdateExerciseCommand(request.Id, request.Name),
            cancellationToken);

        if (updated is null)
        {
            return NotFound();
        }

        return Ok(ToResponse(updated));
    }

    [HttpPost("delete")]
    [ProducesResponseType(typeof(DeleteExerciseResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DeleteExerciseResponse>> DeleteAsync(
        [FromBody] DeleteExerciseRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var deleted = await _exerciseService.DeleteAsync(request.Id, cancellationToken);
        if (!deleted)
        {
            return NotFound();
        }

        return Ok(new DeleteExerciseResponse(true));
    }

    [HttpGet("list")]
    [ProducesResponseType(typeof(ExerciseListResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ExerciseListResponse>> ListAsync(
        [FromQuery] string? query,
        [FromQuery] bool includeSeeded,
        CancellationToken cancellationToken)
    {
        var exercises = await _exerciseService.ListAsync(query, includeSeeded, cancellationToken);

        return Ok(new ExerciseListResponse(
            exercises
                .Select(ToResponse)
                .ToArray()));
    }

    private static ExerciseResponse ToResponse(ExerciseDto exercise)
    {
        return new ExerciseResponse(exercise.Id, exercise.Name, exercise.Source.ToString().ToLowerInvariant());
    }
}

public sealed record CreateExerciseRequest(string Name);

public sealed record UpdateExerciseRequest(Guid Id, string Name);

public sealed record DeleteExerciseRequest(Guid Id);

public sealed record DeleteExerciseResponse(bool Success);

public sealed record ExerciseListResponse(IReadOnlyList<ExerciseResponse> Exercises);

public sealed record ExerciseResponse(Guid Id, string Name, string Source);

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

        return Ok(new ExerciseResponse(created.Id, created.Name, created.Source.ToString().ToLowerInvariant()));
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
                .Select(exercise => new ExerciseResponse(exercise.Id, exercise.Name, exercise.Source.ToString().ToLowerInvariant()))
                .ToArray()));
    }
}

public sealed record CreateExerciseRequest(string Name);

public sealed record ExerciseListResponse(IReadOnlyList<ExerciseResponse> Exercises);

public sealed record ExerciseResponse(Guid Id, string Name, string Source);

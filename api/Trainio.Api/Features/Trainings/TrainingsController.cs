using Microsoft.AspNetCore.Mvc;
using Trainio.Application.Features.Trainings;

namespace Trainio.Api.Features.Trainings;

[ApiController]
[Route("api/[controller]")]
public sealed class TrainingsController : ControllerBase
{
    private readonly ITrainingService _trainingService;

    public TrainingsController(ITrainingService trainingService)
    {
        _trainingService = trainingService;
    }

    [HttpGet("home")]
    [ProducesResponseType(typeof(TrainingsHomeResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<TrainingsHomeResponse>> HomeAsync(
        [FromQuery] DateOnly? date,
        CancellationToken cancellationToken)
    {
        var resolvedDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var homeData = await _trainingService.GetHomeAsync(resolvedDate, cancellationToken);

        return Ok(new TrainingsHomeResponse(
            homeData.Date.ToString("yyyy-MM-dd"),
            ToNullableTrainingSummaryResponse(homeData.NextTraining),
            homeData.ActiveTrainingId,
            homeData.Trainings.Select(ToTrainingSummaryResponse).ToArray()));
    }

    [HttpPost("{trainingId:guid}/start")]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult StartAsync(Guid trainingId)
    {
        return NotFound();
    }

    [HttpPost("check-warnings")]
    [ProducesResponseType(typeof(CheckTrainingWarningsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CheckTrainingWarningsResponse>> CheckWarningsAsync(
        [FromBody] CheckTrainingWarningsRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var warnings = await _trainingService.CheckWarningsAsync(
            new CheckTrainingWarningsCommand(
                request.ClientId,
                request.StartAt,
                request.EndAt),
            cancellationToken);

        return Ok(new CheckTrainingWarningsResponse(
            warnings
                .Select(warning => new TrainingWarningResponse(warning.Code, warning.Message))
                .ToArray()));
    }

    [HttpPost("create")]
    [ProducesResponseType(typeof(CreateTrainingResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CreateTrainingResponse>> CreateAsync(
        [FromBody] CreateTrainingRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var created = await _trainingService.CreateAsync(
            new CreateTrainingCommand(
                request.ClientId,
                request.StartAt,
                request.EndAt,
                request.Notes),
            cancellationToken);

        return Ok(new CreateTrainingResponse(
            created.Id,
            created.ClientId,
            created.StartAt,
            created.EndAt,
            created.Notes));
    }

    private static TrainingSummaryResponse? ToNullableTrainingSummaryResponse(TrainingHomeSummaryDto? training)
    {
        return training is null
            ? null
            : ToTrainingSummaryResponse(training);
    }

    private static TrainingSummaryResponse ToTrainingSummaryResponse(TrainingHomeSummaryDto training)
    {
        return new TrainingSummaryResponse(training.Id, training.StartTime, training.Name, training.Status);
    }
}

public sealed record TrainingsHomeResponse(
    string Date,
    TrainingSummaryResponse? NextTraining,
    Guid? ActiveTrainingId,
    IReadOnlyList<TrainingSummaryResponse> Trainings);

public sealed record TrainingSummaryResponse(
    Guid Id,
    string StartTime,
    string Name,
    string Status);

public sealed record CheckTrainingWarningsRequest(
    Guid ClientId,
    DateTimeOffset StartAt,
    DateTimeOffset EndAt);

public sealed record CreateTrainingRequest(
    Guid ClientId,
    DateTimeOffset StartAt,
    DateTimeOffset EndAt,
    string? Notes);

public sealed record CheckTrainingWarningsResponse(IReadOnlyList<TrainingWarningResponse> Warnings);

public sealed record TrainingWarningResponse(string Code, string Message);

public sealed record CreateTrainingResponse(
    Guid Id,
    Guid ClientId,
    DateTimeOffset StartAt,
    DateTimeOffset EndAt,
    string Notes);

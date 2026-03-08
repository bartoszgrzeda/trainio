using Microsoft.AspNetCore.Mvc;

namespace Trainio.Api.Features.Trainings;

[ApiController]
[Route("api/[controller]")]
public sealed class TrainingsController : ControllerBase
{
    [HttpGet("home")]
    [ProducesResponseType(typeof(TrainingsHomeResponse), StatusCodes.Status200OK)]
    public ActionResult<TrainingsHomeResponse> HomeAsync([FromQuery] DateOnly? date)
    {
        var resolvedDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow);

        return Ok(new TrainingsHomeResponse(
            resolvedDate.ToString("yyyy-MM-dd"),
            null,
            null,
            Array.Empty<TrainingSummaryResponse>()));
    }

    [HttpPost("{trainingId:guid}/start")]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult StartAsync(Guid trainingId)
    {
        return NotFound();
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

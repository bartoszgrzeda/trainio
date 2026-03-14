using Microsoft.AspNetCore.Mvc;
using Trainio.Application.Features.Clients;

namespace Trainio.Api.Features.Clients;

[ApiController]
[Route("api/[controller]")]
public sealed class ClientsController : ControllerBase
{
    private readonly IClientService _clientService;

    public ClientsController(IClientService clientService)
    {
        _clientService = clientService;
    }

    [HttpPost("create")]
    [ProducesResponseType(typeof(ClientResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ClientResponse>> CreateAsync(
        [FromBody] CreateClientRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var command = new CreateClientCommand(
            request.FirstName,
            request.LastName,
            request.BirthDate,
            request.PhoneNumber,
            request.Gender,
            request.Notes);

        var created = await _clientService.CreateAsync(command, cancellationToken);

        return Ok(ToResponse(created));
    }

    [HttpGet("get")]
    [ProducesResponseType(typeof(ClientResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ClientResponse>> GetAsync(
        [FromQuery] Guid id,
        CancellationToken cancellationToken)
    {
        var client = await _clientService.GetAsync(id, cancellationToken);
        if (client is null)
        {
            return NotFound();
        }

        return Ok(ToResponse(client));
    }

    [HttpGet("training-plan/get")]
    [ProducesResponseType(typeof(ClientTrainingPlanResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ClientTrainingPlanResponse>> GetTrainingPlanAsync(
        [FromQuery] Guid clientId,
        CancellationToken cancellationToken)
    {
        var trainingPlan = await _clientService.GetTrainingPlanAsync(clientId, cancellationToken);
        if (trainingPlan is null)
        {
            return NotFound();
        }

        return Ok(ToTrainingPlanResponse(trainingPlan));
    }

    [HttpGet("list")]
    [ProducesResponseType(typeof(ClientListResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ClientListResponse>> ListAsync(
        [FromQuery] string? query,
        CancellationToken cancellationToken)
    {
        var clients = await _clientService.ListAsync(query, cancellationToken);

        return Ok(new ClientListResponse(
            clients.Select(client => new ClientListItemResponse(client.Id, client.FullName)).ToArray()));
    }

    [HttpPost("update")]
    [ProducesResponseType(typeof(ClientResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ClientResponse>> UpdateAsync(
        [FromBody] UpdateClientRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var updated = await _clientService.UpdateAsync(
            new UpdateClientCommand(
                request.Id,
                request.FirstName,
                request.LastName,
                request.BirthDate,
                request.PhoneNumber,
                request.Gender,
                request.Notes),
            cancellationToken);

        if (updated is null)
        {
            return NotFound();
        }

        return Ok(ToResponse(updated));
    }

    [HttpPost("training-plan/update")]
    [ProducesResponseType(typeof(UpdateClientTrainingPlanResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UpdateClientTrainingPlanResponse>> UpdateTrainingPlanAsync(
        [FromBody] UpdateClientTrainingPlanRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var updated = await _clientService.UpdateTrainingPlanAsync(
            new UpdateClientTrainingPlanCommand(
                request.ClientId,
                request.Name,
                ToTrainingPlanDayCommands(request.Days)),
            cancellationToken);

        if (updated is null)
        {
            return NotFound();
        }

        return Ok(ToUpdateTrainingPlanResponse(updated));
    }

    [HttpPost("delete")]
    [ProducesResponseType(typeof(DeleteClientResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DeleteClientResponse>> DeleteAsync(
        [FromBody] DeleteClientRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var deleted = await _clientService.DeleteAsync(request.Id, cancellationToken);
        if (!deleted)
        {
            return NotFound();
        }

        return Ok(new DeleteClientResponse(true));
    }

    private static ClientResponse ToResponse(ClientDto client)
    {
        return new ClientResponse(
            client.Id,
            client.FirstName,
            client.LastName,
            client.BirthDate,
            client.PhoneNumber,
            client.Gender,
            client.Notes,
            client.FullName);
    }

    private static ClientTrainingPlanResponse ToTrainingPlanResponse(ClientTrainingPlanDto trainingPlan)
    {
        return new ClientTrainingPlanResponse(
            trainingPlan.ClientId,
            trainingPlan.ClientName,
            trainingPlan.Name,
            trainingPlan.Days
                .Select(day => new ClientTrainingPlanDayResponse(
                    day.Name,
                    day.Exercises
                        .Select(exercise => new ClientTrainingPlanDayExerciseResponse(
                            exercise.ExerciseId,
                            exercise.Series.Select(set => new ClientTrainingPlanExerciseSetResponse(set.RepeatsCount)).ToArray()))
                        .ToArray()))
                .ToArray(),
            new ClientTrainingPlanDefaultTemplateResponse(
                trainingPlan.DefaultTemplate.Id,
                trainingPlan.DefaultTemplate.Name,
                trainingPlan.DefaultTemplate.IsConfigured));
    }

    private static UpdateClientTrainingPlanResponse ToUpdateTrainingPlanResponse(UpdatedClientTrainingPlanDto trainingPlan)
    {
        return new UpdateClientTrainingPlanResponse(
            trainingPlan.ClientId,
            trainingPlan.Name,
            trainingPlan.Days
                .Select(day => new ClientTrainingPlanDayResponse(
                    day.Name,
                    day.Exercises
                        .Select(exercise => new ClientTrainingPlanDayExerciseResponse(
                            exercise.ExerciseId,
                            exercise.Series.Select(set => new ClientTrainingPlanExerciseSetResponse(set.RepeatsCount)).ToArray()))
                        .ToArray()))
                .ToArray(),
            trainingPlan.UpdatedAt);
    }

    private static IReadOnlyList<ClientTrainingPlanDayCommand> ToTrainingPlanDayCommands(
        IReadOnlyList<ClientTrainingPlanDayRequest>? days)
    {
        return (days ?? [])
            .Select(day => new ClientTrainingPlanDayCommand(
                day.Name,
                (day.Exercises ?? [])
                    .Select(exercise => new ClientTrainingPlanDayExerciseCommand(
                        exercise.ExerciseId,
                        (exercise.Series ?? [])
                            .Select(set => new ClientTrainingPlanExerciseSetCommand(set.RepeatsCount))
                            .ToArray()))
                    .ToArray()))
            .ToArray();
    }
}

public sealed record CreateClientRequest(
    string FirstName,
    string LastName,
    DateOnly BirthDate,
    string PhoneNumber,
    string Gender,
    string Notes);

public sealed record UpdateClientRequest(
    Guid Id,
    string FirstName,
    string LastName,
    DateOnly BirthDate,
    string PhoneNumber,
    string Gender,
    string Notes);

public sealed record DeleteClientRequest(Guid Id);

public sealed record UpdateClientTrainingPlanRequest(
    Guid ClientId,
    string Name,
    IReadOnlyList<ClientTrainingPlanDayRequest> Days);

public sealed record ClientTrainingPlanDayRequest(
    string Name,
    IReadOnlyList<ClientTrainingPlanDayExerciseRequest> Exercises);

public sealed record ClientTrainingPlanDayExerciseRequest(
    Guid ExerciseId,
    IReadOnlyList<ClientTrainingPlanExerciseSetRequest> Series);

public sealed record ClientTrainingPlanExerciseSetRequest(int RepeatsCount);

public sealed record ClientResponse(
    Guid Id,
    string FirstName,
    string LastName,
    DateOnly BirthDate,
    string PhoneNumber,
    string Gender,
    string Notes,
    string FullName);

public sealed record DeleteClientResponse(bool Success);

public sealed record ClientListResponse(IReadOnlyList<ClientListItemResponse> Clients);

public sealed record ClientListItemResponse(Guid Id, string FullName);

public sealed record ClientTrainingPlanResponse(
    Guid ClientId,
    string ClientName,
    string Name,
    IReadOnlyList<ClientTrainingPlanDayResponse> Days,
    ClientTrainingPlanDefaultTemplateResponse DefaultTemplate);

public sealed record UpdateClientTrainingPlanResponse(
    Guid ClientId,
    string Name,
    IReadOnlyList<ClientTrainingPlanDayResponse> Days,
    DateTimeOffset UpdatedAt);

public sealed record ClientTrainingPlanDayResponse(
    string Name,
    IReadOnlyList<ClientTrainingPlanDayExerciseResponse> Exercises);

public sealed record ClientTrainingPlanDayExerciseResponse(
    Guid ExerciseId,
    IReadOnlyList<ClientTrainingPlanExerciseSetResponse> Series);

public sealed record ClientTrainingPlanExerciseSetResponse(int RepeatsCount);

public sealed record ClientTrainingPlanDefaultTemplateResponse(
    Guid? Id,
    string? Name,
    bool IsConfigured);

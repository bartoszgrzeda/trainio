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

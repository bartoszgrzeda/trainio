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

        return Ok(new ClientResponse(
            created.Id,
            created.FirstName,
            created.LastName,
            created.BirthDate,
            created.PhoneNumber,
            created.Gender,
            created.Notes,
            created.FullName));
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
}

public sealed record CreateClientRequest(
    string FirstName,
    string LastName,
    DateOnly BirthDate,
    string PhoneNumber,
    string Gender,
    string Notes);

public sealed record ClientResponse(
    Guid Id,
    string FirstName,
    string LastName,
    DateOnly BirthDate,
    string PhoneNumber,
    string Gender,
    string Notes,
    string FullName);

public sealed record ClientListResponse(IReadOnlyList<ClientListItemResponse> Clients);

public sealed record ClientListItemResponse(Guid Id, string FullName);

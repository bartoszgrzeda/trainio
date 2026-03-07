namespace Trainio.Application.Features.Clients;

public interface IClientService
{
    Task<ClientDto> CreateAsync(CreateClientCommand command, CancellationToken cancellationToken);

    Task<IReadOnlyList<ClientListItemDto>> ListAsync(string? query, CancellationToken cancellationToken);
}

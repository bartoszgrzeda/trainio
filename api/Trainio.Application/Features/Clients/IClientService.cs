namespace Trainio.Application.Features.Clients;

public interface IClientService
{
    Task<ClientDto> CreateAsync(CreateClientCommand command, CancellationToken cancellationToken);

    Task<ClientDto?> GetAsync(Guid id, CancellationToken cancellationToken);

    Task<IReadOnlyList<ClientListItemDto>> ListAsync(string? query, CancellationToken cancellationToken);

    Task<ClientDto?> UpdateAsync(UpdateClientCommand command, CancellationToken cancellationToken);

    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken);
}

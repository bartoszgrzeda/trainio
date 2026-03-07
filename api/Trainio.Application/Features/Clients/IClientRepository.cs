using Trainio.Domain.Features.Clients;

namespace Trainio.Application.Features.Clients;

public interface IClientRepository
{
    Task AddAsync(Client client, CancellationToken cancellationToken);

    Task<IReadOnlyList<Client>> ListAsync(string? query, CancellationToken cancellationToken);
}

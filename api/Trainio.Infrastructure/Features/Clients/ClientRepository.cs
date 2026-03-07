using Microsoft.EntityFrameworkCore;
using Trainio.Application.Features.Clients;
using Trainio.Domain.Features.Clients;
using Trainio.Infrastructure.Persistence;

namespace Trainio.Infrastructure.Features.Clients;

public sealed class ClientRepository : IClientRepository
{
    private readonly TrainioDbContext _dbContext;

    public ClientRepository(TrainioDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(Client client, CancellationToken cancellationToken)
    {
        await _dbContext.Clients.AddAsync(client, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Client>> ListAsync(string? query, CancellationToken cancellationToken)
    {
        var normalizedQuery = query?.Trim();

        var clientsQuery = _dbContext.Clients.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(normalizedQuery))
        {
            var value = normalizedQuery.ToLowerInvariant();
            clientsQuery = clientsQuery.Where(client =>
                (client.FirstName + " " + client.LastName).ToLower().Contains(value));
        }

        return await clientsQuery
            .OrderBy(client => client.LastName)
            .ThenBy(client => client.FirstName)
            .ToListAsync(cancellationToken);
    }
}

using Trainio.Application.Common;
using Trainio.Domain.Features.Clients;

namespace Trainio.Application.Features.Clients;

public sealed class ClientService : IClientService
{
    private readonly IClientRepository _clientRepository;

    public ClientService(IClientRepository clientRepository)
    {
        _clientRepository = clientRepository;
    }

    public async Task<ClientDto> CreateAsync(CreateClientCommand command, CancellationToken cancellationToken)
    {
        if (command.BirthDate > DateOnly.FromDateTime(DateTime.UtcNow))
        {
            throw new ApplicationLayerException("Birth date cannot be in the future.");
        }

        var client = Client.Create(
            command.FirstName,
            command.LastName,
            command.BirthDate,
            command.PhoneNumber,
            command.Gender,
            command.Notes);

        await _clientRepository.AddAsync(client, cancellationToken);

        return new ClientDto(
            client.Id,
            client.FirstName,
            client.LastName,
            client.BirthDate,
            client.PhoneNumber,
            client.Gender,
            client.Notes,
            client.FullName);
    }

    public async Task<IReadOnlyList<ClientListItemDto>> ListAsync(string? query, CancellationToken cancellationToken)
    {
        var clients = await _clientRepository.ListAsync(query, cancellationToken);

        return clients
            .Select(client => new ClientListItemDto(client.Id, client.FullName))
            .ToArray();
    }
}

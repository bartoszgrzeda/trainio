using Trainio.Application.Common.Persistence;
using Trainio.Domain.Features.Clients;
using Trainio.Domain.ValueObjects;

namespace Trainio.Application.Features.Clients;

public sealed class ClientService : IClientService
{
    private readonly IRepository<Client> _clientRepository;
    private readonly IUnitOfWork _unitOfWork;

    public ClientService(IRepositoryFactory repositoryFactory, IUnitOfWork unitOfWork)
    {
        _clientRepository = repositoryFactory.Get<Client>();
        _unitOfWork = unitOfWork;
    }

    public async Task<ClientDto> CreateAsync(CreateClientCommand command, CancellationToken cancellationToken)
    {
        var firstName = FirstName.From(command.FirstName);
        var lastName = LastName.From(command.LastName);
        var birthDate = BirthDate.From(command.BirthDate);
        var phoneNumber = PhoneNumber.From(command.PhoneNumber);
        var gender = Gender.From(command.Gender);
        var notes = Notes.From(command.Notes);

        var client = Client.From(firstName, lastName, birthDate, phoneNumber, gender, notes);

        await _clientRepository.AddAsync(client, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ToDto(client);
    }

    public async Task<ClientDto?> GetAsync(Guid id, CancellationToken cancellationToken)
    {
        var client = await _clientRepository.GetByIdAsync(id, cancellationToken);
        if (client is null)
        {
            return null;
        }

        return ToDto(client);
    }

    public async Task<IReadOnlyList<ClientListItemDto>> ListAsync(string? query, CancellationToken cancellationToken)
    {
        var normalizedQuery = query?.Trim();

        IReadOnlyList<Client> clients;
        if (string.IsNullOrWhiteSpace(normalizedQuery))
        {
            clients = await _clientRepository.GetAllAsync(cancellationToken);
        }
        else
        {
            var value = normalizedQuery.ToLowerInvariant();
            clients = await _clientRepository.GetByQueryAsync(
                client => (client.FirstName.Value + " " + client.LastName.Value).ToLower().Contains(value),
                cancellationToken);
        }

        return clients
            .OrderBy(client => client.LastName.Value)
            .ThenBy(client => client.FirstName.Value)
            .Select(client => new ClientListItemDto(client.Id, client.FullName))
            .ToArray();
    }

    public async Task<ClientDto?> UpdateAsync(UpdateClientCommand command, CancellationToken cancellationToken)
    {
        var client = await _clientRepository.GetByIdAsync(command.Id, cancellationToken);
        if (client is null)
        {
            return null;
        }

        var firstName = FirstName.From(command.FirstName);
        var lastName = LastName.From(command.LastName);
        var birthDate = BirthDate.From(command.BirthDate);
        var phoneNumber = PhoneNumber.From(command.PhoneNumber);
        var gender = Gender.From(command.Gender);
        var notes = Notes.From(command.Notes);

        client.Update(firstName, lastName, birthDate, phoneNumber, gender, notes);
        _clientRepository.Update(client);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ToDto(client);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var client = await _clientRepository.GetByIdAsync(id, cancellationToken);
        if (client is null)
        {
            return false;
        }

        _clientRepository.Delete(client);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    private static ClientDto ToDto(Client client)
    {
        return new ClientDto(
            client.Id,
            client.FirstName.Value,
            client.LastName.Value,
            client.BirthDate.Value,
            client.PhoneNumber.Value,
            client.Gender.Value,
            client.Notes.Value,
            client.FullName);
    }
}

namespace Trainio.Application.Features.Clients;

public sealed record CreateClientCommand(
    string FirstName,
    string LastName,
    DateOnly BirthDate,
    string PhoneNumber,
    string Gender,
    string Notes);

public sealed record UpdateClientCommand(
    Guid Id,
    string FirstName,
    string LastName,
    DateOnly BirthDate,
    string PhoneNumber,
    string Gender,
    string Notes);

public sealed record ClientDto(
    Guid Id,
    string FirstName,
    string LastName,
    DateOnly BirthDate,
    string PhoneNumber,
    string Gender,
    string Notes,
    string FullName);

public sealed record ClientListItemDto(Guid Id, string FullName);

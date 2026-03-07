using Trainio.Domain.Common;

namespace Trainio.Domain.Features.Clients;

public sealed class Client
{
    private Client()
    {
        FirstName = string.Empty;
        LastName = string.Empty;
        PhoneNumber = string.Empty;
        Gender = string.Empty;
        Notes = string.Empty;
    }

    private Client(
        Guid id,
        string firstName,
        string lastName,
        DateOnly birthDate,
        string phoneNumber,
        string gender,
        string notes)
    {
        Id = id;
        FirstName = firstName;
        LastName = lastName;
        BirthDate = birthDate;
        PhoneNumber = phoneNumber;
        Gender = gender;
        Notes = notes;
    }

    public Guid Id { get; private set; }

    public string FirstName { get; private set; }

    public string LastName { get; private set; }

    public DateOnly BirthDate { get; private set; }

    public string PhoneNumber { get; private set; }

    public string Gender { get; private set; }

    public string Notes { get; private set; }

    public string FullName => $"{FirstName} {LastName}";

    public static Client Create(
        string firstName,
        string lastName,
        DateOnly birthDate,
        string phoneNumber,
        string gender,
        string notes)
    {
        var normalizedFirstName = Require(firstName, nameof(firstName));
        var normalizedLastName = Require(lastName, nameof(lastName));
        var normalizedPhoneNumber = Require(phoneNumber, nameof(phoneNumber));
        var normalizedGender = Require(gender, nameof(gender));

        return new Client(
            Guid.NewGuid(),
            normalizedFirstName,
            normalizedLastName,
            birthDate,
            normalizedPhoneNumber,
            normalizedGender,
            notes?.Trim() ?? string.Empty);
    }

    private static string Require(string value, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new DomainException($"{fieldName} is required.");
        }

        return value.Trim();
    }
}

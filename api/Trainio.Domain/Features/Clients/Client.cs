using System.Text.Json.Serialization;
using Trainio.Domain.Common;
using Trainio.Domain.ValueObjects;

namespace Trainio.Domain.Features.Clients;

public sealed class Client : BaseEntity
{
    private Client()
    {
        FirstName = null!;
        LastName = null!;
        BirthDate = null!;
        PhoneNumber = null!;
        Gender = null!;
        Notes = null!;
    }

    [JsonConstructor]
    private Client(
        Guid id,
        FirstName firstName,
        LastName lastName,
        BirthDate birthDate,
        PhoneNumber phoneNumber,
        Gender gender,
        Notes notes)
        : base(id)
    {
        FirstName = Require(firstName, nameof(firstName));
        LastName = Require(lastName, nameof(lastName));
        BirthDate = Require(birthDate, nameof(birthDate));
        PhoneNumber = Require(phoneNumber, nameof(phoneNumber));
        Gender = Require(gender, nameof(gender));
        Notes = Require(notes, nameof(notes));
    }

    public FirstName FirstName { get; private set; }

    public LastName LastName { get; private set; }

    public BirthDate BirthDate { get; private set; }

    public PhoneNumber PhoneNumber { get; private set; }

    public Gender Gender { get; private set; }

    public Notes Notes { get; private set; }

    public string FullName => $"{FirstName.Value} {LastName.Value}";

    public static Client From(
        FirstName firstName,
        LastName lastName,
        BirthDate birthDate,
        PhoneNumber phoneNumber,
        Gender gender,
        Notes notes)
    {
        return new Client(
            Guid.NewGuid(),
            firstName,
            lastName,
            birthDate,
            phoneNumber,
            gender,
            notes);
    }

    public static Client Create(
        FirstName firstName,
        LastName lastName,
        BirthDate birthDate,
        PhoneNumber phoneNumber,
        Gender gender,
        Notes notes)
    {
        return From(firstName, lastName, birthDate, phoneNumber, gender, notes);
    }

    public void Update(
        FirstName firstName,
        LastName lastName,
        BirthDate birthDate,
        PhoneNumber phoneNumber,
        Gender gender,
        Notes notes)
    {
        var validatedFirstName = Require(firstName, nameof(firstName));
        var validatedLastName = Require(lastName, nameof(lastName));
        var validatedBirthDate = Require(birthDate, nameof(birthDate));
        var validatedPhoneNumber = Require(phoneNumber, nameof(phoneNumber));
        var validatedGender = Require(gender, nameof(gender));
        var validatedNotes = Require(notes, nameof(notes));

        FirstName = validatedFirstName;
        LastName = validatedLastName;
        BirthDate = validatedBirthDate;
        PhoneNumber = validatedPhoneNumber;
        Gender = validatedGender;
        Notes = validatedNotes;
    }

    private static T Require<T>(T? value, string fieldName) where T : class
    {
        if (value is null)
        {
            throw new DomainException($"{fieldName} is required.");
        }

        return value;
    }
}

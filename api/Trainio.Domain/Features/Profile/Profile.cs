using System.Text.Json.Serialization;
using Trainio.Domain.Common;
using Trainio.Domain.ValueObjects;

namespace Trainio.Domain.Features.Profile;

public sealed class Profile : BaseEntity
{
    private Profile()
    {
        FirstName = null!;
        LastName = null!;
        Email = null!;
        PhoneNumber = null!;
    }

    [JsonConstructor]
    private Profile(Guid id, FirstName firstName, LastName lastName, Email email, PhoneNumber phoneNumber)
        : base(id)
    {
        FirstName = Require(firstName, nameof(firstName));
        LastName = Require(lastName, nameof(lastName));
        Email = Require(email, nameof(email));
        PhoneNumber = Require(phoneNumber, nameof(phoneNumber));
    }

    public FirstName FirstName { get; private set; }

    public LastName LastName { get; private set; }

    public Email Email { get; private set; }

    public PhoneNumber PhoneNumber { get; private set; }

    public static Profile From(FirstName firstName, LastName lastName, Email email, PhoneNumber phoneNumber)
    {
        return new Profile(
            Guid.NewGuid(),
            firstName,
            lastName,
            email,
            phoneNumber);
    }

    public void Update(FirstName firstName, LastName lastName, Email email, PhoneNumber phoneNumber)
    {
        var validatedFirstName = Require(firstName, nameof(firstName));
        var validatedLastName = Require(lastName, nameof(lastName));
        var validatedEmail = Require(email, nameof(email));
        var validatedPhoneNumber = Require(phoneNumber, nameof(phoneNumber));

        FirstName = validatedFirstName;
        LastName = validatedLastName;
        Email = validatedEmail;
        PhoneNumber = validatedPhoneNumber;
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

using Trainio.Domain.Common;

namespace Trainio.Domain.Features.Profile;

public sealed class UserProfile
{
    private UserProfile()
    {
        FirstName = string.Empty;
        LastName = string.Empty;
        Email = string.Empty;
        PhoneNumber = string.Empty;
    }

    private UserProfile(Guid id, string firstName, string lastName, string email, string phoneNumber)
    {
        Id = id;
        FirstName = firstName;
        LastName = lastName;
        Email = email;
        PhoneNumber = phoneNumber;
    }

    public Guid Id { get; private set; }

    public string FirstName { get; private set; }

    public string LastName { get; private set; }

    public string Email { get; private set; }

    public string PhoneNumber { get; private set; }

    public static UserProfile CreateDefault()
    {
        return new UserProfile(Guid.NewGuid(), string.Empty, string.Empty, string.Empty, string.Empty);
    }

    public void Update(string firstName, string lastName, string email, string phoneNumber)
    {
        FirstName = Require(firstName, nameof(firstName));
        LastName = Require(lastName, nameof(lastName));
        Email = Require(email, nameof(email));
        PhoneNumber = Require(phoneNumber, nameof(phoneNumber));
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

using System;
using System.Collections.Generic;

namespace ExampleCompany.ExampleProduct.Domain.Entities;

public sealed class User : Entity
{
    private User()
    {
    }

    public string Email { get; private set; } = string.Empty;
    public string NormalizedEmail { get; private set; } = string.Empty;
    public string DisplayName { get; private set; } = string.Empty;
    public DateTime CreatedUtc { get; private set; }

    public Guid? ManagerId { get; private set; }
    public User? Manager { get; private set; }
    public ICollection<User> DirectReports { get; private set; } = new List<User>();

    public static User Create(string email, string displayName)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new ArgumentException("Email is required.", nameof(email));
        }

        if (string.IsNullOrWhiteSpace(displayName))
        {
            throw new ArgumentException("Display name is required.", nameof(displayName));
        }

        return new User
        {
            Email = email.Trim(),
            NormalizedEmail = NormalizeEmail(email),
            DisplayName = displayName.Trim(),
            CreatedUtc = DateTime.UtcNow
        };
    }

    public void ChangeEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new ArgumentException("Email is required.", nameof(email));
        }

        Email = email.Trim();
        NormalizedEmail = NormalizeEmail(email);
    }

    public void ChangeDisplayName(string displayName)
    {
        if (string.IsNullOrWhiteSpace(displayName))
        {
            throw new ArgumentException("Display name is required.", nameof(displayName));
        }

        DisplayName = displayName.Trim();
    }

    public void AssignManager(User? manager)
    {
        Manager = manager;
        ManagerId = manager?.Id;
    }

    private static string NormalizeEmail(string email)
    {
        return email.Trim().ToUpperInvariant();
    }
}

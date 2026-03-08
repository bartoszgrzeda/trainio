using System.Text.Json;
using FluentAssertions;
using Trainio.Domain.Common;
using Trainio.Domain.ValueObjects;
using DomainProfile = Trainio.Domain.Features.Profile.Profile;

namespace Trainio.Tests.Unit.Domain.Features.Profile;

public sealed class ProfileTests
{
    [Fact]
    public void From_ShouldCreateValidProfile_WhenInputIsValid()
    {
        var profile = DomainProfile.From(
            FirstName.From("  Anna  "),
            LastName.From("  Kowalska  "),
            Email.From("  ANNA.KOWALSKA@Example.COM  "),
            PhoneNumber.From("0048 123 456 789"));

        profile.Id.Should().NotBe(Guid.Empty);
        profile.FirstName.Should().Be(FirstName.From("Anna"));
        profile.LastName.Should().Be(LastName.From("Kowalska"));
        profile.Email.Should().Be(Email.From("anna.kowalska@example.com"));
        profile.PhoneNumber.Should().Be(PhoneNumber.From("+48123456789"));
    }

    [Fact]
    public void From_ShouldThrow_WhenRequiredValueObjectIsNull()
    {
        Action act = () => DomainProfile.From(
            null!,
            LastName.From("Kowalska"),
            Email.From("anna@example.com"),
            PhoneNumber.From("+48123456789"));

        act.Should().Throw<DomainException>().WithMessage("firstName is required.");
    }

    [Fact]
    public void Update_ShouldUpdateAllProperties_WhenInputIsValid()
    {
        var profile = DomainProfile.From(
            FirstName.From("Anna"),
            LastName.From("Kowalska"),
            Email.From("anna@example.com"),
            PhoneNumber.From("+48123456789"));

        profile.Update(
            FirstName.From("  Jan  "),
            LastName.From("  Nowak  "),
            Email.From("  JAN.NOWAK@Example.COM  "),
            PhoneNumber.From("+48 987 654 321"));

        profile.FirstName.Should().Be(FirstName.From("Jan"));
        profile.LastName.Should().Be(LastName.From("Nowak"));
        profile.Email.Should().Be(Email.From("jan.nowak@example.com"));
        profile.PhoneNumber.Should().Be(PhoneNumber.From("+48987654321"));
    }

    [Fact]
    public void Update_ShouldNotMutateState_WhenNewValueObjectIsNull()
    {
        var profile = DomainProfile.From(
            FirstName.From("Anna"),
            LastName.From("Kowalska"),
            Email.From("anna@example.com"),
            PhoneNumber.From("+48123456789"));

        Action act = () => profile.Update(
            FirstName.From("Jan"),
            LastName.From("Nowak"),
            null!,
            PhoneNumber.From("+48987654321"));

        act.Should().Throw<DomainException>().WithMessage("email is required.");
        profile.FirstName.Should().Be(FirstName.From("Anna"));
        profile.LastName.Should().Be(LastName.From("Kowalska"));
        profile.Email.Should().Be(Email.From("anna@example.com"));
        profile.PhoneNumber.Should().Be(PhoneNumber.From("+48123456789"));
    }

    [Fact]
    public void JsonRoundTrip_ShouldPreserveProfileState()
    {
        var profile = DomainProfile.From(
            FirstName.From("Anna"),
            LastName.From("Kowalska"),
            Email.From("anna@example.com"),
            PhoneNumber.From("+48123456789"));

        var json = JsonSerializer.Serialize(profile);
        var restored = JsonSerializer.Deserialize<DomainProfile>(json);

        restored.Should().NotBeNull();
        restored!.Id.Should().Be(profile.Id);
        restored.FirstName.Should().Be(profile.FirstName);
        restored.LastName.Should().Be(profile.LastName);
        restored.Email.Should().Be(profile.Email);
        restored.PhoneNumber.Should().Be(profile.PhoneNumber);
    }
}

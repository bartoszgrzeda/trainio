using System.Text.Json;
using FluentAssertions;
using Trainio.Domain.Common;
using Trainio.Domain.Features.Clients;
using Trainio.Domain.ValueObjects;

namespace Trainio.Tests.Unit.Domain.Features.Clients;

public sealed class ClientTests
{
    [Fact]
    public void From_ShouldCreateClient_WhenInputIsValid()
    {
        var client = Client.From(
            FirstName.From("  Anna  "),
            LastName.From("  Kowalska  "),
            BirthDate.From(new DateOnly(1992, 3, 15)),
            PhoneNumber.From("0048 123 456 789"),
            Gender.From("f"),
            Notes.From("  Beginner athlete  "));

        client.Id.Should().NotBe(Guid.Empty);
        client.FirstName.Should().Be(FirstName.From("Anna"));
        client.LastName.Should().Be(LastName.From("Kowalska"));
        client.BirthDate.Should().Be(BirthDate.From(new DateOnly(1992, 3, 15)));
        client.PhoneNumber.Should().Be(PhoneNumber.From("+48123456789"));
        client.Gender.Should().Be(Gender.Female);
        client.Notes.Should().Be(Notes.From("Beginner athlete"));
        client.FullName.Should().Be("Anna Kowalska");
    }

    [Fact]
    public void From_ShouldThrow_WhenRequiredValueObjectIsNull()
    {
        Action act = () => Client.From(
            FirstName.From("Anna"),
            LastName.From("Kowalska"),
            BirthDate.From(new DateOnly(1992, 3, 15)),
            PhoneNumber.From("+48123456789"),
            null!,
            Notes.Empty);

        act.Should().Throw<DomainException>().WithMessage("gender is required.");
    }

    [Fact]
    public void JsonRoundTrip_ShouldPreserveClientState()
    {
        var client = Client.From(
            FirstName.From("Anna"),
            LastName.From("Kowalska"),
            BirthDate.From(new DateOnly(1992, 3, 15)),
            PhoneNumber.From("+48123456789"),
            Gender.Female,
            Notes.From("Consistency first"));

        var json = JsonSerializer.Serialize(client);
        var restored = JsonSerializer.Deserialize<Client>(json);

        restored.Should().NotBeNull();
        restored!.Id.Should().Be(client.Id);
        restored.FirstName.Should().Be(client.FirstName);
        restored.LastName.Should().Be(client.LastName);
        restored.BirthDate.Should().Be(client.BirthDate);
        restored.PhoneNumber.Should().Be(client.PhoneNumber);
        restored.Gender.Should().Be(client.Gender);
        restored.Notes.Should().Be(client.Notes);
    }
}

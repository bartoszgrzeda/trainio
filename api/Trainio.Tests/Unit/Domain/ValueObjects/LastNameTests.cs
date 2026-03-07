using System.Text.Json;
using FluentAssertions;
using Trainio.Domain.Common;
using Trainio.Domain.ValueObjects;

namespace Trainio.Tests.Unit.Domain.ValueObjects;

public sealed class LastNameTests
{
    [Fact]
    public void From_ShouldTrimValue()
    {
        var result = LastName.From("  Kowalski  ");

        result.Value.Should().Be("Kowalski");
    }

    [Fact]
    public void From_ShouldThrow_WhenValueIsInvalid()
    {
        Action act = () => LastName.From(" ");

        act.Should().Throw<DomainException>().WithMessage("Last name is invalid.");
    }

    [Fact]
    public void ValueObjects_ShouldBeEqual_WhenValuesAreEqual()
    {
        var left = LastName.From("Kowalski");
        var right = LastName.From("Kowalski");

        left.Should().Be(right);
    }

    [Fact]
    public void TryFrom_ShouldReturnFalse_WhenValueIsInvalid()
    {
        var result = LastName.TryFrom(null, out var lastName);

        result.Should().BeFalse();
        lastName.Should().BeNull();
    }

    [Fact]
    public void JsonRoundTrip_ShouldKeepTheSameValue()
    {
        var valueObject = LastName.From("Kowalski");

        var json = JsonSerializer.Serialize(valueObject);
        var restored = JsonSerializer.Deserialize<LastName>(json);

        json.Should().Be("\"Kowalski\"");
        restored.Should().Be(valueObject);
    }
}

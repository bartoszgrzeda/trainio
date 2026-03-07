using System.Text.Json;
using FluentAssertions;
using Trainio.Domain.Common;
using Trainio.Domain.ValueObjects;

namespace Trainio.Tests.Unit.Domain.ValueObjects;

public sealed class FirstNameTests
{
    [Fact]
    public void From_ShouldTrimValue()
    {
        var result = FirstName.From("  Anna  ");

        result.Value.Should().Be("Anna");
    }

    [Fact]
    public void From_ShouldThrow_WhenValueIsInvalid()
    {
        Action act = () => FirstName.From(" ");

        act.Should().Throw<DomainException>().WithMessage("First name is invalid.");
    }

    [Fact]
    public void ValueObjects_ShouldBeEqual_WhenValuesAreEqual()
    {
        var left = FirstName.From("Anna");
        var right = FirstName.From("Anna");

        left.Should().Be(right);
    }

    [Fact]
    public void TryFrom_ShouldReturnFalse_WhenValueIsInvalid()
    {
        var result = FirstName.TryFrom(null, out var firstName);

        result.Should().BeFalse();
        firstName.Should().BeNull();
    }

    [Fact]
    public void JsonRoundTrip_ShouldKeepTheSameValue()
    {
        var valueObject = FirstName.From("Anna");

        var json = JsonSerializer.Serialize(valueObject);
        var restored = JsonSerializer.Deserialize<FirstName>(json);

        json.Should().Be("\"Anna\"");
        restored.Should().Be(valueObject);
    }
}

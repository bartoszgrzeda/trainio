using System.Text.Json;
using FluentAssertions;
using Trainio.Domain.Common;
using Trainio.Domain.ValueObjects;

namespace Trainio.Tests.Unit.Domain.ValueObjects;

public sealed class PlanNameTests
{
    [Fact]
    public void From_ShouldTrimValue()
    {
        var result = PlanName.From("  Push Pull Legs  ");

        result.Value.Should().Be("Push Pull Legs");
    }

    [Fact]
    public void From_ShouldThrow_WhenValueIsInvalid()
    {
        Action act = () => PlanName.From(string.Empty);

        act.Should().Throw<DomainException>().WithMessage("Plan name is invalid.");
    }

    [Fact]
    public void ValueObjects_ShouldBeEqual_WhenValuesAreEqual()
    {
        var left = PlanName.From("Full Body");
        var right = PlanName.From("Full Body");

        left.Should().Be(right);
    }

    [Fact]
    public void TryFrom_ShouldReturnFalse_WhenValueIsInvalid()
    {
        var result = PlanName.TryFrom(" ", out var planName);

        result.Should().BeFalse();
        planName.Should().BeNull();
    }

    [Fact]
    public void JsonRoundTrip_ShouldKeepTheSameValue()
    {
        var valueObject = PlanName.From("Full Body");

        var json = JsonSerializer.Serialize(valueObject);
        var restored = JsonSerializer.Deserialize<PlanName>(json);

        json.Should().Be("\"Full Body\"");
        restored.Should().Be(valueObject);
    }
}

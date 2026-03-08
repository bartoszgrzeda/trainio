using System.Text.Json;
using FluentAssertions;
using Trainio.Domain.Common;
using Trainio.Domain.ValueObjects;

namespace Trainio.Tests.Unit.Domain.ValueObjects;

public sealed class PlanDayNameTests
{
    [Fact]
    public void From_ShouldTrimValue()
    {
        var result = PlanDayName.From("  Day 1  ");

        result.Value.Should().Be("Day 1");
    }

    [Fact]
    public void From_ShouldThrow_WhenValueIsInvalid()
    {
        Action act = () => PlanDayName.From(string.Empty);

        act.Should().Throw<DomainException>().WithMessage("Plan day name is invalid.");
    }

    [Fact]
    public void ValueObjects_ShouldBeEqual_WhenValuesAreEqual()
    {
        var left = PlanDayName.From("Day 1");
        var right = PlanDayName.From("Day 1");

        left.Should().Be(right);
    }

    [Fact]
    public void TryFrom_ShouldReturnFalse_WhenValueIsInvalid()
    {
        var result = PlanDayName.TryFrom(null, out var planDayName);

        result.Should().BeFalse();
        planDayName.Should().BeNull();
    }

    [Fact]
    public void JsonRoundTrip_ShouldKeepTheSameValue()
    {
        var valueObject = PlanDayName.From("Day 1");

        var json = JsonSerializer.Serialize(valueObject);
        var restored = JsonSerializer.Deserialize<PlanDayName>(json);

        json.Should().Be("\"Day 1\"");
        restored.Should().Be(valueObject);
    }
}

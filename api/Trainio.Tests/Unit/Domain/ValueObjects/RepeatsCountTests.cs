using System.Text.Json;
using FluentAssertions;
using Trainio.Domain.Common;
using Trainio.Domain.ValueObjects;

namespace Trainio.Tests.Unit.Domain.ValueObjects;

public sealed class RepeatsCountTests
{
    [Fact]
    public void From_ShouldCreateValueObject_WhenValueIsInRange()
    {
        var repeatsCount = RepeatsCount.From(12);

        repeatsCount.Value.Should().Be(12);
    }

    [Fact]
    public void From_ShouldThrow_WhenValueIsOutOfRange()
    {
        Action act = () => RepeatsCount.From(0);

        act.Should().Throw<DomainException>().WithMessage("Repeats count is invalid.");
    }

    [Fact]
    public void TryFrom_ShouldReturnFalse_WhenValueIsOutOfRange()
    {
        var result = RepeatsCount.TryFrom(1001, out var repeatsCount);

        result.Should().BeFalse();
        repeatsCount.Should().BeNull();
    }

    [Fact]
    public void JsonRoundTrip_ShouldKeepTheSameValue()
    {
        var valueObject = RepeatsCount.From(8);

        var json = JsonSerializer.Serialize(valueObject);
        var restored = JsonSerializer.Deserialize<RepeatsCount>(json);

        json.Should().Be("8");
        restored.Should().Be(valueObject);
    }
}

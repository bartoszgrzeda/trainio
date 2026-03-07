using System.Text.Json;
using FluentAssertions;
using Trainio.Domain.Common;
using Trainio.Domain.ValueObjects;

namespace Trainio.Tests.Unit.Domain.ValueObjects;

public sealed class ExerciseNameTests
{
    [Fact]
    public void From_ShouldTrimValue()
    {
        var result = ExerciseName.From("  Barbell Squat  ");

        result.Value.Should().Be("Barbell Squat");
    }

    [Fact]
    public void From_ShouldThrow_WhenValueIsInvalid()
    {
        Action act = () => ExerciseName.From(" ");

        act.Should().Throw<DomainException>().WithMessage("Exercise name is invalid.");
    }

    [Fact]
    public void ValueObjects_ShouldBeEqual_WhenValuesAreEqual()
    {
        var left = ExerciseName.From("Bench Press");
        var right = ExerciseName.From("Bench Press");

        left.Should().Be(right);
    }

    [Fact]
    public void TryFrom_ShouldReturnFalse_WhenValueIsInvalid()
    {
        var result = ExerciseName.TryFrom(null, out var exerciseName);

        result.Should().BeFalse();
        exerciseName.Should().BeNull();
    }

    [Fact]
    public void JsonRoundTrip_ShouldKeepTheSameValue()
    {
        var valueObject = ExerciseName.From("Bench Press");

        var json = JsonSerializer.Serialize(valueObject);
        var restored = JsonSerializer.Deserialize<ExerciseName>(json);

        json.Should().Be("\"Bench Press\"");
        restored.Should().Be(valueObject);
    }
}

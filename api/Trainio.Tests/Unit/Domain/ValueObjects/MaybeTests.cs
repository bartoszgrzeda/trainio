using System.Text.Json;
using FluentAssertions;
using Trainio.Domain.Common;
using Trainio.Domain.ValueObjects;

namespace Trainio.Tests.Unit.Domain.ValueObjects;

public sealed class MaybeTests
{
    [Fact]
    public void Some_ShouldCreateValue_WhenInputIsNotNull()
    {
        var maybe = Maybe<ExerciseName>.Some(ExerciseName.From("value"));

        maybe.HasValue.Should().BeTrue();
        maybe.Value.Should().Be(ExerciseName.From("value"));
    }

    [Fact]
    public void Some_ShouldThrow_WhenInputIsNull()
    {
        Action act = () => Maybe<ExerciseName>.Some(null!);

        act.Should().Throw<DomainException>().WithMessage("Maybe value cannot be null.");
    }

    [Fact]
    public void From_ShouldReturnNone_WhenInputIsNull()
    {
        var maybe = Maybe<ExerciseName>.From(null);

        maybe.HasValue.Should().BeFalse();
        maybe.IsNone.Should().BeTrue();
    }

    [Fact]
    public void Value_ShouldThrow_WhenMaybeIsEmpty()
    {
        var maybe = Maybe<ExerciseName>.None;
        Action act = () => _ = maybe.Value;

        act.Should().Throw<DomainException>().WithMessage("Cannot access value from an empty Maybe.");
    }

    [Fact]
    public void MaybeValues_ShouldBeEqual_WhenBothContainSameValue()
    {
        var left = Maybe<ExerciseName>.Some(ExerciseName.From("value"));
        var right = Maybe<ExerciseName>.Some(ExerciseName.From("value"));

        left.Should().Be(right);
    }

    [Fact]
    public void Match_ShouldUseCorrectBranch()
    {
        var some = Maybe<ExerciseName>.Some(ExerciseName.From("value"));
        var none = Maybe<ExerciseName>.None;

        some.Match(v => v.Value.Length, () => -1).Should().Be(5);
        none.Match(v => v.Value.Length, () => -1).Should().Be(-1);
    }

    [Fact]
    public void JsonRoundTrip_ShouldKeepSomeValue()
    {
        var valueObject = Maybe<ExerciseName>.Some(ExerciseName.From("Squat"));

        var json = JsonSerializer.Serialize(valueObject);
        var restored = JsonSerializer.Deserialize<Maybe<ExerciseName>>(json);

        json.Should().Be("\"Squat\"");
        restored.Should().Be(valueObject);
    }

    [Fact]
    public void JsonRoundTrip_ShouldKeepNoneValue()
    {
        var valueObject = Maybe<ExerciseName>.None;

        var json = JsonSerializer.Serialize(valueObject);
        var restored = JsonSerializer.Deserialize<Maybe<ExerciseName>>(json);

        json.Should().Be("null");
        restored.Should().Be(valueObject);
    }
}

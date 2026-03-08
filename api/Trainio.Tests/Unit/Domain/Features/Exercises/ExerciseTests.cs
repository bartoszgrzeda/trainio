using System.Text.Json;
using FluentAssertions;
using Trainio.Domain.Common;
using Trainio.Domain.Features.Exercises;
using Trainio.Domain.ValueObjects;
using DomainExercise = Trainio.Domain.Features.Exercises.Exercise;

namespace Trainio.Tests.Unit.Domain.Features.Exercises;

public sealed class ExerciseTests
{
    [Fact]
    public void From_ShouldCreateCustomExercise_WhenNameIsValid()
    {
        var exercise = DomainExercise.From(ExerciseName.From("  Barbell Squat  "));

        exercise.Id.Should().NotBe(Guid.Empty);
        exercise.ExerciseName.Should().Be(ExerciseName.From("Barbell Squat"));
        exercise.Source.Should().Be(ExerciseSource.Custom);
    }

    [Fact]
    public void From_ShouldThrow_WhenNameIsNull()
    {
        Action act = () => DomainExercise.From(null!);

        act.Should().Throw<DomainException>().WithMessage("exerciseName is required.");
    }

    [Fact]
    public void Update_ShouldChangeExerciseName_WhenNameIsValid()
    {
        var exercise = DomainExercise.From(ExerciseName.From("Barbell Squat"));

        exercise.Update(ExerciseName.From("  Front Squat  "));

        exercise.ExerciseName.Should().Be(ExerciseName.From("Front Squat"));
    }

    [Fact]
    public void Update_ShouldNotMutateState_WhenNameIsInvalid()
    {
        var exercise = DomainExercise.From(ExerciseName.From("Barbell Squat"));

        Action act = () => exercise.Update(null!);

        act.Should().Throw<DomainException>().WithMessage("exerciseName is required.");
        exercise.ExerciseName.Should().Be(ExerciseName.From("Barbell Squat"));
    }

    [Fact]
    public void JsonRoundTrip_ShouldPreserveExerciseState()
    {
        var exercise = DomainExercise.CreateSeeded(ExerciseName.From("Bench Press"));

        var json = JsonSerializer.Serialize(exercise);
        var restored = JsonSerializer.Deserialize<DomainExercise>(json);

        restored.Should().NotBeNull();
        restored!.Id.Should().Be(exercise.Id);
        restored.ExerciseName.Should().Be(exercise.ExerciseName);
        restored.Source.Should().Be(ExerciseSource.Seeded);
    }
}

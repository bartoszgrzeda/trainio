using System.Text.Json.Serialization;
using Trainio.Domain.Common;
using Trainio.Domain.ValueObjects;

namespace Trainio.Domain.Features.Exercises;

public sealed class Exercise : BaseEntity
{
    private Exercise()
    {
        ExerciseName = null!;
    }

    [JsonConstructor]
    private Exercise(Guid id, ExerciseName exerciseName, ExerciseSource source)
        : base(id)
    {
        ExerciseName = Require(exerciseName, nameof(exerciseName));
        Source = source;
    }

    public ExerciseName ExerciseName { get; private set; }

    public ExerciseSource Source { get; private set; }

    public static Exercise From(ExerciseName exerciseName)
    {
        return new Exercise(Guid.NewGuid(), exerciseName, ExerciseSource.Custom);
    }

    public static Exercise CreateCustom(ExerciseName exerciseName)
    {
        return From(exerciseName);
    }

    public static Exercise CreateSeeded(ExerciseName exerciseName)
    {
        return new Exercise(Guid.NewGuid(), exerciseName, ExerciseSource.Seeded);
    }

    public void Update(ExerciseName exerciseName)
    {
        ExerciseName = Require(exerciseName, nameof(exerciseName));
    }

    private static T Require<T>(T? value, string fieldName) where T : class
    {
        if (value is null)
        {
            throw new DomainException($"{fieldName} is required.");
        }

        return value;
    }
}

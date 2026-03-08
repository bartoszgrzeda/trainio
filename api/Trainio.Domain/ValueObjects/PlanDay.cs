using System.Text.Json.Serialization;
using Trainio.Domain.Common;

namespace Trainio.Domain.ValueObjects;

public sealed record PlanDay : ValueObject
{
    [JsonConstructor]
    private PlanDay(PlanDayName name, IReadOnlyList<PlanDayExercise> exercises)
    {
        Name = Require(name, nameof(name));
        Exercises = NormalizeExercises(exercises);
    }

    public PlanDayName Name { get; }

    public IReadOnlyList<PlanDayExercise> Exercises { get; }

    public static PlanDay From(PlanDayName name, IReadOnlyList<PlanDayExercise> exercises)
    {
        return new PlanDay(name, exercises);
    }

    private static IReadOnlyList<PlanDayExercise> NormalizeExercises(IReadOnlyList<PlanDayExercise>? exercises)
    {
        if (exercises is null)
        {
            throw new DomainException("exercises is required.");
        }

        if (exercises.Count == 0)
        {
            throw new DomainException("exercises must contain at least one item.");
        }

        var normalized = new PlanDayExercise[exercises.Count];
        for (var index = 0; index < exercises.Count; index++)
        {
            normalized[index] = Require(exercises[index], $"exercises[{index}]");
        }

        return normalized;
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

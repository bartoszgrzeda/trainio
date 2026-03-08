using System.Text.Json.Serialization;
using Trainio.Domain.Common;

namespace Trainio.Domain.ValueObjects;

public sealed record PlanDayExercise : ValueObject
{
    [JsonConstructor]
    private PlanDayExercise(EntityId exerciseId, IReadOnlyList<ExerciseSet> series)
    {
        ExerciseId = Require(exerciseId, nameof(exerciseId));
        Series = NormalizeSeries(series);
    }

    public EntityId ExerciseId { get; }

    public IReadOnlyList<ExerciseSet> Series { get; }

    public static PlanDayExercise From(EntityId exerciseId, IReadOnlyList<ExerciseSet> series)
    {
        return new PlanDayExercise(exerciseId, series);
    }

    private static IReadOnlyList<ExerciseSet> NormalizeSeries(IReadOnlyList<ExerciseSet>? series)
    {
        if (series is null)
        {
            throw new DomainException("series is required.");
        }

        if (series.Count == 0)
        {
            throw new DomainException("series must contain at least one item.");
        }

        var normalized = new ExerciseSet[series.Count];
        for (var index = 0; index < series.Count; index++)
        {
            normalized[index] = Require(series[index], $"series[{index}]");
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

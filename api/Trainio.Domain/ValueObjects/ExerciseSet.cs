using System.Text.Json.Serialization;
using Trainio.Domain.Common;

namespace Trainio.Domain.ValueObjects;

public sealed record ExerciseSet : ValueObject
{
    [JsonConstructor]
    private ExerciseSet(RepeatsCount repeatsCount)
    {
        RepeatsCount = Require(repeatsCount, nameof(repeatsCount));
    }

    public RepeatsCount RepeatsCount { get; }

    public static ExerciseSet From(RepeatsCount repeatsCount)
    {
        return new ExerciseSet(repeatsCount);
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

using System.Text.Json;
using System.Text.Json.Serialization;
using Trainio.Domain.Common;

namespace Trainio.Domain.ValueObjects;

[JsonConverter(typeof(ExerciseNameJsonConverter))]
public sealed record ExerciseName : ValueObject
{
    private const int MaxLength = 200;

    private ExerciseName(string value)
    {
        Value = value;
    }

    public string Value { get; }

    public static ExerciseName From(string value)
    {
        if (!TryFrom(value, out var exerciseName))
        {
            throw new DomainException("Exercise name is invalid.");
        }

        return exerciseName!;
    }

    public static bool TryFrom(string? value, out ExerciseName? exerciseName)
    {
        exerciseName = null;

        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        var normalized = value.Trim();

        if (normalized.Length > MaxLength)
        {
            return false;
        }

        exerciseName = new ExerciseName(normalized);
        return true;
    }

    public override string ToString() => Value;

    private sealed class ExerciseNameJsonConverter : JsonConverter<ExerciseName>
    {
        public override ExerciseName Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var value = reader.GetString() ?? string.Empty;
            return From(value);
        }

        public override void Write(Utf8JsonWriter writer, ExerciseName value, JsonSerializerOptions options)
        {
            writer.WriteStringValue(value.Value);
        }
    }
}

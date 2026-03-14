using System.Text.Json;
using System.Text.Json.Serialization;
using Trainio.Domain.Common;

namespace Trainio.Domain.ValueObjects;

[JsonConverter(typeof(TrainingNotesJsonConverter))]
public sealed record TrainingNotes : ValueObject
{
    private const int MaxLength = 500;

    private TrainingNotes(string value)
    {
        Value = value;
    }

    public string Value { get; }

    public static TrainingNotes Empty { get; } = new(string.Empty);

    public static TrainingNotes From(string? value)
    {
        if (!TryFrom(value, out var notes))
        {
            throw new DomainException("Training notes are invalid.");
        }

        return notes!;
    }

    public static bool TryFrom(string? value, out TrainingNotes? notes)
    {
        notes = null;

        var normalized = value?.Trim() ?? string.Empty;
        if (normalized.Length > MaxLength)
        {
            return false;
        }

        notes = new TrainingNotes(normalized);
        return true;
    }

    public override string ToString() => Value;

    private sealed class TrainingNotesJsonConverter : JsonConverter<TrainingNotes>
    {
        public override TrainingNotes Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var value = reader.TokenType == JsonTokenType.Null ? null : reader.GetString();
            return From(value);
        }

        public override void Write(Utf8JsonWriter writer, TrainingNotes value, JsonSerializerOptions options)
        {
            writer.WriteStringValue(value.Value);
        }
    }
}

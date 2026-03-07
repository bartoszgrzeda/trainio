using System.Text.Json;
using System.Text.Json.Serialization;
using Trainio.Domain.Common;

namespace Trainio.Domain.ValueObjects;

[JsonConverter(typeof(NotesJsonConverter))]
public sealed record Notes : ValueObject
{
    private const int MaxLength = 2000;

    private Notes(string value)
    {
        Value = value;
    }

    public string Value { get; }

    public static Notes Empty { get; } = new(string.Empty);

    public static Notes From(string? value)
    {
        if (!TryFrom(value, out var notes))
        {
            throw new DomainException("Notes are invalid.");
        }

        return notes!;
    }

    public static bool TryFrom(string? value, out Notes? notes)
    {
        notes = null;

        var normalized = value?.Trim() ?? string.Empty;

        if (normalized.Length > MaxLength)
        {
            return false;
        }

        notes = new Notes(normalized);
        return true;
    }

    public override string ToString() => Value;

    private sealed class NotesJsonConverter : JsonConverter<Notes>
    {
        public override Notes Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var value = reader.TokenType == JsonTokenType.Null ? null : reader.GetString();
            return From(value);
        }

        public override void Write(Utf8JsonWriter writer, Notes value, JsonSerializerOptions options)
        {
            writer.WriteStringValue(value.Value);
        }
    }
}

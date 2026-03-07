using System.Text.Json;
using System.Text.Json.Serialization;
using Trainio.Domain.Common;

namespace Trainio.Domain.ValueObjects;

[JsonConverter(typeof(LastNameJsonConverter))]
public sealed record LastName : ValueObject
{
    private const int MaxLength = 128;

    private LastName(string value)
    {
        Value = value;
    }

    public string Value { get; }

    public static LastName From(string value)
    {
        if (!TryFrom(value, out var lastName))
        {
            throw new DomainException("Last name is invalid.");
        }

        return lastName!;
    }

    public static bool TryFrom(string? value, out LastName? lastName)
    {
        lastName = null;

        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        var normalized = value.Trim();

        if (normalized.Length > MaxLength)
        {
            return false;
        }

        lastName = new LastName(normalized);
        return true;
    }

    public override string ToString() => Value;

    private sealed class LastNameJsonConverter : JsonConverter<LastName>
    {
        public override LastName Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var value = reader.GetString() ?? string.Empty;
            return From(value);
        }

        public override void Write(Utf8JsonWriter writer, LastName value, JsonSerializerOptions options)
        {
            writer.WriteStringValue(value.Value);
        }
    }
}

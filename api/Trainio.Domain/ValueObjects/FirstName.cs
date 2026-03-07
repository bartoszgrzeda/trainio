using System.Text.Json;
using System.Text.Json.Serialization;
using Trainio.Domain.Common;

namespace Trainio.Domain.ValueObjects;

[JsonConverter(typeof(FirstNameJsonConverter))]
public sealed record FirstName : ValueObject
{
    private const int MaxLength = 128;

    private FirstName(string value)
    {
        Value = value;
    }

    public string Value { get; }

    public static FirstName From(string value)
    {
        if (!TryFrom(value, out var firstName))
        {
            throw new DomainException("First name is invalid.");
        }

        return firstName!;
    }

    public static bool TryFrom(string? value, out FirstName? firstName)
    {
        firstName = null;

        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        var normalized = value.Trim();

        if (normalized.Length > MaxLength)
        {
            return false;
        }

        firstName = new FirstName(normalized);
        return true;
    }

    public override string ToString() => Value;

    private sealed class FirstNameJsonConverter : JsonConverter<FirstName>
    {
        public override FirstName Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var value = reader.GetString() ?? string.Empty;
            return From(value);
        }

        public override void Write(Utf8JsonWriter writer, FirstName value, JsonSerializerOptions options)
        {
            writer.WriteStringValue(value.Value);
        }
    }
}

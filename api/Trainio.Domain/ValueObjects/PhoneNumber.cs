using System.Text.Json;
using System.Text.Json.Serialization;
using Trainio.Domain.Common;

namespace Trainio.Domain.ValueObjects;

[JsonConverter(typeof(PhoneNumberJsonConverter))]
public sealed record PhoneNumber : ValueObject
{
    private const int MinDigits = 8;
    private const int MaxDigits = 15;

    private PhoneNumber(string value)
    {
        Value = value;
    }

    public string Value { get; }

    public static PhoneNumber From(string value)
    {
        if (!TryFrom(value, out var phoneNumber))
        {
            throw new DomainException("Phone number is invalid.");
        }

        return phoneNumber!;
    }

    public static bool TryFrom(string? value, out PhoneNumber? phoneNumber)
    {
        phoneNumber = null;

        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        var trimmed = value.Trim();

        if (trimmed.StartsWith("00", StringComparison.Ordinal))
        {
            trimmed = $"+{trimmed[2..]}";
        }

        if (trimmed.Count(c => c == '+') > 1)
        {
            return false;
        }

        if (trimmed.Contains('+') && !trimmed.StartsWith("+", StringComparison.Ordinal))
        {
            return false;
        }

        foreach (var character in trimmed)
        {
            if (char.IsDigit(character))
            {
                continue;
            }

            if (character is '+' or ' ' or '-' or '(' or ')' or '.')
            {
                continue;
            }

            return false;
        }

        var digits = new string(trimmed.Where(char.IsDigit).ToArray());

        if (digits.Length is < MinDigits or > MaxDigits)
        {
            return false;
        }

        phoneNumber = new PhoneNumber($"+{digits}");
        return true;
    }

    public override string ToString() => Value;

    private sealed class PhoneNumberJsonConverter : JsonConverter<PhoneNumber>
    {
        public override PhoneNumber Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var value = reader.GetString() ?? string.Empty;
            return From(value);
        }

        public override void Write(Utf8JsonWriter writer, PhoneNumber value, JsonSerializerOptions options)
        {
            writer.WriteStringValue(value.Value);
        }
    }
}

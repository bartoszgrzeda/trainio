using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using Trainio.Domain.Common;

namespace Trainio.Domain.ValueObjects;

[JsonConverter(typeof(EmailJsonConverter))]
public sealed record Email : ValueObject
{
    private const int MaxLength = 256;
    private static readonly Regex EmailPattern = new(
        "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant,
        TimeSpan.FromMilliseconds(250));

    private Email(string value)
    {
        Value = value;
    }

    public string Value { get; }

    public static Email From(string value)
    {
        if (!TryFrom(value, out var email))
        {
            throw new DomainException("Email is invalid.");
        }

        return email!;
    }

    public static bool TryFrom(string? value, out Email? email)
    {
        email = null;

        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        var normalized = value.Trim().ToLowerInvariant();

        if (normalized.Length > MaxLength)
        {
            return false;
        }

        if (!EmailPattern.IsMatch(normalized))
        {
            return false;
        }

        email = new Email(normalized);
        return true;
    }

    public override string ToString() => Value;

    private sealed class EmailJsonConverter : JsonConverter<Email>
    {
        public override Email Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var value = reader.GetString() ?? string.Empty;
            return From(value);
        }

        public override void Write(Utf8JsonWriter writer, Email value, JsonSerializerOptions options)
        {
            writer.WriteStringValue(value.Value);
        }
    }
}

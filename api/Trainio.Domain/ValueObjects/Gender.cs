using System.Text.Json;
using System.Text.Json.Serialization;
using Trainio.Domain.Common;

namespace Trainio.Domain.ValueObjects;

[JsonConverter(typeof(GenderJsonConverter))]
public sealed record Gender : ValueObject
{
    private const string MaleValue = "male";
    private const string FemaleValue = "female";
    private const string NonBinaryValue = "non-binary";
    private const string UnspecifiedValue = "unspecified";

    private static readonly Dictionary<string, string> AllowedValues = new(StringComparer.OrdinalIgnoreCase)
    {
        ["male"] = MaleValue,
        ["m"] = MaleValue,
        ["female"] = FemaleValue,
        ["f"] = FemaleValue,
        ["non-binary"] = NonBinaryValue,
        ["nonbinary"] = NonBinaryValue,
        ["non binary"] = NonBinaryValue,
        ["nb"] = NonBinaryValue,
        ["unspecified"] = UnspecifiedValue,
        ["prefer not to say"] = UnspecifiedValue,
    };

    private Gender(string value)
    {
        Value = value;
    }

    public string Value { get; }

    public static Gender Male { get; } = new(MaleValue);

    public static Gender Female { get; } = new(FemaleValue);

    public static Gender NonBinary { get; } = new(NonBinaryValue);

    public static Gender Unspecified { get; } = new(UnspecifiedValue);

    public static Gender From(string value)
    {
        if (!TryFrom(value, out var gender))
        {
            throw new DomainException("Gender is invalid.");
        }

        return gender!;
    }

    public static bool TryFrom(string? value, out Gender? gender)
    {
        gender = null;

        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        var normalizedKey = value.Trim().ToLowerInvariant();

        if (!AllowedValues.TryGetValue(normalizedKey, out var normalizedValue))
        {
            return false;
        }

        gender = normalizedValue switch
        {
            MaleValue => Male,
            FemaleValue => Female,
            NonBinaryValue => NonBinary,
            UnspecifiedValue => Unspecified,
            _ => null,
        };

        return gender is not null;
    }

    public override string ToString() => Value;

    private sealed class GenderJsonConverter : JsonConverter<Gender>
    {
        public override Gender Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var value = reader.GetString() ?? string.Empty;
            return From(value);
        }

        public override void Write(Utf8JsonWriter writer, Gender value, JsonSerializerOptions options)
        {
            writer.WriteStringValue(value.Value);
        }
    }
}

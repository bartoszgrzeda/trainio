using System.Text.Json;
using System.Text.Json.Serialization;
using Trainio.Domain.Common;

namespace Trainio.Domain.ValueObjects;

[JsonConverter(typeof(RepeatsCountJsonConverter))]
public sealed record RepeatsCount : ValueObject
{
    private const int MinValue = 1;
    private const int MaxValue = 1000;

    private RepeatsCount(int value)
    {
        Value = value;
    }

    public int Value { get; }

    public static RepeatsCount From(int value)
    {
        if (!TryFrom(value, out var repeatsCount))
        {
            throw new DomainException("Repeats count is invalid.");
        }

        return repeatsCount!;
    }

    public static bool TryFrom(int? value, out RepeatsCount? repeatsCount)
    {
        repeatsCount = null;

        if (value is null || value < MinValue || value > MaxValue)
        {
            return false;
        }

        repeatsCount = new RepeatsCount(value.Value);
        return true;
    }

    public override string ToString() => Value.ToString();

    private sealed class RepeatsCountJsonConverter : JsonConverter<RepeatsCount>
    {
        public override RepeatsCount Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType is JsonTokenType.Number && reader.TryGetInt32(out var number))
            {
                return From(number);
            }

            if (reader.TokenType is JsonTokenType.String && int.TryParse(reader.GetString(), out var stringValue))
            {
                return From(stringValue);
            }

            throw new DomainException("Repeats count is invalid.");
        }

        public override void Write(Utf8JsonWriter writer, RepeatsCount value, JsonSerializerOptions options)
        {
            writer.WriteNumberValue(value.Value);
        }
    }
}

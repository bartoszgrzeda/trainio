using System.Text.Json;
using System.Text.Json.Serialization;
using Trainio.Domain.Common;

namespace Trainio.Domain.ValueObjects;

[JsonConverter(typeof(PlanNameJsonConverter))]
public sealed record PlanName : ValueObject
{
    private const int MaxLength = 200;

    private PlanName(string value)
    {
        Value = value;
    }

    public string Value { get; }

    public static PlanName From(string value)
    {
        if (!TryFrom(value, out var planName))
        {
            throw new DomainException("Plan name is invalid.");
        }

        return planName!;
    }

    public static bool TryFrom(string? value, out PlanName? planName)
    {
        planName = null;

        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        var normalized = value.Trim();

        if (normalized.Length > MaxLength)
        {
            return false;
        }

        planName = new PlanName(normalized);
        return true;
    }

    public override string ToString() => Value;

    private sealed class PlanNameJsonConverter : JsonConverter<PlanName>
    {
        public override PlanName Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var value = reader.GetString() ?? string.Empty;
            return From(value);
        }

        public override void Write(Utf8JsonWriter writer, PlanName value, JsonSerializerOptions options)
        {
            writer.WriteStringValue(value.Value);
        }
    }
}

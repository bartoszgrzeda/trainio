using System.Text.Json;
using System.Text.Json.Serialization;
using Trainio.Domain.Common;

namespace Trainio.Domain.ValueObjects;

[JsonConverter(typeof(PlanDayNameJsonConverter))]
public sealed record PlanDayName : ValueObject
{
    private const int MaxLength = 128;

    private PlanDayName(string value)
    {
        Value = value;
    }

    public string Value { get; }

    public static PlanDayName From(string value)
    {
        if (!TryFrom(value, out var planDayName))
        {
            throw new DomainException("Plan day name is invalid.");
        }

        return planDayName!;
    }

    public static bool TryFrom(string? value, out PlanDayName? planDayName)
    {
        planDayName = null;

        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        var normalized = value.Trim();

        if (normalized.Length > MaxLength)
        {
            return false;
        }

        planDayName = new PlanDayName(normalized);
        return true;
    }

    public override string ToString() => Value;

    private sealed class PlanDayNameJsonConverter : JsonConverter<PlanDayName>
    {
        public override PlanDayName Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var value = reader.GetString() ?? string.Empty;
            return From(value);
        }

        public override void Write(Utf8JsonWriter writer, PlanDayName value, JsonSerializerOptions options)
        {
            writer.WriteStringValue(value.Value);
        }
    }
}

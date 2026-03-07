using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using Trainio.Domain.Common;

namespace Trainio.Domain.ValueObjects;

[JsonConverter(typeof(BirthDateJsonConverter))]
public sealed record BirthDate : ValueObject
{
    private BirthDate(DateOnly value)
    {
        Value = value;
    }

    public DateOnly Value { get; }

    public static BirthDate From(DateOnly value)
    {
        if (!TryFrom(value, out var birthDate))
        {
            throw new DomainException("Birth date is invalid.");
        }

        return birthDate!;
    }

    public static bool TryFrom(DateOnly? value, out BirthDate? birthDate)
    {
        birthDate = null;

        if (value is null || value.Value == default)
        {
            return false;
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        if (value.Value > today)
        {
            return false;
        }

        birthDate = new BirthDate(value.Value);
        return true;
    }

    public override string ToString() => Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

    private sealed class BirthDateJsonConverter : JsonConverter<BirthDate>
    {
        public override BirthDate Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType is not JsonTokenType.String)
            {
                throw new DomainException("Birth date is invalid.");
            }

            var value = reader.GetString();

            if (!DateOnly.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
            {
                throw new DomainException("Birth date is invalid.");
            }

            return From(date);
        }

        public override void Write(Utf8JsonWriter writer, BirthDate value, JsonSerializerOptions options)
        {
            writer.WriteStringValue(value.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture));
        }
    }
}

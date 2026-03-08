using System.Text.Json;
using System.Text.Json.Serialization;
using Trainio.Domain.Common;

namespace Trainio.Domain.ValueObjects;

[JsonConverter(typeof(EntityIdJsonConverter))]
public sealed record EntityId : ValueObject
{
    private EntityId(Guid value)
    {
        Value = value;
    }

    public Guid Value { get; }

    public static EntityId From(Guid value)
    {
        if (!TryFrom(value, out var entityId))
        {
            throw new DomainException("Entity id is invalid.");
        }

        return entityId!;
    }

    public static bool TryFrom(Guid? value, out EntityId? entityId)
    {
        entityId = null;

        if (value is null || value == Guid.Empty)
        {
            return false;
        }

        entityId = new EntityId(value.Value);
        return true;
    }

    public override string ToString() => Value.ToString();

    private sealed class EntityIdJsonConverter : JsonConverter<EntityId>
    {
        public override EntityId Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType is JsonTokenType.String &&
                Guid.TryParse(reader.GetString(), out var stringGuid))
            {
                return From(stringGuid);
            }

            if (reader.TokenType is JsonTokenType.StartObject)
            {
                using var document = JsonDocument.ParseValue(ref reader);
                if (document.RootElement.TryGetProperty("value", out var valueElement) &&
                    valueElement.ValueKind is JsonValueKind.String &&
                    Guid.TryParse(valueElement.GetString(), out var objectGuid))
                {
                    return From(objectGuid);
                }
            }

            throw new DomainException("Entity id is invalid.");
        }

        public override void Write(Utf8JsonWriter writer, EntityId value, JsonSerializerOptions options)
        {
            writer.WriteStringValue(value.Value);
        }
    }
}

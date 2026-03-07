using System.Diagnostics.CodeAnalysis;
using System.Text.Json;
using System.Text.Json.Serialization;
using Trainio.Domain.Common;

namespace Trainio.Domain.ValueObjects;

[JsonConverter(typeof(MaybeJsonConverterFactory))]
public readonly record struct Maybe<T>
    where T : ValueObject
{
    private readonly T? _value;

    private Maybe(T value)
    {
        _value = value;
        HasValue = true;
    }

    public bool HasValue { get; }

    public bool IsNone => !HasValue;

    public T Value => HasValue
        ? _value!
        : throw new DomainException("Cannot access value from an empty Maybe.");

    public static Maybe<T> None => default;

    public static Maybe<T> Some(T value)
    {
        if (value is null)
        {
            throw new DomainException("Maybe value cannot be null.");
        }

        return new Maybe<T>(value);
    }

    public static Maybe<T> From(T? value) => value is null ? None : Some(value);

    public bool TryGetValue([NotNullWhen(true)] out T? value)
    {
        value = _value;
        return HasValue;
    }

    public T GetValueOrDefault(T defaultValue) => HasValue ? _value! : defaultValue;

    public TResult Match<TResult>(Func<T, TResult> whenSome, Func<TResult> whenNone)
    {
        ArgumentNullException.ThrowIfNull(whenSome);
        ArgumentNullException.ThrowIfNull(whenNone);

        return HasValue ? whenSome(_value!) : whenNone();
    }

    public override string ToString()
    {
        if (!HasValue)
        {
            return "None";
        }

        return _value?.ToString() ?? string.Empty;
    }

    public static implicit operator Maybe<T>(T value) => From(value);
}

internal sealed class MaybeJsonConverterFactory : JsonConverterFactory
{
    public override bool CanConvert(Type typeToConvert)
    {
        if (!typeToConvert.IsGenericType ||
            typeToConvert.GetGenericTypeDefinition() != typeof(Maybe<>))
        {
            return false;
        }

        var valueType = typeToConvert.GetGenericArguments()[0];
        return typeof(ValueObject).IsAssignableFrom(valueType);
    }

    public override JsonConverter CreateConverter(Type typeToConvert, JsonSerializerOptions options)
    {
        var valueType = typeToConvert.GetGenericArguments()[0];
        var converterType = typeof(MaybeJsonConverter<>).MakeGenericType(valueType);

        return (JsonConverter)Activator.CreateInstance(converterType)!;
    }

    private sealed class MaybeJsonConverter<TValue> : JsonConverter<Maybe<TValue>>
        where TValue : ValueObject
    {
        public override Maybe<TValue> Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null)
            {
                return Maybe<TValue>.None;
            }

            var value = JsonSerializer.Deserialize<TValue>(ref reader, options);
            return Maybe<TValue>.From(value);
        }

        public override void Write(Utf8JsonWriter writer, Maybe<TValue> value, JsonSerializerOptions options)
        {
            if (!value.HasValue)
            {
                writer.WriteNullValue();
                return;
            }

            JsonSerializer.Serialize(writer, value.Value, options);
        }
    }
}

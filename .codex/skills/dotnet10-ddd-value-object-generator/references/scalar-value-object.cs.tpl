using {{DomainNamespace}}.Common;

namespace {{DomainNamespace}}.ValueObjects;

public sealed record {{ValueObjectName}} : ValueObject
{
    public {{UnderlyingType}} Value { get; private init; } = default!;

{{OptionalEfCoreCtor}}

    private {{ValueObjectName}}({{UnderlyingType}} value)
    {
        Value = value;
    }

    public static {{ValueObjectName}} From({{UnderlyingType}} value)
    {
        var normalized = Normalize(value);
        Validate(normalized);
        return new {{ValueObjectName}}(normalized);
    }

    public static bool TryFrom({{UnderlyingType}} value, out {{ValueObjectName}}? result)
    {
        try
        {
            result = From(value);
            return true;
        }
        catch
        {
            result = null;
            return false;
        }
    }

    private static {{UnderlyingType}} Normalize({{UnderlyingType}} value)
    {
        return value;
    }

    private static void Validate({{UnderlyingType}} value)
    {
    }

    public override string ToString() => Value?.ToString() ?? string.Empty;
}

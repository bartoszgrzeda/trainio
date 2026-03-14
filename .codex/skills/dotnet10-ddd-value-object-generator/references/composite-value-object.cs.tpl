using {{DomainNamespace}}.Common;

namespace {{DomainNamespace}}.ValueObjects;

public sealed record {{ValueObjectName}} : ValueObject
{
{{Properties}}

{{OptionalEfCoreCtor}}

    private {{ValueObjectName}}({{ConstructorParameters}})
    {
{{Assignments}}
    }

    public static {{ValueObjectName}} From({{ConstructorParameters}})
    {
{{NormalizeVariables}}
{{ValidationLines}}
        return new {{ValueObjectName}}({{NormalizedArguments}});
    }

    public static bool TryFrom({{ConstructorParameters}}, out {{ValueObjectName}}? result)
    {
        try
        {
            result = From({{ArgumentList}});
            return true;
        }
        catch
        {
            result = null;
            return false;
        }
    }
}

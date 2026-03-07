using System.Text.Json;
using FluentAssertions;
using Xunit;
using {{DomainNamespace}}.ValueObjects;

namespace {{TestNamespace}}.Domain.ValueObjects;

public sealed class {{ValueObjectName}}Tests
{
    [Fact]
    public void From_WithValidInput_ShouldCreateInstance()
    {
        var result = {{ValueObjectName}}.From({{ValidFactoryArguments}});

        result.Should().NotBeNull();
{{ValidAssertions}}
    }

    [Fact]
    public void From_WithInvalidInput_ShouldThrow()
    {
        var action = () => {{ValueObjectName}}.From({{InvalidFactoryArguments}});

        action.Should().Throw<{{InvalidExceptionType}}>();
    }

    [Fact]
    public void Equality_WithSameValues_ShouldBeEqual()
    {
        var left = {{ValueObjectName}}.From({{ValidFactoryArguments}});
        var right = {{ValueObjectName}}.From({{EquivalentFactoryArguments}});

        left.Should().Be(right);
        (left == right).Should().BeTrue();
    }

    [Fact]
    public void From_WithNormalizationRule_ShouldNormalizeData()
    {
        var result = {{ValueObjectName}}.From({{NonNormalizedFactoryArguments}});

{{NormalizationAssertions}}
    }

    [Fact]
    public void JsonRoundTrip_WithValidInstance_ShouldPreserveValue()
    {
        var source = {{ValueObjectName}}.From({{ValidFactoryArguments}});

        var json = JsonSerializer.Serialize(source);
        var restored = JsonSerializer.Deserialize<{{ValueObjectName}}>(json);

        restored.Should().NotBeNull();
        restored.Should().Be(source);
{{SerializationAssertions}}
    }
}

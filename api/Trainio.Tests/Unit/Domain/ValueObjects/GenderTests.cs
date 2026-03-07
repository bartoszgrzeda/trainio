using System.Text.Json;
using FluentAssertions;
using Trainio.Domain.Common;
using Trainio.Domain.ValueObjects;

namespace Trainio.Tests.Unit.Domain.ValueObjects;

public sealed class GenderTests
{
    [Theory]
    [InlineData("male", "male")]
    [InlineData(" Female ", "female")]
    [InlineData("non binary", "non-binary")]
    [InlineData("Prefer Not To Say", "unspecified")]
    public void From_ShouldNormalizeValue(string input, string expected)
    {
        var result = Gender.From(input);

        result.Value.Should().Be(expected);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("unknown")]
    public void From_ShouldThrow_WhenValueIsInvalid(string input)
    {
        Action act = () => Gender.From(input);

        act.Should().Throw<DomainException>().WithMessage("Gender is invalid.");
    }

    [Fact]
    public void ValueObjects_ShouldBeEqual_WhenValuesAreEqual()
    {
        var left = Gender.From("male");
        var right = Gender.From("m");

        left.Should().Be(right);
    }

    [Fact]
    public void TryFrom_ShouldReturnFalse_WhenValueIsInvalid()
    {
        var result = Gender.TryFrom("invalid", out var gender);

        result.Should().BeFalse();
        gender.Should().BeNull();
    }

    [Fact]
    public void JsonRoundTrip_ShouldKeepTheSameValue()
    {
        var valueObject = Gender.From("female");

        var json = JsonSerializer.Serialize(valueObject);
        var restored = JsonSerializer.Deserialize<Gender>(json);

        json.Should().Be("\"female\"");
        restored.Should().Be(valueObject);
    }
}

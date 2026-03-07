using System.Text.Json;
using FluentAssertions;
using Trainio.Domain.Common;
using Trainio.Domain.ValueObjects;

namespace Trainio.Tests.Unit.Domain.ValueObjects;

public sealed class EmailTests
{
    [Fact]
    public void From_ShouldNormalizeToLowerInvariant()
    {
        var result = Email.From("  JAN.KOWALSKI@Example.COM ");

        result.Value.Should().Be("jan.kowalski@example.com");
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("not-an-email")]
    [InlineData("name@domain")]
    [InlineData("@domain.com")]
    public void From_ShouldThrow_WhenEmailIsInvalid(string input)
    {
        Action act = () => Email.From(input);

        act.Should().Throw<DomainException>().WithMessage("Email is invalid.");
    }

    [Fact]
    public void ValueObjects_ShouldBeEqual_WhenValuesAreEqual()
    {
        var left = Email.From("jan.kowalski@example.com");
        var right = Email.From("JAN.KOWALSKI@EXAMPLE.COM");

        left.Should().Be(right);
    }

    [Fact]
    public void TryFrom_ShouldReturnFalse_WhenValueIsInvalid()
    {
        var result = Email.TryFrom("invalid-email", out var email);

        result.Should().BeFalse();
        email.Should().BeNull();
    }

    [Fact]
    public void JsonRoundTrip_ShouldKeepTheSameValue()
    {
        var valueObject = Email.From("jan.kowalski@example.com");

        var json = JsonSerializer.Serialize(valueObject);
        var restored = JsonSerializer.Deserialize<Email>(json);

        json.Should().Be("\"jan.kowalski@example.com\"");
        restored.Should().Be(valueObject);
    }
}

using System.Text.Json;
using FluentAssertions;
using Trainio.Domain.Common;
using Trainio.Domain.ValueObjects;

namespace Trainio.Tests.Unit.Domain.ValueObjects;

public sealed class PhoneNumberTests
{
    [Fact]
    public void From_ShouldNormalizeToCanonicalInternationalFormat()
    {
        var result = PhoneNumber.From(" +48 (123) 456-789 ");

        result.Value.Should().Be("+48123456789");
    }

    [Fact]
    public void From_ShouldNormalize_WhenInternationalPrefixStartsWithDoubleZero()
    {
        var result = PhoneNumber.From("0048 123 456 789");

        result.Value.Should().Be("+48123456789");
    }

    [Theory]
    [InlineData("")]
    [InlineData("abc")]
    [InlineData("12345")]
    [InlineData("+48 123 45A 789")]
    public void From_ShouldThrow_WhenPhoneNumberIsInvalid(string input)
    {
        Action act = () => PhoneNumber.From(input);

        act.Should().Throw<DomainException>().WithMessage("Phone number is invalid.");
    }

    [Fact]
    public void ValueObjects_ShouldBeEqual_WhenValuesAreEqualAfterNormalization()
    {
        var left = PhoneNumber.From("+48 123 456 789");
        var right = PhoneNumber.From("0048-123-456-789");

        left.Should().Be(right);
    }

    [Fact]
    public void JsonRoundTrip_ShouldKeepTheSameValue()
    {
        var valueObject = PhoneNumber.From("+48 123 456 789");

        var json = JsonSerializer.Serialize(valueObject);
        var restored = JsonSerializer.Deserialize<PhoneNumber>(json);

        json.Should().Be("\"+48123456789\"");
        restored.Should().Be(valueObject);
    }
}

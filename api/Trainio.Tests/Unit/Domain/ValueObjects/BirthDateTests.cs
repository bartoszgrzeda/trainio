using System.Text.Json;
using FluentAssertions;
using Trainio.Domain.Common;
using Trainio.Domain.ValueObjects;

namespace Trainio.Tests.Unit.Domain.ValueObjects;

public sealed class BirthDateTests
{
    [Fact]
    public void From_ShouldCreateValueObject_WhenDateIsValid()
    {
        var result = BirthDate.From(new DateOnly(1995, 7, 17));

        result.Value.Should().Be(new DateOnly(1995, 7, 17));
    }

    [Fact]
    public void From_ShouldThrow_WhenDateIsInvalid()
    {
        var futureDate = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(1);
        Action act = () => BirthDate.From(futureDate);

        act.Should().Throw<DomainException>().WithMessage("Birth date is invalid.");
    }

    [Fact]
    public void ValueObjects_ShouldBeEqual_WhenValuesAreEqual()
    {
        var left = BirthDate.From(new DateOnly(1995, 7, 17));
        var right = BirthDate.From(new DateOnly(1995, 7, 17));

        left.Should().Be(right);
    }

    [Fact]
    public void TryFrom_ShouldReturnFalse_WhenDateIsInvalid()
    {
        var result = BirthDate.TryFrom(default(DateOnly), out var birthDate);

        result.Should().BeFalse();
        birthDate.Should().BeNull();
    }

    [Fact]
    public void JsonRoundTrip_ShouldKeepTheSameValue()
    {
        var valueObject = BirthDate.From(new DateOnly(1995, 7, 17));

        var json = JsonSerializer.Serialize(valueObject);
        var restored = JsonSerializer.Deserialize<BirthDate>(json);

        json.Should().Be("\"1995-07-17\"");
        restored.Should().Be(valueObject);
    }
}

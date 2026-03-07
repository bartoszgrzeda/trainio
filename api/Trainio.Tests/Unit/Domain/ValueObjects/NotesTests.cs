using System.Text.Json;
using FluentAssertions;
using Trainio.Domain.Common;
using Trainio.Domain.ValueObjects;

namespace Trainio.Tests.Unit.Domain.ValueObjects;

public sealed class NotesTests
{
    [Fact]
    public void From_ShouldReturnEmpty_WhenInputIsNull()
    {
        var result = Notes.From(null);

        result.Should().Be(Notes.Empty);
    }

    [Fact]
    public void From_ShouldTrimValue()
    {
        var result = Notes.From("  likes squats  ");

        result.Value.Should().Be("likes squats");
    }

    [Fact]
    public void From_ShouldThrow_WhenNotesAreTooLong()
    {
        var input = new string('a', 2001);
        Action act = () => Notes.From(input);

        act.Should().Throw<DomainException>().WithMessage("Notes are invalid.");
    }

    [Fact]
    public void ValueObjects_ShouldBeEqual_WhenValuesAreEqual()
    {
        var left = Notes.From("  test ");
        var right = Notes.From("test");

        left.Should().Be(right);
    }

    [Fact]
    public void TryFrom_ShouldReturnFalse_WhenNotesAreTooLong()
    {
        var input = new string('a', 2001);
        var result = Notes.TryFrom(input, out var notes);

        result.Should().BeFalse();
        notes.Should().BeNull();
    }

    [Fact]
    public void JsonRoundTrip_ShouldKeepTheSameValue()
    {
        var valueObject = Notes.From("likes deadlifts");

        var json = JsonSerializer.Serialize(valueObject);
        var restored = JsonSerializer.Deserialize<Notes>(json);

        json.Should().Be("\"likes deadlifts\"");
        restored.Should().Be(valueObject);
    }
}

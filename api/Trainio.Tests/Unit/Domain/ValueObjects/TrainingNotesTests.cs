using System.Text.Json;
using FluentAssertions;
using Trainio.Domain.Common;
using Trainio.Domain.ValueObjects;

namespace Trainio.Tests.Unit.Domain.ValueObjects;

public sealed class TrainingNotesTests
{
    [Fact]
    public void From_ShouldReturnEmpty_WhenInputIsNull()
    {
        var result = TrainingNotes.From(null);

        result.Should().Be(TrainingNotes.Empty);
    }

    [Fact]
    public void From_ShouldTrimValue()
    {
        var result = TrainingNotes.From("  Focus on depth\nand tempo  ");

        result.Value.Should().Be("Focus on depth\nand tempo");
    }

    [Fact]
    public void From_ShouldThrow_WhenValueIsTooLong()
    {
        var input = new string('a', 501);
        Action act = () => TrainingNotes.From(input);

        act.Should().Throw<DomainException>().WithMessage("Training notes are invalid.");
    }

    [Fact]
    public void TryFrom_ShouldReturnFalse_WhenValueIsTooLong()
    {
        var input = new string('a', 501);
        var result = TrainingNotes.TryFrom(input, out var notes);

        result.Should().BeFalse();
        notes.Should().BeNull();
    }

    [Fact]
    public void JsonRoundTrip_ShouldKeepTheSameValue()
    {
        var valueObject = TrainingNotes.From("Track breathing pattern");

        var json = JsonSerializer.Serialize(valueObject);
        var restored = JsonSerializer.Deserialize<TrainingNotes>(json);

        json.Should().Be("\"Track breathing pattern\"");
        restored.Should().Be(valueObject);
    }
}

using System.Text.Json;
using FluentAssertions;
using Trainio.Domain.Common;
using Trainio.Domain.Features.Trainings;
using Trainio.Domain.ValueObjects;
using DomainTraining = Trainio.Domain.Features.Trainings.Training;

namespace Trainio.Tests.Unit.Domain.Features.Trainings;

public sealed class TrainingTests
{
    [Fact]
    public void CreatePlanned_ShouldCreateTraining_WhenInputIsValid()
    {
        var clientId = EntityId.From(Guid.NewGuid());
        var startAt = new DateTimeOffset(2026, 3, 14, 11, 0, 0, TimeSpan.FromHours(1));
        var endAt = new DateTimeOffset(2026, 3, 14, 12, 0, 0, TimeSpan.FromHours(1));

        var training = DomainTraining.CreatePlanned(
            clientId,
            startAt,
            endAt,
            TrainingNotes.From("  Focus on technique.  "));

        training.Id.Should().NotBe(Guid.Empty);
        training.ClientId.Should().Be(clientId);
        training.StartAt.Should().Be(startAt);
        training.EndAt.Should().Be(endAt);
        training.Notes.Should().Be(TrainingNotes.From("Focus on technique."));
        training.Status.Should().Be(TrainingStatus.Planned);
    }

    [Fact]
    public void CreatePlanned_ShouldThrow_WhenEndIsNotLaterThanStart()
    {
        var clientId = EntityId.From(Guid.NewGuid());
        var startAt = new DateTimeOffset(2026, 3, 14, 11, 0, 0, TimeSpan.FromHours(1));

        Action act = () => DomainTraining.CreatePlanned(
            clientId,
            startAt,
            startAt,
            TrainingNotes.Empty);

        act.Should().Throw<DomainException>().WithMessage("endAt must be later than startAt.");
    }

    [Fact]
    public void OverlapsWith_ShouldReturnTrue_WhenRangesIntersect()
    {
        var training = DomainTraining.CreatePlanned(
            EntityId.From(Guid.NewGuid()),
            new DateTimeOffset(2026, 3, 14, 10, 0, 0, TimeSpan.FromHours(1)),
            new DateTimeOffset(2026, 3, 14, 11, 0, 0, TimeSpan.FromHours(1)),
            TrainingNotes.Empty);

        var overlaps = training.OverlapsWith(
            new DateTimeOffset(2026, 3, 14, 10, 30, 0, TimeSpan.FromHours(1)),
            new DateTimeOffset(2026, 3, 14, 11, 30, 0, TimeSpan.FromHours(1)));

        overlaps.Should().BeTrue();
    }

    [Fact]
    public void OverlapsWith_ShouldReturnFalse_WhenRangesDoNotIntersect()
    {
        var training = DomainTraining.CreatePlanned(
            EntityId.From(Guid.NewGuid()),
            new DateTimeOffset(2026, 3, 14, 10, 0, 0, TimeSpan.FromHours(1)),
            new DateTimeOffset(2026, 3, 14, 11, 0, 0, TimeSpan.FromHours(1)),
            TrainingNotes.Empty);

        var overlaps = training.OverlapsWith(
            new DateTimeOffset(2026, 3, 14, 11, 0, 0, TimeSpan.FromHours(1)),
            new DateTimeOffset(2026, 3, 14, 12, 0, 0, TimeSpan.FromHours(1)));

        overlaps.Should().BeFalse();
    }

    [Fact]
    public void StartAndFinish_ShouldUpdateStatusAndNotes()
    {
        var training = DomainTraining.CreatePlanned(
            EntityId.From(Guid.NewGuid()),
            new DateTimeOffset(2026, 3, 14, 10, 0, 0, TimeSpan.FromHours(1)),
            new DateTimeOffset(2026, 3, 14, 11, 0, 0, TimeSpan.FromHours(1)),
            TrainingNotes.Empty);

        training.Start();
        training.Finish(TrainingNotes.From("  Great session  "));

        training.Status.Should().Be(TrainingStatus.Finished);
        training.Notes.Should().Be(TrainingNotes.From("Great session"));
    }

    [Fact]
    public void JsonRoundTrip_ShouldPreserveTrainingState()
    {
        var training = DomainTraining.CreatePlanned(
            EntityId.From(Guid.NewGuid()),
            new DateTimeOffset(2026, 3, 14, 10, 0, 0, TimeSpan.FromHours(1)),
            new DateTimeOffset(2026, 3, 14, 11, 0, 0, TimeSpan.FromHours(1)),
            TrainingNotes.From("Consistency first"));

        var json = JsonSerializer.Serialize(training);
        var restored = JsonSerializer.Deserialize<DomainTraining>(json);

        restored.Should().NotBeNull();
        restored!.Id.Should().Be(training.Id);
        restored.ClientId.Should().Be(training.ClientId);
        restored.StartAt.Should().Be(training.StartAt);
        restored.EndAt.Should().Be(training.EndAt);
        restored.Notes.Should().Be(training.Notes);
        restored.Status.Should().Be(training.Status);
    }
}

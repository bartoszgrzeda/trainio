using System.Text.Json;
using FluentAssertions;
using Trainio.Domain.Common;
using Trainio.Domain.Features.PlanTemplates;
using Trainio.Domain.ValueObjects;

namespace Trainio.Tests.Unit.Domain.Features.PlanTemplates;

public sealed class PlanTemplateTests
{
    [Fact]
    public void From_ShouldCreatePlanTemplate_WhenInputIsValid()
    {
        var planTemplate = PlanTemplate.From(
            PlanName.From("  Full Body Starter  "),
            [CreateDay("  Day 1  ", Guid.NewGuid(), 10, 12)]);

        planTemplate.Id.Should().NotBe(Guid.Empty);
        planTemplate.Name.Should().Be(PlanName.From("Full Body Starter"));
        planTemplate.Days.Should().HaveCount(1);
        planTemplate.Days[0].Name.Should().Be(PlanDayName.From("Day 1"));
        planTemplate.Days[0].Exercises.Should().HaveCount(1);
        planTemplate.Days[0].Exercises[0].Series.Select(set => set.RepeatsCount.Value).Should().Equal(10, 12);
    }

    [Fact]
    public void From_ShouldThrow_WhenDaysAreEmpty()
    {
        Action act = () => PlanTemplate.From(PlanName.From("Template"), []);

        act.Should().Throw<DomainException>().WithMessage("days must contain at least one item.");
    }

    [Fact]
    public void Update_ShouldChangeNameAndDays_WhenInputIsValid()
    {
        var planTemplate = PlanTemplate.From(
            PlanName.From("Template"),
            [CreateDay("Day 1", Guid.NewGuid(), 10)]);

        var exerciseId = Guid.NewGuid();
        planTemplate.Update(
            PlanName.From("  Updated Template  "),
            [
                CreateDay("  Day A  ", exerciseId, 6, 8),
                CreateDay("Day B", Guid.NewGuid(), 12),
            ]);

        planTemplate.Name.Should().Be(PlanName.From("Updated Template"));
        planTemplate.Days.Select(day => day.Name.Value).Should().Equal("Day A", "Day B");
        planTemplate.Days[0].Exercises.Single().ExerciseId.Value.Should().Be(exerciseId);
        planTemplate.Days[0].Exercises.Single().Series.Select(set => set.RepeatsCount.Value).Should().Equal(6, 8);
    }

    [Fact]
    public void JsonRoundTrip_ShouldPreservePlanTemplateState()
    {
        var exerciseId = Guid.NewGuid();
        var planTemplate = PlanTemplate.From(
            PlanName.From("Upper Lower"),
            [
                CreateDay("Upper", exerciseId, 10, 8),
                CreateDay("Lower", Guid.NewGuid(), 12),
            ]);

        var json = JsonSerializer.Serialize(planTemplate);
        var restored = JsonSerializer.Deserialize<PlanTemplate>(json);

        restored.Should().NotBeNull();
        restored!.Id.Should().Be(planTemplate.Id);
        restored.Name.Should().Be(planTemplate.Name);
        restored.Days.Select(day => day.Name.Value).Should().Equal("Upper", "Lower");
        restored.Days[0].Exercises.Single().ExerciseId.Should().Be(EntityId.From(exerciseId));
        restored.Days[0].Exercises.Single().Series.Select(set => set.RepeatsCount.Value).Should().Equal(10, 8);
    }

    private static PlanDay CreateDay(string dayName, Guid exerciseId, params int[] repeats)
    {
        return PlanDay.From(
            PlanDayName.From(dayName),
            [
                PlanDayExercise.From(
                    EntityId.From(exerciseId),
                    repeats.Select(value => ExerciseSet.From(RepeatsCount.From(value))).ToArray()),
            ]);
    }
}

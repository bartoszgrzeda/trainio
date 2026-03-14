using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Trainio.Application.Features.PlanTemplates;
using Trainio.Infrastructure.Persistence;
using Trainio.Tests.Common;

namespace Trainio.Tests.Unit.Application.Features;

public sealed class PlanTemplateServiceTests
{
    [Fact]
    public async Task CreateAsync_ShouldPersistPlanTemplate()
    {
        var databaseName = Guid.NewGuid().ToString();
        var root = new InMemoryDatabaseRoot();
        var options = TestDbContextFactory.CreateOptions(databaseName, root);

        using (var context = new TrainioDbContext(options))
        {
            var service = new PlanTemplateService(new RepositoryFactory(context), new UnitOfWork(context));

            await service.CreateAsync(
                new CreatePlanTemplateCommand(
                    "  Push Pull Legs  ",
                    [
                        new PlanTemplateDayCommand(
                            "  Day 1  ",
                            [
                                new PlanTemplateDayExerciseCommand(
                                    Guid.NewGuid(),
                                    0,
                                    [
                                        new PlanTemplateExerciseSetCommand(8),
                                        new PlanTemplateExerciseSetCommand(10),
                                    ]),
                            ]),
                    ]),
                CancellationToken.None);
        }

        using var verificationContext = new TrainioDbContext(options);
        var planTemplates = await verificationContext.PlanTemplates.AsNoTracking().ToListAsync();

        planTemplates.Should().HaveCount(1);
        planTemplates[0].Name.Value.Should().Be("Push Pull Legs");
        planTemplates[0].Days.Should().HaveCount(1);
        planTemplates[0].Days[0].Name.Value.Should().Be("Day 1");
        planTemplates[0].Days[0].Exercises.Should().HaveCount(1);
        planTemplates[0].Days[0].Exercises[0].Order.Should().Be(0);
        planTemplates[0].Days[0].Exercises[0].Series.Select(set => set.RepeatsCount.Value).Should().Equal(8, 10);
    }

    [Fact]
    public async Task ListAsync_ShouldFilterAndSortByName()
    {
        var databaseName = Guid.NewGuid().ToString();
        var root = new InMemoryDatabaseRoot();
        var options = TestDbContextFactory.CreateOptions(databaseName, root);

        using var context = new TrainioDbContext(options);
        var service = new PlanTemplateService(new RepositoryFactory(context), new UnitOfWork(context));

        await service.CreateAsync(CreateCommand("Zeta Split"), CancellationToken.None);
        await service.CreateAsync(CreateCommand("Alpha Split"), CancellationToken.None);
        await service.CreateAsync(CreateCommand("Gamma Plan"), CancellationToken.None);

        var listed = await service.ListAsync("split", CancellationToken.None);

        listed.Select(item => item.Name).Should().Equal("Alpha Split", "Zeta Split");
    }

    [Fact]
    public async Task CreateAsync_ShouldStoreExercisesSortedByOrder()
    {
        var databaseName = Guid.NewGuid().ToString();
        var root = new InMemoryDatabaseRoot();
        var options = TestDbContextFactory.CreateOptions(databaseName, root);

        var firstExerciseId = Guid.NewGuid();
        var secondExerciseId = Guid.NewGuid();

        using (var context = new TrainioDbContext(options))
        {
            var service = new PlanTemplateService(new RepositoryFactory(context), new UnitOfWork(context));

            await service.CreateAsync(
                new CreatePlanTemplateCommand(
                    "Ordered Template",
                    [
                        new PlanTemplateDayCommand(
                            "Day 1",
                            [
                                new PlanTemplateDayExerciseCommand(
                                    firstExerciseId,
                                    1,
                                    [new PlanTemplateExerciseSetCommand(8)]),
                                new PlanTemplateDayExerciseCommand(
                                    secondExerciseId,
                                    0,
                                    [new PlanTemplateExerciseSetCommand(10)]),
                            ]),
                    ]),
                CancellationToken.None);
        }

        using var verificationContext = new TrainioDbContext(options);
        var stored = await verificationContext.PlanTemplates.AsNoTracking().SingleAsync();

        stored.Days[0].Exercises.Select(exercise => exercise.Order).Should().Equal(0, 1);
        stored.Days[0].Exercises.Select(exercise => exercise.ExerciseId.Value)
            .Should()
            .Equal(secondExerciseId, firstExerciseId);
    }

    [Fact]
    public async Task UpdateAsync_ShouldReturnNull_WhenPlanTemplateDoesNotExist()
    {
        var databaseName = Guid.NewGuid().ToString();
        var root = new InMemoryDatabaseRoot();
        var options = TestDbContextFactory.CreateOptions(databaseName, root);

        using var context = new TrainioDbContext(options);
        var service = new PlanTemplateService(new RepositoryFactory(context), new UnitOfWork(context));

        var result = await service.UpdateAsync(
            new UpdatePlanTemplateCommand(Guid.NewGuid(), "Name", CreateDays()),
            CancellationToken.None);

        result.Should().BeNull();
    }

    private static CreatePlanTemplateCommand CreateCommand(string name)
    {
        return new CreatePlanTemplateCommand(name, CreateDays());
    }

    private static IReadOnlyList<PlanTemplateDayCommand> CreateDays()
    {
        return
        [
            new PlanTemplateDayCommand(
                "Day 1",
                [
                    new PlanTemplateDayExerciseCommand(
                        Guid.NewGuid(),
                        0,
                        [
                            new PlanTemplateExerciseSetCommand(10),
                        ]),
                ]),
        ];
    }
}

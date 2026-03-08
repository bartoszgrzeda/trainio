using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Trainio.Application.Common;
using Trainio.Application.Features.Clients;
using Trainio.Application.Features.Exercises;
using Trainio.Application.Features.Profile;
using Trainio.Domain.Features.Exercises;
using Trainio.Domain.ValueObjects;
using Trainio.Infrastructure.Persistence;
using Trainio.Tests.Common;

namespace Trainio.Tests.Unit.Application.Features;

public sealed class ClientServiceTests
{
    [Fact]
    public async Task CreateAsync_ShouldPersistClient()
    {
        var databaseName = Guid.NewGuid().ToString();
        var root = new InMemoryDatabaseRoot();
        var options = TestDbContextFactory.CreateOptions(databaseName, root);

        using (var context = new TrainioDbContext(options))
        {
            var service = new ClientService(new RepositoryFactory(context), new UnitOfWork(context));

            await service.CreateAsync(
                new CreateClientCommand(
                    "Anna",
                    "Kowalska",
                    new DateOnly(1992, 3, 15),
                    "+48123456789",
                    "female",
                    "Notes"),
                CancellationToken.None);
        }

        using var verificationContext = new TrainioDbContext(options);
        var clients = await verificationContext.Clients.AsNoTracking().ToListAsync();

        clients.Should().HaveCount(1);
        clients[0].FirstName.Value.Should().Be("Anna");
        clients[0].LastName.Value.Should().Be("Kowalska");
    }

    [Fact]
    public async Task ListAsync_ShouldFilterAndSortByLastThenFirstName()
    {
        var databaseName = Guid.NewGuid().ToString();
        var root = new InMemoryDatabaseRoot();
        var options = TestDbContextFactory.CreateOptions(databaseName, root);

        using var context = new TrainioDbContext(options);
        var service = new ClientService(new RepositoryFactory(context), new UnitOfWork(context));

        await service.CreateAsync(
            new CreateClientCommand(
                "Zoe",
                "Nowak",
                new DateOnly(1990, 1, 1),
                "+48111000000",
                "female",
                string.Empty),
            CancellationToken.None);

        await service.CreateAsync(
            new CreateClientCommand(
                "Adam",
                "Nowak",
                new DateOnly(1991, 1, 1),
                "+48222000000",
                "male",
                string.Empty),
            CancellationToken.None);

        await service.CreateAsync(
            new CreateClientCommand(
                "Ewa",
                "Kowalska",
                new DateOnly(1993, 1, 1),
                "+48333000000",
                "non-binary",
                string.Empty),
            CancellationToken.None);

        var clients = await service.ListAsync("nowak", CancellationToken.None);

        clients.Select(client => client.FullName)
            .Should()
            .Equal("Adam Nowak", "Zoe Nowak");
    }
}

public sealed class ExerciseServiceTests
{
    [Fact]
    public async Task CreateAsync_ShouldRejectDuplicateCustomName()
    {
        var databaseName = Guid.NewGuid().ToString();
        var root = new InMemoryDatabaseRoot();
        var options = TestDbContextFactory.CreateOptions(databaseName, root);

        using var context = new TrainioDbContext(options);
        var repositoryFactory = new RepositoryFactory(context);
        var unitOfWork = new UnitOfWork(context);
        var repository = repositoryFactory.Get<Exercise>();

        await repository.AddAsync(Exercise.From(ExerciseName.From("Push Up")), CancellationToken.None);
        await unitOfWork.SaveChangesAsync(CancellationToken.None);

        var service = new ExerciseService(repositoryFactory, unitOfWork);

        Func<Task> act = async () =>
            await service.CreateAsync(new CreateExerciseCommand("  push up  "), CancellationToken.None);

        await act
            .Should()
            .ThrowAsync<ApplicationLayerException>()
            .WithMessage("Custom exercise with this name already exists.");
    }

    [Fact]
    public async Task ListAsync_ShouldRespectIncludeSeededAndQuery()
    {
        var databaseName = Guid.NewGuid().ToString();
        var root = new InMemoryDatabaseRoot();
        var options = TestDbContextFactory.CreateOptions(databaseName, root);

        using var context = new TrainioDbContext(options);
        var repositoryFactory = new RepositoryFactory(context);
        var unitOfWork = new UnitOfWork(context);
        var repository = repositoryFactory.Get<Exercise>();

        await repository.AddAsync(Exercise.From(ExerciseName.From("Bench Press")), CancellationToken.None);
        await repository.AddAsync(Exercise.From(ExerciseName.From("Biceps Curl")), CancellationToken.None);
        await repository.AddAsync(Exercise.CreateSeeded(ExerciseName.From("Bench Jump")), CancellationToken.None);
        await unitOfWork.SaveChangesAsync(CancellationToken.None);

        var service = new ExerciseService(repositoryFactory, unitOfWork);

        var customOnly = await service.ListAsync("bench", includeSeeded: false, CancellationToken.None);
        var withSeeded = await service.ListAsync("bench", includeSeeded: true, CancellationToken.None);

        customOnly.Select(exercise => exercise.Name).Should().Equal("Bench Press");
        withSeeded.Select(exercise => exercise.Name).Should().Equal("Bench Jump", "Bench Press");
    }
}

public sealed class ProfileServiceTests
{
    [Fact]
    public async Task GetAsync_ShouldReturnEmptyDto_WhenProfileIsMissing()
    {
        var databaseName = Guid.NewGuid().ToString();
        var root = new InMemoryDatabaseRoot();
        var options = TestDbContextFactory.CreateOptions(databaseName, root);

        using var context = new TrainioDbContext(options);
        var service = new ProfileService(new RepositoryFactory(context), new UnitOfWork(context));

        var profile = await service.GetAsync(CancellationToken.None);

        profile.Should().Be(new ProfileDto(Guid.Empty, string.Empty, string.Empty, string.Empty, string.Empty));
    }

    [Fact]
    public async Task UpdateAsync_ShouldCreateThenUpdateSingleProfile()
    {
        var databaseName = Guid.NewGuid().ToString();
        var root = new InMemoryDatabaseRoot();
        var options = TestDbContextFactory.CreateOptions(databaseName, root);

        ProfileDto created;
        using (var createContext = new TrainioDbContext(options))
        {
            var createService = new ProfileService(new RepositoryFactory(createContext), new UnitOfWork(createContext));
            created = await createService.UpdateAsync(
                new UpdateProfileCommand("Anna", "Nowak", "anna@example.com", "+48123456789"),
                CancellationToken.None);
        }

        ProfileDto updated;
        using (var updateContext = new TrainioDbContext(options))
        {
            var updateService = new ProfileService(new RepositoryFactory(updateContext), new UnitOfWork(updateContext));
            updated = await updateService.UpdateAsync(
                new UpdateProfileCommand("Jan", "Nowak", "jan@example.com", "+48987654321"),
                CancellationToken.None);
        }

        updated.Id.Should().Be(created.Id);
        updated.FirstName.Should().Be("Jan");
        updated.Email.Should().Be("jan@example.com");

        using var verificationContext = new TrainioDbContext(options);
        var profiles = await verificationContext.Profiles.AsNoTracking().ToListAsync();

        profiles.Should().HaveCount(1);
        profiles[0].Id.Should().Be(created.Id);
        profiles[0].FirstName.Value.Should().Be("Jan");
        profiles[0].Email.Value.Should().Be("jan@example.com");
    }
}

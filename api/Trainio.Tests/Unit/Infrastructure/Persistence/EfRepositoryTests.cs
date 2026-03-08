using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Trainio.Domain.Features.Exercises;
using Trainio.Domain.ValueObjects;
using Trainio.Infrastructure.Persistence;
using Trainio.Tests.Common;

namespace Trainio.Tests.Unit.Infrastructure.Persistence;

public sealed class EfRepositoryTests
{
    [Fact]
    public async Task RepositoryAndUnitOfWork_ShouldSupportCrudAndQueryMethods()
    {
        var databaseName = Guid.NewGuid().ToString();
        var root = new InMemoryDatabaseRoot();
        var options = TestDbContextFactory.CreateOptions(databaseName, root);

        using var context = new TrainioDbContext(options);
        var factory = new RepositoryFactory(context);
        var unitOfWork = new UnitOfWork(context);
        var repository = factory.Get<Exercise>();

        var squat = Exercise.From(ExerciseName.From("Back Squat"));
        var bench = Exercise.CreateSeeded(ExerciseName.From("Bench Press"));

        await repository.AddAsync(squat, CancellationToken.None);
        await repository.AddAsync(bench, CancellationToken.None);
        await unitOfWork.SaveChangesAsync(CancellationToken.None);

        var byId = await repository.GetByIdAsync(squat.Id, CancellationToken.None);
        var all = await repository.GetAllAsync(CancellationToken.None);
        var query = await repository.GetByQueryAsync(
            exercise => exercise.ExerciseName.Value.ToLower().Contains("squat"),
            CancellationToken.None);
        var exists = await repository.ExistsByQueryAsync(
            exercise => exercise.Source == ExerciseSource.Seeded &&
                        exercise.ExerciseName.Value.ToLower() == "bench press",
            CancellationToken.None);

        byId.Should().NotBeNull();
        byId!.Id.Should().Be(squat.Id);
        all.Should().HaveCount(2);
        query.Should().ContainSingle(exercise => exercise.Id == squat.Id);
        exists.Should().BeTrue();

        squat.Update(ExerciseName.From("Front Squat"));
        repository.Update(squat);
        repository.Delete(bench);
        await unitOfWork.SaveChangesAsync(CancellationToken.None);

        using var verificationContext = new TrainioDbContext(options);
        var verificationRepository = new RepositoryFactory(verificationContext).Get<Exercise>();
        var updated = await verificationRepository.GetByIdAsync(squat.Id, CancellationToken.None);
        var deleted = await verificationRepository.GetByIdAsync(bench.Id, CancellationToken.None);

        updated.Should().NotBeNull();
        updated!.ExerciseName.Value.Should().Be("Front Squat");
        deleted.Should().BeNull();
    }
}

using Microsoft.EntityFrameworkCore;
using Trainio.Application.Features.Exercises;
using Trainio.Domain.Features.Exercises;
using Trainio.Infrastructure.Persistence;

namespace Trainio.Infrastructure.Features.Exercises;

public sealed class ExerciseRepository : IExerciseRepository
{
    private readonly TrainioDbContext _dbContext;

    public ExerciseRepository(TrainioDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(Exercise exercise, CancellationToken cancellationToken)
    {
        await _dbContext.Exercises.AddAsync(exercise, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> ExistsCustomByNameAsync(string name, CancellationToken cancellationToken)
    {
        var normalizedName = name.Trim().ToLowerInvariant();

        return await _dbContext.Exercises.AnyAsync(exercise =>
            exercise.Source == ExerciseSource.Custom &&
            exercise.Name.ToLower() == normalizedName,
            cancellationToken);
    }

    public async Task<IReadOnlyList<Exercise>> ListAsync(
        string? query,
        bool includeSeeded,
        CancellationToken cancellationToken)
    {
        var normalizedQuery = query?.Trim();

        var exercisesQuery = _dbContext.Exercises.AsNoTracking();

        if (!includeSeeded)
        {
            exercisesQuery = exercisesQuery.Where(exercise => exercise.Source == ExerciseSource.Custom);
        }

        if (!string.IsNullOrWhiteSpace(normalizedQuery))
        {
            var value = normalizedQuery.ToLowerInvariant();
            exercisesQuery = exercisesQuery.Where(exercise => exercise.Name.ToLower().Contains(value));
        }

        return await exercisesQuery
            .OrderBy(exercise => exercise.Name)
            .ToListAsync(cancellationToken);
    }
}

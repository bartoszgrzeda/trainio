using Trainio.Domain.Features.Exercises;

namespace Trainio.Application.Features.Exercises;

public interface IExerciseRepository
{
    Task AddAsync(Exercise exercise, CancellationToken cancellationToken);

    Task<bool> ExistsCustomByNameAsync(string name, CancellationToken cancellationToken);

    Task<IReadOnlyList<Exercise>> ListAsync(string? query, bool includeSeeded, CancellationToken cancellationToken);
}

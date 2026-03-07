namespace Trainio.Application.Features.Exercises;

public interface IExerciseService
{
    Task<ExerciseDto> CreateAsync(CreateExerciseCommand command, CancellationToken cancellationToken);

    Task<IReadOnlyList<ExerciseDto>> ListAsync(string? query, bool includeSeeded, CancellationToken cancellationToken);
}

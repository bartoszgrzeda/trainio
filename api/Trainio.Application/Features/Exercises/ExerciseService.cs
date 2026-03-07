using Trainio.Application.Common;
using Trainio.Domain.Features.Exercises;

namespace Trainio.Application.Features.Exercises;

public sealed class ExerciseService : IExerciseService
{
    private readonly IExerciseRepository _exerciseRepository;

    public ExerciseService(IExerciseRepository exerciseRepository)
    {
        _exerciseRepository = exerciseRepository;
    }

    public async Task<ExerciseDto> CreateAsync(CreateExerciseCommand command, CancellationToken cancellationToken)
    {
        if (await _exerciseRepository.ExistsCustomByNameAsync(command.Name, cancellationToken))
        {
            throw new ApplicationLayerException("Custom exercise with this name already exists.");
        }

        var exercise = Exercise.CreateCustom(command.Name);

        await _exerciseRepository.AddAsync(exercise, cancellationToken);

        return new ExerciseDto(exercise.Id, exercise.Name, exercise.Source);
    }

    public async Task<IReadOnlyList<ExerciseDto>> ListAsync(string? query, bool includeSeeded, CancellationToken cancellationToken)
    {
        var exercises = await _exerciseRepository.ListAsync(query, includeSeeded, cancellationToken);

        return exercises
            .Select(exercise => new ExerciseDto(exercise.Id, exercise.Name, exercise.Source))
            .ToArray();
    }
}

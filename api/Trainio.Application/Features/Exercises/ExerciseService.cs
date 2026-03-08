using Trainio.Application.Common;
using Trainio.Application.Common.Persistence;
using Trainio.Domain.Features.Exercises;
using Trainio.Domain.ValueObjects;

namespace Trainio.Application.Features.Exercises;

public sealed class ExerciseService : IExerciseService
{
    private readonly IRepository<Exercise> _exerciseRepository;
    private readonly IUnitOfWork _unitOfWork;

    public ExerciseService(IRepositoryFactory repositoryFactory, IUnitOfWork unitOfWork)
    {
        _exerciseRepository = repositoryFactory.Get<Exercise>();
        _unitOfWork = unitOfWork;
    }

    public async Task<ExerciseDto> CreateAsync(CreateExerciseCommand command, CancellationToken cancellationToken)
    {
        var exerciseName = ExerciseName.From(command.Name);

        var normalizedName = exerciseName.Value.Trim().ToLowerInvariant();
        if (await _exerciseRepository.ExistsByQueryAsync(
                exercise => exercise.Source == ExerciseSource.Custom &&
                            exercise.ExerciseName.Value.ToLower() == normalizedName,
                cancellationToken))
        {
            throw new ApplicationLayerException("Custom exercise with this name already exists.");
        }

        var exercise = Exercise.From(exerciseName);

        await _exerciseRepository.AddAsync(exercise, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new ExerciseDto(exercise.Id, exercise.ExerciseName.Value, exercise.Source);
    }

    public async Task<IReadOnlyList<ExerciseDto>> ListAsync(string? query, bool includeSeeded, CancellationToken cancellationToken)
    {
        var normalizedQuery = query?.Trim();
        var hasQuery = !string.IsNullOrWhiteSpace(normalizedQuery);
        var normalizedValue = normalizedQuery?.ToLowerInvariant();

        IReadOnlyList<Exercise> exercises;
        if (!hasQuery && includeSeeded)
        {
            exercises = await _exerciseRepository.GetAllAsync(cancellationToken);
        }
        else if (!hasQuery)
        {
            exercises = await _exerciseRepository.GetByQueryAsync(
                exercise => exercise.Source == ExerciseSource.Custom,
                cancellationToken);
        }
        else if (includeSeeded)
        {
            exercises = await _exerciseRepository.GetByQueryAsync(
                exercise => exercise.ExerciseName.Value.ToLower().Contains(normalizedValue!),
                cancellationToken);
        }
        else
        {
            exercises = await _exerciseRepository.GetByQueryAsync(
                exercise => exercise.Source == ExerciseSource.Custom &&
                            exercise.ExerciseName.Value.ToLower().Contains(normalizedValue!),
                cancellationToken);
        }

        return exercises
            .OrderBy(exercise => exercise.ExerciseName.Value)
            .Select(exercise => new ExerciseDto(exercise.Id, exercise.ExerciseName.Value, exercise.Source))
            .ToArray();
    }
}

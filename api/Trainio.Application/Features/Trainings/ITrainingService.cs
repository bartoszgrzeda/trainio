namespace Trainio.Application.Features.Trainings;

public interface ITrainingService
{
    Task<TrainingsHomeDto> GetHomeAsync(
        DateOnly date,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<TrainingWarningDto>> CheckWarningsAsync(
        CheckTrainingWarningsCommand command,
        CancellationToken cancellationToken);

    Task<TrainingDto> CreateAsync(
        CreateTrainingCommand command,
        CancellationToken cancellationToken);
}

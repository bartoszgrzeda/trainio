using Trainio.Domain.Features.Exercises;

namespace Trainio.Application.Features.Exercises;

public sealed record CreateExerciseCommand(string Name);

public sealed record ExerciseDto(Guid Id, string Name, ExerciseSource Source);

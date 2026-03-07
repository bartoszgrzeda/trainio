using Trainio.Domain.Common;

namespace Trainio.Domain.Features.Exercises;

public sealed class Exercise
{
    private Exercise()
    {
        Name = string.Empty;
    }

    private Exercise(Guid id, string name, ExerciseSource source)
    {
        Id = id;
        Name = name;
        Source = source;
    }

    public Guid Id { get; private set; }

    public string Name { get; private set; }

    public ExerciseSource Source { get; private set; }

    public static Exercise CreateCustom(string name)
    {
        return new Exercise(Guid.NewGuid(), RequireName(name), ExerciseSource.Custom);
    }

    public static Exercise CreateSeeded(string name)
    {
        return new Exercise(Guid.NewGuid(), RequireName(name), ExerciseSource.Seeded);
    }

    private static string RequireName(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new DomainException("Exercise name is required.");
        }

        return value.Trim();
    }
}

namespace Trainio.Domain.Common;

public abstract class BaseEntity
{
    public Guid Id { get; private set; }

    protected BaseEntity(Guid id)
    {
        Id = id;
    }

    protected BaseEntity()
    {
        Id = Guid.NewGuid();
    }
}

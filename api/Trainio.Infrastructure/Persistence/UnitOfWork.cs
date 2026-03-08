using Trainio.Application.Common.Persistence;

namespace Trainio.Infrastructure.Persistence;

public sealed class UnitOfWork : IUnitOfWork
{
    private readonly TrainioDbContext _dbContext;

    public UnitOfWork(TrainioDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return _dbContext.SaveChangesAsync(cancellationToken);
    }
}

using Trainio.Application.Common.Persistence;
using Trainio.Domain.Common;

namespace Trainio.Infrastructure.Persistence;

public sealed class RepositoryFactory : IRepositoryFactory
{
    private readonly TrainioDbContext _dbContext;

    public RepositoryFactory(TrainioDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public IRepository<TEntity> Get<TEntity>()
        where TEntity : BaseEntity
    {
        return new EfRepository<TEntity>(_dbContext);
    }
}

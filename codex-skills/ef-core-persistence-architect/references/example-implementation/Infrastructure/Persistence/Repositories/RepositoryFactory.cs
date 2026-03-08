using ExampleCompany.ExampleProduct.Domain.Entities;

namespace ExampleCompany.ExampleProduct.Infrastructure.Persistence.Repositories;

public sealed class RepositoryFactory : IRepositoryFactory
{
    private readonly AppDbContext _dbContext;

    public RepositoryFactory(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public IRepository<T> Get<T>()
        where T : Entity
    {
        return new EfRepository<T>(_dbContext);
    }
}

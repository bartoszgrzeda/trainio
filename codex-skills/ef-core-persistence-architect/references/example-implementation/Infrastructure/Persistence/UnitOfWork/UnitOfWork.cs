using ExampleCompany.ExampleProduct.Infrastructure.Persistence.UnitOfWork;
using System.Threading;
using System.Threading.Tasks;

namespace ExampleCompany.ExampleProduct.Infrastructure.Persistence;

public sealed class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _dbContext;

    public UnitOfWork(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return _dbContext.SaveChangesAsync(cancellationToken);
    }
}

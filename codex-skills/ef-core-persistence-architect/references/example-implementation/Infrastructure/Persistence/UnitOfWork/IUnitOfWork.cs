using System.Threading;
using System.Threading.Tasks;

namespace ExampleCompany.ExampleProduct.Infrastructure.Persistence.UnitOfWork;

public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

using ExampleCompany.ExampleProduct.Domain.Entities;

namespace ExampleCompany.ExampleProduct.Infrastructure.Persistence.Repositories;

public interface IRepositoryFactory
{
    IRepository<T> Get<T>()
        where T : Entity;
}

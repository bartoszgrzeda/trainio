using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using ExampleCompany.ExampleProduct.Domain.Entities;

namespace ExampleCompany.ExampleProduct.Infrastructure.Persistence.Repositories;

public interface IRepository<T> where T : Entity
{
    Task<T?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<T>> GetAllAsync(
        CancellationToken cancellationToken);

    Task<IReadOnlyList<T>> GetByQueryAsync(
        Expression<Func<T, bool>> predicate,
        CancellationToken cancellationToken);

    Task<bool> ExistsByQueryAsync(
        Expression<Func<T, bool>> predicate,
        CancellationToken cancellationToken);

    Task AddAsync(
        T entity,
        CancellationToken cancellationToken);

    void Update(T entity);

    void Delete(T entity);
}

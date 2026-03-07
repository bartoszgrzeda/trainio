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
        CancellationToken cancellationToken = default);

    Task<T?> GetByQueryAsync(
        Expression<Func<T, bool>> predicate,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<T>> GetAllAsync(
        CancellationToken cancellationToken = default);

    Task UpdateAsync(
        T entity,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        T entity,
        CancellationToken cancellationToken = default);
}

public interface IPagedRepository<T> where T : Entity
{
    Task<IReadOnlyList<T>> GetPagedAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
}

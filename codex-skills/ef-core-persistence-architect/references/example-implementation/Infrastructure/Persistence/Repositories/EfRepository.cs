using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using ExampleCompany.ExampleProduct.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ExampleCompany.ExampleProduct.Infrastructure.Persistence.Repositories;

public sealed class EfRepository<T> : IRepository<T> where T : Entity
{
    private readonly DbSet<T> _dbSet;

    public EfRepository(AppDbContext dbContext)
    {
        _dbSet = dbContext.Set<T>();
    }

    public async Task<T?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken)
    {
        return await _dbSet
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<T>> GetAllAsync(
        CancellationToken cancellationToken)
    {
        return await _dbSet
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<T>> GetByQueryAsync(
        Expression<Func<T, bool>> predicate,
        CancellationToken cancellationToken)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(predicate)
            .ToListAsync(cancellationToken);
    }

    public Task<bool> ExistsByQueryAsync(
        Expression<Func<T, bool>> predicate,
        CancellationToken cancellationToken)
    {
        return _dbSet
            .AsNoTracking()
            .AnyAsync(predicate, cancellationToken);
    }

    public Task AddAsync(
        T entity,
        CancellationToken cancellationToken)
    {
        return _dbSet.AddAsync(entity, cancellationToken).AsTask();
    }

    public void Update(T entity)
    {
        _dbSet.Update(entity);
    }

    public void Delete(T entity)
    {
        _dbSet.Remove(entity);
    }
}

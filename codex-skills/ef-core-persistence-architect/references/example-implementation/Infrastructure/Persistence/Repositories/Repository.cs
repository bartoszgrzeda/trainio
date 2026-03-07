using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using ExampleCompany.ExampleProduct.Domain.Entities;
using ExampleCompany.ExampleProduct.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExampleCompany.ExampleProduct.Infrastructure.Persistence.Repositories;

public class Repository<T> : IRepository<T>, IPagedRepository<T> where T : Entity
{
    private readonly AppDbContext _dbContext;
    private readonly DbSet<T> _dbSet;

    public Repository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
        _dbSet = dbContext.Set<T>();
    }

    public async Task<T?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<T?> GetByQueryAsync(
        Expression<Func<T, bool>> predicate,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AsNoTracking()
            .FirstOrDefaultAsync(predicate, cancellationToken);
    }

    public async Task<IReadOnlyList<T>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public Task UpdateAsync(
        T entity,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var entry = _dbContext.Entry(entity);
        if (entry.State == EntityState.Detached)
        {
            _dbSet.Attach(entity);
        }

        entry.State = EntityState.Modified;
        return Task.CompletedTask;
    }

    public Task DeleteAsync(
        T entity,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        _dbSet.Remove(entity);
        return Task.CompletedTask;
    }

    public async Task<IReadOnlyList<T>> GetPagedAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        if (page <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(page), "Page must be greater than 0.");
        }

        if (pageSize <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(pageSize), "Page size must be greater than 0.");
        }

        var skip = (page - 1) * pageSize;

        return await _dbSet
            .AsNoTracking()
            .Skip(skip)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }
}

using System.Linq.Expressions;
using Trainio.Domain.Common;

namespace Trainio.Application.Common.Persistence;

public interface IRepository<TEntity>
    where TEntity : BaseEntity
{
    Task<TEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken);

    Task<IReadOnlyList<TEntity>> GetAllAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<TEntity>> GetByQueryAsync(
        Expression<Func<TEntity, bool>> predicate,
        CancellationToken cancellationToken);

    Task<bool> ExistsByQueryAsync(
        Expression<Func<TEntity, bool>> predicate,
        CancellationToken cancellationToken);

    Task AddAsync(TEntity entity, CancellationToken cancellationToken);

    void Update(TEntity entity);

    void Delete(TEntity entity);
}

using Trainio.Domain.Common;

namespace Trainio.Application.Common.Persistence;

public interface IRepositoryFactory
{
    IRepository<TEntity> Get<TEntity>()
        where TEntity : BaseEntity;
}

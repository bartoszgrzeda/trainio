using Trainio.Domain.Features.Profile;

namespace Trainio.Application.Features.Profile;

public interface IProfileRepository
{
    Task<UserProfile?> GetAsync(CancellationToken cancellationToken);

    Task SaveAsync(UserProfile profile, CancellationToken cancellationToken);
}

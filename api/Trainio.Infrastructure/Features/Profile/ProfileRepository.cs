using Microsoft.EntityFrameworkCore;
using Trainio.Application.Features.Profile;
using Trainio.Domain.Features.Profile;
using Trainio.Infrastructure.Persistence;

namespace Trainio.Infrastructure.Features.Profile;

public sealed class ProfileRepository : IProfileRepository
{
    private readonly TrainioDbContext _dbContext;

    public ProfileRepository(TrainioDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<UserProfile?> GetAsync(CancellationToken cancellationToken)
    {
        return _dbContext.Profiles.SingleOrDefaultAsync(cancellationToken);
    }

    public async Task SaveAsync(UserProfile profile, CancellationToken cancellationToken)
    {
        var entry = _dbContext.Entry(profile);
        if (entry.State == EntityState.Detached)
        {
            var exists = await _dbContext
                .Profiles
                .AsNoTracking()
                .AnyAsync(x => x.Id == profile.Id, cancellationToken);

            if (exists)
            {
                _dbContext.Profiles.Update(profile);
            }
            else
            {
                await _dbContext.Profiles.AddAsync(profile, cancellationToken);
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}

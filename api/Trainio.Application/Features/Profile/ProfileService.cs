using Trainio.Domain.Features.Profile;

namespace Trainio.Application.Features.Profile;

public sealed class ProfileService : IProfileService
{
    private readonly IProfileRepository _profileRepository;

    public ProfileService(IProfileRepository profileRepository)
    {
        _profileRepository = profileRepository;
    }

    public async Task<UserProfileDto> GetAsync(CancellationToken cancellationToken)
    {
        var profile = await GetOrCreateAsync(cancellationToken);

        return ToDto(profile);
    }

    public async Task<UserProfileDto> UpdateAsync(UpdateProfileCommand command, CancellationToken cancellationToken)
    {
        var profile = await GetOrCreateAsync(cancellationToken);
        profile.Update(command.FirstName, command.LastName, command.Email, command.PhoneNumber);

        await _profileRepository.SaveAsync(profile, cancellationToken);

        return ToDto(profile);
    }

    private async Task<UserProfile> GetOrCreateAsync(CancellationToken cancellationToken)
    {
        var existing = await _profileRepository.GetAsync(cancellationToken);
        if (existing is not null)
        {
            return existing;
        }

        var profile = UserProfile.CreateDefault();
        await _profileRepository.SaveAsync(profile, cancellationToken);

        return profile;
    }

    private static UserProfileDto ToDto(UserProfile profile)
    {
        return new UserProfileDto(profile.Id, profile.FirstName, profile.LastName, profile.Email, profile.PhoneNumber);
    }
}

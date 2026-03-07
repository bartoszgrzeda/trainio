namespace Trainio.Application.Features.Profile;

public interface IProfileService
{
    Task<UserProfileDto> GetAsync(CancellationToken cancellationToken);

    Task<UserProfileDto> UpdateAsync(UpdateProfileCommand command, CancellationToken cancellationToken);
}

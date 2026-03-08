namespace Trainio.Application.Features.Profile;

public interface IProfileService
{
    Task<ProfileDto> GetAsync(CancellationToken cancellationToken);

    Task<ProfileDto> UpdateAsync(UpdateProfileCommand command, CancellationToken cancellationToken);
}

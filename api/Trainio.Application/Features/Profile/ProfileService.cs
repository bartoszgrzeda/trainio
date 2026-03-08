using Trainio.Application.Common.Persistence;
using Trainio.Domain.Features.Profile;
using Trainio.Domain.ValueObjects;
using DomainProfile = Trainio.Domain.Features.Profile.Profile;

namespace Trainio.Application.Features.Profile;

public sealed class ProfileService : IProfileService
{
    private readonly IRepository<DomainProfile> _profileRepository;
    private readonly IUnitOfWork _unitOfWork;

    public ProfileService(IRepositoryFactory repositoryFactory, IUnitOfWork unitOfWork)
    {
        _profileRepository = repositoryFactory.Get<DomainProfile>();
        _unitOfWork = unitOfWork;
    }

    public async Task<ProfileDto> GetAsync(CancellationToken cancellationToken)
    {
        var profile = (await _profileRepository.GetAllAsync(cancellationToken)).SingleOrDefault();
        if (profile is null)
        {
            return new ProfileDto(Guid.Empty, string.Empty, string.Empty, string.Empty, string.Empty);
        }

        return ToDto(profile);
    }

    public async Task<ProfileDto> UpdateAsync(UpdateProfileCommand command, CancellationToken cancellationToken)
    {
        var firstName = FirstName.From(command.FirstName);
        var lastName = LastName.From(command.LastName);
        var email = Email.From(command.Email);
        var phoneNumber = PhoneNumber.From(command.PhoneNumber);

        var profile = (await _profileRepository.GetAllAsync(cancellationToken)).SingleOrDefault();
        if (profile is null)
        {
            profile = DomainProfile.From(firstName, lastName, email, phoneNumber);
            await _profileRepository.AddAsync(profile, cancellationToken);
        }
        else
        {
            profile.Update(firstName, lastName, email, phoneNumber);
            _profileRepository.Update(profile);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ToDto(profile);
    }

    private static ProfileDto ToDto(DomainProfile profile)
    {
        return new ProfileDto(
            profile.Id,
            profile.FirstName.Value,
            profile.LastName.Value,
            profile.Email.Value,
            profile.PhoneNumber.Value);
    }
}

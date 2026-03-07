namespace Trainio.Application.Features.Profile;

public sealed record UpdateProfileCommand(string FirstName, string LastName, string Email, string PhoneNumber);

public sealed record UserProfileDto(Guid Id, string FirstName, string LastName, string Email, string PhoneNumber);

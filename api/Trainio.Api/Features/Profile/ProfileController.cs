using Microsoft.AspNetCore.Mvc;
using Trainio.Application.Features.Profile;

namespace Trainio.Api.Features.Profile;

[ApiController]
[Route("api/[controller]")]
public sealed class ProfileController : ControllerBase
{
    private readonly IProfileService _profileService;

    public ProfileController(IProfileService profileService)
    {
        _profileService = profileService;
    }

    [HttpGet("get")]
    [ProducesResponseType(typeof(ProfileResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ProfileResponse>> GetAsync(CancellationToken cancellationToken)
    {
        var profile = await _profileService.GetAsync(cancellationToken);

        return Ok(new ProfileResponse(
            profile.Id,
            profile.FirstName,
            profile.LastName,
            profile.Email,
            profile.PhoneNumber));
    }

    [HttpPost("update")]
    [ProducesResponseType(typeof(ProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ProfileResponse>> UpdateAsync(
        [FromBody] UpdateProfileRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var profile = await _profileService.UpdateAsync(
            new UpdateProfileCommand(request.FirstName, request.LastName, request.Email, request.PhoneNumber),
            cancellationToken);

        return Ok(new ProfileResponse(
            profile.Id,
            profile.FirstName,
            profile.LastName,
            profile.Email,
            profile.PhoneNumber));
    }
}

public sealed record UpdateProfileRequest(string FirstName, string LastName, string Email, string PhoneNumber);

public sealed record ProfileResponse(Guid Id, string FirstName, string LastName, string Email, string PhoneNumber);

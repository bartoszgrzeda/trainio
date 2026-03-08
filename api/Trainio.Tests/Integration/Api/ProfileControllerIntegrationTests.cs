using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Trainio.Api.Common;
using Trainio.Api.Features.Profile;
using Trainio.Tests.Integration.Common;

namespace Trainio.Tests.Integration.Api;

public sealed class ProfileControllerIntegrationTests
{
    [Fact]
    public async Task GetAsync_WhenProfileDoesNotExist_ShouldReturnEmptyProfile()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        using var response = await client.GetAsync("/api/profile/get");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<ProfileResponse>();
        payload.Should().Be(new ProfileResponse(Guid.Empty, string.Empty, string.Empty, string.Empty, string.Empty));
    }

    [Fact]
    public async Task UpdateAsync_WhenRequestIsValid_ShouldCreateProfileAndGetShouldReturnSameState()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        var request = new UpdateProfileRequest(
            "Jan",
            "Nowak",
            "Jan.Nowak@Example.com",
            "0048 123 456 789");

        using var updateResponse = await client.PostAsJsonAsync("/api/profile/update", request);

        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var updated = await updateResponse.Content.ReadFromJsonAsync<ProfileResponse>();
        updated.Should().NotBeNull();
        updated!.Id.Should().NotBe(Guid.Empty);
        updated.Email.Should().Be("jan.nowak@example.com");
        updated.PhoneNumber.Should().Be("+48123456789");

        using var getResponse = await client.GetAsync("/api/profile/get");

        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var current = await getResponse.Content.ReadFromJsonAsync<ProfileResponse>();
        current.Should().Be(updated);
    }

    [Fact]
    public async Task UpdateAsync_WhenCalledTwice_ShouldKeepSingleProfileId()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        using var createResponse = await client.PostAsJsonAsync(
            "/api/profile/update",
            new UpdateProfileRequest("Anna", "Kowalska", "anna@example.com", "+48123456789"));
        createResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var created = await createResponse.Content.ReadFromJsonAsync<ProfileResponse>();
        created.Should().NotBeNull();

        using var updateResponse = await client.PostAsJsonAsync(
            "/api/profile/update",
            new UpdateProfileRequest("Jan", "Nowak", "jan@example.com", "+48987654321"));
        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var updated = await updateResponse.Content.ReadFromJsonAsync<ProfileResponse>();
        updated.Should().NotBeNull();
        updated!.Id.Should().Be(created!.Id);
        updated.FirstName.Should().Be("Jan");
        updated.Email.Should().Be("jan@example.com");
    }

    [Fact]
    public async Task UpdateAsync_WhenEmailIsInvalid_ShouldReturnBadRequestWithDomainError()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        var request = new UpdateProfileRequest(
            "Jan",
            "Nowak",
            "not-an-email",
            "+48123456789");

        using var response = await client.PostAsJsonAsync("/api/profile/update", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        error.Should().Be(new ErrorResponse("domain_error", "Email is invalid."));
    }
}

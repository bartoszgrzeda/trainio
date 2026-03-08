using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Trainio.Api.Common;
using Trainio.Api.Features.Clients;
using Trainio.Tests.Integration.Common;

namespace Trainio.Tests.Integration.Api;

public sealed class ClientsControllerIntegrationTests
{
    [Fact]
    public async Task CreateAsync_WhenRequestIsValid_ShouldReturnNormalizedClient()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        var request = new CreateClientRequest(
            "  Anna  ",
            "  Nowak  ",
            new DateOnly(1992, 3, 15),
            "0048 123 456 789",
            "f",
            "  beginner athlete  ");

        using var response = await client.PostAsJsonAsync("/api/clients/create", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<ClientResponse>();
        payload.Should().NotBeNull();
        payload!.Id.Should().NotBe(Guid.Empty);
        payload.FirstName.Should().Be("Anna");
        payload.LastName.Should().Be("Nowak");
        payload.BirthDate.Should().Be(new DateOnly(1992, 3, 15));
        payload.PhoneNumber.Should().Be("+48123456789");
        payload.Gender.Should().Be("female");
        payload.Notes.Should().Be("beginner athlete");
        payload.FullName.Should().Be("Anna Nowak");
    }

    [Fact]
    public async Task CreateAsync_WhenFirstNameIsInvalid_ShouldReturnBadRequestWithDomainError()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        var request = new CreateClientRequest(
            string.Empty,
            "Nowak",
            new DateOnly(1992, 3, 15),
            "+48123456789",
            "female",
            string.Empty);

        using var response = await client.PostAsJsonAsync("/api/clients/create", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        error.Should().Be(new ErrorResponse("domain_error", "First name is invalid."));
    }

    [Fact]
    public async Task GetAsync_WhenClientExists_ShouldReturnClient()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        var created = await CreateClientAsync(client, "Anna", "Nowak");

        using var response = await client.GetAsync($"/api/clients/get?id={created.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<ClientResponse>();
        payload.Should().NotBeNull();
        payload!.Id.Should().Be(created.Id);
        payload.FullName.Should().Be("Anna Nowak");
    }

    [Fact]
    public async Task GetAsync_WhenClientDoesNotExist_ShouldReturnNotFound()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        using var response = await client.GetAsync($"/api/clients/get?id={Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task ListAsync_WhenQueryIsProvided_ShouldReturnMatchingClientsSortedByName()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        await CreateClientAsync(client, "Zoe", "Nowak");
        await CreateClientAsync(client, "Adam", "Nowak");
        await CreateClientAsync(client, "Ewa", "Kowalska");

        using var response = await client.GetAsync("/api/clients/list?query=nowak");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<ClientListResponse>();
        payload.Should().NotBeNull();
        payload!.Clients.Select(item => item.FullName).Should().Equal("Adam Nowak", "Zoe Nowak");
    }

    [Fact]
    public async Task UpdateAsync_WhenClientExists_ShouldReturnUpdatedClient()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        var created = await CreateClientAsync(client, "Anna", "Nowak");

        var updateRequest = new UpdateClientRequest(
            created.Id,
            "  Jan  ",
            "  Kowalski  ",
            new DateOnly(1990, 1, 1),
            "+48 987-654-321",
            "m",
            "  updated notes  ");

        using var response = await client.PostAsJsonAsync("/api/clients/update", updateRequest);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<ClientResponse>();
        payload.Should().NotBeNull();
        payload!.Id.Should().Be(created.Id);
        payload.FullName.Should().Be("Jan Kowalski");
        payload.PhoneNumber.Should().Be("+48987654321");
        payload.Gender.Should().Be("male");
        payload.Notes.Should().Be("updated notes");
    }

    [Fact]
    public async Task UpdateAsync_WhenClientDoesNotExist_ShouldReturnNotFound()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        var request = new UpdateClientRequest(
            Guid.NewGuid(),
            "Jan",
            "Nowak",
            new DateOnly(1990, 1, 1),
            "+48123456789",
            "male",
            string.Empty);

        using var response = await client.PostAsJsonAsync("/api/clients/update", request);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeleteAsync_WhenClientExists_ShouldReturnSuccessTrue()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        var created = await CreateClientAsync(client, "Anna", "Nowak");

        using var response = await client.PostAsJsonAsync("/api/clients/delete", new DeleteClientRequest(created.Id));

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<DeleteClientResponse>();
        payload.Should().Be(new DeleteClientResponse(true));

        using var getResponse = await client.GetAsync($"/api/clients/get?id={created.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeleteAsync_WhenClientDoesNotExist_ShouldReturnNotFound()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        using var response = await client.PostAsJsonAsync("/api/clients/delete", new DeleteClientRequest(Guid.NewGuid()));

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    private static async Task<ClientResponse> CreateClientAsync(HttpClient client, string firstName, string lastName)
    {
        var request = new CreateClientRequest(
            firstName,
            lastName,
            new DateOnly(1992, 3, 15),
            "+48123456789",
            "female",
            string.Empty);

        using var response = await client.PostAsJsonAsync("/api/clients/create", request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<ClientResponse>();
        payload.Should().NotBeNull();

        return payload!;
    }
}

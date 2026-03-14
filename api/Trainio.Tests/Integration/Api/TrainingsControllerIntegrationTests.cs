using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Trainio.Api.Common;
using Trainio.Api.Features.Clients;
using Trainio.Api.Features.Trainings;
using Trainio.Domain.Features.Trainings;
using Trainio.Domain.ValueObjects;
using Trainio.Tests.Integration.Common;

namespace Trainio.Tests.Integration.Api;

public sealed class TrainingsControllerIntegrationTests
{
    [Fact]
    public async Task HomeAsync_WhenDateIsProvided_ShouldReturnRequestedDateAndEmptyState()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        using var response = await client.GetAsync("/api/trainings/home?date=2026-01-15");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<TrainingsHomeResponse>();
        payload.Should().NotBeNull();
        payload!.Date.Should().Be("2026-01-15");
        payload.NextTraining.Should().BeNull();
        payload.ActiveTrainingId.Should().BeNull();
        payload.Trainings.Should().BeEmpty();
    }

    [Fact]
    public async Task HomeAsync_WhenTrainingsExistForRequestedDate_ShouldReturnTodayTrainingsWithNextAndActiveTraining()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        var requestedDate = new DateOnly(2099, 1, 15);
        var firstClientId = await CreateClientAsync(client, "Anna", "Nowak");
        var secondClientId = await CreateClientAsync(client, "Jan", "Kowalski");
        var startedClientId = await CreateClientAsync(client, "Piotr", "Zielinski");

        await CreateTrainingAsync(
            client,
            firstClientId,
            new DateTimeOffset(2099, 1, 15, 12, 0, 0, TimeSpan.FromHours(1)),
            new DateTimeOffset(2099, 1, 15, 13, 0, 0, TimeSpan.FromHours(1)));
        var nextCandidate = await CreateTrainingAsync(
            client,
            secondClientId,
            new DateTimeOffset(2099, 1, 15, 9, 0, 0, TimeSpan.FromHours(1)),
            new DateTimeOffset(2099, 1, 15, 10, 0, 0, TimeSpan.FromHours(1)));
        await CreateTrainingAsync(
            client,
            secondClientId,
            new DateTimeOffset(2099, 1, 16, 9, 0, 0, TimeSpan.FromHours(1)),
            new DateTimeOffset(2099, 1, 16, 10, 0, 0, TimeSpan.FromHours(1)));

        Guid activeTrainingId = Guid.Empty;
        await factory.SeedAsync(dbContext =>
        {
            var startedTraining = Training.CreatePlanned(
                EntityId.From(startedClientId),
                new DateTimeOffset(2099, 1, 14, 7, 0, 0, TimeSpan.FromHours(1)),
                new DateTimeOffset(2099, 1, 14, 8, 0, 0, TimeSpan.FromHours(1)),
                TrainingNotes.Empty);
            startedTraining.Start();

            dbContext.Trainings.Add(startedTraining);
            activeTrainingId = startedTraining.Id;

            return Task.CompletedTask;
        });

        using var response = await client.GetAsync($"/api/trainings/home?date={requestedDate:yyyy-MM-dd}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<TrainingsHomeResponse>();
        payload.Should().NotBeNull();
        payload!.Date.Should().Be("2099-01-15");
        payload.ActiveTrainingId.Should().Be(activeTrainingId);

        payload.Trainings.Should().HaveCount(2);
        payload.Trainings.Select(training => training.StartTime).Should().Equal("09:00", "12:00");
        payload.Trainings.Select(training => training.Name).Should().Equal("Jan Kowalski", "Anna Nowak");
        payload.Trainings.Select(training => training.Status).Should().Equal("planned", "planned");

        payload.NextTraining.Should().NotBeNull();
        payload.NextTraining!.Id.Should().Be(nextCandidate.Id);
        payload.NextTraining.StartTime.Should().Be("09:00");
        payload.NextTraining.Name.Should().Be("Jan Kowalski");
        payload.NextTraining.Status.Should().Be("planned");
    }

    [Fact]
    public async Task StartAsync_WhenTrainingDoesNotExist_ShouldReturnNotFound()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        using var response = await client.PostAsync($"/api/trainings/{Guid.NewGuid()}/start", content: null);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task CreateAsync_WhenRequestIsValid_ShouldReturnCreatedTraining()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        var clientId = await CreateClientAsync(client);
        var request = new CreateTrainingRequest(
            clientId,
            new DateTimeOffset(2026, 3, 14, 11, 0, 0, TimeSpan.FromHours(1)),
            new DateTimeOffset(2026, 3, 14, 12, 0, 0, TimeSpan.FromHours(1)),
            "  Focus on technique.  ");

        using var response = await client.PostAsJsonAsync("/api/trainings/create", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<CreateTrainingResponse>();
        payload.Should().NotBeNull();
        payload!.Id.Should().NotBe(Guid.Empty);
        payload.ClientId.Should().Be(clientId);
        payload.StartAt.Should().Be(request.StartAt);
        payload.EndAt.Should().Be(request.EndAt);
        payload.Notes.Should().Be("Focus on technique.");
    }

    [Fact]
    public async Task CreateAsync_WhenRequestContainsUnknownClient_ShouldReturnBadRequestWithDomainError()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        var request = new CreateTrainingRequest(
            Guid.NewGuid(),
            new DateTimeOffset(2026, 3, 14, 11, 0, 0, TimeSpan.FromHours(1)),
            new DateTimeOffset(2026, 3, 14, 12, 0, 0, TimeSpan.FromHours(1)),
            string.Empty);

        using var response = await client.PostAsJsonAsync("/api/trainings/create", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        error.Should().Be(new ErrorResponse("domain_error", "clientId must reference existing client."));
    }

    [Fact]
    public async Task CreateAsync_WhenEndIsNotLaterThanStart_ShouldReturnBadRequestWithDomainError()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        var clientId = await CreateClientAsync(client);
        var startAt = new DateTimeOffset(2026, 3, 14, 11, 0, 0, TimeSpan.FromHours(1));
        var request = new CreateTrainingRequest(clientId, startAt, startAt, string.Empty);

        using var response = await client.PostAsJsonAsync("/api/trainings/create", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        error.Should().Be(new ErrorResponse("domain_error", "endAt must be later than startAt."));
    }

    [Fact]
    public async Task CheckWarningsAsync_WhenNoWarningsExist_ShouldReturnEmptyCollection()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        var clientId = await CreateClientAsync(client);
        var request = new CheckTrainingWarningsRequest(
            clientId,
            new DateTimeOffset(2026, 3, 14, 11, 0, 0, TimeSpan.FromHours(1)),
            new DateTimeOffset(2026, 3, 14, 12, 0, 0, TimeSpan.FromHours(1)));

        using var response = await client.PostAsJsonAsync("/api/trainings/check-warnings", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<CheckTrainingWarningsResponse>();
        payload.Should().NotBeNull();
        payload!.Warnings.Should().BeEmpty();
    }

    [Fact]
    public async Task CheckWarningsAsync_WhenTrainingOverlapsWithDifferentClient_ShouldReturnTimeOverlapWarning()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        var firstClientId = await CreateClientAsync(client, "Anna", "Nowak");
        var secondClientId = await CreateClientAsync(client, "Jan", "Kowalski");

        await CreateTrainingAsync(
            client,
            firstClientId,
            new DateTimeOffset(2026, 3, 14, 10, 30, 0, TimeSpan.FromHours(1)),
            new DateTimeOffset(2026, 3, 14, 11, 30, 0, TimeSpan.FromHours(1)));

        var request = new CheckTrainingWarningsRequest(
            secondClientId,
            new DateTimeOffset(2026, 3, 14, 11, 0, 0, TimeSpan.FromHours(1)),
            new DateTimeOffset(2026, 3, 14, 12, 0, 0, TimeSpan.FromHours(1)));

        using var response = await client.PostAsJsonAsync("/api/trainings/check-warnings", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<CheckTrainingWarningsResponse>();
        payload.Should().NotBeNull();
        payload!.Warnings.Should().BeEquivalentTo(
            [new TrainingWarningResponse("time_overlap", "This training overlaps with existing training 10:30-11:30.")],
            options => options.WithStrictOrdering());
    }

    [Fact]
    public async Task CheckWarningsAsync_WhenSameClientHasTrainingOnSharedLocalDay_ShouldReturnSameClientWarning()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        var clientId = await CreateClientAsync(client);
        await CreateTrainingAsync(
            client,
            clientId,
            new DateTimeOffset(2026, 3, 14, 23, 30, 0, TimeSpan.FromHours(1)),
            new DateTimeOffset(2026, 3, 15, 0, 30, 0, TimeSpan.FromHours(1)));

        var request = new CheckTrainingWarningsRequest(
            clientId,
            new DateTimeOffset(2026, 3, 15, 10, 0, 0, TimeSpan.FromHours(1)),
            new DateTimeOffset(2026, 3, 15, 11, 0, 0, TimeSpan.FromHours(1)));

        using var response = await client.PostAsJsonAsync("/api/trainings/check-warnings", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<CheckTrainingWarningsResponse>();
        payload.Should().NotBeNull();
        payload!.Warnings.Should().ContainSingle()
            .Which.Should().Be(new TrainingWarningResponse(
                "same_client_same_day",
                "Client already has a training on 2026-03-15."));
    }

    [Fact]
    public async Task CheckWarningsAsync_WhenClientDoesNotExist_ShouldReturnBadRequestWithDomainError()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        var request = new CheckTrainingWarningsRequest(
            Guid.NewGuid(),
            new DateTimeOffset(2026, 3, 14, 11, 0, 0, TimeSpan.FromHours(1)),
            new DateTimeOffset(2026, 3, 14, 12, 0, 0, TimeSpan.FromHours(1)));

        using var response = await client.PostAsJsonAsync("/api/trainings/check-warnings", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        error.Should().Be(new ErrorResponse("domain_error", "clientId must reference existing client."));
    }

    private static async Task<Guid> CreateClientAsync(HttpClient client, string firstName = "Anna", string lastName = "Nowak")
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

        return payload!.Id;
    }

    private static async Task<CreateTrainingResponse> CreateTrainingAsync(
        HttpClient client,
        Guid clientId,
        DateTimeOffset startAt,
        DateTimeOffset endAt)
    {
        var request = new CreateTrainingRequest(clientId, startAt, endAt, string.Empty);

        using var response = await client.PostAsJsonAsync("/api/trainings/create", request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<CreateTrainingResponse>();
        payload.Should().NotBeNull();

        return payload!;
    }
}

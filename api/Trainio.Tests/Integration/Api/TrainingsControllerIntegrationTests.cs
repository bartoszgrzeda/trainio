using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Trainio.Api.Features.Trainings;
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
    public async Task StartAsync_WhenTrainingDoesNotExist_ShouldReturnNotFound()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        using var response = await client.PostAsync($"/api/trainings/{Guid.NewGuid()}/start", content: null);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}

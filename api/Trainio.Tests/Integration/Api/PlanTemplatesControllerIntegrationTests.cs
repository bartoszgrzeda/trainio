using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Trainio.Api.Common;
using Trainio.Api.Features.PlanTemplates;
using Trainio.Tests.Integration.Common;

namespace Trainio.Tests.Integration.Api;

public sealed class PlanTemplatesControllerIntegrationTests
{
    [Fact]
    public async Task CreateAsync_WhenRequestIsValid_ShouldReturnNormalizedPlanTemplate()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        var request = CreateRequest("  Push Pull Legs  ");

        using var response = await client.PostAsJsonAsync("/api/plan-templates/create", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<PlanTemplateResponse>();
        payload.Should().NotBeNull();
        payload!.Id.Should().NotBe(Guid.Empty);
        payload.Name.Should().Be("Push Pull Legs");
        payload.Days.Should().HaveCount(1);
        payload.Days[0].Name.Should().Be("Day 1");
        payload.Days[0].Exercises.Should().HaveCount(1);
        payload.Days[0].Exercises[0].Order.Should().Be(0);
        payload.Days[0].Exercises[0].Series.Select(set => set.RepeatsCount).Should().Equal(10, 8);
    }

    [Fact]
    public async Task CreateAsync_WhenNameIsInvalid_ShouldReturnBadRequestWithDomainError()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        using var response = await client.PostAsJsonAsync(
            "/api/plan-templates/create",
            CreateRequest(string.Empty));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        error.Should().Be(new ErrorResponse("domain_error", "Plan name is invalid."));
    }

    [Fact]
    public async Task CreateAsync_WhenExercisesAreSentOutOfOrder_ShouldReturnExercisesSortedByOrder()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        var firstExerciseId = Guid.NewGuid();
        var secondExerciseId = Guid.NewGuid();
        var request = new CreatePlanTemplateRequest(
            "Ordered",
            [
                new PlanTemplateDayRequest(
                    "Day 1",
                    [
                        new PlanTemplateDayExerciseRequest(
                            firstExerciseId,
                            1,
                            [new PlanTemplateExerciseSetRequest(8)]),
                        new PlanTemplateDayExerciseRequest(
                            secondExerciseId,
                            0,
                            [new PlanTemplateExerciseSetRequest(10)]),
                    ]),
            ]);

        using var response = await client.PostAsJsonAsync("/api/plan-templates/create", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<PlanTemplateResponse>();
        payload.Should().NotBeNull();
        payload!.Days[0].Exercises.Select(exercise => exercise.Order).Should().Equal(0, 1);
        payload.Days[0].Exercises.Select(exercise => exercise.ExerciseId)
            .Should()
            .Equal(secondExerciseId, firstExerciseId);
    }

    [Fact]
    public async Task GetAsync_WhenPlanTemplateExists_ShouldReturnPlanTemplate()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        var created = await CreatePlanTemplateAsync(client, "Starter Plan");

        using var response = await client.GetAsync($"/api/plan-templates/get?id={created.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<PlanTemplateResponse>();
        payload.Should().NotBeNull();
        payload!.Id.Should().Be(created.Id);
        payload.Name.Should().Be("Starter Plan");
    }

    [Fact]
    public async Task GetAsync_WhenPlanTemplateDoesNotExist_ShouldReturnNotFound()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        using var response = await client.GetAsync($"/api/plan-templates/get?id={Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task ListAsync_WhenQueryIsProvided_ShouldReturnMatchingTemplatesSortedByName()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        await CreatePlanTemplateAsync(client, "Zeta Split");
        await CreatePlanTemplateAsync(client, "Alpha Split");
        await CreatePlanTemplateAsync(client, "Gamma Plan");

        using var response = await client.GetAsync("/api/plan-templates/list?query=split");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<PlanTemplateListResponse>();
        payload.Should().NotBeNull();
        payload!.PlanTemplates.Select(item => item.Name).Should().Equal("Alpha Split", "Zeta Split");
    }

    [Fact]
    public async Task UpdateAsync_WhenPlanTemplateExists_ShouldReturnUpdatedPlanTemplate()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        var created = await CreatePlanTemplateAsync(client, "Starter Plan");

        var updateRequest = new UpdatePlanTemplateRequest(
            created.Id,
            "  Updated Plan  ",
            [
                new PlanTemplateDayRequest(
                    "  Day A  ",
                    [
                        new PlanTemplateDayExerciseRequest(
                            Guid.NewGuid(),
                            0,
                            [
                                new PlanTemplateExerciseSetRequest(6),
                                new PlanTemplateExerciseSetRequest(8),
                            ]),
                    ]),
            ]);

        using var response = await client.PostAsJsonAsync("/api/plan-templates/update", updateRequest);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<PlanTemplateResponse>();
        payload.Should().NotBeNull();
        payload!.Id.Should().Be(created.Id);
        payload.Name.Should().Be("Updated Plan");
        payload.Days.Select(day => day.Name).Should().Equal("Day A");
        payload.Days[0].Exercises[0].Order.Should().Be(0);
        payload.Days[0].Exercises[0].Series.Select(set => set.RepeatsCount).Should().Equal(6, 8);
    }

    [Fact]
    public async Task UpdateAsync_WhenPlanTemplateDoesNotExist_ShouldReturnNotFound()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        using var response = await client.PostAsJsonAsync(
            "/api/plan-templates/update",
            new UpdatePlanTemplateRequest(Guid.NewGuid(), "Name", CreateDays()));

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeleteAsync_WhenPlanTemplateExists_ShouldReturnSuccessTrue()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        var created = await CreatePlanTemplateAsync(client, "Starter Plan");

        using var response = await client.PostAsJsonAsync(
            "/api/plan-templates/delete",
            new DeletePlanTemplateRequest(created.Id));

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<DeletePlanTemplateResponse>();
        payload.Should().Be(new DeletePlanTemplateResponse(true));

        using var getResponse = await client.GetAsync($"/api/plan-templates/get?id={created.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeleteAsync_WhenPlanTemplateDoesNotExist_ShouldReturnNotFound()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        using var response = await client.PostAsJsonAsync(
            "/api/plan-templates/delete",
            new DeletePlanTemplateRequest(Guid.NewGuid()));

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    private static async Task<PlanTemplateResponse> CreatePlanTemplateAsync(HttpClient client, string name)
    {
        using var response = await client.PostAsJsonAsync(
            "/api/plan-templates/create",
            CreateRequest(name));

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<PlanTemplateResponse>();
        payload.Should().NotBeNull();

        return payload!;
    }

    private static CreatePlanTemplateRequest CreateRequest(string name)
    {
        return new CreatePlanTemplateRequest(name, CreateDays());
    }

    private static IReadOnlyList<PlanTemplateDayRequest> CreateDays()
    {
        return
        [
            new PlanTemplateDayRequest(
                "Day 1",
                [
                    new PlanTemplateDayExerciseRequest(
                        Guid.NewGuid(),
                        0,
                        [
                            new PlanTemplateExerciseSetRequest(10),
                            new PlanTemplateExerciseSetRequest(8),
                        ]),
                ]),
        ];
    }
}

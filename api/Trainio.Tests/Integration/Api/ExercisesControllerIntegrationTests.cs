using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Trainio.Api.Common;
using Trainio.Api.Features.Exercises;
using Trainio.Domain.Features.Exercises;
using Trainio.Domain.ValueObjects;
using Trainio.Tests.Integration.Common;

namespace Trainio.Tests.Integration.Api;

public sealed class ExercisesControllerIntegrationTests
{
    [Fact]
    public async Task CreateAsync_WhenRequestIsValid_ShouldReturnCustomExercise()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        using var response = await client.PostAsJsonAsync(
            "/api/exercises/create",
            new CreateExerciseRequest("  Bench Press  "));

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<ExerciseResponse>();
        payload.Should().NotBeNull();
        payload!.Id.Should().NotBe(Guid.Empty);
        payload.Name.Should().Be("Bench Press");
        payload.Source.Should().Be("custom");
    }

    [Fact]
    public async Task CreateAsync_WhenRequestContainsInvalidName_ShouldReturnBadRequestWithDomainError()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        using var response = await client.PostAsJsonAsync(
            "/api/exercises/create",
            new CreateExerciseRequest(string.Empty));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        error.Should().Be(new ErrorResponse("domain_error", "Exercise name is invalid."));
    }

    [Fact]
    public async Task CreateAsync_WhenCustomExerciseWithSameNameExists_ShouldReturnBadRequestWithApplicationError()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        using var firstResponse = await client.PostAsJsonAsync(
            "/api/exercises/create",
            new CreateExerciseRequest("Push Up"));
        firstResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        using var duplicateResponse = await client.PostAsJsonAsync(
            "/api/exercises/create",
            new CreateExerciseRequest("  push up  "));

        duplicateResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var error = await duplicateResponse.Content.ReadFromJsonAsync<ErrorResponse>();
        error.Should().Be(new ErrorResponse("application_error", "Custom exercise with this name already exists."));
    }

    [Fact]
    public async Task ListAsync_WhenIncludeSeededChanges_ShouldReturnExpectedSet()
    {
        using var factory = new CustomWebApplicationFactory();

        await factory.SeedAsync(dbContext =>
        {
            dbContext.Exercises.Add(Exercise.From(ExerciseName.From("Bench Press")));
            dbContext.Exercises.Add(Exercise.From(ExerciseName.From("Biceps Curl")));
            dbContext.Exercises.Add(Exercise.CreateSeeded(ExerciseName.From("Bench Jump")));
            return Task.CompletedTask;
        });

        using var client = factory.CreateApiClient();

        using var customOnlyResponse = await client.GetAsync("/api/exercises/list?query=bench&includeSeeded=false");
        customOnlyResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var customOnly = await customOnlyResponse.Content.ReadFromJsonAsync<ExerciseListResponse>();
        customOnly.Should().NotBeNull();
        customOnly!.Exercises.Select(exercise => exercise.Name).Should().Equal("Bench Press");
        customOnly.Exercises.Select(exercise => exercise.Source).Should().Equal("custom");

        using var withSeededResponse = await client.GetAsync("/api/exercises/list?query=bench&includeSeeded=true");
        withSeededResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var withSeeded = await withSeededResponse.Content.ReadFromJsonAsync<ExerciseListResponse>();
        withSeeded.Should().NotBeNull();
        withSeeded!.Exercises.Select(exercise => exercise.Name).Should().Equal("Bench Jump", "Bench Press");
        withSeeded.Exercises.Select(exercise => exercise.Source).Should().Equal("seeded", "custom");
    }

    [Fact]
    public async Task UpdateAsync_WhenExerciseExists_ShouldReturnUpdatedExercise()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        var created = await CreateExerciseAsync(client, "Bench Press");

        using var response = await client.PostAsJsonAsync(
            "/api/exercises/update",
            new UpdateExerciseRequest(created.Id, "  Incline Bench Press  "));

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<ExerciseResponse>();
        payload.Should().NotBeNull();
        payload!.Id.Should().Be(created.Id);
        payload.Name.Should().Be("Incline Bench Press");
        payload.Source.Should().Be("custom");
    }

    [Fact]
    public async Task UpdateAsync_WhenExerciseDoesNotExist_ShouldReturnNotFound()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        using var response = await client.PostAsJsonAsync(
            "/api/exercises/update",
            new UpdateExerciseRequest(Guid.NewGuid(), "Incline Bench Press"));

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task UpdateAsync_WhenExerciseIsSeeded_ShouldReturnNotFound()
    {
        using var factory = new CustomWebApplicationFactory();
        Guid seededId = Guid.Empty;

        await factory.SeedAsync(dbContext =>
        {
            var seededExercise = Exercise.CreateSeeded(ExerciseName.From("Bench Press"));
            seededId = seededExercise.Id;
            dbContext.Exercises.Add(seededExercise);
            return Task.CompletedTask;
        });

        using var client = factory.CreateApiClient();

        using var response = await client.PostAsJsonAsync(
            "/api/exercises/update",
            new UpdateExerciseRequest(seededId, "Incline Bench Press"));

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task UpdateAsync_WhenAnotherCustomExerciseWithSameNameExists_ShouldReturnBadRequestWithApplicationError()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        var first = await CreateExerciseAsync(client, "Push Up");
        var second = await CreateExerciseAsync(client, "Pull Up");

        using var response = await client.PostAsJsonAsync(
            "/api/exercises/update",
            new UpdateExerciseRequest(second.Id, $"  {first.Name}  "));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        error.Should().Be(new ErrorResponse("application_error", "Custom exercise with this name already exists."));
    }

    [Fact]
    public async Task DeleteAsync_WhenExerciseExists_ShouldReturnSuccessTrue()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        var created = await CreateExerciseAsync(client, "Bench Press");

        using var response = await client.PostAsJsonAsync(
            "/api/exercises/delete",
            new DeleteExerciseRequest(created.Id));

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<DeleteExerciseResponse>();
        payload.Should().Be(new DeleteExerciseResponse(true));

        using var listResponse = await client.GetAsync("/api/exercises/list?query=bench&includeSeeded=false");
        listResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var listPayload = await listResponse.Content.ReadFromJsonAsync<ExerciseListResponse>();
        listPayload.Should().NotBeNull();
        listPayload!.Exercises.Should().BeEmpty();
    }

    [Fact]
    public async Task DeleteAsync_WhenExerciseIsSeeded_ShouldReturnNotFound()
    {
        using var factory = new CustomWebApplicationFactory();
        Guid seededId = Guid.Empty;

        await factory.SeedAsync(dbContext =>
        {
            var seededExercise = Exercise.CreateSeeded(ExerciseName.From("Bench Press"));
            seededId = seededExercise.Id;
            dbContext.Exercises.Add(seededExercise);
            return Task.CompletedTask;
        });

        using var client = factory.CreateApiClient();

        using var response = await client.PostAsJsonAsync(
            "/api/exercises/delete",
            new DeleteExerciseRequest(seededId));

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeleteAsync_WhenExerciseDoesNotExist_ShouldReturnNotFound()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateApiClient();

        using var response = await client.PostAsJsonAsync(
            "/api/exercises/delete",
            new DeleteExerciseRequest(Guid.NewGuid()));

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    private static async Task<ExerciseResponse> CreateExerciseAsync(HttpClient client, string name)
    {
        using var response = await client.PostAsJsonAsync(
            "/api/exercises/create",
            new CreateExerciseRequest(name));
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<ExerciseResponse>();
        payload.Should().NotBeNull();

        return payload!;
    }
}

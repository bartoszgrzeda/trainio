# Endpoint Integration Test Class Template (C#)

Use this as a base for endpoint-specific integration tests. Keep only relevant cases for the endpoint under test.

```csharp
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace {{TestNamespace}};

public sealed class {{EndpointName}}IntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly HttpClient _client;

    public {{EndpointName}}IntegrationTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task {{Action}}_WhenRequestIsValid_ShouldReturn{{SuccessCode}}AndExpectedPayload()
    {
        // Arrange
        var request = new {{RequestDto}}
        {
            // Set required fields
        };

        // Act
        using var response = await _client.{{HttpMethodCall}}("{{Route}}", request);

        // Assert
        Assert.Equal(HttpStatusCode.{{SuccessCode}}, response.StatusCode);
        Assert.Equal("application/json; charset=utf-8", response.Content.Headers.ContentType?.ToString());

        var payload = await response.Content.ReadFromJsonAsync<{{ResponseDto}}>(JsonOptions);
        Assert.NotNull(payload);
        Assert.Equal({{ExpectedValueExpression}}, payload!.{{PropertyToAssert}});
    }

    [Fact]
    public async Task {{Action}}_WhenRequestIsInvalid_ShouldReturnBadRequestWithValidationDetails()
    {
        // Arrange
        var invalidRequest = new {{RequestDto}}
        {
            // Provide invalid input for required validation rules.
        };

        // Act
        using var response = await _client.{{HttpMethodCall}}("{{Route}}", invalidRequest);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var problem = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>(JsonOptions);
        Assert.NotNull(problem);
        Assert.Equal((int)HttpStatusCode.BadRequest, problem!.Status);
        Assert.NotEmpty(problem.Errors);
    }

    [Fact]
    public async Task {{Action}}_WhenUserIsUnauthorized_ShouldReturnUnauthorized()
    {
        // Arrange
        using var anonymousClient = new HttpClient { BaseAddress = _client.BaseAddress };

        // Act
        using var response = await anonymousClient.GetAsync("{{RouteRequiringAuth}}");

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task {{Action}}_WhenResourceDoesNotExist_ShouldReturnNotFound()
    {
        // Arrange
        var missingRoute = "{{RouteWithMissingId}}";

        // Act
        using var response = await _client.GetAsync(missingRoute);

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task {{ListAction}}_WhenFilteringAndPaging_ShouldReturnExpectedSlice()
    {
        // Arrange
        var route = "{{ListRoute}}?page=1&pageSize=10&filter={{FilterValue}}";

        // Act
        using var response = await _client.GetAsync(route);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<{{PagedResponseDto}}>(JsonOptions);
        Assert.NotNull(payload);
        Assert.True(payload!.Items.Count <= 10);
        Assert.Equal(1, payload.Page);
    }
}
```

Notes:

- Replace template placeholders from real endpoint and DTO contracts.
- Add/remove test cases based on endpoint behavior.
- Prefer project-provided JSON helpers if available.
- Keep assertions contract-focused and stable.

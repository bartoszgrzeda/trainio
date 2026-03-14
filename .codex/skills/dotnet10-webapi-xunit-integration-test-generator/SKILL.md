---
name: dotnet10-webapi-xunit-integration-test-generator
description: Generate or update production-quality .NET 10 ASP.NET Core Web API integration tests using xUnit, WebApplicationFactory of Program, and HttpClient. Trigger for requests to create endpoint-level integration coverage for controllers or Minimal APIs, including auth, validation, ProblemDetails, persistence, pagination/filtering, and common API workflows. Do not use for unit tests, browser E2E tests, load/performance testing, or non-ASP.NET Core projects.
---

# Purpose

Generate or extend deterministic, repository-aligned integration tests for .NET 10 ASP.NET Core Web APIs using xUnit, `WebApplicationFactory<Program>`, and real `HttpClient` pipeline execution.

# When to Use

- Creating integration tests for controllers or Minimal APIs.
- Expanding endpoint coverage for auth, validation, ProblemDetails, and persistence behavior.
- Adding integration coverage for pagination/filtering/sorting API contracts.
- Standardizing existing API tests around repository conventions.

Example prompts:
- "Add integration tests for `POST /api/clients` including validation and auth failures."
- "Generate Minimal API integration tests for pagination and filtering behavior."
- "Create `WebApplicationFactory`-based tests for profile update endpoints with ProblemDetails assertions."

Do not use this skill for:

- unit tests with mocked services/controllers
- browser UI E2E tests
- performance/load testing
- non-ASP.NET Core APIs

# Workflow

1. Inspect the target API and existing test infrastructure.
2. Build an endpoint-level test plan.
3. Reuse existing test infrastructure first.
4. Replace runtime dependencies only when deterministic behavior requires it.
5. Generate tests and supporting infrastructure changes with minimal scope.
6. Validate against quality gates and return complete output.

## Required Inspection

Before writing tests, inspect:

- API startup/hosting files (`Program.cs`, `Startup.cs`, `*.csproj`).
- Endpoint style (controllers vs Minimal APIs).
- Existing integration test fixtures/helpers.
- Auth/authorization strategy and policies.
- Validation and error contract behavior (`ProblemDetails`/custom envelopes).
- Persistence and test DB strategy.
- Middleware that can affect deterministic assertions.

## Test Plan Rules

For each endpoint, map:

- method + route
- request requirements (headers/query/body)
- success expectations
- failure expectations (`400/401/403/404/409/422` as relevant)
- side effects (persistence/external interactions)
- pagination/filtering behavior
- ProblemDetails contract assertions when applicable

## Infrastructure Rules

- Reuse existing factory/fixtures/helpers whenever possible.
- Create `CustomWebApplicationFactory` only if required.
- Keep dependency replacement inside test host setup.
- Keep lifecycle deterministic (`IClassFixture`, `IAsyncLifetime`, isolated test data).

## Database Strategy Rules

1. Reuse repository-established integration DB strategy when present.
2. If EF Core and isolated real DB is unavailable, use SQLite in-memory only when behavior remains representative.
3. Reuse existing containerized test dependencies when already adopted.
4. Do not introduce a contradictory persistence strategy.

## Test Authoring Standards

Always enforce:

- xUnit
- `WebApplicationFactory<Program>`
- full pipeline HTTP requests with `HttpClient`
- async/await
- clear Arrange/Act/Assert
- descriptive names (`Action_WhenCondition_ShouldOutcome`)
- assertions for status, payload contract, and relevant headers
- happy-path and failure-path coverage

# Checklist

- Endpoint plan covers success and realistic failure paths.
- Auth/authorization behavior is covered when relevant.
- Validation and ProblemDetails behavior is asserted when relevant.
- Persistence side effects are verified when relevant.
- Test infrastructure reuses repository conventions.
- Changes are limited to requested endpoints and required support files.
- Determinism risks (time/random/order/external dependencies) are handled.
- If test execution was feasible, run result is reported.

# Output Format

Return:

1. Created/updated file paths.
2. Full code for every created/updated test/support file.
3. Assumptions (only when required).
4. What infrastructure was reused vs introduced.
5. Validation status (`dotnet test` result if executed).

# Rules

- Prefer best-effort repository inference before asking clarifying questions.
- Keep assumptions minimal and explicit.
- Do not invent endpoint contracts/policies without labeling assumptions.
- Do not over-mock the ASP.NET Core pipeline.
- Do not change production code unless required for testability and explicitly stated.

# Examples

- Controller endpoint request -> generate integration tests for success + validation + auth + not-found cases.
- Minimal API request -> generate `WebApplicationFactory` tests with repository-aligned fixture setup and payload assertions.

# References

- [templates/request-template.md](templates/request-template.md)
- [docs/checklist.md](docs/checklist.md)
- [docs/decision-rules.md](docs/decision-rules.md)
- [templates/custom-webapplicationfactory-template.cs.md](templates/custom-webapplicationfactory-template.cs.md)
- [templates/test-auth-template.cs.md](templates/test-auth-template.cs.md)
- [templates/integration-test-template.cs.md](templates/integration-test-template.cs.md)

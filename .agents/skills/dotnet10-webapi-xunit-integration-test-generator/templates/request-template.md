# Integration Test Request Template (.NET 10 ASP.NET Core Web API)

Use this template when asking Codex to generate or update integration tests with `$dotnet10-webapi-xunit-integration-test-generator`.

## 1) Scope

- Goal:
- API project path (`.csproj` or solution area):
- Test project path:
- New tests, update existing tests, or both:

## 2) Endpoint Targets

For each endpoint:

- Method + route:
- Controller or Minimal API mapping location:
- Request body DTO/type (if any):
- Response DTO/type (if any):
- Expected success status code:
- Relevant failure statuses to cover:

## 3) Runtime Rules

- Authentication required? (yes/no + scheme):
- Authorization policy/role requirements:
- Validation rules that must be asserted:
- ProblemDetails expected on errors? (yes/no/details):

## 4) Persistence and Dependencies

- Data access technology (EF Core/Dapper/other):
- Existing integration test DB strategy:
- Seed data requirements:
- External HTTP services involved:
- Message broker/background processing involved:
- Time-dependent behavior:

## 5) Existing Test Infrastructure

- Existing `WebApplicationFactory` or fixtures to reuse:
- Existing test helpers/utilities to reuse:
- Existing naming/style conventions:

## 6) Coverage Requirements

- Required happy-path scenarios:
- Required failure-path scenarios:
- Pagination/filtering query combinations to cover:
- Required header assertions:

## 7) Constraints

- Must not change production code? (yes/no + exceptions):
- Must avoid specific libraries/packages:
- CI/runtime constraints:

## 8) Output Preference

- Full file outputs required? (default: yes):
- Include assumptions section? (default: yes when needed):
- Run tests command after generation? (yes/no):

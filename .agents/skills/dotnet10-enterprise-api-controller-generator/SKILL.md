---
name: dotnet10-enterprise-api-controller-generator
description: Generate enterprise-grade ASP.NET Core Web API controllers in .NET 10 using ControllerBase, [ApiController], and [Route("api/[controller]")], with thin service-driven actions, request/response DTO contracts, async + CancellationToken, consistent ActionResult<T> usage, authorization support, pagination/filtering/sorting query contracts, and repository-aligned error handling semantics. Use when adding or refactoring API endpoints into production-ready controllers that must match an existing codebase style and structure.
---

# Purpose

Generate or refactor thin ASP.NET Core Web API controllers in .NET 10 that follow repository architecture, use service-driven actions, and return consistent HTTP semantics with request/response contracts.

# When to Use

- Adding a new controller for an existing application service.
- Refactoring controller actions to align with repository API conventions.
- Introducing pagination/filtering/sorting query contracts for list endpoints.
- Standardizing response and error handling semantics across endpoints.

Example prompts:
- "Create `ProductsController` with list/detail/create/update/delete endpoints using `IProductAppService`."
- "Refactor this controller to use `ActionResult<T>`, async actions, and cancellation tokens."
- "Add paged/filter/sort query contracts and wire them into the list endpoint."

# Workflow

1. Inspect repository API structure and architecture.
2. Infer local conventions and contract patterns.
3. Resolve target controller/service/DTO mapping.
4. Clarify only when ambiguity blocks safe generation.
5. Generate or update controller and contracts with minimal scope.
6. Validate assumptions and return production-ready output.

## Repository Inspection

Inspect in this order:

1. API entry points and project files (`Program.cs`, `Startup.cs`, `*.csproj`).
2. Existing endpoint style (controllers vs minimal APIs).
3. Existing services and DTO contracts (`I*Service`, contracts folders).
4. Cross-cutting conventions (auth, validation, ProblemDetails, middleware).

Use focused `rg` discovery and prioritize nearby feature patterns.

## Controller Generation Rules

Always produce controllers that:

- Inherit `ControllerBase`.
- Use `[ApiController]` and `[Route("api/[controller]")]`.
- Inject an application service interface.
- Accept request DTOs and return response DTOs.
- Use async actions with `CancellationToken`.
- Return `ActionResult<T>` for payload endpoints.
- Apply authorization attributes according to repository conventions.
- Keep business logic out of controllers.

## HTTP Semantics

Default mapping unless repository conventions differ:

- `GET collection` -> `200 OK`.
- `GET by id` -> `200 OK` or `404 NotFound`.
- `POST` -> `201 Created` with `CreatedAtAction`.
- `PUT/PATCH` -> `200 OK` (or `204 NoContent` if repository standard) and `404` when missing.
- `DELETE` -> `204 NoContent` and `404` when missing.
- Invalid input -> repository-standard validation response.

## Pagination/Filtering/Sorting

For list endpoints:

- Use `[FromQuery]` request contracts.
- Include page/page size/filter/sort inputs when repository conventions support them.
- Return repository-standard paged response contracts.

## Error Handling

Follow repository behavior in this order:

1. Reuse global exception handling/ProblemDetails middleware.
2. Use validation responses for model-state failures.
3. Use `BadRequest` only for explicit shape errors.
4. Use `NotFound` for missing resources.
5. Avoid broad controller-level `try/catch` unless repository pattern requires it.

# Checklist

- Controller remains thin and service-driven.
- Route, attributes, and naming follow local conventions.
- DTO contracts are used consistently (no domain entities in responses).
- Every service call is async and includes `CancellationToken`.
- HTTP semantics match repository conventions.
- Authorization and validation behavior align with existing patterns.
- Scope is limited to files needed for the requested feature.

# Output Format

Return:

1. Created/updated file paths.
2. Full controller code.
3. Full request/response contract code for any new contracts.
4. Assumptions (only when necessary).
5. Validation status (`dotnet build` result if executed).

# Rules

- Preserve repository conventions over defaults.
- Keep controllers orchestration-only (no business rules).
- Avoid ad hoc error envelopes when global conventions exist.
- Do not refactor unrelated endpoints/services.
- Do not introduce new architecture layers unless explicitly requested.

# Examples

- New feature controller -> add controller + missing contracts with repository-aligned semantics.
- Existing controller cleanup -> convert to async + `ActionResult<T>` + service delegation without changing feature behavior.

# References

- [references/controller-template.cs.tpl](references/controller-template.cs.tpl)
- [references/paging-filter-sort-contracts.cs.tpl](references/paging-filter-sort-contracts.cs.tpl)

---
name: dotnet10-enterprise-api-controller-generator
description: Generate enterprise-grade ASP.NET Core Web API controllers in .NET 10 using ControllerBase, [ApiController], and [Route("api/[controller]")], with thin service-driven actions, request/response DTO contracts, async + CancellationToken, consistent ActionResult<T> usage, authorization support, pagination/filtering/sorting query contracts, and repository-aligned error handling semantics. Use when adding or refactoring API endpoints into production-ready controllers that must match an existing codebase style and structure.
---

# Dotnet10 Enterprise API Controller Generator

## Workflow

1. Inspect repository structure before writing code.
2. Infer existing project conventions and architecture.
3. Resolve controller/service/contracts mapping for the target feature.
4. Ask for missing information only when a safe assumption is not possible.
5. Generate or update controller and contract files with minimal scope.
6. Validate compile assumptions and output correctness before finalizing.

## 1) Inspect Repository Structure

Run targeted discovery in this order:

1. Locate API projects and startup entry points.
   - Find `*.csproj`, `Program.cs`, `Startup.cs`.
2. Detect endpoint style and folder conventions.
   - Look for `*Controller.cs`, `ControllerBase`, `MapGet/MapPost`, endpoint groups.
3. Find service interfaces and DTO contracts.
   - Search for `I*Service`, `I*AppService`, `Contracts`, `Requests`, `Responses`, `Dto`.
4. Find cross-cutting API conventions.
   - Search for middleware/filters/problem-details setup, authorization policies, validation conventions.

Prefer `rg` for discovery. Keep search narrow and feature-focused.

## 2) Infer Conventions

Infer and follow these conventions from existing code:

- Namespace pattern and file-scoped vs block-scoped namespaces.
- Constructor style and dependency injection style.
- Attribute ordering and formatting style.
- DTO naming (`Request/Response` vs `Command/Dto`) and file placement.
- Error envelope conventions (`ProblemDetails`, custom `ErrorResponse`, exception middleware).
- Authorization usage (`[Authorize]`, policy names, role usage, anonymous overrides).

Prefer existing repository conventions over defaults.

Architecture defaults only when the repo has no clear pattern:

- `Controllers/`
- `Contracts/Requests/`
- `Contracts/Responses/`

If the repo clearly uses another pattern, follow it instead of forcing these defaults.

## 3) Resolve Target Controller Contract

Determine these inputs before generation:

- Entity/feature name (example: `Products`).
- Controller class name and route (`api/[controller]`).
- Application service interface name and method signatures.
- Request/response DTO names and namespaces.
- Pagination/filtering/sorting contracts or base query contract used in the repo.
- Error handling and authorization expectations for read/write endpoints.

Keep controller thin:

- Do not embed business rules.
- Delegate all behavior to injected application service.
- Map service results to HTTP responses only.

## 4) Ask for Missing Information Only When Necessary

Ask a concise clarification only when one of these is true:

- Multiple service interfaces are valid and selection is ambiguous.
- Existing routing/authorization conventions conflict and cannot be inferred safely.
- A required DTO contract is missing and cannot be inferred from neighboring features.
- Resource identity semantics are unclear (`Guid`, `long`, slug) and affect route signature.

Otherwise proceed with minimal explicit assumptions.

## 5) Generate Controller and Contracts

### Required Controller Rules

Always generate controllers that:

- Inherit `ControllerBase`.
- Use `[ApiController]`.
- Use `[Route("api/[controller]")]`.
- Inject an application service interface (for example `IProductAppService`).
- Accept request DTOs and return response DTOs.
- Avoid returning domain entities directly.
- Use async actions with `CancellationToken` in every service call.
- Return `ActionResult<T>` for endpoints with response payloads.
- Apply authorization attributes consistent with repo conventions.

### HTTP Semantics Mapping

Apply these response semantics unless repository conventions dictate a stricter variant:

- `GET collection` -> `200 OK` with paged/list response.
- `GET by id` -> `200 OK` when found, `404 NotFound` when missing.
- `POST` -> `201 Created` with `CreatedAtAction` + response payload.
- `PUT/PATCH` -> `200 OK` (or `204 NoContent` if that is the repo pattern), `404 NotFound` when target is missing.
- `DELETE` -> `204 NoContent` when deleted, `404 NotFound` when missing.
- Invalid input -> `ValidationProblem(ModelState)` or `BadRequest(...)` according to existing conventions.

### Pagination/Filtering/Sorting

For list endpoints:

- Accept a query request contract from `Contracts/Requests/` (or repository equivalent).
- Include fields for page, page size, filter text/criteria, and sort field/direction.
- Use model binding from query (`[FromQuery]`).
- Return a paged response contract from `Contracts/Responses/`.

Use [references/controller-template.cs.tpl](references/controller-template.cs.tpl) and [references/paging-filter-sort-contracts.cs.tpl](references/paging-filter-sort-contracts.cs.tpl) as scaffolds.

## 6) Error Handling Conventions

Never introduce ad hoc error behavior when the repository already defines one.

Follow this order:

1. Reuse existing global exception middleware/filter/problem-details behavior.
2. Return `ValidationProblem` for model validation failures when applicable.
3. Return `BadRequest` only for explicit request-shape errors that are not model-state failures.
4. Return `NotFound` for absent resources.
5. Avoid controller-level broad `try/catch` unless the repo pattern explicitly requires it.

## 7) Change Scope and Safety

- Modify only files required for the requested controller feature.
- Avoid refactoring unrelated endpoints/services.
- Create new DTO contracts only when missing and required.
- Preserve style and naming consistency with nearby files.

## 8) Validation Before Final Output

Before finalizing:

1. Verify namespaces and using directives resolve to existing projects.
2. Verify service methods invoked by controller actually exist (or clearly state required additions).
3. Verify DTO type names and folders match inferred conventions.
4. Run a compile check when feasible (`dotnet build` on nearest solution/project).
5. If build cannot run, state compile assumptions explicitly.

## 9) Final Response Contract

When returning generated output:

1. List created/updated files.
2. Provide controller code and any new contracts.
3. State assumptions (only if necessary).
4. Report whether compile validation was run and result.

Keep output production-ready, readable, and thin-controller oriented.

# Integration Test Generation Checklist

Use this checklist before finalizing generated integration tests.

## A) Endpoint Analysis Checklist

- [ ] Confirm endpoint style: controller action or Minimal API route.
- [ ] Confirm exact route template and HTTP method.
- [ ] Confirm request contract (body/query/route/header).
- [ ] Confirm response contract and expected success status.
- [ ] Confirm auth/authz requirements (`401` vs `403` behavior).
- [ ] Confirm validation behavior and expected error payload format.
- [ ] Confirm whether `ProblemDetails` is used and shape expected.
- [ ] Confirm route constraints/versioning rules that influence tests.
- [ ] Confirm pagination/filter/sort query semantics and defaults.
- [ ] Confirm side effects (DB writes, external calls, events).

## B) Infrastructure Checklist

- [ ] Reuse existing `WebApplicationFactory` and fixtures when present.
- [ ] Add/adjust `CustomWebApplicationFactory` only when needed.
- [ ] Replace auth dependencies with deterministic test setup if needed.
- [ ] Replace DB registration with project-aligned test strategy.
- [ ] Replace external HTTP clients with deterministic test doubles.
- [ ] Neutralize/replace interfering background services.
- [ ] Ensure deterministic time via fake clock/`TimeProvider` where needed.
- [ ] Ensure per-test or per-class data isolation and cleanup.

## C) Test Class Quality Checklist

- [ ] Uses xUnit.
- [ ] Uses `WebApplicationFactory<Program>` + real `HttpClient`.
- [ ] Uses async/await throughout.
- [ ] Follows Arrange/Act/Assert.
- [ ] Uses descriptive test names.
- [ ] Avoids FluentAssertions unless explicitly requested.
- [ ] Asserts status code and relevant headers.
- [ ] Deserializes response body and asserts meaningful fields.
- [ ] Avoids brittle assertions on irrelevant implementation details.
- [ ] Includes both happy and failure paths.

## D) Scenario Coverage Checklist

- [ ] Success case(s).
- [ ] Validation failure (`400` or project-equivalent).
- [ ] Unauthorized (`401`) when auth is required.
- [ ] Forbidden (`403`) when policy/role checks apply.
- [ ] Not found (`404`) where resource lookup is involved.
- [ ] Create/update/delete behavior assertions where relevant.
- [ ] Pagination/filtering combinations where relevant.
- [ ] ProblemDetails assertions for error endpoints.

## E) Output Contract Checklist

- [ ] Full code provided unless user asked for snippets.
- [ ] Filenames included for each file.
- [ ] `using` directives included.
- [ ] Assumptions explicitly labeled.
- [ ] No invented endpoints/DTOs/claims/policies without assumption labels.
- [ ] Existing infrastructure preferred over redundant abstractions.

## F) Final Validation Checklist

- [ ] Verify compile-time type references and namespaces.
- [ ] Run relevant `dotnet test` scope when feasible.
- [ ] If tests are not run, explicitly state that in the final response.

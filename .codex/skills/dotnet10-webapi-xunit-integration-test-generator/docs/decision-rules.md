# Decision Rules for .NET 10 Web API Integration Tests

Use these rules when design choices are ambiguous.

## 1) Endpoint Style Detection

1. If endpoint is defined in a class inheriting `ControllerBase` with route attributes, treat as controller testing style.
2. If endpoint is defined with `MapGet/MapPost/...`, route groups, or extension mapping methods, treat as Minimal API testing style.
3. For mixed projects, follow the style of the endpoint under test; do not force one style globally.

## 2) Auth and Authorization Strategy

1. If endpoint is anonymous, do not add auth setup just to satisfy templates.
2. If endpoint requires auth:
   - Configure deterministic test authentication handler/scheme.
   - Add claims required by policies/roles.
3. Distinguish clearly:
   - Missing/invalid identity -> `401 Unauthorized`
   - Authenticated but insufficient permission -> `403 Forbidden`

## 3) Validation and Error Contract Rules

1. If automatic model validation is enabled, expect framework-driven `400` payload patterns.
2. If custom validation middleware/filter exists, assert the project-specific error contract.
3. If `ProblemDetails` is enabled, assert key fields:
   - `status`
   - `title`
   - `type` (when provided)
   - `detail` (when meaningful)
4. Do not assert unstable values (for example dynamic trace IDs) unless contract mandates format/presence.

## 4) Database Strategy Rules

Choose the first applicable option:

1. Existing repository integration strategy (real isolated DB/containerized stack).
2. SQLite in-memory only when compatible with behavior being tested.
3. Lightweight in-memory substitutes only when they do not invalidate endpoint behavior.

Hard constraints:

- Do not introduce a new DB paradigm that conflicts with repository standards.
- Do not assume EF Core unless detected.
- Keep data setup isolated and deterministic.

## 5) External Dependency Rules

1. External HTTP calls: replace with deterministic handler/server unless the repo already has stable local integration dependencies.
2. Message brokers: use existing test harness/fakes from repository when available.
3. Background services: disable or replace when they create nondeterministic side effects.
4. Time dependencies: inject fake clock/`TimeProvider` when assertions depend on time.

## 6) Missing Context Fallback Strategy

When required context is missing:

1. Inspect the codebase first (`Program.cs`, route mappings, DTOs, existing tests).
2. Infer from nearby patterns and existing tests.
3. Proceed with minimal assumptions if still ambiguous.
4. Label assumptions explicitly in output.
5. If a safe assumption is impossible, ask a concise focused question.

## 7) Output and Change Scope Rules

1. Prefer updating existing test infrastructure over adding parallel abstractions.
2. Keep changes tightly scoped to requested endpoints and required shared test plumbing.
3. Provide complete code with file names unless user explicitly asks for snippets.
4. Keep explanations short; prioritize code output.

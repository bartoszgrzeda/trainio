---
name: dotnet10-ddd-domain-entity-generator
description: Generate production-ready .NET 10 DDD domain entities that inherit BaseEntity, use value objects for business properties and entity APIs, enforce invariants through factory/domain methods, and include EF Core entity configuration plus xUnit + FluentAssertions unit tests. Use when creating or refactoring domain entities in Domain/Entities with encapsulation, Value Object handling, and practical persistence mapping.
---

# Purpose

Generate production-ready .NET 10 DDD entities with rich behavior, Value Object-based business fields, EF Core configuration, and focused unit tests that match repository conventions.

# When to Use

- Creating a new domain entity in `Domain/Entities`.
- Refactoring an anemic entity into behavior-rich DDD style.
- Enforcing Value Object usage for business properties and entity APIs.
- Adding or updating EF Core mapping plus entity unit tests.

Example prompts:
- "Create a `Customer` entity with `FirstName`, `LastName`, and `Email` value objects plus EF config and tests."
- "Refactor `Order` to use value objects in `From(...)` and domain methods."
- "Generate a DDD `Subscription` entity with activation behavior and JSON round-trip tests."

# Workflow

1. Parse request input into a normalized entity model.
2. Inspect repository conventions before writing code.
3. Generate domain entity code in `Domain/Entities`.
4. Generate EF Core configuration in the repository's persistence configuration folder.
5. Generate unit tests in `Tests/Unit/Domain/Entities`.
6. Validate assumptions and return complete output.

## Input Normalization

Accept structured input or natural language and normalize to:

```yaml
Entity: Customer
Properties:
  - Name: FirstName
    Type: FirstName
    Required: true
    ValueObject: true
    Editable: true
Behaviors:
  - Rename
ActivationSemantics: true
Collections:
  - Name: Orders
    ElementType: OrderReference
```

If details are missing, infer safe defaults:

- `Editable`: `true` for non-key business fields.
- `ActivationSemantics`: `true` when `IsActive` exists; otherwise `false`.
- `Behaviors`: generate one meaningful aggregate update method when behavior list is empty.
- Business properties default to `ValueObject: true`; primitives are only for identity/technical fields unless repository conventions require otherwise.

## Repository Convention Scan

Before generation, detect and follow:

- `BaseEntity` constructor and base-call pattern.
- Namespace and file layout style.
- Persistence configuration folder conventions.
- Existing Value Object factory conventions (`From`, `Create`, `TryFrom`).
- Unit test stack and naming style.

Prefer repository conventions over defaults.

## Entity Generation Rules

Generate `Domain/Entities/<EntityName>.cs` with:

- `BaseEntity` inheritance.
- File-scoped namespace.
- `public get; private set;` properties only.
- No public constructors.
- Private parameterless constructor for EF Core.
- Private constructor(s) used by `From(...)`.
- Static `From(...)` factory with invariant enforcement.
- Domain methods that express intent, not generic property setters.
- Value Objects stored directly (never primitive `.Value` shadow storage).

For collections:

- Keep mutable list private (`List<T>`).
- Expose read-only view (`IReadOnlyCollection<T>`).
- Mutate only through explicit behavior methods.

## EF Core Configuration Rules

Generate `<EntityName>Configuration.cs` in the repository-standard persistence config folder.

- Implement `IEntityTypeConfiguration<<EntityName>>`.
- Configure key and required/optional semantics.
- Configure lengths/precision when inferable.
- Map Value Objects with `OwnsOne(...)` when appropriate.
- Keep mappings migration-friendly and convention-aligned.

## Unit Test Rules

Generate `Tests/Unit/Domain/Entities/<EntityName>Tests.cs` using xUnit and FluentAssertions.

Minimum coverage:

1. `From(...)` creates valid entity for valid input.
2. `From(...)` rejects missing required value objects.
3. Domain behavior methods update state correctly.
4. Invariants remain protected on invalid operations.
5. Entity API and business properties use value object types.
6. JSON serialization/deserialization round-trip preserves relevant state.

# Checklist

- Entity inherits `BaseEntity`.
- No public setters or public constructors.
- Private parameterless constructor exists for EF Core.
- `From(...)` exists and enforces invariants.
- Business properties are Value Object types.
- `From(...)` and domain methods accept Value Object parameters for business fields.
- Domain methods are intention-revealing.
- EF config maps required/optional fields and owned value objects correctly.
- Tests cover creation, validation failures, behaviors, invariants, and JSON round-trip.

# Output Format

Return:

1. Created/updated file paths.
2. Full compilable code for:
   - entity class
   - EF Core configuration class
   - unit test class
3. Assumptions (only when necessary).
4. Validation status (`dotnet build`/`dotnet test` if executed).

# Rules

- Preserve existing repository conventions over defaults.
- Keep entity behavior-rich; do not generate anemic models.
- Keep business properties and entity APIs Value Object based.
- Do not auto-generate one method per property unless explicitly requested.
- Do not add comments unless they materially improve clarity.
- Do not change unrelated files.

# Examples

- New entity request -> generate entity + EF config + tests with repository-aligned conventions.
- Refactor request -> preserve public contract intent while replacing primitive business fields with value objects.

# References

- [references/input-and-template.md](references/input-and-template.md)

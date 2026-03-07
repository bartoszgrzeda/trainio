---
name: dotnet10-ddd-domain-entity-generator
description: Generate production-ready .NET 10 DDD domain entities that inherit BaseEntity, enforce invariants through factory/domain methods, and include EF Core entity configuration plus xUnit + FluentAssertions unit tests. Use when creating or refactoring domain entities in Domain/Entities with encapsulation, Value Object handling, and practical persistence mapping.
---

# Dotnet10 DDD Domain Entity Generator

## Workflow

1. Parse entity input into a normalized model.
2. Inspect repository conventions before writing code.
3. Generate entity class in `Domain/Entities`.
4. Generate EF Core configuration class in infrastructure persistence config folder.
5. Generate unit tests in `Tests/Unit/Domain/Entities`.
6. Validate compile assumptions and return complete output.

Target runtime/language profile:

- .NET 10
- Modern C# style with nullable reference types enabled
- File-scoped namespaces

## 1) Parse Input

Accept either structured input or natural language and normalize to this shape:

```yaml
Entity: Customer
Properties:
  - Name: FirstName
    Type: string
    Required: true
    ValueObject: false
    Editable: true
  - Name: Email
    Type: EmailAddress
    Required: true
    ValueObject: true
    Editable: true
Behaviors:
  - Rename
  - ChangeContactDetails
ActivationSemantics: true
Collections:
  - Name: Orders
    ElementType: OrderReference
```

If details are missing, infer safe defaults:

- `Editable`: true for non-key business fields.
- `ActivationSemantics`: true when `IsActive` exists; otherwise false.
- `Behaviors`: if empty, generate a single meaningful aggregate update method, not one method per property.

Read [references/input-and-template.md](references/input-and-template.md) only when input format is ambiguous or the user requests examples.

## 2) Inspect Repository Conventions

Before generating files:

1. Locate `BaseEntity` and match constructor/base-call style.
2. Confirm namespace style (file-scoped expected) and naming conventions.
3. Detect infrastructure configuration folder pattern (for example `Infrastructure/Persistence/Configurations` or equivalent).
4. Confirm test stack (`xUnit`, `FluentAssertions`) and existing assertion style.
5. Detect Value Object creation conventions (`From`, `Create`, `TryFrom`) and use the existing pattern.

Prefer existing project conventions over defaults.

Base class contract to honor:

```csharp
public abstract class BaseEntity
{
    public Guid Id { get; private set; }

    protected BaseEntity(Guid id)
    {
        Id = id;
    }

    protected BaseEntity()
    {
        Id = Guid.NewGuid();
    }
}
```

## 3) Generate Domain Entity

Create `Domain/Entities/<EntityName>.cs` with these mandatory rules:

- Inherit from `BaseEntity`.
- Use file-scoped namespace.
- Provide `public get; private set;` properties only.
- No public constructors.
- Include a private parameterless constructor for EF Core.
- Include private constructor(s) used by `From(...)`.
- Expose `public static <EntityName> From(...)`.
- Enforce required-field and domain invariants in creation/update flows.
- Mutate state only through meaningful domain methods.
- Respect nullable reference types.
- Assign primitive fields only in constructor/factory/domain methods.
- Avoid comments unless they add real clarity.

### Entity rules

1. Keep model behavior-rich and non-anemic.
2. Use concise guard clauses:
   - required string: not null/whitespace
   - numeric amount/price: non-negative
   - required references/value objects: non-null
3. For Value Object properties:
   - use VO creation flow in `From(...)` and domain methods
   - prefer `<ValueObjectType>.From(...)`; fallback to repository pattern when different
4. For collection properties:
   - keep mutable collection private (`List<T>`)
   - expose read-only view (`IReadOnlyCollection<T>`)
   - modify through intention-revealing methods only
5. For behaviors:
   - if explicit behaviors are provided, generate those methods
   - if no behavior is provided, generate one sensible aggregate update method (for example `UpdateDetails(...)`)
   - do not auto-generate one method per property

### Constructor and factory pattern

- `From(...)` accepts required creation arguments.
- `From(...)` creates/validates Value Objects when needed.
- `From(...)` returns a valid instance through a private constructor.
- Keep invariant checks in shared private/internal guard logic where practical.
- Constructor should never be public.

## 4) Generate EF Core Configuration

Create `<EntityName>Configuration.cs` in the repository’s standard persistence configuration folder. If no pattern exists, default to:

- `Infrastructure/Persistence/Configurations/<EntityName>Configuration.cs`

Rules:

- Implement `IEntityTypeConfiguration<<EntityName>>`.
- Configure key (`HasKey(x => x.Id)`).
- Configure scalar properties with required/optional semantics.
- Configure maximum lengths/precision when inferable from existing conventions.
- Map Value Objects with `OwnsOne(...)` when appropriate.
- Avoid magic strings unless owned mapping requires explicit column naming.
- Keep configuration production-ready and consistent with existing migrations strategy.
- Keep namespaces and folder placement easy to adjust to repository conventions.

Value Object mapping defaults:

- Single-value VO: map `Value` property with explicit column name.
- Multi-field VO: map each member inside `OwnsOne` based on provided VO members.
- Optional VO: configure owned navigation as optional according to repository pattern.

## 5) Generate Unit Tests

Create `Tests/Unit/Domain/Entities/<EntityName>Tests.cs` with:

- `xUnit`
- `FluentAssertions`
- `System.Text.Json`
- clear Arrange / Act / Assert separation

Minimum test coverage:

1. `From(...)` creates valid entity for valid input.
2. `From(...)` rejects invalid required values.
3. Domain behavior methods update state correctly.
4. Invariants remain protected after invalid operations.
5. Value Object creation flow is exercised during entity creation/update when applicable.
6. JSON serialization and deserialization round-trip preserves relevant entity state.

Test naming style:

- `<Method>_Should_<Expected>_When_<Condition>`

## 6) Output Contract

For each entity request, always generate:

1. Entity class
2. EF Core configuration class
3. Unit test class

Return output with:

1. File paths
2. Full compilable code per file
3. Assumptions (only if required)
4. Validation status (`dotnet build`/test run if executed)

## Guardrail Checklist

Before finalizing, verify all are true:

- Entity inherits `BaseEntity`.
- No public setters.
- Private parameterless constructor exists.
- Static `From(...)` exists and enforces invariants.
- Domain methods express business intent.
- No setter-like method per property by default.
- Value Objects are created through VO creation flow.
- EF configuration maps required/optional fields and owned VOs.
- Unit tests cover creation, validation failures, behaviors, invariants, and VO usage.
- Unit tests cover JSON serialization/deserialization round-trip.

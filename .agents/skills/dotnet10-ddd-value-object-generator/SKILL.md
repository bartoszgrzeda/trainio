---
name: dotnet10-ddd-value-object-generator
description: Generate immutable Domain-Driven Design Value Objects for .NET 10 solutions, including a shared ValueObject base type, domain code in Domain/ValueObjects, xUnit + FluentAssertions unit tests in Tests/Unit/Domain/ValueObjects, and EF Core mapping guidance (value converter or OwnsOne). Use when creating or refactoring scalar or composite value objects from a specification containing name, properties, validation, scalar/composite shape, and normalization requirements.
---

# Dotnet 10 DDD Value Object Generator

## Workflow

1. Inspect repository conventions before generation.
2. Parse the input spec into a normalized generation model.
3. Choose `record` or `class` shape based on complexity.
4. Generate domain code in `Domain/ValueObjects`.
5. Generate unit tests in `Tests/Unit/Domain/ValueObjects`.
6. Generate EF Core mapping snippet where useful.
7. Validate code quality and compatibility assumptions.

## 1) Inspect Repository Conventions

Inspect local conventions with focused discovery:

- Find the domain project path and namespace style.
- Confirm whether file-scoped namespaces are used.
- Find existing value object patterns and exception style.
- Detect whether a shared base value object type exists (for example `Domain/Common/ValueObject.cs`).
- Find test naming patterns under `Tests/Unit`.
- Detect EF Core mapping style (`ValueConverter`, `OwnsOne`, configuration classes).

Prefer existing repository patterns over defaults.

## 2) Parse Input Specification

Accept and normalize:

- Value Object name
- Property list (name + type)
- Validation requirements
- Scalar or composite shape
- Normalization requirement

Input format example:

```text
ValueObject: EmailAddress
Properties:
- string Value
Validation:
- required
- valid email format
ScalarOrComposite: scalar
Normalization: trim + lower-invariant
```

```text
ValueObject: Money
Properties:
- decimal Amount
- string Currency
Validation:
- amount >= 0
- currency required
ScalarOrComposite: composite
Normalization: currency uppercase
```

If fields are missing, infer safe defaults and state assumptions in the final response.

## 3) Choose Value Object Shape

Choose by these rules:

- Prefer `public sealed record` for simple scalar wrappers.
- Prefer `public sealed record` for multi-property value objects unless repository conventions require class-based equality code.

Use:

- file-scoped namespaces
- inheritance from the repository base value object type (default: `ValueObject`)
- immutable API surface (`public get`, no public setters)
- private constructor for valid creation
- private parameterless constructor only when EF Core needs materialization support
- static `From(...)` factory for all construction
- optional `TryFrom(...)` when failure is expected to be handled without exceptions

## 4) Generate Domain Value Object Code

Place output file in:

`Domain/ValueObjects/<ValueObjectName>.cs`

Required generation rules:

- Target .NET 10 and modern C# style.
- Ensure generated value objects inherit the base value object type (for example `: ValueObject`).
- For generic optional wrappers (for example `Maybe<T>`), constrain generic arguments to value objects (`where T : ValueObject`).
- If the base type does not exist and the repository has no alternative, create `Domain/Common/ValueObject.cs` with an abstract base record/class matching local conventions.
- Keep object immutable.
- Enforce invariants in `From(...)`.
- Keep constructors non-public.
- Allow creation only through factory methods (`From(...)` and optional `TryFrom(...)`).
- Do not expose public setters.
- Prefer `public get; private init;`; use `private set;` only when EF Core materialization requires it.
- Keep JSON round-trip compatibility for tests (for example serializer-friendly constructor/attributes) without breaking encapsulation.
- Perform normalization inside `From(...)` before validation when applicable.
- If class-based, implement correct value-based equality.
- Keep implementation compile-ready and concise.
- Avoid unnecessary comments.

Validation heuristics to apply automatically when names match:

- `EmailAddress`: required + basic email pattern validation + trim/lower normalization.
- `PhoneNumber`: required + normalized canonical form + basic validity check.
- `Money`: non-negative amount + required currency + normalized uppercase currency.
- `Address`: required fields and non-empty key parts.
- `FullName`: non-empty required parts.
- `Percentage`: range check (typically 0 to 100 unless user specifies otherwise).

Reference templates:

- [references/scalar-value-object.cs.tpl](references/scalar-value-object.cs.tpl)
- [references/composite-value-object.cs.tpl](references/composite-value-object.cs.tpl)

Template placeholders:

- `{{OptionalEfCoreCtor}}`: include a private parameterless constructor only when EF Core materialization requires it.

## 5) Generate Unit Tests

Place output file in:

`Tests/Unit/Domain/ValueObjects/<ValueObjectName>Tests.cs`

Use:

- xUnit
- FluentAssertions

Minimum test coverage:

- successful creation through `From(...)`
- invalid input handling
- equality behavior
- normalization behavior if applicable
- JSON serialization and deserialization round-trip behavior

Reference template:

- [references/value-object-tests.cs.tpl](references/value-object-tests.cs.tpl)

Template placeholder:

- `{{InvalidExceptionType}}`: choose the repository-standard exception type (`ArgumentException`, domain exception, or equivalent).
- `{{SerializationAssertions}}`: optional extra assertions for round-trip values when equality alone is not sufficient.

## 6) Generate EF Core Mapping Guidance

Generate mapping guidance when useful:

- Scalar wrapper: include `ValueConverter<TValueObject, TPrimitive>` example.
- Composite value object: include `OwnsOne(...)` example.

Ensure snippets are compatible with entity configuration patterns used in the repo.

Reference examples:

- [references/ef-core-mapping-examples.md](references/ef-core-mapping-examples.md)

## 7) Output Contract

For each request, return:

1. Domain Value Object file content.
2. Unit test file content.
3. EF Core mapping hint/example when relevant.
4. Assumptions (only if required).

If generation introduced the base type file, include it in the output.

Keep output production-ready and copy-pasteable.

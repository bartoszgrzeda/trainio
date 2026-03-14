---
name: dotnet10-ddd-value-object-generator
description: Generate immutable Domain-Driven Design Value Objects for .NET 10 solutions, including a shared ValueObject base type, domain code in Domain/ValueObjects, xUnit + FluentAssertions unit tests in Tests/Unit/Domain/ValueObjects, and EF Core mapping guidance (value converter or OwnsOne). Use when creating or refactoring scalar or composite value objects from a specification containing name, properties, validation, scalar/composite shape, and normalization requirements.
---

# Purpose

Generate immutable, production-ready .NET 10 DDD Value Objects with invariant-enforcing factories, unit tests, and EF Core mapping guidance aligned to repository conventions.

# When to Use

- Creating a new scalar or composite Value Object.
- Refactoring primitive domain fields into Value Objects.
- Standardizing Value Object creation/equality patterns across a solution.
- Adding Value Object unit tests and EF mapping snippets.

Example prompts:
- "Create `EmailAddress` value object with trim/lower normalization and tests."
- "Generate a `Money` value object with `Amount` and `Currency` plus EF mapping guidance."
- "Refactor `PhoneNumber` to a value object with `From(...)` and `TryFrom(...)`."

# Workflow

1. Inspect repository conventions before generation.
2. Parse the input specification into a normalized model.
3. Choose Value Object shape (`record` or class-based pattern) using repository conventions.
4. Generate domain code in `Domain/ValueObjects`.
5. Generate unit tests in `Tests/Unit/Domain/ValueObjects`.
6. Generate EF Core mapping guidance where relevant.
7. Validate assumptions and return complete output.

## Repository Convention Scan

Detect and follow:

- Domain project path and namespace style.
- File-scoped vs block-scoped namespace convention.
- Existing Value Object base type pattern.
- Exception type conventions for validation failures.
- Test naming/layout patterns under `Tests/Unit`.
- EF Core mapping style (`ValueConverter` vs `OwnsOne`).

Prefer local conventions over defaults.

## Input Normalization

Normalize these inputs:

- Value Object name.
- Property list (name + type).
- Validation requirements.
- Scalar/composite shape.
- Normalization requirements.

If inputs are missing, infer safe defaults and state assumptions.

## Domain Generation Rules

Generate `Domain/ValueObjects/<ValueObjectName>.cs` with:

- Immutable API surface (`get` only or restricted init).
- Construction via `From(...)` (and optional `TryFrom(...)`).
- Non-public constructors.
- Invariant enforcement inside factory methods.
- Normalization before validation when required.
- Base Value Object type inheritance aligned with repository conventions.

Additional rules:

- Prefer `public sealed record` unless repository conventions require class-based equality.
- Add private parameterless constructor only when EF Core materialization requires it.
- Create `Domain/Common/ValueObject.cs` only if missing and no repository alternative exists.
- For generic optional wrappers (for example `Maybe<T>`), constrain to Value Object types.

Validation heuristics (apply when names clearly imply them):

- `EmailAddress`: required + basic email validation + trim/lower normalization.
- `PhoneNumber`: required + canonical normalization + basic validity.
- `Money`: non-negative amount + required uppercase currency.
- `Percentage`: explicit range validation.

## Unit Test Rules

Generate `Tests/Unit/Domain/ValueObjects/<ValueObjectName>Tests.cs` with xUnit + FluentAssertions.

Minimum coverage:

1. Successful `From(...)` creation.
2. Invalid input handling.
3. Equality semantics.
4. Normalization behavior (if applicable).
5. JSON serialization/deserialization round-trip.

## EF Core Mapping Guidance

Generate guidance when relevant:

- Scalar wrapper -> `ValueConverter<TValueObject, TPrimitive>` example.
- Composite Value Object -> `OwnsOne(...)` example.

# Checklist

- Purpose remained Value Object-focused and narrow.
- Repository conventions were inspected and applied.
- Value Object is immutable and factory-created.
- Invariants and normalization are enforced in `From(...)`.
- Constructors are non-public.
- Tests cover creation, failures, equality, normalization, and JSON round-trip.
- EF mapping guidance matches scalar/composite shape.

# Output Format

Return:

1. Created/updated file paths.
2. Full Value Object code.
3. Full unit test code.
4. EF Core mapping guidance (when relevant).
5. Assumptions (only when necessary).

If a base `ValueObject` type is introduced, include that file as well.

# Rules

- Keep scope limited to Value Object generation/refactoring.
- Preserve repository conventions over defaults.
- Do not expose public setters.
- Do not bypass factory methods for object creation.
- Do not add unrelated domain/entity/controller changes.
- Keep output compile-ready and concise.

# Examples

- Scalar request (`EmailAddress`) -> generate sealed scalar Value Object + tests + converter snippet.
- Composite request (`Money`) -> generate multi-field Value Object + tests + `OwnsOne` mapping snippet.

# References

- [references/scalar-value-object.cs.tpl](references/scalar-value-object.cs.tpl)
- [references/composite-value-object.cs.tpl](references/composite-value-object.cs.tpl)
- [references/value-object-tests.cs.tpl](references/value-object-tests.cs.tpl)
- [references/ef-core-mapping-examples.md](references/ef-core-mapping-examples.md)

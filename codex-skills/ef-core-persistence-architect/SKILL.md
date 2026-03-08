---
name: ef-core-persistence-architect
description: Implement and maintain Entity Framework Core persistence architecture in C#/.NET production codebases. Use when creating or refactoring entities, generic repositories, repository factories, Unit of Work, DbContext, entity configurations, dependency injection wiring, migration-safe persistence changes, or query safety improvements. Trigger for tasks mentioning EF Core, DbContext, repository pattern, repository factory, Unit of Work, entity mapping, persistence infrastructure, or database access behavior. Do not use for frontend/UI work, styling, presentation concerns, or non-persistence-only business logic changes.
---

# EF Core Persistence Architect

Apply this skill to evolve persistence code safely, incrementally, and idempotently.

## Execution Contract

- Analyze before modifying any file.
- Reuse existing persistence primitives before creating new ones.
- Prefer extending existing classes and interfaces over generating parallel implementations.
- Keep behavior migration-safe and compile-safe.
- Keep repository query/add methods asynchronous and cancellation-token aware.
- Keep repository methods free of `SaveChanges` calls.
- Keep deletes as hard deletes.
- Keep commits in application services through Unit of Work.

## Required Architecture Targets

Enforce or adapt to these architectural elements:

- Base entity (`Entity`) with `Guid Id`
- Generic repository (`IRepository<T>`, `EfRepository<T> where T : Entity`)
- Repository factory (`IRepositoryFactory`, `RepositoryFactory`)
- Unit of Work (`IUnitOfWork`, `UnitOfWork`)
- Application `DbContext` (prefer `AppDbContext : DbContext`)
- Entity configurations via `IEntityTypeConfiguration<T>`
- Dependency injection registration for persistence services
- Query safety practices (tracking policy, N+1 avoidance, projection, split queries)

When equivalent structures already exist (for example `BaseEntity`, `EfRepository<T>`, `ApplicationDbContext`), keep the existing names and conventions.

## Project Analysis Workflow

Run this sequence before writing code.

1. Detect the solution layout and naming conventions.
- Identify folders and namespaces for domain, infrastructure, and application layers.
- Reuse existing directory structure unless it is missing.

2. Detect existing persistence primitives.
- Locate `DbContext` implementations.
- Locate base entity type (for example `Entity`, `BaseEntity`, `AggregateRoot`).
- Locate existing repository abstractions and implementations.
- Locate existing repository factory abstractions and implementations.
- Locate Unit of Work abstractions and implementations.
- Locate existing DI registration entry points.

3. Detect entity inventory.
- Include classes inheriting the existing base entity.
- Also include domain model classes with `Guid Id` where that is the project’s entity indicator.

4. Detect configuration coverage.
- Check each entity for an existing `IEntityTypeConfiguration<T>` class.
- Check whether context uses `ApplyConfigurationsFromAssembly(...)`.

5. Detect behavior constraints.
- Verify repository methods avoid `SaveChanges`.
- Verify delete behavior is hard delete.
- Verify read methods default to `AsNoTracking()` unless explicit tracking is required.

## Adaptation Rules

- If base entity already exists, reuse it.
- If repository abstraction already exists, extend it to required API rather than introducing a second abstraction.
- If repository factory abstraction already exists, extend it rather than introducing duplicates.
- If Unit of Work already exists, align method signatures with required behavior.
- If DbContext already exists, add missing `DbSet<TEntity>` members and configuration wiring there.
- If configuration style already exists (fluent API in context vs separate classes), prefer current style unless separate configuration classes are already dominant or required by project policy.

## Base Entity Rules

- Ensure every persistent entity inherits the project base entity.
- Ensure base entity exposes `Guid Id`.
- Do not create a duplicate base entity class when one already exists.

## Repository Contract Rules

Expose this repository API exactly:

```csharp
Task<T?> GetByIdAsync(
    Guid id,
    CancellationToken cancellationToken);

Task<IReadOnlyList<T>> GetAllAsync(
    CancellationToken cancellationToken);

Task<IReadOnlyList<T>> GetByQueryAsync(
    Expression<Func<T, bool>> predicate,
    CancellationToken cancellationToken);

Task<bool> ExistsByQueryAsync(
    Expression<Func<T, bool>> predicate,
    CancellationToken cancellationToken);

Task AddAsync(
    T entity,
    CancellationToken cancellationToken);

void Update(T entity);

void Delete(T entity);
```

## Repository Factory Rules

```csharp
public interface IRepositoryFactory
{
    IRepository<T> Get<T>() where T : Entity;
}
```

- Implement `RepositoryFactory` with the active `DbContext` dependency.
- Construct repositories directly in `Get<T>()` (`new EfRepository<T>(_dbContext)`).
- Do not introduce open-generic DI registration for `IRepository<>` when constructor-based factory is used.

## Repository Implementation Rules

- Implement `EfRepository<T> where T : Entity` (or project-equivalent naming).
- Back implementation with `DbSet<T>`.
- Use `AsNoTracking()` by default for read operations.
- Make `GetByQueryAsync` return a list and keep filtering server-side.
- Make `ExistsByQueryAsync` use `AnyAsync`.
- Make `Update` and `Delete` synchronous state operations and never call `SaveChanges`.
- Keep query/add methods asynchronous and cancellation-token aware.
- Use hard deletes only.

## Unit Of Work Rules

- Provide `IUnitOfWork` and `UnitOfWork` (or align existing equivalents).
- Wrap the active `DbContext` instance.
- Expose `Task SaveChangesAsync(CancellationToken cancellationToken)`.
- Keep Unit of Work free of domain/business logic.

## DbContext Rules

- Use a single application context type (`AppDbContext : DbContext`) or extend existing primary context.
- Expose `DbSet<TEntity>` for each discovered entity.
- Apply configurations automatically, preferably with:

```csharp
modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
```

- Centralize EF Core provider and persistence configuration through DI.
- Preserve existing migrations and avoid destructive migration rewrites.

## Entity Discovery And Configuration Rules

For each discovered entity:

1. Ensure it is reachable by `DbContext` (`DbSet<TEntity>` exists).
2. Ensure configuration exists (`IEntityTypeConfiguration<TEntity>` preferred).
3. Ensure relationship mappings exist when navigation properties are present.
4. Ensure repository can operate on the entity type through generic constraints.

## Navigation And Relationship Rules

Detect and configure:

- Reference navigation (for example `Order.User`)
- Collection navigation (for example `User.Orders`)

Generate or update fluent mapping using explicit relationship configuration:

- `HasOne(...).WithMany(...)`
- `HasMany(...).WithOne(...)`
- explicit foreign key mapping
- appropriate delete behavior according to project rules

## Configuration Rules

Prefer separate configuration classes:

- `<EntityName>Configuration : IEntityTypeConfiguration<<EntityName>>`

Ensure each configuration defines:

- primary key
- required constraints
- string max lengths
- indexes for frequently queried fields
- relationships and foreign keys

## Index Rules

Add indexes when query behavior suggests it, especially:

- email/username lookups
- foreign keys
- fields used in repeated filters/searches

Example:

```csharp
builder.HasIndex(x => x.Email);
```

## Query Safety Rules

Apply these persistence safety defaults:

- Use `AsNoTracking()` for read-only queries.
- Prevent N+1 patterns by shaping queries and using `Include` only when navigation materialization is required.
- Prefer projection (`Select`) when full entity materialization is unnecessary.
- Prefer split queries (`AsSplitQuery`) for large graph loading when join explosion risk exists.

## Safe Code Modification Rules

Never overwrite blindly.

- Extend existing interfaces and classes.
- Add only missing members.
- Preserve method order/style where possible.
- Preserve existing migrations.
- Keep changes minimal and local.
- Keep code idempotent so reruns detect existing implementations and skip duplicates.

## Default Folder Convention (When Project Has No Convention)

Use this baseline only when the project has no established layout:

```text
Domain/
  Entities/

Infrastructure/
  Persistence/
    DbContext/
    Repositories/
    Configurations/
    UnitOfWork/

Application/
  Services/
```

## Implementation Procedure

1. Analyze and catalog existing persistence assets.
2. Decide reuse-vs-create for base entity, repository, repository factory, Unit of Work, and DbContext.
3. Patch repository abstraction to required API.
4. Patch repository implementation (`DbSet<T>`, no `SaveChanges`, hard delete).
5. Patch or create repository factory (`Get<T>() => new EfRepository<T>(_dbContext)`).
6. Patch or create Unit of Work wrapper.
7. Patch DbContext with missing `DbSet<TEntity>` and configuration scanning.
8. Patch or create entity configurations with keys, constraints, indexes, and relationships.
9. Patch DI registration (factory + Unit of Work).
10. Verify idempotency and compile safety.

## Validation Checklist

Complete before finishing:

- Build succeeds.
- No duplicate base entity/repository/UoW types introduced.
- No duplicate repository factory types introduced.
- Repository methods match required signatures.
- Repository implementation contains no `SaveChanges` invocation.
- `DbSet<TEntity>` exists for each discovered entity.
- Configurations are applied via context.
- DI registration includes repository factory and Unit of Work.
- Application command flows commit through Unit of Work.
- Deletes are hard deletes.
- Read queries default to no tracking.

## Reference Files

Load these only when needed:

- `references/example-implementation/Domain/Entities/Entity.cs`
- `references/example-implementation/Domain/Entities/User.cs`
- `references/example-implementation/Infrastructure/Persistence/Repositories/IRepository.cs`
- `references/example-implementation/Infrastructure/Persistence/Repositories/IRepositoryFactory.cs`
- `references/example-implementation/Infrastructure/Persistence/Repositories/EfRepository.cs`
- `references/example-implementation/Infrastructure/Persistence/Repositories/RepositoryFactory.cs`
- `references/example-implementation/Infrastructure/Persistence/UnitOfWork/IUnitOfWork.cs`
- `references/example-implementation/Infrastructure/Persistence/UnitOfWork/UnitOfWork.cs`
- `references/example-implementation/Infrastructure/Persistence/AppDbContext.cs`
- `references/example-implementation/Infrastructure/Persistence/Configurations/UserConfiguration.cs`
- `references/example-implementation/Application/Services/ExampleApplicationService.cs`
- `references/example-implementation/Infrastructure/DependencyInjection/PersistenceServiceCollectionExtensions.cs`

Use these examples as a baseline and adapt namespace/folder conventions to the target repository.

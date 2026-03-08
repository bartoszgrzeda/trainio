# Example Transformations

Use these examples as patterns when upgrading weak skills.

## Transformation 1: Vague Description -> Triggerable Description

### Before

```md
---
name: db-helper
description: Help with database tasks.
---
```

Problems:
- Too broad.
- Not triggerable.
- No boundaries.

### After

```md
---
name: sql-migration-reviewer
description: Review SQL migration scripts for safety, rollback readiness, and index risk. Use when requests involve migration diffs, schema changes, rollback planning, or deployment safety checks.
---
```

Why improved:
- Single clear purpose.
- Explicit trigger contexts.
- Better skill selection reliability.

## Transformation 2: Non-Operational Body -> Procedural Workflow

### Before

```md
# Purpose
Help with API design.

# Workflow
Think about the API and suggest improvements.
```

Problems:
- Workflow is not executable.
- No validation gates.
- No output contract.

### After

```md
# Purpose
Review REST endpoint contracts for consistency and backward compatibility.

# Workflow
1. Collect endpoint definitions, request/response DTOs, and versioning approach.
2. Validate naming and HTTP semantics (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).
3. Check compatibility risks (removed fields, type changes, status code changes).
4. Flag issues with priority and concrete fixes.
5. Output a contract-review report with pass/fail decisions.

# Checklist
- All endpoints reviewed.
- Compatibility risks documented.
- Required fixes include concrete patch guidance.
- Report includes severity and rationale.

# Output Format
- `# API Contract Review`
- `## Summary`
- `## Breaking Changes`
- `## Non-Breaking Improvements`
- `## Required Fixes`
```

Why improved:
- Clear sequence of actions.
- Verifiable completion criteria.
- Predictable output structure.

## Transformation 3: Overloaded Multi-Purpose Skill -> Narrow Composable Skills

### Before

```md
---
name: release-helper
description: Help with releases.
---

# Purpose
Handle release notes, changelog, version bumps, deployment, announcements, and postmortems.
```

Problems:
- Too many unrelated responsibilities.
- Low trigger precision.
- Hard to reuse safely.

### After

`release-helper` is split into three focused skills:

1. `changelog-generator`
   - Purpose: generate changelog entries from merged PRs.
2. `release-announcement-writer`
   - Purpose: draft release announcements for stakeholder channels.
3. `post-release-checklist-runner`
   - Purpose: run and report post-release validation checklist.

Each skill includes:
- narrow purpose
- trigger examples
- procedural workflow
- completion checklist
- output format

Why improved:
- Better discoverability and safer execution.
- Smaller context per task.
- Easier maintenance and iteration.

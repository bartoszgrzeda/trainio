---
name: skill-maintainer
description: Audit, standardize, and improve repository skills under `.agents` using a canonical SKILL.md structure plus complete support packs (`references/`, concrete examples, and helper artifacts such as `scripts/` or `assets/` when needed).
---

# Purpose

Maintain high-signal repository skills by auditing quality, standardizing structure, and ensuring each skill includes complete, usable support artifacts alongside `SKILL.md`.

# When to Use

- Auditing skill quality across `.agents`.
- Standardizing inconsistent `SKILL.md` files to canonical structure.
- Updating one or more existing skills without changing core scope.
- Creating a new repository skill with consistent conventions.

Example prompts:
- "Audit all skills in `.agents` and list P1/P2 fixes."
- "Standardize every `SKILL.md` in `.agents/skills` to canonical sections."
- "Improve this skill's triggerability without broadening scope."
- "Create a new focused skill for API deprecation planning."

# Workflow

1. Select operating mode (`audit`, `update`, `create`).
2. Discover target skills by scanning `.agents/**/SKILL.md`.
3. Load context progressively (`SKILL.md` first, then `references/`, `scripts/`, `assets/`) and inventory missing support artifacts.
4. Apply mode-specific procedure, including support-pack completion.
5. Verify checklist quality gates before final response.

## Audit Mode

1. Build skill inventory from `.agents/**/SKILL.md`.
2. Score each skill with [references/skill-quality-rubric.md](references/skill-quality-rubric.md).
3. Identify prioritized issues (`P1`, then `P2`, then `P3`).
4. Recommend minimal high-impact fixes per skill.
5. If requested, apply updates immediately.

## Update Mode

1. Preserve original skill purpose unless scope change is explicitly requested.
2. Standardize to canonical section order:
   - `Purpose`
   - `When to Use`
   - `Workflow`
   - `Checklist`
   - `Output Format`
   - `Rules`
   - `Examples`
   - `References`
3. Improve triggerability and procedural clarity.
4. Ensure a complete support pack exists for the skill:
   - `references/` docs for operational detail
   - `references/examples/` with at least one concrete example artifact
   - input/output schema examples when the skill has structured inputs/outputs
   - `scripts/` and/or `assets/` when deterministic generation or templates are needed
5. Create or update missing support files, keeping them concise and directly actionable.
6. Preserve useful project-specific conventions.

## Create Mode

1. Infer the narrowest useful skill scope.
2. Create a concise hyphen-case skill name.
3. Create folder with a required support pack:
   - `SKILL.md`
   - `references/` with focused guidance docs
   - `references/examples/` with concrete example files
   - input/output schema example files when relevant
   - `scripts/` and/or `assets/` when needed for deterministic execution
4. Author from [references/skill-template.md](references/skill-template.md).
5. Add realistic trigger prompts, quality gates, and explicit links to support files.

# Checklist

- Skill has one clear, narrow purpose.
- Frontmatter includes only `name` and `description`.
- Description is triggerable and concrete.
- `When to Use` includes explicit triggers and example prompts.
- Workflow is procedural and executable.
- Checklist contains quality gates, not generic advice.
- Output format is explicit when output shape matters.
- Rules include constraints and non-goals.
- References are used for heavy detail instead of bloated `SKILL.md` bodies.
- Skill ships with support artifacts beyond `SKILL.md` (references + examples at minimum).
- Input/output schema examples are included when the skill expects structured payloads.
- Every file linked in `References` exists and is usable.
- Structure and terminology align with repository conventions.

# Output Format

Use one of these formats.

## Audit Output

```md
# Skill Audit Summary

## Repository Coverage
- Root scanned: `.agents`
- Skills found: <count>

## Priority Queue
1. `<skill-name>` - P1 - <short reason>
2. `<skill-name>` - P2 - <short reason>

## Findings by Skill

### <skill-name>
- Score: <x>/30
- Strengths:
  - ...
- Issues:
  - [P1] ...
  - [P2] ...
- Recommended changes:
  1. ...
  2. ...
```

## Update Output

```md
# Skill Update Report: <skill-name>

## What Changed
1. ...
2. ...

## Why
- ...

## Result
- Scope preserved: yes|no
- Triggerability improved: yes|no
- Canonical structure coverage: <sections present>
```

## Create Output

```md
# New Skill Created: <skill-name>

## Purpose
- ...

## Files
- `SKILL.md`
- `references/...`
- `references/examples/...`
- `<any scripts/assets/schema examples created>`

## Support Pack
- References added:
  - ...
- Examples added:
  - ...
- Optional helpers added (`scripts/` or `assets/`):
  - ...

## Trigger Examples
- ...
- ...
```

# Rules

- Do not broaden skill scope unnecessarily.
- Prefer improving existing skills over full rewrites unless structure is severely broken.
- Preserve useful repository-specific conventions and examples.
- Prioritize explicit triggers over abstract wording.
- Prioritize operational steps over generic advice.
- Keep descriptions concise and optimized for skill selection.
- Explain what changed and why when applying updates.
- Always produce a complete support pack for created/updated skills (`references/` plus concrete examples at minimum).
- Do not ship `SKILL.md`-only skills unless the user explicitly requests a minimal draft.
- Keep auxiliary files purposeful, scoped, and directly helpful for execution.

# Examples

- Audit -> score all skills in `.agents` and prioritize P1/P2 fixes.
- Update -> rewrite a weak `SKILL.md` into canonical structure while preserving purpose.
- Create -> generate a narrowly scoped skill folder with triggerable docs, references, concrete examples, and helper artifacts.

# References

- [references/skill-quality-rubric.md](references/skill-quality-rubric.md)
- [references/skill-template.md](references/skill-template.md)
- [references/example-transformations.md](references/example-transformations.md)

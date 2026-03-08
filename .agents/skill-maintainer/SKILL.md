---
name: skill-maintainer
description: Audit, standardize, and improve repository skills under `.agents` using a canonical SKILL.md structure with clear triggers, procedural workflows, quality checklists, output contracts, and scoped rules.
---

# Purpose

Maintain high-signal repository skills by auditing quality, standardizing structure, and applying minimal, purpose-preserving improvements.

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
3. Load context progressively (`SKILL.md` first, then `references/`, `scripts/`, `assets/` as needed).
4. Apply mode-specific procedure.
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
4. Move heavy details/examples to `references/` when useful.
5. Preserve useful project-specific conventions.

## Create Mode

1. Infer the narrowest useful skill scope.
2. Create a concise hyphen-case skill name.
3. Create folder with `SKILL.md` and optional `references/`, `scripts/`, `assets/`.
4. Author from [references/skill-template.md](references/skill-template.md).
5. Add realistic trigger prompts and quality gates.

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
- Avoid auxiliary documentation files unless explicitly requested.

# Examples

- Audit -> score all skills in `.agents` and prioritize P1/P2 fixes.
- Update -> rewrite a weak `SKILL.md` into canonical structure while preserving purpose.
- Create -> generate a narrowly scoped skill folder with triggerable docs and references.

# References

- [references/skill-quality-rubric.md](references/skill-quality-rubric.md)
- [references/skill-template.md](references/skill-template.md)
- [references/example-transformations.md](references/example-transformations.md)

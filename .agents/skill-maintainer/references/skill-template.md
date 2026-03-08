# Skill Template

Use this template to create new skills with consistent, high-signal structure.

## Template

```md
---
name: <skill-name>
description: <what this skill does + when to use it + concrete trigger contexts>
---

# Purpose

<One clear mission for this skill. Keep scope narrow.>

# When to Use

- <Trigger condition 1>
- <Trigger condition 2>
- <Trigger condition 3>

Example prompts:
- "<Realistic user prompt 1>"
- "<Realistic user prompt 2>"
- "<Realistic user prompt 3>"

# Workflow

1. <Step 1: inspect context>
2. <Step 2: decide mode/approach>
3. <Step 3: execute core actions>
4. <Step 4: verify quality constraints>
5. <Step 5: return output in required format>

# Checklist

- <Purpose stayed narrow and unchanged>
- <Required inputs validated or assumptions stated>
- <All critical steps executed>
- <Output matches expected format>
- <Constraints/non-goals respected>

# Output Format

<Define exact response shape when output matters. Include headings or templates if useful.>

# Rules

- <Do this>
- <Do not do this>
- <Non-goal 1>
- <Non-goal 2>

# Examples

- <Input scenario -> expected behavior summary>
- <Input scenario -> expected behavior summary>

# References

- [references/<doc-1>.md](references/<doc-1>.md)
- [references/<doc-2>.md](references/<doc-2>.md)
```

## Authoring Notes

- Keep frontmatter to `name` and `description` only.
- Make description triggerable, not marketing-style.
- Prefer operational verbs: `scan`, `validate`, `generate`, `patch`, `report`.
- Keep `SKILL.md` procedural; move detailed material to `references/`.
- Add `scripts/` only for deterministic repeated operations.
- Add `assets/` only for output artifacts/templates.
- Avoid multi-purpose "do everything" skills.

## Description Quality Pattern

Use this pattern:

`<Primary capability>. Use when <trigger 1>, <trigger 2>, or <trigger 3>.`

Example:

`Generate API deprecation plans with migration guidance and rollout checkpoints. Use when requests mention endpoint sunsets, client migration timelines, compatibility windows, or communication plans.`


# Skill Quality Rubric

Use this rubric to audit skill quality and prioritize fixes.

## Scoring Model

- Score each criterion from `0` to `3`.
- Total score range: `0-30` (10 criteria).

Score meanings:
- `0`: Missing or unusable.
- `1`: Present but weak, vague, or unreliable.
- `2`: Good baseline, usable with minor issues.
- `3`: Clear, operational, and high-signal.

Quality bands:
- `0-14`: Failing. Needs major rewrite.
- `15-22`: Functional but inconsistent. Needs targeted updates.
- `23-27`: Good. Minor polish only.
- `28-30`: Excellent. Keep stable.

## Criteria

| # | Criterion | What to Evaluate | Strong Signal (`3`) | Common Failure (`0-1`) |
|---|---|---|---|---|
| 1 | Purpose Clarity | One clear job, no mixed mission | Purpose is specific and bounded | Purpose is broad ("help with coding") |
| 2 | Description Quality | Trigger-oriented frontmatter description | Description states what + when to use | Description is generic or lacks trigger context |
| 3 | Triggerability | Explicit triggers and realistic prompt examples | Multiple concrete prompts match likely requests | No trigger examples or abstract wording |
| 4 | Workflow Quality | Procedural, executable steps | Ordered steps with decisions and actions | Vague tips, no sequence, no execution path |
| 5 | Checklist Quality | Completion gates and verification points | Checklist blocks low-quality output | Checklist is generic or non-actionable |
| 6 | Output Clarity | Expected output structure/content | Output format sections or templates are explicit | No output contract for important outputs |
| 7 | Rules Quality | Constraints, non-goals, and safety bounds | Clear do/do-not rules prevent drift | No limits; skill can become generic assistant |
| 8 | Scope Control | Narrow and composable design | Skill stays single-purpose; split guidance exists | Skill tries to handle unrelated tasks |
| 9 | Support Pack Quality | Completeness and usefulness of `references/`, examples, and helper artifacts | References are practical, at least one concrete example exists, and support files (schemas/scripts/assets) are present when relevant | Missing references/examples, broken links, or `SKILL.md`-only delivery |
| 10 | Convention Fit | Consistency with repository patterns | Structure and terminology align with repo style | Ignores local conventions or naming patterns |

## Priority Mapping

Use these priorities for audit findings.

- `P1`: Blocks reliable execution or selection.
  - Missing/weak description, no workflow, no purpose, severe scope drift.
  - Missing required support pack (no references/examples for a created or updated skill).
- `P2`: Significant quality or maintainability risk.
  - Weak checklist, unclear output format, inconsistent structure, or shallow support artifacts.
- `P3`: Minor polish.
  - Wording, formatting, light consistency improvements.

## Audit Procedure

1. Read `SKILL.md` frontmatter and body.
2. Inspect `references/` and `references/examples/` for every skill; inspect `scripts/` and `assets/` when relevant.
3. Score all 10 criteria.
4. Record concrete evidence for each criterion scored `0` or `1`.
5. Propose minimal high-impact fixes first (`P1`, then `P2`).

## Skill Audit Worksheet (Per Skill)

```md
### <skill-name>
- Path: <path>
- Total Score: <x>/30

Scores:
1. Purpose Clarity: <0-3>
2. Description Quality: <0-3>
3. Triggerability: <0-3>
4. Workflow Quality: <0-3>
5. Checklist Quality: <0-3>
6. Output Clarity: <0-3>
7. Rules Quality: <0-3>
8. Scope Control: <0-3>
9. Support Pack Quality: <0-3>
10. Convention Fit: <0-3>

Top Issues:
- [P1/P2/P3] <issue> -> <fix>
- [P1/P2/P3] <issue> -> <fix>
```

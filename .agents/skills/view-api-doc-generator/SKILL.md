---
name: view-api-doc-generator
description: Generate or refresh unified API documentation in `docs/api.md` from `**/*.view.md` files. Use when API endpoints must be extracted from view specs, merged by `METHOD + path`, enriched with view usage metadata and inferred payload/parameter examples, then regenerated idempotently with safe generated-section markers.
---

# View API Doc Generator

## Workflow

1. Run `python3 .agents/skills/view-api-doc-generator/scripts/generate_api_docs.py` from the repository root.
2. Review generated endpoint sections in `docs/api.md`, especially `### Notes` assumptions.
3. If assumptions are too broad, improve the source `.view.md` files (`API`, `Data Model`, `Actions`, `Rules`, `States`) and rerun.

## What This Skill Does

- Scan `**/*.view.md` files in the repository (excluding hidden/tooling directories like `.agents`).
- Parse frontmatter metadata (`id`, `name`, `route`, `title`) to identify which views use each endpoint.
- Parse endpoint rows from the `## API` table.
- Parse JSON examples from `## Data Model` and use them to infer request/response structures.
- Extract path/query parameters from endpoint templates.
- Infer parameter types and examples with deterministic rules.
- Merge duplicate endpoint definitions by `HTTP method + endpoint path`.
- Sort output deterministically by path, then method.
- Generate one unified API reference in `docs/api.md`.

## Generated Section Contract

The script updates only a generated block marked by:

- `<!-- GENERATED SECTION -->`
- `<!-- GENERATED SECTION START -->`
- `<!-- GENERATED SECTION END -->`

Behavior:

- If `docs/api.md` does not exist, create it with header + generated block.
- If `docs/api.md` exists and markers are present, replace only the generated block.
- If the file exists without markers, append a generated block without deleting existing content.
- Parse existing endpoint `### Notes` and keep them for matching endpoints during refresh.

## Inference Rules

- Prefer explicit JSON in API table `request`/`response` cells.
- Expand shorthand objects (for example `{ trainingId, status: "started" }`) to valid JSON.
- Use `Data Model` examples first for payload fields and parameter examples.
- If data is missing, infer types/examples from naming conventions:
  - `id` / `*Id` -> `string`
  - `date` -> `string (date)`
  - `time` -> `string`
  - `status` -> `string`
  - `count` / `total` -> `number`
- When inference is uncertain, document assumptions in `### Notes`.

## Command Options

- `--repo-root <path>`: repository root (default: `.`)
- `--views-glob <glob>`: view discovery pattern (default: `**/*.view.md`)
- `--output <path>`: target API doc path relative to repo root (default: `docs/api.md`)

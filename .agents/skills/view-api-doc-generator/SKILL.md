---
name: view-api-doc-generator
description: Generate or refresh unified API documentation in `docs/api.md` from `**/*.view.md` files. Use when API endpoints must be extracted from view specs, merged by `METHOD + path`, enriched with view usage metadata and inferred payload/parameter examples, then regenerated idempotently with safe generated-section markers.
---

# Purpose

Generate and maintain `docs/api.md` from view specs by extracting endpoint contracts, merging duplicates deterministically, and preserving manual notes safely.

# When to Use

- Building initial API documentation from `*.view.md` files.
- Refreshing `docs/api.md` after view spec changes.
- Consolidating endpoint definitions across multiple screens.
- Producing deterministic, idempotent API docs with generated-section markers.

Example prompts:
- "Generate `docs/api.md` from all view specs."
- "Refresh API docs after updating `docs/views/client.view.md`."
- "Rebuild endpoint docs and keep existing manual notes where possible."

# Workflow

1. Run the API doc generator script from repository root.
2. Review generated endpoint content and assumptions.
3. Refine source view specs when assumptions are too broad.
4. Rerun generator until output is accurate and stable.

## Command

Run:

```bash
python3 .agents/skills/view-api-doc-generator/scripts/generate_api_docs.py
```

Optional flags:

- `--repo-root <path>`
- `--views-glob <glob>`
- `--output <path>`

## Generation Behavior

The generator:

- scans `**/*.view.md` (excluding tooling/hidden dirs)
- parses frontmatter metadata (`id`, `name`, `route`, `title`)
- extracts endpoint rows from `## API`
- infers request/response examples from explicit JSON and data model blocks
- merges duplicates by `METHOD + path`
- sorts deterministically by path, then method
- updates only the generated section in `docs/api.md`

Generated markers:

- `<!-- GENERATED SECTION -->`
- `<!-- GENERATED SECTION START -->`
- `<!-- GENERATED SECTION END -->`

# Checklist

- Script executed from repository root.
- Endpoint extraction covered all relevant `*.view.md` inputs.
- Duplicate endpoints were merged by `METHOD + path`.
- Existing manual notes were preserved for matching endpoints.
- Inference assumptions are documented when data is uncertain.
- Output is deterministic and idempotent across reruns.

# Output Format

Return:

1. Target file path (`docs/api.md`).
2. Summary of generated/updated endpoint coverage.
3. Notable assumptions that require source spec refinement.
4. Re-run guidance when source view specs need clarification.

# Rules

- Prefer explicit API/data model JSON over inferred structures.
- Keep generated output deterministic; avoid manual ad hoc edits in generated block.
- Do not delete non-generated content in `docs/api.md`.
- Do not change source view specs unless explicitly requested.
- Document inference uncertainty in endpoint notes.

# Examples

- First-time docs generation -> create `docs/api.md` with header + generated block.
- Existing docs refresh -> replace only generated block and preserve surrounding manual sections.

# References

- [scripts/generate_api_docs.py](scripts/generate_api_docs.py)

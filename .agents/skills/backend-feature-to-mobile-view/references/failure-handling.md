# Failure Handling Matrix

Use this matrix to keep execution deterministic and transparent.

| Stage | Failure Signal | Action | Report Requirement |
|---|---|---|---|
| `analysis` | Missing endpoint list or schema constraints | Stop generation and request missing required inputs | List exact missing artifacts and why they block inference |
| `analysis` | Partial backend state model | Continue with minimal assumptions | Mark each assumption and risk level |
| `spec_generation` | Missing required sections in generated `*.view.md` | Re-run `mobile-view-spec-assistant` once with targeted correction prompt | Record what was missing and what changed |
| `spec_generation` | Endpoint/state mismatch vs backend digest | Re-run refinement once; if mismatch remains, stop before RN stage | Provide mismatch table and unresolved items |
| `rn_generation` | Missing `docs/app-shell.md` or unresolved target view path | Block RN stage | Provide required file path/action to unblock |
| `rn_generation` | Generated code violates spec constraints | Run one correction pass in `rn-view-generator` | Record violated constraints and fix status |
| `verification` | Required command fails | Keep artifacts, mark verification as failed | Include command, failure output summary, and next step |
| `verification` | E2E unavailable/blocked | Report blocker explicitly, do not claim full verification | State missing dependency/configuration |

## Severity

- `P1`: cannot preserve backend source-of-truth integrity (must stop or block next stage)
- `P2`: partial generation succeeded with explicit assumptions/deviations
- `P3`: non-blocking quality improvements only

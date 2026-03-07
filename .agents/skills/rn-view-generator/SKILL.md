---
name: rn-view-generator
description: Generate implementation-ready React Native TypeScript screen code from markdown view specifications by combining shared app rules from `docs/app-shell.md` with one screen spec from `docs/views/*.view.md`. Use when asked to turn view specs into production-grade RN screens, including state handling, actions, navigation, typed models, and shell-consistent layout behavior.
---

# RN View Generator

## Workflow

1. Resolve input files.
   - Read `docs/app-shell.md` and one target `docs/views/*.view.md`.
   - If multiple `docs/views/*.view.md` files exist and no target is named, pick the file implied by the request text.
   - Ask a clarifying question only when selecting the target view file is impossible.
2. Build a two-layer interpretation.
   - Extract global shell constraints from `docs/app-shell.md`.
   - Extract screen behavior and screen content from the target `docs/views/*.view.md`.
3. Merge with explicit precedence.
   - Treat `docs/app-shell.md` as source of truth for global patterns, shared components, naming conventions, permissions, and cross-screen behavior.
   - Treat `docs/views/*.view.md` as source of truth for this screen's content, actions, data, states, and navigation outcomes.
   - Avoid duplicating shell-level logic inside the generated screen unless required for screen behavior.
4. Generate implementation-ready RN TypeScript code.
   - Produce one main screen component with realistic hooks, handlers, rendering helpers, and typed models.
   - Keep code production-oriented; avoid pseudo-code.
5. Return output in the required response format.
   - `Interpretation`
   - One code block containing the main generated code
   - Optional `Assumptions`
   - Optional `Suggested companion files`

## Extraction Checklist

Extract from `docs/app-shell.md`:
- Layout mode and platform assumptions
- Bottom navigation rules
- Shared layout rules
- Spacing scale
- Minimum tap targets
- Global states
- Shared components
- Permissions and roles
- Route naming and action naming conventions
- Cross-screen behaviors (safe-area, back behavior, shell persistence)

Extract from `docs/views/*.view.md`:
- Screen identity: `id`, `name`, `route`, `title`, `description`
- Screen purpose and user goal
- Sections and rendering rules
- Visible data fields
- Interaction behavior
- Action definitions
- Data model
- API contract
- State handling
- Edge cases
- Navigation rules
- Assumptions and notes

## Code Generation Rules

Apply these implementation rules:
- Use React Native with TypeScript.
- Use functional components and hooks.
- Use React Navigation style APIs for navigation.
- Derive component names from metadata and file purpose (`docs/views/home.view.md` -> `HomeScreen`, `docs/views/clients-list.view.md` -> `ClientsListScreen`).
- Generate supporting interfaces/types from the data model.
- Implement defined states (`default`, `loading`, `error`, `empty`, `offline`, `disabled`, etc.) exactly as specified.
- Implement section renderers based on the `Sections` spec.
- Implement action handlers based on the Actions table/section.
- Add API integration placeholders or lightweight service calls from the API section.
- Preserve route names, labels, messages, state names, and action behavior exactly.
- Preserve hidden-vs-disabled differences exactly.
- Implement success navigation behavior where specified.
- Keep list rendering idiomatic (`FlatList` or `SectionList`) when lists are defined.
- Add pull-to-refresh behavior only when the spec defines it.
- Implement sorting/filtering logic only when the spec defines it.
- Implement explicit status mappings when the spec defines them.
- Use local device time formatting when the spec requires local time.
- Preserve explicit API order rules.
- Respect mobile-first constraints (320-480px) unless shell says otherwise.
- Respect shell safe-area and bottom navigation overlap rules.
- Use shared shell components (`BottomMenu`, `GlobalHeader`, `StatusBanner`, `LoadingSkeleton`) when referenced; assume they exist and import them.
- Do not regenerate app-shell code unless explicitly requested.
- Do not invent product features missing from specs.

## Output Contract

Structure every response in this order:
1. `Interpretation` section with a brief summary of how shell and view specs were merged.
2. One main code block containing the generated screen implementation.
3. Optional `Assumptions` section only for missing or ambiguous input.
4. Optional `Suggested companion files` section for hooks, services, mappers, constants, or tests.

Keep output implementation-focused and concise.

## Ambiguity Handling

- Prefer best-effort generation over blocking questions.
- Ask questions only when the input is critically incomplete (for example: missing target screen file with no way to infer it).
- Make the smallest reasonable assumption when details are missing.
- Mark assumptions explicitly and keep them minimal.

## Quality Checklist

Before returning output, verify:
- Global shell logic is inherited, not duplicated.
- Screen behavior matches the selected `docs/views/*.view.md`.
- Types align with declared data model and API payloads.
- State transitions cover all declared states and edge cases.
- Actions, disabled rules, visibility rules, and navigation targets match spec wording.
- Output includes exactly one main code block after `Interpretation`.

## Typical Triggers

Handle prompts such as:
- "Generate `HomeScreen` from `docs/app-shell.md` and `docs/views/home.view.md`."
- "Implement `docs/views/clients-list.view.md` as a React Native TypeScript screen."
- "Create `TrainingDetailsScreen` using app shell rules and this view spec."
- "Turn `docs/views/settings.view.md` into production-ready RN code with types and state handling."

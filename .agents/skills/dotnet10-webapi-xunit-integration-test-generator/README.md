# Dotnet 10 Web API xUnit Integration Test Generator

This skill generates and updates production-quality integration tests for .NET 10 ASP.NET Core Web APIs using xUnit, `WebApplicationFactory<Program>`, and real `HttpClient` calls.

## When to use

Use when you want Codex to add or extend API integration coverage for controllers or Minimal APIs, including auth, validation, ProblemDetails, persistence, pagination, and filtering behavior.

## Included files

- `SKILL.md`: Trigger rules, workflow, generation standards, output contract.
- `docs/checklist.md`: Endpoint analysis + quality checklist.
- `docs/decision-rules.md`: Dependency/DB/auth/fallback decision rules.
- `templates/request-template.md`: User request intake template.
- `templates/custom-webapplicationfactory-template.cs.md`: Factory scaffold.
- `templates/test-auth-template.cs.md`: Test authentication scaffold.
- `templates/integration-test-template.cs.md`: Endpoint test class scaffold.

## Maintenance notes

1. Keep `SKILL.md` concise and procedural; move detailed examples to `docs/` and `templates/`.
2. Update templates when your repository conventions evolve.
3. Re-check `agents/openai.yaml` after changing `SKILL.md` name/description/default prompt.
4. Keep this skill focused on `.NET 10 + ASP.NET Core Web API + xUnit + WebApplicationFactory` only.

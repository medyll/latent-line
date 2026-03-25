# STORY-002: Add CI workflow

Title: Add CI to run lint, typecheck, unit and e2e tests
Points: 5

Description:
Create a GitHub Actions workflow in .github/workflows/ci.yaml that installs dependencies and runs tests.

Acceptance:

- Workflow file exists and is syntactically valid YAML.
- Running same commands locally exits 0 (when environment allows Playwright).

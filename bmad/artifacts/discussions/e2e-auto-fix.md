Title: Automated E2E Fix Orchestration

User note: "il me pose trop de questions, moi je veux que ça marche. Chacun son rôle." — auto-fix requested.

Summary:

- I will act as executor: collect traces, triage failures, open fix stories, and create a short remediation plan. No blocking questions unless strictly required.

Actions queued:

1. Capture Playwright traces and test-results (already produced under `test-results/`).
2. Create prioritized bug stories for the top failures (selection toggles, asset counts, snapshot drift).
3. Provide concrete reproduction steps and quick fixes (selector robustness, timing waits, snapshot review).
4. Mark E2E work as in_progress and recommend `bmad dev review <story>` for implementers.

State: started by bmad-master (auto). See `bmad/status.yaml` for current recommendation.

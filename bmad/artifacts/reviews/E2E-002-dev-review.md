E2E-002: Dev Review — Playwright E2E failures

Summary:

- Run: Playwright E2E
- Result: 5 passed, 21 failed
- Key failure patterns:
  1. Navigation/page load failures (net::ERR_ABORTED) causing many timeouts
  2. Selection assertions: aria-selected remains "false" after clicks
  3. Asset counts mismatch (expected 5, received 6)
  4. Export/download button not found in some flows
  5. Visual snapshot diffs (Windows baseline mismatch / element size changes)

Diagnostics produced by the test run are in test-results/ (error-context and screenshots). See the failing test list in: e2e/ and the specific error-context.md files under test-results/\*.

Recommendations / Next steps (high priority):

1. Reproduce a single failing test locally with verbose output and trace:
   - pnpm exec playwright test e2e/event-editing.spec.ts -g "Event editing via PropertiesPanel" --trace on
2. Stabilize dev server startup in tests:
   - Confirm webServer in playwright.config.ts uses the same dev command and waits for readiness; consider adding a health-check wait (e.g., curl / or wait-for output) before running tests.
3. Investigate selection issues:
   - Add debug traces in UI code path where aria-selected is set; ensure click handlers update selection state synchronously or await state updates before asserting.
4. Fix flakey counts and missing elements:
   - Add deterministic test setup (seed model/template) so initial counts are stable.
5. Visual snapshots:
   - Regenerate baseline images on the target CI platform, or make snapshots tolerant to small layout differences (use trimmed regions or tolerances).

Suggested immediate commands:

- Re-run a single failing test with trace/traceViewer for deeper inspection.
- Run failing tests in headed mode to watch UX: pnpm exec playwright test --headed

Proposed follow-up: implement fixes in code (selectors/timeouts/server wait), then re-run full e2e and integrate into CI. Mark story E2E-002 as "in_progress" and assign to test owner.

Generated-by: bmad-master (dev review)

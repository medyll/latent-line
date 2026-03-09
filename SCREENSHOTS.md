# Screenshot Baseline Management

## Overview

This document explains how to capture and manage baseline screenshots for visual regression testing (TST-001, TST-002).

## Baseline Directory

Baseline screenshots are stored in `.github/screenshots/baseline/`

**Accepted file types:** PNG, JPEG
**Resolution:** 1920×1080 (standard)
**Browser:** Chromium (Playwright default)

## Components Covered

The following 14 components have baseline screenshots:

1. **SequenceOrchestrator** — Full page view (Synoptic + Temporal + Audio)
2. **Synoptic View** — Grid event view (top pane)
3. **Temporal Sequencer** — Timeline view with playhead and zoom
4. **AudioTimeline** — Multi-track audio lanes with mute/solo
5. **PropertiesPanel (empty)** — No event selected
6. **PropertiesPanel (event)** — Event selected showing camera/lighting/FX
7. **PropertiesPanel (actor)** — Actor speech editing section
8. **CharacterField** — Character dropdown and inline edit
9. **AssetManager** — Characters and assets sidebar
10. **SystemFooter** — Config controls (checkpoint, sampler, seed)
11. **Home Page** — Landing/navigation page
12. **Timeline Page** — Full layout with all components
13. **Empty States** — No events, no assets, no selection
14. **Component Details** — Specific UI elements in isolation

## How to Capture Baselines Manually

### Prerequisites

```bash
npm install --save-dev @playwright/test
```

### Capture Steps

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Use Playwright Inspector to capture:
   ```bash
   npx playwright codegen http://localhost:5173/timeline
   ```

3. Navigate to desired state (select event, add audio track, etc.)

4. In codegen, use `await page.screenshot({ path: '.github/screenshots/baseline/component-name.png' })`

5. Save each screenshot to `.github/screenshots/baseline/` with descriptive name

### Alternatively: Manual Screenshotting

1. Open http://localhost:5173/timeline in Chrome
2. Use DevTools (`F12`) → "Capture full page screenshot" feature
3. Save as `.png` to `.github/screenshots/baseline/`

## Verification Checklist

After capturing each baseline, verify:

- [ ] No visual glitches (clipping, overlapping text, broken layout)
- [ ] All interactive elements visible and properly styled
- [ ] Font rendering correct
- [ ] Colors accurate (not over-saturated or washed out)
- [ ] Component heights/widths as expected

## Using Baselines in TST-002

Baselines serve as reference images for visual regression detection:

```bash
npm run test:visual  # Compares current screenshots to baselines
```

Diff images generated in `.github/screenshots/diffs/` show pixel-level changes.

## Updating Baselines

When intentional UI changes are made:

```bash
npm run test:visual:update  # Refreshes all baseline screenshots
```

**Only commit baseline updates with intentional UI changes!**

## CI Integration

GitHub Actions runs visual regression checks on every PR:

```yaml
- name: Visual Regression Tests
  run: npm run test:visual
```

Failure blocks PR merge; manual review required for intentional changes.

## Troubleshooting

**Screenshots are blank or white:**
- Ensure app is fully loaded before capturing
- Check viewport size (1920×1080)
- Try with `fullPage: true` if component extends beyond viewport

**Different results on different machines:**
- Use Docker for CI consistency
- Ensure Chromium version is same as Playwright's bundled version
- Use same OS/display settings for local captures

## References

- [Playwright Screenshots API](https://playwright.dev/docs/api/class-page#page-screenshot)
- [Visual Regression Testing Guide](https://playwright.dev/docs/test-snapshots)

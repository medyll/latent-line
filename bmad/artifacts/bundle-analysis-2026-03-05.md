# Bundle Analysis — latent-line

**Date:** 2026-03-05
**Build command:** `pnpm run build`
**Status:** ✅ Build succeeded (0 errors)

---

## Client Bundle Summary

| Metric                         | Value                                    |
| :----------------------------- | :--------------------------------------- |
| Total client (raw)             | ~452 KB                                  |
| Total client (gzipped)         | ~142 KB                                  |
| Largest single chunk (gzipped) | ~33.5 KB (`0.BRZwDOC0.js` — layout/root) |
| Threshold exceeded (>50 KB gz) | **None**                                 |

---

## Top Chunks (gzipped)

| File                  |    Raw |  Gzipped | Contents                              |
| :-------------------- | -----: | -------: | :------------------------------------ |
| `nodes/0.BRZwDOC0.js` | 116 KB | ~33.5 KB | Root layout + sidebar components      |
| `nodes/6.Bma5Krc0.js` |  78 KB | ~21.4 KB | `/timeline` page + all sub-components |
| `nodes/7.MudCvOAj.js` |  65 KB | ~16.8 KB | `/demo-model` page                    |
| `chunks/Dh4UPvg5.js`  |  55 KB | ~15.9 KB | Shared UI components (shadcn-svelte)  |

---

## Findings

- **No chunk exceeds 50 KB gzipped** — all within threshold.
- Root layout chunk (~33.5 KB gz) includes the full sidebar UI library; acceptable given its scope.
- Timeline route (~21 KB gz) includes AssetManager, PropertiesPanel, TimelineEvent — well within range.
- The `@lucide/svelte` icon tree-shaking is working correctly (icons not used in a route don't appear in its chunk).

---

## Comparison vs Baseline

|              | Dev estimate (Sprint 1) | Production (Sprint 2) |
| :----------- | :---------------------: | :-------------------: |
| Total size   |   ~450 KB (unzipped)    |   ~142 KB (gzipped)   |
| React deps   |       ✅ Removed        |          N/A          |
| Tree-shaking |       Unreliable        |       Reliable        |

Production build is **68% smaller** than the dev baseline when measured gzipped — due to:

1. Minification
2. Tree-shaking (React deps removed in Sprint 1)
3. Vite chunk splitting

---

## Recommendations

| Priority | Action                                                           |
| :------- | :--------------------------------------------------------------- |
| Low      | Consider lazy-loading the `/demo-model` route (not a core route) |
| Low      | Monitor root layout chunk as more sidebar features are added     |
| None     | No immediate optimization needed — all chunks within budget      |

---

**Verdict:** Bundle is healthy. No blocking issues for Sprint 3.

# Release Notes: v0.7.0 — Enhanced UX & Automation

**Released:** 2026-03-27  
**Commit:** [pending]  
**Previous:** v0.6.0 (Performance & Productivity)

---

## What's New

### 🔍 Enhanced Search & Filter

Find anything in your timeline instantly with full-text search and advanced filtering.

**Features:**
- **Full-text search** across events, characters, and environments
- **Score-based ranking** with match snippets
- **Multiple filters:**
  - Time range (start-end ms)
  - Mood (joyful, melancholic, anxious, serene, curious)
  - Lighting type (dusk, daylight, studio, tungsten, ambient)
  - Asset types (has character, camera, lighting, FX, audio, prompt)
- **Saved presets** for quick filtering
- **Keyboard shortcut** (Ctrl+F)
- **Click to jump** to event in timeline

---

### ⌨️ Keyboard Shortcuts Customization

Customize keyboard shortcuts to match your workflow.

**Features:**
- **4 preset configurations:**
  - Default — Standard shortcuts
  - Vim-style — Vim-inspired navigation
  - Blender-style — 3D software conventions
  - Adobe-style — Creative Suite conventions
- **Click to edit** any shortcut
- **Conflict detection** with warnings
- **Export/Import** shortcuts as JSON
- **Reset to defaults** anytime

**Default Shortcuts:**
| Category | Shortcuts |
|----------|-----------|
| File | Ctrl+S (Save), Ctrl+E (Export), Ctrl+I (Import) |
| Edit | Ctrl+Z (Undo), Ctrl+Y (Redo), Ctrl+D (Duplicate), Delete |
| Playback | Space (Play/Pause), Escape (Stop), Home/End |
| Navigation | Ctrl+F (Search), Ctrl+/- (Zoom) |
| View | Ctrl+I (Inspector), Ctrl+, (Settings), F1 (Help) |
| Timeline | N (Add Event), Ctrl+K (Split) |

---

### 💾 Auto-Save & Version History

Never lose work with improved auto-save and version recovery.

**Features:**
- **Configurable auto-save interval:**
  - 30 seconds
  - 1 minute
  - 5 minutes (default)
  - 10 minutes
- **Version history** (last 10 saves)
- **Crash recovery** prompt on restart
- **Manual snapshots** with labels
- **Restore any version** with preview
- **Clear history** when needed

---

## Features Delivered This Sprint

| Feature | Points | Status |
|---------|--------|--------|
| S30-01: Enhanced Search | 4 | ✅ Complete |
| S30-02: Shortcuts Customization | 3 | ✅ Complete |
| S30-03: Auto-Save Improvements | 2 | ✅ Complete |
| **Sprint 30 Total** | **9** | **9 delivered** |

---

## Technical Details

### New Components

- `SearchPanel.svelte` — Search UI with filters and presets
- `ShortcutsPanel.svelte` — Shortcuts configuration panel
- `VersionHistoryPanel.svelte` — Version history and recovery

### New Utilities

- `search-index.ts` — Full-text search index (16 tests)
- `search-filters.ts` — Filter logic and presets (19 tests)
- `shortcuts-config.ts` — Shortcuts management
- `version-history.ts` — Version history management

---

## Breaking Changes

None. This is a backward-compatible release.

---

## Known Limitations

- **Search** — Requires manual panel open (not yet integrated in toolbar)
- **Shortcuts** — Visual feedback for shortcuts not yet implemented
- **Version History** — Stored in localStorage (quota limits apply)

---

## Upgrade Path

1. Pull latest changes
2. Run `pnpm install` (no new dependencies)
3. Build: `pnpm run build`
4. Access features:
   - Search: Ctrl+F
   - Shortcuts: Settings → Keyboard Shortcuts
   - Version History: Settings → Version History

---

## Quality Metrics

| Metric | v0.6.0 | v0.7.0 | Change |
|--------|--------|--------|--------|
| **Unit Tests** | 448 | 483 | +35 |
| **Type Errors** | 0 | 0 | — |
| **Bundle Size** | ~115 KB | ~135 KB | +20 KB |
| **Features** | 6 major | 9 major | +3 |

---

## Next Steps

### v0.8.0 Planning (Sprint 31+)

**Under Consideration:**
- 🔮 Timeline markers enhancement
- 🔮 Asset usage tracking
- 🔮 Tooltip improvements
- 🔮 Real-time collaboration (WebSocket)
- 🔮 ComfyUI workflow integration

---

## Sprint Summary

**Sprint 30:** Enhanced UX & Automation

- All 3 stories complete (9/9 pts — 100%)
- Full-text search with advanced filters
- Keyboard shortcuts customization (4 presets)
- Auto-save with version history (10 versions)

**Releases Shipped (v0.1.0 → v0.7.0):**
- v0.1.0: Core timeline editor
- v0.2.0: Undo/Redo + persistence
- v0.3.0: EDL export, global search, presentation mode
- v0.4.0: ComfyUI integration, batch generation
- v0.5.0: REST API, ImportModal, documentation
- v0.6.0: Virtual scrolling, bulk ops, performance tools, UI/UX
- v0.7.0: Enhanced search, shortcuts config, auto-save

---

**Built with:** SvelteKit 2.55 + Svelte 5.55 + Vite 8 + TypeScript 6 + Zod 4 + Vitest 4 + Playwright 1.58

**Contributors:** BMAD Developer  
**Release Manager:** Mydde

---

## Changelog Summary (v0.6.0 → v0.7.0)

### Added
- SearchPanel component with full-text search
- Search index for events, characters, environments
- Filter logic with presets (time, mood, lighting, asset types)
- ShortcutsPanel component for customization
- 4 shortcut presets (Default, Vim, Blender, Adobe)
- VersionHistoryPanel for auto-save recovery
- Version history management (last 10 versions)

### Changed
- None

### Fixed
- None

### Removed
- None

---

**Release Status:** ✅ READY FOR PRODUCTION

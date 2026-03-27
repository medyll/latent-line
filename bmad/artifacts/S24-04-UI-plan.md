# S24-04-UI — ComfyUI Integration UI (9 pts)

## Architecture

**Foundation (already done):**

- `src/lib/services/ai-backend.ts` — service abstraction (A1111 + ComfyUI)
- `src/lib/stores/generation.svelte.ts` — per-event generation state

**To implement (S24-04-UI):**

### 1. Settings Panel (ComfyUI Config) — 3 pts

- File: `src/lib/components/app/ComfyUISettings.svelte`
- Modal triggered from toolbar
- Fields:
  - Backend type (ComfyUI / A1111)
  - Server URL (e.g., http://localhost:7860)
  - API key (optional)
  - "Test Connection" button
- Store config in preferences store (existing `preferences.svelte.ts`)

### 2. Event Card UI Enhancements — 3 pts

- Add to PropertiesPanel or event inline UI:
  - "Generate" button (if config exists)
  - Progress indicator (0-100%)
  - Generated image thumbnail (base64 display)
  - Status badge (idle/queued/generating/done/error)

### 3. Generation Control & Persistence — 2 pts

- Create `src/lib/stores/generated-images.svelte.ts` for IndexedDB persistence
- Batch "Generate All" button (sequential with rate limiting)
- Error toast notifications

### 4. Integration Points

- Main app (+page.svelte) adds ComfyUISettings modal trigger
- Event card components display generate button/progress
- Generation store subscription for reactive UI updates

## Acceptance Criteria Map

- [ ] Settings: URL + API key config + test connection
- [ ] Generate button on each event → calls ai-backend.generate()
- [ ] Progress indicator + ETA display
- [ ] Generated image as thumbnail (base64 in IndexedDB)
- [ ] "Generate All" batch operation with 2-3s rate limiting
- [ ] Error handling (timeout, unavailable, invalid key)
- [ ] Images stored in IndexedDB (not localStorage)

## Files to Create/Modify

1. **NEW:** `src/lib/components/app/ComfyUISettings.svelte` (settings modal)
2. **NEW:** `src/lib/stores/generated-images.svelte.ts` (IndexedDB store)
3. **NEW:** `src/lib/components/workspace/GenerateButton.svelte` (event card button)
4. **MODIFY:** `src/routes/+page.svelte` (add settings modal trigger)
5. **MODIFY:** `src/lib/stores/preferences.svelte.ts` (add comfyui config)
6. **MODIFY:** `src/lib/components/workspace/properties/PropertiesPanel.svelte` (add generate UI)

## Testing

- Unit tests for generation store
- E2E test for settings config flow
- Mock ai-backend for UI tests

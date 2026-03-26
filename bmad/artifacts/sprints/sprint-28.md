# Sprint 28 — Export Ecosystem: REST API & UI Integration

**Status:** Planned
**Theme:** Implement REST API server, integrate export UI, add import support
**Points:** 12 (3 + 4 + 3 + 2)
**Target Delivery:** v0.5.0 with public export/import API

## Stories

### S28-01: REST API Server Foundation (3 pts)
**Status:** Ready for development

Implement SvelteKit API routes to expose export and import endpoints.

**Acceptance Criteria:**
- `src/routes/api/export/+server.ts` — POST endpoint for exports
  - Query params: `format=yaml|jsonld|csv|storyboard|framepack`
  - Request body: `{ model, options }`
  - Response: JSON (for formats) or file stream (for download)
  - CORS headers for cross-origin access
- `src/routes/api/import/+server.ts` — POST endpoint for imports
  - Accept: `multipart/form-data` (file upload) OR JSON body
  - Formats: YAML, JSON-LD, JSON (native model)
  - Validation: modelSchema.safeParse on import
  - Response: validated model + warnings
- Error handling: HTTP status codes (400, 422, 500) with detailed error messages
- Rate limiting placeholder (not implemented, but designed)
- 5 unit tests covering happy path + error cases

**Technical Notes:**
- Use SvelteKit's `+server.ts` pattern (GET/POST handlers)
- Validate all inputs against modelSchema
- Return JSON for client-side consumption
- Error responses: `{ error: string, details?: unknown, code: string }`

**Definition of Done:**
- [ ] Both endpoints fully functional
- [ ] Comprehensive error handling
- [ ] Unit tests passing
- [ ] API documented with example curl commands
- [ ] CORS configured for dev + production

---

### S28-02: ExportModal UI Integration (4 pts)
**Status:** Ready for development

Add export buttons to ExportModal, integrate with API server.

**Acceptance Criteria:**
- [ ] Add buttons to `ExportModal.svelte`:
  - "Download YAML" button
  - "Download JSON-LD" button
  - "Copy YAML" (clipboard)
  - "Copy JSON-LD" (clipboard)
- [ ] Preview pane shows first 100 chars of export format
- [ ] Loading state during export (spinner + disabled buttons)
- [ ] Success toast: "Downloaded timeline-name.yaml"
- [ ] Error toast: "Export failed: [reason]"
- [ ] Keyboard shortcut support (optional: Cmd+Shift+E for export)
- [ ] Mobile-friendly: full-width on small screens, side-by-side on desktop
- [ ] 8 unit + 2 E2E tests

**UI Mockup:**
```
┌─ Export Timeline ──────────────────────────┐
│ Format:  ◉ YAML  ○ JSON-LD  ○ CSV  ○ ... │
│                                            │
│ Preview (100 chars):                       │
│ ┌──────────────────────────────────────┐  │
│ │ # Latent-Line Timeline               │  │
│ │ name: "My Scene"                     │  │
│ │ ...                                  │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ [Download] [Copy to Clipboard] [Cancel]   │
└────────────────────────────────────────────┘
```

**Technical Notes:**
- Use native Fetch API to call `/api/export`
- Blob handling for file downloads (use `URL.createObjectURL`)
- Clipboard API: `navigator.clipboard.writeText()`
- Svelte 5 $state for loading/error handling

**Definition of Done:**
- [ ] All buttons working (download + copy)
- [ ] Loading states visible
- [ ] Success/error messages clear
- [ ] Tests passing (unit + E2E)
- [ ] Mobile responsiveness verified
- [ ] PR merged

---

### S28-03: Import Modal & File Upload (3 pts)
**Status:** Ready for development

Implement import dialog to load YAML/JSON-LD timelines.

**Acceptance Criteria:**
- [ ] New `ImportModal.svelte` component
- [ ] File upload input (accept .yaml, .json, .jsonld)
- [ ] Drag-and-drop zone for file upload
- [ ] Format detection (auto-detect from file extension or content)
- [ ] Validation feedback:
  - ✓ Valid model (show preview)
  - ✗ Invalid (show error + line number if available)
  - ⚠ Warnings (e.g., unknown asset references)
- [ ] Import button: loads model into current app state (or new session)
- [ ] 6 unit tests (file parsing, validation, error handling)

**UI Mockup:**
```
┌─ Import Timeline ──────────────────────────┐
│ Drag & drop your YAML/JSON-LD file here   │
│ ┌──────────────────────────────────────┐  │
│ │  📁 Choose File                      │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ Or paste JSON-LD directly:                 │
│ ┌──────────────────────────────────────┐  │
│ │ { "@context": ...                    │  │
│ │ ...                                  │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ [Import] [Cancel]                         │
└────────────────────────────────────────────┘
```

**Technical Notes:**
- FileReader API for file upload
- POST to `/api/import` with file content
- Model validation: use existing modelSchema
- Handle partial/legacy model formats gracefully
- Offer "merge" vs "replace" option (future feature)

**Definition of Done:**
- [ ] File upload working (drag + click)
- [ ] Format auto-detection working
- [ ] Validation and error messages clear
- [ ] Tests passing
- [ ] PR merged

---

### S28-04: API Documentation & Examples (2 pts)
**Status:** Ready for development

Document export/import API for external integrations.

**Acceptance Criteria:**
- [ ] OpenAPI/Swagger spec for both endpoints (JSON)
- [ ] README section: "Using the Export API"
  - curl examples for all formats
  - JavaScript/Fetch examples
  - Error handling examples
- [ ] TypeScript types exported from API module
  - Request/response types
  - Usable by external packages
- [ ] Example Python/JavaScript client script
- [ ] Known limitations documented (file size limits, rate limits)

**Artifact Outputs:**
- `bmad/artifacts/api-spec-openapi.json` (Swagger/OpenAPI)
- `README` section: "API Reference"
- `examples/export-client.js` (example client)
- `examples/export-client.py` (example client)

**Definition of Done:**
- [ ] API spec complete and valid
- [ ] Examples tested and working
- [ ] Documentation clear for external developers
- [ ] File merged to main

---

## Summary

Sprint 28 transforms the export utilities (from Sprint 27) into a production API server with full UI integration and documentation. By end of sprint:

- ✅ REST API server fully functional
- ✅ ExportModal integrated with YAML/JSON-LD export
- ✅ ImportModal for loading external timelines
- ✅ API fully documented for third-party integrations
- ✅ Ready for v0.5.0 release

This positions latent-line as an open data format tool, enabling ecosystem integrations with ComfyUI, Deforum, and other video generation tools.

---

## Future Work (Sprint 29+)

- Real-time sync API (WebSocket)
- Webhook support for external listeners
- Bulk export/import
- Streaming API for large timelines
- GraphQL API alternative
- Official SDKs (Python, JavaScript, Go)

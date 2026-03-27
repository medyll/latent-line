# Latent-line API Reference

**Version:** 0.5.0  
**Last Updated:** 2026-03-27

---

## Table of Contents

1. [Overview](#overview)
2. [Export API](#export-api)
3. [Import API](#import-api)
4. [Error Codes](#error-codes)
5. [Examples](#examples)

---

## Overview

Latent-line provides REST API endpoints for programmatic export and import of timeline models.

**Base URL:** `/api` (relative to application origin)

**Authentication:** None required (local application)

**Content Types:**
- Request: `application/json`
- Response: `application/json`

---

## Export API

### POST /api/export

Export a timeline model in various formats.

#### Request

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `format` | string | `yaml` | Export format (see below) |
| `pretty` | string | `true` | Pretty-print JSON formats |

**Supported Formats:**
- `yaml` — YAML format
- `jsonld` — JSON-LD (semantic web)
- `csv` — CSV spreadsheet
- `json` — Standard JSON

**Request Body:**

```typescript
{
  model: object,      // The timeline model to export
  options?: {
    pretty?: boolean,
    includeMetadata?: boolean
  }
}
```

#### Response

**Success (200):**

```typescript
{
  format: string,     // Exported format name
  content: string|object,  // Exported content
  mimeType: string,   // MIME type for download
  filename: string    // Suggested filename
}
```

**Error (400/422/500):**

```typescript
{
  error: string,      // Error message
  details?: unknown,  // Additional error details
  code: string        // Error code
}
```

#### Example

```bash
curl -X POST http://localhost:5167/api/export?format=yaml \
  -H "Content-Type: application/json" \
  -d '{
    "model": {
      "project": { "name": "Test", "fps": 24, "resolution": { "w": 1024, "h": 1024 } },
      "assets": { "characters": [], "environments": {}, "audio": [] },
      "timeline": [],
      "config": {}
    }
  }'
```

**Response:**

```json
{
  "format": "yaml",
  "content": "# Latent-Line Timeline Export\n...",
  "mimeType": "application/x-yaml",
  "filename": "timeline-1234567890.yaml"
}
```

---

## Import API

### POST /api/import

Import and validate a timeline model from JSON.

#### Request

**Request Body:**

```typescript
{
  json: string        // JSON string of the model
}
```

#### Response

**Success (200):**

```typescript
{
  success: true,
  model: Model,       // Validated model object
  warnings?: string[] // Non-blocking validation warnings
}
```

**Validation Error (422):**

```typescript
{
  success: false,
  warnings: string[]  // Schema validation errors
}
```

**Parse Error (400):**

```typescript
{
  error: string,
  code: string
}
```

#### Example

```bash
curl -X POST http://localhost:5167/api/import \
  -H "Content-Type: application/json" \
  -d '{
    "json": "{\"project\":{\"name\":\"Test\",\"fps\":24,\"resolution\":{\"w\":1024,\"h\":1024}},\"assets\":{\"characters\":[],\"environments\":{},\"audio\":[]},\"timeline\":[],\"config\":{}}"
  }'
```

**Response:**

```json
{
  "success": true,
  "model": {
    "project": { "name": "Test", "fps": 24, "resolution": { "w": 1024, "h": 1024 } },
    "assets": { "characters": [], "environments": {}, "audio": [] },
    "timeline": [],
    "config": {}
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `MISSING_MODEL` | 400 | Request body missing `model` field |
| `INVALID_MODEL` | 422 | Model failed schema validation |
| `UNSUPPORTED_FORMAT` | 400 | Requested export format not supported |
| `PARSE_ERROR` | 400 | Invalid JSON syntax in import |
| `EXPORT_ERROR` | 500 | Internal error during export |
| `IMPORT_ERROR` | 500 | Internal error during import |

---

## Examples

### JavaScript (Fetch)

#### Export to YAML

```javascript
const model = {
  project: { name: 'My Project', fps: 24, resolution: { w: 1024, h: 1024 } },
  assets: { characters: [], environments: {}, audio: [] },
  timeline: [],
  config: {}
};

const response = await fetch('/api/export?format=yaml', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ model })
});

const result = await response.json();
console.log(result.content); // YAML string
```

#### Import JSON

```javascript
const jsonString = JSON.stringify(model);

const response = await fetch('/api/import', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ json: jsonString })
});

const result = await response.json();
if (result.success) {
  console.log('Import successful:', result.model);
} else {
  console.error('Import failed:', result.warnings);
}
```

### Python (Requests)

#### Export to JSON-LD

```python
import requests

model = {
    "project": {"name": "Test", "fps": 24, "resolution": {"w": 1024, "h": 1024}},
    "assets": {"characters": [], "environments": {}, "audio": []},
    "timeline": [],
    "config": {}
}

response = requests.post(
    'http://localhost:5167/api/export?format=jsonld',
    json={"model": model}
)

result = response.json()
print(result['content'])  # JSON-LD object
```

#### Import with Error Handling

```python
import requests

json_string = '{"project":{"name":"Test","fps":24,"resolution":{"w":1024,"h":1024}},"assets":{"characters":[],"environments":{},"audio":[]},"timeline":[],"config":{}}'

response = requests.post(
    'http://localhost:5167/api/import',
    json={"json": json_string}
)

result = response.json()
if result.get('success'):
    print("Import successful")
    print(f"Project: {result['model']['project']['name']}")
else:
    print("Import failed:")
    for warning in result.get('warnings', []):
        print(f"  - {warning}")
```

---

## Model Schema

For complete model schema documentation, see [MODEL_SCHEMA.md](./MODEL_SCHEMA.md).

### Minimal Valid Model

```json
{
  "project": {
    "name": "Untitled",
    "fps": 24,
    "resolution": { "w": 1024, "h": 1024 }
  },
  "assets": {
    "characters": [],
    "environments": {},
    "audio": []
  },
  "timeline": [],
  "config": {}
}
```

---

## Rate Limiting

- No rate limiting for local API calls
- Batch export/import operations are queued internally
- Large models (>10MB) may timeout after 30 seconds

---

## CORS

For browser-based API access from a different origin:

```javascript
// Server-side configuration required
// Add to Vite config or reverse proxy:
{
  server: {
    cors: {
      origin: '*',  // Or specific origins
      methods: ['GET', 'POST', 'OPTIONS']
    }
  }
}
```

---

**End of API Reference**

For user documentation, see:
- [User Guide](./USER_GUIDE.md)
- [Model Schema](./MODEL_SCHEMA.md)

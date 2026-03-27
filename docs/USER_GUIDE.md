# Latent-line User Guide

**Version:** 0.5.0  
**Last Updated:** 2026-03-27

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Core Features](#core-features)
3. [Import/Export](#importexport)
4. [Advanced Features](#advanced-features)
5. [Keyboard Shortcuts](#keyboard-shortcuts)

---

## Getting Started

### What is Latent-line?

Latent-line is a timeline orchestration tool for AI-driven story and scene production. It allows you to:

- Create and manage character assets with prompts and references
- Build timeline events with precise timing, camera movements, and effects
- Configure AI generation settings (checkpoint, sampler, seed)
- Export your timeline for downstream video/animation generation

### Installation

```bash
# Clone the repository
git clone https://github.com/medyll/latent-line.git
cd latent-line

# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

Navigate to `http://localhost:5167` in your browser.

### First Project

1. **Open the App** — Click "Open Editor" or navigate to `/app`
2. **Add a Character** — In Asset Manager (left sidebar), click "Add Character"
3. **Create Timeline Event** — Click "+" in the timeline to add your first event
4. **Configure Properties** — Select the event and adjust camera, lighting, or FX
5. **Export** — Click the Export button (⬇) to save your work

---

## Core Features

### Timeline Editor

The timeline is the central workspace where you build your narrative.

**Key Concepts:**
- **Events** — Discrete moments in time (keyframes)
- **Time** — Measured in milliseconds from project start
- **Duration** — How long an event lasts (in frames)
- **Playhead** — Current playback position

**Actions:**
- **Add Event** — Click `+` button or press `N`
- **Select Event** — Click on event card
- **Delete Event** — Select event, press `Delete` or `Backspace`
- **Duplicate** — Select event, press `Ctrl+D`
- **Reorder** — Events automatically sort by time

### Asset Manager

Located in the left sidebar, manage all project assets:

#### Characters
- **ID** — Unique identifier (e.g., `char_01`)
- **Name** — Display name
- **Voice ID** — TTS voice selection
- **References** — Image URLs for AI generation
- **Outfits** — Multiple outfit variations with prompts

#### Environments
- **ID** — Unique identifier (e.g., `env_01`)
- **Prompt** — Text description for AI generation
- **Reference** — Optional reference image URL

#### Audio
- **ID** — Unique identifier (e.g., `bgm_01`)
- **URL** — Audio file location
- **Label** — Display name

### Properties Panel

When an event is selected, the right sidebar shows editable properties:

#### Camera
- **Zoom** — Camera zoom level (0.5–3.0)
- **Pan** — Horizontal/vertical offset
- **Tilt** — Camera tilt angle

#### Lighting
- **Type** — dusk, daylight, studio, tungsten, ambient
- **Intensity** — 0.0–1.0

#### Effects
- **Bloom** — Glow effect intensity
- **Motion Blur** — Movement blur amount

#### AI Generation (ComfyUI)
- **Prompt** — Positive prompt for image generation
- **Negative Prompt** — What to avoid
- **Settings** — Server configuration

---

## Import/Export

### Export Formats

Click the **Export** button (⬇) in the toolbar to access export options:

| Format | Extension | Use Case |
|--------|-----------|----------|
| **YAML** | `.yaml` | Human-readable config, round-trip editing |
| **JSON-LD** | `.jsonld` | Semantic web, RDF integration |
| **CSV** | `.csv` | Spreadsheet import, data analysis |
| **JSON** | `.json` | Standard data interchange |
| **Prompts (TXT)** | `.txt` | Simple prompt list |
| **Prompts (JSON)** | `.json` | Structured prompts with metadata |
| **Deforum** | `.json` | Deforum AI animation format |
| **Storyboard PDF** | `.pdf` | Visual storyboard for review |
| **ZIP Bundle** | `.zip` | Complete project archive |

### Export Steps

1. Click **Export** button in toolbar
2. Select format from tabs
3. (Optional) Configure format-specific options
4. Click **Download** or **Copy to Clipboard**

### Import JSON

Click the **Import** button in the Export modal to import a timeline:

**Supported Formats:**
- `.json` — Fully supported
- `.yaml`, `.yml` — Coming soon

**Import Modes:**

| Mode | Behavior |
|------|----------|
| **Replace** | Clear current timeline, load imported file |
| **Merge** | Append events, merge assets (auto-rename duplicates) |

**Import Process:**

1. Click **Import** button
2. Drag & drop file or click to browse
3. Review validation results
4. Preview model summary (assets, events, duration)
5. Select import mode (Replace or Merge)
6. Click **Import**

**Validation:**
- Schema validation against `modelSchema` (Zod)
- Duplicate ID detection
- Asset reference validation
- Timeline event validation

**Error Handling:**
- Invalid JSON syntax → Shows parse error
- Schema validation failure → Lists field errors
- Missing required fields → Highlights missing fields

### Example: Export to YAML

```yaml
# Latent-Line Timeline Export
# Generated: 2026-03-27

project:
  name: "My Project"
  fps: 24
  resolution:
    w: 1920
    h: 1080

assets:
  characters:
    - id: char_01
      name: "Hero"
      voice_id: "v_male_01"
      outfits:
        default: "casual wear"

timeline:
  - time: 0
    duration: 200
    prompt: "hero walking"
    actor: char_01

config:
  checkpoint: "flux_dev.safetensors"
  sampler: "euler"
  seed: 42
```

---

## Advanced Features

### ComfyUI Integration

Generate AI images directly from timeline events.

**Setup:**
1. Click **🎨 ComfyUI** in toolbar
2. Enter server URL (e.g., `http://localhost:7860`)
3. (Optional) Add API key
4. Click **Test Connection**
5. Click **Save**

**Per-Event Generation:**
1. Select a timeline event
2. Enter prompt in Properties Panel
3. Click **Generate** button
4. View progress and generated image

**Batch Generation:**
1. Click **🚀 Generate All** in toolbar
2. All events with prompts will be generated sequentially
3. 2-second rate limiting between requests
4. Live progress tracking

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Space` | Play/Pause playback |
| `Escape` | Stop playback / Close modal |
| `Ctrl+I` | Toggle Model Inspector |
| `N` | New timeline event |
| `Delete` / `Backspace` | Delete selected event |
| `Ctrl+D` | Duplicate selected event |
| `Ctrl+S` | Save (auto-save enabled) |
| `Ctrl+E` | Open Export modal |

### Model Inspector

Click the **⌥** button (bottom-right) to open the Model Inspector:

- View project metadata
- Asset counts
- Timeline event list
- Raw JSON preview
- Validate button (runs Zod validation)

---

## Troubleshooting

### Common Issues

**"Invalid JSON syntax" on import:**
- Check file encoding (must be UTF-8)
- Validate JSON with online tool (jsonlint.com)
- Ensure no trailing commas

**"Schema validation failed":**
- Check required fields: `project`, `assets`, `timeline`, `config`
- Verify character IDs are unique
- Ensure timeline events have `time` and `frame`

**ComfyUI connection fails:**
- Verify server is running
- Check CORS settings on ComfyUI server
- Ensure URL includes protocol (`http://` or `https://`)

### Getting Help

- **GitHub Issues:** https://github.com/medyll/latent-line/issues
- **Documentation:** See `docs/` directory
- **Technical Specs:** See `GUIDELINES.md`

---

## Appendix

### File Formats

**JSON Structure:**
```json
{
  "project": { "name": "...", "fps": 24, "resolution": { "w": 1920, "h": 1080 } },
  "assets": { "characters": [...], "environments": {...}, "audio": [...] },
  "timeline": [{ "time": 0, "duration": 200, "frame": {...} }],
  "config": { "checkpoint": "...", "sampler": "...", "seed": 42 }
}
```

### Resolution Presets

| Name | Resolution | Aspect Ratio |
|------|------------|--------------|
| Square 1024 | 1024×1024 | 1:1 |
| HD 720 | 1280×720 | 16:9 |
| Full HD 1080 | 1920×1080 | 16:9 |
| 4K UHD | 3840×2160 | 16:9 |

### Mood Palette

| Mood | Description |
|------|-------------|
| `joyful` | Bright, energetic, uplifted |
| `melancholic` | Quietly reflective, nostalgic |
| `anxious` | Tense, restless, alert |
| `serene` | Calm, peaceful, clear |
| `curious` | Inquisitive, engaged, eager |

---

**End of User Guide**

For technical documentation, see:
- [API Reference](./API.md)
- [Model Schema](./MODEL_SCHEMA.md)
- [Developer Guidelines](../GUIDELINES.md)

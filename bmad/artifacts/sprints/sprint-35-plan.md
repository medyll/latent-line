# Sprint 35 Plan — Advanced Export (AAF, XML, FCP)

**Version:** v0.10.0  
**Theme:** Professional Export  
**Points:** 12  
**Duration:** 2 weeks (2026-06-05 → 2026-06-19)  
**Status:** Pending

---

## Overview

Sprint 35 adds **professional export formats** for Non-Linear Editing (NLE) software integration, enabling users to continue their work in DaVinci Resolve, Final Cut Pro, or Adobe Premiere.

---

## Stories

### S35-01: AAF Export (5 points) — P1

**Status:** Pending  
**Priority:** P1

#### Description
Export timeline as AAF (Advanced Authoring Format) for professional NLE import.

#### Features
- AAF file generation
- Video tracks (events as clips)
- Audio tracks (BGM, SFX, dialogue)
- Timecode mapping (HH:MM:SS:FF)
- Metadata embedding (event notes, markers)
- Frame rate configuration
- Resolution configuration

#### Acceptance Criteria
- [ ] AAF file generated and downloadable
- [ ] Imports in DaVinci Resolve 18+
- [ ] Imports in Adobe Premiere Pro
- [ ] Audio tracks preserved
- [ ] Timecode correct (tested with burn-in)
- [ ] Markers exported as markers
- [ ] Unit tests (6+)
- [ ] Integration test (import in Resolve)

#### Technical Design

**New Files:**
```
src/lib/utils/aaf-export.ts           (~250 lines)
src/lib/utils/timecode-utils.ts       (~100 lines)
src/lib/components/app/AafExportModal.svelte   (~120 lines)
```

**AAF Structure:**
```typescript
interface AafExportOptions {
  frameRate: 24 | 25 | 29.97 | 30 | 50 | 60;
  resolution: '1080p' | '4K' | 'custom';
  customWidth?: number;
  customHeight?: number;
  includeAudio: boolean;
  includeMarkers: boolean;
  includeMetadata: boolean;
}

interface AafClip {
  eventId: string;
  startTimecode: string; // HH:MM:SS:FF
  duration: string;
  videoTrack: number;
  audioTracks: number[];
  markers: AafMarker[];
  metadata: Record<string, string>;
}
```

**Timecode Utilities:**
```typescript
// timecode-utils.ts
export function msToTimecode(ms: number, frameRate: number): string;
export function timecodeToMs(timecode: string, frameRate: number): number;
export function framesToTimecode(frames: number, frameRate: number): string;
```

**AAF Generation:**
```typescript
// aaf-export.ts
export async function generateAaf(
  model: Model,
  options: AafExportOptions
): Promise<Blob>;

// Uses aaf-asm library or custom XML-based AAF
```

#### Implementation Plan

**Week 1: Core Export**

**Day 1-2: Timecode & Utils**
- [ ] Create timecode-utils.ts
- [ ] msToTimecode() function
- [ ] timecodeToMs() function
- [ ] Unit tests (4+)

**Day 3-4: AAF Generator**
- [ ] Create aaf-export.ts
- [ ] Clip generation logic
- [ ] Track mapping
- [ ] Timecode embedding

**Day 5: Audio Tracks**
- [ ] Audio lane export
- [ ] BGM/SFX/dialogue separation
- [ ] Audio timecode sync

**Week 2: UI & Testing**

**Day 6-7: Export Modal**
- [ ] Create AafExportModal.svelte
- [ ] Options form (frame rate, resolution)
- [ ] Preview before export
- [ ] Download trigger

**Day 8-9: Markers & Metadata**
- [ ] Export markers as AAF markers
- [ ] Embed event notes as metadata
- [ ] Character names in metadata

**Day 10: Testing**
- [ ] Unit tests (2+)
- [ ] Import test in DaVinci Resolve
- [ ] Import test in Premiere Pro
- [ ] Fix any compatibility issues

---

### S35-02: Final Cut Pro XML (4 points) — P2

**Status:** Pending  
**Priority:** P2

#### Description
Export timeline as FCPX XML for Mac editors.

#### Features
- FCPX 10.6 XML format
- Event → clip mapping
- Audio lanes as separate tracks
- Basic transitions (cut, fade)
- Marker export
- Project settings (resolution, frame rate)

#### Acceptance Criteria
- [ ] Valid FCPX XML 1.10 format
- [ ] Imports in Final Cut Pro 10.6+
- [ ] Clips with correct timecodes
- [ ] Audio tracks preserved
- [ ] Markers visible in FCPX
- [ ] Unit tests (5+)

#### Technical Design

**New Files:**
```
src/lib/utils/fcpx-export.ts          (~200 lines)
src/lib/components/app/FcpxExportModal.svelte   (~100 lines)
```

**FCPX XML Structure:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="5">
  <sequence>
    <name>Latent-line Timeline</name>
    <duration>3600</duration>
    <rate>
      <timebase>24</timebase>
    </rate>
    <media>
      <video>
        <track>
          <clipitem id="clip1">
            <name>Event 1</name>
            <in>0</in>
            <out>120</out>
            <start>0</start>
            <end>120</end>
          </clipitem>
        </track>
      </video>
      <audio>
        <track>
          <clipitem>...</clipitem>
        </track>
      </audio>
    </media>
  </sequence>
</xmeml>
```

**Export Function:**
```typescript
// fcpx-export.ts
export function generateFcpxXml(
  model: Model,
  options: FcpxExportOptions
): string;

export function downloadFcpxXml(xml: string, filename: string): void;
```

#### Implementation Plan

**Day 1-2: XML Generator**
- [ ] Create fcpx-export.ts
- [ ] XML structure builder
- [ ] Clip mapping
- [ ] Track generation

**Day 3: Audio & Transitions**
- [ ] Audio track export
- [ ] Cut transitions
- [ ] Fade in/out

**Day 4: Markers & UI**
- [ ] Marker export
- [ ] FcpxExportModal component
- [ ] Unit tests (5+)

**Day 5: Testing**
- [ ] Import test in Final Cut Pro
- [ ] Validate XML schema
- [ ] Fix compatibility issues

---

### S35-03: Premiere Pro Project (3 points) — P2

**Status:** Pending  
**Priority:** P2

#### Description
Export timeline as Premiere Pro project via JSON/XML.

#### Features
- Premiere project format (XML-based)
- Sequence structure
- Clip references with paths
- Audio tracks
- Markers

#### Acceptance Criteria
- [ ] Premiere-compatible XML export
- [ ] Imports in Premiere Pro 2023+
- [ ] Sequence with clips
- [ ] Audio tracks preserved
- [ ] Unit tests (4+)

#### Technical Design

**New Files:**
```
src/lib/utils/premiere-export.ts      (~180 lines)
src/lib/components/app/PremiereExportModal.svelte   (~90 lines)
```

**Premiere XML Structure:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="4">
  <object>
    <sequence>
      <name>Latent-line Export</name>
      <duration>3600</duration>
      <media>
        <video>
          <track>...</track>
        </video>
        <audio>
          <track>...</track>
        </audio>
      </media>
    </sequence>
  </object>
</xmeml>
```

#### Implementation Plan

**Day 1: XML Generator**
- [ ] Create premiere-export.ts
- [ ] XML structure
- [ ] Clip mapping

**Day 2: Audio & Markers**
- [ ] Audio track export
- [ ] Marker export

**Day 3: UI & Tests**
- [ ] PremiereExportModal
- [ ] Unit tests (4+)
- [ ] Import test in Premiere

---

## Technical Debt

- [ ] Add EDL export (legacy format)
- [ ] Support for burn-in timecode video
- [ ] Batch export multiple formats

---

## Testing Plan

### Unit Tests (15 total)
- timecode-utils.test.ts (6 tests)
- aaf-export.test.ts (4 tests)
- fcpx-export.test.ts (3 tests)
- premiere-export.test.ts (2 tests)

### Integration Tests (3 total)
- aaf-import-resolve.spec.ts
- fcpx-import-test.spec.ts
- premiere-import-test.spec.ts

### Manual QA
- [ ] Import AAF in DaVinci Resolve
- [ ] Import AAF in Premiere Pro
- [ ] Import FCPX XML in Final Cut Pro
- [ ] Import Premiere XML in Premiere Pro
- [ ] Verify timecode accuracy
- [ ] Verify audio sync

---

## Definition of Done

- [ ] All stories complete
- [ ] 15+ unit tests passing
- [ ] 3 integration tests passing
- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] Prettier format passes
- [ ] Manual QA pass (all NLEs)
- [ ] CHANGELOG.md updated

---

## Release Notes Draft

### v0.10.0 — Professional Export

**New Features:**
- 🎬 **AAF Export** — Professional format for DaVinci Resolve & Premiere
- 🍎 **Final Cut Pro XML** — Native FCPX import with markers
- 📺 **Premiere Pro Export** — Direct Premiere project compatibility
- ⏱️ **Timecode Support** — Accurate HH:MM:SS:FF timecode mapping
- 🎵 **Multi-track Audio** — Separate audio lanes preserved
- 📍 **Marker Export** — Timeline markers in all formats

**Export Options:**
- Frame rate: 24, 25, 29.97, 30, 50, 60 fps
- Resolution: 1080p, 4K, custom
- Include/exclude audio tracks
- Include/exclude markers

**Workflow:**
1. File → Export → Select format (AAF/FCPX/Premiere)
2. Configure options
3. Download
4. Import in your NLE

---

**Created:** 2026-04-02  
**Sprint Start:** 2026-06-05  
**Sprint End:** 2026-06-19

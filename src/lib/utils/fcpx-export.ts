/**
 * Final Cut Pro XML Export for Latent-line
 *
 * Generates FCPX-compatible XML for import into Final Cut Pro.
 */

import type { Model } from '$lib/model/model-types';
import type { FrameRate } from '$lib/utils/timecode-utils';
import { msToTimecode, formatTimecode, msToFrames } from '$lib/utils/timecode-utils';

export interface FcpxExportOptions {
  frameRate: FrameRate;
  resolution: '1080p' | '4K' | 'custom';
  customWidth?: number;
  customHeight?: number;
  includeAudio: boolean;
  includeMarkers: boolean;
}

/**
 * Generate FCPX XML from model
 */
export function generateFcpxXml(model: Model, options: FcpxExportOptions): string {
  const { frameRate, includeAudio, includeMarkers } = options;
  const width = options.resolution === 'custom' ? (options.customWidth ?? 1920) : getResolutionWidth(options.resolution);
  const height = options.resolution === 'custom' ? (options.customHeight ?? 1080) : getResolutionHeight(options.resolution);

  const events = [...model.timeline].sort((a, b) => a.time - b.time);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.10">
  <resources>
    <format id="r1" name="${width}x${height}p${frameRate}" frameDuration="${formatFrameDuration(frameRate)}" width="${width}" height="${height}"/>
  </resources>
  <library>
    <event name="${escapeXml(model.project.name)}">
      <project name="${escapeXml(model.project.name)}">
        <sequence format="r1">
          <spine>`;

  // Video clips
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const duration = event.duration ?? 24;
    const startTc = formatTimecode(msToTimecode(event.time, frameRate));
    const durationFrames = msToFrames(duration * (1000 / frameRate), frameRate);
    const durationTc = formatTimecode(msToTimecode(durationFrames * (1000 / frameRate), frameRate));

    xml += `
            <clip name="Event ${event.time}" start="${startTc}" duration="${durationTc}" format="r1" ref="r${i + 2}">`;

    // Markers
    if (includeMarkers && model.markers) {
      for (const marker of model.markers) {
        if (marker.time >= event.time && marker.time < event.time + duration * (1000 / frameRate)) {
          const markerTc = formatTimecode(msToTimecode(marker.time, frameRate));
          xml += `
              <marker start="${markerTc}" value="${escapeXml(marker.label)}"/>`;
        }
      }
    }

    // Metadata as notes
    if (event.notes) {
      xml += `
              <notes>${escapeXml(event.notes)}</notes>`;
    }

    xml += `
            </clip>`;
  }

  xml += `
          </spine>`;

  // Audio tracks
  if (includeAudio) {
    const audioEvents = events.filter((e) => e.frame.audio_tracks && e.frame.audio_tracks.length > 0);
    if (audioEvents.length > 0) {
      xml += `
          <audio>`;
      for (const event of audioEvents) {
        if (event.frame.audio_tracks) {
          for (const track of event.frame.audio_tracks) {
            const startTc = formatTimecode(msToTimecode(event.time, frameRate));
            xml += `
            <audio-ref ref="${track.id}" start="${startTc}"/>`;
          }
        }
      }
      xml += `
          </audio>`;
    }
  }

  xml += `
        </sequence>
      </project>
    </event>
  </library>
  <resources>`;

  // Add clip resources
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const prompt = event.frame.prompt || `Event at ${event.time}`;
    xml += `
    <asset name="${escapeXml(prompt)}" id="r${i + 2}" start="0s" duration="${event.duration ?? 24}f" hasVideo="1" hasAudio="0"/>`;
  }

  xml += `
  </resources>
</fcpxml>`;

  return xml;
}

/**
 * Format frame duration for FCPX
 */
function formatFrameDuration(frameRate: FrameRate): string {
  return `1/${frameRate}s`;
}

/**
 * Get resolution width
 */
function getResolutionWidth(resolution: '1080p' | '4K'): number {
  return resolution === '4K' ? 3840 : 1920;
}

/**
 * Get resolution height
 */
function getResolutionHeight(resolution: '1080p' | '4K'): number {
  return resolution === '4K' ? 2160 : 1080;
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Download FCPX XML file
 */
export function downloadFcpxXml(xml: string, filename: string): void {
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.fcpxml') ? filename : `${filename}.fcpxml`;
  a.click();
  URL.revokeObjectURL(url);
}

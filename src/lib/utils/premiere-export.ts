/**
 * Premiere Pro XML Export for Latent-line
 *
 * Generates Premiere-compatible XML for import into Adobe Premiere Pro.
 */

import type { Model } from '$lib/model/model-types';
import type { FrameRate } from '$lib/utils/timecode-utils';
import { msToTimecode, formatTimecode, msToFrames } from '$lib/utils/timecode-utils';

export interface PremiereExportOptions {
  frameRate: FrameRate;
  resolution: '1080p' | '4K' | 'custom';
  customWidth?: number;
  customHeight?: number;
  includeAudio: boolean;
  includeMarkers: boolean;
}

/**
 * Generate Premiere Pro XML from model
 */
export function generatePremiereXml(model: Model, options: PremiereExportOptions): string {
  const { frameRate, includeAudio, includeMarkers } = options;
  const width = options.resolution === 'custom' ? (options.customWidth ?? 1920) : getResolutionWidth(options.resolution);
  const height = options.resolution === 'custom' ? (options.customHeight ?? 1080) : getResolutionHeight(options.resolution);

  const events = [...model.timeline].sort((a, b) => a.time - b.time);
  const totalDuration = events.length > 0
    ? events[events.length - 1].time + (events[events.length - 1].duration ?? 24) * (1000 / frameRate)
    : 0;
  const totalFrames = msToFrames(totalDuration, frameRate);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="5">
  <sequence id="${generateSequenceId()}">
    <name>${escapeXml(model.project.name)}</name>
    <duration>${totalFrames}</duration>
    <rate>
      <timebase>${frameRate}</timebase>
      <ntsc>0</ntsc>
    </rate>
    <media>
      <video>
        <track>
          <name>Video 1</name>`;

  // Video clips
  for (const event of events) {
    const duration = event.duration ?? 24;
    const startFrame = msToFrames(event.time, frameRate);
    const durationFrames = msToFrames(duration * (1000 / frameRate), frameRate);
    const endFrame = startFrame + durationFrames;
    const startTc = formatTimecode(msToTimecode(event.time, frameRate));
    const endTc = formatTimecode(msToTimecode(endFrame * (1000 / frameRate), frameRate));

    xml += `
          <clipitem id="clip_${event.time}">
            <name>Event ${event.time}</name>
            <enabled>TRUE</enabled>
            <start>${startFrame}</start>
            <end>${endFrame}</end>
            <in>0</in>
            <out>${durationFrames}</out>
            <pproTicksIn>0</pproTicksIn>
            <pproTicksOut>${durationFramesToTicks(durationFrames, frameRate)}</pproTicksOut>
            <file id="file_${event.time}">
              <name>${escapeXml(event.frame.prompt || `Event ${event.time}`)}</name>
              <pathurl>file://localhost/${event.time}</pathurl>
              <media>
                <video>
                  <width>${width}</width>
                  <height>${height}</height>
                </video>`;

    if (includeAudio && event.frame.audio_tracks && event.frame.audio_tracks.length > 0) {
      xml += `
                <audio>
                  <numChannels>2</numChannels>
                  <sampleRate>48000</sampleRate>
                </audio>`;
    }

    xml += `
              </media>
            </file>`;

    // Markers
    if (includeMarkers && model.markers) {
      for (const marker of model.markers) {
        if (marker.time >= event.time && marker.time < event.time + duration * (1000 / frameRate)) {
          const markerFrame = msToFrames(marker.time - event.time, frameRate);
          xml += `
            <marker>
              <comment>${escapeXml(marker.label)}</comment>
              <name>${escapeXml(marker.label)}</name>
              <in>${markerFrame}</in>
              <out>${markerFrame}</out>
            </marker>`;
        }
      }
    }

    xml += `
          </clipitem>`;
  }

  xml += `
        </track>`;

  // Audio tracks
  if (includeAudio) {
    const audioEvents = events.filter((e) => e.frame.audio_tracks && e.frame.audio_tracks.length > 0);
    if (audioEvents.length > 0) {
      xml += `
        <track>
          <name>Audio 1</name>`;

      for (const event of audioEvents) {
        if (event.frame.audio_tracks) {
          for (const track of event.frame.audio_tracks) {
            const startFrame = msToFrames(event.time, frameRate);
            const duration = event.duration ?? 24;
            const durationFrames = msToFrames(duration * (1000 / frameRate), frameRate);

            xml += `
          <clipitem id="audio_clip_${track.id}">
            <name>${escapeXml(track.id)}</name>
            <start>${startFrame}</start>
            <end>${startFrame + durationFrames}</end>
            <file id="audio_file_${track.id}">
              <name>${escapeXml(track.id)}</name>
              <pathurl>file://localhost/${track.id}</pathurl>
            </file>
          </clipitem>`;
          }
        }
      }

      xml += `
        </track>`;
    }
  }

  xml += `
      </video>`;

  xml += `
    </media>
    <timecode>
      <string>${formatTimecode(msToTimecode(0, frameRate))}</string>
      <displayFormat>NDF</displayFormat>
      <rate>
        <timebase>${frameRate}</timebase>
      </rate>
    </timecode>
  </sequence>
</xmeml>`;

  return xml;
}

/**
 * Convert duration frames to Premiere ticks
 */
function durationFramesToTicks(frames: number, frameRate: number): number {
  return Math.round((frames / frameRate) * 254016000000);
}

/**
 * Generate a unique sequence ID
 */
function generateSequenceId(): string {
  return `seq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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
 * Download Premiere XML file
 */
export function downloadPremiereXml(xml: string, filename: string): void {
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.xml') ? filename : `${filename}.xml`;
  a.click();
  URL.revokeObjectURL(url);
}

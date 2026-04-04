/**
 * AAF Export for Latent-line
 *
 * Generates AAF-compatible XML for import into professional NLEs
 * like DaVinci Resolve and Adobe Premiere Pro.
 */

import type { Model, TimelineMarker } from '$lib/model/model-types';
import type { FrameRate } from '$lib/utils/timecode-utils';
import { msToTimecode, formatTimecode, msToFrames } from '$lib/utils/timecode-utils';

export interface AafExportOptions {
  frameRate: FrameRate;
  resolution: '1080p' | '4K' | 'custom';
  customWidth?: number;
  customHeight?: number;
  includeAudio: boolean;
  includeMarkers: boolean;
  includeMetadata: boolean;
}

export interface AafClip {
  eventId: number;
  startTimecode: string;
  duration: string;
  videoTrack: number;
  audioTracks: number[];
  markers: AafMarker[];
  metadata: Record<string, string>;
}

export interface AafMarker {
  timecode: string;
  label: string;
  color?: string;
  comment?: string;
}

/**
 * Generate AAF XML from model
 */
export function generateAaf(model: Model, options: AafExportOptions): string {
  const { frameRate, includeAudio, includeMarkers, includeMetadata } = options;
  const width = options.resolution === 'custom' ? (options.customWidth ?? 1920) : getResolutionWidth(options.resolution);
  const height = options.resolution === 'custom' ? (options.customHeight ?? 1080) : getResolutionHeight(options.resolution);

  const events = [...model.timeline].sort((a, b) => a.time - b.time);
  const clips: AafClip[] = events.map((event) => {
    const duration = event.duration ?? 24;
    const startTimecode = formatTimecode(msToTimecode(event.time, frameRate));
    const durationTc = formatTimecode(msToTimecode(duration * (1000 / frameRate), frameRate));

    const markers: AafMarker[] = [];
    if (includeMarkers && model.markers) {
      for (const marker of model.markers) {
        if (marker.time >= event.time && marker.time < event.time + duration * (1000 / frameRate)) {
          markers.push({
            timecode: formatTimecode(msToTimecode(marker.time, frameRate)),
            label: marker.label,
            color: marker.color,
            comment: marker.notes
          });
        }
      }
    }

    const metadata: Record<string, string> = {};
    if (includeMetadata) {
      if (event.frame.prompt) {
        metadata.prompt = event.frame.prompt;
      }
      if (event.notes) {
        metadata.notes = event.notes;
      }
      if (event.frame.actors?.length) {
        metadata.characters = event.frame.actors.map((a) => a.id).join(', ');
      }
    }

    const audioTracks: number[] = [];
    if (includeAudio && event.frame.audio_tracks) {
      for (let i = 0; i < event.frame.audio_tracks.length; i++) {
        audioTracks.push(i);
      }
    }

    return {
      eventId: event.time,
      startTimecode,
      duration: durationTc,
      videoTrack: 1,
      audioTracks,
      markers,
      metadata
    };
  });

  return buildAafXml(clips, {
    frameRate,
    width,
    height,
    projectName: model.project.name,
    includeAudio,
    includeMarkers
  });
}

/**
 * Build AAF XML string
 */
function buildAafXml(
  clips: AafClip[],
  options: {
    frameRate: number;
    width: number;
    height: number;
    projectName: string;
    includeAudio: boolean;
    includeMarkers: boolean;
  }
): string {
  const { frameRate, width, height, projectName, includeAudio, includeMarkers } = options;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE AAF>
<AAF Version="1.0">
  <ContentStorage>
    <EssenceContainerData>
      <ContainerFormat>AAF_DESCRIPTIVE_METADATA</ContainerFormat>
    </EssenceContainerData>
    <MobList>
      <CompositionMob>
        <MobID>${generateMobId()}</MobID>
        <Name>${escapeXml(projectName)}</Name>
        <SlotsCount>${clips.length + 1}</SlotsCount>`;

  // Video track
  xml += `
        <TimelineTrack>
          <TrackID>1</TrackID>
          <TrackName>Video 1</TrackName>
          <EditRate>${frameRate} 1</EditRate>
          <Origin>0</Origin>`;

  for (const clip of clips) {
    xml += `
          <Component>
            <SourceClip>
              <StartTime>${clip.startTimecode}</StartTime>
              <SourceMobID>${generateMobId()}</SourceMobID>
              <SourceTrackID>1</SourceTrackID>
              <Length>${clip.duration}</Length>`;

    if (clip.markers.length > 0 && includeMarkers) {
      xml += `
              <Comments>`;
      for (const marker of clip.markers) {
        xml += `
                <Comment>
                  <MarkerTime>${marker.timecode}</MarkerTime>
                  <MarkerLabel>${escapeXml(marker.label)}</MarkerLabel>
                  ${marker.color ? `<MarkerColor>${escapeXml(marker.color)}</MarkerColor>` : ''}
                  ${marker.comment ? `<MarkerComment>${escapeXml(marker.comment)}</MarkerComment>` : ''}
                </Comment>`;
      }
      xml += `
              </Comments>`;
    }

    if (Object.keys(clip.metadata).length > 0) {
      xml += `
              <UserComments>`;
      for (const [key, value] of Object.entries(clip.metadata)) {
        xml += `
                <UserComment>
                  <Key>${escapeXml(key)}</Key>
                  <Value>${escapeXml(value)}</Value>
                </UserComment>`;
      }
      xml += `
              </UserComments>`;
    }

    xml += `
            </SourceClip>
          </Component>`;
  }

  xml += `
        </TimelineTrack>`;

  // Audio tracks
  if (includeAudio) {
    const maxAudioTracks = Math.max(...clips.map((c) => c.audioTracks.length), 0);
    for (let i = 0; i < maxAudioTracks; i++) {
      xml += `
        <TimelineTrack>
          <TrackID>${i + 2}</TrackID>
          <TrackName>Audio ${i + 1}</TrackName>
          <EditRate>${frameRate} 1</EditRate>
          <Origin>0</Origin>
        </TimelineTrack>`;
    }
  }

  xml += `
      </CompositionMob>
    </MobList>
  </ContentStorage>
  <Header>
    <ProjectName>${escapeXml(projectName)}</ProjectName>
    <FrameRate>${frameRate}</FrameRate>
    <VideoWidth>${width}</VideoWidth>
    <VideoHeight>${height}</VideoHeight>
  </Header>
</AAF>`;

  return xml;
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
 * Generate a unique MOB ID
 */
function generateMobId(): string {
  return `mob_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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
 * Download AAF file
 */
export function downloadAaf(xml: string, filename: string): void {
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.aaf') ? filename : `${filename}.aaf`;
  a.click();
  URL.revokeObjectURL(url);
}

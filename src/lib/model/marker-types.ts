/**
 * Timeline Marker types for Latent-line
 * 
 * Markers are visual indicators on the timeline for navigation,
 * chapter divisions, beats, notes, and technical cues.
 */

/**
 * Type of marker - determines color and icon
 */
export type MarkerType = 'chapter' | 'beat' | 'note' | 'cue';

/**
 * Default colors for each marker type
 */
export const MARKER_COLORS: Record<MarkerType, string> = {
  chapter: '#ef4444', // red
  beat: '#3b82f6',    // blue
  note: '#f59e0b',    // amber
  cue: '#10b981',     // green
};

/**
 * Marker labels for UI
 */
export const MARKER_LABELS: Record<MarkerType, string> = {
  chapter: 'Chapter',
  beat: 'Beat',
  note: 'Note',
  cue: 'Cue',
};

/**
 * Timeline Marker interface
 */
export interface TimelineMarker {
  /** Unique identifier */
  id: string; // format: marker_01
  
  /** Time offset in milliseconds */
  time: number;
  
  /** Type of marker */
  type: MarkerType;
  
  /** Short label displayed on timeline */
  label: string;
  
  /** Optional color override (uses type default if not set) */
  color?: string;
  
  /** Optional detailed notes */
  notes?: string;
  
  /** Creation timestamp */
  createdAt: number;
  
  /** Last update timestamp */
  updatedAt: number;
}

/**
 * Generate a unique marker ID
 */
export function generateMarkerId(): string {
  return `marker_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Create a new marker with defaults
 */
export function createMarker(
  time: number,
  type: MarkerType = 'note',
  label: string = 'Marker'
): TimelineMarker {
  const now = Date.now();
  return {
    id: generateMarkerId(),
    time,
    type,
    label,
    color: MARKER_COLORS[type],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Get the color for a marker (custom or default)
 */
export function getMarkerColor(marker: TimelineMarker): string {
  return marker.color ?? MARKER_COLORS[marker.type];
}

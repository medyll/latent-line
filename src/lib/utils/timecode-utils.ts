/**
 * Timecode utilities for NLE export formats
 *
 * Handles conversion between milliseconds and SMPTE timecode (HH:MM:SS:FF).
 */

export interface Timecode {
  hours: number;
  minutes: number;
  seconds: number;
  frames: number;
}

export type FrameRate = 24 | 25 | 29.97 | 30 | 50 | 60;

/**
 * Convert milliseconds to SMPTE timecode
 */
export function msToTimecode(ms: number, frameRate: FrameRate): Timecode {
  const totalSeconds = ms / 1000;
  const totalFrames = Math.round(totalSeconds * frameRate);

  const hours = Math.floor(totalFrames / (frameRate * 60 * 60));
  const remainingAfterHours = totalFrames % (frameRate * 60 * 60);

  const minutes = Math.floor(remainingAfterHours / (frameRate * 60));
  const remainingAfterMinutes = remainingAfterHours % (frameRate * 60);

  const seconds = Math.floor(remainingAfterMinutes / frameRate);
  const frames = remainingAfterMinutes % frameRate;

  return { hours, minutes, seconds, frames };
}

/**
 * Format timecode to HH:MM:SS:FF string
 */
export function formatTimecode(tc: Timecode): string {
  return `${pad(tc.hours)}:${pad(tc.minutes)}:${pad(tc.seconds)}:${pad(tc.frames)}`;
}

/**
 * Convert SMPTE timecode to milliseconds
 */
export function timecodeToMs(tc: Timecode, frameRate: FrameRate): number {
  const totalFrames =
    tc.hours * frameRate * 60 * 60 +
    tc.minutes * frameRate * 60 +
    tc.seconds * frameRate +
    tc.frames;

  return (totalFrames / frameRate) * 1000;
}

/**
 * Parse HH:MM:SS:FF string to Timecode
 */
export function parseTimecode(str: string, frameRate: FrameRate): Timecode {
  const parts = str.split(':').map(Number);
  if (parts.length !== 4) {
    throw new Error(`Invalid timecode format: ${str}. Expected HH:MM:SS:FF`);
  }

  const [hours, minutes, seconds, frames] = parts;

  if (frames >= frameRate) {
    throw new Error(`Frames (${frames}) exceeds frame rate (${frameRate})`);
  }

  return { hours, minutes, seconds, frames };
}

/**
 * Convert milliseconds to frames
 */
export function msToFrames(ms: number, frameRate: FrameRate): number {
  return Math.round((ms / 1000) * frameRate);
}

/**
 * Convert frames to milliseconds
 */
export function framesToMs(frames: number, frameRate: FrameRate): number {
  return (frames / frameRate) * 1000;
}

/**
 * Format duration to human-readable string
 */
export function formatDuration(ms: number): string {
  const tc = msToTimecode(ms, 24);
  return formatTimecode(tc);
}

/**
 * Pad number to 2 digits
 */
function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

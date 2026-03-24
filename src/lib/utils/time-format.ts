/**
 * Utilities to format frame counts into human-readable time labels (mm:ss)
 */
export function formatFramesToTime(frames: number, fps = 24): string {
	const totalSeconds = Math.floor(frames / fps);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatFramesLabel(currentFrames: number, totalFrames: number, fps = 24): string {
	return `${formatFramesToTime(currentFrames, fps)} / ${formatFramesToTime(totalFrames, fps)}`;
}

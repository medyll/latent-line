/**
 * Shared reactive playback state.
 * Created in +page.svelte, set as context so both
 * SequenceOrchestrator (writer) and PreviewPanel (reader) can access it.
 */
export function createPlaybackStore() {
	let playheadTime = $state(0);
	let isPlaying = $state(false);

	return {
		get playheadTime() {
			return playheadTime;
		},
		set playheadTime(v: number) {
			playheadTime = v;
		},
		get isPlaying() {
			return isPlaying;
		},
		set isPlaying(v: boolean) {
			isPlaying = v;
		}
	};
}

export type PlaybackStore = ReturnType<typeof createPlaybackStore>;

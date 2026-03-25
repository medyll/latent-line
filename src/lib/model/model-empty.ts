import type { Model } from './model-types';
import { modelSchema } from './model-template';

const EMPTY: Model = {
	project: { name: 'Nouveau projet', fps: 24, resolution: { w: 1920, h: 1080 } },
	assets: { characters: [], environments: {}, audio: [] },
	timeline: [],
	markers: [],
	config: { audioLanes: [] }
};

/** Return a validated deep-clone of the empty model. */
export function createEmptyModel(): Model {
	const parsed = modelSchema.safeParse(EMPTY);
	if (!parsed.success) {
		throw new Error('createEmptyModel: validation failed — ' + parsed.error.message);
	}
	return JSON.parse(JSON.stringify(parsed.data)) as Model;
}

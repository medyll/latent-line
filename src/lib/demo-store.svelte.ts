import exampleStoryModel from './model/model-story-example';
import type { Model } from './model/model-types';

/** Reactive model preloaded with the example story, for demos and Storybook-style
 *  pages. The editor builds its own store rather than using this one. */
export const modelStore = $state<Model>(exampleStoryModel as Model);

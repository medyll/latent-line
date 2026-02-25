import exampleStoryModel from "./model/model-story-example";
import type { Model } from "./model/model-types";


export const modelStore = $state<Model>(exampleStoryModel as Model);
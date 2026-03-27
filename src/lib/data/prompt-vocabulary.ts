/**
 * prompt-vocabulary.ts
 *
 * Offline vocabulary catalog for contextual AI prompt suggestions.
 * Organized by category: Movement, Emotion, Environment, Cinematic.
 * Used by PromptAssist component in PropertiesPanel.
 */

export interface PromptVocabulary {
	[category: string]: string[];
}

export const PROMPT_VOCABULARY: PromptVocabulary = {
	Movement: [
		'walking',
		'running',
		'jumping',
		'dancing',
		'crawling',
		'climbing',
		'falling',
		'spinning',
		'sliding',
		'leaping',
		'stumbling',
		'staggering',
		'gliding',
		'floating',
		'hovering',
		'swaying',
		'twirling',
		'striding',
		'trudging',
		'skipping',
		'sprinting',
		'galloping',
		'waltzing',
		'stretching',
		'reaching',
		'grasping',
		'throwing',
		'catching',
		'punching',
		'kicking',
		'pushing',
		'pulling',
		'lifting',
		'carrying',
		'dragging',
		'rolling',
		'tumbling',
		'flipping',
		'backflipping',
		'somersaulting'
	],
	Emotion: [
		'joyful',
		'melancholic',
		'anxious',
		'serene',
		'curious',
		'angry',
		'sad',
		'happy',
		'excited',
		'bored',
		'confused',
		'surprised',
		'scared',
		'relieved',
		'proud',
		'ashamed',
		'hopeful',
		'desperate',
		'peaceful',
		'tense',
		'calm',
		'frantic',
		'wistful',
		'nostalgic',
		'determined',
		'hesitant',
		'confident',
		'doubtful',
		'passionate',
		'apathetic',
		'loving',
		'hateful',
		'tender',
		'harsh',
		'playful',
		'serious',
		'mischievous',
		'solemn',
		'whimsical'
	],
	Environment: [
		'indoor',
		'outdoor',
		'urban',
		'rural',
		'forest',
		'desert',
		'mountains',
		'beach',
		'ocean',
		'river',
		'lake',
		'caves',
		'underground',
		'underwater',
		'sky',
		'clouds',
		'rain',
		'snow',
		'fog',
		'sunny',
		'night',
		'dawn',
		'dusk',
		'cyberpunk',
		'futuristic',
		'steampunk',
		'medieval',
		'renaissance',
		'modern',
		'minimalist',
		'cluttered',
		'overgrown',
		'desolate',
		'lush',
		'industrial',
		'rustic',
		'luxurious',
		'shabby',
		'pristine',
		'worn'
	],
	Cinematic: [
		'shallow depth of field',
		'cinematic lighting',
		'dramatic shadows',
		'soft lighting',
		'hard lighting',
		'volumetric light',
		'golden hour',
		'blue hour',
		'silhouette',
		'backlit',
		'side-lit',
		'rim lighting',
		'three-point lighting',
		'chiaroscuro',
		'color grading',
		'film noir',
		'technicolor',
		'desaturated',
		'high contrast',
		'low contrast',
		'lens flare',
		'motion blur',
		'depth of field',
		'tilt shift',
		'fisheye lens',
		'wide-angle',
		'telephoto',
		'macro',
		'bokeh',
		'grain',
		'chromatic aberration',
		'vignette',
		'bloom',
		'glow',
		'contrast',
		'saturation',
		'hue shift',
		'color correction',
		'aspect ratio 16:9',
		'aspect ratio 4:3',
		'aspect ratio 1:1',
		'anamorphic',
		'widescreen',
		'steady cam',
		'dolly',
		'crane shot',
		'handheld',
		'aerial',
		'drone footage',
		'slow motion',
		'fast motion',
		'time lapse',
		'freeze frame'
	]
};

/**
 * Get suggestions filtered by relevance.
 * Supports filtering by multiple parameters (character mood, environment, etc.).
 */
export function getSuggestions(category: string, searchTerm?: string): string[] {
	const suggestions = PROMPT_VOCABULARY[category] ?? [];

	if (!searchTerm) return suggestions;

	const term = searchTerm.toLowerCase();
	return suggestions.filter((s) => s.toLowerCase().includes(term));
}

/**
 * Get all categories available.
 */
export function getCategories(): string[] {
	return Object.keys(PROMPT_VOCABULARY);
}

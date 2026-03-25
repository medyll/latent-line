export const MOOD_COLORS: Record<string, { bg: string; border: string; text: string }> = {
	joyful: { bg: '#f0fdf4', border: '#22c55e', text: '#15803d' },
	melancholic: { bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8' },
	anxious: { bg: '#fff7ed', border: '#f97316', text: '#c2410c' },
	serene: { bg: '#f0f9ff', border: '#0ea5e9', text: '#0369a1' },
	curious: { bg: '#faf5ff', border: '#a855f7', text: '#7e22ce' }
};

export function getMoodColor(mood?: string) {
	if (!mood) return null;
	return MOOD_COLORS[mood] ?? null;
}

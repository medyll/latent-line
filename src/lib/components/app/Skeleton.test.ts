import { describe, it, expect } from 'vitest';
import Skeleton from '$lib/components/app/Skeleton.svelte';
import LoadingOverlay from '$lib/components/app/LoadingOverlay.svelte';

describe('Skeleton component', () => {
	it('is defined', () => {
		expect(Skeleton).toBeDefined();
	});
});

describe('LoadingOverlay component', () => {
	it('is defined', () => {
		expect(LoadingOverlay).toBeDefined();
	});
});

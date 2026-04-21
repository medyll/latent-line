/**
 * Reactive hooks for using Web Workers in Svelte 5 components
 */

import { createWorkerPool, type WorkerType } from './worker-pool';

/**
 * Hook for search indexing in a worker
 */
export function useSearchWorker() {
	let workerPool = $state<any>(null);
	let isIndexing = $state(false);
	let isSearching = $state(false);
	let index = $state<any>(null);
	let lastResults = $state<any>(null);
	let error = $state<string | null>(null);

	function init() {
		if (!workerPool) {
			workerPool = createWorkerPool(
				new URL('../workers/search-index.worker.ts', import.meta.url),
				2,
				'search'
			);
		}
	}

	async function indexModel(model: any) {
		init();
		isIndexing = true;
		error = null;

		try {
			const result = await workerPool.run({
				type: 'index',
				model
			});

			index = result.index;
			isIndexing = false;
			return index;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Indexing failed';
			isIndexing = false;
			throw err;
		}
	}

	async function search(query: string, model: any, filters?: any) {
		init();
		isSearching = true;
		error = null;

		try {
			const result = await workerPool.run({
				type: 'search',
				query: { query, model, filters },
				index
			});

			lastResults = result;
			isSearching = false;
			return result;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Search failed';
			isSearching = false;
			throw err;
		}
	}

	function destroy() {
		if (workerPool) {
			workerPool.terminate();
			workerPool = null;
		}
	}

	return {
		get isIndexing() { return isIndexing; },
		get isSearching() { return isSearching; },
		get index() { return index; },
		get lastResults() { return lastResults; },
		get error() { return error; },
		indexModel,
		search,
		destroy
	};
}

/**
 * Hook for model validation in a worker
 */
export function useValidationWorker() {
	let workerPool = $state<any>(null);
	let isValidating = $state(false);
	let lastResult = $state<any>(null);
	let error = $state<string | null>(null);

	function init() {
		if (!workerPool) {
			workerPool = createWorkerPool(
				new URL('../workers/validation.worker.ts', import.meta.url),
				1,
				'validation'
			);
		}
	}

	async function validate(model: any, strict = false) {
		init();
		isValidating = true;
		error = null;

		try {
			const result = await workerPool.run({
				type: 'validate',
				model,
				strict
			});

			lastResult = result;
			isValidating = false;
			return result;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Validation failed';
			isValidating = false;
			throw err;
		}
	}

	async function validateQuick(model: any) {
		init();
		isValidating = true;
		error = null;

		try {
			const result = await workerPool.run({
				type: 'validate-quick',
				model
			});

			lastResult = result;
			isValidating = false;
			return result;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Quick validation failed';
			isValidating = false;
			throw err;
		}
	}

	function destroy() {
		if (workerPool) {
			workerPool.terminate();
			workerPool = null;
		}
	}

	return {
		get isValidating() { return isValidating; },
		get lastResult() { return lastResult; },
		get error() { return error; },
		validate,
		validateQuick,
		destroy
	};
}

/**
 * Hook for export generation in a worker
 */
export function useExportWorker() {
	let workerPool = $state<any>(null);
	let isExporting = $state(false);
	let progress = $state<number>(0);
	let lastExport = $state<any>(null);
	let error = $state<string | null>(null);

	function init() {
		if (!workerPool) {
			workerPool = createWorkerPool(
				new URL('../workers/export.worker.ts', import.meta.url),
				1,
				'export'
			);
		}
	}

	async function exportModel(format: string, model: any, options?: any) {
		init();
		isExporting = true;
		progress = 0;
		error = null;

		try {
			const result = await workerPool.run({
				type: 'export',
				format,
				model,
				options
			});

			lastExport = result;
			isExporting = false;
			progress = 100;
			return result;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Export failed';
			isExporting = false;
			throw err;
		}
	}

	function destroy() {
		if (workerPool) {
			workerPool.terminate();
			workerPool = null;
		}
	}

	return {
		get isExporting() { return isExporting; },
		get progress() { return progress; },
		get lastExport() { return lastExport; },
		get error() { return error; },
		exportModel,
		destroy
	};
}

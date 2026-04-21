/**
 * Validation Worker
 * 
 * Handles Zod schema validation in a background thread.
 * Prevents UI freeze when validating large models.
 */

import { modelSchema } from '$lib/model/model-template';

interface ValidationTask {
	model: any;
	strict: boolean;
}

interface ValidationResult {
	valid: boolean;
	errors: Array<{
		path: string;
		message: string;
		code?: string;
	}>;
	warnings: string[];
	validatedAt: number;
	duration: number;
}

// Validate model against schema
function validateModel(task: ValidationTask): ValidationResult {
	const startTime = performance.now();
	const errors: ValidationResult['errors'] = [];
	const warnings: string[] = [];

	try {
		// Use safeParse for validation without throwing
		const result = modelSchema.safeParse(task.model);

		if (!result.success) {
			// Format Zod errors
			result.error.errors.forEach((err) => {
				errors.push({
					path: err.path.join('.'),
					message: err.message,
					code: err.code
				});
			});
		}

		// Additional validation rules
		if (task.model.timeline) {
			// Check for duplicate event IDs
			const eventIds = new Set();
			task.model.timeline.forEach((event: any, index: number) => {
				if (eventIds.has(event.id)) {
					errors.push({
						path: `timeline.${index}.id`,
						message: `Duplicate event ID: ${event.id}`,
						code: 'duplicate_id'
					});
				}
				eventIds.add(event.id);

				// Check for negative time values
				if (event.time < 0) {
					warnings.push(`Event ${event.id} has negative time: ${event.time}`);
				}

				// Check for zero duration
				if (event.duration === 0) {
					warnings.push(`Event ${event.id} has zero duration`);
				}
			});

			// Check timeline is sorted by time
			for (let i = 1; i < task.model.timeline.length; i++) {
				const prev = task.model.timeline[i - 1];
				const curr = task.model.timeline[i];
				if (curr.time < prev.time) {
					warnings.push(`Timeline not sorted: event ${curr.id} (time: ${curr.time}) comes after event ${prev.id} (time: ${prev.time})`);
				}
			}
		}

		// Validate asset references
		if (task.model.assets) {
			const characterIds = new Set(task.model.assets.characters?.map((c: any) => c.id) || []);
			const environmentIds = new Set(task.model.assets.environments?.map((e: any) => e.id) || []);

			task.model.timeline?.forEach((event: any, index: number) => {
				if (event.characterId && !characterIds.has(event.characterId)) {
					errors.push({
						path: `timeline.${index}.characterId`,
						message: `Invalid character reference: ${event.characterId}`,
						code: 'invalid_reference'
					});
				}
				if (event.environmentId && !environmentIds.has(event.environmentId)) {
					errors.push({
						path: `timeline.${index}.environmentId`,
						message: `Invalid environment reference: ${event.environmentId}`,
						code: 'invalid_reference'
					});
				}
			});
		}

		const duration = Math.round(performance.now() - startTime);

		return {
			valid: errors.length === 0,
			errors,
			warnings,
			validatedAt: Date.now(),
			duration
		};
	} catch (error) {
		const duration = Math.round(performance.now() - startTime);
		
		return {
			valid: false,
			errors: [{
				path: 'root',
				message: error instanceof Error ? error.message : 'Unknown validation error',
				code: 'validation_error'
			}],
			warnings: [],
			validatedAt: Date.now(),
			duration
		};
	}
}

// Handle messages from main thread
self.onmessage = function(e: MessageEvent) {
	const { type, data, taskId } = e.data;

	try {
		if (type === 'validate') {
			const task: ValidationTask = {
				model: data.model,
				strict: data.strict ?? false
			};

			const result = validateModel(task);

			self.postMessage({
				type: 'result',
				taskId,
				data: result
			});
		} else if (type === 'validate-quick') {
			// Quick validation (schema only, no business rules)
			const quickResult = modelSchema.safeParse(data.model);
			
			self.postMessage({
				type: 'result',
				taskId,
				data: {
					valid: quickResult.success,
					errors: quickResult.success ? [] : quickResult.error.errors.map((err: any) => ({
						path: err.path.join('.'),
						message: err.message
					})),
					warnings: [],
					validatedAt: Date.now(),
					duration: 0
				}
			});
		} else {
			throw new Error(`Unknown message type: ${type}`);
		}
	} catch (error) {
		self.postMessage({
			type: 'error',
			taskId,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
	}
};

export {};

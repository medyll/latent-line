/**
 * throttle.ts - Throttle function execution with minimum delay
 * @param fn - Function to throttle
 * @param delay - Minimum milliseconds between executions
 * @returns Throttled function
 */
export function throttle<T extends (...args: unknown[]) => void>(
	fn: T,
	delay: number
): (...args: Parameters<T>) => void {
	let lastCall = 0;
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	return function throttled(...args: Parameters<T>) {
		const now = Date.now();
		const timeSinceLastCall = now - lastCall;

		if (timeSinceLastCall >= delay) {
			// Enough time has passed; execute immediately
			lastCall = now;
			if (timeoutId !== null) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}
			fn(...args);
		} else {
			// Schedule for later if not already scheduled
			if (timeoutId === null) {
				const waitTime = delay - timeSinceLastCall;
				timeoutId = setTimeout(() => {
					lastCall = Date.now();
					timeoutId = null;
					fn(...args);
				}, waitTime);
			}
		}
	};
}

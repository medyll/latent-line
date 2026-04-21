/**
 * Worker Pool Manager
 * 
 * Manages a pool of Web Workers for heavy computation tasks.
 * Automatically distributes tasks across available workers.
 * 
 * @module worker-pool
 */

export type WorkerType = 'search' | 'validation' | 'export';

export interface WorkerTask {
	type: WorkerType;
	data: any;
	resolve: (result: any) => void;
	reject: (error: Error) => void;
}

export interface WorkerMessage {
	type: string;
	data?: any;
	error?: string;
	taskId?: number;
	progress?: number;
}

/**
 * WorkerPool - Manages a pool of Web Workers
 */
export class WorkerPool {
	private workers: Worker[];
	private queue: WorkerTask[] = [];
	private availableWorkers: number;
	private taskId: number = 0;
	private workerType: WorkerType;

	constructor(workerUrl: string, poolSize: number = 2, type: WorkerType = 'search') {
		this.workerType = type;
		this.workers = [];
		this.availableWorkers = poolSize;

		// Create worker pool
		for (let i = 0; i < poolSize; i++) {
			const worker = new Worker(workerUrl);
			worker.onmessage = (e) => this.handleMessage(e, i);
			worker.onerror = (e) => this.handleError(e, i);
			this.workers.push(worker);
		}
	}

	private handleMessage(event: MessageEvent, workerIndex: number) {
		const message: WorkerMessage = event.data;

		if (message.type === 'result' && message.taskId !== undefined) {
			// Task completed
			this.availableWorkers++;
			this.processQueue();

			// Resolve the promise
			const task = this.queue.find((t) => t.data.taskId === message.taskId);
			if (task) {
				task.resolve(message.data);
				this.queue = this.queue.filter((t) => t.data.taskId !== message.taskId);
			}
		} else if (message.type === 'progress' && message.progress !== undefined) {
			// Progress update (don't free worker)
			console.log(`Worker ${workerIndex} progress: ${message.progress}%`);
		} else if (message.type === 'error') {
			this.availableWorkers++;
			this.processQueue();

			const task = this.queue.find((t) => t.data.taskId === message.taskId);
			if (task) {
				task.reject(new Error(message.error || 'Unknown error'));
				this.queue = this.queue.filter((t) => t.data.taskId !== message.taskId);
			}
		}
	}

	private handleError(error: ErrorEvent, workerIndex: number) {
		console.error(`Worker ${workerIndex} error:`, error);
		this.availableWorkers++;
		this.processQueue();
	}

	private processQueue() {
		if (this.queue.length === 0 || this.availableWorkers <= 0) return;

		const workerIndex = this.workers.findIndex((_, i) => {
			// Find first available worker (simplified - in production track per-worker availability)
			return true;
		});

		if (workerIndex === -1) return;

		const task = this.queue.shift();
		if (!task) return;

		this.availableWorkers--;
		this.workers[workerIndex].postMessage({
			type: task.type,
			data: task.data,
			taskId: this.taskId++
		});
	}

	/**
	 * Run a task in the worker pool
	 */
	async run(data: any): Promise<any> {
		return new Promise((resolve, reject) => {
			const task: WorkerTask = {
				type: this.workerType,
				data,
				resolve,
				reject
			};

			if (this.availableWorkers > 0) {
				this.queue.push(task);
				this.processQueue();
			} else {
				this.queue.push(task);
			}
		});
	}

	/**
	 * Terminate all workers
	 */
	terminate(): void {
		this.workers.forEach((worker) => worker.terminate());
		this.workers = [];
		this.availableWorkers = 0;
		this.queue = [];
	}

	/**
	 * Get pool statistics
	 */
	getStats() {
		return {
			totalWorkers: this.workers.length,
			availableWorkers: this.availableWorkers,
			queueLength: this.queue.length,
			workerType: this.workerType
		};
	}
}

/**
 * Create a worker pool with automatic cleanup
 */
export function createWorkerPool(
	workerUrl: string,
	poolSize: number = 2,
	type: WorkerType = 'search'
): WorkerPool {
	return new WorkerPool(workerUrl, poolSize, type);
}

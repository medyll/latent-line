import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { RenderJob } from './render-types';

/**
 * Render jobs held in memory and mirrored to a JSON file.
 *
 * Reads and writes are deep-copied, so a caller cannot mutate stored state by
 * holding on to a returned job. Writes are serialized through one chain and land
 * via a rename, so the file is never left half-written.
 */
export class JobStore {
	private readonly jobs = new Map<string, RenderJob>();
	private writeChain = Promise.resolve();

	constructor(private readonly file: string) {}

	async load(): Promise<void> {
		try {
			const stored = JSON.parse(await readFile(this.file, 'utf8')) as RenderJob[];
			for (const job of stored) this.jobs.set(job.id, job);
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
		}
	}

	list(): RenderJob[] {
		return [...this.jobs.values()].map((job) => structuredClone(job));
	}

	get(id: string): RenderJob | undefined {
		const job = this.jobs.get(id);
		return job ? structuredClone(job) : undefined;
	}

	async set(job: RenderJob): Promise<void> {
		this.jobs.set(job.id, structuredClone(job));
		this.writeChain = this.writeChain.then(() => this.persist());
		await this.writeChain;
	}

	private async persist(): Promise<void> {
		await mkdir(path.dirname(this.file), { recursive: true });
		const temporary = `${this.file}.tmp`;
		await writeFile(temporary, JSON.stringify(this.list(), null, 2), 'utf8');
		await rename(temporary, this.file);
	}
}

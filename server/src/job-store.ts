import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { RenderJob } from './render-types';

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

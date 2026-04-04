/**
 * Render Queue Manager for ComfyUI batch rendering
 */

import type { RenderJob, RenderQueue, RenderStatus } from '$lib/types/comfy-workflow';

export class RenderQueueManager {
  private queue: RenderQueue = {
    items: [],
    status: 'idle',
    outputFolder: './output'
  };
  private onQueueChange: ((queue: RenderQueue) => void) | null = null;
  private onJobProgress: ((jobId: string, progress: number) => void) | null = null;
  private onJobComplete: ((jobId: string, outputPath: string) => void) | null = null;
  private onJobFailed: ((jobId: string, error: string) => void) | null = null;

  /**
   * Set callback for queue changes
   */
  setOnQueueChange(callback: (queue: RenderQueue) => void): void {
    this.onQueueChange = callback;
  }

  /**
   * Set callback for job progress updates
   */
  setOnJobProgress(callback: (jobId: string, progress: number) => void): void {
    this.onJobProgress = callback;
  }

  /**
   * Set callback for job completion
   */
  setOnJobComplete(callback: (jobId: string, outputPath: string) => void): void {
    this.onJobComplete = callback;
  }

  /**
   * Set callback for job failure
   */
  setOnJobFailed(callback: (jobId: string, error: string) => void): void {
    this.onJobFailed = callback;
  }

  /**
   * Add a render job to the queue
   */
  addJob(eventId: number, workflowId: string): RenderJob {
    const job: RenderJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      eventId,
      workflowId,
      status: 'queued',
      progress: 0,
      createdAt: Date.now()
    };

    this.queue.items.push(job);
    this.notifyQueueChange();
    return job;
  }

  /**
   * Remove a job from the queue
   */
  removeJob(jobId: string): void {
    this.queue.items = this.queue.items.filter((j) => j.id !== jobId);
    if (this.queue.currentItemId === jobId) {
      this.queue.currentItemId = undefined;
    }
    this.notifyQueueChange();
  }

  /**
   * Start rendering the queue
   */
  async startRendering(): Promise<void> {
    if (this.queue.status === 'rendering') return;

    this.queue.status = 'rendering';
    this.notifyQueueChange();

    await this.renderNext();
  }

  /**
   * Pause the current render
   */
  pause(): void {
    if (this.queue.status === 'rendering') {
      this.queue.status = 'paused';
      this.notifyQueueChange();
    }
  }

  /**
   * Resume a paused render
   */
  async resume(): Promise<void> {
    if (this.queue.status === 'paused') {
      this.queue.status = 'rendering';
      this.notifyQueueChange();
      await this.renderNext();
    }
  }

  /**
   * Cancel a specific job
   */
  cancelJob(jobId: string): void {
    const job = this.queue.items.find((j) => j.id === jobId);
    if (job) {
      job.status = 'cancelled';
      job.completedAt = Date.now();
      this.notifyQueueChange();
    }
  }

  /**
   * Clear completed jobs
   */
  clearCompleted(): void {
    this.queue.items = this.queue.items.filter(
      (j) => j.status !== 'completed' && j.status !== 'cancelled' && j.status !== 'failed'
    );
    this.notifyQueueChange();
  }

  /**
   * Set output folder
   */
  setOutputFolder(folder: string): void {
    this.queue.outputFolder = folder;
    this.notifyQueueChange();
  }

  /**
   * Get current queue state
   */
  getQueue(): RenderQueue {
    return { ...this.queue, items: [...this.queue.items] };
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): RenderJob | undefined {
    return this.queue.items.find((j) => j.id === jobId);
  }

  /**
   * Get queued jobs count
   */
  getQueuedCount(): number {
    return this.queue.items.filter((j) => j.status === 'queued').length;
  }

  /**
   * Get completed jobs count
   */
  getCompletedCount(): number {
    return this.queue.items.filter((j) => j.status === 'completed').length;
  }

  /**
   * Simulate render progress (for testing)
   */
  simulateProgress(jobId: string, progress: number): void {
    const job = this.queue.items.find((j) => j.id === jobId);
    if (job) {
      job.progress = progress;
      job.status = progress >= 100 ? 'completed' : 'rendering';
      if (job.status === 'completed') {
        job.completedAt = Date.now();
        job.outputPath = `${this.queue.outputFolder}/${jobId}.png`;
      }
      if (this.onJobProgress) {
        this.onJobProgress(jobId, progress);
      }
      if (job.status === 'completed' && this.onJobComplete) {
        this.onJobComplete(jobId, job.outputPath!);
      }
      this.notifyQueueChange();
    }
  }

  /**
   * Simulate job failure (for testing)
   */
  simulateFailure(jobId: string, error: string): void {
    const job = this.queue.items.find((j) => j.id === jobId);
    if (job) {
      job.status = 'failed';
      job.error = error;
      job.completedAt = Date.now();
      if (this.onJobFailed) {
        this.onJobFailed(jobId, error);
      }
      this.notifyQueueChange();
    }
  }

  /**
   * Render next job in queue
   */
  private async renderNext(): Promise<void> {
    if (this.queue.status !== 'rendering') return;

    const nextJob = this.queue.items.find((j) => j.status === 'queued');
    if (!nextJob) {
      this.queue.status = 'completed';
      this.queue.currentItemId = undefined;
      this.notifyQueueChange();
      return;
    }

    this.queue.currentItemId = nextJob.id;
    nextJob.status = 'rendering';
    nextJob.startedAt = Date.now();
    this.notifyQueueChange();

    // In production, this would call ComfyUI API
    // For now, we just mark it as rendering
  }

  /**
   * Notify queue change callback
   */
  private notifyQueueChange(): void {
    if (this.onQueueChange) {
      this.onQueueChange(this.getQueue());
    }
  }
}

/**
 * Calculate ETA based on progress and elapsed time
 */
export function calculateETA(
  progress: number,
  startTime: number
): number | undefined {
  if (progress <= 0) return undefined;

  const elapsed = Date.now() - startTime;
  const total = (elapsed / progress) * 100;
  return Math.round(total - elapsed);
}

/**
 * Format ETA to human-readable string
 */
export function formatETA(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

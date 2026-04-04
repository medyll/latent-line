import { describe, it, expect, beforeEach } from 'vitest';
import { RenderQueueManager, calculateETA, formatETA } from '$lib/utils/render-queue';

describe('RenderQueueManager', () => {
  let manager: RenderQueueManager;

  beforeEach(() => {
    manager = new RenderQueueManager();
  });

  describe('addJob', () => {
    it('adds a job to the queue', () => {
      const job = manager.addJob(1000, 'workflow_1');
      expect(job.eventId).toBe(1000);
      expect(job.workflowId).toBe('workflow_1');
      expect(job.status).toBe('queued');
      expect(job.progress).toBe(0);
    });

    it('notifies on queue change', () => {
      let notified = false;
      manager.setOnQueueChange(() => {
        notified = true;
      });

      manager.addJob(1000, 'workflow_1');
      expect(notified).toBe(true);
    });
  });

  describe('removeJob', () => {
    it('removes a job from the queue', () => {
      const job = manager.addJob(1000, 'workflow_1');
      expect(manager.getQueue().items).toHaveLength(1);

      manager.removeJob(job.id);
      expect(manager.getQueue().items).toHaveLength(0);
    });

    it('clears currentItemId if removed job was current', () => {
      const job = manager.addJob(1000, 'workflow_1');
      manager['queue'].currentItemId = job.id;

      manager.removeJob(job.id);
      expect(manager.getQueue().currentItemId).toBeUndefined();
    });
  });

  describe('startRendering', () => {
    it('sets status to rendering', async () => {
      manager.addJob(1000, 'workflow_1');
      await manager.startRendering();

      expect(manager.getQueue().status).toBe('rendering');
    });

    it('does nothing if already rendering', async () => {
      manager.addJob(1000, 'workflow_1');
      await manager.startRendering();
      await manager.startRendering();

      expect(manager.getQueue().status).toBe('rendering');
    });
  });

  describe('pause', () => {
    it('pauses rendering', async () => {
      manager.addJob(1000, 'workflow_1');
      await manager.startRendering();

      manager.pause();
      expect(manager.getQueue().status).toBe('paused');
    });

    it('does nothing if not rendering', () => {
      manager.pause();
      expect(manager.getQueue().status).toBe('idle');
    });
  });

  describe('cancelJob', () => {
    it('cancels a job', () => {
      const job = manager.addJob(1000, 'workflow_1');
      manager.cancelJob(job.id);

      expect(manager.getJob(job.id)?.status).toBe('cancelled');
      expect(manager.getJob(job.id)?.completedAt).toBeDefined();
    });
  });

  describe('clearCompleted', () => {
    it('removes completed jobs', () => {
      const job1 = manager.addJob(1000, 'workflow_1');
      const job2 = manager.addJob(2000, 'workflow_2');

      manager.simulateProgress(job1.id, 100);
      manager.simulateProgress(job2.id, 50);

      manager.clearCompleted();

      const queue = manager.getQueue();
      expect(queue.items).toHaveLength(1);
      expect(queue.items[0].id).toBe(job2.id);
    });
  });

  describe('setOutputFolder', () => {
    it('sets the output folder', () => {
      manager.setOutputFolder('/custom/output');
      expect(manager.getQueue().outputFolder).toBe('/custom/output');
    });
  });

  describe('getQueuedCount', () => {
    it('returns count of queued jobs', () => {
      manager.addJob(1000, 'workflow_1');
      manager.addJob(2000, 'workflow_2');

      expect(manager.getQueuedCount()).toBe(2);
    });
  });

  describe('getCompletedCount', () => {
    it('returns count of completed jobs', () => {
      const job1 = manager.addJob(1000, 'workflow_1');
      const job2 = manager.addJob(2000, 'workflow_2');

      manager.simulateProgress(job1.id, 100);
      manager.simulateProgress(job2.id, 50);

      expect(manager.getCompletedCount()).toBe(1);
    });
  });

  describe('simulateProgress', () => {
    it('updates job progress', () => {
      const job = manager.addJob(1000, 'workflow_1');
      manager.simulateProgress(job.id, 50);

      expect(manager.getJob(job.id)?.progress).toBe(50);
      expect(manager.getJob(job.id)?.status).toBe('rendering');
    });

    it('completes job at 100%', () => {
      const job = manager.addJob(1000, 'workflow_1');
      manager.simulateProgress(job.id, 100);

      expect(manager.getJob(job.id)?.status).toBe('completed');
      expect(manager.getJob(job.id)?.outputPath).toBeDefined();
    });

    it('calls progress callback', () => {
      let progressCalled = false;
      manager.setOnJobProgress(() => {
        progressCalled = true;
      });

      const job = manager.addJob(1000, 'workflow_1');
      manager.simulateProgress(job.id, 50);

      expect(progressCalled).toBe(true);
    });
  });

  describe('simulateFailure', () => {
    it('marks job as failed', () => {
      const job = manager.addJob(1000, 'workflow_1');
      manager.simulateFailure(job.id, 'Out of memory');

      expect(manager.getJob(job.id)?.status).toBe('failed');
      expect(manager.getJob(job.id)?.error).toBe('Out of memory');
    });

    it('calls failure callback', () => {
      let failedCalled = false;
      manager.setOnJobFailed(() => {
        failedCalled = true;
      });

      const job = manager.addJob(1000, 'workflow_1');
      manager.simulateFailure(job.id, 'Error');

      expect(failedCalled).toBe(true);
    });
  });
});

describe('calculateETA', () => {
  it('returns undefined for zero progress', () => {
    expect(calculateETA(0, Date.now())).toBeUndefined();
  });

  it('calculates ETA based on progress rate', () => {
    const startTime = Date.now() - 10000; // 10 seconds ago
    const eta = calculateETA(50, startTime); // 50% done

    expect(eta).toBeDefined();
    expect(eta!).toBeCloseTo(10000, -2); // Should be about 10 seconds remaining
  });
});

describe('formatETA', () => {
  it('formats seconds', () => {
    expect(formatETA(30)).toBe('30s');
  });

  it('formats minutes and seconds', () => {
    expect(formatETA(125)).toBe('2m 5s');
  });

  it('handles zero', () => {
    expect(formatETA(0)).toBe('0s');
  });
});

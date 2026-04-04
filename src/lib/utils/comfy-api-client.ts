/**
 * ComfyUI API Client for Latent-line
 *
 * Handles communication with ComfyUI server for rendering.
 */

import type { RenderProgress } from '$lib/types/comfy-workflow';

export interface ComfyPrompt {
  prompt: Record<string, unknown>;
  client_id: string;
}

export interface ComfyOutput {
  images: Array<{
    filename: string;
    subfolder: string;
    type: string;
  }>;
}

export class ComfyApiClient {
  private ws: WebSocket | null = null;
  private baseUrl: string;
  private clientId: string;
  private progressCallbacks = new Map<string, (sessionId: string, progress: number) => void>();
  private completeCallbacks = new Map<string, (sessionId: string, output: ComfyOutput) => void>();

  constructor(baseUrl = 'http://localhost:8188', clientId = 'latent-line') {
    this.baseUrl = baseUrl;
    this.clientId = clientId;
  }

  /**
   * Connect to ComfyUI WebSocket
   */
  async connect(): Promise<void> {
    const wsUrl = this.baseUrl.replace('http', 'ws') + `/ws?clientId=${this.clientId}`;

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('Connected to ComfyUI');
        resolve();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data as string);
      };

      this.ws.onerror = (err) => {
        console.error('ComfyUI WebSocket error:', err);
        reject(err);
      };

      this.ws.onclose = () => {
        console.log('Disconnected from ComfyUI');
        this.ws = null;
      };
    });
  }

  /**
   * Submit a prompt for rendering
   */
  async submitPrompt(prompt: ComfyPrompt): Promise<string> {
    const response = await fetch(`${this.baseUrl}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prompt)
    });

    if (!response.ok) {
      throw new Error(`ComfyUI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.prompt_id as string;
  }

  /**
   * Get current progress for a session
   */
  async getProgress(sessionId: string): Promise<RenderProgress> {
    const response = await fetch(`${this.baseUrl}/history/${sessionId}`);

    if (!response.ok) {
      throw new Error(`ComfyUI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return this.parseProgress(sessionId, data);
  }

  /**
   * Get preview image for a session
   */
  async getPreview(sessionId: string): Promise<Blob | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/view?filename=preview_${sessionId}.png&type=temp`
      );
      if (response.ok) {
        return await response.blob();
      }
    } catch {
      // Preview not available
    }
    return null;
  }

  /**
   * Cancel a running session
   */
  async cancel(sessionId: string): Promise<void> {
    await fetch(`${this.baseUrl}/interrupt`, {
      method: 'POST'
    });
  }

  /**
   * Register progress callback
   */
  onProgress(callback: (sessionId: string, progress: number) => void): () => void {
    const id = `cb_${Date.now()}`;
    this.progressCallbacks.set(id, callback);
    return () => this.progressCallbacks.delete(id);
  }

  /**
   * Register completion callback
   */
  onComplete(callback: (sessionId: string, output: ComfyOutput) => void): () => void {
    const id = `cb_${Date.now()}`;
    this.completeCallbacks.set(id, callback);
    return () => this.completeCallbacks.delete(id);
  }

  /**
   * Disconnect from ComfyUI
   */
  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      if (message.type === 'progress') {
        const { prompt_id, value, max } = message.data;
        const progress = max > 0 ? (value / max) * 100 : 0;

        for (const callback of this.progressCallbacks.values()) {
          callback(prompt_id, progress);
        }
      } else if (message.type === 'executed') {
        const { prompt_id, output } = message.data;
        if (output) {
          for (const callback of this.completeCallbacks.values()) {
            callback(prompt_id, output);
          }
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  /**
   * Parse progress from history response
   */
  private parseProgress(sessionId: string, data: Record<string, unknown>): RenderProgress {
    const sessionData = data[sessionId] as Record<string, unknown> | undefined;

    if (!sessionData) {
      return {
        sessionId,
        status: 'queued',
        currentStep: 0,
        totalSteps: 0,
        logs: []
      };
    }

    const status = sessionData.status as string;
    const outputs = sessionData.outputs as Record<string, unknown> | undefined;

    return {
      sessionId,
      status: status === 'success' ? 'completed' : status === 'error' ? 'failed' : 'rendering',
      currentStep: 0,
      totalSteps: 0,
      logs: sessionData.status_messages as string[] || [],
      previewUrl: outputs ? this.getPreviewUrl(outputs) : undefined
    };
  }

  /**
   * Get preview URL from outputs
   */
  private getPreviewUrl(outputs: Record<string, unknown>): string | undefined {
    for (const [, value] of Object.entries(outputs)) {
      const images = (value as { images?: Array<{ filename: string }> })?.images;
      if (images && images.length > 0) {
        return `${this.baseUrl}/view?filename=${images[0].filename}`;
      }
    }
    return undefined;
  }
}

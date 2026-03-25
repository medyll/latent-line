<script lang="ts">
	import { type Preferences } from '$lib/stores/preferences.svelte';
	import { AIBackend, type AIBackendConfig } from '$lib/services/ai-backend';
	import { toast } from '$lib/stores/toast.svelte';

	interface Props {
		open: boolean;
		prefs: Preferences;
		onClose: () => void;
	}

	let { open, prefs, onClose }: Props = $props();

	let backend = $state<'comfyui' | 'a1111'>(prefs.comfyui?.backend ?? 'a1111');
	let url = $state(prefs.comfyui?.url ?? 'http://localhost:7860');
	let api_key = $state(prefs.comfyui?.api_key ?? '');
	let enabled = $state(prefs.comfyui?.enabled ?? false);
	let testing = $state(false);
	let testResult = $state<{ ok: boolean; error?: string } | null>(null);

	async function testConnection() {
		testing = true;
		testResult = null;

		try {
			const config: AIBackendConfig = {
				backend,
				url,
				api_key: api_key || undefined,
				timeout: 5000
			};
			const aiBackend = new AIBackend(config);
			const result = await aiBackend.testConnection();
			testResult = result;

			if (result.ok) {
				toast.success(`✓ Connected to ${backend}`);
			} else {
				toast.error(`✗ Connection failed: ${result.error}`);
			}
		} catch (err) {
			const error = err instanceof Error ? err.message : String(err);
			testResult = { ok: false, error };
			toast.error(`✗ ${error}`);
		} finally {
			testing = false;
		}
	}

	function save() {
		if (!prefs.comfyui) {
			prefs.comfyui = {
				enabled: false,
				backend: 'a1111',
				url: ''
			};
		}

		prefs.comfyui.backend = backend;
		prefs.comfyui.url = url;
		prefs.comfyui.api_key = api_key || undefined;
		prefs.comfyui.enabled = enabled && !!url;

		toast.success('✓ ComfyUI settings saved');
		onClose();
	}

	function reset() {
		backend = 'a1111';
		url = '';
		api_key = '';
		enabled = false;
		testResult = null;
	}
</script>

{#if open}
	<div class="modal-overlay" onclick={onClose}>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<h2>ComfyUI / Stable Diffusion Settings</h2>

			<div class="form-group">
				<label for="backend">Backend Type:</label>
				<select id="backend" bind:value={backend}>
					<option value="a1111">Automatic1111 (Stable Diffusion WebUI)</option>
					<option value="comfyui">ComfyUI</option>
				</select>
			</div>

			<div class="form-group">
				<label for="url">Server URL:</label>
				<input
					id="url"
					type="text"
					bind:value={url}
					placeholder="http://localhost:7860"
					class="input-field"
				/>
				<small>e.g., http://localhost:7860 or http://192.168.1.100:7860</small>
			</div>

			<div class="form-group">
				<label for="api_key">API Key (optional):</label>
				<input
					id="api_key"
					type="password"
					bind:value={api_key}
					placeholder="Leave blank if not required"
					class="input-field"
				/>
			</div>

			<div class="form-group">
				<label>
					<input type="checkbox" bind:checked={enabled} disabled={!url} />
					Enable ComfyUI integration
				</label>
			</div>

			<div class="button-group">
				<button
					onclick={testConnection}
					disabled={!url || testing}
					class="btn-secondary"
					title="Test connection to the configured server"
				>
					{testing ? '⏳ Testing...' : '🔌 Test Connection'}
				</button>
			</div>

			{#if testResult}
				<div class={`test-result ${testResult.ok ? 'success' : 'error'}`}>
					{#if testResult.ok}
						✓ Successfully connected to {backend}
					{:else}
						✗ Connection failed: {testResult.error}
					{/if}
				</div>
			{/if}

			<div class="modal-actions">
				<button onclick={reset} class="btn-secondary">Reset</button>
				<button onclick={onClose} class="btn-secondary">Cancel</button>
				<button onclick={save} class="btn-primary">Save Settings</button>
			</div>
		</div>
	</div>
{/if}

<style>
		.modal-overlay {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: rgba(0, 0, 0, 0.5);
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 1000;
		}

		.modal-content {
			background: var(--color-surface-2);
			border: 1px solid var(--color-surface-3);
			border-radius: 8px;
			padding: 24px;
			width: 90%;
			max-width: 450px;
			max-height: 90vh;
			overflow-y: auto;
		}

		h2 {
			margin: 0 0 20px 0;
			font-size: 18px;
			font-weight: 500;
		}

		.form-group {
			margin-bottom: 16px;
		}

		label {
			display: block;
			margin-bottom: 6px;
			font-size: 13px;
			font-weight: 500;
			color: var(--color-text);
		}

		small {
			display: block;
			margin-top: 4px;
			font-size: 12px;
			color: var(--color-text-secondary);
		}

		.input-field {
			width: 100%;
			padding: 8px 12px;
			border: 1px solid var(--color-surface-3);
			border-radius: 4px;
			background: var(--color-surface-1);
			color: var(--color-text);
			font-size: 13px;
			box-sizing: border-box;
		}

		.input-field:focus {
			outline: none;
			border-color: var(--color-primary);
			background: var(--color-surface-0);
		}

		select {
			width: 100%;
			padding: 8px 12px;
			border: 1px solid var(--color-surface-3);
			border-radius: 4px;
			background: var(--color-surface-1);
			color: var(--color-text);
			font-size: 13px;
		}

		input[type='checkbox'] {
			margin-right: 8px;
		}

		.button-group {
			display: flex;
			gap: 8px;
			margin: 16px 0;
		}

		.btn-secondary {
			padding: 8px 12px;
			border: 1px solid var(--color-surface-3);
			border-radius: 4px;
			background: var(--color-surface-1);
			color: var(--color-text);
			cursor: pointer;
			font-size: 13px;
			flex: 1;
		}

		.btn-secondary:hover:not(:disabled) {
			background: var(--color-surface-2);
		}

		.btn-secondary:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		.test-result {
			padding: 12px;
			border-radius: 4px;
			margin: 12px 0;
			font-size: 13px;
		}

		.test-result.success {
			background: rgba(76, 175, 80, 0.1);
			color: #4caf50;
			border: 1px solid #4caf50;
		}

		.test-result.error {
			background: rgba(244, 67, 54, 0.1);
			color: #f44336;
			border: 1px solid #f44336;
		}

		.modal-actions {
			display: flex;
			gap: 8px;
			margin-top: 20px;
		}

		.btn-primary {
			flex: 1;
			padding: 8px 12px;
			border: none;
			border-radius: 4px;
			background: var(--color-primary);
			color: white;
			cursor: pointer;
			font-size: 13px;
			font-weight: 500;
		}

		.btn-primary:hover {
			opacity: 0.9;
		}
	</style>

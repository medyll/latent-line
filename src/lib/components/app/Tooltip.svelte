<script lang="ts">
	/**
	 * Tooltip.svelte
	 * Accessible tooltip component with delay, positioning, and keyboard support.
	 */

	import { onMount, onDestroy } from 'svelte';

	export let content = '';
	export let side: 'top' | 'bottom' | 'left' | 'right' = 'top';
	export let delay = 300;
	export let disabled = false;

	let visible = $state(false);
	let tooltipRef: HTMLElement;
	let triggerRef: HTMLElement;
	let timer: ReturnType<typeof setTimeout> | null = null;

	function show() {
		if (disabled || !content) return;
		timer = setTimeout(() => {
			visible = true;
		}, delay);
	}

	function hide() {
		if (timer) {
			clearTimeout(timer);
			timer = null;
		}
		visible = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			hide();
		}
	}

	$effect(() => {
		if (visible && tooltipRef && triggerRef) {
			positionTooltip();
		}
	});

	function positionTooltip() {
		if (!tooltipRef || !triggerRef) return;

		const triggerRect = triggerRef.getBoundingClientRect();
		const tooltipRect = tooltipRect.getBoundingClientRect();
		const gap = 8;

		let top = 0;
		let left = 0;

		switch (side) {
			case 'top':
				top = triggerRect.top - tooltipRect.height - gap;
				left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
				break;
			case 'bottom':
				top = triggerRect.bottom + gap;
				left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
				break;
			case 'left':
				top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
				left = triggerRect.left - tooltipRect.width - gap;
				break;
			case 'right':
				top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
				left = triggerRect.right + gap;
				break;
		}

		// Keep within viewport
		left = Math.max(4, Math.min(left, window.innerWidth - tooltipRect.width - 4));
		top = Math.max(4, Math.min(top, window.innerHeight - tooltipRect.height - 4));

		tooltipRef.style.top = `${top}px`;
		tooltipRef.style.left = `${left}px`;
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
	});

	onDestroy(() => {
		window.removeEventListener('keydown', handleKeydown);
		hide();
	});
</script>

<span
	bind:this={triggerRef}
	onmouseenter={show}
	onmouseleave={hide}
	onfocus={show}
	onblur={hide}
	tabindex="0"
	role="button"
	aria-describedby={visible ? 'tooltip-content' : undefined}
>
	<slot />
</span>

{#if visible && content}
	<span
		bind:this={tooltipRef}
		id="tooltip-content"
		class="tooltip"
		class:tooltip-top={side === 'top'}
		class:tooltip-bottom={side === 'bottom'}
		class:tooltip-left={side === 'left'}
		class:tooltip-right={side === 'right'}
		role="tooltip"
	>
		{content}
	</span>
{/if}

<style>
	.tooltip {
		position: fixed;
		z-index: 9999;
		padding: 6px 10px;
		font-size: 12px;
		font-weight: 500;
		color: white;
		background-color: var(--color-tooltip-bg, #1f2937);
		border-radius: 4px;
		pointer-events: none;
		white-space: nowrap;
		max-width: 300px;
		overflow: hidden;
		text-overflow: ellipsis;
		animation: tooltipFadeIn 150ms ease;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.tooltip::before {
		content: '';
		position: absolute;
		width: 6px;
		height: 6px;
		background-color: var(--color-tooltip-bg, #1f2937);
		transform: rotate(45deg);
	}

	.tooltip-top::before {
		bottom: -3px;
		left: 50%;
		margin-left: -3px;
	}

	.tooltip-bottom::before {
		top: -3px;
		left: 50%;
		margin-left: -3px;
	}

	.tooltip-left::before {
		right: -3px;
		top: 50%;
		margin-top: -3px;
	}

	.tooltip-right::before {
		left: -3px;
		top: 50%;
		margin-top: -3px;
	}

	@keyframes tooltipFadeIn {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>

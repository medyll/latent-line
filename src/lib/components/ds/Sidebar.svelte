<!-- Sidebar.svelte — Collapsible left asset panel -->
<script lang="ts">
	import { slide } from 'svelte/transition';
	import { SvelteSet } from 'svelte/reactivity';
	import Input from './Input.svelte';
	import Icon from './Icon.svelte';

	interface AssetItem {
		id: string;
		label: string;
		badge?: string;
		badgeColor?: string;
		subLabel?: string;
	}

	interface Section {
		id: string;
		label: string;
		items: AssetItem[];
	}

	interface Props {
		sections: Section[];
		search?: string;
		collapsed?: boolean;
		ontoggle?: () => void;
		onselect?: (sectionId: string, itemId: string) => void;
		onadd?: (sectionId: string) => void;
	}

	let {
		sections,
		search = $bindable(''),
		collapsed = $bindable(false),
		ontoggle,
		onselect,
		onadd
	}: Props = $props();

	let expanded = $state(new SvelteSet<string>());
	$effect(() => {
		expanded = new SvelteSet(sections.map((s) => s.id));
	});

	function toggleSection(id: string) {
		if (expanded.has(id)) expanded.delete(id);
		else expanded.add(id);
	}

	const filteredSections = $derived(
		sections
			.map((s) => ({
				...s,
				items: s.items.filter(
					(i) =>
						!search ||
						i.label.toLowerCase().includes(search.toLowerCase()) ||
						i.subLabel?.toLowerCase().includes(search.toLowerCase())
				)
			}))
			.filter((s) => s.items.length > 0)
	);
</script>

<aside class="sidebar" class:collapsed style:width={collapsed ? '44px' : '280px'}>
	{#if !collapsed}
		<div class="sidebar-inner">
			<div class="sidebar-search">
				<Input bind:value={search} placeholder="Search assets…" icon="search" size="sm" />
			</div>

			<div class="sidebar-scroll">
				{#each filteredSections as section, si (section.id)}
					<div class="section" style:animation-delay="{si * 40}ms">
						<div class="section-header">
							<button
								class="section-trigger"
								onclick={() => toggleSection(section.id)}
								type="button"
								aria-expanded={expanded.has(section.id)}
							>
								<span class="section-label">{section.label}</span>
								<span class="section-arrow" class:expanded={expanded.has(section.id)}>
									<Icon name="chevronRight" size={14} />
								</span>
							</button>
							<button
								class="section-add"
								onclick={() => onadd?.(section.id)}
								type="button"
								aria-label="Add {section.label}"
							>
								<Icon name="plus" size={14} />
							</button>
						</div>

						{#if expanded.has(section.id)}
							<ul class="section-list">
								{#each section.items as item, ii (item.id)}
									<li style:animation-delay="{ii * 30}ms">
										<button
											class="item-btn"
											onclick={() => onselect?.(section.id, item.id)}
											type="button"
										>
											{#if item.badge}
												<span class="item-badge" style:background-color={item.badgeColor}
													>{item.badge}</span
												>
											{/if}
											<span class="item-label">{item.label}</span>
											{#if item.subLabel}
												<span class="item-sub">{item.subLabel}</span>
											{/if}
										</button>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<button
		class="sidebar-toggle"
		onclick={() => {
			collapsed = !collapsed;
			ontoggle?.();
		}}
		title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
		type="button"
		aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
	>
		<Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size={14} />
	</button>
</aside>

<style>
	.sidebar {
		position: relative;
		display: flex;
		flex-shrink: 0;
		background: var(--surface);
		border-right: 1px solid var(--border);
		transition: width var(--transition-normal);
		overflow: hidden;
	}

	@media (max-width: 768px) {
		.sidebar {
			position: absolute;
			z-index: 50;
			height: 100%;
			box-shadow: 2px 0 12px oklch(from var(--fg) h s l / 0.15);
		}
		.sidebar.collapsed {
			transform: translateX(-100%);
			width: 0 !important;
		}
	}

	.sidebar-inner {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.sidebar-search {
		padding: 0.5rem;
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
	}

	.sidebar-scroll {
		flex: 1;
		overflow-y: auto;
		padding: 0.25rem 0;
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		width: 100%;
		padding: 0.375rem 0.5rem;
	}

	.section-trigger {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex: 1;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-muted);
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		transition: color var(--transition-fast);
	}

	.section-trigger:hover {
		color: var(--text);
	}

	.section-label {
		flex: 1;
		text-align: left;
	}

	.section-arrow {
		display: inline-flex;
		transition: transform var(--transition-fast);
	}

	.section-arrow.expanded {
		transform: rotate(90deg);
	}

	.section-add {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		background: none;
		border: none;
		border-radius: var(--radius-sm);
		color: var(--text-muted);
		cursor: pointer;
		opacity: 0;
		transition:
			opacity var(--transition-fast),
			background var(--transition-fast);
	}

	.section-header:hover .section-add {
		opacity: 1;
	}

	.section-add:hover {
		background: var(--surface-hover);
		color: var(--text);
	}

	.section-list {
		list-style: none;
		margin: 0;
		padding: 0 0.25rem 0.25rem;
	}

	.section-list li {
		animation: itemEnter 0.25s ease both;
	}

	@keyframes itemEnter {
		from {
			opacity: 0;
			transform: translateX(-6px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.item-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.375rem 0.5rem;
		background: none;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		color: var(--text);
		font-size: 0.75rem;
		text-align: left;
		transition: background var(--transition-fast);
	}

	.item-btn:hover {
		background: var(--surface-hover);
	}

	.item-badge {
		flex-shrink: 0;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 50%;
		font-size: 0.55rem;
		font-weight: 700;
		color: white;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-mono);
	}

	.item-label {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.item-sub {
		color: var(--text-muted);
		font-size: 0.6875rem;
	}

	.sidebar-toggle {
		position: absolute;
		bottom: 0.5rem;
		left: 50%;
		transform: translateX(-50%);
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--surface2);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--text-muted);
		cursor: pointer;
		transition:
			background var(--transition-fast),
			color var(--transition-fast);
		z-index: 2;
	}

	.sidebar-toggle:hover {
		background: var(--surface3);
		color: var(--text);
	}

	.collapsed .sidebar-toggle {
		position: static;
		margin: auto 0 0.5rem;
		transform: none;
		align-self: center;
	}
</style>

<script lang="ts">
	/**
	 * PresencePanel.svelte
	 * Shows who else is editing the timeline.
	 */

	import type { UserInfo } from '$lib/types/collaboration';

	let {
		users = [],
		currentUserId = ''
	}: {
		users?: UserInfo[];
		currentUserId?: string;
	} = $props();

	const otherUsers = $derived(users.filter((u) => u.id !== currentUserId));
</script>

<div class="presence-panel" role="region" aria-label="Active collaborators">
	{#if otherUsers.length === 0}
		<p class="empty-state">No other collaborators</p>
	{:else}
		<h3 class="panel-title">
			{otherUsers.length} collaborator{otherUsers.length !== 1 ? 's' : ''}
		</h3>
		<ul class="user-list" role="list">
			{#each otherUsers as user (user.id)}
				<li class="user-item" role="listitem">
					<div
						class="user-avatar"
						style="background-color: {user.color}"
						aria-hidden="true"
					>
						{user.name.charAt(0).toUpperCase()}
					</div>
					<span class="user-name">{user.name}</span>
					{#if user.isTyping}
						<span class="typing-indicator" aria-label="Typing">...</span>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.presence-panel {
		padding: 12px;
	}

	.panel-title {
		margin: 0 0 12px;
		font-size: 13px;
		font-weight: 600;
		color: var(--color-text);
	}

	.empty-state {
		margin: 0;
		font-size: 12px;
		color: var(--color-text-muted);
		text-align: center;
		padding: 16px;
	}

	.user-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.user-item {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.user-avatar {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 12px;
		font-weight: 600;
		color: white;
		flex-shrink: 0;
	}

	.user-name {
		font-size: 13px;
		color: var(--color-text);
		flex: 1;
	}

	.typing-indicator {
		font-size: 12px;
		color: var(--color-text-muted);
		animation: typingBlink 1s infinite;
	}

	@keyframes typingBlink {
		0%, 50% {
			opacity: 1;
		}
		51%, 100% {
			opacity: 0;
		}
	}
</style>

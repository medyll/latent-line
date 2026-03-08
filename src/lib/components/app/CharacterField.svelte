<script lang="ts">
	/**
	 * CharacterField.svelte
	 *
	 * @component CharacterField
	 * @description Editable character field with dropdown selector and inline edit mode.
	 *              - ST-023: Displays selected character with dropdown to change.
	 *              - Double-click to enter inline edit mode for character name.
	 * @example <CharacterField {character} {characters} on:change />
	 */
	import type { Character } from '$lib/model/model-types';

	interface Props {
		character?: string | null;
		characters: Character[];
	}

	let { character = null, characters = [] }: Props = $props();

	let isEditing = $state(false);
	let editingName = $state('');
	let inputRef: HTMLInputElement;

	const selectedCharacter = $derived(character ? characters.find((c) => c.id === character) : null);

	function handleDoubleClick() {
		isEditing = true;
		editingName = selectedCharacter?.name ?? '';
		// Focus input after render
		setTimeout(() => inputRef?.focus(), 0);
	}

	function handleBlur() {
		if (isEditing && inputRef) {
			isEditing = false;
		}
	}

	function handleInputKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			inputRef.blur();
		} else if (e.key === 'Escape') {
			isEditing = false;
		}
	}

	function handleDropdownChange(e: Event) {
		const newCharId = (e.target as HTMLSelectElement).value;
		const event = new CustomEvent('change', { detail: newCharId || null });
		dispatchEvent(event);
	}
</script>

<div class="flex items-center gap-2">
	<label for="character-select" class="w-20 shrink-0 text-xs text-gray-400">Character</label>
	<select
		id="character-select"
		value={character ?? ''}
		onchange={handleDropdownChange}
		class="flex-1 rounded border border-gray-200 bg-white px-1 py-0.5 text-xs"
		aria-label="Character selector"
	>
		<option value="">— none —</option>
		{#each characters as char}
			<option value={char.id}>{char.name}</option>
		{/each}
	</select>
	<!-- ST-023: Inline edit display (double-click to edit) -->
	{#if selectedCharacter}
		<div
			ondblclick={handleDoubleClick}
			role="button"
			tabindex="0"
			onkeydown={(e) => e.key === 'Enter' && handleDoubleClick()}
			class="flex-1 cursor-pointer rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
			aria-label={`Character: ${selectedCharacter.name}, double-click to edit`}
		>
			{#if isEditing}
				<input
					bind:this={inputRef}
					type="text"
					value={editingName}
					onblur={handleBlur}
					onkeydown={handleInputKeydown}
					placeholder="Character name"
					class="w-full rounded bg-white px-1 py-0.5 text-xs"
					aria-label="Inline edit character name"
				/>
			{:else}
				<span>{selectedCharacter.name}</span>
			{/if}
		</div>
	{:else}
		<div class="flex-1 rounded bg-gray-50 px-2 py-1 text-xs text-gray-400">— no character —</div>
	{/if}
</div>

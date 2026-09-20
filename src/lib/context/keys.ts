// Svelte context keys. Symbols rather than strings so two stores can never collide
// on a shared name, and so a key cannot be guessed from outside this module.

/** Context key for the asset store. */
export const ASSET_STORE_KEY = Symbol('assetStore');
/** Context key for the model store — the document being edited. */
export const MODEL_STORE_KEY = Symbol('modelStore');
/** Context key for the store that keeps the timeline panes scrolled together. */
export const SCROLL_SYNC_STORE_KEY = Symbol('scrollSyncStore');
/** Context key for the current selection. */
export const SELECTION_STORE_KEY = Symbol('selectionStore');
/** Context key for the undo/redo history. */
export const HISTORY_STORE_KEY = Symbol('historyStore');
/** Context key for playback state (playhead, transport). */
export const PLAYBACK_CONTEXT_KEY = Symbol('playback');
/** Context key for the saved templates. */
export const TEMPLATES_CONTEXT_KEY = Symbol('templates');
/** Context key for user preferences. */
export const PREFS_CONTEXT_KEY = Symbol('preferences');

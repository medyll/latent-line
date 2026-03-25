/**
 * generated-images.svelte.ts
 *
 * IndexedDB store for persisting generated AI images.
 * Stores base64-encoded images indexed by event_id for quick retrieval.
 */

export interface GeneratedImage {
	event_id: string;
	image_base64: string;
	generated_at: number;
	metadata?: {
		seed?: number;
		steps?: number;
		cfg_scale?: number;
	};
}

const DB_NAME = 'latent-line';
const STORE_NAME = 'generated-images';
const DB_VERSION = 1;

let db: IDBDatabase | null = null;

async function initDB(): Promise<IDBDatabase> {
	if (db) return db;

	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => {
			db = request.result;
			resolve(db);
		};

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				const store = db.createObjectStore(STORE_NAME, { keyPath: 'event_id' });
				store.createIndex('generated_at', 'generated_at', { unique: false });
			}
		};
	});
}

export const generatedImages = {
	async save(image: GeneratedImage): Promise<void> {
		const database = await initDB();
		return new Promise((resolve, reject) => {
			const tx = database.transaction([STORE_NAME], 'readwrite');
			const store = tx.objectStore(STORE_NAME);
			const request = store.put(image);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve();
		});
	},

	async get(event_id: string): Promise<GeneratedImage | undefined> {
		const database = await initDB();
		return new Promise((resolve, reject) => {
			const tx = database.transaction([STORE_NAME], 'readonly');
			const store = tx.objectStore(STORE_NAME);
			const request = store.get(event_id);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result);
		});
	},

	async getAll(): Promise<GeneratedImage[]> {
		const database = await initDB();
		return new Promise((resolve, reject) => {
			const tx = database.transaction([STORE_NAME], 'readonly');
			const store = tx.objectStore(STORE_NAME);
			const request = store.getAll();

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result || []);
		});
	},

	async delete(event_id: string): Promise<void> {
		const database = await initDB();
		return new Promise((resolve, reject) => {
			const tx = database.transaction([STORE_NAME], 'readwrite');
			const store = tx.objectStore(STORE_NAME);
			const request = store.delete(event_id);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve();
		});
	},

	async clear(): Promise<void> {
		const database = await initDB();
		return new Promise((resolve, reject) => {
			const tx = database.transaction([STORE_NAME], 'readwrite');
			const store = tx.objectStore(STORE_NAME);
			const request = store.clear();

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve();
		});
	}
};

import { modelSchema } from '$lib/model/model-template';

const DEFAULT_KEY = 'latent-line:model';

export function loadModelFromLocalStorage(key = DEFAULT_KEY) {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const validated = modelSchema.safeParse(parsed);
    return validated.success ? (validated.data as any) : null;
  } catch {
    return null;
  }
}

export function saveModelToLocalStorage(model: unknown, key = DEFAULT_KEY) {
  // Clone model to plain JSON object before validating to avoid proxy/non-enumerable issues
  const candidate = JSON.parse(JSON.stringify(model));
  try {
    const validated = modelSchema.safeParse(candidate);
    if (!validated.success) return false;
    localStorage.setItem(key, JSON.stringify(validated.data));
    // eslint-disable-next-line no-console
    console.log('[persistence] saved', key);
    return true;
  } catch (err) {
    // surface unexpected errors during E2E runs for easier debugging
    // eslint-disable-next-line no-console
    console.error('[persistence] save failed', err);
    return false;
  }
}

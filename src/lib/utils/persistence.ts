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
  try {
    const validated = modelSchema.safeParse(model);
    if (!validated.success) return false;
    localStorage.setItem(key, JSON.stringify(validated.data));
    return true;
  } catch {
    return false;
  }
}

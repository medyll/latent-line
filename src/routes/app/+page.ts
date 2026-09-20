import { redirect } from '@sveltejs/kit';

/** `/app` is a legacy path; the editor lives at the root. */
export function load() {
	redirect(307, '/');
}

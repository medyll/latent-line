import type { Model } from '$lib/model/model-types';

const MOOD_CSS: Record<string, string> = {
	joyful: '#15803d',
	melancholic: '#1d4ed8',
	anxious: '#c2410c',
	serene: '#0369a1',
	curious: '#7e22ce'
};

/** Generate a printable storyboard HTML page and open the browser print dialog. */
export function generateStoryboardPDF(model: Model): void {
	const now = new Date();
	const dateStr = now.toLocaleDateString('fr-FR');
	const events = [...model.timeline].sort((a, b) => a.time - b.time);

	const cardsHTML = events
		.map((ev, i) => {
			const actor = ev.frame.actors?.[0];
			const charName = actor
				? (model.assets.characters.find((c) => c.id === actor.id)?.name ?? actor.id)
				: '—';
			const mood = actor?.speech?.mood ?? '';
			const moodColor = MOOD_CSS[mood] ?? '#444';
			const action = (actor?.action ?? '').slice(0, 120);
			const speech = actor?.speech?.text ?? '';
			return `
			<div class="card">
				<div class="card-header">
					<span class="card-num">#${i + 1}</span>
					<span class="card-frames">${ev.time} → ${ev.time + (ev.duration ?? 24)} frames</span>
				</div>
				<div class="card-char">👤 ${charName}</div>
				${mood ? `<div class="card-mood" style="color:${moodColor}">🎭 ${mood}</div>` : ''}
				${action ? `<div class="card-action">⚡ ${action}</div>` : ''}
				${speech ? `<div class="card-speech">"${speech}"</div>` : ''}
				${ev.frame.camera?.zoom ? `<div class="card-meta">📷 zoom ${ev.frame.camera.zoom}×</div>` : ''}
			</div>`;
		})
		.join('');

	const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8">
<title>${model.project.name} — Storyboard</title>
<style>
  @page { margin: 1.5cm; size: A4; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, sans-serif; font-size: 9pt; color: #111; }
  .cover { text-align: center; padding: 1cm 0 0.8cm; border-bottom: 2px solid #000; margin-bottom: 0.6cm; }
  .cover h1 { font-size: 20pt; margin-bottom: 4pt; }
  .cover p { color: #555; font-size: 9pt; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.4cm; }
  .card { border: 1px solid #ccc; border-radius: 4px; padding: 0.25cm 0.3cm; break-inside: avoid; }
  .card-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 3pt; }
  .card-num { font-size: 13pt; font-weight: 700; }
  .card-frames { font-size: 7pt; color: #888; }
  .card-char { margin-bottom: 2pt; }
  .card-mood { font-weight: 600; margin-bottom: 2pt; }
  .card-action { color: #444; margin-bottom: 2pt; }
  .card-speech { font-style: italic; color: #555; border-left: 2px solid #bbb; padding-left: 5pt; margin-top: 3pt; }
  .card-meta { color: #888; font-size: 8pt; margin-top: 2pt; }
</style>
</head><body>
<div class="cover">
  <h1>${model.project.name}</h1>
  <p>${dateStr} &nbsp;·&nbsp; ${events.length} events &nbsp;·&nbsp; ${model.project.fps} fps &nbsp;·&nbsp; ${model.project.resolution.w}×${model.project.resolution.h}</p>
</div>
<div class="grid">${cardsHTML}</div>
</body></html>`;

	const win = window.open('', '_blank', 'noopener');
	if (!win) {
		alert('Autorisez les pop-ups pour générer le PDF.');
		return;
	}
	win.document.write(html);
	win.document.close();
	win.addEventListener('load', () => win.print(), { once: true });
}

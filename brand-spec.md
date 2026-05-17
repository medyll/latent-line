# Brand Spec — Latent-line v2.0

**Référence :** CapCut AI Studio (Avril 2026)  
**Cible :** Monteurs vidéo amateurs & pros  
**Ambiance :** Professionnel / Technique (type Datadog, GitHub)  
**Thème :** Light & Dark adaptatif  
**Accent principal :** Violet AI (#7c3aed)  
**Stack CSS :** @medyll/css-base v0.6.0 (à préserver)

---

## 🎨 Système de Thème (Light/Dark)

### Toggle Thème

- **Position :** Header, côté droit
- **Style :** Bouton icône lune/soleil
- **Stockage :** `localStorage.getItem('latent-line-theme')` → `'light' | 'dark' | 'system'`
- **Détection système :** `prefers-color-scheme`

### Application du thème

```css
:root {
	/* Valeurs par défaut (light mode) */
	--bg: oklch(1 0 0);
	--surface: oklch(0.98 0.005 240);
	--surface2: oklch(0.95 0.005 240);
	--surface3: oklch(0.9 0.005 240);
	--border: oklch(0.85 0.005 240);
	--border2: oklch(0.75 0.005 240);
	--text: oklch(0.15 0.01 240);
	--text-dim: oklch(0.4 0.01 240);
	--text-muted: oklch(0.55 0.01 240);
	--accent: oklch(0.68 0.23 25);
	--accent2: oklch(0.62 0.27 290); /* Violet AI - PRIMARY */
	--accent3: oklch(0.72 0.23 170);
	--warning: oklch(0.75 0.2 50);
	--success: oklch(0.72 0.23 170);
	--info: oklch(0.65 0.2 240);

	/* Layout */
	--font-display: 'Bebas Neue', sans-serif;
	--font-sans: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
	--font-mono: 'DM Mono', 'SF Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace;

	/* Spacing */
	--radius-sm: 4px;
	--radius-md: 6px;
	--radius-lg: 8px;
	--radius-xl: 12px;
	--radius-full: 9999px;
	--gap-xs: 4px;
	--gap-sm: 8px;
	--gap-md: 16px;
	--gap-lg: 24px;
	--gap-xl: 32px;
	--pad-xs: 4px;
	--pad-sm: 8px;
	--pad-md: 16px;
	--pad-lg: 24px;
	--border-width: 1px;
	--transition-fast: 100ms ease;
	--transition-normal: 150ms ease;

	/* Z-index */
	--z-dropdown: 100;
	--z-sticky: 200;
	--z-fixed: 300;
	--z-modal: 400;
	--z-tooltip: 500;
	--z-toast: 600;
}

/* ===== DARK MODE ===== */
@media (prefers-color-scheme: dark) {
	:root:not([data-theme='light']) {
		--bg: oklch(0.22 0.01 295); /* #2a2a3a - Fond principal */
		--surface: oklch(0.25 0.01 295); /* #30303e - Surface normale */
		--surface2: oklch(0.3 0.01 295); /* #3a3a48 - Surface élevée */
		--surface3: oklch(0.35 0.01 295); /* #444454 - Surface haute */
		--border: oklch(0.4 0.01 295); /* #4e4e62 - Bordure normale */
		--border2: oklch(0.45 0.01 295); /* #585870 - Bordure forte */
		--text: oklch(0.85 0.01 295); /* #e8e8f0 - Texte principal */
		--text-dim: oklch(0.55 0.01 295); /* #8888a0 - Texte secondaire */
		--text-muted: oklch(0.35 0.01 295); /* #585870 - Texte désactivé */
	}
}

/* Force dark mode */
[data-theme='dark'] {
	--bg: oklch(0.22 0.01 295);
	--surface: oklch(0.25 0.01 295);
	--surface2: oklch(0.3 0.01 295);
	--surface3: oklch(0.35 0.01 295);
	--border: oklch(0.4 0.01 295);
	--border2: oklch(0.45 0.01 295);
	--text: oklch(0.85 0.01 295);
	--text-dim: oklch(0.55 0.01 295);
	--text-muted: oklch(0.35 0.01 295);
	color-scheme: dark;
}

/* Force light mode */
[data-theme='light'] {
	--bg: oklch(1 0 0);
	--surface: oklch(0.98 0.005 240);
	--surface2: oklch(0.95 0.005 240);
	--surface3: oklch(0.9 0.005 240);
	--border: oklch(0.85 0.005 240);
	--border2: oklch(0.75 0.005 240);
	--text: oklch(0.15 0.01 240);
	--text-dim: oklch(0.4 0.01 240);
	--text-muted: oklch(0.55 0.01 240);
	color-scheme: light;
}

/* Surfaces spécialisées (communes aux deux thèmes) */
:root {
	--surface-hover: color-mix(in oklch, var(--text) 5%, transparent);
	--surface-active: color-mix(in oklch, var(--text) 8%, transparent);
	--surface-overlay: oklch(0.08 0.01 295);
	--surface-sunken: oklch(0.055 0.01 295);
}

/* Override pour light mode */
[data-theme='light'],
:root:not([data-theme]) {
	--surface-overlay: oklch(0.98 0.005 240);
	--surface-sunken: oklch(0.95 0.005 240);
}
```

---

## 📝 Typographie

### Font Stacks

```css
--font-display: 'Bebas Neue', sans-serif;
--font-sans: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'DM Mono', 'SF Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace;
```

**Import Google Fonts (app.html):**

```html
<link
	href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@300;400;500&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;1,300&display=swap"
	rel="stylesheet"
/>
```

### Échelle typographique

| Classe     | Taille | Usage                   |
| ---------- | ------ | ----------------------- |
| `text-xs`  | 11px   | Labels, metadata, mono  |
| `text-sm`  | 13px   | Texte secondaire, cards |
| `text-md`  | 15px   | Body principal          |
| `text-lg`  | 18px   | Sous-titres, headers    |
| `text-xl`  | 24px   | Titres de section       |
| `text-2xl` | 36px   | Titres principaux       |
| `text-3xl` | 48px   | Hero titles             |

### Poids

```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

**Note :** Bebas Neue est **display only** (ultra-condensed). À utiliser uniquement >24px.

---

## 🎯 Règles de Layout & Posture

### Principes de base

1. **Full Width Adaptif** : L'interface prend TOUTE la largeur disponible (pas de restriction à 1400px)
2. **3-Panneaux Éditeur** : Casting (gauche) / Scénarimage (centre) / Régie (droite)
3. **Card-as-Unit** : Chaque shot = une card autonome avec thumbnail + metadata
4. **AI Glow Signal** : Badge violet AI + glow subtil pour les éléments générés
5. **Densité Contrôlée** : Panels latéraux denses, espace central aéré
6. **No Shadows** : Préférer les borders et le glow subtil

### Espacements (basé sur css-base)

```css
--gap-xs: 4px; /* Entre éléments dans une card */
--gap-sm: 8px; /* Entre cards, lignes de tableau */
--gap-md: 16px; /* Entre sections, padding des cards */
--gap-lg: 24px; /* Entre groupes principaux */
--gap-xl: 32px; /* Padding des conteneurs */
```

### Bordures

```css
--border-width: 1px;
--radius-xs: 2px; /* Icônes, badges */
--radius-sm: 4px; /* Inputs, petits cards */
--radius-md: 6px; /* Cards normaux */
--radius-lg: 8px; /* Panels, grandes surfaces */
--radius-xl: 12px; /* Modals, conteneurs */
--radius-full: 9999px; /* Pill, avatars */
```

---

## ✨ Patterns AI-Specific

### AI Glow Effect

```css
.ai-glow {
	box-shadow:
		0 0 0 1px oklch(from var(--accent2) h s l / 0.5),
		0 0 12px oklch(from var(--accent2) h s l / 0.2);
}

.ai-glow-strong {
	box-shadow:
		0 0 0 2px oklch(from var(--accent2) h s l / 0.6),
		0 0 20px oklch(from var(--accent2) h s l / 0.3);
}
```

### Card Timeline avec AI Signal

```css
.timeline-card {
	background: var(--surface);
	border: 1px solid var(--border);
	border-radius: var(--radius-md);
	transition: border-color var(--transition-fast);
}

.timeline-card.ai-generated {
	border-left: 3px solid var(--accent2);
}

.timeline-card.ai-generated:hover {
	box-shadow:
		0 0 0 1px var(--accent2),
		0 0 12px oklch(from var(--accent2) h s l / 0.2);
}
```

### Waveform Audio

```css
.waveform {
	height: 40px;
	background: linear-gradient(to right, var(--border) 0%, var(--border) 50%, transparent 50%);
	background-size: 4px 100%;
	background-repeat: repeat-x;
}

.waveform-active {
	background: linear-gradient(to right, var(--accent3) 0%, var(--accent3) 50%, transparent 50%);
	background-size: 4px 100%;
}
```

### Badge AI

```css
.ai-badge {
	background: var(--accent2);
	color: white;
	font-family: var(--font-mono);
	font-size: 8px;
	font-weight: 700;
	padding: 2px 4px;
	border-radius: 2px;
	letter-spacing: 0.5px;
}
```

---

## 📋 Règles de Terminologie (Studio vs Dev)

| Ancien (Dev)           | Nouveau (Studio) | Contexte                        |
| ---------------------- | ---------------- | ------------------------------- |
| `AssetManager`         | **Casting**      | Gestion des personnages/acteurs |
| `SequenceOrchestrator` | **Scénarimage**  | Structure narrative             |
| `ModelInspector`       | **Régie**        | Contrôle technique              |
| `TimelineEvent`        | **Shot**         | Unité de base                   |
| `TimelineFrame`        | **Scene**        | État à un instant               |
| `Character`            | **Personnage**   | Acteur du récit                 |
| `Environment`          | **Décor**        | Arrière-plan                    |
| `Audio`                | **Bande-son**    | Piste audio                     |
| `Prompt`               | **Indication**   | Input créatif                   |
| `Generate`             | **Tournage**     | Action de génération            |
| `Export`               | **Montage**      | Sortie finale                   |

---

## 🎨 Mood Indicator System

Mapping visuel des humeurs :

```css
.mood-joyful {
	--mood-color: var(--accent3);
} /* Teal */
.mood-melancholic {
	--mood-color: var(--accent2);
} /* Violet */
.mood-anxious {
	--mood-color: var(--accent);
} /* Rouge */
.mood-tense {
	--mood-color: var(--warning);
} /* Orange */
.mood-serene {
	--mood-color: oklch(0.7 0.2 140);
} /* Vert */
```

Indicateur visuel : micro-bande colorée (2px) en haut de chaque card timeline.

---

## 🔍 Mapping vers css-base

| css-base                 | latent-line v2.0                |
| ------------------------ | ------------------------------- |
| `--color-primary`        | `--accent2` (violet AI #7c3aed) |
| `--color-surface`        | `--surface`                     |
| `--color-surface-alt`    | `--surface2`                    |
| `--color-surface-raised` | `--surface3`                    |
| `--color-text`           | `--text`                        |
| `--color-text-muted`     | `--text-dim`                    |
| `--color-border`         | `--border`                      |
| `--color-border-strong`  | `--border2`                     |

---

## 💡 Toggle Thème - Implémentation JS

```javascript
// Dans un composant Svelte ou script global
const THEME_KEY = 'latent-line-theme';

function getPreferredTheme() {
	const stored = localStorage.getItem(THEME_KEY);
	if (stored) return stored;
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
	const html = document.documentElement;

	if (theme === 'system') {
		html.removeAttribute('data-theme');
	} else {
		html.setAttribute('data-theme', theme);
	}

	// Update meta color-scheme
	const meta = document.querySelector('meta[name="color-scheme"]');
	if (meta) {
		meta.content = theme === 'dark' ? 'dark' : 'light';
	}

	// Update toggle button icon
	const toggle = document.getElementById('theme-toggle');
	if (toggle) {
		const icon = toggle.querySelector('svg');
		if (icon) {
			icon.innerHTML =
				theme === 'dark'
					? '<path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" stroke-width="2" fill="none"/>'
					: '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" stroke-width="2" fill="none"/>';
		}
	}
}

function toggleTheme() {
	const html = document.documentElement;
	const current =
		html.getAttribute('data-theme') ||
		(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
	const next = current === 'dark' ? 'light' : 'dark';
	localStorage.setItem(THEME_KEY, next);
	applyTheme(next);
}

// Initialiser
applyTheme(getPreferredTheme());

// Écouter les changements système
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
	if (!localStorage.getItem(THEME_KEY) || localStorage.getItem(THEME_KEY) === 'system') {
		applyTheme(e.matches ? 'dark' : 'light');
	}
});
```

**HTML Toggle Button (pour header):**

```html
<button
	id="theme-toggle"
	onclick="toggleTheme()"
	title="Changer de thème"
	style="
    width: 40px; height: 40px; 
    border: none; background: transparent; 
    cursor: pointer; color: var(--text-muted);
    border-radius: var(--radius-md);
    transition: color var(--transition-fast);
    display: flex; align-items: center; justify-content: center;
  "
	onmouseover="this.style.color='var(--text)'"
	onmouseout="this.style.color='var(--text-muted)'"
>
	<svg
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
	>
		<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
	</svg>
</button>
```

---

## 🎯 Recommandations Layout Adaptatif

### Structure de base (Full Width)

```css
/* Remplacer le container restreint par: */
body {
	margin: 0;
	padding: 0;
}

/* Les panels s'étendent sur toute la largeur */
.editor-panels {
	display: grid;
	grid-template-columns: minmax(200px, 280px) 1fr minmax(240px, 320px);
	width: 100%;
	height: 100%;
}

/* Responsive */
@media (max-width: 1200px) {
	.editor-panels {
		grid-template-columns: minmax(180px, 240px) 1fr minmax(200px, 280px);
	}
}

@media (max-width: 900px) {
	.editor-panels {
		grid-template-columns: 1fr;
		grid-template-rows: auto 1fr auto;
	}
	.panel-left,
	.panel-right {
		width: 100% !important;
		max-height: 300px;
	}
}
```

---

## ✅ Checklist de Conformité

### P0 - Obligatoire

- [ ] Tous les tokens sont en OKLch
- [ ] La palette respecte les ratios de contraste (text/surface ≥ 7:1)
- [ ] Thème light ET dark fonctionnels
- [ ] Toggle thème persistant (localStorage)
- [ ] Interface prend toute la largeur (pas de max-width)
- [ ] Accent violet AI (#7c3aed) utilisé comme primaire

### P1 - Recommandé

- [ ] Les fonts sont chargées avant le rendu
- [ ] Le thème système est respecté par défaut
- [ ] Les accents AI sont utilisés uniquement pour marquer le contenu généré
- [ ] La terminologie studio est appliquée dans toute l'UI visible
- [ ] Pas de shadows excessifs (préférer le glow subtil)

### P2 - Optionnel

- [ ] Animation de transition entre thèmes
- [ ] Indicateurs visuels pour le thème actuel
- [ ] Préférence thème dans les settings utilisateur

---

## 📊 Palette Référence (valeurs hex approximatives)

### Light Mode (Gris Technique GitHub)

| Token        | OKLch                   | Hex approx | Usage            |
| ------------ | ----------------------- | ---------- | ---------------- |
| `--bg`       | `oklch(1 0 0)`          | `#ffffff`  | Fond principal   |
| `--surface`  | `oklch(0.98 0.005 240)` | `#f6f8fa`  | Surface normale  |
| `--surface2` | `oklch(0.95 0.005 240)` | `#eaeef2`  | Surface élevée   |
| `--surface3` | `oklch(0.90 0.005 240)` | `#d8dee4`  | Surface haute    |
| `--border`   | `oklch(0.85 0.005 240)` | `#c9ced3`  | Bordure          |
| `--text`     | `oklch(0.15 0.01 240)`  | `#1f2328`  | Texte            |
| `--text-dim` | `oklch(0.40 0.01 240)`  | `#656d76`  | Texte secondaire |
| `--accent2`  | `oklch(0.62 0.27 290)`  | `#7c3aed`  | Violet AI        |

### Dark Mode (Gris Anthracite)

| Token        | OKLch                  | Hex approx | Usage            |
| ------------ | ---------------------- | ---------- | ---------------- |
| `--bg`       | `oklch(0.22 0.01 295)` | `#2a2a3a`  | Fond principal   |
| `--surface`  | `oklch(0.25 0.01 295)` | `#30303e`  | Surface normale  |
| `--surface2` | `oklch(0.30 0.01 295)` | `#3a3a48`  | Surface élevée   |
| `--surface3` | `oklch(0.35 0.01 295)` | `#444454`  | Surface haute    |
| `--border`   | `oklch(0.40 0.01 295)` | `#4e4e62`  | Bordure          |
| `--text`     | `oklch(0.85 0.01 295)` | `#e8e8f0`  | Texte            |
| `--text-dim` | `oklch(0.55 0.01 295)` | `#8888a0`  | Texte secondaire |
| `--accent2`  | `oklch(0.62 0.27 290)` | `#7c3aed`  | Violet AI        |

---

**Version :** 2.0  
**Date :** 2026-04-XX  
**Auteur :** Audit UX — Match CapCut AI Studio + Light/Dark  
**Statut :** Ready for implementation

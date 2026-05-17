# Audit QA — Refonte UX Latent Line v2.0

**Date :** 2026-05-12  
**Scope :** Comparaison maquettes (`docs/maquettes-hf-*.html`, `docs/demo-v6.html`) vs implémentation Svelte (`src/lib/components/ds/*`, `src/lib/components/app/Editor.svelte`, `src/routes/*`)  
**Méthode :** Review statique code + `pnpm run check` + `pnpm run build` + comparaison visuelle pixel/pixel (structure, tokens, interactions).

---

## Résumé Exécutif

| Critère | Score | Commentaire |
|---------|-------|-------------|
| **Architecture DS** | ⭐⭐⭐⭐⭐ | Tokens OKLch light/dark, composants atomiques, aliases legacy — solide. |
| **Build / Types** | ⭐⭐⭐☆☆ | 0 erreurs dans nos fichiers. Échec build à cause PostCSS manquant (P0). Erreurs préexistantes dans `GenerateButton`, `SequenceOrchestrator`. |
| **Fidélité maquettes** | ⭐⭐⭐☆☆ | Layout éditeur OK. Toolbar, modals, header encore sur ancien design. Thème mixte (anciens + nouveaux tokens). |
| **Fonctionnalités** | ⭐⭐⭐⭐☆ | Sidebar, grille shots, timeline dockée, playback, zoom, drag & drop, resize, panel édition — tous présents et fonctionnels. |
| **Accessibilité** | ⭐⭐⭐⭐☆ | Labels, roles, aria sur les nouveaux composants. Quelques warnings mineurs. |
| **Cohérence globale** | ⭐⭐☆☆☆ | **Le plus gros problème** : l'app est coupée en deux. Les nouveaux composants utilisent `--text`, `--surface` ; le reste de l'app utilise `--color-text`, `--color-surface`. Visuellement, ça crée des incohérences de couleur. |

**Verdict :** Les fondations sont excellentes, mais l'intégration dans l'app existante est incomplète. L'utilisateur voit un **patchwork** : header v2.0 + toolbar v1.0 + grille v2.0 + modals v1.0.

---

## P0 — Bloquants / Rupture majeure

### P0-1 : Build cassé — PostCSS Config manquant
- **Fichier :** racine (`postcss.config.js`)
- **Problème :** `vite build` échoue avec `Error: No PostCSS Config found`.
- **Impact :** Impossible de déployer. Impossible de tester en production.
- **Fix :** Créer `postcss.config.js` avec `tailwindcss` + `autoprefixer` (ou stub vide si Tailwind pas utilisé en build).
- **Effort :** 5 min.

### P0-2 : Thème mixte — app.css ne force pas le light mode
- **Fichier :** `src/lib/styles/app.css` ligne 176
- **Problème :** `[data-theme='light']` ne redéfinit aucune variable. Si l'OS est en dark et l'utilisateur choisit light, les variables restent en dark.
- **Impact :** Le toggle thème ne fonctionne pas correctement dans tous les cas.
- **Fix :** Ajouter les overrides light explicites dans `[data-theme='light']` (copier les valeurs du bloc `:root` initial).
- **Effort :** 10 min.

### P0-3 : Toolbar `+page.svelte` encore en v1.0 (emoji + anciens tokens)
- **Fichier :** `src/routes/+page.svelte` lignes 89-130 + style block
- **Problème :**
  - Boutons en emoji (`📋`, `＋`, `⬇`, `📸`, `▶`, `🎨`) au lieu d'icônes SVG du DS.
  - Style utilise `--color-surface`, `--color-text-muted` (v1.0) au lieu de `--surface`, `--text-muted` (v2.0).
  - Pas de hover states cohérents avec le DS.
  - `GenerateBatchButton` est l'ancien composant — style v1.0.
- **Impact :** La toolbar est le premier élément que l'utilisateur voit. Elle ne ressemble pas aux maquettes.
- **Fix :** Réécrire la toolbar avec le DS (Button, Icon, tokens v2.0).
- **Effort :** 30 min.

### P0-4 : Header nav link "Export" trompeur
- **Fichier :** `src/routes/+layout.svelte` ligne 76
- **Problème :** Le nav link dit "Export" mais pointe vers `/present` (Screening). C'est confusant.
- **Impact :** L'utilisateur s'attend à un export de fichiers, il obtient une projection.
- **Fix :** Renommer en "Projection" ou ajouter un vrai lien Export.
- **Effort :** 2 min.

---

## P1 — Importants / UX dégradée

### P1-1 : Modals asynchrones non stylés (v1.0)
- **Fichiers :** `ExportModal.svelte`, `SnapshotsPanel.svelte`, `ComfyUISettings.svelte`, `ProjectConfig.svelte`, `PreferencesPanel.svelte`, `OnboardingFlow.svelte`
- **Problème :** Tous ces composants sont chargés async (`{#await import(...)}`). Ils utilisent leurs propres styles internes, probablement avec les anciens tokens Tailwind/css-base. Quand ils s'ouvrent, ils cassent la cohérence visuelle.
- **Impact :** L'utilisateur passe du v2.0 au v1.0 dès qu'il ouvre un modal.
- **Fix :** Wrapper les modals dans un `ModalShell` utilisant les tokens v2.0, ou repasser sur chaque modal un par un.
- **Effort :** 2-3h par modal. Prioriser : PreferencesPanel, ExportModal.

### P1-2 : Toggle thème en texte brut (pas d'icône SVG)
- **Fichier :** `src/routes/+layout.svelte` lignes 55-59, 105
- **Problème :** `themeIcon` retourne `☀ ☾ ◐` (caractères Unicode). Pas d'icône du DS.
- **Impact :** Rendu incohérent selon l'OS/font. Pas accessible (lecteur d'écran).
- **Fix :** Utiliser le composant `<Icon name="sun|moon|system" />` du DS.
- **Effort :** 15 min.

### P1-3 : Couleurs personnages hardcodées
- **Fichier :** `src/lib/components/app/Editor.svelte` lignes 37-41
- **Problème :** `charColors` est un objet statique. Si l'utilisateur ajoute un personnage, il n'a pas de couleur.
- **Impact :** Badge gris (`#6b7280`) pour tout nouveau personnage.
- **Fix :** Générer une palette dynamique (OKLch avec hue tournant) ou stocker la couleur dans le modèle.
- **Effort :** 20 min.

### P1-4 : `workspace.css` importé — risque d'écrasement
- **Fichier :** `src/routes/+layout.svelte` ligne 6
- **Problème :** `$lib/styles/workspace.css` est importé APRÈS `app.css`. Si workspace.css contient des valeurs en dur, elle écrase nos tokens.
- **Impact :** Conflits de style difficiles à debugger.
- **Fix :** Vérifier `workspace.css` et supprimer/rediriger les conflits vers les tokens v2.0.
- **Effort :** 30 min.

### P1-5 : Double empty state possible
- **Fichier :** `src/routes/+page.svelte` ligne 46 + `src/lib/components/app/Editor.svelte` lignes 252-260
- **Problème :** `OnboardingFlow` s'affiche quand le projet est vide. L'`Editor` affiche aussi un empty state. Les deux peuvent être visibles en même temps.
- **Impact :** Redondance, confusion.
- **Fix :** Désactiver l'empty state de l'éditeur quand `showOnboarding` est true.
- **Effort :** 10 min.

### P1-6 : Mood badges utilisent des emojis
- **Fichier :** `src/lib/components/app/Editor.svelte` lignes 63-70
- **Problème :** `getMood` retourne des emojis (`☀`, `🌙`, `⚡`, `🌊`, `✦`) au lieu d'icônes SVG du DS.
- **Impact :** Incohérent avec le reste de l'UI qui utilise des SVG. Risque de rendu différent selon l'OS.
- **Fix :** Utiliser `<Icon>` dans le Badge mood.
- **Effort :** 15 min.

### P1-7 : Le composant `Button` n'a pas de style `link`
- **Fichier :** `src/lib/components/ds/Button.svelte`
- **Problème :** Il n'y a que `primary`, `secondary`, `ghost`, `danger`. Pas de style pour les liens de navigation.
- **Impact :** Le header nav utilise des `<a>` classiques sans style DS.
- **Fix :** Ajouter une variante `link` ou `nav` à Button.
- **Effort :** 10 min.

---

## P2 — Polish / Améliorations

### P2-1 : Les vieux composants workspace sont encore montés
- **Fichiers :** `SequenceOrchestrator.svelte`, `VirtualTimeline.svelte`, `AssetManager.svelte`, etc.
- **Problème :** Ils ne sont plus utilisés dans `+page.svelte` (remplacés par `Editor`), mais ils existent toujours dans le codebase. Certains ont des erreurs de type.
- **Impact :** Dette technique. Confusion pour les futurs devs.
- **Fix :** Ne pas supprimer tout de suite (risque), mais marquer comme `@deprecated`.
- **Effort :** 15 min.

### P2-2 : `app.html` charge Google Fonts en dur
- **Fichier :** `src/app.html`
- **Problème :** Les fonts (Bebas Neue, DM Sans, DM Mono) sont chargées depuis Google CDN. Pas de fallback offline.
- **Impact :** Si pas de connexion, le layout est cassé (FOUC).
- **Fix :** Self-hoster les fonts ou utiliser `font-display: swap`.
- **Effort :** 20 min.

### P2-3 : Manque de transitions entre les états de la sidebar
- **Fichier :** `src/lib/components/ds/Sidebar.svelte`
- **Problème :** Quand la sidebar collapse, le contenu disparaît brutalement (`opacity:0`).
- **Impact :** Sensation de cassure.
- **Fix :** Ajouter une transition Svelte (`slide`, `fade`) sur le contenu.
- **Effort :** 15 min.

### P2-4 : La waveform n'est pas liée à l'audio réel
- **Fichier :** `src/lib/components/ds/Waveform.svelte`
- **Problème :** Génération procédurale (`Math.sin`, `Math.random`). Pas de données audio réelles.
- **Impact :** C'est un placebo. Pas critique pour un prototype.
- **Fix :** Connecter au `AudioAsset` du modèle si URL disponible.
- **Effort :** 1h+ (hors scope immédiat).

### P2-5 : Les images des shots sont en `loading="lazy"` sans placeholder skeleton
- **Fichier :** `src/lib/components/ds/Card.svelte` ligne 64
- **Problème :** Si l'image met du temps à charger, l'utilisateur voit le placeholder gris (`16:9`) puis l'image apparaît brutalement.
- **Impact :** Sensation de lenteur.
- **Fix :** Ajouter un effet de fade-in sur l'image ou un skeleton.
- **Effort :** 15 min.

### P2-6 : Les nouveaux composants DS n'ont pas de `class` prop pour override
- **Fichiers :** `Card.svelte`, `Sidebar.svelte`, `Timeline.svelte`
- **Problème :** Impossible d'ajouter des classes Tailwind ou custom depuis le parent.
- **Impact :** Manque de flexibilité pour les cas particuliers.
- **Fix :** Ajouter `class?: string` + `class={className}` sur le root element.
- **Effort :** 20 min.

---

## Comparaison Maquette vs Implémentation (Détail)

| Élément | Maquette v6 | Implémentation | Statut |
|---------|-------------|----------------|--------|
| **Header** | Logo "LL" + nav links + toggle thème | ✅ Reproduit | ✅ |
| **Toolbar** | Boutons propres (Nouveau, Importer, Exporter, Screening...) | ❌ Emojis + anciens tokens | 🔴 P0-3 |
| **Sidebar** | Characters, Environments, Audio, search, collapse | ✅ Reproduit | ✅ |
| **Cartes Shot** | Frame number, image 16:9, badge perso, dialogue, mood, action | ✅ Reproduit | ✅ |
| **Timeline** | Ruler, events draggables, playhead, zoom | ✅ Reproduit | ✅ |
| **Waveform** | Barres animées sous la timeline | ✅ Reproduit | ✅ |
| **Panel Édition** | Slide-in avec dialogue, action, mood, duration | ✅ Reproduit | ✅ |
| **Projection** | Vue plein écran séparée | ❌ Lien externe `/present` | 🟡 P1 |
| **Paramètres** | Thème, backend, raccourcis | ❌ Ancien `PreferencesPanel` | 🟡 P1 |
| **Onboarding** | Héros + templates | ❌ Ancien `OnboardingFlow` | 🟡 P1 |
| **Modals** | Shell cohérent v2.0 | ❌ Styles v1.0 dispersés | 🔴 P1-1 |

---

## Erreurs de Build / Types

### Erreurs préexistantes (non causées par la refonte)
```
src/lib/utils/collaboration-client.ts(59,6)     : JoinPayload not assignable
src/lib/utils/use-workers.svelte.ts(21,5)       : URL not assignable to string
src/lib/utils/use-workers.svelte.ts(112,5)      : URL not assignable to string
src/lib/utils/use-workers.svelte.ts(198,5)      : URL not assignable to string
src/lib/workers/validation.worker.ts(39,17)     : ZodError 'errors' missing
src/lib/workers/validation.worker.ts(165,27)    : ZodError 'errors' missing
src/lib/components/workspace/GenerateButton.svelte : Multiple type errors (Svelte 5 migration issue)
src/lib/stores/templates.svelte.ts(29,2)        : state_referenced_locally
src/lib/model/model-store.svelte.ts             : state_referenced_locally (x3)
src/lib/components/PresentationView.svelte(5,18): state_referenced_locally
```

### Erreurs / Warnings de la refonte (à corriger)
```
Aucune erreur TS dans nos fichiers (Card, Badge, Button, Icon, Input, Sidebar, Timeline, Waveform, Editor).
Warnings Svelte mineurs : a11y_no_static_element_interactions dans Timeline (justifié, role="application").
```

---

## Plan de correction recommandé

### Sprint 0 — Hotfix (1h)
1. **P0-1** : Créer `postcss.config.js` → build passe.
2. **P0-2** : Fix `[data-theme='light']` dans `app.css`.
3. **P0-3** : Réécrire la toolbar avec le DS (Button + Icon).
4. **P0-4** : Renommer nav link "Export" → "Projection".

### Sprint 1 — Cohérence (2-3h)
5. **P1-1** : Wrapper modals dans un shell v2.0 (priorité : Preferences, Export).
6. **P1-2** : Remplacer emojis toggle par `<Icon>`.
7. **P1-3** : Couleurs personnages dynamiques.
8. **P1-5** : Désactiver double empty state.
9. **P1-6** : Remplacer emojis mood par icônes SVG.

### Sprint 2 — Polish (1-2h)
10. **P1-4** : Auditer `workspace.css` vs `app.css`.
11. **P2-3** : Transitions sidebar.
12. **P2-5** : Fade-in images Card.
13. **P2-6** : Prop `class` sur les composants DS.

---

*Rédigé par audit automatisé + review manuelle.*

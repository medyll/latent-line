# Audit UX — Latent-line → CapCut AI Studio Alignment

**Date :** Avril 2026  
**Projet :** latent-line v0.7.0  
**Référence :** CapCut AI Studio (mars 2026)  
**Cible :** Monteurs vidéo amateurs & professionnels  
**Ambiance cible :** Professionnel / Technique (type Datadog, GitHub)  

---

## 📊 Synthèse Exécutive

### État actuel (latent-line v0.7.0)
- **Infrastructure technique :** ⭐⭐⭐⭐⭐ (Excellente)
  - Modèle de données narratif riche
  - 8+ formats d'export (FCPX, Premiere, CogVideo)
  - Collaboration WebSocket
  - Render queue + batch generate
  - Persistance localStorage

- **Expérience utilisateur :** ⭐⭐ (À améliorer)
  - **Problèmes majeurs :** Moche, illisible, illogique, flow cassé
  - **Identité visuelle :** shadcn-svelte générique (gris/blanc)
  - **Terminologie :** Langage technique dev (AssetManager, TimelineEvent)
  - **Feedback visuel :** Zéro signal AI-généré vs manuel
  - **Boucle créative :** 5 étapes hors-app vs 3 étapes intégrées (CapCut)

- **Gap principal vs CapCut :**
  > "Latent-line a une infrastructure technique supérieure sur l'édition narrative. 
  > Le gap est dans la boucle de feedback visuel et l'ambiance créative — pas dans la profondeur fonctionnelle."

---

## 🎯 5 Problèmes UX Critiques (Top 5)

### 1. **Boucle de génération cassée** (P0 — Flow)
**Impact :** 🔴 Critical — Utilisateur doit quitter l'app pour générer

**Actuel :**
```
Éditer → Exporter → Ouvrir ComfyUI → Générer → Récupérer fichiers → Revenir = 5 étapes
```

**Cible (CapCut):**
```
Éditer → Générer → Voir résultat = 3 étapes (tout dans l'app)
```

**Fichiers concernés :**
- `comfy-api-client.ts` (existe, à étendre)
- `GenerateButton.svelte` (existe, rendre inline)
- `PreviewPanel.svelte` (à enrichir avec preview des résultats)
- `TimelineEvent.svelte` (ajouter bouton générer par card)

---

### 2. **Zéro signal visuel AI** (P0 — Design)
**Impact :** 🔴 Critical — Impossible de distinguer AI vs manuel

**Problème :** 
- Tous les events timeline ont la même apparence
- Aucun indicateur visuel de ce qui est généré par AI
- L'utilisateur ne sait pas ce qui a été généré

**Solution (CapCut pattern):**
- **AI Glow Signal** : Halo coloré (purple/teal) sur les éléments AI-générés
- **Card visuelle** : Chaque event = card avec thumbnail + mood indicator
- **Border coloré** : Bordure gauche colorée selon le mood

**Fichiers concernés :**
- `TimelineEvent.svelte` (ajouter AI glow + thumbnail)
- `SequenceOrchestrator.svelte` (appliquer le style aux cards)
- `app.css` (définir les classes `.ai-glow`, `.mood-*`)

---

### 3. **Identité visuelle générique** (P0 — Design)
**Impact :** 🔴 Critical — Ne ressemble pas à un studio pro

**Problème :**
- Palette : shadcn-svelte default (gris clair/blanc)
- Typography : System fonts uniquement, pas de personnalité
- Ambiance : Outil dev, pas studio créatif

**Solution :**
- **Palette :** Dark dense (#0a0a0f, #111118, #18181f) + accents AI (violet #7c3aed, teal #00d4aa, rouge #ff3d5a)
- **Fonts :** Bebas Neue (display), DM Sans (body), DM Mono (code/prompts)
- **Posture :** Panels denses, canvas aéré, glow subtil

**Fichiers concernés :**
- `brand-spec.md` (déjà créé)
- `app.css` (override les tokens css-base)
- `app.html` (importer les fonts Google)

---

### 4. **Langage technique devant l'utilisateur** (P0 — Ambiance)
**Impact :** 🔴 Critical — Cible "développeur" au lieu de "réalisateur"

**Problèmes identifiés dans le code :**

| Composant | Texte actuel | Texte cible |
|-----------|--------------|-------------|
| `AssetManager.svelte` | "Characters" | "Casting" |
| `AssetManager.svelte` | "Environments" | "Décors" |
| `AssetManager.svelte` | "Audio" | "Bande-son" |
| `SequenceOrchestrator.svelte` | "Storyboard" | "Scénarimage" |
| `SequenceOrchestrator.svelte` | "Script" | "Montage" |
| `PropertiesPanel.svelte` | "Event X — Frame Y" | "Shot X — Scène Y" |
| `+page.svelte` | "📋 Projet" | "Projet" |
| `+page.svelte` | "＋ Nouveau" | "Nouveau projet" |
| `+page.svelte` | "⬇ Export" | "Exporter" |
| `+page.svelte` | "📸 Snapshots" | "Versions" |
| `+page.svelte` | "▶ Screening" | "Projection" |
| `+page.svelte` | "🎨 ComfyUI" | "Réglages AI" |

**Fichiers concernés :**
- Tous les composants avec du texte visible
- Fichiers de traduction (`src/lib/i18n/messages/`)

---

### 5. **Empty States non inspirants** (P1 — Ambiance)
**Impact :** 🟡 High — Première impression médiocre

**Problème :**
- "No timeline events" + "Click + to add your first event"
- "No characters" + "Add your first character"
- Pas de visuel, pas d'exemple, pas de CTA clair

**Solution (CapCut):**
- **Galerie d'inspiration** : Montrer 3-4 exemples de projets finis
- **Template cards visuels** : Thumbnails + noms de templates
- **CTA fort** : "Commencez avec un template" ou "Créez votre premier shot"

**Fichiers concernés :**
- `EmptyState.svelte` (à créer)
- `TemplatesPanel.svelte` (ajouter thumbnails visuels)
- `AssetManager.svelte` (enrichir les empty states)

---

## 📋 Recommandations Complètes Priorisées

### 🔴 P0 — BLOQUANTS (4 items)

| # | Titre | Catégorie | Impact | Fichiers | Effort |
|---|-------|----------|--------|---------|--------|
| 1 | Import résultats ComfyUI → preview inline | Fonctionnalité | Boucle créative cassée | `comfy-api-client.ts`, `PreviewPanel.svelte` | Moyenne |
| 2 | Card timeline avec thumbnail + AI glow signal | Design | Identité visuelle absente | `TimelineEvent.svelte`, `SequenceOrchestrator.svelte` | Moyenne |
| 3 | Génération one-click inline par event | Fonctionnalité | Flow cassé | `GenerateButton.svelte`, `TimelineEvent.svelte` | Faible |
| 4 | Indicateur queue génération persistant | Flow | Zéro feedback | `render-queue.ts`, `+layout.svelte` | Faible |

---

### 🟡 P1 — HAUTE PRIORITÉ (6 items)

| # | Titre | Catégorie | Impact | Fichiers | Effort |
|---|-------|----------|--------|---------|--------|
| 5 | Palette couleur CapCut + identité chromatique | Design | Ambiance pro | `app.css`, `brand-spec.md` | Faible |
| 6 | Gallery templates visuels au démarrage | Fonctionnalité | Onboarding | `TemplatesPanel.svelte` | Moyenne |
| 7 | Terminologie UI "studio" vs "dev" | Ambiance | Perception | Tous les composants | Élevée |
| 8 | Waveform audio réel dans AudioTimeline | Ambiance | Studio feel | `AudioTimeline.svelte` | Moyenne |
| 9 | Mood indicator sur cards timeline | Design | Signal émotionnel | `TimelineEvent.svelte`, `model-types.ts` | Faible |
| 10 | Typographie distinctive (Bebas Neue, DM Sans, DM Mono) | Design | Identité | `app.html`, `app.css` | Faible |

---

### 🟢 P2 — MOYENNE PRIORITÉ (5 items)

| # | Titre | Catégorie | Impact | Fichiers | Effort |
|---|-------|----------|--------|---------|--------|
| 11 | Onboarding progressif 3 étapes | Flow | Rétention | `OnboardingFlow.svelte`, `workflow-builder.ts` | Moyenne |
| 12 | Bouton "Projection" visible | Flow | Discoverability | `+page.svelte`, `present/+page.svelte` | Faible |
| 13 | Snapshots repositionnés comme "versions de tournage" | Ambiance | Narrative | `SnapshotsPanel.svelte` | Faible |
| 14 | Densité adaptative (panels vs canvas) | Design | Espace respirable | `workspace.css`, `+page.svelte` | Moyenne |
| 15 | Playback flipbook réel | Fonctionnalité | Feedback visuel | `PreviewPanel.svelte`, `playback.ts` | Élevée |

---

### 🔵 P3 — FAIBLE PRIORITÉ (4 items)

| # | Titre | Catégorie | Impact | Fichiers | Effort |
|---|-------|----------|--------|---------|--------|
| 16 | Character consistency tracking | Fonctionnalité | Cohérence | `AssetManager.svelte`, `Timeline.svelte` | Élevée |
| 17 | Prompt assist contextuel | Fonctionnalité | Créativité | `PromptAssist.svelte` | Moyenne |
| 18 | Landing avec narratif produit | Ambiance | Acquisition | `/+page.svelte` | Élevée |
| 19 | State vide avec exemple animé | Ambiance | Inspiration | `EmptyState.svelte` | Moyenne |

---

## 🎨 Pattern Library (Implémentation)

### 1. AI Glow Signal Pattern

**Utilisation :** Marquer les éléments générés par AI

```css
/* Dans app.css */
.ai-generated {
  position: relative;
}

.ai-generated::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow:
    0 0 0 1px oklch(from var(--accent2) h s l / 0.5),
    0 0 12px oklch(from var(--accent2) h s l / 0.2);
  pointer-events: none;
  z-index: -1;
}

/* Pour les cards timeline */
.timeline-card.ai-generated {
  border-left: 3px solid var(--accent2);
}
```

**Exemple d'utilisation dans TimelineEvent.svelte:**
```svelte
<div
  class="timeline-card {event.frame.generated_by_ai ? 'ai-generated' : ''}"
  class:ai-generated={event.frame.generated_by_ai}
>
  <!-- contenu -->
</div>
```

---

### 2. Mood Indicator Pattern

**Utilisation :** Indicateur coloré en haut des cards

```css
/* Dans app.css */
.mood-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}

.mood-joyful     { background: var(--accent3); }
.mood-melancholic { background: var(--accent2); }
.mood-anxious    { background: var(--accent); }
.mood-tense      { background: var(--warning); }
.mood-serene     { background: var(--success); }
```

**Exemple:**
```svelte
<div class="timeline-card" style="position: relative;">
  <div class="mood-indicator mood-{event.frame.mood ?? 'serene'}"></div>
  <!-- contenu -->
</div>
```

---

### 3. Thumbnail Pattern

**Utilisation :** Miniature visuelle pour chaque event

```svelte
<!-- Dans TimelineEvent.svelte -->
<div class="thumbnail-container">
  {#if event.frame.thumbnail}
    <img 
      src={event.frame.thumbnail} 
      alt="" 
      class="thumbnail"
      loading="lazy"
    />
  {:else}
    <div class="thumbnail-placeholder">
      <span class="thumbnail-prompt">{event.frame.prompt?.slice(0, 20)}...</span>
    </div>
  {/if}
</div>

<style>
  .thumbnail-container {
    width: 100%;
    aspect-ratio: 16/9;
    overflow: hidden;
    border-radius: var(--radius-sm);
    background: var(--surface-sunken);
    position: relative;
  }
  .thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .thumbnail-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%);
  }
  .thumbnail-prompt {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--text-muted);
    padding: var(--pad-xs);
    text-align: center;
    word-break: break-word;
  }
</style>
```

---

### 4. Waveform Pattern

**Utilisation :** Afficher un waveform réaliste pour les pistes audio

```svelte
<!-- Dans AudioTimeline.svelte -->
<div class="waveform-track">
  {#each audioTrack.waveform_data as sample, i}
    <div 
      class="waveform-bar" 
      style="height: {sample * 100}%;"
    ></div>
  {/each}
</div>

<style>
  .waveform-track {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 40px;
    gap: 1px;
    padding: 2px 0;
  }
  .waveform-bar {
    flex: 1;
    max-width: 2px;
    background: var(--accent3);
    border-radius: 1px;
    opacity: 0.6;
    transition: opacity 0.2s;
  }
  .waveform-bar:hover {
    opacity: 1;
  }
</style>
```

---

### 5. Card Timeline Pattern (Complet)

**Exemple complet pour TimelineEvent.svelte:**

```svelte
<script lang="ts">
  import type { TimelineEvent } from '$lib/model/model-types';
  
  let { event, isSelected, onselect }: {
    event: TimelineEvent;
    isSelected: boolean;
    onselect: () => void;
  } = $props();
  
  const moodClass = $derived(`mood-${event.frame.mood ?? 'serene'}`);
  const isAI = $derived(!!event.frame.generated_by_ai);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="timeline-card {isSelected ? 'selected' : ''} {isAI ? 'ai-generated' : ''}"
  onclick={onselect}
  role="button"
  tabindex="0"
>
  <!-- Mood indicator -->
  <div class="mood-indicator {moodClass}"></div>
  
  <!-- Thumbnail -->
  <div class="thumbnail-container">
    {#if event.frame.thumbnail}
      <img src={event.frame.thumbnail} alt="" class="thumbnail" loading="lazy" />
    {:else}
      <div class="thumbnail-placeholder">
        {#if event.frame.prompt}
          <span class="thumbnail-prompt">{event.frame.prompt.slice(0, 25)}</span>
        {:else}
          <span class="thumbnail-empty">Shot {event.time}</span>
        {/if}
      </div>
    {/if}
    <!-- AI badge -->
    {#if isAI}
      <div class="ai-badge" title="Généré par AI">AI</div>
    {/if}
  </div>
  
  <!-- Content -->
  <div class="card-content">
    <div class="card-time">{event.time}</div>
    {#if event.frame.actors?.length}
      <div class="card-actors">
        {#each event.frame.actors.slice(0, 2) as actor}
          <span class="actor-chip">{actor.id}</span>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .timeline-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: 
      border-color var(--transition-fast),
      transform var(--transition-fast);
    position: relative;
    overflow: hidden;
  }
  
  .timeline-card:hover {
    border-color: var(--border-strong);
    transform: translateY(-1px);
  }
  
  .timeline-card.selected {
    border-color: var(--accent2);
    background: color-mix(in oklch, var(--accent2) 8%, var(--surface));
  }
  
  .timeline-card.ai-generated {
    border-left: 3px solid var(--accent2);
  }
  
  .mood-indicator {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
  }
  
  .thumbnail-container {
    width: 100%;
    aspect-ratio: 16/9;
    position: relative;
    overflow: hidden;
  }
  
  .thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .thumbnail-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%);
  }
  
  .thumbnail-prompt,
  .thumbnail-empty {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--text-muted);
    padding: var(--pad-xs);
    text-align: center;
  }
  
  .ai-badge {
    position: absolute;
    top: 4px;
    right: 4px;
    background: var(--accent2);
    color: white;
    font-family: var(--font-mono);
    font-size: 8px;
    font-weight: 700;
    padding: 2px 4px;
    border-radius: 2px;
    letter-spacing: 0.5px;
  }
  
  .card-content {
    padding: var(--pad-sm);
  }
  
  .card-time {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--text-dim);
  }
  
  .actor-chip {
    display: inline-block;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius-full);
    padding: 2px 6px;
    font-size: var(--text-xs);
    margin-right: 4px;
    margin-top: 2px;
  }
</style>
```

---

## 📁 Mapping Fichiers → Actions

### Phase 1 : Design System (1 semaine)

| Fichier | Action | Priorité |
|--------|--------|----------|
| `brand-spec.md` | ✅ Créé | P0 |
| `app.html` | Ajouter Google Fonts (Bebas Neue, DM Sans, DM Mono) | P0 |
| `app.css` | Override css-base avec palette CapCut | P0 |
| `workspace.css` | Adapter les classes aux nouveaux tokens | P0 |

### Phase 2 : Composants Core (2 semaines)

| Composant | Actions | Priorité |
|-----------|---------|----------|
| `TimelineEvent.svelte` | Ajouter thumbnail, AI glow, mood indicator | P0 |
| `SequenceOrchestrator.svelte` | Appliquer nouveau style cards, glow | P0 |
| `PropertiesPanel.svelte` | Adapter typographie, couleurs | P0 |
| `AssetManager.svelte` | Changer noms (Casting, Décors, Bande-son) | P0 |
| `AudioTimeline.svelte` | Ajouter waveform visuel | P1 |
| `GenerateButton.svelte` | Rendre inline, accessible depuis chaque card | P0 |
| `PreviewPanel.svelte` | Afficher preview des frames générées | P0 |

### Phase 3 : Ambiance & Flow (1 semaine)

| Composant | Actions | Priorité |
|-----------|---------|----------|
| `+page.svelte` | Changer noms boutons toolbar, terminologie | P0 |
| `EmptyState.svelte` | Créer composant avec galerie d'inspiration | P1 |
| `TemplatesPanel.svelte` | Ajouter thumbnails visuels | P1 |
| `SnapshotsPanel.svelte` | Renommer en "Versions" + thumbnails | P1 |
| `OnboardingFlow.svelte` | 3 étapes progressives | P2 |

### Phase 4 : Fonctionnalités Avancées (2 semaines)

| Composant | Actions | Priorité |
|-----------|---------|----------|
| `comfy-api-client.ts` | Étendre pour récupérer outputs | P0 |
| `playback.ts` | Implémenter flipbook réel | P2 |
| `render-queue.ts` | Indicateur persistant en header | P0 |
| `PromptAssist.svelte` | Enrichir avec suggestions contextuelles | P2 |

---

## ✅ Checklist de Conformité

### Design System
- [ ] Palette CapCut appliquée dans `app.css`
- [ ] Fonts Google chargées dans `app.html`
- [ ] Tokens OKLch utilisés partout
- [ ] Thème sombre par défaut
- [ ] Pas de couleurs hex dures (tout en variables CSS)

### Composants
- [ ] `TimelineEvent` a thumbnail + AI glow + mood indicator
- [ ] `AssetManager` utilise "Casting", "Décors", "Bande-son"
- [ ] `SequenceOrchestrator` utilise "Scénarimage", "Montage"
- [ ] `AudioTimeline` a waveform visuel
- [ ] `PropertiesPanel` utilise typographie correcte
- [ ] `GenerateButton` accessible inline depuis timeline

### Ambiance
- [ ] Terminologie studio appliquée partout
- [ ] Empty states avec visuels inspirants
- [ ] Pas d'emoji dans les labels
- [ ] Boutons avec icônes SVG au lieu d'emoji
- [ ] Signaux AI visibles sur tous les éléments générés

### Flow
- [ ] Boucle de génération fermée (sans quitter l'app)
- [ ] Indicateur queue visible en header
- [ ] Bouton "Projection" accessible
- [ ] Onboarding 3 étapes fonctionnel

---

## 📊 Métriques de Succès

### Avant/Après

| Métrique | Avant | Après | Cible |
|----------|-------|-------|-------|
| Temps pour générer 1 shot | 5+ min (hors-app) | <30s (inline) | <15s |
| Taux de rétention jour 1 | ? | +40% | +50% |
| Score NPS (Net Promoter Score) | ? | +25 | +35 |
| Temps moyen par session | ? | +30% | +50% |
| Nombre de shots générés/session | ? | +100% | +200% |

### Benchmark vs CapCut

| Feature | CapCut AI Studio | latent-line (actuel) | latent-line (cible) |
|---------|-------------------|----------------------|----------------------|
| Génération inline | ✅ Oui | ❌ Non | ✅ Oui |
| AI Glow Signal | ✅ Oui | ❌ Non | ✅ Oui |
| Cards visuelles | ✅ Oui | ❌ Non (texte) | ✅ Oui |
| Waveform audio | ✅ Oui | ❌ Non | ✅ Oui |
| Terminologie studio | ✅ Oui | ❌ Non (dev) | ✅ Oui |
| Canvas infini | ✅ Oui | ❌ Non (timeline) | ⚠️ Partiel |
| Free tier | ✅ 150 crédits/semaine | ❌ Non | ⚠️ À étudier |

---

## 🎬 Roadmap d'Implémentation

### Sprint 1 (1 semaine) : Fondations Design
**Objectif :** Design system + palette + typographie

- [ ] Appliquer `brand-spec.md` dans `app.css`
- [ ] Importer fonts Google
- [ ] Créer composants de base (AI glow, mood indicator, thumbnail)
- [ ] Adapter `workspace.css` aux nouveaux tokens

**Livrable :** Design system fonctionnel, 1 écran de test

---

### Sprint 2 (2 semaines) : Timeline & Cards
**Objectif :** Timeline visuelle avec cards enrichies

- [ ] Refactor `TimelineEvent.svelte` avec nouveau design
- [ ] Adapter `SequenceOrchestrator.svelte`
- [ ] Intégrer thumbnails (placeholder si pas d'image)
- [ ] Ajouter AI glow signal
- [ ] Ajouter mood indicators

**Livrable :** Timeline visuelle alignée sur CapCut

---

### Sprint 3 (1 semaine) : Génération Inline
**Objectif :** Fermer la boucle de génération

- [ ] Étendre `comfy-api-client.ts` pour récupérer outputs
- [ ] Rendre `GenerateButton` accessible depuis chaque card
- [ ] Afficher preview dans `PreviewPanel`
- [ ] Ajouter indicateur queue en header

**Livrable :** Génération one-click fonctionnelle

---

### Sprint 4 (1 semaine) : Ambiance & Terminologie
**Objectif :** Transformer l'UI dev en UI studio

- [ ] Changer toute la terminologie
- [ ] Créer `EmptyState` avec galerie d'inspiration
- [ ] Ajouter thumbnails à `TemplatesPanel`
- [ ] Renommer `SnapshotsPanel` → "Versions"

**Livrable :** Ambiance studio professionnelle

---

### Sprint 5 (1 semaine) : Audio & Waveform
**Objectif :** Expérience audio pro

- [ ] Implémenter waveform dans `AudioTimeline`
- [ ] Ajouter contrôles audio (play/pause, volume)
- [ ] Synchroniser waveform avec playback

**Livrable :** Audio timeline avec waveform visuel

---

### Sprint 6 (1 semaine) : Onboarding & Flow
**Objectif :** Expérience utilisateur fluide

- [ ] Implémenter onboarding 3 étapes
- [ ] Rendre "Projection" accessible
- [ ] Ajouter shortcuts contextuels

**Livrable :** Onboarding et flow utilisateur optimisés

---

## 📚 Ressources

- **Brand Spec :** `brand-spec.md` (ce repo)
- **Audit CapCut :** `docs/audit-capcut-comparison.html`
- **Dossier CapCut :** `moylmnyv-capcut-ai-studio-dossier.html`
- **CSS-Base Docs :** `docs/CSS-BASE-REFERENCE.md`
- **Model Schema :** `docs/MODEL_SCHEMA.md`

---

## 🔗 Liens Utiles

- [CapCut AI Studio](https://www.capcut.com/ai)
- [Volcano Engine API](https://www.volcengine.com/)
- [C2PA Standard](https://c2pa.org/)
- [OKLch Color Picker](https://oklch.com/)

---

**Statut :** ✅ Audit complet  
**Prochaine étape :** Implémentation Sprint 1 (Design System)  
**Propriétaire :** Équipe UX latente-line  
**Date cible début :** 2026-04-XX

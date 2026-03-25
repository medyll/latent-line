# Sprint 13 — Ergonomie & Playback

**Date:** 2026-03-17 (planifié après Sprint 12)
**Objectif:** Rendre l'application productive au quotidien — undo/redo, raccourcis, recherche, playback.
**Points:** 19

## Problème résolu

Une fois le MVP viable (Sprint 12), l'expérience utilisateur reste laborieuse : pas de
filet de sécurité (undo), pas de raccourcis, recherche impossible avec beaucoup d'assets,
et le playhead ne joue pas vraiment. Ce sprint passe de "utilisable" à "agréable".

## Stories

| ID     | Titre                                 | Points | Priorité   |
| ------ | ------------------------------------- | ------ | ---------- |
| S13-01 | Undo / Redo                           | 8      | 🟠 Haute   |
| S13-02 | Raccourcis clavier                    | 3      | 🟡 Moyenne |
| S13-03 | Recherche et filtre dans AssetManager | 3      | 🟡 Moyenne |
| S13-04 | Playback engine (play/pause/seek)     | 5      | 🟡 Moyenne |

## Séquencement recommandé

1. **S13-01** (undo/redo) en premier — S13-02 s'appuie dessus pour Ctrl+Z/Y
2. **S13-02** après S13-01
3. **S13-03** et **S13-04** en parallèle (indépendants)

## Définition of Done

- Ctrl+Z fonctionne sur toutes les mutations destructives
- Les raccourcis clavier essentiels sont documentés et fonctionnels
- La recherche filtre les assets en temps réel
- Le playhead avance en lecture et peut être seeké
- Tests unitaires pour chaque story

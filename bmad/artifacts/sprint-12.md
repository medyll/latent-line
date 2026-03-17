# Sprint 12 — MVP Viable

**Date:** 2026-03-17
**Objectif:** Rendre l'application utilisable en conditions réelles — save, load, export, settings.
**Points:** 14

## Problème résolu

Les sprints précédents ont construit un éditeur techniquement solide mais inutilisable
en pratique : le travail disparaît au rechargement, il est impossible de sauvegarder ou
d'importer un projet. Ce sprint corrige ces manques fondamentaux.

## Stories

| ID | Titre | Points | Priorité |
|----|-------|--------|---------|
| S12-01 | Persistance localStorage (auto-save / restore) | 5 | 🔴 Critique |
| S12-02 | Export projet JSON | 3 | 🔴 Critique |
| S12-03 | Import projet JSON | 3 | 🔴 Critique |
| S12-04 | Settings panel | 3 | 🟠 Haute |

## Séquencement recommandé

1. **S12-01** en premier (les autres s'appuient sur la persistance)
2. **S12-02** + **S12-03** en parallèle après S12-01
3. **S12-04** en dernier (peut nécessiter des champs supplémentaires dans model.config)

## Définition of Done

- Toutes les stories acceptées
- Tests unitaires pour serialize/deserialize, export, import validation
- L'application est utilisable sans rechargement détruire le travail
- Un projet peut faire un round-trip complet : créer → exporter → réimporter

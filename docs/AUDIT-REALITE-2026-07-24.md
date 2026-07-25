# Audit de réalité — Latent-line

Date : 24 juillet 2026

## Mise à jour après remise à niveau

Les constats ci-dessous décrivent l'état initial de l'audit. La remise à niveau P0/P1/P2
effectuée le même jour a depuis établi cette nouvelle baseline :

- contrôle Svelte/TypeScript : 0 erreur, 70 avertissements ;
- lint : 0 erreur, 53 avertissements ;
- formatage, build et parité i18n : réussis ;
- 693 tests unitaires de l'application et 22 tests du serveur collaboratif réussis ;
- 4 parcours Playwright prioritaires réussis ;
- statut produit fixé à **expérimental**, sans pourcentage ni date de v1.

La matrice maintenue dans `docs/FEATURE_STATUS.md` est désormais la source de vérité
fonctionnelle. Les avertissements, anciens E2E et intégrations externes non validées
restent de la dette explicite.

## Verdict

Latent-line n'est ni une coquille vide ni un projet fictif : le dépôt contient une application SvelteKit importante, un modèle de données travaillé, de nombreux composants, des exports, des tests unitaires et un serveur WebSocket séparé.

En revanche, son statut documentaire n'est pas fiable et le projet ne peut pas être considéré comme prêt pour la production. La mesure la plus juste est :

> **Prototype fonctionnel avancé / alpha technique, avec une dette d'intégration et de validation importante.**

Le chiffre de « 90 % vers la v1 » et les déclarations de fonctionnalités « COMPLETE » ne sont pas démontrés par l'état actuel du dépôt.

## Ce qui a été vérifié

Vérifications exécutées sur la branche `main`, alignée sur `origin/main`, sans modification du code :

| Contrôle | Résultat |
| --- | --- |
| Formatage Prettier | Échec : `ARCH.md` |
| ESLint, sans correction automatique | Échec : erreurs et nombreux avertissements |
| Parité i18n | Réussite : 118 clés EN et FR |
| Svelte/TypeScript (`pnpm run check`) | Échec : 59 erreurs, 71 avertissements, 31 fichiers |
| Tests unitaires | Réussite : 693 tests dans 60 fichiers |
| Build Vite de production | Réussite |
| Tests E2E Playwright | Impossible à exécuter correctement : configuration Playwright absente |

Le build réussi ne remplace pas le contrôle TypeScript : Vite produit des bundles alors que `svelte-check` signale des erreurs réelles.

## État réel du dépôt

- 154 fichiers d'implémentation TypeScript/Svelte, environ 27 000 lignes.
- 77 fichiers reconnus comme tests par l'inventaire, environ 9 000 lignes.
- Deux routes applicatives visibles : l'éditeur principal `/` et la présentation `/present`.
- Deux endpoints SvelteKit d'import et d'export.
- Un serveur WebSocket séparé dans `server/`.
- Une activité Git réelle jusqu'au 7 juin 2026.
- Aucun changement local détecté au début de l'audit.

Le produit contient bien des briques concrètes : édition de timeline, gestion d'assets, propriétés, persistance locale, import/export, historique, présentation, génération par événement, workers et outils de performance.

## Écarts majeurs entre annonces et réalité

### 1. Le statut projet est incohérent

Les sources donnent simultanément :

- README : version 0.2.0, sprint 12, dernière mise à jour le 20 mars 2026 ;
- `package.json` : version 0.4.0 ;
- `bmad/status.yaml` : v0.10.0 livrée, v0.11.0 en cours, sprint 36 terminé, progression 90 %, cible v1 au 1er août 2026 ;
- le même statut indique à la fois `release: done`, `development: in_progress` et `testing: in_progress` ;
- `current_sprint: 36` et `current_story: S36-01` restent affichés alors que le texte déclare le sprint 36 terminé ;
- le README demande d'aller sur `/app`, route qui n'existe pas.

Conclusion : `bmad/status.yaml`, le README et les notes de release sont des archives d'intention, pas une source de vérité.

### 2. Le contrôle statique est cassé

`pnpm run check` retourne 59 erreurs et 71 avertissements dans 31 fichiers.

Exemples :

- erreurs de runes et de typage dans `GenerateButton.svelte` ;
- collision de variable dans `Tooltip.svelte` ;
- propriétés et types incompatibles dans plusieurs composants de timeline ;
- import `@medyll/css-base` sans déclarations de module ;
- nombreux problèmes d'accessibilité et de réactivité Svelte.

Un projet visant une v1 ne peut pas conserver le contrôle TypeScript en échec.

### 3. Les E2E annoncés ne sont pas opérants

Le dépôt contient 15 fichiers E2E, mais aucun `playwright.config.ts`, alors que toute la documentation affirme son existence.

Sans configuration, Playwright découvre également des tests Vitest et du contenu Svelte dans `src/`, puis échoue avant d'exécuter les parcours navigateur :

- redéfinition des matchers Jest/Vitest ;
- erreurs de parsing de fichiers `.svelte` ;
- aucune synthèse valide de scénarios E2E exécutés.

Les affirmations « 16 scénarios E2E » et « E2E must pass » ne sont donc pas vérifiables en l'état.

### 4. La génération ComfyUI annoncée n'est pas implémentée

`src/lib/services/ai-backend.ts` décrit l'intégration ComfyUI, mais son implémentation contient explicitement :

- un TODO d'implémentation du workflow ;
- un commentaire indiquant des données mockées ;
- une exception `ComfyUI backend not yet implemented`.

L'interface de configuration et les boutons existent, mais le chemin principal annoncé n'est pas fonctionnel. L'autre backend A1111 possède davantage de code concret.

### 5. La collaboration n'est pas intégrée au produit

Le serveur WebSocket, son protocole et un client TypeScript existent, avec quelques tests.

Cependant, le client de collaboration n'est référencé par aucun composant ni aucune route de l'application. Les seules références frontend sont sa propre implémentation et son test.

Conclusion : il s'agit d'une fondation technique isolée, pas d'une fonctionnalité de collaboration temps réel livrée à l'utilisateur.

### 6. Les workers d'export ne couvrent pas les formats annoncés

Le worker d'export accepte plusieurs formats dans ses types, mais signale explicitement que YAML et les formats avancés ne sont pas implémentés dans le worker.

Il existe par ailleurs des utilitaires d'export dédiés. Cela indique une architecture partiellement dupliquée : certaines capacités peuvent fonctionner par le chemin principal, mais l'affirmation de traitement complet par workers est fausse.

### 7. La qualité déclarée est datée

Le statut annonce 684 tests et 84,39 % de couverture.

- Le dépôt exécute maintenant 693 tests unitaires avec succès.
- La couverture de 84,39 % n'a pas été revalidée pendant cet audit.
- Les tests unitaires couvrent beaucoup d'utilitaires, mais ne compensent ni le contrôle statique cassé ni l'absence d'une suite E2E exécutable.

## Appréciation par domaine

| Domaine | Niveau observé | Commentaire |
| --- | --- | --- |
| Modèle de données et utilitaires | Solide en apparence | Nombreux tests et schémas concrets |
| Éditeur UI | Prototype avancé | Riche, mais contrôle Svelte/TS fortement dégradé |
| Persistance locale | Présente | Testée au niveau unitaire |
| Import/export | Partiellement crédible | Plusieurs implémentations, couverture et chemins à réconcilier |
| Génération IA | Incomplète | UI présente, backend ComfyUI principal non implémenté |
| Collaboration | Fondation isolée | Serveur/client présents, aucune intégration dans l'UI |
| Internationalisation | Fonctionnelle au niveau des clés | Parité EN/FR validée |
| E2E et non-régression visuelle | Non opérationnels | Configuration Playwright absente |
| Préparation production | Insuffisante | Typecheck/lint/E2E en échec, statut non fiable |

## Priorités recommandées

### P0 — Rétablir une vérité technique

1. Geler les affirmations de pourcentage, version cible et sprints « terminés ».
2. Définir une source de vérité unique : version, fonctionnalités disponibles, limites connues.
3. Restaurer `playwright.config.ts` avec `testDir: 'e2e'`, le serveur sur le port 5167 et les exclusions nécessaires.
4. Ramener `pnpm run check` à zéro erreur.
5. Faire échouer le CI sur lint, typecheck et E2E.

### P1 — Tester les parcours produit

Valider dans un navigateur, avec données réelles :

1. création, modification et suppression d'assets ;
2. création, déplacement et édition d'événements ;
3. sauvegarde, rechargement, import et export ;
4. mode présentation ;
5. paramètres et génération IA, avec un backend réellement joignable ;
6. connexion de deux clients au serveur de collaboration.

### P2 — Décider le périmètre produit

Pour chaque domaine, choisir explicitement entre :

- livré et supporté ;
- expérimental ;
- fondation technique non exposée ;
- mock/démonstration ;
- retiré du périmètre.

La v1 doit être définie après cette classification, pas à partir de l'ancien backlog.

## Conclusion

Le projet mérite d'être repris : il contient suffisamment de code et de tests pour servir de base sérieuse. Mais l'ancien récit de développement a pris de l'avance sur l'implémentation réelle.

Le prochain jalon raisonnable n'est pas « sprint 37 » ni « v1 à 90 % ». C'est une **baseline vérifiable** :

- contrôle statique vert ;
- E2E réellement exécutés ;
- matrice de fonctionnalités prouvées ;
- statut et documentation réécrits à partir de ces preuves.

# État vérifiable des fonctionnalités

Date : 24 juillet 2026

Règle : toute fonction qui n'est pas prouvée par un contrôle automatisé exécutable est classée **expérimentale**.

| Domaine | Statut | Preuve ou limite |
| --- | --- | --- |
| Chargement de l'éditeur | Vérifié | Baseline Playwright |
| CRUD personnages | Vérifié | Création, renommage, suppression et rechargement |
| Environnements et audio | Expérimental | Interface présente, anciens E2E non fiables |
| Création de plan | Vérifié | Ajout d'un événement trié et ouverture de l'éditeur |
| Modification de plan | Vérifié | Notes et sauvegarde via l'éditeur de plan |
| Drag, resize, multi-sélection | Expérimental | Code présent, anciens scénarios non réhabilités |
| Persistance locale | Vérifié | Modèle sauvegardé et relu après rechargement |
| Export YAML | Vérifié | Téléchargement Playwright |
| Autres exports | Expérimental | Utilitaires présents, couverture de bout en bout incomplète |
| Import JSON | Expérimental | Workflow ouvert et application du modèle câblée ; scénario complet à ajouter |
| Screening | Vérifié partiellement | Route ouverte avec modèle encodé, comportement avancé expérimental |
| i18n EN/FR | Vérifié | 118 clés de chaque côté |
| Génération A1111 | Expérimental | Client présent, backend réel non validé |
| Génération ComfyUI | Non implémenté | Le backend principal lève explicitement une exception |
| Workers | Expérimental | Validation/search présents ; formats d'export partiels |
| Collaboration WebSocket | Fondation expérimentale | 22 tests serveur réussis, mais client séparé et aucune UI intégrée |
| Performance à grande échelle | Non prouvé | Anciennes affirmations chiffrées retirées |
| Accessibilité | Expérimental | Avertissements Svelte et anciens audits à reprendre |
| Prêt production | Non | Baseline alpha, dette d'accessibilité et intégrations incomplètes |

## Politique de promotion

Une fonction passe de « expérimental » à « vérifié » seulement si :

1. son chemin utilisateur est accessible dans l'application ;
2. son comportement n'utilise ni mock ni exception « not implemented » ;
3. un test automatisé stable couvre le résultat utile ;
4. les contrôles TypeScript, lint et build restent verts.

# État vérifiable des fonctionnalités

Date : 25 juillet 2026

Règle : toute fonction qui n'est pas prouvée par un contrôle automatisé exécutable est classée **expérimentale**.

| Domaine | Statut | Preuve ou limite |
| --- | --- | --- |
| Chargement de l'éditeur | Vérifié | Baseline Playwright |
| CRUD personnages | Vérifié | Création, renommage, suppression et rechargement |
| Environnements et audio | Vérifié | Création couverte par les E2E réhabilités |
| Création de plan | Vérifié | Ajout d'un événement trié et ouverture de l'éditeur |
| Modification de plan | Vérifié | Notes et sauvegarde via l'éditeur de plan |
| Drag, resize, multi-sélection | Expérimental | Code présent, anciens scénarios non réhabilités |
| Persistance locale | Vérifié | Modèle sauvegardé et relu après rechargement |
| Export YAML | Vérifié | Téléchargement Playwright |
| Exports vidéo Deforum, FramePack, CogVideoX | Vérifié | Téléchargements E2E ; fichiers de préparation, pas vidéos finales |
| Import JSON | Expérimental | Workflow ouvert et application du modèle câblée ; scénario complet à ajouter |
| Screening | Vérifié partiellement | Route ouverte avec modèle encodé, comportement avancé expérimental |
| i18n EN/FR | Vérifié | 118 clés de chaque côté |
| Génération A1111 | Expérimental | Client présent, backend réel non validé |
| Passerelle serveur de rendu | Expérimental vérifié | Registre de modèles, jobs persistants, auth, annulation, uploads et artefacts couverts par tests ; cible ComfyUI abandonnée le 17/08/2026 au profit d'un worker local (voir [RENDER_BACKEND_OPTIONS_2026.md](RENDER_BACKEND_OPTIONS_2026.md)) |
| Render worker local (Wan 2.2 TI2V-5B) | Expérimental, non exécuté | Code écrit contre l'API Diffusers documentée ([server/render-worker/](../server/render-worker/)) ; aucun run GPU réel effectué dans ce repo |
| Génération dans l'interface | Non raccordé | Aucun modèle local réellement testé et bouton client encore désactivé |
| Génération vidéo directe | Non raccordé | Serveur + worker écrits ; rendu réel GPU et intégration UI encore requis |
| Workers | Expérimental | Validation/search présents ; formats d'export partiels |
| Serveur collaboration + rendu | Fondation expérimentale | 32 tests serveur ; collaboration et passerelle partagent désormais le port 8080 |
| Performance à grande échelle | Non prouvé | Anciennes affirmations chiffrées retirées |
| Accessibilité | Vérifié partiellement | Aucun défaut axe critique/sérieux sur `/` et `/app` ; avertissements Svelte restants |
| Prêt production | Non | Baseline alpha, dette d'accessibilité et intégrations incomplètes |

## Politique de promotion

Une fonction passe de « expérimental » à « vérifié » seulement si :

1. son chemin utilisateur est accessible dans l'application ;
2. son comportement n'utilise ni mock ni exception « not implemented » ;
3. un test automatisé stable couvre le résultat utile ;
4. les contrôles TypeScript, lint et build restent verts.

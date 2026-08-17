> [!WARNING]
> **Décision de rendu mise à jour (17 août 2026).** La section « Cible de
> rendu direct : ComfyUI » ci-dessous est dépassée — voir
> [docs/RENDER_BACKEND_OPTIONS_2026.md](RENDER_BACKEND_OPTIONS_2026.md) pour
> le choix actuel (worker local Wan 2.2, sans ComfyUI, gratuit d'abord).

# Pipeline vidéo

Date : 25 juillet 2026

## État livré dans l’application

La modale d’export propose désormais trois sorties de préparation vidéo :

| Sortie | Fichier | Usage |
| --- | --- | --- |
| Deforum | JSON | Animation Stable Diffusion pilotée par keyframes |
| FramePack | JSONL | Description structurée d’une frame par ligne |
| CogVideoX | TXT | Script historique de keyframes et interpolations |

Ces exports sont testés de bout en bout. Ils ne contiennent pas la vidéo finale :
ils transmettent le projet à un moteur de rendu externe.

## Décision de produit

- **Compatibilité** : conserver Deforum, FramePack et CogVideoX.
- **Cible de rendu direct** : ComfyUI avec un workflow vidéo natif versionné.
- **Premier workflow recommandé** : Wan 2.1 T2V 1.3B pour le développement, car
  la documentation officielle annonce un fonctionnement à partir de 8 Go de VRAM.
- **Qualité supérieure** : Wan 2.1 14B I2V/FLF2V, à réserver aux serveurs GPU
  dimensionnés.
- **CogVideoX** reste une cible historique ; il ne doit plus être le contrat
  interne principal.

## État des actions

1. **À faire sur l'infrastructure** : installer et valider un serveur ComfyUI séparé.
2. **À faire avec le serveur réel** : exporter un workflow ComfyUI en **API format**, sans dépendre des identifiants
   visuels de l’éditeur.
3. **Gabarit livré** : compléter le manifeste qui nomme les entrées logiques :
   `positive_prompt`, `negative_prompt`, `seed`, `width`, `height`,
   `frame_count`, `fps`, `start_image` et `output`.
4. **Livré** : passerelle serveur qui injecte les paramètres, soumet et suit les jobs.
5. **Livré côté serveur** : récupération contrôlée des artefacts et persistance ;
   association au plan encore à raccorder dans l’interface.
6. **Livré côté serveur** : taille, concurrence, authentification, annulation et
   contrôle des origines ; politique d’expiration encore à définir.
7. **À faire** : tester un rendu réel court avant d’activer « Generate video ».

## Critères pour déclarer la vidéo fonctionnelle

- un workflow versionné est installé et détecté ;
- un plan peut produire un job sans modifier manuellement le JSON ;
- la progression, l’échec et l’annulation sont visibles ;
- l’artefact final est récupérable après rechargement ;
- le test utilise une vraie instance ComfyUI, pas un mock ;
- le modèle, les dimensions, le nombre de frames et le coût estimé sont affichés
  avant la soumission.

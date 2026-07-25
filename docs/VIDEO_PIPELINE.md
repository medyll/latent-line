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

## Actions restantes

1. Installer et valider un serveur ComfyUI séparé.
2. Exporter un workflow ComfyUI en **API format**, sans dépendre des identifiants
   visuels de l’éditeur.
3. Créer un manifeste de workflow qui nomme les entrées logiques :
   `positive_prompt`, `negative_prompt`, `seed`, `width`, `height`,
   `frame_count`, `fps`, `start_image` et `output`.
4. Ajouter une passerelle serveur Latent-line qui injecte ces paramètres, soumet
   le workflow et suit sa progression.
5. Récupérer l’artefact final depuis ComfyUI, puis l’associer au plan concerné.
6. Ajouter les limites : taille, durée, concurrence, annulation et expiration.
7. Tester un rendu réel court avant d’activer le bouton « Generate video ».

## Critères pour déclarer la vidéo fonctionnelle

- un workflow versionné est installé et détecté ;
- un plan peut produire un job sans modifier manuellement le JSON ;
- la progression, l’échec et l’annulation sont visibles ;
- l’artefact final est récupérable après rechargement ;
- le test utilise une vraie instance ComfyUI, pas un mock ;
- le modèle, les dimensions, le nombre de frames et le coût estimé sont affichés
  avant la soumission.


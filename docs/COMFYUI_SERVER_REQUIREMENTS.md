# Besoins du serveur ComfyUI

Date : 25 juillet 2026

## Architecture recommandée

```text
Navigateur Latent-line
        |
        | HTTPS / API Latent-line
        v
Passerelle de rendu Latent-line
        |
        | HTTP + WebSocket privés
        v
ComfyUI + GPU + modèles + workflows versionnés
```

Le navigateur ne doit pas piloter directement un ComfyUI exposé sur Internet.
La passerelle protège l’adresse du moteur, évite les problèmes CORS, centralise
l’authentification et contrôle les fichiers, quotas et durées.

## API ComfyUI nécessaire

La passerelle doit utiliser les routes locales officielles de ComfyUI :

| Route | Usage |
| --- | --- |
| `POST /prompt` | Soumettre le workflow au format API |
| `GET /history/{prompt_id}` | Lire le résultat et les sorties |
| `GET /view?...` | Télécharger une image ou un artefact déclaré |
| `GET /queue` | Inspecter la file |
| `POST /interrupt` | Interrompre le traitement actif |
| `POST /upload/image` | Envoyer une image de départ I2V |
| `GET /object_info` | Vérifier la présence des types de nœuds |
| `GET /system_stats` | Diagnostic de l’instance |
| `WS /ws?clientId=...` | Progression et fin d’exécution |

Le code historique qui interroge `/api/progress` pour ComfyUI est incorrect :
cette route appartient au vocabulaire Automatic1111. ComfyUI diffuse la
progression par WebSocket et expose l’état final dans l’historique.

## Contrat de la passerelle Latent-line

### Créer un job

`POST /api/render/jobs`

```json
{
  "eventTime": 144,
  "workflowId": "wan21-t2v-dev-v1",
  "mode": "text-to-video",
  "positivePrompt": "cinematic lighthouse interior",
  "negativePrompt": "artifacts, flicker",
  "seed": 7391,
  "width": 832,
  "height": 480,
  "frameCount": 81,
  "fps": 16
}
```

Réponse : identifiant Latent-line, `prompt_id` ComfyUI, état `queued` et date
d’expiration.

### Suivre et contrôler

- `GET /api/render/jobs/{id}` : état, progression, erreur et artefacts ;
- `GET /api/render/jobs/{id}/events` : SSE, ou WebSocket équivalent ;
- `DELETE /api/render/jobs/{id}` : annulation ;
- `GET /api/render/jobs/{id}/artifacts/{artifactId}` : téléchargement contrôlé.

## Registre de workflows

Chaque workflow doit avoir deux fichiers :

```text
workflows/
  wan21-t2v-dev-v1/
    workflow.api.json
    manifest.json
```

Le manifeste relie les noms métier aux nœuds et champs ComfyUI :

```json
{
  "id": "wan21-t2v-dev-v1",
  "kind": "text-to-video",
  "workflowVersion": 1,
  "inputs": {
    "positivePrompt": { "node": "6", "field": "text" },
    "negativePrompt": { "node": "7", "field": "text" },
    "seed": { "node": "3", "field": "seed" },
    "width": { "node": "9", "field": "width" },
    "height": { "node": "9", "field": "height" },
    "frameCount": { "node": "9", "field": "length" }
  },
  "outputNode": "save_video"
}
```

Le serveur doit refuser un workflow dont un nœud ou un champ déclaré manque.
Le JSON d’interface ComfyUI et le JSON **API format** ne sont pas interchangeables.

## Modèles recommandés pour le premier serveur

Pour Wan 2.1 T2V 1.3B :

```text
ComfyUI/models/
  diffusion_models/wan2.1_t2v_1.3B_fp16.safetensors
  text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors
  vae/wan_2.1_vae.safetensors
```

Pour I2V, ajouter le modèle 480p ou 720p adapté et :

```text
clip_vision/clip_vision_h.safetensors
```

Le workflow officiel Wan utilise des nœuds natifs récents : la version ComfyUI
doit donc être épinglée et validée avec le workflow. Pour produire du MP4,
`Video Combine` de ComfyUI-VideoHelperSuite est une option ; une variante sans
nœud tiers peut sortir un WebP animé.

## Dimensionnement

Minimum de développement raisonnable :

- GPU NVIDIA avec **8 Go de VRAM** pour Wan 2.1 T2V 1.3B à faible résolution ;
- stockage rapide pour les modèles et les artefacts ;
- environnement Python isolé ;
- ComfyUI récent, avec Python 3.13 recommandé par la documentation actuelle
  ou Python 3.12 en repli si des nœuds tiers posent problème.

La variante Wan 14B, le 720p et les longues séquences nécessitent nettement plus
de VRAM et de temps. Les limites exactes doivent être mesurées sur le serveur
retenu, pas inscrites comme promesse générique.

## Sécurité et exploitation

- ComfyUI écoute sur le réseau privé ou `localhost`, jamais directement public ;
- authentification et TLS terminés par la passerelle ;
- liste blanche de workflows et de modèles ;
- aucun chemin de fichier arbitraire fourni par le navigateur ;
- contrôle MIME, taille et dimensions des uploads ;
- limite de jobs par utilisateur et file globale ;
- délai maximal, annulation et nettoyage automatique des artefacts ;
- journaux corrélés par `jobId`, sans prompts sensibles par défaut ;
- contrôles de santé sur GPU, espace disque, file et workflows ;
- version de ComfyUI, des nœuds et des modèles enregistrée avec chaque résultat.

## Vérifications avant intégration

1. `system_stats` répond.
2. `object_info` contient tous les types de nœuds du workflow.
3. Un workflow fixe produit un artefact manuellement.
4. Le même workflow en API format passe par `POST /prompt`.
5. Le WebSocket annonce la fin du bon `prompt_id`.
6. L’historique contient le nœud de sortie.
7. L’artefact est téléchargeable et lisible.
8. L’interruption et les erreurs GPU sont correctement remontées.

## Sources officielles

- https://docs.comfy.org/development/comfyui-server/comms_overview
- https://github.com/Comfy-Org/ComfyUI/blob/master/script_examples/websockets_api_example.py
- https://docs.comfy.org/tutorials/video/wan/wan-video
- https://docs.comfy.org/installation/system_requirements


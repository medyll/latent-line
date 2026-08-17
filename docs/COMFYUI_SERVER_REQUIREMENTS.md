> [!WARNING]
> **Archivé (17 août 2026).** ComfyUI n'est plus la cible de rendu retenue —
> voir [docs/RENDER_BACKEND_OPTIONS_2026.md](RENDER_BACKEND_OPTIONS_2026.md)
> pour la décision et [server/render-worker/README.md](../server/render-worker/README.md)
> pour le nouveau worker local (Wan 2.2, sans ComfyUI). Ce document reste
> comme référence historique de l'architecture passerelle → ComfyUI.

# Besoins du serveur ComfyUI (archivé)

Date : 25 juillet 2026

État : **passerelle serveur implémentée** dans `server/src/`. Il reste à
installer une instance ComfyUI réelle, exporter le workflow Wan propre à cette
instance et raccorder le bouton de génération de l’interface.

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
  "workflowId": "wan21-t2v-1.3b",
  "inputs": {
    "positive_prompt": "cinematic lighthouse interior",
    "negative_prompt": "artifacts, flicker",
    "seed": 7391,
    "width": 832,
    "height": 480,
    "frame_count": 81,
    "fps": 16
  }
}
```

Réponse : identifiant Latent-line, `promptId` ComfyUI, version du workflow,
état `queued`, dates et entrées non sensibles.

### Suivre et contrôler

- `GET /api/render/jobs/{id}` : état, progression, erreur et artefacts ;
- `DELETE /api/render/jobs/{id}` : annulation ;
- `GET /api/render/jobs/{id}/artifacts/{index}` : téléchargement contrôlé ;
- `POST /api/render/uploads` : image PNG/JPEG/WebP pour un workflow I2V ;
- `GET /api/render/workflows` : manifestes installés sans le chemin du JSON ;
- `GET /api/render/health` : état de ComfyUI.

La première version utilise un polling de `GET /jobs/{id}`. La progression
fine par WebSocket ComfyUI pourra être ajoutée sans changer le contrat des jobs.

## Registre de workflows

Chaque workflow doit avoir deux fichiers :

```text
workflows/
  wan21-t2v.workflow.json
  wan21-t2v.manifest.json
```

Le manifeste relie les noms métier aux nœuds et champs ComfyUI :

```json
{
  "id": "wan21-t2v-1.3b",
  "version": "1.0.0",
  "label": "Wan 2.1 T2V 1.3B",
  "mode": "text-to-video",
  "workflowFile": "wan21-t2v.workflow.json",
  "inputs": {
    "positive_prompt": {
      "nodeId": "6",
      "input": "text",
      "type": "string",
      "required": true
    },
    "seed": {
      "nodeId": "3",
      "input": "seed",
      "type": "integer",
      "min": 0
    }
  },
  "outputNodeIds": ["save_video"]
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

# Architecture et Schéma de Données - Latent-line

## Schéma de Données Principal

Le schéma de données est défini dans `src/lib/model/model-template.ts`. Ce fichier contient la validation Zod et les structures de données pour l'application.

### Composants Clés

1. **Zod Schema (`modelSchema`)**
   - Validation runtime pour la structure complète du modèle
   - Valide les champs principaux : `project`, `assets`, `timeline`, `markers`, `config`

2. **Types TypeScript**
   - Réexportés depuis `src/lib/model/model-types.ts`
   - Incluent : `Model`, `TimelineEvent`, `TimelineFrame`

3. **Fonctions Utilitaires**
   - `buildDefaultModel()` : Crée un modèle par défaut avec des valeurs initiales
   - `createModelTemplate()` : Retourne un template cloné pour une utilisation sûre

4. **Définitions des Énumérations**
   - Moods : `joyful`, `melancholic`, `anxious`, `serene`, `curious`
   - Types d'éclairage : `dusk`, `daylight`, `studio`, `tungsten`, `ambient`
   - Styles de parole : `whisper`, `shout`, `monotone`, `playful`, `formal`
   - Résolutions : `square1024`, `hd720`, `hd1080`, `uhd4k`, `custom`

5. **Schéma des Sous-composants**
   - `actorSchema` : ID, outfit, action, position, speech
   - `cameraSchema` : zoom, pan, tilt
   - `lightingSchema` : type, intensity
   - `fxSchema` : bloom, motion_blur
   - `controlNetSchema` : type, strength
   - `audioTrackSchema` : ID, volume, start_ms, fade_in, loop
   - `audioReactiveSchema` : target, param, strength

6. **Schéma de la Timeline**
   - `timelineEventSchema` : time, duration, notes, frame
   - `timelineFrameSchema` : actors, camera, lighting, fx, controlnet, audio_tracks, audio_reactive, prompt

7. **Schéma des Assets**
   - `characterSchema` : ID, name, voice_id, references, outfits
   - `environmentSchema` : prompt, ref
   - `audioAssetSchema` : ID, url, label

8. **Schéma des Marqueurs**
   - `markerSchema` : ID, time, type, label, color, notes, createdAt, updatedAt

### Validation et Sécurité

- **Sanitization** : Les champs texte sont nettoyés via `sanitizeText()` pour prévenir les attaques XSS
- **Validation des Chemins** : `isUrlOrFile()` rejette les tentatives de traversée de chemin (`..`)
- **Validation des URLs** : Utilisation de `new URL()` pour valider les URLs absolues

### Exemple de Modèle par Défaut

```typescript
{
  project: { name: 'LatentLine_MVP', fps: 24, resolution: { w: 1024, h: 1024 } },
  assets: {
    characters: [
      {
        id: 'char_01',
        name: 'Mydde',
        voice_id: 'v_male_deep_01',
        references: [{ url: 'face.jpg', context: 'face', weight: 1.0 }],
        outfits: { casual: { prompt: 'leather jacket, jeans', lora: 'cloth_v1.safetensors' } }
      }
    ],
    environments: { oasis: { prompt: 'bioluminescent desert oasis', ref: 'env_01.png' } },
    audio: [{ id: 'bgm_01', url: 'soundtrack_dark.wav', label: 'Main Theme' }]
  },
  timeline: [
    {
      time: 0,
      duration: 48,
      frame: {
        actors: [
          {
            id: 'char_01',
            outfit: 'casual',
            action: 'walking slowly',
            position: { x: 0.5, y: 0.5, scale: 1.0 },
            speech: {
              text: "Enfin de l'eau...",
              mood: 'melancholic',
              style: 'whisper',
              lip_sync: true,
              volume: 0.8
            }
          }
        ],
        camera: { zoom: 1.0, pan: [0, 0], tilt: 0 },
        lighting: { type: 'dusk', intensity: 0.5 },
        fx: { bloom: 0.2, motion_blur: 0.1 },
        controlnet: { type: 'depth', strength: 0.8 },
        audio_tracks: [{ id: 'bgm_01', volume: 0.6, start_ms: 0, fade_in: 1000 }],
        audio_reactive: { target: 'fx.bloom', param: 'amplitude', strength: 1.5 }
      }
    }
  ],
  config: {
    checkpoint: 'flux_dev.safetensors',
    sampler: 'euler',
    seed: 42,
    tts_engine: 'elevenlabs_v2',
    audioLanes: []
  }
}
```

### Utilisation du Schéma

Pour valider un modèle avant persistance :

```typescript
import { modelSchema } from '$lib/model/model-template';

const result = modelSchema.safeParse(modelData);
if (!result.success) {
	console.error('Validation error:', result.error.message);
}
```

### Références

- **Fichier Principal** : `src/lib/model/model-template.ts`
- **Types TypeScript** : `src/lib/model/model-types.ts`
- **Documentation Complète** : `docs/MODEL_SCHEMA.md`

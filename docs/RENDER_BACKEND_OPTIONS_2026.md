# Options de rendu vidéo — sortie de ComfyUI self-hosted

Date : 17 août 2026
Statut : proposition, aucune décision actée

## Pourquoi reconsidérer

1. ComfyUI a désormais sa propre UI de production (queue, historique, partage) —
   la valeur d'une passerelle maison pour *juste* piloter ComfyUI baisse : on
   duplique une UI qui existe déjà côté ComfyUI.
2. Le pipeline maison (`server/src/render-gateway.ts`, `comfy-client.ts`,
   `workflow-registry.ts`) reste **non raccordé** (voir
   [FEATURE_STATUS.md](FEATURE_STATUS.md)) : aucun GPU réel, aucun workflow Wan
   installé, bouton « Generate video » désactivé. On paie le coût
   d'infrastructure (GPU, VRAM, maintenance workflow) sans bénéfice livré.
3. Des modèles hébergés grand public sont sortis ou ont mûri depuis la
   décision initiale (25 juillet 2026) : MiniMax Hailuo 2.3, Kling 3.0,
   Runway Gen-4.5, Google Veo 3.1, Luma Ray 3.14. Tous exposent une API HTTP
   payante à l'usage — pas de GPU à gérer, pas de VRAM à dimensionner.

## Le vrai choix : héberger un GPU, ou payer un fournisseur au rendu

| | Self-host ComfyUI (actuel) | API hébergée (par modèle ou agrégée) |
| --- | --- | --- |
| Coût GPU/VRAM | À la charge du projet (8 Go+ mini, 24 Go+ pour 14B) | Aucun — facturé à la seconde |
| Maintenance workflow | Manuelle, versionnée à la main | Fournisseur maintient le modèle |
| Latence de mise en route | Élevée (serveur à monter, jamais fait à ce jour) | Immédiate — un compte + une clé API |
| Contrôle fin (LoRA, ControlNet custom) | Total | Limité à ce que l'API expose |
| Coût à l'usage en prod | Faible marginal une fois le GPU acheté/loué | Linéaire, par seconde générée |
| État actuel dans le repo | Codé, jamais branché à un vrai serveur | Rien |

Vu que le serveur GPU n'a **jamais existé** en pratique (aucune preuve d'un
rendu réel abouti), l'option API hébergée est probablement le chemin le plus
court vers une fonctionnalité vidéo qui marche vraiment.

## Fournisseurs recherchés (prix août 2026, sources en bas)

| Fournisseur | Modèle phare | Tarif indicatif | Remarques |
| --- | --- | --- | --- |
| MiniMax (Hailuo) | Hailuo 2.3 | ~$0.01–0.08/s selon résolution | API internationale sans liste d'attente (`platform.minimax.io`) |
| Kling (Kuaishou) | Kling 3.0 | 6–12 crédits/s selon résolution/audio | Packages prépayés, contrôle voix en option |
| Runway | Gen-4.5 | $0.12/s ; Gen-4 Turbo $0.05/s | Pas de liste d'attente, $10 minimum |
| Google | Veo 3.1 (via Gemini API) | $0.15/s (Fast) à $0.40/s | Veo 3 legacy retiré 30 juin 2026 → viser 3.1 |
| Luma | Ray 3.14 | ~$0.08/s | 1080p natif, 4x plus rapide que Ray 3 |

### Agrégateurs (un seul contrat, plusieurs modèles)

**fal.ai** héberge Kling 3.0, Veo 3.1, Seedance 2.0, Wan 2.6, LTX 2.0 et
Hunyuan derrière une API unique — ~450 endpoints vidéo, gros volume donc
probablement stable. Kling 3.0 y est même moins cher qu'en direct
(~$0.029/s vs tarif officiel).

Un agrégateur type fal.ai remplace directement le rôle que devait jouer
`workflow-registry.ts` + `comfy-client.ts` : un point d'entrée, plusieurs
modèles, sans jamais gérer de GPU.

## Pistes d'architecture pour latent-line

1. **Remplacer `comfy-client.ts` par un client fal.ai (ou multi-fournisseur)**
   dans `server/src/`. Le contrat `POST /api/render/jobs` existant peut
   rester quasi identique côté frontend — seul le backend change de cible.
2. **Garder le concept de `workflow-registry.ts`** mais le faire pointer vers
   un identifiant de modèle hébergé (`kling-3.0`, `hailuo-2.3`,
   `veo-3.1-fast`) plutôt qu'un fichier de workflow ComfyUI local — plus
   besoin de nœuds, juste des paramètres nommés (déjà le principe des
   manifestes actuels : `positive_prompt`, `seed`, `width`, `height`,
   `frame_count`, `fps`, `start_image`).
3. **Garder la passerelle serveur** (auth, quotas, annulation, persistance
   des jobs) — elle a de la valeur indépendamment du moteur de rendu choisi.
4. **I2V et T2V restent tous deux couverts** par ces API (image de départ =
   upload standard), donc pas de perte de fonctionnalité par rapport au plan
   Wan 2.1 I2V/T2V actuel.
5. **Coût à surveiller** : facturation à l'usage veut dire un budget par
   plan/scène affiché avant génération (le critère « coût estimé affiché »
   de [VIDEO_PIPELINE.md](VIDEO_PIPELINE.md) devient encore plus important).

## Correction de cap (17 août 2026) : local-first, gratuit-first

Décision produit reçue : **le local doit être l'option prioritaire, on vise
le gratuit d'abord**, et ComfyUI est jugé inutile aujourd'hui (il a sa propre
UI de production — pas besoin qu'on en pilote une seconde).

Ça écarte donc les API payantes en défaut (fal.ai, MiniMax, Kling, etc.) —
elles restent une option de secours pour qui n'a pas de GPU, pas le choix
n°1. Le vrai sujet devient : **comment faire tourner un modèle vidéo open
weight en local, sans passer par ComfyUI du tout.**

### ComfyUI n'est pas le seul runtime — c'est juste un moteur de graphe

Ce qu'on croyait devoir faire (« installer ComfyUI + workflow versionné »)
n'est pas la seule voie. Les modèles vidéo open source publient leur propre
script d'inférence, indépendant de ComfyUI :

| Modèle | VRAM mini | Script direct |
| --- | --- | --- |
| Wan 2.2 TI2V-5B | ~8 Go | `generate.py --task ti2v-5B` (dépôt officiel `Wan-Video/Wan2.2`) |
| Wan 2.2 T2V/I2V A14B | ~24 Go | `generate.py --task t2v-A14B`, aussi dispo via 🤗 Diffusers (`Wan-AI/Wan2.2-T2V-A14B-Diffusers`) |
| CogVideoX-5B (quantisé) | ~4-8 Go | Pipeline 🤗 Diffusers standard |
| LTX-Video 2.3 | ~12 Go | `inference.py` du dépôt `Lightricks/LTX-Video` |
| HunyuanVideo 1.5 | ~14 Go | Script officiel Tencent, sortie native 1080p |

Concrètement : `python generate.py --task ti2v-5B --size 1280*704 --ckpt_dir
./Wan2.2-TI2V-5B --prompt "..."` produit une vidéo sans qu'aucun graphe
ComfyUI n'existe. Même chose côté 🤗 Diffusers (`WanPipeline`), qui offre une
API Python stable plutôt qu'un script CLI figé.

### Architecture révisée

```text
Navigateur Latent-line
        |
        | HTTPS / API Latent-line (contrat inchangé)
        v
Passerelle de rendu Latent-line (server/src/, conservée telle quelle)
        |
        | HTTP local, process spawn, ou appel Python direct
        v
Worker d'inférence local (nouveau, remplace comfy-client.ts)
  - charge un pipeline Diffusers (Wan2.2 / LTX-Video / HunyuanVideo)
  - ou lance le script officiel en sous-processus
  - pas de nœuds, pas de graphe, pas de serveur ComfyUI à maintenir
        |
        v
GPU local de la machine qui héberge la passerelle
```

- **`workflow-registry.ts` devient un registre de modèles locaux** :
  `{ id: "wan2.2-ti2v-5b", vramMin: 8, entrypoint: "wan_worker.py", inputs: {...} }`
  au lieu d'un manifeste de nœuds ComfyUI. Les noms de champs
  (`positive_prompt`, `seed`, `width`, `height`, `frame_count`, `fps`,
  `start_image`, `output`) restent identiques — c'est déjà le contrat prévu.
- **`comfy-client.ts` est remplacé** par un petit worker Python (FastAPI ou
  script CLI appelé en sous-processus) qui expose exactement ce contrat.
  Aucune dépendance à un serveur ComfyUI qui tourne à côté.
- Le **job-store, l'auth, les quotas, l'annulation** (déjà codés côté
  serveur) ne changent pas — ils sont indépendants du moteur de rendu.
- **Fallback optionnel, pas prioritaire** : un adaptateur vers une API
  hébergée (fal.ai en premier choix si besoin un jour) pour les utilisateurs
  sans GPU ou pour de la génération 1080p/haute qualité ponctuelle — mais
  hors du chemin par défaut.

### Choix de modèle par défaut à trancher

- **Le plus accessible** : Wan 2.2 TI2V-5B — ~8 Go VRAM, gère texte→vidéo et
  image→vidéo dans un seul modèle, borne basse raisonnable pour un GPU grand
  public (RTX 3060/4060).
- **Le plus versatile si VRAM dispo (24 Go+)** : Wan 2.2 A14B — meilleure
  qualité, mêmes noms de champs, migration facile depuis le 5B.
- **Alternative qualité/VRAM intermédiaire (12-24 Go)** : LTX-Video 2.3 ou
  HunyuanVideo 1.5.

Recommandation : démarrer sur **Wan 2.2 TI2V-5B en local via Diffusers**
(barrière VRAM la plus basse, un seul modèle pour T2V et I2V, contrat de
champs déjà prêt côté passerelle) ; ComfyUI abandonné comme dépendance ;
API hébergées gardées en note de bas de page pour un fallback futur, pas
pour le MVP.

## MiniMax H3 en local : possible mais bloqué en pratique pour un projet basé en UE

MiniMax a publié H3 (Hailuo 3.0) en poids ouverts le 3 août 2026 : modèle
omni-modal 33B, vidéo jusqu'à 2K/24fps avec audio stéréo natif, 4-15 s par
clip, support ComfyUI natif dès le jour de sortie (4 nœuds, 6 templates de
workflow). Techniquement excellent — classé n°1 en édition vidéo avec audio
sur Artificial Analysis.

Deux blocages concrets :

1. **Licence géographique** : la « Community License » du poids H3-Base
   **exclut explicitement le déploiement local aux États-Unis, à l'UE, au
   Royaume-Uni et en Corée du Sud**. Un projet basé en France ne peut pas
   légalement faire tourner ces poids en local sous cette licence — à
   vérifier au moment de la décision finale (les conditions bougent vite),
   mais en l'état c'est un blocage juridique, pas technique.
2. **Matériel** : même en quantifié, la communauté recommande 24 Go de VRAM
   mini pour un usage fiable ; l'exemple officiel MiniMax (SGLang) suppose
   carrément 4 GPU. Nettement plus lourd que Wan 2.2 TI2V-5B (~8 Go).

Conclusion : H3 est le modèle vidéo local le plus capable actuellement
disponible en poids ouverts (audio natif inclus, ce qu'aucun des modèles de
la table précédente ne fait), mais **inutilisable en local pour ce projet
tant que la clause géographique UE n'est pas levée ou contournée** — et même
sans ce blocage, la barre VRAM est nettement plus haute que Wan 2.2. À
garder en veille (relire la licence si elle évolue), mais pas candidat pour
le MVP local.

## Sources locales

- [GitHub — Wan-Video/Wan2.2](https://github.com/Wan-Video/Wan2.2)
- [Hugging Face — Wan-AI/Wan2.2-TI2V-5B](https://huggingface.co/Wan-AI/Wan2.2-TI2V-5B)
- [Hugging Face — Wan-AI/Wan2.2-T2V-A14B-Diffusers](https://huggingface.co/Wan-AI/Wan2.2-T2V-A14B-Diffusers)
- [Hugging Face — Lightricks/LTX-Video](https://huggingface.co/Lightricks/LTX-Video)
- [Local AI Master — Local AI Video Generation: Wan 2.2 vs LTX-2 vs HunyuanVideo (2026)](https://localaimaster.com/blog/local-ai-video-generation)
- [Tech Times — MiniMax H3 Open Weights Exclude US, EU, UK, and Korea From Local Deployment](https://www.techtimes.com/articles/322904/20260804/minimax-h3-open-weights-exclude-us-eu-uk-korea-local-deployment.htm)
- [Atlas Cloud — MiniMax H3 Open Source Weights: 42.5 GB, and 4 Excluded Countries](https://www.atlascloud.ai/blog/tips/minimax-h3-open-source-weights)
- [Hugging Face — What Is MiniMax H3 (Hailuo 3.0)?](https://huggingface.co/blog/ResterChed/minimax-h3-hailuo-3-0)

## Sources

- [Apiframe — AI Video API Pricing 2026](https://apiframe.ai/blog/ai-video-api-pricing-2026)
- [felloai — MiniMax Pricing 2026](https://felloai.com/minimax-pricing/)
- [Atlas Cloud — Kling AI API Pricing Breakdown](https://www.atlascloud.ai/blog/tips/kling-ai-api-pricing)
- [Kling — Official API pricing](https://kling.ai/dev/pricing)
- [Runway Dev — API Pricing & Costs](https://docs.dev.runwayml.com/guides/pricing/)
- [Google AI for Developers — Gemini API pricing (Veo 3)](https://ai.google.dev/gemini-api/docs/pricing)
- [eesel AI — Luma AI pricing 2026](https://www.eesel.ai/blog/luma-ai-pricing)
- [teamday.ai — AI Image & Video APIs 2026: FAL vs Replicate vs OpenAI](https://www.teamday.ai/blog/ai-image-video-api-providers-comparison-2026)

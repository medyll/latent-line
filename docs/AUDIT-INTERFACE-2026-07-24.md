# Audit de l’interface face aux fonctionnalités annoncées

Date : 24 juillet 2026

## Méthode

L’interface rendue sur le serveur local a été confrontée au README, au guide
utilisateur, aux anciens scénarios E2E et aux notes BMAD. Une sélection de 23
scénarios historiques a été exécutée dans Chromium, en complément de la baseline
prioritaire.

Résultat brut de cette sélection : **11 réussites et 12 échecs**.

Les échecs ne représentent pas tous une régression du produit :

- plusieurs tests cherchent d’anciens noms ou sélecteurs qui n’existent plus ;
- les créations d’environnement et d’audio apparaissent bien dans le DOM après
  l’action, malgré l’échec de leur ancienne assertion ;
- le test de persistance échoue sur un sélecteur devenu ambigu, alors que la
  baseline moderne vérifie réellement la persistance après rechargement ;
- l’audit d’accessibilité révèle en revanche des défauts réels et sérieux.

## Comparaison

| Fonction historiquement annoncée | Observation dans l’interface | Verdict |
| --- | --- | --- |
| Éditeur principal | Interface riche chargée avec assets, plans, timeline et propriétés | Présent |
| CRUD personnages | Création, renommage, suppression, sélection et persistance vérifiées | Fonctionnel |
| Environnements | Création visible ; ancien test d’assertion instable | Expérimental |
| Audio | Création visible ; ancien test d’assertion instable | Expérimental |
| Création et édition de plans | Nouveau parcours « Add shot » vérifié | Fonctionnel |
| Ancien éditeur de propriétés détaillées | Tests basés sur d’anciens composants/sélecteurs | Dérive d’interface |
| Timeline, lecture et zoom | Contrôles visibles ; interactions avancées non revalidées | Expérimental |
| Persistance locale | Vérifiée par la baseline moderne après rechargement | Fonctionnel |
| Import/export | YAML vérifié ; plusieurs formats visibles, couverture inégale | Partiel |
| Screening | Route et modèle courant vérifiés | Partiel |
| Configuration ComfyUI/A1111 | Panneau visible et préférence enregistrable | Présent |
| Génération d’images A1111 | Client implémenté, aucune instance réelle testée | Expérimental |
| Génération ComfyUI | Le backend principal lève `not yet implemented` | Non fonctionnel |
| Génération vidéo directe | Aucun moteur vidéo exécuté par l’application | Non implémenté |
| Collaboration temps réel | Serveur testé séparément, aucune interface utilisateur reliée | Fondation isolée |
| Accessibilité WCAG AA | 3 familles de violations sérieuses/critiques détectées | Non conforme |

## Écarts documentaires confirmés

- Le README décrit encore des routes et composants anciens tels que `/timeline`
  et `/demo-model`.
- « ComfyUI Integration complete » signifie en réalité une interface et une
  fondation technique ; le backend ComfyUI de génération reste un stub.
- Les exports FramePack et CogVideoX existent comme utilitaires testés, mais ne
  sont pas proposés dans la modale actuelle.
- L’application génère ou prépare surtout des **images et des instructions de
  rendu**. Elle ne produit pas elle-même un fichier vidéo final.

## Chaîne vidéo retrouvée

Le projet ne s’appuyait pas sur un LLM vidéo unique :

1. **Stable Diffusion / FLUX** via Automatic1111 ou ComfyUI pour produire des
   images ; l’exemple de configuration utilise `flux_dev.safetensors`.
2. **Deforum** pour animer une séquence de prompts et de keyframes.
3. **FramePack** ou **CogVideoX** comme formats/cibles expérimentaux de génération
   vidéo.

Dans l’interface actuelle, seul **Deforum** est exposé dans les exports. FramePack
et CogVideoX sont présents dans le code mais déconnectés de la modale. La piste la
plus explicitement nommée comme « modèle de génération vidéo » dans l’ancien
projet est donc **CogVideoX** ; Deforum est plutôt un pipeline d’animation Stable
Diffusion, et ComfyUI un orchestrateur.


# Starcruiser-Empire — PlanetX

Système solaire interactif en 3D — « SYSTÈME PLANETX ».

## Contenu

- `index.html` — page plein écran avec intro « Initialisation du système », HUD et panneau d'info
- `style.css` — interface type terminal spatial (HUD, scanlines, panneaux)
- `script.js` — scène Three.js : Soleil lumineux, 8 planètes avec textures procédurales, anneaux de Saturne, Lune, orbites, champ d'étoiles

## Fonctionnalités

- Intro animée avec bouton « PASSER L'INTRO » et vol de caméra vers le système
- 8 planètes en orbite autour du Soleil (textures générées en canvas, aucun asset externe)
- Clic sur une planète (ou via le menu latéral) pour la viser : la caméra la suit et un panneau affiche diamètre, distance au Soleil et période orbitale
- Contrôles : pause, vitesse de révolution, affichage des orbites, retour à la vue d'ensemble
- Zoom (molette) et rotation (glisser) via OrbitControls

## Utilisation

Ouvrir `index.html` directement dans le navigateur (connexion Internet requise pour charger Three.js via CDN), ou servir le dossier en statique :

```bash
python3 -m http.server 8000
```

Puis aller sur `http://localhost:8000`.

# Starcruiser Empire

**Système solaire interactif en 3D** — l'univers de Starcruiser Empire, dans l'esprit « SYSTÈME PLANETX ».

## Identité visuelle (DA Starcruiser)

- **Nom** : Starcruiser Empire
- **Polices** : Orbitron (titres), Space Grotesk (texte)
- **Palette** : fond `#0a0a0a`, panneaux `#1e293b`, bordures `#334155`, bleu `#3b82f6` / `#60a5fa`, or `#fbbf24` / `#f59e0b`, violet `#a78bfa`
- **Rayon des composants** : 8px

## Contenu

- `index.html` — page plein écran : intro « Initialisation du système », HUD, panneau de fiche planète
- `style.css` — DA Starcruiser appliquée à tout le HUD
- `script.js` — scène Three.js (scripts classiques, fonctionne en `file://`)

## La scène 3D

- Soleil lumineux + halo, étiquette « Soleil"
- 8 planètes avec textures procédurales (aucun asset externe), anneaux de Saturne
- **Lunes en 3D** : Lune, Phobos & Deimos, les 4 lunes galiléennes de Jupiter, Titan, Titania, Triton
- **Ceinture d'astéroïdes** entre Mars et Jupiter (1600 particules)
- Lignes d'orbites, étiquettes de noms, champ de 2600 étoiles

## Fiches planètes (9 données + anecdote)

Type, diamètre, masse, distance au Soleil, année orbitale, température moyenne, gravité, atmosphère, nombre de lunes, découverte — plus une description et un « À retenir ».

## Interactions

- Clic sur un astre (ou menu « CORPS CÉLESTES ») : la caméra le suit et sa fiche s'affiche
- Glisser pour orbiter, molette pour zoomer
- Contrôles : pause, vitesse, orbites, étiquettes, vue d'ensemble
- Intro avec bouton « PASSER L'INTRO » et vol de caméra

## Utilisation

Ouvrir `index.html` directement (connexion Internet requise pour le CDN Three.js), ou :

```bash
python3 -m http.server 8000
```

Puis `http://localhost:8000`.

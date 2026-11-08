# Starcruiser Empire

**Système solaire interactif en 3D** — l'univers de Starcruiser Empire.

## Identité visuelle (DA Starcruiser)

- **Nom** : Starcruiser Empire
- **Polices** : Orbitron (titres), Space Grotesk (texte)
- **Palette** : fond `#0a0a0a`, panneaux `#1e293b`, bordures `#334155`, bleu `#3b82f6` / `#60a5fa`, or `#fbbf24` / `#f59e0b`, violet `#a78bfa`
- **Rayon des composants** : 8px

## Textures réelles (sources internet)

Textures NASA en projection équirectangulaire, chargées en direct avec **repli procédural** hors-ligne :

- [Solar System Scope](https://www.solarsystemscope.com/textures/) (CC-BY 4.0, données NASA) : `2k_mercury`, `2k_venus_atmosphere`, `2k_earth_daymap`, `2k_mars`, `2k_jupiter`, `2k_saturn`, `2k_saturn_ring_alpha`, `2k_uranus`, `2k_neptune`, `2k_moon`, `2k_sun`, `2k_stars_milky_way`
- **Wikimedia Commons** (secours CORS fiable, mêmes textures NASA) via `Special:FilePath/Solarsystemscope_texture_2k_*.jpg`
- Exemples officiels Three.js : `earth_atmos_2048.jpg`, `earth_clouds_1024.png`, `earth_lights_2048.png` (lumières nocturnes), `moon_1024.jpg`

Les textures procédurales de secours reproduisent les vraies caractéristiques : continents pour la Terre, Grande Tache rouge pour Jupiter, calottes polaires pour Mars, taches sombres de Neptune, division de Cassini dans les anneaux de Saturne, etc.

## Échelles (vérifiées sur les données réelles NASA)

L'échelle 1:1 est illisible (Neptune à 30 UA, Soleil = 109 Terres), donc compression documentée :

| Grandeur | Formule scène | Exemple |
|---|---|---|
| Distance au Soleil | `30 × UA^0,55` | Terre (1 UA) = 30 ; Neptune (30,1 UA) = 195 |
| Rayon des planètes | `2,2 × √(r_km / 6371)` | Terre = 2,2 ; Jupiter = 7,3 |
| Soleil | 8 (compressé) | — |
| Lunes | rayon réel relatif à la planète (min 0,12) | Lune = 0,60 |
| Ceinture d'astéroïdes | 2,1–3,3 UA compressés | entre Mars et Jupiter |

**Orbites elliptiques réelles** : vraies excentricités (Mercure 0,206, Mars 0,093...) et longitudes du périhélie. Inclinaisons axiales réelles (Vénus 177°, Uranus 98°, Terre 23,4°...). Halo atmosphérique sur Terre, Vénus, Mars, Jupiter, Neptune et Titan ; lumières nocturnes de la Terre.

## Contenu

- `index.html` — page plein écran : intro, HUD, fiche planète
- `style.css` — DA Starcruiser
- `script.js` — scène Three.js (scripts classiques, fonctionne en `file://`)

## La scène 3D

- Soleil texturé + halo, fond Voie lactée, 2200 étoiles
- 8 planètes texturées (réel si en ligne, procédural sinon), inclinaisons réelles
- Anneaux de Saturne (texture alpha réelle + anneaux ténus d'Uranus)
- Nuages de la Terre en rotation
- 9 lunes modélisées (Lune, Phobos, Deimos, Io, Europe, Ganymède, Callisto, Titan, Titania, Triton)
- Ceinture d'astéroïdes (2200 particules), orbites, étiquettes

## Interactions

- Clic sur un astre / menu « CORPS CÉLESTES » : caméra + fiche détaillée (type, diamètre, masse, distance, période, température, gravité, atmosphère, lunes, découverte, anecdote)
- Glisser / molette, pause, vitesse, orbites, étiquettes, vue d'ensemble
- Intro « PASSER L'INTRO » avec vol de caméra

## Utilisation

Ouvrir `index.html` (connexion Internet pour les textures/CDN ; sinon repli procédural automatique), ou :

```bash
python3 -m http.server 8000
```

Puis `http://localhost:8000`.

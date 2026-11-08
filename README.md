# Starcruiser Empire

**Système solaire interactif en 3D** — l'univers de Starcruiser Empire.

## Identité visuelle (DA Starcruiser)

- **Nom** : Starcruiser Empire
- **Polices** : Orbitron (titres), Space Grotesk (texte)
- **Palette** : fond `#0a0a0a`, panneaux `#1e293b`, bordures `#334155`, bleu `#3b82f6` / `#60a5fa`, or `#fbbf24` / `#f59e0b`, violet `#a78bfa`
- **Rayon des composants** : 8px

## Textures réelles (sources internet)

Textures NASA en projection équirectangulaire, chargées en direct avec **repli procédural** hors-ligne :

- **Wikimedia Commons en PRIORITÉ** (CORS `*` fiable, haute résolution) : `Special:FilePath/Solarsystemscope_texture_8k_*.jpg?width=4096` pour toutes les planètes, le Soleil, la Lune, les anneaux, la Voie lactée (textures NASA CC-BY 4.0)
- [Solar System Scope](https://www.solarsystemscope.com/textures/) (8K puis 2K) en deuxième source
- Exemples officiels Three.js : `earth_atmos_2048.jpg`, `earth_clouds_1024.png`, `earth_lights_2048.png`, `moon_1024.jpg`
- Anti-pixelisation : anisotropie max du GPU appliquée à chaque texture chargée

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

**Orbites elliptiques réelles sur de vrais plans inclinés** : excentricités (Mercure 0,206...), périhélies, **inclinaisons au plan de l'écliptique** (Mercure 7,0°, Vénus 3,4°, Saturne 2,5°...) et **nœuds ascendants** appliqués à chaque orbite — les planètes ne sont plus coplanaires. **Sens prograde** (anti-horaire vu du pôle nord), **vitesses réelles** (3ᵉ loi de Kepler, 88 j à 60 190 j). Aplatissement polaire réel (Jupiter −6,5 %, Saturne −9,8 %). Inclinaisons axiales réelles (Vénus 177°, Uranus 98°...). Soleil renforcé : lumière ×4,5 + halo + couronne. **Halo lumineux style Soleil sur les 8 planètes** (sprite additif teinté, comme le halo solaire) + halos atmosphériques de bord (Terre, Vénus, Mars, Jupiter, Neptune, Titan) ; lumières nocturnes de la Terre. Jupiter/Saturne : textures 8K prioritaires + génération procédurale 1024px soignée (zones/cintures turbulentes, Grande Tache rouge, hexagone du pôle nord de Saturne, anneaux à 7 zones avec divisions de Cassini et d'Encke).

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

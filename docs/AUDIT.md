# Audit — Starcruiser Empire (système solaire 3D)

Date : 2026-11-09. Portée : diagnostic avant refonte des fondations (mission « simulation spatiale réaliste »).

## 1. Unités et échelles actuelles (script.js)

| Élément | Valeur actuelle | Problème |
|---|---|---|
| Distance orbitale | `orbit = 30 × AU^0,55` (Terre = 30) | compression non documentée, non inversible proprement |
| Rayon planète | `2,2 × √(r_km/6371)` (Terre = 2,2) | compression racine, incohérente avec les distances |
| Soleil | rayon fixe 8 | arbitraire |
| Vaisseau | GLB normalisé 0,55 local × `scale 0,0005` = **0,000275 unité scène** | taille arbitraire ; si 1 unité ≈ 2896 km (échelle Terre), le vaisseau ferait ~0,8 km au lieu de ~12,5 m |
| Lune | rayon relatif réel (0,27 × Terre) | OK en relatif, mais ancré à l'échelle scène |
| 1 unité scène | ≈ 2896 km (via Terre) | implicite, jamais centralisé |
| Vitesse max | 5 u/s affiché « 600 km/s » (×120) | incohérent avec l'échelle (5 u/s ≈ 14 480 km/s réels) |
| Gravité | `mu = g_surface/8,2 × R²` par astre, soleil mu=1,4 | proche du réel en surface, mais en unités scène ad hoc |
| Caméra | offsets en dur (near 0,00005 en mode vaisseau) | couplée manuellement à l'échelle du vaisseau |
| Collisions | sphère planète + segment balayé | OK pour planètes, **rien pour le terrain** |

**Constat** : deux compressions différentes (distances ^0,55, rayons √) + une taille de vaisseau arbitraire = incohérence physique globale.

## 2. Systèmes existants à conserver

- Rendu Three.js r147 (scripts classiques), scène, soleil + halo/couronne, champ d'étoiles + nébuleuses, fond dégradé shader.
- Planètes : textures NASA réelles (8K via upload.wikimedia.org/jsDelivr), ellipses réelles (e, Ω), inclinaisons orbitales (i ×3), plans inclinés, anneaux (Saturne texture alpha, fins sur Jupiter/Uranus/Neptune), lunes, ceinture d'astéroïdes (particules + rochers instanciés).
- Terre : Phong PBR (albedo/normal/bump/specular 8K), 8 couches de nuages alphaMap, 2 coquilles atmosphère (fresnel + scatter Rayleigh/Mie), lumières nocturnes.
- Vaisseau : X-Wing GLB (open source), pilotage souris (pointer lock) + W/S/ESPACE/CTRL/Q/E/A/D/C, caméra bâton fixe derrière, compteur km/s, tirs laser depuis les ailes, gravité 1/r², collisions sphériques.
- HUD, panneau d'infos planètes, i18n FR/EN (version Clicker).

## 3. Incompatibilités clés à résoudre

1. Échelle de rendu ≠ échelle physique (jamais séparées).
2. Vaisseau taille arbitraire vs planètes.
3. Vitesse affichée (km/s) non liée à l'échelle.
4. Pas de terrain/LOD → pas d'atterrissage.
5. Pas de floating origin → précision float32 limitée aux ~grandes distances.
6. Gravité en unités scène, pas en SI.
7. Pas de physique atmosphérique (densité, traînée).

## 4. Architecture cible proposée

- **Deux couches d'unités, centralisées dans `js/scale.js`** :
  - **Simulation** : unités SI (mètres, kg, secondes), nombres JS en double précision. Gravité universelle réelle (G, masses réelles). 1 UA = 1,496e11 m.
  - **Rendu** : `renderPos = simPos − cameraSimPos` (floating origin) passé à Three.js en float32 → précision OK à toute distance.
  - Compression des distances UNIQUEMENT côté rendu pour la vue d'ensemble (facteur logistique documenté, ex. `renderDist = K × sign(d) × |d|^α`), jamais sur les tailles des corps ni le vaisseau.
- **Vaisseau** : taille réelle ~12,5 m (X-Wing) en unités SI ; masse ~10 t ; poussée moteurs ~120 kN → accélération réaliste ~12 m/s².
- **Planètes** : rayons/masse réels en SI ; positions orbitales réelles (ou compression de rendu documentée).
- **Terre explorable** : cube-sphere + quadtree LOD, tiles de hauteur Terrarium/NASA (ex. `elevation-tiles-prod` S3, encodage Terrarium), textures Blue Marble en streaming par tuile ; océans = sphère niveau de la mer + shader vagues procédural ; atmosphère = coquilles Rayleigh/Mie + densité ρ(h)=ρ0·e^(−h/H).
- **Physique vol** : intégration semi-implicite (dt fixe sous-steppé), gravité N-corps (Soleil + planète proche), traînée aéro `F = ½ ρ v² Cx S`, portance si ailes, collisions terrain par échantillonnage d'altitude + sous-pas de balayage.
- **Architecture générique** : `Planet` (rayon, masse, atmosphère, rotation, textures, relief) réutilisable pour toutes les planètes ; `Ship` (masse, poussée, inertie) ; `Physics` (gravité, aero) ; `Terrain` (LOD) seulement pour les planètes telluriques.

## 5. Plan par étapes (proposé)

1. **Audit** (ce document) + ÷5 accélération vaisseau (fait).
2. **Fondations** : `scale.js` (SI + floating origin + compression rendu), vaisseau en mètres, gravité SI — en protégeant le rendu actuel.
3. **Terre explorable** : cube-sphere LOD + tuiles DEM + textures par tuile.
4. **Transition espace→surface** : entrée atmosphère continue, nuages à échelle réelle, LOD progressif.
5. **Physique avancée** : inertie, traînée atmosphérique, collisions terrain, atterrissage/décollage.
6. **Optimisation/validation** : perfs, transitions, échelles, tests.

## 6. Ressources identifiées (libres de droits)

- Textures : NASA / Solar System Scope CC-BY 4.0 (déjà utilisées).
- Relief : tiles Terrarium PNG (ex. `s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`, encodage `(R·65536+G·256+B/256)−32768`), NASA SRTM / Copernicus DEM.
- Blue Marble Next Generation (NASA, domaine public) pour l'albedo par tuile.

## ✅ Avancement (2026-11-09)

- **Étape 2a faite** (commit cfd446a) : `scale.js` — unités SI centralisées (1 SU = 2 895 909 m), vaisseau 12,5 m réels (X-Wing), gravité universelle réelle (`mu = G·M/M_PER_SU³`, masses SI), poussée 30 m/s², compteur km/s cohérent avec l'échelle, caméra découplée de l'échelle du vaisseau.
- **Étape 4/5 faite** (commit c90c62b) : traînée atmosphérique `ρ(h)=ρ0·e^(−h/H)` (Terre 1,225 kg/m³/H=8,5 km, Vénus, Mars), terrain local Terre (heightmap procédural ~174 km de côté, relief exagéré ×100 documenté) avec collision sol et atterrissage/décollage.

## ⏳ Reste à faire

- Étape 3 complète : cube-sphere + quadtree LOD + tuiles DEM réelles (Terrarium/NASA SRTM en streaming) + Blue Marble par tuile.
- Étape 4 : rentrée atmosphérique (chauffage), portance, floating origin complet (sim SI + rendu relatif caméra).
- Étape 5 : N-corps complet, rotation planètes, sous-pas physiques fixes.
- Étape 6 : perfs (frustum culling terrain, unload), tests de transition.

- **Étape 3 faite** (commit a8dbcf7) : terrain Terre en **vraies tuiles DEM Terrarium/NASA** (`elevation-tiles-prod` S3, cache, bloc 3×3), LOD par altitude (zoom 12 < 1,5 km, 10 < 6 km, 8 < 30 km), repli procédural, collision sol échantillonnée sur le DEM.

- **Étape 4 faite** (commit 0fc64ef) : rentrée atmosphérique (halo de chauffe = f(vitesse × ρ), brouillard/ciel bleu selon altitude via scène.fog), HUD altitude (km), delta physique plafonné à 1/30 s.

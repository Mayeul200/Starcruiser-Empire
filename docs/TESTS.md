# Batterie de tests — Starcruiser Empire

Date : 2026-11-09. Dernière version testée : v109 (`script.js?v=109`, `scale.js?v=8`).

## ✅ Checks automatisés (faits en CI locale, tous OK)

| Check | Résultat |
|---|---|
| `node --check script.js` / `scale.js` | ✅ syntaxe OK |
| Tous les `getElementById("...")` existent dans `index.html` | ✅ 14/14 IDs trouvés |
| Aucun `console.error` / `throw` dans le code | ✅ 0 |
| Anti-cache cohérent (`?v=` sur style.css/script.js/scale.js) | ✅ v109 / v8 |
| Objets 3D ajoutés (~39 ajouts) | ✅ scène ~200 objets (planètes, lunes, anneaux, ceinture, vaisseau, bolts) |
| URLs externes : toutes en CORS `*` (jsDelivr, raw.githubusercontent, threejs.org, upload.wikimedia.org, S3 elevation-tiles, Google Fonts) | ✅ aucune source sans CORS |

## 🧪 HUD perf intégré

En bas à droite : **FPS + draw calls + triangles** (`renderer.info`) mis à jour 2×/s.

## 📋 Checklist manuelle (à cocher en jeu)

- [ ] Page charge sans erreur console (hors extensions/GitHub Pages)
- [ ] Système solaire : 8 planètes, orbites elliptiques inclinées, anneaux Saturne
- [ ] Clic planète → fiche + caméra qui suit
- [ ] R → mode vaisseau : souris viser, W/S/ESPACE/CTRL/Q/E/A/D/C, clic/F = tir
- [ ] Caméra bâton fixe derrière, compteur km/s + altitude, HUD perf visible
- [ ] Approche Terre → terrain DEM réel apparaît, atterrissage possible, redécollage OK
- [ ] Rentrée : halo de chauffe + ciel bleu à basse altitude
- [ ] Gravité ressentie près des planètes ; collisions sans traversée
- [ ] FPS stable (> 30) en vue système et au sol

## v111 — tests perfs/robustesse en Chromium headless (Playwright, SwiftShader)

Batterie exécutée en local : serveur statique + Chromium headless 1280×720, WebGL software (SwiftShader).

| Test | Résultat |
|---|---|
| Chargement (`load`) | ~600 ms (CDN OK) ; 3,2 s avec repli procédural (429 CDN) |
| Erreurs JS (`pageerror`) | ✅ 0 après correctif v111 |
| **Bug trouvé & corrigé** : `ACCEL_SCALE is not defined` (script.js:1095) interrompait l'init à la 1ʳᵉ lune → planètes/labels/menu jamais créés. Remplacé par `SCALE.accelSU(m.gSurface)` | ✅ corrigé |
| FPS (SwiftShader, logiciel) | 61 FPS scène vide (bug), 7–19 FPS scène complète — non représentatif d'un GPU réel |
| Pire frame / spikes >100 ms (logiciel) | 300 ms / 26 spikes sur 4 s (logiciel) |
| Heap JS | 10–12 Mo, stable |
| Repli procédural (CDN 429/offline) | ✅ automatique, zéro erreur bloquante |
| `webglcontextlost` | ✅ handler ajouté (v111) : overlay + reload auto — avant : page noire muette |
| Rechargement x5 (headless+SwiftShader) | ⚠️ crash du thread GPU (int3) à la 2ᵉ création de contexte dans le même processus — reproductible uniquement en rendu logiciel headless, à vérifier sur GPU réel ; page témoin WebGL simple = OK |

## ⚠️ Limites connues

- Relief exagéré ×2 côté rendu proche ; tuiles DEM limitées aux zooms 8/10/12.
- Vitesse max 5 SU/s = ~14 500 km/s (plafond gameplay, documenté dans scale.js).
- Extension navigateur = erreurs `content.js` dans la console (pas notre code).

## v110 — robustesse local + perfs

- `window.onerror` -> overlay d'erreur explicite (aide au diagnostic en local/file://)
- Garde-fou `SCALE` manquant (scale.js) avec message + commande `python3 -m http.server 8000`
- `powerPreference: "high-performance"` ; étoiles 6850 -> 4720, nébuleuses 14 -> 10 (moins de draw calls)
- Si la page ne marche pas en local : ouvrir la console (F12), l'overlay affiche la cause ; en file://, servir via `python3 -m http.server 8000` puis http://localhost:8000

## v111 — bug critique corrigé

- `ReferenceError: ACCEL_SCALE is not defined` (script.js:1095, mu des lunes) : init interrompue à la 1ère lune -> planètes/labels/menu absents. Corrigé : `SCALE.accelSU(m.gSurface) * size * size`.
- Handler `webglcontextlost`/`webglcontextrestored` ajouté (perte GPU -> overlay + reload auto).
- Trouvé par tests headless Chromium (Playwright) : 0 erreur JS, 8 planètes + lunes OK, repli procédural OK quand CDN bloqué.

## v111+ — tests headless Chromium réels (tools/headless-test.mjs)

Script réutilisable : `PLAYWRIGHT_DIR=/tmp/pwtest/ LD_LIBRARY_PATH=... node tools/headless-test.mjs` (Chromium headless-shell + libs .deb extraits sur deb.debian.org).

Résultats (scène complète, SwiftShader logiciel) : **0 erreur JS**, **8 planètes + labels**, 0 requête échouée, canvas OK, pas d'overlay fatal, screenshot OK (Soleil + 8 planètes + orbites + HUD). Perf headless : 142 draw calls, ~203k triangles, HUD 30 fps (limité par le rendu logiciel, pas représentatif d'un vrai GPU).

- **Règle notée dans le code** (en-tête de `script.js` + README) : lancer `tools/headless-test.mjs` après chaque modification.
- Re-test v111 (2ᵉ passage) : 0 erreur JS, 8 planètes, 0 requête échouée, 139 calls / 203k tri, pas d'overlay fatal. ✅

- **v112** : fix caméra mode vaisseau (floating origin : `rocket.position - origin`), test headless OK (0 erreur, 8 planètes, 140 calls). Bump v112 unique (évite la collision de cache v111).

- **v113** : fix focus planète (cible caméra en coordonnées rendu `sim − origin` après floating origin — la caméra n'atterrit plus entre deux planètes). Test headless OK : 8 planètes, 0 erreur JS (les 429 = rate-limit CDN sandbox, géré par le repli procédural).

- **v114** : fix oscillation « double système » en mode vaisseau — boucle de rétroaction origin<->caméra ; maintenant `origin = position du vaisseau` en mode 🚀 (0 saut mesuré sur 30 frames en headless, 0 erreur). Test headless standard OK.

- **v115** : fix caméra mode vaisseau — l'offset était scalé par le vaisseau (7,8e-6) via localToWorld → caméra dans le vaisseau ; maintenant offset en unités monde + origin synchronisé AVANT la caméra. Vérifié en headless : vaisseau visible à l'écran en mode R (NDC centré), 0 erreur JS, 8 planètes.

- **v116** : terrain ajouté à `world` (plus de « planète fantôme » décalée) + polygonOffset anti z-fighting ; coquille fresnel externe retirée sur Terre (déjà scatter) → moins de scintillement ; caméra vaisseau -0.00003. Tests headless OK : 8 planètes, 0 erreur, vaisseau centré en mode R.

- **v117** : anti-scintillement structurel — `logarithmicDepthBuffer: true` (le ratio near/far atteignait 1,8×10⁹ en mode 🚀 : le depth buffer 24 bits ne pouvait plus séparer les couches → z-fighting généralisé). Chunks `logdepthbuf` ajoutés aux 3 shaders customs (ciel, fresnel atmosphères, scatter Rayleigh Terre) sinon ils ignoraient le depth log. Netteté : anisotropie max GPU aussi sur les textures procédurales (avant : CDN uniquement), sphères planètes 48→96 segments, lunes 24→48×32 (facetting en zoom). Vérifié headless : X-Wing centré en mode R, planètes rendues, 0 artefact, 0 erreur JS, 60 fps orbite / 140 calls / 329k tri.

- **v118** : fix « double système » en vue globale — la boucle `origin += dCam` existait AUSSI en mode orbite : à chaque drag/zoom, `origin` oscillait ±Δ frame par frame (le monde sautait entre deux positions = système doublé scintillant). Suppression complète du décalage d'origin en mode orbite (l'origin ne bouge plus qu'en mode 🚀, posée directement sur le vaisseau). **Preuve headless** : `world.position` = (0,0,0), 1 seule valeur sur 28 frames échantillonnées pendant drag + zoom molette. Ré-ancrage en sortie de mode 🚀 (`orbit.target` sur le vaisseau, `desiredTarget` sur le Soleil `-origin`) et `resetView` idem. Physique : **gravité solaire était ~4×10⁶ trop forte** (mu réel × distances d'orbite compressées ~2000×) — le vaisseau subissait ~10 000 m/s² de chute libre vers le Soleil ; `SUN_MU` désormais recalibré pour que g à l'orbite compressée de la Terre = g réel à 1 UA (dérive mesurée : 0 km/s sans input, contre 55 km/s en 4 s avant). Poussée ×10 (300 000 → 3 000 000 N = 300 m/s² = 30 g), plafond vitesse 5→15 SU/s. Caméra vaisseau rapprochée : -0,00003 → -0,000012 SU (~87 m → ~35 m).

- **v119** : éblouissement des planètes corrigé — le rendu était sans tone mapping : les zones éclairées par la PointLight solaire (intensité 3.0) saturaient au blanc pur avec un bord dur (le « rond de lumière net »). Maintenant : `ACESFilmicToneMapping` (rolloff doux des hautes lumières, plus d'écrêtage dur), lumière solaire 3.0→1.7, spéculaire Terre adouci (shininess 28→6, specular 0x88aabb→0x1c2a38). Vérifié headless : éclairage planétaire doux, aucun disque saturé. Poussée ×10 supplémentaire : 3 000 000→30 000 000 N (**3000 m/s² = 300 g**), plafond vitesse 15→50 SU/s (~145 000 km/s). Caméra vaisseau abaissée : offset vertical 0,000004→0,0000015 SU (~12→4 m au-dessus de l'axe).

- **v120** : poussée à l'échelle du monde — 300 g paraît énorme en m/s² mais 1 SU = 2 896 km, donc 3000 m/s² = 0,01 SU/s² seulement : le plafond de vitesse (50 SU/s) était inatteignable en ~80 min. Poussée maintenant ~10 SU/s² (`thrustN: 2.9e11`) : plafond 145 000 km/s atteint en ~5 s, système solaire traversé en quelques secondes. Mesuré headless (physique ralentie ~1/9 par le rendu logiciel) : 966 km/s après 1 s, 9 082 km/s après 3 s.

- **v121** : réglage joueur — poussée 10→**2 SU/s²** (`thrustN: 5.8e10`), vitesse max 145 000→**5 000 km/s** (1,727 SU/s). Plafond atteint en ~0,9 s de poussée.

- **v122** : tirs plasma réparés et retravaillés — cause de la « perte » du tir : `shipBounds` (Box3 monde) devenait périmé après les changements de floating origin (offsets de bouche calculés depuis des coordonnées obsolètes) ET les bolts filaient à 30 SU/s (87 000 km/s : hors du champ en 3 ms, invisibles). Maintenant : offsets locaux fixes (bouts d'ailes gauche/droite alternés, `shipLengthSU()`), bolts fins (rayon 8e-7 SU ≈ 2,3 m, longueur 9e-6 SU ≈ 26 m), vitesse visible 0,0006 SU/s relative au vaisseau (~1,7 km/s), vie 8 s, flash de bouche recalibré (43 m au lieu de 174 km). Vérifié headless : 1 644 pixels rouge pur rendus dans la zone centrale après 4 tirs. Caméra vivante (techniques standard) : balancement procédural basse fréquence (±0,3-1 m), étirement lié à la vitesse (jusqu'à 3 m à vitesse max, retour au repos à l'arrêt), shake de tir à décroissance exponentielle `exp(-5·dt)` — tout revient toujours à la position de repos.

- **v123 (Étape 1 plan Terre détaillée)** : LOD terrain 3→5 niveaux (z8/z10/z12 + z14 5,8 km + z15 1,45 km — résolution au sol ~22 m/vertex au plus fin, DEM terrarium jusqu'à ~4 m/px), biomes par sommet (neige >2200 m, roche si pente, sable <4 m, forêt/prairie par hash, vertexColors), océan par plan d'eau au niveau 0 (1,45 m, roughness 0.18), relief procédural ∝ taille du patch (avant : bosses fixes de 7 km !). **3 bugs majeurs réparés** : (1) sphère de collision planètes à +87 km d'altitude → atterrissage impossible + éjection élastique du vaisseau (min ramené à +5,8 m), (2) gravité coupée sous 870 km d'altitude (gate radius+0.3 → radius+5e-6), (3) `data.atmo` était une chaîne descriptive, pas l'objet {h0,rho0,H} attendu → traînée/rentrée/altitude **n'avaient jamais fonctionné** ; ajout `atmoPhys` (Terre, Mars, Vénus). Orbites quasi gelées en mode 🚀 (×1e-4) : sinon la Terre file à 78 000 km/s, atterrissage impossible. Flight assist : poussée et plafond réduits par paliers d'altitude (500 m / 5 km / 20 km) pour la sensation de vol. Offset d'atterrissage 58 m → 4,3 m. Panneau debug (alt, v, niveaux terrain, fps, [N] wireframe). Vérifié headless : terrain 5 niveaux construit à 3 km d'altitude, chute gravitationnelle réaliste, 0 erreur JS.

- **v124** : échelle cohérente agrandie — `M_PER_SU` 2 896 km → **1 062 km/SU** (rayon Terre 2,2 → 6 SU) : le joueur est ×2,73 plus petit face aux planètes, physique et terrain suivent automatiquement (tout dérive de `SCALE`). Lunes repositionnées ×2,73 (sinon elles finissaient DANS leur planète agrandie — Lune 12,5 SU, Io 28,3 SU…). ~35 constantes SU recalculées (caméra, tirs, terrain, collisions, plafonds vitesse). Exagération DEM ×2→×3 (relief plus visible) + conversion biomes corrigée. **Fix couches qui masquaient le relief** : la sphère planète + nuages + coquilles atmosphériques se cachent sous 15 km d'altitude quand le terrain est actif (le brouillard couvre l'horizon, aucun bord visible). **Fix direction des tirs** : les bolts héritaient la vitesse du vaisseau (jusqu'à 5000 km/s) qui écrasait leur vitesse propre (1,7 km/s) → ils partaient vers la direction de déplacement ; désormais vitesse = fwd×(muzzle + |v|) + v — toujours dans la direction où regardent les canons. Spawn déplacé à (50,5,0) (Mars agrandie). Vérifié headless : 0 erreur JS, orbite 30 fps, vaisseau correct, poussée 580 km/s en 1 s.

- **v125** : échelle ×2,67 vers le réel — Terre **16 SU** (M_PER_SU = 398 km), orbites élargies `80×UA^0,75` (Terre 80 SU, Neptune 944 SU — plus proches des ratios réels), Soleil 20 SU (halo réduit pour ne pas engloutir Mercure). **Toutes les constantes joueur redéfinies en MÈTRES** (`M_CAM_BACK = toSU(35)`…) : les prochains changements d'échelle sont gratuits. Lunes ×2,67 + **collisions avec les lunes** (rayon stocké, marge adaptative). **Fix téléport arrière près d'une planète** : marge de collision adaptative `max(6 m, |v|×5 %)` — le vaisseau ne peut plus traverser la sphère et se faire éjecter de l'autre côté ; paliers de vitesse étendus en altitude (212 m/s <3 km, 1 km/s <30 km, 10,6 km/s <300 km, 106 km/s <3000 km) = anti-tunneling. **Skin de la Terre appliqué sur le relief** : UV équirectangulaires par vertex (lat/lon), texture daymap NASA partagée avec la sphère, teintée par les biomes (éclaircis 40 %) — le terrain EST la Terre, plus de skin flottant par-dessus. 6ᵉ niveau de terrain (patch 160 m, ~2,5 m/vertex) + bruit de détail procédural sur les niveaux z15. Tirs vérifiés : 3 683 pixels rouges rendus, direction de visée. Poussée : 843 km/s en 1 s (headless ralenti), plafond 5000 km/s.

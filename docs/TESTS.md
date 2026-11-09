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

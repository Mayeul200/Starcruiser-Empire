(() => {
  "use strict";

  const fatalError = document.getElementById("fatal-error");
  const fatalMessage = document.getElementById("fatal-message");

  function showFatal(message) {
    fatalMessage.textContent = message;
    fatalError.classList.remove("hidden");
    const intro = document.getElementById("intro");
    if (intro) intro.classList.add("hidden");
  }

  if (!window.THREE) {
    showFatal("La librairie Three.js n'a pas pu être chargée (CDN injoignable).");
    return;
  }

  const canvas = document.getElementById("scene");
  if (!canvas) {
    showFatal("Élément canvas introuvable dans la page.");
    return;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  } catch (err) {
    showFatal("WebGL n'est pas disponible dans ce navigateur.");
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (THREE.sRGBEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 3000);
  camera.position.set(0, 90, 300);

  scene.add(new THREE.AmbientLight(0x334466, 1.1));
  const sunLight = new THREE.PointLight(0xfff3d6, 2.6, 0, 0);
  scene.add(sunLight);

  /* ============================================================
     ÉCHELLE — données réelles (NASA) puis compression lisible :
     - distance scène = 26 × (distance en UA)^0,6
     - rayon scène    = 2,2 × √(rayon_km / 6371)  (Terre = 2,2)
     - Soleil : 9 (compressé, sinon il avalerait Mercure)
     ============================================================ */

  const SUN_RADIUS = 9;
  const EARTH_R_KM = 6371;

  function orbitFromAU(au) {
    return 26 * Math.pow(au, 0.6);
  }

  function radiusFromKm(rKm) {
    return 2.2 * Math.sqrt(rKm / EARTH_R_KM);
  }

  const SSS = "https://www.solarsystemscope.com/textures/download/";
  const TJ = "https://threejs.org/examples/textures/planets/";

  const PLANETS = [
    {
      name: "Mercure", au: 0.387, rKm: 2439, tilt: 0.03, speed: 4.15, color: 0x9c8e82,
      texUrls: [SSS + "2k_mercury.jpg"],
      proc: { type: "craters", base: "#8a7f74", dark: "#5f564e", light: "#a39687" },
      type: "Tellurique", typeClass: "tellurique",
      diameter: "4 879 km", mass: "3,30 × 10²³ kg", distance: "57,9 M km (0,39 UA)",
      period: "88 jours", temp: "−173 à 427 °C", gravity: "3,7 m/s²",
      atmo: "Quasi nulle", moons: "0", discovered: "Antiquité",
      desc: "La planète la plus proche du Soleil et la plus petite du système solaire, criblée de cratères.",
      fact: "À retenir : un jour solaire sur Mercure dure 176 jours terrestres.",
    },
    {
      name: "Vénus", au: 0.723, rKm: 6052, tilt: 177.4, speed: 1.62, color: 0xe8c98a,
      texUrls: [SSS + "2k_venus_atmosphere.jpg"],
      proc: { type: "venus", base: "#d9b878", light: "#f0dcb0", dark: "#c9a45e" },
      type: "Tellurique", typeClass: "tellurique",
      diameter: "12 104 km", mass: "4,87 × 10²⁴ kg", distance: "108,2 M km (0,72 UA)",
      period: "225 jours", temp: "464 °C", gravity: "8,87 m/s²",
      atmo: "CO₂ très dense", moons: "0", discovered: "Antiquité",
      desc: "Enveloppée d'une épaisse atmosphère de CO₂, c'est la planète la plus chaude du système solaire.",
      fact: "À retenir : Vénus tourne à l'envers (rotation rétrograde) par rapport aux autres planètes.",
    },
    {
      name: "Terre", au: 1.0, rKm: 6371, tilt: 23.4, speed: 1.0, color: 0x4d8fd1, clouds: true,
      texUrls: [SSS + "2k_earth_daymap.jpg", TJ + "earth_atmos_2048.jpg"],
      cloudUrls: [TJ + "earth_clouds_1024.png", SSS + "2k_earth_clouds_1024.png"],
      proc: { type: "earth", base: "#14508f", land: "#3f9e5a", desert: "#c2a86b", ice: "#eef4f8" },
      type: "Tellurique", typeClass: "tellurique",
      diameter: "12 756 km", mass: "5,97 × 10²⁴ kg", distance: "149,6 M km (1 UA)",
      period: "365,25 jours", temp: "15 °C", gravity: "9,81 m/s²",
      atmo: "Azote / Oxygène", moons: "1 (la Lune)", discovered: "—",
      desc: "Seule planète connue à abriter la vie, avec de l'eau liquide couvrant 71 % de sa surface.",
      fact: "À retenir : la Lune s'éloigne de la Terre de 3,8 cm chaque année.",
      moons3d: [{ name: "Lune", rKm: 1737, dist: 4.6, color: 0xbfbfbf, speed: 1.4, texUrls: [SSS + "2k_moon.jpg", TJ + "moon_1024.jpg"] }],
    },
    {
      name: "Mars", au: 1.524, rKm: 3390, tilt: 25.2, speed: 0.53, color: 0xc1552f,
      texUrls: [SSS + "2k_mars.jpg"],
      proc: { type: "mars", base: "#b5502a", dark: "#7a3418", ice: "#f2f2f2" },
      type: "Tellurique", typeClass: "tellurique",
      diameter: "6 779 km", mass: "6,42 × 10²³ kg", distance: "227,9 M km (1,52 UA)",
      period: "687 jours", temp: "−63 °C", gravity: "3,71 m/s²",
      atmo: "CO₂ ténue", moons: "2 (Phobos, Deimos)", discovered: "Antiquité",
      desc: "La planète rouge, hôte du plus haut volcan du système solaire, Olympus Mons (22 km).",
      fact: "À retenir : Mars abrite aussi le plus grand canyon, Valles Marineris (4 000 km de long).",
      moons3d: [
        { name: "Phobos", rKm: 11, dist: 2.6, color: 0x8a7f76, speed: 2.4 },
        { name: "Deimos", rKm: 6, dist: 3.4, color: 0x7d736b, speed: 1.2 },
      ],
    },
    {
      name: "Jupiter", au: 5.203, rKm: 69911, tilt: 3.1, speed: 0.084, color: 0xd8b08c,
      texUrls: [SSS + "2k_jupiter.jpg"],
      proc: { type: "jupiter", bands: ["#d8b48e", "#b08a5e", "#e8cfae", "#c49a6c", "#a3764f", "#e0c9a8"], spot: "#c1442e" },
      type: "Géante gazeuse", typeClass: "gazeuse",
      diameter: "139 820 km", mass: "1,90 × 10²⁷ kg", distance: "778,5 M km (5,2 UA)",
      period: "11,9 ans", temp: "−110 °C", gravity: "24,79 m/s²",
      atmo: "Hydrogène / Hélium", moons: "95 connues", discovered: "Antiquité",
      desc: "La plus massive des planètes, célèbre pour sa Grande Tache rouge, une tempête géante.",
      fact: "À retenir : la Grande Tache rouge souffle depuis au moins 300 ans et pourrait engloutir la Terre.",
      moons3d: [
        { name: "Io", rKm: 1821, dist: 9.6, color: 0xe0c25a, speed: 1.8 },
        { name: "Europe", rKm: 1560, dist: 11.2, color: 0xdfe8ee, speed: 1.3 },
        { name: "Ganymède", rKm: 2634, dist: 13.2, color: 0xa89a8a, speed: 0.95 },
        { name: "Callisto", rKm: 2410, dist: 15.4, color: 0x5f5a54, speed: 0.7 },
      ],
    },
    {
      name: "Saturne", au: 9.537, rKm: 58232, tilt: 26.7, speed: 0.034, color: 0xe3cf9e, rings: true,
      texUrls: [SSS + "2k_saturn.jpg"],
      ringUrls: [SSS + "2k_saturn_ring_alpha.png"],
      proc: { type: "saturn", bands: ["#e6d3a3", "#d9c48f", "#efe3bb", "#cbb27f"] },
      type: "Géante gazeuse", typeClass: "gazeuse",
      diameter: "116 460 km", mass: "5,68 × 10²⁶ kg", distance: "1,43 Md km (9,5 UA)",
      period: "29,4 ans", temp: "−140 °C", gravity: "10,44 m/s²",
      atmo: "Hydrogène / Hélium", moons: "146 connues", discovered: "Antiquité",
      desc: "Célèbre pour ses anneaux de glace spectaculaires, visibles même avec une petite lunette.",
      fact: "À retenir : Saturne est si peu dense qu'elle flotterait sur l'eau.",
      moons3d: [{ name: "Titan", rKm: 2574, dist: 9.0, color: 0xe0a83c, speed: 0.8 }],
    },
    {
      name: "Uranus", au: 19.19, rKm: 25362, tilt: 97.8, speed: 0.012, color: 0x9fe3e0, faintRings: true,
      texUrls: [SSS + "2k_uranus.jpg"],
      proc: { type: "uranus", base: "#9fdcd9", band: "#c8efeb" },
      type: "Géante de glaces", typeClass: "glaces",
      diameter: "50 724 km", mass: "8,68 × 10²⁵ kg", distance: "2,87 Md km (19,2 UA)",
      period: "84 ans", temp: "−195 °C", gravity: "8,87 m/s²",
      atmo: "H₂ / Hélium / Méthane", moons: "28 connues", discovered: "1781 — W. Herschel",
      desc: "Géante de glace qui roule sur son orbite, son axe étant incliné à 98°.",
      fact: "À retenir : sur Uranus, chaque pôle connaît 42 ans de jour puis 42 ans de nuit.",
      moons3d: [{ name: "Titania", rKm: 788, dist: 6.4, color: 0xb8c4cc, speed: 0.9 }],
    },
    {
      name: "Neptune", au: 30.07, rKm: 24622, tilt: 28.4, speed: 0.006, color: 0x4f6fd8,
      texUrls: [SSS + "2k_neptune.jpg"],
      proc: { type: "neptune", base: "#3d5bd0", bands: ["#4a68c9", "#3350b0", "#6d8ade"], spot: "#2a3f8f" },
      type: "Géante de glaces", typeClass: "glaces",
      diameter: "49 244 km", mass: "1,02 × 10²⁶ kg", distance: "4,50 Md km (30,1 UA)",
      period: "164,8 ans", temp: "−200 °C", gravity: "11,15 m/s²",
      atmo: "H₂ / Hélium / Méthane", moons: "16 connues", discovered: "1846 — Le Verrier",
      desc: "La planète la plus éloignée du Soleil, balayée par les vents les plus rapides connus.",
      fact: "À retenir : les vents de Neptune atteignent 2 100 km/h, les plus rapides du système solaire.",
      moons3d: [{ name: "Triton", rKm: 1353, dist: 6.2, color: 0xd8b8c8, speed: 1.1 }],
    },
  ];

  for (const p of PLANETS) {
    p.orbit = orbitFromAU(p.au);
    p.radius = radiusFromKm(p.rKm);
  }

  /* ---------- Utilitaires ---------- */

  function makeRng(seed) {
    let s = seed;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  function lonLatToXY(lon, lat, w, h) {
    return [(lon + 180) / 360 * w, (90 - lat) / 180 * h];
  }

  function tryLoadTexture(urls, onSuccess) {
    if (!urls || urls.length === 0) return;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(urls[0], (tex) => {
      if (THREE.SRGBColorSpace !== undefined) tex.colorSpace = THREE.SRGBColorSpace;
      else tex.encoding = THREE.sRGBEncoding;
      onSuccess(tex);
    }, undefined, () => tryLoadTexture(urls.slice(1), onSuccess));
  }

  function applyColorSpace(tex) {
    if (THREE.SRGBColorSpace !== undefined) tex.colorSpace = THREE.SRGBColorSpace;
    else tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  /* ---------- Textures procédurales (repli hors-ligne fidèles aux vraies planètes) ---------- */

  function drawBands(g, w, h, colors, rng, wave) {
    let y = 0;
    let phase = rng() * 10;
    while (y < h) {
      const bh = 10 + rng() * 30;
      g.fillStyle = colors[Math.floor(rng() * colors.length)];
      g.globalAlpha = 0.55 + rng() * 0.45;
      g.beginPath();
      g.moveTo(0, y + Math.sin(phase) * wave);
      for (let x = 0; x <= w; x += 16) {
        g.lineTo(x, y + Math.sin(x / 60 + phase) * wave);
      }
      g.lineTo(w, y + bh);
      g.lineTo(0, y + bh);
      g.closePath();
      g.fill();
      y += bh;
      phase += 1.7;
    }
    g.globalAlpha = 1;
  }

  function drawSpot(g, lon, lat, rx, ry, color, w, h) {
    const [x, y] = lonLatToXY(lon, lat, w, h);
    g.fillStyle = color;
    g.beginPath();
    g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    g.fill();
  }

  const CONTINENTS = [
    [[-168, 66], [-140, 70], [-125, 72], [-110, 73], [-95, 72], [-85, 70], [-80, 73], [-70, 62], [-65, 60], [-60, 52], [-70, 45], [-75, 40], [-80, 32], [-81, 26], [-90, 20], [-97, 26], [-105, 20], [-110, 23], [-115, 30], [-125, 40], [-125, 49], [-135, 58], [-152, 60], [-168, 66]],
    [[-80, 10], [-70, 12], [-60, 8], [-50, 0], [-35, -8], [-40, -20], [-55, -35], [-70, -52], [-72, -40], [-70, -18], [-80, -5], [-80, 10]],
    [[-45, 60], [-25, 70], [-20, 80], [-40, 83], [-58, 76], [-45, 60]],
    [[-17, 15], [-10, 30], [0, 36], [10, 37], [20, 32], [32, 31], [43, 12], [51, 12], [48, 5], [40, -5], [35, -20], [20, -35], [15, -30], [12, -18], [9, -5], [8, 4], [-8, 5], [-17, 15]],
    [[-9, 43], [-2, 48], [0, 50], [5, 53], [8, 57], [18, 56], [21, 60], [28, 65], [30, 70], [40, 68], [50, 68], [60, 70], [40, 62], [30, 58], [20, 55], [15, 50], [10, 44], [3, 42], [-9, 43]],
    [[30, 70], [40, 68], [60, 70], [80, 73], [100, 77], [120, 73], [140, 72], [160, 70], [178, 66], [170, 60], [158, 55], [142, 50], [135, 40], [122, 38], [115, 23], [108, 18], [100, 10], [95, 16], [88, 22], [80, 15], [72, 20], [65, 25], [55, 25], [48, 30], [42, 36], [35, 36], [30, 45], [30, 70]],
    [[114, -22], [122, -18], [132, -12], [142, -11], [147, -19], [153, -27], [150, -37], [140, -38], [129, -32], [116, -34], [114, -22]],
  ];

  function fillContinent(g, pts, color, w, h) {
    g.fillStyle = color;
    g.beginPath();
    pts.forEach(([lon, lat], i) => {
      const [x, y] = lonLatToXY(lon, lat, w, h);
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    });
    g.closePath();
    g.fill();
  }

  function makeProcTexture(spec, seed) {
    const w = 512;
    const h = 256;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d");
    const rng = makeRng(seed);

    if (spec.type === "earth") {
      g.fillStyle = spec.base;
      g.fillRect(0, 0, w, h);
      for (const continent of CONTINENTS) fillContinent(g, continent, spec.land, w, h);
      drawSpot(g, 10, 23, 34, 16, spec.desert, w, h);
      drawSpot(g, 60, 45, 26, 10, spec.desert, w, h);
      g.fillStyle = spec.ice;
      g.fillRect(0, 0, w, h * 0.07);
      g.fillRect(0, h * 0.93, w, h * 0.07);
    } else if (spec.type === "mars") {
      g.fillStyle = spec.base;
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 26; i++) {
        drawSpot(g, rng() * 360 - 180, (rng() - 0.5) * 120, 14 + rng() * 30, 6 + rng() * 12, spec.dark, w, h);
        g.globalAlpha = 0.35 + rng() * 0.3;
        g.fill();
        g.globalAlpha = 1;
      }
      drawSpot(g, -70, -45, 26, 14, "#5c2a12", w, h);
      g.fillStyle = spec.ice;
      g.fillRect(0, 0, w, h * 0.06);
      g.fillRect(0, h * 0.94, w, h * 0.06);
    } else if (spec.type === "jupiter") {
      drawBands(g, w, h, spec.bands, rng, 7);
      drawSpot(g, 190, -22, 30, 12, spec.spot, w, h);
      g.strokeStyle = "#e8b98f";
      g.lineWidth = 3;
      g.beginPath();
      g.ellipse(...lonLatToXY(190, -22, w, h), 33, 14, 0, 0, Math.PI * 2);
      g.stroke();
      for (let i = 0; i < 5; i++) {
        g.fillStyle = "rgba(255,255,255,0.5)";
        g.beginPath();
        g.ellipse(...lonLatToXY(rng() * 360 - 180, -30 + rng() * 50, w, h), 8 + rng() * 10, 3 + rng() * 3, 0, 0, Math.PI * 2);
        g.fill();
      }
    } else if (spec.type === "saturn" || spec.type === "neptune") {
      drawBands(g, w, h, spec.bands || [spec.base], rng, 5);
      if (spec.type === "neptune") {
        drawSpot(g, 300, -20, 26, 12, spec.spot, w, h);
        for (let i = 0; i < 4; i++) {
          g.fillStyle = "rgba(255,255,255,0.65)";
          g.beginPath();
          g.ellipse(...lonLatToXY(rng() * 360 - 180, -35 + rng() * 45, w, h), 16 + rng() * 14, 2.5, 0, 0, Math.PI * 2);
          g.fill();
        }
      }
    } else if (spec.type === "uranus") {
      const grad = g.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, spec.band);
      grad.addColorStop(0.5, spec.base);
      grad.addColorStop(1, spec.band);
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
    } else if (spec.type === "venus") {
      g.fillStyle = spec.base;
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 14; i++) {
        g.strokeStyle = i % 2 ? spec.light : spec.dark;
        g.globalAlpha = 0.12 + rng() * 0.15;
        g.lineWidth = 8 + rng() * 22;
        g.beginPath();
        const y0 = rng() * h;
        for (let x = 0; x <= w; x += 16) g.lineTo(x, y0 + Math.sin(x / 45 + i) * 14);
        g.stroke();
      }
      g.globalAlpha = 1;
    } else if (spec.type === "craters") {
      g.fillStyle = spec.base;
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 14; i++) {
        g.fillStyle = spec.dark;
        g.globalAlpha = 0.25 + rng() * 0.2;
        g.beginPath();
        g.ellipse(rng() * w, rng() * h, 20 + rng() * 45, 12 + rng() * 25, 0, 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;
      for (let i = 0; i < 420; i++) {
        const x = rng() * w;
        const y = rng() * h;
        const r = 1.5 + rng() * 7;
        g.fillStyle = spec.dark;
        g.globalAlpha = 0.5;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = spec.light;
        g.globalAlpha = 0.6;
        g.beginPath();
        g.arc(x - r * 0.3, y - r * 0.3, r * 0.55, 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;
    }

    return applyColorSpace(new THREE.CanvasTexture(c));
  }

  function makeCloudTexture(seed) {
    const w = 512;
    const h = 256;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d");
    const rng = makeRng(seed);
    g.clearRect(0, 0, w, h);
    for (let i = 0; i < 130; i++) {
      const x = rng() * w;
      const y = rng() * h;
      const r = 8 + rng() * 26;
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, "rgba(255,255,255,0.55)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = grad;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    return applyColorSpace(new THREE.CanvasTexture(c));
  }

  function makeRingTexture() {
    const s = 512;
    const c = document.createElement("canvas");
    c.width = s;
    c.height = s;
    const g = c.getContext("2d");
    const rng = makeRng(777);
    const cx = s / 2;
    const maxR = s / 2 - 4;
    for (let r = 0; r < maxR; r += 1) {
      const t = r / maxR;
      if (t < 0.46) continue;
      let alpha = 0.85;
      let color = "#d8c9a0";
      if (t < 0.58) { alpha = 0.25; color = "#b0a488"; }
      if (t > 0.72 && t < 0.78) { alpha = 0.06; }
      if (t > 0.78 && t < 0.92) { alpha = 0.7; color = "#e8dcc0"; }
      if (t > 0.92) { alpha = 0.35; color = "#c0b294"; }
      alpha *= 0.75 + rng() * 0.25;
      g.strokeStyle = color;
      g.globalAlpha = alpha;
      g.beginPath();
      g.arc(cx, cx, r, 0, Math.PI * 2);
      g.stroke();
    }
    g.globalAlpha = 1;
    return applyColorSpace(new THREE.CanvasTexture(c));
  }

  function makeGlowTexture() {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, "rgba(255, 230, 170, 1)");
    grad.addColorStop(0.25, "rgba(255, 190, 90, 0.55)");
    grad.addColorStop(0.6, "rgba(255, 140, 40, 0.15)");
    grad.addColorStop(1, "rgba(255, 120, 20, 0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }

  function makeSunTexture() {
    const w = 512;
    const h = 256;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d");
    const rng = makeRng(99);
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#ffdf9e");
    grad.addColorStop(0.5, "#ffc44d");
    grad.addColorStop(1, "#ff9a2e");
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = rng() > 0.5 ? "#ffedb8" : "#f08c1e";
      g.globalAlpha = 0.08 + rng() * 0.15;
      g.beginPath();
      g.arc(rng() * w, rng() * h, 2 + rng() * 9, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
    return applyColorSpace(new THREE.CanvasTexture(c));
  }

  function makeLabelTexture(text) {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 64;
    const g = c.getContext("2d");
    g.font = "700 30px 'Space Grotesk', sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.shadowColor = "rgba(96, 165, 250, 0.9)";
    g.shadowBlur = 12;
    g.fillStyle = "#e2e8f0";
    g.fillText(text.toUpperCase(), 128, 32);
    return applyColorSpace(new THREE.CanvasTexture(c));
  }

  function makeLabel(text, scale) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: makeLabelTexture(text), transparent: true, depthWrite: false })
    );
    sprite.scale.set(scale, scale / 4, 1);
    return sprite;
  }

  /* ---------- Soleil ---------- */

  const sunMat = new THREE.MeshBasicMaterial({ map: makeSunTexture() });
  const sun = new THREE.Mesh(new THREE.SphereGeometry(SUN_RADIUS, 48, 48), sunMat);
  scene.add(sun);
  tryLoadTexture([SSS + "2k_sun.jpg"], (tex) => {
    sunMat.map = tex;
    sunMat.needsUpdate = true;
  });

  const sunGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: makeGlowTexture(), blending: THREE.AdditiveBlending, depthWrite: false })
  );
  sunGlow.scale.set(SUN_RADIUS * 5, SUN_RADIUS * 5, 1);
  scene.add(sunGlow);

  const sunLabel = makeLabel("Soleil", 11);
  sunLabel.position.set(0, SUN_RADIUS + 5, 0);
  scene.add(sunLabel);

  tryLoadTexture([SSS + "2k_stars_milky_way.jpg"], (tex) => {
    tex.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = tex;
  });

  /* ---------- Orbites + ceinture d'astéroïdes ---------- */

  function makeOrbitLine(radius) {
    const points = [];
    for (let i = 0; i <= 160; i++) {
      const a = (i / 160) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.8 }));
    scene.add(line);
    return line;
  }

  function makeAsteroidBelt() {
    const count = 2200;
    const positions = new Float32Array(count * 3);
    const rng = makeRng(4242);
    for (let i = 0; i < count; i++) {
      const a = rng() * Math.PI * 2;
      const r = orbitFromAU(2.1) + rng() * (orbitFromAU(3.3) - orbitFromAU(2.1));
      positions.set([Math.cos(a) * r, (rng() - 0.5) * 1.4, Math.sin(a) * r], i * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const belt = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({ color: 0x8d8577, size: 0.3, transparent: true, opacity: 0.9 })
    );
    scene.add(belt);
    return belt;
  }

  const asteroidBelt = makeAsteroidBelt();

  /* ---------- Planètes ---------- */

  const orbitLines = [];
  const labels = [];
  const planetObjects = [];

  PLANETS.forEach((data, index) => {
    const orbitLine = makeOrbitLine(data.orbit);
    orbitLines.push(orbitLine);

    const material = new THREE.MeshStandardMaterial({
      map: makeProcTexture(data.proc, 1000 + index * 77),
      roughness: 0.95,
      metalness: 0.02,
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(data.radius, 48, 48), material);
    mesh.userData.planet = data;
    tryLoadTexture(data.texUrls, (tex) => {
      material.map = tex;
      material.needsUpdate = true;
    });

    const pivot = new THREE.Group();
    const tilt = new THREE.Group();
    tilt.rotation.z = THREE.MathUtils.degToRad(data.tilt);
    pivot.add(tilt);
    tilt.add(mesh);
    mesh.position.x = data.orbit;
    scene.add(pivot);

    const label = makeLabel(data.name, Math.max(5, data.radius * 1.6));
    label.position.set(data.orbit, data.radius + 2.8, 0);
    pivot.add(label);
    labels.push(label);

    if (data.rings) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(data.radius * 1.11, data.radius * 2.27, 128, 1),
        new THREE.MeshBasicMaterial({ map: makeRingTexture(), side: THREE.DoubleSide, transparent: true, depthWrite: false })
      );
      ring.rotation.x = Math.PI / 2;
      tilt.add(ring);
      tryLoadTexture(data.ringUrls, (tex) => {
        ring.material.map = tex;
        ring.material.needsUpdate = true;
      });
    }

    if (data.faintRings) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(data.radius * 1.5, data.radius * 1.95, 96, 1),
        new THREE.MeshBasicMaterial({ color: 0x8fa8b8, side: THREE.DoubleSide, transparent: true, opacity: 0.22, depthWrite: false })
      );
      ring.rotation.x = Math.PI / 2;
      tilt.add(ring);
    }

    const moons = [];
    (data.moons3d || []).forEach((m) => {
      const size = Math.max(0.12, data.radius * (m.rKm / data.rKm));
      const moonMat = new THREE.MeshStandardMaterial({ color: m.color, roughness: 1 });
      const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(size, 24, 24), moonMat);
      if (m.texUrls) {
        tryLoadTexture(m.texUrls, (tex) => {
          moonMat.map = tex;
          moonMat.needsUpdate = true;
        });
      }
      const moonPivot = new THREE.Group();
      moonPivot.add(moonMesh);
      moonMesh.position.x = m.dist;
      tilt.add(moonPivot);
      moons.push({ pivot: moonPivot, speed: m.speed });
    });

    if (data.clouds) {
      const cloudMat = new THREE.MeshStandardMaterial({
        map: makeCloudTexture(555),
        transparent: true,
        depthWrite: false,
        roughness: 1,
      });
      const clouds = new THREE.Mesh(new THREE.SphereGeometry(data.radius * 1.025, 48, 48), cloudMat);
      tilt.add(clouds);
      tryLoadTexture(data.cloudUrls, (tex) => {
        cloudMat.map = tex;
        cloudMat.needsUpdate = true;
      });
      data.cloudsMesh = clouds;
    }

    planetObjects.push({ data, mesh, pivot, label, moons, angle: Math.random() * Math.PI * 2 });
  });

  /* ---------- Champ d'étoiles ---------- */

  function makeStars() {
    const count = 2200;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const v = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      ).normalize().multiplyScalar(900 + Math.random() * 900);
      positions.set([v.x, v.y, v.z], i * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const points = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({ color: 0xcfe0ff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.7 })
    );
    scene.add(points);
    return points;
  }

  const stars = makeStars();

  /* ---------- Contrôles caméra maison ---------- */

  const orbit = {
    target: new THREE.Vector3(0, 0, 0),
    radius: 285,
    theta: 0,
    phi: 1.22,
    desiredTarget: new THREE.Vector3(0, 0, 0),
    desiredRadius: 285,
    desiredTheta: 0,
    desiredPhi: 1.22,
  };

  let dragging = false;
  let dragMoved = 0;
  let lastX = 0;
  let lastY = 0;

  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    dragMoved = 0;
    lastX = e.clientX;
    lastY = e.clientY;
  });

  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    dragMoved += Math.abs(dx) + Math.abs(dy);
    orbit.desiredTheta -= dx * 0.005;
    orbit.desiredPhi -= dy * 0.005;
    orbit.desiredPhi = Math.max(0.05, Math.min(Math.PI - 0.05, orbit.desiredPhi));
  });

  window.addEventListener("pointerup", () => {
    dragging = false;
  });

  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    orbit.desiredRadius *= 1 + e.deltaY * 0.001;
    orbit.desiredRadius = Math.max(12, Math.min(700, orbit.desiredRadius));
  }, { passive: false });

  function applyOrbit() {
    orbit.theta += (orbit.desiredTheta - orbit.theta) * 0.08;
    orbit.phi += (orbit.desiredPhi - orbit.phi) * 0.08;
    orbit.radius += (orbit.desiredRadius - orbit.radius) * 0.08;
    orbit.target.lerp(orbit.desiredTarget, 0.08);
    const sp = new THREE.Spherical(orbit.radius, orbit.phi, orbit.theta);
    camera.position.setFromSpherical(sp).add(orbit.target);
    camera.lookAt(orbit.target);
  }

  /* ---------- Navigation & panneau d'info ---------- */

  const planetNav = document.getElementById("planet-buttons");
  const infoPanel = document.getElementById("info-panel");
  let focused = null;

  PLANETS.forEach((data, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "planet-btn";
    const dot = document.createElement("span");
    dot.className = "planet-dot";
    const hex = `#${data.color.toString(16).padStart(6, "0")}`;
    dot.style.background = hex;
    dot.style.color = hex;
    const label = document.createElement("span");
    label.textContent = data.name;
    btn.append(dot, label);
    btn.addEventListener("click", () => focusPlanet(planetObjects[index]));
    planetNav.appendChild(btn);
  });

  function setInfo(id, value) {
    document.getElementById(id).textContent = value;
  }

  function focusPlanet(obj) {
    focused = obj;
    document.querySelectorAll(".planet-btn").forEach((b, i) => {
      b.classList.toggle("active", planetObjects[i] === obj);
    });
    const d = obj.data;
    setInfo("info-name", d.name.toUpperCase());
    const typeEl = document.getElementById("info-type");
    typeEl.textContent = d.type;
    typeEl.className = `info-type ${d.typeClass}`;
    setInfo("info-diameter", d.diameter);
    setInfo("info-mass", d.mass);
    setInfo("info-distance", d.distance);
    setInfo("info-period", d.period);
    setInfo("info-temp", d.temp);
    setInfo("info-gravity", d.gravity);
    setInfo("info-atmo", d.atmo);
    setInfo("info-moons", d.moons);
    setInfo("info-discovered", d.discovered);
    setInfo("info-desc", d.desc);
    setInfo("info-fact", d.fact);
    infoPanel.classList.remove("hidden");
    orbit.desiredRadius = obj.data.radius * 5 + 6;
  }

  function resetView() {
    focused = null;
    orbit.desiredTarget.set(0, 0, 0);
    orbit.desiredRadius = 285;
    document.querySelectorAll(".planet-btn").forEach((b) => b.classList.remove("active"));
    infoPanel.classList.add("hidden");
  }

  document.getElementById("btn-reset").addEventListener("click", resetView);
  document.getElementById("info-close").addEventListener("click", resetView);

  /* ---------- Contrôles ---------- */

  let paused = false;
  let speedMultiplier = 1;

  document.getElementById("btn-pause").addEventListener("click", (e) => {
    paused = !paused;
    e.target.textContent = paused ? "▶ REPRENDRE" : "⏸ PAUSE";
  });

  document.getElementById("speed").addEventListener("input", (e) => {
    speedMultiplier = Number(e.target.value);
  });

  document.getElementById("toggle-orbits").addEventListener("change", (e) => {
    orbitLines.forEach((line) => (line.visible = e.target.checked));
  });

  document.getElementById("toggle-labels").addEventListener("change", (e) => {
    labels.forEach((l) => (l.visible = e.target.checked));
    sunLabel.visible = e.target.checked;
  });

  /* ---------- Sélection au clic ---------- */

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  canvas.addEventListener("pointerup", (event) => {
    if (dragMoved > 6) return;
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const meshes = planetObjects.map((p) => p.mesh);
    const hits = raycaster.intersectObjects(meshes, false);
    if (hits.length > 0) {
      const obj = planetObjects.find((p) => p.mesh === hits[0].object);
      if (obj) focusPlanet(obj);
    }
  });

  /* ---------- Intro ---------- */

  const intro = document.getElementById("intro");
  const bootLine = document.getElementById("boot-line");
  const introSkip = document.getElementById("intro-skip");
  const bootMessages = [
    "Initialisation du système STARCRUISER EMPIRE",
    "Chargement du noyau solaire... OK",
    "8 planètes détectées... OK",
    "Ceinture d'astéroïdes cartographiée... OK",
    "Bienvenue dans l'Empire Starcruiser",
  ];

  let bootIndex = 0;
  let introDone = false;
  let introFlight = null;

  function typeMessage() {
    if (bootIndex >= bootMessages.length) {
      bootLine.innerHTML = `<span class="prompt">></span> ${bootMessages[bootMessages.length - 1]}<span class="cursor">▌</span>`;
      introSkip.classList.remove("hidden");
      return;
    }
    const message = bootMessages[bootIndex];
    let charIndex = 0;
    const interval = setInterval(() => {
      charIndex += 1;
      bootLine.innerHTML = `<span class="prompt">></span> ${message.slice(0, charIndex)}<span class="cursor">▌</span>`;
      if (charIndex >= message.length) {
        clearInterval(interval);
        bootIndex += 1;
        setTimeout(typeMessage, 450);
      }
    }, 32);
  }

  function startIntroFlight() {
    if (introDone) return;
    introDone = true;
    intro.classList.add("hidden");
    introFlight = {
      start: performance.now(),
      duration: 2600,
      fromRadius: orbit.desiredRadius,
      toRadius: 150,
    };
  }

  introSkip.addEventListener("click", (e) => {
    e.stopPropagation();
    startIntroFlight();
  });
  intro.addEventListener("click", startIntroFlight);

  /* ---------- Boucle d'animation ---------- */

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (!paused) {
      for (const p of planetObjects) {
        p.angle += delta * speedMultiplier * (0.35 / Math.pow(p.data.orbit / 20, 0.6)) * p.data.speed * 10;
        p.pivot.rotation.y = p.angle;
        p.mesh.rotation.y += delta * speedMultiplier * 0.4;
        if (p.data.cloudsMesh) p.data.cloudsMesh.rotation.y += delta * speedMultiplier * 0.55;
        for (const m of p.moons) m.pivot.rotation.y += delta * speedMultiplier * m.speed;
      }
      asteroidBelt.rotation.y += delta * speedMultiplier * 0.01;
      sun.rotation.y += delta * speedMultiplier * 0.05;
    }

    stars.rotation.y += delta * 0.004;

    if (focused) {
      const pos = new THREE.Vector3();
      focused.mesh.getWorldPosition(pos);
      orbit.desiredTarget.copy(pos);
    }

    if (introFlight) {
      const k = Math.min(1, (performance.now() - introFlight.start) / introFlight.duration);
      const eased = 1 - Math.pow(1 - k, 3);
      orbit.desiredRadius = introFlight.fromRadius + (introFlight.toRadius - introFlight.fromRadius) * eased;
      if (k >= 1) introFlight = null;
    }

    applyOrbit();
    renderer.render(scene, camera);
  }

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  typeMessage();
  animate();
})();

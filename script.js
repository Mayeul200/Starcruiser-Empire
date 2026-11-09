(() => {
  "use strict";

  const fatalError = document.getElementById("fatal-error");
  const fatalMessage = document.getElementById("fatal-message");

  function showFatal(message) {
    fatalMessage.textContent = message;
    fatalError.classList.remove("hidden");
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
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 9000);
  camera.position.set(0, 95, 300);

  scene.add(new THREE.AmbientLight(0x334466, 1.1));
  const sunLight = new THREE.PointLight(0xfff3d6, 4.5, 0, 0);
  scene.add(sunLight);

  /* ============================================================
     ÉCHELLE — données réelles NASA, compression lisible :
     - distance scène = 30 × (UA)^0,55   (Terre 1 UA = 30, Neptune 195)
     - rayon scène    = 2,2 × √(r_km / 6371)
     - Soleil = 8 (compressé)
     - orbites ELLIPTIQUES : vraies excentricités + périhélie
     ============================================================ */

  const SUN_RADIUS = 8;
  const EARTH_R_KM = 6371;
  const INC_EXAGGERATION = 3;

  function orbitFromAU(au) {
    return 30 * Math.pow(au, 0.55);
  }

  function radiusFromKm(rKm) {
    return 2.2 * Math.sqrt(rKm / EARTH_R_KM);
  }

  const TJ = "https://threejs.org/examples/textures/planets/";
  const JDS = (repo, branch, file) => `https://cdn.jsdelivr.net/gh/${repo}@${branch}/${file}`;
  const UW = (hash, file, width) =>
    width
      ? `https://upload.wikimedia.org/wikipedia/commons/thumb/${hash}/${file}/${width}px-${file}`
      : `https://upload.wikimedia.org/wikipedia/commons/${hash}/${file}`;
  const UW8K = {
    jupiter: ["5/5e", "Solarsystemscope_texture_8k_jupiter.jpg"],
    saturn: ["1/1e", "Solarsystemscope_texture_8k_saturn.jpg"],
    mars: ["7/70", "Solarsystemscope_texture_8k_mars.jpg"],
    earth_daymap: ["0/04", "Solarsystemscope_texture_8k_earth_daymap.jpg"],
    earth_nightmap: ["b/b3", "Solarsystemscope_texture_8k_earth_nightmap.jpg"],
  };
  const TEX8 = (n) => {
    const uw = UW8K[n] ? [UW(UW8K[n][0], UW8K[n][1])] : [];
    return [
      ...uw,
      JDS("Shriisoot/Planets-texture", "main", `8k_${n}.jpg`),
      JDS("Shriisoot/Planets-texture", "master", `8k_${n}.jpg`),
    ];
  };
  const TEX2 = (f) => [
    JDS("Shrey1803/Solar-system", "main", `textures/${f}`),
    JDS("Shrey1803/Solar-system", "master", `textures/${f}`),
    JDS("ongyishen/SolarSystem", "main", `textures/${f}`),
    JDS("ongyishen/SolarSystem", "master", `textures/${f}`),
  ];

  const PLANETS = [
    {
      name: "Mercure", au: 0.387, rKm: 2439, tilt: 0.03, e: 0.2056, omega: 77, inc: 7.005, node: 48.331, periodDays: 88, flattening: 0.0001, color: 0x9c8e82,
      texUrls: [...TEX8("mercury"), ...TEX2("2k_mercury.jpg")],
      proc: { type: "craters", base: "#8a7f74", dark: "#5f564e", light: "#a39687" },
      type: "Tellurique", typeClass: "tellurique",
      diameter: "4 879 km", mass: "3,30 × 10²³ kg", distance: "57,9 M km (0,39 UA)",
      period: "88 jours", temp: "−173 à 427 °C", gravity: "3,7 m/s²",
      atmo: "Quasi nulle", moons: "0", discovered: "Antiquité",
      desc: "La planète la plus proche du Soleil et la plus petite du système solaire, criblée de cratères.",
      fact: "À retenir : un jour solaire sur Mercure dure 176 jours terrestres.",
    },
    {
      name: "Vénus", au: 0.723, rKm: 6052, tilt: 177.4, e: 0.0068, omega: 131, inc: 3.394, node: 76.680, periodDays: 224.7, flattening: 0.0001, color: 0xe8c98a, atmoGlow: 0xe8c98a,
      texUrls: [
        JDS("Shriisoot/Planets-texture", "main", "4k_venus_atmosphere.jpg"),
        JDS("Shriisoot/Planets-texture", "master", "4k_venus_atmosphere.jpg"),
        ...TEX2("2k_venus_surface.jpg"),
      ],
      proc: { type: "venus", base: "#d9b878", light: "#f0dcb0", dark: "#c9a45e" },
      type: "Tellurique", typeClass: "tellurique",
      diameter: "12 104 km", mass: "4,87 × 10²⁴ kg", distance: "108,2 M km (0,72 UA)",
      period: "225 jours", temp: "464 °C", gravity: "8,87 m/s²",
      atmo: "CO₂ très dense", moons: "0", discovered: "Antiquité",
      desc: "Enveloppée d'une épaisse atmosphère de CO₂, c'est la planète la plus chaude du système solaire.",
      fact: "À retenir : Vénus tourne à l'envers (rotation rétrograde) par rapport aux autres planètes.",
    },
    {
      name: "Terre", au: 1.0, rKm: 6371, tilt: 23.4, e: 0.0167, omega: 102, inc: 0.0, node: 0.0, periodDays: 365.25, flattening: 0.0034, color: 0x4d8fd1, clouds: true, atmoGlow: 0x5aa0ff,
      texUrls: [...TEX8("earth_daymap"), TJ + "earth_atmos_2048.jpg", ...TEX2("2k_earth_daymap.jpg")],
      cloudUrls: [TJ + "earth_clouds_1024.png"],
      nightUrls: [...TEX8("earth_nightmap"), TJ + "earth_lights_2048.png"],
      proc: { type: "earth", base: "#14508f", land: "#3f9e5a", desert: "#c2a86b", ice: "#eef4f8" },
      type: "Tellurique", typeClass: "tellurique",
      diameter: "12 756 km", mass: "5,97 × 10²⁴ kg", distance: "149,6 M km (1 UA)",
      period: "365,25 jours", temp: "15 °C", gravity: "9,81 m/s²",
      atmo: "Azote / Oxygène", moons: "1 (la Lune)", discovered: "—",
      desc: "Seule planète connue à abriter la vie, avec de l'eau liquide couvrant 71 % de sa surface.",
      fact: "À retenir : la Lune s'éloigne de la Terre de 3,8 cm chaque année.",
      moons3d: [{ name: "Lune", rKm: 1737, dist: 4.6, color: 0xbfbfbf, speed: 1.4, gSurface: 1.62, texUrls: [TJ + "moon_1024.jpg", ...TEX2("2k_moon.jpg")] }],
    },
    {
      name: "Mars", au: 1.524, rKm: 3390, tilt: 25.2, e: 0.0934, omega: 336, inc: 1.850, node: 49.558, periodDays: 687, flattening: 0.0059, color: 0xc1552f, atmoGlow: 0xd08a5a,
      texUrls: [...TEX8("mars"), ...TEX2("2k_mars.jpg")],
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
      name: "Jupiter", au: 5.203, rKm: 69911, tilt: 3.1, e: 0.0489, omega: 14, inc: 1.303, node: 100.464, periodDays: 4333, flattening: 0.0649, color: 0xd8b08c, atmoGlow: 0xd8b08c,
      thinRings: [
        { inner: 1.08, outer: 1.25, opacity: 0.06, color: 0xaa9988 },
        { inner: 1.30, outer: 1.50, opacity: 0.11, color: 0xb8a894 },
        { inner: 1.55, outer: 1.75, opacity: 0.07, color: 0xaa9988 },
        { inner: 1.85, outer: 2.03, opacity: 0.04, color: 0x9a8a78 },
      ],
      texUrls: [...TEX8("jupiter"), ...TEX2("2k_jupiter.jpg")],
      proc: { type: "jupiter" },
      type: "Géante gazeuse", typeClass: "gazeuse",
      diameter: "139 820 km", mass: "1,90 × 10²⁷ kg", distance: "778,5 M km (5,2 UA)",
      period: "11,9 ans", temp: "−110 °C", gravity: "24,79 m/s²",
      atmo: "Hydrogène / Hélium", moons: "95 connues", discovered: "Antiquité",
      desc: "La plus massive des planètes, célèbre pour sa Grande Tache rouge, une tempête géante.",
      fact: "À retenir : la Grande Tache rouge souffle depuis au moins 300 ans et pourrait engloutir la Terre.",
      moons3d: [
        { name: "Io", rKm: 1821, dist: 10.4, color: 0xe0c25a, speed: 1.8 },
        { name: "Europe", rKm: 1560, dist: 12.2, color: 0xdfe8ee, speed: 1.3 },
        { name: "Ganymède", rKm: 2634, dist: 14.6, color: 0xa89a8a, speed: 0.95 },
        { name: "Callisto", rKm: 2410, dist: 17.0, color: 0x5f5a54, speed: 0.7 },
      ],
    },
    {
      name: "Saturne", au: 9.537, rKm: 58232, tilt: 26.7, e: 0.0565, omega: 92, inc: 2.489, node: 113.666, periodDays: 10759, flattening: 0.0979, color: 0xe3cf9e, rings: true,
      thinRings: [{ inner: 2.32, outer: 2.37, opacity: 0.45, color: 0xe0d4b0 }],
      texUrls: [...TEX8("saturn"), ...TEX2("2k_saturn.jpg")],
      ringUrls: [UW("7/7d", "Solarsystemscope_texture_2k_saturn_ring_alpha.png")],
      proc: { type: "saturn" },
      type: "Géante gazeuse", typeClass: "gazeuse",
      diameter: "116 460 km", mass: "5,68 × 10²⁶ kg", distance: "1,43 Md km (9,5 UA)",
      period: "29,4 ans", temp: "−140 °C", gravity: "10,44 m/s²",
      atmo: "Hydrogène / Hélium", moons: "146 connues", discovered: "Antiquité",
      desc: "Célèbre pour ses anneaux de glace spectaculaires, visibles même avec une petite lunette.",
      fact: "À retenir : Saturne est si peu dense qu'elle flotterait sur l'eau.",
      moons3d: [{ name: "Titan", rKm: 2574, dist: 9.6, color: 0xe0a83c, speed: 0.8, atmoGlow: 0xe0a83c }],
    },
    {
      name: "Uranus", au: 19.19, rKm: 25362, tilt: 97.8, e: 0.0457, omega: 170, inc: 0.773, node: 74.006, periodDays: 30687, flattening: 0.0229, color: 0x9fe3e0,
      thinRings: [
        { inner: 1.08, outer: 1.13, opacity: 0.26, color: 0xaec8d8 },
        { inner: 1.16, outer: 1.20, opacity: 0.18, color: 0x9fb8c8 },
        { inner: 1.24, outer: 1.30, opacity: 0.22, color: 0xb8d0e0 },
        { inner: 1.33, outer: 1.40, opacity: 0.15, color: 0x9fb8c8 },
      ],
      texUrls: [
        JDS("Shriisoot/Planets-texture", "main", "2k_uranus.jpg"),
        JDS("Shriisoot/Planets-texture", "master", "2k_uranus.jpg"),
        ...TEX2("2k_uranus.jpg"),
      ],
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
      name: "Neptune", au: 30.07, rKm: 24622, tilt: 28.4, e: 0.0099, omega: 44, inc: 1.770, node: 131.784, periodDays: 60190, flattening: 0.0171, color: 0x4f6fd8, atmoGlow: 0x4f6fd8,
      thinRings: [
        { inner: 1.08, outer: 1.18, opacity: 0.12, color: 0x8fa8c8 },
        { inner: 1.24, outer: 1.32, opacity: 0.10, color: 0x8fa8c8 },
        { inner: 1.38, outer: 1.47, opacity: 0.18, color: 0xa8c0e0 },
      ],
      texUrls: [...TEX2("2k_neptune.jpg")],
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

  const G_SURF = { Mercure: 3.7, Vénus: 8.87, Terre: 9.81, Mars: 3.71, Jupiter: 24.79, Saturne: 10.44, Uranus: 8.87, Neptune: 11.15 };
  const ACCEL_SCALE = 8.2;
  const SUN_MU = 1.4;
  for (const p of PLANETS) {
    p.orbit = orbitFromAU(p.au);
    p.radius = radiusFromKm(p.rKm);
    p.b = p.orbit * Math.sqrt(1 - p.e * p.e);
    p.omegaRad = THREE.MathUtils.degToRad(p.omega);
    p.mu = ((G_SURF[p.name] || 5) / ACCEL_SCALE) * p.radius * p.radius;
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
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      onSuccess(tex);
    }, undefined, () => tryLoadTexture(urls.slice(1), onSuccess));
  }

  function applyColorSpace(tex) {
    if (THREE.SRGBColorSpace !== undefined) tex.colorSpace = THREE.SRGBColorSpace;
    else tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  /* ---------- Textures procédurales de secours (fidèles aux vraies planètes) ---------- */

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
      g.lineTo(w, y + bh + Math.sin(phase) * wave);
      g.lineTo(0, y + bh + Math.sin(phase) * wave);
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
    const w = 1024;
    const h = 512;
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
        g.globalAlpha = 0.3 + rng() * 0.3;
        drawSpot(g, rng() * 360 - 180, (rng() - 0.5) * 120, 14 + rng() * 30, 6 + rng() * 12, spec.dark, w, h);
      }
      g.globalAlpha = 0.8;
      drawSpot(g, -70, -45, 26, 14, "#5c2a12", w, h);
      g.globalAlpha = 0.6;
      drawSpot(g, 285, -12, 30, 4, "#4a2010", w, h);
      drawSpot(g, 250, 18, 10, 8, "#6b3016", w, h);
      g.globalAlpha = 1;
      g.fillStyle = spec.ice;
      g.fillRect(0, 0, w, h * 0.055);
      g.fillRect(0, h * 0.945, w, h * 0.055);
    } else if (spec.type === "jupiter") {
      const zoneColors = ["#efe3cb", "#e8d8b8", "#f2e9d8", "#e6d6b8"];
      const beltColors = ["#c9a176", "#b0855c", "#9a6f4b", "#8f6a4a", "#d9bd97", "#a87b5a"];
      let y = 0;
      let phase = rng() * 9;
      let isZone = rng() > 0.5;
      while (y < h) {
        const bh = 8 + rng() * 26;
        const colors = isZone ? zoneColors : beltColors;
        g.fillStyle = colors[Math.floor(rng() * colors.length)];
        g.globalAlpha = 0.6 + rng() * 0.4;
        g.beginPath();
        g.moveTo(0, y);
        for (let x = 0; x <= w; x += 12) {
          g.lineTo(x, y + Math.sin(x / 55 + phase) * 6 + Math.sin(x / 13 + phase * 2) * 2);
        }
        g.lineTo(w, y + bh);
        g.lineTo(0, y + bh);
        g.closePath();
        g.fill();
        for (let s = 0; s < 8; s++) {
          g.fillStyle = rng() > 0.5 ? "rgba(255,245,225,0.18)" : "rgba(90,60,40,0.16)";
          g.beginPath();
          g.ellipse(rng() * w, y + rng() * bh, 6 + rng() * 18, 1.5 + rng() * 3, 0, 0, Math.PI * 2);
          g.fill();
        }
        y += bh;
        phase += 1.3;
        if (rng() > 0.55) isZone = !isZone;
      }
      g.globalAlpha = 1;
      drawSpot(g, 190, -22, 34, 13, "#c1543a", w, h);
      drawSpot(g, 190, -22, 26, 9, "#d96a4a", w, h);
      drawSpot(g, 188, -21, 12, 4.5, "#e8805e", w, h);
      g.strokeStyle = "rgba(240,220,190,0.8)";
      g.lineWidth = 2.5;
      g.beginPath();
      g.ellipse(...lonLatToXY(190, -22, w, h), 36, 15, 0, 0, Math.PI * 2);
      g.stroke();
      for (let i = 0; i < 7; i++) {
        g.fillStyle = "rgba(255,252,244,0.55)";
        g.beginPath();
        g.ellipse(...lonLatToXY(rng() * 360 - 180, -38 + rng() * 28, w, h), 7 + rng() * 11, 2.5 + rng() * 3, 0, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = "rgba(140,150,170,0.22)";
      g.fillRect(0, 0, w, h * 0.06);
      g.fillRect(0, h * 0.94, w, h * 0.06);
    } else if (spec.type === "saturn") {
      const bands = ["#f0e5c2", "#e6d3a3", "#dcc896", "#efe0b5", "#d4c08a"];
      let y = 0;
      let phase = rng() * 9;
      while (y < h) {
        const bh = 14 + rng() * 30;
        g.fillStyle = bands[Math.floor(rng() * bands.length)];
        g.globalAlpha = 0.35 + rng() * 0.25;
        g.beginPath();
        g.moveTo(0, y);
        for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x / 80 + phase) * 3);
        g.lineTo(w, y + bh);
        g.lineTo(0, y + bh);
        g.closePath();
        g.fill();
        y += bh;
        phase += 2.1;
      }
      g.globalAlpha = 1;
      g.strokeStyle = "rgba(190,170,130,0.35)";
      g.lineWidth = 3;
      g.beginPath();
      const [hx, hy] = lonLatToXY(0, 90, w, h);
      for (let i = 0; i <= 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const px = hx + Math.cos(a) * 26;
        const py = Math.max(6, hy + Math.sin(a) * 9);
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.stroke();
    } else if (spec.type === "neptune") {
      g.fillStyle = spec.base;
      g.fillRect(0, 0, w, h);
      drawBands(g, w, h, spec.bands, rng, 4);
      drawSpot(g, 300, -20, 26, 12, spec.spot, w, h);
      g.strokeStyle = "rgba(255,255,255,0.7)";
      g.lineWidth = 2;
      g.beginPath();
      g.ellipse(...lonLatToXY(300, -20, w, h), 29, 14, 0, 0, Math.PI * 2);
      g.stroke();
      for (let i = 0; i < 6; i++) {
        g.fillStyle = "rgba(255,255,255,0.65)";
        g.beginPath();
        g.ellipse(...lonLatToXY(rng() * 360 - 180, -35 + rng() * 45, w, h), 16 + rng() * 14, 2.5, 0, 0, Math.PI * 2);
        g.fill();
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
      for (let i = 0; i < 18; i++) {
        g.strokeStyle = i % 2 ? spec.light : spec.dark;
        g.globalAlpha = 0.1 + rng() * 0.14;
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
      for (let i = 0; i < 600; i++) {
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
    const w = 1024;
    const h = 512;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d");
    const rng = makeRng(seed);
    g.clearRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) {
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
      if (t < 0.44) continue;
      let alpha;
      let color;
      if (t < 0.58) { alpha = 0.22; color = "#a89880"; }
      else if (t < 0.76) { alpha = 0.92; color = "#e6d9b4"; }
      else if (t < 0.795) { alpha = 0.05; color = "#d8c9a0"; }
      else if (t < 0.93) { alpha = 0.62; color = "#cfc2a0"; }
      else if (t < 0.945) { alpha = 0.12; color = "#c0b294"; }
      else if (t < 0.985) { alpha = 0.4; color = "#c9bb98"; }
      else { alpha = 0.08; color = "#b0a488"; }
      alpha *= 0.8 + rng() * 0.2;
      if (t > 0.96) alpha *= (1 - t) / 0.04;
      if (t < 0.47) alpha *= (t - 0.44) / 0.03;
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
    grad.addColorStop(0, "rgba(255, 240, 200, 1)");
    grad.addColorStop(0.3, "rgba(255, 200, 100, 0.55)");
    grad.addColorStop(0.65, "rgba(255, 150, 50, 0.16)");
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
    for (let i = 0; i < 1200; i++) {
      g.fillStyle = rng() > 0.5 ? "#ffedb8" : "#f08c1e";
      g.globalAlpha = 0.08 + rng() * 0.15;
      g.beginPath();
      g.arc(rng() * w, rng() * h, 2 + rng() * 9, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
    return applyColorSpace(new THREE.CanvasTexture(c));
  }

  function makeLabelTexture(text, colorHex) {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 64;
    const g = c.getContext("2d");
    g.font = "700 26px 'Space Grotesk', sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.shadowColor = colorHex;
    g.shadowBlur = 10;
    g.fillStyle = "#f1f5f9";
    g.fillText(text.toUpperCase(), 128, 32);
    return applyColorSpace(new THREE.CanvasTexture(c));
  }

  function makeLabel(text, scale, colorHex) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: makeLabelTexture(text, colorHex || "rgba(96,165,250,0.9)"), transparent: true, depthWrite: false })
    );
    sprite.scale.set(scale, scale / 4, 1);
    return sprite;
  }

  /* ---------- Soleil ---------- */

  const sunMat = new THREE.MeshBasicMaterial({ map: makeSunTexture() });
  const sun = new THREE.Mesh(new THREE.SphereGeometry(SUN_RADIUS, 48, 48), sunMat);
  scene.add(sun);
  tryLoadTexture([...TEX2("2k_sun.jpg")], (tex) => {
    sunMat.map = tex;
    sunMat.needsUpdate = true;
  });

  const sunGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: makeGlowTexture(), blending: THREE.AdditiveBlending, depthWrite: false })
  );
  sunGlow.scale.set(SUN_RADIUS * 4.6, SUN_RADIUS * 4.6, 1);
  scene.add(sunGlow);

  const corona = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: makeGlowTexture(), blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.35 })
  );
  corona.scale.set(SUN_RADIUS * 9, SUN_RADIUS * 9, 1);
  scene.add(corona);

  const sunLabel = makeLabel("Soleil", 9, "rgba(251,191,36,0.9)");
  sunLabel.position.set(0, SUN_RADIUS + 4, 0);
  scene.add(sunLabel);

  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vDir;
      void main() {
        vec3 dir = normalize(vDir);
        vec3 col = mix(vec3(0.008, 0.008, 0.032), vec3(0.058, 0.048, 0.115), dir.y * 0.5 + 0.5);
        vec3 bandN = normalize(vec3(0.35, 0.85, 0.30));
        float d = dot(dir, bandN);
        col += exp(-d * d * 6.0) * vec3(0.17, 0.19, 0.34);
        vec3 bandN2 = normalize(vec3(-0.50, 0.20, 0.84));
        float d2 = dot(dir, bandN2);
        col += exp(-d2 * d2 * 10.0) * vec3(0.11, 0.09, 0.21);
        vec3 bandN3 = normalize(vec3(0.80, -0.30, 0.52));
        float d3 = dot(dir, bandN3);
        col += exp(-d3 * d3 * 8.0) * vec3(0.13, 0.07, 0.05);
        col += exp(-abs(dir.y) * 3.0) * vec3(0.030, 0.026, 0.070);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const skySphere = new THREE.Mesh(new THREE.SphereGeometry(2500, 32, 32), skyMat);
  scene.add(skySphere);

  tryLoadTexture([UW("8/85", "Solarsystemscope_texture_8k_stars_milky_way.jpg"), ...TEX2("2k_stars_milky_way.jpg")], (tex) => {
    tex.mapping = THREE.EquirectangularReflectionMapping;
    const texSphere = new THREE.Mesh(
      new THREE.SphereGeometry(2490, 48, 32),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, transparent: true, opacity: 0.5, depthWrite: false })
    );
    scene.add(texSphere);
  });

  /* ---------- Orbites elliptiques + ceinture d'astéroïdes ---------- */

  function makeOrbitEllipse(a, b, omega, parent) {
    const points = [];
    const cosW = Math.cos(omega);
    const sinW = Math.sin(omega);
    for (let i = 0; i <= 200; i++) {
      const t = (i / 200) * Math.PI * 2;
      const lx = a * Math.cos(t);
      const lz = -b * Math.sin(t);
      points.push(new THREE.Vector3(lx * cosW + lz * sinW, 0, -lx * sinW + lz * cosW));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x3b4a6b, transparent: true, opacity: 0.5 }));
    parent.add(line);
    return line;
  }

  function makeStarDotTexture() {
    const s = 64;
    const c = document.createElement("canvas");
    c.width = s;
    c.height = s;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.4, "rgba(255,255,255,0.8)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
    return new THREE.CanvasTexture(c);
  }

  const starDotTex = makeStarDotTexture();

  const beltLayers = [];

  function makeAsteroidBelt() {
    const group = new THREE.Group();
    const rng = makeRng(4242);
    const inner = orbitFromAU(2.1);
    const outer = orbitFromAU(3.3);
    const layers = [
      { count: 3200, size: 0.26, spread: 1.6, au: 2.2, tints: [0x8d8577, 0x9a917f, 0x7a7468, 0xa39a88] },
      { count: 1800, size: 0.4, spread: 2.4, au: 2.7, tints: [0x9a917f, 0x8d8577, 0x6f6a60, 0xb0a898] },
      { count: 800, size: 0.18, spread: 1.0, au: 3.1, tints: [0x6f6a60, 0x7a7468, 0x5d584f] },
    ];
    for (const layer of layers) {
      const positions = new Float32Array(layer.count * 3);
      const colors = new Float32Array(layer.count * 3);
      const c = new THREE.Color();
      for (let i = 0; i < layer.count; i++) {
        const a = rng() * Math.PI * 2;
        const r = inner + Math.pow(rng(), 0.8) * (outer - inner);
        positions.set([Math.cos(a) * r, (rng() - 0.5) * layer.spread, Math.sin(a) * r], i * 3);
        c.set(layer.tints[Math.floor(rng() * layer.tints.length)]);
        const b = 0.85 + rng() * 0.3;
        colors.set([c.r * b, c.g * b, c.b * b], i * 3);
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const points = new THREE.Points(
        geometry,
        new THREE.PointsMaterial({ map: starDotTex, size: layer.size * 3, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false })
      );
      const sub = new THREE.Group();
      sub.add(points);
      group.add(sub);
      beltLayers.push({ group: sub, speed: 0.9 / Math.pow(layer.au, 1.5) });
    }
    const rockGeo = new THREE.IcosahedronGeometry(1, 0);
    const rockMat = new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true });
    const rocks = new THREE.InstancedMesh(rockGeo, rockMat, 180);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const col = new THREE.Color();
    const rockTints = [0x8d8577, 0x9a917f, 0x6f6a60, 0xa39a88, 0x7a7468];
    for (let i = 0; i < 180; i++) {
      const a = rng() * Math.PI * 2;
      const r = inner + Math.pow(rng(), 0.8) * (outer - inner);
      const s = 0.06 + Math.pow(rng(), 2) * 0.275;
      e.set(rng() * 3, rng() * 3, rng() * 3);
      q.setFromEuler(e);
      m4.compose(
        new THREE.Vector3(Math.cos(a) * r, (rng() - 0.5) * 2.0, Math.sin(a) * r),
        q,
        new THREE.Vector3(s, s * (0.7 + rng() * 0.6), s)
      );
      rocks.setMatrixAt(i, m4);
      col.set(rockTints[Math.floor(rng() * rockTints.length)]);
      rocks.setColorAt(i, col);
    }
    rocks.instanceMatrix.needsUpdate = true;
    if (rocks.instanceColor) rocks.instanceColor.needsUpdate = true;
    const rockSub = new THREE.Group();
    rockSub.add(rocks);
    group.add(rockSub);
    beltLayers.push({ group: rockSub, speed: 0.9 / Math.pow(2.7, 1.5) });

    const bigAsteroids = [
      { au: 2.77, r: 0.30, color: 0x9a9188 },
      { au: 2.36, r: 0.24, color: 0xb0a898 },
      { au: 2.77, r: 0.21, color: 0x8a8378 },
      { au: 3.14, r: 0.20, color: 0x6f6a62 },
      { au: 2.5, r: 0.17, color: 0x7a7468 },
      { au: 2.95, r: 0.15, color: 0x9a9188 },
      { au: 2.2, r: 0.15, color: 0x6f6a60 },
      { au: 3.3, r: 0.14, color: 0x8a8378 },
      { au: 2.6, r: 0.18, color: 0xa39a88 },
      { au: 2.9, r: 0.16, color: 0x8a8378 },
      { au: 2.4, r: 0.14, color: 0x7a7468 },
      { au: 3.05, r: 0.19, color: 0x9a9188 },
      { au: 2.3, r: 0.13, color: 0x6f6a60 },
      { au: 2.8, r: 0.17, color: 0xb0a898 },
      { au: 3.2, r: 0.15, color: 0x8d8577 },
      { au: 2.55, r: 0.12, color: 0x7a7468 },
    ];
    for (const b of bigAsteroids) {
      const pivot = new THREE.Group();
      const mesh = new THREE.Mesh(
        new THREE.IcosahedronGeometry(b.r, 1),
        new THREE.MeshStandardMaterial({ color: b.color, roughness: 1, flatShading: true })
      );
      mesh.position.set(orbitFromAU(b.au), (rng() - 0.5) * 1.5, 0);
      mesh.rotation.set(rng() * 3, rng() * 3, rng() * 3);
      pivot.add(mesh);
      pivot.rotation.y = rng() * Math.PI * 2;
      group.add(pivot);
      beltLayers.push({ group: pivot, speed: 0.9 / Math.pow(b.au, 1.5), spin: mesh });
    }
    scene.add(group);
    return group;
  }

  const asteroidBelt = makeAsteroidBelt();

  /* ---------- Planètes ---------- */

  const orbitLines = [];
  const labels = [];
  const planetObjects = [];

  function fresnelMaterial(colorHex, power, intensity) {
    return new THREE.ShaderMaterial({
      uniforms: {
        c: { value: new THREE.Color(colorHex) },
        p: { value: power },
        i: { value: intensity },
      },
      vertexShader: `
        varying vec3 vN;
        void main() {
          vN = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 c;
        uniform float p;
        uniform float i;
        varying vec3 vN;
        void main() {
          float f = pow(clamp(0.72 - dot(vN, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), p);
          gl_FragColor = vec4(c, 1.0) * f * i;
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
  }

  function makeAtmosphere(radius, colorHex, atmoColor, strength) {
    const group = new THREE.Group();
    const shellOuter = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.1, 40, 40),
      fresnelMaterial(atmoColor, 3.2, 0.9 * strength)
    );
    const shellInner = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.045, 40, 40),
      fresnelMaterial(0xffffff, 5.0, 0.3 * strength)
    );
    const halo1 = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: sharedGlowTex, color: colorHex, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.22, depthWrite: false })
    );
    halo1.scale.set(radius * 2.3, radius * 2.3, 1);
    const halo2 = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: sharedGlowTex, color: atmoColor, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.1, depthWrite: false })
    );
    halo2.scale.set(radius * 3.1, radius * 3.1, 1);
    group.add(shellOuter, shellInner, halo1, halo2);
    return group;
  }

  const sharedGlowTex = makeGlowTexture();

  PLANETS.forEach((data, index) => {
    const orbitGroup = new THREE.Group();
    orbitGroup.rotation.order = "YXZ";
    orbitGroup.rotation.x = THREE.MathUtils.degToRad(data.inc * INC_EXAGGERATION);
    orbitGroup.rotation.y = THREE.MathUtils.degToRad(data.node);
    scene.add(orbitGroup);

    const orbitLine = makeOrbitEllipse(data.orbit, data.b, data.omegaRad, orbitGroup);
    orbitLines.push(orbitLine);

    const material = new THREE.MeshStandardMaterial({
      map: makeProcTexture(data.proc, 1000 + index * 77),
      roughness: 0.95,
      metalness: 0.02,
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(data.radius, 48, 48), material);
    mesh.scale.y = 1 - (data.flattening || 0);
    mesh.userData.planet = data;
    tryLoadTexture(data.texUrls, (tex) => {
      material.map = tex;
      material.needsUpdate = true;
    });

    if (data.nightUrls) {
      tryLoadTexture(data.nightUrls, (tex) => {
        material.emissiveMap = tex;
        material.emissive = new THREE.Color(0xffffff);
        material.emissiveIntensity = 0.55;
        material.needsUpdate = true;
      });
    }

    const tilt = new THREE.Group();
    tilt.rotation.z = THREE.MathUtils.degToRad(data.tilt);
    tilt.add(mesh);
    orbitGroup.add(tilt);

    const atmoStrength = data.atmoGlow ? 1 : 0.22;
    tilt.add(makeAtmosphere(data.radius, data.color, data.atmoGlow || data.color, atmoStrength));

    const hex = `#${data.color.toString(16).padStart(6, "0")}`;
    const label = makeLabel(data.name, Math.max(3.6, data.radius * 1.25), hex);
    orbitGroup.add(label);
    labels.push(label);

    if (data.rings) {
      const ringOuter = data.radius * 2.45;
      const ringGeo = new THREE.RingGeometry(data.radius * 0.5, ringOuter, 160, 1);
      const posAttr = ringGeo.attributes.position;
      const uvAttr = ringGeo.attributes.uv;
      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i);
        uvAttr.setXY(i, Math.sqrt(x * x + y * y) / ringOuter, 0.5);
      }
      const ring = new THREE.Mesh(
        ringGeo,
        new THREE.MeshBasicMaterial({ map: makeRingTexture(), side: THREE.DoubleSide, transparent: true, depthWrite: false })
      );
      ring.rotation.x = Math.PI / 2;
      tilt.add(ring);
      tryLoadTexture(data.ringUrls, (tex) => {
        ring.material.map = tex;
        ring.material.needsUpdate = true;
      });
    }

    (data.thinRings || []).forEach((spec) => {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(data.radius * spec.inner, data.radius * spec.outer, 96, 1),
        new THREE.MeshBasicMaterial({ color: spec.color, side: THREE.DoubleSide, transparent: true, opacity: spec.opacity, depthWrite: false })
      );
      ring.rotation.x = Math.PI / 2;
      tilt.add(ring);
      if (spec.arcs) {
        for (let k = 0; k < spec.arcs; k++) {
          const start = Math.random() * Math.PI * 2;
          const arc = new THREE.Mesh(
            new THREE.RingGeometry(data.radius * spec.inner, data.radius * spec.outer, 48, 1, start, 0.4 + Math.random() * 0.7),
            new THREE.MeshBasicMaterial({ color: spec.arcColor || 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: Math.min(0.6, spec.opacity * 3.2), depthWrite: false })
          );
          arc.rotation.x = Math.PI / 2;
          tilt.add(arc);
        }
      }
    });

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
      if (m.atmoGlow) moonMesh.add(makeAtmosphere(size, m.color, m.atmoGlow, 0.8));
      moons.push({ pivot: moonPivot, speed: m.speed, mesh: moonMesh, mu: m.gSurface ? (m.gSurface / ACCEL_SCALE) * size * size : 0.05 });
    });

    if (data.clouds) {
      const cloudMat = new THREE.MeshStandardMaterial({
        map: makeCloudTexture(555),
        transparent: true,
        depthWrite: false,
        roughness: 1,
      });
      const clouds = new THREE.Mesh(new THREE.SphereGeometry(data.radius * 1.03, 48, 48), cloudMat);
      tilt.add(clouds);
      tryLoadTexture(data.cloudUrls, (tex) => {
        cloudMat.map = tex;
        cloudMat.needsUpdate = true;
      });
      data.cloudsMesh = clouds;
    }

    planetObjects.push({ data, mesh, tilt, label, moons, angle: Math.random() * Math.PI * 2 });
  });

  function planetPosition(p, angle, out) {
    const lx = p.data.orbit * Math.cos(angle);
    const lz = -p.data.b * Math.sin(angle);
    const cosW = Math.cos(p.data.omegaRad);
    const sinW = Math.sin(p.data.omegaRad);
    out.set(lx * cosW + lz * sinW, 0, -lx * sinW + lz * cosW);
    return out;
  }

  /* ---------- Champ d'étoiles ---------- */

  function makeStars() {
    const palette = [0xffffff, 0xcfe0ff, 0x9db8ff, 0xffe9c4, 0xffc9a3];
    const mkLayer = (count, size, op) => {
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const c = new THREE.Color();
      for (let i = 0; i < count; i++) {
        const v = new THREE.Vector3(
          Math.random() * 2 - 1,
          Math.random() * 2 - 1,
          Math.random() * 2 - 1
        ).normalize().multiplyScalar(900 + Math.random() * 900);
        positions.set([v.x, v.y, v.z], i * 3);
        c.set(palette[Math.floor(Math.random() * palette.length)]);
        colors.set([c.r, c.g, c.b], i * 3);
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      return new THREE.Points(
        geometry,
        new THREE.PointsMaterial({ map: starDotTex, size, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: op, depthWrite: false })
      );
    };
    const group = new THREE.Group();
    group.add(mkLayer(5000, 1.4, 0.85));
    group.add(mkLayer(700, 2.4, 0.9));
    group.add(mkLayer(150, 3.4, 1.0));
    scene.add(group);
    return group;
  }

  function makeNebulaTexture(colorHex, seed) {
    const s = 256;
    const c = document.createElement("canvas");
    c.width = s;
    c.height = s;
    const g = c.getContext("2d");
    const rng = makeRng(seed);
    const col = new THREE.Color(colorHex);
    for (let i = 0; i < 60; i++) {
      const x = rng() * s;
      const y = rng() * s;
      const r = 20 + rng() * 70;
      const a = 0.04 + rng() * 0.1;
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, `rgba(${Math.floor(col.r * 255)},${Math.floor(col.g * 255)},${Math.floor(col.b * 255)},${a})`);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grad;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    g.globalCompositeOperation = "destination-in";
    const mask = g.createRadialGradient(s / 2, s / 2, s * 0.08, s / 2, s / 2, s / 2);
    mask.addColorStop(0, "rgba(255,255,255,1)");
    mask.addColorStop(0.65, "rgba(255,255,255,0.55)");
    mask.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = mask;
    g.fillRect(0, 0, s, s);
    g.globalCompositeOperation = "source-over";
    return new THREE.CanvasTexture(c);
  }

  function makeNebulae() {
    const group = new THREE.Group();
    const tints = [0x7c5cbf, 0x3b82f6, 0xd97706, 0x2dd4bf, 0xec4899, 0x6366f1, 0x8b5cf6];
    for (let i = 0; i < 14; i++) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: makeNebulaTexture(tints[i % tints.length], 9000 + i * 131),
          blending: THREE.AdditiveBlending,
          transparent: true,
          opacity: 0.09 + Math.random() * 0.08,
          depthWrite: false,
        })
      );
      const dir = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1)
        .normalize()
        .multiplyScalar(1000 + Math.random() * 600);
      sprite.position.copy(dir);
      const s = 300 + Math.random() * 450;
      sprite.scale.set(s, s, 1);
      group.add(sprite);
    }
    scene.add(group);
    return group;
  }

  const stars = makeStars();
  const nebulae = makeNebulae();

  /* ---------- Fusée 3D pilotable ---------- */

  function buildRocket() {
    const rocket = new THREE.Group();
    const hull = new THREE.MeshStandardMaterial({ color: 0xd7dde8, roughness: 0.4, metalness: 0.5 });
    const accent = new THREE.MeshStandardMaterial({ color: 0xe8622d, roughness: 0.5, metalness: 0.3 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x2b3442, roughness: 0.6, metalness: 0.6 });
    const glass = new THREE.MeshStandardMaterial({ color: 0x9be8ff, emissive: 0x1e6f8f, emissiveIntensity: 0.8, roughness: 0.15, metalness: 0.2 });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.55, 20), hull);
    body.rotation.x = Math.PI / 2;
    rocket.add(body);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.22, 20), accent);
    nose.rotation.x = Math.PI / 2;
    nose.position.z = 0.385;
    rocket.add(nose);

    const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), glass);
    cockpit.scale.set(0.8, 0.6, 1.4);
    cockpit.position.set(0, 0.05, 0.12);
    rocket.add(cockpit);

    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.012, 0.34), accent);
        wing.position.set(sx * 0.11, sy * 0.05, -0.05);
        wing.rotation.z = sx * sy * 0.6;
        wing.rotation.y = sx * 0.3;
        rocket.add(wing);

        const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.1, 12), dark);
        engine.rotation.x = Math.PI / 2;
        engine.position.set(sx * 0.17, sy * 0.1, -0.2);
        rocket.add(engine);

        const glow = new THREE.Mesh(
          new THREE.CircleGeometry(0.02, 12),
          new THREE.MeshBasicMaterial({ color: 0xff7a2a, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.9, depthWrite: false })
        );
        glow.position.set(sx * 0.17, sy * 0.1, -0.255);
        glow.rotation.y = Math.PI;
        rocket.add(glow);
      }
    }

    for (const sx of [-1, 1]) {
      const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.22, 8), dark);
      cannon.rotation.x = Math.PI / 2;
      cannon.position.set(sx * 0.17, 0.02, 0.3);
      rocket.add(cannon);
    }

    const gimbal = new THREE.Group();
    rocket.add(gimbal);

    const engineFlames = new THREE.Group();
    const flameMat = new THREE.MeshBasicMaterial({ color: 0x66ccff, blending: THREE.AdditiveBlending, transparent: true, opacity: 1, depthWrite: false });
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        const f = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.16, 10), flameMat);
        f.rotation.x = -Math.PI / 2;
        f.position.set(sx * 0.16, sy * 0.18, -0.6);
        f.visible = false;
        engineFlames.add(f);
      }
    }
    rocket.add(engineFlames);

    rocket.scale.setScalar(0.05);
    return { group: rocket, flame: engineFlames, gimbal };
  }

  const rocketBuilt = buildRocket();
  const rocket = rocketBuilt.group;
  const flame = rocketBuilt.flame;
  const gimbal = rocketBuilt.gimbal;

  if (THREE.GLTFLoader) {
    const gltfLoader = new THREE.GLTFLoader();
    const XWING_URLS = [
      "https://cdn.jsdelivr.net/gh/dev-durgaprasad/x-wing@main/source/textured_x-wing_low_poly.glb",
      "https://cdn.jsdelivr.net/gh/dev-durgaprasad/x-wing@master/source/textured_x-wing_low_poly.glb",
      "https://raw.githubusercontent.com/dev-durgaprasad/x-wing/main/source/textured_x-wing_low_poly.glb",
      "https://raw.githubusercontent.com/dev-durgaprasad/x-wing/master/source/textured_x-wing_low_poly.glb",
    ];
    const tryLoadXwing = (urls) => {
      if (!urls.length) return;
      gltfLoader.load(urls[0], (gltf) => {
        const model = gltf.scene;
        const box0 = new THREE.Box3().setFromObject(model);
        const size0 = box0.getSize(new THREE.Vector3());
        if (size0.y >= size0.x && size0.y >= size0.z) model.rotation.x = Math.PI / 2;
        else if (size0.x > size0.y && size0.x > size0.z) model.rotation.y = -Math.PI / 2;
        model.traverse((o) => {
          if (o.isMesh && o.material) {
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            for (const m of mats) {
              m.transparent = false;
              m.opacity = 1;
              m.depthWrite = true;
            }
          }
        });
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const len = Math.max(size.x, size.y, size.z) || 1;
        model.scale.setScalar(0.55 / len);
        const box2 = new THREE.Box3().setFromObject(model);
        const center = box2.getCenter(new THREE.Vector3());
        model.position.sub(center);
        const box3 = new THREE.Box3().setFromObject(model);
        model.position.z -= box3.max.z;
        const boxF = new THREE.Box3().setFromObject(model);
        const modelLen = boxF.max.z - boxF.min.z;
        model.traverse((o) => {
          if (!o.isMesh) return;
          const mb = new THREE.Box3().setFromObject(o);
          const sz = mb.getSize(new THREE.Vector3());
          if (mb.max.z < boxF.min.z + modelLen * 0.08) {
            o.visible = false;
            return;
          }
          const atBack = mb.max.z < boxF.min.z + modelLen * 0.65;
          const thinZ = sz.z < modelLen * 0.25;
          let purple = false;
          if (o.material) {
            const m = Array.isArray(o.material) ? o.material[0] : o.material;
            if (m.color) purple = m.color.b > 0.25 && m.color.b > m.color.r && m.color.b > m.color.g;
          }
          if (atBack && (thinZ || purple)) o.visible = false;
        });
        while (rocket.children.length) rocket.remove(rocket.children[0]);
        rocket.add(model);
        const fx = (boxF.max.x - boxF.min.x) * 0.15;
        const fy = (boxF.max.y - boxF.min.y) * 0.22;
        let fi = 0;
        for (const sxn of [-1, 1]) {
          for (const syn of [-1, 1]) {
            flame.children[fi++].position.set(sxn * fx, syn * fy, boxF.min.z - 0.1);
          }
        }
        rocket.add(flame);
        rocket.add(gimbal);
      }, undefined, () => tryLoadXwing(urls.slice(1)));
    };
    tryLoadXwing(XWING_URLS);
  }
  rocket.position.set(40, 4, 0);
  scene.add(rocket);

  const speedHud = document.getElementById("hud-speed");

  function collideSegment(center, min) {
    const seg = tmpV2.subVectors(rocket.position, tmpPrev);
    const segLen2 = seg.lengthSq();
    const toC = tmpUp.subVectors(center, tmpPrev);
    const t = segLen2 > 0 ? Math.max(0, Math.min(1, toC.dot(seg) / segLen2)) : 0;
    const closest = tmpV.copy(tmpPrev).addScaledVector(seg, t);
    const d = closest.distanceTo(center);
    if (d < min && d > 0.0001) {
      const n = closest.sub(center).normalize();
      rocket.position.copy(center).addScaledVector(n, min);
      const vn = rocketVel.dot(n);
      if (vn < 0) rocketVel.addScaledVector(n, -vn * 1.0);
      rocketVel.multiplyScalar(0.97);
      if (rocketVel.length() < 0.6) rocketVel.set(0, 0, 0);
    }
  }

  let rocketMode = false;
  const rocketVel = new THREE.Vector3();
  const keys = {};
  const qYaw = new THREE.Quaternion();
  const qPitch = new THREE.Quaternion();
  const qRoll = new THREE.Quaternion();
  const upAxis = new THREE.Vector3(0, 1, 0);
  const xAxis = new THREE.Vector3(1, 0, 0);
  const zAxis = new THREE.Vector3(0, 0, 1);
  const fwd = new THREE.Vector3();
  const tmpV = new THREE.Vector3();
  const tmpUp = new THREE.Vector3();
  const tmpV2 = new THREE.Vector3();
  const tmpPrev = new THREE.Vector3();
  const tmpC = new THREE.Vector3();
  const ORIGIN = new THREE.Vector3(0, 0, 0);
  const camSmooth = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();
  const qCamOffset = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
  const camLocal = new THREE.Vector3();
  const rocketCam = { radius: 1.0, dTheta: 0, dPhi: 0 };

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
  let rightDrag = false;
  let dragMoved = 0;
  let lastX = 0;
  let lastY = 0;

  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button === 2) rightDrag = true;
    dragging = true;
    dragMoved = 0;
    lastX = e.clientX;
    lastY = e.clientY;
  });

  canvas.addEventListener("mousedown", (e) => {
    if (e.button === 2) rightDrag = true;
  });

  window.addEventListener("mouseup", (e) => {
    if (e.button === 2) rightDrag = false;
  });

  document.addEventListener("mousemove", (e) => {
    if (!rocketMode || !rightDrag) return;
    rocketCam.dTheta -= e.movementX * 0.005;
    rocketCam.dPhi -= e.movementY * 0.005;
    rocketCam.dPhi = Math.max(-1.2, Math.min(1.2, rocketCam.dPhi));
  });

  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    dragMoved += Math.abs(dx) + Math.abs(dy);
    if (rocketMode && (dragging || rightDrag)) {
      rocketCam.dTheta -= dx * 0.005;
      rocketCam.dPhi -= dy * 0.005;
      rocketCam.dPhi = Math.max(-1.2, Math.min(1.2, rocketCam.dPhi));
    } else if (!rocketMode) {
      orbit.desiredTheta -= dx * 0.005;
      orbit.desiredPhi -= dy * 0.005;
      orbit.desiredPhi = Math.max(0.05, Math.min(Math.PI - 0.05, orbit.desiredPhi));
    }
  });

  window.addEventListener("pointerup", () => {
    dragging = false;
    rightDrag = false;
  });

  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (rocketMode) {
      rocketCam.radius *= 1 + e.deltaY * 0.001;
      rocketCam.radius = Math.max(0.4, Math.min(3, rocketCam.radius));
    } else if (!rocketMode) {
      orbit.desiredRadius *= 1 + e.deltaY * 0.001;
      orbit.desiredRadius = Math.max(12, Math.min(700, orbit.desiredRadius));
    }
  }, { passive: false });

  function applyOrbit() {
    const rate = rocketMode ? 1 : 0.08;
    let dTh = orbit.desiredTheta - orbit.theta;
    dTh = Math.atan2(Math.sin(dTh), Math.cos(dTh));
    orbit.theta += dTh * rate;
    orbit.phi += (orbit.desiredPhi - orbit.phi) * rate;
    orbit.radius += (orbit.desiredRadius - orbit.radius) * (rocketMode ? 0.15 : 0.08);
    orbit.target.lerp(orbit.desiredTarget, rocketMode ? 0.3 : 0.08);
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
    orbit.desiredRadius = obj.data.radius * 6 + 7;
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

  function toggleRocketMode() {
    rocketMode = !rocketMode;
    document.getElementById("btn-rocket").textContent = rocketMode ? "🛰 VUE LIBRE" : "🚀 PILOTER LA FUSÉE";
    if (rocketMode) {
      rocketCam.radius = 1.0;
      rocketCam.dTheta = 0;
      rocketCam.dPhi = 0;
      camera.near = 0.005;
      camera.updateProjectionMatrix();
      camSmooth.copy(camera.position);
      if (focused) resetView();
      try {
        const p = canvas.requestPointerLock();
        if (p && p.catch) p.catch(() => {});
      } catch (err) {}
    } else {
      camera.up.set(0, 1, 0);
      camera.near = 0.1;
      camera.updateProjectionMatrix();
      if (document.exitPointerLock) document.exitPointerLock();
      const off = tmpV.copy(camera.position).sub(orbit.target);
      const len = Math.max(0.001, off.length());
      orbit.radius = orbit.desiredRadius = Math.max(12, len);
      orbit.phi = orbit.desiredPhi = Math.acos(Math.max(-1, Math.min(1, off.y / len)));
      orbit.theta = orbit.desiredTheta = Math.atan2(off.x, off.z);
      if (!focused) {
        orbit.desiredTarget.set(0, 0, 0);
        orbit.desiredRadius = 285;
      }
    }
  }

  document.getElementById("btn-rocket").addEventListener("click", toggleRocketMode);

  window.addEventListener("keydown", (e) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "PageUp", "PageDown", "ControlLeft", "ControlRight"].includes(e.code)) e.preventDefault();
    keys[e.code] = true;
    if (e.code === "KeyR") toggleRocketMode();
  });

  window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
  });

  let mouseDX = 0;
  let mouseDY = 0;
  document.addEventListener("mousemove", (e) => {
    if (!rocketMode || document.pointerLockElement !== canvas) return;
    mouseDX += e.movementX;
    mouseDY += e.movementY;
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

  /* ---------- Boucle d'animation ---------- */

  const clock = new THREE.Clock();
  const tmpPos = new THREE.Vector3();

  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (!paused) {
      for (const p of planetObjects) {
        p.angle += delta * speedMultiplier * 0.9 * (365.25 / p.data.periodDays);
        planetPosition(p, p.angle, tmpPos);
        p.tilt.position.copy(tmpPos);
        p.label.position.set(tmpPos.x, p.data.radius + 2.4, tmpPos.z);
        p.mesh.rotation.y += delta * speedMultiplier * 0.4;
        if (p.data.cloudsMesh) p.data.cloudsMesh.rotation.y += delta * speedMultiplier * 0.55;
        for (const m of p.moons) m.pivot.rotation.y += delta * speedMultiplier * m.speed;
      }
      for (const l of beltLayers) {
        l.group.rotation.y += delta * speedMultiplier * l.speed;
        if (l.spin) l.spin.rotation.y += delta * speedMultiplier * 0.6;
      }
      sun.rotation.y += delta * speedMultiplier * 0.05;
    }

    stars.rotation.y += delta * 0.004;
    nebulae.rotation.y += delta * 0.002;

    if (focused && !rocketMode) {
      const pos = new THREE.Vector3();
      focused.mesh.getWorldPosition(pos);
      orbit.desiredTarget.copy(pos);
    }

    if (rocketMode) {
      if (keys.ArrowLeft) {
        qYaw.setFromAxisAngle(upAxis, 1.9 * delta);
        rocket.quaternion.multiply(qYaw);
      }
      if (keys.ArrowRight) {
        qYaw.setFromAxisAngle(upAxis, -1.9 * delta);
        rocket.quaternion.multiply(qYaw);
      }
      if (keys.ArrowUp) {
        qPitch.setFromAxisAngle(xAxis, -1.9 * delta);
        rocket.quaternion.multiply(qPitch);
      }
      if (keys.ArrowDown) {
        qPitch.setFromAxisAngle(xAxis, 1.9 * delta);
        rocket.quaternion.multiply(qPitch);
      }
      if (keys.KeyQ) {
        qRoll.setFromAxisAngle(zAxis, -2.2 * delta);
        rocket.quaternion.multiply(qRoll);
      }
      if (keys.KeyE) {
        qRoll.setFromAxisAngle(zAxis, 2.2 * delta);
        rocket.quaternion.multiply(qRoll);
      }
      const mYaw = -mouseDX * 0.0022;
      const mPitch = mouseDY * 0.0022;
      mouseDX = 0;
      mouseDY = 0;
      if (mYaw) {
        qYaw.setFromAxisAngle(upAxis, mYaw);
        rocket.quaternion.multiply(qYaw);
      }
      if (mPitch) {
        qPitch.setFromAxisAngle(xAxis, mPitch);
        rocket.quaternion.multiply(qPitch);
      }
      const gimbalZ = keys.ArrowLeft ? 0.3 : keys.ArrowRight ? -0.3 : Math.max(-0.3, Math.min(0.3, mYaw * 0.2));
      const gimbalX = keys.ArrowUp ? -0.3 : keys.ArrowDown ? 0.3 : Math.max(-0.3, Math.min(0.3, mPitch * 0.2));
      gimbal.rotation.z += (gimbalZ - gimbal.rotation.z) * Math.min(1, 8 * delta);
      gimbal.rotation.x += (gimbalX - gimbal.rotation.x) * Math.min(1, 8 * delta);
      fwd.set(0, 0, 1).applyQuaternion(rocket.quaternion);
      if (keys.KeyW) rocketVel.addScaledVector(fwd, 2.5 * delta);
      if (keys.KeyS) { rocketVel.addScaledVector(fwd, -2.5 * delta); if (rocketVel.length() < 0.15) rocketVel.set(0, 0, 0); }
      tmpV.set(0, 1, 0).applyQuaternion(rocket.quaternion);
      if (keys.Space) rocketVel.addScaledVector(tmpV, 2.5 * delta);
      if (keys.ControlLeft || keys.ControlRight) rocketVel.addScaledVector(tmpV, -2.5 * delta);
      if (keys.KeyA) {
        tmpV.set(1, 0, 0).applyQuaternion(rocket.quaternion);
        rocketVel.addScaledVector(tmpV, 2.5 * delta);
      }
      if (keys.KeyD) {
        tmpV.set(-1, 0, 0).applyQuaternion(rocket.quaternion);
        rocketVel.addScaledVector(tmpV, 2.5 * delta);
      }
      if (keys.KeyC) rocketVel.multiplyScalar(Math.max(0, 1 - 1.2 * delta));
      rocketVel.multiplyScalar(Math.max(0, 1 - 0.01 * delta));

      for (const p of planetObjects) {
        p.mesh.getWorldPosition(tmpV);
        const d2 = Math.max(0.01, rocket.position.distanceToSquared(tmpV));
        const d = Math.sqrt(d2);
        if (d > p.data.radius + 0.3) {
          tmpV2.subVectors(tmpV, rocket.position).normalize();
          rocketVel.addScaledVector(tmpV2, (p.data.mu / d2) * delta);
        }
        for (const m of p.moons) {
          m.mesh.getWorldPosition(tmpC);
          const md2 = Math.max(0.01, rocket.position.distanceToSquared(tmpC));
          const md = Math.sqrt(md2);
          if (md > 0.3) {
            tmpV2.subVectors(tmpC, rocket.position).normalize();
            rocketVel.addScaledVector(tmpV2, (m.mu / md2) * delta);
          }
        }
      }
      const dSun2 = Math.max(0.01, rocket.position.lengthSq());
      tmpV.copy(rocket.position).normalize();
      rocketVel.addScaledVector(tmpV, (-SUN_MU / dSun2) * delta);

      if (rocketVel.length() > 5) rocketVel.setLength(5);
      tmpPrev.copy(rocket.position);
      rocket.position.addScaledVector(rocketVel, delta);

      for (const p of planetObjects) {
        p.mesh.getWorldPosition(tmpC);
        collideSegment(tmpC, p.data.radius + 0.02);
      }
      collideSegment(ORIGIN, SUN_RADIUS + 0.04);

      for (const c of flame.children) {
        c.visible = !!keys.KeyW;
        if (c.visible) {
          const f = 0.8 + Math.random() * 0.5;
          c.scale.set(f, f, f);
        }
      }

      fwd.set(0, 0, 1).applyQuaternion(rocket.quaternion);
      tmpUp.set(0, 1, 0).applyQuaternion(rocket.quaternion);
      camera.up.set(0, 1, 0);
      const th = Math.PI + rocketCam.dTheta;
      const ph = Math.PI / 2 - 0.14 + rocketCam.dPhi;
      camLocal.set(
        rocketCam.radius * Math.sin(ph) * Math.sin(th),
        rocketCam.radius * Math.cos(ph),
        rocketCam.radius * Math.sin(ph) * Math.cos(th)
      );
      rocket.updateMatrixWorld();
      camera.position.copy(rocket.localToWorld(camLocal));
      camera.up.set(0, 1, 0);
      camera.quaternion.copy(rocket.quaternion).multiply(qCamOffset);
    }

    speedHud.textContent = `🚀 ${Math.round(rocketVel.length() * 120)} km/s`;

    if (!rocketMode) applyOrbit();
    renderer.render(scene, camera);
  }

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  animate();
})();

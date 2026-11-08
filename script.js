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

  const SUN_RADIUS = 6;

  const PLANETS = [
    {
      name: "Mercure", color: 0x9c8e82, orbit: 13, radius: 1.1, speed: 4.15,
      texture: { type: "rocky", base: "#8a7f74", spots: ["#6f655c", "#a39687", "#5d544d"] },
      diameter: "4 879 km", distance: "57,9 M km", period: "88 jours",
      desc: "La planète la plus proche du Soleil et la plus petite du système solaire.",
    },
    {
      name: "Vénus", color: 0xe8c98a, orbit: 17.5, radius: 2.1, speed: 1.62,
      texture: { type: "bands", base: "#d9b878", bands: ["#e8cf9a", "#c9a45e", "#f0dcb0"] },
      diameter: "12 104 km", distance: "108,2 M km", period: "225 jours",
      desc: "Enveloppée d'une épaisse atmosphère de CO₂, c'est la planète la plus chaude.",
    },
    {
      name: "Terre", color: 0x4d8fd1, orbit: 23, radius: 2.3, speed: 1.0,
      texture: { type: "earth", base: "#2f6fb8", land: "#3f9e5a", ice: "#eef4f8" },
      diameter: "12 756 km", distance: "149,6 M km", period: "365,25 jours",
      desc: "Seule planète connue à abriter la vie, avec de l'eau liquide en surface.",
    },
    {
      name: "Mars", color: 0xc1552f, orbit: 29, radius: 1.6, speed: 0.53,
      texture: { type: "rocky", base: "#b0512c", spots: ["#8f3d20", "#cf6a3d", "#7a341c"] },
      diameter: "6 779 km", distance: "227,9 M km", period: "687 jours",
      desc: "La planète rouge, connue pour ses volcans géants comme Olympus Mons.",
    },
    {
      name: "Jupiter", color: 0xd8b08c, orbit: 39, radius: 5.2, speed: 0.084,
      texture: { type: "bands", base: "#cfa87e", bands: ["#e6c9a3", "#b08a5e", "#e8b98f", "#a3764f"] },
      diameter: "139 820 km", distance: "778,5 M km", period: "11,9 ans",
      desc: "Géante gazeuse la plus massive, célèbre pour sa Grande Tache rouge.",
    },
    {
      name: "Saturne", color: 0xe3cf9e, orbit: 49, radius: 4.4, speed: 0.034, rings: true,
      texture: { type: "bands", base: "#dcc48f", bands: ["#efe0b5", "#cbb27f", "#e8d6a4"] },
      diameter: "116 460 km", distance: "1,43 Md km", period: "29,4 ans",
      desc: "Célèbre pour ses anneaux de glace spectaculaires.",
    },
    {
      name: "Uranus", color: 0x9fe3e0, orbit: 58, radius: 3.4, speed: 0.012,
      texture: { type: "bands", base: "#a5dedb", bands: ["#c2efec", "#8fd0cd", "#d6f5f2"] },
      diameter: "50 724 km", distance: "2,87 Md km", period: "84 ans",
      desc: "Géante de glace qui roule sur son orbite, axe incliné à 98°.",
    },
    {
      name: "Neptune", color: 0x4f6fd8, orbit: 67, radius: 3.3, speed: 0.006,
      texture: { type: "bands", base: "#4a68c9", bands: ["#6d8ade", "#3a56b0", "#8aa5ec"] },
      diameter: "49 244 km", distance: "4,50 Md km", period: "164,8 ans",
      desc: "La planète la plus éloignée, balayée par les vents les plus rapides du système.",
    },
  ];

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 70, 230);

  scene.add(new THREE.AmbientLight(0x334466, 1.2));
  const sunLight = new THREE.PointLight(0xfff3d6, 2.6, 0, 0);
  scene.add(sunLight);

  function makeRng(seed) {
    let s = seed;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  function makeTexture(spec, seed) {
    const w = 512;
    const h = 256;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d");
    const rng = makeRng(seed);

    g.fillStyle = spec.base;
    g.fillRect(0, 0, w, h);

    if (spec.type === "bands") {
      const bands = spec.bands;
      let y = 0;
      while (y < h) {
        const bh = 8 + rng() * 34;
        g.fillStyle = bands[Math.floor(rng() * bands.length)];
        g.globalAlpha = 0.5 + rng() * 0.5;
        g.fillRect(0, y, w, bh);
        y += bh;
      }
      g.globalAlpha = 1;
    } else if (spec.type === "rocky") {
      for (let i = 0; i < 260; i++) {
        const x = rng() * w;
        const y = rng() * h;
        const r = 2 + rng() * 16;
        g.fillStyle = spec.spots[Math.floor(rng() * spec.spots.length)];
        g.globalAlpha = 0.25 + rng() * 0.45;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;
    } else if (spec.type === "earth") {
      for (let i = 0; i < 40; i++) {
        const x = rng() * w;
        const y = h * 0.15 + rng() * h * 0.7;
        const r = 12 + rng() * 42;
        g.fillStyle = spec.land;
        g.globalAlpha = 0.75 + rng() * 0.25;
        g.beginPath();
        g.ellipse(x, y, r, r * (0.4 + rng() * 0.4), rng() * Math.PI, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = spec.ice;
      g.globalAlpha = 0.9;
      g.fillRect(0, 0, w, h * 0.09);
      g.fillRect(0, h * 0.91, w, h * 0.09);
      g.globalAlpha = 1;
    }

    const tex = new THREE.CanvasTexture(c);
    if (THREE.SRGBColorSpace !== undefined) tex.colorSpace = THREE.SRGBColorSpace;
    else tex.encoding = THREE.sRGBEncoding;
    return tex;
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

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(SUN_RADIUS, 48, 48),
    new THREE.MeshBasicMaterial({ color: 0xffd27a })
  );
  scene.add(sun);

  const sunGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: makeGlowTexture(), blending: THREE.AdditiveBlending, depthWrite: false })
  );
  sunGlow.scale.set(SUN_RADIUS * 6, SUN_RADIUS * 6, 1);
  scene.add(sunGlow);

  function makeOrbitLine(radius) {
    const points = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x3d4a6b, transparent: true, opacity: 0.7 }));
    scene.add(line);
    return line;
  }

  const orbitLines = [];
  const planetObjects = [];

  PLANETS.forEach((data, index) => {
    const orbitLine = makeOrbitLine(data.orbit);
    orbitLines.push(orbitLine);

    const material = new THREE.MeshStandardMaterial({
      map: makeTexture(data.texture, 1000 + index * 77),
      roughness: 0.9,
      metalness: 0.05,
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(data.radius, 40, 40), material);
    mesh.userData.planet = data;
    scene.add(mesh);

    const pivot = new THREE.Group();
    pivot.add(mesh);
    mesh.position.x = data.orbit;
    scene.add(pivot);

    if (data.rings) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(data.radius * 1.4, data.radius * 2.3, 64),
        new THREE.MeshBasicMaterial({ color: 0xd8c9a0, side: THREE.DoubleSide, transparent: true, opacity: 0.65 })
      );
      ring.rotation.x = Math.PI / 2;
      mesh.add(ring);
    }

    if (data.name === "Terre") {
      const moon = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 24, 24),
        new THREE.MeshStandardMaterial({ color: 0xbbbbbb, roughness: 1 })
      );
      const moonPivot = new THREE.Group();
      moonPivot.add(moon);
      moon.position.x = data.radius + 1.8;
      mesh.add(moonPivot);
      data.moonPivot = moonPivot;
    }

    planetObjects.push({ data, mesh, pivot, angle: Math.random() * Math.PI * 2 });
  });

  function makeStars() {
    const count = 2600;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const v = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      ).normalize().multiplyScalar(700 + Math.random() * 700);
      positions.set([v.x, v.y, v.z], i * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const points = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({ color: 0xcfe0ff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.85 })
    );
    scene.add(points);
    return points;
  }

  const stars = makeStars();

  /* ---------- Contrôles caméra maison (glisser / molette) ---------- */

  const orbit = {
    target: new THREE.Vector3(0, 0, 0),
    radius: 245,
    theta: 0,
    phi: 1.25,
    desiredTarget: new THREE.Vector3(0, 0, 0),
    desiredRadius: 245,
    desiredTheta: 0,
    desiredPhi: 1.25,
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
    orbit.desiredRadius = Math.max(10, Math.min(500, orbit.desiredRadius));
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

  function focusPlanet(obj) {
    focused = obj;
    document.querySelectorAll(".planet-btn").forEach((b, i) => {
      b.classList.toggle("active", planetObjects[i] === obj);
    });
    document.getElementById("info-name").textContent = obj.data.name.toUpperCase();
    document.getElementById("info-diameter").textContent = obj.data.diameter;
    document.getElementById("info-distance").textContent = obj.data.distance;
    document.getElementById("info-period").textContent = obj.data.period;
    document.getElementById("info-desc").textContent = obj.data.desc;
    infoPanel.classList.remove("hidden");
    orbit.desiredRadius = obj.data.radius * 6 + 6;
  }

  function resetView() {
    focused = null;
    orbit.desiredTarget.set(0, 0, 0);
    orbit.desiredRadius = 245;
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
    "Initialisation du système",
    "Chargement du noyau solaire... OK",
    "8 planètes détectées... OK",
    "Trajectoires verrouillées... OK",
    "Bienvenue dans le système PlanetX",
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
      toRadius: 120,
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
        if (p.data.moonPivot) p.data.moonPivot.rotation.y += delta * speedMultiplier * 1.4;
      }
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

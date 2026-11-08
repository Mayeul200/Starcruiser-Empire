(() => {
  "use strict";

  /* ---------- Champ d'étoiles ---------- */

  const canvas = document.getElementById("starfield");
  const ctx = canvas.getContext("2d");
  let stars = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const count = Math.min(220, Math.floor((canvas.width * canvas.height) / 9000));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.3,
      speed: Math.random() * 0.15 + 0.03,
      twinkle: Math.random() * Math.PI * 2,
    }));
  }

  function drawStars(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const star of stars) {
      const alpha = 0.4 + 0.6 * Math.abs(Math.sin(time / 1200 + star.twinkle));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#cfe9ff";
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
      star.y += star.speed;
      if (star.y > canvas.height) {
        star.y = -2;
        star.x = Math.random() * canvas.width;
      }
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(drawStars);
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  requestAnimationFrame(drawStars);

  /* ---------- Lecteur ---------- */

  const players = Array.from(document.querySelectorAll("[data-player]")).map((el) => ({
    nowPlaying: el.querySelector("[data-now-playing]"),
    bar: el.querySelector("[data-progress-bar]"),
    current: el.querySelector("[data-time-current]"),
    total: el.querySelector("[data-time-total]"),
    playBtn: el.querySelector("[data-play]"),
  }));

  const state = {
    duration: 0,
    elapsed: 0,
    playing: false,
    timer: null,
  };

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function render() {
    const progress = state.duration > 0 ? state.elapsed / state.duration : 0;
    for (const player of players) {
      player.bar.style.width = `${Math.min(100, progress * 100)}%`;
      player.current.textContent = formatTime(state.elapsed);
      player.total.textContent = formatTime(state.duration);
      player.playBtn.textContent = state.playing ? "⏸ PAUSE" : "▶ ÉCOUTER";
    }
  }

  function stopTimer() {
    if (state.timer !== null) {
      clearInterval(state.timer);
      state.timer = null;
    }
  }

  function play() {
    if (state.duration <= 0) return;
    if (state.elapsed >= state.duration) state.elapsed = 0;
    state.playing = true;
    stopTimer();
    state.timer = setInterval(() => {
      state.elapsed += 1;
      if (state.elapsed >= state.duration) {
        state.elapsed = state.duration;
        pause();
      }
      render();
    }, 1000);
    render();
  }

  function pause() {
    state.playing = false;
    stopTimer();
    render();
  }

  function selectTrack(button) {
    const name = button.querySelector(".track-name").textContent.trim();
    const duration = Number(button.dataset.duration) || 0;
    document.querySelectorAll(".track").forEach((t) => t.classList.remove("active"));
    button.classList.add("active");
    state.duration = duration;
    state.elapsed = 0;
    for (const player of players) {
      player.nowPlaying.textContent = name;
      player.playBtn.disabled = false;
    }
    play();
  }

  document.querySelectorAll("[data-tracklist] .track").forEach((button) => {
    button.addEventListener("click", () => selectTrack(button));
  });

  players.forEach((player) => {
    player.playBtn.addEventListener("click", () => {
      if (state.playing) {
        pause();
      } else {
        play();
      }
    });
  });

  render();
})();

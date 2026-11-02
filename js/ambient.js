// Valdora — ambiente (rodada 66): sombras de nuvens passando pelo mapa, partículas de vento de cada região
// (pólen, folhas, cinza, faíscas de lumita, vagalumes à noite, poeira nas masmorras) e uma vinheta suave nas bordas.
// Tudo em tela e sem alocar por quadro: as partículas vêm de um vetor fixo e as texturas são geradas uma vez.
window.ValdoraAmbient = (() => {
  "use strict";
  const CLOUD_PX = 128, CLOUD_SCALE = 18; // textura 128 px ampliada 18× = nuvens com ~2.300 px de período
  const MAX = 64; // rodada 105: a neve da Geleira pede mais partículas
  // partículas por região: cor(es), quantas, velocidade do vento (px/s), tamanho, jeito de mover
  const KINDS = {
    town: { cols: ["#fff6d0", "#f5e27a"], n: 14, wind: 14, size: 2, mode: "seed" },
    fields: { cols: ["#ffffff", "#f5e27a", "#eaf7c0"], n: 22, wind: 18, size: 2, mode: "seed" },
    east: { cols: ["#c86a2a", "#d9a03a", "#8fbf4a", "#a4482a"], n: 18, wind: 22, size: 3, mode: "leaf" },
    south: { cols: ["#3f6a30", "#6a5a2a", "#2e4a26"], n: 16, wind: 16, size: 3, mode: "leaf" },
    west: { cols: ["#9fe8ff", "#d6f6ff", "#7fc8ff"], n: 16, wind: 10, size: 2, mode: "spark" },
    ruins: { cols: ["#b8b0a8", "#8a837c", "#d8cfc4"], n: 22, wind: 12, size: 2, mode: "ash" },
    dungeon: { cols: ["#d8c8a8", "#a89878"], n: 18, wind: 3, size: 2, mode: "dust" },
    night: { cols: ["#d8ff7a", "#f5ff9a"], n: 16, wind: 0, size: 2, mode: "firefly" },
    // rodada 105: biomas novos — esporos violeta na Floresta Sombria, poeira de pedra nas Montanhas, areia no Deserto, neve caindo na Geleira
    darkwood: { cols: ["#c8a0ff", "#9f7aff", "#e0d0ff"], n: 20, wind: 4, size: 2, mode: "spark" },
    mountains: { cols: ["#c8c4bc", "#a8a49c", "#e8e4dc"], n: 22, wind: 26, size: 2, mode: "ash" },
    desert: { cols: ["#e8b878", "#d89a5a", "#f4d4a0"], n: 30, wind: 42, size: 2, mode: "dust" },
    snow: { cols: ["#ffffff", "#eef6ff", "#dbe8f8"], n: 60, wind: 8, size: 3, mode: "snow" },
  };
  // ruído periódico (repete a cada P células): a textura das nuvens emenda sem costura
  function hashP(x, y, P, s) { x = ((x % P) + P) % P; y = ((y % P) + P) % P; let h = (x * 374761393 + y * 668265263 + s * 2246822519) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function vnoise(x, y, P, s) {
    const ix = Math.floor(x), iy = Math.floor(y), tx = x - ix, ty = y - iy, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    const a = hashP(ix, iy, P, s), b = hashP(ix + 1, iy, P, s), c = hashP(ix, iy + 1, P, s), d = hashP(ix + 1, iy + 1, P, s);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  }
  // densidade da nuvem em (u, v) ∈ [0,1): 3 oitavas periódicas; usada pela textura e pelos testes
  function cloudAt(u, v) {
    const n = vnoise(u * 4, v * 4, 4, 1) * 0.55 + vnoise(u * 8, v * 8, 8, 2) * 0.3 + vnoise(u * 16, v * 16, 16, 3) * 0.15;
    const k = Math.min(1, Math.max(0, (n - 0.5) / 0.2));
    return k * k * (3 - 2 * k);
  }
  function create({ TILE, rand = Math.random }) {
    let cloud = null, vig = null, vigW = 0, vigH = 0;
    function cloudTex() {
      if (cloud) return cloud;
      cloud = document.createElement("canvas"); cloud.width = cloud.height = CLOUD_PX;
      const g = cloud.getContext("2d"), img = g.createImageData(CLOUD_PX, CLOUD_PX);
      for (let y = 0; y < CLOUD_PX; y++) for (let x = 0; x < CLOUD_PX; x++) {
        const i = (y * CLOUD_PX + x) * 4; img.data[i] = 14; img.data[i + 1] = 24; img.data[i + 2] = 44; img.data[i + 3] = Math.round(cloudAt(x / CLOUD_PX, y / CLOUD_PX) * 255);
      }
      g.putImageData(img, 0, 0); return cloud;
    }
    function vignette(w, h) {
      if (vig && vigW === w && vigH === h) return vig;
      vig = vig || document.createElement("canvas"); vig.width = vigW = w; vig.height = vigH = h;
      const g = vig.getContext("2d"), r = Math.hypot(w, h) / 2, grd = g.createRadialGradient(w / 2, h / 2, r * 0.45, w / 2, h / 2, r);
      grd.addColorStop(0, "rgba(6,8,16,0)"); grd.addColorStop(1, "rgba(6,8,16,0.42)");
      g.fillStyle = grd; g.fillRect(0, 0, w, h); return vig;
    }
    // partículas em coordenadas de mundo (px), recicladas quando saem da tela
    const P = Array.from({ length: MAX }, () => ({ on: false, x: 0, y: 0, vx: 0, vy: 0, ph: 0, c: "", s: 2, life: 0, t: 0 }));
    let kindKey = "fields";
    function spawn(p, K, cam, w, h, edge) {
      p.on = true; p.t = 0; p.life = 6 + rand() * 6; p.ph = rand() * 6.28; p.c = K.cols[Math.floor(rand() * K.cols.length)]; p.s = K.size + (rand() < 0.3 ? 1 : 0);
      p.x = cam.x + (edge && K.wind > 4 ? -10 - rand() * 40 : rand() * w); p.y = cam.y + rand() * h;
      p.vx = K.wind * (0.6 + rand() * 0.8); p.vy = K.mode === "snow" ? 18 + rand() * 18 : K.mode === "leaf" ? 6 + rand() * 10 : K.mode === "ash" ? -4 - rand() * 6 : K.mode === "spark" ? -8 - rand() * 8 : (rand() - 0.5) * 6;
    }
    // rodada 73: chuva passageira. A cada 6–10 min de jogo, 70–120 s de chuva fina (entra e sai em ~8 s); nunca nas masmorras.
    // Gotas em tela num vetor fixo (sem alocar), respingos curtos no chão e o céu um pouco mais fechado. Só enfeite (Math.random).
    const RAIN_N = 230, drops = Array.from({ length: RAIN_N }, () => ({ x: Math.random(), y: Math.random(), v: 0.8 + Math.random() * 0.5 }));
    const splash = Array.from({ length: 24 }, () => ({ x: 0, y: 0, t: 1 })); let splashI = 0;
    let rainK = 0, rainOn = false, rainT = 360 + Math.random() * 240, rainForce = null;
    const still = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    // rodada 75: poças nos pontos que o jogo passa (setPuddles): enchem com a chuva e secam em ~90 s depois dela
    let puddles = [], wet = 0;
    function updateRain(dt, indoor) {
      wet = Math.max(rainK, wet - dt / 90);
      if (rainForce == null && !indoor && (rainT -= dt) <= 0) { rainOn = !rainOn; rainT = rainOn ? 70 + Math.random() * 50 : 360 + Math.random() * 240; }
      const target = rainForce != null ? rainForce : rainOn && !indoor ? 1 : 0;
      rainK += Math.max(-dt / 8, Math.min(dt / 8, target - rainK));
      if (rainK <= 0.01) return;
      for (const d of drops) { d.y += dt * 1.6 * d.v; d.x -= dt * 0.18 * d.v; if (d.y > 1) { d.y -= 1; d.x = Math.random(); } if (d.x < 0) d.x += 1; }
      for (const sp of splash) sp.t += dt / 0.25;
      if (Math.random() < dt * 30 * rainK) { const sp = splash[splashI++ % splash.length]; sp.x = Math.random(); sp.y = 0.15 + Math.random() * 0.85; sp.t = 0; }
    }
    function drawRain(ctx, w, h) {
      if (rainK <= 0.01) return;
      ctx.fillStyle = `rgba(20,30,52,${(0.16 * rainK).toFixed(3)})`; ctx.fillRect(0, 0, w, h); // céu fechado
      ctx.strokeStyle = "#cfe0ff"; ctx.lineWidth = 1; ctx.globalAlpha = 0.5 * rainK; ctx.beginPath();
      const n = Math.round(RAIN_N * rainK * (still ? 0.4 : 1));
      for (let i = 0; i < n; i++) { const d = drops[i], x = Math.round(d.x * w), y = Math.round(d.y * h); ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 14); }
      ctx.stroke(); ctx.globalAlpha = 1;
      for (const sp of splash) if (sp.t >= 0 && sp.t < 1) { ctx.globalAlpha = (1 - sp.t) * 0.5 * rainK; ctx.beginPath(); ctx.ellipse(sp.x * w, sp.y * h, 2 + sp.t * 5, 1 + sp.t * 2, 0, 0, 6.29); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }
    function update(dt, cam, w, h, region, dark, indoor) {
      updateRain(dt, indoor);
      const key = indoor ? "dungeon" : dark > 0.3 ? "night" : KINDS[region] ? region : "fields";
      if (key !== kindKey) { kindKey = key; for (const p of P) p.on = false; }
      const K = KINDS[kindKey];
      let live = 0; for (const p of P) if (p.on) live++; // conta antes: o teto da região vale para o vetor inteiro
      for (let i = 0; i < MAX; i++) {
        const p = P[i];
        if (!p.on) { if (live < K.n && rand() < dt * 3) { spawn(p, K, cam, w, h, false); live++; } continue; }
        p.t += dt;
        const sway = Math.sin(p.t * (K.mode === "leaf" ? 2.2 : 1.3) + p.ph);
        if (K.mode === "firefly") { p.x += Math.cos(p.t * 0.7 + p.ph) * 14 * dt; p.y += Math.sin(p.t * 0.9 + p.ph * 2) * 10 * dt; }
        else { p.x += (p.vx + sway * 8) * dt; p.y += (p.vy + sway * (K.mode === "leaf" ? 14 : 5)) * dt; }
        if (p.t > p.life || p.x < cam.x - 60 || p.x > cam.x + w + 60 || p.y < cam.y - 60 || p.y > cam.y + h + 60) p.on = false;
      }
    }
    // over = false: nuvens e partículas comuns (por baixo da noite); over = true: só as que brilham (vagalumes, faíscas), por cima da noite
    function draw(ctx, cam, w, h, t, dark, indoor, over = false) {
      if (over && !indoor) drawRain(ctx, w, h); // chuva por cima da noite (gotas claras)
      if (over && !indoor && dark > 0.25 && wet > 0.02) { // rodada 77: à noite, poças perto de poste/fogueira refletem a luz quente
        ctx.globalCompositeOperation = "lighter";
        for (const p of puddles) if (p.lit > 0) {
          const x = p.x * TILE - cam.x, y = p.y * TILE - cam.y, rx = p.r * TILE * (0.6 + 0.4 * wet); if (x < -rx || y < -rx || x > w + rx || y > h + rx) continue;
          const k = 0.85 + 0.15 * Math.sin(t * 3 + p.x), a = 0.38 * p.lit * wet * k;
          ctx.fillStyle = `rgba(255,196,110,${a.toFixed(3)})`; ctx.beginPath(); ctx.ellipse(x, y, rx * 0.8, rx * 0.3, 0, 0, 6.29); ctx.fill();
          ctx.fillStyle = `rgba(255,236,190,${(a * 0.9).toFixed(3)})`; ctx.fillRect(Math.round(x - 1), Math.round(y - rx * 0.25), 2, Math.round(rx * 0.5)); // reflexo da chama, em pé
        }
        ctx.globalCompositeOperation = "source-over";
      }
      const day = Math.max(0, 1 - dark / 0.45);
      if (!over && !indoor && day > 0.02) { // sombras das nuvens: andam com o mundo e derivam com o vento
        const tex = cloudTex(), S = CLOUD_PX * CLOUD_SCALE;
        const ox = ((-(cam.x * 1) - t * 9) % S + S) % S - S, oy = ((-(cam.y * 1) - t * 4) % S + S) % S - S;
        const sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = true; ctx.globalAlpha = (0.2 + 0.12 * rainK) * day; // na chuva, nuvens mais fechadas
        for (let y = oy; y < h; y += S) for (let x = ox; x < w; x += S) ctx.drawImage(tex, Math.round(x), Math.round(y), S, S);
        ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = sm;
      }
      const K = KINDS[kindKey], glow = K.mode === "firefly" || K.mode === "spark";
      if (glow !== over) return;
      for (const p of P) {
        if (!p.on) continue;
        const fade = Math.min(1, p.t / 0.6, (p.life - p.t) / 0.8), x = Math.round(p.x - cam.x), y = Math.round(p.y - cam.y);
        if (K.mode === "firefly") { // pisca devagar, com halo
          const k = 0.5 + 0.5 * Math.sin(t * 2.4 + p.ph * 3); ctx.fillStyle = p.c;
          ctx.globalAlpha = fade * k * 0.16; ctx.fillRect(x - 5, y - 5, 11, 11); ctx.globalAlpha = fade * k * 0.32; ctx.fillRect(x - 3, y - 3, 7, 7);
          ctx.globalAlpha = fade * (0.45 + 0.55 * k); ctx.fillRect(x - 1, y - 1, 3, 3); continue;
        }
        ctx.globalAlpha = fade * (glow ? 0.5 + 0.5 * Math.sin(t * 5 + p.ph) : K.mode === "dust" ? 0.45 : 0.85);
        ctx.fillStyle = p.c;
        if (K.mode === "leaf") { const fl = Math.abs(Math.sin(p.t * 3 + p.ph)); ctx.fillRect(x, y, Math.max(1, Math.round(p.s * fl + 1)), p.s - 1); } // folha girando
        else ctx.fillRect(x, y, p.s, p.s);
      }
      ctx.globalAlpha = 1;
    }
    function drawGround(ctx, cam, w, h, t, indoor) { // poças no chão (por baixo dos personagens)
      if (indoor || wet < 0.02 || !puddles.length) return;
      for (const p of puddles) {
        const x = p.x * TILE - cam.x, y = p.y * TILE - cam.y, rx = p.r * TILE * (0.6 + 0.4 * wet), ry = rx * 0.42;
        if (x < -rx || y < -ry || x > w + rx || y > h + ry) continue;
        ctx.globalAlpha = 0.5 * wet; ctx.fillStyle = "#56789a"; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 6.29); ctx.fill();
        ctx.globalAlpha = 0.7 * wet; ctx.strokeStyle = "#dff0ff"; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x - rx * 0.2, y - ry * 0.3, rx * 0.5, ry * 0.35, 0, 3.4, 5.6); ctx.stroke(); // brilho
        if (rainK > 0.2) { const k = (t * 1.3 + p.x * 0.37) % 1; ctx.globalAlpha = (1 - k) * 0.5 * rainK; ctx.beginPath(); ctx.ellipse(x, y, rx * 0.25 + k * rx * 0.6, (rx * 0.25 + k * rx * 0.6) * 0.42, 0, 0, 6.29); ctx.stroke(); } // pingos
      }
      ctx.globalAlpha = 1;
    }
    function drawVignette(ctx, w, h, k = 1) { if (k <= 0 || w < 1 || h < 1) return; // rodada 111: painel escondido (tela 0×0) ctx.globalAlpha = k; ctx.drawImage(vignette(w, h), 0, 0); ctx.globalAlpha = 1; }
    const live = () => P.filter((p) => p.on).length;
    // setRain(k): força a chuva (0..1) ou devolve ao sorteio (null) — testes e medições
    return { update, draw, drawVignette, live, kind: () => kindKey, rain: () => rainK, setRain: (k) => { rainForce = k; }, drawGround, setPuddles: (list) => { puddles = list || []; }, wet: () => wet };
  }
  return { create, cloudAt, KINDS, MAX };
})();

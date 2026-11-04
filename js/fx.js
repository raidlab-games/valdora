// Efeitos visuais do Valdora: partículas (estilhaços, fagulhas) e textos flutuantes (dano, XP, avisos).
// Coordenadas em tiles; o desenho recebe o contexto do canvas e a câmera.
window.ValdoraFX = (() => {
  function create(TILE, rand = Math.random) {
    const particles = [], floaters = [], arcs = [];
    function burst(x, y, colors, n, speed = 3, up = 0.8) {
      for (let i = 0; i < n && particles.length < 500; i++) {
        const a = rand() * Math.PI * 2, v = (0.4 + rand()) * speed * TILE / 3;
        particles.push({ x: x * TILE, y: y * TILE, vx: Math.cos(a) * v, vy: Math.sin(a) * v - TILE * up, g: 9, t: 0, life: 0.35 + rand() * 0.4,
          c: colors[i % colors.length], s: 2 + Math.floor(rand() * 3) });
      }
    }
    function ember(x, y, colors = ["#ffb347", "#ffe08a"]) { // fagulha que sobe (fogueira, fornalha, notas do bardo)
      if (particles.length < 500) particles.push({ x: x * TILE + (rand() - 0.5) * 14, y: y * TILE, vx: (rand() - 0.5) * 12, vy: -30 - rand() * 30, g: -0.3,
        t: 0, life: 0.8 + rand() * 0.6, c: colors[rand() < 0.5 ? 0 : colors.length - 1], s: 2 });
    }
    function sparks(x, y, n = 8, colors = ["#fff6c0", "#ffd23a", "#ffffff"], speed = 5) { // riscos rápidos (impacto, faíscas de metal)
      for (let i = 0; i < n && particles.length < 500; i++) {
        const a = rand() * Math.PI * 2, v = (0.6 + rand()) * speed * TILE / 3;
        particles.push({ x: x * TILE, y: y * TILE, vx: Math.cos(a) * v, vy: Math.sin(a) * v - TILE * 0.6, g: 7, t: 0, life: 0.16 + rand() * 0.16, c: colors[i % colors.length], s: 2, streak: true });
      }
    }
    function wind(x, y, dx, dy, n = 2) { // rodada 139: ventinhos atrás do herói na Corrida (riscos brancos que ficam para trás)
      const L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
      for (let i = 0; i < n && particles.length < 500; i++) {
        const side = (rand() - 0.5) * 0.9, v = (2.2 + rand() * 1.4) * TILE;
        particles.push({ x: (x - ux * 0.35 - uy * side) * TILE, y: (y - uy * 0.35 + ux * side - rand() * 0.6) * TILE, vx: -ux * v, vy: -uy * v, g: 0, t: 0,
          life: 0.18 + rand() * 0.14, c: rand() < 0.5 ? "#ffffff" : "#cfeeff", s: 2, streak: true, len: 0.07 });
      }
    }
    function dust(x, y, n = 4) { // poeira nos pés (arrancar, virar)
      for (let i = 0; i < n && particles.length < 500; i++)
        particles.push({ x: x * TILE + (rand() - 0.5) * 12, y: y * TILE - rand() * 3, vx: (rand() - 0.5) * 40, vy: -8 - rand() * 14, g: -0.4,
          t: 0, life: 0.3 + rand() * 0.25, c: rand() < 0.5 ? "#cdb98f" : "#a8936a", s: 3 + (rand() * 2 | 0), soft: true });
    }
    // ícone voando em arco (peixe saindo da água, item indo para a mochila)
    const arc = (img, x0, y0, x1, y1, dur = 0.5, h = 1.2, size = 26) => { if (img) arcs.push({ img, x0, y0, x1, y1, dur, h, size, t: 0 }); };
    const clickFx = (x, y, c) => floaters.push({ ring: true, x, y, t: 0, life: 0.35, c });
    // rodada 66: onda de choque no chão (giro, golpe esmagador): anel duplo que abre rápido e afina
    const shock = (x, y, r, c, life = 0.42) => floaters.push({ ring: true, shock: r, x, y, t: 0, life, c });
    // rodada 67: marca no chão (golpe esmagador, tremor): mancha escura com rachaduras que some devagar; desenhada na camada do chão
    let markN = 0;
    const mark = (x, y, r = 0.8, life = 2.6) => { markN++; floaters.push({ ring: true, mark: r, x, y, t: 0, life, seed: markN }); };
    // números em pixel art (assets/ui/digits.png: 0-9, "!" e "−", 16x20, avanço de 13 px), tingidos por multiplicação e guardados por cor
    let digits = null; const tinted = new Map();
    const setDigits = (c) => { digits = c && c.width >= 192 ? c : null; tinted.clear(); };
    function digitSheet(col) {
      if (col === "#ffffff") return digits;
      let c = tinted.get(col); if (c) return c;
      c = document.createElement("canvas"); c.width = digits.width; c.height = digits.height; const g = c.getContext("2d");
      g.drawImage(digits, 0, 0); g.globalCompositeOperation = "multiply"; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height);
      g.globalCompositeOperation = "destination-in"; g.drawImage(digits, 0, 0); tinted.set(col, c); return c;
    }
    const GLYPH = (ch) => ch === "!" ? 10 : ch === "\u2212" ? 11 : ch.charCodeAt(0) - 48;
    function drawDigits(ctx, text, col, k) { // centrado em x = 0, base em y = 0
      const sh = digitSheet(col), w = (13 * (text.length - 1) + 16) * k, sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false;
      for (let i = 0; i < text.length; i++) { const gi = GLYPH(text[i]); if (gi >= 0 && gi < 12) ctx.drawImage(sh, gi * 16, 0, 16, 20, Math.round(-w / 2 + i * 13 * k), Math.round(-20 * k), Math.round(16 * k), Math.round(20 * k)); }
      ctx.imageSmoothingEnabled = sm;
    }
    // camada do chão: ondas de choque e marcas ficam por baixo dos personagens
    function drawGround(ctx, cam) {
      for (const f of floaters) {
        if (!f.shock && !f.mark) continue;
        const k = f.t / f.life, sx = f.x * TILE - cam.x, sy = f.y * TILE - cam.y;
        if (f.mark) {
          const a = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4, R = f.mark * TILE;
          ctx.globalAlpha = 0.34 * a; ctx.fillStyle = "#1e140a"; ctx.beginPath(); ctx.ellipse(sx, sy, R * 0.55, R * 0.26, 0, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 0.6 * a; ctx.strokeStyle = "#1a1008"; ctx.lineWidth = 2;
          for (let i = 0; i < 7; i++) { const ang = i / 7 * 6.283 + ((f.seed * 0.618 + i * 0.37) % 1) * 0.6, L = R * (0.55 + ((f.seed * 0.31 + i * 0.53) % 1) * 0.45);
            ctx.beginPath(); ctx.moveTo(sx + Math.cos(ang) * R * 0.2, sy + Math.sin(ang) * R * 0.1);
            ctx.lineTo(sx + Math.cos(ang + 0.15) * L * 0.6, sy + Math.sin(ang + 0.15) * L * 0.3); ctx.lineTo(sx + Math.cos(ang) * L, sy + Math.sin(ang) * L * 0.48); ctx.stroke(); }
          ctx.globalAlpha = 1; continue;
        }
        const e = 1 - (1 - k) * (1 - k) * (1 - k), R = f.shock * TILE; ctx.strokeStyle = f.c;
        for (const [rk, lw, a] of [[1, 7, 0.85], [0.72, 3, 0.5]]) { ctx.globalAlpha = (1 - k) * a; ctx.lineWidth = Math.max(1, lw * (1 - k)); ctx.beginPath(); ctx.ellipse(sx, sy, R * rk * (0.25 + 0.75 * e), R * rk * 0.5 * (0.25 + 0.75 * e), 0, 0, Math.PI * 2); ctx.stroke(); }
        ctx.globalAlpha = 1;
      }
    }
    // rodada 66: textos que nascem quase no mesmo lugar sobem em "faixas" (0,34 tile) em vez de se sobrepor
    // mesmo movimento (dois textos, dois números causados) basta 0,32 tile; movimentos diferentes se cruzam no caminho, então pedem 0,9
    const motion = (f) => f.num ? (f.num === "taken" ? 2 : 1) : 0;
    function laneY(x, y, mo = 0) {
      for (let k = 0; k < 6; k++) {
        let hit = false;
        for (const f of floaters) if (!f.ring && f.t < 0.5 && Math.abs(f.x - x) < 0.8 && Math.abs(f.y - y) < (motion(f) === mo ? 0.32 : 0.9)) { hit = true; break; }
        if (!hit) break; y -= 0.34;
      }
      return y;
    }
    function addFloat(x, y, text, c, life = 1.1, size = 13) {
      // o mesmo aviso repetido no mesmo lugar (3 goblins batendo no escudo) vira um só, com contador: "bloqueou ×3"
      for (const f of floaters) if (!f.num && !f.ring && f.base === text && f.t < 0.45 && Math.abs(f.x - x) < 0.9) {
        f.n = (f.n || 1) + 1; f.text = `${text} ×${f.n}`; f.t = Math.min(f.t, 0.06); return;
      }
      floaters.push({ x, y: laneY(x, y), text, base: text, c, t: 0, life, size });
    }
    // números de dano (rodada 66): estilo pelo tipo — causado (branco), crítico (dourado, maior, com "!" e estrela), recebido
    // (vermelho, com "−", cai um pouco) e sangramento (laranja, menor). Nascem grandes e assentam (pop), e saem para os lados alternados.
    let side = 1, splatN = 0;
    const SPLAT = { dealt: [21, 0.95, "#ffffff"], crit: [29, 1.15, "#ffd23a"], taken: [19, 0.95, "#ff5a4a"], dot: [15, 0.8, "#ffa06a"] };
    const splatKind = (c, crit) => crit ? "crit" : c === "#ff5a4a" ? "taken" : c === "#ff6b5a" ? "dot" : "dealt";
    function hitSplat(x, y, n, c, crit) {
      const kind = splatKind(c, crit), [size, life, col] = SPLAT[kind]; side = -side;
      const text = kind === "crit" ? n + "!" : kind === "taken" ? "−" + n : String(n);
      splatN++; // sem rand(): o aleatório do jogo (mundo fixo das medições) não muda por causa de um enfeite
      floaters.push({ x, y: laneY(x, y, kind === "taken" ? 2 : 1), text, c: col, t: 0, life, size, num: kind, vx: kind === "taken" ? -0.25 : side * (0.35 + (splatN * 0.618 % 1) * 0.35) });
    }
    // escala do "pop": nasce pequeno, passa do tamanho e assenta (0,2 s)
    const popScale = (t, peak) => t < 0.07 ? 0.45 + (peak - 0.45) * (t / 0.07) : t < 0.2 ? peak + (1 - peak) * ((t - 0.07) / 0.13) : 1;

    function update(dt) {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]; p.t += dt; if (p.t >= p.life) { particles.splice(i, 1); continue; }
        p.vy += TILE * p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      }
      for (let i = floaters.length - 1; i >= 0; i--) if ((floaters[i].t += dt) >= floaters[i].life) floaters.splice(i, 1);
      for (let i = arcs.length - 1; i >= 0; i--) if ((arcs[i].t += dt) >= arcs[i].dur) arcs.splice(i, 1);
    }
    function draw(ctx, cam) {
      for (const p of particles) {
        const k = p.t / p.life; ctx.globalAlpha = p.soft ? (1 - k) * 0.7 : 1 - k;
        if (p.streak) { ctx.strokeStyle = p.c; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.x - cam.x, p.y - cam.y); ctx.lineTo(p.x - cam.x - p.vx * (p.len || 0.03), p.y - cam.y - p.vy * (p.len || 0.03)); ctx.stroke(); continue; }
        const sz = p.soft ? p.s + k * 3 : p.s; ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x - cam.x - sz / 2), Math.round(p.y - cam.y - sz / 2), sz, sz);
      }
      ctx.globalAlpha = 1;
      for (const a of arcs) {
        const k = a.t / a.dur, e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        const x = (a.x0 + (a.x1 - a.x0) * e) * TILE - cam.x, y = (a.y0 + (a.y1 - a.y0) * e) * TILE - cam.y - Math.sin(Math.PI * k) * a.h * TILE;
        const sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = true;
        ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate((k - 0.5) * 1.2); ctx.drawImage(a.img, -a.size / 2, -a.size / 2, a.size, a.size); ctx.restore();
        ctx.imageSmoothingEnabled = sm;
      }
      ctx.textAlign = "center"; ctx.lineJoin = "round";
      for (const f of floaters) {
        const k = f.t / f.life, sx = f.x * TILE - cam.x, sy = f.y * TILE - cam.y;
        if (f.shock || f.mark) continue; // camada do chão (drawGround)
        if (f.ring) { ctx.strokeStyle = f.c; ctx.globalAlpha = 1 - k; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(sx, sy, 6 + k * 14, 3 + k * 7, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; continue; }
        ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
        if (f.num) { // número de dano: arco balístico curto + pop
          const t = f.t, crit = f.num === "crit", dx = f.vx * TILE * Math.min(t, 0.6) + (f.num === "taken" && t < 0.18 ? Math.sin(t * 90) * 3 : 0);
          const dy = f.num === "taken" ? -30 * t + 20 * t * t : -(crit ? 78 : 66) * t + 46 * t * t; // recebido: sobe devagar e treme no começo
          const s = popScale(t, crit ? 1.75 : f.num === "dot" ? 1.2 : 1.45);
          ctx.save(); ctx.translate(Math.round(sx + dx), Math.round(sy + dy)); ctx.scale(s, s);
          if (crit && t < 0.3) { // estrela de impacto atrás do crítico
            const a = 1 - t / 0.3, R = 26 + t * 40; ctx.fillStyle = `rgba(255,214,90,${(0.55 * a).toFixed(3)})`; ctx.beginPath();
            for (let i = 0; i < 16; i++) { const ang = i * Math.PI / 8 + 0.2, r = i % 2 ? R * 0.38 : R; ctx.lineTo(Math.cos(ang) * r, -f.size * 0.35 + Math.sin(ang) * r * 0.8); }
            ctx.closePath(); ctx.fill();
          }
          if (digits) drawDigits(ctx, f.text, f.c, f.size / 21); // rodada 67: fonte em pixel art
          else {
            ctx.font = `900 ${f.size}px Verdana, "Segoe UI", Tahoma, sans-serif`;
            ctx.lineWidth = 5; ctx.strokeStyle = "#140a06"; ctx.strokeText(f.text, 0, 0);
            ctx.fillStyle = f.num === "taken" ? "#5a0c08" : crit ? "#8a4a00" : "#3a2a26"; ctx.fillText(f.text, 0, 2); // sombra interna
            ctx.fillStyle = f.c; ctx.fillText(f.text, 0, 0);
          }
          ctx.restore(); continue;
        }
        const rise = -34 * (1 - (1 - k) * (1 - k)), s = popScale(f.t, 1.22); // sobe rápido e desacelera
        ctx.font = `${f.size >= 18 ? 24 : 12}px "Valdora Pixel", "Courier New", monospace`; // rodada 79: fonte em pixel art (12 ou 24 px)
        ctx.save(); ctx.translate(Math.round(sx), Math.round(sy + rise)); ctx.scale(s, s);
        ctx.lineWidth = 3; ctx.strokeStyle = "#000"; ctx.strokeText(f.text, 0, 0);
        ctx.fillStyle = f.c; ctx.fillText(f.text, 0, 0); ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
    const clear = () => { particles.length = 0; floaters.length = 0; arcs.length = 0; };
    return { particles, floaters, burst, ember, sparks, wind, dust, arc, clickFx, addFloat, hitSplat, splatKind, shock, mark, setDigits, drawGround, update, draw, clear };
  }
  return { create };
})();

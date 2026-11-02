// Chão do Valdora: desenha o mapa em blocos de 16x16 tiles guardados em cache (canvas),
// com transições suaves entre terrenos e pequenas decorações procedurais.
// A água fica de fora do cache (transparente) para poder ser animada por baixo.
window.ValdoraTerrain = (() => {
  // família de cada tipo de chão e prioridade: a família de prioridade maior "invade" a vizinha
  const FAMILY = (k) => k.startsWith("grass_night") ? "grass_night" : k.startsWith("grass_dark") ? "grass_dark" : k.startsWith("grass") ? "grass" : k.startsWith("dirt") ? "dirt"
    : k.startsWith("snow") ? "snow" : k.startsWith("rockg") ? "rockg" : k; // rodada 105: neve, chão de rocha e mata escura dos biomas novos
  // chão da toca: o claro (den_floor_2) avança sobre o escuro com borda pixelada, como a grama sobre a terra
  const PRIO = { void: -1, water: 0, sand: 1, sand_2: 1.5, path: 2, stone: 3, dirt: 4, rockg: 4.2, den_floor: 4, den_floor_2: 4.5, grass: 5, snow: 5.5, grass_dark: 6, grass_night: 6.5 };
  const CH = 16, VARIANTS = 4, BLOCK = 3; // tiles por bloco; variações de máscara; tamanho do "pixel" da borda

  const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2246822519) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

  // ruído suave (value noise com 2 oitavas): manchas orgânicas para lagos, praias e calçamento antigo
  const smooth = (t) => t * t * (3 - 2 * t);
  function noise1(x, y, scale, seed) {
    const fx = x / scale, fy = y / scale, ix = Math.floor(fx), iy = Math.floor(fy), tx = smooth(fx - ix), ty = smooth(fy - iy);
    const a = hash(ix, iy, seed), b = hash(ix + 1, iy, seed), c = hash(ix, iy + 1, seed), d = hash(ix + 1, iy + 1, seed);
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
  }
  const noise = (x, y, scale, seed = 0) => noise1(x, y, scale, seed) * 0.7 + noise1(x, y, scale / 2.3, seed + 99) * 0.3;

  function create({ map, W, H, TILE, spr, decal }) {
    const N = Math.ceil(TILE / BLOCK);
    // ---------- máscaras de borda (pixeladas, com contorno ondulado e franja pontilhada) ----------
    // dir: 0=N 1=L 2=S 3=O (bordas); 4=NE 5=SE 6=SO 7=NO (cantos externos)
    const masks = [];
    for (let dir = 0; dir < 8; dir++) {
      masks[dir] = [];
      for (let v = 0; v < VARIANTS; v++) {
        const c = document.createElement("canvas"); c.width = c.height = TILE;
        const g = c.getContext("2d"); g.fillStyle = "#fff";
        const p1 = hash(dir, v, 1) * 6.28, p2 = hash(dir, v, 2) * 6.28;
        const wave = (a) => 0.3 + Math.sin(Math.PI * a) * (0.1 * Math.sin(a * 6.28 + p1) + 0.06 * Math.sin(a * 12.57 + p2));
        for (let by = 0; by < N; by++) for (let bx = 0; bx < N; bx++) {
          const u = (bx + 0.5) / N, w = (by + 0.5) / N;
          let depth, lim;
          if (dir < 4) {
            const [along, d] = dir === 0 ? [u, w] : dir === 1 ? [w, 1 - u] : dir === 2 ? [u, 1 - w] : [w, u];
            depth = d; lim = wave(along);
          } else {
            const [cx, cy] = dir === 4 ? [1, 0] : dir === 5 ? [1, 1] : dir === 6 ? [0, 1] : [0, 0];
            depth = Math.hypot(u - cx, w - cy); lim = 0.32 + 0.07 * Math.sin(Math.atan2(w - cy, u - cx) * 4 + p1);
          }
          const a = depth < lim - 0.07 ? 1 : depth < lim ? ((bx + by) % 2 ? 0.85 : 0.35) : 0;
          if (a) { g.globalAlpha = a; g.fillRect(bx * BLOCK, by * BLOCK, BLOCK, BLOCK); }
        }
        masks[dir][v] = c;
      }
    }
    const tmp = document.createElement("canvas"); tmp.width = tmp.height = TILE; const tg = tmp.getContext("2d");
    const mk = document.createElement("canvas"); mk.width = mk.height = TILE; const mg = mk.getContext("2d");
    const blendCache = new Map();
    // textura da família g recortada pela união das máscaras; resultado em cache por combinação
    function blended(g, list) {
      const key = g + "|" + list.join(",");
      let c = blendCache.get(key); if (c) return c;
      mg.clearRect(0, 0, TILE, TILE);
      for (const m of list) { const [dir, v] = m.split(":").map(Number); mg.drawImage(masks[dir][v], 0, 0); }
      c = document.createElement("canvas"); c.width = c.height = TILE; const cg = c.getContext("2d");
      const tex = spr[g === "grass" ? "grass" : g]; if (tex) cg.drawImage(tex, 0, 0, TILE, TILE);
      cg.globalCompositeOperation = "destination-in"; cg.drawImage(mk, 0, 0);
      if (blendCache.size < 600) blendCache.set(key, c);
      return c;
    }
    // rodada 66: profundidade nas bordas. A grama "alta" projeta uma sombra curta (luz do noroeste) sobre terra, pedra e
    // areia; na beira da água, uma faixa escura e uma espuma clara contornam a margem antes da franja de areia/grama.
    const RAISED = { grass: 1, grass_dark: 1, den_floor_2: 1 };
    const F1 = "rgba(236,250,255,0.72)", F2 = "rgba(220,244,255,0.28)";
    const EDGE = { shadow: [[[3, 6], "rgba(12,22,8,0.40)"]], shore: [[[0, 9], "rgba(4,22,44,0.32)"], [[4, 6], "rgba(4,22,44,0.22)"],
      [[6, 0], F2], [[-6, 0], F2], [[0, 6], F2], [[0, -6], F2], [[3, 0], F1], [[-3, 0], F1], [[0, 3], F1], [[0, -3], F1]] };
    const edgeCache = new Map();
    function edgeFx(type, list) {
      const key = type + "|" + list.join(","); let c = edgeCache.get(key); if (c) return c;
      mg.clearRect(0, 0, TILE, TILE);
      for (const m of list) { const [dir, v] = m.split(":").map(Number); mg.drawImage(masks[dir][v], 0, 0); }
      c = document.createElement("canvas"); c.width = c.height = TILE; const cg = c.getContext("2d");
      for (const [[dx, dy], col] of EDGE[type]) { // cada camada: máscara deslocada e pintada numa cor (sem somar alfa entre camadas iguais)
        tg.clearRect(0, 0, TILE, TILE); tg.globalCompositeOperation = "source-over"; tg.drawImage(mk, dx, dy);
        tg.globalCompositeOperation = "source-in"; tg.fillStyle = col; tg.fillRect(0, 0, TILE, TILE); tg.globalCompositeOperation = "source-over";
        cg.drawImage(tmp, 0, 0);
      }
      if (edgeCache.size < 600) edgeCache.set(key, c);
      return c;
    }
    const famAt = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? null : FAMILY(map[y][x]);
    const ORTHO = [[0, -1], [1, 0], [0, 1], [-1, 0]], DIAG = [[1, -1, 0, 1], [1, 1, 1, 2], [-1, 1, 2, 3], [-1, -1, 3, 0]];

    function drawTransitions(g, x, y, ox, oy) {
      const f = famAt(x, y), p = PRIO[f];
      if (f === "water") return; // rodada 67: margem pelo campo suave (shoreTile)
      const byFam = {};
      ORTHO.forEach(([dx, dy], dir) => {
        const n = famAt(x + dx, y + dy); if (n && PRIO[n] > p && !(f === "stone" && GRASSY_F[n])) (byFam[n] = byFam[n] || []).push(dir + ":" + Math.floor(hash(x, y, dir) * VARIANTS));
      });
      DIAG.forEach(([dx, dy, a, b], i) => {
        const n = famAt(x + dx, y + dy); if (!n || PRIO[n] <= p || (f === "stone" && GRASSY_F[n])) return; // grama x pedra: campo suave (plazaTile)
        if (famAt(x + ORTHO[a][0], y + ORTHO[a][1]) === n || famAt(x + ORTHO[b][0], y + ORTHO[b][1]) === n) return; // já coberto pelas bordas
        (byFam[n] = byFam[n] || []).push((4 + i) + ":" + Math.floor(hash(x, y, 9 + i) * VARIANTS));
      });
      for (const n of Object.keys(byFam).sort((a, b) => PRIO[a] - PRIO[b])) {
        const list = byFam[n].sort();
        if (f === "water") g.drawImage(edgeFx("shore", list), ox, oy);
        else if (RAISED[n]) g.drawImage(edgeFx("shadow", list), ox, oy);
        g.drawImage(blended(n, list), ox, oy);
      }
    }

    // ---------- decorações procedurais (tufos, pedrinhas, flores, cogumelos, folhas) ----------
    function px(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }
    function drawDecal(g, kind, ox, oy, r) {
      const P = 2, bx = ox + 8 + Math.floor(r * 26), by = oy + 14 + Math.floor(hash(r * 999, 7) * 22);
      if (kind === "tuft" || kind === "tuft_dark" || kind === "tuft_dry") {
        const [a, b, sh] = kind === "tuft" ? ["#5fae3c", "#b4e67a", "#1f4a18"] : kind === "tuft_dark" ? ["#3f7a30", "#7fbf58", "#122d10"] : ["#8a7648", "#c9b07a", "#4a3e26"];
        px(g, bx - 1, by, 13, 2, sh); // sombra na base
        [[0, 4, -1], [3, 6, 0], [6, 7, 0], [9, 5, 1]].forEach(([dx, h, lean]) => { // folhas em leque
          for (let k = 0; k < h; k++) px(g, bx + dx + Math.round(lean * k / 3), by - k * P, P, P, k >= h - 2 ? b : a);
        });
      } else if (kind === "pebbles") {
        for (let i = 0; i < 3; i++) { const x = bx + i * 7 - (i % 2) * 3, y = by - (i % 2) * 5; px(g, x, y, 6, 4, "#7d7a74"); px(g, x + 1, y, 3, 2, "#b5b1a8"); px(g, x, y + 3, 6, 1, "#4e4b46"); }
      } else if (kind === "flowers") {
        const cols = ["#f5e27a", "#ffffff", "#e45b8f", "#9fc4ff"];
        for (let i = 0; i < 3; i++) { const x = bx + i * 6, y = by - (i % 2) * 6, c = cols[Math.floor(r * 40 + i) % cols.length];
          px(g, x + 1, y + 2, P / 2 + 1, 4, "#2f6b24"); px(g, x, y, 4, 3, c); px(g, x + 1, y + 1, 2, 1, "#c97a1a"); }
      } else if (kind === "mushroom") {
        px(g, bx + 2, by - 4, 3, 5, "#efe6d2"); px(g, bx - 1, by - 8, 9, 4, "#b5302a"); px(g, bx, by - 9, 7, 1, "#d8473d"); px(g, bx + 1, by - 7, 2, 1, "#fff"); px(g, bx + 5, by - 6, 1, 1, "#fff");
      } else if (kind === "snowdrift") { // rodada 105: montinho de neve com sombra azul
        px(g, bx - 2, by + 1, 16, 2, "#b8c8e0"); px(g, bx, by - 3, 12, 4, "#f4f8ff"); px(g, bx + 2, by - 5, 7, 2, "#ffffff"); px(g, bx + 8, by - 1, 4, 2, "#d4e2f2");
      } else if (kind === "snowtuft") { // pontas de capim saindo da neve
        [[0, 3], [3, 5], [6, 4], [9, 3]].forEach(([dx, h]) => { for (let k = 0; k < h; k++) px(g, bx + dx, by - k * P, P, P, k >= h - 1 ? "#c8b878" : "#8a7a48"); });
        px(g, bx - 1, by + 1, 13, 2, "#e6eef8");
      } else if (kind === "icecrack") { // rachadura de gelo
        for (let i = 0; i < 6; i++) px(g, bx + i * 3, by - ((i * 7) % 5), 3, 1, "#9ab8d8"); px(g, bx + 6, by - 4, 1, 5, "#9ab8d8");
      } else if (kind === "stones_red") { // pedrinhas avermelhadas do deserto
        for (let i = 0; i < 3; i++) { const x = bx + i * 7 - (i % 2) * 3, y = by - (i % 2) * 5; px(g, x, y, 6, 4, "#9a5a3a"); px(g, x + 1, y, 3, 2, "#d08a5a"); px(g, x, y + 3, 6, 1, "#5a2e1e"); }
      } else if (kind === "twigs") { // gravetos secos
        px(g, bx, by, 14, 2, "#6a4a2a"); px(g, bx + 4, by - 3, 2, 4, "#8a6a3a"); px(g, bx + 9, by - 2, 6, 1, "#7a5a32"); px(g, bx + 2, by + 2, 12, 1, "#3a2a1a");
      } else if (kind === "leaves") {
        for (let i = 0; i < 4; i++) px(g, bx + i * 6, by - ((i * 5) % 7), 3, 2, ["#c86a2a", "#a4482a", "#d9a03a"][i % 3]);
      }
    }

    // ---------- rodada 67: contornos orgânicos (margem dos lagos e borda da praça) ----------
    // Em vez da franja presa à borda do tile, cada bloco de 3 px consulta um campo suave (makeField): quinas viram curvas e as
    // retas ondulam. O centro de cada tile continua do mesmo lado, então caminho, pesca e nascimento não mudam.
    const WATER = makeField(W, H, (x, y) => map[y][x] === "water", 31);
    const GRASS = makeField(W, H, (x, y) => GRASSY_F[FAMILY(map[y][x])] === 1, 47);
    const wet = new Uint8Array(W * H), plaza = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const f = FAMILY(map[y][x]), st = f === "stone", gr = GRASSY_F[f] === 1;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const nf = FAMILY(map[ny][nx]);
        if (nf === "water") wet[y * W + x] = 1;
        if ((st && GRASSY_F[nf]) || (gr && nf === "stone")) plaza[y * W + x] = 1;
      }
    }
    const b16 = document.createElement("canvas"); b16.width = b16.height = N; const bg = b16.getContext("2d");
    const ov16 = document.createElement("canvas"); ov16.width = ov16.height = N; const og = ov16.getContext("2d");
    const mImg = bg.createImageData(N, N), oImg = og.createImageData(N, N);
    tg.imageSmoothingEnabled = false;
    function fillMasked(g, ox, oy, tex) { // textura recortada pela máscara de blocos (b16 ampliado 3x, sem suavizar)
      tg.globalCompositeOperation = "source-over"; tg.clearRect(0, 0, TILE, TILE); tg.drawImage(tex, 0, 0, TILE, TILE);
      tg.globalCompositeOperation = "destination-in"; tg.drawImage(b16, 0, 0, N, N, 0, 0, TILE, TILE); tg.globalCompositeOperation = "source-over";
      g.drawImage(tmp, ox, oy);
    }
    const put = (d, i, c) => { if (c) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = c[3]; } else d[i + 3] = 0; };
    const C_WETSAND = [70, 52, 24, 52], C_FOAM = [238, 251, 255, 210], C_FOAM2 = [220, 244, 255, 80], C_DEEP = [4, 22, 44, 46];
    const C_WAVE = [240, 252, 255, 150], C_SHADOW = [12, 22, 8, 105], C_RIM = [10, 30, 8, 60];
    function shoreTile(g, x, y, ox, oy, waves, wx, wy) {
      const water = map[y][x] === "water"; let land = null;
      if (water) for (let dy = -1; dy <= 1 && land !== "sand"; dy++) for (let dx = -1; dx <= 1; dx++) {
        const k2 = famAt(x + dx, y + dy) && map[y + dy][x + dx]; if (!k2 || k2 === "water") continue;
        if (k2 === "sand") { land = "sand"; break; } land = land || k2;
      }
      let any = false;
      for (let by = 0; by < N; by++) for (let bx = 0; bx < N; bx++) {
        const v = WATER.at(x + (bx + 0.5) / N, y + (by + 0.5) / N), inW = v >= 0.5, i = (by * N + bx) * 4;
        const m = water ? !inW : inW; mImg.data[i + 3] = m ? 255 : 0; any = any || m;
        put(oImg.data, i, !inW ? (v > 0.4 ? C_WETSAND : null) : v < 0.545 ? C_FOAM : v < 0.6 ? C_FOAM2 : v < 0.68 ? C_DEEP : null);
        if (waves) { const wi = ((wy + by) * waves.width + wx + bx) * 4; // ondas: duas faixas que acendem alternadas (draw)
          if (inW && v >= 0.6 && v < 0.645) put(waves.a, wi, C_WAVE); else if (inW && v >= 0.69 && v < 0.735) put(waves.b, wi, C_WAVE); }
      }
      if (any) {
        bg.putImageData(mImg, 0, 0);
        if (water) { if (land && spr[land]) fillMasked(g, ox, oy, spr[land]); }
        else { g.globalCompositeOperation = "destination-out"; g.drawImage(b16, 0, 0, N, N, ox, oy, TILE, TILE); g.globalCompositeOperation = "source-over"; }
      }
      og.putImageData(oImg, 0, 0); g.drawImage(ov16, 0, 0, N, N, ox, oy, TILE, TILE);
    }
    function plazaTile(g, x, y, ox, oy) { // grama x pedra: a grama avança em curvas e projeta sombra curta (luz do noroeste)
      const stone = FAMILY(map[y][x]) === "stone"; let other = "stone";
      if (stone) { other = null; for (let dy = -1; dy <= 1 && !other; dy++) for (let dx = -1; dx <= 1; dx++) { const k2 = famAt(x + dx, y + dy) && map[y + dy][x + dx]; if (k2 && GRASSY_F[FAMILY(k2)]) { other = k2; break; } } }
      if (!other || !spr[other]) return;
      let any = false;
      for (let by = 0; by < N; by++) for (let bx = 0; bx < N; bx++) {
        const fx = x + (bx + 0.5) / N, fy = y + (by + 0.5) / N, v = GRASS.at(fx, fy), gH = v >= 0.5, i = (by * N + bx) * 4;
        const m = stone ? gH : !gH; mImg.data[i + 3] = m ? 255 : 0; any = any || m;
        put(oImg.data, i, !gH ? (GRASS.at(fx - 0.06, fy - 0.13) >= 0.5 ? C_SHADOW : null) : v < 0.535 ? C_RIM : null);
      }
      if (any) { bg.putImageData(mImg, 0, 0); fillMasked(g, ox, oy, spr[other]); }
      og.putImageData(oImg, 0, 0); g.drawImage(ov16, 0, 0, N, N, ox, oy, TILE, TILE);
    }

    // ---------- blocos ----------
    const CW = Math.ceil(W / CH), CHH = Math.ceil(H / CH), cache = new Map();
    let stamp = 0;
    function renderChunk(cx, cy) {
      const c = document.createElement("canvas"); c.width = c.height = CH * TILE; const g = c.getContext("2d");
      g.imageSmoothingEnabled = false;
      let waves = null;
      for (let ty = 0; ty < CH && !waves; ty++) for (let tx = 0; tx < CH; tx++) { const x = cx * CH + tx, y = cy * CH + ty; if (x < W && y < H && wet[y * W + x]) { waves = { width: CH * N }; break; } }
      if (waves) { const wc = CH * N; waves.a = new Uint8ClampedArray(wc * wc * 4); waves.b = new Uint8ClampedArray(wc * wc * 4); }
      for (let ty = 0; ty < CH; ty++) for (let tx = 0; tx < CH; tx++) {
        const x = cx * CH + tx, y = cy * CH + ty; if (x >= W || y >= H) continue;
        const k = map[y][x], ox = tx * TILE, oy = ty * TILE;
        if (k !== "water" && spr[k]) g.drawImage(spr[k], ox, oy, TILE, TILE);
        drawTransitions(g, x, y, ox, oy);
        if (wet[y * W + x]) shoreTile(g, x, y, ox, oy, waves, tx * N, ty * N);
        if (plaza[y * W + x]) plazaTile(g, x, y, ox, oy);
        const d = decal && decal(x, y);
        if (d) { if (spr[d]) { const s = spr[d]; g.drawImage(s, ox + (TILE - s.width) / 2, oy + TILE - s.height); } else drawDecal(g, d, ox, oy, hash(x, y, 77)); }
      }
      // rodada 66: manchas grandes de cor (mais clara e quente / mais fria e escura) quebram a grama uniforme; "source-atop"
      // só pinta onde já há chão (a água animada fica por baixo, sem tinta). Amostra no centro de cada tile e amplia suavizado.
      const nc = tintChunk(cx, cy); g.save(); g.globalCompositeOperation = "source-atop"; g.imageSmoothingEnabled = true;
      g.drawImage(nc, 1, 1, CH, CH, 0, 0, CH * TILE, CH * TILE); g.restore();
      if (waves) { // ondas em canvas pequenos (1 px por bloco de 3 px), ampliados sem suavizar a cada quadro
        const mkW = (arr) => { const wc = waves.width, cv = document.createElement("canvas"); cv.width = cv.height = wc; cv.getContext("2d").putImageData(new ImageData(arr, wc, wc), 0, 0); return cv; };
        c.waves = [mkW(waves.a), mkW(waves.b)];
      }
      return c;
    }
    const tintC = document.createElement("canvas"); tintC.width = tintC.height = CH + 2;
    function tintChunk(cx, cy) {
      const tc = tintC.getContext("2d"), img = tc.createImageData(CH + 2, CH + 2);
      for (let py = 0; py < CH + 2; py++) for (let pxi = 0; pxi < CH + 2; pxi++) {
        const d = tintAt(cx * CH + pxi - 1, cy * CH + py - 1), i = (py * (CH + 2) + pxi) * 4;
        if (d > 0) { img.data[i] = 255; img.data[i + 1] = 236; img.data[i + 2] = 150; img.data[i + 3] = Math.round(d * 0.15 * 255); }
        else { img.data[i] = 0; img.data[i + 1] = 26; img.data[i + 2] = 40; img.data[i + 3] = Math.round(-d * 0.24 * 255); }
      }
      tc.putImageData(img, 0, 0); return tintC;
    }
    const chunkMs = []; // rodada 69: tempo de cada bloco desenhado pela primeira vez (medição de desempenho)
    let renders = 0, lastCam = null; // rodada 70: blocos novos neste quadro e posição anterior da câmera
    function getChunk(cx, cy) {
      const key = cy * CW + cx; let e = cache.get(key);
      if (!e) { renders++; const t0 = performance.now(); e = { c: renderChunk(cx, cy) }; cache.set(key, e); chunkMs.push({ cx, cy, ms: performance.now() - t0, waves: !!e.c.waves }); if (chunkMs.length > 64) chunkMs.shift(); }
      e.used = ++stamp;
      if (cache.size > 16) { // descarta o bloco usado há mais tempo
        let oldK = null, oldS = Infinity; for (const [k2, v] of cache) if (v.used < oldS) { oldS = v.used; oldK = k2; }
        cache.delete(oldK);
      }
      return e.c;
    }
    // desenha água animada e os blocos visíveis
    function draw(ctx, cam, vw, vh, t, waterKey, waterDraw) {
      const x0 = Math.max(0, Math.floor(cam.x / TILE)), y0 = Math.max(0, Math.floor(cam.y / TILE));
      const x1 = Math.min(W, Math.ceil((cam.x + vw) / TILE) + 1), y1 = Math.min(H, Math.ceil((cam.y + vh) / TILE) + 1);
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (wet[y * W + x]) { // água também por baixo da margem curva
        if (waterDraw && waterDraw(x, y, x * TILE - cam.x, y * TILE - cam.y, t)) continue;
        const img = spr[waterKey(x, y, t)]; if (img) ctx.drawImage(img, x * TILE - cam.x, y * TILE - cam.y, TILE, TILE);
      }
      const cx0 = Math.floor(x0 / CH), cy0 = Math.floor(y0 / CH), cx1 = Math.floor((x1 - 1) / CH), cy1 = Math.floor((y1 - 1) / CH);
      renders = 0;
      for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
        const c = getChunk(cx, cy), px0 = cx * CH * TILE - cam.x, py0 = cy * CH * TILE - cam.y;
        ctx.drawImage(c, px0, py0);
        if (c.waves) { // rodada 67: duas faixas de onda acendem uma depois da outra, como se chegassem à margem
          const sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false; const wc = c.waves[0].width;
          for (let i = 0; i < 2; i++) { const a = 0.5 + 0.5 * Math.sin(t * 1.7 - i * 1.9); if (a < 0.05) continue; ctx.globalAlpha = a * 0.75; ctx.drawImage(c.waves[i], 0, 0, wc, wc, px0, py0, CH * TILE, CH * TILE); }
          ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = sm;
        }
      }
      // rodada 70: num quadro sem bloco novo, desenha (sem mostrar) um bloco à frente da câmera, para a primeira vez dele não pesar
      // no quadro em que ele aparece. Só na direção do movimento (até 3 blocos), então o cache de 16 não troca os visíveis.
      const mx = lastCam ? cam.x - lastCam.x : 0, my = lastCam ? cam.y - lastCam.y : 0; lastCam = lastCam || {}; lastCam.x = cam.x; lastCam.y = cam.y;
      if (prewarmOn && !renders && (mx || my)) {
        const ahead = [];
        if (mx > 0) for (let cy = cy0; cy <= cy1; cy++) ahead.push([cx1 + 1, cy]); else if (mx < 0) for (let cy = cy0; cy <= cy1; cy++) ahead.push([cx0 - 1, cy]);
        if (my > 0) for (let cx = cx0; cx <= cx1; cx++) ahead.push([cx, cy1 + 1]); else if (my < 0) for (let cx = cx0; cx <= cx1; cx++) ahead.push([cx, cy0 - 1]);
        for (const [cx, cy] of ahead) if (cx >= 0 && cy >= 0 && cx < CW && cy < CHH && !cache.has(cy * CW + cx)) { getChunk(cx, cy); prewarmed++; break; }
      }
    }
    let prewarmed = 0, prewarmOn = true; // prewarmOn: só para medir com e sem (setPrewarm)
    return { draw, clear: () => cache.clear(), chunkMs, prewarmed: () => prewarmed, setPrewarm: (on) => { prewarmOn = !!on; }, cached: (cx, cy) => cache.has(cy * CW + cx), family: FAMILY, water: WATER, wet: (x, y) => wet[y * W + x] === 1 };
  }
  const GRASSY_F = { grass: 1, grass_dark: 1 };
  // rodada 67: campo suave de um conjunto de tiles (1 dentro, 0 fora), com ruído leve. Centro de tile dentro fica >= 0,51 e
  // centro fora <= 0,49, então o contorno arredonda quinas e ondula sem trocar nenhum tile de lado.
  function makeField(W, H, test, seed) {
    const F = new Float32Array(W * H), B = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) B[y * W + x] = test(x, y) ? 1 : 0;
    const b = (x, y) => B[Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) F[y * W + x] = 0.6 * b(x, y) + 0.1 * (b(x - 1, y) + b(x + 1, y) + b(x, y - 1) + b(x, y + 1));
    const f = (x, y) => F[Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))];
    function at(fx, fy) { // fx, fy em tiles (x + 0,5 = centro do tile x); interpolação suave entre centros: quinas viram curvas
      const u = fx - 0.5, v = fy - 0.5, i = Math.floor(u), j = Math.floor(v), a = u - i, c = v - j, s = a * a * (3 - 2 * a), q = c * c * (3 - 2 * c);
      const top = f(i, j) + (f(i + 1, j) - f(i, j)) * s, bot = f(i, j + 1) + (f(i + 1, j + 1) - f(i, j + 1)) * s;
      // ruído fraco no centro do tile (o lado de cada tile não muda) e forte perto da borda dele, onde o contorno passa
      const w = Math.max(Math.abs(fx - Math.floor(fx) - 0.5), Math.abs(fy - Math.floor(fy) - 0.5)) * 2;
      return top + (bot - top) * q + (noise1(fx, fy, 1.6, seed) - 0.5) * (0.18 + 0.62 * w * w);
    }
    return { at, inside: (x, y) => B[y * W + x] === 1 };
  }
  // −1 (sombra fria) … +1 (luz quente): ruído largo do tom do chão, contínuo entre blocos (rodada 66)
  function tintAt(x, y) { return Math.max(-1, Math.min(1, (noise(x, y, 8, 5) - 0.5) * 2.6)); }
  return { create, hash, noise, tintAt, makeField };
})();

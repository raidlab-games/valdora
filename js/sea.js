// Valdora — o mar (rodada 162): navegar, canhões, monstros do mar, cardumes de alto-mar e a luta da linha.
// - Barco: física com inércia (acelera e freia aos poucos), vento (de popa rende mais) e curva que depende da velocidade.
//   WASD/setas dão o rumo; clicar (ou segurar o botão) na água leva o barco até lá. Q dispara os canhões de bombordo
//   (esquerda), E os de estibordo (direita); Espaço ou clicar num monstro dispara o bordo que estiver virado para ele.
//   F atraca no cais (ou desce na praia, deixando o barco ancorado) e lança a linha perto de um cardume.
// - Pesca do mar: o peixe morde (a isca apressa) e começa a luta: Recolher (1), Puxão forte (2) e Dar linha (3). O fôlego do
//   peixe tem que zerar antes do tempo, sem a tensão da linha passar de 100. Cansado (azul), cada puxada rende o dobro; bravo
//   (vermelho), a linha estica sozinha e puxar estica em dobro: dê linha. Cada peixe sai com um peso; o diário guarda o recorde.
// - Monstros do mar nascem longe da costa em volta do barco (o nível cresce com a distância da terra e o mar do bioma);
//   cada mar tem o covil de um Polvo Abissal. O que cai flutua num caixote: passe por cima para pegar.
// js/boat.js tem as regras sem desenho; a arte dos barcos (16 direções + amurada da frente) vem de js/boat_art.js.
window.ValdoraSea = (() => {
  "use strict";
  function create(api) {
    const B = window.ValdoraBoat, { ITEMS, SKILLS, SEA_MOBS, SEA_FISH, BAITS, RARITY } = VD, TILE = api.TILE, SND = api.SND, esc = ValdoraUI.esc;
    const rand = () => api.rand(), clamp = (v, a, b) => Math.max(a, Math.min(b, v)), TAU = Math.PI * 2;
    const BASE_SPEED = 4.6, BALL_V = 14, RANGE = 7.5, ELEV_Y = 0.56;
    const LEASH_HOME = 16.5 * 5, LEASH_SHIP = 21 * 5; // rodada 164: 5x a distância em que os monstros de terra desistem // velocidade do bote (tiles/s), bala, alcance; encurtamento vertical da vista
    let W = 0, H = 0, dist = null, ocean = null, zone = null, src = null; // src: o tile de terra mais perto de cada tile de mar
    let ship = null, fish = null, autopilot = null, ready = false;
    const mobs = [], balls = [], crates = [], rings = [], warns = [], wake = [];
    let spots = [], lairs = [], moored = [], spawnT = 0, cdMsgT = 0, hudT = 0;
    const wind = { a: 0, to: 0, t: 0 };
    const P = () => api.player();
    // ---------------- arte dos barcos (carregada só quando aparece) ----------------
    const ART = window.BOAT_ART || {}, IMG = {};
    function art(k) {
      const A = ART[k]; if (!A) return null;
      if (!IMG[k]) { IMG[k] = new Image(); IMG[k].src = (window.assetV || String)(A.src); }
      return IMG[k].complete && IMG[k].naturalWidth ? { A, img: IMG[k] } : null;
    }
    // ---------------- mapa do mar: distância até a terra, oceano (água ligada à borda) e o mar de cada bioma ----------------
    function init() {
      const map = api.map(), G = api.G(); W = api.W(); H = api.H(); const n = W * H;
      dist = new Uint16Array(n).fill(65535); zone = new Uint8Array(n); ocean = new Uint8Array(n); src = new Int32Array(n).fill(-1);
      const q = new Int32Array(n); let qh = 0, qt = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (map[y][x] !== "water") { const i = y * W + x; dist[i] = 0; zone[i] = G.biomeAt(x, y) || 1; src[i] = i; q[qt++] = i; }
      while (qh < qt) {
        const i = q[qh++], x = i % W, y = (i / W) | 0, d = dist[i] + 1;
        if (x > 0 && dist[i - 1] > d) { dist[i - 1] = d; zone[i - 1] = zone[i]; src[i - 1] = src[i]; q[qt++] = i - 1; }
        if (x < W - 1 && dist[i + 1] > d) { dist[i + 1] = d; zone[i + 1] = zone[i]; src[i + 1] = src[i]; q[qt++] = i + 1; }
        if (y > 0 && dist[i - W] > d) { dist[i - W] = d; zone[i - W] = zone[i]; src[i - W] = src[i]; q[qt++] = i - W; }
        if (y < H - 1 && dist[i + W] > d) { dist[i + W] = d; zone[i + W] = zone[i]; src[i + W] = src[i]; q[qt++] = i + W; }
      }
      qh = qt = 0; // oceano: a água que encosta na borda do mapa e tudo o que se liga a ela
      const push = (i) => { if (!ocean[i] && dist[i] > 0) { ocean[i] = 1; q[qt++] = i; } };
      for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
      for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
      while (qh < qt) { const i = q[qh++], x = i % W; if (x > 0) push(i - 1); if (x < W - 1) push(i + 1); if (i >= W) push(i - W); if (i < n - W) push(i + W); }
      // rodada 163: áreas de pesca (como no RavenQuest: um trecho de água marcado pelo anzol; lança-se em qualquer tile dele).
      // rodada 164: sorteadas com a mesma chance em qualquer parte do oceano (a pelo menos 3 tiles da terra e longe dos cais), com
      // uma distância mínima entre elas para não ficarem amontoadas; cada uma tem 30 peixes e, quando acaba, renasce num ponto
      // sorteado do oceano inteiro. 3 x 3 ou 5 x 5 (5 x 5 com gaivotas em cima). Todas só navegando
      spots = []; seaTiles = [];
      for (let k = 0; k < n; k++) if (ocean[k] && dist[k] >= 3) seaTiles.push(k);
      const want = Math.max(20, Math.round(seaTiles.length / SPOT_AREA));
      for (let k = 0; k < want; k++) { const s0 = { id: k, r: rand() < 0.4 ? 1 : 2, ph: rand() * 10, max: SPOT_FISH, charges: SPOT_FISH }; if (placeSpot(s0)) spots.push(s0); }
      // rodada 163: as áreas de pesca do mar são só para quem está navegando (nem da praia nem do píer)
      moored = [];
      for (const D of G.DOCKS || []) {
        // bote amarrado ao lado do píer (o barco do jogador aparece aqui quando fica no cais): do lado de fora da faixa 1 ou da 0
        const px = D.dy ? 1 : 0, py = D.dx ? 1 : 0, ax = D.x + D.dx * (D.len - 1.5) + 0.5, ay = D.y + D.dy * (D.len - 1.5) + 0.5;
        for (const side of [1, -1]) { const off = side > 0 ? 2.7 : -1.7, bx = ax + px * off, by = ay + py * off;
          if (isSea(bx, by) && isSea(bx + px * side * 0.6, by + py * side * 0.6)) { moored.push({ D, x: bx, y: by, a: Math.atan2(D.dy, D.dx), px: px * side, py: py * side }); break; } }
      }
      // covil do Polvo Abissal: o ponto mais fundo do mar de cada bioma, a até 55 tiles da terra (não no canto do mapa)
      lairs = [];
      for (let z = 1; z <= 5; z++) {
        let best = -1, bd = 0;
        for (let y = 8; y < H - 8; y += 4) for (let x = 8; x < W - 8; x += 4) { const i = y * W + x; if (ocean[i] && zone[i] === z && dist[i] > bd && dist[i] <= 55 && !nearDock(x, y, 40)) { bd = dist[i]; best = i; } }
        if (best >= 0 && bd >= 10) lairs.push({ x: best % W + 0.5, y: ((best / W) | 0) + 0.5, zone: z, respawnAt: 0, mob: null });
      }
      for (const sp of spots) if (lairs.some((L) => Math.hypot(L.x - sp.x, L.y - sp.y) < SAFE_SPOT + 6)) placeSpot(sp);
      // rodada 165: monstros do mar com casa fixa, espalhados por todo o oceano (a mesma chance em qualquer lugar, separados uns dos
      // outros), longe da saída dos cais e das áreas de pesca (a pesca não é atrapalhada). Morto, volta 3 minutos depois na casa dele
      mobs.length = 0; homes = [];
      const wantM = Math.round(seaTiles.length / MOB_AREA);
      for (let k = 0, tries = 0; homes.length < wantM && tries < wantM * 40; tries++) {
        const i = seaTiles[Math.floor(rand() * seaTiles.length)], x = i % W + 0.5, y = ((i / W) | 0) + 0.5;
        if (dist[i] < 4 || nearDock(x, y, DOCK_FREE) || spots.some((sp) => Math.hypot(sp.x - x, sp.y - y) < SAFE_SPOT) || lairs.some((L) => Math.hypot(L.x - x, L.y - y) < 20)) continue;
        if (homes.some((h) => Math.abs(h.x - x) < HOME_GAP && Math.abs(h.y - y) < HOME_GAP && Math.hypot(h.x - x, h.y - y) < HOME_GAP)) continue;
        const Bz = api.G().BIOMES[zoneAt(x, y) - 1] || api.G().BIOMES[0], L = Math.max(1, Math.min(Math.round(Bz.lv[1] * 1.1), Math.round(levelAt(x, y) * (0.9 + rand() * 0.2)))); let t = pickType(zoneAt(x, y)); if (t === "pirata" && L < 8) t = "tubarao"; // nível com variação de 10% para cada lado
        const H0 = { x, y, type: t, L }; homes.push(H0);
        const nP = SEA_MOBS[t].pack || 1; for (let j = 0; j < nP; j++) { const m = spawnMob(t, x + (j ? (rand() - 0.5) * 2.5 : 0), y + (j ? (rand() - 0.5) * 2.5 : 0), L); m.home = { x, y }; m.orbit += j * TAU / nP; m.cd += j * 0.8; }
      }
      G.SEA_LAIRS = lairs; G.SEA_SPOTS = spots; // o mapa M marca os covis (rodada 167: as áreas de pesca não aparecem no minimapa)
      wind.a = wind.to = rand() * TAU; wind.t = 40; ready = true;
    }
    const SPOT_FISH = 30, SPOT_GAP = 34, SPOT_AREA = 8000; // peixes por área, distância mínima entre áreas, tiles de mar por área
    // monstros: um a cada MOB_AREA tiles de mar, casas a pelo menos HOME_GAP uma da outra, nenhuma a menos de SAFE_SPOT de uma área de
    // pesca (passeando 6 tiles e com aggro de até 12, ninguém chega no barco que pesca) nem a menos de DOCK_FREE de um cais
    const MOB_AREA = 2000, HOME_GAP = 21, SAFE_SPOT = 26, DOCK_FREE = 32, RESPAWN_MS = 3 * 60 * 1000;
    let seaTiles = [], homes = [];
    function areaFree(cx, cy, r) { for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) { const j = idx(x, y); if (j < 0 || !ocean[j] || dist[j] < 2) return false; } return true; }
    function placeSpot(s0) { // um ponto sorteado do oceano inteiro (mesma chance em qualquer lugar)
      for (let k = 0; k < 80; k++) {
        const i = seaTiles[Math.floor(rand() * seaTiles.length)], cx = i % W, cy = (i / W) | 0;
        if (nearDock(cx, cy, 12) || !areaFree(cx, cy, s0.r)) continue;
        if (spots.some((o) => o !== s0 && Math.abs(o.cx - cx) < SPOT_GAP && Math.abs(o.cy - cy) < SPOT_GAP)) continue;
        if (homes.some((h) => Math.hypot(h.x - cx - 0.5, h.y - cy - 0.5) < SAFE_SPOT) || lairs.some((L) => Math.hypot(L.x - cx - 0.5, L.y - cy - 0.5) < SAFE_SPOT + 6)) continue;
        Object.assign(s0, { cx, cy, x: cx + 0.5, y: cy + 0.5, zone: zone[i] || 1, deep: dist[i] >= 14, big: s0.r >= 2 }); return true;
      }
      return false;
    }
    const hash = (x, y, s) => { const v = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return v - Math.floor(v); };
    const idx = (x, y) => { const X = Math.floor(x), Y = Math.floor(y); return X < 0 || Y < 0 || X >= W || Y >= H ? -1 : Y * W + X; };
    const isSea = (x, y) => { const i = idx(x, y); return i >= 0 && ocean[i] === 1; };
    const distAt = (x, y) => { const i = idx(x, y); return i < 0 ? 0 : dist[i]; };
    const zoneAt = (x, y) => { const i = idx(x, y); return (i >= 0 && zone[i]) || 1; };
    // nível do mar: perto da costa, o começo da faixa do bioma; cresce devagar até uns 48 tiles da terra
    // rodada 166: o nível segue a dificuldade da terra mais perto (o fundo de um bioma e as ilhas distantes são mais fortes) e cresce
    // um pouco longe da costa, até passar 8% do máximo do bioma em mar aberto
    function levelAt(x, y) {
      const G = api.G(), Bm = G.BIOMES[zoneAt(x, y) - 1] || G.BIOMES[0], i = idx(x, y), s0 = i >= 0 && src ? src[i] : -1;
      const dep = s0 >= 0 && G.depthAt ? G.depthAt(s0 % W, (s0 / W) | 0) : 0.5, land = Bm.lv[0] + (Bm.lv[1] - Bm.lv[0]) * dep;
      const k = clamp((distAt(x, y) - 3) / 70, 0, 1), top = Bm.lv[1] * 1.08;
      return Math.max(1, Math.round(land + (top - land) * Math.pow(k, 1.4) * 0.75));
    }
    function nearDock(x, y, r) { return (api.G().DOCKS || []).some((D) => Math.hypot(D.x - x, D.y - y) < r); }
    function tip(D) { // centro da ponta do píer (coordenadas contínuas)
      const px = D.dy ? 1 : 0, py = D.dx ? 1 : 0;
      return { x: D.x + D.dx * D.len + 0.5 + px * 0.5, y: D.y + D.dy * D.len + 0.5 + py * 0.5, tx: D.x + D.dx * D.len, ty: D.y + D.dy * D.len };
    }
    // casco cabe aqui? (proa, popa, meio e as bordas; o comprimento encurta na vertical como a arte)
    function hullFree(x, y, a, s) {
      const c = Math.cos(a), sn = Math.sin(a), L = s.len, bx = -sn * s.beam, by = c * s.beam * ELEV_Y;
      return [[0, 0], [c * L, sn * L * ELEV_Y], [-c * L * 0.85, -sn * L * 0.85 * ELEV_Y], [bx, by], [-bx, -by]].every(([dx, dy]) => isSea(x + dx, y + dy));
    }
    // ---------------- embarcar e desembarcar ----------------
    const owns = () => !!B.stats(P().boat);
    function embarkAt(x, y, a, dockKey) {
      const p = P(), s = B.stats(p.boat); if (!s || !ready) return false;
      if (!hullFree(x, y, a, s)) { const f = freeSea(x, y, s, a); if (!f) { api.log("Não há água livre para o barco aqui.", "warn"); return false; } x = f.x; y = f.y; }
      api.stopAll(); if (p.riding) api.dismount();
      ship = { x, y, a, v: 0, s, hp: B.hpOf(p.boat), cdL: 0, cdR: 0, hurtT: 99, inkT: 0, foamT: 0, tilt: 0 };
      p.sailing = true; p.boat.anchor = null; p.boat.sea = null; if (dockKey) p.boat.dock = dockKey; autopilot = null;
      api.dropAggro(); art(s.art); SND.play("bell"); sync(0);
      api.log(`A bordo do ${s.name}. WASD ou clique na água para navegar; Q e E disparam os canhões; F atraca ou lança a linha num cardume.`, "dim");
      if (!p.seen.seaTip) { p.seen.seaTip = 1; api.toast("Ao mar!", "Vento de popa rende mais. Q e E: canhões. F perto de um cardume: pescar. F perto do cais ou da praia: descer.", "#8fd8ff"); }
      api.hud(); return true;
    }
    function freeSea(x, y, s, a = 0) {
      for (let r = 0; r <= 6; r += 0.5) for (let k = 0; k < 16; k++) { const X = x + Math.cos(k * TAU / 16) * r, Y = y + Math.sin(k * TAU / 16) * r; if (isSea(X, Y) && hullFree(X, Y, a, s)) return { x: X, y: Y }; }
      return null;
    }
    function embarkDock(D) {
      if (!owns()) { api.log(`Você ainda não tem barco. ${D.keeper}, o mestre do ${D.name}, vende e conserta barcos.`, "dim"); return false; }
      const M = moored.find((m) => m.D === D), T = tip(D), ex = M ? mooredExtra(M) : 0;
      return embarkAt(M ? M.x + M.px * ex : T.x + D.dx * 2.2, M ? M.y + M.py * ex : T.y + D.dy * 2.2, Math.atan2(D.dy, D.dx), D.key);
    }
    const mooredExtra = (M) => { const s = B.stats(P().boat); return s ? Math.max(0, s.beam - 0.4) : 0; }; // casco largo fica mais longe do píer
    function landing() { // onde o herói pode pisar: píer perto (até 2,8 tiles) ou praia encostada no casco
      if (!ship) return null; const map = api.map(); let best = null, bd = 9;
      for (let y = Math.floor(ship.y) - 4; y <= Math.floor(ship.y) + 4; y++) for (let x = Math.floor(ship.x) - 4; x <= Math.floor(ship.x) + 4; x++) {
        if (!api.inside(x, y) || !api.walkable(x, y)) continue;
        const pier = map[y][x] === "pier", d = Math.hypot(x + 0.5 - ship.x, y + 0.5 - ship.y) - (pier ? 0.6 : 0);
        if (d <= (pier ? 2.6 : 1.7 + ship.s.beam) && d < bd) { bd = d; best = { x, y, pier }; }
      }
      return best;
    }
    function disembark() {
      const L = landing(); if (!L) { api.log("Chegue mais perto do cais ou da praia para descer.", "dim"); return false; }
      const p = P(); fishStop(true);
      p.boat.hp = Math.round(ship.hp); p.boat.anchor = L.pier ? null : { x: ship.x, y: ship.y, a: ship.a };
      if (L.pier) { const D = dockOfTile(L.x, L.y); if (D) p.boat.dock = D.key; }
      ship = null; autopilot = null; p.sailing = false; p.cast = null;
      api.placeHero(L.x, L.y); SND.play("step");
      api.log(L.pier ? "Barco amarrado no cais. Para zarpar de novo, clique no barco ou fale com o mestre do cais." : "Você desceu na praia; o barco ficou ancorado aqui (clique nele para embarcar).", "dim");
      api.hud(); api.save(); return true;
    }
    function dockOfTile(x, y) { return (api.G().DOCKS || []).find((D) => Math.max(Math.abs(D.x - x), Math.abs(D.y - y)) <= D.len + 2) || null; }
    function nearestDock(x, y) { let best = null, bd = 1e9; for (const D of api.G().DOCKS || []) { const d = Math.hypot(D.x - x, D.y - y); if (d < bd) { bd = d; best = D; } } return best; }
    // naufrágio: o herói é resgatado no cais de onde zarpou (ou no mais perto) e o casco volta com 25% da vida
    // rodada 166: no naufrágio, metade dos peixes (de cada pilha; pilha de 1, 50% de chance) fica numa bolsa boiando no lugar por
    // 30 minutos; quem passar de barco por cima pega (o que couber na mochila; o resto continua na bolsa)
    const WRECK_LIFE = 30 * 60 * 1000;
    function dropFish(x, y) {
      const p = P(), items = [];
      for (const st of [...p.inv]) { if (!st || !isFish(st.name)) continue; const q = Math.floor(st.n / 2) + (st.n % 2 && rand() < 0.5 ? 1 : 0); if (q > 0) { api.removeItem(st.name, q); items.push([st.name, q]); } }
      if (!items.length) return 0;
      (p.boat.wrecks = p.boat.wrecks || []).push({ x, y, items, until: Date.now() + WRECK_LIFE }); return items.reduce((a, [, q]) => a + q, 0);
    }
    function takeWreck(w) {
      const left = [], got = [];
      for (const [n, q] of w.items) { if (api.canAdd(n, q)) { api.addItem(n, q); got.push(`${q} ${n.toLowerCase()}`); } else left.push([n, q]); }
      if (got.length) { SND.play("pickup"); api.fx.addFloat(w.x, w.y - 0.8, "Peixes recuperados!", "#8fd8ff", 1.4, 13); api.log(`Bolsa do naufrágio: ${got.join(", ")}.`, "gold"); api.hud(); }
      if (left.length) { w.items = left; if (!w.full) { w.full = 1; api.log("Mochila cheia: o resto dos peixes continua na bolsa.", "warn"); } return false; }
      return true;
    }
    function drawWrecks(t) {
      const ctx = api.ctx(), p = P(), img = api.SPR.death_bag;
      for (const w of p.boat.wrecks || []) {
        const x = X(w.x), y = Y(w.y) + Math.sin(t * 2 + w.x) * 2, pulse = 0.5 + 0.5 * Math.sin(t * 3 + w.y);
        if (x < -60 || y < -60 || x > api.VW() + 60 || y > api.VH() + 60) continue;
        ctx.fillStyle = `rgba(140,220,255,${0.18 + pulse * 0.18})`; ctx.beginPath(); ctx.ellipse(x, y + 4, 22, 8, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = "rgba(240,250,255,0.6)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y + 4, 26, 9, 0, 0, Math.PI); ctx.stroke();
        if (img) ctx.drawImage(img, Math.round(x - img.width / 2), Math.round(y - img.height + 4));
        else { ctx.fillStyle = "#8a6a3a"; ctx.strokeStyle = "#2a1a10"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y - 8, 12, 12, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
        const ic = w.items[0] && api.SPR[ITEMS[w.items[0][0]].icon]; if (ic) ctx.drawImage(ic, Math.round(x - 12), Math.round(y - 52), 24, 24);
        api.tag("Peixes do naufrágio", w.x, w.y - 1.25, "#8fd8ff", true);
      }
    }
    function sink() {
      const p = P(), s = ship.s; fishStop(true);
      const lost = dropFish(ship.x, ship.y);
      api.fx.burst(ship.x, ship.y, ["#8a5a2a", "#c9955a", "#e8f6ff"], 30, 4); SND.play("slam"); api.shake(0.35);
      const D = (api.G().DOCKS || []).find((d) => d.key === p.boat.dock) || nearestDock(ship.x, ship.y);
      p.boat.hp = Math.round(s.maxHp * 0.25); p.boat.anchor = null; if (D) p.boat.dock = D.key;
      ship = null; autopilot = null; p.sailing = false; balls.length = 0; warns.length = 0; for (const m of mobs) m.aggro = false;
      if (D) { const T = tip(D); api.placeHero(T.tx, T.ty); }
      api.toast("Naufrágio!", `O ${s.name} afundou. Pescadores trouxeram você ao cais; o casco voltou com 25% da vida (o mestre do cais conserta).${lost ? ` ${lost} peixes ficaram boiando numa bolsa no lugar do naufrágio.` : ""}`, "#ff8a6a");
      api.log("Seu barco afundou! O mestre do cais conserta o casco por algumas moedas.", "warn"); api.hud(); api.save();
    }
    // ---------------- o herói no convés ----------------
    const D8 = ["right", "downright", "down", "downleft", "left", "upleft", "up", "upright"];
    const dir8 = (a) => D8[((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8];
    function deckFeet() {
      const k = B.dir16(ship.a), A = ART[ship.s.art], h = A ? A.hero[k] : null, bob = Math.sin(performance.now() / 1000 * 1.7 + 1) * 0.02;
      return h ? { x: ship.x + (h[0] - A.ox) / A.pxTile, y: ship.y + (h[1] - A.oy) / A.pxTile + bob } : { x: ship.x, y: ship.y - 0.3 };
    }
    function sync() {
      const p = P(), f = deckFeet();
      p.px = f.x - 0.5; p.py = f.y - 1; p.x = clamp(Math.floor(ship.x), 0, W - 1); p.y = clamp(Math.floor(ship.y), 0, H - 1);
      p.fx = p.x; p.fy = p.y; p.prog = 1; p.path = []; p.goal = null; p.fineG = null; p.gx = p.fgx = 2 * p.x; p.gy = p.fgy = 2 * p.y; p.gtx = p.x; p.gty = p.y;
      p.dir = fish ? dir8(Math.atan2(fish.spot.y - f.y, fish.spot.x - f.x)) : dir8(ship.a);
    }
    // ---------------- canhões ----------------
    function fire(side, quiet) {
      if (!ship) return false;
      const key = side < 0 ? "cdL" : "cdR";
      if (ship.stunT > 0) { if (!quiet) api.log("Canhões travados pelo choque!", "warn"); return false; }
      if (ship[key] > 0) { if (!quiet && performance.now() - cdMsgT > 900) { cdMsgT = performance.now(); api.log(`Canhões de ${side < 0 ? "bombordo" : "estibordo"} recarregando (${ship[key].toFixed(1)} s).`, "dim"); } return false; }
      const s = ship.s; ship[key] = s.reload;
      const c = Math.cos(ship.a), sn = Math.sin(ship.a), nx = side * -sn, ny = side * c, dmg = B.ballDmg(s, api.lv("navegacao"), api.lv("combate"));
      // mira assistida: o monstro mais perto que estiver a até 60 graus do través deste bordo (com a previsão do movimento dele)
      let tgt = null, td = RANGE + 0.6;
      for (const m of mobs) { if (m.dead || m.hidden) continue; const dx = m.x - ship.x, dy = m.y - ship.y, d = Math.hypot(dx, dy); if (d < td && (dx * nx + dy * ny) / (d || 1) > 0.5) { td = d; tgt = m; } }
      for (let i = 0; i < s.guns; i++) {
        const off = s.guns === 1 ? 0 : (i / (s.guns - 1) - 0.5) * s.len * 1.1, x = ship.x + c * off + nx * s.beam, y = ship.y + (sn * off + ny * s.beam) * ELEV_Y;
        let vx = nx * BALL_V + c * ship.v, vy = ny * BALL_V + sn * ship.v;
        if (tgt) { const fl = Math.hypot(tgt.x - x, tgt.y - y) / BALL_V, ax = tgt.x + Math.cos(tgt.a) * tgt.v * fl - x, ay = tgt.y + Math.sin(tgt.a) * tgt.v * fl - y, al = Math.hypot(ax, ay) || 1; vx = ax / al * BALL_V; vy = ay / al * BALL_V; }
        balls.push({ x, y, vx, vy, t: 0, life: RANGE / BALL_V, dmg: Math.round(dmg * (0.9 + rand() * 0.2)), mine: true, h: 0.45 });
        api.fx.burst(x + nx * 0.3, y + ny * 0.2, ["#f2efe6", "#c8c4bc", "#8a8680"], 6, 1.4, 0.5); api.fx.sparks(x + nx * 0.2, y, 4, ["#fff6c0", "#ffb040"], 3);
      }
      SND.play("cannon"); api.shake(0.1); ship.tilt = -side * 0.6;
      return true;
    }
    function fireAt(m) { // o bordo virado para o alvo
      if (!ship) return false; const dx = m.x - ship.x, dy = m.y - ship.y, cr = Math.cos(ship.a) * dy - Math.sin(ship.a) * dx;
      return fire(cr >= 0 ? 1 : -1);
    }
    function nearestMob(r) { let best = null, bd = r; for (const m of mobs) { if (m.dead || m.hidden) continue; const d = Math.hypot(m.x - ship.x, m.y - ship.y); if (d < bd) { bd = d; best = m; } } return best; }
    // ---------------- monstros do mar ----------------
    function spawnMob(type, x, y, L, lair) {
      const d = SEA_MOBS[type], hp = B.mobHp(d, L);
      const m = { type, d, x, y, a: rand() * TAU, v: 0, L, hp, max: hp, aggro: false, t: rand() * 10, cd: 2 + rand() * 2, flash: 0, dead: false, deadT: 0, home: { x, y }, lair, orbit: rand() * TAU, wander: null, cdL: 2, cdR: 2 };
      mobs.push(m); return m;
    }
    function pickType(z) { // rodada 163: cada mar tem as suas espécies (d.zones)
      const list = Object.entries(SEA_MOBS).filter(([, d]) => d.w > 0 && (!d.zones || d.zones.includes(z))), tot = list.reduce((a, [, d]) => a + d.w, 0); let r = rand() * tot;
      for (const [k, d] of list) if ((r -= d.w) <= 0) return k; return list[0][0];
    }
    function populate() { // rodada 165: cada monstro tem casa fixa; morto, volta 3 minutos depois (o polvo, no covil)
      const now = Date.now();
      for (let i = mobs.length - 1; i >= 0; i--) { const m = mobs[i]; if (!m.dead || m.deadT < 1.5) continue;
        if (m.lair) { m.lair.mob = null; mobs.splice(i, 1); continue; }
        if (now >= m.respawnAt && !(ship && Math.hypot(ship.x - m.home.x, ship.y - m.home.y) < 14)) { // renasce na casa (nunca na cara do barco)
          Object.assign(m, { dead: false, deadT: 0, hp: m.max, x: m.home.x + (rand() - 0.5) * 2, y: m.home.y + (rand() - 0.5) * 2, aggro: false, returning: false, hidden: false, v: 0, cd: 2 + rand() * 2,
            lunge: 0, puffT: 0, grabT: 0, dashT: 0, aim: 0, zapT: 0, charge: 0, flee: 0, jumpT: 0, diveT: 0, singT: 0, clawT: 0, breachT: 0, z: 0, wander: null }); } }
      if (!ship) return;
      for (const Lr of lairs) if (!Lr.mob && Date.now() >= Lr.respawnAt && Math.hypot(Lr.x - ship.x, Lr.y - ship.y) < 45) {
        const G = api.G(), Bm = G.BIOMES[Lr.zone - 1]; Lr.mob = spawnMob("polvo", Lr.x, Lr.y, Bm.lv[1], Lr);
      }
    }
    function steer(o, tx, ty, speed, turn, dt) { // vira aos poucos e anda; bate na terra: escolhe outro rumo
      const want = Math.atan2(ty - o.y, tx - o.x), d = B.angDiff(want, o.a); o.a += clamp(d, -turn * dt, turn * dt);
      o.v += (speed - o.v) * Math.min(1, dt * 1.5);
      const nx = o.x + Math.cos(o.a) * o.v * dt, ny = o.y + Math.sin(o.a) * o.v * dt;
      if (isSea(nx, ny) && isSea(nx + Math.cos(o.a) * 0.8, ny + Math.sin(o.a) * 0.8)) { o.x = nx; o.y = ny; } else { o.a += Math.PI * (0.5 + rand()); o.v *= 0.3; o.wander = null; }
    }
    function mobBall(m, tx, ty, speed, dmg, kind) {
      const fl = Math.hypot(tx - m.x, ty - m.y) / speed, lx = tx + Math.cos(ship.a) * ship.v * fl * 0.8, ly = ty + Math.sin(ship.a) * ship.v * fl * 0.8, d = Math.hypot(lx - m.x, ly - m.y) || 1;
      balls.push({ x: m.x, y: m.y - 0.2, vx: (lx - m.x) / d * speed, vy: (ly - m.y) / d * speed, t: 0, life: Math.min(1.6, d / speed + 0.25), dmg, mine: false, kind, h: kind === "ball" ? 0.45 : 0.6 });
    }
    function updateMob(m, dt) {
      const d = m.d; m.t += dt; m.flash = Math.max(0, m.flash - dt);
      if (m.dead) { m.deadT += dt; return; }
      const sd = ship ? Math.hypot(ship.x - m.x, ship.y - m.y) : 1e9;
      if (ship && !m.aggro && !m.returning && sd < d.aggro) { m.aggro = true; if (d.boss) api.toast(d.name, "Saiu das profundezas! Fuja dos círculos na água.", "#c47aff"); }
      const fromHome = Math.hypot(m.x - m.home.x, m.y - m.home.y);
      if (m.aggro && !d.boss && (!ship || sd > LEASH_SHIP || fromHome > LEASH_HOME)) { // desiste e volta nadando para onde nasceu
        m.aggro = false; m.returning = true; m.lunge = m.puffT = m.grabT = m.dashT = m.aim = m.zapT = m.jumpT = m.diveT = m.singT = m.clawT = m.breachT = m.z = 0; m.hidden = false; m.cd = 2;
        if (ship && ship.heldT) ship.heldT = 0; if (ship && ship.charmBy === m) ship.charmT = 0; m.wander = null;
        if (sd < 30) api.log(`${d.name} desistiu de seguir o barco.`, "dim"); }
      if (m.aggro && d.boss && (!ship || sd > d.aggro * 3)) m.aggro = false;
      m.cd -= dt;
      if (m.returning) { // voltando: não persegue ninguém e recupera a vida
        m.hp = Math.min(m.max, m.hp + m.max * 0.08 * dt);
        if (fromHome < 2) m.returning = false; else { steer(m, m.home.x, m.home.y, d.speed * 1.2, 2.5, dt); return; } }
      if (!m.aggro) { // passeia perto de onde nasceu
        if (d.speed <= 0) return;
        if (!m.wander || Math.hypot(m.wander.x - m.x, m.wander.y - m.y) < 1) m.wander = { x: m.home.x + (rand() - 0.5) * 12, y: m.home.y + (rand() - 0.5) * 12 };
        steer(m, m.wander.x, m.wander.y, d.speed * 0.35, 1.2, dt); return;
      }
      const dmg = B.mobDmg(d, m.L), R = hullR();
      if (d.kind === "bite") { // tubarão: rodeia o barco e dá o bote na hora da mordida
        if (m.lunge > 0) {
          m.lunge -= dt; steer(m, ship.x, ship.y, d.speed * 2.3, 4, dt);
          if (sd < R + d.radius * 0.6) { hurt(dmg, m); m.lunge = 0; m.cd = 3.2 + rand() * 1.5; m.orbit += Math.PI; api.fx.burst(m.x, m.y, ["#e8f6ff", "#8fc1ee"], 10, 2.4); SND.play("splash"); }
        } else {
          m.orbit += dt * 0.6; const r = 4.2 + R; steer(m, ship.x + Math.cos(m.orbit) * r, ship.y + Math.sin(m.orbit) * r * 0.8, d.speed * 0.8, 2.6, dt);
          if (m.cd <= 0) { m.lunge = 1.4; m.cd = 1.4 + 2.6; api.fx.addFloat(m.x, m.y - 0.6, "!", "#ff5a4a", 0.6, 16); }
        }
      } else if (d.kind === "pulse") { // medusa: chega perto, acende e solta o choque em volta
        if (m.charge > 0) {
          m.charge -= dt;
          if (m.charge <= 0) { m.cd = 2.8; rings.push({ x: m.x, y: m.y, t: 0, life: 0.45, r: 2.9, c: "#bfe8ff", w: 4 }); SND.play("crit");
            if (sd < 2.9 + R * 0.5) hurt(dmg, m); }
        } else { steer(m, ship.x, ship.y, sd > 1.6 ? d.speed : 0.2, 1.8, dt); if (sd < 2.6 && m.cd <= 0) m.charge = 0.9; }
      } else if (d.kind === "spit") { // serpente: fica a uns 5 tiles e cospe jatos d'água
        const want = sd > 6.5 ? 1 : sd < 4 ? -1 : 0; m.orbit += dt * 0.5;
        const tx = want > 0 ? ship.x : want < 0 ? m.x * 2 - ship.x : ship.x + Math.cos(m.orbit) * 5, ty = want > 0 ? ship.y : want < 0 ? m.y * 2 - ship.y : ship.y + Math.sin(m.orbit) * 4;
        steer(m, tx, ty, d.speed, 2.2, dt);
        if (m.cd <= 0 && sd < 9) { m.cd = 3.2; m.spitT = 0.4; mobBall(m, ship.x, ship.y, 7.5, dmg, "spit"); SND.play("splash"); }
        m.spitT = Math.max(0, (m.spitT || 0) - dt);
      } else if (d.kind === "ship") { // corsário: emparelha de lado e dispara o costado
        const side = Math.sign(Math.cos(ship.a) * (m.y - ship.y) - Math.sin(ship.a) * (m.x - ship.x)) || 1, off = 5;
        const tx = ship.x - Math.sin(ship.a) * off * side + Math.cos(ship.a) * 1.5, ty = ship.y + Math.cos(ship.a) * off * side + Math.sin(ship.a) * 1.5;
        steer(m, tx, ty, Math.hypot(tx - m.x, ty - m.y) > 1.5 ? d.speed : ship.v * 0.9, 1.6, dt);
        m.cdL -= dt; m.cdR -= dt;
        const cr = Math.cos(m.a) * (ship.y - m.y) - Math.sin(m.a) * (ship.x - m.x), along = Math.abs(Math.cos(m.a) * (ship.x - m.x) + Math.sin(m.a) * (ship.y - m.y)) / (sd || 1), s2 = cr >= 0 ? 1 : -1, k = s2 > 0 ? "cdR" : "cdL";
        if (sd < 8 && along < 0.55 && m[k] <= 0) {
          m[k] = 4; SND.play("cannon");
          for (let i = 0; i < 2; i++) { const o = (i - 0.5) * 1.1, x = m.x + Math.cos(m.a) * o, y = m.y + Math.sin(m.a) * o * ELEV_Y; api.fx.burst(x, y - 0.2, ["#f2efe6", "#8a8680"], 5, 1.2, 0.5);
            balls.push({ x, y: y - 0.25, vx: (ship.x - x) / sd * BALL_V, vy: (ship.y - y) / sd * BALL_V, t: 0, life: Math.min(RANGE, sd + 1) / BALL_V, dmg, mine: false, kind: "ball", h: 0.45 }); }
        }
      } else if (d.kind === "puff") { // baiacu: chega perto, incha (aviso laranja) e explode em espinhos; depois foge um pouco
        if (m.puffT > 0) { m.puffT -= dt; m.v *= 0.9;
          if (m.puffT <= 0) { m.cd = 4; m.flee = 2.2; rings.push({ x: m.x, y: m.y, t: 0, life: 0.45, r: 2.8, c: "#ffd86a", w: 4 }); SND.play("hit");
            for (let k = 0; k < 10; k++) { const a = k * TAU / 10; balls.push({ x: m.x, y: m.y, vx: Math.cos(a) * 7, vy: Math.sin(a) * 7, t: 0, life: 0.38, dmg: 0, mine: false, kind: "spike", h: 0.2, fx: true }); }
            if (sd < 2.8 + R * 0.4) hurt(dmg, m); } }
        else if (m.flee > 0) { m.flee -= dt; steer(m, m.x * 2 - ship.x, m.y * 2 - ship.y, d.speed * 1.3, 2.5, dt); }
        else { steer(m, ship.x, ship.y, sd > 1.5 ? d.speed : 0.3, 2.2, dt); if (sd < 2.4 && m.cd <= 0) { m.puffT = 1.1; SND.play("warn"); } }
      } else if (d.kind === "pack") { // barracudas: rodeiam juntas e dão botes rápidos, uma de cada vez
        if (m.lunge > 0) { m.lunge -= dt; steer(m, ship.x, ship.y, d.speed * 2, 5, dt);
          if (sd < R + d.radius * 0.6) { hurt(dmg, m); m.lunge = 0; m.cd = 1.8 + rand() * 1.5; m.orbit += Math.PI * 0.8; api.fx.burst(m.x, m.y, ["#e8f6ff", "#8fc1ee"], 6, 2); } }
        else { m.orbit += dt * 1.1; const r = 3.4 + R; steer(m, ship.x + Math.cos(m.orbit) * r, ship.y + Math.sin(m.orbit) * r * 0.8, d.speed * 0.8, 3.2, dt);
          if (m.cd <= 0) { m.lunge = 0.9; m.cd = 0.9 + 1.8 + rand() * 1.5; } }
      } else if (d.kind === "blink") { // enguia: mergulha (some, os tiros passam), surge colada no barco e morde
        if (m.hidden) { m.hidT -= dt; const tx = ship.x + Math.cos(m.orbit) * (R + 0.9), ty = ship.y + Math.sin(m.orbit) * (R + 0.9) * 0.8; steer(m, tx, ty, d.speed * 2.2, 5, dt);
          if (m.hidT <= 0.7 && !m.bub) { m.bub = 1; warns.push({ x: tx, y: ty, t: 0.7, life: 0.7, r: 0.9, dmg: 0, m, kind: "bubbles" }); }
          if (m.hidT <= 0) { m.hidden = false; m.bub = 0; m.biteT = 0.45; m.cd = 3 + rand(); api.fx.burst(m.x, m.y, ["#2a1a3a", "#8fc1ee", "#ffffff"], 12, 2.6); SND.play("splash");
            if (Math.hypot(ship.x - m.x, ship.y - m.y) < R + 1.4) hurt(Math.round(dmg * 1.2), m); } }
        else { m.biteT = Math.max(0, (m.biteT || 0) - dt); m.orbit += dt * 0.7; steer(m, ship.x + Math.cos(m.orbit) * 4.5, ship.y + Math.sin(m.orbit) * 3.6, d.speed * 0.7, 2.4, dt);
          if (m.cd <= 0) { m.hidden = true; m.hidT = 2.2; m.orbit = rand() * TAU; api.fx.burst(m.x, m.y, ["#2a1a3a", "#8fc1ee"], 8, 1.8); } }
      } else if (d.kind === "grab") { // lula: de longe cospe tinta; de perto agarra o casco (segura o barco) até levar uns tiros
        if (m.grabT > 0) { m.grabT -= dt; m.x += (ship.x - Math.cos(m.a) * (R + 0.6) - m.x) * Math.min(1, dt * 4); m.y += (ship.y - Math.sin(m.a) * (R + 0.6) * 0.8 - m.y) * Math.min(1, dt * 4);
          ship.heldT = Math.max(ship.heldT || 0, 0.2); if ((m.dotT = (m.dotT || 0) - dt) <= 0) { m.dotT = 0.6; hurt(Math.max(1, Math.round(dmg * 0.35)), m); }
          if (m.grabT <= 0 || m.max * 0.14 <= m.grabDmg) { m.grabT = 0; m.cd = 4.5; m.flee = 1.5; ship.heldT = 0; api.log("A lula soltou o barco!", "dim"); } }
        else if (m.flee > 0) { m.flee -= dt; steer(m, m.x * 2 - ship.x, m.y * 2 - ship.y, d.speed, 2.5, dt); }
        else { steer(m, ship.x, ship.y, d.speed, 2, dt);
          if (sd < R + 1.4 && m.cd <= 0) { m.grabT = 2.6; m.grabDmg = 0; api.log("A lula-gigante agarrou o casco! Atire nela para soltar.", "warn"); SND.play("warn"); }
          else if (sd > 4.5 && sd < 9 && m.cd <= -2.5) { m.cd = 0.5; mobBall(m, ship.x, ship.y, 6.5, Math.round(dmg * 0.5), "ink"); SND.play("splash"); } }
      } else if (d.kind === "ram" || d.kind === "ice" || d.kind === "charge") { // tartaruga, narval e espadarte: marcam a linha e investem
        if (m.dashT > 0) { m.dashT -= dt; const sp = d.speed * (d.kind === "charge" ? 4.5 : 3.2), nx = m.x + Math.cos(m.a) * sp * dt, ny = m.y + Math.sin(m.a) * sp * dt;
          if (isSea(nx, ny)) { m.x = nx; m.y = ny; } else m.dashT = 0;
          if (!m.hitDone && Math.hypot(ship.x - m.x, ship.y - m.y) < R + d.radius * 0.7) { m.hitDone = 1; hurt(Math.round(dmg * (d.kind === "charge" ? 1.3 : 1.15)), m);
            if (d.kind === "ram") { const px2 = ship.x + Math.cos(m.a) * 1.2, py2 = ship.y + Math.sin(m.a) * 1.2; if (hullFree(px2, py2, ship.a, ship.s)) { ship.x = px2; ship.y = py2; } api.shake(0.25); SND.play("slam"); }
            if (d.kind === "ice") ship.inkT = Math.max(ship.inkT, 2.5); } }
        else if (m.aim > 0) { m.aim -= dt; m.a += clamp(B.angDiff(Math.atan2(ship.y - m.y, ship.x - m.x), m.a), -1.5 * dt, 1.5 * dt);
          if (m.aim <= 0) { m.dashT = d.kind === "charge" ? 0.9 : 0.8; m.hitDone = 0; SND.play("whoosh"); } }
        else { m.orbit += dt * 0.4; const r = d.kind === "charge" ? 8 : 5; steer(m, ship.x + Math.cos(m.orbit) * r, ship.y + Math.sin(m.orbit) * r * 0.8, d.speed, 1.8, dt);
          if (m.cd <= 0 && sd < (d.kind === "charge" ? 11 : 8)) { m.cd = d.kind === "charge" ? 3.6 : 4.5; m.aim = d.kind === "charge" ? 0.8 : 1.0;
            const L = d.kind === "charge" ? 12 : 6; m.a = Math.atan2(ship.y - m.y, ship.x - m.x);
            lines.push({ m, t: m.aim, life: m.aim, len: L, w: d.radius * 1.6, c: d.kind === "ice" ? "#bfefff" : "#ff8a5a" }); SND.play("warn"); }
          if (d.kind === "ice" && (m.iceCd = (m.iceCd ?? 3) - dt) <= 0) { m.iceCd = 6.5; // pontas de gelo em volta do barco
            for (let i = 0; i < 3; i++) { const a = rand() * TAU, rr = rand() * 1.8, x = ship.x + Math.cos(ship.a) * ship.v * 1.1 + Math.cos(a) * rr, y = ship.y + Math.sin(ship.a) * ship.v * 1.1 + Math.sin(a) * rr;
              if (isSea(x, y)) warns.push({ x, y, t: 1.2 + i * 0.15, life: 1.2 + i * 0.15, r: 1.1, dmg: Math.round(dmg * 0.9), m, kind: "ice" }); } SND.play("warn"); } }
      } else if (d.kind === "zap") { // arraia: carrega o raio em linha (azul) e solta: choque, canhões travados e barco lento
        if (m.zapT > 0) { m.zapT -= dt;
          if (m.zapT <= 0) { m.cd = 4.2; const L = 9, x1 = m.x + Math.cos(m.a) * L, y1 = m.y + Math.sin(m.a) * L; bolts.push({ x0: m.x, y0: m.y, x1, y1, t: 0, life: 0.4 }); SND.play("crit");
            if (lineDist(ship.x, ship.y, m.x, m.y, x1, y1) < R + 0.35) { hurt(dmg, m); ship.stunT = 1.8; api.log("Choque! Os canhões travaram por um instante.", "warn"); } } }
        else { const want = sd > 7 ? 1 : sd < 4.5 ? -1 : 0; m.orbit += dt * 0.5;
          steer(m, want > 0 ? ship.x : want < 0 ? m.x * 2 - ship.x : ship.x + Math.cos(m.orbit) * 6, want > 0 ? ship.y : want < 0 ? m.y * 2 - ship.y : ship.y + Math.sin(m.orbit) * 5, d.speed, 2, dt);
          if (m.cd <= 0 && sd < 8.5) { m.zapT = 1.0; m.a = Math.atan2(ship.y + Math.sin(ship.a) * ship.v - m.y, ship.x + Math.cos(ship.a) * ship.v - m.x);
            lines.push({ m, t: 1.0, life: 1.0, len: 9, w: 0.7, c: "#8fe0ff", fixed: true }); SND.play("warn"); } }
      } else if (d.kind === "leap") { // peixe-voador: salta por cima do barco (a sombra marca onde cai)
        if (m.jumpT > 0) { m.jumpT -= dt; const k = 1 - m.jumpT / 0.8; m.x = m.jx0 + (m.jx1 - m.jx0) * k; m.y = m.jy0 + (m.jy1 - m.jy0) * k; m.z = Math.sin(Math.PI * k) * 1.4;
          if (m.jumpT <= 0) { m.z = 0; api.fx.burst(m.x, m.y, ["#e8f6ff", "#8fc1ee"], 8, 2); SND.play("splash"); if (ship && Math.hypot(ship.x - m.x, ship.y - m.y) < R + 0.5) hurt(dmg, m); m.cd = 3 + rand() * 1.5; } }
        else { m.orbit += dt * 1.0; const r = 4.5; steer(m, ship.x + Math.cos(m.orbit) * r, ship.y + Math.sin(m.orbit) * r * 0.8, d.speed * 0.8, 3, dt);
          if (m.cd <= 0 && sd < 7) { const tx = ship.x + Math.cos(ship.a) * ship.v * 0.8, ty = ship.y + Math.sin(ship.a) * ship.v * 0.8; Object.assign(m, { jumpT: 0.8, jx0: m.x, jy0: m.y, jx1: tx, jy1: ty, a: Math.atan2(ty - m.y, tx - m.x) });
            warns.push({ x: tx, y: ty, t: 0.8, life: 0.8, r: 0.7, dmg: 0, m, kind: "shadow" }); m.cd = 99; } }
      } else if (d.kind === "dive") { // gaivota: voa em círculos e mergulha no barco
        if (m.diveT > 0) { m.diveT -= dt; steer(m, m.dx0, m.dy0, d.speed * 3, 6, dt);
          if (m.diveT <= 0) { if (ship && Math.hypot(ship.x - m.dx0, ship.y - m.dy0) < R + 0.8) hurt(dmg, m); api.fx.burst(m.dx0, m.dy0, ["#ffffff", "#bfe8ff"], 8, 2); m.cd = 3.2 + rand(); m.orbit += Math.PI; } }
        else { m.orbit += dt * 0.9; steer(m, ship.x + Math.cos(m.orbit) * 4.5, ship.y + Math.sin(m.orbit) * 3.6, d.speed, 3, dt);
          if (m.cd <= 0 && sd < 9) { m.diveT = 0.9; m.dx0 = ship.x + Math.cos(ship.a) * ship.v * 0.9; m.dy0 = ship.y + Math.sin(ship.a) * ship.v * 0.9; warns.push({ x: m.dx0, y: m.dy0, t: 0.9, life: 0.9, r: 1.1, dmg: 0, m, kind: "dive" }); SND.play("whoosh"); } }
      } else if (d.kind === "harpoon") { // afogado: arpão com corda que puxa o barco
        const want = sd > 7 ? 1 : sd < 4.5 ? -1 : 0; m.orbit += dt * 0.4;
        steer(m, want > 0 ? ship.x : want < 0 ? m.x * 2 - ship.x : ship.x + Math.cos(m.orbit) * 6, want > 0 ? ship.y : want < 0 ? m.y * 2 - ship.y : ship.y + Math.sin(m.orbit) * 5, d.speed, 2, dt);
        m.throwT = Math.max(0, (m.throwT || 0) - dt);
        if (m.cd <= 0 && sd < 9) { m.cd = 4; m.throwT = 0.45; mobBall(m, ship.x, ship.y, 9, dmg, "harpoon"); balls[balls.length - 1].src = m; SND.play("whoosh"); }
      } else if (d.kind === "charm") { // sereia: canta; quem ficar perto fica encantado e navega até ela
        if (m.singT > 0) { m.singT -= dt; if (m.singT <= 0) { m.cd = 6; if (ship && Math.hypot(ship.x - m.x, ship.y - m.y) < 8) { ship.charmT = 2.6; ship.charmBy = m; hurt(Math.round(dmg * 0.5), m); api.log("A canção da sereia encantou a tripulação: o barco vai até ela!", "warn"); } } }
        else { const want = sd > 8 ? 1 : sd < 5 ? -1 : 0; m.orbit += dt * 0.5;
          steer(m, want > 0 ? ship.x : want < 0 ? m.x * 2 - ship.x : ship.x + Math.cos(m.orbit) * 7, want > 0 ? ship.y : want < 0 ? m.y * 2 - ship.y : ship.y + Math.sin(m.orbit) * 6, d.speed, 2, dt);
          if (m.cd <= 0 && sd < 8) { m.singT = 1.4; warns.push({ x: m.x, y: m.y, t: 1.4, life: 1.4, r: 8, dmg: 0, m, kind: "song" }); SND.play("lute"); } }
      } else if (d.kind === "claw") { // caranguejo: garrada na frente; depois se fecha atrás das garras
        m.guardT = Math.max(0, (m.guardT || 0) - dt);
        if (m.clawT > 0) { m.clawT -= dt; m.v *= 0.8;
          if (m.clawT <= 0) { m.guardT = 1.6; m.cd = 3.5; SND.play("slam"); api.shake(0.15); const cx = m.x + Math.cos(m.a) * 1.4, cy = m.y + Math.sin(m.a) * 1.4; api.fx.burst(cx, cy, ["#e8f6ff", "#8fc1ee"], 12, 2.6);
            if (Math.hypot(ship.x - cx, (ship.y - cy) / 0.8) < 1.5 + ship.s.beam * 0.5) hurt(Math.round(dmg * 1.3), m); } }
        else { steer(m, ship.x, ship.y, sd > 2 ? d.speed : 0.2, 2, dt);
          if (m.cd <= 0 && sd < 3.2) { m.a = Math.atan2(ship.y - m.y, ship.x - m.x); m.clawT = 0.9; warns.push({ x: m.x + Math.cos(m.a) * 1.4, y: m.y + Math.sin(m.a) * 1.4, t: 0.9, life: 0.9, r: 1.5, dmg: 0, m, kind: "claw" }); SND.play("warn"); } }
      } else if (d.kind === "boulder") { // golem de coral: atira pedras de coral (o círculo laranja marca onde caem)
        const want = sd > 9 ? 1 : sd < 6 ? -1 : 0; steer(m, want > 0 ? ship.x : want < 0 ? m.x * 2 - ship.x : m.x, want > 0 ? ship.y : want < 0 ? m.y * 2 - ship.y : m.y, want ? d.speed : 0.2, 1.5, dt);
        m.throwT = Math.max(0, (m.throwT || 0) - dt);
        if (m.cd <= 0 && sd < 11) { m.cd = 4.2; m.throwT = 0.6; const tx = ship.x + Math.cos(ship.a) * ship.v * 1.3, ty = ship.y + Math.sin(ship.a) * ship.v * 1.3;
          warns.push({ x: tx, y: ty, t: 1.4, life: 1.4, r: 1.4, dmg: Math.round(dmg * 1.2), m, kind: "boulder", fx0: m.x, fy0: m.y }); SND.play("slam"); }
      } else if (d.kind === "breach") { // orcas: mergulham e saltam por baixo do barco
        if (m.breachT > 0) { m.breachT -= dt; if (m.breachT <= 0.6 && m.hidden) { m.hidden = false; m.x = m.bx0; m.y = m.by0; SND.play("slam"); api.fx.burst(m.x, m.y, ["#ffffff", "#bfe8ff", "#8fc1ee"], 22, 3.6); api.shake(0.2);
            if (ship && Math.hypot(ship.x - m.x, ship.y - m.y) < R + 1.2) { hurt(Math.round(dmg * 1.4), m); ship.tilt = 1; } } }
        else if (m.hidden) { steer(m, m.bx0, m.by0, d.speed * 1.6, 5, dt); }
        else { m.orbit += dt * 0.8; steer(m, ship.x + Math.cos(m.orbit) * 5.5, ship.y + Math.sin(m.orbit) * 4.4, d.speed * 0.8, 2.4, dt);
          if (m.cd <= 0 && sd < 8) { m.cd = 5 + rand() * 2; m.hidden = true; m.bx0 = ship.x + Math.cos(ship.a) * ship.v * 1.4; m.by0 = ship.y + Math.sin(ship.a) * ship.v * 1.4; m.breachT = 1.6;
            warns.push({ x: m.bx0, y: m.by0, t: 1.0, life: 1.0, r: 1.6, dmg: 0, m, kind: "breach" }); api.fx.burst(m.x, m.y, ["#2a3a4a", "#8fc1ee"], 8, 1.8); } }
      } else if (d.kind === "boss") { // polvo: tentáculos batem onde o barco vai estar; jato de tinta deixa o barco lento
        const angry = m.hp < m.max * 0.4; m.a += clamp(B.angDiff(Math.atan2(ship.y - m.y, ship.x - m.x), m.a), -0.8 * dt, 0.8 * dt);
        if (m.cd <= 0) {
          m.cd = angry ? 2.4 : 3.2;
          if (rand() < 0.62) { const n = angry ? 4 : 3; for (let i = 0; i < n; i++) { const lead = 0.8 + i * 0.35, x = ship.x + Math.cos(ship.a) * ship.v * lead + (rand() - 0.5) * 2.4, y = ship.y + Math.sin(ship.a) * ship.v * lead + (rand() - 0.5) * 2;
              if (isSea(x, y)) warns.push({ x, y, t: 1.25 + i * 0.12, life: 1.25 + i * 0.12, r: 1.35, dmg: Math.round(dmg * 1.25), m }); } SND.play("warn"); }
          else { mobBall(m, ship.x, ship.y, 6.5, Math.round(dmg * 0.6), "ink"); SND.play("splash"); }
        }
      }
    }
    const hullR = () => (ship ? ship.s.beam + 0.35 : 1);
    function hurt(dmg, src) {
      if (!ship) return; const p = P(); dmg = Math.max(1, Math.round(dmg * (1 - ship.s.armor)));
      ship.hp -= dmg; ship.hurtT = 0; p.flash = 0.14; p.lastHurt = api.tickN(); api.shake(0.12); SND.play("hurt");
      api.fx.hitSplat(ship.x, ship.y - 0.8, dmg, "#ff5a4a"); api.fx.burst(ship.x, ship.y - 0.3, ["#8a5a2a", "#c9955a"], 6, 2.4);
      if (ship.hp <= 0) sink(); else api.hud();
    }
    function killMob(m) {
      m.dead = true; m.deadT = 0; m.aggro = false; const d = m.d, p = P();
      const xp = Math.max(2, Math.round(m.L * 2.2 * d.xp)); api.gainXp("navegacao", xp);
      api.fx.addFloat(m.x, m.y - 1, `+${xp} xp`, "#8fd3ff", 1.1, 12); api.fx.burst(m.x, m.y, ["#e8f6ff", "#8fc1ee", "#ffffff"], 22, 3.4); SND.play(d.boss ? "rare" : "splash");
      const items = []; for (const [n, ch, a, b] of d.drops || []) if (rand() < ch) items.push([n, a ? a + Math.floor(rand() * ((b || a) - a + 1)) : 1]);
      crates.push({ x: m.x, y: m.y, coins: Math.round(m.L * (1.5 + rand() * 1.5) * (d.coins || 1)), items, t: 0, big: !!d.boss });
      p.stats.seaKills = (p.stats.seaKills || 0) + 1; api.emit("seakill:" + m.type); m.respawnAt = Date.now() + RESPAWN_MS; // rodada 165: volta em 3 minutos
      if (d.boss) { if (m.lair) { m.lair.respawnAt = Date.now() + 15 * 60 * 1000; m.lair.mob = null; } api.toast(`${d.name} derrotado!`, "O baú dele ficou boiando. Passe por cima para pegar.", "#c47aff"); warns.length = 0; }
      api.log(`${d.name} (nv ${m.L}) afundou. +${xp} xp de ${SKILLS.navegacao}.`, "gold");
    }
    function hitMob(m, dmg, b) {
      if (m.d.kind === "ram" && b && (b.vx * Math.cos(m.a) + b.vy * Math.sin(m.a)) / (Math.hypot(b.vx, b.vy) || 1) < -0.5) { // tiro de frente no casco de ferro
        dmg = Math.max(1, Math.round(dmg * 0.3)); api.fx.addFloat(m.x, m.y - 1.1, "casco!", "#c8c8d0", 0.8, 11); SND.play("clang"); }
      if (m.d.kind === "claw" && m.guardT > 0) { dmg = Math.max(1, Math.round(dmg * 0.3)); api.fx.addFloat(m.x, m.y - 1.1, "garras!", "#c8c8d0", 0.8, 11); SND.play("clang"); } // rodada 166
      if (m.grabT > 0) m.grabDmg = (m.grabDmg || 0) + dmg;
      m.hp -= dmg; m.flash = 0.15; m.aggro = true;
      api.fx.hitSplat(m.x, m.y - 0.7 - (m.d.boss ? 1 : 0), dmg, "#ffd23a"); api.fx.burst(m.x, m.y - 0.2, ["#e8f6ff", "#8fc1ee"], 6, 2);
      if (m.hp <= 0) killMob(m);
    }
    // ---------------- balas, alertas, caixotes ----------------
    function updateBalls(dt) {
      for (let i = balls.length - 1; i >= 0; i--) {
        const b = balls[i]; b.t += dt; b.x += b.vx * dt; b.y += b.vy * dt; let hit = false;
        if (b.fx) { /* espinhos do baiacu: só o efeito (o dano é na explosão) */ }
        else if (b.mine) { for (const m of mobs) if (!m.dead && !m.hidden && Math.hypot(m.x - b.x, (m.y - b.y) / (m.d.boss ? 0.8 : 1)) < m.d.radius + 0.55) { hitMob(m, b.dmg, b); hit = true; break; } }
        else if (ship && segDist(b.x, b.y) < ship.s.beam + 0.3) { hurt(b.dmg, null); if (b.kind === "ink") { ship.inkT = 4; api.log("Tinta de polvo no casco: o barco ficou lento!", "warn"); }
          if (b.kind === "harpoon" && b.src && !b.src.dead) { const a = Math.atan2(b.src.y - ship.y, b.src.x - ship.x), nx = ship.x + Math.cos(a) * 1.6, ny = ship.y + Math.sin(a) * 1.6; // rodada 166: o arpão puxa
            if (hullFree(nx, ny, ship.a, ship.s)) { ship.x = nx; ship.y = ny; } ship.heldT = Math.max(ship.heldT || 0, 0.6); api.log("O arpão do afogado fisgou o casco e puxou o barco!", "warn"); }
          hit = true; }
        if (hit || b.t >= b.life || (!isSea(b.x, b.y) && distAt(b.x, b.y) === 0)) {
          if (b.fx) { /* nada */ } else if (!hit) { rings.push({ x: b.x, y: b.y, t: 0, life: 0.5, r: 0.7, c: "#e8f6ff", w: 2 }); api.fx.burst(b.x, b.y, ["#e8f6ff", "#8fc1ee"], 5, 1.6); }
          else if (b.kind === "ink") api.fx.burst(b.x, b.y, ["#2a2238", "#4a3a60"], 14, 2.2);
          else api.fx.sparks(b.x, b.y - 0.3, 6, ["#fff6c0", "#ffb040", "#8a5a2a"], 4);
          balls.splice(i, 1);
        }
      }
      for (let i = warns.length - 1; i >= 0; i--) {
        const w = warns[i]; w.t -= dt;
        if (w.t <= 0) { warns.splice(i, 1);
          if (w.kind === "bubbles" || w.kind === "shadow" || w.kind === "dive" || w.kind === "song" || w.kind === "claw" || w.kind === "breach") continue; // o dano vem do próprio monstro
          if (w.kind === "boulder") { rings.push({ x: w.x, y: w.y, t: 0, life: 0.5, r: w.r + 0.3, c: "#ffb070", w: 4 }); api.fx.burst(w.x, w.y, ["#f0a080", "#e8f6ff", "#8a7a70"], 16, 3); SND.play("slam");
            if (ship && Math.hypot(ship.x - w.x, (ship.y - w.y) / 0.8) < w.r + ship.s.beam * 0.5) hurt(w.dmg, w.m); continue; }
          if (w.kind === "ice") { rings.push({ x: w.x, y: w.y, t: 0, life: 0.5, r: w.r + 0.3, c: "#e8faff", w: 4 }); api.fx.burst(w.x, w.y, ["#ffffff", "#bfefff", "#8fd8ff"], 16, 3.2); SND.play("clang"); icicles.push({ x: w.x, y: w.y, t: 0 });
            if (ship && Math.hypot(ship.x - w.x, (ship.y - w.y) / 0.8) < w.r + ship.s.beam * 0.5) { hurt(w.dmg, w.m); ship.inkT = Math.max(ship.inkT, 2.5); } continue; }
          rings.push({ x: w.x, y: w.y, t: 0, life: 0.6, r: w.r + 0.4, c: "#c47aff", w: 5 }); api.fx.burst(w.x, w.y, ["#e8f6ff", "#8a6ab0", "#ffffff"], 16, 3.2); SND.play("slam");
          w.slamT = 0.7; tentacles.push({ x: w.x, y: w.y, t: 0 });
          if (ship && Math.hypot(ship.x - w.x, (ship.y - w.y) / 0.8) < w.r + ship.s.beam * 0.5) hurt(w.dmg, w.m); }
      }
      for (let i = rings.length - 1; i >= 0; i--) if ((rings[i].t += dt) >= rings[i].life) rings.splice(i, 1);
      for (let i = tentacles.length - 1; i >= 0; i--) if ((tentacles[i].t += dt) >= 0.9) tentacles.splice(i, 1);
      for (let i = icicles.length - 1; i >= 0; i--) if ((icicles[i].t += dt) >= 1.1) icicles.splice(i, 1);
      for (let i = lines.length - 1; i >= 0; i--) if ((lines[i].t -= dt) <= 0 || lines[i].m.dead) lines.splice(i, 1);
      for (let i = bolts.length - 1; i >= 0; i--) if ((bolts[i].t += dt) >= bolts[i].life) bolts.splice(i, 1);
      { const W0 = P().boat.wrecks || []; for (let i = W0.length - 1; i >= 0; i--) { const w = W0[i];
          if (Date.now() > w.until) { W0.splice(i, 1); continue; }
          if (ship && Math.hypot(w.x - ship.x, w.y - ship.y) < hullR() + 0.9) { if (takeWreck(w)) W0.splice(i, 1); } else w.full = 0; } }
      for (let i = crates.length - 1; i >= 0; i--) {
        const c = crates[i]; c.t += dt;
        if (ship && Math.hypot(c.x - ship.x, c.y - ship.y) < hullR() + 0.9) { takeCrate(c); crates.splice(i, 1); continue; }
        if (c.t > 120) crates.splice(i, 1);
      }
    }
    const tentacles = [], icicles = [], lines = [], bolts = [];
    function lineDist(x, y, ax, ay, bx, by) { const vx = bx - ax, vy = by - ay, k = clamp(((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy || 1), 0, 1); return Math.hypot(x - ax - vx * k, y - ay - vy * k); }
    function segDist(x, y) { // distância até a linha proa-popa do casco
      const c = Math.cos(ship.a), s = Math.sin(ship.a) * ELEV_Y, L = ship.s.len, ax = ship.x - c * L, ay = ship.y - s * L, bx = ship.x + c * L, by = ship.y + s * L;
      const vx = bx - ax, vy = by - ay, k = clamp(((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy || 1), 0, 1);
      return Math.hypot(x - ax - vx * k, y - ay - vy * k);
    }
    function takeCrate(c) {
      const p = P(); p.coins += c.coins; SND.play("coin"); api.fx.addFloat(c.x, c.y - 0.6, `+${c.coins} moedas`, "#ffd84a", 1.2, 12);
      for (const [n, q] of c.items) { if (api.canAdd(n, q)) { api.addItem(n, q); api.fx.addFloat(c.x, c.y - 1.0, `+${q} ${n}`, ITEMS[n].rare ? "#c47aff" : "#ffffff", 1.4, 12); if (ITEMS[n].rare) SND.play("rare"); }
        else api.log(`Mochila cheia: ${q} ${n} ficou no mar.`, "warn"); }
      api.hud();
    }
    // ---------------- a luta da linha ----------------
    const MOODS = { calmo: { name: "Calmo", c: "#e8e0c8", pull: 5 }, cansado: { name: "Cansado", c: "#6fc4ff", pull: -10 }, bravo: { name: "Bravo!", c: "#ff6b5a", pull: 24 } };
    const ACTS = [null, { key: 1, name: "Recolher", cd: 0.45 }, { key: 2, name: "Puxão forte", cd: 2.2 }, { key: 3, name: "Dar linha", cd: 1.1 }];
    const CAST = 4.6; // alcance da vara (tiles), do barco ou da beira d'água
    const inArea = (sp, x, y) => Math.abs(Math.floor(x) - sp.cx) <= sp.r && Math.abs(Math.floor(y) - sp.cy) <= sp.r;
    function castPoint(sp, fx0, fy0) { // tile da área mais perto de (fx0, fy0)
      const tx = clamp(Math.floor(fx0), sp.cx - sp.r, sp.cx + sp.r), ty = clamp(Math.floor(fy0), sp.cy - sp.r, sp.cy + sp.r); return { tx, ty, x: tx + 0.5, y: ty + 0.5 };
    }
    const fromPt = () => (ship ? { x: ship.x, y: ship.y } : { x: P().px + 0.5, y: P().py + 1 });
    function spotNear() { // área ao alcance do barco (parado ou devagar): o mar só se pesca navegando
      if (!ship) return null;
      const f = fromPt(); let best = null, bd = CAST + ship.s.beam;
      for (const sp of spots) { if (sp.gone > 0) continue; if (Math.abs(sp.cx - f.x) > 12 || Math.abs(sp.cy - f.y) > 12) continue;
        const c = castPoint(sp, f.x, f.y), d = Math.hypot(c.x - f.x, c.y - f.y); if (d < bd) { bd = d; best = { sp, ...c }; } }
      return best;
    }
    function baitInUse() { const p = P(), b = p.boat.bait; return b && api.count(b) > 0 ? b : null; }
    // lança a linha num tile da área (tx, ty); sem tile, o mais perto
    function fishStart(spot, tx, ty) {
      const p = P(); if (fish || !spot) return false;
      if (spot.sp) { tx = spot.tx; ty = spot.ty; spot = spot.sp; }
      if (!ship) { api.log("As áreas de pesca do mar só se pescam navegando: pegue o seu barco no cais.", "dim"); return false; }
      if (ship && Math.abs(ship.v) > 1.6) { api.log("Devagar! Pare o barco perto da área de pesca para lançar a linha.", "dim"); return false; }
      const f = fromPt(), c = tx == null ? castPoint(spot, f.x, f.y) : { x: tx + 0.5, y: ty + 0.5 };
      if (Math.hypot(c.x - f.x, c.y - f.y) > CAST + (ship ? ship.s.beam : 0) + 0.3) { api.log("Longe demais: chegue mais perto da área de pesca.", "dim"); return false; }
      const bait = baitInUse(), Bt = BAITS[bait] || {};
      fish = { phase: "wait", t: 0, bite: (2.2 + rand() * 3.2) * (Bt.bite || 1) * (spot.big ? 0.85 : 1), spot, bait, onFoot: !ship, bob: { x: c.x, y: c.y }, castT: 0 };
      if (!ship) { p.cast = { sea: true, t: 0, landed: false, spot: { x: c.x - 0.5, y: c.y - 0.5 } }; p.dir = dir8(Math.atan2(c.y - f.y, c.x - f.x)); } // a pé, a vara do herói; no barco, a linha sai do barco
      p.target = null; p.path = []; p.job = null;
      SND.play("whoosh"); panel(true); return true;
    }
    function fishStop(silent, msg) { if (!fish) return; fish = null; const p = P(); p.cast = null; panel(false); if (msg && !silent) api.log(msg, "dim"); }
    function fishBite() {
      const p = P(), z = fish.spot.zone, pesca = api.lv("pesca");
      if (fish.bait) { api.removeItem(fish.bait, 1); if (!api.count(fish.bait)) api.log(`Acabou a ${fish.bait.toLowerCase()}.`, "dim"); }
      const f = B.rollFish(B.catchTable(z, pesca, fish.bait, fish.spot.deep), rand());
      const tm = { comum: 24, raro: 28, epico: 32, lendario: 38 }[f.rar];
      Object.assign(fish, { phase: "fight", f, hp: f.hp * (fish.spot.deep ? 1.1 : 1), max: f.hp * (fish.spot.deep ? 1.1 : 1), T: 18, time: tm, timeMax: tm, mood: "calmo", moodT: 1.2, cd: [0, 0, 0, 0], power: B.reelPower(pesca, f.req, api.rodTier()) });
      if (p.cast) p.cast.tug = true; fish.tug = true; SND.play("splash"); api.fx.addFloat(fish.bob.x, fish.bob.y - 0.5, "Fisgou!", "#ffd84a", 0.9, 14);
      api.fx.burst(fish.bob.x, fish.bob.y, ["#e8f6ff", "#8fc1ee"], 10, 2);
      if (f.rar === "lendario") { SND.play("rare"); api.log("Algo ENORME mordeu a isca!", "gold"); }
    }
    function fishAct(k) {
      if (!fish || fish.phase !== "fight") return false; const A = ACTS[k]; if (!A) return false;
      if (fish.cd[k] > 0) return true; fish.cd[k] = A.cd;
      const M = fish.mood, tired = M === "cansado", angry = M === "bravo";
      if (k === 3) { fish.T = Math.max(0, fish.T - 36); fish.hp = Math.min(fish.max, fish.hp + fish.max * 0.035); SND.play("whoosh"); }
      else {
        const dmg = fish.power * (k === 2 ? 2.8 : 1) * (tired ? 2 : angry ? (k === 2 ? 0.6 : 0.5) : 1);
        fish.T += (k === 2 ? 26 : 9) * (angry ? (k === 2 ? 1.7 : 2) : 1); fish.hp -= dmg; SND.play(k === 2 ? "hit" : "reel");
        api.fx.burst(fish.bob.x, fish.bob.y, ["#e8f6ff", "#8fc1ee"], k === 2 ? 8 : 3, k === 2 ? 2.2 : 1.2);
        if (fish.hp <= 0) { fishCaught(); return true; }
        if (fish.T >= 100) { fishLose("A linha arrebentou! O peixe levou a isca.", true); return true; }
      }
      panel(true); return true;
    }
    function fishLose(msg, snap) { const p = P(); SND.play(snap ? "snap" : "splash"); api.fx.burst(fish.bob.x, fish.bob.y, ["#e8f6ff", "#8fc1ee"], 12, 2.6); api.log(msg, "warn"); fish = null; p.cast = null; panel(false); }
    function fishCaught() {
      const p = P(), f = fish.f, kg = B.weightRoll(f, rand()), R = RARITY[f.rar] || RARITY.comum, spot = fish.spot, bob = fish.bob;
      const j = p.boat.journal[f.item] || (p.boat.journal[f.item] = { n: 0, kg: 0 }), first = j.n === 0, rec = kg > j.kg, prev = j.kg;
      j.n++; if (rec) j.kg = kg;
      if (api.canAdd(f.item, 1)) api.addItem(f.item, 1); else api.log("Mochila cheia: você soltou o peixe de volta no mar.", "warn");
      const xp = f.xp + (first ? f.xp : 0); api.gainXp("pesca", xp); api.emit("gather:" + f.item); p.stats.fish = (p.stats.fish || 0) + 1; api.checkAch();
      const to = ship ? { x: ship.x, y: ship.y - 0.6 } : { x: p.px + 0.5, y: p.py + 0.2 };
      api.fx.arc(api.SPR[ITEMS[f.item].icon], bob.x, bob.y, to.x, to.y, 0.6, 1.6, 30);
      api.fx.addFloat(bob.x, bob.y - 0.8, `${f.item} · ${fmtKg(kg)}`, R.color, 1.8, 13); api.fx.addFloat(to.x, to.y - 0.6, `+${xp} xp`, "#8fd3ff", 1, 11);
      SND.play(f.rar === "comum" ? "pickup" : "rare");
      api.log(`Pescou ${f.item.toLowerCase()} (${R.name.toLowerCase()}) de ${fmtKg(kg)}${rec && !first ? ` — recorde! (antes ${fmtKg(prev)})` : ""}${first ? " · espécie nova no diário de pesca (XP em dobro)" : ""}.`, f.rar === "comum" ? "dim" : "gold");
      if (rec && !first) api.toast("Recorde de peso!", `${f.item}: ${fmtKg(kg)}`, R.color);
      fish = null; p.cast = null; panel(false);
      if (--spot.charges <= 0) relocate(spot);
    }
    const fmtKg = (kg) => `${kg < 2 ? kg.toFixed(2) : kg.toFixed(1)} kg`.replace(".", ",");
    function relocate(s) { // rodada 164: 30 peixes pescados: a área some e renasce num ponto sorteado do oceano inteiro
      api.fx.burst(s.x, s.y, ["#e8f6ff", "#8fc1ee"], 14, 2.4);
      s.charges = s.max; s.r = rand() < 0.4 ? 1 : 2; s.ph = rand() * 10; placeSpot(s); s.gone = 3;
      api.log("Os peixes desta área acabaram: ela sumiu e renasceu em outro ponto do oceano. Procure o anzol na água.", "dim");
    }
    function updateFish(dt) {
      const p = P();
      if (!fish) return;
      if (fish.onFoot && (p.path.length || p.prog < 1 || p.target)) { fishStop(false, "Você recolheu a linha."); return; }
      if (fish.phase === "wait") { fish.t += dt; if (fish.t >= fish.bite) fishBite(); return; }
      for (let k = 1; k <= 3; k++) fish.cd[k] = Math.max(0, fish.cd[k] - dt);
      fish.time -= dt; fish.moodT -= dt;
      if (fish.moodT <= 0) { const r = rand(); fish.mood = fish.mood !== "calmo" ? "calmo" : r < 0.5 ? "cansado" : "bravo"; fish.moodT = fish.mood === "calmo" ? 1.4 + rand() * 1.8 : 1.6 + rand() * 1.1;
        if (fish.mood === "bravo") { SND.play("warn"); api.fx.burst(fish.bob.x, fish.bob.y, ["#e8f6ff"], 8, 2.6); } }
      fish.T = clamp(fish.T + MOODS[fish.mood].pull * dt * (fish.f.rar === "lendario" ? 1.3 : 1), 0, 100);
      if (fish.T >= 100) return fishLose("A linha arrebentou! O peixe levou a isca.", true);
      if (fish.time <= 0) return fishLose("O peixe se soltou e fugiu para o fundo.");
      if ((hudT += dt) > 0.1) { hudT = 0; panel(true); }
    }
    function panel(show) {
      const el = document.getElementById("seafish"); if (!el) return;
      if (!show || !fish) { el.hidden = true; el.dataset.k = ""; return; }
      el.hidden = false; const f = fish.f, bait = fish.bait;
      if (fish.phase === "wait") {
        const h = `<div class="sf-title">Linha na água${fish.spot.deep ? " · mar fundo" : ""}</div><div class="sf-wait">Esperando o peixe morder<span class="dots">...</span></div>
          <small>${bait ? `Isca: ${esc(bait)} (${api.count(bait)})` : "Sem isca (o anão do píer vende iscas)"} · <button data-sfx="x">Recolher linha</button></small>`;
        if (el.dataset.k !== "w") { el.dataset.k = "w"; el.innerHTML = h; } return;
      }
      const R = RARITY[f.rar] || RARITY.comum, M = MOODS[fish.mood], pct = (v) => Math.round(clamp(v, 0, 1) * 100);
      const btn = (k) => { const A = ACTS[k], c = fish.cd[k] / A.cd; return `<button data-sfx="${k}" class="${c > 0 ? "cd" : ""}" style="--p:${c.toFixed(2)}"><b>${k}</b> ${A.name}</button>`; };
      el.dataset.k = "f";
      el.innerHTML = `<div class="sf-title"><b style="color:${R.color}">${esc(f.item)}</b> <small>${esc(R.name)}</small><span class="sf-mood" style="color:${M.c}">${M.name}</span></div>
        <div class="sf-bar"><span>Fôlego</span><i class="hp" style="width:${pct(fish.hp / fish.max)}%"></i></div>
        <div class="sf-bar ten${fish.T > 80 ? " danger" : ""}"><span>Tensão</span><i style="width:${pct(fish.T / 100)}%"></i><em style="left:80%"></em></div>
        <div class="sf-bar time"><span>Tempo</span><i style="width:${pct(fish.time / fish.timeMax)}%"></i></div>
        <div class="sf-btns">${btn(1)}${btn(2)}${btn(3)}</div>
        <small class="sf-tip">${fish.mood === "cansado" ? "Cansado: puxe agora, rende o dobro!" : fish.mood === "bravo" ? "Bravo: a linha estica sozinha. Dê linha (3)!" : "Recolha com calma e guarde o puxão para quando ele cansar."}</small>`;
    }
    document.addEventListener("click", (e) => { const b = e.target.closest && e.target.closest("[data-sfx]"); if (!b) return; e.stopPropagation(); if (b.dataset.sfx === "x") fishStop(false, "Você recolheu a linha."); else fishAct(+b.dataset.sfx); });
    // ---------------- passo do mundo ----------------
    function update(dt) {
      if (!ready) return; const p = P();
      wind.t -= dt; if (wind.t <= 0) { wind.to = wind.a + (rand() - 0.5) * 2.4; wind.t = 45 + rand() * 50; }
      wind.a += clamp(B.angDiff(wind.to, wind.a), -0.03 * dt, 0.03 * dt);
      for (const s of spots) if (s.gone > 0) s.gone -= dt;
      if (ship) sail(dt);
      if (fish) updateFish(dt);
      if (mobs.length) {
        if ((spawnT -= dt) <= 0) { spawnT = 1; populate(); }
        const cx = ship ? ship.x : p.px + 0.5, cy = ship ? ship.y : p.py + 1;
        for (const m of mobs) if (m.dead ? m.deadT < 1.5 : Math.abs(m.x - cx) < 60 && Math.abs(m.y - cy) < 60) updateMob(m, dt);
        updateBalls(dt);
      }
      if (!ship && !p.sailing) { balls.length = 0; warns.length = 0; }
    }
    function sail(dt) {
      const p = P(), s = ship.s, kv = api.keyVec();
      let want = null;
      ship.charmT = Math.max(0, (ship.charmT || 0) - dt); // rodada 166: encantado pela sereia
      if (ship.charmT > 0 && ship.charmBy && !ship.charmBy.dead) { want = Math.atan2(ship.charmBy.y - ship.y, ship.charmBy.x - ship.x); autopilot = null; }
      else if (fish && !fish.onFoot) want = null;
      else if (kv) { want = Math.atan2(kv[1], kv[0]); autopilot = null; }
      else if (autopilot) { const dx = autopilot.x - ship.x, dy = autopilot.y - ship.y, d = Math.hypot(dx, dy); if (d < 0.8) autopilot = null; else want = Math.atan2(dy, dx); }
      const turn = s.turn * (0.45 + 0.55 * Math.min(1, Math.abs(ship.v) / 2.5));
      if (want != null) ship.a += clamp(B.angDiff(want, ship.a), -turn * dt, turn * dt);
      ship.a = (ship.a + TAU) % TAU;
      ship.heldT = Math.max(0, (ship.heldT || 0) - dt); ship.stunT = Math.max(0, (ship.stunT || 0) - dt); // rodada 163: lula agarrando, choque da arraia
      const wf = B.windFactor(ship.a, wind.a), vmax = BASE_SPEED * s.speed * wf * (ship.inkT > 0 ? 0.5 : 1) * (ship.stunT > 0 ? 0.5 : 1) * (ship.heldT > 0 ? 0 : 1);
      let target = 0;
      if (want != null) { const dd = Math.abs(B.angDiff(want, ship.a)); target = vmax * Math.max(0.2, Math.cos(Math.min(dd, Math.PI / 2))); if (autopilot) target *= Math.min(1, Math.hypot(autopilot.x - ship.x, autopilot.y - ship.y) / 3 + 0.25); }
      ship.v += (target - ship.v) * Math.min(1, (target > ship.v ? 0.55 : 1.0) * dt);
      if (Math.abs(ship.v) < 0.02 && target === 0) ship.v = 0;
      const nx = ship.x + Math.cos(ship.a) * ship.v * dt, ny = ship.y + Math.sin(ship.a) * ship.v * dt;
      if (hullFree(nx, ny, ship.a, s)) { ship.x = nx; ship.y = ny; }
      else { if (Math.abs(ship.v) > 2.4) { SND.play("hit"); api.shake(0.1); api.fx.burst(ship.x + Math.cos(ship.a) * s.len, ship.y + Math.sin(ship.a) * s.len * ELEV_Y, ["#e8f6ff", "#c9955a"], 8, 2); } ship.v *= -0.2; autopilot = null; }
      const n = B.sailXp(p.boat, Math.abs(ship.v) * dt); if (n) api.gainXp("navegacao", n);
      ship.cdL = Math.max(0, ship.cdL - dt); ship.cdR = Math.max(0, ship.cdR - dt); ship.inkT = Math.max(0, ship.inkT - dt); ship.hurtT += dt; ship.tilt *= Math.exp(-dt * 4);
      if (ship.hurtT > 8 && ship.hp < s.maxHp) ship.hp = Math.min(s.maxHp, ship.hp + s.maxHp * 0.004 * dt); // fora de combate o casco se ajeita devagar
      p.boat.hp = Math.round(ship.hp);
      // espuma: rastro na popa e borrifo na proa
      if ((ship.foamT -= dt) <= 0 && Math.abs(ship.v) > 0.4) {
        ship.foamT = 0.07; const c = Math.cos(ship.a), sn = Math.sin(ship.a);
        wake.push({ x: ship.x - c * s.len * 0.95, y: ship.y - sn * s.len * 0.95 * ELEV_Y, t: 0, life: 1.6, a: ship.a, w: s.beam });
        if (Math.abs(ship.v) > 3 && rand() < 0.5) api.fx.burst(ship.x + c * s.len, ship.y + sn * s.len * ELEV_Y, ["#ffffff", "#d8f0ff"], 2, 1.4, 0.4);
      }
      for (let i = wake.length - 1; i >= 0; i--) if ((wake[i].t += dt) >= wake[i].life) wake.splice(i, 1);
      sync();
    }
    // ---------------- desenho ----------------
    const X = (x) => x * TILE - api.cam.x, Y = (y) => y * TILE - api.cam.y;
    function drawBoat(k16, A, img, x, y, front, alpha) {
      const ctx = api.ctx(), sc = TILE / A.pxTile, sx = k16 * A.cw, sy = front ? A.ch : 0;
      if (alpha != null) ctx.globalAlpha = alpha;
      ctx.drawImage(img, sx, sy, A.cw, A.ch, Math.round(X(x) - A.ox * sc), Math.round(Y(y) - A.oy * sc), Math.round(A.cw * sc), Math.round(A.ch * sc));
      ctx.globalAlpha = 1;
    }
    function waterShadow(x, y, a, len, beam, alpha) {
      const ctx = api.ctx(); ctx.save(); ctx.translate(X(x), Y(y)); ctx.scale(1, ELEV_Y); ctx.rotate(a);
      ctx.fillStyle = `rgba(8,28,48,${alpha})`; ctx.beginPath(); ctx.ellipse(0, 0, (len + 0.2) * TILE, (beam + 0.15) * TILE, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = "rgba(230,246,255,0.35)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, (len + 0.3) * TILE, (beam + 0.25) * TILE, 0, 0, TAU); ctx.stroke(); ctx.restore();
    }
    // rodada 163: a bordo, o barco é o personagem (como no RavenQuest): o herói não aparece; o nome fica em cima das velas e,
    // pescando, a linha sai da borda do barco
    function drawShipEnt(t) {
      const ctx = api.ctx(), s = ship.s, k = B.dir16(ship.a), G = art(s.art), bob = Math.sin(t * 1.7) * 1.5, p = P();
      waterShadow(ship.x, ship.y, ship.a, s.len, s.beam, 0.28);
      if (!G) drawFallbackBoat(ship.x, ship.y, ship.a, s);
      else {
        ctx.save(); ctx.translate(0, bob); drawBoat(k, G.A, G.img, ship.x, ship.y, false); drawBoat(k, G.A, G.img, ship.x, ship.y, true);
        if (p.flash > 0) { ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.35; drawBoat(k, G.A, G.img, ship.x, ship.y, false); ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1; }
        ctx.restore();
      }
      if (fish && !fish.onFoot) drawBoatLine(ctx, t, bob);
      const top = G ? G.A.oy / G.A.pxTile * 0.92 : 1.4;
      api.tag(p.name, ship.x, ship.y - top + 0.1, p.pk > 0 ? "#ff3b30" : "#f1c40f");
    }
    function drawBoatLine(ctx, t, bob) { // vara presa na borda do lado da área e a linha até a boia
      const f = deckFeet(), b = fish.bob, ang = Math.atan2(b.y - f.y, b.x - f.x), side = { x: f.x + Math.cos(ang) * ship.s.beam * 0.8, y: f.y + Math.sin(ang) * ship.s.beam * 0.5 };
      const bx0 = X(side.x), by0 = Y(side.y) - 6 + bob, tipX = bx0 + Math.cos(ang) * 18, tipY = by0 - 30;
      ctx.strokeStyle = "#5a3a1e"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bx0, by0); ctx.lineTo(tipX, tipY); ctx.stroke();
      fish.castT = (fish.castT || 0) + 1 / 60; const k = Math.min(1, fish.castT / 0.45);
      let bx = X(b.x), by = Y(b.y) + Math.sin(t * 4) * 2;
      if (k < 1) { bx = tipX + (bx - tipX) * k; by = tipY + (by - tipY) * k - Math.sin(Math.PI * k) * 40; }
      if (fish.tug) { bx += Math.sin(t * 31) * 2.5; by += 4 + Math.sin(t * 23) * 2; }
      ctx.strokeStyle = "#ffffffcc"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.quadraticCurveTo((tipX + bx) / 2, Math.max(tipY, by) + (k >= 1 ? 14 : -10), bx, by); ctx.stroke();
      ctx.fillStyle = "#e0402a"; ctx.fillRect(Math.round(bx) - 3, Math.round(by) - 3, 6, 4); ctx.fillStyle = "#fff"; ctx.fillRect(Math.round(bx) - 3, Math.round(by) + 1, 6, 2);
      if (k >= 1 && k !== fish.landK) { fish.landK = k; api.fx.burst(b.x, b.y, ["#e8f6ff", "#8fc1ee"], 6, 1.4); SND.play("splash"); }
    }
    function drawFallbackBoat(x, y, a, s) {
      const ctx = api.ctx(); ctx.save(); ctx.translate(X(x), Y(y)); ctx.scale(1, ELEV_Y); ctx.rotate(a);
      ctx.fillStyle = "#8a5a32"; ctx.beginPath(); ctx.moveTo(s.len * TILE, 0); ctx.quadraticCurveTo(0, s.beam * TILE * 1.6, -s.len * TILE, s.beam * TILE * 0.8); ctx.lineTo(-s.len * TILE, -s.beam * TILE * 0.8); ctx.quadraticCurveTo(0, -s.beam * TILE * 1.6, s.len * TILE, 0); ctx.fill();
      ctx.strokeStyle = "#2a1a10"; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    }
    function drawWake() {
      const ctx = api.ctx();
      for (const w of wake) { const k = w.t / w.life, r = (w.w + k * 0.9) * TILE; ctx.save(); ctx.translate(X(w.x), Y(w.y)); ctx.scale(1, ELEV_Y); ctx.rotate(w.a);
        ctx.strokeStyle = `rgba(240,250,255,${(1 - k) * 0.5})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.35, r, 0, -1.2, 1.2); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, 0, r * 0.35, r, 0, Math.PI - 1.2, Math.PI + 1.2); ctx.stroke(); ctx.restore(); }
    }
    // rodada 163: área de pesca: água mais clara no quadrado todo, ondulações e peixinhos pelos tiles, contorno pontilhado e o anzol
    // flutuando no meio, como o anzol na água que marca os pontos de pesca no RavenQuest (rodada 167: sem o número de peixes)
    function drawHook(ctx, x, y, big) {
      ctx.fillStyle = "#0c1c2ae6"; ctx.strokeStyle = big ? "#ffd84a" : "#bfe8ff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 11, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "#f4f4ee"; ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(x + 2, y - 7); ctx.lineTo(x + 2, y + 2); ctx.arc(x - 1.5, y + 2, 3.5, 0, Math.PI, false); ctx.lineTo(x - 5, y - 1); ctx.stroke(); ctx.lineCap = "butt";
      ctx.fillStyle = "#f4f4ee"; ctx.fillRect(Math.round(x) + 0, Math.round(y) - 9, 4, 2);
    }
    function drawSpots(t) {
      const ctx = api.ctx(), cx = api.cam.x / TILE, cy = api.cam.y / TILE, vw = api.VW() / TILE, vh = api.VH() / TILE, mine = fish && fish.spot;
      for (const s of spots) {
        if (s.gone > 0 || s.cx + s.r < cx - 1 || s.cy + s.r < cy - 1 || s.cx - s.r > cx + vw + 1 || s.cy - s.r > cy + vh + 1) continue;
        const n = 2 * s.r + 1, x0 = X(s.cx - s.r), y0 = Y(s.cy - s.r), w = n * TILE, pulse = 0.5 + 0.5 * Math.sin(t * 1.6 + s.ph);
        ctx.fillStyle = `rgba(200,236,255,${0.07 + pulse * 0.05 + (mine === s ? 0.05 : 0)})`; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x0 + 3, y0 + 3, w - 6, w - 6, TILE * 0.45) : ctx.rect(x0 + 3, y0 + 3, w - 6, w - 6); ctx.fill();
        ctx.setLineDash([6, 6]); ctx.lineDashOffset = -t * 8; ctx.strokeStyle = s.big ? "rgba(255,226,140,0.55)" : "rgba(220,244,255,0.5)"; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
        for (let ty = s.cy - s.r; ty <= s.cy + s.r; ty++) for (let tx = s.cx - s.r; tx <= s.cx + s.r; tx++) {
          const h = hash(tx, ty, 5), ph = (t * 0.45 + h) % 1, X0 = X(tx + 0.5), Y0 = Y(ty + 0.5);
          if (h > 0.35) { ctx.strokeStyle = `rgba(240,250,255,${(1 - ph) * 0.65})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(X0 + (h - 0.5) * 14, Y0, (0.12 + ph * 0.32) * TILE, (0.06 + ph * 0.16) * TILE, 0, 0, TAU); ctx.stroke(); }
          if (h < 0.5) { const a = t * (0.8 + h) + h * 20, rr = 0.22 * TILE; ctx.fillStyle = s.deep ? "#0c2a40aa" : "#123a4e99"; ctx.save(); ctx.translate(X0 + Math.cos(a) * rr, Y0 + Math.sin(a) * rr * 0.5); ctx.rotate(a + Math.PI / 2); ctx.fillRect(-4, -1.5, 8, 3); ctx.fillRect(3, -2.5, 3, 5); ctx.restore(); }
        }
        const j = (t * 0.6 + s.ph) % 2.4; // um peixe pulando num tile da área
        if (j < 0.5) { const k = j / 0.5, jt = Math.floor((t * 0.6 + s.ph) / 2.4), hx0 = s.cx - s.r + (jt * 7 + s.id) % n, hy0 = s.cy - s.r + (jt * 3 + s.id) % n, hx = X(hx0 + 0.2 + k * 0.6), hy = Y(hy0 + 0.5) - Math.sin(Math.PI * k) * TILE * 0.5;
          ctx.fillStyle = s.deep ? "#ffd86a" : "#d8e8f0"; ctx.save(); ctx.translate(hx, hy); ctx.rotate(-0.8 + k * 1.6); ctx.fillRect(-5, -2, 10, 4); ctx.fillRect(4, -3, 3, 6); ctx.restore(); }
        drawHook(ctx, X(s.x), Y(s.y) - TILE * (0.55 + 0.08 * Math.sin(t * 2.2 + s.ph)), s.big);
      }
    }
    function drawGulls(t) { // gaivotas em volta dos cardumes fundos (por cima de tudo)
      const ctx = api.ctx(), cx = api.cam.x / TILE, cy = api.cam.y / TILE, vw = api.VW() / TILE, vh = api.VH() / TILE;
      for (const s of spots) {
        if (!s.big || s.gone > 0 || s.x < cx - 4 || s.y < cy - 4 || s.x > cx + vw + 4 || s.y > cy + vh + 4) continue;
        for (let g = 0; g < 3; g++) { const a = t * (0.55 + g * 0.12) + s.ph + g * 2.1, x = X(s.x + Math.cos(a) * (1.3 + g * 0.5)), y = Y(s.y - 2.3 - g * 0.35 + Math.sin(a) * 0.55), f = Math.sin(t * 8 + g * 1.7) * 5;
          ctx.fillStyle = "rgba(10,30,50,0.18)"; ctx.beginPath(); ctx.ellipse(x, Y(s.y + Math.sin(a) * 0.55) + 4, 6, 2, 0, 0, TAU); ctx.fill(); // sombra na água
          ctx.strokeStyle = "#2a2a30"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 11, y - f); ctx.quadraticCurveTo(x - 5, y - 6, x, y); ctx.quadraticCurveTo(x + 5, y - 6, x + 11, y - f); ctx.stroke();
          ctx.strokeStyle = "#f6f6f0"; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = "#f0a040"; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 2); }
      }
    }
    function mobArt(m) { return m.d.kind === "ship" ? art(m.d.art) : null; }
    // monstros do Blender (js/sea_art.js): linhas 0-3 nadando, 4-6 atacando; uma coluna por direção
    const SART = window.SEA_ART || {}, SIMG = {};
    function seaArt(k) {
      const A = SART[k]; if (!A) return null;
      if (!SIMG[k]) { SIMG[k] = new Image(); SIMG[k].src = (window.assetV || String)(A.src); }
      return SIMG[k].complete && SIMG[k].naturalWidth ? { A, img: SIMG[k] } : null;
    }
    const FOOT = { bite: [1.1, 0.28], pulse: [0.55, 0.55], spit: [1.6, 0.24], boss: [2.1, 1.7], puff: [0.5, 0.45], pack: [0.8, 0.16], blink: [1.4, 0.2], grab: [1.4, 0.45],
      ram: [0.9, 0.7], zap: [0.9, 0.9], charge: [1.4, 0.3], ice: [1.6, 0.45], leap: [0.4, 0.15], dive: [0.5, 0.35], harpoon: [0.45, 0.4], charm: [0.6, 0.35], claw: [0.9, 1.0], boulder: [0.9, 0.8], breach: [1.4, 0.4] };
    function drawSeaSprite(ctx, m, t, al0) {
      let al = al0;
      const G = seaArt(m.d.art); if (!G) return false;
      const { A, img } = G, d = m.d, k = A.dirs > 1 ? ((Math.round(m.a / (TAU / A.dirs)) % A.dirs) + A.dirs) % A.dirs : 0;
      let row = Math.floor(m.t * 6) % 4;
      if (d.kind === "bite" && m.lunge > 0) row = 4 + Math.min(2, Math.floor((1.4 - m.lunge) / 0.25));
      else if (d.kind === "pulse" && m.charge > 0) row = 4 + Math.min(2, Math.floor((0.9 - m.charge) / 0.3));
      else if (d.kind === "spit" && m.spitT > 0) row = 4 + Math.min(2, Math.floor((0.4 - m.spitT) / 0.14));
      else if (d.kind === "boss" && m.hp < m.max * 0.4) row = 4 + Math.floor(m.t * 4) % 3;
      else if (d.kind === "puff" && m.puffT > 0) row = 4 + Math.min(2, Math.floor((1.1 - m.puffT) / 0.37));
      else if (d.kind === "pack" && m.lunge > 0) row = 4 + Math.min(2, Math.floor((0.9 - m.lunge) / 0.15));
      else if (d.kind === "blink" && m.biteT > 0) row = 4 + Math.min(2, Math.floor((0.45 - m.biteT) / 0.15));
      else if (d.kind === "grab" && m.grabT > 0) row = 4 + Math.floor(m.t * 5) % 3;
      else if ((d.kind === "ram" || d.kind === "ice" || d.kind === "charge") && (m.dashT > 0 || m.aim > 0)) row = 4 + (m.dashT > 0 ? 2 : Math.min(1, Math.floor(m.t * 4) % 2));
      else if (d.kind === "zap" && m.zapT > 0) row = 4 + Math.min(2, Math.floor((1 - m.zapT) / 0.34));
      else if (d.kind === "leap" && m.jumpT > 0) row = 4 + Math.min(2, Math.floor((0.8 - m.jumpT) / 0.27));
      else if (d.kind === "dive" && m.diveT > 0) row = 4 + Math.min(2, Math.floor((0.9 - m.diveT) / 0.3));
      else if ((d.kind === "harpoon" || d.kind === "boulder") && m.throwT > 0) row = 4 + Math.min(2, Math.floor((0.6 - m.throwT) / 0.2));
      else if (d.kind === "charm" && m.singT > 0) row = 4 + Math.floor(m.t * 4) % 3;
      else if (d.kind === "claw" && (m.clawT > 0 || m.guardT > 0)) row = 4 + (m.clawT > 0 ? Math.min(2, Math.floor((0.9 - m.clawT) / 0.3)) : 2);
      else if (d.kind === "breach" && m.breachT > 0 && !m.hidden) row = 4 + Math.min(2, Math.floor((0.6 - m.breachT) / 0.2));
      const F = FOOT[d.kind] || [0.8, 0.4], sink = m.dead ? Math.min(1, m.deadT / 1.2) : 0;
      if (m.hidden) { al *= 0.22; if (rand() < 0.3) api.fx.burst(m.x + (rand() - 0.5), m.y + (rand() - 0.5) * 0.5, ["#2a1a3a", "#8fc1ee"], 1, 0.6, 0.2); } // mergulhada
      waterShadow(m.x, m.y, m.a, F[0], F[1], 0.22 * al);
      const sc = TILE / A.pxTile, x = X(m.x), y = Y(m.y) + sink * 14 + Math.sin(m.t * 1.8) * 1.2 - (m.z || 0) * TILE; // m.z: altura do salto
      ctx.globalAlpha = al; ctx.drawImage(img, k * A.cw, row * A.ch, A.cw, A.ch, Math.round(x - A.ox * sc), Math.round(y - A.oy * sc), Math.round(A.cw * sc), Math.round(A.ch * sc));
      if (d.kind === "pulse" && m.charge > 0) { const ch = 1 - m.charge / 0.9; ctx.strokeStyle = `rgba(190,232,255,${0.3 + ch * 0.6})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, 2.9 * TILE * ch, 2.9 * TILE * ch * 0.55, 0, 0, TAU); ctx.stroke(); }
      ctx.globalAlpha = 1; return true;
    }
    function drawMob(m, t) {
      const ctx = api.ctx(), d = m.d, x = X(m.x), y = Y(m.y), sink = m.dead ? Math.min(1, m.deadT / 1.2) : 0, al = 1 - sink;
      ctx.save(); ctx.globalAlpha = al;
      if (d.kind === "ship") { const G = mobArt(m); waterShadow(m.x, m.y, m.a, 1.45, 0.55, 0.25); if (G) drawBoat(B.dir16(m.a), G.A, G.img, m.x, m.y + sink * 0.5, false, al), drawBoat(B.dir16(m.a), G.A, G.img, m.x, m.y + sink * 0.5, true, al); else drawFallbackBoat(m.x, m.y, m.a, { len: 1.45, beam: 0.55 }); }
      else if (drawSeaSprite(ctx, m, t, al)) { /* arte do Blender */ }
      else if (d.kind === "bite") drawShark(ctx, m, x, y, t);
      else if (d.kind === "pulse") drawJelly(ctx, m, x, y, t);
      else if (d.kind === "spit") drawSerpent(ctx, m, x, y, t);
      else if (d.kind === "boss") drawOctopus(ctx, m, x, y, t);
      if (m.flash > 0) { ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = `rgba(255,255,255,${m.flash * 2})`; ctx.beginPath(); ctx.ellipse(x, y - 8, d.radius * TILE, d.radius * TILE * 0.6, 0, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = "source-over"; }
      ctx.restore();
      if (!m.dead && !m.hidden && (m.aggro || m.hp < m.max)) { // barra de vida e nome
        const w = Math.round(TILE * (d.boss ? 2.4 : 1)), by = y - (d.boss ? 3.1 : d.kind === "ship" ? 2.6 : 1.3) * TILE;
        ctx.fillStyle = "#000c"; ctx.fillRect(x - w / 2 - 1, by - 1, w + 2, 6); ctx.fillStyle = "#3a1a16"; ctx.fillRect(x - w / 2, by, w, 4);
        ctx.fillStyle = d.boss ? "#c47aff" : "#ff5a4a"; ctx.fillRect(x - w / 2, by, Math.round(w * Math.max(0, m.hp / m.max)), 4);
        api.tag(`${d.name} · nv ${m.L}`, m.x, (by - 6 + api.cam.y) / TILE, d.boss ? "#c47aff" : "#ffb0a0", true);
      }
    }
    // tubarão: sombra azul debaixo d'água, barbatana com cicatriz e o arpão quebrado espetado; no bote, a bocarra sai da água
    function drawShark(ctx, m, x, y, t) {
      const a = m.a, sw = Math.sin(m.t * 7) * 0.18, lunge = m.lunge > 0;
      ctx.save(); ctx.translate(x, y); ctx.scale(1, ELEV_Y); ctx.rotate(a + sw * 0.3);
      ctx.fillStyle = "rgba(20,46,72,0.55)"; ctx.beginPath(); ctx.ellipse(0, 0, 0.95 * TILE, 0.3 * TILE, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-0.85 * TILE, 0); ctx.lineTo(-1.25 * TILE, (-0.32 + sw) * TILE); ctx.lineTo(-1.1 * TILE, 0); ctx.lineTo(-1.25 * TILE, (0.32 + sw) * TILE); ctx.closePath(); ctx.fill();
      ctx.fillRect(-0.2 * TILE, -0.55 * TILE, 0.3 * TILE, 0.25 * TILE); ctx.fillRect(-0.2 * TILE, 0.3 * TILE, 0.3 * TILE, 0.25 * TILE);
      ctx.restore();
      const fx0 = x - Math.cos(a) * 0.1 * TILE, fy0 = y - Math.sin(a) * 0.1 * TILE * ELEV_Y, dirx = Math.cos(a) >= 0 ? 1 : -1;
      ctx.fillStyle = "#5f7488"; ctx.strokeStyle = "#1a1418"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(fx0 - 12 * dirx, fy0); ctx.quadraticCurveTo(fx0 - 4 * dirx, fy0 - 26, fx0 + 10 * dirx, fy0 - 30); ctx.lineTo(fx0 + 8 * dirx, fy0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "#c8d4dc"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(fx0 - 2 * dirx, fy0 - 10); ctx.lineTo(fx0 + 4 * dirx, fy0 - 18); ctx.stroke(); // cicatriz
      ctx.strokeStyle = "#6a4a2a"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(fx0 - 14 * dirx, fy0 - 2); ctx.lineTo(fx0 - 22 * dirx, fy0 - 16); ctx.stroke(); // arpão quebrado
      ctx.fillStyle = "#9aa4ac"; ctx.fillRect(fx0 - 16 * dirx - 2, fy0 - 6, 4, 4);
      ctx.strokeStyle = "rgba(240,250,255,0.7)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(fx0, fy0, 14, 4, 0, 0, Math.PI); ctx.stroke();
      if (lunge) { const hx = x + Math.cos(a) * 0.9 * TILE, hy = y + Math.sin(a) * 0.9 * TILE * ELEV_Y, o = 8 + Math.sin(m.t * 18) * 3;
        ctx.fillStyle = "#5f7488"; ctx.strokeStyle = "#1a1418"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(hx, hy - 8, 16, 10, 0, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#3a1a20"; ctx.beginPath(); ctx.ellipse(hx + 6 * dirx, hy - 6, 9, o * 0.6, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = "#ffffff"; for (let i = 0; i < 4; i++) { ctx.fillRect(hx + (i * 4 - 2) * dirx, hy - 6 - o * 0.55, 2, 3); ctx.fillRect(hx + (i * 4 - 2) * dirx, hy - 9 + o * 0.55, 2, 3); }
        ctx.fillStyle = "#ffd23a"; ctx.fillRect(hx - 6 * dirx, hy - 14, 3, 3); }
    }
    // medusa: sino translúcido rosa com pintas acesas, carinha sonolenta e tentáculos ondulando; acende antes do choque
    function drawJelly(ctx, m, x, y, t) {
      const pul = 1 + Math.sin(m.t * 3) * 0.08, ch = m.charge > 0 ? 1 - m.charge / 0.9 : 0, r = 0.62 * TILE * pul;
      if (ch) { ctx.strokeStyle = `rgba(190,232,255,${0.3 + ch * 0.6})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, 2.9 * TILE * ch, 2.9 * TILE * ch * 0.55, 0, 0, TAU); ctx.stroke(); }
      ctx.strokeStyle = "rgba(230,150,220,0.7)"; ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) { const tx = x - r * 0.7 + i * r * 0.28; ctx.beginPath(); ctx.moveTo(tx, y - 4); for (let k = 1; k <= 4; k++) ctx.lineTo(tx + Math.sin(m.t * 4 + i + k) * 4, y - 4 + k * 7); ctx.stroke(); }
      ctx.fillStyle = "rgba(20,46,72,0.35)"; ctx.beginPath(); ctx.ellipse(x, y + 6, r, r * 0.35, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = ch ? `rgba(${200 + ch * 55},${190 + ch * 60},255,0.85)` : "rgba(222,128,214,0.78)"; ctx.strokeStyle = "#3a1438"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(x, y - 6, r, r * 0.72, 0, Math.PI, TAU); ctx.lineTo(x + r, y - 4); ctx.lineTo(x - r, y - 4); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(255,240,255,0.55)"; ctx.beginPath(); ctx.ellipse(x - r * 0.35, y - r * 0.55 - 6, r * 0.25, r * 0.14, -0.4, 0, TAU); ctx.fill();
      ctx.fillStyle = "#c8f4ff"; for (let i = 0; i < 5; i++) ctx.fillRect(Math.round(x - r * 0.6 + i * r * 0.3), Math.round(y - 12 - (i % 2) * 6), 3, 3);
      ctx.fillStyle = "#2a1030"; ctx.fillRect(Math.round(x - 7), Math.round(y - 14), 4, 3); ctx.fillRect(Math.round(x + 3), Math.round(y - 14), 4, 3); // olhos sonolentos
    }
    // serpente: três corcovas saindo da água ao longo do rumo, crista de nadadeira e a cabeça que levanta para cuspir
    function drawSerpent(ctx, m, x, y, t) {
      const a = m.a, c = Math.cos(a), s = Math.sin(a) * ELEV_Y, dirx = c >= 0 ? 1 : -1;
      for (let i = 2; i >= 0; i--) { const k = -0.45 - i * 0.7, px = x + c * k * TILE, py = y + s * k * TILE, hh = (0.42 - i * 0.07) * TILE * (0.85 + Math.sin(m.t * 3 - i) * 0.15);
        ctx.fillStyle = "rgba(20,46,72,0.35)"; ctx.beginPath(); ctx.ellipse(px, py + 2, 0.36 * TILE, 0.12 * TILE, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = i % 2 ? "#2e8a6e" : "#3aa080"; ctx.strokeStyle = "#0e2a22"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(px, py, 0.3 * TILE, hh, 0, Math.PI, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#e8d070"; ctx.beginPath(); ctx.ellipse(px, py - 2, 0.16 * TILE, hh * 0.45, 0, Math.PI, TAU); ctx.fill();
        ctx.strokeStyle = "rgba(240,250,255,0.7)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(px, py, 0.34 * TILE, 4, 0, 0, Math.PI); ctx.stroke(); }
      const up = m.spitT > 0 ? 1 : 0.6 + Math.sin(m.t * 2) * 0.1, hx = x + c * 0.35 * TILE, hy = y + s * 0.35 * TILE - up * 0.8 * TILE;
      ctx.strokeStyle = "#3aa080"; ctx.lineWidth = 10; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + c * 0.1 * TILE, hy + 10, hx, hy + 4); ctx.stroke(); ctx.lineCap = "butt";
      ctx.fillStyle = "#e07a3a"; ctx.beginPath(); ctx.moveTo(hx - 10 * dirx, hy - 6); ctx.lineTo(hx - 18 * dirx, hy - 22); ctx.lineTo(hx - 4 * dirx, hy - 12); ctx.lineTo(hx - 8 * dirx, hy - 26); ctx.lineTo(hx + 2 * dirx, hy - 10); ctx.closePath(); ctx.fill(); // crista
      ctx.fillStyle = "#3aa080"; ctx.strokeStyle = "#0e2a22"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(hx + 4 * dirx, hy, 13, 9, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#ffe066"; ctx.fillRect(Math.round(hx + 6 * dirx - 2), Math.round(hy - 5), 4, 4); ctx.fillStyle = "#1a1008"; ctx.fillRect(Math.round(hx + 7 * dirx - 1), Math.round(hy - 4), 2, 3);
      if (m.spitT > 0) { ctx.fillStyle = "#1a0e10"; ctx.fillRect(Math.round(hx + 12 * dirx - 3), Math.round(hy + 1), 7, 4); }
    }
    // polvo abissal: cabeçorra roxa saindo do mar, olhos amarelos enormes e oito tentáculos ondulando em volta
    function drawOctopus(ctx, m, x, y, t) {
      const angry = m.hp < m.max * 0.4, br = Math.sin(m.t * 1.6) * 3;
      ctx.fillStyle = "rgba(20,20,46,0.45)"; ctx.beginPath(); ctx.ellipse(x, y + 4, 2.5 * TILE, 1.3 * TILE, 0, 0, TAU); ctx.fill();
      for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + Math.sin(m.t * 0.7 + i) * 0.25, r0 = 1.1 * TILE, r1 = (2.1 + Math.sin(m.t * 1.3 + i * 1.7) * 0.25) * TILE;
        const x0 = x + Math.cos(a) * r0, y0 = y + Math.sin(a) * r0 * 0.5, x1 = x + Math.cos(a) * r1, y1 = y + Math.sin(a) * r1 * 0.5 - 18 - Math.abs(Math.sin(m.t * 2 + i)) * 16;
        ctx.strokeStyle = "#1a0e26"; ctx.lineWidth = 15; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2 + Math.cos(a + 1.5) * 18, (y0 + y1) / 2 - 10, x1, y1); ctx.stroke();
        ctx.strokeStyle = angry ? "#a04a8a" : "#7a4aa0"; ctx.lineWidth = 11; ctx.stroke();
        ctx.fillStyle = "#e8c0e8"; for (let k = 1; k <= 3; k++) { const u = k / 4; ctx.fillRect(Math.round(x0 + (x1 - x0) * u - 1), Math.round(y0 + (y1 - y0) * u + 2), 3, 3); } }
      ctx.lineCap = "butt";
      ctx.fillStyle = angry ? "#8a3a7a" : "#6a3a92"; ctx.strokeStyle = "#1a0e26"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(x, y - 1.2 * TILE + br, 1.25 * TILE, 1.15 * TILE, 0, Math.PI, TAU); ctx.lineTo(x + 1.25 * TILE, y - 0.2 * TILE); ctx.quadraticCurveTo(x, y + 0.3 * TILE, x - 1.25 * TILE, y - 0.2 * TILE); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(255,220,255,0.25)"; ctx.beginPath(); ctx.ellipse(x - 0.45 * TILE, y - 1.9 * TILE + br, 0.35 * TILE, 0.22 * TILE, -0.4, 0, TAU); ctx.fill();
      for (const sx of [-1, 1]) { const ex = x + sx * 0.5 * TILE, ey = y - 0.75 * TILE + br;
        ctx.fillStyle = "#ffd23a"; ctx.strokeStyle = "#1a0e26"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(ex, ey, 13, 11, 0, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#1a0e10"; ctx.fillRect(Math.round(ex - 2), Math.round(ey - 8), 4, 16);
        ctx.strokeStyle = "#1a0e26"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ex - 13 * sx * -1, ey - 15); ctx.lineTo(ex + 12 * sx, ey - 10 - (angry ? 4 : 0)); ctx.stroke(); }
      for (const ry of [0.2, 0.55]) { ctx.strokeStyle = "rgba(240,250,255,0.6)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y - 0.1 * TILE, (1.4 + ry) * TILE, (0.35 + ry * 0.3) * TILE, 0, 0, Math.PI); ctx.stroke(); }
    }
    function drawTentacleSlam(ctx, w, t) { // tentáculo que sobe e bate na água
      const G = seaArt("sea_tentacle"), k = w.t / 0.9, x = X(w.x), y = Y(w.y);
      if (G) { const { A, img } = G, sc = TILE / A.pxTile, row = Math.min(3, Math.floor(k * 4)); ctx.globalAlpha = k > 0.8 ? (1 - k) * 5 : 1;
        ctx.drawImage(img, 0, row * A.ch, A.cw, A.ch, Math.round(x - A.ox * sc), Math.round(y - A.oy * sc), Math.round(A.cw * sc), Math.round(A.ch * sc)); ctx.globalAlpha = 1; return; }
      const h = Math.sin(Math.PI * Math.min(1, k * 1.4)) * 1.8 * TILE;
      ctx.strokeStyle = "#1a0e26"; ctx.lineWidth = 16; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(x - 10, y); ctx.quadraticCurveTo(x - 24, y - h * 0.6, x + 4, y - h); ctx.stroke();
      ctx.strokeStyle = "#7a4aa0"; ctx.lineWidth = 12; ctx.stroke(); ctx.lineCap = "butt";
    }
    function drawCrate(ctx, c, t) {
      const x = X(c.x), y = Y(c.y) + Math.sin(t * 2 + c.x) * 2, s = c.big ? 16 : 11;
      ctx.fillStyle = "rgba(20,46,72,0.35)"; ctx.beginPath(); ctx.ellipse(x, y + 4, s * 1.2, s * 0.4, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = c.big ? "#7a4a8a" : "#a8743e"; ctx.strokeStyle = "#2a1a10"; ctx.lineWidth = 2; ctx.fillRect(x - s, y - s * 1.4, s * 2, s * 1.4); ctx.strokeRect(x - s, y - s * 1.4, s * 2, s * 1.4);
      ctx.fillStyle = c.big ? "#ffd23a" : "#6a4422"; ctx.fillRect(x - s, y - s * 0.95, s * 2, 3); ctx.fillRect(x - 2, y - s * 1.4, 4, s * 1.4);
      if (Math.sin(t * 5 + c.y) > 0.8) { ctx.fillStyle = "#fff6c0"; ctx.fillRect(x + s * 0.5, y - s * 1.6, 3, 3); }
      ctx.strokeStyle = "rgba(240,250,255,0.6)"; ctx.beginPath(); ctx.ellipse(x, y + 1, s * 1.3, 4, 0, 0, Math.PI); ctx.stroke();
    }
    function drawBallsAndWarns(t) {
      const ctx = api.ctx();
      for (const w of warns) { const k = 1 - w.t / w.life, x = X(w.x), y = Y(w.y), r = w.r * TILE;
        if (w.kind === "shadow" || w.kind === "dive" || w.kind === "breach" || w.kind === "claw" || w.kind === "boulder") { // círculo que fecha até a hora do golpe
          const c = { shadow: "20,40,60", dive: "255,255,255", breach: "120,200,255", claw: "255,90,70", boulder: "255,160,90" }[w.kind];
          ctx.fillStyle = `rgba(${c},${w.kind === "shadow" ? 0.35 : 0.14 + k * 0.22})`; ctx.beginPath(); ctx.ellipse(x, y, r * (w.kind === "shadow" ? 0.4 + 0.6 * k : 1), r * 0.55 * (w.kind === "shadow" ? 0.4 + 0.6 * k : 1), 0, 0, TAU); ctx.fill();
          if (w.kind !== "shadow") { ctx.strokeStyle = `rgb(${c})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, r * k, r * k * 0.55, 0, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.55, 0, 0, TAU); ctx.stroke(); }
          if (w.kind === "boulder" && w.fx0 != null) { const fx0 = X(w.fx0), fy0 = Y(w.fy0), px = fx0 + (x - fx0) * k, py = fy0 + (y - fy0) * k - Math.sin(Math.PI * k) * TILE * 3.2;
            ctx.fillStyle = "#e88a6a"; ctx.strokeStyle = "#3a2018"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, 9, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#f6c0a0"; ctx.fillRect(px - 4, py - 5, 3, 3); }
          continue; }
        if (w.kind === "song") { const rr = r * k; ctx.strokeStyle = `rgba(220,170,255,${0.8 - k * 0.4})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, rr, rr * 0.55, 0, 0, TAU); ctx.stroke();
          ctx.fillStyle = "#e8c8ff"; for (let i = 0; i < 4; i++) { const a = t * 1.5 + i * 1.57; ctx.fillText("♪", x + Math.cos(a) * rr * 0.9, y + Math.sin(a) * rr * 0.5); } continue; }
        if (w.kind === "bubbles") { ctx.fillStyle = "#1a102acc"; for (let i = 0; i < 6; i++) { const a = i + t * 3, rr = (0.3 + 0.5 * ((i * 0.37 + t) % 1)) * r; ctx.beginPath(); ctx.arc(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.5, 3 + (i % 3), 0, TAU); ctx.fill(); } continue; }
        if (w.kind === "ice") { ctx.fillStyle = `rgba(220,246,255,${0.15 + k * 0.25})`; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.55, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, r * k, r * k * 0.55, 0, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.55, 0, 0, TAU); ctx.stroke(); continue; }
        ctx.fillStyle = `rgba(150,60,200,${0.15 + k * 0.25})`; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.55, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = "#e080ff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, r * k, r * k * 0.55, 0, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.55, 0, 0, TAU); ctx.stroke(); }
      for (const tt of tentacles) drawTentacleSlam(ctx, tt, t);
      for (const L of lines) { // linha marcada da investida ou do raio
        const m = L.m, k = 1 - L.t / L.life, x0 = X(m.x), y0 = Y(m.y), x1 = X(m.x + Math.cos(m.a) * L.len), y1 = Y(m.y + Math.sin(m.a) * L.len);
        ctx.save(); ctx.globalAlpha = 0.25 + 0.3 * k; ctx.strokeStyle = L.c; ctx.lineCap = "round"; ctx.lineWidth = L.w * TILE * 0.8; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        ctx.globalAlpha = 0.8; ctx.lineWidth = 2; ctx.setLineDash([8, 6]); ctx.lineDashOffset = -t * 30; ctx.stroke(); ctx.restore(); }
      for (const b of bolts) { const k = b.t / b.life; ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = "#e8fbff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X(b.x0), Y(b.y0));
        for (let i = 1; i <= 8; i++) { const u = i / 8; ctx.lineTo(X(b.x0 + (b.x1 - b.x0) * u) + (i < 8 ? (rand() - 0.5) * 16 : 0), Y(b.y0 + (b.y1 - b.y0) * u) + (i < 8 ? (rand() - 0.5) * 16 : 0)); }
        ctx.stroke(); ctx.strokeStyle = "#6fd8ff"; ctx.lineWidth = 7; ctx.globalAlpha = (1 - k) * 0.35; ctx.stroke(); ctx.restore(); }
      for (const ic of icicles) { const k = ic.t / 1.1, h = Math.sin(Math.PI * Math.min(1, k * 2.2)) * TILE * 1.1, x = X(ic.x), y = Y(ic.y); ctx.globalAlpha = k > 0.75 ? (1 - k) * 4 : 1;
        for (const [dx, sc] of [[-8, 0.7], [0, 1], [9, 0.8]]) { ctx.fillStyle = "#e8faff"; ctx.strokeStyle = "#5a9ac8"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + dx - 7 * sc, y); ctx.lineTo(x + dx, y - h * sc); ctx.lineTo(x + dx + 7 * sc, y); ctx.closePath(); ctx.fill(); ctx.stroke(); }
        ctx.globalAlpha = 1; }
      for (const r of rings) { const k = r.t / r.life; ctx.strokeStyle = r.c; ctx.globalAlpha = 1 - k; ctx.lineWidth = r.w; ctx.beginPath(); ctx.ellipse(X(r.x), Y(r.y), r.r * TILE * (0.3 + k * 0.7), r.r * TILE * (0.3 + k * 0.7) * 0.55, 0, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
      for (const b of balls) { const k = b.t / b.life, h = Math.sin(Math.PI * Math.min(1, k)) * b.h * TILE + 6, x = X(b.x), y = Y(b.y);
        ctx.fillStyle = "rgba(10,30,50,0.35)"; ctx.beginPath(); ctx.ellipse(x, y + 6, 5, 2, 0, 0, TAU); ctx.fill();
        if (b.kind === "harpoon") { if (b.src) { ctx.strokeStyle = "#c8b080"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(X(b.src.x), Y(b.src.y) - 20); ctx.quadraticCurveTo((X(b.src.x) + x) / 2, (Y(b.src.y) + y) / 2 - h, x, y - h); ctx.stroke(); }
          ctx.save(); ctx.translate(x, y - h); ctx.rotate(Math.atan2(b.vy, b.vx)); ctx.fillStyle = "#6a4a2a"; ctx.fillRect(-12, -1.5, 14, 3); ctx.fillStyle = "#b0b4bc"; ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(1, -4); ctx.lineTo(1, 4); ctx.closePath(); ctx.fill(); ctx.restore(); }
        else if (b.kind === "spike") { ctx.fillStyle = "#f0dc96"; ctx.strokeStyle = "#5a4020"; ctx.lineWidth = 1; ctx.save(); ctx.translate(x, y - h); ctx.rotate(Math.atan2(b.vy, b.vx)); ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-4, -2); ctx.lineTo(-4, 2); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
        else if (b.kind === "spit") { ctx.fillStyle = "#bfe8ff"; ctx.beginPath(); ctx.arc(x, y - h, 6, 0, TAU); ctx.fill(); ctx.fillStyle = "#ffffff"; ctx.fillRect(x - 2, y - h - 3, 3, 3); }
        else if (b.kind === "ink") { ctx.fillStyle = "#2a2238"; ctx.beginPath(); ctx.arc(x, y - h, 9, 0, TAU); ctx.fill(); ctx.fillStyle = "#6a5a8a"; ctx.fillRect(x - 3, y - h - 4, 3, 3); }
        else { ctx.fillStyle = "#1e1c22"; ctx.beginPath(); ctx.arc(x, y - h, 4.5, 0, TAU); ctx.fill(); ctx.fillStyle = "#8a8890"; ctx.fillRect(Math.round(x - 2), Math.round(y - h - 3), 2, 2); } }
    }
    // entidades do mar para a ordem de desenho do mundo (y = linha d'água)
    function ents(list, x0, y0, x1, y1) {
      if (!ready) return; const p = P(), inView = (x, y, m = 4) => x > x0 - m && x < x1 + m && y > y0 - m && y < y1 + m;
      if (ship) list.push({ y: ship.y + 0.05, sea: "ship" });
      for (const m of mobs) if (!(m.dead && m.deadT >= 1.5) && inView(m.x, m.y)) list.push({ y: m.y + (m.d.boss ? -0.5 : 0), sea: "mob", ref: m });
      for (const M of moored) if (inView(M.x, M.y) && !(p.sailing && p.boat.dock === M.D.key)) list.push({ y: M.y, sea: "moored", ref: M }); // o barco saiu deste cais: a vaga fica vazia
      const an = !p.sailing && p.boat.anchor; if (an && inView(an.x, an.y)) list.push({ y: an.y, sea: "anchor", ref: an });
    }
    function drawEnt(e, t) {
      const ctx = api.ctx();
      if (e.sea === "ship") return drawShipEnt(t);
      if (e.sea === "mob") return drawMob(e.ref, t);
      if (e.sea === "moored" || e.sea === "anchor") {
        const p = P(), M = e.ref, mine = e.sea === "anchor" || (!p.sailing && !p.boat.anchor && p.boat.dock === M.D.key && owns());
        const key = mine ? B.stats(p.boat).art : "bote", G = art(key), s = mine ? B.stats(p.boat) : VD.HULLS.bote, bob = Math.sin(t * 1.5 + M.x) * 1.2;
        const ex = e.sea === "moored" && mine ? mooredExtra(M) : 0, mx = M.x + (M.px || 0) * ex, my = M.y + (M.py || 0) * ex;
        waterShadow(mx, my, M.a, s.len, s.beam, 0.22);
        if (G) { ctx.save(); ctx.translate(0, bob); drawBoat(B.dir16(M.a), G.A, G.img, mx, my, false); drawBoat(B.dir16(M.a), G.A, G.img, mx, my, true); ctx.restore(); }
        else drawFallbackBoat(mx, my, M.a, s);
      }
    }
    function drawUnder(t) { if (!ready) return; drawSpots(t); drawWake(); const ctx = api.ctx(); for (const c of crates) drawCrate(ctx, c, t); drawWrecks(t); }
    function drawOver(t) { if (!ready) return; drawBallsAndWarns(t); drawGulls(t); }
    // ---------------- interação (clique e F) ----------------
    function pick(fx0, fy0) {
      if (!ready) return null; const p = P();
      for (const m of mobs) if (!m.dead && !m.hidden && Math.hypot(m.x - fx0, (m.y - 0.4 - fy0) / (m.d.boss ? 1.4 : 1)) < m.d.radius + (m.d.boss ? 1 : 0.5)) return { kind: "seamob", ref: m };
      for (const s of spots) if (!(s.gone > 0) && inArea(s, fx0, fy0)) return { kind: "seaspot", ref: s, tx: Math.floor(fx0), ty: Math.floor(fy0) }; // qualquer tile da área
      const an = !p.sailing && p.boat.anchor; if (an && Math.hypot(an.x - fx0, an.y - 0.6 - fy0) < 1.3) return { kind: "seaboat", ref: { anchor: an } };
      if (!p.sailing) for (const M of moored) if (Math.hypot(M.x - fx0, M.y - 0.6 - fy0) < 1.3) return { kind: "seaboat", ref: { M } };
      return null;
    }
    function describe(k) {
      if (k.kind === "seamob") { const m = k.ref, sk = m.d.skill ? m.d.skill.split(/[.:]/)[0] : ""; return [`${m.d.name} · nv ${m.L}`, m.d.boss ? "#c47aff" : "#ff8a7a", sk || (ship ? "clique: dispara o bordo virado para ele" : "monstro do mar (só de barco)")]; }
      if (k.kind === "seaspot") { const s = k.ref;
        return [s.big ? `Área de pesca grande${s.deep ? " (mar fundo)" : ""}` : "Área de pesca da costa", "#8fd8ff", "só navegando: pare o barco perto e clique num ponto dela"]; }
      if (k.kind === "seaboat") return k.ref.anchor ? ["Seu barco (ancorado)", "#f0c878", "clique perto dele para embarcar"] : owns() ? ["Seu barco", "#f0c878", "clique para zarpar deste cais"] : ["Bote do cais", "#f0c878", "o mestre do cais vende barcos"];
      return null;
    }
    // clique no mundo: true = o mar cuidou do clique
    function click(p0) {
      if (!ready) return false; const p = P();
      if (ship) {
        if (p0 && p0.kind === "seamob") { const m = p0.ref, d = Math.hypot(m.x - ship.x, m.y - ship.y); if (d <= RANGE + 1) fireAt(m); else autopilot = { x: m.x, y: m.y }; return true; }
        if (p0 && p0.kind === "seaspot") { const s = p0.ref, d = Math.hypot(p0.tx + 0.5 - ship.x, p0.ty + 0.5 - ship.y);
          if (d <= CAST + ship.s.beam && Math.abs(ship.v) < 1.6) fishStart(s, p0.tx, p0.ty);
          else { const a = Math.atan2(s.y - ship.y, s.x - ship.x); autopilot = { x: s.x - Math.cos(a) * (s.r + 2.2), y: s.y - Math.sin(a) * (s.r + 2.2) }; api.log("Rumo à área de pesca: o barco para perto dela; depois clique num ponto da área (ou aperte F).", "dim"); }
          return true; }
        if (p0 && (p0.kind === "tile" || p0.tx != null)) {
          const tx = p0.tx, ty = p0.ty;
          if (api.walkable(tx, ty) && Math.hypot(tx + 0.5 - ship.x, ty + 0.5 - ship.y) < 3) { disembark(); return true; }
          steerTo(tx + 0.5, ty + 0.5); return true;
        }
        return true; // a bordo, nada em terra responde ao clique
      }
      if (p0 && p0.kind === "seaboat") {
        if (p0.ref.anchor) { const a = p0.ref.anchor; if (Math.hypot(a.x - (p.x + 0.5), a.y - (p.y + 0.5)) < 3.2) embarkAt(a.x, a.y, a.a); else { api.goNear(a.x, a.y, 2.2); api.log("Chegue perto do barco para embarcar.", "dim"); } return true; }
        const M = p0.ref.M, T = tip(M.D);
        if (Math.hypot(T.x - (p.x + 0.5), T.y - (p.y + 0.5)) < 4 || Math.hypot(M.x - (p.x + 0.5), M.y - (p.y + 0.5)) < 3.2) embarkDock(M.D);
        else { api.goNear(T.tx + 0.5, T.ty + 0.5, 1.2); if (!owns()) api.log(`Este é o bote do cais. ${M.D.keeper} vende barcos.`, "dim"); }
        return true;
      }
      if (p0 && p0.kind === "seamob") { api.log("Monstro do mar: só dá para enfrentar de barco.", "dim"); return true; }
      if (p0 && p0.kind === "seaspot") { api.log("Área de pesca do mar: só navegando. O mestre do cais vende barcos.", "dim"); return true; } // a pé não pesca no mar
      return false;
    }
    function steerTo(x, y) { if (!ship) return false; autopilot = isSea(x, y) ? { x, y } : nearestSea(x, y); return true; }
    function nearestSea(x, y) { for (let r = 0; r < 6; r++) for (let k = 0; k < 12; k++) { const X2 = x + Math.cos(k * TAU / 12) * r, Y2 = y + Math.sin(k * TAU / 12) * r; if (isSea(X2, Y2)) return { x: X2, y: Y2 }; } return null; }
    // F: o que fazer agora (rótulo do rodapé e a ação)
    function fAction() {
      const p = P(); if (!ready || p.deadT > 0) return null;
      if (fish) return { label: "recolher a linha", run: () => fishStop(false, "Você recolheu a linha.") };
      if (ship) {
        const s = spotNear(); if (s && Math.abs(ship.v) < 1.6) return { label: "lançar a linha na área de pesca", run: () => fishStart(s) };
        const L = landing(); if (L) return { label: L.pier ? "atracar no cais" : "descer na praia", run: () => disembark() };
        return null;
      }
      if (api.npcNear && api.npcNear()) return null; // encostado no anão ou no mestre do cais, o F fala com eles
      const an = p.boat.anchor; if (an && Math.hypot(an.x - (p.x + 0.5), an.y - (p.y + 0.5)) < 3.2) return { label: "embarcar no seu barco", run: () => embarkAt(an.x, an.y, an.a) };
      if (owns() && api.map()[p.y] && api.map()[p.y][p.x] === "pier") { const D = dockOfTile(p.x, p.y); if (D) return { label: "zarpar no seu barco", run: () => embarkDock(D) }; }
      return null;
    }
    // teclas: 1 a 3 na luta da linha; Q/E (giro/investida) viram canhões a bordo; Espaço mira o mais perto
    function key(k) {
      if (fish && fish.phase === "fight" && (k === "1" || k === "2" || k === "3")) return fishAct(+k);
      if (!ship) return false;
      if (k === "spin") return fire(-1), true;
      if (k === "dash") return fire(1), true;
      if (k === "attack") { const m = nearestMob(RANGE + 1); if (m) fireAt(m); else api.log("Nenhum monstro do mar ao alcance dos canhões.", "dim"); return true; }
      if (k === "skill") { api.log("A bordo, as habilidades ficam guardadas: Q e E disparam os canhões.", "dim"); return true; }
      return false;
    }
    // ---------------- painel do barco (vida, velocidade, vento e canhões) ----------------
    function hud() {
      const el = document.getElementById("seahud"); if (!el) return;
      if (!ship) { if (!el.hidden) el.hidden = true; return; }
      el.hidden = false; const s = ship.s, rel = B.angDiff(wind.a, ship.a), wf = B.windFactor(ship.a, wind.a), knots = Math.round(Math.abs(ship.v) * 3.2);
      const bar = (k) => { const v = ship[k] / s.reload; return `<i class="gun${v > 0 ? "" : " ok"}" style="--p:${v.toFixed(2)}"></i>`; };
      const html = `<b>${esc(s.name)}</b><span class="hp"><i style="width:${Math.round(100 * ship.hp / s.maxHp)}%"></i><em>${Math.ceil(ship.hp)}/${s.maxHp}</em></span>
        <span class="wind" title="Vento (de onde ele vem, em relação à tela)"><i style="transform:rotate(${(wind.a * 180 / Math.PI).toFixed(0)}deg)">➤</i>${wf > 1 ? "de popa" : wf > 0.8 ? "de través" : "de proa"}</span>
        <span>${knots} nós${ship.charmT > 0 ? " · <b style='color:#e8a8ff'>encantado!</b>" : ""}${ship.heldT > 0 ? " · <b style='color:#ff8a6a'>preso!</b>" : ""}${ship.stunT > 0 ? " · <b style='color:#8fe0ff'>choque!</b>" : ""}${ship.inkT > 0 ? " · <b style='color:#c47aff'>lento!</b>" : ""}</span><span class="guns">Q ${bar("cdL")} ${bar("cdR")} E</span>`;
      if (el.dataset.h !== html) { el.dataset.h = html; el.innerHTML = html; }
    }
    // ---------------- salvar ----------------
    function saveData() { const p = P(); return { ...p.boat, hp: ship ? Math.round(ship.hp) : p.boat.hp, sea: ship ? { x: ship.x, y: ship.y, a: ship.a } : null, sailAcc: 0 }; }
    function landPos() { // onde o herói fica salvo enquanto navega (um tile de terra): a ponta do píer do último cais
      const p = P(), D = (api.G().DOCKS || []).find((d) => d.key === p.boat.dock) || nearestDock(p.x, p.y); if (!D) return null; const T = tip(D); return { x: T.tx, y: T.ty };
    }
    function resume() { const p = P(), s = p.boat.sea; if (s && ready && isSea(s.x, s.y) && owns()) { p.boat.sea = null; embarkAt(s.x, s.y, s.a); } }
    function leave() { if (ship) { const p = P(); fishStop(true); p.boat.anchor = { x: ship.x, y: ship.y, a: ship.a }; p.boat.hp = Math.round(ship.hp); ship = null; autopilot = null; p.sailing = false; } }
    // ---------------- janelas: Peixaria do Gaspar e Estaleiro (mestre do cais) ----------------
    const isFish = (n) => !!(ITEMS[n] && (ITEMS[n].sea || /cru$|crua$/.test(n) || n === "Peixe dourado"));
    const DWARF_BONUS = 1.5;
    const fishPrice = (n) => Math.max(1, Math.round(ITEMS[n].price * DWARF_BONUS));
    function dwarfHtml(tab, obj) {
      const who = (obj && obj.name) || "O anão";
      const p = P(), row = ValdoraDialogs.row, ic = ValdoraUI.iconImg;
      if (tab === "bait") {
        const cur = p.boat.bait;
        return `<p class="desc">A isca vai no anzol a cada lançada no mar (uma por peixe que morde). Escolha qual usar:</p>` + Object.entries(BAITS).map(([n, b]) =>
          row(ic(n), `${esc(n)} <small>(tem ${api.count(n)})</small>`, `${esc(b.desc)}${cur === n ? " · <b style='color:#6fbf5a'>em uso</b>" : ""}`, b.buy,
            `<button data-bbuy="${esc(n)}" data-n="1" ${p.coins < b.buy ? "disabled" : ""}>1</button><button data-bbuy="${esc(n)}" data-n="10" ${p.coins < b.buy * 10 ? "disabled" : ""}>10</button><button data-buse="${esc(n)}" ${cur === n ? "disabled" : ""}>Usar</button>`)).join("")
          + `<button class="wide" data-buse="" ${!cur ? "disabled" : ""}>Pescar sem isca</button>`;
      }
      if (tab === "log") {
        const J = p.boat.journal, zones = ["Qualquer mar", "Mar das Brisas (Campo)", "Mar do Breu (Floresta)", "Mar de Ferro (Montanhas)", "Mar Rubro (Deserto)", "Mar Gelado (Geleira)"];
        const got = SEA_FISH.filter((f) => J[f.item] && J[f.item].n).length;
        let h = `<p class="desc">Diário de pesca: ${got} de ${SEA_FISH.length} espécies do mar. Cada espécie nova dá XP em dobro; ${esc(who)} anota o peso do maior de cada uma (o diário é o mesmo em todos os cais).</p>`;
        for (const z of [1, 2, 3, 4, 5, 0]) {
          h += `<div class="cr-group">${zones[z]}</div>` + SEA_FISH.filter((f) => f.zone === z).map((f) => { const j = J[f.item], R = RARITY[f.rar];
            return row(j ? ic(f.item) : `<span class="slot locked"></span>`, j ? `<span style="color:${R.color}">${esc(f.item)}</span>` : "<span style='color:#8a8070'>???</span>",
              j ? `${R.name} · ${j.n} pescado${j.n > 1 ? "s" : ""} · recorde ${fmtKg(j.kg)}` : `${R.name} · Pesca ${f.req}`, null, ""); }).join("");
        }
        return h;
      }
      const rows = p.inv.filter((s) => s && isFish(s.name));
      return `<p class="desc">${esc(who)} paga ${Math.round((DWARF_BONUS - 1) * 100)}% a mais que o Bento por qualquer peixe cru, do lago ou do mar.</p>` + (rows.length ? rows.map((s) =>
        row(ic(s.name), `${esc(s.name)} <small>x${s.n}</small>`, ITEMS[s.name].sea ? `${(RARITY[ITEMS[s.name].sea] || RARITY.comum).name} · do mar` : "do lago", fishPrice(s.name),
          `<button data-fsell="${esc(s.name)}" data-n="1">1</button><button data-fsell="${esc(s.name)}" data-n="all">Tudo</button>`)).join("")
        + `<button class="wide" data-fsellall="1">Vender todos os peixes</button>` : `<p class="empty">Nenhum peixe na mochila. Pesque nos lagos ou saia de barco atrás das áreas de pesca do mar (o anzol na água).</p>`);
    }
    function harborHtml(obj, tab) {
      const p = P(), row = ValdoraDialogs.row, ic = ValdoraUI.iconImg, L = api.lv("navegacao"), have = (n) => api.count(n), D = (api.G().DOCKS || []).find((d) => d.key === obj.dock);
      const mats = (m) => Object.entries(m).map(([n, q]) => `<span class="${have(n) >= q ? "" : "lock"}">${q} ${esc(n.toLowerCase())}</span>`).join(", ");
      const cur = B.stats(p.boat);
      let h = `<p class="desc">Navegação ${L} · ${p.coins} moedas${cur ? ` · barco: <b>${esc(cur.name)}</b> (${B.hpOf(p.boat)}/${cur.maxHp} de casco)` : ""}</p>`;
      if (cur) h += `<button class="wide" data-sail="${esc(obj.dock)}">Zarpar daqui no ${esc(cur.name)}</button>`;
      if (tab === "up") {
        if (!cur) return h + `<p class="empty">Compre um barco primeiro. As melhorias valem para todos os seus cascos.</p>`;
        return h + Object.entries(VD.SHIP_PARTS).map(([k, P0]) => { const lvl = p.boat.parts[k], c = B.partCost(k, lvl + 1), why = B.whyNotPart(p, k, L, have);
          return row(`<img src="${ASSETS[P0.icon]}" alt="">`, `${esc(P0.name)} <small>nível ${lvl}/${B.MAX_PART}</small>`, c ? `${esc(P0.desc)} · ${mats(c.mats)} · Navegação ${c.lvl}` : `${esc(P0.desc)} · no máximo`, c ? c.coins : null,
            `<button data-boatup="${k}" ${why ? "disabled" : ""} title="${esc(why)}">${c ? "Melhorar" : "Máximo"}</button>`); }).join("");
      }
      if (tab === "fix") {
        if (!cur) return h + `<p class="empty">Você ainda não tem barco.</p>`;
        const c = B.repairCost(p.boat);
        return h + `<p class="desc">Fora de combate o casco se ajeita sozinho, bem devagar. Aqui fica novo na hora.</p><button class="wide" data-boatfix="1" ${!c || p.coins < c ? "disabled" : ""}>${c ? `Consertar o casco · ${c} moedas` : "O casco está inteiro"}</button>`;
      }
      return h + Object.entries(VD.HULLS).map(([k, Hh]) => { const own = p.boat.owned.includes(k), sel = own && p.boat.hull === k, why = own ? "" : B.whyNotHull(p, k, L, have);
        return `<div class="row boat${sel ? " on" : ""}"><span class="grow"><b>${esc(Hh.name)}</b> <small>${own ? "já é seu" : `Navegação ${Hh.lvl}`}</small><br><small>${esc(Hh.desc)}</small><br>
          <small>casco ${Hh.hp} · velocidade ${Math.round(Hh.speed * 100)}% · ${Hh.guns} canhão${Hh.guns > 1 ? "es" : ""} por bordo${own ? "" : ` · ${mats(Hh.mats)}`}</small></span>${own ? "" : `<span class="price">${Hh.price}</span>`}
          ${own ? `<button data-boatuse="${k}" ${sel ? "disabled" : ""}>${sel ? "Em uso" : "Usar"}</button>` : `<button data-boatbuy="${k}" ${why ? "disabled" : ""} title="${esc(why)}">Comprar</button>`}</div>`; }).join("");
    }
    // cliques das duas janelas (true = tratado)
    function dlgAct(dlg, ds) {
      const p = P(), have = (n) => api.count(n), take = (n, q) => api.removeItem(n, q), L = api.lv("navegacao");
      if (dlg.kind === "dwarf") {
        if (ds.fsell) { const n = ds.fsell, q = ds.n === "all" ? api.count(n) : 1; if (q > 0 && isFish(n)) { api.removeItem(n, q); p.coins += fishPrice(n) * q; SND.play("coin"); api.react(dlg.obj); api.log(`${dlg.obj.name} comprou ${q}x ${n.toLowerCase()} por ${fishPrice(n) * q} moedas.`, "dim"); } return true; }
        if (ds.fsellall) { let tot = 0, k = 0; for (const s of [...p.inv]) if (s && isFish(s.name)) { tot += fishPrice(s.name) * s.n; k += s.n; api.removeItem(s.name, s.n); }
          if (k) { p.coins += tot; SND.play("coin"); api.react(dlg.obj); api.log(`${dlg.obj.name} comprou ${k} peixes por ${tot} moedas. "Peixe bom é peixe fresco!"`, "gold"); } return true; }
        if (ds.bbuy) { const n = ds.bbuy, q = +ds.n || 1, b = BAITS[n]; if (b && p.coins >= b.buy * q && api.canAdd(n, q)) { p.coins -= b.buy * q; api.addItem(n, q); if (!p.boat.bait) p.boat.bait = n; SND.play("coin"); } else if (b && !api.canAdd(n, q)) api.log("Mochila cheia.", "warn"); return true; }
        if (ds.buse != null) { p.boat.bait = ds.buse || null; api.log(ds.buse ? `Isca escolhida: ${ds.buse.toLowerCase()}.` : "Vai pescar sem isca.", "dim"); return true; }
        return false;
      }
      if (dlg.kind === "harbor") {
        if (ds.boatbuy) { const k = ds.boatbuy, why = B.whyNotHull(p, k, L, have); if (why) { api.log(`${VD.HULLS[k].name}: ${why}.`, "warn"); return true; }
          B.buyHull(p, k, L, have, take); p.boat.dock = dlg.obj.dock; SND.play("coin"); api.toast(`${VD.HULLS[k].name} é seu!`, "Está amarrado ao lado do píer: clique nele (ou em \"Zarpar\") para navegar.", "#f1c40f"); api.emit("boat:" + k); return true; }
        if (ds.boatuse) { if (p.boat.owned.includes(ds.boatuse)) { p.boat.hull = ds.boatuse; p.boat.hp = null; api.log(`Barco escolhido: ${VD.HULLS[ds.boatuse].name}.`, "dim"); } return true; }
        if (ds.boatup) { const k = ds.boatup, why = B.whyNotPart(p, k, L, have); if (why) { api.log(`${VD.SHIP_PARTS[k].name}: ${why}.`, "warn"); return true; }
          B.upgrade(p, k, L, have, take); SND.play("clang"); api.log(`${VD.SHIP_PARTS[k].name} do barco no nível ${p.boat.parts[k]}.`, "gold"); return true; }
        if (ds.boatfix) { const c = B.repairCost(p.boat); if (c && p.coins >= c) { p.coins -= c; p.boat.hp = null; SND.play("clang"); api.log(`Casco consertado por ${c} moedas.`, "dim"); } return true; }
        if (ds.sail) { const D = (api.G().DOCKS || []).find((d) => d.key === ds.sail); if (D) { api.closeDlg(); embarkDock(D); } return true; }
      }
      return false;
    }
    return { init, update, ents, drawEnt, drawUnder, drawOver, pick, describe, click, steerTo, fAction, key, hud, saveData, landPos, resume, leave, dwarfHtml, harborHtml, dlgAct, isFish, fishPrice,
      sailing: () => !!ship, ship: () => ship, fishing: () => fish, spots: () => spots, mobs: () => mobs, homes: () => homes, moored: () => moored, lairs: () => lairs, isSea, levelAt, zoneAt, embarkDock, embarkAt, disembark, fire, fishStart, fishAct, spawnMob, tip, wind };
  }
  return { create };
})();

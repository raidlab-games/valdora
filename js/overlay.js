// Valdora — camadas por cima do mundo (rodada 19: saiu do game.js): minimapa (fundo cacheado por mapa + monstros, NPCs,
// câmera e herói) e as luzes da noite/masmorra (fogueiras, janelas, lumita, cardume dourado, baú, fogo-fátuo, chefes, lanterna).
window.ValdoraOverlay = (() => {
  "use strict";
  function create(api) {
    const { canvas, cam, ctx, TILE, W, H, LIGHT, isSpecial } = api;
    const $ = (id) => document.getElementById(id);
    const GROUND_COLOR = { grass: "#4a8c3a", grass_2: "#4a8c3a", grass_flowers: "#4f9340", grass_dark: "#2c5527", grass_dark_2: "#2c5527",
      dirt: "#7d6e57", dirt_2: "#7d6e57", water: "#2f6fb0", sand: "#d9c48a", path: "#6b4f2a", stone: "#9a9188", void: "#050505",
      grass_night: "#243a2c", grass_night_2: "#243a2c", sand_2: "#d2b878", rockg: "#7a7470", rockg_2: "#7a7470", snow: "#e8eef6", snow_2: "#dde6f0", pier: "#8a5a34" }; // rodada 105: biomas (119: píer dos cais)
    let miniBase = null, miniS = 4;
    // rodada 105: o minimapa mostra só a área em volta do herói (96 x 72 tiles), seguindo; o mapa inteiro abre no M
    const VW = 96, VH = 72;
    function miniView() {
      const p = api.state().player, w = Math.min(VW, W), h = Math.min(VH, H);
      const x0 = Math.max(0, Math.min(W - w, Math.round(p.px + 0.5 - w / 2))), y0 = Math.max(0, Math.min(H - h, Math.round(p.py + 0.5 - h / 2)));
      return { x0, y0, w, h };
    }
    const fishIcon = new Image(); if (ASSETS.icon_fish_spot) fishIcon.src = ASSETS.icon_fish_spot;
    const backArrow = new Image(); if (ASSETS.icon_minimap_back) backArrow.src = ASSETS.icon_minimap_back; // rodada 59
    function buildMinimap() {
      const { map, objects, mobs, npc, player, groundItems, inCrypt } = api.state();
      // rodada 71: fundo pintado a 4 px por tile — lagos pelo mesmo contorno suave do chão (makeField), margem clara, manchas de tom
      // e sem os pontinhos brancos das pedras (só árvores, casas e enfeites grandes); o minimapa reduz com filtro
      const S = W > 200 ? 2 : 4; miniS = S; miniBase = document.createElement("canvas"); miniBase.width = W * S; miniBase.height = H * S; // rodada 105: continente a 2 px por tile
      const g = miniBase.getContext("2d"), img = g.createImageData(W * S, H * S), d = img.data, T = window.ValdoraTerrain;
      const big = W > 200, WF = !big && T && T.makeField ? T.makeField(W, H, (x, y) => map[y][x] === "water", 31) : null; // rodada 106: continente sem o contorno suave (pesado)
      const rgb = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
      const COL = {}; for (const k in GROUND_COLOR) COL[k] = rgb(GROUND_COLOR[k]);
      if (big) { // um tile = S x S pixels da mesma cor (com a tinta de manchas do chão)
        const tintOk = T && T.tintAt;
        for (let ty = 0; ty < H; ty++) { const row = map[ty]; for (let tx = 0; tx < W; tx++) {
          const mb = api.mtn && api.mtn(), mi = ty * W + tx, k = row[tx];
          const c = mb && mb.block[mi] ? [84, 80, 76] : COL[k] || [0, 0, 0], tn = (tintOk && k !== "void" && k !== "water" ? T.tintAt(tx, ty) * 10 : 0) + (mb && mb.elev[mi] === 1 ? 26 : 0); // rodada 106: montanhas
          const r = Math.max(0, Math.min(255, c[0] + tn)), gg = Math.max(0, Math.min(255, c[1] + tn)), b = Math.max(0, Math.min(255, c[2] + tn * 0.6));
          for (let sy = 0; sy < S; sy++) { let i = ((ty * S + sy) * W * S + tx * S) * 4; for (let sx = 0; sx < S; sx++, i += 4) { d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = 255; } } } }
      } else for (let py = 0; py < H * S; py++) for (let px = 0; px < W * S; px++) {
        const fx = (px + 0.5) / S, fy = (py + 0.5) / S, tx = Math.floor(fx), ty = Math.floor(fy), k = map[ty][tx];
        let c = COL[k] || [0, 0, 0];
        if (WF) { const v = WF.at(fx, fy); if (v >= 0.5) c = v < 0.58 ? [150, 205, 235] : COL.water; else if (k === "water") c = COL.sand; }
        const tn = T && T.tintAt && k !== "void" ? T.tintAt(tx, ty) * 10 : 0, i = (py * W * S + px) * 4;
        d[i] = Math.max(0, Math.min(255, c[0] + tn)); d[i + 1] = Math.max(0, Math.min(255, c[1] + tn)); d[i + 2] = Math.max(0, Math.min(255, c[2] + tn * 0.6)); d[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      for (const o of objects) {
        if ((o.type === "res" && o.lake) || o.type === "decal" || o.type === "flora" || o.type === "gate" || o.type === "bones" || o.type === "prop") continue;
        if (o.type === "res" && !o.kind.startsWith("tree")) continue; // pedras e veios: ruído no minimapa
        g.fillStyle = o.type === "house" ? "#8a3a2a" : o.type === "res" ? "#1f4a1acc" : o.type === "bush" ? "#2f6b24" : "#e0c080";
        if (o.type === "res") { g.beginPath(); g.arc((o.x + 0.5) * S, (o.y + 0.5) * S, S * 0.7, 0, 6.29); g.fill(); } else g.fillRect(o.x * S, o.y * S, o.w * S, o.h * S);
      }
    }
    function drawMinimap() {
      const { map, objects, mobs, npc, player, groundItems, inCrypt } = api.state();
      const mc = $("minimap"), g = mc.getContext("2d");
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
      const V = miniView(); g.clearRect(0, 0, mc.width, mc.height);
      g.drawImage(miniBase, V.x0 * miniS, V.y0 * miniS, V.w * miniS, V.h * miniS, 0, 0, mc.width, mc.height); g.imageSmoothingEnabled = false;
      const sx = mc.width / V.w, sy = mc.height / V.h; g.save(); g.translate(-V.x0 * sx, -V.y0 * sy); // tudo abaixo em coordenadas do mapa
      const dot = (x, y, r, col) => { g.fillStyle = "#140c06"; g.beginPath(); g.arc(x, y, r + 1, 0, 6.29); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, 6.29); g.fill(); };
      // rodada 105: só os monstros da área da tela (o quadrado branco) e um pouco além (4 tiles); os longe aparecem ao chegar perto.
      // O eco desperto (evento) continua aparecendo de longe, com o anel pulsando.
      const NEAR = 4, vx0 = cam.x / TILE - NEAR, vy0 = cam.y / TILE - NEAR, vx1 = (cam.x + canvas.width) / TILE + NEAR, vy1 = (cam.y + canvas.height) / TILE + NEAR;
      for (const m of mobs) if (!m.dead && (m.d.echo || (m.px >= vx0 && m.px <= vx1 && m.py >= vy0 && m.py <= vy1))) { // rodada 71: pontos redondos com contorno escuro
        dot((m.px + 0.5) * sx, (m.py + 0.5) * sy, m.d.boss ? 3 : 1.6, m.d.echo ? "#7fe8ff" : m.d.boss ? "#c48cff" : m.aggro ? "#ff5a4a" : "#c03030");
        if (m.d.echo) { const r = 5 + (performance.now() / 160) % 6; g.strokeStyle = "#7fe8ff"; g.lineWidth = 1; g.beginPath(); g.arc((m.x + 0.5) * sx, (m.y + 0.5) * sy, r, 0, 6.29); g.stroke(); } // rodada 23: anel pulsando no eco desperto
      }
      if (!inCrypt && fishIcon.complete && fishIcon.naturalWidth) { // rodada 27: cardumes; rodada 28: 7 px quando o lago tem mais de um
        const per = new Map(); for (const o of objects) if (o.type === "res" && o.lake) per.set(o.lake, (per.get(o.lake) || 0) + 1);
        for (const o of objects) if (o.type === "res" && o.lake) { const z = per.get(o.lake) > 1 ? 7 : 10; g.drawImage(fishIcon, (o.x + 0.5) * sx - z / 2, (o.y + 0.5) * sy - z / 2, z, z); }
      }
      for (const o of [npc.merchant, npc.guard, npc.bank, npc.furnace, npc.board, npc.bard, npc.crypt, npc.chest, npc.exit].filter(Boolean)) dot((o.x + 0.5) * sx, (o.y + 0.5) * sy, 1.8, "#f1c40f");
      const goals = api.state().goals || []; // rodada 78: objetivos da campanha (losango ciano pulsando)
      if (goals.length) { const k = 3.2 + Math.sin(performance.now() / 220) * 0.8; for (const o of goals) { const x = (o.x + 0.5) * sx, y = (o.y + 0.5) * sy;
        g.beginPath(); g.moveTo(x, y - k - 1.5); g.lineTo(x + k + 1.5, y); g.lineTo(x, y + k + 1.5); g.lineTo(x - k - 1.5, y); g.closePath(); g.fillStyle = "#0a1a20"; g.fill();
        g.beginPath(); g.moveTo(x, y - k); g.lineTo(x + k, y); g.lineTo(x, y + k); g.lineTo(x - k, y); g.closePath(); g.fillStyle = "#7fe8ff"; g.fill(); } }
      g.strokeStyle = "#ffffff88"; g.lineWidth = 1;
      g.strokeRect(Math.round(cam.x / TILE * sx) + 0.5, Math.round(cam.y / TILE * sy) + 0.5, Math.round(canvas.width / TILE * sx), Math.round(canvas.height / TILE * sy));
      { // herói: seta branca com contorno, apontando para onde olha
        const a = { right: 0, downright: Math.PI / 4, down: Math.PI / 2, downleft: 3 * Math.PI / 4, left: Math.PI, upleft: -3 * Math.PI / 4, up: -Math.PI / 2, upright: -Math.PI / 4 }[player.dir] || 0, hx = (player.px + 0.5) * sx, hy = (player.py + 0.5) * sy;
        g.save(); g.translate(hx, hy); g.rotate(a); g.beginPath(); g.moveTo(5, 0); g.lineTo(-3.5, -3.8); g.lineTo(-1.5, 0); g.lineTo(-3.5, 3.8); g.closePath();
        g.fillStyle = "#ffffff"; g.strokeStyle = "#140c06"; g.lineWidth = 1.5; g.stroke(); g.fill(); g.restore();
      }
      const B = player.backHint; // rodada 58: caminho de volta na primeira entrada em região perigosa (pisca por 12 s; parado com "reduzir movimento")
      if (B && player.playT < B.until && !inCrypt) {
        const still = matchMedia("(prefers-reduced-motion: reduce)").matches, on = still || Math.floor(performance.now() / 300) % 2 === 0;
        if (on) {
          const x0 = (player.px + 0.5) * sx, y0 = (player.py + 0.5) * sy, x1 = (B.x + 0.5) * sx, y1 = (B.y + 0.5) * sy, dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy);
          if (d > 14) { // longe: linha tracejada até o ponto seguro
            g.strokeStyle = "#7dff9a"; g.lineWidth = 2; g.setLineDash([3, 2]); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.setLineDash([]);
            g.fillStyle = "#7dff9a"; g.beginPath(); g.arc(x1, y1, 4, 0, 6.29); g.fill(); g.strokeStyle = "#000"; g.lineWidth = 1; g.stroke();
          }
          if (d > 0.5 && backArrow.complete && backArrow.naturalWidth) { // rodada 59: seta a 8 px do herói, girada para o ponto (na divisa, o ponto fica colado no herói)
            const a = Math.atan2(dy, dx); g.save(); g.imageSmoothingEnabled = false;
            g.translate(Math.round(x0 + Math.cos(a) * 8), Math.round(y0 + Math.sin(a) * 8)); g.rotate(a); g.drawImage(backArrow, -8, -8, 16, 16); g.restore();
          } else if (d <= 14) { g.fillStyle = "#7dff9a"; g.beginPath(); g.arc(x1, y1, 4, 0, 6.29); g.fill(); } // sem a arte: o ponto de antes
        }
      }
      g.restore();
    }

    function drawLights(t) {
      const { map, objects, mobs, npc, player, groundItems, inCrypt } = api.state();
      const dark = inCrypt ? 0.86 : LIGHT.darkness(player.dayT);
      const S = npc.shrine; // rodada 49: velas (quentes, pulsando) e cristal (ciano fraco) do santuário; de dia só um brilho somado
      const shrineL = [];
      const vot = player.votiveT > 0; // rodada 51: chama votiva acesa
      if (S && !inCrypt) { const f = (1 + (S.flareT || 0) * 0.3) * (vot ? 1.3 : 1), ox = S.x * TILE - cam.x, oy = S.y * TILE - cam.y; // a arte (2x2) começa uma linha acima
        // rodada 50: o pulso segue o quadro de fx_candle_flames (10 fps); altura das chamas por quadro: 20,19,23,18,20,21 px
        const FL = [0.99, 0.94, 1.14, 0.89, 0.99, 1.04], k = FL[Math.floor(t * 10) % 6] * 0.35 + 0.65;
        for (const [u, v, r] of [[34, 91, 0.9], [72, 101, 0.8], [80, 100, 0.8]]) shrineL.push({ x: ox + u / 128 * 2 * TILE, y: oy + (v / 64 - 1) * TILE - TILE * 0.08, r: TILE * r * f * k, color: "rgba(255,170,70,A)", k, a: 0.16 }); // pavios medidos na arte (px de 128)
        shrineL.push({ x: ox + 0.48 * 2 * TILE, y: oy + (0.11 * 2 - 1) * TILE, r: TILE * 1.1, color: "rgba(110,230,255,A)", a: 0.07, slow: true });
        if (vot) for (const [u, v] of [[47, 108], [63, 113], [93, 110]]) shrineL.push({ x: ox + u / 64 * TILE, y: oy + (v / 64 - 1) * TILE - TILE * 0.1, r: TILE * 0.6 * k, color: "rgba(255,180,80,A)", k, a: 0.12 }); // rodada 52: velas votivas
        // rodada 51: a tigela (59,77 na arte) brilha quando as moedas chegam (quadros 5–7 da folha, ~0,45 s) e apaga em 0,8 s
        const ct = S.coinT; if (ct != null && ct > 0.4) { const kb = Math.max(0, 1 - (ct - 0.4) / 0.8); if (kb > 0) shrineL.push({ x: ox + 59 / 64 * TILE, y: oy + (77 / 64 - 1) * TILE, r: TILE * (0.5 + 0.35 * kb), color: "rgba(255,214,90,A)", k: 1, a: 0.3 * kb }); } }
      if (vot && !inCrypt) shrineL.push({ x: (player.px + 0.5) * TILE - cam.x, y: (player.py + 0.1) * TILE - cam.y, r: TILE * 1.6, color: "rgba(255,196,90,A)", warm: true, a: 0.1 }); // chama votiva com o herói
      if (dark <= 0.01) { if (shrineL.length) lightFx.glow(ctx, shrineL, t); return; }
      const L = [...shrineL], x0 = cam.x - TILE * 3, x1 = cam.x + canvas.width + TILE * 3, y0 = cam.y - TILE * 3, y1 = cam.y + canvas.height + TILE * 3;
      const add = (wx, wy, r, color, warm) => { const sx = wx * TILE - cam.x, sy = wy * TILE - cam.y; if (sx > -r && sy > -r && sx < canvas.width + r && sy < canvas.height + r) L.push({ x: sx, y: sy, r, color, warm }); };
      for (const o of objects) {
        if (o.x * TILE < x0 || o.x * TILE > x1 || o.y * TILE < y0 || o.y * TILE > y1) continue;
        if (o.spr === "deco_seal_pedestal_lit") add(o.x + 0.5, o.y - 0.6, TILE * 3, "rgba(220,250,255,A)"); // rodada 83: selo refeito
        else if (o.spr === "deco_rift_brazier") add(o.x + 0.5, o.y - 0.2, TILE * 3.6, "rgba(110,230,255,A)"); // rodada 82: cristal flutuante da Fenda (luz fria)
        else if (o.type === "fire" || o.type === "furnace") add(o.x + 0.5, o.y + 0.4, TILE * (o.brazier ? 4 : 3.6), "rgba(255,150,60,A)", true);
        else if (o.type === "house") { add(o.x + 0.7, o.y + 0.9, TILE * 1.3, "rgba(255,200,110,A)", true); add(o.x + 2.3, o.y + 0.9, TILE * 1.3, "rgba(255,200,110,A)", true); }
        else if (o.spr === "deco_lamppost") add(o.x + 0.78, o.y - 0.72, TILE * 2.8, "rgba(255,196,110,A)", true); // rodada 67: lanterna do poste
        else if (o.spr === "deco_plateau_cairn") add(o.x + 0.5, o.y - 0.4, TILE * 1.6, "rgba(90,220,255,A)"); // cristal do marco do Planalto
        else if (o.spr === "deco_lumita_marker_lit") add(o.x + 0.5, o.y - 0.75, TILE * 2.2, "rgba(90,220,255,A)"); // rodada 79: marco da campanha aceso
        else if (o.spr === "deco_lumita_heart_lit") add(o.x + 0.5, o.y - 0.5, TILE * 2.6, "rgba(90,220,255,A)"); // rodada 81: Coração de lumita
        else if (o.spr === "camp_bras") add(o.x + 2.55, o.y + 1.0, TILE * 1.5, "rgba(255,196,110,A)", true); // lamparina do poste baixo, embaixo à direita
        else if (o.spr === "tent_odilia") add(o.x + 0.55, o.y - 0.25, TILE * 1.5, "rgba(255,196,110,A)", true); // rodada 80: lamparina da tenda
        else if (o.type === "rune" && /_lit$/.test(o.spr)) add(o.x + 0.5, o.y - 0.3, TILE * 1.2, "rgba(90,220,255,A)"); // estela acesa
        else if (o.spr === "house_juna") add(o.x + 1.3, o.y + 0.9, TILE * 1.4, "rgba(255,200,110,A)", true); // janela da cabana da Juna
        else if (o.type === "res" && o.kind === "rock_lumita" && !(o.respawn > 0)) add(o.x + 0.5, o.y + 0.4, TILE * 1.4, "rgba(90,220,255,A)");
        else if (o.type === "res" && o.golden > 0) add(o.x + 0.5, o.y + 0.5, TILE * 1.6, "rgba(255,216,74,A)");
        else if (o.type === "crypt_chest" && ((!o.opened && !mobs.some((m) => !m.dead)) || (o.openT != null && !o.looted))) add(o.x + 0.5, o.y + 0.4, TILE * 2, "rgba(241,196,15,A)");
        else if (o.type === "crypt_chest" && o.glowT > 0) add(o.x + 0.5, o.y + 0.3, TILE * (2 + o.glowT), "rgba(255,214,90,A)", true); // luz do tesouro
        else if (o.type === "bard") add(o.x + 0.5, o.y + 0.3, TILE * 1.4);
      }
      for (const m of mobs) if (m.dead && m.respawnAt && m.d.marker && m.d.marker.light) add(m.respawnAt.x + 0.5, m.respawnAt.y + 0.5, TILE * 1.1, m.d.marker.light); // fogo-fátuo, brilho da poça
      for (const m of mobs) if (!m.dead && m.enraged && m.d.enrage && m.d.enrage.light) add(m.px + 0.5, m.py + 0.5, TILE * 3.2, m.d.enrage.light, true); // aura da fúria
      for (const m of mobs) if (!m.dead && m.d.mini) add(m.px + 0.5, m.py + 0.3, TILE * 2, m.d.light || (m.moon ? "rgba(170,210,255,A)" : "rgba(110,230,255,A)")); // mini-chefes brilham (rodada 78: cor própria)
      for (const g of groundItems) if (isSpecial(g.name) || g.aff) add(g.x + 0.5, g.y + 0.6, TILE * 1.2);
      for (const m of mobs) if (!m.dead && m.d.boss) add(m.px + 0.5, m.py + 0.3, TILE * 2.2, "rgba(160,90,255,A)");
      add(player.px + 0.5, player.py + 0.3, TILE * (inCrypt ? 3.4 : 3), "rgba(255,210,140,A)", true); // lanterna do herói
      const PR = ValdoraShrine.rankOf(player.offered || 0); if (PR && PR.halo) add(player.px + 0.5, player.py + 0.1, TILE * 1.8, PR.halo, true); // rodada 49: halo do título
      lightFx.draw(ctx, canvas.width, canvas.height, dark, L, t);
    }
    const lightFx = LIGHT.create();
    // rodada 105: mapa do continente (tecla M): fundo do minimapa, nomes dos biomas e vilas, Pedras, masmorras e o herói
    function drawWorldMap(cv) {
      if (!miniBase) return;
      const g = cv.getContext("2d"), Wd = window.ValdoraWorld, p = api.state().player, st = api.state();
      const k = Math.min(cv.width / W, cv.height / H), ox = (cv.width - W * k) / 2, oy = (cv.height - H * k) / 2, X = (x) => ox + x * k, Y = (y) => oy + y * k;
      g.fillStyle = "#123a66"; g.fillRect(0, 0, cv.width, cv.height);
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high"; g.drawImage(miniBase, ox, oy, W * k, H * k);
      g.textAlign = "center"; g.textBaseline = "middle";
      const label = (txt, x, y, size, col, sub) => { g.font = `bold ${size}px 'Valdora Pixel', 'Courier New', monospace`; g.lineWidth = 4; g.strokeStyle = "#000c"; g.strokeText(txt, x, y); g.fillStyle = col; g.fillText(txt, x, y);
        if (sub) { g.font = `${Math.round(size * 0.7)}px 'Valdora Pixel', 'Courier New', monospace`; g.strokeText(sub, x, y + size); g.fillStyle = "#f3e6c8"; g.fillText(sub, x, y + size); } };
      if (!st.inCrypt && Wd && Wd.BIOMES) {
        for (const B of Wd.BIOMES) label(B.name, X(B.c[0]), Y(B.c[1] - B.c[2] * 0.55), Math.max(12, Math.round(k * 7)), "#ffd84a", `nível ${B.lv[0]}–${B.lv[1]}`);
        const got = new Set(p.stones || ["lumeira"]);
        for (const v of Wd.VILLAGES) { const cx = X((v.x0 + v.x1 + 1) / 2), cy = Y((v.y0 + v.y1 + 1) / 2), on = got.has(v.key);
          g.fillStyle = on ? "#7fe8ff" : "#8a8a8a"; g.strokeStyle = "#000"; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, cy - 7); g.lineTo(cx + 6, cy); g.lineTo(cx, cy + 7); g.lineTo(cx - 6, cy); g.closePath(); g.fill(); g.stroke();
          label(v.name + (p.spawnStone === v.key || (!p.spawnStone && v.main) ? " ✦" : ""), cx, cy + 16, Math.max(11, Math.round(k * 5)), on ? "#ffffff" : "#bbbbbb"); }
        for (const E of Wd.DG_ENTRIES) { const x = X(E.x + 0.5), y = Y(E.y + 0.5); g.fillStyle = "#c0392b"; g.strokeStyle = "#000"; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 5, 0, 6.29); g.fill(); g.stroke();
          label(E.name, x, y - 13, Math.max(10, Math.round(k * 4.2)), "#ff9a8a"); }
        for (const D of Wd.DOCKS || []) { const x = X(D.x + 0.5 + D.dx * 3), y = Y(D.y + 0.5 + D.dy * 3); // rodada 120: cais (âncora)
          g.strokeStyle = "#000"; g.lineWidth = 4; g.beginPath(); g.moveTo(x, y - 6); g.lineTo(x, y + 6); g.moveTo(x - 5, y + 2); g.quadraticCurveTo(x, y + 9, x + 5, y + 2); g.moveTo(x - 3, y - 3); g.lineTo(x + 3, y - 3); g.stroke();
          g.strokeStyle = "#8fd8ff"; g.lineWidth = 2; g.stroke(); label(D.name, x, y - 14, Math.max(10, Math.round(k * 4)), "#8fd8ff"); }
      }
      const hx = X(p.px + 0.5), hy = Y(p.py + 0.5), pulse = 7 + Math.sin(performance.now() / 200) * 2;
      g.strokeStyle = "#ffffff"; g.lineWidth = 2; g.beginPath(); g.arc(hx, hy, pulse, 0, 6.29); g.stroke(); g.fillStyle = "#f1c40f"; g.beginPath(); g.arc(hx, hy, 4, 0, 6.29); g.fill();
      g.strokeStyle = "#ffffff99"; g.lineWidth = 1; g.strokeRect(X(cam.x / TILE), Y(cam.y / TILE), canvas.width / TILE * k, canvas.height / TILE * k);
    }
    return { buildMinimap, drawMinimap, drawLights, miniView, drawWorldMap };
  }
  return { create };
})();

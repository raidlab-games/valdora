// Valdora — desenho dos monstros (rodada 16: saiu do game.js): folhas do Blender (idle, walk, attack, special, hit, howl, wake, sleep),
// a animação procedural de reserva, as estrelinhas do atordoamento e o corpo que some depois da morte.
window.ValdoraActors = (() => {
  "use strict";
  function create(api) {
    const { ctx, cam, TILE, TICK, ANIMS, SPR, ease, tags, animFrame, drawAnim, shadowAt, whiteOf } = api;
    // rodada 25: cópia tingida de cada folha, feita uma vez (ctx.filter a cada quadro custava ~13% do quadro com um eco na tela)
    const tintCache = new WeakMap();
    // rodada 105: vista do monstro pela direção (8). De frente, de costas e nas diagonais a folha é outra ("<spr>@<vista>",
    // carregada só quando o monstro está por perto); o lado direito é o esquerdo espelhado. Enquanto a vista carrega, ou em
    // linhas que não giram (uivo, fúria...), usa a folha de lado virada para o lado do jogador.
    const VIEW = { down: ["down", false], downleft: ["downleft", false], downright: ["downleft", true], left: [null, false], right: [null, true],
      upleft: ["upleft", false], upright: ["upleft", true], up: ["up", false] };
    function mobSheet(spr, dir8, face, row) {
      const A = ANIMS[spr], v = dir8 && VIEW[dir8], meta = (window.ANIM_SHEETS || {})[spr];
      if (v && v[0] && meta && meta.views && meta.views.includes(v[0])) {
        const V = api.lazyAnim(spr + "@" + v[0]);
        if (V && V.rows[row]) return [V, v[1]];
      }
      return [A, face > 0];
    }
    function tinted(A, tint) {
      if (!tint) return A;
      let byTint = tintCache.get(A); if (!byTint) tintCache.set(A, (byTint = new Map()));
      let T = byTint.get(tint);
      if (!T) { const c = document.createElement("canvas"); c.width = A.c.width; c.height = A.c.height; const g = c.getContext("2d"); g.filter = tint; g.drawImage(A.c, 0, 0); T = { ...A, c }; byTint.set(tint, T); }
      return T;
    }
    function drawMob(m, t) {
      if (ANIMS[m.d.spr]) return drawMobAnim(m, t);
      const d = m.d, img = SPR[d.spr]; if (!img) return;
      const walk = d.walk && SPR[d.walk], s = d.scale || 1, w = img.width * s, h = img.height * s, moving = m.prog < 1;
      const dirx = Math.sign(api.player().x - m.x), diry = Math.sign(api.player().y - m.y);
      let sx = 1, sy = 1, lift = 0, tilt = 0, ox = 0, oy = 0;
      if (d.squish) { // slime: agacha → salta esticado → aterrissa amassado
        const p = m.prog;
        if (moving && p < 0.2) { const k = ease.outQuad(p / 0.2); sy = 1 - 0.22 * k; sx = 1 + 0.18 * k; }
        else if (moving && p < 0.8) { const k = (p - 0.2) / 0.6; lift = Math.sin(Math.PI * k) * 15; sy = 1.15 - 0.12 * k; sx = 0.9 + 0.06 * k; }
        else if (moving) { const k = (p - 0.8) / 0.2; sy = 0.8 + 0.2 * ease.outBack(k); sx = 1.2 - 0.2 * ease.outQuad(k); }
        else { const b = Math.sin(t * 4.5 + m.phase); sy = 1 + b * 0.06; sx = 1 - b * 0.045; }
      } else if (moving) { lift = Math.abs(Math.sin(m.dist * Math.PI * 2)) * 2.5; tilt = Math.sin(m.dist * Math.PI * 2) * 0.035; }
      else { const b = Math.sin(t * 2.6 + m.phase); sy = 1 + b * 0.022; sx = 1 - b * 0.01; }
      if (m.prep > 0) { const k = ease.outQuad(1 - m.prep / TICK); ox -= dirx * 6 * k; oy -= diry * 4 * k; sy *= 1 - 0.07 * k; sx *= 1 + 0.06 * k; } // preparação
      if (m.lunge > 0) { const k = Math.sin(m.lunge * Math.PI); ox += dirx * 10 * k; oy += diry * 7 * k; sx *= 1 + 0.1 * k; sy *= 1 - 0.05 * k; } // bote
      if (m.kb > 0) { const k = ease.outQuad(Math.min(1, m.kb)); ox -= dirx * 7 * k; oy -= diry * 5 * k; lift += 3 * k; tilt += -dirx * 0.08 * k; } // apanhou
      if (m.windup > 0) { sy *= 1.06; tilt = -0.12 * (m.face > 0 ? -1 : 1) + Math.sin(t * 40) * 0.02; }
      const sr = Math.min(0.9, 0.3 * w / TILE) * (1 - lift / 45);
      shadowAt(Math.round(m.px * TILE - cam.x + TILE / 2 + ox), Math.round((m.py + 0.95) * TILE - cam.y + oy), sr * TILE, sr * TILE * 0.35);
      const cx = Math.round(m.px * TILE - cam.x + TILE / 2 + ox), by = Math.round((m.py + 1) * TILE - cam.y + oy - lift);
      if (d.boss) { // aura do chefe
        const r = TILE * (1.2 + Math.sin(t * 3) * 0.08), grd = ctx.createRadialGradient(cx, by - h * 0.4, 6, cx, by - h * 0.4, r);
        grd.addColorStop(0, "#9d5cff55"); grd.addColorStop(1, "#9d5cff00"); ctx.fillStyle = grd; ctx.fillRect(cx - r, by - h * 0.4 - r, r * 2, r * 2);
      }
      ctx.save(); ctx.translate(cx, by); ctx.rotate(tilt); if (m.face > 0) ctx.scale(-1, 1); ctx.scale(sx, sy);
      if (d.tint) ctx.filter = d.tint;
      if (walk && moving) { const fw = walk.width / 4, f = Math.floor(m.dist * 4) % 4; ctx.drawImage(walk, f * fw, 0, fw, walk.height, -w / 2, -h, w, h); }
      else ctx.drawImage(img, -w / 2, -h, w, h);
      ctx.filter = "none";
      if (m.flash > 0) { const wimg = whiteOf(d.spr); if (wimg) { ctx.globalAlpha = Math.min(1, m.flash / 0.16) * 0.85; ctx.drawImage(wimg, -w / 2, -h, w, h); ctx.globalAlpha = 1; } }
      ctx.restore();
      const top = by - h * sy;
      if ((m.hp < d.hp || m.aggro) && !d.boss) {
        const bw = TILE - 12; ctx.fillStyle = "#000"; ctx.fillRect(cx - bw / 2 - 1, top - 7, bw + 2, 6);
        ctx.fillStyle = "#c0392b"; ctx.fillRect(cx - bw / 2, top - 6, bw, 4); ctx.fillStyle = "#3fd05a"; ctx.fillRect(cx - bw / 2, top - 6, bw * m.hp / d.hp, 4);
      }
      if (d.boss && !m.aggro) tags.push([d.name, m.px + 0.5, (top + cam.y) / TILE - 0.05, "#c79bff"]); // rodada 70: em luta o nome fica na barra do topo
    }
    function drawMobAnim(m, t) {
      const fade = m.appear != null ? Math.max(0, Math.min(1, m.appear / 0.5)) : 1; if (fade <= 0) return; // eco surgindo (rodada 23)
      if (fade < 1) { ctx.save(); ctx.globalAlpha = fade; drawMobAnimBody(m, t); ctx.restore(); return; }
      drawMobAnimBody(m, t);
    }
    function drawMobAnimBody(m, t) {
      const d = m.d, A = ANIMS[d.spr], an = m.an || { s: "idle", t: 0 }, s = d.scale || 1, moving = m.prog < 1;
      const dirx = Math.sign(api.player().x - m.x), diry = Math.sign(api.player().y - m.y);
      let row = an.s, frame;
      if (row === "walk") { const R = A.rows.walk; frame = d.squish ? Math.min(R.frames - 1, Math.floor(m.prog * R.frames)) : Math.floor(m.dist * 4) % R.frames; } // passo ligado à distância
      else { const R = A.rows[row] || A.rows.idle; if (!A.rows[row]) row = "idle"; frame = animFrame(R, an.t + (R.loop ? m.phase : 0)); }
      let ox = 0, oy = 0;
      if (m.kb > 0) { const k = ease.outQuad(Math.min(1, m.kb)); ox -= dirx * 6 * k; oy -= diry * 4 * k; } // recuo ao apanhar (complementa o quadro de hit)
      if (m.windup > 0 && !(an.s === "special")) ox += Math.sin(t * 45) * 1.5; // tremor do chefe preparando o golpe (a folha "special" já treme)
      const footX = Math.round(m.px * TILE - cam.x + TILE / 2 + ox), footY = Math.round((m.py + 1) * TILE - cam.y + oy);
      const img = SPR[d.spr], w = (img ? img.width : TILE) * s, h = (img ? img.height : TILE) * s;
      const sr = Math.min(0.9, 0.3 * w / TILE);
      shadowAt(footX, Math.round((m.py + 0.95) * TILE - cam.y + oy), sr * TILE, sr * TILE * 0.35);
      if (d.boss) { // aura do chefe
        const r = TILE * (1.2 + Math.sin(t * 3) * 0.08), grd = ctx.createRadialGradient(footX, footY - h * 0.4, 6, footX, footY - h * 0.4, r);
        grd.addColorStop(0, "#9d5cff55"); grd.addColorStop(1, "#9d5cff00"); ctx.fillStyle = grd; ctx.fillRect(footX - r, footY - h * 0.4 - r, r * 2, r * 2);
      }
      if (d.alpha) ctx.globalAlpha *= d.alpha; // rodada 83: eco translúcido (o Blender achata o alfa parcial da arte)
      const [SA, flip] = mobSheet(d.spr, m.dir8, m.face, row);
      drawAnim(tinted(SA, d.tint), row, frame, footX, footY, flip, s, m.flash > 0 ? Math.min(1, m.flash / 0.16) * 0.85 : 0);
      if (d.alpha) ctx.globalAlpha /= d.alpha;
      const top = footY - h;
      if (m.windup > 0 && SPR.icon_dodge_64) { const ic = SPR.icon_dodge_64, bob = Math.sin(t * 9) * 3; ctx.drawImage(ic, footX - ic.width / 2, top - ic.height - 26 + bob); } // "saia do círculo"
      if ((m.hp < d.hp || m.aggro) && !d.boss && !(m.pet && m.down)) { // rodada 97: dormindo na vila, sem barra
        const bw = TILE - 12; ctx.fillStyle = "#000"; ctx.fillRect(footX - bw / 2 - 1, top - 7, bw + 2, 6);
        ctx.fillStyle = "#c0392b"; ctx.fillRect(footX - bw / 2, top - 6, bw, 4); ctx.fillStyle = m.pet ? "#6fc3ff" : "#3fd05a"; ctx.fillRect(footX - bw / 2, top - 6, bw * Math.max(0, m.hp) / d.hp, 4); // rodada 96: filhote em azul
      }
      if (d.boss && !m.aggro) tags.push([d.name, m.px + 0.5, (top + cam.y) / TILE - 0.05, "#c79bff"]); // rodada 70: em luta o nome fica na barra do topo
      if (m.stun > 0) drawStun(footX, top - 6, t);
    }
    function drawStun(x, y, t) { // estrelinhas girando sobre a cabeça
      ctx.font = "12px 'Valdora Pixel', 'Courier New', monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#ffe680";
      for (let i = 0; i < 3; i++) { const a = t * 5 + i * 2.09; ctx.globalAlpha = 0.6 + 0.4 * Math.sin(a); ctx.fillText("✦", x + Math.cos(a) * 14, y + Math.sin(a) * 4); }
      ctx.globalAlpha = 1;
    }
    function drawCorpse(c) { // derrota: quadros de morte (Blender) uma vez, depois some em fade
      if (c.ghost && ANIMS[c.spr]) { // eco se desfazendo: parado, some enquanto a névoa sobe (rodada 24)
        ctx.globalAlpha = Math.max(0, 1 - c.t / c.life);
        drawAnim(tinted(ANIMS[c.spr], c.tint), "idle", 0, Math.round(c.x * TILE - cam.x + TILE / 2), Math.round((c.y + 1) * TILE - cam.y), c.face > 0, c.scale);
        ctx.globalAlpha = 1; return;
      }
      if (c.anim) {
        const A = ANIMS[c.spr], R = A.rows.death, dur = R.frames / R.fps, [SA, flip] = mobSheet(c.spr, c.dir8, c.face, "death");
        ctx.globalAlpha = c.t > dur ? Math.max(0, 1 - (c.t - dur) / 0.6) : 1;
        drawAnim(tinted(SA, c.tint), "death", Math.min(R.frames - 1, Math.floor(c.t * R.fps)), Math.round(c.x * TILE - cam.x + TILE / 2), Math.round((c.y + 1) * TILE - cam.y), flip, c.scale);
        ctx.globalAlpha = 1; return;
      }
      const img = SPR[c.spr]; if (!img) return;
      const k = c.t / 0.8, w = img.width * c.scale, h = img.height * c.scale;
      ctx.save(); ctx.translate(Math.round(c.x * TILE - cam.x + TILE / 2), Math.round((c.y + 1) * TILE - cam.y));
      ctx.globalAlpha = k > 0.6 ? Math.max(0, 1 - (k - 0.6) / 0.4) : 1; // valor negativo seria ignorado pelo canvas (corpo voltava inteiro)
      if (c.squish) { const e = ease.outQuad(Math.min(1, k * 2)); ctx.scale(1 + e * 0.6, 1 - e * 0.85); }
      else { const e = ease.outBack(Math.min(1, Math.max(0, (k - 0.08) / 0.45))); ctx.rotate(c.dir * e * 1.45); ctx.translate(0, k * 6); }
      if (c.face > 0) ctx.scale(-1, 1);
      if (c.tint) ctx.filter = c.tint;
      ctx.drawImage(img, -w / 2, -h, w, h); ctx.filter = "none";
      if (k < 0.12) { const wimg = whiteOf(c.spr); if (wimg) { ctx.globalAlpha = 0.9 * (1 - k / 0.12); ctx.drawImage(wimg, -w / 2, -h, w, h); } }
      ctx.restore(); ctx.globalAlpha = 1;
    }
    return { drawMob, drawMobAnim, drawCorpse, drawStun };
  }
  return { create };
})();

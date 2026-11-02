// Valdora — desenho dos objetos do mapa (rodada 18: saiu do game.js): casas, estações, NPCs (idle, fala e caminhada),
// cenário com balanço/chamas do Blender, pedras reagindo ao golpe, baú abrindo, boneco de treino, fumaça e marcas "!"/"?".
window.ValdoraScenery = (() => {
  "use strict";
  function create(api) {
    const { ctx, cam, TILE, ANIMS, SPR, HERO_SHEET, TUTORIAL, tags, animFrame, drawAnim, drawFx, drawSmoke, sceneryFrame, shadow, questMark } = api;
    function drawObject(o, t) {
      const player = api.player(), dlg = api.dlg(), bubble = api.bubble(), mobs = api.mobs();
      const img = SPR[o.spr]; if (!img) return;
      const mvx = o.mv ? (o.mv.fx - o.x) * (1 - o.mv.t) : 0, mvy = o.mv ? (o.mv.fy - o.y) * (1 - o.mv.t) : 0; // NPC andando
      const scen = sceneryFrame(o, t), HA = ANIMS[o.spr] && ANIMS[o.spr].rows.hit ? ANIMS[o.spr] : null;
      const hitF = HA && o.hitT != null ? Math.floor(o.hitT * HA.rows.hit.fps) : -1, rockHit = hitF >= 0 && hitF < HA.rows.hit.frames;
      const sh = o.shake > 0 && !scen && !HA ? Math.sin(o.shake * 60) * 3 : 0; // tremor procedural só sem folha do Blender
      const sx = Math.round((o.x + mvx + (o.ox || 0)) * TILE - cam.x + (o.w * TILE - img.width) / 2 + sh), sy = Math.round((o.y + mvy + o.h) * TILE - cam.y - img.height * (1 - ((window.SPRITE_SINK || {})[o.spr] || 0))); // rodada 109: SPRITE_SINK
      if ((o.type === "fire" || o.type === "furnace") && o.spr !== "deco_rift_brazier") { // brilho quente (rodada 82: o cristal da Fenda não)
        const gx = sx + img.width / 2, gy = sy + img.height * 0.65, r = TILE * (1.3 + Math.sin(t * 9) * 0.06 + Math.sin(t * 23) * 0.03);
        const grd = ctx.createRadialGradient(gx, gy, 4, gx, gy, r); grd.addColorStop(0, "#ffb34766"); grd.addColorStop(1, "#ffb34700");
        ctx.fillStyle = grd; ctx.fillRect(gx - r, gy - r, r * 2, r * 2);
      }
      if (o.type === "merchant" || o.type === "guard" || o.type === "bard" || o.type === "herb" || o.type === "carto" || o.type === "miner") shadow(o.x + mvx + 0.5, o.y + mvy + 0.95, 0.32);
      if (o.type === "home" && o.spr !== "house_hero_lot") shadow(o.x + o.w / 2, o.y + o.h - 0.02, 1.55); // rodada 102: sombra curta da casa e dos pedestais
      if (o.type === "pedestal" && o.spr) shadow(o.x + 0.5, o.y + 0.93, 0.4);
      // jogador escondido atrás da arte (copa, telhado): desenha translúcido
      const psx = player.px * TILE - cam.x + TILE / 2, psy = player.py * TILE - cam.y + TILE / 2;
      const behind = player.py < o.y + o.h - 1 + 0.01 && psx > sx && psx < sx + img.width && psy > sy && psy < sy + img.height;
      if (behind) ctx.globalAlpha = 0.5;
      if ((o.type === "merchant" || o.type === "guard" || o.type === "bard" || o.type === "herb" || o.type === "carto" || o.type === "miner") && ANIMS[o.spr]) { // idle animado (Blender); rodada 79: e a Juna
        const A = ANIMS[o.spr], talk = A.rows.talk && ((dlg && dlg.kind === { merchant: "shop", guard: "guard", bard: "bard", herb: "herb", carto: "carto", miner: "miner" }[o.type]) || (bubble && bubble.o === o));
        // rodada 73: parado, olha para o herói (ou para a banca) pelo quadro em pé da folha de 4 direções; de frente fica o idle animado
        const look = !o.mv && o.lookDir && o.lookDir !== "down" && !talk && !o.react && !o.rise && !(o.sitT > 0) && !o.singing;
        const WS = (o.mv || look) && SPR[o.spr + "_sheet"], fx0 = Math.round((o.x + mvx + 0.5) * TILE - cam.x), fy0 = Math.round((o.y + mvy + 1) * TILE - cam.y);
        if (WS) { // passo pela folha de 4 direções (mesmo formato da do herói)
          const dx = o.mv ? o.x - o.mv.fx : 0, dy = o.mv ? o.y - o.mv.fy : 0, dir = !o.mv ? o.lookDir : window.DIR_AT(dx, dy) || "down"; // rodada 105: 8 direções
          const fw = WS.width / HERO_SHEET.cols, fh = WS.height / HERO_SHEET.rows.length, col = !o.mv ? 0 : HERO_SHEET.walk[Math.floor(((o.steps || 0) + o.mv.t) * 2) % HERO_SHEET.walk.length];
          const LK = !o.mv && ANIMS[o.spr + "_look"], lkR = LK && (LK.rows["idle_" + dir] ? "idle_" + dir : "idle_" + window.DIR4(dir)), LR = LK && LK.rows[lkR]; // rodada 74: olhando de lado/de costas, respirando
          const W6 = o.mv && ANIMS[o.spr + "_walk6"], wkR = W6 && (W6.rows["walk_" + dir] ? "walk_" + dir : "walk_" + window.DIR4(dir)), WR = W6 && W6.rows[wkR]; // caminhada 3D em 6 quadros (Blender)
          if (WR) drawAnim(W6, wkR, Math.floor(((o.steps || 0) + o.mv.t) * 3) % WR.frames, fx0, fy0, false); else
          if (LR) drawAnim(LK, lkR, animFrame(LR, t + (o.x * 0.37)), fx0, fy0, false); else
          ctx.drawImage(WS, col * fw, HERO_SHEET.rows.indexOf(window.DIR4(dir)) * fh, fw, fh, fx0 - fw / 2, fy0 - fh, fw, fh);
        } else {
          // rodada 25: o Tomé dedilha (linha "play") com a janela de canções aberta ou cantando no balão (falas com ♪)
          const sing = o.type === "bard" && A.rows.play && !o.react && ((dlg && dlg.kind === "bard") || (bubble && bubble.o === o && String(bubble.text).includes("♪")));
          const rising = o.rise && A.rows.stand_up; // rodada 38: Tomé levantando do tronco (0–1 na altura do tronco, 2–3 no chão)
          if (rising) { const R = A.rows.stand_up, f = Math.min(R.frames - 1, Math.floor(o.rise.t * R.fps)); drawAnim(A, "stand_up", f, fx0, f < 2 ? fy0 - Math.round(TILE * 0.3) : fy0, false); }
          const salute = !rising && o.react && A.rows[o.react.row]; // rodada 34/35: continência do Ivo / joinha do Bento (segura o último quadro)
          if (salute) { const R = A.rows[o.react.row]; drawAnim(A, o.react.row, Math.min(R.frames - 1, Math.floor(o.react.t * R.fps)), fx0, fy0, false); }
          const seated = o.sitT > 0 && A.rows.sit; // rodada 33: sentado no tronco tocando (base 0,3 tile acima do pé, no topo do tronco)
          const row = seated ? "sit" : o.mv && A.rows.walk ? "walk" : sing ? "play" : talk ? "talk" : "idle"; o.singing = !!sing;
          if (!salute && !rising) drawAnim(A, row, animFrame(A.rows[row], t + (o.hx ?? o.x) * 0.37), fx0, seated ? fy0 - Math.round(TILE * 0.3) : fy0, false);
          const N = sing && ANIMS.fx_music_notes; // rodada 26: notas douradas subindo do ombro do Tomé enquanto ele toca
          if (N) { const R = N.rows.loop; drawFx(N, Math.floor(t * R.fps) % R.frames, Math.round(fx0 + TILE * 0.35 - N.cw / 2), Math.round(fy0 - TILE * 0.95 - N.ch * 0.88)); }
        }
      } else if (o.type === "merchant" || o.type === "guard" || o.type === "bard" || o.type === "herb" || o.type === "carto" || o.type === "miner") { // respiração leve dos NPCs (rodada 79: e a Juna)
        const k = 1 + Math.sin(t * 2.2 + o.x) * 0.018;
        ctx.drawImage(img, sx, sy + img.height * (1 - k), img.width, img.height * k);
      } else if (scen) drawAnim(scen.A, scen.row, scen.f, Math.round((o.x + (o.ox || 0) + o.w / 2) * TILE - cam.x), Math.round((o.y + o.h) * TILE - cam.y), false);
      else if (o.type === "dummy" && o.swingT != null && ANIMS.deco_dummy && ANIMS.deco_dummy.rows.swing) { const R = ANIMS.deco_dummy.rows.swing; drawAnim(ANIMS.deco_dummy, "swing", Math.min(R.frames - 1, Math.floor(o.swingT * R.fps)), Math.round((o.x + 0.5) * TILE - cam.x), Math.round((o.y + 1) * TILE - cam.y), false); }
      else if (o.type === "dummy" && o.wobbleT != null && ANIMS.deco_dummy) { const R = ANIMS.deco_dummy.rows.wobble; drawAnim(ANIMS.deco_dummy, "wobble", Math.min(R.frames - 1, Math.floor(o.wobbleT * R.fps)), Math.round((o.x + 0.5) * TILE - cam.x), Math.round((o.y + 1) * TILE - cam.y), false); }
      else if (rockHit) drawAnim(HA, "hit", hitF, Math.round((o.x + o.w / 2) * TILE - cam.x), Math.round((o.y + o.h) * TILE - cam.y), false);
      else if (o.type === "crypt_chest" && o.spr === "chest" && o.openT != null && ANIMS.chest_open && o.openT < ANIMS.chest_open.rows.open.frames / ANIMS.chest_open.rows.open.fps) {
        const R = ANIMS.chest_open.rows.open; drawAnim(ANIMS.chest_open, "open", Math.min(R.frames - 1, Math.floor(o.openT * R.fps)), Math.round((o.x + 0.5) * TILE - cam.x), Math.round((o.y + 1) * TILE - cam.y), false);
      } else ctx.drawImage(img, sx, sy);
      if ((o.type === "marker" || o.type === "rune" || o.type === "seal") && o.fade > 0 && SPR[o.fadeFrom]) { ctx.globalAlpha = Math.min(1, o.fade); ctx.drawImage(SPR[o.fadeFrom], sx, sy); ctx.globalAlpha = 1; } // rodada 79: marco acendendo
      const OV = o.spr === "deco_shrine_offering" && ANIMS.fx_candle_flames; // rodada 50: chamas das velas (Blender), no mesmo retângulo da arte
      if (OV) { const R = OV.rows.loop; ctx.drawImage(OV.c, (Math.floor(t * R.fps) % R.frames) * OV.cw, R.row * OV.ch, OV.cw, OV.ch, sx, sy, img.width, img.height); }
      const VC = o.spr === "deco_shrine_offering" && player.votiveT > 0 && ANIMS.fx_votive_candles; // rodada 52: velas votivas nos degraus
      if (VC) { const R = VC.rows.loop; ctx.drawImage(VC.c, (Math.floor(t * R.fps + 2) % R.frames) * VC.cw, R.row * VC.ch, VC.cw, VC.ch, sx, sy, img.width, img.height); }
      const OC = o.spr === "deco_shrine_offering" && o.coinT != null && ANIMS.fx_offering_coins; // rodada 51: moedas caindo na tigela (sem loop)
      if (OC) { const R = OC.rows.loop, f = Math.floor(o.coinT * R.fps); if (f < R.frames) ctx.drawImage(OC.c, f * OC.cw, R.row * OC.ch, OC.cw, OC.ch, sx, sy, img.width, img.height); }
      drawSmoke(o, sx, sy, img, t); // chaminés e fogueiras (Blender)
      if (o.top && SPR[o.top]) { const tp = SPR[o.top]; ctx.drawImage(tp, Math.round(sx + (img.width - tp.width) / 2), Math.round(sy + img.height * 0.45 - tp.height)); } // rodada 100: troféu no tampo do pedestal
      if (o.type === "fire" && o.sizzleUntil > performance.now() / 1000 && ANIMS.fx_cook_sizzle) { // rodada 28: comida chiando na brasa
        const S = ANIMS.fx_cook_sizzle, R = S.rows.loop; drawFx(S, Math.floor(t * R.fps) % R.frames, Math.round((o.x + 0.5) * TILE - cam.x - S.cw / 2), Math.round((o.y + 0.78) * TILE - cam.y - S.ch * 0.88));
      }
      if (o.type === "dummy" && o.drill && SPR.icon_dodge_area_64) { const ic = SPR.icon_dodge_area_64; ctx.drawImage(ic, sx + img.width / 2 - ic.width / 2, sy - ic.height - 6 + Math.sin(t * 9) * 3); }
      ctx.globalAlpha = 1;
      if (o.type === "merchant") tags.push([o.name || "Bento", o.x + mvx + 0.5, (sy + cam.y) / TILE + 0.05, "#f5e27a"]); // rodada 105: mercadores das vilas novas
      const lift = o.type === "bard" && o.singing ? 0.45 : o.type === "bard" && o.sitT > 0 ? -0.28 : 0; // rodada 27: sobem com as notas; rodada 34: descem com ele sentado
      if (o.type === "bard") tags.push(["Tomé", o.x + 0.5, (sy + cam.y) / TILE + 0.05 - lift, "#f5c060"]);
      if (o.type === "crypt_chest" && !o.opened && !mobs.some((m) => !m.dead)) { const gy = sy + 6 + Math.sin(t * 4) * 3; ctx.fillStyle = "#f1c40f"; ctx.font = "bold 18px 'Courier New', monospace"; ctx.textAlign = "center"; ctx.fillText("✦", sx + img.width / 2, gy); }
      if (o.type === "guard") {
        tags.push(["Ivo", o.x + mvx + 0.5, (sy + cam.y) / TILE + 0.05, "#9fd0ff"]);
      }
      if (o.type === "miner") tags.push(["Brás", o.x + 0.5, (sy + cam.y) / TILE + 0.05, "#e8b070"]); // rodada 81
      if (o.type === "carto") tags.push(["Odília", o.x + 0.5, (sy + cam.y) / TILE + 0.05, "#b8c8ff"]); // rodada 80
      if (o.type === "herb") tags.push(["Juna", o.x + 0.5, (sy + cam.y) / TILE + 0.05, "#8fe08a"]); // rodada 79
      if (o.type === "guard" || o.type === "bard" || o.type === "merchant" || o.type === "herb" || o.type === "carto" || o.type === "miner") { // "!" tutorial ou missão nova; "?" missão pronta para entregar
        const mark = o.village ? null : o.type === "guard" && TUTORIAL[player.tut.step] && player.tut.step === 0 ? "!" : questMark(o.type === "merchant" ? "shop" : o.type); // rodada 105: missões só com os da Lumeira
        if (mark) {
          const by = sy - 14 - lift * TILE + Math.sin(t * 5) * 3; ctx.font = "24px 'Valdora Pixel', 'Courier New', monospace"; ctx.textAlign = "center";
          ctx.lineWidth = 4; ctx.strokeStyle = "#000"; ctx.strokeText(mark, sx + img.width / 2, by); ctx.fillStyle = mark === "?" ? "#7dff9a" : "#f1c40f"; ctx.fillText(mark, sx + img.width / 2, by);
        }
      }
    }
    return { drawObject };
  }
  return { create };
})();

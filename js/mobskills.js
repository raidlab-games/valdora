// Valdora — habilidades próprias dos monstros (rodada 133; rodada 134: bestiário completo). Um monstro com `skills` nos dados
// (js/data.js) decide mais do que "andar até o herói e bater". Recargas em segundos (cd); chances de 0 a 1 (p).
//   leap   { range, cd, cry }        salto com aviso: marca o tile do herói, voa e desce; quem sai do tile escapa
//   charge { range, cd }             investida: risca a linha até o herói e dispara por ela; quem sai da linha escapa
//   ranged { range, proj, kite, eff } atira de longe (flecha, pedra, feitiço, teia, cuspe, bomba, bola de neve...): rodada 136:
//                                    o projétil é teleguiado (segue o herói e sempre acerta, a não ser que ele entre numa vila
//                                    antes de o tiro chegar); kite = recua se encostado
//   summon { type, n, cd, max, cry } chama ajudantes temporários (o tipo vem dos dados), no máximo `max` vivos
//   heal   { pct, cd, r }            cura o aliado mais ferido por perto (ou a si mesmo)
//   roar   { r, cd, eff, cry }       rugido/nova em área com aviso no chão: dano leve e o efeito (lento)
//   bleed / poison { p, dmg? }       golpe que acerta abre ferida ou envenena (3 pulsos, 1 por segundo)
//   slow   { p, t }                  golpe que acerta deixa o herói lento por t segundos
//   lifesteal k                      recupera k x o dano que causa
//   regen  pct                       fora de perigo por 3 s, regenera pct da vida por tick
//   block  { p }                     apara de frente: chance p de reduzir o golpe em 70%
//   dodge  { p }                     ágil: chance p de desviar do golpe inteiro
//   blink  { cd }                    ao levar golpe, some e reaparece ao lado do herói (outro lado)
//   split  { type, n }               ao morrer, se divide em n menores
//   spores { r }                     ao morrer, solta uma nuvem venenosa (com aviso) em volta
//   flank                            cerco: se outro monstro já bate no herói, vai para o lado de lá
// A risada/uivo que chama o bando é a fúria dos dados (`enrage.at`, `enrage.pack`, game.js → enrageMob).
window.ValdoraMobSkills = (() => {
  "use strict";
  // cores e tamanhos dos projéteis (desenhados na hora: rastro, ponta e brilho)
  const PROJ = {
    arrow: { c: "#e8d8b0", tip: "#c0c4cc", len: 0.5, sp: 11 }, stone: { c: "#9a9086", r: 0.09, sp: 9 }, bolt: { c: "#c070ff", r: 0.13, glow: 1, sp: 8 },
    web: { c: "#f0f0f8", r: 0.14, sp: 8 }, spit: { c: "#8ce060", r: 0.11, sp: 8 }, sting: { c: "#f0c040", tip: "#302820", len: 0.25, sp: 12 },
    feather: { c: "#b08a60", tip: "#5a4030", len: 0.32, sp: 11 }, javelin: { c: "#a07848", tip: "#d0d0d8", len: 0.8, sp: 10 },
    snowball: { c: "#f4f8ff", r: 0.16, sp: 7, arc: 1 }, ice: { c: "#a8e8ff", tip: "#ffffff", len: 0.34, glow: 1, sp: 11 }, bomb: { c: "#2a2830", r: 0.13, sp: 6, arc: 1.4, fuse: 1 },
    curse: { c: "#ffd060", r: 0.12, glow: 1, sp: 8 }, frost: { c: "#80e0ff", r: 0.13, glow: 1, sp: 8 }, crystal: { c: "#80f0ff", tip: "#ffffff", len: 0.3, glow: 1, sp: 10 },
    fire: { c: "#ff8040", r: 0.13, glow: 1, sp: 8 }, rock: { c: "#8a8070", r: 0.17, sp: 7, arc: 1 },
  };
  const DOT = { bleed: { c: "#d03030", txt: "sangrando!", log: "abriu uma ferida: você está sangrando." }, poison: { c: "#70d040", txt: "envenenado!", log: "envenenou você." } };
  function create(api) {
    const { rand, ri, TICK } = api;
    const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
    const onPlayer = (p, x, y) => (p.gx != null ? Math.abs(2 * x - p.gx) <= 1 && Math.abs(2 * y - p.gy) <= 1 : p.x === x && p.y === y);
    const ORTHO = [[1, 0], [-1, 0], [0, 1], [0, -1]], AROUND = [...ORTHO, [1, 1], [1, -1], [-1, 1], [-1, -1]];
    const free = (m, x, y) => api.mobCan(m, x, y) && !api.mobAt(x, y);
    const ready = (m, k) => !(m.cds && m.cds[k] > 0);
    const useCd = (m, k, sec) => { (m.cds || (m.cds = {}))[k] = Math.round(sec / TICK); };
    const shots = [], blasts = [];

    // linha de visão entre dois tiles (nada sólido no meio)
    function los(a, b) {
      let x = a.x, y = a.y; const dx = Math.abs(b.x - x), dy = Math.abs(b.y - y), sx = Math.sign(b.x - x), sy = Math.sign(b.y - y); let e = dx - dy;
      while (x !== b.x || y !== b.y) { const e2 = 2 * e; if (e2 > -dy) { e -= dy; x += sx; } if (e2 < dx) { e += dx; y += sy; } if ((x !== b.x || y !== b.y) && !api.open(x, y)) return false; }
      return true;
    }
    // começa um golpe preparado (aviso no chão), resolvido no fim do aviso (windupEnd)
    function prep(m, kind, data, row, ticks = 2) {
      m.windup = ticks; m.pending = Object.assign({ special: true, [kind]: data }, data.pe || {}); api.SND.play("warn");
      const R = row && api.row(m, row); if (R) m.an = { s: row, t: 0, still: 0, speed: Math.min(1, (R.impact ?? R.frames - 1) / R.fps / Math.max(0.3, ticks * TICK - 0.12)) };
    }

    // ---------- decisão no tick (antes de "anda e bate"); true = já agiu ----------
    function think(m, near, fromTick = true) { // fromTick: chamado no tick (conta as recargas); senão, da perseguição contínua
      const S = m.d.skills, p = api.player(); if (!S || p.deadT > 0) return false;
      if (fromTick && m.cds) for (const k in m.cds) if (m.cds[k] > 0) m.cds[k]--;
      if (m.prog < 1) return false;
      const dd = cheb(m, p);
      // rodada 137: com pouca vida, quem cura cuida de si antes de tudo
      if (S.heal && ready(m, "heal") && m.hp < m.d.hp * 0.5) { const t = healTarget(m, S.heal); if (t) { useCd(m, "heal", S.heal.cd || 8); doHeal(m, t, S.heal); return true; } }
      if (S.summon && ready(m, "summon") && api.temps(m) < (S.summon.max || 3) && dd <= 8) { useCd(m, "summon", S.summon.cd || 14); startSummon(m); return true; }
      if (S.heal && ready(m, "heal")) { const t = healTarget(m, S.heal); if (t) { useCd(m, "heal", S.heal.cd || 8); doHeal(m, t, S.heal); return true; } }
      if (S.roar && ready(m, "roar") && dd <= (S.roar.r || 2) + 1) { useCd(m, "roar", S.roar.cd || 10); startRoar(m, S.roar); return true; }
      if (S.charge && ready(m, "charge") && dd >= 2 && dd <= S.charge.range) {
        const line = chargeLine(m, p, S.charge.range); if (line) { useCd(m, "charge", S.charge.cd || 7); startCharge(m, line); return true; } }
      if (S.leap && !near && ready(m, "leap") && api.hasRow(m, "special") && dd >= 2 && dd <= S.leap.range) {
        const L = landing(m, p); if (L) { useCd(m, "leap", S.leap.cd || 8); startLeap(m, p, L); return true; } }
      if (S.ranged) {
        if (near && S.ranged.kite && rand() < 0.75 && stepAway(m, p)) return true; // rodada 137: recua mais (era 55%)
        if (dd <= S.ranged.range && dd >= (near ? 1 : 2) && los(m, p)) { if (m.atkT <= 0) shoot(m, p); else api.faceAt(m, p.x, p.y); return true; }
      }
      if (S.flank && !near) return flank(m, p);
      return false;
    }
    // entre os ticks: quem atira de longe não chega mais perto; quem cerca, cerca
    function hold(m) {
      const S = m.d.skills; if (!S || m.prog < 1) return false; const p = api.player();
      if (S.ranged && cheb(m, p) <= S.ranged.range && los(m, p)) return true;
      return !!(S.flank && flank(m, p));
    }

    // ---------- tiro ----------
    function shoot(m, p) {
      const d = m.d, R = d.skills.ranged, st = api.combatStats(); api.faceAt(m, p.x, p.y);
      const pe = { shot: { tx: p.px, ty: p.py, kind: R.proj || "arrow", eff: R.eff, hit: true, dmg: ri(1, d.maxHit) } }; // rodada 136: teleguiado, sempre acerta
      if (api.hasRow(m, "attack")) { m.an = { s: "attack", t: 0, still: 0 }; m.pending = pe; } else fire(m, pe);
      m.atkT = d.speed;
    }
    function fire(m, pe) { // quadro de impacto da folha de ataque: o projétil sai da mão
      const s = pe.shot, P = PROJ[s.kind] || PROJ.arrow, sx = m.px + 0.5 + (m.face || 0) * 0.3, sy = m.py - 0.55;
      const dist = Math.hypot(s.tx + 0.5 - sx, s.ty + 0.3 - sy);
      shots.push({ x: sx, y: sy, x0: sx, y0: sy, tx: s.tx + 0.5, ty: s.ty + 0.3, t: 0, T: Math.max(0.15, dist / P.sp), kind: s.kind, m, hit: s.hit, dmg: s.dmg, eff: s.eff, sp: P.sp, life: 0 });
      api.SND.play(s.kind === "arrow" || s.kind === "javelin" ? "bow" : "swing");
    }
    function update(dt) {
      const p = api.player();
      for (let i = shots.length - 1; i >= 0; i--) {
        // rodada 136: teleguiado. O alvo acompanha o herói a cada quadro e o tiro voa direto para ele (o arco das bombas e bolas
        // de neve fica por cima); só some se o herói entrar numa vila (ou cair) antes de o tiro chegar.
        const s = shots[i], P = PROJ[s.kind] || PROJ.arrow; s.life += dt;
        if (p.deadT > 0 || (api.inTown && api.inTown(p.x, p.y)) || s.life > 8) { shots.splice(i, 1); api.puff(s.x, s.y, P.c); continue; }
        s.tx = p.px + 0.5; s.ty = p.py + 0.3;
        const gx = s.gx ?? s.x0, gy = s.gy ?? s.y0, dx = s.tx - gx, dy = s.ty - gy, L = Math.hypot(dx, dy), step = (s.sp || P.sp) * dt;
        s.gx = L <= step ? s.tx : gx + dx / L * step; s.gy = L <= step ? s.ty : gy + dy / L * step;
        s.t = Math.min(s.T, s.t + dt); const k = Math.min(1, s.t / s.T);
        s.x = s.gx; s.y = s.gy - (P.arc ? Math.sin(Math.PI * k) * P.arc * Math.min(1, L) : 0);
        if (L > step) continue;
        shots.splice(i, 1);
        if (P.fuse) { api.boom(s.tx, s.ty); api.hurtPlayer(s.m, Math.ceil(s.dmg * 1.6), { heavy: true, color: "#ff9040" }); continue; } // bomba: explode no herói
        api.hurtPlayer(s.m, s.dmg, { color: P.c }); applyEff(s.m, s.eff);
      }
      for (let i = blasts.length - 1; i >= 0; i--) { // bomba no chão: pisca e explode
        const b = blasts[i]; b.t += dt; if (b.t < b.T) continue; blasts.splice(i, 1);
        api.boom(b.x + 0.5, b.y + 0.5);
        if (Math.abs(p.x - b.x) <= b.r && Math.abs(p.y - b.y) <= b.r && p.deadT <= 0) api.hurtPlayer(b.m, b.dmg, { heavy: true, color: "#ff9040" });
        else api.addFloat(p.px + 0.5, p.py - 0.6, "esquivou!", "#9fe08a", 1, 14);
      }
    }
    function draw(ctx, cam, TILE) {
      for (const s of shots) {
        const P = PROJ[s.kind] || PROJ.arrow, x = s.x * TILE - cam.x, y = s.y * TILE - cam.y;
        if (P.glow) { ctx.globalAlpha = 0.35; ctx.fillStyle = P.c; ctx.beginPath(); ctx.arc(x, y, TILE * (P.r || 0.15) * 2.2, 0, 6.29); ctx.fill(); ctx.globalAlpha = 1; }
        if (P.len) { // dardo: haste na direção do voo e ponta
          const a = Math.atan2(s.ty - s.y, s.tx - s.x), L = P.len * TILE, cx = Math.cos(a), cy = Math.sin(a);
          ctx.strokeStyle = "#1a1418"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - cx * L, y - cy * L); ctx.lineTo(x, y); ctx.stroke();
          ctx.strokeStyle = P.c; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - cx * L, y - cy * L); ctx.lineTo(x, y); ctx.stroke();
          ctx.fillStyle = P.tip || P.c; ctx.fillRect(Math.round(x - 2), Math.round(y - 2), 4, 4);
        } else {
          const r = Math.max(3, TILE * P.r); ctx.fillStyle = "#1a1418"; ctx.beginPath(); ctx.arc(x, y, r + 1.5, 0, 6.29); ctx.fill();
          ctx.fillStyle = P.c; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.29); ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.fillRect(Math.round(x - r * 0.4), Math.round(y - r * 0.5), Math.max(1, r * 0.4), Math.max(1, r * 0.4));
          if (P.fuse) { ctx.fillStyle = (s.t * 12) % 2 < 1 ? "#ffd060" : "#ff6030"; ctx.fillRect(Math.round(x + r * 0.5), Math.round(y - r - 3), 3, 3); }
        }
      }
    }
    const warnTiles = () => { // tiles com aviso no chão (bombas no chão; o resto vem do pending de cada monstro)
      const out = []; for (const b of blasts) for (let dy = -b.r; dy <= b.r; dy++) for (let dx = -b.r; dx <= b.r; dx++) out.push([b.x + dx, b.y + dy, b.t]);
      return out;
    };
    function stepAway(m, p) {
      let best = null, bd = cheb(m, p);
      for (const [dx, dy] of AROUND) { const x = m.x + dx, y = m.y + dy; if (!free(m, x, y)) continue; const d = Math.max(Math.abs(x - p.x), Math.abs(y - p.y)); if (d > bd) { bd = d; best = [x, y]; } }
      if (!best) return false; api.mobMove(m, best[0], best[1]); return true;
    }

    // ---------- salto ----------
    function landing(m, p) {
      return ORTHO.map(([dx, dy]) => ({ x: p.x + dx, y: p.y + dy })).filter((t) => free(m, t.x, t.y))
        .sort((a, b) => Math.hypot(a.x - m.x, a.y - m.y) - Math.hypot(b.x - m.x, b.y - m.y))[0] || null;
    }
    function startLeap(m, p, L) {
      const d = m.d, st = api.combatStats(); api.faceAt(m, p.x, p.y);
      prep(m, "leap", { tx: p.x, ty: p.y, lx: L.x, ly: L.y, moved: false, pe: { heavy: true, hit: rand() < api.hitChance(d.atk + 6, st.def, (d.lvl || 1) - api.pLvl()), dmg: ri(Math.ceil(d.maxHit * 1.0), Math.ceil(d.maxHit * 1.7)) } }, "special");
      api.addFloat(m.px + 0.5, m.py - 1.9, d.skills.leap.cry || "Salto!", "#ff6b5a", 1.3, 16);
    }
    function leapFly(m) {
      const L = m.pending.leap; L.moved = true;
      if (!free(m, L.lx, L.ly)) return;
      m.fx = m.x; m.fy = m.y; m.x = L.lx; m.y = L.ly; m.prog = 0; m.fly = true; api.reindex(m);
    }
    function land(m, pe) {
      const L = pe.leap, p = api.player();
      api.dust(m.x, m.y + 0.2); api.mark(L.tx + 0.5, L.ty + 0.9, 1.0);
      if (!onPlayer(p, L.tx, L.ty) || cheb(m, { x: L.tx, y: L.ty }) > 1) { api.addFloat(p.px + 0.5, p.py - 0.6, "esquivou!", "#9fe08a", 1, 14); return; }
      api.applyMobHit(m, { heavy: true, hit: pe.hit, dmg: pe.dmg, bleed: !!m.d.skills.bleed });
    }

    // ---------- investida em linha ----------
    function chargeLine(m, p, range) { // a linha (qualquer ângulo) até o herói e um tile além dele
      const tiles = []; let x = m.x, y = m.y; const dx = Math.abs(p.x - x), dy = Math.abs(p.y - y), sx = Math.sign(p.x - x), sy = Math.sign(p.y - y); let e = dx - dy;
      while (x !== p.x || y !== p.y) { const e2 = 2 * e; if (e2 > -dy) { e -= dy; x += sx; } if (e2 < dx) { e += dx; y += sy; } if (!api.open(x, y)) return null; tiles.push([x, y]); }
      const nx = x + (dx >= dy ? sx : 0), ny = y + (dy > dx ? sy : 0); if (api.open(nx, ny)) tiles.push([nx, ny]);
      return tiles.length <= range + 1 ? tiles : null;
    }
    function startCharge(m, tiles) {
      const d = m.d, st = api.combatStats(); api.faceAt(m, tiles[0][0], tiles[0][1]);
      prep(m, "charge", { tiles, pe: { heavy: true, hit: rand() < api.hitChance(d.atk + 8, st.def, (d.lvl || 1) - api.pLvl()), dmg: ri(Math.ceil(d.maxHit * 1.1), Math.ceil(d.maxHit * 1.8)) } }, null);
      api.addFloat(m.px + 0.5, m.py - 1.9, "Investida!", "#ff6b5a", 1.2, 16);
    }
    function chargeGo(m) {
      const C = m.pending.charge, pe = m.pending, p = api.player(); m.pending = null;
      let hit = false, last = null;
      for (const [x, y] of C.tiles) { if (onPlayer(p, x, y)) { hit = true; break; } if (!free(m, x, y)) break; last = [x, y]; }
      if (last) { m.fx = m.x; m.fy = m.y; m.x = last[0]; m.y = last[1]; m.prog = 0; m.fly = true; api.reindex(m); }
      if (api.hasRow(m, "attack")) m.an = { s: "attack", t: 0, still: 0 };
      api.dust(m.x, m.y + 0.2);
      if (hit && pe.hit) { api.hurtPlayer(m, pe.dmg, { heavy: true }); api.slowPlayer(1.2, m); }
      else api.addFloat(p.px + 0.5, p.py - 0.6, hit ? "bloqueou" : "esquivou!", "#9fe08a", 1, 14);
    }

    // ---------- rugido / nova em área ----------
    function startRoar(m, R) {
      const tiles = []; for (let dy = -R.r; dy <= R.r; dy++) for (let dx = -R.r; dx <= R.r; dx++) if ((dx || dy) && Math.hypot(dx, dy) <= R.r + 0.4) tiles.push([m.x + dx, m.y + dy]);
      prep(m, "roar", { tiles, pe: {} }, api.hasRow(m, "howl") ? "howl" : api.hasRow(m, "special") ? "special" : null, 2);
      api.addFloat(m.px + 0.5, m.py - 2, R.cry || "RUGIDO!", "#ff9a5a", 1.3, 17);
    }
    function roarGo(m) {
      const R = m.d.skills.roar, p = api.player(), T = m.pending.roar.tiles; m.pending = null;
      api.shake(0.3); api.mark(m.px + 0.5, m.py + 0.9, R.r + 0.6);
      if (T.some(([x, y]) => onPlayer(p, x, y)) && p.deadT <= 0) { api.hurtPlayer(m, ri(1, Math.ceil(m.d.maxHit * 0.7)), { color: "#ffb070" }); applyEff(m, R.eff || "slow"); }
      else api.addFloat(p.px + 0.5, p.py - 0.6, "esquivou!", "#9fe08a", 1, 14);
    }

    // ---------- invocar e curar ----------
    function startSummon(m) {
      prep(m, "summon", { pe: {} }, api.hasRow(m, "special") ? "special" : "attack", 2);
      api.addFloat(m.px + 0.5, m.py - 2, m.d.skills.summon.cry || "Venham!", "#c79bff", 1.6, 16);
    }
    function summonGo(m) { m.pending = null; const S = m.d.skills.summon; api.summon(m, S.type, S.n || 2); }
    function healTarget(m, H) {
      let best = null, bk = 0.7;
      for (const o of api.mobs()) { if (o.dead || cheb(o, m) > (H.r || 5)) continue; const k = o.hp / o.d.hp; if (k < bk) { bk = k; best = o; } }
      return best;
    }
    function doHeal(m, t, H) {
      const v = Math.max(1, Math.round(t.d.hp * (H.pct || 0.2))); t.hp = Math.min(t.d.hp, t.hp + v);
      api.addFloat(t.px + 0.5, t.py - 1.6, "+" + v, "#7dff9a", 1.1, 15); api.burst(t.px + 0.5, t.py + 0.3, ["#7dff9a", "#e0ffe0"], 12, 2);
      if (api.hasRow(m, "attack")) m.an = { s: "attack", t: 0, still: 0 }; api.faceAt(m, t.x, t.y); m.atkT = m.d.speed;
    }
    // fim do aviso (mobs.js): resolve o que estava preparado
    function windupEnd(m) {
      const pe = m.pending; if (!pe) return false;
      if (pe.charge) { chargeGo(m); return true; }
      if (pe.roar) { roarGo(m); return true; }
      if (pe.summon) { summonGo(m); return true; }
      return false;
    }

    // ---------- efeitos no herói ----------
    function applyEff(m, eff) {
      if (!eff) return;
      if (eff === "slow" || eff === "web" || eff === "frost" || eff === "curse") api.slowPlayer(eff === "web" ? 2.4 : 2.0, m);
      else if (eff === "poison" || eff === "bleed") dot(m, eff);
    }
    function dot(m, kind) {
      const p = api.player(), K = DOT[kind], S = m.d.skills[kind] || {}, dmg = S.dmg || Math.max(1, Math.round(m.d.maxHit * (kind === "poison" ? 0.3 : 0.35)));
      if (!p.dot || p.dot.kind !== kind) { api.addFloat(p.px + 0.5, p.py - 1.0, K.txt, K.c, 1.1, 13); api.log(`${m.d.name} ${K.log}`, "warn"); }
      p.dot = { kind, n: 3, t: 1, dmg, c: K.c };
    }
    // um golpe que acertou (perto ou longe): sangra, envenena, deixa lento, rouba vida
    function onHit(m, pe, dmg) {
      const S = m.d.skills; if (!S) return;
      if (pe.bleed || (S.bleed && rand() < S.bleed.p)) dot(m, "bleed");
      if (S.poison && rand() < S.poison.p) dot(m, "poison");
      if (S.slow && rand() < S.slow.p) api.slowPlayer(S.slow.t || 1.8, m);
      if (S.lifesteal) { const v = Math.max(1, Math.round(dmg * S.lifesteal)); m.hp = Math.min(m.d.hp, m.hp + v); api.addFloat(m.px + 0.5, m.py - 1.5, "+" + v, "#7dff9a", 0.9, 13); }
    }
    // dano no monstro: bloqueio de frente e teleporte curto
    function guard(m, dmg) {
      const S = m.d.skills; if (!S) return dmg;
      m.lastHurtT = api.tickN();
      if (S.dodge && rand() < S.dodge.p) { api.addFloat(m.px + 0.5, m.py - 1.5, "esquivou!", "#e8e0a0", 0.9, 13); return 0; } // ágil (raposa, lebre)
      if (S.block && rand() < S.block.p) { api.addFloat(m.px + 0.5, m.py - 1.6, "aparou!", "#9fd0ff", 0.9, 13); api.sparks(m.px + 0.5, m.py + 0.1); dmg = Math.max(1, Math.round(dmg * 0.3)); }
      if (S.blink && ready(m, "blink") && m.hp - dmg > 0 && rand() < 0.6) { useCd(m, "blink", S.blink.cd || 6); setTimeout(() => blink(m), 120); }
      return dmg;
    }
    function blink(m) {
      if (m.dead) return; const p = api.player(), opts = [];
      for (const [dx, dy] of AROUND) for (const k of [2, 3]) { const x = p.x + dx * k, y = p.y + dy * k; if (free(m, x, y) && cheb({ x, y }, m) >= 2) opts.push([x, y]); }
      if (!opts.length) return; const [x, y] = opts[Math.floor(rand() * opts.length)];
      api.burst(m.px + 0.5, m.py + 0.2, [m.d.color || "#c79bff", "#ffffff"], 14, 3);
      m.x = m.fx = x; m.y = m.fy = y; m.px = x; m.py = y; m.prog = 1; api.reindex(m); m.pending = null; m.windup = 0;
      api.burst(x + 0.5, y + 0.2, [m.d.color || "#c79bff", "#ffffff"], 14, 3); api.faceAt(m, p.x, p.y);
    }
    // regeneração (troll): no tick, sem levar golpe há 3 s
    function tick(m) {
      const S = m.d.skills; if (!S || !S.regen || m.dead || m.hp >= m.d.hp) return;
      if (api.tickN() - (m.lastHurtT || 0) > 6) { const v = Math.max(1, Math.round(m.d.hp * S.regen)); m.hp = Math.min(m.d.hp, m.hp + v); if (m.aggro) api.addFloat(m.px + 0.5, m.py - 1.5, "+" + v, "#7dff9a", 0.8, 12); }
    }
    // ao morrer: divide (slimes) ou solta esporos (cogumelo)
    function onDeath(m) {
      const S = m.d.skills; if (!S) return;
      if (S.split) for (let i = 0; i < (S.split.n || 2); i++) api.spawnNear(m, S.split.type);
      if (S.spores) { const r = S.spores.r || 1; blasts.push({ x: m.x, y: m.y, t: 0, T: 0.9, m, dmg: Math.max(1, Math.round(m.d.maxHit * 0.6)), r, poison: true }); }
    }
    // cerco
    function flank(m, p) {
      const others = api.mobs().filter((o) => o !== m && !o.dead && o.aggro && cheb(o, p) === 1); if (!others.length) return false;
      let best = null, bs = -1;
      for (const [dx, dy] of AROUND) {
        const t = { x: p.x + dx, y: p.y + dy }; if (!free(m, t.x, t.y)) continue;
        const s = Math.min(...others.map((o) => Math.hypot(o.x - t.x, o.y - t.y))) * 10 - Math.hypot(t.x - m.x, t.y - m.y);
        if (s > bs) { bs = s; best = t; }
      }
      if (!best) return false;
      api.mobStepToward(m, best.x, best.y); return true;
    }
    const wantsBleed = () => false; // compatível com a rodada 133 (agora onHit decide)
    const clear = () => { shots.length = 0; blasts.length = 0; };
    return { think, hold, fire, update, draw, warnTiles, leapFly, land, windupEnd, onHit, guard, tick, onDeath, dot, wantsBleed, clear,
      flank: (m) => hold(m) };
  }
  return { create, PROJ };
})();

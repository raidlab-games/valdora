// Valdora — habilidades próprias dos monstros (rodada 133). Um monstro com `skills` nos dados (js/data.js) decide mais do
// que "andar até o herói e bater":
//   leap  { range, cd }  salto com aviso: marca no chão o tile do herói, salta (voa no meio da folha "special") e desce com o
//                        golpe no quadro de impacto; quem sai do tile marcado a tempo escapa. Recarga em segundos.
//   bleed { p }          golpe que acerta abre uma ferida (chance p): o herói sangra 3 vezes, 1 por segundo
//   flank                cerco: se outro monstro já está batendo no herói, vai para o lado de lá (não fica na fila)
// A risada que chama o bando é a fúria dos dados (`enrage.at`, `enrage.pack`, game.js → enrageMob).
window.ValdoraMobSkills = (() => {
  "use strict";
  function create(api) {
    const { rand, ri, TICK } = api;
    const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
    const onPlayer = (p, x, y) => (p.gx != null ? Math.abs(2 * x - p.gx) <= 1 && Math.abs(2 * y - p.gy) <= 1 : p.x === x && p.y === y);
    const ORTHO = [[1, 0], [-1, 0], [0, 1], [0, -1]], AROUND = [...ORTHO, [1, 1], [1, -1], [-1, 1], [-1, -1]];

    // no tick do monstro em combate, antes de "anda e bate"; true = já agiu neste tick
    function think(m, near) {
      const S = m.d.skills, p = api.player(); if (!S || p.deadT > 0) return false;
      if (m.leapCd > 0) m.leapCd--;
      if (S.leap && !near && m.prog >= 1 && !(m.leapCd > 0) && api.hasRow(m, "special")) {
        const dd = cheb(m, p);
        if (dd >= 2 && dd <= S.leap.range) { const L = landing(m, p); if (L) { startLeap(m, p, L); return true; } }
      }
      if (S.flank && !near && m.prog >= 1) return flank(m, p);
      return false;
    }
    // onde cair: um tile ao lado do herói (sem diagonal: o golpe só acerta de frente), do lado de onde o monstro vem
    function landing(m, p) {
      return ORTHO.map(([dx, dy]) => ({ x: p.x + dx, y: p.y + dy })).filter((t) => api.mobCan(m, t.x, t.y) && !api.mobAt(t.x, t.y))
        .sort((a, b) => Math.hypot(a.x - m.x, a.y - m.y) - Math.hypot(b.x - m.x, b.y - m.y))[0] || null;
    }
    function startLeap(m, p, L) {
      const d = m.d, st = api.combatStats();
      m.windup = 2; m.leapCd = Math.round(d.skills.leap.cd / TICK); api.faceAt(m, p.x, p.y); api.SND.play("warn");
      const R = api.row(m, "special"); // a folha toca no ritmo do aviso: o impacto (quadro 6) cai no fim dele
      m.an = { s: "special", t: 0, still: 0, speed: Math.min(1, (R.impact ?? 6) / R.fps / Math.max(0.3, m.windup * TICK - 0.12)) };
      m.pending = { special: true, heavy: true, leap: { tx: p.x, ty: p.y, lx: L.x, ly: L.y, moved: false },
        hit: rand() < api.hitChance(d.atk + 6, st.def), dmg: ri(Math.ceil(d.maxHit * 1.0), Math.ceil(d.maxHit * 1.7)) };
      api.addFloat(m.px + 0.5, m.py - 1.9, d.skills.leap.cry || "Salto!", "#ff6b5a", 1.3, 16);
    }
    // quadro do voo (mobs.js → mobAnim): sai do chão e cruza até o tile de pouso
    function leapFly(m) {
      const L = m.pending.leap; L.moved = true;
      if (!api.mobCan(m, L.lx, L.ly) || api.mobAt(L.lx, L.ly)) return; // alguém ocupou o pouso: desce onde está
      m.fx = m.x; m.fy = m.y; m.x = L.lx; m.y = L.ly; m.prog = 0; m.fly = true; api.reindex(m);
    }
    // quadro de impacto: o golpe só acerta quem continua no tile marcado
    function land(m, pe) {
      const L = pe.leap, p = api.player();
      api.dust(m.x, m.y + 0.2); api.mark(L.tx + 0.5, L.ty + 0.9, 1.0);
      if (!onPlayer(p, L.tx, L.ty) || cheb(m, { x: L.tx, y: L.ty }) > 1) { api.addFloat(p.px + 0.5, p.py - 0.6, "esquivou!", "#9fe08a", 1, 14); return; }
      api.applyMobHit(m, { heavy: true, hit: pe.hit, dmg: pe.dmg, bleed: true, any: true });
    }
    // ferida: 3 pulsos de dano, 1 por segundo (o mesmo pulso não acumula: renova)
    function bleed(m) {
      const p = api.player(), dmg = Math.max(1, Math.round(m.d.maxHit * 0.35));
      if (!p.bleed) { api.addFloat(p.px + 0.5, p.py - 1.0, "sangrando!", "#ff4a4a", 1.1, 13); api.log(`${m.d.name} abriu uma ferida: você está sangrando.`, "warn"); }
      p.bleed = { n: 3, t: 1, dmg };
    }
    const wantsBleed = (m, pe) => pe.hit && (pe.bleed || (m.d.skills && m.d.skills.bleed && rand() < m.d.skills.bleed.p));
    // cerco: se outro monstro já está colado no herói, escolhe o lado mais longe dele
    function flank(m, p) {
      const others = api.mobs().filter((o) => o !== m && !o.dead && o.aggro && cheb(o, p) === 1); if (!others.length) return false;
      let best = null, bs = -1;
      for (const [dx, dy] of AROUND) {
        const t = { x: p.x + dx, y: p.y + dy }; if (!api.mobCan(m, t.x, t.y) || api.mobAt(t.x, t.y)) continue;
        const s = Math.min(...others.map((o) => Math.hypot(o.x - t.x, o.y - t.y))) * 10 - Math.hypot(t.x - m.x, t.y - m.y);
        if (s > bs) { bs = s; best = t; }
      }
      if (!best) return false;
      api.mobStepToward(m, best.x, best.y); return true;
    }
    const flankStep = (m) => !!(m.d.skills && m.d.skills.flank && m.prog >= 1 && flank(m, api.player()));
    return { think, leapFly, land, bleed, wantsBleed, flank: flankStep };
  }
  return { create };
})();

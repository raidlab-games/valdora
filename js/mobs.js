// Valdora — IA e animação dos monstros (rodada 10: saiu do game.js).
// Tick de decisão (perseguir, atacar, golpe especial com aviso, uivo do Alfa, voltar para casa), passos e máquina de estados
// das folhas do Blender: idle → walk → attack/special → hit → death, mais "howl". O dano entra no quadro de impacto (applyMobHit).
window.ValdoraMobs = (() => {
  "use strict";
  function create(api) {
    const { ANIMS, TICK, DIRS, SND, rand, ri, hitChance, lv, inTown, walkable, regionAt, combatStats, mobAttack, applyMobHit, addFloat, burst, hitSplat, playerDied } = api;
    function mobTick(m) {
      const player = api.player(), d = m.d, dist = Math.abs(m.x - player.x) + Math.abs(m.y - player.y);
      if (m.stun > 0) return; // atordoado: não age
      if (m.appear != null) return; // eco ainda surgindo da névoa
      if (m.an && (m.an.s === "howl" || m.an.s === "wake" || m.an.s === "rise_up" || m.an.s === "enrage")) return; // uivando ou levantando: espera a folha terminar
    if (m.sleeping) { if (dist <= 2) wake(m); return; } // lobo dormindo na toca: acorda com o uivo do Alfa, com um golpe ou com o jogador a 2 passos
      if (m.howlPending && dist <= 8 && ANIMS[d.spr] && ANIMS[d.spr].rows.howl) { // uiva ao ver o jogador, antes de atacar
        m.howlPending = false; m.an = { s: "howl", t: 0, still: 0 }; m.face = player.x > m.x ? 1 : -1; api.howl(m); return;
      }
      if (m.atkT > 0) m.atkT--;
      if (m.aggro && m.atkT === 1 && dist === 1 && !m.windup && m.prog >= 1 && !ANIMS[d.spr]) m.prep = TICK; // recua antes de atacar (sem folha animada)
      if (!m.aggro && m.hp < d.hp && api.tickN() % 4 === 0) m.hp++; // regenera fora de combate
      if (!m.aggro && d.aggro && dist <= d.aggro && lv("combate") < d.lvl * 2 && !inTown(player.x, player.y) && !(player.deadT > 0) && !(api.calm && api.calm(m))) { // rodada 79: Marco da Mata aceso acalma os lobos
        m.aggro = true; m.atkT = 2;
        if (!d.mini && ANIMS[d.spr] && ANIMS[d.spr].rows.howl) { m.an = { s: "howl", t: 0, still: 0 }; m.howlFast = true; m.face = player.x > m.x ? 1 : -1; api.howl(m, true); return; } // uivo curto
      }
      if (m.aggro) {
        if (Math.hypot(m.x - m.hx, m.y - m.hy) > 11 || inTown(player.x, player.y) || dist > 14) { m.aggro = false; m.windup = 0; if (!m.temp) api.giveUp(m); if (m.temp && !m.dungeon) { if (d.echo) api.echoFade(m); m.dead = true; m.respawnT = 0; } return; } // eventos somem (o eco em névoa); masmorra não
        const spd = m.enraged ? Math.max(2, d.speed - 2) : d.speed;
        if (m.windup > 0) { // chefe preparando golpe especial
          if (--m.windup === 0) {
            if (m.an && m.an.s === "special") { /* já resolvido no quadro de impacto da carga */ }
            else if (d.slam) { if (ANIMS[d.spr]) mobAttack(m, false, true); else slam(m); }
            else if (dist === 1) mobAttack(m, true); // golpe pesado: só acerta se o jogador continuar ao lado
            else { addFloat(m.px + 0.5, m.py - 1.6, "esquivou!", "#9fe08a", 1, 14); burst(m.px + 0.5 + (player.x - m.x) * 0.6, m.py + 0.8, ["#c79bff", "#ffffff"], 10, 2); }
            m.atkT = spd;
          }
          return;
        }
        const pf = api.petFoe && api.petFoe(m, dist); // rodada 96: ao lado do filhote e longe do herói (ou mordido por último por ele): ataca o filhote
        if (pf) { m.face = pf.x > m.x ? 1 : pf.x < m.x ? -1 : m.face; if (m.atkT <= 0 && m.prog >= 1) { api.petAttack(m); m.atkT = spd; } return; }
        if (dist === 1) {
          m.face = player.x > m.x ? 1 : player.x < m.x ? -1 : m.face;
          if (m.atkT <= 0 && m.prog >= 1) {
            if ((d.boss || (d.special && ANIMS[d.spr] && ANIMS[d.spr].rows.special)) && ++m.swings % (d.slam ? 3 : 4) === 0) { // chefes e monstros com linha "special"
              m.windup = d.slam ? 3 : 2; SND.play("warn");
              if (ANIMS[d.spr] && ANIMS[d.spr].rows.special) { // carga sincronizada com a linha "special" da folha
                const st = combatStats(), SR = ANIMS[d.spr].rows.special;
              // a folha toca mais devagar para o impacto (quadro 6) cair perto do fim do aviso: dá tempo de sair andando (robô: rodada 13)
              m.an = { s: "special", t: 0, still: 0, speed: Math.min(1, (SR.impact ?? 6) / SR.fps / Math.max(0.3, m.windup * TICK - 0.12)) };
                m.pending = { special: true, slamAoE: !!d.slam, heavy: !d.slam, hit: rand() < hitChance(d.atk + 6, st.def), dmg: ri(Math.ceil(d.maxHit * 0.8), Math.ceil(d.maxHit * 1.6)) };
              }
              addFloat(m.px + 0.5, m.py - 1.8, d.slam ? "Tremor! Saia de perto!" : typeof d.special === "string" ? d.special : "Golpe pesado!", "#ff6b5a", 1.4, 16);
            } else { mobAttack(m); m.atkT = spd; }
          }
        } else if (m.prog >= 1) mobStepToward(m, player.x, player.y);
      } else if (m.prog >= 1 && Math.abs(m.x - m.hx) + Math.abs(m.y - m.hy) > 4) mobStepToward(m, m.hx, m.hy); // volta para casa
      else if (m.prog >= 1 && rand() < 0.12) {
        const [dx, dy] = DIRS[Math.floor(rand() * 4)];
        if (Math.hypot(m.x + dx - m.hx, m.y + dy - m.hy) < 5) mobMove(m, m.x + dx, m.y + dy);
      }
    }
    function slam(m) { // tremor em área: acerta quem estiver a até 2 tiles do golem
      const player = api.player(), d = m.d, st = combatStats(); SND.play("slam"); if (SND.opts.shake) api.shake(0.45);
      if (api.mark) api.mark(m.px + 0.5, m.py + 0.9, 2.1); // rodada 68: o tremor deixa marca larga no chão
      if (!api.dust(m.x, m.y + 0.1)) for (let a = 0; a < 20; a++) { const ang = a / 20 * 6.28; burst(m.x + 0.5 + Math.cos(ang) * 2, m.y + 0.6 + Math.sin(ang) * 1.4, ["#8a7a5a", "#c8b060"], 1, 1.5); } // poeira e rachaduras (Blender)
      if (api.petSlam) api.petSlam(m); // rodada 98: o tremor também acerta o filhote
      if (Math.hypot(player.x - m.x, player.y - m.y) <= 2.3) {
        const dmg = Math.max(2, ri(Math.ceil(d.maxHit * 0.9), Math.ceil(d.maxHit * 1.8)) - Math.floor(st.def / 8));
        player.hp -= dmg; player.flash = 0.25; player.lastHurt = api.tickN(); api.dirty();
        hitSplat(player.px + 0.5, player.py - 0.3, dmg, "#ff5a4a"); SND.play("hurt");
        if (player.hp <= 0) playerDied();
      } else addFloat(player.px + 0.5, player.py - 0.6, "esquivou!", "#9fe08a", 1, 14);
    }
    const mobCan = (m, x, y) => { const player = api.player(); return walkable(x, y) && !(x === player.x && y === player.y) && regionAt(x, y) !== "town" && !(api.petAt && api.petAt(x, y)); }; // rodada 96: nem no tile do filhote
    function mobMove(m, x, y) {
      if (!mobCan(m, x, y)) return false;
      if (x !== m.x) m.face = x > m.x ? 1 : -1;
      m.fx = m.x; m.fy = m.y; m.x = x; m.y = y; m.prog = 0; return true;
    }
    function mobStepToward(m, tx, ty) {
      const dx = Math.sign(tx - m.x), dy = Math.sign(ty - m.y);
      const first = Math.abs(tx - m.x) >= Math.abs(ty - m.y) ? [[dx, 0], [0, dy]] : [[0, dy], [dx, 0]];
      for (const [ax, ay] of first) if ((ax || ay) && mobMove(m, m.x + ax, m.y + ay)) { m.stuck = 0; return; }
      // rodada 45: preso na diagonal (os dois tiles do meio bloqueados): tenta um passo de lado; depois de ~5 s desiste e volta para casa
      m.stuck = (m.stuck || 0) + 1;
      if (m.stuck >= 3) { const side = dx && dy ? [[-dx, 0], [0, -dy]] : dx ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]]; for (const [ax, ay] of side.sort(() => rand() - 0.5)) if (mobMove(m, m.x + ax, m.y + ay)) return; }
      if (m.stuck >= 10 && m.aggro) { m.aggro = false; m.windup = 0; m.stuck = 0; api.giveUp(m); }
    }
    // estados: idle → walk → attack → hit → death. O ataque não é cortado pela caminhada; o hit não interrompe o ataque nem a morte.
    function mobAnim(m, dt) {
      const A = ANIMS[m.d.spr]; if (!A) return;
      const an = m.an || (m.an = { s: "idle", t: rand() * 2, still: 0 });
      an.t += dt * (an.speed || (an.s === "howl" && m.howlFast ? 1.6 : 1)); // uivo de entrada mais curto; golpe especial no ritmo do aviso
      if (m.sleeping && A.rows.sleep) { if (an.s !== "sleep") { an.s = "sleep"; an.t = m.phase; } return; }
      const moving = m.prog < 1;
      if (an.s === "attack") {
        const R = A.rows.attack, f = Math.floor(an.t * R.fps);
        if (m.pending && f >= (R.impact ?? 4)) { const pe = m.pending; m.pending = null; applyMobHit(m, pe); } // golpe aparece no quadro de impacto
        if (f >= R.frames) { an.s = moving ? "walk" : "idle"; an.t = 0; }
        return;
      }
      if (an.s === "special") {
        const R = A.rows.special, f = Math.floor(an.t * R.fps);
        if (m.pending && f >= (R.impact ?? 6)) { const pe = m.pending; m.pending = null; if (!pe.slamAoE) api.dust(m.x + (m.face > 0 ? 0.6 : -0.6), m.y + 0.2); applyMobHit(m, pe); }
        if (f >= R.frames) { an.s = moving ? "walk" : "idle"; an.t = 0; }
        return;
      }
      if (an.s === "enrage") { const R = A.rows.enrage; if (!R || an.t * R.fps >= R.frames) { an.s = "idle"; an.t = 0; } return; } // entrando em fúria
      if (an.s === "rise_up") { const R = A.rows.rise_up; if (an.t * R.fps >= R.frames) { an.s = "idle"; an.t = 0; } return; } // saindo da terra
      if (an.s === "wake") { const R = A.rows.wake; if (an.t * R.fps >= R.frames) { an.s = m.prog < 1 ? "walk" : "idle"; an.t = 0; } return; }
      if (an.s === "howl") { const R = A.rows.howl; if (an.t * R.fps >= R.frames) { an.s = "idle"; an.t = 0; m.aggro = true; m.atkT = 1; m.howlFast = false; } return; }
      if (an.s === "hit") { if (an.t * A.rows.hit.fps >= A.rows.hit.frames) { an.s = moving ? "walk" : "idle"; an.t = 0; } return; }
      if (moving) { if (an.s !== "walk") { an.s = "walk"; an.t = 0; } an.still = 0; }
      else if (an.s === "walk" && (an.still += dt) > 0.12) { an.s = "idle"; an.t = 0; } // pequena folga entre passos encadeados
    }
    // acorda (uivo do Alfa, golpe ou jogador encostado): toca o "hit" como susto e entra em combate
    function wake(m) {
      if (!m.sleeping) return; m.sleeping = false; m.aggro = true; m.atkT = 2;
      const A = ANIMS[m.d.spr]; m.an = A && A.rows.wake ? { s: "wake", t: 0, still: 0 } : A && A.rows.hit ? { s: "hit", t: 0, still: 0 } : { s: "idle", t: 0, still: 0 }; // levanta (Blender)
    }
    return { mobTick, slam, mobCan, mobMove, mobStepToward, mobAnim, wake };
  }
  return { create };
})();

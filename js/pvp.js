// Valdora — PvP e PK (rodada 147). Regras puras (sem desenho), testadas em tests.html; o game.js liga ao mundo.
// - PvP vale em todo o mapa, menos no Campo (mapa 1), nas vilas e nas masmorras do Campo (cripta, toca); as dos biomas valem.
// - Quem mata outro jogador fica PK por 2 h de jogo: nome vermelho e caveira no mapa para todos. Atacar alguém de novo
//   enquanto está PK volta o tempo para 2 h. Cada 50 monstros mortos tira 1 minuto.
// - O Pacificador (um em cada vila) faz o trato de paz por 1000 moedas: o PK some na hora.
// O combate entre jogadores chega com o servidor online; até lá, onAttackPlayer/onKillPlayer ficam prontos para o net.js chamar.
window.ValdoraPvP = (() => {
  "use strict";
  const PK_TIME = 2 * 60 * 60, MOB_STEP = 50, MOB_CUT = 60, PEACE_COST = 1000;
  const zoneOk = ({ biome, town, dungeon }) => !town && (dungeon ? /^dg_/.test(dungeon) : biome > 1);
  function onKillPlayer(p) { p.pk = PK_TIME; p.pkMobs = 0; }
  function onAttackPlayer(p) { if (p.pk > 0) p.pk = PK_TIME; }
  function onKillMob(p) { // true quando a contagem tirou 1 minuto
    if (!(p.pk > 0)) return false;
    p.pkMobs = (p.pkMobs || 0) + 1;
    if (p.pkMobs % MOB_STEP) return false;
    p.pk = Math.max(0, p.pk - MOB_CUT); return true;
  }
  function tick(p, dt) { if (!(p.pk > 0)) return false; p.pk = Math.max(0, p.pk - dt); if (p.pk === 0) p.pkMobs = 0; return p.pk === 0; } // true quando o PK acabou agora
  function peace(p) { if (!(p.pk > 0) || p.coins < PEACE_COST) return false; p.coins -= PEACE_COST; p.pk = 0; p.pkMobs = 0; return true; }
  const fmt = (s) => { s = Math.ceil(s); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h ? `${h}h${String(m).padStart(2, "0")}` : m ? `${m} min` : `${s} s`; };
  return { PK_TIME, MOB_STEP, MOB_CUT, PEACE_COST, zoneOk, onKillPlayer, onAttackPlayer, onKillMob, tick, peace, fmt };
})();

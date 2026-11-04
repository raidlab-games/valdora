// Valdora — montarias (rodada 156). Cavalos comprados no Celeiro de Lumeira (Teodoro): 4 níveis x 3 pelagens (js/data.js
// MOUNTS). Montado, o herói anda mais rápido (o nível do cavalo) e sobe Equitação a cada tile. Golpear, coletar, usar skill,
// forjar, entrar numa masmorra ou levar um golpe faz descer do cavalo; falar com os NPCs dá montado. A arte (folhas horse_tT_sS) vem de js/horse_data.js e
// é baixada só quando alguém monta ou passa perto dos cercadinhos (ANIM_SHEETS com lazy).
window.ValdoraMount = (() => {
  "use strict";
  for (const [k, A] of Object.entries(window.HORSE_SHEETS || {})) {
    (window.ANIM_SHEETS = window.ANIM_SHEETS || {})[k] = { ...A, lazy: true };
    if (typeof SPRITE_SIZE !== "undefined") SPRITE_SIZE[k] = [1.45 * 1.5, 1.45 * 1.5]; // mesma célula do herói montado (154 px)
  }
  const M = () => VD.MOUNTS;
  function sanitize(d) {
    const mounts = Array.isArray(d && d.mounts) ? [...new Set(d.mounts.filter((k) => M()[k]))] : [];
    const mount = d && M()[d.mount] && mounts.includes(d.mount) ? d.mount : mounts[0] || null;
    return { mounts, mount };
  }
  const cur = (p) => (p.mount && M()[p.mount]) || null;
  const speed = (p) => (p.riding && cur(p) ? cur(p).speed : 1);
  // motivo de não poder comprar (ou "" se pode)
  function whyNot(p, key, lvl) {
    const m = M()[key]; if (!m) return "cavalo desconhecido";
    if ((p.mounts || []).includes(key)) return "já é seu";
    if (lvl < m.lvl) return `requer Equitação ${m.lvl}`;
    if ((p.coins || 0) < m.price) return "moedas insuficientes";
    return "";
  }
  function buy(p, key, lvl) {
    if (whyNot(p, key, lvl)) return false;
    p.coins -= M()[key].price; (p.mounts = p.mounts || []).push(key); p.mount = key; return true;
  }
  // xp de Equitação pela distância cavalgada (guarda a fração)
  function rideXp(p, tiles) {
    p.rideAcc = (p.rideAcc || 0) + tiles * VD.RIDE_XP; const n = Math.floor(p.rideAcc); p.rideAcc -= n; return n;
  }
  return { sanitize, cur, speed, whyNot, buy, rideXp };
})();

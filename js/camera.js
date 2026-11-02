// Valdora — câmera (rodada 15: saiu do game.js). Segue o herói com mola e antecipa um pouco a direção do movimento;
// num teleporte (masmorra, morte, minimapa longe) pula direto em vez de deslizar pelo mapa.
window.ValdoraCamera = (() => {
  "use strict";
  function create({ TILE, DIR_VEC, player, view }) {
    let camF = null; const look = { x: 0, y: 0 };
    // rodada 66: "chute" de câmera na direção do golpe (px de tela); volta com amortecimento e fica parado durante a pausa de impacto
    const kickV = { x: 0, y: 0 }, out = { x: 0, y: 0 };
    function kick(dx, dy, amp) { const d = Math.hypot(dx, dy) || 1; kickV.x = Math.max(-10, Math.min(10, kickV.x + dx / d * amp)); kickV.y = Math.max(-10, Math.min(10, kickV.y + dy / d * amp)); }
    function update(dt) {
      const p = player(), [vw, vh] = view();
      const tx = (p.px + 0.5) * TILE - vw / 2, ty = (p.py + 0.5) * TILE - vh / 2;
      const [lx, ly] = p.prog < 1 ? DIR_VEC[p.dir] : [0, 0];
      const kl = 1 - Math.exp(-dt * 2.2), kc = 1 - Math.exp(-dt * 7);
      look.x += (lx * TILE * 1.2 - look.x) * kl; look.y += (ly * TILE * 0.9 - look.y) * kl;
      if (!camF || Math.abs(tx - camF.x) > TILE * 8 || Math.abs(ty - camF.y) > TILE * 8) camF = { x: tx, y: ty }; // teleporte: pula direto
      camF.x += (tx + look.x - camF.x) * kc; camF.y += (ty + look.y - camF.y) * kc;
      const kd = Math.exp(-dt * 14); kickV.x *= kd; kickV.y *= kd; if (Math.abs(kickV.x) < 0.05) kickV.x = 0; if (Math.abs(kickV.y) < 0.05) kickV.y = 0;
    }
    const focus = () => { if (!camF) update(0); out.x = camF.x + kickV.x; out.y = camF.y + kickV.y; return out; };
    const reset = () => { camF = null; look.x = look.y = 0; kickV.x = kickV.y = 0; };
    return { update, focus, reset, kick, kicked: () => Math.hypot(kickV.x, kickV.y) };
  }
  return { create };
})();

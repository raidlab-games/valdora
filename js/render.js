// Valdora — desenho das folhas animadas do Blender (rodada 9: saiu do game.js).
// Personagens e cenário: drawAnim (pés no ponto dado, geometria margin/ground). Efeitos `fx: true`: drawFx (quadro inteiro).
// Também cuida da água, dos cardumes, das fumaças, do balanço do cenário e dos efeitos de toque único (folhas caindo).
window.ValdoraRender = (() => {
  "use strict";
  // boca da chaminé de cada casa (fração da arte), medida nos PNGs
  const CHIMNEY = { house_auction: [0.71, (0.02 * 256 + 40) / 296], house_red: [0.71, 0.02], house_blue: [0.555, 0.02], house_green: [0.745, 0.025] };

  function create({ ctx, cam, TILE, W, AM, ANIMS, hash, inTown, rand, burst }) {
    const flashTmp = document.createElement("canvas"), flashCtx = flashTmp.getContext("2d");
    const animFrame = (R, t) => R.loop ? Math.floor(t * R.fps) % R.frames : Math.min(R.frames - 1, Math.floor(t * R.fps));
    function drawFx(A, frame, x, y, w = A.cw, h = A.ch) { const R = A.rows.loop || Object.values(A.rows)[0]; ctx.drawImage(A.c, (frame % R.frames) * A.cw, R.row * A.ch, A.cw, A.ch, x, y, w, h); }
    // um quadro da folha com os pés em (cx, footY); flip espelha (as folhas olham para a esquerda)
    function drawAnim(A, rowName, frame, cx, footY, flip, scale = 1, flash = 0) {
      const R = A.rows[rowName]; if (!R) return;
      const k = A.k || 1, sw = A.cw * k, sh = A.ch * k; // rodada 136: k = 2 nas folhas de pixel fino (guardadas inteiras)
      const w = A.cw * scale, h = A.ch * scale, sx = frame * sw, sy = R.row * sh;
      ctx.save(); ctx.translate(cx, footY); if (flip) ctx.scale(-1, 1);
      ctx.drawImage(A.c, sx, sy, sw, sh, -w / 2, -h * (1 - AM.ground), w, h);
      if (flash > 0) { // lampejo branco só na silhueta do quadro
        if (flashTmp.width !== sw || flashTmp.height !== sh) { flashTmp.width = sw; flashTmp.height = sh; }
        flashCtx.globalCompositeOperation = "source-over"; flashCtx.clearRect(0, 0, sw, sh);
        flashCtx.drawImage(A.c, sx, sy, sw, sh, 0, 0, sw, sh);
        flashCtx.globalCompositeOperation = "source-in"; flashCtx.fillStyle = "#fff"; flashCtx.fillRect(0, 0, sw, sh);
        ctx.globalAlpha = flash; ctx.drawImage(flashTmp, -w / 2, -h * (1 - AM.ground), w, h); ctx.globalAlpha = 1;
      }
      ctx.restore();
    }
    // folha "sway" (folhagem, balde, placas) ou "flicker" (chamas): cada instância começa num quadro diferente;
    // na vila, o balanço é um pouco mais lento; golpeada, a árvore acelera o balanço por um instante.
    function sceneryFrame(o, t) {
      const A = ANIMS[o.spr]; if (!A) return null;
      const row = A.rows.sway ? "sway" : A.rows.flicker ? "flicker" : null; if (!row) return null;
      const R = A.rows[row], speed = inTown(o.x, o.y) && row === "sway" ? 0.8 : 1;
      if (o.shake > 0) o.swayBoost = (o.swayBoost || 0) + 0.06; else if (o.swayBoost) o.swayBoost = Math.max(0, o.swayBoost - 0.02);
      const f = Math.floor((t * speed + (o.swayBoost || 0) * 2.5) * R.fps + hash(o.x, o.y, 3) * R.frames) % R.frames;
      return { A, row, f };
    }
    // água: fx_water / fx_water_deep, uma fase por tile ((x + y) % quadros)
    let deep = null;
    const setDeepWater = (arr) => { deep = arr; };
    function waterDraw(x, y, px, py, t) {
      const A = ANIMS[deep && deep[y * W + x] ? "fx_water_deep" : "fx_water"] || ANIMS.fx_water; if (!A) return false;
      const R = A.rows.loop; drawFx(A, Math.floor(t * R.fps) + (x + y) % R.frames, px, py, TILE, TILE); return true;
    }
    // cardume: folha centrada no tile; o dourado ganha anéis dourados por cima. Sem folha: ondulações procedurais.
    function drawFishspot(o, t) {
      const cx = (o.x + 0.5) * TILE - cam.x, cy = (o.y + 0.55) * TILE - cam.y;
      const A = ANIMS[o.kind === "fishspot_deep" ? "fx_fishspot_deep" : "fx_fishspot"] || ANIMS.fx_fishspot;
      if (A) {
        const R = A.rows.loop; drawFx(A, Math.floor(t * R.fps + hash(o.x, o.y, 9) * R.frames), Math.round(cx - A.cw / 2), Math.round((o.y + 0.5) * TILE - cam.y - A.ch / 2));
        if (o.golden > 0) {
          ctx.strokeStyle = "#ffd84a"; ctx.lineWidth = 3; const k = (t * 0.6) % 1;
          ctx.globalAlpha = 0.8 * (1 - k); ctx.beginPath(); ctx.ellipse(cx, cy, 6 + k * 18, 2.5 + k * 7, 0, 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
          if (rand() < 0.15) burst(o.x + 0.5, o.y + 0.4, ["#ffd84a", "#fff6c0"], 2, 1, 0.9);
        }
        return;
      }
      ctx.strokeStyle = o.golden > 0 ? "#ffd84a" : "#e8f6ff"; ctx.lineWidth = o.golden > 0 ? 3 : 2;
      if (o.golden > 0 && rand() < 0.15) burst(o.x + 0.5, o.y + 0.4, ["#ffd84a", "#fff6c0"], 2, 1, 0.9);
      for (let i = 0; i < 3; i++) {
        const k = ((t * 0.6 + i / 3 + o.x * 0.13) % 1);
        ctx.globalAlpha = 0.75 * (1 - k); ctx.beginPath(); ctx.ellipse(cx, cy, 5 + k * 17, 2 + k * 7, 0, 0, 7); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      if (rand() < 0.012) burst(o.x + 0.5, o.y + 0.5, ["#e8f6ff", "#8fc1ee"], 5, 1.2, 0.6);
    }
    // fumaça: chaminés (fx_smoke) e fogueiras (fx_smoke_small); origem a 12% da base do quadro, fase por objeto
    function drawSmoke(o, sx, sy, img, t) {
      let A = null, ox = 0, oy = 0;
      if (o.type === "house" && CHIMNEY[o.spr]) { A = ANIMS.fx_smoke; [ox, oy] = CHIMNEY[o.spr]; }
      else if (o.type === "fire" && !o.brazier) { A = ANIMS.fx_smoke_small; ox = 0.5; oy = 0.42; } // sobre as chamas
      if (!A) return;
      const R = A.rows.loop, f = Math.floor(t * R.fps + hash(o.x, o.y, 5) * R.frames), x = Math.round(sx + img.width * ox - A.cw / 2), y = Math.round(sy + img.height * oy - A.ch * 0.88);
      drawFx(A, f, x, y);
    }
    // efeitos de toque único (ex.: fx_leaves quando a árvore esgota): quadro de 1 tile centrado no tile
    const once = [];
    // opts.foot: a base do quadro (12%) fica no pé (x + 0,5, y + 1); opts.hold: segura o último quadro por N s e some em fade
    function playOnce(key, x, y, opts = {}) { const A = ANIMS[key]; if (A) once.push({ A, x, y, t: 0, foot: !!opts.foot, hold: opts.hold || 0, ground: !!opts.ground }); return !!A; }
    function updateOnce(dt) { for (let i = once.length - 1; i >= 0; i--) { const e = once[i], R = e.A.rows.loop; if ((e.t += dt) >= R.frames / R.fps + e.hold) once.splice(i, 1); } }
    // layer "ground": só os efeitos de chão, cheios (antes das entidades); sem layer: os outros cheios e os de chão bem leves por cima
    function drawOnce(layer) {
      for (const e of once) {
        if (layer === "ground" && !e.ground) continue;
        const R = e.A.rows.loop, end = R.frames / R.fps, f = Math.min(R.frames - 1, Math.floor(e.t * R.fps));
        const x = Math.round((e.x + 0.5) * TILE - cam.x - e.A.cw / 2), y = e.foot ? Math.round((e.y + 1) * TILE - cam.y - e.A.ch * 0.88) : Math.round((e.y + 0.5) * TILE - cam.y - e.A.ch / 2);
        const base = e.ground && layer !== "ground" ? 0.3 : 1;
        ctx.globalAlpha = base * (e.hold && e.t > end ? Math.max(0, 1 - (e.t - end) / e.hold) : 1);
        drawFx(e.A, f, x, y); ctx.globalAlpha = 1;
      }
    }
    const clearOnce = () => { once.length = 0; };
    return { animFrame, drawFx, drawAnim, sceneryFrame, setDeepWater, waterDraw, drawFishspot, drawSmoke, playOnce, updateOnce, drawOnce, clearOnce };
  }
  return { create, CHIMNEY };
})();

// Valdora — mouse e toque no mapa (rodada 15: saiu do game.js). Clique escolhe alvo ou anda; no celular, tocar = clicar e
// segurar = andar seguindo o dedo. O minimapa também leva o herói até o ponto clicado.
window.ValdoraPointer = (() => {
  "use strict";
  function create(api) {
    const { canvas, cam, TILE, W, H, closeDlg, pick, log, goTo, adjRect, clickFx, setTarget, walkable, inside } = api;
    const $ = (id) => document.getElementById(id);
    const st = { mouse: null, hover: null };
    canvas.addEventListener("mousemove", (e) => { st.mouse = { x: e.clientX / api.zoom(), y: e.clientY / api.zoom() }; });
    canvas.addEventListener("mouseleave", () => { st.mouse = null; st.hover = null; });
    // ---------- Toque (celular): tocar = clicar; segurar = andar seguindo o dedo ----------
    let touch = null, suppressClick = false;
    canvas.addEventListener("pointerdown", (e) => { if (e.pointerType === "touch" && api.running()) touch = { x: e.clientX / api.zoom(), y: e.clientY / api.zoom(), t0: performance.now(), hold: false, last: 0 }; });
    canvas.addEventListener("pointermove", (e) => { if (touch && e.pointerType === "touch") { touch.x = e.clientX / api.zoom(); touch.y = e.clientY / api.zoom(); } });
    const endTouch = () => { if (touch && touch.hold) suppressClick = true; touch = null; };
    canvas.addEventListener("pointerup", endTouch); canvas.addEventListener("pointercancel", endTouch);
    function updateTouch() {
      if (!touch || api.player().deadT > 0) return;
      const now = performance.now(); if (now - touch.t0 < 260) return;
      if (!touch.hold) { touch.hold = true; closeDlg(); api.player().target = null; api.player().job = null; }
      if (now - touch.last < 180) return; touch.last = now;
      const tx = Math.floor((touch.x + cam.x) / TILE), ty = Math.floor((touch.y + cam.y) / TILE);
      if (inside(tx, ty) && !(tx === api.player().x && ty === api.player().y)) goTo((x, y) => Math.abs(x - tx) + Math.abs(y - ty) <= (walkable(tx, ty) ? 0 : 1));
    }
    canvas.addEventListener("click", (e) => {
      if (!api.running()) return;
      if (suppressClick) { suppressClick = false; return; }
      if (api.player().deadT > 0) return;
      closeDlg(); api.player().job = null;
      const p = pick(e.clientX / api.zoom(), e.clientY / api.zoom()); if (!p) return;
      if (p.kind === "sign") { log(`Placa: ${p.ref.label}`, "dim"); return; }
      if (p.kind === "tile") {
        api.player().target = null;
        const { tx, ty } = p, o = p.ref;
        if (api.map()[ty][tx] === "water") { log("Para pescar, clique num cardume (as ondulações brancas na água).", "dim"); return; }
        const ok = o && o.solid ? goTo((x, y) => adjRect(x, y, o)) : goTo((x, y) => x === tx && y === ty);
        if (!ok) log("Não dá para chegar lá.", "dim");
        clickFx(tx + 0.5, ty + 0.5, "#f1c40f");
        return;
      }
      setTarget(p);
    });
    $("minimap").addEventListener("click", (e) => {
      if (!api.running()) return;
      const b = e.currentTarget.getBoundingClientRect();
      const tx = Math.floor((e.clientX - b.left) / b.width * W), ty = Math.floor((e.clientY - b.top) / b.height * H);
      let best = null; // tile andável mais próximo do ponto clicado
      for (let r = 0; r < 6 && !best; r++) for (let y = ty - r; y <= ty + r; y++) for (let x = tx - r; x <= tx + r; x++) if (!best && walkable(x, y)) best = [x, y];
      if (best) { closeDlg(); api.player().target = null; api.player().job = null; if (!goTo((x, y) => x === best[0] && y === best[1])) log("Não dá para chegar lá.", "dim"); }
    });
    return { st, updateTouch };
  }
  return { create };
})();

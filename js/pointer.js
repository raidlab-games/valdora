// Valdora — mouse e toque no mapa (rodada 15: saiu do game.js). Clique escolhe alvo ou anda; no celular, tocar = clicar e
// segurar = andar seguindo o dedo. O minimapa também leva o herói até o ponto clicado. Ctrl + clique ataca o monstro mais perto.
window.ValdoraPointer = (() => {
  "use strict";
  function create(api) {
    const { canvas, cam, TILE, W, H, closeDlg, pick, log, goTo, adjRect, clickFx, setTarget, walkable, inside } = api;
    const $ = (id) => document.getElementById(id);
    const st = { mouse: null, hover: null, attack: false };
    // rodada 105: segurando Ctrl entra no modo de ataque: o clique golpeia o monstro mais perto do ponto clicado (não precisa
    // acertar o monstro em si). Sem monstro por perto do ponto, anda até lá como um clique comum.
    const setAttack = (on) => { st.attack = !!on; };
    window.addEventListener("keydown", (e) => { if (e.key === "Control") setAttack(true); });
    window.addEventListener("keyup", (e) => { if (e.key === "Control") setAttack(false); });
    window.addEventListener("blur", () => setAttack(false));
    function attackClick(e) {
      const m = api.nearestMob(e.clientX / api.zoom(), e.clientY / api.zoom());
      if (!m) return false;
      closeDlg(); api.player().job = null; setTarget({ kind: "mob", ref: m }); clickFx(m.px + 0.5, m.py + 0.6, "#ff5a4a");
      return true;
    }
    canvas.addEventListener("contextmenu", (e) => { // no Mac, Ctrl+clique chega como clique direito
      if (!e.ctrlKey || !api.running() || api.player().deadT > 0) return;
      e.preventDefault(); attackClick(e);
    });
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
      if ((e.ctrlKey || st.attack) && attackClick(e)) return;
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

// Valdora — mouse e toque no mapa (rodada 15: saiu do game.js). Clique escolhe alvo ou anda; no celular, tocar = clicar e
// segurar = andar seguindo o dedo. O minimapa também leva o herói até o ponto clicado. Ctrl + botão direito ataca o monstro mais perto.
window.ValdoraPointer = (() => {
  "use strict";
  function create(api) {
    const { canvas, cam, TILE, W, H, closeDlg, pick, log, goTo, adjRect, clickFx, setTarget, walkable, inside } = api;
    const $ = (id) => document.getElementById(id);
    const st = { mouse: null, hover: null, attack: false };
    // rodada 105: segurando Ctrl entra no modo de ataque (mira): Ctrl + botão DIREITO golpeia o monstro mais perto do ponto
    // clicado (não precisa acertar o monstro em si). Ctrl + botão esquerdo é um clique comum.
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
    canvas.addEventListener("contextmenu", (e) => { // Ctrl + botão direito: ataca o monstro mais perto do ponto
      if (!e.ctrlKey || !api.running()) return;
      e.preventDefault(); if (!(api.player().deadT > 0)) attackClick(e);
    });
    canvas.addEventListener("mousemove", (e) => { st.mouse = { x: e.clientX / api.zoom(), y: e.clientY / api.zoom() }; });
    canvas.addEventListener("mouseleave", () => { st.mouse = null; st.hover = null; });
    // ---------- Segurar para andar: toque (celular) ou botão esquerdo do mouse ----------
    // tocar/clicar = interagir; segurar (mais de 0,26 s) = andar seguindo o dedo/cursor; ao soltar, vai até o ponto onde soltou.
    // rodada 105: o mouse também (só quando o botão esquerdo desce no chão; em monstro/objeto o clique continua sendo clique).
    let touch = null, suppressClick = false;
    const at = (e) => ({ x: e.clientX / api.zoom(), y: e.clientY / api.zoom() });
    canvas.addEventListener("pointerdown", (e) => {
      if (!api.running()) return;
      if (e.pointerType === "touch") { touch = { ...at(e), t0: performance.now(), hold: false, last: 0, mouse: false }; return; }
      if (e.button !== 0) return;
      const p = at(e), k = pick(p.x, p.y);
      if (k && k.kind === "tile") touch = { ...p, t0: performance.now(), hold: false, last: 0, mouse: true };
    });
    window.addEventListener("pointermove", (e) => { if (touch && (e.pointerType === "touch") !== touch.mouse) Object.assign(touch, at(e)); });
    const tileAt = (p) => [Math.floor((p.x + cam.x) / TILE), Math.floor((p.y + cam.y) / TILE)];
    const walkTo = (tx, ty) => inside(tx, ty) && !(tx === api.player().x && ty === api.player().y) && goTo((x, y) => Math.abs(x - tx) + Math.abs(y - ty) <= (walkable(tx, ty) ? 0 : 1));
    const endTouch = (e) => {
      if (touch && touch.hold) { // soltou depois de segurar: anda até onde soltou e engole o clique
        suppressClick = true; if (e && e.clientX != null) Object.assign(touch, at(e));
        const [tx, ty] = tileAt(touch); if (api.running() && !(api.player().deadT > 0)) { walkTo(tx, ty); clickFx(tx + 0.5, ty + 0.5, "#f1c40f"); }
        setTimeout(() => { suppressClick = false; }, 0); // o clique (se vier) chega antes deste timeout
      }
      touch = null;
    };
    window.addEventListener("pointerup", endTouch); window.addEventListener("pointercancel", () => { touch = null; });
    function updateTouch() {
      if (!touch || api.player().deadT > 0) return;
      const now = performance.now(); if (now - touch.t0 < 260) return;
      if (!touch.hold) { touch.hold = true; closeDlg(); api.player().target = null; api.player().job = null; }
      if (now - touch.last < 180) return; touch.last = now;
      const [tx, ty] = tileAt(touch); walkTo(tx, ty);
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
        const solid = o && o.solid && api.blockAt(tx, ty), ok = solid ? goTo((x, y) => adjRect(x, y, o)) : goTo((x, y) => x === tx && y === ty); // rodada 124: canto livre de casa é chão
        if (!ok) log("Não dá para chegar lá.", "dim");
        const at = ok && !solid && api.fineTo ? api.fineTo(p.fx, p.fy, tx, ty) : [tx + 0.5, ty + 0.5]; // rodada 130: para no meio tile clicado
        clickFx(at[0], at[1], "#f1c40f");
        return;
      }
      setTarget(p);
    });
    $("minimap").addEventListener("click", (e) => {
      if (!api.running()) return;
      const b = e.currentTarget.getBoundingClientRect();
      const V = api.miniView(), tx = Math.floor(V.x0 + (e.clientX - b.left) / b.width * V.w), ty = Math.floor(V.y0 + (e.clientY - b.top) / b.height * V.h); // rodada 105: minimapa que segue o herói
      let best = null; // tile andável mais próximo do ponto clicado
      for (let r = 0; r < 6 && !best; r++) for (let y = ty - r; y <= ty + r; y++) for (let x = tx - r; x <= tx + r; x++) if (!best && walkable(x, y)) best = [x, y];
      if (best) { closeDlg(); api.player().target = null; api.player().job = null; if (!goTo((x, y) => x === best[0] && y === best[1])) log("Não dá para chegar lá.", "dim"); }
    });
    return { st, updateTouch };
  }
  return { create };
})();

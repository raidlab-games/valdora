// Valdora — cenas curtas de diálogo (rodada 78, campanha). Uma caixa no rodapé com o retrato e o nome de quem fala e o texto
// aparecendo aos poucos. Clique, Espaço, Enter ou F avançam (o primeiro toque completa a fala); Esc pula a cena inteira.
// Enquanto a cena roda, o jogo fica parado (o game.js não chama update) e o teclado não chega aos atalhos.
// As falas ficam em VD.SCENES: [quem, texto], quem = guard, bard, shop, hero ou narr (narrador, sem retrato).
window.ValdoraScene = (() => {
  "use strict";
  const CPS = 52; // letras por segundo
  const pure = { lines: (id) => (VD.SCENES && VD.SCENES[id]) || [],
    side: (k) => k === "hero" ? "right" : "left" }; // rodada 88: o herói fala do lado direito, os NPCs do esquerdo (ninguém é espelhado)
  function create(api) {
    const $ = (id) => document.getElementById(id);
    let cur = null; // { lines, i, shown, t, done }
    const SPEAKER = { guard: { name: "Guarda Ivo", spr: "npc_guard", pt: "portrait_ivo", color: "#9fd0ff" }, bard: { name: "Tomé", spr: "npc_bard", pt: "portrait_tome", color: "#f5c060" },
      shop: { name: "Bento", spr: "npc_merchant", pt: "portrait_bento", color: "#f5e27a" }, herb: { name: "Juna", spr: "npc_juna", pt: "portrait_juna", color: "#8fe08a" },
      carto: { name: "Odília", spr: "npc_odilia", pt: "portrait_odilia", color: "#b8c8ff" }, miner: { name: "Brás", spr: "npc_bras", pt: "portrait_bras", color: "#e8b070" },
      pet: { name: "Filhote", spr: "pet_moon_1", pt: "portrait_pet_moon", color: "#b8d8ff" } }; // rodadas 80–81; rodada 96: o filhote da lua
    // rodada 84: retrato de busto (portrait_*) quando registrado em ASSETS; senão, o sprite de corpo inteiro
    // rodada 88: o lado vem de pure.side (classe right no #scene, CSS)
    const who = (k) => k === "hero" ? { name: api.heroName(), src: ASSETS["portrait_" + api.heroKey()] || ASSETS[api.heroKey()], bust: !!ASSETS["portrait_" + api.heroKey()], color: "#ffffff", hero: true } : k === "narr" ? null
      : SPEAKER[k] ? { ...SPEAKER[k], src: ASSETS[SPEAKER[k].pt] || ASSETS[SPEAKER[k].spr], bust: !!ASSETS[SPEAKER[k].pt] } : null;
    function render() {
      const [k, text] = cur.lines[cur.i], s = who(k), el = $("scene");
      el.classList.toggle("narr", !s); el.classList.toggle("hero", !!(s && s.hero)); el.classList.toggle("bust", !!(s && s.bust)); el.classList.toggle("right", !!s && pure.side(k) === "right");
      $("scene-portrait").hidden = !s; if (s) $("scene-portrait").src = s.src || "";
      $("scene-name").hidden = !s; if (s) { $("scene-name").textContent = s.name; $("scene-name").style.color = s.color; }
      $("scene-text").textContent = text.slice(0, Math.floor(cur.shown));
      $("scene-more").textContent = cur.i < cur.lines.length - 1 ? "▼" : "■";
      $("scene-more").hidden = cur.shown < text.length;
      $("scene-step").textContent = `${cur.i + 1}/${cur.lines.length}`;
    }
    function play(id, done) {
      const lines = pure.lines(id);
      if (!lines.length) { if (done) done(); return; }
      cur = { lines, i: 0, shown: 0, done };
      $("scene").hidden = false; $("scene").classList.remove("show"); void $("scene").offsetWidth; $("scene").classList.add("show");
      if (api.onStart) api.onStart();
      render();
    }
    function end() {
      if (!cur) return; const d = cur.done; cur = null; $("scene").hidden = true;
      if (api.onEnd) api.onEnd();
      if (d) d();
    }
    function next() {
      if (!cur) return;
      const text = cur.lines[cur.i][1];
      if (cur.shown < text.length) { cur.shown = text.length; render(); return; }
      if (++cur.i >= cur.lines.length) return end();
      cur.shown = 0; if (api.sound) api.sound("ui"); render();
    }
    function update(dt) { // texto aparecendo
      if (!cur) return; const text = cur.lines[cur.i][1];
      if (cur.shown < text.length) { cur.shown = Math.min(text.length, cur.shown + dt * CPS * (api.reduced && api.reduced() ? 4 : 1)); render(); }
    }
    addEventListener("keydown", (e) => {
      if (!cur) return;
      const k = e.key.toLowerCase();
      if (["escape", " ", "enter", "f"].includes(k) || k.startsWith("arrow") || "wasd".includes(k)) { e.preventDefault(); e.stopImmediatePropagation(); }
      if (e.repeat) return;
      if (k === "escape") end(); else if (k === " " || k === "enter" || k === "f") next();
    }, true);
    $("scene").addEventListener("click", (e) => { e.stopPropagation(); if (e.target.id === "scene-skip") end(); else next(); });
    return { play, next, end, update, active: () => !!cur, line: () => cur && cur.lines[cur.i] };
  }
  return { create, lines: pure.lines, side: pure.side };
})();

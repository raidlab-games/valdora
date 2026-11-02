// Valdora — visual do herói pelo que ele veste (rodada 104).
// O corpo de cada herói é renderizado só de roupa de baixo; cada peça (camisa, placas, túnica, calça, botas, capuz, elmo,
// capa, aljava, espada, arco, ferramenta) tem folhas próprias no MESMO formato (tools/outfit_pack.py, nome gear_<peça>).
// apply() monta, em cima das folhas já carregadas do corpo (ANIMS/SPR), as peças vestidas na ordem de baixo para cima,
// tingindo as neutras com a cor do material. As folhas das peças só são baixadas quando alguém as veste.
window.ValdoraOutfit = (() => {
  "use strict";
  const ORDER = ["pants", "greaves", "boots", "bootsplate", "shirt", "plate", "tunic", "hunter", "robe", "quiver", "hood", "helm", "mhood", "hat", "cape", "sword", "bow", "tool"];
  const ANIM_SUF = ["", "_walk6", "_dash", "_block", "_cancel", "_cheer", "_strike4"];
  const SPR_SUF = ["_attack", "_chop", "_mine", "_hammer", "_fish", "_cook", "_reap", "_spin", "_sheet"];
  const BOW_ALT = { _attack: "_attack_bow", _strike4: "_strike4_bow" }; // com arco, o golpe vira tiro (outro corpo e outras peças)
  const imgs = {};
  const load = (src) => imgs[src] || (imgs[src] = new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; }));
  const path = (name, suf, anim) => (window.assetV || String)(anim ? `assets/flow/anim3d/${name}${suf}.png` : `assets/flow/${name}${suf}.png`); // rodada 105: com a versão da arte
  const base = { anim: {}, spr: {} };
  let token = 0, doll = null, face = null;

  function paint(g, img, w, h, rgb, smooth) { // desenha a camada no tamanho da folha do corpo, tingida (multiplica) se pedir
    if (!img) return;
    if (!rgb) { g.imageSmoothingEnabled = smooth; g.imageSmoothingQuality = "high"; g.drawImage(img, 0, 0, w, h); return; }
    const t = document.createElement("canvas"); t.width = w; t.height = h; const tg = t.getContext("2d");
    tg.imageSmoothingEnabled = smooth; tg.imageSmoothingQuality = "high"; tg.drawImage(img, 0, 0, w, h);
    tg.globalCompositeOperation = "multiply"; tg.fillStyle = rgb; tg.fillRect(0, 0, w, h);
    tg.globalCompositeOperation = "destination-in"; tg.drawImage(img, 0, 0, w, h);
    g.drawImage(t, 0, 0);
  }

  // looks: [[camada, cor|null], ...]; bow: arma é arco (troca o golpe pelo tiro)
  async function apply(hero, looks, bow, ANIMS, SPR) {
    const my = ++token, list = ORDER.flatMap((l) => looks.filter((x) => x[0] === l));
    const jobs = [];
    for (const suf of ANIM_SUF) {
      const key = hero + suf, A = ANIMS[key]; if (!A) continue;
      const b = base.anim[key] || (base.anim[key] = A.c), alt = bow && BOW_ALT[suf];
      jobs.push(Promise.all([alt ? load(path(hero, alt, true)) : null, ...list.map(([l]) => load(path("gear_" + l, alt || suf, true)))]).then(([bi, ...li]) => {
        if (my !== token) return;
        const c = document.createElement("canvas"); c.width = b.width; c.height = b.height; const g = c.getContext("2d");
        if (bi) paint(g, bi, c.width, c.height, null, true); else g.drawImage(b, 0, 0);
        list.forEach(([, rgb], i) => paint(g, li[i], c.width, c.height, rgb, true));
        A.c = c;
      }));
    }
    for (const suf of SPR_SUF) {
      const key = hero + suf, S = SPR[key]; if (!S) continue;
      const b = base.spr[key] || (base.spr[key] = S), alt = bow && BOW_ALT[suf];
      jobs.push(Promise.all([alt ? load(path(hero, alt, false)) : null, ...list.map(([l]) => load(path("gear_" + l, alt || suf, false)))]).then(([bi, ...li]) => {
        if (my !== token) return;
        const c = document.createElement("canvas"); c.width = b.width; c.height = b.height; const g = c.getContext("2d");
        if (bi) paint(g, bi, c.width, c.height, null, bi.naturalWidth > c.width); else g.drawImage(b, 0, 0);
        list.forEach(([, rgb], i) => paint(g, li[i], c.width, c.height, rgb, !!li[i] && li[i].naturalWidth > c.width));
        SPR[key] = c;
      }));
    }
    await Promise.all(jobs);
    if (my !== token) return false;
    const A = ANIMS[hero], R = A && A.rows.idle_down; // retrato do boneco: primeiro quadro parado, de frente
    if (R) { const c = document.createElement("canvas"); c.width = A.cw; c.height = A.ch;
      c.getContext("2d").drawImage(A.c, 0, R.row * A.ch, A.cw, A.ch, 0, 0, A.cw, A.ch); doll = c.toDataURL();
      // rodada 105: retrato do cartão do HUD — só a caixa do personagem (a célula tem 1,6x de folga; pés a 12,5% da base)
      const s = Math.round(A.cw / 1.6), x0 = Math.round((A.cw - s) / 2), y0 = Math.round(A.ch * 0.875 - s), f = document.createElement("canvas");
      f.width = s; f.height = s; f.getContext("2d").drawImage(c, x0, y0, s, s, 0, 0, s, s); face = f.toDataURL(); }
    return true;
  }
  return { apply, ORDER, doll: () => doll, face: () => face };
})();

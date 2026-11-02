// Valdora — peças de interface sem estado de jogo (rodada 7: primeiro passo da divisão do game.js).
// Montagem de HTML de itens (ícone, selos de afixo, dica rica), janela de dica que segue o ponteiro,
// painel recolhível em telas estreitas e o letreiro pintado no portal da vila.
// Depende de: ASSETS, BADGES (assets.js), VD (data.js), ValdoraRules (rules.js).
window.ValdoraUI = (() => {
  "use strict";
  const { ITEMS, RARITY } = VD, RULES = ValdoraRules, bonusText = RULES.bonusText;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const iconImg = (name, cls = "") => { const it = ITEMS[name]; return `<img src="${ASSETS[it.icon]}" alt="" class="${cls}" ${it.filter ? `style="filter:${it.filter}"` : ""}>`; };
  // itens especiais: raros (espólios valiosos) ou acessórios raros/épicos — ganham brilho e cor própria
  const isSpecial = (name) => !!(ITEMS[name].rare || (ITEMS[name].rarity && ITEMS[name].rarity !== "comum"));
  const itemColor = (name) => ITEMS[name].rarity ? RARITY[ITEMS[name].rarity].color : ITEMS[name].rare ? "#ff9cf0" : "#ffffff";
  // acessório (instância): { name, aff? } — afixos tornam a peça única (não empilha)
  const accBonus = (e) => RULES.itemBonus(e, ITEMS);
  const accName = (e) => e.name + (e.aff && e.aff.length ? ` (${RULES.affixNames(e)})` : "");

  // selos (Flow) de afixo e de obra-prima
  const affLine = (a) => { const A = RULES.AFFIXES.find((x) => x.id === a.id); return A ? `${A.name}: ${bonusText({ [A.stat]: a.v })}` : ""; };
  const badgeImg = (id, title = "") => window.BADGES && ASSETS[BADGES[id]] ? `<img class="badge" src="${ASSETS[BADGES[id]]}" alt="" title="${esc(title)}">` : "";
  const affBadges = (e) => (e && e.aff || []).map((a) => badgeImg(a.id, affLine(a))).join("");
  const masterBadge = (isMaster) => isMaster ? badgeImg("obra", "Obra-prima: bônus extra nesta peça") : "";
  // dica rica (HTML) das peças: nome na cor da raridade, selos e cada afixo numa linha
  function itemTip(s, hint) {
    const it = ITEMS[s.name], col = s.aff ? "#ffd84a" : it.rarity ? RARITY[it.rarity].color : "#fff";
    return `<b style="color:${col}">${esc(s.name)}</b>` + (it.rarity ? `<br><small>${it.slot && VD.EQUIP_SLOTS[it.slot] ? esc(VD.EQUIP_SLOTS[it.slot].name) + " · " : ""}${esc(RARITY[it.rarity].name)}${s.aff ? " · peça única" : ""}</small>` : "")
      + (it.bonus ? `<div>${esc(bonusText(it.bonus))}</div>` : "")
      + (it.pack ? `<div>+${it.pack.slots} espaços na mochila · +${it.pack.cap} kg de carga</div>` : "") // rodada 112
      + (it.need ? `<small>requer Combate ${it.need}</small><br>` : "")
      + (VD.weightOf ? `<small>peso ${String(VD.weightOf(s.name)).replace(".", ",")} kg</small>` : "")
      + (s.aff || []).map((a) => `<div class="tip-aff">${badgeImg(a.id)}${esc(affLine(a))}</div>`).join("")
      + (hint ? `<small class="tip-hint">${esc(hint)}</small>` : "");
  }

  // janela de dica que segue o ponteiro (só para elementos com data-tip, cujo HTML é montado pelo jogo)
  function initTooltips() {
    const tipEl = document.createElement("div"); tipEl.id = "tip"; tipEl.hidden = true; document.body.appendChild(tipEl);
    let tipFor = null;
    const place = (e) => {
      const r = tipEl.getBoundingClientRect();
      tipEl.style.left = Math.max(4, Math.min(innerWidth - r.width - 4, e.clientX + 14)) + "px";
      tipEl.style.top = Math.max(4, e.clientY - r.height - 10 < 4 ? e.clientY + 18 : e.clientY - r.height - 10) + "px";
    };
    document.addEventListener("mouseover", (e) => {
      const el = e.target.closest && e.target.closest("[data-tip]");
      if (el === tipFor) return;
      tipFor = el; tipEl.hidden = !el; if (el) { tipEl.innerHTML = el.dataset.tip; place(e); }
    });
    document.addEventListener("mousemove", (e) => { if (tipFor && !tipFor.isConnected) { tipFor = null; tipEl.hidden = true; } else if (tipFor) place(e); });
    // celular: segurar o dedo ~0,45 s sobre o item mostra a dica; o toque que mostrou a dica não equipa/usa nada
    let holdT = null, hideT = null, swallow = false;
    const cancel = () => { clearTimeout(holdT); holdT = null; };
    document.addEventListener("touchstart", (e) => {
      const el = e.target.closest && e.target.closest("[data-tip]"); cancel(); if (!el) return;
      const p = e.touches[0], at = { clientX: p.clientX, clientY: p.clientY - 30 };
      holdT = setTimeout(() => { holdT = null; swallow = true; tipFor = el; tipEl.innerHTML = el.dataset.tip; tipEl.hidden = false; place(at);
        clearTimeout(hideT); hideT = setTimeout(() => { tipEl.hidden = true; tipFor = null; }, 2600); }, 450);
    }, { passive: true });
    document.addEventListener("touchmove", cancel, { passive: true });
    document.addEventListener("touchend", cancel, { passive: true });
    document.addEventListener("click", (e) => { if (swallow) { swallow = false; e.stopPropagation(); e.preventDefault(); } }, true);
    document.addEventListener("contextmenu", (e) => { if (swallow || holdT) { e.preventDefault(); e.stopPropagation(); } }, true); // toque longo não larga o item
  }

  // telas estreitas: o painel (mapa + abas) recolhe para liberar a visão do jogo; a escolha do jogador fica guardada
  function initHudToggle(hudEl, btn) {
    const set = (c, keep = true) => {
      hudEl.classList.toggle("collapsed", c); btn.textContent = c ? "▸ Mostrar painel" : "▾ Ocultar painel";
      if (keep) try { localStorage.setItem("valdora.hud", c ? "1" : "0"); } catch (e) { /* sem armazenamento */ }
    };
    let pref = null; try { pref = localStorage.getItem("valdora.hud"); } catch (e) { /* sem armazenamento */ }
    set(pref ? pref === "1" : innerWidth <= 480, false);
    btn.onclick = () => set(!hudEl.classList.contains("collapsed"));
  }

  // nome pintado na tábua do portal (posição e inclinação medidas na arte de 128 px)
  function letter(g, cx, cy, sh, rot, text, size = 0.08, carved = false) {
    g.save(); g.translate(cx, cy); g.rotate(rot);
    g.font = `bold ${Math.round(sh * size)}px Georgia, 'Times New Roman', serif`; g.textAlign = "center"; g.textBaseline = "middle";
    if (carved) { // entalhado na pedra: sulco escuro com borda clara embaixo
      g.fillStyle = "#e8e4d4aa"; g.fillText(text, 0, Math.max(1, sh * 0.008)); g.fillStyle = "#2b2a26"; g.fillText(text, 0, 0);
    } else {
      g.lineJoin = "round"; g.lineWidth = Math.max(2, sh * 0.018); g.strokeStyle = "#2a160a"; g.strokeText(text, 0, 0); // letras com contorno
      g.fillStyle = "#f2dfae"; g.fillText(text, 0, 0);
    }
    g.restore();
  }
  const paintSign = (g, w, h, text) => letter(g, w * 0.497, h * 0.452, h, 0.075, text);
  // placa do poste de treino (deco_training_post): tábua pendurada à esquerda, levemente inclinada
  const paintPost = (g, w, h, text) => letter(g, w * 0.318, h * 0.372, h, -0.12, text, 0.085);
  // lápide da cripta (deco_crypt_signpost): face lisa no centro, letras entalhadas
  const paintStone = (g, w, h, text) => letter(g, w * 0.527, h * 0.53, h, -0.04, text, 0.15, true);
  // A folha "sway" do portal (Blender) balança a tábua; o texto acompanha cada quadro.
  // Deslocamento [dx, dy] (px da célula de 205) e giro extra (rad) da tábua por quadro, medidos na folha e suavizados.
  const SIGN_SWAY = [[0, 0, 0], [-0.2, -0.8, 0.015], [-1.2, -1, 0.041], [-2.5, -0.8, 0.083], [-3.5, -0.2, 0.105], [-4, 0.2, 0.092], [-4, 0.8, 0.052], [-4.5, 0.8, 0.011],
    [-5, 0, 0.004], [-4.8, -0.8, 0.022], [-4.2, -1, 0.052], [-3.5, -0.8, 0.092], [-2.5, -0.2, 0.103], [-1.8, 0.2, 0.085], [-1, 0.8, 0.05], [-0.2, 0.8, 0.011]];
  function paintSignSheet(g, cw, ch, frames, margin, ground, text) {
    const sw = cw / margin, sh = ch / margin, k = cw / 205;
    for (let i = 0; i < frames; i++) {
      const [dx, dy, r] = SIGN_SWAY[i % SIGN_SWAY.length];
      letter(g, i * cw + cw / 2 + (0.497 - 0.5) * sw + dx * k, ch * (1 - ground) - sh * (1 - 0.452) + dy * k, sh, 0.075 + r, text);
    }
  }

  // rodada 68: fonte de títulos em pixel art (assets/ui/font_title.png: 61 glifos de 14x24, avanço 11 px, só maiúsculas).
  // O texto vira uma <img> (com alt = texto) tingida por multiplicação; caractere fora da folha → devolve null e quem chama usa texto.
  const TF_ORDER = "ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÂÊÔÃÕÀÇ0123456789 .,!?:-'\"+/()", TF_W = 14, TF_H = 24, TF_ADV = 11;
  let titleFont = null; const tfTint = new Map(), tfCache = new Map();
  function setTitleFont(c) { titleFont = c && c.width >= TF_ORDER.length * TF_W ? c : null; tfTint.clear(); tfCache.clear(); }
  function tfSheet(col) {
    if (col === "#ffffff") return titleFont;
    let c = tfTint.get(col); if (c) return c;
    c = document.createElement("canvas"); c.width = titleFont.width; c.height = titleFont.height; const g = c.getContext("2d");
    g.drawImage(titleFont, 0, 0); g.globalCompositeOperation = "multiply"; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height);
    g.globalCompositeOperation = "destination-in"; g.drawImage(titleFont, 0, 0); tfTint.set(col, c); return c;
  }
  function titleCanvas(text, col = "#ffffff") { // canvas no tamanho natural (1x), ou null
    if (!titleFont) return null;
    const up = String(text).toUpperCase(), idx = [...up].map((ch) => TF_ORDER.indexOf(ch));
    if (!idx.length || idx.some((i) => i < 0)) return null;
    const c = document.createElement("canvas"); c.width = TF_ADV * (idx.length - 1) + TF_W; c.height = TF_H;
    const g = c.getContext("2d"), sh = tfSheet(col);
    idx.forEach((gi, k) => { if (gi !== TF_ORDER.indexOf(" ")) g.drawImage(sh, gi * TF_W, 0, TF_W, TF_H, k * TF_ADV, 0, TF_W, TF_H); });
    return c;
  }
  function titleHTML(text, col = "#ffd84a", size = 2) { // <img> pronta para innerHTML; sem fonte ou com caractere fora: texto escapado
    const key = `${text}|${col}`; let url = tfCache.get(key);
    if (url === undefined) { const c = titleCanvas(text, col); url = c ? c.toDataURL() : null; if (tfCache.size > 120) tfCache.clear(); tfCache.set(key, url); }
    return url ? `<img class="tfont s${size}" src="${url}" alt="${esc(text)}">` : esc(text);
  }
  return { setTitleFont, titleCanvas, titleHTML, TF_ORDER, esc, iconImg, isSpecial, itemColor, accBonus, accName, affLine, badgeImg, affBadges, masterBadge, itemTip, initTooltips, initHudToggle, paintSign, paintPost, paintStone, paintSignSheet };
})();

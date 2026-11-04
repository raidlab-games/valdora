// Valdora — receitas e telas de ferraria e artesanato (rodada 11: saiu do game.js).
// Monta as listas da fornalha, da bigorna e do artesanato com o motivo de cada botão desligado; o trabalho em si
// (fundir/forjar em ticks, criar o item) continua no game.js, que trata os cliques.
window.ValdoraCrafting = (() => {
  "use strict";
  function create(api) {
    const { SMELT, CRAFT, GEAR, ITEMS, RARITY, SKILLS } = VD, { esc, iconImg } = ValdoraUI, { row, gearIcon, lockedIcon } = ValdoraDialogs, bonusText = ValdoraRules.bonusText;
    const { lv, count, hasMats, matsText, gearEffect } = api, pre = (k) => (api.prereqText ? api.prereqText(k) : "");
    // rodada 145: receita em blocos separados: o que o item dá, os materiais (branco = tem, vermelho = falta, com quanto tem)
    // e, em cima do botão, o nível pedido (vermelho se ainda não tem)
    const matsHtml = (mats) => `<div class="cr-mats">${Object.entries(mats).map(([k, n]) => { const h = count(k);
      return `<span class="${h >= n ? "have" : "miss"}">${n}x ${esc(k)} <i>(${h})</i></span>`; }).join("")}</div>`;
    const craftRow = (icon, title, stats, mats, need, ok, xp, btn) => `<div class="row cr">${icon}<span class="grow"><b>${title}</b>`
      + `${stats ? `<div class="cr-stats">${stats}</div>` : ""}${matsHtml(mats)}<div class="cr-xp">+${xp} xp</div></span>`
      + `<span class="cr-btn"><b class="cr-lvl${ok ? "" : " no"}">LVL ${need}</b>${btn}</span></div>`;
    function furnaceHtml() {
      const player = api.player(); let html = "";
        const lvl = lv("ferraria"), busy = player.job && player.job.kind === "smelt";
        html = Object.entries(SMELT).map(([bar, r]) => {
          const ok = lvl >= r.lvl, can = ok && hasMats(r.mats), max = ok ? Math.min(...Object.entries(r.mats).map(([k, n]) => Math.floor(count(k) / n))) : 0;
          return row(iconImg(bar), esc(bar), `${esc(matsText(r.mats))} · Ferraria ${r.lvl} · +${r.xp} xp`, null,
            `<button data-smelt="${esc(bar)}" data-n="1" ${can ? "" : "disabled"} title="${ok ? "" : "Nível insuficiente"}">1</button><button data-smelt="${esc(bar)}" data-n="${max}" ${can && max > 1 ? "" : "disabled"}>Tudo (${max})</button>`);
        }).join("") + (busy ? `<p class="empty">Fundindo ${esc(player.job.item)}... faltam ${player.job.left}.</p>` : "");
      return html;
    }
    function craftHtml() {
      const player = api.player(); let html = "";
        const lvl = lv("artesanato"), desk = !api.atDesk || api.atDesk();
        html = (desk ? "" : `<p class="desc warn">Para criar, vá à mesa de artesanato ao lado da bigorna. Aqui você só vê as receitas.</p>`) + Object.entries(CRAFT).map(([n, r]) => {
          const owned = r.bag && player.bags.includes(n), needBag = r.req && !player.bags.includes(r.req);
          const it = ITEMS[n], icon = it ? iconImg(n) : `<img src="${ASSETS.item_pouch || ASSETS.item_leather}" alt="">`;
          const why = owned ? "já tem" : lvl < r.lvl ? `requer Artesanato ${r.lvl}` : needBag ? `requer ${r.req}` : pre(n) ? pre(n) : !hasMats(r.mats) ? "faltam materiais" : !desk ? "só na mesa de artesanato" : "";
          const what = r.desc || (it && it.bonus ? `${RARITY[it.rarity].name}: ${bonusText(it.bonus)}` : "");
          return craftRow(icon, `${esc(n)}${owned ? " <small>(já tem)</small>" : ""}`, esc(what), r.mats, r.lvl, lvl >= r.lvl, r.xp,
            `<button data-craft="${esc(n)}" ${why ? "disabled" : ""} title="${why}">Criar</button>`);
        }).join("");
      return html;
    }
    function anvilHtml() {
      const player = api.player(); let html = "";
        const lvl = lv("ferraria");
        // rodada 104: cada peça forjada vai para a mochila; mostra o que já dá para forjar e os próximos níveis
        for (const [k, g] of Object.entries(GEAR)) g.tiers.forEach((t, i) => {
          const f = t.forge; if (!f || f.lvl > lvl + 7) return;
          for (const v of k === "espada" ? ["", ...(t.bow ? ["bow"] : []), ...(t.two ? ["two"] : []), ...(t.staff ? ["staff"] : [])] : [""]) { // rodada 105: + montante; 151: + cajado
            const ff = v === "two" ? t.twoForge : f, name = v === "bow" ? t.bow : v === "two" ? t.two : v === "staff" ? t.staff : t.name, lvOk = lvl >= ff.lvl, mats = hasMats(ff.mats);
            const pq = pre("forge:" + name), why = !lvOk ? `requer Ferraria ${ff.lvl}` : pq ? pq : !mats ? "faltam materiais" : "";
            const extra = v === "bow" ? " · atira flechas" : v === "staff" ? " · usa orbe ou livro" : v === "two" ? ` · duas mãos, +${ITEMS[name].bonus.dmg} dano, sem escudo` : k === "espada" ? " · uma mão (deixa usar escudo)" : "";
            const useSk = ValdoraRules.weaponClass(ITEMS[name]) || g.skill; // rodada 151: a arma pede o nível da classe dela
            html += craftRow(lvOk ? iconImg(name) : lockedIcon(g, t), esc(name), `${gearEffect(k, t)}${extra} · usar: ${SKILLS[useSk]} ${t.req || 1}`, ff.mats, ff.lvl, lvOk, ff.xp,
              `<button data-forge="${k}:${i}${v ? ":" + v : ""}" ${!why ? "" : "disabled"} title="${why}">Forjar</button>`);
          }
        });
        if (player.job && player.job.kind === "forge") html += `<p class="empty">Martelando... (${player.job.hits}/3)</p>`;
      return html;
    }
    return { furnaceHtml, craftHtml, anvilHtml };
  }
  return { create };
})();

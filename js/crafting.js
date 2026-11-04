// Valdora — receitas e telas de ferraria e artesanato (rodada 11: saiu do game.js).
// Monta as listas da fornalha, da bigorna e do artesanato com o motivo de cada botão desligado; o trabalho em si
// (fundir/forjar em ticks, criar o item) continua no game.js, que trata os cliques.
window.ValdoraCrafting = (() => {
  "use strict";
  function create(api) {
    const { SMELT, CRAFT, GEAR, ITEMS, RARITY, SKILLS } = VD, { esc, iconImg } = ValdoraUI, { row, gearIcon, lockedIcon } = ValdoraDialogs, bonusText = ValdoraRules.bonusText;
    const { lv, count, hasMats, matsText, gearEffect } = api, pre = (k) => (api.prereqText ? api.prereqText(k) : "");
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
          return row(icon, `${esc(n)}${owned ? " <small>(já tem)</small>" : ""}`, `${esc(what)} · ${esc(matsText(r.mats))} · Artesanato ${r.lvl} · +${r.xp} xp${pre(n) ? ` · <b class="lock">${esc(pre(n))}</b>` : ""}`, null,
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
          for (const v of k === "espada" ? ["", ...(t.bow ? ["bow"] : []), ...(t.two ? ["two"] : [])] : [""]) { // rodada 105: + montante
            const ff = v === "two" ? t.twoForge : f, name = v === "bow" ? t.bow : v === "two" ? t.two : t.name, lvOk = lvl >= ff.lvl, mats = hasMats(ff.mats);
            const pq = pre("forge:" + name), why = !lvOk ? `requer Ferraria ${ff.lvl}` : pq ? pq : !mats ? "faltam materiais" : "";
            const extra = v === "bow" ? " · atira flechas" : v === "two" ? ` · duas mãos, +${ITEMS[name].bonus.dmg} dano, sem escudo · só o Guerreiro` : k === "espada" ? " · uma mão (deixa usar escudo)" : "";
            html += row(lvOk ? iconImg(name) : lockedIcon(g, t), esc(name), `${gearEffect(k, t)}${extra} · ${esc(matsText(ff.mats))} · ${lvOk ? "" : '<b class="lock">'}Ferraria ${ff.lvl}${lvOk ? "" : "</b>"} · usar: ${SKILLS[g.skill]} ${t.req || 1}${pq ? ` · <b class="lock">${esc(pq)}</b>` : ""}`, null,
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

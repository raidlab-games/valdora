// Valdora — banca do Bento (rodada 13: saiu do game.js): abas Vender, Comprar e Encomendas.
// Só monta o HTML; os cliques (vender, comprar, entregar, trocar pedido) continuam tratados no game.js.
window.ValdoraShop = (() => {
  "use strict";
  function create(api) {
    const { ITEMS, SKILLS, BUFFS, GEAR, SHOP_ITEMS } = VD, { esc, iconImg, itemTip, accName, accBonus, affBadges } = ValdoraUI, { row, gearIcon, lockedIcon } = ValdoraDialogs;
    const bonusText = ValdoraRules.bonusText, { count, lv, gearEffect, questHtml, TICK } = api;
    // rodada 161: toda peça mostra nível e raridade (e a dica completa ao passar o mouse na linha)
    const { lvRar, reqText, reqOk, rarOf } = ValdoraUI, eqTag = (n) => ITEMS[n].slot ? `${lvRar(n)} · ` : "";
    const tipRow = (n, h, hint) => ITEMS[n] && ITEMS[n].slot ? h.replace('<div class="row">', `<div class="row" data-tip="${esc(itemTip({ name: n }, hint))}">`) : h;
    const nameCol = (n, txt) => ITEMS[n] && ITEMS[n].slot ? `<span style="color:${rarOf(n).color}">${txt}</span>` : txt;
    function html(tab) {
      const player = api.player(); let html = "";
        if (tab === "sell") {
          const rows = player.inv.filter((s) => s && ITEMS[s.name].price > 0);
          html = rows.length ? rows.map((s) => s.aff
            ? row(iconImg(s.name), `<span style="color:#ffd84a" data-tip="${esc(itemTip(s))}">${esc(accName(s))}</span> ${affBadges(s)}`, bonusText(accBonus(s)), ITEMS[s.name].price * 2, `<button data-sellslot="${player.inv.indexOf(s)}">Vender</button>`)
            : tipRow(s.name, row(iconImg(s.name), `${nameCol(s.name, esc(s.name))} <small>x${s.n}</small>`, ITEMS[s.name].slot ? lvRar(s.name) : "", ITEMS[s.name].price,
            `<button data-sell="${esc(s.name)}" data-n="1">1</button><button data-sell="${esc(s.name)}" data-n="all">Tudo</button>`))).join("")
            + `<button class="wide" data-sellall="1">Vender tudo, menos comida e barras</button>` : `<p class="empty">Nada para vender. Traga madeira, minério, peixe ou espólios de monstros.</p>`;
        } else if (tab === "orders") {
          html = questHtml("shop") + `<p class="empty">Entregue o pedido completo e receba moedas e XP. Novos pedidos acompanham seus níveis.</p>` + player.orders.map((o, i) => {
            const have = count(o.item);
            const up = o.big && ASSETS.icon_order_up ? `<img class="qicon" src="${ASSETS.icon_order_up}" alt="" title="Encomenda grande: o Bento pede mais porque você já domina este ofício">` : ""; // rodada 26
            return row(iconImg(o.item), `${up}${o.qty}x ${esc(o.item)} <small>(tem ${have})</small>`, `+${o.xp} xp de ${SKILLS[o.skill]}`, o.coins,
              `<button data-deliver="${i}" ${have >= o.qty ? "" : "disabled"}>Entregar</button><button data-reroll="${i}" title="Trocar por outro pedido">↻</button>`);
          }).join("");
        } else {
          html = (api.homeShop ? api.homeShop() : "") + SHOP_ITEMS.map((n) => { // rodada 100: escritura do lote e banco
            const it = ITEMS[n], B = it.buff && BUFFS[it.buff];
            const sub = eqTag(n) + (it.ammo ? `maço de ${it.buyN || 1} · secundária do Arqueiro` : it.sec ? `secundária do ${VD.SEC[it.sec].who} · ${bonusText(it.bonus || {})}` : it.slot ? `${VD.EQUIP_SLOTS[it.slot].name} · ${bonusText(it.bonus || {})}` : it.heal ? `cura ${it.heal}` : !B ? "material de artesanato" : `${B.name}: ${[B.acc && `+${B.acc} acerto`, B.dmg && `+${B.dmg} dano`, B.def && `+${B.def} defesa`].filter(Boolean).join(", ")} por ${B.ticks * TICK} s`);
            return tipRow(n, row(iconImg(n), nameCol(n, esc(n)) + (it.buyN ? ` x${it.buyN}` : ""), sub, it.buy, `<button data-buy="${esc(n)}" ${player.coins < it.buy ? "disabled" : ""}>Comprar</button>`)); }).join("");
          // rodada 104: armas, ferramentas e peitorais à venda (vão para a mochila); o estelar só sai da bigorna
          for (const [k, g] of Object.entries(GEAR)) g.tiers.forEach((t, i) => {
            if (!t.cost || t.rolls || (t.req || 1) > lv(g.skill) + 8) return;
            for (const name of k === "espada" && t.bow ? [t.name, t.bow] : [t.name]) {
              const lvOk = reqOk(name), money = player.coins >= t.cost; // rodada 161: arco e cajado pedem a classe deles
              html += tipRow(name, row(lvOk ? iconImg(name) : lockedIcon(g, t), nameCol(name, esc(name)), `${lvRar(name)} · ${gearEffect(k, t)}${ITEMS[name].bow ? " · atira flechas" : ""} · ${lvOk ? "" : '<b class="lock">'}requer ${reqText(name)}${lvOk ? "" : "</b>"}`, t.cost,
                `<button data-buy="${esc(name)}" ${money ? "" : "disabled"} title="${!money ? "Moedas insuficientes" : ""}">Comprar</button>`));
            }
          });
        }
      return html;
    }
    return { html };
  }
  return { create };
})();

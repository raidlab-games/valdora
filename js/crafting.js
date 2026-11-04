// Valdora — receitas e telas de ferraria e artesanato (rodada 11: saiu do game.js).
// Monta as listas da fornalha, da bigorna e do artesanato com o motivo de cada botão desligado; o trabalho em si
// (fundir/forjar em ticks, criar o item) continua no game.js, que trata os cliques.
window.ValdoraCrafting = (() => {
  "use strict";
  function create(api) {
    const { SMELT, CRAFT, GEAR, ITEMS, RARITY, SKILLS } = VD, { esc, iconImg, itemTip } = ValdoraUI, { row, gearIcon, lockedIcon } = ValdoraDialogs, bonusText = ValdoraRules.bonusText;
    const { lv, count, hasMats, matsText, gearEffect } = api, pre = (k) => (api.prereqText ? api.prereqText(k) : "");
    // rodada 145: receita em blocos separados: o que o item dá, os materiais (branco = tem, vermelho = falta, com quanto tem)
    // e, em cima do botão, o nível pedido (vermelho se ainda não tem)
    const matsHtml = (mats) => `<div class="cr-mats">${Object.entries(mats).map(([k, n]) => { const h = count(k);
      return `<span class="${h >= n ? "have" : "miss"}">${n}x ${esc(k)} <i>(${h})</i></span>`; }).join("")}</div>`;
    // rodada 155: a mesa separa por grupo; o que leva minério ou barra vai para a bigorna (Ferraria)
    const GROUP = (n) => { const it = ITEMS[n] || {}, r = CRAFT[n];
      if (it.gear && it.gear !== "espada" && it.gear !== "armadura") return "Ferramentas";
      if (it.gear === "espada" || it.sec || it.ammo) return "Armas e secundárias";
      if (it.cls === "arqueiro") return "Arqueiro (couro)"; if (it.cls === "mago") return "Mago (tecido)"; if (it.cls === "guerreiro") return "Guerreiro (placas)";
      if (["capacete", "calca", "botas", "capa", "armadura"].includes(it.slot)) return "Roupas";
      if (["anel", "amuleto", "bracelete"].includes(it.slot)) return "Joias";
      if (!it.slot && !r.bag && !it.heal) return "Materiais"; return "Mochilas e outros"; };
    const ORDER_G = ["Ferramentas", "Materiais", "Arqueiro (couro)", "Mago (tecido)", "Guerreiro (placas)", "Armas e secundárias", "Roupas", "Joias", "Mochilas e outros"];
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
    function craftList(heavy) { // heavy = receitas de metal (bigorna, Ferraria); senão as da mesa (Artesanato)
      const player = api.player(), sk = heavy ? "ferraria" : "artesanato", lvl = lv(sk), here = heavy ? (!api.atAnvil || api.atAnvil()) : (!api.atDesk || api.atDesk());
      const list = Object.entries(CRAFT).filter(([n]) => !!VD.heavy(n) === heavy && CRAFT[n].lvl <= lvl + 12), by = {};
      for (const e of list) (by[GROUP(e[0])] = by[GROUP(e[0])] || []).push(e);
      return ORDER_G.filter((g) => by[g]).map((g) => `<div class="cr-group">${esc(g)}</div>` + by[g].sort((a, b) => a[1].lvl - b[1].lvl).map(([n, r]) => {
          const owned = r.bag && player.bags.includes(n), needBag = r.req && !player.bags.includes(r.req);
          const it = ITEMS[n], icon = it ? iconImg(n) : `<img src="${ASSETS.item_pouch || ASSETS.item_leather}" alt="">`;
          const why = owned ? "já tem" : lvl < r.lvl ? `requer ${SKILLS[sk]} ${r.lvl}` : needBag ? `requer ${r.req}` : pre(n) ? pre(n) : !hasMats(r.mats) ? "faltam materiais" : !here ? (heavy ? "só na bigorna" : "só na mesa de artesanato") : "";
          const eq = it && it.slot, what = (r.desc || (it && it.bonus ? `${eq ? "" : RARITY[it.rarity].name + ": "}${bonusText(it.bonus)}` : "")) + (eq ? ` · ${it.gear ? "usar" : "vestir"}: ${ValdoraUI.reqText(n)}` : ""); // rodada 161
          const title = eq ? `<span data-tip="${esc(itemTip({ name: n }))}" style="color:${ValdoraUI.rarOf(n).color}">${esc(n)}</span>` : esc(n);
          return craftRow(icon, `${title}${owned ? " <small>(já tem)</small>" : ""}`, (eq ? ValdoraUI.lvRar(n) + " · " : "") + esc(what), r.mats, r.lvl, lvl >= r.lvl, r.xp,
            `<button data-craft="${esc(n)}" ${why ? "disabled" : ""} title="${why}">${heavy ? "Forjar" : "Criar"}</button>`);
        }).join("")).join("");
    }
    function craftHtml() {
      const desk = !api.atDesk || api.atDesk();
      return (desk ? "" : `<p class="desc warn">Para criar, vá à mesa de artesanato ao lado da bigorna. Aqui você só vê as receitas.</p>`)
        + `<p class="desc">Peças de metal (com minério ou barras) são forjadas na bigorna, ao lado. Aparecem as receitas até 12 níveis acima do seu.</p>` + craftList(false);
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
            html += craftRow(lvOk ? iconImg(name) : lockedIcon(g, t), `<span data-tip="${esc(itemTip({ name }))}" style="color:${ValdoraUI.rarOf(name).color}">${esc(name)}</span>`, `${ValdoraUI.lvRar(name)} · ${gearEffect(k, t)}${extra} · usar: ${SKILLS[useSk]} ${t.req || 1}`, ff.mats, ff.lvl, lvOk, ff.xp,
              `<button data-forge="${k}:${i}${v ? ":" + v : ""}" ${!why ? "" : "disabled"} title="${why}">Forjar</button>`);
          }
        });
        if (player.job && player.job.kind === "forge") html += `<p class="empty">Martelando... (${player.job.hits}/3)</p>`;
        html += `<div class="cr-group big">Peças de metal (Ferraria)</div>` + craftList(true); // rodada 155: elmos, grevas, escudos, orbes, joias e flechas de metal
      return html;
    }
    // rodada 155: fogueira estilo forno: à esquerda o que está assando (e quantos faltam), no meio o tempo da peça, à direita os prontos
    function fireHtml() {
      const player = api.player(), lvl = lv("culinaria"), j = player.job && player.job.kind === "cook" ? player.job : null;
      const raws = [...new Set(player.inv.filter((s) => s && ITEMS[s.name].cook).map((s) => s.name))];
      const slot = (n, q, cls = "") => `<div class="fb-slot ${cls}">${n ? iconImg(n) : ""}${q != null ? `<b>${q}</b>` : ""}</div>`;
      const pct = j ? Math.min(100, Math.round(j.t / api.cookTime(j.item) * 100)) : 0;
      const box = `<div class="fire-box">${slot(j && j.item, j ? j.left : null)}<div class="fb-mid"><img class="fb-flame" src="${ASSETS.icon_cook_all || ""}" alt=""><div class="fb-bar"><i style="width:${pct}%"></i></div>
        <small>${j ? `${String(api.cookTime(j.item)).replace(".", ",")} s cada` : "vazio"}</small></div>${slot(j && ITEMS[j.item].cook, j ? j.made : null, "out")}</div>`
        + (j ? `<div class="fb-act"><small>Assando ${esc(j.item.toLowerCase())}: ${j.made + j.burnt} de ${j.total}${j.burnt ? ` · ${j.burnt} queimado(s)` : ""}</small><button data-cookstop="1">Parar</button></div>` : "");
      const list = raws.length ? raws.map((n) => { const it = ITEMS[n], have = count(n), ok = lvl >= it.cookLvl, t = String(api.cookTime(n)).replace(".", ",");
        const dis = !ok || (j && j.item === n) ? "disabled" : "";
        return row(iconImg(n), esc(n), `${esc(it.cook)} · ${t} s cada · Culinária ${it.cookLvl}${ok ? "" : " (falta nível)"} · na mochila: ${have}`, null,
          `<button data-cook="${esc(n)}" data-n="1" ${dis}>1</button><button data-cook="${esc(n)}" data-n="10" ${dis || have < 2 ? "disabled" : ""}>10</button><button data-cook="${esc(n)}" data-n="all" ${dis}>Tudo (${have})</button>`);
      }).join("") : `<p class="empty">Sem nada cru na mochila. Pesque ou cace e volte aqui.</p>`;
      return box + `<div class="cr-group">Na mochila</div>` + list;
    }
    return { furnaceHtml, craftHtml, anvilHtml, fireHtml, startCook: (...a) => api.startCook(...a), stopCook: () => api.stopCook() };
  }
  return { create };
})();

// Valdora — Casa de Leilões / mercado (rodadas 114–116), com a leiloeira Celeste atrás do balcão de juiz.
// Abre em tela cheia (como o mapa no M), com três abas:
//  • Comprar: ~40 lotes por rodada de 15 min, com busca por nome e filtros (categoria, classe, raridade, nível, preço, "só o que
//    posso usar") e ordenação; os seus lotes à venda também aparecem (marcados).
//  • Vender: escolha um item da mochila, a quantidade, o preço por unidade e a duração; a taxa é 5% do valor de tabela. Quanto
//    mais perto do valor de tabela, maior a chance de vender; leilões mais longos têm mais compradores.
//  • Meus lotes: o tempo de cada lote (corre mesmo com o jogo fechado) e o botão de receber as moedas ou pegar o item de volta.
// Enquanto não há servidor online, os outros compradores e vendedores são moradores do reino (nomes fixos).
window.ValdoraAuction = (() => {
  "use strict";
  const ROUND_MIN = 15, LOTS = 40, MAX_LOTS = 8, FEE = 0.05;
  const PEOPLE = ["Aldo", "Benta", "Cirilo", "Dália", "Elói", "Fausta", "Gaspar", "Helena", "Ítalo", "Joana", "Lauro", "Mirta", "Nestor", "Olga", "Píndaro", "Quitéria", "Rufino", "Selma"];
  const DUR = { curta: [3, 8, 0], media: [10, 20, 0.08], longa: [30, 60, 0.15] }; // minutos (mín., máx.) e bônus na chance de vender
  const CATS = { todas: "Todas", armas: "Armas", armaduras: "Peitorais", secundarias: "Secundárias", roupas: "Elmos, calças, botas e capas", acessorios: "Anéis, amuletos e braceletes",
    mochilas: "Mochilas", ferramentas: "Ferramentas", consumiveis: "Comida e poções", materiais: "Materiais", regiao: "Itens de região" };
  const CLS = { todas: "Todas as classes", hero_1: "Guerreiro", hero_2: "Arqueiro", hero_3: "Místico" };
  function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const hash = (s) => [...String(s)].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);
  const mins = (ms) => Math.max(0, Math.ceil(ms / 60000));

  function create(api) {
    const { ITEMS, GEAR, RARITY } = VD, { esc, iconImg, accName, itemTip } = ValdoraUI;
    const st = () => { const p = api.player(); if (!p.auction || !Array.isArray(p.auction.lots)) p.auction = { lots: [], bought: {} }; return p.auction; };
    const now = () => Date.now();
    // ---------- dados de cada item para os filtros ----------
    const catOf = (it) => it.gear === "espada" ? "armas" : it.gear && it.gear !== "armadura" ? "ferramentas" : it.slot === "armadura" ? "armaduras" : it.slot === "municao" ? "secundarias"
      : ["capacete", "calca", "botas", "capa"].includes(it.slot) ? "roupas" : ["anel", "amuleto", "bracelete"].includes(it.slot) ? "acessorios" : it.slot === "mochila" ? "mochilas"
      : it.region ? "regiao" : it.heal || it.buff ? "consumiveis" : "materiais";
    const classOf = (it) => it.sec === "escudo" || it.onlyHero === "hero_1" ? "hero_1" : it.bow || it.sec === "flecha" ? "hero_2" : it.sec === "orbe" ? "hero_3" : "todas";
    const lvlOf = (it) => it.slot ? ValdoraUI.itemLvl(it) : 0; // rodada 161: toda peça tem nível (js/ui.js reqsOf)

    function pool() { // tudo o que tem valor; o equipamento só até ~30 níveis acima do Combate do herói
      const L = Math.max(1, api.lv("combate"));
      return Object.keys(ITEMS).filter((n) => { const it = ITEMS[n]; return it.price > 0 && !it.quest && !(it.slot && lvlOf(it) > L + 30) && !/^Peixe queimado$/.test(n); });
    }
    function offers() { // lotes da rodada atual (iguais para o mesmo herói até a próxima rodada)
      const key = Math.floor(now() / (ROUND_MIN * 60000)), r = mulberry(key * 7919 + hash(api.player().name)), P = pool(), list = [];
      while (list.length < LOTS && P.length) {
        const name = P.splice(Math.floor(r() * P.length), 1)[0], it = ITEMS[name];
        const n = it.slot ? (it.ammo ? 15 + Math.floor(r() * 31) : 1) : it.region ? 2 + Math.floor(r() * 8) : 1 + Math.floor(r() * 12);
        const unit = Math.max(2, Math.round(it.price * (1.25 + r() * 0.7)));
        list.push({ i: list.length, name, n, unit, price: unit * n, seller: PEOPLE[Math.floor(r() * PEOPLE.length)] });
      }
      return { key, list, ends: (key + 1) * ROUND_MIN * 60000 };
    }
    function resolve() { // lotes do herói que terminaram ganham resultado (uma vez)
      let n = 0;
      for (const l of st().lots) if (!l.result && now() >= l.end) {
        const r = mulberry(hash(l.name) + l.t0), base = ITEMS[l.name].price * (l.aff ? 2 : 1), ratio = l.unit / Math.max(1, base);
        const chance = Math.max(0.1, Math.min(0.97, 1.12 - 0.42 * (ratio - 1) + (DUR[l.dur] || DUR.curta)[2]));
        l.result = r() < chance ? { sold: true, value: l.unit * l.n, by: PEOPLE[Math.floor(r() * PEOPLE.length)] } : { sold: false }; n++;
      }
      return n;
    }
    const chanceOf = (name, unit, dur, aff) => { const base = ITEMS[name].price * (aff ? 2 : 1), ratio = unit / Math.max(1, base); return Math.round(Math.max(0.1, Math.min(0.97, 1.12 - 0.42 * (ratio - 1) + DUR[dur][2])) * 100); };

    // ---------- ações ----------
    function buy(i) {
      const O = offers(), o = O.list[i], A = st(), got = (A.bought[O.key] = A.bought[O.key] || []);
      if (!o || got.includes(i)) return;
      const p = api.player(); if (p.coins < o.price) { api.log(`Faltam ${o.price - p.coins} moedas para arrematar ${o.n}x ${o.name}.`, "warn"); return; }
      p.coins -= o.price; got.push(i); for (const k of Object.keys(A.bought)) if (+k < O.key) delete A.bought[k];
      if (!api.addItem(o.name, o.n)) api.dropItem(o.name, o.n);
      api.log(`Arrematado! ${o.n}x ${o.name} por ${o.price} moedas (lote de ${o.seller}).`, "gold"); api.sound("coin"); api.bang(); api.dirty();
    }
    function list(i, n, unit, dur) {
      const p = api.player(), s = p.inv[i], A = st(); if (!s) return false;
      const it = ITEMS[s.name]; n = Math.max(1, Math.min(s.n, Math.floor(n) || 1)); unit = Math.max(1, Math.floor(unit) || 1); dur = DUR[dur] ? dur : "curta";
      if (it.quest || !(it.price > 0)) { api.log(`${s.name} não pode ir a leilão.`, "dim"); return false; }
      if (A.lots.length >= MAX_LOTS) { api.log(`A Celeste aceita até ${MAX_LOTS} lotes seus por vez. Receba os que terminaram.`, "warn"); return false; }
      const fee = Math.max(1, Math.round(it.price * n * (s.aff ? 2 : 1) * FEE));
      if (p.coins < fee) { api.log(`A taxa deste lote é ${fee} moedas.`, "warn"); return false; }
      p.coins -= fee; const t0 = now(), D = DUR[dur];
      if (s.aff || s.master || n >= s.n) p.inv[i] = null; else s.n -= n;
      A.lots.push({ name: s.name, n: s.aff || s.master ? 1 : n, ...(s.aff ? { aff: s.aff } : {}), ...(s.master ? { master: 1 } : {}), unit, dur, fee, t0, end: t0 + Math.round((D[0] + Math.random() * (D[1] - D[0])) * 60000) });
      api.log(`${n}x ${accName(s)} foi a leilão por ${unit} cada (taxa ${fee}).`, "gold"); api.sound("coin"); api.bang(); api.dirty(); return true;
    }
    function collect(i) {
      const A = st(), l = A.lots[i]; resolve(); if (!l || !l.result) return;
      if (l.result.sold) { api.player().coins += l.result.value; api.log(`Leilão: ${l.n}x ${l.name} arrematado por ${l.result.by} — +${l.result.value} moedas.`, "gold"); api.sound("coin"); }
      else { if (!api.addItem(l.name, l.n, l.aff, l.master)) { api.log("Sua mochila está cheia: abra espaço para receber o lote de volta.", "warn"); return; }
        api.log(`Ninguém arrematou ${l.n}x ${l.name}. O lote voltou para a sua mochila.`, "dim"); }
      A.lots.splice(i, 1); api.bang(); api.dirty();
    }
    function cancel(i) {
      const A = st(), l = A.lots[i]; resolve(); if (!l || l.result) return;
      if (!api.addItem(l.name, l.n, l.aff, l.master)) { api.log("Sua mochila está cheia.", "warn"); return; }
      A.lots.splice(i, 1); api.log(`Você retirou ${l.n}x ${l.name} do leilão (a taxa não volta).`, "dim"); api.dirty();
    }

    // ---------- janela em tela cheia ----------
    const $ = (id) => document.getElementById(id);
    const el = document.createElement("div"); el.id = "market"; el.hidden = true;
    el.innerHTML = `<div class="mk-head"><b>Casa de Leilões</b><span class="mk-npc">Celeste, a leiloeira</span><span id="mk-coins"></span><button type="button" id="mk-close" aria-label="Fechar o mercado">✕</button></div>
      <div class="mk-tabs"><button data-mtab="buy">Comprar</button><button data-mtab="sell">Vender</button><button data-mtab="mine">Meus lotes</button></div><div id="mk-body"></div>`;
    (document.getElementById("game") || document.body).appendChild(el);
    const F = { tab: "buy", q: "", cat: "todas", cls: "todas", rar: "todas", lmin: "", lmax: "", pmax: "", usable: false, sort: "preco", sel: null, n: 1, unit: 0, dur: "media" };
    const isOpen = () => !el.hidden;
    function open() { el.hidden = false; (document.getElementById("game") || document.body).classList.add("market-open"); render(); api.opened && api.opened(); }
    function close() { el.hidden = true; (document.getElementById("game") || document.body).classList.remove("market-open"); }
    function usableBy(it, p) { const c = classOf(it); return (c === "todas" || c === p.hero) && ValdoraUI.reqsOf(it).every((q) => api.lv(q.sk) >= q.lvl); }

    function buyHtml() {
      const p = api.player(), A = st(), O = offers(), got = A.bought[O.key] || [];
      const mine = A.lots.filter((l) => !l.result).map((l, k) => ({ mine: true, k, name: l.name, n: l.n, unit: l.unit, price: l.unit * l.n, seller: "você" }));
      let rows = [...O.list.filter((o) => !got.includes(o.i)), ...mine];
      const q = F.q.trim().toLowerCase(), lmin = +F.lmin || 0, lmax = F.lmax === "" ? Infinity : +F.lmax, pmax = F.pmax === "" ? Infinity : +F.pmax;
      rows = rows.filter((o) => { const it = ITEMS[o.name]; return (!q || o.name.toLowerCase().includes(q)) && (F.cat === "todas" || catOf(it) === F.cat) && (F.cls === "todas" || classOf(it) === F.cls || classOf(it) === "todas" && F.cls !== "todas" && it.slot && !it.sec && !it.bow && !it.onlyHero)
        && (F.rar === "todas" || it.rarity === F.rar) && lvlOf(it) >= lmin && lvlOf(it) <= lmax && o.unit <= pmax && (!F.usable || usableBy(it, p)); });
      const R = { comum: 0, raro: 1, epico: 2, lendario: 3 }, S = { preco: (a, b) => a.unit - b.unit, preco_d: (a, b) => b.unit - a.unit, nivel: (a, b) => lvlOf(ITEMS[b.name]) - lvlOf(ITEMS[a.name]),
        nome: (a, b) => a.name.localeCompare(b.name, "pt-BR"), raridade: (a, b) => (R[ITEMS[b.name].rarity] ?? -1) - (R[ITEMS[a.name].rarity] ?? -1) }[F.sort];
      rows.sort(S);
      const opt = (o, v) => Object.entries(o).map(([k, n]) => `<option value="${k}"${v === k ? " selected" : ""}>${esc(n)}</option>`).join("");
      return `<div class="mk-filters">
          <input id="mk-q" type="search" placeholder="Buscar item pelo nome" value="${esc(F.q)}" aria-label="Buscar item">
          <select id="mk-cat" aria-label="Categoria">${opt(CATS, F.cat)}</select>
          <select id="mk-cls" aria-label="Classe">${opt(CLS, F.cls)}</select>
          <select id="mk-rar" aria-label="Raridade">${opt({ todas: "Toda raridade", comum: "Comum", raro: "Raro", epico: "Épico", lendario: "Lendário" }, F.rar)}</select>
          <label>Nível <input id="mk-lmin" type="number" min="0" placeholder="de" value="${esc(F.lmin)}"> – <input id="mk-lmax" type="number" min="0" placeholder="até" value="${esc(F.lmax)}"></label>
          <label>Preço máx. <input id="mk-pmax" type="number" min="0" placeholder="por unidade" value="${esc(F.pmax)}"></label>
          <label class="chk"><input id="mk-usable" type="checkbox"${F.usable ? " checked" : ""}> Só o que posso usar</label>
          <select id="mk-sort" aria-label="Ordenar">${opt({ preco: "Mais barato", preco_d: "Mais caro", nivel: "Maior nível", raridade: "Mais raro", nome: "Nome (A–Z)" }, F.sort)}</select>
          <button type="button" id="mk-clear">Limpar filtros</button>
        </div>
        <p class="mk-info">${rows.length} lote${rows.length === 1 ? "" : "s"} · lotes novos em ${mins(O.ends - now())} min</p>
        <div class="mk-table"><div class="mk-row mk-th"><span>Item</span><span>Categoria</span><span>Nível</span><span>Raridade</span><span>Vendedor</span><span>Preço</span><span></span></div>
        ${rows.map((o) => { const it = ITEMS[o.name], rc = it.rarity ? RARITY[it.rarity] : null, lv = lvlOf(it), cls = classOf(it);
          return `<div class="mk-row${o.mine ? " mine" : ""}" data-tip="${esc(itemTip({ name: o.name, n: o.n }, o.mine ? "seu lote" : "lote de " + o.seller))}">
            <span class="mk-item">${iconImg(o.name)}<b style="color:${rc ? rc.color : "#e8dcc0"}">${o.n > 1 ? o.n + "x " : ""}${esc(o.name)}</b>${cls !== "todas" ? `<small>${CLS[cls]}</small>` : ""}${it.slot && rc ? `<small class="rar" style="color:${rc.color}">nv ${lv} · ${rc.name}</small>` : ""}</span>
            <span>${esc(CATS[catOf(it)])}</span><span${it.slot && !ValdoraUI.reqOk(it) ? ' class="mk-no"' : ""}>${lv ? lv : "–"}</span><span>${rc ? rc.name : "–"}</span><span>${esc(o.seller)}</span>
            <span class="mk-price">${o.price.toLocaleString("pt-BR")}${o.n > 1 ? `<small>${o.unit} cada</small>` : ""}</span>
            <span>${o.mine ? `<em>à venda</em>` : `<button data-mbuy="${o.i}" ${p.coins < o.price ? "disabled" : ""}>Comprar</button>`}</span></div>`; }).join("") || `<p class="empty">Nenhum lote com esses filtros.</p>`}</div>`;
    }
    function sellHtml() {
      const p = api.player(), A = st(), inv = p.inv.map((s, i) => [s, i]).filter(([s]) => s && !ITEMS[s.name].quest && ITEMS[s.name].price > 0);
      if (F.sel != null && (!p.inv[F.sel] || ITEMS[p.inv[F.sel].name].quest)) F.sel = null;
      const s = F.sel != null && p.inv[F.sel], it = s && ITEMS[s.name];
      let form = `<p class="empty">Escolha um item da mochila para pôr em leilão.</p>`;
      if (s) {
        const base = it.price * (s.aff ? 2 : 1), n = Math.max(1, Math.min(s.n, F.n || 1)), unit = F.unit || Math.round(base * 1.3), fee = Math.max(1, Math.round(base * n * FEE));
        const seen = offers().list.filter((o) => o.name === s.name), avg = seen.length ? Math.round(seen.reduce((t, o) => t + o.unit, 0) / seen.length) : null;
        form = `<div class="mk-sellform">${iconImg(s.name)}<b>${esc(accName(s))}</b><small>você tem ${s.n} · valor de tabela ${base} cada${avg ? ` · no mercado agora: ~${avg} cada` : ""}</small>
          <label>Quantidade <input id="mk-n" type="number" min="1" max="${s.n}" value="${n}" ${s.aff || s.master ? "disabled" : ""}></label>
          <label>Preço por unidade <input id="mk-unit" type="number" min="1" value="${unit}"></label>
          <div class="mk-quick"><button data-mprice="1">= tabela</button><button data-mprice="1.3">+30%</button><button data-mprice="1.6">+60%</button><button data-mprice="2">×2</button></div>
          <label>Duração <select id="mk-dur">${Object.entries({ curta: "Curta (3–8 min)", media: "Média (10–20 min)", longa: "Longa (30–60 min)" }).map(([k, v]) => `<option value="${k}"${F.dur === k ? " selected" : ""}>${v}</option>`).join("")}</select></label>
          <p>Total: <b class="gold">${(unit * n).toLocaleString("pt-BR")} moedas</b> · taxa ${fee} · chance de vender ~${chanceOf(s.name, unit, F.dur, s.aff)}%</p>
          <button class="wide" id="mk-list" ${A.lots.length >= MAX_LOTS || p.coins < fee ? "disabled" : ""}>Pôr em leilão</button>
          ${A.lots.length >= MAX_LOTS ? `<small>Você já tem ${MAX_LOTS} lotes. Receba os que terminaram em Meus lotes.</small>` : ""}</div>`;
      }
      return `<div class="mk-sell"><div><h3>Sua mochila</h3><div class="mk-inv">${inv.map(([x, i]) => `<div class="slot${F.sel === i ? " on" : ""}" data-msel="${i}" role="button" tabindex="0" data-tip="${esc(itemTip(x, "clique para vender"))}">${iconImg(x.name)}${x.n > 1 ? `<span>${x.n}</span>` : ""}</div>`).join("") || `<p class="empty">Nada para vender.</p>`}</div></div><div>${form}</div></div>`;
    }
    function mineHtml() {
      const A = st(); resolve();
      if (!A.lots.length) return `<p class="empty">Você não tem lotes. Use a aba Vender.</p>`;
      return `<div class="mk-table">${A.lots.map((l, i) => { const r = l.result, tag = !r ? `faltam ${mins(l.end - now())} min` : r.sold ? `arrematado por ${esc(r.by)}: <b class="gold">${r.value} moedas</b>` : "ninguém deu lance";
        return `<div class="mk-row"><span class="mk-item">${iconImg(l.name)}<b>${l.n > 1 ? l.n + "x " : ""}${esc(l.name)}</b></span><span>${l.unit} cada</span><span>${tag}</span><span>${r ? `<button data-mcollect="${i}">${r.sold ? "Receber" : "Pegar de volta"}</button>` : `<button data-mcancel="${i}">Retirar</button>`}</span></div>`; }).join("")}</div>`;
    }
    function render() {
      if (el.hidden) return;
      const p = api.player(), ready = st().lots.filter((l) => l.result).length;
      $("mk-coins").innerHTML = `<img src="${ASSETS.coin}" alt=""> ${p.coins.toLocaleString("pt-BR")}`;
      for (const b of el.querySelectorAll("[data-mtab]")) { b.classList.toggle("on", b.dataset.mtab === F.tab); if (b.dataset.mtab === "mine") b.textContent = ready ? `Meus lotes (${ready} pronto${ready > 1 ? "s" : ""})` : "Meus lotes"; }
      const focus = document.activeElement && document.activeElement.id, pos = focus && document.activeElement.selectionStart;
      $("mk-body").innerHTML = F.tab === "buy" ? buyHtml() : F.tab === "sell" ? sellHtml() : mineHtml();
      if (focus && $(focus)) { $(focus).focus(); try { if (pos != null) $(focus).setSelectionRange(pos, pos); } catch (e) { /* campo numérico */ } }
    }
    el.addEventListener("click", (e) => {
      const b = e.target.closest("button, [data-msel]"); if (!b) return; const d = b.dataset;
      if (b.id === "mk-close") return close();
      if (d.mtab) { F.tab = d.mtab; api.sound("ui"); }
      else if (b.id === "mk-clear") Object.assign(F, { q: "", cat: "todas", cls: "todas", rar: "todas", lmin: "", lmax: "", pmax: "", usable: false, sort: "preco" });
      else if (d.mbuy != null) buy(+d.mbuy);
      else if (d.msel != null) { F.sel = +d.msel; F.n = 1; F.unit = 0; api.sound("ui"); }
      else if (d.mprice) { const s = api.player().inv[F.sel]; if (s) F.unit = Math.max(1, Math.round(ITEMS[s.name].price * (s.aff ? 2 : 1) * +d.mprice)); }
      else if (b.id === "mk-list") { const s = api.player().inv[F.sel]; if (s && list(F.sel, F.n, F.unit || Math.round(ITEMS[s.name].price * (s.aff ? 2 : 1) * 1.3), F.dur)) { F.sel = null; F.tab = "mine"; } }
      else if (d.mcollect != null) collect(+d.mcollect);
      else if (d.mcancel != null) cancel(+d.mcancel);
      else return;
      render(); api.save && api.save();
    });
    el.addEventListener("input", (e) => {
      const t = e.target, k = { "mk-q": "q", "mk-lmin": "lmin", "mk-lmax": "lmax", "mk-pmax": "pmax" }[t.id];
      if (k) { F[k] = t.value; render(); return; }
      if (t.id === "mk-n") { F.n = +t.value || 1; render(); } if (t.id === "mk-unit") { F.unit = +t.value || 0; render(); }
    });
    el.addEventListener("change", (e) => {
      const t = e.target, k = { "mk-cat": "cat", "mk-cls": "cls", "mk-rar": "rar", "mk-sort": "sort", "mk-dur": "dur" }[t.id];
      if (k) F[k] = t.value; else if (t.id === "mk-usable") F.usable = t.checked; else return;
      render();
    });
    el.addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Escape") close(); }); // digitar no filtro não move o herói
    el.addEventListener("keyup", (e) => e.stopPropagation());

    function tick() { // avisa uma vez quando lotes terminam, mesmo longe; e atualiza o relógio da janela aberta
      const n = resolve(); if (n) api.log(`Leilão: ${n > 1 ? `${n} lotes seus terminaram` : "um lote seu terminou"}. Abra a Casa de Leilões (Celeste, na Lumeira).`, "gold");
      if (isOpen() && !(document.activeElement && el.contains(document.activeElement) && /INPUT|SELECT/.test(document.activeElement.tagName))) render();
    }
    function sanitize(a) {
      if (!a || !Array.isArray(a.lots)) return { lots: [], bought: {} };
      return { lots: a.lots.filter((l) => l && ITEMS[l.name] && l.n > 0 && l.end > 0).map((l) => ({ ...l, unit: l.unit || Math.max(1, Math.round((l.base || ITEMS[l.name].price * l.n) / l.n)), dur: l.dur || "curta" })).slice(0, MAX_LOTS),
        bought: a.bought && typeof a.bought === "object" ? a.bought : {} };
    }
    return { open, close, isOpen, render, tick, sanitize, offers, resolve, list, buy, collect, cancel, catOf, classOf };
  }
  return { create };
})();

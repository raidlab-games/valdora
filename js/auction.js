// Valdora — Casa de Leilões da Lumeira (rodada 114), com a leiloeira Celeste atrás do balcão.
// Lotes: a cada 15 minutos entram 6 lotes novos (peças das três classes no degrau do seu Combate, mochilas, itens de região,
// barras e poções), por 130–190% do valor. Vender: você põe uma pilha em leilão (taxa de 5% do valor); em 3 a 8 minutos — o
// relógio corre mesmo com o jogo fechado — 85% das vezes alguém arremata por 100–180% do valor; senão o lote volta.
// Enquanto não há servidor online, os compradores e vendedores são moradores da vila (sem outros jogadores).
window.ValdoraAuction = (() => {
  "use strict";
  const ROUND_MIN = 15, MAX_LOTS = 5, FEE = 0.05;
  const PEOPLE = ["Aldo", "Benta", "Cirilo", "Dália", "Elói", "Fausta", "Gaspar", "Helena", "Ítalo", "Joana", "Lauro", "Mirta", "Nestor", "Olga"];
  function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const hash = (s) => [...String(s)].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);
  const mins = (ms) => Math.max(0, Math.ceil(ms / 60000));

  function create(api) {
    const { ITEMS } = VD, { esc, iconImg, accName } = ValdoraUI;
    const st = () => { const p = api.player(); if (!p.auction || !Array.isArray(p.auction.lots)) p.auction = { lots: [], bought: {} }; return p.auction; };
    const now = () => Date.now();

    function pool() { // o que pode aparecer nos lotes, conforme o Combate do herói
      const L = Math.max(1, api.lv("combate")), T = VD.TIER_LVL.reduce((b, v, i) => (L >= v ? i : b), 0), out = [];
      for (const lad of Object.values(VD.LADDER)) for (const t of [T, Math.max(0, T - 1)]) { const n = lad[Math.min(lad.length - 1, t)]; if (ITEMS[n] && !out.includes(n)) out.push(n); }
      for (const p of VD.PACKS) if (!out.includes(p[0])) out.push(p[0]);
      for (const r of Object.values(VD.REGION_ITEM)) out.push(r[0]);
      out.push("Poção de vida", "Poção de força", "Poção de pedra", "Barra de ferro", "Barra de aço", "Barra de lumita");
      return out.filter((n) => ITEMS[n] && ITEMS[n].price > 0);
    }
    function offers() {
      const key = Math.floor(now() / (ROUND_MIN * 60000)), r = mulberry(key * 7919 + hash(api.player().name)), P = pool(), list = [];
      while (list.length < 6 && P.length) {
        const name = P.splice(Math.floor(r() * P.length), 1)[0], it = ITEMS[name];
        const n = it.slot ? (it.ammo ? 15 + Math.floor(r() * 16) : 1) : it.region ? 2 + Math.floor(r() * 6) : 1 + Math.floor(r() * 4);
        list.push({ name, n, price: Math.max(5, Math.round(it.price * n * (1.3 + r() * 0.6))), seller: PEOPLE[Math.floor(r() * PEOPLE.length)] });
      }
      return { key, list, ends: (key + 1) * ROUND_MIN * 60000 };
    }
    function resolve() { // lotes do herói que já terminaram ganham resultado (uma vez); devolve quantos acabaram agora
      let n = 0;
      for (const l of st().lots) if (!l.result && now() >= l.end) {
        const r = mulberry(hash(l.name) + l.t0);
        l.result = r() < 0.85 ? { sold: true, value: Math.round(l.base * (1 + r() * 0.8)), by: PEOPLE[Math.floor(r() * PEOPLE.length)] } : { sold: false };
        n++;
      }
      return n;
    }

    function buy(i) {
      const O = offers(), o = O.list[i], A = st(), got = (A.bought[O.key] = A.bought[O.key] || []);
      if (!o || got.includes(i)) return;
      const p = api.player(); if (p.coins < o.price) { api.log(`Faltam ${o.price - p.coins} moedas para arrematar ${o.n}x ${o.name}.`, "warn"); return; }
      p.coins -= o.price; got.push(i); for (const k of Object.keys(A.bought)) if (+k < O.key) delete A.bought[k];
      if (!api.addItem(o.name, o.n)) api.dropItem(o.name, o.n);
      api.log(`Arrematado! ${o.n}x ${o.name} por ${o.price} moedas (lote de ${o.seller}).`, "gold"); api.sound("coin"); api.bang(); api.dirty();
    }
    function list(i) {
      const p = api.player(), s = p.inv[i], A = st(); if (!s) return;
      const it = ITEMS[s.name];
      if (it.quest || !(it.price > 0)) { api.log(`${s.name} não pode ir a leilão.`, "dim"); return; }
      if (A.lots.length >= MAX_LOTS) { api.log(`A Celeste aceita até ${MAX_LOTS} lotes seus por vez. Receba os que terminaram.`, "warn"); return; }
      const base = it.price * s.n * (s.aff ? 2 : 1), fee = Math.max(1, Math.round(base * FEE));
      if (p.coins < fee) { api.log(`A taxa do leilão é ${fee} moedas.`, "warn"); return; }
      p.coins -= fee; p.inv[i] = null;
      const r = Math.random(), t0 = now();
      A.lots.push({ name: s.name, n: s.n, ...(s.aff ? { aff: s.aff } : {}), ...(s.master ? { master: 1 } : {}), base, fee, t0, end: t0 + Math.round((3 + r * 5) * 60000) });
      api.log(`${s.n}x ${accName(s)} foi a leilão (taxa ${fee}). Volte em alguns minutos.`, "gold"); api.sound("coin"); api.bang(); api.dirty();
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

    function html(dlg) {
      resolve();
      const p = api.player(), A = st(), tab = dlg.tab || "buy";
      if (tab === "buy") {
        const O = offers(), got = A.bought[O.key] || [];
        return `<p class="desc">Lotes novos em ${mins(O.ends - now())} min. Os preços já incluem a comissão da casa.</p>` + O.list.map((o, i) => {
          const it = ITEMS[o.name], sold = got.includes(i);
          return `<div class="row auc${sold ? " sold" : ""}" data-tip="${esc(ValdoraUI.itemTip({ name: o.name, n: o.n }, `lote de ${o.seller}`))}">${iconImg(o.name)}<span><b style="color:${it.rarity ? VD.RARITY[it.rarity].color : "#e8dcc0"}">${o.n > 1 ? o.n + "x " : ""}${esc(o.name)}</b><small>lote de ${esc(o.seller)}${it.need ? ` · Combate ${it.need}` : ""}</small></span>`
            + (sold ? `<em>arrematado</em>` : `<button data-aucbuy="${i}" ${p.coins < o.price ? "disabled" : ""}>${o.price} moedas</button>`) + `</div>`;
        }).join("");
      }
      if (tab === "sell") {
        const rows = p.inv.map((s, i) => [s, i]).filter(([s]) => s && !ITEMS[s.name].quest && ITEMS[s.name].price > 0);
        if (!rows.length) return `<p class="empty">Nada na mochila para pôr em leilão.</p>`;
        return `<p class="desc">Escolha uma pilha: taxa de 5% do valor. Em 3 a 8 minutos alguém costuma arrematar por 100–180% do valor (às vezes ninguém dá lance e o lote volta). Até ${MAX_LOTS} lotes por vez.</p>`
          + rows.map(([s, i]) => { const base = ITEMS[s.name].price * s.n * (s.aff ? 2 : 1), fee = Math.max(1, Math.round(base * FEE));
            return `<div class="row auc">${iconImg(s.name)}<span><b>${s.n > 1 ? s.n + "x " : ""}${esc(accName(s))}</b><small>vale ${base} · lances de ${base}–${Math.round(base * 1.8)}</small></span><button data-auclist="${i}" ${A.lots.length >= MAX_LOTS || p.coins < fee ? "disabled" : ""}>Leiloar (taxa ${fee})</button></div>`; }).join("");
      }
      if (!A.lots.length) return `<p class="empty">Você não tem lotes em leilão. Use a aba Vender.</p>`;
      return A.lots.map((l, i) => {
        const res = l.result, tag = !res ? `faltam ${mins(l.end - now())} min` : res.sold ? `arrematado por ${esc(res.by)}: <b class="gold">${res.value} moedas</b>` : "ninguém deu lance";
        return `<div class="row auc">${iconImg(l.name)}<span><b>${l.n > 1 ? l.n + "x " : ""}${esc(l.name)}</b><small>${tag}</small></span>`
          + (res ? `<button data-auccollect="${i}">${res.sold ? "Receber" : "Pegar de volta"}</button>` : `<button data-auccancel="${i}">Retirar</button>`) + `</div>`;
      }).join("");
    }
    function talk(dlg) {
      const A = st(), ready = A.lots.filter((l) => l.result).length;
      return ready ? `"Dou-lhe uma, dou-lhe duas... ${ready > 1 ? `${ready} lotes seus terminaram` : "um lote seu terminou"}! Veja em Meus lotes."` : dlg.tab === "sell" ? "\"O que vai a leilão hoje? Quanto mais raro, mais briga entre os compradores.\"" : "\"Bem-vindo à Casa de Leilões! Lotes novos a cada quarto de hora.\"";
    }
    function act(ds) {
      if (ds.aucbuy != null) { buy(+ds.aucbuy); return true; }
      if (ds.auclist != null) { list(+ds.auclist); return true; }
      if (ds.auccollect != null) { collect(+ds.auccollect); return true; }
      if (ds.auccancel != null) { cancel(+ds.auccancel); return true; }
      return false;
    }
    function tick() { // avisa uma vez quando lotes terminam, mesmo longe da Casa de Leilões
      const n = resolve(); if (n) api.log(`Leilão: ${n > 1 ? `${n} lotes seus terminaram` : "um lote seu terminou"}. Fale com a Celeste na Lumeira.`, "gold");
    }
    function sanitize(a) {
      if (!a || !Array.isArray(a.lots)) return { lots: [], bought: {} };
      return { lots: a.lots.filter((l) => l && ITEMS[l.name] && l.n > 0 && l.end > 0).slice(0, MAX_LOTS), bought: a.bought && typeof a.bought === "object" ? a.bought : {} };
    }
    return { html, talk, act, tick, sanitize, offers, resolve };
  }
  return { create };
})();

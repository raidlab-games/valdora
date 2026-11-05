// Valdora — barcos (rodada 162): regras sem desenho (casco, melhorias, reparo, vento, peixes do mar), testadas em tests.html.
// Os dados (VD.HULLS, VD.SHIP_PARTS, VD.SEA_FISH, VD.BAITS, VD.SEA_MOBS) ficam em js/data.js; o mar em si (navegar, canhões,
// monstros, a luta da linha) fica em js/sea.js. player.boat guarda os cascos, as melhorias, a vida do casco, onde o barco
// ficou ancorado, o diário de pesca e a isca escolhida.
window.ValdoraBoat = (() => {
  "use strict";
  const H = () => VD.HULLS, P = () => VD.SHIP_PARTS;
  // melhorias: cada nível pede a madeira e a barra de um mapa (1 carvalho/ferro ... 4 palmeira/obsidiana), moedas e Navegação
  const WOOD = ["Madeira de carvalho", "Madeira de cedro", "Madeira de ébano", "Madeira de palmeira"];
  const BAR = ["Barra de ferro", "Barra de aço", "Barra de lumita", "Barra de obsidiana"];
  const PART_COINS = [600, 2500, 9000, 30000], PART_LVL = [5, 18, 35, 55], MAX_PART = 4;
  const num = (v, d) => (Number.isFinite(+v) ? +v : d);
  function sanitize(d) {
    const b = d && typeof d === "object" ? d : {};
    const owned = Array.isArray(b.owned) ? [...new Set(b.owned.filter((k) => H()[k]))] : [];
    const parts = {}; for (const k of Object.keys(P())) parts[k] = Math.max(0, Math.min(MAX_PART, (b.parts && b.parts[k]) | 0));
    const pos = (o) => (o && Number.isFinite(o.x) && Number.isFinite(o.y) ? { x: +o.x, y: +o.y, a: num(o.a, 0) } : null);
    const journal = {};
    if (b.journal && typeof b.journal === "object") for (const [n, j] of Object.entries(b.journal)) if (VD.ITEMS[n] && j) journal[n] = { n: Math.max(0, j.n | 0), kg: Math.max(0, num(j.kg, 0)) };
    return { owned, hull: owned.includes(b.hull) ? b.hull : owned[0] || null, parts, hp: b.hp == null ? null : Math.max(0, num(b.hp, 0)),
      anchor: pos(b.anchor), sea: pos(b.sea), dock: typeof b.dock === "string" ? b.dock : null, journal, bait: VD.BAITS[b.bait] ? b.bait : null,
      wrecks: (Array.isArray(b.wrecks) ? b.wrecks : []).filter((w) => w && Number.isFinite(w.x) && Number.isFinite(w.y) && w.until > Date.now() && Array.isArray(w.items))
        .map((w) => ({ x: +w.x, y: +w.y, until: +w.until, items: w.items.filter((it) => Array.isArray(it) && VD.ITEMS[it[0]] && it[1] > 0).map(([n, q]) => [n, q | 0]) })).filter((w) => w.items.length) }; // rodada 166: bolsas do naufrágio
  }
  // atributos do barco em uso (casco + melhorias)
  function stats(b) {
    const h = b && H()[b.hull]; if (!h) return null; const p = b.parts || {};
    return { key: b.hull, name: h.name, maxHp: Math.round(h.hp * (1 + 0.15 * (p.casco || 0))), armor: 0.04 * (p.casco || 0), speed: h.speed * (1 + 0.06 * (p.velas || 0)),
      turn: h.turn * (1 + 0.12 * (p.leme || 0)), guns: h.guns, gun: h.gun * (1 + 0.15 * (p.canhoes || 0)), reload: 3.2 * (1 - 0.06 * (p.canhoes || 0)), len: h.len, beam: h.beam, art: h.art };
  }
  const hpOf = (b) => { const s = stats(b); return s ? (b.hp == null ? s.maxHp : Math.min(s.maxHp, b.hp)) : 0; };
  // have(nome) = quantos o jogador tem (mochila); devolve o motivo de não poder ou ""
  function whyNotHull(p, key, lvl, have) {
    const h = H()[key]; if (!h) return "barco desconhecido";
    if ((p.boat.owned || []).includes(key)) return "já é seu";
    if (lvl < h.lvl) return `requer Navegação ${h.lvl}`;
    if ((p.coins || 0) < h.price) return "moedas insuficientes";
    const miss = Object.entries(h.mats).find(([n, q]) => have(n) < q); if (miss) return `faltam ${miss[1] - have(miss[0])} ${miss[0].toLowerCase()}`;
    return "";
  }
  function buyHull(p, key, lvl, have, take) {
    if (whyNotHull(p, key, lvl, have)) return false;
    const h = H()[key]; p.coins -= h.price; for (const [n, q] of Object.entries(h.mats)) take(n, q);
    p.boat.owned.push(key); p.boat.hull = key; p.boat.hp = null; return true;
  }
  function partCost(part, L) { // custo de subir a melhoria para o nível L (1 a 4)
    if (!P()[part] || L < 1 || L > MAX_PART) return null;
    const w = WOOD[L - 1], bar = BAR[L - 1];
    const mats = { velas: { "Fio de linho": 10 * L, [w]: 4 * L }, leme: { [w]: 8 * L, [bar]: 2 * L }, casco: { [w]: 12 * L, [bar]: 4 * L }, canhoes: { [bar]: 6 * L, [w]: 2 * L } }[part];
    return { coins: PART_COINS[L - 1], lvl: PART_LVL[L - 1], mats };
  }
  function whyNotPart(p, part, lvl, have) {
    const L = (p.boat.parts[part] || 0) + 1, c = partCost(part, L);
    if (!c) return "nível máximo";
    if (!p.boat.owned.length) return "compre um barco antes";
    if (lvl < c.lvl) return `requer Navegação ${c.lvl}`;
    if ((p.coins || 0) < c.coins) return "moedas insuficientes";
    const miss = Object.entries(c.mats).find(([n, q]) => have(n) < q); if (miss) return `faltam ${miss[1] - have(miss[0])} ${miss[0].toLowerCase()}`;
    return "";
  }
  function upgrade(p, part, lvl, have, take) {
    if (whyNotPart(p, part, lvl, have)) return false;
    const c = partCost(part, p.boat.parts[part] + 1), before = stats(p.boat), hp = hpOf(p.boat);
    p.coins -= c.coins; for (const [n, q] of Object.entries(c.mats)) take(n, q); p.boat.parts[part]++;
    if (part === "casco" && p.boat.hp != null) p.boat.hp = hp + (stats(p.boat).maxHp - before.maxHp); // a vida nova entra inteira
    return true;
  }
  // reparo: 1 moeda a cada 2 de vida que falta (mais caro nos cascos grandes)
  function repairCost(b) { const s = stats(b); if (!s) return 0; const miss = s.maxHp - hpOf(b); return miss <= 0 ? 0 : Math.max(1, Math.ceil(miss * (0.5 + 0.25 * Object.keys(H()).indexOf(b.hull)))); }
  // vento: de popa rende 110%, de través ~86%, de proa 62% da velocidade
  const angDiff = (a, b) => { let d = (a - b) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return d; };
  const windFactor = (heading, wind) => 0.62 + 0.48 * (1 + Math.cos(angDiff(heading, wind))) / 2;
  // direção (0 a 15) mais perto do ângulo da proa (0 = direita, 4 = baixo)
  const dir16 = (a) => ((Math.round(a / (Math.PI / 8)) % 16) + 16) % 16;
  // peixes que podem morder num cardume da zona z, com o peso de cada um (o nível de Pesca filtra; a isca e o fundo mudam a sorte)
  const RAR_W = { comum: 70, raro: 24, epico: 6, lendario: 0.35 };
  function catchTable(zone, pesca, bait, deep) {
    const B = VD.BAITS[bait] || {}, out = [];
    for (const f of VD.SEA_FISH) {
      if (f.zone && f.zone !== zone) continue; if (pesca < f.req) continue;
      let w = RAR_W[f.rar]; if (f.rar === "raro") w *= B.rare || 1; if (f.rar === "epico") w *= (B.epic || 1) * (deep ? 1.5 : 1); if (f.rar === "lendario") w *= (B.leg || 1) * (deep ? 2 : 1);
      out.push({ f, w });
    }
    if (!out.length) { const f = VD.SEA_FISH.find((x) => x.zone === zone && x.rar === "comum"); if (f) out.push({ f, w: 1, low: true }); }
    return out;
  }
  function rollFish(table, r) { const tot = table.reduce((a, c) => a + c.w, 0); let k = r * tot; for (const c of table) if ((k -= c.w) <= 0) return c.f; return table[table.length - 1].f; }
  // força de cada puxada: cresce com a Pesca acima do pedido do peixe e com o nível da vara
  const reelPower = (pesca, req, rodTier) => Math.max(4, Math.min(22, 6 * (1 + 0.035 * (pesca - req)) * (1 + 0.1 * (rodTier || 0))));
  const weightRoll = (f, r) => Math.round((f.kg[0] + (f.kg[1] - f.kg[0]) * Math.pow(r, 1.7)) * (f.kg[1] < 2 ? 100 : 10)) / (f.kg[1] < 2 ? 100 : 10);
  function sailXp(b, tiles) { b.sailAcc = (b.sailAcc || 0) + tiles * VD.SAIL_XP; const n = Math.floor(b.sailAcc); b.sailAcc -= n; return n; }
  // monstros do mar: vida e golpe pelo nível
  const mobHp = (d, L) => Math.round((30 + 7 * L) * d.hp), mobDmg = (d, L) => Math.round((4 + 0.9 * L) * d.dmg);
  // bala do jogador: Navegação e Combate somam; o casco e a melhoria de canhões multiplicam
  const ballDmg = (s, nav, combate) => Math.round((10 + 0.9 * nav + 0.4 * combate) * s.gun);
  return { WOOD, BAR, MAX_PART, sanitize, stats, hpOf, whyNotHull, buyHull, partCost, whyNotPart, upgrade, repairCost, angDiff, windFactor, dir16, catchTable, rollFish,
    reelPower, weightRoll, sailXp, mobHp, mobDmg, ballDmg };
})();

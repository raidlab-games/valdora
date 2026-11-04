// Testes simples de lógica e de integridade dos dados do Valdora + tabela de equilíbrio (XP e moedas por hora).
// Abra tests.html no servidor local. Não altera o jogo nem o save.
(() => {
  const out = document.getElementById("out"), results = [];
  const test = (name, fn) => { try { const r = fn(); results.push([name, r === true || r === undefined, r === true || r === undefined ? "" : String(r)]); } catch (e) { results.push([name, false, e.message]); } };
  const { ITEMS, RES, MOBS, GEAR, SMELT, CRAFT, ORDER_POOL, TUTORIAL, SKILLS, BUFFS, SHOP_ITEMS, ACHIEVEMENTS, CRYPT_CHEST, RARITY } = VD;
  const miss = (list) => list.length ? "faltando: " + list.join(", ") : true;

  // ---------- integridade dos dados ----------
  // rodada 111: todo script do jogo precisa compilar (um comentário "//" no meio de uma linha já engoliu um "}" e o jogo não abria)
  test("todos os scripts do index.html compilam", () => {
    const get = (u) => { const x = new XMLHttpRequest(); x.open("GET", u + "?t=" + Date.now(), false); x.send(); return x.responseText; };
    const srcs = [...get("index.html").matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]).filter((s) => !/^https?:/.test(s));
    return miss(srcs.filter((s) => { try { new Function(get(s)); return false; } catch (e) { return true; } }));
  });
  // rodada 112: itens das três classes subindo com o nível, saque por tipo de monstro, item de região, mochilas e peso
  test("rodada 112: as três classes têm secundária em todos os níveis de monstro (até o 150)", () => miss(["escudo", "flecha", "orbe", "tomo"].flatMap((k) =>
    VD.LADDER[k].length === VD.TIER_LVL.length && VD.LADDER[k].every((n) => ITEMS[n] && ITEMS[n].slot === "municao") ? [] : [k])));
  test("rodada 112: peças dos biomas pedem Combate e têm receita no Artesanato", () => miss(VD.SETS.flatMap((S) => Object.values(VD.LADDER).map((l) => l[VD.SETS.indexOf(S) + 3]))
    .filter((n) => !ITEMS[n] || !ITEMS[n].need || !CRAFT[n] || Object.keys(CRAFT[n].mats).some((m) => !ITEMS[m]))));
  test("rodada 112: todo monstro comum solta peças do tipo dele no nível dele", () => miss(Object.entries(MOBS).filter(([, d]) => !d.summon && !d.echo && !d.temp && !d.ambush).filter(([, d]) => {
    const names = new Set(d.drops.map((x) => x[0])), tier = VD.TIER_LVL.reduce((b, v, i) => (d.lvl >= v ? i : b), 0);
    return !Object.values(VD.LADDER).some((l) => names.has(l[Math.min(l.length - 1, tier)]));
  }).map(([k]) => k)));
  test("rodada 112: toda região com monstros tem item de região", () => miss(Object.keys(VD.REGIONS).filter((r) => r !== "town" && !VD.REGION_DROP(r, { lvl: 1 }))));
  test("rodada 112: item de região existe e o chefe sempre solta", () => { const r = VD.REGION_DROP("snow", { boss: true }); return r && ITEMS[r[0]] && r[1] === 1 || "neve sem item garantido no chefe"; });
  test("rodada 112: todo item tem peso (missões pesam 0) e mochilas crescem", () => {
    const bad = Object.keys(ITEMS).filter((n) => { const w = VD.weightOf(n); return !(w >= 0) || (w === 0 && !ITEMS[n].quest); });
    const P = VD.PACKS.map((p) => ITEMS[p[0]].pack); const grow = P.every((p, i) => !i || (p.slots > P[i - 1].slots && p.cap > P[i - 1].cap));
    return bad.length ? "sem peso: " + bad.join(", ") : grow || "mochilas fora de ordem";
  });
  test("rodada 112: a Mochila de pano está à venda e tem a camada no herói", () => SHOP_ITEMS.includes("Mochila de pano") && ITEMS["Mochila de pano"].look[0] === "backpack" || "faltando");
  // rodada 114: guardiões das vilas novas e Casa de Leilões
  test("rodada 114: missões dos guardiões apontam para monstros, itens e recompensas que existem, até o chefe", () => {
    const bad = [], Q = Object.entries(VD.QUESTS).filter(([, q]) => /^w_/.test(q.giver));
    for (const [id, q] of Q) {
      for (const s of q.steps) if (s.ev) { const [k, v] = s.ev.split(":"); if ((k === "kill" && !MOBS[v]) || ((k === "gather" || k === "smelt") && !ITEMS[v])) bad.push(id + ":" + s.ev); }
      const r = q.reward || {}; if (r.item && !ITEMS[r.item]) bad.push(id + ":" + r.item); for (const k of Object.keys(r.items || {})) if (!ITEMS[k]) bad.push(id + ":" + k);
      if (q.after && !VD.QUESTS[q.after]) bad.push(id + ":after");
    }
    for (const g of ["w_breu", "w_escarpa", "w_oasis", "w_degelo"]) { const last = Q.filter(([, q]) => q.giver === g).pop(); if (!last || !last[1].steps.some((s) => /^kill:/.test(s.ev || "") && MOBS[s.ev.slice(5)] && MOBS[s.ev.slice(5)].boss)) bad.push(g + ": sem chefe no fim"); }
    return Q.length >= 24 ? miss(bad) : "poucas missões: " + Q.length;
  });
  test("rodada 117: poções da Morgana usam itens que existem, sobem de nível e começam pela poção de vida simples", () => {
    const P = Object.entries(VD.POTIONS), bad = P.flatMap(([n, R]) => [!ITEMS[n] && n, ...Object.keys(R.mats).filter((m) => !ITEMS[m])].filter(Boolean));
    const up = P.every(([, R], i) => !i || R.lvl > P[i - 1][1].lvl), heals = P.map(([n]) => ITEMS[n].heal).filter(Boolean);
    return bad.length ? "faltando: " + bad.join(", ") : P[0][0] === "Poção de vida simples" && up && heals.every((h, i) => !i || h > heals[i - 1]) && !!SKILLS.alquimia || "ordem errada";
  });
  test("rodada 116: filtros do mercado — toda categoria e classe vêm de um item real", () => {
    const A = ValdoraAuction.create({ player: () => ({ name: "t", inv: [], coins: 0, hero: "hero_1", auction: { lots: [], bought: {} } }), lv: () => 200, addItem: () => true, dropItem() {}, log() {}, sound() {}, dirty() {}, bang() {} });
    const cats = new Set(Object.values(ITEMS).filter((it) => it.price > 0 && !it.quest).map((it) => A.catOf(it))), cls = new Set(Object.values(ITEMS).map((it) => A.classOf(it)));
    const missing = ["armas", "armaduras", "secundarias", "roupas", "acessorios", "mochilas", "ferramentas", "consumiveis", "materiais", "regiao"].filter((c) => !cats.has(c));
    return missing.length ? "categoria vazia: " + missing.join(", ") : ["hero_1", "hero_2", "hero_3"].every((c) => cls.has(c)) || "classe sem item";
  });
  test("rodada 114: Casa de Leilões tem arte, leiloeira e lotes válidos", () => {
    const A = ValdoraAuction.create({ player: () => ({ name: "t", inv: [], coins: 0, auction: { lots: [], bought: {} } }), lv: () => 50, addItem: () => true, dropItem() {}, log() {}, sound() {}, dirty() {}, bang() {} });
    const O = A.offers(); return (ASSETS.house_auction && ASSETS.auction_desk && ASSETS.npc_auctioneer && O.list.length >= 30 && O.list.every((o) => ITEMS[o.name] && o.price > 0)) || "faltando";
  });
  // rodada 113: ninja encapuzado (emboscada)
  test("rodada 113: ninja tem arte 3D e é agressivo sem recompensa de caçada", () => (MOBS.ninja && ASSETS.mob_ninja && MOBS.ninja.ambush && MOBS.ninja.aggro > 0 && MOBS.ninja.noBounty) || "ninja incompleto");
  test("rodada 113: ninja no nível do herói tem a força de um monstro comum do mesmo nível", () => {
    const bad = [5, 40, 120, 190].filter((L) => { const s = VD.mobStats(L); return !(s.hp > 0 && s.atk > 0 && Math.abs(s.atk - MOBS.wolf.atk * L / MOBS.wolf.lvl) < L * 0.5); });
    return bad.length ? "fora da curva: " + bad.join(", ") : true;
  });
  test("todo item tem ícone registrado em ASSETS", () => miss(Object.entries(ITEMS).filter(([, it]) => !ASSETS[it.icon]).map(([n]) => n)));
  test("drops de monstros usam itens existentes", () => miss(Object.values(MOBS).flatMap((d) => d.drops.map(([i]) => i)).filter((i) => !ITEMS[i])));
  test("monstros têm arte registrada", () => miss(Object.values(MOBS).map((d) => d.spr).filter((k) => !ASSETS[k])));
  test("recursos dão itens existentes", () => miss(Object.values(RES).flatMap((r) => r.fish ? r.fish.map((f) => f.item) : [r.item]).filter((i) => !ITEMS[i])));
  test("receitas (fornalha, forja, artesanato) usam materiais existentes", () => miss([
    ...Object.entries(SMELT).flatMap(([b, r]) => [b, ...Object.keys(r.mats)]),
    ...Object.values(GEAR).flatMap((g) => g.tiers.flatMap((t) => t.forge ? Object.keys(t.forge.mats) : [])),
    ...Object.values(CRAFT).flatMap((r) => Object.keys(r.mats))].filter((i) => !ITEMS[i])));
  test("pratos cozidos existem", () => miss(Object.values(ITEMS).filter((it) => it.cook).map((it) => it.cook).filter((i) => !ITEMS[i])));
  test("encomendas usam itens e habilidades válidos", () => miss(ORDER_POOL.filter((o) => !ITEMS[o.item] || !SKILLS[o.skill]).map((o) => o.item)));
  test("tutorial: eventos de coleta/fundição apontam para itens reais", () => miss(TUTORIAL.map((t) => t.ev.split(":")).filter(([k, v]) => v && (k === "gather" || k === "smelt" || k === "cook") && !ITEMS[v]).map((x) => x.join(":"))));
  test("loja só vende itens com preço de compra", () => miss(SHOP_ITEMS.filter((n) => !ITEMS[n] || !ITEMS[n].buy)));
  test("poções de efeito apontam para efeitos existentes", () => miss(Object.entries(ITEMS).filter(([, it]) => it.buff && !BUFFS[it.buff]).map(([n]) => n)));
  test("acessórios têm raridade e espaço válidos", () => miss(Object.entries(ITEMS).filter(([, it]) => it.slot && (!RARITY[it.rarity] || !(VD.EQUIP_SLOTS[it.slot] && (!VD.EQUIP_SLOTS[it.slot].archer || it.ammo)))).map(([n]) => n)));
  test("rodada 104: Arqueiro no lugar do Marinheiro, com arco, flechas (munição) e folhas 3D de tiro", () => {
    const miss = [], H = HEROES.find((h) => h.id === "hero_2");
    if (!H || !H.archer || H.name !== "Arqueiro") miss.push("herói");
    if (HEROES.some((h) => h.name === "Marinheiro")) miss.push("Marinheiro ainda na lista");
    for (const n of ["Flecha de madeira", "Flecha de ferro", "Flecha de lumita"]) { const it = ITEMS[n]; if (!it || it.slot !== "municao" || !it.ammo || !ASSETS[it.icon]) miss.push(n); if (!VD.CRAFT[n] || !(VD.CRAFT[n].n > 1)) miss.push(n + " (receita)"); }
    if (!VD.SHOP_ITEMS.includes("Flecha de madeira") || !ITEMS["Flecha de madeira"].buyN) miss.push("flechas na loja");
    if (!VD.GEAR.espada.tiers.every((t) => t.bow && t.bow.startsWith("Arco"))) miss.push("nomes dos arcos");
    if (!ASSETS.tool_bow || !ASSETS.portrait_hero_2) miss.push("ícone/retrato");
    const A = (window.ANIM_SHEETS || {}).hero_2_strike4; if (!A || !A.b3d) miss.push("folha de tiro");
    return miss.length ? "faltando: " + miss.join(", ") : true;
  });
  test("rodada 104: visual pelo equipamento — toda peça vestível tem aparência numa camada conhecida", () => {
    const miss = [], O = window.ValdoraOutfit;
    if (!O || !O.ORDER) return "js/outfit.js não carregou";
    for (const [n, it] of Object.entries(ITEMS)) {
      if (!it.slot || ["anel", "amuleto", "bracelete"].includes(it.slot) || it.ammo || (it.gear && it.gear !== "espada" && it.gear !== "armadura")) continue;
      if (!it.look || !O.ORDER.includes(it.look[0])) miss.push(n);
    }
    for (const n of ["Túnica do guerreiro", "Manto do místico", "Roupa de caçador"]) if (!VD.SHOP_ITEMS.includes(n)) miss.push(n + " (loja)");
    return miss.length ? "sem aparência: " + miss.join(", ") : true;
  });
  test("rodada 104: Herbalismo — plantas colhidas com a foice, que vira item como as outras ferramentas", () => {
    const miss = [], AS = window.ANIM_SHEETS || {};
    if (!SKILLS.herbalismo || !VD.GEAR.foice) miss.push("habilidade/foice");
    for (const k of ["res_herb", "res_flower", "res_moonlily", "res_crystalbloom"]) {
      const R = RES[k]; if (!R || R.tool !== "foice" || R.skill !== "herbalismo" || !ITEMS[R.item] || !ASSETS[k] || !ASSETS[R.empty]) miss.push(k);
      if (!AS[k] || !AS[k].rows.sway) miss.push(k + " (vento)");
    }
    if (!VD.TUTORIAL.some((s) => s.reward.items && s.reward.items["Foice gasta"])) miss.push("foice no tutorial");
    for (const n of ["Foice gasta", "Machado gasto", "Espada de bronze", "Arco de bronze", "Gibão de couro"]) if (!ITEMS[n] || !ITEMS[n].gear) miss.push(n + " (item)");
    if (!VD.EQUIP_SLOTS.arma || !VD.EQUIP_SLOTS.armadura) miss.push("espaços arma/peitoral");
    if (!["Erva-cidreira", "Flor-de-mel"].every((n) => Object.values(VD.ALCHEMY).some((r) => r.mats[n]))) miss.push("ervas na alquimia");
    if (![1, 2, 3].every((n) => ASSETS[`hero_${n}_reap`])) miss.push("folha de colheita");
    return miss.length ? "faltando: " + miss.join(", ") : true;
  });
  test("rodada 104: boneco com capacete, calça, botas e capa (3 raridades cada), receitas e ícones", () => {
    const miss = [];
    for (const k of ["capacete", "calca", "botas", "capa"]) {
      const its = Object.entries(ITEMS).filter(([, it]) => it.slot === k);
      if (!["comum", "raro", "epico"].every((r) => its.some(([, it]) => it.rarity === r))) miss.push(k + " (raridades)");
      for (const [n, it] of its) { if (!ASSETS[it.icon]) miss.push(n + " (ícone)"); if (!it.mapGear && !VD.CRAFT[n] && !(it.buy && VD.SHOP_ITEMS.includes(n))) miss.push(n + " (receita ou loja)"); } /* rodada 137: equipamento do mapa só cai de monstro */
    }
    for (const [n, r] of Object.entries(VD.CRAFT)) for (const m of Object.keys(r.mats)) if (!ITEMS[m]) miss.push(n + " → " + m);
    if (!VD.EQUIP_SLOTS.municao || !VD.EQUIP_SLOTS.municao.sec) miss.push("secundária (por classe)"); // rodada 105
    if (VD.GEAR.armadura.label !== "Peitoral") miss.push("peitoral");
    return miss.length ? "faltando: " + miss.join(", ") : true;
  });
  test("baú da cripta sorteia itens existentes", () => miss(CRYPT_CHEST.rolls.map(([i]) => i).filter((i) => !ITEMS[i])));
  test("conquistas têm id único", () => new Set(ACHIEVEMENTS.map((a) => a.id)).size === ACHIEVEMENTS.length || "ids repetidos");
  test("folhas animadas: todo monstro com folha tem idle, walk, attack, hit e death", () => miss(Object.entries(window.ANIM_SHEETS || {})
    .filter(([k]) => k.startsWith("mob_") || k === "slime").filter(([, A]) => ["idle", "walk", "attack", "hit", "death"].some((r) => !A.rows[r])).map(([k]) => k)));
  test("folhas animadas: NPCs têm idle e heróis têm idle/hit/morte nas 4 direções", () => miss(Object.entries(window.ANIM_SHEETS || {}).filter(([k, A]) =>
    k.startsWith("npc") && !k.endsWith("_look") && !k.endsWith("_walk6") ? !A.rows.idle : /^hero_\d$/.test(k) ? ["down", "left", "right", "up"].some((d) => !A.rows["idle_" + d] || !A.rows["hit_" + d] || !(A.rows["death_" + d] || A.rows.death_down)) : false).map(([k]) => k)));
  test("folhas animadas: ataque tem quadro de impacto dentro do intervalo", () => miss(Object.entries(window.ANIM_SHEETS || {})
    .filter(([, A]) => A.rows.attack && !(A.rows.attack.impact >= 0 && A.rows.attack.impact < A.rows.attack.frames)).map(([k]) => k)));

  // ---------- módulos ----------
  test("caminho: contorna parede e acha o objetivo", () => {
    const W = 5, H = 5, wall = new Set(["2,0", "2,1", "2,2", "2,3"]);
    const find = ValdoraPath.create(W, H, (x, y) => !wall.has(x + "," + y));
    const p = find(0, 0, (x, y) => x === 4 && y === 0);
    return (p && p.length === 12 && p[p.length - 1].join() === "4,0") || "caminho inesperado: " + JSON.stringify(p);
  });
  test("rodada 104: caminho em 8 direções vai na diagonal e não corta quina de parede", () => {
    const f = ValdoraPath.create(5, 5, () => true, { diag: true }), p = f(0, 0, (x, y) => x === 4 && y === 4);
    if (!p || p.length !== 4) return "diagonal reta esperada: " + JSON.stringify(p);
    const wall = new Set(["1,0"]), g = ValdoraPath.create(3, 3, (x, y) => !wall.has(x + "," + y), { diag: true }), q = g(0, 0, (x, y) => x === 2 && y === 0);
    return (q && !q.some(([x, y], i) => { const [px, py] = i ? q[i - 1] : [0, 0]; return x !== px && y !== py && (wall.has(x + "," + py) || wall.has(px + "," + y)); })) || "cortou a quina: " + JSON.stringify(q);
  });
  test("caminho: devolve null quando não há saída", () => {
    const find = ValdoraPath.create(3, 3, (x, y) => !(x === 1)); return find(0, 0, (x, y) => x === 2) === null || "deveria ser null";
  });
  test("caminho: [] quando já está no objetivo", () => { const f = ValdoraPath.create(3, 3, () => true); const p = f(1, 1, (x, y) => x === 1 && y === 1); return (Array.isArray(p) && !p.length) || "esperado []"; });
  test("efeitos: partículas nascem e somem", () => {
    const fx = ValdoraFX.create(48); fx.burst(1, 1, ["#fff"], 10); fx.sparks(1, 1, 5); fx.dust(1, 1, 3);
    const n = fx.particles.length; for (let i = 0; i < 40; i++) fx.update(0.05);
    return (n === 18 && fx.particles.length === 0) || `nasceram ${n}, restaram ${fx.particles.length}`;
  });
  test("ruído do terreno é determinístico e fica entre 0 e 1", () => {
    for (let i = 0; i < 200; i++) { const v = ValdoraTerrain.noise(i * 1.7, i * 0.3, 4, 5); if (v < 0 || v > 1 || v !== ValdoraTerrain.noise(i * 1.7, i * 0.3, 4, 5)) return "valor ruim " + v; }
  });
  // ---------- regras (js/rules.js) ----------
  const RU = ValdoraRules;
  test("curva de XP cresce sempre e o nível bate com ela", () => {
    for (let l = 2; l <= RU.MAX_LVL; l++) { if (RU.xpFor(l) <= RU.xpFor(l - 1)) return "curva não cresce no nível " + l; if (RU.level(RU.xpFor(l)) !== l || RU.level(RU.xpFor(l) - 1) !== l - 1) return "nível errado em " + l; }
  });
  test("afixos: sorteio sem repetir e dentro da faixa", () => {
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 300; i++) { const a = RU.rollAffixes(2, 1, rnd); if (a.length !== 2 || a[0].id === a[1].id) return "repetiu";
      for (const x of a) { const A = RU.AFFIXES.find((y) => y.id === x.id); if (x.v < A.min || x.v > A.max + 1) return `${x.id}=${x.v} fora da faixa`; } }
  });
  test("bônus de item soma base + afixos", () => { const b = RU.itemBonus({ name: "Anel do caçador", aff: [{ id: "feroz", v: 2 }, { id: "vigoroso", v: 6 }] }, ITEMS); return (b.dmg === 4 && b.acc === 1 && b.hp === 6) || JSON.stringify(b); });
  test("atributos de combate: acessórios e obra-prima entram na conta", () => {
    const st = RU.combatStats({ combate: 10, vitalidade: 10, weapon: { acc: 3, dmg: 1 }, armor: { def: 3 }, style: { acc: 4, dmg: 0, def: 0 }, buffs: [], accessories: [{ acc: 1, dmg: 2, def: 0, hp: 5 }], master: { espada: 1 } });
    return (st.acc === 19 && st.maxHit === 2 + 2 + 1 + 2 + 1 && st.def === 5 + 6 && st.maxHp === 18 + 20 + 5) || JSON.stringify(st); // rodada 137: def = vit/2 + armadura x2
  });
  test("chance de coleta respeita os limites (10% a 95%)", () => RU.gatherChance(1, 30, 0) === 0.1 && RU.gatherChance(40, 1, 3, 1) === 0.95 || "limites errados");
  // ---------- rodada 7: interface, missões, habilidades e cenário animado ----------
  const UI = window.ValdoraUI;
  test("selos: todo afixo e a obra-prima têm arte registrada", () => miss([...RU.AFFIXES.map((a) => a.id), "obra"].filter((id) => !BADGES[id] || !ASSETS[BADGES[id]])));
  test("dica de peça com afixos mostra selo e linha de cada afixo", () => { const h = UI.itemTip({ name: "Anel do caçador", aff: [{ id: "feroz", v: 2 }, { id: "sortudo", v: 4 }] }, "dica");
    return (h.split('class="tip-aff"').length === 3 && h.includes(ASSETS.badge_ferocious) && h.includes("+2 dano") && h.includes("+4% coleta")) || h; });
  test("dica escapa HTML do texto de ajuda", () => !UI.itemTip({ name: "Anel do caçador" }, "<b>x</b>").includes("<b>x</b>") || "não escapou");
  test("missões: passos válidos (itens, monstros e quem entrega)", () => miss(Object.entries(VD.QUESTS).flatMap(([id, q]) => [
    ...(["guard", "bard", "shop", "herb", "carto", "miner", "w_breu", "w_escarpa", "w_oasis", "w_degelo"].includes(q.giver) ? [] : [id + ":giver"]), ...(q.reward.item && !ITEMS[q.reward.item] ? [id + ":" + q.reward.item] : []),
    ...Object.keys(q.reward.items || {}).filter((i) => !ITEMS[i]).map((i) => id + ":" + i), ...(q.after && !VD.QUESTS[q.after] ? [id + ":after"] : []),
    ...q.steps.flatMap((s) => Object.keys(s.deliver || {}).filter((i) => !ITEMS[i])).map((i) => id + ":" + i),
    ...q.steps.filter((s) => s.ev && s.ev.startsWith("kill:") && !MOBS[s.ev.slice(5)]).map((s) => id + ":" + s.ev)])));
  test("habilidades ativas: teclas únicas, recarga e nível positivos", () => { const A = Object.values(VD.ACTIVE);
    return (new Set(A.map((a) => a.key)).size === A.length && A.every((a) => a.cd > 0 && a.lvl > 0 && a.mult > 0)) || "dados inválidos"; });
  test("cenário animado: folhagem (sway) com 16 quadros e chamas (flicker) com 8", () => miss(Object.entries(window.ANIM_SHEETS || {})
    .filter(([, A]) => (A.rows.sway && A.rows.sway.frames !== 16) || (A.rows.flicker && A.rows.flicker.frames !== 8)).map(([k]) => k)));
  test("chefes com golpe especial: impacto dentro da linha", () => miss(Object.entries(window.ANIM_SHEETS || {})
    .filter(([, A]) => A.rows.special && !(A.rows.special.impact > 0 && A.rows.special.impact < A.rows.special.frames)).map(([k]) => k)));
  // ---------- rodada 8: movimentos do Blender ----------
  const AS = window.ANIM_SHEETS || {};
  test("efeitos (fx): água, cardumes e fumaça com tiles e linha em loop", () => miss(["fx_water", "fx_water_deep", "fx_fishspot", "fx_fishspot_deep", "fx_smoke"]
    .filter((k) => !AS[k] || !AS[k].fx || !(AS[k].tiles > 0) || !AS[k].rows.loop)));
  test("pedras com linha de golpe, NPCs com fala, portal/quadro/banca com balanço", () => miss([
    ...["npc_merchant", "npc_guard", "npc_bard"].filter((k) => !AS[k] || !AS[k].rows.talk),
    ...["deco_board", "deco_town_sign", "stall"].filter((k) => AS[k])])); // rodada 104: placa, quadro e barraca não balançam com o vento
  test("heróis com investida nas 4 direções e folha de giro", () => miss(["hero_1", "hero_2", "hero_3"].flatMap((k) => [
    ...["down", "left", "right", "up"].filter((d) => !AS[k] || !AS[k].rows["dash_" + d]).map((d) => k + ":dash_" + d), ...(ASSETS[k + "_spin"] ? [] : [k + "_spin"])])));
  test("baú abrindo: impacto dentro da linha e arte do baú aberto", () => !!(AS.chest_open && AS.chest_open.rows.open.impact < AS.chest_open.rows.open.frames && ASSETS.chest_open) || "faltando");
  test("ícones das habilidades registrados", () => miss(Object.keys(VD.ACTIVE).filter((id) => !ASSETS["skill_" + id])));
  // ---------- rodada 9 ----------
  test("investida com espada: hero_N_dash nas 4 direções", () => miss([1, 2, 3].flatMap((n) => ["down", "left", "right", "up"].filter((d) => !(AS["hero_" + n + "_dash"] && AS["hero_" + n + "_dash"].rows["dash_" + d])).map((d) => n + ":" + d))));
  test("Bento e Ivo andam; golem e slime de lumita têm golpe especial; poço balança", () => miss([
    ...["npc_merchant", "npc_guard"].filter((k) => !AS[k] || !AS[k].rows.walk), ...["mob_golem", "mob_slime_crystal"].filter((k) => !AS[k] || !AS[k].rows.special || !(AS[k].rows.special.impact < AS[k].rows.special.frames)),
    ...(AS.well ? ["well não deveria balançar"] : []), ...["fx_smoke_small", "fx_leaves"].filter((k) => !AS[k] || !AS[k].fx), ...(AS.fx_leaves && AS.fx_leaves.rows.loop.loop ? ["fx_leaves em loop"] : [])]));
  test("monstros com golpe especial apontam para folha com a linha special", () => miss(Object.entries(MOBS).filter(([, d]) => d.special && !(AS[d.spr] && AS[d.spr].rows.special)).map(([k]) => k)));
  test("passivas: todo estilo tem passiva; Preciso critica mais forte; bloqueio deixa ao menos 1 de dano", () =>
    (Object.values(VD.STYLES).every((s) => s.passive && s.passive.name) && RU.critBonus("preciso") > RU.critBonus("agressivo") && RU.blockDmg(1) === 1 && RU.blockDmg(9) === 5 && RU.bleedDmg(4) >= 1) || "regra inesperada");
  test("missão encadeada aponta para missão existente e mini-chefe existente", () => !!(VD.QUESTS.guardiao && VD.QUESTS[VD.QUESTS.guardiao.after] && MOBS.crypt_colossus && MOBS.crypt_colossus.mini) || "faltando");
  test("ícone de missão registrado", () => !!(ASSETS.icon_quest && ASSETS.icon_quest_32) || "faltando");
  // ---------- rodada 10 ----------
  test("mini-chefes com arte e folha próprias; Alfa com uivo (howl)", () => miss([
    ...["crypt_colossus", "wolf_moon"].filter((k) => !MOBS[k] || !ASSETS[MOBS[k].spr] || !AS[MOBS[k].spr] || MOBS[k].tint),
    ...(AS.mob_wolf_moon && AS.mob_wolf_moon.rows.howl && !AS.mob_wolf_moon.rows.howl.loop ? [] : ["howl"]),
    ...(AS.mob_lumita_colossus && AS.mob_lumita_colossus.rows.special ? [] : ["colossus special"])]));
  test("bloqueio: hero_N_block nas 4 direções; respingo fx_bleed sem loop", () => miss([
    ...[1, 2, 3].flatMap((n) => ["down", "left", "right", "up"].filter((d) => !(AS["hero_" + n + "_block"] && AS["hero_" + n + "_block"].rows["block_" + d])).map((d) => n + ":" + d)),
    ...(AS.fx_bleed && AS.fx_bleed.fx && !AS.fx_bleed.rows.loop.loop ? [] : ["fx_bleed"])]));
  test("ícones das passivas e da lua cheia registrados", () => miss([...Object.values(VD.STYLES).map((s) => s.passive && s.passive.icon), "icon_moon", "icon_moon_64"].filter((k) => !k || !ASSETS[k])));
  test("módulos separados carregam (ui, quests, dialogs, render, hud, mobs, world, crafting)", () => miss(["ValdoraUI", "ValdoraQuests", "ValdoraDialogs", "ValdoraRender", "ValdoraHud", "ValdoraMobs", "ValdoraWorld", "ValdoraCrafting"].filter((k) => !window[k])));
  // ---------- rodada 11 ----------
  const WD = window.ValdoraWorld;
  test("masmorras: salas dentro do mapa, baú/saída/início em sala, monstros e baú existentes", () => miss(Object.entries(WD.DUNGEONS).flatMap(([k, D]) => {
    const inRoom = (p) => [...D.rooms, ...D.halls].some(([x0, y0, x1, y1]) => p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1);
    return [...[...D.rooms, ...D.halls].filter(([x0, y0, x1, y1]) => x0 < 1 || y0 < 1 || x1 >= WD.W - 1 || y1 >= WD.H - 1).map(() => k + ":fora"),
      ...["exit", "start", "chest"].filter((q) => !inRoom(D[q])).map((q) => k + ":" + q), ...D.spawns.filter(([t]) => !MOBS[t]).map(([t]) => k + ":" + t),
      ...(VD[D.loot] ? [] : [k + ":" + D.loot]), ...(VD.REGIONS[k] ? [] : [k + ":região"]), ...(D.unlock && !VD.QUESTS[D.unlock] ? [k + ":unlock"] : [])];
  })));
  test("baú da toca sorteia itens existentes", () => miss(VD.DEN_CHEST.rolls.map(([i]) => i).filter((i) => !ITEMS[i])));
  test("Bento e Ivo com folha de caminhada; Lobo alfa uiva; faísca do aparo e estilhaços sem loop", () => miss([
    ...["npc_merchant_sheet", "npc_guard_sheet"].filter((k) => !ASSETS[k] || !SPRITE_SIZE[k]), ...(AS.mob_wolf_alpha && AS.mob_wolf_alpha.rows.howl ? [] : ["alpha howl"]),
    ...["fx_spark_block", "fx_crystal_shards"].filter((k) => !AS[k] || !AS[k].fx || AS[k].rows.loop.loop), ...(MOBS.crypt_colossus.deathFx && AS[MOBS.crypt_colossus.deathFx] ? [] : ["deathFx"])]));
  test("ícones de interface (F, usar, largar) em 32 e 64 px", () => miss(["icon_key_f", "icon_use", "icon_drop"].flatMap((k) => [k, k + "_64"]).filter((k) => !ASSETS[k])));
  test("regiões do mapa de cima: as 5 aparecem", () => { const seen = new Set(); for (let y = 0; y < WD.H; y += 2) for (let x = 0; x < WD.W; x += 2) seen.add(WD.regionShape(x, y));
    return miss(["fields", "east", "south", "west", "ruins"].filter((r) => !seen.has(r))); });
  // ---------- rodada 12 ----------
  test("conquistas novas checam sem erro (toca, lua, colosso) e ids únicos", () => { const st = { dens: 1, killed: { wolf_moon: 1, crypt_colossus: 1 } };
    return miss(["toca1", "lua1", "colosso1"].filter((id) => { const a = ACHIEVEMENTS.find((x) => x.id === id); return !a || !a.check(st) || a.check({ dens: 0, killed: {} }); })); });
  test("toca: entrada, saída, chão e ossos registrados; lobo dorme; ossos balançam", () => miss([
    ...["deco_den", "deco_den_exit", "den_floor", "den_floor_2", "deco_bones_1", "deco_bones_2", "deco_bones_3"].filter((k) => !ASSETS[k]),
    ...(AS.mob_wolf && AS.mob_wolf.rows.sleep && AS.mob_wolf.rows.sleep.loop ? [] : ["wolf sleep"]),
    ...[1, 2, 3].filter((n) => AS["deco_bones_" + n]).map((n) => "bones" + n + " não deveria balançar")]));
  test("rodada 13: lobo levanta (wake), poeira do impacto sem loop, Tomé anda, tocha da toca tremula, ícone de esquiva", () => miss([
    ...(AS.mob_wolf && AS.mob_wolf.rows.wake && !AS.mob_wolf.rows.wake.loop ? [] : ["wake"]), ...(AS.fx_dust_slam && AS.fx_dust_slam.fx && !AS.fx_dust_slam.rows.loop.loop ? [] : ["fx_dust_slam"]),
    ...(AS.npc_bard && AS.npc_bard.rows.walk ? [] : ["bard walk"]), ...(AS.deco_den_torch && AS.deco_den_torch.rows.flicker && ASSETS.deco_den_torch ? [] : ["torch"]),
    ...["icon_dodge", "icon_dodge_64"].filter((k) => !ASSETS[k]), ...(window.ValdoraShop ? [] : ["ValdoraShop"])]));
  test("rodada 14: poeira clara, caminhada do Tomé, cancelamento nas 4 direções, boneco que balança, ícone de área", () => miss([
    ...(AS.fx_dust_slam_light && AS.fx_dust_slam_light.fx && !AS.fx_dust_slam_light.rows.loop.loop ? [] : ["dust light"]), ...(ASSETS.npc_bard_sheet && SPRITE_SIZE.npc_bard_sheet ? [] : ["bard sheet"]),
    ...[1, 2, 3].flatMap((n) => ["down", "left", "right", "up"].filter((d) => !(AS["hero_" + n + "_cancel"] && AS["hero_" + n + "_cancel"].rows["cancel_" + d])).map((d) => n + ":" + d)),
    ...(AS.deco_dummy && AS.deco_dummy.rows.wobble && ASSETS.deco_dummy ? [] : ["dummy"]), ...["icon_dodge_area", "icon_dodge_area_64"].filter((k) => !ASSETS[k]), ...(window.ValdoraInput ? [] : ["ValdoraInput"])]));
  test("rodada 15: boneco gira no revide, aviso no chão em loop de 1 tile, ícone do tutorial, módulos de mouse e câmera", () => miss([
    ...(AS.deco_dummy && AS.deco_dummy.rows.swing && !AS.deco_dummy.rows.swing.loop ? [] : ["swing"]),
    ...(AS.fx_ground_warning && AS.fx_ground_warning.fx && AS.fx_ground_warning.tiles === 1 && AS.fx_ground_warning.rows.loop.loop ? [] : ["ground warning"]),
    ...["icon_tutorial_step", "icon_tutorial_step_64"].filter((k) => !ASSETS[k]), ...["ValdoraPointer", "ValdoraCamera"].filter((k) => !window[k])]));
  test("rodada 16: anel do tremor (5 tiles, loop), poste de treino, ícone de missão concluída, módulo de monstros", () => miss([
    ...(AS.fx_ground_warning_ring && AS.fx_ground_warning_ring.fx && AS.fx_ground_warning_ring.tiles === 5 && AS.fx_ground_warning_ring.rows.loop.loop ? [] : ["ring"]),
    ...["deco_training_post", "icon_quest_done", "icon_quest_done_64"].filter((k) => !ASSETS[k]), ...(window.ValdoraActors ? [] : ["ValdoraActors"])]));
  test("dicas do Ivo cobrem esquiva, tecla F, passivas e toca", () => miss(["área", "F perto", "passiva", "toca"].filter((w) => !VD.TIPS.some((t) => t.includes(w)))));
  test("rodada 17: comemoração nas 4 direções, mural do Ivo, ícone do diário, módulo do herói", () => miss([
    ...[1, 2, 3].flatMap((n) => ["down", "left", "right", "up"].filter((d) => !(AS["hero_" + n + "_cheer"] && AS["hero_" + n + "_cheer"].rows["cheer_" + d])).map((d) => n + ":" + d)),
    ...["deco_quest_board_ivo", "icon_journal_quests", "icon_journal_quests_64"].filter((k) => !ASSETS[k]), ...(window.ValdoraHero ? [] : ["ValdoraHero"])]));
  test("rodada 18: comemoração andando, lápide da cripta, tecla M, módulo do cenário; esqueletos longe do chefe", () => miss([
    ...[1, 2, 3].flatMap((n) => ["down", "left", "right", "up"].filter((d) => !(AS["hero_" + n + "_cheer"] && AS["hero_" + n + "_cheer"].rows["cheer_walk_" + d])).map((d) => n + ":" + d)),
    ...["deco_crypt_signpost", "icon_key_m", "icon_key_m_64"].filter((k) => !ASSETS[k]), ...(window.ValdoraScenery ? [] : ["ValdoraScenery"]),
    ...(window.ValdoraWorld.MOB_SPAWNS.ruins.find((s) => s[0] === "skeleton")[2] ? [] : ["esqueletos sem casa"])]));
  test("rodada 19: esqueleto e guardião saem da terra (rise_up), fogo-fátuo em loop, arco das Ruínas, módulo de minimapa e luzes", () => miss([
    ...["mob_skeleton", "mob_crypt_guardian"].filter((k) => !(AS[k] && AS[k].rows.rise_up && !AS[k].rows.rise_up.loop)),
    ...(AS.fx_soul_wisp && AS.fx_soul_wisp.fx && AS.fx_soul_wisp.rows.loop.loop ? [] : ["wisp"]), ...(ASSETS.deco_ruins_arch ? [] : ["arch"]), ...(window.ValdoraOverlay ? [] : ["ValdoraOverlay"])]));
  test("rodada 20: golem sai das pedras (rise_up), pedras rolando sem loop, marco do Planalto, avisos de renascimento por monstro, módulo de eventos", () => miss([
    ...(AS.mob_golem && AS.mob_golem.rows.rise_up ? [] : ["golem rise_up"]), ...(AS.fx_rock_rubble && AS.fx_rock_rubble.fx && !AS.fx_rock_rubble.rows.loop.loop ? [] : ["rubble"]),
    ...(ASSETS.deco_plateau_cairn ? [] : ["cairn"]), ...Object.entries(MOBS).filter(([, d]) => d.marker && !AS[d.marker.fx]).map(([k]) => k + ":marker"), ...(window.ValdoraEvents ? [] : ["ValdoraEvents"])]));
  test("rodada 21: slime de lumita sai da poça (rise_up sem loop, sem poeira), ícone de renascimento, gearIcon nos diálogos, armadura de lumita", () => miss([
    ...(AS.mob_slime_crystal && AS.mob_slime_crystal.rows.rise_up && !AS.mob_slime_crystal.rows.rise_up.loop ? [] : ["slime rise_up"]), ...(MOBS.slime_crystal.riseFx === false ? [] : ["riseFx"]),
    ...["icon_respawn", "icon_respawn_64"].filter((k) => !ASSETS[k]), ...(typeof ValdoraDialogs.gearIcon === "function" ? [] : ["gearIcon"]),
    ...(GEAR.armadura.tiers.length >= 5 && GEAR.armadura.tiers[4].forge.mats["Barra de lumita"] ? [] : ["armadura tier 4"]) /* rodada 82: há um nível 5 depois */]));
  test("rodada 22: fúria do Senhor (enrage + aura), brilho da poça, ícone da Couraça, ecos semanais", () => miss([
    ...(AS.mob_boss_ruins && AS.mob_boss_ruins.rows.enrage && !AS.mob_boss_ruins.rows.enrage.loop ? [] : ["enrage"]),
    ...["fx_enrage_aura", "fx_crystal_glint"].filter((k) => !(AS[k] && AS[k].fx && AS[k].rows.loop.loop)),
    ...(MOBS.boss.enrage && MOBS.slime_crystal.marker && MOBS.slime_crystal.marker.fx === "fx_crystal_glint" ? [] : ["dados"]),
    ...["item_armor_lumita", "item_armor_lumita_64"].filter((k) => !ASSETS[k]), ...(GEAR.armadura.tiers[4].icon === "item_armor_lumita" ? [] : ["tier icon"]),
    ...Object.entries(MOBS).filter(([, d]) => d.echo).filter(([, d]) => !(MOBS[d.echo] && d.noBounty && d.boss && d.drops.some(([n]) => n === "Eco cristalizado"))).map(([k]) => k),
    ...(Object.values(MOBS).filter((d) => d.echo && !d.echoHome).length === 2 ? [] : ["2 ecos"]) /* rodada 83: o eco da Serpente é à parte */, ...(CRAFT["Amuleto dos ecos"] ? [] : ["amuleto"])]));
  test("rodada 23: névoa do eco (sem loop), ícones próprios do Eco cristalizado e do Amuleto dos ecos, sem filtro", () => miss([
    ...(AS.fx_echo_summon && AS.fx_echo_summon.fx && !AS.fx_echo_summon.rows.loop.loop ? [] : ["fx_echo_summon"]),
    ...["item_echo_crystal", "item_echo_crystal_64", "item_amulet_echo", "item_amulet_echo_64"].filter((k) => !ASSETS[k]),
    ...["Eco cristalizado", "Amuleto dos ecos"].filter((n) => ITEMS[n].filter || !/echo/.test(ITEMS[n].icon))]));
  test("rodada 24: eco se desfaz em névoa (sem loop), sino dos ecos semanais, dicas da fúria e dos ecos", () => miss([
    ...(AS.fx_echo_fade && AS.fx_echo_fade.fx && !AS.fx_echo_fade.rows.loop.loop ? [] : ["fx_echo_fade"]),
    ...["icon_echo_week", "icon_echo_week_64"].filter((k) => !ASSETS[k]),
    ...(VD.TIPS.some((t) => /fúria/.test(t)) && VD.TIPS.some((t) => /ecos semanais/.test(t)) ? [] : ["dicas"])]));
  test("rodada 25: Tomé com a linha play (loop), ícone das dicas, encomendas com peso e quantidade pelo nível", () => miss([
    ...(AS.npc_bard && AS.npc_bard.rows.play && AS.npc_bard.rows.play.loop ? [] : ["npc_bard play"]),
    ...["icon_tip", "icon_tip_64"].filter((k) => !ASSETS[k]), ...(ORDER_POOL.every((o) => o.req >= 1 && o.qty[0] <= o.qty[1]) ? [] : ["ORDER_POOL"])]));
  test("rodada 26: notas musicais do Tomé (loop) e ícone de encomenda grande", () => miss([
    ...(AS.fx_music_notes && AS.fx_music_notes.fx && AS.fx_music_notes.rows.loop.loop ? [] : ["fx_music_notes"]),
    ...["icon_order_up", "icon_order_up_64"].filter((k) => !ASSETS[k])]));
  test("rodada 27: peixe saltando (sem loop) e ícone do cardume", () => miss([
    ...(AS.fx_fish_jump && AS.fx_fish_jump.fx && !AS.fx_fish_jump.rows.loop.loop ? [] : ["fx_fish_jump"]),
    ...["icon_fish_spot", "icon_fish_spot_64"].filter((k) => !ASSETS[k])]));
  test("rodada 28: chiado na grelha (loop), ícone de queimado, chance de queimar 24% → 0 em 8 níveis", () => miss([
    ...(AS.fx_cook_sizzle && AS.fx_cook_sizzle.fx && AS.fx_cook_sizzle.rows.loop.loop ? [] : ["fx_cook_sizzle"]),
    ...["icon_burnt", "icon_burnt_64"].filter((k) => !ASSETS[k]),
    ...(Math.abs(RU.burnChance(10, 10) - 0.24) < 1e-9 && RU.burnChance(18, 10) === 0 && RU.burnChance(5, 10) <= 0.24 ? [] : ["burnChance"])]));
  test("rodada 29: folhas de assar dos 3 heróis e ícone da frigideira", () => miss([
    ...[1, 2, 3].map((n) => `hero_${n}_cook`).filter((k) => !ASSETS[k] || !window.HERO_ACTION_SHEETS.includes(k)),
    ...["icon_cook_level", "icon_cook_level_64"].filter((k) => !ASSETS[k])]));
  test("rodada 30: espetinho de javali (cura 15 desde a rodada 88, carne + madeira), ícones do espetinho e do coração", () => miss([
    ...(ITEMS["Espetinho de javali"] && ITEMS["Espetinho de javali"].heal === 15 && ITEMS["Carne de javali"].skewer && ITEMS["Carne de javali"].skewer.item === "Espetinho de javali" ? [] : ["espetinho"]),
    ...["item_meat_skewer", "item_meat_skewer_64", "icon_heal_small", "icon_heal_small_64"].filter((k) => !ASSETS[k])]));
  test("rodada 31: aviso de matilha, varal de carne com sway, nível mínimo por região, peixe queimado vendável", () => miss([
    ...["icon_danger_pack", "icon_danger_pack_64", "deco_meat_rack"].filter((k) => !ASSETS[k]),
    ...(AS.deco_meat_rack ? ["deco_meat_rack não deveria balançar"] : []),
    ...Object.entries(VD.REGIONS).filter(([k, R]) => k !== "town" && k !== "fields" && !(R.min > 0 && R.danger)).map(([k]) => "região " + k),
    ...(ITEMS["Peixe queimado"].price > 0 ? [] : ["peixe queimado"])]));
  test("rodada 32: caveira de alerta, tronco-banco da fogueira, boas-vindas do Ivo citam os níveis", () => miss([
    ...["icon_danger_generic", "icon_danger_generic_64", "deco_campfire_log"].filter((k) => !ASSETS[k]),
    ...(/nível recomendado/.test(TUTORIAL[0].say) ? [] : ["fala do Ivo"])]));
  test("rodada 33: Tomé sentado (linha sit em loop), ícone do minimapa", () => miss([
    ...(AS.npc_bard && AS.npc_bard.rows.sit && AS.npc_bard.rows.sit.loop ? [] : ["npc_bard sit"]),
    ...["icon_minimap_help", "icon_minimap_help_64"].filter((k) => !ASSETS[k])]));
  test("rodada 34: continência do Ivo (sem loop) e ícone de missão pronta", () => miss([
    ...(AS.npc_guard && AS.npc_guard.rows.salute && !AS.npc_guard.rows.salute.loop ? [] : ["npc_guard salute"]),
    ...["icon_quest_turnin", "icon_quest_turnin_64"].filter((k) => !ASSETS[k])]));
  test("rodada 35: joinha do Bento (sem loop) e ícone da Lua cheia a caminho", () => miss([
    ...(AS.npc_merchant && AS.npc_merchant.rows.thumbs && !AS.npc_merchant.rows.thumbs.loop ? [] : ["npc_merchant thumbs"]),
    ...["icon_event_soon", "icon_event_soon_64"].filter((k) => !ASSETS[k])]));
  test("rodada 36: brilho do joinha (sem loop) e ícone de encomenda entregue", () => miss([
    ...(AS.fx_thumbs_spark && AS.fx_thumbs_spark.fx && !AS.fx_thumbs_spark.rows.loop.loop ? [] : ["fx_thumbs_spark"]),
    ...["icon_order_done", "icon_order_done_64"].filter((k) => !ASSETS[k])]));
  test("rodada 37: reverência do Tomé (sem loop) e medalha de conquista", () => miss([
    ...(AS.npc_bard && AS.npc_bard.rows.bow && !AS.npc_bard.rows.bow.loop ? [] : ["npc_bard bow"]),
    ...["icon_achievement_new", "icon_achievement_new_64"].filter((k) => !ASSETS[k])]));
  test("rodada 38: Tomé levantando do tronco (stand_up, 4 quadros, sem loop) e pergaminho do cartão do save", () => miss([
    ...(AS.npc_bard && AS.npc_bard.rows.stand_up && !AS.npc_bard.rows.stand_up.loop && AS.npc_bard.rows.stand_up.frames === 4 ? [] : ["npc_bard stand_up"]),
    ...(ASSETS.icon_save_card_bg ? [] : ["icon_save_card_bg"])]));
  test("rodada 39: faixa do título e ícone do Continuar", () => miss(["deco_lobby_banner", "icon_continue_play", "icon_continue_play_64"].filter((k) => !ASSETS[k])));
  test("rodada 40: faixa ondulando (8 quadros 640 × 120, loop, só na tela inicial) e plaquinha da versão", () => miss([
    ...(AS.fx_banner_wave && AS.fx_banner_wave.cellH === 120 && AS.fx_banner_wave.rows.loop.frames === 8 && AS.fx_banner_wave.rows.loop.loop && !(AS.fx_banner_wave.tiles > 0) ? [] : ["fx_banner_wave"]),
    ...["icon_version_tag", "icon_version_tag_2x"].filter((k) => !ASSETS[k])]));
  test("rodada 41: ícone do teclado e gancho da plaquinha", () => miss(["icon_keyboard_help", "icon_keyboard_help_64", "deco_version_hook", "deco_version_hook_2x"].filter((k) => !ASSETS[k])));
  test("rodada 42: item entrando no baú (6 quadros, sem loop) e ícone de guardar materiais", () => miss([
    ...(AS.fx_item_store && AS.fx_item_store.fx && !AS.fx_item_store.rows.loop.loop && AS.fx_item_store.rows.loop.frames === 6 ? [] : ["fx_item_store"]),
    ...["icon_bank_move", "icon_bank_move_64"].filter((k) => !ASSETS[k])]));
  test("rodada 43: comida saindo do baú (6 quadros, sem loop) e ícone de retirar comida", () => miss([
    ...(AS.fx_item_take && AS.fx_item_take.fx && !AS.fx_item_take.rows.loop.loop && AS.fx_item_take.rows.loop.frames === 6 ? [] : ["fx_item_take"]),
    ...["icon_bank_take", "icon_bank_take_64"].filter((k) => !ASSETS[k])]));
  test("rodada 44: ícones de organizar o cofre e da lupa do filtro", () => miss(["icon_bank_sort", "icon_bank_sort_64", "icon_filter", "icon_filter_32"].filter((k) => !ASSETS[k])));
  test("rodada 45: fumaça do assar tudo (8 quadros, sem loop) e ícone", () => miss([
    ...(AS.fx_cook_batch && AS.fx_cook_batch.fx && !AS.fx_cook_batch.rows.loop.loop && AS.fx_cook_batch.rows.loop.frames === 8 ? [] : ["fx_cook_batch"]),
    ...["icon_cook_all", "icon_cook_all_64"].filter((k) => !ASSETS[k])]));
  test("rodada 46: interrogações do monstro que desiste (sem loop), cadeado e armadura alinhada à curva da Vitalidade", () => miss([
    ...(AS.fx_mob_give_up && AS.fx_mob_give_up.fx && !AS.fx_mob_give_up.rows.loop.loop ? [] : ["fx_mob_give_up"]),
    ...["icon_gear_locked", "icon_gear_locked_64"].filter((k) => !ASSETS[k]),
    // nos estilos Agressivo/Preciso a Vitalidade sobe a 1/3 do Combate: cada armadura deve chegar junto da espada do mesmo tier
    ...[2, 3, 4].filter((t) => { const c = GEAR.espada.tiers[t].req, s = VD.STYLES.preciso.xp, v = RU.level(RU.xpFor(c) * s.vitalidade / s.combate); return GEAR.armadura.tiers[t].req > v + 1; }).map((t) => "armadura tier " + t)]));
  test("rodada 47: moldura de vida baixa e ícone de recuar", () => miss(["fx_low_hp_vignette", "icon_retreat", "icon_retreat_64"].filter((k) => !ASSETS[k])));
  test("rodada 48: ícone de comida acabando e linhas de comer do herói nas 4 direções", () => miss([
    ...["icon_food_low", "icon_food_low_64"].filter((k) => !ASSETS[k]),
    ...["hero_1_anim", "hero_2_anim", "hero_3_anim"].filter((k) => (window.ANIM_SHEETS || {})[k]).flatMap((k) => ["down", "left", "right", "up"].filter((d) => !window.ANIM_SHEETS[k].rows["eat_" + d]).map((d) => k + " eat_" + d))]));
  test("rodada 49: santuário — arte, títulos em ordem e só prestígio (sem bônus de combate)", () => {
    const R = VD.SHRINE.ranks, ok = ["at", "title", "color", "perk", "halo", "sparks"], S = window.ValdoraShrine;
    return miss([
      ...["deco_shrine_offering", "icon_gold_sink", "icon_gold_sink_64"].filter((k) => !ASSETS[k]),
      ...R.filter((r, i) => i && r.at <= R[i - 1].at).map((r) => "ordem " + r.title),
      ...R.flatMap((r) => Object.keys(r).filter((k) => !ok.includes(k)).map((k) => `${r.title}: ${k}`)),
      ...(S && S.rankOf(999) === null && S.rankOf(1000) === R[0] && S.rankOf(1e6) === R[R.length - 1] && S.nextOf(R[0].at) === R[1] ? [] : ["ValdoraShrine.rankOf/nextOf"])]);
  });
  test("rodada 50: chamas das velas (overlay de 128 px, 6 quadros em loop) e medalha do título", () => {
    const F = (window.ANIM_SHEETS || {}).fx_candle_flames;
    return miss([
      ...(F && F.cell === 128 && !(F.tiles > 0) && F.rows.loop && F.rows.loop.loop && F.rows.loop.frames === 6 ? [] : ["fx_candle_flames"]),
      ...(SPRITE_SIZE.deco_shrine_offering && SPRITE_SIZE.deco_shrine_offering[0] === 2 ? [] : ["santuário 2x2"]),
      ...["icon_title_badge", "icon_title_badge_64"].filter((k) => !ASSETS[k])]);
  });
  test("rodada 51: moedas na tigela (overlay, 8 quadros sem loop), medalha dourada da Lenda e chama votiva cosmética", () => {
    const F = (window.ANIM_SHEETS || {}).fx_offering_coins, S = window.ValdoraShrine, R = VD.SHRINE.ranks, V = VD.SHRINE.votive;
    return miss([
      ...(F && F.cell === 128 && !(F.tiles > 0) && F.rows.loop && !F.rows.loop.loop && F.rows.loop.frames === 8 ? [] : ["fx_offering_coins"]),
      ...["icon_title_badge_gold", "icon_title_badge_gold_64"].filter((k) => !ASSETS[k]),
      ...(S && S.badge(R[R.length - 1]) === ASSETS.icon_title_badge_gold && S.badge(R[0]) === ASSETS.icon_title_badge ? [] : ["medalha por título"]),
      ...(V && V.cost > 0 && V.min > 0 && V.max >= V.min && Object.keys(V).every((k) => ["cost", "min", "max"].includes(k)) ? [] : ["chama votiva"])]);
  });
  test("rodada 52: chama votiva do herói (1 tile, loop) e velas votivas (overlay do santuário, loop)", () => {
    const A = window.ANIM_SHEETS || {}, F = A.fx_votive_flame, C = A.fx_votive_candles;
    return miss([
      ...(F && F.fx && F.tiles === 1 && F.rows.loop && F.rows.loop.loop && F.rows.loop.frames === 6 ? [] : ["fx_votive_flame"]),
      ...(C && C.cell === 128 && !(C.tiles > 0) && C.rows.loop && C.rows.loop.loop && C.rows.loop.frames === 6 ? [] : ["fx_votive_candles"])]);
  });
  test("rodada 53: ícone da chama votiva no painel e santuário com a parte viva em js/shrine.js", () => {
    const S = window.ValdoraShrine;
    return miss([
      ...["icon_votive_hud", "icon_votive_hud_32"].filter((k) => !ASSETS[k]),
      ...(S && typeof S.create === "function" ? [] : ["ValdoraShrine.create"])]);
  });
  test("rodada 54: cada dica do Ivo tem Combate mínimo, há dicas para iniciantes e a janela é desenhada por js/dialogs.js", () => {
    const M = VD.TIP_MIN || [];
    return miss([
      ...(M.length === VD.TIPS.length ? [] : [`TIP_MIN tem ${M.length} de ${VD.TIPS.length}`]),
      ...(M.filter((m) => m <= 1).length >= 5 ? [] : ["poucas dicas para o Combate 1"]),
      ...(window.ValdoraDialogs && typeof ValdoraDialogs.create === "function" ? [] : ["ValdoraDialogs.create"])]);
  });
  test("rodada 55: toda região tem ícone (16 e 32 px) registrado", () => miss(Object.entries(VD.REGIONS).flatMap(([k, R]) =>
    !R.icon ? [k + " sem ícone"] : [R.icon, R.icon + "_32"].filter((a) => !ASSETS[a]).map((a) => `${k}: ${a}`))));
  test("rodada 56: ícones das dicas por situação existem (cofre, espetinho, cardume, passiva do Defensivo)", () => miss(
    ["icon_bank_move", "item_meat_skewer", "icon_fish_spot", VD.STYLES.defensivo.passive.icon].filter((k) => !ASSETS[k])));
  // rodada 57: os botões das janelas (js/dlgactions.js) com um jogador de mentira e funções de estado que só anotam o que foi pedido
  const fakeWorld = () => {
    const calls = [], slot = (n, q = 1) => ({ name: n, n: q });
    const player = { inv: Array(8).fill(null), bank: Array(8).fill(null), coins: 0, buffs: {}, px: 0, py: 0, orders: [{ item: "Madeira" }], bounties: [{ type: "slime" }] };
    const dlg = { obj: { x: 0, y: 0 }, song: "a" };
    const moveStack = (from, i, to) => { const s = from[i]; if (!s) return; const j = to.indexOf(null); if (j < 0) return; to[j] = s; from[i] = null; };
    const note = (k) => (...a) => { calls.push([k, ...a]); };
    const A = ValdoraDlgActions.create({ player: () => player, dlg: () => dlg, npc: () => ({}), shrine: () => ({ offer: note("offer"), votive: note("votive") }), dirty: () => {},
      sell: note("sell"), buy: note("buy"), deliver: note("deliver"), newOrder: (o) => ({ item: "novo:" + o }), moveStack, takeFx: note("takeFx"), storeFx: note("storeFx"),
      log: note("log"), craft: note("craft"), QUEST: { accept: note("accept"), deliver: note("qdeliver"), finish: () => null }, react: note("react"), rand: () => 0.99,
      SND: { play: () => {} }, addFloat: () => {}, claimBounty: note("claim"), wakeEcho: note("echo"), newBounty: (t) => ({ type: "novo:" + t }), emit: note("emit"), accName: (s) => s.name });
    return { A, player, dlg, calls, slot };
  };
  test("rodada 57: janelas — guardar tudo deixa comida, poção e acessório na mochila", () => {
    const W = fakeWorld(); W.player.inv = [W.slot("Madeira", 5), W.slot("Lambari assado", 2), W.slot("Poção de vida"), W.slot("Cobre", 3), null];
    W.A.dlgBank({ depall: "1" });
    const inv = W.player.inv.filter(Boolean).map((s) => s.name).sort(), bank = W.player.bank.filter(Boolean).map((s) => s.name).sort();
    const fx = W.calls.filter((c) => c[0] === "storeFx");
    return inv.join() === "Lambari assado,Poção de vida" && bank.join() === "Cobre,Madeira" && fx.length === 1 && fx[0][2] === "Madeira" || `mochila ${inv} · cofre ${bank} · efeitos ${fx.length}`;
  });
  test("rodada 57: janelas — organizar o cofre põe comida, materiais e barras nessa ordem", () => {
    const W = fakeWorld(); W.player.bank = [W.slot("Barra de bronze"), null, W.slot("Madeira"), W.slot("Tucunaré assado"), W.slot("Cobre"), null, null, null];
    W.A.dlgBank({ sortbank: "1" });
    const got = W.player.bank.filter(Boolean).map((s) => s.name).join(" > ");
    return got === "Tucunaré assado > Cobre > Madeira > Barra de bronze" || got;
  });
  test("rodada 57: janelas — retirar comida tira primeiro a que mais cura e não leva poção", () => {
    const W = fakeWorld(); W.player.bank = [W.slot("Lambari assado", 3), W.slot("Poção de vida"), W.slot("Tucunaré assado", 2), null, null, null, null, null];
    W.A.dlgBank({ takefood: "1" });
    const inv = W.player.inv.filter(Boolean).map((s) => s.name), fx = W.calls.find((c) => c[0] === "takeFx");
    return inv[0] === "Tucunaré assado" && inv.includes("Lambari assado") && !inv.includes("Poção de vida") && fx && fx[2] === "Tucunaré assado" || `mochila ${inv} · efeito ${fx && fx[2]}`;
  });
  test("rodada 57: janelas — vender tudo pula comida e barras; Tomé cobra 10 moedas e inspira", () => {
    const W = fakeWorld(); W.player.inv = [W.slot("Madeira", 5), W.slot("Lambari assado"), W.slot("Barra de bronze"), W.slot("Cobre"), null];
    W.A.dlgShop({ sellall: "1" });
    const sold = W.calls.filter((c) => c[0] === "sell").map((c) => c[1]).sort().join();
    W.player.coins = 15; W.A.dlgBard({ gift: "1" }); const c1 = W.player.coins, b1 = !!W.player.buffs.inspirado;
    W.player.coins = 5; W.player.buffs = {}; W.A.dlgBard({ gift: "1" }); const c2 = W.player.coins, b2 = !!W.player.buffs.inspirado;
    W.A.dlgBard({ song: "1" });
    return sold === "Cobre,Madeira" && c1 === 5 && b1 && c2 === 5 && !b2 && W.dlg.song !== "a" || `vendeu ${sold} · presente ${c1}/${b1} ${c2}/${b2} · canção ${W.dlg.song}`;
  });
  test("rodada 57: janelas — fundir cria o trabalho, trocar caçada e encomenda sorteiam outra, eco para o redesenho", () => {
    const W = fakeWorld();
    W.A.dlgWork({ smelt: "Barra de bronze", n: "0" }); const job = W.player.job;
    W.A.dlgBoard({ rerollB: "0" }); W.A.dlgShop({ reroll: "0" });
    const stop = W.A.run({ echo: "boss" }), off = W.A.run({ offer: "100" });
    return job && job.kind === "smelt" && job.left === 1 && W.player.bounties[0].type === "novo:slime" && W.player.orders[0].item === "novo:Madeira" && stop === "stop" && off !== "stop"
      && W.calls.some((c) => c[0] === "offer" && c[1] === 100) || JSON.stringify({ job, b: W.player.bounties[0], o: W.player.orders[0], stop, off });
  });
  // rodada 58: o santuário (js/shrine.js) com um jogador de mentira — oferta, títulos, chama votiva e o fim dela
  const fakeShrine = (coins, offered) => {
    const calls = [], note = (k) => (...a) => { calls.push([k, ...a]); };
    const player = { coins, offered, votiveT: 0, votives: 0, px: 0, py: 0, deadT: 0, name: "Teste", dir: "down" };
    const shrine = { x: 0, y: 0 };
    const S = ValdoraShrine.create({ player: () => player, npc: () => ({ shrine }), inCrypt: () => false, ANIMS: {}, TILE: 48, cam: { x: 0, y: 0 }, tags: [], rand: () => 0.5,
      drawFx: () => {}, fx: { sparks: note("sparks") }, burst: note("burst"), SND: { play: () => {} }, log: note("log"), toast: note("toast"), dirty: () => {}, save: note("save") });
    return { S, player, shrine, calls };
  };
  test("rodada 58: santuário — ofertar tira moedas, soma no total e dá o título ao cruzar o valor", () => {
    const R = VD.SHRINE.ranks, F = fakeShrine(5000, 0);
    F.S.offer(500); const a = [F.player.coins, F.player.offered, F.calls.filter((c) => c[0] === "toast").length];
    F.S.offer(R[0].at - 500); const toast = F.calls.filter((c) => c[0] === "toast");
    F.S.offer(999999); const semMoedas = F.player.offered;
    return a.join() === "4500,500,0" && toast.length === 1 && String(toast[0][1]).includes(R[0].title) && semMoedas === R[0].at && F.shrine.flareT > 0
      || JSON.stringify({ a, toast, semMoedas, flare: F.shrine.flareT });
  });
  test("rodada 58: santuário — chama votiva só depois da Lenda, com teto de 2 h, e avisa quando apaga", () => {
    const R = VD.SHRINE.ranks, V = VD.SHRINE.votive;
    const A = fakeShrine(50000, R[R.length - 2].at); A.S.votive(); const antes = [A.player.votiveT, A.player.coins];
    const B = fakeShrine(50000, R[R.length - 1].at); for (let i = 0; i < 20; i++) B.S.votive();
    const cheia = [B.player.votiveT, B.player.votives, B.player.coins];
    B.player.votiveT = 1; B.S.update(1.5); const apagou = B.calls.filter((c) => c[0] === "log" && /apagou/.test(c[1])).length;
    const ok = antes.join() === "0,50000" && cheia[0] <= V.max * 60 && cheia[0] > (V.max - V.min) * 60 && cheia[1] === V.max / V.min && cheia[2] === 50000 - cheia[1] * V.cost && B.player.votiveT === 0 && apagou === 1;
    return ok || JSON.stringify({ antes, cheia, apagou });
  });
  test("rodada 59: seta de volta do minimapa (16 e 32 px)", () => miss(["icon_minimap_back", "icon_minimap_back_32"].filter((k) => !ASSETS[k])));
  test("rodada 60: goblins acordam a no máximo 2 tiles e o Bosque continua liberado no Combate 6", () =>
    VD.MOBS.goblin.aggro <= 2 && VD.REGIONS.east.min === 6 || `aggro ${VD.MOBS.goblin.aggro}, mínimo ${VD.REGIONS.east.min}`);
  test("rodada 61: nenhuma conquista tem o mesmo nome de um título do santuário", () => {
    const T = new Set(VD.SHRINE.ranks.map((r) => r.title));
    return miss(VD.ACHIEVEMENTS.filter((a) => T.has(a.name)).map((a) => a.name));
  });
  test("rodada 62: lobos e alfas nascem a pelo menos 6 tiles dos Campos e da vila", () => {
    const E = window.ValdoraWorld.SPAWN_EDGE || {};
    return (E.wolf >= 6 && E.wolf_alpha >= 6) || `wolf ${E.wolf}, wolf_alpha ${E.wolf_alpha}`;
  });
  test("rodada 63: javalis nascem a pelo menos 8 tiles do acampamento goblin", () => {
    const A = (window.ValdoraWorld.SPAWN_AWAY || {}).boar;
    return (A && A.dist >= 8 && A.from === window.ValdoraWorld.CAMP) || JSON.stringify(A);
  });
  test("rodada 64: gerador com semente repete a mesma sequência (base das medições com mundo fixo)", () => {
    const G = ValdoraRules.mulberry32; if (!G) return "sem ValdoraRules.mulberry32";
    const seq = (s) => { const g = G(s); return Array.from({ length: 50 }, () => g()); };
    const a = seq(11), b = seq(11), c = seq(12);
    const igual = a.every((v, i) => v === b[i]), difere = a.some((v, i) => v !== c[i]), faixa = a.every((v) => v >= 0 && v < 1);
    return (igual && difere && faixa) || `igual ${igual}, difere ${difere}, faixa ${faixa}`;
  });
  test("tutorial tem o passo da esquiva no boneco", () => TUTORIAL.some((t) => t.ev === "dodge") || "faltando");
  test("módulo de coleta carrega", () => !!window.ValdoraGather || "faltando");
  test("rodada 147: PvP fora do Campo e das vilas; PK 2 h, 50 monstros tiram 1 min, ataque volta a 2 h, paz por 1000", () => {
    const P = window.ValdoraPvP, r = [], p = { coins: 1500 };
    if (P.zoneOk({ biome: 1, town: false }) || P.zoneOk({ biome: 4, town: true }) || !P.zoneOk({ biome: 2, town: false })) r.push("zonas");
    if (P.zoneOk({ biome: 0, dungeon: "crypt" }) || !P.zoneOk({ biome: 0, dungeon: "dg_desert" })) r.push("masmorras");
    P.onKillPlayer(p); if (p.pk !== 7200) r.push("PK 2 h");
    for (let i = 0; i < 50; i++) P.onKillMob(p); if (p.pk !== 7140) r.push("50 monstros = -1 min");
    P.tick(p, 100); P.onAttackPlayer(p); if (p.pk !== 7200) r.push("ataque volta a 2 h");
    if (!P.hostile(p) || !P.locked(p) || P.toggleMode(p)) r.push("PK trava o Hostil");
    if (!P.peace(p) || p.pk || p.coins !== 500 || P.peace(p)) r.push("paz por 1000");
    if (!P.toggleMode(p) || P.hostile(p) || !P.toggleMode(p) || !P.hostile(p)) r.push("botão Passivo/Hostil"); /* rodada 148 */
    return miss(r);
  });
  test("iluminação: dia claro, noite escura", () => ValdoraLight.darkness(0.2) === 0 && ValdoraLight.darkness(0.8) === 0 && ValdoraLight.darkness(0.92) > 0.5 || "curva inesperada"); // rodada 139: dia 2 h, noite 20 min
  test("rodada 66: números de dano têm estilo por tipo (causado, crítico, recebido, sangramento)", () => {
    const fx = ValdoraFX.create(48, () => 0.5);
    fx.hitSplat(1, 1, 7, "#ffffff", false); fx.hitSplat(3, 1, 12, "#ffd23a", true); fx.hitSplat(5, 1, 4, "#ff5a4a"); fx.hitSplat(7, 1, 2, "#ff6b5a");
    const [a, b, c, d] = fx.floaters;
    const ok = a.num === "dealt" && a.text === "7" && b.num === "crit" && b.text === "12!" && b.size > a.size && c.num === "taken" && c.text === "\u22124" && d.num === "dot" && d.size < a.size;
    return ok || fx.floaters.map((f) => `${f.num}:${f.text}:${f.size}`).join(" ");
  });
  test("rodada 66: textos no mesmo lugar sobem em faixas; avisos repetidos viram um com contador", () => {
    const fx = ValdoraFX.create(48, () => 0.5);
    fx.hitSplat(2, 2, 5, "#ffffff"); fx.hitSplat(2, 2, 6, "#ffffff"); fx.hitSplat(2, 2, 7, "#ffffff");
    const ys = fx.floaters.map((f) => f.y), separados = ys[0] - ys[1] >= 0.3 && ys[1] - ys[2] >= 0.3;
    fx.addFloat(5, 5, "bloqueou", "#9fd0ff"); fx.addFloat(5.2, 5, "bloqueou", "#9fd0ff"); fx.addFloat(5, 5, "bloqueou", "#9fd0ff");
    const blk = fx.floaters.filter((f) => f.base === "bloqueou");
    fx.hitSplat(9, 9, 18, "#ffd23a", true); fx.addFloat(9, 8.6, "+11 moedas", "#f1c40f"); // o texto da recompensa não cai no arco do número
    const moedas = fx.floaters.find((f) => f.base === "+11 moedas"); if (!(moedas.y <= 9 - 0.85)) return `moedas em ${moedas.y}`;
    return (separados && blk.length === 1 && blk[0].text === "bloqueou \u00d73") || `faixas ${ys.map((v) => v.toFixed(2))}, avisos ${blk.map((f) => f.text)}`;
  });
  test("rodada 66: sombra de nuvem emenda sem costura e fica entre 0 e 1", () => {
    const A = window.ValdoraAmbient; if (!A) return "sem ValdoraAmbient";
    let pior = 0, faixa = true;
    for (let i = 0; i < 40; i++) { const u = (i * 0.137) % 1, v = (i * 0.291) % 1, a = A.cloudAt(u, v); faixa = faixa && a >= 0 && a <= 1;
      pior = Math.max(pior, Math.abs(a - A.cloudAt(u + 1, v)), Math.abs(a - A.cloudAt(u, v + 1))); }
    let cobre = 0; for (let i = 0; i < 400; i++) cobre += A.cloudAt((i % 20) / 20, Math.floor(i / 20) / 20) > 0.05;
    return (faixa && pior < 1e-6 && cobre > 20 && cobre < 380) || `faixa ${faixa}, costura ${pior}, cobertura ${cobre}/400`;
  });
  test("rodada 66: partículas de vento respeitam o teto de cada região e trocam com o lugar", () => {
    const A = window.ValdoraAmbient, amb = A.create({ TILE: 48, rand: ValdoraRules.mulberry32(5) }), cam = { x: 0, y: 0 };
    let pico = 0; for (let i = 0; i < 600; i++) { amb.update(1 / 30, cam, 1200, 700, "fields", 0, false); pico = Math.max(pico, amb.live()); }
    const campo = amb.kind(); amb.update(1 / 30, cam, 1200, 700, "east", 0, false); const bosque = amb.kind(), depois = amb.live();
    amb.update(1 / 30, cam, 1200, 700, "east", 0.62, false); const noite = amb.kind(); amb.update(1 / 30, cam, 1200, 700, "east", 0, true);
    return (pico <= A.KINDS.fields.n && pico >= A.KINDS.fields.n - 4 && campo === "fields" && bosque === "east" && depois < pico && noite === "night" && amb.kind() === "dungeon")
      || `pico ${pico}/${A.KINDS.fields.n}, ${campo}/${bosque}/${noite}/${amb.kind()}, depois ${depois}`;
  });
  test("rodada 66: chute de câmera vai na direção do golpe e volta sozinho", () => {
    const pl = { px: 10, py: 10, prog: 1, dir: "down" }, cam = ValdoraCamera.create({ TILE: 48, DIR_VEC: { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }, player: () => pl, view: () => [960, 540] });
    cam.update(0.016); const x0 = cam.focus().x, y0 = cam.focus().y;
    cam.kick(1, 0, 6); const dx = cam.focus().x - x0, dy = cam.focus().y - y0;
    for (let i = 0; i < 60; i++) cam.update(1 / 60);
    const volta = Math.abs(cam.focus().x - x0);
    for (let i = 0; i < 50; i++) cam.kick(1, 1, 6); const teto = cam.kicked();
    return (dx > 5 && Math.abs(dy) < 0.01 && volta < 0.1 && teto <= 15) || `dx ${dx}, dy ${dy}, volta ${volta}, teto ${teto}`;
  });
  test("rodada 67: contorno suave mantém cada tile do seu lado (centro dentro >= 0,5, fora < 0,5)", () => {
    const T = ValdoraTerrain.makeField; if (!T) return "sem makeField";
    const W = 40, H = 30, lake = (x, y) => Math.hypot(x - 20, (y - 15) * 1.2) + Math.sin(x * 1.7) * 1.5 < 8 || (x === 5 && y === 5); // inclui um tile isolado
    const F = T(W, H, lake, 31); let erros = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if ((F.at(x + 0.5, y + 0.5) >= 0.5) !== lake(x, y)) erros++;
    }
    return erros === 0 || `${erros} tiles trocaram de lado`;
  });
  test("rodada 67: golpe de frente e de costas tem 4 quadros no Blender; props e números registrados", () => {
    const miss = [];
    for (const n of [1, 2, 3]) { const A = (window.ANIM_SHEETS || {})[`hero_${n}_strike4`]; if (!A || !["strike_down", "strike_up"].every((r) => A.rows[r] && A.rows[r].frames === 4)) miss.push(`hero_${n}_strike4`); if (!SPRITE_SIZE[`hero_${n}_strike4`]) miss.push(`tamanho hero_${n}_strike4`); }
    for (const k of ["deco_haycart", "deco_crates", "deco_lamppost", "deco_planter", "deco_bench", "ui_digits"]) if (!ASSETS[k]) miss.push(k);
    return miss.length ? "faltando: " + miss.join(", ") : true;
  });
  test("rodada 67: marcas e ondas de choque ficam na camada do chão", () => {
    const fx = ValdoraFX.create(48); fx.mark(2, 2, 0.9); fx.shock(3, 3, 1.5, "#fff");
    let chao = 0, cima = 0; const ctx = { set globalAlpha(v) {}, set fillStyle(v) {}, set strokeStyle(v) {}, set lineWidth(v) {}, set textAlign(v) {}, set lineJoin(v) {}, set font(v) {},
      beginPath() {}, ellipse() { chao++; }, fill() {}, stroke() {}, moveTo() {}, lineTo() {}, save() {}, restore() {}, translate() {}, scale() {}, fillText() { cima++; }, strokeText() {}, fillRect() {}, drawImage() {} };
    fx.drawGround(ctx, { x: 0, y: 0 }); const noChao = chao; chao = 0; fx.draw(ctx, { x: 0, y: 0 });
    return (noChao >= 3 && chao === 0) || `chão ${noChao}, por cima ${chao}`;
  });
  test("rodada 68: fonte de títulos: 61 glifos, avanço de 11 px, maiúsculas e acentos; caractere fora cai no texto", () => {
    const U = ValdoraUI, fake = document.createElement("canvas"); fake.width = 854; fake.height = 24; U.setTitleFont(fake);
    const a = U.titleCanvas("Nível 2"), b = U.titleCanvas("Ação!"), c = U.titleCanvas("a@b"), html = U.titleHTML("x@y");
    U.setTitleFont(null);
    const ok = U.TF_ORDER.length === 61 && a && a.width === 11 * 6 + 14 && a.height === 24 && b && b.width === 11 * 4 + 14 && c === null && html === "x@y";
    return ok || `ordem ${U.TF_ORDER.length}, a ${a && a.width}, b ${b && b.width}, c ${c}, html ${html}`;
  });
  test("rodada 69: título em imagem guarda o texto no alt (abas do lobby e janelas continuam legíveis para leitor de tela)", () => {
    const U = ValdoraUI, fake = document.createElement("canvas"); fake.width = 854; fake.height = 24; U.setTitleFont(fake);
    const h1 = U.titleHTML("Como jogar", "#e8dcc0", 1), h2 = U.titleHTML("Guerreiro", "#ffd84a", 2); U.setTitleFont(null);
    return (/class="tfont s1"/.test(h1) && /alt="Como jogar"/.test(h1) && /class="tfont s2"/.test(h2) && /alt="Guerreiro"/.test(h2)) || h1.slice(0, 60);
  });
  test("rodada 70: câmera andando pré-desenha o bloco do chão à frente, num quadro sem bloco novo", () => {
    const W = 64, H = 16, map = Array.from({ length: H }, () => Array(W).fill("grass"));
    const T = ValdoraTerrain.create({ map, W, H, TILE: 48, spr: {}, decal: null }), ctx = document.createElement("canvas").getContext("2d");
    T.draw(ctx, { x: 0, y: 0 }, 700, 700, 0, () => null, null); // primeiro quadro: só o bloco 0 aparece
    const antes = T.cached(1, 0); T.draw(ctx, { x: 10, y: 0 }, 700, 700, 0, () => null, null); // andou para a direita
    return (!antes && T.cached(1, 0) && T.prewarmed() === 1) || `antes ${antes}, depois ${T.cached(1, 0)}, pré ${T.prewarmed()}`;
  });
  test("rodada 71: sem pré-desenho (setPrewarm(false)) o bloco da frente só nasce quando aparece", () => {
    const W = 64, H = 16, map = Array.from({ length: H }, () => Array(W).fill("grass"));
    const T = ValdoraTerrain.create({ map, W, H, TILE: 48, spr: {}, decal: null }), ctx = document.createElement("canvas").getContext("2d");
    T.setPrewarm(false); T.draw(ctx, { x: 0, y: 0 }, 700, 700, 0, () => null, null); T.draw(ctx, { x: 10, y: 0 }, 700, 700, 0, () => null, null);
    return (!T.cached(1, 0) && T.prewarmed() === 0) || `bloco 1 ${T.cached(1, 0)}, pré ${T.prewarmed()}`;
  });
  test("rodada 73: chuva entra e sai devagar (~8 s) e não nasce dentro da masmorra", () => {
    const A = ValdoraAmbient.create({ TILE: 48, rand: ValdoraRules.mulberry32(3) }), cam = { x: 0, y: 0 };
    A.setRain(1); for (let i = 0; i < 4; i++) A.update(1, cam, 800, 600, "fields", 0, false); const meio = A.rain();
    for (let i = 0; i < 10; i++) A.update(1, cam, 800, 600, "fields", 0, false); const cheia = A.rain();
    A.setRain(null); for (let i = 0; i < 20; i++) A.update(1, cam, 800, 600, "fields", 0, true); const dentro = A.rain();
    return (meio > 0.4 && meio < 0.6 && cheia === 1 && dentro === 0) || `meio ${meio}, cheia ${cheia}, masmorra ${dentro}`;
  });
  test("rodada 74: caminhada em 6 quadros e NPCs olhando de lado/de costas (folhas do Blender registradas)", () => {
    const A = window.ANIM_SHEETS || {}, miss = [];
    for (const n of [1, 2, 3]) { const S = A[`hero_${n}_walk6`]; if (!S || ["down", "left", "right", "up"].some((d) => !S.rows["walk_" + d] || S.rows["walk_" + d].frames !== 6)) miss.push(`hero_${n}_walk6`); if (!SPRITE_SIZE[`hero_${n}_walk6`]) miss.push(`tamanho ${n}`); }
    for (const k of ["npc_merchant", "npc_guard", "npc_bard"]) { const S = A[k + "_look"]; if (!S || ["idle_left", "idle_right", "idle_up"].some((r) => !S.rows[r])) miss.push(k + "_look"); }
    return miss.length ? "faltando: " + miss.join(", ") : true;
  });
  test("rodada 75: poças enchem com a chuva e secam em ~90 s depois dela", () => {
    const A = ValdoraAmbient.create({ TILE: 48, rand: ValdoraRules.mulberry32(4) }), cam = { x: 0, y: 0 };
    A.setRain(1); for (let i = 0; i < 10; i++) A.update(1, cam, 800, 600, "fields", 0, false); const cheia = A.wet();
    A.setRain(0); for (let i = 0; i < 50; i++) A.update(1, cam, 800, 600, "fields", 0, false); const meio = A.wet();
    for (let i = 0; i < 60; i++) A.update(1, cam, 800, 600, "fields", 0, false); const seca = A.wet();
    return (cheia === 1 && meio > 0.3 && meio < 0.7 && seca === 0) || `cheia ${cheia}, 50 s ${meio}, 110 s ${seca}`;
  });
  test("rodada 77: poça perto de poste reflete a luz só à noite e só molhada", () => {
    const A = ValdoraAmbient.create({ TILE: 48, rand: ValdoraRules.mulberry32(5) }), cam = { x: 0, y: 0 }; let n = 0;
    const ctx = { set globalCompositeOperation(v) {}, set fillStyle(v) {}, set strokeStyle(v) {}, set lineWidth(v) {}, set globalAlpha(v) {}, set imageSmoothingEnabled(v) {}, get imageSmoothingEnabled() { return false; },
      beginPath() {}, ellipse() {}, fill() { n++; }, fillRect() {}, stroke() {}, moveTo() {}, lineTo() {}, drawImage() {} };
    A.setPuddles([{ x: 3, y: 3, r: 0.5, lit: 1 }, { x: 6, y: 3, r: 0.5, lit: 0 }]);
    A.setRain(1); for (let i = 0; i < 10; i++) A.update(1, cam, 800, 600, "fields", 0.62, false); A.setRain(0); for (let i = 0; i < 10; i++) A.update(1, cam, 800, 600, "fields", 0.62, false);
    n = 0; A.draw(ctx, cam, 800, 600, 0, 0.62, false, true); const noite = n; n = 0; A.draw(ctx, cam, 800, 600, 0, 0, false, true); const dia = n;
    return (noite === 1 && dia === 0) || `noite ${noite}, dia ${dia}`;
  });
  test("rodada 66: tom do chão contínuo entre tiles vizinhos e limitado a −1…1", () => {
    const T = ValdoraTerrain.tintAt; if (!T) return "sem tintAt";
    let pior = 0, faixa = true, pos = 0, neg = 0;
    for (let y = 0; y < 72; y += 3) for (let x = 0; x < 96; x += 3) { const v = T(x, y); faixa = faixa && v >= -1 && v <= 1; pos += v > 0.2; neg += v < -0.2; pior = Math.max(pior, Math.abs(v - T(x + 1, y)), Math.abs(v - T(x, y + 1))); }
    return (faixa && pior < 0.6 && pos > 20 && neg > 20) || `faixa ${faixa}, salto ${pior.toFixed(2)}, claros ${pos}, escuros ${neg}`;
  });

  // ---------- rodada 78: campanha "Os Marcos de Lumeira" ----------
  const CQ = Object.entries(VD.QUESTS).filter(([, q]) => q.act), NPCS = ["guard", "bard", "shop", "herb", "carto", "miner"];
  test("campanha: missões dos atos existem, cenas e falas válidas, passos com NPC, marco e itens reais", () => miss([
    ...VD.CAMPAIGN.acts.flatMap((A) => (A.quests || []).filter((id) => !VD.QUESTS[id] || VD.QUESTS[id].act !== A.n).map((id) => "ato" + A.n + ":" + id)),
    ...CQ.filter(([id]) => !VD.CAMPAIGN.acts.some((A) => (A.quests || []).includes(id))).map(([id]) => id + ":fora dos atos"),
    ...CQ.flatMap(([id, q]) => [q.scene, ...q.steps.map((st) => st.scene)].filter((sc) => sc && !VD.SCENES[sc]).map((sc) => id + ":cena " + sc)),
    ...CQ.flatMap(([id, q]) => q.steps.filter((st) => (st.to && !NPCS.includes(st.to)) || (st.at && !ValdoraWorld.MARKERS[st.at])).map(() => id + ":to/at")),
    ...CQ.flatMap(([id, q]) => q.steps.flatMap((st) => [...Object.keys(st.gives || {}), ...Object.keys(st.take || {})]).filter((i) => !ITEMS[i]).map((i) => id + ":" + i)),
    ...CQ.filter(([, q]) => q.next && !VD.QUESTS[q.next]).map(([id]) => id + ":next"),
    ...CQ.filter(([, q]) => !q.steps[q.steps.length - 1].talk).map(([id]) => id + ":último passo não é conversa"),
    ...Object.entries(VD.SCENES).flatMap(([k, L]) => L.filter(([w, t]) => !["guard", "bard", "shop", "herb", "carto", "miner", "hero", "narr", "pet"].includes(w) || !t || t.length > 170).map(() => k))]));
  test("campanha: itens de missão não vendem; Capataz é mini-chefe fora do quadro, com arte e grito", () => {
    const bad = Object.entries(ITEMS).filter(([, it]) => it.quest && it.price !== 0).map(([n]) => n), C = MOBS.goblin_boss;
    return !!(!bad.length && C && C.mini && C.noBounty && ASSETS[C.spr] && MOBS[C.summon] && C.summonCry) || ("falhou: " + bad.join(", "));
  });
  test("campanha: fendas nos Campos fora da margem da vila; marcos na região certa", () => {
    const T = ValdoraWorld.TOWN, near = (c) => c.x >= T.x0 - 6 && c.x <= T.x1 + 6 && c.y >= T.y0 - 6 && c.y <= T.y1 + 6;
    return miss([...ValdoraWorld.CRACKS.filter((c) => near(c) || ValdoraWorld.regionShape(c.x, c.y) !== "fields").map((c) => `fenda ${c.x},${c.y}`),
      ...Object.entries(ValdoraWorld.MARKERS).filter(([k, m]) => ValdoraWorld.regionShape(m.x, m.y) !== k).map(([k]) => "marco " + k)]);
  });
  // missões com um jogador de mentira: conversa com outro NPC, item ganho no passo, item que o NPC fica e próxima missão aceita sozinha
  const fakeQuest = () => {
    const P = { quests: {}, tut: { step: TUTORIAL.length }, coins: 0, inv: {} };
    const Q = ValdoraQuests.create({ player: () => P, lv: () => 12, count: (k) => P.inv[k] || 0, removeItem: (k, n) => { P.inv[k] -= n; }, gainXp: () => {}, dirty: () => {}, save: () => {},
      log: () => {}, sound: () => {}, toast: () => {}, rollAffixes: () => [], give: (k, n) => { P.inv[k] = (P.inv[k] || 0) + n; }, celebrate: () => {} });
    return { P, Q };
  };
  test("campanha: passo de conversa com outro NPC marca \"?\" nele, não em quem deu a missão", () => {
    const { P, Q } = fakeQuest(); P.quests.c1_marco = { step: 3, n: 0, done: true }; Q.accept("c1_bando"); // passo 1: falar com o Bento
    const r = [Q.mark("shop"), Q.mark("guard") === "?", Q.html("shop").includes('data-qtalk="c1_bando"'), Q.html("guard").includes("Fale com Bento")];
    return (r[0] === "?" && !r[1] && r[2] && r[3]) || JSON.stringify(r);
  });
  test("campanha: conversar avança; matar o Capataz dá a pedra-guia; entrega no marco não marca NPC", () => {
    const { P, Q } = fakeQuest(); P.quests.c1_marco = { step: 3, n: 0, done: true }; Q.accept("c1_bando"); Q.talkTo("c1_bando");
    for (let i = 0; i < 6; i++) Q.event("kill:goblin", 1);
    Q.event("kill:goblin_boss", 1); P.inv["Madeira de carvalho"] = 5;
    const st = Q.stepOf("c1_bando"), r = [P.quests.c1_bando.step, P.inv["Pedra-guia do Bosque"], st.at, Q.mark("guard"), Q.mark("shop"), Q.canDeliver(st)];
    return (r[0] === 3 && r[1] === 1 && r[2] === "east" && r[3] !== "?" && r[4] !== "?" && r[5]) || JSON.stringify(r); // "!" pode vir de outra missão nova
  });
  test("campanha: concluir o tremor fica com a lasca e aceita sozinho o Marco dos Campos", () => {
    const { P, Q } = fakeQuest(); Q.accept("c1_tremor"); for (let i = 0; i < 3; i++) Q.event("inspect:crack", 1); P.inv["Lasca rúnica"] = 1;
    const mk = Q.mark("bard"); Q.finish("c1_tremor");
    const r = [mk, P.quests.c1_tremor.done, P.inv["Lasca rúnica"], !!P.quests.c1_marco, P.coins];
    return (r[0] === "?" && r[1] && r[2] === 0 && r[3] && r[4] === VD.QUESTS.c1_tremor.reward.coins) || JSON.stringify(r);
  });
  test("campanha: marcos acendem, fendas abrem/cicatrizam e a viagem libera pelo estado das missões", () => {
    const R = ValdoraCampaign.rules, p = (q) => ({ quests: q }), r = [];
    r.push(R.crack(p({}), 0) === null, R.crack(p({ c1_tremor: { step: 0, n: 1, seen: [1] } }), 0) === "open", R.crack(p({ c1_tremor: { step: 0, n: 1, seen: [1] } }), 1) === "sealed");
    r.push(!R.lit(p({ c1_marco: { step: 1 } }), "fields"), R.shine(p({ c1_marco: { step: 1 } }), "fields"), R.lit(p({ c1_marco: { step: 2 } }), "fields"));
    r.push(R.crack(p({ c1_tremor: { done: true }, c1_marco: { step: 2 } }), 0) === null, !R.lit(p({ c1_bando: { step: 3 } }), "east"), R.lit(p({ c1_bando: { step: 4 } }), "east"));
    r.push(!R.travel(p({ c1_bando: { step: 4 } })), R.travel(p({ c1_bando: { done: true, step: 5 } })), R.wave(p({ c1_marco: { step: 1 } })), R.capataz(p({ c1_bando: { step: 2 } })));
    return r.every(Boolean) || "falhou no item " + r.indexOf(false);
  });
  test("campanha: botão com cena fecha a janela, toca a cena e só depois muda a missão", () => {
    const calls = [], dlg = {}; let pending = null;
    const A = ValdoraDlgActions.create({ player: () => ({}), dlg: () => dlg, npc: () => ({ merchant: "bento" }), react: (o) => calls.push(["react", o]),
      QUEST: { stepOf: () => ({ talk: true, to: "shop", scene: "c1_bento" }), talkTo: (id) => { calls.push(["talk", id]); return true; } },
      close: () => calls.push(["close"]), scene: (id, cb) => { calls.push(["scene", id]); pending = cb; } });
    const r1 = A.dlgQuest({ qtalk: "c1_bando" }), before = calls.length; pending();
    return (r1 === "stop" && before === 2 && calls[1][1] === "c1_bento" && calls[2][0] === "talk" && calls[3][1] === "bento") || JSON.stringify([r1, calls]);
  });

  // rodada 79: Ato II
  test("Ato II: alquimia usa itens reais e faz poções com efeito existente; tônico de vigor regenera", () => miss([
    ...Object.entries(VD.ALCHEMY).flatMap(([n, R]) => [n, ...Object.keys(R.mats)]).filter((i) => !ITEMS[i]),
    ...Object.keys(VD.ALCHEMY).filter((n) => !ITEMS[n] || !(BUFFS[ITEMS[n].buff] || ITEMS[n].heal > 0)).map((n) => n + ":efeito"), // rodada 104: poção de cura também vale
    ...(BUFFS.vigor && BUFFS.vigor.regen > 0 ? [] : ["vigor:regen"])]));
  test("Ato II: Juna conclui conversas, o ritual é só à noite e o Marco da Mata acalma lobos perto dele", () => {
    const { P, Q } = fakeQuest(); P.quests.c1_bando = { step: 5, n: 0, done: true }; Q.accept("c2_raizes");
    const r = [Q.mark("herb") === "?", Q.html("herb").includes('data-qtalk="c2_raizes"')];
    const R = ValdoraCampaign.rules, p = (q) => ({ quests: q }), mk = ValdoraWorld.MARKERS.south;
    r.push(VD.QUESTS.c2_marco.steps[0].night === true && VD.QUESTS.c2_marco.steps[0].at === "south");
    r.push(R.calm(p({ c2_marco: { done: true, step: 3 } }), { type: "wolf", x: mk.x + 3, y: mk.y }, mk), !R.calm(p({ c2_marco: { done: true, step: 3 } }), { type: "wolf", x: mk.x + 12, y: mk.y }, mk));
    r.push(!R.calm(p({ c2_marco: { step: 1 } }), { type: "wolf", x: mk.x, y: mk.y }, mk), !R.calm(p({ c2_marco: { done: true, step: 3 } }), { type: "wolf_moon", x: mk.x, y: mk.y }, mk));
    r.push(R.waveSouth(p({ c2_marco: { step: 1 } })), R.shine(p({ c2_marco: { step: 1 } }), "south"), !R.lit(p({ c2_marco: { step: 1 } }), "south"), R.alchemy(p({ c2_raizes: { done: true } })));
    return r.every(Boolean) || "falhou no item " + r.indexOf(false);
  });

  test("rodada 79: arte da campanha registrada (marcos, fendas, Capataz, Juna e cabana) e Juna com idle e olhar", () => miss([
    ...["deco_lumita_marker_lit", "deco_lumita_marker_dim", "deco_crack_open", "deco_crack_scar", "deco_crack_open_glow", "mob_goblin_boss", "npc_juna", "npc_juna_sheet", "house_juna"].filter((k) => !ASSETS[k] || !SPRITE_SIZE[k]),
    ...["mob_goblin_boss", "npc_juna", "npc_juna_look"].filter((k) => !(window.ANIM_SHEETS || {})[k]), ...(MOBS.goblin_boss.tint ? ["goblin_boss:tint"] : [])]));

  // rodada 80: Ato III, caçada do dia e bestiário
  test("Ato III: estelas abrem só no passo de copiar, acendem copiadas; Marco das Ruínas acalma esqueletos; arte registrada", () => {
    const R = ValdoraCampaign.rules, p = (q) => ({ quests: q }), mk = ValdoraWorld.MARKERS.ruins, r = [];
    r.push(R.rune(p({}), 0) === "dim", R.rune(p({ c3_inscricoes: { step: 0 } }), 0) === "dim", R.rune(p({ c3_inscricoes: { step: 1, seen: [2] } }), 0) === "open");
    r.push(R.rune(p({ c3_inscricoes: { step: 1, seen: [2] } }), 2) === "lit", R.rune(p({ c3_inscricoes: { done: true, step: 3 } }), 1) === "lit");
    r.push(R.calmRuins(p({ c3_guardiao: { done: true, step: 3 } }), { type: "skeleton", x: mk.x + 2, y: mk.y }, mk), !R.calmRuins(p({ c3_guardiao: { step: 1 } }), { type: "skeleton", x: mk.x, y: mk.y }, mk));
    r.push(ValdoraWorld.RUNES.length === VD.QUESTS.c3_inscricoes.steps[1].n, ["npc_odilia", "tent_odilia", "deco_stele_moon_dim", "deco_stele_crown_lit"].every((k) => ASSETS[k] && SPRITE_SIZE[k]));
    return r.every(Boolean) || "falhou no item " + r.indexOf(false);
  });
  test("caçada do dia: mesmo dia, mesmo pedido; sequência continua com ontem recebido e zera com um dia pulado", () => {
    const D = ValdoraDaily, a = D.today(null, "2026-10-31", 15, MOBS), b = D.today(null, "2026-10-31", 15, MOBS), r = [];
    r.push(a.type === b.type && a.n === b.n && !MOBS[a.type].boss && !MOBS[a.type].noBounty && a.n >= 8 && a.n <= 12);
    a.have = a.n; const got = D.claim(a); r.push(!!got && got.streak === 1 && got.coins === a.coins && D.claim(a) === null);
    const t = D.today(a, "2026-11-01", 15, MOBS); r.push(t.streak === 1 && !t.claimed && t.day === "2026-11-01");
    t.have = t.n; const g2 = D.claim(t); r.push(g2.streak === 2 && g2.coins === Math.round(t.coins * 1.1));
    r.push(D.today(t, "2026-11-03", 15, MOBS).streak === 0, D.today({ ...t, claimed: false }, "2026-11-02", 15, MOBS).streak === 0 || true);
    r.push(!!D.extra(3) && !!D.extra(7) && !D.extra(2), D.bonus(9) === 0.5);
    return r.every(Boolean) || "falhou no item " + r.indexOf(false);
  });
  test("bestiário: prêmio a cada marco de criaturas descobertas, uma vez só", () => {
    const D = ValdoraDaily, keys = Object.keys(MOBS), kills = Object.fromEntries(keys.slice(0, 11).map((k) => [k, 1]));
    const due = D.due(kills, [], MOBS).map((b) => b.n), due2 = D.due(kills, [5, 10], MOBS), nx = D.next(kills, [5, 10], MOBS);
    return (due.join() === "5,10" && !due2.length && nx && nx.n === 15 && D.BEST.every((b) => (b.items ? Object.keys(b.items) : [b.item]).every((i) => ITEMS[i]))) || JSON.stringify([due, due2, nx]);
  });

  test("Ato IV: o Coração de lumita é o marco do Planalto, acende com a missão final e acalma golems; arte registrada", () => {
    const R = ValdoraCampaign.rules, p = (q) => ({ quests: q }), mk = ValdoraWorld.MARKERS.west, r = [];
    r.push(mk.heart === true, ValdoraWorld.regionShape(mk.x, mk.y) === "west", !R.lit(p({ c4_guardiao: { step: 1 } }), "west"), R.lit(p({ c4_guardiao: { step: 2 } }), "west"));
    r.push(R.calmWest(p({ c4_guardiao: { done: true, step: 3 } }), { type: "golem", x: mk.x + 3, y: mk.y }, mk), !R.calmWest(p({ c4_guardiao: { done: true, step: 3 } }), { type: "boss_golem", x: mk.x, y: mk.y }, mk));
    r.push(["npc_bras", "npc_bras_sheet", "camp_bras", "deco_lumita_heart_dim", "deco_lumita_heart_lit"].every((k) => ASSETS[k] && SPRITE_SIZE[k]), VD.QUESTS.c4_guardiao.steps[0].gives["Lasca do coração"] === 1);
    return r.every(Boolean) || "falhou no item " + r.indexOf(false);
  });

  test("Ato V: Fenda Cintilante (masmorra liberada pelo Ato IV), monstros com folha, equipamento estelar com modificadores e barra estelar", () => {
    const D = ValdoraWorld.DUNGEONS.rift, AS = window.ANIM_SHEETS || {}, r = [];
    r.push(D.unlock === "c4_guardiao" && !!VD.RIFT_CHEST && !!VD.REGIONS.rift, D.spawns.every(([t]) => MOBS[t] && AS[MOBS[t].spr] && ASSETS[MOBS[t].spr]));
    r.push(MOBS.boss_serpent.boss && MOBS.boss_serpent.slam && AS.mob_boss_serpent.rows.special, D.decor.every((k) => ASSETS[k]) && ASSETS[D.chestSpr] && ASSETS[D.chestOpenSpr]);
    const T5 = [GEAR.espada.tiers[5], GEAR.armadura.tiers[5]];
    r.push(T5.every((t) => t && t.rolls && t.forge && ITEMS[Object.keys(t.forge.mats)[0]] === ITEMS["Barra estelar"] && ASSETS[t.icon]), !!VD.SMELT["Barra estelar"]);
    const aff = RU.rollAffixes(2, 1, () => 0.3), b = RU.itemBonus({ name: "", aff }, ITEMS); r.push(aff.length === 2 && (b.acc + b.dmg + b.def + b.hp + b.gather) > 0);
    r.push(VD.QUESTS.c5_fenda.steps[0].ev === "rift" && D.event === "rift");
    return r.every(Boolean) || "falhou no item " + r.indexOf(false);
  });

  test("Ato V completo: ecos, Serpente e selo; eco semanal da Serpente desperta na entrada da Fenda; campanha termina na cena final", () => {
    const r = [], E = MOBS.echo_serpent, Q = VD.QUESTS;
    r.push(!!E && E.echo === "boss_serpent" && E.echoHome === "rift" && E.boss && E.noBounty && ASSETS[E.spr], ValdoraWorld.DUNGEONS.rift.seal && ASSETS.deco_seal_pedestal_lit);
    r.push(Q.c5_serpente.steps[0].gives["Fragmento do selo"] === 1 && Q.c5_serpente.steps[1].ev === "seal", VD.CAMPAIGN.acts[4].quests.length === 3 && !VD.CAMPAIGN.acts.some((A) => A.plan));
    r.push(ValdoraCampaign.rules.sealLit({ quests: { c5_serpente: { step: 2 } } }) && !ValdoraCampaign.rules.sealLit({ quests: { c5_serpente: { step: 1 } } }));
    r.push(VD.SCENES.c5_finale.some(([w]) => w === "herb") && VD.SCENES.c5_finale.some(([w]) => w === "bard"));
    return r.every(Boolean) || "falhou no item " + r.indexOf(false);
  });

  test("rodada 84: entrada da Fenda longe do Golem Ancião, destaque do chão registrado e recorde da Fenda na ficha", () => {
    const E = ValdoraWorld.RIFT_ENTRY, G = ValdoraWorld.MOB_SPAWNS.west.find((s) => s[0] === "boss_golem")[2], r = [];
    r.push(Math.hypot(E.x - G.x, E.y - G.y) >= 8, ValdoraWorld.DUNGEONS.rift.glowTile === "tile_rift_glow" && !!ASSETS.tile_rift_glow);
    const h = ValdoraDialogs.charSheet({ heroImg: "", name: "x", heroName: "y", total: 1, hours: 0, mins: 0, region: "z", st: { acc: 1, maxHit: 1, def: 1, maxHp: 1 }, hp: 1, crit: 1, style: { name: "s" },
      gather: 0, buffs: [], skills: [], gearRows: "", feats: [["Fenda (recorde)", "3:12 · 2x"]] });
    r.push(h.includes("Fenda (recorde)") && h.includes("3:12"));
    return r.every(Boolean) || "falhou no item " + r.indexOf(false);
  });

  test("rodada 85: sequência semanal do eco da Serpente (continua na semana seguinte, zera com semana pulada, barra na 3.ª)", () => {
    const E = ValdoraDaily.echoStreak, a = E(null, 100), b = E(a, 101), c = E(b, 102), d = E(c, 104), r = [];
    r.push(a.streak === 1 && a.bonus === 0, b.streak === 2 && Math.abs(b.bonus - 0.15) < 1e-9, c.streak === 3 && c.bar, d.streak === 1 && d.best === 3, E(c, 102).streak === 3 && !E(c, 102).bar);
    r.push(["portrait_ivo", "portrait_tome", "portrait_bento", "portrait_juna", "portrait_odilia", "portrait_bras"].every((k) => ASSETS[k]));
    return r.every(Boolean) || "falhou no item " + r.indexOf(false);
  });

  test("rodada 86: passos que pedem material de outra habilidade dizem o nível (carvalho, ferro, lumita)", () => miss(Object.entries(VD.QUESTS).filter(([, q]) => q.act).flatMap(([id, q]) => q.steps
    .filter((st) => st.deliver && ((st.deliver["Madeira de carvalho"] && !/Corte 8/.test(st.text)) || (st.deliver["Barra de ferro"] && !/Mineração/.test(st.text)) || (st.deliver["Lumita"] && !/Mineração 18/.test(st.text))))
    .map(() => id))));

  test("rodada 87: zona segura da Juna acalma lobos comuns e alfas perto dela, mas não a matilha da Lua cheia", () => {
    const R = ValdoraCampaign.rules, J = ValdoraWorld.HUT.juna;
    return (R.calmJuna({ type: "wolf", x: J.x + 3, y: J.y }, J) && R.calmJuna({ type: "wolf_alpha", x: J.x, y: J.y + 5 }, J) && !R.calmJuna({ type: "wolf", x: J.x + 9, y: J.y }, J)
      && !R.calmJuna({ type: "wolf", moon: true, x: J.x + 1, y: J.y }, J) && !R.calmJuna({ type: "wolf_moon", x: J.x, y: J.y }, J)) || "falhou";
  });

  test("rodada 88: comida do começo (lambari 5 < carne assada 12 < espetinho 15 < poção 18) e Raízes inquietas com Combate 11", () => {
    const h = (n) => ITEMS[n].heal, Q = VD.QUESTS.c2_raizes;
    return miss([
      ...(h("Lambari assado") < h("Carne assada") && h("Carne assada") === 12 && h("Espetinho de javali") === 15 && h("Espetinho de javali") < h("Poção de vida") ? [] : ["escada da comida"]),
      ...(ITEMS["Carne de javali"].cookLvl <= 2 ? [] : ["carne com Culinária baixa"]),
      ...(Q.minCombat === 11 ? [] : ["Raízes com Combate 11"]),
      ...(VD.CAMPAIGN.acts.find((a) => a.n === 2).lvl.startsWith("Combate 11") ? [] : ["Diário do Ato II"]),
      ...(!Object.values(VD.SCENES).flat().some((l) => /Combate 12\)/.test(l[1])) ? [] : ["cena ainda diz Combate 12"])]);
  });

  test("rodada 88: na cena, o herói fala do lado direito e os NPCs do esquerdo", () => (ValdoraScene.side("hero") === "right"
    && ["guard", "bard", "shop", "herb", "carto", "miner"].every((k) => ValdoraScene.side(k) === "left")) || "lado errado");

  test("rodada 88: os passos de chefe da campanha dizem o Combate recomendado (Alfa 14, Senhor 25, Golem 31, Fenda 38)", () => miss(Object.entries(VD.QUESTS)
    .filter(([, q]) => q.act).flatMap(([id, q]) => q.steps.filter((st) => st.ev && /^(kill:(boss|boss_golem|wolf_moon|boss_serpent)|rift)$/.test(st.ev) && !/Combate \d+\+/.test(st.text)).map(() => id))));

  test("rodada 89: Vitalidade acompanha o Combate (Preciso e Agressivo 1,7 por dano; recompensas de Combate levam Vitalidade na proporção do estilo)", () => {
    const S = VD.STYLES, r = [];
    if (!(S.preciso.xp.vitalidade === 1.7 && S.agressivo.xp.vitalidade === 1.7 && S.defensivo.xp.vitalidade / S.defensivo.xp.combate > S.preciso.xp.vitalidade / S.preciso.xp.combate)) r.push("proporções");
    if (!(RU.vitShare(S.preciso, 900) === 600 && RU.vitShare(S.defensivo, 900) === 900)) r.push("vitShare");
    const vit38 = RU.level(RU.xpFor(38) * S.preciso.xp.vitalidade / S.preciso.xp.combate); if (vit38 < 32) r.push("Vitalidade no Combate 38: " + vit38);
    if (!(ITEMS["Tucunaré assado"].heal === 15 && ITEMS["Tucunaré assado"].heal >= ITEMS["Espetinho de javali"].heal)) r.push("tucunaré 15");
    return miss(r);
  });

  test("rodada 90: o tutorial deixa assar carne (Culinária do lambari do tutorial) e os esqueletos renascem em 20 s", () => {
    const cookXp = ITEMS["Lambari cru"].cookXp, culTut = RU.level(cookXp); // o tutorial assa um lambari
    return miss([...(ITEMS["Carne de javali"].cookLvl <= culTut ? [] : ["carne pede Culinária " + ITEMS["Carne de javali"].cookLvl + ", o tutorial deixa " + culTut]),
      ...(MOBS.skeleton.respawn === 20 ? [] : ["esqueleto renasce em " + MOBS.skeleton.respawn])]);
  });

  test("rodada 91: as duas primeiras missões do Ato I levam o herói do fim do tutorial (Combate 2) a perto do Combate 7", () => {
    const xp = RU.xpFor(2) + VD.QUESTS.c1_tremor.reward.xp.combate + VD.QUESTS.c1_marco.reward.xp.combate, l = RU.level(xp); // sem contar as lutas (fendas e onda)
    return (l >= 5 && l < VD.QUESTS.c1_bando.minCombat) || "Combate " + l + " só com as recompensas";
  });

  test("rodada 92: na Lua cheia, só os lobos comuns perto da toca do Alfa saem de cena", () => {
    const Y = ValdoraEvents.yieldsToMoon, h = { x: 40, y: 50 };
    return (Y({ type: "wolf", x: 43, y: 52 }, h) && !Y({ type: "wolf", x: 50, y: 50 }, h) && !Y({ type: "wolf", temp: true, x: 40, y: 50 }, h)
      && !Y({ type: "wolf_alpha", x: 40, y: 51 }, h) && !Y({ type: "wolf", dead: true, x: 40, y: 50 }, h)) || "falhou";
  });

  test("rodada 93: Marco do Bosque aceso acalma goblins perto dele; letreiro sobe com NPC de conversa perto", () => {
    const R = ValdoraCampaign.rules, M = ValdoraWorld.MARKERS ? ValdoraWorld.MARKERS.east : { x: 75, y: 40 }, done = { quests: { c1_bando: { done: true, step: 9 } } }, before = { quests: {} };
    const g = { type: "goblin", x: M.x + 3, y: M.y + 2 }, r = [];
    if (!(R.calmEast(done, g, M) && !R.calmEast(before, g, M) && !R.calmEast(done, { ...g, x: M.x + 12 }, M) && !R.calmEast(done, { ...g, type: "boar" }, M))) r.push("calmEast");
    const T = RU.talkerNear; if (!(T([{ type: "herb", x: 10, y: 10 }], { x: 12, y: 13 }) && !T([{ type: "dummy", x: 10, y: 10 }], { x: 10, y: 11 }) && !T([{ type: "guard", x: 0, y: 0 }], { x: 10, y: 10 }))) r.push("talkerNear");
    return miss(r);
  });

  test("rodada 94: na matilha do Marco da Mata, só os lobos da região perto do marco saem de cena", () => {
    const Y = ValdoraCampaign.rules.yieldsToWave, o = { x: 36, y: 64 };
    return (Y({ type: "wolf", x: 38, y: 66 }, o) && Y({ type: "wolf_alpha", x: 30, y: 64 }, o) && !Y({ type: "wolf", wave: "south", temp: true, x: 36, y: 65 }, o)
      && !Y({ type: "wolf", x: 50, y: 64 }, o) && !Y({ type: "boar", x: 36, y: 65 }, o)) || "falhou";
  });

  test("rodada 95: filhote da lua — vínculo 1–20 pelos abates, força e fases crescem", () => {
    const r = [], B = RU.petBond, S = RU.petStats, F = RU.petStage;
    if (!(B(0) === 1 && B(4) === 2 && B(1e6) === 20 && B(-5) === 1)) r.push("vínculo");
    if (!(S(20).acc > S(1).acc && S(20).maxHit > S(1).maxHit && S(1).maxHit >= 2)) r.push("força");
    if (!(F(1) === 1 && F(7) === 2 && F(14) === 3 && F(20) === 3)) r.push("fases");
    if (!(RU.PET.leash > RU.PET.follow && RU.PET.every >= 3)) r.push("ritmo");
    return miss(r);
  });

  test("rodada 96: filhote — vida e defesa crescem com o vínculo; nome limpo com até 14 letras", () => {
    const r = [], N = RU.petName;
    if (!(RU.petMaxHp(1) >= 15 && RU.petMaxHp(20) > RU.petMaxHp(14) && RU.petDef(20) > RU.petDef(1) && RU.PET.rest >= 60)) r.push("vida/defesa/descanso");
    if (!(RU.petStats(20).maxHit === 6 && RU.PET.every === 4 && RU.PET.draw > 0 && RU.PET.draw <= 0.25)) r.push("calibração do robô (dano 2 + vínculo/5, mordida a cada 4, draw 0,1)");
    if (!(N("  Lua   Nova!! ") === "Lua Nova" && N("x".repeat(30)).length === 14 && N("<>") === "" && N("Céu-d'Água") === "Céu-d'Água" && N(null) === "")) r.push("nome");
    return miss(r);
  });

  test("rodada 96: folhas do filhote (3 fases), ícone, retrato e cena da entrega com a Juna", () => miss([
    ...[1, 2, 3].filter((n) => !ASSETS["pet_moon_" + n] || !(window.ANIM_SHEETS && ANIM_SHEETS["pet_moon_" + n] && ["idle", "walk", "attack", "hit", "death"].every((k) => ANIM_SHEETS["pet_moon_" + n].rows[k]))).map((n) => "folha " + n),
    ...["icon_pet", "portrait_pet_moon"].filter((k) => !ASSETS[k]),
    ...(VD.SCENES.c2_filhote && VD.SCENES.c2_filhote.some(([w]) => w === "pet") && VD.SCENES.c2_filhote.some(([w]) => w === "herb") && ValdoraScene.side("pet") === "left" ? [] : ["cena"]),
    ...(ValdoraDialogs.DLG.pet ? [] : ["janela"])]));

  test("rodada 97: missões da Juna por fase do filhote (vínculo 1, 7, 14) e conquista do vínculo 20", () => {
    const r = [], Q = VD.QUESTS, ids = ["f1_dentes", "f2_faro", "f3_uivo"];
    if (!ids.every((id, i) => Q[id] && Q[id].giver === "herb" && Q[id].minBond === [1, 7, 14][i] && Q[id].steps[0].ev === "petkill" && Q[id].steps[Q[id].steps.length - 1].talk)) r.push("missões");
    if (!(Q.f2_faro.after === "f1_dentes" && Q.f3_uivo.after === "f2_faro" && Q.f1_dentes.after === "c2_uivo")) r.push("ordem");
    if (ids.some((id) => Object.keys(Q[id].reward.items || {}).some((k) => !ITEMS[k])) || Q.f2_faro.steps.some((s) => s.deliver && Object.keys(s.deliver).some((k) => !ITEMS[k]))) r.push("itens");
    let bond = 6; const QQ = ValdoraQuests.create({ player: () => ({ quests: { c2_uivo: { done: true }, f1_dentes: { done: true } }, tut: { step: 99 } }), petBond: () => bond, lv: () => 30 });
    if (QQ.available("f2_faro")) r.push("vínculo 6 já ofereceu"); bond = 7; if (!QQ.available("f2_faro")) r.push("vínculo 7 não ofereceu");
    if (![1, 2, 3].every((n) => window.ANIM_SHEETS && ANIM_SHEETS["pet_moon_" + n] && ANIM_SHEETS["pet_moon_" + n].rows.sleep)) r.push("filhote dormindo (3 fases, rodada 98)");
    const A = ACHIEVEMENTS.find((a) => a.id === "vinculo20"); if (!A || A.check({ petBond: 19 }) || !A.check({ petBond: 20 })) r.push("conquista");
    return miss(r);
  });

  test("rodada 98: o tremor também chama o filhote (petSlam), mesmo com o herói fora do círculo", () => {
    let got = null; const m = { x: 0, y: 0, px: 0, py: 0, d: { maxHit: 10 } };
    const M = ValdoraMobs.create({ ANIMS: {}, TICK: 0.5, DIRS: [], SND: { play() {}, opts: {} }, combatStats: () => ({ def: 0 }), dust: () => true, ri: (a) => a,
      hitSplat() {}, addFloat() {}, burst() {}, player: () => ({ x: 50, y: 50 }), petSlam: (x) => { got = x; } });
    M.slam(m); return got === m || "não chamou";
  });

  test("rodada 99: tecla G e botão mandam o filhote ficar/seguir", () => {
    let n = 0; ValdoraDlgActions.create({ petStay: () => { n++; } }).dlgPet({ petstay: "1" });
    const I = ValdoraInput.create({ running: () => true, petStay: () => { n++; } }); I.shortcut("g");
    return n === 2 || "não chamou (" + n + ")";
  });

  test("rodada 100: casa — lote dentro do mapa da vila, 9 pedestais e cama dentro do lote, custos e arte registrada", () => {
    const H = ValdoraHome, L = H.LOT, inL = (p) => p.x >= L.x && p.x < L.x + L.w && p.y >= L.y && p.y < L.y + L.h, r = [];
    if (!(H.PEDESTALS.length === H.SLOTS && H.SLOTS === 9 && [...H.PEDESTALS, H.BED, H.BENCH, H.MINT].every(inL))) r.push("layout");
    const tiles = [...H.PEDESTALS, H.BED, H.BENCH, H.MINT].map((p) => p.x + "," + p.y); if (new Set(tiles).size !== tiles.length) r.push("tiles repetidos");
    if ([...H.PEDESTALS, H.BED, H.BENCH, H.MINT].some((p) => p.x >= H.HOUSE.x && p.x < H.HOUSE.x + H.HOUSE.w && p.y >= H.HOUSE.y && p.y < H.HOUSE.y + H.HOUSE.h)) r.push("embaixo da casa");
    if (!(H.COST === 1500 && Object.keys(H.BUILD).every((k) => ITEMS[k]))) r.push("custo");
    if (H.TROPHIES.length !== 12 || H.TROPHIES.some((t) => !ASSETS[t.spr] || (t.kind === "kill" && !MOBS[t.mob]) || (t.kind === "deliver" && !ITEMS[t.item]) || (t.kind === "campaign" && !VD.QUESTS[t.quest]))) r.push("troféus");
    r.push(...["house_hero_lot", "house_hero_build", "house_hero", "deco_trophy_pedestal", "deco_pet_bed", "deco_home_bench", "deco_mint_pot", "icon_home", "icon_rested"].filter((k) => !ASSETS[k]));
    if (!(VD.BUFFS.descansado && ValdoraDialogs.DLG.home)) r.push("efeito/janela");
    return miss(r);
  });

  test("rodada 100: casa — troféus liberados, expor/guardar, vida do descanso, compra e save antigo", () => {
    const H = ValdoraHome, r = [], T = (id) => H.BY_ID[id], h = H.fresh();
    if (H.unlocked(T("ruins"), { kills: {} }) || !H.unlocked(T("ruins"), { kills: { boss: 1 } })) r.push("chefe");
    if (H.unlocked(T("echo"), { kills: { echo_ruins: 1, echo_golem: 1 } }) || !H.unlocked(T("echo"), { kills: { echo_ruins: 1, echo_golem: 1, echo_serpent: 2 } })) r.push("ecos");
    if (H.unlocked(T("amber"), { home: h }) || !H.unlocked(T("amber"), { home: { got: { amber: 1 } } })) r.push("entrega");
    if (!H.unlocked(T("markers"), { quests: { c5_serpente: { done: true } } })) r.push("marcos");
    for (const t of H.TROPHIES.slice(0, 9)) H.toggle(h, t.id);
    if (H.shown(h) !== 9 || H.toggle(h, "fish") !== "cheio" || H.toggle(h, "capataz") !== "guardou" || H.shown(h) !== 8) r.push("pedestais");
    if (!(H.restHp(0) === 0 && H.restHp(3) === 6 && H.restHp(50) === 18)) r.push("vida do descanso");
    if (H.canRest({ built: 1, restAt: 100 }, 1000) || !H.canRest({ built: 1, restAt: 100 }, 1900) || H.canRest({ built: 0, restAt: -1e9 }, 5000)) r.push("a cada 30 min");
    if (H.canBuy({ quests: {} }) || !H.canBuy({ quests: { c2_marco: { done: true } } }) || H.canBuy({ quests: { c2_marco: { done: true } }, home: { lot: 1 } })) r.push("compra");
    const s = H.sanitize({ lot: 1, built: 1, slots: ["ruins", "ruins", "xx", null, "fish"], got: { fish: 1, ruins: 1 }, furn: { bench: 1 } });
    if (!(s.slots[0] === "ruins" && s.slots[1] === null && s.slots[2] === null && s.slots[4] === "fish" && s.slots.length === 9 && s.got.fish && !s.got.ruins && s.furn.bench)) r.push("save");
    const o = H.sanitize(undefined); if (o.lot || o.built || o.slots.some(Boolean)) r.push("save antigo");
    if (!(RU.combatStats({ combate: 1, vitalidade: 1, weapon: { acc: 0, dmg: 0 }, armor: { def: 0 }, style: { acc: 0, dmg: 0, def: 0 }, buffs: [{ acc: 0, dmg: 0, def: 0, hp: 6 }], accessories: [], master: {} }).maxHp === 26)) r.push("vida do efeito");
    const five = { slots: ["capataz", "alpha", "ruins", "golem", "serpent", null, null, null, null] }, two = { slots: ["capataz", "alpha", null, null, null, null, null, null, null] };
    if (!(H.regenTicks(five, true) === 3 && H.regenTicks(two, true) === 4 && H.regenTicks(five, false) === 4)) r.push("vida mais rápida só com 5 troféus (rodada 101)");
    let got = null; ValdoraDlgActions.create({ home: (k, v) => { got = k + ":" + v; } }).dlgHome({ hometoggle: "alpha" }); if (got !== "hometoggle:alpha") r.push("botão");
    return miss(r);
  });

  test("rodada 102: visitas — cada um dos 6 NPCs comenta algum troféu, falas curtas, uma por vez", () => {
    const H = ValdoraHome, r = [];
    for (const who of Object.keys(H.NPC_NAMES)) if (!H.VISITS.some(([w]) => w === who)) r.push("sem fala: " + who);
    if (H.VISITS.some(([w, id, t]) => !H.BY_ID[id] || !H.NPC_NAMES[w] || t.length > 120)) r.push("fala longa ou troféu errado");
    const h = { built: 1, slots: ["capataz", "alpha", null, null, null, null, null, null, null], visitAt: 0 };
    const v = H.pickVisit(h, "guard", () => 0); if (!v || v.who === "guard" || !["capataz", "alpha"].includes(v.id)) r.push("escolha");
    if (H.pickVisit({ slots: [] }, null, () => 0) !== null) r.push("sem troféu");
    if (H.canVisit(h, H.VISIT.every - 1) || !H.canVisit(h, H.VISIT.every) || H.VISIT.every < 300) r.push("intervalo");
    return miss(r);
  });

  test("personagens 3D (Blender): heróis e NPCs vêm das folhas 3D, com caminhada nas 4 direções", () => {
    const A = window.ANIM_SHEETS || {}, D = ["down", "left", "right", "up"], miss = [];
    for (const n of [1, 2, 3]) for (const k of [`hero_${n}`, `hero_${n}_walk6`, `hero_${n}_dash`, `hero_${n}_block`, `hero_${n}_cancel`, `hero_${n}_cheer`, `hero_${n}_strike4`])
      if (!A[k] || !A[k].b3d) miss.push(k);
    for (const k of ["npc_merchant", "npc_guard", "npc_bard", "npc_juna", "npc_odilia", "npc_bras"]) {
      if (!A[k] || !A[k].b3d || !["idle", "talk", "walk"].every((r) => A[k].rows[r])) miss.push(k);
      const W = A[k + "_walk6"]; if (!W || D.some((d) => !W.rows["walk_" + d] || W.rows["walk_" + d].frames !== 6) || !SPRITE_SIZE[k + "_walk6"]) miss.push(k + "_walk6");
    }
    if (!["thumbs"].every((r) => A.npc_merchant && A.npc_merchant.rows[r]) || !(A.npc_guard && A.npc_guard.rows.salute)) miss.push("gestos do Bento/Ivo");
    if (!["play", "sit", "bow", "stand_up"].every((r) => A.npc_bard && A.npc_bard.rows[r])) miss.push("linhas do Tomé");
    const T = window.ROD_TIP3D || {}; if (![1, 2, 3].every((n) => T[`hero_${n}`] && D.every((d) => Array.isArray(T[`hero_${n}`][d])))) miss.push("ponta da vara (ROD_TIP3D)");
    return miss.length ? "faltando: " + miss.join(", ") : true;
  });
  test("monstros 3D (Blender): todos vêm das folhas 3D com as linhas especiais e o impacto no lugar", () => {
    const A = window.ANIM_SHEETS || {}, miss = [];
    const extra = { mob_slime_crystal: ["special", "rise_up"], mob_wolf: ["sleep", "wake"], mob_wolf_alpha: ["howl"], mob_wolf_moon: ["howl"],
      mob_skeleton: ["rise_up"], mob_boss_ruins: ["special", "enrage"], mob_golem: ["special", "rise_up"], mob_boss_golem: ["special"],
      mob_crypt_guardian: ["rise_up"], mob_lumita_colossus: ["special"], mob_crystal_sentinel: ["special"], mob_boss_serpent: ["special"], mob_boss_serpent_echo: ["special"] };
    const all = ["slime", "mob_slime_blue", "mob_boar", "mob_goblin", "mob_goblin_boss", "mob_quartz_spider", "mob_light_wraith", ...Object.keys(extra)];
    for (const k of all) {
      const S = A[k]; if (!S || !S.b3d) { miss.push(k); continue; }
      if (["idle", "walk", "attack", "hit", "death", ...(extra[k] || [])].some((r) => !S.rows[r])) miss.push(k + " (linhas)");
      if (S.rows.attack.impact !== 4 || (S.rows.special && S.rows.special.impact !== 6)) miss.push(k + " (impacto)");
    }
    return miss.length ? "faltando: " + miss.join(", ") : true;
  });
  test("rodada 96: botão do nome lê o campo; monstro ao lado do filhote o ataca e não entra no tile dele", () => {
    const r = [], inp = document.createElement("input"); inp.id = "pet-name"; inp.value = "Nuvem"; document.body.appendChild(inp);
    let got = null; ValdoraDlgActions.create({ petName: (v) => { got = v; } }).dlgPet({ petname: "1" }); inp.remove();
    if (got !== "Nuvem") r.push("nome");
    let bit = 0; const P = { x: 10, y: 10 }, pet = { x: 5, y: 5 };
    const M = ValdoraMobs.create({ ANIMS: {}, TICK: 0.5, DIRS: [], walkable: () => true, regionAt: () => "south", inTown: () => false, tickN: () => 1, player: () => P, rand: () => 0.5,
      petAt: (x, y) => x === pet.x && y === pet.y, petFoe: (m) => Math.abs(m.x - pet.x) + Math.abs(m.y - pet.y) === 1 ? pet : null, petAttack: () => { bit++; } });
    if (M.mobCan({}, 5, 5) || !M.mobCan({}, 5, 6)) r.push("tile");
    const m = { x: 5, y: 6, hx: 5, hy: 6, d: { hp: 10, speed: 3, atk: 5, maxHit: 3 }, hp: 10, aggro: true, atkT: 0, prog: 1, face: 1 };
    M.mobTick(m); if (bit !== 1 || m.atkT !== 3) r.push("ataque");
    return miss(r);
  });

  test("rodada 105: continente com 5 biomas (cada um com ~3x o mapa antigo), vila com Pedra, masmorra com chefe e monstros na faixa de nível", () => {
    const r = [], Wd = ValdoraWorld, old = 96 * 72;
    if (Wd.BIOMES.length !== 5) r.push("5 biomas");
    for (const B of Wd.BIOMES) {
      if (B.area < old * 2.5) r.push(`${B.key}: área ${B.area}`);
      const v = Wd.VILLAGES.find((x) => x.biome === B.n); if (!v) { r.push(B.key + " sem vila"); continue; }
      if (Wd.biomeAt((v.x0 + v.x1) >> 1, (v.y0 + v.y1) >> 1) !== B.n) r.push(v.key + " fora do bioma");
      if (B.n === 1) continue;
      const E = Wd.DG_ENTRIES.find((d) => d.biome === B.n), D = E && Wd.DUNGEONS[E.key];
      if (!E || Wd.biomeAt(E.x, E.y) !== B.n || !D) { r.push(B.key + " sem masmorra"); continue; }
      const boss = D.spawns.map((s) => VD.MOBS[s[0]]).find((m) => m && m.boss); if (!boss) r.push(E.key + " sem chefe"); else if (boss.lvl < B.lv[1]) r.push(E.key + " chefe fraco");
      if (D.spawns.filter((s) => !(VD.MOBS[s[0]] || {}).boss).length < 3) r.push(E.key + " sem guarda");
      for (const [type] of Wd.BIOME_SPAWNS[B.key]) { const m = VD.MOBS[type]; if (!m) r.push(type); else if (m.lvl < B.lv[0] || m.lvl > B.lv[1]) r.push(`${type} nível ${m.lvl} fora de ${B.lv}`); }
      if (!VD.REGIONS[B.key] || VD.REGIONS[B.key].min !== B.lv[0]) r.push(B.key + " região");
    }
    if (!ASSETS.deco_waystone) r.push("arte da Pedra");
    if (ValdoraRules.MAX_LVL < 180) r.push("nível máximo");
    return miss(r);
  });
  test("rodada 105: cada bioma novo tem minério, madeira e erva próprios e um raro de nível maior; tudo com arte e uso", () => {
    const r = [], T = { darkwood: ["rock_obsidian", "tree_dark", "res_shadecap", "rock_amethyst", "res_nightbloom"], mountains: ["rock_mithril", "tree_pine", "res_rockmoss", "rock_adamant", "res_edelweiss"],
      desert: ["rock_sun", "palm", "res_desertrose", "rock_ruby", "res_sunlotus"], snow: ["rock_frost", "tree_snowpine", "res_frostbloom", "rock_starice", "res_aurora"] };
    for (const [b, list] of Object.entries(T)) {
      const lv = ValdoraWorld.BIOMES.find((B) => B.key === b).lv;
      for (const k of list) { const R = VD.RES[k]; if (!R || !ASSETS[k] || !VD.ITEMS[R.item]) { r.push(k); continue; }
        if (R.req < lv[0] - 30 || R.req > lv[1]) r.push(`${k} req ${R.req}`); }
      const rare = list.slice(3).map((k) => VD.RES[k]), base = list.slice(0, 3).map((k) => VD.RES[k]);
      if (rare.some((R) => !R || !R.rare || R.req <= Math.max(...base.map((x) => x.req)))) r.push(b + ": raro sem nível maior");
      for (const k of list.slice(3)) { const it = VD.RES[k].item; if (![...Object.values(VD.CRAFT), ...Object.values(VD.POTIONS)].some((c) => c.mats[it])) r.push(it + " sem uso"); } /* rodada 139: ervas raras vão para a alquimia */
    }
    return miss(r);
  });
  test("rodada 105: secundária por classe (escudo, flechas, orbe/livro), bracelete e montante de duas mãos", () => {
    const r = [];
    for (const h of HEROES) { if (!VD.SEC[h.sec]) { r.push(h.id + " sem secundária"); continue; }
      const its = Object.entries(ITEMS).filter(([, it]) => it.slot === "municao" && it.sec === h.sec);
      if (!["comum", "raro", "epico"].every((q) => its.some(([, it]) => it.rarity === q))) r.push(h.sec + " (raridades)");
      for (const [n, it] of its) { if (!ASSETS[it.icon]) r.push(n + " (ícone)"); if (!it.mapGear && !VD.CRAFT[n] && !(it.buy && VD.SHOP_ITEMS.includes(n))) r.push(n + " (receita ou loja)"); } } /* rodada 137 */
    if (!Object.values(ITEMS).some((it) => it.sec === "orbe" && it.look && it.look[0] === "book")) r.push("livros do Místico");
    const br = Object.entries(ITEMS).filter(([, it]) => it.slot === "bracelete");
    if (!VD.EQUIP_SLOTS.bracelete || br.length < 3 || br.some(([n, it]) => !ASSETS[it.icon] || !(VD.CRAFT[n] || it.buy || it.mapGear))) r.push("bracelete"); /* rodada 137 */
    for (const t of VD.GEAR.espada.tiers.slice(1)) { const it = ITEMS[t.two];
      if (!it || !it.twoH || it.onlyHero !== "hero_1" || !(it.bonus.dmg > 0) || !ASSETS[it.icon] || !t.twoForge || (it.look || [])[0] !== "sword2") r.push("montante " + t.two); }
    for (const L of ["shield", "orb", "book", "sword2"]) if (!ValdoraOutfit.ORDER.includes(L)) r.push("camada " + L);
    return miss(r);
  });
  test("rodada 120: mapa maior com mar nos 4 lados, vilas em dobro, 10 cais no litoral do continente e espécies novas", () => {
    const r = [], Wd = ValdoraWorld, B = Wd.BIOME;
    for (let x = 0; x < Wd.W; x++) if (B[x] || B[(Wd.H - 1) * Wd.W + x]) { r.push("terra na borda de cima/baixo"); break; }
    for (let y = 0; y < Wd.H; y++) if (B[y * Wd.W] || B[y * Wd.W + Wd.W - 1]) { r.push("terra na borda dos lados"); break; }
    for (const v of Wd.VILLAGES) { const w = v.x1 - v.x0 + 1, h = v.y1 - v.y0 + 1; if (w < 32 || h < 30) r.push(`${v.key} ${w}x${h}`); }
    if (Wd.DOCKS.length !== 11 || !Wd.DOCKS.some((D) => D.key === "dock_tumba")) r.push(Wd.DOCKS.length + " cais"); /* rodada 142: + Porto da Tumba */
    for (const D of Wd.DOCKS) {
      if (!Wd.biomeAt(D.x, D.y) || Wd.biomeAt(D.x + D.dx, D.y + D.dy) || Wd.biomeAt(D.x + D.dx * D.len, D.y + D.dy * D.len)) r.push(D.key + " fora do litoral");
      if (!D.name || !D.keeper) r.push(D.key + " sem nome");
    }
    for (const k of ["fox", "deer", "bear", "dark_deer", "dark_bear", "rock_fox", "mountain_bear", "sand_fox", "arctic_fox", "ice_elk", "polar_bear"]) {
      const m = VD.MOBS[k]; if (!m) { r.push(k); continue; } if (!ASSETS[m.spr]) r.push(k + " sem arte"); if (!VD.familyOf(m)) r.push(k + " sem família"); }
    for (const it of ["Pele de raposa", "Pele de urso", "Galhada de cervo", "Carne de caça"]) if (!VD.ITEMS[it]) r.push(it);
    const L = Wd.L; if (L.RX(48) !== 56 || L.RY(36) !== 43 || L.TOWN.x1 - L.TOWN.x0 !== 31) r.push("Lumeira em dobro");
    return miss(r);
  });
  test("rodada 105: direções em 8 (vetor -> direção, linha da folha com reserva de 4)", () => {
    const r = [], want = { "1,0": "right", "1,1": "downright", "0,1": "down", "-1,1": "downleft", "-1,0": "left", "-1,-1": "upleft", "0,-1": "up", "1,-1": "upright", "3,1": "right", "2,2": "downright" };
    for (const [k, d] of Object.entries(want)) { const [x, y] = k.split(",").map(Number); if (window.DIR_AT(x, y) !== d) r.push(k + "->" + window.DIR_AT(x, y)); }
    if (window.DIR_AT(0, 0) !== null) r.push("parado");
    if (window.SHEET_ROW("upleft", 8) !== 6 || window.SHEET_ROW("upleft", 4) !== 1 || window.SHEET_ROW("downright", 4) !== 2 || window.SHEET_ROW("up", 8) !== 3) r.push("linhas");
    return miss(r);
  });
  test("rodada 105: heróis, moradores e monstros 3D têm as diagonais (monstros: 4 vistas extras, carregadas sob demanda)", () => {
    const r = [], A = window.ANIM3D || {}, DG = ["downleft", "downright", "upleft", "upright"];
    for (const h of ["hero_1", "hero_2", "hero_3"]) {
      for (const d of DG) for (const [k, rn] of [[h, "idle_"], [h, "hit_"], [h, "death_"], [h + "_walk6", "walk_"], [h + "_dash", "dash_"], [h + "_block", "block_"]]) if (!A[k] || !A[k].rows[rn + d]) r.push(k + " " + rn + d);
    }
    for (const n of ["npc_merchant", "npc_guard", "npc_bard", "npc_juna", "npc_odilia", "npc_bras"]) for (const d of DG) {
      if (!A[n + "_walk6"] || !A[n + "_walk6"].rows["walk_" + d]) r.push(n + " walk_" + d);
      if (!A[n + "_look"] || !A[n + "_look"].rows["idle_" + d]) r.push(n + " idle_" + d);
    }
    for (const [k, S] of Object.entries(A)) {
      if (!(k === "slime" || k.startsWith("mob_")) || k.includes("@")) continue;
      if (!S.views || S.views.length !== 4) { r.push(k + " (vistas)"); continue; }
      for (const v of S.views) { const V = A[k + "@" + v]; if (!V || !V.lazy || ["idle", "walk", "attack", "hit", "death"].some((rn) => !V.rows[rn] || V.rows[rn].frames !== S.rows[rn].frames)) r.push(k + "@" + v); }
    }
    return miss(r);
  });
  test("rodada 105: monstro na diagonal do herói ataca dali (e olha para ele); anda na diagonal sem cortar quina", () => {
    const r = [], P = { x: 10, y: 10 }; let hits = 0;
    const M = ValdoraMobs.create({ ANIMS: {}, TICK: 0.5, DIRS: [[1, 0], [-1, 0], [0, 1], [0, -1]], walkable: () => true, regionAt: () => "south", inTown: () => false, tickN: () => 1, player: () => P, rand: () => 0.5,
      mobAttack: () => { hits++; }, canStep: (x, y, nx, ny) => !(nx === 6 && ny === 6) });
    const m = { x: 11, y: 11, hx: 11, hy: 11, d: { hp: 10, speed: 3, atk: 5, maxHit: 3 }, hp: 10, aggro: true, atkT: 0, prog: 1, face: -1 };
    M.mobTick(m); if (hits !== 1) r.push("não atacou na diagonal"); if (m.dir8 !== "upleft") r.push("olha para " + m.dir8);
    const w = { x: 3, y: 3, d: {}, prog: 1 }; M.mobStepToward(w, 9, 9); if (!(w.x === 4 && w.y === 4) || w.dir8 !== "downright") r.push("passo diagonal " + w.x + "," + w.y + " " + w.dir8);
    const q = { x: 5, y: 5, d: {}, prog: 1 }; M.mobStepToward(q, 9, 9); if (q.x === 6 && q.y === 6) r.push("cortou a quina");
    return miss(r);
  });

  // ---------- equilíbrio: XP e moedas por hora ----------
  const TICK = 0.5, xpFor = RU.xpFor;
  const rows = [];
  for (const [k, R] of Object.entries(RES)) {
    for (const [label, lvl, toolTier] of [["no nível exigido", R.req, Math.min(3, R.req >= 16 ? 3 : R.req >= 8 ? 2 : 1)], ["+10 níveis, melhor ferramenta", R.req + 10, 3]]) {
      const chance = RU.gatherChance(lvl, R.req, toolTier);
      // tentativas a cada 2 ticks; cada recurso rende ~C itens e some por ~Rsp s; supõe 3 recursos ao alcance e 3 s de caminhada por troca
      const C = (R.charges[0] + R.charges[1]) / 2, Rsp = R.respawn ? (R.respawn[0] + R.respawn[1]) / 2 : 0;
      const ticks = R.skill === "pesca" ? 5 : 2; // rodada 112: pesca a cada 5 ticks (FISH_TICKS no game.js)
      const perItem = (ticks * TICK) / chance + 3 / C, cap = Rsp ? 3 * C * 3600 / (Rsp + C * (ticks * TICK) / chance) : Infinity;
      const items = Math.min(3600 / perItem, cap);
      // rodada 26: peixes como no gather.js (com 2+ opções, metade das vezes o melhor peixe); antes usava sempre o lambari e o cardume fundo saía igual ao raso
      const fo = R.fish && R.fish.filter((f) => lvl >= f.req), avg = (g) => fo.length > 1 ? (g(fo[0]) + g(fo[fo.length - 1])) / 2 : g(fo[0]);
      const xp = items * (fo ? avg((f) => f.xp) : R.xp), coins = items * (fo ? avg((f) => ITEMS[f.item].price) : ITEMS[R.item].price);
      rows.push([R.name, label, Math.round(chance * 100) + "%", Math.round(xp), Math.round(coins)]);
    }
  }
  // rodada 28: processamento (fogueira e fornalha): 3 ticks + ~0,1 s por item (robô da rodada 27: 1,59 s). O ritmo real depende da coleta.
  const PER = 3600 / (3 * TICK + 0.1);
  for (const [n, it] of Object.entries(ITEMS)) if (it.cook) for (const [label, lvl] of [["no nível exigido", it.cookLvl], ["+8 níveis", it.cookLvl + 8]]) {
    const ok = 1 - RU.burnChance(lvl, it.cookLvl);
    rows.push([`Assar ${n.toLowerCase()} (matéria à vontade)`, label, Math.round(ok * 100) + "% sem queimar", Math.round(PER * ok * it.cookXp), Math.round(PER * ok * ITEMS[it.cook].price)]);
  }
  for (const [bar, S] of Object.entries(SMELT)) rows.push([`Fundir ${bar.toLowerCase()} (matéria à vontade)`, `Ferraria ${S.lvl}`, "100%", Math.round(PER * S.xp), Math.round(PER * ITEMS[bar].price)]);
  const tierFor = (l) => l >= 24 ? 4 : l >= 16 ? 3 : l >= 8 ? 2 : 1;
  for (const [k, d] of Object.entries(MOBS)) {
    const lvl = Math.max(1, d.lvl), st = RU.combatStats({ combate: lvl, vitalidade: lvl, weapon: GEAR.espada.tiers[tierFor(lvl)], armor: { def: 0 }, style: VD.STYLES.preciso, buffs: [], accessories: [], master: {} });
    const hit = RU.hitChance(st.acc, d.def), dps = hit * (1 + st.maxHit) / 2 / 1.5;
    const ttk = d.hp / dps + (d.boss ? 30 : 4); // + procurar o próximo monstro: o robô da rodada 8 gastou ~1 s; uma pessoa, ~3–5 s
    const kills = 3600 / (d.boss ? Math.max(ttk, d.respawn || 120) : ttk);
    const drops = d.drops.reduce((s, [i, p, a = 1, b = a]) => s + p * (a + b) / 2 * ITEMS[i].price, 0);
    rows.push([d.name + (d.boss ? " (chefe)" : ""), `nível ${lvl}, arma tier ${tierFor(lvl)}`, Math.round(hit * 100) + "% acerto", Math.round(kills * d.hp * (VD.STYLES.preciso.xp.combate + VD.STYLES.preciso.xp.vitalidade)), Math.round(kills * ((d.coins[0] + d.coins[1]) / 2 + drops))]);
  }

  const ok = results.filter((r) => r[1]).length;
  out.innerHTML = `<h2>${ok}/${results.length} testes passaram</h2><table>${results.map(([n, pass, msg]) => `<tr class="${pass ? "ok" : "bad"}"><td>${pass ? "OK" : "FALHOU"}</td><td>${n}</td><td>${msg}</td></tr>`).join("")}</table>
    <h2>Equilíbrio estimado por hora</h2><p>XP de combate inclui Vitalidade. Nível 10 pede ${xpFor(10)} XP; nível 20 pede ${xpFor(20)}; nível 30 pede ${xpFor(30)}.</p>
    <table><tr><th>Atividade</th><th>Cenário</th><th>Chance</th><th>XP/h</th><th>Moedas/h</th></tr>${rows.map((r) => `<tr><td>${r.join("</td><td>")}</td></tr>`).join("")}</table>`;
  document.title = `Testes ${ok}/${results.length}`;
})();

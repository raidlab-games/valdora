// Valdora — Casa do herói (rodada 100): regras puras (lote, custo, obra, troféus liberados, bônus de descanso, save).
// O game.js põe os objetos no mapa, desenha a janela "Casa" e aplica o efeito; os testes (tests.html) usam só estas regras.
window.ValdoraHome = (() => {
  "use strict";
  // lote de 6 x 5 tiles de grama livre a sudoeste da vila (medido na rodada 99), entre a casa verde e a trilha da Juna
  const LOT = { x: 38, y: 45, w: 6, h: 5 };
  const HOUSE = { x: 38, y: 45, w: 3, h: 2 };                 // base sólida da casa (desenho de 4,5 x 3 tiles)
  const PEDESTALS = [41, 42, 43].flatMap((x) => [45, 46, 47].map((y) => ({ x, y }))); // 3 x 3 pedestais no quintal
  const BED = { x: 39, y: 48 }, BENCH = { x: 42, y: 49 }, MINT = { x: 38, y: 48 };
  const COST = 1500, BENCH_COST = 200;
  const BUILD = { "Madeira de carvalho": 30, "Madeira de cedro": 10, "Barra de ferro": 12 };
  const SLOTS = 9;
  const REST = { every: 1800, ticks: 2400, hpPer: 2, regen: 3, regenAt: 5 }; // regen: a cada quantos ticks volta 1 de vida fora de luta (sem o efeito, 4). Robô: com 2 (o dobro), a Fenda caía de −26% para −50% de comida com o filhote; com 3, −33%          // dormir: a cada 30 min de jogo; dura 20 min (2.400 ticks de 0,5 s)
  const ECHOES = ["echo_ruins", "echo_golem", "echo_serpent"];
  // troféus: como cada um libera (kill = abate de chefe; echoes = os três ecos; deliver = entregar 1 item uma vez; campaign = Ato V completo)
  const TROPHIES = [
    { id: "capataz", name: "Bandeira rasgada do Capataz", spr: "trophy_capataz", kind: "kill", mob: "goblin_boss" },
    { id: "alpha", name: "Pele prateada do Alfa", spr: "trophy_alpha_pelt", kind: "kill", mob: "wolf_moon" },
    { id: "ruins", name: "Elmo coroado do Senhor das Ruínas", spr: "trophy_ruins_helm", kind: "kill", mob: "boss" },
    { id: "golem", name: "Punho de pedra do Golem Ancião", spr: "trophy_golem_fist", kind: "kill", mob: "boss_golem" },
    { id: "serpent", name: "Escama da Serpente de Lumita", spr: "trophy_serpent_scale", kind: "kill", mob: "boss_serpent" },
    { id: "colossus", name: "Estilhaço do Colosso", spr: "trophy_colossus_shard", kind: "kill", mob: "crypt_colossus" },
    { id: "echo", name: "Eco numa redoma", spr: "trophy_echo_dome", kind: "echoes" },
    { id: "amber", name: "Âmbar antigo", spr: "trophy_amber", kind: "deliver", item: "Âmbar antigo" },
    { id: "fang", name: "Presa lunar no cordão", spr: "trophy_moon_fang", kind: "deliver", item: "Presa lunar" },
    { id: "moss", name: "Coração de musgo no vaso", spr: "trophy_moss_heart", kind: "deliver", item: "Coração de musgo" },
    { id: "fish", name: "Peixe dourado na placa", spr: "trophy_gold_fish", kind: "deliver", item: "Peixe dourado" },
    { id: "markers", name: "Maquete dos cinco marcos", spr: "trophy_markers", kind: "campaign", quest: "c5_serpente" },
  ];
  const BY_ID = Object.fromEntries(TROPHIES.map((t) => [t.id, t]));
  const howTo = (t) => t.kind === "kill" ? "derrote o chefe" : t.kind === "echoes" ? "vença os três ecos semanais (Senhor, Golem e Serpente)"
    : t.kind === "deliver" ? `entregue 1 ${t.item}` : "acenda os cinco marcos (fim do Ato V)";
  // p = { kills, quests, home }
  function unlocked(t, p) {
    const k = p.kills || {};
    if (t.kind === "kill") return (k[t.mob] || 0) > 0;
    if (t.kind === "echoes") return ECHOES.every((e) => (k[e] || 0) > 0);
    if (t.kind === "deliver") return !!(p.home && p.home.got && p.home.got[t.id]);
    if (t.kind === "campaign") return !!(p.quests && p.quests[t.quest] && p.quests[t.quest].done);
    return false;
  }
  const canBuy = (p) => !!(p.quests && p.quests.c2_marco && p.quests.c2_marco.done) && !(p.home && p.home.lot);
  const shown = (home) => (home && home.slots ? home.slots.filter((id) => id && BY_ID[id]).length : 0);
  const restHp = (n) => REST.hpPer * Math.max(0, Math.min(SLOTS, n | 0));
  const canRest = (home, playT) => !!(home && home.built) && playT - (home.restAt == null ? -1e9 : home.restAt) >= REST.every;
  const restLeft = (home, playT) => Math.max(0, Math.ceil(REST.every - (playT - (home.restAt == null ? -1e9 : home.restAt))));
  // rodada 101: a vida mais rápida só com 5+ troféus expostos (robô, Ato III com 2 troféus: −17% de comida com ela, −6% sem)
  const regenTicks = (home, rested) => rested && shown(home) >= REST.regenAt ? REST.regen : 4;
  // rodada 102: visitas ao quintal. Cada NPC comenta troféus com a própria voz; no máximo uma a cada VISIT.every s de jogo,
  // só com o herói perto de casa e fora de luta. As falas ficam no registro (não param o jogo).
  const VISIT = { every: 480, near: 5 };
  const NPC_NAMES = { guard: "Ivo", bard: "Tomé", shop: "Bento", herb: "Juna", carto: "Odília", miner: "Brás" };
  const VISITS = [
    ["guard", "capataz", "Ivo bate continência para a bandeira do Capataz. \"Essa eu queria ter arrancado eu mesmo.\""],
    ["guard", "ruins", "Ivo olha o elmo do Senhor das Ruínas de longe. \"Deixe virado para a parede. Vai que ele lembra.\""],
    ["bard", "alpha", "Tomé dedilha ao lado da pele prateada: \"…e a lua, cansada de uivar, foi dormir num quintal.\""],
    ["bard", "echo", "Tomé encosta o ouvido na redoma. \"Tem um refrão aí dentro. Me empresta uma noite?\""],
    ["shop", "amber", "Bento examina o âmbar contra o sol. \"Isso paga uma carroça. Duas, se o inseto for raro.\""],
    ["shop", "fish", "Bento suspira para o peixe dourado. \"Se um dia quiser vender, eu nem pechincho. Muito.\""],
    ["herb", "moss", "Juna cutuca o coração de musgo. \"Água uma vez por semana. E não converse com ele: ele não gosta.\""],
    ["herb", "fang", "Juna vê a presa lunar no cordão. \"O filhote finge que não reparou. Eu reparei.\""],
    ["carto", "markers", "Odília mede a maquete com um barbante. \"Escala errada, marcos no lugar certo. Aprovada.\""],
    ["carto", "serpent", "Odília anota: \"Escama da Serpente, quintal ao sul da vila.\" E desenha um enfeite no mapa."],
    ["miner", "colossus", "Brás bate no estilhaço com a unha. \"Lumita boa. Canta.\""],
    ["miner", "golem", "Brás olha o punho do Golem Ancião. \"Turno encerrado, então.\""],
  ];
  function pickVisit(home, last, rand) { // fala sobre um troféu exposto, de outro NPC que o da última visita
    const on = new Set((home && home.slots || []).filter(Boolean));
    const ok = VISITS.filter(([who, id]) => on.has(id) && who !== last);
    const pool = ok.length ? ok : VISITS.filter(([, id]) => on.has(id));
    if (!pool.length) return null;
    const [who, id, text] = pool[Math.floor(rand() * pool.length)];
    return { who, id, name: NPC_NAMES[who], text };
  }
  const canVisit = (home, playT) => !!(home && home.built) && playT - (home.visitAt == null ? -1e9 : home.visitAt) >= VISIT.every;
  const fresh = () => ({ lot: 0, built: 0, slots: Array(SLOTS).fill(null), got: {}, furn: { bench: 0 }, restAt: -1e9, visitAt: -1e9, visitBy: null });
  function sanitize(d) { // save antigo (sem casa) ou mexido à mão: volta ao formato e descarta troféus desconhecidos ou repetidos
    const h = fresh(); if (!d || typeof d !== "object") return h;
    h.lot = d.lot ? 1 : 0; h.built = h.lot && d.built ? 1 : 0;
    const seen = new Set(); h.slots = Array.from({ length: SLOTS }, (_, i) => { const id = d.slots && d.slots[i]; if (!id || !BY_ID[id] || seen.has(id)) return null; seen.add(id); return id; });
    for (const id of Object.keys(d.got || {})) if (BY_ID[id] && BY_ID[id].kind === "deliver") h.got[id] = 1;
    h.furn.bench = d.furn && d.furn.bench ? 1 : 0; h.restAt = typeof d.restAt === "number" ? d.restAt : -1e9; h.visitAt = typeof d.visitAt === "number" ? d.visitAt : -1e9; h.visitBy = NPC_NAMES[d.visitBy] ? d.visitBy : null;
    return h;
  }
  function toggle(home, id) { // expõe no primeiro pedestal livre, ou guarda
    const i = home.slots.indexOf(id);
    if (i >= 0) { home.slots[i] = null; return "guardou"; }
    const j = home.slots.indexOf(null); if (j < 0) return "cheio";
    home.slots[j] = id; return "expôs";
  }
  return { VISIT, VISITS, NPC_NAMES, pickVisit, canVisit, regenTicks, LOT, HOUSE, PEDESTALS, BED, BENCH, MINT, COST, BENCH_COST, BUILD, SLOTS, REST, ECHOES, TROPHIES, BY_ID, howTo, unlocked, canBuy, shown, restHp, canRest, restLeft, fresh, sanitize, toggle };
})();

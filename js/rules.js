// Regras puras do Valdora (sem estado do jogo): níveis, acerto, atributos de combate, coleta e afixos.
// Usadas pelo game.js e pelos testes (tests.html), para que o equilíbrio seja verificável fora do jogo.
window.ValdoraRules = (() => {
  const MAX_LVL = 200; // rodada 105: biomas até o nível 180
  // curva de XP: nível 10 ≈ 3,6 mil, 20 ≈ 23,6 mil, 30 ≈ 68 mil, 40 ≈ 142 mil
  const xpFor = (l) => l <= 40 ? Math.round(15 * Math.pow(l - 1, 2.5)) : Math.round(15 * Math.pow(39, 2.5) + 500 * Math.pow(l - 40, 1.85)); // até 40, a curva de sempre
  const level = (xp) => { let l = 1; while (l < MAX_LVL && xp >= xpFor(l + 1)) l++; return l; };
  // rodada 151: níveis de classe (Guerreiro, Arqueiro, Mago) vão até 200 e sobem 1,2x mais rápido que o Combate com o mesmo xp:
  // o nível L de classe custa o xp do nível 1 + (L - 1) / 1,2 de Combate (1 nível de Combate = 1,2 de classe)
  const CLASS_SKILLS = ["guerreiro", "arqueiro", "mago"], CLASS_RATE = 1.2;
  const isClass = (k) => CLASS_SKILLS.includes(k);
  const xpForClass = (l) => xpFor(1 + (l - 1) / CLASS_RATE);
  const levelClass = (xp) => { let l = 1; while (l < MAX_LVL && xp >= xpForClass(l + 1)) l++; return l; };
  const skillLevel = (k, xp) => (isClass(k) ? levelClass : level)(xp || 0);
  const skillXpFor = (k, l) => (isClass(k) ? xpForClass : xpFor)(l);
  // arma -> classe que ela treina e pede: cajado = Mago, arco = Arqueiro, espada e montante = Guerreiro
  const weaponClass = (it) => !it || it.slot !== "arma" || it.gear !== "espada" ? null : it.staff ? "mago" : it.bow ? "arqueiro" : "guerreiro";
  const CLASS_SEC = { guerreiro: "escudo", arqueiro: "flecha", mago: "orbe" };
  // rodada 137: acerto pela diferença entre acerto e defesa. Muito acima da defesa do alvo: acerta sempre (um monstro do gelo
  // não erra um herói pelado de nível baixo); muito abaixo: 10%. Mesma força: 80%.
  const hitChance = (acc, def) => Math.max(0.1, Math.min(1, 0.8 + (acc - def) * 0.015));
  // rodada 137: a armadura também segura parte do dano (até ~40% com a melhor armadura e bônus)
  const armorCut = (dmg, armorDef) => Math.max(1, Math.round(dmg * (1 - Math.min(0.45, armorDef * 2 / (armorDef * 2 + 90)))));
  const MOB_XP = 0.2; // rodada 137: XP de monstro 5x menor (1 xp -> 0,2 xp)
  const critChance = (style) => (style === "agressivo" ? 0.1 : style === "preciso" ? 0.14 : 0.06); // rodada 10: Preciso 14% (medido com o robô: com o acerto no teto, só o crítico compensa)
  // passivas (rodada 9): Preciso tem críticos mais fortes; Agressivo faz sangrar; Defensivo apara golpes
  const critBonus = (style) => (style === "preciso" ? 1 : 0.5);      // bônus do crítico = até (fração × dano máx.)
  const BLEED = { chance: 0.18, pulses: 3, every: 0.5, frac: 0.15 }; // Agressivo (rodada 10: 25% → 18%)
  const BLOCK = { chance: 0.2, keep: 0.5 };                           // Defensivo
  const bleedDmg = (maxHit) => Math.max(1, Math.round(maxHit * BLEED.frac));
  const blockDmg = (dmg) => Math.max(1, Math.ceil(dmg * BLOCK.keep));

  // ---------- afixos: bônus aleatórios em acessórios de chefes, cripta e drops raros ----------
  const AFFIXES = [
    { id: "feroz", name: "Feroz", stat: "dmg", min: 1, max: 2 },
    { id: "certeiro", name: "Certeiro", stat: "acc", min: 1, max: 3 },
    { id: "firme", name: "Firme", stat: "def", min: 1, max: 3 },
    { id: "vigoroso", name: "Vigoroso", stat: "hp", min: 4, max: 10 },
    { id: "sortudo", name: "da Fartura", stat: "gather", min: 3, max: 6 },
  ];
  const AFF_BY_ID = Object.fromEntries(AFFIXES.map((a) => [a.id, a]));
  function rollAffixes(count, power, rand) { // power 0..1 aumenta os valores (chefes mais fortes)
    const pool = AFFIXES.slice(), out = [];
    for (let i = 0; i < count && pool.length; i++) {
      const a = pool.splice(Math.floor(rand() * pool.length), 1)[0];
      out.push({ id: a.id, v: Math.min(a.max + 1, a.min + Math.floor(rand() * (a.max - a.min + 1) + power)) });
    }
    return out;
  }
  // bônus total de um item (base + afixos). entry = { name, aff? }
  function itemBonus(entry, ITEMS) {
    const b = { acc: 0, dmg: 0, def: 0, gather: 0, hp: 0 }, base = (ITEMS[entry.name] || {}).bonus || {};
    for (const k of Object.keys(b)) b[k] += base[k] || 0;
    for (const a of entry.aff || []) { const A = AFF_BY_ID[a.id]; if (A) b[A.stat] += a.v; }
    return b;
  }
  const affixNames = (entry) => (entry.aff || []).map((a) => (AFF_BY_ID[a.id] || {}).name).filter(Boolean).join(", ");
  const bonusText = (b = {}) => [b.acc && `+${b.acc} acerto`, b.dmg && `+${b.dmg} dano`, b.def && `+${b.def} defesa`, b.hp && `+${b.hp} vida`, b.gather && `+${b.gather}% coleta`].filter(Boolean).join(", ");

  // atributos de combate a partir de níveis, equipamento, estilo, efeitos e acessórios
  function combatStats({ combate, vitalidade, weapon, armor, style, buffs, accessories, master }) {
    const b = { acc: 0, dmg: 0, def: 0, hp: 0 };
    for (const B of buffs) { b.acc += B.acc; b.dmg += B.dmg; b.def += B.def; b.hp += B.hp || 0; } // rodada 100: Bem descansado dá vida
    for (const e of accessories) { b.acc += e.acc; b.dmg += e.dmg; b.def += e.def; b.hp += e.hp; }
    if (master.espada) { b.acc += 1; b.dmg += 1; }
    if (master.armadura) b.def += 2;
    return {
      acc: combate + weapon.acc + style.acc + b.acc,
      maxHit: 2 + Math.floor(combate / 4) + weapon.dmg + style.dmg + b.dmg,
      def: Math.floor(vitalidade / 2) + armor.def * 2 + style.def + b.def, // rodada 137: a armadura pesa mais que o nível (pelado = pouca defesa)
      armor: armor.def + b.def,
      maxHp: 18 + 2 * vitalidade + b.hp,
    };
  }
  // chance de sucesso por tentativa de coleta
  const gatherChance = (lvl, req, toolBonus, extra = 0) => Math.max(0.1, Math.min(0.95, 0.3 + (lvl - req) * 0.025 + toolBonus * 0.08 + extra));

  // rodada 28: chance de queimar ao assar (24% no nível exigido, -3 pontos por nível, zera 8 níveis acima); antes 32% e -3,5
  const burnChance = (lvl, req) => Math.max(0, Math.min(0.24, 0.24 - (lvl - req) * 0.03));
  // rodada 64: gerador com semente (mulberry32) — base do modo de teste com mundo fixo (ValdoraGame.seed) e das regras de nascimento
  const mulberry32 = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  // rodada 95: companheiro (filhote da lua). Vínculo 1–20 cresce com os abates feitos com ele junto; 3 fases (filhote, jovem, adulto).
  // rodada 96: vida (16 + 3 por vínculo), defesa (2 + vínculo) e descanso na vila depois de cair (rest, em segundos)
  const PET = { name: "Filhote da lua", bondMax: 20, every: 4, follow: 2, leash: 10, reach: 8, pull: 3, rest: 120, draw: 0.1 }; // draw: chance de o monstro ao lado dos dois (herói e filhote) morder o filhote, se ele bateu por último
  const petBond = (kills) => Math.min(PET.bondMax, 1 + Math.floor(Math.sqrt(Math.max(0, kills || 0) / 4)));
  // rodada 96: dano 2 + vínculo/2 → 2 + vínculo/5 (robô: no vínculo 20 o eco do Senhor caía com 31–44% menos comida; agora ~26%)
  // rodada 98: testado acerto 6 + 2,2 × vínculo (ecos do Golem e da Serpente quase não mudaram; a Fenda passou a −32% de comida): fica 1,6
  const petStats = (bond) => ({ acc: 6 + Math.round(bond * 1.6), maxHit: 2 + Math.floor(bond / 5) });
  const petStage = (bond) => bond >= 14 ? 3 : bond >= 7 ? 2 : 1;
  const petMaxHp = (bond) => 16 + 3 * bond;
  const petDef = (bond) => 2 + bond;
  // nome escolhido pelo jogador: letras, números, espaço, hífen e apóstrofo; espaços repetidos viram um; até 14 caracteres
  const petName = (s) => String(s == null ? "" : s).replace(/[^\p{L}\p{N} '-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 14).trim();
  // rodada 93: algum NPC de conversa a até r tiles (o letreiro de região sobe para não cobrir o rosto dele)
  const TALKERS = ["guard", "merchant", "bard", "herb", "carto", "miner"];
  const talkerNear = (npcs, p, r = 6) => npcs.some((n) => n && TALKERS.includes(n.type) && Math.abs(n.x - p.x) + Math.abs(n.y - p.y) <= r);
  // rodada 89: XP de Combate das recompensas (missões, caçadas, caçada do dia) leva junto Vitalidade na proporção do estilo, até 1:1
  const vitShare = (style, n) => Math.round(n * Math.min(1, style.xp.vitalidade / style.xp.combate));
  return { CLASS_SKILLS, CLASS_RATE, isClass, xpForClass, levelClass, skillLevel, skillXpFor, weaponClass, CLASS_SEC, PET, petBond, petStats, petStage, petMaxHp, petDef, petName, talkerNear, vitShare, mulberry32, burnChance, MAX_LVL, xpFor, level, hitChance, armorCut, MOB_XP, critChance, critBonus, BLEED, BLOCK, bleedDmg, blockDmg, AFFIXES, rollAffixes, itemBonus, affixNames, bonusText, combatStats, gatherChance };
})();

// Dados de jogo do Valdora: itens, recursos, monstros, equipamentos, receitas e tutorial.
// Tudo aqui é configuração: dá para equilibrar o jogo mexendo só neste arquivo.
window.VD = (() => {
  const SKILLS = { corte: "Corte", mineracao: "Mineração", pesca: "Pesca", culinaria: "Culinária", ferraria: "Ferraria", artesanato: "Artesanato", combate: "Combate", vitalidade: "Vitalidade", herbalismo: "Herbalismo", alquimia: "Alquimia" }; // rodada 104: plantas e flores com a foice; 117: poções com a feiticeira

  // Raridade dos acessórios (cor usada no inventário, no chão e nos textos)
  const RARITY = { comum: { name: "Comum", color: "#e8e0c8" }, raro: { name: "Raro", color: "#5fb0ff" }, epico: { name: "Épico", color: "#c47aff" } };

  // price = quanto o Bento paga; buy = preço de compra (se ele vende); heal = vida ao comer
  // filter = filtro CSS opcional aplicado ao ícone (reaproveita uma arte com outra cor)
  const ITEMS = {
    "Madeira": { icon: "item_log", price: 2 },
    "Madeira de carvalho": { icon: "item_log_oak", price: 5 },
    "Madeira de cedro": { icon: "item_log_cedar", price: 7 },
    "Cobre": { icon: "item_ore", price: 4 },
    "Ferro": { icon: "item_ore_iron", price: 8 },
    "Lumita": { icon: "item_lumita", price: 12 },
    "Barra de bronze": { icon: "item_bar_bronze", price: 11 },
    "Barra de ferro": { icon: "item_bar_iron", price: 20 },
    "Barra de aço": { icon: "item_bar_steel", price: 38 },
    "Barra de lumita": { icon: "item_bar_lumita", price: 65 },
    "Lambari cru": { icon: "item_lambari", price: 2, cook: "Lambari assado", cookLvl: 1, cookXp: 6 },
    "Tucunaré cru": { icon: "item_tucunare", price: 5, cook: "Tucunaré assado", cookLvl: 10, cookXp: 16 },
    "Lambari assado": { icon: "item_lambari_cooked", price: 4, heal: 5 },
    "Tucunaré assado": { icon: "item_tucunare_cooked", price: 11, heal: 15 }, // rodada 89: 12 -> 15 (empatava com a carne assada; chefes medidos de novo)
    "Peixe queimado": { icon: "item_burnt", price: 1 }, // rodada 31: o Bento compra (antes ficava acumulando na mochila)
    "Poção de vida": { icon: "item_potion", price: 7, heal: 18, buy: 15 },
    "Poção de força": { icon: "item_potion_strength", price: 15, buy: 40, buff: "forca" },
    "Poção de pedra": { icon: "item_potion_stone", price: 15, buy: 40, buff: "pedra" },
    "Carne de javali": { icon: "item_meat", price: 3, cook: "Carne assada", cookLvl: 1, cookXp: 12, /* rodada 30: Culinária 5 → 2; rodada 90: 2 → 1 (o tutorial termina na Culinária 1) */
      skewer: { with: "Madeira", item: "Espetinho de javali", xp: 15 } }, // rodada 30: com madeira na mochila vira espetinho
    "Carne assada": { icon: "item_meat_cooked", price: 7, heal: 12 }, // rodada 88: 9 -> 12 (robô da campanha: 71–122 refeições nos Atos I–II com 9)
    "Espetinho de javali": { icon: "item_meat_skewer", price: 9, heal: 15 }, // rodada 30: comida de meio de jogo antes do tucunaré; rodada 88: 12 -> 15 (o intermediário: carne + madeira)
    "Gosma": { icon: "item_gel", price: 3 },
    "Couro de javali": { icon: "item_leather", price: 9 },
    "Pele de lobo": { icon: "item_pelt", price: 18 },
    "Núcleo de slime": { icon: "item_core", price: 60, rare: true },
    "Âmbar antigo": { icon: "item_amber", price: 140, rare: true },
    "Presa lunar": { icon: "item_fang", price: 220, rare: true },
    "Coração de musgo": { icon: "item_heart", price: 500, rare: true },
    "Fragmento ancestral": { icon: "item_fragment", price: 400, rare: true },
    "Peixe dourado": { icon: "item_fish_gold", price: 60, rare: true },
    // rodada 104: Herbalismo (colhidas com a foice; vão para a alquimia da Juna e o artesanato)
    "Erva-cidreira": { icon: "item_herb", price: 3 },
    "Flor-de-mel": { icon: "item_flower_honey", price: 5 },
    "Lírio-da-lua": { icon: "item_moonlily", price: 14 },
    "Flor de cristal": { icon: "item_crystal_bloom", price: 26 },
    // acessórios: clique na mochila para equipar (anel e amuleto). bonus: acerto, dano, defesa, coleta (%)
    "Anel de cobre": { icon: "item_ring_copper", price: 20, slot: "anel", rarity: "comum", bonus: { acc: 2 } },
    "Anel do caçador": { icon: "item_ring_hunter", price: 150, slot: "anel", rarity: "raro", bonus: { dmg: 2, acc: 1 } },
    "Anel ancestral": { icon: "item_ring_ancient", price: 600, slot: "anel", rarity: "epico", bonus: { acc: 5, dmg: 3 } },
    "Amuleto de âmbar": { icon: "item_amulet_amber", price: 90, slot: "amuleto", rarity: "comum", bonus: { def: 3 } },
    "Amuleto de musgo": { icon: "item_amulet_moss", price: 300, slot: "amuleto", rarity: "raro", bonus: { def: 6, acc: 1 } },
    "Amuleto do coletor": { icon: "item_amulet_gatherer", price: 250, slot: "amuleto", rarity: "raro", bonus: { gather: 8 } },
    "Eco cristalizado": { icon: "item_echo_crystal", price: 350, rare: true }, // rodada 22: só cai dos ecos
    // rodada 78: itens da campanha (quest = de missão: preço 0, não vendem nem caem no chão)
    "Lasca rúnica": { icon: "item_fragment", price: 0, quest: true, filter: "hue-rotate(150deg) saturate(1.6) brightness(1.1)" },
    "Pedra-guia do Bosque": { icon: "item_echo_crystal", price: 0, quest: true, filter: "hue-rotate(-25deg) saturate(1.5)" },
    // rodada 82: Ato V (Fenda Cintilante) e equipamento nível 5
    "Fragmento cintilante": { icon: "item_star_fragment", price: 90 },
    "Barra estelar": { icon: "item_star_bar", price: 260 },
    "Fragmento do selo": { icon: "item_seal_fragment", price: 0, quest: true }, // rodada 83 (Ato V)
    "Lasca do coração": { icon: "item_lumita", price: 0, quest: true, filter: "brightness(1.3) saturate(1.4) drop-shadow(0 0 2px #7fe8ff)" }, // rodada 81 (Ato IV)
    "Juramento do guardião": { icon: "item_fragment", price: 0, quest: true, filter: "sepia(0.8) saturate(1.3) brightness(1.05)" }, // rodada 80 (Ato III)
    "Cristal uivante": { icon: "item_echo_crystal", price: 0, quest: true, filter: "hue-rotate(40deg) saturate(0.6) brightness(1.25)" }, // rodada 79 (Ato II)
    // rodada 79: tônicos da Juna (alquimia, liberada no Ato II). buff = efeito em VD.BUFFS
    "Tônico de vigor": { icon: "item_potion", price: 14, buff: "vigor", filter: "hue-rotate(95deg) saturate(1.3)" },
    "Elixir do lobo": { icon: "item_potion_strength", price: 22, buff: "lobo", filter: "hue-rotate(-30deg) saturate(0.7) brightness(1.1)" },
    "Unguento de casca": { icon: "item_potion_stone", price: 20, buff: "casca", filter: "sepia(0.6) hue-rotate(-15deg) saturate(1.4)" },
    "Amuleto dos ecos": { icon: "item_amulet_echo", price: 1400, slot: "amuleto", rarity: "epico", bonus: { acc: 3, dmg: 3, def: 5 } }, // rodada 23: 4/4/6 → 3/3/5 (Golem Ancião caía 15% mais rápido; a Coroa, 9%)
    "Coroa do Ancião": { icon: "item_amulet_crown", price: 900, slot: "amuleto", rarity: "epico", bonus: { def: 8, dmg: 2, gather: 5 } },
    // rodada 104: peças novas do boneco (capacete, calça, botas e capa); criadas no Artesanato ou achadas nos baús
    "Capuz de couro": { icon: "item_helm_leather", price: 18, slot: "capacete", rarity: "comum", bonus: { def: 1 }, look: ["hood", "#c08a5a"] },
    "Elmo de ferro": { icon: "item_helm_iron", price: 140, slot: "capacete", rarity: "raro", bonus: { def: 3 }, look: ["helm", "#d0d4e0"] },
    "Elmo de lumita": { icon: "item_helm_lumita", price: 620, slot: "capacete", rarity: "epico", bonus: { def: 4, acc: 2 }, look: ["helm", "#92eaf8"] },
    "Calça de couro": { icon: "item_pants_leather", price: 18, slot: "calca", rarity: "comum", bonus: { def: 1 }, look: ["pants", "#b8865c"] },
    "Grevas de ferro": { icon: "item_pants_iron", price: 150, slot: "calca", rarity: "raro", bonus: { def: 3 }, look: ["greaves", "#d0d4e0"] },
    "Grevas de lumita": { icon: "item_pants_lumita", price: 640, slot: "calca", rarity: "epico", bonus: { def: 4, dmg: 1 }, look: ["greaves", "#92eaf8"] },
    "Botas de couro": { icon: "item_boots_leather", price: 14, slot: "botas", rarity: "comum", bonus: { def: 1, gather: 2 }, look: ["boots", "#b07a4a"] },
    "Botas de viajante": { icon: "item_boots_travel", price: 160, slot: "botas", rarity: "raro", bonus: { def: 2, gather: 5 }, look: ["boots", "#8a6650"] },
    "Botas de lumita": { icon: "item_boots_lumita", price: 560, slot: "botas", rarity: "epico", bonus: { def: 3, acc: 2 }, look: ["bootsplate", "#92eaf8"] },
    "Capa de pele": { icon: "item_cape_pelt", price: 40, slot: "capa", rarity: "comum", bonus: { def: 1, acc: 1 }, look: ["cape", "#c0c0c8"] },
    "Capa do caçador": { icon: "item_cape_hunter", price: 200, slot: "capa", rarity: "raro", bonus: { acc: 2, dmg: 1 }, look: ["cape", "#64a85c"] },
    "Manto das ruínas": { icon: "item_cape_ruins", price: 780, slot: "capa", rarity: "epico", bonus: { dmg: 2, def: 3, acc: 1 }, look: ["cape", "#9a5cd0"] },
    // rodada 104: as roupas típicas dos heróis viraram peças (qualquer herói veste; o Bento vende)
    "Túnica do guerreiro": { icon: "item_armor", filter: "hue-rotate(-30deg) saturate(1.8)", price: 16, buy: 45, slot: "armadura", rarity: "comum", bonus: { def: 1, dmg: 1 }, look: ["tunic", null] },
    "Capa de viagem": { icon: "item_cape_pelt", filter: "sepia(1) saturate(1.6) brightness(0.9)", price: 10, buy: 30, slot: "capa", rarity: "comum", bonus: { def: 1 }, look: ["cape", "#b07a4a"] },
    "Manto do místico": { icon: "item_armor", filter: "hue-rotate(220deg) saturate(1.6)", price: 16, buy: 45, slot: "armadura", rarity: "comum", bonus: { def: 1, acc: 1 }, look: ["robe", null] },
    "Capuz do místico": { icon: "item_helm_leather", filter: "hue-rotate(230deg) saturate(1.8)", price: 9, buy: 25, slot: "capacete", rarity: "comum", bonus: { acc: 1 }, look: ["mhood", null] },
    "Roupa de caçador": { icon: "item_armor", filter: "hue-rotate(60deg) saturate(1.4)", price: 16, buy: 45, slot: "armadura", rarity: "comum", bonus: { def: 1, acc: 1 }, look: ["hunter", null] },
    "Chapéu de caçador": { icon: "item_helm_leather", filter: "hue-rotate(70deg) saturate(1.6)", price: 9, buy: 25, slot: "capacete", rarity: "comum", bonus: { acc: 1 }, look: ["hat", null] },
  };
  // rodada 104: munição do arqueiro (vai inteira para o espaço de munição; cada tiro gasta 1)
  Object.assign(ITEMS, {
    "Flecha de madeira": { icon: "item_arrows_wood", price: 1, slot: "municao", sec: "flecha", rarity: "comum", bonus: {}, ammo: true, buy: 8, buyN: 10 },
    "Flecha de ferro": { icon: "item_arrows_iron", price: 3, slot: "municao", sec: "flecha", rarity: "raro", bonus: { dmg: 1 }, ammo: true },
    "Flecha de lumita": { icon: "item_arrows_lumita", price: 8, slot: "municao", sec: "flecha", rarity: "epico", bonus: { dmg: 2, acc: 2 }, ammo: true },
    // rodada 105: secundária do Guerreiro (escudo, aparece no braço) e do Místico (orbe, flutua junto da mão)
    "Escudo de madeira": { icon: "item_shield_wood", price: 22, buy: 60, slot: "municao", sec: "escudo", rarity: "comum", bonus: { def: 2 }, look: ["shield", "#a8703e"] },
    "Escudo de ferro": { icon: "item_shield_iron", price: 160, slot: "municao", sec: "escudo", rarity: "raro", bonus: { def: 4, acc: 1 }, look: ["shield", "#d0d4e0"] },
    "Escudo de lumita": { icon: "item_shield_lumita", price: 650, slot: "municao", sec: "escudo", rarity: "epico", bonus: { def: 6, dmg: 1 }, look: ["shield", "#92eaf8"] },
    "Orbe de quartzo": { icon: "item_orb_quartz", price: 22, buy: 60, slot: "municao", sec: "orbe", rarity: "comum", bonus: { acc: 2, dmg: 1 }, look: ["orb", "#f2d6e6"] },
    "Orbe de âmbar": { icon: "item_orb_amber", price: 160, slot: "municao", sec: "orbe", rarity: "raro", bonus: { acc: 3, dmg: 2 }, look: ["orb", "#f0a040"] },
    "Orbe de lumita": { icon: "item_orb_lumita", price: 650, slot: "municao", sec: "orbe", rarity: "epico", bonus: { acc: 4, dmg: 3 }, look: ["orb", "#78e0f6"] },
    // livros do Místico (mesmo espaço do orbe): menos dano, mais defesa
    "Tomo do aprendiz": { icon: "item_book_apprentice", price: 22, buy: 60, slot: "municao", sec: "orbe", rarity: "comum", bonus: { acc: 1, def: 2 }, look: ["book", "#9a5cc8"] },
    "Grimório de âmbar": { icon: "item_book_amber", price: 160, slot: "municao", sec: "orbe", rarity: "raro", bonus: { acc: 2, def: 3, dmg: 1 }, look: ["book", "#b8502e"] },
    "Códice de lumita": { icon: "item_book_lumita", price: 650, slot: "municao", sec: "orbe", rarity: "epico", bonus: { acc: 3, def: 4, dmg: 2 }, look: ["book", "#3c6eb4"] },
    // rodada 105: braceletes (espaço próprio)
    "Bracelete de couro": { icon: "item_bracelet_leather", price: 14, buy: 40, slot: "bracelete", rarity: "comum", bonus: { acc: 1, def: 1 } },
    "Bracelete de ferro": { icon: "item_bracelet_iron", price: 140, slot: "bracelete", rarity: "raro", bonus: { def: 2, dmg: 1 } },
    "Bracelete de lumita": { icon: "item_bracelet_lumita", price: 560, slot: "bracelete", rarity: "epico", bonus: { acc: 2, dmg: 2, def: 1 } },
  });
  // rodada 105: o que vai na secundária de cada classe
  const SEC = { escudo: { name: "Escudo", who: "Guerreiro", empty: "⛨" }, flecha: { name: "Flechas", who: "Arqueiro", empty: "➶" }, orbe: { name: "Orbe ou livro", who: "Místico", empty: "◉" } };
  // rodada 104: espaços do boneco que recebem itens da mochila (a arma e o peitoral são as peças forjadas na bigorna, em GEAR).
  // A munição só vale para arqueiros: o espaço aparece trancado até existir um arco no jogo.
  const EQUIP_SLOTS = {
    capacete: { name: "Capacete", empty: "⌒" }, armadura: { name: "Peitoral", empty: "▣" }, arma: { name: "Arma", empty: "⚔" }, amuleto: { name: "Amuleto", empty: "◇" }, calca: { name: "Calça", empty: "∏" },
    botas: { name: "Botas", empty: "▂" }, capa: { name: "Capa", empty: "▽" }, anel: { name: "Anel", empty: "○" },
    bracelete: { name: "Bracelete", empty: "◎" }, // rodada 105
    municao: { name: "Secundária", empty: "◈", sec: true }, // rodada 105: escudo (Guerreiro), flechas (Arqueiro) ou orbe (Místico) — VD.SEC
    mochila: { name: "Mochila", empty: "▤" }, // rodada 112: mais espaços e mais carga (aparece nas costas do herói)
  };

  // Recursos: nível exigido, XP, cargas (quantas vezes rende antes de esgotar) e tempo para voltar (s)
  const RES = {
    tree: { name: "Árvore", skill: "corte", tool: "machado", req: 1, item: "Madeira", xp: 6, charges: [2, 5], respawn: [8, 14], empty: "stump", verb: "Cortar", fx: ["#7a5a2a", "#4c9a3c"] },
    tree_oak: { name: "Carvalho", skill: "corte", tool: "machado", req: 8, item: "Madeira de carvalho", xp: 11, charges: [3, 6], respawn: [14, 22], empty: "stump", verb: "Cortar", fx: ["#4a2e16", "#6b9a3a"] },
    tree_cedar: { name: "Cedro-rubro", skill: "corte", tool: "machado", req: 18, item: "Madeira de cedro", xp: 16, charges: [3, 7], respawn: [22, 32], empty: "stump", verb: "Cortar", fx: ["#7a2a1a", "#d0663a"] },
    rock: { name: "Veio de cobre", skill: "mineracao", tool: "picareta", req: 1, item: "Cobre", xp: 7, charges: [1, 3], respawn: [7, 11], empty: "rubble", verb: "Minerar", fx: ["#b0b0b0", "#c97a3a"] },
    rock_iron: { name: "Veio de ferro", skill: "mineracao", tool: "picareta", req: 8, item: "Ferro", xp: 12, charges: [1, 3], respawn: [12, 18], empty: "rubble", verb: "Minerar", fx: ["#9a98a0", "#9c4a2e"] },
    rock_lumita: { name: "Veio de lumita", skill: "mineracao", tool: "picareta", req: 18, item: "Lumita", xp: 18, charges: [1, 2], respawn: [25, 35], empty: "rubble", verb: "Minerar", fx: ["#8a8a9a", "#5fe0ff"] },
    // rodada 104: plantas (foice). Ficam no fim das tabelas de cada região, então o resto do mapa não muda de lugar
    res_herb: { name: "Moita de ervas", skill: "herbalismo", tool: "foice", req: 1, item: "Erva-cidreira", xp: 6, charges: [2, 4], respawn: [10, 16], empty: "herb_cut", verb: "Colher", fx: ["#5aa046", "#b8e08a"] },
    res_flower: { name: "Canteiro de flor-de-mel", skill: "herbalismo", tool: "foice", req: 5, item: "Flor-de-mel", xp: 10, charges: [2, 4], respawn: [12, 18], empty: "herb_cut", verb: "Colher", fx: ["#f2c94c", "#5aa046"] },
    res_moonlily: { name: "Lírio-da-lua", skill: "herbalismo", tool: "foice", req: 12, item: "Lírio-da-lua", xp: 16, charges: [1, 3], respawn: [18, 26], empty: "herb_cut", verb: "Colher", fx: ["#dce8ff", "#3c7a6e"] },
    res_crystalbloom: { name: "Flor de cristal", skill: "herbalismo", tool: "foice", req: 20, item: "Flor de cristal", xp: 22, charges: [1, 2], respawn: [24, 34], empty: "herb_cut", verb: "Colher", fx: ["#8ae6f6", "#b0a0f0"] },
    fishspot: { name: "Cardume raso", skill: "pesca", tool: "vara", req: 1, xp: 6, charges: [4, 9], verb: "Pescar", fx: ["#8fc1ee", "#ffffff"],
      fish: [{ item: "Lambari cru", req: 1, xp: 6 }] },
    fishspot_deep: { name: "Cardume fundo", skill: "pesca", tool: "vara", req: 1, xp: 6, charges: [4, 9], verb: "Pescar", fx: ["#8fc1ee", "#ffffff"],
      fish: [{ item: "Tucunaré cru", req: 10, xp: 12 }, { item: "Lambari cru", req: 1, xp: 6 }] },
  };

  // Monstros: nível, vida, ataque/defesa (contra os do jogador), dano máx., velocidade (ticks por ataque),
  // raio de agressão, moedas e drops [item, chance, qtd mín, qtd máx]. scale/tint = variações visuais.
  const MOBS = {
    slime: { name: "Slime", spr: "slime", lvl: 2, hp: 5, atk: 1, def: 0, maxHit: 2, speed: 4, aggro: 0, coins: [2, 6], where: "Campos de Lumeira",
      drops: [["Gosma", 0.5], ["Núcleo de slime", 1 / 50]], color: "#7fd36b", squish: true },
    slime_blue: { name: "Slime azul", spr: "mob_slime_blue", lvl: 4, hp: 9, atk: 3, def: 2, maxHit: 2, speed: 4, aggro: 0, coins: [3, 8],
      where: "Campos de Lumeira", drops: [["Gosma", 0.6], ["Núcleo de slime", 1 / 40]], color: "#6fb8ff", squish: true },
    boar: { name: "Javali", spr: "mob_boar", lvl: 6, hp: 16, atk: 6, def: 4, maxHit: 3, speed: 4, aggro: 0, coins: [5, 12], where: "Bosque dos Carvalhos",
      drops: [["Couro de javali", 0.7], ["Carne de javali", 0.6], ["Âmbar antigo", 1 / 60]], color: "#8a5a3a" },
    goblin: { name: "Goblin saqueador", spr: "mob_goblin", lvl: 9, hp: 20, atk: 9, def: 6, maxHit: 4, speed: 3, aggro: 2, /* rodada 60: 3 -> 2 (bando acorda menos de uma vez: 0,96 -> 0,46 morte em 30 min no robô) */ coins: [6, 14], where: "Acampamento goblin (leste)",
      drops: [["Cobre", 0.35, 1, 3], ["Barra de bronze", 0.2], ["Poção de vida", 0.08], ["Poção de força", 0.05], ["Anel do caçador", 1 / 80], ["Âmbar antigo", 1 / 45]], color: "#6fae3a" },
    wolf: { name: "Lobo sombrio", spr: "mob_wolf", lvl: 12, hp: 28, atk: 12, def: 9, maxHit: 5, speed: 3, aggro: 4, coins: [10, 24], where: "Mata Sombria",
      drops: [["Pele de lobo", 0.7], ["Presa lunar", 1 / 60]], color: "#888888" },
    wolf_alpha: { name: "Lobo alfa", spr: "mob_wolf_alpha", lvl: 15, hp: 40, atk: 15, def: 11, maxHit: 7, speed: 3, aggro: 5,
      coins: [18, 36], where: "Mata Sombria (raro)", drops: [["Pele de lobo", 1, 1, 2], ["Anel do caçador", 1 / 12], ["Presa lunar", 1 / 30]], color: "#555555" },
    skeleton: { name: "Esqueleto errante", spr: "mob_skeleton", lvl: 16, hp: 36, atk: 15, def: 12, maxHit: 5, speed: 4, aggro: 3, /* rodada 18: 6→5 de dano, aggro 4→3 (bando menos grudento) */ respawn: 20, /* rodada 90: 12 → 20 s (o bando de 8 renascia mais rápido do que o herói derrubava: robô preso 14–20 min entre a entrada e o Senhor) */ coins: [14, 30], where: "Ruínas Esquecidas",
      marker: { fx: "fx_soul_wisp", t: 6, light: "rgba(180,110,255,A)" }, // fogo-fátuo nos 6 s finais (luz roxa à noite)
      drops: [["Ferro", 0.4, 1, 2], ["Barra de ferro", 0.2], ["Amuleto do coletor", 1 / 80], ["Fragmento ancestral", 1 / 70]], color: "#e8e0c8" },
    golem: { name: "Golem de musgo", spr: "mob_golem", lvl: 20, hp: 55, atk: 18, def: 16, maxHit: 8, speed: 5, aggro: 2, coins: [25, 60], where: "Planalto de Lumita", special: "Golpe pesado!", /* rodada 20: aggro 3 → 2 (agrupados, puxavam uns aos outros) */
      marker: { fx: "fx_rock_rubble", t: 2 }, // pedras rolam para o ponto de renascimento nos 2 s finais (Blender)
      drops: [["Lumita", 0.5], ["Amuleto de musgo", 1 / 50], ["Coração de musgo", 1 / 40]], color: "#7fb86b" },
    slime_crystal: { name: "Slime de lumita", spr: "mob_slime_crystal", lvl: 18, hp: 34, atk: 16, def: 18, maxHit: 5, speed: 4, special: "Salto esmagador!",
      aggro: 2, coins: [12, 26], where: "Planalto de Lumita", drops: [["Lumita", 0.6, 1, 2], ["Poção de pedra", 0.06], ["Amuleto do coletor", 1 / 40]], color: "#7fe8ff", squish: true,
      riseFx: false, // rodada 21: renasce de uma poça de cristal (folha "rise_up"), sem poeira
      marker: { fx: "fx_crystal_glint", t: 2.5, light: "rgba(110,230,255,A)" } }, // rodada 22: a poça brilha nos 2,5 s antes
    boss: { name: "Senhor das Ruínas", spr: "mob_boss_ruins", lvl: 28, hp: 300, // rodada 11: 200 → 300 de vida, ataque 24 → 26 (robô contra chefes)
      atk: 26, def: 20, maxHit: 14, speed: 4, aggro: 5, coins: [180, 320], where: "Coração das Ruínas (chefe)", boss: true, respawn: 120, summon: "skeleton",
      enrage: { row: "enrage", fx: "fx_enrage_aura", summon: 3, light: "rgba(170,80,255,A)" }, // rodada 22: fúria abaixo de 30% (folha "enrage", aura roxa, +3 esqueletos)
      drops: [["Barra de lumita", 1, 2, 3], ["Anel ancestral", 0.25], ["Fragmento ancestral", 0.5], ["Presa lunar", 0.15]], color: "#b07aff" },
    // guardião da cripta (masmorra): só aparece lá dentro
    crypt_guard: { name: "Guardião da cripta", spr: "mob_crypt_guardian", lvl: 22, hp: 70, atk: 20, def: 17, maxHit: 8, speed: 4, aggro: 5,
      coins: [30, 60], where: "Cripta das Ruínas", noBounty: true, drops: [["Barra de aço", 0.5, 1, 2], ["Amuleto do coletor", 1 / 15], ["Fragmento ancestral", 1 / 10]], color: "#d8d0b8" },
    // mini-chefes (rodada 9): Colosso da missão "O guardião desperto" (cripta) e o Alfa do evento Lua cheia
    crypt_colossus: { name: "Colosso de lumita", spr: "mob_lumita_colossus", lvl: 26, hp: 230, /* rodada 19: 150 → 230 e dano 10 → 12 (caía em 36 s com 1 cura) */
      atk: 22, def: 19, maxHit: 12, speed: 5, aggro: 6, coins: [80, 150], where: "Cripta das Ruínas (missão)", noBounty: true, mini: true, special: "Golpe de cristal!",
      drops: [["Barra de lumita", 1, 1, 2], ["Lumita", 1, 2, 4], ["Fragmento ancestral", 0.5]], color: "#7fe8ff", deathFx: "fx_crystal_shards" },
    wolf_moon: { name: "Alfa da lua cheia", spr: "mob_wolf_moon", lvl: 18, hp: 110, /* rodada 18: 75 → 110 (caía em 19 s no Combate 18) */
      atk: 18, def: 13, maxHit: 8, speed: 3, aggro: 7, coins: [60, 110], where: "Mata Sombria (Lua cheia)", noBounty: true, mini: true,
      drops: [["Pele de lobo", 1, 2, 3], ["Presa lunar", 1], ["Anel do caçador", 1 / 6]], color: "#b8d8ff" },
    // rodada 78: Capataz Rasgo (campanha, Ato I): só existe com a missão "O bando do Capataz" nesse passo. Chama 2 goblins na metade
    // da vida e fica furioso abaixo de 30%.
    goblin_boss: { name: "Capataz Rasgo", spr: "mob_goblin_boss", lvl: 12, /* rodada 79: arte própria (Flow + Blender) no lugar do goblin tingido */ hp: 100, /* robô (r78, 10 lutas, Preciso, sem Q nem esquiva): 120/14/6 → 100/11/5 */
      atk: 11, def: 10, maxHit: 5, speed: 3, aggro: 5, coins: [40, 70], where: "Acampamento goblin (missão)", noBounty: true, mini: true, light: "rgba(255,150,70,A)",
      summon: "goblin", summonCry: "Pega ele, cambada!", enrage: { fx: "fx_enrage_aura", light: "rgba(255,140,60,A)" },
      drops: [["Barra de ferro", 1, 1, 2], ["Poção de força", 0.5]], color: "#d8a060" },
    // rodada 82: Fenda Cintilante (Combate 35+), só na masmorra. Robô (Preciso, sem Q nem esquiva): os números de partida derrubavam
    // Combate 35–40 em 4–5 de 6 descidas; reduzidos (vida/ataque) até Combate 38 limpar 6 de 8 com ~13 peixes
    quartz_spider: { name: "Aranha de quartzo", spr: "mob_quartz_spider", lvl: 36, hp: 90, atk: 34, def: 30, maxHit: 11, speed: 2, aggro: 5, coins: [40, 70],
      where: "Fenda Cintilante", noBounty: true, drops: [["Fragmento cintilante", 0.6, 1, 2], ["Lumita", 0.5, 1, 3]], color: "#d8f4ff" },
    crystal_sentinel: { name: "Sentinela de cristal", spr: "mob_crystal_sentinel", lvl: 38, hp: 150, atk: 36, def: 32, maxHit: 13, speed: 5, aggro: 4, coins: [60, 100],
      where: "Fenda Cintilante", noBounty: true, special: "Golpe de cristal!", drops: [["Fragmento cintilante", 1, 1, 3], ["Barra de lumita", 0.3]], color: "#7fe8ff" },
    light_wraith: { name: "Espectro de luz", spr: "mob_light_wraith", lvl: 37, hp: 85, atk: 38, def: 26, maxHit: 12, speed: 3, aggro: 6, coins: [50, 90],
      where: "Fenda Cintilante", noBounty: true, drops: [["Fragmento cintilante", 0.8, 1, 2], ["Poção de força", 0.2]], color: "#ffffff" },
    boss_serpent: { name: "Serpente de Lumita", spr: "mob_boss_serpent", lvl: 45, hp: 480, atk: 40, def: 32, maxHit: 16, speed: 4, aggro: 6, coins: [800, 1300],
      where: "Fundo da Fenda Cintilante (chefe)", boss: true, slam: true, noBounty: true, enrage: { fx: "fx_enrage_aura", light: "rgba(150,240,255,A)" },
      drops: [["Fragmento cintilante", 1, 4, 7], ["Barra estelar", 0.5], ["Coroa do Ancião", 0.15]], color: "#bff6ff" },
    // rodada 83: eco semanal da Serpente (quadro de caçadas, depois de vencê-la); desperta na entrada da Fenda
    echo_serpent: { name: "Eco da Serpente de Lumita", spr: "mob_boss_serpent_echo", lvl: 48, hp: 620, atk: 44, def: 34, maxHit: 18, speed: 4, aggro: 6, coins: [900, 1400],
      where: "Entrada da Fenda Cintilante (eco semanal)", boss: true, echo: "boss_serpent", echoHome: "rift", noBounty: true, slam: true, alpha: 0.78,
      enrage: { fx: "fx_enrage_aura", light: "rgba(190,230,255,A)" }, drops: [["Eco cristalizado", 1], ["Barra estelar", 1, 1, 2], ["Fragmento cintilante", 1, 3, 6]], color: "#d8f0ff" },
    // chefe do Planalto: a cada 3 golpes prepara um tremor em área (raio 2); abaixo de 30% de vida fica furioso (mais rápido)
    boss_golem: { name: "Golem Ancião", spr: "mob_boss_golem", lvl: 34, hp: 400, // rodada 11: 300 → 400 de vida, ataque 30 → 32
      atk: 32, def: 26, maxHit: 16, speed: 5, aggro: 4, coins: [300, 520], where: "Topo do Planalto (chefe)", boss: true, respawn: 150, slam: true,
      drops: [["Barra de lumita", 1, 2, 4], ["Amuleto de musgo", 0.33], ["Coroa do Ancião", 0.12], ["Coração de musgo", 0.5], ["Fragmento ancestral", 0.35], ["Poção de pedra", 0.5, 1, 2]], color: "#c8b060" },
    // rodada 22: ecos semanais dos chefes (quadro de caçadas, depois de vencer os dois chefes): mais fortes, sem renascer, 1 vitória por semana
    echo_ruins: { name: "Eco do Senhor das Ruínas", spr: "mob_boss_ruins", tint: "hue-rotate(150deg) saturate(1.3)", lvl: 36, hp: 480, atk: 44, def: 26, maxHit: 18, /* robô: 32 → 44 (com 32 nem acertava a defesa 50 da quarta hora) */
      speed: 4, aggro: 6, coins: [400, 650], where: "Coração das Ruínas (eco semanal)", boss: true, echo: "boss", noBounty: true, summon: "skeleton",
      enrage: { row: "enrage", fx: "fx_enrage_aura", summon: 3, light: "rgba(90,220,255,A)" },
      drops: [["Eco cristalizado", 1], ["Barra de lumita", 1, 3, 5], ["Fragmento ancestral", 1], ["Anel ancestral", 0.5]], color: "#7fe8ff" },
    echo_golem: { name: "Eco do Golem Ancião", spr: "mob_boss_golem", tint: "hue-rotate(150deg) saturate(1.3)", lvl: 42, hp: 640, atk: 38, def: 30, maxHit: 19,
      speed: 5, aggro: 5, coins: [600, 900], where: "Topo do Planalto (eco semanal)", boss: true, echo: "boss_golem", noBounty: true, slam: true,
      enrage: { fx: "fx_enrage_aura", light: "rgba(90,220,255,A)" }, // fúria do tremor (sem folha própria) com a aura
      drops: [["Eco cristalizado", 1], ["Barra de lumita", 1, 3, 6], ["Coração de musgo", 1], ["Coroa do Ancião", 0.35]], color: "#7fe8ff" },
  };

  // Habilidades ativas de combate (teclas Q, E, R): liberadas por nível de Combate, com recarga em segundos
  const ACTIVE = {
    spin: { name: "Golpe giratório", key: "Q", icon: "⟳", lvl: 5, cd: 8, mult: 1.2, desc: "Gira a lâmina e acerta todos os monstros ao seu redor." },
    dash: { name: "Investida", key: "E", icon: "➤", lvl: 12, cd: 12, mult: 1.3, range: 5, stun: 1.6, desc: "Avança até o alvo (até 5 passos) e o deixa atordoado." },
    smash: { name: "Golpe esmagador", key: "R", icon: "✸", lvl: 20, cd: 15, mult: 2.2, stun: 0.8, desc: "Carrega um golpe lento que sempre acerta, atordoa e solta uma onda de choque." },
  };

  // Missões com história curta (2-3 passos). ev = evento que conta; deliver = itens entregues ao NPC; talk = voltar a falar
  const QUESTS = {
    ecos: { giver: "guard", name: "Ecos da cripta", needTutorial: true,
      intro: "Desde que os esqueletos voltaram a andar, ouço passos sob as ruínas à noite. Descubra o que acordou lá embaixo.",
      steps: [{ text: "Derrote 5 esqueletos errantes nas Ruínas.", ev: "kill:skeleton", n: 5 },
        { text: "Abra o baú selado da Cripta das Ruínas.", ev: "crypt", n: 1 },
        { text: "Conte ao Guarda Ivo o que encontrou na cripta.", talk: true }],
      outro: "Um guardião de armadura antiga... então era isso. Fique com este anel: a guarda de Lumeira agradece.",
      reward: { coins: 300, xp: { combate: 800 }, item: "Anel do caçador", aff: 2 } },
    cancao: { giver: "bard", name: "A canção do Ancião",
      intro: "Escrevo uma balada sobre o Golem Ancião, mas me falta o final. Primeiro, um bardo precisa comer bem...",
      steps: [{ text: "Leve 3 tucunarés assados ao Tomé.", deliver: { "Tucunaré assado": 3 } },
        { text: "Derrote o Golem Ancião no alto do Planalto.", ev: "kill:boss_golem", n: 1 },
        { text: "Volte ao Tomé para ouvir a canção completa.", talk: true }],
      outro: "\"...e o gigante de musgo dorme de novo, vencido por quem não saiu do círculo.\" Perfeito! Este amuleto é seu.",
      reward: { coins: 500, xp: { combate: 1500 }, item: "Amuleto de musgo", aff: 2 } },
    estrada: { giver: "guard", name: "Estrada do leste", needTutorial: true,
      intro: "Os goblins do bosque andam assaltando as carroças na estrada do leste. Afaste esse bando antes da feira.",
      steps: [{ text: "Derrote 8 goblins saqueadores no Bosque dos Carvalhos (Combate 10+, um de cada vez).", ev: "kill:goblin", n: 8 },
        { text: "Avise o Guarda Ivo que a estrada está livre.", talk: true }],
      outro: "As carroças voltaram a passar. Leve estas poções: na próxima vez, o bando vai estar maior.",
      reward: { coins: 200, xp: { combate: 600 }, items: { "Poção de força": 2 } } },
    guardiao: { giver: "guard", name: "O guardião desperto", after: "ecos",
      intro: "O selo do baú rachou quando você o abriu. Agora algo enorme, feito de lumita, guarda o fundo da cripta. Dê um fim nisso.",
      steps: [{ text: "Derrote o Colosso de lumita no fundo da Cripta das Ruínas.", ev: "kill:crypt_colossus", n: 1 },
        { text: "Conte ao Guarda Ivo que a cripta está em paz.", talk: true }],
      outro: "Lumita viva... Os antigos selaram mais do que mortos ali. Fique com este anel ancestral: ele é seu por direito.",
      reward: { coins: 600, xp: { combate: 2000 }, item: "Anel ancestral", aff: 2 } },
    balada: { giver: "bard", name: "A balada da lua cheia", needTutorial: true,
      intro: "Nas noites de lua cheia, um alfa prateado uiva na Mata Sombria. Quero terminar uma balada sobre ele — mas preciso de quem o tenha enfrentado.",
      steps: [{ text: "Derrote o Alfa da lua cheia duas vezes (evento Lua cheia, à noite).", ev: "kill:wolf_moon", n: 2 },
        { text: "Volte ao Tomé e conte como foi a caçada.", talk: true }],
      outro: "\"...e a lua, de prata, curvou-se ao caçador.\" Que verso! Leve este amuleto: ele brilha como o olho do alfa.",
      reward: { coins: 400, xp: { combate: 1200 }, items: { "Presa lunar": 1 }, item: "Amuleto de âmbar", aff: 2 } },
    encomenda: { giver: "shop", name: "A encomenda do Bento",
      intro: "Um carpinteiro da capital quer ferragens e carvalho de Lumeira. Se você me trouxer o material, divido o lucro.",
      steps: [{ text: "Leve 5 barras de ferro e 10 madeiras de carvalho ao Bento.", deliver: { "Barra de ferro": 5, "Madeira de carvalho": 10 } },
        { text: "Volte a falar com o Bento para receber sua parte.", talk: true }],
      outro: "Negócio fechado! Esse amuleto veio de brinde no lote — acho que combina mais com você do que comigo.",
      reward: { coins: 450, xp: { ferraria: 600, corte: 300 }, item: "Amuleto do coletor", aff: 1 } },
    // rodada 97: missões curtas da Juna, uma por fase do filhote da lua (vínculo 1, 7 e 14). "petkill" = abate em que a última mordida foi dele.
    f1_dentes: { giver: "herb", name: "Dentes de leite", after: "c2_uivo", minBond: 1,
      intro: "Esse aí morde a barra da minha saia e acha que é caçada. Deixe ele derrubar uns bichos de verdade. Os pequenos, por favor.",
      steps: [{ text: "Deixe o filhote dar a última mordida em 10 monstros.", ev: "petkill", n: 10 },
        { text: "Conte à Juna como ele se saiu.", talk: true }],
      outro: "Dez? Com esses dentes de leite? Tome. Para você e, se sobrar, para ele.",
      reward: { coins: 150, xp: { combate: 400 }, items: { "Carne assada": 5, "Tônico de vigor": 1 } } },
    f2_faro: { giver: "herb", name: "Faro de lobo", after: "f1_dentes", minBond: 7,
      intro: "Cresceu. Agora fareja longe, e é hora de ele aprender quem manda na Mata. Traga peles, que eu faço uma faixa para o pescoço dele.",
      steps: [{ text: "Deixe o filhote dar a última mordida em 25 monstros.", ev: "petkill", n: 25 },
        { text: "Leve 3 peles de lobo à Juna.", deliver: { "Pele de lobo": 3 } },
        { text: "Busque a faixa com a Juna.", talk: true }],
      outro: "Pronto. Casca de carvalho e pele de lobo: quem cheirar sabe que ele tem casa.",
      reward: { coins: 300, xp: { combate: 900, culinaria: 200 }, items: { "Elixir do lobo": 2 } } },
    f3_uivo: { giver: "herb", name: "Uivo próprio", after: "f2_faro", minBond: 14, minCombat: 20,
      intro: "Ontem ele uivou para a lua e a Mata inteira respondeu. Não é mais filhote. Leve ele aonde os bichos são de pedra e osso.",
      steps: [{ text: "Deixe o filhote dar a última mordida em 40 monstros.", ev: "petkill", n: 40 },
        { text: "Volte à Juna.", talk: true }],
      outro: "A matilha da lua tem um alfa de novo. Só que esse escolheu andar com gente. Cuide dele, que ele cuida de você.",
      reward: { coins: 600, xp: { combate: 2400 }, items: { "Elixir do lobo": 2, "Tônico de vigor": 2 } } },
  };

  // rodada 78: campanha "Os Marcos de Lumeira", Ato I (Rachaduras). Missões normais com campos a mais:
  // act (ato), scene (cena ao aceitar), next (aceita a próxima sozinha), steps[].to (NPC que conclui a conversa), steps[].at (marco
  // onde se entrega), steps[].scene (cena do passo), steps[].gives (itens ao concluir o passo), steps[].take (itens que o NPC fica na conversa), steps[].goal (para onde aponta a seta)
  Object.assign(QUESTS, {
    c1_tremor: { giver: "guard", act: 1, name: "O tremor da madrugada", needTutorial: true, scene: "c1_intro", next: "c1_marco",
      intro: "Três tremores numa noite só, e os pastores juram que o chão dos Campos se abriu em fendas que brilham. Vá ver de perto.",
      steps: [{ text: "Examine as 3 fendas brilhantes nos Campos de Lumeira.", ev: "inspect:crack", n: 3, goal: "cracks" },
        { text: "Mostre a lasca rúnica ao Tomé, na fogueira da praça.", talk: true, to: "bard", take: { "Lasca rúnica": 1 }, scene: "c1_shard" }],
      outro: "Cinco pedras de luz, em roda... Vá ao marco dos Campos. E leve bronze!",
      reward: { coins: 90, xp: { combate: 400, mineracao: 120 }, /* rodada 91: 250 -> 400 */ items: { "Poção de vida": 2 } } },
    c1_marco: { giver: "bard", act: 1, name: "O Marco dos Campos", after: "c1_tremor",
      intro: "Se uma lasca saiu da fenda, o marco dos Campos está rachado. Leve bronze até ele: pedra velha se conserta com metal novo.",
      steps: [{ text: "Leve 3 barras de bronze ao Marco dos Campos, a oeste da vila.", deliver: { "Barra de bronze": 3 }, at: "fields", scene: "c1_repair" },
        { text: "Defenda o marco das criaturas que saem da terra.", ev: "wave:fields", n: 6, goal: "marker:fields" },
        { text: "Conte ao Guarda Ivo que o marco voltou a brilhar.", talk: true, to: "guard", scene: "c1_lit" }],
      outro: "Descanse perto do marco quando precisar: a luz dos fundadores fecha feridas.",
      reward: { coins: 150, xp: { combate: 900, ferraria: 150 }, /* rodada 91: 450 -> 900 (Combate ~7 antes do Capataz) */ items: { "Poção de vida": 3 }, unlock: "Bênção do marco (vida volta mais rápido perto de um marco aceso)" } },
    c1_bando: { giver: "guard", act: 1, name: "O bando do Capataz", after: "c1_marco", minCombat: 8, scene: "c1_bando",
      intro: "O Bento voltou da estrada branco feito farinha: os goblins levaram uma pedra que brilha. Logo agora que os marcos acordam.",
      steps: [{ text: "Fale com o Bento sobre a pedra roubada.", talk: true, to: "shop", scene: "c1_bento" },
        { text: "Derrote 6 goblins saqueadores no Bosque dos Carvalhos.", ev: "kill:goblin", n: 6, goal: "camp" },
        { text: "Derrote o Capataz Rasgo no acampamento goblin (Combate 10+ recomendado).", ev: "kill:goblin_boss", n: 1, goal: "camp", gives: { "Pedra-guia do Bosque": 1 } },
        { text: "Leve a pedra-guia e 5 madeiras de carvalho (Corte 8) ao Marco do Bosque.", deliver: { "Pedra-guia do Bosque": 1, "Madeira de carvalho": 5 }, at: "east", scene: "c1_east" },
        { text: "Volte ao Guarda Ivo.", talk: true, to: "guard", scene: "c1_finale" }],
      outro: "Use o santuário ou qualquer marco aceso para viajar. O Marco da Mata ainda está apagado...",
      reward: { coins: 350, xp: { combate: 700, corte: 200 }, item: "Anel do caçador", aff: 1, unlock: "Pedras de passagem (viagem entre o santuário e os marcos acesos)" } },
  });

  // rodada 79: Ato II (A Mata que Escuta). Juna (NPC "herb") mora na cabana da beira da Mata Sombria; step.night = só à noite
  Object.assign(QUESTS, {
    c2_raizes: { giver: "guard", act: 2, name: "Raízes inquietas", after: "c1_bando", minCombat: 11, /* rodada 88: 12 -> 11 (o Ato I termina no 10–11; o treino até o 12 era 1/5 da comida) */ scene: "c2_intro",
      intro: "O Marco da Mata Sombria continua apagado, e os lobos uivam para ele. Quem conhece aquela mata é a raizeira Juna. Vá falar com ela.",
      steps: [{ text: "Encontre a raizeira Juna, na cabana da beira da Mata Sombria.", talk: true, to: "herb", scene: "c2_juna" },
        { text: "Leve 4 peles de lobo (lobos da Mata) e 4 madeiras de carvalho (Corte 8) à Juna.", deliver: { "Pele de lobo": 4, "Madeira de carvalho": 4 }, to: "herb", scene: "c2_unguento" },
        { text: "Ouça o que a Juna descobriu.", talk: true, to: "herb", scene: "c2_ouvir" }],
      outro: "Agora você sabe preparar o que eu preparo. Use com juízo.", next: "c2_uivo",
      reward: { coins: 300, xp: { combate: 900, culinaria: 300 }, items: { "Tônico de vigor": 2 }, unlock: "Alquimia da Juna (tônicos de vigor, de lobo e de casca)" } },
    c2_uivo: { giver: "herb", act: 2, name: "O uivo sob a lua", after: "c2_raizes",
      intro: "O Alfa da lua cheia engoliu o cristal do marco. Por isso uiva para ele: quer o resto. Tire o cristal dele. (Recomendado: Combate 14+.)",
      steps: [{ text: "Derrote o Alfa da lua cheia (evento à noite na Mata ou na Toca dos Lobos; Combate 14+ recomendado).", ev: "kill:wolf_moon", n: 1, goal: "moon", gives: { "Cristal uivante": 1 } },
        { text: "Leve o cristal uivante à Juna.", talk: true, to: "herb", scene: "c2_cristal" }],
      outro: "Está frio como a lua. Ótimo. Hoje à noite, a gente devolve isso ao marco.", next: "c2_marco",
      reward: { coins: 350, xp: { combate: 1200 }, items: { "Elixir do lobo": 2 } } },
    c2_marco: { giver: "herb", act: 2, name: "O Marco da Mata", after: "c2_uivo",
      intro: "O ritual só funciona com a lua no céu. Leve o cristal e ferro para prender as pedras, e não deixe a matilha chegar perto.",
      steps: [{ text: "À noite, leve o cristal uivante e 3 barras de ferro (Mineração e Ferraria 8) ao Marco da Mata.", deliver: { "Cristal uivante": 1, "Barra de ferro": 3 }, at: "south", night: true, scene: "c2_ritual" },
        { text: "Resista à matilha que vem atrás da luz.", ev: "wave:south", n: 6, goal: "marker:south" },
        { text: "Volte à Juna.", talk: true, to: "herb", scene: "c2_finale" }],
      outro: "A mata respira de novo. Ouviu? Nenhum uivo.",
      reward: { coins: 500, xp: { combate: 1800 }, item: "Amuleto de âmbar", aff: 2, unlock: "Marco da Mata aceso: lobos não atacam por conta própria perto dele" } },
  });

  // rodada 80: Ato III (Os Mortos Lembram). Odília (NPC "carto") acampa na saída nordeste dos Campos, perto das Ruínas
  Object.assign(QUESTS, {
    c3_inscricoes: { giver: "guard", act: 3, name: "Inscrições", after: "c2_marco", minCombat: 18, scene: "c3_intro",
      intro: "Uma cartógrafa da capital acampou perto das Ruínas e anda copiando pedras. Ela quer escolta. Eu quero saber o que as pedras dizem.",
      steps: [{ text: "Fale com a cartógrafa Odília, na tenda perto da entrada das Ruínas.", talk: true, to: "carto", scene: "c3_odilia" },
        { text: "Copie as 4 inscrições rúnicas das Ruínas Esquecidas.", ev: "inspect:rune", n: 4, goal: "runes" },
        { text: "Leve as cópias à Odília.", talk: true, to: "carto", scene: "c3_traducao" }],
      outro: "Um juramento. Guardado no fundo da cripta. Fascinante!", next: "c3_juramento",
      reward: { coins: 450, xp: { combate: 1800 }, items: { "Poção de pedra": 2 } } },
    c3_juramento: { giver: "carto", act: 3, name: "O juramento", after: "c3_inscricoes",
      intro: "As inscrições falam de um juramento selado no baú da cripta. Traga-o, e eu leio para você. Com notas de rodapé.",
      steps: [{ text: "Abra o baú selado da Cripta das Ruínas.", ev: "crypt", n: 1, gives: { "Juramento do guardião": 1 } },
        { text: "Leve o juramento à Odília.", talk: true, to: "carto", scene: "c3_leitura" }],
      outro: "Ele não é um monstro. É um guarda que não pôde sair do posto.", next: "c3_guardiao",
      reward: { coins: 500, xp: { combate: 2000 } } },
    c3_guardiao: { giver: "carto", act: 3, name: "O guardião das Ruínas", after: "c3_juramento",
      intro: "Para o Senhor das Ruínas descansar, alguém precisa vencê-lo e devolver o juramento ao marco. Esse alguém é você. (Recomendado: Combate 25+.)",
      steps: [{ text: "Derrote o Senhor das Ruínas (Combate 25+ recomendado).", ev: "kill:boss", n: 1, goal: "boss" }, // rodada 88: robô no Combate 21 caía 3 vezes
        { text: "Leve o juramento e 3 barras de aço ao Marco das Ruínas.", deliver: { "Juramento do guardião": 1, "Barra de aço": 3 }, at: "ruins", scene: "c3_marco" },
        { text: "Conte à Odília.", talk: true, to: "carto", scene: "c3_finale" }],
      outro: "Quatro marcos. Falta só o Planalto, e o maior guardião de todos.",
      reward: { coins: 900, xp: { combate: 3000 }, item: "Anel ancestral", aff: 2, unlock: "Marco das Ruínas aceso: esqueletos não atacam por conta própria perto dele" } },
  });

  // rodada 81: Ato IV (O Coração de Lumita). Brás (NPC "miner") acampa na subida do Planalto, junto da estrada oeste
  Object.assign(QUESTS, {
    c4_veio: { giver: "guard", act: 4, name: "Veio vivo", after: "c3_guardiao", minCombat: 26, scene: "c4_intro",
      intro: "A Odília diz que o último marco é o coração de lumita do Planalto. Quem conhece aquele chão é o Brás, garimpeiro velho. Vá falar com ele.",
      steps: [{ text: "Fale com o garimpeiro Brás, no acampamento da subida do Planalto.", talk: true, to: "miner", scene: "c4_bras" },
        { text: "Leve 10 lumitas (Mineração 18) e 2 barras de aço (Ferraria 15) ao Brás, para a lanterna de garimpo.", deliver: { "Lumita": 10, "Barra de aço": 2 }, to: "miner", scene: "c4_lanterna" },
        { text: "Ouça o que o Brás viu com a lanterna acesa.", talk: true, to: "miner", scene: "c4_visao" }],
      outro: "Os golems não atacam por maldade. Estão fazendo o turno deles.", next: "c4_golems",
      reward: { coins: 700, xp: { combate: 2500, mineracao: 1200 }, items: { "Unguento de casca": 2 } } },
    c4_golems: { giver: "miner", act: 4, name: "Golems de pé", after: "c4_veio",
      intro: "Os golems de musgo fazem a guarda do caminho até o coração. Derrube oito, e o Golem Ancião vai ter que descer pessoalmente.",
      steps: [{ text: "Derrote 8 golems de musgo no Planalto.", ev: "kill:golem", n: 8, goal: "golems" },
        { text: "Volte ao Brás.", talk: true, to: "miner", scene: "c4_turno" }],
      outro: "Ouviu? O chão parou de bater. Agora só falta o grandão.", next: "c4_guardiao",
      reward: { coins: 800, xp: { combate: 3200 } } },
    c4_guardiao: { giver: "miner", act: 4, name: "O último guardião", after: "c4_golems",
      intro: "O Golem Ancião guarda o coração de lumita com o próprio corpo. Vença-o, pegue a lasca do coração e devolva ao lugar dela. (Recomendado: Combate 31+.)",
      steps: [{ text: "Derrote o Golem Ancião no alto do Planalto (Combate 31+ recomendado).", ev: "kill:boss_golem", n: 1, goal: "bossGolem", gives: { "Lasca do coração": 1 } },
        { text: "Leve a lasca e 3 barras de lumita ao Coração de lumita.", deliver: { "Lasca do coração": 1, "Barra de lumita": 3 }, at: "west", scene: "c4_coracao" },
        { text: "Volte ao Brás.", talk: true, to: "miner", scene: "c4_finale" }],
      outro: "Cinco luzes acesas. Quarenta anos de garimpo e eu nunca tinha visto o vale inteiro brilhar.",
      reward: { coins: 1500, xp: { combate: 5000 }, item: "Coroa do Ancião", aff: 2, unlock: "Coração de lumita aceso: golems e slimes de lumita não atacam por conta própria perto dele" } },
  });

  // rodada 82: Ato V, parte 1 (a Fenda Cintilante abre no Planalto depois do Ato IV)
  Object.assign(QUESTS, {
    c5_fenda: { giver: "miner", act: 5, name: "A fenda se abre", after: "c4_guardiao", minCombat: 34, scene: "c5_intro",
      intro: "Do outro lado do Planalto, o chão abriu uma fenda cheia de cristal. Alguém tem que ver o que tem lá no fundo. Eu é que não desço.",
      steps: [{ text: "Entre na Fenda Cintilante, no alto do Planalto, e abra o baú do fundo (Combate 38+ recomendado).", ev: "rift", n: 1, goal: "rift" },
        { text: "Conte ao Brás o que viu lá embaixo.", talk: true, to: "miner", scene: "c5_volta" }],
      outro: "Estelar. Esse metal não é deste vale. Leve à bigorna e veja o que sai.",
      reward: { coins: 2000, xp: { combate: 6000, ferraria: 1500 }, items: { "Barra estelar": 2 }, unlock: "Barra estelar na fornalha e equipamento estelar (nível 5) na bigorna" } },
    // rodada 83: Ato V, parte 2 (fim da campanha)
    c5_ecos: { giver: "carto", act: 5, name: "Ecos de cristal", after: "c5_fenda", scene: "c5_odilia",
      intro: "Os espectros de luz da Fenda repetem uma frase. Sempre a mesma. Preciso ouvir de perto. Bem, você precisa.",
      steps: [{ text: "Derrote 6 espectros de luz na Fenda Cintilante.", ev: "kill:light_wraith", n: 6 },
        { text: "Conte à Odília o que os espectros diziam.", talk: true, to: "carto", scene: "c5_frase" }],
      outro: "Um selo quebrado. É isso que a Serpente guarda: os pedaços dele.", next: "c5_serpente",
      reward: { coins: 2500, xp: { combate: 7000 }, items: { "Barra estelar": 1 } } },
    c5_serpente: { giver: "miner", act: 5, name: "A Serpente de Lumita", after: "c5_ecos",
      intro: "A Odília diz que o selo dos fundadores está no peito da Serpente. Tire de lá e encaixe no pedestal do fundo. Depois eu pago a cerveja.",
      steps: [{ text: "Derrote a Serpente de Lumita no fundo da Fenda (Combate 38+ recomendado).", ev: "kill:boss_serpent", n: 1, gives: { "Fragmento do selo": 1 } },
        { text: "Encaixe o fragmento no pedestal do selo, no fundo da Fenda.", ev: "seal", n: 1, goal: "seal" },
        { text: "Volte ao Brás.", talk: true, to: "miner", scene: "c5_finale" }],
      outro: "O vale dorme. E você tem cara de quem não vai dormir tão cedo.",
      reward: { coins: 5000, xp: { combate: 12000 }, item: "Anel ancestral", aff: 2, unlock: "Eco semanal da Serpente no quadro de caçadas" } },
  });

  // rodada 79: alquimia da Juna (janela dela, depois de "Raízes inquietas"). xp em Culinária
  const ALCHEMY = {
    "Tônico de vigor": { mats: { "Tucunaré cru": 1, "Madeira de carvalho": 1 }, lvl: 10, xp: 40, desc: "+1 de vida por segundo por 90 s" },
    "Elixir do lobo": { mats: { "Pele de lobo": 2, "Barra de ferro": 1 }, lvl: 12, xp: 60, desc: "+2 acerto e +2 dano por 2 min" },
    "Unguento de casca": { mats: { "Madeira de carvalho": 2, "Couro de javali": 2 }, lvl: 8, xp: 45, desc: "+4 defesa por 2 min" },
    // rodada 104: poções com as plantas do Herbalismo
    "Poção de vida": { mats: { "Erva-cidreira": 2, "Flor-de-mel": 1 }, lvl: 2, xp: 18, desc: "cura 18" },
    "Poção de força": { mats: { "Flor-de-mel": 2, "Lírio-da-lua": 1 }, lvl: 8, xp: 40, desc: "+dano por um tempo" },
    "Poção de pedra": { mats: { "Erva-cidreira": 2, "Flor de cristal": 1 }, lvl: 14, xp: 70, desc: "+defesa por um tempo" },
  };

  // Campanha inteira (rodada 78): o Ato I está no jogo; os outros são o plano das próximas rodadas e aparecem no diário como "em breve".
  const CAMPAIGN = { name: "Os Marcos de Lumeira",
    premise: "Os fundadores ergueram cinco marcos de lumita em volta do vale para manter adormecida a luz viva que corre sob Lumeira. Os cristais estão se apagando.",
    acts: [
      { n: 1, name: "Rachaduras", region: "Campos e Bosque", lvl: "Combate 3–12", quests: ["c1_tremor", "c1_marco", "c1_bando"],
        reward: "Marcos dos Campos e do Bosque acesos, bênção do marco e pedras de passagem" },
      { n: 2, name: "A Mata que Escuta", region: "Mata Sombria", lvl: "Combate 11–20", npc: "Juna, a raizeira", quests: ["c2_raizes", "c2_uivo", "c2_marco"],
        reward: "alquimia da Juna, Marco da Mata aceso e lobos calmos perto dele" },
      { n: 3, name: "Os Mortos Lembram", region: "Ruínas Esquecidas", lvl: "Combate 18–28", npc: "Odília, a cartógrafa", quests: ["c3_inscricoes", "c3_juramento", "c3_guardiao"],
        reward: "Marco das Ruínas aceso e esqueletos calmos perto dele" },
      { n: 4, name: "O Coração de Lumita", region: "Planalto de Lumita", lvl: "Combate 26–34", npc: "Brás, o garimpeiro", quests: ["c4_veio", "c4_golems", "c4_guardiao"],
        reward: "Coração de lumita aceso e golems calmos perto dele" },
      // rodada 81: desenho do Ato V (próximas rodadas): masmorra instanciada aberta no Planalto depois do Ato IV
      { n: 5, name: "Além do Selo", region: "Fenda Cintilante", lvl: "Combate 35+", npc: "Brás e Odília (de volta)", quests: ["c5_fenda", "c5_ecos", "c5_serpente"], reward: "fim de jogo: Fenda Cintilante, equipamento nível 5 (estelar) e modificadores sorteados" }] };

  // Cenas curtas de diálogo (rodada 78). [quem fala, fala]; quem: guard, bard, shop, hero ou narr (narrador, sem retrato)
  const SCENES = {
    c1_intro: [["narr", "Antes do amanhecer, o chão de Lumeira treme. No poço, os baldes batem uns nos outros sozinhos."],
      ["guard", "Sentiu isso? Três tremores numa noite. Vinte anos de guarda e nunca ouvi a terra resmungar desse jeito."],
      ["guard", "Os pastores dizem que os Campos se abriram em fendas. Fendas que brilham. Brilho no chão nunca é boa notícia."],
      ["hero", "Quer que eu dê uma olhada?"],
      ["guard", "Quero. Examine as fendas e traga o que achar. E se alguma coisa sair lá de dentro... você sabe para que serve a espada."]],
    c1_crack: [["narr", "Entre os torrões, uma lasca de pedra coberta de marcas antigas. Ainda está morna, como se tivesse acabado de respirar."],
      ["hero", "O Tomé vive cantando coisas antigas. Talvez ele saiba ler isto."]],
    c1_shard: [["bard", "Ora, ora, ora. Deixe-me ver essa pedrinha... Essas marcas! Eu conheço essas marcas!"],
      ["bard", "Estão na canção mais velha de Lumeira, aquela que ninguém pede: “cinco pedras de luz, em roda, guardam o sono do vale”."],
      ["hero", "Cinco pedras?"],
      ["bard", "Os Marcos! Os fundadores ergueram cinco marcos de lumita em volta do vale. Eu sempre achei que era só para rimar."],
      ["bard", "Se uma lasca de marco saiu de uma fenda, o Marco dos Campos está rachado. Fica a oeste da vila, na beira da estrada."],
      ["bard", "Leve bronze. Pedra velha se conserta com metal novo. Isso não está na canção, é coisa de ferreiro, mas confie em mim."]],
    c1_repair: [["narr", "Você encaixa as barras de bronze nas rachaduras. O cristal estala, pisca... e acende, ainda fraco."],
      ["narr", "Lá embaixo, alguma coisa responde. A terra se abre em volta do marco!"],
      ["hero", "Lá vêm eles. Ninguém encosta nesta pedra."]],
    c1_lit: [["guard", "Eu vi a luz daqui da praça. Por um segundo achei que o sol tinha resolvido nascer do lado errado."],
      ["hero", "O marco aguentou. Mas os bichos saíram de baixo dele, como se fugissem da luz."],
      ["guard", "Ou como se alguém lá embaixo não gostasse de ser acordado. Hm."],
      ["guard", "Descanse perto do marco quando precisar: dizem que a luz dos fundadores fecha feridas. Mas tenho um pressentimento ruim sobre o Bosque."]],
    c1_bando: [["guard", "O Bento chegou da estrada branco feito farinha. Diz que os goblins levaram uma pedra que brilha, do tamanho de um pão."],
      ["guard", "Uma pedra que brilha, justo agora que os marcos acordam. Não gosto de coincidência. Vá ouvir o que ele tem a dizer."]],
    c1_bento: [["shop", "Ah, freguês! Ainda estou tremendo. Três carroças reviradas. Sabe quanto custa uma carroça? Não sabe. Eu sei. Caro."],
      ["shop", "Mas o pior foi a pedra. Achei caída ao pé daquele monte de pedras velhas do Bosque, brilhando na lama. Pensei: isso vale uma fortuna."],
      ["hero", "Bento... aquele monte de pedras é um marco. Você pegou a pedra de um marco."],
      ["shop", "Eu... ela estava no chão! Coisa no chão é de quem acha, todo mundo sabe. Bom. Quase todo mundo."],
      ["shop", "Os goblins agora têm um chefe, um tal de Capataz Rasgo. Grandão, grita mais que eu em dia de feira. A pedra está com ele."],
      ["shop", "Traga a pedra de volta e eu... agradeço muito. De graça. Está vendo como eu confio em você?"]],
    c1_capataz: [["narr", "Do meio do acampamento, um goblin enorme chuta um barril, abre caminho entre os outros e vem direto na sua direção."],
      ["narr", "“Rasgo não devolve nada! Rasgo achou primeiro!”"]],
    c1_east: [["narr", "A pedra-guia se encaixa no topo do marco com um estalo, como uma chave na fechadura."],
      ["narr", "A luz corre pelas pedras e salta para o oeste. Por um instante, um fio de luz liga este marco ao dos Campos, por cima das árvores."],
      ["hero", "Os marcos conversam entre si..."]],
    c1_finale: [["guard", "Dois marcos acesos. A terra parou de resmungar, pelo menos deste lado do vale."],
      ["bard", "E eu já tenho o primeiro ato da balada! Vai se chamar “Rachaduras”. Título forte, não acha?"],
      ["shop", "E eu voltei a vender pela estrada do leste. Ninguém vai me agradecer por isso, então eu mesmo agradeço."],
      ["guard", "Tem mais. Quando os dois marcos se ligaram, o santuário da praça acendeu junto. As velas viraram para o oeste, todas ao mesmo tempo."],
      ["bard", "Pedras de passagem! A canção fala delas: quem acende um marco pode voltar a ele num piscar de olhos."],
      ["guard", "Use o santuário ou qualquer marco aceso para viajar. E fique atento: o Marco da Mata Sombria continua apagado. À noite, lá, alguma coisa uiva para ele."],
      ["narr", "Fim do Ato I: Rachaduras. Quando estiver mais forte (Combate 11), o Ivo tem um pedido sobre a Mata Sombria."]],
    // rodada 79: Ato II
    c2_intro: [["guard", "Tem uma mulher que mora sozinha na beira da Mata Sombria. Juna, a raizeira. Cura febre com casca de árvore e briga com qualquer um que pise nas plantas dela."],
      ["guard", "Ela não gosta da vila. A vila não gosta dela. Mas se alguém sabe por que o Marco da Mata não acende, é ela."],
      ["hero", "E ela vai querer falar comigo?"],
      ["guard", "Leve presente. E limpe as botas antes de entrar."]],
    c2_juna: [["herb", "Pisou no meu canteiro de hortelã. Vinte anos e é sempre alguém da vila."],
      ["hero", "O Ivo me mandou. É sobre o Marco da Mata."],
      ["herb", "O Ivo. Hm. Pelo menos ele manda gente que sabe segurar uma espada."],
      ["herb", "O marco está doente. Os lobos sentem e ficam bravos. Antes de qualquer coisa, preciso de um unguento que acalme o cheiro deles."],
      ["herb", "Traga peles de lobo e madeira de carvalho. E não, eu não vou explicar a receita."]],
    c2_unguento: [["narr", "Juna mói a casca, ferve as peles com ervas que você não reconhece e passa o unguento nas mãos. O cheiro é horrível."],
      ["herb", "Com isso, chego perto do marco sem a matilha inteira me seguir. Fique aí. Eu volto antes do anoitecer."]],
    c2_ouvir: [["herb", "O cristal do marco não rachou. Sumiu. Arrancado, com marcas de dentes na pedra."],
      ["herb", "O Alfa da lua cheia. Ele engoliu a luz, e agora uiva para o marco querendo o resto."],
      ["herb", "Enquanto você caça, aprenda alguma coisa útil. Vou ensinar três receitas. Só três. Não abuse."]],
    c2_cristal: [["herb", "Gelado. Brilha como os olhos dele brilhavam. Você fez o que muito caçador não fez."],
      ["hero", "E agora?"],
      ["herb", "Agora a gente espera a lua. O cristal só volta para a pedra com ela no céu, e a matilha vai sentir. Traga ferro e venha à noite."]],
    c2_filhote: [["narr", "Quando você se vira para ir embora, alguma coisa puxa a barra da sua roupa. Um filhote cinza-azulado, com uma meia-lua clara na testa."], // rodada 96
      ["herb", "Era da ninhada do Alfa. Sem ele, a matilha não aceita o pequeno de volta. Passou a semana rondando a minha horta."],
      ["pet", "Iip!"],
      ["herb", "Cheira a cristal, igual a você. Escolheu dono. Não me olhe assim: eu tenho canteiro, não canil."],
      ["herb", "Dê um nome a ele. E não deixe que morda o que não aguenta: se cair, ele corre para a vila e descansa até sarar."]],
    c2_ritual: [["narr", "A lua bate no cristal. Ele flutua da sua mão até o topo do marco, e as barras de ferro se fecham em volta dele como raízes."],
      ["narr", "Toda a Mata Sombria uiva de uma vez. Olhos brilham entre os cedros."],
      ["hero", "Eles estão vindo para a luz. Fiquem longe da pedra!"]],
    c2_finale: [["herb", "Escute. Nenhum uivo. A primeira noite em anos."],
      ["hero", "Três marcos acesos. Faltam as Ruínas e o Planalto."],
      ["herb", "Lá em cima, os mortos não dormem e as pedras andam. Não é lugar para raizeira. Mas vou deixar a porta aberta para você."],
      ["herb", "E diga ao Ivo que eu mandei lembranças. Ele vai entender que é uma ofensa."],
      ["narr", "Fim do Ato II: A Mata que Escuta. Quando estiver mais forte (Combate 18), o Ivo tem notícias das Ruínas."]],
    // rodada 80: Ato III
    c3_intro: [["guard", "Chegou uma cartógrafa da capital. Odília. Fala mais rápido que o Bento cobrando dívida."],
      ["guard", "Acampou na saída das Ruínas e anda copiando pedras velhas. Quer escolta. Os esqueletos não respeitam diploma."],
      ["hero", "Pedras com runas, como a lasca dos Campos?"],
      ["guard", "Foi o que eu pensei. Vá até ela. E não deixe ela te explicar a história da capital inteira."]],
    c3_odilia: [["carto", "Finalmente alguém com espada e sem pressa! Odília, cartógrafa real, terceira melhor da minha turma. A primeira roubava."],
      ["carto", "Estas colunas têm inscrições na língua dos fundadores. Ninguém na capital acredita que elas existem. Eu acredito em pedras."],
      ["carto", "Preciso de cópias das quatro. Encoste a mão na runa e ela acende. Os mortos não gostam, então... corra depois."],
      ["hero", "E se eu não correr?"],
      ["carto", "Então eu escrevo uma nota de rodapé muito bonita sobre você."]],
    c3_traducao: [["carto", "Deixe ver... “guarda”, “juramento”, “não deixar o posto”... e um nome: Senhor das Ruínas. Não, espere. “Senhor do Marco”."],
      ["carto", "Ele não é um rei morto. É o guarda do Marco das Ruínas. Jurou ficar até alguém o render."],
      ["hero", "E ninguém nunca rendeu."],
      ["carto", "O juramento foi selado no baú da cripta. Se a gente ler o texto inteiro, talvez descubra como liberar o pobre coitado."]],
    c3_leitura: [["carto", "“Fico até que a luz volte à pedra e alguém mais forte que eu tome o meu lugar.” É isso. É literalmente isso."],
      ["carto", "Para ele descansar, alguém precisa vencê-lo em combate. Depois, o juramento volta ao marco, preso com metal novo."],
      ["hero", "Então eu luto com ele para ajudar ele."],
      ["carto", "A história da capital está cheia de ajudas assim. Leve aço. E não morra: eu ainda não terminei o mapa."]],
    c3_marco: [["narr", "O juramento se desfaz em pó de luz ao tocar o marco. As barras de aço se fecham em volta do cristal."],
      ["narr", "Entre as colunas, os esqueletos param no meio do passo. Um a um, eles se viram para o marco e baixam as armas."],
      ["hero", "Descansem. O posto está guardado."]],
    c3_finale: [["carto", "Você viu? Os mortos baixaram as armas! Ninguém na capital vai acreditar. Vou escrever assim mesmo."],
      ["carto", "Quatro marcos acesos. O último é o do Planalto, e o guardião de lá é feito de pedra viva."],
      ["hero", "O Golem Ancião."],
      ["carto", "Um garimpeiro velho, Brás, vive lá em cima. Se alguém sabe chegar ao coração da lumita, é ele."],
      ["narr", "Fim do Ato III: Os Mortos Lembram. Quando estiver mais forte (Combate 26), o Ivo conta onde achar o Brás."]],
    // rodada 81: Ato IV
    c4_intro: [["guard", "A Odília mandou um bilhete de três páginas. Resumo: o último marco é o coração de lumita, no alto do Planalto."],
      ["guard", "Lá em cima mora o Brás, garimpeiro. Quarenta anos de picareta. Fala pouco e cobra caro, mas conhece cada pedra."],
      ["hero", "E o Golem Ancião?"],
      ["guard", "O Brás chama ele de “o chefe de turno”. Não pergunte por quê. Ou pergunte. Eu nunca tive coragem."]],
    c4_bras: [["miner", "Hm. Mais um da vila. Veio atrás de lumita fácil? Não tem."],
      ["hero", "Vim pelo coração do Planalto. Os outros quatro marcos já estão acesos."],
      ["miner", "... Então eram vocês. Faz uma semana que o chão parou de tremer aqui embaixo."],
      ["miner", "Minha lanterna de garimpo apagou junto com o coração. Sem ela, ninguém acha o caminho lá dentro. Traga lumita e aço."]],
    c4_lanterna: [["narr", "O Brás encaixa os cristais na lanterna velha com a paciência de quem já fez isso mil vezes. A luz sai azul, firme."],
      ["miner", "Agora sim. Espere aqui. Vou dar uma olhada no veio antes de escurecer."]],
    c4_visao: [["miner", "O coração está rachado. Falta uma lasca, e quem guarda a lasca é o Ancião, dentro do peito de pedra."],
      ["miner", "Os golems pequenos não são bichos. São turno de guarda. Quarenta anos trabalhando do lado deles."],
      ["miner", "Antes de chegar no chefe, tem que passar pelos colegas dele. Desculpe, rapaziada."]],
    c4_turno: [["miner", "Oito golems no chão e o chão quieto. O chefe de turno já sabe que você está vindo."],
      ["miner", "Coma bem, saia do círculo quando ele bater os punhos e não tente ser corajoso. Corajoso eu já enterrei dois."]],
    c4_coracao: [["narr", "A lasca volta ao coração como se nunca tivesse saído. As barras de lumita derretem em luz e fecham a rachadura."],
      ["narr", "Do alto do Planalto, você vê cinco luzes acenderem pelo vale, uma depois da outra, ligadas por fios de luz."],
      ["hero", "Os cinco marcos... o vale inteiro respira."]],
    c4_finale: [["miner", "Vi daqui. Cinco luzes. Quarenta anos de garimpo e eu nunca tinha visto o vale inteiro brilhar."],
      ["miner", "Mas tem uma coisa. Quando o coração acendeu, o chão do outro lado do Planalto abriu. Uma fenda funda, cheia de cristal."],
      ["hero", "A luz viva que os fundadores esconderam."],
      ["miner", "Ou algo que estava preso debaixo dela. Eu é que não desço lá. Mas você... você tem cara de quem vai descer."],
      ["narr", "Fim do Ato IV: O Coração de Lumita. Com Combate 34, fale de novo com o Brás: a Fenda Cintilante está aberta."]],
    // rodada 82: Ato V
    c5_intro: [["miner", "Desci até a beira ontem. Lá dentro o cristal não está parado: ele anda. Tem coisa com pernas de quartzo."],
      ["miner", "E no fundo, uma luz grande que respira. Igual o coração, só que com fome."],
      ["hero", "O que os fundadores trancaram."],
      ["miner", "Ou o que eles não conseguiram matar. Desça, abra o que tiver no fundo e volte inteiro. Nessa ordem de importância, de trás para frente."]],
    c5_volta: [["hero", "Uma serpente de cristal guardava o fundo. E isto estava no baú: um metal que brilha como estrela."],
      ["miner", "Estelar. Meu avô falava disso. Mais duro que lumita, mais leve que ferro. Nunca achei que fosse de verdade."],
      ["miner", "Funda os fragmentos com lumita e leve à bigorna. Cada peça sai diferente, dizem. Como se o metal escolhesse."],
      ["narr", "A Fenda Cintilante se refaz a cada visita; a Serpente volta a guardar o fundo. A Odília quer falar com você."]],
    // rodada 83: Ato V, parte 2
    c5_odilia: [["carto", "Desci até a primeira sala da Fenda. Sozinha. Não conte ao Ivo. Os espectros de luz falam, sabia? Mas fogem de mim."],
      ["carto", "De você eles não fogem. Derrube alguns e escute o que dizem antes de sumir. Eu anoto."]],
    c5_frase: [["hero", "Todos diziam a mesma coisa: “o selo partiu, o selo partiu”."],
      ["carto", "O selo dos fundadores! Os marcos seguravam a luz por fora, e um selo segurava por dentro. Quando ele quebrou, os marcos começaram a apagar."],
      ["carto", "A Serpente não é a luz viva. É a guarda do selo quebrado, enrolada nos pedaços. Traga o fragmento e encaixe no pedestal do fundo."]],
    c5_selo: [["narr", "O fragmento se encaixa no pedestal. As runas acendem uma a uma, e uma coluna de luz sobe pela Fenda até o céu do Planalto."],
      ["narr", "Lá fora, os cinco marcos respondem ao mesmo tempo. O chão do vale solta um suspiro longo, como quem finalmente dorme."],
      ["hero", "Selado."]],
    c5_finale: [["miner", "Vi a coluna de luz daqui. A Odília desmaiou de emoção. Acordou e começou a escrever."],
      ["miner", "Quarenta anos de garimpo e o vale nunca esteve tão quieto. Obrigado. Não vou repetir."],
      ["guard", "O Ivo mandou dizer que a guarda de Lumeira tem uma vaga. Ele mandou dizer também que sabe que você não vai aceitar."],
      ["herb", "A Juna mandou dizer que a mata está ouvindo passarinho de novo. E que você ainda pisou na hortelã."],
      ["bard", "E a balada está pronta: cinco atos, um herói e nenhuma rima com “lumita”. Obra-prima!"],
      ["narr", "Fim da campanha: Os Marcos de Lumeira. A Fenda continua aberta para quem quiser descer, e um eco da Serpente volta toda semana."]],
  };

  // Efeitos temporários das poções (duração em ticks de 0,5 s)
  const BUFFS = {
    forca: { name: "Força", acc: 3, dmg: 2, def: 0, ticks: 180, color: "#ff9a3a" },
    pedra: { name: "Pele de pedra", acc: 0, dmg: 0, def: 5, ticks: 180, color: "#9fb4d0" },
    descansado: { name: "Bem descansado", acc: 0, dmg: 0, def: 0, ticks: 2400, color: "#b8d8ff" }, // rodada 100: cama da casa (vida pelos troféus)
    inspirado: { name: "Inspiração", acc: 1, dmg: 0, def: 1, ticks: 240, color: "#f5e27a" },
    // rodada 79: tônicos da Juna. regen = vida a mais a cada 2 ticks (1 s), somada à cura normal
    vigor: { name: "Vigor", acc: 0, dmg: 0, def: 0, regen: 1, ticks: 180, color: "#8fe08a" },
    lobo: { name: "Faro de lobo", acc: 2, dmg: 2, def: 0, ticks: 240, color: "#c8c0b0" },
    casca: { name: "Casca grossa", acc: 0, dmg: 0, def: 4, ticks: 240, color: "#c8a070" },
  };
  const SHOP_ITEMS = ["Poção de vida", "Poção de força", "Poção de pedra", "Flecha de madeira", // rodada 104: flechas em maço de 10
    "Túnica do guerreiro", "Capa de viagem", "Manto do místico", "Capuz do místico", "Roupa de caçador", "Chapéu de caçador", // e as roupas dos heróis
    "Escudo de madeira", "Orbe de quartzo", "Tomo do aprendiz", "Bracelete de couro", // rodada 105: secundárias e bracelete
    "Mochila de pano"]; // rodada 112

  // Artesanato (aba "Criar" da mochila, em qualquer lugar). bag = aumenta a mochila em 4 espaços (uma vez cada)
  const CRAFT = {
    "Bolsa de couro": { mats: { "Couro de javali": 4, "Madeira": 2 }, lvl: 1, xp: 30, bag: 4, desc: "+4 espaços na mochila" },
    "Anel de cobre": { mats: { "Barra de bronze": 2 }, lvl: 3, xp: 20 },
    "Amuleto de âmbar": { mats: { "Âmbar antigo": 1, "Barra de ferro": 1 }, lvl: 10, xp: 60 },
    "Amuleto dos ecos": { mats: { "Eco cristalizado": 2, "Barra de lumita": 2 }, lvl: 14, xp: 320, desc: "amuleto épico: +3 acerto, +3 dano, +5 defesa" }, // rodada 22
    "Mochila de pele": { mats: { "Pele de lobo": 4, "Madeira de carvalho": 2 }, lvl: 12, xp: 90, bag: 4, req: "Bolsa de couro", desc: "+4 espaços na mochila" },
    "Poção de vida": { mats: { "Erva-cidreira": 2, "Flor-de-mel": 1 }, lvl: 2, xp: 15, desc: "cura 18 · ervas e flores da foice" }, // rodada 104
    // rodada 104: flechas (n = quantas saem de cada vez) e capacete, calça, botas e capa
    "Flecha de madeira": { mats: { "Madeira": 2 }, lvl: 1, xp: 8, n: 15, desc: "15 flechas · munição do arqueiro" },
    "Flecha de ferro": { mats: { "Madeira": 2, "Barra de ferro": 1 }, lvl: 6, xp: 30, n: 15, desc: "15 flechas · +1 dano" },
    "Flecha de lumita": { mats: { "Madeira de carvalho": 2, "Barra de lumita": 1 }, lvl: 13, xp: 90, n: 15, desc: "15 flechas · +2 dano, +2 acerto" },
    "Capuz de couro": { mats: { "Couro de javali": 3 }, lvl: 2, xp: 25 },
    "Botas de couro": { mats: { "Couro de javali": 2 }, lvl: 2, xp: 20 },
    "Calça de couro": { mats: { "Couro de javali": 3, "Madeira": 1 }, lvl: 3, xp: 25 },
    "Capa de pele": { mats: { "Pele de lobo": 3 }, lvl: 6, xp: 45 },
    "Elmo de ferro": { mats: { "Barra de ferro": 3 }, lvl: 8, xp: 60 },
    "Grevas de ferro": { mats: { "Barra de ferro": 3, "Couro de javali": 2 }, lvl: 9, xp: 70 },
    "Botas de viajante": { mats: { "Pele de lobo": 2, "Couro de javali": 2, "Barra de ferro": 1 }, lvl: 10, xp: 70 },
    "Capa do caçador": { mats: { "Pele de lobo": 3, "Presa lunar": 1, "Erva-cidreira": 2 }, lvl: 11, xp: 90 },
    "Botas de lumita": { mats: { "Barra de lumita": 2, "Couro de javali": 2 }, lvl: 14, xp: 200 },
    "Elmo de lumita": { mats: { "Barra de lumita": 3, "Fragmento ancestral": 1 }, lvl: 15, xp: 240 },
    "Grevas de lumita": { mats: { "Barra de lumita": 3, "Pele de lobo": 2 }, lvl: 15, xp: 240 },
    "Manto das ruínas": { mats: { "Fragmento ancestral": 2, "Pele de lobo": 3, "Coração de musgo": 1, "Lírio-da-lua": 2 }, lvl: 16, xp: 300 },
    // rodada 105: joias de gema e elixires das flores raras
    "Anel de ametista": { mats: { "Ametista sombria": 2, "Barra de obsidiana": 1 }, lvl: 55, xp: 400, desc: "anel épico: +6 acerto, +4 dano" },
    "Amuleto de adamante": { mats: { "Adamante": 2, "Barra de mitril": 1 }, lvl: 90, xp: 700, desc: "amuleto épico: +10 defesa, +3 acerto" },
    "Anel de rubi": { mats: { "Rubi do deserto": 2, "Barra solar": 1 }, lvl: 125, xp: 1100, desc: "anel épico: +6 acerto, +8 dano" },
    "Amuleto de gelo astral": { mats: { "Gelo astral": 2, "Barra glacial": 1 }, lvl: 165, xp: 1700, desc: "amuleto épico: +16 defesa, +4 dano, +4 acerto" },
    "Elixir da noite": { mats: { "Flor-da-noite": 1, "Cogumelo-sombra": 1 }, lvl: 50, xp: 80, desc: "cura 45" },
    "Tônico de edelvais": { mats: { "Edelvais": 1, "Musgo-de-rocha": 1 }, lvl: 85, xp: 130, desc: "cura 70" },
    "Elixir solar": { mats: { "Lótus solar": 1, "Polpa de cacto": 1 }, lvl: 120, xp: 200, desc: "cura 100" },
    "Elixir da aurora": { mats: { "Flor-aurora": 1, "Flor-de-gelo": 1 }, lvl: 160, xp: 300, desc: "cura 140" },
    // rodada 105: escudos (Guerreiro), orbes (Místico) e braceletes
    "Escudo de madeira": { mats: { "Madeira": 4, "Couro de javali": 1 }, lvl: 2, xp: 25, desc: "secundária do Guerreiro · +2 defesa" },
    "Escudo de ferro": { mats: { "Barra de ferro": 3, "Madeira de carvalho": 1 }, lvl: 8, xp: 65, desc: "secundária do Guerreiro · +4 defesa, +1 acerto" },
    "Escudo de lumita": { mats: { "Barra de lumita": 3, "Madeira de cedro": 1 }, lvl: 14, xp: 220, desc: "secundária do Guerreiro · +6 defesa, +1 dano" },
    "Orbe de quartzo": { mats: { "Barra de bronze": 1, "Flor-de-mel": 2 }, lvl: 2, xp: 25, desc: "secundária do Místico · +2 acerto, +1 dano" },
    "Orbe de âmbar": { mats: { "Âmbar antigo": 1, "Barra de ferro": 1, "Lírio-da-lua": 1 }, lvl: 9, xp: 70, desc: "secundária do Místico · +3 acerto, +2 dano" },
    "Orbe de lumita": { mats: { "Barra de lumita": 2, "Flor de cristal": 2 }, lvl: 14, xp: 220, desc: "secundária do Místico · +4 acerto, +3 dano" },
    "Tomo do aprendiz": { mats: { "Couro de javali": 2, "Erva-cidreira": 2 }, lvl: 2, xp: 25, desc: "secundária do Místico · +1 acerto, +2 defesa" },
    "Grimório de âmbar": { mats: { "Âmbar antigo": 1, "Couro de javali": 2 }, lvl: 9, xp: 70, desc: "secundária do Místico · +2 acerto, +3 defesa, +1 dano" },
    "Códice de lumita": { mats: { "Barra de lumita": 1, "Lírio-da-lua": 2, "Pele de lobo": 2 }, lvl: 14, xp: 220, desc: "secundária do Místico · +3 acerto, +4 defesa, +2 dano" },
    "Bracelete de couro": { mats: { "Couro de javali": 2 }, lvl: 2, xp: 18 },
    "Bracelete de ferro": { mats: { "Barra de ferro": 2, "Couro de javali": 1 }, lvl: 7, xp: 50 },
    "Bracelete de lumita": { mats: { "Barra de lumita": 2, "Pele de lobo": 1 }, lvl: 13, xp: 180 },
  };

  // Baú no fim da cripta: moedas garantidas + sorteios
  // baú da Toca dos Lobos (rodada 11)
  const RIFT_CHEST = { coins: [400, 700], rolls: [["Fragmento cintilante", 1, 3, 6], ["Barra estelar", 0.6, 1, 2], ["Anel ancestral", 0.25], ["Coroa do Ancião", 0.1], ["Elixir do lobo", 0.6, 1, 2],
    ["Botas de lumita", 0.15], ["Grevas de lumita", 0.1], ["Escudo de lumita", 0.08], ["Orbe de lumita", 0.08], ["Códice de lumita", 0.06], ["Bracelete de lumita", 0.1]] }; // rodada 82; rodada 104: peças de lumita; 105
  const DEN_CHEST = { coins: [90, 180], rolls: [["Pele de lobo", 1, 2, 4], ["Presa lunar", 0.6], ["Poção de vida", 0.6, 1, 2], ["Anel do caçador", 0.25], ["Âmbar antigo", 0.3], ["Capa do caçador", 0.12]] };
  const CRYPT_CHEST = { coins: [150, 300], rolls: [["Barra de aço", 1, 2, 3], ["Barra de lumita", 0.5, 1, 2], ["Poção de força", 0.6, 1, 2],
    ["Anel do caçador", 0.2], ["Amuleto de musgo", 0.15], ["Anel ancestral", 0.06], ["Coroa do Ancião", 0.03], ["Fragmento ancestral", 0.4],
    ["Elmo de ferro", 0.15], ["Grevas de ferro", 0.12], ["Manto das ruínas", 0.03], ["Escudo de ferro", 0.12], ["Orbe de âmbar", 0.12], ["Grimório de âmbar", 0.1], ["Bracelete de ferro", 0.15]] };


  // rodada 105: baús das masmorras dos biomas
  const BIOME_CHEST_2 = { coins: [700, 1200], rolls: [["Barra de obsidiana", 1, 2, 4], ["Obsidiana", 0.8, 3, 6], ["Poção de vida", 0.7, 2, 3], ["Espada de obsidiana", 0.12], ["Couraça de obsidiana", 0.1], ["Anel ancestral", 0.2]] };
  const BIOME_CHEST_3 = { coins: [1400, 2400], rolls: [["Barra de mitril", 1, 2, 4], ["Mitril", 0.8, 3, 6], ["Poção de pedra", 0.7, 2, 3], ["Espada de mitril", 0.12], ["Placas de mitril", 0.1], ["Coroa do Ancião", 0.15]] };
  const BIOME_CHEST_4 = { coins: [2600, 4200], rolls: [["Barra solar", 1, 2, 4], ["Ouro solar", 0.8, 3, 6], ["Poção de força", 0.7, 2, 3], ["Lâmina solar", 0.12], ["Armadura solar", 0.1], ["Amuleto dos ecos", 0.12]] };
  const BIOME_CHEST_5 = { coins: [4500, 7000], rolls: [["Barra glacial", 1, 2, 4], ["Gelo eterno", 0.8, 3, 6], ["Poção de vida", 0.8, 3, 4], ["Lâmina glacial", 0.12], ["Armadura glacial", 0.1], ["Bracelete de lumita", 0.3]] };
  // Falas curtas dos NPCs (aparecem em balões de tempos em tempos)
  const CHATTER = {
    merchant: ["Madeira fresca vale ouro!", "Encomendas novas no balcão. Dê uma olhada!", "Lumita? Pago bem por lumita.", "Volte sempre, aventureiro!",
      "Uma couraça de lumita? Tenho uma, se o bolso aguentar.", "Esses cristais de eco... nunca vi nada tão frio."],
    guard: ["Fique de olho nos goblins da estrada do leste.", "Dizem que há uma cripta sob as ruínas.", "Coma antes de lutar. Sempre.", "A noite é longa em Lumeira.",
      "O quadro de caçadas às vezes estremece. Dizem que são os ecos dos chefes.", "Chefe ferido fica furioso. Mantenha distância quando ele mudar de cor."],
    bard: ["♪ Lá no alto do planalto, dorme o velho guardião... ♪", "♪ Peixe de ouro, brilho no lago... ♪", "Dez moedas por uma canção?", "♪ Lumeira, Lumeira, luz da fogueira... ♪",
      "♪ O que cai uma vez ecoa outra vez... ♪"],
  };
  const BARD_SONGS = [
    "Canto do Ancião: \"Três batidas no chão de pedra, e quem fica ao lado não volta pra contar.\" Saia do círculo quando o golem bater os punhos.",
    "Balada da Cripta: \"Sob as colunas quebradas há uma escada; o selo do baú só cai quando os mortos voltam a descansar.\"",
    "Cantiga do Pescador: \"Quando o lago brilha em ouro, corra com a vara: são poucos e vão embora.\"",
    "Marcha da Estrada: \"Os goblins vêm pelo leste, cinco de cada vez. Quem defende a estrada ganha a gratidão da vila.\"",
    "Ode ao Ferreiro: \"Às vezes o martelo canta mais alto, e o aço sai perfeito.\" Forjas podem sair como obra-prima.",
    "Lamento dos Ecos: \"Quem venceu os dois senhores ouve o quadro tocar; o eco volta mais forte, mas só uma vez por semana.\" Os ecos deixam cristais para um amuleto.",
  ];

  // Conquistas: metas de longo prazo com recompensa em moedas (st = estatísticas do jogador)
  const ACHIEVEMENTS = [
    { id: "lenha1", name: "Primeiro corte", desc: "Corte sua primeira madeira.", coins: 10, check: (st) => st.logs >= 1 },
    { id: "lenha100", name: "Lenhador", desc: "Corte 100 madeiras.", coins: 120, check: (st) => st.logs >= 100 },
    { id: "minerio100", name: "Minerador", desc: "Extraia 100 minérios.", coins: 120, check: (st) => st.ores >= 100 },
    { id: "peixe50", name: "Pescador", desc: "Pesque 50 peixes.", coins: 100, check: (st) => st.fish >= 50 },
    { id: "prato50", name: "Cozinheiro", desc: "Prepare 50 pratos sem queimar.", coins: 100, check: (st) => st.cooked >= 50 },
    { id: "forja5", name: "Ferreiro", desc: "Forje 5 equipamentos.", coins: 150, check: (st) => st.forged >= 5 },
    { id: "caca100", name: "Caçador", desc: "Derrote 100 monstros.", coins: 150, check: (st) => st.kills >= 100 },
    { id: "raro1", name: "Sortudo", desc: "Encontre um espólio raro.", coins: 50, check: (st) => st.rares >= 1 },
    { id: "chefe1", name: "Quebra-coroas", desc: "Derrote um chefe.", coins: 200, check: (st) => st.bosses >= 1 },
    { id: "chefe2", name: "Lenda de Valdora", desc: "Derrote os dois chefes.", coins: 500, check: (st) => st.bothBosses },
    { id: "eco1", name: "Caçador de ecos", desc: "Derrote um eco semanal.", coins: 400, check: (st) => (st.echoes || 0) >= 1 },
    { id: "bestiario", name: "Naturalista", desc: "Descubra todas as criaturas.", coins: 300, check: (st) => st.species >= st.allSpecies },
    { id: "evento1", name: "Defensor da estrada", desc: "Vença uma invasão goblin.", coins: 80, check: (st) => st.raids >= 1 },
    { id: "cripta1", name: "Saqueador de tumbas", desc: "Abra o baú da Cripta das Ruínas.", coins: 150, check: (st) => st.crypts >= 1 },
    { id: "toca1", name: "Toca limpa", desc: "Abra o baú da Toca dos Lobos.", coins: 150, check: (st) => (st.dens || 0) >= 1 },
    { id: "lua1", name: "Uivo silenciado", desc: "Derrote o Alfa da lua cheia.", coins: 120, check: (st) => (st.killed.wolf_moon || 0) >= 1 },
    { id: "colosso1", name: "Colosso estilhaçado", desc: "Derrote o Colosso de lumita.", coins: 200, check: (st) => (st.killed.crypt_colossus || 0) >= 1 },
    { id: "obra1", name: "Obra-prima", desc: "Forje uma peça perfeita.", coins: 100, check: (st) => st.masterworks >= 1 },
    { id: "nivel100", name: "Veterano", desc: "Chegue ao nível total 100.", coins: 500, check: (st) => st.total >= 100 },
    { id: "mestre30", name: "Mestre de ofício", desc: "Leve uma habilidade ao nível 30.", coins: 300, check: (st) => st.maxSkill >= 30 },
    { id: "vinculo20", name: "Alfa de estimação", desc: "Chegue ao vínculo 20 com o filhote da lua.", coins: 500, check: (st) => (st.petBond || 0) >= 20 }, // rodada 97
  ];

  // Equipamento: cada nível pode ser comprado (cost, exige nível da habilidade) ou forjado na bigorna (forge).

  // ================= rodada 105: monstros dos biomas novos =================
  // Mesmos modelos 3D com outra cor (tint) e tamanho; atributos pela fórmula do nível (bate com os antigos: lobo 12, golem 20, aranha 36).
  const mobStats = (lvl, k = 1) => ({ hp: Math.round((2.4 * lvl + 0.012 * lvl * lvl) * k), atk: Math.round(0.95 * lvl), def: Math.round(0.8 * lvl), maxHit: Math.round(2 + lvl / 4 + (k > 2 ? 3 : 0)) });
  // rodada 113: ninja encapuzado — emboscada de quem farma (mais com a mochila pesada). Nasce no nível de Combate do herói
  // (vida, ataque e defesa por mobStats, como um monstro comum do mesmo nível), persegue sem desistir e some ao entrar numa vila.
  MOBS.ninja = { name: "Ninja encapuzado", spr: "mob_ninja", lvl: 1, ...mobStats(1), speed: 3, aggro: 99, coins: [2, 4], where: "Emboscada: surge de quem farma (bem mais com a mochila pesada)",
    drops: [], color: "#3a3848", ambush: true, noBounty: true };
  const STRIP = ["boss", "mini", "echo", "echoHome", "marker", "summon", "noBounty", "enrage", "light", "quest"];
  function bmob(base, name, lvl, tint, where, o = {}) {
    const B = { ...MOBS[base] }; for (const k of STRIP) if (!(o.keep || []).includes(k)) delete B[k];
    return { ...B, name, lvl, ...mobStats(lvl, o.k || 1), tint, where, scale: o.scale || B.scale, coins: [Math.round(lvl * 1.4 * (o.k || 1)), Math.round(lvl * 2.6 * (o.k || 1))],
      drops: o.drops || [], color: o.color || B.color, respawn: o.respawn || B.respawn, ...(o.extra || {}) };
  }
  const SH = "sepia(0.5) hue-rotate(220deg) brightness(0.55) saturate(1.6)", SAND = "sepia(0.85) saturate(1.3) brightness(1.08)", ROCK = "grayscale(0.85) brightness(0.8) contrast(1.1)", ICE = "sepia(0.4) hue-rotate(165deg) saturate(1.7) brightness(1.3)";
  const DW = [["Obsidiana", 0.18], ["Cogumelo-sombra", 0.1], ["Poção de vida", 0.06]], DS = [["Ouro solar", 0.18], ["Rosa-do-deserto", 0.1], ["Poção de vida", 0.06]];
  const MT = [["Mitril", 0.18], ["Musgo-de-rocha", 0.1], ["Poção de força", 0.06]], SN = [["Gelo eterno", 0.18], ["Flor-de-gelo", 0.1], ["Poção de pedra", 0.06]];
  Object.assign(MOBS, {
    shade_wolf: bmob("wolf", "Lobo das sombras", 32, SH, "Floresta Sombria", { drops: [["Pele de lobo", 0.5], ...DW] }),
    wood_spider: bmob("quartz_spider", "Aranha da mata", 38, "hue-rotate(80deg) brightness(0.55) saturate(1.3)", "Floresta Sombria", { drops: DW }),
    shade_goblin: bmob("goblin", "Goblin da sombra", 43, SH, "Floresta Sombria", { drops: DW }),
    rot_skeleton: bmob("skeleton", "Esqueleto podre", 48, "sepia(0.6) hue-rotate(50deg) saturate(1.4) brightness(0.8)", "Floresta Sombria", { drops: DW }),
    shade_wraith: bmob("light_wraith", "Espectro sombrio", 54, "hue-rotate(230deg) brightness(0.6) saturate(1.8)", "Floresta Sombria", { drops: DW }),
    corrupt_ent: bmob("golem", "Ent corrompido", 60, "hue-rotate(200deg) brightness(0.55) saturate(1.3)", "Floresta Sombria", { drops: [["Madeira de ébano", 0.4], ...DW] }),
    night_alpha: bmob("wolf_alpha", "Alfa da noite", 64, SH, "Floresta Sombria", { k: 1.6, scale: 1.15, drops: [["Barra de obsidiana", 0.3], ...DW] }),
    shadow_king: bmob("boss", "Rei das Sombras", 70, "hue-rotate(220deg) brightness(0.6) saturate(1.8)", "Covil das Sombras (chefe)", { k: 7, keep: ["boss", "enrage"], drops: [["Barra de obsidiana", 1, 2, 4], ["Espada de obsidiana", 0.2], ["Couraça de obsidiana", 0.15]] }),
    sand_slime: bmob("slime_blue", "Slime de areia", 103, SAND, "Deserto Rubro", { drops: DS }),
    red_scorpion: bmob("quartz_spider", "Escorpião rubro", 108, "sepia(1) saturate(3) hue-rotate(-25deg) brightness(0.85)", "Deserto Rubro", { drops: DS }),
    dune_boar: bmob("boar", "Javali das dunas", 115, SAND, "Deserto Rubro", { drops: [["Couro de javali", 0.5], ...DS] }),
    mummy: bmob("skeleton", "Múmia", 121, "sepia(0.9) brightness(1.12) saturate(0.8)", "Deserto Rubro", { drops: DS }),
    sandstone_golem: bmob("golem", "Golem de arenito", 128, "sepia(1) saturate(1.6) hue-rotate(-10deg) brightness(1.05)", "Deserto Rubro", { drops: DS }),
    raider_goblin: bmob("goblin", "Goblin saqueador", 134, SAND, "Deserto Rubro", { drops: DS }),
    dune_serpent: bmob("boss_serpent", "Serpente das dunas", 139, SAND, "Deserto Rubro", { k: 1.8, scale: 0.55, drops: [["Barra solar", 0.35], ...DS] }),
    sand_pharaoh: bmob("boss", "Faraó de Areia", 145, "sepia(1) saturate(2.4) hue-rotate(5deg) brightness(1.15)", "Tumba do Faraó (chefe)", { k: 7, keep: ["boss", "enrage"], drops: [["Barra solar", 1, 2, 4], ["Lâmina solar", 0.2], ["Armadura solar", 0.15]] }),
    gray_wolf: bmob("wolf", "Lobo cinzento", 67, ROCK, "Montanhas de Ferro", { drops: [["Pele de lobo", 0.5], ...MT] }),
    stone_boar: bmob("boar", "Javali de pedra", 72, ROCK, "Montanhas de Ferro", { drops: MT }),
    granite_golem: bmob("golem", "Golem de granito", 78, ROCK, "Montanhas de Ferro", { drops: MT }),
    cave_goblin: bmob("goblin", "Goblin das cavernas", 84, "sepia(0.7) brightness(0.6) saturate(1.2)", "Montanhas de Ferro", { drops: MT }),
    rock_sentinel: bmob("crystal_sentinel", "Sentinela de rocha", 90, ROCK, "Montanhas de Ferro", { drops: MT }),
    cave_spider: bmob("quartz_spider", "Aranha das grutas", 95, "sepia(0.8) brightness(0.55) saturate(1.2)", "Montanhas de Ferro", { drops: MT }),
    iron_colossus: bmob("crypt_colossus", "Colosso de ferro", 100, "sepia(1) hue-rotate(-20deg) saturate(1.8) brightness(0.8)", "Montanhas de Ferro", { k: 1.8, drops: [["Barra de mitril", 0.35], ...MT] }),
    mountain_king: bmob("boss_golem", "Rei da Montanha", 106, ROCK, "Forja Abandonada (chefe)", { k: 7, keep: ["boss", "enrage"], drops: [["Barra de mitril", 1, 2, 4], ["Espada de mitril", 0.2], ["Placas de mitril", 0.15]] }),
    ice_wolf: bmob("wolf", "Lobo do gelo", 142, ICE, "Geleira do Norte", { drops: [["Pele de lobo", 0.5], ...SN] }),
    frost_slime: bmob("slime_crystal", "Slime de gelo", 148, ICE, "Geleira do Norte", { drops: SN }),
    blizzard_wraith: bmob("light_wraith", "Espectro da nevasca", 155, ICE, "Geleira do Norte", { drops: SN }),
    ice_golem: bmob("golem", "Golem de gelo", 162, ICE, "Geleira do Norte", { drops: SN }),
    glacial_sentinel: bmob("crystal_sentinel", "Sentinela glacial", 168, ICE, "Geleira do Norte", { drops: SN }),
    frozen_skeleton: bmob("skeleton", "Esqueleto congelado", 174, ICE, "Geleira do Norte", { drops: SN }),
    blizzard_alpha: bmob("wolf_moon", "Alfa da nevasca", 179, ICE, "Geleira do Norte", { k: 1.8, drops: [["Barra glacial", 0.35], ...SN] }),
    frost_serpent: bmob("boss_serpent", "Serpente do Gelo Eterno", 185, ICE, "Gruta do Gelo Eterno (chefe)", { k: 7, keep: ["boss", "enrage"], drops: [["Barra glacial", 1, 2, 4], ["Lâmina glacial", 0.2], ["Armadura glacial", 0.15]] }),
  });

  const tool = (n, worn, first) => [
    { name: `${n} ${worn}`, bonus: 0 },
    { name: `${n} de bronze`, bonus: 1, cost: 30, req: 1, forge: { mats: first, lvl: 1, xp: 12 } },
    { name: `${n} de ferro`, bonus: 2, cost: 150, req: 8, forge: { mats: { "Barra de ferro": 2 }, lvl: 8, xp: 36 } },
    { name: `${n} de aço`, bonus: 3, cost: 800, req: 16, forge: { mats: { "Barra de aço": 2 }, lvl: 15, xp: 64 } }];
  const GEAR = {
    espada: { label: "Arma", icon: "tool_sword", skill: "combate", tiers: [
      { name: "Espada gasta", bow: "Arco gasto", acc: 0, dmg: 0 },
      { name: "Espada de bronze", bow: "Arco de bronze", two: "Montante de bronze", acc: 3, dmg: 1, cost: 40, req: 1, forge: { mats: { "Barra de bronze": 2 }, lvl: 1, xp: 20 } },
      { name: "Espada de ferro", bow: "Arco de ferro", two: "Montante de ferro", acc: 6, dmg: 2, cost: 180, req: 8, forge: { mats: { "Barra de ferro": 3 }, lvl: 8, xp: 55 } },
      { name: "Espada de aço", bow: "Arco de aço", two: "Montante de aço", acc: 10, dmg: 4, cost: 900, req: 16, forge: { mats: { "Barra de aço": 3 }, lvl: 15, xp: 100 } },
      { name: "Lâmina de lumita", bow: "Arco de lumita", two: "Montante de lumita", acc: 15, dmg: 6, cost: 3000, req: 24, forge: { mats: { "Barra de lumita": 4 }, lvl: 22, xp: 200 } },
      // rodada 82: nível 5 (estelar), só na forja, com 1–2 modificadores sorteados ao forjar (player.gearAff)
      { name: "Lâmina estelar", bow: "Arco estelar", two: "Montante estelar", icon: "item_star_blade", acc: 20, dmg: 8, cost: 15000, req: 35, rolls: true, forge: { mats: { "Barra estelar": 4 }, lvl: 30, xp: 420 } }] },
    armadura: { label: "Peitoral", icon: "item_armor", skill: "vitalidade", tiers: [
      { name: "Roupa comum", def: 0 },
      { name: "Gibão de couro", def: 3, cost: 50, req: 1, forge: { mats: { "Couro de javali": 3, "Barra de bronze": 1 }, lvl: 3, xp: 30 } },
      { name: "Cota de ferro", def: 7, cost: 240, req: 6, /* rodada 24: Vitalidade 8 → 6 (robô de jogo novo: morria 8 vezes nos lobos entre 20 e 30 min) */ forge: { mats: { "Barra de ferro": 4 }, lvl: 10, xp: 75 } },
      { name: "Placas de aço", def: 12, cost: 1100, req: 10, /* rodada 46: Vitalidade 16 → 10 (nos estilos Agressivo/Preciso, Vitalidade 16 só chega por volta do Combate 24) */ forge: { mats: { "Barra de aço": 5 }, lvl: 17, xp: 160 } },
      // rodada 21: quarto tier (a armadura parava no aço enquanto a espada ia até a lumita; dá destino às barras de lumita dos chefes)
      { name: "Couraça de lumita", icon: "item_armor_lumita", def: 17, cost: 3600, req: 15, /* rodada 46: 24 → 15 (acompanha a Lâmina de lumita, Combate 24) */ forge: { mats: { "Barra de lumita": 5 }, lvl: 24, xp: 240 } },
      { name: "Couraça estelar", icon: "item_star_armor", def: 22, cost: 16000, req: 22, rolls: true, forge: { mats: { "Barra estelar": 5 }, lvl: 32, xp: 480 } }] }, // rodada 82
    machado: { label: "Machado", icon: "tool_axe", skill: "corte", tiers: tool("Machado", "gasto", { "Barra de bronze": 1 }) },
    picareta: { label: "Picareta", icon: "tool_pick", skill: "mineracao", tiers: tool("Picareta", "gasta", { "Barra de bronze": 1 }) },
    vara: { label: "Vara", icon: "tool_rod", skill: "pesca", tiers: tool("Vara", "gasta", { "Madeira": 3, "Barra de bronze": 1 }) },
    foice: { label: "Foice", icon: "tool_sickle", skill: "herbalismo", tiers: tool("Foice", "gasta", { "Barra de bronze": 1 }) }, // rodada 104
  };

  // rodada 105: equipamento dos biomas novos (obsidiana 45, solar 78, mitril 112, glacial 150), forjado com as barras de cada bioma
  const HIGH = [ // [arma, arco, montante, peitoral, sufixo das ferramentas, barra, nível, filtro]
    ["Espada de obsidiana", "Arco de obsidiana", "Montante de obsidiana", "Couraça de obsidiana", "de obsidiana", "Barra de obsidiana", 45, "brightness(0.5) saturate(0.6) hue-rotate(230deg)"],
    ["Espada de mitril", "Arco de mitril", "Montante de mitril", "Placas de mitril", "de mitril", "Barra de mitril", 78, "hue-rotate(180deg) saturate(1.8) brightness(1.15)"],
    ["Lâmina solar", "Arco solar", "Montante solar", "Armadura solar", "solar", "Barra solar", 112, "sepia(1) saturate(3) hue-rotate(10deg) brightness(1.15)"],
    ["Lâmina glacial", "Arco glacial", "Montante glacial", "Armadura glacial", "glacial", "Barra glacial", 150, "saturate(0.3) brightness(1.5)"]];
  HIGH.forEach(([sword, bow, two, armor, de, bar, req, filter], k) => {
    const lvl = req, cost = [32000, 70000, 140000, 260000][k];
    GEAR.espada.tiers.push({ name: sword, bow, two, filter, acc: [26, 34, 44, 56][k], dmg: [11, 15, 20, 26][k], cost, req, forge: { mats: { [bar]: 4 }, lvl, xp: [520, 760, 1050, 1400][k] } });
    GEAR.armadura.tiers.push({ name: armor, filter, icon: "item_armor_lumita", def: [28, 36, 46, 58][k], cost, req, forge: { mats: { [bar]: 5 }, lvl, xp: [600, 880, 1200, 1600][k] } });
    for (const t of ["machado", "picareta", "vara", "foice"]) { const g = GEAR[t]; g.tiers.push({ name: `${g.label} ${de}`, filter, bonus: 4 + k, cost: Math.round(cost / 4), req, forge: { mats: { [bar]: 2 }, lvl, xp: [180, 260, 360, 480][k] } }); }
  });
  // rodada 104: cada nível de arma, ferramenta e peitoral é um item (comprado, forjado, achado ou ganho do Ivo);
  // nada fica preso ao herói. Armas e ferramentas dividem o espaço "arma"; o peitoral vai no espaço "armadura".
  // O arco tem os mesmos números da espada do mesmo nível e atira flechas (munição).
  for (const [k, g] of Object.entries(GEAR)) g.tiers.forEach((t, i) => {
    const base = { slot: k === "armadura" ? "armadura" : "arma", gear: k, tier: i, rarity: i <= 1 ? "comum" : i <= 3 ? "raro" : "epico",
      price: Math.max(3, Math.round((t.cost || 12) * 0.35)), ...(t.cost && !t.rolls ? { buy: t.cost } : {}) };
    ITEMS[t.name] = { icon: t.icon || g.icon, ...base, ...(t.filter ? { filter: t.filter } : {}) };
    if (t.bow) ITEMS[t.bow] = { icon: "tool_bow", ...base, bow: true, ...(t.filter ? { filter: t.filter } : {}) };
    // aparência no herói (js/outfit.js): [camada, cor de tinta ou null]
    if (k === "armadura") ITEMS[t.name].look = [["shirt", "#f0e6cc"], ["shirt", "#c08250"], ["plate", "#c4c8d4"], ["plate", "#f4f6fc"], ["plate", "#92eaf8"], ["plate", "#d6bcff"], ["plate", "#6a5a8a"], ["plate", "#ffd66a"], ["plate", "#b8e0ff"], ["plate", "#f0fbff"]][i];
    // rodada 105: montante (duas mãos, só o Guerreiro): mais dano, mas sem escudo; forja com 50% a mais de metal
    if (t.two) { ITEMS[t.two] = { icon: "item_greatsword", ...base, twoH: true, onlyHero: "hero_1", bonus: { dmg: [0, 2, 3, 4, 6, 7, 9, 11, 13, 15][i] }, ...(t.filter ? { filter: t.filter } : {}),
      look: ["sword2", ["#b8b8b8", "#e8aa66", "#d0d4e0", "#f6f8ff", "#96ecf8", "#dcc4ff", "#6a5a8a", "#b8e0ff", "#ffd66a", "#f0fbff"][i]] };
      if (t.forge) t.twoForge = { ...t.forge, mats: Object.fromEntries(Object.entries(t.forge.mats).map(([m, n]) => [m, Math.ceil(n * 1.5)])), xp: Math.round(t.forge.xp * 1.3) }; }
    if (k === "espada") { ITEMS[t.name].look = ["sword", ["#b8b8b8", "#e8aa66", "#d0d4e0", "#f6f8ff", "#96ecf8", "#dcc4ff", "#6a5a8a", "#b8e0ff", "#ffd66a", "#f0fbff"][i]];
      if (t.bow) ITEMS[t.bow].look = ["bow", [null, "#f0b878", "#d8dce8", "#f6f8ff", "#96ecf8", "#dcc4ff", "#6a5a8a", "#b8e0ff", "#ffd66a", "#f0fbff"][i]]; }
  });

  // Fornalha: barras a partir de minério (aço usa carvão de carvalho; lumita usa brasa de cedro)
  const SMELT = {
    "Barra de bronze": { mats: { "Cobre": 2 }, lvl: 1, xp: 8 },
    "Barra de ferro": { mats: { "Ferro": 2 }, lvl: 8, xp: 18 },
    "Barra de aço": { mats: { "Ferro": 2, "Madeira de carvalho": 2 }, lvl: 15, xp: 30 },
    "Barra de lumita": { mats: { "Lumita": 2, "Madeira de cedro": 1 }, lvl: 22, xp: 48 },
    "Barra estelar": { mats: { "Fragmento cintilante": 3, "Barra de lumita": 1 }, lvl: 30, xp: 90 }, // rodada 82
  };

  // ================= rodada 105: os biomas novos =================
  // materiais (minério, madeira e erva de cada bioma) e as barras; ícones reaproveitados com outra cor (filter)
  Object.assign(ITEMS, {
    "Obsidiana": { icon: "item_ore_iron", price: 60, filter: "brightness(0.45) saturate(0.4) hue-rotate(230deg)" },
    "Madeira de ébano": { icon: "item_log_cedar", price: 30, filter: "brightness(0.45) saturate(0.6)" },
    "Cogumelo-sombra": { icon: "item_moonlily", price: 40, filter: "hue-rotate(110deg) brightness(0.7) saturate(1.4)" },
    "Barra de obsidiana": { icon: "item_bar_iron", price: 180, filter: "brightness(0.45) saturate(0.5) hue-rotate(230deg)" },
    "Ouro solar": { icon: "item_ore", price: 110, filter: "sepia(1) saturate(3) hue-rotate(5deg) brightness(1.15)" },
    "Madeira de palmeira": { icon: "item_log", price: 55, filter: "sepia(0.6) saturate(1.3) brightness(1.15)" },
    "Polpa de cacto": { icon: "item_herb", price: 60, filter: "hue-rotate(40deg) saturate(1.5) brightness(0.95)" },
    "Rosa-do-deserto": { icon: "item_flower_honey", price: 75, filter: "hue-rotate(-40deg) saturate(1.6)" },
    "Barra solar": { icon: "item_bar_bronze", price: 330, filter: "sepia(1) saturate(3) hue-rotate(10deg) brightness(1.2)" },
    "Mitril": { icon: "item_ore_iron", price: 190, filter: "hue-rotate(180deg) saturate(1.8) brightness(1.2)" },
    "Madeira de pinho": { icon: "item_log_oak", price: 90, filter: "saturate(0.7) brightness(0.9)" },
    "Musgo-de-rocha": { icon: "item_herb", price: 110, filter: "saturate(0.5) brightness(0.8) hue-rotate(20deg)" },
    "Barra de mitril": { icon: "item_bar_steel", price: 560, filter: "hue-rotate(180deg) saturate(2) brightness(1.15)" },
    "Gelo eterno": { icon: "item_lumita", price: 320, filter: "saturate(0.35) brightness(1.5)" },
    "Pinho nevado": { icon: "item_log_cedar", price: 150, filter: "saturate(0.2) brightness(1.35)" },
    "Flor-de-gelo": { icon: "item_crystal_bloom", price: 180, filter: "saturate(0.4) brightness(1.3)" },
    "Barra glacial": { icon: "item_bar_lumita", price: 900, filter: "saturate(0.3) brightness(1.55)" },
  });

  // rodada 105: recursos raros (só no fundo de cada bioma, longe da vila): uma gema e uma flor por bioma, de nível mais alto
  Object.assign(ITEMS, {
    "Ametista sombria": { icon: "item_lumita", price: 420, rare: true, filter: "hue-rotate(80deg) saturate(1.8)" },
    "Flor-da-noite": { icon: "item_moonlily", price: 190, filter: "hue-rotate(60deg) saturate(1.6) brightness(0.9)" },
    "Adamante": { icon: "item_lumita", price: 820, rare: true, filter: "hue-rotate(-60deg) saturate(1.5)" },
    "Edelvais": { icon: "item_crystal_bloom", price: 360, filter: "saturate(0.2) brightness(1.3)" },
    "Rubi do deserto": { icon: "item_lumita", price: 1550, rare: true, filter: "hue-rotate(160deg) saturate(2.2) brightness(0.95)" },
    "Lótus solar": { icon: "item_moonlily", price: 660, filter: "hue-rotate(-170deg) saturate(2) brightness(1.1)" },
    "Gelo astral": { icon: "item_lumita", price: 2900, rare: true, filter: "saturate(0.35) brightness(1.45)" },
    "Flor-aurora": { icon: "item_crystal_bloom", price: 1250, filter: "hue-rotate(110deg) saturate(1.5)" },
    "Elixir da noite": { icon: "item_potion", price: 60, heal: 45, filter: "hue-rotate(200deg) saturate(1.4)" },
    "Tônico de edelvais": { icon: "item_potion", price: 110, heal: 70, filter: "saturate(0.3) brightness(1.3)" },
    "Elixir solar": { icon: "item_potion", price: 190, heal: 100, filter: "hue-rotate(-150deg) saturate(1.8) brightness(1.1)" },
    "Elixir da aurora": { icon: "item_potion", price: 320, heal: 140, filter: "hue-rotate(110deg) saturate(1.6) brightness(1.15)" },
    "Anel de ametista": { icon: "item_ring_ancient", price: 1400, slot: "anel", rarity: "epico", bonus: { acc: 6, dmg: 4 }, filter: "hue-rotate(80deg) saturate(1.6)" },
    "Amuleto de adamante": { icon: "item_amulet_crown", price: 2600, slot: "amuleto", rarity: "epico", bonus: { def: 10, acc: 3 }, filter: "hue-rotate(-60deg) saturate(1.4)" },
    "Anel de rubi": { icon: "item_ring_ancient", price: 4800, slot: "anel", rarity: "epico", bonus: { acc: 6, dmg: 8 }, filter: "hue-rotate(160deg) saturate(2)" },
    "Amuleto de gelo astral": { icon: "item_amulet_crown", price: 9000, slot: "amuleto", rarity: "epico", bonus: { def: 16, dmg: 4, acc: 4 }, filter: "saturate(0.3) brightness(1.4)" },
  });
  Object.assign(RES, {
    rock_amethyst: { name: "Veio de ametista", skill: "mineracao", tool: "picareta", req: 60, item: "Ametista sombria", xp: 62, charges: [1, 2], respawn: [70, 100], empty: "rubble", verb: "Minerar", fx: ["#5a3a7a", "#d08aff"], rare: true },
    res_nightbloom: { name: "Flor-da-noite", skill: "herbalismo", tool: "foice", req: 58, item: "Flor-da-noite", xp: 56, charges: [1, 2], respawn: [60, 90], empty: "herb_cut", verb: "Colher", fx: ["#b090ff", "#ffffff"], rare: true },
    rock_adamant: { name: "Veio de adamante", skill: "mineracao", tool: "picareta", req: 95, item: "Adamante", xp: 92, charges: [1, 2], respawn: [80, 110], empty: "rubble", verb: "Minerar", fx: ["#2a6a4a", "#7affb0"], rare: true },
    res_edelweiss: { name: "Edelvais", skill: "herbalismo", tool: "foice", req: 92, item: "Edelvais", xp: 86, charges: [1, 2], respawn: [70, 100], empty: "herb_cut", verb: "Colher", fx: ["#ffffff", "#f0e8a0"], rare: true },
    rock_ruby: { name: "Veio de rubi", skill: "mineracao", tool: "picareta", req: 132, item: "Rubi do deserto", xp: 128, charges: [1, 2], respawn: [90, 120], empty: "rubble", verb: "Minerar", fx: ["#7a1a2a", "#ff5a6a"], rare: true },
    res_sunlotus: { name: "Lótus solar", skill: "herbalismo", tool: "foice", req: 128, item: "Lótus solar", xp: 120, charges: [1, 2], respawn: [80, 110], empty: "herb_cut", verb: "Colher", fx: ["#ffd060", "#fff0c0"], rare: true },
    rock_starice: { name: "Veio de gelo astral", skill: "mineracao", tool: "picareta", req: 172, item: "Gelo astral", xp: 172, charges: [1, 2], respawn: [100, 140], empty: "rubble", verb: "Minerar", fx: ["#a0d0f0", "#ffffff"], rare: true },
    res_aurora: { name: "Flor-aurora", skill: "herbalismo", tool: "foice", req: 168, item: "Flor-aurora", xp: 162, charges: [1, 2], respawn: [90, 130], empty: "herb_cut", verb: "Colher", fx: ["#ff90d0", "#a0ffd0"], rare: true },
  });
  Object.assign(SMELT, {
    "Barra de obsidiana": { mats: { "Obsidiana": 2, "Madeira de ébano": 1 }, lvl: 45, xp: 70 },
    "Barra de mitril": { mats: { "Mitril": 2, "Madeira de pinho": 1 }, lvl: 78, xp: 110 },
    "Barra solar": { mats: { "Ouro solar": 2, "Madeira de palmeira": 1 }, lvl: 112, xp: 160 },
    "Barra glacial": { mats: { "Gelo eterno": 2, "Pinho nevado": 1 }, lvl: 150, xp: 230 },
  });
  Object.assign(RES, {
    tree_dark: { name: "Ébano retorcido", skill: "corte", tool: "machado", req: 45, item: "Madeira de ébano", xp: 34, charges: [3, 6], respawn: [26, 36], empty: "stump", verb: "Cortar", fx: ["#2a2030", "#5a4a70"] },
    rock_obsidian: { name: "Veio de obsidiana", skill: "mineracao", tool: "picareta", req: 45, item: "Obsidiana", xp: 36, charges: [1, 3], respawn: [26, 36], empty: "rubble", verb: "Minerar", fx: ["#3a3048", "#8a70c0"] },
    res_shadecap: { name: "Cogumelo-sombra", skill: "herbalismo", tool: "foice", req: 40, item: "Cogumelo-sombra", xp: 32, charges: [1, 3], respawn: [26, 36], empty: "herb_cut", verb: "Colher", fx: ["#6a4a9a", "#b0a0f0"] },
    palm: { name: "Palmeira", skill: "corte", tool: "machado", req: 110, item: "Madeira de palmeira", xp: 72, charges: [2, 5], respawn: [30, 40], empty: "stump", verb: "Cortar", fx: ["#a07040", "#7ab050"] },
    cactus: { name: "Cacto", skill: "herbalismo", tool: "foice", req: 106, item: "Polpa de cacto", xp: 68, charges: [1, 3], respawn: [28, 38], empty: "herb_cut", verb: "Colher", fx: ["#4a8a40", "#c0e090"] },
    rock_sun: { name: "Veio de ouro solar", skill: "mineracao", tool: "picareta", req: 112, item: "Ouro solar", xp: 76, charges: [1, 3], respawn: [30, 40], empty: "rubble", verb: "Minerar", fx: ["#b08a40", "#ffd860"] },
    res_desertrose: { name: "Rosa-do-deserto", skill: "herbalismo", tool: "foice", req: 108, item: "Rosa-do-deserto", xp: 70, charges: [1, 2], respawn: [30, 40], empty: "herb_cut", verb: "Colher", fx: ["#e07060", "#f0c090"] },
    tree_pine: { name: "Pinheiro", skill: "corte", tool: "machado", req: 75, item: "Madeira de pinho", xp: 52, charges: [3, 6], respawn: [34, 44], empty: "stump", verb: "Cortar", fx: ["#5a4030", "#3a6a40"] },
    rock_mithril: { name: "Veio de mitril", skill: "mineracao", tool: "picareta", req: 78, item: "Mitril", xp: 54, charges: [1, 3], respawn: [34, 44], empty: "rubble", verb: "Minerar", fx: ["#7a8a9a", "#9ae0ff"] },
    res_rockmoss: { name: "Musgo-de-rocha", skill: "herbalismo", tool: "foice", req: 72, item: "Musgo-de-rocha", xp: 50, charges: [1, 3], respawn: [34, 44], empty: "herb_cut", verb: "Colher", fx: ["#6a7a50", "#a0b080"] },
    tree_snowpine: { name: "Pinheiro nevado", skill: "corte", tool: "machado", req: 148, item: "Pinho nevado", xp: 98, charges: [3, 6], respawn: [38, 48], empty: "stump", verb: "Cortar", fx: ["#5a4030", "#e8f4ff"] },
    rock_frost: { name: "Veio de gelo eterno", skill: "mineracao", tool: "picareta", req: 150, item: "Gelo eterno", xp: 102, charges: [1, 2], respawn: [38, 48], empty: "rubble", verb: "Minerar", fx: ["#a0c0d8", "#e8fbff"] },
    res_frostbloom: { name: "Flor-de-gelo", skill: "herbalismo", tool: "foice", req: 146, item: "Flor-de-gelo", xp: 96, charges: [1, 2], respawn: [38, 48], empty: "herb_cut", verb: "Colher", fx: ["#bfe8ff", "#ffffff"] },
  });

  // Encomendas do Bento: pedidos sorteados conforme os níveis do jogador
  const ORDER_POOL = [
    { item: "Madeira", skill: "corte", req: 1, qty: [6, 12] }, { item: "Cobre", skill: "mineracao", req: 1, qty: [4, 8] },
    { item: "Lambari assado", skill: "culinaria", req: 1, qty: [3, 6] }, { item: "Gosma", skill: "combate", req: 1, qty: [3, 6] },
    { item: "Barra de bronze", skill: "ferraria", req: 1, qty: [2, 5] },
    { item: "Madeira de carvalho", skill: "corte", req: 8, qty: [5, 10] }, { item: "Ferro", skill: "mineracao", req: 8, qty: [4, 8] },
    { item: "Couro de javali", skill: "combate", req: 5, qty: [3, 5] }, { item: "Barra de ferro", skill: "ferraria", req: 8, qty: [2, 4] },
    { item: "Tucunaré assado", skill: "culinaria", req: 10, qty: [3, 6] }, { item: "Pele de lobo", skill: "combate", req: 11, qty: [2, 4] },
    { item: "Barra de aço", skill: "ferraria", req: 15, qty: [2, 4] },
    { item: "Madeira de cedro", skill: "corte", req: 18, qty: [4, 8] }, { item: "Lumita", skill: "mineracao", req: 18, qty: [3, 6] },
  ];

  const STYLES = {
    agressivo: { name: "Agressivo", desc: "+1 dano máximo, acerto -3", acc: -3, dmg: 1, def: 0, xp: { combate: 2.55, vitalidade: 1.7 }, // rodada 89: Vitalidade 0,85 -> 1.7
      passive: { name: "Sangramento", icon: "passive_bleed", desc: "18% dos acertos fazem o alvo sangrar: 3 pulsos de dano em 1,5 s." } },
    preciso: { name: "Preciso", desc: "acerto +4", acc: 4, dmg: 0, def: 0, xp: { combate: 2.55, vitalidade: 1.7 }, // rodada 89: Vitalidade 0,85 -> 1.7
      passive: { name: "Olho de águia", icon: "passive_eagle", desc: "Críticos mais frequentes (14%) e mais fortes: o bônus vai até o dano máximo inteiro." } },
    defensivo: { name: "Defensivo", desc: "defesa +4, mais XP de Vitalidade", acc: 0, dmg: 0, def: 4, xp: { combate: 1.3, vitalidade: 1.9 },
      passive: { name: "Bloqueio", icon: "passive_block", desc: "20% de chance de aparar um golpe e receber só metade do dano." } },
  };

  // rodada 55: icon = ícone da região (painel; no celular ele substitui o nome)
  const REGIONS = {
    town: { name: "Vila de Lumeira", icon: "icon_region_village", lvl: "zona segura" },
    fields: { name: "Campos de Lumeira", icon: "icon_region_fields", lvl: "nível 1-6" },
    // rodada 31: min = Combate mínimo recomendado (aviso ao entrar abaixo dele); danger = o que mata quem chega cedo
    east: { name: "Bosque dos Carvalhos", icon: "icon_region_grove", lvl: "nível 6-12", min: 6, danger: "Goblins andam em bando por aqui" },
    south: { name: "Mata Sombria", icon: "icon_region_darkwood", lvl: "nível 12-20", min: 12, danger: "Matilhas de lobos por aqui", pack: true },
    west: { name: "Planalto de Lumita", icon: "icon_region_plateau", lvl: "nível 18+", min: 18, danger: "Golems e slimes de lumita batem forte" },
    ruins: { name: "Ruínas Esquecidas", icon: "icon_region_ruins", lvl: "nível 15-28 · chefe", min: 15, danger: "Esqueletos em bando e um chefe" },
    crypt: { name: "Cripta das Ruínas", icon: "icon_region_crypt", lvl: "masmorra · nível 18+", min: 18, danger: "Mortos em todas as salas" },
    rift: { name: "Fenda Cintilante", icon: "icon_region_crypt", lvl: "masmorra · nível 38+", min: 38, danger: "Cristais vivos e uma serpente no fundo" }, // rodada 82
    den: { name: "Toca dos Lobos", icon: "icon_region_den", lvl: "masmorra · nível 14+", min: 14, danger: "Lobos acordam em grupo", pack: true },

    // rodada 105: os biomas novos e as masmorras deles
    darkwood: { name: "Floresta Sombria", icon: "icon_region_darkwood", lvl: "nível 31-65", min: 31, danger: "Sombras e mortos-vivos caçam aqui", pack: true },
    desert: { name: "Deserto Rubro", icon: "icon_region_plateau", lvl: "nível 102-140", min: 102, danger: "Escorpiões, múmias e golens de arenito" },
    mountains: { name: "Montanhas de Ferro", icon: "icon_region_ruins", lvl: "nível 66-101", min: 66, danger: "Golens de granito e colossos de ferro" },
    snow: { name: "Geleira do Norte", icon: "icon_region_plateau", lvl: "nível 141-180", min: 141, danger: "O frio e as feras do gelo não perdoam" },
    dg_darkwood: { name: "Covil das Sombras", icon: "icon_region_den", lvl: "masmorra · nível 60+ · chefe", min: 60, danger: "O Rei das Sombras e a guarda dele" },
    dg_desert: { name: "Tumba do Faraó", icon: "icon_region_crypt", lvl: "masmorra · nível 130+ · chefe", min: 130, danger: "O Faraó de Areia e a guarda dele" },
    dg_mountains: { name: "Forja Abandonada", icon: "icon_region_crypt", lvl: "masmorra · nível 95+ · chefe", min: 95, danger: "O Rei da Montanha e a guarda dele" },
    dg_snow: { name: "Gruta do Gelo Eterno", icon: "icon_region_crypt", lvl: "masmorra · nível 170+ · chefe", min: 170, danger: "A Serpente do Gelo Eterno e a guarda dela" },
  };

  // Tutorial do Guarda Ivo. ev = evento que conta progresso (prefixo basta: "forge" conta qualquer forja).
  const TUTORIAL = [
    { text: "Fale com o Guarda Ivo, na praça.", ev: "talk", n: 1, reward: { items: { "Machado gasto": 1 } }, // rodada 104: nada vem preso ao herói; o Ivo empresta o kit
      say: "Bem-vindo a Lumeira! Vou te ensinar o básico: coletar, forjar, cozinhar e lutar. Siga as tarefas no painel, à direita. Cada região diz o nível recomendado ao entrar." },
    { text: "Corte 3 madeiras numa árvore.", ev: "gather:Madeira", n: 3, reward: { coins: 10, items: { "Picareta gasta": 1 } },
      say: "Tome este machado velho e clique numa árvore dos campos. Quanto maior seu nível de Corte, mais rápido ela rende." },
    { text: "Minere 4 cobres.", ev: "gather:Cobre", n: 4, reward: { coins: 10 },
      say: "Os veios de cobre são as pedras com manchas alaranjadas. Elas se esgotam e voltam depois de um tempo." },
    { text: "Funda 2 barras de bronze na fornalha.", ev: "smelt:Barra de bronze", n: 2, reward: { coins: 15 },
      say: "A fornalha fica no canto sudeste da praça. Cada barra de bronze usa 2 cobres." },
    { text: "Forje um equipamento na bigorna.", ev: "forge", n: 1, reward: { coins: 20, items: { "Vara gasta": 1 } },
      say: "Na bigorna, ao lado da fornalha, transforme barras em armas, armaduras e ferramentas melhores." },
    { text: "Pesque um lambari e asse na fogueira.", ev: "cook:Lambari assado", n: 1, reward: { items: { "Poção de vida": 2 }, weapon: 1 }, // rodada 104: a primeira arma (arco para o Arqueiro)
      say: "Pesque nos cardumes (ondulações na água) e asse na fogueira da vila. Peixe assado cura em combate." },
    { text: "Derrote 3 slimes.", ev: "kill:slime", n: 3, reward: { coins: 25 },
      say: "Clique num slime para atacar. Os espólios caem no chão: clique neles para pegar." },
    { text: "No boneco de treino (leste da praça), golpeie e saia da área vermelha 2 vezes.", ev: "dodge", n: 2, reward: { coins: 15, items: { "Poção de vida": 1 } },
      say: "Chefes e monstros fortes avisam antes do golpe pesado: o chão fica vermelho. Golpeie o boneco e saia da área antes que ele revide." },
    { text: "Venda algo ao Bento ou entregue uma encomenda.", ev: "trade", n: 1, reward: { coins: 10, items: { "Foice gasta": 1 } }, // rodada 104: foice para colher plantas
      say: "O Bento compra tudo e faz encomendas que pagam melhor. Guarde o que não quer vender no cofre da vila." },
  ];
  const TIPS = [
    "Monstros com nome vermelho são bem mais fortes que você. O estilo Defensivo ajuda a sobreviver.",
    "Barras de aço pedem carvalho na fornalha: o carvão dele endurece o ferro.",
    "Dizem que um Senhor das Ruínas guarda o nordeste. Ele chama esqueletos quando se sente ameaçado.",
    "Quando o Senhor das Ruínas erguer a espada, afaste-se um passo: o golpe pesado erra quem não está ao lado.",
    "Goblins acampam no Bosque dos Carvalhos e roubam cobre dos mineiros. Recupere o que é nosso!",
    "Cardumes fundos, nos lagos maiores, rendem tucunarés a partir de Pesca 10.",
    "O cofre ao lado da casa vermelha guarda seus itens; a mochila só tem 20 espaços.",
    "No alto do Planalto dorme o Golem Ancião. Quando ele bater os punhos no chão, saia de perto: o tremor alcança dois passos.",
    "O quadro de caçadas, perto do Bento, paga bem por quem limpa as estradas. Os pedidos mudam com a sua força.",
    "Poções de força e de pedra duram um minuto e meio. Use antes de enfrentar um chefe.",
    "Carne de javali assada cura mais que lambari e já assa com Culinária 1.",
    "Quando o chão rachar em brasa, saia da área: o golpe pesado só acerta quem ficar em cima. Andar cancela o seu golpe, então não espere terminar.",
    "Aperte F perto de alguém ou de algo útil: o rodapé mostra o que vai acontecer.",
    "Cada estilo tem uma passiva: o Agressivo faz sangrar, o Preciso critica mais e o Defensivo apara golpes.",
    "O boneco de treino, a leste da praça, revida numa área vermelha. Bom lugar para treinar a esquiva sem risco.",
    "Nas noites de lua cheia, um alfa prateado uiva na Mata Sombria. Tomé paga bem por uma balada sobre ele.",
    "Há uma toca entre as raízes da Mata Sombria. Os lobos dormem lá dentro, mas acordam com o uivo do Alfa.",
    "Carne de javali com uma madeira na mochila vira espetinho na fogueira: cura 15 (a carne assada sozinha, 12) e pede só Culinária 1.",
    "Peixe queima menos com Culinária: no nível exigido, um em cada quatro vira carvão; oito níveis acima, nenhum.",
    "Abaixo de um terço da vida, os chefes entram em fúria e atacam mais rápido. O Senhor das Ruínas ainda ergue mais três esqueletos.",
    "Depois de vencer os dois chefes, o quadro de caçadas desperta os ecos semanais. Afaste-se e o eco se desfaz; ele só conta uma vitória por semana.",
    "A Vitalidade sobe em toda luta e com as recompensas de Combate. No estilo Defensivo ela sobe mais depressa: bom para ganhar vida antes de um chefe.", // rodada 89
  ];

  // rodada 54: Combate mínimo de cada dica (mesma ordem de TIPS). O robô novato com tutorial ouvia sobre chefes e ecos no Combate 5
  const TIP_MIN = [1, 8, 14, 18, 5, 1, 1, 18, 3, 12, 3, 10, 1, 1, 1, 8, 10, 3, 1, 18, 22, 15];
  // rodada 49: Santuário de Lumeira — títulos de prestígio pelo total oferecido (sem bônus de combate)
  // rodada 50: 3.000/6.000/12.000 → 4.000/10.000/25.000 (robô da quarta hora chegava à Lenda em 16–38 min; agora ~5ª hora)
  // rodada 51: chama votiva — depois da Lenda, cada 1.000 moedas mantém uma chama acesa com o herói por 10 min (até 2 h guardadas)
  const SHRINE = { steps: [100, 1000], votive: { cost: 1000, min: 10, max: 120 }, ranks: [
    { at: 1000, title: "Devoto de Lumeira", color: "#ffe9a8", perk: "título sobre o nome e nome dourado-claro" },
    { at: 4000, title: "Patrono da vila", color: "#e0a8ff", perk: "nome lilás, da fita da medalha" }, // rodada 51: o dourado se confundia com o nome comum
    { at: 10000, title: "Guardião da chama", color: "#ffa64a", perk: "nome cor de brasa e halo quente à noite", halo: "rgba(255,170,80,A)" },
    { at: 25000, title: "Lenda de Lumeira", color: "#8fe8ff", perk: "nome de lumita, halo ciano à noite e faíscas de cristal", halo: "rgba(110,230,255,A)", sparks: true }] };

  // ---------- rodada 112: itens de região, conjuntos dos biomas para as três classes, saque por tipo de monstro, mochilas e peso ----------
  // Item da região: cai de qualquer monstro daquela região (masmorras contam como a região delas). Serve de material das mochilas e
  // dos conjuntos dos biomas, e vende bem.
  const REGION_ITEM = {
    fields: ["Trevo da sorte", "item_herb", "hue-rotate(25deg) saturate(1.8) brightness(1.1)", 6],
    east: ["Bolota dourada", "item_amber", "sepia(0.7) saturate(1.5) brightness(1.05)", 10],
    south: ["Tufo de pelo prateado", "item_pelt", "grayscale(1) brightness(1.35)", 16],
    west: ["Pó de lumita", "item_lumita", "brightness(1.45) saturate(0.55)", 22],
    ruins: ["Relíquia esquecida", "item_fragment", "sepia(0.85) brightness(0.95)", 26],
    darkwood: ["Essência sombria", "item_core", "hue-rotate(220deg) brightness(0.6) saturate(1.8)", 70],
    mountains: ["Lasca de rocha-viva", "item_fragment", "grayscale(0.7) brightness(0.85) contrast(1.2)", 120],
    desert: ["Escaravelho dourado", "item_amber", "sepia(1) saturate(3) hue-rotate(5deg) brightness(1.15)", 180],
    snow: ["Floco eterno", "item_echo_crystal", "saturate(0.3) brightness(1.6)", 260],
  };
  const REGION_OF = { crypt: "ruins", den: "south", rift: "west", dg_darkwood: "darkwood", dg_mountains: "mountains", dg_desert: "desert", dg_snow: "snow" };
  for (const [name, icon, filter, price] of Object.values(REGION_ITEM)) ITEMS[name] = { icon, filter, price, region: true };
  const regionItem = (reg) => { const r = REGION_ITEM[reg] || REGION_ITEM[REGION_OF[reg]]; return r && r[0]; };
  const bonusTxt = (b) => Object.entries(b).map(([k, v]) => `+${v} ${{ acc: "acerto", dmg: "dano", def: "defesa", gather: "% coleta" }[k] || k}`).join(", ");

  // Conjuntos dos biomas (Combate 45, 78, 112 e 150, como as armas forjadas): a secundária de cada classe (escudo do Guerreiro,
  // flechas do Arqueiro, orbe e códice do Místico) e as peças que todos usam. Ícones da lumita tingidos com o filtro do bioma.
  const SETS = [
    { m: "de obsidiana", fp: "de obsidiana", lvl: 45, bar: "Barra de obsidiana", reg: "darkwood", col: "#6a5a8a", k: 1.6, craft: 28 },
    { m: "de mitril", fp: "de mitril", lvl: 78, bar: "Barra de mitril", reg: "mountains", col: "#b8e0ff", k: 2.2, craft: 42 },
    { m: "solar", fp: "solares", lvl: 112, bar: "Barra solar", reg: "desert", col: "#ffd66a", k: 2.9, craft: 56 },
    { m: "glacial", fp: "glaciais", lvl: 150, bar: "Barra glacial", reg: "snow", col: "#f0fbff", k: 3.7, craft: 70 },
  ];
  // [chave, nome (S = conjunto), espaço, ícone, bônus de base (o épico de lumita), camada no herói, extra]
  const PIECES = [
    ["escudo", (S) => `Escudo ${S.m}`, "municao", "item_shield_lumita", { def: 6, dmg: 1 }, "shield", { sec: "escudo" }],
    ["orbe", (S) => `Orbe ${S.m}`, "municao", "item_orb_lumita", { acc: 4, dmg: 3 }, "orb", { sec: "orbe" }],
    ["tomo", (S) => `Códice ${S.m}`, "municao", "item_book_lumita", { acc: 3, def: 4, dmg: 2 }, "book", { sec: "orbe" }],
    ["flecha", (S) => `Flecha ${S.m}`, "municao", "item_arrows_lumita", { dmg: 2, acc: 2 }, null, { sec: "flecha", ammo: true }],
    ["capacete", (S) => `Elmo ${S.m}`, "capacete", "item_helm_lumita", { def: 4, acc: 2 }, "helm", {}],
    ["calca", (S) => `Grevas ${S.fp}`, "calca", "item_pants_lumita", { def: 4, dmg: 1 }, "greaves", {}],
    ["botas", (S) => `Botas ${S.fp}`, "botas", "item_boots_lumita", { def: 3, acc: 2 }, "bootsplate", {}],
    ["capa", (S) => `Manto ${S.m}`, "capa", "item_cape_ruins", { dmg: 2, def: 3, acc: 1 }, "cape", {}],
    ["bracelete", (S) => `Bracelete ${S.m}`, "bracelete", "item_bracelet_lumita", { acc: 2, dmg: 2, def: 1 }, null, {}],
    ["anel", (S) => `Anel ${S.m}`, "anel", "item_ring_ancient", { acc: 5, dmg: 3 }, null, {}],
    ["amuleto", (S) => `Amuleto ${S.m}`, "amuleto", "item_amulet_echo", { acc: 3, dmg: 3, def: 5 }, null, {}],
  ];
  // escada de cada peça: as três de antes (comum, raro, épico) e as dos quatro biomas; TIER_LVL = nível do monstro que já solta a peça
  const TIER_LVL = [1, 10, 20, 45, 78, 112, 150];
  const LADDER = {
    escudo: ["Escudo de madeira", "Escudo de ferro", "Escudo de lumita"], orbe: ["Orbe de quartzo", "Orbe de âmbar", "Orbe de lumita"],
    tomo: ["Tomo do aprendiz", "Grimório de âmbar", "Códice de lumita"], flecha: ["Flecha de madeira", "Flecha de ferro", "Flecha de lumita"],
    capacete: ["Capuz de couro", "Elmo de ferro", "Elmo de lumita"], calca: ["Calça de couro", "Grevas de ferro", "Grevas de lumita"],
    botas: ["Botas de couro", "Botas de viajante", "Botas de lumita"], capa: ["Capa de pele", "Capa do caçador", "Manto das ruínas"],
    bracelete: ["Bracelete de couro", "Bracelete de ferro", "Bracelete de lumita"], anel: ["Anel de cobre", "Anel do caçador", "Anel ancestral"],
    amuleto: ["Amuleto de âmbar", "Amuleto de âmbar", "Amuleto de musgo"],
  };
  SETS.forEach((S, k) => {
    const token = regionItem(S.reg), filter = HIGH[k][7];
    for (const [key, nameOf, slot, icon, base, layer, extra] of PIECES) {
      const name = nameOf(S), mult = extra.ammo ? 1 + (S.k - 1) * 0.6 : slot === "anel" || slot === "amuleto" ? S.k * 0.8 : S.k;
      const bonus = Object.fromEntries(Object.entries(base).map(([b, v]) => [b, Math.max(1, Math.round(v * mult))]));
      ITEMS[name] = { icon, filter, price: extra.ammo ? 10 + k * 6 : [700, 1400, 2600, 4400][k], slot, rarity: "epico", bonus, need: S.lvl, ...extra,
        ...(layer ? { look: [layer, S.col] } : {}) };
      const small = slot === "anel" || slot === "amuleto" || slot === "bracelete";
      CRAFT[name] = extra.ammo ? { mats: { "Madeira de carvalho": 2, [S.bar]: 1, [token]: 1 }, lvl: S.craft, xp: 60 + k * 30, n: 15, desc: `15 flechas · Combate ${S.lvl} · ${bonusTxt(bonus)}` }
        : { mats: { [S.bar]: small ? 1 : 2, [token]: 3 }, lvl: S.craft, xp: [300, 450, 650, 900][k], desc: `${EQUIP_SLOTS[slot].name.toLowerCase()} · Combate ${S.lvl} · ${bonusTxt(bonus)}` };
      LADDER[key].push(name);
    }
  });

  // Mochilas (espaço "mochila"): espaços a mais na mochila e carga a mais (kg). A de pano o Bento vende; as outras, no Artesanato.
  const PACKS = [ // [nome, raridade, espaços, carga, cor no herói, preço, materiais (null = loja), nível de Artesanato]
    ["Mochila de pano", "comum", 4, 15, "#c8b48a", 40, null, 0],
    ["Mochila de couro", "raro", 6, 30, "#9a6438", 260, { "Couro de javali": 6, "Trevo da sorte": 3, "Bolota dourada": 2 }, 8],
    ["Mochila de explorador", "raro", 8, 45, "#5f7a4a", 700, { "Pele de lobo": 6, "Tufo de pelo prateado": 4, "Relíquia esquecida": 2, "Barra de ferro": 2 }, 18],
    ["Mochila de expedição", "epico", 10, 65, "#6a5a8a", 2400, { "Essência sombria": 6, "Lasca de rocha-viva": 4, "Barra de obsidiana": 2 }, 40],
    ["Mochila das dunas e do gelo", "epico", 12, 90, "#e8d8a8", 6000, { "Escaravelho dourado": 5, "Floco eterno": 5, "Barra solar": 2 }, 62],
  ];
  for (const [name, rarity, slots, cap, col, price, mats, lvl] of PACKS) {
    ITEMS[name] = { icon: "item_backpack", price, slot: "mochila", rarity, pack: { slots, cap }, look: ["backpack", col], ...(mats ? {} : { buy: 120 }) };
    if (mats) CRAFT[name] = { mats, lvl, xp: 40 + lvl * 8, desc: `mochila · +${slots} espaços, +${cap} kg de carga` };
  }

  // Saque por tipo de monstro: cada família solta as peças "dela", no nível do monstro (a mais alta que o nível já alcança).
  // As três classes aparecem: escudo (javali, esqueleto), flechas (goblin, aranha), orbe (slime) e códice (espectro).
  const FAMILY = [[/slime/, "slime", ["orbe", "anel"]], [/wolf/, "wolf", ["capa", "botas"]], [/boar/, "boar", ["calca", "escudo"]], [/goblin/, "goblin", ["flecha", "bracelete"]],
    [/skeleton/, "skeleton", ["capacete", "escudo"]], [/golem|colossus|sentinel/, "golem", ["bracelete", "amuleto"]], [/spider/, "spider", ["flecha", "botas"]],
    [/wraith/, "wraith", ["tomo", "amuleto"]], [/serpent/, "serpent", ["anel", "capa"]]];
  const familyOf = (d) => { const f = FAMILY.find(([re]) => re.test(d.spr || "")); return f ? f[1] : null; };
  const tierFor = (lvl) => TIER_LVL.reduce((best, v, i) => (lvl >= v ? i : best), 0);
  // armas e peitorais da forja também caem, raramente, no tier que o nível do monstro alcança (espada, arco, montante e peitoral)
  const forgeTierFor = (g, lvl) => g.tiers.reduce((best, t, i) => (!t.rolls && (t.req || 0) <= lvl ? i : best), 0);
  for (const d of Object.values(MOBS)) {
    if (d.summon || d.echo || d.temp || d.ambush) continue;
    // sem família (chefes humanoides, guarda da cripta): a secundária das três classes
    const fam = FAMILY.find(([re]) => re.test(d.spr || "")) || [null, "boss", ["escudo", "flecha", "orbe", "tomo"]], lvl = d.lvl || 1, have = new Set((d.drops = d.drops || []).map((x) => x[0]));
    const big = d.boss || d.mini || (d.k || 1) > 1;
    const add = (row) => { if (!have.has(row[0])) { have.add(row[0]); d.drops.push(row); } };
    for (const key of fam[2]) {
      const name = LADDER[key][Math.min(LADDER[key].length - 1, tierFor(lvl))];
      add(key === "flecha" ? [name, big ? 0.6 : 0.14, 4, d.boss ? 30 : 10] : [name, d.boss ? 0.3 : big ? 1 / 12 : 1 / 45]);
    }
    const tw = forgeTierFor(GEAR.espada, lvl), ta = forgeTierFor(GEAR.armadura, lvl), T = GEAR.espada.tiers[tw];
    if (tw > 0) for (const name of [T.name, T.bow, T.two]) if (name) add([name, d.boss ? 0.08 : 1 / 320]);
    if (ta > 0) add([GEAR.armadura.tiers[ta].name, d.boss ? 0.08 : 1 / 320]);
  }
  const REGION_DROP = (reg, d) => { const n = regionItem(reg); return n ? [n, d.boss ? 1 : d.mini ? 0.5 : 0.12, 1, d.boss ? 4 : 1] : null; };

  // Peso (kg). Pesa tudo o que vai na mochila e no corpo; o cofre não. Carga = 50 kg + 0,4 por nível de Vitalidade + a mochila.
  // Acima de 100% o herói anda mais devagar; acima de 130%, igual a uma tartaruga.
  const RES_SKILL = {};
  for (const R of Object.values(RES)) { if (R.item) RES_SKILL[R.item] = R.skill; for (const f of R.fish || []) RES_SKILL[f.item] = "pesca"; }
  const SLOT_W = { armadura: 7, arma: 3.5, capacete: 2, calca: 2.5, botas: 1.5, capa: 1, anel: 0.1, amuleto: 0.2, bracelete: 0.3, mochila: 1.5 };
  function weightOf(name) {
    const it = ITEMS[name]; if (!it) return 0;
    if (it.w != null) return it.w;
    if (it.quest) return 0;
    if (it.ammo) return 0.05;
    if (it.slot === "municao") return it.sec === "escudo" ? 4 : 1;
    if (it.slot === "armadura") return it.gear ? (it.tier <= 1 ? 3 : 7) : 2.5;
    if (it.slot === "arma") return it.twoH ? 6 : it.gear === "espada" ? (it.bow ? 2 : 3.5) : 2.5;
    if (it.slot) return SLOT_W[it.slot] || 1;
    if (/^Barra/.test(name)) return 1.5;
    const sk = RES_SKILL[name];
    if (sk === "mineracao") return 1.5;
    if (sk === "corte") return 1;
    if (sk === "pesca" || it.cook) return 0.8;
    if (sk === "herbalismo") return 0.1;
    if (it.heal) return 0.4;
    return 0.3;
  }
  const CARRY = { base: 50, perVit: 0.4, heavy: 1, crawl: 1.3 };


  // ---------- rodada 114: guardiões das vilas novas (no estilo do Ivo): 6 missões por bioma, de caçar cada criatura e
  // coletar cada recurso de lá até derrubar o chefe da masmorra. Cada missão libera a seguinte (after).
  const WARD = (g, name, list) => list.forEach(([id, title, min, intro, steps, outro, reward], i) => {
    QUESTS[id] = { giver: g, name: title, ...(i ? { after: list[i - 1][0] } : { minCombat: min }), intro, outro, reward,
      steps: [...steps.map(([text, ev, n]) => ({ text, ev, n })), { text: `Volte e fale com ${name}.`, talk: true }] };
  });
  WARD("w_breu", "o Vigia Lúcio", [
    ["breu1", "Uivos entre as árvores", 28, "Desde que a floresta escureceu, os lobos das sombras e as aranhas da mata cercam o Breu. Abra caminho para os lenhadores.",
      [["Derrote 8 lobos das sombras.", "kill:shade_wolf", 8], ["Derrote 8 aranhas da mata.", "kill:wood_spider", 8]],
      "A trilha respira de novo. Tome, para a próxima ronda.", { coins: 400, xp: { combate: 2500 }, items: { "Essência sombria": 3, "Poção de vida": 3 } }],
    ["breu2", "Ébano, obsidiana e cogumelos", 0, "A vila precisa de ébano para as paliçadas, obsidiana para as pontas de lança e cogumelo-sombra para os curandeiros.",
      [["Corte 10 madeiras de ébano.", "gather:Madeira de ébano", 10], ["Minere 8 obsidianas.", "gather:Obsidiana", 8], ["Colha 6 cogumelos-sombra.", "gather:Cogumelo-sombra", 6]],
      "Com isso o Breu aguenta o inverno. Você conhece a mata melhor que muitos daqui.", { coins: 600, xp: { corte: 2000, mineracao: 2000, herbalismo: 1500 } }],
    ["breu3", "Os mortos da floresta", 0, "Goblins da sombra andam saqueando as covas antigas, e os esqueletos podres levantam atrás deles. Ponha um fim nisso.",
      [["Derrote 10 goblins da sombra.", "kill:shade_goblin", 10], ["Derrote 10 esqueletos podres.", "kill:rot_skeleton", 10]],
      "As covas estão quietas outra vez. Leve este anel: foi forjado aqui, com obsidiana do Breu.", { coins: 900, xp: { combate: 5000 }, item: "Anel de obsidiana", aff: 1 }],
    ["breu4", "A forja da noite", 0, "Antes de entrar no Covil, você vai precisar de equipamento à altura. Funda obsidiana e traga a flor que só abre à noite.",
      [["Funda 4 barras de obsidiana.", "smelt:Barra de obsidiana", 4], ["Colha 4 flores-da-noite.", "gather:Flor-da-noite", 4]],
      "Agora sim, você pode forjar peças de obsidiana na bigorna. O Covil não perdoa quem entra mal armado.", { coins: 1000, xp: { ferraria: 3000, herbalismo: 2000 }, items: { "Essência sombria": 6 } }],
    ["breu5", "Espectros, ents e o alfa", 0, "Os espectros sombrios guardam o caminho do Covil, os ents corrompidos fecham as trilhas e um Alfa da noite comanda a matilha.",
      [["Derrote 8 espectros sombrios.", "kill:shade_wraith", 8], ["Derrote 6 ents corrompidos.", "kill:corrupt_ent", 6], ["Derrote 2 Alfas da noite.", "kill:night_alpha", 2]],
      "O caminho do Covil das Sombras está aberto. Só falta quem reina lá dentro.", { coins: 1500, xp: { combate: 9000 }, item: "Manto de obsidiana", aff: 1 }],
    ["breu6", "O Rei das Sombras", 0, "Desça ao Covil das Sombras e derrube o Rei das Sombras. Enquanto ele reinar, a floresta não verá o sol.",
      [["Derrote o Rei das Sombras no Covil das Sombras.", "kill:shadow_king", 1]],
      "A floresta clareou! O Breu inteiro vai cantar o seu nome. Este amuleto era do primeiro vigia da vila: agora é seu.", { coins: 3500, xp: { combate: 18000 }, item: "Amuleto de obsidiana", aff: 2 }],
  ]);
  WARD("w_escarpa", "o Sargento Tobias", [
    ["esc1", "Feras da encosta", 62, "Lobos cinzentos e javalis de pedra atacam as carroças que sobem para a Escarpa. Limpe a estrada.",
      [["Derrote 10 lobos cinzentos.", "kill:gray_wolf", 10], ["Derrote 8 javalis de pedra.", "kill:stone_boar", 8]],
      "Estrada limpa, soldado! Isso merece pagamento.", { coins: 900, xp: { combate: 6000 }, items: { "Lasca de rocha-viva": 3, "Poção de força": 3 } }],
    ["esc2", "Pinho, mitril e musgo", 0, "As minas da Escarpa precisam de escoras de pinho, o ferreiro quer mitril e o curandeiro, musgo-de-rocha.",
      [["Corte 10 madeiras de pinho.", "gather:Madeira de pinho", 10], ["Minere 8 mitris.", "gather:Mitril", 8], ["Colha 6 musgos-de-rocha.", "gather:Musgo-de-rocha", 6]],
      "As minas voltam a funcionar. Bom trabalho.", { coins: 1200, xp: { corte: 4000, mineracao: 5000, herbalismo: 3000 } }],
    ["esc3", "Golens e goblins", 0, "Golens de granito despertaram nas pedreiras e goblins das cavernas roubam o minério. Dê um jeito nos dois.",
      [["Derrote 10 golens de granito.", "kill:granite_golem", 10], ["Derrote 10 goblins das cavernas.", "kill:cave_goblin", 10]],
      "Pedreiras seguras. Este anel de mitril é da guarda: use com honra.", { coins: 1600, xp: { combate: 10000 }, item: "Anel de mitril", aff: 1 }],
    ["esc4", "Aço das alturas", 0, "Para a Forja Abandonada, só mitril serve. Funda as barras e traga edelvais e adamante dos picos.",
      [["Funda 4 barras de mitril.", "smelt:Barra de mitril", 4], ["Colha 4 edelvais.", "gather:Edelvais", 4], ["Minere 4 adamantes.", "gather:Adamante", 4]],
      "Material de primeira. A bigorna da vila já pode forjar o seu mitril.", { coins: 1800, xp: { ferraria: 6000, mineracao: 4000 }, items: { "Lasca de rocha-viva": 6 } }],
    ["esc5", "Sentinelas, aranhas e o colosso", 0, "As sentinelas de rocha e as aranhas das grutas guardam a subida da Forja, e um Colosso de ferro anda pelos picos.",
      [["Derrote 8 sentinelas de rocha.", "kill:rock_sentinel", 8], ["Derrote 8 aranhas das grutas.", "kill:cave_spider", 8], ["Derrote 2 Colossos de ferro.", "kill:iron_colossus", 2]],
      "A subida está livre. Só resta o Rei da Montanha.", { coins: 2500, xp: { combate: 16000 }, item: "Manto de mitril", aff: 1 }],
    ["esc6", "O Rei da Montanha", 0, "Na Forja Abandonada mora o Rei da Montanha. Derrube-o e a Escarpa volta a ser nossa.",
      [["Derrote o Rei da Montanha na Forja Abandonada.", "kill:mountain_king", 1]],
      "Pelos picos de ferro! A Escarpa deve tudo a você. Fique com o amuleto do comandante.", { coins: 6000, xp: { combate: 30000 }, item: "Amuleto de mitril", aff: 2 }],
  ]);
  WARD("w_oasis", "a Guardiã Samira", [
    ["oas1", "Areia viva", 98, "Slimes de areia e escorpiões rubros cercam o Oásis à noite. Proteja as cisternas.",
      [["Derrote 10 slimes de areia.", "kill:sand_slime", 10], ["Derrote 10 escorpiões rubros.", "kill:red_scorpion", 10]],
      "As cisternas estão salvas. Que o sol lhe seja leve.", { coins: 1500, xp: { combate: 12000 }, items: { "Escaravelho dourado": 3, "Poção de vida": 4 } }],
    ["oas2", "Palmas, ouro e cacto", 0, "Precisamos de palmeiras para os toldos, ouro solar para as trocas e polpa de cacto para a água das caravanas.",
      [["Corte 10 madeiras de palmeira.", "gather:Madeira de palmeira", 10], ["Minere 8 ouros solares.", "gather:Ouro solar", 8], ["Colha 6 polpas de cacto (cuidado com os espinhos).", "gather:Polpa de cacto", 6]],
      "As caravanas vão sair cheias. Você é bem-vindo no Oásis.", { coins: 2000, xp: { corte: 7000, mineracao: 8000, herbalismo: 6000 } }],
    ["oas3", "Javalis e múmias", 0, "Javalis das dunas pisoteiam as hortas e as múmias saem das tumbas ao entardecer.",
      [["Derrote 10 javalis das dunas.", "kill:dune_boar", 10], ["Derrote 10 múmias.", "kill:mummy", 10]],
      "As hortas e as tumbas estão em paz. Este anel solar é um presente da vila.", { coins: 2800, xp: { combate: 18000 }, item: "Anel solar", aff: 1 }],
    ["oas4", "O ouro que arde", 0, "A Tumba do Faraó só se abre para quem leva o sol consigo. Funda barras solares e traga rosas e rubis do deserto.",
      [["Funda 4 barras solares.", "smelt:Barra solar", 4], ["Colha 4 rosas-do-deserto.", "gather:Rosa-do-deserto", 4], ["Minere 4 rubis do deserto.", "gather:Rubi do deserto", 4]],
      "Com isso a bigorna forja o seu equipamento solar.", { coins: 3200, xp: { ferraria: 9000, mineracao: 6000 }, items: { "Escaravelho dourado": 6 } }],
    ["oas5", "Golens, saqueadores e a serpente", 0, "Golens de arenito guardam as ruínas, goblins saqueadores atacam as caravanas e uma Serpente das dunas ronda a tumba.",
      [["Derrote 8 golens de arenito.", "kill:sandstone_golem", 8], ["Derrote 8 goblins saqueadores do deserto.", "kill:raider_goblin", 8], ["Derrote 2 Serpentes das dunas.", "kill:dune_serpent", 2]],
      "A entrada da tumba está livre. O Faraó espera.", { coins: 4500, xp: { combate: 28000 }, item: "Manto solar", aff: 1 }],
    ["oas6", "O Faraó de Areia", 0, "Desça à Tumba do Faraó e derrube o Faraó de Areia. O deserto inteiro respira quando ele dorme.",
      [["Derrote o Faraó de Areia na Tumba do Faraó.", "kill:sand_pharaoh", 1]],
      "O sol voltou a ser só sol! O Oásis lhe deve a vida. Leve o amuleto das guardiãs.", { coins: 9000, xp: { combate: 50000 }, item: "Amuleto solar", aff: 2 }],
  ]);
  WARD("w_degelo", "a Patrulheira Edda", [
    ["deg1", "Lobos e slimes de gelo", 136, "Lobos do gelo e slimes de gelo rondam o Degelo. A patrulha precisa de reforço.",
      [["Derrote 10 lobos do gelo.", "kill:ice_wolf", 10], ["Derrote 10 slimes de gelo.", "kill:frost_slime", 10]],
      "A patrulha agradece. Aqueça-se e leve isto.", { coins: 2500, xp: { combate: 25000 }, items: { "Floco eterno": 3, "Poção de pedra": 4 } }],
    ["deg2", "Pinho, gelo e flor", 0, "O Degelo precisa de pinho nevado para a lenha, gelo eterno para as runas e flor-de-gelo para os unguentos.",
      [["Corte 10 pinhos nevados.", "gather:Pinho nevado", 10], ["Minere 8 gelos eternos.", "gather:Gelo eterno", 8], ["Colha 6 flores-de-gelo.", "gather:Flor-de-gelo", 6]],
      "Ninguém vai passar frio este ano. Obrigada.", { coins: 3200, xp: { corte: 12000, mineracao: 14000, herbalismo: 10000 } }],
    ["deg3", "Espectros e golens", 0, "Espectros da nevasca e golens de gelo atacam quem cruza a geleira.",
      [["Derrote 10 espectros da nevasca.", "kill:blizzard_wraith", 10], ["Derrote 10 golens de gelo.", "kill:ice_golem", 10]],
      "A travessia está segura. Este anel glacial é seu.", { coins: 4500, xp: { combate: 35000 }, item: "Anel glacial", aff: 1 }],
    ["deg4", "O frio que corta", 0, "Para a Gruta do Gelo Eterno, só o glacial aguenta. Funda as barras e traga gelo astral e a flor-aurora.",
      [["Funda 4 barras glaciais.", "smelt:Barra glacial", 4], ["Minere 4 gelos astrais.", "gather:Gelo astral", 4], ["Colha 4 flores-aurora.", "gather:Flor-aurora", 4]],
      "Com isso a bigorna forja o seu equipamento glacial.", { coins: 5000, xp: { ferraria: 15000, mineracao: 10000 }, items: { "Floco eterno": 6 } }],
    ["deg5", "Sentinelas, esqueletos e o alfa", 0, "Sentinelas glaciais e esqueletos congelados guardam a gruta, e o Alfa da nevasca comanda os lobos do norte.",
      [["Derrote 8 sentinelas glaciais.", "kill:glacial_sentinel", 8], ["Derrote 8 esqueletos congelados.", "kill:frozen_skeleton", 8], ["Derrote 2 Alfas da nevasca.", "kill:blizzard_alpha", 2]],
      "O caminho da gruta está aberto. Só resta a Serpente.", { coins: 7000, xp: { combate: 50000 }, item: "Manto glacial", aff: 1 }],
    ["deg6", "A Serpente do Gelo Eterno", 0, "No fundo da Gruta do Gelo Eterno dorme a Serpente. Derrube-a e o norte inteiro volta a respirar.",
      [["Derrote a Serpente do Gelo Eterno na Gruta do Gelo Eterno.", "kill:frost_serpent", 1]],
      "A geleira está livre! Os sinos do Degelo vão tocar por você. Leve o amuleto da patrulha.", { coins: 14000, xp: { combate: 80000 }, item: "Amuleto glacial", aff: 2 }],
  ]);
  // ---------- rodada 117: Alquimia com a Feiticeira Morgana (bancada ao lado da casa azul da Lumeira) ----------
  // Poções de vida cada vez mais fortes, com as ervas de cada bioma; a força e a pedra entram no caminho. XP em Alquimia.
  const PV = (heal, price, filter) => ({ icon: "item_potion", price, heal, filter });
  Object.assign(ITEMS, {
    "Poção de vida simples": PV(10, 3, "saturate(0.55) brightness(1.18)"),
    "Poção de vida forte": PV(40, 20, "hue-rotate(-12deg) saturate(1.5) brightness(0.95)"),
    "Poção de vida grande": PV(80, 45, "hue-rotate(250deg) saturate(1.3) brightness(0.9)"),
    "Poção de vida superior": PV(150, 90, "hue-rotate(200deg) saturate(1.4) brightness(1.05)"),
    "Poção de vida solar": PV(250, 160, "hue-rotate(35deg) saturate(2.2) brightness(1.15)"),
    "Poção de vida da aurora": PV(400, 260, "hue-rotate(150deg) saturate(1.6) brightness(1.3)"),
  });
  const POTIONS = {
    "Poção de vida simples": { mats: { "Erva-cidreira": 1, "Gosma": 1 }, lvl: 1, xp: 8 },
    "Poção de vida": { mats: { "Erva-cidreira": 2, "Flor-de-mel": 1 }, lvl: 6, xp: 18 },
    "Poção de força": { mats: { "Flor-de-mel": 2, "Lírio-da-lua": 1 }, lvl: 12, xp: 35 },
    "Poção de pedra": { mats: { "Erva-cidreira": 2, "Flor de cristal": 1 }, lvl: 18, xp: 50 },
    "Poção de vida forte": { mats: { "Lírio-da-lua": 2, "Pó de lumita": 1 }, lvl: 25, xp: 80 },
    "Poção de vida grande": { mats: { "Cogumelo-sombra": 2, "Flor-da-noite": 1 }, lvl: 45, xp: 150 },
    "Poção de vida superior": { mats: { "Musgo-de-rocha": 2, "Edelvais": 1 }, lvl: 75, xp: 260 },
    "Poção de vida solar": { mats: { "Rosa-do-deserto": 2, "Lótus solar": 1, "Polpa de cacto": 1 }, lvl: 110, xp: 420 },
    "Poção de vida da aurora": { mats: { "Flor-de-gelo": 2, "Flor-aurora": 1 }, lvl: 150, xp: 650 },
  };

  return { POTIONS, mobStats, REGION_ITEM, REGION_DROP, LADDER, TIER_LVL, SETS, PACKS, FAMILY, familyOf, weightOf, CARRY, EQUIP_SLOTS, SEC, SKILLS, RARITY, ITEMS, RES, MOBS, GEAR, SMELT, CRAFT, ORDER_POOL, STYLES, REGIONS, TUTORIAL, TIPS, BUFFS, SHOP_ITEMS, ACHIEVEMENTS,
    CRYPT_CHEST, DEN_CHEST, RIFT_CHEST, BIOME_CHEST_2, BIOME_CHEST_3, BIOME_CHEST_4, BIOME_CHEST_5, CHATTER, BARD_SONGS, ACTIVE, QUESTS, SHRINE, TIP_MIN, CAMPAIGN, SCENES, ALCHEMY };
})();

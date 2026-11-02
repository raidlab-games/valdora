// Mapa de imagens do jogo. Para trocar uma arte, substitua o arquivo em assets/
// ou aponte a chave para outro arquivo (PNG, SVG, GIF...). As artes atuais são
// geradas por gen.py (pixel art original, 16 px por tile).
const A = (name) => `assets/${name}.svg`;
window.ASSETS = {
  // chão
  grass: A("grass"), grass_2: A("grass_2"), grass_flowers: A("grass_flowers"),
  grass_dark: A("grass_dark"), grass_dark_2: A("grass_dark_2"), dirt: A("dirt"), dirt_2: A("dirt_2"),
  water: A("water"), water_2: A("water_2"), sand: A("sand"), path: A("path"), stone: A("stone"),
  // recursos (e versões esgotadas)
  tree: A("tree"), tree_oak: A("tree_oak"), tree_cedar: A("tree_cedar"), stump: A("stump"),
  rock: A("rock"), rock_iron: A("rock_iron"), rock_lumita: A("rock_lumita"), rubble: A("rubble"),
  // (cardumes: desenhados por código em game.js)
  // vila
  house_red: A("house_red"), house_blue: A("house_blue"), house_green: A("house_green"),
  stall: A("stall"), well: A("well"), barrel: A("barrel"), campfire: A("campfire"), campfire_2: A("campfire_2"),
  npc_merchant: A("npc_merchant"),
  // monstros
  slime: A("slime"), mob_boar: A("mob_boar"), mob_wolf: A("mob_wolf"), mob_golem: A("mob_golem"),
  // personagens: retrato (lobby) + folha de animação
  hero_1: A("hero_1"), hero_2: A("hero_2"), hero_3: A("hero_3"),
  hero_1_sheet: A("hero_1_sheet"), hero_2_sheet: A("hero_2_sheet"), hero_3_sheet: A("hero_3_sheet"),
  // ícones de itens e equipamentos
  coin: A("coin"), item_log: A("item_log"), item_log_oak: A("item_log_oak"), item_log_cedar: A("item_log_cedar"),
  item_ore: A("item_ore"), item_ore_iron: A("item_ore_iron"), item_lumita: A("item_lumita"),
  item_lambari: A("item_lambari"), item_tucunare: A("item_tucunare"),
  item_lambari_cooked: A("item_lambari_cooked"), item_tucunare_cooked: A("item_tucunare_cooked"), item_burnt: A("item_burnt"),
  item_gel: A("item_gel"), item_core: A("item_core"), item_leather: A("item_leather"), item_amber: A("item_amber"),
  item_pelt: A("item_pelt"), item_fang: A("item_fang"), item_heart: A("item_heart"), item_potion: A("item_potion"),
  item_armor: A("item_armor"), tool_axe: A("tool_axe"), tool_pick: A("tool_pick"), tool_rod: A("tool_rod"), tool_sword: A("tool_sword"),
  // artes só em PNG (pacote Flow): monstros, NPCs, decoração, itens e folhas de golpe
  mob_goblin: "assets/flow/mob_goblin.png", mob_skeleton: "assets/flow/mob_skeleton.png", npc_guard: "assets/flow/npc_guard.png",
  deco_bush: "assets/flow/deco_bush.png", deco_flowers: "assets/flow/deco_flowers.png", deco_sign: "assets/flow/deco_sign.png",
  chest: "assets/flow/chest.png", furnace: "assets/flow/furnace.png", anvil: "assets/flow/anvil.png",
  item_bar_bronze: "assets/flow/item_bar_bronze.png", item_bar_iron: "assets/flow/item_bar_iron.png",
  item_bar_steel: "assets/flow/item_bar_steel.png", item_bar_lumita: "assets/flow/item_bar_lumita.png",
  item_fragment: "assets/flow/item_fragment.png", tool_hammer: "assets/flow/tool_hammer.png",
  mob_boss_ruins: "assets/flow/mob_boss_ruins.png", deco_pillar: "assets/flow/deco_pillar.png", deco_ruin_wall: "assets/flow/deco_ruin_wall.png",
  item_meat: "assets/flow/item_meat.png", item_meat_cooked: "assets/flow/item_meat_cooked.png",
  item_potion_strength: "assets/flow/item_potion_strength.png", item_potion_stone: "assets/flow/item_potion_stone.png",
  deco_board: "assets/flow/deco_board.png", mob_boss_golem: "assets/flow/mob_boss_golem.png",
  mob_slime_blue: "assets/flow/mob_slime_blue.png", mob_slime_crystal: "assets/flow/mob_slime_crystal.png", mob_wolf_alpha: "assets/flow/mob_wolf_alpha.png",
  item_ring_copper: "assets/flow/item_ring_copper.png", item_ring_hunter: "assets/flow/item_ring_hunter.png", item_ring_ancient: "assets/flow/item_ring_ancient.png",
  item_amulet_amber: "assets/flow/item_amulet_amber.png", item_amulet_moss: "assets/flow/item_amulet_moss.png",
  item_amulet_gatherer: "assets/flow/item_amulet_gatherer.png", item_amulet_crown: "assets/flow/item_amulet_crown.png",
  hero_1_attack: "assets/flow/hero_1_attack.png", hero_2_attack: "assets/flow/hero_2_attack.png", hero_3_attack: "assets/flow/hero_3_attack.png",
  mob_crypt_guardian: "assets/flow/mob_crypt_guardian.png", deco_crypt: "assets/flow/deco_crypt.png", deco_brazier: "assets/flow/deco_brazier.png",
  item_fish_gold: "assets/flow/item_fish_gold.png", item_pouch: "assets/flow/item_pouch.png", npc_bard: "assets/flow/npc_bard.png",
};

// Tamanho de cada arte em tiles [largura, altura] (padrão 1x1). A arte é desenhada
// alinhada pela base do objeto, então pode ser mais alta que a área que ocupa no mapa.
window.SPRITE_SIZE = {
  house_red: [3, 3], house_blue: [3, 3], house_green: [3, 3], stall: [2, 2], mob_golem: [2, 2],
  hero_1_sheet: [3, 4], hero_2_sheet: [3, 4], hero_3_sheet: [3, 4],
  mob_goblin: [1.35, 1.35], mob_skeleton: [1.45, 1.45], npc_guard: [1.3, 1.3],
  deco_bush: [1.25, 1.25], deco_flowers: [0.9, 0.9], deco_sign: [1.15, 1.15],
  chest: [1.05, 1.05], furnace: [1.7, 1.7], anvil: [1.35, 1.35],
  mob_boss_ruins: [2.6, 2.6], deco_pillar: [1.9, 1.9], deco_ruin_wall: [1.9, 1.9],
  mob_boss_golem: [3.6, 3.6], npc_bard: [1.25, 1.25], mob_crypt_guardian: [2.0, 2.0], deco_crypt: [1.7, 1.7], deco_brazier: [1.15, 1.15], mob_slime_blue: [0.95, 0.95], mob_slime_crystal: [1.05, 1.05], mob_wolf_alpha: [2.0, 2.0], deco_board: [1.6, 1.6],
};

// Folha de animação dos personagens: 3 colunas (parado, passo A, passo B) x 4 linhas.
window.HERO_SHEET = { cols: 3, rows: ["down", "left", "right", "up"], walk: [1, 0, 2, 0], fps: 8 };
// rodada 105: 8 direções. As folhas novas (Blender) têm as diagonais; as antigas (4 linhas) usam o lado mais próximo.
window.DIRS8 = ["down", "left", "right", "up", "downleft", "downright", "upleft", "upright"]; // ordem das linhas nas folhas de 8
window.DIR4 = (d) => (d === "downleft" || d === "upleft" ? "left" : d === "downright" || d === "upright" ? "right" : d);
window.DIR_AT = (dx, dy) => { // direção (8) do vetor; null se parado
  if (!dx && !dy) return null;
  return ["right", "downright", "down", "downleft", "left", "upleft", "up", "upright"][(Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8 + 8) % 8];
};
window.SHEET_ROW = (d, nRows) => (nRows >= 8 ? window.DIRS8.indexOf(d) : window.HERO_SHEET.rows.indexOf(window.DIR4(d))); // linha da folha
// folhas de ação do herói (3 colunas): a altura vem da imagem (4 ou 8 linhas)
window.ASPECT_FIT = new Set([1, 2, 3].flatMap((n) => ["attack", "chop", "mine", "hammer", "fish", "cook", "reap"].map((a) => `hero_${n}_${a}`)));

// Animações simples (quadros alternados) para chão e objetos.
// (os cardumes são desenhados por código: ondulações animadas, sem arte)
window.ANIM = { water: ["water", "water_2"], campfire: ["campfire", "campfire_2"] };

// ---------- Pacote de arte em alta resolução (assets/flow/*.png) ----------
// Artes geradas no Google Flow e recortadas por tools/ (ver README). Com USE_FLOW_ART = false
// o jogo volta às artes SVG de gen.py. Para trocar uma arte, substitua o PNG de mesmo nome.
window.USE_FLOW_ART = true;
if (window.USE_FLOW_ART) {
  const FLOW = [
    "grass", "grass_2", "grass_flowers", "grass_dark", "grass_dark_2", "stone", "dirt", "dirt_2", "path", "sand", "water", "water_2",
    "tree", "tree_oak", "tree_cedar", "stump", "rock", "rock_iron", "rock_lumita", "rubble",
    "house_red", "house_blue", "house_green", "stall", "well", "campfire", "npc_merchant", "barrel",
    "slime", "mob_boar", "mob_wolf", "mob_golem",
    "hero_1", "hero_2", "hero_3", "hero_1_sheet", "hero_2_sheet", "hero_3_sheet",
    "coin", "item_log", "item_log_oak", "item_log_cedar", "item_ore", "item_ore_iron", "item_lumita",
    "item_lambari", "item_tucunare", "item_lambari_cooked", "item_tucunare_cooked", "item_burnt",
    "item_gel", "item_core", "item_leather", "item_amber", "item_pelt", "item_fang", "item_heart",
    "item_potion", "item_armor", "tool_axe", "tool_pick", "tool_rod", "tool_sword",
  ];
  for (const k of FLOW) ASSETS[k] = `assets/flow/${k}.png`;
  // as artes do Flow são quadradas, com a base do desenho encostada embaixo
  Object.assign(SPRITE_SIZE, {
    tree: [1.7, 1.7], tree_oak: [2.1, 2.1], tree_cedar: [1.5, 2.1], stump: [1, 1],
    rock: [1.25, 1.25], rock_iron: [1.25, 1.25], rock_lumita: [1.4, 1.4], rubble: [1, 1],
    well: [1.6, 1.6], campfire: [1.1, 1.1], npc_merchant: [1.15, 1.15],
    slime: [0.9, 0.9], mob_boar: [1.5, 1.5], mob_wolf: [1.7, 1.7], mob_golem: [2.6, 2.6],
    house_red: [3.4, 3.4], house_blue: [3.4, 3.4], house_green: [3.4, 3.4], stall: [2.3, 2.3], barrel: [1.05, 1.05],
    // personagens um pouco maiores que 1 tile (cada quadro da folha = 1,45 tile)
    hero_1_sheet: [3 * 1.45, 4 * 1.45], hero_2_sheet: [3 * 1.45, 4 * 1.45], hero_3_sheet: [3 * 1.45, 4 * 1.45],
    // folhas de golpe: células de 96 px (1,5x o quadro de 64 px da caminhada), pés no centro da base
    hero_1_attack: [3 * 1.45 * 1.5, 4 * 1.45 * 1.5], hero_2_attack: [3 * 1.45 * 1.5, 4 * 1.45 * 1.5], hero_3_attack: [3 * 1.45 * 1.5, 4 * 1.45 * 1.5],
  });
  ANIM.campfire = ["campfire"];
}

// Folhas de ação do herói (machado, picareta, martelo, pesca): mesmo formato da hero_N_attack.
// Sem a folha de um herói, os golpes usam a folha de ataque dele.
window.HERO_ACTION_SHEETS = [1, 2, 3].flatMap((n) => ["chop", "mine", "hammer", "fish", "cook"].map((a) => `hero_${n}_${a}`)); // rodada 29: cook (agachado girando o espeto, Flow)
for (const k of window.HERO_ACTION_SHEETS) { ASSETS[k] = `assets/flow/${k}.png`; SPRITE_SIZE[k] = [3 * 1.45 * 1.5, 4 * 1.45 * 1.5]; }

// Selos de afixo e de obra-prima (64 px, usados só na interface: ficha, mochila e dicas)
window.BADGES = { feroz: "badge_ferocious", certeiro: "badge_precise", firme: "badge_steady", vigoroso: "badge_vigorous", sortudo: "badge_bounty", obra: "badge_masterwork" };
for (const k of Object.values(window.BADGES)) ASSETS[k] = `assets/flow/${k}.png`;
// Portal de boas-vindas da vila (placa lisa: o nome "Lumeira" é escrito no canvas)
ASSETS.deco_town_sign = "assets/flow/deco_town_sign.png"; SPRITE_SIZE.deco_town_sign = [3.3, 3.3];
// Rodada 8: giro do herói (8 quadros de 96 px numa linha, mesma escala da folha de ataque), baú aberto e ícones de habilidade
for (const n of [1, 2, 3]) { ASSETS[`hero_${n}_spin`] = `assets/flow/hero_${n}_spin.png`; SPRITE_SIZE[`hero_${n}_spin`] = [8 * 1.45 * 1.5, 1.45 * 1.5]; }
ASSETS.chest_open = "assets/flow/chest_open.png"; SPRITE_SIZE.chest_open = SPRITE_SIZE.chest || [1.05, 1.05];
for (const k of ["skill_spin", "skill_dash", "skill_smash"]) ASSETS[k] = `assets/flow/${k}.png`;
// Rodada 9: investida com espada (folhas hero_N_dash do Blender, células de 96 px como a folha de ataque) e ícone de missão
for (const n of [1, 2, 3]) SPRITE_SIZE[`hero_${n}_dash`] = [1.45 * 1.5, 1.45 * 1.5];
ASSETS.icon_quest = "assets/flow/icon_quest.png"; ASSETS.icon_quest_32 = "assets/flow/icon_quest_32.png";
// Rodada 10: mini-chefes com arte própria, bloqueio do herói (folhas de 96 px como a de ataque), passivas e lua cheia
ASSETS.mob_lumita_colossus = "assets/flow/mob_lumita_colossus.png"; SPRITE_SIZE.mob_lumita_colossus = [3.2, 3.2];
ASSETS.mob_wolf_moon = "assets/flow/mob_wolf_moon.png"; SPRITE_SIZE.mob_wolf_moon = [2.2, 2.2];
for (const n of [1, 2, 3]) SPRITE_SIZE[`hero_${n}_block`] = [1.45 * 1.5, 1.45 * 1.5];
for (const k of ["passive_bleed", "passive_eagle", "passive_block", "icon_moon", "icon_moon_64"]) ASSETS[k] = `assets/flow/${k}.png`;
// Rodada 11: caminhada de verdade do Bento e do Ivo (mesmo formato das hero_N_sheet; tamanho igual ao do idle) e ícones de interface
ASSETS.npc_merchant_sheet = "assets/flow/npc_merchant_sheet.png"; SPRITE_SIZE.npc_merchant_sheet = [3 * 1.22, 4 * 1.22];
ASSETS.npc_guard_sheet = "assets/flow/npc_guard_sheet.png"; SPRITE_SIZE.npc_guard_sheet = [3 * 1.42, 4 * 1.42];
for (const k of ["icon_key_f", "icon_key_f_64", "icon_use", "icon_use_64", "icon_drop", "icon_drop_64"]) ASSETS[k] = `assets/flow/${k}.png`;
// Rodada 12: Toca dos Lobos (entrada, saída e chão próprios; ossos e restos de caça)
ASSETS.deco_den = "assets/flow/deco_den.png"; SPRITE_SIZE.deco_den = [1.8, 1.8];
ASSETS.deco_den_exit = "assets/flow/deco_den_exit.png"; SPRITE_SIZE.deco_den_exit = [1.8, 1.8];
ASSETS.den_floor = "assets/flow/den_floor.png"; ASSETS.den_floor_2 = "assets/flow/den_floor_2.png"; // tiles de chão (1 tile)
for (const n of [1, 2, 3]) { ASSETS[`deco_bones_${n}`] = `assets/flow/deco_bones_${n}.png`; SPRITE_SIZE[`deco_bones_${n}`] = [1.25, 1.25]; }
// Rodada 13: tocha da toca (só a chama tremula, folha "flicker") e ícone de esquiva para o aviso do golpe especial
ASSETS.deco_den_torch = "assets/flow/deco_den_torch.png"; SPRITE_SIZE.deco_den_torch = [1.4, 1.4];
ASSETS.icon_dodge = "assets/flow/icon_dodge.png"; ASSETS.icon_dodge_64 = "assets/flow/icon_dodge_64.png"; SPRITE_SIZE.icon_dodge_64 = [0.75, 0.75];
// Rodada 14: caminhada do Tomé (4 direções), cancelamento do golpe (folhas de 96 px como a de ataque), boneco de treino e dica de área
ASSETS.npc_bard_sheet = "assets/flow/npc_bard_sheet.png"; SPRITE_SIZE.npc_bard_sheet = [3 * 1.33, 4 * 1.33];
for (const n of [1, 2, 3]) SPRITE_SIZE[`hero_${n}_cancel`] = [1.45 * 1.5, 1.45 * 1.5];
ASSETS.deco_dummy = "assets/flow/deco_dummy.png"; SPRITE_SIZE.deco_dummy = [1.6, 1.6];
// Rodada 59: seta de "volte por aqui" do minimapa (aponta para a direita; o jogo gira para o ponto seguro)
ASSETS.icon_minimap_back = "assets/flow/icon_minimap_back.png"; ASSETS.icon_minimap_back_32 = "assets/flow/icon_minimap_back_32.png";
// Rodada 55: ícones de região (16 px; a de 32 é mostrada em 16, nítida em telas densas)
for (const k of ["village", "fields", "grove", "darkwood", "plateau", "ruins", "den", "crypt"]) { ASSETS[`icon_region_${k}`] = `assets/flow/icon_region_${k}.png`; ASSETS[`icon_region_${k}_32`] = `assets/flow/icon_region_${k}_32.png`; }
// Rodada 53: chama votiva no painel (desenhada à mão em 16 px; a de 32 é ampliação nearest)
ASSETS.icon_votive_hud = "assets/flow/icon_votive_hud.png"; ASSETS.icon_votive_hud_32 = "assets/flow/icon_votive_hud_32.png";
// Rodada 51: medalha dourada da Lenda (a folha fx_offering_coins é overlay do santuário, em anim_data.js)
ASSETS.icon_title_badge_gold = "assets/flow/icon_title_badge_gold.png"; ASSETS.icon_title_badge_gold_64 = "assets/flow/icon_title_badge_gold_64.png";
// Rodada 50: medalha do título do santuário (cartão do save e ficha); as chamas das velas são a folha fx_candle_flames (anim_data.js)
ASSETS.icon_title_badge = "assets/flow/icon_title_badge.png"; ASSETS.icon_title_badge_64 = "assets/flow/icon_title_badge_64.png";
// Rodada 49: santuário de oferendas (estático; a vida vem das luzes das velas e do cristal) e o baú de ouro
ASSETS.deco_shrine_offering = "assets/flow/deco_shrine_offering.png"; SPRITE_SIZE.deco_shrine_offering = [2, 2];
ASSETS.icon_gold_sink = "assets/flow/icon_gold_sink.png"; ASSETS.icon_gold_sink_64 = "assets/flow/icon_gold_sink_64.png";
// Rodada 48: comida acabando (aviso no HUD)
ASSETS.icon_food_low = "assets/flow/icon_food_low.png"; ASSETS.icon_food_low_64 = "assets/flow/icon_food_low_64.png";
// Rodada 47: vida baixa (moldura vermelha) e dica de recuar
ASSETS.fx_low_hp_vignette = "assets/flow/fx_low_hp_vignette.png";
ASSETS.icon_retreat = "assets/flow/icon_retreat.png"; ASSETS.icon_retreat_64 = "assets/flow/icon_retreat_64.png";
// Rodada 46: equipamento bloqueado por nível (banca e bigorna)
ASSETS.icon_gear_locked = "assets/flow/icon_gear_locked.png"; ASSETS.icon_gear_locked_64 = "assets/flow/icon_gear_locked_64.png";
// Rodada 45: assar tudo (fogueira)
ASSETS.icon_cook_all = "assets/flow/icon_cook_all.png"; ASSETS.icon_cook_all_64 = "assets/flow/icon_cook_all_64.png";
// Rodada 44: organizar o cofre e lupa do filtro (usada pelo CSS)
ASSETS.icon_bank_sort = "assets/flow/icon_bank_sort.png"; ASSETS.icon_bank_sort_64 = "assets/flow/icon_bank_sort_64.png";
ASSETS.icon_filter = "assets/flow/icon_filter.png"; ASSETS.icon_filter_32 = "assets/flow/icon_filter_32.png";
// Rodada 43: retirar comida do cofre
ASSETS.icon_bank_take = "assets/flow/icon_bank_take.png"; ASSETS.icon_bank_take_64 = "assets/flow/icon_bank_take_64.png";
// Rodada 42: guardar materiais no cofre
ASSETS.icon_bank_move = "assets/flow/icon_bank_move.png"; ASSETS.icon_bank_move_64 = "assets/flow/icon_bank_move_64.png";
// Rodada 41: teclado (Como jogar e opções) e gancho da plaquinha da versão
ASSETS.icon_keyboard_help = "assets/flow/icon_keyboard_help.png"; ASSETS.icon_keyboard_help_64 = "assets/flow/icon_keyboard_help_64.png";
ASSETS.deco_version_hook = "assets/flow/deco_version_hook.png"; ASSETS.deco_version_hook_2x = "assets/flow/deco_version_hook_2x.png";
// Rodada 40: plaquinha de madeira da versão (1x e 2x)
ASSETS.icon_version_tag = "assets/flow/icon_version_tag.png"; ASSETS.icon_version_tag_2x = "assets/flow/icon_version_tag_2x.png";
// Rodada 39: faixa do título e ícone do Continuar (tela inicial)
ASSETS.deco_lobby_banner = "assets/flow/deco_lobby_banner.png";
ASSETS.icon_continue_play = "assets/flow/icon_continue_play.png"; ASSETS.icon_continue_play_64 = "assets/flow/icon_continue_play_64.png";
// Rodada 38: fundo de pergaminho do cartão do save (tela inicial; usado pelo CSS)
ASSETS.icon_save_card_bg = "assets/flow/icon_save_card_bg.png";
// Rodada 37: medalha de conquista nova (registro e ficha do save no lobby)
ASSETS.icon_achievement_new = "assets/flow/icon_achievement_new.png"; ASSETS.icon_achievement_new_64 = "assets/flow/icon_achievement_new_64.png";
// Rodada 36: encomenda entregue (registro)
ASSETS.icon_order_done = "assets/flow/icon_order_done.png"; ASSETS.icon_order_done_64 = "assets/flow/icon_order_done_64.png";
// Rodada 35: a balada espera a Lua cheia (quadro verde)
ASSETS.icon_event_soon = "assets/flow/icon_event_soon.png"; ASSETS.icon_event_soon_64 = "assets/flow/icon_event_soon_64.png";
// Rodada 34: missão pronta para entregar (quadro verde)
ASSETS.icon_quest_turnin = "assets/flow/icon_quest_turnin.png"; ASSETS.icon_quest_turnin_64 = "assets/flow/icon_quest_turnin_64.png";
// Rodada 33: mapinha com lupa (dica do minimapa e botão de ajuda no celular)
ASSETS.icon_minimap_help = "assets/flow/icon_minimap_help.png"; ASSETS.icon_minimap_help_64 = "assets/flow/icon_minimap_help_64.png";
// Rodada 32: aviso das regiões sem matilha (caveira) e tronco-banco junto da fogueira (estático)
ASSETS.icon_danger_generic = "assets/flow/icon_danger_generic.png"; ASSETS.icon_danger_generic_64 = "assets/flow/icon_danger_generic_64.png";
ASSETS.deco_campfire_log = "assets/flow/deco_campfire_log.png"; SPRITE_SIZE.deco_campfire_log = [1.4, 1.4];
// Rodada 31: aviso de matilha (região acima do nível) e varal de carne ao lado da fogueira da vila (sway no Blender)
ASSETS.icon_danger_pack = "assets/flow/icon_danger_pack.png"; ASSETS.icon_danger_pack_64 = "assets/flow/icon_danger_pack_64.png";
ASSETS.deco_meat_rack = "assets/flow/deco_meat_rack.png"; SPRITE_SIZE.deco_meat_rack = [2, 2];
// Rodada 30: espetinho de javali e coração "+" (quanto cada comida cura)
for (const k of ["item_meat_skewer", "icon_heal_small"]) { ASSETS[k] = `assets/flow/${k}.png`; ASSETS[k + "_64"] = `assets/flow/${k}_64.png`; }
// Rodada 29: frigideira com estrela (cru que já não queima no seu nível)
ASSETS.icon_cook_level = "assets/flow/icon_cook_level.png"; ASSETS.icon_cook_level_64 = "assets/flow/icon_cook_level_64.png";
// Rodada 28: aviso de comida queimada (o item continua com item_burnt)
ASSETS.icon_burnt = "assets/flow/icon_burnt.png"; ASSETS.icon_burnt_64 = "assets/flow/icon_burnt_64.png";
// Rodada 27: cardume (minimapa e aviso "Procure as ondulações")
ASSETS.icon_fish_spot = "assets/flow/icon_fish_spot.png"; ASSETS.icon_fish_spot_64 = "assets/flow/icon_fish_spot_64.png";
// Rodada 26: encomenda grande na banca do Bento
ASSETS.icon_order_up = "assets/flow/icon_order_up.png"; ASSETS.icon_order_up_64 = "assets/flow/icon_order_up_64.png";
// Rodada 25: pergaminho com lamparina (dicas do Ivo no registro, na janela do Ivo e no lobby)
ASSETS.icon_tip = "assets/flow/icon_tip.png"; ASSETS.icon_tip_64 = "assets/flow/icon_tip_64.png";
// Rodada 24: sino dos ecos semanais (quadro de caçadas e bestiário)
ASSETS.icon_echo_week = "assets/flow/icon_echo_week.png"; ASSETS.icon_echo_week_64 = "assets/flow/icon_echo_week_64.png";
// Rodada 23: Eco cristalizado e Amuleto dos ecos (antes: ícones reaproveitados com filtro de cor)
for (const k of ["item_echo_crystal", "item_amulet_echo"]) { ASSETS[k] = `assets/flow/${k}.png`; ASSETS[k + "_64"] = `assets/flow/${k}_64.png`; }
// Rodada 22: ícone da Couraça de lumita (tier 4 da armadura; GEAR.tiers[].icon troca o ícone por tier)
ASSETS.item_armor_lumita = "assets/flow/item_armor_lumita.png"; ASSETS.item_armor_lumita_64 = "assets/flow/item_armor_lumita_64.png";
// Rodada 21: ampulheta com seta verde (bestiário: o monstro renasce e em quanto tempo)
ASSETS.icon_respawn = "assets/flow/icon_respawn.png"; ASSETS.icon_respawn_64 = "assets/flow/icon_respawn_64.png";
// Rodada 20: marco de pedras do Planalto (ponto de caça dos golems)
ASSETS.deco_plateau_cairn = "assets/flow/deco_plateau_cairn.png"; SPRITE_SIZE.deco_plateau_cairn = [1.7, 1.7];
// rodadas 78–79: campanha (arte do Flow, rodada 79; os placeholders em PIL da rodada 78 saíram). Marcos de lumita aceso e apagado
// (mesmo enquadramento), fenda aberta e cicatriz (decalques de chão, 192 × 128; o brilho somado sai do veio, em PIL), Capataz Rasgo,
// Juna (folha de 4 direções e idle/olhar do Blender) e a cabana dela (3x2 tiles; o desenho ocupa ~195 px dos 288)
ASSETS.deco_lumita_marker_lit = "assets/flow/deco_lumita_marker_lit.png"; ASSETS.deco_lumita_marker_dim = "assets/flow/deco_lumita_marker_dim.png";
SPRITE_SIZE.deco_lumita_marker_lit = [2.1, 2.1]; SPRITE_SIZE.deco_lumita_marker_dim = [2.1, 2.1];
ASSETS.deco_crack_open = "assets/flow/deco_crack_open.png"; ASSETS.deco_crack_scar = "assets/flow/deco_crack_scar.png"; ASSETS.deco_crack_open_glow = "assets/flow/deco_crack_open_glow.png";
SPRITE_SIZE.deco_crack_open = [2.8, 1.87]; SPRITE_SIZE.deco_crack_scar = [2.8, 1.87]; SPRITE_SIZE.deco_crack_open_glow = [2.8, 1.87];
ASSETS.mob_goblin_boss = "assets/flow/mob_goblin_boss.png"; SPRITE_SIZE.mob_goblin_boss = [1.75, 1.75];
ASSETS.npc_juna = "assets/flow/npc_juna.png"; SPRITE_SIZE.npc_juna = [1.3, 1.3]; ASSETS.npc_juna_sheet = "assets/flow/npc_juna_sheet.png"; SPRITE_SIZE.npc_juna_sheet = [3.9, 5.2]; SPRITE_SIZE.npc_juna_look = [1.3, 1.3];
// rodada 80: Ato III (arte do Flow, lote 1): Odília, a tenda dela (3x2 tiles, como a cabana da Juna) e 4 estelas com runas (lua, olho,
// espiral e coroa), apagadas e acesas no mesmo enquadramento
ASSETS.npc_odilia = "assets/flow/npc_odilia.png"; SPRITE_SIZE.npc_odilia = [1.3, 1.3]; ASSETS.npc_odilia_sheet = "assets/flow/npc_odilia_sheet.png"; SPRITE_SIZE.npc_odilia_sheet = [3.9, 5.2]; SPRITE_SIZE.npc_odilia_look = [1.3, 1.3]; ASSETS.tent_odilia = "assets/flow/tent_odilia.png"; SPRITE_SIZE.tent_odilia = [4.5, 3];
for (const k of ["moon", "eye", "spiral", "crown"]) for (const v of ["dim", "lit"]) { ASSETS[`deco_stele_${k}_${v}`] = `assets/flow/deco_stele_${k}_${v}.png`; SPRITE_SIZE[`deco_stele_${k}_${v}`] = [1.2, 1.8]; }
// rodada 81: Ato IV (arte do Flow: Brás com a folha de 4 direções, acampamento e Coração de lumita; idle e olhar do Brás no Blender)
ASSETS.npc_bras = "assets/flow/npc_bras.png"; SPRITE_SIZE.npc_bras = [1.4, 1.4]; ASSETS.npc_bras_sheet = "assets/flow/npc_bras_sheet.png"; SPRITE_SIZE.npc_bras_sheet = [3 * 1.42, 4 * 1.42]; SPRITE_SIZE.npc_bras_look = [1.4, 1.4];
ASSETS.camp_bras = "assets/flow/camp_bras.png"; SPRITE_SIZE.camp_bras = [4.5, 3];
ASSETS.deco_lumita_heart_dim = "assets/flow/deco_lumita_heart_dim.png"; ASSETS.deco_lumita_heart_lit = "assets/flow/deco_lumita_heart_lit.png"; SPRITE_SIZE.deco_lumita_heart_dim = [2, 2]; SPRITE_SIZE.deco_lumita_heart_lit = [2, 2];
// rodada 82: Ato V. Placeholders com os nomes finais (o Flow sobrescreve os arquivos)
for (const [k, s] of [["mob_crystal_sentinel", 1.9], ["mob_light_wraith", 1.4], ["mob_quartz_spider", 1.5], ["mob_boss_serpent", 3.4], ["deco_rift_entrance", 2.2],
  ["deco_rift_crystal_1", 1.3], ["deco_rift_crystal_2", 1.3], ["deco_rift_crystal_3", 1.3], ["deco_rift_brazier", 1.15], ["chest_rift_closed", 1.1], ["chest_rift_open", 1.1],
  ["item_star_fragment", 1], ["item_star_bar", 1], ["item_star_blade", 1], ["item_star_armor", 1], ["tile_rift_1", 1], ["tile_rift_2", 1]]) { ASSETS[k] = `assets/flow/${k}.png`; SPRITE_SIZE[k] = [s, s]; }
// rodada 83: Ato V, parte 2 (eco da Serpente, fragmento e pedestal do selo)
for (const [k, s] of [["tile_rift_glow", 1], ["mob_boss_serpent_echo", 3.4], ["item_seal_fragment", 1], ["deco_seal_pedestal_dim", 1.9], ["deco_seal_pedestal_lit", 1.9]]) { ASSETS[k] = `assets/flow/${k}.png`; SPRITE_SIZE[k] = [s, s]; }
// RETRATOS-INICIO
for (const k of ["portrait_bento", "portrait_bras", "portrait_hero_1", "portrait_hero_2", "portrait_hero_3", "portrait_ivo", "portrait_juna", "portrait_odilia", "portrait_pet_moon", "portrait_tome"]) { ASSETS[k] = `assets/flow/${k}.png`; SPRITE_SIZE[k] = [128 / 48, 128 / 48]; } // retratos de busto (tools/register_portraits.py)
// RETRATOS-FIM
ASSETS.house_juna = "assets/flow/house_juna.png"; SPRITE_SIZE.house_juna = [4.5, 3]; // desenho de ~3 tiles de largura, como as casas da vila
// Rodada 19: arco quebrado na entrada das Ruínas (passa-se por baixo)
ASSETS.deco_ruins_arch = "assets/flow/deco_ruins_arch.png"; SPRITE_SIZE.deco_ruins_arch = [3, 3];
// Rodada 18: lápide "Cripta" (texto pintado no canvas) e tecla M
ASSETS.deco_crypt_signpost = "assets/flow/deco_crypt_signpost.png"; SPRITE_SIZE.deco_crypt_signpost = [1.5, 1.5];
ASSETS.icon_key_m = "assets/flow/icon_key_m.png"; ASSETS.icon_key_m_64 = "assets/flow/icon_key_m_64.png";
// Rodada 17: comemoração do herói, mural do Ivo e ícone do diário de missões
for (const n of [1, 2, 3]) SPRITE_SIZE[`hero_${n}_cheer`] = [1.45 * 1.5, 1.45 * 1.5];
// Rodada 67: golpe de frente/costas em 4 quadros (Blender), props da praça (Flow) e números de dano em pixel art
for (const n of [1, 2, 3]) SPRITE_SIZE[`hero_${n}_strike4`] = [1.45 * 1.5, 1.45 * 1.5];
// Rodada 74: NPC parado olhando de lado/de costas, com respiração (Blender, a partir do quadro em pé da folha de 4 direções)
for (const [k, s] of [["npc_merchant", 1.22], ["npc_guard", 1.42], ["npc_bard", 1.33]]) SPRITE_SIZE[`${k}_look`] = [s, s];
// Rodada 74: caminhada em 6 quadros (Blender): célula do tamanho de um quadro da hero_N_sheet
for (const n of [1, 2, 3]) { const s = (SPRITE_SIZE[`hero_${n}_sheet`] || [3])[0] / 3; SPRITE_SIZE[`hero_${n}_walk6`] = [s, s]; }
for (const [k, s] of [["deco_haycart", 2.1], ["deco_crates", 1.5], ["deco_lamppost", 2.0], ["deco_planter", 1.2], ["deco_bench", 1.25]]) { ASSETS[k] = `assets/flow/${k}.png`; SPRITE_SIZE[k] = [s, s]; }
ASSETS.ui_font_title = "assets/ui/font_title.png"; SPRITE_SIZE.ui_font_title = [854 / 48, 24 / 48]; // rodada 68: fonte de títulos (61 glifos 14x24)
ASSETS.ui_digits = "assets/ui/digits.png"; SPRITE_SIZE.ui_digits = [192 / 48, 20 / 48]; // 12 glifos de 16x20 (0-9, !, menos), sem reescala
ASSETS.deco_quest_board_ivo = "assets/flow/deco_quest_board_ivo.png"; SPRITE_SIZE.deco_quest_board_ivo = [1.7, 1.7];
ASSETS.icon_journal_quests = "assets/flow/icon_journal_quests.png"; ASSETS.icon_journal_quests_64 = "assets/flow/icon_journal_quests_64.png";
ASSETS.deco_training_post = "assets/flow/deco_training_post.png"; SPRITE_SIZE.deco_training_post = [2.0, 2.0]; // rodada 16: placa "Treino" pintada no canvas
ASSETS.icon_quest_done = "assets/flow/icon_quest_done.png"; ASSETS.icon_quest_done_64 = "assets/flow/icon_quest_done_64.png";
ASSETS.icon_tutorial_step = "assets/flow/icon_tutorial_step.png"; ASSETS.icon_tutorial_step_64 = "assets/flow/icon_tutorial_step_64.png"; // rodada 15
ASSETS.icon_dodge_area = "assets/flow/icon_dodge_area.png"; ASSETS.icon_dodge_area_64 = "assets/flow/icon_dodge_area_64.png"; SPRITE_SIZE.icon_dodge_area_64 = [0.75, 0.75];
// rodada 96: filhote da lua (3 fases na mesma escala: o desenho cresce dentro do quadro) e ícone do painel
for (const n of [1, 2, 3]) { ASSETS[`pet_moon_${n}`] = `assets/flow/pet_moon_${n}.png`; SPRITE_SIZE[`pet_moon_${n}`] = [1.5, 1.5]; }
ASSETS.icon_pet = "assets/flow/icon_pet.png";
// rodada 100: Casa do herói (lote, obra, casa), pedestal e troféus do quintal, cama do filhote, banco, vaso e ícones
for (const k of ["house_hero_lot", "house_hero_build", "house_hero"]) { ASSETS[k] = `assets/flow/${k}.png`; SPRITE_SIZE[k] = [5.5, 5.5 * 192 / 288]; } // desenho de 157 px: ~3 tiles
for (const k of ["deco_trophy_pedestal", "trophy_capataz", "trophy_alpha_pelt", "trophy_ruins_helm", "trophy_golem_fist", "trophy_serpent_scale", "trophy_colossus_shard",
  "trophy_echo_dome", "trophy_amber", "trophy_moon_fang", "trophy_moss_heart", "trophy_gold_fish", "trophy_markers"]) { ASSETS[k] = `assets/flow/${k}.png`; SPRITE_SIZE[k] = k === "deco_trophy_pedestal" ? [1.05, 1.05] : [0.85, 0.85]; }
for (const [k, s] of [["deco_pet_bed", 1.6], ["deco_home_bench", 1.25], ["deco_mint_pot", 1.1]]) { ASSETS[k] = `assets/flow/${k}.png`; SPRITE_SIZE[k] = [s, s]; }
ASSETS.icon_home = "assets/flow/icon_home.png"; ASSETS.icon_rested = "assets/flow/icon_rested.png";

// Personagens disponíveis no lobby
// Personagens 3D (Blender, tools/char3d.py): NPCs na mesma escala dos heróis — 1,45 tile para 1,75 m de altura.
// Cada um tem a altura do próprio modelo (o Bento é mais baixo, o Ivo mais alto); npc_X_walk6 = caminhada nas 4 direções.
for (const k of ["npc_merchant", "npc_guard", "npc_bard", "npc_juna", "npc_odilia", "npc_bras"]) {
  for (const suf of ["", "_look", "_walk6"]) SPRITE_SIZE[k + suf] = [1.45, 1.45];
  SPRITE_SIZE[k + "_sheet"] = [3 * 1.45, 4 * 1.45];
}

window.HEROES = [
  { id: "hero_1", sheet: "hero_1_sheet", attack: "hero_1_attack", name: "Guerreiro", color: "#c0392b", sec: "escudo" }, // rodada 105: secundária
  { id: "hero_2", sheet: "hero_2_sheet", attack: "hero_2_attack", name: "Arqueiro", color: "#3f9e4a", archer: true, sec: "flecha" }, // rodada 104: no lugar do Marinheiro
  { id: "hero_3", sheet: "hero_3_sheet", attack: "hero_3_attack", name: "Místico", color: "#8e44ad", sec: "orbe" },
];
// rodada 104: ícones (Blender) das peças novas do boneco: capacete, calça, botas e capa
for (const k of ["item_helm_leather", "item_helm_iron", "item_helm_lumita", "item_pants_leather", "item_pants_iron", "item_pants_lumita",
  "item_boots_leather", "item_boots_travel", "item_boots_lumita", "item_cape_pelt", "item_cape_hunter", "item_cape_ruins"]) ASSETS[k] = `assets/flow/${k}.png`;
// rodada 104: arco e flechas do Arqueiro (Blender)
for (const k of ["tool_bow", "item_arrows_wood", "item_arrows_iron", "item_arrows_lumita"]) ASSETS[k] = `assets/flow/${k}.png`;
// rodada 104: Herbalismo — plantas do mapa, colhidas (toco) e ícones (Blender); a foice e a folha de colheita dos heróis
for (const k of ["res_herb", "res_flower", "res_moonlily", "res_crystalbloom", "herb_cut"]) { ASSETS[k] = `assets/flow/${k}.png`; SPRITE_SIZE[k] = [1.2, 1.2]; }
for (const k of ["item_herb", "item_flower_honey", "item_moonlily", "item_crystal_bloom", "tool_sickle"]) ASSETS[k] = `assets/flow/${k}.png`;
for (const n of [1, 2, 3]) { ASSETS[`hero_${n}_reap`] = `assets/flow/hero_${n}_reap.png`; SPRITE_SIZE[`hero_${n}_reap`] = [3 * 1.45 * 1.5, 4 * 1.45 * 1.5]; }

// rodada 105: ícones da secundária (escudos, orbes) e dos braceletes
for (const k of ["item_shield_wood", "item_shield_iron", "item_shield_lumita", "item_orb_quartz", "item_orb_amber", "item_orb_lumita",
  "item_bracelet_leather", "item_bracelet_iron", "item_bracelet_lumita", "item_book_apprentice", "item_book_amber", "item_book_lumita", "item_greatsword"]) ASSETS[k] = `assets/flow/${k}.png`;
// rodada 105: chão dos biomas novos (texturas pintadas recoloridas: neve, areia rubra, rocha e mata escura)
for (const k of ["snow", "snow_2", "sand_2", "rockg", "rockg_2", "grass_night", "grass_night_2"]) ASSETS[k] = `assets/flow/${k}.png`;
// rodada 105: cenário dos biomas novos (a partir da arte pintada do mapa 1; Pedra no Blender), gemas e flores raras
for (const [k, s] of [["tree_dark", 2.1], ["palm", 1.7], ["cactus", 1.3], ["boulder", 1.6], ["boulder_snow", 1.6], ["deco_waystone", 1.5],
  ["deco_bush_dark", 1.25], ["deco_bush_dry", 1.25], ["deco_bush_snow", 1.25], ["deco_bush_mountain", 1.25],
  ["rock_obsidian", 1.25], ["rock_sun", 1.25], ["rock_mithril", 1.25], ["rock_frost", 1.25], ["rock_amethyst", 1.25], ["rock_adamant", 1.25], ["rock_ruby", 1.25], ["rock_starice", 1.25],
  ["res_shadecap", 1.2], ["res_desertrose", 1.2], ["res_rockmoss", 1.2], ["res_frostbloom", 1.2], ["res_nightbloom", 1.2], ["res_edelweiss", 1.2], ["res_sunlotus", 1.2], ["res_aurora", 1.2]]) {
  ASSETS[k] = `assets/flow/${k}.png`; SPRITE_SIZE[k] = [s, s];
}
for (const k of ["tree_pine", "tree_snowpine"]) { ASSETS[k] = `assets/flow/${k}.png`; SPRITE_SIZE[k] = [1.5, 2.1]; } // como o cedro

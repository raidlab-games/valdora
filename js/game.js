// Valdora — o "cola" do jogo: estado (jogador, mapa, monstros), laço de atualização e desenho, combate do herói e habilidades,
// tutorial, janelas e salvamento. Os sistemas e o desenho ficam nos módulos js/*.js (ver "Estrutura" no README).
(() => {
  "use strict";
  // ---------- Constantes ----------
  let W = ValdoraWorld.W, H = ValdoraWorld.H; const TILE = 48; // rodada 105: continente (o quadro antigo é 96 x 72)
  const TICK = 0.5;        // pulso do jogo (s): ações, combate e IA acontecem em ticks
  const STEP = 0.24;       // tempo para andar 1 tile (s)
  const MOB_STEP = 0.42;
  const SLOTS = 20, BANK_SLOTS = 48, SAVE_KEY = "valdora.save.v2";
  const RULES = ValdoraRules, MAX_LVL = RULES.MAX_LVL;
  const WORLD_G = ValdoraWorld; let WORLD = WORLD_G, TOWN = WORLD.TOWN, SPAWN = WORLD.SPAWN, TOWNS = WORLD.VILLAGES; // desenho do mundo e masmorras (js/world.js)
  // rodada 105: a casa do herói é desenhada no quadro antigo; no continente, as coordenadas dela andam (OX, OY)
  const HOME_L = JSON.parse(JSON.stringify({ LOT: ValdoraHome.LOT, HOUSE: ValdoraHome.HOUSE, PEDESTALS: ValdoraHome.PEDESTALS, BED: ValdoraHome.BED, BENCH: ValdoraHome.BENCH, MINT: ValdoraHome.MINT }));
  for (const o of [ValdoraHome.LOT, ValdoraHome.HOUSE, ValdoraHome.BED, ValdoraHome.BENCH, ValdoraHome.MINT, ...ValdoraHome.PEDESTALS]) { o.x += WORLD_G.OX; o.y += WORLD_G.OY; }
  let HOME = ValdoraHome;
  const { SKILLS, RARITY, ITEMS, RES, MOBS, GEAR, SMELT, CRAFT, ORDER_POOL, STYLES, REGIONS, TUTORIAL, TIPS, BUFFS, SHOP_ITEMS, ACHIEVEMENTS } = VD;
  const SND = ValdoraAudio, noise = ValdoraTerrain.noise, LIGHT = ValdoraLight;
  const { CHATTER, BARD_SONGS, ACTIVE, QUESTS } = VD;
  const EQUIP_KEYS = Object.keys(VD.EQUIP_SLOTS); // rodada 104: espaços do boneco que recebem itens (a munição só o arqueiro usa)
  const isArcher = () => !!(HEROES.find((h) => h.id === player.hero) || {}).archer; // rodada 104: o Arqueiro atira de longe
  const heroSec = () => (HEROES.find((h) => h.id === player.hero) || {}).sec; // rodada 105: escudo, flecha ou orbe (espaço "Secundária")
  const arrows = () => { const q = player.equip.municao; return q && ITEMS[q.name] && ITEMS[q.name].ammo ? q : null; }; // flechas na secundária
  const ARROW_RANGE = 4.3; // alcance do arco (tiles)

  const $ = (id) => document.getElementById(id);
  const UI = ValdoraUI, esc = UI.esc;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // rodada 63: o aleatório do jogo passa por RNG, que as medições podem fixar com ValdoraGame.seed(n) (mesmo mundo e mesmas jogadas
  // nos dois lados de uma comparação). No jogo normal, RNG é Math.random.
  let RNG = Math.random;
  // rodada 66: a dica da segunda queda avisa o custo do Defensivo (o Combate ganha ~metade do XP: 1,3 contra 2,55 por dano)
  const DEF_TIP = "Dica do Ivo: caiu de novo? Na aba Equip., o estilo Defensivo dá +4 de defesa e apara golpes, mas o Combate sobe na metade do ritmo. Troque quando quiser.";
  const mulberry32 = RULES.mulberry32; // rodada 64: mora em js/rules.js
  const rand = () => RNG(), ri = (a, b) => a + Math.floor(rand() * (b - a + 1));
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const DIRS8V = [...DIRS, [1, 1], [1, -1], [-1, 1], [-1, -1]]; // rodada 105: vizinhos em 8 direções
  const DG = Math.SQRT1_2, DIR_VEC = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0], // rodada 105: + diagonais
    downleft: [-DG, DG], downright: [DG, DG], upleft: [-DG, -DG], upright: [DG, -DG] };
  // curvas de easing (sem movimento linear seco)
  const ease = {
    outQuad: (t) => 1 - (1 - t) * (1 - t), inQuad: (t) => t * t, outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2, outBack: (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2),
  };
  const hash = ValdoraTerrain.hash;
  const { iconImg, isSpecial, itemColor, accBonus, accName, affLine, badgeImg, affBadges, itemTip } = UI;
  const bonusText = RULES.bonusText;
  const masterBadge = (k) => UI.masterBadge(!!(gearItem(k) || {}).master); // rodada 104: obra-prima é da peça

  // ---------- Imagens: cada arte é rasterizada uma vez num canvas do tamanho final ----------
  const SPR = {}, WHITE = {};
  const assetsReady = Promise.all(Object.entries(ASSETS).map(([key, src]) => new Promise((done) => {
    const img = new Image();
    img.onload = () => {
      const [w, h] = SPRITE_SIZE[key] || [1, 1];
      const c = document.createElement("canvas"); c.width = Math.round(w * TILE);
      c.height = window.ASPECT_FIT.has(key) ? Math.round(c.width * img.naturalHeight / img.naturalWidth) : Math.round(h * TILE); // rodada 105: 4 ou 8 linhas
      // pixel art pequena amplia sem suavizar; artes grandes (PNG) reduzem com filtro de qualidade
      const g = c.getContext("2d"); g.imageSmoothingEnabled = img.naturalWidth > c.width; g.imageSmoothingQuality = "high";
      g.drawImage(img, 0, 0, c.width, c.height);
      if (key === "deco_town_sign") UI.paintSign(g, c.width, c.height, "Lumeira");
      if (key === "deco_training_post") UI.paintPost(g, c.width, c.height, "Treino");
      if (key === "deco_crypt_signpost") UI.paintStone(g, c.width, c.height, "Cripta");
      SPR[key] = c; done();
    };
    img.onerror = () => { console.warn("Valdora: arte não carregou:", key, src); done(); };
    img.src = src;
  })));
  // Folhas animadas (Blender, js/anim_data.js): cada célula cobre 1,6x o sprite; pés a 12,5% da base.
  // Reduzidas UMA vez para o tamanho de tela; depois o desenho é um drawImage direto da região da folha.
  const ANIMS = {}, AM = window.ANIM_META || { margin: 1.6, ground: 0.125 };
  // rodada 50: folhas "overlay" (tiles 0) que cobrem exatamente a arte de outra peça, quadro a quadro, no mesmo retângulo
  const OVERLAY_HOST = { fx_candle_flames: "deco_shrine_offering", fx_offering_coins: "deco_shrine_offering", fx_votive_candles: "deco_shrine_offering" }; // rodada 51: moedas na tigela; rodada 52: velas votivas
  // rodada 105: folhas "lazy" (vistas extras dos monstros) e as dos heróis que ninguém está usando não carregam no início:
  // lazyAnim() as busca quando aparecem na tela e as descarta depois de 40 s sem uso; o herói escolhido carrega no start().
  const isHeroKey = (k) => /^hero_\d(_|$)/.test(k);
  const loadAnim = (key, A) => new Promise((done) => {
    if (A.fx && !(A.tiles > 0) && !OVERLAY_HOST[key]) return done(); // rodada 40: folha da tela inicial (fx_banner_wave, 640 × 120): o lobby usa direto por CSS
    const img = new Image();
    img.onload = () => {
      const hero = HEROES.find((h) => h.id === key), isHero = !!hero; // hero_N_dash não é herói: usa SPRITE_SIZE próprio
      const host = OVERLAY_HOST[key] && (SPRITE_SIZE[OVERLAY_HOST[key]] || [1, 1]);
      const size = host ? [host[0] / AM.margin, host[1] / AM.margin] : A.fx ? [A.tiles / AM.margin, A.tiles / AM.margin] : isHero ? [(SPRITE_SIZE[hero.sheet] || [3])[0] / HERO_SHEET.cols, (SPRITE_SIZE[hero.sheet] || [3])[0] / HERO_SHEET.cols] : (SPRITE_SIZE[key] || SPRITE_SIZE[key.split("@")[0]] || [1, 1]);
      const cw = Math.round(size[0] * TILE * AM.margin), ch = Math.round((size[1] || size[0]) * TILE * AM.margin);
      const cols = Math.round(img.naturalWidth / A.cell), rows = Math.round(img.naturalHeight / A.cell);
      const c = document.createElement("canvas"); c.width = cols * cw; c.height = rows * ch;
      const g = c.getContext("2d"); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high"; g.drawImage(img, 0, 0, c.width, c.height);
      if (key === "deco_town_sign") UI.paintSignSheet(g, cw, ch, cols, AM.margin, AM.ground, "Lumeira"); // nome acompanha a tábua
      ANIMS[key] = { c, cell: cw, cw, ch, rows: A.rows, fx: !!A.fx }; done();
    };
    img.onerror = () => { console.warn("Valdora: folha animada não carregou:", key); done(); };
    img.src = A.src;
  });
  const animsReady = Promise.all(Object.entries(window.ANIM_SHEETS || {}).filter(([key, A]) => !A.lazy && !isHeroKey(key)).map(([key, A]) => loadAnim(key, A)));
  const lazyUse = {}, lazyLoading = {};
  function lazyAnim(key) {
    lazyUse[key] = performance.now();
    if (ANIMS[key]) return ANIMS[key];
    const A = (window.ANIM_SHEETS || {})[key];
    if (A && !lazyLoading[key]) lazyLoading[key] = loadAnim(key, A).then(() => { delete lazyLoading[key]; });
    return null;
  }
  setInterval(() => { const now = performance.now(); // solta as vistas que ninguém desenhou nos últimos 40 s
    for (const k of Object.keys(lazyUse)) if (now - lazyUse[k] > 40000 && ANIMS[k] && (window.ANIM_SHEETS[k] || {}).lazy) { delete ANIMS[k]; delete lazyUse[k]; } }, 10000);
  function heroAnims(id) { // folhas do herói escolhido; as dos outros saem da memória
    for (const k of Object.keys(ANIMS)) if (isHeroKey(k) && !(k === id || k.startsWith(id + "_"))) delete ANIMS[k];
    return Promise.all(Object.entries(window.ANIM_SHEETS || {}).filter(([k]) => (k === id || k.startsWith(id + "_")) && !ANIMS[k]).map(([k, A]) => loadAnim(k, A)));
  }
  function whiteOf(key) { // silhueta branca para o "flash" de dano
    if (WHITE[key] || !SPR[key]) return WHITE[key];
    const s = SPR[key], c = document.createElement("canvas"); c.width = s.width; c.height = s.height;
    const g = c.getContext("2d"); g.drawImage(s, 0, 0); g.globalCompositeOperation = "source-in";
    g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
    return (WHITE[key] = c);
  }
  const animKey = (key, t, off = 0) => { const a = ANIM[key]; return a ? a[Math.floor(t / 0.7 + off) % a.length] : key; };

  const xpFor = RULES.xpFor, level = RULES.level;   // curva de XP e nível (js/rules.js)
  // zona segura por mapa: a vila só existe no mapa de cima (nas masmorras, as mesmas coordenadas não protegem nem bloqueiam nada)
  const inTown = (x, y) => !inCrypt && TOWNS.some((T) => x >= T.x0 && x <= T.x1 && y >= T.y0 && y <= T.y1); // rodada 105: qualquer vila
  function regionAt(x, y) {
    if (inCrypt) return dungeon; // "crypt" ou "den"
    if (inTown(x, y)) return "town";
    return WORLD.regionShape(x, y);
  }

  // ---------- Lobby: a tela inicial fica em js/lobby.js, que usa window.ValdoraGame ----------
  // opções: volume de efeitos e música, tremor de tela (guardadas em localStorage pelo módulo de áudio)
  $("opt-sfx").value = ValdoraAudio.opts.sfx; $("opt-music").value = ValdoraAudio.opts.music; $("opt-shake").checked = ValdoraAudio.opts.shake;
  $("opt-btn").onclick = () => { $("options").hidden = !$("options").hidden; };
  $("me-face").onclick = () => { if (running) shortcut("p"); }; // rodada 105: o retrato abre a ficha
  $("opt-sfx").oninput = (e) => { ValdoraAudio.setOpt("sfx", +e.target.value); ValdoraAudio.play("coin"); };
  $("opt-music").oninput = (e) => ValdoraAudio.setOpt("music", +e.target.value);
  $("opt-shake").onchange = (e) => ValdoraAudio.setOpt("shake", e.target.checked);
  $("opt-zoom").value = ValdoraAudio.opts.zoom || "auto"; $("opt-ui").value = (() => { const u = ValdoraAudio.opts.ui; return !u || u === "auto" ? "auto" : +u >= 1.5 ? "2" : "1"; })(); // rodada 80: 1,15/1,3 antigos viram 1×
  $("opt-zoom").onchange = (e) => { ValdoraAudio.setOpt("zoom", e.target.value); resize(); };
  $("opt-ui").onchange = (e) => { ValdoraAudio.setOpt("ui", e.target.value === "auto" ? "auto" : +e.target.value); applyUi(); };
  $("exit").onclick = () => { $("options").hidden = true; save(); running = false; closeDlg(); $("game").hidden = true; $("lobby").hidden = false; document.dispatchEvent(new Event("valdora:lobby")); };

  // ---------- Mundo ----------
  let map, occ, objects, resources, mobs, lakes, ground, groundItems, corpses, npc = {};
  let inCrypt = false, overworld = null, dungeon = "crypt"; // masmorra: o mundo de cima fica guardado enquanto o jogador está lá embaixo
  function seeded(s) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }

  function genLocal() { // o mapa de antes, no quadro local (96 x 72), igual ao de sempre
    const rnd = seeded(20261030);
    map = Array.from({ length: H }, () => Array(W).fill("grass"));
    occ = new Array(W * H).fill(null);
    objects = []; resources = []; mobs = []; groundItems = []; corpses = []; npc = {};
    // chão por região
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const r = regionAt(x, y), n = rnd();
      map[y][x] = r === "west" ? (n < 0.3 ? "dirt_2" : "dirt") : r === "south" ? (n < 0.3 ? "grass_dark_2" : "grass_dark")
        : r === "ruins" ? (noise(x, y, 4.5, 5) > 0.54 ? "stone" : n < 0.3 ? "dirt_2" : "dirt")
        : n < 0.04 ? "grass_flowers" : n < 0.3 ? "grass_2" : "grass";
    }
    // lagos: [cx, cy, raio, tipo de cardume, quantos cardumes]
    lakes = WORLD.LAKES
      .map(([cx, cy, r, kind, n]) => ({ cx, cy, r, kind, n, tiles: [] }));
    for (const L of lakes)
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const d = Math.hypot(x - L.cx, (y - L.cy) * 1.25) + (noise(x, y, 3.2, L.cx) - 0.5) * 3.4; // margem irregular
        if (d < L.r) { map[y][x] = "water"; L.tiles.push([x, y]); }
        else if (d < L.r + 0.6 + noise(x, y, 2.5, L.cy + 7) * 1.7 && map[y][x] !== "water") map[y][x] = "sand";
      }
    // estradas
    const road = (x, y) => { if (map[y][x] !== "water") map[y][x] = "path"; };
    for (let x = 0; x < W; x++) { road(x, 36); road(x, 37); }
    for (let y = 0; y < H; y++) { road(48, y); road(49, y); }
    // vila: praça calçada + construções
    for (let y = TOWN.y0; y <= TOWN.y1; y++) for (let x = TOWN.x0; x <= TOWN.x1; x++) map[y][x] = (x === 48 || x === 49 || y === 36 || y === 37) ? "path" : "stone";
    const deco = (type, spr, x, y, w = 1, h = 1, extra = {}) => place({ type, spr, x, y, w, h, solid: true, ...extra });
    deco("house", "house_red", 42, 30, 3, 2); deco("house", "house_blue", 53, 30, 3, 2); deco("house", "house_green", 42, 41, 3, 2);
    npc.stall = deco("stall", "stall", 51, 33, 2, 1);
    npc.merchant = deco("merchant", "npc_merchant", 53, 33, 1, 1, { name: "Bento" });
    npc.guard = deco("guard", "npc_guard", 46, 34, 1, 1, { name: "Ivo" });
    npc.bank = deco("bank", "chest", 45, 32, 1, 1);
    npc.furnace = deco("furnace", "furnace", 51, 40, 1, 1);
    npc.anvil = deco("anvil", "anvil", 53, 40, 1, 1);
    npc.board = deco("board", ASSETS.deco_board ? "deco_board" : "deco_sign", 50, 31, 1, 1);
    deco("barrel", "barrel", 50, 33); deco("barrel", "barrel", 54, 34); deco("barrel", "barrel", 55, 40); deco("barrel", "barrel", 46, 39);
    deco("well", "well", 44, 35);
    if (SPR.deco_quest_board_ivo) for (const [x, y] of [[47, 33], [45, 33], [47, 35]]) // mural decorativo ao lado do Ivo
      if (!occ[y * W + x] && map[y][x] !== "path") { npc.ivoBoard = deco("sign", "deco_quest_board_ivo", x, y, 1, 1, { label: "Mural do Ivo: procura-se lobos e goblins. Fale com o Ivo para ver as missões (M abre o diário)." }); break; }
    // boneco de treino (tutorial "saia da área vermelha"): precisa de um 3x3 livre e andável ao redor
    for (const [x, y] of [[55, 39], [56, 34], [43, 33], [47, 41]]) {
      let ok = true; for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1 && ok; dx++) if (occ[(y + dy) * W + x + dx] || map[y + dy][x + dx] === "water") ok = false;
      if (ok && SPR.deco_dummy) { npc.dummy = deco("dummy", "deco_dummy", x, y, 1, 1); break; }
    }
    if (npc.dummy && SPR.deco_training_post) // poste "Treino" a 2 passos do boneco (fora da área do revide)
      for (const [dx, dy] of [[-2, 0], [0, -2], [2, 0], [0, 2], [-2, -1], [-2, 1]]) {
        const x = npc.dummy.x + dx, y = npc.dummy.y + dy;
        if (inside(x, y) && !occ[y * W + x] && map[y][x] !== "water" && map[y][x] !== "path") { npc.post = deco("sign", "deco_training_post", x, y, 1, 1, { label: "Treino: golpeie o boneco e saia da área vermelha antes do revide." }); break; }
      }
    deco("fire", "campfire", 45, 39);
    if (SPR.deco_meat_rack) for (const [x, y] of [[46, 40], [47, 39], [44, 40]]) // rodada 31: varal de carne (onde se faz o espetinho); deixa livres os lados do fogo
      if (!occ[y * W + x] && map[y][x] !== "path" && map[y][x] !== "water") { npc.rack = deco("rack", "deco_meat_rack", x, y, 1, 1); break; }
    if (SPR.deco_campfire_log) for (const [x, y] of [[45, 40], [44, 40]]) // rodada 32: tronco-banco abaixo do fogo
      if (!occ[y * W + x] && map[y][x] !== "path" && map[y][x] !== "water") { npc.log = deco("bench", "deco_campfire_log", x, y, 1, 1); break; }
    npc.bard = deco("bard", "npc_bard", 44, 38, 1, 1, { name: "Tomé" });
    if (SPR.deco_shrine_offering) { // rodada 49: santuário 2x1 na praça, com a linha de cima livre (a arte tem 2 de altura) e a frente andável
      const free = (x, y) => inside(x, y) && !occ[y * W + x] && map[y][x] !== "path" && !/water/.test(map[y][x]) && regionAt(x, y) === "town";
      const walk = (x, y) => inside(x, y) && !occ[y * W + x] && !/water/.test(map[y][x]);
      for (const [x, y] of [[42, 35], [50, 35], [46, 31], [51, 31]])
        if (free(x, y) && free(x + 1, y) && free(x, y - 1) && free(x + 1, y - 1) && walk(x, y + 1) && walk(x + 1, y + 1)) { npc.shrine = deco("shrine", "deco_shrine_offering", x, y, 2, 1); break; }
    }
    const CE = WORLD.CRYPT_ENTRY; npc.crypt = deco("crypt", "deco_crypt", CE.x, CE.y, 1, 1);
    const GH = (WORLD.MOB_SPAWNS.west.find((s) => s[0] === "golem") || [])[2];
    if (GH && SPR.deco_plateau_cairn) for (let r = 0, done = false; r < 5 && !done; r++) for (let dy = -r; dy <= r && !done; dy++) for (let dx = -r; dx <= r && !done; dx++) {
      const x = GH.x + dx, y = GH.y + dy; // marco no ponto de caça dos golems
      if (inside(x, y) && regionAt(x, y) === "west" && !occ[y * W + x] && !/water/.test(map[y][x])) { deco("sign", "deco_plateau_cairn", x, y, 1, 1, { label: "Pedras dos garimpeiros: os golems de musgo se juntam por aqui. Cuidado para não puxar vários de uma vez." }); done = true; } // rodada 81: o Marco do Planalto agora é o Coração de lumita
    }
    if (SPR.deco_ruins_arch) for (const [x, y] of [[72, 21], [73, 21], [72, 22], [70, 22]]) { // arco na entrada das Ruínas: 3 tiles livres em linha
      if ([0, 1, 2].every((k) => inside(x + k, y) && !occ[y * W + x + k] && !/water/.test(map[y][x + k]))) { place({ type: "gate", spr: "deco_ruins_arch", x, y, w: 3, h: 1, solid: false }); break; }
    }
    if (SPR.deco_crypt_signpost) for (const [x, y] of [[71, 20], [71, 19], [72, 20], [69, 19]]) // lápide "Cripta" na entrada das Ruínas, ao lado da placa de perigo
      if (inside(x, y) && !occ[y * W + x] && !/water|path/.test(map[y][x])) { deco("sign", "deco_crypt_signpost", x, y, 1, 1, { label: "Cripta das Ruínas: a escada fica a nordeste, entre as colunas (nível 18+)." }); break; }
    map[CE.y][CE.x] = "stone"; map[CE.y + 1][CE.x] = "stone";
    // Toca dos Lobos: entrada na Mata Sombria (tile livre mais perto do ponto marcado)
    for (let r = 0, done = false; r < 8 && !done; r++) for (let dy = -r; dy <= r && !done; dy++) for (let dx = -r; dx <= r && !done; dx++) {
      const x = WORLD.DEN_ENTRY.x + dx, y = WORLD.DEN_ENTRY.y + dy;
      if (!inside(x, y + 1) || regionAt(x, y) !== "south" || occ[y * W + x] || occ[(y + 1) * W + x] || /water|sand/.test(map[y][x]) || /water/.test(map[y + 1][x])) continue;
      npc.den = deco("den", SPR[WORLD.ENTRY_SPR.den] ? WORLD.ENTRY_SPR.den : "deco_crypt", x, y, 1, 1); map[y][x] = "dirt"; map[y + 1][x] = "dirt"; done = true;
    }
    for (const [x, y] of [[40, 28], [57, 28], [40, 44], [57, 44], [51, 43], [41, 39]]) if (!occ[y * W + x]) deco("bush", "deco_bush", x, y);
    for (const [x, y, label] of WORLD.SIGNS) deco("sign", "deco_sign", x, y, 1, 1, { label });
    // rodada 67: props da praça (Flow). Depois de tudo que procura lugar livre na vila, só em pedra livre e com os 4 vizinhos
    // livres (não fecham passagem nem NPC); a pedra da vila não sorteia enfeites, então o resto do mundo sai igual.
    for (const [spr, x, y] of [["deco_planter", 46, 29], ["deco_planter", 50, 29], ["deco_lamppost", 47, 35], ["deco_lamppost", 50, 38], ["deco_lamppost", 47, 38], ["deco_lamppost", 50, 35],
      ["deco_crates", 41, 32], ["deco_crates", 56, 41], ["deco_bench", 45, 43], ["deco_haycart", 54, 43]])
      if (SPR[spr] && map[y][x] === "stone" && !occ[y * W + x] && DIRS.every(([dx, dy]) => !occ[(y + dy) * W + x + dx])) deco("prop", spr, x, y);
    // portal de boas-vindas na entrada sul (não bloqueia: passa-se por baixo da tábua)
    if (ASSETS.deco_town_sign) place({ type: "gate", spr: "deco_town_sign", x: 47, y: 44, w: 3, h: 1, ox: 0.45, solid: false });
    homeObjs = null; { const H = HOME; // rodada 100: lote/casa, 9 pedestais, cama do filhote, banco e vaso (aparecem conforme o save)
      homeObjs = { house: place({ type: "home", spr: "house_hero_lot", x: H.HOUSE.x, y: H.HOUSE.y, w: H.HOUSE.w, h: H.HOUSE.h, solid: true }),
        peds: H.PEDESTALS.map((p) => place({ type: "pedestal", spr: null, x: p.x, y: p.y, w: 1, h: 1, solid: false })),
        bed: place({ type: "decal_home", spr: null, x: H.BED.x, y: H.BED.y, w: 1, h: 1, solid: false }), bench: place({ type: "prop", spr: null, x: H.BENCH.x, y: H.BENCH.y, w: 1, h: 1, solid: false }),
        mint: place({ type: "prop", spr: null, x: H.MINT.x, y: H.MINT.y, w: 1, h: 1, solid: false }) }; }
    // acampamento goblin no bosque
    const camp = WORLD.CAMP;
    deco("fire", "campfire", camp.x, camp.y, 1, 1, { goblin: true });
    for (const [dx, dy] of [[-2, -1], [2, 1], [-1, 2]]) deco("barrel", "barrel", camp.x + dx, camp.y + dy);
    // ruínas: colunas e trechos de muro quebrados (se as artes existirem)
    for (let i = 0, tries = 0; i < 18 && tries < 600 && (ASSETS.deco_pillar || ASSETS.deco_ruin_wall); tries++) {
      const x = 71 + Math.floor(rnd() * 24), y = 1 + Math.floor(rnd() * 16), wall = ASSETS.deco_ruin_wall && (!ASSETS.deco_pillar || rnd() < 0.45), w = 1;
      if (Math.hypot(x - 84, y - 8) < 4.5) continue; // deixa a arena do chefe livre
      let ok = true;
      for (let k = 0; k < w; k++) if (!inside(x + k, y) || regionAt(x + k, y) !== "ruins" || map[y][x + k] === "water" || occ[y * W + x + k]) ok = false;
      if (!ok) continue;
      deco("ruin", wall ? "deco_ruin_wall" : "deco_pillar", x, y, w, 1); i++;
    }
    // recursos por região (chance por tile livre)
    const TABLE = {
      fields: [["tree", 0.06], ["rock", 0.014], ["bush", 0.006], ["res_herb", 0.012], ["res_flower", 0.006]], // rodada 104: plantas no fim (o resto não muda)
      east: [["tree_oak", 0.055], ["tree", 0.025], ["rock_iron", 0.016], ["rock", 0.006], ["bush", 0.008], ["res_flower", 0.01], ["res_herb", 0.006]],
      south: [["tree_cedar", 0.045], ["tree_oak", 0.025], ["rock_iron", 0.008], ["bush", 0.006], ["res_moonlily", 0.01], ["res_herb", 0.005]],
      west: [["rock_lumita", 0.02], ["rock_iron", 0.018], ["tree", 0.01], ["res_crystalbloom", 0.012]],
      ruins: [["rock_iron", 0.02], ["rubble", 0.03], ["tree_cedar", 0.008]],
    };
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      if (!/^(grass|dirt|stone)/.test(map[y][x]) || occ[y * W + x] || nearTown(x, y, 3) || Math.hypot(x - camp.x, y - camp.y) < 3) continue;
      const reg = regionAt(x, y); if (map[y][x] === "stone" && reg !== "ruins") continue;
      const tab = TABLE[reg] || []; let n = rnd();
      for (const [kind, p] of tab) {
        if (n < p) {
          if (kind === "bush") deco("bush", "deco_bush", x, y);
          else if (kind === "rubble") place({ type: "decal", spr: "rubble", x, y, w: 1, h: 1, solid: false });
          else addResource(kind, x, y);
          break;
        }
        n -= p;
      }
    }
    // cardumes
    for (const L of lakes) {
      L.shore = L.tiles.filter(([x, y]) => DIRS.some(([dx, dy]) => inside(x + dx, y + dy) && map[y + dy][x + dx] !== "water"));
      for (let i = 0; i < L.n; i++) { const o = addResource(L.kind, 0, 0, { lake: L }); relocateSpot(o, true); }
    }
    // monstros: [tipo, quantidade, ponto de origem opcional]
    for (const [reg, list] of Object.entries(WORLD.MOB_SPAWNS))
      for (const [type, n, home] of list) for (let i = 0; i < n; i++) spawnMob(type, reg, home);
    // rodada 68: props fora da praça (beira do lago e entrada do Bosque), sempre a até 6 tiles da vila: ali nenhum monstro
    // nasce (spawnOk), então o sorteio do mundo fixo das medições não muda. Procura em anel até 3 tiles do ponto pedido.
    const propNear = (spr, x0, y0, ok) => { for (let r = 0; r <= 3; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const x = x0 + dx, y = y0 + dy; if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || !SPR[spr]) continue;
      if (!inside(x, y) || inTown(x, y) || !nearTown(x, y, 6) || occ[y * W + x] || /water|path/.test(map[y][x]) || !ok(x, y)) continue;
      if (!DIRS.every(([ax, ay]) => inside(x + ax, y + ay) && !occ[(y + ay) * W + x + ax])) continue;
      return deco("prop", spr, x, y); } return null; };
    const nearWater = (x, y) => { for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (inside(x + dx, y + dy) && map[y + dy][x + dx] === "water") return true; return false; };
    propNear("deco_bench", 39, 25, (x, y) => nearWater(x, y)); // banco na beira do lago
    propNear("deco_lamppost", 60, 35, (x, y) => /^grass/.test(map[y][x])); propNear("deco_crates", 61, 38, (x, y) => /^grass/.test(map[y][x]));
  }
  // ================= rodada 105: o continente =================
  // 1) o mapa antigo é gerado como sempre, no quadro local (96 x 72, coordenadas e sorteios de antes); 2) é encaixado em
  // (OX, OY) no continente; 3) o resto do continente (Campo crescido e os 4 biomas novos, vilas, pedras, estradas, masmorras,
  // recursos e monstros) é gerado em volta; 4) acabamento (água funda, flores, poças, marcos da campanha, chão e minimapa).
  function genWorld() {
    const Gw = WORLD_G, Lw = Gw.local();
    WORLD = Lw; TOWN = Lw.TOWN; SPAWN = Lw.SPAWN; TOWNS = [Lw.TOWN]; W = Lw.W; H = Lw.H; HOME = HOME_L;
    mobIdx.clear(); try { genLocal(); } finally { WORLD = Gw; TOWN = Gw.TOWN; SPAWN = Gw.SPAWN; TOWNS = Gw.VILLAGES; W = Gw.W; H = Gw.H; HOME = ValdoraHome; }
    embedLocal(Gw.OX, Gw.OY); indexMobs();
    genContinent();
    finishWorld(); indexMobs();
  }
  function embedLocal(OX, OY) {
    const Lw = WORLD_G.local(), lw = Lw.W, lh = Lw.H, old = map;
    map = Array.from({ length: H }, () => Array(W).fill("water"));
    for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) map[y + OY][x + OX] = old[y][x];
    for (const o of objects) { o.x += OX; o.y += OY; }
    occ = new Array(W * H).fill(null);
    for (const o of objects) for (let y = o.y; y < o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) occ[y * W + x] = o;
    for (const L of lakes) { L.cx += OX; L.cy += OY; L.tiles = L.tiles.map(([x, y]) => [x + OX, y + OY]); L.shore = (L.shore || []).map(([x, y]) => [x + OX, y + OY]); }
    const homeOf = new Map(); // casa local de cada bando -> a mesma casa no continente
    for (const [reg, list] of Object.entries(Lw.MOB_SPAWNS)) list.forEach((s, i) => { if (s[2]) homeOf.set(s[2], WORLD_G.MOB_SPAWNS[reg][i][2]); });
    for (const m of mobs) { m.x += OX; m.y += OY; m.fx += OX; m.fy += OY; m.px += OX; m.py += OY; m.hx += OX; m.hy += OY; if (m.home) m.home = homeOf.get(m.home) || { ...m.home, x: m.home.x + OX, y: m.home.y + OY }; }
    AMBIENT.setPuddles([]);
  }
  // chão de cada bioma novo (com reserva quando a arte não existe)
  const GROUND_OF = { darkwood: ["grass_night", "grass_night_2", "grass_dark", "grass_dark_2"], desert: ["sand_2", "sand_2", "sand", "sand"], mountains: ["rockg", "rockg_2", "dirt", "stone"], snow: ["snow", "snow_2", "stone", "stone"] };
  // recursos e enfeites por região (chance por tile livre); as do Campo são as da tabela antiga
  const TABLE_NEW = {
    darkwood: [["tree_dark", 0.07], ["tree_cedar", 0.012], ["rock_obsidian", 0.014], ["rock_iron", 0.006], ["res_shadecap", 0.01], ["bushv:deco_bush_dark", 0.01], ["rare:rock_amethyst", 0.004], ["rare:res_nightbloom", 0.004]],
    desert: [["cactus", 0.026], ["palm", 0.012], ["rock_sun", 0.012], ["rock", 0.005], ["boulder_sand", 0.008], ["res_desertrose", 0.009], ["bushv:deco_bush_dry", 0.008], ["deco:deco_bones_1", 0.003], ["rare:rock_ruby", 0.0035], ["rare:res_sunlotus", 0.0035]],
    mountains: [["tree_pine", 0.034], ["rock_mithril", 0.014], ["rock_iron", 0.01], ["boulder", 0.022], ["res_rockmoss", 0.008], ["bushv:deco_bush_mountain", 0.006], ["rare:rock_adamant", 0.004], ["rare:res_edelweiss", 0.004]],
    snow: [["tree_snowpine", 0.05], ["rock_frost", 0.014], ["rock_lumita", 0.004], ["res_frostbloom", 0.009], ["boulder_snow", 0.01], ["bushv:deco_bush_snow", 0.006], ["rare:rock_starice", 0.003], ["rare:res_aurora", 0.003]],
  };
  const TABLE_CAMPO = {
    fields: [["tree", 0.06], ["rock", 0.014], ["bush", 0.006], ["res_herb", 0.012], ["res_flower", 0.006]],
    east: [["tree_oak", 0.055], ["tree", 0.025], ["rock_iron", 0.016], ["rock", 0.006], ["bush", 0.008], ["res_flower", 0.01], ["res_herb", 0.006]],
    south: [["tree_cedar", 0.045], ["tree_oak", 0.025], ["rock_iron", 0.008], ["bush", 0.006], ["res_moonlily", 0.01], ["res_herb", 0.005]],
    west: [["rock_lumita", 0.02], ["rock_iron", 0.018], ["tree", 0.01], ["res_crystalbloom", 0.012]],
    ruins: [["rock_iron", 0.02], ["rubble", 0.03], ["tree_cedar", 0.008]],
  };
  // rodada 105: chão em mosaico por bioma — base + manchas de outros chãos em duas escalas (como a grama/terra do mapa 1)
  function groundFor(key, x, y, b, tile) {
    const m1 = noise(x, y, 9, 31 + b), m2 = noise(x, y, 5, 57 + b), m3 = noise(x, y, 14, 77 + b);
    if (key === "darkwood") return m2 > 0.72 ? (m1 > 0.5 ? "dirt_2" : "dirt") : m1 > 0.64 ? "grass_dark" : m3 > 0.6 ? tile("grass_night_2", "grass_dark_2") : tile("grass_night", "grass_dark");
    if (key === "mountains") return WORLD_G.fbm(x / 14, y / 14, 61) > 0.68 ? tile("snow", "stone") : m1 > 0.6 ? tile("rockg", "stone") : m2 > 0.7 ? "grass_dark" : m3 > 0.62 ? "dirt_2" : "dirt";
    if (key === "desert") return m1 < 0.24 ? tile("rockg", "stone") : m2 > 0.74 ? "dirt" : m1 > 0.62 ? "sand" : tile("sand_2", "sand");
    if (key === "snow") return m2 > 0.8 ? "dirt_2" : m1 < 0.1 ? tile("rockg", "stone") : m3 > 0.58 ? tile("snow_2", "stone") : tile("snow", "stone");
    return "grass";
  }
  // pontos de interesse: ruínas, acampamentos abandonados (com fogueira para assar) e ossadas, espalhados pelo bioma
  const POI = { darkwood: ["ruins", "bones", "camp", "ruins", "bones", "camp", "ruins", "bones", "camp", "ruins"], desert: ["ruins", "bones", "bones", "camp", "ruins", "bones", "camp", "ruins", "bones", "camp"],
    mountains: ["camp", "ruins", "rubble", "camp", "ruins", "rubble", "camp", "bones", "ruins", "camp"], snow: ["camp", "bones", "ruins", "camp", "bones", "ruins", "camp", "bones", "camp", "ruins"] };
  function placePOIs(rnd, deco) {
    const G = WORLD_G, free = (x, y) => inside(x, y) && !occ[y * W + x] && !/water|path/.test(map[y][x]) && !nearTown(x, y, 8) && !G.inOld(x, y) && !MTN.block[y * W + x] && !MTN.elev[y * W + x];
    for (const B of G.BIOMES.slice(1)) for (const kind of POI[B.key]) {
      let p = null;
      for (let k = 0; k < 300 && !p; k++) { const a = rnd() * 6.283, r = Math.sqrt(rnd()) * B.c[2] * 1.2, x = Math.round(B.c[0] + Math.cos(a) * r), y = Math.round(B.c[1] + Math.sin(a) * r);
        if (G.biomeAt(x, y) === B.n && free(x, y) && !G.DG_ENTRIES.some((E) => Math.hypot(E.x - x, E.y - y) < 6)) p = { x, y }; }
      if (!p) continue;
      const near = (n, fn) => { for (let i = 0, tries = 0; i < n && tries < 60; tries++) { const x = p.x + Math.round((rnd() - 0.5) * 7), y = p.y + Math.round((rnd() - 0.5) * 5); if (free(x, y)) { fn(x, y); i++; } } };
      if (kind === "ruins") { near(4 + Math.floor(rnd() * 3), (x, y) => deco("ruin", rnd() < 0.45 && SPR.deco_ruin_wall ? "deco_ruin_wall" : "deco_pillar", x, y));
        near(4, (x, y) => place({ type: "decal", spr: "rubble", x, y, w: 1, h: 1, solid: false })); }
      else if (kind === "camp") { if (free(p.x, p.y)) deco("fire", "campfire", p.x, p.y, 1, 1, { wild: true });
        near(2, (x, y) => deco("barrel", "barrel", x, y)); near(1, (x, y) => SPR.deco_crates && deco("prop", "deco_crates", x, y)); near(1, (x, y) => SPR.deco_campfire_log && deco("bench", "deco_campfire_log", x, y)); }
      else if (kind === "bones") near(5, (x, y) => place({ type: "bones", spr: ["deco_bones_1", "deco_bones_2", "deco_bones_3"][Math.floor(rnd() * 3)], x, y, w: 1, h: 1, solid: false }));
      else if (kind === "rubble") near(7, (x, y) => place({ type: "decal", spr: "rubble", x, y, w: 1, h: 1, solid: false }));
    }
  }

  // ================= rodada 106: montanhas de verdade =================
  // Platô com contorno natural (mancha de ruído), borda de rocha e face sul (2 tiles) que não se atravessam; uma escada talhada
  // na face é o único caminho. No topo: um bando de monstros (que não descem), um minério (às vezes raro) ou nada — refúgio:
  // monstro não sobe montanha. Pequenas em todos os biomas; muitas e maiores nas Montanhas de Ferro.
  let MTN = null;
  const elevAt = (x, y) => (MTN && !inCrypt && inside(x, y) ? MTN.elev[y * W + x] : 0); // 0 chão, 1 topo, 2 escada
  const MTN_CFG = { 1: [9, 3, 6, 1], 2: [12, 3, 7, 2], 3: [46, 4, 9, 0], 4: [12, 3, 7, 3], 5: [14, 3, 8, 4] }; // bioma: quantas, raio mín/máx, tema
  const MTN_ORE = { 1: ["rock_iron", "rock_lumita"], 2: ["rock_obsidian", "rock_amethyst"], 3: ["rock_mithril", "rock_adamant"], 4: ["rock_sun", "rock_ruby"], 5: ["rock_frost", "rock_starice"] };
  function placeMountains(rnd) {
    const G = WORLD_G, n = W * H;
    MTN = { mask: new Uint8Array(n), theme: new Uint8Array(n), block: new Uint8Array(n), elev: new Uint8Array(n), stairs: new Map(), list: [] };
    const used = new Uint8Array(n), key = (x, y) => y * W + x;
    for (const [bs, [count, rmin, rmax, theme]] of Object.entries(MTN_CFG)) {
      const b = +bs, B = G.BIOMES[b - 1];
      for (let made = 0, tries = 0; made < count && tries < count * 60; tries++) {
        const a = rnd() * 6.283, rr = Math.sqrt(rnd()) * B.c[2] * 1.25, cx = Math.round(B.c[0] + Math.cos(a) * rr), cy = Math.round(B.c[1] + Math.sin(a) * rr);
        if (G.biomeAt(cx, cy) !== b || G.inOld(cx, cy)) continue;
        const R = rmin + rnd() * (rmax - rmin), ex = 0.75 + rnd() * 0.7, ang = rnd() * 3.14, ca = Math.cos(ang), sa = Math.sin(ang), seed = 300 + tries + b * 1000;
        const M = new Set(), span = Math.ceil(R * Math.max(1, ex) + 2);
        for (let y = cy - span; y <= cy + span; y++) for (let x = cx - span; x <= cx + span; x++) {
          const dx = x - cx, dy = y - cy, u = (dx * ca + dy * sa) / (R * ex), v = (-dx * sa + dy * ca) / R;
          if (Math.hypot(u, v) + (noise(x, y, 3.5, seed) - 0.5) * 0.6 < 1) M.add(key(x, y));
        }
        if (M.size < 14) continue;
        const F = new Set(); // face: os 2 tiles abaixo de cada tile da borda sul
        for (const k of M) { const x = k % W, y = (k / W) | 0; if (!M.has(key(x, y + 1))) { F.add(key(x, y + 1)); if (!M.has(key(x, y + 2))) F.add(key(x, y + 2)); } }
        let ok = true;
        for (const k of [...M, ...F]) { const x = k % W, y = (k / W) | 0;
          for (let dy = -2; dy <= 2 && ok; dy++) for (let dx = -2; dx <= 2 && ok; dx++) { const X = x + dx, Y = y + dy;
            if (!inside(X, Y) || used[key(X, Y)] || G.biomeAt(X, Y) !== b || G.inOld(X, Y) || /water|path/.test(map[Y][X]) || occ[key(X, Y)] || nearTown(X, Y, 3)) ok = false; }
          if (!ok) break; }
        if (!ok || G.DG_ENTRIES.some((E) => Math.abs(E.x - cx) < span + 5 && Math.abs(E.y - cy) < span + 5)) continue;
        const T = [...M].filter((k) => { const x = k % W, y = (k / W) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!M.has(key(x + dx, y + dy))) return false; return true; });
        if (T.length < 6) continue;
        // escada: coluna com borda (topo logo acima), as 2 de face e chão livre embaixo
        const cand = [];
        for (const k of M) { const x = k % W, y = (k / W) | 0;
          if (!M.has(key(x, y + 1)) && F.has(key(x, y + 1)) && F.has(key(x, y + 2)) && T.includes(key(x, y - 1)) && !M.has(key(x - 1, y + 1)) && !M.has(key(x + 1, y + 1)) && !used[key(x, y + 3)]) cand.push([x, y]); }
        if (!cand.length) continue;
        const [sx, sy] = cand[Math.floor(rnd() * cand.length)], th = ["gray", "green", "dark", "sand", "snow"][theme];
        for (const k of M) { MTN.mask[k] = 1; MTN.theme[k] = theme; MTN.block[k] = 1; }
        for (const k of F) MTN.block[k] = 1;
        for (const k of T) { MTN.block[k] = 0; MTN.elev[k] = 1; }
        for (const k of [...M, ...F]) { const x = k % W, y = (k / W) | 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (inside(x + dx, y + dy)) used[key(x + dx, y + dy)] = 1; }
        for (const [x, y] of [[sx, sy], [sx, sy + 1], [sx, sy + 2]]) { MTN.block[key(x, y)] = 0; MTN.elev[key(x, y)] = 2; }
        MTN.stairs.set(key(sx, sy + 1), { part: "t", theme: th }); MTN.stairs.set(key(sx, sy + 2), { part: "b", theme: th });
        const r = rnd(); MTN.list.push({ b, top: T.map((k) => [k % W, (k / W) | 0]), kind: r < 0.38 ? "hunt" : r < 0.7 ? "ore" : "empty", stairs: { x: sx, y: sy + 3 } });
        made++;
      }
    }
  }
  function fillMountains(rnd) { // depois dos recursos: o que cada topo guarda
    const G = WORLD_G;
    for (const m of MTN.list) {
      const free = m.top.filter(([x, y]) => !occ[y * W + x]);
      if (m.kind === "ore") { const [base, rare] = MTN_ORE[m.b], k = 2 + Math.floor(rnd() * 2);
        for (let i = 0; i < k && free.length; i++) { const [x, y] = free.splice(Math.floor(rnd() * free.length), 1)[0], kind = i === 0 && rnd() < 0.5 && RES[rare] && SPR[rare] ? rare : base; if (RES[kind] && SPR[kind]) addResource(kind, x, y); } }
      else if (m.kind === "hunt") {
        const reg = G.regionShape(m.top[0][0], m.top[0][1]), pool = m.b === 1 ? (WORLD_G.CAMPO_EXTRA[reg] || []).map((s) => s[0]) : G.BIOME_SPAWNS[G.BKEY[m.b]].map((s) => s[0]);
        const types = [...new Set(pool)].filter((ty) => MOBS[ty] && !MOBS[ty].boss); if (!types.length) continue;
        const type = types[Math.min(types.length - 1, Math.floor(types.length * (0.4 + rnd() * 0.6)))]; // do meio para o alto da faixa
        const c = m.top[Math.floor(m.top.length / 2)], home = { x: c[0], y: c[1], r: 3, elev: 1 }, n = 3 + Math.floor(rnd() * 3);
        for (let i = 0; i < n; i++) spawnMob(type, reg, home);
      }
    }
  }
  function genContinent() {
    const G = WORLD_G, rnd = seeded(20261105), OX = G.OX, OY = G.OY;
    const tile = (k, alt) => (SPR[k] ? k : alt);
    // chão fora do quadro antigo
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (G.inOld(x, y)) continue;
      const b = G.biomeAt(x, y), n = rnd();
      if (!b) { map[y][x] = "water"; continue; }
      if (b === 1) { const r = G.regionShape(x, y);
        map[y][x] = r === "west" ? (n < 0.3 ? "dirt_2" : "dirt") : r === "south" ? (n < 0.3 ? "grass_dark_2" : "grass_dark")
          : r === "ruins" ? (noise(x, y, 4.5, 5) > 0.54 ? "stone" : n < 0.3 ? "dirt_2" : "dirt") : n < 0.04 ? "grass_flowers" : n < 0.3 ? "grass_2" : "grass";
        continue; }
      map[y][x] = groundFor(G.BKEY[b], x, y, b, tile);
    }
    // praia de areia no litoral (1-2 tiles), menos na neve (gelo) e nas montanhas (pedra)
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const b = G.biomeAt(x, y); if (!b || G.inOld(x, y) || b === 5 || b === 3) continue; // neve e montanhas sem praia
      let sea = false; for (let dy = -2; dy <= 2 && !sea; dy++) for (let dx = -2; dx <= 2 && !sea; dx++) if (!G.biomeAt(x + dx, y + dy)) sea = Math.hypot(dx, dy) <= 1.6 + noise(x, y, 2.5, 9) * 0.8;
      if (sea && map[y][x] !== "water") map[y][x] = "sand";
    }
    // lagos novos (os 5 primeiros são os antigos, já desenhados)
    for (const [cx, cy, r, kind, n] of G.LAKES.slice(lakes.length)) {
      const Lk = { cx, cy, r, kind, n, tiles: [] }; lakes.push(Lk);
      for (let y = Math.max(0, Math.floor(cy - r * 1.6)); y <= Math.min(H - 1, Math.ceil(cy + r * 1.6)); y++)
        for (let x = Math.max(0, Math.floor(cx - r * 2)); x <= Math.min(W - 1, Math.ceil(cx + r * 2)); x++) {
          if (G.inOld(x, y) || !G.biomeAt(x, y)) continue;
          const d = Math.hypot(x - cx, (y - cy) * 1.25) + (noise(x, y, 3.2, cx) - 0.5) * 3.4;
          if (d < r) { map[y][x] = "water"; Lk.tiles.push([x, y]); } else if (d < r + 0.6 + noise(x, y, 2.5, cy + 7) * 1.7 && map[y][x] !== "water") map[y][x] = G.biomeAt(x, y) === 5 ? tile("snow_2", "stone") : "sand";
        }
    }
    // estradas da praça de Lumeira até cada vila (sobre a água viram ponte de terra batida)
    for (const [a, b] of G.ROADS) {
      const len = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y)), px = -(b.y - a.y) / len, py = (b.x - a.x) / len;
      for (let i = 0; i <= len; i++) { const t = i / len, w = Math.sin(t * Math.PI) * (noise(i, len, 9, a.x + b.y) - 0.5) * 26;
        const x = Math.round(a.x + (b.x - a.x) * t + px * w), y = Math.round(a.y + (b.y - a.y) * t + py * w);
        for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) if (inside(x + dx, y + dy) && !G.inOld(x + dx, y + dy) && !occ[(y + dy) * W + x + dx]) map[y + dy][x + dx] = "path"; }
    }
    const deco = (type, spr, x, y, w = 1, h = 1, extra = {}) => place({ type, spr, x, y, w, h, solid: true, ...extra });
    // vilas novas: a mesma planta da Lumeira (casas, banca e mercador, cofre, fornalha, bigorna, fogueira, poço, quadro e a Pedra)
    const MERCH = { breu: "Saulo", oasis: "Zaíra", escarpa: "Dagoberto", degelo: "Ilka" };
    const HOUSES = { breu: ["house_green", "house_blue", "house_green"], oasis: ["house_red", "house_red", "house_blue"], escarpa: ["house_blue", "house_blue", "house_red"], degelo: ["house_blue", "house_green", "house_blue"] };
    for (const v of G.VILLAGES) {
      if (v.main) { // Lumeira: a Pedra entra num tile livre da praça
        const cx = (TOWN.x0 + TOWN.x1) / 2, cy = (TOWN.y0 + TOWN.y1) / 2, cand = [];
        for (let y = TOWN.y0 + 1; y < TOWN.y1; y++) for (let x = TOWN.x0 + 1; x < TOWN.x1; x++) cand.push([x, y]);
        cand.sort((p, q) => Math.hypot(p[0] - cx, p[1] - cy) - Math.hypot(q[0] - cx, q[1] - cy));
        for (const [x, y] of cand) // tile de pedra livre mais perto do centro da praça, com os 8 vizinhos livres (não fecha passagem)
          if (!occ[y * W + x] && map[y][x] === "stone" && DIRS8V.every(([dx, dy]) => !occ[(y + dy) * W + x + dx] && map[y + dy][x + dx] !== "water")) { v.stone = { x, y }; break; }
      } else {
        const cx = v.x0 + 8, cy = v.y0 + 7;
        for (let y = v.y0; y <= v.y1; y++) for (let x = v.x0; x <= v.x1; x++) map[y][x] = x === cx || x === cx + 1 || y === cy || y === cy + 1 ? "path" : "stone";
        const at = (dx, dy) => [v.x0 + dx, v.y0 + dy], hs = HOUSES[v.key];
        deco("house", hs[0], ...at(1, 1), 3, 2); deco("house", hs[1], ...at(12, 1), 3, 2); deco("house", hs[2], ...at(1, 12), 3, 2);
        deco("stall", "stall", ...at(10, 4), 2, 1); deco("merchant", "npc_merchant", ...at(12, 4), 1, 1, { name: MERCH[v.key], village: v.key });
        deco("bank", "chest", ...at(4, 3)); deco("furnace", "furnace", ...at(10, 11)); deco("anvil", "anvil", ...at(12, 11));
        deco("board", ASSETS.deco_board ? "deco_board" : "deco_sign", ...at(9, 2)); deco("well", "well", ...at(3, 6)); deco("fire", "campfire", ...at(4, 10));
        deco("barrel", "barrel", ...at(9, 4)); deco("barrel", "barrel", ...at(14, 10)); deco("barrel", "barrel", ...at(5, 10));
        v.stone = { x: v.x0 + 6, y: v.y0 + 5 };
        for (const [x, y] of [at(-1, -1), at(17, -1), at(-1, 16), at(17, 16)]) if (inside(x, y) && !occ[y * W + x] && map[y][x] !== "water") deco("prop", SPR.deco_lamppost ? "deco_lamppost" : "deco_sign", x, y);
      }
      if (v.stone) v.stoneObj = deco("waystone", "deco_waystone", v.stone.x, v.stone.y, 1, 1, { village: v.key, label: v.name });
    }
    // entradas das masmorras dos biomas
    for (const E of G.DG_ENTRIES) {
      const spr = E.biome === 2 ? "deco_den" : E.biome === 5 ? (SPR.deco_rift_entrance ? "deco_rift_entrance" : "deco_crypt") : "deco_crypt";
      for (let dy = -1; dy <= 2; dy++) for (let dx = -1; dx <= 1; dx++) if (inside(E.x + dx, E.y + dy) && map[E.y + dy][E.x + dx] === "water") map[E.y + dy][E.x + dx] = "dirt";
      map[E.y][E.x] = "dirt"; map[E.y + 1][E.x] = "dirt";
      E.obj = deco("dungeon", SPR[spr] ? spr : "deco_crypt", E.x, E.y, 1, 1, { dungeon: E.key, label: E.name });
    }
    placeMountains(rnd);
    placePOIs(rnd, deco);
    // recursos e enfeites (fora do quadro antigo)
    for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
      if (G.inOld(x, y) || occ[y * W + x] || MTN.block[y * W + x] || MTN.elev[y * W + x] === 2 || nearTown(x, y, 3) || /water|path|sand/.test(map[y][x]) && G.biomeAt(x, y) !== 4) continue; // no deserto, areia recebe recurso
      if (map[y][x] === "water" || map[y][x] === "path") continue;
      const b = G.biomeAt(x, y), reg = G.regionShape(x, y);
      if (b === 3 && G.fbm(x / 9, y / 9, 41) > 0.7 && rnd() < 0.5) { place({ type: "decal", spr: "rubble", x, y, w: 1, h: 1, solid: false }); continue; } // rodada 106: cascalho no pé das montanhas (os paredões de pedregulho saíram)
      const tab = b === 1 ? TABLE_CAMPO[reg] : TABLE_NEW[reg]; if (!tab) continue;
      if (map[y][x] === "stone" && reg !== "ruins" && b === 1) continue;
      let n = rnd(); const dens = noise(x, y, 8, 99 + b), grove = dens > 0.56 ? 2.6 : dens < 0.36 ? 0.2 : 0.9; // bosques e clareiras
      for (const [kind, p0] of tab) {
        const p = b > 1 && /^(tree|palm|bushv)/.test(kind) ? p0 * grove : p0;
        if (n < p) {
          if (kind === "bush") deco("bush", "deco_bush", x, y);
          else if (kind === "rubble") place({ type: "decal", spr: "rubble", x, y, w: 1, h: 1, solid: false });
          else if (kind.startsWith("rare:")) { const k2 = kind.slice(5); if (G.depthAt(x, y) >= 0.55 && RES[k2] && SPR[k2]) addResource(k2, x, y); } // raros: só no fundo do bioma
          else if (kind.startsWith("bushv:")) { const s = kind.slice(6); if (SPR[s]) deco("bush", s, x, y); }
          else if (kind.startsWith("deco:")) { const s = kind.slice(5); if (SPR[s]) place({ type: "bones", spr: s, x, y, w: 1, h: 1, solid: false }); }
          else if (kind === "boulder" || kind === "boulder_snow" || kind === "boulder_sand") { if (SPR[kind]) deco("rock_wall", kind, x, y); }
          else if (RES[kind] && SPR[kind]) addResource(kind, x, y);
          break;
        }
        n -= p;
      }
    }
    // cardumes dos lagos novos
    for (const Lk of lakes) if (!Lk.shore) {
      Lk.shore = Lk.tiles.filter(([x, y]) => DIRS.some(([dx, dy]) => inside(x + dx, y + dy) && map[y + dy][x + dx] !== "water"));
      if (Lk.shore.length) for (let i = 0; i < Lk.n; i++) { const o = addResource(Lk.kind, 0, 0, { lake: Lk }); relocateSpot(o, true); }
    }
    fillMountains(rnd);
    // monstros: Campo crescido (fora do quadro antigo) e os biomas novos (bandos com casa)
    const outside = (m) => { if (m && G.inOld(m.x, m.y)) { m.dead = true; mobs.splice(mobs.indexOf(m), 1); } };
    for (const [reg, list] of Object.entries(G.CAMPO_EXTRA)) for (const [type, n] of list) for (let i = 0; i < n; i++) outside(spawnMob(type, reg, null));
    for (const [key, list] of Object.entries(G.BIOME_SPAWNS)) for (const [type, n, home] of list) if (MOBS[type]) for (let i = 0; i < n; i++) spawnMob(type, key, home);
  }
  function finishWorld() {
    const deepWater = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!WORLD.biomeAt(x, y)) deepWater[y * W + x] = 1; // mar aberto: água funda
    for (const L of lakes) if (L.kind === "fishspot_deep") for (const [x, y] of L.tiles) deepWater[y * W + x] = 1;
    for (const L of lakes) if (L.kind === "fishspot_deep") for (const [x, y] of L.tiles) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++)
      if (inside(x + dx, y + dy) && map[y + dy][x + dx] !== "water") deepWater[(y + dy) * W + x + dx] = 1;
    RENDER.setDeepWater(deepWater);
    // canteiros de flores: objetos não sólidos, para balançarem com a folha do Blender
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++)
      if (!occ[y * W + x] && /^grass/.test(map[y][x]) && !/dark|night/.test(map[y][x]) && !nearTown(x, y, 1) && hash(x, y, 31) < 0.006) place({ type: "flora", spr: "deco_flowers", x, y, w: 1, h: 1, solid: false });
    // rodada 75: pontos de poça (terra e estrada, ~4% dos tiles, pelo hash da posição: não usa o aleatório do jogo)
    const pud = []; for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++)
      if (/^(path|dirt)/.test(map[y][x]) && !occ[y * W + x] && hash(x, y, 53) < 0.04) pud.push({ x: x + 0.3 + hash(x, y, 54) * 0.4, y: y + 0.5 + hash(x, y, 55) * 0.3, r: 0.4 + hash(x, y, 56) * 0.25 });
    const lamps = objects.filter((o) => o.spr === "deco_lamppost" || o.type === "fire");
    for (const p of pud) { let lit = 0; for (const o of lamps) { const d = Math.hypot(o.x + 0.5 - p.x, o.y + 0.5 - p.y); if (d < 3) lit = Math.max(lit, 1 - d / 3); } p.lit = lit; }
    AMBIENT.setPuddles(pud);
    const deco = (type, spr, x, y, w = 1, h = 1, extra = {}) => place({ type, spr, x, y, w, h, solid: true, ...extra });
    // rodada 78: marcos da campanha, depois de todo o sorteio
    CAMPAIGN_RT.place(deco, (x, y) => inside(x, y) && !occ[y * W + x] && !/water|path|sand/.test(map[y][x]) && regionAt(x, y) !== "town", npc);
    ground = ValdoraTerrain.create({ map, W, H, TILE, spr: SPR, decal: decalAt, mtn: MTN });
    buildMinimap();
  }
  function decalAt(x, y) { // decorações do chão (não bloqueiam): canteiros, tufos, pedrinhas...
    const o = occ[y * W + x];
    if (o && o.type === "decal") return o.spr;
    if (o) return null;
    const fam = ground ? ground.family(map[y][x]) : map[y][x], h = hash(x, y, 31);
    if (fam === "grass") return h < 0.006 ? null : h < 0.05 ? "tuft" : h < 0.07 ? "flowers" : h < 0.08 ? "pebbles" : null; // canteiros viram objetos animados
    if (fam === "grass_dark" || fam === "grass_night") return h < 0.05 ? "tuft_dark" : h < 0.065 ? "mushroom" : h < 0.09 ? "leaves" : null;
    if (fam === "rockg") return h < 0.06 ? "pebbles" : h < 0.08 ? "tuft_dry" : h < 0.09 ? "twigs" : null; // rodada 105: detalhes do chão dos biomas novos
    if (fam === "snow") return h < 0.035 ? "snowdrift" : h < 0.06 ? "snowtuft" : h < 0.075 ? "icecrack" : h < 0.085 ? "twigs" : null;
    if (fam === "sand_2" || (fam === "sand" && WORLD.biomeAt && WORLD.biomeAt(x, y) === 4)) return h < 0.04 ? "tuft_dry" : h < 0.065 ? "stones_red" : h < 0.075 ? "twigs" : null;
    if (fam === "dirt") return h < 0.05 ? "pebbles" : h < 0.08 ? "tuft_dry" : null;
    return null;
  }
  // ---------- Cripta das Ruínas (masmorra instanciada: 3 salas, guardiões e um baú selado) ----------
  function genCrypt(kind = "crypt") { // masmorra instanciada (js/world.js: DUNGEONS)
    const D = WORLD.DUNGEONS[kind];
    map = Array.from({ length: H }, () => Array(W).fill("void")); occ = new Array(W * H).fill(null);
    objects = []; resources = []; mobs = []; groundItems = []; lakes = []; npc = {}; RENDER.clearOnce(); mobIdx.clear();
    const floor = D.floor.map((k, i) => SPR[k] || !D.fallbackFloor ? k : D.fallbackFloor[i]); // chão próprio quando a arte existe
    const carve = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) map[y][x] = noise(x, y, 3, D.seed) > 0.62 ? floor[0] : floor[1]; };
    D.rooms.forEach((b) => carve(...b)); D.halls.forEach((b) => carve(...b)); // salas e corredores
    if (D.glowTile && SPR[D.glowTile]) { // rodada 84: veios largos só embaixo dos braseiros e em ~1 de cada 25 tiles (pelo hash, sem o aleatório do jogo)
      for (const [x, y] of D.lights.at) if (map[y] && map[y][x] !== "void") map[y][x] = D.glowTile;
      D.rooms.forEach(([x0, y0, x1, y1]) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (hash(x, y, D.seed) < 0.04) map[y][x] = D.glowTile; });
    }
    npc.exit = place({ type: "crypt_exit", spr: SPR[D.exitSpr] ? D.exitSpr : "deco_crypt", x: D.exit.x, y: D.exit.y, w: 1, h: 1, solid: true });
    const lightSpr = SPR[D.lights.spr] ? D.lights.spr : (D.lights.fallback || D.lights.spr);
    for (const [x, y] of D.lights.at) place({ type: "fire", spr: lightSpr, x, y, w: 1, h: 1, solid: true, brazier: D.lights.brazier });
    if (D.seal && SPR.deco_seal_pedestal_dim) npc.seal = place({ type: "seal", spr: CAMPAIGN_RT.sealLit() ? "deco_seal_pedestal_lit" : "deco_seal_pedestal_dim", x: D.seal.x, y: D.seal.y, w: 1, h: 1, solid: true }); // rodada 83
    npc.chest = place({ type: "crypt_chest", spr: D.chestSpr && SPR[D.chestSpr] ? D.chestSpr : "chest", openSpr: D.chestOpenSpr, x: D.chest.x, y: D.chest.y, w: 1, h: 1, solid: true, opened: false, loot: D.loot, event: D.event });
    for (const [type, n, home, extra] of D.spawns) for (let i = 0; i < n; i++) {
      const m = spawnMob(type, kind, home, null, { temp: true, dungeon: true, ...(extra || {}) });
      if (m && m.sleeping && !(ANIMS[m.d.spr] && ANIMS[m.d.spr].rows.sleep)) m.sleeping = false; // sem a linha "sleep", ficam acordados
    }
    // ossos e restos de caça (enfeite, não bloqueiam)
    const BONES = (D.decor || ["deco_bones_1", "deco_bones_2", "deco_bones_3"]).filter((k) => SPR[k]); // rodada 82: cristais na Fenda
    for (let i = 0, tries = 0; BONES.length && i < (D.bones || 0) && tries < 300; tries++) {
      const [x0, y0, x1, y1] = D.rooms[Math.floor(rand() * D.rooms.length)], x = x0 + 1 + Math.floor(rand() * (x1 - x0 - 1)), y = y0 + 1 + Math.floor(rand() * (y1 - y0 - 1));
      if (occ[y * W + x] || mobAt(x, y) || (x === D.start.x && y === D.start.y)) continue;
      place({ type: "bones", spr: BONES[i % BONES.length], x, y, w: 1, h: 1, solid: false }); i++;
    }
    const gq = player.quests.guardiao, gs = gq && !gq.done && QUESTS.guardiao.steps[gq.step]; // "O guardião desperto": o Colosso guarda o baú
    if (kind === "crypt" && gs && gs.ev === "kill:crypt_colossus") spawnMob("crypt_colossus", "crypt", { x: 44, y: 11 }, null, { temp: true, dungeon: true });
    ground = ValdoraTerrain.create({ map, W, H, TILE, spr: SPR, decal: decalAt });
    buildMinimap();
  }
  function enterCrypt(o, kind = "crypt") {
    const D = WORLD.DUNGEONS[kind];
    if (D.unlock && !(player.quests[D.unlock] && player.quests[D.unlock].done)) { log(D.locked, "warn"); return; }
    overworld = { map, occ, objects, resources, mobs, lakes, ground, groundItems, npc, ret: { x: o.x, y: o.y + 1 } };
    dungeon = kind; inCrypt = true; genCrypt(kind); closeDlg(); overworld.t0 = player.playT; // rodada 84: cronômetro da descida
    const s = D.start; Object.assign(player, { x: s.x, y: s.y, fx: s.x, fy: s.y, prog: 1, px: s.x, py: s.y, path: [], target: null, goal: null, job: null, dir: "right" });
    log(D.enter, "warn"); SND.play("warn"); showToast(...D.toast);
  }
  function leaveCrypt() {
    if (!inCrypt) return;
    ({ map, occ, objects, resources, mobs, lakes, ground, groundItems, npc } = overworld);
    inCrypt = false; buildMinimap(); indexMobs();
  }
  function exitCrypt() {
    const ret = overworld.ret; leaveCrypt(); closeDlg();
    Object.assign(player, { x: ret.x, y: ret.y, fx: ret.x, fy: ret.y, prog: 1, px: ret.x, py: ret.y, path: [], target: null, goal: null, job: null, dir: "down" });
    log(WORLD.DUNGEONS[dungeon].leave, "dim");
  }
  function openChest(o) {
    if (o.opened) { log(`O baú está vazio. ${dungeon === "den" ? "A toca" : dungeon === "rift" ? "A fenda" : "A cripta"} se reorganiza quando você volta.`, "dim"); return; }
    const left = mobs.filter((m) => !m.dead).length;
    const foes = WORLD.DUNGEONS[dungeon].foes;
    if (left) { log(`Um selo mágico mantém o baú fechado. Ainda há ${left} ${left > 1 ? foes[1] : foes[0]} de pé.`, "warn"); addFloat(o.x + 0.5, o.y - 0.4, "Selado", "#c79bff", 1.2, 14); return; }
    o.opened = true;
    if (o.openSpr && SPR[o.openSpr]) { o.spr = o.openSpr; SND.play("chop"); chestLoot(o); return; } // rodada 82: baú da Fenda (arte aberta própria)
    if (ANIMS.chest_open) { o.openT = 0; SND.play("chop"); return; } // a folha "open" solta o tesouro no quadro 3 (updateChest)
    chestLoot(o);
  }
  // Bento e Ivo dão uma volta curta de vez em quando (linha "walk" do Blender); param quando o jogador chega perto ou conversa
  const NPC_WALK = { guard: 2, merchant: 1, bard: 1 }, NPC_STEP = 0.5;
  // rodada 73: ronda do Ivo pela praça (pontos em volta de casa, um por saída; volta para casa entre eles)
  const PATROL = [[3, 2], [-2, 3], [2, -1], [-1, -2]];
  // rodada 34/35: reação ao entregar missão/encomenda — Ivo bate continência ("salute"), Bento faz joinha ("thumbs"); segura o último quadro 0,6 s
  const REACT = { guard: "salute", merchant: "thumbs", bard: "bow" }; // rodada 37: reverência do Tomé
  const reactDur = (o) => { const R = ANIMS[o.spr] && ANIMS[o.spr].rows[o.react.row]; return R ? R.frames / R.fps + 0.6 : 0; };
  function react(o) {
    const row = o && REACT[o.type]; if (!row || !ANIMS[o.spr] || !ANIMS[o.spr].rows[row]) return;
    if (o.sitT > 0) { if (ANIMS[o.spr].rows.stand_up) o.rise = { t: 0, moved: false }; return; } // rodada 38: sentado, levanta primeiro (stand_up) e depois se curva
    o.react = { row, t: 0 };
  }
  function updateNpcWalk(dt) {
    if (inCrypt) return;
    const B = npc.bard; if (B && B.rise) { // rodada 38: quadros 0–1 no tronco; no quadro 2 desce para o tile ao lado; ao fim, reverência
      const R = ANIMS[B.spr].rows.stand_up; B.rise.t += dt;
      if (!B.rise.moved && B.rise.t * R.fps >= 2) { B.rise.moved = true; standUp(B); if (B.sitT > 0) B.rise = null; } // sem tile livre: continua sentado
      if (B.rise && B.rise.t * R.fps >= R.frames) { B.rise = null; B.react = { row: "bow", t: 0 }; }
    }
    for (const o of [npc.guard, npc.merchant, npc.bard]) if (o && o.react) { // rodada 36/37: brilho dourado no quadro 3 (mão do Bento, elmo do Ivo, chapéu do Tomé)
      const R = ANIMS[o.spr] && ANIMS[o.spr].rows[o.react.row], before = o.react.t;
      if ((o.react.t += dt) > reactDur(o)) { o.react = null; continue; }
      const SP = { merchant: [-0.25, -0.4], guard: [0.05, -1.05], bard: [0.3, -0.1] }[o.type]; // centro do brilho (tiles; y já desconta o meio do quadro)
      if (R && before * R.fps < 3 && o.react.t * R.fps >= 3) RENDER.playOnce("fx_thumbs_spark", o.x + SP[0], o.y + SP[1]);
    }
    for (const o of [npc.guard, npc.merchant, npc.bard]) {
      if (!o || !ANIMS[o.spr] || !ANIMS[o.spr].rows.walk) continue;
      if (o.hx == null) { o.hx = o.x; o.hy = o.y; o.wait = 3 + rand() * 6; }
      // rodada 73: para onde o NPC olha parado. Com o herói a até 4 passos, vira para ele; o Bento, sozinho em casa, de vez em
      // quando se vira para a banca (arrumando) por 3 s. Só enfeite: usa Math.random, não o aleatório do jogo.
      if (!o.mv && Math.abs(player.x - o.x) + Math.abs(player.y - o.y) <= 4) {
        o.lookDir = window.DIR_AT(player.x - o.x, player.y - o.y) || "down"; // rodada 105: olha em 8 direções
      } else if (o.type === "merchant" && !o.mv && o.x === o.hx && o.y === o.hy) {
        o.tidyT = (o.tidyT ?? 6 + Math.random() * 8) - dt; o.lookDir = o.tidyT < 0 ? "left" : null;
        if (o.tidyT < -3) o.tidyT = 8 + Math.random() * 10;
      } else o.lookDir = null;
      if (o.mv) { if ((o.mv.t += dt / NPC_STEP / (o.mv.len || 1)) >= 1) o.mv = null; continue; }
      const busy = (dlg && dlg.kind === { merchant: "shop", guard: "guard", bard: "bard" }[o.type]) || (player.target && player.target.ref === o)
        || Math.abs(player.x - o.x) + Math.abs(player.y - o.y) <= 3 || (bubble && bubble.o === o);
      if (o.react || o.rise) continue; // parado durante a reação (e enquanto o Tomé levanta)
      if (o.sitT > 0) { if (busy) o.sitT = Math.max(o.sitT, 1); if ((o.sitT -= dt) <= 0) standUp(o); continue; } // rodada 33: sentado no tronco
      if (busy) { o.wait = Math.max(o.wait, 1.5); continue; }
      if ((o.wait -= dt) > 0) continue;
      if (!o.goal) { // escolhe um destino perto de casa; ao chegar, volta para casa
        const atHome = o.x === o.hx && o.y === o.hy, r = NPC_WALK[o.type];
        const seat = o.type === "bard" && atHome && npc.log && ANIMS[o.spr].rows.sit && rand() < 0.45 ? seatSpot() : null; // rodada 33: às vezes vai sentar no tronco
        const patrol = o.type === "guard" && atHome ? PATROL[(o.patrolI = ((o.patrolI ?? -1) + 1) % PATROL.length)] : null; // rodada 73: ronda do Ivo
        o.goal = seat ? { ...seat, sit: true } : patrol ? { x: o.hx + patrol[0], y: o.hy + patrol[1] } : atHome ? { x: o.hx + ri(-r, r), y: o.hy + ri(-r, r) } : { x: o.hx, y: o.hy };
      }
      const free = (x, y) => inside(x, y) && inTown(x, y) && map[y][x] !== "water" && !occ[y * W + x] && !mobAt(x, y) && !(player.x === x && player.y === y);
      // rodada 105: também anda na diagonal (sem cortar quina); distância em 8 direções
      const oct = (x, y) => { const a = Math.abs(x - o.goal.x), b = Math.abs(y - o.goal.y); return Math.max(a, b) + 0.414 * Math.min(a, b); }, d0 = oct(o.x, o.y);
      const steps = DIRS8V.map(([dx, dy]) => [o.x + dx, o.y + dy, dx, dy]).filter(([x, y, dx, dy]) => free(x, y) && (!dx || !dy || (free(o.x + dx, o.y) && free(o.x, o.y + dy))) && oct(x, y) < d0 - 0.01);
      if (!steps.length) { const home = o.x === o.hx && o.y === o.hy; o.goal = home ? null : { x: o.hx, y: o.hy }; o.wait = 1 + rand() * 2; continue; }
      const [nx, ny] = steps[Math.floor(rand() * steps.length)];
      occ[o.y * W + o.x] = null; o.mv = { fx: o.x, fy: o.y, t: 0, len: nx !== o.x && ny !== o.y ? Math.SQRT2 : 1 }; o.x = nx; o.y = ny; occ[ny * W + nx] = o; o.steps = (o.steps || 0) + 1;
      if (nx === o.goal.x && ny === o.goal.y) { const sit = o.goal.sit; o.goal = null; o.wait = 4 + rand() * 7; if (sit) o.wantSit = 0.6; }
    }
    // o Tomé chegou ao lado do tronco: sobe nele e fica 20–40 s tocando (a casa dele vira o tronco enquanto isso)
    const b = npc.bard; if (b && b.wantSit > 0 && !b.mv && (b.wantSit -= dt) <= 0) { b.wantSit = 0; sitDown(b); }
  }
  const seatSpot = () => { const L = npc.log; return [[L.x - 1, L.y], [L.x, L.y + 1], [L.x + 1, L.y]].map(([x, y]) => ({ x, y })).find(({ x, y }) => inside(x, y) && !occ[y * W + x] && map[y][x] !== "water") || null; };
  function sitDown(o) {
    const L = npc.log; if (!L || occ[L.y * W + L.x] !== L || Math.abs(o.x - L.x) + Math.abs(o.y - L.y) !== 1) return;
    o.sitFrom = { x: o.x, y: o.y }; occ[o.y * W + o.x] = null; o.x = L.x; o.y = L.y; occ[L.y * W + L.x] = o; o.sitT = 20 + rand() * 20;
  }
  function standUp(o) {
    // rodada 38: desce de preferência para baixo do tronco (o tile da esquerda fica atrás do telhado da casa e escondia o Tomé)
    const L = npc.log, okT = (t) => t && inside(t.x, t.y) && !occ[t.y * W + t.x] && map[t.y][t.x] !== "water" && !(player.x === t.x && player.y === t.y);
    const back = [{ x: o.x, y: o.y + 1 }, o.sitFrom, ...DIRS.map(([dx, dy]) => ({ x: o.x + dx, y: o.y + dy }))].find(okT);
    if (!back) { o.sitT = 3; return; } // tudo ocupado: espera mais um pouco sentado
    occ[o.y * W + o.x] = L; o.x = back.x; o.y = back.y; occ[back.y * W + back.x] = o; o.sitT = 0; o.sitFrom = null; o.goal = { x: o.hx, y: o.hy }; o.wait = 1;
  }
  // boneco de treino: o golpe faz o boneco balançar e "revidar" numa área vermelha 3x3; sair dela a tempo conta como esquiva
  const DRILL = 1.4; // segundos de aviso (como o golpe do Senhor: dá para sair andando com folga)
  function hitDummy(o) {
    if (o.drill) { log("Saia da área vermelha antes que o boneco revide!", "warn"); return; }
    if (player.actT > 0) return;
    faceRect(o); player.actT = 3;
    useTool("tool_sword", () => { o.wobbleT = 0; SND.play("hit"); addFloat(o.x + 0.5, o.y - 0.8, "tok!", "#e8d9b0", 0.6, 12); o.drill = { t: 0 }; SND.play("warn"); });
  }
  function updateDummy(dt) {
    const o = npc.dummy; if (!o) return;
    if (o.wobbleT != null && (o.wobbleT += dt) > 1) o.wobbleT = null;
    if (o.swingT != null && (o.swingT += dt) * ANIMS.deco_dummy.rows.swing.fps >= ANIMS.deco_dummy.rows.swing.frames) o.swingT = null; // giro do revide terminou
    if (!o.drill) return;
    if ((o.drill.t += dt) >= DRILL - 0.3 && o.swingT == null && ANIMS.deco_dummy && ANIMS.deco_dummy.rows.swing) o.swingT = 0; // revide: gira o braço
    if (o.drill.t < DRILL) return;
    o.drill = null; if (o.swingT == null) o.wobbleT = 0;
    const inside = Math.max(Math.abs(player.x - o.x), Math.abs(player.y - o.y)) <= 1;
    if (inside) { addFloat(player.px + 0.5, player.py - 0.6, "Pego! Saia antes", "#ff6b5a", 1.2, 13); player.flash = 0.12; SND.play("hurt"); log("O boneco te acertou (sem dano). Saia da área vermelha antes do fim do aviso.", "dim"); }
    else { addFloat(player.px + 0.5, player.py - 0.6, "Esquivou!", "#7dff9a", 1.2, 14); SND.play("quest"); emit("dodge"); }
  }
  function updateChest(dt) {
    const o = npc.chest; if (!o || o.openT == null) return;
    const R = ANIMS.chest_open.rows.open; o.openT += dt;
    if (!o.looted && o.openT >= R.impact / R.fps) chestLoot(o);
    if (o.openT >= R.frames / R.fps && SPR.chest_open) { o.spr = "chest_open"; o.openT = null; }
  }
  function chestLoot(o) {
    const LOOT = VD[o.loot || "CRYPT_CHEST"];
    o.looted = true; o.glowT = 2.5; const coins = ri(...LOOT.coins); player.coins += coins; hudDirty = true;
    for (const [item, pch, a = 1, b = a] of LOOT.rolls) if (rand() < pch)
      dropItem(item, ri(a, b), o.x, o.y + 1, null, ITEMS[item].slot ? RULES.rollAffixes(rand() < 0.35 ? 2 : 1, 0, rand) : undefined);
    if (o.event === "rift" && overworld && overworld.t0 != null) { const s = Math.round(player.playT - overworld.t0), best = player.stats.riftBest; // rodada 84: melhor tempo na Fenda
      player.stats.rifts = (player.stats.rifts || 0) + 1;
      if (!best || s < best) { player.stats.riftBest = s; if (best) showToast("Novo recorde na Fenda!", `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} (antes ${Math.floor(best / 60)}:${String(best % 60).padStart(2, "0")})`, "#7fe8ff"); } }
    if ((o.event || "crypt") === "crypt") player.stats.crypts = (player.stats.crypts || 0) + 1; else player.stats.dens = (player.stats.dens || 0) + 1;
    checkAch(); emit(o.event || "crypt");
    SND.play("rare"); burst(o.x + 0.5, o.y + 0.4, ["#f1c40f", "#ffffff", "#c79bff"], 40, 5); if (SND.opts.shake) shake = 0.2;
    showToast("Tesouro da cripta!", `+${coins} moedas e espólios no chão.`, "#f1c40f"); log(`O selo se rompe! +${coins} moedas.`, "gold"); save();
  }
  function nearTown(x, y, m) { return !inCrypt && TOWNS.some((T) => x >= T.x0 - m && x <= T.x1 + m && y >= T.y0 - m && y <= T.y1 + m); }
  function place(o) {
    objects.push(o);
    for (let y = o.y; y < o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) occ[y * W + x] = o;
    return o;
  }
  function addResource(kind, x, y, extra = {}) {
    const r = RES[kind];
    const o = place({ type: "res", kind, spr: kind, x, y, w: 1, h: 1, solid: true, charges: ri(...r.charges), respawn: 0, shake: 0, ...extra });
    resources.push(o); return o;
  }
  function relocateSpot(o, first) {
    const L = o.lake;
    if (!first && occ[o.y * W + o.x] === o) occ[o.y * W + o.x] = null;
    const free = L.shore.filter(([x, y]) => !occ[y * W + x]);
    const [x, y] = free[Math.floor(rand() * free.length)] || L.shore[0];
    o.x = x; o.y = y; occ[y * W + x] = o; o.charges = ri(...RES[o.kind].charges);
  }
  // home: ponto de origem (renascimento perto dele); old: monstro morto que será substituído
  const spawnOk = (x, y, reg) => inside(x, y) && regionAt(x, y) === reg && !nearTown(x, y, 6) && walkable(x, y) && !(player && x === player.x && y === player.y);
  function spawnSpot(reg, home) { // lugar onde um monstro pode nascer (o mesmo sorteio do spawnMob)
    for (let t = 0; t < 400; t++) { const x = home ? home.x + ri(-(home.r || 4), home.r || 4) : ri(2, W - 3), y = home ? home.y + ri(-(home.r || 4), home.r || 4) : ri(2, H - 3); if (spawnOk(x, y, reg) && elevAt(x, y) === (home && home.elev ? 1 : 0)) return { x, y }; }
    return null;
  }
  // rodada 62: algum tile dos Campos ou da vila a até r tiles (Chebyshev) de (x, y)?
  function nearSafeRegion(x, y, r) {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const g = inside(x + dx, y + dy) ? WORLD.regionShape(x + dx, y + dy) : null; if (g === "fields" || (inTown(x + dx, y + dy))) return true; }
    return false;
  }
  // rodada 63: posição proibida pelas regras de ValdoraWorld (SPAWN_EDGE: longe dos Campos e da vila; SPAWN_AWAY: longe de um ponto)
  function spawnBad(type, reg, x, y) {
    const E = (WORLD.SPAWN_EDGE || {})[type], A = (WORLD.SPAWN_AWAY || {})[type];
    return !!((E && reg === "south" && nearSafeRegion(x, y, E)) || (A && Math.max(Math.abs(x - A.from.x), Math.abs(y - A.from.y)) < A.dist));
  }
  function spawnRule(type, reg, x, y) { // devolve outra posição válida, sorteada por um gerador local (não mexe no aleatório do jogo)
    if (!spawnBad(type, reg, x, y)) return null;
    const g = mulberry32((x * 374761393 + y * 668265263) | 0);
    for (let k = 0; k < 400; k++) { const nx = 2 + Math.floor(g() * (W - 4)), ny = 2 + Math.floor(g() * (H - 4)); if (spawnOk(nx, ny, reg) && !elevAt(nx, ny) && !spawnBad(type, reg, nx, ny)) return { x: nx, y: ny }; }
    return null; // sem lugar válido: fica onde caiu (nunca trava a criação do mundo)
  }
  function spawnMob(type, reg, home, old, extra) {
    for (let t = 0; t < 400; t++) {
      const fixed = extra && extra.at && t === 0 && spawnOk(extra.at.x, extra.at.y, reg) ? extra.at : null;
      let x = fixed ? fixed.x : home ? home.x + ri(-(home.r || 4), home.r || 4) : ri(2, W - 3), y = fixed ? fixed.y : home ? home.y + ri(-(home.r || 4), home.r || 4) : ri(2, H - 3);
      if (!fixed && (!spawnOk(x, y, reg) || elevAt(x, y) !== (home && home.elev ? 1 : 0))) continue; // rodada 106: topo x chão
      if (!fixed && !home) { const q = spawnRule(type, reg, x, y); if (q) { x = q.x; y = q.y; } } // rodada 62/63: lobos longe dos Campos, javalis longe do acampamento
      const d = MOBS[type];
      const m = { type, d, x, y, fx: x, fy: y, prog: 1, px: x, py: y, hx: home ? home.x : x, hy: home ? home.y : y, reg, home,
        hp: d.hp, elev: home && home.elev ? 1 : 0, aggro: false, atkT: 0, flash: 0, face: -1, dead: false, respawnT: 0, lunge: 0, kb: 0, prep: 0, dist: 0, phase: rand() * 6, swings: 0, windup: 0, ...extra };
      const i = old ? mobs.indexOf(old) : -1;
      if (i >= 0) mobs[i] = m; else mobs.push(m);
      mobIdx.set(y * W + x, m);
      return m;
    }
    return null;
  }

  const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const isBlockingObj = (o) => o && o.solid && !(o.type === "res" && o.respawn > 0);
  // rodada 106: índice de monstros por tile (refeito no começo de cada quadro e atualizado quando um monstro anda ou nasce);
  // a entrada velha de quem saiu do tile é descartada pela conferência de posição
  const mobIdx = new Map();
  function indexMobs() { mobIdx.clear(); for (const m of mobs) if (!m.dead) mobIdx.set(m.y * W + m.x, m); }
  const mobAt = (x, y) => { const m = mobIdx.get(y * W + x); return m && !m.dead && m.x === x && m.y === y ? m : undefined; };
  const walkable = (x, y) => inside(x, y) && map[y][x] !== "water" && map[y][x] !== "void" && !(MTN && !inCrypt && MTN.block[y * W + x]) && !isBlockingObj(occ[y * W + x]) && !mobAt(x, y);
  // rodada 105: encostar vale nas 8 direções. Na diagonal, pelo menos um dos dois tiles do meio precisa estar livre de parede/água
  // (não se golpeia através de uma quina fechada); monstros e o herói no meio não atrapalham.
  const open = (x, y) => inside(x, y) && map[y][x] !== "water" && map[y][x] !== "void" && !isBlockingObj(occ[y * W + x]);
  const adjacent = (a, b) => { const dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y);
    return Math.max(dx, dy) === 1 && (dx + dy === 1 || open(a.x, b.y) || open(b.x, a.y)); };
  function adjRect(x, y, o) { // (x,y) está encostado (também na diagonal) na área ocupada por o?
    const dx = Math.max(o.x - x, 0, x - (o.x + o.w - 1)), dy = Math.max(o.y - y, 0, y - (o.y + o.h - 1));
    return Math.max(dx, dy) === 1;
  }

  // ---------- Jogador ----------
  let player = null;
  const lv = (s) => level(player.xp[s]);
  // rodada 104: o nível vem da peça vestida (arma/ferramenta no espaço "arma", peitoral no "armadura")
  const NO_GEAR = { espada: { name: "Sem arma", acc: 0, dmg: 0 }, armadura: { name: "Sem peitoral", def: 0 } };
  const gearItem = (k) => { const e = player.equip[k === "armadura" ? "armadura" : "arma"], it = e && ITEMS[e.name]; return it && it.gear === k ? e : null; };
  const tier = (k) => { const e = gearItem(k); return e ? GEAR[k].tiers[ITEMS[e.name].tier] : NO_GEAR[k] || { name: "Sem " + GEAR[k].label.toLowerCase(), bonus: 0 }; };
  const hasBow = () => { const e = player.equip.arma; return !!(e && ITEMS[e.name].bow); };
  const maxHp = () => combatStats().maxHp;
  const totalLevel = () => Object.keys(SKILLS).reduce((a, k) => a + lv(k), 0);
  const combatStats = () => RULES.combatStats({ combate: lv("combate"), vitalidade: lv("vitalidade"), weapon: tier("espada"), armor: tier("armadura"),
    style: STYLES[player.style], buffs: Object.keys(player.buffs).map((k) => k === "descansado" ? { ...BUFFS[k], hp: ValdoraHome.restHp(ValdoraHome.shown(player.home)) } : BUFFS[k]), master: { espada: (gearItem("espada") || {}).master, armadura: (gearItem("armadura") || {}).master },
    accessories: Object.values(player.equip || {}).filter(Boolean).map(accBonus) }); // rodada 104: os modificadores do estelar vêm na própria peça
  const hitChance = RULES.hitChance;
  const validAff = (aff) => Array.isArray(aff) ? aff.filter((a) => a && RULES.AFFIXES.some((A) => A.id === a.id) && a.v > 0).map((a) => ({ id: a.id, v: a.v | 0 })) : undefined;
  const slotsFrom = (arr, n) => { const out = Array(n).fill(null); if (Array.isArray(arr)) arr.slice(0, n).forEach((s, i) => {
    if (s && ITEMS[s.name] && s.n > 0) { out[i] = { name: s.name, n: Math.floor(s.n) }; const aff = validAff(s.aff); if (aff && aff.length) { out[i].aff = aff; out[i].n = 1; }
      if (s.master) { out[i].master = 1; out[i].n = 1; } } }); return out; };

  async function start(data) {
    if (inCrypt) leaveCrypt();
    $("play").disabled = $("continue").disabled = true;
    await assetsReady; await animsReady; await heroAnims(HEROES.some((h) => h.id === data.hero) ? data.hero : HEROES[0].id); // rodada 105
    if (document.fonts) await Promise.race([document.fonts.load('12px "Valdora Pixel"'), new Promise((r) => setTimeout(r, 1500))]).catch(() => {}); // rodada 79: o canvas só usa a fonte depois de carregada fx.setDigits(SPR.ui_digits); UI.setTitleFont(SPR.ui_font_title); // rodadas 67-68: números e títulos em pixel art
    $("play").disabled = $("continue").disabled = false;
    { // rodada 106: aviso enquanto o continente é montado (deixa o navegador pintar antes do trabalho pesado)
      let ld = $("loading"); if (!ld) { ld = document.createElement("div"); ld.id = "loading"; document.body.appendChild(ld); }
      ld.textContent = "Preparando o mundo..."; ld.hidden = false; await new Promise((r) => setTimeout(r, 40));
    }
    genWorld();
    $("loading").hidden = true;
    const xp = {}, gear = {};
    for (const k of Object.keys(SKILLS)) xp[k] = Math.max(0, +data.xp?.[k] || 0);
    for (const k of Object.keys(GEAR)) gear[k] = clamp(Math.floor(+data.gear?.[k] || 0), 0, GEAR[k].tiers.length - 1);
    let { x, y } = data;
    if (!data.wv && Number.isInteger(x) && Number.isInteger(y)) { x += WORLD_G.OX; y += WORLD_G.OY; } // rodada 105: save do mapa antigo
    if (!Number.isInteger(x) || !Number.isInteger(y) || !walkable(x, y)) ({ x, y } = SPAWN);
    player = { name: String(data.name || "Aventureiro").slice(0, 14), hero: HEROES.some((h) => h.id === data.hero) ? data.hero : HEROES[0].id,
      x, y, fx: x, fy: y, prog: 1, px: x, py: y, dir: "down", dist: 0, moveT: 0, turnT: 0, act: null, cast: null, flash: 0, hitT: 0, deadT: 0, eatT: 0,
      cd: { spin: 0, dash: 0, smash: 0 }, dash: null, ghosts: null,
      quests: Object.fromEntries(Object.entries((data.quests && typeof data.quests === "object") ? data.quests : {}).filter(([id]) => QUESTS[id])),
      path: [], goal: null, target: null, job: null, actT: 0, lastHurt: -99, xp, gear,
      bags: Array.isArray(data.bags) ? data.bags.filter((n) => CRAFT[n] && CRAFT[n].bag) : [],
      bank: slotsFrom(data.bank, BANK_SLOTS),
      coins: Math.max(0, Math.floor(+data.coins || 0)), offered: Math.max(0, Math.floor(+data.offered || 0)), votiveT: Math.max(0, +data.votiveT || 0), votives: Math.max(0, Math.floor(+data.votives || 0)), style: STYLES[data.style] ? data.style : "preciso", region: null,
      kills: typeof data.kills === "object" && data.kills ? { ...data.kills } : {}, seen: typeof data.seen === "object" && data.seen ? { ...data.seen } : {},
      buffs: {}, equip: Object.fromEntries(EQUIP_KEYS.map((k) => [k, null])), ach: { ...(data.ach || {}) },
      stats: { logs: 0, ores: 0, fish: 0, cooked: 0, forged: 0, kills: 0, rares: 0, bosses: 0, raids: 0, ...(data.stats || {}) } };
    player.stats.bossTypes = { ...((data.stats && data.stats.bossTypes) || {}) };
    player.home = ValdoraHome.sanitize(data.home); // rodada 100: casa
    player.stones = Array.isArray(data.stones) ? data.stones.filter((k) => WORLD_G.VILLAGES.some((v) => v.key === k)) : []; // rodada 105: Pedras salvas
    if (!player.stones.includes("lumeira")) player.stones.unshift("lumeira");
    player.spawnStone = player.stones.includes(data.spawnStone) ? data.spawnStone : "lumeira"; player.village = null;
    player.pet = data.pet && typeof data.pet === "object" ? { name: RULES.petName(data.pet.name) || RULES.PET.name, kills: Math.max(0, data.pet.kills | 0), hp: Math.max(0, data.pet.hp | 0), rest: Math.max(0, Math.min(RULES.PET.rest, +data.pet.rest || 0)), named: data.pet.named ? 1 : 0, seenBond: Math.max(1, data.pet.seenBond | 0 || RULES.petBond(data.pet.kills | 0)) } : null; pet = null; // rodada 95; rodada 96: vida, descanso, nome
    player.echo = typeof data.echo === "object" && data.echo ? { ...data.echo } : {}; // semana da última vitória sobre cada eco
    player.inv = slotsFrom(data.inv, SLOTS + 4 * player.bags.length);
    for (const k of EQUIP_KEYS) { // aceita o formato antigo (só o nome) e o novo ({ name, aff })
      const e = data.equip && data.equip[k], name = e && (typeof e === "string" ? e : e.name);
      if (name && ITEMS[name] && ITEMS[name].slot === k) { player.equip[k] = { name }; const aff = validAff(e.aff); if (aff && aff.length) player.equip[k].aff = aff; if (e.master) player.equip[k].master = 1; }
      if (k === "municao" && player.equip.municao && ITEMS[player.equip.municao.name].ammo) { const n = Math.floor(+e.n || 0); if (n > 0) player.equip.municao.n = n; else player.equip.municao = null; }
    }
    if (data.gear && !data.itemized) { // rodada 104: save antigo — os níveis presos ao herói viram itens (nada se perde)
      const mk = (k) => { const g = GEAR[k], i = clamp(Math.floor(+data.gear[k] || 0), 0, g.tiers.length - 1), t = g.tiers[i];
        const e = { name: k === "espada" && isArcher() && t.bow ? t.bow : t.name }; if ((data.master || {})[k]) e.master = 1;
        const a = validAff((data.gearAff || {})[k]); if (a && a.length) e.aff = a; return e; };
      if (!player.equip.arma) player.equip.arma = mk("espada");
      if (!player.equip.armadura) player.equip.armadura = mk("armadura");
      for (const k of ["machado", "picareta", "vara"]) { const e = mk(k); if (!addTo(player.bank, e.name, 1, e.aff, e.master) && !addItem(e.name, 1, e.aff, e.master)) dropItem(e.name, 1, player.x, player.y); }
    }
    { const q = player.equip.municao, it = q && ITEMS[q.name]; // rodada 105: secundária de outra classe (flechas num Guerreiro) vai para a mochila
      if (it && it.sec !== heroSec()) { player.equip.municao = null; if (!addItem(q.name, q.n || 1) && !addTo(player.bank, q.name, q.n || 1)) dropItem(q.name, q.n || 1, player.x, player.y); } }
    setTimeout(refreshOutfit, 0); // rodada 104: monta o visual pelo que está vestido
    if (isArcher() && !player.seen.arrowKit) { // rodada 104: o arqueiro começa com a aljava cheia (vale também para quem já jogava com este herói)
      player.seen.arrowKit = 1; if (!player.equip.municao) player.equip.municao = { name: "Flecha de madeira", n: 30 };
    }
    for (const [k, v] of Object.entries(data.buffs || {})) if (BUFFS[k] && v > 0) player.buffs[k] = Math.min(BUFFS[k].ticks, v | 0);
    player.hp = clamp(Math.floor(+data.hp || maxHp()), 1, maxHp());
    // tutorial: personagens antigos e já experientes começam com ele concluído
    const t = data.tut;
    if (t && Number.isInteger(t.step) && !data.tutV && t.step >= 7) { t.step++; t.n = 0; } // save de antes do passo do boneco (rodada 14): pula para o mesmo passo de antes
    player.tut = t && Number.isInteger(t.step) ? { step: clamp(t.step, 0, TUTORIAL.length), n: Math.max(0, t.n | 0) } : { step: data.t && totalLevel() >= 20 ? TUTORIAL.length : 0, n: 0 };
    $("log").innerHTML = "";
    log(data.t ? `Bem-vindo de volta, ${player.name}!` : `Bem-vindo a Valdora, ${player.name}! Fale com o Guarda Ivo, ao lado do poço.`, "gold");
    player.orders = Array.isArray(data.orders) ? data.orders.filter((o) => o && ITEMS[o.item] && SKILLS[o.skill]).slice(0, 3) : [];
    for (const o of player.orders) if (o.big == null) { const b = ORDER_POOL.find((p) => p.item === o.item); o.big = !!b && o.qty > b.qty[1]; } // saves de antes da rodada 26
    while (player.orders.length < 3) player.orders.push(newOrder());
    player.bounties = Array.isArray(data.bounties) ? data.bounties.filter((b) => b && MOBS[b.type]).slice(0, 3) : [];
    while (player.bounties.length < 3) player.bounties.push(newBounty());
    player.gearAff = {}; for (const [k, a] of Object.entries(data.gearAff || {})) { const v = validAff(a); if (GEAR[k] && v && v.length) player.gearAff[k] = v; } // rodada 82
    player.daily = data.daily && typeof data.daily === "object" && MOBS[data.daily.type] ? { ...data.daily } : null; // rodada 80
    player.bestiary = Array.isArray(data.bestiary) ? data.bestiary.filter((n) => DAILY.BEST.some((B) => B.n === n)) : [];
    CAMERA.reset();
    SND.init(); EVENTS.reset(); hitStop = 0; inCrypt = false; overworld = null;
    player.dayT = typeof data.dayT === "number" ? data.dayT % 1 : 0.08; player.master = { ...(data.master || {}) }; player.playT = +data.playT || 0;
    $("lobby").hidden = true; $("game").hidden = false;
    fx.clear(); tickN = 0; tickAcc = 0;
    chatT = 6; bubble = null; tipT = TIP_EVERY; saveT = 0; for (const k of Object.keys(warnT)) delete warnT[k]; // rodada 63: jogo novo não herda os relógios do anterior
    homeSync(); resize(); running = true; last = performance.now(); requestAnimationFrame(loop); // rodada 100: casa conforme o save
    hudDirty = true; save();
  }

  function log(msg, cls = "", icon) {
    const d = document.createElement("div"); d.textContent = msg; if (cls) d.className = cls;
    if (icon && ASSETS[icon]) { const im = document.createElement("img"); im.src = ASSETS[icon]; im.alt = ""; im.className = "licon"; d.prepend(im); } // rodada 25: ícone na linha
    const box = $("log"); box.prepend(d); while (box.children.length > 9) box.lastChild.remove();
  }

  // ---------- Inventário (20 espaços) e banco: itens empilham ----------
  const findStack = (arr, name) => arr.findIndex((s) => s && s.name === name && !s.aff); // peças com afixo não empilham
  const count = (name) => { const i = findStack(player.inv, name); return i < 0 ? 0 : player.inv[i].n; };
  const canAdd = (name) => findStack(player.inv, name) >= 0 || player.inv.includes(null);
  function addTo(arr, name, n, aff, master) { // peça com afixo ou obra-prima é única (não empilha)
    if ((aff && aff.length) || master) { const i = arr.indexOf(null); if (i < 0) return false; arr[i] = { name, n: 1, ...(aff && aff.length ? { aff } : {}), ...(master ? { master: 1 } : {}) }; hudDirty = true; return true; }
    let i = findStack(arr, name);
    if (i < 0) { i = arr.indexOf(null); if (i < 0) return false; arr[i] = { name, n: 0 }; }
    arr[i].n += n; hudDirty = true; return true;
  }
  const addItem = (name, n = 1, aff, master) => { const ok = addTo(player.inv, name, n, aff, master); if (ok) player.seen[name] = 1; return ok; };
  function removeItem(name, n = 1) {
    const i = findStack(player.inv, name); if (i < 0) return false;
    player.inv[i].n -= n; if (player.inv[i].n <= 0) player.inv[i] = null; hudDirty = true; return true;
  }
  const hasMats = (mats, times = 1) => Object.entries(mats).every(([k, n]) => count(k) >= n * times);
  const matsText = (mats) => Object.entries(mats).map(([k, n]) => `${n}x ${k} (${count(k)})`).join(", ");

  function rewardCombatXp(n) { gainXp("combate", n); gainXp("vitalidade", RULES.vitShare(STYLES[player.style], n)); } // rodada 89
  function gainXp(skill, n) {
    if (!n) return;
    const before = lv(skill); player.xp[skill] += n; hudDirty = true;
    const now = lv(skill);
    if (skill !== "vitalidade" || now > before) xpToast(skill, n);
    if (now > before) {
      log(`★ ${SKILLS[skill]} subiu para o nível ${now}!`, "gold"); SND.play("level");
      if (skill === "pesca" && now >= 10 && !player.seen.deepTip) { player.seen.deepTip = 1; log(`Dica do Ivo: Pesca 10! Os cardumes fundos, nos lagos maiores, rendem tucunarés (curam ${ITEMS["Tucunaré assado"].heal}).`, "tip", "icon_fish_spot"); } // rodada 56; rodada 89: cura lida do item
      addFloat(player.px + 0.5, player.py - 1, `${SKILLS[skill]} nv ${now}!`, "#f1c40f", 1.8, 18);
      burst(player.px + 0.5, player.py + 0.4, ["#f1c40f", "#fff2a0"], 30, 4.5);
      if (skill === "vitalidade") player.hp = Math.min(maxHp(), player.hp + 2);
      celebrate(skill, now);
      checkAch(); save();
    }
  }
  let xpTimer = 0;
  function xpToast(skill, n) { // barra de progresso da habilidade que acabou de ganhar XP
    const xp = player.xp[skill], l = level(xp), a = xpFor(l), b = xpFor(l + 1), pct = l >= MAX_LVL ? 100 : (xp - a) / (b - a) * 100;
    const el = $("xpdrop");
    el.innerHTML = `<b>${SKILLS[skill]}</b> <span>nv ${l}</span> <em>+${n} xp</em><div class="bar xp"><i style="width:${pct}%"></i></div><small>${l < MAX_LVL ? `${Math.ceil(b - xp)} xp para o nível ${l + 1}` : "nível máximo"}</small>`;
    el.classList.add("show"); clearTimeout(xpTimer); xpTimer = setTimeout(() => el.classList.remove("show"), 2400);
  }
  function unlocksAt(skill, l) { // o que o novo nível libera (lido das tabelas de dados)
    const u = [];
    for (const R of Object.values(RES)) {
      if (R.skill === skill && R.req === l && !R.fish) u.push(`${R.verb} ${R.name.toLowerCase()}`);
      if (R.fish && skill === "pesca") for (const f of R.fish) if (f.req === l) u.push(`Pescar ${f.item.replace(" cru", "").toLowerCase()}`);
    }
    for (const [n, it] of Object.entries(ITEMS)) if (skill === "culinaria" && it.cook && it.cookLvl === l) u.push(`Assar ${n.toLowerCase()}`);
    for (const [n, r] of Object.entries(SMELT)) if (skill === "ferraria" && r.lvl === l) u.push(`Fundir ${n.toLowerCase()}`);
    for (const g of Object.values(GEAR)) for (const t of g.tiers) {
      if (skill === "ferraria" && t.forge && t.forge.lvl === l) u.push(`Forjar ${t.name.toLowerCase()}`);
      if (g.skill === skill && t.req === l) u.push(`Usar ${t.name.toLowerCase()}`);
    }
    for (const [n, r] of Object.entries(CRAFT)) if (skill === "artesanato" && r.lvl === l) u.push(`Criar ${n.toLowerCase()}`);
    if (skill === "vitalidade") u.push(`Vida máxima: ${maxHp()}`);
    if (skill === "combate" && l % 4 === 0) u.push("+1 de dano máximo");
    return [...new Set(u)];
  }
  function celebrate(skill, l) {
    const u = unlocksAt(skill, l), el = $("levelup");
    el.innerHTML = `<small>${SKILLS[skill]}</small><div class="lv">${UI.titleHTML(`Nível ${l}`)}</div>${u.length ? `<ul>${u.slice(0, 4).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}`;
    el.classList.remove("show"); void el.offsetWidth; el.classList.add("show");
  }
  function showToast(title, sub, color = "#f1c40f") {
    const t = document.createElement("div"); t.className = "toast"; t.style.borderColor = color;
    t.innerHTML = `<b style="color:${color}">${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ""}`;
    const box = $("toasts"); box.prepend(t); while (box.children.length > 3) box.lastChild.remove();
    setTimeout(() => t.classList.add("out"), 4200); setTimeout(() => t.remove(), 4800);
  }
  function checkAch() { // conquistas: recompensa única em moedas
    if (!player) return;
    const st = { ...player.stats, bothBosses: !!(player.stats.bossTypes.boss && player.stats.bossTypes.boss_golem),
      species: Object.keys(MOBS).filter((k) => player.kills[k] && !MOBS[k].echo).length, allSpecies: Object.keys(MOBS).filter((k) => !MOBS[k].echo).length, killed: player.kills,
      total: totalLevel(), maxSkill: Math.max(...Object.keys(SKILLS).map(lv)), petBond: player.pet ? RULES.petBond(player.pet.kills) : 0 }; // rodada 97
    for (const a of ACHIEVEMENTS) if (!player.ach[a.id] && a.check(st)) {
      player.ach[a.id] = Date.now(); player.coins += a.coins; hudDirty = true; // rodada 37: guarda quando (o lobby mostra as últimas)
      showToast(`★ Conquista: ${a.name}`, `${a.desc} +${a.coins} moedas`); SND.play("quest");
      log(`Conquista desbloqueada: ${a.name} (+${a.coins} moedas)`, "gold", "icon_achievement_new");
    }
  }

  // ---------- Tutorial (Guarda Ivo) ----------
  function emit(ev, n = 1) {
    QUEST.event(ev, n);
    const s = TUTORIAL[player.tut.step]; if (!s) return;
    if (ev !== s.ev && !ev.startsWith(s.ev + ":")) return;
    player.tut.n += n; hudDirty = true;
    if (player.tut.n >= s.n) {
      const r = s.reward, parts = [];
      if (r.coins) { player.coins += r.coins; parts.push(`+${r.coins} moedas`); }
      for (const [k, q] of Object.entries(r.items || {})) { if (!addItem(k, q)) dropItem(k, q, player.x, player.y); parts.push(`${q}x ${k}`); }
      if (r.weapon) { const w = isArcher() ? "Arco gasto" : "Espada gasta"; if (!addItem(w)) dropItem(w, 1, player.x, player.y); parts.push(w); } // rodada 104
      player.tut.step++; player.tut.n = 0; player.cheerT = 0.5; // comemora (folha cheer)
      if (player.tut.step === 1) setTimeout(() => player && log("Dica do Ivo: o minimapa (canto de cima) mostra a vila, os lagos com cardumes e os monstros; clique nele para andar até lá.", "tip", "icon_minimap_help"), 1500); // rodada 33
      SND.play("quest");
      log(`✔ Tarefa concluída: ${s.text}${parts.length ? ` (${parts.join(", ")})` : ""}`, "gold");
      addFloat(player.px + 0.5, player.py - 0.9, "Tarefa concluída!", "#7dff9a", 1.8, 16);
      burst(player.px + 0.5, player.py + 0.3, ["#7dff9a", "#ffffff", "#f1c40f"], 20, 3.5);
      const next = TUTORIAL[player.tut.step];
      if (next) log(`Próxima tarefa: ${next.text}`, "dim"); else log("Tutorial concluído! Fale de novo com o Ivo: a campanha \"Os Marcos de Lumeira\" começa com ele (siga a seta azul). Treine Combate nos slimes dos campos antes de javalis e goblins.", "gold");
      save();
    }
  }

  // ---------- Missões (js/quests.js) ----------
  const DAILY = ValdoraDaily; // rodada 80
  const QUEST = ValdoraQuests.create({ moonUp: () => mobs.some((m) => m.type === "wolf_moon" && !m.dead), night: () => LIGHT.darkness(player.dayT) > 0.4,
    player: () => player, petBond: () => player.pet ? RULES.petBond(player.pet.kills) : 0, lv: (s) => lv(s), count, removeItem, gainXp: (k, v) => k === "combate" ? rewardCombatXp(v) : gainXp(k, v), dirty: () => { hudDirty = true; }, save: () => save(), log: (m, c, i) => log(m, c, i),
    sound: (k) => SND.play(k), toast: (a, b, c) => showToast(a, b, c), rollAffixes: (n) => RULES.rollAffixes(n, 1, rand),
    give: (name, n, aff) => { if (!addItem(name, n, aff)) dropItem(name, n, player.x, player.y, null, aff); },
    celebrate: () => { burst(player.px + 0.5, player.py + 0.3, ["#7dff9a", "#f1c40f", "#ffffff"], 30, 4); player.cheerT = 0.5; },
    progress: (txt) => addFloat(player.px + 0.5, player.py - 1.15, txt, "#7dff9a", 1.2, 11),
    stepChanged: () => CAMPAIGN_RT.sync(), // rodada 78: marcos acendem na hora
  });
  const questHtml = QUEST.html, questMark = QUEST.mark;

  // ---------- Itens no chão ----------
  function dropItem(name, n, x, y, from, aff) {
    const g = !aff && groundItems.find((i) => i.name === name && i.x === x && i.y === y && !i.aff);
    if (g) { g.n += n; g.age = 0; return; }
    groundItems.push({ name, n, x, y, age: 0, life: ITEMS[name].rare || aff ? 300 : 120, ox: from ? from.x : x, oy: from ? from.y : y, aff });
  }
  function pickupAt(x, y, verbose) {
    let got = false, full = false;
    for (const g of groundItems.filter((i) => i.x === x && i.y === y)) {
      if (!addItem(g.name, g.n, g.aff)) { full = true; continue; }
      got = true; groundItems.splice(groundItems.indexOf(g), 1);
      addFloat(x + 0.5, y - 0.1 - fx.floaters.length % 3 * 0.25, `+${g.n} ${accName(g)}`, g.aff ? "#ffd84a" : ITEMS[g.name].rare ? "#ff9cf0" : "#ffffff");
    }
    if (full && verbose) log("Sua mochila está cheia. Guarde itens no cofre ou venda ao Bento.", "warn");
    if (got) { burst(x + 0.5, y + 0.6, ["#f1c40f", "#ffffff"], 6, 1.5); SND.play("pickup"); save(); }
  }

  // ---------- Caminho (js/path.js) ----------
  const findPath = ValdoraPath.create(W, H, (x, y) => walkable(x, y), { diag: true }); // rodada 104: o herói anda em 8 direções
  const canStep = (x, y, nx, ny) => walkable(nx, ny) && (nx === x || ny === y || (walkable(nx, y) && walkable(x, ny))); // diagonal sem cortar quina
  function goTo(goal) { player.goal = goal; player.path = findPath(player.x, player.y, goal) || []; return player.path.length > 0 || goal(player.x, player.y); }

  // ---------- Entrada ----------
  const INTERACT_TEXT = { shop: "falar com Bento", guard: "falar com Ivo", bard: "falar com Tomé", bank: "abrir o cofre", furnace: "usar a fornalha",
    anvil: "usar a bigorna", fire: "assar na fogueira", board: "ver o quadro de caçadas", crypt: "descer à cripta", crypt_exit: "voltar à superfície",
    chest: "abrir o baú", den: "entrar na Toca dos Lobos", sign: "ler a placa", dummy: "treinar no boneco",
    marker: "ver o marco", crack: "examinar a fenda", herb: "falar com Juna", rune: "copiar a inscrição", carto: "falar com Odília", miner: "falar com Brás", rift: "descer à Fenda Cintilante", seal: "ver o pedestal do selo", home: "ver a casa" }; // rodada 78/79
  function interactLabel(b) {
    if (b.kind === "res") { const R = RES[b.ref.kind]; return R.skill === "pesca" ? "pescar no cardume" : `${R.verb.toLowerCase()} ${R.name.toLowerCase()}`; }
    if (b.kind === "loot") { const gs = groundItems.filter((g) => g.x === b.tx && g.y === b.ty); return "pegar " + (gs.length > 1 ? `${gs.length} itens` : `${gs[0].n}x ${gs[0].name}`); }
    if (b.kind === "fire" && b.ref.brazier) return null; // braseiro da masmorra não assa nada
    if (b.kind === "fire") { const n = player.inv.reduce((t, s) => t + (s && ITEMS[s.name].cook && lv("culinaria") >= ITEMS[s.name].cookLvl ? s.n : 0), 0); return n > 1 ? `assar tudo (${n})` : n ? "assar na fogueira" : "assar (nada cru na mochila)"; } // rodada 45
    return INTERACT_TEXT[b.kind] || null;
  }
  function updateFHint() { // "F: falar com Bento" no rodapé (só com teclado, fora de janelas)
    const el = $("fhint"); if (!el) return;
    const b = !touchUi && running && !dlg && !SCENE.active() && player.deadT <= 0 && !player.path.length && findInteract(), label = b && interactLabel(b);
    const html = label ? `${ASSETS.icon_key_f ? `<img src="${ASSETS.icon_key_f}" alt="F">` : "<b>F</b>"} ${label.startsWith("assar tudo") && ASSETS.icon_cook_all ? `<img src="${ASSETS.icon_cook_all}" alt="">` : ""}${esc(label)}` : ""; // rodada 45: ícone no "assar tudo"
    if (el.dataset.html !== html) { el.dataset.html = html; el.innerHTML = html; el.hidden = !html; }
  }
  function findInteract() {
    const dRect = (o) => Math.max(Math.max(o.x - player.x, 0, player.x - (o.x + o.w - 1)), Math.max(o.y - player.y, 0, player.y - (o.y + o.h - 1)));
    let best = null, bd = 3;
    for (const g of groundItems) { const d = Math.max(Math.abs(g.x - player.x), Math.abs(g.y - player.y)); if (d < bd) { bd = d; best = { kind: "loot", tx: g.x, ty: g.y, ref: { x: g.x, y: g.y, w: 1, h: 1 } }; } }
    for (const o of objects) {
      const kind = o.type === "res" ? (o.respawn > 0 ? null : "res") : STATIONS[o.type] || (o.type === "sign" ? "sign" : null); if (!kind) continue;
      const d = dRect(o); if (d < bd || (d === bd && best && best.kind === "res" && kind !== "res")) { bd = d; best = { kind, ref: o, tx: o.x, ty: o.y }; } // NPC/estação ganham do recurso no empate
    }
    for (const c of CAMPAIGN_RT.openCracks()) { const d = dRect(c); if (d < bd || (d === bd && best && best.kind === "res")) { bd = d; best = { kind: "crack", ref: c, tx: c.x, ty: c.y }; } } // rodada 78: fendas
    return best;
  }
  function interactNearest() {
    if (!running || player.deadT > 0) return;
    const best = findInteract();
    if (!best) { log("Nada para usar aqui. Chegue ao lado de alguém ou de algo útil e aperte F.", "dim"); return; }
    if (best.kind === "sign") { log(`Placa: ${best.ref.label}`, "dim"); return; }
    setTarget(best);
  }
  // teclado (js/input.js): ações de cada atalho
  const INPUT = ValdoraInput.create({
    running: () => running, escape: () => { closeDlg(); $("options").hidden = true; toggleMap(false); }, toggleMap: () => toggleMap(), interact: () => interactNearest(), skill: (id) => useSkill(id),
    toggleDlg: (kind) => { if (dlg && dlg.kind === kind) closeDlg(); else openDlg(kind, null); }, petStay: () => petStay(),
    tab: (t) => { hudTab = t; hudDirty = true; SND.play("ui"); },
    eatBest: () => { // come a comida que mais cura
      let best = -1; player.inv.forEach((s, i) => { if (s && ITEMS[s.name].heal && !s.name.startsWith("Poção") && (best < 0 || ITEMS[s.name].heal > ITEMS[player.inv[best].name].heal)) best = i; });
      if (best >= 0) eat(best); else log("Sem comida pronta na mochila.", "dim");
    },
    potion: (pot) => { const i = player.inv.findIndex((s) => s && s.name === pot); if (i >= 0) eat(i); else log(`Sem ${pot.toLowerCase()} na mochila.`, "dim"); },
    attackNearest: () => { // ataca o monstro mais perto PELO CAMINHO (não atrás de uma parede): robô da rodada 18
      const near = mobs.filter((m) => !m.dead && Math.abs(m.x - player.x) + Math.abs(m.y - player.y) <= 7)
        .sort((a, b) => (Math.abs(a.x - player.x) + Math.abs(a.y - player.y)) - (Math.abs(b.x - player.x) + Math.abs(b.y - player.y))).slice(0, 6);
      let best = null, bl = Infinity;
      for (const m of near) {
        const len = adjacent(player, m) ? 0 : (findPath(player.x, player.y, (x, y) => adjacent({ x, y }, m)) || { length: Infinity }).length;
        if (len < bl) { bl = len; best = m; }
      }
      if (best) setTarget({ kind: "mob", ref: best }); else log(near.length ? "Nenhum monstro alcançável por perto." : "Nenhum monstro por perto.", "dim");
    },
  });
  const shortcut = INPUT.shortcut, keyDir = INPUT.keyDir, keyVec = INPUT.keyVec; // rodada 104: keyVec = passo em 8 direções

  const canvas = $("canvas"), ctx = canvas.getContext("2d");
  const cam = { x: 0, y: 0 };
  // desenho das folhas do Blender (js/render.js)
  const RENDER = ValdoraRender.create({ ctx, cam, TILE, W, AM, ANIMS, hash, inTown: (x, y) => inTown(x, y), rand, burst: (...a) => burst(...a) });
  const { animFrame, drawFx, drawAnim, sceneryFrame, waterDraw, drawFishspot, drawSmoke } = RENDER;
  // zoom do mundo: "auto" mostra ~14 tiles na altura (telas grandes não deixam o mundo em miniatura)
  let ZOOM = 1;
  function resize() {
    const o = SND.opts.zoom || "auto";
    ZOOM = o === "auto" ? clamp(Math.round(innerHeight / (TILE * 14) * 4) / 4, 1, 3) : +o;
    canvas.width = Math.round(innerWidth / ZOOM); canvas.height = Math.round(innerHeight / ZOOM);
    canvas.style.imageRendering = Number.isInteger(ZOOM) ? "pixelated" : "auto";
    ctx.imageSmoothingEnabled = false;
  }
  function applyUi() { // "auto": interface cresce junto com a altura da janela
    // rodada 80: só zoom inteiro (1× ou 2×), para a fonte em pixel art (12/24 px) não borrar; valores antigos (1,15/1,3) viram 1×
    const u = SND.opts.ui, sc = !u || u === "auto" ? (innerHeight >= 1560 && innerWidth >= 2400 ? 2 : 1) : (+u >= 1.5 ? 2 : 1);
    document.documentElement.style.setProperty("--ui", sc);
  }
  addEventListener("resize", applyUi);
  applyUi();
  addEventListener("resize", resize);

  const STATIONS = { waystone: "waystone", dungeon: "dungeon", merchant: "shop", stall: "shop", guard: "guard", bank: "bank", furnace: "furnace", anvil: "anvil", fire: "fire", board: "board",
    bard: "bard", shrine: "shrine", crypt: "crypt", crypt_exit: "crypt_exit", crypt_chest: "chest", den: "den", dummy: "dummy", marker: "marker", herb: "herb", rune: "rune", carto: "carto", miner: "miner", rift: "rift", seal: "seal", home: "home", pedestal: "home" }; // rodada 100: casa
  // O que está sob o cursor (monstros pela área desenhada, para acertar alvos em movimento)
  // rodada 105: monstro vivo mais perto do ponto da tela (até 4 tiles), para o Ctrl + clique
  function nearestMob(px, py, r = 4) {
    const fx = (px + cam.x) / TILE, fy = (py + cam.y) / TILE; let best = null, bd = r;
    for (const m of mobs) {
      if (m.dead || m.pet || m.appear != null) continue;
      const d = Math.hypot(m.px + 0.5 - fx, m.py + 0.5 - fy); if (d < bd) { bd = d; best = m; }
    }
    return best;
  }
  function pick(px, py) {
    const fx = (px + cam.x) / TILE, fy = (py + cam.y) / TILE;
    let best = null;
    for (const m of mobs) {
      if (m.dead) continue;
      const img = SPR[m.d.spr], s = m.d.scale || 1;
      const hw = Math.max(0.5, (img ? img.width * s / TILE : 1) * 0.35), hh = Math.max(1, (img ? img.height * s / TILE : 1) * 0.85);
      const cx = m.px + 0.5, by = m.py + 1;
      if (fx >= cx - hw && fx <= cx + hw && fy >= by - hh && fy <= by && (!best || m.py > best.ref.py)) best = { kind: "mob", ref: m };
    }
    if (best) return best;
    const tx = Math.floor(fx), ty = Math.floor(fy);
    if (!inside(tx, ty)) return null;
    if (groundItems.some((g) => g.x === tx && g.y === ty)) return { kind: "loot", tx, ty, ref: { x: tx, y: ty, w: 1, h: 1 } };
    const o = occ[ty * W + tx];
    if (o && o.type === "res" && !(o.respawn > 0)) return { kind: "res", ref: o, tx, ty };
    if (o && STATIONS[o.type]) return { kind: STATIONS[o.type], ref: o, tx, ty };
    const cr = !o && CAMPAIGN_RT.crackAt(tx, ty); if (cr) return { kind: "crack", ref: cr, tx, ty }; // rodada 78: fenda (não ocupa o tile)
    if (o && o.type === "sign") return { kind: "sign", ref: o, tx, ty };
    // rodada 49: arte mais alta que a base (santuário 2x2 sobre 2x1): a metade de cima também aciona a estação
    const b = !o && inside(tx, ty + 1) && occ[(ty + 1) * W + tx];
    if (b && STATIONS[b.type] && b.spr && (SPRITE_SIZE[b.spr] || [1, 1])[1] >= b.h + 1) return { kind: STATIONS[b.type], ref: b, tx, ty: ty + 1 };
    return { kind: "tile", tx, ty, ref: o };
  }
  // barra de habilidades: ícone, tecla, recarga circular e nível exigido
  const skillTip = (S) => `<b style="color:#ffd84a">${esc(S.name)}</b> <small>(tecla ${S.key})</small><div>${esc(S.desc)}</div>`
    + `<small class="tip-hint">Dano ×${S.mult}${S.stun ? ` · atordoa ${S.stun} s` : ""} · recarga ${S.cd} s · libera no Combate ${S.lvl}</small>`;
  $("skillbar").innerHTML = Object.entries(ACTIVE).map(([id, S]) => `<button data-skill="${id}" data-tip="${esc(skillTip(S))}" aria-label="${esc(S.name)}">
    ${ASSETS["skill_" + id] ? `<img class="ic" src="${ASSETS["skill_" + id]}" alt="">` : `<span class="ic">${S.icon}</span>`}<b>${S.key}</b><i class="cd"></i><small class="lock">nv ${S.lvl}</small></button>`).join("");
  $("skillbar").onclick = (e) => { const b = e.target.closest("[data-skill]"); if (b) useSkill(b.dataset.skill); };
  function updateSkillbar() {
    for (const b of $("skillbar").children) {
      const id = b.dataset.skill, S = ACTIVE[id], locked = lv("combate") < S.lvl, cd = player.cd[id];
      b.classList.toggle("locked", locked); b.classList.toggle("ready", !locked && cd <= 0);
      const cooling = !locked && cd > 0; // rodada 66: a recarga acabou agora → o botão pulsa e soa um sininho curto
      if (b.dataset.cool === "1" && !cooling && !locked) { b.classList.remove("justready"); void b.offsetWidth; b.classList.add("justready"); SND.play("ready"); }
      b.dataset.cool = cooling ? "1" : "";
      b.style.setProperty("--p", locked ? 1 : cd / S.cd);
    }
  }
  const touchUi = matchMedia("(pointer: coarse)").matches;
  $("touch-btns").hidden = !touchUi;
  UI.initHudToggle($("hud"), $("hud-toggle"));
  UI.initTooltips();
  $("touch-attack").onclick = () => running && shortcut(" ");
  $("touch-eat").onclick = () => running && shortcut("1");
  if (ASSETS.fx_low_hp_vignette) $("lowhp").src = ASSETS.fx_low_hp_vignette; // rodada 47
  // rodada 40: espaços da mochila/cofre/banca são <div>; com Tab chegam neles (tabindex) e Enter/Espaço equivale ao clique
  document.addEventListener("keydown", (e) => { const el = e.target; if (!(el && el.classList && el.classList.contains("slot") && el.hasAttribute("tabindex"))) return;
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); el.click(); return; }
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -4, ArrowDown: 4 }[e.key]; // rodada 41: setas andam entre os espaços (grade de 4) sem mover o herói
    if (!step) return; e.preventDefault(); e.stopPropagation();
    const all = [...el.parentElement.querySelectorAll(".slot[tabindex]")], cur = all.indexOf(el); if (cur < 0) return;
    const grid = [...el.parentElement.querySelectorAll(".slot")], pos = grid.indexOf(el);
    let p = pos + step, next = null; while (p >= 0 && p < grid.length && !next) { if (grid[p].hasAttribute("tabindex") && !grid[p].classList.contains("filtered")) next = grid[p]; else p += step; }
    if (!next) { // rodada 42: na janela do cofre, passa para a grade de baixo/de cima
      const grids = [...document.querySelectorAll("#dlg-body .grid")], gi = grids.indexOf(el.parentElement), other = grids[gi + Math.sign(step)];
      if (gi >= 0 && other) { const cand = [...other.querySelectorAll(".slot[tabindex]:not(.filtered)")]; next = step > 0 ? cand[0] : cand[cand.length - 1]; }
    }
    if (next) { if (next.parentElement === el.parentElement) el.tabIndex = -1; next.tabIndex = 0; next.focus(); }
  }, true);
  if (ASSETS.icon_keyboard_help && $("opt-keys")) $("opt-keys").insertAdjacentHTML("afterbegin", `<img class="btn-icon" src="${ASSETS.icon_keyboard_help}" alt="">`); // rodada 41
  if (ASSETS.icon_minimap_help) $("touch-help").innerHTML = `<img src="${ASSETS.icon_minimap_help}" alt="?">`; // rodada 33: uma dica por toque
  // rodada 54: próxima dica na ordem, pulando as que pedem mais Combate do que o jogador tem
  function nextTip() {
    const cb = lv("combate"), M = VD.TIP_MIN || [];
    for (let k = 0; k < TIPS.length; k++) { const i = (player.tipI = ((player.tipI ?? Math.floor(rand() * TIPS.length)) + 1) % TIPS.length); if ((M[i] || 1) <= cb) return TIPS[i]; }
    return TIPS[0];
  }
  $("touch-help").onclick = () => { if (!running) return; log(`Dica do Ivo: ${nextTip()}`, "tip", "icon_tip"); };
  function setTarget(p) {
    player.target = { kind: p.kind, ref: p.ref }; player.job = null;
    const r = p.ref;
    if (p.kind === "mob") ensureWeapon(); // rodada 104: arma na mão antes de escolher onde parar
    const shoot = p.kind === "mob" && hasBow() && arrows(); // rodada 104: com arco, para na distância de tiro
    const goal = shoot ? (x, y) => Math.hypot(r.x - x, r.y - y) <= ARROW_RANGE && clearShot(x, y, r.x, r.y) : p.kind === "mob" ? (x, y) => adjacent({ x, y }, r) : p.kind === "loot" ? (x, y) => x === r.x && y === r.y : (x, y) => adjRect(x, y, r);
    // com NPCs, prefere parar ao lado ou acima, para não cobrir o personagem com o próprio corpo
    if (["shop", "guard", "bard", "herb", "carto", "miner", "fire"].includes(p.kind) && r.type !== "stall" && goTo((x, y) => goal(x, y) && y <= r.y)) return; // rodada 29: na fogueira, de lado ou acima (o chiado fica à vista)
    if (shoot && goal(player.x, player.y)) { player.path = []; return; } // já na mira: atira daqui
    if (!goTo(goal)) { log("Não dá para chegar lá.", "dim"); player.target = null; }
  }
  if (/[?&]debug\b/.test(location.search)) window.__vd = { player: () => player, mtn: () => MTN, walkable: (x, y) => walkable(x, y), mobs: () => mobs, setTarget, shots: () => shots,
    advance: (sec) => { for (let t = 0; t < sec; t += 0.05) { if (SCENE.active()) SCENE.update(0.05); else update(0.05); } updateHud(); }, emit: (e) => emit(e), objs: () => objects,
    tp: (x, y) => { Object.assign(player, { x, y, fx: x, fy: y, px: x, py: y, prog: 1, path: [], goal: null, target: null, job: null }); CAMERA.reset(); }, give: (n, q = 1) => addItem(n, q), anims: () => Object.keys(ANIMS),
    drop: (n, q, x, y) => dropItem(n, q, x, y), ground: () => groundItems, equip: (n) => { const i = player.inv.findIndex((s) => s && s.name === n); if (i >= 0) equip(i); hudDirty = true; }, screen: (x, y) => [((x + 0.5) * TILE - cam.x) * ZOOM, ((y + 0.5) * TILE - cam.y) * ZOOM] }; // rodada 104: inspeção pelo console (só com ?debug)
  // mouse, toque e minimapa (js/pointer.js)
  const POINTER = ValdoraPointer.create({ miniView: () => OVERLAY.miniView(), canvas, cam, TILE, W, H, zoom: () => ZOOM, running: () => running, player: () => player, map: () => map,
    closeDlg: () => closeDlg(), pick: (x, y) => pick(x, y), log: (m, c) => log(m, c), goTo: (g) => goTo(g), adjRect: (x, y, o) => adjRect(x, y, o),
    clickFx: (...a) => clickFx(...a), setTarget: (p) => setTarget(p), nearestMob: (x, y) => nearestMob(x, y), walkable: (x, y) => walkable(x, y), inside: (x, y) => inside(x, y) });
  const PST = POINTER.st, updateTouch = POINTER.updateTouch;

  // ---------- Ações (executadas em ticks) ----------
  function faceTo(x, y) { // rodada 105: olha em 8 direções (diagonal de verdade)
    player.dir = window.DIR_AT(x - player.x, y - player.y) || player.dir;
  }
  function faceRect(o) { faceTo(clamp(player.x, o.x, o.x + o.w - 1), clamp(player.y, o.y, o.y + o.h - 1)); }
  // ação do herói em 3 tempos: preparação → golpe (o efeito acontece no quadro de impacto) → recuperação
  function useTool(key, onImpact, tm = {}) {
    player.act = { key, t: 0, prep: tm.prep ?? 0.14, strike: tm.strike ?? 0.07, rec: tm.rec ?? 0.2, onImpact, fired: false };
  }

  function doTarget() {
    const t = player.target, r = t.ref;
    if (t.kind === "mob") {
      if (r.dead) { player.target = null; return; }
      ensureWeapon();
      // rodada 105: encostar vale na diagonal (adjacent), então o herói golpeia dali mesmo; acabou a "dança" da diagonal (rodadas 48/83)
      if (hasBow() && arrows()) { // rodada 104: atira de até ARROW_RANGE tiles, com a linha livre
        const ok = (x, y) => Math.hypot(r.x - x, r.y - y) <= ARROW_RANGE && clearShot(x, y, r.x, r.y);
        if (!ok(player.x, player.y)) {
          if (goTo(ok)) player.noPath = 0;
          else if ((player.noPath = (player.noPath || 0) + 1) >= 4) { player.noPath = 0; player.target = null; log("Não dá para mirar nele daqui. Dê a volta.", "dim"); }
          return;
        }
        if (player.prog < 1) return;
        faceTo(r.x, r.y);
        if (player.actT <= 0) { startShot(r); player.actT = 3; }
        return;
      }
      if (!adjacent(player, r)) { // rodada 45: sem caminho por ~2 s (diagonal com os dois lados bloqueados): solta o alvo em vez de travar
        if (goTo((x, y) => adjacent({ x, y }, r))) player.noPath = 0; else if ((player.noPath = (player.noPath || 0) + 1) >= 4) { player.noPath = 0; player.target = null; log("Não dá para chegar até ele daqui. Dê a volta.", "dim"); }
        return;
      }
      faceTo(r.x, r.y);
      if (player.actT <= 0) { startAttack(r); player.actT = 3; }
      return;
    }
    if (t.kind === "loot") { if (player.x === r.x && player.y === r.y) { pickupAt(r.x, r.y, true); player.target = null; } else if (!goTo((x, y) => x === r.x && y === r.y)) player.target = null; return; }
    if (t.kind === "res" && r.respawn > 0) { player.target = null; return; }
    if (!adjRect(player.x, player.y, r)) { if (!goTo((x, y) => adjRect(x, y, r))) player.target = null; return; }
    faceRect(r);
    if (["shop", "guard", "bank", "furnace", "anvil", "board", "bard", "shrine", "marker", "herb", "carto", "miner", "home"].includes(t.kind)) { player.target = null; openDlg(t.kind, r); return; }
    if (t.kind === "crack") { player.target = null; return CAMPAIGN_RT.inspectCrack(r); } // rodada 78
    if (t.kind === "rune") { player.target = null; return CAMPAIGN_RT.inspectRune(r); } // rodada 80
    if (t.kind === "crypt") { player.target = null; return enterCrypt(r); }
    if (t.kind === "den") { player.target = null; return enterCrypt(r, "den"); }
    if (t.kind === "rift") { player.target = null; return enterCrypt(r, "rift"); } // rodada 82
    if (t.kind === "seal") { player.target = null; return CAMPAIGN_RT.useSeal(r); } // rodada 83
    if (t.kind === "crypt_exit") { player.target = null; return exitCrypt(); }
    if (t.kind === "chest") { player.target = null; return openChest(r); }
    if (t.kind === "dummy") { player.target = null; return hitDummy(r); }
    if (t.kind === "dungeon") { player.target = null; return enterCrypt(r, r.dungeon); } // rodada 105: masmorra de bioma
    if (t.kind === "waystone") { player.target = null; unlockStone(r.village, true); return openDlg("waystone", r); } // rodada 105: Pedra da vila
    if (player.actT > 0) return;
    if (t.kind === "res" && !ensureTool(RES[r.kind].tool)) { // rodada 104: sem a ferramenta certa na mochila
      const g = GEAR[RES[r.kind].tool]; log(`Você precisa de ${g.label === "Picareta" || g.label === "Vara" || g.label === "Foice" ? "uma" : "um"} ${g.label.toLowerCase()}. Compre com o Bento ou forje na bigorna.`, "warn"); player.target = null; return;
    }
    if (t.kind === "res") { gather(r); player.actT = 2; }
    else if (t.kind === "fire") { cook(r); player.actT = 3; }
  }

  // coleta, pesca e culinária (js/gather.js)
  const GATHER = ValdoraGather.create({ player: () => player, event: () => EVENTS.current(), hitStop: (v) => { hitStop = Math.max(hitStop, v); },
    lv, log: (m, c, i) => log(m, c, i), canAdd, useTool, accBonus, tier, SND, burst: (...a) => burst(...a), fx: { sparks: (...a) => fx.sparks(...a), arc: (...a) => fx.arc(...a) },
    clickFx: (...a) => clickFx(...a), addItem, removeItem, gainXp, emit, checkAch, SPR, addFloat: (...a) => addFloat(...a), relocateSpot, ri, rand, clamp, RENDER });
  const { gather, cook } = GATHER;

  // Trabalhos na fornalha e na bigorna: andam em ticks enquanto o jogador fica ao lado
  function doJob() {
    const j = player.job, o = j.obj;
    if (!adjRect(player.x, player.y, o)) { player.job = null; return; }
    faceRect(o);
    if (player.actT > 0) return;
    if (j.kind === "smelt") {
      const r = SMELT[j.item];
      if (!hasMats(r.mats)) { log(`Faltam materiais: ${matsText(r.mats)}.`, "warn"); player.job = null; return renderDlg(); }
      for (const [k, n] of Object.entries(r.mats)) removeItem(k, n);
      addItem(j.item); gainXp("ferraria", r.xp); emit("smelt:" + j.item);
      useTool(null, () => { burst(o.x + 0.5, o.y + 0.3, ["#ffb347", "#ffe08a", "#ff6a2a"], 14, 3); SND.play("smelt"); });
      addFloat(o.x + 0.5, o.y - 0.5, `+1 ${j.item}`, "#ffffff"); addFloat(player.px + 0.5, player.py - 0.4, `+${r.xp} xp`, "#8fd3ff", 1, 11);
      player.actT = 3;
      if (--j.left <= 0) player.job = null;
      renderDlg();
    } else if (j.kind === "forge") {
      const t = GEAR[j.key].tiers[j.tier], F = t && (j.two ? t.twoForge : t.forge); // rodada 105: montante usa mais metal
      if (!t || !F || !hasMats(F.mats)) { player.job = null; return renderDlg(); }
      j.hits++; const last = j.hits >= 3;
      useTool("hammer", () => {
        SND.play("clang"); fx.sparks(o.x + 0.5, o.y + 0.15, last ? 18 : 10, ["#ffe08a", "#ffffff", "#ff9a3a"], last ? 6 : 4.5);
        hitStop = Math.max(hitStop, last ? 0.07 : 0.035); addFloat(o.x + 0.5, o.y - 0.2, last ? "TAN!" : "tim!", "#ffe08a", 0.6, last ? 15 : 12);
      });
      player.actT = 2;
      if (j.hits >= 3) {
        for (const [k, n] of Object.entries(F.mats)) removeItem(k, n);
        const name = j.bow && t.bow ? t.bow : j.two && t.two ? t.two : t.name; let aff, master = 0;
        gainXp("ferraria", F.xp); emit("forge:" + j.key); player.stats.forged++;
        if (t.rolls) { aff = RULES.rollAffixes(rand() < 0.4 ? 2 : 1, 1, rand); // rodada 82: o metal "escolhe"
          log(`✦ ${name}: ${aff.map((a) => RULES.affixNames({ aff: [a] })).join(" e ")} (${bonusText(RULES.itemBonus({ name: "", aff }, ITEMS))}).`, "rare"); }
        if (rand() < 0.12 + lv("ferraria") * 0.002) { // obra-prima: bônus extra nesta peça
          master = 1; player.stats.masterworks = (player.stats.masterworks || 0) + 1;
          showToast("Obra-prima!", `${name} saiu perfeita: ${MASTER_TEXT[j.key] || "+5% de coleta"}.`, "#f1c40f"); SND.play("rare");
        }
        checkAch();
        if (!addItem(name, 1, aff, master)) dropItem(name, 1, player.x, player.y, null, aff);
        log(`Você forjou: ${name}${master ? " ★" : ""}! Está na mochila: clique nela para equipar.`, "gold");
        addFloat(player.px + 0.5, player.py - 0.9, name, "#f1c40f", 1.8, 15);
        burst(player.px + 0.5, player.py + 0.3, ["#f1c40f", "#ffffff"], 18, 3);
        player.job = null; hudDirty = true; save(); renderDlg();
      }
    }
  }

  function startAttack(m) {
    if (player.seen.ate && foodCount() === 0 && player.region !== "town" && !inCrypt) { // rodada 61: atacar sem comida
      player.foodPulseT = 4; hudDirty = true;
      if (player.playT - (player.noFoodWarnT ?? -1e9) > 60) { player.noFoodWarnT = player.playT; log("Sem comida na mochila! Termine esta luta e volte para pescar antes de puxar outro monstro.", "warn", "icon_food_low"); }
    }
    m.aggro = true; if (m.atkT < 1) m.atkT = 1;
    if (hasBow() && !startAttack.warned) { startAttack.warned = 1; log("Sem flechas: você bate com o arco. Compre flechas com o Bento ou crie no Artesanato.", "warn"); }
    useTool("tool_sword", () => resolveAttack(m), { prep: 0.13, strike: 0.06, rec: 0.24 });
    setTimeout(() => SND.play("whoosh"), 90);
  }
  // rodada 104: troca automática. Recurso: veste a melhor ferramenta daquele tipo que estiver na mochila; monstro: a melhor arma
  // (o arco só se houver flechas na aljava). A peça que sai volta para a mochila.
  function bestInBag(ok) {
    let bi = -1, bt = -1;
    player.inv.forEach((s, i) => { const it = s && ITEMS[s.name]; if (!it || !it.gear || !ok(it)) return;
      const g = GEAR[it.gear]; if (lv(g.skill) >= (g.tiers[it.tier].req || 0) && it.tier > bt) { bt = it.tier; bi = i; } });
    return bi;
  }
  function ensureTool(k) {
    const e = player.equip.arma; if (e && ITEMS[e.name].gear === k) return true;
    const i = bestInBag((it) => it.gear === k); if (i < 0) return false;
    if (e && !canAdd(e.name) && player.inv[i].n > 1) return false;
    equip(i, true); return true;
  }
  function ensureWeapon() {
    const e = player.equip.arma; if (e && ITEMS[e.name].gear === "espada") return;
    const shield = player.equip.municao && ITEMS[player.equip.municao.name].sec === "escudo"; // rodada 105: com escudo, não pega montante
    const i = bestInBag((it) => it.gear === "espada" && (!it.bow || arrows()) && (!it.onlyHero || it.onlyHero === player.hero) && !(it.twoH && shield)); if (i >= 0) equip(i, true);
  }
  // rodada 104: tiro do arqueiro. A flecha sai na soltura da corda e o dano entra quando ela chega.
  function clearShot(x0, y0, x1, y1) { // nada sólido no caminho (água não bloqueia; árvore, parede e casa sim)
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 3);
    for (let i = 1; i < n; i++) {
      const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n);
      if ((x === x0 && y === y0) || (x === x1 && y === y1)) continue;
      if (!inside(x, y) || map[y][x] === "void" || isBlockingObj(occ[y * W + x])) return false;
    }
    return true;
  }
  const shots = [];
  function startShot(m) {
    m.aggro = true; if (m.atkT < 1) m.atkT = 1;
    useTool("bow", () => {
      const q = arrows(); if (!q || m.dead) return;
      const it = q.name; if (--q.n <= 0) { player.equip.municao = null; log("Acabaram as flechas! Compre com o Bento ou crie no Artesanato.", "warn"); refreshOutfit(); }
      const x0 = player.px + 0.5 + DIR_VEC[player.dir][0] * 0.3, y0 = player.py + 0.35, x1 = m.px + 0.5, y1 = headOf(m) + 0.55;
      shots.push({ x0, y0, x1, y1, t: 0, dur: Math.max(0.12, Math.hypot(x1 - x0, y1 - y0) / 14), m, it });
      SND.play("whoosh"); hudDirty = true;
    }, { prep: 0.24, strike: 0.06, rec: 0.22 });
  }
  function updateShots(dt) {
    for (const s of shots) {
      s.t += dt; if (s.t < s.dur || s.done) continue; s.done = true;
      const m = s.m; if (m.dead) continue;
      if (rollHit(m)) { const [dmg, crit] = rollDmg(); hurtMob(m, dmg, crit); } else missMob(m);
    }
    for (let i = shots.length - 1; i >= 0; i--) if (shots[i].done) shots.splice(i, 1);
  }
  function drawShots() { // flecha em arco baixo, apontando para onde vai
    for (const s of shots) {
      const k = Math.min(1, s.t / s.dur), h = 0.25 * Math.min(1, s.dur * 3);
      const px = (k2) => [(s.x0 + (s.x1 - s.x0) * k2) * TILE - cam.x, (s.y0 + (s.y1 - s.y0) * k2 - Math.sin(Math.PI * k2) * h) * TILE - cam.y];
      const [x, y] = px(k), [xa, ya] = px(Math.min(1, k + 0.02)), [xb, yb] = px(Math.max(0, k - 0.02)), ang = Math.atan2(ya - yb, xa - xb);
      const tip = s.it.includes("lumita") ? "#9ff0ff" : s.it.includes("ferro") ? "#e8eef6" : "#c8a070";
      ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(ang);
      ctx.fillStyle = "#1a1012"; ctx.fillRect(-15, -2, 26, 4); // contorno
      ctx.fillStyle = "#c49a62"; ctx.fillRect(-14, -1, 24, 2); // haste
      ctx.fillStyle = tip; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(8, -3); ctx.lineTo(8, 3); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#d84a3a"; ctx.fillRect(-15, -4, 6, 2); ctx.fillRect(-15, 2, 6, 2); // penas
      ctx.restore();
    }
  }
  const headOf = (m) => m.py + 1 - (SPR[m.d.spr] ? SPR[m.d.spr].height * (m.d.scale || 1) / TILE : 1);
  function rollHit(m, bonusAcc = 0) { const st = combatStats(); return rand() < hitChance(st.acc + bonusAcc, m.d.def); }
  function rollDmg(mult = 1) { // dano de um golpe; devolve [dano, crítico]
    const st = combatStats(), crit = rand() < RULES.critChance(player.style);
    return [Math.ceil((crit ? st.maxHit + ri(1, Math.ceil(st.maxHit * RULES.critBonus(player.style))) : ri(1, st.maxHit)) * mult), crit]; // Preciso: crítico maior
  }
  function missMob(m) { addFloat(m.px + 0.5, headOf(m) + 0.35, "errou", "#bbbbbb", 0.8, 12); SND.play("miss"); }
  function resolveAttack(m) { // quadro de impacto do golpe
    if (m.dead) return;
    if (!adjacent(player, m)) { addFloat(m.px + 0.5, m.py, "errou", "#bbbbbb", 0.8, 12); return; }
    if (rollHit(m)) { const [dmg, crit] = rollDmg(); hurtMob(m, dmg, crit); } else missMob(m);
  }
  // ---------- rodada 95: companheiro (filhote da lua) ----------
  // Segue o herói e morde o alvo dele ou quem o ataca. Rodada 96: folha própria por fase (Blender), vida e defesa pelo vínculo;
  // monstros ao lado dele o atacam (petFoe) e não entram no tile dele (petAt); ao cair, descansa na vila PET.rest s e volta.
  // Fica fora da lista de monstros: o herói não o seleciona nem o acerta.
  let pet = null;
  const petBondNow = () => RULES.petBond(player.pet.kills);
  function petData() { const b = petBondNow(); return { ...MOBS.wolf, spr: "pet_moon_" + RULES.petStage(b), name: player.pet.name, hp: RULES.petMaxHp(b), scale: 1, aggro: 0 }; }
  function petEnsure() {
    if (!player.pet && player.quests.c2_uivo && player.quests.c2_uivo.done && !SCENE.active()) {
      player.pet = { name: RULES.PET.name, kills: 0, hp: 0, rest: 0, named: 0 }; hudDirty = true;
      log("A Juna te entrega um filhote órfão da matilha da lua. Ele agora segue você e luta ao seu lado.", "gold");
      SCENE.play("c2_filhote", () => { if (player.pet && !player.pet.named) openDlg("pet"); }); // rodada 96: cena da entrega e, no fim, o nome
    }
    if (!player.pet) { pet = null; return; }
    if (!pet) { const x = player.x, y = player.y + 1, d = petData(), P = player.pet;
      pet = { type: "pet", pet: true, d, x, y, fx: x, fy: y, px: x, py: y, prog: 1, dist: 0, phase: 0, face: 1, hp: P.hp > 0 ? Math.min(d.hp, P.hp) : d.hp, flash: 0, lunge: 0, kb: 0, atkT: 0, lastHurt: -99, an: { s: "idle", t: 0, still: 0 } };
      if (P.rest > 0) petRestAt(); }
  }
  function petPlace() { // tile livre ao lado do herói (atrás dele, de preferência)
    for (const [dx, dy] of [[-1, 1], [1, 1], [-1, 0], [1, 0], [0, 1], [0, -1], [-1, -1], [1, -1]]) { const x = player.x + dx, y = player.y + dy;
      if (walkable(x, y) && !mobs.some((m) => !m.dead && m.x === x && m.y === y)) { Object.assign(pet, { x, y, fx: x, fy: y, px: x, py: y, prog: 1 }); return; } }
  }
  const PET_REST = [[-3, 1], [-2, 1], [2, 1], [-2, -1], [1, 2], [-1, 2], [3, 0]]; // rodada 96: onde ele descansa (rodada 98: perto da fogueira, sem telhado ou poste na frente)
  function petRestAt() {
    const B = player.home && player.home.built ? ValdoraHome.BED : null; // rodada 100: com a casa pronta, na cama de palha do quintal
    const [dx, dy] = B ? [B.x - SPAWN.x, B.y - SPAWN.y] : (!inCrypt && PET_REST.find(([dx, dy]) => walkable(SPAWN.x + dx, SPAWN.y + dy))) || PET_REST[0], x = SPAWN.x + dx, y = SPAWN.y + dy;
    Object.assign(pet, { down: true, sleeping: true, x, y, fx: x, fy: y, px: x, py: y, prog: 1, face: -1, flash: 0, lunge: 0, kb: 0, an: { s: "idle", t: 0, still: 0 } }); // rodada 97: dorme (linha sleep da fase 1)
  }
  function petFall() { // rodada 96: caiu — quadros de queda onde estava e vai descansar na vila
    pet.stay = false; pet.napping = false; pushCorpse(pet); pet.hp = player.pet.hp = 0; player.pet.rest = RULES.PET.rest; petRestAt();
    for (const m of mobs) if (m.foe === "pet") m.foe = null;
    log(`${player.pet.name} caiu! Ele corre de volta para a vila e descansa ${Math.round(RULES.PET.rest / 60)} min.`, "warn"); SND.play("hurt"); hudDirty = true;
  }
  const petFoe = (m, dist) => pet && player.pet && !pet.down && Math.abs(m.x - pet.x) + Math.abs(m.y - pet.y) === 1 && m.foe === "pet" && (dist !== 1 || rand() < RULES.PET.draw) ? pet : null; // rodada 96: só quem ele mordeu por último; ao lado dos dois, às vezes (PET.draw)
  const petAt = (x, y) => !!(pet && player.pet && !pet.down && pet.x === x && pet.y === y);
  function petAttack(m) { // rodada 96: golpe comum de monstro no filhote (o dano sai no quadro de impacto, como no herói)
    const d = m.d, pe = { pet: true, hit: rand() < hitChance(d.atk, RULES.petDef(petBondNow())), dmg: ri(1, d.maxHit) };
    if (ANIMS[d.spr] && !(m.an && m.an.s === "death")) { m.an = { s: "attack", t: 0, still: 0 }; m.pending = pe; } else { m.lunge = 1; petHurt(m, pe); }
  }
  function petHurt(m, pe) {
    if (!pet || !player.pet || pet.down || Math.abs(m.x - pet.x) + Math.abs(m.y - pet.y) !== 1) return; // saiu do lado antes do impacto
    if (!pe.hit) { addFloat(pet.px + 0.5, pet.py - 0.2, "errou", "#9fb4d0", 0.6, 11); return; }
    petDamage(pe.dmg);
  }
  function petDamage(raw) { // rodada 98: dano no filhote (golpe comum ou tremor)
    const dmg = Math.min(pet.hp, raw); pet.hp -= dmg; player.pet.hp = pet.hp; pet.flash = 0.16; pet.lastHurt = tickN; hudDirty = true;
    if (pet.an.s !== "attack") pet.an = { s: "hit", t: 0, still: 0 };
    hitSplat(pet.px + 0.5, headOf(pet) + 0.35, dmg, "#ff9a7a");
    if (pet.hp <= 0) petFall();
  }
  function petSlam(m) { // rodada 98: tremor de golem/Serpente acerta o filhote a até 2,3 tiles (mesma conta do herói, com a defesa dele)
    if (!pet || !player.pet || pet.down || Math.hypot(pet.x - m.x, pet.y - m.y) > 2.3) return;
    if (pet.prog < 1 && Math.hypot(pet.x - m.x, pet.y - m.y) > Math.hypot(pet.fx - m.x, pet.fy - m.y)) { addFloat(pet.px + 0.5, pet.py - 0.4, "esquivou!", "#9fe08a", 0.9, 12); return; } // já pulando para longe
    const d = m.d; petDamage(Math.max(2, ri(Math.ceil(d.maxHit * 0.9), Math.ceil(d.maxHit * 1.8)) - Math.floor(RULES.petDef(petBondNow()) / 8)));
  }
  function petMove(x, y) {
    if (!walkable(x, y) || (x === player.x && y === player.y) || mobs.some((m) => !m.dead && m.x === x && m.y === y)) return false;
    if (x !== pet.x) pet.face = x > pet.x ? 1 : -1;
    pet.fx = pet.x; pet.fy = pet.y; pet.x = x; pet.y = y; pet.prog = 0; return true;
  }
  function petStepToward(tx, ty) {
    const dx = Math.sign(tx - pet.x), dy = Math.sign(ty - pet.y);
    const order = Math.abs(tx - pet.x) >= Math.abs(ty - pet.y) ? [[dx, 0], [0, dy], [0, dy || 1], [0, -(dy || 1)]] : [[0, dy], [dx, 0], [dx || 1, 0], [-(dx || 1), 0]];
    for (const [ax, ay] of order) if ((ax || ay) && petMove(pet.x + ax, pet.y + ay)) return;
  }
  function petTarget() { // alvo do herói (até PET.reach); senão, quem está em luta perto do herói ou ao lado do filhote
    const t = player.target, P = RULES.PET;
    if (t && t.kind === "mob" && t.ref && !t.ref.dead && mobs.includes(t.ref) && Math.max(Math.abs(t.ref.x - player.x), Math.abs(t.ref.y - player.y)) <= P.reach) return t.ref;
    let best = null, bd = 99;
    for (const m of mobs) if (!m.dead && m.aggro) { const d = Math.abs(m.x - player.x) + Math.abs(m.y - player.y); if ((d <= P.pull || Math.abs(m.x - pet.x) + Math.abs(m.y - pet.y) === 1) && d < bd) { bd = d; best = m; } }
    return best;
  }
  function petBite(m) {
    const st = RULES.petStats(petBondNow());
    pet.an = { s: "attack", t: 0, still: 0 }; pet.lunge = 1; pet.face = m.x > pet.x ? 1 : m.x < pet.x ? -1 : pet.face;
    if (rand() < RULES.hitChance(st.acc, m.d.def)) { hurtMob(m, 1 + Math.floor(rand() * st.maxHit), false, { pet: true }); if (m.dead) { player.pet.kills++; const hp = pet.d.hp; pet.d = petData(); if (pet.d.hp > hp) pet.hp += pet.d.hp - hp; emit("petkill"); petGrowth(); } } // rodada 97: missões da Juna e conquista
    else addFloat(m.px + 0.5, m.py - 0.3, "errou", "#9fb4d0", 0.6, 11);
  }
  function petTick() {
    petEnsure(); if (!pet) return;
    const P = RULES.PET, PP = player.pet, maxH = pet.d.hp;
    if (pet.down) { // rodada 96: descansando na vila; a vida volta aos poucos e, no fim, ele corre para o lado do herói
      PP.rest = Math.max(0, PP.rest - TICK); pet.hp = PP.hp = Math.round(maxH * (1 - PP.rest / P.rest)); if (tickN % 2 === 0) hudDirty = true;
      if (PP.rest <= 0) { pet.down = false; pet.sleeping = false; pet.an = { s: "idle", t: 0, still: 0 }; pet.hp = PP.hp = maxH; petPlace(); log(`${PP.name} se recuperou na vila e voltou para o seu lado.`, "gold"); hudDirty = true; }
      return;
    }
    if (player.deadT > 0) return;
    if (tickN - pet.lastHurt > 8 && tickN % 4 === 0 && pet.hp < maxH) { pet.hp = PP.hp = pet.hp + 1; hudDirty = true; } // regenera como o herói
    const far = Math.max(Math.abs(pet.x - player.x), Math.abs(pet.y - player.y));
    if (far > P.leash && pet.stay) { pet.stay = false; log(`${PP.name} cansou de esperar e correu atrás de você.`, "dim"); hudDirty = true; } // rodada 99
    if (far > P.leash || (pet.x === player.x && pet.y === player.y) || mobs.some((m) => !m.dead && m.x === pet.x && m.y === pet.y)) { petPlace(); return; } // viagem, masmorra, queda; monstro nasceu em cima
    if (pet.prog < 1) return;
    const quake = mobs.find((m) => !m.dead && m.windup > 0 && m.d.slam && Math.hypot(pet.x - m.x, pet.y - m.y) <= 3.6); // rodada 98: foge do tremor anunciado e espera fora do círculo
    if (quake && Math.hypot(pet.x - quake.x, pet.y - quake.y) > 2.6) return;
    if (quake) { let best = null, bd = Math.hypot(pet.x - quake.x, pet.y - quake.y);
      for (const [dx, dy] of DIRS) { const x = pet.x + dx, y = pet.y + dy, dd = Math.hypot(x - quake.x, y - quake.y); if (dd > bd && walkable(x, y) && !(x === player.x && y === player.y) && !mobs.some((m) => !m.dead && m.x === x && m.y === y)) { bd = dd; best = [x, y]; } }
      if (best) { petMove(best[0], best[1]); return; } }
    const tgt = petTarget();
    if (pet.stay) { if (tgt && Math.abs(tgt.x - pet.x) + Math.abs(tgt.y - pet.y) === 1 && --pet.atkT <= 0) { pet.atkT = P.every; petBite(tgt); } return; } // rodada 99: ficando, só morde quem está ao lado
    if (tgt && pet.napping) { pet.napping = pet.sleeping = false; pet.an = { s: "idle", t: 0, still: 0 }; pet.idleT = 0; } // acorda para brigar
    if (tgt) { if (Math.abs(tgt.x - pet.x) + Math.abs(tgt.y - pet.y) === 1) { if (--pet.atkT <= 0) { pet.atkT = P.every; petBite(tgt); } } else petStepToward(tgt.x, tgt.y); return; }
    pet.atkT = Math.min(pet.atkT, 1);
    const BED = ValdoraHome.BED, atHome = player.home && player.home.built && !inCrypt && Math.max(Math.abs(player.x - BED.x), Math.abs(player.y - BED.y)) <= 4; // rodada 101: cochilo na cama
    if (atHome && player.prog >= 1 && !player.path.length && !player.target && !player.job) {
      if ((pet.idleT = (pet.idleT || 0) + 1) >= 4) { if (pet.x !== BED.x || pet.y !== BED.y) { petStepToward(BED.x, BED.y); return; } if (!pet.napping) { pet.napping = pet.sleeping = true; } return; }
    } else pet.idleT = 0;
    if (pet.napping) { pet.napping = pet.sleeping = false; pet.an = { s: "idle", t: 0, still: 0 }; } // o herói saiu: levanta e segue
    if (far > P.follow) petStepToward(player.x, player.y);
  }
  function petFrame(dt) {
    if (!pet) return;
    if (pet.prog < 1) { pet.prog = Math.min(1, pet.prog + dt / MOB_STEP); pet.dist += dt / MOB_STEP; }
    const k = ease.inOutSine(pet.prog); pet.px = pet.fx + (pet.x - pet.fx) * k; pet.py = pet.fy + (pet.y - pet.fy) * k;
    if ((pet.down || pet.napping) && player.home && player.home.built && pet.x === ValdoraHome.BED.x && pet.y === ValdoraHome.BED.y && pet.prog >= 1) pet.py -= 0.25; // rodada 100: deitado em cima da cama de palha
    pet.lunge = Math.max(0, pet.lunge - dt * 4.5); pet.flash = Math.max(0, pet.flash - dt); mobAnim(pet, dt);
  }
  function petGrowth() { // rodada 97: aviso quando o vínculo sobe de fase (a Juna tem missão nova) e conquista do vínculo 20
    const b = petBondNow(), last = player.pet.seenBond || 1; if (b <= last) return; player.pet.seenBond = b;
    if (RULES.petStage(b) > RULES.petStage(last)) { log(`${player.pet.name} cresceu! Agora é ${RULES.petStage(b) === 2 ? "um lobo jovem" : "um lobo adulto"}. A Juna quer ver.`, "gold"); showToast(player.pet.name + " cresceu", "Vínculo " + b + ": fale com a Juna", "#b8d8ff"); }
    if (b >= RULES.PET.bondMax) checkAch();
  }
  function petStay() { // rodada 99: ficar/seguir (tecla G e botão na janela); não mexe no vínculo
    if (!player.pet || !pet) return; if (pet.down) { log(`${player.pet.name} está descansando na vila.`, "dim"); return; }
    pet.stay = !pet.stay; hudDirty = true; SND.play("ui");
    addFloat(pet.px + 0.5, headOf(pet) - 0.1, pet.stay ? "fica!" : "vem!", "#b8d8ff", 1, 13);
    log(pet.stay ? `${player.pet.name} senta e espera aqui (G para chamar).` : `${player.pet.name} volta a seguir você.`, "dim");
    if (dlg && dlg.kind === "pet") renderDlg();
  }
  // ---------- rodada 100: Casa do herói (regras em js/home.js) ----------
  let homeObjs = null;
  function homeSync() { // o mapa acompanha o save: lote → obra → casa; troféus nos pedestais; cama, banco e vaso
    const H = ValdoraHome, h = player.home, O = homeObjs; if (!O || !h) return;
    O.house.spr = h.built ? "house_hero" : h.lot ? "house_hero_build" : "house_hero_lot";
    O.peds.forEach((o, i) => { o.spr = h.built ? "deco_trophy_pedestal" : null; o.solid = !!h.built; const t = H.BY_ID[h.slots[i]]; o.top = h.built && t ? t.spr : null; });
    O.bed.spr = h.built ? "deco_pet_bed" : null; O.bench.spr = h.built && h.furn.bench ? "deco_home_bench" : null;
    O.mint.spr = h.built && player.quests.f3_uivo && player.quests.f3_uivo.done ? "deco_mint_pot" : null; // presente da Juna (Uivo próprio)
  }
  const VISIT_PT = { guard: "portrait_ivo", bard: "portrait_tome", shop: "portrait_bento", herb: "portrait_juna", carto: "portrait_odilia", miner: "portrait_bras" };
  function homeVisit() { // rodada 102: um NPC passa pelo quintal e comenta um troféu (registro + texto curto sobre a casa); não para o jogo
    const H = ValdoraHome, h = player.home, B = H.BED; if (!h || !h.built || inCrypt || player.deadT > 0 || SCENE.active() || !H.canVisit(h, player.playT)) return;
    if (Math.max(Math.abs(player.x - B.x), Math.abs(player.y - B.y)) > H.VISIT.near || mobs.some((m) => !m.dead && m.aggro)) return;
    const v = H.pickVisit(h, h.visitBy, rand); if (!v) return;
    h.visitAt = player.playT; h.visitBy = v.who;
    log(v.text, "tip", ASSETS[VISIT_PT[v.who]] ? VISIT_PT[v.who] : undefined);
    addFloat(H.HOUSE.x + 1.5, H.HOUSE.y - 1.2, `${v.name} passou aqui`, "#f5e27a", 2.2, 14);
  }
  function homeShop() { // linhas no topo da aba Comprar do Bento
    const H = ValdoraHome, h = player.home, R = ValdoraDialogs.row, ic = ASSETS.icon_home ? `<img src="${ASSETS.icon_home}" alt="">` : "";
    if (H.canBuy(player)) return R(ic, "Escritura do lote", "Terreno na saída sudoeste da vila, no caminho da Juna. Depois vem a obra.", H.COST, `<button data-homebuy="1" ${player.coins < H.COST ? "disabled" : ""}>Comprar</button>`);
    if (h.lot && !h.built) return R(ic, "Sua casa está em obra", "Leve os materiais ao lote (clique nele).", null, "");
    if (h.built && !h.furn.bench) return R(ic, "Banco do quintal", "Só enfeite.", H.BENCH_COST, `<button data-homebench="1" ${player.coins < H.BENCH_COST ? "disabled" : ""}>Comprar</button>`);
    return "";
  }
  // ---------- rodada 105: Pedras das vilas (teleporte e ponto de renascer) ----------
  // Cada vila tem uma Pedra. Ao chegar na vila (ou tocar a Pedra) ela fica salva; de qualquer Pedra salva dá para viajar
  // para as outras pagando STONE_COST moedas e marcar onde renascer (uma de cada vez).
  const STONE_COST = 30;
  // rodada 105: mapa do continente (M): quase a tela inteira, redesenhado junto com o minimapa enquanto estiver aberto
  function toggleMap(force) { const el = $("worldmap"), on = force ?? el.hidden; el.hidden = !on; $("game").classList.toggle("map-open", on); if (on) { closeDlg(); drawMap(); } } // rodada 106: só o mapa na tela
  function drawMap() {
    const el = $("worldmap"); if (el.hidden) return;
    const cv = $("wm-canvas"), r = cv.getBoundingClientRect(), w = Math.max(200, Math.round(r.width)), h = Math.max(160, Math.round(r.height));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    OVERLAY.drawWorldMap(cv);
  }
  $("wm-close").onclick = () => toggleMap(false);
  const stoneOf = (key) => WORLD_G.VILLAGES.find((v) => v.key === key);
  function unlockStone(key, verbose) {
    if (!key || !stoneOf(key)) return;
    player.stones = player.stones || ["lumeira"];
    if (player.stones.includes(key)) return;
    player.stones.push(key); const v = stoneOf(key);
    showToast("Pedra desbloqueada", `${v.name}: agora dá para viajar até aqui de qualquer Pedra.`, "#7fe8ff"); SND.play("quest");
    log(`A Pedra de ${v.name} brilha: lugar salvo. Toque nela para viajar ou marcar onde renascer.`, "gold"); hudDirty = true; save();
  }
  function stoneDlg() {
    const here = dlg && dlg.obj && dlg.obj.village, R = (ic, title, sub, price, btn) => `<div class="row">${ic}<span class="grow">${title}${sub ? `<br><small>${sub}</small>` : ""}</span>${price != null ? `<span class="price">${price}<img src="${ASSETS.coin}" alt=""></span>` : ""}${btn}</div>`;
    const ic = ASSETS.deco_waystone ? `<img src="${ASSETS.deco_waystone}" alt="">` : "";
    const html = WORLD_G.VILLAGES.map((v) => {
      const B = WORLD_G.BIOMES[v.biome - 1], got = (player.stones || []).includes(v.key), sp = (player.spawnStone || "lumeira") === v.key;
      const sub = `${B.name} · monstros ${B.lv[0]}–${B.lv[1]}${sp ? " · você renasce aqui" : ""}`;
      if (!got) return R(ic, `<span style="opacity:.55">${esc(v.name)}</span>`, `${B.name} · ainda não visitada`, null, `<button disabled>Bloqueada</button>`);
      const go = v.key === here ? `<button disabled>Você está aqui</button>` : `<button data-stonego="${v.key}" ${player.coins < STONE_COST ? "disabled" : ""}>Viajar</button>`;
      const spawn = sp ? "" : `<button data-stonespawn="${v.key}">Renascer aqui</button>`;
      return R(ic, esc(v.name), sub, v.key === here ? null : STONE_COST, go + spawn);
    }).join("");
    return { talk: `Pedras antigas ligam as vilas do reino. Viajar custa ${STONE_COST} moedas; marcar onde renascer é de graça.`, html };
  }
  function stoneAct(k, v) {
    const S = stoneOf(v); if (!S || !(player.stones || []).includes(v)) return;
    if (k === "stonespawn") { player.spawnStone = v; log(`Você vai renascer na Pedra de ${S.name}.`, "gold"); SND.play("pickup"); save(); renderDlg(); return; }
    if (k === "stonego") {
      if (player.coins < STONE_COST || inCrypt || player.deadT > 0) return;
      player.coins -= STONE_COST; const p = stoneSpot(S); closeDlg();
      burst(player.px + 0.5, player.py + 0.5, ["#7fe8ff", "#ffffff"], 24, 3);
      Object.assign(player, { x: p.x, y: p.y, fx: p.x, fy: p.y, px: p.x, py: p.y, prog: 1, path: [], target: null, goal: null, job: null, dir: "down" });
      CAMERA.reset(); burst(p.x + 0.5, p.y + 0.5, ["#7fe8ff", "#ffffff"], 30, 3); SND.play("quest");
      log(`A Pedra leva você até ${S.name} (−${STONE_COST} moedas).`, "gold"); hudDirty = true; save();
    }
  }
  function stoneSpot(S) { // tile andável ao lado da Pedra da vila
    const s = S.stone || { x: (S.x0 + S.x1) >> 1, y: (S.y0 + S.y1) >> 1 };
    for (const [dx, dy] of [[0, 1], [1, 1], [-1, 1], [1, 0], [-1, 0], [0, -1], [0, 2], [2, 0], [-2, 0]]) if (walkable(s.x + dx, s.y + dy)) return { x: s.x + dx, y: s.y + dy };
    return { x: SPAWN.x, y: SPAWN.y };
  }
  function homeDlg() {
    const H = ValdoraHome, h = player.home, R = ValdoraDialogs.row;
    if (!h.lot) return { talk: "Um terreno com estacas e corda. A placa diz que a escritura está com o Bento.", html: `<p class="empty">${H.canBuy(player) ? `Escritura: ${H.COST} moedas na banca do Bento.` : "O Bento só vende o lote a quem já ajudou a vila (conclua o Ato II, O Marco da Mata)."}</p>` };
    if (!h.built) { const mats = Object.entries(H.BUILD), ok = mats.every(([k, v]) => count(k) >= v);
      return { talk: "O lote é seu. Falta a casa.", html: mats.map(([k, v]) => R(iconImg(k), `${v}x ${esc(k)}`, `tem ${count(k)}`, null, "")).join("") + `<button class="wide" data-homebuild="1" ${ok ? "" : "disabled"}>Entregar os materiais e construir</button>` }; }
    const n = H.shown(h), playT = player.playT, can = H.canRest(h, playT) && !mobs.some((m) => !m.dead && m.aggro), left = H.restLeft(h, playT);
    let html = `<div class="bank-head">Descanso</div>` + R(ASSETS.icon_rested ? `<img src="${ASSETS.icon_rested}" alt="">` : "", "Dormir na cama", `Bem descansado por ${H.REST.ticks * TICK / 60} min: +${H.restHp(n)} de vida máxima (+${H.REST.hpPer} por troféu exposto)${n >= H.REST.regenAt ? " e vida voltando mais rápido fora de luta" : `; com ${H.REST.regenAt} troféus expostos, a vida também volta mais rápido fora de luta`}.${can ? "" : left ? ` Volte em ${Math.ceil(left / 60)} min.` : " Não dá para dormir em luta."}`, null, `<button data-homerest="1" ${can ? "" : "disabled"}>Dormir</button>`);
    html += `<div class="bank-head">Troféus no quintal <small>${n}/${H.SLOTS}</small></div>` + H.TROPHIES.map((t) => {
      const on = h.slots.includes(t.id), un = H.unlocked(t, { kills: player.kills, quests: player.quests, home: h }), give = t.kind === "deliver" && !un && count(t.item) > 0;
      const btn = un ? `<button data-hometoggle="${t.id}" ${!on && n >= H.SLOTS ? "disabled" : ""}>${on ? "Guardar" : "Expor"}</button>` : give ? `<button data-homegive="${t.id}">Entregar</button>` : `<button disabled>Bloqueado</button>`;
      return R(SPR[t.spr] ? `<img src="${ASSETS[t.spr]}" alt="">` : "", `${esc(t.name)}${on ? " <small>exposto</small>" : ""}`, un ? "" : esc(H.howTo(t)), null, btn); }).join("");
    return { talk: n ? "" : "O quintal está vazio. Exponha o que você conquistou.", html };
  }
  function homeAct(k, v) {
    const H = ValdoraHome, h = player.home;
    if (k === "homebuy" && H.canBuy(player) && player.coins >= H.COST) { player.coins -= H.COST; h.lot = 1; SND.play("coin"); log(`Você comprou a escritura do lote (−${H.COST} moedas). Leve os materiais ao terreno, a sudoeste da vila.`, "gold"); }
    if (k === "homebuild" && h.lot && !h.built && Object.entries(H.BUILD).every(([n, q]) => count(n) >= q)) { for (const [n, q] of Object.entries(H.BUILD)) removeItem(n, q); h.built = 1; SND.play("quest"); log("A casa está pronta! O quintal tem nove pedestais para os seus troféus, e o filhote ganhou uma cama.", "gold"); showToast("Casa pronta", "Exponha troféus e durma para ficar Bem descansado", "#b8d8ff"); }
    if (k === "homebench" && h.built && !h.furn.bench && player.coins >= H.BENCH_COST) { player.coins -= H.BENCH_COST; h.furn.bench = 1; SND.play("coin"); }
    if (k === "homegive") { const t = H.BY_ID[v]; if (t && t.kind === "deliver" && !h.got[t.id] && count(t.item) > 0) { removeItem(t.item, 1); h.got[t.id] = 1; if (h.slots.includes(null)) H.toggle(h, t.id); log(`${t.name} agora faz parte da casa.`, "gold"); } }
    if (k === "hometoggle") { const t = H.BY_ID[v]; if (t && H.unlocked(t, { kills: player.kills, quests: player.quests, home: h })) H.toggle(h, t.id); }
    if (k === "homerest" && H.canRest(h, player.playT) && !mobs.some((m) => !m.dead && m.aggro)) { h.restAt = player.playT; player.buffs.descansado = BUFFS.descansado.ticks; player.hp = maxHp(); SND.play("quest"); log(`Você dormiu em casa: Bem descansado por ${H.REST.ticks * TICK / 60} min (+${H.restHp(H.shown(h))} de vida máxima).`, "gold"); }
    homeSync(); hudDirty = true;
  }
  // rodada 96: painel e janela do filhote; nome escolhido pelo jogador
  function petView() {
    if (!player.pet || !pet) return null; const P = player.pet, b = petBondNow(), mh = pet.d.hp, r = Math.ceil(P.rest || 0);
    return { name: P.name, down: !!pet.down, pct: Math.round(Math.max(0, pet.hp) / mh * 100), label: pet.down ? `na vila · ${Math.floor(r / 60)}:${String(r % 60).padStart(2, "0")}` : `${pet.stay ? "esperando · " : ""}${pet.hp} / ${mh}`,
      tip: `${P.name} · vínculo ${b}/${RULES.PET.bondMax} · ${pet.down ? "descansando na vila" : "clique para ver ou dar um nome"}` };
  }
  function petDlg() {
    if (!player.pet || !pet) return { talk: "", html: `<p class="empty">Nenhum companheiro.</p>` };
    const P = player.pet, b = petBondNow(), st = RULES.petStats(b), stage = RULES.petStage(b), mh = pet.d.hp, nx = stage === 1 ? 7 : stage === 2 ? 14 : 0, r = Math.ceil(P.rest || 0);
    const html = `<div class="pet-card">${ASSETS.portrait_pet_moon ? `<img class="pet-pt" src="${ASSETS.portrait_pet_moon}" alt="">` : ""}<div class="grow"><b>${esc(P.name)}</b> <small>${["", "filhote", "jovem", "adulto"][stage]}</small>
      <div class="bar pethp"><i style="width:${Math.round(Math.max(0, pet.hp) / mh * 100)}%"></i><em>${pet.down ? `descansando na vila · ${Math.floor(r / 60)}:${String(r % 60).padStart(2, "0")}` : `${pet.hp} / ${mh}`}</em></div>
      <small>Vínculo ${b}/${RULES.PET.bondMax} · ${P.kills} abate${P.kills === 1 ? "" : "s"}${nx ? ` · cresce no vínculo ${nx}` : ""}</small><br><small>Acerto ${st.acc} · dano até ${st.maxHit} · defesa ${RULES.petDef(b)}</small></div></div>
      <label class="pet-name">Nome <input id="pet-name" maxlength="14" autocomplete="off" spellcheck="false" value="${esc(P.named ? P.name : "")}" placeholder="${esc(RULES.PET.name)}"></label>
      <button class="wide" data-petname="1">${P.named ? "Trocar o nome" : "Dar o nome"}</button>
      <button class="wide" data-petstay="1" ${pet.down ? "disabled" : ""}>${pet.stay ? "Chamar (seguir)" : "Mandar ficar aqui"} <small>(G)</small></button>
      <p class="desc">Morde o seu alvo e quem te ataca. Monstros ao lado dele também o atacam; se cair, ele corre para a vila e volta recuperado em ${Math.round(RULES.PET.rest / 60)} min.</p>`;
    return { talk: P.named ? "" : "Ele ainda não tem nome. Como vai chamar o filhote?", html };
  }
  function petRename(v) {
    if (!player.pet) return; const n = RULES.petName(v);
    if (!n) { log("Escolha um nome com 1 a 14 letras.", "dim"); return; }
    const first = !player.pet.named; player.pet.name = n; player.pet.named = 1; if (pet) pet.d = { ...pet.d, name: n }; hudDirty = true;
    log(first ? `O filhote agora se chama ${n}.` : `Agora ele se chama ${n}.`, "gold");
    if (pet && !pet.down) addFloat(pet.px + 0.5, headOf(pet) - 0.1, "♥", "#b8d8ff", 1.2, 16);
  }
  function hurtMob(m, rawDmg, crit, opts = {}) { // aplica dano, reação, números, XP e morte
    if (m.dead) return;
    const st = combatStats(), d = m.d, headY = headOf(m), dmg = Math.min(m.hp, rawDmg);
    if (opts.dot) { // pulso de sangramento: só número, gotas e XP, sem reação de golpe
      m.hp -= dmg; m.aggro = true; hitSplat(m.px + 0.5, headY + 0.45, dmg, "#ff6b5a");
      if (!RENDER.playOnce("fx_bleed", m.px, (headY + m.py + 1) / 2 - 0.5)) burst(m.px + 0.5, m.py + 0.6, ["#a8202a", "#d8323a"], 4, 1.4);
      const xp = STYLES[player.style].xp; gainXp("combate", Math.round(dmg * xp.combate)); gainXp("vitalidade", Math.round(dmg * xp.vitalidade));
      if (m.hp <= 0) killMob(m);
      return;
    }
    if (player.style === "agressivo" && !opts.pet && dmg > 0 && m.hp - dmg > 0 && rand() < RULES.BLEED.chance) // passiva do Agressivo: sangramento
      m.bleed = { n: RULES.BLEED.pulses, t: RULES.BLEED.every, dmg: RULES.bleedDmg(st.maxHit) };
    {
      m.foe = opts.pet ? "pet" : "hero"; // rodada 96: quem bateu por último (o monstro ao lado dos dois ataca esse)
      m.hp -= dmg; m.flash = 0.16; m.kb = crit || opts.heavy ? 1.6 : 1; m.prep = 0; m.aggro = true; m.sleeping = false;
      if (m.an && m.an.s !== "attack" && m.an.s !== "death" && m.an.s !== "special" && m.an.s !== "enrage") m.an = { s: "hit", t: 0, still: 0 };
      if (opts.stun) { m.stun = Math.max(m.stun || 0, opts.stun); if (m.an && m.an.s === "attack") { m.pending = null; m.an = { s: "hit", t: 0, still: 0 }; } }
      hitStop = Math.max(hitStop, 0.045);
      if (SND.opts.shake && !opts.pet) CAMERA.kick(m.px - player.px, m.py - player.py, crit || opts.heavy ? 6 : 3); // rodada 66: câmera acompanha o golpe
      fx.sparks((player.px + m.px) / 2 + 0.5, (player.py + m.py) / 2 + 0.45, crit ? 14 : 7, crit ? ["#fff6c0", "#ffd23a"] : ["#ffffff", "#ffe6a0"], crit ? 6 : 4.5);
      hitSplat(m.px + 0.5, headY + 0.35, dmg, crit ? "#ffd23a" : "#ffffff", crit); SND.play(crit ? "crit" : "hit");
      if (crit) { hitStop = 0.09; if (SND.opts.shake) shake = Math.max(shake, 0.12); /* rodada 66: o número do crítico já diz (dourado, "!" e estrela) */ burst(m.px + 0.5, m.py + 0.4, ["#ffd23a", "#ffffff"], 12, 4); }
      if ((d.slam || d.enrage) && !m.enraged && m.hp > 0 && m.hp <= d.hp * 0.3) enrageMob(m);
      burst(m.px + 0.5, m.py + 0.5, [d.color, "#ffffff"], 6, 3);
      const xp = STYLES[player.style].xp;
      if (!opts.pet) { gainXp("combate", Math.round(dmg * xp.combate)); gainXp("vitalidade", Math.round(dmg * xp.vitalidade)); } // rodada 95: a mordida do filhote não dá XP ao herói
      if (d.summon && !m.summoned && m.hp > 0 && m.hp <= d.hp / 2) bossSummon(m);
      if (m.hp <= 0) killMob(m);
    }
  }

  // ---------- Habilidades ativas (Q, E, R) ----------
  function skillTarget(maxDist) { // alvo atual se for monstro; senão o mais próximo
    if (player.target && player.target.kind === "mob" && !player.target.ref.dead) return player.target.ref;
    return mobs.filter((m) => !m.dead && Math.abs(m.x - player.x) + Math.abs(m.y - player.y) <= maxDist)
      .sort((a, b) => (Math.abs(a.x - player.x) + Math.abs(a.y - player.y)) - (Math.abs(b.x - player.x) + Math.abs(b.y - player.y)))[0];
  }
  function useSkill(id) {
    const S = ACTIVE[id];
    if (!running || player.deadT > 0 || player.dash) return;
    if (lv("combate") < S.lvl) { log(`${S.name}: libera no Combate ${S.lvl}.`, "dim"); return; }
    if (player.cd[id] > 0) { SND.play("miss"); return; }
    if (player.act && player.act.key) return; // não corta um golpe em andamento
    if (id === "spin") {
      const targets = mobs.filter((m) => !m.dead && Math.max(Math.abs(m.x - player.x), Math.abs(m.y - player.y)) <= 1);
      if (!targets.length) { log("Nenhum monstro ao seu redor.", "dim"); return; }
      player.cd.spin = S.cd; player.actT = Math.max(player.actT, 2); player.path = [];
      for (const m of targets) m.aggro = true;
      SND.play("whoosh");
      useTool("spin", () => {
        let hits = 0;
        for (const m of targets) if (!m.dead) { if (rollHit(m)) { const [dmg, crit] = rollDmg(S.mult); hurtMob(m, dmg, crit); hits++; } else missMob(m); }
        hitStop = Math.max(hitStop, 0.08); if (hits && SND.opts.shake) shake = Math.max(shake, 0.14);
        fx.shock(player.px + 0.5, player.py + 0.85, 1.75, "#fff0b0"); // rodada 66
        fx.dust(player.px + 0.5, player.py + 0.95, 10); setTimeout(() => SND.play("whoosh"), 60);
      }, { prep: 0.1, strike: 0.24, rec: 0.18 });
    } else if (id === "dash") {
      const m = skillTarget(S.range + 1); if (!m) { log("Nenhum alvo ao alcance.", "dim"); return; }
      const path = adjacent(player, m) ? [] : findPath(player.x, player.y, (x, y) => adjacent({ x, y }, m));
      if (!path || path.length > S.range) { log("O alvo está longe demais para a investida.", "dim"); return; }
      player.cd.dash = S.cd; player.actT = Math.max(player.actT, 2); player.target = { kind: "mob", ref: m }; player.path = []; m.aggro = true;
      const [tx, ty] = path.length ? path[path.length - 1] : [player.x, player.y];
      player.dash = { fx: player.px, fy: player.py, t: 0, dur: 0.08 + path.length * 0.045, m, ghosts: [] };
      player.fx = tx; player.fy = ty; player.x = tx; player.y = ty; player.prog = 1;
      faceTo(m.x, m.y); dustAtFeet(6); SND.play("whoosh");
    } else if (id === "smash") {
      const m = skillTarget(1); if (!m || !adjacent(player, m)) { log("Fique ao lado de um monstro para o golpe esmagador.", "dim"); return; }
      player.cd.smash = S.cd; player.actT = Math.max(player.actT, 3); player.target = { kind: "mob", ref: m }; player.path = []; m.aggro = true; faceTo(m.x, m.y);
      useTool("smash", () => {
        if (m.dead) return;
        const st = combatStats(), dmg = Math.ceil(st.maxHit * S.mult * (0.85 + rand() * 0.3));
        hurtMob(m, dmg, true, { stun: S.stun, heavy: true });
        hitStop = Math.max(hitStop, 0.13); if (SND.opts.shake) shake = 0.3; SND.play("slam");
        for (let a = 0; a < 16; a++) { const ang = a / 16 * 6.28; burst(m.x + 0.5 + Math.cos(ang) * 0.9, m.y + 0.8 + Math.sin(ang) * 0.6, ["#cdb98f", "#ffffff"], 1, 1.2); }
        fx.sparks(m.px + 0.5, m.py + 0.5, 16, ["#fff6c0", "#ffd23a", "#ffffff"], 6); clickFx(m.x + 0.5, m.y + 0.9, "#ffd23a"); fx.shock(m.px + 0.5, m.py + 0.85, 1.5, "#ffc04a", 0.5); fx.mark(m.px + 0.5, m.py + 0.9, 0.95); // rodadas 66-67
      }, { prep: 0.38, strike: 0.08, rec: 0.3 });
    }
    hudDirty = true;
  }
  function updateDash(dt) { // investida: desliza com rastro de imagens e golpeia na chegada
    const D = player.dash; D.t += dt;
    const k = ease.outQuad(Math.min(1, D.t / D.dur));
    player.px = D.fx + (player.x - D.fx) * k; player.py = D.fy + (player.y - D.fy) * k;
    if (!D.lastG || D.t - D.lastG > 0.025) { D.lastG = D.t; D.ghosts.push({ x: player.px, y: player.py, a: 0.55 }); }
    if (k >= 1) {
      player.dash = null; player.fx = player.x; player.fy = player.y; player.prog = 1;
      const m = D.m, S = ACTIVE.dash;
      if (!m.dead && adjacent(player, m)) {
        faceTo(m.x, m.y);
        useTool("tool_sword", () => { if (rollHit(m, 6)) { const [dmg, crit] = rollDmg(S.mult); hurtMob(m, dmg, crit, { stun: S.stun }); } else missMob(m); hitStop = Math.max(hitStop, 0.07); }, { prep: 0.01, strike: 0.06, rec: 0.22 });
      }
      player.ghosts = D.ghosts;
    }
  }
  // fúria abaixo de 30%: ataca mais rápido (mobs.js); com "enrage" nos dados, toca a folha, mantém a aura e invoca mais mortos
  function enrageMob(m) {
    const d = m.d, E = d.enrage || {}; m.enraged = true;
    log(`${d.name} entra em fúria e ataca mais rápido!`, "warn"); addFloat(m.px + 0.5, m.py - 2.2, "FÚRIA!", "#ff6b5a", 1.6, 18);
    if (E.row && ANIMS[d.spr] && ANIMS[d.spr].rows[E.row] && !(m.an && m.an.s === "special")) { m.an = { s: "enrage", t: 0, still: 0 }; m.atkT = Math.max(m.atkT, 2); if (SND.opts.shake) shake = Math.max(shake, 0.25); }
    if (E.summon && d.summon) bossSummon(m, E.summon, "Ergam-se todos!");
  }
  function bossSummon(m, n = 2, cry = "Levantem-se!") {
    if (n === 2) m.summoned = true;
    log(m.d.summonCry ? `${m.d.name} chama reforços!` : `${m.d.name} ergue ossos do chão!`, "warn");
    addFloat(m.px + 0.5, m.py - 2, m.d.summonCry || cry, "#c79bff", 2, 16); // rodada 78: grito próprio (Capataz Rasgo)
    burst(m.px + 0.5, m.py + 0.8, ["#b07aff", "#e0c8ff", "#000000"], 30, 4);
    for (let i = 0; i < n; i++) { const a = spawnMob(m.d.summon, m.reg, { x: m.x, y: m.y }, null, { temp: true, aggro: true, atkT: 3, summoner: m }); if (a) { a.hx = m.hx; a.hy = m.hy; if (RISES(a)) riseUp(a); } }
  }
  function pushCorpse(m) { // quadros de morte do Blender (ou a queda procedural) e depois fade; "life" tira o corpo da lista
    const d = m.d, DA = ANIMS[d.spr] && ANIMS[d.spr].rows.death;
    corpses.push({ spr: d.spr, scale: d.scale || 1, tint: d.tint, x: m.px, y: m.py, face: m.face, dir8: m.dir8, t: 0, squish: d.squish, dir: Math.sign(m.x - player.x) || (m.face > 0 ? 1 : -1),
      anim: !!DA, life: DA ? DA.frames / DA.fps + 0.6 : 0.8 });
  }
  function killMob(m) {
    const d = m.d;
    m.dead = true; m.respawnT = d.respawn || 12; m.bleed = null; player.target = null;
    if (d.deathFx) RENDER.playOnce(d.deathFx, m.px, m.py, { foot: true, hold: 4 }); // estilhaços ficam no chão e somem em fade
    const firstKill = !player.kills[m.type];
    player.kills[m.type] = (player.kills[m.type] || 0) + 1; emit("kill:" + m.type);
    player.stats.kills++; if (d.boss) { player.stats.bosses++; player.stats.bossTypes[m.type] = 1; }
    if (d.echo) { player.echo[m.type] = weekKey(); player.stats.echoes = (player.stats.echoes || 0) + 1; }
    if (d.echoHome && window.ValdoraDaily) { // rodada 85: sequência semanal do eco da Serpente
      const S = player.stats.serpentStreak = ValdoraDaily.echoStreak(player.stats.serpentStreak, weekKey()), extra = Math.round(d.coins[1] * S.bonus);
      if (extra) player.coins += extra; if (S.bar && !addItem("Barra estelar", 1)) dropItem("Barra estelar", 1, m.x, m.y);
      showToast(`Eco da Serpente: ${S.streak} semana${S.streak > 1 ? "s" : ""} seguida${S.streak > 1 ? "s" : ""}`, `${extra ? `+${extra} moedas de sequência` : "Volte na próxima semana para o bônus"}${S.bar ? " · barra estelar" : ""}`, "#bff6ff");
    }
    hitStop = Math.max(hitStop, d.boss ? 0.25 : 0.05);
    if (firstKill) { showToast("Nova criatura no bestiário", `${d.name} · +${d.lvl * 8} xp de Combate`, "#7dff9a"); setTimeout(() => player && gainXp("combate", d.lvl * 8), 0); }
    pushCorpse(m);
    burst(m.px + 0.5, m.py + 0.6, [d.color, "#ffffff", "#000000"], d.boss ? 50 : 18, d.boss ? 6 : 4);
    const coins = ri(...d.coins); player.coins += coins; hudDirty = true; SND.play("coin");
    addFloat(m.px + 0.5, m.py - 0.4, `+${coins} moedas`, "#f1c40f", 1.4, 14);
    const DL = player.daily; if (DL && DL.type === m.type && !DL.claimed && DL.have < DL.n && ++DL.have === DL.n) { log(`✔ Caçada do dia concluída: ${DL.n}x ${d.name}. Receba no quadro da vila.`, "gold"); SND.play("quest"); } // rodada 80
    if (firstKill) bestiaryCheck(); // rodada 80: recompensas do bestiário
    for (const b of player.bounties) if (b.type === m.type && b.have < b.n && ++b.have === b.n) { log(`✔ Caçada concluída: ${b.n}x ${d.name}. Receba no quadro da vila.`, "gold"); SND.play("quest"); }
    for (const [item, p, a = 1, b = a] of d.drops) {
      if (rand() >= p) continue;
      const q = ri(a, b), aff = ITEMS[item].slot && (d.boss || m.reg === "crypt") ? RULES.rollAffixes(rand() < (d.boss ? 0.45 : 0.25) ? 2 : 1, d.lvl >= 28 ? 1 : 0, rand) : undefined;
      dropItem(item, q, m.x, m.y, { x: m.px, y: m.py - 0.6 }, aff);
      player.seen["drop:" + m.type + ":" + item] = 1;
      if (isSpecial(item)) {
        const it = ITEMS[item], c = itemColor(item), tag = it.rarity ? RARITY[it.rarity].name.toUpperCase() : "RARO";
        log(`✦ ${tag}! ${d.name} deixou cair ${item}!`, "rare"); player.stats.rares++;
        addFloat(m.px + 0.5, m.py - 0.9, `${tag}: ${item}`, c, 2.4, 16);
        burst(m.px + 0.5, m.py + 0.5, [c, "#f1c40f", "#ffffff"], 30, 5); SND.play("rare");
      }
    }
    log(`${d.name} derrotado! +${coins} moedas.${groundItems.some((g) => g.x === m.x && g.y === m.y) ? " Clique nos espólios para pegar." : ""}`, d.boss ? "gold" : "");
    if (d.boss) showToast(`${d.name} derrotado!`, "Os espólios brilham no chão.", "#c79bff");
    checkAch();
    if (m.wave) emit("wave:" + m.wave); // rodada 78: onda no marco dos Campos
    if (m.temp) { mobs.splice(mobs.indexOf(m), 1); }
    if (d.boss || d.summonCry) for (const a of mobs.filter((x) => x.temp && !x.dead && (d.boss || x.summoner === m))) { // as invocações desabam junto com o chefe (rodada 78: e os goblins do Capataz fogem)
      a.dead = true; a.respawnT = 0; pushCorpse(a);
      burst(a.px + 0.5, a.py + 0.6, ["#e8e0c8", "#b07aff"], 10, 3);
    }
    save();
  }
  function mobAttack(m, heavy, slamAoE) {
    const d = m.d, st = combatStats();
    const pe = { heavy, slamAoE, hit: rand() < hitChance(d.atk + (heavy ? 6 : 0), st.def) };
    pe.dmg = heavy ? ri(Math.ceil(d.maxHit * 0.8), Math.ceil(d.maxHit * 1.6)) : ri(1, d.maxHit);
    if (ANIMS[d.spr] && !(m.an && m.an.s === "death")) { m.an = { s: "attack", t: 0, still: 0 }; m.pending = pe; } // dano sai no quadro de impacto
    else { m.lunge = 1; applyMobHit(m, pe); }
  }
  function applyMobHit(m, pe) {
    if (m.dead || player.deadT > 0) return;
    if (pe.pet) return petHurt(m, pe); // rodada 96
    if (pe.slamAoE) return slam(m);
    if (pe.heavy) fx.mark(m.px + 0.5 + Math.sign(player.x - m.x) * 0.85, m.py + 0.9 + Math.sign(player.y - m.y) * 0.85, 1.15); // rodada 68
    const dist = Math.abs(m.x - player.x) + Math.abs(m.y - player.y);
    if (dist !== 1) { addFloat(player.px + 0.5, player.py - 0.6, "esquivou!", "#9fe08a", 0.9, 13); return; } // saiu do alcance antes do impacto
    let blocked = false;
    if (pe.hit && player.style === "defensivo" && rand() < RULES.BLOCK.chance) { // passiva do Defensivo: bloqueio
      blocked = true; player.blockT = 0.22; pe.dmg = RULES.blockDmg(pe.dmg); addFloat(player.px + 0.5, player.py - 0.75, "aparou!", "#9fd0ff", 0.9, 13);
      const cx = (player.px + m.px) / 2, cy = (player.py + m.py) / 2 - 0.05; // ponto de contato (centro do quadro)
      if (!RENDER.playOnce("fx_spark_block", cx, cy)) fx.sparks(cx + 0.5, cy + 0.5, 8, ["#cfe6ff", "#ffffff"], 4);
    }
    if (pe.hit) {
      player.hp -= pe.dmg; player.flash = blocked ? 0.08 : 0.18; player.hitT = blocked ? 0 : 0.3; player.lastHurt = tickN; hudDirty = true;
      hitSplat(player.px + 0.5, player.py - 0.3, pe.dmg, "#ff5a4a"); SND.play("hurt"); if (SND.opts.shake) CAMERA.kick(player.px - m.px, player.py - m.py, pe.heavy ? 5 : 2.5);
      fx.sparks((player.px + m.px) / 2 + 0.5, (player.py + m.py) / 2 + 0.45, pe.heavy ? 12 : 6, ["#ff8a6a", "#ffffff"], 4);
      burst(player.px + 0.5, player.py + 0.5, ["#c0392b"], pe.heavy ? 14 : 5, 2.5);
      hitStop = Math.max(hitStop, pe.heavy ? 0.09 : 0.04);
      if (pe.heavy && SND.opts.shake) shake = 0.3;
      if (player.hp <= 0) return playerDied();
    } else addFloat(player.px + 0.5, player.py - 0.3, "bloqueou", "#9fd0ff", 0.8, 12);
    // rodada 105: não revida sozinho — o herói só luta com o monstro que o jogador escolheu (clique, Ctrl + clique ou Espaço)
  }
  function playerDied() { // toca a animação de morte e só então volta à vila
    if (player.deadT > 0) return;
    player.deadT = ANIMS[player.hero] ? 1.6 : 0.01; player.hp = 0; player.path = []; player.target = null; player.job = null; player.act = null; player.cast = null;
    for (const m of mobs) { m.aggro = false; m.pending = null; }
    SND.play("death"); hudDirty = true;
  }
  function respawnAfterDeath() {
    player.deadT = 0;
    leaveCrypt();
    const lost = Math.floor(player.coins * 0.1);
    player.coins -= lost;
    log(`☠ Você desmaiou e acordou na vila.${lost ? ` Perdeu ${lost} moedas.` : ""}`, "warn");
    player.stats.deaths = (player.stats.deaths || 0) + 1; // rodada 55: na segunda morte, a dica do estilo Defensivo (uma vez por save)
    if (player.stats.deaths >= 2 && player.style !== "defensivo" && !player.seen.defTip) { player.seen.defTip = 1; log(DEF_TIP, "tip", STYLES.defensivo.passive && STYLES.defensivo.passive.icon); }
    const RS = player.spawnStone && player.spawnStone !== "lumeira" && stoneOf(player.spawnStone) ? stoneSpot(stoneOf(player.spawnStone)) : SPAWN; // rodada 105: Pedra marcada
    Object.assign(player, { x: RS.x, y: RS.y, fx: RS.x, fy: RS.y, prog: 1, px: RS.x, py: RS.y, hp: maxHp(), path: [], target: null, goal: null, job: null });
    for (const m of mobs) m.aggro = false;
    hudDirty = true; save();
  }

  // rodada 104: visual do herói pelo que ele veste (js/outfit.js); refeito ao carregar e a cada troca
  function refreshOutfit() {
    const looks = [], e = player.equip, w = e.arma && ITEMS[e.arma.name];
    for (const k of Object.keys(e)) { const it = e[k] && ITEMS[e[k].name]; if (it && it.look) looks.push(it.look); }
    if (arrows()) looks.push(["quiver", null]); // escudo e orbe entram pelo look da própria peça
    looks.push(["tool", null]); // ferramenta das ações de coleta (machado, picareta, vara, foice, martelo, espeto)
    ValdoraOutfit.apply(player.hero, looks, !!(w && w.bow), ANIMS, SPR).then((ok) => { if (ok) hudDirty = true; });
  }
  function equip(i, quiet) {
    const s = player.inv[i], it = ITEMS[s.name], old = player.equip[it.slot];
    if (it.gear) { const g = GEAR[it.gear], t = g.tiers[it.tier]; if (lv(g.skill) < (t.req || 0)) { log(`${s.name} pede ${SKILLS[g.skill]} ${t.req}.`, "warn"); return; } }
    if (it.onlyHero && it.onlyHero !== player.hero) { // rodada 105: montante só o Guerreiro
      log(`${s.name} é arma de duas mãos do Guerreiro.`, "warn"); return;
    }
    const wNow = player.equip.arma && ITEMS[player.equip.arma.name];
    if (it.sec === "escudo" && wNow && wNow.twoH) { log(`Com o ${player.equip.arma.name} (duas mãos) não dá para usar escudo. Troque por uma espada de uma mão.`, "warn"); return; }
    if (it.sec && it.sec !== heroSec()) { // rodada 105: a secundária depende da classe
      const S = VD.SEC[heroSec()] || {}, h = HEROES.find((x) => x.id === player.hero) || {};
      log(`${s.name} é para o ${VD.SEC[it.sec].who}. A secundária do ${h.name} é ${(S.name || "outra").toLowerCase()}.`, "warn"); return;
    }
    if (it.ammo) { // rodada 104: o maço inteiro vai para a aljava (mesma flecha soma; outra volta para a mochila)
      player.inv[i] = null;
      if (old && old.name === s.name) old.n += s.n;
      else { player.equip.municao = { name: s.name, n: s.n }; if (old && !addItem(old.name, old.n || 1, old.aff, old.master)) dropItem(old.name, old.n || 1, player.x, player.y); }
      const q = player.equip.municao; log(`Aljava: ${q.n}x ${q.name}.`, "gold"); SND.play("pickup"); hudDirty = true; save(); refreshOutfit(); return;
    }
    if (s.n > 1) s.n--; else player.inv[i] = null;
    if (it.twoH && player.equip.municao && ITEMS[player.equip.municao.name].sec === "escudo") { // montante: o escudo sai da mão
      const sh = player.equip.municao; player.equip.municao = null;
      if (!addItem(sh.name, 1, sh.aff, sh.master)) dropItem(sh.name, 1, player.x, player.y, null, sh.aff);
      log(`${s.name} usa as duas mãos: o ${sh.name} foi para a mochila.`, "dim");
    }
    player.equip[it.slot] = { name: s.name, ...(s.aff ? { aff: s.aff } : {}), ...(s.master ? { master: 1 } : {}) };
    if (old && !addItem(old.name, 1, old.aff, old.master)) dropItem(old.name, 1, player.x, player.y, null, old.aff);
    const bt = it.gear ? gearEffect(it.gear, GEAR[it.gear].tiers[it.tier]) + (it.twoH ? `, +${it.bonus.dmg} dano · duas mãos` : "") : bonusText(accBonus(player.equip[it.slot]));
    if (quiet) log(`Trocou para ${accName(player.equip[it.slot])}.`, "dim");
    else { log(`Você equipou ${accName(player.equip[it.slot])}${bt ? ` (${bt})` : ""}.`, "gold"); SND.play("pickup"); }
    refreshOutfit();
    burst(player.px + 0.5, player.py + 0.3, [itemColor(s.name), "#ffffff"], 14, 2.5); hudDirty = true; save();
  }
  function unequip(slot) {
    const e = player.equip[slot]; if (!e) return;
    if (!addItem(e.name, e.n || 1, e.aff, e.master)) { log("Sua mochila está cheia. Guarde itens no cofre ou venda ao Bento.", "warn"); return; }
    player.equip[slot] = null; player.hp = Math.min(player.hp, maxHp()); log(`Você guardou ${accName(e)} na mochila.`, "dim"); hudDirty = true; save(); refreshOutfit();
  }
  // rodada 48: comida pronta (sem poções) e o aviso de comida acabando: fora da vila, depois da primeira refeição
  const foodCount = () => player.inv.reduce((n, s) => n + (s && ITEMS[s.name].heal && !s.name.startsWith("Poção") ? s.n : 0), 0);
  const foodLow = () => !!player.seen.ate && player.deadT <= 0 && !!player.region && player.region !== "town" && foodCount() <= 1;
  // rodada 48: comer interrompe o golpe em andamento (como andar); sem isso o golpe cobria os 0,5 s da animação de comer
  function stopForEat() { if (player.act && player.act.key !== "rod") { cancelAct(); player.cancelT = 0; } player.eatT = 0.5; }
  function eat(i) {
    const s = player.inv[i]; if (!s) return;
    const it = ITEMS[s.name];
    if (it.slot) return equip(i);
    if (it.buff) {
      const B = BUFFS[it.buff]; player.buffs[it.buff] = B.ticks; removeItem(s.name); SND.play("drink"); stopForEat();
      addFloat(player.px + 0.5, player.py - 0.6, B.name + "!", B.color, 1.4, 15); burst(player.px + 0.5, player.py + 0.3, [B.color, "#ffffff"], 14, 2.5);
      log(`Você bebeu ${s.name.toLowerCase()}: ${B.name} por ${B.ticks * TICK} s.`); hudDirty = true; return;
    }
    if (it.heal) {
      if (player.hp >= maxHp()) { log("Você já está com a vida cheia.", "dim"); return; }
      const before = player.hp; player.hp = Math.min(maxHp(), player.hp + it.heal);
      if (!s.name.startsWith("Poção")) player.seen.ate = 1;
      removeItem(s.name); player.actT = Math.max(player.actT, 2); stopForEat(); SND.play(s.name.startsWith("Poção") ? "drink" : "pickup"); // comer atrasa o próximo golpe
      addFloat(player.px + 0.5, player.py - 0.3, `+${player.hp - before}`, "#5fe07a", 1, 14);
      log(`${s.name.startsWith("Poção") ? "Você bebeu" : "Você comeu"} ${s.name.toLowerCase()} (+${player.hp - before} de vida).`);
    } else if (it.cook) log(`Asse ${s.name.toLowerCase()} numa fogueira para poder comer.`, "dim");
    else log(`${s.name}: vale ${it.price} moedas no Bento.`, "dim");
  }

  // ---------- Encomendas ----------
  function newOrder(exclude) {
    const have = new Set((player.orders || []).filter(Boolean).map((o) => o.item)); if (exclude) have.add(exclude);
    const pool = ORDER_POOL.filter((o) => lv(o.skill) >= o.req && !have.has(o.item));
    // rodada 25: pedidos do nível do jogador saem mais (peso 1 + req/4) e os antigos crescem com o nível (gosma e peles que sobram têm destino)
    let roll = rand() * pool.reduce((a, o) => a + 1 + o.req / 4, 0), base = pool[0] || ORDER_POOL[0];
    for (const o of pool) if ((roll -= 1 + o.req / 4) <= 0) { base = o; break; }
    const qty = Math.round(ri(...base.qty) * (1 + Math.min(2, Math.max(0, lv(base.skill) - base.req) / 10)));
    return { item: base.item, skill: base.skill, qty, big: qty > base.qty[1], coins: Math.round(qty * ITEMS[base.item].price * 1.8 + 8), xp: qty * (4 + base.req) };
  }
  function deliver(i) {
    const o = player.orders[i]; if (!o || count(o.item) < o.qty) return;
    removeItem(o.item, o.qty); player.coins += o.coins; hudDirty = true;
    log(`Encomenda entregue: ${o.qty}x ${o.item}. +${o.coins} moedas.`, "gold", "icon_order_done"); react(npc.merchant); // rodada 35: joinha do Bento
    gainXp(o.skill, o.xp); emit("trade");
    burst(player.px + 0.5, player.py + 0.4, ["#f1c40f", "#ffffff"], 16, 3);
    player.orders[i] = null; player.orders[i] = newOrder(o.item);
  }

  // ---------- Caçadas (quadro da vila) ----------
  // ecos semanais (rodada 22): o quadro de caçadas desperta uma versão mais forte de cada chefe, uma vitória por semana
  const weekKey = () => Math.floor((Date.now() / 864e5 + 3) / 7); // semanas começando na segunda-feira
  const daysToReset = () => Math.max(1, Math.ceil(7 - ((Date.now() / 864e5 + 3) % 7)));
  const APPEAR = 0.5; // segundos de fade do eco depois do quadro 4 da névoa
  let lastEcho = null; let lastNight = null;
  // rodada 58: tile andável mais perto numa região do seu nível (o "volte por aqui" do minimapa na primeira entrada em região perigosa)
  function safeSpot() {
    const cb = lv("combate"), ok = (x, y) => { if (!walkable(x, y)) return false; const R = REGIONS[regionAt(x, y)]; return !R.min || cb >= R.min; };
    for (let r = 1; r <= 40; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const x = player.x + dx, y = player.y + dy; if (inside(x, y) && ok(x, y)) return { x, y, until: player.playT + 12 };
    }
    return null;
  }
  const warnT = {}; // rodada 31: último aviso de região perigosa (no máximo 1 por minuto por região); rodada 54: _any = 15 s entre regiões diferentes
  const TIP_EVERY = 240; let tipT = TIP_EVERY; // rodada 25: dica do Ivo no registro a cada 4 min (em sequência, sem repetir)
  const awakeEcho = () => mobs.find((m) => m.d.echo && !m.dead) || null;
  const ECHOES = () => Object.entries(MOBS).filter(([, d]) => d.echo && (!d.echoHome || player.stats.bossTypes[d.echo])); // rodada 83: o eco da Serpente só depois de vencê-la
  function echoHtml() {
    const row = ValdoraDialogs.row;
    if (!(player.stats.bossTypes.boss && player.stats.bossTypes.boss_golem)) return `<p class="empty">${ASSETS.icon_echo_week ? `<img class="qicon" src="${ASSETS.icon_echo_week}" alt="">` : ""}Ecos semanais: vença o Senhor das Ruínas e o Golem Ancião para ouvir os ecos.</p>`;
    return `<div class="journal-h echo-h">${ASSETS.icon_echo_week ? `<img src="${ASSETS.icon_echo_week}" alt="">` : ""}Ecos semanais</div>` + ECHOES().map(([k, d]) => {
      const done = player.echo[k] === weekKey(), alive = mobs.some((m) => m.type === k && !m.dead);
      return row(`<img src="${ASSETS[d.spr]}" alt="" style="transform:scaleX(-1);filter:${d.tint}">`, `${esc(d.name)} <small>nv ${d.lvl} · vida ${d.hp}</small>`,
        `${esc(d.where.replace(" (eco semanal)", ""))} · Eco cristalizado garantido${d.echoHome && window.ValdoraDaily ? (() => { // rodada 86: sequência semanal da Serpente
          const nx = ValdoraDaily.echoStreak(player.stats.serpentStreak, weekKey()), S = player.stats.serpentStreak;
          return done ? ` · sequência: ${S ? S.streak : 0} semana(s)` : ` · sequência: ${nx.streak - 1} → ${nx.streak}${nx.bonus ? ` (+${Math.round(nx.bonus * 100)}% moedas)` : ""}${nx.bar ? " · barra estelar" : ""}`; })() : ""}`, null,
        done ? `<button disabled title="Volta na segunda-feira">em ${daysToReset()} d</button>` : `<button data-echo="${k}" ${alive ? "disabled" : ""}>${alive ? "Desperto" : "Despertar"}</button>`);
    }).join("");
  }
  // rodada 24: o eco se desfaz em névoa (fx_echo_fade) quando o jogador se afasta; o corpo some nos 3 primeiros quadros
  // rodada 46: "???" sobem da cabeça do monstro que desiste da perseguição (base do quadro no topo do sprite)
  function giveUp(m) { const img = SPR[m.d.spr], h = img ? img.height * (m.d.scale || 1) / TILE : 1; RENDER.playOnce("fx_mob_give_up", m.px, m.py + 1 - h - 1, { foot: true }); }
  function echoFade(m) {
    const F = ANIMS.fx_echo_fade; if (F) RENDER.playOnce("fx_echo_fade", m.px, m.py, { foot: true }); SND.play("echo_fade");
    corpses.push({ spr: m.d.spr, scale: m.d.scale || 1, tint: m.d.tint, x: m.px, y: m.py, face: m.face, t: 0, ghost: true, life: F ? 3 / F.rows.loop.fps : 0.4 });
    log(`${m.d.name} se desfaz em névoa. O quadro de caçadas pode despertá-lo de novo.`, "dim"); hudDirty = true;
  }
  function wakeEcho(k) {
    const d = MOBS[k]; if (!d || !d.echo || player.echo[k] === weekKey() || mobs.some((m) => m.type === k && !m.dead)) return;
    // rodada 83: a Serpente só vive na Fenda; o eco dela desperta na entrada, no mapa de cima
    const base = mobs.find((m) => m.type === d.echo) || (d.echoHome === "rift" && npc.rift && !inCrypt ? { dead: true, reg: regionAt(npc.rift.x, npc.rift.y), home: { x: npc.rift.x, y: npc.rift.y - 3, r: 2 } } : null); // ao norte da entrada, longe do Golem Ancião if (!base) return;
    if (!base.dead) { base.dead = true; base.respawnT = MOBS[d.echo].respawn || 120; base.respawnAt = null; } // o eco toma o lugar do chefe
    const home = base.home || { x: base.hx, y: base.hy }, e = spawnMob(k, base.reg, home, null, { temp: true, echo: true });
    if (!e) return;
    const S = ANIMS.fx_echo_summon; // rodada 23: coluna de névoa ciano; o eco aparece em fade a partir do quadro 4
    if (S) { RENDER.playOnce("fx_echo_summon", e.x, e.y, { foot: true }); e.appear = -4 / S.rows.loop.fps; }
    log(`O quadro estremece: ${d.name} desperta em ${d.where.replace(" (eco semanal)", "")}.`, "warn"); SND.play("echo_rise");
    showToast(d.name, "Desperto até você vencê-lo ou se afastar.", "#7fe8ff"); closeDlg();
  }
  function newBounty(exclude) {
    const cl = lv("combate"), have = new Set((player.bounties || []).filter(Boolean).map((b) => b.type)); if (exclude) have.add(exclude);
    let pool = Object.entries(MOBS).filter(([k, d]) => !d.noBounty && !have.has(k) && (d.boss ? cl >= d.lvl - 8 : d.lvl <= cl + 5 && d.lvl >= cl - 12));
    if (!pool.length) pool = Object.entries(MOBS).filter(([k, d]) => !d.boss && !d.noBounty && !have.has(k));
    const [type, d] = pool[Math.floor(rand() * pool.length)];
    const n = d.boss ? 1 : ri(4, 8);
    return { type, n, have: 0, coins: Math.round(d.boss ? d.lvl * 30 : n * d.lvl * 4 + 20), xp: Math.round(d.boss ? d.lvl * 25 : n * d.lvl * 3) };
  }
  // rodada 80: caçada do dia (js/daily.js) e recompensas do bestiário
  function dailyNow() { player.daily = DAILY.today(player.daily, DAILY.dayKey(), lv("combate"), MOBS); return player.daily; }
  function dailyHtml() {
    const D = dailyNow(), d = MOBS[D.type], k = 1 + DAILY.bonus((D.streak || 0) + 1), done = D.have >= D.n, nx = DAILY.extra((D.streak || 0) + 1);
    const sub = `${esc(d.where)} · sequência: ${D.streak || 0} dia${D.streak === 1 ? "" : "s"}${D.claimed ? "" : ` · bônus de hoje +${Math.round((k - 1) * 100)}%`}${nx && !D.claimed ? ` · prêmio: ${Object.entries(nx).map(([n, q]) => `${q}x ${n}`).join(", ")}` : ""}`;
    return `<div class="bank-head">Caçada do dia</div>` + ValdoraDialogs.row(`<img src="${ASSETS[d.spr]}" alt="" style="transform:scaleX(-1)${d.tint ? `;filter:${d.tint}` : ""}">`,
      `Derrote ${D.n}x ${esc(d.name)} <small>(${Math.min(D.have, D.n)}/${D.n})</small>`, sub, D.claimed ? "✔" : Math.round(D.coins * k),
      `<button data-daily="1" ${done && !D.claimed ? "" : "disabled"}>${D.claimed ? "Amanhã tem outra" : "Receber"}</button>`) + `<div class="bank-head">Pedidos da guarda</div>`;
  }
  function claimDaily() {
    const r = DAILY.claim(dailyNow()); if (!r) return;
    player.coins += r.coins; rewardCombatXp(r.xp); for (const [n, q] of Object.entries(r.items || {})) { if (!addItem(n, q)) dropItem(n, q, player.x, player.y); }
    showToast("Caçada do dia!", `+${r.coins} moedas · sequência de ${r.streak} dia${r.streak > 1 ? "s" : ""}`, "#ffd84a"); SND.play("rare"); hudDirty = true;
    log(`★ Caçada do dia: +${r.coins} moedas, ${r.xp} xp de Combate${r.items ? `, ${Object.entries(r.items).map(([n, q]) => `${q}x ${n}`).join(", ")}` : ""} (sequência: ${r.streak}).`, "gold"); save();
  }
  function bestiaryCheck() {
    const got = player.bestiary || (player.bestiary = []);
    for (const B of DAILY.due(player.kills, got, MOBS)) {
      got.push(B.n); player.coins += B.coins; for (const [n, q] of Object.entries(B.items || {})) { if (!addItem(n, q)) dropItem(n, q, player.x, player.y); }
      if (B.item) { const aff = RULES.rollAffixes(B.aff || 0, 0, rand); if (!addItem(B.item, 1, aff)) dropItem(B.item, 1, player.x, player.y, null, aff); }
      showToast(`Bestiário: ${B.n} criaturas`, `+${B.coins} moedas e um prêmio do caçador`, "#7dff9a"); log(`★ Bestiário com ${B.n} criaturas: +${B.coins} moedas e prêmio.`, "gold"); hudDirty = true;
    }
  }
  function claimBounty(i) {
    const b = player.bounties[i]; if (!b || b.have < b.n) return;
    player.coins += b.coins; hudDirty = true; SND.play("coin");
    log(`Recompensa da caçada: +${b.coins} moedas.`, "gold"); rewardCombatXp(b.xp);
    burst(player.px + 0.5, player.py + 0.4, ["#f1c40f", "#ffffff"], 16, 3);
    player.bounties[i] = null; player.bounties[i] = newBounty(b.type);
  }

  // ---------- Janelas: loja, guarda, cofre, fornalha, bigorna, quadro ----------
  const DLG = ValdoraDialogs.DLG; // títulos e falas das janelas (js/dialogs.js)
  let dlg = null; // { kind, obj, tab }
  // rodada 105: a janela abre embaixo do cartão do personagem e acima do registro; sem espaço ali, abre ao lado do cartão.
  // Nunca cobre o cartão, o registro nem o painel da direita.
  function placeDlg() {
    const d = $("dlg"); if (d.hidden) return;
    const z = parseFloat(getComputedStyle(d).zoom) || 1, card = $("me-card").getBoundingClientRect(), logR = $("log").getBoundingClientRect();
    const hud = $("hud") && $("hud").getBoundingClientRect(), right = hud && hud.width ? hud.left : innerWidth;
    const lz = parseFloat(getComputedStyle($("log")).zoom) || 1, logTop = logR.bottom - (parseFloat(getComputedStyle($("log")).maxHeight) || 168) * lz; // altura máxima do registro
    const below = logTop - 8 - (card.bottom + 8);
    let top, left, maxH;
    if (below >= 260) { top = card.bottom + 8; left = card.left; maxH = below; }
    else { top = card.top; left = card.right + 10; maxH = logTop - 8 - top; } // ao lado do cartão
    d.style.top = top / z + "px"; d.style.left = left / z + "px"; d.style.maxHeight = Math.max(200, maxH) / z + "px";
    d.style.width = `min(${d.classList.contains("wide") ? 560 : 360}px, ${Math.max(240, right - left - 12) / z}px)`;
  }
  addEventListener("resize", () => placeDlg());
  function openDlg(kind, obj) {
    dlg = { kind, obj, tab: kind === "shop" && questMark("shop") === "?" ? "orders" : (DLG[kind].tabs || [[null]])[0][0] }; // missão do Bento pronta para entregar abre direto nas encomendas (missão nova não: o tutorial manda vender)
    if (kind === "guard") emit("talk");
    $("dlg").hidden = false; $("dlg").classList.toggle("wide", kind === "char"); renderDlg(); placeDlg();
  }
  function closeDlg() { dlg = null; $("dlg").hidden = true; }
  // rodada 54: o desenho da janela (título, abas, fala e corpo) mora em js/dialogs.js; os cliques continuam aqui
  function renderDlg() { DLG_VIEW.render(dlg); }
  // rodada 56/57: o que cada botão faz mora em js/dlgactions.js (testado em tests.html com um jogador de mentira)
  const DLG_ACT = ValdoraDlgActions.create({ player: () => player, dlg: () => dlg, npc: () => npc, shrine: () => SHRINE_RT, dirty: () => { hudDirty = true; },
    sell: (n, q) => sell(n, q), buy: (n) => buy(n), deliver: (i) => deliver(i), newOrder: (o) => newOrder(o), moveStack: (f, i, t) => moveStack(f, i, t),
    takeFx: (o, n) => takeFx(o, n), storeFx: (o, n) => storeFx(o, n), log: (m, c, i) => log(m, c, i), craft: (n) => craft(n), QUEST, react: (o) => react(o), rand, SND,
    addFloat: (...a) => addFloat(...a), claimBounty: (i) => claimBounty(i), wakeEcho: (k) => wakeEcho(k), newBounty: (t) => newBounty(t), emit: (e) => emit(e), accName,
    close: () => closeDlg(), scene: (id, cb) => SCENE.play(id, cb), travel: (k) => CAMPAIGN_RT.travel(k), alchemy: (n) => brew(n), claimDaily: () => claimDaily(), petName: (v) => petRename(v), petStay: () => petStay(), home: (k, v) => homeAct(k, v), stone: (k, v) => stoneAct(k, v) }); // rodada 78/79; rodada 96: nome do filhote
  $("dlg").addEventListener("click", (e) => {
    if (!dlg) return;
    const b = e.target.closest("button, .slot[data-dep], .slot[data-wd]"); if (!b) return;
    const ds = b.dataset; SND.play("ui");
    if (DLG_VIEW.uiClick(b, dlg)) return; // rodada 55: fechar e trocar de aba (js/dialogs.js); daqui para baixo, só o que mexe no jogo
    if (DLG_ACT.run(ds) === "stop") return; // o eco desperta e fecha a janela: sem redesenhar
    renderDlg(); save();
  });
  // rodada 79: alquimia da Juna (tônicos), depois de "Raízes inquietas"; XP em Culinária
  function alchemyHtml() {
    if (!CAMPAIGN_RT.alchemyOpen()) return "";
    return `<div class="bank-head">Alquimia da Juna</div>` + Object.entries(VD.ALCHEMY).map(([n, R]) => { const ok = hasMats(R.mats) && lv("culinaria") >= R.lvl;
      return `<div class="row">${iconImg(n)}<span class="grow">${esc(n)}<br><small>${esc(R.desc)} · ${esc(matsText(R.mats))}${lv("culinaria") < R.lvl ? ` · Culinária ${R.lvl}` : ""}</small></span><button data-alch="${esc(n)}" ${ok ? "" : "disabled"}>Preparar</button></div>`; }).join("");
  }
  function brew(name) {
    const R = VD.ALCHEMY[name]; if (!R || !CAMPAIGN_RT.alchemyOpen() || lv("culinaria") < R.lvl || !hasMats(R.mats)) return;
    if (!canAdd(name)) { log("Sua mochila está cheia.", "warn"); return; }
    for (const [k, v] of Object.entries(R.mats)) removeItem(k, v);
    addItem(name); gainXp("culinaria", R.xp); SND.play("drink"); log(`A Juna resmunga, mas confere: ${name} pronto.`, "gold");
    if (npc.herb) burst(npc.herb.x + 0.5, npc.herb.y + 0.4, ["#8fe08a", "#ffffff"], 12, 2.5);
  }
  function craft(name) {
    const r = CRAFT[name];
    if (lv("artesanato") < r.lvl || !hasMats(r.mats) || (r.bag && player.bags.includes(name)) || (r.req && !player.bags.includes(r.req))) return;
    for (const [k, n] of Object.entries(r.mats)) removeItem(k, n);
    if (r.bag) {
      player.bags.push(name); for (let i = 0; i < r.bag; i++) player.inv.push(null);
      showToast(`${name} pronta!`, `A mochila agora tem ${player.inv.length} espaços.`, "#7dff9a");
    } else if (!addItem(name, r.n || 1)) dropItem(name, r.n || 1, player.x, player.y);
    useTool("hammer"); SND.play("clang"); gainXp("artesanato", r.xp);
    burst(player.px + 0.5, player.py + 0.3, ["#f1c40f", "#ffffff", "#c97a3a"], 16, 3);
    log(`Você criou: ${name}.`, "gold"); hudDirty = true; save();
  }
  // rodada 42: fx_item_store sobre a tampa do baú + o ícone do item encolhendo e subindo até o centro nos quadros 0–3
  const stores = [];
  function storeFx(o, item) {
    const cx = o.x + (o.w || 1) / 2 - 0.5, cy = o.y - 0.15; RENDER.playOnce("fx_item_store", cx, cy);
    const img = SPR[ITEMS[item].icon]; if (img) stores.push({ img, x: cx, y: cy, t: 0 });
  }
  function takeFx(o, item) { // rodada 43: fx_item_take abre da tampa; a comida cresce de 14% para 70% e desce nos quadros 1–4
    const cx = o.x + (o.w || 1) / 2 - 0.5, cy = o.y - 0.15; RENDER.playOnce("fx_item_take", cx, cy);
    const img = SPR[ITEMS[item].icon]; if (img) stores.push({ img, x: cx, y: cy, t: 0, take: true });
  }
  function drawStores(dt) {
    for (let i = stores.length - 1; i >= 0; i--) {
      const s = stores[i]; s.t += dt;
      if (s.take) { // retirar: começa no quadro 1 e termina no 4
        const k = (s.t - 1 / 12) / (4 / 12); if (k >= 1) { stores.splice(i, 1); continue; } if (k < 0) continue;
        const sz = TILE * (0.14 + 0.56 * k), px = (s.x + 0.5) * TILE - cam.x, py = (s.y + 0.5) * TILE - cam.y + TILE * 0.45 * k;
        ctx.globalAlpha = 0.5 + 0.5 * k; ctx.drawImage(s.img, px - sz / 2, py - sz / 2, sz, sz); ctx.globalAlpha = 1; continue;
      }
      const k = Math.min(1, s.t / (4 / 12)); if (k >= 1) { stores.splice(i, 1); continue; }
      const sz = TILE * 0.7 * (1 - 0.8 * k), px = (s.x + 0.5) * TILE - cam.x, py = (s.y + 0.5) * TILE - cam.y + TILE * 0.45 * (1 - k);
      ctx.globalAlpha = 1 - 0.5 * k; ctx.drawImage(s.img, px - sz / 2, py - sz / 2, sz, sz); ctx.globalAlpha = 1;
    }
  }
  function applyBankFilter() { DLG_VIEW.applyBankFilter(dlg); } // rodada 43: filtro do cofre; rodada 55: ele e o campo de texto moram em js/dialogs.js


  function moveStack(from, i, to) {
    const s = from[i]; if (!s) return;
    if (!addTo(to, s.name, s.n, s.aff)) { log(to === player.bank ? "O cofre está cheio." : "Sua mochila está cheia.", "warn"); return; }
    from[i] = null; hudDirty = true;
  }
  function sell(name, n) {
    const have = count(name), q = Math.min(have, n); if (!q) return;
    const gain = q * ITEMS[name].price;
    removeItem(name, q); player.coins += gain; hudDirty = true;
    log(`Vendeu ${q}x ${name} por ${gain} moedas.`); SND.play("coin"); emit("trade");
  }
  function buy(k) {
    if (SHOP_ITEMS.includes(k)) {
      const p = ITEMS[k];
      if (player.coins < p.buy || !canAdd(k)) return;
      player.coins -= p.buy; addItem(k, p.buyN || 1); log(`Comprou: ${p.buyN ? p.buyN + "x " : ""}${k}.`); SND.play("coin"); return;
    }
    const it = ITEMS[k]; if (!it || !it.gear || !it.buy || player.coins < it.buy || !canAdd(k)) return; // rodada 104: a peça vai para a mochila
    player.coins -= it.buy; addItem(k); hudDirty = true; SND.play("coin");
    log(`Comprou: ${k}. Clique nela na mochila para equipar.`, "gold");
    burst(player.px + 0.5, player.py + 0.4, ["#f1c40f", "#ffffff"], 16, 3);
  }
  const MASTER_TEXT = { espada: "+1 acerto e +1 dano", armadura: "+2 defesa" };
  const gearName = (k) => { const e = gearItem(k); return (e ? e.name : tier(k).name) + (e && e.master ? " ★" : ""); };
  const gearEffect = (k, t) => k === "espada" ? `+${t.acc} acerto, +${t.dmg} dano` : k === "armadura" ? `+${t.def} defesa` : `+${t.bonus * 8}% de chance de coleta`;
  // telas da fornalha, da bigorna e do artesanato (js/crafting.js)
  const SHRINE = ValdoraShrine;
  const SHOP = ValdoraShop.create({ homeShop: () => homeShop(), player: () => player, count, lv, gearEffect, questHtml: (g) => questHtml(g), TICK });
  const CRAFTING = ValdoraCrafting.create({ player: () => player, lv, count, hasMats, matsText, gearEffect });
  const DLG_VIEW = ValdoraDialogs.create({ player: () => player, SHOP, CRAFTING, SHRINE: ValdoraShrine, questHtml: (g) => questHtml(g), echoHtml: () => echoHtml(), combatStats: () => combatStats(),
    tier, masterBadge, gearEffect, totalLevel, lv, rand, BANK_SLOTS, TICK, close: () => closeDlg(), dlg: () => dlg, // rodada 54/55
    dailyHtml: () => dailyHtml(), markerView: (o) => CAMPAIGN_RT.markerView(o), travelHtml: (k) => CAMPAIGN_RT.travelHtml(k), alchemyHtml: () => alchemyHtml(), petDlg: () => petDlg(), homeDlg: () => homeDlg(), stoneDlg: () => stoneDlg() }); // rodada 78/79; rodada 96: filhote

  // ---------- HUD ----------
  let hudDirty = true, hudTab = "inv";
  for (const b of document.querySelectorAll("#panel .tabs button")) b.onclick = () => { hudTab = b.dataset.tab; hudDirty = true; };
  $("quest").onclick = () => { hudTab = "journal"; hudDirty = true; };
  // painel lateral (js/hud.js)
  const HUD = ValdoraHud.create({ QUEST, TICK, echo: () => awakeEcho(), combatStats: () => combatStats(), gearName: (k) => gearName(k), masterBadge: (k) => masterBadge(k), maxHp: () => maxHp(),
    tier: (k) => tier(k), totalLevel: () => totalLevel(), player: () => player, tab: () => hudTab, inCrypt: () => inCrypt, rank: () => ValdoraShrine.rankOf(player.offered || 0),
    foodCount: () => foodCount(), foodLow: () => foodLow(), petView: () => petView() });
  $("player-info").addEventListener("click", (e) => { if (e.target.closest(".petline")) { SND.play("ui"); openDlg("pet"); } }); // rodada 96
  function updateHud() { hudDirty = false; HUD.render(); }
  function dropSlot(i) { // larga a pilha no chão (peças com afixo continuam com os afixos)
    const s = player.inv[i]; if (!s) return;
    if (ITEMS[s.name].quest) { log(`${s.name} é item de missão: melhor não largar no chão.`, "dim"); return; } // rodada 78
    player.inv[i] = null; hudDirty = true; dropItem(s.name, s.n, player.x, player.y, null, s.aff);
    log(`Você largou ${s.n}x ${accName(s)} no chão.`, "dim");
  }
  // celular: tocar num item abre um menu curto (usar/equipar ou largar), já que não há clique direito
  const invMenu = document.createElement("div"); invMenu.id = "invmenu"; invMenu.hidden = true; document.body.appendChild(invMenu);
  const closeInvMenu = () => { invMenu.hidden = true; invMenu.dataset.i = ""; };
  function openInvMenu(i, el) {
    const s = player.inv[i]; if (!s) return;
    const it = ITEMS[s.name], use = it.slot ? "Equipar" : it.heal ? "Comer" : it.buff ? "Beber" : null, r = el.getBoundingClientRect();
    invMenu.innerHTML = `<b>${esc(accName(s))}${s.n > 1 ? ` <small>x${s.n}</small>` : ""}</b>${use ? `<button data-act="use">${ASSETS.icon_use ? `<img src="${ASSETS.icon_use}" alt="">` : ""}${use}</button>` : ""}<button data-act="drop">${ASSETS.icon_drop ? `<img src="${ASSETS.icon_drop}" alt="">` : ""}Largar no chão</button><button data-act="close">Cancelar</button>`;
    invMenu.dataset.i = i; invMenu.hidden = false;
    invMenu.style.left = Math.max(6, Math.min(innerWidth - invMenu.offsetWidth - 6, r.left - invMenu.offsetWidth - 6)) + "px";
    invMenu.style.top = Math.max(6, Math.min(innerHeight - invMenu.offsetHeight - 6, r.top)) + "px";
  }
  invMenu.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]"), i = +invMenu.dataset.i; if (!b) return;
    if (b.dataset.act === "use") eat(i); else if (b.dataset.act === "drop") dropSlot(i);
    closeInvMenu();
  });
  document.addEventListener("pointerdown", (e) => { if (!invMenu.hidden && !e.target.closest("#invmenu") && !e.target.closest("#tab-inv .slot")) closeInvMenu(); });
  $("tab-inv").addEventListener("click", (e) => {
    if (e.target.closest(".craft-btn")) { SND.play("ui"); return openDlg("craft", null); }
    const s = e.target.closest(".slot[data-i]"); if (!s) return;
    if (e.pointerType === "touch") return openInvMenu(+s.dataset.i, s);
    eat(+s.dataset.i);
  });
  $("tab-inv").addEventListener("contextmenu", (e) => { // clique direito: larga a pilha no chão
    const el = e.target.closest(".slot[data-i]"); if (!el) return;
    e.preventDefault(); dropSlot(+el.dataset.i);
  });
  $("tab-combat").addEventListener("click", (e) => {
    const u = e.target.closest("[data-unequip]"); if (u) return unequip(u.dataset.unequip);
    if (e.target.closest(".char-btn")) { SND.play("ui"); return openDlg("char", null); }
    const b = e.target.closest("button[data-style]"); if (!b) return;
    player.style = b.dataset.style; hudDirty = true; log(`Estilo de combate: ${STYLES[player.style].name}.`, "dim");
  });

  // ---------- Minimapa ----------
  // minimapa e luzes (js/overlay.js)
  const OVERLAY = ValdoraOverlay.create({ mtn: () => (inCrypt ? null : MTN), canvas, cam, ctx, TILE, W, H, LIGHT, isSpecial, state: () => ({ map, objects, mobs, npc, player, groundItems, inCrypt, goals: CAMPAIGN_RT.objectives() }) });
  const { buildMinimap, drawMinimap, drawLights } = OVERLAY;
  // rodada 78: campanha no mundo (js/campaign.js) e cenas de diálogo (js/scene.js)
  const VR = { t: -1e9, v: 0 };
  const SCENE = ValdoraScene.create({ heroName: () => player.name, heroKey: () => player.hero, sound: (k) => SND.play(k),
    reduced: () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    onStart: () => { closeDlg(); player.path = []; player.target = null; player.goal = null; }, onEnd: () => { last = performance.now(); hudDirty = true; } });
  const CAMPAIGN_RT = ValdoraCampaign.create({ TILE, ctx, cam, SPR, player: () => player, mobs: () => mobs, npc: () => npc, inCrypt: () => inCrypt, QUEST, count,
    spawnMob: (...a) => spawnMob(...a), rise: (m) => { if (RISES(m)) riseUp(m); else RENDER.playOnce(ANIMS.fx_dust_slam_light ? "fx_dust_slam_light" : "fx_dust_slam", m.x, m.y + 0.3, { ground: true }); },
    burst: (...a) => burst(...a), sparks: (x, y) => fx.sparks(x, y, 3, ["#7fe8ff", "#ffffff"], 1.5), float: (x, y, t, c) => addFloat(x, y, t, c, 1.6, 13),
    shake: () => { if (SND.opts.shake) shake = Math.max(shake, 0.16); }, sound: (k) => SND.play(k), log: (m, c) => log(m, c), announce: (a, b) => announce(a, b), emit: (e) => emit(e),
    give: (n, q) => { if (!addItem(n, q)) dropItem(n, q, player.x, player.y); }, scene: (id, cb) => SCENE.play(id, cb), dirty: () => { hudDirty = true; },
    maxHp: () => maxHp(), tickN: () => tickN, regionAt: (x, y) => regionAt(x, y), night: () => LIGHT.darkness(player.dayT) > 0.4,
    viewRight: () => { const now = performance.now(); if (now - VR.t > 500) { VR.t = now; // borda esquerda do painel lateral, em pixels do canvas (medida 2x por segundo)
      const h = $("hud").getBoundingClientRect(), c = canvas.getBoundingClientRect(); VR.v = h.width && h.left > c.left + c.width * 0.5 ? (h.left - c.left) * canvas.width / c.width : canvas.width; }
      return Math.min(VR.v || canvas.width, canvas.width); },
    freeNear: (x0, y0, r) => { for (let k = 0; k <= r; k++) for (let dy = -k; dy <= k; dy++) for (let dx = -k; dx <= k; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === k && walkable(x0 + dx, y0 + dy)) return { x: x0 + dx, y: y0 + dy }; return null; },
    removeItem: (n, q) => removeItem(n, q),
    teleport: (x, y) => { Object.assign(player, { x, y, fx: x, fy: y, px: x, py: y, prog: 1, path: [], goal: null, target: null, job: null, dir: "down" }); CAMERA.reset(); hudDirty = true; save(); } });
  // ---------- Partículas e textos flutuantes (js/fx.js) ----------
  const fx = ValdoraFX.create(TILE, rand), { burst, ember, clickFx, addFloat, hitSplat } = fx;
  const AMBIENT = ValdoraAmbient.create({ TILE, rand: Math.random }); // rodada 66 (js/ambient.js): enfeite, fora do aleatório do jogo
  const dustAtFeet = (n = 4) => fx.dust(player.px + 0.5, player.py + 0.95, n);

  // ---------- Loop ----------
  let running = false, last = 0, tickAcc = 0, tickN = 0, saveT = 0, miniT = 0, skillT = 0, shake = 0, hitStop = 0;
  // ---------- Eventos de mundo: invasão goblin e cardume dourado ----------
  // eventos do mundo (js/events.js)
  const EVENTS = ValdoraEvents.create({ spawnMob: (...a) => spawnMob(...a), announce: (...a) => announce(...a), log: (m, c) => log(m, c), showToast: (...a) => showToast(...a),
    addItem: (...a) => addItem(...a), dropItem: (...a) => dropItem(...a), gainXp: (...a) => gainXp(...a), checkAch: () => checkAch(), SND, LIGHT, rand,
    player: () => player, mobs: () => mobs, resources: () => resources });
  const updateEvent = (dt) => EVENTS.updateEvent(dt);
  function announce(title, sub, icon) {
    $("banner").innerHTML = `${icon && ASSETS[icon] ? `<img class="bicon" src="${ASSETS[icon]}" alt="">` : ""}${UI.titleHTML(title)}<small>${esc(sub)}</small>`; $("banner").classList.remove("show"); void $("banner").offsetWidth; $("banner").classList.add("show");
    SND.play("warn"); log(`⚑ ${title} ${sub}`, "warn"); // rodada 67: sem o aviso no canto, que repetia a faixa
  }
  // balões de fala dos NPCs e notas do bardo
  let chatT = 6, bubble = null;
  function updateChatter(dt) {
    if (bubble && (bubble.t -= dt) <= 0) bubble = null;
    if (inCrypt) return;
    if (npc.bard && rand() < dt * 0.8) ember(npc.bard.x + 0.6, npc.bard.y - 0.6, ["#f5e27a", "#fff2c0"]);
    if ((chatT -= dt) > 0) return;
    chatT = 9 + rand() * 9;
    const near = ["merchant", "guard", "bard"].map((k) => [k, npc[k]]).filter(([, o]) => o && Math.abs(o.x - player.x) + Math.abs(o.y - player.y) < 12);
    if (!near.length) return;
    const [k, o] = near[Math.floor(rand() * near.length)], lines = CHATTER[k];
    bubble = { o, text: lines[Math.floor(rand() * lines.length)], t: 4 };
  }
  function drawBubble() {
    if (!bubble) return;
    const o = bubble.o, img = SPR[o.spr]; if (!img) return;
    ctx.font = "12px 'Valdora Pixel', 'Courier New', monospace"; ctx.textAlign = "center";
    if (!bubble.lines) { // quebra a fala em linhas de até 230 px (frases longas não vazam do balão)
      const L = [""]; for (const wd of bubble.text.replace(/♪/g, "").trim().split(/\s+/)) { const t = L[L.length - 1] ? L[L.length - 1] + " " + wd : wd; if (ctx.measureText(t).width > 230 && L[L.length - 1]) L.push(wd); else L[L.length - 1] = t; }
      bubble.lines = L; bubble.w = Math.max(...L.map((l) => ctx.measureText(l).width)) + 14;
    }
    const n = bubble.lines.length, w = bubble.w, bh = 8 + n * 13, x = (o.x + 0.5) * TILE - cam.x, y = (o.y + 1) * TILE - cam.y - img.height - 16;
    ctx.globalAlpha = Math.min(1, bubble.t * 2);
    ctx.fillStyle = "#f3e6c8"; ctx.strokeStyle = "#1b1610"; ctx.lineWidth = 2;
    ctx.fillRect(x - w / 2, y - bh, w, bh); ctx.strokeRect(x - w / 2, y - bh, w, bh);
    ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x, y + 6); ctx.lineTo(x + 5, y); ctx.fill();
    ctx.fillStyle = "#1b1610"; bubble.lines.forEach((l, i) => ctx.fillText(l, x, y - bh + 14 + i * 13));
    ctx.globalAlpha = 1;
  }
  function loop(now) {
    if (!running) return;
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (SCENE.active()) SCENE.update(dt); // rodada 78: cena de diálogo pausa o mundo
    else if (hitStop > 0) hitStop -= dt; else update(dt); // pausa de impacto em críticos e abates
    draw(now / 1000);
    if (hudDirty) updateHud();
    if ((miniT -= dt) <= 0) { miniT = 0.2; drawMinimap(); updateFHint(); drawMap(); }
    if ((skillT -= dt) <= 0) { skillT = 0.08; updateSkillbar(); }
    requestAnimationFrame(loop);
  }

  function nextDir() { // direção do próximo passo (teclado ou caminho), sem andar
    const kd = keyDir(); if (kd) return kd;
    if (!player.path.length) return null;
    const [nx, ny] = player.path[0];
    return window.DIR_AT(nx - player.x, ny - player.y);
  }
  function cancelAct() {
    const a = player.act; player.act = null; if (!a) return;
    if (!a.fired) { // ainda na preparação: o golpe não sai; habilidades devolvem quase toda a recarga
      player.cancelT = 0.125; if (a.key === "spin" || a.key === "smash") player.cd[a.key] = Math.min(player.cd[a.key], 1.5);
    }
  }
  function nextStep() {
    if (player.deadT > 0) return false;
    const kd = keyDir(), prevDir = player.dir;
    let nx, ny;
    if (kd) {
      if (player.act && player.act.key !== "rod") cancelAct(); // apertar uma direção cancela o golpe, mesmo contra um obstáculo
      player.path = []; player.target = null; player.goal = null; player.job = null; player.dir = kd;
      const [vx, vy] = keyVec(); nx = player.x + vx; ny = player.y + vy;
      if (!canStep(player.x, player.y, nx, ny)) { // diagonal bloqueada: escorrega pelo lado que estiver livre
        if (vx && vy && canStep(player.x, player.y, player.x + vx, player.y)) ny = player.y;
        else if (vx && vy && canStep(player.x, player.y, player.x, player.y + vy)) nx = player.x;
        else return false;
      }
    } else if (player.path.length) {
      [nx, ny] = player.path[0];
      if (!canStep(player.x, player.y, nx, ny) || Math.max(Math.abs(nx - player.x), Math.abs(ny - player.y)) !== 1) { // bloqueado: recalcula
        player.path = player.goal ? findPath(player.x, player.y, player.goal) || [] : [];
        if (!player.path.length) return false;
        [nx, ny] = player.path[0];
      }
      player.path.shift();
      faceTo(nx, ny);
    } else return false;
    player.stepLen = nx !== player.x && ny !== player.y ? Math.SQRT2 : 1; // rodada 104: passo diagonal é mais comprido
    player.fx = player.x; player.fy = player.y; player.x = nx; player.y = ny;
    if (player.dir !== prevDir) dustAtFeet(3); // poeira ao mudar de direção correndo
    return true;
  }

  // rodada 106: só o que está na área do minimapa (e um pouco além) pensa e se anima; o resto do continente espera parado
  const ACTIVE_X = 62, ACTIVE_Y = 48;
  const activeMob = (m) => m.aggro || m.temp || inCrypt || (Math.abs(m.x - player.x) <= ACTIVE_X && Math.abs(m.y - player.y) <= ACTIVE_Y);
  function update(dt) {
    indexMobs();
    AMBIENT.update(dt, cam, canvas.width, canvas.height, player.region, LIGHT.darkness(player.dayT), inCrypt); // rodada 66: vento e vagalumes
    CAMPAIGN_RT.update(dt); // rodada 78: onda no marco, Capataz e viagem
    SHRINE_RT.update(dt); // santuário: velas, moedas, chama votiva e faíscas da Lenda (js/shrine.js)
    // movimento contínuo do jogador (tile a tile, com sobra de tempo aproveitada)
    // velocidade constante entre tiles, com arrancada e frenagem suaves; passos encadeados sem parar
    if (player.dash) updateDash(dt);
    const wasMoving = !player.dash && player.prog < 1;
    if (player.turnT > 0) player.turnT -= dt;
    let rate = 1;
    if (wasMoving) {
      player.moveT += dt;
      if (player.moveT < 0.14) rate = 0.62 + 0.38 * ease.outQuad(player.moveT / 0.14);
      if (!player.path.length && !keyDir()) rate *= 1 - 0.42 * player.prog; // último passo: desacelera
      player.prog += rate * dt / STEP / (player.stepLen || 1); player.dist += rate * dt / STEP;
    } else if (player.turnT <= 0) player.prog = 1;
    if (player.prog >= 1 && player.turnT <= 0 && !player.dash) { // sem andar durante a investida
      const over = wasMoving ? player.prog - 1 : 0;
      const nd = !wasMoving && nextDir();
      if (nd && nd !== player.dir) { player.dir = nd; player.turnT = 0.07; dustAtFeet(2); player.prog = 1; } // vira antes de andar
      else if (nextStep()) {
        if (player.act && player.act.key !== "rod") cancelAct(); // andar cancela a preparação (ou a finalização) do golpe
        if (!wasMoving) { player.moveT = 0; dustAtFeet(4); }
        player.prog = Math.min(over, 0.99); SND.play("step");
      } else { player.prog = 1; player.moveT = 0; }
    }
    if (!player.dash) { player.px = player.fx + (player.x - player.fx) * player.prog; player.py = player.fy + (player.y - player.fy) * player.prog; }
    const moving = player.prog < 1 && !player.dash;
    // rodada 105: pega o que estiver no chão ao passar por cima (no meio do passo), não só ao parar no tile
    const tileKey = player.x + "," + player.y;
    if ((moving ? player.prog >= 0.5 : wasMoving) && player.pickTile !== tileKey && groundItems.some((g) => g.x === player.x && g.y === player.y)) {
      player.pickTile = tileKey; pickupAt(player.x, player.y, false);
    } else if (player.pickTile && player.pickTile !== tileKey && !moving) player.pickTile = null;
    player.flash = Math.max(0, player.flash - dt); player.hitT = Math.max(0, (player.hitT || 0) - dt); player.blockT = Math.max(0, (player.blockT || 0) - dt); player.cancelT = Math.max(0, (player.cancelT || 0) - dt); player.cheerT = Math.max(0, (player.cheerT || 0) - dt); player.eatT = Math.max(0, (player.eatT || 0) - dt);
    for (const k in player.cd) player.cd[k] = Math.max(0, player.cd[k] - dt);
    if (player.ghosts) { for (const g of player.ghosts) g.a -= dt * 2.2; player.ghosts = player.ghosts.filter((g) => g.a > 0); if (!player.ghosts.length) player.ghosts = null; }
    if (player.deadT > 0 && (player.deadT -= dt) <= 0) respawnAfterDeath();
    if (shots.length) updateShots(dt);
    if (player.act) { // ação em 3 tempos
      const a = player.act; a.t += dt;
      if (!a.fired && a.t >= a.prep) { a.fired = true; if (a.onImpact) a.onImpact(); }
      if (a.t >= a.prep + a.strike + a.rec) player.act = null;
    }
    if (player.cast) {
      player.cast.t += dt;
      const o = player.cast.spot;
      if (!player.cast.landed && player.cast.t >= 0.42) { player.cast.landed = true; SND.play("splash"); clickFx(o.x + 0.5, o.y + 0.55, "#e8f6ff"); burst(o.x + 0.5, o.y + 0.5, ["#e8f6ff", "#8fc1ee"], 6, 1.4); }
      if (!player.target || player.target.ref !== o) player.cast = null;
    }
    shake = Math.max(0, shake - dt);
    updateCamera(dt); updateTouch();

    const reg = regionAt(player.x, player.y);
    const vil = !inCrypt && reg === "town" && WORLD_G.villageAt(player.x, player.y); // rodada 105: chegou numa vila: a Pedra fica salva
    if (vil && !(player.stones || []).includes(vil.key)) unlockStone(vil.key, true);
    if (vil && vil.key !== player.village) { player.village = vil.key; if (reg === player.region && !vil.main) { $("banner").innerHTML = `${UI.titleHTML(vil.name)}<small>zona segura</small>`; $("banner").classList.remove("show"); void $("banner").offsetWidth; $("banner").classList.add("show"); } }
    if (reg !== player.region) {
      const first = player.region === null; player.region = reg; hudDirty = true; SND.setMood(reg === "den" ? "crypt" : reg);
      const R0 = REGIONS[reg], low = R0.min && lv("combate") < R0.min; // rodada 31: aviso de região acima do seu nível
      const dIcon = R0.pack ? "icon_danger_pack" : "icon_danger_generic"; // rodada 32: caveira nas regiões sem matilha
      const firstDanger = low && !inCrypt && !player.seen["danger:" + reg]; // rodada 58: primeira vez nesta região abaixo do nível
      if (reg === "east" && !low && lv("combate") < 9 && !player.seen.goblinTip) { player.seen.goblinTip = 1; log("Dica do Ivo: no Bosque, os goblins andam em bando. Puxe um de cada vez pela beirada do acampamento e só vá com comida na mochila.", "tip", "icon_tip"); } // rodada 60
      if (firstDanger) { player.seen["danger:" + reg] = 1; warnT._any = -1e9; player.backHint = safeSpot(); }
      if (low && (warnT[reg] || -1e9) < player.playT - 60 && (warnT._any || -1e9) < player.playT - 15) { warnT[reg] = warnT._any = player.playT; log(`${R0.danger}; volte no Combate ${R0.min} (você tem ${lv("combate")}).`, "warn", dIcon); } // rodada 32: também ao carregar já dentro
      if (!first || low) { const R = reg === "town" && vil ? { ...REGIONS.town, name: vil.name } : REGIONS[reg]; $("banner").innerHTML = `${UI.titleHTML(R.name)}<small>${esc(R.lvl)}</small>${low ? `<small class="danger">${ASSETS[dIcon] ? `<img src="${ASSETS[dIcon]}" alt="">` : "⚠ "}${esc(R.danger)} · Combate ${R.min} recomendado</small>` : ""}`; $("banner").classList.remove("show"); $("banner").classList.toggle("first", !!firstDanger); $("banner").classList.toggle("high", RULES.talkerNear(Object.values(npc), player)); void $("banner").offsetWidth; $("banner").classList.add("show"); }
    }
    if (dlg && dlg.obj) {
      const near = adjRect(player.x, player.y, dlg.obj) || (dlg.kind === "shop" && [npc.merchant, npc.stall].includes(dlg.obj) && (adjRect(player.x, player.y, npc.merchant) || adjRect(player.x, player.y, npc.stall)));
      if (!near) closeDlg();
    }

    tickAcc += dt;
    while (tickAcc >= TICK) { tickAcc -= TICK; onTick(); }
    if (!inCrypt) updateEvent(dt);
    player.dayT = (player.dayT + dt / LIGHT.DAY) % 1; player.playT += dt;
    if ((tipT -= dt) <= 0) { tipT = TIP_EVERY; if ((warnT._any && player.playT - warnT._any < 10) || mobs.some((m) => !m.dead && m.aggro)) tipT = 15; else if (!TUTORIAL[player.tut.step] && !inCrypt) log(`Dica do Ivo: ${nextTip()}`, "tip", "icon_tip"); } // rodada 54: não cola num aviso de região recente; rodada 57: nem no meio de uma luta
    const ae = awakeEcho(); if (ae !== lastEcho) { lastEcho = ae; hudDirty = true; }
    // rodada 47: vida abaixo de 30% → moldura vermelha; na primeira vez (por save), a dica de recuar
    const low = player.deadT <= 0 && player.hp > 0 && player.hp < maxHp() * 0.3;
    if (low !== !$("lowhp").hidden) $("lowhp").hidden = !low || !ASSETS.fx_low_hp_vignette;
    const fl = foodLow(); if (fl !== !!player.foodLowOn) { player.foodLowOn = fl; hudDirty = true; } // rodada 48
    if (player.foodPulseT > 0 && (player.foodPulseT -= dt) <= 0) hudDirty = true; // rodada 61: fim do pulso do cesto
    if (!player.seen.meatTip && player.inv.some((s) => s && s.name === "Carne de javali")) { player.seen.meatTip = 1; log(`Dica do Ivo: carne de javali assa na fogueira desde a Culinária ${ITEMS["Carne de javali"].cookLvl} (cura ${ITEMS["Carne assada"].heal}). Com uma madeira na mochila, ela vira espetinho (cura ${ITEMS["Espetinho de javali"].heal}).`, "tip", "item_meat_skewer"); } // rodada 56; rodada 88: valores lidos dos itens
    if (!player.seen.bagTip && player.inv.every(Boolean)) { player.seen.bagTip = 1; log("Dica do Ivo: mochila cheia! O cofre ao lado da casa vermelha guarda 48 espaços, e \"Guardar materiais\" leva tudo menos comida e poções. O Bento compra o resto.", "tip", "icon_bank_move"); } // rodada 55
    if (fl && !player.seen.foodTip && ASSETS.icon_food_low) { player.seen.foodTip = 1; log("Comida acabando! Pesque ou cace e asse na fogueira antes de lutar mais.", "warn", "icon_food_low"); }
    if (low && !player.seen.retreatTip) { player.seen.retreatTip = 1; log("Vida baixa! Coma (1), beba uma poção de vida (2) ou recue: monstros desistem da perseguição quando você se afasta da casa deles.", "warn", "icon_retreat"); }
    const nt = LIGHT.darkness(player.dayT) > 0.4 || mobs.some((m) => m.type === "wolf_moon" && !m.dead); if (nt !== lastNight) { lastNight = nt; hudDirty = true; } // rodada 35: quadro verde da balada muda com a noite e a Lua cheia // aviso do eco no quadro verde aparece e some
    updateChatter(dt);

    for (const m of mobs) {
      if (!m.dead && m.prog >= 1 && !activeMob(m)) continue; // rodada 106: longe da área do minimapa: parado
      if (m.dead) {
        const mk = m.d.marker; // aviso do renascimento (fogo-fátuo, pedras rolando): marca o lugar nos segundos finais
        if (!m.temp && !m.respawnAt && mk && m.respawnT <= mk.t && RISES(m) && ANIMS[mk.fx]) { m.respawnAt = spawnSpot(m.reg, m.home || { x: m.hx, y: m.hy }); m.markT = 0; }
        if (m.respawnAt) m.markT = (m.markT || 0) + dt;
        if ((m.respawnT -= dt) <= 0) respawnMob(m); continue;
      }
      if (m.appear != null && (m.appear += dt) >= APPEAR) m.appear = null; // eco surgindo da névoa
      if (m.prog < 1) { m.prog = Math.min(1, m.prog + dt / (m.d.squish ? MOB_STEP * 1.25 : MOB_STEP) / (m.fx !== m.x && m.fy !== m.y ? Math.SQRT2 : 1)); m.dist += dt / MOB_STEP; } // rodada 105: passo diagonal mais longo
      // slime: agacha, salta e aterrissa; os outros andam com easing (perseguindo, em ritmo constante)
      const k = m.d.squish ? (m.prog < 0.2 ? 0 : m.prog > 0.8 ? 1 : ease.inOutSine((m.prog - 0.2) / 0.6)) : m.aggro ? m.prog : ease.inOutSine(m.prog);
      m.px = m.fx + (m.x - m.fx) * k; m.py = m.fy + (m.y - m.fy) * k;
      mobAnim(m, dt);
      if (m.bleed && (m.bleed.t -= dt) <= 0) { const b = m.bleed; b.t = RULES.BLEED.every; if (--b.n <= 0) m.bleed = null; hurtMob(m, b.dmg, false, { dot: true }); if (m.dead) continue; }
      m.flash = Math.max(0, m.flash - dt); m.lunge = Math.max(0, m.lunge - dt * 4.5); if (m.stun > 0) m.stun -= dt; m.kb = Math.max(0, m.kb - dt * 5); m.prep = Math.max(0, (m.prep || 0) - dt);
    }
    for (let i = corpses.length - 1; i >= 0; i--) if ((corpses[i].t += dt) > corpses[i].life) corpses.splice(i, 1);
    petFrame(dt); // rodada 95
    updateChest(dt); if (npc.chest && npc.chest.glowT > 0) npc.chest.glowT -= dt;
    updateNpcWalk(dt); updateDummy(dt); RENDER.updateOnce(dt);
    for (const o of resources) {
      o.shake = Math.max(0, o.shake - dt); if (o.hitT != null && (o.hitT += dt) > 1) o.hitT = null;
      if (o.respawn > 0 && (o.respawn -= dt) <= 0) {
        if ((player.x === o.x && player.y === o.y) || mobAt(o.x, o.y)) o.respawn = 1; // alguém em cima: espera
        else { o.respawn = 0; o.charges = ri(...RES[o.kind].charges); }
      }
    }
    for (let i = groundItems.length - 1; i >= 0; i--) if ((groundItems[i].age += dt) > groundItems[i].life) groundItems.splice(i, 1);
    fx.update(dt);
    if ((saveT += dt) > 10) { saveT = 0; save(); }
  }

  function onTick() {
    tickN++;
    if (player.actT > 0) player.actT--;
    if (player.deadT > 0) { /* caído */ }
    else if (player.job && !player.path.length && player.prog >= 1) doJob();
    else if (player.target && !player.path.length && player.prog >= 1) doTarget();
    if (tickN - player.lastHurt > 8 && tickN % ValdoraHome.regenTicks(player.home, !!player.buffs.descansado) === 0 && player.hp < maxHp()) { player.hp++; hudDirty = true; } // rodada 100: descansado regenera mais rápido (REST.regen)
    if (tickN % 20 === 0) hudDirty = true; // relógio
    for (const k of Object.keys(player.buffs)) {
      if (BUFFS[k].regen && tickN % 2 === 0 && player.hp < maxHp() && player.deadT <= 0) { player.hp = Math.min(maxHp(), player.hp + BUFFS[k].regen); hudDirty = true; } // rodada 79: Tônico de vigor
      if (--player.buffs[k] <= 0) { delete player.buffs[k]; log(`O efeito ${BUFFS[k].name} acabou.`, "dim"); }
      if (tickN % 2 === 0) hudDirty = true;
    }
    for (const m of mobs) if (!m.dead && activeMob(m)) mobTick(m);
    petTick(); // rodada 95
    CAMPAIGN_RT.tick(tickN); // rodada 78: bênção do marco
    if (tickN % 20 === 0) homeVisit(); // rodada 102: visita ao quintal
  }
  // IA e animação dos monstros (js/mobs.js)
  const MOBAI = ValdoraMobs.create({ petFoe: (m, d) => petFoe(m, d), petAttack: (m) => petAttack(m), petSlam: (m) => petSlam(m), petAt: (x, y) => petAt(x, y), calm: (m) => CAMPAIGN_RT.calm(m), mark: (x, y, r) => fx.mark(x, y, r), echoFade: (m) => echoFade(m), giveUp: (m) => giveUp(m), ANIMS, TICK, DIRS, DIRS8V, adjacent, canStep, elevAt: (x, y) => elevAt(x, y), reindex: (m) => mobIdx.set(m.y * W + m.x, m), SND, rand, ri, hitChance, lv, inTown, walkable, regionAt, combatStats, mobAttack, applyMobHit, addFloat, burst, hitSplat,
    playerDied: () => playerDied(), player: () => player, tickN: () => tickN, dirty: () => { hudDirty = true; }, shake: (v) => { shake = v; },
    dust: (x, y) => { const reg = regionAt(Math.round(x), Math.round(y)), light = (reg === "west" || reg === "den") && ANIMS.fx_dust_slam_light;
      return RENDER.playOnce(light ? "fx_dust_slam_light" : "fx_dust_slam", x, y + 0.3, { ground: true }); },
    howl: (m, short) => { if (!short) for (const o of mobs) if (o.sleeping && Math.hypot(o.x - m.x, o.y - m.y) < 24) { MOBAI.wake(o); o.hx = m.x; o.hy = m.y; o.aggro = Math.abs(o.x - player.x) + Math.abs(o.y - player.y) <= 14; } /* o uivo do Alfa acorda a toca toda */ SND.play("warn"); addFloat(m.px + 0.5, m.py - 1.4, short ? "Auuu!" : "Auuuuu!", "#cfe6ff", short ? 1 : 1.6, short ? 14 : 18); if (!short && SND.opts.shake) shake = Math.max(shake, 0.15); } });
  const { mobTick, slam, mobMove, mobStepToward, mobAnim } = MOBAI;
  const RISES = (m) => ANIMS[m.d.spr] && ANIMS[m.d.spr].rows.rise_up;
  function riseUp(n) { // sai da terra (folha "rise_up") com poeira clara no primeiro quadro
    n.an = { s: "rise_up", t: 0, still: 0 }; if (n.d.riseFx !== false) RENDER.playOnce(ANIMS.fx_dust_slam_light ? "fx_dust_slam_light" : "fx_dust_slam", n.x, n.y + 0.3, { ground: true });
  }
  function respawnMob(m) {
    if (m.temp) { mobs.splice(mobs.indexOf(m), 1); return; }
    const n = spawnMob(m.type, m.reg, m.home || { x: m.hx, y: m.hy }, m, m.respawnAt ? { at: m.respawnAt } : undefined);
    if (!n) { m.respawnT = 3; m.respawnAt = null; return; }
    if (RISES(n)) riseUp(n);
    if (m.d.boss) log(`Um frio percorre as ruínas: ${m.d.name} despertou de novo.`, "warn");
  }

  // ---------- Câmera: segue com suavidade, olha um pouco à frente na direção do movimento ----------
  // câmera com mola e antecipação na direção do movimento (js/camera.js)
  const CAMERA = ValdoraCamera.create({ TILE, DIR_VEC, player: () => player, view: () => [canvas.width, canvas.height] });
  const updateCamera = (dt) => CAMERA.update(dt);

  // ---------- Desenho ----------
  let frameId = 0, nameA = 1, nameLt = 0; const tags = [];
  // rodada 53: o que o santuário faz em jogo (oferta, chama votiva, moedas, faíscas, etiqueta do título) mora em js/shrine.js
  const SHRINE_RT = SHRINE.create({ player: () => player, npc: () => npc, inCrypt: () => inCrypt, ANIMS, TILE, cam, tags, rand, drawFx,
    fx: { sparks: (...a) => fx.sparks(...a) }, burst: (...a) => burst(...a), SND, log: (m, c, i) => log(m, c, i), toast: (a, b, c) => showToast(a, b, c),
    dirty: () => { hudDirty = true; }, save: () => save() });
  const waterKey = (x, y, t) => animKey("water", t, (x * 7 + y * 13) % 5 * 0.37);
  function draw(t) {
    frameId++;
    const sk = shake > 0 ? (rand() - 0.5) * 8 * shake / 0.3 : 0;
    const cf = CAMERA.focus();
    cam.x = Math.round(clamp(cf.x, 0, Math.max(0, W * TILE - canvas.width)) + sk);
    cam.y = Math.round(clamp(cf.y, 0, Math.max(0, H * TILE - canvas.height)) + sk);
    ctx.fillStyle = "#0c0c0c"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ground.draw(ctx, cam, canvas.width, canvas.height, t, waterKey, waterDraw);
    const x0 = Math.floor(cam.x / TILE), y0 = Math.floor(cam.y / TILE);
    const x1 = Math.min(W, x0 + Math.ceil(canvas.width / TILE) + 1), y1 = Math.min(H, y0 + Math.ceil(canvas.height / TILE) + 1);
    const ents = [];
    // objetos visíveis (inclui linhas abaixo da tela, pois artes altas sobem)
    for (let y = Math.max(0, y0 - 1); y < Math.min(H, y1 + 3); y++) for (let x = Math.max(0, x0 - 2); x < Math.min(W, x1 + 2); x++) {
      const o = occ[y * W + x]; if (!o || o._f === frameId) continue; o._f = frameId;
      if (o.type === "decal") continue; // já está no chão
      if (o.type === "res" && o.lake) { drawFishspot(o, t); continue; }
      if (o.type === "res" && o.respawn > 0) { drawSprite(RES[o.kind].empty, o.x, o.y); continue; }
      if ((o.type === "fire" || o.type === "furnace") && o.spr !== "deco_rift_brazier" && rand() < 0.12) ember(o.x + 0.5, o.y + (o.type === "fire" ? 0.6 : 0.4));
      ents.push({ y: o.y + o.h - 1, o });
    }
    drawGroundItems(t, x0, y0, x1, y1);
    RENDER.drawOnce("ground"); // poeira e rachaduras no chão, antes das entidades
    fx.drawGround(ctx, cam); // rodada 67: ondas de choque e marcas de impacto por baixo dos personagens
    AMBIENT.drawGround(ctx, cam, canvas.width, canvas.height, t, inCrypt); // rodada 75: poças depois da chuva
    CAMPAIGN_RT.drawGround(t); // rodada 78: fendas dos Campos
    for (const m of mobs) if (m.dead && m.respawnAt && m.d.marker && ANIMS[m.d.marker.fx]) { // um monstro vai voltar aqui
      const A = ANIMS[m.d.marker.fx], R = A.rows.loop, w = m.respawnAt; // em loop (fogo-fátuo) ou toca uma vez e segura o último quadro (pedras)
      const f = R.loop ? Math.floor(t * R.fps + hash(w.x, w.y, 7) * R.frames) : Math.min(R.frames - 1, Math.floor((m.markT || 0) * R.fps));
      drawFx(A, f, Math.round((w.x + 0.5) * TILE - cam.x - A.cw / 2), Math.round((w.y + 1) * TILE - cam.y - A.ch * 0.88));
    }
    const auras = (alpha) => { for (const m of mobs) if (!m.dead && m.enraged && m.d.enrage && ANIMS[m.d.enrage.fx]) { // aura da fúria em volta do chefe
      const A = ANIMS[m.d.enrage.fx], R = A.rows.loop, f = Math.floor(t * R.fps) % R.frames; ctx.globalAlpha = alpha;
      drawFx(A, f, Math.round((m.px + 0.5) * TILE - cam.x - A.cw / 2), Math.round((m.py + 1) * TILE - cam.y - A.ch * 0.88)); ctx.globalAlpha = 1; } };
    auras(1);
    // área de perigo: folha fx_ground_warning (Blender) em cada tile, todos na mesma fase; sem ela, quadrados vermelhos
    const warnTiles = (tiles, phase) => {
      const A = ANIMS.fx_ground_warning;
      if (A) { const R = A.rows.loop, f = Math.floor(phase * R.fps) % R.frames; for (const [x, y] of tiles) drawFx(A, f, x * TILE - cam.x, y * TILE - cam.y, TILE, TILE); return; }
      const k = 0.5 + Math.sin(phase * 14) * 0.2; ctx.fillStyle = `rgba(220,50,30,${0.16 + k * 0.14})`; ctx.strokeStyle = "#ff5a3a"; ctx.lineWidth = 2;
      for (const [x, y] of tiles) { ctx.fillRect(x * TILE - cam.x + 3, y * TILE - cam.y + 3, TILE - 6, TILE - 6); ctx.strokeRect(x * TILE - cam.x + 3, y * TILE - cam.y + 3, TILE - 6, TILE - 6); }
    };
    if (npc.dummy && npc.dummy.drill) { // área do revide do boneco (3x3) e barra do tempo restante
      const o = npc.dummy, k = o.drill.t / DRILL, tiles = [];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) tiles.push([o.x + dx, o.y + dy]);
      warnTiles(tiles, o.drill.t); ctx.strokeStyle = "#ff5a3a"; ctx.lineWidth = 2;
      ctx.strokeRect((o.x - 1) * TILE - cam.x + 2, (o.y - 1) * TILE - cam.y + 2, TILE * 3 - 4, TILE * 3 - 4);
      ctx.fillStyle = "#ff5a3a"; ctx.fillRect((o.x - 1) * TILE - cam.x + 3, (o.y + 2) * TILE - cam.y - 8, (TILE * 3 - 6) * (1 - k), 4); // tempo restante
    }
    for (const m of mobs) if (!m.dead && m.windup > 0 && !m.d.slam && m.pending && m.pending.special) // golpe pesado: os 4 tiles ao redor
      warnTiles(DIRS.map(([dx, dy]) => [m.x + dx, m.y + dy]), m.an ? m.an.t : t);
    for (const m of mobs) if (!m.dead && m.windup > 0 && m.d.slam && !(m.an && m.an.s === "special" && !m.pending)) { // área do tremor, pulsando
      const cx = (m.x + 0.5) * TILE - cam.x, cy = (m.y + 0.5) * TILE - cam.y, k = 0.5 + Math.sin(t * 14) * 0.2, tiles = [];
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if ((dx || dy) && Math.hypot(dx, dy) <= 2.3) tiles.push([m.x + dx, m.y + dy]); // os tiles que o tremor acerta
      if (ANIMS.fx_ground_warning) warnTiles(tiles, m.an ? m.an.t : t);
      else { ctx.fillStyle = `rgba(220,50,30,${0.18 + k * 0.15})`; ctx.beginPath(); ctx.ellipse(cx, cy, 2.3 * TILE, 2.3 * TILE * 0.75, 0, 0, 7); ctx.fill(); }
      const RA = ANIMS.fx_ground_warning_ring;
      if (RA) drawFx(RA, Math.floor((m.an ? m.an.t : t) * RA.rows.loop.fps), Math.round(cx - RA.cw / 2), Math.round(cy - RA.ch / 2)); // anel de brasa (Blender)
      else { ctx.strokeStyle = "#ff5a3a"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, cy, 2.3 * TILE, 2.3 * TILE * 0.75, 0, 0, 7); ctx.stroke(); }
    }
    // alvo e cursor
    drawPathDots(t);
    if (player.target) outlineTarget(player.target, "#f1c40f", t);
    if (PST.mouse) {
      const am = PST.attack && nearestMob(PST.mouse.x, PST.mouse.y); // rodada 105: modo de ataque (Ctrl): mira no monstro mais perto
      const hover = PST.hover = am ? { kind: "mob", ref: am } : pick(PST.mouse.x, PST.mouse.y);
      const interactive = hover && hover.kind !== "tile";
      canvas.style.cursor = PST.attack ? "crosshair" : interactive ? "pointer" : "default";
      if (interactive && (!player.target || player.target.ref !== hover.ref)) outlineTarget(hover, am ? "#ff5a4acc" : "#ffffff88", t);
    }
    for (const m of mobs) if (!m.dead && m.px > x0 - 3 && m.px < x1 + 2 && m.py > y0 - 2 && m.py < y1 + 3) ents.push({ y: m.py, m });
    if (pet && player.pet && !(pet.down && inCrypt)) ents.push({ y: (pet.down || pet.napping ? pet.y : pet.py) + 0.01, m: pet }); // rodada 100: por cima da cama // rodada 95; rodada 96: descansando na vila
    for (const c of corpses) ents.push({ y: c.y, c });
    ents.push({ y: player.py, me: true });
    ents.sort((a, b) => a.y - b.y);
    tags.length = 0;
    for (const e of ents) e.me ? (drawPlayer(t), SHRINE_RT.drawVotive(t)) : e.m ? drawMob(e.m, t) : e.c ? drawCorpse(e.c) : drawObject(e.o, t);
    RENDER.drawOnce(); // folhas caindo do toco
    drawStores(Math.min(0.1, t - (drawStores.lt ?? t))); drawStores.lt = t; // rodada 42: item entrando no baú
    drawShots(); // rodada 104: flechas do arqueiro
    auras(0.35); // a frente do anel passa por cima do chefe
    AMBIENT.draw(ctx, cam, canvas.width, canvas.height, t, inCrypt ? 0.86 : LIGHT.darkness(player.dayT), inCrypt); // rodada 66: sombras de nuvens e partículas de vento
    SHRINE_RT.titleTags(); // cor do nome e título do santuário (js/shrine.js)
    // rodada 66: em luta, o nome (e o título) do herói quase some, para os números e a barra do monstro ficarem legíveis
    const fight = (player.target && player.target.kind === "mob" && !player.target.ref.dead) || tickN - (player.lastHurt ?? -99) < 6;
    nameA += ((fight ? 0.12 : 1) - nameA) * Math.min(1, Math.max(0, t - nameLt) * 6); nameLt = t;
    for (const [text, x, y, c, small] of tags) {
      const mine = text === player.name || (small && text.startsWith("‹"));
      if (mine) ctx.globalAlpha = nameA; nameTag(text, x, y, c, small); ctx.globalAlpha = 1;
    } // nomes por cima de tudo
    drawLights(t);
    CAMPAIGN_RT.drawOver(t); // rodada 78: luz dos marcos acesos, "!" nos objetivos e seta na borda (por cima da noite)
    AMBIENT.draw(ctx, cam, canvas.width, canvas.height, t, inCrypt ? 0.86 : LIGHT.darkness(player.dayT), inCrypt, true); // vagalumes e faíscas brilham por cima da noite
    AMBIENT.drawVignette(ctx, canvas.width, canvas.height, inCrypt ? 0.9 : 0.75); // rodada 66: vinheta suave
    CAMPAIGN_RT.drawScreen(); // rodada 78: clarão das pedras de passagem
    drawBubble();
    fx.draw(ctx, cam); // partículas e textos por cima da iluminação
    drawBossBar();
    if (PST.hover && PST.hover.kind !== "tile" && PST.mouse) drawHoverLabel(PST.hover);
  }
  function drawSprite(key, x, y) {
    const img = SPR[key]; if (!img) return;
    ctx.drawImage(img, Math.round(x * TILE - cam.x - (img.width - TILE) / 2), Math.round((y + 1) * TILE - cam.y - img.height));
  }
  function drawGroundItems(t, x0, y0, x1, y1) {
    const perTile = {};
    for (const g of groundItems) {
      if (g.x < x0 - 1 || g.x > x1 || g.y < y0 - 1 || g.y > y1) continue;
      const it = ITEMS[g.name], img = SPR[it.icon]; if (!img) continue;
      const k = g.y * W + g.x, idx = perTile[k] = (perTile[k] ?? -1) + 1; // vários itens no mesmo tile: espalha
      let cx = (g.x + 0.5) * TILE - cam.x + [0, -12, 12, -6, 6][idx % 5], by = (g.y + 0.82) * TILE - cam.y - (idx > 2 ? 8 : 0);
      const FLY = 0.42 + idx * 0.05; let bounce = Math.sin(t * 3 + g.x) * 1.5; const s = 28;
      if (g.age < FLY) { // sai do monstro em arco e quica ao tocar o chão
        const k = g.age / FLY, e = ease.outQuad(k), sx0 = (g.ox + 0.5) * TILE - cam.x, sy0 = (g.oy + 0.82) * TILE - cam.y;
        cx = sx0 + (cx - sx0) * e; by = sy0 + (by - sy0) * e; bounce = -Math.sin(Math.PI * k) * 30;
      } else if (g.age < FLY + 0.25) bounce = -Math.abs(Math.sin((g.age - FLY) / 0.25 * Math.PI)) * 7;
      if (isSpecial(g.name) || g.aff) { // facho de luz para drops raros, na cor da raridade
        const grd = ctx.createLinearGradient(0, by - 90, 0, by), c = g.aff ? "#ffd84a" : itemColor(g.name);
        grd.addColorStop(0, c + "00"); grd.addColorStop(1, c + "99");
        ctx.fillStyle = grd; ctx.fillRect(cx - 7, by - 90, 14, 90);
      }
      shadowAt(cx, by + 2, 10, 4);
      if (g.age > g.life - 10 && Math.floor(t * 6) % 2) ctx.globalAlpha = 0.4; // piscando antes de sumir
      if (it.filter) ctx.filter = it.filter;
      ctx.imageSmoothingEnabled = true; ctx.drawImage(img, cx - s / 2, by - s + bounce, s, s); ctx.imageSmoothingEnabled = false;
      ctx.filter = "none"; ctx.globalAlpha = 1;
      if (g.n > 1) { ctx.font = "12px 'Valdora Pixel', 'Courier New', monospace"; ctx.textAlign = "left"; ctx.lineWidth = 3; ctx.strokeStyle = "#000"; ctx.strokeText(g.n, cx + 6, by - 2); ctx.fillStyle = "#ffe680"; ctx.fillText(g.n, cx + 6, by - 2); }
    }
  }
  // desenho dos objetos do mapa (js/scenery.js)
  const SCENERY = ValdoraScenery.create({ ctx, cam, TILE, ANIMS, SPR, HERO_SHEET, TUTORIAL, tags, animFrame, drawAnim, drawFx, drawSmoke, sceneryFrame,
    shadow: (...a) => shadow(...a), questMark: (g) => questMark(g), player: () => player, dlg: () => dlg, bubble: () => bubble, mobs: () => mobs });
  const drawObject = (o, t) => SCENERY.drawObject(o, t);

  function shadow(x, y, r) { shadowAt(x * TILE - cam.x, y * TILE - cam.y, r * TILE, r * TILE * 0.35); }
  function shadowAt(x, y, rx, ry) { ctx.fillStyle = "#00000040"; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 7); ctx.fill(); }
  function nameTag(text, x, y, color, small) {
    ctx.font = "12px 'Valdora Pixel', 'Courier New', monospace"; ctx.textAlign = "center"; // rodada 79: fonte em pixel art
    const sx = Math.round(x * TILE - cam.x), sy = Math.round(y * TILE - cam.y); // pixel inteiro: a fonte em pixel art não borra
    ctx.lineWidth = 3; ctx.strokeStyle = "#000"; ctx.strokeText(text, sx, sy); ctx.fillStyle = color; ctx.fillText(text, sx, sy);
  }
  // pose da ação: deslocamento do corpo (recuo na preparação, avanço no golpe) e fase (0 prep, 1 golpe, 2 recuperação)
  // desenho do herói (js/hero.js)
  const HERO = ValdoraHero.create({ ctx, cam, TILE, ANIMS, SPR, HEROES, HERO_SHEET, DIR_VEC, ease, tags, fx: { sparks: (...a) => fx.sparks(...a) }, rand, drawAnim, animFrame,
    shadowAt: (...a) => shadowAt(...a), whiteOf: (...a) => whiteOf(...a), player: () => player });
  const drawPlayer = (t) => HERO.drawPlayer(t);
  // desenho dos monstros (js/actors.js)
  const ACTORS = ValdoraActors.create({ lazyAnim: (k) => lazyAnim(k), ctx, cam, TILE, TICK, ANIMS, SPR, ease, tags, animFrame, drawAnim, shadowAt: (...a) => shadowAt(...a), whiteOf: (...a) => whiteOf(...a), player: () => player });
  const { drawMob, drawMobAnim, drawCorpse, drawStun } = ACTORS;
  function drawBossBar() {
    const b = mobs.find((m) => (m.d.boss || m.d.mini) && !m.dead && m.aggro && Math.abs(m.x - player.x) + Math.abs(m.y - player.y) < 14);
    const el = $("bossbar");
    if (!b) { if (!el.hidden) el.hidden = true; return; }
    el.hidden = false;
    const pct = Math.max(0, b.hp / b.d.hp * 100).toFixed(1);
    if (el.dataset.pct !== pct) { el.dataset.pct = pct; el.innerHTML = `<b>${esc(b.d.name)}</b><div class="bar"><i style="width:${pct}%"></i></div>`; }
  }
  // anel tracejado girando sob os pés do alvo (amarelo = alvo atual, branco = cursor)
  function outlineTarget(p, color, t) {
    let x, y, w = 1, h = 1, rw = 0.42;
    if (p.kind === "mob") { x = p.ref.px; y = p.ref.py; const img = SPR[p.ref.d.spr]; rw = Math.min(1.1, Math.max(0.42, (img ? img.width * (p.ref.d.scale || 1) / TILE : 1) * 0.36)); }
    else if (p.ref) { ({ x, y, w, h } = p.ref); rw = Math.max(0.42, w * 0.45); } else return;
    const cx = Math.round((x + w / 2) * TILE - cam.x), cy = Math.round((y + h - 0.08) * TILE - cam.y), pulse = 1 + Math.sin(t * 6) * 0.05;
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.setLineDash([7, 5]); ctx.lineDashOffset = -t * 18;
    ctx.beginPath(); ctx.ellipse(cx, cy, rw * TILE * pulse, rw * TILE * 0.36 * pulse, 0, 0, 7); ctx.stroke();
    ctx.restore();
  }
  function drawPathDots(t) { // trilha do caminho: pontinhos que somem perto do herói
    if (!player.path.length || player.path.length > 60) return;
    ctx.fillStyle = "#f1c40f";
    player.path.forEach(([x, y], i) => {
      ctx.globalAlpha = Math.min(0.7, 0.15 + i * 0.12) * (i === player.path.length - 1 ? 1 : 0.8);
      const s = i === player.path.length - 1 ? 5 : 3; ctx.fillRect(Math.round((x + 0.5) * TILE - cam.x - s / 2), Math.round((y + 0.62) * TILE - cam.y - s / 2), s, s);
    });
    ctx.globalAlpha = 1;
  }
  function describe(p) {
    const r = p.ref;
    if (p.kind === "mob") return [`${r.d.name} (nv ${r.d.lvl})`, r.d.lvl > lv("combate") + 6 ? "#ff6b5a" : r.d.lvl > lv("combate") ? "#f5c060" : "#9fe08a",
      `Atacar · ${Math.round(hitChance(combatStats().acc, r.d.def) * 100)}% de acerto${r.d.aggro ? " · agressivo" : ""}`];
    if (p.kind === "res") {
      const R = RES[r.kind], ok = lv(R.skill) >= R.req;
      return [`${R.verb}: ${R.name}`, ok ? "#ffffff" : "#ff6b5a", ok ? "" : `requer ${SKILLS[R.skill]} ${R.req}`];
    }
    if (p.kind === "loot") { const gs = groundItems.filter((g) => g.x === r.x && g.y === r.y); return [gs.map((g) => `${g.n}x ${g.name}`).join(", "), "#ffe680", "Pegar"]; }
    return {
      shop: ["Bento, o mercador", "#f5e27a", "Comprar, vender e encomendas"], guard: ["Guarda Ivo", "#9fd0ff", TUTORIAL[player.tut.step] ? "Tutorial e dicas" : "Dicas"],
      bank: ["Cofre da vila", "#f5e27a", "Guardar itens"], dummy: ["Boneco de treino", "#e8d9b0", "Golpeie e saia da área vermelha"], furnace: ["Fornalha", "#f5c060", "Fundir minério em barras"],
      anvil: ["Bigorna", "#d0d6e0", "Forjar equipamentos"], shrine: ["Santuário de Lumeira", "#ffd84a", "Oferendas · títulos de prestígio"], bard: ["Tomé, o bardo", "#f5c060", "Canções e dicas"],
      crypt: ["Escada da cripta", "#c79bff", "Masmorra · Combate 18+"], crypt_exit: ["Saída", "#e8d9b0", "Voltar à superfície"],
      den: ["Toca dos Lobos", "#b8d8ff", player.quests.balada && player.quests.balada.done ? "Masmorra · Combate 14+" : "Bloqueada · missão do Tomé"],
      chest: [dungeon === "den" ? "Baú da toca" : "Baú da cripta", "#f1c40f", r.opened ? "Vazio" : mobs.some((m) => !m.dead) ? "Selado: derrote todos os inimigos" : "Abrir!"], board: ["Quadro de caçadas", "#f5e27a", "Recompensas por monstros"], fire: ["Fogueira", "#f5c060", "Assar peixe e carne"], sign: ["Placa", "#e8d9b0", r.label],
    }[p.kind] || null;
  }
  function drawHoverLabel(p) {
    const d = describe(p); if (!d) return;
    const [title, color, sub] = d;
    ctx.font = "12px 'Valdora Pixel', 'Courier New', monospace"; ctx.textAlign = "left";
    const w = Math.max(ctx.measureText(title).width, sub ? ctx.measureText(sub).width : 0) + 12, h = sub ? 34 : 20;
    const x = Math.min(PST.mouse.x + 14, canvas.width - w - 4), y = Math.max(4, PST.mouse.y - h - 6);
    ctx.fillStyle = "#1b1610e8"; ctx.fillRect(x, y, w, h); ctx.strokeStyle = "#6b4f2a"; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = color; ctx.fillText(title, x + 6, y + 14);
    if (sub) { ctx.fillStyle = "#c9bfa8"; ctx.font = "12px 'Valdora Pixel', 'Courier New', monospace"; ctx.fillText(sub, x + 6, y + 28); }
  }

  // ---------- Salvamento (localStorage) ----------
  function readSave() {
    try { const d = JSON.parse(localStorage.getItem(SAVE_KEY)); if (d && d.v === 2 && typeof d.name === "string") return d; } catch (e) { /* save inválido */ }
    return null;
  }
  function save() {
    if (!player) return;
    try {
      const pos = inCrypt ? overworld.ret : player; // dentro da cripta, salva a entrada
      localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 2, wv: 2, t: Date.now(), name: player.name, hero: player.hero, x: pos.x, y: pos.y, stones: player.stones, spawnStone: player.spawnStone, dayT: player.dayT, master: player.master,
        hp: player.hp, playT: Math.round(player.playT), xp: player.xp, inv: player.inv, bank: player.bank, coins: player.coins, style: player.style,
        orders: player.orders, tut: player.tut, kills: player.kills, seen: player.seen, bounties: player.bounties, daily: player.daily, bestiary: player.bestiary, itemized: 1, echo: player.echo, pet: player.pet, home: player.home, buffs: player.buffs,
        bags: player.bags, equip: player.equip, stats: player.stats, ach: player.ach, quests: player.quests, offered: player.offered || 0, votiveT: Math.round(player.votiveT || 0), votives: player.votives || 0, tutV: 2 }));
    } catch (e) { /* armazenamento indisponível (aba privada etc.) */ }
  }
  addEventListener("pagehide", () => { if (running) save(); });
  window.ValdoraGame = { start, readSave, level, SKILLS, // usado por js/lobby.js
    seed: (n) => { RNG = n == null ? Math.random : mulberry32(n); } }; // rodada 63: só para medições (null volta ao normal)
  document.addEventListener("visibilitychange", () => { if (document.hidden && running) save(); });
})();

// Valdora — desenho do mundo (rodada 11: saiu do game.js). Só dados e formas: regiões, lagos, placas, acampamento,
// onde nasce cada monstro e as masmorras (salas, corredores, braseiros, baú, monstros, entrada). Quem constrói é o game.js.
window.ValdoraWorld = (() => {
  "use strict";
  const W = 96, H = 72;
  const TOWN = { x0: 41, y0: 29, x1: 56, y1: 43 }, SPAWN = { x: 48, y: 36 };
  // regiões do mapa de cima (bordas onduladas); a vila e as masmorras são decididas antes, no game.js
  function regionShape(x, y) {
    if (x > 69 + 2 * Math.sin(y * 0.4) && y < 18 + 2 * Math.sin(x * 0.35)) return "ruins";
    if (x < 21 + 2 * Math.sin(y * 0.31)) return "west";
    if (y > 54 + 2 * Math.sin(x * 0.27)) return "south";
    if (x > 69 + 2 * Math.sin(y * 0.23)) return "east";
    return "fields";
  }
  // lagos: [cx, cy, raio, tipo de cardume, quantos cardumes]
  const LAKES = [[34, 23, 4.2, "fishspot", 3], [50, 8, 6.5, "fishspot_deep", 3], [85, 30, 5, "fishspot_deep", 2], [28, 62, 4.5, "fishspot", 2], [12, 40, 4, "fishspot_deep", 2]];
  const SIGNS = [[47, 28, "Norte: Lago Grande · Nordeste: Ruínas Esquecidas"], [40, 35, "Oeste: Planalto de Lumita (Combate 18+)"],
    [57, 38, "Leste: Bosque dos Carvalhos e acampamento goblin (Combate 6+)"], [51, 45, "Sul: Mata Sombria, lobos (Combate 12+)"], [70, 20, "Ruínas Esquecidas, perigo! (Combate 15+)"]];
  const CAMP = { x: 79, y: 46 }; // acampamento goblin no bosque
  // monstros do mapa de cima: [tipo, quantidade, ponto de origem opcional]
  const MOB_SPAWNS = { fields: [["slime", 12], ["slime_blue", 5]], east: [["boar", 8], ["slime", 2], ["goblin", 7, CAMP]], south: [["wolf", 12], ["wolf_alpha", 2]],
    // rodada 19: golems e slimes de lumita agrupados no meio do Planalto (antes espalhados por toda a borda oeste: o robô andava mais do que lutava)
    west: [["golem", 6, { x: 12, y: 28 }], ["slime_crystal", 5, { x: 12, y: 42 }], ["boss_golem", 1, { x: 9, y: 14 }]], ruins: [["skeleton", 8, { x: 74, y: 12 }], ["boss", 1, { x: 84, y: 8 }]] }; // rodada 18: esqueletos na parte oeste das Ruínas, longe do chefe (o robô era puxado para o Senhor)
  // rodada 62: distância mínima (tiles) entre o ponto de nascimento e os Campos/vila, para quem nasce solto pela região.
  // Em 5 mundos, 0 a 7 dos 14 lobos nasciam a até 5 tiles dos Campos e perseguiam iniciantes para dentro deles.
  const SPAWN_EDGE = { wolf: 6, wolf_alpha: 6 };
  // rodada 63: distância mínima (tiles) de um ponto: javalis (caça do Combate 6–9) longe do acampamento goblin
  const SPAWN_AWAY = { boar: { from: CAMP, dist: 8 } };
  const CRYPT_ENTRY = { x: 79, y: 13 };
  const ENTRY_SPR = { crypt: "deco_crypt", den: "deco_den" }; // arte da entrada no mapa de cima (com reserva deco_crypt)
  const DEN_ENTRY = { x: 60, y: 63 }; // Toca dos Lobos, na Mata Sombria (o game.js procura o tile livre mais perto)
  // rodada 78: campanha (Ato I). Marcos de lumita (o jogo procura o tile livre mais perto, depois de todo o sorteio do mundo)
  // e fendas dos Campos (não ocupam tile: só desenho no chão e clique). O Marco do Planalto já existe (enfeite do ponto dos golems).
  const MARKERS = { fields: { name: "Marco dos Campos", x: 30, y: 33 }, east: { name: "Marco do Bosque", x: 75, y: 40 }, south: { name: "Marco da Mata", x: 36, y: 64 },
    ruins: { name: "Marco das Ruínas", x: 73, y: 15 }, west: { name: "Coração de lumita", x: 14, y: 18, heart: true } }; // rodada 80/81
  const RIFT_ENTRY = { x: 5, y: 22 }; // rodada 82: entrada da Fenda Cintilante (rodada 84: saiu de (6,9), a ~6 tiles do Golem Ancião)
  const MINE = { x: 18, y: 33, bras: { x: 19, y: 35 } }; // rodada 81: acampamento do Brás (3x2) e onde ele fica, na subida do Planalto
  const TENT = { x: 62, y: 16, odilia: { x: 63, y: 19 } }; // rodada 80: tenda da Odília (3x2) e onde ela fica, na saída nordeste dos Campos
  // rodada 81: as duas do leste saíram de perto da arena do Senhor das Ruínas (robô: 4 de 10 mortes no Combate 18)
  const RUNES = [{ x: 72, y: 8 }, { x: 78, y: 4 }, { x: 91, y: 16 }, { x: 78, y: 16 }]; // rodada 80: colunas com inscrições (o jogo procura o tile livre mais perto)
  const HUT = { x: 40, y: 56, juna: { x: 44, y: 58 } }; // rodada 79: cabana da Juna (3x2) e onde ela fica, na entrada da Mata Sombria
  const CRACKS = [{ x: 27, y: 43 }, { x: 40, y: 20 }, { x: 64, y: 29 }]; // fora da margem de 6 tiles da vila (onde nada nasce)

  // masmorras instanciadas: refeitas a cada visita
  const DUNGEONS = {
    crypt: {
      name: "Cripta das Ruínas", floor: ["dirt", "stone"], seed: 77, exitSpr: "deco_crypt",
      rooms: [[8, 8, 15, 14], [21, 6, 31, 16], [37, 7, 47, 15]], halls: [[15, 10, 21, 11], [31, 10, 37, 11]],
      exit: { x: 9, y: 9 }, start: { x: 10, y: 11 }, chest: { x: 46, y: 11 }, loot: "CRYPT_CHEST", event: "crypt",
      lights: { spr: "deco_brazier", brazier: true, at: [[14, 8], [8, 13], [21, 7], [31, 7], [21, 15], [31, 15], [37, 8], [47, 8], [37, 14], [47, 14]] },
      spawns: [["skeleton", 3, { x: 12, y: 11 }], ["skeleton", 3, { x: 26, y: 11 }], ["crypt_guard", 1, { x: 27, y: 11 }], ["crypt_guard", 1, { x: 42, y: 11 }], ["skeleton", 2, { x: 42, y: 11 }]],
      enter: "Você desce a escada fria. Tochas iluminam corredores esquecidos...", leave: "Você volta à luz das ruínas.",
      toast: ["Cripta das Ruínas", "Derrote os mortos para romper o selo do baú.", "#c79bff"], foes: ["morto", "mortos"],
    },
    // rodada 82: Fenda Cintilante (Ato V). Entrada no alto do Planalto; liberada ao concluir "O último guardião" (Ato IV)
    rift: {
      name: "Fenda Cintilante", floor: ["tile_rift_1", "tile_rift_2"], fallbackFloor: ["stone", "dirt"], seed: 82, exitSpr: "deco_rift_entrance", bones: 10,
      decor: ["deco_rift_crystal_1", "deco_rift_crystal_2", "deco_rift_crystal_3"], chestSpr: "chest_rift_closed", chestOpenSpr: "chest_rift_open",
      rooms: [[8, 30, 15, 36], [21, 28, 31, 38], [37, 29, 46, 37], [52, 26, 64, 40]], halls: [[15, 33, 21, 34], [31, 33, 37, 34], [46, 33, 52, 34]],
      exit: { x: 9, y: 31 }, start: { x: 10, y: 33 }, chest: { x: 63, y: 33 }, loot: "RIFT_CHEST", event: "rift", seal: { x: 58, y: 28 }, glowTile: "tile_rift_glow", // rodada 83: pedestal do selo
      lights: { spr: "deco_rift_brazier", fallback: "deco_brazier", brazier: true, at: [[14, 30], [8, 36], [21, 28], [31, 28], [21, 38], [31, 38], [37, 29], [46, 37], [52, 26], [64, 26], [52, 40], [64, 40]] },
      spawns: [["quartz_spider", 2, { x: 12, y: 33 }], ["crystal_sentinel", 1, { x: 26, y: 33 }], ["light_wraith", 1, { x: 27, y: 31 }], ["quartz_spider", 2, { x: 41, y: 33 }],
        ["light_wraith", 1, { x: 42, y: 35 }], ["crystal_sentinel", 1, { x: 43, y: 31 }], ["boss_serpent", 1, { x: 58, y: 33 }]],
      enter: "Você desce por uma escada de cristal. A luz aqui embaixo não vem de tocha nenhuma...", leave: "Você volta ao vento frio do Planalto.",
      toast: ["Fenda Cintilante", "Cristais vivos guardam o fundo. Derrote todos para abrir o baú.", "#7fe8ff"], foes: ["cristal vivo", "cristais vivos"],
      unlock: "c4_guardiao", locked: "Cristal maciço fecha a passagem. O Coração de lumita ainda não está aceso (Ato IV, com o Brás).",
    },
    den: {
      name: "Toca dos Lobos", floor: ["den_floor", "den_floor_2"], fallbackFloor: ["dirt", "dirt_2"], seed: 31, exitSpr: "deco_den_exit", bones: 8,
      rooms: [[10, 52, 18, 59], [24, 50, 35, 61], [41, 52, 49, 58]], halls: [[18, 55, 24, 56], [35, 54, 41, 55]],
      exit: { x: 11, y: 53 }, start: { x: 12, y: 56 }, chest: { x: 48, y: 55 }, loot: "DEN_CHEST", event: "den",
      lights: { spr: "deco_den_torch", fallback: "campfire", brazier: true, at: [[17, 53], [25, 50], [34, 60], [42, 53], [11, 58], [48, 57]] }, // tochas presas em raízes
      spawns: [["wolf", 3, { x: 14, y: 56 }, { sleeping: true }], ["wolf", 3, { x: 29, y: 55 }, { sleeping: true }], ["wolf_alpha", 1, { x: 30, y: 57 }], ["wolf_alpha", 1, { x: 44, y: 55 }],
        ["wolf_moon", 1, { x: 46, y: 55 }, { howlPending: true }]],
      enter: "Você se espreme por uma fenda entre as raízes. O cheiro de lobo é forte aqui embaixo...", leave: "Você sai da toca para a Mata Sombria.",
      toast: ["Toca dos Lobos", "A matilha do Alfa guarda o que sobrou das caçadas. Derrote todos para abrir o baú.", "#b8d8ff"], foes: ["lobo", "lobos"],
      unlock: "balada", locked: "Raízes e pedras fecham a toca. Talvez o bardo Tomé saiba como encontrar a passagem (missão \"A balada da lua cheia\").",
    },
  };
  // ================= rodada 105: o continente =================
  // O mapa de antes (96 x 72, tudo acima em coordenadas "locais") vira o miolo do Campo, no meio de um continente de 500 x 440
  // com litoral irregular e 5 biomas: Campo (1, o atual crescido 3x), Floresta Sombria (2, oeste), Deserto (3, sul),
  // Montanhas (4, leste) e Neve (5, norte). Cada um tem a área de ~3 mapas antigos, vila própria (com Pedra de teleporte),
  // monstros na sua faixa de nível e uma masmorra com chefe. O game.js gera o mapa antigo no quadro local (L) e o encaixa em (OX, OY).
  const L = { W, H, TOWN, SPAWN, regionShape, LAKES, SIGNS, CAMP, MOB_SPAWNS, SPAWN_EDGE, SPAWN_AWAY, CRYPT_ENTRY, DEN_ENTRY, ENTRY_SPR, DUNGEONS,
    MARKERS, CRACKS, HUT, TENT, RUNES, MINE, RIFT_ENTRY };
  const CW = 520, CH = 400, OX = 34, OY = 236;
  // n = ordem de nível (1 a 5); a posição segue o desenho: 1 oeste, 2 centro-sul, 3 faixa norte, 4 leste/sudeste, 5 nordeste
  const BIOMES = [
    { n: 1, key: "campo", name: "Campo", lv: [5, 30], at: [0.13, 0.62] },
    { n: 2, key: "darkwood", name: "Floresta Sombria", lv: [31, 65], at: [0.36, 0.66] },
    { n: 3, key: "mountains", name: "Montanhas de Ferro", lv: [66, 101], at: [0.33, 0.34] },
    { n: 4, key: "desert", name: "Deserto Rubro", lv: [102, 140], at: [0.62, 0.64] },
    { n: 5, key: "snow", name: "Geleira do Norte", lv: [141, 180], at: [0.80, 0.36] },
  ];
  const fract = (v) => v - Math.floor(v);
  const h2 = (ix, iy, s) => fract(Math.sin(ix * 127.1 + iy * 311.7 + s * 74.7) * 43758.5453);
  function vnoise(x, y, s) {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const a = h2(ix, iy, s), b = h2(ix + 1, iy, s), c = h2(ix, iy + 1, s), d = h2(ix + 1, iy + 1, s);
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  }
  const fbm = (x, y, s) => 0.5 * vnoise(x, y, s) + 0.3 * vnoise(x * 2.03, y * 2.03, s + 11) + 0.2 * vnoise(x * 4.1, y * 4.1, s + 23);
  const inOld = (x, y) => x >= OX && x < OX + W && y >= OY && y < OY + H;
  // massa de terra: elipses que se juntam num continente (frações do mapa), mais ilhas no norte e no leste
  const LANDS = [[-0.05, 1.05, 0.42, 0.62], [0.20, 0.62, 0.24, 0.34], [0.40, 0.82, 0.20, 0.26], [0.38, 0.37, 0.30, 0.14], [0.61, 0.62, 0.15, 0.22], [0.80, 0.37, 0.20, 0.15],
    [0.63, 0.40, 0.10, 0.12], [0.10, 0.38, 0.12, 0.13], [0.88, 0.52, 0.07, 0.09], [0.50, 0.96, 0.2, 0.1]];
  const ISLES = [[0.28, 0.13, 0.05, 0.025], [0.40, 0.10, 0.04, 0.022], [0.53, 0.17, 0.03, 0.02], [0.76, 0.16, 0.045, 0.022], [0.95, 0.66, 0.025, 0.08], [0.86, 0.82, 0.05, 0.03],
    [0.74, 0.90, 0.04, 0.025], [0.12, 0.16, 0.05, 0.03], [0.92, 0.30, 0.03, 0.04], [0.68, 0.82, 0.03, 0.02]];
  function biomeOf(u, v) { // linhas do desenho, onduladas
    if (u > 0.60 + (v - 0.3) * 0.25 && v < 0.52 + (u - 0.6) * 0.3) return 5;
    if (v < 0.45 - 0.05 * Math.sin(u * 7) && u > 0.10) return 3;
    if (u < 0.235 + 0.02 * Math.sin(v * 9)) return 1;
    if (u < 0.455 + 0.03 * Math.sin(v * 7)) return 2;
    return 4;
  }
  const BIOME = new Uint8Array(CW * CH);
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
    if (inOld(x, y)) { BIOME[y * CW + x] = 1; continue; }
    const u = x / CW, v = y / CH;
    let val = 9, isl = 9;
    for (const [cx, cy, rx, ry] of LANDS) val = Math.min(val, Math.hypot((u - cx) / rx, (v - cy) / ry));
    for (const [cx, cy, rx, ry] of ISLES) isl = Math.min(isl, Math.hypot((u - cx) / rx, (v - cy) / ry));
    const n = (fbm(x / 26, y / 26, 3) - 0.5) * 0.6 + (fbm(x / 9, y / 9, 4) - 0.5) * 0.32 + (fbm(x / 3.5, y / 3.5, 5) - 0.5) * 0.12;
    const seaEdge = Math.max(0, (16 - y) / 16, (16 - (CW - 1 - x)) / 16) * 0.9; // mar só no norte e no leste; oeste e sul seguem para fora do mapa
    if (!(val + n + seaEdge < 1 || isl + n * 1.3 + seaEdge < 1)) continue;
    BIOME[y * CW + x] = biomeOf(u + (fbm(x / 34, y / 34, 1) - 0.5) * 0.11, v + (fbm(x / 34, y / 34, 2) - 0.5) * 0.11);
    // rodada 109: o Campo transborda do quadro antigo numa faixa ondulada, para a borda dele não virar uma reta entre biomas
    const dOld = Math.max(OX - x, x - (OX + W - 1), OY - y, y - (OY + H - 1));
    if (dOld < 3 + fbm(x / 8, y / 8, 8) * 9 + fbm(x / 3, y / 3, 9) * 3) BIOME[y * CW + x] = 1;
  }
  // centro (média dos tiles) e "raio" (da área) de cada bioma: rótulos do mapa e sorteio dos bandos
  for (const B of BIOMES) { let sx = 0, sy = 0, k = 0; for (let y = 0; y < CH; y += 2) for (let x = 0; x < CW; x += 2) if (BIOME[y * CW + x] === B.n) { sx += x; sy += y; k++; }
    B.c = [Math.round(sx / k), Math.round(sy / k), Math.round(Math.sqrt(k * 4 / Math.PI))]; B.area = k * 4; }
  const biomeAt = (x, y) => (x < 0 || y < 0 || x >= CW || y >= CH ? 0 : BIOME[y * CW + x]);
  const BKEY = [null, "campo", "darkwood", "mountains", "desert", "snow"];
  // região (as do Campo seguem as formas antigas, esticadas para fora do quadro antigo)
  function regionShapeG(x, y) {
    const b = biomeAt(x, y);
    return b === 1 ? regionShape(x - OX, y - OY) : b ? BKEY[b] : "sea";
  }
  // desloca coordenadas do quadro antigo para o continente (objetos com x/y, x0..y1; listas [x, y, ...])
  const sh = (v) => {
    if (Array.isArray(v)) return v.map(sh);
    if (!v || typeof v !== "object") return v;
    const o = {};
    for (const [k, val] of Object.entries(v)) o[k] = (k === "x" || k === "x0" || k === "x1") && typeof val === "number" ? val + OX
      : (k === "y" || k === "y0" || k === "y1") && typeof val === "number" ? val + OY : sh(val);
    return o;
  };
  const MOB_SPAWNS_G = Object.fromEntries(Object.entries(MOB_SPAWNS).map(([k, list]) => [k, list.map(([t, n, home]) => [t, n, home ? sh(home) : home])]));
  const CAMP_G = sh(CAMP);
  // ---------- vilas: a de Lumeira (a antiga) e uma por bioma novo, fora do centro, num quadrado de 17 x 16 todo do bioma ----------
  const VSIZE = { w: 17, h: 16 };
  const VILLAGE_DEF = [
    { key: "breu", biome: 2, name: "Vila do Breu", at: [0.34, 0.58] },
    { key: "escarpa", biome: 3, name: "Forte da Escarpa", at: [0.27, 0.36] },
    { key: "oasis", biome: 4, name: "Oásis de Sal", at: [0.60, 0.58] },
    { key: "degelo", biome: 5, name: "Aldeia do Degelo", at: [0.74, 0.40] },
  ];
  function boxOk(x0, y0, w, h, b) { for (let y = y0 - 2; y < y0 + h + 2; y++) for (let x = x0 - 2; x < x0 + w + 2; x++) if (biomeAt(x, y) !== b) return false; return true; }
  function findBox(cx, cy, w, h, b) { // quadrado mais perto do ponto pedido que cabe inteiro no bioma
    for (let r = 0; r < 60; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const x0 = Math.round(cx + dx - w / 2), y0 = Math.round(cy + dy - h / 2); if (boxOk(x0, y0, w, h, b)) return { x0, y0 };
    }
    return { x0: Math.round(cx - w / 2), y0: Math.round(cy - h / 2) };
  }
  const TOWN_G = sh(TOWN);
  const VILLAGES = [{ key: "lumeira", biome: 1, name: "Vila de Lumeira", ...TOWN_G, main: true }];
  for (const V of VILLAGE_DEF) {
    const p = findBox(V.at[0] * CW, V.at[1] * CH, VSIZE.w, VSIZE.h, V.biome);
    VILLAGES.push({ key: V.key, biome: V.biome, name: V.name, x0: p.x0, y0: p.y0, x1: p.x0 + VSIZE.w - 1, y1: p.y0 + VSIZE.h - 1 });
  }
  const DEPTH = BIOMES.map((B) => { let lo = 1e9, hi = 0; for (let y = 0; y < CH; y += 3) for (let x = 0; x < CW; x += 3) if (BIOME[y * CW + x] === B.n) { const d = Math.hypot(x - TOWN_G.x0 - 8, y - TOWN_G.y0 - 7); lo = Math.min(lo, d); hi = Math.max(hi, d); } return [lo, hi]; });
  const depthAt = (x, y) => { const b = biomeAt(x, y); if (!b) return 0; const [lo, hi] = DEPTH[b - 1]; return Math.max(0, Math.min(1, (Math.hypot(x - TOWN_G.x0 - 8, y - TOWN_G.y0 - 7) - lo) / Math.max(1, hi - lo))); };
  const villageAt = (x, y) => VILLAGES.find((v) => x >= v.x0 && x <= v.x1 && y >= v.y0 && y <= v.y1) || null;
  // ---------- masmorra de cada bioma novo: entrada do lado oposto à vila; chefe no fundo, com a guarda em volta ----------
  const DG_DEF = [
    { key: "dg_darkwood", biome: 2, at: [0.38, 0.86], name: "Covil das Sombras" },
    { key: "dg_mountains", biome: 3, at: [0.48, 0.30], name: "Forja Abandonada" },
    { key: "dg_desert", biome: 4, at: [0.66, 0.84], name: "Tumba do Faraó" },
    { key: "dg_snow", biome: 5, at: [0.88, 0.32], name: "Gruta do Gelo Eterno" },
  ];
  const DG_ENTRIES = DG_DEF.map((D) => { const p = findBox(D.at[0] * CW, D.at[1] * CH, 3, 3, D.biome); return { ...D, x: p.x0 + 1, y: p.y0 + 1 }; });
  // ---------- estradas: da praça de Lumeira até cada vila (o game.js pinta "path" e faz pontes sobre a água) ----------
  const ROADS = VILLAGES.slice(1).map((v) => [{ x: TOWN_G.x0 + 8, y: TOWN_G.y0 + 7 }, { x: Math.round((v.x0 + v.x1) / 2), y: Math.round((v.y0 + v.y1) / 2) }]);
  // ---------- lagos novos (fora do quadro antigo): [cx, cy, raio, cardume, quantos] ----------
  const LAKES_G = [...sh(LAKES.map(([cx, cy, ...r]) => ({ x: cx, y: cy, r }))).map((o) => [o.x, o.y, ...o.r])];
  for (const [b, u, v, r] of [[1, 0.06, 0.48, 5], [1, 0.16, 0.90, 6], [1, 0.20, 0.45, 4.5], [2, 0.30, 0.80, 6], [2, 0.40, 0.55, 5], [3, 0.18, 0.30, 4.5], [3, 0.42, 0.36, 5],
    [4, 0.56, 0.74, 4], [4, 0.70, 0.62, 4.5], [5, 0.80, 0.30, 6], [5, 0.70, 0.30, 4.5],
    [2, 0.27, 0.62, 3], [2, 0.33, 0.92, 3.5], [2, 0.42, 0.72, 3], [3, 0.30, 0.22, 3.5], [4, 0.64, 0.92, 3.5], [4, 0.75, 0.70, 3], [5, 0.86, 0.45, 3.5], [5, 0.66, 0.22, 4]]) {
    const p = findBox(u * CW, v * CH, Math.ceil(r * 2), Math.ceil(r * 2.4), b); if (!inOld(p.x0, p.y0) && !inOld(p.x0 + r * 2, p.y0 + r * 2.4)) LAKES_G.push([p.x0 + r, p.y0 + r * 1.2, r, b >= 3 ? "fishspot_deep" : "fishspot", 2]);
  }
  // ---------- monstros dos biomas novos: [tipo, quantos]; cada tipo em 2-3 bandos; os de nível baixo mais perto do Campo ----------
  const BIOME_MOBS = {
    darkwood: [["shade_wolf", 14], ["wood_spider", 12], ["shade_goblin", 12], ["rot_skeleton", 12], ["shade_wraith", 10], ["corrupt_ent", 9], ["night_alpha", 4]],
    desert: [["sand_slime", 14], ["red_scorpion", 12], ["dune_boar", 12], ["mummy", 12], ["sandstone_golem", 9], ["raider_goblin", 10], ["dune_serpent", 3]],
    mountains: [["gray_wolf", 14], ["stone_boar", 12], ["granite_golem", 10], ["cave_goblin", 12], ["rock_sentinel", 9], ["cave_spider", 10], ["iron_colossus", 3]],
    snow: [["ice_wolf", 14], ["frost_slime", 12], ["blizzard_wraith", 10], ["ice_golem", 9], ["glacial_sentinel", 9], ["frozen_skeleton", 12], ["blizzard_alpha", 3]],
  };
  // bandos extras do Campo crescido (fora do quadro antigo): os mesmos monstros, espalhados nas regiões esticadas
  const CAMPO_EXTRA = { fields: [["slime", 20], ["slime_blue", 10]], east: [["boar", 14], ["goblin", 10]], south: [["wolf", 18], ["wolf_alpha", 4]], west: [["golem", 10], ["slime_crystal", 8]], ruins: [["skeleton", 12]] };
  function homesFor(b, n, seed) { // n pontos de bando no bioma, ordenados do mais perto do Campo ao mais fundo
    const B = BIOMES[b - 1], C = BIOMES[0].c, out = [];
    for (let k = 0, t = 0; out.length < n * 6 && t < 12000; t++, k++) {
      const a = h2(k, seed, 5) * Math.PI * 2, r = Math.sqrt(h2(seed, k, 9)) * B.c[2] * 1.3, x = Math.round(B.c[0] + Math.cos(a) * r), y = Math.round(B.c[1] + Math.sin(a) * r);
      if (biomeAt(x, y) === b && !villageAt(x, y) && !VILLAGES.some((v) => x > v.x0 - 10 && x < v.x1 + 10 && y > v.y0 - 10 && y < v.y1 + 10)) out.push({ x, y, d: Math.hypot(x - C[0], y - C[1]) });
    }
    return out.sort((p, q) => p.d - q.d);
  }
  const BIOME_SPAWNS = {};
  for (const B of BIOMES.slice(1)) {
    const list = BIOME_MOBS[B.key], pts = homesFor(B.n, list.length * 3, B.n * 17), per = Math.floor(pts.length / list.length);
    BIOME_SPAWNS[B.key] = list.flatMap(([t, n], i) => { const k = Math.min(3, Math.max(1, Math.round(n / 5))); // bandos do tipo i na faixa i do caminho
      return Array.from({ length: k }, (_, j) => { const p = pts[Math.min(pts.length - 1, i * per + Math.floor((j + 0.5) * per / k))]; return [t, Math.ceil(n / k), { x: p.x, y: p.y, r: 7 }]; }); });
  }
  // masmorras dos biomas: mesma planta das três antigas, chão e monstros próprios; o chefe no fundo com a guarda em volta
  const dgRooms = { rooms: [[8, 8, 15, 14], [21, 6, 31, 16], [37, 7, 47, 15], [53, 5, 66, 17]], halls: [[15, 10, 21, 11], [31, 10, 37, 11], [47, 10, 53, 11]],
    exit: { x: 9, y: 9 }, start: { x: 10, y: 11 }, chest: { x: 65, y: 11 },
    lightsAt: [[14, 8], [8, 13], [21, 7], [31, 7], [21, 15], [31, 15], [37, 8], [47, 8], [37, 14], [47, 14], [53, 5], [66, 5], [53, 17], [66, 17]] };
  const DG_THEME = {
    dg_darkwood: { floor: ["den_floor", "den_floor_2"], fallbackFloor: ["dirt", "dirt_2"], exitSpr: "deco_den_exit", light: "deco_den_torch", foes: ["sombra", "sombras"], color: "#b78cff",
      mobs: ["rot_skeleton", "shade_wraith", "corrupt_ent"], boss: "shadow_king", enter: "Raízes negras se fecham atrás de você. Algo respira no escuro...", leave: "Você sai do covil para a Floresta Sombria." },
    dg_desert: { floor: ["sand", "stone"], exitSpr: "deco_crypt", light: "deco_brazier", foes: ["morto do deserto", "mortos do deserto"], color: "#f5c26b",
      mobs: ["mummy", "red_scorpion", "sandstone_golem"], boss: "sand_pharaoh", enter: "Areia escorre pelas frestas da tumba. Tochas acendem sozinhas...", leave: "Você volta ao sol do Deserto Rubro." },
    dg_mountains: { floor: ["stone", "dirt"], exitSpr: "deco_crypt", light: "deco_brazier", foes: ["guardião de pedra", "guardiões de pedra"], color: "#c8c8d0",
      mobs: ["granite_golem", "rock_sentinel", "cave_goblin"], boss: "mountain_king", enter: "O calor da forja antiga ainda sobe das pedras...", leave: "Você sai para o vento das Montanhas de Ferro." },
    dg_snow: { floor: ["snow", "snow_2"], fallbackFloor: ["stone", "dirt"], exitSpr: "deco_rift_entrance", light: "deco_rift_brazier", foes: ["criatura do gelo", "criaturas do gelo"], color: "#a8e8ff",
      mobs: ["frozen_skeleton", "glacial_sentinel", "ice_golem"], boss: "frost_serpent", enter: "O frio aqui embaixo morde os ossos. O gelo brilha azul...", leave: "Você volta à neve da Geleira do Norte." },
  };
  DG_DEF.forEach((G, i) => {
    const T = DG_THEME[G.key], [m1, m2, m3] = T.mobs;
    DUNGEONS[G.key] = { name: G.name, floor: T.floor, fallbackFloor: T.fallbackFloor, seed: 105 + i * 7, exitSpr: T.exitSpr, bones: 8,
      rooms: dgRooms.rooms, halls: dgRooms.halls, exit: dgRooms.exit, start: dgRooms.start, chest: dgRooms.chest, loot: "BIOME_CHEST_" + G.biome, event: G.key,
      lights: { spr: T.light, fallback: "deco_brazier", brazier: true, at: dgRooms.lightsAt },
      spawns: [[m1, 3, { x: 13, y: 11 }], [m2, 2, { x: 26, y: 11 }], [m1, 2, { x: 27, y: 13 }], [m3, 1, { x: 42, y: 11 }], [m2, 2, { x: 42, y: 13 }],
        [T.boss, 1, { x: 60, y: 11, r: 1 }], [m3, 2, { x: 58, y: 9, r: 2 }], [m2, 2, { x: 61, y: 14, r: 2 }]], // chefe com a guarda em volta
      enter: T.enter, leave: T.leave, toast: [G.name, "O chefe guarda o fundo, cercado pela guarda. Derrote todos para abrir o baú.", T.color], foes: T.foes };
  });
  const G = { W: CW, H: CH, OX, OY, L, BIOME, BIOMES, BKEY, biomeAt, depthAt, inOld, VILLAGES, villageAt, DG_ENTRIES, ROADS, BIOME_SPAWNS, CAMPO_EXTRA, fbm,
    TOWN: TOWN_G, SPAWN: sh(SPAWN), regionShape: regionShapeG, LAKES: LAKES_G, SIGNS: SIGNS.map(([x, y, l]) => [x + OX, y + OY, l]), CAMP: CAMP_G,
    MOB_SPAWNS: MOB_SPAWNS_G, SPAWN_EDGE, SPAWN_AWAY: { boar: { from: CAMP_G, dist: SPAWN_AWAY.boar.dist } }, CRYPT_ENTRY: sh(CRYPT_ENTRY), DEN_ENTRY: sh(DEN_ENTRY),
    ENTRY_SPR, DUNGEONS, MARKERS: sh(MARKERS), CRACKS: sh(CRACKS), HUT: sh(HUT), TENT: sh(TENT), RUNES: sh(RUNES), MINE: sh(MINE), RIFT_ENTRY: sh(RIFT_ENTRY) };
  L.self = L; G.local = () => L;
  return G;
})();


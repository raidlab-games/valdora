// Valdora — desenho do mundo (rodada 11: saiu do game.js). Só dados e formas: regiões, lagos, placas, acampamento,
// onde nasce cada monstro e as masmorras (salas, corredores, braseiros, baú, monstros, entrada). Quem constrói é o game.js.
window.ValdoraWorld = (() => {
  "use strict";
  // rodada 120: Lumeira com o dobro do tamanho. O quadro antigo (96 x 72) ganha 16 colunas (8 de cada lado da estrada x=48/49)
  // e 15 linhas (7 acima e 8 abaixo da estrada y=36/37). Tudo abaixo continua escrito nas coordenadas de antes e passa por
  // RX/RY; as faixas novas repetem a região da costura (IX/IY), então os campos em volta só se alargam.
  const RX = (x) => x + (x >= 46 ? 8 : 0) + (x >= 50 ? 8 : 0), RY = (y) => y + (y >= 34 ? 7 : 0) + (y >= 39 ? 8 : 0);
  const IX = (x) => (x < 46 ? x : x < 54 ? 45.5 : x < 58 ? x - 8 : x < 66 ? 49.5 : x - 16), IY = (y) => (y < 34 ? y : y < 41 ? 33.5 : y < 46 ? y - 7 : y < 54 ? 38.5 : y - 15);
  const rm = (v) => { // objeto/lista do quadro antigo -> quadro novo
    if (Array.isArray(v)) return v.map(rm);
    if (!v || typeof v !== "object") return v;
    const o = {};
    for (const [k, val] of Object.entries(v)) o[k] = (k === "x" || k === "x0" || k === "x1") && typeof val === "number" ? RX(val) : (k === "y" || k === "y0" || k === "y1") && typeof val === "number" ? RY(val) : rm(val);
    return o;
  };
  const W = 112, H = 87;
  const TOWN = { x0: 41, y0: 29, x1: 72, y1: 58 }, SPAWN = rm({ x: 48, y: 36 });
  // regiões do mapa de cima (bordas onduladas); a vila e as masmorras são decididas antes, no game.js
  const regionShape = (x, y) => regionShape0(IX(x), IY(y));
  function regionShape0(x, y) {
    if (x > 69 + 2 * Math.sin(y * 0.4) && y < 18 + 2 * Math.sin(x * 0.35)) return "ruins";
    if (x < 21 + 2 * Math.sin(y * 0.31)) return "west";
    if (y > 54 + 2 * Math.sin(x * 0.27)) return "south";
    if (x > 69 + 2 * Math.sin(y * 0.23)) return "east";
    return "fields";
  }
  // lagos: [cx, cy, raio, tipo de cardume, quantos cardumes]
  const LAKES = [[34, 23, 4.2, "fishspot", 3], [50, 8, 6.5, "fishspot_deep", 3], [85, 30, 5, "fishspot_deep", 2], [28, 62, 4.5, "fishspot", 2], [12, 40, 4, "fishspot_deep", 2]]
    .map(([x, y, ...r]) => [RX(x), RY(y), ...r]);
  const SIGNS = [[47, 28, "Norte: Lago Grande · Nordeste: Ruínas Esquecidas"], [40, 35, "Oeste: Planalto de Lumita (Combate 18+)"],
    [57, 38, "Leste: Bosque dos Carvalhos e acampamento goblin (Combate 6+)"], [51, 45, "Sul: Mata Sombria, lobos (Combate 12+)"], [70, 20, "Ruínas Esquecidas, perigo! (Combate 15+)"]]
    .map(([x, y, l]) => [RX(x), RY(y), l]);
  const CAMP = rm({ x: 79, y: 46 }); // acampamento goblin no bosque
  // monstros do mapa de cima: [tipo, quantidade, ponto de origem opcional]
  const MOB_SPAWNS = { fields: [["slime", 14], ["slime_blue", 6], ["fox", 3]], east: [["boar", 9], ["slime", 2], ["goblin", 7, CAMP], ["deer", 3]], south: [["wolf", 13], ["wolf_alpha", 2], ["bear", 2]], // rodada 120: um pouco mais (campos mais largos)
    // rodada 19: golems e slimes de lumita agrupados no meio do Planalto (antes espalhados por toda a borda oeste: o robô andava mais do que lutava)
    west: [["golem", 6, rm({ x: 12, y: 28 })], ["slime_crystal", 5, rm({ x: 12, y: 42 })], ["boss_golem", 1, rm({ x: 9, y: 14 })]], ruins: [["skeleton", 8, rm({ x: 74, y: 12 })], ["boss", 1, rm({ x: 84, y: 8 })]] }; // rodada 18: esqueletos na parte oeste das Ruínas, longe do chefe (o robô era puxado para o Senhor)
  // rodada 62: distância mínima (tiles) entre o ponto de nascimento e os Campos/vila, para quem nasce solto pela região.
  // Em 5 mundos, 0 a 7 dos 14 lobos nasciam a até 5 tiles dos Campos e perseguiam iniciantes para dentro deles.
  const SPAWN_EDGE = { wolf: 6, wolf_alpha: 6 };
  // rodada 63: distância mínima (tiles) de um ponto: javalis (caça do Combate 6–9) longe do acampamento goblin
  const SPAWN_AWAY = { boar: { from: CAMP, dist: 8 } };
  const CRYPT_ENTRY = rm({ x: 79, y: 13 });
  const ENTRY_SPR = { crypt: "deco_crypt", den: "deco_den" }; // arte da entrada no mapa de cima (com reserva deco_crypt)
  const DEN_ENTRY = rm({ x: 60, y: 63 }); // Toca dos Lobos, na Mata Sombria (o game.js procura o tile livre mais perto)
  // rodada 78: campanha (Ato I). Marcos de lumita (o jogo procura o tile livre mais perto, depois de todo o sorteio do mundo)
  // e fendas dos Campos (não ocupam tile: só desenho no chão e clique). O Marco do Planalto já existe (enfeite do ponto dos golems).
  const MARKERS = rm({ fields: { name: "Marco dos Campos", x: 30, y: 33 }, east: { name: "Marco do Bosque", x: 75, y: 40 }, south: { name: "Marco da Mata", x: 36, y: 64 },
    ruins: { name: "Marco das Ruínas", x: 73, y: 15 }, west: { name: "Coração de lumita", x: 14, y: 18, heart: true } }); // rodada 80/81
  const RIFT_ENTRY = rm({ x: 5, y: 22 }); // rodada 82: entrada da Fenda Cintilante (rodada 84: saiu de (6,9), a ~6 tiles do Golem Ancião)
  const MINE = rm({ x: 18, y: 33, bras: { x: 19, y: 35 } }); // rodada 81: acampamento do Brás (3x2) e onde ele fica, na subida do Planalto
  const TENT = rm({ x: 62, y: 16, odilia: { x: 63, y: 19 } }); // rodada 80: tenda da Odília (3x2) e onde ela fica, na saída nordeste dos Campos
  // rodada 81: as duas do leste saíram de perto da arena do Senhor das Ruínas (robô: 4 de 10 mortes no Combate 18)
  const RUNES = rm([{ x: 72, y: 8 }, { x: 78, y: 4 }, { x: 91, y: 16 }, { x: 78, y: 16 }]); // rodada 80: colunas com inscrições (o jogo procura o tile livre mais perto)
  const HUT = rm({ x: 40, y: 56, juna: { x: 44, y: 58 } }); // rodada 79: cabana da Juna (3x2) e onde ela fica, na entrada da Mata Sombria
  const CRACKS = rm([{ x: 27, y: 43 }, { x: 40, y: 20 }, { x: 64, y: 29 }]); // fora da margem de 6 tiles da vila (onde nada nasce)

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
    MARKERS, CRACKS, HUT, TENT, RUNES, MINE, RIFT_ENTRY, RX, RY, rm };
  // rodada 120: biomas 50% maiores (o desenho de 520 x 400 cresce 22% em cada lado: IW x IH) e mar nos 4 lados. O desenho fica
  // no "miolo" (u, v de 0 a 1); em volta, a margem de mar (mais larga a oeste e ao sul, onde antes a terra saía do mapa).
  const SC = 1.22, IW = Math.round(520 * SC), IH = Math.round(400 * SC), MW = 46, MN = 14, ME = 20, MS = 46;
  const CW = IW + MW + ME, CH = IH + MN + MS, OX = MW + Math.round(34 * SC), OY = MN + Math.round(236 * SC);
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
  const UX = (x) => (x - MW) / IW, VY = (y) => (y - MN) / IH, XU = (u) => MW + u * IW, YV = (v) => MN + v * IH; // miolo <-> mapa
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
  // rodada 120: pontas de terra que entram no mar (oeste e leste) e ilhas novas nas margens: [x, y, raio x, raio y] em frações do mapa todo
  const CAPES = [[0.06, 0.30, 0.085, 0.04], [0.02, 0.315, 0.035, 0.022], [0.065, 0.70, 0.09, 0.045], [0.022, 0.72, 0.04, 0.02], [0.14, 0.97, 0.05, 0.03],
    [0.965, 0.58, 0.06, 0.035], [0.985, 0.585, 0.035, 0.016], [0.95, 0.26, 0.05, 0.03], [0.62, 0.975, 0.045, 0.028]];
  const ISLES_M = [[0.025, 0.47, 0.016, 0.03], [0.035, 0.88, 0.022, 0.018], [0.40, 0.985, 0.03, 0.01], [0.84, 0.975, 0.03, 0.012]];
  const BIOME = new Uint8Array(CW * CH);
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
    if (inOld(x, y)) { BIOME[y * CW + x] = 1; continue; }
    const u = UX(x), v = VY(y), uc = Math.max(0, u), vc = Math.min(1, v); // a oeste e ao sul do miolo, a terra segue a borda dele até o litoral
    let val = 9, isl = 9;
    for (const [cx, cy, rx, ry] of LANDS) val = Math.min(val, Math.hypot((uc - cx) / rx, (vc - cy) / ry));
    for (const [cx, cy, rx, ry] of ISLES) isl = Math.min(isl, Math.hypot((u - cx) / rx, (v - cy) / ry));
    const n = (fbm(x / 26, y / 26, 3) - 0.5) * 0.6 + (fbm(x / 9, y / 9, 4) - 0.5) * 0.32 + (fbm(x / 3.5, y / 3.5, 5) - 0.5) * 0.12;
    // mar no norte e no leste do miolo (como antes) e litoral nos 4 lados do mapa (oeste e sul com recortes largos)
    const seaIn = Math.max(0, (16 - (y - MN)) / 16, (16 - (MW + IW - 1 - x)) / 16) * 0.9;
    const dW = x / (MW * 0.95), dS = (CH - 1 - y) / (MS * 0.95), dE = (CW - 1 - x) / ME, dN = y / MN;
    const seaOut = Math.max(0, 1.75 - Math.min(dW, dS) * (0.8 + fbm(x / 34, y / 34, 14) * 0.75)) * 1.6 + Math.max(0, 1 - Math.min(dE, dN)) * 2;
    let cape = 9; for (const [cx, cy, rx, ry] of CAPES) cape = Math.min(cape, Math.hypot((x / CW - cx) / rx, (y / CH - cy) / ry));
    for (const [cx, cy, rx, ry] of ISLES_M) isl = Math.min(isl, Math.hypot((x / CW - cx) / rx, (y / CH - cy) / ry));
    const rim = Math.max(0, 1 - Math.min(x, y, CW - 1 - x, CH - 1 - y) / 5) * 2; // sempre mar nos 5 tiles da borda
    if (!(val + n + seaIn + seaOut < 1 || isl + n * 1.3 + seaIn + rim < 1 || cape + n * 0.9 + rim < 1)) continue;
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
  const VSIZE = { w: 34, h: 32 }; // rodada 120: o dobro (era 17 x 16)
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
    const p = findBox(XU(V.at[0]), YV(V.at[1]), VSIZE.w, VSIZE.h, V.biome);
    VILLAGES.push({ key: V.key, biome: V.biome, name: V.name, x0: p.x0, y0: p.y0, x1: p.x0 + VSIZE.w - 1, y1: p.y0 + VSIZE.h - 1 });
  }
  const TCX = (TOWN_G.x0 + TOWN_G.x1) >> 1, TCY = (TOWN_G.y0 + TOWN_G.y1) >> 1; // centro da praça de Lumeira
  const DEPTH = BIOMES.map((B) => { let lo = 1e9, hi = 0; for (let y = 0; y < CH; y += 3) for (let x = 0; x < CW; x += 3) if (BIOME[y * CW + x] === B.n) { const d = Math.hypot(x - TCX, y - TCY); lo = Math.min(lo, d); hi = Math.max(hi, d); } return [lo, hi]; });
  const depthAt = (x, y) => { const b = biomeAt(x, y); if (!b) return 0; const [lo, hi] = DEPTH[b - 1]; return Math.max(0, Math.min(1, (Math.hypot(x - TCX, y - TCY) - lo) / Math.max(1, hi - lo))); };
  const villageAt = (x, y) => VILLAGES.find((v) => x >= v.x0 && x <= v.x1 && y >= v.y0 && y <= v.y1) || null;
  // ---------- masmorra de cada bioma novo: entrada do lado oposto à vila; chefe no fundo, com a guarda em volta ----------
  const DG_DEF = [
    { key: "dg_darkwood", biome: 2, at: [0.38, 0.86], name: "Covil das Sombras" },
    { key: "dg_mountains", biome: 3, at: [0.48, 0.30], name: "Forja Abandonada" },
    { key: "dg_desert", biome: 4, at: [0.66, 0.84], name: "Tumba do Faraó" },
    { key: "dg_snow", biome: 5, at: [0.88, 0.32], name: "Gruta do Gelo Eterno" },
  ];
  const DG_ENTRIES = DG_DEF.map((D) => { const p = findBox(XU(D.at[0]), YV(D.at[1]), 3, 3, D.biome); return { ...D, x: p.x0 + 1, y: p.y0 + 1 }; });
  // ---------- estradas: da praça de Lumeira até cada vila (o game.js pinta "path" e faz pontes sobre a água) ----------
  const ROADS = VILLAGES.slice(1).map((v) => [{ x: TCX, y: TCY }, { x: Math.round((v.x0 + v.x1) / 2), y: Math.round((v.y0 + v.y1) / 2) }]);
  // ---------- rodada 120: cais (2 por bioma, 10 no mapa) para o sistema de barcos ----------
  // Um tile de litoral com terra firme atrás e mar aberto à frente (largo o bastante para o píer de 2 tiles e um barco).
  // O primeiro cais de cada bioma é o mais perto da vila dele; o segundo, o mais longe do primeiro (outra costa).
  const DOCK_LEN = 6;
  const MAIN = new Uint8Array(CW * CH); { // continente (sem as ilhas): só ali o cais tem estrada até ele
    const q = [TCY * CW + TCX]; MAIN[q[0]] = 1;
    while (q.length) { const i = q.pop(), x = i % CW, y = (i / CW) | 0;
      for (const j of [i - 1, i + 1, i - CW, i + CW]) if (j >= 0 && j < CW * CH && !MAIN[j] && BIOME[j] && Math.abs(j % CW - x) + Math.abs(((j / CW) | 0) - y) === 1) { MAIN[j] = 1; q.push(j); } }
  }
  const DOCK_NAMES = { 1: [["Porto de Lumeira", "Mestre Anselmo"], ["Cais da Ponta Oeste", "Marujo Faustino"]], 2: [["Cais do Breu", "Barqueira Iolanda"], ["Cais da Névoa", "Velho Teodoro"]],
    3: [["Porto da Escarpa", "Contramestre Bruno"], ["Cais do Norte", "Pescadora Rute"]], 4: [["Porto do Sal", "Capitã Yara"], ["Cais das Dunas", "Marujo Kadu"]],
    5: [["Porto do Degelo", "Mestre Haldor"], ["Cais da Aurora", "Pescadora Sigrid"]] };
  function dockSpots(b, st = 2) {
    const out = [], sea = (x, y) => x >= 0 && y >= 0 && x < CW && y < CH && !BIOME[y * CW + x];
    for (let y = 8; y < CH - 8; y += st) for (let x = 8; x < CW - 8; x += st) {
      if (BIOME[y * CW + x] !== b || !MAIN[y * CW + x] || inOld(x, y) || VILLAGES.some((v) => x > v.x0 - 14 && x < v.x1 + 14 && y > v.y0 - 14 && y < v.y1 + 14)) continue;
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        if (!sea(x + dx, y + dy)) continue;
        const px = dy ? 1 : 0, py = dx ? 1 : 0; let ok = true; // largura do píer: (x, y) e (x + px, y + py)
        for (let k = 1; k <= DOCK_LEN + 3 && ok; k++) for (let s = -2; s <= 3 && ok; s++) if (!sea(x + dx * k + px * s, y + dy * k + py * s)) ok = false;
        for (let k = 0; k <= 3 && ok; k++) for (let s = -1; s <= 2 && ok; s++) if (BIOME[(y - dy * k + py * s) * CW + x - dx * k + px * s] !== b) ok = false;
        if (ok) { out.push({ x, y, dx, dy }); break; }
      }
    }
    return out;
  }
  // rodada 121: no litoral sul, Breu, Névoa e Dunas ficavam colados; o segundo cais da Mata Sombria vai para o meio da costa dela
  // e o do deserto para a ponta leste da costa sul (o ponto válido mais perto do alvo, varrendo tile a tile)
  const DOCK_AT = { 2: [304, 492], 4: [516, 464] };
  const DOCKS = [], SPOTS = {};
  for (const B of BIOMES) {
    const c = SPOTS[B.n] = dockSpots(B.n); if (!c.length) continue;
    const v = VILLAGES.find((V) => V.biome === B.n), vx = (v.x0 + v.x1) / 2, vy = (v.y0 + v.y1) / 2;
    const a = c.reduce((p, q) => (Math.hypot(q.x - vx, q.y - vy) < Math.hypot(p.x - vx, p.y - vy) ? q : p));
    const far = c.filter((q) => Math.hypot(q.x - a.x, q.y - a.y) > 36);
    let z = far.length ? far.reduce((p, q) => (Math.hypot(q.x - a.x, q.y - a.y) > Math.hypot(p.x - a.x, p.y - a.y) ? q : p)) : null;
    const T = DOCK_AT[B.n], fine = T ? dockSpots(B.n, 1) : [];
    if (fine.length) z = fine.reduce((p, q) => (Math.hypot(q.x - T[0], q.y - T[1]) < Math.hypot(p.x - T[0], p.y - T[1]) ? q : p));
    for (const [i, d] of [a, z].entries()) if (d) DOCKS.push({ ...d, biome: B.n, key: "dock_" + B.key + i, name: DOCK_NAMES[B.n][i][0], keeper: DOCK_NAMES[B.n][i][1], len: DOCK_LEN });
  }
  const EXTRA_DOCK = [["Cais do Farol", "Faroleiro Benedito"], ["Cais da Enseada", "Pescador Jonas"], ["Cais Velho", "Marujo Tibério"]];
  for (let e = 0; DOCKS.length < 10 && e < EXTRA_DOCK.length; e++) { // bioma de costa curta: o que falta vai para o litoral mais longe de todos os cais
    let best = null, bd = 0;
    for (const B of BIOMES) for (const q of SPOTS[B.n] || []) { const d = Math.min(...DOCKS.map((D) => Math.hypot(D.x - q.x, D.y - q.y))); if (d > bd) { bd = d; best = { ...q, biome: B.n }; } }
    if (!best) break; DOCKS.push({ ...best, key: "dock_x" + e, name: EXTRA_DOCK[e][0], keeper: EXTRA_DOCK[e][1], len: DOCK_LEN });
  }
  // ---------- lagos novos (fora do quadro antigo): [cx, cy, raio, cardume, quantos] ----------
  const LAKES_G = [...sh(LAKES.map(([cx, cy, ...r]) => ({ x: cx, y: cy, r }))).map((o) => [o.x, o.y, ...o.r])];
  for (let [b, u, v, r] of [[1, 0.06, 0.48, 5], [1, 0.16, 0.90, 6], [1, 0.20, 0.45, 4.5], [2, 0.30, 0.80, 6], [2, 0.40, 0.55, 5], [3, 0.18, 0.30, 4.5], [3, 0.42, 0.36, 5],
    [4, 0.56, 0.74, 4], [4, 0.70, 0.62, 4.5], [5, 0.80, 0.30, 6], [5, 0.70, 0.30, 4.5],
    [2, 0.27, 0.62, 3], [2, 0.33, 0.92, 3.5], [2, 0.42, 0.72, 3], [3, 0.30, 0.22, 3.5], [4, 0.64, 0.92, 3.5], [4, 0.75, 0.70, 3], [5, 0.86, 0.45, 3.5], [5, 0.66, 0.22, 4],
    [1, 0.02, 0.60, 4], [1, 0.10, 0.98, 4], [2, 0.36, 0.98, 4], [3, 0.55, 0.26, 4], [4, 0.82, 0.84, 4], [5, 0.92, 0.40, 4]]) {
    r *= 1.15; const p = findBox(XU(u), YV(v), Math.ceil(r * 2), Math.ceil(r * 2.4), b); // rodada 120: lagos acompanham os biomas maiores if (!inOld(p.x0, p.y0) && !inOld(p.x0 + r * 2, p.y0 + r * 2.4)) LAKES_G.push([p.x0 + r, p.y0 + r * 1.2, r, b >= 3 ? "fishspot_deep" : "fishspot", 2]);
  }
  // ---------- monstros dos biomas novos: [tipo, quantos]; cada tipo em 2-3 bandos; os de nível baixo mais perto do Campo ----------
  const BIOME_MOBS = {
    // rodada 120: com as espécies novas (raposas, cervos, ursos), na ordem do nível
    darkwood: [["shade_wolf", 14], ["dark_deer", 10], ["wood_spider", 12], ["shade_goblin", 12], ["rot_skeleton", 12], ["shade_wraith", 10], ["dark_bear", 7], ["corrupt_ent", 9], ["night_alpha", 4]],
    desert: [["sand_slime", 14], ["sand_fox", 10], ["red_scorpion", 12], ["dune_boar", 12], ["mummy", 12], ["sandstone_golem", 9], ["raider_goblin", 10], ["dune_serpent", 3]],
    mountains: [["gray_wolf", 14], ["rock_fox", 10], ["stone_boar", 12], ["granite_golem", 10], ["cave_goblin", 12], ["mountain_bear", 7], ["rock_sentinel", 9], ["cave_spider", 10], ["iron_colossus", 3]],
    snow: [["ice_wolf", 14], ["arctic_fox", 10], ["frost_slime", 12], ["ice_elk", 8], ["blizzard_wraith", 10], ["ice_golem", 9], ["polar_bear", 7], ["glacial_sentinel", 9], ["frozen_skeleton", 12], ["blizzard_alpha", 3]],
  };
  // bandos extras do Campo crescido (fora do quadro antigo): os mesmos monstros, espalhados nas regiões esticadas
  // rodada 120: 60% a mais (biomas maiores e mais gente online)
  const CAMPO_EXTRA = { fields: [["slime", 32], ["slime_blue", 16], ["fox", 12]], east: [["boar", 22], ["goblin", 16], ["deer", 12], ["fox", 6]], south: [["wolf", 28], ["wolf_alpha", 6], ["deer", 8], ["bear", 7]],
    west: [["golem", 16], ["slime_crystal", 13]], ruins: [["skeleton", 19]] };
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
    // rodada 120: bandos 50% maiores e em até 4 lugares; e monstros avulsos (sozinhos, cada um com casa própria) espalhados pela
    // mesma faixa de nível do tipo, para o bioma maior não ter trechos vazios
    const list = BIOME_MOBS[B.key], pts = homesFor(B.n, list.length * 3, B.n * 17), per = Math.floor(pts.length / list.length);
    BIOME_SPAWNS[B.key] = list.flatMap(([t, n0], i) => { const n = Math.round(n0 * 1.5), k = Math.min(4, Math.max(1, Math.round(n / 5))); // bandos do tipo i na faixa i do caminho
      const packs = Array.from({ length: k }, (_, j) => { const p = pts[Math.min(pts.length - 1, i * per + Math.floor((j + 0.5) * per / k))]; return [t, Math.ceil(n / k), { x: p.x, y: p.y, r: 8 }]; });
      const solo = n0 <= 4 ? [] : Array.from({ length: Math.round(n0 * 0.5) }, (_, j) => { const p = pts[Math.min(pts.length - 1, i * per + Math.floor(h2(j, i, B.n + 40) * per))];
        return [t, 1, { x: p.x + Math.round((h2(i, j, 71) - 0.5) * 16), y: p.y + Math.round((h2(j, i, 72) - 0.5) * 16), r: 5 }]; });
      return [...packs, ...solo]; });
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
  const G = { W: CW, H: CH, OX, OY, L, BIOME, BIOMES, BKEY, biomeAt, depthAt, inOld, VILLAGES, villageAt, DG_ENTRIES, ROADS, BIOME_SPAWNS, CAMPO_EXTRA, fbm, DOCKS,
    TOWN: TOWN_G, SPAWN: sh(SPAWN), regionShape: regionShapeG, LAKES: LAKES_G, SIGNS: SIGNS.map(([x, y, l]) => [x + OX, y + OY, l]), CAMP: CAMP_G,
    MOB_SPAWNS: MOB_SPAWNS_G, SPAWN_EDGE, SPAWN_AWAY: { boar: { from: CAMP_G, dist: SPAWN_AWAY.boar.dist } }, CRYPT_ENTRY: sh(CRYPT_ENTRY), DEN_ENTRY: sh(DEN_ENTRY),
    ENTRY_SPR, DUNGEONS, MARKERS: sh(MARKERS), CRACKS: sh(CRACKS), HUT: sh(HUT), TENT: sh(TENT), RUNES: sh(RUNES), MINE: sh(MINE), RIFT_ENTRY: sh(RIFT_ENTRY) };
  L.self = L; G.local = () => L;
  return G;
})();


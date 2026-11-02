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
  return { W, H, TOWN, SPAWN, regionShape, LAKES, SIGNS, CAMP, MOB_SPAWNS, SPAWN_EDGE, SPAWN_AWAY, CRYPT_ENTRY, DEN_ENTRY, ENTRY_SPR, DUNGEONS, MARKERS, CRACKS, HUT, TENT, RUNES, MINE, RIFT_ENTRY };
})();

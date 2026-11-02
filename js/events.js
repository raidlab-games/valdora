// Valdora — eventos do mundo (rodada 20: saiu do game.js): invasão goblin na estrada, cardume dourado num lago fundo e,
// à noite, a Lua cheia com o Alfa e a matilha. Um evento por vez; o próximo começa 4–6 min depois do fim do anterior.
window.ValdoraEvents = (() => {
  "use strict";
  // rodada 92: lobo comum que sai de cena quando a Lua cheia começa perto dele (robô: o Alfa com a matilha da toca somava até 7 lobos)
  const yieldsToMoon = (m, home) => m.type === "wolf" && !m.temp && !m.dead && Math.abs(m.x - home.x) + Math.abs(m.y - home.y) <= 7;
  function create(api) {
    const { spawnMob, announce, log, showToast, addItem, dropItem, gainXp, SND, LIGHT, rand, checkAch } = api;
    const $ = (id) => document.getElementById(id);
    let event = null, eventT = 200;
    function startEvent() {
      const spots = api.resources().filter((o) => o.lake && o.kind === "fishspot_deep");
      const wolves = api.mobs().filter((m) => m.type === "wolf" && !m.temp);
      const balada = api.player().quests.balada && !api.player().quests.balada.done; // com a missão do Tomé, a lua cheia vem mais vezes
      if (LIGHT.darkness(api.player().dayT) > 0.4 && wolves.length && rand() < (balada ? 0.85 : 0.5)) return startMoon(wolves[Math.floor(rand() * wolves.length)]); // só à noite
      if (rand() < 0.5 || !spots.length) {
        let n = 0; for (let i = 0; i < 5; i++) if (spawnMob("goblin", "fields", { x: ValdoraWorld.L.RX(65) + ValdoraWorld.OX, y: ValdoraWorld.L.RY(36) + ValdoraWorld.OY }, null, { temp: true, raid: true })) n++;
        event = { kind: "raid", t: 180, total: n };
        announce("Invasão goblin!", "Saqueadores bloqueiam a estrada do leste. Derrote todos em 3 minutos (Combate 10 ou mais recomendado).");
      } else {
        const o = spots[Math.floor(rand() * spots.length)]; o.golden = 90; event = { kind: "gold", t: 90, spot: o, left: 6 };
        announce("Cardume dourado!", "Seis peixes dourados num lago fundo, por 90 segundos. Valem 60 moedas cada!");
      }
    }
    function startMoon(w) { // evento Lua cheia: Alfa da lua cheia e três lobos perto de uma toca
      const home = { x: w.hx, y: w.hy };
      for (const m of api.mobs()) if (yieldsToMoon(m, home)) { m.dead = true; m.respawnT = 180; } // rodada 92: os lobos da toca abrem espaço e voltam em 3 min
      const alpha = spawnMob("wolf_moon", "south", home, null, { temp: true, moon: true, howlPending: true });
      if (!alpha) return;
      for (let i = 0; i < 3; i++) spawnMob("wolf", "south", home, null, { temp: true, moon: true });
      event = { kind: "moon", t: 180, alpha };
      announce("Lua cheia!", "O Alfa da lua cheia uiva na Mata Sombria. Derrote-o antes do amanhecer (3 min).", "icon_moon_64");
    }
    function updateEvent(dt) {
      if (!event) { // rodada 34: com a balada do Tomé ativa, a Lua cheia chega 4x mais rápido à noite (a missão levava 23–49 min de espera)
        const P = api.player(), q = P.quests.balada, u = P.quests.c2_uivo; // rodada 79: "O uivo sob a lua" (Ato II) também chama a Lua cheia
        const fast = ((q && !q.done) || (u && !u.done && u.step === 0)) && LIGHT.darkness(P.dayT) > 0.4; // rodada 35: o atalho só vale para a Lua cheia
        if ((eventT -= dt * (fast ? 4 : 1)) <= 0) { const wolves = fast && api.mobs().filter((m) => m.type === "wolf" && !m.temp); if (wolves && wolves.length) startMoon(wolves[Math.floor(rand() * wolves.length)]); else startEvent(); }
        return; }
      event.t -= dt;
      let done = false;
      if (event.kind === "raid") {
        const left = api.mobs().filter((m) => m.raid && !m.dead).length;
        if (left === 0) {
          done = true; api.player().coins += 100; api.player().stats.raids++; if (!addItem("Poção de força")) dropItem("Poção de força", 1, api.player().x, api.player().y);
          showToast("Estrada salva!", "+100 moedas e uma poção de força.", "#7dff9a"); SND.play("quest"); log("A invasão goblin foi contida! +100 moedas e uma poção de força.", "gold"); checkAch();
        } else if (event.t <= 0) { done = true; for (const m of api.mobs()) if (m.raid && !m.dead) { m.dead = true; m.respawnT = 0; } log("Os goblins fugiram com o saque.", "dim"); }
        $("event").textContent = `Invasão goblin: ${left}/${event.total} · ${Math.max(0, Math.ceil(event.t))} s`;
      } else if (event.kind === "moon") {
        if (event.alpha.dead) {
          done = true; api.player().coins += 150; gainXp("combate", 400); if (!addItem("Presa lunar")) dropItem("Presa lunar", 1, api.player().x, api.player().y);
          showToast("A lua se acalma", "+150 moedas, 400 xp de Combate e uma Presa lunar.", "#b8d8ff"); SND.play("quest"); log("O Alfa da lua cheia caiu! +150 moedas, 400 xp de Combate e uma Presa lunar.", "gold");
        } else if (event.t <= 0) { done = true; for (const m of api.mobs()) if (m.moon && !m.dead) { m.dead = true; m.respawnT = 0; } log("A matilha some na névoa da madrugada.", "dim"); }
        $("event").innerHTML = `${ASSETS.icon_moon ? `<img class="eicon" src="${ASSETS.icon_moon}" alt="">` : ""}Lua cheia: derrote o Alfa · ${Math.max(0, Math.ceil(event.t))} s`;
      } else {
        event.spot.golden = event.t;
        if (event.t <= 0 || event.left <= 0) { done = true; event.spot.golden = 0; log(event.left <= 0 ? "Você pescou todo o cardume dourado!" : "O cardume dourado sumiu nas profundezas.", event.left <= 0 ? "gold" : "dim"); }
        $("event").textContent = `Cardume dourado: ${event.left} peixes · ${Math.max(0, Math.ceil(event.t))} s`;
      }
      $("event").hidden = done;
      if (done) { event = null; eventT = 240 + rand() * 120; }
    }
    const reset = () => { event = null; eventT = 150 + rand() * 90; };
    return { startEvent, startMoon, updateEvent, reset, current: () => event, force: () => { event = null; eventT = 0; } };
  }
  return { create, yieldsToMoon };
})();

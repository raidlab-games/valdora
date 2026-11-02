// Valdora — campanha "Os Marcos de Lumeira" no mundo (rodada 78). As missões ficam em js/quests.js (dados em VD.QUESTS, com act);
// aqui fica o que a campanha põe no mapa: os marcos (apagados ou acesos), as fendas dos Campos, a onda de criaturas no marco,
// o Capataz Rasgo no acampamento, a bênção do marco (vida volta mais rápido), as pedras de passagem (viagem) e os indicadores
// de objetivo (marca sobre o alvo, estrela no minimapa e seta na borda da tela).
// Tudo o que é "aceso" ou "liberado" sai do estado das missões (player.quests): não há save novo.
window.ValdoraCampaign = (() => {
  "use strict";
  const { MARKERS, CRACKS, CAMP, HUT, TENT, RUNES, MINE, RIFT_ENTRY } = ValdoraWorld;
  const STELE = ["moon", "eye", "spiral", "crown"]; // rodada 80: símbolo de cada estela
  // regras puras (testadas em tests.html com um jogador de mentira)
  const qs = (p, id) => p.quests[id];
  const stepIs = (p, id, i) => { const q = qs(p, id); return !!q && !q.done && q.step === i; };
  const past = (p, id, i) => { const q = qs(p, id); return !!q && (q.done || q.step >= i); };
  const rules = {
    lit: (p, key) => key === "fields" ? past(p, "c1_marco", 2) : key === "east" ? past(p, "c1_bando", 4) : key === "south" ? past(p, "c2_marco", 2) : key === "ruins" ? past(p, "c3_guardiao", 2) : key === "west" ? past(p, "c4_guardiao", 2) : false,
    shine: (p, key) => key === "fields" ? past(p, "c1_marco", 1) : key === "south" ? past(p, "c2_marco", 1) : rules.lit(p, key), // o cristal acende (fraco) já durante a onda
    // rodada 80: inscrições das Ruínas: "open" (pode copiar), "lit" (copiada ou ato concluído) ou "dim"
    rune: (p, i) => { const q = qs(p, "c3_inscricoes"); if (!q) return "dim"; if (q.done || (q.seen || []).includes(i)) return "lit"; return q.step === 1 ? "open" : "dim"; },
    sealLit: (p) => past(p, "c5_serpente", 2), // rodada 83
    // rodada 87: zona segura da Juna (como a do Brás): lobos e alfas não atacam por conta própria a até 8 tiles dela
    calmJuna: (m, juna) => !!juna && (m.type === "wolf" || m.type === "wolf_alpha") && !m.moon && Math.hypot(m.x - juna.x, m.y - juna.y) < 8,
    calmCamp: (m, bras) => !!bras && m.type === "golem" && Math.hypot(m.x - bras.x, m.y - bras.y) < 7, // rodada 82: o turno conhece o Brás
    calmWest: (p, m, marker) => !!marker && rules.lit(p, "west") && (m.type === "golem" || m.type === "slime_crystal") && Math.hypot(m.x - marker.x, m.y - marker.y) < 9, // rodada 81
    calmEast: (p, m, marker) => !!marker && rules.lit(p, "east") && m.type === "goblin" && Math.hypot(m.x - marker.x, m.y - marker.y) < 9, // rodada 93: o Marco do Bosque, como os outros
    // rodada 94: lobo da região (não da leva) perto do Marco da Mata quando a matilha sobe: sai de cena por 3 min
    yieldsToWave: (m, marker) => (m.type === "wolf" || m.type === "wolf_alpha") && !m.temp && !m.wave && !m.dead && Math.hypot(m.x - marker.x, m.y - marker.y) < 9,
    calmRuins: (p, m, marker) => !!marker && rules.lit(p, "ruins") && m.type === "skeleton" && Math.hypot(m.x - marker.x, m.y - marker.y) < 9,
    alchemy: (p) => !!(qs(p, "c2_raizes") && qs(p, "c2_raizes").done), // rodada 79
    // rodada 79: Marco da Mata aceso: lobos comuns e alfas não atacam por conta própria a até 9 tiles dele
    calm: (p, m, marker) => !!marker && rules.lit(p, "south") && (m.type === "wolf" || m.type === "wolf_alpha") && Math.hypot(m.x - marker.x, m.y - marker.y) < 9,
    travel: (p) => !!(qs(p, "c1_bando") && qs(p, "c1_bando").done),
    // fendas: abertas com "O tremor da madrugada" no passo 1 e ainda não examinadas; cicatriz até o marco dos Campos acender
    crack: (p, i) => { const q = qs(p, "c1_tremor"); if (!q) return null; if (!q.done && q.step === 0 && !(q.seen || []).includes(i)) return "open";
      return past(p, "c1_marco", 2) ? null : "sealed"; },
    wave: (p) => stepIs(p, "c1_marco", 1), waveSouth: (p) => stepIs(p, "c2_marco", 1), capataz: (p) => stepIs(p, "c1_bando", 2),
  };
  function create(api) {
    const { TILE, ctx, cam, SPR } = api;
    const QS = VD.QUESTS, MOBS = VD.MOBS;
    const markers = {}, runes = []; // key → objeto do mapa; inscrições (rodada 80)
    let flash = 0, spawnT = 0;
    const P = () => api.player();

    // ---------- mapa ----------
    function place(deco, free, npc) { // no fim do genWorld: depois de todo o sorteio, então o mundo fixo das medições não muda
      for (const k of Object.keys(markers)) delete markers[k];
      // rodada 79: cabana da Juna (3x2, a arte sobe uma linha) e a Juna na frente
      if (SPR.house_juna && [0, 1, 2].every((dx) => free(HUT.x + dx, HUT.y) && free(HUT.x + dx, HUT.y + 1))) deco("hut", "house_juna", HUT.x, HUT.y, 3, 2);
      if (npc && SPR.npc_juna && free(HUT.juna.x, HUT.juna.y)) npc.herb = deco("herb", "npc_juna", HUT.juna.x, HUT.juna.y, 1, 1, { name: "Juna" });
      // rodada 82: entrada da Fenda Cintilante (masmorra), no alto do Planalto
      if (SPR.deco_rift_entrance) { let done = false; for (let r = 0; r <= 4 && !done; r++) for (let dy = -r; dy <= r && !done; dy++) for (let dx = -r; dx <= r && !done; dx++) {
        const x = RIFT_ENTRY.x + dx, y = RIFT_ENTRY.y + dy; if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || !free(x, y) || !free(x, y + 1)) continue;
        if (npc) npc.rift = deco("rift", "deco_rift_entrance", x, y, 1, 1); done = true; } }
      // rodada 81: acampamento do Brás e o Brás
      // procura em anel (até 4 tiles) um 3x2 livre com o tile da frente livre para o Brás (a encosta tem pedras e árvores)
      let mc = null;
      for (let r = 0; r <= 4 && !mc; r++) for (let dy = -r; dy <= r && !mc; dy++) for (let dx = -r; dx <= r && !mc; dx++) {
        const x = MINE.x + dx, y = MINE.y + dy; if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        if ([0, 1, 2].every((k) => free(x + k, y) && free(x + k, y + 1)) && free(x + 1, y + 2)) mc = { x, y };
      }
      if (mc && SPR.camp_bras) deco("camp", "camp_bras", mc.x, mc.y, 3, 2);
      if (mc && npc && SPR.npc_bras) npc.miner = deco("miner", "npc_bras", mc.x + 1, mc.y + 2, 1, 1, { name: "Brás" });
      // rodada 80: tenda e Odília; inscrições nas colunas das Ruínas
      if (SPR.tent_odilia && [0, 1, 2].every((dx) => free(TENT.x + dx, TENT.y) && free(TENT.x + dx, TENT.y + 1))) deco("tent", "tent_odilia", TENT.x, TENT.y, 3, 2);
      if (npc && SPR.npc_odilia && free(TENT.odilia.x, TENT.odilia.y)) npc.carto = deco("carto", "npc_odilia", TENT.odilia.x, TENT.odilia.y, 1, 1, { name: "Odília" });
      runes.length = 0;
      RUNES.forEach((R, i) => { for (let r = 0; r <= 3; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (runes[i] || Math.max(Math.abs(dx), Math.abs(dy)) !== r || !free(R.x + dx, R.y + dy) || !free(R.x + dx, R.y + dy + 1)) continue;
        runes[i] = deco("rune", `deco_stele_${STELE[i]}_dim`, R.x + dx, R.y + dy, 1, 1, { i }); } });
      for (const [key, M] of Object.entries(MARKERS)) {
        let spot = null;
        for (let r = 0; r <= 4 && !spot; r++) for (let dy = -r; dy <= r && !spot; dy++) for (let dx = -r; dx <= r && !spot; dx++)
          if (Math.max(Math.abs(dx), Math.abs(dy)) === r && free(M.x + dx, M.y + dy) && free(M.x + dx, M.y + dy + 1)) spot = { x: M.x + dx, y: M.y + dy };
        if (spot) markers[key] = deco("marker", M.heart ? "deco_lumita_heart_dim" : "deco_lumita_marker_dim", spot.x, spot.y, 1, 1, { key, name: M.name, heart: !!M.heart });
      }
      spawnT = 0; // o jogador ainda não existe aqui (genWorld roda antes): o primeiro update acende o que já estiver aceso
    }
    function sync() { // rodada 79: arte do marco aceso/apagado (Flow); ao acender, o apagado some em 1,2 s por cima (o.fade)
      if (!P()) return;
      for (const [key, o] of Object.entries(markers)) { const base = o.heart ? "deco_lumita_heart" : "deco_lumita_marker", spr = base + (rules.shine(P(), key) ? "_lit" : "_dim"); // rodada 81: o do Planalto é o Coração
        if (o.spr !== spr && o.synced) { o.fadeFrom = o.spr; o.fade = 1; api.burst(o.x + 0.5, o.y - 0.9, ["#7fe8ff", "#ffffff"], 30, 3); }
        o.spr = spr; o.synced = true; }
      for (const o of runes) if (o) { const spr = `deco_stele_${STELE[o.i]}_${rules.rune(P(), o.i) === "lit" ? "lit" : "dim"}`; if (o.spr !== spr && o.synced) { o.fadeFrom = o.spr; o.fade = 1; } o.spr = spr; o.synced = true; }
    }
    const crackState = (i) => api.inCrypt() ? null : rules.crack(P(), i);
    const crackAt = (x, y) => { for (let i = 0; i < CRACKS.length; i++) { const c = CRACKS[i]; if (x === c.x && y === c.y && crackState(i) === "open") return { i, x: c.x, y: c.y, w: 1, h: 1, type: "crack" }; } return null; };
    const openCracks = () => CRACKS.map((c, i) => ({ i, x: c.x, y: c.y, w: 1, h: 1, type: "crack" })).filter((c) => crackState(c.i) === "open");

    // ---------- interação ----------
    function inspectCrack(c) {
      const q = qs(P(), "c1_tremor"); if (!q || crackState(c.i) !== "open") return;
      (q.seen = q.seen || []).push(c.i); api.dirty();
      api.burst(c.x + 0.5, c.y + 0.5, ["#7fe8ff", "#ffffff", "#5a4026"], 26, 3.5); api.shake(5); api.sound("warn");
      const last = (q.seen.length >= 3);
      if (last) api.give("Lasca rúnica", 1);
      const type = c.i === 1 ? "slime_blue" : "slime", m = api.spawnMob(type, "fields", { x: c.x, y: c.y, r: 2 }, null, { temp: true, aggro: true, atkT: 2 });
      if (m && api.rise) api.rise(m);
      api.log(last ? "A terra cospe mais uma criatura... e entre os torrões brilha uma lasca de pedra com marcas antigas." : "A fenda solta um bafo morno. Lá no fundo, uma luz azul pisca... e alguma coisa gelatinosa sobe!", "warn");
      api.emit("inspect:crack");
      if (last) api.scene("c1_crack");
    }
    function useSeal(o) { // rodada 83: encaixar o fragmento do selo no pedestal do fundo da Fenda
      const p = P(), q = qs(p, "c5_serpente");
      if (rules.sealLit(p)) { api.log("O selo brilha, inteiro. A Fenda inteira parece respirar mais devagar.", "dim"); return; }
      if (!q || q.step !== 1 || api.count("Fragmento do selo") < 1) { api.log("Um pedestal de pedra clara com um encaixe vazio. Runas apagadas em volta.", "dim"); return; }
      api.scene("c5_selo", () => { if (api.count("Fragmento do selo") < 1) return; api.removeItem("Fragmento do selo", 1); o.fadeFrom = o.spr; o.fade = 1; o.spr = "deco_seal_pedestal_lit";
        api.burst(o.x + 0.5, o.y - 0.8, ["#ffffff", "#7fe8ff"], 40, 4); api.emit("seal"); });
    }
    function inspectRune(o) { // rodada 80: copiar a inscrição acende a runa e acorda um esqueleto por perto
      const q = qs(P(), "c3_inscricoes"); if (!q || rules.rune(P(), o.i) !== "open") { api.log(rules.rune(P(), o.i) === "lit" ? "A runa ainda brilha: esta você já copiou." : "Runas antigas, gastas pelo vento. Alguém que entenda disso saberia lê-las.", "dim"); return; }
      (q.seen = q.seen || []).push(o.i); api.dirty(); sync();
      api.burst(o.x + 0.5, o.y - 0.4, ["#7fe8ff", "#ffffff"], 22, 3); api.sound("rare");
      // rodada 81: só a primeira e a terceira acordam um esqueleto (robô: com um em cada, Combate 18 morria 4 vezes em 10)
      if (q.seen.length % 2 === 1) { const m = api.spawnMob("skeleton", api.regionAt(o.x, o.y), { x: o.x, y: o.y + 1, r: 2 }, null, { temp: true, aggro: true, atkT: 3 }); if (m && api.rise) api.rise(m); }
      api.log(q.seen.length % 2 === 1 ? "Você passa a mão nas runas e elas acendem. Atrás de você, ossos estalam e se levantam." : "As runas acendem. Ao longe, ossos estalam, mas nada se levanta.", "warn");
      api.emit("inspect:rune");
    }
    function update(dt) {
      if (flash > 0) flash -= dt;
      for (const o of [...Object.values(markers), ...runes]) if (o && o.fade > 0) o.fade -= dt / 1.2;
      const p0 = P(); // rodada 79/80: a Juna e a Odília olham para o herói a até 4 passos (folha _look); não andam
      for (const J of [api.npc().herb, api.npc().carto, api.npc().miner]) if (J && p0) { const dx = p0.x - J.x, dy = p0.y - J.y; J.lookDir = Math.abs(dx) + Math.abs(dy) <= 4 ? (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy < 0 ? "up" : "down") : null; }
      if ((spawnT -= dt) > 0) return; spawnT = 0.5;
      sync();
      if (api.inCrypt() || P().deadT > 0) return;
      const p = P(), mobs = api.mobs();
      if (rules.wave(p) && markers.fields) { // onda no marco dos Campos: o que faltar volta quando o herói chega perto
        const o = markers.fields, q = qs(p, "c1_marco"), need = QS.c1_marco.steps[1].n - q.n, alive = mobs.filter((m) => m.wave === "fields" && !m.dead).length;
        if (!alive && need > 0 && Math.hypot(p.x - o.x, p.y - o.y) < 12) {
          for (let i = 0; i < need; i++) { const m = api.spawnMob(i % 3 === 2 ? "slime_blue" : "slime", "fields", { x: o.x, y: o.y + 1, r: 3 }, null, { temp: true, aggro: true, wave: "fields", atkT: 2 + i });
            if (m && api.rise) api.rise(m); }
          api.announce("A terra se abre!", `Criaturas sobem em volta do Marco dos Campos (${need}). Defenda a pedra.`);
        }
      }
      if (rules.waveSouth(p) && markers.south) { // rodada 79: matilha no Marco da Mata (5 lobos e 1 alfa)
        const o = markers.south, q = qs(p, "c2_marco"), need = QS.c2_marco.steps[1].n - q.n, alive = mobs.filter((m) => m.wave === "south" && !m.dead).length;
        if (!alive && need > 0 && Math.hypot(p.x - o.x, p.y - o.y) < 12) {
          const batch = Math.min(need, 3); // robô (r79): os 6 de uma vez derrubavam Combate 14–16; em duas levas de 3, o alfa vem na última
          for (const m of mobs) if (rules.yieldsToWave(m, o)) { m.dead = true; m.respawnT = 180; } // rodada 94: a leva não soma com o bando que mora ali (até 31 refeições)
          for (let i = 0; i < batch; i++) { const m = api.spawnMob(need <= 3 && i === batch - 1 ? "wolf_alpha" : "wolf", "south", { x: o.x, y: o.y + 1, r: 4 }, null, { temp: true, aggro: true, wave: "south", atkT: 2 + i * 2 });
            if (m && api.rise) api.rise(m); }
          api.announce(need > 3 ? "A matilha vem atrás da luz!" : "O alfa da matilha!", `Lobos cercam o Marco da Mata (faltam ${need}). Resista.`);
        }
      }
      if (rules.capataz(p)) { // Capataz Rasgo: nasce no acampamento quando o herói chega perto (de novo, se ele fugir ou o herói cair)
        const q = qs(p, "c1_bando"), alive = mobs.some((m) => m.type === "goblin_boss" && !m.dead);
        if (!alive && Math.hypot(p.x - CAMP.x, p.y - CAMP.y) < 11) { // sai do acampamento e vem ao encontro do herói (a luta não puxa o bando inteiro)
          const m = spawnCapataz(p);
          if (m) { if (!q.met) { q.met = 1; api.scene("c1_capataz"); } else api.announce("Capataz Rasgo!", "O chefe do bando voltou para o acampamento."); }
        }
      }
    }
    function spawnCapataz(p) { // 3 tiles à frente do herói, na direção do acampamento; a "casa" dele fica ali (não volta para o meio do bando)
      const d = Math.hypot(CAMP.x - p.x, CAMP.y - p.y) || 1, k = Math.min(3, d), x = Math.round(p.x + (CAMP.x - p.x) / d * k), y = Math.round(p.y + (CAMP.y - p.y) / d * k);
      const s = api.freeNear(x, y, 2); if (!s) return null;
      const m = api.spawnMob("goblin_boss", api.regionAt(s.x, s.y), { x: s.x, y: s.y, r: 0 }, null, { temp: true, aggro: true, at: s, atkT: 3 });
      if (m && api.rise) api.rise(m);
      return m;
    }
    function tick(tickN) { // bênção do marco: perto de um marco aceso e fora de luta, a vida volta 2x mais rápido
      const p = P(); if (api.inCrypt() || p.deadT > 0 || tickN - p.lastHurt <= 8 || p.hp >= api.maxHp()) return;
      for (const [key, o] of Object.entries(markers)) if (rules.lit(p, key) && Math.hypot(p.x - o.x, p.y - (o.y + 0.5)) <= 2.6) {
        if (tickN % 2 === 0) { p.hp = Math.min(api.maxHp(), p.hp + 1); api.dirty(); api.sparks(p.px + 0.5, p.py + 0.2); }
        if (!p.blessT || tickN - p.blessT > 120) { p.blessT = tickN; api.float(p.px + 0.5, p.py - 0.9, "Bênção do marco", "#7fe8ff"); }
        return;
      }
    }

    // ---------- janela do marco e viagem ----------
    const DEST = () => [["town", "Vila de Lumeira", "santuário da praça"], ...Object.entries(markers).filter(([k]) => rules.lit(P(), k)).map(([k, o]) => [k, o.name, "marco aceso"])];
    function travelHtml(from) {
      if (!rules.travel(P())) return "";
      const esc = ValdoraUI.esc, icon = (k) => ASSETS[k === "town" ? "icon_region_village_32" : k === "east" ? "icon_region_grove_32" : k === "south" ? "icon_region_darkwood_32" : k === "ruins" ? "icon_region_ruins_32" : k === "west" ? "icon_region_plateau_32" : "icon_region_fields_32"];
      return `<div class="bank-head">Pedras de passagem</div>` + DEST().filter(([k]) => k !== from).map(([k, n, sub]) =>
        `<div class="row">${icon(k) ? `<img src="${icon(k)}" alt="">` : ""}<span class="grow">${esc(n)}<br><small>${esc(sub)}</small></span><button data-travel="${k}">Viajar</button></div>`).join("");
    }
    function markerView(o) {
      const p = P(), lit = rules.lit(p, o.key), esc = ValdoraUI.esc;
      let html = "";
      for (const [id, Q] of Object.entries(QS)) { // entregas neste marco
        const q = qs(p, id), st = q && !q.done && Q.steps[q.step]; if (!st || st.at !== o.key) continue;
        html += `<div class="quest-card campaign"><b>${esc(Q.name)}</b> <small>passo ${q.step + 1}/${Q.steps.length}</small><p>${esc(st.text)}</p>`
          + (st.deliver ? `<button class="wide" data-mdeliver="${id}" ${api.QUEST.canDeliver(st) && (!st.night || api.night()) ? "" : "disabled"}>Consertar (${Object.entries(st.deliver).map(([k, v]) => `${api.count(k)}/${v} ${esc(k)}`).join(", ")})</button>` : "")
          + (st.night && !api.night() ? `<small class="qhint">Só com a lua no céu: volte à noite.</small>` : "") + `</div>`;
      }
      if (lit) html += travelHtml(o.key) || `<p class="empty">Descansar ao lado do marco faz a vida voltar mais rápido.</p>`;
      const talk = lit ? "O cristal pulsa devagar, no ritmo de uma respiração. Perto dele, as feridas doem menos."
        : "Pedras empilhadas há séculos, cobertas de musgo. O cristal do topo está rachado e opaco como vidro velho.";
      return { title: o.name, talk, html };
    }
    function travel(key) {
      const p = P();
      if (api.inCrypt()) return false;
      if (api.tickN() - p.lastHurt < 10 || api.mobs().some((m) => !m.dead && m.aggro && Math.abs(m.x - p.x) + Math.abs(m.y - p.y) < 8)) { api.log("Não dá para viajar no meio de uma luta.", "warn"); return false; }
      const o = key === "town" ? api.npc().shrine : markers[key]; if (!o || (key !== "town" && !rules.lit(p, key))) return false;
      const spot = api.freeNear(o.x, o.y + o.h, 3); if (!spot) return false;
      api.burst(p.px + 0.5, p.py + 0.4, ["#7fe8ff", "#ffffff", "#c8f8ff"], 24, 3);
      api.teleport(spot.x, spot.y); flash = 0.5; api.sound("ready");
      api.burst(spot.x + 0.5, spot.y + 0.4, ["#7fe8ff", "#ffffff", "#c8f8ff"], 30, 3.5);
      api.log(`As pedras de passagem levam você até ${key === "town" ? "a Vila de Lumeira" : o.name}.`, "gold");
      return true;
    }

    // ---------- objetivos (marca, minimapa e seta) ----------
    function objectives() {
      const p = P(), out = []; if (!p) return out;
      if (api.inCrypt()) { const s = api.npc().seal, q = qs(p, "c5_serpente"); if (s && q && !q.done && q.step === 1) out.push({ x: s.x, y: s.y, kind: "marker" }); return out; } // rodada 83
      for (const [id, Q] of Object.entries(QS)) {
        if (!Q.act) continue; const q = qs(p, id), st = q && !q.done && Q.steps[q.step]; if (!st) continue;
        if (st.goal === "cracks") for (const c of openCracks()) out.push({ x: c.x, y: c.y, kind: "crack" });
        else if (st.at && markers[st.at]) out.push({ x: markers[st.at].x, y: markers[st.at].y, kind: "marker" });
        else if (st.goal && st.goal.startsWith("marker:") && markers[st.goal.slice(7)]) { const o = markers[st.goal.slice(7)]; out.push({ x: o.x, y: o.y, kind: "marker" }); }
        else if (st.goal === "camp") out.push({ x: CAMP.x, y: CAMP.y, kind: "camp" });
        else if (st.goal === "runes") for (const o of runes) { if (o && rules.rune(p, o.i) === "open") out.push({ x: o.x, y: o.y, kind: "marker" }); }
        else if (st.goal === "seal" && api.npc().seal) out.push({ x: api.npc().seal.x, y: api.npc().seal.y, kind: "marker" }); // rodada 83 (dentro da Fenda)
        else if (st.goal === "rift" && api.npc().rift) out.push({ x: api.npc().rift.x, y: api.npc().rift.y, kind: "marker" }); // rodada 82
        else if (st.goal === "golems") { const G = api.mobs().filter((m) => m.type === "golem" && !m.dead).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0]; if (G) out.push({ x: G.x, y: G.y, kind: "mob" }); }
        else if (st.goal === "bossGolem") { const B = api.mobs().find((m) => m.type === "boss_golem" && !m.dead); if (B) out.push({ x: B.x, y: B.y, kind: "mob" }); }
        else if (st.goal === "boss") { const B = api.mobs().find((m) => m.type === "boss" && !m.dead); if (B) out.push({ x: B.x, y: B.y, kind: "mob" }); }
        else if (st.goal === "moon") { const a = api.mobs().find((m) => m.type === "wolf_moon" && !m.dead); if (a) out.push({ x: a.x, y: a.y, kind: "mob" }); } // rodada 79: só com o Alfa no mapa
        else if ((st.talk || st.deliver) && !st.at) { const o = api.npc()[{ guard: "guard", bard: "bard", shop: "merchant", herb: "herb", carto: "carto", miner: "miner" }[st.to || Q.giver]]; if (o) out.push({ x: o.x, y: o.y, kind: "npc" }); }
      }
      return out;
    }
    const sx = (x) => x * TILE - cam.x, sy = (y) => y * TILE - cam.y;
    function drawGround(t) { // fendas no chão (por baixo dos personagens)
      if (api.inCrypt()) return;
      for (let i = 0; i < CRACKS.length; i++) {
        const st = crackState(i); if (!st) continue; const c = CRACKS[i], img = SPR[st === "open" ? "deco_crack_open" : "deco_crack_scar"]; if (!img) continue;
        const x = Math.round(sx(c.x + 0.5) - img.width / 2), y = Math.round(sy(c.y + 0.55) - img.height / 2); // decalque visto de cima, centrado no tile
        if (x > ctx.canvas.width || y > ctx.canvas.height || x + img.width < 0 || y + img.height < 0) continue;
        ctx.drawImage(img, x, y);
        if (st === "open") for (let k = 0; k < 6; k++) { // fagulhas de lumita subindo da fenda
          const ph = (t * 0.45 + k / 6 + i * 0.13) % 1, mx = x + img.width * (0.2 + ((k * 37 + i * 11) % 60) / 100) + Math.sin(t * 2 + k) * 3, my = y + img.height * 0.55 - ph * TILE * 1.1;
          ctx.fillStyle = `rgba(160,245,255,${(1 - ph) * 0.85})`; ctx.fillRect(Math.round(mx), Math.round(my), 2, 2);
        }
        const G = SPR.deco_crack_open_glow; if (st === "open" && G) { ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.45 + 0.35 * Math.sin(t * 3 + i); ctx.drawImage(G, x, y); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over"; }
      }
    }
    function drawMark(x, y, t, ch, col) { // "!" bobbing como o dos NPCs
      const by = y + Math.sin(t * 5) * 3; ctx.font = "24px 'Valdora Pixel', 'Courier New', monospace"; ctx.textAlign = "center";
      ctx.lineWidth = 4; ctx.strokeStyle = "#000"; ctx.strokeText(ch, x, by); ctx.fillStyle = col; ctx.fillText(ch, x, by);
    }
    function drawOver(t) { // depois das entidades: luz do marco aceso, marcas sobre os objetivos e seta na borda da tela
      if (api.inCrypt()) return;
      for (const [key, o] of Object.entries(markers)) if (rules.lit(P(), key)) {
        const x = sx(o.x + 0.5), y = sy(o.y + 1) - TILE * 1.75; if (x < -80 || y < -200 || x > ctx.canvas.width + 80 || y > ctx.canvas.height + 120) continue;
        const k = 0.55 + 0.25 * Math.sin(t * 1.8 + o.x), g = ctx.createRadialGradient(x, y, 2, x, y, TILE * 0.9);
        g.addColorStop(0, `rgba(150,245,255,${0.5 * k})`); g.addColorStop(1, "rgba(90,220,255,0)");
        ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = g; ctx.fillRect(x - TILE, y - TILE, TILE * 2, TILE * 2); ctx.globalCompositeOperation = "source-over";
      }
      const goals = objectives(), W0 = ctx.canvas.width, H0 = ctx.canvas.height;
      for (const g of goals) if (g.kind === "crack" || g.kind === "marker") drawMark(sx(g.x + 0.5), sy(g.y) - (g.kind === "marker" ? TILE * 1.25 : 14), t, "!", "#7fe8ff");
      // seta na borda: aponta para o objetivo mais perto quando ele está fora da tela
      const p = P(); let best = null, bd = Infinity;
      for (const g of goals) { const d = Math.hypot(g.x - p.x, g.y - p.y); if (d < bd) { bd = d; best = g; } }
      if (best) {
        const tx = sx(best.x + 0.5), ty = sy(best.y + 0.5), m = 34, VW = api.viewRight ? api.viewRight() : W0; // à direita, para antes do painel
        const HB = H0 - 96; // embaixo, para acima da barra de habilidades (rodada 79)
        if (tx < m || ty < m || tx > VW - m || ty > HB) {
          const cx = VW / 2, cy = (m + HB) / 2, dx = tx - cx, dy = ty - cy, k = Math.min((VW / 2 - m) / Math.abs(dx || 1e-6), ((HB - m) / 2) / Math.abs(dy || 1e-6));
          const ax = cx + dx * k, ay = cy + dy * k, a = Math.atan2(dy, dx), pul = 1 + 0.12 * Math.sin(t * 6);
          ctx.save(); ctx.translate(ax, ay); ctx.rotate(a); ctx.scale(pul, pul);
          ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -10); ctx.lineTo(-3, 0); ctx.lineTo(-8, 10); ctx.closePath();
          ctx.fillStyle = "#7fe8ff"; ctx.strokeStyle = "#0a1a20"; ctx.lineWidth = 3; ctx.stroke(); ctx.fill(); ctx.restore();
          ctx.font = "12px 'Valdora Pixel', 'Courier New', monospace"; ctx.textAlign = "center"; ctx.lineWidth = 3; ctx.strokeStyle = "#000";
          const lbl = `${Math.round(bd)} m`, lx = ax - Math.cos(a) * 22, ly = ay - Math.sin(a) * 22 + 4; ctx.strokeText(lbl, lx, ly); ctx.fillStyle = "#c8f8ff"; ctx.fillText(lbl, lx, ly);
        }
      }
    }
    function drawScreen() { // clarão da viagem
      if (flash <= 0) return; ctx.fillStyle = `rgba(200,248,255,${Math.min(1, flash / 0.5) * 0.7})`; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    return { place, sync, update, tick, crackAt, openCracks, inspectCrack, markerView, travelHtml, travel, objectives, drawGround, drawOver, drawScreen,
      spawnCapataz, useSeal, sealLit: () => !!P() && rules.sealLit(P()), markers: () => markers, calm: (m) => rules.calm(P(), m, markers.south) || rules.calmEast(P(), m, markers.east) || rules.calmRuins(P(), m, markers.ruins) || rules.calmWest(P(), m, markers.west) || rules.calmCamp(m, api.npc().miner) || rules.calmJuna(m, api.npc().herb), inspectRune, alchemyOpen: () => rules.alchemy(P()), lit: (k) => rules.lit(P(), k), travelOpen: () => rules.travel(P()) };
  }
  return { create, rules };
})();

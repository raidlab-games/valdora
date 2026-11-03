// Valdora — coleta, pesca e culinária (rodada 12: saiu do game.js).
// Corte, mineração e pesca acontecem no quadro de impacto da ferramenta (useTool); a fogueira assa o primeiro peixe cru possível.
window.ValdoraGather = (() => {
  "use strict";
  function create(api) {
    const { RES, ITEMS, SKILLS } = VD, RULES = ValdoraRules;
    const { lv, log, canAdd, useTool, accBonus, tier, SND, burst, fx, clickFx, addItem, removeItem, gainXp, emit, checkAch, SPR, addFloat, relocateSpot, ri, rand, clamp, RENDER } = api;
    let spotMsgT = -1e9; // última vez que o aviso do cardume apareceu
    let burntMsgT = -1e9, cookHint = ""; // aviso de queima (no máximo a cada 20 s) e dica da chance (uma vez por item e nível)
    function gather(o) {
      const player = api.player(), event = api.event(), R = RES[o.kind], lvl = lv(R.skill);
      let item = R.item, xp = R.xp;
      if (lvl < R.req) { log(`${R.name} pede ${SKILLS[R.skill]} ${R.req}.`, "warn"); player.target = null; return; }
      if (R.fish) { const opts = R.fish.filter((f) => lvl >= f.req); const f = opts.length > 1 && rand() < 0.5 ? opts[0] : opts[opts.length - 1]; item = f.item; xp = f.xp; }
      if (o.golden > 0 && event && event.left > 0 && rand() < 0.25) { item = "Peixe dourado"; xp = 30; event.left--; } // evento: cardume dourado (6 por evento)
      if (!canAdd(item)) { log("Sua mochila está cheia. Guarde itens no cofre ou venda ao Bento.", "warn"); player.target = null; return; }
      const key = R.tool === "machado" ? "tool_axe" : R.tool === "picareta" ? "tool_pick" : R.tool === "foice" ? "tool_sickle" : "rod";
      if (key === "rod" && (!player.cast || player.cast.spot !== o)) { // primeiro arremesso: a linha voa até o cardume
        player.cast = { t: 0, spot: o, landed: false }; SND.play("whoosh"); useTool("rod", null, { prep: 0.1, strike: 0.08, rec: 0.25 }); return;
      }
      const gatherBonus = Object.values(player.equip).reduce((t, e) => t + (e ? accBonus(e).gather : 0), 0) / 100;
      const chance = RULES.gatherChance(lvl, R.req, tier(R.tool).bonus, gatherBonus + (player.equip.arma && player.equip.arma.master ? 0.05 : 0)); // rodada 104: obra-prima da ferramenta vestida
      const success = rand() < chance;
      useTool(key, () => { // tudo acontece no quadro de impacto
        const dx = Math.sign(o.x - player.x) * 0.3, dy = Math.sign(o.y - player.y) * 0.3;
        if (R.skill === "corte") {
          SND.play("chop"); o.shake = 0.25; api.hitStop(0.03);
          burst(o.x + 0.5 - dx, o.y + 0.6 - dy, ["#8a5a2a", "#c9955a", "#6b4422"], 7, 2.6);
          burst(o.x + 0.5, o.y - 0.4, [R.fx[1]], 3, 0.8, 0.1); // folhas caindo da copa
        } else if (R.skill === "mineracao") {
          SND.play("mine"); o.shake = 0.2; o.hitT = 0; api.hitStop(0.03);
          fx.sparks(o.x + 0.5 - dx, o.y + 0.55 - dy, 9); burst(o.x + 0.5, o.y + 0.6, [R.fx[0], "#6e6a64"], 5, 2.2);
        } else if (R.skill === "herbalismo") { // rodada 104: corte de foice — folhas e pétalas voam
          SND.play("chop"); o.shake = 0.2; burst(o.x + 0.5 - dx, o.y + 0.6 - dy, R.fx, 8, 2.2); burst(o.x + 0.5, o.y + 0.3, [R.fx[1]], 3, 0.8, 0.1);
        } else {
          SND.play("splash"); burst(o.x + 0.5, o.y + 0.5, ["#e8f6ff", "#8fc1ee"], success ? 10 : 4, success ? 2 : 1.2); clickFx(o.x + 0.5, o.y + 0.55, "#e8f6ff");
        }
        if (!success) return;
        addItem(item); gainXp(R.skill, xp); emit("gather:" + item);
        const sk = { corte: "logs", mineracao: "ores", pesca: "fish", herbalismo: "herbs" }[R.skill]; player.stats[sk] = (player.stats[sk] || 0) + 1; checkAch();
        if (R.skill === "pesca") fx.arc(SPR[ITEMS[item].icon], o.x + 0.5, o.y + 0.4, player.px + 0.5, player.py + 0.2, 0.5, 1.3, 26); // o peixe salta até o herói
        if (item === "Peixe dourado") { SND.play("coin"); burst(o.x + 0.5, o.y + 0.5, ["#ffd84a", "#fff6c0"], 16, 3); }
        addFloat(o.x + 0.5, o.y, `+1 ${item}`, "#ffffff");
        addFloat(player.px + 0.5, player.py - 0.4, `+${xp} xp`, "#8fd3ff", 1, 11);
        if (--o.charges <= 0) {
          if (o.lake) { // rodada 27: peixe salta no ponto antigo e no novo (fx_fish_jump); o aviso aparece no máximo a cada 30 s
            if (RENDER.playOnce("fx_fish_jump", o.x, o.y)) { relocateSpot(o); RENDER.playOnce("fx_fish_jump", o.x, o.y); } else relocateSpot(o);
            player.target = null; player.cast = null;
            const now = performance.now() / 1000; if (now - spotMsgT > 30) { spotMsgT = now; log("O cardume se afastou. Procure as ondulações na água.", "dim", "icon_fish_spot"); }
          }
          else { o.respawn = ri(...R.respawn); player.target = null; burst(o.x + 0.5, o.y + 0.5, R.fx, 14, 3); log(`${R.name} esgotou. Volta em ${o.respawn >= 120 ? `cerca de ${Math.round(o.respawn / 60)} minutos` : "alguns segundos"}.`, "dim"); // rodada 123: árvores e minérios, 10 a 20 min (sorteio a cada vez)
            if (R.skill === "corte") RENDER.playOnce("fx_leaves", o.x, o.y); } // folhas caindo do toco (Blender, toque único)
        }
      }, key === "rod" ? { prep: 0.12, strike: 0.06, rec: 0.22 } : {});
    }

    function cook(fire) {
      const player = api.player(), lvl = lv("culinaria");
      const raw = player.inv.find((s) => s && ITEMS[s.name].cook && lvl >= ITEMS[s.name].cookLvl);
      if (fire.batch && performance.now() / 1000 - fire.batch.last > 6) fire.batch = null; // fila interrompida (saiu da fogueira): recomeça a contagem
      if (!raw && fire.batch && fire.batch.n > 0) { // rodada 45: fim do "assar tudo" — resumo no registro e fumaça das três colunas
        const B = fire.batch; fire.batch = null; player.target = null;
        if (B.n >= 2) RENDER.playOnce("fx_cook_batch", fire.x, fire.y, { foot: true });
        log(`Assou ${B.n}: ${Object.entries(B.made).map(([k, v]) => `${k.toLowerCase()} ×${v}`).join(", ") || "nada"}${B.burnt ? `, queimado ×${B.burnt}` : ""}.`, "dim", "icon_cook_all");
        return;
      }
      if (!raw) {
        const any = player.inv.find((s) => s && ITEMS[s.name].cook);
        log(any ? `Você precisa de Culinária nível ${ITEMS[any.name].cookLvl} para assar ${any.name.toLowerCase()}.` : "Não há peixe cru na mochila para assar.", any ? "warn" : "dim");
        player.target = null; return;
      }
      const it0 = ITEMS[raw.name], name = raw.name, burn = RULES.burnChance(lvl, it0.cookLvl);
      // rodada 30: carne + 1 madeira na mochila = espetinho (rodada 88: cura 15 em vez de 12)
      const sk = it0.skewer && player.inv.some((s) => s && s.name === it0.skewer.with) ? it0.skewer : null;
      const it = sk ? { ...it0, cook: sk.item, cookXp: sk.xp } : it0;
      useTool("cook", () => { burst(fire.x + 0.5, fire.y + 0.4, ["#f39c12", "#f5e27a", "#c0392b"], 10, 2.5); SND.play("cook"); });
      fire.sizzleUntil = player.cookUntil = performance.now() / 1000 + 1.8; // rodada 28: fx_cook_sizzle na grelha; rodada 29: herói agachado com o espeto
      if (cookHint !== name + lvl) { cookHint = name + lvl; log(burn > 0 ? `Assando ${name.toLowerCase()}: ${Math.round(burn * 100)}% de chance de queimar no seu nível (cai 3 pontos por nível).` : `Assando ${name.toLowerCase()}: no seu nível não queima mais.`, "dim", "icon_burnt"); }
      removeItem(name); if (sk) removeItem(sk.with);
      if (sk && !player.seen["skewer"]) { player.seen["skewer"] = 1; log(`Com ${sk.with.toLowerCase()} na mochila, a carne vira ${sk.item.toLowerCase()} (cura ${ITEMS[sk.item].heal}). Deixe a madeira no cofre para assar carne comum.`, "dim", "icon_heal_small"); }
      const B = fire.batch || (fire.batch = { n: 0, burnt: 0, made: {} }); B.n++; B.last = performance.now() / 1000;
      if (rand() < burn) { // queima menos conforme o nível (rules.js)
        B.burnt++;
        addItem("Peixe queimado"); addFloat(fire.x + 0.5, fire.y, "Queimou!", "#999");
        const now = performance.now() / 1000; if (now - burntMsgT > 20) { burntMsgT = now; log(`Queimou! ${it.cook} virou carvão. Com mais Culinária isso acontece menos.`, "dim", "icon_burnt"); }
      } else {
        B.made[it.cook] = (B.made[it.cook] || 0) + 1;
        addItem(it.cook); gainXp("culinaria", it.cookXp); emit("cook:" + it.cook); player.stats.cooked++; checkAch();
        addFloat(fire.x + 0.5, fire.y, `+1 ${it.cook}`, "#fff"); addFloat(player.px + 0.5, player.py - 0.4, `+${it.cookXp} xp`, "#8fd3ff", 1, 11);
      }
    }
    return { gather, cook };
  }
  return { create };
})();

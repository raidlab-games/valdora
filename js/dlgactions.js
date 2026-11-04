// Valdora — o que cada botão das janelas faz no jogo (rodada 57: saiu do game.js para poder ser testado com um jogador de mentira).
// Fechar, abas e filtro do cofre (só interface) ficam em js/dialogs.js; aqui fica o que muda o estado: banca, cofre, oficinas,
// missões, Tomé, quadro de caçadas e santuário. O game.js passa as funções de estado pelo api.
window.ValdoraDlgActions = (() => {
  "use strict";
  function create(api) {
    const { ITEMS, BUFFS, BARD_SONGS } = VD;
    const { sell, buy, deliver, newOrder, moveStack, takeFx, storeFx, log, craft, QUEST, react, rand, SND, addFloat, claimBounty, wakeEcho, newBounty, emit, accName } = api;
    function dlgShop(ds) { // banca do Bento: vender, comprar, encomendas
      const player = api.player(), dlg = api.dlg();
      if (ds.sell) sell(ds.sell, ds.n === "all" ? Infinity : 1);
      if (ds.sellslot) { const i = +ds.sellslot, sl = player.inv[i]; if (sl && sl.aff) { const gain = ITEMS[sl.name].price * 2; player.inv[i] = null; player.coins += gain; api.dirty(); log(`Vendeu ${accName(sl)} por ${gain} moedas.`); SND.play("coin"); emit("trade"); } }
      if (ds.sellall) for (const s of player.inv.slice()) if (s && !s.aff && !ITEMS[s.name].heal && !s.name.startsWith("Barra") && ITEMS[s.name].price > 0) sell(s.name, Infinity);
      if (ds.buy) buy(ds.buy);
      if (ds.deliver) deliver(+ds.deliver);
      if (ds.reroll) { const i = +ds.reroll, old = player.orders[i].item; player.orders[i] = null; player.orders[i] = newOrder(old); }
    }
    function dlgBank(ds) { // cofre: guardar, retirar, organizar
      const player = api.player(), dlg = api.dlg();
      if (ds.bankup && api.bankUp) api.bankUp(); // rodada 117: ampliar o cofre
      if (ds.potion && api.brewPotion) api.brewPotion(ds.potion, +ds.n || 1); // rodada 117: poções da Morgana
      if (ds.dep) moveStack(player.inv, +ds.dep, player.bank);
      if (ds.wd) moveStack(player.bank, +ds.wd, player.inv);
      if (ds.sortbank) { // rodada 44: comida → materiais → barras → raros (acessórios, raros e itens com afixo), e nome dentro do grupo
        const group = (s) => { const it = ITEMS[s.name]; return it.heal && !it.buff ? 0 : it.slot || it.rare || it.rarity || s.aff ? 3 : s.name.startsWith("Barra") ? 2 : 1; };
        const items = player.bank.filter(Boolean).sort((a, b) => group(a) - group(b) || a.name.localeCompare(b.name, "pt-BR"));
        for (let i = 0; i < player.bank.length; i++) player.bank[i] = items[i] || null; api.dirty();
      }
      if (ds.takefood) { // rodada 43: comida do cofre para a mochila, da que mais cura para a que menos cura; um efeito só
        const order = player.bank.map((s, i) => [s, i]).filter(([s]) => s && ITEMS[s.name].heal && !ITEMS[s.name].buff && !s.name.startsWith("Poção")).sort((a, b) => ITEMS[b[0].name].heal - ITEMS[a[0].name].heal);
        let first = null; for (const [s, i] of order) { const name = s.name; moveStack(player.bank, i, player.inv); if (!player.bank[i] && !first) first = name; if (player.bank[i]) break; }
        if (first && dlg.obj) takeFx(dlg.obj, first); else if (!order.length) log("Não há comida no cofre.", "dim");
      }
      if (ds.depall) { // rodada 42: guarda materiais (fica comida, poção e acessório); um efeito só no baú
        const keep = (it) => it.heal || it.buff || it.slot; let first = null;
        for (let i = 0; i < player.inv.length; i++) { const s = player.inv[i]; if (s && !keep(ITEMS[s.name])) { const before = player.inv[i]; moveStack(player.inv, i, player.bank); if (!player.inv[i] && !first) first = before.name; } }
        if (first && dlg.obj) storeFx(dlg.obj, first);
      }
    }
    function dlgWork(ds) { // fornalha, bigorna e artesanato
      const player = api.player(), dlg = api.dlg();
      if (ds.smelt) { player.job = { kind: "smelt", item: ds.smelt, left: Math.max(1, +ds.n), obj: dlg.obj }; player.target = null; player.path = []; }
      if (ds.craft) craft(ds.craft);
      if (ds.cook) api.crafting().startCook(ds.cook, ds.n === "all" ? 1e9 : +ds.n, dlg.obj); // rodada 155: fogueira
      if (ds.cookstop) api.crafting().stopCook();
      if (ds.forge) { const [key, tier, v] = ds.forge.split(":"); player.job = { kind: "forge", key, tier: +tier, bow: v === "bow", two: v === "two", staff: v === "staff", hits: 0, obj: dlg.obj }; player.target = null; player.path = []; } // rodada 104
    }
    function dlgQuest(ds) { // missões (Ivo, Bento, Tomé)
      const player = api.player(), dlg = api.dlg();
      const QS = VD.QUESTS, npcOf = (g) => g === "guard" ? api.npc().guard : g === "shop" ? api.npc().merchant : g === "bard" ? api.npc().bard : g === "herb" ? api.npc().herb : g === "carto" ? api.npc().carto : g === "miner" ? api.npc().miner : (api.npc().wardens || {})[g] || null; // rodada 114: guardiões
      // rodada 78: passo com cena (campanha): fecha a janela, toca a cena e só no fim muda o estado da missão
      const viaScene = (sid, fn) => { if (sid && api.scene) { api.close(); api.scene(sid, fn); return "stop"; } fn(); };
      const stepOf = (id) => QUEST.stepOf ? QUEST.stepOf(id) : null, whoOf = (id, st) => (st && st.to) || (QS[id] && QS[id].giver);
      if (ds.qaccept) { const id = ds.qaccept; return viaScene(QS[id] && QS[id].scene, () => QUEST.accept(id)); }
      if (ds.qdeliver || ds.mdeliver) { const id = ds.qdeliver || ds.mdeliver, st = stepOf(id);
        if (st && st.scene && QUEST.canDeliver && QUEST.canDeliver(st)) return viaScene(st.scene, () => QUEST.deliver(id));
        QUEST.deliver(id); }
      if (ds.qtalk) { const id = ds.qtalk, st = stepOf(id); return viaScene(st && st.scene, () => { if (QUEST.talkTo(id)) react(npcOf(whoOf(id, st))); }); }
      if (ds.qfinish) { const id = ds.qfinish, st = stepOf(id), giver = whoOf(id, st);
        if (st && st.scene) return viaScene(st.scene, () => { if (QUEST.finish(id)) react(npcOf(giver)); });
        const outro = QUEST.finish(id); if (outro) { dlg.say = outro; react(npcOf(giver)); } } // rodada 34/35/37: continência / joinha / reverência
    }
    function dlgPet(ds) { if (ds.petstay && api.petStay) api.petStay(); if (ds.petname && api.petName) { const el = document.getElementById("pet-name"); api.petName(el ? el.value : ""); } } // rodada 96: nome do filhote
    function dlgHome(ds) { if (!api.home) return; for (const k of ["homebuy", "homebuild", "homebench", "homerest", "homegive", "hometoggle"]) if (ds[k] != null) return api.home(k, ds[k]); } // rodada 100
    function dlgDaily(ds) { if (ds.daily && api.claimDaily) api.claimDaily(); } // rodada 80: caçada do dia
    function dlgAlchemy(ds) { if (ds.alch && api.alchemy) api.alchemy(ds.alch); } // rodada 79: tônicos da Juna
    function dlgTravel(ds) { // rodada 78: pedras de passagem (santuário e marcos acesos)
      if (ds.travel && api.travel) { api.close(); api.travel(ds.travel); return "stop"; }
    }
    function dlgBard(ds) { // Tomé: canções e inspiração
      const player = api.player(), dlg = api.dlg();
      if (ds.song) { const old = dlg.song; while (dlg.song === old) dlg.song = BARD_SONGS[Math.floor(rand() * BARD_SONGS.length)]; SND.play("lute"); }
      if (ds.gift && player.coins >= 10) {
        player.coins -= 10; player.buffs.inspirado = BUFFS.inspirado.ticks; api.dirty(); SND.play("lute");
        addFloat(player.px + 0.5, player.py - 0.6, "Inspirado!", BUFFS.inspirado.color, 1.4, 15); log("Tomé toca uma canção só para você. Você se sente inspirado.", "gold");
      }
    }
    function dlgBoard(ds) { // quadro de caçadas e ecos
      const player = api.player(), dlg = api.dlg();
      if (ds.claim) claimBounty(+ds.claim);
      if (ds.echo) { wakeEcho(ds.echo); return "stop"; }
      if (ds.rerollB) { const i = +ds.rerollB, old = player.bounties[i].type; player.bounties[i] = null; player.bounties[i] = newBounty(old); }
    }
    function dlgShrine(ds) { // santuário: oferenda e chama votiva
      const player = api.player(), dlg = api.dlg();
      if (ds.offer) api.shrine().offer(+ds.offer);
      if (ds.votive) api.shrine().votive();
    }
    // devolve "stop" quando a janela não deve ser redesenhada (o eco desperta e fecha a janela)
    function dlgStone(ds) { if (!api.stone) return; for (const k of ["stonego", "stonespawn"]) if (ds[k] != null) return api.stone(k, ds[k]); } // rodada 105: Pedras
    function run(ds) { for (const act of [dlgShop, dlgBank, dlgWork, dlgQuest, dlgBard, dlgBoard, dlgShrine, dlgTravel, dlgAlchemy, dlgDaily, dlgPet, dlgHome, dlgStone]) if (act(ds) === "stop") return "stop"; }
    return { run, dlgPet, dlgHome, dlgShop, dlgBank, dlgWork, dlgQuest, dlgBard, dlgBoard, dlgShrine, dlgTravel, dlgAlchemy, dlgDaily };
  }
  return { create };
})();

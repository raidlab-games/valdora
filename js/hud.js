// Valdora — painel lateral (rodada 10: saiu do game.js). Vida, moedas, tarefa/missões e as abas Mochila, Níveis, Equip. e Diário.
// O jogo chama render() quando algo muda (hudDirty); os cliques nas abas continuam tratados no game.js.
window.ValdoraHud = (() => {
  "use strict";
  function create(api) {
    const $ = (id) => document.getElementById(id);
    const { ITEMS, RARITY, SKILLS, STYLES, GEAR, ACHIEVEMENTS, MOBS, BUFFS, TUTORIAL, REGIONS } = VD;
    const { esc, iconImg, isSpecial, itemColor, accName, accBonus, itemTip, affBadges } = ValdoraUI;
    const RULES = ValdoraRules, { level, xpFor, MAX_LVL, bonusText } = RULES, LIGHT = ValdoraLight;
    const { QUEST, TICK, combatStats, gearName, masterBadge, maxHp, tier, totalLevel } = api;
    // ícone da passiva do estilo (Flow) + nome e descrição
    const passiveHtml = (s) => s.passive ? `<br>${s.passive.icon && ASSETS[s.passive.icon] ? `<img class="picon" src="${ASSETS[s.passive.icon]}" alt="">` : ""}<b>${esc(s.passive.name)}:</b> ${esc(s.passive.desc)}` : "";
    // rodada 21: quem vive no mapa aberto renasce (ampulheta + tempo); masmorra volta a cada visita; evento e missão não renascem
    // região dos dados + masmorras onde ele também vive (o Alfa da lua cheia: evento na Mata e Toca dos Lobos)
    const whereText = (k, d) => [d.where.replace(" (chefe)", ""), ...Object.values(ValdoraWorld.DUNGEONS).filter((g) => (g.spawns || []).some((s) => s[0] === k) && !d.where.includes(g.name)).map((g) => g.name)].join(" · ");
    const respawnHtml = (k, d) => {
      const world = Object.values(ValdoraWorld.MOB_SPAWNS).some((l) => l.some((s) => s[0] === k));
      const dung = Object.values(ValdoraWorld.DUNGEONS).some((g) => (g.spawns || []).some((s) => s[0] === k));
      const sec = d.respawn || 12, t = sec >= 60 ? `${Math.floor(sec / 60)} min${sec % 60 ? " " + (sec % 60) + " s" : ""}` : `${sec} s`;
      const img = ASSETS.icon_respawn ? `<img class="ricon" src="${ASSETS.icon_respawn}" alt="">` : "⟳ ";
      if (d.echo) return `<span class="resp echo" title="Desperta no Quadro de caçadas; uma vitória por semana">${ASSETS.icon_echo_week ? `<img class="ricon" src="${ASSETS.icon_echo_week}" alt="">` : img}1 vez por semana</span>`;
      if (world) return `<span class="resp" title="Volta ao mesmo lugar depois de abatido">${img}renasce em ${t}</span>`;
      if (dung) return `<span class="resp dim" title="A masmorra é refeita a cada visita">${img}a cada visita</span>`;
      return `<span class="resp none" title="Só aparece uma vez (evento ou missão)">não renasce</span>`;
    };
    let invFocus = null; // último espaço da mochila com foco do teclado (rodada 41)
    document.addEventListener("focusin", (e) => { const el = e.target; if (el && el.closest && el.closest("#tab-inv") && el.dataset.i != null) invFocus = el.dataset.i; });
    function render() {
      const player = api.player(), hudTab = api.tab(), inCrypt = api.inCrypt();
      const vil = player.region === "town" && !inCrypt && window.ValdoraWorld.villageAt && window.ValdoraWorld.villageAt(player.x, player.y); // rodada 105: nome da vila
      const hp = Math.max(0, player.hp), mh = maxHp(), reg = vil && !vil.main ? { ...REGIONS.town, name: vil.name } : REGIONS[player.region || "town"];
      // rodada 48: fora da vila, com 1 comida ou menos (depois da primeira refeição), o cesto quase vazio avisa
      const food = api.foodCount(), foodLow = ASSETS.icon_food_low && api.foodLow();
      const PR = api.rank && api.rank(); // rodada 49: título do santuário
      const PT = api.petView && api.petView(); // rodada 96: ícone, nome e vida do filhote (clique abre a janela dele)
      const vm = player.votiveT > 0 ? Math.ceil(player.votiveT / 60) : 0; // rodada 53: minutos da chama votiva (na ponta da barra de vida); nome longo usa "Nv." para caber
      const face = $("me-img"); // rodada 105: cartão do personagem (retrato vestido, nível e ouro)
      if (face) { const src = ValdoraOutfit.face() || ASSETS[player.hero]; if (face.getAttribute("src") !== src) face.src = src;
        $("me-lvl").textContent = "Nv. " + totalLevel(); $("me-gold-n").textContent = player.coins.toLocaleString("pt-BR");
        if (!$("me-coin").getAttribute("src")) $("me-coin").src = ASSETS.coin; }
      $("player-info").innerHTML = `<div class="who"><b${PR ? ` style="color:${PR.color}" title="${esc(PR.title)}"` : ""}>${PR && ValdoraShrine.badge(PR) ? `<img class="tbadge" src="${ValdoraShrine.badge(PR)}" alt="">` : ""}${esc(player.name)}</b><span class="lvl" title="Nível total (soma das habilidades)">${player.name.length + (PR ? 2 : 0) > 13 ? "Nv." : "Nível total"} ${totalLevel()}</span></div>
        <div class="bar hp"><i style="width:${Math.min(100, (hp / mh) * 100)}%"></i><em>${hp} / ${mh}</em>${vm ? `<span class="votive" title="Chama votiva: mais ${vm} min">${ASSETS.icon_votive_hud ? `<img src="${ASSETS.icon_votive_hud_32 || ASSETS.icon_votive_hud}" alt="">` : "✦"}<span class="vm">${vm} min</span></span>` : ""}</div>
        ${PT ? `<button type="button" class="petline${PT.down ? " down" : ""}" title="${esc(PT.tip)}">${ASSETS.icon_pet ? `<img src="${ASSETS.icon_pet}" alt="">` : ""}<span class="pn">${esc(PT.name)}</span><span class="bar pethp"><i style="width:${PT.pct}%"></i><em>${esc(PT.label)}</em></span></button>` : ""}
        <div class="who"><span class="coins"><img src="${ASSETS.coin}" alt="">${player.coins}</span><span class="clock" title="Hora do dia">${LIGHT.darkness(player.dayT) > 0.3 || inCrypt ? "☾" : "☀"} ${Math.floor(LIGHT.hourOf(player.dayT))}h</span>${foodLow ? `<span class="foodlow${player.foodPulseT > 0 ? " pulse" : ""}" title="${food ? "Só resta 1 comida" : "Sem comida"}: pesque ou cace e asse na fogueira antes de lutar mais"><img src="${ASSETS.icon_food_low}" alt="">${food}</span>` : ""}<span class="reg" title="${esc(reg.name)}${reg.lvl ? " · " + esc(reg.lvl) : ""}">${reg.icon && ASSETS[reg.icon] ? `<img class="ricon" src="${ASSETS[reg.icon + "_32"] || ASSETS[reg.icon]}" alt="">` : ""}<span class="rname">${esc(reg.name)}</span></span></div>
        ${Object.keys(player.buffs).length ? `<div class="buffs">${Object.entries(player.buffs).map(([k, v]) => `<span style="border-color:${BUFFS[k].color}">${esc(BUFFS[k].name)} ${Math.ceil(v * TICK)}s</span>`).join("")}</div>` : ""}`;
      const s = TUTORIAL[player.tut.step];
      const qs = QUEST.tracker();
      // rodada 30: botão ✚ (celular) mostra o coração e quanto cura a melhor comida da mochila
      const te = document.getElementById("touch-eat"); if (te && ASSETS.icon_heal_small) {
        const best = player.inv.reduce((b, s) => s && ITEMS[s.name].heal && !s.name.startsWith("Poção") && ITEMS[s.name].heal > b ? ITEMS[s.name].heal : b, 0);
        const html = `<img src="${ASSETS.icon_heal_small}" alt="">${best ? `<small>+${best}</small>` : ""}`; if (te.dataset.h !== html) { te.dataset.h = html; te.innerHTML = html; te.title = best ? `Comer (1): cura ${best}` : "Sem comida pronta"; }
      }
      const ec = api.echo && api.echo(); // rodada 23: eco desperto
      if (ec) qs.unshift(`<small class="echo">${ASSETS.item_echo_crystal ? `<img class="qicon" src="${ASSETS.item_echo_crystal}" alt="">` : ""}Eco desperto</small> ${esc(ec.d.name)} em ${esc(ec.d.where.replace(" (eco semanal)", ""))} <b>${Math.max(0, Math.ceil(ec.hp))}/${ec.d.hp}</b>`);
      $("quest").hidden = !s && !qs.length;
      $("quest").innerHTML = (s ? `${ASSETS.icon_tutorial_step ? `<img class="qicon" src="${ASSETS.icon_tutorial_step}" alt="">` : ""}<small>Tarefa ${player.tut.step + 1}/${TUTORIAL.length}</small> ${esc(s.text)} <b>${player.tut.n}/${s.n}</b>` : "") + qs.map((x) => `<div class="qline">${x}</div>`).join("");
      for (const b of document.querySelectorAll("#panel .tabs button")) b.classList.toggle("on", b.dataset.tab === hudTab);
      for (const t of ["inv", "skills", "combat", "journal"]) $("tab-" + t).hidden = t !== hudTab;
      if (hudTab === "inv") {
        const fi = document.activeElement && document.activeElement.closest && document.activeElement.closest("#tab-inv") ? document.activeElement.dataset.i : null; // rodada 40: mantém o foco do teclado
        // rodada 41: só um espaço entra no Tab (o último em foco, ou o primeiro com item); as setas andam entre eles
        const filled = player.inv.map((s, i) => s ? i : -1).filter((i) => i >= 0), rov = filled.includes(+(fi ?? invFocus)) ? +(fi ?? invFocus) : filled[0];
        $("tab-inv").innerHTML = player.inv.map((s, i) => {
          if (!s) return `<div class="slot"></div>`;
          const it = ITEMS[s.name];
          const B = it.buff && BUFFS[it.buff];
          const tip = `${s.name}${it.heal ? ` · cura ${it.heal} (clique para comer)` : ""}${B ? ` · ${B.name} por ${B.ticks * TICK} s (clique para beber)` : ""}${it.cook ? (level(player.xp.culinaria) < it.cookLvl ? ` · asse numa fogueira (requer Culinária ${it.cookLvl})` : ` · asse numa fogueira (${Math.round(RULES.burnChance(level(player.xp.culinaria), it.cookLvl) * 100)}% de queimar)`) : ""} · vale ${it.price} · clique direito larga no chão`;
          const tip2 = it.slot ? `${accName(s)} · ${RARITY[it.rarity].name}${s.aff ? " com afixos" : ""} · ${bonusText(accBonus(s))} · clique para equipar` : tip;
          const tipAttr = it.slot ? `data-tip="${esc(itemTip(s, "clique para equipar · clique direito larga no chão"))}"` : `title="${esc(tip2)}"`;
          return `<div class="slot${isSpecial(s.name) || s.aff ? " rare" : ""}${s.aff ? " affix" : ""}" data-i="${i}" tabindex="${i === rov ? 0 : -1}" role="button" ${tipAttr} ${it.rarity ? `style="border-color:${RARITY[it.rarity].color}"` : ""}>${iconImg(s.name)}${s.n > 1 ? `<span>${s.n}</span>` : ""}${it.heal && !s.name.startsWith("Poção") && ASSETS.icon_heal_small ? `<i class="heal"><img src="${ASSETS.icon_heal_small}" alt="">${it.heal}</i>` : ""}${it.cook && ASSETS.icon_cook_level && RULES.burnChance(level(player.xp.culinaria), it.cookLvl) === 0 ? `<img class="cookok" src="${ASSETS.icon_cook_level}" alt="" title="Não queima mais no seu nível">` : ""}${s.aff ? `<i class="aff">${affBadges(s)}</i>` : ""}</div>`;
        }).join("") + `<button class="craft-btn">Artesanato · criar itens</button>`;
        if (fi != null) { const el = $("tab-inv").querySelector(`[data-i="${fi}"]`) || $("tab-inv").querySelector(".slot[tabindex]"); if (el) el.focus(); }
      } else if (hudTab === "skills") {
        $("tab-skills").innerHTML = Object.entries(SKILLS).map(([k, n]) => {
          const xp = player.xp[k], l = level(xp), a = xpFor(l), b = xpFor(l + 1), pct = l >= MAX_LVL ? 100 : ((xp - a) / (b - a)) * 100;
          return `<div class="skill" title="${Math.floor(xp)} xp${l < MAX_LVL ? ` · faltam ${Math.ceil(b - xp)} para o nível ${l + 1}` : ""}"><span>${n}</span><b>${l}</b><div class="bar xp"><i style="width:${pct}%"></i></div></div>`;
        }).join("");
      } else if (hudTab === "combat") {
        // rodada 104: espaço do boneco. espada/armadura = peças forjadas (GEAR); o resto vem da mochila (VD.EQUIP_SLOTS)
        const dollSlot = (k) => {
          const S = VD.EQUIP_SLOTS[k], e = player.equip[k];
          // rodada 105: secundária pela classe (escudo, flechas, orbe ou livro); montante (duas mãos) tranca o escudo
          const hs = S.sec && VD.SEC[(HEROES.find((h) => h.id === player.hero) || {}).sec], w = player.equip.arma && ITEMS[player.equip.arma.name];
          if (S.sec && !e && w && w.twoH) return `<div class="dslot empty locked" title="${esc(player.equip.arma.name)} usa as duas mãos: sem escudo."><span class="q">${hs ? hs.empty : S.empty}</span><small>${S.name}</small></div>`;
          if (S.sec && !e) return `<div class="dslot empty" title="${S.name}: ${hs ? esc(hs.name.toLowerCase()) : "vazio"} (equipe pela mochila)"><span class="q">${hs ? hs.empty : S.empty}</span><small>${S.name}</small></div>`;
          if (S.sec && e && ITEMS[e.name].ammo) return `<div class="dslot" data-unequip="${k}" style="border-color:${itemColor(e.name)}" data-tip="${esc(itemTip(e, `${e.n} na aljava · clique para guardar`))}">${iconImg(e.name)}<i class="aff ammo">${e.n}</i><small>${S.name}</small></div>`;
          return `<div class="dslot${e ? "" : " empty"}" ${e ? `data-unequip="${k}" style="border-color:${e.aff ? "#ffd84a" : itemColor(e.name)}" data-tip="${esc(itemTip(e, "clique para guardar"))}"` : `title="${S.name}: vazio (equipe pela mochila)"`}>${e ? iconImg(e.name) + (e.aff || e.master ? `<i class="aff">${affBadges(e)}${e.master ? masterBadge(k === "armadura" ? "armadura" : ITEMS[e.name].gear) : ""}</i>` : "") : `<span class="q">${S.empty}</span>`}<small>${S.name}</small></div>`;
        };
        const st = combatStats();
        $("tab-combat").innerHTML = `<div class="styles">${Object.entries(STYLES).map(([k, s]) => `<button data-style="${k}" class="${player.style === k ? "on" : ""}" title="${esc(s.desc)}">${s.name}</button>`).join("")}</div>
          <p class="desc">${esc(STYLES[player.style].desc)}${passiveHtml(STYLES[player.style])}</p>
          <button class="wide char-btn">Ficha do personagem (P)</button>
          <div class="stats"><span>Acerto <b>${st.acc}</b></span><span>Dano máx. <b>${st.maxHit}</b></span><span>Defesa <b>${st.def}</b></span><span>Vida máx. <b>${maxHp()}</b></span></div>
          <div class="doll">${["capacete", "amuleto", "armadura", "calca", "botas"].map(dollSlot).join("")}<img class="dhero" src="${ValdoraOutfit.doll() || ASSETS[player.hero]}" alt="">${["capa", "arma", "municao", "anel", "bracelete"].map(dollSlot).join("")}</div>
          ${Object.keys(VD.EQUIP_SLOTS).filter((k) => player.equip[k]).map((k) => { const e = player.equip[k]; // rodada 104: só as peças vestidas (as vazias aparecem no boneco)
            return `<div class="gear acc" data-unequip="${k}" data-tip="${esc(itemTip(e, "clique para guardar na mochila"))}">${iconImg(e.name)}<span style="color:${e.aff ? "#ffd84a" : itemColor(e.name)}">${esc(accName(e))}<small>${bonusText(accBonus(e))}</small></span>${affBadges(e)}</div>`; }).join("")}`;
      } else {
        const got = ACHIEVEMENTS.filter((a) => player.ach[a.id]).length;
        const QS = VD.QUESTS, rwText = (rw) => [rw.coins && `${rw.coins} moedas`, ...Object.entries(rw.xp || {}).map(([k, v]) => `${v} xp de ${SKILLS[k]}`),
          ...Object.entries(rw.items || {}).map(([k, v]) => `${v}x ${k}`), rw.item && `${rw.item}${rw.aff ? ` (${rw.aff} afixo${rw.aff > 1 ? "s" : ""})` : ""}`].filter(Boolean).join(", ");
        const giverName = { guard: "Ivo", bard: "Tomé", shop: "Bento" };
        const active = Object.entries(player.quests).filter(([id, q]) => QS[id] && !QS[id].act && !q.done), done = Object.entries(player.quests).filter(([id, q]) => QS[id] && !QS[id].act && q.done); // rodada 78: a campanha tem seção própria
        const qIcon = (k) => ASSETS[k] ? `<img class="qicon" src="${ASSETS[k]}" alt="">` : "";
        const questsHtml = `<div class="journal-h">${ASSETS.icon_journal_quests ? `<img class="qicon" src="${ASSETS.icon_journal_quests}" alt="">` : ""}Missões <small>${done.length}/${Object.values(QS).filter((Q) => !Q.act).length}</small>${ASSETS.icon_key_m ? `<img class="kicon" src="${ASSETS.icon_key_m}" alt="M" title="Tecla M abre o diário">` : ""}</div>`
          + (active.length || done.length ? "" : `<p class="empty">Nenhuma missão ainda. Procure "!" sobre o Ivo, o Tomé e o Bento.</p>`)
          // rodada 36: prontas para entregar primeiro, depois em andamento, depois concluídas
          + active.slice().sort((a, b) => QUEST.ready(b[0]) - QUEST.ready(a[0])).map(([id, q]) => { const Q = QS[id], st = Q.steps[q.step], rd = QUEST.ready(id);
            return `<div class="jquest${rd ? " ready" : ""}">${qIcon(rd ? "icon_quest_turnin" : "icon_quest_32")}<b>${esc(Q.name)}</b> <small>${rd ? "pronta para entregar · " : ""}${giverName[Q.giver] || ""} · passo ${q.step + 1}/${Q.steps.length}</small>
              <div>${esc(st.text)}${st.n ? ` <b>${q.n}/${st.n}</b>` : ""}</div><small class="rw">Recompensa: ${esc(rwText(Q.reward))}</small></div>`; }).join("")
          + done.map(([id]) => `<div class="jquest done">${qIcon("icon_quest_done")}<b>${esc(QS[id].name)}</b> <small>concluída</small></div>`).join("");
        // rodada 78: campanha "Os Marcos de Lumeira": atos com as missões (feitas, a atual e as próximas) e os atos que vêm depois
        const C = VD.CAMPAIGN, RN = ["", "I", "II", "III", "IV", "V"];
        const campHtml = C ? `<div class="journal-h">${qIcon("icon_quest_32")}Campanha: ${esc(C.name)}</div><p class="camp-premise">${esc(C.premise)}</p>` + C.acts.map((A) => {
          if (!A.quests) return `<div class="camp-act locked"><div class="camp-h"><span>Ato ${RN[A.n]}: ${esc(A.name)}</span><small>em breve</small></div><small>${esc(A.region)} · ${esc(A.lvl)}${A.npc ? ` · ${esc(A.npc)}` : ""}</small></div>`;
          const nDone = A.quests.filter((id) => player.quests[id] && player.quests[id].done).length;
          return `<div class="camp-act"><div class="camp-h"><span>Ato ${RN[A.n]}: ${esc(A.name)}</span><small>${nDone}/${A.quests.length}</small></div><small>${esc(A.region)} · ${esc(A.lvl)}</small><ul>${A.quests.map((id) => {
            const q = player.quests[id], Q = QS[id], st = q && !q.done && Q.steps[q.step];
            const lock = !q && !QUEST.available(id) ? (Q.minCombat && player.quests[Q.after] && player.quests[Q.after].done ? ` (Combate ${Q.minCombat})` : "") : "";
            return `<li class="${q && q.done ? "ok" : q ? "now" : ""}">${q && q.done ? "✔ " : q ? "▸ " : "· "}${esc(Q.name)}${st ? `: ${esc(st.text)}` : q ? "" : lock || (QUEST.available(id) ? ` (fale com ${ValdoraQuests.NPC_NAME[Q.giver]})` : "")}</li>`; }).join("")}</ul>
            <small>${nDone === A.quests.length ? "Liberado: " : "Recompensa: "}${esc(A.reward)}</small></div>`; }).join("") : "";
        $("tab-journal").innerHTML = campHtml + questsHtml + `<div class="journal-h">Conquistas <small>${got}/${ACHIEVEMENTS.length}</small></div><div class="achs">${ACHIEVEMENTS.map((a) =>
          `<span class="ach${player.ach[a.id] ? " on" : ""}" title="${esc(a.desc)} · ${a.coins} moedas">${player.ach[a.id] ? "★" : "☆"} ${esc(a.name)}</span>`).join("")}</div>
          <div class="journal-h">Bestiário${window.ValdoraDaily ? (() => { const DY = ValdoraDaily, c = DY.seenCount(player.kills, MOBS), nx = DY.next(player.kills, player.bestiary, MOBS);
            return ` <small>${c} descobertas${nx ? ` · prêmio aos ${nx.n}` : ""}</small>`; })() : ""}</div>` + Object.entries(MOBS).map(([k, d]) => {
          const n = player.kills[k] || 0;
          if (!n) return `<div class="beast unknown"><span class="q">?</span><div><b>???</b><br><small>${esc(d.where)}</small></div></div>`;
          const drops = d.drops.map(([item, p]) => player.seen["drop:" + k + ":" + item]
            ? `<span class="${ITEMS[item].rare ? "r" : ""}">${esc(item)} ${p >= 1 ? "sempre" : p >= 0.1 ? Math.round(p * 100) + "%" : "1/" + Math.round(1 / p)}</span>` : `<span class="u">???</span>`).join("");
          return `<div class="beast"><img src="${ASSETS[d.spr]}" alt="" ${d.tint ? `style="filter:${d.tint}"` : ""}><div><b>${esc(d.name)}</b>${d.boss ? ` <span class="btag boss">chefe</span>` : d.mini ? ` <span class="btag">mini-chefe</span>` : ""} <small>nv ${d.lvl} · vida ${d.hp} · ${n} abatido${n > 1 ? "s" : ""}</small>
            <div class="bwhere"><small>${esc(whereText(k, d))}</small>${respawnHtml(k, d)}</div><div class="drops">${drops}</div></div></div>`;
        }).join("");
      }
    }
    return { render, passiveHtml };
  }
  return { create };
})();

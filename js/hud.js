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
    // rodada 113: resumo do item ao passar o mouse na mochila: o que ele faz e quanto muda em relação ao que está vestido
    const ST = { acc: "acerto", dmg: "dano", def: "defesa", gather: "% coleta", tool: "ferramenta" };
    function statsOf(e) { // números de uma peça (bônus + afixos + tier da forja); ferramentas contam o tier como "ferramenta"
      if (!e) return {};
      const it = ITEMS[e.name], o = { ...(accBonus(e) || {}) };
      if (it.gear) { const t = GEAR[it.gear].tiers[it.tier];
        if (it.gear === "espada") { o.acc = (o.acc || 0) + (t.acc || 0); o.dmg = (o.dmg || 0) + (t.dmg || 0); }
        else if (it.gear === "armadura") o.def = (o.def || 0) + (t.def || 0);
        else o.tool = t.bonus || 0; }
      for (const k of Object.keys(o)) if (!o[k]) delete o[k];
      return o;
    }
    const sgn = (v) => (v > 0 ? `<b class="up">+${v}</b>` : `<b class="down">−${-v}</b>`);
    function invTip(s, player) {
      const it = ITEMS[s.name], kg = (w) => String(Math.round(w * 10) / 10).replace(".", ",");
      const col = s.aff ? "#ffd84a" : it.rarity ? RARITY[it.rarity].color : "#fff";
      let h = `<b style="color:${col}">${esc(accName(s))}</b>${s.n > 1 ? ` <small>x${s.n}</small>` : ""}`;
      if (it.slot) {
        const S = VD.EQUIP_SLOTS[it.slot], cur = player.equip[it.slot], mine = statsOf(s), now = statsOf(cur);
        h += `<br><small>${esc(S.name)}${it.rarity ? " · " + esc(RARITY[it.rarity].name) : ""}${it.need ? ` · requer Combate ${it.need}` : ""}</small>`;
        const line = Object.entries(mine).map(([k, v]) => `+${v} ${ST[k] || k}`).join(", ");
        if (line) h += `<div>${esc(line)}</div>`;
        if (it.pack) h += `<div>+${it.pack.slots} espaços · +${it.pack.cap} kg de carga</div>`;
        if (it.ammo) h += `<div>munição do Arqueiro</div>`;
        if (cur && cur.name !== s.name) {
          const keys = [...new Set([...Object.keys(mine), ...Object.keys(now)])], d = keys.map((k) => [k, (mine[k] || 0) - (now[k] || 0)]).filter(([, v]) => v);
          const cp = cur && ITEMS[cur.name].pack;
          if (it.pack && cp) d.push(["espaços", it.pack.slots - cp.slots], ["kg de carga", it.pack.cap - cp.cap]);
          h += `<div class="tip-cmp">No lugar de ${esc(accName(cur))}: ${d.filter(([, v]) => v).map(([k, v]) => `${sgn(v)} ${ST[k] || k}`).join(", ") || "sem diferença"}</div>`;
        } else if (!cur) h += `<div class="tip-cmp">Espaço vazio: tudo isso é ganho.</div>`;
        else h += `<div class="tip-cmp">Igual ao que você está usando.</div>`;
      } else if (it.heal) {
        const hp = Math.max(0, player.hp), mh = api.maxHp(), to = Math.min(mh, hp + it.heal);
        h += `<div>Cura ${it.heal} de vida</div><div class="tip-cmp">Agora: ${hp}/${mh} → ${sgn(to - hp)} = ${to}/${mh}</div>`;
      } else if (it.buff) { const B = BUFFS[it.buff]; h += `<div>${esc(B.name)} por ${B.ticks * TICK} s</div>${B.desc ? `<small>${esc(B.desc)}</small>` : ""}`; }
      else if (it.cook) { const l = level(player.xp.culinaria); h += `<div>Cru: asse numa fogueira (Culinária ${it.cookLvl})</div><small>${l < it.cookLvl ? "seu nível ainda não deixa assar" : `${Math.round(RULES.burnChance(l, it.cookLvl) * 100)}% de queimar`}</small>`; }
      else if (it.quest) h += `<div>Item de missão</div>`;
      else { const R = [...Object.values(VD.CRAFT), ...Object.values(VD.SMELT)], uses = R.filter((r) => r.mats && r.mats[s.name]).length; h += `<div>Material${it.region ? " da região" : ""}${uses ? ` · usado em ${uses} receita${uses > 1 ? "s" : ""}` : ""}</div>`; }
      for (const a of s.aff || []) h += `<div class="tip-aff">${esc(ValdoraUI.affLine(a))}</div>`;
      const w = VD.weightOf(s.name);
      h += `<small class="tip-hint">peso ${kg(w)} kg${s.n > 1 ? ` (total ${kg(w * s.n)} kg)` : ""} · vale ${it.price} moedas · clique para opções</small>`;
      return h;
    }
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
    const LV = { view: "mobs", map: "" }; // rodada 137: página do Livro
    document.addEventListener("click", (e) => { const b = e.target.closest && e.target.closest("#tab-livro [data-lv], #tab-livro [data-lvmap]"); if (!b) return;
      if (b.dataset.lv) LV.view = b.dataset.lv; if (b.dataset.lvmap != null) LV.map = b.dataset.lvmap; $("tab-livro").dataset.k = ""; api.dirty && api.dirty(); });
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
        if (!$("me-coin").getAttribute("src")) $("me-coin").src = ASSETS.coin;
        const L = api.load && api.load(), lb = $("me-load"); // rodada 112: peso carregado / carga
        if (L && lb) { lb.className = ["", "heavy", "crawl"][L.k]; lb.firstChild.style.width = Math.min(100, L.r * 100) + "%"; lb.lastChild.textContent = `${L.w.toLocaleString("pt-BR")}/${L.cap} kg`;
          lb.title = L.k === 2 ? "Peso demais: anda igual a uma tartaruga. Guarde ou venda itens." : L.k === 1 ? "Pesado: anda mais devagar." : "Peso: leve"; } }
      { const pb = $("pvp-mode"), st = player.pk > 0 ? "hostile locked" : player.pvpMode === "hostile" ? "hostile" : "passive"; // rodada 148: botão das espadas
        if (pb && pb.dataset.st !== st) { pb.dataset.st = st; pb.className = "pvp-btn " + st;
          pb.title = st === "passive" ? "Modo Passivo: não acerta jogadores. Clique para ir ao modo Hostil." : st === "hostile" ? "Modo Hostil: pode atacar jogadores nas zonas PvP. Clique para voltar ao Passivo." : "Modo Hostil travado: você é PK. Fica assim até o PK acabar ou o Pacificador limpar."; } }
      { const pv = api.pvpHere && api.pvpHere(), pk = player.pk > 0; // rodada 147: zona PvP e marca de PK embaixo do lugar
        const lh = `${reg.icon && ASSETS[reg.icon] ? `<img class="ricon" src="${ASSETS[reg.icon + "_32"] || ASSETS[reg.icon]}" alt="">` : ""}${esc(reg.name)}${reg.lvl ? `<small>${esc(reg.lvl)}</small>` : ""}`
          + `<div class="loc-z"><span class="${pv ? "pvp" : "safe"}">${pv ? "⚔ zona PvP" : "zona sem PvP"}</span>${pk ? `<span class="pk"><img src="${ASSETS.pk_skull}" alt=""> PK ${ValdoraPvP.fmt(player.pk)}</span>` : ""}</div>`;
        if ($("loc").dataset.h !== lh) { $("loc").dataset.h = lh; $("loc").innerHTML = lh; } } // rodada 139: o lugar sempre embaixo do minimapa
      $("player-info").innerHTML = `<div class="who"><b${PR ? ` style="color:${PR.color}" title="${esc(PR.title)}"` : ""}>${PR && ValdoraShrine.badge(PR) ? `<img class="tbadge" src="${ValdoraShrine.badge(PR)}" alt="">` : ""}${esc(player.name)}</b><span class="lvl" title="Nível total (soma das habilidades)">${player.name.length + (PR ? 2 : 0) > 13 ? "Nv." : "Nível total"} ${totalLevel()}</span></div>
        <div class="bar hp"><i style="width:${Math.min(100, (hp / mh) * 100)}%"></i><em>${hp} / ${mh}</em>${vm ? `<span class="votive" title="Chama votiva: mais ${vm} min">${ASSETS.icon_votive_hud ? `<img src="${ASSETS.icon_votive_hud_32 || ASSETS.icon_votive_hud}" alt="">` : "✦"}<span class="vm">${vm} min</span></span>` : ""}</div>
        ${PT ? `<button type="button" class="petline${PT.down ? " down" : ""}" title="${esc(PT.tip)}">${ASSETS.icon_pet ? `<img src="${ASSETS.icon_pet}" alt="">` : ""}<span class="pn">${esc(PT.name)}</span><span class="bar pethp"><i style="width:${PT.pct}%"></i><em>${esc(PT.label)}</em></span></button>` : ""}
        <div class="who"><span class="coins"><img src="${ASSETS.coin}" alt="">${player.coins}</span>${foodLow ? `<span class="foodlow${player.foodPulseT > 0 ? " pulse" : ""}" title="${food ? "Só resta 1 comida" : "Sem comida"}: pesque ou cace e asse na fogueira antes de lutar mais"><img src="${ASSETS.icon_food_low}" alt="">${food}</span>` : ""}</div>
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
      for (const t of ["inv", "skills", "combat", "journal", "book", "coll", "mount", "guild", "livro", "passive"]) $("tab-" + t).hidden = t !== hudTab;
      // rodada 137: o painel é uma janela que abre pelo menu de baixo à direita (estilo Cambria)
      const TITLES = { inv: "Mochila", skills: "Níveis", combat: "Equipamento", journal: "Tasks", book: "Skills e atalhos", coll: "Coleção", mount: "Montaria", guild: "Guilda", livro: "Livro dos monstros", passive: "Passivas" };
      $("panel").classList.toggle("big", ["journal", "livro", "coll", "guild"].includes(hudTab)); $("panel").classList.toggle("small", ["inv", "book", "passive"].includes(hudTab)); // rodada 139
      $("panel").classList.toggle("inv-w", hudTab === "inv"); $("panel").classList.toggle("book-w", hudTab === "book"); $("panel").classList.toggle("passive-w", hudTab === "passive"); // rodada 140
      $("panel").hidden = !hudTab; $("panel-title").textContent = TITLES[hudTab] || "";
      for (const b of document.querySelectorAll("#menubar [data-menu], #roundbar [data-menu]")) b.classList.toggle("on", b.dataset.menu === hudTab || (b.dataset.menu === "config" && !$("options").hidden));
      if (hudTab === "book") { // rodada 138: estilo Cambria: todas as skills em ícones com o nível; liberadas arrastam para a barra
        const acts = api.hotActions().filter((a) => a.skill), hb = player.hotbar || [], pick = api.hotPick && api.hotPick(); // rodada 139: só as skills de combate
        const groups = [...new Set(acts.map((a) => a.kind.replace(/ \(.*\)/, "")))];
        $("tab-book").innerHTML = `<small class="desc">Arraste a skill até a barra (1 a 9). Comida e poções: arraste da mochila.</small>`
          + groups.map((g) => `<div class="sk-group"><div class="sk-h">${esc(g === "Passiva" ? "Passivas" : g === "Poção" ? "Poções" : g === "Ação" ? "Ações" : g.replace(/^Skill de /, "Skills de "))}</div><div class="sk-grid">${acts.filter((a) => a.kind.replace(/ \(.*\)/, "") === g).map((a) => {
            const ok = api.hotUnlocked(a), on = hb.includes(a.id);
            const tip = `<b style="color:#ffd84a">${esc(a.name)}</b><br><small>${esc(a.kind)} · nível ${a.lvl || 1}${a.cls ? ` de ${esc(VD.SKILLS[a.cls])}` : ""}${a.cd ? ` · recarga ${a.cd} s` : ""}</small><div>${esc(a.desc)}</div>${ok ? (a.passive ? "<small>Ativa sozinha com o estilo escolhido</small>" : "<small>Arraste para a barra</small>") : `<small style="color:#ff9a7a">Libera no ${esc(VD.SKILLS[a.cls || "combate"])} ${a.lvl}</small>`}`;
            return `<div class="sk-card${ok ? "" : " locked"}${on ? " on" : ""}${pick === a.id ? " pick" : ""}" data-skillcard="${esc(a.id)}" ${a.passive ? 'data-passive="1"' : ""} draggable="${ok && !a.passive ? "true" : "false"}" data-tip="${esc(tip)}">
              ${a.icon ? `<img src="${a.icon}" alt="" draggable="false">` : `<span class="ic">•</span>`}<b class="lv">${a.lvl || 1}</b>${ok ? "" : `<i class="lock">🔒</i>`}${on ? `<i class="eq">${hb.indexOf(a.id) + 1}</i>` : ""}<small>${esc(a.name)}</small></div>`;
          }).join("")}</div></div>`).join("");
      } else if (hudTab === "coll") {
        const C = VD.COLLECTIONS || [], st = player.coll || {}, cnt = (n) => player.inv.reduce((t, s) => t + (s && s.name === n ? s.n : 0), 0);
        const done = C.filter((c) => Object.entries(c.items).every(([n, q]) => (st[c.id] || {})[n] >= q)).length;
        $("tab-coll").innerHTML = `<small class="desc">Registre itens do bestiário (o item é guardado na coleção). Completou, o bônus vale para sempre. ${done}/${C.length} completas.</small>` + C.map((c) => {
          const got = st[c.id] || {}, full = Object.entries(c.items).every(([n, q]) => (got[n] || 0) >= q);
          return `<div class="coll${full ? " done" : ""}"><h4>${esc(c.name)}<small>${full ? "✔ completa" : ""}</small></h4>${Object.entries(c.items).map(([n, q]) => {
            const g = Math.min(q, got[n] || 0), have = cnt(n), ic = ASSETS[(ITEMS[n] || {}).icon];
            return `<div class="ci">${ic ? `<img src="${ic}" alt="">` : "<span></span>"}<span>${esc(n)} <small>${g}/${q}${g < q ? ` · na mochila: ${have}` : ""}</small></span>
              <button data-coll="${c.id}" data-item="${esc(n)}" ${g >= q || !have ? "disabled" : ""}>Registrar</button></div>`; }).join("")}
            <div class="bonus">Bônus: ${esc(bonusText(c.bonus))}</div></div>`;
        }).join("");
      } else if (hudTab === "livro" && ($("tab-livro").dataset.k !== (LV.view + LV.map))) { // rodada 137: o livro só é refeito quando muda a página
        $("tab-livro").dataset.k = LV.view + LV.map;
        const pct = (p) => p >= 1 ? "sempre" : p >= 0.1 ? Math.round(p * 100) + "%" : p >= 0.01 ? (Math.round(p * 1000) / 10).toString().replace(".", ",") + "%" : (Math.round(p * 10000) / 100).toString().replace(".", ",") + "%";
        const col = (n) => ITEMS[n] && ITEMS[n].rarity ? RARITY[ITEMS[n].rarity].color : "#e8e0c8";
        const maps = VD.MAP_GEAR || [], mapOf = (d) => maps.find((M) => d.lvl >= M.lv[0] && d.lvl <= M.lv[1]) || maps[0];
        const list = Object.entries(MOBS).filter(([, d]) => !d.summon && !d.temp && !d.echo && (!LV.map || mapOf(d).n === +LV.map)).sort((a, b) => a[1].lvl - b[1].lvl);
        const head = `<div class="lv-tabs"><button data-lv="mobs" class="${LV.view === "mobs" ? "on" : ""}">Monstros</button><button data-lv="items" class="${LV.view === "items" ? "on" : ""}">Itens e recursos</button></div>
          <div class="lv-maps"><button data-lvmap="" class="${!LV.map ? "on" : ""}">Todos</button>${maps.map((M) => `<button data-lvmap="${M.n}" class="${+LV.map === M.n ? "on" : ""}">${esc(M.tag.replace(/^d[oa]s? /, ""))}</button>`).join("")}</div>`;
        if (LV.view === "mobs") {
          $("tab-livro").innerHTML = head + list.map(([k, d]) => {
            const loot = (VD.mapLoot ? VD.mapLoot(d) : []).map(([rar, p, items]) => `<span title="${esc(items.join(", "))}" style="color:${RARITY[rar].color}">Equip. ${esc(RARITY[rar].name.toLowerCase())} <b>${pct(p)}</b></span>`).join("");
            const drops = (d.drops || []).map(([n, p, a = 1, b = a]) => `<span style="color:${col(n)}">${esc(n)}${b > 1 ? ` ${a}-${b}` : ""} <b>${pct(p)}</b></span>`).join("");
            return `<div class="lv-mob"><img src="${(api.mobThumb && api.mobThumb(d.spr)) || ASSETS[d.spr] || ""}" alt="" ${d.tint ? `style="filter:${d.tint}"` : ""}><div><b>${esc(d.name)}</b> <small>nível ${d.lvl}${d.boss ? " · chefe" : ""}</small><br><small>${esc(d.where || "")}</small></div>
              <div class="dl">${drops}${loot}</div></div>`;
          }).join("");
        } else {
          const by = {}; // item -> [[monstro, chance]]
          for (const [, d] of list) {
            for (const [n, p] of d.drops || []) (by[n] = by[n] || []).push([d.name, p]);
            for (const [, p, items] of VD.mapLoot ? VD.mapLoot(d) : []) for (const n of items) (by[n] = by[n] || []).push([d.name, p / items.length]);
          }
          $("tab-livro").innerHTML = head + Object.keys(by).sort((a, b) => (ITEMS[a].price || 0) - (ITEMS[b].price || 0)).map((n) => {
            const src = by[n].sort((a, b) => b[1] - a[1]), ic = ASSETS[(ITEMS[n] || {}).icon];
            return `<div class="lv-item">${ic ? `<img class="qicon" src="${ic}" alt="" ${ITEMS[n].filter ? `style="filter:${ITEMS[n].filter}"` : ""}>` : ""}<b style="color:${col(n)}">${esc(n)}</b> <small>${src.slice(0, 6).map(([m, p]) => `${esc(m)} ${pct(p)}`).join(" · ")}${src.length > 6 ? ` · +${src.length - 6}` : ""}</small></div>`;
          }).join("");
        }
      } else if (hudTab === "passive") { // rodada 139: aba só das passivas (vêm do estilo de luta escolhido)
        const P = api.hotActions().filter((a) => a.passive);
        $("tab-passive").innerHTML = `<small class="desc">A passiva do estilo escolhido (aba Equip.) fica ativa sozinha.</small><div class="sk-grid">${P.map((a) => {
          const on = a.id === "passive:" + player.style, tip = `<b style="color:#ffd84a">${esc(a.name)}</b><br><small>${esc(a.kind)}</small><div>${esc(a.desc)}</div>`;
          return `<div class="sk-card${on ? " on" : " locked"}" data-tip="${esc(tip)}">${a.icon ? `<img src="${a.icon}" alt="">` : ""}<b class="lv">${a.lvl}</b><small>${esc(a.name)}</small></div>`; }).join("")}</div>`;
      } else if (hudTab === "mount") {
        $("tab-mount").innerHTML = `<div class="soon"><span class="big">🐎</span><b>Montarias</b><br><small>Em breve: montarias para atravessar o continente mais rápido.</small></div>`;
      } else if (hudTab === "guild") {
        $("tab-guild").innerHTML = `<div class="soon"><span class="big">⚑</span><b>Guildas</b><br><small>Em breve: crie ou entre numa guilda com outros aventureiros.</small></div>`;
      }
      if (hudTab === "inv") {
        const fi = document.activeElement && document.activeElement.closest && document.activeElement.closest("#tab-inv") ? document.activeElement.dataset.i : null; // rodada 40: mantém o foco do teclado
        // rodada 41: só um espaço entra no Tab (o último em foco, ou o primeiro com item); as setas andam entre eles
        const filled = player.inv.map((s, i) => s ? i : -1).filter((i) => i >= 0), rov = filled.includes(+(fi ?? invFocus)) ? +(fi ?? invFocus) : filled[0];
        $("tab-inv").innerHTML = player.inv.map((s, i) => {
          if (!s) return `<div class="slot" data-to="inv:${i}"></div>`; // rodada 141: casa vazia recebe item arrastado
          const it = ITEMS[s.name];
          const B = it.buff && BUFFS[it.buff];
          const tip = `${s.name}${it.heal ? ` · cura ${it.heal} (clique para comer)` : ""}${B ? ` · ${B.name} por ${B.ticks * TICK} s (clique para beber)` : ""}${it.cook ? (level(player.xp.culinaria) < it.cookLvl ? ` · asse numa fogueira (requer Culinária ${it.cookLvl})` : ` · asse numa fogueira (${Math.round(RULES.burnChance(level(player.xp.culinaria), it.cookLvl) * 100)}% de queimar)`) : ""} · vale ${it.price} · clique direito larga no chão`;
          const tip2 = it.slot ? `${accName(s)} · ${RARITY[it.rarity].name}${s.aff ? " com afixos" : ""} · ${bonusText(accBonus(s))} · clique para equipar` : tip;
          const tipAttr = `data-tip="${esc(invTip(s, player))}" aria-label="${esc(tip2)}"`; // rodada 113: resumo com a comparação; o texto curto vai para o leitor de tela
          return `<div class="slot${isSpecial(s.name) || s.aff ? " rare" : ""}${s.aff ? " affix" : ""}" data-i="${i}" data-drag="inv:${i}" data-to="inv:${i}" draggable="true" tabindex="${i === rov ? 0 : -1}" role="button" ${tipAttr} ${it.rarity ? `style="border-color:${RARITY[it.rarity].color}"` : ""}>${iconImg(s.name)}${s.n > 1 ? `<span>${s.n}</span>` : ""}${it.heal && !s.name.startsWith("Poção") && ASSETS.icon_heal_small ? `<i class="heal"><img src="${ASSETS.icon_heal_small}" alt="">${it.heal}</i>` : ""}${it.cook && ASSETS.icon_cook_level && RULES.burnChance(level(player.xp.culinaria), it.cookLvl) === 0 ? `<img class="cookok" src="${ASSETS.icon_cook_level}" alt="" title="Não queima mais no seu nível">` : ""}${s.aff ? `<i class="aff">${affBadges(s)}</i>` : ""}</div>`;
        }).join("") + `<button class="craft-btn">Artesanato · criar itens</button>`;
        if (fi != null) { const el = $("tab-inv").querySelector(`[data-i="${fi}"]`) || $("tab-inv").querySelector(".slot[tabindex]"); if (el) el.focus(); }
      } else if (hudTab === "skills") {
        $("tab-skills").innerHTML = Object.entries(SKILLS).map(([k, n]) => {
          const xp = player.xp[k], l = RULES.skillLevel(k, xp), a = RULES.skillXpFor(k, l), b = RULES.skillXpFor(k, l + 1), pct = l >= MAX_LVL ? 100 : ((xp - a) / (b - a)) * 100;
          const head = k === "guerreiro" ? `<div class="skill-h">Classes <small>sobem usando a arma de cada uma</small></div>` : ""; // rodada 151
          return `${head}<div class="skill${RULES.isClass(k) ? " cls" : ""}" title="${Math.floor(xp)} xp${l < MAX_LVL ? ` · faltam ${Math.ceil(b - xp)} para o nível ${l + 1}` : ""}"><img class="sk-ic" src="assets/ui/skill_${k}.png" alt=""><span>${n}</span><b>${l}</b><div class="bar xp"><i style="width:${pct}%"></i></div></div>`;
        }).join("");
      } else if (hudTab === "combat") {
        // rodada 104: espaço do boneco. espada/armadura = peças forjadas (GEAR); o resto vem da mochila (VD.EQUIP_SLOTS)
        const dollSlot = (k) => {
          const S = VD.EQUIP_SLOTS[k], e = player.equip[k];
          // rodada 105: secundária pela classe (escudo, flechas, orbe ou livro); montante (duas mãos) tranca o escudo
          const sk = S.sec && (HEROES.find((h) => h.id === player.hero) || {}).sec, hs = S.sec && VD.SEC[sk], w = player.equip.arma && ITEMS[player.equip.arma.name];
          const ph = (key, alt) => `<img class="slotph" src="assets/ui/slot_${key}.png" alt="" onerror="this.replaceWith(document.createTextNode('${alt}'))">`; // rodada 149: silhueta do espaço vazio
          const phSec = hs ? ph(sk, hs.empty) : ph("municao", S.empty);
          if (S.sec && !e && w && w.twoH) return `<div class="dslot empty locked" title="${esc(player.equip.arma.name)} usa as duas mãos: sem escudo."><span class="q">${phSec}</span><small>${S.name}</small></div>`;
          if (S.sec && !e) return `<div class="dslot empty" title="${S.name}: ${hs ? esc(hs.name.toLowerCase()) : "vazio"} (equipe pela mochila)"><span class="q">${phSec}</span><small>${S.name}</small></div>`;
          if (S.sec && e && ITEMS[e.name].ammo) return `<div class="dslot" data-unequip="${k}" style="border-color:${itemColor(e.name)}" data-tip="${esc(itemTip(e, `${e.n} na aljava · clique para guardar`))}">${iconImg(e.name)}<i class="aff ammo">${e.n}</i><small>${S.name}</small></div>`;
          return `<div class="dslot${e ? "" : " empty"}" ${e ? `data-unequip="${k}" style="border-color:${e.aff ? "#ffd84a" : itemColor(e.name)}" data-tip="${esc(itemTip(e, "clique para guardar"))}"` : `title="${S.name}: vazio (equipe pela mochila)"`}>${e ? iconImg(e.name) + (e.aff || e.master ? `<i class="aff">${affBadges(e)}${e.master ? masterBadge(k === "armadura" ? "armadura" : ITEMS[e.name].gear) : ""}</i>` : "") : `<span class="q">${ph(k, S.empty)}</span>`}<small>${S.name}</small></div>`;
        };
        const st = combatStats();
        $("tab-combat").innerHTML = `<div class="styles">${Object.entries(STYLES).map(([k, s]) => `<button data-style="${k}" class="${player.style === k ? "on" : ""}" title="${esc(s.desc)}">${s.name}</button>`).join("")}</div>
          <p class="desc">${esc(STYLES[player.style].desc)}${passiveHtml(STYLES[player.style])}</p>
          <button class="wide char-btn">Ficha do personagem (P)</button>
          <div class="stats"><span>Acerto <b>${st.acc}</b></span><span>Dano máx. <b>${st.maxHit}</b></span><span>Defesa <b>${st.def}</b></span><span>Vida máx. <b>${maxHp()}</b></span></div>
          <div class="doll">${["capacete", "amuleto", "armadura", "calca", "botas", "mochila"].map(dollSlot).join("")}<img class="dhero" src="${ValdoraOutfit.doll() || ASSETS[player.hero]}" alt="">${["capa", "arma", "municao", "anel", "bracelete"].map(dollSlot).join("")}</div>
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
        // rodada 140: Tasks em 3 colunas que cabem na tela (sem rolar); monstros e saques ficam no Livro dos monstros
        const bestTxt = window.ValdoraDaily ? (() => { const DY = ValdoraDaily, c = DY.seenCount(player.kills, MOBS), nx = DY.next(player.kills, player.bestiary, MOBS);
          return `${c} monstros descobertos${nx ? ` · prêmio aos ${nx.n}` : ""}`; })() : "";
        $("tab-journal").innerHTML = `<div class="tk-col tk-camp">${campHtml}</div><div class="tk-col">${questsHtml}</div><div class="tk-col">`
          + `<div class="journal-h">Conquistas <small>${got}/${ACHIEVEMENTS.length}</small></div><div class="achs">${ACHIEVEMENTS.map((a) =>
          `<span class="ach${player.ach[a.id] ? " on" : ""}" title="${esc(a.desc)} · ${a.coins} moedas">${player.ach[a.id] ? "★" : "☆"} ${esc(a.name)}</span>`).join("")}</div>`
          + `<div class="journal-h">Bestiário</div><p class="desc">${esc(bestTxt)}. Os monstros, onde vivem e o que deixam cair estão no Livro dos monstros (B).</p></div>`;
      }
    }
    return { render, passiveHtml };
  }
  return { create };
})();

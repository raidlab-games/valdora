// Valdora — janelas (rodada 9: saiu do game.js). Títulos e falas fixas de cada janela e montagem da ficha do personagem.
// Só monta HTML a partir dos dados recebidos; quem decide quando abrir/fechar e trata os cliques é o game.js.
// Rodada 54: create(api).render(dlg) desenha a janela aberta (título, abas, fala e corpo).
window.ValdoraDialogs = (() => {
  "use strict";
  const esc = ValdoraUI.esc;
  const DLG = {
    shop: { title: "Banca do Bento", talk: "\"Pago bem por madeira, minério, peixe e espólios. E tenho ferramentas melhores, se tiver moedas.\"",
      tabs: [["sell", "Vender"], ["buy", "Comprar"], ["orders", "Encomendas"]] },
    guard: { title: "Guarda Ivo", talk: "" },
    bank: { title: "Cofre da vila", talk: "Clique num item da mochila para guardar; clique no cofre para retirar." },
    fire: { title: "Fogueira", talk: "Escolha o que assar e quantos. Assa um por vez e cada assado vai para a mochila. Sair andando ou apertar ESC apaga a fila." }, // rodada 155
    furnace: { title: "Fornalha", talk: "Funda minério em barras. Fique ao lado enquanto trabalha." },
    anvil: { title: "Bigorna", talk: "Forje armas, ferramentas e peitorais a partir de barras (as primeiras ferramentas, de cobre, saem direto do minério). A peça pronta vai para a mochila: clique nela para vestir." },
    witch: { title: "Feiticeira Morgana", talk: "\"Ervas certas, fogo baixo e paciência. Traga os ingredientes e eu ensino o resto.\"" }, // rodada 117
    warden: { title: "Guardião", talk: "" },
    harbor: { title: "Cais", talk: "", tabs: [["boats", "Barcos"], ["up", "Melhorias"], ["fix", "Conserto"]] }, // rodada 162: estaleiro
    dwarf: { title: "Peixaria", talk: "", tabs: [["sell", "Vender peixe"], ["bait", "Iscas"], ["log", "Diário de pesca"]] }, // rodada 162: o anão pescador do píer // rodada 120: mestre do cais (título = nome do cais) // rodada 114: guardiões das vilas novas (título = nome do NPC)
    deathbag: { title: "Saco de morte", talk: "" }, // rodada 146
    stable: { title: "Celeiro de Lumeira", talk: "\"Cavalo bom é cavalo bem tratado. Escolha o seu: quanto mais você cavalga, mais cavalo você aguenta.\" — Teodoro" }, // rodada 156
    peace: { title: "Pacificador", talk: "\"Sangue não lava sangue, viajante. Mas ouro compra o perdão dos homens.\"" }, // rodada 147
    craft: { title: "Mesa de artesanato", talk: "Ferramentas de pedra, tecidos, roupas de couro (Arqueiro) e de tecido (Mago), mochilas e o que não leva metal. Cada peça pede um nível de Artesanato: escolha o que criar para subir." },
    bard: { title: "Tomé, o bardo", talk: "" },
    char: { title: "Ficha do personagem", talk: "" },
    shrine: { title: "Santuário de Lumeira", talk: "Pedras antigas, três velas e uma tigela de ouro. Quem oferta tem o nome lembrado pela vila." },
    marker: { title: "Marco", talk: "" }, // rodada 78
    herb: { title: "Juna, a raizeira", talk: "" }, // rodada 79
    carto: { title: "Odília, a cartógrafa", talk: "" }, // rodada 80
    miner: { title: "Brás, o garimpeiro", talk: "" }, // rodada 81: marcos da campanha (título e fala vêm de js/campaign.js)
    pet: { title: "Companheiro", talk: "" },
    home: { title: "Casa", talk: "" },
    waystone: { title: "Pedra da vila", talk: "" }, // rodada 105 // rodada 100 // rodada 96: filhote da lua (vida, vínculo e nome)
    board: { title: "Quadro de caçadas", talk: "Pedidos da guarda para manter as estradas seguras. O progresso conta sozinho; volte aqui para receber." },
  };
  // linha padrão das listas (ícone, título, subtítulo, preço, botões)
  const row = (icon, title, sub, price, buttons) => `<div class="row">${icon}<span class="grow">${title}${sub ? `<br><small>${sub}</small>` : ""}</span>${price != null ? `<span class="price">${price}</span>` : ""}${buttons}</div>`;

  // ficha do personagem: v = valores já calculados pelo jogo
  function charSheet(v) {
    const stat = (k, val) => `<div class="cs-stat"><span>${k}</span><b>${val}</b></div>`;
    return `<div class="charsheet">
      <div class="cs-top"><img class="cs-hero" src="${v.heroImg}" alt=""><div><b class="cs-name"${v.rank ? ` style="color:${v.rank.color}"` : ""}>${esc(v.name)}</b><br><small>${esc(v.heroName)} · nível total ${v.total}</small>
        ${v.rank ? `<br><span class="cs-title" style="color:${v.rank.color}">${ValdoraShrine.badge(v.rank) ? `<img src="${ValdoraShrine.badge(v.rank)}" alt="">` : "★ "}${esc(v.rank.title)}</span>` : ""}
        <br><small>Tempo de jogo: ${v.hours}h${String(v.mins).padStart(2, "0")} · ${esc(v.region)}</small></div></div>
      <div class="cs-grid">
        <div><div class="cs-h">Combate</div>
          ${stat("Acerto", v.st.acc)}${stat("Dano máximo", v.st.maxHit)}${stat("Defesa", v.st.def)}${stat("Vida", `${Math.max(0, v.hp)} / ${v.st.maxHp}`)}
          ${stat("Crítico", v.crit + "%")}${stat("Estilo", esc(v.style.name))}
          ${v.style.passive ? `<div class="cs-stat" data-tip="${esc(`${v.passiveIcon ? `<img class="picon" src="${v.passiveIcon}" alt="">` : ""}<b>${esc(v.style.passive.name)}</b><div>${esc(v.style.passive.desc)}</div>`)}"><span>Passiva</span><b>${v.passiveIcon ? `<img class="picon" src="${v.passiveIcon}" alt="">` : ""}${esc(v.style.passive.name)}</b></div>` : ""}
          ${stat("Bônus de coleta", "+" + v.gather + "%")}
          ${v.buffs.length ? stat("Efeitos", v.buffs.map(esc).join(", ")) : ""}</div>
        <div><div class="cs-h">Habilidades</div>${v.skills.map((s) => `${stat(s.name, s.lvl)}<div class="bar xp"><i style="width:${s.pct}%"></i></div>`).join("")}</div>
      </div>
      ${v.chances ? `<div class="cs-h">Chances no seu nível</div><div class="cs-chances">${v.chances.map(([n, c]) => `<span>${esc(n)} <b>${c}</b></span>`).join("")}</div>` : ""}
      <div class="cs-h">Equipamento</div>${v.gearRows}
      <div class="cs-h">Feitos</div>
      <div class="cs-feats">${v.feats.map(([k, n]) => `<span>${k} <b>${n}</b></span>`).join("")}</div>
    </div>`;
  }
  const tierIcon = (g, t) => ASSETS[t && t.icon && ASSETS[t.icon] ? t.icon : g.icon]; // o tier pode ter ícone próprio (rodada 22: Couraça de lumita)
  const gearIcon = (g, t) => `<img src="${tierIcon(g, t)}" alt="">`; // ícone da peça de equipamento (banca e forja)
  // rodada 46: peça bloqueada por nível — o cadeado no lugar do ícone e o nível que falta em destaque
  const lockedIcon = (g, t) => ASSETS.icon_gear_locked ? `<img src="${ASSETS.icon_gear_locked}" alt="bloqueado" title="Bloqueado por nível">` : gearIcon(g, t);
  // rodada 54: desenho da janela aberta (antes renderDlg no game.js). O game.js passa o que é do estado do jogo;
  // dados, regras e ajudantes de interface vêm dos módulos globais.
  function create(api) {
    const $ = (id) => document.getElementById(id);
    const { ITEMS, TUTORIAL, TIPS, GEAR, REGIONS, STYLES, BUFFS, SKILLS, RES, ACHIEVEMENTS, BARD_SONGS, MOBS } = VD;
    const { iconImg, itemTip, accName, affBadges, accBonus } = ValdoraUI, RULES = ValdoraRules, { level, xpFor, MAX_LVL, bonusText } = RULES;
    const { SHOP, CRAFTING, SHRINE, questHtml, echoHtml, combatStats, tier, masterBadge, gearEffect, totalLevel, lv, rand, BANK_SLOTS, TICK, bankUpCost, bankMax } = api;
    // rodada 55: o que é só de interface — fechar, trocar de aba e o filtro do cofre (acentos e maiúsculas não importam)
    const norm = (t) => String(t).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    function applyBankFilter(dlg) {
      const f = norm(dlg && dlg.filter || ""), g = document.querySelector("#dlg-body .grid.bank"); if (!g) return;
      for (const el of g.querySelectorAll(".slot")) { const name = el.getAttribute("title") || ""; el.classList.toggle("filtered", !!f && !norm(name).includes(f)); }
    }
    document.addEventListener("keydown", (e) => { if (e.target && e.target.id === "pet-name" && e.key === "Enter") { e.preventDefault(); const b = document.querySelector("#dlg-body [data-petname]"); if (b) b.click(); } }); // rodada 96
    document.addEventListener("input", (e) => { const dlg = api.dlg(); if (e.target && e.target.id === "bank-filter" && dlg) { dlg.filter = e.target.value; applyBankFilter(dlg); } });
    function uiClick(b, dlg) {
      if (b.id === "dlg-close") { api.close(); return true; }
      if (b.dataset.tab) { dlg.tab = b.dataset.tab; render(dlg); return true; }
      return false;
    }
    function render(dlg) {
      if (!dlg) return;
      const player = api.player();
      const D = DLG[dlg.kind];
      const mv = dlg.kind === "marker" && api.markerView ? api.markerView(dlg.obj) : null; // rodada 78
      const vt = dlg.obj && dlg.obj.village && dlg.obj.name && dlg.kind === "shop" ? `Banca de ${dlg.obj.name}` : dlg.kind === "warden" && dlg.obj ? dlg.obj.name : dlg.kind === "harbor" && dlg.obj ? dlg.obj.label : dlg.kind === "dwarf" && dlg.obj ? `Peixaria ${dlg.obj.art || "do"} ${dlg.obj.name}` : null; // rodada 105: mercadores das vilas novas; 114: guardiões
      $("dlg-title").innerHTML = ValdoraUI.titleHTML(vt || (mv ? mv.title : D.title), "#ffd84a", 1); // rodada 68: fonte de títulos
      $("dlg-coins").innerHTML = `<img src="${ASSETS.coin}" alt=""> ${player.coins}`;
      $("dlg-tabs").innerHTML = (D.tabs || []).map(([k, n]) => `<button data-tab="${k}" class="${dlg.tab === k ? "on" : ""}">${n}</button>`).join("");
      $("dlg-tabs").hidden = !D.tabs;
      let talk = D.talk, html = "";
      if (dlg.kind === "shop") {
        html = SHOP.html(dlg.tab); // banca do Bento (js/shop.js)
      } else if (dlg.kind === "guard") {
        const s = TUTORIAL[player.tut.step];
        if (s) {
          const prev = TUTORIAL[player.tut.step - 1];
          talk = `"${(prev && player.tut.n === 0 ? prev.say + " " : "") + s.say}"`;
          const rw = [s.reward.coins ? `${s.reward.coins} moedas` : "", ...Object.entries(s.reward.items || {}).map(([k, q]) => `${q}x ${k}`)].filter(Boolean).join(", ");
          html = `<div class="quest-card">${ASSETS.icon_tutorial_step ? `<img class="qicon" src="${ASSETS.icon_tutorial_step}" alt="">` : ""}<b>Tarefa ${player.tut.step + 1} de ${TUTORIAL.length}</b><p>${esc(s.text)}</p><div class="bar xp"><i style="width:${player.tut.n / s.n * 100}%"></i></div>
            <small>${player.tut.n} / ${s.n}${rw ? ` · recompensa: ${esc(rw)}` : ""}</small></div>`;
        } else {
          if (dlg.tip == null) { const M = VD.TIP_MIN || [], ok = TIPS.map((_, i) => i).filter((i) => (M[i] || 1) <= lv("combate")); dlg.tip = ok.length ? ok[Math.floor(rand() * ok.length)] : 0; } // rodada 26: sorteada ao abrir; rodada 54: só as do nível
          talk = `"${TIPS[dlg.tip]}"`; dlg.tipIcon = true;
          html = questHtml("guard") || `<p class="empty">Você concluiu o treinamento. Volte para ouvir mais conselhos.</p>`;
        }
      } else if (dlg.kind === "bank") {
        const box = (attr) => attr === "wd" ? "bank" : "inv"; // rodada 141: casas arrastáveis (mochila <-> cofre)
        const grid = (arr, attr) => { const first = arr.findIndex(Boolean); return arr.map((s, i) => s ? `<div class="slot${ITEMS[s.name].rare ? " rare" : ""}" tabindex="${i === first ? 0 : -1}" role="button" data-${attr}="${i}" data-drag="${box(attr)}:${i}" data-to="${box(attr)}:${i}" draggable="true" title="${esc(s.name)}">${iconImg(s.name)}${s.n > 1 ? `<span>${s.n}</span>` : ""}</div>` : `<div class="slot" data-to="${box(attr)}:${i}"></div>`).join(""); }; // rodada 41: um espaço no Tab por grade
        html = `<div class="bank-head">Mochila <button data-depall="1" title="Guarda tudo menos comida, poções e acessórios">${ASSETS.icon_bank_move ? `<img src="${ASSETS.icon_bank_move}" alt="">` : ""}Guardar materiais</button></div><div class="grid">${grid(player.inv, "dep")}</div>
          <div class="bank-head">Cofre <small>${player.bank.filter(Boolean).length}/${player.bank.length}</small>
            ${player.bank.length < (bankMax || 99) ? `<button data-bankup="1" ${player.coins < bankUpCost() ? "disabled" : ""} title="Cada ampliação dá +2 espaços; o preço sobe 20% do inicial a cada vez">Ampliar +2 · ${bankUpCost()} moedas</button>` : ""}
            <input id="bank-filter" type="search" placeholder="filtrar" aria-label="Filtrar o cofre" value="${esc(dlg.filter || "")}">
            <button data-sortbank="1" title="Organiza o cofre: comida, materiais, barras e raros, cada grupo em ordem alfabética">${ASSETS.icon_bank_sort ? `<img src="${ASSETS.icon_bank_sort}" alt="">` : ""}Organizar</button>
            <button data-takefood="1" title="Tira a comida que couber na mochila, da que mais cura para a que menos cura">${ASSETS.icon_bank_take ? `<img src="${ASSETS.icon_bank_take}" alt="">` : ""}Retirar comida</button></div>
          <div class="grid bank">${grid(player.bank, "wd")}</div>`; // rodada 43
      } else if (dlg.kind === "furnace") {
        html = CRAFTING.furnaceHtml();
      } else if (dlg.kind === "char") {
        const st = combatStats(), hero = HEROES.find((h) => h.id === player.hero), S = player.stats;
        const gearRows = Object.entries(VD.EQUIP_SLOTS).map(([k, S]) => { const e = player.equip[k]; return `<div class="cs-row"${e ? ` data-tip="${esc(itemTip(e))}"` : ""}>${e ? iconImg(e.name) : '<span class="q">–</span>'}<span ${e && e.aff ? 'style="color:#ffd84a"' : ""}>${e ? esc(accName(e)) : `${S.name}: vazio`} ${affBadges(e)}</span><small>${e ? esc(bonusText(accBonus(e))) : ""}</small></div>`; }).join(""); // rodada 104: todos os espaços do boneco
        html = charSheet({ heroImg: ASSETS[player.hero], name: player.name, heroName: hero.name, rank: SHRINE.rankOf(player.offered || 0), total: totalLevel(),
          hours: Math.floor(player.playT / 3600), mins: Math.floor(player.playT / 60) % 60, region: REGIONS[player.region || "town"].name,
          st, hp: player.hp, crit: Math.round(RULES.critChance(player.style) * 100), style: STYLES[player.style], passiveIcon: ASSETS[(STYLES[player.style].passive || {}).icon],
          gather: Object.values(player.equip).reduce((t, e) => t + (e ? accBonus(e).gather : 0), 0), buffs: Object.keys(player.buffs).map((k) => BUFFS[k].name),
          skills: Object.entries(SKILLS).map(([k, n]) => { const xp = player.xp[k], l = level(xp), a = xpFor(l), b = xpFor(l + 1); return { name: n, lvl: l, pct: l >= MAX_LVL ? 100 : (xp - a) / (b - a) * 100 }; }),
          chances: [ // rodada 29: coleta (recursos liberados) e queima ao assar
            ...Object.values(RES).filter((R) => lv(R.skill) >= R.req).map((R) => [R.name, Math.round(RULES.gatherChance(lv(R.skill), R.req, Math.max(0, tier(R.tool).bonus - (R.need || 0)), Object.values(player.equip).reduce((t, e) => t + (e ? accBonus(e).gather : 0), 0) / 100 + (player.master[R.tool] ? 0.05 : 0), R.skill === "corte") * 100) + "%"]),
            ...Object.entries(ITEMS).filter(([, it]) => it.cook && lv("culinaria") >= it.cookLvl).map(([n, it]) => [`Queimar ${it.cook.toLowerCase()}`, Math.round(RULES.burnChance(lv("culinaria"), it.cookLvl) * 100) + "%"])],
          gearRows, feats: [["Monstros", S.kills], ["Chefes", S.bosses], ["Criptas", S.crypts || 0], ...(S.riftBest ? [["Fenda (recorde)", `${Math.floor(S.riftBest / 60)}:${String(S.riftBest % 60).padStart(2, "0")} · ${S.rifts || 0}x`]] : []), ["Tocas", S.dens || 0], ["Raros", S.rares], ["Forjas", S.forged], ["Obras-primas", S.masterworks || 0],
            ["Conquistas", `${Object.keys(player.ach).length}/${ACHIEVEMENTS.length}`], ["Moedas", player.coins]] });
      } else if (dlg.kind === "bard") {
        talk = dlg.song || (dlg.song = BARD_SONGS[Math.floor(rand() * BARD_SONGS.length)]);
        const B = BUFFS.inspirado;
        html = questHtml("bard") + `<button class="wide" data-song="1">Pedir outra canção</button>
          <button class="wide" data-gift="1" ${player.coins < 10 ? "disabled" : ""}>Dar 10 moedas: ${esc(B.name)} (+${B.acc} acerto, +${B.def} defesa, ${B.ticks * TICK / 60} min)</button>`;
      } else if (dlg.kind === "stable") { // rodada 156
        html = api.stableHtml ? api.stableHtml() : "";
      } else if (dlg.kind === "peace") { // rodada 147
        html = api.peaceHtml ? api.peaceHtml() : "";
      } else if (dlg.kind === "deathbag") { // rodada 146: o que caiu na morte
        html = api.deathBagHtml ? api.deathBagHtml(dlg.obj) : "";
      } else if (dlg.kind === "fire") {
        html = CRAFTING.fireHtml();
      } else if (dlg.kind === "craft") {
        html = CRAFTING.craftHtml();
      } else if (dlg.kind === "board") {
        html = (api.dailyHtml ? api.dailyHtml() : "") + player.bounties.map((b, i) => { // rodada 80: caçada do dia no topo
          const d = MOBS[b.type], done = b.have >= b.n;
          return row(`<img src="${ASSETS[d.spr]}" alt="" style="transform:scaleX(-1)${d.tint ? `;filter:${d.tint}` : ""}">`,
            `Derrote ${b.n}x ${esc(d.name)} <small>(${b.have}/${b.n})</small>`, `${esc(d.where)} · nv ${d.lvl} · +${b.xp} xp de Combate`, b.coins,
            `<button data-claim="${i}" ${done ? "" : "disabled"}>Receber</button><button data-reroll-b="${i}" ${b.have ? "disabled" : ""} title="Trocar (só antes de começar)">↻</button>`);
        }).join("") + echoHtml();
      } else if (dlg.kind === "anvil") {
        html = CRAFTING.anvilHtml();
      } else if (dlg.kind === "shrine") {
        html = (api.travelHtml ? api.travelHtml("town") : "") + SHRINE.html(player, esc, row); // rodada 49; rodada 78: pedras de passagem primeiro
      } else if (dlg.kind === "miner") { // rodada 81
        const BT = ["Lumita boa canta quando bate a picareta. A ruim só faz barulho.", "Golem não é bicho. É turno.", "Quarenta anos aqui em cima. A vila desce, eu fico."];
        talk = `"${dlg.say0 || (dlg.say0 = BT[Math.floor(rand() * BT.length)])}"`; html = questHtml("miner") || `<p class="empty">O Brás afia a picareta e não levanta os olhos.</p>`;
      } else if (dlg.kind === "carto") { // rodada 80
        const OT = ["Já viu um mapa sem monstros desenhados? Eu também não. Ainda.", "As colunas daqui são mais velhas que a capital. Não conte a ninguém da capital.", "Nota de rodapé: esqueletos não leem. Que pena."];
        talk = `"${dlg.say0 || (dlg.say0 = OT[Math.floor(rand() * OT.length)])}"`; html = questHtml("carto") || `<p class="empty">A Odília está ocupada desenhando. Ela acena sem levantar os olhos.</p>`;
      } else if (dlg.kind === "herb") { // rodada 79: Juna (missões e, depois de "Raízes inquietas", a alquimia)
        const JT = ["Não pise na hortelã.", "Casca de carvalho, pele de lobo, paciência. O resto é segredo.", "A mata escuta. Fale baixo.", "O Ivo ainda reclama de mim? Ótimo."];
        talk = `"${dlg.say0 || (dlg.say0 = JT[Math.floor(rand() * JT.length)])}"`;
        html = questHtml("herb") + (api.alchemyHtml ? api.alchemyHtml() : "");
      } else if (dlg.kind === "waystone" && api.stoneDlg) { // rodada 105
        const S = api.stoneDlg(); talk = S.talk; html = S.html;
      } else if (dlg.kind === "witch" && api.potionHtml) { // rodada 117: Alquimia
        html = api.potionHtml();
      } else if (dlg.kind === "warden" && dlg.obj) { // rodada 114: guardião da vila (missões do bioma até o chefe)
        talk = `"${dlg.obj.hello}"`; html = questHtml(dlg.obj.giver) || `<p class="empty">Você já fez tudo o que havia por aqui. O bioma inteiro lhe deve um favor.</p>`;
      } else if (dlg.kind === "harbor" && dlg.obj) { // rodada 120: cais; rodada 162: estaleiro (barcos, melhorias e conserto)
        const HT = ["Vento de popa é meio caminho andado. Contra o vento, o barco se arrasta.", "Canhão de bombordo é o Q, de estibordo é o E. Encoste de lado no inimigo!",
          "Dizem que há ilhas no horizonte que nenhum mapa desenhou ainda.", "Longe da costa o mar fica bravo: tubarões, serpentes e corsários.", "No ponto mais fundo de cada mar mora um polvo do tamanho de uma casa."];
        talk = `"${dlg.say0 || (dlg.say0 = HT[Math.floor(rand() * HT.length)])}" — ${dlg.obj.name}`;
        html = api.harborHtml ? api.harborHtml(dlg.obj, dlg.tab) : "";
      } else if (dlg.kind === "dwarf" && dlg.obj) { // rodada 162: o anão pescador
        const DT = ["Peixe bom é peixe fresco! Traga que eu pago mais que o Bento.", "Cardume fundo, longe da costa, é onde mora peixe graúdo. Siga as gaivotas!",
          "Peixe bravo puxa a linha sozinho: dê linha e espere ele cansar.", "Isca de lula brilhante... dizem que o Rei-das-marés não resiste.", "Meu avô pescou um atum maior que este píer. Juro pela minha barba!"];
        talk = `"${dlg.say0 || (dlg.say0 = DT[Math.floor(rand() * DT.length)])}" — ${dlg.obj.name}`;
        html = api.dwarfHtml ? api.dwarfHtml(dlg.tab, dlg.obj) : "";
      } else if (dlg.kind === "home" && api.homeDlg) { // rodada 100
        const H = api.homeDlg(); talk = H.talk; html = H.html;
      } else if (dlg.kind === "pet" && api.petDlg) { // rodada 96
        const P = api.petDlg(); talk = P.talk; html = P.html;
      } else if (mv) {
        talk = mv.talk; html = mv.html;
      }
      if (dlg.say) talk = `"${dlg.say}"`;
      $("dlg-talk").textContent = talk; $("dlg-talk").hidden = !talk; $("dlg-talk").classList.toggle("tip", !!(dlg.tipIcon && ASSETS.icon_tip));
      $("dlg-body").innerHTML = html;
      if (dlg.kind === "bank") applyBankFilter(dlg); // rodada 43
    }
    return { render, uiClick, applyBankFilter };
  }
  return { DLG, row, gearIcon, lockedIcon, tierIcon, charSheet, create };
})();

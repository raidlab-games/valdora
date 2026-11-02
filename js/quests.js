// Valdora — missões com história (rodada 8: saiu do game.js).
// Estado por missão em player.quests[id] = { step, n, done }. O jogo passa um pequeno "api" com o que a missão precisa
// (jogador, inventário, recompensas e efeitos); este módulo não desenha nada no canvas.
// Rodada 78 (campanha): passo de conversa com outro NPC (step.to), entrega num marco (step.at, feita pela janela do marco),
// itens ganhos ao concluir um passo (step.gives), itens que o NPC fica na conversa (step.take), próxima missão aceita sozinha (next)
// e recompensa que libera algo no mundo (reward.unlock, só texto: o efeito vem do estado das missões).
window.ValdoraQuests = (() => {
  "use strict";
  const NPC_NAME = { guard: "Ivo", bard: "Tomé", shop: "Bento", herb: "Juna", carto: "Odília", miner: "Brás", // rodada 79: Juna, a raizeira
    w_breu: "Lúcio (Breu)", w_escarpa: "Tobias (Escarpa)", w_oasis: "Samira (Oásis)", w_degelo: "Edda (Degelo)" }; // rodada 114: guardiões das vilas novas
  const ROMAN = ["", "I", "II", "III", "IV", "V"];
  function create(api) {
    const { QUESTS, TUTORIAL } = VD, esc = ValdoraUI.esc;
    const P = () => api.player();
    const state = (id) => P().quests[id]; // undefined = ainda não aceita
    const available = (id) => { const Q = QUESTS[id];
      return !state(id) && (!Q.needTutorial || !TUTORIAL[P().tut.step]) && (!Q.after || (state(Q.after) && state(Q.after).done))
        && (!Q.minCombat || !api.lv || api.lv("combate") >= Q.minCombat) // rodada 64: Combate mínimo para oferecer
        && (!Q.minBond || (!!api.petBond && api.petBond() >= Q.minBond)); }; // rodada 97: vínculo mínimo com o filhote
    const icon = () => ASSETS.icon_quest_32 ? `<img class="qicon" src="${ASSETS.icon_quest_32}" alt="">` : ""; // pergaminho (Flow)
    const canDeliver = (st) => st.deliver && Object.entries(st.deliver).every(([k, v]) => api.count(k) >= v);
    const stepOf = (id) => { const q = state(id); return q && !q.done ? QUESTS[id].steps[q.step] : null; };
    const who = (Q, st) => st.to || Q.giver; // quem conclui o passo de conversa/entrega
    const isLast = (Q, q) => q.step === Q.steps.length - 1;
    const actTag = (Q) => Q.act ? `Ato ${ROMAN[Q.act] || Q.act} · ` : "";

    function event(ev, n) { // chamado por emit(): "kill:goblin", "crypt", "gather:Madeira"...
      for (const [id, q] of Object.entries(P().quests)) {
        if (q.done) continue;
        const st = QUESTS[id] && QUESTS[id].steps[q.step]; if (!st || !st.ev || st.ev !== ev) continue;
        q.n += n; api.dirty();
        if (q.n < st.n && api.progress) api.progress(`${QUESTS[id].name}: ${q.n}/${st.n}`); // aviso discreto, mesmo sem estar focado na missão
        if (q.n >= st.n) advance(id);
      }
    }
    function advance(id) {
      const q = P().quests[id], Q = QUESTS[id], done = Q.steps[q.step];
      for (const [k, v] of Object.entries((done && done.gives) || {})) { api.give(k, v); api.log(`Você pegou: ${v}x ${k}.`, "gold"); } // rodada 78
      q.step++; q.n = 0; api.dirty();
      const next = Q.steps[q.step];
      api.sound("quest"); api.toast(Q.name, next ? next.text : "Missão concluída!", "#7dff9a");
      api.log(`✔ ${Q.name}: ${next ? "próximo passo — " + next.text : "concluída!"}`, "gold"); api.save();
      if (api.stepChanged) api.stepChanged(id);
    }
    function accept(id) {
      if (!QUESTS[id] || !available(id)) return;
      P().quests[id] = { step: 0, n: 0, done: false }; api.sound("quest"); api.log(`Missão aceita: ${QUESTS[id].name}.`, "gold"); api.dirty();
      if (api.stepChanged) api.stepChanged(id);
    }
    function deliver(id) {
      const q = state(id); if (!q || q.done) return false;
      const st = QUESTS[id].steps[q.step];
      if (canDeliver(st)) { for (const [k, v] of Object.entries(st.deliver)) api.removeItem(k, v); advance(id); return true; }
      return false;
    }
    function take(st) { for (const [k, v] of Object.entries(st.take || {})) if (api.count(k) >= v) api.removeItem(k, v); }
    function talkTo(id) { // rodada 78: passo de conversa no meio da missão (o último passo de conversa usa finish)
      const q = state(id), Q = QUESTS[id]; if (!q || q.done) return false;
      const st = Q.steps[q.step]; if (!st || !st.talk || isLast(Q, q)) return false;
      take(st); advance(id); return true;
    }
    function finish(id) { // último passo "talk": entrega a recompensa e devolve a fala final
      const Q = QUESTS[id], q = state(id); if (!q || q.done || !(Q.steps[q.step] && Q.steps[q.step].talk)) return null;
      const rw = Q.reward, got = [];
      take(Q.steps[q.step]);
      q.done = true; q.step = Q.steps.length;
      if (rw.coins) { P().coins += rw.coins; got.push(`+${rw.coins} moedas`); }
      for (const [k, v] of Object.entries(rw.xp || {})) api.gainXp(k, v);
      for (const [k, v] of Object.entries(rw.items || {})) { api.give(k, v); got.push(`${v}x ${k}`); }
      if (rw.item) { api.give(rw.item, 1, api.rollAffixes(rw.aff || 0)); got.push(rw.aff ? `${rw.item} com afixo${rw.aff > 1 ? "s" : ""}` : rw.item); }
      api.sound("rare"); api.celebrate();
      api.toast(`Missão concluída: ${Q.name}`, got.join(" e ") + ".", "#7dff9a");
      api.log(`★ Missão concluída: ${Q.name} (${got.join(", ")}).`, "gold");
      if (rw.unlock) api.log(`✦ Liberado: ${rw.unlock}.`, "gold");
      if (Q.next && available(Q.next)) accept(Q.next); // rodada 78: a campanha segue sem voltar ao NPC
      else if (api.stepChanged) api.stepChanged(id);
      api.dirty(); api.save();
      return Q.outro;
    }
    function card(id, Q, q, giver) { // missão em andamento na janela do NPC
      const st = Q.steps[q.step], mine = who(Q, st) === giver && !st.at;
      let action = "", hint = "";
      if (mine && st.deliver) action = `<button class="wide" data-qdeliver="${id}" ${canDeliver(st) ? "" : "disabled"}>Entregar (${Object.entries(st.deliver).map(([k, v]) => `${api.count(k)}/${v} ${esc(k)}`).join(", ")})</button>`;
      else if (mine && st.talk) action = isLast(Q, q) ? `<button class="wide" data-qfinish="${id}">${st.scene ? "Conversar" : "Concluir missão"}</button>` : `<button class="wide" data-qtalk="${id}">Conversar</button>`;
      else if (st.talk || (st.deliver && !st.at)) hint = `<small class="qhint">Fale com ${NPC_NAME[who(Q, st)] || "alguém"}.</small>`;
      return `<div class="quest-card${Q.act ? " campaign" : ""}">${icon()}<b>${esc(Q.name)}</b> <small>${actTag(Q)}passo ${q.step + 1}/${Q.steps.length}</small><p>${esc(st.text)}${st.n ? ` <b>${q.n}/${st.n}</b>` : ""}</p>${action}${hint}</div>`;
    }
    function html(giver) { // seção de missões na janela do NPC
      let out = "";
      for (const [id, Q] of Object.entries(QUESTS).sort(([, a], [, b]) => !!b.act - !!a.act)) { // rodada 78: campanha primeiro
        const q = state(id);
        if (!q) { if (Q.giver === giver && available(id)) out += `<div class="quest-card${Q.act ? " campaign" : ""}">${icon()}<b>${Q.act ? `<small>${actTag(Q).replace(" · ", "")}</small> ` : "Nova missão: "}${esc(Q.name)}</b><p>${esc(Q.intro)}</p><button class="wide" data-qaccept="${id}">${Q.scene ? "Ouvir" : "Aceitar missão"}</button></div>`; continue; }
        if (q.done) { if (Q.giver === giver) out += `<div class="quest-card done"><b>${esc(Q.name)}</b> <small>concluída</small></div>`; continue; }
        const st = Q.steps[q.step];
        if (Q.giver === giver || (who(Q, st) === giver && !st.at)) out += card(id, Q, q, giver);
      }
      return out;
    }
    function mark(giver) { // "!" missão nova, "?" pronta para entregar
      let res = null;
      for (const [id, Q] of Object.entries(QUESTS)) {
        const q = state(id);
        if (!q) { if (Q.giver === giver && available(id) && !res) res = "!"; continue; }
        if (q.done) continue;
        const st = Q.steps[q.step];
        if (who(Q, st) === giver && !st.at && (st.talk || canDeliver(st))) return "?";
      }
      return res;
    }
    const ready = (id) => { const st = stepOf(id); return !!(st && (st.talk || (st.deliver && canDeliver(st)))); }; // rodada 36
    // linhas do quadro de acompanhamento (HUD); campanha primeiro (rodada 78)
    const tracker = () => Object.entries(P().quests).filter(([id, q]) => !q.done && QUESTS[id]).sort(([a], [b]) => !!QUESTS[b].act - !!QUESTS[a].act).map(([id, q]) => {
      const Q = QUESTS[id], st = Q.steps[q.step], rd = ready(id); // rodada 34: pronta para entregar
      const wait = !rd && st.ev === "kill:wolf_moon" && api.moonUp && !api.moonUp(); // rodada 35: a balada espera a Lua cheia
      const waitTxt = wait ? (api.night && api.night() ? " · a Lua cheia pode surgir a qualquer momento" : " · a Lua cheia vem à noite") : "";
      const ic = rd && ASSETS.icon_quest_turnin ? `<img class="qicon" src="${ASSETS.icon_quest_turnin}" alt="">` : wait && ASSETS.icon_event_soon ? `<img class="qicon" src="${ASSETS.icon_event_soon}" alt="">` : icon();
      const rdTxt = rd ? (st.at ? " · leve ao marco" : st.talk ? ` · fale com ${NPC_NAME[who(Q, st)]}` : " · pronta para entregar") : "";
      return `${ic}<small class="${[rd ? "turnin" : wait ? "soon" : "", Q.act ? "camp" : ""].filter(Boolean).join(" ")}">${actTag(Q)}${esc(Q.name)}${rdTxt}${waitTxt}</small> ${esc(st.text)}${st.n ? ` <b>${q.n}/${st.n}</b>` : ""}`;
    });
    return { state, available, event, advance, accept, deliver, talkTo, finish, html, mark, tracker, ready, stepOf, canDeliver, NPC_NAME };
  }
  return { create, NPC_NAME };
})();

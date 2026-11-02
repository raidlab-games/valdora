// Valdora — Santuário de Lumeira (rodada 49): destino para o ouro do fim de jogo.
// As oferendas só dão prestígio (título, cor do nome, halo e faíscas). Não mexem em acerto, dano, defesa nem coleta.
window.ValdoraShrine = (() => {
  "use strict";
  const RANKS = VD.SHRINE.ranks;
  const rankOf = (n) => { let r = null; for (const R of RANKS) if (n >= R.at) r = R; return r; };
  const nextOf = (n) => RANKS.find((R) => n < R.at) || null;
  const fmt = (n) => Math.floor(n).toLocaleString("pt-BR");
  // rodada 51: medalha do título (a dourada é só da Lenda, o último título)
  const badge = (R, big) => R ? ASSETS[(R === RANKS[RANKS.length - 1] ? "icon_title_badge_gold" : "icon_title_badge") + (big ? "_64" : "")] || ASSETS.icon_title_badge || "" : "";
  const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  // janela: total oferecido, título atual, barra até o próximo e a lista dos títulos
  function html(player, esc, row) {
    const n = player.offered || 0, R = rankOf(n), N = nextOf(n), prev = R ? R.at : 0, need = N ? N.at - n : 0;
    const pct = N ? Math.max(0, Math.min(100, (n - prev) / (N.at - prev) * 100)) : 100;
    const icon = ASSETS.icon_gold_sink_64 ? `<img class="shrine-icon" src="${ASSETS.icon_gold_sink_64}" alt="">` : "";
    const chest = (ok) => ASSETS.icon_gold_sink ? `<img src="${ASSETS.icon_gold_sink}" alt=""${ok ? "" : ' class="dim"'}>` : "";
    const btn = (amt, label) => `<button class="wide" data-offer="${amt}" ${player.coins < amt ? "disabled" : ""}>${label}</button>`;
    return `<div class="shrine-card">${icon}<div class="grow"><b>Oferecido: ${fmt(n)} moedas</b>
        <br><small>${R ? `Título: <b style="color:${R.color}">${esc(R.title)}</b>` : "Ainda sem título"}</small>
        <div class="bar xp"><i style="width:${pct}%"></i></div>
        <small>${N ? `faltam ${fmt(need)} para <b style="color:${N.color}">${esc(N.title)}</b>` : "Todos os títulos alcançados. As velas queimam por você."}</small></div></div>
      <div class="shrine-btns">${VD.SHRINE.steps.map((a) => btn(a, `Ofertar ${fmt(a)}`)).join("")}${N && !VD.SHRINE.steps.includes(need) ? btn(need, `Até o próximo título (${fmt(need)})`) : ""}</div>
      ${RANKS.map((r) => row(chest(n >= r.at),
        `<b style="color:${r.color}">${esc(r.title)}</b>`, esc(r.perk), fmt(r.at), n >= r.at ? "<small class=\"ok\">✓</small>" : "")).join("")}
      ${N ? "" : votiveHtml(player)}
      <p class="empty">Só prestígio: as oferendas não mudam acerto, dano, defesa nem coleta.</p>`;
  }
  // rodada 51: depois da Lenda, a chama votiva (cosmética) mantém o ouro com destino
  function votiveHtml(player) {
    const V = VD.SHRINE.votive, left = player.votiveT || 0, full = left > (V.max - V.min) * 60;
    return `<div class="shrine-card votive"><div class="grow"><b>Chama votiva</b> <small>${left > 0 ? `acesa por mais ${clock(left)}` : "apagada"}</small>
        <br><small>Uma chama acompanha você, de dia e de noite, e as velas do santuário brilham mais. ${fmt(V.cost)} moedas = ${V.min} min (até ${V.max / 60} h guardadas).
        Chamas já acesas: ${player.votives || 0}.</small></div>
        <button class="wide" data-votive="1" ${player.coins < V.cost || full ? "disabled" : ""}>${full ? "Chama cheia" : `Acender (${fmt(V.cost)})`}</button></div>`;
  }
  // rodada 53: parte "viva" do santuário (antes espalhada pelo game.js), com o mesmo comportamento
  function create(api) {
    const { ANIMS, TILE, cam, tags, rand, drawFx, fx, SND } = api;
    let sparkT = 0;
    // moedas caindo na tigela (Blender, rodada 51); sem a folha, as faíscas antigas
    function coins() {
      const o = api.npc().shrine; if (!o) return; o.flareT = 1.4;
      if (ANIMS.fx_offering_coins) o.coinT = 0; else fx.sparks(o.x + 0.95, o.y - 0.2, 12, ["#ffd84a", "#fff6c0", "#ff9a3a"], 3.5);
    }
    // oferenda (rodada 49): só prestígio — título, cor do nome, halo, faíscas
    function offer(n) {
      const player = api.player(); n = Math.floor(n); if (!(n > 0) || player.coins < n) return;
      const before = rankOf(player.offered || 0);
      player.coins -= n; player.offered = (player.offered || 0) + n; api.dirty(); SND.play("coin");
      coins();
      const R = rankOf(player.offered);
      if (R && R !== before) {
        api.toast(`Título: ${R.title}`, R.perk, R.color); SND.play("quest");
        api.log(`O santuário guarda seu nome: agora você é ${R.title}.`, "gold", "icon_gold_sink");
        api.burst(player.px + 0.5, player.py + 0.3, [R.color, "#ffffff"], 18, 3);
      } else api.log(`Você ofertou ${fmt(n)} moedas ao santuário.`, "dim", "icon_gold_sink");
      api.save();
    }
    // chama votiva (rodada 51): só depois da Lenda; cosmética
    function votive() {
      const player = api.player(), V = VD.SHRINE.votive;
      if (nextOf(player.offered || 0) || player.coins < V.cost || (player.votiveT || 0) > (V.max - V.min) * 60) return;
      player.coins -= V.cost; player.votiveT = (player.votiveT || 0) + V.min * 60; player.votives = (player.votives || 0) + 1; api.dirty(); SND.play("coin");
      coins(); api.log(`A chama votiva arde com você por mais ${V.min} min.`, "gold", "icon_gold_sink"); api.save();
    }
    function update(dt) {
      const player = api.player(), o = api.npc().shrine;
      if (o && o.flareT > 0) o.flareT = Math.max(0, o.flareT - dt);
      if (o && o.coinT != null && (o.coinT += dt) > 1.6) o.coinT = null;
      if (player.votiveT > 0) { // minutos no painel; aviso quando apaga
        const m0 = Math.ceil(player.votiveT / 60); player.votiveT = Math.max(0, player.votiveT - dt);
        if (Math.ceil(player.votiveT / 60) !== m0) api.dirty();
        if (player.votiveT === 0) { api.log("A chama votiva se apagou. Acenda outra no santuário.", "dim", "icon_gold_sink"); api.dirty(); }
      }
      const SR = player.deadT <= 0 && rankOf(player.offered || 0); // faíscas de lumita da Lenda
      if (SR && SR.sparks && (sparkT -= dt) <= 0) { sparkT = 0.55 + rand() * 0.4; fx.sparks(player.px + 0.2 + rand() * 0.6, player.py - 0.2 - rand() * 0.6, 1, ["#8fe8ff", "#e8fbff"], 0.8); }
    }
    // chama votiva (Blender, rodada 52) ao lado do ombro, do lado oposto ao olhar; de costas também ao lado (acima da cabeça ficaria sob o nome)
    function drawVotive(t) {
      const player = api.player(), A = ANIMS.fx_votive_flame; if (!A || !(player.votiveT > 0) || player.deadT > 0 || api.inCrypt()) return;
      const tag = tags.find((g) => g[0] === player.name && !g[4]); if (!tag) return;
      const side = window.DIR4(player.dir) === "right" ? -1 : 1, bob = Math.sin(t * 2.4) * 0.05;
      const cx = (tag[1] + side * 0.55) * TILE - cam.x, cy = (tag[2] + 0.42 + bob) * TILE - cam.y;
      const R = A.rows.loop; drawFx(A, Math.floor(t * R.fps) % R.frames, Math.round(cx - A.cw / 2), Math.round(cy - A.ch / 2));
    }
    // cor do nome e título sobre o herói (rodada 49)
    function titleTags() {
      const player = api.player(), PR = player && rankOf(player.offered || 0); if (!PR) return;
      for (const tg of tags.slice()) if (tg[0] === player.name && tg[3] === "#f1c40f") { tg[3] = PR.color; tags.push([`‹ ${PR.title} ›`, tg[1], tg[2] - 0.24, PR.color, true]); }
    }
    return { offer, votive, update, drawVotive, titleTags };
  }
  return { rankOf, nextOf, html, fmt, badge, create };
})();

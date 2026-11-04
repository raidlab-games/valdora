// Valdora — telas de conta (rodada 109): entrar / criar conta → escolher servidor → escolher ou criar personagem → jogar.
// Fala com js/net.js (servidor online ou modo local de teste) e com window.ValdoraGame / window.ValdoraLobby.
window.ValdoraAccount = (() => {
  "use strict";
  const $ = (id) => document.getElementById(id), N = window.ValdoraNet, G = window.ValdoraGame, L = window.ValdoraLobby;
  const esc = L ? L.esc : (s) => String(s);
  const STEPS = ["acct-login", "acct-servers", "acct-chars", "create"];
  let me = null, server = null, chars = [], busy = false;
  const store = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* sem armazenamento */ } } };

  function show(step) { for (const s of STEPS) $(s).hidden = s !== step; $("acct-bar").hidden = !me; if (me) $("acct-who").innerHTML = `Conta: <b>${esc(me.username)}</b>${server ? ` · servidor <b>${esc(server.name)}</b>` : ""}`; }
  function msg(text, kind) { const m = $("acct-msg"); m.textContent = text || ""; m.className = "acct-msg" + (kind ? " " + kind : ""); }
  async function guard(btn, fn) { // trava o botão enquanto fala com o servidor e mostra o erro amigável
    if (busy) return; busy = true; const old = btn && btn.textContent; if (btn) { btn.disabled = true; btn.textContent = "Aguarde..."; }
    try { await fn(); } catch (e) { const t = e.userMsg || e.message || "Algo deu errado."; if (STEPS.slice(1).some((s) => !$(s).hidden)) toast(t); else msg(t, "err"); console.warn(e); }
    finally { busy = false; if (btn) { btn.disabled = false; btn.textContent = old; } }
  }
  function toast(t) { let el = $("acct-toast"); if (!el) { el = document.createElement("p"); el.id = "acct-toast"; el.className = "acct-msg err"; $("acct-bar").after(el); } el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { el.hidden = true; }, 5000); }

  // ---------- entrar / criar conta ----------
  document.querySelectorAll("[data-acct]").forEach((b) => { b.onclick = () => {
    document.querySelectorAll("[data-acct]").forEach((x) => x.classList.toggle("on", x === b));
    $("f-in").hidden = b.dataset.acct !== "in"; $("f-up").hidden = b.dataset.acct !== "up"; msg("");
  }; });
  $("f-in").onsubmit = (e) => { e.preventDefault(); guard(e.submitter || $("f-in").querySelector("button[type=submit]"), async () => {
    me = await N.signIn({ login: $("in-login").value, password: $("in-pass").value }); $("in-pass").value = ""; msg(""); await servers();
  }); };
  $("f-up").onsubmit = (e) => { e.preventDefault(); guard(e.submitter || $("f-up").querySelector("button[type=submit]"), async () => {
    if ($("up-pass").value !== $("up-pass2").value) { msg("As senhas não são iguais.", "err"); return; }
    const r = await N.signUp({ username: $("up-user").value.trim(), email: $("up-email").value.trim(), password: $("up-pass").value });
    $("up-pass").value = $("up-pass2").value = "";
    if (r.confirm) { msg(`Conta criada! Enviamos um link para ${r.email}. Confirme o e-mail e depois entre com seu usuário e senha.`, "ok");
      document.querySelector('[data-acct="in"]').click(); $("in-login").value = r.username; msg(`Conta criada! Confirme o e-mail (link enviado para ${r.email}) e entre.`, "ok"); return; }
    me = await N.session(); await servers();
  }); };
  $("in-forgot").onclick = () => guard($("in-forgot"), async () => {
    const v = $("in-login").value.trim(); if (!v.includes("@")) { msg("Escreva seu e-mail no campo acima e clique de novo.", "err"); return; }
    await N.resetPassword(v); msg("Se esse e-mail tiver conta, chegou um link para criar uma senha nova.", "ok");
  });
  $("acct-out").onclick = () => guard(null, async () => { await N.signOut(); me = null; server = null; msg(""); show("acct-login"); });

  // ---------- servidores ----------
  async function servers() {
    const list = await N.servers();
    const on = list.filter((s) => s.status === "online");
    if (on.length === 1) { server = on[0]; store.set("valdora.lastServer", server.id); return charList(); } // rodada 158: um servidor só (Lumeira): vai direto aos personagens
    show("acct-servers");
    const last = store.get("valdora.lastServer");
    $("srv-list").innerHTML = list.map((s) => `<button type="button" class="srv${s.id === last ? " last" : ""}" data-srv="${esc(s.id)}" ${s.status !== "online" ? "disabled" : ""}>
      <span class="dot ${esc(s.status)}"></span><b>${esc(s.name)}</b><small>${esc(s.region)}</small>
      <span class="srv-info">${s.status === "online" ? "online" : s.status === "maintenance" ? "em manutenção" : "fechado"} · ${+s.players || 0} aventureiro${+s.players === 1 ? "" : "s"}${s.mine ? ` · <b>${s.mine} seu${s.mine > 1 ? "s" : ""}</b>` : ""}</span></button>`).join("");
    $("srv-list").querySelectorAll("[data-srv]").forEach((b) => { b.onclick = () => guard(null, async () => { server = list.find((s) => s.id === b.dataset.srv); store.set("valdora.lastServer", server.id); await charList(); }); });
  }

  // ---------- personagens ----------
  const HEROES = window.HEROES || [];
  async function charList() {
    chars = await N.listChars(server.id); show("acct-chars");
    $("chars-title").textContent = `Personagens em ${server.name} (${chars.length}/${N.MAX_CHARS})`;
    $("char-list").innerHTML = chars.length ? chars.map((c) => {
      return `<div class="char" data-char="${esc(c.id)}"><img src="${window.ASSETS && ASSETS[c.hero] || ""}" alt=""><div class="char-txt"><b>${esc(c.name)}</b><small>Nível da conta ${+c.level || 1}</small>
        ${c.updated ? `<small class="saved">jogou em ${new Date(c.updated).toLocaleString("pt-BR")}</small>` : ""}</div>
        <button type="button" class="char-play" data-play="${esc(c.id)}">ENTRAR</button><button type="button" class="char-del link" data-del="${esc(c.id)}" title="Apagar personagem">apagar</button></div>`; }).join("")
      : `<p class="acct-empty">Nenhum personagem neste servidor ainda.</p>`;
    $("char-new").disabled = chars.length >= N.MAX_CHARS;
    $("char-import").hidden = true; // rodada 152: o herói salvo antigo (com classe) não vale mais
    $("char-list").querySelectorAll("[data-play]").forEach((b) => { b.onclick = () => guard(b, () => enter(chars.find((c) => c.id === b.dataset.play))); });
    $("char-list").querySelectorAll(".char").forEach((d) => { const c = chars.find((x) => x.id === d.dataset.char);
      d.onmouseenter = () => { if (c && L) L.setLook(c.data && c.data.look, c.hero, L.looksOf ? L.looksOf(c.data) : []); };
      if (c && L && L.thumb) L.thumb(c.data || {}).then((url) => { const im = d.querySelector("img"); if (url && im) { im.src = url; im.classList.add("look"); } }); }); // rodada 157: como ele saiu
    $("char-list").querySelectorAll("[data-del]").forEach((b) => { b.onclick = () => { // dois cliques: o primeiro só arma
      if (!b.classList.contains("armed")) { b.classList.add("armed"); b.textContent = "confirmar?"; setTimeout(() => { b.classList.remove("armed"); b.textContent = "apagar"; }, 4000); return; }
      guard(null, async () => { await N.deleteChar(b.dataset.del); await charList(); }); }; });
  }
  async function enter(c) {
    const full = await N.loadChar(c.id), data = full.data ? { ...full.data, name: c.name, hero: c.hero } : { name: c.name, hero: c.hero };
    const sink = N.play(c);
    await G.start(data, { sink });
  }
  if ($("chars-back")) $("chars-back").onclick = () => guard(null, servers);
  $("char-new").onclick = () => { show("create"); $("name").value = ""; $("name").focus(); };
  $("create-back").onclick = () => show("acct-chars");
  $("char-import").onclick = () => guard($("char-import"), async () => {
    const s = G.readSave(); if (!s) return;
    await N.createChar(server.id, { name: s.name, hero: s.hero, data: s }); store.set("valdora.imported." + server.id, "1"); await charList();
  });
  async function create(name, look) { // rodada 152: personagem básico com a aparência escolhida
    look = lookSanitize(look);
    await guard($("play"), async () => { const c = await N.createChar(server.id, { name: (name || "").trim(), hero: lookHero(look), data: { v: 3, look } }); await enter(c); });
  }
  document.addEventListener("valdora:lobby", () => { if (me && server) guard(null, charList); });

  // ---------- início ----------
  $("acct-mode").textContent = N.mode === "local" ? "Modo de teste: o servidor online ainda não está ligado, então as contas ficam só neste navegador." : "";
  $("save-slot").hidden = true; $("new-warn").hidden = true; $("play").textContent = "CRIAR E ENTRAR"; $("play").classList.remove("secondary");
  show("acct-login");
  guard(null, async () => { me = await N.session(); if (me) await servers(); });
  return { create };
})();

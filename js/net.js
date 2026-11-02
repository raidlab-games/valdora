// Valdora — contas, servidores e personagens (rodada 109).
// Uma interface, dois motores:
//  - "online" (Supabase, quando js/net_config.js tem url e anonKey): login por usuário ou e-mail + senha, e-mail confirmado,
//    personagens no banco (tabela characters, um "data" JSON por personagem), regras de acesso no próprio banco;
//  - "local" (sem configuração): o mesmo fluxo guardado só neste navegador, para testar as telas sem servidor.
// O save antigo do navegador (valdora.save.v2) não é tocado: dá para trazê-lo como personagem de um servidor.
window.ValdoraNet = (() => {
  "use strict";
  const CFG = window.VALDORA_NET || {};
  const MAX_CHARS = 4; // por servidor
  const USER_RE = /^[A-Za-z0-9_]{3,14}$/, NAME_RE = /^[A-Za-zÀ-ÿ0-9 _'-]{2,14}$/;
  const err = (msg) => { const e = new Error(msg); e.userMsg = msg; throw e; };
  function checkSignUp({ username, email, password }) {
    if (!USER_RE.test(username || "")) err("Usuário: 3 a 14 letras, números ou _ (sem espaço nem acento).");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "")) err("E-mail inválido.");
    if ((password || "").length < 8) err("A senha precisa de pelo menos 8 caracteres.");
  }
  const checkName = (name) => { if (!NAME_RE.test((name || "").trim())) err("Nome do personagem: 2 a 14 letras, números ou espaço."); };

  // ---------------- motor local (teste, sem servidor) ----------------
  function localEngine() {
    const K = "valdora.net.local.v1";
    const SERVERS = [{ id: "lumeira", name: "Lumeira", region: "Brasil", status: "online" }, { id: "escarpa", name: "Escarpa", region: "Brasil", status: "online" },
      { id: "degelo", name: "Degelo", region: "Portugal", status: "online" }];
    const db = () => { try { return JSON.parse(localStorage.getItem(K)) || { users: [], chars: [], session: null }; } catch (e) { return { users: [], chars: [], session: null }; } };
    const put = (d) => { try { localStorage.setItem(K, JSON.stringify(d)); } catch (e) { err("Sem espaço no navegador para salvar."); } };
    async function hash(s) { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join(""); }
    const me = (d) => d.users.find((u) => u.id === d.session);
    const mine = (d, id) => { const c = d.chars.find((c) => c.id === id); if (!c || c.owner !== d.session) err("Personagem não encontrado."); return c; };
    return {
      mode: "local",
      async session() { const d = db(), u = me(d); return u ? { username: u.username, email: u.email } : null; },
      async signUp(f) {
        checkSignUp(f); const d = db();
        if (d.users.some((u) => u.username.toLowerCase() === f.username.toLowerCase())) err("Esse usuário já existe.");
        if (d.users.some((u) => u.email.toLowerCase() === f.email.toLowerCase())) err("Esse e-mail já tem conta.");
        const salt = Math.random().toString(36).slice(2), u = { id: "u" + Date.now().toString(36), username: f.username, email: f.email, salt, pw: await hash(salt + f.password) };
        d.users.push(u); d.session = u.id; put(d); return { username: u.username, email: u.email, confirm: false };
      },
      async signIn({ login, password }) {
        const d = db(), l = (login || "").trim().toLowerCase(), u = d.users.find((u) => u.username.toLowerCase() === l || u.email.toLowerCase() === l);
        if (!u || u.pw !== await hash(u.salt + password)) err("Usuário ou senha incorretos.");
        d.session = u.id; put(d); return { username: u.username, email: u.email };
      },
      async signOut() { const d = db(); d.session = null; put(d); },
      async resetPassword() { err("No modo local de teste não há envio de e-mail."); },
      async servers() { const d = db(); return SERVERS.map((s) => ({ ...s, mine: d.chars.filter((c) => c.server === s.id && c.owner === d.session).length, players: d.chars.filter((c) => c.server === s.id).length })); },
      async listChars(server) { const d = db(); return d.chars.filter((c) => c.server === server && c.owner === d.session).map(({ data, ...c }) => ({ ...c, data })); },
      async createChar(server, { name, hero, data }) {
        checkName(name); const d = db(); if (!me(d)) err("Entre na sua conta.");
        if (d.chars.filter((c) => c.server === server && c.owner === d.session).length >= MAX_CHARS) err(`Máximo de ${MAX_CHARS} personagens por servidor.`);
        if (d.chars.some((c) => c.server === server && c.name.toLowerCase() === name.trim().toLowerCase())) err("Já existe um personagem com esse nome neste servidor.");
        const c = { id: "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), owner: d.session, server, name: name.trim(), hero, level: 0, data: data || null, updated: Date.now() };
        d.chars.push(c); put(d); return c;
      },
      async deleteChar(id) { const d = db(); mine(d, id); d.chars = d.chars.filter((c) => c.id !== id); put(d); },
      async loadChar(id) { return mine(db(), id); },
      async saveChar(id, data, level) { const d = db(), c = mine(d, id); c.data = data; c.level = level; c.updated = Date.now(); put(d); },
    };
  }

  // ---------------- motor online (Supabase) ----------------
  function onlineEngine() {
    let sb = null;
    const lib = () => new Promise((ok, fail) => {
      if (window.supabase) return ok(window.supabase);
      const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js";
      s.onload = () => ok(window.supabase); s.onerror = () => fail(new Error("Não foi possível falar com o servidor. Confira a internet.")); document.head.appendChild(s);
    });
    async function client() { if (!sb) sb = (await lib()).createClient(CFG.url, CFG.anonKey, { auth: { persistSession: true, autoRefreshToken: true } }); return sb; }
    const ok = (r) => { if (r.error) err(friendly(r.error)); return r.data; };
    function friendly(e) {
      const m = (e && (e.message || e.msg)) || String(e);
      if (/Invalid login/i.test(m)) return "Usuário ou senha incorretos.";
      if (/Email not confirmed/i.test(m)) return "Confirme seu e-mail pelo link que enviamos antes de entrar.";
      if (/already registered|already exists/i.test(m)) return "Esse e-mail já tem conta.";
      if (/characters_name_per_server|duplicate key/i.test(m)) return "Já existe um personagem com esse nome neste servidor.";
      if (/max_chars/i.test(m)) return `Máximo de ${MAX_CHARS} personagens por servidor.`;
      if (/rate limit/i.test(m)) return "Muitas tentativas. Espere um pouco e tente de novo.";
      if (/fetch|network/i.test(m)) return "Sem conexão com o servidor.";
      return m;
    }
    let token = null; // para o salvamento ao fechar a aba (fetch com keepalive não espera o cliente)
    async function who() {
      const c = await client(), { data } = await c.auth.getSession(), s = data && data.session; token = s ? s.access_token : null;
      if (!s) return null;
      const p = ok(await c.from("profiles").select("username").eq("id", s.user.id).maybeSingle());
      return { username: p ? p.username : s.user.email, email: s.user.email, id: s.user.id };
    }
    return {
      mode: "online",
      session: who,
      async signUp(f) {
        checkSignUp(f); const c = await client();
        if (!ok(await c.rpc("valdora_username_free", { p_username: f.username }))) err("Esse usuário já existe.");
        const d = ok(await c.auth.signUp({ email: f.email, password: f.password, options: { data: { username: f.username }, emailRedirectTo: location.origin + location.pathname } }));
        return { username: f.username, email: f.email, confirm: !d.session };
      },
      async signIn({ login, password }) {
        const c = await client(); let email = (login || "").trim();
        if (!email.includes("@")) { // usuário: o banco devolve o e-mail só com a senha certa (a função confere o hash), então não vaza e-mail de ninguém
          email = ok(await c.rpc("valdora_login_email", { p_username: email, p_password: password }));
          if (!email) err("Usuário ou senha incorretos.");
        }
        ok(await c.auth.signInWithPassword({ email, password })); return who();
      },
      async signOut() { const c = await client(); await c.auth.signOut(); token = null; },
      async resetPassword(email) { const c = await client(); ok(await c.auth.resetPasswordForEmail((email || "").trim(), { redirectTo: location.origin + location.pathname })); },
      async servers() { const c = await client(); return ok(await c.rpc("valdora_servers")); },
      async listChars(server) { const c = await client(); return ok(await c.from("characters").select("id,server_id,name,hero,level,updated_at").eq("server_id", server).order("updated_at", { ascending: false }))
        .map((r) => ({ id: r.id, server: r.server_id, name: r.name, hero: r.hero, level: r.level, updated: Date.parse(r.updated_at) })); },
      async createChar(server, { name, hero, data }) {
        checkName(name); const c = await client();
        const r = ok(await c.from("characters").insert({ server_id: server, name: name.trim(), hero, data: data || {}, level: 0 }).select("id,server_id,name,hero,level").single());
        return { id: r.id, server: r.server_id, name: r.name, hero: r.hero, level: r.level };
      },
      async deleteChar(id) { const c = await client(); ok(await c.from("characters").delete().eq("id", id)); },
      async loadChar(id) { const c = await client(), r = ok(await c.from("characters").select("id,server_id,name,hero,level,data").eq("id", id).single()); return { ...r, server: r.server_id, data: r.data && r.data.v ? r.data : null }; },
      async saveChar(id, data, level, urgent) {
        const body = JSON.stringify({ data, level, updated_at: new Date().toISOString() });
        if (urgent && token) { // aba fechando: manda direto pela API REST e não espera resposta
          try { fetch(`${CFG.url}/rest/v1/characters?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", keepalive: body.length < 60000, body,
            headers: { apikey: CFG.anonKey, Authorization: "Bearer " + token, "Content-Type": "application/json", Prefer: "return=minimal" } }); } catch (e) { /* sem rede */ }
          return;
        }
        const c = await client(); ok(await c.from("characters").update({ data, level, updated_at: new Date().toISOString() }).eq("id", id));
      },
    };
  }

  const E = CFG.url && CFG.anonKey ? onlineEngine() : localEngine();

  // ---------------- salvamento do personagem em jogo ----------------
  // O jogo chama save() a todo momento (pegar item, craftar...). Para o servidor vai no máximo a cada 20 s, e na hora em
  // casos urgentes (sair para o menu, fechar ou esconder a aba).
  let cur = null, pending = null, timer = null, busy = false;
  async function flush() {
    if (!cur || !pending || busy) return; busy = true;
    const { data, level } = pending; pending = null;
    try { await E.saveChar(cur.id, data, level); cur.status = "ok"; } catch (e) { pending = pending || { data, level }; cur.status = "erro"; console.warn("Valdora: não salvou no servidor", e); }
    busy = false;
  }
  function sink(data, level, urgent) {
    if (!cur) return;
    pending = { data, level };
    if (urgent) { if (E.mode === "online") { E.saveChar(cur.id, data, level, true); pending = null; } else flush(); return; }
    if (!timer) timer = setTimeout(() => { timer = null; flush(); }, E.mode === "local" ? 1500 : 20000);
  }
  return {
    mode: E.mode, MAX_CHARS,
    session: () => E.session(), signUp: (f) => E.signUp(f), signIn: (f) => E.signIn(f), signOut: () => E.signOut(), resetPassword: (e) => E.resetPassword(e),
    servers: () => E.servers(), listChars: (s) => E.listChars(s), createChar: (s, c) => E.createChar(s, c), deleteChar: (id) => E.deleteChar(id), loadChar: (id) => E.loadChar(id),
    play(ch) { cur = { id: ch.id, name: ch.name }; pending = null; return sink; }, // começa a sessão de jogo deste personagem; devolve o "sink" do save
    stop() { if (timer) { clearTimeout(timer); timer = null; } const p = flush(); cur = null; return p; },
  };
})();

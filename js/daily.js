// Valdora — motivos diários (rodada 80): a caçada do dia (uma por dia do calendário, com sequência de dias seguidos) e as
// recompensas do bestiário (a cada marco de criaturas descobertas). Só regras puras: o jogo guarda o estado em player.daily e
// player.bestiary, chama as funções e mostra o resultado. O sorteio usa um hash da data, nunca o aleatório do jogo.
window.ValdoraDaily = (() => {
  "use strict";
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const dayNum = (k) => { const [y, m, d] = k.split("-").map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); };
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
  // caçada do dia: monstro comum perto do nível de Combate (sem chefes, ecos, mini-chefes nem monstros de missão)
  function pick(key, cl, MOBS) {
    // rodada 150: no nível do personagem (4 abaixo a 6 acima); sem nada na faixa, os 6 de nível mais perto
    const all = Object.entries(MOBS).filter(([, d]) => !d.boss && !d.noBounty && !d.mini && !d.summon && !d.temp && !d.echo);
    let pool = all.filter(([, d]) => d.lvl <= cl + 6 && d.lvl >= cl - 4);
    if (pool.length < 3) pool = all.slice().sort((a, b) => Math.abs(a[1].lvl - cl) - Math.abs(b[1].lvl - cl) || a[0].localeCompare(b[0])).slice(0, 6);
    pool.sort((a, b) => a[1].lvl - b[1].lvl || a[0].localeCompare(b[0]));
    const [type, d] = pool[Math.floor(hash(key + ":t") * pool.length)], n = 8 + Math.floor(hash(key + ":n") * 5);
    return { day: key, type, n, have: 0, claimed: false, coins: Math.round(n * d.lvl * 6 + 40), xp: Math.round(n * d.lvl * 5 / ((window.VD && VD.XP_CUT) || 3)) }; // rodada 158: 3x menos
  }
  // sequência: +10% por dia seguido (até +50%); no 3.º e no 7.º dia, prêmio extra
  const bonus = (streak) => Math.min(0.5, 0.1 * Math.max(0, streak - 1));
  const extra = (streak) => streak % 7 === 0 ? { "Elixir do lobo": 1, "Poção de força": 2 } : streak % 3 === 0 ? { "Poção de força": 1 } : null;
  // estado do dia: mantém o de hoje; senão, sorteia um novo e diz se a sequência continua (ontem recebido) ou zera
  function today(state, key, cl, MOBS) {
    if (state && state.day === key && MOBS[state.type]) return state;
    const keep = state && state.claimed && dayNum(key) - dayNum(state.day) === 1;
    return { ...pick(key, cl, MOBS), streak: keep ? state.streak || 1 : 0, best: state ? state.best || 0 : 0 };
  }
  function claim(state) { // devolve { coins, xp, items } e marca recebido; streak conta o dia de hoje
    if (!state || state.claimed || state.have < state.n) return null;
    state.claimed = true; state.streak = (state.streak || 0) + 1; state.best = Math.max(state.best || 0, state.streak);
    const k = 1 + bonus(state.streak);
    return { coins: Math.round(state.coins * k), xp: Math.round(state.xp * k), items: extra(state.streak), streak: state.streak };
  }
  // bestiário: recompensa única a cada marco de criaturas descobertas (derrotadas ao menos uma vez)
  const BEST = [{ n: 5, coins: 150, items: { "Poção de vida": 3 } }, { n: 10, coins: 400, items: { "Poção de força": 2 } },
    { n: 15, coins: 900, items: { "Elixir do lobo": 2 } }, { n: 20, coins: 2000, item: "Anel ancestral", aff: 1 }];
  const seenCount = (kills, MOBS) => Object.keys(MOBS).filter((k) => (kills[k] || 0) > 0).length;
  const due = (kills, got, MOBS) => { const c = seenCount(kills, MOBS); return BEST.filter((b) => c >= b.n && !(got || []).includes(b.n)); };
  const next = (kills, got, MOBS) => BEST.find((b) => !(got || []).includes(b.n) && seenCount(kills, MOBS) < b.n) || null;
  // rodada 85: eco da Serpente em semanas seguidas: +15% de moedas por semana a mais (até +60%); 3.ª e 6.ª semana dão barra estelar
  function echoStreak(state, week) {
    const s = state || { week: null, streak: 0, best: 0 };
    const streak = s.week === week ? s.streak : s.week === week - 1 ? s.streak + 1 : 1;
    return { week, streak, best: Math.max(s.best || 0, streak), bonus: Math.min(0.6, 0.15 * (streak - 1)), bar: streak % 3 === 0 && s.week !== week };
  }
  return { dayKey, dayNum, pick, bonus, extra, today, claim, BEST, seenCount, due, next, echoStreak };
})();

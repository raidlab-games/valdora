// Valdora — teclado (rodada 14: saiu do game.js). Guarda as teclas seguradas (WASD/setas para andar) e traduz atalhos em ações.
// O game.js passa as ações (api); os botões de toque e a barra de habilidades chamam o mesmo shortcut().
window.ValdoraInput = (() => {
  "use strict";
  function create(api) {
    const keys = {};
    // atalho → ação (as abas e janelas ficam com o jogo)
    const TABS = { i: "inv", k: "skills", c: "combat", j: "journal", u: "book", l: "coll", b: "livro" }, SKILL_KEYS = { q: "spin", e: "dash", r: "smash", shift: "run" }; // rodada 105: M abre o mapa do continente
    const POTIONS = { 2: "Poção de vida", 3: "Poção de força", 4: "Poção de pedra" };
    function shortcut(k) {
      if (k === "f") return api.interact();
      if (SKILL_KEYS[k]) return api.skill(SKILL_KEYS[k]);
      if (k === "p") return api.toggleDlg("char");
      if (k === "m" && api.toggleMap) return api.toggleMap();
      if (k === "o") return api.toggleDlg("craft");
      if (k === "g" && api.petStay) return api.petStay(); // rodada 99: filhote fica / segue
      if (k === "h" && api.ride) return api.ride(); // rodada 156: monta / desce do cavalo
      if (TABS[k]) return api.tab(TABS[k]);
      if (/^[1-9]$/.test(k) && api.hot) return api.hot(+k - 1); // rodada 137: barra de 9 atalhos
      if (k === "1") return api.eatBest();
      if (POTIONS[k]) return api.potion(POTIONS[k]);
      if (k === " ") return api.attackNearest();
    }
    addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT") return;
      const k = e.key.toLowerCase(); keys[k] = true;
      if (k === "escape") api.escape();
      // rodada 40: com um botão em foco (Tab), Enter/Espaço apertam o botão em vez de atacar
      if ((k === " " || k === "enter") && e.target.closest && e.target.closest("button, [role=button]")) return;
      if (api.running() && !e.repeat) shortcut(k);
      if (api.running() && ["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
    });
    addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });
    addEventListener("blur", () => { for (const k in keys) keys[k] = false; });
    // rodada 104: duas teclas juntas andam na diagonal (W+D, S+A...); keyVec dá o passo, keyDir o lado para onde o herói olha
    const keyVec = () => {
      const x = (keys["d"] || keys["arrowright"] ? 1 : 0) - (keys["a"] || keys["arrowleft"] ? 1 : 0);
      const y = (keys["s"] || keys["arrowdown"] ? 1 : 0) - (keys["w"] || keys["arrowup"] ? 1 : 0);
      return x || y ? [x, y] : null;
    };
    const keyDir = () => { const v = keyVec(); return v ? window.DIR_AT(v[0], v[1]) : null; }; // rodada 105: 8 direções
    return { shortcut, keyDir, keyVec };
  }
  return { create };
})();

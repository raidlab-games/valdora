// Valdora — versão da arte (rodada 105). tools/publicar.ps1 troca ASSET_V a cada publicação; com ela, os endereços das imagens
// mudam e o navegador baixa de novo a arte nova em vez de usar a guardada (o site guarda imagens por até 10 min).
// Em casa (servidor local, sem cache) fica vazia e nada muda.
window.ASSET_V = "";
window.assetV = (u) => (window.ASSET_V && typeof u === "string" && u.startsWith("assets/") && !u.includes("?") ? u + "?v=" + window.ASSET_V : u);
(() => {
  if (!window.ASSET_V) return;
  for (const k in window.ASSETS || {}) window.ASSETS[k] = window.assetV(window.ASSETS[k]);
  for (const A of Object.values(window.ANIM_SHEETS || {})) { A.src = window.assetV(A.src); if (A.dressed) A.dressed = window.assetV(A.dressed); }
})();

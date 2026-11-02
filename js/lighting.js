// Iluminação do Valdora: ciclo de dia e noite e luzes locais (fogueiras, fornalha, janelas, lanterna, cristais).
// A escuridão é desenhada num canvas pequeno (1/4 da tela) com "furos" de luz e depois ampliada com suavização,
// então custa pouco mesmo com dezenas de luzes.
window.ValdoraLight = (() => {
  const DAY = 600; // duração de um dia completo, em segundos
  // fase do dia (0..1) → escuridão (0..1)
  function darkness(phase) {
    if (phase < 0.55) return 0;                          // dia
    if (phase < 0.65) return (phase - 0.55) / 0.1 * 0.62; // entardecer
    if (phase < 0.9) return 0.62;                         // noite
    return (1 - phase) / 0.1 * 0.62;                      // amanhecer
  }
  const hourOf = (phase) => (phase * 24 + 6) % 24;        // fase 0 = 6h da manhã
  function create() {
    const c = document.createElement("canvas"), g = c.getContext("2d"), S = 0.25;
    // lights: [{ x, y, r, color?, warm? }] em pixels de tela
    function draw(ctx, w, h, dark, lights, t) {
      if (dark <= 0.01) return;
      const cw = Math.ceil(w * S), ch = Math.ceil(h * S);
      if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; }
      g.globalCompositeOperation = "source-over"; g.clearRect(0, 0, cw, ch);
      g.fillStyle = `rgba(8, 12, 36, ${dark})`; g.fillRect(0, 0, cw, ch);
      g.globalCompositeOperation = "destination-out";
      for (const L of lights) {
        const r = L.r * S * (L.warm && L.k == null ? 1 + Math.sin(t * 9 + L.x) * 0.04 + Math.sin(t * 23 + L.y) * 0.02 : 1); // L.k: pulso já calculado (velas)
        const x = L.x * S, y = L.y * S, grd = g.createRadialGradient(x, y, 0, x, y, r);
        grd.addColorStop(0, "rgba(0,0,0,1)"); grd.addColorStop(0.55, "rgba(0,0,0,.7)"); grd.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = grd; g.fillRect(x - r, y - r, r * 2, r * 2);
      }
      const sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = true;
      ctx.drawImage(c, 0, 0, w, h);
      // brilho colorido somado por cima (fogo laranja, cristais azuis)
      ctx.globalCompositeOperation = "lighter";
      for (const L of lights) if (L.color) {
        const r = L.r * 0.8 * (L.warm ? 1 + Math.sin(t * 9 + L.x) * 0.05 : 1), grd = ctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, r);
        grd.addColorStop(0, L.color.replace("A", Math.max(0.28 * dark, L.a || 0).toFixed(3))); grd.addColorStop(1, L.color.replace("A", "0"));
        ctx.fillStyle = grd; ctx.fillRect(L.x - r, L.y - r, r * 2, r * 2);
      }
      ctx.globalCompositeOperation = "source-over"; ctx.imageSmoothingEnabled = sm;
    }
    // rodada 49: brilho somado de dia (sem escuridão), para luzes que pedem vida mesmo ao sol (velas e cristal do santuário)
    function glow(ctx, lights, t) {
      ctx.globalCompositeOperation = "lighter";
      for (const L of lights) {
        const k = L.k != null ? L.k : L.slow ? 0.75 + Math.sin(t * 1.6) * 0.25 : 0.85 + Math.sin(t * 9 + L.x) * 0.1 + Math.sin(t * 23 + L.y) * 0.05;
        const r = L.r * (L.warm ? 1 + Math.sin(t * 7 + L.y) * 0.06 : 1), grd = ctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, r);
        grd.addColorStop(0, L.color.replace("A", ((L.a || 0.1) * k).toFixed(3))); grd.addColorStop(1, L.color.replace("A", "0"));
        ctx.fillStyle = grd; ctx.fillRect(L.x - r, L.y - r, r * 2, r * 2);
      }
      ctx.globalCompositeOperation = "source-over";
    }
    return { draw, glow };
  }
  return { create, darkness, hourOf, DAY };
})();

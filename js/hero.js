// Valdora — desenho do herói (rodada 17: saiu do game.js). Escolhe a folha certa a cada quadro: morte, investida, giro,
// cancelamento, comemoração, bloqueio, golpes e ferramentas (3 tempos), comer, parado/apanhar e a caminhada.
window.ValdoraHero = (() => {
  "use strict";
  function create(api) {
    const { ctx, cam, TILE, ANIMS, SPR, HEROES, HERO_SHEET, DIR_VEC, ease, tags, fx, rand, drawAnim, animFrame, shadowAt, whiteOf } = api;
    function heroPose() {
      const player = api.player();
      const a = player.act; if (!a) return { phase: -1, off: 0, k: 0 };
      if (a.key === "bow") { // rodada 104: tiro — sem avanço; só um recuo leve na soltura da corda
        const tt = a.prep + a.strike; if (a.t < a.prep) return { phase: 0, k: a.t / a.prep, off: 0 };
        if (a.t < tt) return { phase: 1, k: (a.t - a.prep) / a.strike, off: -2 }; return { phase: 2, k: Math.min(1, (a.t - tt) / a.rec), off: -2 * (1 - Math.min(1, (a.t - tt) / a.rec)) };
      }
      if (a.t < a.prep) { const k = a.t / a.prep; return { phase: 0, k, off: -3 * ease.outQuad(k) }; }
      if (a.t < a.prep + a.strike) { const k = (a.t - a.prep) / a.strike; return { phase: 1, k, off: -3 + 10 * ease.inQuad(k) }; }
      const k = Math.min(1, (a.t - a.prep - a.strike) / a.rec); return { phase: 2, k, off: 7 * (1 - ease.outCubic(k)) };
    }
    const T_REST = -0.6, T_UP = -2.3, T_HIT = 0.5;
    function toolAngle(a, key) { // ângulo da ferramenta em cada fase (com easing)
      const player = api.player();
      if (key === "rod") {
        if (!a) return -0.9;
        if (a.t < a.prep) return -0.9 - 0.7 * ease.outQuad(a.t / a.prep);
        if (a.t < a.prep + a.strike) return -1.6 + 1.2 * ease.inQuad((a.t - a.prep) / a.strike);
        return -0.4 - 0.5 * ease.outCubic(Math.min(1, (a.t - a.prep - a.strike) / a.rec));
      }
      if (a.t < a.prep) return T_REST + (T_UP - T_REST) * ease.outQuad(a.t / a.prep);
      if (a.t < a.prep + a.strike) return T_UP + (T_HIT - T_UP) * ease.inQuad((a.t - a.prep) / a.strike);
      return T_HIT + (T_REST - T_HIT) * ease.outCubic(Math.min(1, (a.t - a.prep - a.strike) / a.rec));
    }
    function drawTool(t, cx, cy) { // ferramenta na mão, rastro do golpe e linha de pesca
      const player = api.player();
      const a = player.act, dir = player.dir, flip = dir === "left" ? -1 : 1;
      const fishing = player.cast && player.target && player.target.ref === player.cast.spot && !player.path.length;
      const key = a && a.key ? a.key : fishing ? "rod" : null; if (!key) return;
      const hx = cx + (dir === "left" ? -11 : dir === "right" ? 11 : dir === "down" ? 10 : -10), hy = cy + 4;
      let ang = toolAngle(a && a.key ? a : null, key) + (key === "rod" ? Math.sin(t * 2) * 0.04 : 0);
      if (dir === "down") ang += 0.4; if (dir === "up") ang -= 0.2;
      // rastro com gradiente durante o golpe e o começo da recuperação
      if (a && key !== "rod" && a.t > a.prep) {
        const end = a.t - a.prep - a.strike, fade = end < 0 ? 1 : Math.max(0, 1 - end / (a.rec * 0.6));
        if (fade > 0) {
          const from = T_UP + (dir === "down" ? 0.4 : dir === "up" ? -0.2 : 0), to = ang, r = key === "tool_sword" ? 30 : 24, N = 9;
          for (let i = 0; i < N; i++) {
            const a0 = from + (to - from) * i / N, a1 = from + (to - from) * (i + 1) / N;
            ctx.strokeStyle = `rgba(255,${key === "tool_sword" ? 250 : 235},${key === "tool_sword" ? 220 : 180},${((i + 1) / N) * 0.75 * fade})`;
            ctx.lineWidth = 2 + (i / N) * 4; ctx.beginPath();
            ctx.moveTo(hx + flip * Math.sin(a0) * r, hy - Math.cos(a0) * r); ctx.lineTo(hx + flip * Math.sin(a1) * r, hy - Math.cos(a1) * r); ctx.stroke();
          }
        }
      }
      ctx.save(); ctx.translate(hx, hy); ctx.scale(flip, 1); ctx.rotate(ang);
      if (key === "rod") { ctx.strokeStyle = "#7a5230"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -34); ctx.stroke(); ctx.fillStyle = "#3a2a16"; ctx.fillRect(-2, -4, 4, 6); }
      else { const img = SPR[key === "hammer" ? "tool_hammer" : key]; if (img) { ctx.imageSmoothingEnabled = true; ctx.rotate(Math.PI / 4); ctx.drawImage(img, -6, -30, 30, 30); ctx.imageSmoothingEnabled = false; } }
      ctx.restore();
      if (key === "rod" && player.cast) drawFishLine(hx + Math.sin(ang) * 34 * flip, hy - Math.cos(ang) * 34, t);
    }
    function drawFishLine(tipX, tipY, t) { // linha em curva até a boia (voando no arremesso, balançando depois)
      const player = api.player();
      const a = player.act;
      {
        const o = player.cast.spot;
        let bx = (o.x + 0.5) * TILE - cam.x, by = (o.y + 0.5) * TILE - cam.y + Math.sin(t * 4) * 2;
        if (!player.cast.landed) { const k = ease.outQuad(Math.min(1, player.cast.t / 0.42)); bx = tipX + (bx - tipX) * k; by = tipY + (by - tipY) * k - Math.sin(Math.PI * k) * 34; }
        if (a && a.key === "rod" && a.t > a.prep && player.cast.landed) by += 5 * (1 - Math.min(1, (a.t - a.prep) / 0.2)); // boia afunda na fisgada
        ctx.strokeStyle = "#ffffffaa"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(tipX, tipY);
        ctx.quadraticCurveTo((tipX + bx) / 2, Math.max(tipY, by) + (player.cast.landed ? 12 : -10), bx, by); ctx.stroke();
        ctx.fillStyle = "#e0402a"; ctx.fillRect(Math.round(bx) - 3, Math.round(by) - 3, 6, 4); ctx.fillStyle = "#fff"; ctx.fillRect(Math.round(bx) - 3, Math.round(by) + 1, 6, 2);
      }
    }
    const STRIKES = ["tool_sword", "tool_axe", "tool_pick", "hammer", "spin", "smash"];
    const SPIN_ROWS = ["down", "right", "up", "left"];
    // folha de ação por ferramenta (hero_N_chop/mine/hammer/fish); sem ela, golpes usam a folha de ataque
    const ACT_SHEETS = { tool_sword: "attack", bow: "attack", tool_axe: "chop", tool_pick: "mine", tool_sickle: "reap", hammer: "hammer", rod: "fish", spin: "attack", smash: "attack" };
    const actSheet = (hero, key) => { const suf = ACT_SHEETS[key]; return suf ? SPR[`${hero.id}_${suf}`] : null; };
    const ROD_TIP = { down: [30, -56], left: [-28, -44], right: [28, -44], up: [30, -54] }; // ponta da vara no quadro final da folha de pesca (px da célula de 96)
    // rodada 67: arco largo do golpe de espada (vai além da silhueta): cabeça brilhante e cauda que afina, em 4 direções.
    // [centro x (tiles), centro y (fração da altura), raio x, raio y, ângulo inicial, ângulo final] — canvas: 0 = direita, pi/2 = baixo
    const SLASH = { down: [0, 0.3, 0.95, 0.55, -0.3, Math.PI + 0.3], up: [0, 0.78, 0.9, 0.45, Math.PI + 0.3, 2 * Math.PI - 0.3],
      right: [0.1, 0.45, 0.7, 0.78, -Math.PI / 2 - 0.2, Math.PI / 2 + 0.2], left: [-0.1, 0.45, 0.7, 0.78, 1.5 * Math.PI + 0.2, Math.PI / 2 - 0.2] };
    function drawSlash(cx, by, fh, dir, pose) {
      if (pose.phase < 1) return;
      const fade = pose.phase === 1 ? 1 : 1 - Math.min(1, pose.k / 0.6); if (fade <= 0) return;
      const [ox, oyk, rx, ry, a0, a1] = SLASH[dir], k = pose.phase === 1 ? ease.outQuad(pose.k) : 1;
      const x0 = cx + ox * TILE, y0 = by - fh * oyk, head = a0 + (a1 - a0) * (0.15 + 0.85 * k), tail = head - (a1 - a0) * 0.7, N = 14;
      ctx.lineCap = "round";
      for (const [lw, col, al] of [[10, "255,206,90", 0.28], [5, "255,250,230", 0.95]]) { // brilho dourado por fora, núcleo claro
        for (let i = 0; i < N; i++) {
          const b0 = tail + (head - tail) * i / N, b1 = tail + (head - tail) * (i + 1) / N, w = (i + 1) / N;
          ctx.strokeStyle = `rgba(${col},${(al * w * fade).toFixed(3)})`; ctx.lineWidth = Math.max(1, lw * w);
          ctx.beginPath(); ctx.moveTo(x0 + Math.cos(b0) * rx * TILE, y0 + Math.sin(b0) * ry * TILE); ctx.lineTo(x0 + Math.cos(b1) * rx * TILE, y0 + Math.sin(b1) * ry * TILE); ctx.stroke();
        }
      }
      ctx.lineCap = "butt";
    }
    function drawPlayer(t) {
      const player = api.player();
      // rodada 67: golpeando um monstro logo acima, o herói recua ~1/4 de tile para baixo para não tampar o alvo
      const tg = player.target && player.target.kind === "mob" && player.target.ref, lt = drawPlayer.lt ?? t; drawPlayer.lt = t;
      const above = tg && !tg.dead && player.dir === "up" && tg.x === player.x && tg.y === player.y - 1 && player.prog >= 1;
      player.upOff = (player.upOff || 0) + ((above ? 0.24 : 0) - (player.upOff || 0)) * Math.min(1, Math.max(0, t - lt) * 10);
      const hero = HEROES.find((h) => h.id === player.hero), sheet = SPR[hero.sheet], atkSheet = hero.attack && SPR[hero.attack], HA = ANIMS[player.hero];
      if (HA && player.deadT > 0) { // morte: toca uma vez e segura o último quadro
        const row = HA.rows["death_" + player.dir] ? "death_" + player.dir : "death_down", R = HA.rows[row], k = 1.6 - player.deadT;
        ctx.globalAlpha = player.deadT < 0.3 ? player.deadT / 0.3 : 1;
        drawAnim(HA, row, Math.min(R.frames - 1, Math.floor(k * R.fps)), Math.round(player.px * TILE - cam.x + TILE / 2), Math.round((player.py + 1) * TILE - cam.y), false);
        ctx.globalAlpha = 1; return;
      }
      const [vx, vy] = DIR_VEC[player.dir], pose = heroPose(), moving = player.prog < 1;
      const fw = sheet ? sheet.width / HERO_SHEET.cols : TILE, fh = sheet ? sheet.height / HERO_SHEET.rows.length : TILE;
      // rodada 72: a folha de caminhada tem só 2 passadas + o quadro neutro; o corpo sobe ~2 px no neutro (passagem) e desce na
      // passada, no meio de cada quadro, para o passo ter peso. u = quadros andados (2 por tile)
      // rodada 74: com a folha de 6 quadros (Blender) a subida e descida já vem nos quadros; o bob do código só fica de reserva
      const W6 = ANIMS[hero.id + "_walk6"], u = player.dist * 2, bob = moving && pose.phase < 0 && !W6 ? 2.2 * (1 - Math.abs(Math.cos(Math.PI * (u - 0.5) / 2))) : 0;
      const breath = moving || pose.phase >= 0 ? 1 : 1 + Math.sin(t * 2.2) * 0.014; // respiração parado
      const cx = Math.round(player.px * TILE - cam.x + TILE / 2 + vx * pose.off), by = Math.round((player.py + 1 + player.upOff) * TILE - cam.y + vy * pose.off * 0.6);
      shadowAt(cx, by - 2, TILE * 0.3 * (1 - bob / 25), TILE * 0.1 * (1 - bob / 25));
      const fishing = player.cast && player.target && player.target.ref === player.cast.spot && !player.path.length;
      const aSheet = pose.phase >= 0 ? actSheet(hero, player.act.key) : fishing && !moving ? actSheet(hero, "rod") : null;
      const DS = ANIMS[hero.id + "_dash"], DA = DS && DS.rows["dash_" + player.dir] ? DS : HA, DR = DA && DA.rows["dash_" + player.dir]; // investida com espada (hero_N_dash)
      if (DR && (player.ghosts || player.dash)) { // investida (Blender): corpo esticado para a frente; rastro em código com o último quadro
        const row = "dash_" + player.dir;
        for (const gh of (player.dash ? player.dash.ghosts : player.ghosts)) { ctx.globalAlpha = Math.max(0, gh.a) * 0.75; drawAnim(DA, row, DR.frames - 1, Math.round(gh.x * TILE - cam.x + TILE / 2), Math.round((gh.y + 1) * TILE - cam.y), false); }
        ctx.globalAlpha = 1;
        if (player.dash) { drawAnim(DA, row, Math.min(DR.frames - 1, Math.floor(player.dash.t * DR.fps)), cx, by, false); tags.push([player.name, player.px + 0.5, (by - fh + cam.y) / TILE + 0.12, "#f1c40f"]); return; }
      } else if (player.ghosts || player.dash) { // rastro da investida: cópias translúcidas do quadro de golpe
        const gs = SPR[hero.attack]; if (gs) { const cell = gs.width / 3, row = HERO_SHEET.rows.indexOf(player.dir);
          for (const g of (player.dash ? player.dash.ghosts : player.ghosts)) { ctx.globalAlpha = Math.max(0, g.a) * 0.75; ctx.drawImage(gs, cell, row * cell, cell, cell, Math.round(g.x * TILE - cam.x + TILE / 2 - cell / 2), Math.round((g.y + 1) * TILE - cam.y - cell), cell, cell); }
          ctx.globalAlpha = 1;
          if (player.dash) { ctx.drawImage(gs, cell, row * cell, cell, cell, cx - cell / 2, by - cell, cell, cell); tags.push([player.name, player.px + 0.5, (by - fh + cam.y) / TILE + 0.12, "#f1c40f"]); return; } }
      }
      if (player.act && player.act.key === "spin") { // golpe giratório: gira pelas 4 direções com um anel de corte
        const a = player.act, gs = SPR[hero.attack], k = Math.min(1, Math.max(0, (a.t - a.prep) / a.strike)), ss = SPR[hero.id + "_spin"];
        if (ss) { const cell = ss.height, cw8 = ss.width / 8, f = Math.min(7, Math.floor(a.t / (a.prep + a.strike + a.rec) * 8)); ctx.drawImage(ss, Math.round(f * cw8), 0, cw8, cell, cx - cell / 2, by - cell, cell, cell); } // giro (8 quadros)
        else if (gs) { const cell = gs.width / 3, dir = pose.phase === 1 ? SPIN_ROWS[Math.floor(k * 4) % 4] : player.dir; ctx.drawImage(gs, (pose.phase === 1 ? 1 : pose.phase === 0 ? 0 : 2) * cell, HERO_SHEET.rows.indexOf(dir) * cell, cell, cell, cx - cell / 2, by - cell, cell, cell); }
        if (pose.phase >= 1) { const fade = pose.phase === 2 ? 1 - pose.k : 1, cy = by - fh * 0.35;
          for (let i = 0; i < 12; i++) { const a0 = k * 6.28 * 1.1 - i * 0.22; ctx.strokeStyle = `rgba(255,250,220,${(1 - i / 12) * 0.8 * fade})`; ctx.lineWidth = 5 - i * 0.3;
            ctx.beginPath(); ctx.ellipse(cx, cy, 34, 16, 0, a0, a0 + 0.22); ctx.stroke(); } }
        tags.push([player.name, player.px + 0.5, (by - fh + cam.y) / TILE + 0.12, "#f1c40f"]); return;
      }
      const CH = ANIMS[hero.id + "_cheer"], CHR = CH && CH.rows["cheer_" + player.dir];
      const CWR = CH && CH.rows["cheer_walk_" + player.dir];
      if (CHR && player.cheerT > 0 && player.prog >= 1 && !player.act) { // comemoração (Blender): missão ou tarefa concluída
        drawAnim(CH, "cheer_" + player.dir, Math.min(CHR.frames - 1, Math.floor((CHR.frames / CHR.fps - player.cheerT) * CHR.fps)), cx, by, false);
        tags.push([player.name, player.px + 0.5, (by - fh + cam.y) / TILE + 0.12, "#f1c40f"]); return;
      }
      if (CWR && player.cheerT > 0 && player.prog < 1 && !player.act) { // comemora andando: arma no alto e passos (loop)
        drawAnim(CH, "cheer_walk_" + player.dir, Math.floor(player.dist * 2) % CWR.frames, cx, by, false);
        tags.push([player.name, player.px + 0.5, (by - fh + cam.y) / TILE + 0.12, "#f1c40f"]); return;
      }
      const BK = ANIMS[hero.id + "_block"], BR = BK && BK.rows["block_" + player.dir];
      const CA = ANIMS[hero.id + "_cancel"], CR = CA && CA.rows["cancel_" + player.dir];
      if (CR && player.cancelT > 0) { // cancelou o golpe para andar: recolhe a arma (Blender)
        drawAnim(CA, "cancel_" + player.dir, Math.min(CR.frames - 1, Math.floor((0.125 - player.cancelT) * CR.fps)), cx, by, false);
        tags.push([player.name, player.px + 0.5, (by - fh + cam.y) / TILE + 0.12, "#f1c40f"]); return;
      }
      if (BR && player.blockT > 0) { // bloqueio (Blender): recua firme e absorve o golpe
        drawAnim(BK, "block_" + player.dir, Math.min(BR.frames - 1, Math.floor((0.22 - player.blockT) * BR.fps)), cx, by, false);
        tags.push([player.name, player.px + 0.5, (by - fh + cam.y) / TILE + 0.12, "#f1c40f"]); return;
      }
      if (player.act && player.act.key === "smash" && pose.phase === 0 && rand() < 0.5) fx.sparks(player.px + 0.5 + DIR_VEC[player.dir][0] * 0.4, player.py + 0.2, 1, ["#ffd23a", "#fff6c0"], 1.5); // carregando
      const CK = SPR[hero.id + "_cook"]; // rodada 29: assando — agachado girando o espeto, em loop 0,1,2,1 a 7 fps
      if (CK && !moving && player.cookUntil > performance.now() / 1000 && player.target && player.target.kind === "fire") {
        const cell = CK.width / 3, row = HERO_SHEET.rows.indexOf(player.dir), col = [0, 1, 2, 1][Math.floor(t * 7) % 4];
        ctx.drawImage(CK, col * cell, row * cell, cell, cell, cx - cell / 2, by - cell, cell, cell);
        tags.push([player.name, player.px + 0.5, (by - fh * 0.72 + cam.y) / TILE + 0.12, "#f1c40f"]); return; // agachado: ~72% da altura em pé
      }
      if (aSheet) { // ação pela folha própria: preparação → golpe/arremesso (impacto) → finalização (ou vara estendida esperando o peixe)
        const cell = aSheet.width / 3, row = HERO_SHEET.rows.indexOf(player.dir), col = pose.phase >= 0 ? pose.phase : 2;
        const shot = pose.phase >= 0 && player.act.key === "bow", sword = pose.phase >= 0 && (player.act.key === "tool_sword" || player.act.key === "smash" || shot);
        // rodada 67: de frente e de costas, o golpe usa 4 quadros do Blender (antecipação 0-1, avanço 2, assentar 3)
        const S4 = sword && ANIMS[hero.id + "_strike4"], R4 = S4 && S4.rows["strike_" + player.dir];
        const f4 = !R4 ? -1 : pose.phase === 0 ? (pose.k < 0.5 ? 0 : 1) : pose.phase === 1 ? 2 : pose.k < 0.55 ? 3 : -1;
        if (sword && !shot && player.dir === "up") drawSlash(cx, by, fh, player.dir, pose); // de costas o arco passa por trás
        if (f4 >= 0) drawAnim(S4, "strike_" + player.dir, f4, cx, by, false);
        else ctx.drawImage(aSheet, col * cell, row * cell, cell, cell, cx - cell / 2, by - cell, cell, cell);
        if (sword && !shot && player.dir !== "up") drawSlash(cx, by, fh, player.dir, pose); // o tiro de arco não deixa rastro de lâmina
        if (player.cast && (fishing || (player.act && player.act.key === "rod")) && col === 2) {
          const [tx, ty] = ((window.ROD_TIP3D || {})[hero.id] || ROD_TIP)[player.dir], k = cell / 96; // 3D: ponta medida no Blender drawFishLine(cx + tx * k, by + ty * k, t);
        }
        if (player.flash > 0) ctx.globalAlpha = 1;
        tags.push([player.name, player.px + 0.5, (by - fh + cam.y) / TILE + 0.12, "#f1c40f"]);
        return;
      }
      const idleAnim = HA && !moving && pose.phase < 0;
      if (HA && player.eatT > 0 && !moving && HA.rows["eat_" + player.dir]) { // comendo/bebendo
        const R = HA.rows["eat_" + player.dir];
        drawAnim(HA, "eat_" + player.dir, Math.floor((0.5 - player.eatT) * R.fps) % R.frames, cx, by, false);
        tags.push([player.name, player.px + 0.5, (by - fh + cam.y) / TILE + 0.12, "#f1c40f"]); return;
      }
      if (HA && (player.hitT > 0 || (idleAnim && !fishing))) { // idle e hit pela folha animada (já trazem respiração e reação)
        const hit = player.hitT > 0, row = (hit ? "hit_" : "idle_") + player.dir, R = HA.rows[row];
        const frame = hit ? Math.min(R.frames - 1, Math.floor((0.3 - player.hitT) * R.fps)) : animFrame(R, t);
        if (!hit && player.cast && !actSheet(hero, "rod")) drawTool(t, cx, by - fh * 0.45);
        drawAnim(HA, row, frame, cx, by, false, 1, player.flash > 0 ? Math.min(1, player.flash / 0.18) * 0.5 : 0);
        tags.push([player.name, player.px + 0.5, (by - fh + cam.y) / TILE + 0.12, "#f1c40f"]);
        return;
      }
      const img = sheet, row = HERO_SHEET.rows.indexOf(player.dir);
      const col = moving ? HERO_SHEET.walk[Math.floor(player.dist * 2) % HERO_SHEET.walk.length] : 0; // quadro pela distância percorrida
      const dh = Math.round(fh * breath), sy = by - dh - Math.round(bob);
      const toolBehind = player.dir === "up" && !(player.act && player.act.key && player.act.key !== "rod");
      if (toolBehind) drawTool(t, cx, by - fh * 0.45 - bob);
      if (W6 && moving && W6.rows["walk_" + player.dir]) drawAnim(W6, "walk_" + player.dir, Math.floor(player.dist * 3) % 6, cx, by, false, 1, player.flash > 0 ? Math.min(1, player.flash / 0.18) * 0.5 : 0); // 6 quadros a cada 2 tiles
      else if (img) ctx.drawImage(img, col * fw, row * fh, fw, fh, cx - fw / 2, sy, fw, dh);
      else if (SPR[player.hero]) ctx.drawImage(SPR[player.hero], cx - TILE / 2, by - TILE);
      if (!toolBehind) drawTool(t, cx, by - fh * 0.45 - bob);
      if (player.flash > 0 && !(W6 && moving)) { const wimg = sheet && whiteOf(hero.sheet); if (wimg) { ctx.globalAlpha = Math.min(1, player.flash / 0.18) * 0.55; ctx.drawImage(wimg, col * fw, row * fh, fw, fh, cx - fw / 2, sy, fw, dh); ctx.globalAlpha = 1; } }
      tags.push([player.name, player.px + 0.5, (sy + cam.y) / TILE + 0.12, "#f1c40f"]);
    }
    return { drawPlayer, heroPose };
  }
  return { create };
})();

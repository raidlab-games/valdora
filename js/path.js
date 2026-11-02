// Busca de caminho do Valdora em grade, com arrays tipados (sem alocar por nó).
// create(W, H, walkable, opts) devolve find(sx, sy, goal) → lista de [x, y] até o primeiro tile em que goal(x, y) é verdadeiro,
// [] se já está no objetivo, ou null se não há caminho. walkable(x, y) é consultado a cada busca (o mundo muda).
// Rodada 104: opts.diag = true anda em 8 direções (custo 10 reto e 14 na diagonal, sem cortar quina de parede);
// sem ela, BFS em 4 direções como antes.
window.ValdoraPath = (() => {
  const DIRS4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const DIRS8 = [[1, 0, 10], [-1, 0, 10], [0, 1, 10], [0, -1, 10], [1, 1, 14], [1, -1, 14], [-1, 1, 14], [-1, -1, 14]];
  function create(W, H, walkable, opts = {}) {
    const prev = new Int32Array(W * H), queue = new Int32Array(W * H);
    const back = (s, i) => { const p = []; for (let k = i; k !== s; k = prev[k]) p.push([k % W, (k / W) | 0]); return p.reverse(); };
    if (!opts.diag) return function find(sx, sy, goal) {
      prev.fill(-1);
      const s = sy * W + sx; let h = 0, t = 0; prev[s] = s; queue[t++] = s;
      while (h < t) {
        const i = queue[h++], x = i % W, y = (i / W) | 0;
        if (goal(x, y)) return back(s, i);
        for (const [dx, dy] of DIRS4) {
          const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const j = ny * W + nx; if (prev[j] < 0 && walkable(nx, ny)) { prev[j] = i; queue[t++] = j; }
        }
      }
      return null;
    };
    // Dijkstra com fila de prioridade (heap binário em arrays tipados)
    const dist = new Int32Array(W * H), done = new Uint8Array(W * H), heapI = new Int32Array(W * H * 4), heapD = new Int32Array(W * H * 4);
    return function find(sx, sy, goal) {
      prev.fill(-1); dist.fill(0x3fffffff); done.fill(0);
      const s = sy * W + sx; let n = 0; prev[s] = s; dist[s] = 0;
      const push = (i, d) => { let k = n++; while (k > 0) { const p = (k - 1) >> 1; if (heapD[p] <= d) break; heapI[k] = heapI[p]; heapD[k] = heapD[p]; k = p; } heapI[k] = i; heapD[k] = d; };
      const pop = () => { const top = heapI[0], li = heapI[--n], ld = heapD[n]; let k = 0;
        for (;;) { let c = 2 * k + 1; if (c >= n) break; if (c + 1 < n && heapD[c + 1] < heapD[c]) c++; if (heapD[c] >= ld) break; heapI[k] = heapI[c]; heapD[k] = heapD[c]; k = c; }
        heapI[k] = li; heapD[k] = ld; return top; };
      push(s, 0);
      while (n > 0) {
        const i = pop(); if (done[i]) continue; done[i] = 1;
        const x = i % W, y = (i / W) | 0;
        if (goal(x, y)) return back(s, i);
        for (const [dx, dy, c] of DIRS8) {
          const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const j = ny * W + nx; if (done[j] || !walkable(nx, ny)) continue;
          if (dx && dy && (!walkable(x + dx, y) || !walkable(x, y + dy))) continue; // não corta quina
          const d = dist[i] + c; if (d < dist[j] && n < heapI.length) { dist[j] = d; prev[j] = i; push(j, d); }
        }
      }
      return null;
    };
  }
  return { create };
})();

"use strict";
// ---------- gerador de masmorras ----------
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const genOpt = Object.assign(
  {
    style: "dungeon",
    w: 70,
    h: 50,
    rooms: 12,
    rmin: 4,
    rmax: 10,
    cw: 0,
    gap: 5,
    dens: "normal",
    season: "verao",
    clear: "camp",
    pond: true,
    animals: true,
    treeBlk: false,
    houses: 10,
    market: true,
    fields: true,
    ikind: "taverna",
    graves: "normal",
    mauso: true,
    doors: 70,
    secret: 1,
    dead: 2,
    traps: 2,
    deco: "normal",
    torches: true,
    dark: true,
    seed: 1 + Math.floor(Math.random() * 99999),
  },
  (() => {
    try {
      const o = JSON.parse(localStorage.getItem("mesa.genopt")) || {};
      if (!o.v2) {
        delete o.w;
        delete o.h;
        delete o.rooms;
        delete o.rmin;
        delete o.rmax;
        delete o.cw;
        o.v2 = 1;
      }
      return o;
    } catch {
      return {};
    }
  })(),
);
const saveGenOpt = () => {
  try {
    localStorage.setItem("mesa.genopt", JSON.stringify(genOpt));
  } catch {}
};
const ROOMT = {
  armazem: {
    n: "Armazém",
    items: ["caixa", "caixas", "barril", "barris-pilha", "sacos", "saco", "pilha-caixotes", "barril"],
    wall: ["prateleira"],
  },
  cripta: {
    n: "Cripta",
    items: ["sarcofago", "caixao", "ossos", "cranios", "velas", "lapide", "sarcofago"],
    wall: [],
  },
  tesouro: {
    n: "Tesouro",
    items: ["bau", "bau-aberto", "ouro", "pedestal", "bau-mimico", "ouro"],
    wall: ["estatua"],
  },
  prisao: {
    n: "Prisão",
    items: ["jaula", "grilhoes", "esqueleto", "balde", "ossos", "jaula"],
    wall: ["grilhoes"],
  },
  templo: {
    n: "Templo",
    items: ["altar", "circulo-ritual", "velas", "braseiro", "braseiro"],
    wall: ["estatua"],
  },
  quartel: {
    n: "Quartel",
    items: ["beliche", "beliche", "mesa", "banquinho", "cadeira", "bau", "armas"],
    wall: ["armas", "armario"],
  },
  covil: { n: "Covil", items: ["ossos", "cranios", "sangue", "esqueleto", "escombros", "ossos"], wall: [] },
  biblioteca: {
    n: "Biblioteca",
    items: ["escrivaninha", "candelabro", "livros", "pergaminho", "cadeira"],
    wall: ["estante", "estante"],
  },
  vazia: { n: "Sala", items: ["escombros", "pilar-quebrado", "ossos", "barril", "sangue"], wall: [] },
};
const CAVE_ITEMS = [
  "estalagmites",
  "estalagmites",
  "cristais",
  "cogumelos-brilho",
  "pedra",
  "pedra-musgo",
  "rochas",
  "ossos",
  "agua-rasa",
  "cogumelos",
  "escombros",
  "pedregulho",
];
function mergeSegs(segs) {
  // junta pedaços de parede em linha reta
  const key = (x, y) => x.toFixed(3) + "," + y.toFixed(3),
    adj = new Map(),
    used = new Uint8Array(segs.length);
  segs.forEach((s, i) => {
    for (const k of [key(s[0], s[1]), key(s[2], s[3])]) {
      if (!adj.has(k)) adj.set(k, []);
      adj.get(k).push(i);
    }
  });
  const dir = s => {
    const dx = s[2] - s[0],
      dy = s[3] - s[1],
      L = Math.hypot(dx, dy) || 1;
    return [dx / L, dy / L];
  };
  const out = [];
  for (let i = 0; i < segs.length; i++) {
    if (used[i]) continue;
    used[i] = 1;
    const [dx, dy] = dir(segs[i]);
    const grow = (px, py) => {
      for (;;) {
        const j = (adj.get(key(px, py)) || []).find(j => {
          if (used[j]) return false;
          const [ex, ey] = dir(segs[j]);
          return Math.abs(Math.abs(ex * dx + ey * dy) - 1) < 1e-6;
        });
        if (j == null) return [px, py];
        used[j] = 1;
        const s = segs[j];
        [px, py] = key(s[0], s[1]) === key(px, py) ? [s[2], s[3]] : [s[0], s[1]];
      }
    };
    const [x2, y2] = grow(segs[i][2], segs[i][3]),
      [x1, y1] = grow(segs[i][0], segs[i][1]);
    out.push([x1, y1, x2, y2]);
  }
  return out;
}
function caveContour(T, W, H) {
  // marching squares nos centros das casas: chão com cantos cortados + paredes
  const v = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : T[y * W + x] ? 1 : 0);
  const polys = [],
    segs = [];
  for (let j = -1; j < H; j++)
    for (let i = -1; i < W; i++) {
      const c = [
        [i, j],
        [i + 1, j],
        [i + 1, j + 1],
        [i, j + 1],
      ].map(([x, y]) => ({ x: x + 0.5, y: y + 0.5, in: v(x, y) }));
      const n = c.reduce((s, k) => s + k.in, 0);
      if (!n) continue;
      const mid = (a, b) => [(a.x + b.x) / 2, (a.y + b.y) / 2];
      if (n === 2 && c[0].in === c[2].in) {
        // sela: separa as duas pontas
        for (const k of c[0].in ? [0, 2] : [1, 3]) {
          const p = c[k],
            a = c[(k + 3) % 4],
            b = c[(k + 1) % 4],
            m1 = mid(a, p),
            m2 = mid(p, b);
          polys.push([m1, [p.x, p.y], m2]);
          segs.push([...m1, ...m2]);
        }
        continue;
      }
      const poly = [],
        ms = [];
      for (let k = 0; k < 4; k++) {
        const p = c[k],
          q = c[(k + 1) % 4];
        if (p.in) poly.push([p.x, p.y]);
        if (p.in !== q.in) {
          const m = mid(p, q);
          poly.push(m);
          ms.push(m);
        }
      }
      if (ms.length === 2) segs.push([...ms[0], ...ms[1]]);
      polys.push(poly);
    }
  const seen = new Set(),
    clean = [];
  for (const s of segs) {
    const k1 = s.map(v => v.toFixed(3)).join(","),
      k2 = [s[2], s[3], s[0], s[1]].map(v => v.toFixed(3)).join(",");
    if (seen.has(k1) || seen.has(k2) || (s[0] === s[2] && s[1] === s[3])) continue;
    seen.add(k1);
    clean.push(s);
  }
  return { polys, segs: clean };
}
function genMap(o) {
  if (OUT_STYLES.has(o.style)) return genScenery(o);
  const R = rng(o.seed),
    ri = (a, b) => a + Math.floor(R() * (b - a + 1)),
    pick = a => a[Math.floor(R() * a.length)];
  const W = Math.max(16, Math.min(160, o.w | 0)),
    H = Math.max(12, Math.min(160, o.h | 0)),
    GAP = Math.max(2, Math.min(12, o.gap ?? 5));
  let T = new Uint8Array(W * H);
  const RID = new Int16Array(W * H).fill(-1);
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : T[y * W + x]);
  const inside = (x, y) => x >= 1 && y >= 1 && x < W - 1 && y < H - 1;
  const rooms = [],
    doorsOut = [],
    props = [],
    occ = new Uint8Array(W * H);
  let start = null,
    end = null;
  if (o.style === "cave") {
    for (let tries = 0; tries < 8; tries++) {
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) T[y * W + x] = inside(x, y) && R() > 0.44 ? 1 : 0;
      for (let it = 0; it < 5; it++) {
        const N = new Uint8Array(W * H);
        for (let y = 1; y < H - 1; y++)
          for (let x = 1; x < W - 1; x++) {
            let w = 0;
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!at(x + dx, y + dy)) w++;
            N[y * W + x] = w >= 5 ? 0 : 1;
          }
        T = N;
      }
      // fica só com a maior região
      const lab = new Int32Array(W * H).fill(-1);
      let best = -1,
        bestN = 0,
        id = 0;
      for (let i = 0; i < W * H; i++)
        if (T[i] && lab[i] < 0) {
          let n = 0;
          const q = [i];
          lab[i] = id;
          while (q.length) {
            const c = q.pop();
            n++;
            const x = c % W,
              y = (c / W) | 0;
            for (const [dx, dy] of [
              [1, 0],
              [-1, 0],
              [0, 1],
              [0, -1],
            ]) {
              const nx = x + dx,
                ny = y + dy;
              if (!at(nx, ny)) continue;
              const k = ny * W + nx;
              if (lab[k] < 0) {
                lab[k] = id;
                q.push(k);
              }
            }
          }
          if (n > bestN) {
            bestN = n;
            best = id;
          }
          id++;
        }
      for (let i = 0; i < W * H; i++) if (lab[i] !== best) T[i] = 0;
      if (bestN > W * H * 0.3) break;
    }
    const fl = [];
    for (let i = 0; i < W * H; i++) if (T[i]) fl.push(i);
    const s0 = fl.reduce((a, b) => (b % W < a % W ? b : a), fl[0]);
    const dist = new Int32Array(W * H).fill(-1);
    dist[s0] = 0;
    const q = [s0];
    let far = s0;
    while (q.length) {
      const c = q.shift();
      const x = c % W,
        y = (c / W) | 0;
      if (dist[c] > dist[far]) far = c;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = x + dx,
          ny = y + dy;
        if (!at(nx, ny)) continue;
        const k = ny * W + nx;
        if (dist[k] < 0) {
          dist[k] = dist[c] + 1;
          q.push(k);
        }
      }
    }
    start = [s0 % W, (s0 / W) | 0];
    end = [far % W, (far / W) | 0];
  } else {
    const rmin = Math.max(2, o.rmin | 0),
      rmax = Math.max(rmin, o.rmax | 0);
    for (let a = 0; a < 600 && rooms.length < o.rooms; a++) {
      const w = ri(rmin, rmax),
        h = ri(rmin, rmax),
        x = ri(2, W - w - 2),
        y = ri(2, H - h - 2);
      if (x < 2 || y < 2) continue;
      const gp = GAP + ri(0, 2); // espaço entre as salas: corredores mais longos
      if (rooms.some(r => x < r.x + r.w + gp && x + w + gp > r.x && y < r.y + r.h + gp && y + h + gp > r.y))
        continue;
      rooms.push({ x, y, w, h, i: rooms.length });
    }
    for (const r of rooms)
      for (let y = r.y; y < r.y + r.h; y++)
        for (let x = r.x; x < r.x + r.w; x++) {
          T[y * W + x] = 1;
          RID[y * W + x] = r.i;
        }
    const cen = r => [r.x + (r.w >> 1), r.y + (r.h >> 1)];
    let cw = 1;
    const cwFix = o.cw | 0; // 0 = variado (1, 2 ou 3 casas)
    const dig = (x, y, v) => {
      const o0 = -((cw - 1) >> 1);
      for (let a = o0; a < o0 + cw; a++)
        for (let b = o0; b < o0 + cw; b++) {
          const X = x + a,
            Y = y + b;
          if (inside(X, Y) && T[Y * W + X] === 0) T[Y * W + X] = v;
        }
    };
    const corridor = (A, B, v, wFix) => {
      cw = wFix || cwFix || [1, 1, 2, 2, 3][ri(0, 4)];
      let [x, y] = cen(A);
      const [x2, y2] = cen(B),
        hf = R() < 0.5;
      const stepX = () => {
          while (x !== x2) {
            dig(x, y, v);
            x += Math.sign(x2 - x);
          }
        },
        stepY = () => {
          while (y !== y2) {
            dig(x, y, v);
            y += Math.sign(y2 - y);
          }
        };
      if (hf) {
        stepX();
        stepY();
      } else {
        stepY();
        stepX();
      }
      dig(x, y, v);
    };
    // árvore mínima ligando as salas + alguns atalhos
    const linked = new Set(),
      con = new Set([0]),
      dd = (a, b) => Math.hypot(cen(a)[0] - cen(b)[0], cen(a)[1] - cen(b)[1]);
    while (con.size < rooms.length) {
      let best = null;
      for (const i of con)
        for (const r of rooms)
          if (!con.has(r.i)) {
            const d = dd(rooms[i], r);
            if (!best || d < best[2]) best = [i, r.i, d];
          }
      corridor(rooms[best[0]], rooms[best[1]], 2);
      con.add(best[1]);
      linked.add(best[0] + "-" + best[1]);
      linked.add(best[1] + "-" + best[0]);
    }
    for (let k = 0; k < Math.round(rooms.length * 0.2); k++) {
      const a = pick(rooms),
        b = rooms.filter(r => r !== a).sort((p, q) => dd(a, p) - dd(a, q))[ri(0, 2)];
      if (b && !linked.has(a.i + "-" + b.i)) {
        corridor(a, b, 2);
        linked.add(a.i + "-" + b.i);
        linked.add(b.i + "-" + a.i);
      }
    }
    // passagens secretas
    for (let k = 0; k < (o.secret | 0); k++) {
      const a = pick(rooms),
        b = rooms.filter(r => r !== a && !linked.has(a.i + "-" + r.i)).sort((p, q) => dd(a, p) - dd(a, q))[0];
      if (!b) break;
      corridor(a, b, 3, 1);
      linked.add(a.i + "-" + b.i);
      linked.add(b.i + "-" + a.i);
    }
    // becos sem saída
    for (let k = 0, g = 0; k < (o.dead | 0) && g < 200; g++) {
      const cells = [];
      for (let i = 0; i < W * H; i++) if (T[i] === 2) cells.push(i);
      if (!cells.length) break;
      const c = pick(cells),
        [dx, dy] = pick([
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]),
        len = ri(3, 7);
      let x = c % W,
        y = (c / W) | 0,
        ok = true;
      const path = [];
      for (let s = 1; s <= len; s++) {
        const X = x + dx * s,
          Y = y + dy * s;
        if (
          !inside(X, Y) ||
          at(X, Y) ||
          at(X + dy, Y + dx) ||
          at(X - dy, Y - dx) ||
          at(X + dx, Y + dy) === 1
        ) {
          ok = false;
          break;
        }
        path.push([X, Y]);
      }
      if (!ok || path.length < 3) continue;
      for (const [X, Y] of path) T[Y * W + X] = 2;
      k++;
    }
    const byX = rooms.slice().sort((a, b) => a.x - b.x);
    const sR = byX[0],
      eR = rooms.slice().sort((a, b) => dd(sR, b) - dd(sR, a))[0];
    if (sR) {
      start = cen(sR);
      sR.start = true;
    }
    if (eR && eR !== sR) {
      end = cen(eR);
      eR.end = true;
    }
  }
  // ---- paredes e portas ----
  const doorEdge = new Set(),
    segs = [];
  if (o.style !== "cave") {
    for (const r of rooms) {
      const sides = [
        // [células de dentro na borda, célula de fora, aresta]
        [...Array(r.w)].map((_, k) => [r.x + k, r.y, r.x + k, r.y - 1, [r.x + k, r.y, r.x + k + 1, r.y]]),
        [...Array(r.w)].map((_, k) => [
          r.x + k,
          r.y + r.h - 1,
          r.x + k,
          r.y + r.h,
          [r.x + k, r.y + r.h, r.x + k + 1, r.y + r.h],
        ]),
        [...Array(r.h)].map((_, k) => [r.x, r.y + k, r.x - 1, r.y + k, [r.x, r.y + k, r.x, r.y + k + 1]]),
        [...Array(r.h)].map((_, k) => [
          r.x + r.w - 1,
          r.y + k,
          r.x + r.w,
          r.y + k,
          [r.x + r.w, r.y + k, r.x + r.w, r.y + k + 1],
        ]),
      ];
      r.open = [];
      for (const side of sides) {
        let run = [];
        const flush = () => {
          if (!run.length) return;
          const secret = run.some(c => at(c[2], c[3]) === 3);
          if (run.length <= 3 && (secret || R() * 100 < o.doors)) {
            const e0 = run[0][4],
              e1 = run[run.length - 1][4];
            doorsOut.push([e0[0], e0[1], e1[2], e1[3], secret ? 1 : 0]);
            for (const c of run) doorEdge.add(c[4].join(","));
          }
          for (const c of run) {
            r.open.push([c[0], c[1]]);
            occ[c[1] * W + c[0]] = 1;
          }
          run = [];
        };
        for (const c of side) {
          if (at(c[2], c[3]) >= 2) run.push(c);
          else flush();
        }
        flush();
      }
    }
    for (let y = 0; y <= H; y++)
      for (let x = 0; x < W; x++) {
        if (!!at(x, y - 1) !== !!at(x, y) && !doorEdge.has([x, y, x + 1, y].join(",")))
          segs.push([x, y, x + 1, y]);
      }
    for (let x = 0; x <= W; x++)
      for (let y = 0; y < H; y++) {
        if (!!at(x - 1, y) !== !!at(x, y) && !doorEdge.has([x, y, x, y + 1].join(",")))
          segs.push([x, y, x, y + 1]);
      }
  } else segs.push(...caveContour(T, W, H).segs);
  const wallsOut = mergeSegs(segs);
  // ---- objetos ----
  const A = id => ASSETS.find(a => a.id === id);
  const free = (x, y, w, h, fl) => {
    for (let b = y; b < y + h; b++)
      for (let a = x; a < x + w; a++) {
        if (!inside(a, b) || occ[b * W + a] || !fl(a, b)) return false;
      }
    return true;
  };
  const put = (id, x, y, rot = 0, extra = {}) => {
    const a = A(id);
    if (!a) return false;
    const sw = rot % 180 ? a.h : a.w,
      sh = rot % 180 ? a.w : a.h;
    for (let b = y; b < y + sh; b++) for (let c = x; c < x + sw; c++) occ[b * W + c] = 1;
    props.push({ id, cx: x + sw / 2, cy: y + sh / 2, a: rot, ...extra });
    return true;
  };
  const tryPut = (id, fl, box, tries = 30, extra) => {
    const a = A(id);
    if (!a) return false;
    for (let k = 0; k < tries; k++) {
      const rot = a.w === a.h ? pick([0, 90, 180, 270]) : pick([0, 90]);
      const sw = rot % 180 ? a.h : a.w,
        sh = rot % 180 ? a.w : a.h;
      const x = ri(box[0], box[2] - sw),
        y = ri(box[1], box[3] - sh);
      if (x < box[0] || y < box[1]) continue;
      if (free(x, y, sw, sh, fl)) return put(id, x, y, rot, extra);
    }
    return false;
  };
  const nDeco = { none: 0, few: 1, normal: 3, lots: 6 }[o.deco] ?? 3;
  if (start) {
    const [sx, sy] = start;
    if (!occ[sy * W + sx]) {
      const a = A("escada-sobe");
      if (a && free(sx, sy, 1, 2, (x, y) => at(x, y))) put("escada-sobe", sx, sy);
      else occ[sy * W + sx] = 1;
    }
  }
  if (end) {
    const [ex, ey] = end;
    if (free(ex, ey, 1, 2, (x, y) => at(x, y))) put("escada", ex, ey);
    else if (free(ex, ey, 1, 1, (x, y) => at(x, y))) put("alcapao", ex, ey);
  }
  if (o.style !== "cave") {
    const types = Object.keys(ROOMT);
    for (const r of rooms) {
      const inR = (x, y) => RID[y * W + x] === r.i,
        box = [r.x, r.y, r.x + r.w, r.y + r.h];
      r.type = r.end
        ? pick(["tesouro", "templo", "covil"])
        : r.start
          ? pick(["vazia", "armazem"])
          : pick(types);
      const RT0 = ROOMT[r.type];
      if (o.torches) {
        // tochas no meio das paredes
        const cand = [
          [r.x + (r.w >> 1), r.y, 0],
          [r.x + (r.w >> 1), r.y + r.h - 1, 180],
          [r.x, r.y + (r.h >> 1), 270],
          [r.x + r.w - 1, r.y + (r.h >> 1), 90],
        ].filter(([x, y]) => !occ[y * W + x]);
        for (const [x, y, rot] of cand.slice(0, r.w * r.h > 30 ? 4 : 2)) put("tocha-parede", x, y, rot);
      }
      if (!nDeco) continue;
      for (const id of RT0.wall) {
        // encostados na parede de cima ou de baixo
        const a = A(id);
        if (!a) continue;
        for (let k = 0; k < 12; k++) {
          const top = R() < 0.5,
            x = ri(r.x, r.x + r.w - a.w),
            y = top ? r.y : r.y + r.h - a.h;
          if (free(x, y, a.w, a.h, inR)) {
            put(id, x, y, top ? 0 : 180);
            break;
          }
        }
      }
      if (r.type === "templo" && r.w >= 6 && r.h >= 6)
        for (const [x, y] of [
          [r.x + 1, r.y + 1],
          [r.x + r.w - 2, r.y + 1],
          [r.x + 1, r.y + r.h - 2],
          [r.x + r.w - 2, r.y + r.h - 2],
        ])
          if (free(x, y, 1, 1, inR)) put("coluna", x, y);
      if ((r.type === "covil" || R() < 0.25) && r.w >= 3 && r.h >= 3) {
        const cs = [
          [r.x, r.y, 0],
          [r.x + r.w - 2, r.y, 90],
          [r.x + r.w - 2, r.y + r.h - 2, 180],
          [r.x, r.y + r.h - 2, 270],
        ];
        const [x, y, rot] = pick(cs);
        if (free(x, y, 2, 2, inR)) put("teia", x, y, rot);
      }
      const n = Math.max(1, Math.round(nDeco * Math.min(2, (r.w * r.h) / 24)));
      for (let k = 0; k < n; k++) tryPut(pick(RT0.items), inR, box);
    }
  } else if (nDeco) {
    const n = Math.round((nDeco * W * H) / 160);
    const fl = (x, y) => !!at(x, y);
    for (let k = 0; k < n; k++) tryPut(pick(CAVE_ITEMS), fl, [1, 1, W - 1, H - 1], 40);
    if (o.torches)
      for (let k = 0; k < Math.round((W * H) / 180); k++)
        tryPut(pick(["cristais", "cogumelos-brilho", "fogueira"]), fl, [1, 1, W - 1, H - 1], 40);
  }
  // armadilhas escondidas nos corredores / túneis
  for (let k = 0, g = 0; k < (o.traps | 0) && g < 300; g++) {
    const cells = [];
    for (let i = 0; i < W * H; i++) if ((o.style === "cave" ? T[i] : T[i] === 2) && !occ[i]) cells.push(i);
    if (!cells.length) break;
    const c = pick(cells);
    put(pick(["espinhos", "alcapao", "espinhos", "buraco"]), c % W, (c / W) | 0, 0, { h: 1, trap: 1 });
    k++;
  }
  let t = "";
  for (let i = 0; i < W * H; i++) t += T[i] === 3 ? 2 : T[i];
  return {
    w: W,
    h: H,
    t,
    style: o.style === "cave" ? "cave" : "dungeon",
    walls: wallsOut,
    doors: doorsOut,
    props,
    rooms,
    start,
    end,
  };
}
// desenho do chão (determinístico a partir de scene.gen.t)
const genCache = { sig: "", cv: null };
const hash2 = (x, y, s = 0) => {
  let h = (x * 374761393 + y * 668265263 + s * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
function renderGen(g, S, cvIn) {
  if (OUT_STYLES.has(g.style)) return renderOutdoor(g, S, cvIn);
  const W = g.w,
    H = g.h,
    cvx = cvIn || document.createElement("canvas");
  cvx.width = Math.ceil(W * S);
  cvx.height = Math.ceil(H * S);
  const x = cvx.getContext("2d"),
    at = (a, b) => (a < 0 || b < 0 || a >= W || b >= H ? 0 : +g.t[b * W + a]);
  x.fillStyle = "#14100d";
  x.fillRect(0, 0, cvx.width, cvx.height);
  for (let b = 0; b < H; b++)
    for (let a = 0; a < W; a++)
      if (!at(a, b) && hash2(a, b, 7) < 0.25) {
        x.fillStyle = "rgba(60,50,40,.35)";
        x.fillRect(a * S + hash2(a, b, 1) * S * 0.6, b * S + hash2(a, b, 2) * S * 0.6, S * 0.25, S * 0.2);
      }
  if (g.style === "cave") {
    const T = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) T[i] = +g.t[i];
    const { polys, segs } = caveContour(T, W, H);
    x.fillStyle = "#5e554a";
    x.beginPath();
    for (const p of polys) {
      p.forEach(([u, v], i) => (i ? x.lineTo(u * S, v * S) : x.moveTo(u * S, v * S)));
      x.closePath();
    }
    x.fill();
    x.save();
    x.clip();
    for (let b = 0; b < H; b++)
      for (let a = 0; a < W; a++)
        if (at(a, b)) {
          const h = hash2(a, b);
          x.fillStyle = h < 0.5 ? `rgba(0,0,0,${0.05 + h * 0.12})` : `rgba(255,240,220,${(h - 0.5) * 0.08})`;
          x.beginPath();
          x.arc(
            (a + hash2(a, b, 3)) * S,
            (b + hash2(a, b, 4)) * S,
            S * (0.3 + hash2(a, b, 5) * 0.5),
            0,
            Math.PI * 2,
          );
          x.fill();
          if (hash2(a, b, 9) < 0.12) {
            x.fillStyle = "#4a433a";
            x.beginPath();
            x.arc((a + 0.5) * S, (b + 0.5) * S, S * 0.12, 0, Math.PI * 2);
            x.fill();
          }
        }
    x.restore();
    x.lineCap = "round";
    x.lineJoin = "round";
    x.strokeStyle = "rgba(0,0,0,.45)";
    x.lineWidth = S * 0.45;
    x.beginPath();
    for (const s of segs) {
      x.moveTo(s[0] * S, s[1] * S);
      x.lineTo(s[2] * S, s[3] * S);
    }
    x.stroke();
    x.strokeStyle = "#2c2520";
    x.lineWidth = S * 0.22;
    x.stroke();
    x.strokeStyle = "#4d443a";
    x.lineWidth = S * 0.07;
    x.stroke();
    return cvx;
  }
  for (let b = 0; b < H; b++)
    for (let a = 0; a < W; a++) {
      const v = at(a, b);
      if (!v) continue;
      const h = hash2(a, b),
        base = v === 1 ? [122, 114, 102] : [104, 97, 87],
        k = 0.9 + h * 0.18;
      x.fillStyle = `rgb(${base.map(c => Math.round(c * k)).join(",")})`;
      x.fillRect(a * S, b * S, S, S);
      // lajotas: meia casa, com rejunte
      x.strokeStyle = "rgba(30,24,20,.45)";
      x.lineWidth = Math.max(1, S * 0.03);
      if (v === 1) {
        const off = (b % 2) * S * 0.5;
        x.beginPath();
        x.moveTo(a * S, b * S + 0.5);
        x.lineTo(a * S + S, b * S + 0.5);
        x.moveTo(a * S + ((off + S * 0.5) % S), b * S);
        x.lineTo(a * S + ((off + S * 0.5) % S), b * S + S);
        x.stroke();
      } else x.strokeRect(a * S + 0.5, b * S + 0.5, S - 1, S - 1);
      if (h < 0.1) {
        x.strokeStyle = "rgba(20,15,12,.6)";
        x.beginPath();
        x.moveTo(a * S + S * 0.2, b * S + S * 0.3);
        x.lineTo(a * S + S * 0.5, b * S + S * 0.55);
        x.lineTo(a * S + S * 0.7, b * S + S * 0.5);
        x.stroke();
      }
      if (hash2(a, b, 11) < 0.08) {
        x.fillStyle = "rgba(60,90,40,.35)";
        x.beginPath();
        x.arc(a * S + S * hash2(a, b, 12), b * S + S * hash2(a, b, 13), S * 0.18, 0, Math.PI * 2);
        x.fill();
      }
    }
  // sombra e paredes
  const segs = [];
  for (let b = 0; b <= H; b++)
    for (let a = 0; a < W; a++)
      if (!!at(a, b - 1) !== !!at(a, b)) segs.push([a, b, a + 1, b, at(a, b) ? 1 : -1, 0]);
  for (let a = 0; a <= W; a++)
    for (let b = 0; b < H; b++)
      if (!!at(a - 1, b) !== !!at(a, b)) segs.push([a, b, a, b + 1, 0, at(a, b) ? 1 : -1]);
  if (g.nx?.length) {
    const nx = new Set(g.nx);
    for (let i = segs.length - 1; i >= 0; i--) if (nx.has(segs[i].slice(0, 4).join(","))) segs.splice(i, 1);
  }
  for (const s of g.iw || []) segs.push([s[0], s[1], s[2], s[3], 0, 0]);
  for (const s of g.sw || []) {
    const [x1, y1, x2, y2, fx, fy] = s,
      v = x1 === x2;
    if (fx || fy) {
      // apaga o começo do corredor escondido (1 casa) e as paredinhas dele, e faz a sombra só do lado de cá
      const ax = Math.min(x1, x2),
        ay = Math.min(y1, y2),
        bx = Math.max(x1, x2),
        by = Math.max(y1, y2);
      const rx0 = fx > 0 ? ax : fx < 0 ? ax - 1 : ax,
        ry0 = fy > 0 ? ay : fy < 0 ? ay - 1 : ay,
        rw = v ? 1 : bx - ax,
        rh = v ? by - ay : 1;
      x.fillStyle = "#14100d";
      x.fillRect(rx0 * S, ry0 * S, rw * S, rh * S);
      for (let i = segs.length - 1; i >= 0; i--) {
        const q = segs[i],
          perp = v ? q[1] === q[3] : q[0] === q[2];
        if (!perp) continue;
        const inX = q[0] >= rx0 && q[2] <= rx0 + rw,
          inY = q[1] >= ry0 && q[3] <= ry0 + rh;
        if (inX && inY) segs.splice(i, 1);
      }
      segs.push([x1, y1, x2, y2, -fy, -fx]);
    } else segs.push([x1, y1, x2, y2, v ? 0 : 1, v ? 1 : 0], [x1, y1, x2, y2, v ? 0 : -1, v ? -1 : 0]);
  } // passagem secreta fechada: parede igual às outras (só para os jogadores)
  x.lineCap = "square";
  x.strokeStyle = "rgba(0,0,0,.35)";
  x.lineWidth = S * 0.3;
  x.beginPath();
  for (const [x1, y1, x2, y2, ny, nx] of segs) {
    const o = S * 0.18;
    x.moveTo(x1 * S + nx * o, y1 * S + ny * o);
    x.lineTo(x2 * S + nx * o, y2 * S + ny * o);
  }
  x.stroke();
  x.beginPath();
  for (const s of segs) {
    x.moveTo(s[0] * S, s[1] * S);
    x.lineTo(s[2] * S, s[3] * S);
  }
  x.strokeStyle = "#241e19";
  x.lineWidth = S * 0.26;
  x.stroke();
  x.strokeStyle = "#51483e";
  x.lineWidth = S * 0.08;
  x.stroke();
  return cvx;
}
function genCanvas() {
  const g0 = scene.gen;
  if (!g0 || !g0.t) return null;
  const sw =
    (!isGM || gmPreview) && !OUT_STYLES.has(g0.style)
      ? secretHides().map(h => [
          ...h.p.map((v, i) => Math.round(((v - (i % 2 ? g0.y0 || 0 : g0.x0 || 0)) / g0.s) * 2) / 2),
          Math.round(h.fx),
          Math.round(h.fy),
        ])
      : [];
  const g = sw.length ? { ...g0, sw } : g0;
  const S = Math.max(8, Math.min(48, g.s || 48, 2800 / Math.max(g.w, g.h))),
    sig = [
      g.style,
      g.w,
      g.h,
      S,
      g.seed,
      g.ver || 0,
      JSON.stringify(g.iw || []),
      JSON.stringify(g.nx || []),
      JSON.stringify(sw),
    ].join("|");
  if (genCache.sig !== sig || genCache.t !== g.t) {
    genCache.sig = sig;
    genCache.t = g.t;
    genCache.cv = renderGen(g, S);
  } // compara o desenho inteiro, não só o começo
  return genCache.cv;
}
function applyGen(res, o) {
  if (G().type === "hex") scene.grid = { ...scene.grid, type: "square" };
  const S = G().size,
    gx = G().ox || 0,
    gy = G().oy || 0,
    P = (x, y) => [Math.round((gx + x * S) * 10) / 10, Math.round((gy + y * S) * 10) / 10];
  scene.walls = res.walls
    .map(s => ({ p: [...P(s[0], s[1]), ...P(s[2], s[3])] }))
    .concat(
      res.doors.map(d => ({
        p: [...P(d[0], d[1]), ...P(d[2], d[3])],
        d: 1,
        o: 0,
        ...(d[4] ? { s: 1 } : {}),
      })),
    );
  Object.assign(scene, {
    bg: null,
    bgW: 0,
    bgH: 0,
    bgQ: 0,
    bgFine: 0,
    roll: null,
    gen: {
      v: 1,
      style: res.style,
      w: res.w,
      h: res.h,
      t: res.t,
      iw: res.iw || null,
      x0: gx,
      y0: gy,
      s: S,
      seed: o.seed,
    },
  });
  if (o.dark) scene.light = "dark";
  else if (OUT_STYLES.has(res.style)) scene.light = "day";
  const U = G().unit || 1,
    chars = freshDungeonTokens();
  drawings = drawings.filter(d => d.t !== "tpl");
  save("drawings");
  const pr = res.props
    .map(p => {
      const a = ASSETS.find(x => x.id === p.id);
      if (!a) return null;
      const [x, y] = P(p.cx, p.cy);
      const t = {
        id: uid(),
        k: "prop",
        n: a.n,
        img: `/assets/${a.path || a.id + ".svg"}`,
        pw: a.w,
        ph: a.h,
        a: p.a || 0,
        blk: p.trap || p.noblk ? null : a.blk || null,
        sn: true,
        x,
        y,
      };
      if (p.h) t.h = true;
      if (a.li) t.li = { rb: a.li.b * U, rd: a.li.d * U, ang: 360, c: a.li.c };
      return t;
    })
    .filter(Boolean);
  // personagens vão para a entrada
  if (res.start) {
    const T = res.t,
      W = res.w,
      busy = new Set(res.props.map(p => Math.floor(p.cx) + "," + Math.floor(p.cy))),
      q = [res.start],
      seen = new Set([res.start.join(",")]),
      spots = [];
    while (q.length && spots.length < chars.length) {
      const [a, b] = q.shift();
      if (+T[b * W + a] && !busy.has(a + "," + b)) spots.push([a, b]);
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const k = a + dx + "," + (b + dy);
        if (
          !seen.has(k) &&
          a + dx >= 0 &&
          b + dy >= 0 &&
          a + dx < W &&
          b + dy < res.h &&
          +T[(b + dy) * W + a + dx]
        ) {
          seen.add(k);
          q.push([a + dx, b + dy]);
        }
      }
    }
    chars.forEach((t, i) => {
      const s = spots[i] || res.start;
      [t.x, t.y] = P(s[0] + 0.5, s[1] + 0.5);
      t.tr = [];
    });
  }
  tokens = chars.concat(pr);
  resetExplore();
  wallsVer++;
  losCache.clear();
  selTok = null;
  save("scene");
  save("tokens");
  save("fog", false);
  dirty = true;
  drawTop();
  drawEmpty();
  fit();
}
let genRes = null,
  genT = null;
function openGenPanel() {
  if (genOpt.style === "rolled") return openRollPanel();
  panelKind = "gen";
  const o = genOpt,
    cave = o.style === "cave",
    outer = OUT_STYLES.has(o.style);
  const num = (id, label, v, min, max, unit = "") =>
    `<label class="gnum"><span>${label}</span><input type="number" id="${id}" min="${min}" max="${max}" value="${v}">${unit ? `<small>${unit}</small>` : ""}</label>`;
  $("#panel").innerHTML =
    `<div class="panel gen-panel" role="dialog" aria-label="Gerador de masmorras"><h3>Gerador de cenários <button class="btn small" id="pClose">Fechar</button></h3>
    ${styleTabs(o.style)}
    <canvas id="genPrev" width="388" height="280" aria-label="Prévia do cenário"></canvas>
    ${
      outer
        ? genOptionsHTML(o, num)
        : `<div class="ggrid">
      ${num("gW", "Largura", o.w, 16, 160, "casas")}${num("gH", "Altura", o.h, 12, 160, "casas")}
      ${
        cave
          ? ""
          : num("gRooms", "Salas", o.rooms, 2, 40) +
            `<label class="gnum"><span>Corredor</span><select id="gCw">${[
              [0, "Variado (1–3)"],
              [1, "1 casa"],
              [2, "2 casas"],
              [3, "3 casas"],
            ]
              .map(([k, l]) => `<option value="${k}" ${+o.cw === k ? "selected" : ""}>${l}</option>`)
              .join("")}</select></label>` +
            num("gGap", "Espaço entre salas", o.gap ?? 5, 2, 12, "casas") +
            num("gMin", "Sala mín.", o.rmin, 2, 12) +
            num("gMax", "Sala máx.", o.rmax, 3, 20) +
            num("gDoors", "Portas", o.doors, 0, 100, "%") +
            num("gSecret", "Passagens secretas", o.secret, 0, 6) +
            num("gDead", "Becos sem saída", o.dead, 0, 12)
      }
      ${num("gTraps", "Armadilhas escondidas", o.traps, 0, 20)}
    </div>
    <label for="gDeco">Decoração</label><select id="gDeco">${[
      ["none", "Nenhuma"],
      ["few", "Pouca"],
      ["normal", "Normal"],
      ["lots", "Muita"],
    ]
      .map(([k, l]) => `<option value="${k}" ${o.deco === k ? "selected" : ""}>${l}</option>`)
      .join("")}</select>
    <label class="chk" style="margin-top:10px"><input type="checkbox" id="gTorch" ${o.torches ? "checked" : ""}> ${cave ? "Cristais e fogueiras que iluminam" : "Tochas nas paredes (iluminam)"}</label>
    `
    }
    <label class="chk"><input type="checkbox" id="gDark" ${o.dark ? "checked" : ""}> ${outer ? "É noite (escuro: só vê quem tem luz)" : "Começar no escuro (só vê quem tem luz)"}</label>
    <div class="two" style="align-items:end"><label>Semente <input type="number" id="gSeed" value="${o.seed}"></label><button class="btn" id="gNew" title="Outro cenário com as mesmas opções">🎲 Gerar outro</button></div>
    <p class="hint" id="gInfo"></p>
    <div class="acts foot"><span class="spacer"></span><button class="btn primary" id="gUse">Usar no mapa</button></div>
    <p class="hint">Troca a imagem, as paredes e os objetos do mapa atual (os personagens vão para a entrada). Ctrl+Z desfaz. Para guardar o mapa atual, salve antes em <b>Mapas</b>.${outer ? "" : " Armadilhas ficam ocultas: só você vê."}</p></div>`;
  $("#pClose").onclick = closePanel;
  const read = () => {
    const v = (id, d) => {
      const e = $("#" + id);
      return e ? +e.value || d : d;
    };
    Object.assign(genOpt, {
      w: v("gW", o.w),
      h: v("gH", o.h),
      rooms: v("gRooms", o.rooms),
      cw: $("#gCw") ? +$("#gCw").value : o.cw,
      gap: v("gGap", o.gap ?? 5),
      rmin: v("gMin", o.rmin),
      rmax: v("gMax", o.rmax),
      doors: $("#gDoors") ? +$("#gDoors").value : o.doors,
      secret: $("#gSecret") ? +$("#gSecret").value : o.secret,
      dead: $("#gDead") ? +$("#gDead").value : o.dead,
      traps: $("#gTraps") ? +$("#gTraps").value || 0 : o.traps,
      deco: $("#gDeco") ? $("#gDeco").value : o.deco,
      torches: $("#gTorch") ? $("#gTorch").checked : o.torches,
      dark: $("#gDark").checked,
      seed: +$("#gSeed").value || 1,
    });
    const sv = (id, k, f = x => x) => {
      const e = $("#" + id);
      if (e) genOpt[k] = e.type === "checkbox" ? e.checked : f(e.value);
    };
    sv("gDens", "dens");
    sv("gSeason", "season");
    sv("gClear", "clear");
    sv("gPond", "pond");
    sv("gAnimals", "animals");
    sv("gTreeBlk", "treeBlk");
    sv("gHouses", "houses", Number);
    sv("gMarket", "market");
    sv("gFields", "fields");
    sv("gIkind", "ikind");
    sv("gGraves", "graves");
    sv("gMauso", "mauso");
    saveGenOpt();
    clearTimeout(genT);
    genT = setTimeout(runGen, 120);
  };
  $("#panel")
    .querySelectorAll("input,select")
    .forEach(e => (e.onchange = read));
  $("#gStyle").onclick = e => {
    const b = e.target.closest("[data-st]");
    if (!b) return;
    genOpt.style = b.dataset.st;
    genOpt.dark = GEN_DARK[genOpt.style];
    saveGenOpt();
    openGenPanel();
  };
  $("#gNew").onclick = () => {
    $("#gSeed").value = 1 + Math.floor(Math.random() * 99999);
    read();
  };
  $("#gUse").onclick = () => {
    if (!genRes) return;
    if (
      (scene.bg || walls().length || tokens.some(isProp)) &&
      !confirm("Trocar o mapa atual por este cenário? (Ctrl+Z desfaz)")
    )
      return;
    applyGen(genRes, genOpt);
    closePanel();
    toast("Cenário pronto!");
  };
  runGen();
}
function runGen() {
  const c = $("#genPrev");
  if (!c) return;
  if (!ASSETS.length) {
    $("#gInfo").textContent = "Carregando os assets…";
    setTimeout(runGen, 400);
    return;
  }
  genRes = genMap({ ...genOpt });
  const S = Math.min(c.width / genRes.w, c.height / genRes.h),
    x = c.getContext("2d");
  const g = { w: genRes.w, h: genRes.h, t: genRes.t, style: genRes.style, iw: genRes.iw },
    img = renderGen(g, Math.max(4, S * 2));
  x.fillStyle = "#0d0b09";
  x.fillRect(0, 0, c.width, c.height);
  const ox = (c.width - genRes.w * S) / 2,
    oy = (c.height - genRes.h * S) / 2;
  x.drawImage(img, ox, oy, genRes.w * S, genRes.h * S);
  let waiting = 0;
  for (const p of genRes.props) {
    const a = ASSETS.find(q => q.id === p.id);
    if (!a) continue;
    const im = getImg(`/assets/${a.path}`);
    if (!im) {
      waiting++;
      continue;
    }
    x.save();
    x.translate(ox + p.cx * S, oy + p.cy * S);
    x.rotate((p.a * Math.PI) / 180);
    if (p.h) x.globalAlpha = 0.55;
    x.drawImage(im, (-a.w * S) / 2, (-a.h * S) / 2, a.w * S, a.h * S);
    x.restore();
  }
  x.lineWidth = 2;
  for (const d of genRes.doors) {
    x.strokeStyle = d[4] ? "#c07ae8" : "#d8a050";
    x.beginPath();
    x.moveTo(ox + d[0] * S, oy + d[1] * S);
    x.lineTo(ox + d[2] * S, oy + d[3] * S);
    x.stroke();
  }
  if (waiting)
    setTimeout(() => {
      if ($("#genPrev")) runGen();
    }, 350);
  const nD = genRes.doors.filter(d => !d[4]).length,
    nS = genRes.doors.length - nD;
  const SN = {
    forest: "Floresta",
    village: genRes.w * genRes.h > 2600 ? "Cidade" : "Vila",
    interior: "Construção",
    cemetery: "Cemitério",
  };
  $("#gInfo").innerHTML = SN[genRes.style]
    ? `${SN[genRes.style]} ${genRes.w}×${genRes.h} · ${genRes.props.length} objetos${genRes.rooms.length ? ` · ${genRes.rooms.length} cômodo${genRes.rooms.length > 1 ? "s" : ""}` : ""}`
    : genRes.style === "cave"
      ? `Caverna ${genRes.w}×${genRes.h} · ${genRes.props.length} objetos`
      : `${genRes.rooms.length} salas · ${nD} portas${nS ? ` · ${nS} secreta${nS > 1 ? "s" : ""} <span style="color:#c07ae8">(roxas)</span>` : ""} · ${genRes.props.length} objetos`;
}

// ---------- outros cenários: floresta, vila, casa/taverna, cemitério ----------
// códigos do chão: 3 grama · 4 terra · 5 água · 6 madeira · 7 pedra (calçamento) · 8 mata fechada · 9 terra de plantio
const OUT_STYLES = new Set(["forest", "village", "interior", "cemetery"]);
const GEN_STYLES = [
  ["dungeon", "🏰 Masmorra"],
  ["cave", "⛰ Caverna"],
  ["forest", "🌲 Floresta"],
  ["village", "🏘 Vila"],
  ["interior", "🏠 Casa / Taverna"],
  ["cemetery", "⚰️ Cemitério"],
  ["rolled", "🎲 Rolada"],
];
const GEN_DARK = {
  dungeon: true,
  cave: true,
  cemetery: true,
  rolled: true,
  forest: false,
  village: false,
  interior: false,
};
const styleTabs = cur =>
  `<div class="seg gstyles" id="gStyle">${GEN_STYLES.map(([k, l]) => `<button data-st="${k}" aria-pressed="${cur === k}">${l}</button>`).join("")}</div>`;
function genScenery(o) {
  const R = rng(o.seed),
    ri = (a, b) => a + Math.floor(R() * (b - a + 1)),
    pick = a => a[Math.floor(R() * a.length)];
  const st = o.style;
  let W = Math.max(20, Math.min(160, o.w | 0)),
    H = Math.max(16, Math.min(160, o.h | 0));
  const IK = { taverna: [18, 13], casa: [11, 8], mansao: [24, 17], loja: [12, 9] };
  if (st === "interior") {
    const [bw, bh] = IK[o.ikind] || IK.taverna;
    W = bw + 8;
    H = bh + 9;
  }
  const T = new Uint8Array(W * H).fill(st === "cemetery" ? 8 : 3),
    occ = new Uint8Array(W * H),
    props = [],
    walls = [],
    doors = [],
    rooms = [];
  const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H,
    at = (x, y) => (inb(x, y) ? T[y * W + x] : 0),
    set = (x, y, v) => {
      if (inb(x, y)) T[y * W + x] = v;
    };
  const A = id => ASSETS.find(a => a.id === id);
  const fits = (x, y, w, h, ok) => {
    for (let b = y; b < y + h; b++)
      for (let a = x; a < x + w; a++) {
        if (!inb(a, b) || occ[b * W + a] || (ok && !ok(a, b))) return false;
      }
    return true;
  };
  const put = (id, x, y, rot = 0, extra = {}) => {
    const a = A(id);
    if (!a) return false;
    const sw = rot % 180 ? a.h : a.w,
      sh = rot % 180 ? a.w : a.h;
    for (let b = y; b < y + sh; b++) for (let c = x; c < x + sw; c++) if (inb(c, b)) occ[b * W + c] = 1;
    props.push({ id, cx: x + sw / 2, cy: y + sh / 2, a: rot, ...extra });
    return true;
  };
  const tryPut = (id, ok, box = [0, 0, W, H], tries = 40, rots, extra) => {
    const a = A(id);
    if (!a) return false;
    for (let k = 0; k < tries; k++) {
      const rot = rots ? pick(rots) : a.w === a.h ? pick([0, 90, 180, 270]) : pick([0, 90, 180, 270]);
      const sw = rot % 180 ? a.h : a.w,
        sh = rot % 180 ? a.w : a.h,
        x = ri(box[0], box[2] - sw),
        y = ri(box[1], box[3] - sh);
      if (x < box[0] || y < box[1]) continue;
      if (fits(x, y, sw, sh, ok)) return put(id, x, y, rot, extra);
    }
    return false;
  };
  const noise = (sc, seed) => {
    const gw = Math.ceil(W / sc) + 2,
      gh = Math.ceil(H / sc) + 2,
      G2 = [];
    const r2 = rng(o.seed + seed);
    for (let i = 0; i < gw * gh; i++) G2.push(r2());
    return (x, y) => {
      const fx = x / sc,
        fy = y / sc,
        x0 = Math.floor(fx),
        y0 = Math.floor(fy),
        tx = fx - x0,
        ty = fy - y0,
        g = (a, b) => G2[b * gw + a],
        s = t => t * t * (3 - 2 * t);
      const a = g(x0, y0) + (g(x0 + 1, y0) - g(x0, y0)) * s(tx),
        b = g(x0, y0 + 1) + (g(x0 + 1, y0 + 1) - g(x0, y0 + 1)) * s(tx);
      return a + (b - a) * s(ty);
    };
  };
  const nearT = (x, y, v, r) => {
    for (let b = -r; b <= r; b++) for (let a = -r; a <= r; a++) if (at(x + a, y + b) === v) return true;
    return false;
  };
  const path = (x0, y0, dx, dy, wid, v, wig = 1.2) => {
    // caminho que serpenteia até a borda
    let x = x0,
      y = y0,
      drift = 0;
    const out = [];
    for (let k = 0; k < 400 && inb(x, y); k++) {
      for (let j = 0; j < wid; j++) set(x + (dy ? j : 0), y + (dx ? j : 0), v);
      out.push([x, y]);
      x += dx;
      y += dy;
      drift += (R() - 0.5) * wig;
      drift *= 0.85;
      if (Math.abs(drift) > 0.7) {
        const s = Math.sign(drift);
        if (dx) y += s;
        else x += s;
        drift = 0;
        for (let j = 0; j < wid; j++) set(x + (dy ? j : 0), y + (dx ? j : 0), v);
      }
    }
    return out;
  };
  const blob = (cx, cy, r, v) => {
    const n = noise(3, 77 + cx);
    for (let y = cy - r - 2; y <= cy + r + 2; y++)
      for (let x = cx - r - 2; x <= cx + r + 2; x++)
        if (Math.hypot(x - cx, y - cy) <= r * (0.75 + n(x, y) * 0.5)) set(x, y, v);
  };
  const grass = (x, y) => at(x, y) === 3 || at(x, y) === 8;
  const U = G().unit || 1;
  let start = [1, H >> 1];
  // ---- paredes de uma construção com cômodos (casa, taverna, mausoléu) ----
  const building = (bx, by, bw, bh, kind, frontDoor = true) => {
    for (let y = by; y < by + bh; y++) for (let x = bx; x < bx + bw; x++) set(x, y, 6);
    const rs = [{ x: bx, y: by, w: bw, h: bh }],
      parts = [],
      minR = kind === "mausoleu" ? 99 : kind === "casa" || kind === "loja" ? 4 : 5;
    for (let guard = 0; guard < 20; guard++) {
      rs.sort((a, b) => b.w * b.h - a.w * a.h);
      const r = rs[0];
      if (
        rs.length >= ({ taverna: 6, casa: 4, mansao: 9, loja: 3, mausoleu: 1 }[kind] || 4) ||
        Math.max(r.w, r.h) < minR * 2
      )
        break;
      rs.shift();
      const vert = r.w > r.h ? true : r.h > r.w ? false : R() < 0.5;
      const big = kind === "taverna" && parts.length === 0 ? 0.62 : 0.4 + R() * 0.2;
      if (vert) {
        const cx = r.x + Math.max(minR, Math.min(r.w - minR, Math.round(r.w * big)));
        rs.push({ x: r.x, y: r.y, w: cx - r.x, h: r.h }, { x: cx, y: r.y, w: r.x + r.w - cx, h: r.h });
        parts.push({ v: 1, at: cx, a: r.y, b: r.y + r.h });
      } else {
        const cy = r.y + Math.max(minR, Math.min(r.h - minR, Math.round(r.h * big)));
        rs.push({ x: r.x, y: r.y, w: r.w, h: cy - r.y }, { x: r.x, y: cy, w: r.w, h: r.y + r.h - cy });
        parts.push({ v: 0, at: cy, a: r.x, b: r.x + r.w });
      }
    }
    // paredes internas com uma porta cada
    for (const p of parts) {
      const dpos = ri(p.a + 1, p.b - 2);
      for (let k = p.a; k < p.b; k++) {
        const s = p.v ? [p.at, k, p.at, k + 1] : [k, p.at, k + 1, p.at];
        if (k === dpos) doors.push([...s, 0]);
        else walls.push(s);
      }
    }
    // perímetro com porta da frente (embaixo)
    const fx = ri(bx + 2, bx + bw - 3);
    for (let x = bx; x < bx + bw; x++) {
      walls.push([x, by, x + 1, by]);
      if (frontDoor && x === fx) doors.push([x, by + bh, x + 1, by + bh, 0]);
      else walls.push([x, by + bh, x + 1, by + bh]);
    }
    for (let y = by; y < by + bh; y++) {
      walls.push([bx, y, bx, y + 1]);
      walls.push([bx + bw, y, bx + bw, y + 1]);
    }
    // nada encosta nas portas
    for (const d of doors) {
      const hz = d[1] === d[3];
      for (const [x, y] of hz
        ? [
            [d[0], d[1] - 1],
            [d[0], d[1]],
          ]
        : [
            [d[0] - 1, d[1]],
            [d[0], d[1]],
          ])
        if (inb(x, y)) occ[y * W + x] = 1;
    }
    rs.sort((a, b) => b.w * b.h - a.w * a.h);
    return { rs, front: [fx, by + bh] };
  };
  const furnish = (r, type, deco) => {
    // mobília por tipo de cômodo
    const inR = (x, y) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h,
      box = [r.x, r.y, r.x + r.w, r.y + r.h];
    const wallPut = id => {
      const a = A(id);
      if (!a) return;
      for (let k = 0; k < 30; k++) {
        const side = ri(0, 3),
          rot = [0, 90, 180, 270][side],
          sw = rot % 180 ? a.h : a.w,
          sh = rot % 180 ? a.w : a.h;
        const x = side === 0 || side === 2 ? ri(r.x, r.x + r.w - sw) : side === 1 ? r.x + r.w - sw : r.x,
          y = side === 1 || side === 3 ? ri(r.y, r.y + r.h - sh) : side === 0 ? r.y : r.y + r.h - sh;
        if (fits(x, y, sw, sh, inR)) {
          put(id, x, y, rot);
          return;
        }
      }
    };
    const L = {
      salao: {
        wall: ["balcao", "lareira", "barris-pilha", "prateleira"],
        mid: [
          "mesa-redonda",
          "mesa-redonda",
          "mesa-redonda",
          "mesa",
          "banquinho",
          "banquinho",
          "banquinho",
          "banquinho",
          "banco",
        ],
      },
      sala: {
        wall: ["lareira", "estante", "armario"],
        mid: ["mesa", "cadeira", "cadeira", "tapete-redondo", "banquinho"],
      },
      jantar: {
        wall: ["armario", "lareira"],
        mid: ["mesa", "cadeira", "cadeira", "cadeira", "cadeira", "candelabro"],
      },
      cozinha: {
        wall: ["prateleira", "lareira", "bancada"],
        mid: ["caldeirao", "mesa", "barril", "sacos", "balde", "lenha"],
      },
      quarto: {
        wall: [pick(["cama", "cama-casal", "beliche"]), "armario", "bau"],
        mid: ["tapete-redondo", "banquinho", "velas"],
      },
      deposito: {
        wall: ["prateleira", "barris-pilha"],
        mid: ["caixas", "caixa", "barril", "sacos", "saco", "pilha-caixotes", "feno"],
      },
      biblioteca: {
        wall: ["estante", "estante", "estante"],
        mid: ["escrivaninha", "cadeira", "livros", "pergaminho", "candelabro"],
      },
      escritorio: { wall: ["estante", "bau"], mid: ["escrivaninha", "cadeira", "mapa-mesa", "tapete"] },
      capela: { wall: ["altar", "estatua"], mid: ["banco", "banco", "velas", "candelabro"] },
      loja: {
        wall: ["balcao", "prateleira", "prateleira", "armas"],
        mid: ["barril", "caixas", "sacos", "escudo"],
      },
      mausoleu: { wall: ["estatua"], mid: ["sarcofago", "velas", "velas", "ossos"] },
    }[type] || { wall: [], mid: [] };
    for (const id of L.wall) wallPut(id);
    const n = Math.round(L.mid.length * ({ none: 0, few: 0.45, normal: 0.8, lots: 1.3 }[deco] ?? 0.8));
    for (let i = 0; i < n; i++) tryPut(L.mid[i % L.mid.length], inR, box, 40);
    if (o.torches && type !== "salao" && type !== "capela" && r.w * r.h > 12)
      tryPut("candelabro", inR, box, 30);
  };
  if (st === "forest") {
    const nz = noise(6, 3);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (nz(x, y) > 0.55) set(x, y, 8);
    const y0 = ri(Math.round(H * 0.3), Math.round(H * 0.7)),
      main = path(0, y0, 1, 0, 2, 4, 1.4);
    start = [0, y0];
    if (R() < 0.7) {
      const [bx] = main[ri(Math.round(main.length * 0.3), Math.round(main.length * 0.7))];
      path(bx, main.find(p => p[0] === bx)[1], 0, R() < 0.5 ? -1 : 1, 2, 4, 1.4);
    }
    if (o.pond) {
      for (let k = 0; k < 40; k++) {
        const cx = ri(6, W - 7),
          cy = ri(5, H - 6);
        if (!nearT(cx, cy, 4, 6)) {
          blob(cx, cy, ri(3, 5), 5);
          break;
        }
      }
    }
    // clareira
    let clr = null;
    if (o.clear !== "none")
      for (let k = 0; k < 60; k++) {
        const cx = ri(7, W - 8),
          cy = ri(6, H - 7);
        if (!nearT(cx, cy, 5, 5) && nearT(cx, cy, 4, 8) && !nearT(cx, cy, 4, 2)) {
          clr = [cx, cy];
          for (let y = cy - 4; y <= cy + 4; y++)
            for (let x = cx - 4; x <= cx + 4; x++)
              if (Math.hypot(x - cx, y - cy) <= 4.3 && at(x, y) !== 4) set(x, y, 3);
          break;
        }
      }
    if (clr) {
      const [cx, cy] = clr,
        near = (x, y) => Math.hypot(x - cx, y - cy) <= 4.3,
        box = [cx - 4, cy - 4, cx + 5, cy + 5];
      if (o.clear === "camp") {
        put("fogueira", cx, cy);
        tryPut("tenda", near, box);
        tryPut("tenda-azul", near, box);
        tryPut("saco-dormir", near, box);
        tryPut("saco-dormir", near, box);
        tryPut("lenha", near, box);
        tryPut("mochila", near, box);
        tryPut("panela-fogo", near, box);
      } else {
        tryPut("ruina", near, box, 60);
        tryPut("pilar-quebrado", near, box);
        tryPut("pilar-quebrado", near, box);
        tryPut("estatua", near, box);
        tryPut("escombros", near, box);
        tryPut("circulo-ritual", near, box, 20);
      }
      for (let y = cy - 5; y <= cy + 5; y++)
        for (let x = cx - 5; x <= cx + 5; x++)
          if (inb(x, y) && Math.hypot(x - cx, y - cy) <= 5) occ[y * W + x] = 1;
    }
    // bloqueia a água e o caminho para árvores
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) if (at(x, y) === 5 || at(x, y) === 4) occ[y * W + x] = 1;
    const trees = {
      verao: ["arvore", "arvore", "arvore", "pinheiro", "pinheiro", "arvore-grande", "arvore-frutas"],
      outono: ["arvore-outono", "arvore-outono", "arvore-outono", "pinheiro", "arvore", "arvore-grande"],
      sombria: ["arvore-sombria", "arvore-sombria", "arvore-morta", "pinheiro", "arvore-morta"],
    }[o.season] || ["arvore", "pinheiro"];
    const dens = { few: 0.035, normal: 0.06, dense: 0.095 }[o.dens] ?? 0.06;
    const cells = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) cells.push([x, y]);
    for (const [x, y] of cells.sort(() => R() - 0.5)) {
      const dk = at(x, y) === 8 ? 1.7 : 1;
      if (R() < dens * dk) {
        const id = pick(trees),
          a = A(id);
        if (a && fits(x, y, a.w, a.h, (p, q) => !nearT(p, q, 4, 0)))
          put(id, x, y, pick([0, 90, 180, 270]), o.treeBlk ? {} : { noblk: 1 });
      } else if (R() < 0.05) {
        const id = pick([
            "arbusto",
            "moita",
            "moita",
            "flores",
            "pedra",
            "toco",
            "cogumelos",
            "galhos",
            "pedra-musgo",
            "rochas",
            "tronco",
          ]),
          a = A(id);
        if (a && fits(x, y, a.w, a.h)) put(id, x, y, pick([0, 90, 180, 270]));
      }
    }
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (at(x, y) === 5 && R() < 0.06 && !occ[y * W + x]) put("nenufares", x, y, 0);
    if (o.animals)
      for (const id of ["cervo", "corvo", "coruja", pick(["lobo", "javali", "urso", "cervo"])])
        tryPut(id, grass, [0, 0, W, H], 60);
  } else if (st === "village") {
    const big = W * H > 2600,
      road = big ? 7 : 4,
      cy = ri(Math.round(H * 0.4), Math.round(H * 0.6));
    path(0, cy - 1, 1, 0, 3, road, 0.3);
    start = [0, cy];
    const cx = ri(Math.round(W * 0.35), Math.round(W * 0.65));
    path(cx, 0, 0, 1, 2, road, 0.5);
    if (big) path(ri(Math.round(W * 0.7), W - 8), cy, 0, R() < 0.5 ? -1 : 1, 2, road, 0.5);
    // praça
    for (let y = cy - 5; y <= cy + 5; y++) for (let x = cx - 5; x <= cx + 6; x++) set(x, y, 7);
    put(big ? "fonte" : "poco", big ? cx - 1 : cx, big ? cy - 1 : cy);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) if (at(x, y) === 4 || at(x, y) === 7) occ[y * W + x] = 1;
    const plaza = (x, y) => x >= cx - 5 && x <= cx + 6 && y >= cy - 5 && y <= cy + 5;
    for (let y = cy - 5; y <= cy + 5; y++)
      for (let x = cx - 5; x <= cx + 6; x++)
        if (inb(x, y) && !(Math.abs(x - cx) < 2 && Math.abs(y - cy) < 2)) occ[y * W + x] = 0;
    if (o.market)
      for (let i = 0; i < 4; i++)
        tryPut(pick(["barraca", "barraca-azul"]), plaza, [cx - 5, cy - 5, cx + 7, cy + 6], 30, [0]);
    tryPut("carrinho-mao", plaza, [cx - 5, cy - 5, cx + 7, cy + 6]);
    tryPut("barris-pilha", plaza, [cx - 5, cy - 5, cx + 7, cy + 6]);
    tryPut("banco-praca", plaza, [cx - 5, cy - 5, cx + 7, cy + 6], 30, [0, 90]);
    for (let y = cy - 5; y <= cy + 5; y++)
      for (let x = cx - 5; x <= cx + 6; x++) if (inb(x, y)) occ[y * W + x] = 1;
    // casas ao longo das ruas (1 casa de distância da rua)
    const houseIds = ["casa", "casa", "casa-palha", "casa-palha", "casa-madeira", "casa-grande"],
      special = ["igreja", "estabulo", "moinho"];
    let placed = 0;
    const wantHouses = o.houses | 0;
    const roadNear = (x, y, w, h) => {
      for (let b = y - 2; b < y + h + 2; b++)
        for (let a = x - 2; a < x + w + 2; a++) if (at(a, b) === road || at(a, b) === 7) return true;
      return false;
    };
    const roadTouch = (x, y, w, h) => {
      for (let b = y - 1; b < y + h + 1; b++)
        for (let a = x - 1; a < x + w + 1; a++) if (at(a, b) === road || at(a, b) === 7) return true;
      return false;
    };
    for (const id of special.concat(
      Array(60)
        .fill(0)
        .map(() => pick(houseIds)),
    )) {
      if (placed >= wantHouses + special.length) break;
      const a = A(id);
      if (!a) continue;
      for (let k = 0; k < 80; k++) {
        const rot = pick([0, 90]),
          sw = rot ? a.h : a.w,
          sh = rot ? a.w : a.h,
          x = ri(1, W - sw - 1),
          y = ri(1, H - sh - 1);
        if (fits(x - 1, y - 1, sw + 2, sh + 2) && roadNear(x, y, sw, sh) && !roadTouch(x, y, sw, sh)) {
          put(id, x, y, rot);
          placed++;
          // quintal
          const yard = [x - 2, y - 2, x + sw + 2, y + sh + 2];
          if (id === "estabulo") {
            tryPut("cavalo", grass, yard, 30);
            tryPut("cavalo-selado", grass, yard, 30);
            tryPut("feno", grass, yard);
            tryPut("cocho", grass, yard);
          } else if (R() < 0.7)
            tryPut(
              pick([
                "barril",
                "caixa",
                "vasos-flor",
                "feno",
                "lenha",
                "carroca",
                "cerca",
                "sacos",
                "arvore-frutas",
              ]),
              grass,
              yard,
              20,
            );
          break;
        }
      }
    }
    const fr = [cx + 7, cy - 1, cx + 12, cy + 4];
    tryPut("forja", grass, fr, 30);
    tryPut("bigorna", grass, fr);
    if (o.fields)
      for (let f = 0; f < (big ? 3 : 2); f++) {
        for (let k = 0; k < 60; k++) {
          const fw = ri(3, 4) * 2,
            fh = ri(2, 3) * 2,
            x = ri(1, W - fw - 1),
            y = ri(1, H - fh - 1);
          if (fits(x - 1, y - 1, fw + 2, fh + 2, (p, q) => at(p, q) === 3)) {
            for (let b = y; b < y + fh; b++) for (let a = x; a < x + fw; a++) set(a, b, 9);
            const crop = pick(["plantacao", "trigo"]);
            for (let b = y; b < y + fh; b += 2) for (let a = x; a < x + fw; a += 2) put(crop, a, b);
            for (let a = x; a < x + fw; a += 2) {
              if (fits(a, y - 1, 2, 1)) put("cerca", a, y - 1);
              if (fits(a, y + fh, 2, 1)) put("cerca", a, y + fh);
            }
            break;
          }
        }
      }
    for (const id of ["vaca", "porco", "galinha", "galinha", "ovelha", "cachorro", "gato"])
      if (R() < 0.7) tryPut(id, grass, [0, 0, W, H], 40);
    for (let i = 0; i < (W * H) / 90; i++)
      tryPut(
        pick(["arvore", "arvore", "pinheiro", "arbusto", "arvore-frutas", "flores", "pedra"]),
        grass,
        [0, 0, W, H],
        10,
        undefined,
        { noblk: 1 },
      );
    tryPut("poste", (x, y) => at(x, y) === 3, [cx - 7, cy - 7, cx + 9, cy + 8], 40);
  } else if (st === "interior") {
    const [bw, bh] = IK[o.ikind] || IK.taverna,
      bx = 4,
      by = 3,
      kind = o.ikind || "taverna";
    const B = building(bx, by, bw, bh, kind);
    const types = {
      taverna: ["salao", "cozinha", "deposito", "quarto", "quarto", "quarto"],
      casa: ["sala", "cozinha", "quarto", "quarto"],
      mansao: [
        "sala",
        "jantar",
        "biblioteca",
        "cozinha",
        "quarto",
        "quarto",
        "escritorio",
        "capela",
        "deposito",
      ],
      loja: ["loja", "deposito", "quarto"],
    }[kind] || ["sala"];
    B.rs.forEach((r, i) => {
      const ty = types[Math.min(i, types.length - 1)];
      rooms.push({ ...r, type: ty });
      furnish(r, ty, o.deco);
    });
    // caminho da porta até a borda de baixo
    const [fx, fy] = B.front;
    for (let y = fy; y < H; y++) {
      set(fx, y, 4);
      set(fx + 1, y, 4);
    }
    start = [fx, H - 2];
    const out = (x, y) => at(x, y) === 3;
    for (let i = 0; i < (W * H) / 45; i++)
      tryPut(
        pick(["arvore", "arbusto", "flores", "barril", "pedra", "moita"]),
        out,
        [0, 0, W, H],
        10,
        undefined,
        { noblk: 1 },
      );
    tryPut("poste", (x, y) => out(x, y) && Math.abs(x - fx) < 3, [fx - 3, fy, fx + 4, fy + 3], 30);
    if (kind === "taverna") {
      tryPut("cocho", out, [0, fy, W, H]);
      tryPut("carroca", out, [0, fy, W, H]);
      tryPut("cavalo", out, [0, fy, W, H]);
    }
  } else if (st === "cemetery") {
    const cx = W >> 1,
      cy = H >> 1;
    for (let x = 1; x < W - 1; x++) {
      set(x, cy, 4);
      set(x, cy + 1, 4);
    }
    for (let y = 1; y < H - 1; y++) {
      set(cx, y, 4);
      set(cx + 1, y, 4);
    }
    start = [cx, H - 2];
    for (let y = cy + 1; y < H; y++) {
      set(cx, y, 4);
      set(cx + 1, y, 4);
    }
    // cerca em volta com portão embaixo
    for (let x = 0; x < W - 1; x += 2) {
      if (fits(x, 0, 2, 1)) put("muro-madeira", x, 0);
      if (!(x >= cx - 1 && x <= cx + 1) && fits(x, H - 1, 2, 1)) put("muro-madeira", x, H - 1, 180);
    }
    for (let y = 1; y < H - 2; y += 2) {
      if (fits(0, y, 1, 2)) put("muro-madeira", 0, y, 270);
      if (fits(W - 1, y, 1, 2)) put("muro-madeira", W - 1, y, 90);
    }
    tryPut("poste", () => true, [cx - 3, H - 3, cx - 1, H - 1], 10);
    tryPut("poste", () => true, [cx + 2, H - 3, cx + 4, H - 1], 10);
    if (o.mauso) {
      const q = [
          [3, 3],
          [W - 11, 3],
          [3, H - 10],
          [W - 11, H - 10],
        ][ri(0, 3)],
        B = building(q[0], q[1], 7, 5, "mausoleu");
      rooms.push({ ...B.rs[0], type: "mausoleu" });
      furnish(B.rs[0], "mausoleu", "normal");
    }
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) if (at(x, y) === 4 || at(x, y) === 6) occ[y * W + x] = 1;
    const gap = { few: 4, normal: 3, lots: 2 }[o.graves] ?? 3;
    for (let y = 3; y < H - 3; y += gap)
      for (let x = 3 + (y % 2); x < W - 3; x += 3)
        if (R() < 0.7 && fits(x, y, 1, 1, grass)) {
          const r0 = R();
          put(r0 < 0.05 ? "buraco" : r0 < 0.065 ? "caixao" : "lapide", x, y, 0);
          if (R() < 0.08)
            tryPut(pick(["velas", "flores", "ossos", "sangue"]), grass, [x - 1, y, x + 2, y + 2], 6);
        }
    for (let i = 0; i < (W * H) / 110; i++)
      tryPut(
        pick(["arvore-morta", "arvore-sombria", "arvore-morta"]),
        grass,
        [1, 1, W - 1, H - 1],
        20,
        undefined,
        { noblk: 1 },
      );
    for (const id of ["corvo", "corvo", "coruja", "gato"]) tryPut(id, grass, [1, 1, W - 1, H - 1], 30);
    if (o.torches) for (let i = 0; i < 4; i++) tryPut("lanterna", grass, [1, 1, W - 1, H - 1], 30);
  }
  let t = "";
  for (let i = 0; i < W * H; i++) t += T[i];
  const dmerge = doors.map(d => d); // portas já são segmentos de 1 casa
  return {
    w: W,
    h: H,
    t,
    style: st,
    walls: mergeSegs(walls),
    iw: walls,
    doors: dmerge,
    props,
    rooms,
    start,
    end: null,
  };
}
function renderOutdoor(g, S, cvIn) {
  const W = g.w,
    H = g.h,
    cvx = cvIn || document.createElement("canvas");
  cvx.width = Math.ceil(W * S);
  cvx.height = Math.ceil(H * S);
  const x = cvx.getContext("2d"),
    at = (a, b) => (a < 0 || b < 0 || a >= W || b >= H ? -1 : +g.t[b * W + a]);
  const COL = {
    3: [86, 116, 58],
    8: [58, 84, 44],
    4: [128, 102, 70],
    5: [48, 104, 134],
    6: [138, 104, 66],
    7: [122, 117, 106],
    9: [104, 78, 48],
  };
  const base = COL[g.style === "cemetery" ? 8 : 3];
  x.fillStyle = `rgb(${base})`;
  x.fillRect(0, 0, cvx.width, cvx.height);
  for (const layer of [3, 8, 9, 4, 7, 5, 6])
    for (let b = 0; b < H; b++)
      for (let a = 0; a < W; a++) {
        if (at(a, b) !== layer) continue;
        const h = hash2(a, b),
          k = 0.9 + h * 0.16,
          c = COL[layer].map(v => Math.round(v * k)).join(",");
        x.fillStyle = `rgb(${c})`;
        if (layer === 6) {
          x.fillRect(a * S, b * S, S, S);
          continue;
        }
        x.beginPath();
        x.arc((a + 0.5) * S, (b + 0.5) * S, S * (layer === 3 || layer === 8 ? 0.85 : 0.74), 0, Math.PI * 2);
        x.fill();
        x.fillRect(a * S + S * 0.12, b * S + S * 0.12, S * 0.76, S * 0.76);
      }
  // detalhes
  for (let b = 0; b < H; b++)
    for (let a = 0; a < W; a++) {
      const v = at(a, b),
        h = hash2(a, b, 5),
        px = a * S,
        py = b * S;
      if (v === 3 || v === 8) {
        x.strokeStyle = v === 3 ? "rgba(140,180,90,.45)" : "rgba(100,130,70,.4)";
        x.lineWidth = Math.max(1, S * 0.04);
        x.beginPath();
        for (let i = 0; i < 3; i++) {
          const u = hash2(a, b, 20 + i),
            w2 = hash2(a, b, 30 + i);
          x.moveTo(px + u * S, py + w2 * S);
          x.lineTo(px + u * S + S * 0.05, py + w2 * S - S * 0.14);
        }
        x.stroke();
        if (v === 8 && h < 0.3) {
          x.fillStyle = "rgba(120,90,40,.35)";
          x.beginPath();
          x.arc(px + hash2(a, b, 8) * S, py + hash2(a, b, 9) * S, S * 0.08, 0, 7);
          x.fill();
        }
      } else if (v === 4) {
        if (h < 0.4) {
          x.fillStyle = "rgba(80,60,40,.35)";
          x.beginPath();
          x.arc(px + hash2(a, b, 8) * S, py + hash2(a, b, 9) * S, S * 0.06, 0, 7);
          x.fill();
        }
      } else if (v === 5) {
        x.strokeStyle = "rgba(170,215,235,.35)";
        x.lineWidth = Math.max(1, S * 0.04);
        if (h < 0.35) {
          x.beginPath();
          x.arc(px + S * 0.5, py + S * 0.6, S * 0.25, Math.PI * 1.15, Math.PI * 1.85);
          x.stroke();
        }
      } else if (v === 6) {
        x.strokeStyle = "rgba(60,40,20,.45)";
        x.lineWidth = Math.max(1, S * 0.03);
        x.beginPath();
        for (const f of [0.33, 0.66]) {
          x.moveTo(px, py + S * f);
          x.lineTo(px + S, py + S * f);
        }
        const off = (b % 2) * 0.5;
        x.moveTo(px + S * off, py);
        x.lineTo(px + S * off, py + S * 0.33);
        x.stroke();
      } else if (v === 7) {
        x.strokeStyle = "rgba(60,56,50,.5)";
        x.lineWidth = Math.max(1, S * 0.035);
        for (const [u, w2, r] of [
          [0.28, 0.28, 0.2],
          [0.72, 0.3, 0.18],
          [0.3, 0.72, 0.18],
          [0.72, 0.72, 0.2],
        ]) {
          x.beginPath();
          x.arc(px + u * S, py + w2 * S, r * S, 0, 7);
          x.stroke();
        }
      } else if (v === 9) {
        x.strokeStyle = "rgba(60,40,20,.5)";
        x.lineWidth = Math.max(1, S * 0.05);
        x.beginPath();
        for (const f of [0.25, 0.75]) {
          x.moveTo(px, py + S * f);
          x.lineTo(px + S, py + S * f);
        }
        x.stroke();
      }
    }
  // margem da água
  x.strokeStyle = "rgba(30,50,40,.5)";
  x.lineWidth = Math.max(1, S * 0.06);
  for (let b = 0; b < H; b++)
    for (let a = 0; a < W; a++)
      if (at(a, b) === 5)
        for (const [dx, dy, s] of [
          [0, -1, [a, b, a + 1, b]],
          [0, 1, [a, b + 1, a + 1, b + 1]],
          [-1, 0, [a, b, a, b + 1]],
          [1, 0, [a + 1, b, a + 1, b + 1]],
        ])
          if (at(a + dx, b + dy) !== 5 && at(a + dx, b + dy) !== -1) {
            x.beginPath();
            x.moveTo(s[0] * S, s[1] * S);
            x.lineTo(s[2] * S, s[3] * S);
            x.stroke();
          }
  // paredes das construções
  const segs = g.iw || [];
  if (segs.length) {
    x.lineCap = "square";
    x.beginPath();
    for (const s of segs) {
      x.moveTo(s[0] * S, s[1] * S);
      x.lineTo(s[2] * S, s[3] * S);
    }
    x.strokeStyle = "rgba(0,0,0,.35)";
    x.lineWidth = S * 0.42;
    x.stroke();
    x.strokeStyle = "#3a2c20";
    x.lineWidth = S * 0.28;
    x.stroke();
    x.strokeStyle = "#7a6048";
    x.lineWidth = S * 0.09;
    x.stroke();
  }
  return cvx;
}
function genOptionsHTML(o, num) {
  // opções do painel para cada tipo de cenário
  const sel = (id, label, opts, v) =>
    `<label class="gnum"><span>${label}</span><select id="${id}">${opts.map(([k, l]) => `<option value="${k}" ${String(v) === String(k) ? "selected" : ""}>${l}</option>`).join("")}</select></label>`;
  const chk = (id, label, v) =>
    `<label class="chk"><input type="checkbox" id="${id}" ${v ? "checked" : ""}> ${label}</label>`;
  const size = num("gW", "Largura", o.w, 20, 160, "casas") + num("gH", "Altura", o.h, 16, 160, "casas");
  const deco = sel(
    "gDeco",
    "Decoração",
    [
      ["none", "Nenhuma"],
      ["few", "Pouca"],
      ["normal", "Normal"],
      ["lots", "Muita"],
    ],
    o.deco,
  );
  switch (o.style) {
    case "forest":
      return `<div class="ggrid">${size}${sel(
        "gDens",
        "Árvores",
        [
          ["few", "Poucas"],
          ["normal", "Normal"],
          ["dense", "Mata fechada"],
        ],
        o.dens,
      )}${sel(
        "gSeason",
        "Estação",
        [
          ["verao", "Verão"],
          ["outono", "Outono"],
          ["sombria", "Sombria"],
        ],
        o.season,
      )}${sel(
        "gClear",
        "Clareira",
        [
          ["none", "Nenhuma"],
          ["camp", "Acampamento"],
          ["ruins", "Ruínas"],
        ],
        o.clear,
      )}</div>
      ${chk("gPond", "Lago", o.pond)}${chk("gAnimals", "Animais", o.animals)}${chk("gTreeBlk", "Árvores tapam a visão (mais pesado)", o.treeBlk)}`;
    case "village":
      return `<div class="ggrid">${size}${num("gHouses", "Casas", o.houses, 2, 40)}</div>${chk("gMarket", "Feira na praça", o.market)}${chk("gFields", "Plantações", o.fields)}<p class="hint">Mapas grandes (mais de ~2600 casas) viram cidade, com ruas de pedra e fonte.</p>`;
    case "interior":
      return `<div class="ggrid">${sel(
        "gIkind",
        "Tipo",
        [
          ["taverna", "Taverna"],
          ["casa", "Casa"],
          ["loja", "Loja / ferreiro"],
          ["mansao", "Mansão"],
        ],
        o.ikind,
      )}${deco}</div>${chk("gTorch", "Candelabros e lareiras (iluminam)", o.torches)}`;
    case "cemetery":
      return `<div class="ggrid">${size}${sel(
        "gGraves",
        "Túmulos",
        [
          ["few", "Poucos"],
          ["normal", "Normal"],
          ["lots", "Muitos"],
        ],
        o.graves,
      )}</div>${chk("gMauso", "Mausoléu (com porta e sarcófago)", o.mauso)}${chk("gTorch", "Lanternas (iluminam)", o.torches)}`;
  }
  return null;
}

// ---------- masmorra rolada: vai sendo criada enquanto os jogadores exploram ----------
const RT_CONTENT = [
  [3, "corredor", "Corredor"],
  [7, "vazia", "Sala vazia"],
  [10, "obst", "Sala com obstáculo"],
  [13, "armad", "Armadilha"],
  [16, "inim", "Inimigos"],
  [18, "npc", "NPC"],
  [19, "tesouro", "Tesouro"],
  [20, "evento", "Evento especial"],
];
const RT_SHAPES = [
  "Pequena quadrada",
  "Grande quadrada",
  "Retangular",
  "Circular",
  "Octogonal",
  "Longa e estreita",
  "Sala em L",
  "Sala com pilares",
  "Sala com desnível",
  "Sala dividida em duas partes",
  "Sala irregular",
  "Câmara enorme",
];
const RT_ENC = [
  [4, "1–2 inimigos fracos"],
  [8, "Grupo de inimigos"],
  [11, "Inimigos + armadilha"],
  [14, "Monstro forte"],
  [16, "Grupo + líder"],
  [18, "Monstro especial"],
  [19, "Mini-chefe"],
  [20, "Encontro mortal / chefe"],
];
const RT_TRE = [
  [5, "Nada"],
  [10, "Moedas"],
  [14, "Poção / consumível"],
  [17, "Item mágico comum"],
  [19, "Item mágico incomum"],
  [20, "Item especial + moedas"],
];
const RT_TRAPS = [
  "Placa de pressão que dispara dardos",
  "Fosso escondido sob lajotas soltas",
  "Lâmina pendular no teto",
  "Gás venenoso ao abrir a porta",
  "Parte do teto desaba",
  "Runa que explode em chamas",
  "Rede que cai do teto",
];
const RT_NPC = [
  "Prisioneiro acorrentado pedindo ajuda",
  "Aventureiro perdido e ferido",
  "Goblin que quer negociar",
  "Ermitão louco que sabe um segredo",
  "Fantasma de um antigo guarda",
  "Mercador escondido com itens raros",
  "Criança perdida (ou será uma ilusão?)",
];
const RT_EVENT = [
  "Um altar pulsa com energia estranha",
  "Uma voz ecoa pelas paredes pedindo ajuda",
  "O chão treme e parte do teto desaba",
  "Uma estátua fala um enigma",
  "Um portal cintila por alguns segundos",
  "Um espírito aparece e oferece um acordo",
  "As tochas se apagam todas de uma vez",
  "Uma inscrição antiga revela parte do mapa",
];
const RT_OBST = [
  "Escombros bloqueiam parte da sala",
  "Um buraco profundo no meio do caminho",
  "Água até a cintura cobre o chão",
  "Estalagmites afiadas por toda parte",
  "Uma jaula enorme ocupa a sala",
];
const rd = n => 1 + Math.floor(Math.random() * n);
const lookup = (T, r) => T.find(x => r <= x[0]);
const DIRS = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ],
  DIRN = ["norte", "leste", "sul", "oeste"];
const shuffle = a => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
let rollSel = null,
  rollLast = null;
const rollChoice = { content: "roll", shape: "roll", exits: "roll" };
function shapeMask(k, dir) {
  const m = [],
    meta = { pil: [], iw: [], idr: [], st: [] };
  let w = 0,
    h = 0;
  const rect = (W, H) => {
    w = W;
    h = H;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) m.push([x, y]);
  };
  const vert = dir % 2 === 0;
  switch (k) {
    case 0:
      rect(4, 4);
      break;
    case 1:
      rect(7, 7);
      break;
    case 2:
      Math.random() < 0.5 ? rect(5, 8) : rect(8, 5);
      break;
    case 3:
      w = h = 8;
      for (let y = 0; y < 8; y++)
        for (let x = 0; x < 8; x++) if (Math.hypot(x + 0.5 - 4, y + 0.5 - 4) <= 4.05) m.push([x, y]);
      break;
    case 4:
      w = h = 8;
      for (let y = 0; y < 8; y++)
        for (let x = 0; x < 8; x++) if (Math.min(x, 7 - x) + Math.min(y, 7 - y) >= 2) m.push([x, y]);
      break;
    case 5:
      vert ? rect(2, 10) : rect(10, 2);
      break;
    case 6: {
      rect(8, 8);
      const qx = Math.random() < 0.5 ? 0 : 4,
        qy = Math.random() < 0.5 ? 0 : 4;
      for (let i = m.length - 1; i >= 0; i--) {
        const [x, y] = m[i];
        if (x >= qx && x < qx + 4 && y >= qy && y < qy + 4) m.splice(i, 1);
      }
      break;
    }
    case 7:
      rect(8, 8);
      meta.pil = [
        [2, 2],
        [5, 2],
        [2, 5],
        [5, 5],
      ];
      break;
    case 8:
      if (vert) {
        rect(7, 8);
        meta.st = [
          [1, 3, 0],
          [3, 3, 0],
          [5, 3, 0],
        ];
      } else {
        rect(8, 7);
        meta.st = [
          [3, 1, 90],
          [3, 3, 90],
          [3, 5, 90],
        ];
      }
      break;
    case 9: {
      if (vert) {
        rect(6, 9);
        const g = 1 + Math.floor(Math.random() * 4);
        meta.iw = [
          [0, 4, g, 4],
          [g + 1, 4, 6, 4],
        ];
        meta.idr = [[g, 4, g + 1, 4]];
      } else {
        rect(9, 6);
        const g = 1 + Math.floor(Math.random() * 4);
        meta.iw = [
          [4, 0, 4, g],
          [4, g + 1, 4, 6],
        ];
        meta.idr = [[4, g, 4, g + 1]];
      }
      break;
    }
    case 10: {
      w = h = 9;
      const S = new Set(["4,4"]),
        fr = [[4, 4]];
      while (S.size < 40) {
        const [x, y] = fr[Math.floor(Math.random() * fr.length)],
          [dx, dy] = DIRS[Math.floor(Math.random() * 4)],
          nx = x + dx,
          ny = y + dy;
        if (nx < 0 || ny < 0 || nx > 8 || ny > 8 || S.has(nx + "," + ny)) continue;
        S.add(nx + "," + ny);
        fr.push([nx, ny]);
      }
      for (const k2 of S) m.push(k2.split(",").map(Number));
      break;
    }
    case 11:
      rect(12, 12);
      break;
  }
  return { w, h, m, meta };
}
function rollEdge(c, dd) {
  const [x, y] = c;
  return dd === 0
    ? [x, y, x + 1, y]
    : dd === 1
      ? [x + 1, y, x + 1, y + 1]
      : dd === 2
        ? [x, y + 1, x + 1, y + 1]
        : [x, y, x, y + 1];
}
function rollRebuild() {
  // paredes, portas e o desenho do chão a partir do estado da masmorra rolada
  const R = scene.roll,
    W = R.w,
    H = R.h,
    A = R.a,
    at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : A[y * W + x]);
  const ek = e => e.join(","),
    skip = new Set(),
    prevDoor = new Map();
  for (const w of walls()) if (w.g && w.d) prevDoor.set(w.p.join(","), w.o);
  for (const e of R.ex) if (e.st !== "blocked") skip.add(ek(rollEdge(e.c, e.d)));
  const segs = [];
  for (let y = 0; y <= H; y++)
    for (let x = 0; x < W; x++)
      if (at(x, y - 1) !== at(x, y) && !skip.has(ek([x, y, x + 1, y]))) segs.push([x, y, x + 1, y]);
  for (let x = 0; x <= W; x++)
    for (let y = 0; y < H; y++)
      if (at(x - 1, y) !== at(x, y) && !skip.has(ek([x, y, x, y + 1]))) segs.push([x, y, x, y + 1]);
  const g = scene.gen,
    P = (x, y) => [Math.round((g.x0 + x * g.s) * 10) / 10, Math.round((g.y0 + y * g.s) * 10) / 10],
    PP = s => [...P(s[0], s[1]), ...P(s[2], s[3])];
  const out = walls().filter(w => !w.g);
  for (const s of mergeSegs(segs).concat(R.iw)) out.push({ p: PP(s), g: 1 });
  const door = (s, extra) => {
    const p = PP(s),
      o = prevDoor.get(p.join(","));
    out.push({ p, d: 1, o: o ? 1 : 0, g: 1, ...extra });
  };
  for (const e of R.ex) {
    if (e.st === "blocked") continue;
    const s = rollEdge(e.c, e.d);
    if (e.t === "door") door(s);
    else if (e.st === "new") out.push({ p: PP(s), d: 1, o: 0, s: 1, g: 1 });
  }
  for (const s of R.idr) door(s);
  scene.walls = out;
  let t = "",
    bb = [W, H, 0, 0];
  for (let i = 0; i < W * H; i++) {
    const a = A[i];
    t += a ? (R.areas[a - 1]?.k === "corredor" ? 2 : 1) : 0;
    if (a) {
      const x = i % W,
        y = (i / W) | 0;
      bb = [Math.min(bb[0], x), Math.min(bb[1], y), Math.max(bb[2], x + 1), Math.max(bb[3], y + 1)];
    }
  }
  g.t = t;
  g.iw = R.iw;
  g.nx = R.ex.filter(e => e.t === "open" && e.st === "new").map(e => ek(rollEdge(e.c, e.d)));
  g.bb = [Math.max(0, bb[0] - 3), Math.max(0, bb[1] - 3), Math.min(W, bb[2] + 3), Math.min(H, bb[3] + 3)];
  g.ver = (g.ver || 0) + 1;
  wallsVer++;
  losCache.clear();
}
function rollFits(R, cells, keep) {
  // cabe sem encostar em outras áreas? (keep = célula grudada na porta de origem)
  const W = R.w,
    H = R.h,
    set = new Set(cells.map(c => c[0] + "," + c[1]));
  for (const [x, y] of cells) {
    if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1 || R.a[y * W + x]) return false;
    if (keep && x === keep[0] && y === keep[1]) continue;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx,
          ny = y + dy;
        if (R.a[ny * W + nx] && !set.has(nx + "," + ny)) return false;
      }
  }
  return true;
}
function rollExits(R, cells, n, backDir, type, avoid) {
  const W = R.w,
    H = R.h,
    set = new Set(cells.map(c => c[0] + "," + c[1])),
    free = (x, y) => x >= 1 && y >= 1 && x < W - 1 && y < H - 1 && !R.a[y * W + x] && !set.has(x + "," + y);
  const cand = [];
  for (const c of cells) {
    if (avoid?.has(c[0] + "," + c[1])) continue;
    for (let dd = 0; dd < 4; dd++) {
      const [dx, dy] = DIRS[dd];
      if (set.has(c[0] + dx + "," + (c[1] + dy))) continue;
      let ok = true;
      for (let k = 1; k <= 4 && ok; k++) {
        const x = c[0] + dx * k,
          y = c[1] + dy * k;
        if (!free(x, y) || (k <= 2 && (!free(x + dy, y + dx) || !free(x - dy, y - dx)))) ok = false;
      }
      if (ok) cand.push({ c, d: dd });
    }
  }
  shuffle(cand).sort((a, b) => (a.d === backDir) - (b.d === backDir));
  const out = [];
  for (const e of cand) {
    if (out.length >= n) break;
    if (
      out.some(
        o =>
          Math.abs(o.c[0] - e.c[0]) + Math.abs(o.c[1] - e.c[1]) < 3 ||
          (o.d === e.d && Math.abs(o.c[0] - e.c[0]) + Math.abs(o.c[1] - e.c[1]) < 4),
      )
    )
      continue;
    out.push(e);
  }
  return out.map(e => ({ id: ++R.eid, a: 0, c: e.c, d: e.d, t: type, st: "new" }));
}
function rollPropAt(id, x, y, rot = 0, extra = {}) {
  const a = ASSETS.find(q => q.id === id);
  if (!a) return null;
  const sw = rot % 180 ? a.h : a.w,
    sh = rot % 180 ? a.w : a.h,
    g = scene.gen,
    U = G().unit || 1;
  const t = {
    id: uid(),
    k: "prop",
    n: a.n,
    img: `/assets/${a.path || a.id + ".svg"}`,
    pw: a.w,
    ph: a.h,
    a: rot,
    blk: extra.trap ? null : a.blk || null,
    sn: true,
    x: g.x0 + (x + sw / 2) * g.s,
    y: g.y0 + (y + sh / 2) * g.s,
  };
  if (extra.h) t.h = true;
  if (a.li) t.li = { rb: a.li.b * U, rd: a.li.d * U, ang: 360, c: a.li.c };
  tokens.push(t);
  return t;
}
function rollFill(R, area, cells, busy) {
  // ajudantes de posicionamento dentro de uma área
  const set = new Set(cells.map(c => c[0] + "," + c[1]));
  const fits = (x, y, w, h) => {
    for (let b = y; b < y + h; b++)
      for (let a = x; a < x + w; a++) if (!set.has(a + "," + b) || busy.has(a + "," + b)) return false;
    return true;
  };
  const mark = (x, y, w, h) => {
    for (let b = y; b < y + h; b++) for (let a = x; a < x + w; a++) busy.add(a + "," + b);
  };
  const prop = (id, extra = {}) => {
    const a = ASSETS.find(q => q.id === id);
    if (!a) return null;
    for (let k = 0; k < 60; k++) {
      const rot = a.w === a.h ? [0, 90, 180, 270][rd(4) - 1] : [0, 90][rd(2) - 1],
        sw = rot % 180 ? a.h : a.w,
        sh = rot % 180 ? a.w : a.h,
        [x, y] = cells[Math.floor(Math.random() * cells.length)];
      if (fits(x, y, sw, sh)) {
        mark(x, y, sw, sh);
        return rollPropAt(id, x, y, rot, extra);
      }
    }
    return null;
  };
  const tok = (n, c, s = 1) => {
    const g = scene.gen;
    for (let k = 0; k < 80; k++) {
      const [x, y] = cells[Math.floor(Math.random() * cells.length)];
      if (fits(x, y, s, s)) {
        mark(x, y, s, s);
        const t = {
          id: uid(),
          n,
          c,
          s,
          x: g.x0 + (x + s / 2) * g.s,
          y: g.y0 + (y + s / 2) * g.s,
          a: 180,
          h: true,
          sn: true,
        };
        tokens.push(t);
        return t;
      }
    }
    return null;
  };
  const torch = () => {
    // tocha na parede
    const opts = [];
    for (const [x, y] of cells)
      for (let dd = 0; dd < 4; dd++) {
        const nx = x + DIRS[dd][0],
          ny = y + DIRS[dd][1];
        if (
          !set.has(nx + "," + ny) &&
          !R.ex.some(e => e.c[0] === x && e.c[1] === y && e.d === dd) &&
          !busy.has(x + "," + y)
        )
          opts.push([x, y, [0, 90, 180, 270][dd]]);
      }
    const o = opts[Math.floor(Math.random() * opts.length)];
    if (o) {
      busy.add(o[0] + "," + o[1]);
      rollPropAt("tocha-parede", o[0], o[1], o[2]);
    }
  };
  return { prop, tok, torch, mark, fits };
}
function rollContent(R, area, cells, kind, busy, lines) {
  const F = rollFill(R, area, cells, busy),
    pick = a => a[Math.floor(Math.random() * a.length)];
  const traps = n => {
    for (let i = 0; i < n; i++)
      F.prop(pick(["espinhos", "alcapao", "buraco", "grade-chao"]), { h: 1, trap: 1 });
  };
  if (kind === "vazia") {
    if (Math.random() < 0.6) F.prop(pick(["ossos", "sangue", "escombros", "galhos", "cranios"]));
  } else if (kind === "obst") {
    const o = pick(RT_OBST);
    lines.push("🧱 " + o);
    const ids = {
      "Escombros bloqueiam parte da sala": ["escombros", "escombros", "pilar-quebrado"],
      "Um buraco profundo no meio do caminho": ["buraco", "buraco"],
      "Água até a cintura cobre o chão": ["agua-rasa", "agua-rasa", "agua-rasa"],
      "Estalagmites afiadas por toda parte": ["estalagmites", "estalagmites", "estalagmites", "estalagmites"],
      "Uma jaula enorme ocupa a sala": ["jaula", "grilhoes"],
    }[o];
    for (const id of ids) F.prop(id);
  } else if (kind === "armad") {
    const t = pick(RT_TRAPS);
    lines.push("⚠️ " + t + " (oculta)");
    traps(rd(2));
  } else if (kind === "inim") {
    const r = rd(20),
      row = lookup(RT_ENC, r);
    lines.push(`👹 Encontro — 1d20 = ${r} → <b>${row[1]}</b>`);
    const add = (n, nm, c, s = 1) => {
      for (let i = 0; i < n; i++) F.tok(nm, c, s);
    };
    if (r <= 4) add(rd(2), "Inimigo fraco", "#7a5a3a");
    else if (r <= 8) add(2 + rd(3), "Inimigo", "#8a3a2a");
    else if (r <= 11) {
      add(1 + rd(2), "Inimigo", "#8a3a2a");
      traps(1);
    } else if (r <= 14) add(1, "Monstro forte", "#8a1f2a", 2);
    else if (r <= 16) {
      add(2 + rd(2), "Inimigo", "#8a3a2a");
      add(1, "Líder", "#b0202a");
    } else if (r <= 18) add(1, "Monstro especial", "#6a3a8a", 2);
    else if (r === 19) {
      add(1, "Mini-chefe", "#a0202a", 2);
      add(2, "Lacaio", "#7a5a3a");
    } else add(1, "Chefe", "#5a0010", 3);
    lines.push(
      "Tokens ocultos na sala: troque o nome e a imagem pelos monstros certos para o nível do grupo e desoculte quando aparecerem.",
    );
  } else if (kind === "npc") {
    lines.push("🧑 " + pick(RT_NPC));
    F.tok("NPC", "#5f9a4a");
  } else if (kind === "tesouro") {
    const r = rd(20),
      row = lookup(RT_TRE, r);
    lines.push(`💰 Tesouro — 1d20 = ${r} → <b>${row[1]}</b>`);
    if (r <= 5) F.prop("bau-aberto");
    else if (r <= 10) F.prop("ouro");
    else if (r <= 14) F.prop("pocoes");
    else if (r <= 17) F.prop("bau");
    else if (r <= 19) {
      F.prop("pedestal");
      F.prop("bau");
    } else {
      F.prop("bau-aberto");
      F.prop("ouro");
      F.prop("pedestal");
    }
  } else if (kind === "evento") {
    const ev = pick(RT_EVENT);
    lines.push("✨ " + ev);
    F.prop(pick(["altar", "circulo-ritual", "pedestal", "estatua", "cristais"]));
  }
  return F;
}
function rollStart() {
  if (
    (scene.bg || walls().length || tokens.some(isProp)) &&
    !confirm(
      "Começar uma masmorra rolada? O mapa atual (imagem, paredes e objetos) vai ser trocado. Ctrl+Z desfaz.",
    )
  )
    return;
  if (G().type === "hex") scene.grid = { ...scene.grid, type: "square" };
  const W = 130,
    H = 104,
    R = { w: W, h: H, a: new Array(W * H).fill(0), areas: [], ex: [], iw: [], idr: [], log: [], eid: 0 };
  Object.assign(scene, {
    bg: null,
    bgW: 0,
    bgH: 0,
    bgQ: 0,
    bgFine: 0,
    roll: R,
    gen: {
      v: 2,
      rolled: 1,
      style: "dungeon",
      w: W,
      h: H,
      t: "",
      x0: G().ox || 0,
      y0: G().oy || 0,
      s: G().size,
      seed: Date.now() % 1e6,
    },
  });
  if (genOpt.dark) scene.light = "dark";
  const chars = freshDungeonTokens();
  tokens = chars;
  scene.walls = [];
  drawings = drawings.filter(d => d.t !== "tpl");
  save("drawings");
  const x0 = 63,
    y0 = 50,
    cells = [];
  for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) cells.push([x0 + x, y0 + y]);
  const area = { id: 1, k: "entrada", nm: "Entrada", shape: "Entrada", c: [x0 + 2.5, y0 + 2.5], txt: [] };
  R.areas.push(area);
  for (const [x, y] of cells) R.a[y * W + x] = 1;
  const n = rd(4),
    ex = rollExits(R, cells, n, -1, "door");
  ex.forEach(e => (e.a = 1));
  R.ex.push(...ex);
  const busy = new Set(),
    F = rollFill(R, area, cells, busy);
  rollPropAt("escada-sobe", x0 + 2, y0 + 1);
  F.mark(x0 + 2, y0 + 1, 1, 2);
  if (genOpt.torches) {
    F.torch();
    F.torch();
  }
  const g = scene.gen;
  chars.forEach((t, i) => {
    const c = cells.filter(([x, y]) => !busy.has(x + "," + y))[i] || cells[0];
    t.x = g.x0 + (c[0] + 0.5) * g.s;
    t.y = g.y0 + (c[1] + 0.5) * g.s;
    t.tr = [];
  });
  area.txt.push(`🚪 1d4 = ${n} → ${ex.length} saída${ex.length > 1 ? "s" : ""}`);
  R.log.push({ a: 1, h: "Entrada", l: area.txt.slice() });
  rollLast = { h: "Entrada", l: area.txt.slice() };
  rollRebuild();
  resetExplore();
  selTok = null;
  save("scene");
  save("tokens");
  save("fog", false);
  dirty = true;
  drawTop();
  drawEmpty();
  fit();
  openRollPanel();
}
function rollStep(exId) {
  const R = scene.roll,
    e = R?.ex.find(x => x.id === exId && x.st === "new");
  if (!e) return;
  const lines = [],
    W = R.w;
  // 1) conteúdo
  let kind = rollChoice.content,
    kname;
  if (kind === "roll") {
    const r = rd(20),
      row = lookup(RT_CONTENT, r);
    kind = row[1];
    kname = row[2];
    lines.push(`🎲 Sala — 1d20 = ${r} → <b>${kname}</b>`);
  } else {
    kname = RT_CONTENT.find(x => x[1] === kind)[2];
    lines.push(`Escolhido: <b>${kname}</b>`);
  }
  // 2) formato e 3) saídas
  let shapeI = null;
  if (kind !== "corredor") {
    if (rollChoice.shape === "roll") {
      const r = rd(12);
      shapeI = r - 1;
      lines.push(`📐 Formato — 1d12 = ${r} → <b>${RT_SHAPES[shapeI]}</b>`);
    } else {
      shapeI = +rollChoice.shape;
      lines.push(`📐 Formato: <b>${RT_SHAPES[shapeI]}</b>`);
    }
  }
  let nEx;
  if (rollChoice.exits === "roll") {
    nEx = rd(4);
    lines.push(`🚪 Saídas — 1d4 = ${nEx}`);
  } else {
    nEx = +rollChoice.exits;
    lines.push(`🚪 Saídas: ${nEx}`);
  }
  const [dx, dy] = DIRS[e.d],
    O = [e.c[0] + dx, e.c[1] + dy];
  let cells = null,
    meta = null,
    conn = [];
  let cwid = 1;
  const corrCells = (L, w) => {
    // corredor: 1 casa na porta e depois a largura escolhida
    const cs = [O.slice()],
      px = -dy,
      py = dx,
      o0 = -((w - 1) >> 1);
    for (let k = 1; k < L; k++)
      for (let j = o0; j < o0 + w; j++) cs.push([O[0] + dx * k + px * j, O[1] + dy * k + py * j]);
    return cs;
  };
  if (kind === "corredor") {
    for (const w of [[1, 1, 2, 2, 3][rd(5) - 1], 2, 1]) {
      for (let L = 6 + rd(7); L >= 3 && !cells; L -= 2) {
        const cs = corrCells(L, w);
        if (rollFits(R, cs, O)) {
          cells = cs;
          cwid = w;
        }
      }
      if (cells) break;
    }
  } else {
    const tryShape = (si, cl) => {
      const sm = shapeMask(si, e.d),
        set = new Set(sm.m.map(c => c[0] + "," + c[1]));
      const conn0 = [];
      for (let k = 0; k < cl; k++) conn0.push([O[0] + dx * k, O[1] + dy * k]);
      const E = [O[0] + dx * cl, O[1] + dy * cl];
      for (const mc of shuffle(sm.m.filter(([x, y]) => !set.has(x - dx + "," + (y - dy))))) {
        const ox = E[0] - mc[0],
          oy = E[1] - mc[1],
          cs = sm.m.map(([x, y]) => [x + ox, y + oy]);
        if (rollFits(R, conn0.concat(cs), O)) {
          meta = { ...sm.meta, ox, oy };
          conn = conn0;
          return cs;
        }
      }
      return null;
    };
    for (const cl of [2 + rd(3), 3, 2, 1, 5]) {
      cells = tryShape(shapeI, cl);
      if (cells) break;
    }
    if (!cells)
      for (const cl of [2, 1, 3]) {
        cells = tryShape(0, cl);
        if (cells) {
          lines.push("(não coube: virou uma sala pequena)");
          shapeI = 0;
          break;
        }
      }
  }
  if (!cells && kind !== "corredor") {
    // nem sala pequena coube: vira um corredor
    for (let L = 8; L >= 2 && !cells; L--) {
      const cs = corrCells(L, 1);
      if (rollFits(R, cs, O)) cells = cs;
    }
    if (cells) {
      kind = "corredor";
      kname = "Corredor";
      meta = null;
      conn = [];
      lines.push("(não coube uma sala aqui: virou um corredor)");
    }
  }
  if (!cells) {
    e.st = "blocked";
    lines.push("🪨 Não há espaço: o caminho está <b>bloqueado por um desabamento</b>.");
    R.log.push({ a: e.a, h: "Desabamento", l: lines });
    rollLast = { h: "Caminho bloqueado", l: lines };
    rollRebuild();
    save("scene");
    dirty = true;
    openRollPanel();
    return;
  }
  const id = R.areas.length + 1,
    isCorr = kind === "corredor";
  const nm = isCorr
    ? `Corredor ${R.areas.filter(a => a.k === "corredor").length + 1}`
    : `Sala ${R.areas.filter(a => a.k !== "corredor" && a.k !== "entrada").length + 1}`;
  if (isCorr) lines.push(`↔ Corredor de ${cwid} casa${cwid > 1 ? "s" : ""} de largura`);
  const all = conn.concat(cells),
    area = {
      id,
      k: isCorr ? "corredor" : kind,
      nm,
      shape: isCorr ? "Corredor" : RT_SHAPES[shapeI],
      c: [
        all.reduce((s, c) => s + c[0], 0) / all.length + 0.5,
        all.reduce((s, c) => s + c[1], 0) / all.length + 0.5,
      ],
      txt: [],
    };
  R.areas.push(area);
  for (const [x, y] of all) R.a[y * W + x] = id;
  e.st = "done";
  e.to = id;
  // saídas novas
  let ex;
  if (isCorr) {
    const far = Math.max(...cells.map(c => c[0] * dx + c[1] * dy)),
      tip = cells.filter(c => c[0] * dx + c[1] * dy === far);
    const first = rollExits(R, tip, 1, (e.d + 2) % 4, "open").filter(x => x.d === e.d);
    const side =
      nEx > 1 ? rollExits(R, cells.slice(1), nEx - 1, (e.d + 2) % 4, "open").filter(x => x.d !== e.d) : [];
    ex = first.concat(side).slice(0, nEx);
    if (!ex.length) ex = rollExits(R, all, 1, (e.d + 2) % 4, "open");
  } else ex = rollExits(R, cells, nEx, (e.d + 2) % 4, "door", new Set(conn.map(c => c[0] + "," + c[1])));
  ex.forEach(x => (x.a = id));
  R.ex.push(...ex);
  if (ex.length < nEx) lines.push(`(só couberam ${ex.length} saída${ex.length === 1 ? "" : "s"})`);
  // formato especial: pilares, desnível, divisória
  const busy = new Set(conn.map(c => c[0] + "," + c[1]));
  if (meta) {
    for (const [x, y] of meta.pil) {
      rollPropAt("coluna", x + meta.ox, y + meta.oy);
      busy.add(x + meta.ox + "," + (y + meta.oy));
    }
    for (const [x, y, rot] of meta.st) {
      rollPropAt("escada", x + meta.ox, y + meta.oy, rot);
      const w = rot ? 2 : 1,
        h = rot ? 1 : 2;
      for (let b = 0; b < h; b++)
        for (let a = 0; a < w; a++) busy.add(x + meta.ox + a + "," + (y + meta.oy + b));
    }
    for (const s of meta.iw) R.iw.push([s[0] + meta.ox, s[1] + meta.oy, s[2] + meta.ox, s[3] + meta.oy]);
    for (const s of meta.idr) R.idr.push([s[0] + meta.ox, s[1] + meta.oy, s[2] + meta.ox, s[3] + meta.oy]);
    // não deixa objeto na frente das saídas
    for (const x of ex) busy.add(x.c[0] + "," + x.c[1]);
    if (meta.idr.length)
      for (const s of R.idr.slice(-meta.idr.length)) {
        busy.add(s[0] + "," + s[1]);
        busy.add(s[0] - (s[1] === s[3] ? 0 : 1) + "," + (s[1] - (s[1] === s[3] ? 1 : 0)));
      }
  }
  if (isCorr) {
    if (kind === "corredor" && Math.random() < 0.15) {
      const F = rollFill(R, area, cells, busy);
      F.prop(["espinhos", "alcapao"][rd(2) - 1], { h: 1, trap: 1 });
      lines.push("⚠️ Armadilha escondida no corredor");
    }
  } else {
    const F = rollContent(R, area, cells, kind, busy, lines);
    if (genOpt.torches && kind !== "vazia") {
      F.torch();
      if (cells.length > 40) F.torch();
    }
  }
  area.txt = lines.slice();
  R.log.push({
    a: id,
    h: `${nm} · ${isCorr ? "Corredor" : kname}${isCorr ? "" : " · " + RT_SHAPES[shapeI]}`,
    l: lines,
  });
  rollLast = { h: `${nm}${isCorr ? "" : " — " + kname}`, l: lines, a: id };
  rollRebuild();
  save("scene");
  save("tokens");
  dirty = true;
  const nxt = R.ex.filter(x => x.st === "new");
  rollSel = ex[0]?.id || nxt[0]?.id || null;
  openRollPanel();
  toast(e.t === "door" ? "Área criada. Clique na porta para abrir quando entrarem." : "Área criada.");
}
function rollExitPos(e) {
  const g = scene.gen,
    [dx, dy] = DIRS[e.d];
  return [g.x0 + (e.c[0] + 0.5 + dx * 0.95) * g.s, g.y0 + (e.c[1] + 0.5 + dy * 0.95) * g.s];
}
function rollExitAt(wx, wy) {
  const R = scene.roll;
  if (!R || !scene.gen) return null;
  const r = scene.gen.s * 0.38;
  return (
    R.ex.find(e => e.st === "new" && Math.hypot(...(([x, y]) => [x - wx, y - wy])(rollExitPos(e))) <= r) ||
    null
  );
}
function paintRollGM() {
  // só o mestre: número das salas e as saídas ainda não roladas
  const R = scene.roll,
    g = scene.gen;
  if (!isGM || !R || !g) return;
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const fs = Math.max(11 / cam.z, g.s * 0.3);
  for (const a of R.areas) {
    if (a.k === "corredor") continue;
    const x = g.x0 + a.c[0] * g.s,
      y = g.y0 + a.c[1] * g.s;
    ctx.font = `700 ${fs}px "Alegreya Sans", sans-serif`;
    const txt =
      a.nm +
      (a.k !== "entrada" && a.k !== "vazia" ? " · " + (RT_CONTENT.find(r => r[1] === a.k)?.[2] || "") : "");
    const w = ctx.measureText(txt).width + fs;
    ctx.fillStyle = "rgba(20,16,12,.72)";
    ctx.fillRect(x - w / 2, y - fs * 0.75, w, fs * 1.5);
    ctx.fillStyle = "#e8c77a";
    ctx.fillText(txt, x, y);
  }
  for (const e of R.ex) {
    if (e.st !== "new") continue;
    const [x, y] = rollExitPos(e),
      r = g.s * 0.32,
      on = e.id === rollSel && panelKind === "gen";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = on ? "#ffe28a" : "#d0a54c";
    ctx.fill();
    ctx.lineWidth = 2 / cam.z;
    ctx.strokeStyle = "#2a1a08";
    ctx.stroke();
    ctx.fillStyle = "#1c150c";
    ctx.font = `800 ${r * 1.3}px "Alegreya Sans", sans-serif`;
    ctx.fillText("?", x, y + r * 0.05);
  }
  ctx.restore();
}
function openRollPanel() {
  panelKind = "gen";
  const R = scene.roll,
    open = R ? R.ex.filter(e => e.st === "new") : [];
  if (!open.some(e => e.id === rollSel)) rollSel = open[0]?.id ?? null;
  const areaNm = id => R.areas[id - 1]?.nm || "?";
  const exNm = e => `${areaNm(e.a)} · ${e.t === "door" ? "porta" : "passagem"} ${DIRN[e.d]}`;
  const sel = (id, label, opts, v) =>
    `<label class="gnum rsel"><span>${label}</span><select id="${id}">${opts.map(([k, l]) => `<option value="${k}" ${String(v) === String(k) ? "selected" : ""}>${l}</option>`).join("")}</select></label>`;
  const tables = `<details class="rtab"><summary>📜 Tabelas</summary>
    <b>O que existe? — 1d20</b><table>${RT_CONTENT.map((r, i) => `<tr><td>${i ? RT_CONTENT[i - 1][0] + 1 : 1}${r[0] > (i ? RT_CONTENT[i - 1][0] + 1 : 1) ? "–" + r[0] : ""}</td><td>${r[2]}</td></tr>`).join("")}</table>
    <b>Formato — 1d12</b><table>${RT_SHAPES.map((s, i) => `<tr><td>${i + 1}</td><td>${s}</td></tr>`).join("")}</table>
    <b>Saídas — 1d4</b><p>1 a 4 saídas (além da porta por onde entraram)</p>
    <b>Encontro — 1d20</b><table>${RT_ENC.map((r, i) => `<tr><td>${i ? RT_ENC[i - 1][0] + 1 : 1}${r[0] > (i ? RT_ENC[i - 1][0] + 1 : 1) ? "–" + r[0] : ""}</td><td>${r[1]}</td></tr>`).join("")}</table>
    <b>Tesouro — 1d20</b><table>${RT_TRE.map((r, i) => `<tr><td>${i ? RT_TRE[i - 1][0] + 1 : 1}${r[0] > (i ? RT_TRE[i - 1][0] + 1 : 1) ? "–" + r[0] : ""}</td><td>${r[1]}</td></tr>`).join("")}</table></details>`;
  $("#panel").innerHTML =
    `<div class="panel gen-panel" role="dialog" aria-label="Masmorra rolada"><h3>Gerador de cenários <button class="btn small" id="pClose">Fechar</button></h3>
    ${styleTabs("rolled")}
    ${
      !R
        ? `<p class="hint" style="font-size:14px">A masmorra vai sendo criada <b>enquanto os jogadores exploram</b>. Você começa só com a entrada. Quando o grupo chega numa porta ou passagem ainda não rolada (o <b style="color:var(--brass)">?</b> dourado, só você vê), clique nela e role: o que existe na sala (1d20), o formato (1d12) e as saídas (1d4). Se sair inimigo ou tesouro, rola a tabela deles também. A sala aparece desenhada, com paredes, portas e objetos.</p>
      <label class="chk"><input type="checkbox" id="gTorch" ${genOpt.torches ? "checked" : ""}> Tochas nas paredes (iluminam)</label>
      <label class="chk"><input type="checkbox" id="gDark" ${genOpt.dark ? "checked" : ""}> Começar no escuro (só vê quem tem luz)</label>
      <div class="acts foot"><span class="spacer"></span><button class="btn primary" id="rStart">▶ Começar pela entrada</button></div>`
        : `${rollLast ? `<div class="rlast"><b>${rollLast.h}</b>${rollLast.l.map(l => `<div>${l}</div>`).join("")}</div>` : ""}
      <div class="lbl">Saídas sem explorar <small>(${open.length})</small></div>
      <div class="rexits">${open.map(e => `<button class="rex" data-rex="${e.id}" aria-pressed="${e.id === rollSel}"><span>?</span>${esc(exNm(e))}</button>`).join("") || `<p class="hint">Nenhuma. A masmorra acabou (ou recomece).</p>`}</div>
      ${
        open.length
          ? `<div class="ggrid" style="margin-top:8px">
        ${sel("rC", "Conteúdo", [["roll", "🎲 Rolar 1d20"], ...RT_CONTENT.map(r => [r[1], r[2]])], rollChoice.content)}
        ${sel("rS", "Formato", [["roll", "🎲 Rolar 1d12"], ...RT_SHAPES.map((s, i) => [i, s])], rollChoice.shape)}
        ${sel(
          "rE",
          "Saídas",
          [
            ["roll", "🎲 Rolar 1d4"],
            [1, "1"],
            [2, "2"],
            [3, "3"],
            [4, "4"],
          ],
          rollChoice.exits,
        )}
      </div>
      <div class="acts foot"><button class="btn small" id="rGo" title="Mostrar essa saída no mapa">👁 Ver</button><span class="spacer"></span><button class="btn primary" id="rRoll">🎲 Rolar e criar a área</button></div>`
          : ""
      }
      <div class="lbl" style="margin-top:12px">Diário da masmorra</div>
      <div class="rlog">${R.log
        .slice()
        .reverse()
        .map(
          x =>
            `<button class="rlrow" data-ra="${x.a}"><b>${x.h}</b>${x.l
              .filter(l => !/^🎲|^📐|^🚪|^Escolhido/.test(l))
              .map(l => `<small>${l}</small>`)
              .join("")}</button>`,
        )
        .join("")}</div>
      <div class="acts" style="margin-top:10px"><button class="btn small danger" id="rReset">Recomeçar do zero</button></div>`
    }
    ${tables}</div>`;
  $("#pClose").onclick = closePanel;
  $("#gStyle").onclick = ev => {
    const b = ev.target.closest("[data-st]");
    if (!b) return;
    genOpt.style = b.dataset.st;
    genOpt.dark = GEN_DARK[genOpt.style];
    saveGenOpt();
    openGenPanel();
  };
  const tg = $("#gTorch");
  if (tg)
    tg.onchange = () => {
      genOpt.torches = tg.checked;
      saveGenOpt();
    };
  const dk0 = $("#gDark");
  if (dk0)
    dk0.onchange = () => {
      genOpt.dark = dk0.checked;
      saveGenOpt();
    };
  if ($("#rStart")) $("#rStart").onclick = rollStart;
  if ($("#rReset"))
    $("#rReset").onclick = () => {
      if (confirm("Apagar a masmorra rolada e começar outra pela entrada?")) {
        scene.roll = null;
        rollLast = null;
        rollStart();
      }
    };
  for (const [id, k] of [
    ["rC", "content"],
    ["rS", "shape"],
    ["rE", "exits"],
  ]) {
    const s = $("#" + id);
    if (s)
      s.onchange = () => {
        rollChoice[k] = s.value;
      };
  }
  if ($("#rRoll"))
    $("#rRoll").onclick = () => {
      if (rollSel != null) rollStep(rollSel);
    };
  const goEx = e => {
    const [x, y] = rollExitPos(e);
    centerOn(x, y, Math.max(cam.z, 0.7));
  };
  if ($("#rGo"))
    $("#rGo").onclick = () => {
      const e = R.ex.find(x => x.id === rollSel);
      if (e) goEx(e);
    };
  $("#panel")
    .querySelectorAll("[data-rex]")
    .forEach(
      b =>
        (b.onclick = () => {
          rollSel = +b.dataset.rex;
          dirty = true;
          openRollPanel();
        }),
    );
  $("#panel")
    .querySelectorAll("[data-ra]")
    .forEach(
      b =>
        (b.onclick = () => {
          const a = R.areas[+b.dataset.ra - 1],
            g = scene.gen;
          if (a) centerOn(g.x0 + a.c[0] * g.s, g.y0 + a.c[1] * g.s, Math.max(cam.z, 0.6));
        }),
    );
  dirty = true;
}

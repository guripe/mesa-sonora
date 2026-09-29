"use strict";
// ---------- caminho do token (movimento) ----------
const NEI = () =>
  G().type === "hex"
    ? [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, -1],
        [-1, 1],
      ]
    : [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ];
const maxCells = t => {
  const sp = t.sp == null ? 9 : +t.sp;
  return sp > 0 ? Math.floor(sp / (G().unit || 1) + 1e-6) : Infinity;
};
// ---- deslocamento por turno no combate: t.mt = casas já andadas no turno, t.dash = usou Disparada ----
const inCombat = t => !!(t && scene.init?.on && scene.init.list?.some(e => e.tk === t.id));
const moveBudget = t => maxCells(t) * (t.dash ? 2 : 1);
const moveLim = t => (inCombat(t) ? Math.max(0, moveBudget(t) - (+t.mt || 0)) : maxCells(t));
function moveSpent(t, cells) {
  // o mestre soma o que o token andou no turno e avisa se passou
  if (!isGM || !inCombat(t) || !(cells > 0)) return;
  t.mt = (+t.mt || 0) + cells;
  const B = moveBudget(t);
  if (B < Infinity && t.mt > B) {
    const u = G().unit || 1,
      f = v => String(Math.round(v * u * 10) / 10).replace(".", ",");
    toast(`⚠️ ${t.n || "Token"} passou do deslocamento: ${f(t.mt)} de ${f(B)} ${G().unitName || "m"}.`, 2600);
  }
}
function pathStep(d, target) {
  // estende o caminho do arraste até a casa alvo, parando em parede ou no limite
  const P = d.path,
    key = c => c[0] + "," + c[1];
  const idx = P.findIndex(c => c[0] === target[0] && c[1] === target[1]);
  if (idx >= 0) {
    P.length = idx + 1;
    return;
  } // voltou por onde veio
  const lim = isGM ? Infinity : moveLim(d.t),
    [tx, ty] = cellCenter(...target);
  for (let guard = 0; guard < 300; guard++) {
    const last = P[P.length - 1];
    if (last[0] === target[0] && last[1] === target[1]) break;
    if (P.length - 1 >= lim) {
      d.limit = true;
      break;
    }
    let best = null,
      bd = Infinity;
    const [lx, ly] = cellCenter(...last);
    for (const [da, db] of NEI()) {
      const c = [last[0] + da, last[1] + db],
        [cx, cy] = cellCenter(...c),
        dd = Math.hypot(cx - tx, cy - ty);
      if (dd < bd) {
        bd = dd;
        best = [c, cx, cy];
      }
    }
    if (!best || bd >= Math.hypot(lx - tx, ly - ty)) break;
    if (!isGM && blockedMove(lx, ly, best[1], best[2])) {
      d.wall = true;
      break;
    }
    const j = P.findIndex(c => c[0] === best[0][0] && c[1] === best[0][1]);
    if (j >= 0) {
      P.length = j + 1;
      continue;
    }
    P.push(best[0]);
  }
}
// ---------- clicar para andar ----------
let hoverCell = null,
  reachCache = { key: "", map: null },
  walking = null;
function reach(t) {
  // casas alcançáveis a partir do token (desvia de paredes; respeita o deslocamento do jogador)
  const lim = isGM ? 60 : Math.min(60, moveLim(t)),
    start = cellAt(t.x, t.y);
  const key = [t.id, Math.round(t.x), Math.round(t.y), wallsVer, lim, G().size, G().type, FL()].join("|");
  if (reachCache.key === key) return reachCache.map;
  const map = new Map(),
    k0 = start.join(",");
  map.set(k0, { c: start, prev: null, d: 0 });
  const q = [start];
  while (q.length) {
    const c = q.shift(),
      cur = map.get(c.join(","));
    if (cur.d >= lim) continue;
    const [cx, cy] = cellCenter(...c);
    for (const [da, db] of NEI()) {
      const n = [c[0] + da, c[1] + db],
        k = n.join(",");
      if (map.has(k)) continue;
      const [nx, ny] = cellCenter(...n);
      if (!isGM && blockedMove(cx, cy, nx, ny)) continue;
      map.set(k, { c: n, prev: c, d: cur.d + 1 });
      q.push(n);
      if (map.size > 6000) break;
    }
  }
  reachCache = { key, map };
  return map;
}
function pathTo(t, target) {
  const m = reach(t),
    e = m.get(target.join(","));
  if (!e) return null;
  const out = [];
  let c = target;
  while (c) {
    out.unshift(c);
    c = m.get(c.join(",")).prev;
  }
  return out;
}
function clickMoveTok() {
  const t = tokens.find(x => x.id === selTok);
  return t && !isProp(t) && !isGM && owns(t) && tool === "move" && !walking ? t : null;
} // só jogadores (o mestre continua arrastando)
function paintReach() {
  const t = clickMoveTok();
  if (!t || !hoverCell || drag) return;
  if (!isGM) {
    const m = reach(t);
    ctx.save();
    ctx.beginPath();
    for (const { c } of m.values()) cellPath(ctx, ...c);
    ctx.fillStyle = "rgba(255,226,138,.06)";
    ctx.fill();
    ctx.restore();
  }
  const P = pathTo(t, hoverCell);
  if (P && P.length > 1) paintPath({ t, path: P, grid: true, moved: true });
  else if (!P) {
    const [x, y] = cellCenter(...hoverCell);
    ctx.save();
    ctx.beginPath();
    cellPath(ctx, ...hoverCell);
    ctx.strokeStyle = "#e0735e";
    ctx.lineWidth = 2 / cam.z;
    ctx.stroke();
    label(x, y, "longe demais ou bloqueado");
    ctx.restore();
  }
}
const lerpAng = (a, b, k) => {
  const d = ((((b - a) % 360) + 540) % 360) - 180;
  return (a + d * k + 360) % 360;
};
function walkTo(t, P) {
  // anda liso pelo caminho, virando para onde vai
  const cells = P.slice(1);
  if (!cells.length) return;
  const ox = t.x,
    oy = t.y,
    centers = P.map(c => cellCenter(...c));
  const pts = [
    [t.x, t.y],
    ...cells.map(c => {
      const [x, y] = cellCenter(...c);
      return t.sn === false ? [x, y] : snapPoint(x, y, t.s || 1);
    }),
  ];
  const segMs = 200,
    total = (pts.length - 1) * segMs,
    t0 = performance.now();
  let lastSend = 0;
  walking = t.id;
  const tick = now => {
    const cur = tokens.find(x => x.id === t.id);
    if (!cur) {
      walking = null;
      return;
    }
    const f = Math.max(0, Math.min(pts.length - 1, (now - t0) / segMs)),
      i = Math.max(0, Math.min(pts.length - 2, Math.floor(f))),
      u = f - i;
    const [ax, ay] = pts[i],
      [bx, by] = pts[i + 1];
    cur.x = ax + (bx - ax) * u;
    cur.y = ay + (by - ay) * u;
    if (Math.hypot(bx - ax, by - ay) > 1)
      cur.a = lerpAng(cur.a || 0, ((Math.atan2(bx - ax, -(by - ay)) * 180) / Math.PI + 360) % 360, 0.3);
    tokLive[cur.id] = { x: cur.x, y: cur.y, a: cur.a };
    dirty = true;
    if (now - lastSend > 50) {
      lastSend = now;
      send("tok", { id: cur.id, x: Math.round(cur.x), y: Math.round(cur.y), a: Math.round(cur.a), live: 1 });
    }
    if (now - t0 < total) return requestAnimationFrame(tick);
    const [ex, ey] = pts[pts.length - 1],
      [px, py] = pts[pts.length - 2];
    cur.x = ex;
    cur.y = ey;
    cur.a = Math.round(((Math.atan2(ex - px, -(ey - py)) * 180) / Math.PI + 360) % 360);
    delete tokLive[cur.id];
    walking = null;
    hoverCell = null;
    dirty = true;
    if (isGM) {
      pushTrail(cur, centers);
      moveSpent(cur, cells.length);
      send("tok", { id: cur.id, x: cur.x, y: cur.y, a: cur.a });
      save("tokens");
    } else {
      if (inCombat(cur)) cur.mt = (+cur.mt || 0) + cells.length;
      selBarKey = "";
      tokReq({
        id: cur.id,
        x: cur.x,
        y: cur.y,
        a: cur.a,
        who: myNick,
        path: [[ox, oy], ...centers.slice(1).map(p => p.map(v => Math.round(v * 10) / 10))],
      });
    }
  };
  requestAnimationFrame(tick);
}
// posição mostrada na tela: desliza até a posição real (os outros veem o movimento liso, não aos pulos)
let stepsOn = (() => {
  try {
    return localStorage.getItem("mesa.steps") !== "0";
  } catch {
    return true;
  }
})();
const disp = {},
  stepAcc = {},
  stepAt = {};
let lastSmoothT = performance.now(),
  smoothBusy = false,
  curTs = null;
function footstep(t) {
  const now = performance.now();
  if (now - (stepAt[t.id] || 0) < 110) return;
  stepAt[t.id] = now;
  const mine = isGM || owns(t);
  DS.step(mine ? 0.42 : 0.26, (stepAcc[t.id + "_alt"] = !stepAcc[t.id + "_alt"]));
}
function tsNow() {
  const now = performance.now(),
    dt = Math.min(120, now - lastSmoothT);
  lastSmoothT = now;
  smoothBusy = false;
  const k = 1 - Math.exp(-dt / 75),
    S = G().size;
  return tokens.map(t0 => {
    const t = tokLive[t0.id] ? { ...t0, ...tokLive[t0.id] } : t0;
    if (isProp(t)) return t;
    const direct = walking === t.id || (drag && drag.t && drag.t.id === t.id);
    let D = disp[t.id];
    if (!D) {
      disp[t.id] = { x: t.x, y: t.y, a: t.a || 0 };
      return t;
    }
    const px = D.x,
      py = D.y,
      dist = Math.hypot(t.x - D.x, t.y - D.y);
    if (direct || dist > S * 8) {
      D.x = t.x;
      D.y = t.y;
    } else if (dist > 0.4) {
      D.x += (t.x - D.x) * k;
      D.y += (t.y - D.y) * k;
      smoothBusy = true;
    } else {
      D.x = t.x;
      D.y = t.y;
    }
    const ta = t.a || 0,
      da = ((((ta - D.a) % 360) + 540) % 360) - 180;
    if (direct || Math.abs(da) < 0.5) D.a = ta;
    else {
      D.a = lerpAng(D.a, ta, k);
      smoothBusy = true;
    }
    const mv = Math.hypot(D.x - px, D.y - py);
    if (mv > 0.05 && mv < S * 3) {
      stepAcc[t.id] = (stepAcc[t.id] || 0) + mv;
      if (stepAcc[t.id] >= S * 0.5) {
        stepAcc[t.id] = 0;
        if (isGM || !t.h) footstep(t);
      }
    }
    return { ...t, x: D.x, y: D.y, a: D.a };
  });
}
function paintPath(d) {
  const pts = d.path.map(c => cellCenter(...c));
  if (pts.length < 2) return;
  const lim = isGM ? (inCombat(d.t) ? moveLim(d.t) : Infinity) : moveLim(d.t),
    steps = pts.length - 1,
    full = !!d.limit || steps > lim;
  ctx.save();
  ctx.lineCap = ctx.lineJoin = "round";
  ctx.beginPath();
  for (const c of d.path) cellPath(ctx, ...c);
  ctx.fillStyle = full ? "rgba(224,115,94,.16)" : "rgba(255,226,138,.14)";
  ctx.fill();
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.strokeStyle = "rgba(0,0,0,.55)";
  ctx.lineWidth = 7 / cam.z;
  ctx.stroke();
  ctx.strokeStyle = full ? "#e0735e" : "#ffe28a";
  ctx.lineWidth = 3.5 / cam.z;
  ctx.setLineDash([10 / cam.z, 7 / cam.z]);
  ctx.stroke();
  ctx.setLineDash([]);
  for (const [x, y] of pts.slice(1)) {
    ctx.beginPath();
    ctx.arc(x, y, 3.5 / cam.z, 0, Math.PI * 2);
    ctx.fillStyle = full ? "#e0735e" : "#ffe28a";
    ctx.fill();
  }
  const g = G(),
    m = Math.round(steps * g.unit * 10) / 10,
    mx = lim < Infinity ? Math.round(lim * g.unit * 10) / 10 : null;
  const [ex, ey] = pts[pts.length - 1];
  label(
    ex,
    ey - tokR(d.t),
    `${steps} ${steps === 1 ? "casa" : "casas"} · ${String(m).replace(".", ",")}${mx != null ? " / " + String(mx).replace(".", ",") : ""} ${g.unitName}${d.wall ? " · parede!" : full ? " · limite" : ""}`,
  );
  ctx.restore();
}
function validPath(t, path) {
  // o mestre confere o caminho que o jogador mandou
  refreshBlock();
  if (!Array.isArray(path) || path.length < 2 || path.length > 400) return false;
  if (Math.hypot(path[0][0] - t.x, path[0][1] - t.y) > G().size * 0.75) return false;
  if (path.length - 1 > moveLim(t)) return false;
  for (let i = 1; i < path.length; i++) {
    const [a, b] = path[i - 1],
      [c, e] = path[i];
    if (Math.hypot(c - a, e - b) > G().size * 1.5) return false;
    if (blockedMove(a, b, c, e)) return false;
  }
  return true;
}

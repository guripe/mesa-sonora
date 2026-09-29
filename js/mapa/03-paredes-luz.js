"use strict";
// ---------- paredes, luz e visão ----------
const walls = () => scene.walls || (scene.walls = []);
let segCache = { v: -1, s: [] };
function blocking() {
  // paredes como segmentos (círculos viram polígonos)
  if (segCache.v === wallsVer) return segCache.s;
  const out = [];
  for (const w of walls()) {
    if (w.d && w.o) continue;
    if (w.c) {
      const [cx, cy] = w.c,
        n = Math.max(12, Math.min(40, Math.round(w.r / 6)));
      for (let i = 0; i < n; i++) {
        const a1 = (i / n) * Math.PI * 2,
          a2 = ((i + 1) / n) * Math.PI * 2;
        out.push([
          cx + w.r * Math.cos(a1),
          cy + w.r * Math.sin(a1),
          cx + w.r * Math.cos(a2),
          cy + w.r * Math.sin(a2),
        ]);
      }
    } else if (w.p) out.push(w.p);
  }
  propSegs(out);
  segCache = { v: wallsVer, s: out };
  return out;
}
function segHit(px, py, dx, dy, [x1, y1, x2, y2]) {
  const sx = x2 - x1,
    sy = y2 - y1,
    den = dx * sy - dy * sx;
  if (Math.abs(den) < 1e-9) return Infinity;
  const qx = x1 - px,
    qy = y1 - py,
    t = (qx * sy - qy * sx) / den,
    u = (qx * dy - qy * dx) / den;
  return t >= 0 && u >= -1e-6 && u <= 1 + 1e-6 ? t : Infinity;
}
const losCache = new Map();
function losPoly(x, y, R, skip) {
  // polígono do que se vê a partir de (x,y) até R, parado pelas paredes (skip = objeto que é a própria fonte de luz)
  const key = `${Math.round(x)},${Math.round(y)},${Math.round(R)},${wallsVer},${skip || ""}`;
  if (losCache.has(key)) return losCache.get(key);
  const segs = blocking().filter(
    ([x1, y1, x2, y2, own]) =>
      !(skip && own === skip) &&
      !(
        Math.min(x1, x2) > x + R ||
        Math.max(x1, x2) < x - R ||
        Math.min(y1, y2) > y + R ||
        Math.max(y1, y2) < y - R
      ),
  );
  let poly = null;
  if (segs.length) {
    const B = R * 1.05,
      box = [
        [x - B, y - B, x + B, y - B],
        [x + B, y - B, x + B, y + B],
        [x + B, y + B, x - B, y + B],
        [x - B, y + B, x - B, y - B],
      ];
    const all = segs.concat(box),
      angs = [];
    for (const [x1, y1, x2, y2] of all)
      for (const [ex, ey] of [
        [x1, y1],
        [x2, y2],
      ]) {
        const a = Math.atan2(ey - y, ex - x);
        angs.push(a - 1e-4, a, a + 1e-4);
      }
    for (let i = 0; i < 48; i++) angs.push(-Math.PI + (i * Math.PI) / 24);
    angs.sort((a, b) => a - b);
    poly = [];
    for (const a of angs) {
      const dx = Math.cos(a),
        dy = Math.sin(a);
      let best = Infinity;
      for (const sg of all) {
        const t = segHit(x, y, dx, dy, sg);
        if (t < best) best = t;
      }
      if (best < Infinity) poly.push([x + dx * best, y + dy * best]);
    }
  }
  if (losCache.size > 300) losCache.clear();
  losCache.set(key, poly);
  return poly;
}
function shapePath(c, x, y, R, ang, facing, poly) {
  // área = linha de visão ∩ cone ∩ círculo R (desenha só o caminho)
  if (poly) {
    poly.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py)));
    c.closePath();
  } else {
    c.moveTo(x + R, y);
    c.arc(x, y, R, 0, Math.PI * 2);
  }
}
function conePath(c, x, y, R, ang, facing) {
  if (!(ang < 360)) {
    c.moveTo(x + R, y);
    c.arc(x, y, R, 0, Math.PI * 2);
    return;
  }
  const a0 = ((facing - 90 - ang / 2) * Math.PI) / 180,
    a1 = ((facing - 90 + ang / 2) * Math.PI) / 180;
  c.moveTo(x, y);
  c.arc(x, y, R, a0, a1);
  c.closePath();
}
const VI = t => {
  // visão com valores padrão (e compatível com a versão antiga)
  const v = t.vi || {};
  if (!v.on) return null;
  if (v.rb == null && v.r != null)
    return { rb: v.r, rd: v.r, rk: v.r, ang: v.t === "circle" ? 360 : v.ang || 90 };
  return { rb: +v.rb || 0, rd: +v.rd || 0, rk: +v.rk || 0, ang: v.ang == null ? 360 : +v.ang };
};
const LI = t => {
  const l = t.li;
  return l && ((+l.rb || 0) > 0 || (+l.rd || 0) > 0)
    ? { rb: +l.rb || 0, rd: +l.rd || 0, ang: l.ang == null ? 360 : +l.ang, c: l.c || null }
    : null;
};
const lightSkip = t => (isProp(t) ? t.id : 0);
let RT = null; // alvo de desenho: null = tela; senão um retângulo do mundo (usado pela memória)
const LQ = 0.5; // a escuridão é calculada em meia resolução (bem mais leve; o desfoque esconde a diferença)
const cvs = {};
function off(k, hi) {
  if (RT) k += "_w";
  let c = cvs[k];
  if (!c) {
    c = cvs[k] = document.createElement("canvas");
  }
  c._q = RT ? 1 : hi ? 1 : LQ;
  const W0 = RT ? RT.w : Math.ceil(cv.width * c._q),
    H0 = RT ? RT.h : Math.ceil(cv.height * c._q);
  if (c.width !== W0 || c.height !== H0) {
    c.width = W0;
    c.height = H0;
  }
  const x = c.getContext("2d");
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.globalCompositeOperation = "source-over";
  x.globalAlpha = 1;
  x.filter = "none";
  x.clearRect(0, 0, c.width, c.height);
  return [c, x];
}
const W = x => {
  if (RT) return x.setTransform(RT.s, 0, 0, RT.s, -RT.x0 * RT.s, -RT.y0 * RT.s);
  const d = (devicePixelRatio || 1) * (x.canvas._q || 1);
  x.setTransform(d * cam.z, 0, 0, d * cam.z, d * cam.x, d * cam.y);
};
function lightMasks(ts) {
  // B = luz intensa, D = luz fraca ou melhor
  const amb = scene.light || "day";
  const [bc, bx] = off("B"),
    [dc, dx] = off("D");
  if (amb === "day") {
    bx.fillStyle = dx.fillStyle = "#fff";
    bx.fillRect(0, 0, bc.width, bc.height);
    dx.fillRect(0, 0, dc.width, dc.height);
    return [bc, dc];
  }
  if (amb === "dim") {
    dx.fillStyle = "#fff";
    dx.fillRect(0, 0, dc.width, dc.height);
  }
  W(bx);
  W(dx);
  bx.fillStyle = dx.fillStyle = "#fff";
  for (const t of ts) {
    const l = LI(t);
    if (!l) continue;
    const R = unitPx(Math.max(l.rb, l.rd)),
      poly = losPoly(t.x, t.y, R, lightSkip(t));
    for (const [x, r] of [
      [bx, unitPx(l.rb)],
      [dx, unitPx(Math.max(l.rb, l.rd))],
    ]) {
      if (r <= 0) continue;
      x.save();
      x.beginPath();
      shapePath(x, t.x, t.y, R, 0, 0, poly);
      x.clip();
      x.beginPath();
      conePath(x, t.x, t.y, r, l.ang, t.a || 0);
      x.fill();
      x.restore();
    }
  }
  return [bc, dc];
}
function visibleMask(vs, ts) {
  // U = o que os tokens em vs enxergam; retorna [U, B]
  const [B, D] = lightMasks(ts);
  const [uc, ux] = off("U");
  for (const t of vs) {
    const v = VI(t);
    if (!v) continue;
    const R = unitPx(Math.max(v.rb, v.rd, v.rk, 0.1)),
      poly = losPoly(t.x, t.y, R);
    const [tc, tx] = off("T");
    // enxerga no escuro
    if (v.rk > 0) {
      W(tx);
      tx.fillStyle = "#fff";
      tx.beginPath();
      tx.arc(t.x, t.y, unitPx(v.rk), 0, Math.PI * 2);
      tx.fill();
    }
    // enxerga o que está iluminado, até o alcance de cada luz
    for (const [mask, r] of [
      [D, unitPx(v.rd)],
      [B, unitPx(v.rb)],
    ]) {
      if (r <= 0) continue;
      const [mc, mx] = off("M");
      mx.drawImage(mask, 0, 0);
      mx.globalCompositeOperation = "destination-in";
      W(mx);
      mx.beginPath();
      mx.arc(t.x, t.y, r, 0, Math.PI * 2);
      mx.fill();
      tx.setTransform(1, 0, 0, 1, 0, 0);
      tx.drawImage(mc, 0, 0);
    }
    // corta pela linha de visão (paredes) e pelo ângulo
    const [sc, sx] = off("S");
    W(sx);
    sx.fillStyle = "#fff";
    sx.save();
    sx.beginPath();
    conePath(sx, t.x, t.y, R * 1.02, v.ang, t.a || 0);
    sx.clip();
    sx.beginPath();
    shapePath(sx, t.x, t.y, R, 0, 0, poly);
    sx.fill();
    sx.restore();
    sx.beginPath();
    sx.arc(t.x, t.y, tokR(t) * 1.08, 0, Math.PI * 2);
    sx.fill(); // o próprio token
    tx.setTransform(1, 0, 0, 1, 0, 0);
    tx.globalCompositeOperation = "destination-in";
    tx.drawImage(sc, 0, 0);
    W(tx);
    tx.globalCompositeOperation = "source-over";
    tx.fillStyle = "#fff";
    tx.beginPath();
    tx.arc(t.x, t.y, tokR(t) * 1.08, 0, Math.PI * 2);
    tx.fill();
    ux.drawImage(tc, 0, 0);
  }
  return [uc, B];
}
function paintLighting(vs, alpha = 1) {
  if (!vs.length) return;
  const ts = curTs || tokens.map(t => (tokLive[t.id] ? { ...t, ...tokLive[t.id] } : t));
  const live = vs.map(t => ts.find(x => x.id === t.id) || t);
  const [U, B] = visibleMask(live, ts);
  const [oc, ox] = off("O");
  ox.fillStyle = "#060504";
  ox.fillRect(0, 0, oc.width, oc.height);
  const exI = exImage();
  if (exI && fog.exBox) {
    // lugares já vistos ficam à meia-luz (no formato exato do que foi visto)
    const [x0, y0, w, h] = fog.exBox;
    ox.globalCompositeOperation = "destination-out";
    ox.globalAlpha = 0.42;
    W(ox);
    ox.imageSmoothingEnabled = true;
    ox.drawImage(exI, x0, y0, w, h);
    ox.setTransform(1, 0, 0, 1, 0, 0);
    ox.globalAlpha = 1;
    ox.globalCompositeOperation = "source-over";
  }
  ox.globalCompositeOperation = "destination-out";
  ox.filter = `blur(${3 * LQ}px)`;
  ox.drawImage(U, 0, 0);
  ox.filter = "none";
  // penumbra: o que se vê sem luz intensa fica mais escuro
  const [pc, px] = off("P");
  px.drawImage(U, 0, 0);
  px.globalCompositeOperation = "destination-out";
  px.drawImage(B, 0, 0);
  px.globalCompositeOperation = "source-in";
  px.fillStyle = "#060504";
  px.fillRect(0, 0, pc.width, pc.height);
  ox.globalCompositeOperation = "source-over";
  ox.globalAlpha = 0.5;
  ox.filter = `blur(${3 * LQ}px)`;
  ox.drawImage(pc, 0, 0);
  ox.filter = "none";
  ox.globalAlpha = 1;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(oc, 0, 0, cv.width, cv.height);
  ctx.restore();
  // paredes destacadas por cima da escuridão, só onde o jogador enxerga (ou já viu, mais apagadas)
  const [wc, wx] = off("WL", true);
  W(wx);
  const hasW = paintWallsPlayer(wx);
  if (walls().some(w => w.d)) {
    W(wx);
    paintDoors(wx);
  }
  if (hasW || walls().some(w => w.d)) {
    const [mc, mx] = off("WM"),
      dpr = devicePixelRatio || 1,
      bl = Math.max(2, G().size * 0.12 * cam.z * dpr * LQ);
    if (exI && fog.exBox) {
      const [x0, y0, w, h] = fog.exBox;
      W(mx);
      mx.globalAlpha = 0.5;
      mx.drawImage(exI, x0, y0, w, h);
      mx.globalAlpha = 1;
      mx.setTransform(1, 0, 0, 1, 0, 0);
    }
    mx.filter = `blur(${bl}px)`;
    for (let k = 0; k < 3; k++) mx.drawImage(U, 0, 0);
    mx.filter = "none";
    wx.setTransform(1, 0, 0, 1, 0, 0);
    wx.globalCompositeOperation = "destination-in";
    wx.drawImage(mc, 0, 0, wc.width, wc.height);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = alpha;
    ctx.drawImage(wc, 0, 0);
    ctx.restore();
  }
}
function paintVisionGM(t) {
  // o mestre vê o alcance da visão (já cortado pelas paredes) tracejado
  const v = VI(t);
  if (!v) return;
  const R = unitPx(Math.max(v.rb, v.rd, v.rk, 0.1)),
    poly = losPoly(t.x, t.y, R);
  ctx.save();
  ctx.beginPath();
  conePath(ctx, t.x, t.y, R * 1.02, v.ang, t.a || 0);
  ctx.clip();
  ctx.beginPath();
  shapePath(ctx, t.x, t.y, R, 0, 0, poly);
  ctx.fillStyle = "rgba(255,236,170,.05)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,226,138,.5)";
  ctx.setLineDash([6 / cam.z, 5 / cam.z]);
  ctx.lineWidth = 1.5 / cam.z;
  ctx.stroke();
  ctx.restore();
}
function paintLightGlow(t) {
  // brilho quente das tochas, para todo mundo
  const l = LI(t);
  if (!l) return;
  const R = unitPx(Math.max(l.rb, l.rd)),
    poly = losPoly(t.x, t.y, R, lightSkip(t)),
    lc = l.c || "#ffbe5a";
  ctx.save();
  ctx.beginPath();
  shapePath(ctx, t.x, t.y, R, 0, 0, poly);
  ctx.clip();
  ctx.beginPath();
  conePath(ctx, t.x, t.y, R, l.ang, t.a || 0);
  ctx.clip();
  const g = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, R);
  g.addColorStop(0, hexA(lc, 0.26));
  g.addColorStop(Math.min(0.99, unitPx(l.rb) / R || 0.5), hexA(lc, 0.11));
  g.addColorStop(1, hexA(lc, 0));
  ctx.fillStyle = g;
  ctx.fillRect(t.x - R, t.y - R, R * 2, R * 2);
  ctx.restore();
}
function paintWalls() {
  ctx.save();
  ctx.lineCap = "round";
  for (const w of walls()) {
    if (w.c) {
      ctx.beginPath();
      ctx.arc(w.c[0], w.c[1], w.r, 0, Math.PI * 2);
      ctx.lineWidth = 4 / cam.z;
      ctx.strokeStyle = "rgba(240,130,60,.9)";
      ctx.setLineDash([]);
      ctx.stroke();
      continue;
    }
    const [x1, y1, x2, y2] = w.p;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    if (w.d) {
      ctx.lineWidth = 7 / cam.z;
      ctx.strokeStyle = w.o ? "rgba(95,190,110,.9)" : w.s ? "#b86ae0" : "#b07a3a";
      ctx.setLineDash(w.o ? [6 / cam.z, 6 / cam.z] : []);
    } else {
      ctx.lineWidth = 4 / cam.z;
      ctx.strokeStyle = "rgba(240,130,60,.9)";
      ctx.setLineDash([]);
    }
    ctx.stroke();
    if (w.d && w.lk) {
      ctx.save();
      ctx.setLineDash([]);
      const fs = Math.max(12 / cam.z, G().size * 0.28);
      ctx.font = `${fs}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "#000";
      ctx.shadowBlur = 4;
      ctx.fillText("🔒", (x1 + x2) / 2, (y1 + y2) / 2);
      ctx.restore();
    }
  }
  ctx.setLineDash([]);
  if (wallDraft && hoverWall) {
    ctx.beginPath();
    ctx.moveTo(...wallDraft);
    ctx.lineTo(...hoverWall);
    ctx.lineWidth = 3 / cam.z;
    ctx.strokeStyle = opt.wall === "door" ? "#b07a3a" : "rgba(240,130,60,.8)";
    ctx.setLineDash([8 / cam.z, 6 / cam.z]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (drag?.kind === "wallhide") {
    const { pa, pb } = hideSeg(drag);
    ctx.beginPath();
    ctx.moveTo(...pa);
    ctx.lineTo(...pb);
    ctx.lineWidth = 8 / cam.z;
    ctx.strokeStyle = "rgba(184,106,224,.85)";
    ctx.setLineDash([8 / cam.z, 5 / cam.z]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (drag?.kind === "wallcircle" && drag.r > 0) {
    ctx.beginPath();
    ctx.arc(drag.c[0], drag.c[1], drag.r, 0, Math.PI * 2);
    ctx.lineWidth = 3 / cam.z;
    ctx.strokeStyle = "rgba(240,130,60,.8)";
    ctx.setLineDash([8 / cam.z, 6 / cam.z]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (tool === "wall")
    for (const [x, y, kind] of wallHandles()) {
      ctx.beginPath();
      ctx.arc(x, y, (kind === "p" ? 4.5 : 5.5) / cam.z, 0, Math.PI * 2);
      ctx.fillStyle = kind === "r" ? "#7fb2e8" : "#ffe28a";
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,.6)";
      ctx.lineWidth = 1 / cam.z;
      ctx.stroke();
    }
  ctx.restore();
}
function gridVertexNear(x, y) {
  const g = G();
  if (g.type === "square")
    return [g.ox + Math.round((x - g.ox) / g.size) * g.size, g.oy + Math.round((y - g.oy) / g.size) * g.size];
  const [a, b] = cellAt(x, y);
  let best = null,
    bd = Infinity;
  for (const [vx, vy] of hexCornersL(...cellCenterL(a, b), g.size / SQ3)) {
    const dd = Math.hypot(vx - x, vy - y);
    if (dd < bd) {
      bd = dd;
      best = [vx, vy];
    }
  }
  return best;
}
function wallHandles() {
  // pontos que dá para arrastar: pontas das paredes, centro e borda dos círculos
  const out = [];
  for (const w of walls()) {
    if (w.c) {
      out.push([w.c[0], w.c[1], "c", w]);
      out.push([w.c[0] + w.r, w.c[1], "r", w]);
    } else if (w.p) {
      out.push([w.p[0], w.p[1], "p", w, 0]);
      out.push([w.p[2], w.p[3], "p", w, 1]);
    }
  }
  return out;
}
function handleAt(x, y) {
  const tol = 10 / cam.z;
  let best = null,
    bd = tol;
  for (const h of wallHandles()) {
    const d = Math.hypot(h[0] - x, h[1] - y);
    if (d < bd) {
      bd = d;
      best = h;
    }
  }
  return best;
}
function snapWall(x, y, free, skip) {
  const tol = 12 / cam.z;
  for (const w of walls())
    if (w.p && w !== skip)
      for (const [ex, ey] of [
        [w.p[0], w.p[1]],
        [w.p[2], w.p[3]],
      ])
        if (Math.hypot(ex - x, ey - y) < tol) return [ex, ey];
  if (free) return [Math.round(x), Math.round(y)];
  const v = gridVertexNear(x, y);
  return Math.hypot(v[0] - x, v[1] - y) < G().size * 0.3
    ? [Math.round(v[0] * 10) / 10, Math.round(v[1] * 10) / 10]
    : [Math.round(x), Math.round(y)];
}
function hideRange(w, x, y) {
  // posição ao longo da parede, em casas da grid (arredondada para baixo)
  const [x1, y1, x2, y2] = w.p,
    L = Math.hypot(x2 - x1, y2 - y1),
    cs = G().size,
    u = ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / (L * L);
  return Math.max(0, Math.min(Math.ceil(L / cs - 0.01) - 1, Math.floor((u * L) / cs)));
}
function hideSeg(d) {
  // [ini, fim] em pixels ao longo da parede
  const [x1, y1, x2, y2] = d.w.p,
    L = Math.hypot(x2 - x1, y2 - y1),
    cs = G().size,
    a = Math.min(d.a, d.b) * cs,
    b = Math.min(L, (Math.max(d.a, d.b) + 1) * cs),
    P = t => [
      Math.round((x1 + ((x2 - x1) * t) / L) * 10) / 10,
      Math.round((y1 + ((y2 - y1) * t) / L) * 10) / 10,
    ];
  return { L, a, b, pa: P(a), pb: P(b) };
}
function wallAt(x, y) {
  const tol = 8 / cam.z;
  let bi = -1,
    bd = tol;
  walls().forEach((w, i) => {
    const d = w.c
      ? Math.abs(Math.hypot(x - w.c[0], y - w.c[1]) - w.r)
      : distSeg(x, y, [w.p[0], w.p[1]], [w.p[2], w.p[3]]);
    if (d < bd) {
      bd = d;
      bi = i;
    }
  });
  return bi;
}
function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i],
      [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function inCone(t, x, y, ang) {
  if (!(ang < 360)) return true;
  const [vx, vy] = dirVec(t.a || 0),
    dx = x - t.x,
    dy = y - t.y,
    L = Math.hypot(dx, dy) || 1;
  return (Math.acos(Math.max(-1, Math.min(1, (dx * vx + dy * vy) / L))) * 180) / Math.PI <= ang / 2 + 0.5;
}
function lightAt(x, y, ts) {
  // 2 = luz intensa, 1 = fraca, 0 = escuro
  const amb = scene.light || "day";
  if (amb === "day") return 2;
  let lvl = amb === "dim" ? 1 : 0;
  for (const t of ts) {
    const l = LI(t);
    if (!l) continue;
    const d = Math.hypot(x - t.x, y - t.y),
      R = unitPx(Math.max(l.rb, l.rd));
    if (d > R || !inCone(t, x, y, l.ang)) continue;
    const poly = losPoly(t.x, t.y, R, lightSkip(t));
    if (poly && !pointInPoly(x, y, poly)) continue;
    if (d <= unitPx(l.rb)) return 2;
    lvl = Math.max(lvl, 1);
  }
  return lvl;
}
function sees(t, x, y, ts) {
  const v = VI(t);
  if (!v) return false;
  const d = Math.hypot(x - t.x, y - t.y),
    R = unitPx(Math.max(v.rb, v.rd, v.rk, 0.1));
  if (d > R) return false;
  if (d <= tokR(t)) return true;
  if (!inCone(t, x, y, v.ang)) return false;
  const poly = losPoly(t.x, t.y, R);
  if (poly && !pointInPoly(x, y, poly)) return false;
  if (d <= unitPx(v.rk)) return true;
  const lv = lightAt(x, y, ts);
  return (lv === 2 && d <= unitPx(v.rb)) || (lv >= 1 && d <= unitPx(v.rd));
}

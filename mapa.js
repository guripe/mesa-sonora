"use strict";
// Mesa Sonora · Mapa de batalha (grid, tokens, névoa, desenhos, régua)
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid = () => Math.random().toString(36).slice(2, 10);
const SQ3 = Math.sqrt(3);
const I = {
  move:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3l14 8-6 2-2 6z"/></svg>',
  ruler:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2m1-5 2 2m1-5 2 2"/></svg>',
  draw:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l4-1L19 8l-3-3L5 16z"/><path d="m14 7 3 3"/></svg>',
  erase:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="m4 15 9-9 7 7-6 6H8z"/><path d="M8 19h12M9 10l6 6"/></svg>',
  fog:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  token:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6.5 18.5c1.5-2.5 3.3-3.5 5.5-3.5s4 1 5.5 3.5"/></svg>',
  gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  minus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14"/></svg>',
  fit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  cast:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="2"/><path d="M8.5 8.5a5 5 0 0 0 0 7m7 0a5 5 0 0 0 0-7M5.6 5.6a9 9 0 0 0 0 12.8m12.8 0a9 9 0 0 0 0-12.8"/></svg>',
  pen:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 17c3-6 5 2 8-3s5-6 10-4"/></svg>',
  line:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20 20 4"/></svg>',
  circle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/></svg>',
  cone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 12 20 4v16z"/></svg>',
  rect:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="5" width="16" height="14" rx="1"/></svg>',
  brush:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 4l6 6-8 8H6v-6z"/></svg>',
  back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>',
};
const COLORS = ["#d0a54c", "#c0473a", "#4a72b8", "#5f9a4a", "#8a5bb0", "#e07b2e", "#e8e2d0", "#222222"];

// ---------- estado ----------
let sb = null, chan = null, isGM = false;
let scene = {bg: null, bgW: 0, bgH: 0, grid: {type: "square", size: 70, ox: 0, oy: 0, color: "#000000", alpha: .35, show: true, unit: 1.5, unitName: "m"}};
let tokens = [], fog = {on: false, cells: {}}, drawings = [];
const cam = {x: 0, y: 0, z: 1};                 // tela = mundo * z + (x, y)
let tool = "move";
const opt = {draw: "pen", color: "#c0473a", width: 4, fog: "reveal", fogShape: "brush", brush: 1};
let dirty = true, bgImg = null, bgUrlLoaded = null;
const imgCache = new Map();
let drag = null, hoverFog = null;
const lastSave = {};                                 // interação em andamento
let rulers = {};                                 // réguas ao vivo {key: {a, b}}
let tokLive = {};                                // posições temporárias vindas por broadcast
let selTok = null;
const myKey = (crypto.randomUUID?.() || String(Math.random())).slice(0, 10);
let spaceDown = false;

const cv = $("#board"), ctx = cv.getContext("2d");
function resize(){ const d = devicePixelRatio || 1; cv.width = innerWidth * d; cv.height = innerHeight * d; cv.style.width = innerWidth + "px"; cv.style.height = innerHeight + "px"; dirty = true; }
addEventListener("resize", resize); resize();

function toast(msg, ms = 3000){ const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), ms); }

// ---------- geometria da grid ----------
const G = () => scene.grid;
const toWorld = (sx, sy) => [(sx - cam.x) / cam.z, (sy - cam.y) / cam.z];
function cellAt(x, y){
  const g = G();
  if (g.type === "hex") {
    const R = g.size / SQ3, px = x - g.ox, py = y - g.oy;
    let q = (SQ3 / 3 * px - py / 3) / R, r = (2 / 3 * py) / R, s = -q - r;
    let rq = Math.round(q), rr = Math.round(r), rs = Math.round(s);
    const dq = Math.abs(rq - q), dr = Math.abs(rr - r), ds = Math.abs(rs - s);
    if (dq > dr && dq > ds) rq = -rr - rs; else if (dr > ds) rr = -rq - rs;
    return [rq, rr];
  }
  return [Math.floor((x - g.ox) / g.size), Math.floor((y - g.oy) / g.size)];
}
function cellCenter(a, b){
  const g = G();
  if (g.type === "hex") { const R = g.size / SQ3; return [g.ox + g.size * (a + b / 2), g.oy + 1.5 * R * b]; }
  return [g.ox + (a + .5) * g.size, g.oy + (b + .5) * g.size];
}
function cellPath(c, a, b){
  const g = G(), [cx, cy] = cellCenter(a, b);
  if (g.type === "hex") {
    const R = g.size / SQ3 + .6 / cam.z;
    for (let i = 0; i < 6; i++) { const ang = Math.PI / 180 * (60 * i - 30); const x = cx + R * Math.cos(ang), y = cy + R * Math.sin(ang); i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.closePath();
  } else { const h = g.size / 2 + .5 / cam.z; c.rect(cx - h, cy - h, h * 2, h * 2); }
}
function cellDist(a1, b1, a2, b2){
  if (G().type === "hex") { const dq = a1 - a2, dr = b1 - b2; return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2; }
  return Math.max(Math.abs(a1 - a2), Math.abs(b1 - b2));
}
function cellsInRange(a, b, n){ // células a no máximo n-1 passos
  const out = [], k = n - 1;
  for (let i = -k; i <= k; i++) for (let j = -k; j <= k; j++) {
    const ca = a + i, cb = b + j;
    if (G().type === "hex" ? cellDist(a, b, ca, cb) <= k : i * i + j * j <= k * k + k) out.push([ca, cb]);
  }
  return out;
}
function snapPoint(x, y, cells = 1){
  const g = G();
  if (g.type === "square" && cells % 2 === 0) return [g.ox + Math.round((x - g.ox) / g.size) * g.size, g.oy + Math.round((y - g.oy) / g.size) * g.size];
  const [a, b] = cellAt(x, y); return cellCenter(a, b);
}
function visibleWorld(){ const [x0, y0] = toWorld(0, 0), [x1, y1] = toWorld(innerWidth, innerHeight); return {x0, y0, x1, y1}; }
function unitsFor(cells){ const g = G(); const v = Math.round(cells * g.unit * 10) / 10; return `${cells} ${cells === 1 ? "casa" : "casas"} · ${String(v).replace(".", ",")} ${g.unitName}`; }
const fogSig = () => `${G().type}:${G().size}:${G().ox}:${G().oy}`;

// ---------- desenho ----------
function getImg(url){
  if (!url) return null;
  let e = imgCache.get(url);
  if (!e) { e = new Image(); e.crossOrigin = "anonymous"; e.onload = () => { dirty = true; }; e.onerror = () => { e.bad = true; }; e.src = url; imgCache.set(url, e); }
  return e.complete && e.naturalWidth && !e.bad ? e : null;
}
function frame(){
  if (dirty) { dirty = false; paint(); }
  requestAnimationFrame(frame);
}
function paint(){
  const d = devicePixelRatio || 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#0d0b09"; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.setTransform(d * cam.z, 0, 0, d * cam.z, d * cam.x, d * cam.y);
  const vw = visibleWorld();
  // fundo
  const img = scene.bg ? getImg(scene.bg) : null;
  if (img) ctx.drawImage(img, 0, 0, scene.bgW || img.naturalWidth, scene.bgH || img.naturalHeight);
  else { ctx.fillStyle = "#1b1611"; ctx.fillRect(vw.x0, vw.y0, vw.x1 - vw.x0, vw.y1 - vw.y0); }
  // grid
  const g = G();
  if (g.show && g.size * cam.z >= 7) {
    ctx.beginPath();
    if (g.type === "hex") {
      const R = g.size / SQ3, rowH = 1.5 * R;
      const r0 = Math.floor((vw.y0 - g.oy) / rowH) - 1, r1 = Math.ceil((vw.y1 - g.oy) / rowH) + 1;
      for (let r = r0; r <= r1; r++) {
        const q0 = Math.floor((vw.x0 - g.ox) / g.size - r / 2) - 1, q1 = Math.ceil((vw.x1 - g.ox) / g.size - r / 2) + 1;
        for (let q = q0; q <= q1; q++) {
          const [cx, cy] = cellCenter(q, r);
          for (let i = 0; i < 3; i++) { // 3 arestas por hex bastam (as outras são das vizinhas)
            const a1 = Math.PI / 180 * (60 * (i + 2) - 30), a2 = Math.PI / 180 * (60 * (i + 3) - 30);
            ctx.moveTo(cx + R * Math.cos(a1), cy + R * Math.sin(a1)); ctx.lineTo(cx + R * Math.cos(a2), cy + R * Math.sin(a2));
          }
        }
      }
    } else {
      const s = g.size, x0 = Math.floor((vw.x0 - g.ox) / s) * s + g.ox, y0 = Math.floor((vw.y0 - g.oy) / s) * s + g.oy;
      for (let x = x0; x <= vw.x1; x += s) { ctx.moveTo(x, vw.y0); ctx.lineTo(x, vw.y1); }
      for (let y = y0; y <= vw.y1; y += s) { ctx.moveTo(vw.x0, y); ctx.lineTo(vw.x1, y); }
    }
    ctx.strokeStyle = g.color; ctx.globalAlpha = g.alpha; ctx.lineWidth = 1 / cam.z; ctx.stroke(); ctx.globalAlpha = 1;
  }
  // desenhos
  for (const dr of drawings) paintDrawing(dr);
  if (drag?.kind === "draw" && drag.shape) paintDrawing(drag.shape, true);
  // tokens
  const ts = tokens.map(t => tokLive[t.id] ? {...t, ...tokLive[t.id]} : t);
  for (const t of ts) if (isGM || !t.h) paintToken(t);
  // névoa
  if (fog.on) paintFog();
  if (drag?.kind === "fogrect") { const {a, b} = drag; ctx.strokeStyle = opt.fog === "reveal" ? "#ffe28a" : "#e0735e"; ctx.setLineDash([8 / cam.z, 6 / cam.z]); ctx.lineWidth = 2 / cam.z; ctx.strokeRect(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])); ctx.setLineDash([]); }
  const brushAt = drag?.kind === "fogbrush" ? drag.at : (!drag && tool === "fog" && isGM && opt.fogShape === "brush" ? hoverFog : null);
  if (brushAt) { const [a, b] = cellAt(...brushAt); ctx.beginPath(); for (const [ca, cb] of cellsInRange(a, b, opt.brush)) cellPath(ctx, ca, cb); ctx.strokeStyle = opt.fog === "reveal" ? "#ffe28a" : "#e0735e"; ctx.lineWidth = 2 / cam.z; ctx.stroke(); }
  // réguas
  for (const k in rulers) paintRuler(rulers[k], k === myKey);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
function paintDrawing(dr, live){
  const [a, b] = [dr.p[0], dr.p[dr.p.length - 1]];
  ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = dr.w; ctx.strokeStyle = dr.c; ctx.fillStyle = dr.c;
  ctx.beginPath();
  if (dr.t === "pen" || dr.t === "line") { dr.p.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); }
  else {
    if (dr.t === "circle") ctx.arc(a[0], a[1], Math.hypot(b[0] - a[0], b[1] - a[1]), 0, Math.PI * 2);
    else if (dr.t === "rect") ctx.rect(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
    else if (dr.t === "cone") { const pts = conePts(a, b); ctx.moveTo(...pts[0]); ctx.lineTo(...pts[1]); ctx.lineTo(...pts[2]); ctx.closePath(); }
    ctx.globalAlpha = .22; ctx.fill(); ctx.globalAlpha = 1; ctx.stroke();
  }
  if (live && dr.t !== "pen") {
    const dist = Math.hypot(b[0] - a[0], b[1] - a[1]) / G().size;
    const cells = Math.round(dist * 10) / 10;
    label(b[0], b[1], `${String(cells).replace(".", ",")} casas · ${String(Math.round(cells * G().unit * 10) / 10).replace(".", ",")} ${G().unitName}`);
  }
}
function conePts(a, b){ const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, h = L / 2; return [a, [b[0] + nx * h, b[1] + ny * h], [b[0] - nx * h, b[1] - ny * h]]; }
function label(x, y, text){
  const fs = 14 / cam.z; ctx.font = `700 ${fs}px "Alegreya Sans", sans-serif`;
  const w = ctx.measureText(text).width + 14 / cam.z, h = 22 / cam.z, lx = x + 12 / cam.z, ly = y - h - 6 / cam.z;
  ctx.fillStyle = "rgba(23,19,15,.92)"; ctx.strokeStyle = "#d0a54c"; ctx.lineWidth = 1 / cam.z;
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(lx, ly, w, h, 6 / cam.z) : ctx.rect(lx, ly, w, h); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#eee2c9"; ctx.textBaseline = "middle"; ctx.fillText(text, lx + 7 / cam.z, ly + h / 2);
}
function paintToken(t){
  const g = G(), r = (t.s || 1) * g.size / 2 * .88;
  ctx.save();
  if (t.h) ctx.globalAlpha = .45;
  ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
  ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
  ctx.fillStyle = t.c || "#d0a54c"; ctx.fill(); ctx.shadowColor = "transparent";
  const im = getImg(t.img);
  if (im) { ctx.save(); ctx.beginPath(); ctx.arc(t.x, t.y, r * .86, 0, Math.PI * 2); ctx.clip(); const s = Math.max(r * 2 / im.naturalWidth, r * 2 / im.naturalHeight) * .86; ctx.drawImage(im, t.x - im.naturalWidth * s / 2, t.y - im.naturalHeight * s / 2, im.naturalWidth * s, im.naturalHeight * s); ctx.restore(); }
  else { ctx.fillStyle = "#1a130b"; ctx.font = `700 ${r * .8}px "Alegreya Sans", sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText((t.n || "?").trim().slice(0, 2).toUpperCase(), t.x, t.y + r * .04); }
  ctx.lineWidth = Math.max(2, r * .1); ctx.strokeStyle = selTok === t.id ? "#fff" : "rgba(0,0,0,.55)"; ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, Math.PI * 2); ctx.stroke();
  if (t.n && g.size * cam.z > 26) {
    const fs = Math.max(11 / cam.z, r * .38); ctx.font = `700 ${fs}px "Alegreya Sans", sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "top";
    const w = ctx.measureText(t.n).width + fs * .8;
    ctx.fillStyle = "rgba(23,19,15,.85)"; ctx.fillRect(t.x - w / 2, t.y + r + 2, w, fs * 1.3);
    ctx.fillStyle = "#eee2c9"; ctx.fillText(t.n, t.x, t.y + r + 2 + fs * .15);
  }
  if (t.h) { ctx.globalAlpha = 1; ctx.fillStyle = "#e0735e"; ctx.font = `700 ${r * .5}px sans-serif`; ctx.textAlign = "center"; ctx.fillText("oculto", t.x, t.y - r - r * .35); }
  ctx.restore();
}
let fogCv = document.createElement("canvas"), fctx = fogCv.getContext("2d");
function paintFog(){
  const d = devicePixelRatio || 1;
  if (fogCv.width !== cv.width || fogCv.height !== cv.height) { fogCv.width = cv.width; fogCv.height = cv.height; }
  fctx.setTransform(1, 0, 0, 1, 0, 0); fctx.globalCompositeOperation = "source-over";
  fctx.clearRect(0, 0, fogCv.width, fogCv.height);
  fctx.fillStyle = isGM ? "rgba(8,6,5,.62)" : "#0b0907"; fctx.fillRect(0, 0, fogCv.width, fogCv.height);
  fctx.setTransform(d * cam.z, 0, 0, d * cam.z, d * cam.x, d * cam.y);
  fctx.globalCompositeOperation = "destination-out"; fctx.fillStyle = "#000";
  const vw = visibleWorld(), pad = G().size;
  fctx.beginPath();
  for (const k in fog.cells) { const [a, b] = k.split(",").map(Number); const [x, y] = cellCenter(a, b); if (x < vw.x0 - pad || x > vw.x1 + pad || y < vw.y0 - pad || y > vw.y1 + pad) continue; cellPath(fctx, a, b); }
  fctx.fill();
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(fogCv, 0, 0); ctx.restore();
}
function paintRuler(rl, mine){
  if (!rl?.a || !rl?.b) return;
  const [a, b] = [rl.a, rl.b];
  ctx.strokeStyle = mine ? "#d0a54c" : "#7fb2e8"; ctx.lineWidth = 3 / cam.z; ctx.setLineDash([10 / cam.z, 6 / cam.z]);
  ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); ctx.setLineDash([]);
  for (const p of [a, b]) { ctx.beginPath(); ctx.arc(p[0], p[1], 5 / cam.z, 0, Math.PI * 2); ctx.fillStyle = ctx.strokeStyle; ctx.fill(); }
  const [a1, b1] = cellAt(...a), [a2, b2] = cellAt(...b);
  label(b[0], b[1], unitsFor(cellDist(a1, b1, a2, b2)));
}

// ---------- câmera ----------
function zoomAt(f, sx = innerWidth / 2, sy = innerHeight / 2){
  const nz = Math.max(.1, Math.min(6, cam.z * f));
  const [wx, wy] = toWorld(sx, sy); cam.z = nz; cam.x = sx - wx * nz; cam.y = sy - wy * nz; dirty = true; drawTop();
}
function fit(){
  const w = scene.bgW || 1600, h = scene.bgH || 1000;
  cam.z = Math.min(innerWidth / w, innerHeight / h) * .92; cam.x = (innerWidth - w * cam.z) / 2; cam.y = (innerHeight - h * cam.z) / 2; dirty = true; drawTop();
}
function centerOn(wx, wy, z){ cam.z = z; cam.x = innerWidth / 2 - wx * z; cam.y = innerHeight / 2 - wy * z; dirty = true; drawTop(); }

// ---------- interação ----------
const pts = new Map();
cv.addEventListener("contextmenu", e => e.preventDefault());
cv.addEventListener("wheel", e => { e.preventDefault(); zoomAt(Math.exp(-e.deltaY * .0015), e.clientX, e.clientY); }, {passive: false});
function hitToken(x, y){
  for (let i = tokens.length - 1; i >= 0; i--) { const t = tokens[i]; if (!isGM && t.h) continue; const r = (t.s || 1) * G().size / 2 * .88; if (Math.hypot(t.x - x, t.y - y) <= r) return t; }
  return null;
}
cv.addEventListener("pointerdown", e => {
  cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); closeFlyoutSoft();
  if (pts.size === 2) { const [p1, p2] = [...pts.values()]; drag = {kind: "pinch", d: Math.hypot(p1[0] - p2[0], p1[1] - p2[1]), z: cam.z}; return; }
  const [wx, wy] = toWorld(e.clientX, e.clientY);
  if (e.button === 1 || e.button === 2 || spaceDown) { drag = {kind: "pan", sx: e.clientX, sy: e.clientY, cx: cam.x, cy: cam.y}; cv.classList.add("panning"); return; }
  if (tool === "move") {
    const t = hitToken(wx, wy);
    if (t && isGM) { selTok = t.id; drag = {kind: "token", t, dx: t.x - wx, dy: t.y - wy, moved: false}; dirty = true; return; }
    selTok = null; dirty = true;
    drag = {kind: "pan", sx: e.clientX, sy: e.clientY, cx: cam.x, cy: cam.y}; cv.classList.add("panning"); return;
  }
  if (tool === "ruler") { const a = snapPoint(wx, wy); rulers[myKey] = {a, b: a}; drag = {kind: "ruler"}; dirty = true; sendRuler(); return; }
  if (!isGM) return;
  if (tool === "draw") { const p = [Math.round(wx), Math.round(wy)]; drag = {kind: "draw", shape: {id: uid(), t: opt.draw, c: opt.color, w: opt.width, p: opt.draw === "pen" ? [p] : [p, p]}}; return; }
  if (tool === "erase") { eraseAt(wx, wy); drag = {kind: "erase"}; return; }
  if (tool === "fog") {
    if (opt.fogShape === "rect") { drag = {kind: "fogrect", a: [wx, wy], b: [wx, wy]}; return; }
    drag = {kind: "fogbrush", at: [wx, wy]}; fogBrush(wx, wy); return;
  }
});
cv.addEventListener("pointermove", e => {
  if (pts.has(e.pointerId)) pts.set(e.pointerId, [e.clientX, e.clientY]);
  const [wx, wy] = toWorld(e.clientX, e.clientY);
  if (!drag) { if (tool === "fog" && isGM && opt.fogShape === "brush") { hoverFog = [wx, wy]; dirty = true; } return; }
  if (drag.kind === "pinch" && pts.size === 2) { const [p1, p2] = [...pts.values()]; const d = Math.hypot(p1[0] - p2[0], p1[1] - p2[1]); zoomAt((drag.z * d / drag.d) / cam.z, (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2); return; }
  if (drag.kind === "pan") { cam.x = drag.cx + e.clientX - drag.sx; cam.y = drag.cy + e.clientY - drag.sy; dirty = true; return; }
  if (drag.kind === "token") { drag.t.x = wx + drag.dx; drag.t.y = wy + drag.dy; drag.moved = true; dirty = true; sendTok(drag.t); return; }
  if (drag.kind === "ruler") { rulers[myKey].b = snapPoint(wx, wy); dirty = true; sendRuler(); return; }
  if (drag.kind === "draw") { const p = [Math.round(wx), Math.round(wy)], s = drag.shape; if (s.t === "pen") { const l = s.p[s.p.length - 1]; if (Math.hypot(l[0] - p[0], l[1] - p[1]) > 2 / cam.z) s.p.push(p); } else s.p[1] = p; dirty = true; return; }
  if (drag.kind === "erase") { eraseAt(wx, wy); return; }
  if (drag.kind === "fogrect") { drag.b = [wx, wy]; dirty = true; return; }
  if (drag.kind === "fogbrush") { drag.at = [wx, wy]; fogBrush(wx, wy); return; }
});
function endPointer(e){
  pts.delete(e.pointerId); cv.classList.remove("panning");
  if (!drag) return;
  const d = drag; drag = null;
  if (d.kind === "pinch") return;
  if (d.kind === "token") {
    if (d.moved) { const [x, y] = snapPoint(d.t.x, d.t.y, d.t.s || 1); d.t.x = x; d.t.y = y; delete tokLive[d.t.id]; send("tok", {id: d.t.id, x, y}); save("tokens"); }
    dirty = true; return;
  }
  if (d.kind === "ruler") { const rl = rulers[myKey]; setTimeout(() => { if (rulers[myKey] === rl) { delete rulers[myKey]; dirty = true; sendRuler(); } }, 2500); return; }
  if (d.kind === "draw") { const s = d.shape; if (s.p.length > 1 && (s.t === "pen" || Math.hypot(s.p[1][0] - s.p[0][0], s.p[1][1] - s.p[0][1]) > 3)) { drawings.push(s); save("drawings"); } dirty = true; return; }
  if (d.kind === "erase") { if (d.changed) save("drawings"); return; }
  if (d.kind === "fogrect") { fogRect(d.a, d.b); dirty = true; return; }
  if (d.kind === "fogbrush") { save("fog"); dirty = true; }
}
cv.addEventListener("pointerup", endPointer); cv.addEventListener("pointercancel", endPointer);
cv.addEventListener("dblclick", e => { if (!isGM) return; const [wx, wy] = toWorld(e.clientX, e.clientY); const t = hitToken(wx, wy); if (t) openTokenPanel(t); });
addEventListener("keydown", e => {
  if (e.target.closest?.("input,textarea,select")) return;
  if (e.code === "Space") { spaceDown = true; cv.classList.add("panning"); e.preventDefault(); return; }
  const k = e.key.toLowerCase();
  if (k === "escape") { if (rulers[myKey]) { delete rulers[myKey]; sendRuler(); dirty = true; } closePanel(); closeFlyout(); selTok = null; return; }
  if (k === "+" || k === "=") return zoomAt(1.2);
  if (k === "-") return zoomAt(1 / 1.2);
  if (k === "0") return fit();
  const map = {v: "move", r: "ruler", d: "draw", e: "erase", f: "fog"};
  if (map[k] && (isGM || k === "v" || k === "r")) setTool(map[k]);
  if ((k === "delete" || k === "backspace") && selTok && isGM) { const t = tokens.find(x => x.id === selTok); if (t && confirm(`Remover o token “${t.n || "sem nome"}”?`)) { tokens = tokens.filter(x => x !== t); selTok = null; save("tokens"); dirty = true; } }
});
addEventListener("keyup", e => { if (e.code === "Space") { spaceDown = false; cv.classList.remove("panning"); } });

function distSeg(px, py, [x1, y1], [x2, y2]){ const dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy; let t = L ? ((px - x1) * dx + (py - y1) * dy) / L : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - x1 - t * dx, py - y1 - t * dy); }
function inTri(p, a, b, c){ const s = (a, b, c) => (a[0] - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (a[1] - c[1]); const d1 = s(p, a, b), d2 = s(p, b, c), d3 = s(p, c, a); return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0)); }
function hitDrawing(dr, x, y){
  const tol = dr.w / 2 + 6 / cam.z, a = dr.p[0], b = dr.p[dr.p.length - 1];
  if (dr.t === "pen" || dr.t === "line") { for (let i = 1; i < dr.p.length; i++) if (distSeg(x, y, dr.p[i - 1], dr.p[i]) <= tol) return true; return dr.p.length === 1 && Math.hypot(a[0] - x, a[1] - y) <= tol; }
  if (dr.t === "circle") return Math.hypot(x - a[0], y - a[1]) <= Math.hypot(b[0] - a[0], b[1] - a[1]) + tol;
  if (dr.t === "rect") return x >= Math.min(a[0], b[0]) - tol && x <= Math.max(a[0], b[0]) + tol && y >= Math.min(a[1], b[1]) - tol && y <= Math.max(a[1], b[1]) + tol;
  if (dr.t === "cone") { const p = conePts(a, b); return inTri([x, y], ...p); }
  return false;
}
function eraseAt(x, y){ for (let i = drawings.length - 1; i >= 0; i--) if (hitDrawing(drawings[i], x, y)) { drawings.splice(i, 1); if (drag) drag.changed = true; dirty = true; return; } }
function fogBrush(x, y){
  const [a, b] = cellAt(x, y);
  for (const [ca, cb] of cellsInRange(a, b, opt.brush)) { const k = ca + "," + cb; if (opt.fog === "reveal") fog.cells[k] = 1; else delete fog.cells[k]; }
  fog.sig = fogSig(); dirty = true;
}
function fogRect(p, q){
  const x0 = Math.min(p[0], q[0]), x1 = Math.max(p[0], q[0]), y0 = Math.min(p[1], q[1]), y1 = Math.max(p[1], q[1]);
  const [a0, b0] = cellAt(x0, y0), [a1, b1] = cellAt(x1, y1);
  const pad = G().type === "hex" ? 2 + Math.ceil((b1 - b0) / 2) : 1;
  for (let a = Math.min(a0, a1) - pad; a <= Math.max(a0, a1) + pad; a++) for (let b = Math.min(b0, b1) - 1; b <= Math.max(b0, b1) + 1; b++) {
    const [cx, cy] = cellCenter(a, b); if (cx < x0 || cx > x1 || cy < y0 || cy > y1) continue;
    const k = a + "," + b; if (opt.fog === "reveal") fog.cells[k] = 1; else delete fog.cells[k];
  }
  fog.sig = fogSig(); save("fog");
}

// ---------- rede ----------
let tokT = 0;
function send(event, payload){ chan?.send({type: "broadcast", event, payload}); }
function sendTok(t){ const now = performance.now(); if (now - tokT < 45) return; tokT = now; send("tok", {id: t.id, x: Math.round(t.x), y: Math.round(t.y), live: 1}); }
let rulerT = 0, rulerPending = null;
function sendRuler(){
  const now = performance.now(); clearTimeout(rulerPending);
  if (now - rulerT < 50) { rulerPending = setTimeout(sendRuler, 55); return; }
  rulerT = now; send("ruler", {k: myKey, r: rulers[myKey] || null});
}
const saveTimers = {};
function save(col){
  if (!isGM) return;
  clearTimeout(saveTimers[col]); lastSave[col] = Date.now();
  saveTimers[col] = setTimeout(async () => {
    const val = col === "scene" ? scene : col === "tokens" ? tokens : col === "fog" ? fog : drawings;
    lastSave[col] = Date.now();
    const {error} = await sb.from("map_state").update({[col]: val, updated_at: new Date().toISOString()}).eq("id", 1);
    if (error) toast("Não salvei o mapa: " + error.message);
  }, col === "fog" ? 150 : 60);
}
async function load(){
  const {data, error} = await sb.from("map_state").select("*").eq("id", 1).maybeSingle();
  if (error) { $("#gate").innerHTML = `O mapa ainda não foi ativado no banco.<br><small>${esc(error.message)}</small>`; $("#gate").hidden = false; return false; }
  apply(data || {});
  return true;
}
function apply(d){
  const fresh = col => !isGM || !lastSave[col] || Date.now() - lastSave[col] > 1500; // ignora o eco das próprias edições
  if (d.scene && fresh("scene")) scene = {...scene, ...d.scene, grid: {...scene.grid, ...(d.scene.grid || {})}};
  if (d.tokens && fresh("tokens") && !(drag?.kind === "token")) tokens = d.tokens;
  if (d.fog && fresh("fog") && !(drag?.kind?.startsWith("fog"))) fog = {on: !!d.fog.on, cells: d.fog.cells || {}, sig: d.fog.sig};
  if (d.drawings && fresh("drawings") && drag?.kind !== "draw") drawings = d.drawings;
  dirty = true; drawTop(); drawEmpty();
}

// ---------- interface ----------
function setTool(t){ tool = t; cv.className = "t-" + t; drawTools(); if (["draw", "fog"].includes(t) && isGM) openFlyout(t); else closeFlyout(); dirty = true; }
function drawTools(){
  const btn = (t, icon, label, key) => `<button class="tool" data-tool="${t}" aria-pressed="${tool === t}" title="${label} (${key.toUpperCase()})" aria-label="${label}">${icon}<span class="k">${key.toUpperCase()}</span></button>`;
  $("#tools").innerHTML = btn("move", I.move, isGM ? "Mover tokens e o mapa" : "Mover o mapa", "v") + btn("ruler", I.ruler, "Régua", "r")
    + (isGM ? btn("draw", I.draw, "Desenhar e marcar áreas", "d") + btn("erase", I.erase, "Borracha (apaga desenhos)", "e") + btn("fog", I.fog, "Névoa de guerra", "f")
      + `<hr><button class="tool" id="addTok" title="Adicionar token" aria-label="Adicionar token">${I.token}</button><button class="tool" id="sceneBtn" title="Mapa e grid" aria-label="Configurar mapa e grid">${I.gear}</button>` : "");
  $("#tools").onclick = e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.tool) setTool(b.dataset.tool);
    else if (b.id === "addTok") openTokenPanel(null);
    else if (b.id === "sceneBtn") panelKind === "scene" ? closePanel() : openScenePanel();
  };
}
function drawTop(){
  $("#topbar").innerHTML = `<div class="title">Mapa da mesa<small>${isGM ? "mestre" : "jogador"}</small></div><span class="spacer"></span>
    ${isGM ? `<button class="btn" id="castBtn" title="Faz a tela dos jogadores ir para onde você está olhando">${I.cast} Levar jogadores aqui</button>` : ""}
    <div class="zoom"><button class="btn small" id="zOut" aria-label="Diminuir zoom">${I.minus}</button><span>${Math.round(cam.z * 100)}%</span><button class="btn small" id="zIn" aria-label="Aumentar zoom">${I.plus}</button><button class="btn small" id="zFit" title="Enquadrar o mapa (0)" aria-label="Enquadrar">${I.fit}</button></div>`;
  $("#zOut").onclick = () => zoomAt(1 / 1.2); $("#zIn").onclick = () => zoomAt(1.2); $("#zFit").onclick = fit;
  const cb = $("#castBtn"); if (cb) cb.onclick = () => { const [wx, wy] = toWorld(innerWidth / 2, innerHeight / 2); send("view", {x: wx, y: wy, z: cam.z}); toast("Jogadores levados para a sua visão."); };
}
function drawEmpty(){
  let el = $("#emptyMap");
  const show = isGM && !scene.bg && !tokens.length;
  if (!show) { el?.remove(); return; }
  if (!el) { el = document.createElement("div"); el.id = "emptyMap"; el.className = "empty-map"; document.body.appendChild(el); }
  el.innerHTML = `<div><b>Mapa vazio</b>Coloque a imagem de um mapa (link ou arquivo) e ajuste a grid.<br><br><button class="btn primary" id="emptyScene">${I.gear} Configurar mapa</button></div>`;
  $("#emptyScene").onclick = () => openScenePanel();
}

// flyouts de ferramenta
let flyKind = null;
function closeFlyout(){ $("#flyout").innerHTML = ""; flyKind = null; }
function closeFlyoutSoft(){ /* mantém aberto enquanto usa a ferramenta */ }
function openFlyout(kind){
  flyKind = kind;
  const top = $(`[data-tool="${kind}"]`).getBoundingClientRect().top;
  const f = $("#flyout");
  if (kind === "draw") {
    const shapes = [["pen", I.pen, "Livre"], ["line", I.line, "Linha"], ["circle", I.circle, "Círculo"], ["cone", I.cone, "Cone"], ["rect", I.rect, "Quadrado"]];
    f.innerHTML = `<div class="flyout" style="top:${top}px"><h4>Desenhar</h4>
      <div class="seg" id="fShapes">${shapes.map(([k, ic, l]) => `<button data-shape="${k}" aria-pressed="${opt.draw === k}">${ic}${l}</button>`).join("")}</div>
      <div class="lbl" style="margin-top:10px">Cor</div><div class="row" id="fColors">${COLORS.map(c => `<button class="sw" data-color="${c}" style="background:${c}" aria-label="Cor ${c}" aria-pressed="${opt.color === c}"></button>`).join("")}</div>
      <div class="lbl">Espessura</div><input type="range" id="fW" min="1" max="20" value="${opt.width}">
      <p class="hint">Círculo, cone e quadrado mostram o tamanho em casas enquanto você arrasta. Use a Borracha (E) para apagar.</p>
      <div class="row" style="margin:10px 0 0"><button class="btn small danger" id="fClear">Apagar todos os desenhos</button></div></div>`;
    $("#fShapes").onclick = e => { const b = e.target.closest("[data-shape]"); if (b) { opt.draw = b.dataset.shape; openFlyout("draw"); } };
    $("#fColors").onclick = e => { const b = e.target.closest("[data-color]"); if (b) { opt.color = b.dataset.color; openFlyout("draw"); } };
    $("#fW").oninput = e => opt.width = +e.target.value;
    $("#fClear").onclick = () => { if (!drawings.length) return; if (confirm("Apagar todos os desenhos do mapa?")) { drawings = []; save("drawings"); dirty = true; } };
  } else if (kind === "fog") {
    f.innerHTML = `<div class="flyout" style="top:${Math.max(10, top - 40)}px"><h4>Névoa de guerra</h4>
      <label class="chk" style="margin-bottom:10px"><input type="checkbox" id="fOn" ${fog.on ? "checked" : ""}> Névoa ligada</label>
      <div class="seg" id="fMode" style="margin-bottom:8px"><button data-fog="reveal" aria-pressed="${opt.fog === "reveal"}">${I.eye} Revelar</button><button data-fog="hide" aria-pressed="${opt.fog === "hide"}">Esconder</button></div>
      <div class="seg" id="fShape" style="margin-bottom:10px"><button data-fs="brush" aria-pressed="${opt.fogShape === "brush"}">${I.brush} Pincel</button><button data-fs="rect" aria-pressed="${opt.fogShape === "rect"}">${I.rect} Retângulo</button></div>
      ${opt.fogShape === "brush" ? `<div class="lbl">Tamanho do pincel: ${opt.brush} ${opt.brush === 1 ? "casa" : "casas"}</div><input type="range" id="fB" min="1" max="6" value="${opt.brush}">` : ""}
      <div class="row" style="margin:12px 0 0"><button class="btn small" id="fAll">Revelar tudo</button><button class="btn small" id="fNone">Esconder tudo</button></div>
      <p class="hint">Você vê a névoa transparente; os jogadores veem preto. Tokens e desenhos embaixo da névoa ficam escondidos pra eles.</p></div>`;
    $("#fOn").onchange = e => { fog.on = e.target.checked; save("fog"); dirty = true; };
    $("#fMode").onclick = e => { const b = e.target.closest("[data-fog]"); if (b) { opt.fog = b.dataset.fog; openFlyout("fog"); } };
    $("#fShape").onclick = e => { const b = e.target.closest("[data-fs]"); if (b) { opt.fogShape = b.dataset.fs; openFlyout("fog"); } };
    const fb = $("#fB"); if (fb) fb.oninput = e => { opt.brush = +e.target.value; e.target.previousElementSibling.textContent = `Tamanho do pincel: ${opt.brush} ${opt.brush === 1 ? "casa" : "casas"}`; };
    $("#fAll").onclick = () => { fog.on = false; fog.cells = {}; save("fog"); openFlyout("fog"); dirty = true; toast("Névoa desligada: o mapa inteiro está visível."); };
    $("#fNone").onclick = () => { fog.on = true; fog.cells = {}; fog.sig = fogSig(); save("fog"); openFlyout("fog"); dirty = true; toast("Mapa todo escondido. Use Revelar para abrir as áreas."); };
  }
}

// painéis
let panelKind = null;
function closePanel(){ $("#panel").innerHTML = ""; panelKind = null; }
async function uploadImage(file, prefix){
  const safe = file.name.normalize("NFD").replace(/[^\w.-]+/g, "-").slice(-60);
  const path = `${prefix}/${Date.now()}-${safe}`;
  const {error} = await sb.storage.from("sons").upload(path, file, {contentType: file.type || undefined, cacheControl: "31536000"});
  if (error) throw error;
  return sb.storage.from("sons").getPublicUrl(path).data.publicUrl;
}
function measure(url){ return new Promise((ok, bad) => { const im = new Image(); im.crossOrigin = "anonymous"; im.onload = () => ok([im.naturalWidth, im.naturalHeight]); im.onerror = () => bad(new Error("não consegui abrir essa imagem")); im.src = url; }); }
async function setBackground(url){
  try {
    const [w, h] = await measure(url);
    scene.bg = url; scene.bgW = w; scene.bgH = h; save("scene"); dirty = true; drawEmpty(); fit(); openScenePanel(true);
    toast("Mapa colocado. Agora ajuste a grid para bater com o desenho.");
  } catch (e) { toast("Não carreguei a imagem: " + e.message); }
}
function openScenePanel(refresh){
  if (refresh && panelKind !== "scene") return;
  panelKind = "scene";
  const g = G();
  const keep = document.activeElement?.id;
  $("#panel").innerHTML = `<div class="panel" role="dialog" aria-label="Mapa e grid"><h3>Mapa e grid <button class="btn small" id="pClose">Fechar</button></h3>
    <label for="bgUrl">Imagem do mapa (link)</label>
    <div style="display:flex;gap:6px"><input type="url" id="bgUrl" placeholder="https://… .jpg / .png" value="${esc(scene.bg || "")}"><button class="btn small primary" id="bgSet">Usar</button></div>
    <div class="acts" style="margin-top:8px"><label class="btn small" style="margin:0;color:var(--ink)">Enviar arquivo…<input type="file" id="bgFile" accept="image/*" hidden></label>${scene.bg ? `<button class="btn small danger" id="bgDel">Tirar imagem</button>` : ""}</div>
    <div class="sect"><label>Formato da grid</label>
      <div class="seg" id="gType"><button data-gt="square" aria-pressed="${g.type === "square"}">▢ Quadrado</button><button data-gt="hex" aria-pressed="${g.type === "hex"}">⬡ Hexágono</button></div>
      <label for="gSize">Tamanho da casa: <b id="gSizeV">${g.size}</b> px</label><input type="range" id="gSize" min="16" max="240" step="1" value="${g.size}">
      <div class="two"><div><label for="gOx">Deslocar ↔</label><input type="range" id="gOx" min="0" max="${Math.round(g.size)}" step="1" value="${Math.round(((g.ox % g.size) + g.size) % g.size)}"></div>
      <div><label for="gOy">Deslocar ↕</label><input type="range" id="gOy" min="0" max="${Math.round(g.size * (g.type === "hex" ? 1.5 * 2 / SQ3 : 1))}" step="1" value="${Math.round(((g.oy % g.size) + g.size) % g.size)}"></div></div>
      <p class="hint">Ajuste o tamanho e o deslocamento até a grid bater com as casas desenhadas no mapa.</p>
      <label class="chk" style="margin-top:10px"><input type="checkbox" id="gShow" ${g.show ? "checked" : ""}> Mostrar grid</label>
      <div class="two"><div><label for="gAlpha">Força da linha</label><input type="range" id="gAlpha" min="0.05" max="1" step="0.05" value="${g.alpha}"></div>
      <div><label>Cor da linha</label><div class="seg" id="gColor">${[["#000000", "Preta"], ["#ffffff", "Branca"], ["#d0a54c", "Dourada"]].map(([c, n]) => `<button data-gc="${c}" aria-pressed="${g.color === c}" title="${n}" style="padding:6px"><span class="sw" style="display:block;width:16px;height:16px;background:${c}"></span></button>`).join("")}</div></div></div></div>
    <div class="sect"><label>Cada casa vale</label>
      <div class="two"><input type="number" id="gUnit" min="0.1" step="0.5" value="${g.unit}" aria-label="Valor de cada casa"><input type="text" id="gUnitName" maxlength="6" value="${esc(g.unitName)}" aria-label="Unidade"></div>
      <p class="hint">Ex.: 1,5 m ou 5 ft. Usado pela régua e pelas áreas.</p></div>
    ${fog.on && Object.keys(fog.cells).length && fog.sig && fog.sig !== fogSig() ? `<p class="hint" style="color:#e0a08e;margin-top:10px">A grid mudou depois de você revelar a névoa, então as áreas reveladas podem ter saído do lugar.</p>` : ""}
  </div>`;
  $("#pClose").onclick = closePanel;
  $("#bgSet").onclick = () => { const u = $("#bgUrl").value.trim(); if (u) setBackground(u); };
  $("#bgUrl").onkeydown = e => { if (e.key === "Enter") $("#bgSet").click(); };
  $("#bgFile").onchange = async e => { const f = e.target.files[0]; if (!f) return; toast("Enviando o mapa…"); try { await setBackground(await uploadImage(f, "mapas")); } catch (err) { toast("Não enviei: " + err.message); } };
  const del = $("#bgDel"); if (del) del.onclick = () => { scene.bg = null; scene.bgW = scene.bgH = 0; save("scene"); dirty = true; drawEmpty(); openScenePanel(true); };
  $("#gType").onclick = e => { const b = e.target.closest("[data-gt]"); if (!b || g.type === b.dataset.gt) return; g.type = b.dataset.gt; save("scene"); dirty = true; openScenePanel(true); };
  const live = (id, fn) => { $(id).oninput = e => { fn(+e.target.value); dirty = true; save("scene"); }; };
  live("#gSize", v => { g.size = v; $("#gSizeV").textContent = v; $("#gOx").max = v; $("#gOy").max = Math.round(v * (g.type === "hex" ? 1.5 * 2 / SQ3 : 1)); });
  live("#gOx", v => g.ox = v); live("#gOy", v => g.oy = v); live("#gAlpha", v => g.alpha = v);
  $("#gShow").onchange = e => { g.show = e.target.checked; save("scene"); dirty = true; };
  $("#gColor").onclick = e => { const b = e.target.closest("[data-gc]"); if (b) { g.color = b.dataset.gc; save("scene"); dirty = true; openScenePanel(true); } };
  $("#gUnit").onchange = e => { const v = parseFloat(String(e.target.value).replace(",", ".")); if (v > 0) { g.unit = v; save("scene"); dirty = true; } };
  $("#gUnitName").onchange = e => { g.unitName = e.target.value.trim() || "m"; save("scene"); dirty = true; };
  if (keep && $("#" + keep)) $("#" + keep).focus();
}
function openTokenPanel(t){
  panelKind = "token";
  const isNew = !t;
  const d = t || {n: "", c: COLORS[1], s: 1, img: "", h: false};
  let color = d.c;
  $("#panel").innerHTML = `<div class="panel" role="dialog" aria-label="Token"><h3>${isNew ? "Novo token" : "Editar token"} <button class="btn small" id="pClose">Fechar</button></h3>
    <label for="tName">Nome</label><input type="text" id="tName" maxlength="24" value="${esc(d.n)}" placeholder="Ex.: Goblin 1, Aria, Dragão">
    <label>Cor</label><div class="row" id="tColors">${COLORS.map(c => `<button type="button" class="sw" data-color="${c}" style="background:${c}" aria-label="Cor ${c}" aria-pressed="${color === c}"></button>`).join("")}</div>
    <label>Tamanho</label><div class="seg" id="tSize">${[[1, "Médio (1)"], [2, "Grande (2)"], [3, "Enorme (3)"], [4, "Colossal (4)"]].map(([v, l]) => `<button data-sz="${v}" aria-pressed="${(d.s || 1) === v}">${l}</button>`).join("")}</div>
    <label for="tImg">Imagem (opcional)</label>
    <div style="display:flex;gap:6px"><input type="url" id="tImg" placeholder="link de uma imagem" value="${esc(d.img || "")}"><label class="btn small" style="margin:0;color:var(--ink)">Arquivo<input type="file" id="tFile" accept="image/*" hidden></label></div>
    <label class="chk" style="margin-top:12px"><input type="checkbox" id="tHide" ${d.h ? "checked" : ""}> Oculto dos jogadores</label>
    <div class="acts"><button class="btn primary" id="tSave">${isNew ? "Colocar no mapa" : "Salvar"}</button>${isNew ? "" : `<button class="btn" id="tDup">Duplicar</button><button class="btn danger" id="tDel">Remover</button>`}</div>
    ${isNew ? `<p class="hint" style="margin-top:10px">O token aparece no centro da tela. Arraste com a ferramenta Mover; dois cliques nele para editar.</p>` : ""}</div>`;
  let size = d.s || 1;
  $("#pClose").onclick = closePanel;
  $("#tColors").onclick = e => { const b = e.target.closest("[data-color]"); if (!b) return; color = b.dataset.color; $("#tColors").querySelectorAll("[data-color]").forEach(x => x.setAttribute("aria-pressed", x === b)); };
  $("#tSize").onclick = e => { const b = e.target.closest("[data-sz]"); if (!b) return; size = +b.dataset.sz; $("#tSize").querySelectorAll("[data-sz]").forEach(x => x.setAttribute("aria-pressed", x === b)); };
  $("#tFile").onchange = async e => { const f = e.target.files[0]; if (!f) return; toast("Enviando imagem…"); try { $("#tImg").value = await uploadImage(f, "tokens"); toast("Imagem pronta."); } catch (err) { toast("Não enviei: " + err.message); } };
  $("#tName").focus();
  $("#tName").onkeydown = e => { if (e.key === "Enter") $("#tSave").click(); };
  $("#tSave").onclick = () => {
    const vals = {n: $("#tName").value.trim(), c: color, s: size, img: $("#tImg").value.trim() || null, h: $("#tHide").checked};
    if (isNew) {
      const [wx, wy] = toWorld(innerWidth / 2, innerHeight / 2);
      const off = tokens.length % 5 * G().size; const [x, y] = snapPoint(wx + off, wy, size);
      const nt = {id: uid(), ...vals, x, y}; tokens.push(nt); selTok = nt.id;
    } else { Object.assign(t, vals); const [x, y] = snapPoint(t.x, t.y, size); t.x = x; t.y = y; }
    save("tokens"); dirty = true; drawEmpty(); closePanel();
  };
  if (!isNew) {
    $("#tDel").onclick = () => { tokens = tokens.filter(x => x !== t); selTok = null; save("tokens"); dirty = true; closePanel(); };
    $("#tDup").onclick = () => { const c = {...t, id: uid(), n: t.n.replace(/(\d+)$/, m => String(+m + 1)) || t.n}; const [x, y] = snapPoint(t.x + G().size * (t.s || 1), t.y, t.s || 1); c.x = x; c.y = y; if (c.n === t.n) c.n = t.n + " 2"; tokens.push(c); selTok = c.id; save("tokens"); dirty = true; closePanel(); };
  }
}

// ---------- início ----------
async function boot(){
  let cfg;
  try { cfg = await (await fetch("/api/config", {cache: "no-store"})).json(); } catch {}
  if (!cfg?.url || !cfg?.key) { $("#gate").textContent = "O site ainda não está ligado ao banco."; return; }
  sb = window.supabase.createClient(cfg.url, cfg.key);
  const {data: {session}} = await sb.auth.getSession();
  isGM = !!session;
  sb.auth.onAuthStateChange((_e, s) => { if (!!s !== isGM) location.reload(); });
  drawTools(); drawTop(); setTool("move");
  if (!(await load())) return;
  $("#gate").hidden = true;
  fit();
  let reloadT = null;
  sb.channel("mapa-db").on("postgres_changes", {event: "*", schema: "public", table: "map_state"}, () => { clearTimeout(reloadT); reloadT = setTimeout(load, 80); }).subscribe();
  chan = sb.channel("mapa", {config: {broadcast: {self: false}}});
  chan.on("broadcast", {event: "tok"}, ({payload: p}) => { if (!p?.id) return; if (p.live) tokLive[p.id] = {x: p.x, y: p.y}; else { delete tokLive[p.id]; const t = tokens.find(x => x.id === p.id); if (t) { t.x = p.x; t.y = p.y; } } dirty = true; });
  chan.on("broadcast", {event: "ruler"}, ({payload: p}) => { if (!p?.k) return; if (p.r) rulers[p.k] = p.r; else delete rulers[p.k]; dirty = true; });
  chan.on("broadcast", {event: "view"}, ({payload: p}) => { if (!isGM && p) { centerOn(p.x, p.y, p.z); toast("O mestre levou você para esta parte do mapa."); } });
  chan.subscribe(st => { $("#status").textContent = st === "SUBSCRIBED" ? (isGM ? "ao vivo · jogadores veem o que você fizer" : "ao vivo") : "reconectando…"; });
  requestAnimationFrame(frame);
}
boot();

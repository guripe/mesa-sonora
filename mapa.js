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
I.wall = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 5h18v14H3z"/><path d="M3 10h18M3 15h18M9 5v5m6 0v5m-6 0v4m6 0v4"/></svg>';
I.list = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.5"/><circle cx="4.5" cy="12" r="1.5"/><circle cx="4.5" cy="18" r="1.5"/></svg>';
I.door = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 21V4l10-1v18"/><path d="M3 21h18"/><circle cx="12" cy="12" r="1"/></svg>';
const COLORS = ["#d0a54c", "#c0473a", "#4a72b8", "#5f9a4a", "#8a5bb0", "#e07b2e", "#e8e2d0", "#222222"];

// ---------- estado ----------
let sb = null, chan = null, isGM = false;
let scene = {bg: null, bgW: 0, bgH: 0, grid: {type: "square", size: 70, ox: 0, oy: 0, color: "#000000", alpha: .35, show: true, unit: 1.5, unitName: "m"}};
let tokens = [], fog = {on: false, cells: {}}, drawings = [];
const cam = {x: 0, y: 0, z: 1};                 // tela = mundo * z + (x, y)
let tool = "move";
const opt = {draw: "pen", color: "#c0473a", width: 4, fog: "reveal", fogShape: "brush", brush: 1, wall: "wall"};
let wallDraft = null, hoverWall = null, wallsVer = 0, gmPreview = false;
let dirty = true, bgImg = null, bgUrlLoaded = null;
const imgCache = new Map();
let drag = null, hoverFog = null;
const lastSave = {};                                 // interação em andamento
let rulers = {};                                 // réguas ao vivo {key: {a, b}}
let tokLive = {};                                // posições temporárias vindas por broadcast
let selTok = null;
let myNick = ""; try { myNick = localStorage.getItem("mesa.nick") || ""; } catch {}
let peersOnMap = [];                             // nomes de quem está no mapa agora
const myKey = (crypto.randomUUID?.() || String(Math.random())).slice(0, 10);
let spaceDown = false;

const cv = $("#board"), ctx = cv.getContext("2d");
function resize(){ const d = devicePixelRatio || 1; cv.width = innerWidth * d; cv.height = innerHeight * d; cv.style.width = innerWidth + "px"; cv.style.height = innerHeight + "px"; dirty = true; }
addEventListener("resize", resize); resize();

function toast(msg, ms = 3000){ const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), ms); }

// ---------- geometria da grid ----------
const G = () => scene.grid;
const toWorld = (sx, sy) => [(sx - cam.x) / cam.z, (sy - cam.y) / cam.z];
const FL = () => G().type === "hex" && !!G().flat;          // hexágono "deitado" = grid em pé com x e y trocados
const toL = (x, y) => { const g = G(); return FL() ? [y - g.oy, x - g.ox] : [x - g.ox, y - g.oy]; };
const fromL = (X, Y) => { const g = G(); return FL() ? [g.ox + Y, g.oy + X] : [g.ox + X, g.oy + Y]; };
function hexCornersL(X, Y, R){ const out = []; for (let i = 0; i < 6; i++) { const an = Math.PI / 180 * (60 * i - 30); out.push(fromL(X + R * Math.cos(an), Y + R * Math.sin(an))); } return out; }
function cellAt(x, y){
  const g = G();
  if (g.type === "hex") {
    const R = g.size / SQ3, [px, py] = toL(x, y);
    let q = (SQ3 / 3 * px - py / 3) / R, r = (2 / 3 * py) / R, s = -q - r;
    let rq = Math.round(q), rr = Math.round(r), rs = Math.round(s);
    const dq = Math.abs(rq - q), dr = Math.abs(rr - r), ds = Math.abs(rs - s);
    if (dq > dr && dq > ds) rq = -rr - rs; else if (dr > ds) rr = -rq - rs;
    return [rq, rr];
  }
  return [Math.floor((x - g.ox) / g.size), Math.floor((y - g.oy) / g.size)];
}
function cellCenterL(a, b){ const g = G(), R = g.size / SQ3; return [g.size * (a + b / 2), 1.5 * R * b]; }
function cellCenter(a, b){
  const g = G();
  if (g.type === "hex") return fromL(...cellCenterL(a, b));
  return [g.ox + (a + .5) * g.size, g.oy + (b + .5) * g.size];
}
function cellPath(c, a, b){
  const g = G();
  if (g.type === "hex") {
    const pts = hexCornersL(...cellCenterL(a, b), g.size / SQ3 + .6 / cam.z);
    pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath();
  } else { const [cx, cy] = cellCenter(a, b), h = g.size / 2 + .5 / cam.z; c.rect(cx - h, cy - h, h * 2, h * 2); }
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
const fogSig = () => `${G().type}${FL() ? "f" : ""}:${G().size}:${G().ox}:${G().oy}`;

// ---------- desenho ----------
function getImg(url){
  if (!url) return null;
  let e = imgCache.get(url);
  if (!e) { e = new Image(); e.crossOrigin = "anonymous"; e.onload = () => { dirty = true; }; e.onerror = () => { e.bad = true; }; e.src = url; imgCache.set(url, e); }
  return e.complete && e.naturalWidth && !e.bad ? e : null;
}
let selBarKey = "";
function selBar(){
  const t = tokens.find(x => x.id === selTok), can = t && (isGM || owns(t));
  const key = can ? [t.id, t.n, t.h, isGM, JSON.stringify(t.b || [])].join("|") : "";
  if (key === selBarKey) return; selBarKey = key;
  let el = $("#selbar"); if (!el) { el = document.createElement("div"); el.id = "selbar"; el.className = "selbar"; document.body.appendChild(el); }
  if (!can) { el.hidden = true; return; }
  el.hidden = false;
  const bars = (t.b || []).map((b, i) => ({...b, i})).filter(b => b.v !== "" && b.v != null || (b.m !== "" && b.m != null));
  const barUI = bars.map(b => `<span class="sbbar" style="--bc:${esc(b.c || "#c0473a")}"><i></i>
      <button class="btn small" data-hp="${b.i}" data-d="-10">−10</button><button class="btn small" data-hp="${b.i}" data-d="-1">−1</button>
      <input class="sbv" data-hpv="${b.i}" value="${esc(b.v)}" inputmode="numeric" aria-label="Valor da barrinha ${b.i + 1}">${b.m !== "" && b.m != null ? `<em>/ ${esc(b.m)}</em>` : ""}
      <button class="btn small" data-hp="${b.i}" data-d="1">+1</button><button class="btn small" data-hp="${b.i}" data-d="10">+10</button></span>`).join("");
  el.innerHTML = `<div class="sbrow"><b>${esc(t.n || "Token")}</b>
    ${isGM ? `<button class="btn small" data-sb="edit">✎ Editar</button>` : ""}
    <button class="btn small" data-sb="l" title="Girar (Q)" aria-label="Girar para a esquerda">↺</button><button class="btn small" data-sb="r" title="Girar (E)" aria-label="Girar para a direita">↻</button>
    ${isGM ? `<button class="btn small" data-sb="hide">${t.h ? "👁 Mostrar aos jogadores" : "🚫 Ocultar"}</button><button class="btn small danger" data-sb="del">Remover</button>` : ""}</div>
    ${barUI ? `<div class="sbrow">${barUI}</div>` : ""}`;
  const setHP = (i, v) => {
    const cur = tokens.find(x => x.id === selTok); if (!cur?.b?.[i]) return;
    v = Math.round(v); cur.b[i].v = v; dirty = true; selBarKey = "";
    if (isGM) save("tokens"); else send("tokreq", {id: cur.id, bi: i, bv: v, who: myNick});
  };
  el.querySelectorAll("[data-hpv]").forEach(inp => {
    inp.onkeydown = e => { if (e.key === "Enter") inp.blur(); e.stopPropagation(); };
    inp.onchange = () => { const raw = inp.value.trim().replace(",", "."); const cur = tokens.find(x => x.id === selTok); const old = +cur?.b?.[inp.dataset.hpv]?.v || 0;
      const v = /^[+-]/.test(raw) ? old + (+raw) : +raw; if (isFinite(v) && raw !== "") setHP(+inp.dataset.hpv, v); else selBarKey = ""; };
  });
  el.onclick = e => {
    const b = e.target.closest("[data-sb],[data-hp]"); if (!b) return;
    const cur = tokens.find(x => x.id === selTok); if (!cur) return;
    const a = b.dataset.sb;
    if (b.dataset.hp != null) { const i = +b.dataset.hp; return setHP(i, (+cur.b[i].v || 0) + +b.dataset.d); }
    if (a === "edit") openTokenPanel(cur);
    else if (a === "l" || a === "r") rotateSel(a === "l" ? -1 : 1);
    else if (a === "hide") { cur.h = !cur.h; save("tokens"); dirty = true; toast(cur.h ? "Token oculto dos jogadores." : "Token visível para os jogadores."); }
    else if (a === "del") { if (confirm(`Remover “${cur.n || "token"}”?`)) { tokens = tokens.filter(x => x.id !== cur.id); selTok = null; save("tokens"); dirty = true; } }
  };
}
function openTokenList(){
  panelKind = "list";
  const row = t => `<div class="tlrow"><span class="tldot" style="background:${esc(t.c || "#d0a54c")}"></span><button class="tlname" data-go="${t.id}">${esc(t.n || "(sem nome)")}${t.h ? ' <em>oculto</em>' : ""}${t.o ? ` <small>· ${t.o === "*" ? "todos" : esc(t.o)}</small>` : ""}</button>
    <button class="btn small" data-hide="${t.id}" title="${t.h ? "Mostrar" : "Ocultar"}">${t.h ? "👁" : "🚫"}</button><button class="btn small" data-edit="${t.id}">✎</button></div>`;
  $("#panel").innerHTML = `<div class="panel" role="dialog" aria-label="Tokens"><h3>Tokens <button class="btn small" id="pClose">Fechar</button></h3>
    ${tokens.length ? tokens.map(row).join("") : `<p class="hint">Nenhum token ainda.</p>`}
    <div class="acts"><button class="btn primary" id="lNew">${I.plus} Novo token</button></div></div>`;
  $("#pClose").onclick = closePanel; $("#lNew").onclick = () => openTokenPanel(null);
  $("#panel").onclick = e => {
    const g = e.target.closest("[data-go]"), h = e.target.closest("[data-hide]"), ed = e.target.closest("[data-edit]");
    if (g) { const t = tokens.find(x => x.id === g.dataset.go); if (t) { selTok = t.id; centerOn(t.x, t.y, Math.max(cam.z, .8)); } }
    if (h) { const t = tokens.find(x => x.id === h.dataset.hide); if (t) { t.h = !t.h; save("tokens"); dirty = true; openTokenList(); } }
    if (ed) { const t = tokens.find(x => x.id === ed.dataset.edit); if (t) openTokenPanel(t); }
  };
}
function frame(){
  if (dirty) { dirty = false; paint(); selBar(); }
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
  if (img) {
    const w = scene.bgW || img.naturalWidth, h = scene.bgH || img.naturalHeight, [W2, H2] = bgBox();
    ctx.save(); ctx.translate(W2 / 2, H2 / 2); ctx.rotate(bgAngle() * Math.PI / 180); ctx.drawImage(img, -w / 2, -h / 2, w, h); ctx.restore();
  }
  else { ctx.fillStyle = "#1b1611"; ctx.fillRect(vw.x0, vw.y0, vw.x1 - vw.x0, vw.y1 - vw.y0); }
  // grid
  const g = G();
  if (g.show && g.size * cam.z >= 7) {
    ctx.beginPath();
    if (g.type === "hex") {
      const R = g.size / SQ3, rowH = 1.5 * R;
      const [lx0, ly0] = FL() ? [vw.y0 - g.oy, vw.x0 - g.ox] : [vw.x0 - g.ox, vw.y0 - g.oy], [lx1, ly1] = FL() ? [vw.y1 - g.oy, vw.x1 - g.ox] : [vw.x1 - g.ox, vw.y1 - g.oy];
      const r0 = Math.floor(ly0 / rowH) - 1, r1 = Math.ceil(ly1 / rowH) + 1;
      for (let r = r0; r <= r1; r++) {
        const q0 = Math.floor(lx0 / g.size - r / 2) - 1, q1 = Math.ceil(lx1 / g.size - r / 2) + 1;
        for (let q = q0; q <= q1; q++) {
          const c6 = hexCornersL(...cellCenterL(q, r), R);
          for (let i = 2; i < 5; i++) { ctx.moveTo(...c6[i]); ctx.lineTo(...c6[i + 1]); } // 3 arestas bastam (as outras são das vizinhas)
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
  for (const t of ts) if (isGM || !t.h) paintLightGlow(t);
  for (const t of ts) if (isGM || !t.h) paintAura(t);
  if (isGM && !gmPreview) for (const t of ts) if (VI(t)) paintVisionGM(t);
  const vsP = !isGM ? viewers() : [];
  const seenTok = t => isGM || owns(t) || !vsP.length || vsP.some(v => sees(ts.find(x => x.id === v.id) || v, t.x, t.y, ts));
  for (const t of ts) if ((isGM || !t.h) && seenTok(t)) paintToken(t);
  // névoa, luz e visão
  if (fog.on) paintFog();
  if (!isGM) paintLighting(viewers());
  else if (gmPreview) paintLighting(tokens.filter(t => VI(t) && t.o), .92);
  if (isGM) paintWalls();
  if (drag?.kind === "fogrect") { const {a, b} = drag; ctx.strokeStyle = opt.fog === "reveal" ? "#ffe28a" : "#e0735e"; ctx.setLineDash([8 / cam.z, 6 / cam.z]); ctx.lineWidth = 2 / cam.z; ctx.strokeRect(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])); ctx.setLineDash([]); }
  const brushAt = drag?.kind === "fogbrush" ? drag.at : (!drag && tool === "fog" && isGM && opt.fogShape === "brush" ? hoverFog : null);
  if (brushAt) { const [a, b] = cellAt(...brushAt); ctx.beginPath(); for (const [ca, cb] of cellsInRange(a, b, opt.brush)) cellPath(ctx, ca, cb); ctx.strokeStyle = opt.fog === "reveal" ? "#ffe28a" : "#e0735e"; ctx.lineWidth = 2 / cam.z; ctx.stroke(); }
  if (drag?.kind === "token" && drag.grid && drag.moved) paintPath(drag);
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
const unitPx = u => u / (G().unit || 1) * G().size;   // metros → pixels
const dirVec = a => [Math.sin(a * Math.PI / 180), -Math.cos(a * Math.PI / 180)]; // 0° = para cima
const tokR = t => (t.s || 1) * G().size / 2 * .88;
const owns = t => !!t.o && (t.o === "*" || (!!myNick && t.o.toLowerCase() === myNick.toLowerCase()));
function paintAura(t){
  const au = t.au; if (!au?.on || !(au.d > 0)) return;
  const R = unitPx(au.d) / 2;
  ctx.save(); ctx.fillStyle = au.c || "#ff0000"; ctx.strokeStyle = au.c || "#ff0000"; ctx.lineWidth = 2 / cam.z;
  ctx.beginPath();
  if (au.f === "square") ctx.rect(t.x - R, t.y - R, R * 2, R * 2);
  else if (au.f === "cells") { const [a, b] = cellAt(t.x, t.y); const n = Math.max(1, Math.round(au.d / 2 / (G().unit || 1))) + 1; for (const [ca, cb] of cellsInRange(a, b, n)) cellPath(ctx, ca, cb); }
  else ctx.arc(t.x, t.y, R, 0, Math.PI * 2);
  ctx.globalAlpha = (t.h ? .5 : 1) * .2; ctx.fill(); ctx.globalAlpha = t.h ? .5 : .85; if (au.f !== "cells") ctx.stroke();
  ctx.restore();
}
function viewers(){ // tokens cuja visão vale para este jogador
  const vt = tokens.filter(t => VI(t) && t.o);
  const mine = vt.filter(owns);
  return mine.length ? mine : vt;                // sem token próprio: vê o que o grupo vê
}
function paintToken(t){
  const g = G(), r = tokR(t), ang = t.a || 0;
  ctx.save();
  if (t.h) ctx.globalAlpha = .45;
  ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
  ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
  ctx.fillStyle = t.c || "#d0a54c"; ctx.fill(); ctx.shadowColor = "transparent";
  const im = getImg(t.img);
  if (im) {
    ctx.save(); ctx.beginPath(); ctx.arc(t.x, t.y, r * .86, 0, Math.PI * 2); ctx.clip();
    ctx.translate(t.x, t.y); if (t.dir === "rotate") ctx.rotate(ang * Math.PI / 180);
    const s = Math.max(r * 2 / im.naturalWidth, r * 2 / im.naturalHeight) * .86 * (t.iz || 1);
    ctx.drawImage(im, -im.naturalWidth * s / 2, -im.naturalHeight * s / 2, im.naturalWidth * s, im.naturalHeight * s); ctx.restore();
  } else { ctx.fillStyle = "#1a130b"; ctx.font = `700 ${r * .8}px "Alegreya Sans", sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText((t.n || "?").trim().slice(0, 2).toUpperCase(), t.x, t.y + r * .04); }
  ctx.lineWidth = Math.max(2, r * .1); ctx.strokeStyle = drag?.kind === "token" && (drag.wall || drag.limit) && drag.t.id === t.id ? "#ff4a3a" : selTok === t.id ? "#fff" : "rgba(0,0,0,.55)"; ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, Math.PI * 2); ctx.stroke();
  const vv = VI(t), ll = LI(t);
  const selMine = selTok === t.id && (isGM || owns(t));
  if (selMine || t.dir === "arrow" || (t.dir !== "rotate" && ((vv && vv.ang < 360) || (ll && ll.ang < 360)))) { // seta de direção (arraste para girar)
    const [vx, vy] = dirVec(ang), px = -vy, py = vx, tip = r * 1.32, base = r * 1.02, w = r * .28;
    ctx.beginPath(); ctx.moveTo(t.x + vx * tip, t.y + vy * tip); ctx.lineTo(t.x + vx * base + px * w, t.y + vy * base + py * w); ctx.lineTo(t.x + vx * base - px * w, t.y + vy * base - py * w); ctx.closePath();
    ctx.fillStyle = selTok === t.id ? "#fff" : (t.c || "#d0a54c"); ctx.fill(); ctx.strokeStyle = "rgba(0,0,0,.6)"; ctx.lineWidth = Math.max(1, r * .05); ctx.stroke();
    if (selMine) { ctx.beginPath(); ctx.arc(t.x + vx * r * 1.2, t.y + vy * r * 1.2, Math.max(r * .3, 9 / cam.z), 0, Math.PI * 2); ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.setLineDash([3 / cam.z, 3 / cam.z]); ctx.lineWidth = 1.5 / cam.z; ctx.stroke(); ctx.setLineDash([]); }
  }
  // barrinhas
  const bars = (t.b || []).filter(b => b && b.v !== "" && b.v != null);
  if (bars.length && (isGM || t.bv !== false || owns(t))) {
    const bw = r * 2, bh = Math.max(3 / cam.z, r * .15), gap = bh * .45;
    let y = t.y - r - 5 / cam.z - bars.length * (bh + gap);
    for (const b of bars) {
      const v = Number(b.v), m = Number(b.m);
      ctx.fillStyle = "rgba(10,8,6,.85)"; ctx.fillRect(t.x - bw / 2 - 1 / cam.z, y - 1 / cam.z, bw + 2 / cam.z, bh + 2 / cam.z);
      ctx.fillStyle = b.c || "#c0473a"; ctx.fillRect(t.x - bw / 2, y, m > 0 ? bw * Math.max(0, Math.min(1, v / m)) : bw, bh);
      if (bh * cam.z >= 9) { ctx.font = `700 ${bh * .95}px "Alegreya Sans", sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#fff"; ctx.shadowColor = "#000"; ctx.shadowBlur = 3; ctx.fillText(m > 0 ? `${b.v}/${b.m}` : String(b.v), t.x, y + bh / 2 + .5 / cam.z); ctx.shadowColor = "transparent"; }
      y += bh + gap;
    }
  }
  if (t.n && g.size * cam.z > 26) {
    const fs = Math.max(11 / cam.z, r * .38); ctx.font = `700 ${fs}px "Alegreya Sans", sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "top";
    const w = ctx.measureText(t.n).width + fs * .8;
    ctx.fillStyle = "rgba(23,19,15,.85)"; ctx.fillRect(t.x - w / 2, t.y + r + 2, w, fs * 1.3);
    ctx.fillStyle = owns(t) && !isGM ? "#ffe28a" : "#eee2c9"; ctx.fillText(t.n, t.x, t.y + r + 2 + fs * .15);
  }
  if (t.h) { ctx.globalAlpha = 1; ctx.fillStyle = "#e0735e"; ctx.font = `700 ${r * .45}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "bottom"; ctx.fillText("oculto", t.x, t.y - r * .15); }
  ctx.restore();
}

// ---------- paredes, luz e visão ----------
const walls = () => scene.walls || (scene.walls = []);
let segCache = {v: -1, s: []};
function blocking(){ // paredes como segmentos (círculos viram polígonos)
  if (segCache.v === wallsVer) return segCache.s;
  const out = [];
  for (const w of walls()) {
    if (w.d && w.o) continue;
    if (w.c) { const [cx, cy] = w.c, n = Math.max(12, Math.min(40, Math.round(w.r / 6))); for (let i = 0; i < n; i++) { const a1 = i / n * Math.PI * 2, a2 = (i + 1) / n * Math.PI * 2; out.push([cx + w.r * Math.cos(a1), cy + w.r * Math.sin(a1), cx + w.r * Math.cos(a2), cy + w.r * Math.sin(a2)]); } }
    else if (w.p) out.push(w.p);
  }
  segCache = {v: wallsVer, s: out}; return out;
}
function segHit(px, py, dx, dy, [x1, y1, x2, y2]){
  const sx = x2 - x1, sy = y2 - y1, den = dx * sy - dy * sx; if (Math.abs(den) < 1e-9) return Infinity;
  const qx = x1 - px, qy = y1 - py, t = (qx * sy - qy * sx) / den, u = (qx * dy - qy * dx) / den;
  return t >= 0 && u >= -1e-6 && u <= 1 + 1e-6 ? t : Infinity;
}
const losCache = new Map();
function losPoly(x, y, R){ // polígono do que se vê a partir de (x,y) até R, parado pelas paredes
  const key = `${Math.round(x)},${Math.round(y)},${Math.round(R)},${wallsVer}`;
  if (losCache.has(key)) return losCache.get(key);
  const segs = blocking().filter(([x1, y1, x2, y2]) => !(Math.min(x1, x2) > x + R || Math.max(x1, x2) < x - R || Math.min(y1, y2) > y + R || Math.max(y1, y2) < y - R));
  let poly = null;
  if (segs.length) {
    const B = R * 1.05, box = [[x - B, y - B, x + B, y - B], [x + B, y - B, x + B, y + B], [x + B, y + B, x - B, y + B], [x - B, y + B, x - B, y - B]];
    const all = segs.concat(box), angs = [];
    for (const [x1, y1, x2, y2] of all) for (const [ex, ey] of [[x1, y1], [x2, y2]]) { const a = Math.atan2(ey - y, ex - x); angs.push(a - 1e-4, a, a + 1e-4); }
    for (let i = 0; i < 48; i++) angs.push(-Math.PI + i * Math.PI / 24);
    angs.sort((a, b) => a - b);
    poly = [];
    for (const a of angs) { const dx = Math.cos(a), dy = Math.sin(a); let best = Infinity; for (const sg of all) { const t = segHit(x, y, dx, dy, sg); if (t < best) best = t; } if (best < Infinity) poly.push([x + dx * best, y + dy * best]); }
  }
  if (losCache.size > 300) losCache.clear();
  losCache.set(key, poly); return poly;
}
function shapePath(c, x, y, R, ang, facing, poly){ // área = linha de visão ∩ cone ∩ círculo R (desenha só o caminho)
  if (poly) { poly.forEach(([px, py], i) => i ? c.lineTo(px, py) : c.moveTo(px, py)); c.closePath(); }
  else { c.moveTo(x + R, y); c.arc(x, y, R, 0, Math.PI * 2); }
}
function conePath(c, x, y, R, ang, facing){
  if (!(ang < 360)) { c.moveTo(x + R, y); c.arc(x, y, R, 0, Math.PI * 2); return; }
  const a0 = (facing - 90 - ang / 2) * Math.PI / 180, a1 = (facing - 90 + ang / 2) * Math.PI / 180;
  c.moveTo(x, y); c.arc(x, y, R, a0, a1); c.closePath();
}
const VI = t => { // visão com valores padrão (e compatível com a versão antiga)
  const v = t.vi || {}; if (!v.on) return null;
  if (v.rb == null && v.r != null) return {rb: v.r, rd: v.r, rk: v.r, ang: v.t === "circle" ? 360 : (v.ang || 90)};
  return {rb: +v.rb || 0, rd: +v.rd || 0, rk: +v.rk || 0, ang: v.ang == null ? 360 : +v.ang};
};
const LI = t => { const l = t.li; return l && ((+l.rb || 0) > 0 || (+l.rd || 0) > 0) ? {rb: +l.rb || 0, rd: +l.rd || 0, ang: l.ang == null ? 360 : +l.ang} : null; };
let RT = null;   // alvo de desenho: null = tela; senão um retângulo do mundo (usado pela memória)
const cvs = {}; function off(k){ if (RT) k += "_w"; let c = cvs[k]; if (!c) { c = cvs[k] = document.createElement("canvas"); } const W0 = RT ? RT.w : cv.width, H0 = RT ? RT.h : cv.height; if (c.width !== W0 || c.height !== H0) { c.width = W0; c.height = H0; } const x = c.getContext("2d"); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = "source-over"; x.globalAlpha = 1; x.filter = "none"; x.clearRect(0, 0, c.width, c.height); return [c, x]; }
const W = x => { if (RT) return x.setTransform(RT.s, 0, 0, RT.s, -RT.x0 * RT.s, -RT.y0 * RT.s); const d = devicePixelRatio || 1; x.setTransform(d * cam.z, 0, 0, d * cam.z, d * cam.x, d * cam.y); };
function lightMasks(ts){ // B = luz intensa, D = luz fraca ou melhor
  const amb = scene.light || "day";
  const [bc, bx] = off("B"), [dc, dx] = off("D");
  if (amb === "day") { bx.fillStyle = dx.fillStyle = "#fff"; bx.fillRect(0, 0, bc.width, bc.height); dx.fillRect(0, 0, dc.width, dc.height); return [bc, dc]; }
  if (amb === "dim") { dx.fillStyle = "#fff"; dx.fillRect(0, 0, dc.width, dc.height); }
  W(bx); W(dx); bx.fillStyle = dx.fillStyle = "#fff";
  for (const t of ts) {
    const l = LI(t); if (!l) continue;
    const R = unitPx(Math.max(l.rb, l.rd)), poly = losPoly(t.x, t.y, R);
    for (const [x, r] of [[bx, unitPx(l.rb)], [dx, unitPx(Math.max(l.rb, l.rd))]]) {
      if (r <= 0) continue;
      x.save(); x.beginPath(); shapePath(x, t.x, t.y, R, 0, 0, poly); x.clip();
      x.beginPath(); conePath(x, t.x, t.y, r, l.ang, t.a || 0); x.fill(); x.restore();
    }
  }
  return [bc, dc];
}
function visibleMask(vs, ts){ // U = o que os tokens em vs enxergam; retorna [U, B]
  const [B, D] = lightMasks(ts);
  const [uc, ux] = off("U");
  for (const t of vs) {
    const v = VI(t); if (!v) continue;
    const R = unitPx(Math.max(v.rb, v.rd, v.rk, 0.1)), poly = losPoly(t.x, t.y, R);
    const [tc, tx] = off("T");
    // enxerga no escuro
    if (v.rk > 0) { W(tx); tx.fillStyle = "#fff"; tx.beginPath(); tx.arc(t.x, t.y, unitPx(v.rk), 0, Math.PI * 2); tx.fill(); }
    // enxerga o que está iluminado, até o alcance de cada luz
    for (const [mask, r] of [[D, unitPx(v.rd)], [B, unitPx(v.rb)]]) {
      if (r <= 0) continue;
      const [mc, mx] = off("M"); mx.drawImage(mask, 0, 0); mx.globalCompositeOperation = "destination-in"; W(mx); mx.beginPath(); mx.arc(t.x, t.y, r, 0, Math.PI * 2); mx.fill();
      tx.setTransform(1, 0, 0, 1, 0, 0); tx.drawImage(mc, 0, 0);
    }
    // corta pela linha de visão (paredes) e pelo ângulo
    const [sc, sx] = off("S"); W(sx); sx.fillStyle = "#fff"; sx.save(); sx.beginPath(); conePath(sx, t.x, t.y, R * 1.02, v.ang, t.a || 0); sx.clip(); sx.beginPath(); shapePath(sx, t.x, t.y, R, 0, 0, poly); sx.fill(); sx.restore();
    sx.beginPath(); sx.arc(t.x, t.y, tokR(t) * 1.08, 0, Math.PI * 2); sx.fill();    // o próprio token
    tx.setTransform(1, 0, 0, 1, 0, 0); tx.globalCompositeOperation = "destination-in"; tx.drawImage(sc, 0, 0);
    W(tx); tx.globalCompositeOperation = "source-over"; tx.fillStyle = "#fff"; tx.beginPath(); tx.arc(t.x, t.y, tokR(t) * 1.08, 0, Math.PI * 2); tx.fill();
    ux.drawImage(tc, 0, 0);
  }
  return [uc, B];
}
function paintLighting(vs, alpha = 1){
  if (!vs.length) return;
  const ts = tokens.map(t => tokLive[t.id] ? {...t, ...tokLive[t.id]} : t);
  const live = vs.map(t => ts.find(x => x.id === t.id) || t);
  const [U, B] = visibleMask(live, ts);
  const [oc, ox] = off("O");
  ox.fillStyle = "#060504"; ox.fillRect(0, 0, oc.width, oc.height);
  const exI = exImage();
  if (exI && fog.exBox) { // lugares já vistos ficam à meia-luz (no formato exato do que foi visto)
    const [x0, y0, w, h] = fog.exBox;
    ox.globalCompositeOperation = "destination-out"; ox.globalAlpha = .42; W(ox); ox.imageSmoothingEnabled = true; ox.drawImage(exI, x0, y0, w, h);
    ox.setTransform(1, 0, 0, 1, 0, 0); ox.globalAlpha = 1; ox.globalCompositeOperation = "source-over";
  }
  ox.globalCompositeOperation = "destination-out"; ox.filter = "blur(3px)"; ox.drawImage(U, 0, 0); ox.filter = "none";
  // penumbra: o que se vê sem luz intensa fica mais escuro
  const [pc, px] = off("P"); px.drawImage(U, 0, 0); px.globalCompositeOperation = "destination-out"; px.drawImage(B, 0, 0);
  px.globalCompositeOperation = "source-in"; px.fillStyle = "#060504"; px.fillRect(0, 0, pc.width, pc.height);
  ox.globalCompositeOperation = "source-over"; ox.globalAlpha = .5; ox.filter = "blur(3px)"; ox.drawImage(pc, 0, 0); ox.filter = "none"; ox.globalAlpha = 1;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = alpha; ctx.drawImage(oc, 0, 0); ctx.restore();
}
function paintVisionGM(t){ // o mestre vê o alcance da visão (já cortado pelas paredes) tracejado
  const v = VI(t); if (!v) return;
  const R = unitPx(Math.max(v.rb, v.rd, v.rk, .1)), poly = losPoly(t.x, t.y, R);
  ctx.save(); ctx.beginPath(); conePath(ctx, t.x, t.y, R * 1.02, v.ang, t.a || 0); ctx.clip();
  ctx.beginPath(); shapePath(ctx, t.x, t.y, R, 0, 0, poly);
  ctx.fillStyle = "rgba(255,236,170,.05)"; ctx.fill(); ctx.strokeStyle = "rgba(255,226,138,.5)"; ctx.setLineDash([6 / cam.z, 5 / cam.z]); ctx.lineWidth = 1.5 / cam.z; ctx.stroke(); ctx.restore();
}
function paintLightGlow(t){ // brilho quente das tochas, para todo mundo
  const l = LI(t); if (!l) return;
  const R = unitPx(Math.max(l.rb, l.rd)), poly = losPoly(t.x, t.y, R);
  ctx.save(); ctx.beginPath(); shapePath(ctx, t.x, t.y, R, 0, 0, poly); ctx.clip(); ctx.beginPath(); conePath(ctx, t.x, t.y, R, l.ang, t.a || 0); ctx.clip();
  const g = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, R); g.addColorStop(0, "rgba(255,190,90,.22)"); g.addColorStop(Math.min(.99, unitPx(l.rb) / R || .5), "rgba(255,170,70,.1)"); g.addColorStop(1, "rgba(255,160,60,0)");
  ctx.fillStyle = g; ctx.fillRect(t.x - R, t.y - R, R * 2, R * 2); ctx.restore();
}
function paintWalls(){
  ctx.save(); ctx.lineCap = "round";
  for (const w of walls()) {
    if (w.c) { ctx.beginPath(); ctx.arc(w.c[0], w.c[1], w.r, 0, Math.PI * 2); ctx.lineWidth = 4 / cam.z; ctx.strokeStyle = "rgba(240,130,60,.9)"; ctx.setLineDash([]); ctx.stroke(); continue; }
    const [x1, y1, x2, y2] = w.p;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    if (w.d) { ctx.lineWidth = 7 / cam.z; ctx.strokeStyle = w.o ? "rgba(95,190,110,.9)" : "#b07a3a"; ctx.setLineDash(w.o ? [6 / cam.z, 6 / cam.z] : []); }
    else { ctx.lineWidth = 4 / cam.z; ctx.strokeStyle = "rgba(240,130,60,.9)"; ctx.setLineDash([]); }
    ctx.stroke();
  }
  ctx.setLineDash([]);
  if (wallDraft && hoverWall) { ctx.beginPath(); ctx.moveTo(...wallDraft); ctx.lineTo(...hoverWall); ctx.lineWidth = 3 / cam.z; ctx.strokeStyle = opt.wall === "door" ? "#b07a3a" : "rgba(240,130,60,.8)"; ctx.setLineDash([8 / cam.z, 6 / cam.z]); ctx.stroke(); ctx.setLineDash([]); }
  if (drag?.kind === "wallcircle" && drag.r > 0) { ctx.beginPath(); ctx.arc(drag.c[0], drag.c[1], drag.r, 0, Math.PI * 2); ctx.lineWidth = 3 / cam.z; ctx.strokeStyle = "rgba(240,130,60,.8)"; ctx.setLineDash([8 / cam.z, 6 / cam.z]); ctx.stroke(); ctx.setLineDash([]); }
  if (tool === "wall") for (const [x, y, kind] of wallHandles()) { ctx.beginPath(); ctx.arc(x, y, (kind === "p" ? 4.5 : 5.5) / cam.z, 0, Math.PI * 2); ctx.fillStyle = kind === "r" ? "#7fb2e8" : "#ffe28a"; ctx.fill(); ctx.strokeStyle = "rgba(0,0,0,.6)"; ctx.lineWidth = 1 / cam.z; ctx.stroke(); }
  ctx.restore();
}
function gridVertexNear(x, y){
  const g = G();
  if (g.type === "square") return [g.ox + Math.round((x - g.ox) / g.size) * g.size, g.oy + Math.round((y - g.oy) / g.size) * g.size];
  const [a, b] = cellAt(x, y); let best = null, bd = Infinity;
  for (const [vx, vy] of hexCornersL(...cellCenterL(a, b), g.size / SQ3)) { const dd = Math.hypot(vx - x, vy - y); if (dd < bd) { bd = dd; best = [vx, vy]; } }
  return best;
}
function wallHandles(){ // pontos que dá para arrastar: pontas das paredes, centro e borda dos círculos
  const out = [];
  for (const w of walls()) { if (w.c) { out.push([w.c[0], w.c[1], "c", w]); out.push([w.c[0] + w.r, w.c[1], "r", w]); } else if (w.p) { out.push([w.p[0], w.p[1], "p", w, 0]); out.push([w.p[2], w.p[3], "p", w, 1]); } }
  return out;
}
function handleAt(x, y){ const tol = 10 / cam.z; let best = null, bd = tol; for (const h of wallHandles()) { const d = Math.hypot(h[0] - x, h[1] - y); if (d < bd) { bd = d; best = h; } } return best; }
function snapWall(x, y, free, skip){
  const tol = 12 / cam.z;
  for (const w of walls()) if (w.p && w !== skip) for (const [ex, ey] of [[w.p[0], w.p[1]], [w.p[2], w.p[3]]]) if (Math.hypot(ex - x, ey - y) < tol) return [ex, ey];
  if (free) return [Math.round(x), Math.round(y)];
  const v = gridVertexNear(x, y); return Math.hypot(v[0] - x, v[1] - y) < G().size * .3 ? [Math.round(v[0] * 10) / 10, Math.round(v[1] * 10) / 10] : [Math.round(x), Math.round(y)];
}
function wallAt(x, y){ const tol = 8 / cam.z; let bi = -1, bd = tol; walls().forEach((w, i) => { const d = w.c ? Math.abs(Math.hypot(x - w.c[0], y - w.c[1]) - w.r) : distSeg(x, y, [w.p[0], w.p[1]], [w.p[2], w.p[3]]); if (d < bd) { bd = d; bi = i; } }); return bi; }
function pointInPoly(x, y, poly){ let inside = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside; } return inside; }
function inCone(t, x, y, ang){ if (!(ang < 360)) return true; const [vx, vy] = dirVec(t.a || 0), dx = x - t.x, dy = y - t.y, L = Math.hypot(dx, dy) || 1; return Math.acos(Math.max(-1, Math.min(1, (dx * vx + dy * vy) / L))) * 180 / Math.PI <= ang / 2 + .5; }
function lightAt(x, y, ts){ // 2 = luz intensa, 1 = fraca, 0 = escuro
  const amb = scene.light || "day"; if (amb === "day") return 2;
  let lvl = amb === "dim" ? 1 : 0;
  for (const t of ts) {
    const l = LI(t); if (!l) continue;
    const d = Math.hypot(x - t.x, y - t.y), R = unitPx(Math.max(l.rb, l.rd)); if (d > R || !inCone(t, x, y, l.ang)) continue;
    const poly = losPoly(t.x, t.y, R); if (poly && !pointInPoly(x, y, poly)) continue;
    if (d <= unitPx(l.rb)) return 2; lvl = Math.max(lvl, 1);
  }
  return lvl;
}
function sees(t, x, y, ts){
  const v = VI(t); if (!v) return false;
  const d = Math.hypot(x - t.x, y - t.y), R = unitPx(Math.max(v.rb, v.rd, v.rk, .1));
  if (d > R) return false; if (d <= tokR(t)) return true;
  if (!inCone(t, x, y, v.ang)) return false;
  const poly = losPoly(t.x, t.y, R); if (poly && !pointInPoly(x, y, poly)) return false;
  if (d <= unitPx(v.rk)) return true;
  const lv = lightAt(x, y, ts);
  return (lv === 2 && d <= unitPx(v.rb)) || (lv >= 1 && d <= unitPx(v.rd));
}

// ---------- caminho do token (movimento) ----------
const NEI = () => G().type === "hex" ? [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]] : [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const maxCells = t => { const sp = t.sp == null ? 9 : +t.sp; return sp > 0 ? Math.floor(sp / (G().unit || 1) + 1e-6) : Infinity; };
function pathStep(d, target){ // estende o caminho do arraste até a casa alvo, parando em parede ou no limite
  const P = d.path, key = c => c[0] + "," + c[1];
  const idx = P.findIndex(c => c[0] === target[0] && c[1] === target[1]);
  if (idx >= 0) { P.length = idx + 1; return; }                     // voltou por onde veio
  const lim = isGM ? Infinity : maxCells(d.t), [tx, ty] = cellCenter(...target);
  for (let guard = 0; guard < 300; guard++) {
    const last = P[P.length - 1]; if (last[0] === target[0] && last[1] === target[1]) break;
    if (P.length - 1 >= lim) { d.limit = true; break; }
    let best = null, bd = Infinity; const [lx, ly] = cellCenter(...last);
    for (const [da, db] of NEI()) { const c = [last[0] + da, last[1] + db], [cx, cy] = cellCenter(...c), dd = Math.hypot(cx - tx, cy - ty); if (dd < bd) { bd = dd; best = [c, cx, cy]; } }
    if (!best || bd >= Math.hypot(lx - tx, ly - ty)) break;
    if (!isGM && blockedMove(lx, ly, best[1], best[2])) { d.wall = true; break; }
    const j = P.findIndex(c => c[0] === best[0][0] && c[1] === best[0][1]); if (j >= 0) { P.length = j + 1; continue; }
    P.push(best[0]);
  }
}
function paintPath(d){
  const pts = d.path.map(c => cellCenter(...c)); if (pts.length < 2) return;
  const lim = isGM ? Infinity : maxCells(d.t), steps = pts.length - 1, full = steps >= lim;
  ctx.save(); ctx.lineCap = ctx.lineJoin = "round";
  ctx.beginPath(); for (const c of d.path) cellPath(ctx, ...c); ctx.fillStyle = full ? "rgba(224,115,94,.16)" : "rgba(255,226,138,.14)"; ctx.fill();
  ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.strokeStyle = "rgba(0,0,0,.55)"; ctx.lineWidth = 7 / cam.z; ctx.stroke(); ctx.strokeStyle = full ? "#e0735e" : "#ffe28a"; ctx.lineWidth = 3.5 / cam.z; ctx.setLineDash([10 / cam.z, 7 / cam.z]); ctx.stroke(); ctx.setLineDash([]);
  for (const [x, y] of pts.slice(1)) { ctx.beginPath(); ctx.arc(x, y, 3.5 / cam.z, 0, Math.PI * 2); ctx.fillStyle = full ? "#e0735e" : "#ffe28a"; ctx.fill(); }
  const g = G(), m = Math.round(steps * g.unit * 10) / 10, mx = lim < Infinity ? Math.round(lim * g.unit * 10) / 10 : null;
  const [ex, ey] = pts[pts.length - 1];
  label(ex, ey - tokR(d.t), `${steps} ${steps === 1 ? "casa" : "casas"} · ${String(m).replace(".", ",")}${mx != null ? " / " + String(mx).replace(".", ",") : ""} ${g.unitName}${d.wall ? " · parede!" : full ? " · limite" : ""}`);
  ctx.restore();
}
function validPath(t, path){ // o mestre confere o caminho que o jogador mandou
  if (!Array.isArray(path) || path.length < 2 || path.length > 400) return false;
  if (Math.hypot(path[0][0] - t.x, path[0][1] - t.y) > G().size * .75) return false;
  if (path.length - 1 > maxCells(t)) return false;
  for (let i = 1; i < path.length; i++) { const [a, b] = path[i - 1], [c, e] = path[i]; if (Math.hypot(c - a, e - b) > G().size * 1.5) return false; if (blockedMove(a, b, c, e)) return false; }
  return true;
}
function segsCross([ax, ay], [bx, by], [cx, cy, dx, dy]){
  const d1 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax), d2 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
  const d3 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx), d4 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
  return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0)) && d1 && d2 && d3 && d4;
}
const blockedMove = (x1, y1, x2, y2) => blocking().some(w => segsCross([x1, y1], [x2, y2], w));
// memória: o mestre anota as casas que o grupo já viu e salva no banco
let exT = null, exImgEl = null, exImgSrc = null, exC = null, exReady = false;
function exImage(){ // imagem da memória vinda do banco
  const src = fog.exImg; if (!src) return null;
  if (src !== exImgSrc) { exImgSrc = src; exImgEl = new Image(); exImgEl.onload = () => { dirty = true; }; exImgEl.src = src; }
  return exImgEl.complete && exImgEl.naturalWidth ? exImgEl : null;
}
function exBoxNow(){
  const [w, h] = scene.bg ? bgBox() : [9000, 9000], x0 = scene.bg ? -200 : -3000, y0 = scene.bg ? -200 : -3000, W2 = w + (scene.bg ? 400 : 0), H2 = h + (scene.bg ? 400 : 0);
  const s = Math.min(.25, 1600 / Math.max(W2, H2));
  return {x0, y0, w: Math.round(W2 * s), h: Math.round(H2 * s), s, W: W2, H: H2};
}
async function ensureExC(box){
  const same = exC && fog.exBox && Math.abs(fog.exBox[0] - box.x0) < 1 && Math.abs(fog.exBox[2] - box.W) < 1 && Math.abs(fog.exBox[3] - box.H) < 1 && exC.width === box.w;
  if (same && exReady) return;
  exC = document.createElement("canvas"); exC.width = box.w; exC.height = box.h; exReady = true;
  const boxOk = fog.exBox && Math.abs(fog.exBox[0] - box.x0) < 1 && Math.abs(fog.exBox[2] - box.W) < 1 && Math.abs(fog.exBox[3] - box.H) < 1;
  if (fog.exImg && boxOk) await new Promise(ok => { const im = new Image(); im.onload = () => { exC.getContext("2d").drawImage(im, 0, 0, box.w, box.h); ok(); }; im.onerror = ok; im.src = fog.exImg; });
}
function updateExplored(){ // o mestre soma ao "já visto" o que o grupo enxerga agora
  if (!isGM) return; clearTimeout(exT);
  exT = setTimeout(async () => {
    const vs = tokens.filter(t => VI(t) && t.o); if (!vs.length) return;
    const box = exBoxNow(); await ensureExC(box);
    RT = box; let U; try { [U] = visibleMask(vs, tokens); } finally { RT = null; }
    const x = exC.getContext("2d"); x.globalCompositeOperation = "source-over"; x.drawImage(U, 0, 0);
    const url = exC.toDataURL("image/png");
    if (url === fog.exImg) return;
    fog.exImg = url; fog.exBox = [box.x0, box.y0, box.W, box.H]; exImgSrc = null;
    save("fog", false); dirty = true;
  }, 400);
}
function wallsChanged(){ wallsVer++; save("scene"); dirty = true; }
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
const bgAngle = () => ((scene.bgQ || 0) * 90 + (+scene.bgFine || 0));
function bgBox(){ // tamanho da imagem já girada (ela fica encostada no canto 0,0)
  const w = scene.bgW || 1600, h = scene.bgH || 1000, a = bgAngle() * Math.PI / 180;
  return [Math.abs(w * Math.cos(a)) + Math.abs(h * Math.sin(a)), Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a))];
}
function fit(){
  const [w, h] = scene.bg ? bgBox() : [1600, 1000];
  cam.z = Math.min(innerWidth / w, innerHeight / h) * .92; cam.x = (innerWidth - w * cam.z) / 2; cam.y = (innerHeight - h * cam.z) / 2; dirty = true; drawTop();
}
function centerOn(wx, wy, z){ cam.z = z; cam.x = innerWidth / 2 - wx * z; cam.y = innerHeight / 2 - wy * z; dirty = true; drawTop(); }

// ---------- interação ----------
const pts = new Map();
cv.addEventListener("contextmenu", e => e.preventDefault());
cv.addEventListener("wheel", e => { e.preventDefault(); zoomAt(Math.exp(-e.deltaY * .0015), e.clientX, e.clientY); }, {passive: false});
function hitToken(x, y){
  for (let i = tokens.length - 1; i >= 0; i--) { const t = tokens[i]; if (!isGM && t.h) continue; if (Math.hypot(t.x - x, t.y - y) <= tokR(t)) return t; }
  return null;
}
cv.addEventListener("pointerdown", e => {
  cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); closeFlyoutSoft();
  if (pts.size === 2) { const [p1, p2] = [...pts.values()]; drag = {kind: "pinch", d: Math.hypot(p1[0] - p2[0], p1[1] - p2[1]), z: cam.z}; return; }
  const [wx, wy] = toWorld(e.clientX, e.clientY);
  if (e.button === 2 && tool === "wall" && wallDraft) { wallDraft = null; dirty = true; return; }
  if (e.button === 1 || e.button === 2 || spaceDown) { drag = {kind: "pan", sx: e.clientX, sy: e.clientY, cx: cam.x, cy: cam.y}; cv.classList.add("panning"); return; }
  if (tool === "move") {
    const t = hitToken(wx, wy);
    if (!t && isGM) { const wi = wallAt(wx, wy); const w = walls()[wi]; if (w?.d) { w.o = w.o ? 0 : 1; wallsChanged(); toast(w.o ? "Porta aberta." : "Porta fechada."); return; } }
    const sel = tokens.find(x => x.id === selTok);
    if (sel && (isGM || owns(sel))) { // pegou na setinha do token selecionado?
      const r = tokR(sel), [vx, vy] = dirVec(sel.a || 0), hx = sel.x + vx * r * 1.2, hy = sel.y + vy * r * 1.2;
      if (Math.hypot(wx - hx, wy - hy) <= Math.max(r * .38, 12 / cam.z)) { drag = {kind: "rotate", t: sel}; cv.classList.add("panning"); return; }
    }
    if (t && (isGM || owns(t))) { selTok = t.id; drag = {kind: "token", t, dx: t.x - wx, dy: t.y - wy, moved: false, ox: t.x, oy: t.y, path: [cellAt(t.x, t.y)], grid: t.sn !== false || !isGM}; dirty = true; return; }
    selTok = null; dirty = true;
    drag = {kind: "pan", sx: e.clientX, sy: e.clientY, cx: cam.x, cy: cam.y}; cv.classList.add("panning"); return;
  }
  if (tool === "ruler") { const a = snapPoint(wx, wy); rulers[myKey] = {a, b: a}; drag = {kind: "ruler"}; dirty = true; sendRuler(); return; }
  if (!isGM) return;
  if (tool === "draw") { const p = [Math.round(wx), Math.round(wy)]; drag = {kind: "draw", shape: {id: uid(), t: opt.draw, c: opt.color, w: opt.width, p: opt.draw === "pen" ? [p] : [p, p]}}; return; }
  if (tool === "erase") { eraseAt(wx, wy); drag = {kind: "erase"}; return; }
  if (tool === "wall") {
    if (opt.wall === "erase") { const i = wallAt(wx, wy); if (i >= 0) { walls().splice(i, 1); wallsChanged(); } return; }
    if (!wallDraft) { // pegou numa junção? arrasta
      const h = handleAt(wx, wy);
      if (h) {
        if (h[2] === "p") { const [hx, hy] = h; const pts = []; for (const w of walls()) if (w.p) { if (Math.hypot(w.p[0] - hx, w.p[1] - hy) < .5) pts.push([w, 0]); if (Math.hypot(w.p[2] - hx, w.p[3] - hy) < .5) pts.push([w, 1]); } drag = {kind: "wallpt", pts, from: [hx, hy], moved: false}; }
        else drag = {kind: "wallcirc", w: h[3], mode: h[2], moved: false};
        return;
      }
    }
    if (opt.wall === "circle") { const c = snapWall(wx, wy, e.shiftKey); drag = {kind: "wallcircle", c, r: 0}; return; }
    const p = snapWall(wx, wy, e.shiftKey);
    if (!wallDraft) { wallDraft = p; hoverWall = p; dirty = true; return; }
    if (Math.hypot(p[0] - wallDraft[0], p[1] - wallDraft[1]) > 2) { walls().push({p: [...wallDraft, ...p], d: opt.wall === "door" ? 1 : 0}); wallsChanged(); }
    wallDraft = opt.wall === "door" ? null : p; dirty = true; return;
  }
  if (tool === "fog") {
    if (opt.fogShape === "rect") { drag = {kind: "fogrect", a: [wx, wy], b: [wx, wy]}; return; }
    drag = {kind: "fogbrush", at: [wx, wy]}; fogBrush(wx, wy); return;
  }
});
cv.addEventListener("pointermove", e => {
  if (pts.has(e.pointerId)) pts.set(e.pointerId, [e.clientX, e.clientY]);
  const [wx, wy] = toWorld(e.clientX, e.clientY);
  if (!drag) {
    if (tool === "fog" && isGM && opt.fogShape === "brush") { hoverFog = [wx, wy]; dirty = true; }
    if (tool === "wall" && wallDraft) { hoverWall = snapWall(wx, wy, e.shiftKey); dirty = true; }
    return;
  }
  if (drag.kind === "pinch" && pts.size === 2) { const [p1, p2] = [...pts.values()]; const d = Math.hypot(p1[0] - p2[0], p1[1] - p2[1]); zoomAt((drag.z * d / drag.d) / cam.z, (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2); return; }
  if (drag.kind === "pan") { cam.x = drag.cx + e.clientX - drag.sx; cam.y = drag.cy + e.clientY - drag.sy; dirty = true; return; }
  if (drag.kind === "rotate") {
    let a = Math.atan2(wx - drag.t.x, -(wy - drag.t.y)) * 180 / Math.PI;
    const step = e.shiftKey ? (G().type === "hex" ? 60 : 45) : 5; a = ((Math.round(a / step) * step) % 360 + 360) % 360;
    if (a !== drag.t.a) { drag.t.a = a; drag.moved = true; dirty = true; sendTok(drag.t); }
    return;
  }
  if (drag.kind === "token") {
    const d = drag, px = wx + d.dx, py = wy + d.dy;
    if (d.grid) { // anda casa por casa: mostra o caminho, para na parede e no limite de deslocamento
      d.limit = d.wall = false; pathStep(d, cellAt(px, py));
      const last = d.path[d.path.length - 1], [cx, cy] = d.t.sn === false ? cellCenter(...last) : snapPoint(...cellCenter(...last), d.t.s || 1);
      if (cx !== d.t.x || cy !== d.t.y) { d.t.x = cx; d.t.y = cy; sendTok(d.t); }
    } else { d.t.x = px; d.t.y = py; sendTok(d.t); }
    d.moved = true; dirty = true; return;
  }
  if (drag.kind === "ruler") { rulers[myKey].b = snapPoint(wx, wy); dirty = true; sendRuler(); return; }
  if (drag.kind === "draw") { const p = [Math.round(wx), Math.round(wy)], s = drag.shape; if (s.t === "pen") { const l = s.p[s.p.length - 1]; if (Math.hypot(l[0] - p[0], l[1] - p[1]) > 2 / cam.z) s.p.push(p); } else s.p[1] = p; dirty = true; return; }
  if (drag.kind === "erase") { eraseAt(wx, wy); return; }
  if (drag.kind === "wallcircle") { drag.r = Math.hypot(wx - drag.c[0], wy - drag.c[1]); dirty = true; return; }
  if (drag.kind === "wallpt") { const skip = drag.pts.length === 1 ? drag.pts[0][0] : null; const p = snapWall(wx, wy, e.shiftKey, skip); for (const [w, i] of drag.pts) { w.p[i * 2] = p[0]; w.p[i * 2 + 1] = p[1]; } drag.moved = true; wallsVer++; dirty = true; return; }
  if (drag.kind === "wallcirc") { const w = drag.w; if (drag.mode === "c") w.c = e.shiftKey ? [Math.round(wx), Math.round(wy)] : snapWall(wx, wy, false); else w.r = Math.max(4, Math.hypot(wx - w.c[0], wy - w.c[1])); drag.moved = true; wallsVer++; dirty = true; return; }
  if (drag.kind === "fogrect") { drag.b = [wx, wy]; dirty = true; return; }
  if (drag.kind === "fogbrush") { drag.at = [wx, wy]; fogBrush(wx, wy); return; }
});
function endPointer(e){
  pts.delete(e.pointerId); cv.classList.remove("panning");
  if (!drag) return;
  const d = drag; drag = null;
  if (d.kind === "pinch") return;
  if (d.kind === "rotate") {
    if (d.moved) { const t = d.t; delete tokLive[t.id]; if (isGM) { send("tok", {id: t.id, x: t.x, y: t.y, a: t.a}); save("tokens"); } else send("tokreq", {id: t.id, a: t.a, who: myNick}); }
    return;
  }
  if (d.kind === "token") {
    if (d.moved) {
      const [x, y] = d.grid ? [d.t.x, d.t.y] : d.t.sn === false ? [Math.round(d.t.x), Math.round(d.t.y)] : snapPoint(d.t.x, d.t.y, d.t.s || 1);
      d.t.x = x; d.t.y = y; delete tokLive[d.t.id];
      if (isGM) { send("tok", {id: d.t.id, x, y}); save("tokens"); }
      else if (x !== d.ox || y !== d.oy) send("tokreq", {id: d.t.id, x, y, who: myNick, path: [[d.ox, d.oy], ...d.path.slice(1).map(c => cellCenter(...c).map(v => Math.round(v * 10) / 10))]});
    }
    dirty = true; return;
  }
  if (d.kind === "ruler") { const rl = rulers[myKey]; setTimeout(() => { if (rulers[myKey] === rl) { delete rulers[myKey]; dirty = true; sendRuler(); } }, 2500); return; }
  if (d.kind === "draw") { const s = d.shape; if (s.p.length > 1 && (s.t === "pen" || Math.hypot(s.p[1][0] - s.p[0][0], s.p[1][1] - s.p[0][1]) > 3)) { drawings.push(s); save("drawings"); } dirty = true; return; }
  if (d.kind === "erase") { if (d.changed) save("drawings"); return; }
  if (d.kind === "wallcircle") { if (d.r > 3) { walls().push({c: d.c, r: Math.round(d.r * 10) / 10}); wallsChanged(); } dirty = true; return; }
  if (d.kind === "wallpt") { if (d.moved) wallsChanged(); else if (opt.wall !== "circle") { wallDraft = d.from; hoverWall = d.from; dirty = true; } return; }
  if (d.kind === "wallcirc") { if (d.moved) wallsChanged(); return; }
  if (d.kind === "fogrect") { fogRect(d.a, d.b); dirty = true; return; }
  if (d.kind === "fogbrush") { save("fog"); dirty = true; }
}
cv.addEventListener("pointerup", endPointer); cv.addEventListener("pointercancel", endPointer);
cv.addEventListener("dblclick", e => { if (!isGM) return; const [wx, wy] = toWorld(e.clientX, e.clientY); const t = hitToken(wx, wy); if (t) openTokenPanel(t); });
cv.addEventListener("contextmenu", e => { if (!isGM) return; const [wx, wy] = toWorld(e.clientX, e.clientY); const t = hitToken(wx, wy); if (t) { e.preventDefault(); drag = null; cv.classList.remove("panning"); selTok = t.id; dirty = true; openTokenPanel(t); } });
function rotateSel(dir){
  const t = tokens.find(x => x.id === selTok); if (!t || !(isGM || owns(t))) return;
  const step = G().type === "hex" ? 60 : 45; t.a = (((t.a || 0) + dir * step) % 360 + 360) % 360; dirty = true;
  if (isGM) { send("tok", {id: t.id, x: t.x, y: t.y, a: t.a}); save("tokens"); } else send("tokreq", {id: t.id, a: t.a, who: myNick});
}
addEventListener("keydown", e => {
  if (e.target.closest?.("input,textarea,select")) return;
  if (e.code === "Space") { spaceDown = true; cv.classList.add("panning"); e.preventDefault(); return; }
  const k = e.key.toLowerCase();
  if ((e.ctrlKey || e.metaKey) && isGM && (k === "z" || k === "y")) { e.preventDefault(); return undo(k === "y" || e.shiftKey); }
  if (e.ctrlKey || e.metaKey) return;
  if (k === "enter" && wallDraft) { wallDraft = null; dirty = true; return; }
  if (k === "escape" && wallDraft) { wallDraft = null; dirty = true; return; }
  if (k === "escape" && diceModal) { closeDiceModal(); return; }
  if (k === "escape") { if (rulers[myKey]) { delete rulers[myKey]; sendRuler(); dirty = true; } closePanel(); closeFlyout(); selTok = null; return; }
  if (k === "+" || k === "=") return zoomAt(1.2);
  if (k === "-") return zoomAt(1 / 1.2);
  if (k === "0") return fit();
  if ((k === "q" || k === "e") && selTok && (tool === "move" || !isGM)) { const t = tokens.find(x => x.id === selTok); if (t && (isGM || owns(t))) { e.preventDefault(); return rotateSel(k === "q" ? -1 : 1); } }
  const map = {v: "move", r: "ruler", d: "draw", e: "erase", f: "fog", w: "wall"};
  if (map[k] && (isGM || k === "v" || k === "r")) setTool(map[k]);
  if ((k === "delete" || k === "backspace") && selTok && isGM) { const t = tokens.find(x => x.id === selTok); if (t && confirm(`Remover o token “${t.n || "sem nome"}”?`)) { tokens = tokens.filter(x => x.id !== t.id); selTok = null; save("tokens"); dirty = true; } }
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
function sendTok(t){ const now = performance.now(); if (now - tokT < 45) return; tokT = now; send("tok", {id: t.id, x: Math.round(t.x), y: Math.round(t.y), a: t.a || 0, live: 1}); }
let rulerT = 0, rulerPending = null;
function sendRuler(){
  const now = performance.now(); clearTimeout(rulerPending);
  if (now - rulerT < 50) { rulerPending = setTimeout(sendRuler, 55); return; }
  rulerT = now; send("ruler", {k: myKey, r: rulers[myKey] || null});
}
const saveTimers = {};
const undoS = [], redoS = [], prevJSON = {}, lastPush = {};
const getCol = col => col === "scene" ? scene : col === "tokens" ? tokens : col === "fog" ? {...fog, ex: undefined, exImg: undefined} : drawings;
function snapPrev(col){ try { prevJSON[col] = JSON.stringify(getCol(col)); } catch {} }
function pushUndo(col, merge){
  const cur = JSON.stringify(getCol(col)); if (prevJSON[col] == null) { prevJSON[col] = cur; return; }
  if (cur === prevJSON[col]) return;
  const now = Date.now();
  if (!(merge && undoS.length && undoS[undoS.length - 1].col === col && now - (lastPush[col] || 0) < 800)) { undoS.push({col, json: prevJSON[col]}); if (undoS.length > 80) undoS.shift(); redoS.length = 0; }
  lastPush[col] = now; prevJSON[col] = cur;
}
function setCol(col, json){
  const v = JSON.parse(json);
  if (col === "scene") scene = v; else if (col === "tokens") tokens = v; else if (col === "drawings") drawings = v;
  else if (col === "fog") fog = {...v, ex: fog.ex, exImg: fog.exImg, exBox: fog.exBox};
  prevJSON[col] = json; wallsVer++; losCache.clear(); dirty = true; drawEmpty(); drawTop();
  save(col, false);
}
function undo(redo){
  const from = redo ? redoS : undoS, to = redo ? undoS : redoS;
  const e = from.pop(); if (!e) return toast(redo ? "Nada para refazer." : "Nada para desfazer.");
  to.push({col: e.col, json: JSON.stringify(getCol(e.col))});
  setCol(e.col, e.json); toast(redo ? "Refeito." : "Desfeito.", 1200);
  if (panelKind === "scene") openScenePanel(true); if (flyKind) openFlyout(flyKind);
}
function save(col, undoable = true){
  if (!isGM) return;
  if (undoable) pushUndo(col, undoable === "merge");
  if (col === "tokens" || col === "scene") updateExplored();
  clearTimeout(saveTimers[col]); lastSave[col] = Date.now();
  saveTimers[col] = setTimeout(async () => {
    const val = col === "scene" ? scene : col === "tokens" ? tokens : col === "fog" ? fog : drawings;
    lastSave[col] = Date.now();
    const {error} = await sb.from("map_state").update({[col]: val, updated_at: new Date().toISOString()}).eq("id", 1);
    if (error) return toast("Não salvei o mapa: " + error.message);
    try { if (JSON.stringify(val).length < 180000) send("state", {col, val}); } catch {}  // entrega na hora, sem depender só do banco
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
  setTimeout(() => { for (const c of ["scene", "tokens", "fog", "drawings"]) if (d[c] && fresh(c)) snapPrev(c); }, 0);
  if (d.scene && fresh("scene")) scene = {...scene, ...d.scene, grid: {...scene.grid, ...(d.scene.grid || {})}};
  if (d.tokens && fresh("tokens") && !(drag?.kind === "token")) tokens = d.tokens;
  if (d.scene) wallsVer++;
  if (d.fog && fresh("fog") && !(drag?.kind?.startsWith("fog"))) fog = {on: !!d.fog.on, cells: d.fog.cells || {}, sig: d.fog.sig, exImg: d.fog.exImg || null, exBox: d.fog.exBox || null};
  if (d.drawings && fresh("drawings") && drag?.kind !== "draw") drawings = d.drawings;
  dirty = true; drawTop(); drawEmpty();
}

// ---------- interface ----------
function setTool(t){ tool = t; wallDraft = null; cv.className = "t-" + (t === "wall" ? "draw" : t); drawTools(); if (["draw", "fog", "wall"].includes(t) && isGM) openFlyout(t); else closeFlyout(); dirty = true; }
function drawTools(){
  const btn = (t, icon, label, key) => `<button class="tool" data-tool="${t}" aria-pressed="${tool === t}" title="${label} (${key.toUpperCase()})" aria-label="${label}">${icon}<span class="k">${key.toUpperCase()}</span></button>`;
  $("#tools").innerHTML = btn("move", I.move, isGM ? "Mover tokens e o mapa" : "Mover o mapa", "v") + btn("ruler", I.ruler, "Régua", "r")
    + (isGM ? btn("draw", I.draw, "Desenhar e marcar áreas", "d") + btn("erase", I.erase, "Borracha (apaga desenhos)", "e") + btn("fog", I.fog, "Névoa de guerra", "f") + btn("wall", I.wall, "Paredes e portas (bloqueiam luz e visão)", "w")
      + `<hr><button class="tool" id="addTok" title="Adicionar token" aria-label="Adicionar token">${I.token}</button><button class="tool" id="listTok" title="Lista de tokens" aria-label="Lista de tokens">${I.list}</button><button class="tool" id="sceneBtn" title="Mapa e grid" aria-label="Configurar mapa e grid">${I.gear}</button>` : "");
  $("#tools").onclick = e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.tool) setTool(b.dataset.tool);
    else if (b.id === "addTok") openTokenPanel(null);
    else if (b.id === "listTok") panelKind === "list" ? closePanel() : openTokenList();
    else if (b.id === "sceneBtn") panelKind === "scene" ? closePanel() : openScenePanel();
  };
}
function drawTop(){
  $("#topbar").innerHTML = `<div class="title">Mapa da mesa<small>${isGM ? "mestre" : esc(myNick || "jogador")}</small></div><span class="spacer"></span>
    ${isGM ? `<div class="seg light" id="lightSeg" title="Iluminação do mapa">${[["day", "☀ Dia"], ["dim", "🌗 Penumbra"], ["dark", "🌑 Escuro"]].map(([k, l]) => `<button data-light="${k}" aria-pressed="${(scene.light || "day") === k}">${l}</button>`).join("")}</div>
      <button class="btn" id="prevBtn" aria-pressed="${gmPreview}" title="Mostra por cima do mapa o que os jogadores enxergam">${I.eye} Ver como jogadores</button>` : ""}
    ${isGM ? `<button class="btn" id="castBtn" title="Faz a tela dos jogadores ir para onde você está olhando">${I.cast} Levar jogadores aqui</button>` : ""}
    <div class="zoom"><button class="btn small" id="zOut" aria-label="Diminuir zoom">${I.minus}</button><span>${Math.round(cam.z * 100)}%</span><button class="btn small" id="zIn" aria-label="Aumentar zoom">${I.plus}</button><button class="btn small" id="zFit" title="Enquadrar o mapa (0)" aria-label="Enquadrar">${I.fit}</button></div>`;
  $("#zOut").onclick = () => zoomAt(1 / 1.2); $("#zIn").onclick = () => zoomAt(1.2); $("#zFit").onclick = fit;
  const ls = $("#lightSeg"); if (ls) ls.onclick = e => { const b = e.target.closest("[data-light]"); if (!b) return; scene.light = b.dataset.light; save("scene"); dirty = true; drawTop(); };
  const pb = $("#prevBtn"); if (pb) pb.onclick = () => { gmPreview = !gmPreview; dirty = true; drawTop(); if (gmPreview && !tokens.some(t => VI(t) && t.o)) toast("Nenhum token de jogador tem visão ainda (aba “Visão e luz” do token)."); };
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
  } else if (kind === "wall") {
    f.innerHTML = `<div class="flyout" style="top:${Math.max(10, top - 60)}px"><h4>Paredes e portas</h4>
      <div class="seg" id="wMode" style="margin-bottom:10px"><button data-wm="wall" aria-pressed="${opt.wall === "wall"}">${I.wall} Parede</button><button data-wm="door" aria-pressed="${opt.wall === "door"}">${I.door} Porta</button><button data-wm="circle" aria-pressed="${opt.wall === "circle"}">${I.circle} Círculo</button><button data-wm="erase" aria-pressed="${opt.wall === "erase"}">${I.erase} Apagar</button></div>
      <p class="hint">${opt.wall === "erase" ? "Clique numa parede ou porta para apagar." : opt.wall === "circle" ? "Clique no centro e arraste até o tamanho (bom para troncos de árvore e colunas). Depois dá para arrastar o ponto amarelo (mover) e o azul (tamanho)." : opt.wall === "door" ? "Clique no começo e no fim da porta. Depois, com a ferramenta Mover (V), clique na porta para abrir ou fechar." : "Clique ponto a ponto para desenhar a parede. Enter, Esc ou botão direito terminam. Os pontos grudam nos cantos da grid; segure Shift para soltar. Arraste uma junção (ponto amarelo) para deformar a parede."}</p>
      <p class="hint" style="margin-top:6px"><b>Ctrl+Z</b> desfaz, <b>Ctrl+Y</b> refaz.</p>
      <p class="hint" style="margin-top:6px">Paredes bloqueiam a luz e a visão dos jogadores. Só você vê as linhas.</p>
      <div class="row" style="margin:10px 0 0"><button class="btn small danger" id="wClear">Apagar todas as paredes</button></div></div>`;
    $("#wMode").onclick = e => { const b = e.target.closest("[data-wm]"); if (b) { opt.wall = b.dataset.wm; wallDraft = null; openFlyout("wall"); dirty = true; } };
    $("#wClear").onclick = () => { if (walls().length && confirm("Apagar todas as paredes e portas?")) { scene.walls = []; wallsChanged(); } };
  } else if (kind === "fog") {
    f.innerHTML = `<div class="flyout" style="top:${Math.max(10, top - 40)}px"><h4>Névoa de guerra</h4>
      <label class="chk" style="margin-bottom:10px"><input type="checkbox" id="fOn" ${fog.on ? "checked" : ""}> Névoa ligada</label>
      <div class="seg" id="fMode" style="margin-bottom:8px"><button data-fog="reveal" aria-pressed="${opt.fog === "reveal"}">${I.eye} Revelar</button><button data-fog="hide" aria-pressed="${opt.fog === "hide"}">Esconder</button></div>
      <div class="seg" id="fShape" style="margin-bottom:10px"><button data-fs="brush" aria-pressed="${opt.fogShape === "brush"}">${I.brush} Pincel</button><button data-fs="rect" aria-pressed="${opt.fogShape === "rect"}">${I.rect} Retângulo</button></div>
      ${opt.fogShape === "brush" ? `<div class="lbl">Tamanho do pincel: ${opt.brush} ${opt.brush === 1 ? "casa" : "casas"}</div><input type="range" id="fB" min="1" max="6" value="${opt.brush}">` : ""}
      <div class="row" style="margin:12px 0 0"><button class="btn small" id="fAll">Revelar tudo</button><button class="btn small" id="fNone">Esconder tudo</button></div>
      <p class="hint">Você vê a névoa transparente; os jogadores veem preto. Tokens e desenhos embaixo da névoa ficam escondidos pra eles.</p>
      <div class="lbl" style="margin-top:12px">Memória dos jogadores</div>
      <p class="hint">Onde os personagens já viram fica guardado (mais escuro) quando eles se afastam, no formato exato das paredes.${fog.exImg ? "" : " Ainda nada explorado."}</p>
      <div class="row" style="margin:8px 0 0"><button class="btn small danger" id="fExClear">Apagar memória</button></div></div>`;
    $("#fExClear").onclick = () => { if (confirm("Apagar tudo o que os jogadores já exploraram?")) { fog.exImg = null; fog.exBox = null; fog.ex = {}; exC = null; exReady = false; exImgSrc = null; save("fog", false); dirty = true; openFlyout("fog"); } };
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
    scene.bg = url; scene.bgW = w; scene.bgH = h; scene.bgQ = 0; scene.bgFine = 0; save("scene"); dirty = true; drawEmpty(); fit(); openScenePanel(true);
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
    ${scene.bg ? `<label>Girar a imagem</label>
    <div class="acts" style="margin-top:0"><button class="btn small" id="bgL" title="Girar 90° para a esquerda">↺ 90°</button><button class="btn small" id="bgR" title="Girar 90° para a direita">↻ 90°</button><span class="hint" style="align-self:center">${((scene.bgQ || 0) * 90) % 360}°</span></div>
    <label for="bgFine">Ajuste fino: <b id="bgFineV">${String(+scene.bgFine || 0).replace(".", ",")}°</b></label>
    <input type="range" id="bgFine" min="-15" max="15" step="0.25" value="${+scene.bgFine || 0}">
    <p class="hint">Gire antes de colocar paredes e tokens, porque eles não giram junto com a imagem.</p>` : ""}
    <div class="sect"><label>Formato da grid</label>
      <div class="seg" id="gType"><button data-gt="square" aria-pressed="${g.type === "square"}">▢ Quadrado</button><button data-gt="hex" aria-pressed="${g.type === "hex"}">⬡ Hexágono</button></div>
      ${g.type === "hex" ? `<div class="seg" id="gFlat" style="margin-top:6px"><button data-fl="0" aria-pressed="${!g.flat}">⬡ Em pé</button><button data-fl="1" aria-pressed="${!!g.flat}">⬢ Deitado</button></div>` : ""}
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
  const turn = dq => { scene.bgQ = (((scene.bgQ || 0) + dq) % 4 + 4) % 4; save("scene"); dirty = true; fit(); openScenePanel(true); };
  if ($("#bgL")) { $("#bgL").onclick = () => turn(-1); $("#bgR").onclick = () => turn(1);
    $("#bgFine").oninput = e => { scene.bgFine = +e.target.value; $("#bgFineV").textContent = String(scene.bgFine).replace(".", ",") + "°"; save("scene", "merge"); dirty = true; }; }
  const del = $("#bgDel"); if (del) del.onclick = () => { scene.bg = null; scene.bgW = scene.bgH = 0; save("scene"); dirty = true; drawEmpty(); openScenePanel(true); };
  const gf = $("#gFlat"); if (gf) gf.onclick = e => { const b = e.target.closest("[data-fl]"); if (!b) return; g.flat = b.dataset.fl === "1"; save("scene"); dirty = true; openScenePanel(true); };
  $("#gType").onclick = e => { const b = e.target.closest("[data-gt]"); if (!b || g.type === b.dataset.gt) return; g.type = b.dataset.gt; save("scene"); dirty = true; openScenePanel(true); };
  const live = (id, fn) => { $(id).oninput = e => { fn(+e.target.value); dirty = true; save("scene", "merge"); }; };
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
  const d = JSON.parse(JSON.stringify(t || {n: "", c: COLORS[1], s: 1, img: "", h: false}));
  d.b = [0, 1, 2].map(i => (d.b || [])[i] || {v: "", m: "", c: ["#c0473a", "#7fb2e8", "#3fbf4a"][i]});
  d.au = {on: false, f: "circle", d: 3, c: "#ff3b30", ...(d.au || {})};
  { const v0 = VI({vi: {...(d.vi || {}), on: true}}); d.vi = {on: !!d.vi?.on, rb: v0.rb || 30, rd: v0.rd || 12, rk: v0.rk || 0, ang: v0.ang ?? 180}; if (!t?.vi) d.vi = {on: false, rb: 30, rd: 12, rk: 0, ang: 180}; }
  d.li = {rb: 0, rd: 0, ang: 360, ...(d.li || {})};
  if (d.sn == null) d.sn = true;
  let tab = "props";
  const names = [...new Set([...peersOnMap, ...tokens.map(x => x.o).filter(x => x && x !== "*")])].sort((x, y) => x.localeCompare(y, "pt-BR"));
  const known = !d.o || d.o === "*" || names.includes(d.o);
  const tabs = [["props", "Propriedades"], ["aura", "Aura"], ["vis", "Visão e luz"], ["img", "Imagem"]];
  const DIRS = [["none", "Sem direção"], ["arrow", "Seta de direção"], ["rotate", "Rotacionar imagem"]];
  const ARROWS = [[315, "↖"], [0, "↑"], [45, "↗"], [270, "←"], [null, "•"], [90, "→"], [225, "↙"], [180, "↓"], [135, "↘"]];
  $("#panel").innerHTML = `<div class="panel tokpanel" role="dialog" aria-label="Propriedades do token"><h3>${isNew ? "Novo token" : "Propriedades do token"}</h3>
    <div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" data-tab="${k}" aria-selected="${k === tab}">${l}</button>`).join("")}</div>

    <section data-pane="props">
      <label for="tOwner">Personagem de</label>
      <select id="tOwner">
        <option value="">Ninguém (só o mestre move)</option>
        <option value="*" ${d.o === "*" ? "selected" : ""}>Todos os jogadores</option>
        ${names.map(n => `<option value="${esc(n)}" ${d.o === n ? "selected" : ""}>${esc(n)}${peersOnMap.includes(n) ? " · no mapa agora" : ""}</option>`).join("")}
        <option value="__other" ${known ? "" : "selected"}>Outro nome…</option>
      </select>
      <input type="text" id="tOwnerTxt" maxlength="30" placeholder="Nome do jogador, igual ao que ele usa na mesa" value="${known ? "" : esc(d.o)}" ${known ? "hidden" : ""} style="margin-top:6px">
      <label for="tName">Nome</label><input type="text" id="tName" maxlength="24" value="${esc(d.n)}" placeholder="Ex.: Carroça, Goblin 1, Aria">
      <label>Cor</label><div class="row" id="tColors">${COLORS.map(c => `<button type="button" class="sw" data-color="${c}" style="background:${c}" aria-label="Cor ${c}" aria-pressed="${d.c === c}"></button>`).join("")}</div>
      <label>Tamanho</label><div class="seg" id="tSize">${[[1, "1 casa"], [2, "2"], [3, "3"], [4, "4"]].map(([v, l]) => `<button data-sz="${v}" aria-pressed="${(d.s || 1) === v}">${l}</button>`).join("")}</div>
      <label class="chk" style="margin-top:12px"><input type="checkbox" id="tSnap" ${d.sn ? "checked" : ""}> Agarrar ao grid</label>
      <label for="tSp">Deslocamento por movimento</label><div class="unitin"><input type="number" id="tSp" min="0" step="0.5" value="${d.sp == null ? 9 : d.sp}"><span>${esc(G().unitName)} · 0 = sem limite (vale para o jogador)</span></div>
      <label for="tDir">Direção</label>
      <select id="tDir">${DIRS.map(([k, l]) => `<option value="${k}" ${(d.dir || "none") === k ? "selected" : ""}>${l}</option>`).join("")}</select>
      <div class="dirpad" id="tAng" aria-label="Para onde o token olha">${ARROWS.map(([a, l]) => a == null ? `<span>${l}</span>` : `<button type="button" data-ang="${a}" aria-pressed="${(d.a || 0) === a}" aria-label="Olhar para ${a} graus">${l}</button>`).join("")}</div>
      <p class="hint">No mapa: selecione o token e use Q / E para girar.</p>
      <label>Barrinhas (atual / máximo)</label>
      ${d.b.map((b, i) => `<div class="barrow"><span>${i + 1}</span><input type="text" inputmode="numeric" data-bv="${i}" value="${esc(b.v)}" aria-label="Barrinha ${i + 1} valor"><em>/</em><input type="text" inputmode="numeric" data-bm="${i}" value="${esc(b.m)}" aria-label="Barrinha ${i + 1} máximo"><input type="color" data-bc="${i}" value="${b.c}" aria-label="Cor da barrinha ${i + 1}"></div>`).join("")}
      <label class="chk"><input type="checkbox" id="tBv" ${d.bv !== false ? "checked" : ""}> Jogadores veem as barrinhas</label>
      <label class="chk" style="margin-top:6px"><input type="checkbox" id="tHide" ${d.h ? "checked" : ""}> Token oculto dos jogadores</label>
    </section>

    <section data-pane="aura" hidden>
      <label class="chk big"><input type="checkbox" id="aOn" ${d.au.on ? "checked" : ""}> Possui aura</label>
      <label for="aF">Formato</label>
      <select id="aF"><option value="circle" ${d.au.f === "circle" ? "selected" : ""}>Círculo perfeito</option><option value="square" ${d.au.f === "square" ? "selected" : ""}>Quadrado</option><option value="cells" ${d.au.f === "cells" ? "selected" : ""}>Casas da grid</option></select>
      <label for="aD">Diâmetro</label><div class="unitin"><input type="number" id="aD" min="0" step="0.5" value="${d.au.d}"><span>${esc(G().unitName)}</span></div>
      <label for="aC">Cor da aura</label><input type="color" id="aC" value="${d.au.c}" class="wide">
      <p class="hint">Ex.: luz de tocha, área de medo, alcance de magia.</p>
    </section>

    <section data-pane="vis" hidden>
      <div class="sub-h">Visão do token</div>
      <label class="chk big"><input type="checkbox" id="vOn" ${d.vi.on ? "checked" : ""}> Possui visão</label>
      <div class="grid3">
        <label for="vRb">Sob luz intensa</label><input type="number" id="vRb" min="0" step="0.5" value="${d.vi.rb}"><span>${esc(G().unitName)}</span>
        <label for="vRd">Sob luz fraca</label><input type="number" id="vRd" min="0" step="0.5" value="${d.vi.rd}"><span>${esc(G().unitName)}</span>
        <label for="vRk">Na escuridão</label><input type="number" id="vRk" min="0" step="0.5" value="${d.vi.rk}"><span>${esc(G().unitName)}</span>
        <label for="vAng">Ângulo</label><input type="number" id="vAng" min="10" max="360" step="5" value="${d.vi.ang}"><span>graus</span>
      </div>
      <div class="sub-h">Luz emitida</div>
      <div class="grid3">
        <label for="lRb">Luz intensa</label><input type="number" id="lRb" min="0" step="0.5" value="${d.li.rb}"><span>${esc(G().unitName)}</span>
        <label for="lRd">Luz fraca</label><input type="number" id="lRd" min="0" step="0.5" value="${d.li.rd}"><span>${esc(G().unitName)}</span>
        <label for="lAng">Ângulo</label><input type="number" id="lAng" min="10" max="360" step="5" value="${d.li.ang}"><span>graus</span>
      </div>
      <div class="row" style="margin-top:10px" id="lPre"><button type="button" class="btn small" data-lp="6,6">🔥 Tocha</button><button type="button" class="btn small" data-lp="9,9">🏮 Lanterna</button><button type="button" class="btn small" data-lp="12,12">✨ Luz (magia)</button><button type="button" class="btn small" data-lp="0,0">Apagar</button></div>
      <p class="hint">Como a visão humana: o jogador só enxerga o que está iluminado (ou o que a visão no escuro alcança) e que as paredes não tapam. Ângulo 360 = em volta; menor = cone para a frente do token. A luz do mapa (Dia / Penumbra / Escuro) fica no topo da tela.</p>
    </section>

    <section data-pane="img" hidden>
      <label for="tImg">Imagem (link)</label>
      <div style="display:flex;gap:6px"><input type="url" id="tImg" placeholder="https://… .png" value="${esc(d.img || "")}"><label class="btn small" style="margin:0;color:var(--ink)">Arquivo<input type="file" id="tFile" accept="image/*" hidden></label></div>
      <label for="tIz">Zoom da imagem: <b id="tIzv">${Math.round((d.iz || 1) * 100)}%</b></label><input type="range" id="tIz" min="0.6" max="2.5" step="0.05" value="${d.iz || 1}">
      <div class="tokprev"><canvas id="tPrev" width="120" height="120"></canvas></div>
      ${d.img ? `<button class="btn small danger" id="tImgDel">Tirar imagem</button>` : ""}
    </section>

    <div class="acts foot">${isNew ? "" : `<button class="btn small" id="tDup">Duplicar</button><button class="btn small danger" id="tDel">Remover</button>`}<span class="spacer"></span><button class="btn" id="tCancel">Cancelar</button><button class="btn primary" id="tSave">${isNew ? "Colocar" : "Ok"}</button></div>
  </div>`;
  const P = $("#panel");
  const showTab = k => { tab = k; P.querySelectorAll("[data-tab]").forEach(b => b.setAttribute("aria-selected", b.dataset.tab === k)); P.querySelectorAll("[data-pane]").forEach(x => x.hidden = x.dataset.pane !== k); if (k === "img") prev(); };
  P.querySelector(".tabs").onclick = e => { const b = e.target.closest("[data-tab]"); if (b) showTab(b.dataset.tab); };
  const press = (box, sel, el) => box.querySelectorAll(sel).forEach(x => x.setAttribute("aria-pressed", x === el));
  $("#tOwner").onchange = e => { $("#tOwnerTxt").hidden = e.target.value !== "__other"; if (e.target.value === "__other") $("#tOwnerTxt").focus(); };
  $("#tColors").onclick = e => { const b = e.target.closest("[data-color]"); if (b) { d.c = b.dataset.color; press($("#tColors"), "[data-color]", b); prev(); } };
  $("#tSize").onclick = e => { const b = e.target.closest("[data-sz]"); if (b) { d.s = +b.dataset.sz; press($("#tSize"), "[data-sz]", b); } };
  $("#tAng").onclick = e => { const b = e.target.closest("[data-ang]"); if (b) { d.a = +b.dataset.ang; press($("#tAng"), "[data-ang]", b); if ($("#tDir").value === "none" && !$("#vOn").checked) $("#tDir").value = "arrow"; prev(); } };
  $("#lPre").onclick = e => { const b = e.target.closest("[data-lp]"); if (!b) return; const [rb, rd] = b.dataset.lp.split(","); $("#lRb").value = rb; $("#lRd").value = rd; };
  $("#tIz").oninput = e => { d.iz = +e.target.value; $("#tIzv").textContent = Math.round(d.iz * 100) + "%"; prev(); };
  $("#tImg").onchange = () => prev();
  $("#tFile").onchange = async e => { const f = e.target.files[0]; if (!f) return; toast("Enviando imagem…"); try { $("#tImg").value = await uploadImage(f, "tokens"); toast("Imagem pronta."); prev(); } catch (err) { toast("Não enviei: " + err.message); } };
  const del = $("#tImgDel"); if (del) del.onclick = () => { $("#tImg").value = ""; prev(); };
  function prev(){
    const c = $("#tPrev"); if (!c || P.querySelector('[data-pane="img"]').hidden) return;
    const x = c.getContext("2d"), url = $("#tImg").value.trim(), im = getImg(url);
    x.clearRect(0, 0, 120, 120); x.beginPath(); x.arc(60, 60, 54, 0, Math.PI * 2); x.fillStyle = d.c; x.fill();
    if (im) { x.save(); x.beginPath(); x.arc(60, 60, 47, 0, Math.PI * 2); x.clip(); x.translate(60, 60); if ($("#tDir").value === "rotate") x.rotate((d.a || 0) * Math.PI / 180); const s = Math.max(108 / im.naturalWidth, 108 / im.naturalHeight) * .86 * (d.iz || 1); x.drawImage(im, -im.naturalWidth * s / 2, -im.naturalHeight * s / 2, im.naturalWidth * s, im.naturalHeight * s); x.restore(); }
    else if (url) setTimeout(prev, 300);
    x.lineWidth = 5; x.strokeStyle = "rgba(0,0,0,.5)"; x.beginPath(); x.arc(60, 60, 54, 0, Math.PI * 2); x.stroke();
  }
  $("#tName").focus();
  $("#tName").onkeydown = e => { if (e.key === "Enter") $("#tSave").click(); };
  $("#tCancel").onclick = closePanel;
  const numv = sel => Math.max(0, parseFloat(String($(sel).value).replace(",", ".")) || 0);
  const num = v => { const n = String(v).trim().replace(",", "."); return n === "" ? "" : (isNaN(+n) ? n.slice(0, 6) : +n); };
  $("#tSave").onclick = () => {
    const ow = $("#tOwner").value === "__other" ? $("#tOwnerTxt").value.trim() : $("#tOwner").value;
    const vals = {
      n: $("#tName").value.trim(), c: d.c, s: d.s || 1, o: ow || null, sn: $("#tSnap").checked, sp: Math.max(0, parseFloat(String($("#tSp").value).replace(",", ".")) || 0), dir: $("#tDir").value, a: d.a || 0,
      b: d.b.map((b, i) => ({v: num(P.querySelector(`[data-bv="${i}"]`).value), m: num(P.querySelector(`[data-bm="${i}"]`).value), c: P.querySelector(`[data-bc="${i}"]`).value})),
      bv: $("#tBv").checked, h: $("#tHide").checked,
      au: {on: $("#aOn").checked, f: $("#aF").value, d: Math.max(0, parseFloat(String($("#aD").value).replace(",", ".")) || 0), c: $("#aC").value},
      vi: {on: $("#vOn").checked, rb: numv("#vRb"), rd: numv("#vRd"), rk: numv("#vRk"), ang: Math.min(360, Math.max(10, numv("#vAng") || 360))},
      li: {rb: numv("#lRb"), rd: numv("#lRd"), ang: Math.min(360, Math.max(10, numv("#lAng") || 360))},
      img: $("#tImg").value.trim() || null, iz: d.iz || 1,
    };
    if (isNew) {
      const [wx, wy] = toWorld(innerWidth / 2, innerHeight / 2);
      const off = tokens.length % 5 * G().size; const [x, y] = vals.sn ? snapPoint(wx + off, wy, vals.s) : [Math.round(wx + off), Math.round(wy)];
      const nt = {id: uid(), ...vals, x, y}; tokens.push(nt); selTok = nt.id;
    } else {
      const cur = tokens.find(x => x.id === t.id);   // o mapa pode ter recarregado enquanto a janela estava aberta
      if (!cur) { toast("Esse token foi removido do mapa."); closePanel(); return; }
      Object.assign(cur, vals); if (vals.sn) { const [x, y] = snapPoint(cur.x, cur.y, vals.s); cur.x = x; cur.y = y; }
    }
    save("tokens"); dirty = true; drawEmpty(); closePanel();
  };
  if (!isNew) {
    $("#tDel").onclick = () => { tokens = tokens.filter(x => x.id !== t.id); selTok = null; save("tokens"); dirty = true; closePanel(); };
    $("#tDup").onclick = () => { t = tokens.find(x => x.id === t.id) || t; const c = JSON.parse(JSON.stringify(t)); c.id = uid(); c.n = t.n.replace(/(\d+)$/, m => String(+m + 1)); if (c.n === t.n) c.n = (t.n || "Token") + " 2"; const [x, y] = snapPoint(t.x + G().size * (t.s || 1), t.y, t.s || 1); c.x = x; c.y = y; tokens.push(c); selTok = c.id; save("tokens"); dirty = true; closePanel(); };
  }
}

function askNick(){
  return new Promise(ok => {
    $("#gate").innerHTML = `<form id="nickForm" style="display:flex;flex-direction:column;gap:10px;align-items:center"><b style="font:700 26px/1 var(--display);color:var(--brass)">Qual é o seu nome na mesa?</b>
      <span>O mestre usa esse nome para te dar o controle do seu personagem.</span>
      <input id="nickIn" maxlength="30" required style="background:var(--bg2);border:1px solid var(--line);border-radius:8px;padding:10px 12px;min-width:240px;text-align:center" placeholder="Seu nome">
      <button class="btn primary">Entrar no mapa</button></form>`;
    $("#nickIn").focus();
    $("#nickForm").onsubmit = e => { e.preventDefault(); myNick = $("#nickIn").value.trim().slice(0, 30); try { localStorage.setItem("mesa.nick", myNick); } catch {} ok(); };
  });
}


// ---------- dados (mestre e jogadores) ----------
const DICE = [4, 6, 8, 10, 12, 20, 100];
const DIE_SHAPE = {4: "polygon(50% 4%, 97% 90%, 3% 90%)", 6: "polygon(8% 8%, 92% 8%, 92% 92%, 8% 92%)", 8: "polygon(50% 2%, 96% 50%, 50% 98%, 4% 50%)",
  10: "polygon(50% 2%, 97% 40%, 80% 90%, 20% 90%, 3% 40%)", 12: "polygon(50% 2%, 90% 22%, 98% 65%, 72% 97%, 28% 97%, 2% 65%, 10% 22%)", 20: "polygon(50% 1%, 94% 25%, 94% 75%, 50% 99%, 6% 75%, 6% 25%)", 100: "circle(48%)"};
const DIE_COLOR = {4: "#6a8f4e", 6: "#b8872f", 8: "#4a72b8", 10: "#8a5bb0", 12: "#b0563d", 20: "#c9a227", 100: "#5c8d8a"};
const dShape = d => DIE_SHAPE[d] || "circle(48%)", dColor = d => DIE_COLOR[d] || "#8c7a5c";
const DEF_PRESETS = [{n: "Teste (d20)", f: "1d20"}, {n: "Ataque", f: "1d20+3"}, {n: "Dano", f: "1d8+2"}, {n: "Vantagem", f: "2d20kh1"}];
let presets = (() => { try { const v = JSON.parse(localStorage.getItem("mesa.presets")); return Array.isArray(v) ? v : DEF_PRESETS.slice(); } catch { return DEF_PRESETS.slice(); } })();
const savePresets = () => { try { localStorage.setItem("mesa.presets", JSON.stringify(presets)); } catch {} };
let diceCounts = {}, diceMod = 0, diceAdv = 0, diceSecret = false, diceLog = [], diceText = "", diceModal = false, lastResult = null;
const dieEl = (d, v, cls = "") => `<span class="die d${d} ${cls}" style="--dc:${dColor(d)};--shape:${dShape(d)}"><span class="die-n">${v}</span></span>`;
const rnd = x => 1 + Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32 * x);
function countsFormula(){ let f = [...DICE].reverse().filter(d => diceCounts[d] > 0).map(d => `${diceCounts[d]}d${d}`).join(" + "); if (diceMod) f += (f ? (diceMod > 0 ? " + " : " − ") : (diceMod > 0 ? "" : "−")) + Math.abs(diceMod); return f; }
function parseFormula(str){ // "2d20kh1 + 1d6 - 2"
  const src = String(str || "").toLowerCase().replace(/[−–]/g, "-").replace(/\s+/g, "");
  if (!src) throw new Error("fórmula vazia");
  const re = /([+-]?)(?:(\d*)d(\d+)(k[hl]\d+)?|(\d+))/y; const terms = []; let m, pos = 0;
  while (pos < src.length) {
    re.lastIndex = pos; m = re.exec(src); if (!m || !m[0]) throw new Error(`não entendi “${src.slice(pos)}”`);
    if (terms.length && !m[1]) throw new Error("falta + ou − entre os termos");
    const sign = m[1] === "-" ? -1 : 1;
    if (m[3]) { const n = +(m[2] || 1), x = +m[3]; if (n < 1 || n > 50 || x < 2 || x > 1000) throw new Error("use até 50 dados, de d2 a d1000"); const k = m[4] ? {h: m[4][1] === "h", k: Math.max(1, Math.min(n, +m[4].slice(2)))} : null; terms.push({sign, n, x, k}); }
    else terms.push({sign, c: +m[5]});
    pos = re.lastIndex;
  }
  return terms;
}
function rollFormula(str, adv = 0){
  const terms = parseFormula(str);
  if (adv) { const t = terms.find(t => t.x === 20 && t.n === 1 && !t.k); if (t) { t.n = 2; t.k = {h: adv > 0, k: 1}; } }
  const dice = []; let total = 0, mod = 0;
  for (const t of terms) {
    if (t.c != null) { total += t.sign * t.c; mod += t.sign * t.c; continue; }
    const vals = Array.from({length: t.n}, () => rnd(t.x));
    let keep = vals.map((_, i) => i);
    if (t.k) keep = vals.map((v, i) => [v, i]).sort((a, b) => t.k.h ? b[0] - a[0] : a[0] - b[0]).slice(0, t.k.k).map(x => x[1]);
    vals.forEach((v, i) => { const kept = keep.includes(i); dice.push({d: t.x, v, x: kept ? 0 : 1, neg: t.sign < 0 ? 1 : 0}); if (kept) total += t.sign * v; });
  }
  const f = terms.map((t, i) => (i ? (t.sign < 0 ? " − " : " + ") : (t.sign < 0 ? "−" : "")) + (t.c != null ? t.c : `${t.n}d${t.x}${t.k ? (t.k.h ? "kh" : "kl") + t.k.k : ""}`)).join("");
  return {f, dice, mod, total};
}
const DS = { ctx: null, out: null,
  init(){ if (!this.ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return false; this.ctx = new C(); this.out = this.ctx.createGain(); this.out.gain.value = .9; this.out.connect(this.ctx.destination); } if (this.ctx.state === "suspended") this.ctx.resume(); return true; },
  noise(len){ const c = this.ctx, b = c.createBuffer(1, Math.ceil(c.sampleRate * len), c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; },
  click(t, f, v, len, q = 6){ const c = this.ctx, s = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain(); s.buffer = this.noise(len); bp.type = "bandpass"; bp.frequency.value = f; bp.Q.value = q; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + len); s.connect(bp).connect(g).connect(this.out); s.start(t); },
  tone(t, f, len, v, type = "triangle", f2){ const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + len); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .012); g.gain.exponentialRampToValueAtTime(.001, t + len); o.connect(g).connect(this.out); o.start(t); o.stop(t + len + .05); },
  rattle(n){ if (!this.init()) return; const t0 = this.ctx.currentTime; for (let i = 0; i < 14 + Math.min(n, 8) * 7; i++) { const x = Math.pow(Math.random(), 1.5) * .9; this.click(t0 + x, 1800 + Math.random() * 3200, .22 * (1 - x) + .04, .02); } },
  drumroll(dur){ // rufar de tambor que cresce: suspense
    if (!this.init()) return; const t0 = this.ctx.currentTime; let t = 0, i = 0;
    while (t < dur) { const k = t / dur; this.click(t0 + t, 180 + Math.random() * 90, .08 + k * .32, .06, 1.2); this.click(t0 + t, 2400, .03 + k * .08, .03, 2); t += .055 - k * .02 + (i++ % 2 ? .006 : 0); }
    this.tone(t0, 55, dur, .12 + .0, "sine", 90);
  },
  heart(){ if (!this.init()) return; const t = this.ctx.currentTime; this.tone(t, 70, .18, .5, "sine", 40); this.tone(t + .22, 64, .2, .38, "sine", 38); },
  land(){ if (!this.init()) return; const t = this.ctx.currentTime; this.click(t, 1300 + Math.random() * 500, .6, .05); this.tone(t, 170, .09, .3, "sine", 90); },
  reveal(){ if (!this.init()) return; const t = this.ctx.currentTime; this.click(t, 600, .5, .25, .8); this.tone(t, 110, .35, .35, "sine", 55); },
  crit(){ // fanfarra + coro brilhante
    if (!this.init()) return; const t = this.ctx.currentTime + .03;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => { this.tone(t + i * .09, f, .55, .2, "square"); this.tone(t + i * .09, f * 2, .6, .06, "sine"); });
    [1046.5, 1318.5, 1568, 2093].forEach(f => this.tone(t + .42, f, 1.8, .12, "triangle"));
    this.tone(t + .42, 261.6, 1.6, .22, "sawtooth"); this.tone(t + .42, 130.8, 1.6, .22, "sine");
    for (let i = 0; i < 26; i++) this.tone(t + .45 + i * .045, 1800 + Math.random() * 3600, .3, .045, "sine");
    this.click(t + .42, 5000, .25, .9, .7);
  },
  fumble(){ // "uó uó uó uóóó" + baque
    if (!this.init()) return; const c = this.ctx, t = c.currentTime + .03; let at = t;
    for (const [f, len] of [[311, .32], [293.7, .32], [277.2, .32], [261.6, 1.2]]) {
      const o = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain(); o.type = "sawtooth"; o.frequency.setValueAtTime(f, at);
      lp.type = "lowpass"; lp.frequency.setValueAtTime(500, at); lp.frequency.linearRampToValueAtTime(1400, at + .08); lp.frequency.linearRampToValueAtTime(600, at + len);
      g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(.26, at + .04); g.gain.setValueAtTime(.26, at + len - .08); g.gain.linearRampToValueAtTime(0, at + len);
      if (len > .5) { const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 6; lg.gain.value = 8; lfo.connect(lg).connect(o.frequency); lfo.start(at + .2); lfo.stop(at + len); }
      o.connect(lp).connect(g).connect(this.out); o.start(at); o.stop(at + len + .02); at += len + .04;
    }
    this.tone(t, 60, .6, .5, "sine", 32); this.click(t, 300, .5, .4, .7);
  },
};
// ---------- som das rolagens prontas (YouTube ou link de áudio) ----------
function ytIdOf(u){ try { const x = new URL(String(u).trim()); if (x.hostname.includes("youtu.be")) return x.pathname.slice(1).split("/")[0]; if (x.hostname.includes("youtube.com")) { if (x.searchParams.get("v")) return x.searchParams.get("v"); const m = x.pathname.match(/\/(shorts|embed|live)\/([\w-]{6,})/); if (m) return m[2]; } } catch {} return null; }
function tsec(v){ v = String(v ?? "").trim(); if (!v) return 0; if (v.includes(":")) return v.split(":").reduce((a, b) => a * 60 + (+b || 0), 0); return +v.replace(",", ".") || 0; }
const fmtT = s => { s = Math.max(0, Math.round(+s || 0)); return s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : ""; };
function cleanSnd(x){ if (!x || typeof x !== "object") return null; const u = String(x.u || "").trim().slice(0, 300); if (!/^https:\/\//i.test(u)) return null; return {u, s: Math.max(0, +x.s || 0), e: Math.max(0, +x.e || 0)}; }
let ytReady = null, ytPlayer = null, sndAudio = null, sndStopT = null;
function loadYT(){
  if (ytReady) return ytReady;
  ytReady = new Promise(ok => {
    const dock = document.createElement("div"); dock.style.cssText = "position:fixed;left:-9999px;top:0;width:320px;height:180px"; dock.innerHTML = '<div id="ytSnd"></div>'; document.body.appendChild(dock);
    const make = () => { ytPlayer = new YT.Player("ytSnd", {width: 320, height: 180, playerVars: {playsinline: 1, controls: 0}, events: {onReady: () => ok(ytPlayer)}}); };
    if (window.YT?.Player) make(); else { window.onYouTubeIframeAPIReady = make; const sc = document.createElement("script"); sc.src = "https://www.youtube.com/iframe_api"; document.head.appendChild(sc); }
  });
  return ytReady;
}
async function playSnd(snd){
  snd = cleanSnd(snd); if (!snd) return;
  clearTimeout(sndStopT); try { sndAudio?.pause(); } catch {} try { ytPlayer?.stopVideo?.(); } catch {}
  const dur = snd.e > snd.s ? snd.e - snd.s : 6;
  const id = ytIdOf(snd.u);
  if (id) { const pl = await loadYT(); pl.setVolume(85); pl.loadVideoById({videoId: id, startSeconds: snd.s, endSeconds: snd.s + dur}); sndStopT = setTimeout(() => { try { pl.stopVideo(); } catch {} }, (dur + 1.5) * 1000); }
  else { sndAudio = new Audio(snd.u); sndAudio.volume = .85; sndAudio.currentTime = snd.s; sndAudio.play().catch(() => {}); sndStopT = setTimeout(() => { try { sndAudio.pause(); } catch {} }, dur * 1000); }
}
const natOf = r => { const d20 = r.dice.filter(x => x.d === 20 && !x.x); return d20.some(x => x.v === 20) ? "crit" : d20.some(x => x.v === 1) ? "fumble" : ""; };
function facesHTML(r, big){
  return r.dice.map(x => dieEl(x.d, r.fresh ? "?" : x.v, (big ? "big2 " : "mini ") + (x.x ? "drop " : "") + (!r.fresh && x.d === 20 && !x.x && (x.v === 20 || x.v === 1) ? (x.v === 20 ? "c20" : "c1") : ""))).join("")
    + (r.mod ? `<span class="dmod">${r.mod > 0 ? "+" : "−"}${Math.abs(r.mod)}</span>` : "");
}
function logRow(r){
  const nat = r.fresh ? "" : natOf(r);
  return `<div class="droll ${nat} ${r.fresh ? "fresh" : ""} ${r.secret ? "secret" : ""}" data-rid="${r.id}">
    <div class="dwho">${esc(r.who)}${r.label ? ` · <i>${esc(r.label)}</i>` : ""}${r.secret ? " · secreta" : ""}<span>${esc(r.f)}</span></div>
    <div class="dfaces">${facesHTML(r)}</div>
    <div class="dtot">${r.fresh ? "…" : r.total}</div>
    ${nat === "crit" ? '<div class="dtag">⚔️ CRÍTICO!</div>' : nat === "fumble" ? '<div class="dtag">💀 FALHA CRÍTICA</div>' : ""}</div>`;
}
function drawDiceLog(){
  let el = $("#diceLog"); if (!el) { el = document.createElement("div"); el.id = "diceLog"; el.className = "dlog"; el.setAttribute("aria-live", "polite"); document.body.appendChild(el); }
  el.innerHTML = diceLog.slice(-6).map(logRow).join("");
  el.scrollTop = el.scrollHeight;
}
function drawDiceBar(){
  let el = $("#diceBar"); if (!el) { el = document.createElement("div"); el.id = "diceBar"; el.className = "dicebar"; document.body.appendChild(el); }
  el.innerHTML = `<button class="btn dice-main" id="dOpen" title="Abrir a mesa de dados">🎲 Rolar dados</button>
    <div class="presets" role="toolbar" aria-label="Rolagens prontas">${presets.map((p, i) => `<button class="btn pchip" data-pre="${i}" title="${esc(p.f)}">${esc(p.n)}${p.snd?.u ? " 🔊" : ""}<small>${esc(p.f)}</small></button>`).join("")}
    <button class="btn pchip pedit" id="dEditPre" title="Criar e editar rolagens prontas" aria-label="Editar rolagens prontas">✎</button></div>`;
  $("#dOpen").onclick = () => openDiceModal();
  $("#dEditPre").onclick = () => openDiceModal("presets");
  el.querySelector(".presets").onclick = e => { const b = e.target.closest("[data-pre]"); if (b) { const p = presets[+b.dataset.pre]; doRoll(p.f, 0, p.n, false, p.snd); } };
}
function openDiceModal(focus){
  diceModal = true;
  let m = $("#diceModal"); if (!m) { m = document.createElement("div"); m.id = "diceModal"; m.className = "dmodal-wrap"; document.body.appendChild(m); }
  const any = DICE.some(d => diceCounts[d] > 0);
  if (!diceText && any) diceText = countsFormula();
  const r = lastResult, nat = r ? natOf(r) : "";
  m.innerHTML = `<div class="dmodal" role="dialog" aria-label="Mesa de dados">
    <div class="dm-head"><b>Mesa de dados</b><span class="sub">${isGM ? "mestre" : esc(myNick || "jogador")} · todos veem ${isGM ? "(a menos que seja secreta)" : "a sua rolagem"}</span><button class="btn small" id="dmClose">Fechar</button></div>
    <div class="dm-body">
      <div class="dm-left">
        <div class="dm-menu">${DICE.map(d => { const n = diceCounts[d] || 0; return `<div class="dm-die ${n ? "on" : ""}" style="--dc:${dColor(d)}">
          <button class="dm-pick" data-dp="${d}" aria-label="Adicionar d${d}">${dieEl(d, d === 100 ? "%" : d, "card")}${n ? `<span class="dbadge">${n}×</span>` : ""}</button>
          <span class="dm-lbl">d${d}</span>
          <div class="dm-ctl"><button class="dstep" data-dminus="${d}" ${n ? "" : "disabled"} aria-label="Menos um d${d}">−</button><span>${n}</span><button class="dstep" data-dp="${d}" aria-label="Mais um d${d}">+</button></div></div>`; }).join("")}</div>
        <div class="dm-row"><span class="dm-k">Bônus</span><button class="dstep" data-dm="-1">−</button><b class="dm-mod">${diceMod > 0 ? "+" + diceMod : diceMod}</b><button class="dstep" data-dm="1">+</button>
          <span class="dm-k" style="margin-left:14px">d20</span><div class="seg" id="dmAdv"><button data-adv="0" aria-pressed="${diceAdv === 0}">Normal</button><button data-adv="1" aria-pressed="${diceAdv === 1}">Vantagem</button><button data-adv="-1" aria-pressed="${diceAdv === -1}">Desvantagem</button></div></div>
        <label class="dm-k" for="dmText">Fórmula (pode digitar)</label>
        <div class="dm-row"><input id="dmText" value="${esc(diceText)}" placeholder="ex.: 1d20+5, 2d6+1d4+2, 4d6kh3"><button class="btn small" id="dmClear">Limpar</button></div>
        <div class="dm-err" id="dmErr"></div>
        <div class="dm-row">${isGM ? `<label class="chk"><input type="checkbox" id="dmSecret" ${diceSecret ? "checked" : ""}> Rolagem secreta (só você vê)</label>` : ""}<span class="spacer"></span>
          <button class="btn" id="dmSave">☆ Salvar como atalho</button><button class="btn primary dm-roll" id="dmRoll">🎲 Rolar</button></div>
        <div class="dm-result ${nat}" id="dmResult">${r ? `<div class="dm-faces">${facesHTML(r, true)}</div><div class="dm-total">${r.fresh ? "…" : r.total}</div><div class="sub">${esc(r.label ? r.label + " · " : "")}${esc(r.f)}</div>${!r.fresh && nat === "crit" ? '<div class="crit-tag">⚔️ CRÍTICO! 20 natural</div>' : ""}${!r.fresh && nat === "fumble" ? '<div class="fumble-tag">💀 FALHA CRÍTICA… 1 natural</div>' : ""}` : `<div class="sub">Escolha os dados ou use uma rolagem pronta.</div>`}</div>
      </div>
      <div class="dm-right">
        <div class="dm-k">Rolagens prontas <span class="sub">(só neste computador)</span></div>
        <div class="dm-pres" id="dmPres">${presets.map((p, i) => `<div class="dm-pre"><input data-pn="${i}" value="${esc(p.n)}" maxlength="24" aria-label="Nome da rolagem"><input data-pf="${i}" value="${esc(p.f)}" maxlength="40" aria-label="Fórmula"><button class="btn small primary" data-prr="${i}" title="Rolar">🎲</button><button class="btn small" data-pup="${i}" title="Subir" ${i ? "" : "disabled"}>↑</button><button class="btn small danger" data-pdel="${i}" title="Apagar">✕</button>
          <div class="dm-snd"><span title="Som que toca para todos quando rolar">🔊</span><input data-psu="${i}" value="${esc(p.snd?.u || "")}" placeholder="som: link do YouTube ou .mp3 (opcional)" aria-label="Som da rolagem"><input data-pss="${i}" value="${fmtT(p.snd?.s)}" placeholder="início" aria-label="Começa em"><input data-pse="${i}" value="${fmtT(p.snd?.e)}" placeholder="fim" aria-label="Termina em"><button class="btn small" data-pt="${i}" title="Ouvir só aqui">▶</button></div></div>`).join("") || `<p class="hint">Nenhuma ainda.</p>`}</div>
        <button class="btn small" id="dmNewPre">＋ Nova rolagem pronta</button>
        <p class="hint">Aparecem como botões ao lado de “Rolar dados”. Use <b>kh</b>/<b>kl</b> para ficar com os maiores/menores: <b>2d20kh1</b> = vantagem, <b>4d6kh3</b> = atributo.</p>
        <div class="dm-k" style="margin-top:12px">Últimas rolagens</div>
        <div class="dm-hist">${diceLog.slice(-8).reverse().map(x => `<div><b>${esc(x.who)}</b> ${esc(x.label || x.f)} → <b class="${natOf(x)}">${x.fresh ? "…" : x.total}</b></div>`).join("") || `<p class="hint">Nada ainda.</p>`}</div>
      </div>
    </div></div>`;
  const q = sel => m.querySelector(sel);
  const redraw = () => openDiceModal();
  q("#dmClose").onclick = closeDiceModal;
  m.onclick = e => { if (e.target === m) closeDiceModal(); };
  q(".dm-menu").onclick = e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.dp) { const d = +b.dataset.dp; diceCounts[d] = Math.min(50, (diceCounts[d] || 0) + 1); }
    else if (b.dataset.dminus) { const d = +b.dataset.dminus; diceCounts[d] = Math.max(0, (diceCounts[d] || 0) - 1); }
    diceText = countsFormula(); redraw();
  };
  q(".dm-menu").oncontextmenu = e => { const b = e.target.closest("[data-dp]"); if (!b) return; e.preventDefault(); const d = +b.dataset.dp; diceCounts[d] = Math.max(0, (diceCounts[d] || 0) - 1); diceText = countsFormula(); redraw(); };
  m.querySelectorAll("[data-dm]").forEach(b => b.onclick = () => { diceMod = Math.max(-50, Math.min(50, diceMod + +b.dataset.dm)); diceText = countsFormula(); redraw(); });
  q("#dmAdv").onclick = e => { const b = e.target.closest("[data-adv]"); if (b) { diceAdv = +b.dataset.adv; redraw(); } };
  const tx = q("#dmText"); tx.oninput = () => { diceText = tx.value; q("#dmErr").textContent = ""; };
  tx.onkeydown = e => { e.stopPropagation(); if (e.key === "Enter") q("#dmRoll").click(); };
  q("#dmClear").onclick = () => { diceCounts = {}; diceMod = 0; diceText = ""; redraw(); };
  const sc = q("#dmSecret"); if (sc) sc.onchange = e => diceSecret = e.target.checked;
  q("#dmRoll").onclick = () => { try { parseFormula(diceText); } catch (err) { q("#dmErr").textContent = "Fórmula: " + err.message; return; } doRoll(diceText, diceAdv, "", isGM && diceSecret); };
  q("#dmSave").onclick = () => {
    try { parseFormula(diceText); } catch (err) { q("#dmErr").textContent = "Fórmula: " + err.message; return; }
    const f = diceAdv && /(^|[^\d])1?d20(?!\d)/.test(diceText) ? diceText.replace(/(^|[^\d])1?d20(?!\d|k)/, `$12d20${diceAdv > 0 ? "kh1" : "kl1"}`) : diceText;
    presets.push({n: "Nova rolagem", f: f.replace(/\s+/g, "")}); savePresets(); drawDiceBar(); openDiceModal("presets");
    setTimeout(() => { const i = m.querySelector(`[data-pn="${presets.length - 1}"]`); i?.focus(); i?.select(); }, 0);
  };
  const pres = q("#dmPres");
  pres.oninput = e => {
    const ds = e.target.dataset, i = ds.pn ?? ds.pf ?? ds.psu ?? ds.pss ?? ds.pse; if (i == null) return; const p = presets[+i];
    if (ds.pn != null) p.n = e.target.value; else if (ds.pf != null) p.f = e.target.value;
    else { const u = m.querySelector(`[data-psu="${i}"]`).value.trim(); p.snd = u ? {u, s: tsec(m.querySelector(`[data-pss="${i}"]`).value), e: tsec(m.querySelector(`[data-pse="${i}"]`).value)} : null; }
    savePresets(); drawDiceBar();
  };
  pres.onkeydown = e => e.stopPropagation();
  pres.onclick = e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.pt != null) { const p = presets[+b.dataset.pt]; if (!cleanSnd(p.snd)) { q("#dmErr").textContent = "Coloque um link começando com https:// (YouTube ou arquivo de áudio)."; return; } playSnd(p.snd); return; }
    if (b.dataset.prr != null) { const p = presets[+b.dataset.prr]; try { parseFormula(p.f); } catch (err) { q("#dmErr").textContent = `“${p.n}”: ${err.message}`; return; } doRoll(p.f, 0, p.n, isGM && diceSecret, p.snd); }
    else if (b.dataset.pup != null) { const i = +b.dataset.pup; [presets[i - 1], presets[i]] = [presets[i], presets[i - 1]]; savePresets(); drawDiceBar(); redraw(); }
    else if (b.dataset.pdel != null) { presets.splice(+b.dataset.pdel, 1); savePresets(); drawDiceBar(); redraw(); }
  };
  q("#dmNewPre").onclick = () => { presets.push({n: "Nova rolagem", f: "1d20"}); savePresets(); drawDiceBar(); openDiceModal("presets"); setTimeout(() => { const i = m.querySelector(`[data-pn="${presets.length - 1}"]`); i?.focus(); i?.select(); }, 0); };
  if (focus === "presets") q("#dmPres")?.scrollIntoView({block: "nearest"}); else if (!focus) {}
}
addEventListener("keydown", e => { if (e.key === "Escape" && diceModal) { e.preventDefault(); closeDiceModal(); } }, true);
function closeDiceModal(){ diceModal = false; $("#diceModal")?.remove(); }
const stageQ = []; let stageBusy = false;
function addRoll(r, mine){
  r.fresh = true; r.mine = !!mine; if (mine) lastResult = r;
  if (diceModal && mine) openDiceModal("keep");
  if (r.snd) playSnd(r.snd);
  stageQ.push(r); if (!stageBusy) nextStage();
}
function finishRoll(r){
  r.fresh = false; diceLog.push(r); if (diceLog.length > 50) diceLog.shift(); drawDiceLog();
  if (diceModal && r.mine) openDiceModal("keep");
}
function nextStage(){
  const r = stageQ.shift(); if (!r) { stageBusy = false; return; }
  stageBusy = true;
  const fast = stageQ.length > 0;                        // fila grande: vai mais rápido
  const st = document.createElement("div"); st.className = "dstage"; st.setAttribute("role", "dialog"); st.setAttribute("aria-label", "Rolagem de dados");
  const hasD20 = r.dice.some(x => x.d === 20 && !x.x);
  st.innerHTML = `<div class="ds-card">
      <div class="ds-who"><b>${esc(r.who)}</b> ${r.label ? `rola <i>${esc(r.label)}</i>` : "rola os dados"}${r.secret ? " · secreta" : ""}</div>
      <div class="ds-f">${esc(r.f)}</div>
      <div class="ds-table">${r.dice.map((x, i) => `<span class="ds-slot" style="--i:${i};--dx:${Math.round((Math.random() * 2 - 1) * 240)}px;--rot:${Math.round((Math.random() * 2 - 1) * 900)}deg">${dieEl(x.d, "?", "huge rolling" + (x.x ? " dropwait" : ""))}<span class="ds-dl">d${x.d}</span></span>`).join("")}${r.mod ? `<span class="ds-mod">${r.mod > 0 ? "+" : "−"}${Math.abs(r.mod)}</span>` : ""}</div>
      <div class="ds-total" aria-live="polite"></div><div class="ds-tag"></div>
      <div class="ds-hint">clique para fechar</div></div>`;
  document.body.appendChild(st);
  const els = [...st.querySelectorAll(".ds-slot .die")], order = r.dice.map((x, i) => i);
  // o d20 que vale fica por último, para o suspense
  const key = r.dice.findIndex(x => x.d === 20 && !x.x); if (key >= 0) { order.splice(order.indexOf(key), 1); order.push(key); }
  const roll = fast ? 700 : 1500, gap = fast ? 90 : 220, susp = hasD20 && !fast ? 900 : 0;
  const landAt = {}; order.forEach((i, k) => { landAt[i] = roll + k * gap + (i === key ? susp : 0); });
  let endAt = Math.max(...Object.values(landAt)) + 60;
  DS.rattle(r.dice.length); if (!fast) DS.drumroll((endAt - 200) / 1000);
  if (susp) setTimeout(() => { if (st.isConnected) { els[key]?.classList.add("suspense"); DS.heart(); } }, landAt[key] - susp + 100);
  const t0 = performance.now(), lastFlip = {};
  const tick = now => {
    if (!st.isConnected) return;
    const el = now - t0;
    els.forEach((e, i) => {
      if (e.classList.contains("landed")) return;
      const left = landAt[i] - el, n = e.querySelector(".die-n");
      if (left <= 0) {
        n.textContent = r.dice[i].v; e.classList.remove("rolling", "suspense"); e.classList.add("landed");
        if (r.dice[i].x) e.classList.add("drop");
        if (i === key && (r.dice[i].v === 20 || r.dice[i].v === 1)) e.classList.add(r.dice[i].v === 20 ? "c20" : "c1");
        DS.land(); return;
      }
      const every = left < 500 ? 60 + (500 - left) * .5 : 50;   // desacelera antes de parar
      if (!lastFlip[i] || el - lastFlip[i] > every) { lastFlip[i] = el; n.textContent = rnd(r.dice[i].d); }
    });
    if (el < endAt) return requestAnimationFrame(tick);
    reveal();
  };
  requestAnimationFrame(tick);
  let done = false;
  function reveal(){
    const nat = natOf(r);
    const tot = st.querySelector(".ds-total"); let k = 0; const steps = 12, from = Math.max(0, r.total - 12);
    const count = () => { if (!st.isConnected) return; k++; tot.textContent = k >= steps ? r.total : Math.round(from + (r.total - from) * k / steps); if (k < steps) setTimeout(count, 22); };
    tot.classList.add("show"); count(); DS.reveal();
    if (nat === "crit") { st.classList.add("crit"); st.querySelector(".ds-tag").innerHTML = '<span class="crit-tag">⚔️ CRÍTICO! 20 natural ⚔️</span>'; critBurst(st, els[key]); DS.crit(); }
    else if (nat === "fumble") { st.classList.add("fumble"); st.querySelector(".ds-tag").innerHTML = '<span class="fumble-tag">💀 FALHA CRÍTICA… 1 natural</span>'; fumbleFx(st, els[key]); DS.fumble(); }
    finishRoll(r);
    setTimeout(close, fast ? 1100 : nat ? 3600 : 2300);
  }
  function close(){ if (done) return; done = true; st.classList.add("out"); setTimeout(() => { st.remove(); nextStage(); }, 300); }
  st.onclick = () => { if (st.querySelector(".ds-total.show")) close(); else { t0Skip(); } };
  function t0Skip(){ /* pular a animação: revela já */ Object.keys(landAt).forEach(i => landAt[i] = 0); endAt = 0; }
}
function critBurst(st, el){
  if (!el) return; const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const fx = document.createElement("div"); fx.className = "crit-fx"; fx.style.left = cx + "px"; fx.style.top = cy + "px";
  let h = '<span class="crit-rays"></span><span class="crit-ring"></span><span class="crit-ring r2"></span>';
  for (let i = 0; i < 44; i++) { const a = Math.random() * Math.PI * 2, d = 110 + Math.random() * 260; h += `<i style="--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d}px;--s:${.5 + Math.random() * 1.1};--d:${Math.random() * .3}s"></i>`; }
  fx.innerHTML = h; st.appendChild(fx);
}
function fumbleFx(st, el){
  if (!el) return; const r = el.getBoundingClientRect();
  const sk = document.createElement("div"); sk.className = "fumble-skull"; sk.textContent = "💀"; sk.style.left = (r.left + r.width / 2) + "px"; sk.style.top = r.top + "px"; st.appendChild(sk);
}
function doRoll(formula, adv = 0, label = "", secret = false, snd = null){
  let res; try { res = rollFormula(formula, adv); } catch (err) { toast("Não rolei: " + err.message); return; }
  if (adv) res.f += adv > 0 ? " (vantagem)" : " (desvantagem)";
  const r = {id: uid(), who: isGM ? "Mestre" : (myNick || "Jogador"), label: label || "", ...res, secret: !!secret, snd: cleanSnd(snd)};
  if (!r.secret) send("roll", r);
  addRoll(r, true);
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
  if (!isGM && !myNick) await askNick();
  $("#gate").hidden = true;
  fit();
  let reloadT = null;
  sb.channel("mapa-db").on("postgres_changes", {event: "*", schema: "public", table: "map_state"}, () => { clearTimeout(reloadT); reloadT = setTimeout(load, 80); }).subscribe();
  chan = sb.channel("mapa", {config: {broadcast: {self: false}, presence: {key: myKey}}});
  chan.on("broadcast", {event: "tok"}, ({payload: p}) => {
    if (!p?.id) return;
    if (p.live) tokLive[p.id] = p.a != null ? {x: p.x, y: p.y, a: p.a} : {x: p.x, y: p.y};
    else { delete tokLive[p.id]; const t = tokens.find(x => x.id === p.id); if (t) { t.x = p.x; t.y = p.y; if (p.a != null) t.a = p.a; } }
    dirty = true;
  });
  chan.on("broadcast", {event: "tokreq"}, ({payload: p}) => { // jogador moveu/girou o próprio token: o mestre confere e salva
    if (!isGM || !p?.id) return;
    const t = tokens.find(x => x.id === p.id); if (!t || !t.o) return;
    if (t.o !== "*" && String(p.who || "").toLowerCase() !== t.o.toLowerCase()) return;
    if (p.x != null) {
      const [x, y] = t.sn === false ? [Math.round(p.x), Math.round(p.y)] : snapPoint(p.x, p.y, t.s || 1);
      if (!validPath(t, p.path)) { send("tok", {id: t.id, x: t.x, y: t.y, a: t.a}); return; } // caminho inválido (parede ou longe demais): devolve
      t.x = x; t.y = y;
    }
    if (p.a != null) t.a = ((+p.a % 360) + 360) % 360;
    if (p.bi != null && t.b?.[p.bi] && isFinite(+p.bv)) t.b[p.bi].v = Math.round(+p.bv);
    delete tokLive[t.id]; send("tok", {id: t.id, x: t.x, y: t.y, a: t.a}); save("tokens"); dirty = true;
  });
  chan.on("presence", {event: "sync"}, () => {
    const st = chan.presenceState();
    peersOnMap = [...new Set(Object.values(st).map(a => a[a.length - 1]).filter(x => x?.role === "player" && x.name).map(x => x.name))];
  });
  chan.on("broadcast", {event: "ruler"}, ({payload: p}) => { if (!p?.k) return; if (p.r) rulers[p.k] = p.r; else delete rulers[p.k]; dirty = true; });
  chan.on("broadcast", {event: "state"}, ({payload: p}) => { if (!isGM && p?.col) apply({[p.col]: p.val}); });
  if (!isGM) setInterval(load, 20000);                 // rede de segurança
  chan.on("broadcast", {event: "roll"}, ({payload: r}) => { if (r?.id && Array.isArray(r.dice)) addRoll({snd: cleanSnd(r.snd), id: String(r.id), who: String(r.who || "?").slice(0, 30), label: String(r.label || "").slice(0, 30), f: String(r.f || "").slice(0, 60), mod: +r.mod || 0, total: +r.total || 0, dice: r.dice.slice(0, 60).filter(x => x.d >= 2 && x.d <= 1000).map(x => ({d: +x.d, v: +x.v, x: x.x ? 1 : 0})), secret: false}); });
  chan.on("broadcast", {event: "view"}, ({payload: p}) => { if (!isGM && p) { centerOn(p.x, p.y, p.z); toast("O mestre levou você para esta parte do mapa."); } });
  chan.subscribe(st => { if (st === "SUBSCRIBED") chan.track({name: isGM ? "Mestre" : myNick, role: isGM ? "gm" : "player"}); $("#status").textContent = st === "SUBSCRIBED" ? (isGM ? "ao vivo · jogadores veem o que você fizer" : "ao vivo") : "reconectando…"; });
  drawDiceBar(); drawDiceLog();
  requestAnimationFrame(frame);
}
boot();

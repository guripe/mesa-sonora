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
I.spell = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20 14 10"/><path d="m15 3 1.5 3.5L20 8l-3.5 1.5L15 13l-1.5-3.5L10 8l3.5-1.5z"/></svg>';
I.box = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 7 12 3l9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/></svg>';
I.wall = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 5h18v14H3z"/><path d="M3 10h18M3 15h18M9 5v5m6 0v5m-6 0v4m6 0v4"/></svg>';
I.list = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.5"/><circle cx="4.5" cy="12" r="1.5"/><circle cx="4.5" cy="18" r="1.5"/></svg>';
I.dungeon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 3h7v5h4V3h7v7h-5v4h5v7h-7v-5h-4v5H3v-7h5v-4H3z"/></svg>';
I.maps = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/></svg>';
I.notes = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M6 3h11a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6z"/><path d="M6 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2M9 8h6M9 12h6M9 16h4"/></svg>';
I.swords = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M9.5 17.5 21 6V3h-3L6.5 14.5M11 19l-6-6M8 16l-4 4M5 21l-2-2"/></svg>';
I.door = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 21V4l10-1v18"/><path d="M3 21h18"/><circle cx="12" cy="12" r="1"/></svg>';
const COLORS = ["#d0a54c", "#c0473a", "#4a72b8", "#5f9a4a", "#8a5bb0", "#e07b2e", "#e8e2d0", "#222222"];

// ---------- estado ----------
// modo edição: mapa.html?edit=ID abre um mapa salvo em outra aba; nada daqui chega aos jogadores
const EDIT_ID = +new URLSearchParams(location.search).get("edit") || 0, ROW = EDIT_ID || 1;
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
  const key = can ? [t.id, t.n, t.h, isGM, JSON.stringify(t.b || []), (t.tr || []).length, t.pw, t.ph].join("|") : "";
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
    ${isGM && isProp(t) ? `<button class="btn small" data-sb="smaller" title="Diminuir (ou arraste um canto)" aria-label="Diminuir">－</button><span class="sbsize">${String(t.pw || 1).replace(".", ",")}×${String(t.ph || 1).replace(".", ",")}</span><button class="btn small" data-sb="bigger" title="Aumentar (ou arraste um canto)" aria-label="Aumentar">＋</button>` : ""}
    ${isGM && !isProp(t) && t.tr?.length ? `<button class="btn small" data-sb="back" title="Volta para onde estava antes do último movimento">↶ Voltar movimento</button><button class="btn small" data-sb="trail" title="Apagar o rastro deste token">🧹 Rastro</button>` : ""}
    ${isGM ? `<button class="btn small" data-sb="hide">${t.h ? "👁 Mostrar aos jogadores" : "🚫 Ocultar"}</button><button class="btn small danger" data-sb="del">Remover</button>` : ""}</div>
    ${barUI ? `<div class="sbrow">${barUI}</div>` : ""}`;
  const setHP = (i, v) => {
    const cur = tokens.find(x => x.id === selTok); if (!cur?.b?.[i]) return;
    v = Math.round(v); cur.b[i].v = v; dirty = true; selBarKey = "";
    if (isGM) save("tokens"); else tokReq({id: cur.id, bi: i, bv: v, who: myNick});
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
    if (a === "edit") return isProp(cur) ? openPropPanel(cur) : openTokenPanel(cur);
    if (a === "back") { const mv = cur.tr?.pop(); if (!mv) return; const [x, y] = mv[0]; cur.x = x; cur.y = y; send("tok", {id: cur.id, x, y, a: cur.a}); save("tokens"); dirty = true; selBarKey = ""; return toast("Movimento desfeito."); }
    if (a === "trail") { cur.tr = []; save("tokens"); dirty = true; selBarKey = ""; return; }
    else if (a === "l" || a === "r") rotateSel(a === "l" ? -1 : 1);
    else if (a === "bigger" || a === "smaller") { // aumenta/diminui mantendo a proporção
      const k = a === "bigger" ? 1 : -1, w = cur.pw || 1, h = cur.ph || 1, s0 = Math.min(w, h), s1 = Math.max(1, Math.min(20, s0 + k));
      if (s1 === s0) return; const f = s1 / s0; cur.pw = Math.max(1, Math.min(20, Math.round(w * f))); cur.ph = Math.max(1, Math.min(20, Math.round(h * f)));
      const [x, y] = snapProp(cur, cur.x, cur.y); cur.x = x; cur.y = y; save("tokens"); dirty = true; selBarKey = ""; return;
    }
    else if (a === "hide") { cur.h = !cur.h; save("tokens"); dirty = true; toast(cur.h ? "Token oculto dos jogadores." : "Token visível para os jogadores."); }
    else if (a === "del") { if (confirm(`Remover “${cur.n || "token"}”?`)) { tokens = tokens.filter(x => x.id !== cur.id); selTok = null; save("tokens"); dirty = true; } }
  };
}
let myTokens = (() => { try { return JSON.parse(localStorage.getItem("mesa.mytokens")) || []; } catch { return []; } })();
const saveMyTokens = () => { try { localStorage.setItem("mesa.mytokens", JSON.stringify(myTokens)); } catch {} };
function openTokenList(){
  panelKind = "list";
  const row = t => `<div class="tlrow"><span class="tldot" style="background:${esc(t.c || "#d0a54c")}"></span><button class="tlname" data-go="${t.id}">${esc(t.n || "(sem nome)")}${t.h ? ' <em>oculto</em>' : ""}${t.o ? ` <small>· ${t.o === "*" ? "todos" : esc(t.o)}</small>` : ""}</button>
    <button class="btn small" data-hide="${t.id}" title="${t.h ? "Mostrar" : "Ocultar"}">${t.h ? "👁" : "🚫"}</button><button class="btn small" data-edit="${t.id}">✎</button></div>`;
  $("#panel").innerHTML = `<div class="panel" role="dialog" aria-label="Tokens"><h3>Tokens <button class="btn small" id="pClose">Fechar</button></h3>
    ${tokens.some(t => !isProp(t)) ? tokens.filter(t => !isProp(t)).map(row).join("") : `<p class="hint">Nenhum token ainda.</p>`}
    <div class="acts"><button class="btn primary" id="lNew">${I.plus} Novo token</button><button class="btn" id="lAll" title="Cria um token para cada jogador com o mapa aberto que ainda não tem personagem">👥 Adicionar todos os jogadores</button></div>
    <div class="acat">Meus tokens <span class="sub">(salvos neste computador)</span></div>
    <div class="mytok">${myTokens.map((m, i) => `<button class="btn small" data-mt="${i}" title="Colocar no mapa (Shift+clique apaga)"><span class="tldot" style="background:${esc(m.c || "#d0a54c")}"></span>${esc(m.n || "Token")}</button>`).join("") || `<p class="hint">Na janela de um token, use “☆ Salvar em Meus Tokens”.</p>`}</div>
    ${tokens.some(isProp) ? `<div class="acat">Objetos no mapa</div>${tokens.filter(isProp).map(row).join("")}` : ""}</div>`;
  $("#pClose").onclick = closePanel; $("#lNew").onclick = () => openTokenPanel(null);
  $("#lAll").onclick = () => {
    const have = new Set(tokens.map(t => (t.o || "").toLowerCase())), names = peersOnMap.filter(n => !have.has(n.toLowerCase()));
    if (!names.length) return toast(peersOnMap.length ? "Todos os jogadores no mapa já têm personagem." : "Nenhum jogador está com o mapa aberto agora.");
    const [x0, y0] = placeAt();
    names.forEach((n, i) => { const [x, y] = snapPoint(x0 + i * G().size, y0); tokens.push({id: uid(), n, o: n, c: COLORS[(i + 2) % COLORS.length], s: 1, x, y, sn: true, sp: 9, vi: {on: true, rb: 30, rd: 12, rk: 0, ang: 360}}); });
    save("tokens"); dirty = true; openTokenList(); toast(`${names.length} ${names.length === 1 ? "personagem criado" : "personagens criados"}.`);
  };
  $("#panel").onclick = e => {
    const g = e.target.closest("[data-go]"), h = e.target.closest("[data-hide]"), ed = e.target.closest("[data-edit]"), mt = e.target.closest("[data-mt]");
    if (mt) { const i = +mt.dataset.mt; if (e.shiftKey) { if (confirm("Apagar dos Meus tokens?")) { myTokens.splice(i, 1); saveMyTokens(); openTokenList(); } return; } const c = JSON.parse(JSON.stringify(myTokens[i])); const [x0, y0] = placeAt(); const [x, y] = snapPoint(x0, y0, c.s || 1); tokens.push({...c, id: uid(), x, y}); selTok = tokens[tokens.length - 1].id; save("tokens"); dirty = true; return; }
    if (g) { const t = tokens.find(x => x.id === g.dataset.go); if (t) { selTok = t.id; centerOn(t.x, t.y, Math.max(cam.z, .8)); } }
    if (h) { const t = tokens.find(x => x.id === h.dataset.hide); if (t) { t.h = !t.h; save("tokens"); dirty = true; openTokenList(); } }
    if (ed) { const t = tokens.find(x => x.id === ed.dataset.edit); if (t) isProp(t) ? openPropPanel(t) : openTokenPanel(t); }
  };
}
function frame(){
  if (pings.length || smoothBusy || walking || speakSet.size) dirty = true;
  if (dirty) { dirty = false; paint(); selBar(); }
  requestAnimationFrame(frame);
}
function paint(){
  refreshBlock();
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
  const gcv = !img && genCanvas(); if (gcv) { const gg = scene.gen; ctx.imageSmoothingEnabled = true; ctx.drawImage(gcv, gg.x0 || 0, gg.y0 || 0, gg.w * gg.s, gg.h * gg.s); }
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
  const ts = curTs = tsNow();
  paintDoors();
  for (const t of ts) if (isProp(t) && (isGM || !t.h)) paintProp(t);
  const lightOn = !isGM ? viewers().length : gmPreview && tokens.some(t => VI(t) && t.o);
  if ((!isGM || gmPreview) && !lightOn) paintWallsPlayer(ctx, true);
  for (const e of allTpls()) paintTpl(e.t, selTpl === e.t.id);
  if (drag?.kind === "tplnew") paintTpl(drag.t, true);
  for (const t of ts) if (!isProp(t) && (isGM || !t.h) && (showTrails || selTok === t.id)) paintTrail(t);
  for (const t of ts) if (isGM || !t.h) paintLightGlow(t);
  for (const t of ts) if (isGM || !t.h) paintAura(t);
  if (isGM && !gmPreview) for (const t of ts) if (VI(t)) paintVisionGM(t);
  const vsP = !isGM ? viewers() : [];
  const seenTok = t => isGM || owns(t) || !vsP.length || vsP.some(v => sees(ts.find(x => x.id === v.id) || v, t.x, t.y, ts));
  for (const t of ts) if (!isProp(t) && (isGM || !t.h) && seenTok(t)) paintToken(t);
  paintTurnRing(ts);
  if (speakSet.size) for (const t of ts) if (!isProp(t) && t.o && speakSet.has(t.o.toLowerCase()) && (isGM || !t.h) && seenTok(t)) { // quem está falando na voz
    const r = tokR(t) + 5 / cam.z, pulse = .5 + .5 * Math.sin(performance.now() / 120); ctx.save(); ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, Math.PI * 2); ctx.strokeStyle = `rgba(120,230,140,${.55 + pulse * .4})`; ctx.lineWidth = (3 + pulse * 2) / cam.z; ctx.stroke(); ctx.restore(); }
  // névoa, luz e visão
  if (fog.on) paintFog();
  if (!isGM) {
    const vsL = viewers(); paintLighting(vsL);
    // objetos que bloqueiam (casas, árvores) aparecem por cima da escuridão quando alguém vê a borda deles
    if (vsL.length) for (const t of ts) if (isProp(t) && t.blk && !t.h && propSeen(t, vsL, ts)) paintProp(t);
  }
  else if (gmPreview) paintLighting(tokens.filter(t => VI(t) && t.o), .92);
  if (isGM) paintWalls();
  if (drag?.kind === "fogrect") { const {a, b} = drag; ctx.strokeStyle = opt.fog === "reveal" ? "#ffe28a" : "#e0735e"; ctx.setLineDash([8 / cam.z, 6 / cam.z]); ctx.lineWidth = 2 / cam.z; ctx.strokeRect(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])); ctx.setLineDash([]); }
  const brushAt = drag?.kind === "fogbrush" ? drag.at : (!drag && tool === "fog" && isGM && opt.fogShape === "brush" ? hoverFog : null);
  if (brushAt) { const [a, b] = cellAt(...brushAt); ctx.beginPath(); for (const [ca, cb] of cellsInRange(a, b, opt.brush)) cellPath(ctx, ca, cb); ctx.strokeStyle = opt.fog === "reveal" ? "#ffe28a" : "#e0735e"; ctx.lineWidth = 2 / cam.z; ctx.stroke(); }
  if (drag?.kind === "token" && drag.grid && drag.moved) paintPath(drag);
  paintReach();
  paintRollGM();
  paintPings();
  paintDropPrev();
  if (drag?.kind === "propsize" && drag.at) label(drag.at[0], drag.at[1], `${String(drag.t.pw).replace(".", ",")} × ${String(drag.t.ph).replace(".", ",")} casas`);
  // réguas
  for (const k in rulers) paintRuler(rulers[k], k === myKey);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
function paintDrawing(dr, live){
  if (dr.t === "tpl") return;
  if (dr.t === "text") { const fs = 10 + (dr.w || 4) * 3; ctx.save(); ctx.font = `700 ${fs}px "Alegreya Sans", sans-serif`; ctx.textAlign = "left"; ctx.textBaseline = "top"; ctx.lineWidth = fs * .18; ctx.strokeStyle = "rgba(0,0,0,.75)"; ctx.lineJoin = "round"; String(dr.s || "").split("\n").forEach((ln, i) => { ctx.strokeText(ln, dr.p[0][0], dr.p[0][1] + i * fs * 1.15); ctx.fillStyle = dr.c; ctx.fillText(ln, dr.p[0][0], dr.p[0][1] + i * fs * 1.15); }); ctx.restore(); return; }
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
  propSegs(out);
  segCache = {v: wallsVer, s: out}; return out;
}
function segHit(px, py, dx, dy, [x1, y1, x2, y2]){
  const sx = x2 - x1, sy = y2 - y1, den = dx * sy - dy * sx; if (Math.abs(den) < 1e-9) return Infinity;
  const qx = x1 - px, qy = y1 - py, t = (qx * sy - qy * sx) / den, u = (qx * dy - qy * dx) / den;
  return t >= 0 && u >= -1e-6 && u <= 1 + 1e-6 ? t : Infinity;
}
const losCache = new Map();
function losPoly(x, y, R, skip){ // polígono do que se vê a partir de (x,y) até R, parado pelas paredes (skip = objeto que é a própria fonte de luz)
  const key = `${Math.round(x)},${Math.round(y)},${Math.round(R)},${wallsVer},${skip || ""}`;
  if (losCache.has(key)) return losCache.get(key);
  const segs = blocking().filter(([x1, y1, x2, y2, own]) => !(skip && own === skip) && !(Math.min(x1, x2) > x + R || Math.max(x1, x2) < x - R || Math.min(y1, y2) > y + R || Math.max(y1, y2) < y - R));
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
const LI = t => { const l = t.li; return l && ((+l.rb || 0) > 0 || (+l.rd || 0) > 0) ? {rb: +l.rb || 0, rd: +l.rd || 0, ang: l.ang == null ? 360 : +l.ang, c: l.c || null} : null; };
const lightSkip = t => isProp(t) ? t.id : 0;
let RT = null;   // alvo de desenho: null = tela; senão um retângulo do mundo (usado pela memória)
const LQ = .5;   // a escuridão é calculada em meia resolução (bem mais leve; o desfoque esconde a diferença)
const cvs = {}; function off(k, hi){ if (RT) k += "_w"; let c = cvs[k]; if (!c) { c = cvs[k] = document.createElement("canvas"); } c._q = RT ? 1 : hi ? 1 : LQ; const W0 = RT ? RT.w : Math.ceil(cv.width * c._q), H0 = RT ? RT.h : Math.ceil(cv.height * c._q); if (c.width !== W0 || c.height !== H0) { c.width = W0; c.height = H0; } const x = c.getContext("2d"); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = "source-over"; x.globalAlpha = 1; x.filter = "none"; x.clearRect(0, 0, c.width, c.height); return [c, x]; }
const W = x => { if (RT) return x.setTransform(RT.s, 0, 0, RT.s, -RT.x0 * RT.s, -RT.y0 * RT.s); const d = (devicePixelRatio || 1) * (x.canvas._q || 1); x.setTransform(d * cam.z, 0, 0, d * cam.z, d * cam.x, d * cam.y); };
function lightMasks(ts){ // B = luz intensa, D = luz fraca ou melhor
  const amb = scene.light || "day";
  const [bc, bx] = off("B"), [dc, dx] = off("D");
  if (amb === "day") { bx.fillStyle = dx.fillStyle = "#fff"; bx.fillRect(0, 0, bc.width, bc.height); dx.fillRect(0, 0, dc.width, dc.height); return [bc, dc]; }
  if (amb === "dim") { dx.fillStyle = "#fff"; dx.fillRect(0, 0, dc.width, dc.height); }
  W(bx); W(dx); bx.fillStyle = dx.fillStyle = "#fff";
  for (const t of ts) {
    const l = LI(t); if (!l) continue;
    const R = unitPx(Math.max(l.rb, l.rd)), poly = losPoly(t.x, t.y, R, lightSkip(t));
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
  const ts = curTs || tokens.map(t => tokLive[t.id] ? {...t, ...tokLive[t.id]} : t);
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
  ox.globalCompositeOperation = "destination-out"; ox.filter = `blur(${3 * LQ}px)`; ox.drawImage(U, 0, 0); ox.filter = "none";
  // penumbra: o que se vê sem luz intensa fica mais escuro
  const [pc, px] = off("P"); px.drawImage(U, 0, 0); px.globalCompositeOperation = "destination-out"; px.drawImage(B, 0, 0);
  px.globalCompositeOperation = "source-in"; px.fillStyle = "#060504"; px.fillRect(0, 0, pc.width, pc.height);
  ox.globalCompositeOperation = "source-over"; ox.globalAlpha = .5; ox.filter = `blur(${3 * LQ}px)`; ox.drawImage(pc, 0, 0); ox.filter = "none"; ox.globalAlpha = 1;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = alpha; ctx.imageSmoothingEnabled = true; ctx.drawImage(oc, 0, 0, cv.width, cv.height); ctx.restore();
  // paredes destacadas por cima da escuridão, só onde o jogador enxerga (ou já viu, mais apagadas)
  const [wc, wx] = off("WL", true); W(wx);
  const hasW = paintWallsPlayer(wx); if (walls().some(w => w.d && !w.s)) { W(wx); paintDoors(wx); }
  if (hasW || walls().some(w => w.d && !w.s)) {
    const [mc, mx] = off("WM"), dpr = devicePixelRatio || 1, bl = Math.max(2, G().size * .12 * cam.z * dpr * LQ);
    if (exI && fog.exBox) { const [x0, y0, w, h] = fog.exBox; W(mx); mx.globalAlpha = .5; mx.drawImage(exI, x0, y0, w, h); mx.globalAlpha = 1; mx.setTransform(1, 0, 0, 1, 0, 0); }
    mx.filter = `blur(${bl}px)`; for (let k = 0; k < 3; k++) mx.drawImage(U, 0, 0); mx.filter = "none";
    wx.setTransform(1, 0, 0, 1, 0, 0); wx.globalCompositeOperation = "destination-in"; wx.drawImage(mc, 0, 0, wc.width, wc.height);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = alpha; ctx.drawImage(wc, 0, 0); ctx.restore();
  }
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
  const R = unitPx(Math.max(l.rb, l.rd)), poly = losPoly(t.x, t.y, R, lightSkip(t)), lc = l.c || "#ffbe5a";
  ctx.save(); ctx.beginPath(); shapePath(ctx, t.x, t.y, R, 0, 0, poly); ctx.clip(); ctx.beginPath(); conePath(ctx, t.x, t.y, R, l.ang, t.a || 0); ctx.clip();
  const g = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, R); g.addColorStop(0, hexA(lc, .26)); g.addColorStop(Math.min(.99, unitPx(l.rb) / R || .5), hexA(lc, .11)); g.addColorStop(1, hexA(lc, 0));
  ctx.fillStyle = g; ctx.fillRect(t.x - R, t.y - R, R * 2, R * 2); ctx.restore();
}
function paintWalls(){
  ctx.save(); ctx.lineCap = "round";
  for (const w of walls()) {
    if (w.c) { ctx.beginPath(); ctx.arc(w.c[0], w.c[1], w.r, 0, Math.PI * 2); ctx.lineWidth = 4 / cam.z; ctx.strokeStyle = "rgba(240,130,60,.9)"; ctx.setLineDash([]); ctx.stroke(); continue; }
    const [x1, y1, x2, y2] = w.p;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    if (w.d) { ctx.lineWidth = 7 / cam.z; ctx.strokeStyle = w.o ? "rgba(95,190,110,.9)" : w.s ? "#b86ae0" : "#b07a3a"; ctx.setLineDash(w.o ? [6 / cam.z, 6 / cam.z] : []); }
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
    const poly = losPoly(t.x, t.y, R, lightSkip(t)); if (poly && !pointInPoly(x, y, poly)) continue;
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
// ---------- clicar para andar ----------
let hoverCell = null, reachCache = {key: "", map: null}, walking = null;
function reach(t){ // casas alcançáveis a partir do token (desvia de paredes; respeita o deslocamento do jogador)
  const lim = isGM ? 60 : maxCells(t), start = cellAt(t.x, t.y);
  const key = [t.id, Math.round(t.x), Math.round(t.y), wallsVer, lim, G().size, G().type, FL()].join("|");
  if (reachCache.key === key) return reachCache.map;
  const map = new Map(), k0 = start.join(","); map.set(k0, {c: start, prev: null, d: 0});
  const q = [start];
  while (q.length) {
    const c = q.shift(), cur = map.get(c.join(",")); if (cur.d >= lim) continue;
    const [cx, cy] = cellCenter(...c);
    for (const [da, db] of NEI()) {
      const n = [c[0] + da, c[1] + db], k = n.join(","); if (map.has(k)) continue;
      const [nx, ny] = cellCenter(...n);
      if (!isGM && blockedMove(cx, cy, nx, ny)) continue;
      map.set(k, {c: n, prev: c, d: cur.d + 1}); q.push(n);
      if (map.size > 6000) break;
    }
  }
  reachCache = {key, map}; return map;
}
function pathTo(t, target){ const m = reach(t), e = m.get(target.join(",")); if (!e) return null; const out = []; let c = target; while (c) { out.unshift(c); c = m.get(c.join(",")).prev; } return out; }
function clickMoveTok(){ const t = tokens.find(x => x.id === selTok); return t && !isProp(t) && !isGM && owns(t) && tool === "move" && !walking ? t : null; }  // só jogadores (o mestre continua arrastando)
function paintReach(){
  const t = clickMoveTok(); if (!t || !hoverCell || drag) return;
  if (!isGM) { const m = reach(t); ctx.save(); ctx.beginPath(); for (const {c} of m.values()) cellPath(ctx, ...c); ctx.fillStyle = "rgba(255,226,138,.06)"; ctx.fill(); ctx.restore(); }
  const P = pathTo(t, hoverCell);
  if (P && P.length > 1) paintPath({t, path: P, grid: true, moved: true});
  else if (!P) { const [x, y] = cellCenter(...hoverCell); ctx.save(); ctx.beginPath(); cellPath(ctx, ...hoverCell); ctx.strokeStyle = "#e0735e"; ctx.lineWidth = 2 / cam.z; ctx.stroke(); label(x, y, "longe demais ou bloqueado"); ctx.restore(); }
}
const lerpAng = (a, b, k) => { const d = ((((b - a) % 360) + 540) % 360) - 180; return (a + d * k + 360) % 360; };
function walkTo(t, P){ // anda liso pelo caminho, virando para onde vai
  const cells = P.slice(1); if (!cells.length) return;
  const ox = t.x, oy = t.y, centers = P.map(c => cellCenter(...c));
  const pts = [[t.x, t.y], ...cells.map(c => { const [x, y] = cellCenter(...c); return t.sn === false ? [x, y] : snapPoint(x, y, t.s || 1); })];
  const segMs = 200, total = (pts.length - 1) * segMs, t0 = performance.now(); let lastSend = 0; walking = t.id;
  const tick = now => {
    const cur = tokens.find(x => x.id === t.id); if (!cur) { walking = null; return; }
    const f = Math.max(0, Math.min(pts.length - 1, (now - t0) / segMs)), i = Math.max(0, Math.min(pts.length - 2, Math.floor(f))), u = f - i;
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    cur.x = ax + (bx - ax) * u; cur.y = ay + (by - ay) * u;
    if (Math.hypot(bx - ax, by - ay) > 1) cur.a = lerpAng(cur.a || 0, (Math.atan2(bx - ax, -(by - ay)) * 180 / Math.PI + 360) % 360, .3);
    tokLive[cur.id] = {x: cur.x, y: cur.y, a: cur.a}; dirty = true;
    if (now - lastSend > 50) { lastSend = now; send("tok", {id: cur.id, x: Math.round(cur.x), y: Math.round(cur.y), a: Math.round(cur.a), live: 1}); }
    if (now - t0 < total) return requestAnimationFrame(tick);
    const [ex, ey] = pts[pts.length - 1], [px, py] = pts[pts.length - 2];
    cur.x = ex; cur.y = ey; cur.a = Math.round((Math.atan2(ex - px, -(ey - py)) * 180 / Math.PI + 360) % 360);
    delete tokLive[cur.id]; walking = null; hoverCell = null; dirty = true;
    if (isGM) { pushTrail(cur, centers); send("tok", {id: cur.id, x: cur.x, y: cur.y, a: cur.a}); save("tokens"); }
    else tokReq({id: cur.id, x: cur.x, y: cur.y, a: cur.a, who: myNick, path: [[ox, oy], ...centers.slice(1).map(p => p.map(v => Math.round(v * 10) / 10))]});
  };
  requestAnimationFrame(tick);
}
// posição mostrada na tela: desliza até a posição real (os outros veem o movimento liso, não aos pulos)
let stepsOn = (() => { try { return localStorage.getItem("mesa.steps") !== "0"; } catch { return true; } })();
const disp = {}, stepAcc = {}, stepAt = {}; let lastSmoothT = performance.now(), smoothBusy = false, curTs = null;
function footstep(t){
  const now = performance.now(); if (now - (stepAt[t.id] || 0) < 110) return; stepAt[t.id] = now;
  const mine = isGM || owns(t); DS.step(mine ? .42 : .26, (stepAcc[t.id + "_alt"] = !stepAcc[t.id + "_alt"]));
}
function tsNow(){
  const now = performance.now(), dt = Math.min(120, now - lastSmoothT); lastSmoothT = now; smoothBusy = false;
  const k = 1 - Math.exp(-dt / 75), S = G().size;
  return tokens.map(t0 => {
    const t = tokLive[t0.id] ? {...t0, ...tokLive[t0.id]} : t0; if (isProp(t)) return t;
    const direct = walking === t.id || (drag && drag.t && drag.t.id === t.id);
    let D = disp[t.id]; if (!D) { disp[t.id] = {x: t.x, y: t.y, a: t.a || 0}; return t; }
    const px = D.x, py = D.y, dist = Math.hypot(t.x - D.x, t.y - D.y);
    if (direct || dist > S * 8) { D.x = t.x; D.y = t.y; }
    else if (dist > .4) { D.x += (t.x - D.x) * k; D.y += (t.y - D.y) * k; smoothBusy = true; } else { D.x = t.x; D.y = t.y; }
    const ta = t.a || 0, da = ((((ta - D.a) % 360) + 540) % 360) - 180;
    if (direct || Math.abs(da) < .5) D.a = ta; else { D.a = lerpAng(D.a, ta, k); smoothBusy = true; }
    const mv = Math.hypot(D.x - px, D.y - py);
    if (mv > .05 && mv < S * 3) { stepAcc[t.id] = (stepAcc[t.id] || 0) + mv; if (stepAcc[t.id] >= S * .5) { stepAcc[t.id] = 0; if (isGM || !t.h) footstep(t); } }
    return {...t, x: D.x, y: D.y, a: D.a};
  });
}
function paintPath(d){
  const pts = d.path.map(c => cellCenter(...c)); if (pts.length < 2) return;
  const lim = isGM ? Infinity : maxCells(d.t), steps = pts.length - 1, full = !!d.limit || steps > lim;
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
  refreshBlock();
  if (!Array.isArray(path) || path.length < 2 || path.length > 400) return false;
  if (Math.hypot(path[0][0] - t.x, path[0][1] - t.y) > G().size * .75) return false;
  if (path.length - 1 > maxCells(t)) return false;
  for (let i = 1; i < path.length; i++) { const [a, b] = path[i - 1], [c, e] = path[i]; if (Math.hypot(c - a, e - b) > G().size * 1.5) return false; if (blockedMove(a, b, c, e)) return false; }
  return true;
}

// ---------- assets (objetos do cenário) ----------
let ASSETS = []; fetch("/assets/index.json").then(r => r.json()).then(a => { ASSETS = a; if (panelKind === "assets") openAssets(); }).catch(() => {});
const isProp = t => t && t.k === "prop";
const propSize = t => [(t.pw || 1) * G().size, (t.ph || 1) * G().size];
const propBmp = new Map();
function propBitmap(im, W, H){ // a SVG vira bitmap no tamanho da tela (em degraus), e é reaproveitada
  const d = (devicePixelRatio || 1) * cam.z, q = v => Math.max(8, Math.min(2048, Math.pow(2, Math.ceil(Math.log2(v * d) * 3) / 3)));
  const bw = Math.round(q(W)), bh = Math.round(q(H)), k = im.src + "|" + bw + "|" + bh;
  let c = propBmp.get(k);
  if (!c) { if (propBmp.size > 600) propBmp.clear(); c = document.createElement("canvas"); c.width = bw; c.height = bh; try { c.getContext("2d").drawImage(im, 0, 0, bw, bh); } catch { return im; } propBmp.set(k, c); }
  return c;
}
function paintProp(t){
  const [W, H] = propSize(t), im0 = getImg(t.img), im = im0 ? propBitmap(im0, W, H) : null;
  ctx.save(); if (t.h) ctx.globalAlpha = .45;
  ctx.translate(t.x, t.y); ctx.rotate((t.a || 0) * Math.PI / 180);
  if (im) ctx.drawImage(im, -W / 2, -H / 2, W, H); else { ctx.fillStyle = t.c || "#8a5a2e"; ctx.fillRect(-W / 2, -H / 2, W, H); }
  if (selTok === t.id) {
    ctx.globalAlpha = 1; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2 / cam.z; ctx.setLineDash([6 / cam.z, 4 / cam.z]); ctx.strokeRect(-W / 2, -H / 2, W, H); ctx.setLineDash([]);
    const hy = -H / 2 - 18 / cam.z; ctx.beginPath(); ctx.moveTo(0, -H / 2); ctx.lineTo(0, hy); ctx.stroke(); ctx.beginPath(); ctx.arc(0, hy, 7 / cam.z, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill(); ctx.strokeStyle = "#000"; ctx.lineWidth = 1 / cam.z; ctx.stroke();
    if (isGM) { const q = 9 / cam.z; for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { ctx.fillStyle = "#ffe28a"; ctx.fillRect(sx * W / 2 - q / 2, sy * H / 2 - q / 2, q, q); ctx.strokeStyle = "#1c150c"; ctx.lineWidth = 1.5 / cam.z; ctx.strokeRect(sx * W / 2 - q / 2, sy * H / 2 - q / 2, q, q); } }
  }
  if (t.h && isGM) { ctx.globalAlpha = 1; ctx.fillStyle = "#e0735e"; ctx.font = `700 ${Math.max(10 / cam.z, 12)}px sans-serif`; ctx.textAlign = "center"; ctx.fillText("oculto", 0, 0); }
  ctx.restore();
}
function propLocal(t, x, y){ const a = -(t.a || 0) * Math.PI / 180, dx = x - t.x, dy = y - t.y; return [dx * Math.cos(a) - dy * Math.sin(a), dx * Math.sin(a) + dy * Math.cos(a)]; }
function hitProp(x, y){ for (let i = tokens.length - 1; i >= 0; i--) { const t = tokens[i]; if (!isProp(t)) continue; const [W, H] = propSize(t), [lx, ly] = propLocal(t, x, y); if (Math.abs(lx) <= W / 2 && Math.abs(ly) <= H / 2) return t; } return null; }
function propCorner(t, x, y){ // pegou num dos cantos (alça de tamanho)?
  const [W, H] = propSize(t), [lx, ly] = propLocal(t, x, y), tol = 10 / cam.z;
  return Math.abs(Math.abs(lx) - W / 2) <= tol && Math.abs(Math.abs(ly) - H / 2) <= tol;
}
function propHandle(t){ const [, H] = propSize(t), [vx, vy] = dirVec(t.a || 0), d = H / 2 + 18 / cam.z; return [t.x + vx * d, t.y + vy * d]; }
function snapProp(t, x, y){
  const g = G(); if (t.sn === false) return [Math.round(x), Math.round(y)];
  if (g.type === "hex") return (t.pw || 1) === 1 && (t.ph || 1) === 1 ? snapPoint(x, y) : [Math.round(x), Math.round(y)];
  const rot = Math.round((t.a || 0) / 90) % 2 !== 0, w = rot ? (t.ph || 1) : (t.pw || 1), h = rot ? (t.pw || 1) : (t.ph || 1);
  const sx = w % 2 ? g.ox + (Math.floor((x - g.ox) / g.size) + .5) * g.size : g.ox + Math.round((x - g.ox) / g.size) * g.size;
  const sy = h % 2 ? g.oy + (Math.floor((y - g.oy) / g.size) + .5) * g.size : g.oy + Math.round((y - g.oy) / g.size) * g.size;
  return [sx, sy];
}
let propSigCur = "";
function refreshBlock(){ // objetos que bloqueiam visão contam como parede
  const sig = tokens.filter(t => isProp(t) && (t.blk || propSolid(t))).map(t => `${t.id}${Math.round(t.x)},${Math.round(t.y)},${t.a || 0},${t.pw},${t.ph},${t.blk},${propSolid(t)}`).join("|");
  if (sig !== propSigCur) { propSigCur = sig; wallsVer++; }
}
function propSegs(out){
  for (const t of tokens) {
    if (!isProp(t) || !t.blk) continue;
    const [W, H] = propSize(t), a = (t.a || 0) * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a);
    if (t.blk === "circle") { const r = Math.min(W, H) / 2 * .8, n = 16; for (let i = 0; i < n; i++) { const a1 = i / n * Math.PI * 2, a2 = (i + 1) / n * Math.PI * 2; out.push([t.x + r * Math.cos(a1), t.y + r * Math.sin(a1), t.x + r * Math.cos(a2), t.y + r * Math.sin(a2), t.id]); } continue; }
    const k = .9, P = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => [t.x + u * W / 2 * k * c - v * H / 2 * k * sn, t.y + u * W / 2 * k * sn + v * H / 2 * k * c]);
    for (let i = 0; i < 4; i++) out.push([...P[i], ...P[(i + 1) % 4], t.id]);
  }
}
function propSeen(t, vs, ts){
  const [W, H] = propSize(t), a = (t.a || 0) * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a), pts = [];
  for (const [u, v] of [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]]) { const k = t.blk === "circle" ? .78 : .97; pts.push([t.x + u * W / 2 * k * c - v * H / 2 * k * sn, t.y + u * W / 2 * k * sn + v * H / 2 * k * c]); }
  const live = vs.map(v => ts.find(x => x.id === v.id) || v);
  return pts.some(([x, y]) => live.some(v => sees(v, x, y, ts)));
}
let lastClick = null;
function placeAt(){ // onde colocar coisas novas: último clique no mapa (se estiver na tela) ou centro
  const vw = visibleWorld();
  if (lastClick && lastClick[0] > vw.x0 && lastClick[0] < vw.x1 && lastClick[1] > vw.y0 && lastClick[1] < vw.y1) return lastClick;
  return toWorld(innerWidth / 2, innerHeight / 2);
}
function addProp(a, src){
  const [x0, y0] = placeAt(), t = {id: uid(), k: "prop", n: a.n, img: src || `/assets/${a.path || a.id + ".svg"}`, pw: a.w, ph: a.h, a: 0, blk: a.blk || null, sn: true};
  if (a.li) t.li = {rb: a.li.b * (G().unit || 1), rd: a.li.d * (G().unit || 1), ang: 360, c: a.li.c};
  const [x, y] = snapProp(t, x0, y0); t.x = x; t.y = y;
  tokens.push(t); selTok = t.id; save("tokens"); dirty = true; drawEmpty();
}
let myAssets = (() => { try { return JSON.parse(localStorage.getItem("mesa.myassets")) || []; } catch { return []; } })();
const saveMyAssets = () => { try { localStorage.setItem("mesa.myassets", JSON.stringify(myAssets)); } catch {} };
const ACAT_IC = {"Natureza": "🌳", "Animais": "🐴", "Construção": "🏠", "Cidade": "⛲", "Móveis": "🪑", "Objetos": "📦", "Masmorra": "💀", "Acampamento": "⛺", "Veículos": "🛒"};
let assetCat = (() => { try { return localStorage.getItem("mesa.acat") || "Natureza"; } catch { return "Natureza"; } })(), assetQ = "";
const norm = s => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
function openAssets(){
  panelKind = "assets";
  const ORD = Object.keys(ACAT_IC), cats = [...new Set(ASSETS.map(a => a.cat))].sort((a, b) => (ORD.indexOf(a) + 1 || 99) - (ORD.indexOf(b) + 1 || 99));
  if (assetCat !== "mine" && assetCat !== "light" && !cats.includes(assetCat)) assetCat = cats[0] || "mine";
  $("#panel").innerHTML = `<div class="panel assets-panel" role="dialog" aria-label="Assets"><h3>Assets <button class="btn small" id="pClose">Fechar</button></h3>
    <input type="search" id="aQ" placeholder="Procurar (cavalo, baú, tocha…)" value="${esc(assetQ)}" autocomplete="off">
    <div class="afolders" id="aCats" role="tablist">${cats.map(c => `<button role="tab" data-cat="${esc(c)}" aria-selected="${assetCat === c}">${ACAT_IC[c] || "📁"} ${esc(c)}<small>${ASSETS.filter(a => a.cat === c).length}</small></button>`).join("")}<button role="tab" data-cat="light" aria-selected="${assetCat === "light"}">✨ Que iluminam<small>${ASSETS.filter(a => a.li).length}</small></button><button role="tab" data-cat="mine" aria-selected="${assetCat === "mine"}">⭐ Meus assets<small>${myAssets.length}</small></button></div>
    <div id="aBody"></div>
    <p class="hint"><b>Arraste para o mapa</b> (ou clique: vai para o último lugar clicado). Depois arraste, gire pela bolinha branca e edite com dois cliques. Dá para soltar uma imagem do seu computador direto no mapa. ✨ = ilumina no escuro.</p></div>`;
  $("#pClose").onclick = closePanel;
  const card = (a, key, mine) => `<button class="asset" data-${mine ? "my" : "as"}="${key}" title="${esc(a.n)} · ${a.w}×${a.h} casas${a.blk ? " · bloqueia visão" : ""}${a.li ? " · ilumina" : ""}"><span class="athumb"><img src="${esc(mine ? a.src : `/assets/${a.path || a.id + ".svg"}`)}" alt="" loading="lazy">${a.li ? `<i class="alight" style="--lc:${esc(a.li.c)}">✨</i>` : ""}</span><span class="aname">${esc(a.n)}</span><small>${a.w}×${a.h}</small></button>`;
  const body = () => {
    const q = norm(assetQ.trim()), B = $("#aBody"); if (!B) return;
    $("#aCats").querySelectorAll("[data-cat]").forEach(b => b.setAttribute("aria-selected", !q && b.dataset.cat === assetCat));
    if (!ASSETS.length) { B.innerHTML = `<p class="hint">Carregando…</p>`; return; }
    if (q) { const hits = ASSETS.map((a, i) => [a, i]).filter(([a]) => norm(a.n + " " + a.id + " " + a.cat).includes(q)), mine = myAssets.map((a, i) => [a, i]).filter(([a]) => norm(a.n).includes(q));
      B.innerHTML = hits.length || mine.length ? `<div class="agrid">${hits.map(([a, i]) => card(a, i)).join("")}${mine.map(([a, i]) => card(a, i, true)).join("")}</div>` : `<p class="hint">Nada com “${esc(assetQ)}”.</p>`; return; }
    if (assetCat === "mine") { B.innerHTML = `<div class="agrid">${myAssets.map((a, i) => card(a, i, true)).join("") || `<p class="hint">Nenhum ainda. Envie abaixo (Shift + clique tira da lista).</p>`}</div>
      <div class="sub-add"><input type="text" id="maName" placeholder="Nome" maxlength="24"><input type="url" id="maUrl" placeholder="link da imagem (PNG sem fundo fica melhor)"><div class="two"><label>Larg. <input type="number" id="maW" min="1" max="12" value="1"></label><label>Alt. <input type="number" id="maH" min="1" max="12" value="1"></label></div>
      <div class="acts" style="margin-top:6px"><label class="btn small" style="margin:0;color:var(--ink)">Arquivo…<input type="file" id="maFile" accept="image/*" hidden></label><button class="btn small primary" id="maAdd">＋ Adicionar aos meus assets</button></div></div>`;
      $("#maFile").onchange = async e => { const f = e.target.files[0]; if (!f) return; toast("Enviando…"); try { $("#maUrl").value = await uploadImage(f, "assets"); if (!$("#maName").value) $("#maName").value = f.name.replace(/\.\w+$/, "").slice(0, 24); toast("Imagem pronta."); } catch (err) { toast("Não enviei: " + err.message); } };
      $("#maAdd").onclick = () => { const src = $("#maUrl").value.trim(); if (!/^https?:\/\//.test(src)) return toast("Coloque o link ou envie um arquivo."); myAssets.push({n: $("#maName").value.trim() || "Asset", src, w: Math.max(1, Math.min(12, +$("#maW").value || 1)), h: Math.max(1, Math.min(12, +$("#maH").value || 1))}); saveMyAssets(); openAssets(); };
      return; }
    const list = ASSETS.map((a, i) => [a, i]).filter(([a]) => assetCat === "light" ? a.li : a.cat === assetCat);
    B.innerHTML = `<div class="agrid">${list.map(([a, i]) => card(a, i)).join("")}</div>`;
  };
  body();
  $("#aQ").oninput = e => { assetQ = e.target.value; body(); };
  $("#aCats").onclick = e => { const b = e.target.closest("[data-cat]"); if (!b) return; assetCat = b.dataset.cat; assetQ = ""; $("#aQ").value = ""; try { localStorage.setItem("mesa.acat", assetCat); } catch {} body(); };
  $("#panel").onclick = e => {
    const b = e.target.closest("[data-as],[data-my]"); if (!b) return;
    if (b.dataset.as != null) addProp(ASSETS[+b.dataset.as]);
    else { const a = myAssets[+b.dataset.my]; if (e.shiftKey) { if (confirm(`Tirar “${a.n}” dos meus assets?`)) { myAssets.splice(+b.dataset.my, 1); saveMyAssets(); openAssets(); } return; } addProp({n: a.n, w: a.w, h: a.h, blk: null}, a.src); }
  };
}
function openPropPanel(t){
  panelKind = "prop";
  const d = JSON.parse(JSON.stringify(t));
  $("#panel").innerHTML = `<div class="panel" role="dialog" aria-label="Objeto"><h3>Objeto <button class="btn small" id="pClose">Fechar</button></h3>
    <label for="oN">Nome</label><input type="text" id="oN" maxlength="24" value="${esc(d.n || "")}">
    <div class="two"><div><label for="oW">Largura (casas)</label><input type="number" id="oW" min="1" max="20" value="${d.pw || 1}"></div><div><label for="oH">Altura (casas)</label><input type="number" id="oH" min="1" max="20" value="${d.ph || 1}"></div></div>
    <label for="oA">Ângulo: <b id="oAv">${d.a || 0}°</b></label><input type="range" id="oA" min="0" max="359" step="1" value="${d.a || 0}">
    <label for="oB">Bloqueia a visão e a luz</label><select id="oB"><option value="">Não</option><option value="rect" ${d.blk === "rect" ? "selected" : ""}>Sim, no formato retangular</option><option value="circle" ${d.blk === "circle" ? "selected" : ""}>Sim, redondo (árvores, colunas)</option></select>
    <label for="oI">Imagem (link)</label><input type="url" id="oI" value="${esc(d.img || "")}">
    <div class="lbl" style="margin-top:10px">✨ Emite luz</div>
    <div class="three"><label>Intensa <input type="number" id="oLb" min="0" step="0.5" value="${d.li?.rb || 0}"></label><label>Fraca <input type="number" id="oLd" min="0" step="0.5" value="${d.li?.rd || 0}"></label><label>Cor <input type="color" id="oLc" value="${esc(d.li?.c || "#ffbe5a")}"></label></div>
    <p class="hint" style="margin-top:2px">Em ${esc(G().unitName)}. 0 e 0 = não ilumina. Tocha: 6 e 12.</p>
    <label class="chk" style="margin-top:10px"><input type="checkbox" id="oSo" ${propSolid({...d, h: false}) ? "checked" : ""}> Sólido (os jogadores não atravessam)</label>
    <label class="chk"><input type="checkbox" id="oS" ${d.sn !== false ? "checked" : ""}> Agarrar ao grid</label>
    <label class="chk"><input type="checkbox" id="oHid" ${d.h ? "checked" : ""}> Oculto dos jogadores</label>
    <div class="acts foot"><button class="btn small" id="oDup">Duplicar</button><button class="btn small danger" id="oDel">Remover</button><span class="spacer"></span><button class="btn" id="oCancel">Cancelar</button><button class="btn primary" id="oSave">Ok</button></div></div>`;
  $("#pClose").onclick = $("#oCancel").onclick = closePanel;
  $("#oA").oninput = e => $("#oAv").textContent = e.target.value + "°";
  const cur = () => tokens.find(x => x.id === t.id);
  $("#oSave").onclick = () => { const c = cur(); if (!c) return closePanel(); Object.assign(c, {n: $("#oN").value.trim(), pw: Math.max(1, Math.min(20, +$("#oW").value || 1)), ph: Math.max(1, Math.min(20, +$("#oH").value || 1)), a: +$("#oA").value, blk: $("#oB").value || null, img: $("#oI").value.trim() || c.img, sn: $("#oS").checked, h: $("#oHid").checked, so: $("#oSo").checked ? 1 : 0}); { const lb = Math.max(0, +$("#oLb").value || 0), ld = Math.max(0, +$("#oLd").value || 0); c.li = lb || ld ? {rb: lb, rd: ld, ang: 360, c: $("#oLc").value} : null; } const [x, y] = snapProp(c, c.x, c.y); c.x = x; c.y = y; save("tokens"); dirty = true; closePanel(); };
  $("#oDel").onclick = () => { tokens = tokens.filter(x => x.id !== t.id); selTok = null; save("tokens"); dirty = true; closePanel(); };
  $("#oDup").onclick = () => { const c0 = cur(); if (!c0) return; const c = JSON.parse(JSON.stringify(c0)); c.id = uid(); c.x += G().size * (c.pw || 1); tokens.push(c); selTok = c.id; save("tokens"); dirty = true; closePanel(); };
}

// ---------- limites do mapa (imagem ou masmorra gerada) ----------
function mapBox(full){
  if (scene.bg) { const [w, h] = bgBox(); return [0, 0, w, h]; }
  const g = scene.gen; if (g && g.w) { if (!full && g.bb) return [(g.x0 || 0) + g.bb[0] * g.s, (g.y0 || 0) + g.bb[1] * g.s, (g.bb[2] - g.bb[0]) * g.s, (g.bb[3] - g.bb[1]) * g.s]; return [g.x0 || 0, g.y0 || 0, g.w * g.s, g.h * g.s]; }
  return null;
}
function resetExplore(){ fog.exImg = null; fog.exBox = null; fog.ex = {}; exC = null; exReady = false; exImgSrc = null; exPrevEl = null; clearTimeout(exT); }
function freshDungeonTokens(){ // nova masmorra: só os personagens dos jogadores continuam (inimigos, NPCs e objetos da anterior saem)
  tokLive = {}; rulers = {};
  return tokens.filter(t => !isProp(t) && t.o).map(t => ({...t, tr: []}));
}
const hexA = (c, a) => { const m = /^#?([0-9a-f]{6})$/i.exec(String(c || "")); if (!m) return `rgba(255,180,90,${a})`; const n = parseInt(m[1], 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

// ---------- sem "vai e volta": o que o jogador fez vale na tela dele até o mestre confirmar ----------
const pend = {}, pendDoor = {}, lastReq = {}; let reqSeq = 0;
function tokReq(p){
  p.q = ++reqSeq; lastReq[p.id] = p.q;
  const t = tokens.find(x => x.id === p.id); if (t) pend[p.id] = {x: t.x, y: t.y, a: t.a, b: t.b ? JSON.stringify(t.b) : null, until: Date.now() + 5000};
  send("tokreq", p);
}
function fixPending(){ // um retrato velho do banco chegou depois do que eu fiz: mantém o meu
  const now = Date.now();
  for (const id in pend) {
    const pd = pend[id], t = tokens.find(x => x.id === id); if (!t || now > pd.until) { delete pend[id]; continue; }
    const same = Math.hypot(t.x - pd.x, t.y - pd.y) < 1 && Math.abs(((((t.a || 0) - (pd.a || 0)) % 360) + 540) % 360 - 180) < 2 && (pd.b == null || JSON.stringify(t.b) === pd.b);
    if (same) { delete pend[id]; continue; }
    t.x = pd.x; t.y = pd.y; if (pd.a != null) t.a = pd.a; if (pd.b != null) t.b = JSON.parse(pd.b);
  }
  for (const k in pendDoor) {
    const pd = pendDoor[k], w = walls().find(w => w.d && w.p?.join(",") === k); if (!w || now > pd.until) { delete pendDoor[k]; continue; }
    if ((w.o ? 1 : 0) === pd.o) { delete pendDoor[k]; continue; }
    w.o = pd.o; wallsVer++; losCache.clear();
  }
}
// ---------- o personagem do jogador olha para onde o mouse está ----------
let lookMouse = (() => { try { return localStorage.getItem("mesa.look") !== "0"; } catch { return true; } })(), lookSend = 0, lookT = null;
function lookTok(){ const sel = tokens.find(t => t.id === selTok && !isProp(t) && owns(t)); if (sel) return sel; const mine = tokens.filter(t => !isProp(t) && owns(t)); return mine.length === 1 ? mine[0] : null; }
function lookAt(wx, wy){
  const t = lookTok(); if (!t) return;
  if (Math.hypot(wx - t.x, wy - t.y) < tokR(t) * .8) return;
  const a = Math.round((Math.atan2(wx - t.x, -(wy - t.y)) * 180 / Math.PI + 360) % 360); if (a === Math.round(t.a || 0)) return;
  t.a = a; dirty = true; const now = performance.now(); pend[t.id] = {x: t.x, y: t.y, a, b: null, until: Date.now() + 5000};
  if (now - lookSend > 70) { lookSend = now; send("tok", {id: t.id, x: Math.round(t.x), y: Math.round(t.y), a, live: 1}); }
  clearTimeout(lookT); lookT = setTimeout(() => { if (!walking) tokReq({id: t.id, a: t.a, who: myNick}); }, 350);
}
// ---------- jogadores abrem e fecham portas (perto do próprio personagem) ----------
function doorAt(x, y){ const tol = Math.max(10 / cam.z, G().size * .22); let best = null, bd = tol; for (const w of walls()) { if (!w.d || w.s || !w.p) continue; const dd = distSeg(x, y, [w.p[0], w.p[1]], [w.p[2], w.p[3]]); if (dd < bd) { bd = dd; best = w; } } return best; }
const doorMid = w => [(w.p[0] + w.p[2]) / 2, (w.p[1] + w.p[3]) / 2];
const nearDoor = (t, w) => { const [mx, my] = doorMid(w); return Math.hypot(t.x - mx, t.y - my) <= G().size * 1.6 + tokR(t); };
function playerDoor(w){
  const mine = tokens.filter(t => !isProp(t) && owns(t) && nearDoor(t, w));
  if (!mine.length) return toast("Chegue perto da porta para abrir.");
  send("door", {k: w.p.join(","), who: myNick}); w.o = w.o ? 0 : 1; pendDoor[w.p.join(",")] = {o: w.o, until: Date.now() + 5000}; wallsVer++; losCache.clear(); dirty = true;
  toast(w.o ? "Você abriu a porta." : "Você fechou a porta.", 1500);
}
// ---------- paredes que os jogadores enxergam (a escuridão esconde as que ainda não foram vistas) ----------
function paintWallsPlayer(c, own){ // c já com a transformação do mundo
  const ws = walls(); if (!ws.some(w => !w.d)) return false; c.save();
  const th = Math.max(3 / cam.z, G().size * .09);
  if (own) c.save(); c.lineCap = "round"; c.lineJoin = "round";
  c.beginPath(); for (const w of ws) { if (w.d) continue; if (w.c) { c.moveTo(w.c[0] + w.r, w.c[1]); c.arc(w.c[0], w.c[1], w.r, 0, Math.PI * 2); } else if (w.p) { c.moveTo(w.p[0], w.p[1]); c.lineTo(w.p[2], w.p[3]); } }
  c.strokeStyle = "rgba(0,0,0,.8)"; c.lineWidth = th + 4 / cam.z; c.stroke();
  c.strokeStyle = "#efe2c4"; c.lineWidth = th; c.stroke();
  if (own) c.restore(); c.restore(); return true;
}
// ---------- portas (todos veem as portas normais; as secretas só o mestre) ----------
function paintDoors(c = ctx){ // portas bem marcadas (as secretas não aparecem para os jogadores)
  const th = Math.max(6 / cam.z, G().size * .2), lw = Math.max(1.5 / cam.z, G().size * .035);
  c.save();
  for (const w of walls()) {
    if (!w.d || w.s || !w.p) continue;
    const [x1, y1, x2, y2] = w.p, L = Math.hypot(x2 - x1, y2 - y1); if (!L) continue;
    c.save(); c.translate(x1, y1); c.rotate(Math.atan2(y2 - y1, x2 - x1));
    if (!w.o) {
      c.shadowColor = "rgba(0,0,0,.7)"; c.shadowBlur = 6;
      c.fillStyle = "#6e4020"; c.fillRect(0, -th / 2, L, th); c.shadowBlur = 0;
      c.strokeStyle = "rgba(40,20,8,.8)"; c.lineWidth = lw * .7; for (const k of [.33, .66]) { c.beginPath(); c.moveTo(0, -th / 2 + th * k); c.lineTo(L, -th / 2 + th * k); c.stroke(); }
      c.strokeStyle = "#f2c35a"; c.lineWidth = lw; c.strokeRect(0, -th / 2, L, th);
      c.fillStyle = "#3a3a40"; c.fillRect(L * .1, -th / 2, L * .06, th); c.fillRect(L * .84, -th / 2, L * .06, th);
      c.beginPath(); c.arc(L * .7, 0, th * .2, 0, Math.PI * 2); c.fillStyle = "#ffd76a"; c.fill();
    } else { // aberta: a folha girada pela dobradiça + o arco do movimento
      c.beginPath(); c.moveTo(L * .9, 0); c.arc(0, 0, L * .9, 0, Math.PI / 2); c.strokeStyle = "rgba(242,195,90,.55)"; c.lineWidth = lw; c.setLineDash([lw * 3, lw * 2.5]); c.stroke(); c.setLineDash([]);
      c.rotate(Math.PI / 2); c.fillStyle = "#6e4020"; c.fillRect(0, -th * .4, L * .9, th * .8); c.strokeStyle = "#f2c35a"; c.lineWidth = lw; c.strokeRect(0, -th * .4, L * .9, th * .8);
      c.rotate(-Math.PI / 2); c.beginPath(); c.moveTo(0, 0); c.lineTo(L, 0); c.strokeStyle = "rgba(120,220,130,.55)"; c.lineWidth = lw; c.setLineDash([lw * 2, lw * 2]); c.stroke(); c.setLineDash([]);
    }
    c.restore();
  }
  c.restore();
}

// ---------- gerador de masmorras ----------
function rng(seed){ let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const genOpt = Object.assign({style: "dungeon", w: 70, h: 50, rooms: 12, rmin: 4, rmax: 10, cw: 0, gap: 5, dens: "normal", season: "verao", clear: "camp", pond: true, animals: true, treeBlk: false, houses: 10, market: true, fields: true, ikind: "taverna", graves: "normal", mauso: true, doors: 70, secret: 1, dead: 2, traps: 2, deco: "normal", torches: true, dark: true, seed: 1 + Math.floor(Math.random() * 99999)},
  (() => { try { const o = JSON.parse(localStorage.getItem("mesa.genopt")) || {}; if (!o.v2) { delete o.w; delete o.h; delete o.rooms; delete o.rmin; delete o.rmax; delete o.cw; o.v2 = 1; } return o; } catch { return {}; } })());
const saveGenOpt = () => { try { localStorage.setItem("mesa.genopt", JSON.stringify(genOpt)); } catch {} };
const ROOMT = {
  armazem:   {n: "Armazém",    items: ["caixa", "caixas", "barril", "barris-pilha", "sacos", "saco", "pilha-caixotes", "barril"], wall: ["prateleira"]},
  cripta:    {n: "Cripta",     items: ["sarcofago", "caixao", "ossos", "cranios", "velas", "lapide", "sarcofago"], wall: []},
  tesouro:   {n: "Tesouro",    items: ["bau", "bau-aberto", "ouro", "pedestal", "bau-mimico", "ouro"], wall: ["estatua"]},
  prisao:    {n: "Prisão",     items: ["jaula", "grilhoes", "esqueleto", "balde", "ossos", "jaula"], wall: ["grilhoes"]},
  templo:    {n: "Templo",     items: ["altar", "circulo-ritual", "velas", "braseiro", "braseiro"], wall: ["estatua"]},
  quartel:   {n: "Quartel",    items: ["beliche", "beliche", "mesa", "banquinho", "cadeira", "bau", "armas"], wall: ["armas", "armario"]},
  covil:     {n: "Covil",      items: ["ossos", "cranios", "sangue", "esqueleto", "escombros", "ossos"], wall: []},
  biblioteca:{n: "Biblioteca", items: ["escrivaninha", "candelabro", "livros", "pergaminho", "cadeira"], wall: ["estante", "estante"]},
  vazia:     {n: "Sala",       items: ["escombros", "pilar-quebrado", "ossos", "barril", "sangue"], wall: []},
};
const CAVE_ITEMS = ["estalagmites", "estalagmites", "cristais", "cogumelos-brilho", "pedra", "pedra-musgo", "rochas", "ossos", "agua-rasa", "cogumelos", "escombros", "pedregulho"];
function mergeSegs(segs){ // junta pedaços de parede em linha reta
  const key = (x, y) => x.toFixed(3) + "," + y.toFixed(3), adj = new Map(), used = new Uint8Array(segs.length);
  segs.forEach((s, i) => { for (const k of [key(s[0], s[1]), key(s[2], s[3])]) { if (!adj.has(k)) adj.set(k, []); adj.get(k).push(i); } });
  const dir = s => { const dx = s[2] - s[0], dy = s[3] - s[1], L = Math.hypot(dx, dy) || 1; return [dx / L, dy / L]; };
  const out = [];
  for (let i = 0; i < segs.length; i++) {
    if (used[i]) continue; used[i] = 1;
    const [dx, dy] = dir(segs[i]);
    const grow = (px, py) => { for (;;) {
      const j = (adj.get(key(px, py)) || []).find(j => { if (used[j]) return false; const [ex, ey] = dir(segs[j]); return Math.abs(Math.abs(ex * dx + ey * dy) - 1) < 1e-6; });
      if (j == null) return [px, py]; used[j] = 1; const s = segs[j];
      [px, py] = key(s[0], s[1]) === key(px, py) ? [s[2], s[3]] : [s[0], s[1]];
    } };
    const [x2, y2] = grow(segs[i][2], segs[i][3]), [x1, y1] = grow(segs[i][0], segs[i][1]);
    out.push([x1, y1, x2, y2]);
  }
  return out;
}
function caveContour(T, W, H){ // marching squares nos centros das casas: chão com cantos cortados + paredes
  const v = (x, y) => x < 0 || y < 0 || x >= W || y >= H ? 0 : (T[y * W + x] ? 1 : 0);
  const polys = [], segs = [];
  for (let j = -1; j < H; j++) for (let i = -1; i < W; i++) {
    const c = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]].map(([x, y]) => ({x: x + .5, y: y + .5, in: v(x, y)}));
    const n = c.reduce((s, k) => s + k.in, 0); if (!n) continue;
    const mid = (a, b) => [(a.x + b.x) / 2, (a.y + b.y) / 2];
    if (n === 2 && c[0].in === c[2].in) { // sela: separa as duas pontas
      for (const k of c[0].in ? [0, 2] : [1, 3]) { const p = c[k], a = c[(k + 3) % 4], b = c[(k + 1) % 4], m1 = mid(a, p), m2 = mid(p, b); polys.push([m1, [p.x, p.y], m2]); segs.push([...m1, ...m2]); }
      continue;
    }
    const poly = [], ms = [];
    for (let k = 0; k < 4; k++) {
      const p = c[k], q = c[(k + 1) % 4];
      if (p.in) poly.push([p.x, p.y]);
      if (p.in !== q.in) { const m = mid(p, q); poly.push(m); ms.push(m); }
    }
    if (ms.length === 2) segs.push([...ms[0], ...ms[1]]);
    polys.push(poly);
  }
  const seen = new Set(), clean = [];
  for (const s of segs) { const k1 = s.map(v => v.toFixed(3)).join(","), k2 = [s[2], s[3], s[0], s[1]].map(v => v.toFixed(3)).join(","); if (seen.has(k1) || seen.has(k2) || (s[0] === s[2] && s[1] === s[3])) continue; seen.add(k1); clean.push(s); }
  return {polys, segs: clean};
}
function genMap(o){
  if (OUT_STYLES.has(o.style)) return genScenery(o);
  const R = rng(o.seed), ri = (a, b) => a + Math.floor(R() * (b - a + 1)), pick = a => a[Math.floor(R() * a.length)];
  const W = Math.max(16, Math.min(160, o.w | 0)), H = Math.max(12, Math.min(160, o.h | 0)), GAP = Math.max(2, Math.min(12, o.gap ?? 5));
  let T = new Uint8Array(W * H); const RID = new Int16Array(W * H).fill(-1);
  const at = (x, y) => x < 0 || y < 0 || x >= W || y >= H ? 0 : T[y * W + x];
  const inside = (x, y) => x >= 1 && y >= 1 && x < W - 1 && y < H - 1;
  const rooms = [], doorsOut = [], props = [], occ = new Uint8Array(W * H);
  let start = null, end = null;
  if (o.style === "cave") {
    for (let tries = 0; tries < 8; tries++) {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) T[y * W + x] = inside(x, y) && R() > .44 ? 1 : 0;
      for (let it = 0; it < 5; it++) {
        const N = new Uint8Array(W * H);
        for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { let w = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!at(x + dx, y + dy)) w++; N[y * W + x] = w >= 5 ? 0 : 1; }
        T = N;
      }
      // fica só com a maior região
      const lab = new Int32Array(W * H).fill(-1); let best = -1, bestN = 0, id = 0;
      for (let i = 0; i < W * H; i++) if (T[i] && lab[i] < 0) { let n = 0; const q = [i]; lab[i] = id; while (q.length) { const c = q.pop(); n++; const x = c % W, y = (c / W) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (!at(nx, ny)) continue; const k = ny * W + nx; if (lab[k] < 0) { lab[k] = id; q.push(k); } } } if (n > bestN) { bestN = n; best = id; } id++; }
      for (let i = 0; i < W * H; i++) if (lab[i] !== best) T[i] = 0;
      if (bestN > W * H * .3) break;
    }
    const fl = []; for (let i = 0; i < W * H; i++) if (T[i]) fl.push(i);
    const s0 = fl.reduce((a, b) => (b % W) < (a % W) ? b : a, fl[0]);
    const dist = new Int32Array(W * H).fill(-1); dist[s0] = 0; const q = [s0]; let far = s0;
    while (q.length) { const c = q.shift(); const x = c % W, y = (c / W) | 0; if (dist[c] > dist[far]) far = c; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (!at(nx, ny)) continue; const k = ny * W + nx; if (dist[k] < 0) { dist[k] = dist[c] + 1; q.push(k); } } }
    start = [s0 % W, (s0 / W) | 0]; end = [far % W, (far / W) | 0];
  } else {
    const rmin = Math.max(2, o.rmin | 0), rmax = Math.max(rmin, o.rmax | 0);
    for (let a = 0; a < 600 && rooms.length < o.rooms; a++) {
      const w = ri(rmin, rmax), h = ri(rmin, rmax), x = ri(2, W - w - 2), y = ri(2, H - h - 2);
      if (x < 2 || y < 2) continue;
      const gp = GAP + ri(0, 2);   // espaço entre as salas: corredores mais longos
      if (rooms.some(r => x < r.x + r.w + gp && x + w + gp > r.x && y < r.y + r.h + gp && y + h + gp > r.y)) continue;
      rooms.push({x, y, w, h, i: rooms.length});
    }
    for (const r of rooms) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) { T[y * W + x] = 1; RID[y * W + x] = r.i; }
    const cen = r => [r.x + (r.w >> 1), r.y + (r.h >> 1)];
    let cw = 1; const cwFix = o.cw | 0;   // 0 = variado (1, 2 ou 3 casas)
    const dig = (x, y, v) => { const o0 = -((cw - 1) >> 1); for (let a = o0; a < o0 + cw; a++) for (let b = o0; b < o0 + cw; b++) { const X = x + a, Y = y + b; if (inside(X, Y) && T[Y * W + X] === 0) T[Y * W + X] = v; } };
    const corridor = (A, B, v, wFix) => {
      cw = wFix || cwFix || [1, 1, 2, 2, 3][ri(0, 4)];
      let [x, y] = cen(A); const [x2, y2] = cen(B), hf = R() < .5;
      const stepX = () => { while (x !== x2) { dig(x, y, v); x += Math.sign(x2 - x); } }, stepY = () => { while (y !== y2) { dig(x, y, v); y += Math.sign(y2 - y); } };
      if (hf) { stepX(); stepY(); } else { stepY(); stepX(); } dig(x, y, v);
    };
    // árvore mínima ligando as salas + alguns atalhos
    const linked = new Set(), con = new Set([0]), dd = (a, b) => Math.hypot(cen(a)[0] - cen(b)[0], cen(a)[1] - cen(b)[1]);
    while (con.size < rooms.length) {
      let best = null; for (const i of con) for (const r of rooms) if (!con.has(r.i)) { const d = dd(rooms[i], r); if (!best || d < best[2]) best = [i, r.i, d]; }
      corridor(rooms[best[0]], rooms[best[1]], 2); con.add(best[1]); linked.add(best[0] + "-" + best[1]); linked.add(best[1] + "-" + best[0]);
    }
    for (let k = 0; k < Math.round(rooms.length * .2); k++) { const a = pick(rooms), b = rooms.filter(r => r !== a).sort((p, q) => dd(a, p) - dd(a, q))[ri(0, 2)]; if (b && !linked.has(a.i + "-" + b.i)) { corridor(a, b, 2); linked.add(a.i + "-" + b.i); linked.add(b.i + "-" + a.i); } }
    // passagens secretas
    for (let k = 0; k < (o.secret | 0); k++) {
      const a = pick(rooms), b = rooms.filter(r => r !== a && !linked.has(a.i + "-" + r.i)).sort((p, q) => dd(a, p) - dd(a, q))[0];
      if (!b) break; corridor(a, b, 3, 1); linked.add(a.i + "-" + b.i); linked.add(b.i + "-" + a.i);
    }
    // becos sem saída
    for (let k = 0, g = 0; k < (o.dead | 0) && g < 200; g++) {
      const cells = []; for (let i = 0; i < W * H; i++) if (T[i] === 2) cells.push(i); if (!cells.length) break;
      const c = pick(cells), [dx, dy] = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]), len = ri(3, 7); let x = c % W, y = (c / W) | 0, ok = true; const path = [];
      for (let s = 1; s <= len; s++) { const X = x + dx * s, Y = y + dy * s; if (!inside(X, Y) || at(X, Y) || at(X + dy, Y + dx) || at(X - dy, Y - dx) || at(X + dx, Y + dy) === 1) { ok = false; break; } path.push([X, Y]); }
      if (!ok || path.length < 3) continue; for (const [X, Y] of path) T[Y * W + X] = 2; k++;
    }
    const byX = rooms.slice().sort((a, b) => a.x - b.x); const sR = byX[0], eR = rooms.slice().sort((a, b) => dd(sR, b) - dd(sR, a))[0];
    if (sR) { start = cen(sR); sR.start = true; } if (eR && eR !== sR) { end = cen(eR); eR.end = true; }
  }
  // ---- paredes e portas ----
  const doorEdge = new Set(), segs = [];
  if (o.style !== "cave") {
    for (const r of rooms) {
      const sides = [ // [células de dentro na borda, célula de fora, aresta]
        [...Array(r.w)].map((_, k) => [r.x + k, r.y, r.x + k, r.y - 1, [r.x + k, r.y, r.x + k + 1, r.y]]),
        [...Array(r.w)].map((_, k) => [r.x + k, r.y + r.h - 1, r.x + k, r.y + r.h, [r.x + k, r.y + r.h, r.x + k + 1, r.y + r.h]]),
        [...Array(r.h)].map((_, k) => [r.x, r.y + k, r.x - 1, r.y + k, [r.x, r.y + k, r.x, r.y + k + 1]]),
        [...Array(r.h)].map((_, k) => [r.x + r.w - 1, r.y + k, r.x + r.w, r.y + k, [r.x + r.w, r.y + k, r.x + r.w, r.y + k + 1]]),
      ];
      r.open = [];
      for (const side of sides) {
        let run = [];
        const flush = () => {
          if (!run.length) return;
          const secret = run.some(c => at(c[2], c[3]) === 3);
          if (run.length <= 3 && (secret || R() * 100 < o.doors)) {
            const e0 = run[0][4], e1 = run[run.length - 1][4];
            doorsOut.push([e0[0], e0[1], e1[2], e1[3], secret ? 1 : 0]);
            for (const c of run) doorEdge.add(c[4].join(","));
          }
          for (const c of run) { r.open.push([c[0], c[1]]); occ[c[1] * W + c[0]] = 1; }
          run = [];
        };
        for (const c of side) { if (at(c[2], c[3]) >= 2) run.push(c); else flush(); } flush();
      }
    }
    for (let y = 0; y <= H; y++) for (let x = 0; x < W; x++) { if (!!at(x, y - 1) !== !!at(x, y) && !doorEdge.has([x, y, x + 1, y].join(","))) segs.push([x, y, x + 1, y]); }
    for (let x = 0; x <= W; x++) for (let y = 0; y < H; y++) { if (!!at(x - 1, y) !== !!at(x, y) && !doorEdge.has([x, y, x, y + 1].join(","))) segs.push([x, y, x, y + 1]); }
  } else segs.push(...caveContour(T, W, H).segs);
  const wallsOut = mergeSegs(segs);
  // ---- objetos ----
  const A = id => ASSETS.find(a => a.id === id);
  const free = (x, y, w, h, fl) => { for (let b = y; b < y + h; b++) for (let a = x; a < x + w; a++) { if (!inside(a, b) || occ[b * W + a] || !fl(a, b)) return false; } return true; };
  const put = (id, x, y, rot = 0, extra = {}) => { const a = A(id); if (!a) return false; const sw = rot % 180 ? a.h : a.w, sh = rot % 180 ? a.w : a.h; for (let b = y; b < y + sh; b++) for (let c = x; c < x + sw; c++) occ[b * W + c] = 1; props.push({id, cx: x + sw / 2, cy: y + sh / 2, a: rot, ...extra}); return true; };
  const tryPut = (id, fl, box, tries = 30, extra) => { const a = A(id); if (!a) return false; for (let k = 0; k < tries; k++) { const rot = a.w === a.h ? pick([0, 90, 180, 270]) : pick([0, 90]); const sw = rot % 180 ? a.h : a.w, sh = rot % 180 ? a.w : a.h; const x = ri(box[0], box[2] - sw), y = ri(box[1], box[3] - sh); if (x < box[0] || y < box[1]) continue; if (free(x, y, sw, sh, fl)) return put(id, x, y, rot, extra); } return false; };
  const nDeco = {none: 0, few: 1, normal: 3, lots: 6}[o.deco] ?? 3;
  if (start) { const [sx, sy] = start; if (!occ[sy * W + sx]) { const a = A("escada-sobe"); if (a && free(sx, sy, 1, 2, (x, y) => at(x, y))) put("escada-sobe", sx, sy); else occ[sy * W + sx] = 1; } }
  if (end) { const [ex, ey] = end; if (free(ex, ey, 1, 2, (x, y) => at(x, y))) put("escada", ex, ey); else if (free(ex, ey, 1, 1, (x, y) => at(x, y))) put("alcapao", ex, ey); }
  if (o.style !== "cave") {
    const types = Object.keys(ROOMT);
    for (const r of rooms) {
      const inR = (x, y) => RID[y * W + x] === r.i, box = [r.x, r.y, r.x + r.w, r.y + r.h];
      r.type = r.end ? pick(["tesouro", "templo", "covil"]) : r.start ? pick(["vazia", "armazem"]) : pick(types);
      const RT0 = ROOMT[r.type];
      if (o.torches) { // tochas no meio das paredes
        const cand = [[r.x + (r.w >> 1), r.y, 0], [r.x + (r.w >> 1), r.y + r.h - 1, 180], [r.x, r.y + (r.h >> 1), 270], [r.x + r.w - 1, r.y + (r.h >> 1), 90]].filter(([x, y]) => !occ[y * W + x]);
        for (const [x, y, rot] of cand.slice(0, r.w * r.h > 30 ? 4 : 2)) put("tocha-parede", x, y, rot);
      }
      if (!nDeco) continue;
      for (const id of RT0.wall) { // encostados na parede de cima ou de baixo
        const a = A(id); if (!a) continue;
        for (let k = 0; k < 12; k++) { const top = R() < .5, x = ri(r.x, r.x + r.w - a.w), y = top ? r.y : r.y + r.h - a.h; if (free(x, y, a.w, a.h, inR)) { put(id, x, y, top ? 0 : 180); break; } }
      }
      if (r.type === "templo" && r.w >= 6 && r.h >= 6) for (const [x, y] of [[r.x + 1, r.y + 1], [r.x + r.w - 2, r.y + 1], [r.x + 1, r.y + r.h - 2], [r.x + r.w - 2, r.y + r.h - 2]]) if (free(x, y, 1, 1, inR)) put("coluna", x, y);
      if ((r.type === "covil" || R() < .25) && r.w >= 3 && r.h >= 3) { const cs = [[r.x, r.y, 0], [r.x + r.w - 2, r.y, 90], [r.x + r.w - 2, r.y + r.h - 2, 180], [r.x, r.y + r.h - 2, 270]]; const [x, y, rot] = pick(cs); if (free(x, y, 2, 2, inR)) put("teia", x, y, rot); }
      const n = Math.max(1, Math.round(nDeco * Math.min(2, r.w * r.h / 24)));
      for (let k = 0; k < n; k++) tryPut(pick(RT0.items), inR, box);
    }
  } else if (nDeco) {
    const n = Math.round(nDeco * W * H / 160); const fl = (x, y) => !!at(x, y);
    for (let k = 0; k < n; k++) tryPut(pick(CAVE_ITEMS), fl, [1, 1, W - 1, H - 1], 40);
    if (o.torches) for (let k = 0; k < Math.round(W * H / 180); k++) tryPut(pick(["cristais", "cogumelos-brilho", "fogueira"]), fl, [1, 1, W - 1, H - 1], 40);
  }
  // armadilhas escondidas nos corredores / túneis
  for (let k = 0, g = 0; k < (o.traps | 0) && g < 300; g++) {
    const cells = []; for (let i = 0; i < W * H; i++) if ((o.style === "cave" ? T[i] : T[i] === 2) && !occ[i]) cells.push(i); if (!cells.length) break;
    const c = pick(cells); put(pick(["espinhos", "alcapao", "espinhos", "buraco"]), c % W, (c / W) | 0, 0, {h: 1, trap: 1}); k++;
  }
  let t = ""; for (let i = 0; i < W * H; i++) t += T[i] === 3 ? 2 : T[i];
  return {w: W, h: H, t, style: o.style === "cave" ? "cave" : "dungeon", walls: wallsOut, doors: doorsOut, props, rooms, start, end};
}
// desenho do chão (determinístico a partir de scene.gen.t)
const genCache = {sig: "", cv: null};
const hash2 = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2246822519) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function renderGen(g, S, cvIn){
  if (OUT_STYLES.has(g.style)) return renderOutdoor(g, S, cvIn);
  const W = g.w, H = g.h, cvx = cvIn || document.createElement("canvas"); cvx.width = Math.ceil(W * S); cvx.height = Math.ceil(H * S);
  const x = cvx.getContext("2d"), at = (a, b) => a < 0 || b < 0 || a >= W || b >= H ? 0 : +g.t[b * W + a];
  x.fillStyle = "#14100d"; x.fillRect(0, 0, cvx.width, cvx.height);
  for (let b = 0; b < H; b++) for (let a = 0; a < W; a++) if (!at(a, b) && hash2(a, b, 7) < .25) { x.fillStyle = "rgba(60,50,40,.35)"; x.fillRect(a * S + hash2(a, b, 1) * S * .6, b * S + hash2(a, b, 2) * S * .6, S * .25, S * .2); }
  if (g.style === "cave") {
    const T = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) T[i] = +g.t[i];
    const {polys, segs} = caveContour(T, W, H);
    x.fillStyle = "#5e554a"; x.beginPath(); for (const p of polys) { p.forEach(([u, v], i) => i ? x.lineTo(u * S, v * S) : x.moveTo(u * S, v * S)); x.closePath(); } x.fill();
    x.save(); x.clip();
    for (let b = 0; b < H; b++) for (let a = 0; a < W; a++) if (at(a, b)) { const h = hash2(a, b); x.fillStyle = h < .5 ? `rgba(0,0,0,${.05 + h * .12})` : `rgba(255,240,220,${(h - .5) * .08})`; x.beginPath(); x.arc((a + hash2(a, b, 3)) * S, (b + hash2(a, b, 4)) * S, S * (.3 + hash2(a, b, 5) * .5), 0, Math.PI * 2); x.fill(); if (hash2(a, b, 9) < .12) { x.fillStyle = "#4a433a"; x.beginPath(); x.arc((a + .5) * S, (b + .5) * S, S * .12, 0, Math.PI * 2); x.fill(); } }
    x.restore();
    x.lineCap = "round"; x.lineJoin = "round";
    x.strokeStyle = "rgba(0,0,0,.45)"; x.lineWidth = S * .45; x.beginPath(); for (const s of segs) { x.moveTo(s[0] * S, s[1] * S); x.lineTo(s[2] * S, s[3] * S); } x.stroke();
    x.strokeStyle = "#2c2520"; x.lineWidth = S * .22; x.stroke(); x.strokeStyle = "#4d443a"; x.lineWidth = S * .07; x.stroke();
    return cvx;
  }
  for (let b = 0; b < H; b++) for (let a = 0; a < W; a++) {
    const v = at(a, b); if (!v) continue;
    const h = hash2(a, b), base = v === 1 ? [122, 114, 102] : [104, 97, 87], k = .9 + h * .18;
    x.fillStyle = `rgb(${base.map(c => Math.round(c * k)).join(",")})`; x.fillRect(a * S, b * S, S, S);
    // lajotas: meia casa, com rejunte
    x.strokeStyle = "rgba(30,24,20,.45)"; x.lineWidth = Math.max(1, S * .03);
    if (v === 1) { const off = (b % 2) * S * .5; x.beginPath(); x.moveTo(a * S, b * S + .5); x.lineTo(a * S + S, b * S + .5); x.moveTo(a * S + ((off + S * .5) % S), b * S); x.lineTo(a * S + ((off + S * .5) % S), b * S + S); x.stroke(); }
    else x.strokeRect(a * S + .5, b * S + .5, S - 1, S - 1);
    if (h < .1) { x.strokeStyle = "rgba(20,15,12,.6)"; x.beginPath(); x.moveTo(a * S + S * .2, b * S + S * .3); x.lineTo(a * S + S * .5, b * S + S * .55); x.lineTo(a * S + S * .7, b * S + S * .5); x.stroke(); }
    if (hash2(a, b, 11) < .08) { x.fillStyle = "rgba(60,90,40,.35)"; x.beginPath(); x.arc(a * S + S * hash2(a, b, 12), b * S + S * hash2(a, b, 13), S * .18, 0, Math.PI * 2); x.fill(); }
  }
  // sombra e paredes
  const segs = [];
  for (let b = 0; b <= H; b++) for (let a = 0; a < W; a++) if (!!at(a, b - 1) !== !!at(a, b)) segs.push([a, b, a + 1, b, at(a, b) ? 1 : -1, 0]);
  for (let a = 0; a <= W; a++) for (let b = 0; b < H; b++) if (!!at(a - 1, b) !== !!at(a, b)) segs.push([a, b, a, b + 1, 0, at(a, b) ? 1 : -1]);
  if (g.nx?.length) { const nx = new Set(g.nx); for (let i = segs.length - 1; i >= 0; i--) if (nx.has(segs[i].slice(0, 4).join(","))) segs.splice(i, 1); }
  for (const s of g.iw || []) segs.push([s[0], s[1], s[2], s[3], 0, 0]);
  x.lineCap = "square";
  x.strokeStyle = "rgba(0,0,0,.35)"; x.lineWidth = S * .3; x.beginPath(); for (const [x1, y1, x2, y2, ny, nx] of segs) { const o = S * .18; x.moveTo(x1 * S + nx * o, y1 * S + ny * o); x.lineTo(x2 * S + nx * o, y2 * S + ny * o); } x.stroke();
  x.beginPath(); for (const s of segs) { x.moveTo(s[0] * S, s[1] * S); x.lineTo(s[2] * S, s[3] * S); }
  x.strokeStyle = "#241e19"; x.lineWidth = S * .26; x.stroke(); x.strokeStyle = "#51483e"; x.lineWidth = S * .08; x.stroke();
  return cvx;
}
function genCanvas(){
  const g = scene.gen; if (!g || !g.t) return null;
  const S = Math.max(8, Math.min(48, g.s || 48, 2800 / Math.max(g.w, g.h))), sig = [g.style, g.w, g.h, S, g.seed, g.ver || 0, JSON.stringify(g.iw || []), JSON.stringify(g.nx || [])].join("|");
  if (genCache.sig !== sig || genCache.t !== g.t) { genCache.sig = sig; genCache.t = g.t; genCache.cv = renderGen(g, S); }   // compara o desenho inteiro, não só o começo
  return genCache.cv;
}
function applyGen(res, o){
  if (G().type === "hex") scene.grid = {...scene.grid, type: "square"};
  const S = G().size, gx = G().ox || 0, gy = G().oy || 0, P = (x, y) => [Math.round((gx + x * S) * 10) / 10, Math.round((gy + y * S) * 10) / 10];
  scene.walls = res.walls.map(s => ({p: [...P(s[0], s[1]), ...P(s[2], s[3])]})).concat(res.doors.map(d => ({p: [...P(d[0], d[1]), ...P(d[2], d[3])], d: 1, o: 0, ...(d[4] ? {s: 1} : {})})));
  Object.assign(scene, {bg: null, bgW: 0, bgH: 0, bgQ: 0, bgFine: 0, roll: null, gen: {v: 1, style: res.style, w: res.w, h: res.h, t: res.t, iw: res.iw || null, x0: gx, y0: gy, s: S, seed: o.seed}});
  if (o.dark) scene.light = "dark"; else if (OUT_STYLES.has(res.style)) scene.light = "day";
  const U = G().unit || 1, chars = freshDungeonTokens();
  drawings = drawings.filter(d => d.t !== "tpl"); save("drawings");
  const pr = res.props.map(p => { const a = ASSETS.find(x => x.id === p.id); if (!a) return null; const [x, y] = P(p.cx, p.cy);
    const t = {id: uid(), k: "prop", n: a.n, img: `/assets/${a.path || a.id + ".svg"}`, pw: a.w, ph: a.h, a: p.a || 0, blk: p.trap || p.noblk ? null : (a.blk || null), sn: true, x, y};
    if (p.h) t.h = true; if (a.li) t.li = {rb: a.li.b * U, rd: a.li.d * U, ang: 360, c: a.li.c}; return t; }).filter(Boolean);
  // personagens vão para a entrada
  if (res.start) {
    const T = res.t, W = res.w, busy = new Set(res.props.map(p => Math.floor(p.cx) + "," + Math.floor(p.cy))), q = [res.start], seen = new Set([res.start.join(",")]), spots = [];
    while (q.length && spots.length < chars.length) { const [a, b] = q.shift(); if (+T[b * W + a] && !busy.has(a + "," + b)) spots.push([a, b]); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = (a + dx) + "," + (b + dy); if (!seen.has(k) && a + dx >= 0 && b + dy >= 0 && a + dx < W && b + dy < res.h && +T[(b + dy) * W + a + dx]) { seen.add(k); q.push([a + dx, b + dy]); } } }
    chars.forEach((t, i) => { const s = spots[i] || res.start; [t.x, t.y] = P(s[0] + .5, s[1] + .5); t.tr = []; });
  }
  tokens = chars.concat(pr); resetExplore();
  wallsVer++; losCache.clear(); selTok = null;
  save("scene"); save("tokens"); save("fog", false);
  dirty = true; drawTop(); drawEmpty(); fit();
}
let genRes = null, genT = null;
function openGenPanel(){
  if (genOpt.style === "rolled") return openRollPanel();
  panelKind = "gen"; const o = genOpt, cave = o.style === "cave", outer = OUT_STYLES.has(o.style);
  const num = (id, label, v, min, max, unit = "") => `<label class="gnum"><span>${label}</span><input type="number" id="${id}" min="${min}" max="${max}" value="${v}">${unit ? `<small>${unit}</small>` : ""}</label>`;
  $("#panel").innerHTML = `<div class="panel gen-panel" role="dialog" aria-label="Gerador de masmorras"><h3>Gerador de cenários <button class="btn small" id="pClose">Fechar</button></h3>
    ${styleTabs(o.style)}
    <canvas id="genPrev" width="388" height="280" aria-label="Prévia do cenário"></canvas>
    ${outer ? genOptionsHTML(o, num) : `<div class="ggrid">
      ${num("gW", "Largura", o.w, 16, 160, "casas")}${num("gH", "Altura", o.h, 12, 160, "casas")}
      ${cave ? "" : num("gRooms", "Salas", o.rooms, 2, 40) + `<label class="gnum"><span>Corredor</span><select id="gCw">${[[0, "Variado (1–3)"], [1, "1 casa"], [2, "2 casas"], [3, "3 casas"]].map(([k, l]) => `<option value="${k}" ${+o.cw === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>` + num("gGap", "Espaço entre salas", o.gap ?? 5, 2, 12, "casas") + num("gMin", "Sala mín.", o.rmin, 2, 12) + num("gMax", "Sala máx.", o.rmax, 3, 20) + num("gDoors", "Portas", o.doors, 0, 100, "%") + num("gSecret", "Passagens secretas", o.secret, 0, 6) + num("gDead", "Becos sem saída", o.dead, 0, 12)}
      ${num("gTraps", "Armadilhas escondidas", o.traps, 0, 20)}
    </div>
    <label for="gDeco">Decoração</label><select id="gDeco">${[["none", "Nenhuma"], ["few", "Pouca"], ["normal", "Normal"], ["lots", "Muita"]].map(([k, l]) => `<option value="${k}" ${o.deco === k ? "selected" : ""}>${l}</option>`).join("")}</select>
    <label class="chk" style="margin-top:10px"><input type="checkbox" id="gTorch" ${o.torches ? "checked" : ""}> ${cave ? "Cristais e fogueiras que iluminam" : "Tochas nas paredes (iluminam)"}</label>
    `}
    <label class="chk"><input type="checkbox" id="gDark" ${o.dark ? "checked" : ""}> ${outer ? "É noite (escuro: só vê quem tem luz)" : "Começar no escuro (só vê quem tem luz)"}</label>
    <div class="two" style="align-items:end"><label>Semente <input type="number" id="gSeed" value="${o.seed}"></label><button class="btn" id="gNew" title="Outro cenário com as mesmas opções">🎲 Gerar outro</button></div>
    <p class="hint" id="gInfo"></p>
    <div class="acts foot"><span class="spacer"></span><button class="btn primary" id="gUse">Usar no mapa</button></div>
    <p class="hint">Troca a imagem, as paredes e os objetos do mapa atual (os personagens vão para a entrada). Ctrl+Z desfaz. Para guardar o mapa atual, salve antes em <b>Mapas</b>.${outer ? "" : " Armadilhas ficam ocultas: só você vê."}</p></div>`;
  $("#pClose").onclick = closePanel;
  const read = () => {
    const v = (id, d) => { const e = $("#" + id); return e ? (+e.value || d) : d; };
    Object.assign(genOpt, {w: v("gW", o.w), h: v("gH", o.h), rooms: v("gRooms", o.rooms), cw: $("#gCw") ? +$("#gCw").value : o.cw, gap: v("gGap", o.gap ?? 5), rmin: v("gMin", o.rmin), rmax: v("gMax", o.rmax), doors: $("#gDoors") ? +$("#gDoors").value : o.doors, secret: $("#gSecret") ? +$("#gSecret").value : o.secret, dead: $("#gDead") ? +$("#gDead").value : o.dead, traps: $("#gTraps") ? +$("#gTraps").value || 0 : o.traps, deco: $("#gDeco") ? $("#gDeco").value : o.deco, torches: $("#gTorch") ? $("#gTorch").checked : o.torches, dark: $("#gDark").checked, seed: +$("#gSeed").value || 1});
    const sv = (id, k, f = x => x) => { const e = $("#" + id); if (e) genOpt[k] = e.type === "checkbox" ? e.checked : f(e.value); };
    sv("gDens", "dens"); sv("gSeason", "season"); sv("gClear", "clear"); sv("gPond", "pond"); sv("gAnimals", "animals"); sv("gTreeBlk", "treeBlk"); sv("gHouses", "houses", Number); sv("gMarket", "market"); sv("gFields", "fields"); sv("gIkind", "ikind"); sv("gGraves", "graves"); sv("gMauso", "mauso");
    saveGenOpt(); clearTimeout(genT); genT = setTimeout(runGen, 120);
  };
  $("#panel").querySelectorAll("input,select").forEach(e => e.onchange = read);
  $("#gStyle").onclick = e => { const b = e.target.closest("[data-st]"); if (!b) return; genOpt.style = b.dataset.st; genOpt.dark = GEN_DARK[genOpt.style]; saveGenOpt(); openGenPanel(); };
  $("#gNew").onclick = () => { $("#gSeed").value = 1 + Math.floor(Math.random() * 99999); read(); };
  $("#gUse").onclick = () => { if (!genRes) return; if ((scene.bg || walls().length || tokens.some(isProp)) && !confirm("Trocar o mapa atual por este cenário? (Ctrl+Z desfaz)")) return; applyGen(genRes, genOpt); closePanel(); toast("Cenário pronto!"); };
  runGen();
}
function runGen(){
  const c = $("#genPrev"); if (!c) return;
  if (!ASSETS.length) { $("#gInfo").textContent = "Carregando os assets…"; setTimeout(runGen, 400); return; }
  genRes = genMap({...genOpt});
  const S = Math.min(c.width / genRes.w, c.height / genRes.h), x = c.getContext("2d");
  const g = {w: genRes.w, h: genRes.h, t: genRes.t, style: genRes.style, iw: genRes.iw}, img = renderGen(g, Math.max(4, S * 2));
  x.fillStyle = "#0d0b09"; x.fillRect(0, 0, c.width, c.height);
  const ox = (c.width - genRes.w * S) / 2, oy = (c.height - genRes.h * S) / 2;
  x.drawImage(img, ox, oy, genRes.w * S, genRes.h * S);
  let waiting = 0;
  for (const p of genRes.props) {
    const a = ASSETS.find(q => q.id === p.id); if (!a) continue; const im = getImg(`/assets/${a.path}`);
    if (!im) { waiting++; continue; }
    x.save(); x.translate(ox + p.cx * S, oy + p.cy * S); x.rotate(p.a * Math.PI / 180); if (p.h) x.globalAlpha = .55; x.drawImage(im, -a.w * S / 2, -a.h * S / 2, a.w * S, a.h * S); x.restore();
  }
  x.lineWidth = 2; for (const d of genRes.doors) { x.strokeStyle = d[4] ? "#c07ae8" : "#d8a050"; x.beginPath(); x.moveTo(ox + d[0] * S, oy + d[1] * S); x.lineTo(ox + d[2] * S, oy + d[3] * S); x.stroke(); }
  if (waiting) setTimeout(() => { if ($("#genPrev")) runGen(); }, 350);
  const nD = genRes.doors.filter(d => !d[4]).length, nS = genRes.doors.length - nD;
  const SN = {forest: "Floresta", village: genRes.w * genRes.h > 2600 ? "Cidade" : "Vila", interior: "Construção", cemetery: "Cemitério"};
  $("#gInfo").innerHTML = SN[genRes.style] ? `${SN[genRes.style]} ${genRes.w}×${genRes.h} · ${genRes.props.length} objetos${genRes.rooms.length ? ` · ${genRes.rooms.length} cômodo${genRes.rooms.length > 1 ? "s" : ""}` : ""}` : genRes.style === "cave" ? `Caverna ${genRes.w}×${genRes.h} · ${genRes.props.length} objetos` : `${genRes.rooms.length} salas · ${nD} portas${nS ? ` · ${nS} secreta${nS > 1 ? "s" : ""} <span style="color:#c07ae8">(roxas)</span>` : ""} · ${genRes.props.length} objetos`;
}

// ---------- outros cenários: floresta, vila, casa/taverna, cemitério ----------
// códigos do chão: 3 grama · 4 terra · 5 água · 6 madeira · 7 pedra (calçamento) · 8 mata fechada · 9 terra de plantio
const OUT_STYLES = new Set(["forest", "village", "interior", "cemetery"]);
const GEN_STYLES = [["dungeon", "🏰 Masmorra"], ["cave", "⛰ Caverna"], ["forest", "🌲 Floresta"], ["village", "🏘 Vila"], ["interior", "🏠 Casa / Taverna"], ["cemetery", "⚰️ Cemitério"], ["rolled", "🎲 Rolada"]];
const GEN_DARK = {dungeon: true, cave: true, cemetery: true, rolled: true, forest: false, village: false, interior: false};
const styleTabs = cur => `<div class="seg gstyles" id="gStyle">${GEN_STYLES.map(([k, l]) => `<button data-st="${k}" aria-pressed="${cur === k}">${l}</button>`).join("")}</div>`;
function genScenery(o){
  const R = rng(o.seed), ri = (a, b) => a + Math.floor(R() * (b - a + 1)), pick = a => a[Math.floor(R() * a.length)];
  const st = o.style;
  let W = Math.max(20, Math.min(160, o.w | 0)), H = Math.max(16, Math.min(160, o.h | 0));
  const IK = {taverna: [18, 13], casa: [11, 8], mansao: [24, 17], loja: [12, 9]};
  if (st === "interior") { const [bw, bh] = IK[o.ikind] || IK.taverna; W = bw + 8; H = bh + 9; }
  const T = new Uint8Array(W * H).fill(st === "cemetery" ? 8 : 3), occ = new Uint8Array(W * H), props = [], walls = [], doors = [], rooms = [];
  const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H, at = (x, y) => inb(x, y) ? T[y * W + x] : 0, set = (x, y, v) => { if (inb(x, y)) T[y * W + x] = v; };
  const A = id => ASSETS.find(a => a.id === id);
  const fits = (x, y, w, h, ok) => { for (let b = y; b < y + h; b++) for (let a = x; a < x + w; a++) { if (!inb(a, b) || occ[b * W + a] || (ok && !ok(a, b))) return false; } return true; };
  const put = (id, x, y, rot = 0, extra = {}) => { const a = A(id); if (!a) return false; const sw = rot % 180 ? a.h : a.w, sh = rot % 180 ? a.w : a.h; for (let b = y; b < y + sh; b++) for (let c = x; c < x + sw; c++) if (inb(c, b)) occ[b * W + c] = 1; props.push({id, cx: x + sw / 2, cy: y + sh / 2, a: rot, ...extra}); return true; };
  const tryPut = (id, ok, box = [0, 0, W, H], tries = 40, rots, extra) => { const a = A(id); if (!a) return false; for (let k = 0; k < tries; k++) { const rot = rots ? pick(rots) : a.w === a.h ? pick([0, 90, 180, 270]) : pick([0, 90, 180, 270]); const sw = rot % 180 ? a.h : a.w, sh = rot % 180 ? a.w : a.h, x = ri(box[0], box[2] - sw), y = ri(box[1], box[3] - sh); if (x < box[0] || y < box[1]) continue; if (fits(x, y, sw, sh, ok)) return put(id, x, y, rot, extra); } return false; };
  const noise = (sc, seed) => { const gw = Math.ceil(W / sc) + 2, gh = Math.ceil(H / sc) + 2, G2 = []; const r2 = rng(o.seed + seed); for (let i = 0; i < gw * gh; i++) G2.push(r2()); return (x, y) => { const fx = x / sc, fy = y / sc, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0, g = (a, b) => G2[b * gw + a], s = t => t * t * (3 - 2 * t); const a = g(x0, y0) + (g(x0 + 1, y0) - g(x0, y0)) * s(tx), b = g(x0, y0 + 1) + (g(x0 + 1, y0 + 1) - g(x0, y0 + 1)) * s(tx); return a + (b - a) * s(ty); }; };
  const nearT = (x, y, v, r) => { for (let b = -r; b <= r; b++) for (let a = -r; a <= r; a++) if (at(x + a, y + b) === v) return true; return false; };
  const path = (x0, y0, dx, dy, wid, v, wig = 1.2) => { // caminho que serpenteia até a borda
    let x = x0, y = y0, drift = 0; const out = [];
    for (let k = 0; k < 400 && inb(x, y); k++) {
      for (let j = 0; j < wid; j++) set(x + (dy ? j : 0), y + (dx ? j : 0), v); out.push([x, y]);
      x += dx; y += dy; drift += (R() - .5) * wig; drift *= .85;
      if (Math.abs(drift) > .7) { const s = Math.sign(drift); if (dx) y += s; else x += s; drift = 0; for (let j = 0; j < wid; j++) set(x + (dy ? j : 0), y + (dx ? j : 0), v); }
    }
    return out;
  };
  const blob = (cx, cy, r, v) => { const n = noise(3, 77 + cx); for (let y = cy - r - 2; y <= cy + r + 2; y++) for (let x = cx - r - 2; x <= cx + r + 2; x++) if (Math.hypot(x - cx, y - cy) <= r * (.75 + n(x, y) * .5)) set(x, y, v); };
  const grass = (x, y) => at(x, y) === 3 || at(x, y) === 8;
  const U = G().unit || 1;
  let start = [1, H >> 1];
  // ---- paredes de uma construção com cômodos (casa, taverna, mausoléu) ----
  const building = (bx, by, bw, bh, kind, frontDoor = true) => {
    for (let y = by; y < by + bh; y++) for (let x = bx; x < bx + bw; x++) set(x, y, 6);
    const rs = [{x: bx, y: by, w: bw, h: bh}], parts = [], minR = kind === "mausoleu" ? 99 : kind === "casa" || kind === "loja" ? 4 : 5;
    for (let guard = 0; guard < 20; guard++) {
      rs.sort((a, b) => b.w * b.h - a.w * a.h); const r = rs[0];
      if (rs.length >= ({taverna: 6, casa: 4, mansao: 9, loja: 3, mausoleu: 1}[kind] || 4) || Math.max(r.w, r.h) < minR * 2) break;
      rs.shift(); const vert = r.w > r.h ? true : r.h > r.w ? false : R() < .5;
      const big = kind === "taverna" && parts.length === 0 ? .62 : .4 + R() * .2;
      if (vert) { const cx = r.x + Math.max(minR, Math.min(r.w - minR, Math.round(r.w * big))); rs.push({x: r.x, y: r.y, w: cx - r.x, h: r.h}, {x: cx, y: r.y, w: r.x + r.w - cx, h: r.h}); parts.push({v: 1, at: cx, a: r.y, b: r.y + r.h}); }
      else { const cy = r.y + Math.max(minR, Math.min(r.h - minR, Math.round(r.h * big))); rs.push({x: r.x, y: r.y, w: r.w, h: cy - r.y}, {x: r.x, y: cy, w: r.w, h: r.y + r.h - cy}); parts.push({v: 0, at: cy, a: r.x, b: r.x + r.w}); }
    }
    // paredes internas com uma porta cada
    for (const p of parts) { const dpos = ri(p.a + 1, p.b - 2); for (let k = p.a; k < p.b; k++) { const s = p.v ? [p.at, k, p.at, k + 1] : [k, p.at, k + 1, p.at]; if (k === dpos) doors.push([...s, 0]); else walls.push(s); } }
    // perímetro com porta da frente (embaixo)
    const fx = ri(bx + 2, bx + bw - 3);
    for (let x = bx; x < bx + bw; x++) { walls.push([x, by, x + 1, by]); if (frontDoor && x === fx) doors.push([x, by + bh, x + 1, by + bh, 0]); else walls.push([x, by + bh, x + 1, by + bh]); }
    for (let y = by; y < by + bh; y++) { walls.push([bx, y, bx, y + 1]); walls.push([bx + bw, y, bx + bw, y + 1]); }
    // nada encosta nas portas
    for (const d of doors) { const hz = d[1] === d[3]; for (const [x, y] of hz ? [[d[0], d[1] - 1], [d[0], d[1]]] : [[d[0] - 1, d[1]], [d[0], d[1]]]) if (inb(x, y)) occ[y * W + x] = 1; }
    rs.sort((a, b) => b.w * b.h - a.w * a.h);
    return {rs, front: [fx, by + bh]};
  };
  const furnish = (r, type, deco) => { // mobília por tipo de cômodo
    const inR = (x, y) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h, box = [r.x, r.y, r.x + r.w, r.y + r.h];
    const wallPut = id => { const a = A(id); if (!a) return; for (let k = 0; k < 30; k++) { const side = ri(0, 3), rot = [0, 90, 180, 270][side], sw = rot % 180 ? a.h : a.w, sh = rot % 180 ? a.w : a.h;
      const x = side === 0 || side === 2 ? ri(r.x, r.x + r.w - sw) : side === 1 ? r.x + r.w - sw : r.x, y = side === 1 || side === 3 ? ri(r.y, r.y + r.h - sh) : side === 0 ? r.y : r.y + r.h - sh;
      if (fits(x, y, sw, sh, inR)) { put(id, x, y, rot); return; } } };
    const L = {
      salao: {wall: ["balcao", "lareira", "barris-pilha", "prateleira"], mid: ["mesa-redonda", "mesa-redonda", "mesa-redonda", "mesa", "banquinho", "banquinho", "banquinho", "banquinho", "banco"]},
      sala: {wall: ["lareira", "estante", "armario"], mid: ["mesa", "cadeira", "cadeira", "tapete-redondo", "banquinho"]},
      jantar: {wall: ["armario", "lareira"], mid: ["mesa", "cadeira", "cadeira", "cadeira", "cadeira", "candelabro"]},
      cozinha: {wall: ["prateleira", "lareira", "bancada"], mid: ["caldeirao", "mesa", "barril", "sacos", "balde", "lenha"]},
      quarto: {wall: [pick(["cama", "cama-casal", "beliche"]), "armario", "bau"], mid: ["tapete-redondo", "banquinho", "velas"]},
      deposito: {wall: ["prateleira", "barris-pilha"], mid: ["caixas", "caixa", "barril", "sacos", "saco", "pilha-caixotes", "feno"]},
      biblioteca: {wall: ["estante", "estante", "estante"], mid: ["escrivaninha", "cadeira", "livros", "pergaminho", "candelabro"]},
      escritorio: {wall: ["estante", "bau"], mid: ["escrivaninha", "cadeira", "mapa-mesa", "tapete"]},
      capela: {wall: ["altar", "estatua"], mid: ["banco", "banco", "velas", "candelabro"]},
      loja: {wall: ["balcao", "prateleira", "prateleira", "armas"], mid: ["barril", "caixas", "sacos", "escudo"]},
      mausoleu: {wall: ["estatua"], mid: ["sarcofago", "velas", "velas", "ossos"]},
    }[type] || {wall: [], mid: []};
    for (const id of L.wall) wallPut(id);
    const n = Math.round(L.mid.length * ({none: 0, few: .45, normal: .8, lots: 1.3}[deco] ?? .8));
    for (let i = 0; i < n; i++) tryPut(L.mid[i % L.mid.length], inR, box, 40);
    if (o.torches && type !== "salao" && type !== "capela" && r.w * r.h > 12) tryPut("candelabro", inR, box, 30);
  };
  if (st === "forest") {
    const nz = noise(6, 3); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (nz(x, y) > .55) set(x, y, 8);
    const y0 = ri(Math.round(H * .3), Math.round(H * .7)), main = path(0, y0, 1, 0, 2, 4, 1.4); start = [0, y0];
    if (R() < .7) { const [bx] = main[ri(Math.round(main.length * .3), Math.round(main.length * .7))]; path(bx, main.find(p => p[0] === bx)[1], 0, R() < .5 ? -1 : 1, 2, 4, 1.4); }
    if (o.pond) { for (let k = 0; k < 40; k++) { const cx = ri(6, W - 7), cy = ri(5, H - 6); if (!nearT(cx, cy, 4, 6)) { blob(cx, cy, ri(3, 5), 5); break; } } }
    // clareira
    let clr = null;
    if (o.clear !== "none") for (let k = 0; k < 60; k++) { const cx = ri(7, W - 8), cy = ri(6, H - 7); if (!nearT(cx, cy, 5, 5) && nearT(cx, cy, 4, 8) && !nearT(cx, cy, 4, 2)) { clr = [cx, cy]; for (let y = cy - 4; y <= cy + 4; y++) for (let x = cx - 4; x <= cx + 4; x++) if (Math.hypot(x - cx, y - cy) <= 4.3 && at(x, y) !== 4) set(x, y, 3); break; } }
    if (clr) {
      const [cx, cy] = clr, near = (x, y) => Math.hypot(x - cx, y - cy) <= 4.3, box = [cx - 4, cy - 4, cx + 5, cy + 5];
      if (o.clear === "camp") { put("fogueira", cx, cy); tryPut("tenda", near, box); tryPut("tenda-azul", near, box); tryPut("saco-dormir", near, box); tryPut("saco-dormir", near, box); tryPut("lenha", near, box); tryPut("mochila", near, box); tryPut("panela-fogo", near, box); }
      else { tryPut("ruina", near, box, 60); tryPut("pilar-quebrado", near, box); tryPut("pilar-quebrado", near, box); tryPut("estatua", near, box); tryPut("escombros", near, box); tryPut("circulo-ritual", near, box, 20); }
      for (let y = cy - 5; y <= cy + 5; y++) for (let x = cx - 5; x <= cx + 5; x++) if (inb(x, y) && Math.hypot(x - cx, y - cy) <= 5) occ[y * W + x] = 1;
    }
    // bloqueia a água e o caminho para árvores
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (at(x, y) === 5 || at(x, y) === 4) occ[y * W + x] = 1;
    const trees = {verao: ["arvore", "arvore", "arvore", "pinheiro", "pinheiro", "arvore-grande", "arvore-frutas"], outono: ["arvore-outono", "arvore-outono", "arvore-outono", "pinheiro", "arvore", "arvore-grande"], sombria: ["arvore-sombria", "arvore-sombria", "arvore-morta", "pinheiro", "arvore-morta"]}[o.season] || ["arvore", "pinheiro"];
    const dens = {few: .035, normal: .06, dense: .095}[o.dens] ?? .06;
    const cells = []; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) cells.push([x, y]);
    for (const [x, y] of cells.sort(() => R() - .5)) {
      const dk = at(x, y) === 8 ? 1.7 : 1;
      if (R() < dens * dk) { const id = pick(trees), a = A(id); if (a && fits(x, y, a.w, a.h, (p, q) => !nearT(p, q, 4, 0))) put(id, x, y, pick([0, 90, 180, 270]), o.treeBlk ? {} : {noblk: 1}); }
      else if (R() < .05) { const id = pick(["arbusto", "moita", "moita", "flores", "pedra", "toco", "cogumelos", "galhos", "pedra-musgo", "rochas", "tronco"]), a = A(id); if (a && fits(x, y, a.w, a.h)) put(id, x, y, pick([0, 90, 180, 270])); }
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (at(x, y) === 5 && R() < .06 && !occ[y * W + x]) put("nenufares", x, y, 0);
    if (o.animals) for (const id of ["cervo", "corvo", "coruja", pick(["lobo", "javali", "urso", "cervo"])]) tryPut(id, grass, [0, 0, W, H], 60);
  }
  else if (st === "village") {
    const big = W * H > 2600, road = big ? 7 : 4, cy = ri(Math.round(H * .4), Math.round(H * .6));
    path(0, cy - 1, 1, 0, 3, road, .3); start = [0, cy];
    const cx = ri(Math.round(W * .35), Math.round(W * .65)); path(cx, 0, 0, 1, 2, road, .5);
    if (big) path(ri(Math.round(W * .7), W - 8), cy, 0, R() < .5 ? -1 : 1, 2, road, .5);
    // praça
    for (let y = cy - 5; y <= cy + 5; y++) for (let x = cx - 5; x <= cx + 6; x++) set(x, y, 7);
    put(big ? "fonte" : "poco", big ? cx - 1 : cx, big ? cy - 1 : cy);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (at(x, y) === 4 || at(x, y) === 7) occ[y * W + x] = 1;
    const plaza = (x, y) => x >= cx - 5 && x <= cx + 6 && y >= cy - 5 && y <= cy + 5;
    for (let y = cy - 5; y <= cy + 5; y++) for (let x = cx - 5; x <= cx + 6; x++) if (inb(x, y) && !(Math.abs(x - cx) < 2 && Math.abs(y - cy) < 2)) occ[y * W + x] = 0;
    if (o.market) for (let i = 0; i < 4; i++) tryPut(pick(["barraca", "barraca-azul"]), plaza, [cx - 5, cy - 5, cx + 7, cy + 6], 30, [0]);
    tryPut("carrinho-mao", plaza, [cx - 5, cy - 5, cx + 7, cy + 6]); tryPut("barris-pilha", plaza, [cx - 5, cy - 5, cx + 7, cy + 6]); tryPut("banco-praca", plaza, [cx - 5, cy - 5, cx + 7, cy + 6], 30, [0, 90]);
    for (let y = cy - 5; y <= cy + 5; y++) for (let x = cx - 5; x <= cx + 6; x++) if (inb(x, y)) occ[y * W + x] = 1;
    // casas ao longo das ruas (1 casa de distância da rua)
    const houseIds = ["casa", "casa", "casa-palha", "casa-palha", "casa-madeira", "casa-grande"], special = ["igreja", "estabulo", "moinho"];
    let placed = 0; const wantHouses = o.houses | 0;
    const roadNear = (x, y, w, h) => { for (let b = y - 2; b < y + h + 2; b++) for (let a = x - 2; a < x + w + 2; a++) if (at(a, b) === road || at(a, b) === 7) return true; return false; };
    const roadTouch = (x, y, w, h) => { for (let b = y - 1; b < y + h + 1; b++) for (let a = x - 1; a < x + w + 1; a++) if (at(a, b) === road || at(a, b) === 7) return true; return false; };
    for (const id of special.concat(Array(60).fill(0).map(() => pick(houseIds)))) {
      if (placed >= wantHouses + special.length) break;
      const a = A(id); if (!a) continue;
      for (let k = 0; k < 80; k++) { const rot = pick([0, 90]), sw = rot ? a.h : a.w, sh = rot ? a.w : a.h, x = ri(1, W - sw - 1), y = ri(1, H - sh - 1);
        if (fits(x - 1, y - 1, sw + 2, sh + 2) && roadNear(x, y, sw, sh) && !roadTouch(x, y, sw, sh)) { put(id, x, y, rot); placed++;
          // quintal
          const yard = [x - 2, y - 2, x + sw + 2, y + sh + 2];
          if (id === "estabulo") { tryPut("cavalo", grass, yard, 30); tryPut("cavalo-selado", grass, yard, 30); tryPut("feno", grass, yard); tryPut("cocho", grass, yard); }
          else if (R() < .7) tryPut(pick(["barril", "caixa", "vasos-flor", "feno", "lenha", "carroca", "cerca", "sacos", "arvore-frutas"]), grass, yard, 20);
          break; } }
    }
    const fr = [cx + 7, cy - 1, cx + 12, cy + 4]; tryPut("forja", grass, fr, 30); tryPut("bigorna", grass, fr);
    if (o.fields) for (let f = 0; f < (big ? 3 : 2); f++) { for (let k = 0; k < 60; k++) { const fw = ri(3, 4) * 2, fh = ri(2, 3) * 2, x = ri(1, W - fw - 1), y = ri(1, H - fh - 1);
      if (fits(x - 1, y - 1, fw + 2, fh + 2, (p, q) => at(p, q) === 3)) { for (let b = y; b < y + fh; b++) for (let a = x; a < x + fw; a++) set(a, b, 9); const crop = pick(["plantacao", "trigo"]); for (let b = y; b < y + fh; b += 2) for (let a = x; a < x + fw; a += 2) put(crop, a, b); for (let a = x; a < x + fw; a += 2) { if (fits(a, y - 1, 2, 1)) put("cerca", a, y - 1); if (fits(a, y + fh, 2, 1)) put("cerca", a, y + fh); } break; } } }
    for (const id of ["vaca", "porco", "galinha", "galinha", "ovelha", "cachorro", "gato"]) if (R() < .7) tryPut(id, grass, [0, 0, W, H], 40);
    for (let i = 0; i < W * H / 90; i++) tryPut(pick(["arvore", "arvore", "pinheiro", "arbusto", "arvore-frutas", "flores", "pedra"]), grass, [0, 0, W, H], 10, undefined, {noblk: 1});
    tryPut("poste", (x, y) => at(x, y) === 3, [cx - 7, cy - 7, cx + 9, cy + 8], 40);
  }
  else if (st === "interior") {
    const [bw, bh] = IK[o.ikind] || IK.taverna, bx = 4, by = 3, kind = o.ikind || "taverna";
    const B = building(bx, by, bw, bh, kind);
    const types = {taverna: ["salao", "cozinha", "deposito", "quarto", "quarto", "quarto"], casa: ["sala", "cozinha", "quarto", "quarto"], mansao: ["sala", "jantar", "biblioteca", "cozinha", "quarto", "quarto", "escritorio", "capela", "deposito"], loja: ["loja", "deposito", "quarto"]}[kind] || ["sala"];
    B.rs.forEach((r, i) => { const ty = types[Math.min(i, types.length - 1)]; rooms.push({...r, type: ty}); furnish(r, ty, o.deco); });
    // caminho da porta até a borda de baixo
    const [fx, fy] = B.front; for (let y = fy; y < H; y++) { set(fx, y, 4); set(fx + 1, y, 4); } start = [fx, H - 2];
    const out = (x, y) => at(x, y) === 3; for (let i = 0; i < (W * H) / 45; i++) tryPut(pick(["arvore", "arbusto", "flores", "barril", "pedra", "moita"]), out, [0, 0, W, H], 10, undefined, {noblk: 1});
    tryPut("poste", (x, y) => out(x, y) && Math.abs(x - fx) < 3, [fx - 3, fy, fx + 4, fy + 3], 30); if (kind === "taverna") { tryPut("cocho", out, [0, fy, W, H]); tryPut("carroca", out, [0, fy, W, H]); tryPut("cavalo", out, [0, fy, W, H]); }
  }
  else if (st === "cemetery") {
    const cx = W >> 1, cy = H >> 1;
    for (let x = 1; x < W - 1; x++) { set(x, cy, 4); set(x, cy + 1, 4); } for (let y = 1; y < H - 1; y++) { set(cx, y, 4); set(cx + 1, y, 4); } start = [cx, H - 2];
    for (let y = cy + 1; y < H; y++) { set(cx, y, 4); set(cx + 1, y, 4); }
    // cerca em volta com portão embaixo
    for (let x = 0; x < W - 1; x += 2) { if (fits(x, 0, 2, 1)) put("muro-madeira", x, 0); if (!(x >= cx - 1 && x <= cx + 1) && fits(x, H - 1, 2, 1)) put("muro-madeira", x, H - 1, 180); }
    for (let y = 1; y < H - 2; y += 2) { if (fits(0, y, 1, 2)) put("muro-madeira", 0, y, 270); if (fits(W - 1, y, 1, 2)) put("muro-madeira", W - 1, y, 90); }
    tryPut("poste", () => true, [cx - 3, H - 3, cx - 1, H - 1], 10); tryPut("poste", () => true, [cx + 2, H - 3, cx + 4, H - 1], 10);
    if (o.mauso) { const q = [[3, 3], [W - 11, 3], [3, H - 10], [W - 11, H - 10]][ri(0, 3)], B = building(q[0], q[1], 7, 5, "mausoleu"); rooms.push({...B.rs[0], type: "mausoleu"}); furnish(B.rs[0], "mausoleu", "normal"); }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (at(x, y) === 4 || at(x, y) === 6) occ[y * W + x] = 1;
    const gap = {few: 4, normal: 3, lots: 2}[o.graves] ?? 3;
    for (let y = 3; y < H - 3; y += gap) for (let x = 3 + (y % 2); x < W - 3; x += 3) if (R() < .7 && fits(x, y, 1, 1, grass)) { const r0 = R(); put(r0 < .05 ? "buraco" : r0 < .065 ? "caixao" : "lapide", x, y, 0); if (R() < .08) tryPut(pick(["velas", "flores", "ossos", "sangue"]), grass, [x - 1, y, x + 2, y + 2], 6); }
    for (let i = 0; i < W * H / 110; i++) tryPut(pick(["arvore-morta", "arvore-sombria", "arvore-morta"]), grass, [1, 1, W - 1, H - 1], 20, undefined, {noblk: 1});
    for (const id of ["corvo", "corvo", "coruja", "gato"]) tryPut(id, grass, [1, 1, W - 1, H - 1], 30);
    if (o.torches) for (let i = 0; i < 4; i++) tryPut("lanterna", grass, [1, 1, W - 1, H - 1], 30);
  }
  let t = ""; for (let i = 0; i < W * H; i++) t += T[i];
  const dmerge = doors.map(d => d); // portas já são segmentos de 1 casa
  return {w: W, h: H, t, style: st, walls: mergeSegs(walls), iw: walls, doors: dmerge, props, rooms, start, end: null};
}
function renderOutdoor(g, S, cvIn){
  const W = g.w, H = g.h, cvx = cvIn || document.createElement("canvas"); cvx.width = Math.ceil(W * S); cvx.height = Math.ceil(H * S);
  const x = cvx.getContext("2d"), at = (a, b) => a < 0 || b < 0 || a >= W || b >= H ? -1 : +g.t[b * W + a];
  const COL = {3: [86, 116, 58], 8: [58, 84, 44], 4: [128, 102, 70], 5: [48, 104, 134], 6: [138, 104, 66], 7: [122, 117, 106], 9: [104, 78, 48]};
  const base = COL[g.style === "cemetery" ? 8 : 3]; x.fillStyle = `rgb(${base})`; x.fillRect(0, 0, cvx.width, cvx.height);
  for (const layer of [3, 8, 9, 4, 7, 5, 6]) for (let b = 0; b < H; b++) for (let a = 0; a < W; a++) {
    if (at(a, b) !== layer) continue; const h = hash2(a, b), k = .9 + h * .16, c = COL[layer].map(v => Math.round(v * k)).join(",");
    x.fillStyle = `rgb(${c})`;
    if (layer === 6) { x.fillRect(a * S, b * S, S, S); continue; }
    x.beginPath(); x.arc((a + .5) * S, (b + .5) * S, S * (layer === 3 || layer === 8 ? .85 : .74), 0, Math.PI * 2); x.fill(); x.fillRect(a * S + S * .12, b * S + S * .12, S * .76, S * .76);
  }
  // detalhes
  for (let b = 0; b < H; b++) for (let a = 0; a < W; a++) {
    const v = at(a, b), h = hash2(a, b, 5), px = a * S, py = b * S;
    if (v === 3 || v === 8) { x.strokeStyle = v === 3 ? "rgba(140,180,90,.45)" : "rgba(100,130,70,.4)"; x.lineWidth = Math.max(1, S * .04); x.beginPath(); for (let i = 0; i < 3; i++) { const u = hash2(a, b, 20 + i), w2 = hash2(a, b, 30 + i); x.moveTo(px + u * S, py + w2 * S); x.lineTo(px + u * S + S * .05, py + w2 * S - S * .14); } x.stroke(); if (v === 8 && h < .3) { x.fillStyle = "rgba(120,90,40,.35)"; x.beginPath(); x.arc(px + hash2(a, b, 8) * S, py + hash2(a, b, 9) * S, S * .08, 0, 7); x.fill(); } }
    else if (v === 4) { if (h < .4) { x.fillStyle = "rgba(80,60,40,.35)"; x.beginPath(); x.arc(px + hash2(a, b, 8) * S, py + hash2(a, b, 9) * S, S * .06, 0, 7); x.fill(); } }
    else if (v === 5) { x.strokeStyle = "rgba(170,215,235,.35)"; x.lineWidth = Math.max(1, S * .04); if (h < .35) { x.beginPath(); x.arc(px + S * .5, py + S * .6, S * .25, Math.PI * 1.15, Math.PI * 1.85); x.stroke(); } }
    else if (v === 6) { x.strokeStyle = "rgba(60,40,20,.45)"; x.lineWidth = Math.max(1, S * .03); x.beginPath(); for (const f of [.33, .66]) { x.moveTo(px, py + S * f); x.lineTo(px + S, py + S * f); } const off = (b % 2) * .5; x.moveTo(px + S * off, py); x.lineTo(px + S * off, py + S * .33); x.stroke(); }
    else if (v === 7) { x.strokeStyle = "rgba(60,56,50,.5)"; x.lineWidth = Math.max(1, S * .035); for (const [u, w2, r] of [[.28, .28, .2], [.72, .3, .18], [.3, .72, .18], [.72, .72, .2]]) { x.beginPath(); x.arc(px + u * S, py + w2 * S, r * S, 0, 7); x.stroke(); } }
    else if (v === 9) { x.strokeStyle = "rgba(60,40,20,.5)"; x.lineWidth = Math.max(1, S * .05); x.beginPath(); for (const f of [.25, .75]) { x.moveTo(px, py + S * f); x.lineTo(px + S, py + S * f); } x.stroke(); }
  }
  // margem da água
  x.strokeStyle = "rgba(30,50,40,.5)"; x.lineWidth = Math.max(1, S * .06);
  for (let b = 0; b < H; b++) for (let a = 0; a < W; a++) if (at(a, b) === 5) for (const [dx, dy, s] of [[0, -1, [a, b, a + 1, b]], [0, 1, [a, b + 1, a + 1, b + 1]], [-1, 0, [a, b, a, b + 1]], [1, 0, [a + 1, b, a + 1, b + 1]]]) if (at(a + dx, b + dy) !== 5 && at(a + dx, b + dy) !== -1) { x.beginPath(); x.moveTo(s[0] * S, s[1] * S); x.lineTo(s[2] * S, s[3] * S); x.stroke(); }
  // paredes das construções
  const segs = g.iw || [];
  if (segs.length) {
    x.lineCap = "square";
    x.beginPath(); for (const s of segs) { x.moveTo(s[0] * S, s[1] * S); x.lineTo(s[2] * S, s[3] * S); }
    x.strokeStyle = "rgba(0,0,0,.35)"; x.lineWidth = S * .42; x.stroke();
    x.strokeStyle = "#3a2c20"; x.lineWidth = S * .28; x.stroke(); x.strokeStyle = "#7a6048"; x.lineWidth = S * .09; x.stroke();
  }
  return cvx;
}
function genOptionsHTML(o, num){ // opções do painel para cada tipo de cenário
  const sel = (id, label, opts, v) => `<label class="gnum"><span>${label}</span><select id="${id}">${opts.map(([k, l]) => `<option value="${k}" ${String(v) === String(k) ? "selected" : ""}>${l}</option>`).join("")}</select></label>`;
  const chk = (id, label, v) => `<label class="chk"><input type="checkbox" id="${id}" ${v ? "checked" : ""}> ${label}</label>`;
  const size = num("gW", "Largura", o.w, 20, 160, "casas") + num("gH", "Altura", o.h, 16, 160, "casas");
  const deco = sel("gDeco", "Decoração", [["none", "Nenhuma"], ["few", "Pouca"], ["normal", "Normal"], ["lots", "Muita"]], o.deco);
  switch (o.style) {
    case "forest": return `<div class="ggrid">${size}${sel("gDens", "Árvores", [["few", "Poucas"], ["normal", "Normal"], ["dense", "Mata fechada"]], o.dens)}${sel("gSeason", "Estação", [["verao", "Verão"], ["outono", "Outono"], ["sombria", "Sombria"]], o.season)}${sel("gClear", "Clareira", [["none", "Nenhuma"], ["camp", "Acampamento"], ["ruins", "Ruínas"]], o.clear)}</div>
      ${chk("gPond", "Lago", o.pond)}${chk("gAnimals", "Animais", o.animals)}${chk("gTreeBlk", "Árvores tapam a visão (mais pesado)", o.treeBlk)}`;
    case "village": return `<div class="ggrid">${size}${num("gHouses", "Casas", o.houses, 2, 40)}</div>${chk("gMarket", "Feira na praça", o.market)}${chk("gFields", "Plantações", o.fields)}<p class="hint">Mapas grandes (mais de ~2600 casas) viram cidade, com ruas de pedra e fonte.</p>`;
    case "interior": return `<div class="ggrid">${sel("gIkind", "Tipo", [["taverna", "Taverna"], ["casa", "Casa"], ["loja", "Loja / ferreiro"], ["mansao", "Mansão"]], o.ikind)}${deco}</div>${chk("gTorch", "Candelabros e lareiras (iluminam)", o.torches)}`;
    case "cemetery": return `<div class="ggrid">${size}${sel("gGraves", "Túmulos", [["few", "Poucos"], ["normal", "Normal"], ["lots", "Muitos"]], o.graves)}</div>${chk("gMauso", "Mausoléu (com porta e sarcófago)", o.mauso)}${chk("gTorch", "Lanternas (iluminam)", o.torches)}`;
  }
  return null;
}

// ---------- masmorra rolada: vai sendo criada enquanto os jogadores exploram ----------
const RT_CONTENT = [[3, "corredor", "Corredor"], [7, "vazia", "Sala vazia"], [10, "obst", "Sala com obstáculo"], [13, "armad", "Armadilha"], [16, "inim", "Inimigos"], [18, "npc", "NPC"], [19, "tesouro", "Tesouro"], [20, "evento", "Evento especial"]];
const RT_SHAPES = ["Pequena quadrada", "Grande quadrada", "Retangular", "Circular", "Octogonal", "Longa e estreita", "Sala em L", "Sala com pilares", "Sala com desnível", "Sala dividida em duas partes", "Sala irregular", "Câmara enorme"];
const RT_ENC = [[4, "1–2 inimigos fracos"], [8, "Grupo de inimigos"], [11, "Inimigos + armadilha"], [14, "Monstro forte"], [16, "Grupo + líder"], [18, "Monstro especial"], [19, "Mini-chefe"], [20, "Encontro mortal / chefe"]];
const RT_TRE = [[5, "Nada"], [10, "Moedas"], [14, "Poção / consumível"], [17, "Item mágico comum"], [19, "Item mágico incomum"], [20, "Item especial + moedas"]];
const RT_TRAPS = ["Placa de pressão que dispara dardos", "Fosso escondido sob lajotas soltas", "Lâmina pendular no teto", "Gás venenoso ao abrir a porta", "Parte do teto desaba", "Runa que explode em chamas", "Rede que cai do teto"];
const RT_NPC = ["Prisioneiro acorrentado pedindo ajuda", "Aventureiro perdido e ferido", "Goblin que quer negociar", "Ermitão louco que sabe um segredo", "Fantasma de um antigo guarda", "Mercador escondido com itens raros", "Criança perdida (ou será uma ilusão?)"];
const RT_EVENT = ["Um altar pulsa com energia estranha", "Uma voz ecoa pelas paredes pedindo ajuda", "O chão treme e parte do teto desaba", "Uma estátua fala um enigma", "Um portal cintila por alguns segundos", "Um espírito aparece e oferece um acordo", "As tochas se apagam todas de uma vez", "Uma inscrição antiga revela parte do mapa"];
const RT_OBST = ["Escombros bloqueiam parte da sala", "Um buraco profundo no meio do caminho", "Água até a cintura cobre o chão", "Estalagmites afiadas por toda parte", "Uma jaula enorme ocupa a sala"];
const rd = n => 1 + Math.floor(Math.random() * n);
const lookup = (T, r) => T.find(x => r <= x[0]);
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]], DIRN = ["norte", "leste", "sul", "oeste"];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
let rollSel = null, rollLast = null;
const rollChoice = {content: "roll", shape: "roll", exits: "roll"};
function shapeMask(k, dir){
  const m = [], meta = {pil: [], iw: [], idr: [], st: []}; let w = 0, h = 0;
  const rect = (W, H) => { w = W; h = H; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) m.push([x, y]); };
  const vert = dir % 2 === 0;
  switch (k) {
    case 0: rect(4, 4); break;
    case 1: rect(7, 7); break;
    case 2: Math.random() < .5 ? rect(5, 8) : rect(8, 5); break;
    case 3: w = h = 8; for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (Math.hypot(x + .5 - 4, y + .5 - 4) <= 4.05) m.push([x, y]); break;
    case 4: w = h = 8; for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (Math.min(x, 7 - x) + Math.min(y, 7 - y) >= 2) m.push([x, y]); break;
    case 5: vert ? rect(2, 10) : rect(10, 2); break;
    case 6: { rect(8, 8); const qx = Math.random() < .5 ? 0 : 4, qy = Math.random() < .5 ? 0 : 4; for (let i = m.length - 1; i >= 0; i--) { const [x, y] = m[i]; if (x >= qx && x < qx + 4 && y >= qy && y < qy + 4) m.splice(i, 1); } break; }
    case 7: rect(8, 8); meta.pil = [[2, 2], [5, 2], [2, 5], [5, 5]]; break;
    case 8: if (vert) { rect(7, 8); meta.st = [[1, 3, 0], [3, 3, 0], [5, 3, 0]]; } else { rect(8, 7); meta.st = [[3, 1, 90], [3, 3, 90], [3, 5, 90]]; } break;
    case 9: { if (vert) { rect(6, 9); const g = 1 + Math.floor(Math.random() * 4); meta.iw = [[0, 4, g, 4], [g + 1, 4, 6, 4]]; meta.idr = [[g, 4, g + 1, 4]]; } else { rect(9, 6); const g = 1 + Math.floor(Math.random() * 4); meta.iw = [[4, 0, 4, g], [4, g + 1, 4, 6]]; meta.idr = [[4, g, 4, g + 1]]; } break; }
    case 10: { w = h = 9; const S = new Set(["4,4"]), fr = [[4, 4]]; while (S.size < 40) { const [x, y] = fr[Math.floor(Math.random() * fr.length)], [dx, dy] = DIRS[Math.floor(Math.random() * 4)], nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx > 8 || ny > 8 || S.has(nx + "," + ny)) continue; S.add(nx + "," + ny); fr.push([nx, ny]); } for (const k2 of S) m.push(k2.split(",").map(Number)); break; }
    case 11: rect(12, 12); break;
  }
  return {w, h, m, meta};
}
function rollEdge(c, dd){ const [x, y] = c; return dd === 0 ? [x, y, x + 1, y] : dd === 1 ? [x + 1, y, x + 1, y + 1] : dd === 2 ? [x, y + 1, x + 1, y + 1] : [x, y, x, y + 1]; }
function rollRebuild(){ // paredes, portas e o desenho do chão a partir do estado da masmorra rolada
  const R = scene.roll, W = R.w, H = R.h, A = R.a, at = (x, y) => x < 0 || y < 0 || x >= W || y >= H ? 0 : A[y * W + x];
  const ek = e => e.join(","), skip = new Set(), prevDoor = new Map();
  for (const w of walls()) if (w.g && w.d) prevDoor.set(w.p.join(","), w.o);
  for (const e of R.ex) if (e.st !== "blocked") skip.add(ek(rollEdge(e.c, e.d)));
  const segs = [];
  for (let y = 0; y <= H; y++) for (let x = 0; x < W; x++) if (at(x, y - 1) !== at(x, y) && !skip.has(ek([x, y, x + 1, y]))) segs.push([x, y, x + 1, y]);
  for (let x = 0; x <= W; x++) for (let y = 0; y < H; y++) if (at(x - 1, y) !== at(x, y) && !skip.has(ek([x, y, x, y + 1]))) segs.push([x, y, x, y + 1]);
  const g = scene.gen, P = (x, y) => [Math.round((g.x0 + x * g.s) * 10) / 10, Math.round((g.y0 + y * g.s) * 10) / 10], PP = s => [...P(s[0], s[1]), ...P(s[2], s[3])];
  const out = walls().filter(w => !w.g);
  for (const s of mergeSegs(segs).concat(R.iw)) out.push({p: PP(s), g: 1});
  const door = (s, extra) => { const p = PP(s), o = prevDoor.get(p.join(",")); out.push({p, d: 1, o: o ? 1 : 0, g: 1, ...extra}); };
  for (const e of R.ex) { if (e.st === "blocked") continue; const s = rollEdge(e.c, e.d); if (e.t === "door") door(s); else if (e.st === "new") out.push({p: PP(s), d: 1, o: 0, s: 1, g: 1}); }
  for (const s of R.idr) door(s);
  scene.walls = out;
  let t = "", bb = [W, H, 0, 0];
  for (let i = 0; i < W * H; i++) { const a = A[i]; t += a ? (R.areas[a - 1]?.k === "corredor" ? 2 : 1) : 0; if (a) { const x = i % W, y = (i / W) | 0; bb = [Math.min(bb[0], x), Math.min(bb[1], y), Math.max(bb[2], x + 1), Math.max(bb[3], y + 1)]; } }
  g.t = t; g.iw = R.iw; g.nx = R.ex.filter(e => e.t === "open" && e.st === "new").map(e => ek(rollEdge(e.c, e.d)));
  g.bb = [Math.max(0, bb[0] - 3), Math.max(0, bb[1] - 3), Math.min(W, bb[2] + 3), Math.min(H, bb[3] + 3)]; g.ver = (g.ver || 0) + 1;
  wallsVer++; losCache.clear();
}
function rollFits(R, cells, keep){ // cabe sem encostar em outras áreas? (keep = célula grudada na porta de origem)
  const W = R.w, H = R.h, set = new Set(cells.map(c => c[0] + "," + c[1]));
  for (const [x, y] of cells) {
    if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1 || R.a[y * W + x]) return false;
    if (keep && x === keep[0] && y === keep[1]) continue;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (R.a[ny * W + nx] && !set.has(nx + "," + ny)) return false; }
  }
  return true;
}
function rollExits(R, cells, n, backDir, type, avoid){
  const W = R.w, H = R.h, set = new Set(cells.map(c => c[0] + "," + c[1])), free = (x, y) => x >= 1 && y >= 1 && x < W - 1 && y < H - 1 && !R.a[y * W + x] && !set.has(x + "," + y);
  const cand = [];
  for (const c of cells) {
    if (avoid?.has(c[0] + "," + c[1])) continue;
    for (let dd = 0; dd < 4; dd++) {
      const [dx, dy] = DIRS[dd]; if (set.has((c[0] + dx) + "," + (c[1] + dy))) continue;
      let ok = true; for (let k = 1; k <= 4 && ok; k++) { const x = c[0] + dx * k, y = c[1] + dy * k; if (!free(x, y) || (k <= 2 && (!free(x + dy, y + dx) || !free(x - dy, y - dx)))) ok = false; }
      if (ok) cand.push({c, d: dd});
    }
  }
  shuffle(cand).sort((a, b) => (a.d === backDir) - (b.d === backDir));
  const out = [];
  for (const e of cand) { if (out.length >= n) break; if (out.some(o => Math.abs(o.c[0] - e.c[0]) + Math.abs(o.c[1] - e.c[1]) < 3 || (o.d === e.d && Math.abs(o.c[0] - e.c[0]) + Math.abs(o.c[1] - e.c[1]) < 4))) continue; out.push(e); }
  return out.map(e => ({id: ++R.eid, a: 0, c: e.c, d: e.d, t: type, st: "new"}));
}
function rollPropAt(id, x, y, rot = 0, extra = {}){
  const a = ASSETS.find(q => q.id === id); if (!a) return null;
  const sw = rot % 180 ? a.h : a.w, sh = rot % 180 ? a.w : a.h, g = scene.gen, U = G().unit || 1;
  const t = {id: uid(), k: "prop", n: a.n, img: `/assets/${a.path || a.id + ".svg"}`, pw: a.w, ph: a.h, a: rot, blk: extra.trap ? null : (a.blk || null), sn: true, x: g.x0 + (x + sw / 2) * g.s, y: g.y0 + (y + sh / 2) * g.s};
  if (extra.h) t.h = true; if (a.li) t.li = {rb: a.li.b * U, rd: a.li.d * U, ang: 360, c: a.li.c};
  tokens.push(t); return t;
}
function rollFill(R, area, cells, busy){ // ajudantes de posicionamento dentro de uma área
  const set = new Set(cells.map(c => c[0] + "," + c[1]));
  const fits = (x, y, w, h) => { for (let b = y; b < y + h; b++) for (let a = x; a < x + w; a++) if (!set.has(a + "," + b) || busy.has(a + "," + b)) return false; return true; };
  const mark = (x, y, w, h) => { for (let b = y; b < y + h; b++) for (let a = x; a < x + w; a++) busy.add(a + "," + b); };
  const prop = (id, extra = {}) => { const a = ASSETS.find(q => q.id === id); if (!a) return null; for (let k = 0; k < 60; k++) { const rot = a.w === a.h ? [0, 90, 180, 270][rd(4) - 1] : [0, 90][rd(2) - 1], sw = rot % 180 ? a.h : a.w, sh = rot % 180 ? a.w : a.h, [x, y] = cells[Math.floor(Math.random() * cells.length)]; if (fits(x, y, sw, sh)) { mark(x, y, sw, sh); return rollPropAt(id, x, y, rot, extra); } } return null; };
  const tok = (n, c, s = 1) => { const g = scene.gen; for (let k = 0; k < 80; k++) { const [x, y] = cells[Math.floor(Math.random() * cells.length)]; if (fits(x, y, s, s)) { mark(x, y, s, s); const t = {id: uid(), n, c, s, x: g.x0 + (x + s / 2) * g.s, y: g.y0 + (y + s / 2) * g.s, a: 180, h: true, sn: true}; tokens.push(t); return t; } } return null; };
  const torch = () => { // tocha na parede
    const opts = []; for (const [x, y] of cells) for (let dd = 0; dd < 4; dd++) { const nx = x + DIRS[dd][0], ny = y + DIRS[dd][1]; if (!set.has(nx + "," + ny) && !R.ex.some(e => e.c[0] === x && e.c[1] === y && e.d === dd) && !busy.has(x + "," + y)) opts.push([x, y, [0, 90, 180, 270][dd]]); }
    const o = opts[Math.floor(Math.random() * opts.length)]; if (o) { busy.add(o[0] + "," + o[1]); rollPropAt("tocha-parede", o[0], o[1], o[2]); }
  };
  return {prop, tok, torch, mark, fits};
}
function rollContent(R, area, cells, kind, busy, lines){
  const F = rollFill(R, area, cells, busy), pick = a => a[Math.floor(Math.random() * a.length)];
  const traps = n => { for (let i = 0; i < n; i++) F.prop(pick(["espinhos", "alcapao", "buraco", "grade-chao"]), {h: 1, trap: 1}); };
  if (kind === "vazia") { if (Math.random() < .6) F.prop(pick(["ossos", "sangue", "escombros", "galhos", "cranios"])); }
  else if (kind === "obst") { const o = pick(RT_OBST); lines.push("🧱 " + o); const ids = {"Escombros bloqueiam parte da sala": ["escombros", "escombros", "pilar-quebrado"], "Um buraco profundo no meio do caminho": ["buraco", "buraco"], "Água até a cintura cobre o chão": ["agua-rasa", "agua-rasa", "agua-rasa"], "Estalagmites afiadas por toda parte": ["estalagmites", "estalagmites", "estalagmites", "estalagmites"], "Uma jaula enorme ocupa a sala": ["jaula", "grilhoes"]}[o]; for (const id of ids) F.prop(id); }
  else if (kind === "armad") { const t = pick(RT_TRAPS); lines.push("⚠️ " + t + " (oculta)"); traps(rd(2)); }
  else if (kind === "inim") {
    const r = rd(20), row = lookup(RT_ENC, r); lines.push(`👹 Encontro — 1d20 = ${r} → <b>${row[1]}</b>`);
    const add = (n, nm, c, s = 1) => { for (let i = 0; i < n; i++) F.tok(nm, c, s); };
    if (r <= 4) add(rd(2), "Inimigo fraco", "#7a5a3a");
    else if (r <= 8) add(2 + rd(3), "Inimigo", "#8a3a2a");
    else if (r <= 11) { add(1 + rd(2), "Inimigo", "#8a3a2a"); traps(1); }
    else if (r <= 14) add(1, "Monstro forte", "#8a1f2a", 2);
    else if (r <= 16) { add(2 + rd(2), "Inimigo", "#8a3a2a"); add(1, "Líder", "#b0202a"); }
    else if (r <= 18) add(1, "Monstro especial", "#6a3a8a", 2);
    else if (r === 19) { add(1, "Mini-chefe", "#a0202a", 2); add(2, "Lacaio", "#7a5a3a"); }
    else add(1, "Chefe", "#5a0010", 3);
    lines.push("Tokens ocultos na sala: troque o nome e a imagem pelos monstros certos para o nível do grupo e desoculte quando aparecerem.");
  }
  else if (kind === "npc") { lines.push("🧑 " + pick(RT_NPC)); F.tok("NPC", "#5f9a4a"); }
  else if (kind === "tesouro") {
    const r = rd(20), row = lookup(RT_TRE, r); lines.push(`💰 Tesouro — 1d20 = ${r} → <b>${row[1]}</b>`);
    if (r <= 5) F.prop("bau-aberto"); else if (r <= 10) F.prop("ouro"); else if (r <= 14) F.prop("pocoes"); else if (r <= 17) F.prop("bau"); else if (r <= 19) { F.prop("pedestal"); F.prop("bau"); } else { F.prop("bau-aberto"); F.prop("ouro"); F.prop("pedestal"); }
  }
  else if (kind === "evento") { const ev = pick(RT_EVENT); lines.push("✨ " + ev); F.prop(pick(["altar", "circulo-ritual", "pedestal", "estatua", "cristais"])); }
  return F;
}
function rollStart(){
  if ((scene.bg || walls().length || tokens.some(isProp)) && !confirm("Começar uma masmorra rolada? O mapa atual (imagem, paredes e objetos) vai ser trocado. Ctrl+Z desfaz.")) return;
  if (G().type === "hex") scene.grid = {...scene.grid, type: "square"};
  const W = 130, H = 104, R = {w: W, h: H, a: new Array(W * H).fill(0), areas: [], ex: [], iw: [], idr: [], log: [], eid: 0};
  Object.assign(scene, {bg: null, bgW: 0, bgH: 0, bgQ: 0, bgFine: 0, roll: R, gen: {v: 2, rolled: 1, style: "dungeon", w: W, h: H, t: "", x0: G().ox || 0, y0: G().oy || 0, s: G().size, seed: Date.now() % 1e6}});
  if (genOpt.dark) scene.light = "dark";
  const chars = freshDungeonTokens(); tokens = chars; scene.walls = []; drawings = drawings.filter(d => d.t !== "tpl"); save("drawings");
  const x0 = 63, y0 = 50, cells = []; for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) cells.push([x0 + x, y0 + y]);
  const area = {id: 1, k: "entrada", nm: "Entrada", shape: "Entrada", c: [x0 + 2.5, y0 + 2.5], txt: []};
  R.areas.push(area); for (const [x, y] of cells) R.a[y * W + x] = 1;
  const n = rd(4), ex = rollExits(R, cells, n, -1, "door"); ex.forEach(e => e.a = 1); R.ex.push(...ex);
  const busy = new Set(), F = rollFill(R, area, cells, busy);
  rollPropAt("escada-sobe", x0 + 2, y0 + 1); F.mark(x0 + 2, y0 + 1, 1, 2);
  if (genOpt.torches) { F.torch(); F.torch(); }
  const g = scene.gen; chars.forEach((t, i) => { const c = cells.filter(([x, y]) => !busy.has(x + "," + y))[i] || cells[0]; t.x = g.x0 + (c[0] + .5) * g.s; t.y = g.y0 + (c[1] + .5) * g.s; t.tr = []; });
  area.txt.push(`🚪 1d4 = ${n} → ${ex.length} saída${ex.length > 1 ? "s" : ""}`);
  R.log.push({a: 1, h: "Entrada", l: area.txt.slice()});
  rollLast = {h: "Entrada", l: area.txt.slice()};
  rollRebuild(); resetExplore(); selTok = null;
  save("scene"); save("tokens"); save("fog", false);
  dirty = true; drawTop(); drawEmpty(); fit(); openRollPanel();
}
function rollStep(exId){
  const R = scene.roll, e = R?.ex.find(x => x.id === exId && x.st === "new"); if (!e) return;
  const lines = [], W = R.w;
  // 1) conteúdo
  let kind = rollChoice.content, kname;
  if (kind === "roll") { const r = rd(20), row = lookup(RT_CONTENT, r); kind = row[1]; kname = row[2]; lines.push(`🎲 Sala — 1d20 = ${r} → <b>${kname}</b>`); }
  else { kname = RT_CONTENT.find(x => x[1] === kind)[2]; lines.push(`Escolhido: <b>${kname}</b>`); }
  // 2) formato e 3) saídas
  let shapeI = null;
  if (kind !== "corredor") { if (rollChoice.shape === "roll") { const r = rd(12); shapeI = r - 1; lines.push(`📐 Formato — 1d12 = ${r} → <b>${RT_SHAPES[shapeI]}</b>`); } else { shapeI = +rollChoice.shape; lines.push(`📐 Formato: <b>${RT_SHAPES[shapeI]}</b>`); } }
  let nEx; if (rollChoice.exits === "roll") { nEx = rd(4); lines.push(`🚪 Saídas — 1d4 = ${nEx}`); } else { nEx = +rollChoice.exits; lines.push(`🚪 Saídas: ${nEx}`); }
  const [dx, dy] = DIRS[e.d], O = [e.c[0] + dx, e.c[1] + dy];
  let cells = null, meta = null, conn = [];
  let cwid = 1;
  const corrCells = (L, w) => { // corredor: 1 casa na porta e depois a largura escolhida
    const cs = [O.slice()], px = -dy, py = dx, o0 = -((w - 1) >> 1);
    for (let k = 1; k < L; k++) for (let j = o0; j < o0 + w; j++) cs.push([O[0] + dx * k + px * j, O[1] + dy * k + py * j]);
    return cs;
  };
  if (kind === "corredor") {
    for (const w of [[1, 1, 2, 2, 3][rd(5) - 1], 2, 1]) { for (let L = 6 + rd(7); L >= 3 && !cells; L -= 2) { const cs = corrCells(L, w); if (rollFits(R, cs, O)) { cells = cs; cwid = w; } } if (cells) break; }
  } else {
    const tryShape = (si, cl) => {
      const sm = shapeMask(si, e.d), set = new Set(sm.m.map(c => c[0] + "," + c[1]));
      const conn0 = []; for (let k = 0; k < cl; k++) conn0.push([O[0] + dx * k, O[1] + dy * k]);
      const E = [O[0] + dx * cl, O[1] + dy * cl];
      for (const mc of shuffle(sm.m.filter(([x, y]) => !set.has((x - dx) + "," + (y - dy))))) {
        const ox = E[0] - mc[0], oy = E[1] - mc[1], cs = sm.m.map(([x, y]) => [x + ox, y + oy]);
        if (rollFits(R, conn0.concat(cs), O)) { meta = {...sm.meta, ox, oy}; conn = conn0; return cs; }
      }
      return null;
    };
    for (const cl of [2 + rd(3), 3, 2, 1, 5]) { cells = tryShape(shapeI, cl); if (cells) break; }
    if (!cells) for (const cl of [2, 1, 3]) { cells = tryShape(0, cl); if (cells) { lines.push("(não coube: virou uma sala pequena)"); shapeI = 0; break; } }
  }
  if (!cells && kind !== "corredor") { // nem sala pequena coube: vira um corredor
    for (let L = 8; L >= 2 && !cells; L--) { const cs = corrCells(L, 1); if (rollFits(R, cs, O)) cells = cs; }
    if (cells) { kind = "corredor"; kname = "Corredor"; meta = null; conn = []; lines.push("(não coube uma sala aqui: virou um corredor)"); }
  }
  if (!cells) {
    e.st = "blocked"; lines.push("🪨 Não há espaço: o caminho está <b>bloqueado por um desabamento</b>.");
    R.log.push({a: e.a, h: "Desabamento", l: lines}); rollLast = {h: "Caminho bloqueado", l: lines};
    rollRebuild(); save("scene"); dirty = true; openRollPanel(); return;
  }
  const id = R.areas.length + 1, isCorr = kind === "corredor";
  const nm = isCorr ? `Corredor ${R.areas.filter(a => a.k === "corredor").length + 1}` : `Sala ${R.areas.filter(a => a.k !== "corredor" && a.k !== "entrada").length + 1}`;
  if (isCorr) lines.push(`↔ Corredor de ${cwid} casa${cwid > 1 ? "s" : ""} de largura`);
  const all = conn.concat(cells), area = {id, k: isCorr ? "corredor" : kind, nm, shape: isCorr ? "Corredor" : RT_SHAPES[shapeI], c: [all.reduce((s, c) => s + c[0], 0) / all.length + .5, all.reduce((s, c) => s + c[1], 0) / all.length + .5], txt: []};
  R.areas.push(area); for (const [x, y] of all) R.a[y * W + x] = id;
  e.st = "done"; e.to = id;
  // saídas novas
  let ex;
  if (isCorr) {
    const far = Math.max(...cells.map(c => c[0] * dx + c[1] * dy)), tip = cells.filter(c => c[0] * dx + c[1] * dy === far);
    const first = rollExits(R, tip, 1, (e.d + 2) % 4, "open").filter(x => x.d === e.d);
    const side = nEx > 1 ? rollExits(R, cells.slice(1), nEx - 1, (e.d + 2) % 4, "open").filter(x => x.d !== e.d) : [];
    ex = first.concat(side).slice(0, nEx);
    if (!ex.length) ex = rollExits(R, all, 1, (e.d + 2) % 4, "open");
  } else ex = rollExits(R, cells, nEx, (e.d + 2) % 4, "door", new Set(conn.map(c => c[0] + "," + c[1])));
  ex.forEach(x => x.a = id); R.ex.push(...ex);
  if (ex.length < nEx) lines.push(`(só couberam ${ex.length} saída${ex.length === 1 ? "" : "s"})`);
  // formato especial: pilares, desnível, divisória
  const busy = new Set(conn.map(c => c[0] + "," + c[1]));
  if (meta) {
    for (const [x, y] of meta.pil) { rollPropAt("coluna", x + meta.ox, y + meta.oy); busy.add((x + meta.ox) + "," + (y + meta.oy)); }
    for (const [x, y, rot] of meta.st) { rollPropAt("escada", x + meta.ox, y + meta.oy, rot); const w = rot ? 2 : 1, h = rot ? 1 : 2; for (let b = 0; b < h; b++) for (let a = 0; a < w; a++) busy.add((x + meta.ox + a) + "," + (y + meta.oy + b)); }
    for (const s of meta.iw) R.iw.push([s[0] + meta.ox, s[1] + meta.oy, s[2] + meta.ox, s[3] + meta.oy]);
    for (const s of meta.idr) R.idr.push([s[0] + meta.ox, s[1] + meta.oy, s[2] + meta.ox, s[3] + meta.oy]);
    // não deixa objeto na frente das saídas
    for (const x of ex) busy.add(x.c[0] + "," + x.c[1]);
    if (meta.idr.length) for (const s of R.idr.slice(-meta.idr.length)) { busy.add(s[0] + "," + s[1]); busy.add((s[0] - (s[1] === s[3] ? 0 : 1)) + "," + (s[1] - (s[1] === s[3] ? 1 : 0))); }
  }
  if (isCorr) { if (kind === "corredor" && Math.random() < .15) { const F = rollFill(R, area, cells, busy); F.prop(["espinhos", "alcapao"][rd(2) - 1], {h: 1, trap: 1}); lines.push("⚠️ Armadilha escondida no corredor"); } }
  else {
    const F = rollContent(R, area, cells, kind, busy, lines);
    if (genOpt.torches && kind !== "vazia") { F.torch(); if (cells.length > 40) F.torch(); }
  }
  area.txt = lines.slice();
  R.log.push({a: id, h: `${nm} · ${isCorr ? "Corredor" : kname}${isCorr ? "" : " · " + RT_SHAPES[shapeI]}`, l: lines});
  rollLast = {h: `${nm}${isCorr ? "" : " — " + kname}`, l: lines, a: id};
  rollRebuild(); save("scene"); save("tokens"); dirty = true;
  const nxt = R.ex.filter(x => x.st === "new"); rollSel = ex[0]?.id || nxt[0]?.id || null;
  openRollPanel();
  toast(e.t === "door" ? "Área criada. Clique na porta para abrir quando entrarem." : "Área criada.");
}
function rollExitPos(e){ const g = scene.gen, [dx, dy] = DIRS[e.d]; return [g.x0 + (e.c[0] + .5 + dx * .95) * g.s, g.y0 + (e.c[1] + .5 + dy * .95) * g.s]; }
function rollExitAt(wx, wy){ const R = scene.roll; if (!R || !scene.gen) return null; const r = scene.gen.s * .38; return R.ex.find(e => e.st === "new" && Math.hypot(...(([x, y]) => [x - wx, y - wy])(rollExitPos(e))) <= r) || null; }
function paintRollGM(){ // só o mestre: número das salas e as saídas ainda não roladas
  const R = scene.roll, g = scene.gen; if (!isGM || !R || !g) return;
  ctx.save(); ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const fs = Math.max(11 / cam.z, g.s * .3);
  for (const a of R.areas) { if (a.k === "corredor") continue; const x = g.x0 + a.c[0] * g.s, y = g.y0 + a.c[1] * g.s; ctx.font = `700 ${fs}px "Alegreya Sans", sans-serif`; const txt = a.nm + (a.k !== "entrada" && a.k !== "vazia" ? " · " + (RT_CONTENT.find(r => r[1] === a.k)?.[2] || "") : ""); const w = ctx.measureText(txt).width + fs; ctx.fillStyle = "rgba(20,16,12,.72)"; ctx.fillRect(x - w / 2, y - fs * .75, w, fs * 1.5); ctx.fillStyle = "#e8c77a"; ctx.fillText(txt, x, y); }
  for (const e of R.ex) {
    if (e.st !== "new") continue; const [x, y] = rollExitPos(e), r = g.s * .32, on = e.id === rollSel && panelKind === "gen";
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = on ? "#ffe28a" : "#d0a54c"; ctx.fill(); ctx.lineWidth = 2 / cam.z; ctx.strokeStyle = "#2a1a08"; ctx.stroke();
    ctx.fillStyle = "#1c150c"; ctx.font = `800 ${r * 1.3}px "Alegreya Sans", sans-serif`; ctx.fillText("?", x, y + r * .05);
  }
  ctx.restore();
}
function openRollPanel(){
  panelKind = "gen"; const R = scene.roll, open = R ? R.ex.filter(e => e.st === "new") : [];
  if (!open.some(e => e.id === rollSel)) rollSel = open[0]?.id ?? null;
  const areaNm = id => R.areas[id - 1]?.nm || "?";
  const exNm = e => `${areaNm(e.a)} · ${e.t === "door" ? "porta" : "passagem"} ${DIRN[e.d]}`;
  const sel = (id, label, opts, v) => `<label class="gnum rsel"><span>${label}</span><select id="${id}">${opts.map(([k, l]) => `<option value="${k}" ${String(v) === String(k) ? "selected" : ""}>${l}</option>`).join("")}</select></label>`;
  const tables = `<details class="rtab"><summary>📜 Tabelas</summary>
    <b>O que existe? — 1d20</b><table>${RT_CONTENT.map((r, i) => `<tr><td>${(i ? RT_CONTENT[i - 1][0] + 1 : 1)}${r[0] > (i ? RT_CONTENT[i - 1][0] + 1 : 1) ? "–" + r[0] : ""}</td><td>${r[2]}</td></tr>`).join("")}</table>
    <b>Formato — 1d12</b><table>${RT_SHAPES.map((s, i) => `<tr><td>${i + 1}</td><td>${s}</td></tr>`).join("")}</table>
    <b>Saídas — 1d4</b><p>1 a 4 saídas (além da porta por onde entraram)</p>
    <b>Encontro — 1d20</b><table>${RT_ENC.map((r, i) => `<tr><td>${(i ? RT_ENC[i - 1][0] + 1 : 1)}${r[0] > (i ? RT_ENC[i - 1][0] + 1 : 1) ? "–" + r[0] : ""}</td><td>${r[1]}</td></tr>`).join("")}</table>
    <b>Tesouro — 1d20</b><table>${RT_TRE.map((r, i) => `<tr><td>${(i ? RT_TRE[i - 1][0] + 1 : 1)}${r[0] > (i ? RT_TRE[i - 1][0] + 1 : 1) ? "–" + r[0] : ""}</td><td>${r[1]}</td></tr>`).join("")}</table></details>`;
  $("#panel").innerHTML = `<div class="panel gen-panel" role="dialog" aria-label="Masmorra rolada"><h3>Gerador de cenários <button class="btn small" id="pClose">Fechar</button></h3>
    ${styleTabs("rolled")}
    ${!R ? `<p class="hint" style="font-size:14px">A masmorra vai sendo criada <b>enquanto os jogadores exploram</b>. Você começa só com a entrada. Quando o grupo chega numa porta ou passagem ainda não rolada (o <b style="color:var(--brass)">?</b> dourado, só você vê), clique nela e role: o que existe na sala (1d20), o formato (1d12) e as saídas (1d4). Se sair inimigo ou tesouro, rola a tabela deles também. A sala aparece desenhada, com paredes, portas e objetos.</p>
      <label class="chk"><input type="checkbox" id="gTorch" ${genOpt.torches ? "checked" : ""}> Tochas nas paredes (iluminam)</label>
      <label class="chk"><input type="checkbox" id="gDark" ${genOpt.dark ? "checked" : ""}> Começar no escuro (só vê quem tem luz)</label>
      <div class="acts foot"><span class="spacer"></span><button class="btn primary" id="rStart">▶ Começar pela entrada</button></div>`
    : `${rollLast ? `<div class="rlast"><b>${rollLast.h}</b>${rollLast.l.map(l => `<div>${l}</div>`).join("")}</div>` : ""}
      <div class="lbl">Saídas sem explorar <small>(${open.length})</small></div>
      <div class="rexits">${open.map(e => `<button class="rex" data-rex="${e.id}" aria-pressed="${e.id === rollSel}"><span>?</span>${esc(exNm(e))}</button>`).join("") || `<p class="hint">Nenhuma. A masmorra acabou (ou recomece).</p>`}</div>
      ${open.length ? `<div class="ggrid" style="margin-top:8px">
        ${sel("rC", "Conteúdo", [["roll", "🎲 Rolar 1d20"], ...RT_CONTENT.map(r => [r[1], r[2]])], rollChoice.content)}
        ${sel("rS", "Formato", [["roll", "🎲 Rolar 1d12"], ...RT_SHAPES.map((s, i) => [i, s])], rollChoice.shape)}
        ${sel("rE", "Saídas", [["roll", "🎲 Rolar 1d4"], [1, "1"], [2, "2"], [3, "3"], [4, "4"]], rollChoice.exits)}
      </div>
      <div class="acts foot"><button class="btn small" id="rGo" title="Mostrar essa saída no mapa">👁 Ver</button><span class="spacer"></span><button class="btn primary" id="rRoll">🎲 Rolar e criar a área</button></div>` : ""}
      <div class="lbl" style="margin-top:12px">Diário da masmorra</div>
      <div class="rlog">${R.log.slice().reverse().map(x => `<button class="rlrow" data-ra="${x.a}"><b>${x.h}</b>${x.l.filter(l => !/^🎲|^📐|^🚪|^Escolhido/.test(l)).map(l => `<small>${l}</small>`).join("")}</button>`).join("")}</div>
      <div class="acts" style="margin-top:10px"><button class="btn small danger" id="rReset">Recomeçar do zero</button></div>`}
    ${tables}</div>`;
  $("#pClose").onclick = closePanel;
  $("#gStyle").onclick = ev => { const b = ev.target.closest("[data-st]"); if (!b) return; genOpt.style = b.dataset.st; genOpt.dark = GEN_DARK[genOpt.style]; saveGenOpt(); openGenPanel(); };
  const tg = $("#gTorch"); if (tg) tg.onchange = () => { genOpt.torches = tg.checked; saveGenOpt(); };
  const dk0 = $("#gDark"); if (dk0) dk0.onchange = () => { genOpt.dark = dk0.checked; saveGenOpt(); };
  if ($("#rStart")) $("#rStart").onclick = rollStart;
  if ($("#rReset")) $("#rReset").onclick = () => { if (confirm("Apagar a masmorra rolada e começar outra pela entrada?")) { scene.roll = null; rollLast = null; rollStart(); } };
  for (const [id, k] of [["rC", "content"], ["rS", "shape"], ["rE", "exits"]]) { const s = $("#" + id); if (s) s.onchange = () => { rollChoice[k] = s.value; }; }
  if ($("#rRoll")) $("#rRoll").onclick = () => { if (rollSel != null) rollStep(rollSel); };
  const goEx = e => { const [x, y] = rollExitPos(e); centerOn(x, y, Math.max(cam.z, .7)); };
  if ($("#rGo")) $("#rGo").onclick = () => { const e = R.ex.find(x => x.id === rollSel); if (e) goEx(e); };
  $("#panel").querySelectorAll("[data-rex]").forEach(b => b.onclick = () => { rollSel = +b.dataset.rex; dirty = true; openRollPanel(); });
  $("#panel").querySelectorAll("[data-ra]").forEach(b => b.onclick = () => { const a = R.areas[+b.dataset.ra - 1], g = scene.gen; if (a) centerOn(g.x0 + a.c[0] * g.s, g.y0 + a.c[1] * g.s, Math.max(cam.z, .6)); });
  dirty = true;
}

// ---------- mapas salvos (pastas) ----------
const LIB0 = 1000;
let libList = null, libFolders = [], libClosed = (() => { try { return JSON.parse(localStorage.getItem("mesa.libclosed")) || {}; } catch { return {}; } })(), libBusy = false;
const saveLibClosed = () => { try { localStorage.setItem("mesa.libclosed", JSON.stringify(libClosed)); } catch {} };
async function libLoad(){
  const {data, error} = await sb.from("map_state").select("id, lib:scene->lib, bg:scene->>bg, gs:scene->gen->>style, updated_at").gte("id", 999).order("id");
  if (error) { toast("Não carreguei os mapas: " + error.message); libList = []; return; }
  libFolders = (data.find(r => r.id === 999)?.lib?.folders || []).filter(Boolean);
  libList = data.filter(r => r.id >= LIB0).map(r => ({id: r.id, n: r.lib?.n || `Mapa ${r.id - LIB0 + 1}`, f: r.lib?.f || "", bg: r.bg || null, gs: r.gs || null, at: r.updated_at}));
  for (const m of libList) if (m.f && !libFolders.includes(m.f)) libFolders.push(m.f);
}
async function libSaveFolders(){ const {error} = await sb.from("map_state").upsert({id: 999, scene: {lib: {folders: libFolders}}}); if (error) toast("Não salvei as pastas: " + error.message); }
function libSnapshot(n, f){ const sc = JSON.parse(JSON.stringify(scene)); sc.lib = {n, f: f || ""}; return {scene: sc, tokens, fog: {on: !!fog.on, cells: fog.cells || {}, exImg: fog.exImg || null, exBox: fog.exBox || null}, drawings, updated_at: new Date().toISOString()}; }
async function libSaveAs(n, f){
  if (!libList) await libLoad();
  const id = Math.max(LIB0 - 1, ...libList.map(m => m.id)) + 1;
  scene.libId = id; scene.libName = n; scene.libF = f || "";
  const {error} = await sb.from("map_state").insert({id, ...libSnapshot(n, f)});
  if (error) { delete scene.libId; return toast("Não salvei: " + error.message); }
  save("scene", false); drawTop(); toast(`“${n}” salvo nos Mapas.`); await libLoad();
}
async function libSaveCur(quiet){
  if (!scene.libId) return false;
  if (scene.libAt) { const {data: r} = await sb.from("map_state").select("updated_at").eq("id", scene.libId).maybeSingle();
    if (r?.updated_at && new Date(r.updated_at) > new Date(scene.libAt) && !confirm(`“${scene.libName}” foi editado em outra aba depois que você abriu na mesa.\n\nOK = salvar a versão da mesa por cima\nCancelar = manter a versão editada`)) { scene.libAt = r.updated_at; return false; } }
  scene.libAt = new Date().toISOString();
  const {error, count} = await sb.from("map_state").update(libSnapshot(scene.libName || "Mapa", scene.libF), {count: "exact"}).eq("id", scene.libId);
  if (error) { toast("Não salvei: " + error.message); return false; }
  if (!count) { const n = scene.libName || "Mapa"; delete scene.libId; await libSaveAs(n, scene.libF); return true; }
  if (!quiet) toast(`“${scene.libName}” salvo.`); return true;
}
async function libOpen(id){
  if (libBusy) return; libBusy = true;
  try {
    const m = libList.find(x => x.id === id);
    if (scene.libId && scene.libId !== id) await libSaveCur(true);
    else if (!scene.libId && (scene.bg || scene.gen || tokens.length || walls().length) && !confirm(`Abrir “${m?.n}”? O mapa de agora não está salvo nos Mapas e vai ser substituído.`)) return;
    const {data, error} = await sb.from("map_state").select("*").eq("id", id).maybeSingle();
    if (error || !data) return toast("Não abri: " + (error?.message || "mapa não encontrado"));
    const sc = {bg: null, bgW: 0, bgH: 0, bgQ: 0, bgFine: 0, light: "day", walls: [], gen: null, roll: null, ...(data.scene || {})};
    sc.grid = {type: "square", size: 70, ox: 0, oy: 0, color: "#000000", alpha: .35, show: true, unit: 1.5, unitName: "m", ...(data.scene?.grid || {})};
    sc.libId = id; sc.libName = data.scene?.lib?.n || m?.n || "Mapa"; sc.libF = data.scene?.lib?.f || ""; sc.libAt = data.updated_at || new Date().toISOString(); delete sc.lib;
    scene = sc; tokens = data.tokens || []; drawings = data.drawings || [];
    fog = {on: !!data.fog?.on, cells: data.fog?.cells || {}, exImg: data.fog?.exImg || null, exBox: data.fog?.exBox || null}; exC = null; exReady = false; exImgSrc = null;
    undoS.length = 0; redoS.length = 0; for (const c of ["scene", "tokens", "fog", "drawings"]) { snapPrev(c); lastSave[c] = Date.now(); }
    wallsVer++; losCache.clear(); selTok = null; tokLive = {};
    const {error: e2} = await sb.from("map_state").update({scene, tokens, fog, drawings, updated_at: new Date().toISOString()}).eq("id", 1);
    if (e2) toast("Abri aqui, mas não consegui enviar aos jogadores: " + e2.message);
    for (const c of ["scene", "tokens", "drawings", "fog"]) { const val = getColFull(c); try { if (JSON.stringify(val).length < 180000) send("state", {col: c, val}); } catch {} }
    dirty = true; drawTop(); drawEmpty(); fit();
    const b = mapBox(); if (b) setTimeout(() => send("view", {x: b[0] + b[2] / 2, y: b[1] + b[3] / 2, z: cam.z}), 300);
    toast(`Mapa “${scene.libName}” aberto.`);
  } finally { libBusy = false; if (panelKind === "maps") openMapsPanel(); }
}
const getColFull = c => c === "scene" ? scene : c === "tokens" ? tokens : c === "fog" ? fog : drawings;
async function libPatch(id, fn){ // muda nome/pasta de um mapa salvo
  const {data, error} = await sb.from("map_state").select("scene").eq("id", id).maybeSingle(); if (error || !data) return toast("Não consegui: " + (error?.message || "?"));
  const sc = data.scene || {}; sc.lib = fn({...(sc.lib || {})});
  const {error: e2} = await sb.from("map_state").update({scene: sc}).eq("id", id); if (e2) return toast("Não consegui: " + e2.message);
  if (scene.libId === id) { scene.libName = sc.lib.n; scene.libF = sc.lib.f || ""; save("scene", false); drawTop(); }
}
async function openMapsPanel(){
  panelKind = "maps";
  if (!libList) { $("#panel").innerHTML = `<div class="panel maps-panel"><h3>Mapas <button class="btn small" id="pClose">Fechar</button></h3><p class="hint">Carregando…</p></div>`; $("#pClose").onclick = closePanel; await libLoad(); if (panelKind !== "maps") return; }
  const cur = scene.libId ? libList.find(m => m.id === scene.libId) : null;
  const when = s => { try { return new Date(s).toLocaleDateString("pt-BR", {day: "2-digit", month: "short"}); } catch { return ""; } };
  const row = m => `<div class="mrow ${m.id === scene.libId ? "on" : ""}" data-mid="${m.id}" draggable="true">
      <span class="mthumb">${m.bg ? `<img src="${esc(m.bg)}" alt="" loading="lazy">` : m.gs ? (m.gs === "cave" ? "⛰" : "🏰") : "▦"}</span>
      <span class="mname"><b>${esc(m.n)}</b><small>${m.id === scene.libId ? "aberto agora · " : ""}${when(m.at)}</small></span>
      ${EDIT_ID ? `<button class="btn small primary" data-editnow="${m.id}" ${m.id === EDIT_ID ? "disabled" : ""}>Editar</button>` : `<button class="btn small primary" data-open="${m.id}" ${m.id === scene.libId ? "disabled" : ""} title="Abrir na mesa (os jogadores vão para este mapa)">Abrir</button><button class="btn small ic" data-edittab="${m.id}" title="Editar em outra aba, sem tirar os jogadores do mapa atual" aria-label="Editar em outra aba">✏️</button>`}
      ${m.bg ? `<button class="btn small ic" data-mrel="${m.id}" title="Liberar a imagem deste mapa no diário dos jogadores" aria-label="Liberar para os jogadores">📤</button>` : ""}<button class="btn small ic" data-ren="${m.id}" title="Renomear" aria-label="Renomear">✎</button>
      <button class="btn small ic" data-dup="${m.id}" title="Duplicar" aria-label="Duplicar">⧉</button>
      <button class="btn small ic danger" data-del="${m.id}" title="Apagar" aria-label="Apagar">🗑</button></div>`;
  const groups = [["", "Sem pasta"], ...libFolders.map(f => [f, f])];
  $("#panel").innerHTML = `<div class="panel maps-panel" role="dialog" aria-label="Mapas salvos"><h3>Mapas <button class="btn small" id="pClose">Fechar</button></h3>
    ${EDIT_ID ? `<div class="mcur">✏️ Editando <b>${esc(scene.lib?.n || "")}</b> nesta aba. Tudo é salvo sozinho e os jogadores não veem. Para usar na sessão, clique em <b>Abrir</b> na aba da mesa.</div>` : ""}
    <div class="mcur" ${EDIT_ID ? "hidden" : ""}>Aberto agora: <b>${esc(scene.libId ? scene.libName : "mapa sem nome")}</b>${scene.libId ? "" : " <small>(não salvo)</small>"}
      <div class="acts" style="margin-top:8px">${scene.libId ? `<button class="btn small primary" id="mSave">💾 Salvar</button>` : ""}<button class="btn small ${scene.libId ? "" : "primary"}" id="mSaveAs">Salvar como novo…</button><button class="btn small" id="mBlank" title="Começar um mapa vazio na mesa">＋ Mapa vazio</button><button class="btn small" id="mNewTab" title="Criar e montar um mapa em outra aba, sem mexer na mesa">✏️ Novo em outra aba</button></div>
      <form id="mForm" hidden><input type="text" id="mName" maxlength="40" placeholder="Nome do mapa" required><select id="mFolder">${groups.map(([k, l]) => `<option value="${esc(k)}">${esc(l)}</option>`).join("")}</select><button class="btn small primary">Salvar</button></form></div>
    <p class="hint">Monte os mapas antes da sessão e na hora é só abrir. Ao abrir outro, o que está aberto é salvo sozinho. Arraste um mapa para outra pasta.</p>
    <div class="acts"><button class="btn small" id="mNewF">＋ Nova pasta</button></div>
    ${groups.map(([k, l]) => { const ms = libList.filter(m => m.f === k); if (!k && !ms.length && libFolders.length) return "";
      return `<div class="mfold" data-fold="${esc(k)}"><div class="mfh"><button class="mft" data-tog="${esc(k)}" aria-expanded="${!libClosed[k]}">${libClosed[k] ? "▸" : "▾"} 📁 ${esc(l)} <small>${ms.length}</small></button>${k ? `<button class="btn small ic" data-fren="${esc(k)}" title="Renomear pasta" aria-label="Renomear pasta">✎</button><button class="btn small ic danger" data-fdel="${esc(k)}" title="Apagar pasta" aria-label="Apagar pasta">🗑</button>` : ""}</div>
        ${libClosed[k] ? "" : `<div class="mlist">${ms.map(row).join("") || `<p class="hint" style="margin:4px 8px">Vazia.</p>`}</div>`}</div>`; }).join("")}
    </div>`;
  $("#pClose").onclick = closePanel;
  const refresh = async () => { await libLoad(); if (panelKind === "maps") openMapsPanel(); };
  if ($("#mSave")) $("#mSave").onclick = async () => { await libSaveCur(); refresh(); };
  $("#mSaveAs").onclick = () => { const f = $("#mForm"); f.hidden = !f.hidden; if (!f.hidden) { $("#mName").value = scene.libId ? scene.libName + " (cópia)" : ""; $("#mFolder").value = scene.libF || ""; $("#mName").focus(); } };
  $("#mForm").onsubmit = async e => { e.preventDefault(); const n = $("#mName").value.trim(); if (!n) return; await libSaveAs(n, $("#mFolder").value); openMapsPanel(); };
  $("#mBlank").onclick = async () => {
    if (scene.libId) await libSaveCur(true); else if ((scene.bg || scene.gen || tokens.length || walls().length) && !confirm("O mapa de agora não está salvo nos Mapas. Começar um vazio mesmo assim?")) return;
    const chars = tokens.filter(t => !isProp(t));
    scene = {bg: null, bgW: 0, bgH: 0, bgQ: 0, bgFine: 0, light: "day", walls: [], gen: null, roll: null, libId: null, libName: null, libF: "", grid: {...scene.grid}}; tokens = chars.map(t => ({...t, tr: []})); drawings = []; fog = {on: false, cells: {}}; resetExplore();
    wallsVer++; losCache.clear(); save("scene"); save("tokens"); save("drawings"); save("fog", false); dirty = true; drawTop(); drawEmpty(); fit(); openMapsPanel();
  };
  if ($("#mNewTab")) $("#mNewTab").onclick = async () => {
    const n = (prompt("Nome do novo mapa:") || "").trim().slice(0, 40); if (!n) return;
    const id = Math.max(LIB0 - 1, ...libList.map(m => m.id)) + 1, w = window.open("about:blank", "_blank");
    const {error} = await sb.from("map_state").insert({id, scene: {bg: null, walls: [], light: "day", grid: {...scene.grid}, lib: {n, f: ""}}, tokens: [], fog: {on: false, cells: {}}, drawings: [], updated_at: new Date().toISOString()});
    if (error) { w?.close(); return toast("Não criei: " + error.message); }
    if (w) w.location.href = `/mapa.html?edit=${id}`; else window.open(`/mapa.html?edit=${id}`, "_blank");
    await libLoad(); openMapsPanel();
  };
  $("#mNewF").onclick = async () => { const n = (prompt("Nome da pasta:") || "").trim().slice(0, 30); if (!n) return; if (!libFolders.includes(n)) { libFolders.push(n); await libSaveFolders(); } openMapsPanel(); };
  const P = $("#panel");
  P.onclick = async e => {
    const b = e.target.closest("button"); if (!b) return; const d = b.dataset;
    if (d.tog != null) { libClosed[d.tog] = !libClosed[d.tog]; saveLibClosed(); openMapsPanel(); }
    else if (d.open) libOpen(+d.open);
    else if (d.edittab) window.open(`/mapa.html?edit=${d.edittab}`, "_blank");
    else if (d.editnow) location.href = `/mapa.html?edit=${d.editnow}`;
    else if (d.mrel) { const m = libList.find(x => x.id === +d.mrel); if (!m?.bg) return; if (!hand) await handLoad(); if (hand.some(h => h.url === m.bg)) { hand.find(h => h.url === m.bg).vis = true; } else hand.push({id: uid(), cat: "mapa", t: m.n, body: "", url: m.bg, vis: true, at: Date.now()}); await handSave(); toast(`Imagem de “${m.n}” liberada em Mapas para os jogadores.`); }
    else if (d.ren) { const m = libList.find(x => x.id === +d.ren); const n = (prompt("Novo nome:", m.n) || "").trim().slice(0, 40); if (n) { await libPatch(m.id, l => ({...l, n})); refresh(); } }
    else if (d.dup) { const {data, error} = await sb.from("map_state").select("*").eq("id", +d.dup).maybeSingle(); if (error || !data) return toast("Não consegui duplicar."); const id = Math.max(LIB0 - 1, ...libList.map(m => m.id)) + 1; data.scene = {...(data.scene || {}), lib: {...(data.scene?.lib || {}), n: (data.scene?.lib?.n || "Mapa") + " (cópia)"}}; delete data.scene.libId; const {error: e2} = await sb.from("map_state").insert({...data, id, updated_at: new Date().toISOString()}); if (e2) toast("Não consegui duplicar: " + e2.message); refresh(); }
    else if (d.del) { const m = libList.find(x => x.id === +d.del); if (!confirm(`Apagar o mapa salvo “${m.n}”? Não dá para desfazer.`)) return; const {error} = await sb.from("map_state").delete().eq("id", m.id); if (error) return toast("Não apaguei: " + error.message); if (scene.libId === m.id) { scene.libId = null; save("scene", false); } refresh(); }
    else if (d.fren != null) { const old = d.fren, n = (prompt("Novo nome da pasta:", old) || "").trim().slice(0, 30); if (!n || n === old) return; libFolders = libFolders.map(f => f === old ? n : f); await libSaveFolders(); for (const m of libList.filter(m => m.f === old)) await libPatch(m.id, l => ({...l, f: n})); if (libClosed[old]) { libClosed[n] = true; delete libClosed[old]; saveLibClosed(); } refresh(); }
    else if (d.fdel != null) { const k = d.fdel, ms = libList.filter(m => m.f === k); if (!confirm(ms.length ? `Apagar a pasta “${k}”? Os ${ms.length} mapas dela vão para “Sem pasta”.` : `Apagar a pasta “${k}”?`)) return; libFolders = libFolders.filter(f => f !== k); await libSaveFolders(); for (const m of ms) await libPatch(m.id, l => ({...l, f: ""})); refresh(); }
  };
  // arrastar mapas entre pastas
  P.ondragstart = e => { const r = e.target.closest("[data-mid]"); if (r) { e.dataTransfer.setData("text/mesa-map", r.dataset.mid); e.dataTransfer.effectAllowed = "move"; } };
  P.ondragover = e => { const f = e.target.closest("[data-fold]"); if (f && [...e.dataTransfer.types].includes("text/mesa-map")) { e.preventDefault(); P.querySelectorAll(".mfold.over").forEach(x => x !== f && x.classList.remove("over")); f.classList.add("over"); } };
  P.ondragleave = e => { const f = e.target.closest("[data-fold]"); if (f && !f.contains(e.relatedTarget)) f.classList.remove("over"); };
  P.ondrop = async e => { const f = e.target.closest("[data-fold]"); const id = +e.dataTransfer.getData("text/mesa-map"); P.querySelectorAll(".mfold.over").forEach(x => x.classList.remove("over")); if (!f || !id) return; e.preventDefault(); const k = f.dataset.fold, m = libList.find(x => x.id === id); if (!m || m.f === k) return; m.f = k; openMapsPanel(); await libPatch(id, l => ({...l, f: k})); refresh(); };
}


// ---------- arrastar e soltar no mapa: assets, magias, meus tokens e imagens do computador ----------
let dragPayload = null, dropPrev = null;
const DND_SEL = "[data-as],[data-my],[data-sp],[data-mt]";
document.addEventListener("mousedown", e => { const el = e.target.closest?.(DND_SEL); if (el) el.draggable = true; }, true);
document.addEventListener("dragstart", e => {
  const el = e.target.closest?.(DND_SEL); if (!el) return;
  const d = el.dataset;
  dragPayload = d.as != null ? {k: "as", i: +d.as} : d.my != null ? {k: "my", i: +d.my} : d.sp != null ? {k: "sp", i: +d.sp} : {k: "mt", i: +d.mt};
  e.dataTransfer.setData("text/mesa-drop", JSON.stringify(dragPayload)); e.dataTransfer.effectAllowed = "copy";
  const im = el.querySelector("img"); if (im) e.dataTransfer.setDragImage(im, im.width / 2, im.height / 2);
});
document.addEventListener("dragend", () => { dragPayload = null; dropPrev = null; dirty = true; });
function dropSpell(i, wx, wy){ const sp = SPELLS[i]; if (!sp) return; spellSel = i; spellCustom = null; return {id: uid(), t: "tpl", n: sp.n, ic: sp.ic, sh: sp.sh, r: sp.r, wd: sp.wd, c: sp.c, x: Math.round(wx), y: Math.round(wy), a: 0, own: isGM ? undefined : myKey}; }
cv.addEventListener("dragover", e => {
  const files = [...(e.dataTransfer?.types || [])].includes("Files");
  if (!dragPayload && !(files && isGM)) return;
  if (dragPayload && dragPayload.k !== "sp" && !isGM) return;
  e.preventDefault(); e.dataTransfer.dropEffect = "copy";
  const [wx, wy] = toWorld(e.clientX, e.clientY); dropPrev = {x: wx, y: wy, p: dragPayload}; dirty = true;
});
cv.addEventListener("dragleave", () => { dropPrev = null; dirty = true; });
cv.addEventListener("drop", async e => {
  e.preventDefault(); const [wx, wy] = toWorld(e.clientX, e.clientY); lastClick = [wx, wy]; dropPrev = null; dirty = true;
  const p = dragPayload; dragPayload = null;
  if (!p) { // imagem arrastada do computador: vira um objeto no mapa (e entra em Meus assets)
    if (!isGM) return; const f = [...(e.dataTransfer?.files || [])].find(f => f.type.startsWith("image/")); if (!f) return;
    toast("Enviando a imagem…");
    try { const url = await uploadImage(f, "assets"), [iw, ih] = await measure(url).catch(() => [100, 100]), n = f.name.replace(/\.\w+$/, "").slice(0, 24);
      const w = Math.max(1, Math.min(8, Math.round(iw / 140))), h = Math.max(1, Math.min(8, Math.round(w * ih / iw)));
      myAssets.push({n, src: url, w, h}); saveMyAssets(); addProp({n, w, h, blk: null}, url); toast(`“${n}” colocado no mapa e salvo em Meus assets.`);
    } catch (err) { toast("Não enviei: " + err.message); }
    return;
  }
  if (p.k === "sp") { const t = dropSpell(p.i, wx, wy); if (!t) return; if (isGM) { drawings.push(t); save("drawings"); } else { ptpls[t.id] = t; send("tpl", {op: "set", t}); } selTpl = t.id; drawTplBar(); if (flyKind === "spell") openFlyout("spell"); return; }
  if (!isGM) return;
  if (p.k === "as") addProp(ASSETS[p.i]);
  else if (p.k === "my") { const a = myAssets[p.i]; if (a) addProp({n: a.n, w: a.w, h: a.h, blk: null}, a.src); }
  else if (p.k === "mt") { const m = myTokens[p.i]; if (!m) return; const c = JSON.parse(JSON.stringify(m)); const [x, y] = snapPoint(wx, wy, c.s || 1); tokens.push({...c, id: uid(), x, y}); selTok = tokens[tokens.length - 1].id; save("tokens"); dirty = true; }
});
function paintDropPrev(){
  const d = dropPrev; if (!d) return; const p = d.p;
  ctx.save(); ctx.globalAlpha = .6;
  if (!p) { const S = G().size; ctx.setLineDash([6 / cam.z, 4 / cam.z]); ctx.strokeStyle = "#ffe28a"; ctx.lineWidth = 2 / cam.z; ctx.strokeRect(d.x - S / 2, d.y - S / 2, S, S); ctx.setLineDash([]); ctx.restore(); label(d.x, d.y, "Soltar a imagem aqui"); return; }
  if (p.k === "sp") { const t = dropSpell(p.i, d.x, d.y); if (t) paintTpl(t, true); }
  else if (p.k === "mt") { const m = myTokens[p.i]; if (m) { const [x, y] = snapPoint(d.x, d.y, m.s || 1); ctx.beginPath(); ctx.arc(x, y, tokR(m), 0, Math.PI * 2); ctx.fillStyle = m.c || "#d0a54c"; ctx.fill(); } }
  else { const a = p.k === "as" ? ASSETS[p.i] : myAssets[p.i]; if (a) { const t = {k: "prop", pw: a.w, ph: a.h, a: 0, sn: true, img: p.k === "as" ? `/assets/${a.path || a.id + ".svg"}` : a.src}; const [x, y] = snapProp(t, d.x, d.y); t.x = x; t.y = y; paintProp(t); const [W2, H2] = propSize(t); ctx.globalAlpha = 1; ctx.setLineDash([6 / cam.z, 4 / cam.z]); ctx.strokeStyle = "#ffe28a"; ctx.lineWidth = 2 / cam.z; ctx.strokeRect(x - W2 / 2, y - H2 / 2, W2, H2); ctx.setLineDash([]); } }
  ctx.restore();
}
// ---------- anotações e mapas para os jogadores (o mestre libera) + popup na tela ----------
// guardado na linha 998 do map_state (coluna drawings): [{id, cat: "mapa"|"nota"|"imagem", t, body, url, vis, at}]
const HD_ROW = 998, HCAT = {mapa: ["🗺", "Mapa"], nota: ["📜", "Nota"], imagem: ["🖼", "Imagem"]};
let hand = null, handTab = "all", handQ = "", handEdit = null;
let myNotes = (() => { try { return JSON.parse(localStorage.getItem("mesa.mynotes")) || []; } catch { return []; } })();
const saveMyNotes = () => { try { localStorage.setItem("mesa.mynotes", JSON.stringify(myNotes)); } catch {} };
async function handLoad(){
  const {data, error} = await sb.from("map_state").select("drawings").eq("id", HD_ROW).maybeSingle();
  if (error) { toast("Não carreguei as anotações: " + error.message); hand = hand || []; return; }
  hand = Array.isArray(data?.drawings) ? data.drawings : [];
}
async function handSave(){
  const {error} = await sb.from("map_state").upsert({id: HD_ROW, drawings: hand, updated_at: new Date().toISOString()});
  if (error) return toast("Não salvei: " + error.message);
  send("hand", {v: Date.now()});
}
const handVisible = () => (hand || []).filter(h => isGM || h.vis);
function handRow(h){
  const [ic, nm] = HCAT[h.cat] || HCAT.nota;
  return `<div class="hrow ${h.vis ? "vis" : ""}" data-hid="${esc(h.id)}">
    <button class="hmain" data-hopen="${esc(h.id)}">${h.url ? `<span class="hthumb"><img src="${esc(h.url)}" alt="" loading="lazy"></span>` : `<span class="hthumb ic">${ic}</span>`}<span class="hname"><b>${esc(h.t || nm)}</b><small>${nm}${isGM ? (h.vis ? " · <span class='hv'>jogadores veem</span>" : " · só você") : ""}</small></span></button>
    ${isGM ? `<button class="btn small ic" data-hvis="${esc(h.id)}" title="${h.vis ? "Esconder dos jogadores" : "Liberar para os jogadores"}" aria-label="Visibilidade">${h.vis ? "👁" : "🔒"}</button><button class="btn small ic" data-hpop="${esc(h.id)}" title="Mostrar agora na tela dos jogadores" aria-label="Mostrar na tela">📢</button><button class="btn small ic" data-hedit="${esc(h.id)}" title="Editar" aria-label="Editar">✎</button>` : ""}</div>`;
}
async function openHandPanel(tab){
  panelKind = "hand"; if (tab) handTab = tab;
  if (!hand) { $("#panel").innerHTML = `<div class="panel hand-panel"><h3>${isGM ? "Anotações" : "Diário"} <button class="btn small" id="pClose">Fechar</button></h3><p class="hint">Carregando…</p></div>`; $("#pClose").onclick = closePanel; await handLoad(); if (panelKind !== "hand") return; }
  const tabs = isGM ? [["all", "Tudo"], ["mapa", "🗺 Mapas"], ["nota", "📜 Notas"], ["imagem", "🖼 Imagens"]] : [["mapa", "🗺 Mapas"], ["nota", "📜 Anotações"], ["mine", "✍ Minhas notas"]];
  if (!tabs.some(t => t[0] === handTab)) handTab = tabs[0][0];
  const q = norm(handQ), list = handVisible().filter(h => (handTab === "all" || h.cat === handTab || (!isGM && handTab === "nota" && h.cat === "imagem")) && (!q || norm(h.t + " " + (h.body || "")).includes(q))).sort((a, b) => (b.at || 0) - (a.at || 0));
  const peers = [...new Set(peersOnMap)].filter(n => n);
  $("#panel").innerHTML = `<div class="panel hand-panel" role="dialog" aria-label="${isGM ? "Anotações" : "Diário"}"><h3>${isGM ? "Anotações e arquivos" : "Diário do grupo"} <button class="btn small" id="pClose">Fechar</button></h3>
    <div class="seg htabs" id="hTabs">${tabs.map(([k, l]) => `<button data-htab="${k}" aria-pressed="${handTab === k}">${l}</button>`).join("")}</div>
    ${handTab === "mine" ? `<p class="hint">Só você vê estas notas (ficam neste computador).</p>
      <div class="hlist">${myNotes.map((n, i) => `<div class="mynote"><input type="text" data-mnt="${i}" value="${esc(n.t)}" placeholder="Título" maxlength="60"><textarea data-mnb="${i}" rows="4" placeholder="Escreva aqui…">${esc(n.body)}</textarea><button class="btn small danger" data-mndel="${i}">Apagar</button></div>`).join("") || `<p class="hint">Nenhuma nota ainda.</p>`}</div>
      <div class="acts"><button class="btn small primary" id="mnAdd">＋ Nova nota</button></div>`
    : `<input type="search" id="hQ" placeholder="Procurar…" value="${esc(handQ)}">
      ${isGM ? `<div class="acts" style="margin:8px 0"><button class="btn small primary" id="hNewNote">＋ Nota</button><button class="btn small" id="hNewImg">＋ Mapa ou imagem</button></div>
        <details class="hquick"><summary>📢 Mensagem rápida na tela dos jogadores</summary><textarea id="hqTxt" rows="3" placeholder="Ex.: Vocês ouvem passos vindo do corredor…"></textarea>
          <div class="acts"><select id="hqTo"><option value="*">Todos</option>${peers.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join("")}</select><button class="btn small primary" id="hqSend">Mostrar na tela</button></div></details>` : ""}
      <div class="hlist">${list.map(handRow).join("") || `<p class="hint">${isGM ? "Nada ainda. Crie notas, suba mapas e imagens; depois libere (👁) ou mostre na tela (📢)." : "O mestre ainda não liberou nada aqui."}</p>`}</div>`}</div>`;
  $("#pClose").onclick = closePanel;
  $("#hTabs").onclick = e => { const b = e.target.closest("[data-htab]"); if (b) { handTab = b.dataset.htab; openHandPanel(); } };
  const hq = $("#hQ"); if (hq) hq.oninput = () => { handQ = hq.value; const pos = hq.selectionStart; openHandPanel().then(() => { const n = $("#hQ"); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }); };
  if (handTab === "mine") {
    $("#mnAdd").onclick = () => { myNotes.unshift({t: "", body: ""}); saveMyNotes(); openHandPanel(); setTimeout(() => $("[data-mnt='0']")?.focus(), 30); };
    $("#panel").oninput = e => { const t = e.target; if (t.dataset.mnt != null) myNotes[+t.dataset.mnt].t = t.value; else if (t.dataset.mnb != null) myNotes[+t.dataset.mnb].body = t.value; else return; saveMyNotes(); };
    $("#panel").onclick = e => { const b = e.target.closest("[data-mndel]"); if (b && confirm("Apagar esta nota?")) { myNotes.splice(+b.dataset.mndel, 1); saveMyNotes(); openHandPanel(); } };
    return;
  }
  $("#panel").oninput = null;
  if (isGM) {
    $("#hNewNote").onclick = () => handEditor({id: uid(), cat: "nota", t: "", body: "", url: "", vis: false});
    $("#hNewImg").onclick = () => handEditor({id: uid(), cat: "mapa", t: "", body: "", url: "", vis: false});
    $("#hqSend").onclick = () => { const txt = $("#hqTxt").value.trim(); if (!txt) return; const to = $("#hqTo").value; send("pop", {to, item: {t: "Mestre", body: txt}}); toast(to === "*" ? "Mostrado na tela de todos." : `Mostrado na tela de ${to}.`); $("#hqTxt").value = ""; };
  }
  $("#panel").onclick = async e => {
    const b = e.target.closest("button"); if (!b) return; const d = b.dataset, h = (hand || []).find(x => x.id === (d.hopen || d.hvis || d.hpop || d.hedit));
    if (d.hopen && h) showHandout(h, false);
    else if (d.hvis && h) { h.vis = !h.vis; await handSave(); openHandPanel(); toast(h.vis ? "Liberado para os jogadores." : "Escondido dos jogadores."); }
    else if (d.hpop && h) popChooser(h);
    else if (d.hedit && h) handEditor({...h});
  };
}
function popChooser(h){ // escolhe para quem mostrar
  const peers = [...new Set(peersOnMap)].filter(n => n);
  if (!peers.length) { send("pop", {to: "*", item: h}); return toast("Mostrado na tela de todos."); }
  const box = document.createElement("div"); box.className = "hpopchoose"; box.innerHTML = `<div class="panel" style="position:static;width:auto"><b>Mostrar “${esc(h.t || "item")}” para:</b><div class="acts" style="margin-top:8px;flex-wrap:wrap"><button class="btn small primary" data-to="*">Todos</button>${peers.map(n => `<button class="btn small" data-to="${esc(n)}">${esc(n)}</button>`).join("")}<button class="btn small" data-to="">Cancelar</button></div>${h.vis ? "" : `<label class="chk" style="margin-top:8px"><input type="checkbox" id="hpKeep"> Também deixar liberado no diário</label>`}</div>`;
  document.body.appendChild(box);
  box.onclick = async e => { const b = e.target.closest("[data-to]"); if (!b) { if (e.target === box) box.remove(); return; } const to = b.dataset.to; const keep = $("#hpKeep", box)?.checked; box.remove(); if (!to) return;
    if (keep) { h.vis = true; await handSave(); if (panelKind === "hand") openHandPanel(); }
    send("pop", {to, item: {t: h.t, body: h.body, url: h.url, cat: h.cat}}); toast(to === "*" ? "Mostrado na tela de todos." : `Mostrado na tela de ${to}.`); };
}
function handEditor(h){
  panelKind = "hand";
  const isNew = !(hand || []).some(x => x.id === h.id);
  $("#panel").innerHTML = `<div class="panel hand-panel" role="dialog" aria-label="Editar"><h3>${isNew ? "Novo" : "Editar"} <button class="btn small" id="pClose">Voltar</button></h3>
    <div class="seg" id="heCat">${Object.entries(HCAT).map(([k, [ic, nm]]) => `<button data-hc="${k}" aria-pressed="${h.cat === k}">${ic} ${nm}</button>`).join("")}</div>
    <label for="heT">Título</label><input type="text" id="heT" maxlength="80" value="${esc(h.t)}" placeholder="${h.cat === "mapa" ? "Ex.: Mapa do Reino" : "Ex.: Carta do barão"}">
    <label>Imagem (opcional para notas)</label>
    <div class="heimg">${h.url ? `<img src="${esc(h.url)}" alt="">` : `<span>Arraste uma imagem aqui ou escolha um arquivo</span>`}</div>
    <div class="acts"><label class="btn small" style="margin:0">Arquivo…<input type="file" id="heFile" accept="image/*" hidden></label><input type="url" id="heUrl" placeholder="ou cole um link" value="${esc(h.url || "")}" style="flex:1">${h.url ? `<button class="btn small" id="heNoImg">Tirar</button>` : ""}</div>
    <label for="heB">Texto</label><textarea id="heB" rows="7" placeholder="Anotações, descrição, carta, pista…">${esc(h.body || "")}</textarea>
    <label class="chk" style="margin-top:10px"><input type="checkbox" id="heVis" ${h.vis ? "checked" : ""}> Jogadores podem ver no diário</label>
    <div class="acts foot">${isNew ? "" : `<button class="btn small danger" id="heDel">Apagar</button>`}<span class="spacer"></span><button class="btn" id="heCancel">Cancelar</button><button class="btn primary" id="heSave">Salvar</button></div></div>`;
  const back = () => openHandPanel();
  $("#pClose").onclick = $("#heCancel").onclick = back;
  const keep = () => { h.t = $("#heT").value; h.body = $("#heB").value; h.url = $("#heUrl").value.trim(); h.vis = $("#heVis").checked; };
  $("#heCat").onclick = e => { const b = e.target.closest("[data-hc]"); if (b) { keep(); h.cat = b.dataset.hc; handEditor(h); } };
  const up = async f => { if (!f || !f.type.startsWith("image/")) return; keep(); toast("Enviando…"); try { h.url = await uploadImage(f, "handouts"); if (!h.t) h.t = f.name.replace(/\.\w+$/, "").slice(0, 80); handEditor(h); toast("Imagem pronta."); } catch (err) { toast("Não enviei: " + err.message); } };
  $("#heFile").onchange = e => up(e.target.files[0]);
  const zone = $(".heimg"); zone.ondragover = e => { e.preventDefault(); zone.classList.add("over"); }; zone.ondragleave = () => zone.classList.remove("over"); zone.ondrop = e => { e.preventDefault(); zone.classList.remove("over"); up([...e.dataTransfer.files][0]); };
  if ($("#heNoImg")) $("#heNoImg").onclick = () => { keep(); h.url = ""; handEditor(h); };
  $("#heUrl").onchange = () => { keep(); setTimeout(() => handEditor(h), 0); };
  $("#heSave").onclick = async () => { keep(); if (!h.t && !h.body && !h.url) return toast("Escreva algo ou coloque uma imagem."); h.at = Date.now(); hand = (hand || []).filter(x => x.id !== h.id).concat([h]); await handSave(); back(); };
  if ($("#heDel")) $("#heDel").onclick = async () => { if (!confirm("Apagar este item?")) return; hand = hand.filter(x => x.id !== h.id); await handSave(); back(); };
}
function showHandout(h, pushed){ // janela grande: imagem com zoom e texto
  const ov = document.createElement("div"); ov.className = "hview" + (pushed ? " pushed" : "");
  ov.innerHTML = `<div class="hvbox" role="dialog" aria-label="${esc(h.t || "Mensagem")}">
    <div class="hvhead"><b>${pushed ? "📢 " : ""}${esc(h.t || "Mensagem do mestre")}</b><span class="spacer"></span>${h.url ? `<button class="btn small" data-z="-1">－</button><button class="btn small" data-z="0">Ajustar</button><button class="btn small" data-z="1">＋</button><a class="btn small" href="${esc(h.url)}" target="_blank" rel="noopener">Abrir</a>` : ""}<button class="btn small primary" data-close>Fechar</button></div>
    ${h.url ? `<div class="hvimg"><img src="${esc(h.url)}" alt="" draggable="false"></div>` : ""}
    ${h.body ? `<div class="hvtxt">${esc(h.body).replace(/\n/g, "<br>")}</div>` : ""}</div>`;
  document.body.appendChild(ov);
  const close = () => ov.remove();
  ov.addEventListener("click", e => { if (e.target === ov || e.target.closest("[data-close]")) close(); });
  const onKey = e => { if (e.key === "Escape") { close(); removeEventListener("keydown", onKey, true); e.stopPropagation(); } }; addEventListener("keydown", onKey, true);
  const box = $(".hvimg", ov), img = box && $("img", box);
  if (img) { // zoom com a roda e arrastar para mover
    let z = 1, x = 0, y = 0, dr = null; const ap = () => img.style.transform = `translate(${x}px,${y}px) scale(${z})`;
    box.onwheel = e => { e.preventDefault(); z = Math.max(.3, Math.min(8, z * (e.deltaY < 0 ? 1.15 : 1 / 1.15))); ap(); };
    box.onpointerdown = e => { dr = [e.clientX - x, e.clientY - y]; box.setPointerCapture(e.pointerId); };
    box.onpointermove = e => { if (dr) { x = e.clientX - dr[0]; y = e.clientY - dr[1]; ap(); } };
    box.onpointerup = () => dr = null;
    ov.querySelectorAll("[data-z]").forEach(b => b.onclick = () => { const k = +b.dataset.z; if (!k) { z = 1; x = y = 0; } else z = Math.max(.3, Math.min(8, z * (k > 0 ? 1.3 : 1 / 1.3))); ap(); });
  }
  if (pushed && DS.init()) { const t = DS.ctx.currentTime; DS.tone(t, 660, .25, .12, "sine"); DS.tone(t + .12, 990, .35, .1, "sine"); }
}

// ---------- voz (WebRTC entre todos, sinalização pelo Supabase) + modulador de voz do mestre ----------
const VOICE = {on: false, ch: null, ctx: null, mic: null, src: null, out: null, outTrack: null, chain: [], preset: "normal", monitor: null, muted: false, whisper: "*",
  peers: {}, // key -> {pc, sender, name, gm, audio, an, level, vol, polite, queue: []}
  meta: {}, level: 0, an: null, meter: null};
const ICE = [{urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"]}];
const VPRESETS = [
  ["normal", "🙂 Normal"], ["monstro", "👹 Monstro"], ["gigante", "🗿 Gigante"], ["demonio", "😈 Demônio"], ["goblin", "👺 Goblin"],
  ["fada", "🧚 Fada"], ["fantasma", "👻 Fantasma"], ["caverna", "⛰ Caverna"], ["robo", "🤖 Golem"], ["radio", "📜 Rádio / Carta"], ["sussurro", "🌫 Sussurro"],
];
const speakSet = new Set();
const PS_CODE = `class PS extends AudioWorkletProcessor{static get parameterDescriptors(){return[{name:"ratio",defaultValue:1,minValue:.25,maxValue:4}]}
constructor(){super();this.N=8192;this.b=new Float32Array(this.N);this.w=0;this.r=0;this.W=2048}
process(i,o,p){const x=i[0]&&i[0][0],y=o[0][0];if(!y)return true;if(!x){y.fill(0);return true}const R=p.ratio[0],N=this.N,W=this.W,b=this.b;
const tap=d=>{let q=this.w-d;if(q<0)q+=N;const i0=Math.floor(q),f=q-i0;return b[i0%N]+(b[(i0+1)%N]-b[i0%N])*f};
for(let k=0;k<x.length;k++){b[this.w]=x[k];this.r+=1-R;if(this.r>=W)this.r-=W;if(this.r<0)this.r+=W;const d1=this.r,d2=(this.r+W/2)%W,g1=Math.sin(Math.PI*d1/W),g2=Math.sin(Math.PI*d2/W);y[k]=tap(d1)*g1*g1+tap(d2)*g2*g2;this.w=(this.w+1)%N}
for(let c=1;c<o[0].length;c++)o[0][c].set(y);return true}}registerProcessor("pitch-shift",PS);`;
function vImpulse(ctx, sec, decay){ const n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, n, ctx.sampleRate); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay); } return b; }
function vShaper(ctx, amt){ const s = ctx.createWaveShaper(), n = 1024, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / n * 2 - 1; c[i] = (1 + amt) * x / (1 + amt * Math.abs(x)); } s.curve = c; s.oversample = "2x"; return s; }
function vBuild(){ // monta a cadeia de efeitos entre o microfone e a saída
  const c = VOICE.ctx; if (!c || !VOICE.src) return;
  try { VOICE.src.disconnect(); } catch {} for (const n of VOICE.chain) { try { n.disconnect(); } catch {} try { n.stop?.(); } catch {} } VOICE.chain = [];
  const keep = n => (VOICE.chain.push(n), n), P = VOICE.preset, out = VOICE.out;
  let head = VOICE.src;
  const pitch = r => { if (!VOICE.psOk) return; const n = keep(new AudioWorkletNode(c, "pitch-shift")); n.parameters.get("ratio").value = r; head.connect(n); head = n; };
  const filt = (type, f, q = .7, g = 0) => { const n = keep(c.createBiquadFilter()); n.type = type; n.frequency.value = f; n.Q.value = q; n.gain.value = g; head.connect(n); head = n; };
  const drive = a => { const n = keep(vShaper(c, a)); head.connect(n); head = n; };
  const gain = v => { const n = keep(c.createGain()); n.gain.value = v; head.connect(n); head = n; };
  const wet = (node, mix) => { const dry = keep(c.createGain()), w = keep(c.createGain()), sum = keep(c.createGain()); dry.gain.value = 1 - mix * .5; w.gain.value = mix; head.connect(dry); head.connect(node); node.connect(w); dry.connect(sum); w.connect(sum); head = sum; };
  const reverb = (sec, dec, mix) => { const cv = keep(c.createConvolver()); cv.buffer = vImpulse(c, sec, dec); wet(cv, mix); };
  const echo = (t, fb, mix) => { const d = keep(c.createDelay(2)), g = keep(c.createGain()); d.delayTime.value = t; g.gain.value = fb; d.connect(g); g.connect(d); wet(d, mix); };
  if (P === "monstro") { pitch(.72); filt("lowshelf", 200, .7, 7); drive(3); reverb(.8, 3, .25); gain(.9); }
  else if (P === "gigante") { pitch(.6); filt("lowshelf", 160, .7, 8); reverb(1.8, 2.5, .45); }
  else if (P === "demonio") { const split = head; pitch(.62); const low = head; head = split; pitch(.8); const mid = head; const m = keep(c.createGain()); low.connect(m); mid.connect(m); head = m; drive(5); filt("lowshelf", 180, .7, 6); reverb(1.2, 2, .35); gain(.7); }
  else if (P === "goblin") { pitch(1.45); filt("highpass", 250); drive(1.5); }
  else if (P === "fada") { pitch(1.75); filt("highpass", 400); echo(.18, .35, .35); reverb(1.2, 3, .3); }
  else if (P === "fantasma") { pitch(.92); filt("highpass", 300); echo(.32, .5, .5); reverb(3, 2, .6);
    const lfo = keep(c.createOscillator()), lg = keep(c.createGain()), tr = keep(c.createGain()); lfo.frequency.value = 5; lg.gain.value = .35; tr.gain.value = .65; lfo.connect(lg); lg.connect(tr.gain); lfo.start(); head.connect(tr); head = tr; }
  else if (P === "caverna") { reverb(2.5, 1.8, .55); echo(.45, .3, .25); }
  else if (P === "robo") { const ring = keep(c.createGain()), osc = keep(c.createOscillator()); ring.gain.value = 0; osc.frequency.value = 55; osc.type = "square"; osc.connect(ring.gain); osc.start(); head.connect(ring); head = ring; filt("bandpass", 1200, .6); drive(2); gain(1.6); }
  else if (P === "radio") { filt("highpass", 500); filt("lowpass", 2800); filt("peaking", 1500, 1, 6); drive(4); gain(.7); }
  else if (P === "sussurro") { filt("highpass", 900); filt("peaking", 3500, 1, 6); reverb(.6, 3, .2); gain(1.3); }
  head.connect(out);
  if (VOICE.monitor) { head.connect(VOICE.monitor); }
}
function vSendSig(to, data){ VOICE.ch?.send({type: "broadcast", event: "sig", payload: {to, from: myKey, ...data}}); }
function vPeer(key, initiator){
  if (VOICE.peers[key]) return VOICE.peers[key];
  const pc = new RTCPeerConnection({iceServers: ICE}), P = {pc, key, queue: [], vol: 1, level: 0, polite: myKey > key, making: false};
  VOICE.peers[key] = P;
  P.sender = pc.addTrack(VOICE.outTrack, new MediaStream([VOICE.outTrack]));
  vApplyWhisper();
  pc.onicecandidate = e => { if (e.candidate) vSendSig(key, {ice: e.candidate.toJSON()}); };
  pc.onnegotiationneeded = async () => { try { P.making = true; await pc.setLocalDescription(); vSendSig(key, {sdp: pc.localDescription.toJSON()}); } catch {} finally { P.making = false; } };
  pc.ontrack = e => {
    const st = e.streams[0] || new MediaStream([e.track]);
    if (!P.audio) { P.audio = new Audio(); P.audio.autoplay = true; P.audio.volume = P.vol; document.body.appendChild(P.audio); P.audio.style.display = "none"; }
    P.audio.srcObject = st; P.audio.play().catch(() => {});
    try { const s = VOICE.ctx.createMediaStreamSource(st); P.an = VOICE.ctx.createAnalyser(); P.an.fftSize = 512; s.connect(P.an); } catch {}
  };
  pc.onconnectionstatechange = () => { if (pc.connectionState === "failed") { try { pc.restartIce(); } catch {} } vDraw(); };
  return P;
}
async function vOnSig(p){
  if (!VOICE.on || p.to !== myKey) return;
  const P = vPeer(p.from, false), pc = P.pc;
  try {
    if (p.sdp) {
      const collision = p.sdp.type === "offer" && (P.making || pc.signalingState !== "stable");
      if (collision && !P.polite) return;
      await pc.setRemoteDescription(p.sdp);
      for (const c of P.queue.splice(0)) { try { await pc.addIceCandidate(c); } catch {} }
      if (p.sdp.type === "offer") { await pc.setLocalDescription(); vSendSig(p.from, {sdp: pc.localDescription.toJSON()}); }
    } else if (p.ice) { if (pc.remoteDescription) await pc.addIceCandidate(p.ice); else P.queue.push(p.ice); }
  } catch (err) { console.warn("voz:", err); }
}
function vApplyWhisper(){ // mestre sussurrando para um só: os outros não recebem a voz
  for (const [k, P] of Object.entries(VOICE.peers)) { const to = VOICE.whisper, ok = to === "*" || to === k; try { P.sender?.replaceTrack(ok && !VOICE.muted ? VOICE.outTrack : null); } catch {} }
}
async function voiceJoin(){
  if (VOICE.on) return;
  if (!navigator.mediaDevices?.getUserMedia) return toast("Este navegador não permite microfone aqui.");
  try { VOICE.mic = await navigator.mediaDevices.getUserMedia({audio: {echoCancellation: true, noiseSuppression: true, autoGainControl: true}}); }
  catch (err) { return toast("Não consegui usar o microfone: " + (err.name === "NotAllowedError" ? "permissão negada (clique no cadeado ao lado do endereço)" : err.message)); }
  const c = VOICE.ctx = new (window.AudioContext || window.webkitAudioContext)();
  try { await c.audioWorklet.addModule(URL.createObjectURL(new Blob([PS_CODE], {type: "application/javascript"}))); VOICE.psOk = true; } catch { VOICE.psOk = false; }
  VOICE.src = c.createMediaStreamSource(VOICE.mic); VOICE.out = c.createMediaStreamDestination(); VOICE.outTrack = VOICE.out.stream.getAudioTracks()[0];
  VOICE.an = c.createAnalyser(); VOICE.an.fftSize = 512; const tap = c.createMediaStreamSource(VOICE.out.stream); tap.connect(VOICE.an);
  vBuild(); VOICE.on = true; VOICE.muted = false;
  const ch = VOICE.ch = sb.channel("voz", {config: {broadcast: {self: false}, presence: {key: myKey}}});
  ch.on("broadcast", {event: "sig"}, ({payload}) => vOnSig(payload));
  ch.on("broadcast", {event: "whisper"}, ({payload: p}) => { if (p?.to === myKey) { vWhisperBadge(p.on); } });
  ch.on("presence", {event: "sync"}, () => {
    const st = ch.presenceState(); VOICE.meta = {};
    for (const [k, arr] of Object.entries(st)) VOICE.meta[k] = arr[0] || {};
    for (const k of Object.keys(VOICE.meta)) if (k !== myKey && !VOICE.peers[k] && myKey < k) vPeer(k, true);
    for (const k of Object.keys(VOICE.peers)) if (!VOICE.meta[k]) vDrop(k);
    vDraw();
  });
  ch.subscribe(s => { if (s === "SUBSCRIBED") ch.track({n: isGM ? "Mestre" : (myNick || "Jogador"), gm: isGM}); });
  clearInterval(VOICE.meter); VOICE.meter = setInterval(vMeter, 120);
  vDraw(); toast("Você entrou na voz. Use fone de ouvido para não dar eco.", 3500);
}
function vDrop(k){ const P = VOICE.peers[k]; if (!P) return; try { P.pc.close(); } catch {} P.audio?.remove(); delete VOICE.peers[k]; }
function voiceLeave(){
  if (!VOICE.on) return; for (const k of Object.keys(VOICE.peers)) vDrop(k);
  try { VOICE.ch?.unsubscribe(); } catch {} VOICE.ch = null; clearInterval(VOICE.meter);
  VOICE.mic?.getTracks().forEach(t => t.stop()); try { VOICE.ctx?.close(); } catch {}
  Object.assign(VOICE, {on: false, ctx: null, mic: null, src: null, out: null, outTrack: null, chain: [], monitor: null, meta: {}, whisper: "*"}); speakSet.clear(); dirty = true; vDraw();
}
const vRms = an => { if (!an) return 0; const a = new Uint8Array(an.fftSize); an.getByteTimeDomainData(a); let s = 0; for (const v of a) { const x = (v - 128) / 128; s += x * x; } return Math.sqrt(s / a.length); };
function vMeter(){ // quem está falando (acende na lista e no token)
  const was = [...speakSet].join("|"); speakSet.clear();
  VOICE.level = VOICE.muted ? 0 : vRms(VOICE.an); if (VOICE.level > .035) speakSet.add((isGM ? "mestre" : (myNick || "")).toLowerCase());
  for (const [k, P] of Object.entries(VOICE.peers)) { P.level = vRms(P.an); if (P.level > .03) speakSet.add(String(VOICE.meta[k]?.n || "").toLowerCase()); }
  document.querySelectorAll("[data-vk]").forEach(el => { const k = el.dataset.vk, lv = k === myKey ? VOICE.level : VOICE.peers[k]?.level || 0; el.classList.toggle("talk", lv > .03); });
  if ([...speakSet].join("|") !== was) dirty = true;
}
function vWhisperBadge(on){ let b = $("#vWhisper"); if (!on) { b?.remove(); return; } if (!b) { b = document.createElement("div"); b.id = "vWhisper"; b.className = "vwhisper"; b.textContent = "🤫 O mestre está sussurrando só para você"; document.body.appendChild(b); } }
let vOpen = true;
function vDraw(){
  let el = $("#voiceDock"); if (!el) { el = document.createElement("div"); el.id = "voiceDock"; el.className = "vdock"; document.body.appendChild(el); }
  if (!VOICE.on) { el.innerHTML = `<button class="btn vjoin" id="vJoin" title="Conversar por voz com a mesa">🎙 Entrar na voz</button>`; $("#vJoin").onclick = voiceJoin; return; }
  const people = Object.entries(VOICE.meta).sort((a, b) => (b[1].gm ? 1 : 0) - (a[1].gm ? 1 : 0));
  const st = k => { const s = VOICE.peers[k]?.pc.connectionState; return k === myKey ? "" : s === "connected" ? "" : s === "failed" ? " · sem conexão" : " · conectando…"; };
  el.innerHTML = `<div class="vhead"><button class="vtog" id="vTog">🎙 Voz <small>${people.length}</small> ${vOpen ? "▾" : "▸"}</button>
      <button class="btn small ${VOICE.muted ? "danger" : ""}" id="vMute" title="Microfone">${VOICE.muted ? "🔇 Mudo" : "🎤 Ligado"}</button><button class="btn small" id="vLeave" title="Sair da voz">Sair</button></div>
    ${vOpen ? `<div class="vlist">${people.map(([k, m]) => `<div class="vp" data-vk="${esc(k)}"><span class="vdot"></span><b>${esc(m.n || "?")}${m.gm ? " 👑" : ""}</b><small>${k === myKey ? "você" : ""}${st(k)}</small>${k !== myKey ? `<input type="range" min="0" max="1" step="0.05" value="${VOICE.peers[k]?.vol ?? 1}" data-vvol="${esc(k)}" title="Volume de ${esc(m.n || "")}">` : ""}</div>`).join("")}</div>
    ${isGM ? `<div class="vmod"><div class="lbl">Modulador de voz</div><div class="vpre">${VPRESETS.map(([k, l]) => `<button data-vp="${k}" aria-pressed="${VOICE.preset === k}">${l}</button>`).join("")}</div>
      ${VOICE.psOk ? "" : `<p class="hint">Este navegador não deixou mudar o tom; os outros efeitos funcionam.</p>`}
      <label class="chk"><input type="checkbox" id="vMon" ${VOICE.monitor ? "checked" : ""}> Ouvir minha voz (use fone)</label>
      <div class="lbl" style="margin-top:6px">Falar para</div><select id="vTo"><option value="*">Todos</option>${people.filter(([k]) => k !== myKey).map(([k, m]) => `<option value="${esc(k)}" ${VOICE.whisper === k ? "selected" : ""}>🤫 Só ${esc(m.n || "?")}</option>`).join("")}</select></div>` : ""}` : ""}`;
  $("#vTog").onclick = () => { vOpen = !vOpen; vDraw(); };
  $("#vMute").onclick = () => { VOICE.muted = !VOICE.muted; vApplyWhisper(); vDraw(); };
  $("#vLeave").onclick = voiceLeave;
  el.querySelectorAll("[data-vvol]").forEach(r => r.oninput = () => { const P = VOICE.peers[r.dataset.vvol]; if (P) { P.vol = +r.value; if (P.audio) P.audio.volume = P.vol; } });
  el.querySelectorAll("[data-vp]").forEach(b => b.onclick = () => { VOICE.preset = b.dataset.vp; vBuild(); vDraw(); });
  const mon = $("#vMon"); if (mon) mon.onchange = () => { if (mon.checked) { VOICE.monitor = VOICE.ctx.createGain(); VOICE.monitor.gain.value = .9; VOICE.monitor.connect(VOICE.ctx.destination); } else { try { VOICE.monitor?.disconnect(); } catch {} VOICE.monitor = null; } vBuild(); };
  const to = $("#vTo"); if (to) to.onchange = () => { const old = VOICE.whisper; VOICE.whisper = to.value; vApplyWhisper();
    if (old !== "*") VOICE.ch?.send({type: "broadcast", event: "whisper", payload: {to: old, on: false}});
    if (VOICE.whisper !== "*") VOICE.ch?.send({type: "broadcast", event: "whisper", payload: {to: VOICE.whisper, on: true}}); };
}
addEventListener("beforeunload", () => { if (VOICE.on) voiceLeave(); });

// ---------- iniciativa e turnos (barra de retratos estilo Baldur's Gate) ----------
// scene.init = {on, round, cur, list: [{id, tk, n, f, v, hid}]}
const INI = () => scene.init || (scene.init = {on: false, round: 1, cur: 0, list: []});
const iniTok = e => e.tk ? tokens.find(t => t.id === e.tk) : null;
const iniOwner = e => { const t = iniTok(e); return t?.o || ""; };
const iniMine = e => { const t = iniTok(e); return !!t && owns(t); };
function iniSort(){ const I = INI(), curId = I.list[I.cur]?.id; I.list.sort((a, b) => (b.v ?? -99) - (a.v ?? -99)); if (curId) I.cur = Math.max(0, I.list.findIndex(e => e.id === curId)); }
function iniMod(t){ // bônus de iniciativa: pega do nome da barra "Ini"/"Inic" se existir
  const b = (t?.b || []).find(x => /^ini/i.test(x.n || "")); return b ? (+b.v || 0) : 0;
}
function iniAdd(t){ const I = INI(); if (I.list.some(e => e.tk === t.id)) return false; const m = iniMod(t); I.list.push({id: uid(), tk: t.id, n: t.n || "Token", f: `1d20${m ? (m > 0 ? "+" : "") + m : ""}`, v: null, hid: !!t.h}); return true; }
function iniSave(){ save("scene"); drawTurnBar(); dirty = true; if (panelKind === "ini") openIniPanel(); }
const INI_GRAY = "#8a8a90";
function iniRoll(e){ // rola a iniciativa e devolve o que mostrar
  let r; try { r = rollFormula(e.f || "1d20"); } catch { r = rollFormula("1d20"); }
  e.v = r.total; const t = iniTok(e);
  return {n: e.n || "Criatura", col: t?.o ? (t.c || "#d0a54c") : INI_GRAY, hid: !!(e.hid || t?.h), f: r.f, dice: r.dice, mod: r.mod, total: r.total};
}
function iniShow(items){ // todos os dados de uma vez na tela (e no histórico)
  if (!items.length) return;
  const pub = items.filter(x => !x.hid);
  if (pub.length) send("inistage", {items: pub});
  iniStage(items);
}
function iniStage(items){
  $("#iniStage")?.remove();
  const st = document.createElement("div"); st.id = "iniStage"; st.className = "inistage"; st.setAttribute("role", "dialog"); st.setAttribute("aria-label", "Rolagem de iniciativa");
  st.innerHTML = `<div class="is-card"><div class="is-title">⚔️ Iniciativa</div>
    <div class="is-row">${items.map((x, i) => `<div class="is-one ${x.hid ? "hid" : ""}" style="--i:${i}">${x.dice.filter(d => !d.x).slice(0, 2).map(d => dieEl(d.d, "?", "huge rolling", x.col)).join("")}<b class="is-tot"></b><span class="is-n">${esc(x.n)}${x.hid ? " 🚫" : ""}</span></div>`).join("")}</div>
    <div class="ds-hint"></div></div>`;
  document.body.appendChild(st);
  const ones = [...st.querySelectorAll(".is-one")], t0 = performance.now(), land = items.map((_, i) => 900 + i * 170), end = Math.max(...land) + 200;
  DS.rattle(Math.min(8, items.length * 2)); let landed = 0;
  const tick = now => {
    if (!st.isConnected) return; const el = now - t0;
    ones.forEach((o, i) => { if (o.classList.contains("done")) return; const dice = [...o.querySelectorAll(".die")], x = items[i], real = x.dice.filter(d => !d.x);
      if (el >= land[i]) { o.classList.add("done"); dice.forEach((d, k) => { d.classList.remove("rolling"); d.classList.add("landed"); d.querySelector(".die-n").textContent = real[k]?.v ?? "?"; if (real[k]?.d === 20 && real[k].v === 20) d.classList.add("c20"); if (real[k]?.d === 20 && real[k].v === 1) d.classList.add("c1"); }); o.querySelector(".is-tot").textContent = x.total; DS.land(); landed++; }
      else dice.forEach(d => { d.querySelector(".die-n").textContent = 1 + Math.floor(Math.random() * 20); }); });
    if (el < end) return requestAnimationFrame(tick);
    DS.reveal(); st.querySelector(".ds-hint").textContent = "clique para fechar";
    for (const x of items) if (isGM || !x.hid) diceLog.push({id: uid(), who: x.n, label: "Iniciativa", f: x.f, dice: x.dice, mod: x.mod, total: x.total, col: x.col, fresh: false, secret: x.hid});
    while (diceLog.length > 50) diceLog.shift(); drawDiceLog(true);
    setTimeout(close, 3200);
  };
  requestAnimationFrame(tick);
  const close = () => { if (!st.isConnected) return; st.classList.add("out"); setTimeout(() => st.remove(), 300); };
  st.onclick = () => { if (st.querySelector(".ds-hint").textContent) close(); };
}
function iniGo(step){ // próximo / anterior turno
  const I = INI(); if (!I.list.length) return;
  I.cur += step;
  if (I.cur >= I.list.length) { I.cur = 0; I.round++; toast(`⚔️ Rodada ${I.round}`, 1600); }
  if (I.cur < 0) { I.cur = I.list.length - 1; I.round = Math.max(1, I.round - 1); }
  const t = iniTok(I.list[I.cur]); if (t && t.tr?.length) { t.tr = []; save("tokens"); }   // rastro do novo turno começa limpo
  iniSave();
}
function openIniPanel(){
  panelKind = "ini"; const I = INI();
  const row = (e, i) => { const t = iniTok(e); return `<div class="irow ${I.on && i === I.cur ? "cur" : ""} ${e.hid ? "hid" : ""}" data-ii="${i}" draggable="true">
      <span class="iport" style="--pc:${esc(t?.c || "#6b5a44")}">${t?.img ? `<img src="${esc(t.img)}" alt="">` : esc((e.n || "?").slice(0, 2).toUpperCase())}</span>
      <input class="in" data-in="${i}" value="${esc(e.n)}" maxlength="24" aria-label="Nome">
      <input class="if" data-if="${i}" value="${esc(e.f)}" maxlength="20" aria-label="Fórmula" title="Fórmula da iniciativa">
      <input class="iv" data-iv="${i}" value="${e.v ?? ""}" inputmode="numeric" aria-label="Iniciativa" title="Iniciativa">
      <button class="btn small ic" data-ir="${i}" title="Rolar esta">🎲</button>
      <button class="btn small ic" data-ih="${i}" title="${e.hid ? "Oculto dos jogadores" : "Jogadores veem"}">${e.hid ? "🚫" : "👁"}</button>
      <button class="btn small ic danger" data-ix="${i}" title="Tirar do combate">✕</button></div>`; };
  $("#panel").innerHTML = `<div class="panel ini-panel" role="dialog" aria-label="Iniciativa"><h3>Iniciativa ${I.on ? `<small class="iround">Rodada ${I.round}</small>` : ""}<button class="btn small" id="pClose">Fechar</button></h3>
    <div class="acts"><button class="btn small" id="iAddAll" title="Todos os personagens e criaturas do mapa (não os objetos)">＋ Tokens do mapa</button><button class="btn small" id="iAddSel" title="O token selecionado no mapa">＋ Selecionado</button><button class="btn small" id="iAddNew">＋ Manual</button></div>
    <div class="ihead"><span></span><span>Nome</span><span>Teste</span><span>Init</span></div>
    <div class="ilist" id="iList">${I.list.map(row).join("") || `<p class="hint">Ninguém no combate ainda. Adicione tokens acima.</p>`}</div>
    <div class="acts"><button class="btn small" id="iRollAll">🎲 Rolar todos</button><button class="btn small" id="iAsk" title="Os jogadores rolam a iniciativa dos próprios personagens">📣 Pedir aos jogadores</button><button class="btn small" id="iSort">↕ Ordenar</button><span class="spacer"></span><button class="btn small danger" id="iClear">Limpar</button></div>
    <div class="acts foot">${I.on ? `<button class="btn" id="iPrev">⏮</button><button class="btn primary" id="iNext">Próximo turno ⏭</button><span class="spacer"></span><button class="btn danger" id="iEnd">Encerrar combate</button>` : `<span class="spacer"></span><button class="btn primary" id="iStart" ${I.list.length ? "" : "disabled"}>⚔️ Começar combate</button>`}</div>
    <p class="hint">Arraste as linhas para mudar a ordem. 🚫 esconde da barra dos jogadores (monstros surpresa). O bônus vem da barra “Ini” do token, se existir. No combate, os jogadores veem a barra de retratos no topo e recebem “Seu turno!”.</p></div>`;
  const P = $("#panel"); $("#pClose").onclick = closePanel;
  $("#iAddAll").onclick = () => { let n = 0; for (const t of tokens) if (!isProp(t) && iniAdd(t)) n++; if (!n) toast("Todos os tokens do mapa já estão no combate."); iniSave(); };
  $("#iAddSel").onclick = () => { const t = tokens.find(x => x.id === selTok && !isProp(x)); if (!t) return toast("Selecione um token no mapa primeiro."); if (!iniAdd(t)) toast("Ele já está no combate."); iniSave(); };
  $("#iAddNew").onclick = () => { INI().list.push({id: uid(), tk: null, n: "Criatura", f: "1d20", v: null, hid: false}); iniSave(); };
  $("#iRollAll").onclick = () => { const shown = []; for (const e of INI().list) if (e.v == null || !I.on) shown.push(iniRoll(e)); iniShow(shown); iniSort(); iniSave(); };
  $("#iSort").onclick = () => { iniSort(); iniSave(); };
  $("#iClear").onclick = () => { if (confirm("Tirar todo mundo da lista de iniciativa?")) { scene.init = {on: false, round: 1, cur: 0, list: []}; iniSave(); } };
  $("#iAsk").onclick = () => { const L = I.list.filter(e => iniOwner(e)).map(e => ({id: e.id, n: e.n, f: e.f, o: iniOwner(e)})); if (!L.length) return toast("Nenhum token de jogador na lista (dê um dono ao token)."); send("iniask", {list: L}); toast("Pedido enviado: os jogadores vão rolar."); };
  if ($("#iStart")) $("#iStart").onclick = () => { const shown = []; for (const e of I.list) if (e.v == null) shown.push(iniRoll(e)); iniShow(shown); iniSort(); Object.assign(I, {on: true, round: 1, cur: 0, go: Date.now()}); iniSave(); };
  if ($("#iNext")) $("#iNext").onclick = () => iniGo(1);
  if ($("#iPrev")) $("#iPrev").onclick = () => iniGo(-1);
  if ($("#iEnd")) $("#iEnd").onclick = () => { I.on = false; iniSave(); toast("Combate encerrado."); };
  P.oninput = e => { const d = e.target.dataset; const i = +(d.in ?? d.if ?? d.iv); if (isNaN(i)) return; const en = I.list[i];
    if (d.in != null) en.n = e.target.value; else if (d.if != null) en.f = e.target.value; else { const v = e.target.value.trim(); en.v = v === "" ? null : +v || 0; }
    clearTimeout(P._t); P._t = setTimeout(() => { save("scene", "merge"); drawTurnBar(); }, 400); };
  P.onkeydown = e => e.stopPropagation();
  P.onclick = e => { const b = e.target.closest("button"); if (!b) return; const d = b.dataset;
    if (d.ir != null) { const en = I.list[+d.ir]; iniShow([iniRoll(en)]); iniSave(); }
    else if (d.ih != null) { const en = I.list[+d.ih]; en.hid = !en.hid; iniSave(); }
    else if (d.ix != null) { const i = +d.ix; I.list.splice(i, 1); if (I.cur >= I.list.length) I.cur = 0; else if (i < I.cur) I.cur--; iniSave(); } };
  // arrastar as linhas para reordenar
  let from = null;
  P.ondragstart = e => { const r = e.target.closest("[data-ii]"); if (!r) return; from = +r.dataset.ii; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/mesa-ini", String(from)); r.classList.add("dragging"); };
  P.ondragover = e => { const r = e.target.closest("[data-ii]"); if (from == null || !r) return; e.preventDefault(); P.querySelectorAll(".irow.over").forEach(x => x !== r && x.classList.remove("over")); r.classList.add("over"); };
  P.ondrop = e => { const r = e.target.closest("[data-ii]"); if (from == null || !r) return; e.preventDefault(); const to = +r.dataset.ii, curId = I.list[I.cur]?.id, [m] = I.list.splice(from, 1); I.list.splice(to, 0, m); I.cur = Math.max(0, I.list.findIndex(x => x.id === curId)); from = null; iniSave(); };
  P.ondragend = () => { from = null; P.querySelectorAll(".dragging,.over").forEach(x => x.classList.remove("dragging", "over")); };
}
let lastTurnKey = "";
function drawTurnBar(){
  const I = scene.init; let el = $("#turnBar");
  if (!I?.on || !I.list?.length) { el?.remove(); lastTurnKey = ""; return; }
  let intro = false;
  if (!el) { el = document.createElement("div"); el.id = "turnBar"; el.className = "turnbar"; document.body.appendChild(el); intro = true; }
  if (I.go && I.go !== el._go) { el._go = I.go; intro = intro || Date.now() - I.go < 20000; }
  const vis = I.list.map((e, i) => ({e, i})).filter(x => isGM || !x.e.hid), cur = I.list[I.cur];
  const curVis = isGM || !cur?.hid;
  el.innerHTML = `<div class="tb-round">Rodada <b>${I.round}</b></div>
    ${isGM ? `<button class="tb-nav" id="tbPrev" title="Turno anterior">◀</button>` : ""}
    <div class="tb-list">${vis.map(({e, i}) => { const t = iniTok(e), on = i === I.cur; return `<button class="tb-p ${on ? "on" : ""} ${iniMine(e) ? "mine" : ""} ${e.hid ? "hid" : ""} ${!t && e.tk ? "gone" : ""}" data-tb="${i}" style="--pc:${esc(t?.c || "#6b5a44")}" title="${esc(e.n)}${e.v != null ? " · iniciativa " + e.v : ""}">
        <span class="tb-img">${t?.img ? `<img src="${esc(t.img)}" alt="">` : `<span>${esc((e.n || "?").slice(0, 2).toUpperCase())}</span>`}</span>
        ${isGM || t?.o ? (t?.b?.[0] ? `<span class="tb-hp"><i style="width:${Math.max(0, Math.min(100, (+t.b[0].v || 0) / Math.max(1, +t.b[0].m || 1) * 100))}%"></i></span>` : "") : ""}
        <span class="tb-n">${esc(e.n)}</span>${on ? `<span class="tb-arrow">▲</span>` : ""}</button>`; }).join("")}</div>
    ${isGM ? `<button class="tb-nav next" id="tbNext" title="Próximo turno">▶</button>` : cur && iniMine(cur) ? `<button class="btn small primary tb-end" id="tbEnd">✔ Terminar meu turno</button>` : ""}`;
  if (intro) { // cada personagem entra na barra na ordem da iniciativa
    el.classList.add("intro"); const ps = [...el.querySelectorAll(".tb-p")];
    ps.forEach((p, k) => { p.style.animationDelay = (0.35 + k * 0.28) + "s"; setTimeout(() => { if (DS.init()) DS.tone(DS.ctx.currentTime, 330 + k * 55, .12, .08, "triangle"); }, 350 + k * 280); });
    setTimeout(() => el.classList.remove("intro"), 900 + ps.length * 280);
  }
  if (isGM) { $("#tbPrev").onclick = () => iniGo(-1); $("#tbNext").onclick = () => iniGo(1); }
  const te = $("#tbEnd"); if (te) te.onclick = () => { send("endturn", {id: cur.id, who: myNick}); te.disabled = true; te.textContent = "…"; };
  el.querySelector(".tb-list").onclick = e => { const b = e.target.closest("[data-tb]"); if (!b) return; const t = iniTok(I.list[+b.dataset.tb]); if (t && (isGM || !t.h)) centerOn(t.x, t.y, Math.max(cam.z, .8)); if (isGM && e.detail === 2) openIniPanel(); };
  el.querySelector(".tb-list").ondblclick = () => { if (isGM) openIniPanel(); };
  // anúncio de troca de turno
  const key = I.round + ":" + (cur?.id || "");
  if (key !== lastTurnKey) {
    const first = !lastTurnKey; lastTurnKey = key;
    if (cur && curVis && !first) turnAnnounce(cur);
    else if (cur && curVis && first && iniMine(cur)) turnAnnounce(cur);
  }
}
function turnAnnounce(e){
  const mine = iniMine(e), b = document.createElement("div"); b.className = "turnann" + (mine ? " mine" : "");
  b.innerHTML = mine ? `⚔️ <b>Seu turno!</b> <span>${esc(e.n)}</span>` : `Turno de <b>${esc(e.n)}</b>`;
  document.body.appendChild(b); setTimeout(() => b.remove(), mine ? 2600 : 1700);
  if (DS.init()) { const t = DS.ctx.currentTime; if (mine) { DS.tone(t, 523, .18, .16, "triangle"); DS.tone(t + .12, 784, .3, .16, "triangle"); } else DS.tone(t, 440, .12, .07, "sine"); }
  const tk = iniTok(e); if (tk && mine) centerOn(tk.x, tk.y, Math.max(cam.z, .8));
}
function paintTurnRing(ts){ // o token da vez ganha um anel dourado no mapa
  const I = scene.init; if (!I?.on) return; const e = I.list?.[I.cur]; if (!e?.tk || (!isGM && e.hid)) return;
  const t = ts.find(x => x.id === e.tk); if (!t || (!isGM && t.h)) return;
  const r = tokR(t) + 7 / cam.z; ctx.save(); ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
  ctx.shadowColor = "#ffd76a"; ctx.shadowBlur = 14; ctx.strokeStyle = "#ffd76a"; ctx.lineWidth = 3.5 / cam.z; ctx.stroke(); ctx.shadowBlur = 0;
  ctx.setLineDash([6 / cam.z, 5 / cam.z]); ctx.beginPath(); ctx.arc(t.x, t.y, r + 5 / cam.z, 0, Math.PI * 2); ctx.strokeStyle = "rgba(255,215,106,.55)"; ctx.lineWidth = 1.5 / cam.z; ctx.stroke(); ctx.restore();
}
function iniAskPrompt(list){ // jogador: rolar a iniciativa dos seus personagens
  const mine = list.filter(e => String(e.o || "").toLowerCase() === String(myNick || "").toLowerCase() || e.o === "*"); if (!mine.length) return;
  let box = $("#iniAsk"); box?.remove(); box = document.createElement("div"); box.id = "iniAsk"; box.className = "iniask";
  box.innerHTML = `<b>⚔️ Role a iniciativa!</b>${mine.map(e => `<button class="btn primary" data-ia="${esc(e.id)}" data-f="${esc(e.f)}" data-n="${esc(e.n)}">🎲 ${esc(e.n)} <small>${esc(e.f)}</small></button>`).join("")}`;
  document.body.appendChild(box);
  if (DS.init()) DS.tone(DS.ctx.currentTime, 660, .2, .1, "sine");
  box.onclick = ev => { const b = ev.target.closest("[data-ia]"); if (!b) return;
    let r; try { r = rollFormula(b.dataset.f); } catch { r = rollFormula("1d20"); }
    const tk = tokens.find(t => owns(t) && (t.n || "") === b.dataset.n) || tokens.find(t => !isProp(t) && owns(t));
    const roll = {id: uid(), v: MAP_VER, who: b.dataset.n || myNick || "Jogador", label: "Iniciativa", ...r, secret: false, snd: null, col: tk?.c || "#d0a54c"}; send("roll", roll); addRoll(roll, true);
    send("inires", {id: b.dataset.ia, v: r.total, who: myNick}); b.remove(); if (!box.querySelector("[data-ia]")) box.remove(); };
}

// ---------- pings (Alt + clique) ----------
let pings = [];
const nameColor = n => { let h = 0; for (const ch of String(n)) h = (h * 31 + ch.charCodeAt(0)) % 360; return `hsl(${h} 75% 62%)`; };
function addPing(p){
  pings.push({x: +p.x, y: +p.y, who: String(p.who || "").slice(0, 30), c: String(p.c || "#ffe28a").slice(0, 30), t0: performance.now()});
  if (DS.init()) { const t = DS.ctx.currentTime; DS.tone(t, 1320, .18, .16, "sine"); DS.tone(t + .09, 1760, .28, .13, "sine"); }
  dirty = true;
}
function paintPings(){
  const now = performance.now(); pings = pings.filter(p => now - p.t0 < 2800);
  for (const p of pings) {
    const age = now - p.t0, R = 46 / cam.z;
    ctx.save();
    for (let k = 0; k < 3; k++) { const f = ((age / 900) + k / 3) % 1; ctx.beginPath(); ctx.arc(p.x, p.y, 6 / cam.z + f * R, 0, Math.PI * 2); ctx.strokeStyle = p.c; ctx.globalAlpha = (1 - f) * Math.max(0, 1 - age / 2800) * .95; ctx.lineWidth = 3 / cam.z; ctx.stroke(); }
    ctx.globalAlpha = Math.max(0, 1 - age / 2800); ctx.beginPath(); ctx.arc(p.x, p.y, 6 / cam.z, 0, Math.PI * 2); ctx.fillStyle = p.c; ctx.fill();
    if (p.who) label(p.x, p.y, p.who);
    ctx.restore();
  }
}
function doPing(wx, wy, center){
  const p = {x: Math.round(wx), y: Math.round(wy), who: isGM ? "Mestre" : (myNick || "Jogador"), c: isGM ? "#ffe28a" : nameColor(myNick), center: !!center};
  send("ping", p); addPing(p);
  if (center) toast("Todos foram levados até o ponto.");
}

// ---------- rastro dos movimentos ----------
let showTrails = false;
function pushTrail(t, pts){
  if (!pts || pts.length < 2) return;
  t.tr = [pts.map(([x, y]) => [Math.round(x), Math.round(y)])];   // guarda só o último movimento
}
function paintTrail(t){
  const tr = t.tr; if (!tr?.length) return;
  ctx.save(); ctx.lineCap = ctx.lineJoin = "round";
  tr.forEach((mv, k) => {
    const al = .25 + .6 * (k + 1) / tr.length;
    ctx.globalAlpha = al; ctx.beginPath(); mv.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.strokeStyle = "rgba(0,0,0,.5)"; ctx.lineWidth = 5 / cam.z; ctx.stroke(); ctx.strokeStyle = t.c || "#d0a54c"; ctx.lineWidth = 2.5 / cam.z; ctx.setLineDash([2 / cam.z, 6 / cam.z]); ctx.stroke(); ctx.setLineDash([]);
    mv.forEach(([x, y], i) => { if (!i) return; ctx.beginPath(); ctx.arc(x, y, 3 / cam.z, 0, Math.PI * 2); ctx.fillStyle = t.c || "#d0a54c"; ctx.fill(); });
    const [x0, y0] = mv[0]; ctx.beginPath(); ctx.arc(x0, y0, 5 / cam.z, 0, Math.PI * 2); ctx.strokeStyle = t.c || "#d0a54c"; ctx.lineWidth = 2 / cam.z; ctx.stroke();
  });
  ctx.restore();
}

// ---------- áreas de magia ----------
const SPELLS = [
  {n: "Bola de fogo", ic: "🔥", sh: "circle", r: 6, c: "#ff6a1f"},
  {n: "Cone de frio", ic: "❄️", sh: "cone", r: 18, c: "#7fd4ff"},
  {n: "Mãos flamejantes", ic: "🔥", sh: "cone", r: 4.5, c: "#ff8a2a"},
  {n: "Relâmpago", ic: "⚡", sh: "line", r: 30, wd: 1.5, c: "#ffe45c"},
  {n: "Nuvem fétida", ic: "☁️", sh: "circle", r: 6, c: "#9adf7a"},
  {n: "Escuridão", ic: "🌑", sh: "circle", r: 4.5, c: "#6a4aa8"},
  {n: "Teia", ic: "🕸️", sh: "square", r: 6, c: "#e8e2d0"},
  {n: "Muralha de fogo", ic: "🧱", sh: "line", r: 18, wd: 0.3, c: "#ff5a2a"},
  {n: "Luz / Aura", ic: "✨", sh: "circle", r: 9, c: "#fff2a8"},
  {n: "Terremoto", ic: "🌋", sh: "circle", r: 15, c: "#b0563d"},
  {n: "Onda trovejante", ic: "💥", sh: "square", r: 4.5, c: "#8fb0ff"},
  {n: "Veneno", ic: "☠️", sh: "circle", r: 3, c: "#5fbf4a"},
];
let spellSel = 0, spellCustom = null, ptpls = {};  // ptpls: magias temporárias dos jogadores (só ao vivo)
const curSpell = () => spellCustom || SPELLS[spellSel];
function tplShape(c, tp){
  const L = unitPx(tp.r), [vx, vy] = dirVec(tp.a || 0), px = -vy, py = vx;
  if (tp.sh === "circle") { c.moveTo(tp.x + L, tp.y); c.arc(tp.x, tp.y, L, 0, Math.PI * 2); }
  else if (tp.sh === "square") { const h = L / 2; const P = [[-h, -h], [h, -h], [h, h], [-h, h]].map(([u, v]) => [tp.x + u * px + v * -vx, tp.y + u * py + v * -vy]); P.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); }
  else if (tp.sh === "cone") { const h = L / 2; c.moveTo(tp.x, tp.y); c.lineTo(tp.x + vx * L + px * h, tp.y + vy * L + py * h); c.lineTo(tp.x + vx * L - px * h, tp.y + vy * L - py * h); c.closePath(); }
  else { const h = unitPx(tp.wd || 1.5) / 2; const P = [[tp.x + px * h, tp.y + py * h], [tp.x + vx * L + px * h, tp.y + vy * L + py * h], [tp.x + vx * L - px * h, tp.y + vy * L - py * h], [tp.x - px * h, tp.y - py * h]]; P.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); }
}
const hitCtx = document.createElement("canvas").getContext("2d");
function tplPath(tp){ const P = new Path2D(); tplShape(P, tp); return P; }
function inTpl(tp, x, y, P){ return hitCtx.isPointInPath(P || tplPath(tp), x, y); }
function tplCenter(tp){ if (tp.sh === "circle" || tp.sh === "square") return [tp.x, tp.y]; const [vx, vy] = dirVec(tp.a || 0), L = unitPx(tp.r); return [tp.x + vx * L * (tp.sh === "cone" ? .62 : .5), tp.y + vy * L * (tp.sh === "cone" ? .62 : .5)]; }
function tplHandle(tp){ const [vx, vy] = dirVec(tp.a || 0), L = unitPx(tp.r); return tp.sh === "circle" ? [tp.x + L, tp.y] : tp.sh === "square" ? [tp.x + vx * L * .5, tp.y + vy * L * .5] : [tp.x + vx * L, tp.y + vy * L]; }
function paintTpl(tp, sel){
  const L = unitPx(tp.r), n = Math.ceil(L / G().size) + 2, [ca, cb] = cellAt(...tplCenter(tp));
  ctx.save();
  const TP = tplPath(tp);
  ctx.beginPath(); for (const [a, b] of cellsInRange(ca, cb, n)) { const [x, y] = cellCenter(a, b); if (inTpl(tp, x, y, TP)) cellPath(ctx, a, b); }
  ctx.fillStyle = tp.c; ctx.globalAlpha = .16; ctx.fill(); ctx.globalAlpha = .45; ctx.strokeStyle = tp.c; ctx.lineWidth = 1 / cam.z; ctx.stroke();
  ctx.beginPath(); tplShape(ctx, tp);
  const [cx, cy] = tplCenter(tp), gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, L);
  gr.addColorStop(0, tp.c + "88"); gr.addColorStop(1, tp.c + "22");
  ctx.globalAlpha = 1; ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = tp.c; ctx.lineWidth = (sel ? 3.5 : 2.5) / cam.z; ctx.setLineDash(sel ? [8 / cam.z, 5 / cam.z] : []); ctx.stroke(); ctx.setLineDash([]);
  const fs = Math.max(13 / cam.z, Math.min(L * .35, 34)); ctx.textAlign = "center"; ctx.textBaseline = "middle";
  if (G().size * cam.z > 18) { ctx.font = `700 ${Math.max(11 / cam.z, fs * .38)}px "Alegreya Sans", sans-serif`; ctx.fillStyle = "#fff"; ctx.shadowColor = "#000"; ctx.shadowBlur = 4; ctx.fillText(`${tp.n} · ${String(tp.r).replace(".", ",")} ${G().unitName}`, cx, cy); ctx.shadowColor = "transparent"; }
  if (sel) { const [hx, hy] = tplHandle(tp); ctx.beginPath(); ctx.arc(hx, hy, 7 / cam.z, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill(); ctx.strokeStyle = "#000"; ctx.lineWidth = 1 / cam.z; ctx.stroke(); }
  ctx.restore();
}
let selTpl = null;   // {id, mine: bool (temporária do jogador) }
const allTpls = () => [...drawings.filter(d => d.t === "tpl").map(t => ({t, gm: true})), ...Object.values(ptpls).map(t => ({t, gm: false}))];
function canEditTpl(e){ return e.gm ? isGM : (e.t.own === myKey || isGM); }
function hitTpl(x, y){ const L = allTpls(); for (let i = L.length - 1; i >= 0; i--) if (canEditTpl(L[i]) && inTpl(L[i].t, x, y)) return L[i]; return null; }
function tplCommit(e){ if (e.gm) save("drawings"); else { ptpls[e.t.id] = e.t; send("tpl", {op: "set", t: e.t}); } dirty = true; drawTplBar(); }
function tplRemove(e){ if (e.gm) { drawings = drawings.filter(d => d.id !== e.t.id); save("drawings"); } else { delete ptpls[e.t.id]; send("tpl", {op: "del", id: e.t.id}); } selTpl = null; dirty = true; drawTplBar(); }
function curTpl(){ if (!selTpl) return null; const e = allTpls().find(x => x.t.id === selTpl); return e || null; }
function drawTplBar(){
  let el = $("#tplbar"); if (!el) { el = document.createElement("div"); el.id = "tplbar"; el.className = "selbar"; document.body.appendChild(el); }
  const e = curTpl(); if (!e) { el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = `<div class="sbrow"><b>${esc(e.t.ic || "")} ${esc(e.t.n)}</b><button class="btn small" data-tp="-">−</button><span>${String(e.t.r).replace(".", ",")} ${esc(G().unitName)}</span><button class="btn small" data-tp="+">+</button>
    ${e.gm || !isGM ? "" : `<button class="btn small" data-tp="keep" title="Guardar no mapa">Fixar</button>`}<button class="btn small danger" data-tp="del">Remover</button></div>`;
  el.onclick = ev => { const b = ev.target.closest("[data-tp]"); if (!b) return; const k = b.dataset.tp, cur = curTpl(); if (!cur) return;
    if (k === "del") return tplRemove(cur);
    if (k === "keep") { const t = {...cur.t}; delete t.own; delete ptpls[t.id]; send("tpl", {op: "del", id: t.id}); drawings.push(t); save("drawings"); dirty = true; return drawTplBar(); }
    const st = cur.t.r >= 9 ? 3 : 1.5; cur.t.r = Math.max(1.5, Math.round((cur.t.r + (k === "+" ? st : -st)) * 10) / 10); tplCommit(cur); };
}
function segsCross([ax, ay], [bx, by], [cx, cy, dx, dy]){
  const d1 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax), d2 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
  const d3 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx), d4 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
  return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0)) && d1 && d2 && d3 && d4;
}
// objetos sólidos: ninguém (jogador) atravessa. Tapetes, escadas, ossos, armadilhas etc. dão para pisar.
const WALKABLE = new Set(["tapete", "tapete-redondo", "pele-urso", "sangue", "agua-rasa", "flores", "moita", "trigo", "plantacao", "galhos", "nenufares", "escada", "escada-sobe", "escada-mao", "alcapao", "espinhos", "buraco", "grade-chao", "teia", "circulo-ritual", "ossos", "cranios", "esqueleto", "cogumelos", "cogumelos-brilho", "ponte", "saco-dormir", "velas", "ouro", "livros", "pergaminho", "espada", "escudo", "pocoes", "mapa-mesa", "tocha-parede", "estaca-cavalo", "mochila", "grilhoes", "tocha", "escombros"]);
const propId = t => String(t.img || "").split("/").pop().replace(/\.svg(\?.*)?$/, "");
const propSolid = t => isProp(t) && !t.h && (t.so != null ? !!t.so : !WALKABLE.has(propId(t)));
function solidAt(x, y){ // ponto dentro de algum objeto sólido?
  for (const t of tokens) {
    if (!propSolid(t)) continue;
    const [W, H] = propSize(t), [lx, ly] = propLocal(t, x, y);
    if (t.blk === "circle" ? Math.hypot(lx / (W / 2), ly / (H / 2)) <= .85 : Math.abs(lx) <= W / 2 * .92 && Math.abs(ly) <= H / 2 * .92) return t;
  }
  return null;
}
const cornerHit = (x1, y1, x2, y2, w) => { // o movimento passa bem em cima da ponta de uma parede (canto em L)?
  for (const [px, py] of [[w[0], w[1]], [w[2], w[3]]]) { if (Math.hypot(px - x1, py - y1) < 1 || Math.hypot(px - x2, py - y2) < 1) continue; if (distSeg(px, py, [x1, y1], [x2, y2]) < 1.5) return true; }
  return false;
};
const blockedMove = (x1, y1, x2, y2) => { if (blocking().some(w => segsCross([x1, y1], [x2, y2], w) || cornerHit(x1, y1, x2, y2, w))) return true; const s = solidAt(x2, y2); return !!s && s !== solidAt(x1, y1); };
// memória: o mestre anota as casas que o grupo já viu e salva no banco
let exPrevEl = null, exT = null, exImgEl = null, exImgSrc = null, exC = null, exReady = false;
function exImage(){ // imagem da memória vinda do banco
  const src = fog.exImg; if (!src) { exPrevEl = null; return null; }
  if (src !== exImgSrc) { exImgSrc = src; const im = new Image(); im.onload = () => { exPrevEl = im; dirty = true; }; im.src = src; exImgEl = im; }
  return exImgEl.complete && exImgEl.naturalWidth ? exImgEl : exPrevEl;   // mantém a anterior até a nova carregar (sem piscar)
}
function exBoxNow(){
  const mb = mapBox(true), [w, h] = mb ? [mb[2], mb[3]] : [9000, 9000], x0 = mb ? mb[0] - 200 : -3000, y0 = mb ? mb[1] - 200 : -3000, W2 = w + (mb ? 400 : 0), H2 = h + (mb ? 400 : 0);
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
    refreshBlock(); const box = exBoxNow(); await ensureExC(box);
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
  const [x0, y0, w, h] = mapBox() || [0, 0, 1600, 1000];
  cam.z = Math.min(innerWidth / w, innerHeight / h) * .92; cam.x = (innerWidth - w * cam.z) / 2 - x0 * cam.z; cam.y = (innerHeight - h * cam.z) / 2 - y0 * cam.z; dirty = true; drawTop();
}
function centerOn(wx, wy, z){ cam.z = z; cam.x = innerWidth / 2 - wx * z; cam.y = innerHeight / 2 - wy * z; dirty = true; drawTop(); }

// ---------- interação ----------
const pts = new Map();
cv.addEventListener("contextmenu", e => e.preventDefault());
cv.addEventListener("wheel", e => { e.preventDefault(); zoomAt(Math.exp(-e.deltaY * .0015), e.clientX, e.clientY); }, {passive: false});
function hitToken(x, y){
  for (let i = tokens.length - 1; i >= 0; i--) { const t = tokens[i]; if (isProp(t) || (!isGM && t.h)) continue; if (Math.hypot(t.x - x, t.y - y) <= tokR(t)) return t; }
  return null;
}
cv.addEventListener("pointerdown", e => {
  cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); closeFlyoutSoft();
  if (pts.size === 2) { const [p1, p2] = [...pts.values()]; drag = {kind: "pinch", d: Math.hypot(p1[0] - p2[0], p1[1] - p2[1]), z: cam.z}; return; }
  const [wx, wy] = toWorld(e.clientX, e.clientY);
  if (e.button === 0 && e.altKey) { doPing(wx, wy, isGM && e.shiftKey); if (isGM && e.shiftKey) send("view", {x: wx, y: wy, z: cam.z}); return; }
  if (e.button === 0) lastClick = [wx, wy];
  if (e.button === 2 && tool === "wall" && wallDraft) { wallDraft = null; dirty = true; return; }
  if (e.button === 1 || e.button === 2 || spaceDown) { drag = {kind: "pan", sx: e.clientX, sy: e.clientY, cx: cam.x, cy: cam.y}; cv.classList.add("panning"); return; }
  if (tool === "move") {
    const t = hitToken(wx, wy);
    if (isGM && scene.roll) { const rx = rollExitAt(wx, wy); if (rx) { rollSel = rx.id; genOpt.style = "rolled"; openRollPanel(); return; } }
    if (!t && isGM) { const wi = wallAt(wx, wy); const w = walls()[wi]; if (w?.d) { w.o = w.o ? 0 : 1; wallsChanged(); toast(w.o ? "Porta aberta." : "Porta fechada."); return; } }
    if (!t && !isGM) { const w = doorAt(wx, wy); if (w && tokens.some(x => !isProp(x) && owns(x) && nearDoor(x, w))) { playerDoor(w); return; } }
    const sel = tokens.find(x => x.id === selTok);
    if (sel && (isGM || owns(sel))) { // pegou na setinha do token selecionado?
      if (isProp(sel)) { const [hx, hy] = propHandle(sel); if (Math.hypot(wx - hx, wy - hy) <= 12 / cam.z) { drag = {kind: "rotate", t: sel}; cv.classList.add("panning"); return; }
        if (isGM && propCorner(sel, wx, wy)) { drag = {kind: "propsize", t: sel, ow: sel.pw || 1, oh: sel.ph || 1, ratio: (sel.pw || 1) / (sel.ph || 1)}; cv.classList.add("panning"); return; } }
      else { const r = tokR(sel), [vx, vy] = dirVec(sel.a || 0), hx = sel.x + vx * r * 1.2, hy = sel.y + vy * r * 1.2;
        if (Math.hypot(wx - hx, wy - hy) <= Math.max(r * .38, 12 / cam.z)) { drag = {kind: "rotate", t: sel}; cv.classList.add("panning"); return; } }
    }
    const ct = curTpl();
    if (ct && canEditTpl(ct)) { const [hx, hy] = tplHandle(ct.t); if (Math.hypot(wx - hx, wy - hy) <= 12 / cam.z) { drag = {kind: "tplrot", e: ct}; return; } }
    if (t && (isGM || owns(t))) { selTok = t.id; drag = {kind: "token", t, dx: t.x - wx, dy: t.y - wy, moved: false, ox: t.x, oy: t.y, path: [cellAt(t.x, t.y)], grid: t.sn !== false || !isGM}; dirty = true; return; }
    const te = !t && hitTpl(wx, wy);
    if (te) { selTpl = te.t.id; selTok = null; drag = {kind: "tplmove", e: te, dx: te.t.x - wx, dy: te.t.y - wy, moved: false}; dirty = true; drawTplBar(); return; }
    const pr = !t && isGM && hitProp(wx, wy);
    if (pr) { selTok = pr.id; selTpl = null; drawTplBar(); drag = {kind: "prop", t: pr, dx: pr.x - wx, dy: pr.y - wy, moved: false}; dirty = true; return; }
    const walker = clickMoveTok();
    if (!walker) selTok = null;
    if (selTpl) { selTpl = null; drawTplBar(); } dirty = true;
    drag = {kind: "pan", sx: e.clientX, sy: e.clientY, cx: cam.x, cy: cam.y, walk: walker ? {id: walker.id, c: cellAt(wx, wy)} : null}; cv.classList.add("panning"); return;
  }
  if (tool === "spell") { // clicar numa área que já existe: pega e move (não cria outra)
    const ct = curTpl(); if (ct && canEditTpl(ct)) { const [hx, hy] = tplHandle(ct.t); if (Math.hypot(wx - hx, wy - hy) <= 12 / cam.z) { drag = {kind: "tplrot", e: ct}; return; } }
    const te = hitTpl(wx, wy); if (te) { selTpl = te.t.id; selTok = null; drag = {kind: "tplmove", e: te, dx: te.t.x - wx, dy: te.t.y - wy, moved: false}; dirty = true; drawTplBar(); return; }
  }
  if (tool === "spell") { const sp = curSpell(); drag = {kind: "tplnew", t: {id: uid(), t: "tpl", n: sp.n, ic: sp.ic, sh: sp.sh, r: sp.r, wd: sp.wd, c: sp.c, x: Math.round(wx), y: Math.round(wy), a: 0, own: isGM ? undefined : myKey}}; dirty = true; return; }
  if (tool === "ruler") { const a = snapPoint(wx, wy); rulers[myKey] = {a, b: a}; drag = {kind: "ruler"}; dirty = true; sendRuler(); return; }
  if (!isGM) return;
  if (tool === "draw" && opt.draw === "text") { const txt = prompt("Texto para escrever no mapa:"); if (txt && txt.trim()) { drawings.push({id: uid(), t: "text", c: opt.color, w: opt.width, p: [[Math.round(wx), Math.round(wy)]], s: txt.trim().slice(0, 200)}); save("drawings"); dirty = true; } return; }
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
    if (Math.hypot(p[0] - wallDraft[0], p[1] - wallDraft[1]) > 2) { walls().push({p: [...wallDraft, ...p], d: opt.wall === "door" || opt.wall === "secret" ? 1 : 0, ...(opt.wall === "secret" ? {s: 1} : {})}); wallsChanged(); }
    wallDraft = opt.wall === "door" || opt.wall === "secret" ? null : p; dirty = true; return;
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
    if (tool === "move") { const sp = isGM && tokens.find(t => t.id === selTok && isProp(t)), dw = doorAt(wx, wy); cv.style.cursor = sp && propCorner(sp, wx, wy) ? "nwse-resize" : dw && (isGM || tokens.some(t => !isProp(t) && owns(t) && nearDoor(t, dw))) ? "pointer" : ""; }
    if (!isGM && lookMouse && !walking) lookAt(wx, wy);
    if (clickMoveTok()) { const c = cellAt(wx, wy); if (!hoverCell || c[0] !== hoverCell[0] || c[1] !== hoverCell[1]) { hoverCell = c; dirty = true; } }
    return;
  }
  if (drag.kind === "pinch" && pts.size === 2) { const [p1, p2] = [...pts.values()]; const d = Math.hypot(p1[0] - p2[0], p1[1] - p2[1]); zoomAt((drag.z * d / drag.d) / cam.z, (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2); return; }
  if (drag.kind === "pan" && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 5) drag.panned = true;
  if (drag.kind === "pan") { cam.x = drag.cx + e.clientX - drag.sx; cam.y = drag.cy + e.clientY - drag.sy; dirty = true; return; }
  if (drag.kind === "prop") { drag.t.x = wx + drag.dx; drag.t.y = wy + drag.dy; drag.moved = true; dirty = true; return; }
  if (drag.kind === "tplnew") { const t = drag.t; if (t.sh === "circle") { t.x = Math.round(wx); t.y = Math.round(wy); } else if (Math.hypot(wx - t.x, wy - t.y) > 4 / cam.z) t.a = Math.round(Math.atan2(wx - t.x, -(wy - t.y)) * 180 / Math.PI); dirty = true; return; }
  if (drag.kind === "tplmove") { drag.e.t.x = Math.round(wx + drag.dx); drag.e.t.y = Math.round(wy + drag.dy); drag.moved = true; dirty = true; return; }
  if (drag.kind === "tplrot") { const t = drag.e.t; if (t.sh === "circle") { t.r = Math.max(1.5, Math.round(Math.hypot(wx - t.x, wy - t.y) / G().size * (G().unit || 1) / 1.5) * 1.5); } else t.a = Math.round(Math.atan2(wx - t.x, -(wy - t.y)) * 180 / Math.PI / 5) * 5; drag.moved = true; dirty = true; return; }
  if (drag.kind === "propsize") { // arrasta o canto: aumenta ou diminui (Shift mantém a proporção)
    const t = drag.t, [lx, ly] = propLocal(t, wx, wy), S = G().size, st = t.sn === false ? .25 : 1;
    let w = Math.max(st, Math.min(20, Math.round(2 * Math.abs(lx) / S / st) * st)), h = Math.max(st, Math.min(20, Math.round(2 * Math.abs(ly) / S / st) * st));
    if (e.shiftKey) { if (w / drag.ratio >= h) h = Math.max(st, Math.round(w / drag.ratio / st) * st); else w = Math.max(st, Math.round(h * drag.ratio / st) * st); }
    if (w !== t.pw || h !== t.ph) { t.pw = w; t.ph = h; drag.moved = true; dirty = true; }
    drag.at = [wx, wy]; dirty = true; return;
  }
  if (drag.kind === "rotate") {
    let a = Math.atan2(wx - drag.t.x, -(wy - drag.t.y)) * 180 / Math.PI;
    const step = isProp(drag.t) ? (e.shiftKey ? 90 : 15) : e.shiftKey ? (G().type === "hex" ? 60 : 45) : 5; a = ((Math.round(a / step) * step) % 360 + 360) % 360;
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
  if (d.kind === "pan" && d.walk && !d.panned) { // clique curto com o próprio token selecionado: anda até lá
    const t = tokens.find(x => x.id === d.walk.id); if (!t) return;
    const P = pathTo(t, d.walk.c);
    if (P && P.length > 1) walkTo(t, P);
    else if (!P) { toast(isGM ? "Longe demais." : "Não dá para chegar lá (parede ou longe demais)."); }
    else { selTok = null; hoverCell = null; dirty = true; }
    return;
  }
  if (d.kind === "prop") { if (d.moved) { const [x, y] = snapProp(d.t, d.t.x, d.t.y); d.t.x = x; d.t.y = y; save("tokens"); } dirty = true; return; }
  if (d.kind === "tplnew") { const t = d.t; if (isGM) { drawings.push(t); save("drawings"); } else { ptpls[t.id] = t; send("tpl", {op: "set", t}); } selTpl = t.id; setTool("move"); drawTplBar(); dirty = true; toast("Área colocada. Arraste para mover; a bolinha branca gira. Para outra, aperte M.", 2600); return; }
  if (d.kind === "tplmove" || d.kind === "tplrot") { if (d.moved) tplCommit(d.e); return; }
  if (d.kind === "propsize") { if (d.moved) { const [x, y] = snapProp(d.t, d.t.x, d.t.y); d.t.x = x; d.t.y = y; save("tokens"); toast(`Tamanho: ${String(d.t.pw).replace(".", ",")} × ${String(d.t.ph).replace(".", ",")} casas`, 1400); } return; }
  if (d.kind === "rotate") {
    if (isProp(d.t)) { if (d.moved) { const [x, y] = snapProp(d.t, d.t.x, d.t.y); d.t.x = x; d.t.y = y; save("tokens"); } return; }
    if (d.moved) { const t = d.t; delete tokLive[t.id]; if (isGM) { send("tok", {id: t.id, x: t.x, y: t.y, a: t.a}); save("tokens"); } else tokReq({id: t.id, a: t.a, who: myNick}); }
    return;
  }
  if (d.kind === "token") {
    if (d.moved) {
      const [x, y] = d.grid ? [d.t.x, d.t.y] : d.t.sn === false ? [Math.round(d.t.x), Math.round(d.t.y)] : snapPoint(d.t.x, d.t.y, d.t.s || 1);
      d.t.x = x; d.t.y = y; delete tokLive[d.t.id];
      if (isGM) { if (x !== d.ox || y !== d.oy) pushTrail(d.t, d.grid ? [[d.ox, d.oy], ...d.path.slice(1).map(c => cellCenter(...c))] : [[d.ox, d.oy], [x, y]]); send("tok", {id: d.t.id, x, y}); save("tokens"); }
      else if (x !== d.ox || y !== d.oy) tokReq({id: d.t.id, x, y, who: myNick, path: [[d.ox, d.oy], ...d.path.slice(1).map(c => cellCenter(...c).map(v => Math.round(v * 10) / 10))]});
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
cv.addEventListener("dblclick", e => { if (!isGM) return; const [wx, wy] = toWorld(e.clientX, e.clientY); const t = hitToken(wx, wy); if (t) return openTokenPanel(t); const pr = hitProp(wx, wy); if (pr) openPropPanel(pr); });
cv.addEventListener("contextmenu", e => { if (!isGM) return; const [wx, wy] = toWorld(e.clientX, e.clientY); const t = hitToken(wx, wy) || hitProp(wx, wy); if (isProp(t)) { e.preventDefault(); drag = null; cv.classList.remove("panning"); selTok = t.id; dirty = true; return openPropPanel(t); } if (t) { e.preventDefault(); drag = null; cv.classList.remove("panning"); selTok = t.id; dirty = true; openTokenPanel(t); } });
function rotateSel(dir){
  const t = tokens.find(x => x.id === selTok); if (!t || !(isGM || owns(t))) return;
  const step = isProp(t) ? 90 : G().type === "hex" ? 60 : 45; t.a = (((t.a || 0) + dir * step) % 360 + 360) % 360; dirty = true;
  if (isProp(t)) { const [x, y] = snapProp(t, t.x, t.y); t.x = x; t.y = y; save("tokens"); return; }
  if (isGM) { send("tok", {id: t.id, x: t.x, y: t.y, a: t.a}); save("tokens"); } else tokReq({id: t.id, a: t.a, who: myNick});
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
  if (k === "escape" && selTok) { selTok = null; hoverCell = null; dirty = true; return; }
  if (k === "escape") { if (rulers[myKey]) { delete rulers[myKey]; sendRuler(); dirty = true; } closePanel(); closeFlyout(); selTok = null; return; }
  if (k === "+" || k === "=") return zoomAt(1.2);
  if (k === "-") return zoomAt(1 / 1.2);
  if (k === "0") return fit();
  if ((k === "q" || k === "e") && selTok && (tool === "move" || !isGM)) { const t = tokens.find(x => x.id === selTok); if (t && (isGM || owns(t))) { e.preventDefault(); return rotateSel(k === "q" ? -1 : 1); } }
  const map = {v: "move", r: "ruler", d: "draw", e: "erase", f: "fog", w: "wall", m: "spell"};
  if ((k === "delete" || k === "backspace") && selTpl) { const ct = curTpl(); if (ct && canEditTpl(ct)) { tplRemove(ct); return; } }
  if (map[k] && (isGM || k === "v" || k === "r" || k === "m")) setTool(map[k]);
  if ((k === "delete" || k === "backspace") && selTok && isGM) { const t = tokens.find(x => x.id === selTok); if (t && confirm(`Remover o token “${t.n || "sem nome"}”?`)) { tokens = tokens.filter(x => x.id !== t.id); selTok = null; save("tokens"); dirty = true; } }
});
addEventListener("keyup", e => { if (e.code === "Space") { spaceDown = false; cv.classList.remove("panning"); } });

function distSeg(px, py, [x1, y1], [x2, y2]){ const dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy; let t = L ? ((px - x1) * dx + (py - y1) * dy) / L : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - x1 - t * dx, py - y1 - t * dy); }
function inTri(p, a, b, c){ const s = (a, b, c) => (a[0] - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (a[1] - c[1]); const d1 = s(p, a, b), d2 = s(p, b, c), d3 = s(p, c, a); return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0)); }
function hitDrawing(dr, x, y){
  if (dr.t === "tpl") return inTpl(dr, x, y);
  if (dr.t === "text") { const fs = 10 + (dr.w || 4) * 3, lines = String(dr.s || "").split("\n"); ctx.save(); ctx.font = `700 ${fs}px "Alegreya Sans", sans-serif`; const w = Math.max(...lines.map(l => ctx.measureText(l).width)); ctx.restore(); return x >= dr.p[0][0] - 4 && x <= dr.p[0][0] + w + 4 && y >= dr.p[0][1] - 4 && y <= dr.p[0][1] + lines.length * fs * 1.15 + 4; }
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
function send(event, payload){ if (EDIT_ID) return; chan?.send({type: "broadcast", event, payload}); }
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
function save(col, undoable = true, delay){
  if (!isGM) return;
  if (undoable) pushUndo(col, undoable === "merge");
  if (col === "tokens" || col === "scene") updateExplored();
  clearTimeout(saveTimers[col]); lastSave[col] = Date.now();
  saveTimers[col] = setTimeout(async () => {
    const val = col === "scene" ? scene : col === "tokens" ? tokens : col === "fog" ? fog : drawings;
    lastSave[col] = Date.now();
    const {error} = await sb.from("map_state").update({[col]: val, updated_at: new Date().toISOString()}).eq("id", ROW);
    if (error) return toast("Não salvei o mapa: " + error.message);
    try { if (JSON.stringify(val).length < 180000) send("state", {col, val}); } catch {}  // entrega na hora, sem depender só do banco
  }, delay || (col === "fog" ? 150 : 60));
}
async function load(){
  const {data, error} = await sb.from("map_state").select("*").eq("id", ROW).maybeSingle();
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
  if (!isGM) fixPending();
  dirty = true; drawTop(); drawEmpty();
}

// ---------- interface ----------
function setTool(t){ tool = t; wallDraft = null; cv.className = "t-" + (t === "wall" || t === "spell" ? "draw" : t); drawTools(); if ((["draw", "fog", "wall"].includes(t) && isGM) || t === "spell") openFlyout(t); else closeFlyout(); dirty = true; }
function fitTools(){ // barra da esquerda: quebra em colunas quando a tela é baixa, e o resto da tela se afasta dela
  const el = $("#tools"); if (!el) return;
  const n = el.querySelectorAll(".tool").length, sz = innerHeight < 760 ? 38 : 44, gap = innerHeight < 760 ? 3 : 4;
  const rows = Math.max(3, Math.min(n, Math.floor((innerHeight - 90) / (sz + gap))));
  el.style.gridTemplateRows = `repeat(${rows}, ${sz}px)`;
  requestAnimationFrame(() => document.documentElement.style.setProperty("--toolsW", Math.round(el.getBoundingClientRect().right) + "px"));
}
addEventListener("resize", () => fitTools());
function drawTools(){
  const btn = (t, icon, label, key) => `<button class="tool" data-tool="${t}" aria-pressed="${tool === t}" title="${label} (${key.toUpperCase()})" aria-label="${label}">${icon}<span class="k">${key.toUpperCase()}</span></button>`;
  $("#tools").innerHTML = btn("move", I.move, isGM ? "Mover tokens e o mapa" : "Mover o mapa", "v") + btn("ruler", I.ruler, "Régua", "r") + btn("spell", I.spell, "Áreas de magia", "m")
    + (!isGM ? `<hr><button class="tool" id="pMaps" title="Mapas que o mestre liberou" aria-label="Mapas">${I.maps}<i class="tdot" hidden></i></button><button class="tool" id="pNotes" title="Anotações: o que o mestre liberou e as suas notas" aria-label="Anotações">${I.notes}<i class="tdot" hidden></i></button>` : "")
    + (isGM ? btn("draw", I.draw, "Desenhar e marcar áreas", "d") + btn("erase", I.erase, "Borracha (apaga desenhos)", "e") + btn("fog", I.fog, "Névoa de guerra", "f") + btn("wall", I.wall, "Paredes e portas (bloqueiam luz e visão)", "w")
      + `<hr><button class="tool" id="addTok" title="Adicionar token" aria-label="Adicionar token">${I.token}</button><button class="tool" id="listTok" title="Lista de tokens" aria-label="Lista de tokens">${I.list}</button><button class="tool" id="assetsBtn" title="Assets: árvores, casas, animais, baús…" aria-label="Assets">${I.box}</button><button class="tool" id="genBtn" title="Gerador de cenários: masmorra, caverna, floresta, vila, taverna, cemitério" aria-label="Gerador de cenários">${I.dungeon}</button><button class="tool" id="mapsBtn" title="Mapas salvos (pastas)" aria-label="Mapas salvos">${I.maps}</button><button class="tool" id="iniBtn" title="Iniciativa e turnos" aria-label="Iniciativa">${I.swords}</button><button class="tool" id="handBtn" title="Anotações, mapas e imagens (libere para os jogadores ou mostre na tela deles)" aria-label="Anotações">${I.notes}</button><button class="tool" id="sceneBtn" title="Mapa e grid" aria-label="Configurar mapa e grid">${I.gear}</button>` : "");
  $("#tools").onclick = e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.tool) setTool(b.dataset.tool);
    else if (b.id === "addTok") openTokenPanel(null);
    else if (b.id === "listTok") panelKind === "list" ? closePanel() : openTokenList();
    else if (b.id === "assetsBtn") panelKind === "assets" ? closePanel() : openAssets();
    else if (b.id === "genBtn") panelKind === "gen" ? closePanel() : openGenPanel();
    else if (b.id === "mapsBtn") panelKind === "maps" ? closePanel() : openMapsPanel();
    else if (b.id === "iniBtn") panelKind === "ini" ? closePanel() : openIniPanel();
    else if (b.id === "handBtn") panelKind === "hand" ? closePanel() : openHandPanel();
    else if (b.id === "pMaps" || b.id === "pNotes") { b.querySelector(".tdot").hidden = true; if (panelKind === "hand" && handTab === (b.id === "pMaps" ? "mapa" : "nota")) closePanel(); else openHandPanel(b.id === "pMaps" ? "mapa" : "nota"); }
    else if (b.id === "sceneBtn") panelKind === "scene" ? closePanel() : openScenePanel();
  };
  fitTools();
}
function drawTop(){
  $("#topbar").innerHTML = `<div class="title">${EDIT_ID ? "✏️ " + esc(scene.lib?.n || "Mapa") : isGM && scene.libName ? esc(scene.libName) : "Mapa da mesa"}<small>${EDIT_ID ? "editando · jogadores não veem" : isGM ? "mestre" : esc(myNick || "jogador")}</small></div><span class="spacer"></span>
    ${isGM ? `<div class="seg light" id="lightSeg" title="Iluminação do mapa">${[["day", "☀ Dia"], ["dim", "🌗 Penumbra"], ["dark", "🌑 Escuro"]].map(([k, l]) => `<button data-light="${k}" aria-pressed="${(scene.light || "day") === k}">${l}</button>`).join("")}</div>
      <button class="btn" id="prevBtn" aria-pressed="${gmPreview}" title="Mostra por cima do mapa o que os jogadores enxergam">${I.eye} Ver como jogadores</button>` : ""}
    <button class="btn" id="trailBtn" aria-pressed="${showTrails}" title="Mostrar o rastro de todos os tokens">👣 Rastros</button>
    <button class="btn" id="stepBtn" aria-pressed="${stepsOn}" title="Som de passos quando os personagens andam">${stepsOn ? "🔊" : "🔇"} Passos</button>
    ${!isGM ? `<button class="btn" id="lookBtn" aria-pressed="${lookMouse}" title="Seu personagem olha para onde o mouse está">🧭 Olhar p/ mouse</button>` : ""}
    ${isGM ? `<button class="btn" id="turnBtn" title="Apaga os rastros de todos (começo de um novo turno)">⟳ Novo turno</button>` : ""}
    ${isGM ? `<button class="btn" id="castBtn" title="Faz a tela dos jogadores ir para onde você está olhando">${I.cast} Levar jogadores aqui</button>` : ""}
    <div class="zoom"><button class="btn small" id="zOut" aria-label="Diminuir zoom">${I.minus}</button><span>${Math.round(cam.z * 100)}%</span><button class="btn small" id="zIn" aria-label="Aumentar zoom">${I.plus}</button><button class="btn small" id="zFit" title="Enquadrar o mapa (0)" aria-label="Enquadrar">${I.fit}</button></div>`;
  $("#zOut").onclick = () => zoomAt(1 / 1.2); $("#zIn").onclick = () => zoomAt(1.2); $("#zFit").onclick = fit;
  const ls = $("#lightSeg"); if (ls) ls.onclick = e => { const b = e.target.closest("[data-light]"); if (!b) return; scene.light = b.dataset.light; save("scene"); dirty = true; drawTop(); };
  const pb = $("#prevBtn"); if (pb) pb.onclick = () => { gmPreview = !gmPreview; dirty = true; drawTop(); if (gmPreview && !tokens.some(t => VI(t) && t.o)) toast("Nenhum token de jogador tem visão ainda (aba “Visão e luz” do token)."); };
  $("#trailBtn").onclick = () => { showTrails = !showTrails; dirty = true; drawTop(); };
  $("#stepBtn").onclick = () => { stepsOn = !stepsOn; try { localStorage.setItem("mesa.steps", stepsOn ? "1" : "0"); } catch {} drawTop(); if (stepsOn) DS.step(.4); };
  const lb = $("#lookBtn"); if (lb) lb.onclick = () => { lookMouse = !lookMouse; try { localStorage.setItem("mesa.look", lookMouse ? "1" : "0"); } catch {} drawTop(); };
  const tb = $("#turnBtn"); if (tb) tb.onclick = () => { let n = 0; for (const t of tokens) if (t.tr?.length) { t.tr = []; n++; } save("tokens"); dirty = true; selBarKey = ""; toast(n ? "Novo turno: rastros apagados." : "Novo turno."); };
  const cb = $("#castBtn"); if (cb) cb.onclick = () => { const [wx, wy] = toWorld(innerWidth / 2, innerHeight / 2); send("view", {x: wx, y: wy, z: cam.z}); toast("Jogadores levados para a sua visão."); };
  drawTurnBar();
}
function drawEmpty(){
  let el = $("#emptyMap");
  const show = isGM && !scene.bg && !scene.gen && !tokens.length;
  if (!show) { el?.remove(); return; }
  if (!el) { el = document.createElement("div"); el.id = "emptyMap"; el.className = "empty-map"; document.body.appendChild(el); }
  el.innerHTML = `<div><b>Mapa vazio</b>Coloque a imagem de um mapa (link ou arquivo) e ajuste a grid, gere uma masmorra ou abra um mapa salvo.<br><br><div class="acts" style="justify-content:center"><button class="btn primary" id="emptyScene">${I.gear} Configurar mapa</button><button class="btn" id="emptyGen">${I.dungeon} Gerar masmorra</button><button class="btn" id="emptyMaps">${I.maps} Mapas salvos</button></div></div>`;
  $("#emptyScene").onclick = () => openScenePanel(); $("#emptyGen").onclick = () => openGenPanel(); $("#emptyMaps").onclick = () => openMapsPanel();
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
    const shapes = [["pen", I.pen, "Livre"], ["line", I.line, "Linha"], ["circle", I.circle, "Círculo"], ["cone", I.cone, "Cone"], ["rect", I.rect, "Quadrado"], ["text", "<b style='font:700 15px serif'>T</b>", "Texto"]];
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
  } else if (kind === "spell") {
    const sp = curSpell();
    f.innerHTML = `<div class="flyout spellfly" style="top:${Math.max(10, top - 40)}px"><h4>Áreas de magia</h4>
      <div class="spgrid" id="spGrid">${SPELLS.map((x, i) => `<button data-sp="${i}" aria-pressed="${!spellCustom && spellSel === i}" style="--sc:${x.c}"><span>${x.ic}</span>${esc(x.n)}<small>${x.sh === "line" ? "linha " : x.sh === "cone" ? "cone " : x.sh === "square" ? "cubo " : "raio "}${String(x.r).replace(".", ",")} ${esc(G().unitName)}</small></button>`).join("")}</div>
      <div class="lbl" style="margin-top:10px">Ajustar antes de colocar</div>
      <div class="two"><label>Tamanho (${esc(G().unitName)}) <input type="number" id="spR" min="1" step="1.5" value="${sp.r}"></label><label>Cor <input type="color" id="spC" value="${sp.c}"></label></div>
      <div class="seg" id="spSh" style="margin-top:6px">${[["circle", "Círculo"], ["cone", "Cone"], ["line", "Linha"], ["square", "Cubo"]].map(([k, l]) => `<button data-sh="${k}" aria-pressed="${sp.sh === k}">${l}</button>`).join("")}</div>
      <p class="hint" style="margin-top:8px"><b>Arraste uma magia para o mapa</b>, ou escolha e clique no mapa para colocar. Cone e linha: clique na origem e arraste para mirar. Depois, com Mover (V), arraste a área ou a bolinha branca (girar / tamanho). Delete remove.${isGM ? "" : " Todos veem a sua área enquanto ela existir."}</p></div>`;
    $("#spGrid").onclick = e => { const b = e.target.closest("[data-sp]"); if (b) { spellSel = +b.dataset.sp; spellCustom = null; openFlyout("spell"); } };
    const upd = () => { spellCustom = {...curSpell(), r: Math.max(1, parseFloat(String($("#spR").value).replace(",", ".")) || curSpell().r), c: $("#spC").value}; };
    $("#spR").oninput = upd; $("#spC").oninput = upd;
    $("#spSh").onclick = e => { const b = e.target.closest("[data-sh]"); if (!b) return; spellCustom = {...curSpell(), sh: b.dataset.sh, wd: b.dataset.sh === "line" ? 1.5 : undefined}; openFlyout("spell"); };
  } else if (kind === "wall") {
    f.innerHTML = `<div class="flyout" style="top:${Math.max(10, top - 60)}px"><h4>Paredes e portas</h4>
      <div class="seg" id="wMode" style="margin-bottom:10px"><button data-wm="wall" aria-pressed="${opt.wall === "wall"}">${I.wall} Parede</button><button data-wm="door" aria-pressed="${opt.wall === "door"}">${I.door} Porta</button><button data-wm="secret" aria-pressed="${opt.wall === "secret"}" title="Os jogadores não veem a porta: parece parede até você abrir">${I.door} Secreta</button><button data-wm="circle" aria-pressed="${opt.wall === "circle"}">${I.circle} Círculo</button><button data-wm="erase" aria-pressed="${opt.wall === "erase"}">${I.erase} Apagar</button></div>
      <p class="hint">${opt.wall === "erase" ? "Clique numa parede ou porta para apagar." : opt.wall === "circle" ? "Clique no centro e arraste até o tamanho (bom para troncos de árvore e colunas). Depois dá para arrastar o ponto amarelo (mover) e o azul (tamanho)." : opt.wall === "door" ? "Clique no começo e no fim da porta. Depois, com a ferramenta Mover (V), clique na porta para abrir ou fechar." : opt.wall === "secret" ? "Porta secreta (roxa): para os jogadores é parede até você abrir. Clique no começo e no fim; abra e feche com Mover (V)." : "Clique ponto a ponto para desenhar a parede. Enter, Esc ou botão direito terminam. Os pontos grudam nos cantos da grid; segure Shift para soltar. Arraste uma junção (ponto amarelo) para deformar a parede."}</p>
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

    <div class="acts foot">${isNew ? "" : `<button class="btn small" id="tDup">Duplicar</button><button class="btn small danger" id="tDel">Remover</button>`}<span class="spacer"></span><button class="btn small" id="tMine" title="Guarda este token para reusar depois (na Lista de tokens)">☆ Salvar em Meus Tokens</button><button class="btn" id="tCancel">Cancelar</button><button class="btn primary" id="tSave">${isNew ? "Colocar" : "Ok"}</button></div>
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
  $("#tMine").onclick = () => { const keep = {n: $("#tName").value.trim() || d.n || "Token", c: d.c, s: d.s || 1, img: $("#tImg").value.trim() || null, b: d.b, bv: d.bv, au: d.au, vi: d.vi, li: d.li, sp: d.sp, dir: d.dir, sn: d.sn}; myTokens.push(keep); saveMyTokens(); toast(`“${keep.n}” salvo em Meus Tokens.`); };
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
      const [wx, wy] = placeAt();
      const off = 0; const [x, y] = vals.sn ? snapPoint(wx + off, wy, vals.s) : [Math.round(wx + off), Math.round(wy)];
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
// barra de atalhos (estilo Baldur's Gate): 2 fileiras, arrasta para trocar, cor e emoji em cada habilidade
const HB_COLS = 10, HB_ROWS = 2, HB_N = HB_COLS * HB_ROWS;
const HB_EMOJI = ["🎲", "⚔️", "🗡️", "🏹", "🪓", "🛡️", "👊", "🔥", "❄️", "⚡", "🌀", "✨", "💥", "🎯", "☠️", "💀", "🩸", "💚", "🍀", "🧪", "🔮", "📜", "👁️", "🐾", "🌙", "☀️", "🌊", "🪨", "🗣️", "🎵", "🍺", "💰"];
const HB_COLORS = ["#7a1f1f", "#8a4a14", "#7a6414", "#2f6a24", "#1f5a6a", "#23408a", "#4a2a7e", "#6a2452", "#3a3530"];
let hotbar = (() => {
  try { const v = JSON.parse(localStorage.getItem("mesa.hotbar")); if (Array.isArray(v)) return Array.from({length: HB_N}, (_, i) => v[i] || null); } catch {}
  const out = Array(HB_N).fill(null); presets.forEach((p, i) => { if (i < HB_N) out[i] = {n: p.n, f: p.f, c: HB_COLORS[(i * 2) % HB_COLORS.length], e: ["🎲", "⚔️", "💥", "🍀"][i] || "🎲"}; }); return out;
})();
const saveHotbar = () => { try { localStorage.setItem("mesa.hotbar", JSON.stringify(hotbar)); } catch {} };
function hbAdd(p){ const i = hotbar.findIndex(x => !x); if (i < 0) { toast("A barra está cheia. Apague um atalho (clique direito nele)."); return -1; } hotbar[i] = p; saveHotbar(); drawDiceBar(); return i; }
function hbEditor(i){
  const p = {...(hotbar[i] || {n: "", f: "1d20", c: HB_COLORS[i % HB_COLORS.length], e: "🎲"})}, isNew = !hotbar[i];
  let el = $("#hbEdit"); if (!el) { el = document.createElement("div"); el.id = "hbEdit"; el.className = "hbedit"; document.body.appendChild(el); }
  const draw = () => {
    el.innerHTML = `<div class="hbe-top"><span class="hbs full big" style="--hc:${esc(p.c)}"><span class="hbe">${esc(p.e || "🎲")}</span><span class="hbn">${esc(p.n || "…")}</span></span>
        <div class="hbe-f"><input id="hbN" maxlength="24" autocomplete="off" placeholder="Nome (ex.: Ataque furioso)" value="${esc(p.n)}"><input id="hbF" class="hbf" maxlength="40" autocomplete="off" spellcheck="false" placeholder="Fórmula (ex.: 1d20+5)" value="${esc(p.f)}"><div class="dm-err" id="hbErr"></div></div></div>
      <div class="lbl">Emoji</div><div class="hbe-emo">${HB_EMOJI.map(x => `<button data-he="${x}" aria-pressed="${p.e === x}">${x}</button>`).join("")}<input id="hbEc" maxlength="4" placeholder="outro" value="${HB_EMOJI.includes(p.e) ? "" : esc(p.e || "")}" title="Cole qualquer emoji"></div>
      <div class="lbl">Cor</div><div class="hbe-col">${HB_COLORS.map(c => `<button data-hc="${c}" style="background:${c}" aria-pressed="${p.c === c}" aria-label="Cor ${c}"></button>`).join("")}<input type="color" id="hbCc" value="${esc(p.c)}" title="Outra cor"></div>
      <div class="acts foot">${isNew ? "" : `<button class="btn small danger" id="hbDel">Remover</button>`}<button class="btn small" id="hbTry">🎲 Testar</button><span class="spacer"></span><button class="btn small" id="hbX">Cancelar</button><button class="btn small primary" id="hbOk">Salvar</button></div>`;
    const q = s => el.querySelector(s);
    q("#hbN").oninput = e => { p.n = e.target.value; el.querySelector(".hbe-top .hbn").textContent = p.n || "…"; };
    q("#hbF").oninput = e => { p.f = e.target.value; q("#hbErr").textContent = ""; };
    el.querySelectorAll("input").forEach(x => x.onkeydown = e => { e.stopPropagation(); if (e.key === "Enter") q("#hbOk").click(); if (e.key === "Escape") el.remove(); });
    q(".hbe-emo").onclick = e => { const b = e.target.closest("[data-he]"); if (b) { p.e = b.dataset.he; draw(); } };
    q("#hbEc").oninput = e => { if (e.target.value.trim()) { p.e = e.target.value.trim(); el.querySelector(".hbe-top .hbe").textContent = p.e; } };
    q(".hbe-col").onclick = e => { const b = e.target.closest("[data-hc]"); if (b) { p.c = b.dataset.hc; draw(); } };
    q("#hbCc").oninput = e => { p.c = e.target.value; el.querySelector(".hbe-top .hbs").style.setProperty("--hc", p.c); };
    const ok = () => { try { parseFormula(p.f); return true; } catch (err) { q("#hbErr").textContent = "Fórmula: " + err.message; return false; } };
    q("#hbTry").onclick = () => { if (ok()) doRoll(p.f, 0, p.n || "Atalho", false); };
    q("#hbX").onclick = () => el.remove();
    q("#hbOk").onclick = () => { if (!ok()) return; hotbar[i] = {n: (p.n || "Rolagem").slice(0, 24), f: p.f.replace(/\s+/g, ""), c: p.c, e: p.e || "🎲"}; saveHotbar(); drawDiceBar(); el.remove(); };
    if (q("#hbDel")) q("#hbDel").onclick = () => { hotbar[i] = null; saveHotbar(); drawDiceBar(); el.remove(); };
  };
  draw(); setTimeout(() => el.querySelector("#hbN")?.focus(), 30);
}
let diceCounts = {}, diceMod = 0, diceAdv = 0, diceSecret = false, diceLog = [], diceText = "", diceModal = false, lastResult = null;
const dieEl = (d, v, cls = "", col) => `<span class="die d${d} ${cls}" style="--dc:${/^#[0-9a-f]{6}$/i.test(col || "") ? col : dColor(d)};--shape:${dShape(d)}"><span class="die-n">${v}</span></span>`;
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
  step(v = .4, alt){ // passo: baque surdo + raspar leve
    if (!stepsOn || !this.init()) return; const t = this.ctx.currentTime, f = alt ? 1 : 1.15;
    this.click(t, 150 * f, v, .09, 1.2); this.tone(t, 95 * f, .08, v * .45, "sine", 55); this.click(t + .015, 1100 * f + Math.random() * 400, v * .18, .06, 1.4);
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
  return r.dice.map(x => dieEl(x.d, r.fresh ? "?" : x.v, (big ? "big2 " : "mini ") + (x.x ? "drop " : "") + (!r.fresh && x.d === 20 && !x.x && (x.v === 20 || x.v === 1) ? (x.v === 20 ? "c20" : "c1") : ""), r.col)).join("")
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
let logOpen = (() => { try { return localStorage.getItem("mesa.logopen") !== "0"; } catch { return true; } })(), logUnseen = 0;
function drawDiceLog(fresh){
  let el = $("#diceLog"); if (!el) { el = document.createElement("div"); el.id = "diceLog"; el.className = "dlog"; el.setAttribute("aria-live", "polite"); document.body.appendChild(el); }
  if (fresh && !logOpen) logUnseen++;
  el.classList.toggle("closed", !logOpen);
  const last = diceLog[diceLog.length - 1];
  const head = `<button class="dlog-tog" id="logTog" aria-expanded="${logOpen}" title="${logOpen ? "Esconder" : "Mostrar"} o histórico de rolagens">🎲 Histórico${diceLog.length ? ` <small>${diceLog.length}</small>` : ""}${!logOpen && logUnseen ? `<b class="dnew">${logUnseen}</b>` : ""}${!logOpen && last && !last.fresh ? `<span class="dlast">${esc(last.who)}: <b>${last.total}</b></span>` : ""}<span class="chev">${logOpen ? "▾" : "▸"}</span></button>`;
  el.innerHTML = head + (logOpen ? `<div class="dlog-rows">${diceLog.slice(-6).map(logRow).join("")}</div>` : "");
  $("#logTog").onclick = () => { logOpen = !logOpen; logUnseen = 0; try { localStorage.setItem("mesa.logopen", logOpen ? "1" : "0"); } catch {} drawDiceLog(); };
  const rows = el.querySelector(".dlog-rows"); if (rows) rows.scrollTop = rows.scrollHeight;
}
function drawDiceBar(){
  let el = $("#diceBar"); if (!el) { el = document.createElement("div"); el.id = "diceBar"; el.className = "dicebar"; document.body.appendChild(el); }
  el.innerHTML = `<button class="btn dice-main" id="dOpen" title="Abrir a mesa de dados">🎲 Rolar dados</button>
    <div class="hotbar" role="toolbar" aria-label="Barra de atalhos">${hotbar.map((p, i) => p ? `<button class="hbs full" data-hs="${i}" style="--hc:${esc(p.c || "#3a3530")}" title="${esc(p.n)} · ${esc(p.f)}&#10;Clique: rolar · Arraste: trocar de lugar · Clique direito: editar"><span class="hbe">${esc(p.e || "🎲")}</span><span class="hbn">${esc(p.n)}</span></button>` : `<button class="hbs" data-hs="${i}" title="Espaço vazio: clique para criar um atalho" aria-label="Espaço vazio"></button>`).join("")}</div>`;
  $("#dOpen").onclick = () => openDiceModal();
  const hb = el.querySelector(".hotbar"); let from = null;
  hb.onclick = e => { const b = e.target.closest("[data-hs]"); if (!b) return; const i = +b.dataset.hs, p = hotbar[i]; if (p) doRoll(p.f, 0, p.n, false); else hbEditor(i); };
  hb.oncontextmenu = e => { const b = e.target.closest("[data-hs]"); if (!b) return; e.preventDefault(); hbEditor(+b.dataset.hs); };
  hb.onmousedown = e => { const b = e.target.closest(".hbs.full"); if (b) b.draggable = true; };
  hb.ondragstart = e => { const b = e.target.closest(".hbs.full"); if (!b) return; from = +b.dataset.hs; e.dataTransfer.setData("text/mesa-hb", String(from)); e.dataTransfer.effectAllowed = "move"; b.classList.add("dragging"); };
  hb.ondragover = e => { const b = e.target.closest("[data-hs]"); if (from == null || !b) return; e.preventDefault(); hb.querySelectorAll(".over").forEach(x => x !== b && x.classList.remove("over")); b.classList.add("over"); };
  hb.ondragleave = e => { const b = e.target.closest("[data-hs]"); if (b && !b.contains(e.relatedTarget)) b.classList.remove("over"); };
  hb.ondrop = e => { const b = e.target.closest("[data-hs]"); if (from == null || !b) return; e.preventDefault(); const to = +b.dataset.hs; [hotbar[from], hotbar[to]] = [hotbar[to], hotbar[from]]; from = null; saveHotbar(); drawDiceBar(); };
  hb.ondragend = () => { from = null; hb.querySelectorAll(".over,.dragging").forEach(x => x.classList.remove("over", "dragging")); };
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
        <div class="dm-k">Barra de atalhos <span class="sub">(só neste computador)</span></div>
        <div class="dm-hbmini">${hotbar.map((p, i) => p ? `<span class="hbs full" style="--hc:${esc(p.c)}" title="${esc(p.n)} · ${esc(p.f)}"><span class="hbe">${esc(p.e || "🎲")}</span></span>` : `<span class="hbs"></span>`).join("")}</div>
        <p class="hint">Seus atalhos ficam na barra embaixo da tela, como no Baldur's Gate: <b>clique</b> num espaço vazio para criar, <b>clique direito</b> para editar (nome, fórmula, cor e emoji) e <b>arraste</b> para trocar de lugar. Aqui, “☆ Salvar como atalho” coloca a fórmula atual na barra.</p>
        <p class="hint">Use <b>kh</b>/<b>kl</b> para ficar com os maiores/menores: <b>2d20kh1</b> = vantagem, <b>4d6kh3</b> = atributo.</p>
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
    const i = hbAdd({n: "Nova rolagem", f: f.replace(/\s+/g, ""), c: HB_COLORS[0], e: "🎲"}); if (i >= 0) { closeDiceModal(); hbEditor(i); }
  };

}
addEventListener("keydown", e => { if (e.key === "Escape" && diceModal) { e.preventDefault(); closeDiceModal(); } }, true);
function closeDiceModal(){ diceModal = false; $("#diceModal")?.remove(); }
const MAP_VER = 16;
function newVersion(){ if ($("#verBanner")) return; const b = document.createElement("div"); b.id = "verBanner"; b.className = "toast"; b.style.bottom = "auto"; b.style.top = "64px"; b.innerHTML = "Tem uma versão nova do mapa. Aperte <b>Ctrl + F5</b> para atualizar."; document.body.appendChild(b); }
const stageQ = []; let stageBusy = false;
function addRoll(r, mine){
  r.fresh = true; r.mine = !!mine; if (mine) lastResult = r;
  if (diceModal && mine) openDiceModal("keep");
  if (r.snd) playSnd(r.snd);
  stageQ.push(r); if (!stageBusy) nextStage();
}
function finishRoll(r){
  r.fresh = false; diceLog.push(r); if (diceLog.length > 50) diceLog.shift(); drawDiceLog(true);
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
      <div class="ds-table">${r.dice.map((x, i) => `<span class="ds-slot" style="--i:${i};--dx:${Math.round((Math.random() * 2 - 1) * 240)}px;--rot:${Math.round((Math.random() * 2 - 1) * 900)}deg">${dieEl(x.d, "?", "huge rolling" + (x.x ? " dropwait" : ""), r.col)}<span class="ds-dl">d${x.d}</span></span>`).join("")}${r.mod ? `<span class="ds-mod">${r.mod > 0 ? "+" : "−"}${Math.abs(r.mod)}</span>` : ""}</div>
      <div class="ds-total" aria-live="polite"></div><div class="ds-tag"></div>
      <div class="ds-hint"></div></div>`;
  document.body.appendChild(st);
  const els = [...st.querySelectorAll(".ds-slot .die")], order = r.dice.map((x, i) => i);
  // o d20 que vale fica por último, para o suspense
  const d20i = r.dice.map((x, i) => i).filter(i => r.dice[i].d === 20 && !r.dice[i].x), pickV = v => d20i.find(i => r.dice[i].v === v);
  const key = pickV(20) ?? pickV(1) ?? (d20i.length ? d20i[0] : -1);   // o dado que decidiu o crítico/falha é o que ganha a animação
  if (key >= 0) { order.splice(order.indexOf(key), 1); order.push(key); }
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
    tot.classList.add("show"); count(); DS.reveal(); st.querySelector(".ds-hint").textContent = "clique para fechar";
    if (r.sfxDone) return finishRoll(r), setTimeout(close, 1500); r.sfxDone = true;
    if (nat === "crit") { st.classList.add("crit"); st.querySelector(".ds-tag").innerHTML = '<span class="crit-tag">⚔️ CRÍTICO! 20 natural ⚔️</span>'; critBurst(st, els[key]); DS.crit(); }
    else if (nat === "fumble") { st.classList.add("fumble"); st.querySelector(".ds-tag").innerHTML = '<span class="fumble-tag">💀 FALHA CRÍTICA… 1 natural</span>'; fumbleFx(st, els[key]); DS.fumble(); }
    finishRoll(r);
    setTimeout(close, fast ? 1100 : nat ? 3600 : 2300);
  }
  function close(){ if (done) return; done = true; st.classList.add("out"); setTimeout(() => { st.remove(); nextStage(); }, 300); }
  st.onclick = () => { if (st.querySelector(".ds-total.show")) close(); };   // antes do resultado, clicar não faz nada
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
  const r = {id: uid(), v: MAP_VER, who: isGM ? "Mestre" : (myNick || "Jogador"), label: label || "", ...res, secret: !!secret, snd: cleanSnd(snd)};
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
  sb.channel("mapa-db").on("postgres_changes", {event: "*", schema: "public", table: "map_state", filter: "id=eq." + ROW}, () => { clearTimeout(reloadT); reloadT = setTimeout(load, 80); }).subscribe();
  if (EDIT_ID) { // editando em outra aba: não entra na sala dos jogadores
    if (!isGM) { $("#gate").innerHTML = "Só o mestre pode editar mapas salvos."; $("#gate").hidden = false; return; }
    document.title = "✏️ " + (scene.lib?.n || "Mapa") + " · editando";
    $("#status").textContent = "modo edição · os jogadores não veem nada desta aba · tudo é salvo sozinho";
    drawTop(); drawDiceBar(); drawDiceLog(); requestAnimationFrame(frame); return;
  }
  chan = sb.channel("mapa", {config: {broadcast: {self: false}, presence: {key: myKey}}});
  chan.on("broadcast", {event: "tok"}, ({payload: p}) => {
    if (!p?.id) return;
    if (p.live) tokLive[p.id] = p.a != null ? {x: p.x, y: p.y, a: p.a} : {x: p.x, y: p.y};
    else {
      if (!isGM && p.q != null && lastReq[p.id] && p.q < lastReq[p.id]) return;   // resposta a um pedido antigo: ignora
      delete tokLive[p.id]; if (!isGM) delete pend[p.id];
      const t = tokens.find(x => x.id === p.id); if (t && !(walking === t.id)) { t.x = p.x; t.y = p.y; if (p.a != null) t.a = p.a; }
    }
    dirty = true;
  });
  chan.on("broadcast", {event: "endturn"}, ({payload: p}) => { // jogador terminou o turno
    if (!isGM || !scene.init?.on) return; const I = scene.init, e = I.list[I.cur]; if (!e || e.id !== p?.id) return;
    const o = String(iniOwner(e) || "").toLowerCase(); if (o !== "*" && o !== String(p.who || "").toLowerCase()) return;
    iniGo(1);
  });
  chan.on("broadcast", {event: "inires"}, ({payload: p}) => { // jogador rolou a iniciativa
    if (!isGM || !p?.id) return; const I = INI(), e = I.list.find(x => x.id === p.id); if (!e) return;
    const o = String(iniOwner(e) || "").toLowerCase(); if (o !== "*" && o !== String(p.who || "").toLowerCase()) return;
    e.v = +p.v || 0; if (!I.on) iniSort(); iniSave();
  });
  chan.on("broadcast", {event: "inistage"}, ({payload: p}) => { if (isGM || !Array.isArray(p?.items)) return;
    iniStage(p.items.slice(0, 40).map(x => ({n: String(x.n || "?").slice(0, 24), col: /^#[0-9a-f]{6}$/i.test(x.col || "") ? x.col : INI_GRAY, hid: false, f: String(x.f || "").slice(0, 40), mod: +x.mod || 0, total: +x.total || 0, dice: (x.dice || []).slice(0, 6).map(d => ({d: +d.d, v: +d.v, x: d.x ? 1 : 0}))}))); });
  chan.on("broadcast", {event: "iniask"}, ({payload: p}) => { if (!isGM && Array.isArray(p?.list)) iniAskPrompt(p.list); });
  chan.on("broadcast", {event: "hand"}, async () => { // o mestre mudou as anotações
    if (isGM) return; const before = new Set(handVisible().map(h => h.id + (h.at || ""))); await handLoad();
    const fresh = handVisible().filter(h => !before.has(h.id + (h.at || "")));
    if (fresh.length) { toast(`📜 O mestre liberou: ${fresh.map(h => h.t || "item").slice(0, 3).join(", ")}`); for (const h of fresh) { const b = $(h.cat === "mapa" ? "#pMaps" : "#pNotes"); if (b) b.querySelector(".tdot").hidden = false; } }
    if (panelKind === "hand") openHandPanel();
  });
  chan.on("broadcast", {event: "pop"}, ({payload: p}) => { // o mestre jogou algo na tela
    if (isGM || !p?.item) return; if (p.to !== "*" && String(p.to || "").toLowerCase() !== String(myNick || "").toLowerCase()) return;
    showHandout(p.item, true);
  });
  chan.on("broadcast", {event: "doorres"}, ({payload: p}) => { // resposta do mestre sobre uma porta
    if (isGM || !p?.k) return; delete pendDoor[p.k];
    const w = walls().find(x => x.d && x.p?.join(",") === p.k); if (w && (w.o ? 1 : 0) !== p.o) { w.o = p.o; wallsVer++; losCache.clear(); dirty = true; }
  });
  chan.on("broadcast", {event: "door"}, ({payload: p}) => { // jogador abriu/fechou uma porta: o mestre confere
    if (!isGM || !p?.k) return;
    const w = walls().find(x => x.d && !x.s && x.p?.join(",") === p.k); if (!w) return;
    const who = String(p.who || "").toLowerCase();
    const near = t => { const [mx, my] = doorMid(w), L = tokLive[t.id] || t; return Math.hypot(L.x - mx, L.y - my) <= G().size * 2.6 + tokR(t); };   // o mestre é mais tolerante (atraso da rede)
    if (!tokens.some(t => !isProp(t) && t.o && (t.o === "*" || t.o.toLowerCase() === who) && near(t))) return send("doorres", {k: p.k, o: w.o ? 1 : 0});
    w.o = w.o ? 0 : 1; wallsChanged(); send("doorres", {k: p.k, o: w.o}); toast(`${p.who || "Jogador"} ${w.o ? "abriu" : "fechou"} uma porta.`, 1800);
  });
  chan.on("broadcast", {event: "tokreq"}, ({payload: p}) => { // jogador moveu/girou o próprio token: o mestre confere e salva
    if (!isGM || !p?.id) return;
    const t = tokens.find(x => x.id === p.id); if (!t || !t.o) return;
    if (t.o !== "*" && String(p.who || "").toLowerCase() !== t.o.toLowerCase()) return;
    if (p.x != null) {
      const [x, y] = t.sn === false ? [Math.round(p.x), Math.round(p.y)] : snapPoint(p.x, p.y, t.s || 1);
      if (!validPath(t, p.path)) { send("tok", {id: t.id, x: t.x, y: t.y, a: t.a, q: p.q}); return; } // caminho inválido (parede ou longe demais): devolve
      pushTrail(t, p.path); t.x = x; t.y = y;
    }
    if (p.a != null) t.a = ((+p.a % 360) + 360) % 360;
    if (p.bi != null && t.b?.[p.bi] && isFinite(+p.bv)) t.b[p.bi].v = Math.round(+p.bv);
    delete tokLive[t.id]; send("tok", {id: t.id, x: t.x, y: t.y, a: t.a, q: p.q}); save("tokens", true, 600); dirty = true;
  });
  chan.on("presence", {event: "sync"}, () => {
    const st = chan.presenceState();
    peersOnMap = [...new Set(Object.values(st).map(a => a[a.length - 1]).filter(x => x?.role === "player" && x.name).map(x => x.name))];
  });
  chan.on("broadcast", {event: "ruler"}, ({payload: p}) => { if (!p?.k) return; if (p.r) rulers[p.k] = p.r; else delete rulers[p.k]; dirty = true; });
  chan.on("broadcast", {event: "state"}, ({payload: p}) => { if (!isGM && p?.col) apply({[p.col]: p.val}); });
  if (!isGM) setInterval(load, 20000);                 // rede de segurança
  chan.on("broadcast", {event: "roll"}, ({payload: r}) => { if (+r?.v > MAP_VER) newVersion(); if (r?.id && Array.isArray(r.dice) && !diceLog.some(x => x.id === String(r.id)) && !stageQ.some(x => x.id === String(r.id))) addRoll({snd: cleanSnd(r.snd), id: String(r.id), who: String(r.who || "?").slice(0, 30), label: String(r.label || "").slice(0, 30), f: String(r.f || "").slice(0, 60), mod: +r.mod || 0, total: +r.total || 0, dice: r.dice.slice(0, 60).filter(x => x.d >= 2 && x.d <= 1000).map(x => ({d: +x.d, v: +x.v, x: x.x ? 1 : 0})), secret: false, col: /^#[0-9a-f]{6}$/i.test(r.col || "") ? r.col : null}); });
  chan.on("broadcast", {event: "ping"}, ({payload: p}) => { if (!p || !isFinite(+p.x)) return; addPing(p); if (p.center && !isGM) centerOn(+p.x, +p.y, Math.max(cam.z, .8)); });
  chan.on("broadcast", {event: "tpl"}, ({payload: p}) => {
    if (p?.op === "del") { delete ptpls[p.id]; if (selTpl === p.id) { selTpl = null; drawTplBar(); } }
    else if (p?.op === "set" && p.t?.id && ["circle", "cone", "line", "square"].includes(p.t.sh)) { const t = p.t; ptpls[t.id] = {id: String(t.id), t: "tpl", n: String(t.n || "").slice(0, 30), ic: String(t.ic || "✨").slice(0, 4), sh: t.sh, r: Math.min(60, Math.max(1, +t.r || 3)), wd: +t.wd || undefined, c: /^#[0-9a-f]{6}$/i.test(t.c) ? t.c : "#ffe28a", x: +t.x || 0, y: +t.y || 0, a: +t.a || 0, own: String(t.own || "")}; }
    dirty = true;
  });
  chan.on("broadcast", {event: "view"}, ({payload: p}) => { if (!isGM && p) { centerOn(p.x, p.y, p.z); toast("O mestre levou você para esta parte do mapa."); } });
  chan.subscribe(st => { if (st === "SUBSCRIBED") chan.track({name: isGM ? "Mestre" : myNick, role: isGM ? "gm" : "player"}); $("#status").textContent = st === "SUBSCRIBED" ? (isGM ? "ao vivo · jogadores veem o que você fizer" : "ao vivo") : "reconectando…"; });
  drawDiceBar(); drawDiceLog(); vDraw();
  requestAnimationFrame(frame);
}
boot();

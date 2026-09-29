"use strict";
// Mesa Sonora · Mapa de batalha (grid, tokens, névoa, desenhos, régua)
const $ = (s, r = document) => r.querySelector(s);
const esc = s =>
  String(s ?? "").replace(
    /[&<>"']/g,
    c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const uid = () => Math.random().toString(36).slice(2, 10);
const SQ3 = Math.sqrt(3);
const I = {
  move: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3l14 8-6 2-2 6z"/></svg>',
  ruler:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2m1-5 2 2m1-5 2 2"/></svg>',
  draw: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l4-1L19 8l-3-3L5 16z"/><path d="m14 7 3 3"/></svg>',
  erase:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="m4 15 9-9 7 7-6 6H8z"/><path d="M8 19h12M9 10l6 6"/></svg>',
  fog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  token:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6.5 18.5c1.5-2.5 3.3-3.5 5.5-3.5s4 1 5.5 3.5"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  minus:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14"/></svg>',
  fit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  cast: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="2"/><path d="M8.5 8.5a5 5 0 0 0 0 7m7 0a5 5 0 0 0 0-7M5.6 5.6a9 9 0 0 0 0 12.8m12.8 0a9 9 0 0 0 0-12.8"/></svg>',
  pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 17c3-6 5 2 8-3s5-6 10-4"/></svg>',
  line: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20 20 4"/></svg>',
  circle:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/></svg>',
  cone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 12 20 4v16z"/></svg>',
  rect: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="5" width="16" height="14" rx="1"/></svg>',
  brush:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 4l6 6-8 8H6v-6z"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>',
};
I.spell =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20 14 10"/><path d="m15 3 1.5 3.5L20 8l-3.5 1.5L15 13l-1.5-3.5L10 8l3.5-1.5z"/></svg>';
I.box =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 7 12 3l9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/></svg>';
I.wall =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 5h18v14H3z"/><path d="M3 10h18M3 15h18M9 5v5m6 0v5m-6 0v4m6 0v4"/></svg>';
I.list =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.5"/><circle cx="4.5" cy="12" r="1.5"/><circle cx="4.5" cy="18" r="1.5"/></svg>';
I.dungeon =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 3h7v5h4V3h7v7h-5v4h5v7h-7v-5h-4v5H3v-7h5v-4H3z"/></svg>';
I.maps =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/></svg>';
I.notes =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M6 3h11a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6z"/><path d="M6 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2M9 8h6M9 12h6M9 16h4"/></svg>';
I.swords =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M9.5 17.5 21 6V3h-3L6.5 14.5M11 19l-6-6M8 16l-4 4M5 21l-2-2"/></svg>';
I.door =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 21V4l10-1v18"/><path d="M3 21h18"/><circle cx="12" cy="12" r="1"/></svg>';
I.sheet =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M7 3h10l3 3v15H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z"/><circle cx="12" cy="10" r="2.5"/><path d="M8.5 17c.8-2 2-3 3.5-3s2.7 1 3.5 3"/></svg>';
I.beast =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><ellipse cx="12" cy="16" rx="4.5" ry="3.8"/><circle cx="5.5" cy="10.5" r="2"/><circle cx="9.5" cy="6.5" r="2"/><circle cx="14.5" cy="6.5" r="2"/><circle cx="18.5" cy="10.5" r="2"/></svg>';
I.music =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>';
const COLORS = ["#d0a54c", "#c0473a", "#4a72b8", "#5f9a4a", "#8a5bb0", "#e07b2e", "#e8e2d0", "#222222"];

// ---------- estado ----------
// modo edição: mapa.html?edit=ID abre um mapa salvo em outra aba; nada daqui chega aos jogadores
const EDIT_ID = +new URLSearchParams(location.search).get("edit") || 0,
  ROW = EDIT_ID || 1;
let sb = null,
  chan = null,
  isGM = false;
let scene = {
  bg: null,
  bgW: 0,
  bgH: 0,
  grid: {
    type: "square",
    size: 70,
    ox: 0,
    oy: 0,
    color: "#000000",
    alpha: 0.35,
    show: true,
    unit: 1.5,
    unitName: "m",
  },
};
let tokens = [],
  fog = { on: false, cells: {} },
  drawings = [];
const cam = { x: 0, y: 0, z: 1 }; // tela = mundo * z + (x, y)
let tool = "move";
const opt = {
  draw: "pen",
  color: "#c0473a",
  width: 4,
  fog: "reveal",
  fogShape: "brush",
  brush: 1,
  wall: "wall",
};
let wallDraft = null,
  hoverWall = null,
  wallsVer = 0,
  gmPreview = false;
let dirty = true,
  bgImg = null,
  bgUrlLoaded = null;
const imgCache = new Map();
let drag = null,
  hoverFog = null;
const lastSave = {}; // interação em andamento
let rulers = {}; // réguas ao vivo {key: {a, b}}
let tokLive = {}; // posições temporárias vindas por broadcast
let selTok = null;
let myNick = "";
try {
  myNick = localStorage.getItem("mesa.nick") || "";
} catch {}
let peersOnMap = []; // nomes de quem está no mapa agora
const myKey = (crypto.randomUUID?.() || String(Math.random())).slice(0, 10);
let spaceDown = false;

const cv = $("#board"),
  ctx = cv.getContext("2d");
function resize() {
  const d = devicePixelRatio || 1;
  cv.width = innerWidth * d;
  cv.height = innerHeight * d;
  cv.style.width = innerWidth + "px";
  cv.style.height = innerHeight + "px";
  dirty = true;
}
addEventListener("resize", resize);
resize();

function toast(msg, ms = 3000) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), ms);
}

// ---------- geometria da grid ----------
const G = () => scene.grid;
const toWorld = (sx, sy) => [(sx - cam.x) / cam.z, (sy - cam.y) / cam.z];
const FL = () => G().type === "hex" && !!G().flat; // hexágono "deitado" = grid em pé com x e y trocados
const toL = (x, y) => {
  const g = G();
  return FL() ? [y - g.oy, x - g.ox] : [x - g.ox, y - g.oy];
};
const fromL = (X, Y) => {
  const g = G();
  return FL() ? [g.ox + Y, g.oy + X] : [g.ox + X, g.oy + Y];
};
function hexCornersL(X, Y, R) {
  const out = [];
  for (let i = 0; i < 6; i++) {
    const an = (Math.PI / 180) * (60 * i - 30);
    out.push(fromL(X + R * Math.cos(an), Y + R * Math.sin(an)));
  }
  return out;
}
function cellAt(x, y) {
  const g = G();
  if (g.type === "hex") {
    const R = g.size / SQ3,
      [px, py] = toL(x, y);
    let q = ((SQ3 / 3) * px - py / 3) / R,
      r = ((2 / 3) * py) / R,
      s = -q - r;
    let rq = Math.round(q),
      rr = Math.round(r),
      rs = Math.round(s);
    const dq = Math.abs(rq - q),
      dr = Math.abs(rr - r),
      ds = Math.abs(rs - s);
    if (dq > dr && dq > ds) rq = -rr - rs;
    else if (dr > ds) rr = -rq - rs;
    return [rq, rr];
  }
  return [Math.floor((x - g.ox) / g.size), Math.floor((y - g.oy) / g.size)];
}
function cellCenterL(a, b) {
  const g = G(),
    R = g.size / SQ3;
  return [g.size * (a + b / 2), 1.5 * R * b];
}
function cellCenter(a, b) {
  const g = G();
  if (g.type === "hex") return fromL(...cellCenterL(a, b));
  return [g.ox + (a + 0.5) * g.size, g.oy + (b + 0.5) * g.size];
}
function cellPath(c, a, b) {
  const g = G();
  if (g.type === "hex") {
    const pts = hexCornersL(...cellCenterL(a, b), g.size / SQ3 + 0.6 / cam.z);
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
  } else {
    const [cx, cy] = cellCenter(a, b),
      h = g.size / 2 + 0.5 / cam.z;
    c.rect(cx - h, cy - h, h * 2, h * 2);
  }
}
function cellDist(a1, b1, a2, b2) {
  if (G().type === "hex") {
    const dq = a1 - a2,
      dr = b1 - b2;
    return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
  }
  return Math.max(Math.abs(a1 - a2), Math.abs(b1 - b2));
}
function cellsInRange(a, b, n) {
  // células a no máximo n-1 passos
  const out = [],
    k = n - 1;
  for (let i = -k; i <= k; i++)
    for (let j = -k; j <= k; j++) {
      const ca = a + i,
        cb = b + j;
      if (G().type === "hex" ? cellDist(a, b, ca, cb) <= k : i * i + j * j <= k * k + k) out.push([ca, cb]);
    }
  return out;
}
function snapPoint(x, y, cells = 1) {
  const g = G();
  if (g.type === "square" && cells % 2 === 0)
    return [g.ox + Math.round((x - g.ox) / g.size) * g.size, g.oy + Math.round((y - g.oy) / g.size) * g.size];
  const [a, b] = cellAt(x, y);
  return cellCenter(a, b);
}
function visibleWorld() {
  const [x0, y0] = toWorld(0, 0),
    [x1, y1] = toWorld(innerWidth, innerHeight);
  return { x0, y0, x1, y1 };
}
function unitsFor(cells) {
  const g = G();
  const v = Math.round(cells * g.unit * 10) / 10;
  return `${cells} ${cells === 1 ? "casa" : "casas"} · ${String(v).replace(".", ",")} ${g.unitName}`;
}
const fogSig = () => `${G().type}${FL() ? "f" : ""}:${G().size}:${G().ox}:${G().oy}`;

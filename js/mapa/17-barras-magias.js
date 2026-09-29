"use strict";
// ---------- barrinhas: botão ✎ ao lado delas no mapa e edição grande em cima do token ----------
let barBtn = null,
  barEdId = null,
  barAdd = false;
const BAR_COLORS = ["#c0473a", "#3b6fc9", "#3fae4a", "#d0a54c", "#8a5bb0", "#e07b2e", "#4ab8b0", "#e8e2d0"];
function barsOf(t) {
  return (t.b || []).filter(b => b && ((b.v !== "" && b.v != null) || (b.m !== "" && b.m != null)));
}
function barSave(t, whole) {
  // mestre salva; jogador pede ao mestre
  dirty = true;
  selBarKey = "";
  if (isGM) {
    save("tokens");
    return;
  }
  tokReq({ id: t.id, bars: (t.b || []).map(b => ({ n: b.n || "", v: b.v, m: b.m, c: b.c })), who: myNick });
}
function barSet(t, i, v) {
  const b = t.b?.[i];
  if (!b) return;
  const m = +b.m;
  v = Math.round(v);
  if (m > 0) v = Math.max(-999, Math.min(v, m * 3));
  b.v = v;
  barSave(t);
  shFromTokenPV(t, i);
  drawBarEd();
}
function openBarEd(t) {
  barEdId = t.id;
  barAdd = !barsOf(t).length;
  drawBarEd();
}
function closeBarEd() {
  barEdId = null;
  barAdd = false;
  $("#barEd")?.remove();
  dirty = true;
}
function drawBarEd() {
  const t = tokens.find(x => x.id === barEdId);
  if (!t || !(isGM || owns(t))) return closeBarEd();
  let el = $("#barEd");
  if (!el) {
    el = document.createElement("div");
    el.id = "barEd";
    el.className = "bared";
    document.body.appendChild(el);
    el.onpointerdown = e => e.stopPropagation();
  }
  const list = (t.b || [])
    .map((b, i) => ({ ...b, i }))
    .filter(b => (b.v !== "" && b.v != null) || (b.m !== "" && b.m != null));
  el.innerHTML = `<div class="be-head"><b>${esc(t.n || "Token")}</b><span class="spacer"></span><button class="be-x" data-be="close" title="Fechar (Esc)">✕</button></div>
    ${list
      .map(b => {
        const v = +b.v || 0,
          m = +b.m,
          pct = m > 0 ? Math.max(0, Math.min(100, (v / m) * 100)) : 100;
        return `<div class="be-row">
      <button data-bd="${b.i}" data-d="-10">−10</button><button data-bd="${b.i}" data-d="-5">−5</button><button data-bd="${b.i}" data-d="-1">−1</button>
      <div class="be-bar" style="--bc:${esc(b.c || "#c0473a")}"><i style="width:${pct}%"></i><span>${b.n ? `<small>${esc(b.n)}</small> ` : ""}<input data-bv="${b.i}" value="${esc(b.v ?? "")}" inputmode="numeric" aria-label="Valor">${m > 0 || b.m === 0 ? `<em>/</em><input data-bm="${b.i}" value="${esc(b.m)}" inputmode="numeric" aria-label="Máximo" class="bm">` : ""}</span></div>
      <button data-bd="${b.i}" data-d="1">+1</button><button data-bd="${b.i}" data-d="5">+5</button><button data-bd="${b.i}" data-d="10">+10</button>
      <button class="be-del" data-bdel="${b.i}" title="Apagar esta barrinha">🗑</button></div>`;
      })
      .join("")}
    ${
      barAdd
        ? `<div class="be-new"><input id="beN" maxlength="16" placeholder="Nome (ex.: Mana)"><input id="beM" inputmode="numeric" placeholder="Máximo" style="width:70px">
        <div class="be-cols">${BAR_COLORS.map((c, k) => `<button data-bc="${c}" style="background:${c}" aria-pressed="${k === list.length % BAR_COLORS.length}"></button>`).join("")}</div>
        <button class="btn small primary" data-be="add">Criar</button>${list.length ? `<button class="btn small" data-be="cancel">Cancelar</button>` : ""}</div>`
        : `<button class="btn small be-plus" data-be="new">＋ Nova barrinha</button>`
    }`;
  let pickCol = BAR_COLORS[list.length % BAR_COLORS.length];
  el.onclick = e => {
    const b = e.target.closest("button");
    if (!b) return;
    const d = b.dataset,
      cur = tokens.find(x => x.id === barEdId);
    if (!cur) return;
    if (d.bd != null) barSet(cur, +d.bd, (+cur.b[+d.bd].v || 0) + +d.d);
    else if (d.bdel != null) {
      if (confirm("Apagar esta barrinha?")) {
        cur.b.splice(+d.bdel, 1);
        barSave(cur);
        drawBarEd();
      }
    } else if (d.bc) {
      pickCol = d.bc;
      el.querySelectorAll("[data-bc]").forEach(x => x.setAttribute("aria-pressed", x === b));
    } else if (d.be === "close") closeBarEd();
    else if (d.be === "new") {
      barAdd = true;
      drawBarEd();
      setTimeout(() => $("#beN")?.focus(), 20);
    } else if (d.be === "cancel") {
      barAdd = false;
      drawBarEd();
    } else if (d.be === "add") {
      const m = Math.max(0, Math.round(+$("#beM").value || 0));
      cur.b = (cur.b || []).filter(x => x && ((x.v !== "" && x.v != null) || (x.m !== "" && x.m != null)));
      if (cur.b.length >= 8) return toast("Máximo de 8 barrinhas.");
      cur.b.push({ n: $("#beN").value.trim().slice(0, 16), v: m || 0, m: m || "", c: pickCol });
      barAdd = false;
      barSave(cur);
      drawBarEd();
    }
  };
  el.querySelectorAll("input").forEach(inp => {
    inp.onkeydown = e => {
      e.stopPropagation();
      if (e.key === "Enter") {
        if (inp.id === "beN" || inp.id === "beM") el.querySelector('[data-be="add"]')?.click();
        else inp.blur();
      }
      if (e.key === "Escape") closeBarEd();
    };
    if (inp.dataset.bv != null || inp.dataset.bm != null)
      inp.onchange = () => {
        const cur = tokens.find(x => x.id === barEdId);
        if (!cur) return;
        const i = +(inp.dataset.bv ?? inp.dataset.bm),
          raw = inp.value.trim().replace(",", ".");
        if (inp.dataset.bv != null) {
          const old = +cur.b[i].v || 0,
            v = /^[+-]/.test(raw) ? old + +raw : +raw;
          if (raw !== "" && isFinite(v)) barSet(cur, i, v);
        } else {
          const m = Math.max(0, Math.round(+raw || 0));
          cur.b[i].m = m || "";
          barSave(cur);
          drawBarEd();
        }
      };
    inp.onfocus = () => inp.select();
  });
  placeBarEd();
}
function placeBarEd() {
  // acompanha o token quando a câmera mexe
  const el = $("#barEd");
  if (!el) return;
  const t = (curTs || tokens).find(x => x.id === barEdId);
  if (!t) return;
  const sx = t.x * cam.z + cam.x,
    sy = (t.y - tokR(t)) * cam.z + cam.y - 10,
    w = el.offsetWidth,
    h = el.offsetHeight;
  el.style.left = Math.max(8, Math.min(innerWidth - w - 8, sx - w / 2)) + "px";
  el.style.top = Math.max(60, Math.min(innerHeight - h - 120, sy - h)) + "px";
}
function paintBarBtn(t, x, y, s) {
  // botãozinho ✎ ao lado das barrinhas do token selecionado
  ctx.save();
  ctx.fillStyle = barEdId === t.id ? "#ffd76a" : "rgba(23,19,15,.92)";
  ctx.strokeStyle = "#ffd76a";
  ctx.lineWidth = 1.5 / cam.z;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(x, y, s, s, 3 / cam.z) : ctx.rect(x, y, s, s);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = barEdId === t.id ? "#1c150c" : "#ffd76a";
  ctx.font = `700 ${s * 0.72}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(barsOf(t).length ? "✎" : "+", x + s / 2, y + s / 2 + s * 0.04);
  ctx.restore();
  barBtn = { id: t.id, x, y, s };
}

// ---------- pings (Alt + clique) ----------
let pings = [];
const nameColor = n => {
  let h = 0;
  for (const ch of String(n)) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(${h} 75% 62%)`;
};
function addPing(p) {
  pings.push({
    x: +p.x,
    y: +p.y,
    who: String(p.who || "").slice(0, 30),
    c: String(p.c || "#ffe28a").slice(0, 30),
    t0: performance.now(),
  });
  if (DS.init()) {
    const t = DS.ctx.currentTime;
    DS.tone(t, 1320, 0.18, 0.16, "sine");
    DS.tone(t + 0.09, 1760, 0.28, 0.13, "sine");
  }
  dirty = true;
}
function paintPings() {
  const now = performance.now();
  pings = pings.filter(p => now - p.t0 < 2800);
  for (const p of pings) {
    const age = now - p.t0,
      R = 46 / cam.z;
    ctx.save();
    for (let k = 0; k < 3; k++) {
      const f = (age / 900 + k / 3) % 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6 / cam.z + f * R, 0, Math.PI * 2);
      ctx.strokeStyle = p.c;
      ctx.globalAlpha = (1 - f) * Math.max(0, 1 - age / 2800) * 0.95;
      ctx.lineWidth = 3 / cam.z;
      ctx.stroke();
    }
    ctx.globalAlpha = Math.max(0, 1 - age / 2800);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6 / cam.z, 0, Math.PI * 2);
    ctx.fillStyle = p.c;
    ctx.fill();
    if (p.who) label(p.x, p.y, p.who);
    ctx.restore();
  }
}
function doPing(wx, wy, center) {
  const p = {
    x: Math.round(wx),
    y: Math.round(wy),
    who: isGM ? "Mestre" : myNick || "Jogador",
    c: isGM ? "#ffe28a" : nameColor(myNick),
    center: !!center,
  };
  send("ping", p);
  addPing(p);
  if (center) toast("Todos foram levados até o ponto.");
}

// ---------- rastro dos movimentos ----------
let showTrails = false;
function pushTrail(t, pts) {
  if (!pts || pts.length < 2) return;
  t.tr = [pts.map(([x, y]) => [Math.round(x), Math.round(y)])]; // guarda só o último movimento
}
function paintTrail(t) {
  const tr = t.tr;
  if (!tr?.length) return;
  ctx.save();
  ctx.lineCap = ctx.lineJoin = "round";
  tr.forEach((mv, k) => {
    const al = 0.25 + (0.6 * (k + 1)) / tr.length;
    ctx.globalAlpha = al;
    ctx.beginPath();
    mv.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.strokeStyle = "rgba(0,0,0,.5)";
    ctx.lineWidth = 5 / cam.z;
    ctx.stroke();
    ctx.strokeStyle = t.c || "#d0a54c";
    ctx.lineWidth = 2.5 / cam.z;
    ctx.setLineDash([2 / cam.z, 6 / cam.z]);
    ctx.stroke();
    ctx.setLineDash([]);
    mv.forEach(([x, y], i) => {
      if (!i) return;
      ctx.beginPath();
      ctx.arc(x, y, 3 / cam.z, 0, Math.PI * 2);
      ctx.fillStyle = t.c || "#d0a54c";
      ctx.fill();
    });
    const [x0, y0] = mv[0];
    ctx.beginPath();
    ctx.arc(x0, y0, 5 / cam.z, 0, Math.PI * 2);
    ctx.strokeStyle = t.c || "#d0a54c";
    ctx.lineWidth = 2 / cam.z;
    ctx.stroke();
  });
  ctx.restore();
}

// ---------- áreas de magia ----------
const SPELLS = [
  { n: "Bola de fogo", ic: "🔥", sh: "circle", r: 6, c: "#ff6a1f" },
  { n: "Cone de frio", ic: "❄️", sh: "cone", r: 18, c: "#7fd4ff" },
  { n: "Mãos flamejantes", ic: "🔥", sh: "cone", r: 4.5, c: "#ff8a2a" },
  { n: "Relâmpago", ic: "⚡", sh: "line", r: 30, wd: 1.5, c: "#ffe45c" },
  { n: "Nuvem fétida", ic: "☁️", sh: "circle", r: 6, c: "#9adf7a" },
  { n: "Escuridão", ic: "🌑", sh: "circle", r: 4.5, c: "#6a4aa8" },
  { n: "Teia", ic: "🕸️", sh: "square", r: 6, c: "#e8e2d0" },
  { n: "Muralha de fogo", ic: "🧱", sh: "line", r: 18, wd: 0.3, c: "#ff5a2a" },
  { n: "Luz / Aura", ic: "✨", sh: "circle", r: 9, c: "#fff2a8" },
  { n: "Terremoto", ic: "🌋", sh: "circle", r: 15, c: "#b0563d" },
  { n: "Onda trovejante", ic: "💥", sh: "square", r: 4.5, c: "#8fb0ff" },
  { n: "Veneno", ic: "☠️", sh: "circle", r: 3, c: "#5fbf4a" },
];
let spellSel = 0,
  spellCustom = null,
  ptpls = {}; // ptpls: magias temporárias dos jogadores (só ao vivo)
const curSpell = () => spellCustom || SPELLS[spellSel];
function tplShape(c, tp) {
  const L = unitPx(tp.r),
    [vx, vy] = dirVec(tp.a || 0),
    px = -vy,
    py = vx;
  if (tp.sh === "circle") {
    c.moveTo(tp.x + L, tp.y);
    c.arc(tp.x, tp.y, L, 0, Math.PI * 2);
  } else if (tp.sh === "square") {
    const h = L / 2;
    const P = [
      [-h, -h],
      [h, -h],
      [h, h],
      [-h, h],
    ].map(([u, v]) => [tp.x + u * px + v * -vx, tp.y + u * py + v * -vy]);
    P.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
  } else if (tp.sh === "cone") {
    const h = L / 2;
    c.moveTo(tp.x, tp.y);
    c.lineTo(tp.x + vx * L + px * h, tp.y + vy * L + py * h);
    c.lineTo(tp.x + vx * L - px * h, tp.y + vy * L - py * h);
    c.closePath();
  } else {
    const h = unitPx(tp.wd || 1.5) / 2;
    const P = [
      [tp.x + px * h, tp.y + py * h],
      [tp.x + vx * L + px * h, tp.y + vy * L + py * h],
      [tp.x + vx * L - px * h, tp.y + vy * L - py * h],
      [tp.x - px * h, tp.y - py * h],
    ];
    P.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
  }
}
const hitCtx = document.createElement("canvas").getContext("2d");
function tplPath(tp) {
  const P = new Path2D();
  tplShape(P, tp);
  return P;
}
function inTpl(tp, x, y, P) {
  return hitCtx.isPointInPath(P || tplPath(tp), x, y);
}
function tplCenter(tp) {
  if (tp.sh === "circle" || tp.sh === "square") return [tp.x, tp.y];
  const [vx, vy] = dirVec(tp.a || 0),
    L = unitPx(tp.r);
  return [tp.x + vx * L * (tp.sh === "cone" ? 0.62 : 0.5), tp.y + vy * L * (tp.sh === "cone" ? 0.62 : 0.5)];
}
function tplHandle(tp) {
  const [vx, vy] = dirVec(tp.a || 0),
    L = unitPx(tp.r);
  return tp.sh === "circle"
    ? [tp.x + L, tp.y]
    : tp.sh === "square"
      ? [tp.x + vx * L * 0.5, tp.y + vy * L * 0.5]
      : [tp.x + vx * L, tp.y + vy * L];
}
function paintTpl(tp, sel) {
  const L = unitPx(tp.r),
    n = Math.ceil(L / G().size) + 2,
    [ca, cb] = cellAt(...tplCenter(tp));
  ctx.save();
  const TP = tplPath(tp);
  ctx.beginPath();
  for (const [a, b] of cellsInRange(ca, cb, n)) {
    const [x, y] = cellCenter(a, b);
    if (inTpl(tp, x, y, TP)) cellPath(ctx, a, b);
  }
  ctx.fillStyle = tp.c;
  ctx.globalAlpha = 0.16;
  ctx.fill();
  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = tp.c;
  ctx.lineWidth = 1 / cam.z;
  ctx.stroke();
  ctx.beginPath();
  tplShape(ctx, tp);
  const [cx, cy] = tplCenter(tp),
    gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, L);
  gr.addColorStop(0, tp.c + "88");
  gr.addColorStop(1, tp.c + "22");
  ctx.globalAlpha = 1;
  ctx.fillStyle = gr;
  ctx.fill();
  ctx.strokeStyle = tp.c;
  ctx.lineWidth = (sel ? 3.5 : 2.5) / cam.z;
  ctx.setLineDash(sel ? [8 / cam.z, 5 / cam.z] : []);
  ctx.stroke();
  ctx.setLineDash([]);
  const fs = Math.max(13 / cam.z, Math.min(L * 0.35, 34));
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (G().size * cam.z > 18) {
    ctx.font = `700 ${Math.max(11 / cam.z, fs * 0.38)}px "Alegreya Sans", sans-serif`;
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 4;
    ctx.fillText(`${tp.n} · ${String(tp.r).replace(".", ",")} ${G().unitName}`, cx, cy);
    ctx.shadowColor = "transparent";
  }
  if (sel) {
    const [hx, hy] = tplHandle(tp);
    ctx.beginPath();
    ctx.arc(hx, hy, 7 / cam.z, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1 / cam.z;
    ctx.stroke();
  }
  ctx.restore();
}
let selTpl = null; // {id, mine: bool (temporária do jogador) }
const allTpls = () => [
  ...drawings.filter(d => d.t === "tpl").map(t => ({ t, gm: true })),
  ...Object.values(ptpls).map(t => ({ t, gm: false })),
];
function canEditTpl(e) {
  return e.gm ? isGM : e.t.own === myKey || isGM;
}
function hitTpl(x, y) {
  const L = allTpls();
  for (let i = L.length - 1; i >= 0; i--) if (canEditTpl(L[i]) && inTpl(L[i].t, x, y)) return L[i];
  return null;
}
function tplCommit(e) {
  if (e.gm) save("drawings");
  else {
    ptpls[e.t.id] = e.t;
    send("tpl", { op: "set", t: e.t });
  }
  dirty = true;
  drawTplBar();
}
function tplRemove(e) {
  if (e.gm) {
    drawings = drawings.filter(d => d.id !== e.t.id);
    save("drawings");
  } else {
    delete ptpls[e.t.id];
    send("tpl", { op: "del", id: e.t.id });
  }
  selTpl = null;
  dirty = true;
  drawTplBar();
}
function curTpl() {
  if (!selTpl) return null;
  const e = allTpls().find(x => x.t.id === selTpl);
  return e || null;
}
function drawTplBar() {
  let el = $("#tplbar");
  if (!el) {
    el = document.createElement("div");
    el.id = "tplbar";
    el.className = "selbar";
    document.body.appendChild(el);
  }
  const e = curTpl();
  if (!e) {
    el.hidden = true;
    return;
  }
  el.hidden = false;
  el.innerHTML = `<div class="sbrow"><b>${esc(e.t.ic || "")} ${esc(e.t.n)}</b><button class="btn small" data-tp="-">−</button><span>${String(e.t.r).replace(".", ",")} ${esc(G().unitName)}</span><button class="btn small" data-tp="+">+</button>
    ${e.gm || !isGM ? "" : `<button class="btn small" data-tp="keep" title="Guardar no mapa">Fixar</button>`}<button class="btn small danger" data-tp="del">Remover</button></div>`;
  el.onclick = ev => {
    const b = ev.target.closest("[data-tp]");
    if (!b) return;
    const k = b.dataset.tp,
      cur = curTpl();
    if (!cur) return;
    if (k === "del") return tplRemove(cur);
    if (k === "keep") {
      const t = { ...cur.t };
      delete t.own;
      delete ptpls[t.id];
      send("tpl", { op: "del", id: t.id });
      drawings.push(t);
      save("drawings");
      dirty = true;
      return drawTplBar();
    }
    const st = cur.t.r >= 9 ? 3 : 1.5;
    cur.t.r = Math.max(1.5, Math.round((cur.t.r + (k === "+" ? st : -st)) * 10) / 10);
    tplCommit(cur);
  };
}
function segsCross([ax, ay], [bx, by], [cx, cy, dx, dy]) {
  const d1 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax),
    d2 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
  const d3 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx),
    d4 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
  return d1 > 0 !== d2 > 0 && d3 > 0 !== d4 > 0 && d1 && d2 && d3 && d4;
}
// objetos sólidos: ninguém (jogador) atravessa. Tapetes, escadas, ossos, armadilhas etc. dão para pisar.
const WALKABLE = new Set([
  "tapete",
  "tapete-redondo",
  "pele-urso",
  "sangue",
  "agua-rasa",
  "flores",
  "moita",
  "trigo",
  "plantacao",
  "galhos",
  "nenufares",
  "escada",
  "escada-sobe",
  "escada-mao",
  "alcapao",
  "espinhos",
  "buraco",
  "grade-chao",
  "teia",
  "circulo-ritual",
  "ossos",
  "cranios",
  "esqueleto",
  "cogumelos",
  "cogumelos-brilho",
  "ponte",
  "saco-dormir",
  "velas",
  "ouro",
  "livros",
  "pergaminho",
  "espada",
  "escudo",
  "pocoes",
  "mapa-mesa",
  "tocha-parede",
  "estaca-cavalo",
  "mochila",
  "grilhoes",
  "tocha",
  "escombros",
]);
const propId = t =>
  String(t.img || "")
    .split("/")
    .pop()
    .replace(/\.svg(\?.*)?$/, "");
const propSolid = t => isProp(t) && !t.h && (t.so != null ? !!t.so : !WALKABLE.has(propId(t)));
function solidAt(x, y) {
  // ponto dentro de algum objeto sólido?
  for (const t of tokens) {
    if (!propSolid(t)) continue;
    const [W, H] = propSize(t),
      [lx, ly] = propLocal(t, x, y);
    if (
      t.blk === "circle"
        ? Math.hypot(lx / (W / 2), ly / (H / 2)) <= 0.85
        : Math.abs(lx) <= (W / 2) * 0.92 && Math.abs(ly) <= (H / 2) * 0.92
    )
      return t;
  }
  return null;
}
const cornerHit = (x1, y1, x2, y2, w) => {
  // o movimento passa bem em cima da ponta de uma parede (canto em L)?
  for (const [px, py] of [
    [w[0], w[1]],
    [w[2], w[3]],
  ]) {
    if (Math.hypot(px - x1, py - y1) < 1 || Math.hypot(px - x2, py - y2) < 1) continue;
    if (distSeg(px, py, [x1, y1], [x2, y2]) < 1.5) return true;
  }
  return false;
};
const blockedMove = (x1, y1, x2, y2) => {
  if (blocking().some(w => segsCross([x1, y1], [x2, y2], w) || cornerHit(x1, y1, x2, y2, w))) return true;
  const s = solidAt(x2, y2);
  return !!s && s !== solidAt(x1, y1);
};
// memória: o mestre anota as casas que o grupo já viu e salva no banco
let exPrevEl = null,
  exT = null,
  exImgEl = null,
  exImgSrc = null,
  exC = null,
  exReady = false;
function exImage() {
  // imagem da memória vinda do banco
  const src = fog.exImg;
  if (!src) {
    exPrevEl = null;
    return null;
  }
  if (src !== exImgSrc) {
    exImgSrc = src;
    const im = new Image();
    im.onload = () => {
      exPrevEl = im;
      dirty = true;
    };
    im.src = src;
    exImgEl = im;
  }
  return exImgEl.complete && exImgEl.naturalWidth ? exImgEl : exPrevEl; // mantém a anterior até a nova carregar (sem piscar)
}
function exBoxNow() {
  const mb = mapBox(true),
    [w, h] = mb ? [mb[2], mb[3]] : [9000, 9000],
    x0 = mb ? mb[0] - 200 : -3000,
    y0 = mb ? mb[1] - 200 : -3000,
    W2 = w + (mb ? 400 : 0),
    H2 = h + (mb ? 400 : 0);
  const s = Math.min(0.25, 1600 / Math.max(W2, H2));
  return { x0, y0, w: Math.round(W2 * s), h: Math.round(H2 * s), s, W: W2, H: H2 };
}
async function ensureExC(box) {
  const same =
    exC &&
    fog.exBox &&
    Math.abs(fog.exBox[0] - box.x0) < 1 &&
    Math.abs(fog.exBox[2] - box.W) < 1 &&
    Math.abs(fog.exBox[3] - box.H) < 1 &&
    exC.width === box.w;
  if (same && exReady) return;
  exC = document.createElement("canvas");
  exC.width = box.w;
  exC.height = box.h;
  exReady = true;
  const boxOk =
    fog.exBox &&
    Math.abs(fog.exBox[0] - box.x0) < 1 &&
    Math.abs(fog.exBox[2] - box.W) < 1 &&
    Math.abs(fog.exBox[3] - box.H) < 1;
  if (fog.exImg && boxOk)
    await new Promise(ok => {
      const im = new Image();
      im.onload = () => {
        exC.getContext("2d").drawImage(im, 0, 0, box.w, box.h);
        ok();
      };
      im.onerror = ok;
      im.src = fog.exImg;
    });
}
function updateExplored() {
  // o mestre soma ao "já visto" o que o grupo enxerga agora
  if (!isGM) return;
  clearTimeout(exT);
  exT = setTimeout(async () => {
    const vs = tokens.filter(t => VI(t) && t.o);
    if (!vs.length) return;
    refreshBlock();
    const box = exBoxNow();
    await ensureExC(box);
    RT = box;
    let U;
    try {
      [U] = visibleMask(vs, tokens);
    } finally {
      RT = null;
    }
    const x = exC.getContext("2d");
    x.globalCompositeOperation = "source-over";
    x.drawImage(U, 0, 0);
    const url = exC.toDataURL("image/png");
    if (url === fog.exImg) return;
    fog.exImg = url;
    fog.exBox = [box.x0, box.y0, box.W, box.H];
    exImgSrc = null;
    save("fog", false);
    dirty = true;
  }, 400);
}
function wallsChanged() {
  wallsVer++;
  save("scene");
  dirty = true;
}
let fogCv = document.createElement("canvas"),
  fctx = fogCv.getContext("2d");
function paintFog() {
  const d = devicePixelRatio || 1;
  if (fogCv.width !== cv.width || fogCv.height !== cv.height) {
    fogCv.width = cv.width;
    fogCv.height = cv.height;
  }
  fctx.setTransform(1, 0, 0, 1, 0, 0);
  fctx.globalCompositeOperation = "source-over";
  fctx.clearRect(0, 0, fogCv.width, fogCv.height);
  fctx.fillStyle = isGM ? "rgba(8,6,5,.62)" : "#0b0907";
  fctx.fillRect(0, 0, fogCv.width, fogCv.height);
  fctx.setTransform(d * cam.z, 0, 0, d * cam.z, d * cam.x, d * cam.y);
  fctx.globalCompositeOperation = "destination-out";
  fctx.fillStyle = "#000";
  const vw = visibleWorld(),
    pad = G().size;
  fctx.beginPath();
  for (const k in fog.cells) {
    const [a, b] = k.split(",").map(Number);
    const [x, y] = cellCenter(a, b);
    if (x < vw.x0 - pad || x > vw.x1 + pad || y < vw.y0 - pad || y > vw.y1 + pad) continue;
    cellPath(fctx, a, b);
  }
  fctx.fill();
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(fogCv, 0, 0);
  ctx.restore();
}
function paintRuler(rl, mine) {
  if (!rl?.a || !rl?.b) return;
  const [a, b] = [rl.a, rl.b];
  ctx.strokeStyle = mine ? "#d0a54c" : "#7fb2e8";
  ctx.lineWidth = 3 / cam.z;
  ctx.setLineDash([10 / cam.z, 6 / cam.z]);
  ctx.beginPath();
  ctx.moveTo(...a);
  ctx.lineTo(...b);
  ctx.stroke();
  ctx.setLineDash([]);
  for (const p of [a, b]) {
    ctx.beginPath();
    ctx.arc(p[0], p[1], 5 / cam.z, 0, Math.PI * 2);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  }
  const [a1, b1] = cellAt(...a),
    [a2, b2] = cellAt(...b);
  label(b[0], b[1], unitsFor(cellDist(a1, b1, a2, b2)));
}

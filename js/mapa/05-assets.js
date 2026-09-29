"use strict";
// ---------- assets (objetos do cenário) ----------
let ASSETS = [];
fetch("/assets/index.json")
  .then(r => r.json())
  .then(a => {
    ASSETS = a;
    if (panelKind === "assets") openAssets();
  })
  .catch(() => {});
const isProp = t => t && t.k === "prop";
const propSize = t => [(t.pw || 1) * G().size, (t.ph || 1) * G().size];
const propBmp = new Map();
function propBitmap(im, W, H) {
  // a SVG vira bitmap no tamanho da tela (em degraus), e é reaproveitada
  const d = (devicePixelRatio || 1) * cam.z,
    q = v => Math.max(8, Math.min(2048, Math.pow(2, Math.ceil(Math.log2(v * d) * 3) / 3)));
  const bw = Math.round(q(W)),
    bh = Math.round(q(H)),
    k = im.src + "|" + bw + "|" + bh;
  let c = propBmp.get(k);
  if (!c) {
    if (propBmp.size > 600) propBmp.clear();
    c = document.createElement("canvas");
    c.width = bw;
    c.height = bh;
    try {
      c.getContext("2d").drawImage(im, 0, 0, bw, bh);
    } catch {
      return im;
    }
    propBmp.set(k, c);
  }
  return c;
}
function paintProp(t) {
  const [W, H] = propSize(t),
    im0 = getImg(t.img),
    im = im0 ? propBitmap(im0, W, H) : null;
  ctx.save();
  if (t.h) ctx.globalAlpha = 0.45;
  ctx.translate(t.x, t.y);
  ctx.rotate(((t.a || 0) * Math.PI) / 180);
  if (im) ctx.drawImage(im, -W / 2, -H / 2, W, H);
  else {
    ctx.fillStyle = t.c || "#8a5a2e";
    ctx.fillRect(-W / 2, -H / 2, W, H);
  }
  if (selTok === t.id) {
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2 / cam.z;
    ctx.setLineDash([6 / cam.z, 4 / cam.z]);
    ctx.strokeRect(-W / 2, -H / 2, W, H);
    ctx.setLineDash([]);
    const hy = -H / 2 - 18 / cam.z;
    ctx.beginPath();
    ctx.moveTo(0, -H / 2);
    ctx.lineTo(0, hy);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, hy, 7 / cam.z, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1 / cam.z;
    ctx.stroke();
    if (isGM) {
      const q = 9 / cam.z;
      for (const [sx, sy] of [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ]) {
        ctx.fillStyle = "#ffe28a";
        ctx.fillRect((sx * W) / 2 - q / 2, (sy * H) / 2 - q / 2, q, q);
        ctx.strokeStyle = "#1c150c";
        ctx.lineWidth = 1.5 / cam.z;
        ctx.strokeRect((sx * W) / 2 - q / 2, (sy * H) / 2 - q / 2, q, q);
      }
    }
  }
  if (t.h && isGM) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#e0735e";
    ctx.font = `700 ${Math.max(10 / cam.z, 12)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("oculto", 0, 0);
  }
  ctx.restore();
}
function propLocal(t, x, y) {
  const a = (-(t.a || 0) * Math.PI) / 180,
    dx = x - t.x,
    dy = y - t.y;
  return [dx * Math.cos(a) - dy * Math.sin(a), dx * Math.sin(a) + dy * Math.cos(a)];
}
function hitProp(x, y) {
  for (let i = tokens.length - 1; i >= 0; i--) {
    const t = tokens[i];
    if (!isProp(t)) continue;
    const [W, H] = propSize(t),
      [lx, ly] = propLocal(t, x, y);
    if (Math.abs(lx) <= W / 2 && Math.abs(ly) <= H / 2) return t;
  }
  return null;
}
function propCorner(t, x, y) {
  // pegou num dos cantos (alça de tamanho)?
  const [W, H] = propSize(t),
    [lx, ly] = propLocal(t, x, y),
    tol = 10 / cam.z;
  return Math.abs(Math.abs(lx) - W / 2) <= tol && Math.abs(Math.abs(ly) - H / 2) <= tol;
}
function propHandle(t) {
  const [, H] = propSize(t),
    [vx, vy] = dirVec(t.a || 0),
    d = H / 2 + 18 / cam.z;
  return [t.x + vx * d, t.y + vy * d];
}
function snapProp(t, x, y) {
  const g = G();
  if (t.sn === false) return [Math.round(x), Math.round(y)];
  if (g.type === "hex")
    return (t.pw || 1) === 1 && (t.ph || 1) === 1 ? snapPoint(x, y) : [Math.round(x), Math.round(y)];
  const rot = Math.round((t.a || 0) / 90) % 2 !== 0,
    w = rot ? t.ph || 1 : t.pw || 1,
    h = rot ? t.pw || 1 : t.ph || 1;
  const sx =
    w % 2
      ? g.ox + (Math.floor((x - g.ox) / g.size) + 0.5) * g.size
      : g.ox + Math.round((x - g.ox) / g.size) * g.size;
  const sy =
    h % 2
      ? g.oy + (Math.floor((y - g.oy) / g.size) + 0.5) * g.size
      : g.oy + Math.round((y - g.oy) / g.size) * g.size;
  return [sx, sy];
}
let propSigCur = "";
function refreshBlock() {
  // objetos que bloqueiam visão contam como parede
  const sig = tokens
    .filter(t => isProp(t) && (t.blk || propSolid(t)))
    .map(
      t =>
        `${t.id}${Math.round(t.x)},${Math.round(t.y)},${t.a || 0},${t.pw},${t.ph},${t.blk},${propSolid(t)}`,
    )
    .join("|");
  if (sig !== propSigCur) {
    propSigCur = sig;
    wallsVer++;
  }
}
function propSegs(out) {
  for (const t of tokens) {
    if (!isProp(t) || !t.blk) continue;
    const [W, H] = propSize(t),
      a = ((t.a || 0) * Math.PI) / 180,
      c = Math.cos(a),
      sn = Math.sin(a);
    if (t.blk === "circle") {
      const r = (Math.min(W, H) / 2) * 0.8,
        n = 16;
      for (let i = 0; i < n; i++) {
        const a1 = (i / n) * Math.PI * 2,
          a2 = ((i + 1) / n) * Math.PI * 2;
        out.push([
          t.x + r * Math.cos(a1),
          t.y + r * Math.sin(a1),
          t.x + r * Math.cos(a2),
          t.y + r * Math.sin(a2),
          t.id,
        ]);
      }
      continue;
    }
    const k = 0.9,
      P = [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ].map(([u, v]) => [
        t.x + ((u * W) / 2) * k * c - ((v * H) / 2) * k * sn,
        t.y + ((u * W) / 2) * k * sn + ((v * H) / 2) * k * c,
      ]);
    for (let i = 0; i < 4; i++) out.push([...P[i], ...P[(i + 1) % 4], t.id]);
  }
}
function propSeen(t, vs, ts) {
  const [W, H] = propSize(t),
    a = ((t.a || 0) * Math.PI) / 180,
    c = Math.cos(a),
    sn = Math.sin(a),
    pts = [];
  for (const [u, v] of [
    [-1, -1],
    [0, -1],
    [1, -1],
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
  ]) {
    const k = t.blk === "circle" ? 0.78 : 0.97;
    pts.push([
      t.x + ((u * W) / 2) * k * c - ((v * H) / 2) * k * sn,
      t.y + ((u * W) / 2) * k * sn + ((v * H) / 2) * k * c,
    ]);
  }
  const live = vs.map(v => ts.find(x => x.id === v.id) || v);
  return pts.some(([x, y]) => live.some(v => sees(v, x, y, ts)));
}
let lastClick = null;
function placeAt() {
  // onde colocar coisas novas: último clique no mapa (se estiver na tela) ou centro
  const vw = visibleWorld();
  if (
    lastClick &&
    lastClick[0] > vw.x0 &&
    lastClick[0] < vw.x1 &&
    lastClick[1] > vw.y0 &&
    lastClick[1] < vw.y1
  )
    return lastClick;
  return toWorld(innerWidth / 2, innerHeight / 2);
}
function addProp(a, src) {
  const [x0, y0] = placeAt(),
    t = {
      id: uid(),
      k: "prop",
      n: a.n,
      img: src || `/assets/${a.path || a.id + ".svg"}`,
      pw: a.w,
      ph: a.h,
      a: 0,
      blk: a.blk || null,
      sn: true,
    };
  if (a.li) t.li = { rb: a.li.b * (G().unit || 1), rd: a.li.d * (G().unit || 1), ang: 360, c: a.li.c };
  const [x, y] = snapProp(t, x0, y0);
  t.x = x;
  t.y = y;
  tokens.push(t);
  selTok = t.id;
  save("tokens");
  dirty = true;
  drawEmpty();
}
let myAssets = (() => {
  try {
    return JSON.parse(localStorage.getItem("mesa.myassets")) || [];
  } catch {
    return [];
  }
})();
const saveMyAssets = () => {
  try {
    localStorage.setItem("mesa.myassets", JSON.stringify(myAssets));
  } catch {}
};
const ACAT_IC = {
  Natureza: "🌳",
  Animais: "🐴",
  Construção: "🏠",
  Cidade: "⛲",
  Móveis: "🪑",
  Objetos: "📦",
  Masmorra: "💀",
  Acampamento: "⛺",
  Veículos: "🛒",
};
let assetCat = (() => {
    try {
      return localStorage.getItem("mesa.acat") || "Natureza";
    } catch {
      return "Natureza";
    }
  })(),
  assetQ = "";
const norm = s =>
  String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
function openAssets() {
  panelKind = "assets";
  const ORD = Object.keys(ACAT_IC),
    cats = [...new Set(ASSETS.map(a => a.cat))].sort(
      (a, b) => (ORD.indexOf(a) + 1 || 99) - (ORD.indexOf(b) + 1 || 99),
    );
  if (assetCat !== "mine" && assetCat !== "light" && !cats.includes(assetCat)) assetCat = cats[0] || "mine";
  $("#panel").innerHTML =
    `<div class="panel assets-panel" role="dialog" aria-label="Assets"><h3>Assets <button class="btn small" id="pClose">Fechar</button></h3>
    <input type="search" id="aQ" placeholder="Procurar (cavalo, baú, tocha…)" value="${esc(assetQ)}" autocomplete="off">
    <div class="afolders" id="aCats" role="tablist">${cats.map(c => `<button role="tab" data-cat="${esc(c)}" aria-selected="${assetCat === c}">${ACAT_IC[c] || "📁"} ${esc(c)}<small>${ASSETS.filter(a => a.cat === c).length}</small></button>`).join("")}<button role="tab" data-cat="light" aria-selected="${assetCat === "light"}">✨ Que iluminam<small>${ASSETS.filter(a => a.li).length}</small></button><button role="tab" data-cat="mine" aria-selected="${assetCat === "mine"}">⭐ Meus assets<small>${myAssets.length}</small></button></div>
    <div id="aBody"></div>
    <p class="hint"><b>Arraste para o mapa</b> (ou clique: vai para o último lugar clicado). Depois arraste, gire pela bolinha branca e edite com dois cliques. Dá para soltar uma imagem do seu computador direto no mapa. ✨ = ilumina no escuro.</p></div>`;
  $("#pClose").onclick = closePanel;
  const card = (a, key, mine) =>
    `<button class="asset" data-${mine ? "my" : "as"}="${key}" title="${esc(a.n)} · ${a.w}×${a.h} casas${a.blk ? " · bloqueia visão" : ""}${a.li ? " · ilumina" : ""}"><span class="athumb"><img src="${esc(mine ? a.src : `/assets/${a.path || a.id + ".svg"}`)}" alt="" loading="lazy">${a.li ? `<i class="alight" style="--lc:${esc(a.li.c)}">✨</i>` : ""}</span><span class="aname">${esc(a.n)}</span><small>${a.w}×${a.h}</small></button>`;
  const body = () => {
    const q = norm(assetQ.trim()),
      B = $("#aBody");
    if (!B) return;
    $("#aCats")
      .querySelectorAll("[data-cat]")
      .forEach(b => b.setAttribute("aria-selected", !q && b.dataset.cat === assetCat));
    if (!ASSETS.length) {
      B.innerHTML = `<p class="hint">Carregando…</p>`;
      return;
    }
    if (q) {
      const hits = ASSETS.map((a, i) => [a, i]).filter(([a]) =>
          norm(a.n + " " + a.id + " " + a.cat).includes(q),
        ),
        mine = myAssets.map((a, i) => [a, i]).filter(([a]) => norm(a.n).includes(q));
      B.innerHTML =
        hits.length || mine.length
          ? `<div class="agrid">${hits.map(([a, i]) => card(a, i)).join("")}${mine.map(([a, i]) => card(a, i, true)).join("")}</div>`
          : `<p class="hint">Nada com “${esc(assetQ)}”.</p>`;
      return;
    }
    if (assetCat === "mine") {
      B.innerHTML = `<div class="agrid">${myAssets.map((a, i) => card(a, i, true)).join("") || `<p class="hint">Nenhum ainda. Envie abaixo (Shift + clique tira da lista).</p>`}</div>
      <div class="sub-add"><input type="text" id="maName" placeholder="Nome" maxlength="24"><input type="url" id="maUrl" placeholder="link da imagem (PNG sem fundo fica melhor)"><div class="two"><label>Larg. <input type="number" id="maW" min="1" max="12" value="1"></label><label>Alt. <input type="number" id="maH" min="1" max="12" value="1"></label></div>
      <div class="acts" style="margin-top:6px"><label class="btn small" style="margin:0;color:var(--ink)">Arquivo…<input type="file" id="maFile" accept="image/*" hidden></label><button class="btn small primary" id="maAdd">＋ Adicionar aos meus assets</button></div></div>`;
      $("#maFile").onchange = async e => {
        const f = e.target.files[0];
        if (!f) return;
        toast("Enviando…");
        try {
          $("#maUrl").value = await uploadImage(f, "assets");
          if (!$("#maName").value) $("#maName").value = f.name.replace(/\.\w+$/, "").slice(0, 24);
          toast("Imagem pronta.");
        } catch (err) {
          toast("Não enviei: " + err.message);
        }
      };
      $("#maAdd").onclick = () => {
        const src = $("#maUrl").value.trim();
        if (!/^https?:\/\//.test(src)) return toast("Coloque o link ou envie um arquivo.");
        myAssets.push({
          n: $("#maName").value.trim() || "Asset",
          src,
          w: Math.max(1, Math.min(12, +$("#maW").value || 1)),
          h: Math.max(1, Math.min(12, +$("#maH").value || 1)),
        });
        saveMyAssets();
        openAssets();
      };
      return;
    }
    const list = ASSETS.map((a, i) => [a, i]).filter(([a]) =>
      assetCat === "light" ? a.li : a.cat === assetCat,
    );
    B.innerHTML = `<div class="agrid">${list.map(([a, i]) => card(a, i)).join("")}</div>`;
  };
  body();
  $("#aQ").oninput = e => {
    assetQ = e.target.value;
    body();
  };
  $("#aCats").onclick = e => {
    const b = e.target.closest("[data-cat]");
    if (!b) return;
    assetCat = b.dataset.cat;
    assetQ = "";
    $("#aQ").value = "";
    try {
      localStorage.setItem("mesa.acat", assetCat);
    } catch {}
    body();
  };
  $("#panel").onclick = e => {
    const b = e.target.closest("[data-as],[data-my]");
    if (!b) return;
    if (b.dataset.as != null) addProp(ASSETS[+b.dataset.as]);
    else {
      const a = myAssets[+b.dataset.my];
      if (e.shiftKey) {
        if (confirm(`Tirar “${a.n}” dos meus assets?`)) {
          myAssets.splice(+b.dataset.my, 1);
          saveMyAssets();
          openAssets();
        }
        return;
      }
      addProp({ n: a.n, w: a.w, h: a.h, blk: null }, a.src);
    }
  };
}
function openPropPanel(t) {
  panelKind = "prop";
  const d = JSON.parse(JSON.stringify(t));
  $("#panel").innerHTML =
    `<div class="panel" role="dialog" aria-label="Objeto"><h3>Objeto <button class="btn small" id="pClose">Fechar</button></h3>
    <label for="oN">Nome</label><input type="text" id="oN" maxlength="24" value="${esc(d.n || "")}">
    <div class="two"><div><label for="oW">Largura (casas)</label><input type="number" id="oW" min="1" max="20" value="${d.pw || 1}"></div><div><label for="oH">Altura (casas)</label><input type="number" id="oH" min="1" max="20" value="${d.ph || 1}"></div></div>
    <label for="oA">Ângulo: <b id="oAv">${d.a || 0}°</b></label><input type="range" id="oA" min="0" max="359" step="1" value="${d.a || 0}">
    <label for="oB">Bloqueia a visão e a luz</label><select id="oB"><option value="">Não</option><option value="rect" ${d.blk === "rect" ? "selected" : ""}>Sim, no formato retangular</option><option value="circle" ${d.blk === "circle" ? "selected" : ""}>Sim, redondo (árvores, colunas)</option></select>
    <label for="oI">Imagem (link)</label><input type="url" id="oI" value="${esc(d.img || "")}">
    <div class="lbl" style="margin-top:10px">✨ Emite luz</div>
    <div class="three"><label>Intensa <input type="number" id="oLb" min="0" step="0.5" value="${d.li?.rb || 0}"></label><label>Fraca <input type="number" id="oLd" min="0" step="0.5" value="${d.li?.rd || 0}"></label><label>Cor <input type="color" id="oLc" value="${esc(d.li?.c || "#ffbe5a")}"></label></div>
    <p class="hint" style="margin-top:2px">Em ${esc(G().unitName)}. 0 e 0 = não ilumina. Tocha: 6 e 12.</p>
    <label class="chk" style="margin-top:10px"><input type="checkbox" id="oSo" ${propSolid({ ...d, h: false }) ? "checked" : ""}> Sólido (os jogadores não atravessam)</label>
    <label class="chk"><input type="checkbox" id="oS" ${d.sn !== false ? "checked" : ""}> Agarrar ao grid</label>
    <label class="chk"><input type="checkbox" id="oHid" ${d.h ? "checked" : ""}> Oculto dos jogadores</label>
    <div class="acts foot"><button class="btn small" id="oDup">Duplicar</button><button class="btn small danger" id="oDel">Remover</button><span class="spacer"></span><button class="btn" id="oCancel">Cancelar</button><button class="btn primary" id="oSave">Ok</button></div></div>`;
  $("#pClose").onclick = $("#oCancel").onclick = closePanel;
  $("#oA").oninput = e => ($("#oAv").textContent = e.target.value + "°");
  const cur = () => tokens.find(x => x.id === t.id);
  $("#oSave").onclick = () => {
    const c = cur();
    if (!c) return closePanel();
    Object.assign(c, {
      n: $("#oN").value.trim(),
      pw: Math.max(1, Math.min(20, +$("#oW").value || 1)),
      ph: Math.max(1, Math.min(20, +$("#oH").value || 1)),
      a: +$("#oA").value,
      blk: $("#oB").value || null,
      img: $("#oI").value.trim() || c.img,
      sn: $("#oS").checked,
      h: $("#oHid").checked,
      so: $("#oSo").checked ? 1 : 0,
    });
    {
      const lb = Math.max(0, +$("#oLb").value || 0),
        ld = Math.max(0, +$("#oLd").value || 0);
      c.li = lb || ld ? { rb: lb, rd: ld, ang: 360, c: $("#oLc").value } : null;
    }
    const [x, y] = snapProp(c, c.x, c.y);
    c.x = x;
    c.y = y;
    save("tokens");
    dirty = true;
    closePanel();
  };
  $("#oDel").onclick = () => {
    tokens = tokens.filter(x => x.id !== t.id);
    selTok = null;
    save("tokens");
    dirty = true;
    closePanel();
  };
  $("#oDup").onclick = () => {
    const c0 = cur();
    if (!c0) return;
    const c = JSON.parse(JSON.stringify(c0));
    c.id = uid();
    c.x += G().size * (c.pw || 1);
    tokens.push(c);
    selTok = c.id;
    save("tokens");
    dirty = true;
    closePanel();
  };
}

// ---------- limites do mapa (imagem ou masmorra gerada) ----------
function mapBox(full) {
  if (scene.bg) {
    const [w, h] = bgBox();
    return [0, 0, w, h];
  }
  const g = scene.gen;
  if (g && g.w) {
    if (!full && g.bb)
      return [
        (g.x0 || 0) + g.bb[0] * g.s,
        (g.y0 || 0) + g.bb[1] * g.s,
        (g.bb[2] - g.bb[0]) * g.s,
        (g.bb[3] - g.bb[1]) * g.s,
      ];
    return [g.x0 || 0, g.y0 || 0, g.w * g.s, g.h * g.s];
  }
  return null;
}
function resetExplore() {
  fog.exImg = null;
  fog.exBox = null;
  fog.ex = {};
  exC = null;
  exReady = false;
  exImgSrc = null;
  exPrevEl = null;
  clearTimeout(exT);
}
function freshDungeonTokens() {
  // nova masmorra: só os personagens dos jogadores continuam (inimigos, NPCs e objetos da anterior saem)
  tokLive = {};
  rulers = {};
  return tokens.filter(t => !isProp(t) && t.o).map(t => ({ ...t, tr: [] }));
}
const hexA = (c, a) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(c || ""));
  if (!m) return `rgba(255,180,90,${a})`;
  const n = parseInt(m[1], 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
};

"use strict";
// ---------- sem "vai e volta": o que o jogador fez vale na tela dele até o mestre confirmar ----------
const pend = {},
  pendDoor = {},
  lastReq = {};
let reqSeq = 0;
function tokReq(p) {
  p.q = ++reqSeq;
  lastReq[p.id] = p.q;
  const t = tokens.find(x => x.id === p.id);
  if (t)
    pend[p.id] = { x: t.x, y: t.y, a: t.a, b: t.b ? JSON.stringify(t.b) : null, until: Date.now() + 5000 };
  send("tokreq", p);
}
function fixPending() {
  // um retrato velho do banco chegou depois do que eu fiz: mantém o meu
  const now = Date.now();
  for (const id in pend) {
    const pd = pend[id],
      t = tokens.find(x => x.id === id);
    if (!t || now > pd.until) {
      delete pend[id];
      continue;
    }
    const same =
      Math.hypot(t.x - pd.x, t.y - pd.y) < 1 &&
      Math.abs((((((t.a || 0) - (pd.a || 0)) % 360) + 540) % 360) - 180) < 2 &&
      (pd.b == null || JSON.stringify(t.b) === pd.b);
    if (same) {
      delete pend[id];
      continue;
    }
    t.x = pd.x;
    t.y = pd.y;
    if (pd.a != null) t.a = pd.a;
    if (pd.b != null) t.b = JSON.parse(pd.b);
  }
  for (const k in pendDoor) {
    const pd = pendDoor[k],
      w = walls().find(w => w.d && w.p?.join(",") === k);
    if (!w || now > pd.until) {
      delete pendDoor[k];
      continue;
    }
    if ((w.o ? 1 : 0) === pd.o) {
      delete pendDoor[k];
      continue;
    }
    w.o = pd.o;
    wallsVer++;
    losCache.clear();
  }
}
// ---------- o personagem do jogador olha para onde o mouse está ----------
let lookMouse = (() => {
    try {
      return localStorage.getItem("mesa.look") !== "0";
    } catch {
      return true;
    }
  })(),
  lookSend = 0,
  lookT = null;
function lookTok() {
  const sel = tokens.find(t => t.id === selTok && !isProp(t) && owns(t));
  if (sel) return sel;
  const mine = tokens.filter(t => !isProp(t) && owns(t));
  return mine.length === 1 ? mine[0] : null;
}
function lookAt(wx, wy) {
  const t = lookTok();
  if (!t) return;
  if (Math.hypot(wx - t.x, wy - t.y) < tokR(t) * 0.8) return;
  const a = Math.round(((Math.atan2(wx - t.x, -(wy - t.y)) * 180) / Math.PI + 360) % 360);
  if (a === Math.round(t.a || 0)) return;
  t.a = a;
  dirty = true;
  const now = performance.now();
  pend[t.id] = { x: t.x, y: t.y, a, b: null, until: Date.now() + 5000 };
  if (now - lookSend > 70) {
    lookSend = now;
    send("tok", { id: t.id, x: Math.round(t.x), y: Math.round(t.y), a, live: 1 });
  }
  clearTimeout(lookT);
  lookT = setTimeout(() => {
    if (!walking) tokReq({ id: t.id, a: t.a, who: myNick });
  }, 350);
}
// ---------- jogadores abrem e fecham portas (perto do próprio personagem) ----------
function doorAt(x, y) {
  const tol = Math.max(10 / cam.z, G().size * 0.22);
  let best = null,
    bd = tol;
  for (const w of walls()) {
    if (!w.d || w.s || !w.p) continue;
    const dd = distSeg(x, y, [w.p[0], w.p[1]], [w.p[2], w.p[3]]);
    if (dd < bd) {
      bd = dd;
      best = w;
    }
  }
  return best;
}
const doorMid = w => [(w.p[0] + w.p[2]) / 2, (w.p[1] + w.p[3]) / 2];
const nearDoor = (t, w) => {
  const [mx, my] = doorMid(w);
  return Math.hypot(t.x - mx, t.y - my) <= G().size * 1.6 + tokR(t);
};
// ---- cadeado das portas (só o mestre tranca e destranca) ----
function doorPop(w) {
  let el = $("#doorPop");
  el?.remove();
  el = document.createElement("div");
  el.id = "doorPop";
  el.className = "doorpop";
  const draw = () => {
    el.innerHTML = `<button data-do ${w.lk ? "disabled" : ""} title="${w.o ? "Fechar a porta" : "Abrir a porta (os jogadores vão ver)"}">🚪<small>${w.o ? "Fechar" : "Abrir"}</small></button><button data-dl title="${w.lk ? "Destrancar" : "Trancar"}">${w.lk ? "🔒" : "🔓"}<small>${w.lk ? "Trancada" : "Destrancada"}</small></button>`;
  };
  draw();
  document.body.appendChild(el);
  el.onpointerdown = e => e.stopPropagation();
  const place = () => {
    if (!el.isConnected) return;
    const [mx, my] = doorMid(w);
    el.style.left = mx * cam.z + cam.x + "px";
    el.style.top = my * cam.z + cam.y - 16 + "px";
  };
  place();
  el._place = place;
  doorPopW = w;
  el.onclick = e => {
    const b = e.target.closest("button");
    if (!b || b.disabled) return;
    clearTimeout(doorPopT);
    doorPopT = setTimeout(() => el.remove(), 6000);
    if (b.dataset.do != null) {
      w.o = w.o ? 0 : 1;
      wallsChanged();
      draw();
      toast(w.o ? "Porta aberta." : "Porta fechada.", 1400);
      if (DS.init()) DS.click(DS.ctx.currentTime, 900, 0.3, 0.06, 3);
      return;
    }
    w.lk = w.lk ? 0 : 1;
    if (w.lk && w.o) w.o = 0;
    wallsChanged();
    draw();
    toast(w.lk ? "🔒 Porta trancada: os jogadores não conseguem abrir." : "🔓 Porta destrancada.", 1800);
    if (DS.init()) {
      const t0 = DS.ctx.currentTime;
      DS.click(t0, 2400, 0.35, 0.04, 3);
      DS.click(t0 + 0.07, 1600, 0.3, 0.05, 3);
    }
  };
  clearTimeout(doorPopT);
  doorPopT = setTimeout(() => el.remove(), 6000);
}
let doorPopT = null,
  doorPopW = null;
function playerDoor(w) {
  if (w.lk) {
    toast("🔒 A porta está trancada.", 1800);
    if (DS.init()) {
      const t0 = DS.ctx.currentTime;
      for (let i = 0; i < 3; i++) DS.click(t0 + i * 0.09, 900 + i * 120, 0.4, 0.06, 2);
    }
    return;
  }
  const mine = tokens.filter(t => !isProp(t) && owns(t) && nearDoor(t, w));
  if (!mine.length) return toast("Chegue perto da porta para abrir.");
  send("door", { k: w.p.join(","), who: myNick });
  w.o = w.o ? 0 : 1;
  pendDoor[w.p.join(",")] = { o: w.o, until: Date.now() + 5000 };
  wallsVer++;
  losCache.clear();
  dirty = true;
  toast(w.o ? "Você abriu a porta." : "Você fechou a porta.", 1500);
}
// ---------- paredes que os jogadores enxergam (a escuridão esconde as que ainda não foram vistas) ----------
// passagens secretas fechadas: acha o lado "de trás" (o corredor escondido) pelas paredes que saem das duas pontas da porta
function secretHides() {
  const out = [],
    ws = walls(),
    eq = (a, b, c, d) => Math.abs(a - c) < 1 && Math.abs(b - d) < 1;
  for (const d of ws) {
    if (!d.d || !d.s || d.o || !d.p) continue;
    const [x1, y1, x2, y2] = d.p,
      L = Math.hypot(x2 - x1, y2 - y1);
    if (!L) continue;
    const ux = (x2 - x1) / L,
      uy = (y2 - y1) / L,
      nx = -uy,
      ny = ux;
    const side = [0, 0]; // [um lado, outro lado] para cada ponta
    const hit = [
      [0, 0],
      [0, 0],
    ];
    for (const w of ws) {
      if (w.d || !w.p) continue;
      for (const [ex, ey] of [
        [x1, y1],
        [x2, y2],
      ])
        for (const [a, b, c, e] of [
          [w.p[0], w.p[1], w.p[2], w.p[3]],
          [w.p[2], w.p[3], w.p[0], w.p[1]],
        ]) {
          if (!eq(a, b, ex, ey)) continue;
          const vx = c - a,
            vy = e - b,
            vl = Math.hypot(vx, vy);
          if (!vl || Math.abs((vx * ux + vy * uy) / vl) > 0.2) continue;
          const k = vx * nx + vy * ny > 0 ? 0 : 1,
            pi = ex === x1 && ey === y1 ? 0 : 1;
          hit[k][pi] = 1;
        }
    }
    const far = hit[0][0] && hit[0][1] ? 1 : hit[1][0] && hit[1][1] ? -1 : 0;
    out.push({ p: d.p, fx: nx * far, fy: ny * far, far });
  }
  return out;
}
function hiddenBySecret(w, hs) {
  // parede do corredor secreto que encosta na passagem (do lado de trás)
  if (!w.p || !hs.length) return false;
  for (const h of hs) {
    if (!h.far) continue;
    const [x1, y1, x2, y2] = h.p;
    for (const [a, b, c, e] of [
      [w.p[0], w.p[1], w.p[2], w.p[3]],
      [w.p[2], w.p[3], w.p[0], w.p[1]],
    ])
      for (const [ex, ey] of [
        [x1, y1],
        [x2, y2],
      ])
        if (Math.abs(a - ex) < 1 && Math.abs(b - ey) < 1 && (c - a) * h.fx + (e - b) * h.fy > 1) return true;
  }
  return false;
}
function paintWallsPlayer(c, own) {
  // c já com a transformação do mundo
  const ws = walls();
  if (!ws.some(w => !w.d)) return false;
  c.save();
  const th = Math.max(3 / cam.z, G().size * 0.09);
  if (own) c.save();
  c.lineCap = "round";
  c.lineJoin = "round";
  const hs = secretHides();
  c.beginPath();
  for (const w of ws) {
    if (w.d && !(w.s && !w.o)) continue;
    if (!w.d && hiddenBySecret(w, hs)) continue; // passagem secreta fechada = parede para o jogador
    if (w.c) {
      c.moveTo(w.c[0] + w.r, w.c[1]);
      c.arc(w.c[0], w.c[1], w.r, 0, Math.PI * 2);
    } else if (w.p) {
      c.moveTo(w.p[0], w.p[1]);
      c.lineTo(w.p[2], w.p[3]);
    }
  }
  c.strokeStyle = "rgba(0,0,0,.8)";
  c.lineWidth = th + 4 / cam.z;
  c.stroke();
  c.strokeStyle = "#efe2c4";
  c.lineWidth = th;
  c.stroke();
  if (own) c.restore();
  c.restore();
  return true;
}
// ---------- portas (todos veem as portas normais; as secretas só o mestre) ----------
function paintDoors(c = ctx) {
  // portas bem marcadas (as secretas não aparecem para os jogadores)
  const th = Math.max(6 / cam.z, G().size * 0.2),
    lw = Math.max(1.5 / cam.z, G().size * 0.035);
  c.save();
  for (const w of walls()) {
    if (!w.d || w.s || !w.p) continue;
    const [x1, y1, x2, y2] = w.p,
      L = Math.hypot(x2 - x1, y2 - y1);
    if (!L) continue;
    c.save();
    c.translate(x1, y1);
    c.rotate(Math.atan2(y2 - y1, x2 - x1));
    if (!w.o) {
      c.shadowColor = "rgba(0,0,0,.7)";
      c.shadowBlur = 6;
      c.fillStyle = "#6e4020";
      c.fillRect(0, -th / 2, L, th);
      c.shadowBlur = 0;
      c.strokeStyle = "rgba(40,20,8,.8)";
      c.lineWidth = lw * 0.7;
      for (const k of [0.33, 0.66]) {
        c.beginPath();
        c.moveTo(0, -th / 2 + th * k);
        c.lineTo(L, -th / 2 + th * k);
        c.stroke();
      }
      c.strokeStyle = "#f2c35a";
      c.lineWidth = lw;
      c.strokeRect(0, -th / 2, L, th);
      c.fillStyle = "#3a3a40";
      c.fillRect(L * 0.1, -th / 2, L * 0.06, th);
      c.fillRect(L * 0.84, -th / 2, L * 0.06, th);
      c.beginPath();
      c.arc(L * 0.7, 0, th * 0.2, 0, Math.PI * 2);
      c.fillStyle = "#ffd76a";
      c.fill();
    } else {
      // aberta: a folha girada pela dobradiça + o arco do movimento
      c.beginPath();
      c.moveTo(L * 0.9, 0);
      c.arc(0, 0, L * 0.9, 0, Math.PI / 2);
      c.strokeStyle = "rgba(242,195,90,.55)";
      c.lineWidth = lw;
      c.setLineDash([lw * 3, lw * 2.5]);
      c.stroke();
      c.setLineDash([]);
      c.rotate(Math.PI / 2);
      c.fillStyle = "#6e4020";
      c.fillRect(0, -th * 0.4, L * 0.9, th * 0.8);
      c.strokeStyle = "#f2c35a";
      c.lineWidth = lw;
      c.strokeRect(0, -th * 0.4, L * 0.9, th * 0.8);
      c.rotate(-Math.PI / 2);
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(L, 0);
      c.strokeStyle = "rgba(120,220,130,.55)";
      c.lineWidth = lw;
      c.setLineDash([lw * 2, lw * 2]);
      c.stroke();
      c.setLineDash([]);
    }
    c.restore();
  }
  c.restore();
}

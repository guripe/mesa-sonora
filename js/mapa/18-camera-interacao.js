"use strict";
// ---------- câmera ----------
function zoomAt(f, sx = innerWidth / 2, sy = innerHeight / 2) {
  const nz = Math.max(0.1, Math.min(6, cam.z * f));
  const [wx, wy] = toWorld(sx, sy);
  cam.z = nz;
  cam.x = sx - wx * nz;
  cam.y = sy - wy * nz;
  dirty = true;
  drawTop();
}
const bgAngle = () => (scene.bgQ || 0) * 90 + (+scene.bgFine || 0);
function bgBox() {
  // tamanho da imagem já girada (ela fica encostada no canto 0,0)
  const w = scene.bgW || 1600,
    h = scene.bgH || 1000,
    a = (bgAngle() * Math.PI) / 180;
  return [
    Math.abs(w * Math.cos(a)) + Math.abs(h * Math.sin(a)),
    Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a)),
  ];
}
function fit() {
  const [x0, y0, w, h] = mapBox() || [0, 0, 1600, 1000];
  cam.z = Math.min(innerWidth / w, innerHeight / h) * 0.92;
  cam.x = (innerWidth - w * cam.z) / 2 - x0 * cam.z;
  cam.y = (innerHeight - h * cam.z) / 2 - y0 * cam.z;
  dirty = true;
  drawTop();
}
function centerOn(wx, wy, z) {
  cam.z = z;
  cam.x = innerWidth / 2 - wx * z;
  cam.y = innerHeight / 2 - wy * z;
  dirty = true;
  drawTop();
}

// ---------- interação ----------
const pts = new Map();
cv.addEventListener("contextmenu", e => e.preventDefault());
cv.addEventListener(
  "wheel",
  e => {
    e.preventDefault();
    zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY);
  },
  { passive: false },
);
function hitToken(x, y) {
  for (let i = tokens.length - 1; i >= 0; i--) {
    const t = tokens[i];
    if (isProp(t) || (!isGM && t.h)) continue;
    if (Math.hypot(t.x - x, t.y - y) <= tokR(t)) return t;
  }
  return null;
}
cv.addEventListener("pointerdown", e => {
  cv.setPointerCapture(e.pointerId);
  pts.set(e.pointerId, [e.clientX, e.clientY]);
  closeFlyoutSoft();
  if (pts.size === 2) {
    const [p1, p2] = [...pts.values()];
    drag = { kind: "pinch", d: Math.hypot(p1[0] - p2[0], p1[1] - p2[1]), z: cam.z };
    return;
  }
  const [wx, wy] = toWorld(e.clientX, e.clientY);
  if (e.button === 0 && e.altKey) {
    doPing(wx, wy, isGM && e.shiftKey);
    if (isGM && e.shiftKey) send("view", { x: wx, y: wy, z: cam.z });
    return;
  }
  if (e.button === 0) lastClick = [wx, wy];
  if (e.button === 0 && isGM && panelKind === "snd" && !spaceDown) {
    const h = zoneHandleAt(wx, wy);
    if (h) {
      zoneSel = h.z.id;
      drag = { kind: "zone", z: h.z, mode: h.mode, ox: wx - h.z.x, oy: wy - h.z.y, moved: false };
      document.querySelectorAll(".snd-z").forEach((r, i) => r.classList.toggle("on", scene.snd.z[i] === h.z));
      dirty = true;
      return;
    }
  }
  if (e.button === 0 && isGM && zonePlace) {
    zonePlaceAt(wx, wy);
    return;
  }
  if (e.button === 2 && tool === "wall" && wallDraft) {
    wallDraft = null;
    dirty = true;
    return;
  }
  if (e.button === 1 || e.button === 2 || spaceDown) {
    drag = { kind: "pan", sx: e.clientX, sy: e.clientY, cx: cam.x, cy: cam.y };
    cv.classList.add("panning");
    return;
  }
  if (barBtn && e.button === 0) {
    const q = 3 / cam.z;
    if (
      wx >= barBtn.x - q &&
      wx <= barBtn.x + barBtn.s + q &&
      wy >= barBtn.y - q &&
      wy <= barBtn.y + barBtn.s + q
    ) {
      const bt = tokens.find(x => x.id === barBtn.id);
      if (bt) barEdId === bt.id ? closeBarEd() : openBarEd(bt);
      dirty = true;
      return;
    }
  }
  if (barEdId && hitToken(wx, wy)?.id !== barEdId) closeBarEd();
  $("#doorPop")?.remove();
  if (tool === "move") {
    const t = hitToken(wx, wy);
    if (isGM && scene.roll) {
      const rx = rollExitAt(wx, wy);
      if (rx) {
        rollSel = rx.id;
        genOpt.style = "rolled";
        openRollPanel();
        return;
      }
    }
    if (!t && isGM) {
      const wi = wallAt(wx, wy);
      const w = walls()[wi];
      if (w?.d) {
        doorPop(w);
        return;
      }
    }
    if (!t && !isGM) {
      const w = doorAt(wx, wy);
      if (w && tokens.some(x => !isProp(x) && owns(x) && nearDoor(x, w))) {
        playerDoor(w);
        return;
      }
    }
    const sel = tokens.find(x => x.id === selTok);
    if (sel && (isGM || owns(sel))) {
      // pegou na setinha do token selecionado?
      if (isProp(sel)) {
        const [hx, hy] = propHandle(sel);
        if (Math.hypot(wx - hx, wy - hy) <= 12 / cam.z) {
          drag = { kind: "rotate", t: sel };
          cv.classList.add("panning");
          return;
        }
        if (isGM && propCorner(sel, wx, wy)) {
          drag = {
            kind: "propsize",
            t: sel,
            ow: sel.pw || 1,
            oh: sel.ph || 1,
            ratio: (sel.pw || 1) / (sel.ph || 1),
          };
          cv.classList.add("panning");
          return;
        }
      } else {
        const r = tokR(sel),
          [vx, vy] = dirVec(sel.a || 0),
          hx = sel.x + vx * r * 1.2,
          hy = sel.y + vy * r * 1.2;
        if (Math.hypot(wx - hx, wy - hy) <= Math.max(r * 0.38, 12 / cam.z)) {
          drag = { kind: "rotate", t: sel };
          cv.classList.add("panning");
          return;
        }
      }
    }
    const ct = curTpl();
    if (ct && canEditTpl(ct)) {
      const [hx, hy] = tplHandle(ct.t);
      if (Math.hypot(wx - hx, wy - hy) <= 12 / cam.z) {
        drag = { kind: "tplrot", e: ct };
        return;
      }
    }
    if (t && (isGM || owns(t))) {
      selTok = t.id;
      drag = {
        kind: "token",
        t,
        dx: t.x - wx,
        dy: t.y - wy,
        moved: false,
        ox: t.x,
        oy: t.y,
        path: [cellAt(t.x, t.y)],
        grid: t.sn !== false || !isGM,
      };
      dirty = true;
      return;
    }
    const te = !t && hitTpl(wx, wy);
    if (te) {
      selTpl = te.t.id;
      selTok = null;
      drag = { kind: "tplmove", e: te, dx: te.t.x - wx, dy: te.t.y - wy, moved: false };
      dirty = true;
      drawTplBar();
      return;
    }
    const pr = !t && isGM && hitProp(wx, wy);
    if (pr) {
      selTok = pr.id;
      selTpl = null;
      drawTplBar();
      drag = { kind: "prop", t: pr, dx: pr.x - wx, dy: pr.y - wy, moved: false };
      dirty = true;
      return;
    }
    const walker = clickMoveTok();
    if (!walker) selTok = null;
    if (selTpl) {
      selTpl = null;
      drawTplBar();
    }
    dirty = true;
    drag = {
      kind: "pan",
      sx: e.clientX,
      sy: e.clientY,
      cx: cam.x,
      cy: cam.y,
      walk: walker ? { id: walker.id, c: cellAt(wx, wy) } : null,
    };
    cv.classList.add("panning");
    return;
  }
  if (tool === "spell") {
    // clicar numa área que já existe: pega e move (não cria outra)
    const ct = curTpl();
    if (ct && canEditTpl(ct)) {
      const [hx, hy] = tplHandle(ct.t);
      if (Math.hypot(wx - hx, wy - hy) <= 12 / cam.z) {
        drag = { kind: "tplrot", e: ct };
        return;
      }
    }
    const te = hitTpl(wx, wy);
    if (te) {
      selTpl = te.t.id;
      selTok = null;
      drag = { kind: "tplmove", e: te, dx: te.t.x - wx, dy: te.t.y - wy, moved: false };
      dirty = true;
      drawTplBar();
      return;
    }
  }
  if (tool === "spell") {
    const sp = curSpell();
    drag = {
      kind: "tplnew",
      t: {
        id: uid(),
        t: "tpl",
        n: sp.n,
        ic: sp.ic,
        sh: sp.sh,
        r: sp.r,
        wd: sp.wd,
        c: sp.c,
        x: Math.round(wx),
        y: Math.round(wy),
        a: 0,
        own: isGM ? undefined : myKey,
      },
    };
    dirty = true;
    return;
  }
  if (tool === "ruler") {
    const a = snapPoint(wx, wy);
    rulers[myKey] = { a, b: a };
    drag = { kind: "ruler" };
    dirty = true;
    sendRuler();
    return;
  }
  if (!isGM) return;
  if (tool === "draw" && opt.draw === "text") {
    const txt = prompt("Texto para escrever no mapa:");
    if (txt && txt.trim()) {
      drawings.push({
        id: uid(),
        t: "text",
        c: opt.color,
        w: opt.width,
        p: [[Math.round(wx), Math.round(wy)]],
        s: txt.trim().slice(0, 200),
      });
      save("drawings");
      dirty = true;
    }
    return;
  }
  if (tool === "draw") {
    const p = [Math.round(wx), Math.round(wy)];
    drag = {
      kind: "draw",
      shape: { id: uid(), t: opt.draw, c: opt.color, w: opt.width, p: opt.draw === "pen" ? [p] : [p, p] },
    };
    return;
  }
  if (tool === "erase") {
    eraseAt(wx, wy);
    drag = { kind: "erase" };
    return;
  }
  if (tool === "wall") {
    if (opt.wall === "erase") {
      const i = wallAt(wx, wy);
      if (i >= 0) {
        walls().splice(i, 1);
        wallsChanged();
      }
      return;
    }
    if (opt.wall === "hide") {
      // ocultar trecho: vira passagem secreta (clique numa passagem secreta para voltar a ser parede)
      const i = wallAt(wx, wy),
        w = walls()[i];
      if (!w || !w.p) return;
      if (w.d) {
        if (w.s) {
          delete w.s;
          delete w.o;
          delete w.lk;
          w.d = 0;
          wallsChanged();
          toast("Voltou a ser parede comum.", 1600);
        } else toast("Isso é uma porta. Clique numa parede.", 1600);
        return;
      }
      const h = hideRange(w, wx, wy);
      drag = { kind: "wallhide", w, a: h, b: h };
      dirty = true;
      return;
    }
    if (!wallDraft) {
      // pegou numa junção? arrasta
      const h = handleAt(wx, wy);
      if (h) {
        if (h[2] === "p") {
          const [hx, hy] = h;
          const pts = [];
          for (const w of walls())
            if (w.p) {
              if (Math.hypot(w.p[0] - hx, w.p[1] - hy) < 0.5) pts.push([w, 0]);
              if (Math.hypot(w.p[2] - hx, w.p[3] - hy) < 0.5) pts.push([w, 1]);
            }
          drag = { kind: "wallpt", pts, from: [hx, hy], moved: false };
        } else drag = { kind: "wallcirc", w: h[3], mode: h[2], moved: false };
        return;
      }
    }
    if (opt.wall === "circle") {
      const c = snapWall(wx, wy, e.shiftKey);
      drag = { kind: "wallcircle", c, r: 0 };
      return;
    }
    const p = snapWall(wx, wy, e.shiftKey);
    if (!wallDraft) {
      wallDraft = p;
      hoverWall = p;
      dirty = true;
      return;
    }
    if (Math.hypot(p[0] - wallDraft[0], p[1] - wallDraft[1]) > 2) {
      walls().push({
        p: [...wallDraft, ...p],
        d: opt.wall === "door" || opt.wall === "secret" ? 1 : 0,
        ...(opt.wall === "secret" ? { s: 1 } : {}),
      });
      wallsChanged();
    }
    wallDraft = opt.wall === "door" || opt.wall === "secret" ? null : p;
    dirty = true;
    return;
  }
  if (tool === "fog") {
    if (opt.fogShape === "rect") {
      drag = { kind: "fogrect", a: [wx, wy], b: [wx, wy] };
      return;
    }
    drag = { kind: "fogbrush", at: [wx, wy] };
    fogBrush(wx, wy);
    return;
  }
});
cv.addEventListener("pointermove", e => {
  if (pts.has(e.pointerId)) pts.set(e.pointerId, [e.clientX, e.clientY]);
  const [wx, wy] = toWorld(e.clientX, e.clientY);
  if (!drag) {
    if (tool === "fog" && isGM && opt.fogShape === "brush") {
      hoverFog = [wx, wy];
      dirty = true;
    }
    if (tool === "wall" && wallDraft) {
      hoverWall = snapWall(wx, wy, e.shiftKey);
      dirty = true;
    }
    if (tool === "move") {
      const sp = isGM && tokens.find(t => t.id === selTok && isProp(t)),
        dw = doorAt(wx, wy);
      cv.style.cursor =
        sp && propCorner(sp, wx, wy)
          ? "nwse-resize"
          : dw && (isGM || tokens.some(t => !isProp(t) && owns(t) && nearDoor(t, dw)))
            ? "pointer"
            : "";
    }
    if (!isGM && lookMouse && !walking) lookAt(wx, wy);
    if (clickMoveTok()) {
      const c = cellAt(wx, wy);
      if (!hoverCell || c[0] !== hoverCell[0] || c[1] !== hoverCell[1]) {
        hoverCell = c;
        dirty = true;
      }
    }
    return;
  }
  if (drag.kind === "pinch" && pts.size === 2) {
    const [p1, p2] = [...pts.values()];
    const d = Math.hypot(p1[0] - p2[0], p1[1] - p2[1]);
    zoomAt((drag.z * d) / drag.d / cam.z, (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2);
    return;
  }
  if (drag.kind === "pan" && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 5) drag.panned = true;
  if (drag.kind === "pan") {
    cam.x = drag.cx + e.clientX - drag.sx;
    cam.y = drag.cy + e.clientY - drag.sy;
    dirty = true;
    return;
  }
  if (drag.kind === "prop") {
    drag.t.x = wx + drag.dx;
    drag.t.y = wy + drag.dy;
    drag.moved = true;
    dirty = true;
    return;
  }
  if (drag.kind === "tplnew") {
    const t = drag.t;
    if (t.sh === "circle") {
      t.x = Math.round(wx);
      t.y = Math.round(wy);
    } else if (Math.hypot(wx - t.x, wy - t.y) > 4 / cam.z)
      t.a = Math.round((Math.atan2(wx - t.x, -(wy - t.y)) * 180) / Math.PI);
    dirty = true;
    return;
  }
  if (drag.kind === "tplmove") {
    drag.e.t.x = Math.round(wx + drag.dx);
    drag.e.t.y = Math.round(wy + drag.dy);
    drag.moved = true;
    dirty = true;
    return;
  }
  if (drag.kind === "tplrot") {
    const t = drag.e.t;
    if (t.sh === "circle") {
      t.r = Math.max(
        1.5,
        Math.round(((Math.hypot(wx - t.x, wy - t.y) / G().size) * (G().unit || 1)) / 1.5) * 1.5,
      );
    } else t.a = Math.round((Math.atan2(wx - t.x, -(wy - t.y)) * 180) / Math.PI / 5) * 5;
    drag.moved = true;
    dirty = true;
    return;
  }
  if (drag.kind === "propsize") {
    // arrasta o canto: aumenta ou diminui (Shift mantém a proporção)
    const t = drag.t,
      [lx, ly] = propLocal(t, wx, wy),
      S = G().size,
      st = t.sn === false ? 0.25 : 1;
    let w = Math.max(st, Math.min(20, Math.round((2 * Math.abs(lx)) / S / st) * st)),
      h = Math.max(st, Math.min(20, Math.round((2 * Math.abs(ly)) / S / st) * st));
    if (e.shiftKey) {
      if (w / drag.ratio >= h) h = Math.max(st, Math.round(w / drag.ratio / st) * st);
      else w = Math.max(st, Math.round((h * drag.ratio) / st) * st);
    }
    if (w !== t.pw || h !== t.ph) {
      t.pw = w;
      t.ph = h;
      drag.moved = true;
      dirty = true;
    }
    drag.at = [wx, wy];
    dirty = true;
    return;
  }
  if (drag.kind === "rotate") {
    let a = (Math.atan2(wx - drag.t.x, -(wy - drag.t.y)) * 180) / Math.PI;
    const step = isProp(drag.t) ? (e.shiftKey ? 90 : 15) : e.shiftKey ? (G().type === "hex" ? 60 : 45) : 5;
    a = (((Math.round(a / step) * step) % 360) + 360) % 360;
    if (a !== drag.t.a) {
      drag.t.a = a;
      drag.moved = true;
      dirty = true;
      sendTok(drag.t);
    }
    return;
  }
  if (drag.kind === "token") {
    const d = drag,
      px = wx + d.dx,
      py = wy + d.dy;
    if (d.grid) {
      // anda casa por casa: mostra o caminho, para na parede e no limite de deslocamento
      d.limit = d.wall = false;
      pathStep(d, cellAt(px, py));
      const last = d.path[d.path.length - 1],
        [cx, cy] = d.t.sn === false ? cellCenter(...last) : snapPoint(...cellCenter(...last), d.t.s || 1);
      if (cx !== d.t.x || cy !== d.t.y) {
        d.t.x = cx;
        d.t.y = cy;
        sendTok(d.t);
      }
    } else {
      d.t.x = px;
      d.t.y = py;
      sendTok(d.t);
    }
    d.moved = true;
    dirty = true;
    return;
  }
  if (drag.kind === "ruler") {
    rulers[myKey].b = snapPoint(wx, wy);
    dirty = true;
    sendRuler();
    return;
  }
  if (drag.kind === "draw") {
    const p = [Math.round(wx), Math.round(wy)],
      s = drag.shape;
    if (s.t === "pen") {
      const l = s.p[s.p.length - 1];
      if (Math.hypot(l[0] - p[0], l[1] - p[1]) > 2 / cam.z) s.p.push(p);
    } else s.p[1] = p;
    dirty = true;
    return;
  }
  if (drag.kind === "erase") {
    eraseAt(wx, wy);
    return;
  }
  if (drag.kind === "wallhide") {
    drag.b = hideRange(drag.w, wx, wy);
    dirty = true;
    return;
  }
  if (drag.kind === "zone") {
    const z = drag.z;
    if (drag.mode === "move") { z.x = Math.round(wx - drag.ox); z.y = Math.round(wy - drag.oy); }
    else z.r = Math.max(1, Math.min(60, Math.round((Math.hypot(wx - z.x, wy - z.y) / G().size) * 2) / 2));
    drag.moved = true; zoneT = 0; dirty = true;
    return;
  }
  if (drag.kind === "wallcircle") {
    drag.r = Math.hypot(wx - drag.c[0], wy - drag.c[1]);
    dirty = true;
    return;
  }
  if (drag.kind === "wallpt") {
    const skip = drag.pts.length === 1 ? drag.pts[0][0] : null;
    const p = snapWall(wx, wy, e.shiftKey, skip);
    for (const [w, i] of drag.pts) {
      w.p[i * 2] = p[0];
      w.p[i * 2 + 1] = p[1];
    }
    drag.moved = true;
    wallsVer++;
    dirty = true;
    return;
  }
  if (drag.kind === "wallcirc") {
    const w = drag.w;
    if (drag.mode === "c") w.c = e.shiftKey ? [Math.round(wx), Math.round(wy)] : snapWall(wx, wy, false);
    else w.r = Math.max(4, Math.hypot(wx - w.c[0], wy - w.c[1]));
    drag.moved = true;
    wallsVer++;
    dirty = true;
    return;
  }
  if (drag.kind === "fogrect") {
    drag.b = [wx, wy];
    dirty = true;
    return;
  }
  if (drag.kind === "fogbrush") {
    drag.at = [wx, wy];
    fogBrush(wx, wy);
    return;
  }
});
function endPointer(e) {
  pts.delete(e.pointerId);
  cv.classList.remove("panning");
  if (!drag) return;
  const d = drag;
  drag = null;
  if (d.kind === "pinch") return;
  if (d.kind === "pan" && d.walk && !d.panned) {
    // clique curto com o próprio token selecionado: anda até lá
    const t = tokens.find(x => x.id === d.walk.id);
    if (!t) return;
    const P = pathTo(t, d.walk.c);
    if (P && P.length > 1) walkTo(t, P);
    else if (!P) {
      toast(
        isGM
          ? "Longe demais."
          : inCombat(t) && moveLim(t) <= 0
            ? "Você já usou todo o deslocamento neste turno." + (t.dash ? "" : " (🏃 Disparada dobra.)")
            : "Não dá para chegar lá (parede ou longe demais).",
      );
    } else {
      selTok = null;
      hoverCell = null;
      dirty = true;
    }
    return;
  }
  if (d.kind === "prop") {
    if (d.moved) {
      const [x, y] = snapProp(d.t, d.t.x, d.t.y);
      d.t.x = x;
      d.t.y = y;
      save("tokens");
    }
    dirty = true;
    return;
  }
  if (d.kind === "tplnew") {
    const t = d.t;
    if (isGM) {
      drawings.push(t);
      save("drawings");
    } else {
      ptpls[t.id] = t;
      send("tpl", { op: "set", t });
    }
    selTpl = t.id;
    setTool("move");
    drawTplBar();
    dirty = true;
    toast("Área colocada. Arraste para mover; a bolinha branca gira. Para outra, aperte M.", 2600);
    return;
  }
  if (d.kind === "tplmove" || d.kind === "tplrot") {
    if (d.moved) tplCommit(d.e);
    return;
  }
  if (d.kind === "propsize") {
    if (d.moved) {
      const [x, y] = snapProp(d.t, d.t.x, d.t.y);
      d.t.x = x;
      d.t.y = y;
      save("tokens");
      toast(`Tamanho: ${String(d.t.pw).replace(".", ",")} × ${String(d.t.ph).replace(".", ",")} casas`, 1400);
    }
    return;
  }
  if (d.kind === "rotate") {
    if (isProp(d.t)) {
      if (d.moved) {
        const [x, y] = snapProp(d.t, d.t.x, d.t.y);
        d.t.x = x;
        d.t.y = y;
        save("tokens");
      }
      return;
    }
    if (d.moved) {
      const t = d.t;
      delete tokLive[t.id];
      if (isGM) {
        send("tok", { id: t.id, x: t.x, y: t.y, a: t.a });
        save("tokens");
      } else tokReq({ id: t.id, a: t.a, who: myNick });
    }
    return;
  }
  if (d.kind === "token") {
    if (d.moved) {
      const [x, y] = d.grid
        ? [d.t.x, d.t.y]
        : d.t.sn === false
          ? [Math.round(d.t.x), Math.round(d.t.y)]
          : snapPoint(d.t.x, d.t.y, d.t.s || 1);
      d.t.x = x;
      d.t.y = y;
      delete tokLive[d.t.id];
      if (isGM && (x !== d.ox || y !== d.oy)) {
        const a0 = cellAt(d.ox, d.oy),
          a1 = cellAt(x, y);
        moveSpent(d.t, d.grid ? d.path.length - 1 : cellDist(a0[0], a0[1], a1[0], a1[1]));
      }
      if (isGM) {
        if (x !== d.ox || y !== d.oy)
          pushTrail(
            d.t,
            d.grid
              ? [[d.ox, d.oy], ...d.path.slice(1).map(c => cellCenter(...c))]
              : [
                  [d.ox, d.oy],
                  [x, y],
                ],
          );
        send("tok", { id: d.t.id, x, y });
        save("tokens");
      } else if (x !== d.ox || y !== d.oy)
        tokReq({
          id: d.t.id,
          x,
          y,
          who: myNick,
          path: [
            [d.ox, d.oy],
            ...d.path.slice(1).map(c => cellCenter(...c).map(v => Math.round(v * 10) / 10)),
          ],
        });
    }
    dirty = true;
    return;
  }
  if (d.kind === "ruler") {
    const rl = rulers[myKey];
    setTimeout(() => {
      if (rulers[myKey] === rl) {
        delete rulers[myKey];
        dirty = true;
        sendRuler();
      }
    }, 2500);
    return;
  }
  if (d.kind === "draw") {
    const s = d.shape;
    if (s.p.length > 1 && (s.t === "pen" || Math.hypot(s.p[1][0] - s.p[0][0], s.p[1][1] - s.p[0][1]) > 3)) {
      drawings.push(s);
      save("drawings");
    }
    dirty = true;
    return;
  }
  if (d.kind === "erase") {
    if (d.changed) save("drawings");
    return;
  }
  if (d.kind === "wallhide") {
    const ws = walls(),
      i = ws.indexOf(d.w);
    if (i < 0) return;
    const { L, a, b, pa, pb } = hideSeg(d),
      [x1, y1, x2, y2] = d.w.p,
      rest = { ...d.w };
    delete rest.p;
    const parts = [];
    if (a > 1) parts.push({ ...rest, p: [x1, y1, ...pa] });
    parts.push({ p: [...pa, ...pb], d: 1, o: 0, s: 1 });
    if (L - b > 1) parts.push({ ...rest, p: [...pb, x2, y2] });
    ws.splice(i, 1, ...parts);
    wallsChanged();
    toast(
      "Trecho oculto: vira passagem secreta. Os jogadores veem parede até você abrir (Mover → clique nela).",
      3200,
    );
    dirty = true;
    return;
  }
  if (d.kind === "zone") {
    if (d.moved) { save("scene"); if (d.mode === "size") toast(`Raio: ${String(d.z.r).replace(".", ",")} casas`, 1000); }
    return;
  }
  if (d.kind === "wallcircle") {
    if (d.r > 3) {
      walls().push({ c: d.c, r: Math.round(d.r * 10) / 10 });
      wallsChanged();
    }
    dirty = true;
    return;
  }
  if (d.kind === "wallpt") {
    if (d.moved) wallsChanged();
    else if (opt.wall !== "circle") {
      wallDraft = d.from;
      hoverWall = d.from;
      dirty = true;
    }
    return;
  }
  if (d.kind === "wallcirc") {
    if (d.moved) wallsChanged();
    return;
  }
  if (d.kind === "fogrect") {
    fogRect(d.a, d.b);
    dirty = true;
    return;
  }
  if (d.kind === "fogbrush") {
    save("fog");
    dirty = true;
  }
}
cv.addEventListener("pointerup", endPointer);
cv.addEventListener("pointercancel", endPointer);
cv.addEventListener("dblclick", e => {
  if (!isGM) return;
  const [wx, wy] = toWorld(e.clientX, e.clientY);
  const t = hitToken(wx, wy);
  if (t) return openTokenPanel(t);
  const pr = hitProp(wx, wy);
  if (pr) openPropPanel(pr);
});
cv.addEventListener("contextmenu", e => {
  if (!isGM) return;
  const [wx, wy] = toWorld(e.clientX, e.clientY);
  const t = hitToken(wx, wy) || hitProp(wx, wy);
  if (isProp(t)) {
    e.preventDefault();
    drag = null;
    cv.classList.remove("panning");
    selTok = t.id;
    dirty = true;
    return openPropPanel(t);
  }
  if (t) {
    e.preventDefault();
    drag = null;
    cv.classList.remove("panning");
    selTok = t.id;
    dirty = true;
    openTokenPanel(t);
  }
});
function rotateSel(dir) {
  const t = tokens.find(x => x.id === selTok);
  if (!t || !(isGM || owns(t))) return;
  const step = isProp(t) ? 90 : G().type === "hex" ? 60 : 45;
  t.a = ((((t.a || 0) + dir * step) % 360) + 360) % 360;
  dirty = true;
  if (isProp(t)) {
    const [x, y] = snapProp(t, t.x, t.y);
    t.x = x;
    t.y = y;
    save("tokens");
    return;
  }
  if (isGM) {
    send("tok", { id: t.id, x: t.x, y: t.y, a: t.a });
    save("tokens");
  } else tokReq({ id: t.id, a: t.a, who: myNick });
}
addEventListener("keydown", e => {
  if (e.target.closest?.("input,textarea,select")) return;
  if (e.code === "Space") {
    spaceDown = true;
    cv.classList.add("panning");
    e.preventDefault();
    return;
  }
  const k = e.key.toLowerCase();
  if ((e.ctrlKey || e.metaKey) && isGM && (k === "z" || k === "y")) {
    e.preventDefault();
    return undo(k === "y" || e.shiftKey);
  }
  if (e.ctrlKey || e.metaKey) return;
  if (k === "enter" && wallDraft) {
    wallDraft = null;
    dirty = true;
    return;
  }
  if (k === "escape" && wallDraft) {
    wallDraft = null;
    dirty = true;
    return;
  }
  if (k === "escape" && zonePlace) {
    zonePlace = null;
    toast("Cancelado.", 1000);
    return;
  }
  if (k === "enter" && !diceModal) {
    e.preventDefault();
    return openChat();
  }
  if (k === "escape" && diceModal) {
    closeDiceModal();
    return;
  }
  if (k === "escape" && barEdId) {
    closeBarEd();
    return;
  }
  if (k === "escape" && selTok) {
    selTok = null;
    hoverCell = null;
    dirty = true;
    return;
  }
  if (k === "escape") {
    if (rulers[myKey]) {
      delete rulers[myKey];
      sendRuler();
      dirty = true;
    }
    closePanel();
    closeFlyout();
    selTok = null;
    return;
  }
  if (k === "+" || k === "=") return zoomAt(1.2);
  if (k === "-") return zoomAt(1 / 1.2);
  if (k === "0") return fit();
  if ((k === "q" || k === "e") && selTok && (tool === "move" || !isGM)) {
    const t = tokens.find(x => x.id === selTok);
    if (t && (isGM || owns(t))) {
      e.preventDefault();
      return rotateSel(k === "q" ? -1 : 1);
    }
  }
  const map = { v: "move", r: "ruler", d: "draw", e: "erase", f: "fog", w: "wall", m: "spell" };
  if ((k === "delete" || k === "backspace") && selTpl) {
    const ct = curTpl();
    if (ct && canEditTpl(ct)) {
      tplRemove(ct);
      return;
    }
  }
  if (map[k] && (isGM || k === "v" || k === "r" || k === "m")) setTool(map[k]);
  if ((k === "delete" || k === "backspace") && selTok && isGM) {
    const t = tokens.find(x => x.id === selTok);
    if (t && confirm(`Remover o token “${t.n || "sem nome"}”?`)) {
      tokens = tokens.filter(x => x.id !== t.id);
      selTok = null;
      save("tokens");
      dirty = true;
    }
  }
});
addEventListener("keyup", e => {
  if (e.code === "Space") {
    spaceDown = false;
    cv.classList.remove("panning");
  }
});

function distSeg(px, py, [x1, y1], [x2, y2]) {
  const dx = x2 - x1,
    dy = y2 - y1,
    L = dx * dx + dy * dy;
  let t = L ? ((px - x1) * dx + (py - y1) * dy) / L : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - x1 - t * dx, py - y1 - t * dy);
}
function inTri(p, a, b, c) {
  const s = (a, b, c) => (a[0] - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (a[1] - c[1]);
  const d1 = s(p, a, b),
    d2 = s(p, b, c),
    d3 = s(p, c, a);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}
function hitDrawing(dr, x, y) {
  if (dr.t === "tpl") return inTpl(dr, x, y);
  if (dr.t === "text") {
    const fs = 10 + (dr.w || 4) * 3,
      lines = String(dr.s || "").split("\n");
    ctx.save();
    ctx.font = `700 ${fs}px "Alegreya Sans", sans-serif`;
    const w = Math.max(...lines.map(l => ctx.measureText(l).width));
    ctx.restore();
    return (
      x >= dr.p[0][0] - 4 &&
      x <= dr.p[0][0] + w + 4 &&
      y >= dr.p[0][1] - 4 &&
      y <= dr.p[0][1] + lines.length * fs * 1.15 + 4
    );
  }
  const tol = dr.w / 2 + 6 / cam.z,
    a = dr.p[0],
    b = dr.p[dr.p.length - 1];
  if (dr.t === "pen" || dr.t === "line") {
    for (let i = 1; i < dr.p.length; i++) if (distSeg(x, y, dr.p[i - 1], dr.p[i]) <= tol) return true;
    return dr.p.length === 1 && Math.hypot(a[0] - x, a[1] - y) <= tol;
  }
  if (dr.t === "circle") return Math.hypot(x - a[0], y - a[1]) <= Math.hypot(b[0] - a[0], b[1] - a[1]) + tol;
  if (dr.t === "rect")
    return (
      x >= Math.min(a[0], b[0]) - tol &&
      x <= Math.max(a[0], b[0]) + tol &&
      y >= Math.min(a[1], b[1]) - tol &&
      y <= Math.max(a[1], b[1]) + tol
    );
  if (dr.t === "cone") {
    const p = conePts(a, b);
    return inTri([x, y], ...p);
  }
  return false;
}
function eraseAt(x, y) {
  for (let i = drawings.length - 1; i >= 0; i--)
    if (hitDrawing(drawings[i], x, y)) {
      drawings.splice(i, 1);
      if (drag) drag.changed = true;
      dirty = true;
      return;
    }
}
function fogBrush(x, y) {
  const [a, b] = cellAt(x, y);
  for (const [ca, cb] of cellsInRange(a, b, opt.brush)) {
    const k = ca + "," + cb;
    if (opt.fog === "reveal") fog.cells[k] = 1;
    else delete fog.cells[k];
  }
  fog.sig = fogSig();
  dirty = true;
}
function fogRect(p, q) {
  const x0 = Math.min(p[0], q[0]),
    x1 = Math.max(p[0], q[0]),
    y0 = Math.min(p[1], q[1]),
    y1 = Math.max(p[1], q[1]);
  const [a0, b0] = cellAt(x0, y0),
    [a1, b1] = cellAt(x1, y1);
  const pad = G().type === "hex" ? 2 + Math.ceil((b1 - b0) / 2) : 1;
  for (let a = Math.min(a0, a1) - pad; a <= Math.max(a0, a1) + pad; a++)
    for (let b = Math.min(b0, b1) - 1; b <= Math.max(b0, b1) + 1; b++) {
      const [cx, cy] = cellCenter(a, b);
      if (cx < x0 || cx > x1 || cy < y0 || cy > y1) continue;
      const k = a + "," + b;
      if (opt.fog === "reveal") fog.cells[k] = 1;
      else delete fog.cells[k];
    }
  fog.sig = fogSig();
  save("fog");
}

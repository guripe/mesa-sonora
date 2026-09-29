"use strict";
// ---------- desenho ----------
function getImg(url) {
  if (!url) return null;
  let e = imgCache.get(url);
  if (!e) {
    e = new Image();
    e.crossOrigin = "anonymous";
    e.onload = () => {
      dirty = true;
    };
    e.onerror = () => {
      e.bad = true;
    };
    e.src = url;
    imgCache.set(url, e);
  }
  return e.complete && e.naturalWidth && !e.bad ? e : null;
}
let selBarKey = "";
function selBar() {
  const t = tokens.find(x => x.id === selTok),
    can = t && (isGM || owns(t));
  const key = can
    ? [
        t.id,
        t.n,
        t.h,
        isGM,
        JSON.stringify(t.b || []),
        (t.tr || []).length,
        t.pw,
        t.ph,
        JSON.stringify(t.cd || []),
        t.mt,
        t.dash,
        t.sh,
        scene.init?.on,
        scene.init?.cur,
      ].join("|")
    : "";
  if (key === selBarKey) return;
  selBarKey = key;
  let el = $("#selbar");
  if (!el) {
    el = document.createElement("div");
    el.id = "selbar";
    el.className = "selbar";
    document.body.appendChild(el);
  }
  if (!can) {
    el.hidden = true;
    $("#condPop")?.remove();
    return;
  }
  const cp = $("#condPop");
  if (cp && cp.dataset.t !== t.id) cp.remove();
  else if (cp) openCondPop(t);
  el.hidden = false;
  const bars = (t.b || [])
    .map((b, i) => ({ ...b, i }))
    .filter(b => (b.v !== "" && b.v != null) || (b.m !== "" && b.m != null));
  const barUI = bars
    .map(
      b => `<span class="sbbar" style="--bc:${esc(b.c || "#c0473a")}"><i></i>
      <button class="btn small" data-hp="${b.i}" data-d="-10">−10</button><button class="btn small" data-hp="${b.i}" data-d="-1">−1</button>
      <input class="sbv" data-hpv="${b.i}" value="${esc(b.v)}" inputmode="numeric" aria-label="Valor da barrinha ${b.i + 1}">${b.m !== "" && b.m != null ? `<em>/ ${esc(b.m)}</em>` : ""}
      <button class="btn small" data-hp="${b.i}" data-d="1">+1</button><button class="btn small" data-hp="${b.i}" data-d="10">+10</button></span>`,
    )
    .join("");
  el.innerHTML = `<div class="sbrow"><b>${esc(t.n || "Token")}</b>
    ${isGM ? `<button class="btn small" data-sb="edit">✎ Editar</button>` : ""}
    ${isGM && !isProp(t) && t.st ? `<button class="btn small" data-sb="stat" title="Status da criatura (só você vê)">📜 Ficha</button>` : ""}
    ${!isProp(t) && t.sh && shById(t.sh) ? `<button class="btn small" data-sb="sheet" title="Abrir a ficha ligada a este token">📜 Ficha</button>` : ""}
    ${
      !isProp(t)
        ? `<button class="btn small" data-sb="cond" title="Condições: envenenado, caído, atordoado…">✨ Condições${
            condsOf(t).length
              ? ` <small>${condsOf(t)
                  .map(c => condInfo(c.k)[1])
                  .slice(0, 4)
                  .join("")}</small>`
              : ""
          }</button>`
        : ""
    }
    ${inCombat(t) && maxCells(t) < Infinity ? `<span class="sbmove" title="Deslocamento neste turno">🥾 ${String(Math.round((+t.mt || 0) * (G().unit || 1) * 10) / 10).replace(".", ",")} / ${String(Math.round(moveBudget(t) * (G().unit || 1) * 10) / 10).replace(".", ",")} ${esc(G().unitName || "m")}</span>${!t.dash ? `<button class="btn small" data-sb="dash" title="Disparada: dobra o deslocamento neste turno">🏃 Disparada</button>` : ""}` : ""}
    <button class="btn small" data-sb="l" title="Girar (Q)" aria-label="Girar para a esquerda">↺</button><button class="btn small" data-sb="r" title="Girar (E)" aria-label="Girar para a direita">↻</button>
    ${isGM && isProp(t) ? `<button class="btn small" data-sb="smaller" title="Diminuir (ou arraste um canto)" aria-label="Diminuir">－</button><span class="sbsize">${String(t.pw || 1).replace(".", ",")}×${String(t.ph || 1).replace(".", ",")}</span><button class="btn small" data-sb="bigger" title="Aumentar (ou arraste um canto)" aria-label="Aumentar">＋</button>` : ""}
    ${isGM && !isProp(t) && t.tr?.length ? `<button class="btn small" data-sb="back" title="Volta para onde estava antes do último movimento">↶ Voltar movimento</button><button class="btn small" data-sb="trail" title="Apagar o rastro deste token">🧹 Rastro</button>` : ""}
    ${isGM ? `<button class="btn small" data-sb="hide">${t.h ? "👁 Mostrar aos jogadores" : "🚫 Ocultar"}</button><button class="btn small danger" data-sb="del">Remover</button>` : ""}</div>
    `;
  const setHP = (i, v) => {
    const cur = tokens.find(x => x.id === selTok);
    if (!cur?.b?.[i]) return;
    v = Math.round(v);
    cur.b[i].v = v;
    dirty = true;
    selBarKey = "";
    shFromTokenPV(cur, i);
    if (isGM) save("tokens");
    else tokReq({ id: cur.id, bi: i, bv: v, who: myNick });
  };
  el.querySelectorAll("[data-hpv]").forEach(inp => {
    inp.onkeydown = e => {
      if (e.key === "Enter") inp.blur();
      e.stopPropagation();
    };
    inp.onchange = () => {
      const raw = inp.value.trim().replace(",", ".");
      const cur = tokens.find(x => x.id === selTok);
      const old = +cur?.b?.[inp.dataset.hpv]?.v || 0;
      const v = /^[+-]/.test(raw) ? old + +raw : +raw;
      if (isFinite(v) && raw !== "") setHP(+inp.dataset.hpv, v);
      else selBarKey = "";
    };
  });
  el.onclick = e => {
    const b = e.target.closest("[data-sb],[data-hp]");
    if (!b) return;
    const cur = tokens.find(x => x.id === selTok);
    if (!cur) return;
    const a = b.dataset.sb;
    if (b.dataset.hp != null) {
      const i = +b.dataset.hp;
      return setHP(i, (+cur.b[i].v || 0) + +b.dataset.d);
    }
    if (a === "edit") return isProp(cur) ? openPropPanel(cur) : openTokenPanel(cur);
    if (a === "dash") {
      if (isGM) {
        cur.dash = 1;
        save("tokens");
      } else {
        cur.dash = 1;
        tokReq({ id: cur.id, dash: 1, who: myNick });
      }
      selBarKey = "";
      dirty = true;
      reachCache.key = "";
      return toast("🏃 Disparada: deslocamento dobrado neste turno.", 1800);
    }
    if (a === "sheet") return openSheet(cur.sh);
    if (a === "stat") return openStat(cur.id);
    if (a === "cond") {
      if ($("#condPop")) {
        $("#condPop").remove();
        return;
      }
      openCondPop(cur);
      $("#condPop").dataset.t = cur.id;
      return;
    }
    if (a === "back") {
      const mv = cur.tr?.pop();
      if (!mv) return;
      const [x, y] = mv[0];
      cur.x = x;
      cur.y = y;
      send("tok", { id: cur.id, x, y, a: cur.a });
      save("tokens");
      dirty = true;
      selBarKey = "";
      return toast("Movimento desfeito.");
    }
    if (a === "trail") {
      cur.tr = [];
      save("tokens");
      dirty = true;
      selBarKey = "";
      return;
    } else if (a === "l" || a === "r") rotateSel(a === "l" ? -1 : 1);
    else if (a === "bigger" || a === "smaller") {
      // aumenta/diminui mantendo a proporção
      const k = a === "bigger" ? 1 : -1,
        w = cur.pw || 1,
        h = cur.ph || 1,
        s0 = Math.min(w, h),
        s1 = Math.max(1, Math.min(20, s0 + k));
      if (s1 === s0) return;
      const f = s1 / s0;
      cur.pw = Math.max(1, Math.min(20, Math.round(w * f)));
      cur.ph = Math.max(1, Math.min(20, Math.round(h * f)));
      const [x, y] = snapProp(cur, cur.x, cur.y);
      cur.x = x;
      cur.y = y;
      save("tokens");
      dirty = true;
      selBarKey = "";
      return;
    } else if (a === "hide") {
      cur.h = !cur.h;
      save("tokens");
      dirty = true;
      toast(cur.h ? "Token oculto dos jogadores." : "Token visível para os jogadores.");
    } else if (a === "del") {
      if (confirm(`Remover “${cur.n || "token"}”?`)) {
        tokens = tokens.filter(x => x.id !== cur.id);
        selTok = null;
        save("tokens");
        dirty = true;
      }
    }
  };
}
let myTokens = (() => {
  try {
    return JSON.parse(localStorage.getItem("mesa.mytokens")) || [];
  } catch {
    return [];
  }
})();
const saveMyTokens = () => {
  try {
    localStorage.setItem("mesa.mytokens", JSON.stringify(myTokens));
  } catch {}
};
function openTokenList() {
  panelKind = "list";
  const row =
    t => `<div class="tlrow"><span class="tldot" style="background:${esc(t.c || "#d0a54c")}"></span><button class="tlname" data-go="${t.id}">${esc(t.n || "(sem nome)")}${t.h ? " <em>oculto</em>" : ""}${t.o ? ` <small>· ${t.o === "*" ? "todos" : esc(t.o)}</small>` : ""}</button>
    <button class="btn small" data-hide="${t.id}" title="${t.h ? "Mostrar" : "Ocultar"}">${t.h ? "👁" : "🚫"}</button><button class="btn small" data-edit="${t.id}">✎</button></div>`;
  $("#panel").innerHTML =
    `<div class="panel" role="dialog" aria-label="Tokens"><h3>Tokens <button class="btn small" id="pClose">Fechar</button></h3>
    ${
      tokens.some(t => !isProp(t))
        ? tokens
            .filter(t => !isProp(t))
            .map(row)
            .join("")
        : `<p class="hint">Nenhum token ainda.</p>`
    }
    <div class="acts"><button class="btn primary" id="lNew">${I.plus} Novo token</button><button class="btn" id="lAll" title="Cria um token para cada jogador com o mapa aberto que ainda não tem personagem">👥 Adicionar todos os jogadores</button></div>
    <div class="acat">Meus tokens <span class="sub">(salvos neste computador)</span></div>
    <div class="mytok">${myTokens.map((m, i) => `<button class="btn small" data-mt="${i}" title="Colocar no mapa (Shift+clique apaga)"><span class="tldot" style="background:${esc(m.c || "#d0a54c")}"></span>${esc(m.n || "Token")}</button>`).join("") || `<p class="hint">Na janela de um token, use “☆ Salvar em Meus Tokens”.</p>`}</div>
    ${tokens.some(isProp) ? `<div class="acat">Objetos no mapa</div>${tokens.filter(isProp).map(row).join("")}` : ""}</div>`;
  $("#pClose").onclick = closePanel;
  $("#lNew").onclick = () => openTokenPanel(null);
  $("#lAll").onclick = () => {
    const have = new Set(tokens.map(t => (t.o || "").toLowerCase())),
      names = peersOnMap.filter(n => !have.has(n.toLowerCase()));
    if (!names.length)
      return toast(
        peersOnMap.length
          ? "Todos os jogadores no mapa já têm personagem."
          : "Nenhum jogador está com o mapa aberto agora.",
      );
    const [x0, y0] = placeAt();
    names.forEach((n, i) => {
      const [x, y] = snapPoint(x0 + i * G().size, y0);
      tokens.push({
        id: uid(),
        n,
        o: n,
        c: COLORS[(i + 2) % COLORS.length],
        s: 1,
        x,
        y,
        sn: true,
        sp: 9,
        vi: { on: true, rb: 30, rd: 12, rk: 0, ang: 360 },
      });
    });
    save("tokens");
    dirty = true;
    openTokenList();
    toast(`${names.length} ${names.length === 1 ? "personagem criado" : "personagens criados"}.`);
  };
  $("#panel").onclick = e => {
    const g = e.target.closest("[data-go]"),
      h = e.target.closest("[data-hide]"),
      ed = e.target.closest("[data-edit]"),
      mt = e.target.closest("[data-mt]");
    if (mt) {
      const i = +mt.dataset.mt;
      if (e.shiftKey) {
        if (confirm("Apagar dos Meus tokens?")) {
          myTokens.splice(i, 1);
          saveMyTokens();
          openTokenList();
        }
        return;
      }
      const c = JSON.parse(JSON.stringify(myTokens[i]));
      const [x0, y0] = placeAt();
      const [x, y] = snapPoint(x0, y0, c.s || 1);
      tokens.push({ ...c, id: uid(), x, y });
      selTok = tokens[tokens.length - 1].id;
      save("tokens");
      dirty = true;
      return;
    }
    if (g) {
      const t = tokens.find(x => x.id === g.dataset.go);
      if (t) {
        selTok = t.id;
        centerOn(t.x, t.y, Math.max(cam.z, 0.8));
      }
    }
    if (h) {
      const t = tokens.find(x => x.id === h.dataset.hide);
      if (t) {
        t.h = !t.h;
        save("tokens");
        dirty = true;
        openTokenList();
      }
    }
    if (ed) {
      const t = tokens.find(x => x.id === ed.dataset.edit);
      if (t) isProp(t) ? openPropPanel(t) : openTokenPanel(t);
    }
  };
}
function frame() {
  if (isGM && scene.snd?.z?.length) zoneTick();
  if (pings.length || smoothBusy || walking || speakSet.size) dirty = true;
  if (dirty) {
    dirty = false;
    paint();
    selBar();
  }
  requestAnimationFrame(frame);
}
function paint() {
  refreshBlock();
  barBtn = null;
  const d = devicePixelRatio || 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#0d0b09";
  ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.setTransform(d * cam.z, 0, 0, d * cam.z, d * cam.x, d * cam.y);
  const vw = visibleWorld();
  // fundo
  const img = scene.bg ? getImg(scene.bg) : null;
  if (img) {
    const w = scene.bgW || img.naturalWidth,
      h = scene.bgH || img.naturalHeight,
      [W2, H2] = bgBox();
    ctx.save();
    ctx.translate(W2 / 2, H2 / 2);
    ctx.rotate((bgAngle() * Math.PI) / 180);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  } else {
    ctx.fillStyle = "#1b1611";
    ctx.fillRect(vw.x0, vw.y0, vw.x1 - vw.x0, vw.y1 - vw.y0);
  }
  const gcv = !img && genCanvas();
  if (gcv) {
    const gg = scene.gen;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(gcv, gg.x0 || 0, gg.y0 || 0, gg.w * gg.s, gg.h * gg.s);
  }
  // grid
  const g = G();
  if (g.show && g.size * cam.z >= 7) {
    ctx.beginPath();
    if (g.type === "hex") {
      const R = g.size / SQ3,
        rowH = 1.5 * R;
      const [lx0, ly0] = FL() ? [vw.y0 - g.oy, vw.x0 - g.ox] : [vw.x0 - g.ox, vw.y0 - g.oy],
        [lx1, ly1] = FL() ? [vw.y1 - g.oy, vw.x1 - g.ox] : [vw.x1 - g.ox, vw.y1 - g.oy];
      const r0 = Math.floor(ly0 / rowH) - 1,
        r1 = Math.ceil(ly1 / rowH) + 1;
      for (let r = r0; r <= r1; r++) {
        const q0 = Math.floor(lx0 / g.size - r / 2) - 1,
          q1 = Math.ceil(lx1 / g.size - r / 2) + 1;
        for (let q = q0; q <= q1; q++) {
          const c6 = hexCornersL(...cellCenterL(q, r), R);
          for (let i = 2; i < 5; i++) {
            ctx.moveTo(...c6[i]);
            ctx.lineTo(...c6[i + 1]);
          } // 3 arestas bastam (as outras são das vizinhas)
        }
      }
    } else {
      const s = g.size,
        x0 = Math.floor((vw.x0 - g.ox) / s) * s + g.ox,
        y0 = Math.floor((vw.y0 - g.oy) / s) * s + g.oy;
      for (let x = x0; x <= vw.x1; x += s) {
        ctx.moveTo(x, vw.y0);
        ctx.lineTo(x, vw.y1);
      }
      for (let y = y0; y <= vw.y1; y += s) {
        ctx.moveTo(vw.x0, y);
        ctx.lineTo(vw.x1, y);
      }
    }
    ctx.strokeStyle = g.color;
    ctx.globalAlpha = g.alpha;
    ctx.lineWidth = 1 / cam.z;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // desenhos
  paintZones();
  for (const dr of drawings) paintDrawing(dr);
  if (drag?.kind === "draw" && drag.shape) paintDrawing(drag.shape, true);
  // tokens
  const ts = (curTs = tsNow());
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
  const seenTok = t =>
    isGM || owns(t) || !vsP.length || vsP.some(v => sees(ts.find(x => x.id === v.id) || v, t.x, t.y, ts));
  for (const t of ts) if (!isProp(t) && (isGM || !t.h) && seenTok(t)) paintToken(t);
  paintTurnRing(ts);
  if (speakSet.size)
    for (const t of ts)
      if (!isProp(t) && t.o && speakSet.has(t.o.toLowerCase()) && (isGM || !t.h) && seenTok(t)) {
        // quem está falando na voz
        const r = tokR(t) + 5 / cam.z,
          pulse = 0.5 + 0.5 * Math.sin(performance.now() / 120);
        ctx.save();
        ctx.beginPath();
        ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(120,230,140,${0.55 + pulse * 0.4})`;
        ctx.lineWidth = (3 + pulse * 2) / cam.z;
        ctx.stroke();
        ctx.restore();
      }
  // névoa, luz e visão
  if (fog.on) paintFog();
  if (!isGM) {
    const vsL = viewers();
    paintLighting(vsL);
    // objetos que bloqueiam (casas, árvores) aparecem por cima da escuridão quando alguém vê a borda deles
    if (vsL.length) for (const t of ts) if (isProp(t) && t.blk && !t.h && propSeen(t, vsL, ts)) paintProp(t);
  } else if (gmPreview)
    paintLighting(
      tokens.filter(t => VI(t) && t.o),
      0.92,
    );
  if (isGM) paintWalls();
  if (drag?.kind === "fogrect") {
    const { a, b } = drag;
    ctx.strokeStyle = opt.fog === "reveal" ? "#ffe28a" : "#e0735e";
    ctx.setLineDash([8 / cam.z, 6 / cam.z]);
    ctx.lineWidth = 2 / cam.z;
    ctx.strokeRect(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
    ctx.setLineDash([]);
  }
  const brushAt =
    drag?.kind === "fogbrush"
      ? drag.at
      : !drag && tool === "fog" && isGM && opt.fogShape === "brush"
        ? hoverFog
        : null;
  if (brushAt) {
    const [a, b] = cellAt(...brushAt);
    ctx.beginPath();
    for (const [ca, cb] of cellsInRange(a, b, opt.brush)) cellPath(ctx, ca, cb);
    ctx.strokeStyle = opt.fog === "reveal" ? "#ffe28a" : "#e0735e";
    ctx.lineWidth = 2 / cam.z;
    ctx.stroke();
  }
  if (drag?.kind === "token" && drag.grid && drag.moved) paintPath(drag);
  paintReach();
  paintRollGM();
  paintPings();
  paintDropPrev();
  if (barEdId) placeBarEd();
  $("#doorPop")?._place?.();
  if (drag?.kind === "propsize" && drag.at)
    label(
      drag.at[0],
      drag.at[1],
      `${String(drag.t.pw).replace(".", ",")} × ${String(drag.t.ph).replace(".", ",")} casas`,
    );
  // réguas
  for (const k in rulers) paintRuler(rulers[k], k === myKey);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
function paintDrawing(dr, live) {
  if (dr.t === "tpl") return;
  if (dr.t === "text") {
    const fs = 10 + (dr.w || 4) * 3;
    ctx.save();
    ctx.font = `700 ${fs}px "Alegreya Sans", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.lineWidth = fs * 0.18;
    ctx.strokeStyle = "rgba(0,0,0,.75)";
    ctx.lineJoin = "round";
    String(dr.s || "")
      .split("\n")
      .forEach((ln, i) => {
        ctx.strokeText(ln, dr.p[0][0], dr.p[0][1] + i * fs * 1.15);
        ctx.fillStyle = dr.c;
        ctx.fillText(ln, dr.p[0][0], dr.p[0][1] + i * fs * 1.15);
      });
    ctx.restore();
    return;
  }
  const [a, b] = [dr.p[0], dr.p[dr.p.length - 1]];
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = dr.w;
  ctx.strokeStyle = dr.c;
  ctx.fillStyle = dr.c;
  ctx.beginPath();
  if (dr.t === "pen" || dr.t === "line") {
    dr.p.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  } else {
    if (dr.t === "circle") ctx.arc(a[0], a[1], Math.hypot(b[0] - a[0], b[1] - a[1]), 0, Math.PI * 2);
    else if (dr.t === "rect")
      ctx.rect(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
    else if (dr.t === "cone") {
      const pts = conePts(a, b);
      ctx.moveTo(...pts[0]);
      ctx.lineTo(...pts[1]);
      ctx.lineTo(...pts[2]);
      ctx.closePath();
    }
    ctx.globalAlpha = 0.22;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.stroke();
  }
  if (live && dr.t !== "pen") {
    const dist = Math.hypot(b[0] - a[0], b[1] - a[1]) / G().size;
    const cells = Math.round(dist * 10) / 10;
    label(
      b[0],
      b[1],
      `${String(cells).replace(".", ",")} casas · ${String(Math.round(cells * G().unit * 10) / 10).replace(".", ",")} ${G().unitName}`,
    );
  }
}
function conePts(a, b) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1],
    L = Math.hypot(dx, dy) || 1,
    nx = -dy / L,
    ny = dx / L,
    h = L / 2;
  return [a, [b[0] + nx * h, b[1] + ny * h], [b[0] - nx * h, b[1] - ny * h]];
}
function label(x, y, text) {
  const fs = 14 / cam.z;
  ctx.font = `700 ${fs}px "Alegreya Sans", sans-serif`;
  const w = ctx.measureText(text).width + 14 / cam.z,
    h = 22 / cam.z,
    lx = x + 12 / cam.z,
    ly = y - h - 6 / cam.z;
  ctx.fillStyle = "rgba(23,19,15,.92)";
  ctx.strokeStyle = "#d0a54c";
  ctx.lineWidth = 1 / cam.z;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(lx, ly, w, h, 6 / cam.z) : ctx.rect(lx, ly, w, h);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#eee2c9";
  ctx.textBaseline = "middle";
  ctx.fillText(text, lx + 7 / cam.z, ly + h / 2);
}
const unitPx = u => (u / (G().unit || 1)) * G().size; // metros → pixels
const dirVec = a => [Math.sin((a * Math.PI) / 180), -Math.cos((a * Math.PI) / 180)]; // 0° = para cima
const tokR = t => (((t.s || 1) * G().size) / 2) * 0.88;
const owns = t => !!t.o && (t.o === "*" || (!!myNick && t.o.toLowerCase() === myNick.toLowerCase()));
function paintAura(t) {
  const au = t.au;
  if (!au?.on || !(au.d > 0)) return;
  const R = unitPx(au.d) / 2;
  ctx.save();
  ctx.fillStyle = au.c || "#ff0000";
  ctx.strokeStyle = au.c || "#ff0000";
  ctx.lineWidth = 2 / cam.z;
  ctx.beginPath();
  if (au.f === "square") ctx.rect(t.x - R, t.y - R, R * 2, R * 2);
  else if (au.f === "cells") {
    const [a, b] = cellAt(t.x, t.y);
    const n = Math.max(1, Math.round(au.d / 2 / (G().unit || 1))) + 1;
    for (const [ca, cb] of cellsInRange(a, b, n)) cellPath(ctx, ca, cb);
  } else ctx.arc(t.x, t.y, R, 0, Math.PI * 2);
  ctx.globalAlpha = (t.h ? 0.5 : 1) * 0.2;
  ctx.fill();
  ctx.globalAlpha = t.h ? 0.5 : 0.85;
  if (au.f !== "cells") ctx.stroke();
  ctx.restore();
}
function viewers() {
  // tokens cuja visão vale para este jogador
  const vt = tokens.filter(t => VI(t) && t.o);
  const mine = vt.filter(owns);
  return mine.length ? mine : vt; // sem token próprio: vê o que o grupo vê
}
function paintToken(t) {
  const g = G(),
    r = tokR(t),
    ang = t.a || 0;
  ctx.save();
  if (t.h) ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
  ctx.shadowColor = "rgba(0,0,0,.6)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = t.c || "#d0a54c";
  ctx.fill();
  ctx.shadowColor = "transparent";
  const im = getImg(t.img);
  if (im) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(t.x, t.y, r * 0.86, 0, Math.PI * 2);
    ctx.clip();
    ctx.translate(t.x, t.y);
    if (t.dir === "rotate") ctx.rotate((ang * Math.PI) / 180);
    const s = Math.max((r * 2) / im.naturalWidth, (r * 2) / im.naturalHeight) * 0.86 * (t.iz || 1);
    ctx.drawImage(
      im,
      (-im.naturalWidth * s) / 2,
      (-im.naturalHeight * s) / 2,
      im.naturalWidth * s,
      im.naturalHeight * s,
    );
    ctx.restore();
  } else if (t.em) {
    ctx.font = `${r * 1.15}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(t.em, t.x, t.y + r * 0.08);
  } else {
    ctx.fillStyle = "#1a130b";
    ctx.font = `700 ${r * 0.8}px "Alegreya Sans", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText((t.n || "?").trim().slice(0, 2).toUpperCase(), t.x, t.y + r * 0.04);
  }
  ctx.lineWidth = Math.max(2, r * 0.1);
  ctx.strokeStyle =
    drag?.kind === "token" && (drag.wall || drag.limit) && drag.t.id === t.id
      ? "#ff4a3a"
      : selTok === t.id
        ? "#fff"
        : "rgba(0,0,0,.55)";
  ctx.beginPath();
  ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
  ctx.stroke();
  const vv = VI(t),
    ll = LI(t);
  const selMine = selTok === t.id && (isGM || owns(t));
  if (
    selMine ||
    t.dir === "arrow" ||
    (t.dir !== "rotate" && ((vv && vv.ang < 360) || (ll && ll.ang < 360)))
  ) {
    // seta de direção (arraste para girar)
    const [vx, vy] = dirVec(ang),
      px = -vy,
      py = vx,
      tip = r * 1.32,
      base = r * 1.02,
      w = r * 0.28;
    ctx.beginPath();
    ctx.moveTo(t.x + vx * tip, t.y + vy * tip);
    ctx.lineTo(t.x + vx * base + px * w, t.y + vy * base + py * w);
    ctx.lineTo(t.x + vx * base - px * w, t.y + vy * base - py * w);
    ctx.closePath();
    ctx.fillStyle = selTok === t.id ? "#fff" : t.c || "#d0a54c";
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,.6)";
    ctx.lineWidth = Math.max(1, r * 0.05);
    ctx.stroke();
    if (selMine) {
      ctx.beginPath();
      ctx.arc(t.x + vx * r * 1.2, t.y + vy * r * 1.2, Math.max(r * 0.3, 9 / cam.z), 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,.55)";
      ctx.setLineDash([3 / cam.z, 3 / cam.z]);
      ctx.lineWidth = 1.5 / cam.z;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  // barrinhas
  const bars = (t.b || []).filter(b => b && b.v !== "" && b.v != null);
  const canBar = selTok === t.id && !isProp(t) && (isGM || owns(t));
  if (canBar && !(bars.length && (isGM || t.bv !== false || owns(t)))) {
    const s = 16 / cam.z;
    paintBarBtn(t, t.x + r * 0.55, t.y - r - s - 3 / cam.z, s);
  }
  if (bars.length && (isGM || t.bv !== false || owns(t))) {
    const bw = r * 2,
      bh = Math.max(3 / cam.z, r * 0.15),
      gap = bh * 0.45;
    let y = t.y - r - 5 / cam.z - bars.length * (bh + gap);
    if (canBar) {
      const tot = bars.length * (bh + gap) - gap,
        s = Math.max(14 / cam.z, Math.min(22 / cam.z, tot));
      paintBarBtn(t, t.x + bw / 2 + 4 / cam.z, y + tot / 2 - s / 2, s);
    }
    for (const b of bars) {
      const v = Number(b.v),
        m = Number(b.m);
      ctx.fillStyle = "rgba(10,8,6,.85)";
      ctx.fillRect(t.x - bw / 2 - 1 / cam.z, y - 1 / cam.z, bw + 2 / cam.z, bh + 2 / cam.z);
      ctx.fillStyle = b.c || "#c0473a";
      ctx.fillRect(t.x - bw / 2, y, m > 0 ? bw * Math.max(0, Math.min(1, v / m)) : bw, bh);
      if (bh * cam.z >= 9) {
        ctx.font = `700 ${bh * 0.95}px "Alegreya Sans", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#fff";
        ctx.shadowColor = "#000";
        ctx.shadowBlur = 3;
        ctx.fillText(m > 0 ? `${b.v}/${b.m}` : String(b.v), t.x, y + bh / 2 + 0.5 / cam.z);
        ctx.shadowColor = "transparent";
      }
      y += bh + gap;
    }
  }
  if (t.n && g.size * cam.z > 26) {
    const fs = Math.max(11 / cam.z, r * 0.38);
    ctx.font = `700 ${fs}px "Alegreya Sans", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const w = ctx.measureText(t.n).width + fs * 0.8;
    ctx.fillStyle = "rgba(23,19,15,.85)";
    ctx.fillRect(t.x - w / 2, t.y + r + 2, w, fs * 1.3);
    ctx.fillStyle = owns(t) && !isGM ? "#ffe28a" : "#eee2c9";
    ctx.fillText(t.n, t.x, t.y + r + 2 + fs * 0.15);
  }
  if (t.h) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#e0735e";
    ctx.font = `700 ${r * 0.45}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("oculto", t.x, t.y - r * 0.15);
  }
  ctx.restore();
  paintConds(t);
}

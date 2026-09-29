"use strict";
// ---------- iniciativa e turnos (barra de retratos estilo Baldur's Gate) ----------
// scene.init = {on, round, cur, list: [{id, tk, n, f, v, hid}]}
const INI = () => scene.init || (scene.init = { on: false, round: 1, cur: 0, list: [] });
const iniTok = e => (e.tk ? tokens.find(t => t.id === e.tk) : null);
const iniOwner = e => {
  const t = iniTok(e);
  return t?.o || "";
};
const iniMine = e => {
  const t = iniTok(e);
  return !!t && owns(t);
};
function iniSort() {
  const I = INI(),
    curId = I.list[I.cur]?.id;
  I.list.sort((a, b) => (b.v ?? -99) - (a.v ?? -99));
  if (curId)
    I.cur = Math.max(
      0,
      I.list.findIndex(e => e.id === curId),
    );
}
function iniMod(t) {
  // bônus de iniciativa: da ficha ligada, ou da barra "Ini"/"Inic" se existir
  const sh = t?.sh && shById(t.sh);
  if (sh) return amod(sh, "des") + (+sh.ib || 0);
  if (t?.st?.at) return mod5(t.st.at[1]);
  const b = (t?.b || []).find(x => /^ini/i.test(x.n || ""));
  return b ? +b.v || 0 : 0;
}
function iniAdd(t) {
  const I = INI();
  if (I.list.some(e => e.tk === t.id)) return false;
  const m = iniMod(t);
  I.list.push({
    id: uid(),
    tk: t.id,
    n: t.n || "Token",
    f: `1d20${m ? (m > 0 ? "+" : "") + m : ""}`,
    v: null,
    hid: !!t.h,
  });
  return true;
}
function iniSave() {
  save("scene");
  drawTurnBar();
  dirty = true;
  if (panelKind === "ini") openIniPanel();
}
const INI_GRAY = "#8a8a90";
function iniRoll(e) {
  // rola a iniciativa e devolve o que mostrar
  let r;
  try {
    r = rollFormula(e.f || "1d20");
  } catch {
    r = rollFormula("1d20");
  }
  e.v = r.total;
  const t = iniTok(e);
  return {
    n: e.n || "Criatura",
    col: t?.o ? t.c || "#d0a54c" : INI_GRAY,
    hid: !!(e.hid || t?.h),
    f: r.f,
    dice: r.dice,
    mod: r.mod,
    total: r.total,
  };
}
function iniShow(items) {
  // todos os dados de uma vez na tela (e no histórico)
  if (!items.length) return;
  const pub = items.filter(x => !x.hid);
  if (pub.length) send("inistage", { items: pub });
  iniStage(items);
}
function iniStage(items) {
  $("#iniStage")?.remove();
  const st = document.createElement("div");
  st.id = "iniStage";
  st.className = "inistage";
  st.setAttribute("role", "dialog");
  st.setAttribute("aria-label", "Rolagem de iniciativa");
  st.innerHTML = `<div class="is-card"><div class="is-title">⚔️ Iniciativa</div>
    <div class="is-row">${items
      .map(
        (x, i) =>
          `<div class="is-one ${x.hid ? "hid" : ""}" style="--i:${i}">${x.dice
            .filter(d => !d.x)
            .slice(0, 2)
            .map(d => dieEl(d.d, "?", "huge rolling", x.col))
            .join("")}<b class="is-tot"></b><span class="is-n">${esc(x.n)}${x.hid ? " 🚫" : ""}</span></div>`,
      )
      .join("")}</div>
    <div class="ds-hint"></div></div>`;
  document.body.appendChild(st);
  const ones = [...st.querySelectorAll(".is-one")],
    t0 = performance.now(),
    land = items.map((_, i) => 900 + i * 170),
    end = Math.max(...land) + 200;
  DS.rattle(Math.min(8, items.length * 2));
  let landed = 0;
  const tick = now => {
    if (!st.isConnected) return;
    const el = now - t0;
    ones.forEach((o, i) => {
      if (o.classList.contains("done")) return;
      const dice = [...o.querySelectorAll(".die")],
        x = items[i],
        real = x.dice.filter(d => !d.x);
      if (el >= land[i]) {
        o.classList.add("done");
        dice.forEach((d, k) => {
          d.classList.remove("rolling");
          d.classList.add("landed");
          d.querySelector(".die-n").textContent = real[k]?.v ?? "?";
          if (real[k]?.d === 20 && real[k].v === 20) d.classList.add("c20");
          if (real[k]?.d === 20 && real[k].v === 1) d.classList.add("c1");
        });
        o.querySelector(".is-tot").textContent = x.total;
        DS.land();
        landed++;
      } else
        dice.forEach(d => {
          d.querySelector(".die-n").textContent = 1 + Math.floor(Math.random() * 20);
        });
    });
    if (el < end) return requestAnimationFrame(tick);
    DS.reveal();
    st.querySelector(".ds-hint").textContent = "clique para fechar";
    for (const x of items)
      if (isGM || !x.hid)
        diceLog.push({
          id: uid(),
          who: x.n,
          label: "Iniciativa",
          f: x.f,
          dice: x.dice,
          mod: x.mod,
          total: x.total,
          col: x.col,
          fresh: false,
          secret: x.hid,
        });
    while (diceLog.length > 50) diceLog.shift();
    drawDiceLog(true);
    setTimeout(close, 3200);
  };
  requestAnimationFrame(tick);
  const close = () => {
    if (!st.isConnected) return;
    st.classList.add("out");
    setTimeout(() => st.remove(), 300);
  };
  st.onclick = () => {
    if (st.querySelector(".ds-hint").textContent) close();
  };
}
function iniGo(step) {
  // próximo / anterior turno
  const I = INI();
  if (!I.list.length) return;
  I.cur += step;
  if (I.cur >= I.list.length) {
    I.cur = 0;
    I.round++;
    toast(`⚔️ Rodada ${I.round}`, 1600);
  }
  if (I.cur < 0) {
    I.cur = I.list.length - 1;
    I.round = Math.max(1, I.round - 1);
  }
  const t = iniTok(I.list[I.cur]);
  let tch = false;
  if (t && t.tr?.length) {
    t.tr = [];
    tch = true;
  } // rastro do novo turno começa limpo
  if (t && step > 0 && condTick(t)) tch = true;
  if (t && step > 0 && (t.mt || t.dash)) {
    t.mt = 0;
    t.dash = 0;
    tch = true;
  }
  if (tch) save("tokens");
  iniSave();
}
function openIniPanel() {
  panelKind = "ini";
  const I = INI();
  const row = (e, i) => {
    const t = iniTok(e);
    return `<div class="irow ${I.on && i === I.cur ? "cur" : ""} ${e.hid ? "hid" : ""}" data-ii="${i}" draggable="true">
      <span class="iport" style="--pc:${esc(t?.c || "#6b5a44")}">${t?.img ? `<img src="${esc(t.img)}" alt="">` : esc((e.n || "?").slice(0, 2).toUpperCase())}</span>
      <input class="in" data-in="${i}" value="${esc(e.n)}" maxlength="24" aria-label="Nome">
      <input class="if" data-if="${i}" value="${esc(e.f)}" maxlength="20" aria-label="Fórmula" title="Fórmula da iniciativa">
      <input class="iv" data-iv="${i}" value="${e.v ?? ""}" inputmode="numeric" aria-label="Iniciativa" title="Iniciativa">
      <button class="btn small ic" data-ir="${i}" title="Rolar esta">🎲</button>
      <button class="btn small ic" data-ih="${i}" title="${e.hid ? "Oculto dos jogadores" : "Jogadores veem"}">${e.hid ? "🚫" : "👁"}</button>
      <button class="btn small ic danger" data-ix="${i}" title="Tirar do combate">✕</button></div>`;
  };
  $("#panel").innerHTML =
    `<div class="panel ini-panel" role="dialog" aria-label="Iniciativa"><h3>Iniciativa ${I.on ? `<small class="iround">Rodada ${I.round}</small>` : ""}<button class="btn small" id="pClose">Fechar</button></h3>
    <div class="acts"><button class="btn small" id="iAddAll" title="Todos os personagens e criaturas do mapa (não os objetos)">＋ Tokens do mapa</button><button class="btn small" id="iAddSel" title="O token selecionado no mapa">＋ Selecionado</button><button class="btn small" id="iAddNew">＋ Manual</button></div>
    <div class="ihead"><span></span><span>Nome</span><span>Teste</span><span>Init</span></div>
    <div class="ilist" id="iList">${I.list.map(row).join("") || `<p class="hint">Ninguém no combate ainda. Adicione tokens acima.</p>`}</div>
    <div class="acts"><button class="btn small" id="iRollAll">🎲 Rolar todos</button><button class="btn small" id="iAsk" title="Os jogadores rolam a iniciativa dos próprios personagens">📣 Pedir aos jogadores</button><button class="btn small" id="iSort">↕ Ordenar</button><span class="spacer"></span><button class="btn small danger" id="iClear">Limpar</button></div>
    <div class="acts foot">${I.on ? `<button class="btn" id="iPrev">⏮</button><button class="btn primary" id="iNext">Próximo turno ⏭</button><span class="spacer"></span><button class="btn danger" id="iEnd">Encerrar combate</button>` : `<span class="spacer"></span><button class="btn primary" id="iStart" ${I.list.length ? "" : "disabled"}>⚔️ Começar combate</button>`}</div>
    <p class="hint">Arraste as linhas para mudar a ordem. 🚫 esconde da barra dos jogadores (monstros surpresa). O bônus vem da barra “Ini” do token, se existir. No combate, os jogadores veem a barra de retratos no topo e recebem “Seu turno!”.</p></div>`;
  const P = $("#panel");
  $("#pClose").onclick = closePanel;
  $("#iAddAll").onclick = () => {
    let n = 0;
    for (const t of tokens) if (!isProp(t) && iniAdd(t)) n++;
    if (!n) toast("Todos os tokens do mapa já estão no combate.");
    iniSave();
  };
  $("#iAddSel").onclick = () => {
    const t = tokens.find(x => x.id === selTok && !isProp(x));
    if (!t) return toast("Selecione um token no mapa primeiro.");
    if (!iniAdd(t)) toast("Ele já está no combate.");
    iniSave();
  };
  $("#iAddNew").onclick = () => {
    INI().list.push({ id: uid(), tk: null, n: "Criatura", f: "1d20", v: null, hid: false });
    iniSave();
  };
  $("#iRollAll").onclick = () => {
    const shown = [];
    for (const e of INI().list) if (e.v == null || !I.on) shown.push(iniRoll(e));
    iniShow(shown);
    iniSort();
    iniSave();
  };
  $("#iSort").onclick = () => {
    iniSort();
    iniSave();
  };
  $("#iClear").onclick = () => {
    if (confirm("Tirar todo mundo da lista de iniciativa?")) {
      scene.init = { on: false, round: 1, cur: 0, list: [] };
      iniSave();
    }
  };
  $("#iAsk").onclick = () => {
    const L = I.list.filter(e => iniOwner(e)).map(e => ({ id: e.id, n: e.n, f: e.f, o: iniOwner(e) }));
    if (!L.length) return toast("Nenhum token de jogador na lista (dê um dono ao token).");
    send("iniask", { list: L });
    toast("Pedido enviado: os jogadores vão rolar.");
  };
  if ($("#iStart"))
    $("#iStart").onclick = () => {
      const shown = [];
      for (const e of I.list) if (e.v == null) shown.push(iniRoll(e));
      iniShow(shown);
      iniSort();
      Object.assign(I, { on: true, round: 1, cur: 0, go: Date.now() });
      for (const t of tokens) {
        delete t.mt;
        delete t.dash;
      }
      save("tokens");
      iniSave();
      sndCombat(true);
    };
  if ($("#iNext")) $("#iNext").onclick = () => iniGo(1);
  if ($("#iPrev")) $("#iPrev").onclick = () => iniGo(-1);
  if ($("#iEnd"))
    $("#iEnd").onclick = () => {
      I.on = false;
      for (const t of tokens) {
        delete t.mt;
        delete t.dash;
      }
      save("tokens");
      iniSave();
      toast("Combate encerrado.");
      sndCombat(false);
    };
  P.oninput = e => {
    const d = e.target.dataset;
    const i = +(d.in ?? d.if ?? d.iv);
    if (isNaN(i)) return;
    const en = I.list[i];
    if (d.in != null) en.n = e.target.value;
    else if (d.if != null) en.f = e.target.value;
    else {
      const v = e.target.value.trim();
      en.v = v === "" ? null : +v || 0;
    }
    clearTimeout(P._t);
    P._t = setTimeout(() => {
      save("scene", "merge");
      drawTurnBar();
    }, 400);
  };
  P.onkeydown = e => e.stopPropagation();
  P.onclick = e => {
    const b = e.target.closest("button");
    if (!b) return;
    const d = b.dataset;
    if (d.ir != null) {
      const en = I.list[+d.ir];
      iniShow([iniRoll(en)]);
      iniSave();
    } else if (d.ih != null) {
      const en = I.list[+d.ih];
      en.hid = !en.hid;
      iniSave();
    } else if (d.ix != null) {
      const i = +d.ix;
      I.list.splice(i, 1);
      if (I.cur >= I.list.length) I.cur = 0;
      else if (i < I.cur) I.cur--;
      iniSave();
    }
  };
  // arrastar as linhas para reordenar
  let from = null;
  P.ondragstart = e => {
    const r = e.target.closest("[data-ii]");
    if (!r) return;
    from = +r.dataset.ii;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/mesa-ini", String(from));
    r.classList.add("dragging");
  };
  P.ondragover = e => {
    const r = e.target.closest("[data-ii]");
    if (from == null || !r) return;
    e.preventDefault();
    P.querySelectorAll(".irow.over").forEach(x => x !== r && x.classList.remove("over"));
    r.classList.add("over");
  };
  P.ondrop = e => {
    const r = e.target.closest("[data-ii]");
    if (from == null || !r) return;
    e.preventDefault();
    const to = +r.dataset.ii,
      curId = I.list[I.cur]?.id,
      [m] = I.list.splice(from, 1);
    I.list.splice(to, 0, m);
    I.cur = Math.max(
      0,
      I.list.findIndex(x => x.id === curId),
    );
    from = null;
    iniSave();
  };
  P.ondragend = () => {
    from = null;
    P.querySelectorAll(".dragging,.over").forEach(x => x.classList.remove("dragging", "over"));
  };
}
let lastTurnKey = "";
function drawTurnBar() {
  const I = scene.init;
  let el = $("#turnBar");
  if (!I?.on || !I.list?.length) {
    el?.remove();
    lastTurnKey = "";
    return;
  }
  if (!el) {
    el = document.createElement("div");
    el.id = "turnBar";
    el.className = "turnbar";
    document.body.appendChild(el);
  }
  // a entrada animada só acontece quando o mestre clica em "Começar combate" (não ao abrir a página)
  if (I.go && I.go !== tbIntro.go) {
    tbIntro.go = I.go;
    if (Date.now() - I.go < 15000) startIntro();
  }
  const vis = I.list.map((e, i) => ({ e, i })).filter(x => isGM || !x.e.hid),
    cur = I.list[I.cur];
  const curVis = isGM || !cur?.hid;
  el.innerHTML = `<div class="tb-round">Rodada <b>${I.round}</b></div>
    ${isGM ? `<button class="tb-nav" id="tbPrev" title="Turno anterior">◀</button>` : ""}
    <div class="tb-list">${vis
      .map(({ e, i }) => {
        const t = iniTok(e),
          on = i === I.cur;
        return `<button class="tb-p ${on ? "on" : ""} ${iniMine(e) ? "mine" : ""} ${e.hid ? "hid" : ""} ${!t && e.tk ? "gone" : ""}" data-tb="${i}" style="--pc:${esc(t?.c || "#6b5a44")}" title="${esc(e.n)}${e.v != null ? " · iniciativa " + e.v : ""}">
        <span class="tb-img">${t?.img ? `<img src="${esc(t.img)}" alt="">` : `<span>${esc((e.n || "?").slice(0, 2).toUpperCase())}</span>`}</span>
        ${isGM || t?.o ? (t?.b?.[0] ? `<span class="tb-hp"><i style="width:${Math.max(0, Math.min(100, ((+t.b[0].v || 0) / Math.max(1, +t.b[0].m || 1)) * 100))}%"></i></span>` : "") : ""}
        ${
          t && condsOf(t).length && (isGM || !t.h)
            ? `<span class="tb-cd">${condsOf(t)
                .slice(0, 3)
                .map(c => condInfo(c.k)[1])
                .join("")}</span>`
            : ""
        }<span class="tb-n">${esc(e.n)}</span>${on ? `<span class="tb-arrow">▲</span>` : ""}${e.v != null ? `<span class="tb-ini">${e.v}</span>` : ""}</button>`;
      })
      .join("")}</div>
    ${isGM ? `<button class="tb-nav next" id="tbNext" title="Próximo turno">▶</button>` : cur && iniMine(cur) ? `<button class="btn small primary tb-end" id="tbEnd">✔ Terminar meu turno</button>` : ""}`;
  if (tbIntro.active) {
    el.classList.add("intro");
    el.querySelectorAll(".tb-p").forEach((p, k) => p.classList.add(k < tbIntro.shown ? "in" : "pre"));
  }
  if (isGM) {
    $("#tbPrev").onclick = () => iniGo(-1);
    $("#tbNext").onclick = () => iniGo(1);
  }
  const te = $("#tbEnd");
  if (te)
    te.onclick = () => {
      send("endturn", { id: cur.id, who: myNick });
      te.disabled = true;
      te.textContent = "…";
    };
  el.querySelector(".tb-list").onclick = e => {
    const b = e.target.closest("[data-tb]");
    if (!b) return;
    const t = iniTok(I.list[+b.dataset.tb]);
    if (t && (isGM || !t.h)) centerOn(t.x, t.y, Math.max(cam.z, 0.8));
    if (isGM && e.detail === 2) openIniPanel();
  };
  el.querySelector(".tb-list").ondblclick = () => {
    if (isGM) openIniPanel();
  };
  // anúncio de troca de turno
  const key = I.round + ":" + (cur?.id || "");
  if (key !== lastTurnKey && !tbIntro.active) {
    const first = !lastTurnKey;
    lastTurnKey = key;
    if (cur && curVis && !first) turnAnnounce(cur);
    else if (cur && curVis && first && iniMine(cur)) turnAnnounce(cur);
  }
}
// ---- entrada dramática do combate (só depois de "Começar combate"; dá para pular) ----
const tbIntro = { go: 0, active: false, shown: 0, timers: [] };
function startIntro() {
  const I = scene.init;
  if (!I?.on) return;
  tbIntro.timers.forEach(clearTimeout);
  tbIntro.timers = [];
  Object.assign(tbIntro, { active: true, shown: 0 });
  const go = () => {
    // espera a tela da rolagem de iniciativa fechar
    if ($("#iniStage")) {
      tbIntro.timers.push(setTimeout(go, 250));
      return;
    }
    let ov = $("#combatIntro");
    ov?.remove();
    ov = document.createElement("div");
    ov.id = "combatIntro";
    ov.className = "combatintro";
    ov.innerHTML = `<div class="ci-banner"><span class="ci-sw">⚔️</span><b>Combate!</b><small>Ordem de iniciativa</small></div><button class="btn ci-skip" id="ciSkip">Pular animação ⏭</button>`;
    document.body.appendChild(ov);
    $("#ciSkip").onclick = endIntro;
    drawTurnBar();
    if (DS.init()) {
      const t = DS.ctx.currentTime;
      DS.tone(t, 55, 1.4, 0.5, "sine", 35);
      DS.click(t, 180, 0.6, 0.5, 0.8);
      DS.drumroll(1.6);
    }
    const n = document.querySelectorAll("#turnBar .tb-p").length,
      T0 = 1900,
      GAP = 850;
    for (let k = 0; k < n; k++)
      tbIntro.timers.push(
        setTimeout(
          () => {
            tbIntro.shown = k + 1;
            const p = document.querySelectorAll("#turnBar .tb-p")[k];
            if (p) {
              p.classList.remove("pre");
              p.classList.add("in");
            }
            if (DS.init()) {
              const t = DS.ctx.currentTime;
              DS.tone(t, 70 + k * 6, 0.35, 0.45, "sine", 40);
              DS.click(t, 240, 0.5, 0.12, 1);
              DS.tone(t + 0.02, 392 + k * 49, 0.4, 0.07, "triangle");
            }
          },
          T0 + k * GAP,
        ),
      );
    tbIntro.timers.push(setTimeout(endIntro, T0 + n * GAP + 900));
  };
  go();
}
function endIntro() {
  if (!tbIntro.active) return;
  tbIntro.timers.forEach(clearTimeout);
  tbIntro.timers = [];
  tbIntro.active = false;
  const ov = $("#combatIntro");
  if (ov) {
    ov.classList.add("out");
    setTimeout(() => ov.remove(), 400);
  }
  const el = $("#turnBar");
  el?.classList.remove("intro");
  el?.querySelectorAll(".tb-p").forEach(p => p.classList.remove("pre", "in"));
  lastTurnKey = "";
  drawTurnBar();
  const I = scene.init,
    cur = I?.list?.[I.cur];
  if (cur && (isGM || !cur.hid)) turnAnnounce(cur);
}
function turnAnnounce(e) {
  const mine = iniMine(e),
    b = document.createElement("div");
  b.className = "turnann" + (mine ? " mine" : "");
  b.innerHTML = mine ? `⚔️ <b>Seu turno!</b> <span>${esc(e.n)}</span>` : `Turno de <b>${esc(e.n)}</b>`;
  document.body.appendChild(b);
  setTimeout(() => b.remove(), mine ? 2600 : 1700);
  if (DS.init()) {
    const t = DS.ctx.currentTime;
    if (mine) {
      DS.tone(t, 523, 0.18, 0.16, "triangle");
      DS.tone(t + 0.12, 784, 0.3, 0.16, "triangle");
    } else DS.tone(t, 440, 0.12, 0.07, "sine");
  }
  const tk = iniTok(e);
  if (tk && mine) centerOn(tk.x, tk.y, Math.max(cam.z, 0.8));
}
function paintTurnRing(ts) {
  // o token da vez ganha um anel dourado no mapa
  const I = scene.init;
  if (!I?.on) return;
  const e = I.list?.[I.cur];
  if (!e?.tk || (!isGM && e.hid)) return;
  const t = ts.find(x => x.id === e.tk);
  if (!t || (!isGM && t.h)) return;
  const r = tokR(t) + 7 / cam.z;
  ctx.save();
  ctx.beginPath();
  ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
  ctx.shadowColor = "#ffd76a";
  ctx.shadowBlur = 14;
  ctx.strokeStyle = "#ffd76a";
  ctx.lineWidth = 3.5 / cam.z;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.setLineDash([6 / cam.z, 5 / cam.z]);
  ctx.beginPath();
  ctx.arc(t.x, t.y, r + 5 / cam.z, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,215,106,.55)";
  ctx.lineWidth = 1.5 / cam.z;
  ctx.stroke();
  ctx.restore();
}
function iniAskPrompt(list) {
  // jogador: rolar a iniciativa dos seus personagens
  const mine = list.filter(
    e => String(e.o || "").toLowerCase() === String(myNick || "").toLowerCase() || e.o === "*",
  );
  if (!mine.length) return;
  let box = $("#iniAsk");
  box?.remove();
  box = document.createElement("div");
  box.id = "iniAsk";
  box.className = "iniask";
  box.innerHTML = `<b>⚔️ Role a iniciativa!</b>${mine.map(e => `<button class="btn primary" data-ia="${esc(e.id)}" data-f="${esc(e.f)}" data-n="${esc(e.n)}">🎲 ${esc(e.n)} <small>${esc(e.f)}</small></button>`).join("")}`;
  document.body.appendChild(box);
  if (DS.init()) DS.tone(DS.ctx.currentTime, 660, 0.2, 0.1, "sine");
  box.onclick = ev => {
    const b = ev.target.closest("[data-ia]");
    if (!b) return;
    let r;
    try {
      r = rollFormula(b.dataset.f);
    } catch {
      r = rollFormula("1d20");
    }
    const tk =
      tokens.find(t => owns(t) && (t.n || "") === b.dataset.n) || tokens.find(t => !isProp(t) && owns(t));
    const roll = {
      id: uid(),
      v: MAP_VER,
      who: b.dataset.n || myNick || "Jogador",
      label: "Iniciativa",
      ...r,
      secret: false,
      snd: null,
      col: tk?.c || "#d0a54c",
    };
    send("roll", roll);
    addRoll(roll, true);
    send("inires", { id: b.dataset.ia, v: r.total, who: myNick });
    b.remove();
    if (!box.querySelector("[data-ia]")) box.remove();
  };
}

// ---------- condições nos tokens (envenenado, caído…) com contagem de rodadas ----------
// t.cd = [{k, r}] · r = rodadas que faltam (vazio = sem limite). Desce no começo do turno do token.
const CONDS = [
  ["agarrado", "🤼", "Agarrado", "Deslocamento vira 0."],
  [
    "amedrontado",
    "😱",
    "Amedrontado",
    "Desvantagem em testes e ataques enquanto vê a fonte do medo; não pode se aproximar dela.",
  ],
  [
    "atordoado",
    "💫",
    "Atordoado",
    "Incapacitado, não se move, fala com dificuldade. Falha em salvaguardas de FOR e DES. Ataques contra ele têm vantagem.",
  ],
  [
    "caido",
    "🛌",
    "Caído",
    "Só rasteja. Desvantagem nos ataques. Ataques corpo a corpo contra ele têm vantagem; à distância, desvantagem.",
  ],
  ["cego", "🙈", "Cego", "Não enxerga. Desvantagem nos ataques; ataques contra ele têm vantagem."],
  [
    "contido",
    "⛓️",
    "Contido",
    "Deslocamento 0. Desvantagem nos ataques e em salvaguardas de DES. Ataques contra ele têm vantagem.",
  ],
  [
    "enfeiticado",
    "💕",
    "Enfeitiçado",
    "Não ataca quem o enfeitiçou; essa criatura tem vantagem em testes sociais com ele.",
  ],
  ["envenenado", "🤢", "Envenenado", "Desvantagem em ataques e testes de habilidade."],
  ["exausto", "😩", "Exausto", "Níveis de exaustão (anote o nível nas rodadas, se quiser)."],
  ["incapacitado", "😵", "Incapacitado", "Não pode fazer ações nem reações."],
  [
    "inconsciente",
    "💤",
    "Inconsciente",
    "Incapacitado, caído, larga o que segura. Ataques contra ele têm vantagem; corpo a corpo perto é crítico.",
  ],
  [
    "invisivel",
    "👻",
    "Invisível",
    "Não pode ser visto sem ajuda. Vantagem nos ataques; ataques contra ele têm desvantagem.",
  ],
  [
    "paralisado",
    "🧊",
    "Paralisado",
    "Incapacitado, não se move nem fala. Ataques têm vantagem; corpo a corpo perto é crítico.",
  ],
  ["petrificado", "🗿", "Petrificado", "Vira pedra. Incapacitado, resistência a todo dano."],
  ["surdo", "🙉", "Surdo", "Não ouve; falha em testes que dependem de audição."],
  [
    "concentrando",
    "🧠",
    "Concentrando",
    "Mantendo uma magia. Ao sofrer dano: salvaguarda de CON (CD 10 ou metade do dano).",
  ],
  ["abencoado", "✨", "Abençoado", "Bônus (ex.: +1d4) em ataques e salvaguardas."],
  ["queimando", "🔥", "Queimando", "Sofre dano de fogo no começo do turno."],
  ["sangrando", "🩸", "Sangrando", "Perde vida a cada turno."],
  ["escondido", "🫥", "Escondido", "Os inimigos não sabem onde ele está."],
  ["marcado", "🎯", "Marcado", "Alvo marcado (Marca do Caçador, Maldição…)."],
  ["lento", "🐌", "Lento", "Deslocamento reduzido pela metade."],
];
const condInfo = k => CONDS.find(c => c[0] === k);
const condsOf = t => (t?.cd || []).filter(c => c && condInfo(c.k));
function paintConds(t) {
  // bolinhas com o emoji em volta do token (lado esquerdo, de cima para baixo)
  const L = condsOf(t);
  if (!L.length || (!isGM && t.h)) return;
  const r = tokR(t),
    s = Math.max(9 / cam.z, r * 0.36),
    n = Math.min(L.length, 6);
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < n; i++) {
    const an = Math.PI * (1.12 + i * 0.2),
      x = t.x + Math.cos(an) * (r + s * 0.15),
      y = t.y + Math.sin(an) * (r + s * 0.15);
    ctx.beginPath();
    ctx.arc(x, y, s * 0.62, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(20,15,11,.92)";
    ctx.fill();
    ctx.lineWidth = 1.2 / cam.z;
    ctx.strokeStyle = "#d0a54c";
    ctx.stroke();
    const c = L[i];
    ctx.font = `${s * 0.72}px sans-serif`;
    ctx.fillStyle = "#fff";
    ctx.fillText(i === 5 && L.length > 6 ? "+" + (L.length - 5) : condInfo(c.k)[1], x, y + s * 0.04);
    if (c.r > 0 && !(i === 5 && L.length > 6)) {
      ctx.font = `700 ${s * 0.42}px "Alegreya Sans", sans-serif`;
      const bx = x + s * 0.45,
        by = y + s * 0.42;
      ctx.beginPath();
      ctx.arc(bx, by, s * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = "#d0a54c";
      ctx.fill();
      ctx.fillStyle = "#1c150c";
      ctx.fillText(String(c.r), bx, by + s * 0.02);
    }
  }
  ctx.restore();
}
function condSave(t) {
  // mestre salva; jogador pede ao mestre
  dirty = true;
  selBarKey = "";
  drawTurnBar();
  if (isGM) {
    save("tokens");
    return;
  }
  tokReq({ id: t.id, cd: condsOf(t).map(c => ({ k: c.k, r: c.r || "" })), who: myNick });
}
function condClean(list) {
  return (Array.isArray(list) ? list : [])
    .slice(0, 24)
    .filter(c => c && condInfo(String(c.k)))
    .map(c => ({ k: String(c.k), r: +c.r > 0 ? Math.min(99, Math.round(+c.r)) : "" }));
}
let condDur = "";
function openCondPop(t) {
  let el = $("#condPop");
  if (!el) {
    el = document.createElement("div");
    el.id = "condPop";
    el.className = "condpop";
    document.body.appendChild(el);
    el.onpointerdown = e => e.stopPropagation();
    el.onkeydown = e => e.stopPropagation();
  }
  const draw = () => {
    const cur = tokens.find(x => x.id === t.id);
    if (!cur) return el.remove();
    const on = new Map(condsOf(cur).map(c => [c.k, c]));
    el.innerHTML = `<div class="cp-head"><b>Condições · ${esc(cur.n || "Token")}</b><span class="spacer"></span><label class="cp-dur" title="Quantas rodadas a condição dura quando você liga (vazio = até tirar). Desce 1 no começo de cada turno do token.">Duração <input id="cpDur" inputmode="numeric" placeholder="∞" value="${esc(condDur)}"> rodadas</label><button class="be-x" data-cp="close" aria-label="Fechar">✕</button></div>
      <div class="cp-grid">${CONDS.map(([k, e, n, d]) => {
        const c = on.get(k);
        return `<button class="cp-c" data-ck="${k}" aria-pressed="${!!c}" title="${esc(n)}: ${esc(d)}"><span>${e}</span>${esc(n)}${c ? `<i class="cp-r">${c.r > 0 ? c.r : "∞"}</i>` : ""}</button>`;
      }).join("")}</div>
      ${
        on.size
          ? `<div class="cp-on">${[...on.values()]
              .map(c => {
                const [, e, n] = condInfo(c.k);
                return `<span class="cp-chip">${e} ${esc(n)} <button data-cm="${c.k}" title="Uma rodada a menos">−</button><b>${c.r > 0 ? c.r : "∞"}</b><button data-cpl="${c.k}" title="Uma rodada a mais">+</button><button data-ck="${c.k}" title="Tirar">✕</button></span>`;
              })
              .join("")}</div>`
          : `<p class="hint" style="margin:6px 0 0">Clique numa condição para ligar ou desligar. Passe o mouse para ver o que ela faz.</p>`
      }`;
    const di = $("#cpDur");
    di.oninput = () => {
      condDur = di.value.replace(/\D/g, "").slice(0, 2);
    };
    placeCondPop();
  };
  el.onclick = e => {
    const b = e.target.closest("button");
    if (!b) return;
    const cur = tokens.find(x => x.id === t.id);
    if (!cur) return;
    const d = b.dataset;
    if (d.cp === "close") return el.remove();
    cur.cd = condsOf(cur);
    if (d.ck) {
      const i = cur.cd.findIndex(c => c.k === d.ck);
      if (i >= 0) cur.cd.splice(i, 1);
      else {
        cur.cd.push({ k: d.ck, r: +condDur > 0 ? +condDur : "" });
        if (DS.init()) DS.tone(DS.ctx.currentTime, 620, 0.12, 0.06, "triangle");
      }
    } else if (d.cm || d.cpl) {
      const c = cur.cd.find(x => x.k === (d.cm || d.cpl));
      if (!c) return;
      const v = (+c.r || 0) + (d.cm ? -1 : 1);
      if (v <= 0 && d.cm) c.r = "";
      else c.r = Math.min(99, Math.max(1, v));
    }
    condSave(cur);
    draw();
  };
  draw();
}
function placeCondPop() {
  const el = $("#condPop"),
    sb = $("#selbar");
  if (!el) return;
  const r = sb && !sb.hidden ? sb.getBoundingClientRect() : { top: innerHeight - 120 };
  el.style.bottom = Math.max(8, innerHeight - r.top + 8) + "px";
}
function condTick(t) {
  // começo do turno do token: desce as rodadas (só o mestre)
  if (!isGM || !t?.cd?.length) return false;
  let ch = false;
  const gone = [];
  t.cd = condsOf(t).filter(c => {
    if (!(c.r > 0)) return true;
    c.r--;
    ch = true;
    if (c.r <= 0) {
      gone.push(condInfo(c.k)[2]);
      return false;
    }
    return true;
  });
  if (gone.length) toast(`⏳ ${t.n || "Token"}: acabou ${gone.join(", ")}.`, 2600);
  return ch;
}

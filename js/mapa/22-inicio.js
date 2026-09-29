"use strict";
// ---------- início ----------
async function boot() {
  let cfg;
  try {
    cfg = await (await fetch("/api/config", { cache: "no-store" })).json();
  } catch {}
  if (!cfg?.url || !cfg?.key) {
    $("#gate").textContent = "O site ainda não está ligado ao banco.";
    return;
  }
  sb = window.supabase.createClient(cfg.url, cfg.key);
  const {
    data: { session },
  } = await sb.auth.getSession();
  isGM = !!session;
  sb.auth.onAuthStateChange((_e, s) => {
    if (!!s !== isGM) location.reload();
  });
  drawTools();
  drawTop();
  setTool("move");
  if (!(await load())) return;
  if (!isGM && !myNick) await askNick();
  $("#gate").hidden = true;
  fit();
  if (!isGM && !EDIT_ID) {
    let seen = false;
    try {
      seen = localStorage.getItem("mesa.tut1") === "1";
    } catch {}
    if (!seen) setTimeout(() => tutPlayer(0), 900);
  }
  if (!isGM && cam.z < (innerWidth < 700 ? 0.6 : 0.35)) {
    const mt = tokens.find(t => !isProp(t) && owns(t));
    if (mt) centerOn(mt.x, mt.y, innerWidth < 700 ? 0.9 : 0.8);
  } // tela pequena: começa no seu personagem
  let reloadT = null;
  sb.channel("mapa-db")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "map_state", filter: "id=eq." + ROW },
      () => {
        clearTimeout(reloadT);
        reloadT = setTimeout(load, 80);
      },
    )
    .subscribe();
  if (EDIT_ID) {
    // editando em outra aba: não entra na sala dos jogadores
    if (!isGM) {
      $("#gate").innerHTML = "Só o mestre pode editar mapas salvos.";
      $("#gate").hidden = false;
      return;
    }
    document.title = "✏️ " + (scene.lib?.n || "Mapa") + " · editando";
    $("#status").textContent = "modo edição · os jogadores não veem nada desta aba · tudo é salvo sozinho";
    drawTop();
    drawDiceBar();
    drawDiceLog();
    requestAnimationFrame(frame);
    return;
  }
  chan = sb.channel("mapa", { config: { broadcast: { self: false }, presence: { key: myKey } } });
  chan.on("broadcast", { event: "tok" }, ({ payload: p }) => {
    if (!p?.id) return;
    if (p.live) tokLive[p.id] = p.a != null ? { x: p.x, y: p.y, a: p.a } : { x: p.x, y: p.y };
    else {
      if (!isGM && p.q != null && lastReq[p.id] && p.q < lastReq[p.id]) return; // resposta a um pedido antigo: ignora
      delete tokLive[p.id];
      if (!isGM) delete pend[p.id];
      const t = tokens.find(x => x.id === p.id);
      if (t && !(walking === t.id)) {
        t.x = p.x;
        t.y = p.y;
        if (p.a != null) t.a = p.a;
      }
    }
    dirty = true;
  });
  chan.on("broadcast", { event: "endturn" }, ({ payload: p }) => {
    // jogador terminou o turno
    if (!isGM || !scene.init?.on) return;
    const I = scene.init,
      e = I.list[I.cur];
    if (!e || e.id !== p?.id) return;
    const o = String(iniOwner(e) || "").toLowerCase();
    if (o !== "*" && o !== String(p.who || "").toLowerCase()) return;
    iniGo(1);
  });
  chan.on("broadcast", { event: "inires" }, ({ payload: p }) => {
    // jogador rolou a iniciativa
    if (!isGM || !p?.id) return;
    const I = INI(),
      e = I.list.find(x => x.id === p.id);
    if (!e) return;
    const o = String(iniOwner(e) || "").toLowerCase();
    if (o !== "*" && o !== String(p.who || "").toLowerCase()) return;
    e.v = +p.v || 0;
    if (!I.on) iniSort();
    iniSave();
  });
  chan.on("broadcast", { event: "inistage" }, ({ payload: p }) => {
    if (isGM || !Array.isArray(p?.items)) return;
    iniStage(
      p.items
        .slice(0, 40)
        .map(x => ({
          n: String(x.n || "?").slice(0, 24),
          col: /^#[0-9a-f]{6}$/i.test(x.col || "") ? x.col : INI_GRAY,
          hid: false,
          f: String(x.f || "").slice(0, 40),
          mod: +x.mod || 0,
          total: +x.total || 0,
          dice: (x.dice || []).slice(0, 6).map(d => ({ d: +d.d, v: +d.v, x: d.x ? 1 : 0 })),
        })),
    );
  });
  chan.on("broadcast", { event: "iniask" }, ({ payload: p }) => {
    if (!isGM && Array.isArray(p?.list)) iniAskPrompt(p.list);
  });
  chan.on("broadcast", { event: "hand" }, async () => {
    // o mestre mudou as anotações
    if (isGM) return;
    const before = new Set(handVisible().map(h => h.id + (h.at || "")));
    await handLoad();
    const fresh = handVisible().filter(h => !before.has(h.id + (h.at || "")));
    if (fresh.length) {
      toast(
        `📜 O mestre liberou: ${fresh
          .map(h => h.t || "item")
          .slice(0, 3)
          .join(", ")}`,
      );
      for (const h of fresh) {
        const b = $(h.cat === "mapa" ? "#pMaps" : "#pNotes");
        if (b) b.querySelector(".tdot").hidden = false;
      }
    }
    if (panelKind === "hand") openHandPanel();
  });
  chan.on("broadcast", { event: "pop" }, ({ payload: p }) => {
    // o mestre jogou algo na tela
    if (isGM || !p?.item) return;
    if (p.to !== "*" && String(p.to || "").toLowerCase() !== String(myNick || "").toLowerCase()) return;
    showHandout(p.item, true);
  });
  chan.on("broadcast", { event: "chat" }, ({ payload: p }) => {
    const m = p?.m;
    if (!m?.id || typeof m.tx !== "string") return;
    chatPush(
      {
        id: String(m.id).slice(0, 20),
        at: Date.now(),
        w: String(m.w || "?").slice(0, 30),
        c: /^#[0-9a-f]{6}$/i.test(m.c || "") ? m.c : "#9fb7d8",
        to: String(m.to || "").slice(0, 30),
        tx: m.tx.slice(0, 500),
      },
      true,
    );
  });
  chan.on("broadcast", { event: "sheet" }, ({ payload: p }) => {
    // mestre mudou uma ficha
    if (isGM || !p) return;
    if (p.del) {
      sheets = (sheets || []).filter(x => x.id !== p.del);
      if (shOpen === p.del) closeSheet();
      if (panelKind === "sheets") openSheetsPanel();
      return;
    }
    if (p.sh?.id) shOnRemote(p.sh);
  });
  chan.on("broadcast", { event: "sheetreq" }, ({ payload: p }) => {
    // jogador mudou a própria ficha: o mestre confere e salva
    if (!isGM || !p || !sheets) return;
    const who = String(p.who || "").toLowerCase();
    if (!who) return;
    const mineOf = sh => !!sh?.o && (sh.o === "*" || sh.o.toLowerCase() === who);
    if (p.del) {
      const sh = shById(String(p.del));
      if (!mineOf(sh)) return;
      sheets = sheets.filter(x => x !== sh);
      for (const x of tokens) if (x.sh === sh.id) delete x.sh;
      save("tokens");
      shSaveGM();
      send("sheet", { del: sh.id });
      if (shOpen === sh.id) closeSheet();
      if (panelKind === "sheets") openSheetsPanel();
      return;
    }
    if (!p.sh?.id) return;
    let raw;
    try {
      raw = JSON.stringify(p.sh);
    } catch {
      return;
    }
    if (raw.length > 90000) return;
    const prev = shById(String(p.sh.id));
    if (prev ? !mineOf(prev) : String(p.sh.o || "").toLowerCase() !== who) {
      if (prev) send("sheet", { sh: prev });
      return;
    }
    const sh = shClean(p.sh, prev || { o: String(p.who).slice(0, 30) });
    if (prev) sheets[sheets.indexOf(prev)] = sh;
    else sheets.push(sh);
    shSaveGM();
    send("sheet", { sh });
    shSyncTokens(sh);
    if (shOpen === sh.id) {
      const a = document.activeElement;
      if (!(a && $("#sheetWin")?.contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName))) drawSheet();
    }
    if (panelKind === "sheets") openSheetsPanel();
  });
  chan.on("broadcast", { event: "doorres" }, ({ payload: p }) => {
    // resposta do mestre sobre uma porta
    if (isGM || !p?.k) return;
    delete pendDoor[p.k];
    if (p.lk) toast("🔒 A porta está trancada.", 1800);
    const w = walls().find(x => x.d && x.p?.join(",") === p.k);
    if (w && (w.o ? 1 : 0) !== p.o) {
      w.o = p.o;
      wallsVer++;
      losCache.clear();
      dirty = true;
    }
  });
  chan.on("broadcast", { event: "door" }, ({ payload: p }) => {
    // jogador abriu/fechou uma porta: o mestre confere
    if (!isGM || !p?.k) return;
    const w = walls().find(x => x.d && !x.s && x.p?.join(",") === p.k);
    if (!w) return;
    const who = String(p.who || "").toLowerCase();
    const near = t => {
      const [mx, my] = doorMid(w),
        L = tokLive[t.id] || t;
      return Math.hypot(L.x - mx, L.y - my) <= G().size * 2.6 + tokR(t);
    }; // o mestre é mais tolerante (atraso da rede)
    if (w.lk || !tokens.some(t => !isProp(t) && t.o && (t.o === "*" || t.o.toLowerCase() === who) && near(t)))
      return send("doorres", { k: p.k, o: w.o ? 1 : 0, lk: w.lk ? 1 : 0 });
    w.o = w.o ? 0 : 1;
    wallsChanged();
    send("doorres", { k: p.k, o: w.o });
    toast(`${p.who || "Jogador"} ${w.o ? "abriu" : "fechou"} uma porta.`, 1800);
  });
  chan.on("broadcast", { event: "tokreq" }, ({ payload: p }) => {
    // jogador moveu/girou o próprio token: o mestre confere e salva
    if (!isGM || !p?.id) return;
    const t = tokens.find(x => x.id === p.id);
    if (!t || !t.o) return;
    if (t.o !== "*" && String(p.who || "").toLowerCase() !== t.o.toLowerCase()) return;
    if (p.x != null) {
      const [x, y] = t.sn === false ? [Math.round(p.x), Math.round(p.y)] : snapPoint(p.x, p.y, t.s || 1);
      if (!validPath(t, p.path)) {
        send("tok", { id: t.id, x: t.x, y: t.y, a: t.a, q: p.q });
        return;
      } // caminho inválido (parede ou longe demais): devolve
      pushTrail(t, p.path);
      moveSpent(t, p.path.length - 1);
      t.x = x;
      t.y = y;
    }
    if (p.a != null) t.a = ((+p.a % 360) + 360) % 360;
    if (p.bi != null && t.b?.[p.bi] && isFinite(+p.bv)) t.b[p.bi].v = Math.round(+p.bv);
    if (Array.isArray(p.cd)) t.cd = condClean(p.cd);
    if (p.sh) {
      const sh = shById(String(p.sh));
      if (sh && sh.o && (sh.o === "*" || sh.o.toLowerCase() === String(p.who || "").toLowerCase())) {
        for (const x of tokens) if (x.sh === sh.id && x !== t) delete x.sh;
        t.sh = sh.id;
        shSyncTokens(sh);
      }
    }
    if (p.dash && inCombat(t) && !t.dash) {
      t.dash = 1;
      toast(`🏃 ${t.n || "Token"} usou Disparada.`, 1800);
    }
    if (Array.isArray(p.bars))
      t.b = p.bars
        .slice(0, 8)
        .map(b => ({
          n: String(b?.n || "").slice(0, 16),
          v: isFinite(+b?.v) ? Math.round(+b.v) : "",
          m: isFinite(+b?.m) && +b.m > 0 ? Math.round(+b.m) : "",
          c: /^#[0-9a-f]{6}$/i.test(b?.c || "") ? b.c : "#c0473a",
        }));
    delete tokLive[t.id];
    send("tok", { id: t.id, x: t.x, y: t.y, a: t.a, q: p.q });
    save("tokens", true, 600);
    dirty = true;
  });
  chan.on("presence", { event: "sync" }, () => {
    const st = chan.presenceState();
    peersOnMap = [
      ...new Set(
        Object.values(st)
          .map(a => a[a.length - 1])
          .filter(x => x?.role === "player" && x.name)
          .map(x => x.name),
      ),
    ];
  });
  chan.on("broadcast", { event: "ruler" }, ({ payload: p }) => {
    if (!p?.k) return;
    if (p.r) rulers[p.k] = p.r;
    else delete rulers[p.k];
    dirty = true;
  });
  chan.on("broadcast", { event: "state" }, ({ payload: p }) => {
    if (!isGM && p?.col) apply({ [p.col]: p.val });
  });
  if (!isGM) setInterval(load, 20000); // rede de segurança
  chan.on("broadcast", { event: "roll" }, ({ payload: r }) => {
    if (+r?.v > MAP_VER) newVersion();
    if (
      r?.id &&
      Array.isArray(r.dice) &&
      !diceLog.some(x => x.id === String(r.id)) &&
      !stageQ.some(x => x.id === String(r.id))
    )
      addRoll({
        snd: cleanSnd(r.snd),
        id: String(r.id),
        who: String(r.who || "?").slice(0, 30),
        label: String(r.label || "").slice(0, 30),
        f: String(r.f || "").slice(0, 60),
        mod: +r.mod || 0,
        total: +r.total || 0,
        dice: r.dice
          .slice(0, 60)
          .filter(x => x.d >= 2 && x.d <= 1000)
          .map(x => ({ d: +x.d, v: +x.v, x: x.x ? 1 : 0 })),
        secret: false,
        col: /^#[0-9a-f]{6}$/i.test(r.col || "") ? r.col : null,
      });
  });
  chan.on("broadcast", { event: "ping" }, ({ payload: p }) => {
    if (!p || !isFinite(+p.x)) return;
    addPing(p);
    if (p.center && !isGM) centerOn(+p.x, +p.y, Math.max(cam.z, 0.8));
  });
  chan.on("broadcast", { event: "tpl" }, ({ payload: p }) => {
    if (p?.op === "del") {
      delete ptpls[p.id];
      if (selTpl === p.id) {
        selTpl = null;
        drawTplBar();
      }
    } else if (p?.op === "set" && p.t?.id && ["circle", "cone", "line", "square"].includes(p.t.sh)) {
      const t = p.t;
      ptpls[t.id] = {
        id: String(t.id),
        t: "tpl",
        n: String(t.n || "").slice(0, 30),
        ic: String(t.ic || "✨").slice(0, 4),
        sh: t.sh,
        r: Math.min(60, Math.max(1, +t.r || 3)),
        wd: +t.wd || undefined,
        c: /^#[0-9a-f]{6}$/i.test(t.c) ? t.c : "#ffe28a",
        x: +t.x || 0,
        y: +t.y || 0,
        a: +t.a || 0,
        own: String(t.own || ""),
      };
    }
    dirty = true;
  });
  chan.on("broadcast", { event: "view" }, ({ payload: p }) => {
    if (!isGM && p) {
      centerOn(p.x, p.y, p.z);
      toast("O mestre levou você para esta parte do mapa.");
    }
  });
  chan.subscribe(st => {
    if (st === "SUBSCRIBED") chan.track({ name: isGM ? "Mestre" : myNick, role: isGM ? "gm" : "player" });
    $("#status").textContent =
      st === "SUBSCRIBED"
        ? isGM
          ? "ao vivo · jogadores veem o que você fizer"
          : "ao vivo"
        : "reconectando…";
  });
  drawDiceBar();
  drawDiceLog();
  vDraw();
  shLoad();
  chatLoad();
  if (!EDIT_ID) {
    sndLoad().then(() => MA.sync());
    sb.channel("mapa-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_state" }, p => {
        const d = p.new;
        if (d?.id === 1) {
          liveMap = { music: d.music || null, amb: d.amb || {} };
          MA.sync();
          if (panelKind === "snd") openSndPanel();
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "sounds" }, () => {
        clearTimeout(sndReloadT);
        sndReloadT = setTimeout(() => sndLoad().then(() => MA.sync()), 400);
      })
      .subscribe();
    sndChan = sb.channel("mesa", { config: { broadcast: { self: false } } });
    sndChan
      .on("broadcast", { event: "sfx" }, ({ payload: p }) => {
        if (p?.sid) MA.sfx(String(p.sid), Math.max(0, Math.min(1, +(p.vol ?? 1))));
      })
      .on("broadcast", { event: "sfxstop" }, ({ payload: p }) => {
        if (p?.sid) MA.stopSfx(String(p.sid));
      })
      .on("broadcast", { event: "hush" }, () => MA.stopSfx())
      .subscribe();
  }
  requestAnimationFrame(frame);
}
boot();

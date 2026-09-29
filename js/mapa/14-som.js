"use strict";
// ---------- som ligado ao mapa (o mestre controla daqui; os jogadores ouvem pela aba da Mesa Sonora) ----------
// scene.snd = {m: música, a: [ambientes], auto: tocar ao abrir o mapa, c: música de combate, z: [{id, x, y, r (casas), s (ambiente)}]}
let sndReloadT = null,
  sndList = null,
  liveMap = { music: null, amb: {} },
  sndChan = null,
  zoneOn = {},
  zoneT = 0,
  zonePlace = null,
  cbtPrev;
const SND = () => scene.snd || (scene.snd = { m: "", a: [], auto: true, c: "", z: [] });
const sndById = id => (sndList || []).find(s => s.id === id);
const sndName = s => (s ? (s.emoji ? s.emoji + " " : "") + s.name : "?");
async function sndLoad() {
  const [a, b] = await Promise.all([
    sb.from("sounds").select("*"),
    sb.from("live_state").select("*").eq("id", 1).maybeSingle(),
  ]);
  if (!a.error) sndList = (a.data || []).sort((x, y) => String(x.name).localeCompare(String(y.name), "pt"));
  if (!b.error && b.data) liveMap = { music: b.data.music || null, amb: b.data.amb || {} };
}
async function liveSet(next) {
  liveMap = { music: next.music || null, amb: next.amb || {} };
  const { error } = await sb
    .from("live_state")
    .upsert({ id: 1, music: liveMap.music, amb: liveMap.amb, updated_at: new Date().toISOString() });
  if (error) toast("Não mudei o som: " + error.message);
  MA.sync();
  if (panelKind === "snd") openSndPanel();
}
function sndMusic(sid) {
  const s = sndById(sid);
  return liveSet({
    ...liveMap,
    music: s ? { sid, at: Date.now(), vol: liveMap.music?.vol ?? s.volume ?? 0.8 } : null,
  });
}
function sndAmb(sid, on) {
  const amb = { ...liveMap.amb };
  if (on) amb[sid] = { at: Date.now(), vol: sndById(sid)?.volume ?? 0.7 };
  else delete amb[sid];
  return liveSet({ ...liveMap, amb });
}
function sndSfx(sid) {
  const s = sndById(sid);
  if (!s) return;
  MA.init();
  MA.sfx(sid, s.volume ?? 1);
  sndChan?.send({ type: "broadcast", event: "sfx", payload: { sid, vol: s.volume ?? 1 } });
}
async function sndApplyMap() {
  // abriu um mapa salvo: toca a trilha dele
  const S = scene.snd;
  if (!S?.auto || (!S.m && !S.a?.length)) return;
  if (!sndList) await sndLoad();
  const amb = {};
  for (const sid of S.a || [])
    if (sndById(sid)) amb[sid] = { at: Date.now(), vol: sndById(sid).volume ?? 0.7 };
  const m =
    S.m && sndById(S.m)
      ? liveMap.music?.sid === S.m
        ? liveMap.music
        : { sid: S.m, at: Date.now(), vol: sndById(S.m).volume ?? 0.8 }
      : null;
  zoneOn = {};
  await liveSet({ music: m, amb });
  toast(
    `🎵 Trilha do mapa: ${[m && sndName(sndById(m.sid)), ...Object.keys(amb).map(k => sndName(sndById(k)))].filter(Boolean).join(", ")}`,
    2600,
  );
}
async function sndCombat(start) {
  // começou/acabou o combate: troca a música
  const c =
    scene.snd?.c ||
    (() => {
      try {
        return localStorage.getItem("mesa.cbtsnd") || "";
      } catch {
        return "";
      }
    })();
  if (!c) return;
  if (!sndList) await sndLoad();
  const s = sndById(c);
  if (!s) return;
  if (start) {
    if (liveMap.music?.sid === c) return;
    try {
      localStorage.setItem("mesa.cbtprev", JSON.stringify(liveMap.music || null));
    } catch {}
    await liveSet({
      ...liveMap,
      music: { sid: c, at: Date.now(), vol: liveMap.music?.vol ?? s.volume ?? 0.8 },
    });
    toast(`⚔️🎵 ${sndName(s)}`, 1800);
  } else {
    if (liveMap.music?.sid !== c) return;
    let prev = null;
    try {
      prev = JSON.parse(localStorage.getItem("mesa.cbtprev") || "null");
    } catch {}
    await liveSet({ ...liveMap, music: prev ? { ...prev, at: Date.now() } : null });
  }
}
function zoneTick() {
  // zonas de som: o ambiente liga quando um personagem chega perto e fica mais alto no centro
  if (!isGM || EDIT_ID) return;
  const Z = scene.snd?.z;
  if (!Z?.length || !sndList) return;
  const now = performance.now();
  if (now - zoneT < 900) return;
  zoneT = now;
  const all = tokens
      .map(t => (tokLive[t.id] ? { ...t, ...tokLive[t.id] } : t))
      .filter(t => !isProp(t) && !t.h),
    own = all.filter(t => t.o),
    pcs = own.length ? own : all,
    want = {}; // sem tokens de jogador no mapa: qualquer token liga (para o mestre testar)
  for (const z of Z) {
    if (!z.s || !sndById(z.s)) continue;
    const R = (+z.r || 4) * G().size;
    let d = Infinity;
    for (const t of pcs) d = Math.min(d, Math.hypot(t.x - z.x, t.y - z.y));
    if (d <= R) {
      const base = sndById(z.s).volume ?? 0.7,
        v = Math.round(base * (1 - (0.6 * d) / R) * 20) / 20;
      want[z.s] = Math.max(want[z.s] || 0, v);
    }
  }
  const amb = { ...liveMap.amb };
  let ch = false;
  for (const sid in zoneOn)
    if (!(sid in want)) {
      delete amb[sid];
      delete zoneOn[sid];
      ch = true;
    }
  for (const sid in want) {
    const cur = amb[sid];
    if (!cur) {
      amb[sid] = { at: Date.now(), vol: want[sid] };
      ch = true;
    } else if (zoneOn[sid] && Math.abs((cur.vol ?? 0) - want[sid]) >= 0.05) {
      amb[sid] = { ...cur, vol: want[sid] };
      ch = true;
    }
    if (!cur || zoneOn[sid]) zoneOn[sid] = 1;
  }
  if (ch) liveSet({ ...liveMap, amb });
}
function paintZones() {
  // só o mestre vê as zonas
  const Z = scene.snd?.z;
  if (!isGM || !Z?.length) return;
  ctx.save();
  for (const z of Z) {
    const R = (+z.r || 4) * G().size,
      on = z.s && zoneOn[z.s];
    ctx.beginPath();
    ctx.arc(z.x, z.y, R, 0, Math.PI * 2);
    ctx.fillStyle = on ? "rgba(95,190,160,.08)" : "rgba(95,160,190,.05)";
    ctx.fill();
    ctx.setLineDash([10 / cam.z, 8 / cam.z]);
    ctx.lineWidth = 2 / cam.z;
    ctx.strokeStyle = on ? "rgba(120,220,180,.8)" : "rgba(120,180,220,.55)";
    ctx.stroke();
    ctx.setLineDash([]);
    label(z.x, z.y, `🔊 ${z.s ? sndName(sndById(z.s)) : "escolha o som"}`);
  }
  ctx.restore();
}
async function openSndPanel() {
  panelKind = "snd";
  if (!sndList) {
    $("#panel").innerHTML =
      `<div class="panel"><h3>Som <button class="btn small" id="pClose">Fechar</button></h3><p class="hint">Carregando os sons…</p></div>`;
    $("#pClose").onclick = closePanel;
    await sndLoad();
    if (panelKind !== "snd") return;
  }
  const S = SND(),
    mus = sndList.filter(s => s.kind === "music"),
    amb = sndList.filter(s => s.kind === "ambient"),
    sfx = sndList.filter(s => s.kind === "sfx");
  const opt = (L, v, none = "— nenhuma —") =>
    `<option value="">${none}</option>` +
    L.map(
      s => `<option value="${esc(s.id)}" ${s.id === v ? "selected" : ""}>${esc(sndName(s))}</option>`,
    ).join("");
  let cbtG = "";
  try {
    cbtG = localStorage.getItem("mesa.cbtsnd") || "";
  } catch {}
  $("#panel").innerHTML =
    `<div class="panel snd-panel" role="dialog" aria-label="Som"><h3>🎵 Som da mesa<button class="btn small" id="pClose">Fechar</button></h3>
    <p class="hint" style="margin-top:0">Toca para todos que estão no mapa (botão 🔊 Som no topo liga/desliga e muda o volume de cada um) e também na página da Mesa Sonora.</p>
    <div class="lbl">Tocando agora</div>
    <div class="snd-now">${liveMap.music && sndById(liveMap.music.sid) ? `<span class="snd-chip on">🎵 ${esc(sndName(sndById(liveMap.music.sid)))}<button data-stopm title="Parar">■</button></span>` : `<span class="hint">sem música</span>`}
      ${Object.keys(liveMap.amb || {})
        .filter(sndById)
        .map(
          k =>
            `<span class="snd-chip on">${zoneOn[k] ? "📍" : "🌧"} ${esc(sndName(sndById(k)))}<button data-stopa="${esc(k)}" title="Parar">■</button></span>`,
        )
        .join("")}
      ${liveMap.music || Object.keys(liveMap.amb || {}).length ? `<button class="btn small danger" id="sStopAll">Parar tudo</button>` : ""}</div>
    <div class="lbl">Tocar</div>
    <div class="snd-grid">${mus.map(s => `<button class="snd-b ${liveMap.music?.sid === s.id ? "on" : ""}" data-pm="${esc(s.id)}" title="Música (troca a que está tocando)">🎵 ${esc(s.emoji || "")} ${esc(s.name)}</button>`).join("")}
      ${amb.map(s => `<button class="snd-b amb ${liveMap.amb?.[s.id] ? "on" : ""}" data-pa="${esc(s.id)}" title="Ambiente (liga/desliga, soma com os outros)">🌧 ${esc(s.emoji || "")} ${esc(s.name)}</button>`).join("")}
      ${sfx.map(s => `<button class="snd-b sfx" data-px="${esc(s.id)}" title="Efeito (toca uma vez para todos)">💥 ${esc(s.emoji || "")} ${esc(s.name)}</button>`).join("") || ""}
      ${!sndList.length ? `<p class="hint">Nenhum som ainda. Suba músicas e ambientes na página da Mesa Sonora.</p>` : ""}</div>
    <div class="lbl">Trilha deste mapa ${scene.libName ? `<small>(${esc(scene.libName)})</small>` : ""}</div>
    <label class="snd-f">Música <select id="sM">${opt(mus, S.m)}</select></label>
    <div class="snd-f">Ambientes <div class="snd-amb">${amb.map(s => `<label class="chk"><input type="checkbox" data-sa="${esc(s.id)}" ${(S.a || []).includes(s.id) ? "checked" : ""}> ${esc(sndName(s))}</label>`).join("") || `<span class="hint">nenhum</span>`}</div></div>
    <div class="acts"><label class="chk"><input type="checkbox" id="sAuto" ${S.auto !== false ? "checked" : ""}> Tocar sozinho ao abrir este mapa</label><span class="spacer"></span><button class="btn small primary" id="sPlayMap">▶ Tocar a trilha</button></div>
    <div class="lbl">Combate</div>
    <label class="snd-f">Música de combate <select id="sC">${opt(mus, S.c, "— a padrão —")}</select></label>
    <label class="snd-f">Padrão (todos os mapas) <select id="sCG">${opt(mus, cbtG)}</select></label>
    <p class="hint">Entra sozinha no “Começar combate” e, no “Encerrar combate”, volta a música que estava antes.</p>
    <div class="lbl">Zonas de som <small>o ambiente liga quando um personagem de jogador chega perto (mais alto no centro)</small></div>
    <div class="snd-zones">${(S.z || []).map((z, i) => `<div class="snd-z"><select data-zs="${i}">${opt(amb, z.s, "— escolha —")}</select><label class="mini">raio <input data-zr="${i}" value="${esc(z.r)}" inputmode="numeric" style="width:40px"> casas</label><button class="btn small ic" data-zgo="${i}" title="Mostrar no mapa">👁</button><button class="btn small ic" data-zmv="${i}" title="Mudar de lugar: clique no mapa">📍</button><button class="btn small ic danger" data-zdel="${i}" title="Apagar">✕</button></div>`).join("") || `<p class="hint" style="margin:0">Nenhuma. Ex.: cachoeira, fogueira, taverna, ninho de morcegos.</p>`}</div>
    <div class="acts"><button class="btn small" id="sZoneAdd">＋ Zona de som (clique no mapa)</button></div></div>`;
  const P = $("#panel");
  $("#pClose").onclick = closePanel;
  const sv = () => {
    save("scene", "merge");
    dirty = true;
  };
  $("#sM").onchange = e => {
    S.m = e.target.value;
    sv();
  };
  $("#sC").onchange = e => {
    S.c = e.target.value;
    sv();
  };
  $("#sCG").onchange = e => {
    try {
      localStorage.setItem("mesa.cbtsnd", e.target.value);
    } catch {}
  };
  $("#sAuto").onchange = e => {
    S.auto = e.target.checked;
    sv();
  };
  $("#sPlayMap").onclick = () => {
    if (!S.m && !S.a?.length) return toast("Escolha a música ou os ambientes deste mapa primeiro.");
    const a = S.auto;
    S.auto = true;
    sndApplyMap();
    S.auto = a;
  };
  const sa = $("#sStopAll");
  if (sa)
    sa.onclick = () => {
      zoneOn = {};
      MA.stopSfx();
      sndChan?.send({ type: "broadcast", event: "hush", payload: {} });
      liveSet({ music: null, amb: {} });
    };
  $("#sZoneAdd").onclick = () => {
    zonePlace = { add: true };
    toast("Clique no mapa onde fica o som (Esc cancela).", 2600);
  };
  P.onchange = e => {
    const d = e.target.dataset;
    if (d.sa) {
      S.a = (S.a || []).filter(x => x !== d.sa);
      if (e.target.checked) S.a.push(d.sa);
      sv();
    }
    if (d.zs != null) {
      S.z[+d.zs].s = e.target.value;
      sv();
    }
    if (d.zr != null) {
      S.z[+d.zr].r = Math.max(1, Math.min(40, +e.target.value || 4));
      sv();
    }
  };
  P.onkeydown = e => e.stopPropagation();
  P.onclick = e => {
    const b = e.target.closest("button");
    if (!b) return;
    const d = b.dataset;
    if (d.pm) sndMusic(liveMap.music?.sid === d.pm ? "" : d.pm);
    else if (d.pa) sndAmb(d.pa, !liveMap.amb?.[d.pa]);
    else if (d.px) {
      sndSfx(d.px);
      b.classList.add("on");
      setTimeout(() => b.classList.remove("on"), 400);
    } else if (d.stopm != null) sndMusic("");
    else if (d.stopa) {
      delete zoneOn[d.stopa];
      sndAmb(d.stopa, false);
    } else if (d.zgo != null) {
      const z = S.z[+d.zgo];
      centerOn(z.x, z.y, Math.max(cam.z, 0.5));
    } else if (d.zmv != null) {
      zonePlace = { i: +d.zmv };
      toast("Clique no mapa no novo lugar do som.", 2400);
    } else if (d.zdel != null) {
      const z = S.z.splice(+d.zdel, 1)[0];
      if (z?.s && zoneOn[z.s]) {
        delete zoneOn[z.s];
        sndAmb(z.s, false);
      }
      sv();
      openSndPanel();
    }
  };
}
function zonePlaceAt(wx, wy) {
  // clique no mapa colocando/movendo uma zona
  const S = SND();
  S.z = S.z || [];
  if (zonePlace.add) {
    const amb = (sndList || []).filter(s => s.kind === "ambient");
    S.z.push({ id: uid(), x: Math.round(wx), y: Math.round(wy), r: 4, s: amb[0]?.id || "" });
  } else if (S.z[zonePlace.i]) {
    S.z[zonePlace.i].x = Math.round(wx);
    S.z[zonePlace.i].y = Math.round(wy);
  }
  zonePlace = null;
  save("scene");
  dirty = true;
  if (panelKind === "snd") openSndPanel();
}

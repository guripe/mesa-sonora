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
const SND = () => scene.snd || (scene.snd = { bg: null, z: [] });
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
  // abriu um mapa: toca o som de fundo dele (as regiões ligam sozinhas)
  const S = scene.snd;
  if (S && !S.bg && S.m) S.bg = { s: S.m, v: 0.8 }; // mapas antigos
  if (!S?.bg?.s) return;
  if (!sndList) await sndLoad();
  zoneOn = {};
  await sndApplyBg(true);
}
async function sndApplyBg(announce) {
  // o som de fundo do mapa toca para todos (no lugar da música)
  if (EDIT_ID) return;
  if (!sndList) await sndLoad();
  const bg = scene.snd?.bg, s = bg?.s && sndById(bg.s);
  const music = s ? (liveMap.music?.sid === bg.s ? { ...liveMap.music, vol: +bg.v || 0.8 } : { sid: bg.s, at: Date.now(), vol: +bg.v || 0.8 }) : null;
  await liveSet({ music, amb: announce ? {} : liveMap.amb });
  if (announce && s) toast(`🎵 Som de fundo: ${sndName(s)}`, 2200);
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
  const all = tokens.map(t => (tokLive[t.id] ? { ...t, ...tokLive[t.id] } : t)).filter(t => !isProp(t) && !t.h),
    own = all.filter(t => t.o),
    pcs = own.length ? own : all.filter(t => !t.st), // sem personagens de jogador: tokens comuns (não criaturas do bestiário) ligam, para o mestre testar
    want = {};
  for (const z of Z) {
    if (!z.s || !sndById(z.s)) continue;
    const R = (+z.r || 4) * G().size;
    let d = Infinity;
    for (const t of pcs) d = Math.min(d, Math.hypot(t.x - z.x, t.y - z.y));
    if (d <= R) {
      const base = z.v ?? sndById(z.s).volume ?? 0.7,
        v = Math.round(base * (1 - (0.6 * d) / R) * 20) / 20;
      want[z.s] = Math.max(want[z.s] || 0, v);
    }
  }
  // os sons usados pelas regiões são sempre controlados por elas (mesmo que já estivessem tocando antes)
  const amb = { ...liveMap.amb }, mine = new Set(Z.map(z => z.s).filter(Boolean));
  let ch = false;
  for (const sid of new Set([...mine, ...Object.keys(zoneOn)])) {
    if (sid in want) {
      const cur = amb[sid];
      if (!cur) { amb[sid] = { at: Date.now(), vol: want[sid] }; ch = true; }
      else if (Math.abs((cur.vol ?? 0) - want[sid]) >= 0.05) { amb[sid] = { ...cur, vol: want[sid] }; ch = true; }
      zoneOn[sid] = 1;
    } else {
      if (amb[sid]) { delete amb[sid]; ch = true; }
      delete zoneOn[sid];
    }
  }
  if (ch) liveSet({ ...liveMap, amb });
}
function paintZones() {
  // só o mestre vê as regiões; com o painel Som aberto aparecem as alças (mover e tamanho)
  const Z = scene.snd?.z;
  if (!isGM || !Z?.length) return;
  const edit = panelKind === "snd";
  ctx.save();
  for (const z of Z) {
    const R = (+z.r || 4) * G().size, on = z.s && zoneOn[z.s], sel = edit && zoneSel === z.id;
    ctx.beginPath();
    ctx.arc(z.x, z.y, R, 0, Math.PI * 2);
    ctx.fillStyle = sel ? "rgba(255,215,106,.10)" : on ? "rgba(95,190,160,.08)" : "rgba(95,160,190,.05)";
    ctx.fill();
    ctx.setLineDash([10 / cam.z, 8 / cam.z]);
    ctx.lineWidth = (sel ? 3 : 2) / cam.z;
    ctx.strokeStyle = sel ? "#ffd76a" : on ? "rgba(120,220,180,.8)" : "rgba(120,180,220,.55)";
    ctx.stroke();
    ctx.setLineDash([]);
    if (edit) {
      for (const [hx, hy, big] of [[z.x, z.y, 1], [z.x + R, z.y, 0]]) {
        ctx.beginPath(); ctx.arc(hx, hy, (big ? 8 : 7) / cam.z, 0, Math.PI * 2);
        ctx.fillStyle = big ? "#ffd76a" : "#7fb2e8"; ctx.fill(); ctx.lineWidth = 1.5 / cam.z; ctx.strokeStyle = "rgba(0,0,0,.7)"; ctx.stroke();
      }
    }
  }
  ctx.restore();
}
// ---- painel Som: só as regiões de som (arrastar para criar, mover e mudar o tamanho no mapa) ----
let zoneSel = null;
function zoneHandleAt(wx, wy) { // alça de uma região: centro (mover) ou borda (tamanho)
  const Z = scene.snd?.z || [], tol = 12 / cam.z;
  for (let i = Z.length - 1; i >= 0; i--) { const z = Z[i], R = (+z.r || 4) * G().size;
    if (Math.hypot(wx - z.x, wy - z.y) <= tol) return { z, mode: "move" };
    if (Math.hypot(wx - (z.x + R), wy - z.y) <= tol || Math.abs(Math.hypot(wx - z.x, wy - z.y) - R) <= tol * 0.7) return { z, mode: "size" }; }
  return null;
}
function zoneAdd(sid, wx, wy) {
  const S = SND(); S.z = S.z || [];
  const s = sndById(sid), z = { id: uid(), x: Math.round(wx), y: Math.round(wy), r: 4, s: sid || "", v: s?.volume ?? 0.7 };
  S.z.push(z); zoneSel = z.id; save("scene"); dirty = true;
  if (panelKind === "snd") openSndPanel();
  toast(`🔊 Região criada. Arraste o ponto amarelo para mover e o azul para mudar o tamanho.`, 3000);
}
async function openSndPanel() {
  panelKind = "snd"; dirty = true;
  if (!sndList) { $("#panel").innerHTML = `<div class="panel"><h3>Sons por região <button class="btn small" id="pClose">Fechar</button></h3><p class="hint">Carregando os sons…</p></div>`; $("#pClose").onclick = closePanel; await sndLoad(); if (panelKind !== "snd") return; }
  const S = SND(), list = sndList.filter(s => s.kind !== "sfx"), Z = S.z || [];
  const opt = v => `<option value="">— escolha —</option>` + list.map(s => `<option value="${esc(s.id)}" ${s.id === v ? "selected" : ""}>${esc(sndName(s))}</option>`).join("");
  $("#panel").innerHTML = `<div class="panel snd-panel" role="dialog" aria-label="Sons por região"><h3>🔊 Sons por região<button class="btn small" id="pClose">Fechar</button></h3>
    <p class="hint" style="margin-top:0"><b>Arraste um som para o mapa</b> para criar uma região. O som liga quando um personagem entra nela e fica mais alto perto do centro. No mapa: ponto <b style="color:#ffd76a">amarelo</b> move, ponto <b style="color:#7fb2e8">azul</b> muda o tamanho.</p>
    <div class="snd-grid">${list.map(s => `<span class="snd-b" data-szs="${esc(s.id)}" draggable="true" title="Arraste para o mapa">${esc(sndName(s))}</span>`).join("") || `<p class="hint">Nenhum som ainda. Suba ambientes e músicas na página da Mesa Sonora.</p>`}</div>
    <div class="lbl">Regiões deste mapa</div>
    <div class="snd-zones">${Z.map((z, i) => `<div class="snd-z ${zoneSel === z.id ? "on" : ""}" data-zi="${i}"><select data-zs="${i}">${opt(z.s)}</select>
        <label class="snd-vol" title="Volume desta região">🔈<input type="range" min="0" max="1" step="0.05" data-zv="${i}" value="${z.v ?? 0.7}"><b>${Math.round((z.v ?? 0.7) * 100)}%</b></label>
        <button class="btn small ic" data-zgo="${i}" title="Mostrar no mapa">👁</button><button class="btn small ic danger" data-zdel="${i}" title="Apagar">✕</button></div>`).join("") || `<p class="hint" style="margin:0">Nenhuma ainda. Ex.: cachoeira, fogueira, taverna, ninho de morcegos.</p>`}</div>
    <p class="hint">O som de fundo do mapa inteiro fica em ⚙ Mapa e grid.</p></div>`;
  const P = $("#panel"); $("#pClose").onclick = () => { closePanel(); dirty = true; };
  const sv = () => { save("scene", "merge"); dirty = true; };
  P.onkeydown = e => e.stopPropagation();
  P.oninput = e => { const d = e.target.dataset; if (d.zv != null) { const z = Z[+d.zv]; z.v = +e.target.value; e.target.nextElementSibling.textContent = Math.round(z.v * 100) + "%"; zoneT = 0; sv(); } };
  P.onchange = e => { const d = e.target.dataset; if (d.zs != null) { const z = Z[+d.zs]; if (z.s && zoneOn[z.s]) { delete zoneOn[z.s]; sndAmb(z.s, false); } z.s = e.target.value; zoneT = 0; sv(); } };
  P.onclick = e => { const b = e.target.closest("button,[data-zi]"); if (!b) return; const d = b.dataset;
    if (d.zgo != null) { const z = Z[+d.zgo]; zoneSel = z.id; centerOn(z.x, z.y, Math.max(cam.z, 0.5)); return openSndPanel(); }
    if (d.zdel != null) { const z = Z.splice(+d.zdel, 1)[0]; if (z?.s && zoneOn[z.s] && !Z.some(o => o.s === z.s)) { delete zoneOn[z.s]; sndAmb(z.s, false); } sv(); return openSndPanel(); }
    if (d.zi != null && e.target.closest("select,input")) return;
    if (d.zi != null) { zoneSel = Z[+d.zi]?.id; dirty = true; P.querySelectorAll(".snd-z").forEach(r => r.classList.toggle("on", r === b)); } };
}
function zonePlaceAt(wx, wy) { zonePlace = null; zoneAdd((sndList || []).find(s => s.kind === "ambient")?.id || "", wx, wy); }

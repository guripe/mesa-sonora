"use strict";
// ---------- rede ----------
let tokT = 0;
function send(event, payload) {
  if (EDIT_ID) return;
  chan?.send({ type: "broadcast", event, payload });
}
function sendTok(t) {
  const now = performance.now();
  if (now - tokT < 45) return;
  tokT = now;
  send("tok", { id: t.id, x: Math.round(t.x), y: Math.round(t.y), a: t.a || 0, live: 1 });
}
let rulerT = 0,
  rulerPending = null;
function sendRuler() {
  const now = performance.now();
  clearTimeout(rulerPending);
  if (now - rulerT < 50) {
    rulerPending = setTimeout(sendRuler, 55);
    return;
  }
  rulerT = now;
  send("ruler", { k: myKey, r: rulers[myKey] || null });
}
const saveTimers = {};
const undoS = [],
  redoS = [],
  prevJSON = {},
  lastPush = {};
const getCol = col =>
  col === "scene"
    ? scene
    : col === "tokens"
      ? tokens
      : col === "fog"
        ? { ...fog, ex: undefined, exImg: undefined }
        : drawings;
function snapPrev(col) {
  try {
    prevJSON[col] = JSON.stringify(getCol(col));
  } catch {}
}
function pushUndo(col, merge) {
  const cur = JSON.stringify(getCol(col));
  if (prevJSON[col] == null) {
    prevJSON[col] = cur;
    return;
  }
  if (cur === prevJSON[col]) return;
  const now = Date.now();
  if (!(merge && undoS.length && undoS[undoS.length - 1].col === col && now - (lastPush[col] || 0) < 800)) {
    undoS.push({ col, json: prevJSON[col] });
    if (undoS.length > 80) undoS.shift();
    redoS.length = 0;
  }
  lastPush[col] = now;
  prevJSON[col] = cur;
}
function setCol(col, json) {
  const v = JSON.parse(json);
  if (col === "scene") scene = v;
  else if (col === "tokens") tokens = v;
  else if (col === "drawings") drawings = v;
  else if (col === "fog") fog = { ...v, ex: fog.ex, exImg: fog.exImg, exBox: fog.exBox };
  prevJSON[col] = json;
  wallsVer++;
  losCache.clear();
  dirty = true;
  drawEmpty();
  drawTop();
  save(col, false);
}
function undo(redo) {
  const from = redo ? redoS : undoS,
    to = redo ? undoS : redoS;
  const e = from.pop();
  if (!e) return toast(redo ? "Nada para refazer." : "Nada para desfazer.");
  to.push({ col: e.col, json: JSON.stringify(getCol(e.col)) });
  setCol(e.col, e.json);
  toast(redo ? "Refeito." : "Desfeito.", 1200);
  if (panelKind === "scene") openScenePanel(true);
  if (flyKind) openFlyout(flyKind);
}
function save(col, undoable = true, delay) {
  if (!isGM) return;
  if (undoable) pushUndo(col, undoable === "merge");
  if (col === "tokens" || col === "scene") updateExplored();
  clearTimeout(saveTimers[col]);
  lastSave[col] = Date.now();
  saveTimers[col] = setTimeout(
    async () => {
      const val = col === "scene" ? scene : col === "tokens" ? tokens : col === "fog" ? fog : drawings;
      lastSave[col] = Date.now();
      const { error } = await sb
        .from("map_state")
        .update({ [col]: val, updated_at: new Date().toISOString() })
        .eq("id", ROW);
      if (error) return toast("Não salvei o mapa: " + error.message);
      try {
        if (JSON.stringify(val).length < 180000) send("state", { col, val });
      } catch {} // entrega na hora, sem depender só do banco
    },
    delay || (col === "fog" ? 150 : 60),
  );
}
async function load() {
  const { data, error } = await sb.from("map_state").select("*").eq("id", ROW).maybeSingle();
  if (error) {
    $("#gate").innerHTML = `O mapa ainda não foi ativado no banco.<br><small>${esc(error.message)}</small>`;
    $("#gate").hidden = false;
    return false;
  }
  apply(data || {});
  return true;
}
function apply(d) {
  const fresh = col => !isGM || !lastSave[col] || Date.now() - lastSave[col] > 1500; // ignora o eco das próprias edições
  setTimeout(() => {
    for (const c of ["scene", "tokens", "fog", "drawings"]) if (d[c] && fresh(c)) snapPrev(c);
  }, 0);
  if (d.scene && fresh("scene"))
    scene = { ...scene, ...d.scene, grid: { ...scene.grid, ...(d.scene.grid || {}) } };
  if (d.tokens && fresh("tokens") && !(drag?.kind === "token")) tokens = d.tokens;
  if (d.scene) wallsVer++;
  if (d.fog && fresh("fog") && !drag?.kind?.startsWith("fog"))
    fog = {
      on: !!d.fog.on,
      cells: d.fog.cells || {},
      sig: d.fog.sig,
      exImg: d.fog.exImg || null,
      exBox: d.fog.exBox || null,
    };
  if (d.drawings && fresh("drawings") && drag?.kind !== "draw") drawings = d.drawings;
  if (!isGM) fixPending();
  dirty = true;
  drawTop();
  drawEmpty();
}

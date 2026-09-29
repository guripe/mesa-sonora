"use strict";
// ---------- mapas salvos (pastas) ----------
const LIB0 = 1000;
let libList = null,
  libFolders = [],
  libClosed = (() => {
    try {
      return JSON.parse(localStorage.getItem("mesa.libclosed")) || {};
    } catch {
      return {};
    }
  })(),
  libBusy = false;
const saveLibClosed = () => {
  try {
    localStorage.setItem("mesa.libclosed", JSON.stringify(libClosed));
  } catch {}
};
async function libLoad() {
  const { data, error } = await sb
    .from("map_state")
    .select("id, lib:scene->lib, bg:scene->>bg, gs:scene->gen->>style, updated_at")
    .gte("id", 999)
    .order("id");
  if (error) {
    toast("Não carreguei os mapas: " + error.message);
    libList = [];
    return;
  }
  libFolders = (data.find(r => r.id === 999)?.lib?.folders || []).filter(Boolean);
  libList = data
    .filter(r => r.id >= LIB0)
    .map(r => ({
      id: r.id,
      n: r.lib?.n || `Mapa ${r.id - LIB0 + 1}`,
      f: r.lib?.f || "",
      bg: r.bg || null,
      gs: r.gs || null,
      at: r.updated_at,
    }));
  for (const m of libList) if (m.f && !libFolders.includes(m.f)) libFolders.push(m.f);
}
async function libSaveFolders() {
  const { error } = await sb.from("map_state").upsert({ id: 999, scene: { lib: { folders: libFolders } } });
  if (error) toast("Não salvei as pastas: " + error.message);
}
function libSnapshot(n, f) {
  const sc = JSON.parse(JSON.stringify(scene));
  sc.lib = { n, f: f || "" };
  return {
    scene: sc,
    tokens,
    fog: { on: !!fog.on, cells: fog.cells || {}, exImg: fog.exImg || null, exBox: fog.exBox || null },
    drawings,
    updated_at: new Date().toISOString(),
  };
}
async function libSaveAs(n, f) {
  if (!libList) await libLoad();
  const id = Math.max(LIB0 - 1, ...libList.map(m => m.id)) + 1;
  scene.libId = id;
  scene.libName = n;
  scene.libF = f || "";
  const { error } = await sb.from("map_state").insert({ id, ...libSnapshot(n, f) });
  if (error) {
    delete scene.libId;
    return toast("Não salvei: " + error.message);
  }
  save("scene", false);
  drawTop();
  toast(`“${n}” salvo nos Mapas.`);
  await libLoad();
}
async function libSaveCur(quiet) {
  if (!scene.libId) return false;
  if (scene.libAt) {
    const { data: r } = await sb.from("map_state").select("updated_at").eq("id", scene.libId).maybeSingle();
    if (
      r?.updated_at &&
      new Date(r.updated_at) > new Date(scene.libAt) &&
      !confirm(
        `“${scene.libName}” foi editado em outra aba depois que você abriu na mesa.\n\nOK = salvar a versão da mesa por cima\nCancelar = manter a versão editada`,
      )
    ) {
      scene.libAt = r.updated_at;
      return false;
    }
  }
  scene.libAt = new Date().toISOString();
  const { error, count } = await sb
    .from("map_state")
    .update(libSnapshot(scene.libName || "Mapa", scene.libF), { count: "exact" })
    .eq("id", scene.libId);
  if (error) {
    toast("Não salvei: " + error.message);
    return false;
  }
  if (!count) {
    const n = scene.libName || "Mapa";
    delete scene.libId;
    await libSaveAs(n, scene.libF);
    return true;
  }
  if (!quiet) toast(`“${scene.libName}” salvo.`);
  return true;
}
async function libOpen(id) {
  if (libBusy) return;
  libBusy = true;
  try {
    const m = libList.find(x => x.id === id);
    if (scene.libId && scene.libId !== id) await libSaveCur(true);
    else if (
      !scene.libId &&
      (scene.bg || scene.gen || tokens.length || walls().length) &&
      !confirm(`Abrir “${m?.n}”? O mapa de agora não está salvo nos Mapas e vai ser substituído.`)
    )
      return;
    const { data, error } = await sb.from("map_state").select("*").eq("id", id).maybeSingle();
    if (error || !data) return toast("Não abri: " + (error?.message || "mapa não encontrado"));
    const sc = {
      bg: null,
      bgW: 0,
      bgH: 0,
      bgQ: 0,
      bgFine: 0,
      light: "day",
      walls: [],
      gen: null,
      roll: null,
      ...(data.scene || {}),
    };
    sc.grid = {
      type: "square",
      size: 70,
      ox: 0,
      oy: 0,
      color: "#000000",
      alpha: 0.35,
      show: true,
      unit: 1.5,
      unitName: "m",
      ...(data.scene?.grid || {}),
    };
    sc.libId = id;
    sc.libName = data.scene?.lib?.n || m?.n || "Mapa";
    sc.libF = data.scene?.lib?.f || "";
    sc.libAt = data.updated_at || new Date().toISOString();
    delete sc.lib;
    scene = sc;
    tokens = data.tokens || [];
    drawings = data.drawings || [];
    fog = {
      on: !!data.fog?.on,
      cells: data.fog?.cells || {},
      exImg: data.fog?.exImg || null,
      exBox: data.fog?.exBox || null,
    };
    exC = null;
    exReady = false;
    exImgSrc = null;
    undoS.length = 0;
    redoS.length = 0;
    for (const c of ["scene", "tokens", "fog", "drawings"]) {
      snapPrev(c);
      lastSave[c] = Date.now();
    }
    wallsVer++;
    losCache.clear();
    selTok = null;
    tokLive = {};
    const { error: e2 } = await sb
      .from("map_state")
      .update({ scene, tokens, fog, drawings, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (e2) toast("Abri aqui, mas não consegui enviar aos jogadores: " + e2.message);
    for (const c of ["scene", "tokens", "drawings", "fog"]) {
      const val = getColFull(c);
      try {
        if (JSON.stringify(val).length < 180000) send("state", { col: c, val });
      } catch {}
    }
    dirty = true;
    drawTop();
    drawEmpty();
    fit();
    const b = mapBox();
    if (b) setTimeout(() => send("view", { x: b[0] + b[2] / 2, y: b[1] + b[3] / 2, z: cam.z }), 300);
    toast(`Mapa “${scene.libName}” aberto.`);
    sndApplyMap();
  } finally {
    libBusy = false;
    if (panelKind === "maps") openMapsPanel();
  }
}
const getColFull = c => (c === "scene" ? scene : c === "tokens" ? tokens : c === "fog" ? fog : drawings);
async function libPatch(id, fn) {
  // muda nome/pasta de um mapa salvo
  const { data, error } = await sb.from("map_state").select("scene").eq("id", id).maybeSingle();
  if (error || !data) return toast("Não consegui: " + (error?.message || "?"));
  const sc = data.scene || {};
  sc.lib = fn({ ...(sc.lib || {}) });
  const { error: e2 } = await sb.from("map_state").update({ scene: sc }).eq("id", id);
  if (e2) return toast("Não consegui: " + e2.message);
  if (scene.libId === id) {
    scene.libName = sc.lib.n;
    scene.libF = sc.lib.f || "";
    save("scene", false);
    drawTop();
  }
}
async function openMapsPanel() {
  panelKind = "maps";
  if (!libList) {
    $("#panel").innerHTML =
      `<div class="panel maps-panel"><h3>Mapas <button class="btn small" id="pClose">Fechar</button></h3><p class="hint">Carregando…</p></div>`;
    $("#pClose").onclick = closePanel;
    await libLoad();
    if (panelKind !== "maps") return;
  }
  const cur = scene.libId ? libList.find(m => m.id === scene.libId) : null;
  const when = s => {
    try {
      return new Date(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
    } catch {
      return "";
    }
  };
  const row = m => `<div class="mrow ${m.id === scene.libId ? "on" : ""}" data-mid="${m.id}" draggable="true">
      <span class="mthumb">${m.bg ? `<img src="${esc(m.bg)}" alt="" loading="lazy">` : m.gs ? (m.gs === "cave" ? "⛰" : "🏰") : "▦"}</span>
      <span class="mname"><b>${esc(m.n)}</b><small>${m.id === scene.libId ? "aberto agora · " : ""}${when(m.at)}</small></span>
      ${EDIT_ID ? `<button class="btn small primary" data-editnow="${m.id}" ${m.id === EDIT_ID ? "disabled" : ""}>Editar</button>` : `<button class="btn small primary" data-open="${m.id}" ${m.id === scene.libId ? "disabled" : ""} title="Abrir na mesa (os jogadores vão para este mapa)">Abrir</button><button class="btn small ic" data-edittab="${m.id}" title="Editar em outra aba, sem tirar os jogadores do mapa atual" aria-label="Editar em outra aba">✏️</button>`}
      ${m.bg ? `<button class="btn small ic" data-mrel="${m.id}" title="Liberar a imagem deste mapa no diário dos jogadores" aria-label="Liberar para os jogadores">📤</button>` : ""}<button class="btn small ic" data-ren="${m.id}" title="Renomear" aria-label="Renomear">✎</button>
      <button class="btn small ic" data-dup="${m.id}" title="Duplicar" aria-label="Duplicar">⧉</button>
      <button class="btn small ic danger" data-del="${m.id}" title="Apagar" aria-label="Apagar">🗑</button></div>`;
  const groups = [["", "Sem pasta"], ...libFolders.map(f => [f, f])];
  $("#panel").innerHTML =
    `<div class="panel maps-panel" role="dialog" aria-label="Mapas salvos"><h3>Mapas <button class="btn small" id="pClose">Fechar</button></h3>
    ${EDIT_ID ? `<div class="mcur">✏️ Editando <b>${esc(scene.lib?.n || "")}</b> nesta aba. Tudo é salvo sozinho e os jogadores não veem. Para usar na sessão, clique em <b>Abrir</b> na aba da mesa.</div>` : ""}
    <div class="mcur" ${EDIT_ID ? "hidden" : ""}>Aberto agora: <b>${esc(scene.libId ? scene.libName : "mapa sem nome")}</b>${scene.libId ? "" : " <small>(não salvo)</small>"}
      <div class="acts" style="margin-top:8px">${scene.libId ? `<button class="btn small primary" id="mSave">💾 Salvar</button>` : ""}<button class="btn small ${scene.libId ? "" : "primary"}" id="mSaveAs">Salvar como novo…</button><button class="btn small" id="mBlank" title="Começar um mapa vazio na mesa">＋ Mapa vazio</button><button class="btn small" id="mNewTab" title="Criar e montar um mapa em outra aba, sem mexer na mesa">✏️ Novo em outra aba</button></div>
      <form id="mForm" hidden><input type="text" id="mName" maxlength="40" placeholder="Nome do mapa" required><select id="mFolder">${groups.map(([k, l]) => `<option value="${esc(k)}">${esc(l)}</option>`).join("")}</select><button class="btn small primary">Salvar</button></form></div>
    <p class="hint">Monte os mapas antes da sessão e na hora é só abrir. Ao abrir outro, o que está aberto é salvo sozinho. Arraste um mapa para outra pasta.</p>
    <div class="acts"><button class="btn small" id="mNewF">＋ Nova pasta</button><span class="spacer"></span>${EDIT_ID ? "" : `<button class="btn small" id="bkDown" title="Baixa um arquivo com todos os mapas, fichas, anotações, chat e a lista de sons">💾 Backup</button><button class="btn small" id="bkUp" title="Volta tudo a partir de um arquivo de backup">📥 Restaurar</button>`}</div>
    ${groups
      .map(([k, l]) => {
        const ms = libList.filter(m => m.f === k);
        if (!k && !ms.length && libFolders.length) return "";
        return `<div class="mfold" data-fold="${esc(k)}"><div class="mfh"><button class="mft" data-tog="${esc(k)}" aria-expanded="${!libClosed[k]}">${libClosed[k] ? "▸" : "▾"} 📁 ${esc(l)} <small>${ms.length}</small></button>${k ? `<button class="btn small ic" data-fren="${esc(k)}" title="Renomear pasta" aria-label="Renomear pasta">✎</button><button class="btn small ic danger" data-fdel="${esc(k)}" title="Apagar pasta" aria-label="Apagar pasta">🗑</button>` : ""}</div>
        ${libClosed[k] ? "" : `<div class="mlist">${ms.map(row).join("") || `<p class="hint" style="margin:4px 8px">Vazia.</p>`}</div>`}</div>`;
      })
      .join("")}
    </div>`;
  $("#pClose").onclick = closePanel;
  if ($("#bkDown")) {
    $("#bkDown").onclick = backupDownload;
    $("#bkUp").onclick = backupRestore;
  }
  const refresh = async () => {
    await libLoad();
    if (panelKind === "maps") openMapsPanel();
  };
  if ($("#mSave"))
    $("#mSave").onclick = async () => {
      await libSaveCur();
      refresh();
    };
  $("#mSaveAs").onclick = () => {
    const f = $("#mForm");
    f.hidden = !f.hidden;
    if (!f.hidden) {
      $("#mName").value = scene.libId ? scene.libName + " (cópia)" : "";
      $("#mFolder").value = scene.libF || "";
      $("#mName").focus();
    }
  };
  $("#mForm").onsubmit = async e => {
    e.preventDefault();
    const n = $("#mName").value.trim();
    if (!n) return;
    await libSaveAs(n, $("#mFolder").value);
    openMapsPanel();
  };
  $("#mBlank").onclick = async () => {
    if (scene.libId) await libSaveCur(true);
    else if (
      (scene.bg || scene.gen || tokens.length || walls().length) &&
      !confirm("O mapa de agora não está salvo nos Mapas. Começar um vazio mesmo assim?")
    )
      return;
    const chars = tokens.filter(t => !isProp(t));
    scene = {
      bg: null,
      bgW: 0,
      bgH: 0,
      bgQ: 0,
      bgFine: 0,
      light: "day",
      walls: [],
      gen: null,
      roll: null,
      libId: null,
      libName: null,
      libF: "",
      grid: { ...scene.grid },
    };
    tokens = chars.map(t => ({ ...t, tr: [] }));
    drawings = [];
    fog = { on: false, cells: {} };
    resetExplore();
    wallsVer++;
    losCache.clear();
    save("scene");
    save("tokens");
    save("drawings");
    save("fog", false);
    dirty = true;
    drawTop();
    drawEmpty();
    fit();
    openMapsPanel();
  };
  if ($("#mNewTab"))
    $("#mNewTab").onclick = async () => {
      const n = (prompt("Nome do novo mapa:") || "").trim().slice(0, 40);
      if (!n) return;
      const id = Math.max(LIB0 - 1, ...libList.map(m => m.id)) + 1,
        w = window.open("about:blank", "_blank");
      const { error } = await sb
        .from("map_state")
        .insert({
          id,
          scene: { bg: null, walls: [], light: "day", grid: { ...scene.grid }, lib: { n, f: "" } },
          tokens: [],
          fog: { on: false, cells: {} },
          drawings: [],
          updated_at: new Date().toISOString(),
        });
      if (error) {
        w?.close();
        return toast("Não criei: " + error.message);
      }
      if (w) w.location.href = `/mapa.html?edit=${id}`;
      else window.open(`/mapa.html?edit=${id}`, "_blank");
      await libLoad();
      openMapsPanel();
    };
  $("#mNewF").onclick = async () => {
    const n = (prompt("Nome da pasta:") || "").trim().slice(0, 30);
    if (!n) return;
    if (!libFolders.includes(n)) {
      libFolders.push(n);
      await libSaveFolders();
    }
    openMapsPanel();
  };
  const P = $("#panel");
  P.onclick = async e => {
    const b = e.target.closest("button");
    if (!b) return;
    const d = b.dataset;
    if (d.tog != null) {
      libClosed[d.tog] = !libClosed[d.tog];
      saveLibClosed();
      openMapsPanel();
    } else if (d.open) libOpen(+d.open);
    else if (d.edittab) window.open(`/mapa.html?edit=${d.edittab}`, "_blank");
    else if (d.editnow) location.href = `/mapa.html?edit=${d.editnow}`;
    else if (d.mrel) {
      const m = libList.find(x => x.id === +d.mrel);
      if (!m?.bg) return;
      if (!hand) await handLoad();
      if (hand.some(h => h.url === m.bg)) {
        hand.find(h => h.url === m.bg).vis = true;
      } else hand.push({ id: uid(), cat: "mapa", t: m.n, body: "", url: m.bg, vis: true, at: Date.now() });
      await handSave();
      toast(`Imagem de “${m.n}” liberada em Mapas para os jogadores.`);
    } else if (d.ren) {
      const m = libList.find(x => x.id === +d.ren);
      const n = (prompt("Novo nome:", m.n) || "").trim().slice(0, 40);
      if (n) {
        await libPatch(m.id, l => ({ ...l, n }));
        refresh();
      }
    } else if (d.dup) {
      const { data, error } = await sb.from("map_state").select("*").eq("id", +d.dup).maybeSingle();
      if (error || !data) return toast("Não consegui duplicar.");
      const id = Math.max(LIB0 - 1, ...libList.map(m => m.id)) + 1;
      data.scene = {
        ...(data.scene || {}),
        lib: { ...(data.scene?.lib || {}), n: (data.scene?.lib?.n || "Mapa") + " (cópia)" },
      };
      delete data.scene.libId;
      const { error: e2 } = await sb
        .from("map_state")
        .insert({ ...data, id, updated_at: new Date().toISOString() });
      if (e2) toast("Não consegui duplicar: " + e2.message);
      refresh();
    } else if (d.del) {
      const m = libList.find(x => x.id === +d.del);
      if (!confirm(`Apagar o mapa salvo “${m.n}”? Não dá para desfazer.`)) return;
      const { error } = await sb.from("map_state").delete().eq("id", m.id);
      if (error) return toast("Não apaguei: " + error.message);
      if (scene.libId === m.id) {
        scene.libId = null;
        save("scene", false);
      }
      refresh();
    } else if (d.fren != null) {
      const old = d.fren,
        n = (prompt("Novo nome da pasta:", old) || "").trim().slice(0, 30);
      if (!n || n === old) return;
      libFolders = libFolders.map(f => (f === old ? n : f));
      await libSaveFolders();
      for (const m of libList.filter(m => m.f === old)) await libPatch(m.id, l => ({ ...l, f: n }));
      if (libClosed[old]) {
        libClosed[n] = true;
        delete libClosed[old];
        saveLibClosed();
      }
      refresh();
    } else if (d.fdel != null) {
      const k = d.fdel,
        ms = libList.filter(m => m.f === k);
      if (
        !confirm(
          ms.length
            ? `Apagar a pasta “${k}”? Os ${ms.length} mapas dela vão para “Sem pasta”.`
            : `Apagar a pasta “${k}”?`,
        )
      )
        return;
      libFolders = libFolders.filter(f => f !== k);
      await libSaveFolders();
      for (const m of ms) await libPatch(m.id, l => ({ ...l, f: "" }));
      refresh();
    }
  };
  // arrastar mapas entre pastas
  P.ondragstart = e => {
    const r = e.target.closest("[data-mid]");
    if (r) {
      e.dataTransfer.setData("text/mesa-map", r.dataset.mid);
      e.dataTransfer.effectAllowed = "move";
    }
  };
  P.ondragover = e => {
    const f = e.target.closest("[data-fold]");
    if (f && [...e.dataTransfer.types].includes("text/mesa-map")) {
      e.preventDefault();
      P.querySelectorAll(".mfold.over").forEach(x => x !== f && x.classList.remove("over"));
      f.classList.add("over");
    }
  };
  P.ondragleave = e => {
    const f = e.target.closest("[data-fold]");
    if (f && !f.contains(e.relatedTarget)) f.classList.remove("over");
  };
  P.ondrop = async e => {
    const f = e.target.closest("[data-fold]");
    const id = +e.dataTransfer.getData("text/mesa-map");
    P.querySelectorAll(".mfold.over").forEach(x => x.classList.remove("over"));
    if (!f || !id) return;
    e.preventDefault();
    const k = f.dataset.fold,
      m = libList.find(x => x.id === id);
    if (!m || m.f === k) return;
    m.f = k;
    openMapsPanel();
    await libPatch(id, l => ({ ...l, f: k }));
    refresh();
  };
}

// ---------- arrastar e soltar no mapa: assets, magias, meus tokens e imagens do computador ----------
let dragPayload = null,
  dropPrev = null;
const DND_SEL = "[data-as],[data-my],[data-sp],[data-mt],[data-bst]";
document.addEventListener(
  "mousedown",
  e => {
    const el = e.target.closest?.(DND_SEL);
    if (el) el.draggable = true;
  },
  true,
);
document.addEventListener("dragstart", e => {
  const el = e.target.closest?.(DND_SEL);
  if (!el) return;
  const d = el.dataset;
  dragPayload =
    d.as != null
      ? { k: "as", i: +d.as }
      : d.my != null
        ? { k: "my", i: +d.my }
        : d.sp != null
          ? { k: "sp", i: +d.sp }
          : d.bst != null
            ? { k: "bst", id: d.bst }
            : { k: "mt", i: +d.mt };
  e.dataTransfer.setData("text/mesa-drop", JSON.stringify(dragPayload));
  e.dataTransfer.effectAllowed = "copy";
  const im = el.querySelector("img");
  if (im) e.dataTransfer.setDragImage(im, im.width / 2, im.height / 2);
});
document.addEventListener("dragend", () => {
  dragPayload = null;
  dropPrev = null;
  dirty = true;
});
function dropSpell(i, wx, wy) {
  const sp = SPELLS[i];
  if (!sp) return;
  spellSel = i;
  spellCustom = null;
  return {
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
  };
}
cv.addEventListener("dragover", e => {
  const files = [...(e.dataTransfer?.types || [])].includes("Files");
  if (!dragPayload && !(files && isGM)) return;
  if (dragPayload && dragPayload.k !== "sp" && !isGM) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = "copy";
  const [wx, wy] = toWorld(e.clientX, e.clientY);
  dropPrev = { x: wx, y: wy, p: dragPayload };
  dirty = true;
});
cv.addEventListener("dragleave", () => {
  dropPrev = null;
  dirty = true;
});
cv.addEventListener("drop", async e => {
  e.preventDefault();
  const [wx, wy] = toWorld(e.clientX, e.clientY);
  lastClick = [wx, wy];
  dropPrev = null;
  dirty = true;
  const p = dragPayload;
  dragPayload = null;
  if (!p) {
    // imagem arrastada do computador: vira um objeto no mapa (e entra em Meus assets)
    if (!isGM) return;
    const f = [...(e.dataTransfer?.files || [])].find(f => f.type.startsWith("image/"));
    if (!f) return;
    toast("Enviando a imagem…");
    try {
      const url = await uploadImage(f, "assets"),
        [iw, ih] = await measure(url).catch(() => [100, 100]),
        n = f.name.replace(/\.\w+$/, "").slice(0, 24);
      const w = Math.max(1, Math.min(8, Math.round(iw / 140))),
        h = Math.max(1, Math.min(8, Math.round((w * ih) / iw)));
      myAssets.push({ n, src: url, w, h });
      saveMyAssets();
      addProp({ n, w, h, blk: null }, url);
      toast(`“${n}” colocado no mapa e salvo em Meus assets.`);
    } catch (err) {
      toast("Não enviei: " + err.message);
    }
    return;
  }
  if (p.k === "sp") {
    const t = dropSpell(p.i, wx, wy);
    if (!t) return;
    if (isGM) {
      drawings.push(t);
      save("drawings");
    } else {
      ptpls[t.id] = t;
      send("tpl", { op: "set", t });
    }
    selTpl = t.id;
    drawTplBar();
    if (flyKind === "spell") openFlyout("spell");
    return;
  }
  if (!isGM) return;
  if (p.k === "bst") return bstPlace(bstAll().find(m => m.id === p.id), wx, wy, 1);
  if (p.k === "as") addProp(ASSETS[p.i]);
  else if (p.k === "my") {
    const a = myAssets[p.i];
    if (a) addProp({ n: a.n, w: a.w, h: a.h, blk: null }, a.src);
  } else if (p.k === "mt") {
    const m = myTokens[p.i];
    if (!m) return;
    const c = JSON.parse(JSON.stringify(m));
    const [x, y] = snapPoint(wx, wy, c.s || 1);
    tokens.push({ ...c, id: uid(), x, y });
    selTok = tokens[tokens.length - 1].id;
    save("tokens");
    dirty = true;
  }
});
function paintDropPrev() {
  const d = dropPrev;
  if (!d) return;
  const p = d.p;
  ctx.save();
  ctx.globalAlpha = 0.6;
  if (!p) {
    const S = G().size;
    ctx.setLineDash([6 / cam.z, 4 / cam.z]);
    ctx.strokeStyle = "#ffe28a";
    ctx.lineWidth = 2 / cam.z;
    ctx.strokeRect(d.x - S / 2, d.y - S / 2, S, S);
    ctx.setLineDash([]);
    ctx.restore();
    label(d.x, d.y, "Soltar a imagem aqui");
    return;
  }
  if (p.k === "sp") {
    const t = dropSpell(p.i, d.x, d.y);
    if (t) paintTpl(t, true);
  } else if (p.k === "mt") {
    const m = myTokens[p.i];
    if (m) {
      const [x, y] = snapPoint(d.x, d.y, m.s || 1);
      ctx.beginPath();
      ctx.arc(x, y, tokR(m), 0, Math.PI * 2);
      ctx.fillStyle = m.c || "#d0a54c";
      ctx.fill();
    }
  } else {
    const a = p.k === "as" ? ASSETS[p.i] : myAssets[p.i];
    if (a) {
      const t = {
        k: "prop",
        pw: a.w,
        ph: a.h,
        a: 0,
        sn: true,
        img: p.k === "as" ? `/assets/${a.path || a.id + ".svg"}` : a.src,
      };
      const [x, y] = snapProp(t, d.x, d.y);
      t.x = x;
      t.y = y;
      paintProp(t);
      const [W2, H2] = propSize(t);
      ctx.globalAlpha = 1;
      ctx.setLineDash([6 / cam.z, 4 / cam.z]);
      ctx.strokeStyle = "#ffe28a";
      ctx.lineWidth = 2 / cam.z;
      ctx.strokeRect(x - W2 / 2, y - H2 / 2, W2, H2);
      ctx.setLineDash([]);
    }
  }
  ctx.restore();
}

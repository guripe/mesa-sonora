"use strict";
// ---------- interface ----------
function setTool(t) {
  tool = t;
  wallDraft = null;
  cv.className = "t-" + (t === "wall" || t === "spell" ? "draw" : t);
  drawTools();
  if ((["draw", "fog", "wall"].includes(t) && isGM) || t === "spell") openFlyout(t);
  else closeFlyout();
  dirty = true;
}
function fitTools() {
  // barra da esquerda: quebra em colunas quando a tela é baixa, e o resto da tela se afasta dela
  const el = $("#tools");
  if (!el) return;
  const n = el.querySelectorAll(".tool").length,
    sz = innerHeight < 760 ? 38 : 44,
    gap = innerHeight < 760 ? 3 : 4;
  const rows = Math.max(3, Math.min(n, Math.floor((innerHeight - 90) / (sz + gap))));
  el.style.gridTemplateRows = `repeat(${rows}, ${sz}px)`;
  requestAnimationFrame(() =>
    document.documentElement.style.setProperty(
      "--toolsW",
      Math.round(el.getBoundingClientRect().right) + "px",
    ),
  );
}
addEventListener("resize", () => fitTools());
function drawTools() {
  const btn = (t, icon, label, key) =>
    `<button class="tool" data-tool="${t}" aria-pressed="${tool === t}" title="${label} (${key.toUpperCase()})" aria-label="${label}">${icon}<span class="k">${key.toUpperCase()}</span></button>`;
  $("#tools").innerHTML =
    btn("move", I.move, isGM ? "Mover tokens e o mapa" : "Mover o mapa", "v") +
    btn("ruler", I.ruler, "Régua", "r") +
    btn("spell", I.spell, "Áreas de magia", "m") +
    (!isGM
      ? `<hr><button class="tool" id="pMaps" title="Mapas que o mestre liberou" aria-label="Mapas">${I.maps}<i class="tdot" hidden></i></button><button class="tool" id="pNotes" title="Anotações: o que o mestre liberou e as suas notas" aria-label="Anotações">${I.notes}<i class="tdot" hidden></i></button><button class="tool" id="pSheets" title="Ficha do seu personagem" aria-label="Ficha">${I.sheet}</button>`
      : "") +
    (isGM
      ? btn("draw", I.draw, "Desenhar e marcar áreas", "d") +
        btn("erase", I.erase, "Borracha (apaga desenhos)", "e") +
        btn("fog", I.fog, "Névoa de guerra", "f") +
        btn("wall", I.wall, "Paredes e portas (bloqueiam luz e visão)", "w") +
        `<hr><button class="tool" id="addTok" title="Adicionar token" aria-label="Adicionar token">${I.token}</button><button class="tool" id="listTok" title="Lista de tokens" aria-label="Lista de tokens">${I.list}</button><button class="tool" id="assetsBtn" title="Assets: árvores, casas, animais, baús…" aria-label="Assets">${I.box}</button><button class="tool" id="genBtn" title="Gerador de cenários: masmorra, caverna, floresta, vila, taverna, cemitério" aria-label="Gerador de cenários">${I.dungeon}</button><button class="tool" id="mapsBtn" title="Mapas salvos (pastas)" aria-label="Mapas salvos">${I.maps}</button><button class="tool" id="iniBtn" title="Iniciativa e turnos" aria-label="Iniciativa">${I.swords}</button><button class="tool" id="sheetsBtn" title="Fichas de personagem" aria-label="Fichas">${I.sheet}</button><button class="tool" id="sndBtn" title="Som: trilha do mapa, música de combate e zonas de som" aria-label="Som">${I.music}</button><button class="tool" id="handBtn" title="Anotações, mapas e imagens (libere para os jogadores ou mostre na tela deles)" aria-label="Anotações">${I.notes}</button><button class="tool" id="sceneBtn" title="Mapa e grid" aria-label="Configurar mapa e grid">${I.gear}</button>`
      : "");
  $("#tools").onclick = e => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.tool) setTool(b.dataset.tool);
    else if (b.id === "addTok") openTokenPanel(null);
    else if (b.id === "listTok") panelKind === "list" ? closePanel() : openTokenList();
    else if (b.id === "assetsBtn") panelKind === "assets" ? closePanel() : openAssets();
    else if (b.id === "genBtn") panelKind === "gen" ? closePanel() : openGenPanel();
    else if (b.id === "mapsBtn") panelKind === "maps" ? closePanel() : openMapsPanel();
    else if (b.id === "iniBtn") panelKind === "ini" ? closePanel() : openIniPanel();
    else if (b.id === "sndBtn") panelKind === "snd" ? closePanel() : openSndPanel();
    else if (b.id === "sheetsBtn" || b.id === "pSheets") {
      if (panelKind === "sheets") closePanel();
      else if (!isGM && !$("#sheetWin")) {
        const mine = (sheets || []).filter(canEditSh);
        if (mine.length === 1) openSheet(mine[0].id);
        else openSheetsPanel();
      } else openSheetsPanel();
    } else if (b.id === "handBtn") panelKind === "hand" ? closePanel() : openHandPanel();
    else if (b.id === "pMaps" || b.id === "pNotes") {
      b.querySelector(".tdot").hidden = true;
      if (panelKind === "hand" && handTab === (b.id === "pMaps" ? "mapa" : "nota")) closePanel();
      else openHandPanel(b.id === "pMaps" ? "mapa" : "nota");
    } else if (b.id === "sceneBtn") panelKind === "scene" ? closePanel() : openScenePanel();
  };
  fitTools();
}
function drawTop() {
  $("#topbar").innerHTML =
    `<div class="title">${EDIT_ID ? "✏️ " + esc(scene.lib?.n || "Mapa") : isGM && scene.libName ? esc(scene.libName) : "Mapa da mesa"}<small>${EDIT_ID ? "editando · jogadores não veem" : isGM ? "mestre" : esc(myNick || "jogador")}</small></div><span class="spacer"></span>
    ${
      isGM
        ? `<div class="seg light" id="lightSeg" title="Iluminação do mapa">${[
            ["day", "☀ Dia"],
            ["dim", "🌗 Penumbra"],
            ["dark", "🌑 Escuro"],
          ]
            .map(
              ([k, l]) =>
                `<button data-light="${k}" aria-pressed="${(scene.light || "day") === k}">${l}</button>`,
            )
            .join("")}</div>
      <button class="btn" id="prevBtn" aria-pressed="${gmPreview}" title="Mostra por cima do mapa o que os jogadores enxergam">${I.eye} Ver como jogadores</button>`
        : ""
    }
    <button class="btn" id="trailBtn" aria-pressed="${showTrails}" title="Mostrar o rastro de todos os tokens">👣 Rastros</button>
    <button class="btn" id="stepBtn" aria-pressed="${stepsOn}" title="Som de passos quando os personagens andam">${stepsOn ? "🔊" : "🔇"} Passos</button>
    ${!isGM ? `<button class="btn" id="lookBtn" aria-pressed="${lookMouse}" title="Seu personagem olha para onde o mouse está">🧭 Olhar p/ mouse</button>` : ""}
    ${isGM ? `<button class="btn" id="turnBtn" title="Apaga os rastros de todos (começo de um novo turno)">⟳ Novo turno</button>` : ""}
    ${isGM ? `<button class="btn" id="castBtn" title="Faz a tela dos jogadores ir para onde você está olhando">${I.cast} Levar jogadores aqui</button>` : ""}
    ${EDIT_ID ? "" : `<button class="btn small" id="maBtn" title="Som da mesa aqui no mapa (ligar/desligar e volume)">${!MA.on ? "🔇 Som" : MA.ok() ? "🔊 Som" : "🔈 Som"}</button>`}
    <button class="btn small" id="helpBtn" title="Ajuda e tutorial" aria-label="Ajuda">?</button>
    <div class="zoom"><button class="btn small" id="zOut" aria-label="Diminuir zoom">${I.minus}</button><span>${Math.round(cam.z * 100)}%</span><button class="btn small" id="zIn" aria-label="Aumentar zoom">${I.plus}</button><button class="btn small" id="zFit" title="Enquadrar o mapa (0)" aria-label="Enquadrar">${I.fit}</button></div>`;
  $("#helpBtn").onclick = () => openHelp();
  const mb = $("#maBtn");
  if (mb)
    mb.onclick = () => {
      MA.init();
      openMaPop();
    };
  $("#zOut").onclick = () => zoomAt(1 / 1.2);
  $("#zIn").onclick = () => zoomAt(1.2);
  $("#zFit").onclick = fit;
  const ls = $("#lightSeg");
  if (ls)
    ls.onclick = e => {
      const b = e.target.closest("[data-light]");
      if (!b) return;
      scene.light = b.dataset.light;
      save("scene");
      dirty = true;
      drawTop();
    };
  const pb = $("#prevBtn");
  if (pb)
    pb.onclick = () => {
      gmPreview = !gmPreview;
      dirty = true;
      drawTop();
      if (gmPreview && !tokens.some(t => VI(t) && t.o))
        toast("Nenhum token de jogador tem visão ainda (aba “Visão e luz” do token).");
    };
  $("#trailBtn").onclick = () => {
    showTrails = !showTrails;
    dirty = true;
    drawTop();
  };
  $("#stepBtn").onclick = () => {
    stepsOn = !stepsOn;
    try {
      localStorage.setItem("mesa.steps", stepsOn ? "1" : "0");
    } catch {}
    drawTop();
    if (stepsOn) DS.step(0.4);
  };
  const lb = $("#lookBtn");
  if (lb)
    lb.onclick = () => {
      lookMouse = !lookMouse;
      try {
        localStorage.setItem("mesa.look", lookMouse ? "1" : "0");
      } catch {}
      drawTop();
    };
  const tb = $("#turnBtn");
  if (tb)
    tb.onclick = () => {
      let n = 0;
      for (const t of tokens)
        if (t.tr?.length) {
          t.tr = [];
          n++;
        }
      save("tokens");
      dirty = true;
      selBarKey = "";
      toast(n ? "Novo turno: rastros apagados." : "Novo turno.");
    };
  const cb = $("#castBtn");
  if (cb)
    cb.onclick = () => {
      const [wx, wy] = toWorld(innerWidth / 2, innerHeight / 2);
      send("view", { x: wx, y: wy, z: cam.z });
      toast("Jogadores levados para a sua visão.");
    };
  drawTurnBar();
}
function drawEmpty() {
  let el = $("#emptyMap");
  const show = isGM && !scene.bg && !scene.gen && !tokens.length;
  if (!show) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("div");
    el.id = "emptyMap";
    el.className = "empty-map";
    document.body.appendChild(el);
  }
  el.innerHTML = `<div><b>Mapa vazio</b>Coloque a imagem de um mapa (link ou arquivo) e ajuste a grid, gere uma masmorra ou abra um mapa salvo.<br><br><div class="acts" style="justify-content:center"><button class="btn primary" id="emptyScene">${I.gear} Configurar mapa</button><button class="btn" id="emptyGen">${I.dungeon} Gerar masmorra</button><button class="btn" id="emptyMaps">${I.maps} Mapas salvos</button></div></div>`;
  $("#emptyScene").onclick = () => openScenePanel();
  $("#emptyGen").onclick = () => openGenPanel();
  $("#emptyMaps").onclick = () => openMapsPanel();
}

// flyouts de ferramenta
let flyKind = null;
function closeFlyout() {
  $("#flyout").innerHTML = "";
  flyKind = null;
}
function closeFlyoutSoft() {
  /* mantém aberto enquanto usa a ferramenta */
}
function openFlyout(kind) {
  flyKind = kind;
  const top = $(`[data-tool="${kind}"]`).getBoundingClientRect().top;
  const f = $("#flyout");
  if (kind === "draw") {
    const shapes = [
      ["pen", I.pen, "Livre"],
      ["line", I.line, "Linha"],
      ["circle", I.circle, "Círculo"],
      ["cone", I.cone, "Cone"],
      ["rect", I.rect, "Quadrado"],
      ["text", "<b style='font:700 15px serif'>T</b>", "Texto"],
    ];
    f.innerHTML = `<div class="flyout" style="top:${top}px"><h4>Desenhar</h4>
      <div class="seg" id="fShapes">${shapes.map(([k, ic, l]) => `<button data-shape="${k}" aria-pressed="${opt.draw === k}">${ic}${l}</button>`).join("")}</div>
      <div class="lbl" style="margin-top:10px">Cor</div><div class="row" id="fColors">${COLORS.map(c => `<button class="sw" data-color="${c}" style="background:${c}" aria-label="Cor ${c}" aria-pressed="${opt.color === c}"></button>`).join("")}</div>
      <div class="lbl">Espessura</div><input type="range" id="fW" min="1" max="20" value="${opt.width}">
      <p class="hint">Círculo, cone e quadrado mostram o tamanho em casas enquanto você arrasta. Use a Borracha (E) para apagar.</p>
      <div class="row" style="margin:10px 0 0"><button class="btn small danger" id="fClear">Apagar todos os desenhos</button></div></div>`;
    $("#fShapes").onclick = e => {
      const b = e.target.closest("[data-shape]");
      if (b) {
        opt.draw = b.dataset.shape;
        openFlyout("draw");
      }
    };
    $("#fColors").onclick = e => {
      const b = e.target.closest("[data-color]");
      if (b) {
        opt.color = b.dataset.color;
        openFlyout("draw");
      }
    };
    $("#fW").oninput = e => (opt.width = +e.target.value);
    $("#fClear").onclick = () => {
      if (!drawings.length) return;
      if (confirm("Apagar todos os desenhos do mapa?")) {
        drawings = [];
        save("drawings");
        dirty = true;
      }
    };
  } else if (kind === "spell") {
    const sp = curSpell();
    f.innerHTML = `<div class="flyout spellfly" style="top:${Math.max(10, top - 40)}px"><h4>Áreas de magia</h4>
      <div class="spgrid" id="spGrid">${SPELLS.map((x, i) => `<button data-sp="${i}" aria-pressed="${!spellCustom && spellSel === i}" style="--sc:${x.c}"><span>${x.ic}</span>${esc(x.n)}<small>${x.sh === "line" ? "linha " : x.sh === "cone" ? "cone " : x.sh === "square" ? "cubo " : "raio "}${String(x.r).replace(".", ",")} ${esc(G().unitName)}</small></button>`).join("")}</div>
      <div class="lbl" style="margin-top:10px">Ajustar antes de colocar</div>
      <div class="two"><label>Tamanho (${esc(G().unitName)}) <input type="number" id="spR" min="1" step="1.5" value="${sp.r}"></label><label>Cor <input type="color" id="spC" value="${sp.c}"></label></div>
      <div class="seg" id="spSh" style="margin-top:6px">${[
        ["circle", "Círculo"],
        ["cone", "Cone"],
        ["line", "Linha"],
        ["square", "Cubo"],
      ]
        .map(([k, l]) => `<button data-sh="${k}" aria-pressed="${sp.sh === k}">${l}</button>`)
        .join("")}</div>
      <p class="hint" style="margin-top:8px"><b>Arraste uma magia para o mapa</b>, ou escolha e clique no mapa para colocar. Cone e linha: clique na origem e arraste para mirar. Depois, com Mover (V), arraste a área ou a bolinha branca (girar / tamanho). Delete remove.${isGM ? "" : " Todos veem a sua área enquanto ela existir."}</p></div>`;
    $("#spGrid").onclick = e => {
      const b = e.target.closest("[data-sp]");
      if (b) {
        spellSel = +b.dataset.sp;
        spellCustom = null;
        openFlyout("spell");
      }
    };
    const upd = () => {
      spellCustom = {
        ...curSpell(),
        r: Math.max(1, parseFloat(String($("#spR").value).replace(",", ".")) || curSpell().r),
        c: $("#spC").value,
      };
    };
    $("#spR").oninput = upd;
    $("#spC").oninput = upd;
    $("#spSh").onclick = e => {
      const b = e.target.closest("[data-sh]");
      if (!b) return;
      spellCustom = { ...curSpell(), sh: b.dataset.sh, wd: b.dataset.sh === "line" ? 1.5 : undefined };
      openFlyout("spell");
    };
  } else if (kind === "wall") {
    f.innerHTML = `<div class="flyout" style="top:${Math.max(10, top - 60)}px"><h4>Paredes e portas</h4>
      <div class="seg" id="wMode" style="margin-bottom:10px"><button data-wm="wall" aria-pressed="${opt.wall === "wall"}">${I.wall} Parede</button><button data-wm="door" aria-pressed="${opt.wall === "door"}">${I.door} Porta</button><button data-wm="secret" aria-pressed="${opt.wall === "secret"}" title="Os jogadores não veem a porta: parece parede até você abrir">${I.door} Secreta</button><button data-wm="hide" aria-pressed="${opt.wall === "hide"}" title="Clique (ou arraste) em cima de uma parede: aquele trecho vira passagem secreta">${I.eye} Ocultar trecho</button><button data-wm="circle" aria-pressed="${opt.wall === "circle"}">${I.circle} Círculo</button><button data-wm="erase" aria-pressed="${opt.wall === "erase"}">${I.erase} Apagar</button></div>
      <p class="hint">${opt.wall === "erase" ? "Clique numa parede ou porta para apagar." : opt.wall === "hide" ? "Clique numa parede para transformar aquele quadrado em passagem secreta (arraste ao longo da parede para pegar mais quadrados). Para os jogadores continua parecendo parede até você abrir com Mover (V). Clique numa passagem secreta para ela voltar a ser parede." : opt.wall === "circle" ? "Clique no centro e arraste até o tamanho (bom para troncos de árvore e colunas). Depois dá para arrastar o ponto amarelo (mover) e o azul (tamanho)." : opt.wall === "door" ? "Clique no começo e no fim da porta. Depois, com a ferramenta Mover (V), clique na porta para abrir ou fechar." : opt.wall === "secret" ? "Porta secreta (roxa): para os jogadores é parede até você abrir. Clique no começo e no fim; abra e feche com Mover (V)." : "Clique ponto a ponto para desenhar a parede. Enter, Esc ou botão direito terminam. Os pontos grudam nos cantos da grid; segure Shift para soltar. Arraste uma junção (ponto amarelo) para deformar a parede."}</p>
      <p class="hint" style="margin-top:6px"><b>Ctrl+Z</b> desfaz, <b>Ctrl+Y</b> refaz.</p>
      <p class="hint" style="margin-top:6px">Paredes bloqueiam a luz e a visão dos jogadores. Só você vê as linhas.</p>
      <div class="row" style="margin:10px 0 0"><button class="btn small danger" id="wClear">Apagar todas as paredes</button></div></div>`;
    $("#wMode").onclick = e => {
      const b = e.target.closest("[data-wm]");
      if (b) {
        opt.wall = b.dataset.wm;
        wallDraft = null;
        openFlyout("wall");
        dirty = true;
      }
    };
    $("#wClear").onclick = () => {
      if (walls().length && confirm("Apagar todas as paredes e portas?")) {
        scene.walls = [];
        wallsChanged();
      }
    };
  } else if (kind === "fog") {
    f.innerHTML = `<div class="flyout" style="top:${Math.max(10, top - 40)}px"><h4>Névoa de guerra</h4>
      <label class="chk" style="margin-bottom:10px"><input type="checkbox" id="fOn" ${fog.on ? "checked" : ""}> Névoa ligada</label>
      <div class="seg" id="fMode" style="margin-bottom:8px"><button data-fog="reveal" aria-pressed="${opt.fog === "reveal"}">${I.eye} Revelar</button><button data-fog="hide" aria-pressed="${opt.fog === "hide"}">Esconder</button></div>
      <div class="seg" id="fShape" style="margin-bottom:10px"><button data-fs="brush" aria-pressed="${opt.fogShape === "brush"}">${I.brush} Pincel</button><button data-fs="rect" aria-pressed="${opt.fogShape === "rect"}">${I.rect} Retângulo</button></div>
      ${opt.fogShape === "brush" ? `<div class="lbl">Tamanho do pincel: ${opt.brush} ${opt.brush === 1 ? "casa" : "casas"}</div><input type="range" id="fB" min="1" max="6" value="${opt.brush}">` : ""}
      <div class="row" style="margin:12px 0 0"><button class="btn small" id="fAll">Revelar tudo</button><button class="btn small" id="fNone">Esconder tudo</button></div>
      <p class="hint">Você vê a névoa transparente; os jogadores veem preto. Tokens e desenhos embaixo da névoa ficam escondidos pra eles.</p>
      <div class="lbl" style="margin-top:12px">Memória dos jogadores</div>
      <p class="hint">Onde os personagens já viram fica guardado (mais escuro) quando eles se afastam, no formato exato das paredes.${fog.exImg ? "" : " Ainda nada explorado."}</p>
      <div class="row" style="margin:8px 0 0"><button class="btn small danger" id="fExClear">Apagar memória</button></div></div>`;
    $("#fExClear").onclick = () => {
      if (confirm("Apagar tudo o que os jogadores já exploraram?")) {
        fog.exImg = null;
        fog.exBox = null;
        fog.ex = {};
        exC = null;
        exReady = false;
        exImgSrc = null;
        save("fog", false);
        dirty = true;
        openFlyout("fog");
      }
    };
    $("#fOn").onchange = e => {
      fog.on = e.target.checked;
      save("fog");
      dirty = true;
    };
    $("#fMode").onclick = e => {
      const b = e.target.closest("[data-fog]");
      if (b) {
        opt.fog = b.dataset.fog;
        openFlyout("fog");
      }
    };
    $("#fShape").onclick = e => {
      const b = e.target.closest("[data-fs]");
      if (b) {
        opt.fogShape = b.dataset.fs;
        openFlyout("fog");
      }
    };
    const fb = $("#fB");
    if (fb)
      fb.oninput = e => {
        opt.brush = +e.target.value;
        e.target.previousElementSibling.textContent = `Tamanho do pincel: ${opt.brush} ${opt.brush === 1 ? "casa" : "casas"}`;
      };
    $("#fAll").onclick = () => {
      fog.on = false;
      fog.cells = {};
      save("fog");
      openFlyout("fog");
      dirty = true;
      toast("Névoa desligada: o mapa inteiro está visível.");
    };
    $("#fNone").onclick = () => {
      fog.on = true;
      fog.cells = {};
      fog.sig = fogSig();
      save("fog");
      openFlyout("fog");
      dirty = true;
      toast("Mapa todo escondido. Use Revelar para abrir as áreas.");
    };
  }
}

// painéis
let panelKind = null;
function closePanel() {
  $("#panel").innerHTML = "";
  panelKind = null;
}
async function uploadImage(file, prefix) {
  const safe = file.name
    .normalize("NFD")
    .replace(/[^\w.-]+/g, "-")
    .slice(-60);
  const path = `${prefix}/${Date.now()}-${safe}`;
  const { error } = await sb.storage
    .from("sons")
    .upload(path, file, { contentType: file.type || undefined, cacheControl: "31536000" });
  if (error) throw error;
  return sb.storage.from("sons").getPublicUrl(path).data.publicUrl;
}
function measure(url) {
  return new Promise((ok, bad) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => ok([im.naturalWidth, im.naturalHeight]);
    im.onerror = () => bad(new Error("não consegui abrir essa imagem"));
    im.src = url;
  });
}
async function setBackground(url) {
  try {
    const [w, h] = await measure(url);
    scene.bg = url;
    scene.bgW = w;
    scene.bgH = h;
    scene.bgQ = 0;
    scene.bgFine = 0;
    save("scene");
    dirty = true;
    drawEmpty();
    fit();
    openScenePanel(true);
    toast("Mapa colocado. Agora ajuste a grid para bater com o desenho.");
  } catch (e) {
    toast("Não carreguei a imagem: " + e.message);
  }
}
function openScenePanel(refresh) {
  if (refresh && panelKind !== "scene") return;
  panelKind = "scene";
  const g = G();
  const keep = document.activeElement?.id;
  $("#panel").innerHTML =
    `<div class="panel" role="dialog" aria-label="Mapa e grid"><h3>Mapa e grid <button class="btn small" id="pClose">Fechar</button></h3>
    <label for="bgUrl">Imagem do mapa (link)</label>
    <div style="display:flex;gap:6px"><input type="url" id="bgUrl" placeholder="https://… .jpg / .png" value="${esc(scene.bg || "")}"><button class="btn small primary" id="bgSet">Usar</button></div>
    <div class="acts" style="margin-top:8px"><label class="btn small" style="margin:0;color:var(--ink)">Enviar arquivo…<input type="file" id="bgFile" accept="image/*" hidden></label>${scene.bg ? `<button class="btn small danger" id="bgDel">Tirar imagem</button>` : ""}</div>
    ${
      scene.bg
        ? `<label>Girar a imagem</label>
    <div class="acts" style="margin-top:0"><button class="btn small" id="bgL" title="Girar 90° para a esquerda">↺ 90°</button><button class="btn small" id="bgR" title="Girar 90° para a direita">↻ 90°</button><span class="hint" style="align-self:center">${((scene.bgQ || 0) * 90) % 360}°</span></div>
    <label for="bgFine">Ajuste fino: <b id="bgFineV">${String(+scene.bgFine || 0).replace(".", ",")}°</b></label>
    <input type="range" id="bgFine" min="-15" max="15" step="0.25" value="${+scene.bgFine || 0}">
    <p class="hint">Gire antes de colocar paredes e tokens, porque eles não giram junto com a imagem.</p>`
        : ""
    }
    <div class="sect"><label>Formato da grid</label>
      <div class="seg" id="gType"><button data-gt="square" aria-pressed="${g.type === "square"}">▢ Quadrado</button><button data-gt="hex" aria-pressed="${g.type === "hex"}">⬡ Hexágono</button></div>
      ${g.type === "hex" ? `<div class="seg" id="gFlat" style="margin-top:6px"><button data-fl="0" aria-pressed="${!g.flat}">⬡ Em pé</button><button data-fl="1" aria-pressed="${!!g.flat}">⬢ Deitado</button></div>` : ""}
      <label for="gSize">Tamanho da casa: <b id="gSizeV">${g.size}</b> px</label><input type="range" id="gSize" min="16" max="240" step="1" value="${g.size}">
      <div class="two"><div><label for="gOx">Deslocar ↔</label><input type="range" id="gOx" min="0" max="${Math.round(g.size)}" step="1" value="${Math.round(((g.ox % g.size) + g.size) % g.size)}"></div>
      <div><label for="gOy">Deslocar ↕</label><input type="range" id="gOy" min="0" max="${Math.round(g.size * (g.type === "hex" ? (1.5 * 2) / SQ3 : 1))}" step="1" value="${Math.round(((g.oy % g.size) + g.size) % g.size)}"></div></div>
      <p class="hint">Ajuste o tamanho e o deslocamento até a grid bater com as casas desenhadas no mapa.</p>
      <label class="chk" style="margin-top:10px"><input type="checkbox" id="gShow" ${g.show ? "checked" : ""}> Mostrar grid</label>
      <div class="two"><div><label for="gAlpha">Força da linha</label><input type="range" id="gAlpha" min="0.05" max="1" step="0.05" value="${g.alpha}"></div>
      <div><label>Cor da linha</label><div class="seg" id="gColor">${[
        ["#000000", "Preta"],
        ["#ffffff", "Branca"],
        ["#d0a54c", "Dourada"],
      ]
        .map(
          ([c, n]) =>
            `<button data-gc="${c}" aria-pressed="${g.color === c}" title="${n}" style="padding:6px"><span class="sw" style="display:block;width:16px;height:16px;background:${c}"></span></button>`,
        )
        .join("")}</div></div></div></div>
    <div class="sect"><label>Cada casa vale</label>
      <div class="two"><input type="number" id="gUnit" min="0.1" step="0.5" value="${g.unit}" aria-label="Valor de cada casa"><input type="text" id="gUnitName" maxlength="6" value="${esc(g.unitName)}" aria-label="Unidade"></div>
      <p class="hint">Ex.: 1,5 m ou 5 ft. Usado pela régua e pelas áreas.</p></div>
    ${fog.on && Object.keys(fog.cells).length && fog.sig && fog.sig !== fogSig() ? `<p class="hint" style="color:#e0a08e;margin-top:10px">A grid mudou depois de você revelar a névoa, então as áreas reveladas podem ter saído do lugar.</p>` : ""}
  </div>`;
  $("#pClose").onclick = closePanel;
  $("#bgSet").onclick = () => {
    const u = $("#bgUrl").value.trim();
    if (u) setBackground(u);
  };
  $("#bgUrl").onkeydown = e => {
    if (e.key === "Enter") $("#bgSet").click();
  };
  $("#bgFile").onchange = async e => {
    const f = e.target.files[0];
    if (!f) return;
    toast("Enviando o mapa…");
    try {
      await setBackground(await uploadImage(f, "mapas"));
    } catch (err) {
      toast("Não enviei: " + err.message);
    }
  };
  const turn = dq => {
    scene.bgQ = ((((scene.bgQ || 0) + dq) % 4) + 4) % 4;
    save("scene");
    dirty = true;
    fit();
    openScenePanel(true);
  };
  if ($("#bgL")) {
    $("#bgL").onclick = () => turn(-1);
    $("#bgR").onclick = () => turn(1);
    $("#bgFine").oninput = e => {
      scene.bgFine = +e.target.value;
      $("#bgFineV").textContent = String(scene.bgFine).replace(".", ",") + "°";
      save("scene", "merge");
      dirty = true;
    };
  }
  const del = $("#bgDel");
  if (del)
    del.onclick = () => {
      scene.bg = null;
      scene.bgW = scene.bgH = 0;
      save("scene");
      dirty = true;
      drawEmpty();
      openScenePanel(true);
    };
  const gf = $("#gFlat");
  if (gf)
    gf.onclick = e => {
      const b = e.target.closest("[data-fl]");
      if (!b) return;
      g.flat = b.dataset.fl === "1";
      save("scene");
      dirty = true;
      openScenePanel(true);
    };
  $("#gType").onclick = e => {
    const b = e.target.closest("[data-gt]");
    if (!b || g.type === b.dataset.gt) return;
    g.type = b.dataset.gt;
    save("scene");
    dirty = true;
    openScenePanel(true);
  };
  const live = (id, fn) => {
    $(id).oninput = e => {
      fn(+e.target.value);
      dirty = true;
      save("scene", "merge");
    };
  };
  live("#gSize", v => {
    g.size = v;
    $("#gSizeV").textContent = v;
    $("#gOx").max = v;
    $("#gOy").max = Math.round(v * (g.type === "hex" ? (1.5 * 2) / SQ3 : 1));
  });
  live("#gOx", v => (g.ox = v));
  live("#gOy", v => (g.oy = v));
  live("#gAlpha", v => (g.alpha = v));
  $("#gShow").onchange = e => {
    g.show = e.target.checked;
    save("scene");
    dirty = true;
  };
  $("#gColor").onclick = e => {
    const b = e.target.closest("[data-gc]");
    if (b) {
      g.color = b.dataset.gc;
      save("scene");
      dirty = true;
      openScenePanel(true);
    }
  };
  $("#gUnit").onchange = e => {
    const v = parseFloat(String(e.target.value).replace(",", "."));
    if (v > 0) {
      g.unit = v;
      save("scene");
      dirty = true;
    }
  };
  $("#gUnitName").onchange = e => {
    g.unitName = e.target.value.trim() || "m";
    save("scene");
    dirty = true;
  };
  if (keep && $("#" + keep)) $("#" + keep).focus();
}
function openTokenPanel(t) {
  panelKind = "token";
  const isNew = !t;
  const d = JSON.parse(JSON.stringify(t || { n: "", c: COLORS[1], s: 1, img: "", h: false }));
  d.b = [0, 1, 2].map(i => (d.b || [])[i] || { v: "", m: "", c: ["#c0473a", "#7fb2e8", "#3fbf4a"][i] });
  d.au = { on: false, f: "circle", d: 3, c: "#ff3b30", ...(d.au || {}) };
  {
    const v0 = VI({ vi: { ...(d.vi || {}), on: true } });
    d.vi = { on: !!d.vi?.on, rb: v0.rb || 30, rd: v0.rd || 12, rk: v0.rk || 0, ang: v0.ang ?? 180 };
    if (!t?.vi) d.vi = { on: false, rb: 30, rd: 12, rk: 0, ang: 180 };
  }
  d.li = { rb: 0, rd: 0, ang: 360, ...(d.li || {}) };
  if (d.sn == null) d.sn = true;
  let tab = "props";
  const names = [...new Set([...peersOnMap, ...tokens.map(x => x.o).filter(x => x && x !== "*")])].sort(
    (x, y) => x.localeCompare(y, "pt-BR"),
  );
  const known = !d.o || d.o === "*" || names.includes(d.o);
  const tabs = [
    ["props", "Propriedades"],
    ["aura", "Aura"],
    ["vis", "Visão e luz"],
    ["img", "Imagem"],
  ];
  const DIRS = [
    ["none", "Sem direção"],
    ["arrow", "Seta de direção"],
    ["rotate", "Rotacionar imagem"],
  ];
  const ARROWS = [
    [315, "↖"],
    [0, "↑"],
    [45, "↗"],
    [270, "←"],
    [null, "•"],
    [90, "→"],
    [225, "↙"],
    [180, "↓"],
    [135, "↘"],
  ];
  $("#panel").innerHTML =
    `<div class="panel tokpanel" role="dialog" aria-label="Propriedades do token"><h3>${isNew ? "Novo token" : "Propriedades do token"}</h3>
    <div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" data-tab="${k}" aria-selected="${k === tab}">${l}</button>`).join("")}</div>

    <section data-pane="props">
      <label for="tOwner">Personagem de</label>
      <select id="tOwner">
        <option value="">Ninguém (só o mestre move)</option>
        <option value="*" ${d.o === "*" ? "selected" : ""}>Todos os jogadores</option>
        ${names.map(n => `<option value="${esc(n)}" ${d.o === n ? "selected" : ""}>${esc(n)}${peersOnMap.includes(n) ? " · no mapa agora" : ""}</option>`).join("")}
        <option value="__other" ${known ? "" : "selected"}>Outro nome…</option>
      </select>
      <input type="text" id="tOwnerTxt" maxlength="30" placeholder="Nome do jogador, igual ao que ele usa na mesa" value="${known ? "" : esc(d.o)}" ${known ? "hidden" : ""} style="margin-top:6px">
      <label for="tName">Nome</label><input type="text" id="tName" maxlength="24" value="${esc(d.n)}" placeholder="Ex.: Carroça, Goblin 1, Aria">
      <label>Cor</label><div class="row" id="tColors">${COLORS.map(c => `<button type="button" class="sw" data-color="${c}" style="background:${c}" aria-label="Cor ${c}" aria-pressed="${d.c === c}"></button>`).join("")}</div>
      <label>Tamanho</label><div class="seg" id="tSize">${[
        [1, "1 casa"],
        [2, "2"],
        [3, "3"],
        [4, "4"],
      ]
        .map(([v, l]) => `<button data-sz="${v}" aria-pressed="${(d.s || 1) === v}">${l}</button>`)
        .join("")}</div>
      <label class="chk" style="margin-top:12px"><input type="checkbox" id="tSnap" ${d.sn ? "checked" : ""}> Agarrar ao grid</label>
      <label for="tSp">Deslocamento por movimento</label><div class="unitin"><input type="number" id="tSp" min="0" step="0.5" value="${d.sp == null ? 9 : d.sp}"><span>${esc(G().unitName)} · 0 = sem limite (vale para o jogador)</span></div>
      <label for="tDir">Direção</label>
      <select id="tDir">${DIRS.map(([k, l]) => `<option value="${k}" ${(d.dir || "none") === k ? "selected" : ""}>${l}</option>`).join("")}</select>
      <div class="dirpad" id="tAng" aria-label="Para onde o token olha">${ARROWS.map(([a, l]) => (a == null ? `<span>${l}</span>` : `<button type="button" data-ang="${a}" aria-pressed="${(d.a || 0) === a}" aria-label="Olhar para ${a} graus">${l}</button>`)).join("")}</div>
      <p class="hint">No mapa: selecione o token e use Q / E para girar.</p>
      <label>Barrinhas (atual / máximo)</label>
      ${d.b.map((b, i) => `<div class="barrow"><span>${i + 1}</span><input type="text" inputmode="numeric" data-bv="${i}" value="${esc(b.v)}" aria-label="Barrinha ${i + 1} valor"><em>/</em><input type="text" inputmode="numeric" data-bm="${i}" value="${esc(b.m)}" aria-label="Barrinha ${i + 1} máximo"><input type="color" data-bc="${i}" value="${b.c}" aria-label="Cor da barrinha ${i + 1}"></div>`).join("")}
      <label class="chk"><input type="checkbox" id="tBv" ${d.bv !== false ? "checked" : ""}> Jogadores veem as barrinhas</label>
      <label class="chk" style="margin-top:6px"><input type="checkbox" id="tHide" ${d.h ? "checked" : ""}> Token oculto dos jogadores</label>
    </section>

    <section data-pane="aura" hidden>
      <label class="chk big"><input type="checkbox" id="aOn" ${d.au.on ? "checked" : ""}> Possui aura</label>
      <label for="aF">Formato</label>
      <select id="aF"><option value="circle" ${d.au.f === "circle" ? "selected" : ""}>Círculo perfeito</option><option value="square" ${d.au.f === "square" ? "selected" : ""}>Quadrado</option><option value="cells" ${d.au.f === "cells" ? "selected" : ""}>Casas da grid</option></select>
      <label for="aD">Diâmetro</label><div class="unitin"><input type="number" id="aD" min="0" step="0.5" value="${d.au.d}"><span>${esc(G().unitName)}</span></div>
      <label for="aC">Cor da aura</label><input type="color" id="aC" value="${d.au.c}" class="wide">
      <p class="hint">Ex.: luz de tocha, área de medo, alcance de magia.</p>
    </section>

    <section data-pane="vis" hidden>
      <div class="sub-h">Visão do token</div>
      <label class="chk big"><input type="checkbox" id="vOn" ${d.vi.on ? "checked" : ""}> Possui visão</label>
      <div class="grid3">
        <label for="vRb">Sob luz intensa</label><input type="number" id="vRb" min="0" step="0.5" value="${d.vi.rb}"><span>${esc(G().unitName)}</span>
        <label for="vRd">Sob luz fraca</label><input type="number" id="vRd" min="0" step="0.5" value="${d.vi.rd}"><span>${esc(G().unitName)}</span>
        <label for="vRk">Na escuridão</label><input type="number" id="vRk" min="0" step="0.5" value="${d.vi.rk}"><span>${esc(G().unitName)}</span>
        <label for="vAng">Ângulo</label><input type="number" id="vAng" min="10" max="360" step="5" value="${d.vi.ang}"><span>graus</span>
      </div>
      <div class="sub-h">Luz emitida</div>
      <div class="grid3">
        <label for="lRb">Luz intensa</label><input type="number" id="lRb" min="0" step="0.5" value="${d.li.rb}"><span>${esc(G().unitName)}</span>
        <label for="lRd">Luz fraca</label><input type="number" id="lRd" min="0" step="0.5" value="${d.li.rd}"><span>${esc(G().unitName)}</span>
        <label for="lAng">Ângulo</label><input type="number" id="lAng" min="10" max="360" step="5" value="${d.li.ang}"><span>graus</span>
      </div>
      <div class="row" style="margin-top:10px" id="lPre"><button type="button" class="btn small" data-lp="6,6">🔥 Tocha</button><button type="button" class="btn small" data-lp="9,9">🏮 Lanterna</button><button type="button" class="btn small" data-lp="12,12">✨ Luz (magia)</button><button type="button" class="btn small" data-lp="0,0">Apagar</button></div>
      <p class="hint">Como a visão humana: o jogador só enxerga o que está iluminado (ou o que a visão no escuro alcança) e que as paredes não tapam. Ângulo 360 = em volta; menor = cone para a frente do token. A luz do mapa (Dia / Penumbra / Escuro) fica no topo da tela.</p>
    </section>

    <section data-pane="img" hidden>
      <label for="tImg">Imagem (link)</label>
      <div style="display:flex;gap:6px"><input type="url" id="tImg" placeholder="https://… .png" value="${esc(d.img || "")}"><label class="btn small" style="margin:0;color:var(--ink)">Arquivo<input type="file" id="tFile" accept="image/*" hidden></label></div>
      <label for="tIz">Zoom da imagem: <b id="tIzv">${Math.round((d.iz || 1) * 100)}%</b></label><input type="range" id="tIz" min="0.6" max="2.5" step="0.05" value="${d.iz || 1}">
      <div class="tokprev"><canvas id="tPrev" width="120" height="120"></canvas></div>
      ${d.img ? `<button class="btn small danger" id="tImgDel">Tirar imagem</button>` : ""}
    </section>

    <div class="acts foot">${isNew ? "" : `<button class="btn small" id="tDup">Duplicar</button><button class="btn small danger" id="tDel">Remover</button>`}<span class="spacer"></span><button class="btn small" id="tMine" title="Guarda este token para reusar depois (na Lista de tokens)">☆ Salvar em Meus Tokens</button><button class="btn" id="tCancel">Cancelar</button><button class="btn primary" id="tSave">${isNew ? "Colocar" : "Ok"}</button></div>
  </div>`;
  const P = $("#panel");
  const showTab = k => {
    tab = k;
    P.querySelectorAll("[data-tab]").forEach(b => b.setAttribute("aria-selected", b.dataset.tab === k));
    P.querySelectorAll("[data-pane]").forEach(x => (x.hidden = x.dataset.pane !== k));
    if (k === "img") prev();
  };
  P.querySelector(".tabs").onclick = e => {
    const b = e.target.closest("[data-tab]");
    if (b) showTab(b.dataset.tab);
  };
  const press = (box, sel, el) =>
    box.querySelectorAll(sel).forEach(x => x.setAttribute("aria-pressed", x === el));
  $("#tOwner").onchange = e => {
    $("#tOwnerTxt").hidden = e.target.value !== "__other";
    if (e.target.value === "__other") $("#tOwnerTxt").focus();
  };
  $("#tColors").onclick = e => {
    const b = e.target.closest("[data-color]");
    if (b) {
      d.c = b.dataset.color;
      press($("#tColors"), "[data-color]", b);
      prev();
    }
  };
  $("#tSize").onclick = e => {
    const b = e.target.closest("[data-sz]");
    if (b) {
      d.s = +b.dataset.sz;
      press($("#tSize"), "[data-sz]", b);
    }
  };
  $("#tAng").onclick = e => {
    const b = e.target.closest("[data-ang]");
    if (b) {
      d.a = +b.dataset.ang;
      press($("#tAng"), "[data-ang]", b);
      if ($("#tDir").value === "none" && !$("#vOn").checked) $("#tDir").value = "arrow";
      prev();
    }
  };
  $("#lPre").onclick = e => {
    const b = e.target.closest("[data-lp]");
    if (!b) return;
    const [rb, rd] = b.dataset.lp.split(",");
    $("#lRb").value = rb;
    $("#lRd").value = rd;
  };
  $("#tIz").oninput = e => {
    d.iz = +e.target.value;
    $("#tIzv").textContent = Math.round(d.iz * 100) + "%";
    prev();
  };
  $("#tImg").onchange = () => prev();
  $("#tFile").onchange = async e => {
    const f = e.target.files[0];
    if (!f) return;
    toast("Enviando imagem…");
    try {
      $("#tImg").value = await uploadImage(f, "tokens");
      toast("Imagem pronta.");
      prev();
    } catch (err) {
      toast("Não enviei: " + err.message);
    }
  };
  const del = $("#tImgDel");
  if (del)
    del.onclick = () => {
      $("#tImg").value = "";
      prev();
    };
  function prev() {
    const c = $("#tPrev");
    if (!c || P.querySelector('[data-pane="img"]').hidden) return;
    const x = c.getContext("2d"),
      url = $("#tImg").value.trim(),
      im = getImg(url);
    x.clearRect(0, 0, 120, 120);
    x.beginPath();
    x.arc(60, 60, 54, 0, Math.PI * 2);
    x.fillStyle = d.c;
    x.fill();
    if (im) {
      x.save();
      x.beginPath();
      x.arc(60, 60, 47, 0, Math.PI * 2);
      x.clip();
      x.translate(60, 60);
      if ($("#tDir").value === "rotate") x.rotate(((d.a || 0) * Math.PI) / 180);
      const s = Math.max(108 / im.naturalWidth, 108 / im.naturalHeight) * 0.86 * (d.iz || 1);
      x.drawImage(
        im,
        (-im.naturalWidth * s) / 2,
        (-im.naturalHeight * s) / 2,
        im.naturalWidth * s,
        im.naturalHeight * s,
      );
      x.restore();
    } else if (url) setTimeout(prev, 300);
    x.lineWidth = 5;
    x.strokeStyle = "rgba(0,0,0,.5)";
    x.beginPath();
    x.arc(60, 60, 54, 0, Math.PI * 2);
    x.stroke();
  }
  $("#tName").focus();
  $("#tName").onkeydown = e => {
    if (e.key === "Enter") $("#tSave").click();
  };
  $("#tCancel").onclick = closePanel;
  $("#tMine").onclick = () => {
    const keep = {
      n: $("#tName").value.trim() || d.n || "Token",
      c: d.c,
      s: d.s || 1,
      img: $("#tImg").value.trim() || null,
      b: d.b,
      bv: d.bv,
      au: d.au,
      vi: d.vi,
      li: d.li,
      sp: d.sp,
      dir: d.dir,
      sn: d.sn,
    };
    myTokens.push(keep);
    saveMyTokens();
    toast(`“${keep.n}” salvo em Meus Tokens.`);
  };
  const numv = sel => Math.max(0, parseFloat(String($(sel).value).replace(",", ".")) || 0);
  const num = v => {
    const n = String(v).trim().replace(",", ".");
    return n === "" ? "" : isNaN(+n) ? n.slice(0, 6) : +n;
  };
  $("#tSave").onclick = () => {
    const ow = $("#tOwner").value === "__other" ? $("#tOwnerTxt").value.trim() : $("#tOwner").value;
    const vals = {
      n: $("#tName").value.trim(),
      c: d.c,
      s: d.s || 1,
      o: ow || null,
      sn: $("#tSnap").checked,
      sp: Math.max(0, parseFloat(String($("#tSp").value).replace(",", ".")) || 0),
      dir: $("#tDir").value,
      a: d.a || 0,
      b: d.b.map((b, i) => ({
        v: num(P.querySelector(`[data-bv="${i}"]`).value),
        m: num(P.querySelector(`[data-bm="${i}"]`).value),
        c: P.querySelector(`[data-bc="${i}"]`).value,
      })),
      bv: $("#tBv").checked,
      h: $("#tHide").checked,
      au: {
        on: $("#aOn").checked,
        f: $("#aF").value,
        d: Math.max(0, parseFloat(String($("#aD").value).replace(",", ".")) || 0),
        c: $("#aC").value,
      },
      vi: {
        on: $("#vOn").checked,
        rb: numv("#vRb"),
        rd: numv("#vRd"),
        rk: numv("#vRk"),
        ang: Math.min(360, Math.max(10, numv("#vAng") || 360)),
      },
      li: { rb: numv("#lRb"), rd: numv("#lRd"), ang: Math.min(360, Math.max(10, numv("#lAng") || 360)) },
      img: $("#tImg").value.trim() || null,
      iz: d.iz || 1,
    };
    if (isNew) {
      const [wx, wy] = placeAt();
      const off = 0;
      const [x, y] = vals.sn ? snapPoint(wx + off, wy, vals.s) : [Math.round(wx + off), Math.round(wy)];
      const nt = { id: uid(), ...vals, x, y };
      tokens.push(nt);
      selTok = nt.id;
    } else {
      const cur = tokens.find(x => x.id === t.id); // o mapa pode ter recarregado enquanto a janela estava aberta
      if (!cur) {
        toast("Esse token foi removido do mapa.");
        closePanel();
        return;
      }
      Object.assign(cur, vals);
      if (vals.sn) {
        const [x, y] = snapPoint(cur.x, cur.y, vals.s);
        cur.x = x;
        cur.y = y;
      }
    }
    save("tokens");
    dirty = true;
    drawEmpty();
    closePanel();
  };
  if (!isNew) {
    $("#tDel").onclick = () => {
      tokens = tokens.filter(x => x.id !== t.id);
      selTok = null;
      save("tokens");
      dirty = true;
      closePanel();
    };
    $("#tDup").onclick = () => {
      t = tokens.find(x => x.id === t.id) || t;
      const c = JSON.parse(JSON.stringify(t));
      c.id = uid();
      c.n = t.n.replace(/(\d+)$/, m => String(+m + 1));
      if (c.n === t.n) c.n = (t.n || "Token") + " 2";
      const [x, y] = snapPoint(t.x + G().size * (t.s || 1), t.y, t.s || 1);
      c.x = x;
      c.y = y;
      tokens.push(c);
      selTok = c.id;
      save("tokens");
      dirty = true;
      closePanel();
    };
  }
}

function askNick() {
  return new Promise(ok => {
    $("#gate").innerHTML =
      `<form id="nickForm" style="display:flex;flex-direction:column;gap:10px;align-items:center"><b style="font:700 26px/1 var(--display);color:var(--brass)">Qual é o seu nome na mesa?</b>
      <span>O mestre usa esse nome para te dar o controle do seu personagem.</span>
      <input id="nickIn" maxlength="30" required style="background:var(--bg2);border:1px solid var(--line);border-radius:8px;padding:10px 12px;min-width:240px;text-align:center" placeholder="Seu nome">
      <button class="btn primary">Entrar no mapa</button></form>`;
    $("#nickIn").focus();
    $("#nickForm").onsubmit = e => {
      e.preventDefault();
      myNick = $("#nickIn").value.trim().slice(0, 30);
      try {
        localStorage.setItem("mesa.nick", myNick);
      } catch {}
      ok();
    };
  });
}

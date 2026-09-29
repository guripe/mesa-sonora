"use strict";
// ---------- anotações e mapas para os jogadores (o mestre libera) + popup na tela ----------
// guardado na linha 998 do map_state (coluna drawings): [{id, cat: "mapa"|"nota"|"imagem", t, body, url, vis, at}]
const HD_ROW = 998,
  HCAT = { mapa: ["🗺", "Mapa"], nota: ["📜", "Nota"], imagem: ["🖼", "Imagem"] };
let hand = null,
  handTab = "all",
  handQ = "",
  handEdit = null;
let myNotes = (() => {
  try {
    return JSON.parse(localStorage.getItem("mesa.mynotes")) || [];
  } catch {
    return [];
  }
})();
const saveMyNotes = () => {
  try {
    localStorage.setItem("mesa.mynotes", JSON.stringify(myNotes));
  } catch {}
};
async function handLoad() {
  const { data, error } = await sb.from("map_state").select("drawings").eq("id", HD_ROW).maybeSingle();
  if (error) {
    toast("Não carreguei as anotações: " + error.message);
    hand = hand || [];
    return;
  }
  hand = Array.isArray(data?.drawings) ? data.drawings : [];
}
async function handSave() {
  const { error } = await sb
    .from("map_state")
    .upsert({ id: HD_ROW, drawings: hand, updated_at: new Date().toISOString() });
  if (error) return toast("Não salvei: " + error.message);
  send("hand", { v: Date.now() });
}
const handVisible = () => (hand || []).filter(h => isGM || h.vis);
function handRow(h) {
  const [ic, nm] = HCAT[h.cat] || HCAT.nota;
  return `<div class="hrow ${h.vis ? "vis" : ""}" data-hid="${esc(h.id)}">
    <button class="hmain" data-hopen="${esc(h.id)}">${h.url ? `<span class="hthumb"><img src="${esc(h.url)}" alt="" loading="lazy"></span>` : `<span class="hthumb ic">${ic}</span>`}<span class="hname"><b>${esc(h.t || nm)}</b><small>${nm}${isGM ? (h.vis ? " · <span class='hv'>jogadores veem</span>" : " · só você") : ""}</small></span></button>
    ${isGM ? `<button class="btn small ic" data-hvis="${esc(h.id)}" title="${h.vis ? "Esconder dos jogadores" : "Liberar para os jogadores"}" aria-label="Visibilidade">${h.vis ? "👁" : "🔒"}</button><button class="btn small ic" data-hpop="${esc(h.id)}" title="Mostrar agora na tela dos jogadores" aria-label="Mostrar na tela">📢</button><button class="btn small ic" data-hedit="${esc(h.id)}" title="Editar" aria-label="Editar">✎</button>` : ""}</div>`;
}
async function openHandPanel(tab) {
  panelKind = "hand";
  if (tab) handTab = tab;
  if (!hand) {
    $("#panel").innerHTML =
      `<div class="panel hand-panel"><h3>${isGM ? "Anotações" : "Diário"} <button class="btn small" id="pClose">Fechar</button></h3><p class="hint">Carregando…</p></div>`;
    $("#pClose").onclick = closePanel;
    await handLoad();
    if (panelKind !== "hand") return;
  }
  const tabs = isGM
    ? [
        ["all", "Tudo"],
        ["mapa", "🗺 Mapas"],
        ["nota", "📜 Notas"],
        ["imagem", "🖼 Imagens"],
      ]
    : [
        ["mapa", "🗺 Mapas"],
        ["nota", "📜 Anotações"],
        ["mine", "✍ Minhas notas"],
      ];
  if (!tabs.some(t => t[0] === handTab)) handTab = tabs[0][0];
  const q = norm(handQ),
    list = handVisible()
      .filter(
        h =>
          (handTab === "all" || h.cat === handTab || (!isGM && handTab === "nota" && h.cat === "imagem")) &&
          (!q || norm(h.t + " " + (h.body || "")).includes(q)),
      )
      .sort((a, b) => (b.at || 0) - (a.at || 0));
  const peers = [...new Set(peersOnMap)].filter(n => n);
  $("#panel").innerHTML =
    `<div class="panel hand-panel" role="dialog" aria-label="${isGM ? "Anotações" : "Diário"}"><h3>${isGM ? "Anotações e arquivos" : "Diário do grupo"} <button class="btn small" id="pClose">Fechar</button></h3>
    <div class="seg htabs" id="hTabs">${tabs.map(([k, l]) => `<button data-htab="${k}" aria-pressed="${handTab === k}">${l}</button>`).join("")}</div>
    ${
      handTab === "mine"
        ? `<p class="hint">Só você vê estas notas (ficam neste computador).</p>
      <div class="hlist">${myNotes.map((n, i) => `<div class="mynote"><input type="text" data-mnt="${i}" value="${esc(n.t)}" placeholder="Título" maxlength="60"><textarea data-mnb="${i}" rows="4" placeholder="Escreva aqui…">${esc(n.body)}</textarea><button class="btn small danger" data-mndel="${i}">Apagar</button></div>`).join("") || `<p class="hint">Nenhuma nota ainda.</p>`}</div>
      <div class="acts"><button class="btn small primary" id="mnAdd">＋ Nova nota</button></div>`
        : `<input type="search" id="hQ" placeholder="Procurar…" value="${esc(handQ)}">
      ${
        isGM
          ? `<div class="acts" style="margin:8px 0"><button class="btn small primary" id="hNewNote">＋ Nota</button><button class="btn small" id="hNewImg">＋ Mapa ou imagem</button></div>
        <details class="hquick"><summary>📢 Mensagem rápida na tela dos jogadores</summary><textarea id="hqTxt" rows="3" placeholder="Ex.: Vocês ouvem passos vindo do corredor…"></textarea>
          <div class="acts"><select id="hqTo"><option value="*">Todos</option>${peers.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join("")}</select><button class="btn small primary" id="hqSend">Mostrar na tela</button></div></details>`
          : ""
      }
      <div class="hlist">${list.map(handRow).join("") || `<p class="hint">${isGM ? "Nada ainda. Crie notas, suba mapas e imagens; depois libere (👁) ou mostre na tela (📢)." : "O mestre ainda não liberou nada aqui."}</p>`}</div>`
    }</div>`;
  $("#pClose").onclick = closePanel;
  $("#hTabs").onclick = e => {
    const b = e.target.closest("[data-htab]");
    if (b) {
      handTab = b.dataset.htab;
      openHandPanel();
    }
  };
  const hq = $("#hQ");
  if (hq)
    hq.oninput = () => {
      handQ = hq.value;
      const pos = hq.selectionStart;
      openHandPanel().then(() => {
        const n = $("#hQ");
        if (n) {
          n.focus();
          n.setSelectionRange(pos, pos);
        }
      });
    };
  if (handTab === "mine") {
    $("#mnAdd").onclick = () => {
      myNotes.unshift({ t: "", body: "" });
      saveMyNotes();
      openHandPanel();
      setTimeout(() => $("[data-mnt='0']")?.focus(), 30);
    };
    $("#panel").oninput = e => {
      const t = e.target;
      if (t.dataset.mnt != null) myNotes[+t.dataset.mnt].t = t.value;
      else if (t.dataset.mnb != null) myNotes[+t.dataset.mnb].body = t.value;
      else return;
      saveMyNotes();
    };
    $("#panel").onclick = e => {
      const b = e.target.closest("[data-mndel]");
      if (b && confirm("Apagar esta nota?")) {
        myNotes.splice(+b.dataset.mndel, 1);
        saveMyNotes();
        openHandPanel();
      }
    };
    return;
  }
  $("#panel").oninput = null;
  if (isGM) {
    $("#hNewNote").onclick = () =>
      handEditor({ id: uid(), cat: "nota", t: "", body: "", url: "", vis: false });
    $("#hNewImg").onclick = () =>
      handEditor({ id: uid(), cat: "mapa", t: "", body: "", url: "", vis: false });
    $("#hqSend").onclick = () => {
      const txt = $("#hqTxt").value.trim();
      if (!txt) return;
      const to = $("#hqTo").value;
      send("pop", { to, item: { t: "Mestre", body: txt } });
      toast(to === "*" ? "Mostrado na tela de todos." : `Mostrado na tela de ${to}.`);
      $("#hqTxt").value = "";
    };
  }
  $("#panel").onclick = async e => {
    const b = e.target.closest("button");
    if (!b) return;
    const d = b.dataset,
      h = (hand || []).find(x => x.id === (d.hopen || d.hvis || d.hpop || d.hedit));
    if (d.hopen && h) showHandout(h, false);
    else if (d.hvis && h) {
      h.vis = !h.vis;
      await handSave();
      openHandPanel();
      toast(h.vis ? "Liberado para os jogadores." : "Escondido dos jogadores.");
    } else if (d.hpop && h) popChooser(h);
    else if (d.hedit && h) handEditor({ ...h });
  };
}
function popChooser(h) {
  // escolhe para quem mostrar
  const peers = [...new Set(peersOnMap)].filter(n => n);
  if (!peers.length) {
    send("pop", { to: "*", item: h });
    return toast("Mostrado na tela de todos.");
  }
  const box = document.createElement("div");
  box.className = "hpopchoose";
  box.innerHTML = `<div class="panel" style="position:static;width:auto"><b>Mostrar “${esc(h.t || "item")}” para:</b><div class="acts" style="margin-top:8px;flex-wrap:wrap"><button class="btn small primary" data-to="*">Todos</button>${peers.map(n => `<button class="btn small" data-to="${esc(n)}">${esc(n)}</button>`).join("")}<button class="btn small" data-to="">Cancelar</button></div>${h.vis ? "" : `<label class="chk" style="margin-top:8px"><input type="checkbox" id="hpKeep"> Também deixar liberado no diário</label>`}</div>`;
  document.body.appendChild(box);
  box.onclick = async e => {
    const b = e.target.closest("[data-to]");
    if (!b) {
      if (e.target === box) box.remove();
      return;
    }
    const to = b.dataset.to;
    const keep = $("#hpKeep", box)?.checked;
    box.remove();
    if (!to) return;
    if (keep) {
      h.vis = true;
      await handSave();
      if (panelKind === "hand") openHandPanel();
    }
    send("pop", { to, item: { t: h.t, body: h.body, url: h.url, cat: h.cat } });
    toast(to === "*" ? "Mostrado na tela de todos." : `Mostrado na tela de ${to}.`);
  };
}
function handEditor(h) {
  panelKind = "hand";
  const isNew = !(hand || []).some(x => x.id === h.id);
  $("#panel").innerHTML =
    `<div class="panel hand-panel" role="dialog" aria-label="Editar"><h3>${isNew ? "Novo" : "Editar"} <button class="btn small" id="pClose">Voltar</button></h3>
    <div class="seg" id="heCat">${Object.entries(HCAT)
      .map(([k, [ic, nm]]) => `<button data-hc="${k}" aria-pressed="${h.cat === k}">${ic} ${nm}</button>`)
      .join("")}</div>
    <label for="heT">Título</label><input type="text" id="heT" maxlength="80" value="${esc(h.t)}" placeholder="${h.cat === "mapa" ? "Ex.: Mapa do Reino" : "Ex.: Carta do barão"}">
    <label>Imagem (opcional para notas)</label>
    <div class="heimg">${h.url ? `<img src="${esc(h.url)}" alt="">` : `<span>Arraste uma imagem aqui ou escolha um arquivo</span>`}</div>
    <div class="acts"><label class="btn small" style="margin:0">Arquivo…<input type="file" id="heFile" accept="image/*" hidden></label><input type="url" id="heUrl" placeholder="ou cole um link" value="${esc(h.url || "")}" style="flex:1">${h.url ? `<button class="btn small" id="heNoImg">Tirar</button>` : ""}</div>
    <label for="heB">Texto</label><textarea id="heB" rows="7" placeholder="Anotações, descrição, carta, pista…">${esc(h.body || "")}</textarea>
    <label class="chk" style="margin-top:10px"><input type="checkbox" id="heVis" ${h.vis ? "checked" : ""}> Jogadores podem ver no diário</label>
    <div class="acts foot">${isNew ? "" : `<button class="btn small danger" id="heDel">Apagar</button>`}<span class="spacer"></span><button class="btn" id="heCancel">Cancelar</button><button class="btn primary" id="heSave">Salvar</button></div></div>`;
  const back = () => openHandPanel();
  $("#pClose").onclick = $("#heCancel").onclick = back;
  const keep = () => {
    h.t = $("#heT").value;
    h.body = $("#heB").value;
    h.url = $("#heUrl").value.trim();
    h.vis = $("#heVis").checked;
  };
  $("#heCat").onclick = e => {
    const b = e.target.closest("[data-hc]");
    if (b) {
      keep();
      h.cat = b.dataset.hc;
      handEditor(h);
    }
  };
  const up = async f => {
    if (!f || !f.type.startsWith("image/")) return;
    keep();
    toast("Enviando…");
    try {
      h.url = await uploadImage(f, "handouts");
      if (!h.t) h.t = f.name.replace(/\.\w+$/, "").slice(0, 80);
      handEditor(h);
      toast("Imagem pronta.");
    } catch (err) {
      toast("Não enviei: " + err.message);
    }
  };
  $("#heFile").onchange = e => up(e.target.files[0]);
  const zone = $(".heimg");
  zone.ondragover = e => {
    e.preventDefault();
    zone.classList.add("over");
  };
  zone.ondragleave = () => zone.classList.remove("over");
  zone.ondrop = e => {
    e.preventDefault();
    zone.classList.remove("over");
    up([...e.dataTransfer.files][0]);
  };
  if ($("#heNoImg"))
    $("#heNoImg").onclick = () => {
      keep();
      h.url = "";
      handEditor(h);
    };
  $("#heUrl").onchange = () => {
    keep();
    setTimeout(() => handEditor(h), 0);
  };
  $("#heSave").onclick = async () => {
    keep();
    if (!h.t && !h.body && !h.url) return toast("Escreva algo ou coloque uma imagem.");
    h.at = Date.now();
    hand = (hand || []).filter(x => x.id !== h.id).concat([h]);
    await handSave();
    back();
  };
  if ($("#heDel"))
    $("#heDel").onclick = async () => {
      if (!confirm("Apagar este item?")) return;
      hand = hand.filter(x => x.id !== h.id);
      await handSave();
      back();
    };
}
function showHandout(h, pushed) {
  // janela grande: imagem com zoom e texto
  const ov = document.createElement("div");
  ov.className = "hview" + (pushed ? " pushed" : "");
  ov.innerHTML = `<div class="hvbox" role="dialog" aria-label="${esc(h.t || "Mensagem")}">
    <div class="hvhead"><b>${pushed ? "📢 " : ""}${esc(h.t || "Mensagem do mestre")}</b><span class="spacer"></span>${h.url ? `<button class="btn small" data-z="-1">－</button><button class="btn small" data-z="0">Ajustar</button><button class="btn small" data-z="1">＋</button><a class="btn small" href="${esc(h.url)}" target="_blank" rel="noopener">Abrir</a>` : ""}<button class="btn small primary" data-close>Fechar</button></div>
    ${h.url ? `<div class="hvimg"><img src="${esc(h.url)}" alt="" draggable="false"></div>` : ""}
    ${h.body ? `<div class="hvtxt">${esc(h.body).replace(/\n/g, "<br>")}</div>` : ""}</div>`;
  document.body.appendChild(ov);
  const close = () => ov.remove();
  ov.addEventListener("click", e => {
    if (e.target === ov || e.target.closest("[data-close]")) close();
  });
  const onKey = e => {
    if (e.key === "Escape") {
      close();
      removeEventListener("keydown", onKey, true);
      e.stopPropagation();
    }
  };
  addEventListener("keydown", onKey, true);
  const box = $(".hvimg", ov),
    img = box && $("img", box);
  if (img) {
    // zoom com a roda e arrastar para mover
    let z = 1,
      x = 0,
      y = 0,
      dr = null;
    const ap = () => (img.style.transform = `translate(${x}px,${y}px) scale(${z})`);
    box.onwheel = e => {
      e.preventDefault();
      z = Math.max(0.3, Math.min(8, z * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
      ap();
    };
    box.onpointerdown = e => {
      dr = [e.clientX - x, e.clientY - y];
      box.setPointerCapture(e.pointerId);
    };
    box.onpointermove = e => {
      if (dr) {
        x = e.clientX - dr[0];
        y = e.clientY - dr[1];
        ap();
      }
    };
    box.onpointerup = () => (dr = null);
    ov.querySelectorAll("[data-z]").forEach(
      b =>
        (b.onclick = () => {
          const k = +b.dataset.z;
          if (!k) {
            z = 1;
            x = y = 0;
          } else z = Math.max(0.3, Math.min(8, z * (k > 0 ? 1.3 : 1 / 1.3)));
          ap();
        }),
    );
  }
  if (pushed && DS.init()) {
    const t = DS.ctx.currentTime;
    DS.tone(t, 660, 0.25, 0.12, "sine");
    DS.tone(t + 0.12, 990, 0.35, 0.1, "sine");
  }
}

"use strict";
// ---------- bestiário: criaturas prontas para colocar no mapa, com ficha de monstro editável ----------
// O token guarda a ficha em t.st = {cr, xp, ca, at: [6], atk: [{n, h, d, t}], tr, pvd, cat, src}. Modelos do mestre: linha 995 (coluna drawings).
const BS_ROW = 995;
let bstMine = null, bstQ = "", bstCat = "", bstSel = null, bstQty = 1, bstRoll = false, bstHide = false, bstIni = false;
const bstObj = r => ({ id: r[0], n: r[1], cat: r[2], cr: r[3], ca: r[4], pv: r[5], pvd: r[6], sp: r[7], at: r[8].slice(), s: r[9], em: r[10], atk: r[11].map(a => ({ n: a[0], h: a[1], d: a[2], t: a[3] })), tr: r[12], xp: CR_XP[r[3]] ?? 0 });
const bstAll = () => [...(bstMine || []).map(m => ({ ...m, cat: "meus" })), ...BST.map(bstObj)];
const bstCatInfo = k => (k === "meus" ? ["meus", "Meus modelos", "#b8904e"] : BST_CATS.find(c => c[0] === k) || ["", "", "#8a2a2a"]);
async function bstLoad() {
  const { data, error } = await sb.from("map_state").select("drawings").eq("id", BS_ROW).maybeSingle();
  bstMine = !error && Array.isArray(data?.drawings) ? data.drawings : [];
}
async function bstSaveMine() {
  const { error } = await sb.from("map_state").upsert({ id: BS_ROW, drawings: bstMine, updated_at: new Date().toISOString() });
  if (error) toast("Não salvei o modelo: " + error.message);
}
const mod5 = v => Math.floor(((+v || 10) - 10) / 2);
function avgDice(f) { // "2d8+2" -> média arredondada para baixo
  let tot = 0, ok = false;
  String(f || "").replace(/\s/g, "").replace(/([+-]?)(\d*)d(\d+)|([+-]?)(\d+)/g, (m, s1, n, x, s2, c) => {
    ok = true;
    if (x) tot += (s1 === "-" ? -1 : 1) * (+n || 1) * ((+x + 1) / 2); else tot += (s2 === "-" ? -1 : 1) * +c;
    return m;
  });
  return ok ? Math.max(1, Math.floor(tot)) : 1;
}
function bstToken(m, x, y, o = {}) {
  let pv = +m.pv || 1;
  if (o.roll && m.pvd) { try { pv = Math.max(1, rollFormula(m.pvd).total); } catch {} }
  const same = tokens.filter(t => t.st?.src === m.id).length, name = same ? `${m.n} ${same + 1}` : m.n;
  const [sx, sy] = snapPoint(x, y, m.s || 1);
  const t = { id: uid(), n: name, c: bstCatInfo(m.cat)[2], s: m.s || 1, x: sx, y: sy, a: 180, sn: true, sp: +m.sp || 0, em: m.em || "", h: !!o.hide,
    b: [{ n: "PV", v: pv, m: pv, c: "#c0473a" }],
    st: { cr: m.cr, xp: +m.xp || 0, ca: +m.ca || 10, at: (m.at || []).slice(0, 6), atk: (m.atk || []).map(a => ({ ...a })), tr: m.tr || "", pvd: m.pvd || "", cat: m.cat, src: m.id } };
  tokens.push(t);
  return t;
}
function bstPlace(m, wx, wy, n = 1) {
  if (!m) return;
  const g = G().size, cols = Math.ceil(Math.sqrt(n)), step = (m.s || 1) * g, made = [];
  for (let i = 0; i < n; i++) {
    const t = bstToken(m, wx + ((i % cols) - (cols - 1) / 2) * step, wy + (Math.floor(i / cols) - (Math.ceil(n / cols) - 1) / 2) * step, { roll: bstRoll, hide: bstHide });
    made.push(t);
  }
  if (bstIni) { for (const t of made) iniAdd(t); iniSave(); }
  selTok = made[made.length - 1].id;
  save("tokens"); dirty = true;
  toast(`${m.em || "🐾"} ${n > 1 ? n + "× " : ""}${m.n} no mapa${bstHide ? " (oculto dos jogadores)" : ""}. Clique no token → 📜 Ficha para ver e editar os status.`, 3200);
}
function bstStatHTML(m) {
  const at = m.at || [];
  return `<div class="bs-stat"><div class="bs-line"><b>CA</b> ${m.ca} · <b>PV</b> ${m.pv}${m.pvd ? ` (${esc(m.pvd)})` : ""} · <b>Desloc.</b> ${String(m.sp).replace(".", ",")} m · <b>ND</b> ${crTxt(m.cr)} (${(m.xp || 0).toLocaleString("pt-BR")} XP)</div>
    <div class="bs-attrs">${ATTRS.map(([k, n, s], i) => `<span><small>${s}</small>${at[i] ?? 10} <i>(${sgn(mod5(at[i]))})</i></span>`).join("")}</div>
    ${(m.atk || []).map(a => `<div class="bs-atk">⚔️ <b>${esc(a.n)}</b>${a.h ? ` ${sgn(+a.h)}` : ""} · ${esc(a.d)} ${esc(a.t)}</div>`).join("")}
    ${m.tr ? `<div class="bs-tr">${esc(m.tr)}</div>` : ""}</div>`;
}
async function openBstPanel() {
  panelKind = "bst";
  if (!bstMine) await bstLoad();
  if (panelKind !== "bst") return;
  const q = bstQ.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const norm = s => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const list = bstAll().filter(m => (!bstCat || m.cat === bstCat) && (!q || norm(m.n).includes(q))).sort((a, b) => (a.cat === "meus" ? -1 : 0) - (b.cat === "meus" ? -1 : 0) || a.cr - b.cr || a.n.localeCompare(b.n, "pt"));
  const cats = [...(bstMine?.length ? [["meus", "Meus modelos"]] : []), ...BST_CATS.map(c => [c[0], c[1]])];
  $("#panel").innerHTML = `<div class="panel bst-panel" role="dialog" aria-label="Bestiário"><h3>🐉 Bestiário<button class="btn small" id="pClose">Fechar</button></h3>
    <input id="bstQ" class="bst-q" placeholder="Buscar: goblin, lobo, dragão…" value="${esc(bstQ)}" autocomplete="off">
    <div class="bst-cats"><button data-bc="" aria-pressed="${!bstCat}">Todos</button>${cats.map(([k, l]) => `<button data-bc="${k}" aria-pressed="${bstCat === k}">${esc(l)}</button>`).join("")}</div>
    <div class="bst-list">${list.map(m => `<div class="bst-row ${bstSel === m.id ? "on" : ""}" data-bst="${esc(m.id)}" data-bsel="${esc(m.id)}" title="Clique para ver · arraste para o mapa">
        <span class="bst-em" style="--pc:${bstCatInfo(m.cat)[2]}">${esc(m.em || "🐾")}</span><span class="bst-n"><b>${esc(m.n)}</b><small>ND ${crTxt(m.cr)} · ${(m.xp || 0).toLocaleString("pt-BR")} XP</small></span><span class="bst-q2">🛡${m.ca} ❤${m.pv}</span></div>
        ${bstSel === m.id ? `<div class="bst-det">${bstStatHTML(m)}
          <div class="bst-opts"><label>Quantos <input id="bstN" type="number" min="1" max="20" value="${bstQty}" style="width:52px"></label>
            <label class="chk" title="Cada um rola a vida (${esc(m.pvd || "")}) em vez de usar a média"><input type="checkbox" id="bstRoll" ${bstRoll ? "checked" : ""}> Rolar a vida</label>
            <label class="chk"><input type="checkbox" id="bstHide" ${bstHide ? "checked" : ""}> Ocultos</label>
            <label class="chk"><input type="checkbox" id="bstIni" ${bstIni ? "checked" : ""}> Na iniciativa</label></div>
          <div class="acts"><button class="btn small primary" data-bput="${esc(m.id)}">＋ Colocar no mapa</button>${m.cat === "meus" ? `<span class="spacer"></span><button class="btn small danger" data-bdel="${esc(m.id)}">Apagar modelo</button>` : ""}</div></div>` : ""}`).join("") || `<p class="hint">Nada encontrado.</p>`}</div>
    <p class="hint">Clique numa criatura para ver os status e colocar, ou arraste direto para o mapa. Depois, clique no token → <b>📜 Ficha</b> para editar tudo (CA, vida, ataques…) e salvar como seu modelo. Valores do SRD 5e.</p></div>`;
  const P = $("#panel");
  $("#pClose").onclick = closePanel;
  const qi = $("#bstQ");
  qi.oninput = () => { bstQ = qi.value; const pos = qi.selectionStart; openBstPanel().then(() => { const n = $("#bstQ"); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }); };
  P.onkeydown = e => e.stopPropagation();
  P.onchange = e => { const id = e.target.id; if (id === "bstN") bstQty = Math.max(1, Math.min(20, +e.target.value || 1)); if (id === "bstRoll") bstRoll = e.target.checked; if (id === "bstHide") bstHide = e.target.checked; if (id === "bstIni") bstIni = e.target.checked; };
  P.onclick = async e => {
    const b = e.target.closest("[data-bc],[data-bput],[data-bdel],[data-bsel]"); if (!b || e.target.closest("input,label")) return; const d = b.dataset;
    if (d.bc != null) { bstCat = d.bc; bstSel = null; return openBstPanel(); }
    if (d.bput) { const n = Math.max(1, Math.min(20, +$("#bstN")?.value || bstQty)); bstQty = n; const [x, y] = placeAt(); return bstPlace(bstAll().find(m => m.id === d.bput), x, y, n); }
    if (d.bdel) { if (!confirm("Apagar este modelo?")) return; bstMine = bstMine.filter(m => m.id !== d.bdel); await bstSaveMine(); bstSel = null; return openBstPanel(); }
    if (d.bsel) { bstSel = bstSel === d.bsel ? null : d.bsel; return openBstPanel(); }
  };
}
// ---- ficha do monstro (janela, só o mestre) ----
let statId = null, monSecret = (() => { try { return localStorage.getItem("mesa.monsecret") === "1"; } catch { return false; } })();
function openStat(id) { statId = id; drawStat(true); }
function closeStat() { statId = null; $("#statWin")?.remove(); }
function monRoll(t, f, label) {
  doRoll(f, /^1d20/.test(f) ? shAdv : 0, `${t.n} · ${label}`, monSecret);
}
function drawStat(fresh) {
  const t = tokens.find(x => x.id === statId); if (!t || !t.st || !isGM) return closeStat();
  const S = t.st, at = S.at || [], pvI = pvBar(t), pv = pvI >= 0 ? t.b[pvI] : null;
  let w = $("#statWin");
  if (!w) { w = document.createElement("div"); w.id = "statWin"; w.className = "sheetwin statwin"; document.body.appendChild(w); w.onpointerdown = e => e.stopPropagation(); w.onkeydown = e => { e.stopPropagation(); if (e.key === "Escape") closeStat(); }; w.onwheel = e => e.stopPropagation(); }
  const keep = w.querySelector(".sw-body")?.scrollTop || 0, af = w.contains(document.activeElement) ? document.activeElement.dataset?.f : null;
  const inp = (f, v, cls = "", ex = "") => `<input class="${cls}" data-f="${f}" value="${esc(v ?? "")}" ${ex}>`;
  const num = (f, v, cls = "", ex = "") => inp(f, v, "num " + cls, `inputmode="numeric" ${ex}`);
  const rb = (f, l, txt, cls = "") => `<button class="sw-roll ${cls}" data-roll="${esc(f)}" data-rl="${esc(l)}" title="Rolar ${esc(l)}: ${esc(f)}">${txt}</button>`;
  w.innerHTML = `<div class="sw-head" id="stDrag"><span class="sw-port" style="--pc:${esc(t.c || "#8a2a2a")}"><span style="font-size:28px">${esc(t.em || "🐾")}</span></span>
      <div class="sw-id">${inp("n", t.n, "sw-name", 'maxlength="40"')}<div class="sw-meta"><span>ND ${crTxt(S.cr)}</span><label>XP ${num("xp", S.xp, "", 'style="width:70px"')}</label><label class="chk" title="Suas rolagens deste monstro ficam escondidas dos jogadores"><input type="checkbox" id="stSecret" ${monSecret ? "checked" : ""}> rolagens secretas</label></div></div>
      <div class="sw-adv">${[[-1, "Desv."], [0, "Normal"], [1, "Vant."]].map(([v, l]) => `<button data-adv="${v}" aria-pressed="${shAdv === v}">${l}</button>`).join("")}</div>
      <button class="be-x" data-act="close" aria-label="Fechar">✕</button></div>
    <div class="sw-body">
      <div class="sw-stats st-stats">
        <label class="sw-stat"><span>CA</span>${num("ca", S.ca, "big")}</label>
        <div class="sw-stat hp"><span>Vida</span><div class="sw-hp"><button data-hp="-10">−10</button><button data-hp="-1">−1</button>${num("pv", pv?.v ?? "", "big")}<em>/</em>${num("pvm", pv?.m ?? "")}<button data-hp="1">+1</button><button data-hp="10">+10</button></div><small>dados ${inp("pvd", S.pvd, "", 'style="width:80px"')}</small></div>
        <label class="sw-stat"><span>Desloc. (m)</span>${num("sp", t.sp, "big")}</label>
        <div class="sw-stat"><span>Iniciativa</span>${rb(d20(mod5(at[1])), "Iniciativa", sgn(mod5(at[1])), "big")}</div>
      </div>
      <div class="sw-attrs">${ATTRS.map(([k, n, s], i) => `<div class="sw-attr"><span class="sw-an">${n}</span>${rb(d20(mod5(at[i])), "Teste de " + n, sgn(mod5(at[i])), "mod")}${num("at." + i, at[i] ?? 10, "score")}<div class="sw-save">${rb(d20(mod5(at[i])), "Salvaguarda de " + s, "Salv. " + sgn(mod5(at[i])))}</div></div>`).join("")}</div>
      <div class="sw-sub">Ataques e ações <button class="btn small" data-add="atk">＋ Ataque</button></div>
      <div class="sw-atks">${(S.atk || []).map((a, i) => `<div class="sw-atk">${inp(`atk.${i}.n`, a.n, "grow", 'placeholder="Mordida"')}<label class="mini" title="Bônus de acerto (0 = não rola acerto, ex.: sopro)">acerto ${num(`atk.${i}.h`, a.h, "tiny")}</label>${a.h ? rb(d20(+a.h), a.n || "Ataque", "🎯 " + sgn(+a.h)) : ""}${inp(`atk.${i}.d`, a.d, "dmg", 'placeholder="1d6+2"')}${inp(`atk.${i}.t`, a.t, "dmg", 'placeholder="cortante"')}${a.d && /\d/.test(a.d) ? rb(a.d, (a.n || "Dano") + (a.t ? " (" + a.t + ")" : ""), "💥 " + esc(a.d)) : ""}<button class="sw-x" data-del="atk.${i}" title="Apagar">✕</button></div>`).join("") || `<p class="hint">Nenhum ataque.</p>`}</div>
      <div class="sw-sub">Traços e habilidades</div><textarea data-f="tr" rows="4">${esc(S.tr)}</textarea>
      <div class="acts"><button class="btn small" data-act="tpl" title="Guarda esta versão no Bestiário, em Meus modelos">⭐ Salvar como modelo</button><button class="btn small" data-act="ini" title="Coloca na lista de iniciativa">⚔ Pôr na iniciativa</button><span class="spacer"></span><span class="hint">Só você vê esta ficha.</span></div>
    </div>`;
  const body = w.querySelector(".sw-body"); if (!fresh) body.scrollTop = keep;
  if (af && !fresh) w.querySelector(`[data-f="${af}"]`)?.focus();
  if (fresh) { w.style.left = Math.max(8, innerWidth / 2 - Math.min(760, innerWidth - 16) / 2) + "px"; w.style.top = Math.max(8, Math.min(70, innerHeight * 0.06)) + "px"; }
  const commit = () => { save("tokens", "merge", 500); dirty = true; selBarKey = ""; };
  const setF = (f, raw) => {
    const isNum = /^(xp|ca|pv|pvm|sp|at\.\d|atk\.\d+\.h)$/.test(f), v = isNum ? (String(raw).trim() === "" ? "" : Math.round(+String(raw).replace(",", ".")) || 0) : raw;
    if (f === "n") t.n = String(v).slice(0, 40);
    else if (f === "sp") t.sp = Math.max(0, +v || 0);
    else if (f === "pv" || f === "pvm") { if (!pv) t.b = [{ n: "PV", v: 0, m: 0, c: "#c0473a" }, ...(t.b || [])]; const b = t.b[pvBar(t) >= 0 ? pvBar(t) : 0]; b[f === "pv" ? "v" : "m"] = v; }
    else if (f.startsWith("at.")) S.at[+f.slice(3)] = Math.max(1, Math.min(30, +v || 10));
    else if (f.startsWith("atk.")) { const [, i, k] = f.split("."); S.atk[+i][k] = k === "h" ? +v || 0 : String(v).slice(0, 60); }
    else if (f === "tr") S.tr = String(v).slice(0, 3000);
    else S[f] = v;
  };
  let tT = null;
  w.oninput = e => { const el = e.target.closest("[data-f]"); if (!el) return; setF(el.dataset.f, el.value); clearTimeout(tT); tT = setTimeout(commit, 600); };
  w.onchange = e => { if (e.target.id === "stSecret") { monSecret = e.target.checked; try { localStorage.setItem("mesa.monsecret", monSecret ? "1" : "0"); } catch {} return; }
    const el = e.target.closest("[data-f]"); if (!el) return; setF(el.dataset.f, el.value); clearTimeout(tT); commit(); if (/^(at\.|atk\.\d+\.(h|d|t|n)$|pv|pvm)/.test(el.dataset.f)) setTimeout(() => drawStat(), 0); };
  w.onclick = e => {
    const b = e.target.closest("button"); if (!b) return; const d = b.dataset;
    if (d.roll) return monRoll(t, d.roll, d.rl);
    if (d.adv != null) { shAdv = +d.adv; return drawStat(); }
    if (d.act === "close") return closeStat();
    if (d.hp) { const i = pvBar(t); if (i < 0) return; t.b[i].v = (+t.b[i].v || 0) + +d.hp; commit(); return drawStat(); }
    if (d.add) { S.atk = S.atk || []; S.atk.push({ n: "", h: 0, d: "", t: "" }); commit(); drawStat(); setTimeout(() => w.querySelector(`[data-f="atk.${S.atk.length - 1}.n"]`)?.focus(), 30); return; }
    if (d.del) { S.atk.splice(+d.del.split(".")[1], 1); commit(); return drawStat(); }
    if (d.act === "ini") { if (!iniAdd(t)) return toast("Já está na iniciativa."); iniSave(); return toast("⚔ Na iniciativa."); }
    if (d.act === "tpl") {
      const nm = prompt("Nome do modelo:", t.n.replace(/ \d+$/, "")); if (!nm) return;
      const m = { id: "c-" + uid(), n: nm.slice(0, 40), cat: "meus", cr: S.cr, xp: +S.xp || 0, ca: +S.ca || 10, pv: +(pv?.m || pv?.v) || 1, pvd: S.pvd || "", sp: +t.sp || 0, at: S.at.slice(), s: t.s || 1, em: t.em || "", atk: S.atk.map(a => ({ ...a })), tr: S.tr || "" };
      (bstMine = bstMine || []).push(m); bstSaveMine(); toast(`⭐ “${m.n}” salvo em Meus modelos do Bestiário.`); if (panelKind === "bst") openBstPanel(); return;
    }
  };
  const hd = $("#stDrag");
  hd.onpointerdown = e => { if (e.target.closest("input,button,select,textarea,label")) return; const r = w.getBoundingClientRect(), ox = e.clientX - r.left, oy = e.clientY - r.top;
    const mv = ev => { w.style.left = Math.max(0, Math.min(innerWidth - 80, ev.clientX - ox)) + "px"; w.style.top = Math.max(0, Math.min(innerHeight - 50, ev.clientY - oy)) + "px"; };
    const up = () => { removeEventListener("pointermove", mv); removeEventListener("pointerup", up); }; addEventListener("pointermove", mv); addEventListener("pointerup", up); };
}
function monDefeatedXp() { // XP dos monstros do mapa que estão com 0 de vida ou menos
  let xp = 0, n = 0; for (const t of tokens) { if (!t.st) continue; const i = pvBar(t); if (i >= 0 && +t.b[i].v <= 0 && t.b[i].v !== "") { xp += +t.st.xp || 0; n++; } } return { xp, n };
}

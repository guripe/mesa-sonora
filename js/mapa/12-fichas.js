"use strict";
// ---------- fichas de personagem (linha 997 do map_state, coluna drawings) ----------
// o mestre salva; o jogador edita a própria ficha e manda para o mestre salvar (como os tokens)
const SH_ROW = 997;
const ATTRS = [
  ["for", "Força", "FOR"],
  ["des", "Destreza", "DES"],
  ["con", "Constituição", "CON"],
  ["int", "Inteligência", "INT"],
  ["sab", "Sabedoria", "SAB"],
  ["car", "Carisma", "CAR"],
];
const SKILLS = [
  ["acrobacia", "Acrobacia", "des"],
  ["adestrar", "Adestrar Animais", "sab"],
  ["arcanismo", "Arcanismo", "int"],
  ["atletismo", "Atletismo", "for"],
  ["atuacao", "Atuação", "car"],
  ["enganacao", "Enganação", "car"],
  ["furtividade", "Furtividade", "des"],
  ["historia", "História", "int"],
  ["intimidacao", "Intimidação", "car"],
  ["intuicao", "Intuição", "sab"],
  ["investigacao", "Investigação", "int"],
  ["medicina", "Medicina", "sab"],
  ["natureza", "Natureza", "int"],
  ["percepcao", "Percepção", "sab"],
  ["persuasao", "Persuasão", "car"],
  ["prestidigitacao", "Prestidigitação", "des"],
  ["religiao", "Religião", "int"],
  ["sobrevivencia", "Sobrevivência", "sab"],
];
const MONEY = [
  ["pc", "PC", "cobre"],
  ["pp", "PP", "prata"],
  ["pe", "PE", "electro"],
  ["po", "PO", "ouro"],
  ["pl", "PL", "platina"],
];
let sheets = null,
  shOpen = null,
  shTab = "main",
  shAdv = 0,
  shSaveT = null;
const shNew = (o, n) => ({
  id: uid(),
  n: n || "Novo personagem",
  o: o || "",
  img: "",
  cls: "",
  lvl: 1,
  xp: 0,
  race: "",
  at: { for: 10, des: 10, con: 10, int: 10, sab: 10, car: 10 },
  ca: 10,
  pv: 10,
  pvm: 10,
  pvt: 0,
  sp: 9,
  ib: 0,
  sv: {},
  sk: {},
  insp: 0,
  ds: { s: 0, f: 0 },
  atk: [],
  cast: "int",
  slots: {},
  sp_: [],
  inv: [],
  money: {},
  tr: "",
  nt: "",
  at_: Date.now(),
});
const modOf = v => Math.floor(((+v || 10) - 10) / 2);
const sgn = v => (v >= 0 ? "+" : "−") + Math.abs(v);
// XP por nível (D&D 5e): quanto precisa ter para chegar em cada nível
const XP_LV = [0, 0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
const lvOfXp = xp => { let l = 1; while (l < 20 && (+xp || 0) >= XP_LV[l + 1]) l++; return l; };
const fmtN = n => (+n || 0).toLocaleString("pt-BR");
function xpBar(sh) { // barrinha de XP até o próximo nível
  const l = Math.max(1, Math.min(20, +sh.lvl || 1)), xp = +sh.xp || 0;
  if (l >= 20) return `<span class="xpbar max" title="Nível máximo"><i style="width:100%"></i><b>${fmtN(xp)} XP · nível máximo</b></span>`;
  const a = XP_LV[l], b = XP_LV[l + 1], pct = Math.max(0, Math.min(100, ((xp - a) / (b - a)) * 100));
  return `<span class="xpbar ${xp >= b ? "up" : ""}" title="Faltam ${fmtN(Math.max(0, b - xp))} XP para o nível ${l + 1}"><i style="width:${pct}%"></i><b>${fmtN(xp)} / ${fmtN(b)} XP</b></span>`;
}
const profOf = sh => 2 + Math.floor((Math.max(1, Math.min(20, +sh.lvl || 1)) - 1) / 4);
const amod = (sh, k) => modOf(sh.at?.[k]);
const skillMod = (sh, s) => amod(sh, s[2]) + profOf(sh) * (+sh.sk?.[s[0]] || 0);
const saveMod = (sh, k) => amod(sh, k) + (sh.sv?.[k] ? profOf(sh) : 0);
const castMod = sh => amod(sh, sh.cast || "int");
const shById = id => (sheets || []).find(s => s.id === id);
const canEditSh = sh =>
  !!sh && (isGM || (!!sh.o && (sh.o === "*" || (!!myNick && sh.o.toLowerCase() === myNick.toLowerCase()))));
const shTok = sh => tokens.find(t => t.sh === sh.id && !isProp(t));
async function shLoad() {
  const { data, error } = await sb.from("map_state").select("drawings").eq("id", SH_ROW).maybeSingle();
  if (error) {
    toast("Não carreguei as fichas: " + error.message);
    sheets = sheets || [];
    return;
  }
  sheets = Array.isArray(data?.drawings) ? data.drawings : [];
}
function shClean(x, prev) {
  // o mestre só aceita campos conhecidos, com limites
  const S = (v, n) => String(v ?? "").slice(0, n),
    N = (v, a, b, d = 0) => {
      v = Math.round(+v);
      return isFinite(v) ? Math.max(a, Math.min(b, v)) : d;
    };
  const o = shNew(prev?.o ?? S(x.o, 30));
  o.id = S(prev?.id || x.id, 20) || uid();
  Object.assign(o, {
    n: S(x.n, 40) || "Personagem",
    img: S(x.img, 400),
    cls: S(x.cls, 40),
    race: S(x.race, 40),
    lvl: N(x.lvl, 1, 20, 1),
    xp: N(x.xp, 0, 9999999),
    ca: N(x.ca, 0, 40, 10),
    pv: N(x.pv, -99, 999),
    pvm: N(x.pvm, 0, 999, 10),
    pvt: N(x.pvt, 0, 999),
    sp: N(x.sp, 0, 99, 9),
    ib: N(x.ib, -10, 20),
    insp: x.insp ? 1 : 0,
    ds: { s: N(x.ds?.s, 0, 3), f: N(x.ds?.f, 0, 3) },
    cast: ATTRS.some(a => a[0] === x.cast) ? x.cast : "int",
    tr: S(x.tr, 6000),
    nt: S(x.nt, 6000),
    at_: Date.now(),
  });
  for (const [k] of ATTRS) {
    o.at[k] = N(x.at?.[k], 1, 30, 10);
    if (x.sv?.[k]) o.sv[k] = 1;
  }
  for (const [k] of SKILLS) {
    const v = N(x.sk?.[k], 0, 2);
    if (v) o.sk[k] = v;
  }
  o.atk = (Array.isArray(x.atk) ? x.atk : [])
    .slice(0, 20)
    .map(a => ({
      n: S(a?.n, 40),
      a: ["for", "des", "mag", ""].includes(a?.a) ? a.a : "for",
      pr: a?.pr ? 1 : 0,
      bx: N(a?.bx, -20, 20),
      d: S(a?.d, 30),
      dm: a?.dm ? 1 : 0,
      t: S(a?.t, 20),
    }));
  for (let l = 1; l <= 9; l++) {
    const s = x.slots?.[l];
    if (s && +s.m > 0) o.slots[l] = { m: N(s.m, 0, 9), u: N(s.u, 0, 9) };
  }
  o.sp_ = (Array.isArray(x.sp_) ? x.sp_ : [])
    .slice(0, 80)
    .map(p => ({ n: S(p?.n, 50), l: N(p?.l, 0, 9), f: S(p?.f, 30), atk: p?.atk ? 1 : 0, d: S(p?.d, 1500) }));
  o.inv = (Array.isArray(x.inv) ? x.inv : [])
    .slice(0, 120)
    .map(i => ({ n: S(i?.n, 60), q: N(i?.q, 0, 9999, 1) }));
  for (const [k] of MONEY) {
    const v = N(x.money?.[k], 0, 9999999);
    if (v) o.money[k] = v;
  }
  return o;
}
function shSaveGM() {
  // mestre grava a lista toda (junta várias mudanças)
  clearTimeout(shSaveT);
  shSaveT = setTimeout(async () => {
    const { error } = await sb
      .from("map_state")
      .upsert({ id: SH_ROW, drawings: sheets, updated_at: new Date().toISOString() });
    if (error) toast("Não salvei as fichas: " + error.message);
  }, 500);
}
function shCommit(sh) {
  // guarda a mudança: mestre salva e avisa; jogador pede ao mestre
  sh.at_ = Date.now();
  if (isGM) {
    shSaveGM();
    send("sheet", { sh });
    shSyncTokens(sh);
  } else send("sheetreq", { sh, who: myNick });
  if (panelKind === "sheets") openSheetsPanel();
}
function pvBar(t) {
  const b = t.b || [];
  let i = b.findIndex(x => x && /^(pv|hp|vida)/i.test(x.n || ""));
  if (i < 0 && b[0] && !b[0].n) i = 0;
  return i;
}
function shSyncTokens(sh) {
  // mestre: tokens ligados à ficha recebem PV e deslocamento
  if (!isGM) return;
  let ch = false;
  for (const t of tokens) {
    if (t.sh !== sh.id) continue;
    t.b = t.b || [];
    let i = pvBar(t);
    if (i < 0) {
      t.b.unshift({ n: "PV", v: sh.pv, m: sh.pvm || "", c: "#c0473a" });
      ch = true;
    } else if (+t.b[i].v !== +sh.pv || +t.b[i].m !== +sh.pvm) {
      t.b[i].v = sh.pv;
      t.b[i].m = sh.pvm || "";
      ch = true;
    }
    if (+sh.sp > 0 && +t.sp !== +sh.sp) {
      t.sp = +sh.sp;
      ch = true;
    }
  }
  if (ch) {
    save("tokens");
    dirty = true;
    selBarKey = "";
  }
}
function shFromTokenPV(t, i) {
  // mudou a barra de PV do token: a ficha acompanha
  const sh = t?.sh && shById(t.sh);
  if (!sh || i !== pvBar(t) || !canEditSh(sh)) return;
  const v = Math.round(+t.b[i].v);
  if (!isFinite(v) || v === +sh.pv) return;
  sh.pv = v;
  shCommit(sh);
  if (shOpen === sh.id) drawSheet();
}
function shRoll(sh, formula, label) {
  let res;
  try {
    res = rollFormula(formula, /^1d20/.test(formula) ? shAdv : 0);
  } catch (err) {
    return toast("Não rolei: " + err.message);
  }
  if (shAdv && /^1d20/.test(formula)) res.f += shAdv > 0 ? " (vantagem)" : " (desvantagem)";
  const r = {
    id: uid(),
    v: MAP_VER,
    who: sh.n || myNick || "Personagem",
    label,
    ...res,
    secret: false,
    snd: null,
    col: shTok(sh)?.c || "#d0a54c",
  };
  send("roll", r);
  addRoll(r, true);
  return r;
}
const d20 = m => "1d20" + (m ? (m > 0 ? "+" : "-") + Math.abs(m) : "");
// painel com a lista de fichas
function openSheetsPanel() {
  panelKind = "sheets";
  const list = (sheets || []).filter(s => isGM || canEditSh(s));
  $("#panel").innerHTML =
    `<div class="panel" role="dialog" aria-label="Fichas"><h3>Fichas de personagem<button class="btn small" id="pClose">Fechar</button></h3>
    <div class="acts"><button class="btn small primary" id="shAdd">＋ Nova ficha</button>${isGM ? `<button class="btn small" id="shAddSel" title="Cria uma ficha já ligada ao token selecionado">＋ Ficha do token selecionado</button><button class="btn small" id="shXp" title="Dar XP para os personagens (depois de um combate, missão…)">⭐ Dar XP</button>` : ""}</div>
    <div id="xpBox"></div>
    <div class="shlist">${
      list
        .map(s => {
          const t = shTok(s);
          return `<button class="shrow" data-sho="${esc(s.id)}"><span class="shp" style="--pc:${esc(t?.c || "#6b5a44")}">${s.img ? `<img src="${esc(s.img)}" alt="">` : esc((s.n || "?").slice(0, 2).toUpperCase())}</span><span class="shn"><b>${esc(s.n)}</b><small>${esc([s.race, s.cls && s.cls + " " + (s.lvl || 1)].filter(Boolean).join(" · ") || "sem classe")}${isGM ? ` · ${s.o ? "de " + esc(s.o) : "do mestre"}` : ""}</small></span><span class="shpv">❤ ${s.pv}/${s.pvm}<small>⭐ ${fmtN(s.xp || 0)} XP${(+s.lvl || 1) < 20 && (+s.xp || 0) >= XP_LV[(+s.lvl || 1) + 1] ? " ⬆" : ""}</small></span>${t ? `<span class="shlink" title="Ligada ao token ${esc(t.n || "")}">🔗</span>` : ""}</button>`;
        })
        .join("") ||
      `<p class="hint">${isGM ? "Nenhuma ficha ainda. Crie uma para cada personagem (e para monstros importantes)." : "Você ainda não tem ficha. Crie a do seu personagem."}</p>`
    }</div>
    <p class="hint">Na ficha, clique nos números (atributos, perícias, ataques) para rolar. Ligue a ficha a um token: a vida e o deslocamento dele passam a vir da ficha.${isGM ? "" : " O mestre precisa estar com o mapa aberto para a ficha ser salva."}</p></div>`;
  $("#pClose").onclick = closePanel;
  $("#shAdd").onclick = () => {
    const sh = shNew(isGM ? "" : myNick, isGM ? "Novo personagem" : myNick || "Meu personagem");
    sheets.push(sh);
    shCommit(sh);
    openSheet(sh.id);
  };
  const xb = $("#shXp");
  if (xb) xb.onclick = () => openXpBox();
  const as = $("#shAddSel");
  if (as)
    as.onclick = () => {
      const t = tokens.find(x => x.id === selTok && !isProp(x));
      if (!t) return toast("Selecione um token no mapa primeiro.");
      const sh = shNew(t.o || "", t.n || "Personagem");
      if (t.img) sh.img = t.img;
      const i = pvBar(t);
      if (i >= 0 && +t.b[i].m > 0) {
        sh.pv = +t.b[i].v || 0;
        sh.pvm = +t.b[i].m;
      }
      if (t.sp) sh.sp = +t.sp;
      sheets.push(sh);
      t.sh = sh.id;
      shCommit(sh);
      save("tokens");
      openSheet(sh.id);
    };
  $("#panel").querySelector(".shlist").onclick = e => {
    const b = e.target.closest("[data-sho]");
    if (b) openSheet(b.dataset.sho);
  };
}
function openXpBox() { // mestre: dá XP para um ou vários personagens (pode dividir o total)
  const box = $("#xpBox"); if (!box) return;
  if (box.innerHTML) { box.innerHTML = ""; return; }
  const pcs = (sheets || []).filter(s => s.o), rest = (sheets || []).filter(s => !s.o);
  box.innerHTML = `<div class="xpbox"><div class="xp-row"><label>XP <input id="xpAmt" inputmode="numeric" placeholder="ex.: 450" style="width:90px"></label>
      <label class="chk"><input type="radio" name="xpm" value="each" checked> para cada um</label><label class="chk"><input type="radio" name="xpm" value="split"> dividir entre os marcados</label>${monDefeatedXp().n ? `<button class="btn small" id="xpMon" title="Soma o XP das criaturas do Bestiário que estão com 0 de vida no mapa">＋ ${monDefeatedXp().n} derrotado${monDefeatedXp().n > 1 ? "s" : ""} (${fmtN(monDefeatedXp().xp)} XP)</button>` : ""}</div>
    <div class="xp-who">${[...pcs, ...rest].map(s => `<label class="chk"><input type="checkbox" data-xs="${esc(s.id)}" ${s.o ? "checked" : ""}> ${esc(s.n)} <small>(nível ${s.lvl || 1} · ${fmtN(s.xp || 0)} XP)</small></label>`).join("") || `<span class="hint">Nenhuma ficha ainda.</span>`}</div>
    <div class="acts"><span class="hint" id="xpPrev"></span><span class="spacer"></span><button class="btn small primary" id="xpGo">⭐ Dar XP</button></div></div>`;
  const calc = () => { const amt = Math.max(0, Math.round(+$("#xpAmt").value || 0)), ids = [...box.querySelectorAll("[data-xs]:checked")].map(x => x.dataset.xs), split = box.querySelector('[name="xpm"]:checked').value === "split", each = split && ids.length ? Math.floor(amt / ids.length) : amt; $("#xpPrev").textContent = amt && ids.length ? `${fmtN(each)} XP para cada um de ${ids.length}` : ""; return {ids, each}; };
  box.oninput = calc; box.onchange = calc;
  const xm = $("#xpMon"); if (xm) xm.onclick = () => { $("#xpAmt").value = monDefeatedXp().xp; box.querySelector('[name="xpm"][value="split"]').checked = true; calc(); }; box.onkeydown = e => e.stopPropagation();
  $("#xpGo").onclick = () => {
    const {ids, each} = calc(); if (!each || !ids.length) return toast("Coloque quanto XP e marque quem ganha.");
    const ups = [];
    for (const id of ids) { const sh = shById(id); if (!sh) continue; const before = +sh.xp || 0; sh.xp = before + each; shCommit(sh); if ((+sh.lvl || 1) < 20 && sh.xp >= XP_LV[(+sh.lvl || 1) + 1] && before < XP_LV[(+sh.lvl || 1) + 1]) ups.push(sh.n); }
    const names = ids.map(id => shById(id)?.n).filter(Boolean);
    const prevTo = chatTo; chatTo = "";
    chatSend(`⭐ ${names.join(", ")} ${names.length > 1 ? "ganharam" : "ganhou"} ${fmtN(each)} XP${names.length > 1 ? " cada" : ""}!${ups.length ? ` ⬆ ${ups.join(", ")} já ${ups.length > 1 ? "podem" : "pode"} subir de nível!` : ""}`);
    chatTo = prevTo;
    toast(`⭐ XP entregue.${ups.length ? " " + ups.join(", ") + " pode subir de nível!" : ""}`, 3500);
    box.innerHTML = ""; openSheetsPanel(); if (shOpen) drawSheet();
  };
  setTimeout(() => $("#xpAmt")?.focus(), 30);
}
function openSheet(id) {
  shOpen = id;
  drawSheet(true);
}
function closeSheet() {
  shOpen = null;
  $("#sheetWin")?.remove();
}
function drawSheet(fresh) {
  const sh = shById(shOpen);
  if (!sh) return closeSheet();
  const ed = canEditSh(sh),
    dis = ed ? "" : "disabled",
    P = profOf(sh),
    t = shTok(sh);
  let w = $("#sheetWin");
  if (!w) {
    w = document.createElement("div");
    w.id = "sheetWin";
    w.className = "sheetwin";
    document.body.appendChild(w);
    w.onpointerdown = e => e.stopPropagation();
    w.onkeydown = e => {
      e.stopPropagation();
      if (e.key === "Escape") closeSheet();
    };
    w.onwheel = e => e.stopPropagation();
  }
  const keepScroll = w.querySelector(".sw-body")?.scrollTop || 0,
    af = w.contains(document.activeElement) ? document.activeElement.dataset?.f : null;
  const inp = (f, v, cls = "", extra = "") =>
    `<input class="${cls}" data-f="${f}" value="${esc(v ?? "")}" ${dis} ${extra}>`;
  const num = (f, v, cls = "", extra = "") => inp(f, v, "num " + cls, `inputmode="numeric" ${extra}`);
  const rollBtn = (formula, label, txt, cls = "") =>
    `<button class="sw-roll ${cls}" data-roll="${esc(formula)}" data-rl="${esc(label)}" title="Rolar ${esc(label)}: ${esc(formula)}">${txt}</button>`;
  const tabs = [
    ["main", "Principal"],
    ["cbt", "Combate"],
    ["mag", "Magias"],
    ["inv", "Inventário"],
    ["nt", "Notas"],
  ];
  let body = "";
  if (shTab === "main")
    body = `
    <div class="sw-stats">
      <label class="sw-stat"><span>CA</span>${num("ca", sh.ca, "big")}</label>
      <div class="sw-stat hp"><span>Vida</span><div class="sw-hp">${ed ? `<button data-hp="-5">−5</button><button data-hp="-1">−1</button>` : ""}${num("pv", sh.pv, "big")}<em>/</em>${num("pvm", sh.pvm)}${ed ? `<button data-hp="1">+1</button><button data-hp="5">+5</button>` : ""}</div><small>temporária ${num("pvt", sh.pvt, "tiny")}</small></div>
      <label class="sw-stat"><span>Desloc. (${esc(G().unitName || "m")})</span>${num("sp", sh.sp, "big")}</label>
      <div class="sw-stat"><span>Iniciativa</span>${rollBtn(d20(amod(sh, "des") + (+sh.ib || 0)), "Iniciativa", sgn(amod(sh, "des") + (+sh.ib || 0)), "big")}<small>bônus extra ${num("ib", sh.ib, "tiny")}</small></div>
      <div class="sw-stat"><span>Proficiência</span><b class="big">${sgn(P)}</b><small>pelo nível</small></div>
      <label class="sw-stat chk"><span>Inspiração</span><input type="checkbox" data-f="insp" ${sh.insp ? "checked" : ""} ${dis}></label>
    </div>
    <div class="sw-attrs">${ATTRS.map(([k, n, s]) => {
      const m = amod(sh, k),
        sv = saveMod(sh, k);
      return `<div class="sw-attr"><span class="sw-an">${n}</span>${rollBtn(d20(m), "Teste de " + n, sgn(m), "mod")}${num("at." + k, sh.at[k], "score")}
      <div class="sw-save"><label title="Proficiente na salvaguarda"><input type="checkbox" data-f="sv.${k}" ${sh.sv?.[k] ? "checked" : ""} ${dis}></label>${rollBtn(d20(sv), "Salvaguarda de " + s, "Salv. " + sgn(sv))}</div></div>`;
    }).join("")}</div>
    <div class="sw-skills"><div class="sw-sub">Perícias <small>clique no ● para proficiência (●● = especialista) · Percepção passiva ${10 + skillMod(sh, SKILLS[13])}</small></div>
      <div class="sw-skgrid">${SKILLS.map(s => {
        const v = +sh.sk?.[s[0]] || 0,
          m = skillMod(sh, s);
        return `<div class="sw-sk"><button class="sw-pr p${v}" data-sk="${s[0]}" ${dis} title="${v === 2 ? "Especialista" : v ? "Proficiente" : "Sem proficiência"}">${v === 2 ? "●●" : v ? "●" : "○"}</button>${rollBtn(d20(m), s[1], `<b>${sgn(m)}</b> ${s[1]} <small>${s[2].toUpperCase()}</small>`, "skill")}</div>`;
      }).join("")}</div></div>`;
  else if (shTab === "cbt")
    body = `
    <div class="sw-sub">Ataques ${ed ? `<button class="btn small" data-add="atk">＋ Ataque</button>` : ""}</div>
    <div class="sw-atks">${
      sh.atk
        .map((a, i) => {
          const m = a.a === "mag" ? castMod(sh) : a.a ? amod(sh, a.a) : 0,
            hit = m + (a.pr ? P : 0) + (+a.bx || 0),
            dmg = (a.d || "") + (a.dm && m ? (m > 0 ? "+" : "-") + Math.abs(m) : "");
          return `<div class="sw-atk">${inp(`atk.${i}.n`, a.n, "grow", 'placeholder="Espada longa"')}
        <select data-f="atk.${i}.a" ${dis} title="Atributo do ataque">${[
          ["for", "FOR"],
          ["des", "DES"],
          ["mag", "Magia"],
          ["", "—"],
        ]
          .map(([k, l]) => `<option value="${k}" ${a.a === k ? "selected" : ""}>${l}</option>`)
          .join("")}</select>
        <label class="mini" title="Soma a proficiência"><input type="checkbox" data-f="atk.${i}.pr" ${a.pr ? "checked" : ""} ${dis}>prof</label>
        <label class="mini" title="Bônus extra (arma mágica…)">+${num(`atk.${i}.bx`, a.bx, "tiny")}</label>
        ${rollBtn(d20(hit), a.n || "Ataque", "🎯 " + sgn(hit))}
        ${inp(`atk.${i}.d`, a.d, "dmg", 'placeholder="1d8" title="Dados de dano"')}<label class="mini" title="Soma o modificador no dano"><input type="checkbox" data-f="atk.${i}.dm" ${a.dm ? "checked" : ""} ${dis}>+mod</label>
        ${inp(`atk.${i}.t`, a.t, "dmg", 'placeholder="cortante"')}
        ${a.d ? rollBtn(dmg, "Dano · " + (a.n || "ataque"), "💥 " + esc(dmg)) : ""}${ed ? `<button class="sw-x" data-del="atk.${i}" title="Apagar">✕</button>` : ""}</div>`;
        })
        .join("") ||
      `<p class="hint">Nenhum ataque. Adicione armas e ataques para rolar o acerto e o dano com um clique.</p>`
    }</div>
    <div class="sw-sub">Testes contra a morte</div>
    <div class="sw-death"><span>Sucessos ${[1, 2, 3].map(k => `<button class="pip ok ${sh.ds.s >= k ? "on" : ""}" data-ds="s${k}" ${dis}></button>`).join("")}</span><span>Falhas ${[1, 2, 3].map(k => `<button class="pip bad ${sh.ds.f >= k ? "on" : ""}" data-ds="f${k}" ${dis}></button>`).join("")}</span>
      ${ed ? `<button class="btn small" data-act="death">🎲 Rolar teste</button><button class="btn small" data-act="dsreset">Zerar</button>` : ""}</div>
    ${ed ? `<div class="sw-sub">Descanso</div><div class="acts"><button class="btn small" data-act="long">🌙 Descanso longo</button><small class="hint">Vida cheia, espaços de magia de volta, testes de morte zerados.</small></div>` : ""}`;
  else if (shTab === "mag") {
    const cm = castMod(sh);
    body = `
    <div class="sw-row"><label>Atributo de conjuração <select data-f="cast" ${dis}>${ATTRS.map(([k, n]) => `<option value="${k}" ${sh.cast === k ? "selected" : ""}>${n}</option>`).join("")}</select></label>
      <span class="sw-pill">CD <b>${8 + P + cm}</b></span>${rollBtn(d20(P + cm), "Ataque mágico", "🎯 Ataque " + sgn(P + cm))}</div>
    <div class="sw-sub">Espaços de magia <small>quantos tem por nível · clique nas bolinhas para gastar</small></div>
    <div class="sw-slots">${[1, 2, 3, 4, 5, 6, 7, 8, 9]
      .map(l => {
        const s = sh.slots[l] || { m: 0, u: 0 };
        return `<div class="sw-slot"><span>${l}º</span>${num(`slots.${l}.m`, s.m || "", "tiny", 'placeholder="0"')}<div>${Array.from({ length: +s.m || 0 }, (_, k) => `<button class="pip ${k < (+s.u || 0) ? "" : "on"} mag" data-slot="${l}.${k}" ${dis} title="${k < (+s.u || 0) ? "Gasto" : "Disponível"}"></button>`).join("")}</div></div>`;
      })
      .join("")}</div>
    <div class="sw-sub">Magias ${ed ? `<button class="btn small" data-add="sp_">＋ Magia</button>` : ""}</div>
    <div class="sw-spells">${
      sh.sp_
        .map(
          (
            p,
            i,
          ) => `<details class="sw-spell" ${p._o ? "open" : ""}><summary><b>${esc(p.n || "Magia")}</b><small>${p.l ? p.l + "º nível" : "truque"}</small>
        ${p.atk ? rollBtn(d20(P + cm), "Ataque · " + (p.n || "magia"), "🎯 " + sgn(P + cm)) : ""}${p.f ? rollBtn(p.f, p.n || "Magia", "🎲 " + esc(p.f)) : ""}${ed && p.l > 0 ? `<button class="sw-roll" data-cast="${i}" title="Gasta um espaço de ${p.l}º nível">✨ Conjurar</button>` : ""}</summary>
        <div class="sw-spf">${inp(`sp_.${i}.n`, p.n, "grow", 'placeholder="Nome"')}<label class="mini">nível ${num(`sp_.${i}.l`, p.l, "tiny")}</label><label class="mini" title="Dados de dano ou cura">dados ${inp(`sp_.${i}.f`, p.f, "dmg", 'placeholder="8d6"')}</label><label class="mini"><input type="checkbox" data-f="sp_.${i}.atk" ${p.atk ? "checked" : ""} ${dis}>rola ataque</label>${ed ? `<button class="sw-x" data-del="sp_.${i}" title="Apagar">✕</button>` : ""}</div>
        <textarea data-f="sp_.${i}.d" rows="3" placeholder="O que a magia faz, alcance, duração…" ${dis}>${esc(p.d)}</textarea></details>`,
        )
        .join("") ||
      `<p class="hint">Nenhuma magia. Adicione truques e magias; as que têm dados rolam com um clique.</p>`
    }</div>`;
  } else if (shTab === "inv")
    body = `
    <div class="sw-money">${MONEY.map(([k, s, n]) => `<label title="${n}"><span>${s}</span>${num("money." + k, sh.money[k] || "", "", 'placeholder="0"')}</label>`).join("")}</div>
    <div class="sw-sub">Itens ${ed ? `<button class="btn small" data-add="inv">＋ Item</button>` : ""}</div>
    <div class="sw-inv">${sh.inv.map((it, i) => `<div class="sw-item">${num(`inv.${i}.q`, it.q, "tiny", 'title="Quantidade"')}${inp(`inv.${i}.n`, it.n, "grow", 'placeholder="Corda de cânhamo (15 m)"')}${ed ? `<button class="sw-x" data-del="inv.${i}" title="Apagar">✕</button>` : ""}</div>`).join("") || `<p class="hint">Mochila vazia.</p>`}</div>`;
  else
    body = `<div class="sw-sub">Traços, talentos e habilidades</div><textarea data-f="tr" rows="8" placeholder="Visão no escuro, Ataque furtivo 2d6, Fúria 3/dia…" ${dis}>${esc(sh.tr)}</textarea>
    <div class="sw-sub">Anotações</div><textarea data-f="nt" rows="8" placeholder="História, aliados, objetivos, pistas…" ${dis}>${esc(sh.nt)}</textarea>`;
  w.innerHTML = `<div class="sw-head" id="swDrag">
      <span class="sw-port" style="--pc:${esc(t?.c || "#6b5a44")}">${sh.img ? `<img src="${esc(sh.img)}" alt="">` : esc((sh.n || "?").slice(0, 2).toUpperCase())}</span>
      <div class="sw-id">${inp("n", sh.n, "sw-name", 'maxlength="40" aria-label="Nome"')}
        <div class="sw-meta">${inp("race", sh.race, "", 'placeholder="Raça" maxlength="40"')}${inp("cls", sh.cls, "", 'placeholder="Classe" maxlength="40"')}<label>nível ${num("lvl", sh.lvl, "tiny")}</label><label title="Pontos de experiência">XP ${num("xp", sh.xp || 0, "", 'style="width:74px"')}</label>${xpBar(sh)}${ed && (+sh.lvl || 1) < 20 && (+sh.xp || 0) >= XP_LV[(+sh.lvl || 1) + 1] ? `<button class="btn small primary sw-lvup" data-act="lvup">⬆ Subir para o nível ${(+sh.lvl || 1) + 1}</button>` : ""}${isGM ? `<label>dono ${inp("o", sh.o, "", 'placeholder="apelido do jogador" maxlength="30" style="width:110px"')}</label>` : ""}</div></div>
      <div class="sw-adv" title="Vale para as rolagens de d20 desta ficha">${[
        [-1, "Desv."],
        [0, "Normal"],
        [1, "Vant."],
      ]
        .map(([v, l]) => `<button data-adv="${v}" aria-pressed="${shAdv === v}">${l}</button>`)
        .join("")}</div>
      <button class="be-x" data-act="close" aria-label="Fechar ficha">✕</button></div>
    <div class="sw-tabs">${tabs.map(([k, l]) => `<button data-tab="${k}" aria-pressed="${shTab === k}">${l}</button>`).join("")}<span class="spacer"></span>
      ${ed ? `<button class="btn small" data-act="link" title="${t ? "Ligada ao token " + esc(t.n || "") : "Liga esta ficha ao token selecionado no mapa"}">${t ? "🔗 " + esc(t.n || "token") : "🔗 Ligar ao token selecionado"}</button>` : ""}
      ${ed ? `<details class="sw-more"><summary title="Mais">⋯</summary><div>${inp("img", sh.img, "", 'placeholder="Link da imagem do retrato" style="width:220px"')}${isGM || canEditSh(sh) ? `<button class="btn small danger" data-act="del">Apagar ficha</button>` : ""}</div></details>` : ""}</div>
    <div class="sw-body">${body}</div>`;
  const b = w.querySelector(".sw-body");
  if (!fresh) b.scrollTop = keepScroll;
  if (af && !fresh) {
    const el = w.querySelector(`[data-f="${af}"]`);
    if (el) {
      el.focus();
      if (el.select && el.type !== "checkbox")
        try {
          el.setSelectionRange(el.value.length, el.value.length);
        } catch {}
    }
  }
  if (fresh) {
    w.style.left = Math.max(8, innerWidth / 2 - Math.min(760, innerWidth - 16) / 2) + "px";
    w.style.top = Math.max(8, Math.min(70, innerHeight * 0.06)) + "px";
  }
  // mudar campos
  const setPath = (path, v) => {
    const ks = path.split(".");
    let o = sh;
    for (let i = 0; i < ks.length - 1; i++) {
      if (o[ks[i]] == null || typeof o[ks[i]] !== "object") o[ks[i]] = /^\d+$/.test(ks[i + 1]) ? [] : {};
      o = o[ks[i]];
    }
    o[ks[ks.length - 1]] = v;
  };
  const getVal = el =>
    el.type === "checkbox"
      ? el.checked
        ? 1
        : 0
      : el.classList.contains("num")
        ? el.value.trim() === ""
          ? ""
          : Math.round(+el.value.replace(",", ".")) || 0
        : el.value;
  let typT = null;
  w.oninput = e => {
    const el = e.target.closest("[data-f]");
    if (!el || !ed) return;
    if (el.type === "checkbox" || el.tagName === "SELECT") return;
    setPath(el.dataset.f, getVal(el));
    clearTimeout(typT);
    typT = setTimeout(() => shCommit(sh), 700);
  };
  w.onchange = e => {
    const el = e.target.closest("[data-f]");
    if (!el || !ed) return;
    setPath(el.dataset.f, getVal(el));
    if (el.dataset.f === "pv" && +sh.pv > 0) sh.ds = { s: 0, f: 0 };
    clearTimeout(typT);
    shCommit(sh);
    if (
      /^(at\.|lvl|xp|sv\.|atk\.\d+\.(a|pr|bx|d|dm)$|cast|slots\.|sp_\.\d+\.(f|atk|l)$|img|ib|pv|pvm|insp)/.test(
        el.dataset.f,
      )
    )
      setTimeout(drawSheet, 0);
  };
  w.querySelectorAll("details.sw-spell").forEach(
    (d, i) =>
      (d.ontoggle = () => {
        if (sh.sp_[i]) sh.sp_[i]._o = d.open;
      }),
  );
  w.onclick = e => {
    const el = e.target.closest("button");
    if (!el) return;
    const d = el.dataset;
    if (d.roll) {
      e.preventDefault();
      shRoll(sh, d.roll, d.rl);
      return;
    }
    if (d.tab) {
      shTab = d.tab;
      drawSheet(true);
      return;
    }
    if (d.adv != null) {
      shAdv = +d.adv;
      drawSheet();
      return;
    }
    if (d.act === "close") return closeSheet();
    if (!ed) return;
    if (d.hp) {
      sh.pv = Math.min(+sh.pvm || 999, (+sh.pv || 0) + +d.hp);
      if (sh.pv > 0) sh.ds = { s: 0, f: 0 };
      shCommit(sh);
      return drawSheet();
    }
    if (d.sk) {
      sh.sk = sh.sk || {};
      sh.sk[d.sk] = ((+sh.sk[d.sk] || 0) + 1) % 3;
      shCommit(sh);
      return drawSheet();
    }
    if (d.ds) {
      const k = d.ds[0],
        n = +d.ds[1];
      sh.ds[k] = sh.ds[k] >= n ? n - 1 : n;
      shCommit(sh);
      return drawSheet();
    }
    if (d.slot) {
      const [l, k] = d.slot.split(".").map(Number),
        s = sh.slots[l];
      if (!s) return;
      s.u = k < (+s.u || 0) ? k : k + 1;
      shCommit(sh);
      return drawSheet();
    }
    if (d.cast != null) {
      const p = sh.sp_[+d.cast],
        s = sh.slots[p.l];
      if (!s || (+s.u || 0) >= (+s.m || 0)) return toast(`Sem espaços de ${p.l}º nível.`);
      s.u = (+s.u || 0) + 1;
      shCommit(sh);
      drawSheet();
      toast(`✨ ${p.n || "Magia"}: espaço de ${p.l}º nível gasto.`, 1600);
      return;
    }
    if (d.add) {
      const L = (sh[d.add] = sh[d.add] || []);
      L.push(
        d.add === "atk"
          ? { n: "", a: "for", pr: 1, bx: 0, d: "1d8", dm: 1, t: "" }
          : d.add === "sp_"
            ? { n: "", l: 0, f: "", atk: 0, d: "", _o: true }
            : { n: "", q: 1 },
      );
      shCommit(sh);
      drawSheet();
      setTimeout(() => {
        const ins = w.querySelectorAll(`[data-f^="${d.add}.${L.length - 1}.n"]`);
        ins[0]?.focus();
      }, 30);
      return;
    }
    if (d.del) {
      const [k, i] = d.del.split(".");
      sh[k].splice(+i, 1);
      shCommit(sh);
      return drawSheet();
    }
    if (d.act === "death") {
      const r = shRoll(sh, "1d20", "Teste contra a morte");
      if (!r) return;
      const v = r.dice[0]?.v || r.total;
      if (v === 20) {
        sh.pv = 1;
        sh.ds = { s: 0, f: 0 };
        toast("⭐ 20 natural: volta com 1 de vida!");
      } else if (v === 1) sh.ds.f = Math.min(3, sh.ds.f + 2);
      else if (v >= 10) sh.ds.s = Math.min(3, sh.ds.s + 1);
      else sh.ds.f = Math.min(3, sh.ds.f + 1);
      if (sh.ds.s >= 3) toast("💚 Estabilizado!");
      if (sh.ds.f >= 3) toast("💀 Três falhas…");
      setTimeout(() => {
        shCommit(sh);
        drawSheet();
      }, 1600);
      return;
    }
    if (d.act === "dsreset") {
      sh.ds = { s: 0, f: 0 };
      shCommit(sh);
      return drawSheet();
    }
    if (d.act === "lvup") {
      sh.lvl = Math.min(20, (+sh.lvl || 1) + 1);
      shCommit(sh);
      drawSheet();
      if (DS.init()) { const t = DS.ctx.currentTime; [523, 659, 784, 1047].forEach((f, k) => DS.tone(t + k * 0.11, f, 0.35, 0.12, "triangle")); }
      return toast(`⬆ ${sh.n} subiu para o nível ${sh.lvl}! Lembre de aumentar a vida máxima e ver as novas habilidades da classe.`, 4500);
    }
    if (d.act === "long") {
      sh.pv = +sh.pvm || sh.pv;
      sh.pvt = 0;
      sh.ds = { s: 0, f: 0 };
      for (const l in sh.slots) sh.slots[l].u = 0;
      shCommit(sh);
      drawSheet();
      return toast("🌙 Descanso longo: tudo recuperado.", 1800);
    }
    if (d.act === "link") {
      const tk = tokens.find(x => x.id === selTok && !isProp(x));
      if (!tk) return toast("Selecione o token no mapa primeiro (clique nele) e depois aperte aqui.");
      if (!isGM && !owns(tk)) return toast("Esse token não é seu.");
      {
        const i = pvBar(tk);
        if (i >= 0 && +tk.b[i].m > 0 && +sh.pv === 10 && +sh.pvm === 10) {
          sh.pv = +tk.b[i].v || 0;
          sh.pvm = +tk.b[i].m;
          shCommit(sh);
        }
      } // ficha nova: pega a vida que o token já tinha
      if (isGM) {
        for (const x of tokens) if (x.sh === sh.id && x !== tk) delete x.sh;
        tk.sh = sh.id;
        save("tokens");
        shSyncTokens(sh);
      } else {
        tk.sh = sh.id;
        tokReq({ id: tk.id, sh: sh.id, who: myNick });
      }
      toast(`🔗 Ficha ligada a ${tk.n || "token"}.`);
      return drawSheet();
    }
    if (d.act === "del") {
      if (!confirm(`Apagar a ficha de “${sh.n}”? Não dá para desfazer.`)) return;
      sheets = sheets.filter(x => x !== sh);
      if (isGM) {
        for (const x of tokens) if (x.sh === sh.id) delete x.sh;
        save("tokens");
        shSaveGM();
        send("sheet", { del: sh.id });
      } else send("sheetreq", { del: sh.id, who: myNick });
      closeSheet();
      if (panelKind === "sheets") openSheetsPanel();
      return;
    }
  };
  // arrastar a janela pelo topo
  const hd = $("#swDrag");
  hd.onpointerdown = e => {
    if (e.target.closest("input,button,select,textarea,summary")) return;
    const r = w.getBoundingClientRect(),
      ox = e.clientX - r.left,
      oy = e.clientY - r.top;
    const mv = ev => {
      w.style.left = Math.max(0, Math.min(innerWidth - 80, ev.clientX - ox)) + "px";
      w.style.top = Math.max(0, Math.min(innerHeight - 50, ev.clientY - oy)) + "px";
    };
    const up = () => {
      removeEventListener("pointermove", mv);
      removeEventListener("pointerup", up);
    };
    addEventListener("pointermove", mv);
    addEventListener("pointerup", up);
  };
}
function shOnRemote(sh) {
  // chegou uma ficha nova/alterada
  if (!sheets) sheets = [];
  const i = sheets.findIndex(x => x.id === sh.id);
  if (i >= 0) sheets[i] = sh;
  else sheets.push(sh);
  if (shOpen === sh.id) {
    const a = document.activeElement;
    if (!(a && $("#sheetWin")?.contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName))) drawSheet();
  }
  if (panelKind === "sheets") openSheetsPanel();
}

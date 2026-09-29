"use strict";
// ---------- atalhos prontos para a barra: armas, magias, testes e coisas da ficha ----------
// Arma: [nome, dano, tipo, uso: "m" corpo a corpo (FOR), "f" acuidade (FOR ou DES), "r" distância (DES), emoji]
const HB_WEAPONS = [
  ["Ataque desarmado", "1", "contundente", "m", "👊"], ["Adaga", "1d4", "perfurante", "f", "🗡️"], ["Clava", "1d4", "contundente", "m", "🏏"],
  ["Bordão", "1d6", "contundente", "m", "🦯"], ["Maça", "1d6", "contundente", "m", "🔨"], ["Lança", "1d6", "perfurante", "m", "🔱"],
  ["Machadinha", "1d6", "cortante", "m", "🪓"], ["Azagaia", "1d6", "perfurante", "m", "🔱"], ["Foice curta", "1d4", "cortante", "m", "🌙"],
  ["Espada curta", "1d6", "perfurante", "f", "🗡️"], ["Espada longa", "1d8", "cortante", "m", "⚔️"], ["Espada longa (duas mãos)", "1d10", "cortante", "m", "⚔️"],
  ["Cimitarra", "1d6", "cortante", "f", "🗡️"], ["Rapieira", "1d8", "perfurante", "f", "🤺"], ["Machado de batalha", "1d8", "cortante", "m", "🪓"],
  ["Machado grande", "1d12", "cortante", "m", "🪓"], ["Montante", "2d6", "cortante", "m", "⚔️"], ["Alabarda", "1d10", "cortante", "m", "🔱"],
  ["Martelo de guerra", "1d8", "contundente", "m", "🔨"], ["Maça-estrela", "1d8", "perfurante", "m", "🔨"], ["Mangual", "1d8", "contundente", "m", "⛓️"],
  ["Arco curto", "1d6", "perfurante", "r", "🏹"], ["Arco longo", "1d8", "perfurante", "r", "🏹"], ["Besta leve", "1d8", "perfurante", "r", "🏹"],
  ["Besta pesada", "1d10", "perfurante", "r", "🏹"], ["Funda", "1d4", "contundente", "r", "🪨"], ["Dardo", "1d4", "perfurante", "f", "🎯"],
];
// Magia: [nome, nível, como: "atk" rola acerto | "DES"/"CON"/"SAB" salvaguarda | "auto" acerta sempre | "cura", dados, tipo, soma o mod. de conjuração?, emoji]
const HB_SPELLS = [
  ["Raio de fogo", 0, "atk", "1d10", "fogo", 0, "🔥"], ["Raio de gelo", 0, "atk", "1d8", "frio", 0, "❄️"], ["Rajada mística", 0, "atk", "1d10", "energia", 0, "🟣"],
  ["Toque chocante", 0, "atk", "1d8", "elétrico", 0, "⚡"], ["Toque arrepiante", 0, "atk", "1d8", "necrótico", 0, "💀"], ["Produzir chama", 0, "atk", "1d8", "fogo", 0, "🔥"],
  ["Chama sagrada", 0, "DES", "1d8", "radiante", 0, "✨"], ["Borrifo venenoso", 0, "CON", "1d12", "veneno", 0, "🤢"], ["Zombaria viciosa", 0, "SAB", "1d4", "psíquico", 0, "😈"],
  ["Mísseis mágicos", 1, "auto", "3d4+3", "energia", 0, "✨"], ["Mãos flamejantes", 1, "DES", "3d6", "fogo", 0, "🔥"], ["Onda trovejante", 1, "CON", "2d8", "trovão", 0, "💥"],
  ["Raio guiador", 1, "atk", "4d6", "radiante", 0, "🌟"], ["Infligir ferimentos", 1, "atk", "3d10", "necrótico", 0, "🖤"], ["Orbe cromático", 1, "atk", "3d8", "à escolha", 0, "🔮"],
  ["Raio adoecente", 1, "atk", "2d8", "veneno", 0, "🤢"], ["Curar ferimentos", 1, "cura", "1d8", "cura", 1, "💚"], ["Palavra curativa", 1, "cura", "1d4", "cura", 1, "💚"],
  ["Punição divina", 1, "auto", "2d8", "radiante", 0, "⚡"], ["Marca do caçador", 1, "auto", "1d6", "extra", 0, "🎯"], ["Bênção", 1, "auto", "1d4", "bônus", 0, "🙏"],
  ["Raio ardente (cada raio)", 2, "atk", "2d6", "fogo", 0, "🔥"], ["Flecha ácida", 2, "atk", "4d4", "ácido", 0, "🧪"], ["Estilhaçar", 2, "CON", "3d8", "trovão", 0, "💥"],
  ["Arma espiritual", 2, "atk", "1d8", "energia", 1, "🗡️"], ["Bola de fogo", 3, "DES", "8d6", "fogo", 0, "☄️"], ["Relâmpago", 3, "DES", "8d6", "elétrico", 0, "⚡"],
  ["Guardiões espirituais", 3, "SAB", "3d8", "radiante", 0, "👼"], ["Toque vampírico", 3, "atk", "3d6", "necrótico", 0, "🧛"], ["Palavra curativa em massa", 3, "cura", "1d4", "cura", 1, "💚"],
  ["Muralha de fogo", 4, "DES", "5d8", "fogo", 0, "🔥"], ["Tempestade de gelo", 4, "DES", "2d8+4d6", "contundente + frio", 0, "🌨️"], ["Cone de frio", 5, "CON", "8d8", "frio", 0, "❄️"],
  ["Coluna de chamas", 5, "DES", "8d6", "fogo + radiante", 0, "🔥"], ["Curar ferimentos em massa", 5, "cura", "3d8", "cura", 1, "💚"], ["Desintegrar", 6, "DES", "10d6+40", "energia", 0, "💢"],
];
const HB_OTHER = [
  ["Teste contra a morte", "1d20", "", "💀"], ["Iniciativa", "1d20", "", "⚡"], ["Poção de cura", "2d4+2", "", "🧪"], ["Poção de cura maior", "4d4+4", "", "🧪"],
  ["Inspiração bárdica", "1d6", "", "🎵"], ["Ataque furtivo (1d6)", "1d6", "", "🥷"], ["Ataque furtivo (3d6)", "3d6", "", "🥷"], ["Segundo fôlego", "1d10+1", "", "💪"],
  ["Dado de vida (d8)", "1d8", "", "❤️"], ["Dado de vida (d10)", "1d10", "", "❤️"], ["Moeda (cara ou coroa)", "1d2", "", "🪙"], ["Porcentagem", "1d100", "", "💯"],
];
let hbLibTab = "ficha", hbLibNums = null;
const sg = v => (v > 0 ? "+" + v : v < 0 ? String(v) : "");
function hbNumsFrom(sh) { // números usados para montar os atalhos (da ficha, se tiver)
  if (!sh) return hbLibNums || { for: 2, des: 2, prof: 2, conj: 3 };
  return { for: amod(sh, "for"), des: amod(sh, "des"), prof: profOf(sh), conj: castMod(sh) };
}
function hbLib(el, p, back) {
  const mine = (sheets || []).filter(s => canEditSh(s)), sh = mine.find(s => s.id === hbLib.sid) || mine[0] || null;
  if (sh) hbLib.sid = sh.id;
  const N = hbLibNums || hbNumsFrom(sh); hbLibNums = N;
  const pick = m => { Object.assign(p, { n: m.n.slice(0, 24), f: m.f, f2: m.f2 || "", e: m.e || p.e, d: m.d || "" }); back(); };
  const wpn = w => { const mod = w[3] === "r" ? N.des : w[3] === "f" ? Math.max(N.for, N.des) : N.for; return { n: w[0], f: "1d20" + sg(mod + N.prof), f2: w[1] === "1" ? String(1 + mod) : w[1] + sg(mod), e: w[4], d: w[2] }; };
  const cd = 8 + N.prof + N.conj;
  const spl = s => s[2] === "atk" ? { n: s[0], f: "1d20" + sg(N.prof + N.conj), f2: s[3] + (s[5] ? sg(N.conj) : ""), e: s[6], d: s[4] } : { n: s[0] + (/^(DES|CON|SAB)$/.test(s[2]) ? ` (CD ${cd})` : ""), f: s[3] + (s[5] ? sg(N.conj) : ""), e: s[6], d: s[2] === "cura" ? "cura" : s[4] + (/^(DES|CON|SAB)$/.test(s[2]) ? ` · salvaguarda de ${s[2]}` : "") };
  const fichaItems = sh ? [
    ...(sh.atk || []).filter(a => a.n || a.d).map(a => { const m = a.a === "mag" ? castMod(sh) : a.a ? amod(sh, a.a) : 0, hit = m + (a.pr ? profOf(sh) : 0) + (+a.bx || 0); return { n: a.n || "Ataque", f: d20(hit), f2: a.d ? a.d + (a.dm && m ? sg(m) : "") : "", e: "⚔️", d: a.t || "ataque" }; }),
    ...(sh.sp_ || []).filter(s => s.f || s.atk).map(s => ({ n: s.n || "Magia", f: s.atk ? d20(profOf(sh) + castMod(sh)) : s.f, f2: s.atk ? s.f : "", e: "✨", d: s.l ? s.l + "º nível" : "truque" })),
    { n: "Iniciativa", f: d20(amod(sh, "des") + (+sh.ib || 0)), e: "⚡", d: "" },
    ...ATTRS.map(([k, n, s]) => ({ n: "Salv. " + s, f: d20(saveMod(sh, k)), e: "🛡️", d: "salvaguarda" })),
    ...SKILLS.map(s => ({ n: s[1], f: d20(skillMod(sh, s)), e: "🎯", d: "perícia" })),
  ] : [];
  const tabs = [...(mine.length ? [["ficha", "📜 Da minha ficha"]] : []), ["armas", "⚔️ Armas"], ["magias", "✨ Magias"], ["testes", "🎯 Testes"], ["outros", "🎲 Outros"]];
  if (!tabs.some(t => t[0] === hbLibTab)) hbLibTab = tabs[0][0];
  const card = (m, i) => `<button class="hbl-it" data-hl="${i}" title="${esc(m.f)}${m.f2 ? " · dano " + esc(m.f2) : ""}"><span class="hbl-e">${esc(m.e || "🎲")}</span><span class="hbl-n"><b>${esc(m.n)}</b><small>${esc(m.f)}${m.f2 ? " → " + esc(m.f2) : ""}${m.d ? " · " + esc(m.d) : ""}</small></span></button>`;
  let items = [];
  if (hbLibTab === "ficha") items = fichaItems;
  else if (hbLibTab === "armas") items = HB_WEAPONS.map(wpn);
  else if (hbLibTab === "magias") items = HB_SPELLS.map(s => ({ ...spl(s), lv: s[1] }));
  else if (hbLibTab === "testes") items = [{ n: "Iniciativa", f: d20(N.des), e: "⚡" }, ...ATTRS.map(([k, n, s]) => ({ n: "Teste de " + n, f: "1d20", e: "🎲", d: "some o seu modificador" })), ...SKILLS.map(s => ({ n: s[1], f: "1d20", e: "🎯", d: s[2].toUpperCase() }))];
  else items = HB_OTHER.map(o => ({ n: o[0], f: o[1], e: o[3] }));
  el.innerHTML = `<div class="hbl-head"><b>📚 Atalhos prontos</b><span class="spacer"></span><button class="btn small" data-hlback>← Voltar</button></div>
    <div class="hbl-tabs">${tabs.map(([k, l]) => `<button data-hlt="${k}" aria-pressed="${hbLibTab === k}">${l}</button>`).join("")}</div>
    ${hbLibTab === "ficha" ? `<div class="hbl-nums">${mine.length > 1 ? `<select id="hlSh">${mine.map(s => `<option value="${esc(s.id)}" ${s.id === sh?.id ? "selected" : ""}>${esc(s.n)}</option>`).join("")}</select>` : `<span>Ficha: <b>${esc(sh?.n || "")}</b></span>`}<span class="spacer"></span><button class="btn small primary" data-hlfill title="Coloca os ataques e magias da ficha nos espaços vazios da barra">＋ Encher a barra com a ficha</button></div>`
      : hbLibTab === "armas" || hbLibTab === "magias" ? `<div class="hbl-nums" title="Os atalhos são montados com estes números (vêm da sua ficha, se tiver)">${hbLibTab === "armas" ? `<label>FOR <input data-hn="for" value="${sg(N.for) || 0}"></label><label>DES <input data-hn="des" value="${sg(N.des) || 0}"></label>` : `<label>Mod. de conjuração <input data-hn="conj" value="${sg(N.conj) || 0}"></label><span>CD ${cd}</span>`}<label>Proficiência <input data-hn="prof" value="+${N.prof}"></label></div>` : ""}
    <div class="hbl-list">${hbLibTab === "magias" ? [0, 1, 2, 3, 4, 5, 6].map(l => { const L = items.map((m, i) => [m, i]).filter(([m]) => m.lv === l); return L.length ? `<div class="hbl-lv">${l ? l + "º nível" : "Truques"}</div>` + L.map(([m, i]) => card(m, i)).join("") : ""; }).join("") : items.map(card).join("") || `<p class="hint">Nada aqui.</p>`}</div>
    <p class="hint" style="margin:6px 0 0">Clique para usar. Armas e magias de ataque rolam o acerto e, logo depois, o dano (dano dobrado no 20 natural).</p>`;
  el.onclick = e => {
    const b = e.target.closest("button"); if (!b) return; const d = b.dataset;
    if (d.hlback != null) return back();
    if (d.hlt) { hbLibTab = d.hlt; return hbLib(el, p, back); }
    if (d.hl != null) return pick(items[+d.hl]);
    if (d.hlfill != null) { let n = 0; for (const m of fichaItems.filter(m => m.f2 || m.e === "✨")) { if (hbAdd({ n: m.n.slice(0, 24), f: m.f.replace(/\s+/g, ""), f2: (m.f2 || "").replace(/\s+/g, ""), c: HB_COLORS[(n * 3 + 2) % HB_COLORS.length], e: m.e, d: m.d }) < 0) break; n++; } toast(n ? `＋ ${n} atalho${n > 1 ? "s" : ""} na barra.` : "Nenhum ataque ou magia com dados nessa ficha."); if (n) el.remove(); }
  };
  el.onchange = e => { if (e.target.id === "hlSh") { hbLib.sid = e.target.value; hbLibNums = null; return hbLib(el, p, back); } const k = e.target.dataset.hn; if (k) { hbLibNums = { ...N, [k]: Math.round(+String(e.target.value).replace(",", ".")) || 0 }; hbLib(el, p, back); } };
  el.onkeydown = e => { e.stopPropagation(); if (e.key === "Escape") back(); };
}
function hbRoll(p) { // rola o atalho; se tiver dano, rola em seguida (dobra os dados no crítico)
  const r = doRoll(p.f, 0, p.n, false);
  if (!p.f2) return;
  const crit = r && r.dice?.some(x => x.d === 20 && !x.x && x.v === 20), fumble = r && r.dice?.some(x => x.d === 20 && !x.x && x.v === 1) && !r.dice.some(x => x.d === 20 && !x.x && x.v > 1);
  if (fumble) return;
  const f2 = crit ? p.f2.replace(/(\d*)d(\d+)/g, (m, n, x) => (2 * (+n || 1)) + "d" + x) : p.f2;
  setTimeout(() => doRoll(f2, 0, p.n + (crit ? " · dano CRÍTICO" : " · dano"), false), 350);
}

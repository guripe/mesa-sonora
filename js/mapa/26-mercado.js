"use strict";
// ---------- mercado: o mestre monta lojas, os jogadores compram e vendem com o dinheiro da ficha ----------
// Linha 994 do map_state (coluna drawings): [{id, n, open, mult (%), items: [{id, n, p (preço em pc), q (estoque, -1 = sem limite), d, c (categoria)}]}]
const MK_ROW = 994;
const COIN = { pc: 1, pp: 10, pe: 50, po: 100, pl: 1000 };
let shops = null, mkShop = null, mkTab = "buy", mkCart = {}, mkSheet = null, mkCatQ = "", mkCatC = "", mkAdd = false;
const mkPrice = (s, it) => Math.max(0, Math.round((+it.p || 0) * (+s.mult || 100) / 100));
function fmtMoney(pc) { // 1234 pc -> "12 po 3 pp 4 pc"
  pc = Math.max(0, Math.round(+pc || 0)); if (!pc) return "0 po";
  const po = Math.floor(pc / 100), pp = Math.floor((pc % 100) / 10), c = pc % 10;
  return [po && po.toLocaleString("pt-BR") + " po", pp && pp + " pp", c && c + " pc"].filter(Boolean).join(" ");
}
const wealth = sh => Object.entries(COIN).reduce((a, [k, v]) => a + (+sh.money?.[k] || 0) * v, 0);
function payFrom(sh, cost) { // tira o valor das moedas (paga com as menores primeiro e recebe troco)
  const m = { ...(sh.money || {}) }, order = ["pc", "pp", "pe", "po", "pl"]; let need = cost;
  for (const k of order) { const use = Math.min(+m[k] || 0, Math.floor(need / COIN[k])); m[k] = (+m[k] || 0) - use; need -= use * COIN[k]; }
  if (need > 0) { const k = order.find(k => (+m[k] || 0) > 0 && COIN[k] >= need); if (!k) return false; m[k]--; addCoins(m, COIN[k] - need); }
  for (const k in m) if (!m[k]) delete m[k];
  sh.money = m; return true;
}
function addCoins(m, pc) { for (const [k, v] of [["po", 100], ["pp", 10], ["pc", 1]]) { const n = Math.floor(pc / v); if (n) { m[k] = (+m[k] || 0) + n; pc -= n * v; } } return m; }
function invAdd(sh, n, q) { sh.inv = sh.inv || []; const it = sh.inv.find(i => i.n.toLowerCase() === n.toLowerCase()); if (it) it.q = (+it.q || 0) + q; else sh.inv.push({ n, q }); }
async function mkLoad() {
  const { data, error } = await sb.from("map_state").select("drawings").eq("id", MK_ROW).maybeSingle();
  shops = !error && Array.isArray(data?.drawings) ? data.drawings : shops || [];
}
let mkSaveT = null;
function mkSave(announce) { // mestre: grava e manda para todos
  if (!isGM) return; clearTimeout(mkSaveT);
  mkSaveT = setTimeout(async () => {
    const { error } = await sb.from("map_state").upsert({ id: MK_ROW, drawings: shops, updated_at: new Date().toISOString() });
    if (error) return toast("Não salvei o mercado: " + error.message);
    send("shops", { shops: JSON.stringify(shops).length < 150000 ? shops : null, open: announce || null });
  }, 350);
}
const openShops = () => (shops || []).filter(s => s.open);
function mkDot() { const b = $("#pShop"); if (b) { b.hidden = !openShops().length; const d = b.querySelector(".tdot"); if (d && !openShops().length) d.hidden = true; } }
function mkFromCatalog(sel) { // lista de itens do catálogo por categorias/nomes
  return MK_ITEMS.filter(i => sel.includes(i[1]) || sel.includes(i[0])).map(i => ({ id: uid(), n: i[0], p: i[2], q: -1, d: i[3], c: i[1] }));
}
// ---- painel ----
async function openShopPanel() {
  panelKind = "shop";
  if (!shops) await mkLoad();
  if (panelKind !== "shop") return;
  const list = isGM ? shops : openShops();
  if (!list.some(s => s.id === mkShop)) mkShop = list[0]?.id || null;
  const s = list.find(x => x.id === mkShop);
  const tabs = list.map(x => `<button data-mks="${esc(x.id)}" aria-pressed="${x.id === mkShop}">${esc(x.n)}${isGM ? (x.open ? " 🟢" : " ⚪") : ""}</button>`).join("");
  let body = "";
  if (!s) body = isGM ? `<p class="hint">Nenhuma loja ainda. Crie uma do zero ou comece com uma pronta:</p><div class="mk-presets">${MK_PRESETS.map((p, i) => `<button class="btn small" data-mkp="${i}">${p[0]}</button>`).join("")}</div>` : `<p class="hint">Nenhuma loja aberta agora. Quando o mestre abrir uma, ela aparece aqui.</p>`;
  else if (isGM) body = mkGMBody(s);
  else body = mkPlayerBody(s);
  $("#panel").innerHTML = `<div class="panel mk-panel" role="dialog" aria-label="Mercado"><h3>🛒 Mercado<button class="btn small" id="pClose">Fechar</button></h3>
    ${list.length || isGM ? `<div class="mk-tabs">${tabs}${isGM ? `<button data-mknew title="Nova loja">＋ Loja</button>` : ""}</div>` : ""}${body}</div>`;
  const P = $("#panel");
  $("#pClose").onclick = closePanel;
  P.onkeydown = e => e.stopPropagation();
  P.onclick = e => mkClick(e, s);
  P.onchange = e => mkChange(e, s);
  const cq = $("#mkCatQ"); if (cq) cq.oninput = () => { mkCatQ = cq.value; const pos = cq.selectionStart; openShopPanel().then(() => { const n = $("#mkCatQ"); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }); };
}
function mkGMBody(s) {
  const cat = mkCatC, q = mkCatQ.trim().toLowerCase();
  const cands = MK_ITEMS.filter(i => (!cat || i[1] === cat) && (!q || i[0].toLowerCase().includes(q)));
  return `<div class="mk-head"><input data-mkf="n" value="${esc(s.n)}" maxlength="40" aria-label="Nome da loja">
      <label class="chk mk-open" title="Os jogadores só veem lojas abertas"><input type="checkbox" data-mkf="open" ${s.open ? "checked" : ""}> Aberta para os jogadores</label></div>
    <div class="mk-row"><label>Preços <input data-mkf="mult" type="number" min="10" max="1000" step="5" value="${+s.mult || 100}" style="width:64px">%</label><span class="hint">100% = preço do livro · 150% = cidade cara · 75% = promoção</span></div>
    <div class="mk-items">${(s.items || []).map((it, i) => `<div class="mk-it gm"><span class="mk-ic">${MK_CATS.find(c => c[0] === it.c)?.[2] || "📦"}</span>
        <input data-mki="${i}" data-k="n" value="${esc(it.n)}" class="grow" maxlength="50">
        <label class="mini" title="Preço em peças de ouro (0,1 = 1 pp)"><input data-mki="${i}" data-k="p" value="${esc(+(it.p / 100).toFixed(2))}" style="width:54px" inputmode="decimal">po</label>
        <label class="mini" title="Estoque (vazio = sem limite)">📦<input data-mki="${i}" data-k="q" value="${it.q < 0 ? "" : it.q}" placeholder="∞" style="width:34px" inputmode="numeric"></label>
        <button class="sw-x" data-mkdel="${i}" title="Tirar da loja">✕</button></div>`).join("") || `<p class="hint">Loja vazia. Adicione itens do catálogo abaixo.</p>`}</div>
    <div class="acts"><button class="btn small" data-mkadd>${mkAdd ? "▾" : "▸"} Adicionar do catálogo</button><button class="btn small" data-mkown>＋ Item próprio</button><span class="spacer"></span><button class="btn small danger" data-mkrm>Apagar loja</button></div>
    ${mkAdd ? `<div class="mk-cat"><input id="mkCatQ" placeholder="Buscar item…" value="${esc(mkCatQ)}" autocomplete="off">
      <div class="bst-cats"><button data-mkc="" aria-pressed="${!cat}">Todos</button>${MK_CATS.map(c => `<button data-mkc="${c[0]}" aria-pressed="${cat === c[0]}">${c[2]} ${c[1]}</button>`).join("")}${cat ? `<button data-mkall="${cat}" title="Coloca todos desta categoria">＋ todos</button>` : ""}</div>
      <div class="mk-cands">${cands.map(i => { const has = (s.items || []).some(x => x.n === i[0]); return `<button class="mk-cand ${has ? "has" : ""}" data-mkcand="${esc(i[0])}" title="${esc(i[3])}">${has ? "✓ " : "＋ "}${esc(i[0])} <small>${fmtMoney(i[2])}</small></button>`; }).join("")}</div></div>` : ""}`;
}
function mkPlayerBody(s) {
  const mine = (sheets || []).filter(sh => canEditSh(sh));
  if (!mine.some(x => x.id === mkSheet)) mkSheet = mine[0]?.id || null;
  const sh = mine.find(x => x.id === mkSheet);
  const total = Object.entries(mkCart).reduce((a, [id, q]) => { const it = s.items.find(x => x.id === id); return a + (it ? mkPrice(s, it) * q : 0); }, 0);
  const sellable = sh ? (sh.inv || []).filter(i => (+i.q || 0) > 0 && s.items.some(x => x.n.toLowerCase() === i.n.toLowerCase())) : [];
  return `${!mine.length ? `<p class="hint">Você precisa de uma ficha para comprar (botão de ficha na barra da esquerda). O dinheiro sai das moedas da ficha.</p>` : `
    <div class="mk-row mk-who"><label>Quem compra <select id="mkSheet">${mine.map(x => `<option value="${esc(x.id)}" ${x.id === mkSheet ? "selected" : ""}>${esc(x.n)}</option>`).join("")}</select></label>
      <span class="mk-purse">💰 ${sh ? fmtMoney(wealth(sh)) : ""}</span></div>
    <div class="mk-sub"><button data-mkt="buy" aria-pressed="${mkTab === "buy"}">Comprar</button><button data-mkt="sell" aria-pressed="${mkTab === "sell"}">Vender${sellable.length ? ` (${sellable.length})` : ""}</button></div>`}
    ${mkTab === "sell" && sh ? `<div class="mk-items">${sellable.map(i => { const it = s.items.find(x => x.n.toLowerCase() === i.n.toLowerCase()), p = Math.floor(mkPrice(s, it) / 2); return `<div class="mk-it"><span class="mk-ic">${MK_CATS.find(c => c[0] === it.c)?.[2] || "📦"}</span><span class="mk-n"><b>${esc(i.n)}</b><small>você tem ${i.q}</small></span><span class="mk-p">${fmtMoney(p)}</span><button class="btn small" data-mksell="${esc(i.n)}">Vender 1</button></div>`; }).join("") || `<p class="hint">Nada na sua mochila que esta loja compre. Ela paga metade do preço dela.</p>`}</div>`
    : `<div class="mk-items">${(s.items || []).map(it => { const q = mkCart[it.id] || 0, out = it.q === 0; return `<div class="mk-it ${out ? "out" : ""}"><span class="mk-ic">${MK_CATS.find(c => c[0] === it.c)?.[2] || "📦"}</span><span class="mk-n"><b>${esc(it.n)}</b><small>${esc(it.d || "")}${it.q > 0 ? ` · ${it.q} em estoque` : out ? " · esgotado" : ""}</small></span><span class="mk-p">${fmtMoney(mkPrice(s, it))}</span>
        ${out || !sh ? "" : `<span class="mk-qty">${q ? `<button data-mkq="${esc(it.id)}" data-d="-1">−</button><b>${q}</b>` : ""}<button data-mkq="${esc(it.id)}" data-d="1">＋</button></span>`}</div>`; }).join("") || `<p class="hint">Prateleiras vazias.</p>`}</div>
      ${sh ? `<div class="mk-foot"><span>Total: <b>${fmtMoney(total)}</b>${total > wealth(sh) ? ` <em class="mk-no">falta ${fmtMoney(total - wealth(sh))}</em>` : ""}</span><span class="spacer"></span>${total ? `<button class="btn small" data-mkclr>Limpar</button>` : ""}<button class="btn small primary" data-mkbuy ${!total || total > wealth(sh) ? "disabled" : ""}>🛒 Comprar</button></div>` : ""}`}
    <p class="hint">A compra vai para o Inventário da ficha e o dinheiro sai das moedas. O mestre precisa estar com o mapa aberto.</p>`;
}
function mkClick(e, s) {
  const b = e.target.closest("button"); if (!b) return; const d = b.dataset;
  if (d.mks) { mkShop = d.mks; mkCart = {}; return openShopPanel(); }
  if (d.mkt) { mkTab = d.mkt; return openShopPanel(); }
  if (d.mkq) { mkCart[d.mkq] = Math.max(0, (mkCart[d.mkq] || 0) + +d.d); const it = s.items.find(x => x.id === d.mkq); if (it?.q > 0) mkCart[d.mkq] = Math.min(mkCart[d.mkq], it.q); if (!mkCart[d.mkq]) delete mkCart[d.mkq]; return openShopPanel(); }
  if (d.mkclr != null) { mkCart = {}; return openShopPanel(); }
  if (d.mkbuy != null) { const cart = Object.entries(mkCart).map(([i, q]) => ({ i, q })); if (!cart.length) return; b.disabled = true; b.textContent = "…"; send("buyreq", { id: uid(), sh: mkSheet, shop: s.id, cart, who: myNick }); mkWait = setTimeout(() => { toast("O mestre não respondeu. Ele está com o mapa aberto?", 3500); openShopPanel(); }, 6000); return; }
  if (d.mksell) { send("sellreq", { id: uid(), sh: mkSheet, shop: s.id, n: d.mksell, q: 1, who: myNick }); b.disabled = true; return; }
  if (!isGM) return;
  if (d.mknew != null) { const ns = { id: uid(), n: "Nova loja", open: false, mult: 100, items: [] }; shops.push(ns); mkShop = ns.id; mkAdd = true; mkSave(); return openShopPanel(); }
  if (d.mkp != null) { const p = MK_PRESETS[+d.mkp], ns = { id: uid(), n: p[1], open: false, mult: 100, items: mkFromCatalog(p[2]) }; shops.push(ns); mkShop = ns.id; mkSave(); toast(`Loja “${ns.n}” criada com ${ns.items.length} itens. Marque “Aberta” quando os jogadores chegarem.`, 3500); return openShopPanel(); }
  if (!s) return;
  if (d.mkdel != null) { s.items.splice(+d.mkdel, 1); mkSave(); return openShopPanel(); }
  if (d.mkadd != null) { mkAdd = !mkAdd; return openShopPanel(); }
  if (d.mkc != null) { mkCatC = d.mkc; return openShopPanel(); }
  if (d.mkall) { for (const it of mkFromCatalog([d.mkall])) if (!s.items.some(x => x.n === it.n)) s.items.push(it); mkSave(); return openShopPanel(); }
  if (d.mkcand) { const i = s.items.findIndex(x => x.n === d.mkcand); if (i >= 0) s.items.splice(i, 1); else s.items.push(mkFromCatalog([d.mkcand])[0]); mkSave(); return openShopPanel(); }
  if (d.mkown != null) { s.items.push({ id: uid(), n: "Item novo", p: 100, q: -1, d: "", c: "" }); mkSave(); openShopPanel(); setTimeout(() => { const L = $("#panel").querySelectorAll('[data-k="n"]'); L[L.length - 1]?.select(); }, 30); return; }
  if (d.mkrm != null) { if (!confirm(`Apagar a loja “${s.n}”?`)) return; shops = shops.filter(x => x !== s); mkSave(); return openShopPanel(); }
}
let mkWait = null;
function mkChange(e, s) {
  const el = e.target;
  if (el.id === "mkSheet") { mkSheet = el.value; return openShopPanel(); }
  if (!isGM || !s) return;
  if (el.dataset.mkf) { const k = el.dataset.mkf; if (k === "open") { s.open = el.checked; mkSave(s.open ? s.n : null); toast(s.open ? `🟢 “${s.n}” aberta: os jogadores já podem comprar.` : `“${s.n}” fechada.`); return openShopPanel(); } s[k] = k === "mult" ? Math.max(10, Math.min(1000, +el.value || 100)) : el.value.slice(0, 40); mkSave(); return; }
  if (el.dataset.mki != null) { const it = s.items[+el.dataset.mki], k = el.dataset.k; if (!it) return;
    if (k === "n") it.n = el.value.slice(0, 50); else if (k === "p") it.p = Math.max(0, Math.round((+String(el.value).replace(",", ".") || 0) * 100)); else it.q = el.value.trim() === "" ? -1 : Math.max(0, Math.round(+el.value || 0));
    mkSave(); }
}
// ---- o mestre confere as compras e vendas ----
function mkBuy(p) {
  if (!isGM || !shops || !sheets) return;
  const who = String(p.who || ""), reply = (ok, msg) => send("buyres", { id: p.id, to: who, ok, msg });
  const sh = shById(String(p.sh)), s = shops.find(x => x.id === p.shop && x.open);
  if (!sh || !sh.o || !(sh.o === "*" || sh.o.toLowerCase() === who.toLowerCase())) return reply(false, "Essa ficha não é sua.");
  if (!s) return reply(false, "A loja está fechada.");
  let cost = 0; const lines = [];
  for (const c of (Array.isArray(p.cart) ? p.cart : []).slice(0, 40)) { const it = s.items.find(x => x.id === c.i), q = Math.max(1, Math.min(99, Math.round(+c.q || 0)));
    if (!it) return reply(false, "Um item não existe mais. Abra a loja de novo."); if (it.q >= 0 && it.q < q) return reply(false, `Só tem ${it.q} de ${it.n}.`); cost += mkPrice(s, it) * q; lines.push([it, q]); }
  if (!lines.length) return;
  if (wealth(sh) < cost) return reply(false, `Dinheiro insuficiente: custa ${fmtMoney(cost)}.`);
  payFrom(sh, cost);
  for (const [it, q] of lines) { invAdd(sh, it.n, q); if (it.q > 0) it.q -= q; }
  shCommit(sh); mkSave(); if (shOpen === sh.id) drawSheet();
  const txt = lines.map(([it, q]) => (q > 1 ? q + "× " : "") + it.n).join(", ");
  reply(true, `Comprado: ${txt} por ${fmtMoney(cost)}.`);
  const prevTo = chatTo; chatTo = ""; chatSend(`🛒 ${sh.n} comprou ${txt} em ${s.n} (${fmtMoney(cost)}).`); chatTo = prevTo;
  if (panelKind === "shop") openShopPanel();
}
function mkSell(p) {
  if (!isGM || !shops || !sheets) return;
  const who = String(p.who || ""), reply = (ok, msg) => send("buyres", { id: p.id, to: who, ok, msg });
  const sh = shById(String(p.sh)), s = shops.find(x => x.id === p.shop && x.open);
  if (!sh || !sh.o || !(sh.o === "*" || sh.o.toLowerCase() === who.toLowerCase()) || !s) return reply(false, "Não deu para vender.");
  const n = String(p.n || "").toLowerCase(), inv = (sh.inv || []).find(i => i.n.toLowerCase() === n && +i.q > 0), it = s.items.find(x => x.n.toLowerCase() === n);
  if (!inv || !it) return reply(false, "Essa loja não compra isso.");
  const val = Math.floor(mkPrice(s, it) / 2);
  inv.q = +inv.q - 1; if (inv.q <= 0) sh.inv = sh.inv.filter(i => i !== inv);
  sh.money = addCoins({ ...(sh.money || {}) }, val); if (it.q >= 0) it.q++;
  shCommit(sh); mkSave(); if (shOpen === sh.id) drawSheet();
  reply(true, `Vendido: ${it.n} por ${fmtMoney(val)}.`);
  if (panelKind === "shop") openShopPanel();
}

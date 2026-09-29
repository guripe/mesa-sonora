"use strict";
// ---------- chat de texto (com sussurro) + histórico junto das rolagens ----------
// linha 996 do map_state (coluna drawings): [{id, at, w, c, to, tx}] ou rolagem {id, at, w, c, rl: {l, t, f}}. O mestre grava.
const CH_ROW = 996;
let chatLog = [],
  chatOpen = false,
  chatUnread = 0,
  chatTo = "",
  chatLoaded = false,
  chatSaveT = null;
const meName = () => (isGM ? "Mestre" : myNick || "Jogador");
const myColor = () => {
  const t = tokens.find(x => !isProp(x) && owns(x) && !isGM);
  return t?.c || (isGM ? "#d0a54c" : "#9fb7d8");
};
function chatSees(m) {
  // sussurros: só quem mandou, quem recebeu e o mestre
  if (!m.to) return true;
  if (isGM) return true;
  const me = String(myNick || "").toLowerCase();
  return String(m.w || "").toLowerCase() === me || String(m.to).toLowerCase() === me;
}
async function chatLoad() {
  const { data, error } = await sb.from("map_state").select("drawings").eq("id", CH_ROW).maybeSingle();
  if (error) return;
  const L = Array.isArray(data?.drawings) ? data.drawings : [];
  const ids = new Set(L.map(m => m.id));
  chatLog = [...L, ...chatLog.filter(m => !ids.has(m.id))]
    .sort((a, b) => (a.at || 0) - (b.at || 0))
    .slice(-300);
  chatLoaded = true;
  if (chatOpen) drawChat();
}
function chatSaveGM() {
  if (!isGM || EDIT_ID) return;
  clearTimeout(chatSaveT);
  chatSaveT = setTimeout(async () => {
    await sb
      .from("map_state")
      .upsert({ id: CH_ROW, drawings: chatLog.slice(-300), updated_at: new Date().toISOString() });
  }, 1500);
}
function chatPush(m, fromNet) {
  if (!m?.id || chatLog.some(x => x.id === m.id)) return;
  chatLog.push(m);
  if (chatLog.length > 320) chatLog.splice(0, chatLog.length - 300);
  if (isGM) chatSaveGM();
  if (!chatSees(m)) return;
  if (chatOpen) drawChat();
  else if (fromNet && !m.rl) {
    chatUnread++;
    drawDiceLog();
    chatBubble(m);
  }
}
function chatSend(txt) {
  txt = String(txt || "")
    .trim()
    .slice(0, 500);
  if (!txt) return;
  const cmd = /^\/(r|roll|rolar)\s+(.+)$/i.exec(txt);
  if (cmd) {
    doRoll(cmd[2]);
    return;
  }
  const m = { id: uid(), at: Date.now(), w: meName(), c: myColor(), to: chatTo || "", tx: txt };
  chatPush(m);
  send("chat", { m });
}
function chatRoll(r) {
  // rolagem que terminou: entra no histórico do chat
  if (r.secret) return;
  chatPush({
    id: "r" + r.id,
    at: Date.now(),
    w: String(r.who || "?").slice(0, 30),
    c: r.col || "#d0a54c",
    rl: { l: String(r.label || "").slice(0, 40), t: r.total, f: String(r.f || "").slice(0, 60) },
  });
}
function chatBubble(m) {
  const b = document.createElement("div");
  b.className = "chatbub";
  b.innerHTML = `<b style="color:${esc(m.c || "#d0a54c")}">${esc(m.w)}</b>${m.to ? ` <i>sussurra</i>` : ""}: ${esc(m.tx).slice(0, 140)}`;
  b.onclick = () => {
    b.remove();
    openChat();
  };
  document.body.appendChild(b);
  setTimeout(() => b.classList.add("out"), 4200);
  setTimeout(() => b.remove(), 4700);
  if (DS.init()) DS.tone(DS.ctx.currentTime, 880, 0.08, 0.05, "sine");
}
function openChat() {
  chatOpen = true;
  chatUnread = 0;
  drawDiceLog();
  drawChat();
  if (!chatLoaded) chatLoad();
  setTimeout(() => $("#chatIn")?.focus(), 30);
}
function closeChat() {
  chatOpen = false;
  $("#chatBox")?.remove();
  drawDiceLog();
}
const hhmm = at => {
  const d = new Date(at || 0);
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
};
function drawChat() {
  let el = $("#chatBox");
  const keepVal = $("#chatIn")?.value || "",
    hadFocus = document.activeElement?.id === "chatIn";
  if (!el) {
    el = document.createElement("div");
    el.id = "chatBox";
    el.className = "chatbox";
    document.body.appendChild(el);
    el.onpointerdown = e => e.stopPropagation();
    el.onwheel = e => e.stopPropagation();
  }
  const others = [
    ...new Set(peersOnMap.filter(n => n && n.toLowerCase() !== String(myNick || "").toLowerCase())),
  ];
  const targets = [
    ["", "Todos"],
    ...(isGM ? [] : [["@gm", "Mestre (sussurro)"]]),
    ...others.map(n => [n, n + " (sussurro)"]),
  ];
  if (chatTo && !targets.some(t => t[0] === chatTo))
    targets.push([chatTo, chatTo === "@gm" ? "Mestre (sussurro)" : chatTo + " (sussurro)"]);
  const rows = chatLog
    .filter(chatSees)
    .slice(-120)
    .map(m =>
      m.rl
        ? `<div class="cm roll"><span class="ct">${hhmm(m.at)}</span><b style="color:${esc(m.c)}">${esc(m.w)}</b> 🎲 ${m.rl.l ? `<i>${esc(m.rl.l)}</i> ` : ""}<span class="cf">${esc(m.rl.f)}</span> = <b class="cr">${esc(m.rl.t)}</b></div>`
        : `<div class="cm ${m.to ? "wh" : ""}"><span class="ct">${hhmm(m.at)}</span><b style="color:${esc(m.c)}">${esc(m.w)}</b>${m.to ? ` <i class="cwh">→ ${esc(m.to === "@gm" ? "Mestre" : m.to)}</i>` : ""}: ${esc(m.tx)}</div>`,
    )
    .join("");
  el.innerHTML = `<div class="cb-head"><b>💬 Chat</b><span class="spacer"></span><button class="be-x" id="chatX" aria-label="Fechar chat">✕</button></div>
    <div class="cb-rows" id="chatRows">${rows || `<p class="hint" style="margin:8px">Nenhuma mensagem ainda. Escreva abaixo. Para rolar daqui: <b>/r 1d20+3</b></p>`}</div>
    <form class="cb-form" id="chatForm"><select id="chatTo" aria-label="Para quem">${targets.map(([v, l]) => `<option value="${esc(v)}" ${v === chatTo ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>
      <input id="chatIn" maxlength="500" autocomplete="off" placeholder="${chatTo ? "Sussurro…" : "Mensagem… ( /r 1d20 rola )"}" value="${esc(keepVal)}"><button class="btn small primary" type="submit">Enviar</button></form>`;
  const R = $("#chatRows");
  R.scrollTop = R.scrollHeight;
  $("#chatX").onclick = closeChat;
  $("#chatTo").onchange = e => {
    chatTo = e.target.value;
    drawChat();
    $("#chatIn").focus();
  };
  const inp = $("#chatIn");
  inp.onkeydown = e => {
    e.stopPropagation();
    if (e.key === "Escape") closeChat();
  };
  $("#chatForm").onsubmit = e => {
    e.preventDefault();
    const v = inp.value;
    inp.value = "";
    chatSend(v);
    inp.focus();
  };
  if (hadFocus) inp.focus();
}
// ---------- backup: baixa e restaura tudo (mapas, fichas, anotações, chat, lista de sons) ----------
async function backupDownload() {
  const t = toast("Preparando o backup…", 8000);
  const [m, so, fo, lv] = await Promise.all([
    sb.from("map_state").select("*"),
    sb.from("sounds").select("*"),
    sb.from("folders").select("*"),
    sb.from("live_state").select("*"),
  ]);
  if (m.error) return toast("Não consegui ler os mapas: " + m.error.message);
  const data = {
    app: "mesa-sonora",
    v: 1,
    at: new Date().toISOString(),
    map_state: m.data || [],
    sounds: so.data || [],
    folders: fo.data || [],
    live_state: lv.data || [],
  };
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" }),
    a = document.createElement("a"),
    d = new Date();
  a.href = URL.createObjectURL(blob);
  a.download = `mesa-sonora-backup-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 1000);
  const nm = data.map_state.filter(r => r.id >= 1000).length;
  toast(
    `💾 Backup baixado: ${nm} mapa${nm === 1 ? "" : "s"} salvo${nm === 1 ? "" : "s"}, ${data.sounds.length} sons, fichas, anotações e chat.`,
    4000,
  );
}
function backupRestore() {
  const inp = document.createElement("input");
  inp.type = "file";
  inp.accept = ".json,application/json";
  inp.onchange = async () => {
    const f = inp.files?.[0];
    if (!f) return;
    let data;
    try {
      data = JSON.parse(await f.text());
    } catch {
      return toast("Esse arquivo não é um backup válido.");
    }
    if (data?.app !== "mesa-sonora" || !Array.isArray(data.map_state))
      return toast("Esse arquivo não é um backup da Mesa Sonora.");
    const nm = data.map_state.filter(r => r.id >= 1000).length,
      when = (() => {
        try {
          return new Date(data.at).toLocaleString("pt-BR");
        } catch {
          return "?";
        }
      })();
    if (
      !confirm(
        `Restaurar o backup de ${when}?\n\n${nm} mapas salvos, ${(data.sounds || []).length} sons, fichas, anotações e o mapa da mesa.\n\nO que tiver o mesmo nome/número agora será substituído pelo do backup. Mapas e sons criados depois do backup continuam.`,
      )
    )
      return;
    toast("Restaurando…", 8000);
    const clean = r => {
      const o = { ...r };
      delete o.created_at;
      return o;
    };
    const ms = data.map_state.map(clean);
    for (let i = 0; i < ms.length; i += 4) {
      const { error } = await sb.from("map_state").upsert(ms.slice(i, i + 4));
      if (error) return toast("Parou no meio: " + error.message);
    }
    if (Array.isArray(data.folders) && data.folders.length) {
      const { error } = await sb.from("folders").upsert(data.folders);
      if (error) toast("Pastas de sons: " + error.message);
    }
    if (Array.isArray(data.sounds) && data.sounds.length)
      for (let i = 0; i < data.sounds.length; i += 50) {
        const { error } = await sb.from("sounds").upsert(data.sounds.slice(i, i + 50));
        if (error) {
          toast("Sons: " + error.message);
          break;
        }
      }
    send("hand", { v: Date.now() });
    toast("📥 Backup restaurado. Recarregando…", 2500);
    setTimeout(() => location.reload(), 1600);
  };
  inp.click();
}

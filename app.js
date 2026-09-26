(() => {
"use strict";
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const ICON = {
  play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>',
  stop:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1.5"/></svg>',
  dots:'<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
  ear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 14v-2a9 9 0 0 1 18 0v2"/><rect x="3" y="14" width="4" height="7" rx="1.5"/><rect x="17" y="14" width="4" height="7" rx="1.5"/></svg>',
  up:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M6 10l6-6 6 6M4 20h16"/></svg>',
  hush:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 5 6M21 9l-5 6"/></svg>',
  vol:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>'
};
const KEYS = "1234567890QWERTYUIOPASDFGHJKLZXCVBNM".split("");

// ---------- state ----------
let sb = null, chan = null, session = null;
let isGM = false;
let sounds = [];
let live = {music:null, amb:{}};
let peers = [];
let joined = false;
let filter = "";
let lastSfx = null;
let myVol = 0.85, nick = "";
try { const v = parseFloat(localStorage.getItem("mesa.vol")); if (!isNaN(v)) myVol = v; nick = localStorage.getItem("mesa.nick") || ""; } catch {}

const byId = id => sounds.find(s => s.id === id);
const fmtDur = d => !d ? "" : d >= 60 ? Math.floor(d/60) + ":" + String(Math.round(d%60)).padStart(2,"0") : Math.round(d) + "s";
function toast(msg, ms = 3500){
  const t = $("#toast"); t.textContent = msg; t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => t.hidden = true, ms);
}
function ytId(u){
  try {
    const url = new URL(u.trim());
    if (url.hostname.includes("youtu.be")) return url.pathname.slice(1).split("/")[0];
    if (url.searchParams.get("v")) return url.searchParams.get("v");
    const m = url.pathname.match(/\/(shorts|embed|live)\/([\w-]{6,})/); if (m) return m[2];
  } catch {}
  return /^[\w-]{11}$/.test(u.trim()) ? u.trim() : null;
}

// ---------- YouTube API ----------
let ytReady = null;
function loadYT(){
  if (ytReady) return ytReady;
  ytReady = new Promise(res => {
    if (window.YT?.Player) return res();
    window.onYouTubeIframeAPIReady = () => res();
    const s = document.createElement("script"); s.src = "https://www.youtube.com/iframe_api"; document.head.appendChild(s);
  });
  return ytReady;
}
function refreshDock(){ $("#ytDockWrap").hidden = !$("#ytDock").children.length; }

// ---------- audio engine ----------
const A = {
  ctx:null, master:null, music:null, amb:new Map(), buffers:new Map(), preview:null, sfxLive:new Set(),
  init(){
    if (this.ctx) { if (this.ctx.state === "suspended") this.ctx.resume(); return; }
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.ctx.createGain(); this.master.gain.value = myVol;
    this.master.connect(this.ctx.destination);
    loadYT();
  },
  setMaster(v){
    if (this.master) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, .05);
    for (const vc of this.all()) if (vc.type === "yt") vc.apply();
  },
  all(){ return [this.music, ...this.amb.values(), this.preview].filter(Boolean); },

  fileVoice(s, vol, startedAt, dest){
    const el = new Audio(); el.crossOrigin = "anonymous"; el.src = s.url; el.loop = true; el.preload = "auto";
    const src = this.ctx.createMediaElementSource(el);
    const g = this.ctx.createGain(); g.gain.value = 0;
    src.connect(g).connect(dest || this.master);
    const v = {type:"file", sid:s.id, el, g, target:vol,
      fade:(to, secs) => { const t = this.ctx.currentTime; v.target = to; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(to, t + secs); },
      stop:(secs = 1.5) => { v.fade(0, secs); setTimeout(() => { try { el.pause(); el.removeAttribute("src"); el.load(); } catch {} }, secs*1000 + 100); }
    };
    const go = () => {
      const d = el.duration;
      if (startedAt && isFinite(d) && d > 0) { const pos = ((Date.now() - startedAt)/1000) % d; if (pos > .5) try { el.currentTime = pos; } catch {} }
      el.play().catch(() => {}); v.fade(vol, 1.2);
    };
    if (el.readyState >= 1) go(); else el.addEventListener("loadedmetadata", go, {once:true});
    el.addEventListener("error", () => toast("Não consegui carregar “" + s.name + "”."), {once:true});
    return v;
  },

  ytVoice(s, vol, startedAt, opts = {}){
    const box = document.createElement("div"); box.className = "yt-item";
    const holder = document.createElement("div"); box.appendChild(holder);
    const cap = document.createElement("span"); cap.textContent = s.name; box.appendChild(cap);
    $("#ytDock").appendChild(box); refreshDock();
    const v = {type:"yt", sid:s.id, target:vol, cur:0, player:null, box, dead:false, noMaster:!!opts.noMaster,
      apply(){ if (v.player?.setVolume) v.player.setVolume(Math.round(v.cur * (v.noMaster ? 1 : myVol) * 100)); },
      fade(to, secs){
        v.target = to; clearInterval(v.iv);
        const from = v.cur, steps = Math.max(1, Math.round(secs*1000/60)); let i = 0;
        v.iv = setInterval(() => { i++; v.cur = from + (to - from) * (i/steps); v.apply(); if (i >= steps) clearInterval(v.iv); }, 60);
      },
      stop(secs = 1.5){ v.fade(0, secs); setTimeout(() => { v.dead = true; try { v.player?.destroy(); } catch {} box.remove(); refreshDock(); }, secs*1000 + 150); }
    };
    loadYT().then(() => {
      if (v.dead) return;
      v.player = new YT.Player(holder, {
        videoId: s.yt_id, width: 240, height: 135,
        playerVars: {autoplay:1, controls:0, disablekb:1, playsinline:1, rel:0, loop: opts.once ? 0 : 1, playlist: opts.once ? undefined : s.yt_id},
        events: {
          onReady: e => {
            if (v.dead) return;
            v.cur = 0; v.apply();
            const d = e.target.getDuration();
            if (startedAt && d > 0) { const pos = ((Date.now() - startedAt)/1000) % d; if (pos > 1) e.target.seekTo(pos, true); }
            e.target.playVideo();
            v.fade(vol, 1.5);
            if (isGM && d > 0 && !s.duration) sb.from("sounds").update({duration: Math.round(d)}).eq("id", s.id).then(() => {});
          },
          onStateChange: e => { if (e.data === 0 && !opts.once && !v.dead) { e.target.seekTo(0, true); e.target.playVideo(); } },
          onError: e => {
            const msg = (e.data === 101 || e.data === 150) ? "O dono do vídeo “" + s.name + "” não deixa tocar fora do YouTube. Tente outro link." : "O YouTube não conseguiu tocar “" + s.name + "”.";
            toast(msg, 6000);
          }
        }
      });
    });
    return v;
  },

  voice(s, vol, at){ return s.source === "youtube" ? this.ytVoice(s, vol, at) : this.fileVoice(s, vol, at); },

  sync(){
    if (!this.ctx) return;
    const m = live.music;
    if (m && byId(m.sid)) {
      if (!this.music || this.music.sid !== m.sid || this.music.at !== m.at) {
        if (this.music) this.music.stop(2);
        this.music = this.voice(byId(m.sid), m.vol ?? .8, m.at); this.music.at = m.at;
      } else if (Math.abs(this.music.target - (m.vol ?? .8)) > .001) this.music.fade(m.vol ?? .8, .3);
    } else if (this.music) { this.music.stop(2); this.music = null; }

    const want = live.amb || {};
    for (const [sid, v] of this.amb) if (!want[sid] || !byId(sid)) { v.stop(2); this.amb.delete(sid); }
    for (const sid in want) {
      const s = byId(sid); if (!s) continue;
      const w = want[sid], cur = this.amb.get(sid);
      if (!cur) this.amb.set(sid, this.voice(s, w.vol ?? .7, w.at));
      else if (Math.abs(cur.target - (w.vol ?? .7)) > .001) cur.fade(w.vol ?? .7, .3);
    }
  },
  async buffer(s){
    if (this.buffers.has(s.id)) return this.buffers.get(s.id);
    const p = fetch(s.url).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(b => this.ctx.decodeAudioData(b));
    this.buffers.set(s.id, p); p.catch(() => this.buffers.delete(s.id));
    return p;
  },
  async sfx(s, vol){
    if (!this.ctx || s.source === "youtube") return;
    try {
      const buf = await this.buffer(s);
      const src = this.ctx.createBufferSource(); src.buffer = buf;
      const g = this.ctx.createGain(); g.gain.value = vol ?? s.volume ?? 1;
      src.connect(g).connect(this.master); src.start();
      this.sfxLive.add(src); src.onended = () => this.sfxLive.delete(src);
    } catch { toast("Não consegui tocar “" + s.name + "”."); }
  },
  stopSfx(){ for (const s of this.sfxLive) { try { s.stop(); } catch {} } },
  preloadSfx(){ for (const s of sounds) if (s.kind === "sfx" && s.source !== "youtube") this.buffer(s).catch(() => {}); },
  previewToggle(s){
    this.init();
    if (this.preview) { const p = this.preview; this.preview = null; p.stop(.3); if (p.sid === s.id) return render(); }
    if (s.source === "youtube") this.preview = this.ytVoice(s, .9, null, {noMaster:true, once:true});
    else {
      const v = this.fileVoice(s, .9, null, this.ctx.destination); v.el.loop = false;
      v.el.addEventListener("ended", () => { if (this.preview === v) { this.preview = null; render(); } });
      this.preview = v;
    }
    render();
  }
};

// ---------- GM actions ----------
async function saveLive(next){
  live = {music: next.music, amb: next.amb || {}}; A.sync(); render();
  const {error} = await sb.from("live_state").upsert({id:1, music:live.music, amb:live.amb, updated_at:new Date().toISOString()});
  if (error) toast("Não salvei o estado da mesa: " + error.message);
}
function playMusic(s){
  if (live.music && live.music.sid === s.id) return saveLive({...live, music:null});
  saveLive({...live, music:{sid:s.id, at:Date.now(), vol: live.music?.vol ?? s.volume ?? .8}});
}
function toggleAmb(s){
  const amb = {...(live.amb || {})};
  if (amb[s.id]) delete amb[s.id]; else amb[s.id] = {at:Date.now(), vol:s.volume ?? .7};
  saveLive({...live, amb});
}
let volTimer = null;
function setLiveVol(kind, sid, v){
  if (kind === "music" && live.music) live = {...live, music:{...live.music, vol:v}};
  if (kind === "amb" && live.amb?.[sid]) live = {...live, amb:{...live.amb, [sid]:{...live.amb[sid], vol:v}}};
  A.sync();
  clearTimeout(volTimer); volTimer = setTimeout(() => saveLive(live), 350);
}
function fireSfx(s){
  A.init(); flashPad(s.id); A.sfx(s);
  chan?.send({type:"broadcast", event:"sfx", payload:{sid:s.id, vol:s.volume ?? 1}});
}
function stopAll(){
  A.init(); A.stopSfx();
  chan?.send({type:"broadcast", event:"hush", payload:{}});
  saveLive({music:null, amb:{}});
}
function flashPad(id){
  const el = document.querySelector('.pad[data-id="' + id + '"]'); if (!el) return;
  el.classList.remove("fire"); void el.offsetWidth; el.classList.add("fire");
}

// ---------- upload ----------
function probeDuration(file){
  return new Promise(res => {
    const el = document.createElement("audio"); el.preload = "metadata";
    const u = URL.createObjectURL(file); el.src = u;
    el.onloadedmetadata = () => { res(isFinite(el.duration) ? el.duration : 0); URL.revokeObjectURL(u); };
    el.onerror = () => { res(0); URL.revokeObjectURL(u); };
  });
}
const defVol = k => k === "sfx" ? 1 : k === "music" ? .75 : .7;
let upKind = "sfx", upTab = "file";
async function handleFiles(files){
  const q = $("#queue");
  for (const f of files) {
    const item = document.createElement("div"); item.className = "qitem";
    item.innerHTML = '<span class="n"></span><span class="s">enviando…</span>';
    item.querySelector(".n").textContent = f.name; q.appendChild(item);
    const st = item.querySelector(".s"), kind = upKind;
    try {
      if (f.size > 50 * 1024 * 1024) throw new Error("Passou de 50 MB.");
      const duration = await probeDuration(f);
      const ext = (f.name.match(/\.[a-z0-9]+$/i)?.[0] || "").toLowerCase();
      const path = crypto.randomUUID() + ext;
      const {error: upErr} = await sb.storage.from("sons").upload(path, f, {contentType: f.type || undefined, cacheControl: "31536000"});
      if (upErr) throw upErr;
      const url = sb.storage.from("sons").getPublicUrl(path).data.publicUrl;
      const name = f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim().slice(0, 60) || "Som";
      const {error} = await sb.from("sounds").insert({name, kind, source:"file", url, storage_path:path, volume:defVol(kind), duration:Math.round(duration*10)/10});
      if (error) throw error;
      item.classList.add("ok"); st.textContent = "pronto";
    } catch (e) {
      item.classList.add("err"); st.textContent = e?.message || "falhou"; st.title = st.textContent;
    }
  }
}
async function addYouTube(){
  const link = $("#ytUrl").value, id = ytId(link), err = $("#ytErr");
  err.textContent = "";
  if (!id) { err.textContent = "Não reconheci esse link. Cole o endereço de um vídeo do YouTube."; return; }
  let name = $("#ytName").value.trim();
  const btn = $("#ytAdd"); btn.disabled = true;
  if (!name) {
    try { const r = await fetch("https://www.youtube.com/oembed?format=json&url=" + encodeURIComponent("https://www.youtube.com/watch?v=" + id)); if (r.ok) name = (await r.json()).title; } catch {}
  }
  name = (name || "Vídeo do YouTube").slice(0, 60);
  const kind = upKind === "sfx" ? "music" : upKind;
  const {error} = await sb.from("sounds").insert({name, kind, source:"youtube", yt_id:id, url:"https://www.youtube.com/watch?v=" + id, volume:defVol(kind)});
  btn.disabled = false;
  if (error) { err.textContent = "Não salvei: " + error.message; return; }
  $("#ytUrl").value = ""; $("#ytName").value = "";
  const q = $("#queue"); const item = document.createElement("div"); item.className = "qitem ok";
  item.innerHTML = '<span class="n"></span><span class="s">salvo</span>'; item.querySelector(".n").textContent = name; q.appendChild(item);
}
function openUpload(){
  const ov = document.createElement("div"); ov.className = "overlay"; ov.id = "upOverlay";
  ov.innerHTML = `<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="upTitle">
    <h3 id="upTitle">Adicionar sons</h3>
    <div class="tabs" role="tablist"><button role="tab" data-tab="file">Arquivo do PC</button><button role="tab" data-tab="yt">Link do YouTube</button></div>
    <div class="seg" id="kindSeg">
      <button data-k="sfx"><b>Efeito</b><small>rugido, porta, espada</small></button>
      <button data-k="ambient"><b>Ambiente</b><small>floresta, chuva, taverna</small></button>
      <button data-k="music"><b>Trilha</b><small>música de fundo</small></button>
    </div>
    <div id="paneFile">
      <p>MP3, WAV, OGG, M4A e WEBM. Até 50 MB por arquivo.</p>
      <label class="drop" id="drop" for="fileIn">Arraste os arquivos aqui ou <u>escolha no computador</u></label>
      <input type="file" id="fileIn" accept="audio/*,.mp3,.wav,.ogg,.m4a,.webm,.flac" multiple hidden>
    </div>
    <div id="paneYt" hidden>
      <p>Cole o link de um vídeo. Ele toca como Trilha ou Ambiente, sincronizado para todos. Efeitos precisam ser arquivos, porque o YouTube demora para começar.</p>
      <label class="field">Link do vídeo<input id="ytUrl" type="url" placeholder="https://www.youtube.com/watch?v=…"></label>
      <label class="field">Nome (opcional, pega o título do vídeo)<input id="ytName" type="text" maxlength="60"></label>
      <div class="login"><div class="err" id="ytErr"></div></div>
      <button class="btn primary" id="ytAdd">Salvar link</button>
    </div>
    <div class="queue" id="queue"></div>
    <div class="foot"><button class="btn" id="upClose">Fechar</button></div></div>`;
  document.body.appendChild(ov);
  const seg = $("#kindSeg");
  const paint = () => {
    if (upTab === "yt" && upKind === "sfx") upKind = "music";
    seg.querySelectorAll("button").forEach(b => { b.setAttribute("aria-pressed", b.dataset.k === upKind); b.disabled = upTab === "yt" && b.dataset.k === "sfx"; });
    ov.querySelectorAll("[role=tab]").forEach(b => b.setAttribute("aria-selected", b.dataset.tab === upTab));
    $("#paneFile").hidden = upTab !== "file"; $("#paneYt").hidden = upTab !== "yt";
  };
  paint();
  seg.onclick = e => { const b = e.target.closest("button"); if (b && !b.disabled) { upKind = b.dataset.k; paint(); } };
  ov.querySelector(".tabs").onclick = e => { const b = e.target.closest("button"); if (b) { upTab = b.dataset.tab; paint(); } };
  $("#fileIn").onchange = e => { handleFiles([...e.target.files]); e.target.value = ""; };
  const drop = $("#drop");
  drop.ondragover = e => { e.preventDefault(); drop.classList.add("over"); };
  drop.ondragleave = () => drop.classList.remove("over");
  drop.ondrop = e => { e.preventDefault(); drop.classList.remove("over"); handleFiles([...e.dataTransfer.files]); };
  $("#ytAdd").onclick = addYouTube;
  $("#ytUrl").onkeydown = e => { if (e.key === "Enter") addYouTube(); };
  const close = () => ov.remove();
  $("#upClose").onclick = close;
  ov.onclick = e => { if (e.target === ov) close(); };
}

// ---------- edit menu ----------
let openMenu = null;
function closeMenu(){ if (openMenu) { openMenu.remove(); openMenu = null; } }
function showMenu(s, anchor){
  closeMenu();
  const m = document.createElement("div"); m.className = "menu";
  m.innerHTML = `<label>Nome<input type="text" id="mName" maxlength="60"></label>
    <label>Tipo<select id="mKind"><option value="sfx">Efeito</option><option value="ambient">Ambiente</option><option value="music">Trilha</option></select></label>
    <label>Volume padrão<input type="range" id="mVol" min="0" max="1" step="0.05"></label>
    <div class="acts"><button class="btn danger" id="mDel">Excluir</button><button class="btn primary" id="mSave">Salvar</button></div>`;
  document.body.appendChild(m); openMenu = m;
  $("#mName", m).value = s.name; $("#mKind", m).value = s.kind; $("#mVol", m).value = s.volume ?? 1;
  if (s.source === "youtube") $("#mKind option[value=sfx]", m).disabled = true;
  const r = anchor.getBoundingClientRect();
  m.style.top = (window.scrollY + r.bottom + 4) + "px";
  m.style.left = Math.max(16, Math.min(window.scrollX + r.right - 240, document.documentElement.clientWidth - 256)) + "px";
  $("#mSave", m).onclick = async () => {
    const data = {name:$("#mName", m).value.trim() || s.name, kind:$("#mKind", m).value, volume:parseFloat($("#mVol", m).value)};
    closeMenu();
    const {error} = await sb.from("sounds").update(data).eq("id", s.id);
    if (error) toast("Não salvei: " + error.message);
  };
  const del = $("#mDel", m);
  del.onclick = async () => {
    if (!del.dataset.arm) { del.dataset.arm = 1; del.textContent = "Confirmar exclusão"; return; }
    closeMenu();
    if (live.music?.sid === s.id || live.amb?.[s.id]) {
      const amb = {...(live.amb || {})}; delete amb[s.id];
      await saveLive({music: live.music?.sid === s.id ? null : live.music, amb});
    }
    const {error} = await sb.from("sounds").delete().eq("id", s.id);
    if (error) return toast("Não excluí: " + error.message);
    if (s.storage_path) await sb.storage.from("sons").remove([s.storage_path]);
    toast("“" + s.name + "” excluído.");
  };
}
document.addEventListener("pointerdown", e => { if (openMenu && !openMenu.contains(e.target) && !e.target.closest("[data-menu]")) closeMenu(); });

// ---------- login ----------
function openLogin(){
  const ov = document.createElement("div"); ov.className = "overlay";
  ov.innerHTML = `<form class="dialog login" aria-labelledby="lgTitle">
    <h3 id="lgTitle">Entrar como mestre</h3>
    <p>Use o e-mail e a senha do mestre cadastrados no Supabase.</p>
    <label class="field">E-mail<input id="lgEmail" type="email" autocomplete="username" required></label>
    <label class="field">Senha<input id="lgPass" type="password" autocomplete="current-password" required></label>
    <div class="err" id="lgErr"></div>
    <div class="foot" style="gap:8px"><button class="btn" type="button" id="lgCancel">Cancelar</button><button class="btn primary" type="submit">Entrar</button></div></form>`;
  document.body.appendChild(ov);
  $("#lgEmail").focus();
  $("#lgCancel").onclick = () => ov.remove();
  ov.querySelector("form").onsubmit = async e => {
    e.preventDefault();
    const {error} = await sb.auth.signInWithPassword({email:$("#lgEmail").value.trim(), password:$("#lgPass").value});
    if (error) { $("#lgErr").textContent = "E-mail ou senha incorretos."; return; }
    ov.remove();
  };
}

// ---------- rendering ----------
let dragging = false, pendingRender = false;
document.addEventListener("pointerdown", e => { if (e.target.matches?.("input[type=range]")) dragging = true; });
document.addEventListener("pointerup", () => { if (dragging) { dragging = false; if (pendingRender) { pendingRender = false; render(); } } });
function render(){
  if (dragging && isGM) { pendingRender = true; renderStatus(); return; }
  $("#roleLbl").textContent = isGM ? "painel do mestre" : "mesa do jogador";
  const ab = $("#authBtn"); ab.hidden = !sb; ab.textContent = isGM ? "Sair" : "Sou o mestre";
  ab.className = "btn small";
  renderStatus();
  if (isGM) renderGM(); else renderPlayer();
}
function renderStatus(){
  const listening = peers.filter(p => p.listening).length;
  let h = `<span class="sub">${peers.length} na mesa · ${listening} ouvindo</span>`;
  for (const p of peers) h += `<span class="chip ${p.listening ? "on" : ""} ${p.role === "gm" ? "gm" : ""}"><span class="dot"></span>${esc(p.name || "Alguém")}${p.me ? " (você)" : ""}</span>`;
  $("#tableStatus").innerHTML = h;
}
function renderGM(){
  const v = $("#view");
  if ($("#stage")) v.innerHTML = "";
  const f = filter.toLowerCase(), match = s => !f || s.name.toLowerCase().includes(f);
  const music = sounds.filter(s => s.kind === "music" && match(s));
  const amb = sounds.filter(s => s.kind === "ambient" && match(s));
  const sfxAll = sounds.filter(s => s.kind === "sfx"), sfx = sfxAll.filter(match);
  const pv = A.preview?.sid;
  const yt = s => s.source === "youtube" ? '<span class="badge-yt">YT</span>' : "";
  const tools = s => `<span class="tools"><button class="icon-btn" data-prev="${s.id}" title="Pré-ouvir só aqui" aria-label="Pré-ouvir ${esc(s.name)}" style="${pv === s.id ? "color:var(--brass)" : ""}">${ICON.ear}</button><button class="icon-btn" data-menu="${s.id}" title="Editar" aria-label="Editar ${esc(s.name)}">${ICON.dots}</button></span>`;
  const keep = document.activeElement?.id;
  v.innerHTML = `
  <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px;align-items:center">
    <button class="btn primary" id="upBtn">${ICON.up} Adicionar sons</button>
    <input class="search" id="search" type="search" placeholder="Buscar som…" value="${esc(filter)}" aria-label="Buscar som">
    <span style="flex:1"></span>
    <label class="sub" style="display:flex;align-items:center;gap:8px">${ICON.vol}<input type="range" id="myVol" min="0" max="1" step="0.05" value="${myVol}" aria-label="Volume só no seu PC"></label>
    <button class="btn danger" id="stopAll">${ICON.hush} Silêncio total</button>
  </div>
  <div class="board">
    <section class="sec music-sec">
      <div class="sec-head"><span class="swatch"></span><h2>Trilha</h2><span class="hint">uma por vez, em loop</span></div>
      ${music.length ? `<div class="list">${music.map(s => { const on = live.music?.sid === s.id;
        return `<div class="row ${on ? "active" : ""}"><button class="play" data-music="${s.id}" aria-label="${on ? "Parar" : "Tocar"} ${esc(s.name)}">${on ? ICON.stop : ICON.play}</button>
        <span class="name">${esc(s.name)}${yt(s)}${on ? '<span class="eq"><i></i><i></i><i></i></span>' : ""}</span><span class="meta">${fmtDur(s.duration)}</span>${tools(s)}</div>`; }).join("")}</div>` : `<div class="empty">Nenhuma trilha ainda. Use “Adicionar sons”: arquivo ou link do YouTube.</div>`}
      ${live.music ? `<div class="live-vol">Volume da trilha <input type="range" id="musicVol" min="0" max="1" step="0.02" value="${live.music.vol ?? .8}"></div>` : ""}
    </section>
    <section class="sec amb-sec">
      <div class="sec-head"><span class="swatch"></span><h2>Ambiente</h2><span class="hint">camadas somam, em loop</span></div>
      ${amb.length ? `<div class="amb-grid">${amb.map(s => { const on = !!live.amb?.[s.id];
        return `<div class="amb ${on ? "on" : ""}"><button class="toggle" data-amb="${s.id}" aria-pressed="${on}"><span class="sw"></span><span>${esc(s.name)}</span></button>
        ${on ? `<input type="range" min="0" max="1" step="0.02" value="${live.amb[s.id].vol ?? .7}" data-ambvol="${s.id}" aria-label="Volume de ${esc(s.name)}">` : `<span class="sub">${fmtDur(s.duration) || "&nbsp;"}${yt(s)}</span>`}
        ${tools(s)}</div>`; }).join("")}</div>` : `<div class="empty">Nenhum ambiente ainda.</div>`}
    </section>
    <section class="sec sfx-sec">
      <div class="sec-head"><span class="swatch"></span><h2>Efeitos</h2><span class="hint">toca uma vez para todos · atalhos no teclado</span></div>
      ${sfx.length ? `<div class="pads">${sfx.map(s => { const k = KEYS[sfxAll.indexOf(s)];
        return `<div class="pad-wrap"><button class="pad" data-id="${s.id}" data-sfx="${s.id}" style="width:100%">${k ? `<span class="key">${k}</span>` : ""}<span class="pname">${esc(s.name)}</span></button>${tools(s)}</div>`; }).join("")}</div>` : `<div class="empty">Nenhum efeito ainda.</div>`}
    </section>
  </div>`;
  $("#upBtn").onclick = openUpload;
  $("#stopAll").onclick = stopAll;
  const se = $("#search"); se.oninput = e => { filter = e.target.value; render(); };
  if (keep === "search") { se.focus(); se.setSelectionRange(se.value.length, se.value.length); }
  $("#myVol").oninput = e => setMyVol(parseFloat(e.target.value));
  const mv = $("#musicVol"); if (mv) mv.oninput = e => setLiveVol("music", null, parseFloat(e.target.value));
  v.querySelectorAll("[data-ambvol]").forEach(r => r.oninput = e => setLiveVol("amb", r.dataset.ambvol, parseFloat(e.target.value)));
}
$("#view").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b || !isGM) return;
  const s = byId(b.dataset.music || b.dataset.amb || b.dataset.sfx || b.dataset.prev || b.dataset.menu);
  if (!s) return;
  A.init(); ensureJoinedGM();
  if (b.dataset.music) playMusic(s);
  else if (b.dataset.amb) toggleAmb(s);
  else if (b.dataset.sfx) fireSfx(s);
  else if (b.dataset.prev) A.previewToggle(s);
  else if (b.dataset.menu) showMenu(s, b);
});
function setMyVol(v){ myVol = v; A.setMaster(v); try { localStorage.setItem("mesa.vol", String(v)); } catch {} }
function renderPlayer(){
  const v = $("#view");
  const m = live.music && byId(live.music.sid);
  const ambs = Object.keys(live.amb || {}).map(byId).filter(Boolean);
  if (!$("#stage")) {
    v.innerHTML = `<div class="player">
      <div class="stage" id="stage"><div class="sfx-flash" id="flash"></div>
        <div><div class="lbl">Trilha</div><div class="now" id="pMusic"></div></div>
        <div><div class="lbl" style="margin-bottom:6px">Ambiente</div><div class="amb-chips" id="pAmb"></div></div>
        <div class="last-sfx" id="pSfx"></div>
      </div>
      <div class="myvol">${ICON.vol}<input type="range" id="myVol" min="0" max="1" step="0.02" aria-label="Seu volume"><span class="sub">seu volume</span></div>
      <p class="sub" id="pHint"></p>
    </div>`;
    $("#myVol").value = myVol;
    $("#myVol").oninput = e => setMyVol(parseFloat(e.target.value));
  }
  const pm = $("#pMusic"); pm.textContent = m ? m.name : "silêncio"; pm.classList.toggle("none", !m);
  $("#pAmb").innerHTML = ambs.length ? ambs.map(s => `<span class="chip on"><span class="dot"></span>${esc(s.name)}</span>`).join("") : `<span class="sub">nenhum</span>`;
  $("#pSfx").innerHTML = lastSfx ? `Último efeito: <b>${esc(lastSfx)}</b>` : "";
  $("#pHint").textContent = joined ? "Deixe esta aba aberta. O mestre controla o que toca." : "Clique em “Entrar na mesa” para ouvir.";
}

// ---------- presence ----------
const myKey = (crypto.randomUUID?.() || String(Math.random())).slice(0, 12);
function track(){ chan?.track({name: isGM ? (nick || "Mestre") : (nick || "Jogador"), role: isGM ? "gm" : "player", listening: joined}); }
function ensureJoinedGM(){ if (!joined) { joined = true; A.init(); A.sync(); A.preloadSfx(); track(); } }

// ---------- boot ----------
$("#gateForm").onsubmit = e => {
  e.preventDefault();
  nick = $("#nick").value.trim().slice(0, 30);
  try { localStorage.setItem("mesa.nick", nick); } catch {}
  A.init(); joined = true; $("#gate").hidden = true; A.sync(); A.preloadSfx(); track(); render();
};
$("#authBtn").onclick = async () => {
  if (isGM) { await sb.auth.signOut(); return; }
  openLogin();
};
document.addEventListener("keydown", e => {
  if (!isGM || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.target.closest("input,select,textarea") || $(".overlay")) return;
  if (e.key === "Escape") { closeMenu(); return; }
  const i = KEYS.indexOf(e.key.toUpperCase()); if (i < 0) return;
  const s = sounds.filter(x => x.kind === "sfx")[i]; if (!s) return;
  e.preventDefault(); ensureJoinedGM(); fireSfx(s);
});

async function loadSounds(){
  const {data, error} = await sb.from("sounds").select("*").order("created_at");
  if (error) { toast("Não carreguei os sons: " + error.message); return; }
  sounds = data; if (joined) { A.sync(); A.preloadSfx(); } render();
}
async function loadLive(){
  const {data} = await sb.from("live_state").select("*").eq("id", 1).maybeSingle();
  live = {music:data?.music || null, amb:data?.amb || {}}; A.sync(); render();
}
function applySession(s){
  session = s; const was = isGM; isGM = !!s;
  if (isGM) { $("#gate").hidden = true; } else if (!joined) { $("#gate").hidden = false; $("#nick").value = nick; }
  if (was !== isGM) { $("#view").innerHTML = ""; track(); }
  render();
}

async function boot(){
  render();
  let cfg;
  try { cfg = await (await fetch("/api/config", {cache:"no-store"})).json(); } catch {}
  if (!cfg?.url || !cfg?.key) { $("#view").innerHTML = `<div class="empty">O site ainda não foi ligado ao Supabase. Configure SUPABASE_URL e SUPABASE_ANON_KEY na Vercel e faça um novo deploy.</div>`; $("#roleLbl").textContent = "configuração pendente"; return; }
  sb = window.supabase.createClient(cfg.url, cfg.key);
  const {data:{session: s0}} = await sb.auth.getSession();
  applySession(s0);
  sb.auth.onAuthStateChange((_ev, s) => { if (!!s !== isGM) applySession(s); });

  await Promise.all([loadSounds(), loadLive()]);

  sb.channel("db").on("postgres_changes", {event:"*", schema:"public", table:"sounds"}, () => loadSounds())
    .on("postgres_changes", {event:"*", schema:"public", table:"live_state"}, p => {
      const d = p.new; if (!d || d.id !== 1) return;
      live = {music:d.music || null, amb:d.amb || {}}; A.sync(); render();
    }).subscribe();

  chan = sb.channel("mesa", {config:{presence:{key:myKey}, broadcast:{self:false}}});
  chan.on("broadcast", {event:"sfx"}, ({payload}) => {
    const s = byId(payload?.sid); if (!s) return;
    const vol = Math.max(0, Math.min(1, Number(payload?.vol ?? 1)));
    if (joined) A.sfx(s, vol);
    lastSfx = s.name;
    if (!isGM) { const f = $("#flash"); if (f) { f.classList.remove("go"); void f.offsetWidth; f.classList.add("go"); } renderPlayer(); }
    else flashPad(s.id);
  });
  chan.on("broadcast", {event:"hush"}, () => A.stopSfx());
  chan.on("presence", {event:"sync"}, () => {
    const st = chan.presenceState();
    peers = Object.entries(st).map(([k, arr]) => ({...(arr[arr.length-1] || {}), me: k === myKey}));
    peers.sort((a, b) => (b.role === "gm") - (a.role === "gm"));
    renderStatus();
  });
  chan.subscribe(status => { if (status === "SUBSCRIBED") track(); });

  // re-sync music position when tab comes back
  document.addEventListener("visibilitychange", () => { if (!document.hidden && A.ctx?.state === "suspended") A.ctx.resume(); });
}
boot();
})();

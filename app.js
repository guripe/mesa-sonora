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
  star:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/></svg>',
  starOn:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/></svg>',
  folder:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2.5h8.5A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/></svg>',
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
let curFolder = "";       // "" todas, "__fav" favoritos, ou nome da pasta
let visibleSfx = [];
let myVol = 0.85, nick = "";
try { const v = parseFloat(localStorage.getItem("mesa.vol")); if (!isNaN(v)) myVol = v; nick = localStorage.getItem("mesa.nick") || ""; curFolder = localStorage.getItem("mesa.folder") || ""; } catch {}

const byId = id => sounds.find(s => s.id === id);
const fmtDur = d => !d ? "" : d >= 60 ? Math.floor(d/60) + ":" + String(Math.round(d%60)).padStart(2,"0") : Math.round(d) + "s";
function toast(msg, ms = 3500){
  const t = $("#toast"); t.textContent = msg; t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => t.hidden = true, ms);
}
function ytStart(u){
  try {
    const url = new URL(u.trim()); const t = url.searchParams.get("t") || url.searchParams.get("start"); if (!t) return 0;
    if (/^\d+$/.test(t)) return +t;
    const m = t.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/); return m ? (+(m[1]||0))*3600 + (+(m[2]||0))*60 + (+(m[3]||0)) : 0;
  } catch { return 0; }
}
const parseTime = v => { v = String(v || "").trim(); if (!v) return null; if (v.includes(":")) { const [a, b] = v.split(":"); return (+a)*60 + (+b || 0); } const n = parseFloat(v.replace(",", ".")); return isNaN(n) ? null : n; };
const fmtTime = n => n == null || n === "" ? "" : Math.floor(n/60) + ":" + String(Math.round(n % 60)).padStart(2, "0");
const COLORS = [["", "Sem cor"], ["#c0473a", "Vermelho"], ["#d27a2c", "Laranja"], ["#c9a227", "Amarelo"], ["#5f9a4a", "Verde"], ["#3f8f8a", "Turquesa"], ["#4a72b8", "Azul"], ["#8456b0", "Roxo"], ["#b8558a", "Rosa"], ["#7a7066", "Cinza"]];
const EMOJIS = ["🐉","🐺","👹","🧟","🕷️","💀","👻","🦇","🐻","🐍","⚔️","🏹","🛡️","💥","🔥","⚡","❄️","✨","🔮","🪄","💰","🚪","🪨","🌲","🌊","🌧️","🌪️","🍺","🎵","🥁","🔔","❤️","😱","🏰","⛰️","🌙"];
const firstGrapheme = t => { t = String(t || "").trim(); if (!t) return ""; try { return [...new Intl.Segmenter("pt", {granularity:"grapheme"}).segment(t)][0].segment; } catch { return [...t][0]; } };
const safeColor = c => /^#[0-9a-f]{6}$/i.test(c || "") ? c : "";
const look = s => safeColor(s.color) ? ` style="--c:${safeColor(s.color)}"` : "";
const emo = (s, cls = "emo") => s.emoji ? `<span class="${cls}" aria-hidden="true">${esc(s.emoji)}</span>` : "";
function folderPicker(root, initial){
  // botões com as pastas existentes + "Nova pasta"
  let value = initial || "";
  const draw = () => {
    const fl = folders(); if (value && !fl.includes(value)) fl.push(value);
    root.innerHTML = `<div class="pick">${[["", "Sem pasta"], ...fl.map(f => [f, f])].map(([v, l]) => `<button type="button" class="pbtn" data-f="${esc(v)}" aria-pressed="${v === value}">${v ? ICON.folder + " " : ""}${esc(l)}</button>`).join("")}<button type="button" class="pbtn new" data-new="1">+ Nova pasta</button></div>`;
  };
  draw();
  root.onclick = e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.new) {
      b.outerHTML = `<span class="newf"><input type="text" maxlength="40" placeholder="nome da pasta" aria-label="Nome da nova pasta"><button type="button" class="pbtn ok">Criar</button></span>`;
      const inp = root.querySelector(".newf input"); inp.focus();
      const ok = () => { const v = inp.value.trim().slice(0, 40); if (v) value = v; draw(); };
      root.querySelector(".newf .ok").onclick = ok;
      inp.onkeydown = ev => { if (ev.key === "Enter") { ev.preventDefault(); ok(); } if (ev.key === "Escape") draw(); };
      return;
    }
    if (b.dataset.f !== undefined) { value = b.dataset.f; draw(); }
  };
  return { get: () => value };
}
const KIND_BTNS = [["sfx", "Efeito"], ["ambient", "Ambiente"], ["music", "Trilha"]];
const folders = () => [...new Set(sounds.map(s => (s.folder || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
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
  all(){ return [this.music, ...this.amb.values(), this.preview, ...this.ytPool.values()].filter(Boolean); },
  panNode(){ return null; },

  fileVoice(s, vol, startedAt, dest){
    const el = new Audio(); el.crossOrigin = "anonymous"; el.src = s.url; el.loop = true; el.preload = "auto";
    const src = this.ctx.createMediaElementSource(el);
    const g = this.ctx.createGain(); g.gain.value = 0;
    const pn = this.panNode(s.pan);
    if (pn) src.connect(g).connect(pn).connect(dest || this.master); else src.connect(g).connect(dest || this.master);
    const v = {type:"file", pn, sid:s.id, el, g, target:vol,
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

  // mode: "loop" (trilha/ambiente), "once" (pré-ouvir), "pool" (efeito pronto para disparar)
  ytVoice(s, vol, startedAt, opts = {}){
    const mode = opts.mode || "loop";
    const start = Number(s.yt_start) || 0, end = Number(s.yt_end) || 0;
    const box = document.createElement("div"); box.className = "yt-item";
    const holder = document.createElement("div"); box.appendChild(holder);
    const cap = document.createElement("span"); cap.textContent = (mode === "pool" ? "Efeito: " : "") + s.name; box.appendChild(cap);
    $("#ytDock").appendChild(box); refreshDock();
    const v = {type:"yt", mode, sid:s.id, target:vol, cur:0, player:null, ready:false, box, dead:false, noMaster:!!opts.noMaster,
      apply(){ if (v.player?.setVolume) v.player.setVolume(Math.round(Math.max(0, Math.min(1, v.cur * (v.noMaster ? 1 : myVol))) * 100)); },
      fade(to, secs){
        v.target = to; clearInterval(v.iv);
        const from = v.cur, steps = Math.max(1, Math.round(secs*1000/60)); let i = 0;
        v.iv = setInterval(() => { i++; v.cur = from + (to - from) * (i/steps); v.apply(); if (i >= steps) clearInterval(v.iv); }, 60);
      },
      stop(secs = 1.5){ v.fade(0, secs); setTimeout(() => v.destroy(), secs*1000 + 150); },
      destroy(){ v.dead = true; clearInterval(v.iv); clearInterval(v.watch); try { v.player?.destroy(); } catch {} box.remove(); refreshDock(); },
      fire(volume){ // efeito: toca do início do trecho
        if (!v.ready) return false;
        v.cur = volume; v.target = volume; v.apply();
        v.player.seekTo(start, true); v.player.playVideo(); return true;
      },
      pause(){ try { v.player?.pauseVideo(); } catch {} }
    };
    // vigia o fim do trecho escolhido
    v.watch = setInterval(() => {
      if (!v.ready || !end || v.dead) return;
      const t = v.player.getCurrentTime?.() || 0;
      if (t >= end) { if (mode === "loop") v.player.seekTo(start, true); else if (mode === "once") { A.preview === v && (A.preview = null); v.destroy(); render(); } else v.pause(); }
    }, 150);
    loadYT().then(() => {
      if (v.dead) return;
      v.player = new YT.Player(holder, {
        videoId: s.yt_id, width: 240, height: 135,
        playerVars: {autoplay: mode === "pool" ? 0 : 1, controls:0, disablekb:1, playsinline:1, rel:0, start: Math.floor(start)},
        events: {
          onReady: e => {
            if (v.dead) return;
            v.ready = true; v.cur = 0; v.apply();
            if (mode === "pool") { e.target.seekTo(start, true); e.target.pauseVideo(); return; }
            const d = e.target.getDuration();
            const segEnd = end || d, seg = segEnd - start;
            let pos = start;
            if (mode === "loop" && startedAt && seg > 0) pos = start + ((Date.now() - startedAt)/1000) % seg;
            e.target.seekTo(pos, true);
            e.target.playVideo();
            v.fade(vol, mode === "once" ? .2 : 1.5);
            if (isGM && d > 0 && !s.duration) sb.from("sounds").update({duration: Math.round(seg)}).eq("id", s.id).then(() => {});
          },
          onStateChange: e => {
            if (e.data !== 0 || v.dead) return;
            if (mode === "loop") { e.target.seekTo(start, true); e.target.playVideo(); }
            else if (mode === "once") { if (A.preview === v) A.preview = null; v.destroy(); render(); }
          },
          onError: e => {
            const msg = (e.data === 101 || e.data === 150) ? "O dono do vídeo “" + s.name + "” não deixa tocar fora do YouTube. Tente outro link." : "O YouTube não conseguiu tocar “" + s.name + "”.";
            toast(msg, 6000);
          }
        }
      });
    });
    return v;
  },
  ytPool: new Map(),
  syncYtPool(){
    if (!this.ctx) return;
    const key = s => s.yt_id + ":" + (s.yt_start || 0) + ":" + (s.yt_end || 0);
    const want = new Map(sounds.filter(s => s.kind === "sfx" && s.source === "youtube").map(s => [s.id, s]));
    for (const [sid, v] of this.ytPool) {
      const s = want.get(sid);
      if (!s || key(s) !== v.ytKey) { v.destroy(); this.ytPool.delete(sid); }
    }
    for (const [sid, s] of want) if (!this.ytPool.has(sid)) {
      const v = this.ytVoice(s, 0, null, {mode:"pool"}); v.ytKey = key(s);
      this.ytPool.set(sid, v);
    }
  },
  fireYt(s, vol){
    const v = this.ytPool.get(s.id);
    if (v && v.fire(vol)) return;
    // ainda carregando: toca num player avulso
    this.ytVoice(s, vol, null, {mode:"once"});
  },
  stopYtSfx(){ for (const v of this.ytPool.values()) v.pause(); },

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
  async sfx(s, vol, pan){
    if (!this.ctx) return;
    if (s.source === "youtube") return this.fireYt(s, vol ?? s.volume ?? 1);
    try {
      const buf = await this.buffer(s);
      const src = this.ctx.createBufferSource(); src.buffer = buf;
      const g = this.ctx.createGain(); g.gain.value = vol ?? s.volume ?? 1;
      const pn = this.panNode(pan ?? s.pan);
      if (pn) src.connect(g).connect(pn).connect(this.master); else src.connect(g).connect(this.master);
      src.start();
      this.sfxLive.add(src); src.onended = () => this.sfxLive.delete(src);
    } catch { toast("Não consegui tocar “" + s.name + "”."); }
  },
  stopSfx(){ for (const s of this.sfxLive) { try { s.stop(); } catch {} } this.stopYtSfx(); },
  preloadSfx(){ for (const s of sounds) if (s.kind === "sfx" && s.source !== "youtube") this.buffer(s).catch(() => {}); this.syncYtPool(); },
  previewToggle(s){
    this.init();
    if (this.preview) { const p = this.preview; this.preview = null; p.stop(.3); if (p.sid === s.id) return render(); }
    if (s.source === "youtube") this.preview = this.ytVoice(s, .9, null, {noMaster:true, mode:"once"});
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
  A.init(); flashPad(s.id);
  A.sfx(s, s.volume ?? 1);
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
let upFP = null;
const upFolder = () => (upFP ? upFP.get() : "").trim().slice(0, 40);
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
      const {error} = await sb.from("sounds").insert({name, kind, source:"file", url, storage_path:path, volume:defVol(kind), duration:Math.round(duration*10)/10, folder: upFolder() || null});
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
  const kind = upKind;
  const yt_start = parseTime($("#ytStart").value) ?? ytStart(link);
  const yt_end = parseTime($("#ytEnd").value);
  const {error} = await sb.from("sounds").insert({name, kind, source:"youtube", yt_id:id, url:"https://www.youtube.com/watch?v=" + id, volume:defVol(kind), yt_start: yt_start || null, yt_end: yt_end || null, folder: upFolder() || null});
  btn.disabled = false;
  if (error) { err.textContent = "Não salvei: " + error.message; return; }
  $("#ytUrl").value = ""; $("#ytName").value = ""; $("#ytStart").value = ""; $("#ytEnd").value = "";
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
    <div class="field">Pasta</div>
    <div id="upFolders" style="margin-bottom:12px"></div>
    <div id="paneFile">
      <p>MP3, WAV, OGG, M4A e WEBM. Até 50 MB por arquivo.</p>
      <label class="drop" id="drop" for="fileIn">Arraste os arquivos aqui ou <u>escolha no computador</u></label>
      <input type="file" id="fileIn" accept="audio/*,.mp3,.wav,.ogg,.m4a,.webm,.flac" multiple hidden>
    </div>
    <div id="paneYt" hidden>
      <p>Cole o link de um vídeo. Toca sincronizado para todos. Dá para escolher só um trecho: útil para pegar um efeito de um vídeo com vários sons.</p>
      <label class="field">Link do vídeo<input id="ytUrl" type="url" placeholder="https://www.youtube.com/watch?v=…"></label>
      <label class="field">Nome (opcional, pega o título do vídeo)<input id="ytName" type="text" maxlength="60"></label>
      <div style="display:flex;gap:10px"><label class="field" style="flex:1">Começa em (opcional)<input id="ytStart" type="text" placeholder="0:12"></label><label class="field" style="flex:1">Termina em (opcional)<input id="ytEnd" type="text" placeholder="0:15"></label></div>
      <div class="login"><div class="err" id="ytErr"></div></div>
      <button class="btn primary" id="ytAdd">Salvar link</button>
    </div>
    <div class="queue" id="queue"></div>
    <div class="foot"><button class="btn" id="upClose">Fechar</button></div></div>`;
  document.body.appendChild(ov);
  upFP = folderPicker($("#upFolders"), curFolder && curFolder !== "__fav" ? curFolder : "");
  const seg = $("#kindSeg");
  const paint = () => {
    seg.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.dataset.k === upKind));
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
  const isYt = s.source === "youtube";
  m.innerHTML = `<label>Nome<input type="text" id="mName" maxlength="60"></label>
    <label>Tipo</label>
    <div class="pick" id="mKinds">${KIND_BTNS.map(([k, l]) => `<button type="button" class="pbtn" data-kind="${k}">${l}</button>`).join("")}</div>
    <label>Pasta</label>
    <div id="mFolders"></div>
    <label>Cor</label>
    <div class="swatches" id="mColors" role="radiogroup" aria-label="Cor do botão">${COLORS.map(([c, n]) => `<button type="button" role="radio" class="swatch-btn ${c ? "" : "none"}" data-color="${c}" title="${n}" aria-label="${n}" style="${c ? "background:" + c : ""}"></button>`).join("")}</div>
    <label>Ícone<input type="text" id="mEmoji" maxlength="8" placeholder="cole ou escolha um emoji"></label>
    <div class="emoji-pick" id="mEmojis">${EMOJIS.map(e => `<button type="button" data-emoji="${e}" aria-label="${e}">${e}</button>`).join("")}<button type="button" data-emoji="" class="clear" title="Sem ícone">✕</button></div>
    ${isYt ? `<div style="display:flex;gap:8px"><label style="flex:1">Começa em<input type="text" id="mStart" placeholder="0:00"></label><label style="flex:1">Termina em<input type="text" id="mEnd" placeholder="fim"></label></div>` : ""}
    <label>Volume padrão<input type="range" id="mVol" min="0" max="1" step="0.05"></label>
    <div class="acts"><button class="btn danger" id="mDel">Excluir</button><button class="btn primary" id="mSave">Salvar</button></div>`;
  document.body.appendChild(m); openMenu = m;
  $("#mName", m).value = s.name; $("#mVol", m).value = s.volume ?? 1;
  let kind = s.kind;
  const paintKinds = () => m.querySelectorAll("[data-kind]").forEach(b => b.setAttribute("aria-pressed", b.dataset.kind === kind));
  paintKinds();
  $("#mKinds", m).onclick = e => { const b = e.target.closest("[data-kind]"); if (b) { kind = b.dataset.kind; paintKinds(); } };
  const fp = folderPicker($("#mFolders", m), s.folder || "");
  let color = safeColor(s.color);
  const paintColors = () => m.querySelectorAll("[data-color]").forEach(b => b.setAttribute("aria-checked", b.dataset.color === color));
  paintColors();
  $("#mColors", m).onclick = e => { const b = e.target.closest("[data-color]"); if (b) { color = b.dataset.color; paintColors(); } };
  $("#mEmoji", m).value = s.emoji || "";
  $("#mEmojis", m).onclick = e => { const b = e.target.closest("[data-emoji]"); if (b) $("#mEmoji", m).value = b.dataset.emoji; };
  if (isYt) { $("#mStart", m).value = s.yt_start ? fmtTime(s.yt_start) : ""; $("#mEnd", m).value = s.yt_end ? fmtTime(s.yt_end) : ""; }
  const r = anchor.getBoundingClientRect();
  const top = window.scrollY + r.bottom + 4;
  m.style.top = top + "px";
  m.style.left = Math.max(16, Math.min(window.scrollX + r.right - 280, document.documentElement.clientWidth - 296)) + "px";
  // não deixa o menu sair da tela embaixo
  const mh = m.offsetHeight; if (r.bottom + 4 + mh > window.innerHeight) m.style.top = Math.max(window.scrollY + 8, window.scrollY + r.top - mh - 4) + "px";
  $("#mSave", m).onclick = async () => {
    const data = {name:$("#mName", m).value.trim() || s.name, kind, volume:parseFloat($("#mVol", m).value),
      folder: fp.get() || null, color: color || null, emoji: firstGrapheme($("#mEmoji", m).value) || null};
    if (isYt) { data.yt_start = parseTime($("#mStart", m).value) || null; data.yt_end = parseTime($("#mEnd", m).value) || null; }
    closeMenu();
    const {error} = await sb.from("sounds").update(data).eq("id", s.id);
    if (error) toast("Não salvei: " + error.message); else toast("“" + data.name + "” salvo.");
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
async function toggleFav(s){
  const {error} = await sb.from("sounds").update({favorite: !s.favorite}).eq("id", s.id);
  if (error) toast("Não favoritei: " + error.message);
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
  const fl = folders();
  if (curFolder && curFolder !== "__fav" && !fl.includes(curFolder)) curFolder = "";
  const f = filter.toLowerCase();
  const match = s => (!f || s.name.toLowerCase().includes(f) || (s.folder || "").toLowerCase().includes(f))
    && (!curFolder || (curFolder === "__fav" ? s.favorite : (s.folder || "") === curFolder));
  const order = (a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0);
  const music = sounds.filter(s => s.kind === "music" && match(s)).sort(order);
  const amb = sounds.filter(s => s.kind === "ambient" && match(s)).sort(order);
  const sfx = sounds.filter(s => s.kind === "sfx" && match(s)).sort(order);
  visibleSfx = sfx;
  const pv = A.preview?.sid;
  const yt = s => s.source === "youtube" ? '<span class="badge-yt">YT</span>' : "";
  const star = s => `<button class="icon-btn star ${s.favorite ? "on" : ""}" data-fav="${s.id}" title="${s.favorite ? "Tirar dos favoritos" : "Favoritar"}" aria-label="${s.favorite ? "Tirar dos favoritos" : "Favoritar"} ${esc(s.name)}" aria-pressed="${!!s.favorite}">${s.favorite ? ICON.starOn : ICON.star}</button>`;
  const tools = s => `<span class="tools">${star(s)}<button class="icon-btn" data-prev="${s.id}" title="Pré-ouvir só aqui" aria-label="Pré-ouvir ${esc(s.name)}" style="${pv === s.id ? "color:var(--brass)" : ""}">${ICON.ear}</button><button class="icon-btn" data-menu="${s.id}" title="Editar, mover de pasta ou de tipo" aria-label="Editar ${esc(s.name)}">${ICON.dots}</button></span>`;
  const count = k => k === "" ? sounds.length : k === "__fav" ? sounds.filter(s => s.favorite).length : sounds.filter(s => (s.folder || "") === k).length;
  const chip = (k, label) => `<button class="fchip" data-folder="${esc(k)}" aria-pressed="${curFolder === k}">${label} <span>${count(k)}</span></button>`;
  const keep = document.activeElement?.id;
  v.innerHTML = `
  <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;align-items:center">
    <button class="btn primary" id="upBtn">${ICON.up} Adicionar sons</button>
    <input class="search" id="search" type="search" placeholder="Buscar som ou pasta…" value="${esc(filter)}" aria-label="Buscar som">
    <span style="flex:1"></span>
    <label class="sub" style="display:flex;align-items:center;gap:8px">${ICON.vol}<input type="range" id="myVol" min="0" max="1" step="0.05" value="${myVol}" aria-label="Volume só no seu PC"></label>
    <button class="btn danger" id="stopAll">${ICON.hush} Silêncio total</button>
  </div>
  <nav class="folders" aria-label="Pastas">
    ${chip("", "Todas")}${chip("__fav", ICON.starOn + " Favoritos")}${fl.map(n => chip(n, ICON.folder + " " + esc(n))).join("")}
  </nav>
  ${curFolder && curFolder !== "__fav" ? `<div class="folder-bar" id="folderBar">
    <span class="sub">Pasta <b>${esc(curFolder)}</b> · ${count(curFolder)} ${count(curFolder) === 1 ? "som" : "sons"}</span>
    <button class="btn small" id="fRename">Renomear</button>
    <button class="btn small danger" id="fDelete">Excluir pasta</button>
  </div>` : ""}
  <div class="board">
    <section class="sec music-sec">
      <div class="sec-head"><span class="swatch"></span><h2>Trilha</h2><span class="hint">uma por vez, em loop</span></div>
      ${music.length ? `<div class="list">${music.map(s => { const on = live.music?.sid === s.id;
        return `<div class="row ${on ? "active" : ""} ${safeColor(s.color) ? "colored" : ""}"${look(s)}><button class="play" data-music="${s.id}" aria-label="${on ? "Parar" : "Tocar"} ${esc(s.name)}">${on ? ICON.stop : ICON.play}</button>
        <span class="name">${emo(s)}${esc(s.name)}${yt(s)}${on ? '<span class="eq"><i></i><i></i><i></i></span>' : ""}</span><span class="meta">${fmtDur(s.duration)}</span>${tools(s)}</div>`; }).join("")}</div>` : `<div class="empty">${curFolder ? "Nenhuma trilha aqui." : "Nenhuma trilha ainda. Use “Adicionar sons”."}</div>`}
      ${live.music ? `<div class="live-vol">Volume da trilha <input type="range" id="musicVol" min="0" max="1" step="0.02" value="${live.music.vol ?? .8}"></div>` : ""}
    </section>
    <section class="sec amb-sec">
      <div class="sec-head"><span class="swatch"></span><h2>Ambiente</h2><span class="hint">camadas somam, em loop</span></div>
      ${amb.length ? `<div class="amb-grid">${amb.map(s => { const on = !!live.amb?.[s.id];
        return `<div class="amb ${on ? "on" : ""} ${safeColor(s.color) ? "colored" : ""}"${look(s)}><button class="toggle" data-amb="${s.id}" aria-pressed="${on}"><span class="sw"></span><span>${emo(s)}${esc(s.name)}</span></button>
        ${on ? `<input type="range" min="0" max="1" step="0.02" value="${live.amb[s.id].vol ?? .7}" data-ambvol="${s.id}" aria-label="Volume de ${esc(s.name)}">` : `<span class="sub">${fmtDur(s.duration) || "&nbsp;"}${yt(s)}</span>`}
        ${tools(s)}</div>`; }).join("")}</div>` : `<div class="empty">${curFolder ? "Nenhum ambiente aqui." : "Nenhum ambiente ainda."}</div>`}
    </section>
    <section class="sec sfx-sec">
      <div class="sec-head"><span class="swatch"></span><h2>Efeitos</h2><span class="hint">toca uma vez para todos · atalhos no teclado</span></div>
      ${sfx.length ? `<div class="pads">${sfx.map((s, i) => { const k = KEYS[i];
        return `<div class="pad-wrap"><button class="pad ${s.favorite ? "fav" : ""} ${safeColor(s.color) ? "colored" : ""}" data-id="${s.id}" data-sfx="${s.id}"${safeColor(s.color) ? ` style="width:100%;--c:${safeColor(s.color)}"` : ' style="width:100%"'}>${k ? `<span class="key">${k}</span>` : ""}${emo(s, "pemoji")}<span class="pname">${esc(s.name)}${yt(s)}</span></button>${tools(s)}</div>`; }).join("")}</div>` : `<div class="empty">${curFolder ? "Nenhum efeito aqui." : "Nenhum efeito ainda."}</div>`}
    </section>
  </div>`;
  $("#upBtn").onclick = openUpload;
  $("#stopAll").onclick = stopAll;
  const se = $("#search"); se.oninput = e => { filter = e.target.value; render(); };
  if (keep === "search") { se.focus(); se.setSelectionRange(se.value.length, se.value.length); }
  $("#myVol").oninput = e => setMyVol(parseFloat(e.target.value));
  const mv = $("#musicVol"); if (mv) mv.oninput = e => setLiveVol("music", null, parseFloat(e.target.value));
  v.querySelectorAll("[data-ambvol]").forEach(r => r.oninput = e => setLiveVol("amb", r.dataset.ambvol, parseFloat(e.target.value)));
  const fr = $("#fRename"), fd = $("#fDelete");
  if (fr) fr.onclick = () => {
    const bar = $("#folderBar");
    bar.innerHTML = `<input type="text" id="fNewName" maxlength="40" class="search" style="max-width:220px" aria-label="Novo nome da pasta"><button class="btn small primary" id="fSave">Salvar</button><button class="btn small" id="fCancel">Cancelar</button>`;
    const inp = $("#fNewName"); inp.value = curFolder; inp.focus(); inp.select();
    const save = async () => {
      const nv = inp.value.trim().slice(0, 40); if (!nv || nv === curFolder) return render();
      const old = curFolder;
      const {error} = await sb.from("sounds").update({folder: nv}).eq("folder", old);
      if (error) return toast("Não renomeei: " + error.message);
      curFolder = nv; try { localStorage.setItem("mesa.folder", nv); } catch {}
      toast("Pasta renomeada para “" + nv + "”.");
    };
    $("#fSave").onclick = save; inp.onkeydown = e => { if (e.key === "Enter") save(); if (e.key === "Escape") render(); };
    $("#fCancel").onclick = () => render();
  };
  if (fd) fd.onclick = async () => {
    if (!fd.dataset.arm) { fd.dataset.arm = 1; fd.textContent = "Confirmar: os sons ficam sem pasta"; return; }
    const old = curFolder;
    const {error} = await sb.from("sounds").update({folder: null}).eq("folder", old);
    if (error) return toast("Não excluí a pasta: " + error.message);
    curFolder = ""; try { localStorage.setItem("mesa.folder", ""); } catch {}
    toast("Pasta “" + old + "” excluída. Os sons continuam em Todas.");
  };
  v.querySelectorAll("[data-folder]").forEach(b => b.onclick = () => { curFolder = b.dataset.folder; try { localStorage.setItem("mesa.folder", curFolder); } catch {} render(); });
}

$("#view").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b || !isGM) return;
  const s = byId(b.dataset.music || b.dataset.amb || b.dataset.sfx || b.dataset.prev || b.dataset.menu || b.dataset.fav);
  if (!s) return;
  if (b.dataset.fav) return toggleFav(s);
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
  const pm = $("#pMusic"); pm.textContent = m ? (m.emoji ? m.emoji + " " : "") + m.name : "silêncio"; pm.classList.toggle("none", !m);
  $("#pAmb").innerHTML = ambs.length ? ambs.map(s => `<span class="chip on"><span class="dot"></span>${s.emoji ? esc(s.emoji) + " " : ""}${esc(s.name)}</span>`).join("") : `<span class="sub">nenhum</span>`;
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
  const s = visibleSfx[i]; if (!s) return;
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
    lastSfx = (s.emoji ? s.emoji + " " : "") + s.name;
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

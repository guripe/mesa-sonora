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
let folderColors = {}, folderSort = {};    // nome da pasta -> cor
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
const folders = () => [...new Set(sounds.map(s => (s.folder || "").trim()).filter(Boolean))].sort((a, b) => ((folderSort[a] ?? 1e9) - (folderSort[b] ?? 1e9)) || a.localeCompare(b, "pt-BR"));
// ordem manual dos sons: coluna "sort"; sem ela, ordem de criação
const soundKey = s => s.sort ?? (1e6 + sounds.indexOf(s));
const bySort = (a, b) => soundKey(a) - soundKey(b);
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
    const o = this.ytVoice(s, vol, null, {mode:"once"});
    this.ytOnce.set(s.id, o);
    const kill = o.destroy; o.destroy = () => { if (this.ytOnce.get(s.id) === o) this.ytOnce.delete(s.id); kill(); };
  },
  ytOnce: new Map(),
  stopYtSfx(){ for (const v of this.ytPool.values()) v.pause(); for (const o of [...this.ytOnce.values()]) o.destroy(); },
  // efeito tocando agora?
  sfxPlaying(sid){
    for (const src of this.sfxLive) if (src.sid === sid) return true;
    const v = this.ytPool.get(sid);
    if (v?.ready) { try { const st = v.player.getPlayerState(); if (st === 1 || st === 3) return true; } catch {} }
    return this.ytOnce.has(sid);
  },
  stopSfxOne(sid){
    for (const src of [...this.sfxLive]) if (src.sid === sid) { try { src.stop(); } catch {} this.sfxLive.delete(src); }
    this.ytPool.get(sid)?.pause();
    const o = this.ytOnce.get(sid); if (o) o.destroy();
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
      src.sid = s.id;
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
  A.init();
  // clicou de novo enquanto toca: para o efeito para todos
  if (A.sfxPlaying(s.id)) {
    A.stopSfxOne(s.id);
    chan?.send({type:"broadcast", event:"sfxstop", payload:{sid:s.id}});
    return;
  }
  flashPad(s.id);
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
  const order = bySort;
  const music = sounds.filter(s => s.kind === "music" && match(s)).sort(order);
  const amb = sounds.filter(s => s.kind === "ambient" && match(s)).sort(order);
  const sfx = sounds.filter(s => s.kind === "sfx" && match(s)).sort(order);
  visibleSfx = sfx;
  const pv = A.preview?.sid;
  const yt = s => s.source === "youtube" ? '<span class="badge-yt">YT</span>' : "";
  const star = s => `<button class="icon-btn star ${s.favorite ? "on" : ""}" data-fav="${s.id}" title="${s.favorite ? "Tirar dos favoritos" : "Favoritar"}" aria-label="${s.favorite ? "Tirar dos favoritos" : "Favoritar"} ${esc(s.name)}" aria-pressed="${!!s.favorite}">${s.favorite ? ICON.starOn : ICON.star}</button>`;
  const tools = s => `<span class="tools">${star(s)}<button class="icon-btn" data-prev="${s.id}" title="Pré-ouvir só aqui" aria-label="Pré-ouvir ${esc(s.name)}" style="${pv === s.id ? "color:var(--brass)" : ""}">${ICON.ear}</button><button class="icon-btn" data-menu="${s.id}" title="Editar, mover de pasta ou de tipo" aria-label="Editar ${esc(s.name)}">${ICON.dots}</button></span>`;
  const count = k => k === "" ? sounds.length : k === "__fav" ? sounds.filter(s => s.favorite).length : sounds.filter(s => (s.folder || "") === k).length;
  const chip = (k, label) => { const fc = safeColor(folderColors[k]); return `<button class="fchip ${fc ? "colored" : ""}" data-folder="${esc(k)}"${k && k !== "__fav" ? ' draggable="true"' : ""} aria-pressed="${curFolder === k}"${fc ? ` style="--c:${fc}"` : ""}>${label} <span>${count(k)}</span></button>`; };
  const keep = document.activeElement?.id;
  v.innerHTML = `
  <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;align-items:center">
    <button class="btn primary" id="upBtn">${ICON.up} Adicionar sons</button>
    <input class="search" id="search" type="search" placeholder="Buscar som ou pasta…" value="${esc(filter)}" aria-label="Buscar som">
    <span style="flex:1"></span>
    <a class="btn dice-btn" href="/mapa.html" target="mesa-mapa" title="Abre o mapa com grid numa aba nova">${MAP_ICON} Mapa</a>
    <button class="btn dice-btn" id="diceBtn" aria-haspopup="dialog" title="Rolar dados (só você vê)">${DICE_ICON} Rolar dados</button>
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
    <span class="sub" style="margin-left:6px">Cor:</span>
    <span class="swatches" id="fColors" role="radiogroup" aria-label="Cor da pasta" style="margin:0">${COLORS.map(([c, n]) => `<button type="button" role="radio" class="swatch-btn ${c ? "" : "none"}" data-fcolor="${c}" title="${n}" aria-label="${n}" aria-checked="${(safeColor(folderColors[curFolder]) || "") === c}" style="${c ? "background:" + c : ""}"></button>`).join("")}</span>
  </div>` : ""}
  <div class="board">
    <section class="sec music-sec" data-dropkind="music">
      <div class="sec-head"><span class="swatch"></span><h2>Trilha</h2><span class="hint">uma por vez, em loop · arraste para reorganizar</span></div>
      ${music.length ? `<div class="list scroll-box">${music.map(s => { const on = live.music?.sid === s.id;
        return `<div class="row ${on ? "active" : ""} ${safeColor(s.color) ? "colored" : ""}" draggable="true" data-drag="${s.id}"${look(s)}><button class="play" data-music="${s.id}" aria-label="${on ? "Parar" : "Tocar"} ${esc(s.name)}">${on ? ICON.stop : ICON.play}</button>
        <span class="name">${emo(s)}${esc(s.name)}${yt(s)}${on ? '<span class="eq"><i></i><i></i><i></i></span>' : ""}</span><span class="meta">${fmtDur(s.duration)}</span>${tools(s)}</div>`; }).join("")}</div>` : `<div class="empty">${curFolder ? "Nenhuma trilha aqui." : "Nenhuma trilha ainda. Use “Adicionar sons”."}</div>`}
      ${live.music ? `<div class="live-vol">Volume da trilha <input type="range" id="musicVol" min="0" max="1" step="0.02" value="${live.music.vol ?? .8}"></div>` : ""}
    </section>
    <section class="sec amb-sec" data-dropkind="ambient">
      <div class="sec-head"><span class="swatch"></span><h2>Ambiente</h2><span class="hint">camadas somam, em loop</span></div>
      ${amb.length ? `<div class="amb-grid scroll-box">${amb.map(s => { const on = !!live.amb?.[s.id];
        return `<div class="amb ${on ? "on" : ""} ${safeColor(s.color) ? "colored" : ""}" draggable="true" data-drag="${s.id}"${look(s)}><button class="toggle" data-amb="${s.id}" aria-pressed="${on}"><span class="sw"></span><span>${emo(s)}${esc(s.name)}</span></button>
        ${on ? `<input type="range" min="0" max="1" step="0.02" value="${live.amb[s.id].vol ?? .7}" data-ambvol="${s.id}" aria-label="Volume de ${esc(s.name)}">` : `<span class="sub">${fmtDur(s.duration) || "&nbsp;"}${yt(s)}</span>`}
        ${tools(s)}</div>`; }).join("")}</div>` : `<div class="empty">${curFolder ? "Nenhum ambiente aqui." : "Nenhum ambiente ainda."}</div>`}
    </section>
    <section class="sec sfx-sec" data-dropkind="sfx">
      <div class="sec-head"><span class="swatch"></span><h2>Efeitos</h2><span class="hint">toca uma vez para todos · atalhos no teclado</span></div>
      ${sfx.length ? `<div class="pads scroll-box">${sfx.map((s, i) => { const k = KEYS[i];
        return `<div class="pad-wrap" draggable="true" data-drag="${s.id}"><button class="pad ${s.favorite ? "fav" : ""} ${safeColor(s.color) ? "colored" : ""}" data-id="${s.id}" data-sfx="${s.id}"${safeColor(s.color) ? ` style="width:100%;--c:${safeColor(s.color)}"` : ' style="width:100%"'}>${k ? `<span class="key">${k}</span>` : ""}${emo(s, "pemoji")}<span class="pname">${esc(s.name)}${yt(s)}</span></button>${tools(s)}</div>`; }).join("")}</div>` : `<div class="empty">${curFolder ? "Nenhum efeito aqui." : "Nenhum efeito ainda."}</div>`}
    </section>
  </div>`;
  $("#upBtn").onclick = openUpload;
  $("#diceBtn").onclick = e => { e.stopPropagation(); toggleDicePanel(); };
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
      if (folderColors[old] || folderSort[old] != null) { const row = {name: nv, color: folderColors[old] || null}; if (folderSort[old] != null) row.sort = folderSort[old]; await sb.from("folders").upsert(row); await sb.from("folders").delete().eq("name", old); }
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
    await sb.from("folders").delete().eq("name", old);
    curFolder = ""; try { localStorage.setItem("mesa.folder", ""); } catch {}
    toast("Pasta “" + old + "” excluída. Os sons continuam em Todas.");
  };
  const fcs = $("#fColors");
  if (fcs) fcs.onclick = async e => {
    const b = e.target.closest("[data-fcolor]"); if (!b) return;
    const color = b.dataset.fcolor || null, name = curFolder;
    folderColors = {...folderColors, [name]: color}; render();
    const {error} = await sb.from("folders").upsert({name, color});
    if (error) toast("Não salvei a cor: " + error.message);
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

// ---------- arrastar e soltar (só o mestre) ----------
let dragSid = null, dragFolder = null, downEl = null;
const view = () => $("#view");
const clearMarks = () => view().querySelectorAll(".drop-before,.drop-after,.drop-into,.is-dragging").forEach(el => el.classList.remove("drop-before", "drop-after", "drop-into", "is-dragging"));
document.addEventListener("pointerdown", e => { downEl = e.target; }, true);
function endDrag(){
  dragSid = dragFolder = null; clearMarks();
  dragging = false; if (pendingRender) { pendingRender = false; render(); }
}
$("#view").addEventListener("dragstart", e => {
  if (!isGM) return;
  if (downEl?.matches?.("input,textarea")) { e.preventDefault(); return; }
  const item = e.target.closest?.("[data-drag]"), chip = e.target.closest?.(".fchip[draggable]");
  if (item) { dragSid = item.dataset.drag; e.dataTransfer.setData("text/x-sound", dragSid); item.classList.add("is-dragging"); }
  else if (chip) { dragFolder = chip.dataset.folder; e.dataTransfer.setData("text/x-folder", dragFolder); chip.classList.add("is-dragging"); }
  else return;
  e.dataTransfer.effectAllowed = "move"; dragging = true;
});
$("#view").addEventListener("dragend", endDrag);
function dropTarget(e){
  const t = e.target;
  if (dragSid) {
    const chip = t.closest?.(".fchip"); if (chip) return {type:"folder", el:chip};
    const it = t.closest?.("[data-drag]");
    if (it && it.dataset.drag !== dragSid) {
      const r = it.getBoundingClientRect(), row = it.classList.contains("row");
      const after = row ? e.clientY > r.top + r.height / 2 : e.clientX > r.left + r.width / 2;
      return {type:"item", el:it, after};
    }
    const sec = t.closest?.("[data-dropkind]"); if (sec) return {type:"section", el:sec};
  } else if (dragFolder != null) {
    const chip = t.closest?.(".fchip[draggable]");
    if (chip && chip.dataset.folder !== dragFolder) { const r = chip.getBoundingClientRect(); return {type:"fchip", el:chip, after: e.clientX > r.left + r.width / 2}; }
  }
  return null;
}
$("#view").addEventListener("dragover", e => {
  if (!dragSid && dragFolder == null) return;
  const d = dropTarget(e);
  view().querySelectorAll(".drop-before,.drop-after,.drop-into").forEach(el => el.classList.remove("drop-before", "drop-after", "drop-into"));
  if (!d) return;
  e.preventDefault(); e.dataTransfer.dropEffect = "move";
  d.el.classList.add(d.type === "item" || d.type === "fchip" ? (d.after ? "drop-after" : "drop-before") : "drop-into");
  // rolagem automática perto das bordas da lista
  const box = e.target.closest?.(".scroll-box");
  if (box) { const r = box.getBoundingClientRect(); if (e.clientY < r.top + 40) box.scrollTop -= 12; else if (e.clientY > r.bottom - 40) box.scrollTop += 12; }
});
$("#view").addEventListener("drop", async e => {
  if (!dragSid && dragFolder == null) return;
  e.preventDefault();
  const d = dropTarget(e), sid = dragSid, fname = dragFolder;
  endDrag();
  if (!d) return;
  if (fname != null) return moveFolder(fname, d.el.dataset.folder, d.after);
  const s = byId(sid); if (!s) return;
  if (d.type === "folder") {
    const k = d.el.dataset.folder;
    if (k === "__fav") { if (!s.favorite) toggleFav(s); return; }
    const folder = k || null; if ((s.folder || null) === folder) return;
    s.folder = folder; render();
    const {error} = await sb.from("sounds").update({folder}).eq("id", s.id);
    if (error) toast("Não movi: " + error.message); else toast(`“${s.name}” → ${folder ? "pasta " + folder : "sem pasta"}.`);
    return;
  }
  const kind = d.type === "item" ? byId(d.el.dataset.drag)?.kind : d.el.dataset.dropkind;
  if (!kind) return;
  const list = sounds.filter(x => x.kind === kind && x.id !== s.id).sort(bySort);
  let at = list.length;
  if (d.type === "item") { at = list.findIndex(x => x.id === d.el.dataset.drag); if (at < 0) at = list.length; else if (d.after) at++; }
  list.splice(at, 0, s);
  const kindChanged = s.kind !== kind;
  const changes = [];
  list.forEach((x, i) => { if (x.sort !== i || (x === s && kindChanged)) changes.push([x, i]); });
  for (const [x, i] of changes) x.sort = i;
  if (kindChanged) {
    s.kind = kind;
    if (live.music?.sid === s.id || live.amb?.[s.id]) { const amb = {...(live.amb || {})}; delete amb[s.id]; saveLive({music: live.music?.sid === s.id ? null : live.music, amb}); }
    if (joined) { A.sync(); A.preloadSfx(); }
  }
  render();
  const res = await Promise.all(changes.map(([x, i]) => sb.from("sounds").update(x === s && kindChanged ? {sort:i, kind} : {sort:i}).eq("id", x.id)));
  const err = res.find(r => r.error)?.error;
  if (err) toast("Não salvei a ordem: " + err.message);
  else if (kindChanged) toast(`“${s.name}” agora é ${KIND_BTNS.find(k => k[0] === kind)[1].toLowerCase()}.`);
});
async function moveFolder(name, target, after){
  const list = folders().filter(n => n !== name);
  let at = list.indexOf(target); if (at < 0) return; if (after) at++;
  list.splice(at, 0, name);
  folderSort = Object.fromEntries(list.map((n, i) => [n, i])); render();
  const {error} = await sb.from("folders").upsert(list.map((n, i) => ({name:n, sort:i, color: folderColors[n] || null})));
  if (error) toast("Não salvei a ordem das pastas: " + error.message);
}

// ---------- rolador de dados (só o mestre vê) ----------
const DICE = [4, 6, 8, 10, 12, 20];
const MAP_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14m6-12v14"/></svg>';
const DICE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 2 21 7v10l-9 5-9-5V7z"/><path d="M12 2v7m0 0-9-2m9 2 9-2m-9 2-5 8m5-8 5 8M3 17h18M7 17l5 5 5-5"/></svg>';
const DIE_SHAPE = {
  4: "polygon(50% 4%, 97% 90%, 3% 90%)",
  6: "polygon(8% 8%, 92% 8%, 92% 92%, 8% 92%)",
  8: "polygon(50% 2%, 96% 50%, 50% 98%, 4% 50%)",
  10: "polygon(50% 2%, 97% 40%, 80% 90%, 20% 90%, 3% 40%)",
  12: "polygon(50% 2%, 90% 22%, 98% 65%, 72% 97%, 28% 97%, 2% 65%, 10% 22%)",
  20: "polygon(50% 1%, 94% 25%, 94% 75%, 50% 99%, 6% 75%, 6% 25%)",
};
const DIE_COLOR = {4:"#6a8f4e", 6:"#b8872f", 8:"#4a72b8", 10:"#8a5bb0", 12:"#b0563d", 20:"#c9a227"};
let diceCounts = (() => { try { return JSON.parse(localStorage.getItem("mesa.dice")) || {}; } catch { return {}; } })();
let diceMod = 0;
const saveDice = () => { try { localStorage.setItem("mesa.dice", JSON.stringify(diceCounts)); } catch {} };
const dieFace = (sides, val, cls = "") => `<span class="die d${sides} ${cls}" style="--dc:${DIE_COLOR[sides]};--shape:${DIE_SHAPE[sides]}"><span class="die-n">${val}</span></span>`;
function diceFormula(){
  let f = [...DICE].reverse().filter(d => diceCounts[d] > 0).map(d => `${diceCounts[d]}d${d}`).join(" + ");
  if (diceMod) f += (diceMod > 0 ? " + " : " − ") + Math.abs(diceMod);
  return f;
}
function closeDice(){ $("#dicePanel")?.remove(); $("#diceStage")?.remove(); }
function toggleDicePanel(){
  if ($("#dicePanel")) return closeDice();
  closeDice();
  const p = document.createElement("div");
  p.id = "dicePanel"; p.className = "dice-panel"; p.setAttribute("role", "dialog"); p.setAttribute("aria-label", "Rolar dados");
  document.body.appendChild(p);
  const draw = () => {
    const any = DICE.some(d => diceCounts[d] > 0);
    p.innerHTML = `<div class="dice-head"><b>Rolar dados</b><span class="sub">só você vê</span></div>
      <div class="dice-menu">${DICE.map(d => { const n = diceCounts[d] || 0; return `<div class="dcard ${n ? "on" : ""}" style="--dc:${DIE_COLOR[d]}">
        <button class="dpick" data-dplus="${d}" aria-label="Adicionar um d${d}">${dieFace(d, d, "card")}${n ? `<span class="dbadge">${n}×</span>` : ""}</button>
        <span class="dlabel">d${d}</span>
        <div class="dctl"><button class="dstep" data-dminus="${d}" aria-label="Menos um d${d}" ${n ? "" : "disabled"}>−</button><span class="dcount" aria-live="polite">${n}</span><button class="dstep" data-dplus="${d}" aria-label="Mais um d${d}">+</button></div></div>`; }).join("")}</div>
      <div class="dmod"><span class="dlabel">Bônus</span><button class="dstep" data-mod="-1" aria-label="Diminuir bônus">−</button><span class="dcount">${diceMod > 0 ? "+" + diceMod : diceMod}</span><button class="dstep" data-mod="1" aria-label="Aumentar bônus">+</button></div>
      <div class="dice-formula">${any ? esc(diceFormula()) : "Escolha os dados"}</div>
      <div class="dice-actions"><button class="btn small" id="dClear" ${any || diceMod ? "" : "disabled"}>Limpar</button>
      <button class="btn primary" id="dRoll" ${any ? "" : "disabled"}>${DICE_ICON} Jogar</button></div>`;
  };
  draw();
  const b = $("#diceBtn").getBoundingClientRect();
  p.style.top = (window.scrollY + b.bottom + 8) + "px";
  p.style.left = Math.max(12, Math.min(window.scrollX + b.left + b.width / 2 - 210, document.documentElement.clientWidth - 432)) + "px";
  p.onclick = e => {
    e.stopPropagation();
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.dplus) { const d = +t.dataset.dplus; diceCounts[d] = Math.min(20, (diceCounts[d] || 0) + 1); }
    else if (t.dataset.dminus) { const d = +t.dataset.dminus; diceCounts[d] = Math.max(0, (diceCounts[d] || 0) - 1); }
    else if (t.dataset.mod) diceMod = Math.max(-20, Math.min(20, diceMod + +t.dataset.mod));
    else if (t.id === "dClear") { diceCounts = {}; diceMod = 0; }
    else if (t.id === "dRoll") return rollDice();
    saveDice(); draw();
  };
}
document.addEventListener("click", e => { const p = $("#dicePanel"); if (p && !p.contains(e.target) && !e.target.closest("#diceBtn")) p.remove(); });

// sons dos dados: sintetizados na hora, só no PC do mestre
const DiceSnd = {
  ctx: null, out: null,
  init(){
    if (!this.ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return false; this.ctx = new C(); this.out = this.ctx.createGain(); this.out.connect(this.ctx.destination); }
    if (this.ctx.state === "suspended") this.ctx.resume();
    this.out.gain.value = Math.max(0.05, myVol);
    return true;
  },
  noise(len){ const c = this.ctx, b = c.createBuffer(1, Math.ceil(c.sampleRate * len), c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; },
  click(t, freq, vol, len = .03){
    const c = this.ctx, src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = this.noise(len); f.type = "bandpass"; f.frequency.value = freq; f.Q.value = 6;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + len);
    src.connect(f).connect(g).connect(this.out); src.start(t);
  },
  tone(t, freq, len, vol, type = "triangle", endFreq){
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t + len);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .012); g.gain.exponentialRampToValueAtTime(.001, t + len);
    o.connect(g).connect(this.out); o.start(t); o.stop(t + len + .05);
  },
  rattle(dur, n){ // dados chacoalhando e quicando na mesa
    if (!this.init()) return; const t0 = this.ctx.currentTime;
    const hits = Math.min(60, 14 + n * 8);
    for (let i = 0; i < hits; i++) { const x = Math.pow(Math.random(), 1.6) * dur; this.click(t0 + x, 1800 + Math.random() * 3200, .25 + Math.random() * .3 * (1 - x / dur), .018 + Math.random() * .02); }
  },
  land(){ // clac do dado parando
    if (!this.init()) return; const t = this.ctx.currentTime;
    this.click(t, 1200 + Math.random() * 600, .7, .05); this.tone(t, 180, .09, .35, "sine", 90);
  },
  crit(){ // fanfarra + brilho
    if (!this.init()) return; const t = this.ctx.currentTime + .05;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => { this.tone(t + i * .09, f, .5, .22, "square"); this.tone(t + i * .09, f * 2, .6, .08, "sine"); });
    [1046.5, 1318.5, 1568].forEach(f => this.tone(t + .4, f, 1.4, .16, "triangle"));
    this.tone(t + .4, 261.6, 1.2, .25, "sawtooth");
    for (let i = 0; i < 18; i++) this.tone(t + .45 + i * .05, 2000 + Math.random() * 3000, .25, .05, "sine");
  },
  fumble(){ // "uó uó uó uóóó" triste
    if (!this.init()) return; const c = this.ctx, t = c.currentTime + .05;
    const notes = [[311, .32], [293.7, .32], [277.2, .32], [261.6, 1.1]];
    let at = t;
    for (const [f, len] of notes) {
      const o = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain();
      o.type = "sawtooth"; o.frequency.setValueAtTime(f, at);
      lp.type = "lowpass"; lp.frequency.setValueAtTime(500, at); lp.frequency.linearRampToValueAtTime(1400, at + .08); lp.frequency.linearRampToValueAtTime(600, at + len);
      g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(.3, at + .04); g.gain.setValueAtTime(.3, at + len - .08); g.gain.linearRampToValueAtTime(0, at + len);
      if (len > .5) { const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 6; lg.gain.value = 7; lfo.connect(lg).connect(o.frequency); lfo.start(at + .2); lfo.stop(at + len); }
      o.connect(lp).connect(g).connect(this.out); o.start(at); o.stop(at + len + .02);
      at += len + .04;
    }
    this.tone(t, 70, .5, .4, "sine", 40);
  },
};
function critBurst(st, el){
  const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const fx = document.createElement("div"); fx.className = "crit-fx"; fx.style.left = cx + "px"; fx.style.top = cy + "px";
  let h = '<span class="crit-rays"></span><span class="crit-ring"></span>';
  for (let i = 0; i < 34; i++) { const a = Math.random() * Math.PI * 2, d = 90 + Math.random() * 190; h += `<i style="--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d}px;--s:${.5 + Math.random()};--d:${Math.random() * .25}s"></i>`; }
  fx.innerHTML = h; st.appendChild(fx); st.classList.add("flash-gold");
}
function fumbleFx(st, el){
  st.classList.add("shake-red");
  const r = el.getBoundingClientRect();
  const sk = document.createElement("div"); sk.className = "fumble-skull"; sk.textContent = "💀";
  sk.style.left = (r.left + r.width / 2) + "px"; sk.style.top = r.top + "px"; st.appendChild(sk);
}
function rollDice(){
  const dice = [];
  for (const d of [...DICE].reverse()) for (let i = 0; i < (diceCounts[d] || 0); i++) dice.push({d, v: 1 + Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32 * d)});
  if (!dice.length) return;
  const formula = diceFormula(), mod = diceMod;
  $("#dicePanel")?.remove(); $("#diceStage")?.remove();
  const st = document.createElement("div");
  st.id = "diceStage"; st.className = "dice-stage"; st.setAttribute("role", "dialog"); st.setAttribute("aria-label", "Resultado dos dados");
  st.innerHTML = `<div class="dice-table">${dice.map((x, i) => {
      const dx = (Math.random() * 2 - 1) * 260, rot = (Math.random() * 2 - 1) * 900;
      return `<span class="die d${x.d} big rolling" style="--dc:${DIE_COLOR[x.d]};--shape:${DIE_SHAPE[x.d]};--dx:${dx}px;--rot:${rot}deg;--delay:${i * 60}ms" data-i="${i}"><span class="die-n">?</span><span class="die-t">d${x.d}</span></span>`; }).join("")}</div>
    <div class="dice-result" aria-live="polite"></div>
    <div class="dice-actions"><button class="btn" id="dAgain">${DICE_ICON} Rolar de novo</button><button class="btn" id="dEdit">Mudar dados</button><button class="btn primary" id="dClose">Fechar</button></div>`;
  document.body.appendChild(st);
  const els = [...st.querySelectorAll(".die.big")];
  const t0 = performance.now(), dur = 1100;
  DiceSnd.rattle(dur / 1000 + dice.length * .06, dice.length);
  const tick = now => {
    let done = true;
    els.forEach((el, i) => {
      const end = dur + i * 60;
      const n = el.querySelector(".die-n");
      if (now - t0 < end) { done = false; if (Math.random() < .5) n.textContent = 1 + Math.floor(Math.random() * dice[i].d); }
      else if (!el.classList.contains("landed")) {
        n.textContent = dice[i].v; el.classList.remove("rolling"); el.classList.add("landed"); DiceSnd.land();
        if (dice[i].d === 20 && dice[i].v === 20) el.classList.add("crit");
        if (dice[i].d === 20 && dice[i].v === 1) el.classList.add("fumble");
      }
    });
    if (!done) return requestAnimationFrame(tick);
    const sum = dice.reduce((a, x) => a + x.v, 0) + mod;
    const d20s = dice.filter(x => x.d === 20);
    const tag = d20s.some(x => x.v === 20) ? '<span class="crit-tag">⚔️ CRÍTICO! 20 natural ⚔️</span>' : d20s.some(x => x.v === 1) ? '<span class="fumble-tag">💀 FALHA CRÍTICA… 1 natural</span>' : "";
    const critEl = els.find((el, i) => dice[i].d === 20 && dice[i].v === 20), fumEl = els.find((el, i) => dice[i].d === 20 && dice[i].v === 1);
    if (critEl) { DiceSnd.crit(); critBurst(st, critEl); }
    else if (fumEl) { DiceSnd.fumble(); fumbleFx(st, fumEl); }
    st.querySelector(".dice-result").innerHTML = `<div class="dice-total ${critEl ? "is-crit" : fumEl ? "is-fumble" : ""}">${sum}</div><div class="sub">${esc(formula)} → ${dice.map(x => x.v).join(" + ")}${mod ? (mod > 0 ? " + " : " − ") + Math.abs(mod) : ""}</div>${tag}`;
  };
  requestAnimationFrame(tick);
  st.onclick = e => {
    if (e.target.id === "dAgain" || e.target.closest("#dAgain")) return rollDice();
    if (e.target.closest("#dEdit")) { st.remove(); return toggleDicePanel(); }
    if (e.target.closest("#dClose") || e.target === st) st.remove();
  };
  st.querySelector("#dClose").focus({preventScroll: true});
}
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
      <a class="btn" href="/mapa.html" target="mesa-mapa" style="align-self:flex-start">${MAP_ICON} Abrir o mapa da mesa</a>
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
  if (e.key === "Escape" && ($("#diceStage") || $("#dicePanel"))) { closeDice(); return; }
  if (e.target.closest("input,select,textarea") || $(".overlay") || $("#diceStage") || $("#dicePanel")) return;
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
async function loadFolders(){
  const {data, error} = await sb.from("folders").select("*");
  if (error) return; // tabela ainda não existe: segue sem cores
  folderColors = Object.fromEntries(data.map(f => [f.name, f.color]));
  folderSort = Object.fromEntries(data.filter(f => f.sort != null).map(f => [f.name, f.sort])); render();
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

  await Promise.all([loadSounds(), loadLive(), loadFolders()]);

  sb.channel("db").on("postgres_changes", {event:"*", schema:"public", table:"sounds"}, () => loadSounds())
    .on("postgres_changes", {event:"*", schema:"public", table:"folders"}, () => loadFolders())
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
  chan.on("broadcast", {event:"sfxstop"}, ({payload}) => { if (payload?.sid) A.stopSfxOne(payload.sid); });
  // marca os botões de efeito que estão tocando
  setInterval(() => {
    if (!isGM) return;
    document.querySelectorAll(".pad[data-id]").forEach(el => el.classList.toggle("playing", A.sfxPlaying(el.dataset.id)));
  }, 250);
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

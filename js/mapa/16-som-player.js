"use strict";
// ---------- o som toca aqui no mapa também (não precisa da outra aba) ----------
// Toca a música/ambientes do live_state e os efeitos do canal "mesa". Se a aba da Mesa Sonora estiver aberta no mesmo PC,
// ela fica muda enquanto o mapa toca (aviso pelo BroadcastChannel), para não dobrar o som.
function ytApi() {
  if (window.YT?.Player) return Promise.resolve();
  if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
    const sc = document.createElement("script");
    sc.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(sc);
  }
  return new Promise(ok => {
    const iv = setInterval(() => {
      if (window.YT?.Player) {
        clearInterval(iv);
        ok();
      }
    }, 150);
  });
}
const MA = {
  ctx: null,
  master: null,
  music: null,
  amb: new Map(),
  bufs: new Map(),
  live: new Set(),
  yts: new Set(),
  on: (() => {
    try {
      return localStorage.getItem("mesa.mapsnd") !== "0";
    } catch {
      return true;
    }
  })(),
  vol: (() => {
    try {
      const v = parseFloat(localStorage.getItem("mesa.mapvol"));
      return isNaN(v) ? 0.85 : v;
    } catch {
      return 0.85;
    }
  })(),
  bc: (() => {
    try {
      return new BroadcastChannel("mesa-audio");
    } catch {
      return null;
    }
  })(),
  eff() {
    return this.on ? this.vol : 0;
  },
  init() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") this.ctx.resume().then(() => drawTop());
      return;
    }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return;
    }
    this.master = this.ctx.createGain();
    this.master.gain.value = this.eff();
    this.master.connect(this.ctx.destination);
    this.ctx.onstatechange = () => drawTop();
    this.sync();
    setTimeout(() => drawTop(), 300);
  },
  ok() {
    return !!this.ctx && this.ctx.state === "running";
  },
  setVol() {
    if (this.master) this.master.gain.setTargetAtTime(this.eff(), this.ctx.currentTime, 0.05);
    for (const v of [this.music, ...this.amb.values(), ...this.yts]) v?.apply?.();
  },
  dock() {
    let d = $("#maDock");
    if (!d) {
      d = document.createElement("div");
      d.id = "maDock";
      d.style.cssText = "position:fixed;left:-9999px;top:0;width:240px;height:140px;overflow:hidden";
      document.body.appendChild(d);
    }
    return d;
  },
  fileVoice(s, vol, at) {
    const el = new Audio();
    el.crossOrigin = "anonymous";
    el.src = s.url;
    el.loop = true;
    el.preload = "auto";
    const g = this.ctx.createGain();
    g.gain.value = 0;
    this.ctx.createMediaElementSource(el).connect(g).connect(this.master);
    const v = {
      sid: s.id,
      target: vol,
      at,
      fade: (to, secs) => {
        const t = this.ctx.currentTime;
        v.target = to;
        g.gain.cancelScheduledValues(t);
        g.gain.setValueAtTime(g.gain.value, t);
        g.gain.linearRampToValueAtTime(to, t + secs);
      },
      stop: (secs = 1.5) => {
        v.fade(0, secs);
        setTimeout(
          () => {
            try {
              el.pause();
              el.removeAttribute("src");
              el.load();
            } catch {}
          },
          secs * 1000 + 100,
        );
      },
    };
    const go = () => {
      const d = el.duration;
      if (at && isFinite(d) && d > 0) {
        const pos = ((Date.now() - at) / 1000) % d;
        if (pos > 0.5)
          try {
            el.currentTime = pos;
          } catch {}
      }
      el.play().catch(() => {});
      v.fade(vol, 1.2);
    };
    if (el.readyState >= 1) go();
    else el.addEventListener("loadedmetadata", go, { once: true });
    return v;
  },
  ytVoice(s, vol, at, once) {
    const start = +s.yt_start || 0,
      end = +s.yt_end || 0,
      holder = document.createElement("div");
    this.dock().appendChild(holder);
    const v = {
      sid: s.id,
      target: vol,
      cur: 0,
      at,
      player: null,
      ready: false,
      dead: false,
      apply() {
        try {
          v.player?.setVolume?.(Math.round(Math.max(0, Math.min(1, v.cur * MA.eff())) * 100));
        } catch {}
      },
      fade(to, secs) {
        v.target = to;
        clearInterval(v.iv);
        const from = v.cur,
          n = Math.max(1, Math.round((secs * 1000) / 60));
        let i = 0;
        v.iv = setInterval(() => {
          i++;
          v.cur = from + ((to - from) * i) / n;
          v.apply();
          if (i >= n) clearInterval(v.iv);
        }, 60);
      },
      stop(secs = 1.5) {
        v.fade(0, secs);
        setTimeout(() => v.destroy(), secs * 1000 + 150);
      },
      destroy() {
        v.dead = true;
        clearInterval(v.iv);
        clearInterval(v.watch);
        MA.yts.delete(v);
        try {
          v.player?.destroy();
        } catch {}
        holder.remove();
      },
    };
    this.yts.add(v);
    v.watch = setInterval(() => {
      if (!v.ready || v.dead || !end) return;
      const t = v.player.getCurrentTime?.() || 0;
      if (t >= end) {
        if (once) v.destroy();
        else v.player.seekTo(start, true);
      }
    }, 200);
    ytApi().then(() => {
      if (v.dead) return;
      v.player = new YT.Player(holder, {
        videoId: s.yt_id,
        width: 240,
        height: 135,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          playsinline: 1,
          rel: 0,
          start: Math.floor(start),
        },
        events: {
          onReady: e => {
            if (v.dead) return;
            v.ready = true;
            v.cur = 0;
            v.apply();
            const d = e.target.getDuration(),
              seg = (end || d) - start;
            let pos = start;
            if (!once && at && seg > 0) pos = start + (((Date.now() - at) / 1000) % seg);
            e.target.seekTo(pos, true);
            e.target.playVideo();
            v.fade(vol, once ? 0.15 : 1.5);
          },
          onStateChange: e => {
            if (e.data !== 0 || v.dead) return;
            if (once) v.destroy();
            else {
              e.target.seekTo(start, true);
              e.target.playVideo();
            }
          },
          onError: () => {
            if (isGM) toast(`O YouTube não deixou tocar “${s.name}” aqui.`, 4000);
          },
        },
      });
    });
    return v;
  },
  voice(s, vol, at) {
    return s.source === "youtube" ? this.ytVoice(s, vol, at) : this.fileVoice(s, vol, at);
  },
  sync() {
    if (!this.ctx || !sndList) return;
    const m = liveMap.music,
      S = m && sndById(m.sid);
    if (S) {
      if (!this.music || this.music.sid !== m.sid || this.music.at !== m.at) {
        this.music?.stop(2);
        this.music = this.voice(S, m.vol ?? 0.8, m.at);
      } else if (Math.abs(this.music.target - (m.vol ?? 0.8)) > 0.001) this.music.fade(m.vol ?? 0.8, 0.4);
    } else if (this.music) {
      this.music.stop(2);
      this.music = null;
    }
    const want = liveMap.amb || {};
    for (const [sid, v] of this.amb)
      if (!want[sid] || !sndById(sid)) {
        v.stop(2);
        this.amb.delete(sid);
      }
    for (const sid in want) {
      const s = sndById(sid);
      if (!s) continue;
      const w = want[sid],
        cur = this.amb.get(sid);
      if (!cur) this.amb.set(sid, this.voice(s, w.vol ?? 0.7, w.at));
      else if (Math.abs(cur.target - (w.vol ?? 0.7)) > 0.001) cur.fade(w.vol ?? 0.7, 0.6);
    }
  },
  async sfx(sid, vol) {
    const s = sndById(sid);
    if (!s || !this.ctx) return;
    vol = vol ?? s.volume ?? 1;
    if (s.source === "youtube") {
      this.ytVoice(s, vol, null, true);
      return;
    }
    try {
      if (!this.bufs.has(s.id))
        this.bufs.set(
          s.id,
          fetch(s.url)
            .then(r => r.arrayBuffer())
            .then(b => this.ctx.decodeAudioData(b)),
        );
      const buf = await this.bufs.get(s.id),
        src = this.ctx.createBufferSource(),
        g = this.ctx.createGain();
      src.buffer = buf;
      g.gain.value = vol;
      src.connect(g).connect(this.master);
      src.start();
      src.sid = s.id;
      this.live.add(src);
      src.onended = () => this.live.delete(src);
    } catch {
      this.bufs.delete(s.id);
    }
  },
  stopSfx(sid) {
    for (const src of [...this.live])
      if (!sid || src.sid === sid) {
        try {
          src.stop();
        } catch {}
        this.live.delete(src);
      }
    for (const v of [...this.yts])
      if (v !== this.music && ![...this.amb.values()].includes(v) && (!sid || v.sid === sid)) v.destroy();
  },
};
setInterval(() => {
  if (MA.on && MA.ok()) MA.bc?.postMessage({ k: "map", at: Date.now() });
}, 2000); // avisa a aba da Mesa Sonora: "o mapa está tocando"
addEventListener("pointerdown", () => MA.init(), true);
addEventListener("keydown", () => MA.init(), true);
function openMaPop() {
  let el = $("#maPop");
  if (el) {
    el.remove();
    return;
  }
  el = document.createElement("div");
  el.id = "maPop";
  el.className = "mapop";
  document.body.appendChild(el);
  el.onpointerdown = e => e.stopPropagation();
  const b = $("#maBtn")?.getBoundingClientRect();
  if (b) {
    el.style.top = b.bottom + 6 + "px";
    el.style.right = Math.max(8, innerWidth - b.right) + "px";
  }
  el.innerHTML = `<label class="chk"><input type="checkbox" id="maOn" ${MA.on ? "checked" : ""}> Tocar o som da mesa aqui no mapa</label>
    <label class="mp-vol">🔈 <input type="range" id="maVol" min="0" max="1" step="0.02" value="${MA.vol}" aria-label="Volume"> 🔊</label>
    <p class="hint">Música, ambientes e efeitos que o mestre toca. Se a página da Mesa Sonora estiver aberta neste PC, ela fica muda para o som não dobrar.</p>`;
  $("#maOn").onchange = e => {
    MA.on = e.target.checked;
    try {
      localStorage.setItem("mesa.mapsnd", MA.on ? "1" : "0");
    } catch {}
    MA.init();
    MA.setVol();
    drawTop();
  };
  $("#maVol").oninput = e => {
    MA.vol = +e.target.value;
    try {
      localStorage.setItem("mesa.mapvol", String(MA.vol));
    } catch {}
    MA.setVol();
  };
  setTimeout(
    () =>
      addEventListener(
        "pointerdown",
        function h(ev) {
          if (!el.contains(ev.target) && ev.target.id !== "maBtn") {
            el.remove();
            removeEventListener("pointerdown", h, true);
          }
        },
        true,
      ),
    0,
  );
}

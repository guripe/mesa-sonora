"use strict";
// ---------- voz (WebRTC entre todos, sinalização pelo Supabase) + modulador de voz do mestre ----------
const VOICE = {
  on: false,
  ch: null,
  ctx: null,
  mic: null,
  src: null,
  out: null,
  outTrack: null,
  chain: [],
  preset: "normal",
  monitor: null,
  muted: false,
  whisper: "*",
  peers: {}, // key -> {pc, sender, name, gm, audio, an, level, vol, polite, queue: []}
  meta: {},
  level: 0,
  an: null,
  meter: null,
};
const ICE = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }];
const VPRESETS = [
  ["normal", "🙂 Normal"],
  ["monstro", "👹 Monstro"],
  ["gigante", "🗿 Gigante"],
  ["demonio", "😈 Demônio"],
  ["goblin", "👺 Goblin"],
  ["fada", "🧚 Fada"],
  ["fantasma", "👻 Fantasma"],
  ["caverna", "⛰ Caverna"],
  ["robo", "🤖 Golem"],
  ["radio", "📜 Rádio / Carta"],
  ["sussurro", "🌫 Sussurro"],
];
const speakSet = new Set();
const PS_CODE = `class PS extends AudioWorkletProcessor{static get parameterDescriptors(){return[{name:"ratio",defaultValue:1,minValue:.25,maxValue:4}]}
constructor(){super();this.N=8192;this.b=new Float32Array(this.N);this.w=0;this.r=0;this.W=2048}
process(i,o,p){const x=i[0]&&i[0][0],y=o[0][0];if(!y)return true;if(!x){y.fill(0);return true}const R=p.ratio[0],N=this.N,W=this.W,b=this.b;
const tap=d=>{let q=this.w-d;if(q<0)q+=N;const i0=Math.floor(q),f=q-i0;return b[i0%N]+(b[(i0+1)%N]-b[i0%N])*f};
for(let k=0;k<x.length;k++){b[this.w]=x[k];this.r+=1-R;if(this.r>=W)this.r-=W;if(this.r<0)this.r+=W;const d1=this.r,d2=(this.r+W/2)%W,g1=Math.sin(Math.PI*d1/W),g2=Math.sin(Math.PI*d2/W);y[k]=tap(d1)*g1*g1+tap(d2)*g2*g2;this.w=(this.w+1)%N}
for(let c=1;c<o[0].length;c++)o[0][c].set(y);return true}}registerProcessor("pitch-shift",PS);`;
function vImpulse(ctx, sec, decay) {
  const n = Math.floor(ctx.sampleRate * sec),
    b = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
  }
  return b;
}
function vShaper(ctx, amt) {
  const s = ctx.createWaveShaper(),
    n = 1024,
    c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / n) * 2 - 1;
    c[i] = ((1 + amt) * x) / (1 + amt * Math.abs(x));
  }
  s.curve = c;
  s.oversample = "2x";
  return s;
}
function vBuild() {
  // monta a cadeia de efeitos entre o microfone e a saída
  const c = VOICE.ctx;
  if (!c || !VOICE.src) return;
  try {
    VOICE.src.disconnect();
  } catch {}
  for (const n of VOICE.chain) {
    try {
      n.disconnect();
    } catch {}
    try {
      n.stop?.();
    } catch {}
  }
  VOICE.chain = [];
  const keep = n => (VOICE.chain.push(n), n),
    P = VOICE.preset,
    out = VOICE.out;
  let head = VOICE.src;
  const pitch = r => {
    if (!VOICE.psOk) return;
    const n = keep(new AudioWorkletNode(c, "pitch-shift"));
    n.parameters.get("ratio").value = r;
    head.connect(n);
    head = n;
  };
  const filt = (type, f, q = 0.7, g = 0) => {
    const n = keep(c.createBiquadFilter());
    n.type = type;
    n.frequency.value = f;
    n.Q.value = q;
    n.gain.value = g;
    head.connect(n);
    head = n;
  };
  const drive = a => {
    const n = keep(vShaper(c, a));
    head.connect(n);
    head = n;
  };
  const gain = v => {
    const n = keep(c.createGain());
    n.gain.value = v;
    head.connect(n);
    head = n;
  };
  const wet = (node, mix) => {
    const dry = keep(c.createGain()),
      w = keep(c.createGain()),
      sum = keep(c.createGain());
    dry.gain.value = 1 - mix * 0.5;
    w.gain.value = mix;
    head.connect(dry);
    head.connect(node);
    node.connect(w);
    dry.connect(sum);
    w.connect(sum);
    head = sum;
  };
  const reverb = (sec, dec, mix) => {
    const cv = keep(c.createConvolver());
    cv.buffer = vImpulse(c, sec, dec);
    wet(cv, mix);
  };
  const echo = (t, fb, mix) => {
    const d = keep(c.createDelay(2)),
      g = keep(c.createGain());
    d.delayTime.value = t;
    g.gain.value = fb;
    d.connect(g);
    g.connect(d);
    wet(d, mix);
  };
  if (P === "monstro") {
    pitch(0.72);
    filt("lowshelf", 200, 0.7, 7);
    drive(3);
    reverb(0.8, 3, 0.25);
    gain(0.9);
  } else if (P === "gigante") {
    pitch(0.6);
    filt("lowshelf", 160, 0.7, 8);
    reverb(1.8, 2.5, 0.45);
  } else if (P === "demonio") {
    const split = head;
    pitch(0.62);
    const low = head;
    head = split;
    pitch(0.8);
    const mid = head;
    const m = keep(c.createGain());
    low.connect(m);
    mid.connect(m);
    head = m;
    drive(5);
    filt("lowshelf", 180, 0.7, 6);
    reverb(1.2, 2, 0.35);
    gain(0.7);
  } else if (P === "goblin") {
    pitch(1.45);
    filt("highpass", 250);
    drive(1.5);
  } else if (P === "fada") {
    pitch(1.75);
    filt("highpass", 400);
    echo(0.18, 0.35, 0.35);
    reverb(1.2, 3, 0.3);
  } else if (P === "fantasma") {
    pitch(0.92);
    filt("highpass", 300);
    echo(0.32, 0.5, 0.5);
    reverb(3, 2, 0.6);
    const lfo = keep(c.createOscillator()),
      lg = keep(c.createGain()),
      tr = keep(c.createGain());
    lfo.frequency.value = 5;
    lg.gain.value = 0.35;
    tr.gain.value = 0.65;
    lfo.connect(lg);
    lg.connect(tr.gain);
    lfo.start();
    head.connect(tr);
    head = tr;
  } else if (P === "caverna") {
    reverb(2.5, 1.8, 0.55);
    echo(0.45, 0.3, 0.25);
  } else if (P === "robo") {
    const ring = keep(c.createGain()),
      osc = keep(c.createOscillator());
    ring.gain.value = 0;
    osc.frequency.value = 55;
    osc.type = "square";
    osc.connect(ring.gain);
    osc.start();
    head.connect(ring);
    head = ring;
    filt("bandpass", 1200, 0.6);
    drive(2);
    gain(1.6);
  } else if (P === "radio") {
    filt("highpass", 500);
    filt("lowpass", 2800);
    filt("peaking", 1500, 1, 6);
    drive(4);
    gain(0.7);
  } else if (P === "sussurro") {
    filt("highpass", 900);
    filt("peaking", 3500, 1, 6);
    reverb(0.6, 3, 0.2);
    gain(1.3);
  }
  head.connect(out);
  if (VOICE.monitor) {
    head.connect(VOICE.monitor);
  }
}
function vSendSig(to, data) {
  VOICE.ch?.send({ type: "broadcast", event: "sig", payload: { to, from: myKey, ...data } });
}
function vPeer(key, initiator) {
  if (VOICE.peers[key]) return VOICE.peers[key];
  const pc = new RTCPeerConnection({ iceServers: ICE }),
    P = { pc, key, queue: [], vol: 1, level: 0, polite: myKey > key, making: false };
  VOICE.peers[key] = P;
  P.sender = pc.addTrack(VOICE.outTrack, new MediaStream([VOICE.outTrack]));
  vApplyWhisper();
  pc.onicecandidate = e => {
    if (e.candidate) vSendSig(key, { ice: e.candidate.toJSON() });
  };
  pc.onnegotiationneeded = async () => {
    try {
      P.making = true;
      await pc.setLocalDescription();
      vSendSig(key, { sdp: pc.localDescription.toJSON() });
    } catch {
    } finally {
      P.making = false;
    }
  };
  pc.ontrack = e => {
    const st = e.streams[0] || new MediaStream([e.track]);
    if (!P.audio) {
      P.audio = new Audio();
      P.audio.autoplay = true;
      P.audio.volume = P.vol;
      document.body.appendChild(P.audio);
      P.audio.style.display = "none";
    }
    P.audio.srcObject = st;
    P.audio.play().catch(() => {});
    try {
      const s = VOICE.ctx.createMediaStreamSource(st);
      P.an = VOICE.ctx.createAnalyser();
      P.an.fftSize = 512;
      s.connect(P.an);
    } catch {}
  };
  pc.onconnectionstatechange = () => {
    if (pc.connectionState === "failed") {
      try {
        pc.restartIce();
      } catch {}
    }
    vDraw();
  };
  return P;
}
async function vOnSig(p) {
  if (!VOICE.on || p.to !== myKey) return;
  const P = vPeer(p.from, false),
    pc = P.pc;
  try {
    if (p.sdp) {
      const collision = p.sdp.type === "offer" && (P.making || pc.signalingState !== "stable");
      if (collision && !P.polite) return;
      await pc.setRemoteDescription(p.sdp);
      for (const c of P.queue.splice(0)) {
        try {
          await pc.addIceCandidate(c);
        } catch {}
      }
      if (p.sdp.type === "offer") {
        await pc.setLocalDescription();
        vSendSig(p.from, { sdp: pc.localDescription.toJSON() });
      }
    } else if (p.ice) {
      if (pc.remoteDescription) await pc.addIceCandidate(p.ice);
      else P.queue.push(p.ice);
    }
  } catch (err) {
    console.warn("voz:", err);
  }
}
function vApplyWhisper() {
  // mestre sussurrando para um só: os outros não recebem a voz
  for (const [k, P] of Object.entries(VOICE.peers)) {
    const to = VOICE.whisper,
      ok = to === "*" || to === k;
    try {
      P.sender?.replaceTrack(ok && !VOICE.muted ? VOICE.outTrack : null);
    } catch {}
  }
}
async function voiceJoin() {
  if (VOICE.on) return;
  if (!navigator.mediaDevices?.getUserMedia) return toast("Este navegador não permite microfone aqui.");
  try {
    VOICE.mic = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
  } catch (err) {
    return toast(
      "Não consegui usar o microfone: " +
        (err.name === "NotAllowedError"
          ? "permissão negada (clique no cadeado ao lado do endereço)"
          : err.message),
    );
  }
  const c = (VOICE.ctx = new (window.AudioContext || window.webkitAudioContext)());
  try {
    await c.audioWorklet.addModule(
      URL.createObjectURL(new Blob([PS_CODE], { type: "application/javascript" })),
    );
    VOICE.psOk = true;
  } catch {
    VOICE.psOk = false;
  }
  VOICE.src = c.createMediaStreamSource(VOICE.mic);
  VOICE.out = c.createMediaStreamDestination();
  VOICE.outTrack = VOICE.out.stream.getAudioTracks()[0];
  VOICE.an = c.createAnalyser();
  VOICE.an.fftSize = 512;
  const tap = c.createMediaStreamSource(VOICE.out.stream);
  tap.connect(VOICE.an);
  vBuild();
  VOICE.on = true;
  VOICE.muted = false;
  const ch = (VOICE.ch = sb.channel("voz", {
    config: { broadcast: { self: false }, presence: { key: myKey } },
  }));
  ch.on("broadcast", { event: "sig" }, ({ payload }) => vOnSig(payload));
  ch.on("broadcast", { event: "whisper" }, ({ payload: p }) => {
    if (p?.to === myKey) {
      vWhisperBadge(p.on);
    }
  });
  ch.on("presence", { event: "sync" }, () => {
    const st = ch.presenceState();
    VOICE.meta = {};
    for (const [k, arr] of Object.entries(st)) VOICE.meta[k] = arr[0] || {};
    for (const k of Object.keys(VOICE.meta)) if (k !== myKey && !VOICE.peers[k] && myKey < k) vPeer(k, true);
    for (const k of Object.keys(VOICE.peers)) if (!VOICE.meta[k]) vDrop(k);
    vDraw();
  });
  ch.subscribe(s => {
    if (s === "SUBSCRIBED") ch.track({ n: isGM ? "Mestre" : myNick || "Jogador", gm: isGM });
  });
  clearInterval(VOICE.meter);
  VOICE.meter = setInterval(vMeter, 120);
  vDraw();
  toast("Você entrou na voz. Use fone de ouvido para não dar eco.", 3500);
}
function vDrop(k) {
  const P = VOICE.peers[k];
  if (!P) return;
  try {
    P.pc.close();
  } catch {}
  P.audio?.remove();
  delete VOICE.peers[k];
}
function voiceLeave() {
  if (!VOICE.on) return;
  for (const k of Object.keys(VOICE.peers)) vDrop(k);
  try {
    VOICE.ch?.unsubscribe();
  } catch {}
  VOICE.ch = null;
  clearInterval(VOICE.meter);
  VOICE.mic?.getTracks().forEach(t => t.stop());
  try {
    VOICE.ctx?.close();
  } catch {}
  Object.assign(VOICE, {
    on: false,
    ctx: null,
    mic: null,
    src: null,
    out: null,
    outTrack: null,
    chain: [],
    monitor: null,
    meta: {},
    whisper: "*",
  });
  speakSet.clear();
  dirty = true;
  vDraw();
}
const vRms = an => {
  if (!an) return 0;
  const a = new Uint8Array(an.fftSize);
  an.getByteTimeDomainData(a);
  let s = 0;
  for (const v of a) {
    const x = (v - 128) / 128;
    s += x * x;
  }
  return Math.sqrt(s / a.length);
};
function vMeter() {
  // quem está falando (acende na lista e no token)
  const was = [...speakSet].join("|");
  speakSet.clear();
  VOICE.level = VOICE.muted ? 0 : vRms(VOICE.an);
  if (VOICE.level > 0.035) speakSet.add((isGM ? "mestre" : myNick || "").toLowerCase());
  for (const [k, P] of Object.entries(VOICE.peers)) {
    P.level = vRms(P.an);
    if (P.level > 0.03) speakSet.add(String(VOICE.meta[k]?.n || "").toLowerCase());
  }
  document.querySelectorAll("[data-vk]").forEach(el => {
    const k = el.dataset.vk,
      lv = k === myKey ? VOICE.level : VOICE.peers[k]?.level || 0;
    el.classList.toggle("talk", lv > 0.03);
  });
  if ([...speakSet].join("|") !== was) dirty = true;
}
function vWhisperBadge(on) {
  let b = $("#vWhisper");
  if (!on) {
    b?.remove();
    return;
  }
  if (!b) {
    b = document.createElement("div");
    b.id = "vWhisper";
    b.className = "vwhisper";
    b.textContent = "🤫 O mestre está sussurrando só para você";
    document.body.appendChild(b);
  }
}
let vOpen = true;
function vDraw() {
  let el = $("#voiceDock");
  if (!el) {
    el = document.createElement("div");
    el.id = "voiceDock";
    el.className = "vdock";
    document.body.appendChild(el);
  }
  if (!VOICE.on) {
    el.innerHTML = `<button class="btn vjoin" id="vJoin" title="Conversar por voz com a mesa">🎙 Entrar na voz</button>`;
    $("#vJoin").onclick = voiceJoin;
    return;
  }
  const people = Object.entries(VOICE.meta).sort((a, b) => (b[1].gm ? 1 : 0) - (a[1].gm ? 1 : 0));
  const st = k => {
    const s = VOICE.peers[k]?.pc.connectionState;
    return k === myKey ? "" : s === "connected" ? "" : s === "failed" ? " · sem conexão" : " · conectando…";
  };
  el.innerHTML = `<div class="vhead"><button class="vtog" id="vTog">🎙 Voz <small>${people.length}</small> ${vOpen ? "▾" : "▸"}</button>
      <button class="btn small ${VOICE.muted ? "danger" : ""}" id="vMute" title="Microfone">${VOICE.muted ? "🔇 Mudo" : "🎤 Ligado"}</button><button class="btn small" id="vLeave" title="Sair da voz">Sair</button></div>
    ${
      vOpen
        ? `<div class="vlist">${people.map(([k, m]) => `<div class="vp" data-vk="${esc(k)}"><span class="vdot"></span><b>${esc(m.n || "?")}${m.gm ? " 👑" : ""}</b><small>${k === myKey ? "você" : ""}${st(k)}</small>${k !== myKey ? `<input type="range" min="0" max="1" step="0.05" value="${VOICE.peers[k]?.vol ?? 1}" data-vvol="${esc(k)}" title="Volume de ${esc(m.n || "")}">` : ""}</div>`).join("")}</div>
    ${
      isGM
        ? `<div class="vmod"><div class="lbl">Modulador de voz</div><div class="vpre">${VPRESETS.map(([k, l]) => `<button data-vp="${k}" aria-pressed="${VOICE.preset === k}">${l}</button>`).join("")}</div>
      ${VOICE.psOk ? "" : `<p class="hint">Este navegador não deixou mudar o tom; os outros efeitos funcionam.</p>`}
      <label class="chk"><input type="checkbox" id="vMon" ${VOICE.monitor ? "checked" : ""}> Ouvir minha voz (use fone)</label>
      <div class="lbl" style="margin-top:6px">Falar para</div><select id="vTo"><option value="*">Todos</option>${people
        .filter(([k]) => k !== myKey)
        .map(
          ([k, m]) =>
            `<option value="${esc(k)}" ${VOICE.whisper === k ? "selected" : ""}>🤫 Só ${esc(m.n || "?")}</option>`,
        )
        .join("")}</select></div>`
        : ""
    }`
        : ""
    }`;
  $("#vTog").onclick = () => {
    vOpen = !vOpen;
    vDraw();
  };
  $("#vMute").onclick = () => {
    VOICE.muted = !VOICE.muted;
    vApplyWhisper();
    vDraw();
  };
  $("#vLeave").onclick = voiceLeave;
  el.querySelectorAll("[data-vvol]").forEach(
    r =>
      (r.oninput = () => {
        const P = VOICE.peers[r.dataset.vvol];
        if (P) {
          P.vol = +r.value;
          if (P.audio) P.audio.volume = P.vol;
        }
      }),
  );
  el.querySelectorAll("[data-vp]").forEach(
    b =>
      (b.onclick = () => {
        VOICE.preset = b.dataset.vp;
        vBuild();
        vDraw();
      }),
  );
  const mon = $("#vMon");
  if (mon)
    mon.onchange = () => {
      if (mon.checked) {
        VOICE.monitor = VOICE.ctx.createGain();
        VOICE.monitor.gain.value = 0.9;
        VOICE.monitor.connect(VOICE.ctx.destination);
      } else {
        try {
          VOICE.monitor?.disconnect();
        } catch {}
        VOICE.monitor = null;
      }
      vBuild();
    };
  const to = $("#vTo");
  if (to)
    to.onchange = () => {
      const old = VOICE.whisper;
      VOICE.whisper = to.value;
      vApplyWhisper();
      if (old !== "*")
        VOICE.ch?.send({ type: "broadcast", event: "whisper", payload: { to: old, on: false } });
      if (VOICE.whisper !== "*")
        VOICE.ch?.send({ type: "broadcast", event: "whisper", payload: { to: VOICE.whisper, on: true } });
    };
}
addEventListener("beforeunload", () => {
  if (VOICE.on) voiceLeave();
});

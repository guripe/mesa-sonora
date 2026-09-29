"use strict";
// ---------- dados (mestre e jogadores) ----------
const DICE = [4, 6, 8, 10, 12, 20, 100];
const DIE_SHAPE = {
  4: "polygon(50% 4%, 97% 90%, 3% 90%)",
  6: "polygon(8% 8%, 92% 8%, 92% 92%, 8% 92%)",
  8: "polygon(50% 2%, 96% 50%, 50% 98%, 4% 50%)",
  10: "polygon(50% 2%, 97% 40%, 80% 90%, 20% 90%, 3% 40%)",
  12: "polygon(50% 2%, 90% 22%, 98% 65%, 72% 97%, 28% 97%, 2% 65%, 10% 22%)",
  20: "polygon(50% 1%, 94% 25%, 94% 75%, 50% 99%, 6% 75%, 6% 25%)",
  100: "circle(48%)",
};
const DIE_COLOR = {
  4: "#6a8f4e",
  6: "#b8872f",
  8: "#4a72b8",
  10: "#8a5bb0",
  12: "#b0563d",
  20: "#c9a227",
  100: "#5c8d8a",
};
const dShape = d => DIE_SHAPE[d] || "circle(48%)",
  dColor = d => DIE_COLOR[d] || "#8c7a5c";
const DEF_PRESETS = [
  { n: "Teste (d20)", f: "1d20" },
  { n: "Ataque", f: "1d20+3" },
  { n: "Dano", f: "1d8+2" },
  { n: "Vantagem", f: "2d20kh1" },
];
let presets = (() => {
  try {
    const v = JSON.parse(localStorage.getItem("mesa.presets"));
    return Array.isArray(v) ? v : DEF_PRESETS.slice();
  } catch {
    return DEF_PRESETS.slice();
  }
})();
const savePresets = () => {
  try {
    localStorage.setItem("mesa.presets", JSON.stringify(presets));
  } catch {}
};
// barra de atalhos (estilo Baldur's Gate): 2 fileiras, arrasta para trocar, cor e emoji em cada habilidade
const HB_COLS = 10,
  HB_ROWS = 2,
  HB_N = HB_COLS * HB_ROWS;
const HB_EMOJI = [
  "🎲",
  "⚔️",
  "🗡️",
  "🏹",
  "🪓",
  "🛡️",
  "👊",
  "🔥",
  "❄️",
  "⚡",
  "🌀",
  "✨",
  "💥",
  "🎯",
  "☠️",
  "💀",
  "🩸",
  "💚",
  "🍀",
  "🧪",
  "🔮",
  "📜",
  "👁️",
  "🐾",
  "🌙",
  "☀️",
  "🌊",
  "🪨",
  "🗣️",
  "🎵",
  "🍺",
  "💰",
];
const HB_COLORS = [
  "#7a1f1f",
  "#8a4a14",
  "#7a6414",
  "#2f6a24",
  "#1f5a6a",
  "#23408a",
  "#4a2a7e",
  "#6a2452",
  "#3a3530",
];
let hotbar = (() => {
  try {
    const v = JSON.parse(localStorage.getItem("mesa.hotbar"));
    if (Array.isArray(v)) return Array.from({ length: HB_N }, (_, i) => v[i] || null);
  } catch {}
  const out = Array(HB_N).fill(null);
  presets.forEach((p, i) => {
    if (i < HB_N)
      out[i] = {
        n: p.n,
        f: p.f,
        c: HB_COLORS[(i * 2) % HB_COLORS.length],
        e: ["🎲", "⚔️", "💥", "🍀"][i] || "🎲",
      };
  });
  return out;
})();
const saveHotbar = () => {
  try {
    localStorage.setItem("mesa.hotbar", JSON.stringify(hotbar));
  } catch {}
};
function hbAdd(p) {
  const i = hotbar.findIndex(x => !x);
  if (i < 0) {
    toast("A barra está cheia. Apague um atalho (clique direito nele).");
    return -1;
  }
  hotbar[i] = p;
  saveHotbar();
  drawDiceBar();
  return i;
}
function hbEditor(i) {
  const p = { ...(hotbar[i] || { n: "", f: "1d20", c: HB_COLORS[i % HB_COLORS.length], e: "🎲" }) },
    isNew = !hotbar[i];
  let el = $("#hbEdit");
  if (!el) {
    el = document.createElement("div");
    el.id = "hbEdit";
    el.className = "hbedit";
    document.body.appendChild(el);
  }
  const draw = () => {
    el.innerHTML = `<div class="hbe-top"><span class="hbs full big" style="--hc:${esc(p.c)}"><span class="hbe">${esc(p.e || "🎲")}</span><span class="hbn">${esc(p.n || "…")}</span></span>
        <div class="hbe-f"><input id="hbN" maxlength="24" autocomplete="off" placeholder="Nome (ex.: Ataque furioso)" value="${esc(p.n)}"><input id="hbF" class="hbf" maxlength="40" autocomplete="off" spellcheck="false" placeholder="Fórmula (ex.: 1d20+5)" value="${esc(p.f)}"><input id="hbF2" class="hbf" maxlength="40" autocomplete="off" spellcheck="false" placeholder="Dano depois (opcional, ex.: 1d8+3)" value="${esc(p.f2 || "")}" title="Se preencher, rola o dano logo depois do acerto (dobra os dados no 20 natural)"><div class="dm-err" id="hbErr"></div></div></div>
      <button class="btn hbl-open" id="hbLibBtn">📚 Escolher um pronto: armas, magias, testes, ataques da minha ficha…</button>
      <div class="lbl">Emoji</div><div class="hbe-emo">${HB_EMOJI.map(x => `<button data-he="${x}" aria-pressed="${p.e === x}">${x}</button>`).join("")}<input id="hbEc" maxlength="4" placeholder="outro" value="${HB_EMOJI.includes(p.e) ? "" : esc(p.e || "")}" title="Cole qualquer emoji"></div>
      <div class="lbl">Cor</div><div class="hbe-col">${HB_COLORS.map(c => `<button data-hc="${c}" style="background:${c}" aria-pressed="${p.c === c}" aria-label="Cor ${c}"></button>`).join("")}<input type="color" id="hbCc" value="${esc(p.c)}" title="Outra cor"></div>
      <div class="acts foot">${isNew ? "" : `<button class="btn small danger" id="hbDel">Remover</button>`}<button class="btn small" id="hbTry">🎲 Testar</button><span class="spacer"></span><button class="btn small" id="hbX">Cancelar</button><button class="btn small primary" id="hbOk">Salvar</button></div>`;
    const q = s => el.querySelector(s);
    q("#hbN").oninput = e => {
      p.n = e.target.value;
      el.querySelector(".hbe-top .hbn").textContent = p.n || "…";
    };
    q("#hbF").oninput = e => {
      p.f = e.target.value;
      q("#hbErr").textContent = "";
    };
    q("#hbF2").oninput = e => {
      p.f2 = e.target.value;
      q("#hbErr").textContent = "";
    };
    q("#hbLibBtn").onclick = () => hbLib(el, p, () => { el.onclick = el.onchange = el.onkeydown = null; draw(); });
    el.querySelectorAll("input").forEach(
      x =>
        (x.onkeydown = e => {
          e.stopPropagation();
          if (e.key === "Enter") q("#hbOk").click();
          if (e.key === "Escape") el.remove();
        }),
    );
    q(".hbe-emo").onclick = e => {
      const b = e.target.closest("[data-he]");
      if (b) {
        p.e = b.dataset.he;
        draw();
      }
    };
    q("#hbEc").oninput = e => {
      if (e.target.value.trim()) {
        p.e = e.target.value.trim();
        el.querySelector(".hbe-top .hbe").textContent = p.e;
      }
    };
    q(".hbe-col").onclick = e => {
      const b = e.target.closest("[data-hc]");
      if (b) {
        p.c = b.dataset.hc;
        draw();
      }
    };
    q("#hbCc").oninput = e => {
      p.c = e.target.value;
      el.querySelector(".hbe-top .hbs").style.setProperty("--hc", p.c);
    };
    const ok = () => {
      try {
        parseFormula(p.f);
        if (p.f2 && p.f2.trim()) parseFormula(p.f2);
        return true;
      } catch (err) {
        q("#hbErr").textContent = "Fórmula: " + err.message;
        return false;
      }
    };
    q("#hbTry").onclick = () => {
      if (ok()) hbRoll({ ...p, n: p.n || "Atalho" });
    };
    q("#hbX").onclick = () => el.remove();
    q("#hbOk").onclick = () => {
      if (!ok()) return;
      hotbar[i] = { n: (p.n || "Rolagem").slice(0, 24), f: p.f.replace(/\s+/g, ""), f2: (p.f2 || "").replace(/\s+/g, ""), c: p.c, e: p.e || "🎲", d: p.d || "" };
      saveHotbar();
      drawDiceBar();
      el.remove();
    };
    if (q("#hbDel"))
      q("#hbDel").onclick = () => {
        hotbar[i] = null;
        saveHotbar();
        drawDiceBar();
        el.remove();
      };
  };
  draw();
  setTimeout(() => el.querySelector("#hbN")?.focus(), 30);
}
let diceCounts = {},
  diceMod = 0,
  diceAdv = 0,
  diceSecret = false,
  diceLog = [],
  diceText = "",
  diceModal = false,
  lastResult = null;
const dieEl = (d, v, cls = "", col) =>
  `<span class="die d${d} ${cls}" style="--dc:${/^#[0-9a-f]{6}$/i.test(col || "") ? col : dColor(d)};--shape:${dShape(d)}"><span class="die-n">${v}</span></span>`;
const rnd = x => 1 + Math.floor((crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32) * x);
function countsFormula() {
  let f = [...DICE]
    .reverse()
    .filter(d => diceCounts[d] > 0)
    .map(d => `${diceCounts[d]}d${d}`)
    .join(" + ");
  if (diceMod) f += (f ? (diceMod > 0 ? " + " : " − ") : diceMod > 0 ? "" : "−") + Math.abs(diceMod);
  return f;
}
function parseFormula(str) {
  // "2d20kh1 + 1d6 - 2"
  const src = String(str || "")
    .toLowerCase()
    .replace(/[−–]/g, "-")
    .replace(/\s+/g, "");
  if (!src) throw new Error("fórmula vazia");
  const re = /([+-]?)(?:(\d*)d(\d+)(k[hl]\d+)?|(\d+))/y;
  const terms = [];
  let m,
    pos = 0;
  while (pos < src.length) {
    re.lastIndex = pos;
    m = re.exec(src);
    if (!m || !m[0]) throw new Error(`não entendi “${src.slice(pos)}”`);
    if (terms.length && !m[1]) throw new Error("falta + ou − entre os termos");
    const sign = m[1] === "-" ? -1 : 1;
    if (m[3]) {
      const n = +(m[2] || 1),
        x = +m[3];
      if (n < 1 || n > 50 || x < 2 || x > 1000) throw new Error("use até 50 dados, de d2 a d1000");
      const k = m[4] ? { h: m[4][1] === "h", k: Math.max(1, Math.min(n, +m[4].slice(2))) } : null;
      terms.push({ sign, n, x, k });
    } else terms.push({ sign, c: +m[5] });
    pos = re.lastIndex;
  }
  return terms;
}
function rollFormula(str, adv = 0) {
  const terms = parseFormula(str);
  if (adv) {
    const t = terms.find(t => t.x === 20 && t.n === 1 && !t.k);
    if (t) {
      t.n = 2;
      t.k = { h: adv > 0, k: 1 };
    }
  }
  const dice = [];
  let total = 0,
    mod = 0;
  for (const t of terms) {
    if (t.c != null) {
      total += t.sign * t.c;
      mod += t.sign * t.c;
      continue;
    }
    const vals = Array.from({ length: t.n }, () => rnd(t.x));
    let keep = vals.map((_, i) => i);
    if (t.k)
      keep = vals
        .map((v, i) => [v, i])
        .sort((a, b) => (t.k.h ? b[0] - a[0] : a[0] - b[0]))
        .slice(0, t.k.k)
        .map(x => x[1]);
    vals.forEach((v, i) => {
      const kept = keep.includes(i);
      dice.push({ d: t.x, v, x: kept ? 0 : 1, neg: t.sign < 0 ? 1 : 0 });
      if (kept) total += t.sign * v;
    });
  }
  const f = terms
    .map(
      (t, i) =>
        (i ? (t.sign < 0 ? " − " : " + ") : t.sign < 0 ? "−" : "") +
        (t.c != null ? t.c : `${t.n}d${t.x}${t.k ? (t.k.h ? "kh" : "kl") + t.k.k : ""}`),
    )
    .join("");
  return { f, dice, mod, total };
}
const DS = {
  ctx: null,
  out: null,
  init() {
    if (!this.ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return false;
      this.ctx = new C();
      this.out = this.ctx.createGain();
      this.out.gain.value = 0.9;
      this.out.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return true;
  },
  noise(len) {
    const c = this.ctx,
      b = c.createBuffer(1, Math.ceil(c.sampleRate * len), c.sampleRate),
      d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  },
  click(t, f, v, len, q = 6) {
    const c = this.ctx,
      s = c.createBufferSource(),
      bp = c.createBiquadFilter(),
      g = c.createGain();
    s.buffer = this.noise(len);
    bp.type = "bandpass";
    bp.frequency.value = f;
    bp.Q.value = q;
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    s.connect(bp).connect(g).connect(this.out);
    s.start(t);
  },
  tone(t, f, len, v, type = "triangle", f2) {
    const c = this.ctx,
      o = c.createOscillator(),
      g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + len);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    o.connect(g).connect(this.out);
    o.start(t);
    o.stop(t + len + 0.05);
  },
  rattle(n) {
    if (!this.init()) return;
    const t0 = this.ctx.currentTime;
    for (let i = 0; i < 14 + Math.min(n, 8) * 7; i++) {
      const x = Math.pow(Math.random(), 1.5) * 0.9;
      this.click(t0 + x, 1800 + Math.random() * 3200, 0.22 * (1 - x) + 0.04, 0.02);
    }
  },
  drumroll(dur) {
    // rufar de tambor que cresce: suspense
    if (!this.init()) return;
    const t0 = this.ctx.currentTime;
    let t = 0,
      i = 0;
    while (t < dur) {
      const k = t / dur;
      this.click(t0 + t, 180 + Math.random() * 90, 0.08 + k * 0.32, 0.06, 1.2);
      this.click(t0 + t, 2400, 0.03 + k * 0.08, 0.03, 2);
      t += 0.055 - k * 0.02 + (i++ % 2 ? 0.006 : 0);
    }
    this.tone(t0, 55, dur, 0.12 + 0.0, "sine", 90);
  },
  step(v = 0.4, alt) {
    // passo: baque surdo + raspar leve
    if (!stepsOn || !this.init()) return;
    const t = this.ctx.currentTime,
      f = alt ? 1 : 1.15;
    this.click(t, 150 * f, v, 0.09, 1.2);
    this.tone(t, 95 * f, 0.08, v * 0.45, "sine", 55);
    this.click(t + 0.015, 1100 * f + Math.random() * 400, v * 0.18, 0.06, 1.4);
  },
  heart() {
    if (!this.init()) return;
    const t = this.ctx.currentTime;
    this.tone(t, 70, 0.18, 0.5, "sine", 40);
    this.tone(t + 0.22, 64, 0.2, 0.38, "sine", 38);
  },
  land() {
    if (!this.init()) return;
    const t = this.ctx.currentTime;
    this.click(t, 1300 + Math.random() * 500, 0.6, 0.05);
    this.tone(t, 170, 0.09, 0.3, "sine", 90);
  },
  reveal() {
    if (!this.init()) return;
    const t = this.ctx.currentTime;
    this.click(t, 600, 0.5, 0.25, 0.8);
    this.tone(t, 110, 0.35, 0.35, "sine", 55);
  },
  crit() {
    // fanfarra + coro brilhante
    if (!this.init()) return;
    const t = this.ctx.currentTime + 0.03;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      this.tone(t + i * 0.09, f, 0.55, 0.2, "square");
      this.tone(t + i * 0.09, f * 2, 0.6, 0.06, "sine");
    });
    [1046.5, 1318.5, 1568, 2093].forEach(f => this.tone(t + 0.42, f, 1.8, 0.12, "triangle"));
    this.tone(t + 0.42, 261.6, 1.6, 0.22, "sawtooth");
    this.tone(t + 0.42, 130.8, 1.6, 0.22, "sine");
    for (let i = 0; i < 26; i++)
      this.tone(t + 0.45 + i * 0.045, 1800 + Math.random() * 3600, 0.3, 0.045, "sine");
    this.click(t + 0.42, 5000, 0.25, 0.9, 0.7);
  },
  fumble() {
    // "uó uó uó uóóó" + baque
    if (!this.init()) return;
    const c = this.ctx,
      t = c.currentTime + 0.03;
    let at = t;
    for (const [f, len] of [
      [311, 0.32],
      [293.7, 0.32],
      [277.2, 0.32],
      [261.6, 1.2],
    ]) {
      const o = c.createOscillator(),
        lp = c.createBiquadFilter(),
        g = c.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(f, at);
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(500, at);
      lp.frequency.linearRampToValueAtTime(1400, at + 0.08);
      lp.frequency.linearRampToValueAtTime(600, at + len);
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(0.26, at + 0.04);
      g.gain.setValueAtTime(0.26, at + len - 0.08);
      g.gain.linearRampToValueAtTime(0, at + len);
      if (len > 0.5) {
        const lfo = c.createOscillator(),
          lg = c.createGain();
        lfo.frequency.value = 6;
        lg.gain.value = 8;
        lfo.connect(lg).connect(o.frequency);
        lfo.start(at + 0.2);
        lfo.stop(at + len);
      }
      o.connect(lp).connect(g).connect(this.out);
      o.start(at);
      o.stop(at + len + 0.02);
      at += len + 0.04;
    }
    this.tone(t, 60, 0.6, 0.5, "sine", 32);
    this.click(t, 300, 0.5, 0.4, 0.7);
  },
};
// ---------- som das rolagens prontas (YouTube ou link de áudio) ----------
function ytIdOf(u) {
  try {
    const x = new URL(String(u).trim());
    if (x.hostname.includes("youtu.be")) return x.pathname.slice(1).split("/")[0];
    if (x.hostname.includes("youtube.com")) {
      if (x.searchParams.get("v")) return x.searchParams.get("v");
      const m = x.pathname.match(/\/(shorts|embed|live)\/([\w-]{6,})/);
      if (m) return m[2];
    }
  } catch {}
  return null;
}
function tsec(v) {
  v = String(v ?? "").trim();
  if (!v) return 0;
  if (v.includes(":")) return v.split(":").reduce((a, b) => a * 60 + (+b || 0), 0);
  return +v.replace(",", ".") || 0;
}
const fmtT = s => {
  s = Math.max(0, Math.round(+s || 0));
  return s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : "";
};
function cleanSnd(x) {
  if (!x || typeof x !== "object") return null;
  const u = String(x.u || "")
    .trim()
    .slice(0, 300);
  if (!/^https:\/\//i.test(u)) return null;
  return { u, s: Math.max(0, +x.s || 0), e: Math.max(0, +x.e || 0) };
}
let ytReady = null,
  ytPlayer = null,
  sndAudio = null,
  sndStopT = null;
function loadYT() {
  if (ytReady) return ytReady;
  ytReady = new Promise(ok => {
    const dock = document.createElement("div");
    dock.style.cssText = "position:fixed;left:-9999px;top:0;width:320px;height:180px";
    dock.innerHTML = '<div id="ytSnd"></div>';
    document.body.appendChild(dock);
    const make = () => {
      ytPlayer = new YT.Player("ytSnd", {
        width: 320,
        height: 180,
        playerVars: { playsinline: 1, controls: 0 },
        events: { onReady: () => ok(ytPlayer) },
      });
    };
    ytApi().then(make);
  });
  return ytReady;
}
async function playSnd(snd) {
  snd = cleanSnd(snd);
  if (!snd) return;
  clearTimeout(sndStopT);
  try {
    sndAudio?.pause();
  } catch {}
  try {
    ytPlayer?.stopVideo?.();
  } catch {}
  const dur = snd.e > snd.s ? snd.e - snd.s : 6;
  const id = ytIdOf(snd.u);
  if (id) {
    const pl = await loadYT();
    pl.setVolume(85);
    pl.loadVideoById({ videoId: id, startSeconds: snd.s, endSeconds: snd.s + dur });
    sndStopT = setTimeout(
      () => {
        try {
          pl.stopVideo();
        } catch {}
      },
      (dur + 1.5) * 1000,
    );
  } else {
    sndAudio = new Audio(snd.u);
    sndAudio.volume = 0.85;
    sndAudio.currentTime = snd.s;
    sndAudio.play().catch(() => {});
    sndStopT = setTimeout(() => {
      try {
        sndAudio.pause();
      } catch {}
    }, dur * 1000);
  }
}
const natOf = r => {
  const d20 = r.dice.filter(x => x.d === 20 && !x.x);
  return d20.some(x => x.v === 20) ? "crit" : d20.some(x => x.v === 1) ? "fumble" : "";
};
function facesHTML(r, big) {
  return (
    r.dice
      .map(x =>
        dieEl(
          x.d,
          r.fresh ? "?" : x.v,
          (big ? "big2 " : "mini ") +
            (x.x ? "drop " : "") +
            (!r.fresh && x.d === 20 && !x.x && (x.v === 20 || x.v === 1) ? (x.v === 20 ? "c20" : "c1") : ""),
          r.col,
        ),
      )
      .join("") + (r.mod ? `<span class="dmod">${r.mod > 0 ? "+" : "−"}${Math.abs(r.mod)}</span>` : "")
  );
}
function logRow(r) {
  const nat = r.fresh ? "" : natOf(r);
  return `<div class="droll ${nat} ${r.fresh ? "fresh" : ""} ${r.secret ? "secret" : ""}" data-rid="${r.id}">
    <div class="dwho">${esc(r.who)}${r.label ? ` · <i>${esc(r.label)}</i>` : ""}${r.secret ? " · secreta" : ""}<span>${esc(r.f)}</span></div>
    <div class="dfaces">${facesHTML(r)}</div>
    <div class="dtot">${r.fresh ? "…" : r.total}</div>
    ${nat === "crit" ? '<div class="dtag">⚔️ CRÍTICO!</div>' : nat === "fumble" ? '<div class="dtag">💀 FALHA CRÍTICA</div>' : ""}</div>`;
}
let logOpen = (() => {
    try {
      return localStorage.getItem("mesa.logopen") !== "0";
    } catch {
      return true;
    }
  })(),
  logUnseen = 0;
function drawDiceLog(fresh) {
  let el = $("#diceLog");
  if (!el) {
    el = document.createElement("div");
    el.id = "diceLog";
    el.className = "dlog";
    el.setAttribute("aria-live", "polite");
    document.body.appendChild(el);
  }
  if (fresh && !logOpen) logUnseen++;
  el.classList.toggle("closed", !logOpen);
  const last = diceLog[diceLog.length - 1];
  const head = `<button class="dlog-tog" id="logTog" aria-expanded="${logOpen}" title="${logOpen ? "Esconder" : "Mostrar"} o histórico de rolagens">🎲 Histórico${diceLog.length ? ` <small>${diceLog.length}</small>` : ""}${!logOpen && logUnseen ? `<b class="dnew">${logUnseen}</b>` : ""}${!logOpen && last && !last.fresh ? `<span class="dlast">${esc(last.who)}: <b>${last.total}</b></span>` : ""}<span class="chev">${logOpen ? "▾" : "▸"}</span></button>`;
  const chatB = `<button class="dlog-tog" id="chatTog" aria-pressed="${chatOpen}" title="Chat de texto (sussurros também) · atalho: Enter">💬 Chat${chatUnread ? `<b class="dnew">${chatUnread}</b>` : ""}</button>`;
  el.innerHTML =
    `<div class="dlog-head">${head}${chatB}</div>` +
    (logOpen ? `<div class="dlog-rows">${diceLog.slice(-6).map(logRow).join("")}</div>` : "");
  $("#chatTog").onclick = () => (chatOpen ? closeChat() : openChat());
  $("#logTog").onclick = () => {
    logOpen = !logOpen;
    logUnseen = 0;
    try {
      localStorage.setItem("mesa.logopen", logOpen ? "1" : "0");
    } catch {}
    drawDiceLog();
  };
  const rows = el.querySelector(".dlog-rows");
  if (rows) rows.scrollTop = rows.scrollHeight;
}
function drawDiceBar() {
  let el = $("#diceBar");
  if (!el) {
    el = document.createElement("div");
    el.id = "diceBar";
    el.className = "dicebar";
    document.body.appendChild(el);
  }
  el.innerHTML = `<button class="btn dice-main" id="dOpen" title="Abrir a mesa de dados">🎲 Rolar dados</button>
    <div class="hotbar" role="toolbar" aria-label="Barra de atalhos">${hotbar.map((p, i) => (p ? `<button class="hbs full" data-hs="${i}" style="--hc:${esc(p.c || "#3a3530")}" title="${esc(p.n)} · ${esc(p.f)}&#10;Clique: rolar · Arraste: trocar de lugar · Clique direito: editar"><span class="hbe">${esc(p.e || "🎲")}</span><span class="hbn">${esc(p.n)}</span></button>` : `<button class="hbs" data-hs="${i}" title="Espaço vazio: clique para criar um atalho" aria-label="Espaço vazio"></button>`)).join("")}</div>`;
  $("#dOpen").onclick = () => openDiceModal();
  const hb = el.querySelector(".hotbar");
  let from = null;
  hb.onclick = e => {
    const b = e.target.closest("[data-hs]");
    if (!b) return;
    const i = +b.dataset.hs,
      p = hotbar[i];
    if (p) hbRoll(p);
    else hbEditor(i);
  };
  hb.oncontextmenu = e => {
    const b = e.target.closest("[data-hs]");
    if (!b) return;
    e.preventDefault();
    hbEditor(+b.dataset.hs);
  };
  hb.onmousedown = e => {
    const b = e.target.closest(".hbs.full");
    if (b) b.draggable = true;
  };
  hb.ondragstart = e => {
    const b = e.target.closest(".hbs.full");
    if (!b) return;
    from = +b.dataset.hs;
    e.dataTransfer.setData("text/mesa-hb", String(from));
    e.dataTransfer.effectAllowed = "move";
    b.classList.add("dragging");
  };
  hb.ondragover = e => {
    const b = e.target.closest("[data-hs]");
    if (from == null || !b) return;
    e.preventDefault();
    hb.querySelectorAll(".over").forEach(x => x !== b && x.classList.remove("over"));
    b.classList.add("over");
  };
  hb.ondragleave = e => {
    const b = e.target.closest("[data-hs]");
    if (b && !b.contains(e.relatedTarget)) b.classList.remove("over");
  };
  hb.ondrop = e => {
    const b = e.target.closest("[data-hs]");
    if (from == null || !b) return;
    e.preventDefault();
    const to = +b.dataset.hs;
    [hotbar[from], hotbar[to]] = [hotbar[to], hotbar[from]];
    from = null;
    saveHotbar();
    drawDiceBar();
  };
  hb.ondragend = () => {
    from = null;
    hb.querySelectorAll(".over,.dragging").forEach(x => x.classList.remove("over", "dragging"));
  };
}
function openDiceModal(focus) {
  diceModal = true;
  let m = $("#diceModal");
  if (!m) {
    m = document.createElement("div");
    m.id = "diceModal";
    m.className = "dmodal-wrap";
    document.body.appendChild(m);
  }
  const any = DICE.some(d => diceCounts[d] > 0);
  if (!diceText && any) diceText = countsFormula();
  const r = lastResult,
    nat = r ? natOf(r) : "";
  m.innerHTML = `<div class="dmodal" role="dialog" aria-label="Mesa de dados">
    <div class="dm-head"><b>Mesa de dados</b><span class="sub">${isGM ? "mestre" : esc(myNick || "jogador")} · todos veem ${isGM ? "(a menos que seja secreta)" : "a sua rolagem"}</span><button class="btn small" id="dmClose">Fechar</button></div>
    <div class="dm-body">
      <div class="dm-left">
        <div class="dm-menu">${DICE.map(d => {
          const n = diceCounts[d] || 0;
          return `<div class="dm-die ${n ? "on" : ""}" style="--dc:${dColor(d)}">
          <button class="dm-pick" data-dp="${d}" aria-label="Adicionar d${d}">${dieEl(d, d === 100 ? "%" : d, "card")}${n ? `<span class="dbadge">${n}×</span>` : ""}</button>
          <span class="dm-lbl">d${d}</span>
          <div class="dm-ctl"><button class="dstep" data-dminus="${d}" ${n ? "" : "disabled"} aria-label="Menos um d${d}">−</button><span>${n}</span><button class="dstep" data-dp="${d}" aria-label="Mais um d${d}">+</button></div></div>`;
        }).join("")}</div>
        <div class="dm-row"><span class="dm-k">Bônus</span><button class="dstep" data-dm="-1">−</button><b class="dm-mod">${diceMod > 0 ? "+" + diceMod : diceMod}</b><button class="dstep" data-dm="1">+</button>
          <span class="dm-k" style="margin-left:14px">d20</span><div class="seg" id="dmAdv"><button data-adv="0" aria-pressed="${diceAdv === 0}">Normal</button><button data-adv="1" aria-pressed="${diceAdv === 1}">Vantagem</button><button data-adv="-1" aria-pressed="${diceAdv === -1}">Desvantagem</button></div></div>
        <label class="dm-k" for="dmText">Fórmula (pode digitar)</label>
        <div class="dm-row"><input id="dmText" value="${esc(diceText)}" placeholder="ex.: 1d20+5, 2d6+1d4+2, 4d6kh3"><button class="btn small" id="dmClear">Limpar</button></div>
        <div class="dm-err" id="dmErr"></div>
        <div class="dm-row">${isGM ? `<label class="chk"><input type="checkbox" id="dmSecret" ${diceSecret ? "checked" : ""}> Rolagem secreta (só você vê)</label>` : ""}<span class="spacer"></span>
          <button class="btn" id="dmSave">☆ Salvar como atalho</button><button class="btn primary dm-roll" id="dmRoll">🎲 Rolar</button></div>
        <div class="dm-result ${nat}" id="dmResult">${r ? `<div class="dm-faces">${facesHTML(r, true)}</div><div class="dm-total">${r.fresh ? "…" : r.total}</div><div class="sub">${esc(r.label ? r.label + " · " : "")}${esc(r.f)}</div>${!r.fresh && nat === "crit" ? '<div class="crit-tag">⚔️ CRÍTICO! 20 natural</div>' : ""}${!r.fresh && nat === "fumble" ? '<div class="fumble-tag">💀 FALHA CRÍTICA… 1 natural</div>' : ""}` : `<div class="sub">Escolha os dados ou use uma rolagem pronta.</div>`}</div>
      </div>
      <div class="dm-right">
        <div class="dm-k">Barra de atalhos <span class="sub">(só neste computador)</span></div>
        <div class="dm-hbmini">${hotbar.map((p, i) => (p ? `<span class="hbs full" style="--hc:${esc(p.c)}" title="${esc(p.n)} · ${esc(p.f)}"><span class="hbe">${esc(p.e || "🎲")}</span></span>` : `<span class="hbs"></span>`)).join("")}</div>
        <p class="hint">Seus atalhos ficam na barra embaixo da tela, como no Baldur's Gate: <b>clique</b> num espaço vazio para criar, <b>clique direito</b> para editar (nome, fórmula, cor e emoji) e <b>arraste</b> para trocar de lugar. Aqui, “☆ Salvar como atalho” coloca a fórmula atual na barra.</p>
        <p class="hint">Use <b>kh</b>/<b>kl</b> para ficar com os maiores/menores: <b>2d20kh1</b> = vantagem, <b>4d6kh3</b> = atributo.</p>
        <div class="dm-k" style="margin-top:12px">Últimas rolagens</div>
        <div class="dm-hist">${
          diceLog
            .slice(-8)
            .reverse()
            .map(
              x =>
                `<div><b>${esc(x.who)}</b> ${esc(x.label || x.f)} → <b class="${natOf(x)}">${x.fresh ? "…" : x.total}</b></div>`,
            )
            .join("") || `<p class="hint">Nada ainda.</p>`
        }</div>
      </div>
    </div></div>`;
  const q = sel => m.querySelector(sel);
  const redraw = () => openDiceModal();
  q("#dmClose").onclick = closeDiceModal;
  m.onclick = e => {
    if (e.target === m) closeDiceModal();
  };
  q(".dm-menu").onclick = e => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.dp) {
      const d = +b.dataset.dp;
      diceCounts[d] = Math.min(50, (diceCounts[d] || 0) + 1);
    } else if (b.dataset.dminus) {
      const d = +b.dataset.dminus;
      diceCounts[d] = Math.max(0, (diceCounts[d] || 0) - 1);
    }
    diceText = countsFormula();
    redraw();
  };
  q(".dm-menu").oncontextmenu = e => {
    const b = e.target.closest("[data-dp]");
    if (!b) return;
    e.preventDefault();
    const d = +b.dataset.dp;
    diceCounts[d] = Math.max(0, (diceCounts[d] || 0) - 1);
    diceText = countsFormula();
    redraw();
  };
  m.querySelectorAll("[data-dm]").forEach(
    b =>
      (b.onclick = () => {
        diceMod = Math.max(-50, Math.min(50, diceMod + +b.dataset.dm));
        diceText = countsFormula();
        redraw();
      }),
  );
  q("#dmAdv").onclick = e => {
    const b = e.target.closest("[data-adv]");
    if (b) {
      diceAdv = +b.dataset.adv;
      redraw();
    }
  };
  const tx = q("#dmText");
  tx.oninput = () => {
    diceText = tx.value;
    q("#dmErr").textContent = "";
  };
  tx.onkeydown = e => {
    e.stopPropagation();
    if (e.key === "Enter") q("#dmRoll").click();
  };
  q("#dmClear").onclick = () => {
    diceCounts = {};
    diceMod = 0;
    diceText = "";
    redraw();
  };
  const sc = q("#dmSecret");
  if (sc) sc.onchange = e => (diceSecret = e.target.checked);
  q("#dmRoll").onclick = () => {
    try {
      parseFormula(diceText);
    } catch (err) {
      q("#dmErr").textContent = "Fórmula: " + err.message;
      return;
    }
    doRoll(diceText, diceAdv, "", isGM && diceSecret);
  };
  q("#dmSave").onclick = () => {
    try {
      parseFormula(diceText);
    } catch (err) {
      q("#dmErr").textContent = "Fórmula: " + err.message;
      return;
    }
    const f =
      diceAdv && /(^|[^\d])1?d20(?!\d)/.test(diceText)
        ? diceText.replace(/(^|[^\d])1?d20(?!\d|k)/, `$12d20${diceAdv > 0 ? "kh1" : "kl1"}`)
        : diceText;
    const i = hbAdd({ n: "Nova rolagem", f: f.replace(/\s+/g, ""), c: HB_COLORS[0], e: "🎲" });
    if (i >= 0) {
      closeDiceModal();
      hbEditor(i);
    }
  };
}
addEventListener(
  "keydown",
  e => {
    if (e.key === "Escape" && diceModal) {
      e.preventDefault();
      closeDiceModal();
    }
  },
  true,
);
function closeDiceModal() {
  diceModal = false;
  $("#diceModal")?.remove();
}
const MAP_VER = 17;
function newVersion() {
  if ($("#verBanner")) return;
  const b = document.createElement("div");
  b.id = "verBanner";
  b.className = "toast";
  b.style.bottom = "auto";
  b.style.top = "64px";
  b.innerHTML = "Tem uma versão nova do mapa. Aperte <b>Ctrl + F5</b> para atualizar.";
  document.body.appendChild(b);
}
const stageQ = [];
let stageBusy = false;
function addRoll(r, mine) {
  r.fresh = true;
  r.mine = !!mine;
  if (mine) lastResult = r;
  if (diceModal && mine) openDiceModal("keep");
  if (r.snd) playSnd(r.snd);
  stageQ.push(r);
  if (!stageBusy) nextStage();
}
function finishRoll(r) {
  r.fresh = false;
  diceLog.push(r);
  if (diceLog.length > 50) diceLog.shift();
  drawDiceLog(true);
  chatRoll(r);
  if (diceModal && r.mine) openDiceModal("keep");
}
function nextStage() {
  const r = stageQ.shift();
  if (!r) {
    stageBusy = false;
    return;
  }
  stageBusy = true;
  const fast = stageQ.length > 0; // fila grande: vai mais rápido
  const st = document.createElement("div");
  st.className = "dstage";
  st.setAttribute("role", "dialog");
  st.setAttribute("aria-label", "Rolagem de dados");
  const hasD20 = r.dice.some(x => x.d === 20 && !x.x);
  st.innerHTML = `<div class="ds-card">
      <div class="ds-who"><b>${esc(r.who)}</b> ${r.label ? `rola <i>${esc(r.label)}</i>` : "rola os dados"}${r.secret ? " · secreta" : ""}</div>
      <div class="ds-f">${esc(r.f)}</div>
      <div class="ds-table">${r.dice.map((x, i) => `<span class="ds-slot" style="--i:${i};--dx:${Math.round((Math.random() * 2 - 1) * 240)}px;--rot:${Math.round((Math.random() * 2 - 1) * 900)}deg">${dieEl(x.d, "?", "huge rolling" + (x.x ? " dropwait" : ""), r.col)}<span class="ds-dl">d${x.d}</span></span>`).join("")}${r.mod ? `<span class="ds-mod">${r.mod > 0 ? "+" : "−"}${Math.abs(r.mod)}</span>` : ""}</div>
      <div class="ds-total" aria-live="polite"></div><div class="ds-tag"></div>
      <div class="ds-hint"></div></div>`;
  document.body.appendChild(st);
  const els = [...st.querySelectorAll(".ds-slot .die")],
    order = r.dice.map((x, i) => i);
  // o d20 que vale fica por último, para o suspense
  const d20i = r.dice.map((x, i) => i).filter(i => r.dice[i].d === 20 && !r.dice[i].x),
    pickV = v => d20i.find(i => r.dice[i].v === v);
  const key = pickV(20) ?? pickV(1) ?? (d20i.length ? d20i[0] : -1); // o dado que decidiu o crítico/falha é o que ganha a animação
  if (key >= 0) {
    order.splice(order.indexOf(key), 1);
    order.push(key);
  }
  const roll = fast ? 700 : 1500,
    gap = fast ? 90 : 220,
    susp = hasD20 && !fast ? 900 : 0;
  const landAt = {};
  order.forEach((i, k) => {
    landAt[i] = roll + k * gap + (i === key ? susp : 0);
  });
  let endAt = Math.max(...Object.values(landAt)) + 60;
  DS.rattle(r.dice.length);
  if (!fast) DS.drumroll((endAt - 200) / 1000);
  if (susp)
    setTimeout(
      () => {
        if (st.isConnected) {
          els[key]?.classList.add("suspense");
          DS.heart();
        }
      },
      landAt[key] - susp + 100,
    );
  const t0 = performance.now(),
    lastFlip = {};
  const tick = now => {
    if (!st.isConnected) return;
    const el = now - t0;
    els.forEach((e, i) => {
      if (e.classList.contains("landed")) return;
      const left = landAt[i] - el,
        n = e.querySelector(".die-n");
      if (left <= 0) {
        n.textContent = r.dice[i].v;
        e.classList.remove("rolling", "suspense");
        e.classList.add("landed");
        if (r.dice[i].x) e.classList.add("drop");
        if (i === key && (r.dice[i].v === 20 || r.dice[i].v === 1))
          e.classList.add(r.dice[i].v === 20 ? "c20" : "c1");
        DS.land();
        return;
      }
      const every = left < 500 ? 60 + (500 - left) * 0.5 : 50; // desacelera antes de parar
      if (!lastFlip[i] || el - lastFlip[i] > every) {
        lastFlip[i] = el;
        n.textContent = rnd(r.dice[i].d);
      }
    });
    if (el < endAt) return requestAnimationFrame(tick);
    reveal();
  };
  requestAnimationFrame(tick);
  let done = false;
  function reveal() {
    const nat = natOf(r);
    const tot = st.querySelector(".ds-total");
    let k = 0;
    const steps = 12,
      from = Math.max(0, r.total - 12);
    const count = () => {
      if (!st.isConnected) return;
      k++;
      tot.textContent = k >= steps ? r.total : Math.round(from + ((r.total - from) * k) / steps);
      if (k < steps) setTimeout(count, 22);
    };
    tot.classList.add("show");
    count();
    DS.reveal();
    st.querySelector(".ds-hint").textContent = "clique para fechar";
    if (r.sfxDone) return (finishRoll(r), setTimeout(close, 1500));
    r.sfxDone = true;
    if (nat === "crit") {
      st.classList.add("crit");
      st.querySelector(".ds-tag").innerHTML = '<span class="crit-tag">⚔️ CRÍTICO! 20 natural ⚔️</span>';
      critBurst(st, els[key]);
      DS.crit();
    } else if (nat === "fumble") {
      st.classList.add("fumble");
      st.querySelector(".ds-tag").innerHTML = '<span class="fumble-tag">💀 FALHA CRÍTICA… 1 natural</span>';
      fumbleFx(st, els[key]);
      DS.fumble();
    }
    finishRoll(r);
    setTimeout(close, fast ? 1100 : nat ? 3600 : 2300);
  }
  function close() {
    if (done) return;
    done = true;
    st.classList.add("out");
    setTimeout(() => {
      st.remove();
      nextStage();
    }, 300);
  }
  st.onclick = () => {
    if (st.querySelector(".ds-total.show")) close();
  }; // antes do resultado, clicar não faz nada
  function t0Skip() {
    /* pular a animação: revela já */ Object.keys(landAt).forEach(i => (landAt[i] = 0));
    endAt = 0;
  }
}
function critBurst(st, el) {
  if (!el) return;
  const r = el.getBoundingClientRect(),
    cx = r.left + r.width / 2,
    cy = r.top + r.height / 2;
  const fx = document.createElement("div");
  fx.className = "crit-fx";
  fx.style.left = cx + "px";
  fx.style.top = cy + "px";
  let h = '<span class="crit-rays"></span><span class="crit-ring"></span><span class="crit-ring r2"></span>';
  for (let i = 0; i < 44; i++) {
    const a = Math.random() * Math.PI * 2,
      d = 110 + Math.random() * 260;
    h += `<i style="--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d}px;--s:${0.5 + Math.random() * 1.1};--d:${Math.random() * 0.3}s"></i>`;
  }
  fx.innerHTML = h;
  st.appendChild(fx);
}
function fumbleFx(st, el) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  const sk = document.createElement("div");
  sk.className = "fumble-skull";
  sk.textContent = "💀";
  sk.style.left = r.left + r.width / 2 + "px";
  sk.style.top = r.top + "px";
  st.appendChild(sk);
}
function doRoll(formula, adv = 0, label = "", secret = false, snd = null) {
  let res;
  try {
    res = rollFormula(formula, adv);
  } catch (err) {
    toast("Não rolei: " + err.message);
    return;
  }
  if (adv) res.f += adv > 0 ? " (vantagem)" : " (desvantagem)";
  const r = {
    id: uid(),
    v: MAP_VER,
    who: isGM ? "Mestre" : myNick || "Jogador",
    label: label || "",
    ...res,
    secret: !!secret,
    snd: cleanSnd(snd),
  };
  if (!r.secret) send("roll", r);
  addRoll(r, true);
  return r;
}

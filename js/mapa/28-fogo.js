"use strict";
// ---------- fogo vivo: chamas animadas nas fogueiras e tochas, luz que tremula e sombra dos tokens ----------
// Onde fica a chama em cada objeto (posição dentro do objeto, 0–1) e o tamanho (em relação ao menor lado)
const FIRE_SPOTS = {
  "fogueira": [[0.5, 0.52, 0.42]],
  "fogueira-espeto": [[0.5, 0.52, 0.34]],
  "braseiro": [[0.5, 0.5, 0.36]],
  "panela-fogo": [[0.5, 0.52, 0.3]],
  "lareira": [[0.5, 0.58, 0.55]],
  "forja": [[0.42, 0.42, 0.32], [0.55, 0.55, 0.26]],
  "tocha": [[0.5, 0.3, 0.26]],
  "tocha-parede": [[0.5, 0.6, 0.26]],
  "velas": [[0.29, 0.26, 0.09], [0.62, 0.28, 0.09], [0.45, 0.49, 0.09], [0.78, 0.56, 0.09], [0.31, 0.64, 0.09]],
  "candelabro": [[0.38, 0.28, 0.09], [0.72, 0.5, 0.09], [0.35, 0.73, 0.09]],
};
const FIRE_GLOW_ONLY = /(lanterna|poste)/;
const fireKey = t => { const m = /([\w-]+)\.svg/.exec(t.img || ""); return m ? m[1] : ""; };
const hash01 = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 1000) / 1000; };
function isFire(t) { // luz de fogo: objetos com chama, ou tokens com luz quente (tocha na mão)
  if (!t?.li) return false;
  if (isProp(t)) { const k = fireKey(t); return !!FIRE_SPOTS[k] || FIRE_GLOW_ONLY.test(k); }
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(t.li.c || "#ffbe5a");
  return !!m && parseInt(m[1], 16) > 190 && parseInt(m[3], 16) < 170;
}
function flick(t, now = performance.now()) { // 0,93 a 1,07: o balanço da chama (várias ondas misturadas)
  const ph = hash01(t.id) * 100, s = now / 1000;
  const k = FIRE_GLOW_ONLY.test(fireKey(t)) ? 0.35 : 1;
  return 1 + k * (0.035 * Math.sin(s * 7.3 + ph) + 0.025 * Math.sin(s * 13.1 + ph * 1.7) + 0.015 * Math.sin(s * 23.7 + ph * 2.3));
}
let fireOn = (() => { try { return localStorage.getItem("mesa.fire") !== "0"; } catch { return true; } })(), fireT = 0;
function fireVisible() { // tem fogo na tela? (então anima)
  if (!fireOn) return false;
  const { x0, y0, x1, y1 } = visibleWorld(), m = G().size * 3;
  return tokens.some(t => isFire(t) && (isGM || !t.h) && t.x > x0 - m && t.x < x1 + m && t.y > y0 - m && t.y < y1 + m);
}
function paintFlames(ts) { // chamas por cima das fogueiras e tochas
  if (!fireOn) return;
  const now = performance.now(), s = now / 1000;
  for (const t of ts) {
    if (!isProp(t) || !t.li || (!isGM && t.h)) continue;
    const spots = FIRE_SPOTS[fireKey(t)]; if (!spots) continue;
    const [W, H] = propSize(t), mn = Math.min(W, H), ph = hash01(t.id) * 50;
    ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(((t.a || 0) * Math.PI) / 180);
    ctx.globalCompositeOperation = "lighter";
    spots.forEach(([fx, fy, fs], k) => {
      const cx = (fx - 0.5) * W, cy = (fy - 0.5) * H, r = fs * mn, p = ph + k * 3.1;
      // brilho da base
      const g0 = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 1.25);
      g0.addColorStop(0, "rgba(255,170,60,.55)"); g0.addColorStop(1, "rgba(255,90,20,0)");
      ctx.fillStyle = g0; ctx.beginPath(); ctx.arc(cx, cy, r * 1.25, 0, Math.PI * 2); ctx.fill();
      // línguas de fogo (sobem e balançam; "para cima" é sempre o norte da tela)
      ctx.save();
      const n = r > mn * 0.2 ? 5 : 2;
      for (let i = 0; i < n; i++) {
        const q = (i / n) * Math.PI * 2 + p, sway = Math.sin(s * 6 + q * 2) * r * 0.18,
          h = r * (0.9 + 0.35 * Math.sin(s * (8 + i) + q)), w = r * (0.34 + 0.08 * Math.sin(s * 5 + q)),
          ox = cx + Math.cos(q) * r * 0.28 * (n > 2 ? 1 : 0), oy = cy + Math.sin(q) * r * 0.12;
        const g = ctx.createLinearGradient(ox, oy + w, ox, oy - h);
        g.addColorStop(0, "rgba(255,90,20,.0)"); g.addColorStop(0.15, "rgba(255,110,25,.85)"); g.addColorStop(0.55, "rgba(255,190,60,.8)"); g.addColorStop(1, "rgba(255,240,170,0)");
        ctx.fillStyle = g; ctx.beginPath();
        ctx.moveTo(ox - w, oy); ctx.quadraticCurveTo(ox - w * 0.9, oy - h * 0.55, ox + sway, oy - h);
        ctx.quadraticCurveTo(ox + w * 0.9, oy - h * 0.55, ox + w, oy); ctx.quadraticCurveTo(ox, oy + w * 0.9, ox - w, oy); ctx.fill();
      }
      // miolo claro
      const g1 = ctx.createRadialGradient(cx, cy - r * 0.15, 0, cx, cy - r * 0.15, r * 0.45);
      g1.addColorStop(0, `rgba(255,250,210,${0.75 + 0.2 * Math.sin(s * 11 + p)})`); g1.addColorStop(1, "rgba(255,200,90,0)");
      ctx.fillStyle = g1; ctx.beginPath(); ctx.arc(cx, cy - r * 0.15, r * 0.45, 0, Math.PI * 2); ctx.fill();
      // faíscas subindo (só nas fogueiras grandes)
      if (fs >= 0.3) for (let i = 0; i < 4; i++) {
        const life = ((s * 0.7 + i * 0.25 + hash01(t.id + i)) % 1), x = cx + Math.sin(s * 3 + i * 9 + p) * r * 0.5 * life, y = cy - r * (0.4 + 1.6 * life);
        ctx.fillStyle = `rgba(255,${180 - life * 100 | 0},60,${(1 - life) * 0.9})`; ctx.beginPath(); ctx.arc(x, y, Math.max(0.6, r * 0.05 * (1 - life)), 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    });
    ctx.restore();
  }
}
function paintTokShadows(ts) { // sombrinha dos tokens, do lado oposto de cada fogo por perto
  if (!fireOn) return;
  const amb = scene.light || "day", mul = amb === "dark" ? 1 : amb === "dim" ? 0.75 : 0.35;
  const lights = ts.filter(t => isFire(t) && (isGM || !t.h));
  if (!lights.length) return;
  ctx.save();
  for (const t of ts) {
    if (isProp(t) || (!isGM && t.h)) continue;
    const r = tokR(t), near = [];
    for (const L of lights) {
      if (L.id === t.id) continue;
      const l = LI(L), R = unitPx(Math.max(l.rb, l.rd)) * flick(L), dx = t.x - L.x, dy = t.y - L.y, d = Math.hypot(dx, dy);
      if (d > R || d < r * 0.4) continue;
      const poly = losPoly(L.x, L.y, unitPx(Math.max(l.rb, l.rd)) * 1.08, lightSkip(L));
      if (poly && !pointInPoly(t.x, t.y, poly)) continue;
      near.push({ dx: dx / d, dy: dy / d, d, R, L });
    }
    near.sort((a, b) => a.d / a.R - b.d / b.R);
    for (const n of near.slice(0, 2)) {
      const k = 1 - n.d / n.R, len = r * (1.1 + 2.2 * (n.d / n.R)), a = 0.5 * mul * Math.min(1, k * 1.6) * flick(n.L);
      const cx = t.x + n.dx * (r * 0.55 + len / 2), cy = t.y + n.dy * (r * 0.55 + len / 2);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.atan2(n.dy, n.dx)); ctx.scale((len / 2 + r * 0.35) / (r * 0.8), 1);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.8);
      g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(0.6, `rgba(0,0,0,${a * 0.6})`); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

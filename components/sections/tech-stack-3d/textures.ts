import * as THREE from "three";
import type { TechItem } from "@/components/sections/tech-stack-explorer";

/**
 * Everything shown *on* a surface in the 3D scene (screens, layers, tool tiles) is
 * painted once into a canvas and uploaded as a texture — crisp, lit correctly and cheap.
 */

const FONT = `"Poppins", "Segoe UI", system-ui, -apple-system, sans-serif`;
const MONO = `"JetBrains Mono", "Cascadia Code", Consolas, monospace`;
const TEAL = "#2dd4bf";
const SKY = "#38bdf8";

type Ctx = CanvasRenderingContext2D;

/** Canvas in logical units; `scale` sets the real pixel density (drawing code is unchanged). */
function canvas(w: number, h: number, scale = 1): [HTMLCanvasElement, Ctx] {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w * scale));
  c.height = Math.max(1, Math.round(h * scale));
  const ctx = c.getContext("2d")!;
  ctx.scale(c.width / w, c.height / h);
  return [c, ctx];
}

/** Dark-mode version of a light UI canvas: invert lightness, keep hues (like a dark theme). */
function darken(c: HTMLCanvasElement) {
  const d = document.createElement("canvas");
  d.width = c.width;
  d.height = c.height;
  const ctx = d.getContext("2d")!;
  ctx.filter = "invert(0.9) hue-rotate(180deg) saturate(1.15)";
  ctx.drawImage(c, 0, 0);
  return d;
}

function toTexture(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 16; // sharpest filtering the GPU allows (clamped by three.js)
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}

function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, fill?: string | CanvasGradient) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
}

function grad(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, a = TEAL, b = SKY) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  return g;
}

function text(ctx: Ctx, s: string, x: number, y: number, size: number, color: string, weight = 500, font = FONT) {
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

function bars(ctx: Ctx, x: number, y: number, w: number, h: number, values: number[]) {
  const gap = w * 0.04;
  const bw = (w - gap * (values.length - 1)) / values.length;
  values.forEach((v, i) => {
    const bh = h * v;
    rr(ctx, x + i * (bw + gap), y + h - bh, bw, bh, 6, grad(ctx, 0, y + h, 0, y, TEAL, SKY));
  });
}

/* ------------------------------ Desktop site ------------------------------ */

/** A tall landing page; the monitor shows a window of it and scrolls. */
export function websiteTexture(dark = false, scale = 1) {
  const W = 1280;
  const H = 1900;
  const [c, ctx] = canvas(W, H, scale);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // nav
  text(ctx, "nova", 64, 74, 34, "#0f172a", 700);
  ctx.fillStyle = TEAL;
  ctx.fillRect(146, 64, 9, 9);
  ["Product", "Pricing", "Customers", "About"].forEach((s, i) => text(ctx, s, 520 + i * 130, 72, 22, "#64748b"));
  rr(ctx, 1060, 40, 160, 50, 25, "#0f172a");
  text(ctx, "Get started", 1084, 73, 20, "#fff", 600);
  ctx.fillStyle = "#f1f5f9";
  ctx.fillRect(0, 120, W, 2);

  // hero
  rr(ctx, 64, 190, 150, 38, 19, "#ccfbf1");
  text(ctx, "New · v2.0", 84, 216, 18, "#0d9488", 600);
  text(ctx, "Work smarter", 64, 320, 72, "#0f172a", 700);
  text(ctx, "with your data", 64, 405, 72, "#0f172a", 700);
  text(ctx, "Dashboards, automation and insights —", 64, 470, 24, "#64748b");
  text(ctx, "in one beautifully simple app.", 64, 504, 24, "#64748b");
  rr(ctx, 64, 550, 230, 64, 14, grad(ctx, 64, 0, 294, 0));
  text(ctx, "Start free trial", 92, 591, 22, "#fff", 600);
  rr(ctx, 312, 550, 170, 64, 14, "#f1f5f9");
  text(ctx, "Watch demo", 338, 591, 22, "#0f172a", 600);

  // hero visual
  const hg = ctx.createLinearGradient(700, 170, 1220, 640);
  hg.addColorStop(0, "#ccfbf1");
  hg.addColorStop(0.5, "#e0f2fe");
  hg.addColorStop(1, "#e0e7ff");
  rr(ctx, 700, 170, 520, 460, 32, hg);
  rr(ctx, 740, 210, 440, 380, 22, "rgba(255,255,255,0.9)");
  text(ctx, "Revenue", 770, 256, 22, "#64748b");
  text(ctx, "$84.2k", 770, 300, 40, "#0f172a", 700);
  bars(ctx, 770, 330, 380, 230, [0.35, 0.6, 0.45, 0.8, 0.55, 0.92, 0.7]);

  // features
  const feats = ["Real-time sync", "Smart alerts", "Team spaces"];
  const tints = ["#ccfbf1", "#e0f2fe", "#e0e7ff"];
  feats.forEach((f, i) => {
    const x = 64 + i * 392;
    rr(ctx, x, 720, 360, 240, 24, "#ffffff");
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 2;
    ctx.stroke();
    rr(ctx, x + 32, 752, 64, 64, 16, tints[i]!);
    text(ctx, f, x + 32, 860, 26, "#0f172a", 600);
    rr(ctx, x + 32, 886, 280, 12, 6, "#f1f5f9");
    rr(ctx, x + 32, 910, 200, 12, 6, "#f1f5f9");
  });

  // testimonial band
  rr(ctx, 64, 1030, W - 128, 300, 32, "#0f172a");
  text(ctx, "Loved by 2,000+ teams", 120, 1130, 44, "#fff", 700);
  text(ctx, "“We shipped our redesign in half the time.”", 120, 1186, 24, "rgba(255,255,255,0.6)");
  for (let i = 0; i < 6; i++)
    rr(ctx, 760 + (i % 3) * 140, 1090 + Math.floor(i / 3) * 90, 120, 70, 14, "rgba(255,255,255,0.1)");

  // grid
  for (let i = 0; i < 8; i++) rr(ctx, 64 + (i % 4) * 296, 1400 + Math.floor(i / 4) * 220, 272, 190, 22, "#f8fafc");

  return { texture: toTexture(dark ? darken(c) : c), ratio: H / W };
}

/* ------------------------------ Mobile site ------------------------------- */

export function mobileSiteTexture(dark = false, scale = 1) {
  const W = 600;
  const H = 1900;
  const [c, ctx] = canvas(W, H, scale);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, H);
  text(ctx, "nova", 40, 130, 34, "#0f172a", 700);
  ctx.fillStyle = TEAL;
  ctx.fillRect(122, 120, 9, 9);
  rr(ctx, 520, 104, 40, 5, 3, "#0f172a");
  rr(ctx, 520, 118, 40, 5, 3, "#0f172a");
  text(ctx, "Work smarter", 40, 250, 62, "#0f172a", 700);
  text(ctx, "with your data", 40, 322, 62, "#0f172a", 700);
  text(ctx, "Dashboards & insights.", 40, 372, 30, "#64748b");
  rr(ctx, 40, 400, 230, 62, 14, grad(ctx, 40, 0, 270, 0));
  text(ctx, "Start free trial", 62, 442, 26, "#fff", 600);
  const hg = ctx.createLinearGradient(40, 500, 560, 840);
  hg.addColorStop(0, "#ccfbf1");
  hg.addColorStop(1, "#e0e7ff");
  rr(ctx, 40, 500, 520, 340, 28, hg);
  rr(ctx, 70, 530, 460, 280, 20, "rgba(255,255,255,0.9)");
  bars(ctx, 100, 570, 400, 210, [0.4, 0.65, 0.5, 0.85, 0.6, 0.92]);
  ["Real-time sync", "Smart alerts", "Team spaces", "Reports", "Integrations"].forEach((s, i) => {
    const y = 880 + i * 150;
    rr(ctx, 40, y, 520, 126, 22, "#fff");
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 2;
    ctx.stroke();
    rr(ctx, 66, y + 28, 70, 70, 16, ["#ccfbf1", "#e0f2fe", "#e0e7ff", "#fef3c7", "#fce7f3"][i]!);
    text(ctx, s, 150, y + 72, 40, "#0f172a", 700);
    rr(ctx, 160, y + 78, 260, 12, 6, "#f1f5f9");
  });
  return { texture: toTexture(dark ? darken(c) : c), ratio: H / W };
}

/* --------------------------------- Chat ---------------------------------- */

/** One texture per conversation step (0 = empty … 4 = complete). */
export function chatTextures(dark = false, scale = 1) {
  return [0, 1, 2, 3, 4].map((step) => {
    const W = 600;
    const H = 1240;
    const [c, ctx] = canvas(W, H, scale);
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#f8fafc");
    bg.addColorStop(1, "#ffffff");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // header
    ctx.beginPath();
    ctx.arc(70, 150, 30, 0, Math.PI * 2);
    ctx.fillStyle = grad(ctx, 40, 120, 100, 180);
    ctx.fill();
    text(ctx, "AI", 55, 160, 24, "#fff", 700);
    text(ctx, "Assistant", 120, 147, 32, "#0f172a", 600);
    text(ctx, "● online", 120, 178, 20, "#0d9488");
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(30, 210, W - 60, 2);

    const bubble = (lines: string[], y: number, mine: boolean) => {
      const w = Math.min(W - 50, Math.max(...lines.map((l) => l.length)) * 20 + 52);
      const h = lines.length * 50 + 36;
      const x = mine ? W - 30 - w : 30;
      rr(ctx, x, y, w, h, 26, mine ? grad(ctx, x, 0, x + w, 0) : "#eef2f6");
      lines.forEach((l, i) => text(ctx, l, x + 26, y + 58 + i * 50, 36, mine ? "#fff" : "#334155", 600));
      return y + h + 22;
    };

    let y = 300;
    if (step >= 1) y = bubble(["Can you check why", "our app feels slow?"], y, true);
    if (step === 1) {
      rr(ctx, 30, y, 110, 56, 28, "#eef2f6");
      [0, 1, 2].forEach((i) => {
        ctx.beginPath();
        ctx.arc(62 + i * 24, y + 28, 7, 0, Math.PI * 2);
        ctx.fillStyle = "#94a3b8";
        ctx.fill();
      });
    }
    if (step >= 2)
      y = bubble(["Found it — two database", "queries run on every", "page load. Here's a fix:"], y, false);
    if (step >= 3) {
      rr(ctx, 30, y, 520, 160, 22, "#0f172a");
      text(ctx, "const data = await cache", 54, y + 46, 24, "#7dd3fc", 500, MONO);
      text(ctx, '  .get("dashboard")', 54, y + 84, 24, "#5eead4", 500, MONO);
      text(ctx, "  ?? db.query(summary);", 54, y + 122, 24, "#fde68a", 500, MONO);
      y += 182;
    }
    if (step >= 4) bubble(["Perfect, ship it 🚀"], y, true);

    // composer
    rr(ctx, 30, H - 120, W - 60, 76, 38, "#ffffff");
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, "Ask anything…", 66, H - 70, 28, "#94a3b8");
    ctx.beginPath();
    ctx.arc(W - 76, H - 82, 26, 0, Math.PI * 2);
    ctx.fillStyle = grad(ctx, W - 100, 0, W - 50, 0);
    ctx.fill();
    return toTexture(dark ? darken(c) : c);
  });
}

/* ------------------------------ Phone layers ------------------------------ */

export function uiLayerTexture(dark = false) {
  const W = 600;
  const H = 1240;
  const [c, ctx] = canvas(W, H);
  rr(ctx, 0, 0, W, H, 80, "#ffffff");
  rr(ctx, 40, 90, W - 80, 170, 34, grad(ctx, 40, 0, W - 40, 0));
  ["#e0f2fe", "#ccfbf1", "#e0e7ff", "#fef3c7"].forEach((col, i) =>
    rr(ctx, 40 + (i % 2) * 270, 290 + Math.floor(i / 2) * 230, 250, 200, 30, col),
  );
  rr(ctx, 40, 770, W - 80, 230, 30, "#f1f5f9");
  rr(ctx, 40, 1030, 250, 100, 24, "#0f172a");
  rr(ctx, 310, 1030, 250, 100, 24, grad(ctx, 310, 0, 560, 0));
  return toTexture(dark ? darken(c) : c);
}

export function codeLayerTexture() {
  const W = 600;
  const H = 1240;
  const [c, ctx] = canvas(W, H);
  rr(ctx, 0, 0, W, H, 80, "#0f172a");
  const cols = ["#7dd3fc", "#5eead4", "#64748b", "#fde68a"];
  for (let i = 0; i < 30; i++) {
    const y = 90 + i * 36;
    text(ctx, String(i + 1).padStart(2, " "), 40, y + 10, 18, "#475569", 500, MONO);
    const indent = [0, 30, 60, 30][i % 4]!;
    const w = 120 + ((i * 97) % 300);
    rr(ctx, 90 + indent, y - 4, w, 14, 7, cols[i % 4]!);
  }
  return toTexture(c);
}

export function circuitTexture() {
  const W = 600;
  const H = 1240;
  const [c, ctx] = canvas(W, H);
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0d3b44");
  bg.addColorStop(1, "#082229");
  rr(ctx, 0, 0, W, H, 80, bg);
  ctx.lineWidth = 3;
  for (let i = 0; i < 16; i++) {
    const x = 40 + i * 34;
    ctx.strokeStyle = i % 3 === 0 ? "rgba(251,191,36,0.7)" : "rgba(94,234,212,0.6)";
    ctx.beginPath();
    ctx.moveTo(x, 30);
    ctx.lineTo(x, 420 + (i % 4) * 40);
    ctx.lineTo(W / 2, 600 - (i % 3) * 20);
    ctx.moveTo(x, H - 30);
    ctx.lineTo(x, 820 - (i % 4) * 40);
    ctx.lineTo(W / 2, 640 + (i % 3) * 20);
    ctx.stroke();
    ctx.fillStyle = "rgba(251,191,36,0.9)";
    ctx.beginPath();
    ctx.arc(x, 30, 6, 0, Math.PI * 2);
    ctx.arc(x, H - 30, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  // chip
  rr(ctx, W / 2 - 110, H / 2 - 110, 220, 220, 26, "#1e293b");
  ctx.strokeStyle = "rgba(94,234,212,0.9)";
  ctx.lineWidth = 4;
  ctx.stroke();
  text(ctx, "BACKEND", W / 2 - 74, H / 2 + 10, 30, "#99f6e4", 700, MONO);
  return toTexture(c);
}

/** Emissive LED panel for a server rack front. */
export function rackTexture() {
  const W = 256;
  const H = 640;
  const [c, ctx] = canvas(W, H);
  ctx.fillStyle = "#1f2937";
  ctx.fillRect(0, 0, W, H);
  for (let r = 0; r < 14; r++) {
    const y = 24 + r * 44;
    rr(ctx, 16, y, W - 32, 34, 5, "#111827");
    for (let k = 0; k < 3; k++) {
      ctx.fillStyle = (r + k) % 3 === 0 ? "#5eead4" : (r + k) % 3 === 1 ? "#38bdf8" : "#334155";
      ctx.beginPath();
      ctx.arc(34 + k * 16, y + 17, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#374151";
    ctx.fillRect(100, y + 14, 130, 6);
  }
  return toTexture(c);
}

/* ------------------------------- Tool tiles ------------------------------- */

function isTooDark(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b < 60;
}

/** Face of a glass tool tile: brand mark + name + what we use it for. */
export function toolTileTexture(tech: TechItem) {
  // Drawn in a 512 design space, stored at 320px to keep GPU memory low.
  const W = 512;
  const H = 512;
  const [c, ctx] = canvas(320, 320);
  ctx.scale(320 / W, 320 / H);
  const color = isTooDark(tech.hex) ? "#0f172a" : tech.hex;

  // soft brand halo
  const halo = ctx.createRadialGradient(W / 2, 200, 10, W / 2, 200, 190);
  halo.addColorStop(0, `${tech.hex}33`);
  halo.addColorStop(1, `${tech.hex}00`);
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, H);

  if (tech.path) {
    ctx.save();
    const size = 230;
    ctx.translate(W / 2 - size / 2, 70);
    ctx.scale(size / 24, size / 24);
    ctx.fillStyle = color;
    ctx.fill(new Path2D(tech.path));
    ctx.restore();
  } else {
    text(ctx, tech.name.charAt(0), W / 2 - 60, 290, 220, color, 700);
  }

  ctx.textAlign = "center";
  let size = 66;
  ctx.font = `600 ${size}px ${FONT}`;
  while (ctx.measureText(tech.name).width > W - 60 && size > 36) ctx.font = `600 ${(size -= 4)}px ${FONT}`;
  text(ctx, tech.name, W / 2, 430, size, "#0f172a", 600);
  ctx.textAlign = "start";
  return toTexture(c);
}

/* ---------------------------------- Wood ---------------------------------- */

/** Light oak (or smoked oak in dark mode) with soft grain, for the desk top. */
export function woodTexture(dark = false) {
  const W = 1024;
  const H = 512;
  const [c, ctx] = canvas(W, H);
  ctx.fillStyle = dark ? "#3b3229" : "#d9c3a5";
  ctx.fillRect(0, 0, W, H);
  // long grain lines
  for (let i = 0; i < 260; i++) {
    const y = (i / 260) * H + Math.sin(i * 12.9898) * 3;
    const light = (Math.sin(i * 78.233) + 1) / 2;
    ctx.strokeStyle = dark
      ? `rgba(${20 + light * 30},${15 + light * 20},${10 + light * 15},0.35)`
      : `rgba(${150 + light * 50},${110 + light * 40},${70 + light * 30},0.28)`;
    ctx.lineWidth = 0.6 + light * 1.6;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= W; x += 32)
      ctx.lineTo(x, y + Math.sin(x * 0.006 + i * 0.7) * 4 + Math.sin(x * 0.02 + i) * 1.2);
    ctx.stroke();
  }
  // a few soft knots / tone patches
  for (let k = 0; k < 6; k++) {
    const g = ctx.createRadialGradient(
      140 + k * 160,
      80 + ((k * 137) % 360),
      0,
      140 + k * 160,
      80 + ((k * 137) % 360),
      120,
    );
    g.addColorStop(0, dark ? "rgba(0,0,0,0.12)" : "rgba(120,80,40,0.08)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  const t = toTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 1);
  return t;
}

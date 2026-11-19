"use client";

/**
 * The Jarvis holographic head, rendered with three.js from the same mesh the
 * desktop app draws (jarvis/core/avatar_mesh.py → scripts/export-jarvis-head.py
 * → public/jarvis/head.json).
 *
 * Look and motion are a port of the desktop renderer (jarvis/core/avatar.py):
 *  - opaque faceted "glass" surface: per-facet normals, a key light high on the
 *    left plus a rim term, blended from the HUD background to the primary cyan;
 *  - a structure wireframe with an energy scan line sweeping up the face;
 *  - eyes, brows and lips drawn on the real landmark rings: dark sockets, lid
 *    lines, green iris + pupil, a mouth cavity with a strip of upper teeth;
 *  - autonomous motion only: an integrated idle sway, a speech nod, saccadic
 *    gaze that looks away while thinking and back at you while listening, and
 *    blinking. It deliberately does NOT follow the mouse cursor.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type HeadMode = "idle" | "listening" | "thinking" | "speaking";

type HeadData = {
  positions: number[];
  indices: number[];
  edges: number[];
  jaw: number[];
  brow: number[];
  fade: number[];
  landmarks: Record<"eye_l" | "eye_r" | "brow_l" | "brow_r" | "lips_in" | "lips_out", number[]>;
  jawPivot: [number, number, number];
  jawMax: number;
};

let cache: Promise<HeadData> | null = null;
function loadHead() {
  cache ??= fetch("/jarvis/head.json").then((r) => {
    if (!r.ok) throw new Error("head.json missing");
    return r.json() as Promise<HeadData>;
  });
  return cache;
}

/** Fetch the head mesh ahead of time (called by the launcher on idle / hover). */
export const preloadHead = loadHead;

type Props = {
  mode: HeadMode;
  /** 0..1 mouth opening, read every frame. */
  amplitude: React.MutableRefObject<number>;
  active?: boolean;
  /** Called once the head has rendered its first frame. */
  onReady?: () => void;
};

// Palette from the desktop HUD (jarvis/ui.py).
const BG = new THREE.Color("#00060a");
const PRIMARY = new THREE.Color("#00d4ff");
const ACCENT = new THREE.Color("#00ff88");
const mix = (a: THREE.Color, b: THREE.Color, t: number) => a.clone().lerp(b, t);
/** Raw sRGB channels for the custom shaders, which blend in sRGB exactly like
 *  the desktop painter (no linear conversion, so colours match the app). */
const srgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};
const BG_S = srgb("#00060a");
const PRIMARY_S = srgb("#00d4ff");

const BROW_LIFT = 0.14;
const rate = (dt: number, tau: number) => 1 - Math.exp(-dt / tau);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

const surfaceVert = /* glsl */ `
  attribute float aFade;
  varying vec3 vView;
  varying float vFade;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = -mv.xyz;
    vFade = aFade;
    gl_Position = projectionMatrix * mv;
  }
`;
const surfaceFrag = /* glsl */ `
  uniform vec3 uBg;
  uniform vec3 uPrimary;
  uniform float uAmp;
  varying vec3 vView;
  varying float vFade;
  void main() {
    // Flat per-facet normal: the faceting is what makes the anatomy readable.
    vec3 n = normalize(cross(dFdx(vView), dFdy(vView)));
    float nz = n.z;
    float fres = pow(clamp(1.0 - nz, 0.0, 2.0), 1.7);
    float lam = clamp(n.x * -0.55 + n.y * 0.50 + nz * 0.52, 0.0, 1.0);
    float bright = 0.26 + 0.20 * fres + 0.66 * pow(lam, 1.05);
    bright *= vFade * (0.88 + 0.24 * uAmp);
    gl_FragColor = vec4(mix(uBg, uPrimary, clamp(bright, 0.0, 1.0)), 1.0);
  }
`;
const wireVert = /* glsl */ `
  attribute float aFade;
  uniform float uScan;
  uniform float uAmp;
  varying float vA;
  void main() {
    vec3 n = normalize(normalMatrix * normal);
    float fres = pow(abs(1.0 - abs(n.z)), 1.5);
    float scan = 0.30 * exp(-pow((position.y - uScan) / 0.13, 2.0));
    vA = (0.10 + 0.42 * fres + scan) * aFade * (0.80 + 0.45 * uAmp);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const wireFrag = /* glsl */ `
  uniform vec3 uColor;
  varying float vA;
  void main() {
    if (vA < 0.05) discard;
    gl_FragColor = vec4(uColor, clamp(vA * 1.1, 0.0, 1.0));
  }
`;

/** Line/fan helpers over a landmark ring, updated in place every frame. */
function ringBuffer(n: number) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  return g;
}
function fanGeometry(n: number) {
  // vertex 0 = centre, 1..n = ring
  const g = ringBuffer(n + 1);
  const idx: number[] = [];
  for (let i = 0; i < n; i++) idx.push(0, 1 + i, 1 + ((i + 1) % n));
  g.setIndex(idx);
  return g;
}

function Head({
  data,
  mode,
  amplitude,
  onReady,
}: {
  data: HeadData;
  mode: HeadMode;
  amplitude: React.MutableRefObject<number>;
  onReady?: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  const frames = useRef(0);
  const lm = data.landmarks;

  const built = useMemo(() => {
    const base = Float32Array.from(data.positions);
    const nV = base.length / 3;
    const idx = data.indices;

    // Surface: non-indexed so every facet gets its own flat normal.
    const surface = new THREE.BufferGeometry();
    const flatPos = new THREE.BufferAttribute(new Float32Array(idx.length * 3), 3);
    const flatFade = new Float32Array(idx.length);
    for (let k = 0; k < idx.length; k++) flatFade[k] = data.fade[idx[k]!] ?? 1;
    surface.setAttribute("position", flatPos);
    surface.setAttribute("aFade", new THREE.BufferAttribute(flatFade, 1));

    // Wire: indexed over the shared deformed vertices, with smooth normals for the rim term.
    const deformed = new Float32Array(base.length);
    const wirePos = new THREE.BufferAttribute(deformed, 3);
    const wire = new THREE.BufferGeometry();
    wire.setAttribute("position", wirePos);
    wire.setAttribute("aFade", new THREE.BufferAttribute(Float32Array.from(data.fade), 1));
    const tmp = new THREE.BufferGeometry();
    tmp.setAttribute("position", new THREE.BufferAttribute(base.slice(), 3));
    tmp.setIndex(idx);
    tmp.computeVertexNormals();
    wire.setAttribute("normal", tmp.getAttribute("normal"));
    wire.setIndex(data.edges);

    const surfaceMat = new THREE.ShaderMaterial({
      vertexShader: surfaceVert,
      fragmentShader: surfaceFrag,
      uniforms: { uBg: { value: BG_S }, uPrimary: { value: PRIMARY_S }, uAmp: { value: 0 } },
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    const skin = BG_S.clone().lerp(PRIMARY_S, 132 / 255);
    const wireMat = new THREE.ShaderMaterial({
      vertexShader: wireVert,
      fragmentShader: wireFrag,
      uniforms: { uColor: { value: skin.clone().lerp(PRIMARY_S, 0.85) }, uScan: { value: -1.6 }, uAmp: { value: 0 } },
      transparent: true,
      depthWrite: false,
    });

    // Facial features (drawn over the surface, like the desktop painter).
    const overlay = (m: THREE.Material) => {
      m.depthTest = false;
      m.depthWrite = false;
      m.transparent = true;
      return m;
    };
    const eyeN = lm.eye_l.length;
    const eyes = (["eye_l", "eye_r"] as const).map(() => ({
      socket: fanGeometry(eyeN),
      lid: ringBuffer(eyeN),
    }));
    const brows = [ringBuffer(lm.brow_l.length), ringBuffer(lm.brow_r.length)];
    const lipsIn = ringBuffer(lm.lips_in.length);
    const lipsOut = ringBuffer(lm.lips_out.length);
    const cavity = fanGeometry(lm.lips_in.length);
    const lipUp = [...lm.lips_in.slice(10), lm.lips_in[0]!];
    const teeth = ringBuffer(lipUp.length * 2);
    {
      const ti: number[] = [];
      const n = lipUp.length;
      for (let i = 0; i < n - 1; i++) {
        // strip between upper-lip points (i) and their dropped copies (2n-1-i)
        const a = i, b = i + 1, c = 2 * n - 1 - i, d = 2 * n - 2 - i;
        ti.push(a, b, c, b, d, c);
      }
      teeth.setIndex(ti);
    }

    const mats = {
      socket: overlay(new THREE.MeshBasicMaterial({ color: mix(BG, PRIMARY, 22 / 255) })),
      lid: overlay(new THREE.LineBasicMaterial({ color: PRIMARY, opacity: 0.82 })),
      iris: overlay(new THREE.MeshBasicMaterial({ color: ACCENT, opacity: 0.35, side: THREE.DoubleSide })),
      pupil: overlay(new THREE.MeshBasicMaterial({ color: ACCENT, opacity: 0.96, side: THREE.DoubleSide })),
      brow: overlay(new THREE.LineBasicMaterial({ color: PRIMARY, opacity: 0.59 })),
      lipIn: overlay(new THREE.LineBasicMaterial({ color: PRIMARY, opacity: 0.6 })),
      lipOut: overlay(new THREE.LineBasicMaterial({ color: PRIMARY, opacity: 0.43 })),
      cavity: overlay(new THREE.MeshBasicMaterial({ color: mix(BG, PRIMARY, 0.1), side: THREE.DoubleSide })),
      teeth: overlay(new THREE.MeshBasicMaterial({ color: mix(BG, PRIMARY, 0.65), side: THREE.DoubleSide })),
    };
    const disc = new THREE.CircleGeometry(1, 28);
    const irisMats = [mats.iris, mats.iris.clone()];
    const pupilMats = [mats.pupil, mats.pupil.clone()];
    const browLines = brows.map((g) => {
      const l = new THREE.Line(g, mats.brow);
      l.renderOrder = 3;
      return l;
    });
    return { base, nV, surface, flatPos, wire, wirePos, deformed, surfaceMat, wireMat, eyes, brows, browLines, lipsIn, lipsOut, cavity, teeth, lipUp, mats, irisMats, pupilMats, disc };
  }, [data, lm]);

  const irisRefs = [useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null)];
  const pupilRefs = [useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null)];
  const cavityRef = useRef<THREE.Mesh>(null);
  const teethRef = useRef<THREE.Mesh>(null);

  // Animation state, mirroring avatar.py.
  const s = useRef({
    t: 0, sway: 0, yaw: 0, pitch: 0, mouth: 0, emph: 0, glow: 0, scan: -1.6,
    blink: 0, blinkAt: 3, ampSlow: 0, expr: 0, exprTgt: 0, exprAt: 0, brow: 0, browBias: 0,
    gaze: [0, 0], gazeTgt: [0, 0], gazeAt: 0, bias: [0, 0], biasTgt: [0, 0], biasAt: 0,
  });

  useFrame((_, delta) => {
    const st = s.current;
    const dt = clamp(delta, 0.001, 0.1);
    st.t += dt;
    const t = st.t;
    const live = mode === "speaking";
    const thinking = mode === "thinking";
    const amp = live ? clamp(amplitude.current, 0, 1) : 0;

    // ── idle sway (integrated phase so speed changes never jump the head) ──
    st.sway += dt * (live ? 1.25 : 1);
    const sw = st.sway;
    st.yaw = 0.26 * Math.sin(sw * 0.31) + 0.09 * Math.sin(sw * 0.73 + 1.3);
    st.pitch = 0.06 * Math.sin(sw * 0.23 + 0.7) + 0.024 * Math.sin(sw * 0.61);

    // ── mouth ────────────────────────────────────────────────────────────
    const target = live ? Math.min(1, amp) : 0;
    const tau = target > st.mouth ? 0.022 : live ? 0.012 : 0.055;
    st.mouth += (target - st.mouth) * rate(dt, tau);
    if (st.mouth < 0.002) st.mouth = 0;

    // Speech nod.
    st.emph += (st.mouth - st.emph) * rate(dt, st.mouth > st.emph ? 0.055 : 0.32);
    st.pitch -= st.emph * 0.028;
    st.yaw += 0.018 * Math.sin(t * 1.7) * st.emph;

    // ── brows: ride the phrase envelope and random expression while talking ──
    st.ampSlow += (amp - st.ampSlow) * rate(dt, amp > st.ampSlow ? 0.16 : 0.36);
    if (live) {
      if (t >= st.exprAt) {
        st.exprTgt = rand(-0.35, 1);
        st.exprAt = t + 1.1 + 2 * Math.random();
      }
    } else {
      st.exprTgt = 0;
      st.exprAt = t + 0.8;
    }
    st.expr += (st.exprTgt - st.expr) * 0.075;
    const browBiasTgt = thinking ? -0.28 : mode === "listening" ? 0.1 : 0;
    st.browBias += (browBiasTgt - st.browBias) * 0.06;
    st.brow += (clamp(0.55 * st.ampSlow + 0.6 * st.expr + st.browBias, -0.4, 1.2) - st.brow) * 0.2;

    // ── gaze: look away to think, back at the user otherwise ────────────
    if (thinking) {
      if (t >= st.biasAt) {
        st.biasTgt = [(Math.random() < 0.5 ? -1 : 1) * rand(0.45, 0.8), rand(0.25, 0.55)];
        st.biasAt = t + 1.4 + 1.6 * Math.random();
      }
    } else {
      st.biasTgt = [0, 0];
      st.biasAt = 0;
    }
    for (const i of [0, 1]) st.bias[i]! += (st.biasTgt[i]! - st.bias[i]!) * 0.06;
    if (t >= st.gazeAt) {
      const reach = live ? 0.9 : thinking ? 0.35 : 0.55;
      st.gazeTgt = [rand(-1, 1) * reach, rand(-1, 1) * reach * 0.55];
      st.gazeAt = t + (live ? 0.55 + 1.7 * Math.random() : thinking ? 1.8 + 2.4 * Math.random() : 1.3 + 2.8 * Math.random());
    }
    for (const i of [0, 1]) st.gaze[i]! += (clamp(st.gazeTgt[i]! + st.bias[i]!, -1, 1) - st.gaze[i]!) * 0.3;

    // ── glow + scan line ────────────────────────────────────────────────
    st.glow += (amp - st.glow) * (amp > st.glow ? 0.35 : 0.1);
    st.scan += dt * (0.55 + 1.5 * st.glow);
    if (st.scan > 1.35) st.scan = -1.75;

    // ── blink ───────────────────────────────────────────────────────────
    if (st.blink > 0) st.blink = Math.max(0, st.blink - dt * 8.5);
    else if (t >= st.blinkAt) {
      st.blink = 1;
      st.blinkAt = t + (thinking ? 5.5 : 3.4) + 3.1 * Math.random();
    }

    // ── pose the geometry: brow lift + jaw drop ─────────────────────────
    const { base, nV, deformed, flatPos, wirePos, surfaceMat, wireMat } = built;
    const [, py, pz] = data.jawPivot;
    const jawAng = st.mouth * data.jawMax * 1.6;
    const lift = st.brow * BROW_LIFT;
    for (let i = 0; i < nV; i++) {
      const x = base[i * 3]!;
      let y = base[i * 3 + 1]!;
      let z = base[i * 3 + 2]!;
      const bw = data.brow[i] ?? 0;
      if (bw && Math.abs(lift) > 0.0005) y += bw * lift;
      const w = data.jaw[i] ?? 0;
      if (w > 0 && jawAng > 1e-4) {
        const a = jawAng * w, ca = Math.cos(a), sa = Math.sin(a);
        const dy = y - py, dz = z - pz;
        y = py + dy * ca - dz * sa;
        z = pz + dy * sa + dz * ca;
      }
      deformed[i * 3] = x;
      deformed[i * 3 + 1] = y;
      deformed[i * 3 + 2] = z;
    }
    const flat = flatPos.array as Float32Array;
    const idx = data.indices;
    for (let k = 0; k < idx.length; k++) {
      const vi = idx[k]! * 3;
      flat[k * 3] = deformed[vi]!;
      flat[k * 3 + 1] = deformed[vi + 1]!;
      flat[k * 3 + 2] = deformed[vi + 2]!;
    }
    flatPos.needsUpdate = true;
    wirePos.needsUpdate = true;
    built.surface.computeBoundingSphere();
    surfaceMat.uniforms.uAmp!.value = st.glow;
    wireMat.uniforms.uAmp!.value = st.glow;
    wireMat.uniforms.uScan!.value = st.scan;

    // ── features ────────────────────────────────────────────────────────
    const P = (i: number) => [deformed[i * 3]!, deformed[i * 3 + 1]!, deformed[i * 3 + 2]! + 0.006] as const;
    const writeRing = (g: THREE.BufferGeometry, ids: number[], offset = 0, yScale?: { mid: number; k: number }) => {
      const arr = g.getAttribute("position").array as Float32Array;
      ids.forEach((vi, j) => {
        const [x, y, z] = P(vi);
        const o = (offset + j) * 3;
        arr[o] = x;
        arr[o + 1] = yScale ? yScale.mid + (y - yScale.mid) * yScale.k : y;
        arr[o + 2] = z;
      });
      g.getAttribute("position").needsUpdate = true;
    };
    const vis = 1 - st.blink;
    (["eye_l", "eye_r"] as const).forEach((key, e) => {
      const ids = lm[key];
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, cz = 0, zMax = -Infinity;
      for (const vi of ids) {
        const [x, y, z] = P(vi);
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        cz += z; zMax = Math.max(zMax, z);
      }
      cz /= ids.length;
      const midY = ids.reduce((a, vi) => a + P(vi)[1], 0) / ids.length;
      const k = Math.max(0.04, vis);
      const { socket, lid } = built.eyes[e]!;
      writeRing(lid, ids, 0, { mid: midY, k });
      writeRing(socket, ids, 1, { mid: midY, k });
      const sa = socket.getAttribute("position").array as Float32Array;
      sa[0] = (minX + maxX) / 2; sa[1] = midY; sa[2] = cz;
      socket.computeBoundingSphere();
      lid.computeBoundingSphere();

      const w = maxX - minX;
      const iris = irisRefs[e]!.current, pupil = pupilRefs[e]!.current;
      const show = vis > 0.35;
      if (iris && pupil) {
        iris.visible = pupil.visible = show;
        const gx = (minX + maxX) / 2 + st.gaze[0]! * w * 0.16;
        const gy = midY - st.gaze[1]! * (maxY - minY) * 0.2;
        const rad = Math.min((maxY - minY) * 0.62, w * 0.2);
        iris.position.set(gx, gy, zMax + 0.004);
        iris.scale.set(rad, rad * vis, 1);
        (iris.material as THREE.MeshBasicMaterial).opacity = (70 + 60 * st.glow) / 255 * vis;
        pupil.position.set(gx, gy, zMax + 0.006);
        pupil.scale.set(rad * 0.42, rad * 0.42 * vis, 1);
        (pupil.material as THREE.MeshBasicMaterial).opacity = 0.96 * vis;
      }
    });
    writeRing(built.brows[0]!, lm.brow_l);
    writeRing(built.brows[1]!, lm.brow_r);
    writeRing(built.lipsIn, lm.lips_in);
    writeRing(built.lipsOut, lm.lips_out);
    (built.mats.lipIn as THREE.LineBasicMaterial).opacity = (150 + 70 * st.mouth) / 255;

    const open = st.mouth > 0.02;
    if (cavityRef.current) cavityRef.current.visible = open;
    if (teethRef.current) teethRef.current.visible = open;
    if (open) {
      writeRing(built.cavity, lm.lips_in, 1);
      const ca = built.cavity.getAttribute("position").array as Float32Array;
      let cx = 0, cy = 0, cz = 0, lo = Infinity, hi = -Infinity;
      for (const vi of lm.lips_in) {
        const [x, y, z] = P(vi);
        cx += x; cy += y; cz += z; lo = Math.min(lo, y); hi = Math.max(hi, y);
      }
      const n = lm.lips_in.length;
      ca[0] = cx / n; ca[1] = cy / n; ca[2] = cz / n;
      built.cavity.computeBoundingSphere();
      (built.mats.cavity as THREE.MeshBasicMaterial).color = mix(BG, PRIMARY, (16 + 26 * st.mouth) / 255);
      const th = (hi - lo) * 0.3;
      const ta = built.teeth.getAttribute("position").array as Float32Array;
      const up = built.lipUp;
      up.forEach((vi, j) => {
        const [x, y, z] = P(vi);
        ta.set([x, y, z], j * 3);
        ta.set([x, y - th, z], (2 * up.length - 1 - j) * 3);
      });
      built.teeth.getAttribute("position").needsUpdate = true;
      built.teeth.computeBoundingSphere();
      (built.mats.teeth as THREE.MeshBasicMaterial).color = mix(BG, PRIMARY, (150 + 60 * st.mouth) / 255);
    }
    for (const g of [...built.brows, built.lipsIn, built.lipsOut]) g.computeBoundingSphere();

    // ── head rotation: autonomous only, never the cursor ────────────────
    if (group.current) {
      group.current.rotation.set(st.pitch, st.yaw, 0);
      group.current.position.y = Math.sin(t * 1.1) * 0.015;
    }

    // Report ready after a couple of frames, once shaders are compiled and drawn.
    if (frames.current < 3 && ++frames.current === 2) onReady?.();
  });

  const { mats } = built;
  return (
    <group ref={group} scale={1.12}>
      <mesh geometry={built.surface} material={built.surfaceMat} />
      <lineSegments geometry={built.wire} material={built.wireMat} renderOrder={1} />
      {built.eyes.map((e, i) => (
        <group key={i}>
          <mesh geometry={e.socket} material={mats.socket} renderOrder={2} />
          <lineLoop geometry={e.lid} material={mats.lid} renderOrder={3} />
          <mesh ref={irisRefs[i]} geometry={built.disc} material={built.irisMats[i]} renderOrder={4} />
          <mesh ref={pupilRefs[i]} geometry={built.disc} material={built.pupilMats[i]} renderOrder={5} />
        </group>
      ))}
      {built.browLines.map((l, i) => (
        <primitive key={i} object={l} />
      ))}
      <mesh ref={cavityRef} geometry={built.cavity} material={mats.cavity} renderOrder={2} visible={false} />
      <mesh ref={teethRef} geometry={built.teeth} material={mats.teeth} renderOrder={3} visible={false} />
      <lineLoop geometry={built.lipsIn} material={mats.lipIn} renderOrder={4} />
      <lineLoop geometry={built.lipsOut} material={mats.lipOut} renderOrder={4} />
    </group>
  );
}

export default function JarvisHead({ mode, amplitude, active = true, onReady }: Props) {
  const [data, setData] = useState<HeadData | null>(null);
  const [failed, setFailed] = useState(false);
  const readyRef = useRef(onReady);
  readyRef.current = onReady;
  useEffect(() => {
    let alive = true;
    loadHead()
      .then((d) => alive && setData(d))
      .catch(() => {
        if (!alive) return;
        setFailed(true);
        readyRef.current?.(); // drop the placeholder so "AVATAR OFFLINE" is visible
      });
    return () => {
      alive = false;
    };
  }, []);

  if (failed) {
    return <div className="flex size-full items-center justify-center font-mono text-xs text-cyan-300/70">AVATAR OFFLINE</div>;
  }

  return (
    <Canvas
      dpr={[1, 2]}
      frameloop={active ? "always" : "never"}
      // offsetSize: measure layout size, not the transformed box. The panel
      // opens with a scale animation, which would otherwise shrink the canvas.
      resize={{ offsetSize: true }}
      camera={{ position: [0, -0.32, 5.3], fov: 34 }}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      {data && <Head data={data} mode={mode} amplitude={amplitude} onReady={onReady} />}
    </Canvas>
  );
}

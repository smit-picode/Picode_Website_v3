"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";

/**
 * "Night side of the Earth" seen from orbit: a huge dotted planet whose curve forms the
 * horizon, offices marked with map pins.
 * The planet never spins — it leans a few degrees toward the pointer and turns to an
 * office when that office is hovered.
 */

export type GlobePin = {
  id: string;
  code: string;
  label: string;
  lat: number;
  lng: number;
  url: string;
  primary?: boolean;
};

export type PointerRef = React.MutableRefObject<{ x: number; y: number }>;

const R = 1;
const DEG = Math.PI / 180;
/** Planet scale and how far below the frame its centre sits (horizon view). */
const SCALE = 1.8;
const DROP = -1.05;
/** How high above the camera axis the offices should sit (degrees of arc). */
const ELEVATION = 34;

function toVec(lat: number, lng: number, r = R) {
  const phi = (90 - lat) * DEG;
  const theta = (lng + 180) * DEG;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

/* ------------------------------------------------------------------ */
/* Solid land                                                           */
/* ------------------------------------------------------------------ */

/**
 * Continents as a solid fill: an equirectangular land mask (Natural Earth, /globe-land.png)
 * is used as the alpha of a second sphere just above the ocean.
 */
function LandFill({ color }: { color: string }) {
  const gl = useThree((st) => st.gl);
  const [mask, setMask] = useState<THREE.Texture | null>(null);

  // Pre-rendered PNG mask (white land on black): decoded by the browser's image pipeline,
  // so it never depends on rasterising a large SVG at runtime. Retries once on failure.
  useEffect(() => {
    let cancelled = false;
    let texture: THREE.Texture | null = null;
    const loader = new THREE.TextureLoader();
    const load = (attempt: number) =>
      loader.load(
        "/globe-land.png",
        (t) => {
          if (cancelled) return t.dispose();
          t.anisotropy = gl.capabilities.getMaxAnisotropy();
          t.colorSpace = THREE.NoColorSpace;
          texture = t;
          setMask(t);
        },
        undefined,
        () => {
          if (!cancelled && attempt < 2) window.setTimeout(() => load(attempt + 1), 800);
        },
      );
    load(0);
    return () => {
      cancelled = true;
      texture?.dispose();
    };
  }, [gl]);

  if (!mask) return null;
  return (
    <mesh>
      <sphereGeometry args={[R * 1.002, 160, 160]} />
      <meshBasicMaterial color={color} alphaMap={mask} transparent depthWrite={false} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Ocean: soft brand gradient                                           */
/* ------------------------------------------------------------------ */

// Gradient is computed from the view-space normal, so it stays put while the planet turns.
const oceanVertex = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const oceanFragment = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uLeft;
  uniform vec3 uRight;
  varying vec3 vNormal;
  void main() {
    vec3 n = normalize(vNormal);
    vec3 side = mix(uLeft, uRight, smoothstep(-0.9, 0.9, n.x));
    vec3 col = mix(side, uTop, smoothstep(-0.2, 0.95, n.y));
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

function useOceanMaterial(dark: boolean) {
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: oceanVertex,
        fragmentShader: oceanFragment,
        uniforms: dark
          ? {
              uTop: { value: new THREE.Color("#0b1d2c") },
              uLeft: { value: new THREE.Color("#092a2c") },
              uRight: { value: new THREE.Color("#0a1a33") },
            }
          : {
              uTop: { value: new THREE.Color("#fbfefe") },
              uLeft: { value: new THREE.Color("#c4efe7") },
              uRight: { value: new THREE.Color("#c9e6fa") },
            },
      }),
    [dark],
  );
}

/* ------------------------------------------------------------------ */
/* Map pin                                                              */
/* ------------------------------------------------------------------ */

function MapPin({
  pin,
  active,
  onHover,
  globe,
  dark,
}: {
  pin: GlobePin;
  active: boolean;
  onHover: (id: string | null) => void;
  globe: React.RefObject<THREE.Mesh>;
  dark: boolean;
}) {
  const color = pin.primary ? "#0d9488" : "#0284c7";
  const { base, ringQuat } = useMemo(() => {
    const n = toVec(pin.lat, pin.lng, 1).normalize();
    return {
      base: n.clone().multiplyScalar(R * 1.004),
      ringQuat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n),
    };
  }, [pin.lat, pin.lng]);
  const ring = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    [ring, ring2].forEach((r, k) => {
      if (!r.current) return;
      const p = (clock.getElapsedTime() * 0.5 + k * 0.5) % 1;
      r.current.scale.setScalar(1 + p * 2.2);
      (r.current.material as THREE.MeshBasicMaterial).opacity = (1 - p) * (dark ? 0.8 : 0.6);
    });
  });

  const open = () => window.open(pin.url, "_blank", "noopener,noreferrer");

  return (
    <group>
      {[ring, ring2].map((r, i) => (
        <mesh key={i} ref={r} position={base} quaternion={ringQuat}>
          <ringGeometry args={[0.011, 0.0145, 48]} />
          <meshBasicMaterial color={color} transparent depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* The pin itself is HTML: crisp at any size and reliably clickable. Its tip sits on the location. */}
      <Html position={base} occlude={[globe]} zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
        <button
          type="button"
          onClick={open}
          onMouseEnter={() => onHover(pin.id)}
          onMouseLeave={() => onHover(null)}
          onFocus={() => onHover(pin.id)}
          onBlur={() => onHover(null)}
          aria-label={`Open ${pin.label} office in Google Maps`}
          className="group pointer-events-auto absolute bottom-0 left-0 flex -translate-x-1/2 cursor-pointer flex-col items-center outline-none"
        >
          <span
            className={`mb-1.5 flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 font-display text-xs font-semibold shadow-[0_10px_24px_-12px_rgba(15,23,42,0.45)] transition-all duration-300 ${
              dark ? "border-white/15 bg-[#0f1b2d] text-white" : "border-slate-200 bg-white text-slate-800"
            } ${active ? "-translate-y-1 scale-105" : ""}`}
          >
            <span className="size-1.5 rounded-full" style={{ background: color }} />
            {pin.label}
            <span className={`text-[0.625rem] font-medium ${dark ? "text-white/50" : "text-slate-400"}`}>{pin.code}</span>
          </span>
          <svg
            width="30"
            height="38"
            viewBox="0 0 30 38"
            className={`drop-shadow-[0_6px_6px_rgba(15,23,42,0.35)] transition-transform duration-300 ${active ? "-translate-y-1 scale-110" : "group-hover:-translate-y-0.5"}`}
            style={{ transformOrigin: "50% 100%" }}
            aria-hidden
          >
            <path d="M15 37C15 37 2 22.5 2 14a13 13 0 0 1 26 0c0 8.5-13 23-13 23Z" fill={color} stroke="white" strokeWidth="2" />
            <circle cx="15" cy="14" r="5" fill="white" />
          </svg>
        </button>
      </Html>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Scene                                                                */
/* ------------------------------------------------------------------ */

function Planet({
  pins,
  active,
  focus: focusId,
  onHover,
  motion,
  pointer,
  dark,
}: {
  pins: GlobePin[];
  active: string | null;
  focus: string | null;
  onHover: (id: string | null) => void;
  motion: boolean;
  pointer: PointerRef;
  dark: boolean;
}) {
  // While a pin is under the cursor the planet holds perfectly still so it can be clicked.
  const [pinHover, setPinHover] = useState<string | null>(null);
  const hoverPin = (id: string | null) => {
    setPinHover(id);
    onHover(id);
  };
  const globe = useRef<THREE.Mesh>(null);
  const tilt = useRef<THREE.Group>(null);
  const turn = useRef<THREE.Group>(null);

  const home = useMemo(() => {
    if (!pins.length) return { lat: 0, lng: 60 };
    return {
      lat: pins.reduce((s, p) => s + p.lat, 0) / pins.length - ELEVATION,
      lng: pins.reduce((s, p) => s + p.lng, 0) / pins.length,
    };
  }, [pins]);
  const view = useRef({ ...home });
  const lean = useRef({ x: 0, y: 0 });

  useFrame(({ clock }, dt) => {
    const focus = pins.find((p) => p.id === focusId);
    const target = focus ? { lat: focus.lat - ELEVATION, lng: focus.lng } : home;
    const k = 1 - Math.exp(-dt * 2.4);
    view.current.lat += (target.lat - view.current.lat) * k;
    view.current.lng += (target.lng - view.current.lng) * k;
    if (pinHover) return;
    const kp = 1 - Math.exp(-dt * 3.5);
    lean.current.x += ((motion ? pointer.current.x : 0) - lean.current.x) * kp;
    lean.current.y += ((motion ? pointer.current.y : 0) - lean.current.y) * kp;
    const sway = motion ? Math.sin(clock.getElapsedTime() * 0.3) * 1.2 : 0;
    if (tilt.current) tilt.current.rotation.x = (view.current.lat - lean.current.y * 3) * DEG;
    if (turn.current) turn.current.rotation.y = (-90 - view.current.lng + lean.current.x * 4 + sway) * DEG;
  });

  const ocean = useOceanMaterial(dark);

  return (
    <group position={[0, DROP, 0]} scale={SCALE}>
      <group ref={tilt} rotation={[home.lat * DEG, 0, 0]}>
        <group ref={turn} rotation={[0, (-90 - home.lng) * DEG, 0]}>
          <mesh ref={globe} material={ocean}>
            <sphereGeometry args={[R, 128, 128]} />
          </mesh>
          <LandFill color={dark ? "#2c4c62" : "#d5dbe2"} />
          {pins.map((p) => (
            <MapPin key={p.id} pin={p} active={active === p.id} onHover={hoverPin} globe={globe} dark={dark} />
          ))}
        </group>
      </group>
    </group>
  );
}

export default function GlobeScene({
  pins,
  active,
  focus,
  onHover,
  motion,
  pointer,
  dark,
  onReady,
}: {
  pins: GlobePin[];
  active: string | null;
  /** Office the planet should turn to (driven by the cards, never by the pins themselves). */
  focus: string | null;
  onHover: (id: string | null) => void;
  motion: boolean;
  pointer: PointerRef;
  dark: boolean;
  onReady?: () => void;
}) {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => setCoarse(window.matchMedia("(pointer: coarse)").matches), []);
  return (
    <Canvas
      flat
      dpr={[1, 2]}
      camera={{ position: [0, 0, 3], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={() => onReady?.()}
      style={{ touchAction: "pan-y" }}
      className={coarse ? "[&_canvas]:!pointer-events-none" : undefined}
    >
      <Planet pins={pins} active={active} focus={focus} onHover={onHover} motion={motion} pointer={pointer} dark={dark} />
    </Canvas>
  );
}

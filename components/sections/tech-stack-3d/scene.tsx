"use client";

import { createContext, useContext, useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, RoundedBox, SoftShadows } from "@react-three/drei";
import { Bloom, EffectComposer, N8AO, SMAA } from "@react-three/postprocessing";
import { SUBJECT_LAYER, SubjectFocusEffect } from "@/components/sections/tech-stack-3d/subject-focus";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three-stdlib";
import { useTransform, type MotionValue } from "framer-motion";
import {
  chatTextures,
  circuitTexture,
  codeLayerTexture,
  mobileSiteTexture,
  rackTexture,
  uiLayerTexture,
  websiteTexture,
  woodTexture,
} from "@/components/sections/tech-stack-3d/textures";

/* ------------------------------------------------------------------ */
/* Shared types                                                         */
/* ------------------------------------------------------------------ */

/** Screen-space positions of the tracked anchors (0–1), written every frame for the HTML callouts. */
export type TrackStore = { scene: number; points: { x: number; y: number; on: boolean }[] };

export type SceneProps = {
  onReady?: () => void;
  progress: MotionValue<number>;
  track: MutableRefObject<TrackStore>;
  active: boolean;
  background: string;
  dark: boolean;
};

/* ------------------------------------------------------------------ */
/* Timeline helpers                                                     */
/* ------------------------------------------------------------------ */

const N = 6;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const seg = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
const smooth = (t: number) => t * t * (3 - 2 * t);
const ss = (v: number, a: number, b: number) => smooth(seg(v, a, b));
const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

const FLOOR = -1.45;

/**
 * Screen UI is drawn at (about) the pixel size it occupies in the close-up shot, so text is
 * rasterised crisply at its final size instead of being downscaled by the GPU (which looks soft).
 * Derived from the camera framing: px per world unit ≈ canvasHeight / (2·d·tan(fov/2)).
 */
function useScreenScale(screenWidth: number, distance: number, designWidth: number) {
  const { size, viewport } = useThree();
  const px = (size.height / (2 * distance * Math.tan((15 * Math.PI) / 180))) * screenWidth * viewport.dpr;
  return Math.round(Math.min(2, Math.max(0.35, px / designWidth)) * 20) / 20; // quantised to avoid re-draws
}

/**
 * Animation range in which each category's subject is settled (website scrolling,
 * chat playing, layers exploded…). Scroll inside a category plays only its own range;
 * the move to the next subject happens in a short window around the tab boundary.
 */
const HOLD: [number, number][] = [
  [0.0, 0.12], // frontend
  [0.25, 0.33], // mobile
  [0.355, 0.5], // ai
  [0.64, 0.665], // backend
  [0.77, 0.83], // cloud & devops
  [0.94, 1.0], // data
];
const EDGE = 0.14 / 6; // half-width of a transition window, in scroll units

/** Scroll progress → animation progress. */
export function warp(p: number) {
  const x = Math.min(1, Math.max(0, p));
  for (let i = 0; i < N - 1; i++) {
    const b = (i + 1) / N;
    if (x >= b - EDGE && x <= b + EDGE) {
      return HOLD[i]![1] + ((x - (b - EDGE)) / (2 * EDGE)) * (HOLD[i + 1]![0] - HOLD[i]![1]);
    }
  }
  const i = Math.min(N - 1, Math.floor(x * N));
  const lo = i === 0 ? 0 : i / N + EDGE;
  const hi = i === N - 1 ? 1 : (i + 1) / N - EDGE;
  return HOLD[i]![0] + ((x - lo) / (hi - lo)) * (HOLD[i]![1] - HOLD[i]![0]);
}

type Key = { at: number; pos: THREE.Vector3; look: THREE.Vector3 };

/** A slow, product-film camera path through the six scenes. */
const CAMERA: Key[] = [
  { at: 0.0, pos: v3(4.6, 3.1, 7.0), look: v3(0, 0.95, -0.3) },
  { at: 0.05, pos: v3(0.5, 1.75, 4.1), look: v3(0, 1.32, -0.55) }, // close on the monitor
  { at: 0.12, pos: v3(0.3, 1.7, 3.9), look: v3(0, 1.32, -0.55) },
  { at: 0.17, pos: v3(0.05, 1.42, 1.75), look: v3(0, 1.4, -0.55) }, // push into the monitor
  { at: 0.27, pos: v3(0.3, 1.6, 3.75), look: v3(0, 1.42, 0.9) }, // the phone floats out — close-up
  { at: 0.42, pos: v3(0.4, 1.65, 3.8), look: v3(0, 1.42, 0.9) },
  { at: 0.52, pos: v3(0.4, 1.7, 3.9), look: v3(0, 1.47, 0.9) },
  { at: 0.61, pos: v3(2.6, 3.3, 4.2), look: v3(0, 1.5, 0.9) }, // isometric over the layers
  { at: 0.71, pos: v3(0.9, 2.2, 6.9), look: v3(0, 1.95, 0.6) }, // the pipeline up to the cloud
  { at: 0.83, pos: v3(0.5, 2.1, 6.3), look: v3(0, 1.95, 0.6) },
  { at: 0.9, pos: v3(0, 3.6, -1.2), look: v3(0, 0.4, -9.0) }, // glide over the desk into the server aisle
  { at: 1.0, pos: v3(0.3, 3.0, -2.4), look: v3(0, 0.1, -9.4) },
];

function sampleCamera(p: number, pos: THREE.Vector3, look: THREE.Vector3) {
  let i = 0;
  while (i < CAMERA.length - 2 && p > CAMERA[i + 1]!.at) i++;
  const a = CAMERA[i]!;
  const b = CAMERA[i + 1]!;
  const t = ss(p, a.at, b.at);
  pos.lerpVectors(a.pos, b.pos, t);
  look.lerpVectors(a.look, b.look, t);
}

/* ------------------------------------------------------------------ */
/* Object registry + tracked anchors                                    */
/* ------------------------------------------------------------------ */

/** Dark theme flag for prop materials (space-grey hardware, graphite accessories). */
const DarkCtx = createContext(false);
const useDark = () => useContext(DarkCtx);

type Registry = Record<string, THREE.Object3D | null>;
type Reg = (key: string) => (o: THREE.Object3D | null) => void;
type Anchor = [obj: string, x: number, y: number, z: number];

/**
 * Points on real objects that each scene's tools are "tracked" to.
 * Even indices sit left of centre, odd indices right — matching the callout columns.
 */
const ANCHORS: Anchor[][] = [
  // Frontend — on the monitor's page
  [
    ["monitor", -0.95, 1.98, 0.02],
    ["monitor", 0.55, 1.98, 0.02],
    ["monitor", -0.7, 1.55, 0.02],
    ["monitor", 0.55, 1.45, 0.02],
    ["monitor", -0.85, 1.12, 0.02],
    ["monitor", 0.2, 0.95, 0.02],
    ["monitor", -0.35, 0.95, 0.02],
    ["monitor", 0.8, 0.9, 0.02],
  ],
  // Mobile — on the phone
  [
    ["phone", -0.14, 0.4, 0.03],
    ["phone", 0.14, 0.27, 0.03],
    ["phone", -0.12, 0.08, 0.03],
    ["phone", 0.13, -0.05, 0.03],
    ["phone", -0.14, -0.25, 0.03],
    ["phone", 0.14, -0.36, 0.03],
    ["phone", -0.05, -0.46, 0.03],
    ["phone", 0.06, 0.48, 0.03],
  ],
  // AI — on the conversation
  [
    ["phone", -0.12, 0.38, 0.03],
    ["phone", 0.12, 0.22, 0.03],
    ["phone", -0.12, 0.05, 0.03],
    ["phone", 0.1, -0.12, 0.03],
    ["phone", -0.1, -0.3, 0.03],
    ["phone", 0.12, -0.42, 0.03],
    ["phone", -0.15, -0.44, 0.03],
    ["phone", 0.05, 0.46, 0.03],
  ],
  // Backend — on the exploded layers
  [
    ["layer0", -0.16, 0.3, 0.02],
    ["layer0", 0.16, -0.25, 0.02],
    ["layer1", -0.2, -0.3, 0.02],
    ["layer1", 0.2, 0.35, 0.02],
    ["layer2", -0.16, 0.2, 0.02],
    ["layer2", 0.15, -0.35, 0.02],
    ["layer3", -0.18, -0.4, 0.03],
    ["layer3", 0.05, 0.02, 0.03],
  ],
  // Cloud & DevOps — providers on the cloud, tooling on the pipeline
  [
    ["cloud", -0.42, 0.08, 0.3],
    ["cloud", 0.42, 0.1, 0.3],
    ["cloud", -0.15, 0.24, 0.3],
    ["pipe", 0.05, 0.64, 0.05],
    ["pipe", -0.19, 1.27, 0],
    ["pipe", 0.19, 0.42, 0],
    ["pipe", -0.19, 0.85, 0],
    ["cloud", 0.18, 0.24, 0.3],
  ],
  // Data — on the racks
  [
    ["rack0", 0.36, 1.9, 0.0],
    ["rack1", -0.36, 1.9, 0.0],
    ["rack2", 0.36, 1.6, 0.0],
    ["rack3", -0.36, 1.6, 0.0],
    ["rack4", 0.36, 1.3, 0.0],
    ["rack5", -0.36, 1.3, 0.0],
    ["rack6", 0.36, 1.0, 0.0],
    ["rack7", -0.36, 1.0, 0.0],
  ],
];

function isShown(o: THREE.Object3D) {
  for (let n: THREE.Object3D | null = o; n; n = n.parent) {
    if (!n.visible) return false;
    if (n.scale.x < 0.3 || n.scale.y < 0.3) return false;
  }
  return true;
}

function Tracker({
  progress,
  registry,
  track,
}: {
  progress: MotionValue<number>;
  registry: Registry;
  track: MutableRefObject<TrackStore>;
}) {
  const { camera } = useThree();
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const p = progress.get();
    const scene = Math.min(N - 1, Math.floor(p * N));
    const out = track.current;
    out.scene = scene;
    const anchors = ANCHORS[scene]!;
    anchors.forEach(([key, x, y, z], i) => {
      const pt = (out.points[i] ??= { x: 0, y: 0, on: false });
      const obj = registry[key];
      if (!obj || !isShown(obj)) {
        pt.on = false;
        return;
      }
      v.set(x, y, z);
      obj.localToWorld(v);
      v.project(camera);
      pt.x = (v.x + 1) / 2;
      pt.y = (1 - v.y) / 2;
      pt.on = v.z < 1 && pt.x > 0.02 && pt.x < 0.98 && pt.y > 0.02 && pt.y < 0.98;
    });
    for (let i = anchors.length; i < out.points.length; i++) out.points[i]!.on = false;
  });
  return null;
}

/* ------------------------------------------------------------------ */
/* Canvas                                                               */
/* ------------------------------------------------------------------ */

export default function TechScene({ progress, track, active, background, dark, onReady }: SceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: false, powerPreference: "high-performance", stencil: false }}
      camera={{ fov: 30, near: 0.1, far: 80, position: [4.6, 3.1, 7.0] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
      }}
    >
      <DarkCtx.Provider value={dark}>
        <World progress={progress} track={track} background={background} dark={dark} />
      </DarkCtx.Provider>
      <Ready onReady={onReady} />
    </Canvas>
  );
}

/** Tells the page the scene has compiled and drawn a few frames, so the loader can fade out. */
function Ready({ onReady }: { onReady?: () => void }) {
  const frames = useRef(0);
  useFrame(() => {
    frames.current += 1;
    if (frames.current === 4) onReady?.();
  });
  return null;
}

function World({
  progress,
  track,
  background,
  dark,
}: {
  progress: MotionValue<number>;
  track: MutableRefObject<TrackStore>;
  background: string;
  dark: boolean;
}) {
  const registry = useMemo<Registry>(() => ({}), []);
  const reg = useMemo<Reg>(
    () => (key) => (o) => {
      registry[key] = o;
    },
    [registry],
  );
  const focus = useRef(new THREE.Vector3(0, 1, 0));
  const anim = useTransform(progress, warp);

  return (
    <>
      <color attach="background" args={[background]} />
      <fog attach="fog" args={[background, 16, 34]} />
      <SoftShadows size={28} samples={12} focus={0.7} />
      <CameraRig progress={anim} focus={focus} />
      <Studio progress={anim} dark={dark} />
      <Backdrop background={background} dark={dark} />
      <Desk dark={dark} />
      <DeskProps />
      <Monitor progress={anim} reg={reg} dark={dark} />
      <Phone progress={anim} reg={reg} dark={dark} />
      <ChatHolograms progress={anim} reg={reg} />
      <Pipeline progress={anim} registry={registry} reg={reg} />
      <Cloud progress={anim} reg={reg} />
      <ServerRoom progress={anim} reg={reg} />
      <Tracker progress={progress} registry={registry} track={track} />
      <Effects progress={progress} registry={registry} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Camera, lens & light                                                 */
/* ------------------------------------------------------------------ */

function CameraRig({ progress, focus }: { progress: MotionValue<number>; focus: MutableRefObject<THREE.Vector3> }) {
  const { camera, size } = useThree();
  const pos = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    sampleCamera(progress.get(), pos, look);
    // Portrait screens: step back so the subject still fits the frame.
    const aspect = size.width / size.height;
    if (aspect < 1.25)
      pos
        .sub(look)
        .multiplyScalar(THREE.MathUtils.lerp(1.8, 1, seg(aspect, 0.5, 1.25)))
        .add(look);
    // Gentle hand-held drift + pointer parallax.
    const t = state.clock.elapsedTime;
    pos.x += state.pointer.x * 0.22 + Math.sin(t * 0.35) * 0.04;
    pos.y += state.pointer.y * 0.12 + Math.sin(t * 0.5) * 0.025;
    const k = 1 - Math.pow(0.002, dt);
    camera.position.lerp(pos, k);
    focus.current.lerp(look, k);
    camera.lookAt(focus.current);
  });
  return null;
}

/**
 * Focus is pulled onto the *actual* subject object (its live world position), chosen by
 * where we are in the animation — so whatever the tools are tracked to is always sharp.
 * Background props stay softly out of focus.
 */
/** The objects that belong to each category — kept sharp while that category is active. */
const SUBJECTS: string[][] = [
  ["monitor"], // frontend
  ["phone"], // mobile
  ["phone", "chat"], // ai
  ["phone"], // backend (the exploded layers live inside the phone group)
  ["pipe", "cloud", "layer3"], // cloud & devops
  [...Array.from({ length: 12 }, (_, i) => `rack${i}`), "cloud"], // data (cloud fades out of focus above the racks)
];

/**
 * Selective focus instead of a depth-based lens: the current category's objects are pin-sharp,
 * everything else gets a soft Gaussian blur. Between categories the blur eases away and back
 * as the subject hands over.
 */
function Effects({ progress, registry }: { progress: MotionValue<number>; registry: Registry }) {
  const { scene, camera } = useThree();
  const focus = useMemo(() => new SubjectFocusEffect(scene, camera), [scene, camera]);
  const current = useRef<THREE.Object3D[]>([]);
  useEffect(() => () => focus.dispose(), [focus]);

  useFrame(() => {
    const p = Math.min(1, Math.max(0, progress.get()));
    let i = Math.min(N - 1, Math.floor(p * N));
    let t = 0;
    if (i < N - 1 && p > (i + 1) / N - EDGE) t = smooth((p - ((i + 1) / N - EDGE)) / (2 * EDGE));
    else if (i > 0 && p < i / N + EDGE) {
      i -= 1;
      t = smooth((p - (i + 1) / N + EDGE) / (2 * EDGE));
    }
    const keys = SUBJECTS[t < 0.5 ? i : Math.min(N - 1, i + 1)]!;
    const next = keys.map((k) => registry[k]).filter(Boolean) as THREE.Object3D[];
    const same = next.length === current.current.length && next.every((o, k) => o === current.current[k]);
    if (!same) {
      current.current.forEach((o) => o.traverse((c) => c.layers.disable(SUBJECT_LAYER)));
      // Glow/halo planes (userData.noFocus) are light, not surfaces — keep them out of the sharp cut-out.
      next.forEach((o) => o.traverse((c) => !c.userData.noFocus && c.layers.enable(SUBJECT_LAYER)));
      current.current = next;
    }
    // First category: start with the whole desk sharp, then blur the surroundings as you scroll in.
    const intro = i === 0 && t === 0 ? smooth(Math.min(1, p / (0.75 * (1 / N - EDGE)))) : 1;
    focus.strength = (1 - Math.sin(Math.PI * t)) * intro;
    // Data: racks sharp, streams progressively blurrier as they rise to the cloud.
    focus.falloff = (t < 0.5 ? i : i + 1) === N - 1 ? { from: RACK_TOP - 0.2, to: RACK_TOP + 1.1 } : null;
  });

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <N8AO halfRes aoRadius={0.6} intensity={2.2} distanceFalloff={0.6} color="#1e293b" />
      <primitive object={focus} />
      <Bloom mipmapBlur intensity={0.75} luminanceThreshold={1.02} luminanceSmoothing={0.15} radius={0.7} />
      <SMAA />
    </EffectComposer>
  );
}

function Studio({ progress, dark }: { progress: MotionValue<number>; dark: boolean }) {
  const glow = useRef<THREE.PointLight>(null);
  useFrame(() => {
    const p = progress.get();
    if (glow.current) glow.current.intensity = ss(p, 0.6, 0.66) * (1 - ss(p, 0.83, 0.88)) * 5;
  });
  return (
    <>
      <ambientLight intensity={dark ? 0.15 : 0.25} />
      {/* key light */}
      <directionalLight
        castShadow
        position={[3.5, 7.5, 4.5]}
        intensity={dark ? 1.6 : 2.2}
        color="#fffaf3"
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.025}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-far={25}
      />
      {/* cool fill + rim */}
      <directionalLight position={[-6, 3, 3]} intensity={0.45} color="#e0f2fe" />
      <directionalLight position={[0, 4, -6]} intensity={0.6} color="#ffffff" />
      <pointLight ref={glow} position={[0, 1.6, 1]} color="#2dd4bf" distance={3.5} intensity={0} />
      {/* neutral studio reflections — softboxes only, no tinted cards */}
      <Environment resolution={512} frames={1} environmentIntensity={dark ? 0.45 : 1}>
        <Lightformer form="rect" intensity={3} position={[0, 6, 1]} rotation-x={Math.PI / 2} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={1.6} position={[-6, 2.5, 3]} rotation-y={Math.PI / 2.4} scale={[3, 5, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[6, 2.5, 3]} rotation-y={-Math.PI / 2.4} scale={[3, 5, 1]} />
        <Lightformer form="rect" intensity={0.8} position={[0, 2, 8]} scale={[10, 2, 1]} />
        <Lightformer form="rect" intensity={0.5} position={[0, 2, -8]} rotation-y={Math.PI} scale={[10, 3, 1]} />
      </Environment>
    </>
  );
}

/** Infinite studio floor that dissolves into the page background. */
function Backdrop({ background, dark }: { background: string; dark: boolean }) {
  return (
    <group position={[0, FLOOR, -3]}>
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[120, 120]} />
        <meshBasicMaterial color={background} toneMapped={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <shadowMaterial opacity={dark ? 0.45 : 0.18} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Desk & props                                                         */
/* ------------------------------------------------------------------ */

const graphite = { color: "#2a2f37", metalness: 0.6, roughness: 0.42 } as const;

function Desk({ dark }: { dark: boolean }) {
  const wood = useMemo(() => woodTexture(dark), [dark]);
  const legs: [number, number][] = [
    [-2.45, -0.85],
    [2.45, -0.85],
    [-2.45, 0.95],
    [2.45, 0.95],
  ];
  return (
    <group>
      <RoundedBox
        args={[5.2, 0.07, 2.2]}
        radius={0.025}
        smoothness={4}
        position={[0, -0.035, 0.05]}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial map={wood} roughness={0.55} clearcoat={0.25} clearcoatRoughness={0.6} />
      </RoundedBox>
      {legs.map(([x, z], i) => (
        <mesh key={i} position={[x, (FLOOR - 0.07) / 2, z]} castShadow>
          <boxGeometry args={[0.05, -FLOOR - 0.07, 0.05]} />
          <meshStandardMaterial {...graphite} />
        </mesh>
      ))}
      {/* felt desk mat */}
      <RoundedBox args={[3.1, 0.008, 1.0]} radius={0.004} position={[0, 0.004, 0.55]} receiveShadow>
        <meshStandardMaterial color={dark ? "#1f2937" : "#d9dde3"} roughness={1} />
      </RoundedBox>
    </group>
  );
}

function DeskProps() {
  return (
    <group>
      <Keyboard />
      <Mouse />
      <Mug />
      <Plant />
      <Lamp />
      <Notebook />
      <PenCup />
      <Coaster />
      <MonitorCable />
      {/* phone stand */}
      <group position={[1.75, 0, 0.25]} rotation-y={-0.35}>
        <mesh position={[0, 0.012, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.42, 0.024, 0.3]} />
          <meshStandardMaterial {...graphite} />
        </mesh>
        <mesh position={[0, 0.2, -0.06]} rotation-x={-0.35} castShadow>
          <boxGeometry args={[0.36, 0.42, 0.02]} />
          <meshStandardMaterial {...graphite} />
        </mesh>
      </group>
    </group>
  );
}

function Keyboard() {
  const dark = useDark();
  const keys = useRef<THREE.InstancedMesh>(null);
  const keycap = useMemo(() => new RoundedBoxGeometry(0.084, 0.022, 0.08, 3, 0.012), []);
  const cols = 15;
  const rows = 5;
  useEffect(() => {
    const m = new THREE.Matrix4();
    let i = 0;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        m.makeTranslation(-0.7 + c * 0.1, 0.042, 0.4 + r * 0.092);
        keys.current!.setMatrixAt(i++, m);
      }
    keys.current!.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <group>
      <RoundedBox args={[1.54, 0.032, 0.52]} radius={0.014} position={[0, 0.016, 0.585]} castShadow receiveShadow>
        <meshPhysicalMaterial color={dark ? "#3a3f47" : "#cfd4db"} metalness={0.9} roughness={0.3} />
      </RoundedBox>
      <instancedMesh ref={keys} args={[keycap, undefined, rows * cols]} castShadow receiveShadow>
        <meshStandardMaterial color={dark ? "#1f2329" : "#f5f6f8"} roughness={0.55} />
      </instancedMesh>
    </group>
  );
}

function Mouse() {
  const dark = useDark();
  return (
    <mesh position={[1.08, 0.0, 0.6]} scale={[0.1, 0.035, 0.17]} castShadow>
      <sphereGeometry args={[1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshPhysicalMaterial color={dark ? "#24282e" : "#f8fafc"} roughness={0.35} clearcoat={0.6} />
    </mesh>
  );
}

function Mug() {
  const dark = useDark();
  const ceramic = (
    <meshPhysicalMaterial
      color={dark ? "#2b3038" : "#f4f4f2"}
      roughness={0.6}
      clearcoat={0.3}
      side={THREE.DoubleSide}
    />
  );
  return (
    <group position={[-1.42, 0.008, 0.42]} rotation-y={0.6}>
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.13, 0.125, 0.3, 48, 1, true]} />
        {ceramic}
      </mesh>
      <mesh position={[0, 0.005, 0]} castShadow>
        <cylinderGeometry args={[0.125, 0.125, 0.01, 48]} />
        {ceramic}
      </mesh>
      <mesh position={[0, 0.26, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.125, 48]} />
        <meshPhysicalMaterial color="#2b1a10" roughness={0.15} clearcoat={1} />
      </mesh>
      <mesh position={[0.135, 0.16, 0]} rotation-z={Math.PI / 2} castShadow>
        <torusGeometry args={[0.065, 0.016, 16, 32, Math.PI]} />
        {ceramic}
      </mesh>
    </group>
  );
}

function Plant() {
  const leaves = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        ry: (i / 16) * Math.PI * 2 + (i % 3) * 0.2,
        rx: 0.25 + (i % 4) * 0.14,
        s: 0.75 + ((i * 37) % 10) / 22,
      })),
    [],
  );
  return (
    <group position={[-2.15, 0, -0.5]}>
      <mesh position={[0, 0.19, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.16, 0.38, 48]} />
        <meshStandardMaterial color="#a8a29e" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.37, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.185, 32]} />
        <meshStandardMaterial color="#3f3326" roughness={1} />
      </mesh>
      {leaves.map((l, i) => (
        <group key={i} position={[0, 0.36, 0]} rotation={[0, l.ry, 0]}>
          <mesh rotation={[l.rx, 0, 0]} position={[0, 0.2 * l.s, 0.05]} scale={[0.045, 0.24 * l.s, 0.012]} castShadow>
            <sphereGeometry args={[1, 16, 12]} />
            <meshStandardMaterial color={i % 3 ? "#4f7a5a" : "#6b9472"} roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Lamp() {
  const mat = <meshStandardMaterial color="#1f2328" roughness={0.45} metalness={0.4} />;
  return (
    <group position={[2.2, 0, -0.62]} rotation-y={-0.7}>
      <mesh position={[0, 0.015, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.17, 0.18, 0.03, 48]} />
        {mat}
      </mesh>
      <mesh position={[0, 0.5, 0]} rotation-z={0.12} castShadow>
        <cylinderGeometry args={[0.014, 0.014, 0.98, 16]} />
        {mat}
      </mesh>
      <mesh position={[-0.3, 1.04, 0]} rotation-z={1.3} castShadow>
        <cylinderGeometry args={[0.013, 0.013, 0.56, 16]} />
        {mat}
      </mesh>
      <group position={[-0.56, 1.0, 0]} rotation-z={0.85}>
        <mesh castShadow>
          <coneGeometry args={[0.12, 0.2, 48, 1, true]} />
          <meshStandardMaterial color="#1f2328" roughness={0.45} metalness={0.4} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.07, 0]}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshBasicMaterial color={[2.2, 1.9, 1.4]} toneMapped={false} />
        </mesh>
        <pointLight position={[0, -0.14, 0]} color="#ffe2b8" intensity={1.6} distance={2.2} decay={2} />
      </group>
    </group>
  );
}

function PenCup() {
  const pens: [number, number, number, string][] = [
    [0.03, 0.02, 0.18, "#0f172a"],
    [-0.035, 0.015, -0.12, "#2dd4bf"],
    [0.0, -0.035, 0.08, "#f8fafc"],
  ];
  return (
    <group position={[-1.12, 0, -0.32]}>
      <mesh position={[0, 0.11, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.075, 0.07, 0.22, 40, 1, true]} />
        <meshStandardMaterial color="#2a2f37" metalness={0.6} roughness={0.42} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.004, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.008, 40]} />
        <meshStandardMaterial color="#2a2f37" metalness={0.6} roughness={0.42} />
      </mesh>
      {pens.map(([x, z, tilt, color], i) => (
        <mesh key={i} position={[x, 0.2, z]} rotation={[tilt, 0, tilt * 0.6]} castShadow>
          <cylinderGeometry args={[0.009, 0.009, 0.34, 12]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function Coaster() {
  return (
    <mesh position={[-1.42, 0.004, 0.42]} receiveShadow castShadow>
      <cylinderGeometry args={[0.17, 0.17, 0.008, 48]} />
      <meshStandardMaterial color="#b08b62" roughness={0.95} />
    </mesh>
  );
}

function MonitorCable() {
  const dark = useDark();
  const geo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      v3(0.05, 0.6, -0.72),
      v3(0.12, 0.25, -0.78),
      v3(0.22, 0.02, -0.82),
      v3(0.9, 0.01, -0.95),
    ]);
    return new THREE.TubeGeometry(curve, 48, 0.012, 8, false);
  }, []);
  return (
    <mesh geometry={geo} castShadow>
      <meshStandardMaterial color={dark ? "#1f2329" : "#e5e7eb"} roughness={0.6} />
    </mesh>
  );
}

function Notebook() {
  const dark = useDark();
  return (
    <group position={[-1.9, 0, 0.7]} rotation-y={0.3}>
      <RoundedBox args={[0.5, 0.03, 0.68]} radius={0.01} position={[0, 0.015, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={dark ? "#3b3631" : "#e7e3dc"} roughness={0.85} />
      </RoundedBox>
      <mesh position={[0.32, 0.01, 0.05]} rotation={[Math.PI / 2, 0, 0.1]} castShadow>
        <cylinderGeometry args={[0.009, 0.009, 0.55, 16]} />
        <meshStandardMaterial {...graphite} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Monitor                                                              */
/* ------------------------------------------------------------------ */

const SCREEN_W = 2.4;
const SCREEN_H = 1.35;

function Monitor({ progress, reg, dark }: { progress: MotionValue<number>; reg: Reg; dark: boolean }) {
  const siteScale = useScreenScale(SCREEN_W, 4.45, 1280);
  const site = useMemo(() => websiteTexture(dark, siteScale), [dark, siteScale]);
  const visible = SCREEN_H / SCREEN_W / site.ratio;
  useEffect(() => {
    site.texture.repeat.set(1, visible);
    site.texture.offset.set(0, 1 - visible);
  }, [site, visible]);
  useFrame(() => {
    const s = ss(progress.get(), 0.01, 0.12) * 0.55;
    site.texture.offset.y = 1 - visible - s * (1 - visible);
  });

  const alu = (
    <meshPhysicalMaterial color={dark ? "#4a4f57" : "#c9ced6"} metalness={0.92} roughness={0.27} clearcoat={0.2} />
  );
  return (
    <group ref={reg("monitor")} position={[0, 0, -0.55]}>
      <RoundedBox args={[2.5, 1.46, 0.04]} radius={0.03} smoothness={4} position={[0, 1.4, -0.005]} castShadow>
        {alu}
      </RoundedBox>
      <mesh position={[0, 1.4, 0.0155]}>
        <planeGeometry args={[2.47, 1.43]} />
        <meshPhysicalMaterial color="#05070a" roughness={0.05} clearcoat={1} />
      </mesh>
      <mesh position={[0, 1.4, 0.016]}>
        <planeGeometry args={[SCREEN_W, SCREEN_H]} />
        <meshBasicMaterial map={site.texture} toneMapped={false} />
      </mesh>
      {/* stand */}
      <mesh position={[0, 0.42, -0.14]} rotation-x={-0.14} castShadow>
        <boxGeometry args={[0.3, 0.86, 0.022]} />
        {alu}
      </mesh>
      <RoundedBox args={[0.62, 0.012, 0.42]} radius={0.006} position={[0, 0.006, -0.08]} castShadow receiveShadow>
        {alu}
      </RoundedBox>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Phone + exploded layers                                              */
/* ------------------------------------------------------------------ */

const PH_W = 0.52;
const PH_H = 1.06;
const REST = { pos: v3(1.75, 0.6, 0.22), rot: new THREE.Euler(-0.35, -0.35, 0) };
const FLOAT = { pos: v3(0, 1.45, 0.9), rot: new THREE.Euler(0, 0, 0) };
const ISO = { pos: v3(0, 1.5, 0.9), rot: new THREE.Euler(-1.1, 0, 0.5) };

/** Rounded-rectangle plane with 0–1 UVs, so screens follow the device's rounded corners. */
function roundedPlane(w: number, h: number, r: number) {
  const x = -w / 2;
  const y = -h / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  const geo = new THREE.ShapeGeometry(shape, 12);
  const pos = geo.attributes.position!;
  const uv = geo.attributes.uv!;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - x) / w, (pos.getY(i) - y) / h);
  uv.needsUpdate = true;
  return geo;
}

/** Remap 0–1 UVs into an inset region of the texture (for canvases with a transparent margin). */
function insetUv(geo: THREE.BufferGeometry, mx: number, my: number) {
  const uv = geo.attributes.uv!;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, mx + uv.getX(i) * (1 - 2 * mx), my + uv.getY(i) * (1 - 2 * my));
  uv.needsUpdate = true;
  return geo;
}

let _radial: THREE.Texture | null = null;
function radialAlpha() {
  if (_radial) return _radial;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "#fff");
  g.addColorStop(1, "#000");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  _radial = new THREE.CanvasTexture(c);
  return _radial;
}

function Phone({ progress, reg, dark }: { progress: MotionValue<number>; reg: Reg; dark: boolean }) {
  const group = useRef<THREE.Group | null>(null);
  const body = useRef<THREE.Group>(null);
  const screen = useRef<THREE.MeshBasicMaterial>(null);
  const layers = useRef<(THREE.Group | null)[]>([]);
  const glow = useRef<THREE.MeshBasicMaterial>(null);

  const phoneScale = useScreenScale(PH_W * 0.9, 2.95, 600);
  const mobile = useMemo(() => mobileSiteTexture(dark, phoneScale), [dark, phoneScale]);
  const chats = useMemo(() => chatTextures(dark, phoneScale), [dark, phoneScale]);
  const ui = useMemo(() => uiLayerTexture(dark), [dark]);
  const code = useMemo(() => codeLayerTexture(), []);
  const pcb = useMemo(() => circuitTexture(), []);
  const visible = PH_H / PH_W / mobile.ratio;
  useEffect(() => {
    mobile.texture.repeat.set(1, visible);
  }, [mobile, visible]);

  const qa = useMemo(() => new THREE.Quaternion(), []);
  const qb = useMemo(() => new THREE.Quaternion(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const p = progress.get();
    const g = group.current;
    if (!g) return;
    const time = state.clock.elapsedTime;

    const lift = ss(p, 0.14, 0.25);
    const iso = ss(p, 0.5, 0.58);
    tmp.lerpVectors(REST.pos, FLOAT.pos, lift);
    tmp.y += Math.sin(lift * Math.PI) * 0.35;
    tmp.lerp(ISO.pos, iso);
    tmp.y += Math.sin(time * 1.1) * 0.02 * lift;
    g.position.copy(tmp);
    qa.setFromEuler(REST.rot);
    qb.setFromEuler(FLOAT.rot);
    qa.slerp(qb, lift);
    qb.setFromEuler(ISO.rot);
    qa.slerp(qb, iso);
    g.quaternion.copy(qa);
    g.rotateY(Math.sin(time * 0.5) * 0.05 * lift * (1 - iso) - ss(p, 0.3, 0.42) * 0.14 * (1 - iso));

    const scroll = ss(p, 0.24, 0.31);
    mobile.texture.offset.y = 1 - visible - scroll * 0.42 * (1 - visible);
    const step = p < 0.355 ? 0 : p < 0.405 ? 1 : p < 0.44 ? 2 : p < 0.47 ? 3 : 4;
    const map = p < 0.33 ? mobile.texture : p < 0.53 ? chats[step]! : ui;
    if (screen.current && screen.current.map !== map) {
      screen.current.map = map;
      screen.current.needsUpdate = true;
    }

    const exploded = p > 0.555 && p < 0.88;
    body.current!.visible = !exploded;
    const e = ss(p, 0.56, 0.64);
    const away = ss(p, 0.66, 0.71);
    const offsets = [0.8, 0.28, -0.26, -0.78];
    layers.current.forEach((l, i) => {
      if (!l) return;
      l.visible = exploded && (i === 3 || away < 1);
      l.position.z = offsets[i]! * e + (i < 3 ? away * (0.8 + i * 0.3) : 0);
      const s = i < 3 ? 1 - away : 1 - ss(p, 0.83, 0.88);
      l.scale.setScalar(Math.max(0.001, s));
    });
    if (glow.current) glow.current.opacity = ss(p, 0.6, 0.66) * 0.85;
  });

  const layerGeo = useMemo(() => roundedPlane(PH_W * 0.96, PH_H * 0.96, 0.05), []);
  const glassGeo = useMemo(() => roundedPlane(PH_W * 0.955, PH_H * 0.97, 0.058), []);
  const screenGeo = useMemo(() => roundedPlane(PH_W * 0.9, PH_H * 0.935, 0.05), []);
  const islandGeo = useMemo(() => roundedPlane(0.12, 0.032, 0.016), []);
  const setLayer = (i: number) => (el: THREE.Group | null) => {
    layers.current[i] = el;
    reg(`layer${i}`)(el);
  };

  return (
    <group
      ref={(el) => {
        group.current = el;
        reg("phone")(el);
      }}
    >
      <group ref={body}>
        <RoundedBox args={[PH_W, PH_H, 0.042]} radius={0.065} smoothness={6} castShadow>
          <meshPhysicalMaterial color="#3a3f47" metalness={0.9} roughness={0.32} clearcoat={0.4} />
        </RoundedBox>
        <mesh position={[0, 0, 0.0215]} geometry={glassGeo}>
          <meshPhysicalMaterial color="#020305" roughness={0.04} clearcoat={1} />
        </mesh>
        <mesh position={[0, 0, 0.022]} geometry={screenGeo}>
          <meshBasicMaterial ref={screen} map={mobile.texture} toneMapped={false} />
        </mesh>
        <mesh position={[0, PH_H * 0.432, 0.0222]} geometry={islandGeo}>
          <meshBasicMaterial color="#000" />
        </mesh>
        <RoundedBox args={[0.19, 0.19, 0.016]} radius={0.04} position={[-0.11, 0.39, -0.028]}>
          <meshPhysicalMaterial color="#30343b" metalness={0.9} roughness={0.25} />
        </RoundedBox>
      </group>

      <group ref={setLayer(0)} visible={false}>
        <RoundedBox args={[PH_W, PH_H, 0.018]} radius={0.05} castShadow>
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </RoundedBox>
        <mesh position={[0, 0, 0.01]} geometry={layerGeo}>
          <meshBasicMaterial map={ui} toneMapped={false} />
        </mesh>
      </group>
      <group ref={setLayer(1)} visible={false}>
        <RoundedBox args={[PH_W, PH_H, 0.018]} radius={0.05}>
          <meshPhysicalMaterial color="#e6fffb" roughness={0.04} transmission={0.95} thickness={0.25} ior={1.5} />
        </RoundedBox>
      </group>
      <group ref={setLayer(2)} visible={false}>
        <RoundedBox args={[PH_W, PH_H, 0.018]} radius={0.05} castShadow>
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </RoundedBox>
        <mesh position={[0, 0, 0.01]} geometry={layerGeo}>
          <meshBasicMaterial map={code} toneMapped={false} />
        </mesh>
      </group>
      <group ref={setLayer(3)} visible={false}>
        <RoundedBox args={[PH_W, PH_H, 0.028]} radius={0.05} castShadow>
          <meshStandardMaterial color="#0b2f36" roughness={0.45} metalness={0.3} />
        </RoundedBox>
        <mesh position={[0, 0, 0.015]} geometry={layerGeo}>
          <meshBasicMaterial map={pcb} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, 0.02]} userData={{ noFocus: true }}>
          <planeGeometry args={[PH_W * 1.5, PH_H * 1.2]} />
          <meshBasicMaterial
            ref={glow}
            color={[0.4, 2.4, 2.1]}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            alphaMap={radialAlpha()}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Chat holograms                                                       */
/* ------------------------------------------------------------------ */

function hologramTexture(lines: string[], mine: boolean, code = false, dark = false) {
  const c = document.createElement("canvas");
  c.width = 640;
  c.height = 80 + lines.length * 60;
  const ctx = c.getContext("2d")!;
  ctx.beginPath();
  ctx.roundRect(4, 4, c.width - 8, c.height - 8, 36);
  if (code) ctx.fillStyle = "rgba(15,23,42,0.94)";
  else if (mine) {
    const g = ctx.createLinearGradient(0, 0, c.width, 0);
    g.addColorStop(0, "#2dd4bf");
    g.addColorStop(1, "#38bdf8");
    ctx.fillStyle = g;
  } else ctx.fillStyle = dark ? "rgba(30,41,59,0.96)" : "rgba(255,255,255,0.96)";
  ctx.fill();
  ctx.font = code ? `500 34px Consolas, monospace` : `500 38px "Poppins", "Segoe UI", sans-serif`;
  lines.forEach((l, i) => {
    ctx.fillStyle = code ? ["#7dd3fc", "#5eead4", "#fde68a"][i % 3]! : mine ? "#fff" : dark ? "#e2e8f0" : "#1e293b";
    ctx.fillText(l, 40, 80 + i * 60);
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return { t, aspect: c.height / c.width };
}

function ChatHolograms({ progress, reg }: { progress: MotionValue<number>; reg: Reg }) {
  const dark = useDark();
  const items = useMemo(
    () => [
      { ...hologramTexture(["Why does our app", "feel slow?"], true), at: 0.36, pos: v3(0.6, 1.85, 1.1), w: 0.58 },
      {
        ...hologramTexture(["Found 2 slow queries on", "every page load — fixed."], false, false, dark),
        at: 0.41,
        pos: v3(-0.68, 1.62, 1.12),
        w: 0.68,
      },
      {
        ...hologramTexture(["const data = await cache", '  .get("dashboard")', "  ?? db.query(summary);"], false, true),
        at: 0.44,
        pos: v3(-0.6, 1.08, 1.15),
        w: 0.64,
      },
      { ...hologramTexture(["Perfect, ship it 🚀"], true), at: 0.47, pos: v3(0.58, 1.05, 1.12), w: 0.5 },
    ],
    [dark],
  );
  const geos = useMemo(
    () =>
      items.map((it) => {
        const k = it.w / 640; // world units per canvas px
        const w = it.w - 8 * k;
        const h = it.w * it.aspect - 8 * k;
        return insetUv(roundedPlane(w, h, 36 * k), 4 / 640, (4 * k) / (it.w * it.aspect));
      }),
    [items],
  );

  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((state) => {
    const p = progress.get();
    const out = ss(p, 0.5, 0.54);
    items.forEach((it, i) => {
      const m = refs.current[i];
      if (!m) return;
      const t = ss(p, it.at, it.at + 0.02) * (1 - out);
      m.visible = t > 0.001;
      m.scale.setScalar(Math.max(0.001, t));
      m.position.set(
        it.pos.x,
        it.pos.y + Math.sin(state.clock.elapsedTime * 1.2 + i) * 0.015,
        it.pos.z - (1 - t) * 0.3,
      );
      m.lookAt(state.camera.position);
    });
  });
  return (
    <group ref={reg("chat")}>
      {items.map((it, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          visible={false}
        >
          <primitive object={geos[i]!} attach="geometry" />
          <meshBasicMaterial map={it.t} transparent alphaTest={0.5} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Cloud & DevOps — glass cloud fed by a Build → Test → Deploy pipeline */
/* ------------------------------------------------------------------ */

const CLOUD_B = v3(0, 2.5, -8.6);
const PIPE_H = 1.7;
/** Live base of the pipeline (on the backend board); shared with the cloud. */
const PIPE_BASE = new THREE.Vector3(0, 0.8, 0.55);
const pipeVisible = (p: number) => ss(p, 0.68, 0.75) * (1 - ss(p, 0.83, 0.86));

function gateLabel(text: string, dark = false) {
  const c = document.createElement("canvas");
  c.width = 320;
  c.height = 96;
  const ctx = c.getContext("2d")!;
  ctx.beginPath();
  ctx.roundRect(4, 4, 312, 88, 44);
  ctx.fillStyle = dark ? "rgba(30,41,59,0.97)" : "rgba(255,255,255,0.97)";
  ctx.fill();
  ctx.strokeStyle = "rgba(20,184,166,0.55)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(52, 48, 18, 0, Math.PI * 2);
  ctx.fillStyle = "#10b981";
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(43, 49);
  ctx.lineTo(50, 56);
  ctx.lineTo(62, 42);
  ctx.stroke();
  ctx.font = `600 38px "Poppins", "Segoe UI", sans-serif`;
  ctx.fillStyle = dark ? "#e2e8f0" : "#0f172a";
  ctx.fillText(text, 88, 62);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function Pipeline({ progress, registry, reg }: { progress: MotionValue<number>; registry: Registry; reg: Reg }) {
  const group = useRef<THREE.Group | null>(null);
  const gates = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const labels = useRef<(THREE.Mesh | null)[]>([]);
  const boxes = useRef<(THREE.Mesh | null)[]>([]);
  const dark = useDark();
  const textures = useMemo(() => ["Build", "Test", "Deploy"].map((t) => gateLabel(t, dark)), [dark]);
  const labelGeo = useMemo(() => insetUv(roundedPlane(0.4 * (312 / 320), 0.12 * (88 / 96), 0.4 * (44 / 320)), 4 / 320, 4 / 96), []);
  const teal = useMemo(() => new THREE.Color(0.15, 1.15, 1.1), []);
  const green = useMemo(() => new THREE.Color(0.35, 2.2, 0.8), []);
  const lift = useMemo(() => new THREE.Vector3(0, 0.04, 0), []);
  const COUNT = 5;

  useFrame((state) => {
    const board = registry.layer3;
    if (board) board.getWorldPosition(PIPE_BASE);
    const g = group.current;
    if (!g) return;
    const v = pipeVisible(progress.get());
    g.visible = v > 0.001;
    if (!g.visible) return;
    g.position.copy(PIPE_BASE).add(lift);
    g.scale.set(1, Math.max(0.001, v), 1);
    const t = state.clock.elapsedTime;
    const ys: number[] = [];
    boxes.current.forEach((b, k) => {
      if (!b) return;
      const u = (t * 0.2 + k / COUNT) % 1;
      const y = u * (PIPE_H + 0.15);
      ys.push(y);
      b.position.set(0, y, 0);
      b.rotation.set(0.4, t * 0.8 + k, 0.2);
      b.scale.setScalar(Math.max(0.001, Math.sin(Math.PI * Math.min(1, u * 1.15)) * v));
    });
    [0.25, 0.5, 0.75].forEach((f, i) => {
      const m = gates.current[i];
      const near = ys.some((y) => Math.abs(y - f * PIPE_H) < 0.07);
      if (m) m.color.lerp(near ? green : teal, near ? 0.5 : 0.08);
      const l = labels.current[i];
      if (l) l.lookAt(state.camera.position);
    });
  });

  return (
    <group
      ref={(el) => {
        group.current = el;
        reg("pipe")(el);
      }}
      visible={false}
    >
      {/* glass conduit with a glowing core line */}
      <mesh position={[0, PIPE_H / 2, 0]}>
        <cylinderGeometry args={[0.075, 0.075, PIPE_H, 40, 1, true]} />
        <meshPhysicalMaterial color="#ecfeff" roughness={0.08} transmission={1} thickness={0.2} ior={1.3} />
      </mesh>
      <mesh position={[0, PIPE_H / 2, 0]}>
        <cylinderGeometry args={[0.006, 0.006, PIPE_H, 8]} />
        <meshBasicMaterial color={[0.15, 1.2, 1.15]} toneMapped={false} />
      </mesh>
      {/* Build · Test · Deploy gates */}
      {[0.25, 0.5, 0.75].map((f, i) => (
        <group key={f} position={[0, f * PIPE_H, 0]}>
          <mesh rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.19, 0.011, 16, 64]} />
            <meshBasicMaterial
              ref={(el) => {
                gates.current[i] = el;
              }}
              color={[0.15, 1.15, 1.1]}
              toneMapped={false}
            />
          </mesh>
          <mesh rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.24, 0.006, 12, 64]} />
            <meshPhysicalMaterial color="#cbd5e1" metalness={0.9} roughness={0.25} />
          </mesh>
          <mesh
            ref={(el) => {
              labels.current[i] = el;
            }}
            position={[i % 2 ? -0.52 : 0.52, 0, 0]}
          >
            <primitive object={labelGeo} attach="geometry" />
            <meshBasicMaterial map={textures[i]} transparent alphaTest={0.5} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {/* containers riding up the pipeline */}
      {Array.from({ length: COUNT }).map((_, k) => (
        <RoundedBox
          key={k}
          ref={(el: THREE.Mesh | null) => {
            boxes.current[k] = el;
          }}
          args={[0.085, 0.085, 0.085]}
          radius={0.014}
          castShadow
        >
          <meshPhysicalMaterial
            color={k % 2 ? "#38bdf8" : "#2dd4bf"}
            roughness={0.2}
            clearcoat={1}
            emissive={k % 2 ? "#0ea5e9" : "#14b8a6"}
            emissiveIntensity={0.35}
          />
        </RoundedBox>
      ))}
    </group>
  );
}

/** Cloud silhouette (union of bumps + flat base), traced as a smooth outline. */
function cloudOutline(samples = 220) {
  const circles: [number, number, number][] = [
    [0.97, 0.0, 0.35],
    [0.42, 0.24, 0.5],
    [-0.3, 0.14, 0.42],
    [-0.95, -0.02, 0.33],
  ];
  const inside = (x: number, y: number) =>
    (Math.abs(x) <= 0.97 && y >= -0.35 && y <= 0.0) ||
    circles.some(([cx, cy, r]) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r);
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i < samples; i++) {
    const a = (i / samples) * Math.PI * 2;
    let r = 0;
    for (let s = 0; s < 2.2; s += 0.002) if (inside(Math.cos(a) * s, Math.sin(a) * s)) r = s;
    pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
  }
  return pts;
}

/** A sculpted 3D cloud icon: bevelled body, glowing rim, upload glyph and an orbiting network ring. */
function Cloud({ progress, reg }: { progress: MotionValue<number>; reg: Reg }) {
  const dark = useDark();
  const g = useRef<THREE.Group | null>(null);
  const ring = useRef<THREE.Group | null>(null);
  const dots = useRef<(THREE.Mesh | null)[]>([]);
  const start = useMemo(() => new THREE.Vector3(), []);
  const above = useMemo(() => new THREE.Vector3(0, PIPE_H + 0.38, 0), []);

  const { body, rim } = useMemo(() => {
    const pts = cloudOutline();
    const shape = new THREE.Shape(pts);
    const body = new THREE.ExtrudeGeometry(shape, {
      depth: 0.26,
      bevelEnabled: true,
      bevelThickness: 0.11,
      bevelSize: 0.1,
      bevelSegments: 12,
      steps: 1,
    });
    body.center();
    body.computeVertexNormals();
    const front = pts.map((p) => new THREE.Vector3(p.x * 1.0, p.y * 1.0 - 0.2, 0.245));
    const rim = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(front, true), 260, 0.011, 8, true);
    return { body, rim };
  }, []);

  useFrame((state) => {
    const p = progress.get();
    const s = ss(p, 0.7, 0.77);
    const grp = g.current;
    if (!grp) return;
    grp.visible = s > 0.001;
    if (!grp.visible) return;
    const t = state.clock.elapsedTime;
    start.copy(PIPE_BASE).add(above);
    grp.position.lerpVectors(start, CLOUD_B, ss(p, 0.84, 0.92));
    grp.position.y += Math.sin(t * 0.7) * 0.03;
    grp.rotation.y = Math.sin(t * 0.35) * 0.12;
    grp.scale.setScalar(Math.max(0.001, s) * 0.55);
    if (ring.current) ring.current.rotation.y = t * 0.35;
    dots.current.forEach((d, i) => {
      if (!d) return;
      const a = t * 0.5 + (i / dots.current.length) * Math.PI * 2;
      d.position.set(Math.cos(a) * 1.55, Math.sin(a * 2) * 0.05, Math.sin(a) * 0.55);
    });
  });

  return (
    <group
      ref={(el) => {
        g.current = el;
        reg("cloud")(el);
      }}
      visible={false}
    >
      <mesh geometry={body} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={dark ? "#1b2636" : "#ffffff"}
          roughness={dark ? 0.32 : 0.38}
          clearcoat={1}
          clearcoatRoughness={0.2}
          sheen={1}
          sheenColor={dark ? "#2dd4bf" : "#ccfbf1"}
          sheenRoughness={0.5}
          emissive={dark ? "#0b3b3a" : "#e6fffb"}
          emissiveIntensity={dark ? 0.6 : 0.15}
        />
      </mesh>
      {/* glowing rim on the front face */}
      <mesh geometry={rim}>
        <meshBasicMaterial color={[0.2, 1.6, 1.5]} toneMapped={false} />
      </mesh>
      {/* upload glyph */}
      <group position={[0, -0.05, 0.25]}>
        <mesh position={[0, -0.06, 0]}>
          <boxGeometry args={[0.07, 0.26, 0.02]} />
          <meshBasicMaterial color={[0.25, 1.8, 1.7]} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <coneGeometry args={[0.13, 0.15, 3]} />
          <meshBasicMaterial color={[0.25, 1.8, 1.7]} toneMapped={false} />
        </mesh>
      </group>
      {/* orbiting network ring with nodes */}
      <group ref={ring} rotation-x={0.12}>
        <mesh scale={[1, 1, 0.355]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[1.55, 0.006, 8, 160]} />
          <meshBasicMaterial color={[0.2, 1.0, 1.1]} toneMapped={false} transparent opacity={0.7} />
        </mesh>
      </group>
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            dots.current[i] = el;
          }}
        >
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshBasicMaterial color={i % 2 ? [0.4, 1.6, 2.6] : [0.3, 2.2, 1.9]} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

const RACKS: { x: number; z: number; side: 1 | -1 }[] = [];
for (let i = 0; i < 6; i++) {
  RACKS.push({ x: -1.15, z: -6.6 - i * 0.95, side: 1 });
  RACKS.push({ x: 1.15, z: -6.6 - i * 0.95, side: -1 });
}
const RACK_TOP = FLOOR + 2.3;

/* ------------------------------------------------------------------ */
/* Server room — its own space behind the desk                          */
/* ------------------------------------------------------------------ */

function ServerRoom({ progress, reg }: { progress: MotionValue<number>; reg: Reg }) {
  const front = useMemo(() => rackTexture(), []);
  const refs = useRef<(THREE.Group | null)[]>([]);
  const leds = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const lanes = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  useFrame((state) => {
    const p = progress.get();
    RACKS.forEach((_, i) => {
      const g = refs.current[i];
      if (!g) return;
      const t = ss(p, 0.84 + (i >> 1) * 0.01, 0.9 + (i >> 1) * 0.01);
      g.visible = t > 0.001;
      g.scale.set(1, Math.max(0.001, t), 1);
      const m = leds.current[i];
      if (m) m.emissiveIntensity = 1.6 + Math.sin(state.clock.elapsedTime * 2.5 + i * 1.7) * 0.6;
    });
    lanes.current.forEach((l) => {
      if (l) l.opacity = ss(p, 0.86, 0.94);
    });
  });

  return (
    <group>
      {RACKS.map((r, i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el;
            reg(`rack${i}`)(el);
          }}
          position={[r.x, FLOOR, r.z]}
          visible={false}
        >
          <RoundedBox args={[0.72, 2.3, 0.88]} radius={0.02} position={[0, 1.15, 0]} castShadow receiveShadow>
            <meshPhysicalMaterial color="#1c2129" metalness={0.75} roughness={0.38} clearcoat={0.3} />
          </RoundedBox>
          <mesh position={[r.side * 0.37, 1.15, 0.36]} castShadow>
            <boxGeometry args={[0.02, 0.5, 0.025]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.25} />
          </mesh>
          <mesh position={[0, 2.31, 0]}>
            <boxGeometry args={[0.6, 0.012, 0.7]} />
            <meshStandardMaterial color="#0b0f14" roughness={0.8} />
          </mesh>
          {/* glass door over the LED panel */}
          <mesh position={[r.side * 0.362, 1.15, 0]} rotation-y={(r.side * Math.PI) / 2}>
            <planeGeometry args={[0.8, 2.15]} />
            <meshStandardMaterial
              ref={(el) => {
                leds.current[i] = el;
              }}
              map={front}
              emissiveMap={front}
              emissive="#ffffff"
              emissiveIntensity={1.6}
              roughness={0.15}
              metalness={0.2}
            />
          </mesh>
        </group>
      ))}
      {/* glowing aisle strips */}
      {[-0.6, 0.6].map((x, k) => (
        <mesh key={x} position={[x, FLOOR + 0.004, -8.9]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.03, 6.2]} />
          <meshBasicMaterial
            ref={(el) => {
              lanes.current[k] = el;
            }}
            color={[0.3, 1.6, 1.5]}
            toneMapped={false}
            transparent
            opacity={0}
          />
        </mesh>
      ))}
    </group>
  );
}

"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const PRIMARY = new THREE.Color("#2DD4BF");
const SECONDARY = new THREE.Color("#38BDF8");
const TERTIARY = new THREE.Color("#FB7185");

/* ------------------------------------------------------------------ */
/* Shared GLSL: breathing + click shockwave displacement               */
/* ------------------------------------------------------------------ */
const DISPLACE = /* glsl */ `
  uniform float uTime;
  uniform float uPulseAge;
  uniform float uPulseStrength;
  vec3 displace(vec3 p) {
    float r = length(p);
    vec3 n = normalize(p);
    float breathe = sin(uTime * 1.3 + p.y * 2.2 + p.x * 1.4) * 0.035;
    float wave = uPulseStrength * sin(r * 5.0 - uPulseAge * 9.0) * exp(-uPulseAge * 1.6);
    return p + n * (breathe + wave * 0.22);
  }
`;

const pointsVertex = /* glsl */ `
  ${DISPLACE}
  attribute float aSize;
  attribute vec3 aColor;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vDepth;
  void main() {
    vec4 mv = modelViewMatrix * vec4(displace(position), 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * (9.0 / -mv.z);
    vColor = aColor;
    vDepth = smoothstep(7.5, 3.5, -mv.z);
  }
`;

const pointsFragment = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vDepth;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float core = smoothstep(0.5, 0.0, d);
    float glow = pow(core, 2.2);
    gl_FragColor = vec4(vColor, (glow * 0.9 + core * 0.15) * uOpacity * (0.35 + 0.65 * vDepth));
  }
`;

const linesVertex = /* glsl */ `
  ${DISPLACE}
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vDepth;
  void main() {
    vec4 mv = modelViewMatrix * vec4(displace(position), 1.0);
    gl_Position = projectionMatrix * mv;
    vColor = aColor;
    vDepth = smoothstep(7.5, 3.5, -mv.z);
  }
`;

const linesFragment = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vDepth;
  void main() {
    gl_FragColor = vec4(vColor, uOpacity * (0.25 + 0.75 * vDepth));
  }
`;

const fresnelVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vY;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    vY = normal.y;
    gl_Position = projectionMatrix * mv;
  }
`;

const fresnelFragment = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uTime;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vY;
  void main() {
    float f = pow(1.0 - max(dot(vNormal, vView), 0.0), 2.4);
    vec3 col = mix(uColorA, uColorB, vY * 0.5 + 0.5 + sin(uTime) * 0.15);
    gl_FragColor = vec4(col, (f * 0.95 + 0.06) * uIntensity);
  }
`;

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */
function fibonacciSphere(count: number, radius: number) {
  const pts: THREE.Vector3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    // Small jitter → organic, less "perfect" look.
    const jitter = 1 + (Math.sin(i * 12.9898) * 43758.5453 % 1) * 0.08;
    pts.push(new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(radius * jitter));
  }
  return pts;
}

function useNetwork(count: number, radius: number) {
  return useMemo(() => {
    const nodes = fibonacciSphere(count, radius);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const c = new THREE.Color();

    nodes.forEach((p, i) => {
      positions.set([p.x, p.y, p.z], i * 3);
      const t = (p.y / radius + 1) / 2;
      c.copy(PRIMARY).lerp(SECONDARY, t);
      if (i % 37 === 0) c.copy(TERTIARY); // sparse accent "neurons"
      colors.set([c.r, c.g, c.b], i * 3);
      sizes[i] = i % 37 === 0 ? 11 : 3.5 + ((i * 7) % 5);
    });

    // Connect each node to its nearest neighbours.
    const edges: [number, number][] = [];
    const seen = new Set<string>();
    const maxDist = radius * 0.42;
    for (let i = 0; i < count; i++) {
      const dists: { j: number; d: number }[] = [];
      for (let j = 0; j < count; j++) {
        if (i === j) continue;
        const d = nodes[i]!.distanceTo(nodes[j]!);
        if (d < maxDist) dists.push({ j, d });
      }
      dists.sort((a, b) => a.d - b.d);
      for (const { j } of dists.slice(0, 3)) {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (!seen.has(key)) {
          seen.add(key);
          edges.push([i, j]);
        }
      }
    }

    const linePositions = new Float32Array(edges.length * 6);
    const lineColors = new Float32Array(edges.length * 6);
    edges.forEach(([a, b], k) => {
      linePositions.set([...nodes[a]!.toArray(), ...nodes[b]!.toArray()], k * 6);
      lineColors.set([colors[a * 3]!, colors[a * 3 + 1]!, colors[a * 3 + 2]!, colors[b * 3]!, colors[b * 3 + 1]!, colors[b * 3 + 2]!], k * 6);
    });

    return { nodes, positions, colors, sizes, edges, linePositions, lineColors };
  }, [count, radius]);
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */
type Interaction = {
  dragging: boolean;
  lastX: number;
  lastY: number;
  velX: number;
  velY: number;
  pulseAt: number;
  hover: boolean;
};

function Network({ dark, interaction }: { dark: boolean; interaction: React.MutableRefObject<Interaction> }) {
  const group = useRef<THREE.Group>(null);
  const spinner = useRef<THREE.Group>(null);
  const icosa = useRef<THREE.LineSegments>(null);
  const rings = useRef<THREE.Group>(null);
  const pulsesRef = useRef<THREE.Points>(null);
  const { gl } = useThree();
  const net = useNetwork(520, 1.7);

  const blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPulseAge: { value: 10 },
      uPulseStrength: { value: 0 },
      uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) },
      uOpacity: { value: 1 },
    }),
    [gl],
  );
  const lineUniforms = useMemo(
    () => ({
      uTime: uniforms.uTime,
      uPulseAge: uniforms.uPulseAge,
      uPulseStrength: uniforms.uPulseStrength,
      uOpacity: { value: dark ? 0.32 : 0.38 },
    }),
    [uniforms, dark],
  );
  const coreUniforms = useMemo(
    () => ({
      uColorA: { value: PRIMARY },
      uColorB: { value: SECONDARY },
      uTime: uniforms.uTime,
      uIntensity: { value: dark ? 1 : 0.85 },
    }),
    [uniforms, dark],
  );

  // Signal pulses travelling along random edges.
  const PULSES = 36;
  const pulseState = useMemo(
    () =>
      Array.from({ length: PULSES }, () => ({
        edge: Math.floor(Math.random() * net.edges.length),
        t: Math.random(),
        speed: 0.35 + Math.random() * 0.6,
      })),
    [net.edges.length],
  );
  const pulsePositions = useMemo(() => new Float32Array(PULSES * 3), []);
  const pulseSizes = useMemo(() => new Float32Array(PULSES).fill(9), []);
  const pulseColors = useMemo(() => {
    const arr = new Float32Array(PULSES * 3);
    for (let i = 0; i < PULSES; i++) arr.set(dark ? [1, 1, 1] : [SECONDARY.r, SECONDARY.g, SECONDARY.b], i * 3);
    return arr;
  }, [dark]);

  const icosaGeometry = useMemo(() => new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.72, 1)), []);
  useEffect(() => () => icosaGeometry.dispose(), [icosaGeometry]);

  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const it = interaction.current;
    uniforms.uTime.value += dt;

    // Click shockwave
    const age = (performance.now() - it.pulseAt) / 1000;
    uniforms.uPulseAge.value = age;
    uniforms.uPulseStrength.value = age < 4 ? 1 : 0;

    // Drag inertia + idle auto-rotation
    if (!it.dragging) {
      it.velX *= 0.95;
      it.velY *= 0.95;
    }
    const idle = it.hover ? 0.32 : 0.14;
    if (spinner.current) {
      spinner.current.rotation.y += dt * idle + it.velX;
      spinner.current.rotation.x = THREE.MathUtils.clamp(spinner.current.rotation.x + it.velY, -1, 1);
    }

    // Lean towards the pointer
    if (group.current && !it.dragging) {
      const tx = state.pointer.y * -0.25;
      const ty = state.pointer.x * 0.35;
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, tx, 0.05);
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, ty, 0.05);
    }

    if (icosa.current) {
      icosa.current.rotation.x -= dt * 0.35;
      icosa.current.rotation.y -= dt * 0.5;
    }
    if (rings.current) {
      rings.current.children.forEach((r, i) => {
        r.rotation.z += dt * (i % 2 ? -0.25 : 0.18);
      });
    }

    // Advance pulses
    for (let i = 0; i < PULSES; i++) {
      const p = pulseState[i]!;
      p.t += dt * p.speed * (it.hover ? 1.8 : 1);
      if (p.t > 1) {
        p.t = 0;
        p.edge = Math.floor(Math.random() * net.edges.length);
      }
      const [a, b] = net.edges[p.edge]!;
      tmp.copy(net.nodes[a]!).lerp(net.nodes[b]!, p.t);
      pulsePositions.set([tmp.x, tmp.y, tmp.z], i * 3);
    }
    if (pulsesRef.current) {
      pulsesRef.current.geometry.attributes.position!.needsUpdate = true;
    }
  });

  return (
    <group ref={group}>
      <group ref={spinner}>
        {/* Synapses */}
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[net.linePositions, 3]} />
            <bufferAttribute attach="attributes-aColor" args={[net.lineColors, 3]} />
          </bufferGeometry>
          <shaderMaterial
            key={`lines-${dark}`}
            vertexShader={linesVertex}
            fragmentShader={linesFragment}
            uniforms={lineUniforms}
            transparent
            depthWrite={false}
            blending={blending}
          />
        </lineSegments>

        {/* Neurons */}
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[net.positions, 3]} />
            <bufferAttribute attach="attributes-aColor" args={[net.colors, 3]} />
            <bufferAttribute attach="attributes-aSize" args={[net.sizes, 1]} />
          </bufferGeometry>
          <shaderMaterial
            key={`points-${dark}`}
            vertexShader={pointsVertex}
            fragmentShader={pointsFragment}
            uniforms={uniforms}
            transparent
            depthWrite={false}
            blending={blending}
          />
        </points>

        {/* Travelling signals */}
        <points ref={pulsesRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[pulsePositions, 3]} />
            <bufferAttribute attach="attributes-aColor" args={[pulseColors, 3]} />
            <bufferAttribute attach="attributes-aSize" args={[pulseSizes, 1]} />
          </bufferGeometry>
          <shaderMaterial
            key={`pulses-${dark}`}
            vertexShader={pointsVertex}
            fragmentShader={pointsFragment}
            uniforms={uniforms}
            transparent
            depthWrite={false}
            blending={blending}
          />
        </points>
      </group>

      {/* Inner core */}
      <mesh>
        <sphereGeometry args={[0.62, 48, 48]} />
        <shaderMaterial
          key={`core-${dark}`}
          vertexShader={fresnelVertex}
          fragmentShader={fresnelFragment}
          uniforms={coreUniforms}
          transparent
          depthWrite={false}
          blending={blending}
        />
      </mesh>
      <lineSegments ref={icosa} geometry={icosaGeometry}>
        <lineBasicMaterial color={dark ? "#5EEAD4" : "#0D9488"} transparent opacity={dark ? 0.55 : 0.45} />
      </lineSegments>

      {/* Orbit rings */}
      <group ref={rings}>
        {[
          { r: 2.15, rot: [1.2, 0.2, 0], color: PRIMARY },
          { r: 2.35, rot: [1.75, -0.5, 0.3], color: SECONDARY },
          { r: 2.55, rot: [0.6, 0.9, 0], color: dark ? PRIMARY : SECONDARY },
        ].map((ring, i) => (
          <mesh key={i} rotation={ring.rot as [number, number, number]}>
            <torusGeometry args={[ring.r, 0.006, 8, 160]} />
            <meshBasicMaterial color={ring.color} transparent opacity={dark ? 0.45 : 0.55} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Canvas wrapper with pointer interaction + visibility gating         */
/* ------------------------------------------------------------------ */
export default function NeuralCore({ dark, active }: { dark: boolean; active: boolean }) {
  const interaction = useRef<Interaction>({
    dragging: false,
    lastX: 0,
    lastY: 0,
    velX: 0,
    velY: 0,
    pulseAt: -1e6,
    hover: false,
  });
  const downAt = useRef({ x: 0, y: 0 });

  return (
    <div
      className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing"
      onPointerEnter={() => (interaction.current.hover = true)}
      onPointerLeave={() => {
        interaction.current.hover = false;
        interaction.current.dragging = false;
      }}
      onPointerDown={(e) => {
        const it = interaction.current;
        it.dragging = true;
        it.lastX = e.clientX;
        it.lastY = e.clientY;
        downAt.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerMove={(e) => {
        const it = interaction.current;
        if (!it.dragging) return;
        it.velX = (e.clientX - it.lastX) * 0.0045;
        it.velY = (e.clientY - it.lastY) * 0.0035;
        it.lastX = e.clientX;
        it.lastY = e.clientY;
      }}
      onPointerUp={(e) => {
        const it = interaction.current;
        it.dragging = false;
        // A click (not a drag) fires a shockwave through the network.
        if (Math.hypot(e.clientX - downAt.current.x, e.clientY - downAt.current.y) < 6) {
          it.pulseAt = performance.now();
        }
      }}
    >
      <Canvas
        frameloop={active ? "always" : "never"}
        dpr={[1, 1.75]}
        // Far enough back that the outer orbit ring (r 2.55) stays inside the
        // square canvas at any rotation: worst-case projected extent ≈ 2.73 vs a
        // visible half-height of ≈ 2.98 at z = 7.2 with fov 45.
        camera={{ position: [0, 0, 7.2], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
      >
        <Network dark={dark} interaction={interaction} />
      </Canvas>
    </div>
  );
}

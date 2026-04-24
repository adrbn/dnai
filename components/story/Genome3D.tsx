"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { locusToHelix } from "@/lib/story/chromosomes";

export interface CameraPose {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

export interface HighlightPoint {
  chr: string;
  pos: number;
  color: string;
  intensity: number;
  id: string;
}

interface Genome3DProps {
  pose: CameraPose;
  highlights: HighlightPoint[];
  focusChromosome?: string;
  mode: "helix" | "genome";
  reducedMotion?: boolean;
}

const HELIX_N = 180;
const HELIX_Y_HALF = 10;
const HELIX_TURNS = 5;
const STRAND_RADIUS = 1.2;
// Static cosmetic tilt of the whole helix group (radians).
const HELIX_TILT_X = -0.18;
const HELIX_TILT_Z = 0.12;
// Shift the helix out of the center so the scrolling text panel on the right
// never occludes it. The camera still looks at the world origin, which pushes
// the helix into the left third of the viewport.
const HELIX_X_OFFSET = -5;
// Fade the top ~18% and bottom ~18% of the helix out so it looks infinite.
const FADE_MARGIN = 0.18;

interface BasePairData {
  t: number;
  y: number;
  theta: number;
  p1: [number, number, number];
  p2: [number, number, number];
  fade: number; // 0..1 — 1 in the middle, 0 at both ends
}

function fadeAt(t: number): number {
  // Smoothstep fade on both ends so the helix looks infinite.
  const d = Math.min(t, 1 - t);
  const x = Math.min(1, d / FADE_MARGIN);
  return x * x * (3 - 2 * x);
}

function buildPairs(): BasePairData[] {
  const arr: BasePairData[] = [];
  for (let i = 0; i < HELIX_N; i++) {
    const t = i / (HELIX_N - 1);
    const y = (0.5 - t) * 2 * HELIX_Y_HALF;
    const theta = t * Math.PI * 2 * HELIX_TURNS;
    arr.push({
      t,
      y,
      theta,
      p1: [Math.cos(theta) * STRAND_RADIUS, y, Math.sin(theta) * STRAND_RADIUS],
      p2: [Math.cos(theta + Math.PI) * STRAND_RADIUS, y, Math.sin(theta + Math.PI) * STRAND_RADIUS],
      fade: fadeAt(t),
    });
  }
  return arr;
}

// Distance from variant world point to pair world point (strand 1); pick closest of p1/p2.
function nearestPairIndex(pairs: BasePairData[], world: [number, number, number]): { index: number; strand: 0 | 1 } {
  let best = 0;
  let bestStrand: 0 | 1 = 0;
  let bestD = Infinity;
  for (let i = 0; i < pairs.length; i++) {
    for (let s = 0; s < 2; s++) {
      const p = s === 0 ? pairs[i].p1 : pairs[i].p2;
      const dx = p[0] - world[0];
      const dy = p[1] - world[1];
      const dz = p[2] - world[2];
      const d = dx * dx + dy * dy + dz * dz;
      if (d < bestD) {
        bestD = d;
        best = i;
        bestStrand = s as 0 | 1;
      }
    }
  }
  return { index: best, strand: bestStrand };
}

function Helix({
  reducedMotion,
  highlights,
  frozen,
  onHighlightWorld,
}: {
  reducedMotion?: boolean;
  highlights: HighlightPoint[];
  frozen: boolean;
  onHighlightWorld: (positions: THREE.Vector3[]) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const pairs = useMemo(() => buildPairs(), []);

  // Map each highlight to its nearest (pair index, strand)
  const highlightMap = useMemo(() => {
    return highlights
      .map((h) => {
        const w = locusToHelix(h.chr, h.pos);
        if (!w) return null;
        const { index, strand } = nearestPairIndex(pairs, w);
        return { h, index, strand };
      })
      .filter((x): x is { h: HighlightPoint; index: number; strand: 0 | 1 } => x !== null);
  }, [highlights, pairs]);

  // Per-sphere refs for tinting the GLOWING base-pair spheres
  const strand1Refs = useRef<(THREE.Mesh | null)[]>([]);
  const strand2Refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state, dt) => {
    // Keep the helix slowly rotating on itself even while the camera tracks a
    // highlighted variant — freezing it made the whole stage look broken.
    if (group.current && !reducedMotion) {
      const speed = frozen ? 0.06 : 0.12;
      group.current.rotation.y += dt * speed;
    }

    const time = state.clock.elapsedTime;
    const worldPoints: THREE.Vector3[] = [];

    for (const { h, index, strand } of highlightMap) {
      const pulse = 0.65 + 0.35 * Math.sin(time * 2.4 + index * 0.5);
      const mesh = (strand === 0 ? strand1Refs.current : strand2Refs.current)[index];
      if (!mesh) continue;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.color.set(h.color);
      mat.emissive.set(h.color);
      mat.emissiveIntensity = h.intensity * pulse * 2.8;
      mat.toneMapped = false;
      mesh.scale.setScalar(1.8 + 0.4 * pulse);

      // Compute world position of this glowing sphere (account for group rotation)
      const local = strand === 0 ? pairs[index].p1 : pairs[index].p2;
      const v = new THREE.Vector3(local[0], local[1], local[2]);
      if (group.current) v.applyMatrix4(group.current.matrixWorld);
      worldPoints.push(v);
    }

    onHighlightWorld(worldPoints);
  });

  // Build a set of (index, strand) that are highlighted so we skip default material application
  const highlightKeys = useMemo(() => {
    const s = new Set<string>();
    for (const hm of highlightMap) s.add(`${hm.index}-${hm.strand}`);
    return s;
  }, [highlightMap]);

  return (
    // Outer group holds the static cosmetic tilt + left offset; inner group does the Y-spin.
    <group position={[HELIX_X_OFFSET, 0, 0]} rotation={[HELIX_TILT_X, 0, HELIX_TILT_Z]}>
      <group ref={group}>
        {pairs.map((p, i) => {
          const hk1 = highlightKeys.has(`${i}-0`);
          const hk2 = highlightKeys.has(`${i}-1`);
          const fade = p.fade;
          const opacity = Math.max(0.04, fade);
          return (
            <group key={i}>
              <mesh
                position={p.p1}
                ref={(el) => {
                  strand1Refs.current[i] = el;
                }}
              >
                <sphereGeometry args={[0.1, 14, 14]} />
                <meshStandardMaterial
                  color={hk1 ? "#ffffff" : "#7c9cff"}
                  emissive={hk1 ? "#ffffff" : "#4f7dff"}
                  emissiveIntensity={hk1 ? 2.5 : 0.55 * fade}
                  roughness={0.3}
                  transparent
                  opacity={opacity}
                />
              </mesh>
              <mesh
                position={p.p2}
                ref={(el) => {
                  strand2Refs.current[i] = el;
                }}
              >
                <sphereGeometry args={[0.1, 14, 14]} />
                <meshStandardMaterial
                  color={hk2 ? "#ffffff" : "#c7b2ff"}
                  emissive={hk2 ? "#ffffff" : "#8b6fff"}
                  emissiveIntensity={hk2 ? 2.5 : 0.55 * fade}
                  roughness={0.3}
                  transparent
                  opacity={opacity}
                />
              </mesh>
              <BasePair a={p.p1} b={p.p2} fade={fade} />
            </group>
          );
        })}
      </group>
    </group>
  );
}

function BasePair({ a, b, fade = 1 }: { a: [number, number, number]; b: [number, number, number]; fade?: number }) {
  const mid: [number, number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const dz = b[2] - a[2];
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const q = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    const dir = new THREE.Vector3(dx, dy, dz).normalize();
    return new THREE.Quaternion().setFromUnitVectors(up, dir);
  }, [dx, dy, dz]);
  return (
    <mesh position={mid} quaternion={q}>
      <cylinderGeometry args={[0.03, 0.03, len, 6]} />
      <meshStandardMaterial
        color="#6b7280"
        emissive="#4f7dff"
        emissiveIntensity={0.08 * fade}
        transparent
        opacity={0.5 * Math.max(0.06, fade)}
      />
    </mesh>
  );
}

function CameraRig({
  pose,
  trackedRef,
  hasTracking,
}: {
  pose: CameraPose;
  trackedRef: React.MutableRefObject<THREE.Vector3 | null>;
  hasTracking: boolean;
}) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(...pose.target));
  const desiredPos = useRef(new THREE.Vector3(...pose.position));
  const desiredTarget = useRef(new THREE.Vector3(...pose.target));
  const desiredFov = useRef(pose.fov);

  useFrame((state, dt) => {
    const k = Math.min(1, dt * 2.2);

    if (hasTracking && trackedRef.current) {
      const tp = trackedRef.current;
      // Slow camera orbit around the tracked sphere
      const orbitT = state.clock.elapsedTime * 0.22;
      const radius = 5.2;
      desiredPos.current.set(
        tp.x + Math.cos(orbitT) * radius,
        tp.y + 1.4,
        tp.z + Math.sin(orbitT) * radius,
      );
      desiredTarget.current.copy(tp);
      desiredFov.current = 34;
    } else {
      desiredPos.current.set(pose.position[0], pose.position[1], pose.position[2]);
      desiredTarget.current.set(pose.target[0], pose.target[1], pose.target[2]);
      desiredFov.current = pose.fov;
    }

    camera.position.lerp(desiredPos.current, k);
    target.current.lerp(desiredTarget.current, k);
    camera.lookAt(target.current);
    const persp = camera as THREE.PerspectiveCamera;
    if (persp.isPerspectiveCamera) {
      persp.fov = THREE.MathUtils.lerp(persp.fov, desiredFov.current, k);
      persp.updateProjectionMatrix();
    }
  });
  return null;
}

function Scene({ pose, highlights, reducedMotion }: Genome3DProps) {
  const trackedRef = useRef<THREE.Vector3 | null>(null);
  const hasTracking = highlights.length > 0;

  const onHighlightWorld = (positions: THREE.Vector3[]) => {
    if (positions.length === 0) {
      trackedRef.current = null;
      return;
    }
    // Focus on the centroid so multiple loci all fit in frame
    const c = new THREE.Vector3();
    for (const p of positions) c.add(p);
    c.multiplyScalar(1 / positions.length);
    trackedRef.current = c;
  };

  return (
    <>
      <CameraRig pose={pose} trackedRef={trackedRef} hasTracking={hasTracking} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[8, 10, 5]} intensity={0.9} color="#eef2ff" />
      <directionalLight position={[-6, -4, -4]} intensity={0.3} color="#a0b4ff" />
      <Stars radius={60} depth={40} count={900} factor={2.6} saturation={0} fade speed={0.4} />
      <Helix
        reducedMotion={reducedMotion}
        highlights={highlights}
        frozen={hasTracking}
        onHighlightWorld={onHighlightWorld}
      />
      <fog attach="fog" args={["#05060c", 18, 48]} />
    </>
  );
}

export function Genome3D(props: Genome3DProps) {
  return (
    <Canvas
      className="!absolute inset-0"
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: props.pose.position, fov: props.pose.fov, near: 0.1, far: 200 }}
    >
      <color attach="background" args={["#05060c"]} />
      <Scene {...props} />
    </Canvas>
  );
}

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

function Helix({
  reducedMotion,
  highlights,
}: {
  reducedMotion?: boolean;
  highlights: HighlightPoint[];
}) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (group.current && !reducedMotion) {
      group.current.rotation.y += dt * 0.15;
    }
  });

  const pairs = useMemo(() => {
    const N = 36;
    const arr: { p1: [number, number, number]; p2: [number, number, number]; y: number }[] = [];
    for (let i = 0; i < N; i++) {
      const t = i / N;
      const y = (t - 0.5) * 12;
      const theta = t * Math.PI * 6;
      const r = 1.2;
      arr.push({
        p1: [Math.cos(theta) * r, y, Math.sin(theta) * r],
        p2: [Math.cos(theta + Math.PI) * r, y, Math.sin(theta + Math.PI) * r],
        y,
      });
    }
    return arr;
  }, []);

  return (
    <group ref={group}>
      {pairs.map((p, i) => (
        <group key={i}>
          <mesh position={p.p1}>
            <sphereGeometry args={[0.14, 12, 12]} />
            <meshStandardMaterial
              color="#7c9cff"
              emissive="#4f7dff"
              emissiveIntensity={0.6}
              roughness={0.3}
            />
          </mesh>
          <mesh position={p.p2}>
            <sphereGeometry args={[0.14, 12, 12]} />
            <meshStandardMaterial
              color="#c7b2ff"
              emissive="#8b6fff"
              emissiveIntensity={0.6}
              roughness={0.3}
            />
          </mesh>
          <BasePair a={p.p1} b={p.p2} />
        </group>
      ))}
      <HelixHighlights points={highlights} />
    </group>
  );
}

function HelixHighlights({ points }: { points: HighlightPoint[] }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    points.forEach((p, i) => {
      const m = refs.current[i];
      if (!m) return;
      const pulse = 0.7 + 0.3 * Math.sin(t * 2.2 + i * 0.8);
      (m.material as THREE.MeshStandardMaterial).emissiveIntensity = p.intensity * pulse * 2.2;
      m.scale.setScalar(1 + 0.25 * pulse);
    });
  });

  return (
    <>
      {points.map((p, i) => {
        const world = locusToHelix(p.chr, p.pos);
        if (!world) return null;
        return (
          <group key={p.id}>
            <mesh
              position={world}
              ref={(el) => {
                refs.current[i] = el;
              }}
            >
              <sphereGeometry args={[0.22, 16, 16]} />
              <meshStandardMaterial
                color={p.color}
                emissive={p.color}
                emissiveIntensity={p.intensity * 1.8}
                toneMapped={false}
              />
            </mesh>
            {/* halo glow */}
            <mesh position={world}>
              <sphereGeometry args={[0.55, 16, 16]} />
              <meshBasicMaterial color={p.color} transparent opacity={0.18} depthWrite={false} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

function BasePair({ a, b }: { a: [number, number, number]; b: [number, number, number] }) {
  const mid: [number, number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const dz = b[2] - a[2];
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const q = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    const dir = new THREE.Vector3(dx, dy, dz).normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
    return quat;
  }, [dx, dy, dz]);
  return (
    <mesh position={mid} quaternion={q}>
      <cylinderGeometry args={[0.035, 0.035, len, 6]} />
      <meshStandardMaterial
        color="#6b7280"
        emissive="#4f7dff"
        emissiveIntensity={0.08}
        transparent
        opacity={0.55}
      />
    </mesh>
  );
}

function CameraRig({ pose }: { pose: CameraPose }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(...pose.target));
  const desiredPos = useRef(new THREE.Vector3(...pose.position));
  const desiredTarget = useRef(new THREE.Vector3(...pose.target));
  const desiredFov = useRef(pose.fov);

  desiredPos.current.set(pose.position[0], pose.position[1], pose.position[2]);
  desiredTarget.current.set(pose.target[0], pose.target[1], pose.target[2]);
  desiredFov.current = pose.fov;

  useFrame((_, dt) => {
    const k = Math.min(1, dt * 2.2);
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
  return (
    <>
      <CameraRig pose={pose} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[8, 10, 5]} intensity={0.9} color="#eef2ff" />
      <directionalLight position={[-6, -4, -4]} intensity={0.3} color="#a0b4ff" />
      <Stars radius={60} depth={40} count={900} factor={2.6} saturation={0} fade speed={0.4} />
      <Helix reducedMotion={reducedMotion} highlights={highlights} />
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

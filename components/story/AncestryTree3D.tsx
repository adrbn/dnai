"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Text, Billboard } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { HaplogroupResult } from "@/lib/types";

// TMRCA estimates in kya — same table as HaplogroupTree (2D version).
const AGE_KYA: Record<string, number> = {
  BT: 130, CT: 88, F: 48, IJK: 45, K: 45, IJ: 42, I: 27,
  "I1-M253": 4.6, "I2-M438": 22, J: 32, "J1-M267": 18, "J2-M172": 25,
  NO: 35, "N-M231": 16, "O-M175": 30, P: 30, "Q-M242": 17, R: 27,
  "R1a-M420": 5.5, "R1b-M269": 6, E: 70, "E1b1b-M215": 22, "G-M201": 26,
  L: 180, M: 60, N: 60, H: 25, V: 15, T: 17, U: 46, W: 20,
  X: 30, A: 35, B: 50, C: 24, D: 48,
};

function ageFor(id: string): number | null {
  if (AGE_KYA[id] != null) return AGE_KYA[id];
  const short = id.split("-")[0];
  if (AGE_KYA[short] != null) return AGE_KYA[short];
  return null;
}

interface AncestryTree3DProps {
  hap: HaplogroupResult;
  kind: "y" | "mt";
  height?: number;
}

interface NodePoint {
  id: string;
  age: number; // kya, may be imputed
  position: [number, number, number];
}

/**
 * 3D ancestry tree — the user's Y or mt haplogroup path is rendered as a
 * gently-rotating spiral going from the deep-time root (top) to the modern
 * assigned branch (bottom). Each node is a glowing sphere labeled with its
 * ID + approximate age; neighboring nodes are connected with a translucent
 * tube so the walk through time reads as a continuous migration.
 */
export function AncestryTree3D({ hap, kind, height = 360 }: AncestryTree3DProps) {
  if (!hap.available || hap.path.length === 0) return null;

  const accent = kind === "y" ? "#8e2a23" : "#5c2d91";
  const accentSoft = kind === "y" ? "#d97a6c" : "#a289cf";

  return (
    <div
      className="mt-4 overflow-hidden rounded-sm border border-ink/10 bg-[#1a1613]"
      style={{ height }}
    >
      <div className="flex items-center justify-between px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-paper/60">
        <span>Arbre 3D · {kind === "y" ? "paternel" : "maternel"}</span>
        <span className="font-mono normal-case tracking-normal text-paper/40">
          racine → {hap.assigned}
        </span>
      </div>
      <div className="relative" style={{ height: height - 30 }}>
        <Canvas
          className="!absolute inset-0"
          dpr={[1, 1.75]}
          camera={{ position: [0, 0, 9], fov: 40, near: 0.1, far: 100 }}
          gl={{ antialias: true }}
        >
          <color attach="background" args={["#1a1613"]} />
          <ambientLight intensity={0.55} />
          <directionalLight position={[5, 8, 4]} intensity={0.9} color="#fff6ec" />
          <directionalLight position={[-4, -3, -2]} intensity={0.3} color="#b694ff" />
          <Scene path={hap.path.map((b) => b.id)} accent={accent} accentSoft={accentSoft} />
        </Canvas>
      </div>
    </div>
  );
}

function Scene({
  path,
  accent,
  accentSoft,
}: {
  path: string[];
  accent: string;
  accentSoft: string;
}) {
  const group = useRef<THREE.Group>(null);

  const nodes = useMemo<NodePoint[]>(() => {
    // Compute ages — impute monotonically for nodes we don't know, so the
    // spiral still flows root→present smoothly.
    const ages = path.map((id) => ageFor(id));
    const filled: number[] = [];
    // Forward fill from top (oldest) downward.
    let prevAge = ages.find((a) => a != null) ?? 120;
    for (let i = 0; i < path.length; i++) {
      const a = ages[i];
      if (a != null) {
        prevAge = a;
        filled.push(a);
      } else {
        // Unknown — nudge a bit toward present.
        prevAge = Math.max(0.5, prevAge * 0.78);
        filled.push(prevAge);
      }
    }

    const maxA = Math.max(...filled, 1);
    const minA = Math.min(...filled, 0);
    const n = path.length;
    return path.map((id, i) => {
      // Map age (high at top, 0 at bottom). Top y = +3.5, bottom y = -3.2.
      const t = (filled[i] - minA) / Math.max(0.01, maxA - minA);
      const y = -3.2 + t * 6.7;
      // Spiral angle so sequential nodes don't stack.
      const theta = (i / Math.max(1, n - 1)) * Math.PI * 1.6;
      const radius = 1.7 + 0.35 * Math.sin(i * 0.9);
      return {
        id,
        age: filled[i],
        position: [
          Math.cos(theta) * radius,
          y,
          Math.sin(theta) * radius,
        ] as [number, number, number],
      };
    }).reverse(); // reverse so first in array is oldest (top)
  }, [path]);

  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.18;
  });

  const lastIdx = nodes.length - 1;

  return (
    <group ref={group}>
      {nodes.map((n, i) => {
        const isAssigned = i === lastIdx;
        const color = isAssigned ? accent : accentSoft;
        return (
          <group key={n.id} position={n.position}>
            <mesh>
              <sphereGeometry args={[isAssigned ? 0.28 : 0.2, 22, 22]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={isAssigned ? 1.4 : 0.7}
                roughness={0.35}
                toneMapped={false}
              />
            </mesh>
            <Billboard>
              <Text
                position={[0, 0.55, 0]}
                fontSize={isAssigned ? 0.32 : 0.24}
                color={isAssigned ? "#fff1e6" : "#e7d7c8"}
                anchorX="center"
                anchorY="bottom"
                outlineWidth={0.02}
                outlineColor="#1a1613"
              >
                {n.id}
              </Text>
              <Text
                position={[0, 0.28, 0]}
                fontSize={0.16}
                color="#c8b9ab"
                anchorX="center"
                anchorY="bottom"
              >
                {formatAge(n.age)}
              </Text>
            </Billboard>
          </group>
        );
      })}

      {/* Edges between successive nodes */}
      {nodes.slice(1).map((n, i) => (
        <Edge key={`${nodes[i].id}-${n.id}`} a={nodes[i].position} b={n.position} color={accentSoft} />
      ))}
    </group>
  );
}

function Edge({
  a,
  b,
  color,
}: {
  a: [number, number, number];
  b: [number, number, number];
  color: string;
}) {
  const mid: [number, number, number] = [
    (a[0] + b[0]) / 2,
    (a[1] + b[1]) / 2,
    (a[2] + b[2]) / 2,
  ];
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
      <cylinderGeometry args={[0.03, 0.03, len, 8]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.35}
        transparent
        opacity={0.6}
        toneMapped={false}
      />
    </mesh>
  );
}

function formatAge(kya: number): string {
  if (kya >= 10) return `~${Math.round(kya)} kya`;
  return `~${kya.toFixed(1)} kya`;
}

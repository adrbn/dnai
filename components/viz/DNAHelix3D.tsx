"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface DNAHelix3DProps {
  rungs?: number;
}

const BASE_COLOR: Record<string, number> = {
  A: 0x78b4ff,
  T: 0xaa8cff,
  C: 0x78dca0,
  G: 0xecc45c,
};

const PAIRS: [string, string][] = [
  ["A", "T"],
  ["T", "A"],
  ["C", "G"],
  ["G", "C"],
];

export function DNAHelix3D({ rungs = 22 }: DNAHelix3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0, 9.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    // lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const l1 = new THREE.PointLight(0x78b4ff, 1.4, 40);
    l1.position.set(5, 6, 5);
    scene.add(l1);
    const l2 = new THREE.PointLight(0xaa8cff, 1.4, 40);
    l2.position.set(-5, -6, -5);
    scene.add(l2);
    const l3 = new THREE.PointLight(0xffffff, 0.6, 20);
    l3.position.set(0, 0, 6);
    scene.add(l3);

    // helix geometry
    const RADIUS = 1.6;
    const RISE = 0.34;
    const TURN_RUNGS = 10;
    const ANGLE_STEP = (Math.PI * 2) / TURN_RUNGS;

    const group = new THREE.Group();
    scene.add(group);

    const strandA: THREE.Vector3[] = [];
    const strandB: THREE.Vector3[] = [];

    for (let i = 0; i < rungs; i++) {
      const angle = i * ANGLE_STEP;
      const y = (i - (rungs - 1) / 2) * RISE;
      const a = new THREE.Vector3(Math.cos(angle) * RADIUS, y, Math.sin(angle) * RADIUS);
      const b = new THREE.Vector3(-Math.cos(angle) * RADIUS, y, -Math.sin(angle) * RADIUS);
      strandA.push(a);
      strandB.push(b);

      const pair = PAIRS[i % PAIRS.length];

      // rung (hydrogen bond)
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const dir = b.clone().sub(a);
      const len = dir.length();
      const rung = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, len, 8),
        new THREE.MeshStandardMaterial({
          color: 0x444a5a,
          emissive: 0x20242e,
          emissiveIntensity: 0.3,
          roughness: 0.8,
        }),
      );
      rung.position.copy(mid);
      rung.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      group.add(rung);

      // base spheres
      const mkSphere = (pos: THREE.Vector3, color: number) => {
        const m = new THREE.Mesh(
          new THREE.SphereGeometry(0.2, 20, 20),
          new THREE.MeshStandardMaterial({
            color,
            emissive: color,
            emissiveIntensity: 0.3,
            roughness: 0.25,
            metalness: 0.1,
          }),
        );
        m.position.copy(pos);
        group.add(m);
      };
      mkSphere(a, BASE_COLOR[pair[0]]);
      mkSphere(b, BASE_COLOR[pair[1]]);
    }

    // backbones
    const mkBackbone = (points: THREE.Vector3[], color: number, emissive: number) => {
      const curve = new THREE.CatmullRomCurve3(points);
      const geo = new THREE.TubeGeometry(curve, rungs * 4, 0.07, 10, false);
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive,
        emissiveIntensity: 0.55,
        roughness: 0.35,
        metalness: 0.35,
      });
      group.add(new THREE.Mesh(geo, mat));
    };
    mkBackbone(strandA, 0x78b4ff, 0x1a3a6a);
    mkBackbone(strandB, 0xaa8cff, 0x301a6a);

    // fit helix to camera frustum (recomputed in resize to respect aspect)
    const box = new THREE.Box3().setFromObject(group);
    const size = new THREE.Vector3();
    box.getSize(size);
    const HELIX_H = size.y;
    const HELIX_W = Math.max(size.x, size.z);

    // size handling
    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h, false);
      const aspect = w / h || 1;
      camera.aspect = aspect;
      const vFov = (camera.fov * Math.PI) / 180;
      const distH = HELIX_H / 2 / Math.tan(vFov / 2);
      const distW = HELIX_W / 2 / (Math.tan(vFov / 2) * aspect);
      camera.position.z = Math.max(distH, distW) * 1.12;
      camera.updateProjectionMatrix();
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    // interaction: drag to rotate
    let dragging = false;
    let lastX = 0;
    let velocity = 0;
    let autoRotate = true;

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      autoRotate = false;
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      group.rotation.y += dx * 0.008;
      velocity = dx * 0.008;
    };
    const onUp = (e: PointerEvent) => {
      dragging = false;
      renderer.domElement.releasePointerCapture(e.pointerId);
    };
    renderer.domElement.style.cursor = "grab";
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("pointercancel", onUp);

    let raf = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      const dt = clock.getDelta();
      if (autoRotate) {
        group.rotation.y += dt * 0.15;
      } else {
        group.rotation.y += velocity;
        velocity *= 0.93;
        if (Math.abs(velocity) < 0.0005 && !dragging) {
          // slowly resume auto-rotate after idle
          velocity = 0;
        }
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerup", onUp);
      renderer.domElement.removeEventListener("pointercancel", onUp);
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [rungs]);

  return <div ref={mountRef} className="absolute inset-0" />;
}

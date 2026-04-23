"use client";

import { useMemo } from "react";
import { CHROMOSOMES } from "@/lib/story/chromosomes";
import type { HighlightPoint } from "./Genome3D";

interface Genome2DProps {
  highlights: HighlightPoint[];
  focusChromosome?: string;
  mode: "helix" | "genome";
}

const VIEW_W = 360;
const VIEW_H = 520;
const CHR_PER_ROW = 6;
const MARGIN_X = 20;
const MARGIN_Y = 30;
const GAP_X = 14;
const GAP_Y = 34;

interface ChrBox {
  name: string;
  x: number;
  y: number;
  h: number;
  lengthMb: number;
  centromereMb: number;
}

function layout2D(): ChrBox[] {
  const rows = Math.ceil(CHROMOSOMES.length / CHR_PER_ROW);
  const colW = (VIEW_W - MARGIN_X * 2 - GAP_X * (CHR_PER_ROW - 1)) / CHR_PER_ROW;
  const rowH = (VIEW_H - MARGIN_Y * 2 - GAP_Y * (rows - 1)) / rows;
  const maxLen = Math.max(...CHROMOSOMES.map((c) => c.lengthMb));
  return CHROMOSOMES.map((info, i) => {
    const row = Math.floor(i / CHR_PER_ROW);
    const col = i % CHR_PER_ROW;
    const h = Math.max(16, (info.lengthMb / maxLen) * rowH);
    const x = MARGIN_X + col * (colW + GAP_X) + colW / 2;
    const y = MARGIN_Y + row * (rowH + GAP_Y) + (rowH - h) / 2;
    return { name: info.name, x, y, h, lengthMb: info.lengthMb, centromereMb: info.centromereMb };
  });
}

export function Genome2D({ highlights, focusChromosome, mode }: Genome2DProps) {
  const boxes = useMemo(() => layout2D(), []);
  const byName = useMemo(() => new Map(boxes.map((b) => [b.name, b])), [boxes]);

  if (mode === "helix") {
    return <Helix2D />;
  }

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id="g2d-glow">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.8} />
          <stop offset="60%" stopColor="currentColor" stopOpacity={0.2} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </radialGradient>
      </defs>

      {boxes.map((b) => {
        const focused = focusChromosome === b.name;
        const centroY = b.y + (b.centromereMb / b.lengthMb) * b.h;
        return (
          <g key={b.name} style={{ transition: "opacity .4s" }} opacity={focused ? 1 : 0.55}>
            <rect
              x={b.x - 4}
              y={b.y}
              width={8}
              height={b.h}
              rx={4}
              fill={focused ? "#8ba8ff" : "#3f4a66"}
              stroke={focused ? "#b8cbff" : "#2a3352"}
              strokeWidth={focused ? 1 : 0.5}
            />
            <circle cx={b.x} cy={centroY} r={2.2} fill="#0b0b10" />
            <text
              x={b.x}
              y={b.y + b.h + 12}
              textAnchor="middle"
              fontSize={9}
              fill={focused ? "#b8cbff" : "#7b88a8"}
              fontFamily="ui-sans-serif,system-ui"
            >
              {b.name}
            </text>
          </g>
        );
      })}

      {highlights.map((h) => {
        const b = byName.get(h.chr);
        if (!b) return null;
        const frac = Math.max(0, Math.min(1, h.pos / 1_000_000 / b.lengthMb));
        const cy = b.y + frac * b.h;
        return (
          <g key={h.id} style={{ color: h.color }}>
            <circle cx={b.x} cy={cy} r={12} fill="url(#g2d-glow)">
              <animate
                attributeName="r"
                values="10;16;10"
                dur="2.2s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx={b.x} cy={cy} r={3.5} fill={h.color} />
          </g>
        );
      })}
    </svg>
  );
}

function Helix2D() {
  const N = 28;
  const pairs = useMemo(() => {
    const arr: { y: number; x1: number; x2: number; r: number }[] = [];
    for (let i = 0; i < N; i++) {
      const t = i / N;
      const y = 40 + t * 440;
      const theta = t * Math.PI * 5;
      const r = 60;
      const x1 = 180 + Math.cos(theta) * r;
      const x2 = 180 + Math.cos(theta + Math.PI) * r;
      arr.push({ y, x1, x2, r });
    }
    return arr;
  }, []);

  return (
    <svg viewBox={`0 0 360 520`} className="h-full w-full">
      <defs>
        <linearGradient id="h2-a" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7c9cff" />
          <stop offset="100%" stopColor="#4f7dff" />
        </linearGradient>
        <linearGradient id="h2-b" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#c7b2ff" />
          <stop offset="100%" stopColor="#8b6fff" />
        </linearGradient>
      </defs>
      {pairs.map((p, i) => (
        <g key={i} opacity={0.9}>
          <line
            x1={p.x1}
            y1={p.y}
            x2={p.x2}
            y2={p.y}
            stroke="#4f7dff"
            strokeOpacity={0.35}
            strokeWidth={1.2}
          />
          <circle cx={p.x1} cy={p.y} r={4} fill="url(#h2-a)" />
          <circle cx={p.x2} cy={p.y} r={4} fill="url(#h2-b)" />
        </g>
      ))}
    </svg>
  );
}

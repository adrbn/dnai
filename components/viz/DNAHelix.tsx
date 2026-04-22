"use client";

import { useMemo } from "react";

interface DNAHelixProps {
  className?: string;
  rungs?: number;
}

const PAIRS: [string, string][] = [
  ["A", "T"],
  ["T", "A"],
  ["C", "G"],
  ["G", "C"],
];

const COLOR: Record<string, string> = {
  A: "rgb(120 180 255)",
  T: "rgb(170 140 255)",
  C: "rgb(120 220 160)",
  G: "rgb(236 196 92)",
};

export function DNAHelix({ className = "", rungs = 26 }: DNAHelixProps) {
  const items = useMemo(
    () => Array.from({ length: rungs }, (_, i) => ({ i, pair: PAIRS[i % PAIRS.length] })),
    [rungs],
  );

  return (
    <div className={`pointer-events-none relative ${className}`} aria-hidden>
      <svg viewBox="0 0 400 600" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="bkb1" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgb(120 180 255)" stopOpacity="0" />
            <stop offset="20%" stopColor="rgb(120 180 255)" stopOpacity="0.7" />
            <stop offset="80%" stopColor="rgb(170 140 255)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="rgb(170 140 255)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="bkb2" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgb(170 140 255)" stopOpacity="0" />
            <stop offset="20%" stopColor="rgb(170 140 255)" stopOpacity="0.7" />
            <stop offset="80%" stopColor="rgb(120 180 255)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="rgb(120 180 255)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g className="helix-spin">
          {items.map(({ i, pair }) => {
            const y = 30 + i * 21;
            const phase = (i / rungs) * Math.PI * 4;
            const dx = Math.sin(phase) * 80;
            const x1 = 200 - dx;
            const x2 = 200 + dx;
            const opacity = 0.4 + 0.6 * ((Math.cos(phase) + 1) / 2);
            return (
              <g key={i} style={{ opacity }}>
                <line
                  x1={x1}
                  y1={y}
                  x2={x2}
                  y2={y}
                  stroke="rgb(36 40 52)"
                  strokeWidth={1.2}
                />
                <circle cx={x1} cy={y} r={6} fill={COLOR[pair[0]]} />
                <circle cx={x2} cy={y} r={6} fill={COLOR[pair[1]]} />
              </g>
            );
          })}
        </g>

        {/* backbone curves */}
        <g className="helix-spin" opacity={0.6}>
          {items.slice(0, -1).map(({ i }) => {
            const y1 = 30 + i * 21;
            const y2 = 30 + (i + 1) * 21;
            const p1 = (i / rungs) * Math.PI * 4;
            const p2 = ((i + 1) / rungs) * Math.PI * 4;
            const x1a = 200 - Math.sin(p1) * 80;
            const x2a = 200 - Math.sin(p2) * 80;
            const x1b = 200 + Math.sin(p1) * 80;
            const x2b = 200 + Math.sin(p2) * 80;
            return (
              <g key={`bk-${i}`}>
                <line x1={x1a} y1={y1} x2={x2a} y2={y2} stroke="url(#bkb1)" strokeWidth={2} />
                <line x1={x1b} y1={y1} x2={x2b} y2={y2} stroke="url(#bkb2)" strokeWidth={2} />
              </g>
            );
          })}
        </g>
      </svg>

      <style jsx>{`
        .helix-spin {
          transform-origin: 200px 300px;
          animation: spin 14s linear infinite;
        }
        @keyframes spin {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(360deg); }
        }
      `}</style>
    </div>
  );
}

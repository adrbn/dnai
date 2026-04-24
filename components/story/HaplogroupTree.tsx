"use client";

import type { HaplogroupResult } from "@/lib/types";

// Approximate TMRCA (thousand years ago) for each branch we expose. Values
// are rounded from ISOGG/YFull (Y) and Phylotree (mt) estimates — good
// enough for a pedagogical timeline, not for forensic dating.
const AGE_KYA: Record<string, number> = {
  // Y
  BT: 130,
  CT: 88,
  F: 48,
  IJK: 45,
  K: 45,
  IJ: 42,
  I: 27,
  "I1-M253": 4.6,
  "I2-M438": 22,
  J: 32,
  "J1-M267": 18,
  "J2-M172": 25,
  NO: 35,
  "N-M231": 16,
  "O-M175": 30,
  P: 30,
  "Q-M242": 17,
  R: 27,
  "R1a-M420": 5.5,
  "R1b-M269": 6,
  E: 70,
  "E1b1b-M215": 22,
  "G-M201": 26,
  // mt
  L: 180,
  M: 60,
  N: 60,
  H: 25,
  V: 15,
  T: 17,
  U: 46,
  W: 20,
  X: 30,
  A: 35,
  B: 50,
  C: 24,
  D: 48,
};

function ageFor(id: string): number | null {
  if (AGE_KYA[id] != null) return AGE_KYA[id];
  const short = id.split("-")[0];
  if (AGE_KYA[short] != null) return AGE_KYA[short];
  return null;
}

function formatKya(k: number): string {
  if (k >= 10) return `~${Math.round(k)} kya`;
  return `~${k.toFixed(1)} kya`;
}

interface HaplogroupTreeProps {
  hap: HaplogroupResult;
  kind: "y" | "mt";
}

/**
 * Vertical mini-timeline for a Y or mt haplogroup: root → assigned branch.
 * Each node shows the label, its approximate TMRCA in kya, and a one-line
 * population description.
 */
export function HaplogroupTree({ hap, kind }: HaplogroupTreeProps) {
  if (!hap.available || hap.path.length === 0) return null;
  const nodes = hap.path;
  const assignedAge = ageFor(hap.assigned);

  return (
    <div className="mt-4 rounded-sm border border-ink/10 bg-paper/40 p-4">
      <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-ink/50">
        Votre arbre {kind === "y" ? "paternel" : "maternel"}
      </div>
      <ol className="relative space-y-3 pl-5">
        {/* vertical spine */}
        <div
          aria-hidden
          className="absolute left-[7px] top-1.5 bottom-1.5 w-px bg-gradient-to-b from-ink/25 via-ink/15 to-oxblood/40"
        />
        {nodes.map((branch, i) => {
          const age = ageFor(branch.id);
          const isLast = i === nodes.length - 1;
          return (
            <li key={branch.id} className="relative">
              <span
                aria-hidden
                className={`absolute -left-5 top-1 inline-block h-3 w-3 rounded-full border-2 ${
                  isLast
                    ? "border-oxblood bg-oxblood/20"
                    : "border-ink/30 bg-paper"
                }`}
              />
              <div className="flex items-baseline justify-between gap-3">
                <span
                  className={`font-mono text-[13px] ${
                    isLast ? "font-semibold text-oxblood" : "text-ink/80"
                  }`}
                >
                  {branch.id}
                </span>
                {age != null && (
                  <span className="shrink-0 font-mono text-[10px] tabular-nums text-ink/45">
                    {formatKya(age)}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-[11px] italic text-ink/55">
        De la racine {kind === "y" ? "Y-chromosome Adam" : "Eve mitochondriale"}{" "}
        {assignedAge != null ? `jusqu'à votre branche il y a ~${Math.round(assignedAge * 1000).toLocaleString("fr-FR")} ans.` : "jusqu'à votre branche actuelle."}
      </p>
    </div>
  );
}

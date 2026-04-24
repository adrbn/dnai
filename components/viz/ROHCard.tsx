"use client";

import type { ROHResult } from "@/lib/types";

interface Props {
  roh: ROHResult;
}

export function ROHCard({ roh }: Props) {
  const fPct = roh.fRoh * 100;
  const level =
    roh.fRoh < 0.0156
      ? {
          label: "Standard",
          tone: "ok",
          hint: "Valeur normale — rien à signaler. Aucun signe d'apparentement entre vos parents biologiques.",
        }
      : roh.fRoh < 0.03125
        ? {
            label: "Légèrement élevé",
            tone: "warn",
            hint: "Cousinage ancien possible. Fréquent dans les populations endogames (isolats géographiques, certaines communautés).",
          }
        : roh.fRoh < 0.0625
          ? {
              label: "Notable",
              tone: "warn",
              hint: "Équivalent à des cousins éloignés dans la généalogie — pas inhabituel selon les origines.",
            }
          : {
              label: "Élevé",
              tone: "danger",
              hint: "Compatible avec des parents apparentés au 1ᵉʳ ou 2ᵉ degré (cousins germains, oncle-nièce…).",
            };

  const toneBg =
    level.tone === "ok"
      ? "from-ok/20 via-ok/5"
      : level.tone === "warn"
        ? "from-warn/20 via-warn/5"
        : "from-danger/20 via-danger/5";
  const toneText =
    level.tone === "ok" ? "text-ok" : level.tone === "warn" ? "text-warn" : "text-danger";

  // Chromosome visualisation: horizontal bars with segment overlays
  const CHRS = Array.from({ length: 22 }, (_, i) => String(i + 1));
  const CHR_BP: Record<string, number> = {
    "1": 249250621, "2": 243199373, "3": 198022430, "4": 191154276, "5": 180915260,
    "6": 171115067, "7": 159138663, "8": 146364022, "9": 141213431, "10": 135534747,
    "11": 135006516, "12": 133851895, "13": 115169878, "14": 107349540, "15": 102531392,
    "16": 90354753, "17": 81195210, "18": 78077248, "19": 59128983, "20": 63025520,
    "21": 48129895, "22": 51304566,
  };
  const maxBp = Math.max(...Object.values(CHR_BP));

  return (
    <div className="space-y-4">
      <div className={`rounded-xl border border-border bg-gradient-to-br ${toneBg} to-transparent p-4`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-fg-muted">F_ROH</div>
            <div className={`text-3xl font-bold tabular-nums ${toneText}`}>
              {fPct.toFixed(3)}%
            </div>
            <div className="mt-0.5 text-xs text-fg">
              <span className={toneText}>{level.label}</span> · {level.hint}
            </div>
          </div>
          <div className="text-right text-xs text-fg-muted">
            <div>
              <span className="tabular-nums text-fg">{roh.totalSegments}</span> segments
            </div>
            <div>
              <span className="tabular-nums text-fg">
                {(roh.totalBp / 1e6).toFixed(1)}
              </span>{" "}
              Mb homozygotes
            </div>
            <div className="text-[10px] opacity-70">seuil 1 Mb / 30 SNPs</div>
          </div>
        </div>
      </div>

      <div className="space-y-0.5">
        {CHRS.map((chr) => {
          const bp = CHR_BP[chr];
          const segs = roh.segments.filter((s) => s.chr === chr);
          const pctWidth = (bp / maxBp) * 100;
          return (
            <div key={chr} className="flex items-center gap-2 text-[10px]">
              <div className="w-5 text-right font-mono text-fg-muted">{chr}</div>
              <div
                className="relative h-2.5 rounded-full bg-surface-2/60"
                style={{ width: `${pctWidth}%` }}
              >
                {segs.map((s, i) => (
                  <div
                    key={i}
                    className="absolute inset-y-0 rounded-full bg-warn/70"
                    style={{
                      left: `${(s.startPos / bp) * 100}%`,
                      width: `${Math.max(0.3, ((s.endPos - s.startPos) / bp) * 100)}%`,
                    }}
                    title={`chr${chr}:${s.startPos.toLocaleString("fr-FR")}-${s.endPos.toLocaleString("fr-FR")} (${(s.lengthBp / 1e6).toFixed(2)} Mb, ${s.snpCount} SNPs)`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-border bg-surface-2/40 p-3 text-[11px] text-fg-muted">
        <strong className="text-fg">Segments homozygotes (ROH)</strong> : régions où toutes les
        positions génotypées sont homozygotes. Leur longueur totale divisée par le génome
        autosomique (~2,88 Gb) donne un estimateur de consanguinité F<sub>ROH</sub>.
        Signal brut : la plupart des segments proviennent simplement de déséquilibres de liaison
        dans la population, non d&apos;un apparentement parental.
      </div>
    </div>
  );
}

"use client";

import type { Act } from "@/lib/story/acts";

interface TimelineRibbonProps {
  acts: Act[];
  active: number;
  onJump?: (index: number) => void;
}

function chromosomeFor(act: Act): string | null {
  if (act.kind === "clinvar" && act.locus) return act.locus.chr;
  if (act.kind === "pharma" && act.loci[0]) return act.loci[0].chr;
  return null;
}

function geneFor(act: Act): string | null {
  if (act.kind === "clinvar") return act.finding.entry.gene;
  if (act.kind === "pharma" && act.loci[0]) return act.loci[0].gene;
  if (act.kind === "haplogroup-y") return "Chr. Y";
  if (act.kind === "haplogroup-mt") return "ADN mt";
  if (act.kind === "roh") return "Segments ROH";
  if (act.kind === "ancestry") return "Panel AIMs";
  if (act.kind === "traits") return "Traits";
  if (act.kind === "neanderthal") return "Archaïque";
  if (act.kind === "prs") return "Score polygénique";
  if (act.kind === "actionable") return "Variants documentés";
  if (act.kind === "carriers") return "Panel récessif";
  return null;
}

function kindLabel(kind: Act["kind"]): string {
  switch (kind) {
    case "intro":
      return "Le code";
    case "ancestry":
      return "Origines";
    case "haplogroup-y":
      return "Lignée paternelle";
    case "haplogroup-mt":
      return "Lignée maternelle";
    case "neanderthal":
      return "Néandertal";
    case "health-intro":
      return "Santé";
    case "clinvar":
      return "Variant clinique";
    case "actionable":
      return "Variants documentés";
    case "carriers":
      return "Dépistage de porteurs";
    case "pharma-intro":
      return "Pharmacogénomique";
    case "pharma":
      return "Médicament";
    case "prs-intro":
      return "Risque polygénique";
    case "prs":
      return "Score polygénique";
    case "traits":
      return "Traits";
    case "roh":
      return "Homozygotie";
    case "fun":
      return "ADN créatif";
    case "outro":
      return "Conclusion";
  }
}

export function TimelineRibbon({ acts, active, onJump }: TimelineRibbonProps) {
  if (acts.length === 0) return null;
  const act = acts[active];
  if (!act) return null;
  const chr = chromosomeFor(act);
  const gene = geneFor(act);
  // The ActPanel on the right already shows the chapter title and body.
  // The left ribbon's job is orientation only: "where am I in the story,
  // which locus is on screen, how do I jump around".
  const pct = acts.length > 1 ? ((active + 1) / acts.length) * 100 : 0;

  return (
    <aside
      className="pointer-events-none fixed left-0 top-1/2 z-20 hidden -translate-y-1/2 pl-4 lg:block"
      aria-live="polite"
    >
      <div className="pointer-events-auto w-[190px] rounded-sm border border-paper/12 bg-[#1a1613]/65 px-3.5 py-3 backdrop-blur-md">
        <div className="flex items-baseline justify-between">
          <span className="text-[9px] font-semibold uppercase tracking-[0.24em] text-paper/45">
            {kindLabel(act.kind)}
          </span>
          <span className="font-mono text-[10px] tabular-nums text-paper/55">
            {active + 1}/{acts.length}
          </span>
        </div>
        {(chr || gene) && (
          <div className="mt-2.5 space-y-0.5 text-[11px] leading-relaxed">
            {chr && (
              <div className="flex items-baseline gap-1.5">
                <span className="text-[9px] uppercase tracking-wider text-paper/35">Chr.</span>
                <span className="font-mono tabular-nums text-paper/90">{chr}</span>
              </div>
            )}
            {gene && (
              <div className="flex items-baseline gap-1.5">
                <span className="text-[9px] uppercase tracking-wider text-paper/35">Locus</span>
                <span className="font-mono text-paper/90">{gene}</span>
              </div>
            )}
          </div>
        )}
        <div className="mt-2.5 h-0.5 w-full overflow-hidden rounded-full bg-paper/10">
          <div
            className="h-full bg-gradient-to-r from-[#7c9cff] to-[#c7b2ff] transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-2.5 flex gap-[2px]">
          {acts.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onJump?.(i)}
              aria-label={`Aller au chapitre ${i + 1}`}
              aria-current={i === active ? "step" : undefined}
              className={`group relative h-3 flex-1 cursor-pointer transition-colors ${
                onJump ? "hover:opacity-100" : "pointer-events-none"
              }`}
            >
              <span
                className={`absolute inset-x-0 top-1 h-1 rounded-full transition-colors ${
                  i < active
                    ? "bg-paper/35 group-hover:bg-paper/55"
                    : i === active
                      ? "bg-paper/85"
                      : "bg-paper/10 group-hover:bg-paper/30"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

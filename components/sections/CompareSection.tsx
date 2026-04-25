"use client";

import { useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FileDropper } from "@/components/ui/FileDropper";
import { runAnalysis } from "@/lib/analyzer-client";
import { useAnalysis } from "@/lib/store/analysis";
import { isNoCall } from "@/lib/types";
import { genotypeToString } from "@/lib/genotype";
import type {
  AnalysisResult,
  ClinVarFinding,
  GenotypeMap,
  PharmaByDrug,
  Severity,
} from "@/lib/types";

const SEV_RANK: Record<Severity, number> = { low: 1, medium: 2, high: 3 };
const SEV_COLOR: Record<Severity, string> = {
  low: "rgb(120 220 160)",
  medium: "rgb(236 196 92)",
  high: "rgb(247 110 110)",
};

import type { Lang } from "@/lib/i18n/lang";
import { SectionDisclaimer } from "@/components/SectionDisclaimer";

interface CompareProps {
  result: AnalysisResult;
  genotypes: GenotypeMap | null;
  lang?: Lang;
}

const COMPARE_COPY: Record<Lang, {
  ctaTitle: string;
  ctaSubtitle: string;
  loading: string;
  fallbackError: string;
  hostedLocally: string;
  comparison: string;
  removeB: string;
  clinvarTitle: string;
  clinvarSubtitleTpl: (a: number, b: number, s: number) => string;
  noClinvarDiff: string;
  pharmaTitle: string;
  pharmaSubtitleTpl: (n: number) => string;
  pharmaEquivalent: string;
  genoTitle: string;
  genoSubtitleTpl: (d: number, t: number) => string;
  genoIdentical: string;
  onlySide: (side: "A" | "B") => string;
}> = {
  fr: {
    ctaTitle: "Comparer un second fichier",
    ctaSubtitle: "Glissez le fichier d'une autre personne (parent, frère/sœur, enfant) pour comparer génotypes, variants ClinVar et profils pharmacogénomiques.",
    loading: "Analyse en cours…",
    fallbackError: "Échec de l'analyse",
    hostedLocally: "Le second fichier est traité uniquement dans votre navigateur, comme le premier.",
    comparison: "Comparaison",
    removeB: "✕ Retirer B",
    clinvarTitle: "ClinVar · divergences",
    clinvarSubtitleTpl: (a, b, s) => `${a} propres à A · ${b} propres à B · ${s} partagés`,
    noClinvarDiff: "Aucune divergence ClinVar entre les deux fichiers.",
    pharmaTitle: "Pharmaco · écarts de sévérité",
    pharmaSubtitleTpl: (n) => `${n} changement${n > 1 ? "s" : ""} de sévérité par médicament`,
    pharmaEquivalent: "Profils pharmacogénomiques équivalents.",
    genoTitle: "Génotypes · différences sur les rsIDs cliniquement pertinents",
    genoSubtitleTpl: (d, t) => `${d} SNPs divergents · sur ${t} rsIDs communs évalués (ClinVar + PGx)`,
    genoIdentical: "Génotypes identiques sur tous les rsIDs communs évalués.",
    onlySide: (s) => `seulement ${s}`,
  },
  en: {
    ctaTitle: "Compare a second file",
    ctaSubtitle: "Drop another person's file (parent, sibling, child) to compare genotypes, ClinVar variants and pharmacogenomic profiles.",
    loading: "Analysing…",
    fallbackError: "Analysis failed",
    hostedLocally: "The second file is processed only in your browser, just like the first.",
    comparison: "Comparison",
    removeB: "✕ Remove B",
    clinvarTitle: "ClinVar · divergences",
    clinvarSubtitleTpl: (a, b, s) => `${a} unique to A · ${b} unique to B · ${s} shared`,
    noClinvarDiff: "No ClinVar divergence between the two files.",
    pharmaTitle: "Pharma · severity shifts",
    pharmaSubtitleTpl: (n) => `${n} severity change${n > 1 ? "s" : ""} per drug`,
    pharmaEquivalent: "Equivalent pharmacogenomic profiles.",
    genoTitle: "Genotypes · differences on clinically relevant rsIDs",
    genoSubtitleTpl: (d, t) => `${d} divergent SNPs · over ${t} shared evaluated rsIDs (ClinVar + PGx)`,
    genoIdentical: "Identical genotypes on all shared evaluated rsIDs.",
    onlySide: (s) => `only ${s}`,
  },
};

export function CompareSection({ result, genotypes, lang = "fr" }: CompareProps) {
  const { compareResult, compareGenotypes, setCompare } = useAnalysis();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  const onFile = async (f: File) => {
    setLoading(true);
    setErr(null);
    setProgress(0);
    try {
      const data = await runAnalysis(f, {
        onProgress: (p) => setProgress(p.percent ?? 0),
      });
      setCompare(data);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : COMPARE_COPY[lang].fallbackError);
    } finally {
      setLoading(false);
    }
  };

  const c = COMPARE_COPY[lang];
  if (!compareResult || !compareGenotypes) {
    return (
      <>
        <SectionDisclaimer kind="compare" lang={lang} />
        <Card>
          <CardHeader title={c.ctaTitle} subtitle={c.ctaSubtitle} />
          <div className="mt-2">
            <FileDropper onFile={onFile} />
            {loading && (
              <div className="mt-4 text-xs text-fg-muted">
                {c.loading} {progress > 0 && `${progress}%`}
              </div>
            )}
            {err && (
              <div className="mt-4 rounded-lg border border-danger/40 bg-danger/10 p-3 text-xs text-danger">
                {err}
              </div>
            )}
            <div className="mt-3 text-xs text-fg-muted">
              <span className="opacity-70">{c.hostedLocally}</span>
            </div>
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      <SectionDisclaimer kind="compare" lang={lang} />
      <CompareContent
        a={{ result, genotypes }}
        b={{ result: compareResult, genotypes: compareGenotypes }}
        onSwap={() => setCompare(null)}
        lang={lang}
      />
    </>
  );
}

type Side = {
  result: AnalysisResult;
  genotypes: GenotypeMap | null;
};

function CompareContent({
  a,
  b,
  onSwap,
  lang,
}: {
  a: Side;
  b: Side;
  onSwap: () => void;
  lang: Lang;
}) {
  const c = COMPARE_COPY[lang];
  const numLocale = lang === "en" ? "en-US" : "fr-FR";
  const clinvarDiff = useMemo(() => diffClinVar(a.result.clinvar, b.result.clinvar), [a, b]);
  const pharmaDiff = useMemo(() => diffPharma(a.result.pharma.byDrug, b.result.pharma.byDrug), [a, b]);
  const genoDiff = useMemo(
    () => diffGenotypes(a, b),
    [a, b],
  );

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
      <Card className="md:col-span-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-fg">{c.comparison}</div>
            <div className="mt-0.5 text-xs text-fg-muted">
              <span className="text-accent">A</span> {a.result.meta.filename} (
              {a.result.meta.totalSNPs.toLocaleString(numLocale)} SNPs) ·{" "}
              <span className="text-accent-2">B</span> {b.result.meta.filename} (
              {b.result.meta.totalSNPs.toLocaleString(numLocale)} SNPs)
            </div>
          </div>
          <button
            type="button"
            onClick={onSwap}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-fg-muted hover:border-danger hover:text-danger"
          >
            {c.removeB}
          </button>
        </div>
      </Card>

      <Card className="md:col-span-6">
        <CardHeader
          title={c.clinvarTitle}
          subtitle={c.clinvarSubtitleTpl(clinvarDiff.onlyA.length, clinvarDiff.onlyB.length, clinvarDiff.shared.length)}
        />
        <div className="space-y-2">
          {clinvarDiff.onlyA.slice(0, 20).map((f) => (
            <DiffRow
              key={`a-${f.entry.rs}`}
              label={f.entry.gene}
              rs={f.entry.rs}
              left={f.observed}
              right="—"
              tone="danger"
              side="A"
              lang={lang}
            />
          ))}
          {clinvarDiff.onlyB.slice(0, 20).map((f) => (
            <DiffRow
              key={`b-${f.entry.rs}`}
              label={f.entry.gene}
              rs={f.entry.rs}
              left="—"
              right={f.observed}
              tone="danger"
              side="B"
              lang={lang}
            />
          ))}
          {clinvarDiff.onlyA.length === 0 && clinvarDiff.onlyB.length === 0 && (
            <div className="py-4 text-center text-xs text-fg-muted">{c.noClinvarDiff}</div>
          )}
        </div>
      </Card>

      <Card className="md:col-span-6">
        <CardHeader
          title={c.pharmaTitle}
          subtitle={c.pharmaSubtitleTpl(pharmaDiff.changed.length)}
        />
        <div className="space-y-2">
          {pharmaDiff.changed.slice(0, 20).map((c) => (
            <div
              key={c.drug}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-2/40 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium capitalize text-fg">{c.drug}</div>
                <div className="truncate text-[10px] text-fg-muted">
                  {c.drug_class ?? "—"}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <SevPill severity={c.a} label="A" />
                <span className="text-fg-muted">→</span>
                <SevPill severity={c.b} label="B" />
              </div>
            </div>
          ))}
          {pharmaDiff.changed.length === 0 && (
            <div className="py-4 text-center text-xs text-fg-muted">{c.pharmaEquivalent}</div>
          )}
        </div>
      </Card>

      <Card className="md:col-span-12">
        <CardHeader
          title={c.genoTitle}
          subtitle={c.genoSubtitleTpl(genoDiff.differing.length, genoDiff.total)}
        />
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {genoDiff.differing.slice(0, 40).map((g) => (
            <div
              key={g.rs}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-2/40 px-3 py-2 text-sm"
            >
              <div>
                <span className="font-mono text-[11px] text-fg-muted">{g.rs}</span>
                {g.gene && <span className="ml-2 text-fg">{g.gene}</span>}
              </div>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="rounded bg-accent/15 px-1.5 py-0.5 text-accent">{g.a}</span>
                <span className="text-fg-muted">≠</span>
                <span className="rounded bg-accent-2/15 px-1.5 py-0.5 text-accent-2">{g.b}</span>
              </div>
            </div>
          ))}
          {genoDiff.differing.length === 0 && (
            <div className="col-span-full py-4 text-center text-xs text-fg-muted">{c.genoIdentical}</div>
          )}
        </div>
      </Card>
    </div>
  );
}

function DiffRow({
  label,
  rs,
  left,
  right,
  tone,
  side,
  lang,
}: {
  label: string;
  rs: string;
  left: string;
  right: string;
  tone: "danger" | "warn";
  side: "A" | "B";
  lang: Lang;
}) {
  const badge = tone === "danger" ? "danger" : "warn";
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-2/40 px-3 py-2 text-sm">
      <div>
        <span className="font-medium">{label}</span>
        <span className="ml-2 font-mono text-[11px] text-fg-muted">{rs}</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <Badge variant={badge}>{COMPARE_COPY[lang].onlySide(side)}</Badge>
        <span className="font-mono text-[11px]">
          A <span className="text-fg">{left}</span> · B <span className="text-fg">{right}</span>
        </span>
      </div>
    </div>
  );
}

function SevPill({ severity, label }: { severity: Severity; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{
        background: `${SEV_COLOR[severity]}22`,
        color: SEV_COLOR[severity],
        border: `1px solid ${SEV_COLOR[severity]}55`,
      }}
    >
      {label}·{severity}
    </span>
  );
}

function diffClinVar(a: ClinVarFinding[], b: ClinVarFinding[]) {
  const ma = new Map(a.map((f) => [f.entry.rs, f]));
  const mb = new Map(b.map((f) => [f.entry.rs, f]));
  const onlyA: ClinVarFinding[] = [];
  const onlyB: ClinVarFinding[] = [];
  const shared: ClinVarFinding[] = [];
  for (const [rs, f] of ma) {
    if (mb.has(rs)) shared.push(f);
    else onlyA.push(f);
  }
  for (const [rs, f] of mb) {
    if (!ma.has(rs)) onlyB.push(f);
  }
  return { onlyA, onlyB, shared };
}

function diffPharma(a: PharmaByDrug[], b: PharmaByDrug[]) {
  const ma = new Map(a.map((d) => [d.drug, d]));
  const mb = new Map(b.map((d) => [d.drug, d]));
  const changed: { drug: string; drug_class?: string; a: Severity; b: Severity }[] = [];
  const drugs = new Set<string>([...ma.keys(), ...mb.keys()]);
  for (const drug of drugs) {
    const da = ma.get(drug);
    const db = mb.get(drug);
    const sa = da?.severity ?? "low";
    const sb = db?.severity ?? "low";
    if (sa !== sb) {
      changed.push({
        drug,
        drug_class: da?.drug_class ?? db?.drug_class,
        a: sa,
        b: sb,
      });
    }
  }
  changed.sort((x, y) => {
    const dx = Math.abs(SEV_RANK[x.a] - SEV_RANK[x.b]);
    const dy = Math.abs(SEV_RANK[y.a] - SEV_RANK[y.b]);
    if (dy !== dx) return dy - dx;
    return x.drug.localeCompare(y.drug);
  });
  return { changed };
}

function diffGenotypes(a: Side, b: Side) {
  // Focus on clinically relevant rsIDs (ClinVar findings + PGx findings union)
  const rsids = new Set<string>();
  const geneFor: Record<string, string> = {};
  for (const f of a.result.clinvar) {
    rsids.add(f.entry.rs);
    geneFor[f.entry.rs] = f.entry.gene;
  }
  for (const f of b.result.clinvar) {
    rsids.add(f.entry.rs);
    geneFor[f.entry.rs] = f.entry.gene;
  }
  for (const f of a.result.pharma.findings) {
    rsids.add(f.rule.rsid);
    geneFor[f.rule.rsid] = f.rule.gene;
  }
  for (const f of b.result.pharma.findings) {
    rsids.add(f.rule.rsid);
    geneFor[f.rule.rsid] = f.rule.gene;
  }

  const differing: { rs: string; gene: string; a: string; b: string }[] = [];
  let total = 0;
  for (const rs of rsids) {
    const ga = a.genotypes?.get(rs);
    const gb = b.genotypes?.get(rs);
    if (!ga || !gb) continue;
    total++;
    const sa = isNoCall(ga) ? "—" : sortedGenotype(genotypeToString(ga));
    const sb = isNoCall(gb) ? "—" : sortedGenotype(genotypeToString(gb));
    if (sa !== sb) {
      differing.push({ rs, gene: geneFor[rs] ?? "", a: sa, b: sb });
    }
  }
  differing.sort((x, y) => x.gene.localeCompare(y.gene) || x.rs.localeCompare(y.rs));
  return { differing, total };
}

function sortedGenotype(s: string): string {
  if (s.length !== 2) return s;
  return [s[0], s[1]].sort().join("");
}

"use client";

import { useMemo } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Karyogram } from "@/components/viz/Karyogram";
import { SeverityBars } from "@/components/viz/SeverityBars";
import type { AnalysisResult, Severity } from "@/lib/types";

interface OverviewSectionProps {
  result: AnalysisResult;
}

export function OverviewSection({ result }: OverviewSectionProps) {
  const severityCounts: Record<Severity, number> = useMemo(() => {
    const c: Record<Severity, number> = { low: 0, medium: 0, high: 0 };
    for (const d of result.pharma.byDrug) c[d.severity]++;
    return c;
  }, [result]);

  const markers = useMemo(() => {
    const out: { chr: string; pos: number; color: string; label: string; id: string }[] = [];
    // ClinVar — red markers. We don't have positions here, but rsid list will still be useful
    // in v2. For now, this is a placeholder since we don't store chr/pos in seed.
    return out;
  }, []);

  const callRate = result.meta.totalSNPs === 0
    ? 0
    : 1 - result.meta.noCalls / result.meta.totalSNPs;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
      <Card className="md:col-span-4">
        <CardHeader title="Fichier" subtitle="Résumé technique" />
        <dl className="space-y-2 text-sm">
          <Row label="Nom" value={result.meta.filename} mono />
          <Row label="Build" value={result.meta.build} />
          <Row label="SNPs totaux" value={result.meta.totalSNPs.toLocaleString("fr-FR")} />
          <Row
            label="Call rate"
            value={`${(callRate * 100).toFixed(2)}%`}
            right={
              <Badge variant={callRate > 0.98 ? "ok" : callRate > 0.95 ? "warn" : "danger"}>
                {result.meta.noCalls.toLocaleString("fr-FR")} nocall
              </Badge>
            }
          />
          <Row label="Parsé le" value={new Date(result.meta.parsedAt).toLocaleString("fr-FR")} />
          <Row label="Empreinte" value={result.meta.fileHash} mono />
        </dl>
      </Card>

      <Card className="md:col-span-4">
        <CardHeader title="Pharmaco" subtitle="Médicaments concernés" />
        <SeverityBars counts={severityCounts} />
      </Card>

      <Card className="md:col-span-4">
        <CardHeader title="Découvertes" subtitle="Aperçu rapide" />
        <div className="grid grid-cols-3 gap-3">
          <Tile value={result.clinvar.length} label="ClinVar P/LP" tone="danger" />
          <Tile value={result.pharma.byDrug.length} label="Médicaments" tone="warn" />
          <Tile value={result.traits.filter((t) => t.result).length} label="Traits" tone="accent" />
        </div>
      </Card>

      <Card className="md:col-span-12">
        <CardHeader
          title="Karyogramme"
          subtitle="Cartographie des chromosomes (GRCh37)"
        />
        <Karyogram markers={markers} />
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  right,
}: {
  label: string;
  value: string;
  mono?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-1.5 last:border-0">
      <dt className="text-fg-muted">{label}</dt>
      <dd className={`flex items-center gap-2 ${mono ? "font-mono text-xs" : ""}`}>
        <span className="truncate text-right">{value}</span>
        {right}
      </dd>
    </div>
  );
}

function Tile({ value, label, tone }: { value: number; label: string; tone: "danger" | "warn" | "accent" }) {
  const color =
    tone === "danger"
      ? "from-danger/30 to-danger/5 text-danger"
      : tone === "warn"
        ? "from-warn/30 to-warn/5 text-warn"
        : "from-accent/30 to-accent/5 text-accent";
  return (
    <div className={`rounded-xl border border-border bg-gradient-to-br p-3 ${color}`}>
      <div className="text-3xl font-bold tabular-nums">{value}</div>
      <div className="mt-1 text-xs text-fg-muted">{label}</div>
    </div>
  );
}

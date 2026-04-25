"use client";

import { useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DrugSunburst } from "@/components/viz/DrugSunburst";
import { ProteinViewer } from "@/components/viz/ProteinViewer";
import { SectionDisclaimer } from "@/components/SectionDisclaimer";
import { uniprotForGene } from "@/lib/gene-uniprot";
import type { PharmaByDrug, Severity } from "@/lib/types";
import { S, tr, trTpl } from "@/lib/i18n/strings";
import type { Lang } from "@/lib/i18n/lang";

interface PharmaSectionProps {
  byDrug: PharmaByDrug[];
  lang?: Lang;
}

const SEV_VARIANT: Record<Severity, "ok" | "warn" | "danger"> = {
  low: "ok",
  medium: "warn",
  high: "danger",
};

function sevLabel(s: Severity, lang: Lang): string {
  if (s === "high") return tr(S.pharma.sevHigh, lang);
  if (s === "medium") return tr(S.pharma.sevMed, lang);
  return tr(S.pharma.sevLow, lang);
}

export function PharmaSection({ byDrug, lang = "fr" }: PharmaSectionProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [openGene, setOpenGene] = useState<string | null>(null);

  const selectedDrug = useMemo(
    () => byDrug.find((d) => d.drug === selected) ?? byDrug[0] ?? null,
    [byDrug, selected],
  );

  if (byDrug.length === 0) {
    return (
      <Card>
        <CardHeader
          title={tr(S.pharma.title, lang)}
          subtitle={tr(S.pharma.emptySubtitle, lang)}
        />
        <p className="text-sm text-fg-muted">{tr(S.pharma.emptyBody, lang)}</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-12">
      <div className="md:col-span-12">
        <SectionDisclaimer kind="pharma" lang={lang} />
      </div>
      <Card className="md:col-span-5">
        <CardHeader
          title={tr(S.pharma.radialTitle, lang)}
          subtitle={tr(S.pharma.radialSubtitle, lang)}
        />
        <div className="flex justify-center">
          <DrugSunburst byDrug={byDrug} onSelect={setSelected} />
        </div>
        <div className="mt-4 flex justify-center gap-4 text-xs">
          <LegendDot color="rgb(247 110 110)" label={tr(S.pharma.legendHigh, lang)} />
          <LegendDot color="rgb(236 196 92)" label={tr(S.pharma.legendMed, lang)} />
          <LegendDot color="rgb(120 220 160)" label={tr(S.pharma.legendLow, lang)} />
        </div>
      </Card>

      <Card className="md:col-span-7">
        <CardHeader
          title={selectedDrug?.drug ?? "—"}
          subtitle={selectedDrug?.drug_class ?? ""}
          right={
            selectedDrug && (
              <Badge variant={SEV_VARIANT[selectedDrug.severity]}>
                {sevLabel(selectedDrug.severity, lang)}
              </Badge>
            )
          }
        />
        {selectedDrug && (
          <>
            <p className="mb-4 text-sm leading-relaxed text-fg first-letter:uppercase">{selectedDrug.effect}</p>
            <div className="mb-2 text-xs uppercase tracking-wider text-fg-muted">
              {tr(S.pharma.contributorsTitle, lang)}
            </div>
            <ul className="space-y-2 text-sm">
              {selectedDrug.contributors.map((c, i) => {
                const hasStruct = uniprotForGene(c.gene) != null;
                return (
                  <li key={i} className="rounded-lg border border-border bg-surface-2/40 p-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-accent">{c.gene}</span>
                        <span className="ml-2 text-fg-muted">{c.phenotype}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            c.zygosity === "alt/alt"
                              ? "danger"
                              : c.zygosity === "ref/alt"
                                ? "warn"
                                : "neutral"
                          }
                        >
                          {c.zygosity}
                        </Badge>
                        {hasStruct && (
                          <button
                            type="button"
                            onClick={() =>
                              setOpenGene(openGene === c.gene ? null : c.gene)
                            }
                            className="text-xs text-accent hover:underline"
                          >
                            {openGene === c.gene
                              ? tr(S.pharma.link3dClose, lang)
                              : tr(S.pharma.link3dOpen, lang)}
                          </button>
                        )}
                      </div>
                    </div>
                    {openGene === c.gene && (
                      <div className="mt-3">
                        <ProteinViewer gene={c.gene} onClose={() => setOpenGene(null)} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Card>

      <Card className="md:col-span-12">
        <CardHeader
          title={tr(S.pharma.allDrugsTitle, lang)}
          subtitle={trTpl(S.pharma.allDrugsSubtitleTpl, lang, byDrug.length)}
        />
        <div className="max-h-[420px] overflow-y-auto">
          <table className="w-full table-fixed text-sm">
            <thead className="sticky top-0 bg-surface text-xs uppercase tracking-wider text-fg-muted">
              <tr>
                <th className="w-[40%] py-2 text-left sm:w-auto">{tr(S.pharma.colDrug, lang)}</th>
                <th className="hidden text-left sm:table-cell">{tr(S.pharma.colClass, lang)}</th>
                <th className="hidden text-left sm:table-cell">{tr(S.pharma.colEffect, lang)}</th>
                <th className="w-[35%] sm:w-auto">{tr(S.pharma.colSeverity, lang)}</th>
              </tr>
            </thead>
            <tbody>
              {byDrug.map((d) => (
                <tr
                  key={d.drug}
                  onClick={() => setSelected(d.drug)}
                  className={`cursor-pointer border-t border-border/50 hover:bg-surface-2/50 ${
                    selected === d.drug ? "bg-accent/5" : ""
                  }`}
                >
                  <td className="py-2 pr-2 font-medium capitalize break-words">{d.drug}</td>
                  <td className="hidden text-fg-muted first-letter:uppercase sm:table-cell">{d.drug_class ?? "—"}</td>
                  <td className="hidden max-w-[360px] truncate text-fg-muted first-letter:uppercase sm:table-cell">{d.effect}</td>
                  <td className="text-center">
                    <Badge variant={SEV_VARIANT[d.severity]}>{sevLabel(d.severity, lang)}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1 text-fg-muted">
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

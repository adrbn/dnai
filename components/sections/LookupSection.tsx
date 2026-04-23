"use client";

import { useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { genotypeToString } from "@/lib/genotype";
import type { GenotypeMap, PositionIndex } from "@/lib/types";
import { isNoCall } from "@/lib/types";

interface LookupSectionProps {
  genotypes: GenotypeMap | null;
  positions: PositionIndex | null;
}

type Hit = {
  rsid: string;
  chr: string;
  pos: number;
  genotype: string;
  nocall: boolean;
};

const CHROMS = [
  "1","2","3","4","5","6","7","8","9","10","11","12",
  "13","14","15","16","17","18","19","20","21","22","X","Y","MT",
];

export function LookupSection({ genotypes, positions }: LookupSectionProps) {
  const [query, setQuery] = useState("");
  const [chrFilter, setChrFilter] = useState<string>("");

  const stats = useMemo(() => {
    if (!genotypes) return null;
    const byChr: Record<string, number> = {};
    let noCalls = 0;
    genotypes.forEach((g, rs) => {
      if (isNoCall(g)) noCalls++;
      const p = positions?.[rs];
      if (p) byChr[p.chr] = (byChr[p.chr] ?? 0) + 1;
    });
    return { total: genotypes.size, noCalls, byChr };
  }, [genotypes, positions]);

  const hits = useMemo<Hit[]>(() => {
    if (!genotypes || !positions) return [];
    const q = query.trim().toLowerCase();
    if (!q && !chrFilter) return [];
    const out: Hit[] = [];
    let count = 0;
    for (const [rs, g] of genotypes) {
      const pos = positions[rs];
      if (!pos) continue;
      if (chrFilter && pos.chr !== chrFilter) continue;
      if (q && !rs.toLowerCase().includes(q)) continue;
      out.push({
        rsid: rs,
        chr: pos.chr,
        pos: pos.pos,
        genotype: genotypeToString(g),
        nocall: isNoCall(g),
      });
      count++;
      if (count >= 200) break;
    }
    return out;
  }, [genotypes, positions, query, chrFilter]);

  if (!genotypes || !positions) {
    return (
      <Card>
        <CardHeader title="Recherche" subtitle="Données génotypiques non disponibles" />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Recherche brute"
          subtitle="Recherchez n'importe quel rsID dans votre fichier. Tout reste local."
        />

        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[240px]">
            <label className="text-[10px] uppercase tracking-wider text-fg-muted">
              rsID (préfixe ou complet)
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="rs1801133"
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-fg-muted">
              Chromosome
            </label>
            <select
              value={chrFilter}
              onChange={(e) => setChrFilter(e.target.value)}
              className="mt-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
            >
              <option value="">Tous</option>
              {CHROMS.map((c) => (
                <option key={c} value={c}>
                  chr{c}
                </option>
              ))}
            </select>
          </div>

          {(query || chrFilter) && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setChrFilter("");
              }}
              className="self-end rounded-lg border border-border bg-surface px-3 py-2 text-xs text-fg-muted hover:border-danger hover:text-danger"
            >
              ✕ Reset
            </button>
          )}
        </div>

        <div className="mt-4 text-xs text-fg-muted">
          {hits.length === 0 && (query || chrFilter) && (
            <span>Aucun résultat. Vérifiez l&apos;orthographe du rsID.</span>
          )}
          {hits.length > 0 && (
            <span>
              {hits.length} résultat(s)
              {hits.length === 200 ? " (tronqué à 200 — affinez la recherche)" : ""}
            </span>
          )}
          {!query && !chrFilter && (
            <span>Tapez un rsID pour commencer. Ex : <span className="font-mono">rs1801133</span>, <span className="font-mono">rs429358</span>, <span className="font-mono">rs1800497</span>.</span>
          )}
        </div>

        {hits.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-[10px] uppercase tracking-wider text-fg-muted">
                <tr>
                  <th className="px-3 py-2">rsID</th>
                  <th className="px-3 py-2">Chr</th>
                  <th className="px-3 py-2 text-right">Position (GRCh37)</th>
                  <th className="px-3 py-2 text-center">Génotype</th>
                  <th className="px-3 py-2">Ressources</th>
                </tr>
              </thead>
              <tbody>
                {hits.map((h, i) => (
                  <tr
                    key={h.rsid}
                    className={`border-t border-border ${
                      i % 2 === 0 ? "bg-surface/40" : "bg-transparent"
                    }`}
                  >
                    <td className="px-3 py-2 font-mono text-xs">{h.rsid}</td>
                    <td className="px-3 py-2 font-mono text-xs">chr{h.chr}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs tabular-nums">
                      {h.pos.toLocaleString("fr-FR")}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {h.nocall ? (
                        <Badge variant="neutral">no call</Badge>
                      ) : (
                        <span className="font-mono font-semibold text-accent">{h.genotype}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2 text-xs">
                        <a
                          href={`https://www.snpedia.com/index.php/${h.rsid}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-fg-muted hover:text-accent hover:underline"
                        >
                          SNPedia
                        </a>
                        <a
                          href={`https://www.ncbi.nlm.nih.gov/snp/${h.rsid}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-fg-muted hover:text-accent hover:underline"
                        >
                          dbSNP
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {stats && (
        <Card>
          <CardHeader title="Couverture" subtitle="Répartition des SNPs par chromosome" />
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-12">
            {CHROMS.map((c) => {
              const n = stats.byChr[c] ?? 0;
              const max = Math.max(1, ...Object.values(stats.byChr));
              const t = n / max;
              return (
                <div key={c} className="rounded-lg border border-border bg-surface-2/40 p-2 text-center">
                  <div className="text-[10px] font-mono text-fg-muted">chr{c}</div>
                  <div className="mt-1 text-sm font-semibold tabular-nums">
                    {n.toLocaleString("fr-FR")}
                  </div>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-bg">
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${t * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 text-xs text-fg-muted">
            {stats.total.toLocaleString("fr-FR")} SNPs typés · {stats.noCalls.toLocaleString("fr-FR")} no-calls
          </div>
        </Card>
      )}
    </div>
  );
}

/// <reference lib="webworker" />

import { parseMyHeritageFile } from "../lib/parser/myheritage";
import { annotateClinVar } from "../lib/annotation/clinvar";
import { annotatePharma } from "../lib/annotation/pharma";
import { annotateTraits } from "../lib/annotation/traits";
import { annotatePRS } from "../lib/annotation/prs";
import { computeROH } from "../lib/annotation/roh";
import type {
  AnalysisResult,
  ClinVarEntry,
  PGxRule,
  PRSRule,
  ProgressEvent,
  TraitRule,
} from "../lib/types";

type AnalyzeInput = {
  type: "analyze";
  file: File;
  dataUrls: {
    pgx: string;
    traits: string;
    clinvar: string;
    clinvarSeed?: string;
    prs?: string;
  };
};

type InMessage = AnalyzeInput;

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;

function post(ev: ProgressEvent) {
  ctx.postMessage(ev);
}

async function hashFile(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function mergeClinVar(full: ClinVarEntry[], seed: ClinVarEntry[]): ClinVarEntry[] {
  const byRs = new Map<string, ClinVarEntry>();
  for (const e of full) byRs.set(e.rs, e);
  for (const e of seed) byRs.set(e.rs, e); // seed overrides
  return Array.from(byRs.values());
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch ${url} failed: ${res.status}`);
  return (await res.json()) as T;
}

async function runAnalysis(msg: AnalyzeInput) {
  post({ type: "progress", phase: "fetch", percent: 0, message: "Chargement des bases de référence…" });
  const [pgxRules, traitRules, clinvarDb, clinvarSeed, prsRules] = await Promise.all([
    fetchJson<PGxRule[]>(msg.dataUrls.pgx),
    fetchJson<TraitRule[]>(msg.dataUrls.traits),
    fetchJson<ClinVarEntry[]>(msg.dataUrls.clinvar),
    msg.dataUrls.clinvarSeed
      ? fetchJson<ClinVarEntry[]>(msg.dataUrls.clinvarSeed)
      : Promise.resolve<ClinVarEntry[]>([]),
    msg.dataUrls.prs
      ? fetchJson<PRSRule[]>(msg.dataUrls.prs)
      : Promise.resolve<PRSRule[]>([]),
  ]);
  // Seed contains hand-curated indels and high-priority variants that the
  // SNV-only full build cannot cover. Seed wins on rs collisions so curated
  // gene/condition labels prevail.
  const mergedClinVar: ClinVarEntry[] = mergeClinVar(clinvarDb, clinvarSeed);
  post({ type: "progress", phase: "fetch", percent: 1 });

  post({ type: "progress", phase: "parse", percent: 0, message: "Analyse du fichier…" });
  const fileHash = await hashFile(msg.file);
  const parsed = await parseMyHeritageFile(msg.file, {
    onProgress: (p) => post({ type: "progress", phase: "parse", percent: p }),
  });
  post({ type: "progress", phase: "parse", percent: 1 });

  post({ type: "progress", phase: "annotate", percent: 0, message: "Annotation cliniques & PGx…" });
  const clinvar = annotateClinVar(parsed.genotypes, mergedClinVar);
  post({ type: "progress", phase: "annotate", percent: 0.2 });
  const pharma = annotatePharma(parsed.genotypes, pgxRules);
  post({ type: "progress", phase: "annotate", percent: 0.45 });
  const traits = annotateTraits(parsed.genotypes, traitRules);
  post({ type: "progress", phase: "annotate", percent: 0.65 });
  const prs = annotatePRS(parsed.genotypes, prsRules);
  post({ type: "progress", phase: "annotate", percent: 0.85 });
  const roh = computeROH(parsed.genotypes, parsed.positions);
  post({ type: "progress", phase: "annotate", percent: 1 });

  const result: AnalysisResult = {
    meta: {
      totalSNPs: parsed.meta.totalSNPs,
      noCalls: parsed.meta.noCalls,
      build: parsed.meta.build,
      filename: msg.file.name,
      fileHash,
      parsedAt: new Date().toISOString(),
      source: parsed.meta.source,
    },
    density: parsed.density,
    clinvar,
    pharma,
    traits,
    prs,
    roh,
  };
  return { result, genotypes: parsed.genotypes, positions: parsed.positions };
}

ctx.addEventListener("message", async (ev: MessageEvent<InMessage>) => {
  const msg = ev.data;
  if (msg.type !== "analyze") return;
  try {
    const { result, genotypes, positions } = await runAnalysis(msg);
    post({ type: "done", result, genotypes, positions });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    post({ type: "error", error: message });
  }
});

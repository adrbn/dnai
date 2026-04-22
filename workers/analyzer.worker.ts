/// <reference lib="webworker" />

import { parseMyHeritageFile } from "../lib/parser/myheritage";
import { annotateClinVar } from "../lib/annotation/clinvar";
import { annotatePharma } from "../lib/annotation/pharma";
import { annotateTraits } from "../lib/annotation/traits";
import type {
  AnalysisResult,
  ClinVarEntry,
  PGxRule,
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

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch ${url} failed: ${res.status}`);
  return (await res.json()) as T;
}

async function runAnalysis(msg: AnalyzeInput): Promise<AnalysisResult> {
  post({ type: "progress", phase: "fetch", percent: 0, message: "Chargement des bases de référence…" });
  const [pgxRules, traitRules, clinvarDb] = await Promise.all([
    fetchJson<PGxRule[]>(msg.dataUrls.pgx),
    fetchJson<TraitRule[]>(msg.dataUrls.traits),
    fetchJson<ClinVarEntry[]>(msg.dataUrls.clinvar),
  ]);
  post({ type: "progress", phase: "fetch", percent: 1 });

  post({ type: "progress", phase: "parse", percent: 0, message: "Analyse du fichier…" });
  const fileHash = await hashFile(msg.file);
  const parsed = await parseMyHeritageFile(msg.file, {
    onProgress: (p) => post({ type: "progress", phase: "parse", percent: p }),
  });
  post({ type: "progress", phase: "parse", percent: 1 });

  post({ type: "progress", phase: "annotate", percent: 0, message: "Annotation cliniques & PGx…" });
  const clinvar = annotateClinVar(parsed.genotypes, clinvarDb);
  post({ type: "progress", phase: "annotate", percent: 0.33 });
  const pharma = annotatePharma(parsed.genotypes, pgxRules);
  post({ type: "progress", phase: "annotate", percent: 0.66 });
  const traits = annotateTraits(parsed.genotypes, traitRules);
  post({ type: "progress", phase: "annotate", percent: 1 });

  return {
    meta: {
      totalSNPs: parsed.meta.totalSNPs,
      noCalls: parsed.meta.noCalls,
      build: parsed.meta.build,
      filename: msg.file.name,
      fileHash,
      parsedAt: new Date().toISOString(),
    },
    clinvar,
    pharma,
    traits,
  };
}

ctx.addEventListener("message", async (ev: MessageEvent<InMessage>) => {
  const msg = ev.data;
  if (msg.type !== "analyze") return;
  try {
    const result = await runAnalysis(msg);
    post({ type: "done", result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    post({ type: "error", error: message });
  }
});

import type { AnalysisData, ProgressEvent } from "./types";

export type AnalyzerProgress = Extract<ProgressEvent, { type: "progress" }>;

export type RunOptions = {
  onProgress?: (p: AnalyzerProgress) => void;
};

const DATA_URLS = {
  pgx: "/data/pgx-rules.json",
  traits: "/data/traits-rules.json",
  clinvar: "/data/clinvar-full.json",
  clinvarSeed: "/data/clinvar-seed.json",
  prs: "/data/prs-rules.json",
};

export function runAnalysis(file: File, opts: RunOptions = {}): Promise<AnalysisData> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("../workers/analyzer.worker.ts", import.meta.url),
      { type: "module" },
    );

    const cleanup = () => {
      worker.terminate();
    };

    worker.addEventListener("message", (ev: MessageEvent<ProgressEvent>) => {
      const msg = ev.data;
      if (msg.type === "progress") {
        opts.onProgress?.(msg);
      } else if (msg.type === "done") {
        resolve({ result: msg.result, genotypes: msg.genotypes, positions: msg.positions });
        cleanup();
      } else if (msg.type === "error") {
        reject(new Error(msg.error));
        cleanup();
      }
    });

    worker.addEventListener("error", (ev) => {
      reject(new Error(ev.message || "Worker error"));
      cleanup();
    });

    worker.postMessage({ type: "analyze", file, dataUrls: DATA_URLS });
  });
}

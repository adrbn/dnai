import { create } from "zustand";
import type { AnalysisData, AnalysisResult, GenotypeMap, PositionIndex } from "../types";
import type { AnalyzerProgress } from "../analyzer-client";
import { clearAnalysis, loadAnalysis, saveAnalysis } from "./persist";

type Status = "idle" | "running" | "done" | "error";

type AnalysisState = {
  status: Status;
  progress: AnalyzerProgress | null;
  result: AnalysisResult | null;
  genotypes: GenotypeMap | null;
  positions: PositionIndex | null;
  // comparison slot (secondary subject)
  compareResult: AnalysisResult | null;
  compareGenotypes: GenotypeMap | null;
  error: string | null;
  /**
   * True once we've checked IndexedDB for a persisted run on this device.
   * Pages that gate redirects on `result` should wait until `hydrated` is
   * true to avoid bouncing the user back to the upload page on refresh.
   */
  hydrated: boolean;
  setStatus: (s: Status) => void;
  setProgress: (p: AnalyzerProgress) => void;
  setData: (d: AnalysisData) => void;
  setCompare: (d: AnalysisData | null) => void;
  setError: (e: string) => void;
  reset: () => void;
  hydrate: () => Promise<void>;
};

export const useAnalysis = create<AnalysisState>((set, get) => ({
  status: "idle",
  progress: null,
  result: null,
  genotypes: null,
  positions: null,
  compareResult: null,
  compareGenotypes: null,
  error: null,
  hydrated: false,
  setStatus: (status) => set({ status }),
  setProgress: (progress) => set({ progress }),
  setData: (data) => {
    set({
      result: data.result,
      genotypes: data.genotypes,
      positions: data.positions,
      status: "done",
    });
    // Fire and forget — failures (quota, private mode) don't block the UI.
    void saveAnalysis(data);
  },
  setCompare: (d) =>
    set({
      compareResult: d?.result ?? null,
      compareGenotypes: d?.genotypes ?? null,
    }),
  setError: (error) => set({ error, status: "error" }),
  reset: () => {
    set({
      status: "idle",
      progress: null,
      result: null,
      genotypes: null,
      positions: null,
      compareResult: null,
      compareGenotypes: null,
      error: null,
    });
    void clearAnalysis();
  },
  hydrate: async () => {
    if (get().hydrated) return;
    if (get().result) {
      set({ hydrated: true });
      return;
    }
    const data = await loadAnalysis();
    if (data && !get().result) {
      set({
        result: data.result,
        genotypes: data.genotypes,
        positions: data.positions,
        status: "done",
        hydrated: true,
      });
    } else {
      set({ hydrated: true });
    }
  },
}));

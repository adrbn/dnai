import { create } from "zustand";
import type { AnalysisData, AnalysisResult, GenotypeMap, PositionIndex } from "../types";
import type { AnalyzerProgress } from "../analyzer-client";

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
  setStatus: (s: Status) => void;
  setProgress: (p: AnalyzerProgress) => void;
  setData: (d: AnalysisData) => void;
  setCompare: (d: AnalysisData | null) => void;
  setError: (e: string) => void;
  reset: () => void;
};

export const useAnalysis = create<AnalysisState>((set) => ({
  status: "idle",
  progress: null,
  result: null,
  genotypes: null,
  positions: null,
  compareResult: null,
  compareGenotypes: null,
  error: null,
  setStatus: (status) => set({ status }),
  setProgress: (progress) => set({ progress }),
  setData: ({ result, genotypes, positions }) =>
    set({ result, genotypes, positions, status: "done" }),
  setCompare: (d) =>
    set({
      compareResult: d?.result ?? null,
      compareGenotypes: d?.genotypes ?? null,
    }),
  setError: (error) => set({ error, status: "error" }),
  reset: () =>
    set({
      status: "idle",
      progress: null,
      result: null,
      genotypes: null,
      positions: null,
      compareResult: null,
      compareGenotypes: null,
      error: null,
    }),
}));

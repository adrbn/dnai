import { create } from "zustand";
import type { AnalysisResult } from "../types";
import type { AnalyzerProgress } from "../analyzer-client";

type Status = "idle" | "running" | "done" | "error";

type AnalysisState = {
  status: Status;
  progress: AnalyzerProgress | null;
  result: AnalysisResult | null;
  error: string | null;
  setStatus: (s: Status) => void;
  setProgress: (p: AnalyzerProgress) => void;
  setResult: (r: AnalysisResult) => void;
  setError: (e: string) => void;
  reset: () => void;
};

export const useAnalysis = create<AnalysisState>((set) => ({
  status: "idle",
  progress: null,
  result: null,
  error: null,
  setStatus: (status) => set({ status }),
  setProgress: (progress) => set({ progress }),
  setResult: (result) => set({ result, status: "done" }),
  setError: (error) => set({ error, status: "error" }),
  reset: () => set({ status: "idle", progress: null, result: null, error: null }),
}));

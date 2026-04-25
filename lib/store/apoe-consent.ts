"use client";

import { create } from "zustand";

/**
 * APOE ε4 status (Alzheimer's disease predictor) is gated behind an explicit
 * opt-in, per NSGC 2019 recommendations. The user must acknowledge:
 *   - APOE ε4 meaningfully raises late-onset Alzheimer's risk (but is not
 *     deterministic)
 *   - There is no cure; knowing may cause distress
 *   - Results can affect life/long-term-care insurance eligibility in some
 *     jurisdictions
 */

const STORAGE_KEY = "dnai.consent.apoe.v1";
const CURRENT_VERSION = "2026-04-v1";

type ApoeConsentState = {
  accepted: boolean;
  hydrated: boolean;
  hydrate: () => void;
  accept: () => void;
  revoke: () => void;
};

export const useApoeConsent = create<ApoeConsentState>((set) => ({
  accepted: false,
  hydrated: false,
  hydrate: () => {
    if (typeof window === "undefined") return;
    const v = window.localStorage.getItem(STORAGE_KEY);
    set({ accepted: v === CURRENT_VERSION, hydrated: true });
  },
  accept: () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
    }
    set({ accepted: true });
  },
  revoke: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    set({ accepted: false });
  },
}));

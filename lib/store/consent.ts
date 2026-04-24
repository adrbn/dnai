"use client";

import { create } from "zustand";

/**
 * Consent store — tracks whether the user has explicitly acknowledged
 * the "not a medical diagnosis" disclaimer. Required before any analysis
 * run. Persisted in localStorage so the user only acknowledges once per
 * device.
 */

const STORAGE_KEY = "dnai.consent.v1";
// Bump this when the disclaimer text changes and we need users to re-consent.
const CURRENT_VERSION = "2026-04-v1";

type ConsentState = {
  accepted: boolean;
  hydrated: boolean;
  hydrate: () => void;
  accept: () => void;
  revoke: () => void;
};

export const useConsent = create<ConsentState>((set) => ({
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

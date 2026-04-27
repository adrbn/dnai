"use client";

import { useAnalysis } from "./analysis";
import { useConsent } from "./consent";
import { useUnlock } from "./unlock";
import { clearAnalysis } from "./persist";

/**
 * Known DNAI localStorage keys. Listed explicitly so we never wipe
 * third-party keys (e.g. analytics) that may share the domain.
 */
const DNAI_STORAGE_KEYS = [
  "dnai.unlocked.v1",
  "dnai.consent.v1",
  "dnai.consent.apoe.v1",
  "dnai.consent.ancestry.v1",
  "dnai.lang",
  "dnai.pdf.info.v1",
  "dnai.geo.ack.v1",
] as const;

/**
 * Erases ALL DNAI-owned client state: in-memory zustand stores + persisted
 * localStorage keys. Used by the "Reset" button and the paywall "start over"
 * link. Does not redirect — caller decides navigation.
 */
export function fullReset(): void {
  try {
    useAnalysis.getState().reset();
    useConsent.getState().revoke();
    useUnlock.getState().lock();
  } catch {
    // stores may not be initialized (SSR) — ignore
  }

  if (typeof window === "undefined") return;
  // Clear the persisted analysis blob (best-effort).
  void clearAnalysis();
  for (const key of DNAI_STORAGE_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // quota / privacy mode — ignore
    }
  }
  // Best-effort cleanup of any leftover dnai.* keys we may have forgotten.
  try {
    const leftover: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith("dnai.")) leftover.push(k);
    }
    leftover.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

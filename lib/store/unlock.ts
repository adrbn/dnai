"use client";

import { create } from "zustand";

// sha256 hashes of accepted promo codes (case-insensitive — compared against uppercased input)
// Current codes: CADUCEUS
const ACCEPTED_HASHES: readonly string[] = [
  "829853a0e1dd56cc08b5a03f899f4d8f69a806196c1f8b69916fe5df6290f4d0",
];

const STORAGE_KEY = "dnai.unlocked.v1";

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

type UnlockState = {
  unlocked: boolean;
  hydrated: boolean;
  hydrate: () => void;
  tryCode: (code: string) => Promise<boolean>;
  unlockPaid: () => void;
  lock: () => void;
};

export const useUnlock = create<UnlockState>((set) => ({
  unlocked: false,
  hydrated: false,
  hydrate: () => {
    if (typeof window === "undefined") return;
    const v = window.localStorage.getItem(STORAGE_KEY);
    set({ unlocked: v === "1", hydrated: true });
  },
  tryCode: async (code) => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return false;
    const h = await sha256Hex(normalized);
    const ok = ACCEPTED_HASHES.includes(h);
    if (ok) {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, "1");
      }
      set({ unlocked: true });
    }
    return ok;
  },
  unlockPaid: () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1");
    }
    set({ unlocked: true });
  },
  lock: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    set({ unlocked: false });
  },
}));

"use client";

import { useEffect, useState } from "react";

export type Lang = "fr" | "en";

const STORAGE_KEY = "dnai.lang";

function readStoredLang(): Lang {
  if (typeof window === "undefined") return "fr";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === "fr" || v === "en") return v;
  } catch {
    // ignore
  }
  // Fall back to browser preference on first visit.
  const nav = navigator.language?.toLowerCase() ?? "";
  if (nav.startsWith("en")) return "en";
  return "fr";
}

function writeStoredLang(lang: Lang): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore
  }
}

/**
 * Persisted language preference, shared across pages via localStorage.
 * Defaults to FR, but honors browser language and the user's last choice.
 *
 * Returns [lang, setLang, hydrated]. Pages that want to avoid an FR→EN flash
 * (or vice-versa) on cross-page navigation should gate their render on the
 * `hydrated` flag and show a neutral skeleton until then.
 */
export function useLang(): [Lang, (lang: Lang) => void, boolean] {
  const [lang, setLangState] = useState<Lang>("fr");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLangState(readStoredLang());
    setHydrated(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === "fr" || e.newValue === "en")) {
        setLangState(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setLang = (next: Lang) => {
    setLangState(next);
    writeStoredLang(next);
  };

  // During SSR / first paint we return "fr" to match the server output;
  // after the effect runs we surface the stored value. Callers that care
  // about avoiding the flash should read the `hydrated` flag.
  return [hydrated ? lang : "fr", setLang, hydrated];
}

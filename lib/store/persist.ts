"use client";

import type { AnalysisData } from "../types";

/**
 * IndexedDB persistence for the analysis result. Lets the user refresh /story
 * or /report (or come back next day on the same device) without re-importing
 * their file. The artifact stays 100% client-side — IDB is per-origin storage.
 *
 * Schema is intentionally minimal: a single record under a fixed key. We store
 * the structured `AnalysisData` shape (result + genotypes + positions) so it
 * round-trips through structured clone without custom serialization.
 */

const DB_NAME = "dnai";
const DB_VERSION = 1;
const STORE = "analysis";
const KEY = "current";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IDB open failed"));
  });
}

export async function saveAnalysis(data: AnalysisData): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(data, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("IDB write failed"));
    });
    db.close();
  } catch {
    // Quota exceeded, private mode, etc. — fail silently. Persistence is a
    // convenience; a missing save just means the user has to re-import.
  }
}

export async function loadAnalysis(): Promise<AnalysisData | null> {
  try {
    const db = await openDb();
    const data = await new Promise<AnalysisData | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve((req.result as AnalysisData | undefined) ?? null);
      req.onerror = () => reject(req.error ?? new Error("IDB read failed"));
    });
    db.close();
    return data;
  } catch {
    return null;
  }
}

export async function clearAnalysis(): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("IDB clear failed"));
    });
    db.close();
  } catch {
    // ignore
  }
}

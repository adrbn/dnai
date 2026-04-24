import type { Base, Genotype, GenotypeMap, NoCall } from "../types";
import { isNoCall } from "../types";

/**
 * Light-weight LD-proxy imputation.
 *
 * Real reference-panel imputation (Beagle/Impute5 on 1000 Genomes) is not
 * browser-tractable today — the panel is multi-gigabyte and the HMM is
 * compute-heavy. Instead we ship a small curated table of target→proxy
 * mappings (`public/data/ld-proxies.json`), each entry being a single
 * proxy SNP in tight LD (r² ≥ 0.85, EUR). When the target is missing
 * from the user's chip but the proxy is genotyped and informative, we
 * fill in the target genotype from the map.
 *
 * Imputed calls are added to the same GenotypeMap so downstream
 * annotation (PRS, traits, pharma) picks them up transparently. We
 * also return a parallel report describing what was imputed so the UI
 * can surface it honestly.
 */

export interface LDProxyEntry {
  target: string;
  proxy: string;
  r2: number;
  map: Record<string, string>; // sorted-allele diploid key → sorted-allele diploid value
  note?: string;
}

export interface LDProxyTable {
  _meta?: Record<string, unknown>;
  entries: LDProxyEntry[];
}

export interface ImputationReport {
  attempted: number;
  imputed: number;
  skippedAlreadyPresent: number;
  skippedProxyMissing: number;
  skippedProxyUnmapped: number;
  entries: Array<{
    target: string;
    proxy: string;
    r2: number;
    source: "imputed" | "skipped";
    reason?: string;
    proxyObserved?: string;
    imputedAs?: string;
  }>;
}

function sortAlleles(g: Genotype): string {
  return g.a1 <= g.a2 ? `${g.a1}${g.a2}` : `${g.a2}${g.a1}`;
}

function parseDiploid(s: string): Genotype | null {
  if (s.length !== 2) return null;
  const a1 = s[0] as Base;
  const a2 = s[1] as Base;
  if (!"ACGT".includes(a1) || !"ACGT".includes(a2)) return null;
  return { a1, a2 };
}

export function imputeGenotypes(
  genotypes: GenotypeMap,
  table: LDProxyTable,
): { genotypes: GenotypeMap; report: ImputationReport } {
  const report: ImputationReport = {
    attempted: 0,
    imputed: 0,
    skippedAlreadyPresent: 0,
    skippedProxyMissing: 0,
    skippedProxyUnmapped: 0,
    entries: [],
  };

  // Make a new map to keep the immutability contract — never mutate the input.
  const out: GenotypeMap = new Map(genotypes);

  for (const entry of table.entries) {
    report.attempted += 1;

    const existing = out.get(entry.target);
    if (existing && !isNoCall(existing)) {
      report.skippedAlreadyPresent += 1;
      continue;
    }

    const proxyG = out.get(entry.proxy);
    if (!proxyG || isNoCall(proxyG)) {
      report.skippedProxyMissing += 1;
      report.entries.push({
        target: entry.target,
        proxy: entry.proxy,
        r2: entry.r2,
        source: "skipped",
        reason: "proxy absent or no-call",
      });
      continue;
    }

    const proxyKey = sortAlleles(proxyG as Genotype);
    const mapped = entry.map[proxyKey];
    if (!mapped) {
      report.skippedProxyUnmapped += 1;
      report.entries.push({
        target: entry.target,
        proxy: entry.proxy,
        r2: entry.r2,
        source: "skipped",
        reason: `no mapping for proxy genotype ${proxyKey}`,
        proxyObserved: proxyKey,
      });
      continue;
    }

    const imputed = parseDiploid(mapped);
    if (!imputed) {
      report.skippedProxyUnmapped += 1;
      continue;
    }

    out.set(entry.target, imputed);
    report.imputed += 1;
    report.entries.push({
      target: entry.target,
      proxy: entry.proxy,
      r2: entry.r2,
      source: "imputed",
      proxyObserved: proxyKey,
      imputedAs: mapped,
    });
  }

  return { genotypes: out, report };
}

/**
 * IndexedDB-backed cache for the LD proxy table. Plain `fetch` already
 * benefits from the HTTP cache, but explicit IDB gives us offline support
 * and decouples us from browser cache policy. One-row single-store DB —
 * deliberately tiny.
 */
const DB_NAME = "dnai-impute-v1";
const STORE = "ld";
const KEY = "table";

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

export async function getCachedLDTable(): Promise<LDProxyTable | null> {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(KEY);
    req.onsuccess = () => resolve((req.result as LDProxyTable | undefined) ?? null);
    req.onerror = () => resolve(null);
  });
}

export async function cacheLDTable(table: LDProxyTable): Promise<void> {
  const db = await openDb();
  if (!db) return;
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(table, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

export async function loadLDTable(url: string): Promise<LDProxyTable> {
  const cached = await getCachedLDTable();
  if (cached) {
    // Kick off a background revalidation but return the cached copy now.
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((fresh: LDProxyTable | null) => {
        if (fresh) void cacheLDTable(fresh);
      })
      .catch(() => {});
    return cached;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch ${url} failed: ${res.status}`);
  const table = (await res.json()) as LDProxyTable;
  void cacheLDTable(table);
  return table;
}

export type { GenotypeMap, Genotype, NoCall };

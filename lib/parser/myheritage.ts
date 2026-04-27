import { unzipSync, gunzipSync, strFromU8 } from "fflate";
import { normalize } from "../genotype";
import { DnaSource, GenotypeMap, isNoCall } from "../types";

export type ParseOptions = {
  onProgress?: (percent: number) => void;
  filename?: string;
};

export type DensityMap = Record<string, number[]>;
export type PositionIndex = Record<string, { chr: string; pos: number }>;

export const DENSITY_BIN_SIZE = 1_000_000; // 1 Mb bins

export type ParseOutput = {
  genotypes: GenotypeMap;
  positions: PositionIndex;
  density: DensityMap;
  meta: {
    totalSNPs: number;
    noCalls: number;
    build: string;
    source: DnaSource;
  };
};

const BUILD_RE = /build\s*(\d+)/i;

function detectBuildFromHeader(lines: string[]): string {
  for (const line of lines) {
    if (!line.startsWith("#")) break;
    const m = line.match(BUILD_RE);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n === 37) return "GRCh37";
      if (n === 38) return "GRCh38";
    }
  }
  return "GRCh37"; // MyHeritage default historically
}

function detectSource(lines: string[], filename?: string): DnaSource {
  const headerBlob = lines
    .filter((l) => l.startsWith("#"))
    .slice(0, 30)
    .join("\n")
    .toLowerCase();
  const fn = (filename ?? "").toLowerCase();

  if (headerBlob.includes("myheritage") || fn.includes("myheritage")) return "myheritage";
  if (headerBlob.includes("23andme") || fn.includes("23andme")) return "23andme";
  if (headerBlob.includes("ancestrydna") || headerBlob.includes("ancestry.com") || fn.includes("ancestry"))
    return "ancestrydna";
  if (headerBlob.includes("living dna") || headerBlob.includes("livingdna") || fn.includes("living"))
    return "livingdna";
  if (headerBlob.includes("familytreedna") || headerBlob.includes("family tree dna") || fn.includes("ftdna"))
    return "ftdna";
  if (
    headerBlob.includes("genes for good") ||
    headerBlob.includes("genesforgood") ||
    fn.includes("genesforgood") ||
    fn.includes("genes_for_good")
  )
    return "genesforgood";
  if (headerBlob.includes("nebula") || fn.includes("nebula")) return "nebula";
  return "unknown";
}

function unquote(s: string): string {
  if (s.length >= 2 && s[0] === '"' && s[s.length - 1] === '"') {
    return s.slice(1, -1);
  }
  return s;
}

/**
 * Auto-detect field separator. MyHeritage uses ",", 23andMe / AncestryDNA /
 * FTDNA use tab. We look at the first non-comment, non-empty data line.
 */
function detectDelimiter(lines: string[]): "," | "\t" {
  for (const raw of lines) {
    if (!raw) continue;
    if (raw.startsWith("#")) continue;
    // skip the optional header line ("RSID,CHROMOSOME,..." or "rsid\tchromosome\t...")
    if (raw.toLowerCase().includes("rsid") || raw.toLowerCase().startsWith("# rsid")) continue;
    const tabs = (raw.match(/\t/g) ?? []).length;
    const commas = (raw.match(/,/g) ?? []).length;
    if (tabs >= 3 && tabs >= commas) return "\t";
    if (commas >= 3) return ",";
    // keep scanning if the first data line is ambiguous
  }
  // Default to comma to preserve historical behavior.
  return ",";
}

export async function parseMyHeritageText(
  text: string,
  opts: ParseOptions = {},
): Promise<ParseOutput> {
  const normalized = text.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const build = detectBuildFromHeader(lines);
  const source = detectSource(lines, opts.filename);
  const delim = detectDelimiter(lines);
  const genotypes: GenotypeMap = new Map();
  const positions: PositionIndex = {};
  const density: DensityMap = {};
  let noCalls = 0;
  let total = 0;
  let headerSeen = false;
  const totalLines = lines.length;

  for (let i = 0; i < totalLines; i++) {
    const raw = lines[i];
    if (!raw) continue;
    if (raw.startsWith("#")) continue;
    if (!headerSeen) {
      if (raw.toUpperCase().startsWith("RSID")) {
        headerSeen = true;
        continue;
      }
    }
    const cols = raw.split(delim);
    if (cols.length < 4) continue;
    const rsid = unquote(cols[0]).trim();
    const chr = unquote(cols[1]).trim().toUpperCase();
    const posN = parseInt(unquote(cols[2]).trim(), 10);
    const result = unquote(cols[3]).trim();
    if (!rsid) continue;
    const g = normalize(result);
    if (isNoCall(g)) noCalls++;
    genotypes.set(rsid, g);
    if (chr && !Number.isNaN(posN)) {
      positions[rsid] = { chr, pos: posN };
      const bin = Math.floor(posN / DENSITY_BIN_SIZE);
      const arr = density[chr] ?? (density[chr] = []);
      arr[bin] = (arr[bin] ?? 0) + 1;
    }
    total++;
    if (opts.onProgress && i % 10000 === 0) {
      opts.onProgress(i / totalLines);
    }
  }
  opts.onProgress?.(1);

  return {
    genotypes,
    positions,
    density,
    meta: { totalSNPs: total, noCalls, build, source },
  };
}

async function blobToText(blob: Blob): Promise<string> {
  const name = (blob as File).name ?? "";
  const buf = new Uint8Array(await blob.arrayBuffer());
  if (name.endsWith(".zip")) {
    const entries = unzipSync(buf);
    // Accept .csv (MyHeritage) or .txt (23andMe, AncestryDNA, FTDNA).
    const dataName =
      Object.keys(entries).find((k) => k.endsWith(".csv")) ??
      Object.keys(entries).find((k) => k.toLowerCase().endsWith(".txt"));
    if (!dataName) throw new Error("ZIP ne contient ni .csv ni .txt");
    return strFromU8(entries[dataName]);
  }
  if (name.endsWith(".gz") || name.endsWith(".csv.gz")) {
    return strFromU8(gunzipSync(buf));
  }
  return new TextDecoder().decode(buf);
}

export async function parseMyHeritageFile(
  file: File | Blob,
  opts: ParseOptions = {},
): Promise<ParseOutput> {
  const text = await blobToText(file);
  const name = (file as File).name ?? opts.filename;
  return parseMyHeritageText(text, { ...opts, filename: name });
}

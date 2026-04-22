import { unzipSync, gunzipSync, strFromU8 } from "fflate";
import { normalize } from "../genotype";
import { GenotypeMap, isNoCall } from "../types";

export type ParseOptions = {
  onProgress?: (percent: number) => void;
};

export type ParseOutput = {
  genotypes: GenotypeMap;
  meta: {
    totalSNPs: number;
    noCalls: number;
    build: string;
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

function unquote(s: string): string {
  if (s.length >= 2 && s[0] === '"' && s[s.length - 1] === '"') {
    return s.slice(1, -1);
  }
  return s;
}

export async function parseMyHeritageText(
  text: string,
  opts: ParseOptions = {},
): Promise<ParseOutput> {
  const normalized = text.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const build = detectBuildFromHeader(lines);
  const genotypes: GenotypeMap = new Map();
  let noCalls = 0;
  let total = 0;
  let headerSeen = false;
  const totalLines = lines.length;

  for (let i = 0; i < totalLines; i++) {
    const raw = lines[i];
    if (!raw) continue;
    if (raw.startsWith("#")) continue;
    if (!headerSeen) {
      // Header row "RSID,CHROMOSOME,POSITION,RESULT"
      if (raw.toUpperCase().startsWith("RSID")) {
        headerSeen = true;
        continue;
      }
    }
    const cols = raw.split(",");
    if (cols.length < 4) continue;
    const rsid = unquote(cols[0]).trim();
    // cols[1] chromosome, cols[2] position — not stored in the map to save RAM
    const result = unquote(cols[3]).trim();
    if (!rsid) continue;
    const g = normalize(result);
    if (isNoCall(g)) noCalls++;
    genotypes.set(rsid, g);
    total++;
    if (opts.onProgress && i % 10000 === 0) {
      opts.onProgress(i / totalLines);
    }
  }
  opts.onProgress?.(1);

  return {
    genotypes,
    meta: { totalSNPs: total, noCalls, build },
  };
}

async function blobToText(blob: Blob): Promise<string> {
  const name = (blob as File).name ?? "";
  const buf = new Uint8Array(await blob.arrayBuffer());
  if (name.endsWith(".zip")) {
    const entries = unzipSync(buf);
    const csvName = Object.keys(entries).find((k) => k.endsWith(".csv"));
    if (!csvName) throw new Error("ZIP ne contient pas de .csv");
    return strFromU8(entries[csvName]);
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
  return parseMyHeritageText(text, opts);
}

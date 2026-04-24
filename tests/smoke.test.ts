import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve, basename } from "node:path";
import { unzipSync, strFromU8 } from "fflate";
import { gunzipSync as nodeGunzipSync } from "node:zlib";
import { parseMyHeritageText } from "../lib/parser/myheritage";
import { parseVcfText, looksLikeVcf } from "../lib/parser/vcf";
import { annotateClinVar } from "../lib/annotation/clinvar";
import { annotatePharma } from "../lib/annotation/pharma";
import { annotateTraits } from "../lib/annotation/traits";
import { annotatePRS } from "../lib/annotation/prs";
import { computeROH } from "../lib/annotation/roh";
import type { ClinVarEntry, PGxRule, PRSRule, TraitRule } from "../lib/types";

const REAL_FILE = process.env.DNAI_REAL_FILE ?? "";

type Format = "myheritage-csv" | "tsv-23andme-like" | "vcf";

// V8 caps strings at ~512 MB. Full WGS VCFs decompress far beyond that and
// would also overwhelm the browser — the product targets chip arrays and
// reasonably-sized VCF exports, not raw WGS bgzips.
const MAX_TEXT_BYTES = 450 * 1024 * 1024;

/** Read the file, transparently decompress zip/gz, and classify the format. */
async function loadRealFile(
  path: string,
): Promise<{ text: string; format: Format; filename: string } | { skip: string }> {
  const filename = basename(path);
  const raw = new Uint8Array(readFileSync(path));

  let buf: Buffer;
  if (filename.endsWith(".zip")) {
    const entries = unzipSync(raw);
    const key =
      Object.keys(entries).find((k) => k.endsWith(".csv")) ??
      Object.keys(entries).find((k) => k.toLowerCase().endsWith(".txt")) ??
      Object.keys(entries).find((k) => k.toLowerCase().endsWith(".vcf")) ??
      Object.keys(entries)[0];
    buf = Buffer.from(strFromU8(entries[key]), "utf8");
  } else if (filename.endsWith(".gz")) {
    // Node's zlib handles multi-member gzip (bgzip) transparently; fflate does not.
    buf = nodeGunzipSync(raw);
  } else {
    buf = Buffer.from(raw);
  }

  if (buf.length > MAX_TEXT_BYTES) {
    return {
      skip: `decompressed payload is ${(buf.length / 1e6).toFixed(0)} MB — exceeds V8 string cap and realistic browser input`,
    };
  }

  const text = buf.toString("utf8");

  const head = text.slice(0, 4096);
  let format: Format;
  if (looksLikeVcf(filename, head) || head.startsWith("##fileformat=VCF")) {
    format = "vcf";
  } else if (head.toLowerCase().includes("23andme") || /\n[^#\n]*\t[^\t\n]*\t\d+\t/.test(head)) {
    format = "tsv-23andme-like";
  } else {
    format = "myheritage-csv";
  }

  return { text, format, filename };
}

describe.skipIf(!REAL_FILE || !existsSync(REAL_FILE))(`smoke: ${basename(REAL_FILE || "")}`, () => {
  it("runs full pipeline end-to-end on real data", async () => {
    const loaded = await loadRealFile(REAL_FILE);
    if ("skip" in loaded) {
      console.warn(`[smoke] Skipping ${basename(REAL_FILE)}: ${loaded.skip}`);
      return;
    }
    const { text, format, filename } = loaded;
    console.log("Detected format:", format);

    const parsed =
      format === "vcf"
        ? await parseVcfText(text, { filename })
        : await parseMyHeritageText(text, { filename });

    console.log("Parsed SNPs:", parsed.meta.totalSNPs);
    console.log("No-calls:", parsed.meta.noCalls);
    console.log("Build:", parsed.meta.build);
    console.log("Source detected:", parsed.meta.source);

    // Chip arrays carry ~500k+ SNPs; WGS VCFs carry millions — both must land > 100k.
    expect(parsed.meta.totalSNPs).toBeGreaterThan(100_000);

    const root = resolve(__dirname, "..");
    const pgxRules = JSON.parse(readFileSync(resolve(root, "public/data/pgx-rules.json"), "utf8")) as PGxRule[];
    const traitRules = JSON.parse(readFileSync(resolve(root, "public/data/traits-rules.json"), "utf8")) as TraitRule[];
    const prsRules = JSON.parse(readFileSync(resolve(root, "public/data/prs-rules.json"), "utf8")) as PRSRule[];
    const clinvarFull = JSON.parse(readFileSync(resolve(root, "public/data/clinvar-full.json"), "utf8")) as ClinVarEntry[];
    const clinvarSeed = JSON.parse(readFileSync(resolve(root, "public/data/clinvar-seed.json"), "utf8")) as ClinVarEntry[];
    const byRs = new Map<string, ClinVarEntry>();
    for (const e of clinvarFull) byRs.set(e.rs, e);
    for (const e of clinvarSeed) byRs.set(e.rs, e);
    const clinvarDb = Array.from(byRs.values());

    const clinvar = annotateClinVar(parsed.genotypes, clinvarDb);
    const pharma = annotatePharma(parsed.genotypes, pgxRules);
    const traits = annotateTraits(parsed.genotypes, traitRules);
    const prs = annotatePRS(parsed.genotypes, prsRules);
    const roh = computeROH(parsed.genotypes, parsed.positions);

    console.log("ClinVar findings:", clinvar.length);
    console.log("PGx findings:", pharma.findings.length, "→ drugs:", pharma.byDrug.length);
    console.log("Traits determined:", traits.filter((t) => t.result).length, "/", traits.length);
    console.log("PRS scores:", prs.length);
    for (const p of prs) {
      console.log(
        `  ${p.rule.trait}: z=${p.zScore.toFixed(2)} p${p.percentile.toFixed(0)}% (${p.matched}/${p.total} SNPs)`,
      );
    }
    console.log(
      "ROH: segments=",
      roh.totalSegments,
      "totalMb=",
      (roh.totalBp / 1e6).toFixed(1),
      "F_ROH=",
      (roh.fRoh * 100).toFixed(3) + "%",
    );

    expect(pharma.findings.length + traits.filter((t) => t.result).length).toBeGreaterThan(0);
    expect(prs.length).toBe(prsRules.length);
  }, 60000);
});

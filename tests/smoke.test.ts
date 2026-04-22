import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { unzipSync, strFromU8 } from "fflate";
import { parseMyHeritageText } from "../lib/parser/myheritage";
import { annotateClinVar } from "../lib/annotation/clinvar";
import { annotatePharma } from "../lib/annotation/pharma";
import { annotateTraits } from "../lib/annotation/traits";
import type { ClinVarEntry, PGxRule, TraitRule } from "../lib/types";

const REAL_FILE = "/Users/adrien/Downloads/ADN/BAPT/MyHeritage_raw_dna_data.zip";

describe.skipIf(!existsSync(REAL_FILE))("smoke: real MyHeritage file", () => {
  it("runs full pipeline end-to-end on real data", async () => {
    const buf = new Uint8Array(readFileSync(REAL_FILE));
    const entries = unzipSync(buf);
    const csvName = Object.keys(entries).find((k) => k.endsWith(".csv"))!;
    const text = strFromU8(entries[csvName]);

    const parsed = await parseMyHeritageText(text);
    expect(parsed.meta.totalSNPs).toBeGreaterThan(500000);

    const root = resolve(__dirname, "..");
    const pgxRules = JSON.parse(readFileSync(resolve(root, "public/data/pgx-rules.json"), "utf8")) as PGxRule[];
    const traitRules = JSON.parse(readFileSync(resolve(root, "public/data/traits-rules.json"), "utf8")) as TraitRule[];
    const clinvarDb = JSON.parse(readFileSync(resolve(root, "public/data/clinvar-seed.json"), "utf8")) as ClinVarEntry[];

    const clinvar = annotateClinVar(parsed.genotypes, clinvarDb);
    const pharma = annotatePharma(parsed.genotypes, pgxRules);
    const traits = annotateTraits(parsed.genotypes, traitRules);

    console.log("Parsed SNPs:", parsed.meta.totalSNPs);
    console.log("No-calls:", parsed.meta.noCalls);
    console.log("Build:", parsed.meta.build);
    console.log("ClinVar findings:", clinvar.length);
    console.log("PGx findings:", pharma.findings.length, "→ drugs:", pharma.byDrug.length);
    console.log("Traits determined:", traits.filter((t) => t.result).length, "/", traits.length);

    expect(pharma.findings.length + traits.filter((t) => t.result).length).toBeGreaterThan(0);
  }, 60000);
});

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { unzipSync, strFromU8 } from "fflate";
import { parseMyHeritageText } from "../lib/parser/myheritage";
import { annotateClinVar } from "../lib/annotation/clinvar";
import { annotatePharma } from "../lib/annotation/pharma";
import { annotateTraits } from "../lib/annotation/traits";
import { annotatePRS } from "../lib/annotation/prs";
import { computeROH } from "../lib/annotation/roh";
import type { ClinVarEntry, PGxRule, PRSRule, TraitRule } from "../lib/types";

const REAL_FILE = process.env.DNAI_REAL_FILE ?? "";

describe.skipIf(!REAL_FILE || !existsSync(REAL_FILE))("smoke: real MyHeritage file", () => {
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

    console.log("Parsed SNPs:", parsed.meta.totalSNPs);
    console.log("No-calls:", parsed.meta.noCalls);
    console.log("Build:", parsed.meta.build);
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

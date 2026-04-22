import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { parseMyHeritageText } from "./myheritage";
import { isNoCall } from "../types";

const MINI = fs.readFileSync(
  path.join(__dirname, "../../tests/fixtures/mini.csv"),
  "utf-8",
);

describe("parseMyHeritageText", () => {
  it("parses all rows from the fixture", async () => {
    const { genotypes, meta } = await parseMyHeritageText(MINI);
    expect(genotypes.size).toBe(22);
    expect(meta.totalSNPs).toBe(22);
  });

  it("detects build 37 from header", async () => {
    const { meta } = await parseMyHeritageText(MINI);
    expect(meta.build).toBe("GRCh37");
  });

  it("counts no-calls", async () => {
    const { meta } = await parseMyHeritageText(MINI);
    expect(meta.noCalls).toBe(1);
  });

  it("stores a known genotype correctly", async () => {
    const { genotypes } = await parseMyHeritageText(MINI);
    const g = genotypes.get("rs4988235"); // AG heterozygous
    expect(g).toBeDefined();
    if (g && !isNoCall(g)) {
      const pair = [g.a1, g.a2].sort().join("");
      expect(pair).toBe("AG");
    }
  });

  it("marks no-call genotype as nocall", async () => {
    const { genotypes } = await parseMyHeritageText(MINI);
    const g = genotypes.get("rs12562034");
    expect(g).toBeDefined();
    expect(g && isNoCall(g)).toBe(true);
  });

  it("calls progress callback monotonically", async () => {
    const progress: number[] = [];
    await parseMyHeritageText(MINI, {
      onProgress: (p) => progress.push(p),
    });
    expect(progress.length).toBeGreaterThan(0);
    for (let i = 1; i < progress.length; i++) {
      expect(progress[i]).toBeGreaterThanOrEqual(progress[i - 1]);
    }
    expect(progress[progress.length - 1]).toBe(1);
  });

  it("handles CRLF line endings", async () => {
    const crlf = MINI.replace(/\n/g, "\r\n");
    const { genotypes } = await parseMyHeritageText(crlf);
    expect(genotypes.size).toBe(22);
  });
});

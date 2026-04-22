import { describe, it, expect } from "vitest";
import { annotateTraits } from "./traits";
import { TraitRule } from "../types";
import { normalize } from "../genotype";

const mockTraits: TraitRule[] = [
  {
    id: "caffeine",
    title: "Caféine",
    gene: "CYP1A2",
    rsids: ["rs762551"],
    call_rules: [
      { when: { rs762551: "AA" }, result: { label: "Rapide", detail: "" } },
      { when: { rs762551: "AC" }, result: { label: "Intermédiaire", detail: "" } },
      { when: { rs762551: "CC" }, result: { label: "Lent", detail: "" } },
    ],
    confidence: "high",
    sources: [],
  },
  {
    id: "eye_color",
    title: "Yeux",
    gene: "HERC2",
    rsids: ["rs12913832", "rs1800407"],
    call_rules: [
      {
        when: { rs12913832: "AA", rs1800407: "CC" },
        result: { label: "Bruns", detail: "" },
      },
      {
        when: { rs12913832: "GG", rs1800407: "CC" },
        result: { label: "Bleus", detail: "" },
      },
    ],
    confidence: "medium",
    sources: [],
  },
];

describe("annotateTraits", () => {
  it("calls a single-rsID trait", () => {
    const genos = new Map([["rs762551", normalize("CC")]]);
    const out = annotateTraits(genos, mockTraits);
    const caf = out.find((x) => x.rule.id === "caffeine")!;
    expect(caf.result?.label).toBe("Lent");
  });

  it("handles multi-rsID AND logic", () => {
    const genos = new Map([
      ["rs12913832", normalize("GG")],
      ["rs1800407", normalize("CC")],
    ]);
    const out = annotateTraits(genos, mockTraits);
    const eye = out.find((x) => x.rule.id === "eye_color")!;
    expect(eye.result?.label).toBe("Bleus");
  });

  it("returns indeterminate when no rule matches", () => {
    const genos = new Map([["rs762551", normalize("TT")]]); // TT not in any rule
    const out = annotateTraits(genos, mockTraits);
    const caf = out.find((x) => x.rule.id === "caffeine")!;
    expect(caf.result).toBeNull();
  });

  it("returns indeterminate when rsID missing from genotypes", () => {
    const out = annotateTraits(new Map(), mockTraits);
    expect(out[0].result).toBeNull();
  });

  it("is order-invariant on genotype letters (AG == GA)", () => {
    const rule: TraitRule = {
      id: "x",
      title: "x",
      gene: "x",
      rsids: ["r"],
      call_rules: [
        { when: { r: "AG" }, result: { label: "hit", detail: "" } },
      ],
      confidence: "high",
      sources: [],
    };
    const genos = new Map([["r", normalize("GA")]]);
    const out = annotateTraits(genos, [rule]);
    expect(out[0].result?.label).toBe("hit");
  });
});

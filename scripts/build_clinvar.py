#!/usr/bin/env python3
"""Build a curated ClinVar subset (P / LP, review >= 2★) suitable for DNAI.

Usage
-----
    # Full build from ClinVar GRCh37 VCF. Needs network.
    python3 scripts/build_clinvar.py --out public/data/clinvar-full.json

    # Restrict to rsIDs present in a MyHeritage raw CSV (drastically smaller output)
    python3 scripts/build_clinvar.py --restrict-rsids user_snps.txt \
        --out public/data/clinvar-full.json

What it does
------------
1. Downloads (if needed) the ClinVar GRCh37 VCF + .tbi index from NCBI FTP.
2. Streams variants and keeps only:
   * CLNSIG in {Pathogenic, Likely_pathogenic, Pathogenic/Likely_pathogenic}
   * CLNREVSTAT star rating >= 2  (criteria_provided,multiple_submitters…)
   * Variant has an RS= tag (so it can be matched against consumer SNP arrays)
   * SNV only (ref and alt are single bases) — MyHeritage arrays don't type indels
3. Writes JSON matching `ClinVarEntry` in `lib/types.ts`.
"""

from __future__ import annotations

import argparse
import gzip
import json
import os
import sys
import urllib.request
from dataclasses import dataclass
from typing import Iterator

CLINVAR_VCF_URL = (
    "https://ftp.ncbi.nlm.nih.gov/pub/clinvar/vcf_GRCh37/clinvar.vcf.gz"
)
CACHE_VCF = os.path.join(os.path.dirname(__file__), ".cache", "clinvar_grch37.vcf.gz")

# CLNREVSTAT → review stars (ClinVar docs)
REVIEW_STARS = {
    "practice_guideline": 4,
    "reviewed_by_expert_panel": 3,
    "criteria_provided,_multiple_submitters,_no_conflicts": 2,
    "criteria_provided,_conflicting_interpretations": 1,
    "criteria_provided,_single_submitter": 1,
    "no_assertion_for_the_individual_variant": 0,
    "no_assertion_criteria_provided": 0,
    "no_assertion_provided": 0,
}

ACCEPT_SIG = {
    "Pathogenic": "P",
    "Likely_pathogenic": "LP",
    "Pathogenic/Likely_pathogenic": "P/LP",
    "Pathogenic|Likely_pathogenic": "P/LP",
}

BASES = {"A", "C", "G", "T"}


@dataclass
class Entry:
    rs: str
    gene: str
    condition: str
    sig: str
    ref: str
    alt: str
    rev: int
    href: str


def ensure_vcf(path: str) -> None:
    if os.path.exists(path):
        print(f"[cache] using {path}")
        return
    os.makedirs(os.path.dirname(path), exist_ok=True)
    print(f"[download] {CLINVAR_VCF_URL}")
    urllib.request.urlretrieve(CLINVAR_VCF_URL, path)
    print(f"[download] saved to {path}")


def parse_info(info: str) -> dict[str, str]:
    out: dict[str, str] = {}
    for kv in info.split(";"):
        if "=" in kv:
            k, v = kv.split("=", 1)
            out[k] = v
        else:
            out[kv] = ""
    return out


def iter_vcf(path: str) -> Iterator[Entry]:
    with gzip.open(path, "rt", encoding="utf-8", errors="replace") as fh:
        for line in fh:
            if line.startswith("#"):
                continue
            parts = line.rstrip("\n").split("\t")
            if len(parts) < 8:
                continue
            chrom, pos, _id, ref, alt, _qual, _filt, info = parts[:8]
            if ref not in BASES or alt not in BASES:
                continue  # SNV only
            tags = parse_info(info)
            sig_raw = tags.get("CLNSIG", "")
            sig = ACCEPT_SIG.get(sig_raw)
            if not sig:
                continue
            revstat = tags.get("CLNREVSTAT", "")
            stars = REVIEW_STARS.get(revstat, 0)
            if stars < 2:
                continue
            rs_raw = tags.get("RS", "")
            if not rs_raw:
                continue
            rs = f"rs{rs_raw.split(',')[0]}"
            gene_raw = tags.get("GENEINFO", "")
            gene = gene_raw.split(":", 1)[0] if gene_raw else ""
            if not gene:
                continue
            cond_raw = tags.get("CLNDN", "")
            condition = cond_raw.replace("_", " ").split("|")[0]
            if condition in {"", "not_provided", "not specified"}:
                condition = "Pathogenic variant (ClinVar)"
            variation_id = tags.get("ALLELEID", "")
            href = (
                f"https://www.ncbi.nlm.nih.gov/clinvar/variation/{variation_id}/"
                if variation_id
                else f"https://www.ncbi.nlm.nih.gov/snp/{rs}"
            )
            yield Entry(
                rs=rs,
                gene=gene,
                condition=condition[:160],
                sig=sig,
                ref=ref,
                alt=alt,
                rev=stars,
                href=href,
            )


def load_rsid_whitelist(path: str) -> set[str]:
    ws: set[str] = set()
    with open(path, "r", encoding="utf-8", errors="replace") as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            tok = line.split()[0].split(",")[0].strip().strip('"')
            if tok.lower().startswith("rs"):
                ws.add(tok)
    return ws


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True, help="Output JSON path")
    ap.add_argument(
        "--restrict-rsids",
        help="Optional text file with rsIDs (one per line or MyHeritage CSV). "
        "Output is filtered to rsIDs present in this file.",
    )
    ap.add_argument(
        "--vcf",
        default=CACHE_VCF,
        help=f"ClinVar VCF path (default: {CACHE_VCF})",
    )
    ap.add_argument(
        "--max",
        type=int,
        default=0,
        help="Optional cap on number of entries (0 = no cap)",
    )
    args = ap.parse_args()

    ensure_vcf(args.vcf)

    whitelist: set[str] | None = None
    if args.restrict_rsids:
        whitelist = load_rsid_whitelist(args.restrict_rsids)
        print(f"[filter] whitelist size = {len(whitelist):,}")

    entries: list[dict] = []
    seen_rs: set[str] = set()
    stats = {"scanned": 0, "kept": 0}
    for e in iter_vcf(args.vcf):
        stats["scanned"] += 1
        if whitelist is not None and e.rs not in whitelist:
            continue
        if e.rs in seen_rs:
            continue  # keep first occurrence — ClinVar may list multiple alts
        seen_rs.add(e.rs)
        entries.append(
            {
                "rs": e.rs,
                "gene": e.gene,
                "condition": e.condition,
                "sig": e.sig,
                "ref": e.ref,
                "alt": e.alt,
                "rev": e.rev,
                "href": e.href,
            }
        )
        stats["kept"] += 1
        if args.max and stats["kept"] >= args.max:
            break

    # Stable ordering: review stars desc → gene → rs
    entries.sort(key=lambda x: (-x["rev"], x["gene"], x["rs"]))

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(entries, fh, ensure_ascii=False, indent=0)

    print(f"[done] scanned={stats['scanned']:,} kept={stats['kept']:,}")
    print(f"[done] wrote {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

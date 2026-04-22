"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OverviewSection } from "@/components/sections/OverviewSection";
import { HealthSection } from "@/components/sections/HealthSection";
import { PharmaSection } from "@/components/sections/PharmaSection";
import { TraitsSection } from "@/components/sections/TraitsSection";
import { useAnalysis } from "@/lib/store/analysis";
import { exportJson } from "@/lib/export";

type Tab = "overview" | "health" | "pharma" | "traits";

const TABS: { key: Tab; label: string; emoji: string }[] = [
  { key: "overview", label: "Vue d'ensemble", emoji: "🗺️" },
  { key: "health", label: "Santé (ClinVar)", emoji: "⚕️" },
  { key: "pharma", label: "Pharmaco", emoji: "💊" },
  { key: "traits", label: "Traits", emoji: "🧬" },
];

export default function ReportPage() {
  const { result, reset } = useAnalysis();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (!result) router.replace("/");
  }, [result, router]);

  if (!result) return null;

  return (
    <main className="min-h-screen bg-grid">
      <nav className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur-md no-print">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-xs font-bold text-bg">
              N
            </div>
            <span className="text-sm font-semibold">DNAI</span>
          </Link>

          <div className="flex gap-1 rounded-xl border border-border bg-surface p-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                type="button"
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  tab === t.key
                    ? "bg-accent/15 text-accent shadow-[inset_0_0_0_1px_rgb(var(--accent)/0.3)]"
                    : "text-fg-muted hover:bg-surface-2 hover:text-fg"
                }`}
              >
                <span className="text-base">{t.emoji}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportJson(result)}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-fg-muted hover:border-accent hover:text-accent"
            >
              ⤓ JSON
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-fg-muted hover:border-accent hover:text-accent"
            >
              🖶 PDF
            </button>
            <button
              type="button"
              onClick={() => {
                reset();
                router.push("/");
              }}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-fg-muted hover:border-danger hover:text-danger"
            >
              ✕ Effacer
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="animate-fade-in">
          {tab === "overview" && <OverviewSection result={result} />}
          {tab === "health" && <HealthSection findings={result.clinvar} />}
          {tab === "pharma" && <PharmaSection byDrug={result.pharma.byDrug} />}
          {tab === "traits" && <TraitsSection findings={result.traits} />}
        </div>
      </div>
    </main>
  );
}

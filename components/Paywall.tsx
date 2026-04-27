"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUnlock } from "@/lib/store/unlock";

// Clinique palette (kept local to avoid coupling to landing page)
const CL = {
  paper: "#f3efe8",
  paperDk: "#e8e4da",
  ink: "#1a1613",
  muted: "#6b625a",
  line: "#d4cfc4",
  oxblood: "#6e1a1a",
  cobalt: "#1c3d78",
  sage: "#4a6b4a",
};

type PaywallProps = {
  lang?: "fr" | "en";
  /** Shown above the headline — e.g. "Rapport clinique", "Récit" */
  eyebrow?: string;
};

/**
 * Paywall screen — presented in place of the gated content when the user
 * hasn't paid and hasn't redeemed a code. Matches the Clinique aesthetic.
 */
export function Paywall({ lang = "fr", eyebrow }: PaywallProps) {
  const { tryCode } = useUnlock();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "error">("idle");
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (status !== "error") return;
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 420);
    return () => clearTimeout(t);
  }, [status]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setStatus("checking");
    const ok = await tryCode(code);
    if (!ok) {
      setStatus("error");
      setCode("");
    }
    // if ok, the Gate wrapper re-renders with the unlocked content.
  };

  const t =
    lang === "fr"
      ? {
          eyebrow: eyebrow ?? "Accès réservé",
          title: "Votre rapport est prêt.",
          sub: "Les résultats complets — variants, pharmaco, risques polygéniques, ascendance, récit — sont protégés derrière un accès unique. Paiement 100% client-side : aucune donnée ne quitte votre navigateur.",
          priceLabel: "Rapport complet",
          priceSub: "Sauvegardé sur cet appareil — rafraîchissez, fermez l'onglet, revenez demain. Vider les données du navigateur supprime le rapport.",
          priceBtn: "Déverrouiller · 29 €",
          priceSoon: "Paiement bientôt disponible",
          codeLabel: "Code d'accès",
          codePh: "saisir le code",
          codeBtn: "Déverrouiller",
          codeError: "Code invalide.",
          back: "← Retour",
          footnote:
            "Le code d'accès est destiné aux testeurs invités. Il débloque l'intégralité du rapport sur cet appareil.",
        }
      : {
          eyebrow: eyebrow ?? "Restricted access",
          title: "Your report is ready.",
          sub: "The full output — variants, pharmacogenomics, polygenic risk, ancestry, narrative — is gated behind a one-time access. Entirely client-side : no data leaves your browser.",
          priceLabel: "Complete report",
          priceSub: "Saved on this device — refresh, close the tab, come back tomorrow. Clearing browser data wipes the report.",
          priceBtn: "Unlock · €29",
          priceSoon: "Payment coming soon",
          codeLabel: "Access code",
          codePh: "enter code",
          codeBtn: "Unlock",
          codeError: "Invalid code.",
          back: "← Back",
          footnote:
            "The access code is for invited testers. It unlocks the full report on this device.",
        };

  return (
    <main
      className="min-h-screen"
      style={{ background: CL.paper, color: CL.ink, fontFamily: "var(--font-sans)" }}
    >
      {/* Slim nav */}
      <nav
        className="sticky top-0 z-30 backdrop-blur-sm"
        style={{
          background: `${CL.paper}e6`,
          borderBottom: `1px solid ${CL.line}`,
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-baseline gap-2">
            <span
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 22,
                letterSpacing: "-0.02em",
                fontWeight: 600,
              }}
            >
              dnai
              <span style={{ color: CL.oxblood }}>.</span>
            </span>
          </Link>
          <Link
            href="/"
            className="text-xs uppercase tracking-[0.18em]"
            style={{ color: CL.muted }}
          >
            {t.back}
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <div
          className="mb-6 text-[11px] uppercase tracking-[0.28em]"
          style={{ color: CL.oxblood }}
        >
          {t.eyebrow}
        </div>

        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(40px, 6vw, 64px)",
            lineHeight: 1.02,
            letterSpacing: "-0.025em",
            fontWeight: 500,
            margin: 0,
          }}
        >
          {t.title}
        </h1>

        <p
          className="mt-6 max-w-xl"
          style={{ color: CL.muted, fontSize: 15.5, lineHeight: 1.65 }}
        >
          {t.sub}
        </p>

        {/* Two-column: paid / code */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {/* Paid */}
          <div
            className="rounded-sm p-7"
            style={{ background: "#fff", border: `1px solid ${CL.line}` }}
          >
            <div
              className="text-[10px] uppercase tracking-[0.22em]"
              style={{ color: CL.muted }}
            >
              {t.priceLabel}
            </div>
            <div
              className="mt-3"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 44,
                letterSpacing: "-0.02em",
                fontWeight: 500,
              }}
            >
              29 <span style={{ color: CL.oxblood }}>€</span>
            </div>
            <div className="mt-2 text-sm" style={{ color: CL.muted }}>
              {t.priceSub}
            </div>
            <button
              type="button"
              disabled
              className="mt-6 w-full rounded-sm px-4 py-3 text-sm font-medium opacity-60"
              style={{
                background: CL.ink,
                color: CL.paper,
                cursor: "not-allowed",
              }}
              title={t.priceSoon}
            >
              {t.priceBtn}
            </button>
            <div
              className="mt-2 text-center text-[10px] uppercase tracking-[0.18em]"
              style={{ color: CL.muted }}
            >
              {t.priceSoon}
            </div>
          </div>

          {/* Code */}
          <form
            onSubmit={onSubmit}
            className="rounded-sm p-7"
            style={{ background: CL.paperDk, border: `1px solid ${CL.line}` }}
          >
            <div
              className="text-[10px] uppercase tracking-[0.22em]"
              style={{ color: CL.muted }}
            >
              {t.codeLabel}
            </div>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (status === "error") setStatus("idle");
              }}
              placeholder={t.codePh}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              className="mt-4 w-full rounded-sm px-3 py-3 text-[15px] outline-none transition"
              style={{
                background: "#fff",
                border: `1px solid ${status === "error" ? CL.oxblood : CL.line}`,
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.08em",
                color: CL.ink,
                transform: pulse ? "translateX(-2px)" : "none",
              }}
            />
            {status === "error" && (
              <div className="mt-2 text-xs" style={{ color: CL.oxblood }}>
                {t.codeError}
              </div>
            )}
            <button
              type="submit"
              disabled={status === "checking" || !code.trim()}
              className="mt-4 w-full rounded-sm px-4 py-3 text-sm font-medium transition disabled:opacity-50"
              style={{
                background: CL.oxblood,
                color: CL.paper,
              }}
            >
              {status === "checking" ? "…" : t.codeBtn}
            </button>
            <div
              className="mt-4 text-[11px] leading-relaxed"
              style={{ color: CL.muted }}
            >
              {t.footnote}
            </div>
          </form>
        </div>
      </section>

      <footer
        className="mx-auto max-w-6xl px-6 py-10 text-[11px] uppercase tracking-[0.18em]"
        style={{ color: CL.muted }}
      >
        DNAI · GRCh37/38 · ClinVar · CPIC · DPWG · PGS Catalog
      </footer>
    </main>
  );
}

/**
 * Hook helper: returns unlocked status and forces hydration on mount.
 * Use in client pages that need to render gated content.
 */
export function useUnlockGate() {
  const { unlocked, hydrated, hydrate } = useUnlock();
  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);
  return { unlocked, hydrated };
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useConsent } from "@/lib/store/consent";

/**
 * DisclaimerModal — clickwrap consent shown before the first analysis.
 * The user MUST check the three boxes before the "Accept and continue"
 * button activates. Once accepted, persists to localStorage until the
 * disclaimer version bumps.
 *
 * Renders nothing once accepted or if `open` is false.
 */
export function DisclaimerModal({
  open,
  onClose,
  onAccepted,
  lang = "fr",
}: {
  open: boolean;
  onClose: () => void;
  onAccepted: () => void;
  lang?: "fr" | "en";
}) {
  const { accept } = useConsent();
  const [ack, setAck] = useState({ notDiag: false, readTerms: false, grch: false });

  useEffect(() => {
    if (!open) setAck({ notDiag: false, readTerms: false, grch: false });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // prevent scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const allAcked = ack.notDiag && ack.readTerms && ack.grch;

  const t =
    lang === "fr"
      ? {
          eyebrow: "Avant de déposer votre fichier",
          title: "Ceci n'est pas un diagnostic médical.",
          intro:
            "DNAI est un outil éducatif qui annote un fichier ADN grand public (MyHeritage, 23andMe, Ancestry) avec des informations issues de la littérature scientifique (ClinVar, CPIC, DPWG, PGS Catalog). Avant de continuer, merci de confirmer :",
          boxes: {
            notDiag:
              "Je comprends que DNAI n'est pas un dispositif médical, ne pose aucun diagnostic, et ne remplace pas une consultation médicale ou un test génétique clinique.",
            grch:
              "Je comprends que les puces grand public ont un taux d'erreur non négligeable (jusqu'à 40 % de faux positifs sur les variants rares selon la littérature) et que les résultats doivent être confirmés par un laboratoire accrédité avant toute décision clinique.",
            readTerms: (
              <>
                J&apos;ai lu et j&apos;accepte les{" "}
                <Link href="/legal/terms" className="underline underline-offset-2" target="_blank">
                  Conditions d&apos;utilisation
                </Link>{" "}
                et la{" "}
                <Link
                  href="/legal/privacy"
                  className="underline underline-offset-2"
                  target="_blank"
                >
                  Politique de confidentialité
                </Link>
                .
              </>
            ),
          },
          privacy:
            "Traitement 100 % local : votre fichier ADN ne quitte jamais votre navigateur. Aucun serveur, aucun upload, aucune télémétrie sur vos données génétiques.",
          cancel: "Annuler",
          accept: "J'accepte et je continue →",
        }
      : {
          eyebrow: "Before you upload",
          title: "This is not a medical diagnosis.",
          intro:
            "DNAI is an educational tool that annotates a consumer DNA file (MyHeritage, 23andMe, Ancestry) with information drawn from the scientific literature (ClinVar, CPIC, DPWG, PGS Catalog). Before continuing, please confirm:",
          boxes: {
            notDiag:
              "I understand DNAI is not a medical device, does not make any diagnosis, and does not replace a medical consultation or a clinical genetic test.",
            grch:
              "I understand that consumer genotyping chips have a non-negligible error rate (up to 40 % false positives on rare variants per the literature) and that any result should be confirmed by an accredited lab before any clinical decision.",
            readTerms: (
              <>
                I have read and accept the{" "}
                <Link href="/legal/terms" className="underline underline-offset-2" target="_blank">
                  Terms of Use
                </Link>{" "}
                and the{" "}
                <Link
                  href="/legal/privacy"
                  className="underline underline-offset-2"
                  target="_blank"
                >
                  Privacy Policy
                </Link>
                .
              </>
            ),
          },
          privacy:
            "100% local processing: your DNA file never leaves your browser. No servers, no upload, no telemetry on your genetic data.",
          cancel: "Cancel",
          accept: "Accept and continue →",
        };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-ink/60 px-4 py-8 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-sm border border-ink/15 bg-paper p-6 shadow-2xl sm:p-10"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dnai-disclaimer-title"
      >
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-oxblood">
          {t.eyebrow}
        </div>
        <h2
          id="dnai-disclaimer-title"
          className="font-serif text-[32px] font-medium leading-[1.05] tracking-[-0.02em] text-ink sm:text-[40px]"
        >
          {t.title}
        </h2>
        <p className="mt-4 text-[14.5px] leading-relaxed text-ink/75">{t.intro}</p>

        <div className="mt-6 space-y-3">
          <CheckRow
            checked={ack.notDiag}
            onChange={(v) => setAck((s) => ({ ...s, notDiag: v }))}
          >
            {t.boxes.notDiag}
          </CheckRow>
          <CheckRow checked={ack.grch} onChange={(v) => setAck((s) => ({ ...s, grch: v }))}>
            {t.boxes.grch}
          </CheckRow>
          <CheckRow
            checked={ack.readTerms}
            onChange={(v) => setAck((s) => ({ ...s, readTerms: v }))}
          >
            {t.boxes.readTerms}
          </CheckRow>
        </div>

        <div className="mt-6 border-l-2 border-sage bg-sage/10 px-4 py-3 text-[12px] leading-relaxed text-ink/70">
          {t.privacy}
        </div>

        <div className="mt-7 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm border border-ink/20 bg-paper px-5 py-3 text-sm font-medium text-ink/70 transition hover:bg-ink/5"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            disabled={!allAcked}
            onClick={() => {
              accept();
              onAccepted();
            }}
            className="rounded-sm border border-ink bg-ink px-5 py-3 text-sm font-medium text-paper transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:border-ink/20 disabled:bg-ink/20 disabled:text-ink/40"
          >
            {t.accept}
          </button>
        </div>
      </div>
    </div>
  );
}

function CheckRow({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-sm border border-ink/10 bg-paper p-3 transition hover:bg-ink/[0.03]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-oxblood"
      />
      <span className="text-[13.5px] leading-snug text-ink/80">{children}</span>
    </label>
  );
}

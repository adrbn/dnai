"use client";

import { useEffect, useRef, useState } from "react";

export interface PdfUserInfo {
  firstName: string;
  lastName: string;
  birthDate: string; // ISO yyyy-mm-dd
  sex: "" | "F" | "M" | "X";
  email: string;
  reportFor: string;
  doctorName: string;
  notes: string;
  showFileHash: boolean;
  includeDisclaimer: boolean;
}

export const EMPTY_PDF_INFO: PdfUserInfo = {
  firstName: "",
  lastName: "",
  birthDate: "",
  sex: "",
  email: "",
  reportFor: "",
  doctorName: "",
  notes: "",
  showFileHash: true,
  includeDisclaimer: true,
};

interface Props {
  open: boolean;
  initial: PdfUserInfo;
  onCancel: () => void;
  onConfirm: (info: PdfUserInfo) => void;
}

const STORAGE_KEY = "dnai.pdf.info.v1";

export function loadSavedPdfInfo(): PdfUserInfo {
  if (typeof window === "undefined") return EMPTY_PDF_INFO;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_PDF_INFO;
    const parsed = JSON.parse(raw);
    return { ...EMPTY_PDF_INFO, ...parsed };
  } catch {
    return EMPTY_PDF_INFO;
  }
}

function savePdfInfo(info: PdfUserInfo): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function PdfOptionsModal({ open, initial, onCancel, onConfirm }: Props) {
  const [info, setInfo] = useState<PdfUserInfo>(initial);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setInfo(initial);
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => firstFieldRef.current?.focus(), 80);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onCancel]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    savePdfInfo(info);
    onConfirm(info);
  };

  const set = <K extends keyof PdfUserInfo>(k: K, v: PdfUserInfo[K]) =>
    setInfo((prev) => ({ ...prev, [k]: v }));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-4 backdrop-blur-sm no-print"
      onClick={onCancel}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="glass relative flex max-h-[90vh] w-[min(92vw,640px)] flex-col overflow-hidden rounded-2xl shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            <h2 id="pdf-modal-title" className="text-lg font-semibold tracking-tight">
              Personnaliser votre rapport PDF
            </h2>
            <p className="mt-0.5 text-xs text-fg-muted">
              Ces informations figureront en en-tête du PDF. Tout reste local dans votre navigateur.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Fermer"
            className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-fg-muted hover:border-danger hover:text-danger"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <fieldset>
            <legend className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
              Identité
            </legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Prénom">
                <input
                  ref={firstFieldRef}
                  type="text"
                  value={info.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                  placeholder="Marie"
                  className={inputCls}
                />
              </Field>
              <Field label="Nom">
                <input
                  type="text"
                  value={info.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                  placeholder="Dupont"
                  className={inputCls}
                />
              </Field>
              <Field label="Date de naissance">
                <input
                  type="date"
                  value={info.birthDate}
                  onChange={(e) => set("birthDate", e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Sexe">
                <select
                  value={info.sex}
                  onChange={(e) => set("sex", e.target.value as PdfUserInfo["sex"])}
                  className={inputCls}
                >
                  <option value="">—</option>
                  <option value="F">Féminin</option>
                  <option value="M">Masculin</option>
                  <option value="X">Non précisé</option>
                </select>
              </Field>
            </div>
          </fieldset>

          <fieldset className="mt-6">
            <legend className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
              Contexte
            </legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="E-mail (optionnel)">
                <input
                  type="email"
                  value={info.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="marie@exemple.fr"
                  className={inputCls}
                />
              </Field>
              <Field label="Destinataire / consultation">
                <input
                  type="text"
                  value={info.reportFor}
                  onChange={(e) => set("reportFor", e.target.value)}
                  placeholder="Consultation de génétique"
                  className={inputCls}
                />
              </Field>
              <Field label="Médecin référent" className="sm:col-span-2">
                <input
                  type="text"
                  value={info.doctorName}
                  onChange={(e) => set("doctorName", e.target.value)}
                  placeholder="Dr. Martin"
                  className={inputCls}
                />
              </Field>
              <Field label="Notes personnelles" className="sm:col-span-2">
                <textarea
                  value={info.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder="Antécédents, contexte, questions pour le médecin…"
                  rows={3}
                  className={`${inputCls} resize-y`}
                />
              </Field>
            </div>
          </fieldset>

          <fieldset className="mt-6">
            <legend className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
              Options du document
            </legend>
            <div className="space-y-2">
              <Toggle
                label="Afficher l'empreinte du fichier (hash SHA)"
                checked={info.showFileHash}
                onChange={(v) => set("showFileHash", v)}
              />
              <Toggle
                label="Inclure l'avertissement médical"
                checked={info.includeDisclaimer}
                onChange={(v) => set("includeDisclaimer", v)}
              />
            </div>
          </fieldset>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-border bg-surface/40 px-6 py-3">
          <p className="text-[11px] text-fg-muted">
            Astuce : l'impression en <span className="text-fg">A4, couleurs activées</span> donne le
            meilleur rendu.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-fg-muted hover:border-fg hover:text-fg"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="rounded-lg border border-accent/40 bg-accent/15 px-4 py-1.5 text-xs font-semibold text-accent shadow-[inset_0_0_0_1px_rgb(var(--accent)/0.3)] hover:bg-accent/25"
            >
              Générer le PDF
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[10px] font-medium uppercase tracking-wider text-fg-muted">{label}</span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-surface/40 px-3 py-2 text-sm hover:border-fg/30">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-border bg-surface accent-accent"
      />
      <span className="text-fg">{label}</span>
    </label>
  );
}

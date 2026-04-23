"use client";

import { useEffect, useState } from "react";
import { uniprotForGene } from "@/lib/gene-uniprot";

interface ProteinViewerProps {
  gene: string;
  onClose?: () => void;
}

const STORAGE_KEY = "dnai:alphafold-opt-in";

export function ProteinViewer({ gene, onClose }: ProteinViewerProps) {
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const uniprot = uniprotForGene(gene);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      setAccepted(v === "1" ? true : v === "0" ? false : null);
    } catch {
      setAccepted(null);
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setAccepted(true);
  };

  const decline = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "0");
    } catch {}
    setAccepted(false);
    onClose?.();
  };

  if (!uniprot) {
    return (
      <div className="rounded-xl border border-border bg-surface-2/40 p-6 text-center text-sm text-fg-muted">
        Aucune structure 3D mappée pour <span className="font-mono text-fg">{gene}</span>.
      </div>
    );
  }

  if (accepted === null) {
    return (
      <div className="rounded-xl border border-warn/30 bg-warn/5 p-5 text-sm">
        <div className="mb-2 font-semibold text-warn">🔒 Activer le viewer 3D ?</div>
        <p className="text-fg-muted">
          Afficher la structure 3D de <span className="font-mono text-fg">{gene}</span> nécessite
          de charger le viewer <strong>Mol*</strong> (molstar.org) et le modèle prédit depuis
          <strong> alphafold.ebi.ac.uk</strong> (EMBL-EBI). Aucune donnée ADN personnelle
          n'est envoyée — seulement l'identifiant UniProt public.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={accept}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-bg hover:opacity-90"
          >
            Activer (une fois pour toutes)
          </button>
          <button
            type="button"
            onClick={decline}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-fg-muted hover:border-border/80"
          >
            Non merci
          </button>
        </div>
      </div>
    );
  }

  if (accepted === false) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2/40 p-3 text-sm text-fg-muted">
        <span>Viewer 3D désactivé.</span>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.removeItem(STORAGE_KEY);
            } catch {}
            setAccepted(null);
          }}
          className="text-xs text-accent hover:underline"
        >
          Réactiver
        </button>
      </div>
    );
  }

  const cifUrl = `https://alphafold.ebi.ac.uk/files/AF-${uniprot}-F1-model_v4.cif`;
  const molstarSrc = `https://molstar.org/viewer/?afdb=${uniprot}&hide-controls=1`;
  const afPage = `https://alphafold.ebi.ac.uk/entry/${uniprot}`;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-black">
      <div className="flex items-center justify-between border-b border-border bg-surface-2/60 px-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono text-accent">{gene}</span>
          <span className="text-fg-muted">UniProt</span>
          <a
            href={`https://www.uniprot.org/uniprotkb/${uniprot}`}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-fg hover:underline"
          >
            {uniprot}
          </a>
          <span className="text-fg-muted">· Mol* viewer · modèle AlphaFold v4</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={cifUrl}
            target="_blank"
            rel="noreferrer"
            className="text-fg-muted hover:text-accent hover:underline"
          >
            .cif
          </a>
          <a
            href={afPage}
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:underline"
          >
            AlphaFold ↗
          </a>
        </div>
      </div>
      <iframe
        title={`Mol* viewer ${gene}`}
        src={molstarSrc}
        className="h-[560px] w-full bg-black"
        loading="lazy"
        referrerPolicy="no-referrer"
        allow="fullscreen"
      />
    </div>
  );
}

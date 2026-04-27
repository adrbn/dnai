"use client";

import { useEffect, useRef, useState } from "react";

interface MoleculeViewerProps {
  /** Drug INN, e.g. "warfarin", "capecitabine". Looked up on PubChem. */
  drug: string;
  onClose?: () => void;
  height?: number;
}

interface PubChemHit {
  cid: number;
}

/**
 * Renders a 3D molecule viewer for a drug, sourced from NIH PubChem.
 *
 * Strategy:
 *   1. Resolve INN → CID via PubChem PUG REST (CORS-enabled).
 *   2. Embed the PubChem 3D viewer (<iframe>) for that CID.
 *
 * Falls back to a still 2D structure image if no 3D conformer exists.
 */
export function MoleculeViewer({ drug, onClose, height = 360 }: MoleculeViewerProps) {
  const [cid, setCid] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    setCid(null);
    setError(null);
    const slug = drug.trim().toLowerCase();
    if (!slug) return;
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(slug)}/cids/JSON`;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`PubChem ${r.status}`);
        return r.json();
      })
      .then((data: { IdentifierList?: { CID?: number[] } }) => {
        if (cancelled.current) return;
        const first = data.IdentifierList?.CID?.[0];
        if (typeof first !== "number") {
          setError("Aucune molécule trouvée");
          return;
        }
        setCid(first);
      })
      .catch((e: unknown) => {
        if (cancelled.current) return;
        setError(e instanceof Error ? e.message : "Erreur réseau");
      });
    return () => {
      cancelled.current = true;
    };
  }, [drug]);

  return (
    <div className="rounded-lg border border-border bg-surface-2/40 p-2">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-fg-muted">
          Molécule 3D · <span className="font-mono capitalize">{drug}</span>
          {cid && (
            <span className="ml-2 text-fg-muted/70">CID {cid}</span>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-fg-muted hover:text-danger"
          >
            ✕
          </button>
        )}
      </div>
      {error && (
        <div className="flex h-[120px] items-center justify-center text-xs text-fg-muted">
          {error}
        </div>
      )}
      {!error && !cid && (
        <div className="flex h-[120px] items-center justify-center text-xs text-fg-muted">
          Chargement…
        </div>
      )}
      {cid && (
        <>
          <iframe
            title={`Molécule 3D ${drug}`}
            src={`https://pubchem.ncbi.nlm.nih.gov/compound/${cid}#section=3D-Conformer&embed=true`}
            style={{ width: "100%", height, border: 0, borderRadius: 8 }}
            allow="fullscreen"
            sandbox="allow-scripts allow-same-origin"
          />
          <div className="mt-2 flex items-center gap-3 text-[11px] text-fg-muted">
            <a
              href={`https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-accent hover:underline"
            >
              PubChem ↗
            </a>
            <a
              href={`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/PNG?image_size=large`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-accent hover:underline"
            >
              Structure 2D ↗
            </a>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useCallback, useRef, useState } from "react";

interface FileDropperProps {
  onFile: (file: File) => void;
  accept?: string;
}

export function FileDropper({ onFile, accept = ".zip,.csv,.gz" }: FileDropperProps) {
  const [hot, setHot] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    (ev: React.DragEvent<HTMLDivElement>) => {
      ev.preventDefault();
      setHot(false);
      const f = ev.dataTransfer.files?.[0];
      if (f) onFile(f);
    },
    [onFile],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setHot(true);
      }}
      onDragLeave={() => setHot(false)}
      onDrop={onDrop}
      className={`group relative flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-8 py-14 text-center transition ${
        hot
          ? "border-accent bg-accent/5 shadow-[0_0_60px_-15px_rgb(var(--accent)/0.5)]"
          : "border-border bg-surface/60 hover:border-accent/60 hover:bg-surface"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent ring-1 ring-accent/30 transition group-hover:scale-110">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>
      <div className="text-lg font-semibold text-fg">Glissez votre fichier MyHeritage</div>
      <div className="mt-1 text-sm text-fg-muted">
        .zip, .csv ou .csv.gz — l'analyse se fait <span className="text-accent">dans votre navigateur</span>
      </div>
      <div className="mt-3 text-xs text-fg-muted/80">Aucune donnée envoyée sur Internet</div>
    </div>
  );
}

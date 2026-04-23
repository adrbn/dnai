"use client";

import { useCallback, useRef, useState } from "react";

interface FileDropperProps {
  onFile: (file: File) => void;
  accept?: string;
}

export function FileDropper({ onFile, accept = ".zip,.csv,.gz,.vcf,.vcf.gz" }: FileDropperProps) {
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
      className={`group relative flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-10 text-center transition sm:px-8 sm:py-14 ${
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
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent ring-1 ring-accent/30 transition group-hover:scale-110 sm:mb-4 sm:h-14 sm:w-14">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="sm:h-[26px] sm:w-[26px]">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>
      <div className="text-base font-semibold text-fg sm:text-lg">
        <span className="sm:hidden">Choisir un fichier ADN</span>
        <span className="hidden sm:inline">Glissez votre fichier ADN</span>
      </div>
      <div className="mt-1 text-xs text-fg-muted sm:text-sm">
        <span className="sm:hidden">MyHeritage · 23andMe · Ancestry · VCF</span>
        <span className="hidden sm:inline">
          MyHeritage · 23andMe · AncestryDNA · VCF — <span className="text-accent">jamais transmis</span>
        </span>
      </div>
    </div>
  );
}

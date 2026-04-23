"use client";

import dynamic from "next/dynamic";

interface DNAHelixProps {
  className?: string;
  rungs?: number;
}

const DNAHelix3D = dynamic(() => import("./DNAHelix3D").then((m) => m.DNAHelix3D), {
  ssr: false,
  loading: () => <div className="h-full w-full" />,
});

export function DNAHelix({ className = "", rungs = 36 }: DNAHelixProps) {
  return (
    <div className={className || "relative h-full w-full"} aria-hidden>
      <DNAHelix3D rungs={rungs} />
    </div>
  );
}

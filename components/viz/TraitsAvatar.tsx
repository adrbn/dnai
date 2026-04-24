"use client";

import type { TraitFinding } from "@/lib/types";

interface TraitsAvatarProps {
  findings: TraitFinding[];
  size?: number;
}

/**
 * Cartoon SVG avatar driven by determined traits. Reads a handful of
 * phenotype traits (eye color, hair red, freckles, earwax, cilantro) and
 * paints them onto a neutral face. Missing/indeterminate traits fall back
 * to visually neutral defaults so the avatar never looks broken.
 */
export function TraitsAvatar({ findings, size = 260 }: TraitsAvatarProps) {
  const byId = new Map(findings.filter((f) => f.result).map((f) => [f.rule.id, f]));

  const eyeLabel = byId.get("eye_color")?.result?.label ?? "";
  const eye = eyeLabel.includes("bleus")
    ? { iris: "#6aa4d6", label: "Bleus" }
    : eyeLabel.includes("intermédiaires")
      ? { iris: "#7c9668", label: "Noisette" }
      : eyeLabel.includes("bruns")
        ? { iris: "#6b3f1d", label: "Bruns" }
        : { iris: "#4a4a4a", label: "—" };

  const hairRedLabel = byId.get("hair_red")?.result?.label ?? "";
  const isStrongRed = hairRedLabel.includes("R151C/R151C");
  const isCarrierRed = hairRedLabel.includes("Porteur");
  const hair = isStrongRed
    ? { color: "#b94a16", label: "Roux" }
    : isCarrierRed
      ? { color: "#8a4a2a", label: "Auburn possible" }
      : { color: "#2b1c14", label: "Foncé probable" };

  const frecklesLabel = byId.get("freckles")?.result?.label ?? "";
  const hasFreckles = /présent|likely|forte/i.test(frecklesLabel) || isStrongRed;

  const earwaxLabel = byId.get("earwax_type")?.result?.label ?? "";
  const earwaxDry = earwaxLabel.includes("sec");

  const cilantroLabel = byId.get("cilantro_soap")?.result?.label ?? "";
  const cilantroSoap = cilantroLabel.includes("savonneux");

  const bitterLabel = byId.get("bitter_taste")?.result?.label ?? "";
  const superTaster = bitterLabel.includes("intense") || bitterLabel.includes("PAV/PAV");

  // Skin tone proxy: red hair → very pale; otherwise neutral warm beige
  const skin = isStrongRed ? "#f4d9c6" : isCarrierRed ? "#efcdb5" : "#e7c2a6";

  const s = size;
  const cx = s / 2;

  return (
    <figure className="flex flex-col items-center" aria-label="Avatar généré depuis vos traits">
      <svg
        viewBox="0 0 260 300"
        width={s}
        height={(s * 300) / 260}
        className="drop-shadow-sm"
        role="img"
      >
        {/* Hair back */}
        <path
          d="M 65 110 Q 60 40 130 35 Q 200 40 195 110 L 195 170 Q 175 150 130 150 Q 85 150 65 170 Z"
          fill={hair.color}
        />
        {/* Neck */}
        <rect x="105" y="210" width="50" height="40" rx="10" fill={skin} />
        {/* Face */}
        <ellipse cx={cx} cy="140" rx="62" ry="72" fill={skin} />
        {/* Ears */}
        <ellipse cx="68" cy="150" rx="10" ry="16" fill={skin} />
        <ellipse cx="192" cy="150" rx="10" ry="16" fill={skin} />
        {earwaxDry && (
          <>
            <circle cx="68" cy="152" r="2.5" fill="#d8c6a0" />
            <circle cx="192" cy="152" r="2.5" fill="#d8c6a0" />
          </>
        )}
        {!earwaxDry && (
          <>
            <circle cx="68" cy="152" r="2.5" fill="#b68748" opacity="0.7" />
            <circle cx="192" cy="152" r="2.5" fill="#b68748" opacity="0.7" />
          </>
        )}
        {/* Hair front (fringe) */}
        <path
          d="M 75 105 Q 100 70 130 75 Q 160 70 185 105 Q 170 95 150 97 Q 130 85 110 97 Q 90 95 75 105 Z"
          fill={hair.color}
        />
        {/* Freckles */}
        {hasFreckles &&
          [
            [105, 148], [115, 152], [125, 150], [135, 148], [145, 152], [155, 150],
            [100, 162], [110, 160], [150, 160], [160, 162],
          ].map(([fx, fy], i) => (
            <circle key={i} cx={fx} cy={fy} r="1.6" fill="#9a5a3a" opacity="0.65" />
          ))}
        {/* Eyebrows */}
        <path d="M 95 130 Q 108 124 122 130" stroke={hair.color} strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M 138 130 Q 152 124 165 130" stroke={hair.color} strokeWidth="3.5" fill="none" strokeLinecap="round" />
        {/* Eyes */}
        {[108, 152].map((ex) => (
          <g key={ex}>
            <ellipse cx={ex} cy="148" rx="9" ry="7" fill="white" />
            <circle cx={ex} cy="148" r="5.5" fill={eye.iris} />
            <circle cx={ex} cy="148" r="2.4" fill="#0f0a08" />
            <circle cx={ex - 1.5} cy="146.5" r="1" fill="white" />
          </g>
        ))}
        {/* Nose */}
        <path d="M 130 156 Q 126 175 132 182 Q 138 180 136 172" stroke="#b8876a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* Mouth — super-taster grimaces faintly; cilantro-soap slight frown */}
        {superTaster ? (
          <path d="M 115 196 Q 130 188 145 196" stroke="#8a3b3b" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        ) : cilantroSoap ? (
          <path d="M 115 198 Q 130 202 145 198" stroke="#8a3b3b" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M 115 194 Q 130 204 145 194" stroke="#8a3b3b" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        )}
      </svg>
      <figcaption className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-fg-muted">
        <Row label="Yeux" value={eye.label} />
        <Row label="Cheveux" value={hair.label} />
        <Row label="Taches" value={hasFreckles ? "Présentes" : "Peu probables"} />
        <Row label="Cérumen" value={earwaxDry ? "Sec" : "Humide"} />
        <Row label="Coriandre" value={cilantroSoap ? "Savonneux" : "Normal"} />
        <Row label="Amertume" value={superTaster ? "Intense" : "Modérée"} />
      </figcaption>
    </figure>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-border/40 py-0.5">
      <span className="text-[10px] uppercase tracking-wider text-fg-muted/80">{label}</span>
      <span className="font-mono text-fg">{value}</span>
    </div>
  );
}

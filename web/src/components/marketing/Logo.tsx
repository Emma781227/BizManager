import Link from "next/link";

type LogoProps = {
  /** Taille du bloc-marque en pixels. */
  size?: number;
  /** Masquer le mot-clé sur petits écrans. */
  responsiveWordmark?: boolean;
  className?: string;
};

/**
 * Marque BizManager : un monogramme géométrique (trois barres ascendantes)
 * plutôt qu'un carré avec des initiales. Dessiné à la main, pas d'export Figma.
 */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-[0.625rem] bg-brand-600"
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.55}
        height={size * 0.55}
        viewBox="0 0 20 20"
        fill="none"
        role="presentation"
      >
        <rect x="2" y="11" width="4" height="7" rx="1.25" fill="#fff" fillOpacity="0.65" />
        <rect x="8" y="7" width="4" height="11" rx="1.25" fill="#fff" fillOpacity="0.85" />
        <rect x="14" y="2" width="4" height="16" rx="1.25" fill="#fff" />
      </svg>
    </span>
  );
}

export default function Logo({ size = 36, responsiveWordmark = false, className = "" }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span
        className={`text-[1.0625rem] font-bold tracking-tight text-ink-900 ${
          responsiveWordmark ? "hidden min-[420px]:inline" : ""
        }`}
      >
        BizManager
      </span>
    </Link>
  );
}

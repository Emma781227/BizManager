/**
 * Classes partagées des pages publiques (landing + pages légales).
 * Centralisées ici pour que boutons, cartes et conteneurs restent
 * identiques d'une page à l'autre.
 */

export const container = "mx-auto w-full max-w-[76rem] px-5 sm:px-6 lg:px-8";

export const btnBase =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold " +
  "transition-colors duration-150 disabled:pointer-events-none disabled:opacity-60";

export const btnPrimary =
  `${btnBase} bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800`;

export const btnSecondary =
  `${btnBase} border border-ink-200 bg-white text-ink-800 hover:border-ink-300 hover:bg-ink-50`;

export const btnGhost =
  `${btnBase} text-ink-600 hover:bg-ink-100 hover:text-ink-900`;

/** Tailles : à combiner avec une variante ci-dessus. */
export const btnSm = "h-9 px-3.5 text-[0.8125rem]";
export const btnMd = "h-11 px-5 text-[0.9375rem]";
export const btnLg = "h-[3.25rem] px-6 text-[0.9375rem]";

export const card =
  "rounded-xl border border-ink-200 bg-white shadow-xs";

export const eyebrow =
  "text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-brand-700";

export const sectionTitle =
  "text-[1.75rem] font-bold tracking-tight text-ink-900 sm:text-[2.125rem]";

export const sectionLead =
  "mt-3 text-base leading-relaxed text-ink-500 sm:text-[1.0625rem]";

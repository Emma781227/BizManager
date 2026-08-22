import Link from "next/link";
import Logo from "./Logo";
import { btnPrimary, btnSecondary, btnSm, container } from "./ui";

const NAV = [
  { href: "/#features", label: "Fonctionnalités" },
  { href: "/#how", label: "Comment ça marche" },
  { href: "/#pricing", label: "Tarifs" },
  { href: "/#faq", label: "FAQ" },
];

export default function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink-200 bg-white/85 backdrop-blur-md">
      <div className={`${container} flex h-16 items-center justify-between gap-6`}>
        <Logo size={34} responsiveWordmark />

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login" className={`${btnSecondary} ${btnSm}`}>
            Se connecter
          </Link>
          <Link href="/register" className={`${btnPrimary} ${btnSm}`}>
            Commencer
          </Link>
        </div>
      </div>
    </header>
  );
}

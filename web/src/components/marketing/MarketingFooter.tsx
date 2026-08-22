import Link from "next/link";
import Logo from "./Logo";
import { container } from "./ui";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Produit",
    links: [
      { label: "Fonctionnalités", href: "/#features" },
      { label: "Comment ça marche", href: "/#how" },
      { label: "Tarifs", href: "/#pricing" },
      { label: "Créer un compte", href: "/register" },
    ],
  },
  {
    title: "Ressources",
    links: [
      { label: "FAQ", href: "/#faq" },
      { label: "Nous contacter", href: "mailto:contact@bizmanager.africa" },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "Mentions légales", href: "/mentions-legales" },
      { label: "CGU", href: "/cgu" },
      { label: "Politique de confidentialité", href: "/politique-de-confidentialite" },
    ],
  },
];

export default function MarketingFooter() {
  return (
    <footer className="border-t border-ink-200 bg-white">
      <div className={`${container} py-14`}>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,18rem)_repeat(3,minmax(0,1fr))] lg:gap-12">
          <div>
            <Logo size={34} />
            <p className="mt-4 max-w-[15rem] text-sm leading-relaxed text-ink-500">
              La plateforme de gestion tout-en-un pour les commerçants africains.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h2 className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-ink-900">
                {column.title}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-500 transition-colors hover:text-brand-700"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-ink-100 pt-6">
          <p className="text-[0.8125rem] text-ink-400">
            © {new Date().getFullYear()} BizManager. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  short: string;
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function MerchantNav({ links }: { links: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="app-nav" aria-label="Navigation principale">
      {links.map((item) => {
        const active = isActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`app-nav-link ${active ? "is-active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <span className="app-nav-icon" aria-hidden>
              {item.short}
            </span>
            <span className="app-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import MerchantNav from "./MerchantNav";

type NavItem = { href: string; label: string; short: string };

export default function DashboardShell({
  navLinks,
  email,
  children,
}: {
  navLinks: NavItem[];
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <section className="app-shell dashboard-shell">

      {/* ── Mobile top bar (hidden on desktop) ─────────────────────────── */}
      <div className="mobile-topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="brand-mark" aria-hidden>BM</span>
          <strong style={{ fontSize: "1rem", color: "#1F2A24", fontWeight: 700 }}>BizManager</strong>
        </div>
        <button
          className="burger-btn"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
          aria-expanded={open}
        >
          <Menu size={20} />
        </button>
      </div>

      {/* ── Backdrop ───────────────────────────────────────────────────── */}
      {open && (
        <div
          className="mobile-overlay"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside className={`app-sidebar dashboard-sidebar card${open ? " sidebar-open" : ""}`}>
        <button
          className="sidebar-close-btn"
          onClick={() => setOpen(false)}
          aria-label="Fermer le menu"
        >
          <X size={16} />
        </button>

        <div className="sidebar-brand">
          <span className="brand-mark" aria-hidden>BM</span>
          <div className="sidebar-brand-copy">
            <strong>BizManager</strong>
            <p>Back-office commerçant</p>
          </div>
        </div>

        <div className="sidebar-account">
          <span>Compte connecté</span>
          <strong>{email}</strong>
        </div>

        <MerchantNav links={navLinks} email={email} />

        <div className="sidebar-footer">
          <form className="sidebar-logout" action="/api/auth/logout" method="post">
            <button type="submit">Déconnexion</button>
          </form>
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <div className="app-main dashboard-main">{children}</div>
    </section>
  );
}

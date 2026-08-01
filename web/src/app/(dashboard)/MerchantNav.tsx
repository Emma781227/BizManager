"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Menu } from "lucide-react";
import { useActiveShop } from "@/hooks/useActiveShop";

type NavItem = {
  href: string;
  label: string;
  short: string;
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function MerchantNav({ links, email }: { links: NavItem[]; email: string }) {
  const pathname  = usePathname();
  const [activeShopId] = useActiveShop("");

  // ── Mobile drawer ──────────────────────────────────────────────────────────
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // ── Pending-orders badge ───────────────────────────────────────────────────
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!activeShopId) return;
    let cancelled = false;
    async function loadPending() {
      try {
        const res  = await fetch(`/api/orders?shopId=${activeShopId}`);
        const data = await res.json() as { data?: { status: string }[] };
        if (!cancelled && Array.isArray(data.data)) {
          setPendingCount(data.data.filter(o => o.status === "new" || o.status === "pending").length);
        }
      } catch { /* ignore */ }
    }
    loadPending();
    const iv = setInterval(loadPending, 30_000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [activeShopId]);

  const navLinks = links.map(item => {
    const active   = isActive(pathname, item.href);
    const isOrders = item.href === "/orders";
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`app-nav-link ${active ? "is-active" : ""}`}
        aria-current={active ? "page" : undefined}
        style={{ position: "relative" }}
      >
        <span className="app-nav-icon" aria-hidden>{item.short}</span>
        <span className="app-nav-label">{item.label}</span>
        {isOrders && pendingCount > 0 && (
          <span style={{
            position: "absolute", top: 4, right: 6,
            minWidth: 16, height: 16, background: "#EF4444", color: "#fff",
            borderRadius: 8, fontSize: 10, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 4px",
          }}>
            {pendingCount > 99 ? "99+" : pendingCount}
          </span>
        )}
      </Link>
    );
  });

  return (
    <>
      <nav className="app-nav" aria-label="Navigation principale">

        {/* ── Mobile burger button (hidden on desktop) ──────────────────── */}
        <button
          className="nav-burger-btn"
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir la navigation"
        >
          <Menu size={18} />
          {pendingCount > 0 && (
            <span style={{
              minWidth: 18, height: 18, background: "#EF4444", color: "#fff",
              borderRadius: 9, fontSize: 10, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px",
            }}>
              {pendingCount > 99 ? "99+" : pendingCount}
            </span>
          )}
        </button>

        {/* ── Desktop nav links (hidden on mobile) ─────────────────────── */}
        <div className="nav-desktop-links">
          {navLinks}
        </div>

        {/* ── Desktop: account info + logout (hidden on mobile) ────────── */}
        <div className="nav-desktop-only">
          <div className="nav-account-block">
            <span className="nav-account-label">Compte connecté</span>
            <strong className="nav-account-email">{email}</strong>
          </div>
          <form action="/api/auth/logout" method="post" style={{ marginTop: 8 }}>
            <button type="submit" className="nav-logout-btn">Déconnexion</button>
          </form>
        </div>
      </nav>

      {/* ── Mobile drawer (portal-style, outside nav) ─────────────────── */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.50)",
              zIndex: 400,
              backdropFilter: "blur(2px)",
              WebkitBackdropFilter: "blur(2px)",
            }}
            aria-hidden
          />

          {/* Drawer panel */}
          <div
            style={{
              position: "fixed", top: 0, left: 0, bottom: 0,
              width: 280, maxWidth: "88vw",
              background: "linear-gradient(180deg,#ffffff 0%,#f7faf8 100%)",
              zIndex: 401,
              display: "flex", flexDirection: "column",
              overflowY: "auto",
              scrollbarWidth: "none",
              WebkitOverflowScrolling: "touch",
              boxShadow: "6px 0 32px rgba(0,0,0,0.18)",
            } as React.CSSProperties}
          >
            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 16px 12px", borderBottom: "1px solid #E8ECEA",
              position: "sticky", top: 0, background: "#fff", zIndex: 1,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="brand-mark" aria-hidden>BM</span>
                <strong style={{ fontSize: "1rem", color: "#1F2A24", fontWeight: 700 }}>BizManager</strong>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Fermer"
                style={{
                  width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1.5px solid #E8ECEA", borderRadius: 8, background: "#F8FAF9",
                  color: "#667085", cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Account info */}
            <div style={{ padding: "14px 16px 0" }}>
              <div className="nav-account-block">
                <span className="nav-account-label">Compte connecté</span>
                <strong className="nav-account-email">{email}</strong>
              </div>
            </div>

            {/* Nav links */}
            <div style={{
              display: "flex", flexDirection: "column", gap: 5,
              padding: "12px 16px", flex: 1,
            }}>
              {links.map(item => {
                const active   = isActive(pathname, item.href);
                const isOrders = item.href === "/orders";
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`app-nav-link ${active ? "is-active" : ""}`}
                    aria-current={active ? "page" : undefined}
                    style={{
                      position: "relative", textAlign: "left",
                      justifyContent: "flex-start", gap: "0.6rem",
                      padding: "0.6rem 0.75rem",
                    }}
                  >
                    <span className="app-nav-icon" aria-hidden>{item.short}</span>
                    <span className="app-nav-label">{item.label}</span>
                    {isOrders && pendingCount > 0 && (
                      <span style={{
                        position: "absolute", top: 4, right: 6,
                        minWidth: 16, height: 16, background: "#EF4444", color: "#fff",
                        borderRadius: 8, fontSize: 10, fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "0 4px",
                      }}>
                        {pendingCount > 99 ? "99+" : pendingCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Logout — sticky at bottom */}
            <div style={{
              padding: "12px 16px 24px", borderTop: "1px solid #E8ECEA",
              position: "sticky", bottom: 0, background: "#f7faf8",
            }}>
              <form action="/api/auth/logout" method="post">
                <button type="submit" className="nav-logout-btn">Déconnexion</button>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}

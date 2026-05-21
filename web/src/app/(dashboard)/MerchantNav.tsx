"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useActiveShop } from "@/hooks/useActiveShop";

type NavItem = {
  href: string;
  label: string;
  short: string;
};

type SearchResult = {
  type: "product" | "order" | "customer";
  id: string;
  label: string;
  sub: string;
  href: string;
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const TYPE_ICON: Record<string, string> = { product: "📦", order: "🛒", customer: "👤" };

export default function MerchantNav({ links }: { links: NavItem[] }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [activeShopId] = useActiveShop("");

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

  // ── Global search ──────────────────────────────────────────────────────────
  const [query,     setQuery]     = useState("");
  const [results,   setResults]   = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDrop,  setShowDrop]  = useState(false);
  const wrapRef    = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (query.length < 2) { setResults([]); setShowDrop(false); return; }
    debounceRef.current = setTimeout(async () => {
      if (!activeShopId) return;
      setSearching(true);
      try {
        const q = encodeURIComponent(query);
        const [prodRes, custRes, ordRes] = await Promise.all([
          fetch(`/api/products?shopId=${activeShopId}&q=${q}`),
          fetch(`/api/customers?shopId=${activeShopId}&q=${q}`),
          fetch(`/api/orders?shopId=${activeShopId}&q=${q}`),
        ]);
        const [prodD, custD, ordD] = await Promise.all([
          prodRes.json() as Promise<{ data?: { id: string; name: string; unitPrice: string }[] }>,
          custRes.json() as Promise<{ data?: { id: string; fullName: string; phone: string }[] }>,
          ordRes.json()  as Promise<{ data?: { id: string; totalAmount: string; customer?: { fullName: string } }[] }>,
        ]);
        const all: SearchResult[] = [
          ...(prodD.data ?? []).slice(0, 3).map(p => ({
            type: "product" as const, id: p.id, label: p.name,
            sub: `${parseFloat(String(p.unitPrice)).toLocaleString("fr-FR")} FCFA`,
            href: "/products",
          })),
          ...(custD.data ?? []).slice(0, 3).map(c => ({
            type: "customer" as const, id: c.id, label: c.fullName,
            sub: c.phone, href: "/customers",
          })),
          ...(ordD.data ?? []).slice(0, 3).map(o => ({
            type: "order" as const, id: o.id,
            label: `#${o.id.slice(-6).toUpperCase()} — ${o.customer?.fullName ?? ""}`,
            sub: `${parseFloat(String(o.totalAmount)).toLocaleString("fr-FR")} FCFA`,
            href: "/orders",
          })),
        ];
        setResults(all);
        setShowDrop(true);
      } catch { /* ignore */ }
      setSearching(false);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, activeShopId]);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowDrop(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  return (
    <nav className="app-nav" aria-label="Navigation principale">

      {/* ── Global search ─────────────────────────────────────────────── */}
      <div ref={wrapRef} style={{ position: "relative", marginBottom: 8 }}>
        <div style={{ position: "relative" }}>
          <Search
            size={12}
            style={{
              position: "absolute", left: 9, top: "50%",
              transform: "translateY(-50%)", color: "#98A2B3", pointerEvents: "none",
            }}
          />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowDrop(true)}
            placeholder="Rechercher…"
            style={{
              width: "100%", boxSizing: "border-box", height: 30,
              paddingLeft: 28, paddingRight: query ? 26 : 10,
              border: "1px solid #E8ECEA", borderRadius: 8,
              fontSize: 12, color: "#1F2A24", background: "#F8FAF9",
              outline: "none",
            }}
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setShowDrop(false); }}
              style={{
                position: "absolute", right: 7, top: "50%",
                transform: "translateY(-50%)", border: "none",
                background: "none", cursor: "pointer", color: "#98A2B3",
                lineHeight: 1, padding: 0, display: "flex", alignItems: "center",
              }}
            >
              <X size={11} />
            </button>
          )}
        </div>

        {showDrop && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
            background: "#fff", border: "1px solid #E8ECEA", borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,.14)", zIndex: 999, overflow: "hidden",
          }}>
            {searching && (
              <div style={{ padding: "9px 12px", fontSize: 12, color: "#98A2B3" }}>Recherche…</div>
            )}
            {!searching && results.length === 0 && (
              <div style={{ padding: "9px 12px", fontSize: 12, color: "#98A2B3" }}>Aucun résultat</div>
            )}
            {!searching && results.map(r => (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => { router.push(r.href); setQuery(""); setShowDrop(false); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 8,
                  padding: "7px 12px", background: "none", border: "none",
                  borderBottom: "1px solid #F4F6F5", cursor: "pointer", textAlign: "left",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#F8FAF9")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >
                <span style={{ fontSize: 13 }}>{TYPE_ICON[r.type]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#1F2A24", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.label}
                  </div>
                  <div style={{ fontSize: 11, color: "#98A2B3" }}>{r.sub}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Nav links ─────────────────────────────────────────────────── */}
      {links.map(item => {
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
      })}
    </nav>
  );
}

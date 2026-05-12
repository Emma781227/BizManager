"use client";
import { useEffect, useMemo, useState } from "react";

type OverviewPayload = {
  shopsCount: number;
  publishedShopsCount: number;
  usersCount: number;
  ordersCount: number;
  stockLowCount: number;
  revenue: number;
};

type ShopRow = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  isPublished: boolean;
  whatsappNumber: string;
  createdAt: string;
  owner: { id: string; fullName: string; email: string; phone: string | null };
  plan: { name: string; displayName: string };
  productsCount: number;
  ordersCount: number;
};

interface DonutSegment {
  value: number;
  color: string;
  label: string;
}

const RESPONSIVE_CSS = `
  @keyframes adm-spin { to { transform: rotate(360deg); } }

  .adm-wrap { padding: 24px 28px; max-width: 1400px; margin: 0 auto; }

  .adm-header-row { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 28px; }
  .adm-header-actions { display: flex; gap: 10px; flex-shrink: 0; }

  .adm-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
  .adm-stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; }

  .adm-tabs { display: flex; gap: 4px; margin-bottom: 24px; border-bottom: 2px solid #E8ECEA; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
  .adm-tabs::-webkit-scrollbar { display: none; }

  .adm-main-grid { display: grid; grid-template-columns: 1fr 280px; gap: 20px; margin-bottom: 20px; }
  .adm-right-col { display: flex; flex-direction: column; gap: 16px; }

  .adm-toolbar { padding: 16px 20px; border-bottom: 1.5px solid #E8ECEA; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
  .adm-toolbar-search { flex: 1; min-width: 160px; padding: 8px 12px; border-radius: 8px; border: 1.5px solid #E8ECEA; font-size: 13px; outline: none; color: #1F2A24; background: #fff; }
  .adm-toolbar-filters { display: flex; gap: 6px; flex-wrap: wrap; }

  .adm-bottom-grid { display: grid; grid-template-columns: 5fr 3fr 4fr; gap: 20px; }

  .adm-line-chart-svg { width: 100%; height: 60px; display: block; }

  /* Tablet: ≤ 1100px */
  @media (max-width: 1100px) {
    .adm-main-grid { grid-template-columns: 1fr; }
    .adm-right-col { display: grid; grid-template-columns: repeat(3, 1fr); }
    .adm-bottom-grid { grid-template-columns: 1fr 1fr; }
  }

  /* Mobile L: ≤ 768px */
  @media (max-width: 768px) {
    .adm-wrap { padding: 16px 14px; }
    .adm-header-row { margin-bottom: 20px; }
    .adm-kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; }
    .adm-stats-row { grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
    .adm-main-grid { grid-template-columns: 1fr; gap: 16px; }
    .adm-right-col { display: grid; grid-template-columns: 1fr 1fr; }
    .adm-bottom-grid { grid-template-columns: 1fr; gap: 14px; }
  }

  /* Mobile S: ≤ 480px */
  @media (max-width: 480px) {
    .adm-wrap { padding: 12px 12px; }
    .adm-kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px; }
    .adm-stats-row { grid-template-columns: 1fr; gap: 8px; margin-bottom: 16px; }
    .adm-right-col { display: flex; flex-direction: column; }
    .adm-toolbar { padding: 12px; gap: 8px; }
    .adm-toolbar-search { min-width: 100%; }
  }
`;

function DonutChart({ segments, total }: { segments: DonutSegment[]; total: number }) {
  const r = 36;
  const C = 2 * Math.PI * r;
  if (total === 0) {
    return (
      <svg width="80" height="80" viewBox="0 0 80 80" aria-hidden>
        <circle cx="40" cy="40" r={r} fill="none" stroke="#E8ECEA" strokeWidth="10" />
      </svg>
    );
  }
  let acc = 0;
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" aria-hidden>
      <g transform="rotate(-90 40 40)">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#E8ECEA" strokeWidth="10" />
        {segments
          .filter((s) => s.value > 0)
          .map((seg, i) => {
            const dashLen = C * (seg.value / total);
            const offset = acc;
            acc += dashLen;
            return (
              <circle
                key={i}
                cx="40" cy="40" r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth="10"
                strokeDasharray={`${dashLen} ${C}`}
                strokeDashoffset={-offset}
              />
            );
          })}
      </g>
    </svg>
  );
}

function LineChart({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const max = Math.max(...points, 1);
  const w = 220;
  const h = 60;
  const step = w / (points.length - 1);
  const coords = points.map((v, i) => `${i * step},${h - (v / max) * h}`).join(" ");
  return (
    <svg
      className="adm-line-chart-svg"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="adm-lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0A8F45" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0A8F45" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={`0,${h} ${coords} ${w},${h}`} fill="url(#adm-lg)" stroke="none" />
      <polyline points={coords} fill="none" stroke="#0A8F45" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

const PAGE_SIZE = 6;

function formatAmount(amount: number) {
  return new Intl.NumberFormat("fr-FR", { style: "decimal", maximumFractionDigits: 0 }).format(amount) + " FCFA";
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminDashboardClient() {
  const [overview, setOverview] = useState<OverviewPayload | null>(null);
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [pendingShopId, setPendingShopId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"boutiques" | "performance" | "moderation">("boutiques");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => { setCurrentPage(1); }, [debouncedQuery, statusFilter]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [ovRes, shRes] = await Promise.all([
        fetch("/api/admin/overview"),
        fetch("/api/admin/shops"),
      ]);
      if (!ovRes.ok || !shRes.ok) throw new Error("Erreur de chargement");
      const [ov, sh] = await Promise.all([ovRes.json(), shRes.json()]);
      setOverview(ov);
      setShops(Array.isArray(sh) ? sh : sh.data ?? []);
    } catch {
      setError("Impossible de charger les données de la plateforme.");
    } finally {
      setLoading(false);
    }
  }

  async function togglePublication(shopId: string, current: boolean) {
    setPendingShopId(shopId);
    setActionError(null);
    setShops((prev) => prev.map((s) => s.id === shopId ? { ...s, isPublished: !current } : s));
    try {
      const res = await fetch("/api/admin/shops", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, isPublished: !current }),
      });
      if (!res.ok) throw new Error();
      setSuccessMsg(current ? "Boutique désactivée." : "Boutique activée.");
      setTimeout(() => setSuccessMsg(null), 3000);
      fetch("/api/admin/overview").then((r) => r.ok && r.json()).then((ov) => ov && setOverview(ov));
    } catch {
      setShops((prev) => prev.map((s) => s.id === shopId ? { ...s, isPublished: current } : s));
      setActionError("Impossible de modifier le statut.");
      setTimeout(() => setActionError(null), 3000);
    } finally {
      setPendingShopId(null);
    }
  }

  const activeCount = overview?.publishedShopsCount ?? 0;
  const totalShops = overview?.shopsCount ?? 0;
  const inactiveCount = totalShops - activeCount;

  const filteredShops = useMemo(() => {
    let list = shops;
    if (statusFilter === "active") list = list.filter((s) => s.isPublished);
    if (statusFilter === "inactive") list = list.filter((s) => !s.isPublished);
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.owner.fullName.toLowerCase().includes(q) ||
          s.owner.email.toLowerCase().includes(q) ||
          (s.city ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [shops, statusFilter, debouncedQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredShops.length / PAGE_SIZE));
  const paginatedShops = filteredShops.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const recentShops = useMemo(
    () => [...shops].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [shops]
  );

  const topShops = useMemo(
    () => [...shops].sort((a, b) => b.ordersCount - a.ordersCount).slice(0, 5),
    [shops]
  );

  const donutSegments: DonutSegment[] = [
    { value: activeCount, color: "#0A8F45", label: "Actives" },
    { value: 0, color: "#F08A24", label: "Suspendues" },
    { value: inactiveCount, color: "#3B82F6", label: "Inactives" },
    { value: 0, color: "#EF4444", label: "Fermées" },
  ];

  const trendPoints = [12, 19, 14, 28, 22, 35, 30, 42, 38, 50, 45, overview?.ordersCount ? Math.min(overview.ordersCount, 60) : 55];

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 320 }}>
        <style>{RESPONSIVE_CSS}</style>
        <div style={{ textAlign: "center", color: "#667085" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #E8ECEA", borderTopColor: "#0A8F45", borderRadius: "50%", animation: "adm-spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ fontSize: 14 }}>Chargement de la plateforme…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 32, textAlign: "center" }}>
        <style>{RESPONSIVE_CSS}</style>
        <p style={{ color: "#EF4444", marginBottom: 12 }}>{error}</p>
        <button onClick={loadData} style={{ padding: "8px 20px", background: "#0A8F45", color: "#fff", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14 }}>
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="adm-wrap">
      <style>{RESPONSIVE_CSS}</style>

      {/* Toast */}
      {(successMsg || actionError) && (
        <div style={{
          position: "fixed", top: 16, right: 16, zIndex: 9999,
          padding: "12px 20px", borderRadius: 10, maxWidth: "calc(100vw - 32px)",
          background: successMsg ? "#DDF6E7" : "#FDE8E8",
          color: successMsg ? "#0A8F45" : "#EF4444",
          border: `1px solid ${successMsg ? "#0A8F45" : "#EF4444"}`,
          fontSize: 14, fontWeight: 500, boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}>
          {successMsg ?? actionError}
        </div>
      )}

      {/* Header */}
      <div className="adm-header-row">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1F2A24", margin: 0 }}>Administration Plateforme</h1>
          <p style={{ fontSize: 14, color: "#667085", margin: "4px 0 0" }}>Vue globale de toutes les boutiques BizManager</p>
        </div>
        <div className="adm-header-actions">
          <button
            onClick={loadData}
            style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid #E8ECEA", background: "#fff", color: "#1F2A24", fontSize: 14, cursor: "pointer", fontWeight: 500, whiteSpace: "nowrap" }}
          >
            Actualiser
          </button>
          <div style={{ padding: "8px 16px", borderRadius: 8, background: "#0A8F45", color: "#fff", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" }}>
            {totalShops} boutique{totalShops !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="adm-kpi-grid">
        {[
          { label: "Boutiques actives", value: activeCount, color: "#0A8F45", bg: "#DDF6E7", icon: "✓", sub: `sur ${totalShops} total` },
          { label: "Suspendues", value: 0, color: "#F08A24", bg: "#FFF1E5", icon: "⚠", sub: "Aucune suspension" },
          { label: "Inactives", value: inactiveCount, color: "#3B82F6", bg: "#E8F0FF", icon: "○", sub: "Non publiées" },
          { label: "Fermées", value: 0, color: "#EF4444", bg: "#FDE8E8", icon: "✕", sub: "Aucune fermeture" },
        ].map((card) => (
          <div
            key={card.label}
            style={{ background: "#fff", border: "1.5px solid #E8ECEA", borderRadius: 14, padding: "18px 16px", position: "relative", overflow: "hidden" }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 11, color: "#667085", margin: "0 0 6px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>{card.label}</p>
                <p style={{ fontSize: 28, fontWeight: 700, color: "#1F2A24", margin: 0, lineHeight: 1 }}>{card.value}</p>
                <p style={{ fontSize: 11, color: "#98A2B3", margin: "4px 0 0" }}>{card.sub}</p>
              </div>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: card.bg, display: "flex", alignItems: "center", justifyContent: "center", color: card.color, fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                {card.icon}
              </div>
            </div>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: card.color, opacity: 0.3 }} />
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div className="adm-stats-row">
        {[
          { label: "Utilisateurs inscrits", value: overview?.usersCount ?? 0, color: "#667085" },
          { label: "Commandes totales", value: overview?.ordersCount ?? 0, color: "#0A8F45" },
          { label: "Stocks faibles", value: overview?.stockLowCount ?? 0, color: "#F08A24" },
        ].map((stat) => (
          <div key={stat.label} style={{ background: "#fff", border: "1.5px solid #E8ECEA", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: stat.color, flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 11, color: "#667085", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{stat.label}</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: "#1F2A24", margin: "2px 0 0" }}>{stat.value.toLocaleString("fr-FR")}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="adm-tabs">
        {(["boutiques", "performance", "moderation"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "10px 18px", fontSize: 14, fontWeight: 600, border: "none", background: "none", cursor: "pointer",
              color: activeTab === tab ? "#0A8F45" : "#667085",
              borderBottom: activeTab === tab ? "2px solid #0A8F45" : "2px solid transparent",
              marginBottom: -2, whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            {tab === "boutiques" ? "Boutiques" : tab === "performance" ? "Performance" : "Modération"}
          </button>
        ))}
      </div>

      {activeTab !== "boutiques" ? (
        <div style={{ background: "#fff", border: "1.5px solid #E8ECEA", borderRadius: 14, padding: "48px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 32, margin: "0 0 12px" }}>🚧</p>
          <p style={{ fontSize: 16, fontWeight: 600, color: "#1F2A24", margin: "0 0 6px" }}>Bientôt disponible</p>
          <p style={{ fontSize: 14, color: "#667085", margin: 0 }}>Cette section est en cours de développement.</p>
        </div>
      ) : (
        <>
          {/* Main 2-col */}
          <div className="adm-main-grid">
            {/* Table */}
            <div style={{ background: "#fff", border: "1.5px solid #E8ECEA", borderRadius: 14, overflow: "hidden" }}>
              <div className="adm-toolbar">
                <input
                  type="search"
                  placeholder="Rechercher une boutique, marchand…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="adm-toolbar-search"
                />
                <div className="adm-toolbar-filters">
                  {(["all", "active", "inactive"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setStatusFilter(f)}
                      style={{
                        padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, border: "1.5px solid",
                        borderColor: statusFilter === f ? "#0A8F45" : "#E8ECEA",
                        background: statusFilter === f ? "#DDF6E7" : "#F8FAF9",
                        color: statusFilter === f ? "#0A8F45" : "#667085",
                        cursor: "pointer", whiteSpace: "nowrap",
                      }}
                    >
                      {f === "all" ? "Toutes" : f === "active" ? "Actives" : "Inactives"}
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: 12, color: "#98A2B3", whiteSpace: "nowrap" }}>
                  {filteredShops.length} résultat{filteredShops.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 600 }}>
                  <thead>
                    <tr style={{ background: "#F8FAF9" }}>
                      {["Boutique", "Marchand", "Plan", "Ville", "Statut", "Prod.", "Cmd.", "Créée le", ""].map((h) => (
                        <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#667085", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1.5px solid #E8ECEA", whiteSpace: "nowrap" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedShops.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ padding: "40px 20px", textAlign: "center", color: "#98A2B3", fontSize: 14 }}>
                          Aucune boutique trouvée
                        </td>
                      </tr>
                    ) : (
                      paginatedShops.map((shop, idx) => (
                        <tr key={shop.id} style={{ borderBottom: "1px solid #E8ECEA", background: idx % 2 === 0 ? "#fff" : "#FAFCFB" }}>
                          <td style={{ padding: "11px 12px" }}>
                            <div style={{ fontWeight: 600, color: "#1F2A24", fontSize: 13 }}>{shop.name}</div>
                            <div style={{ fontSize: 11, color: "#98A2B3" }}>{shop.slug}</div>
                          </td>
                          <td style={{ padding: "11px 12px" }}>
                            <div style={{ fontWeight: 500, color: "#1F2A24", fontSize: 13 }}>{shop.owner.fullName}</div>
                            <div style={{ fontSize: 11, color: "#98A2B3", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shop.owner.email}</div>
                          </td>
                          <td style={{ padding: "11px 12px" }}>
                            <span style={{
                              display: "inline-block",
                              padding: "3px 9px",
                              borderRadius: 20,
                              fontSize: 11,
                              fontWeight: 600,
                              background: shop.plan?.name === "premium" ? "#F3E8FF" : shop.plan?.name === "business" ? "#EAF7EF" : "#F2F4F7",
                              color: shop.plan?.name === "premium" ? "#7C3AED" : shop.plan?.name === "business" ? "#0A8F45" : "#667085",
                            }}>
                              {shop.plan?.displayName ?? "Starter"}
                            </span>
                          </td>
                          <td style={{ padding: "11px 12px", color: "#667085", fontSize: 13 }}>{shop.city ?? "—"}</td>
                          <td style={{ padding: "11px 12px" }}>
                            <span style={{
                              display: "inline-block", padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                              background: shop.isPublished ? "#DDF6E7" : "#E8F0FF",
                              color: shop.isPublished ? "#0A8F45" : "#3B82F6",
                            }}>
                              {shop.isPublished ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td style={{ padding: "11px 12px", color: "#667085", textAlign: "center" }}>{shop.productsCount}</td>
                          <td style={{ padding: "11px 12px", color: "#667085", textAlign: "center" }}>{shop.ordersCount}</td>
                          <td style={{ padding: "11px 12px", color: "#98A2B3", fontSize: 12, whiteSpace: "nowrap" }}>{formatDate(shop.createdAt)}</td>
                          <td style={{ padding: "11px 12px" }}>
                            <button
                              disabled={pendingShopId === shop.id}
                              onClick={() => togglePublication(shop.id, shop.isPublished)}
                              style={{
                                padding: "5px 10px", borderRadius: 7, fontSize: 11, fontWeight: 600, border: "1.5px solid",
                                borderColor: shop.isPublished ? "#EF4444" : "#0A8F45",
                                background: shop.isPublished ? "#FDE8E8" : "#DDF6E7",
                                color: shop.isPublished ? "#EF4444" : "#0A8F45",
                                cursor: pendingShopId === shop.id ? "wait" : "pointer",
                                opacity: pendingShopId === shop.id ? 0.6 : 1,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {pendingShopId === shop.id ? "…" : shop.isPublished ? "Désactiver" : "Activer"}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div style={{ padding: "12px 16px", borderTop: "1.5px solid #E8ECEA", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "#98A2B3" }}>Page {currentPage} / {totalPages}</span>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                      style={{ padding: "5px 10px", borderRadius: 7, border: "1.5px solid #E8ECEA", background: "#fff", color: "#1F2A24", fontSize: 13, cursor: currentPage === 1 ? "default" : "pointer", opacity: currentPage === 1 ? 0.4 : 1 }}
                    >←</button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        style={{ padding: "5px 9px", borderRadius: 7, border: "1.5px solid", borderColor: currentPage === page ? "#0A8F45" : "#E8ECEA", background: currentPage === page ? "#DDF6E7" : "#fff", color: currentPage === page ? "#0A8F45" : "#1F2A24", fontSize: 13, cursor: "pointer", fontWeight: currentPage === page ? 700 : 400 }}
                      >{page}</button>
                    ))}
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                      style={{ padding: "5px 10px", borderRadius: 7, border: "1.5px solid #E8ECEA", background: "#fff", color: "#1F2A24", fontSize: 13, cursor: currentPage === totalPages ? "default" : "pointer", opacity: currentPage === totalPages ? 0.4 : 1 }}
                    >→</button>
                  </div>
                </div>
              )}
            </div>

            {/* Right col */}
            <div className="adm-right-col">
              {/* Créées récemment */}
              <div style={{ background: "#fff", border: "1.5px solid #E8ECEA", borderRadius: 14, padding: "16px" }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "#1F2A24", margin: "0 0 12px" }}>Créées récemment</h3>
                {recentShops.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#98A2B3", textAlign: "center", padding: "12px 0" }}>Aucune boutique</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                    {recentShops.map((s) => (
                      <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: "#DDF6E7", display: "flex", alignItems: "center", justifyContent: "center", color: "#0A8F45", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: "#1F2A24", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</p>
                          <p style={{ fontSize: 11, color: "#98A2B3", margin: "1px 0 0" }}>{formatDate(s.createdAt)}</p>
                        </div>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.isPublished ? "#0A8F45" : "#3B82F6", flexShrink: 0 }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Donut */}
              <div style={{ background: "#fff", border: "1.5px solid #E8ECEA", borderRadius: 14, padding: "16px" }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "#1F2A24", margin: "0 0 12px" }}>Répartition statuts</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <DonutChart segments={donutSegments} total={totalShops} />
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#1F2A24" }}>{totalShops}</span>
                      <span style={{ fontSize: 9, color: "#98A2B3" }}>total</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
                    {donutSegments.map((seg) => (
                      <div key={seg.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: "#667085", flex: 1 }}>{seg.label}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#1F2A24" }}>{seg.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Alertes */}
              <div style={{ background: "#fff", border: "1.5px solid #E8ECEA", borderRadius: 14, padding: "16px" }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "#1F2A24", margin: "0 0 12px" }}>Alertes admin</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {inactiveCount > 0 && (
                    <div style={{ display: "flex", gap: 9, padding: "9px 11px", background: "#E8F0FF", borderRadius: 9 }}>
                      <span style={{ color: "#3B82F6", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>○</span>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: "#1F2A24", margin: 0 }}>{inactiveCount} boutique{inactiveCount > 1 ? "s" : ""} inactive{inactiveCount > 1 ? "s" : ""}</p>
                        <p style={{ fontSize: 11, color: "#667085", margin: "2px 0 0" }}>Non publiées</p>
                      </div>
                    </div>
                  )}
                  {(overview?.stockLowCount ?? 0) > 0 && (
                    <div style={{ display: "flex", gap: 9, padding: "9px 11px", background: "#FFF1E5", borderRadius: 9 }}>
                      <span style={{ color: "#F08A24", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>⚠</span>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: "#1F2A24", margin: 0 }}>{overview?.stockLowCount} produit{(overview?.stockLowCount ?? 0) > 1 ? "s" : ""} stock faible</p>
                        <p style={{ fontSize: 11, color: "#667085", margin: "2px 0 0" }}>Toutes boutiques</p>
                      </div>
                    </div>
                  )}
                  {inactiveCount === 0 && (overview?.stockLowCount ?? 0) === 0 && (
                    <p style={{ fontSize: 13, color: "#98A2B3", textAlign: "center", padding: "12px 0", margin: 0 }}>Aucune alerte active</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom 3-col */}
          <div className="adm-bottom-grid">
            {/* Tendance commandes */}
            <div style={{ background: "#fff", border: "1.5px solid #E8ECEA", borderRadius: 14, padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1F2A24", margin: 0 }}>Tendance des commandes</h3>
                  <p style={{ fontSize: 12, color: "#98A2B3", margin: "3px 0 0" }}>12 derniers mois (aperçu)</p>
                </div>
                <div style={{ padding: "4px 10px", borderRadius: 20, background: "#DDF6E7", color: "#0A8F45", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  +18%
                </div>
              </div>
              <LineChart points={trendPoints} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                {["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"].map((m, i) => (
                  <span key={i} style={{ fontSize: 9, color: "#98A2B3" }}>{m}</span>
                ))}
              </div>
            </div>

            {/* Aperçu clés */}
            <div style={{ background: "#fff", border: "1.5px solid #E8ECEA", borderRadius: 14, padding: "18px 20px" }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1F2A24", margin: "0 0 14px" }}>Aperçu clés</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "Taux d'activation", value: `${totalShops > 0 ? Math.round((activeCount / totalShops) * 100) : 0}%`, color: "#0A8F45" },
                  { label: "Revenu total", value: formatAmount(overview?.revenue ?? 0), color: "#1F2A24" },
                  { label: "Moy. produits / boutique", value: totalShops > 0 ? Math.round(shops.reduce((a, s) => a + s.productsCount, 0) / totalShops) : 0, color: "#667085" },
                  { label: "Moy. commandes / boutique", value: totalShops > 0 ? Math.round((overview?.ordersCount ?? 0) / totalShops) : 0, color: "#667085" },
                ].map((item) => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, borderBottom: "1px solid #E8ECEA" }}>
                    <span style={{ fontSize: 12, color: "#667085" }}>{item.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top boutiques */}
            <div style={{ background: "#fff", border: "1.5px solid #E8ECEA", borderRadius: 14, padding: "18px 20px" }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1F2A24", margin: "0 0 14px" }}>Top boutiques</h3>
              {topShops.length === 0 ? (
                <p style={{ fontSize: 13, color: "#98A2B3", textAlign: "center", paddingTop: 16 }}>Aucune donnée</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {topShops.map((s, idx) => {
                    const maxOrders = topShops[0]?.ordersCount || 1;
                    const pct = Math.round((s.ordersCount / maxOrders) * 100);
                    return (
                      <div key={s.id}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <span style={{ width: 17, height: 17, borderRadius: 4, background: idx === 0 ? "#DDF6E7" : "#F8FAF9", color: idx === 0 ? "#0A8F45" : "#98A2B3", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {idx + 1}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "#1F2A24", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>{s.name}</span>
                          </div>
                          <span style={{ fontSize: 11, color: "#667085", whiteSpace: "nowrap" }}>{s.ordersCount} cmd</span>
                        </div>
                        <div style={{ height: 4, background: "#E8ECEA", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: idx === 0 ? "#0A8F45" : "#98A2B3", borderRadius: 4, transition: "width 0.4s" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

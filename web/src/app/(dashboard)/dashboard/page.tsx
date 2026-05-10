"use client";
import { useEffect, useMemo, useState } from "react";
import { useActiveShop } from "@/hooks/useActiveShop";

// ─── Types ────────────────────────────────────────────────────────────────────
type KpiData = {
  period: string; sales: number; ordersCount: number; customersCount: number;
  statusCounts: Record<string, number>;
  topProducts: { productId: string; name: string; quantity: number; amount: number }[];
};
type Shop = { id: string; name: string; slug: string; isPublished: boolean; city: string | null; whatsappNumber?: string; };
type Order = { id: string; status: string; paymentStatus: string; totalAmount: number | string; createdAt: string; customer: { fullName: string; phone: string }; };
type Product = { id: string; name: string; price: number | string; stock: number; };

// ─── Static mock data (multi-boutique demo) ───────────────────────────────────
const MOCK_OTHER_SHOPS = [
  { id: "s2", name: "Urban Style", isPublished: true,  city: "Dakar",   productsCount: 42, ordersCount: 89  },
  { id: "s3", name: "Beauty House", isPublished: false, city: "Abidjan", productsCount: 28, ordersCount: 34  },
];

const CHART_MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const CHART_BASE    = [180,210,195,240,280,260,310,290,340,380,360,420]; // thousands FCFA (×1000)

const HISTORY_ACTIONS = [
  { icon: "📦", label: "Ajouter un produit",    href: "/products"  },
  { icon: "🛒", label: "Nouvelle commande",      href: "/orders"    },
  { icon: "🔗", label: "Partager la boutique",   href: "/settings"  },
  { icon: "📱", label: "Voir le QR code",        href: "/settings"  },
];

// ─── CSS ──────────────────────────────────────────────────────────────────────
const DB_CSS = `
@keyframes db-spin { to { transform: rotate(360deg); } }

.db-wrap { padding: 20px 28px; max-width: 1280px; margin: 0 auto; }

/* Context bar */
.db-ctx { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 14px; }

/* KPI grid */
.db-kpi { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px; }

/* Row 1: chart + shops */
.db-row1 { display: grid; grid-template-columns: 1fr 400px; gap: 20px; margin-bottom: 18px; }

/* Row 2: actions + products + orders */
.db-row2 { display: grid; grid-template-columns: 240px 1fr 1fr; gap: 16px; margin-bottom: 18px; }

/* Row 3: alerts + channels */
.db-row3 { display: grid; grid-template-columns: 1fr 380px; gap: 16px; }

@media (max-width: 1100px) {
  .db-row1 { grid-template-columns: 1fr; }
  .db-row2 { grid-template-columns: 1fr 1fr; }
  .db-kpi  { grid-template-columns: repeat(2, 1fr); }
  .db-row3 { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .db-wrap { padding: 14px 12px; }
  .db-kpi  { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .db-row2 { grid-template-columns: 1fr; }
}
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtAmount(v: number | string) {
  const n = Number(v);
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "M FCFA";
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + " K FCFA";
  return Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}
function shortId(id: string) { return "#" + id.slice(-6).toUpperCase(); }

const STATUS_LABELS: Record<string, string> = {
  new: "Nouvelle", pending: "En attente", confirmed: "Confirmée",
  in_progress: "En cours", ready: "Prête", delivered: "Livrée", cancelled: "Annulée",
};
function statusStyle(s: string) {
  if (s === "delivered") return { bg: "#DDF6E7", color: "#0A8F45" };
  if (s === "confirmed") return { bg: "#E8F0FF", color: "#3B82F6" };
  if (s === "cancelled") return { bg: "#FDE8E8", color: "#EF4444" };
  return { bg: "#FFF1E5", color: "#F08A24" };
}

// ─── SVG Line Chart ───────────────────────────────────────────────────────────
function LineChart({ sales }: { sales: number }) {
  const w = 480; const h = 100; const pad = 8;
  const pts = CHART_BASE.map((v, i) =>
    i === CHART_BASE.length - 1 ? Math.max(sales / 1000, v) : v
  );
  const max = Math.max(...pts);
  const coords = pts.map((v, i) => {
    const x = pad + (i / (pts.length - 1)) * (w - pad * 2);
    const y = pad + (1 - v / max) * (h - pad * 2);
    return [x, y] as [number, number];
  });
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x},${y}`).join(" ");
  const area = `${line} L ${coords[coords.length - 1][0]},${h} L ${coords[0][0]},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 100 }} aria-hidden>
      <defs>
        <linearGradient id="db-lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0A8F45" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0A8F45" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#db-lg)" />
      <path d={line} fill="none" stroke="#0A8F45" strokeWidth="2.5" strokeLinejoin="round" />
      {/* last point dot */}
      <circle cx={coords[coords.length - 1][0]} cy={coords[coords.length - 1][1]} r="4" fill="#0A8F45" />
    </svg>
  );
}

// ─── SVG Donut ────────────────────────────────────────────────────────────────
function Donut({ segments }: { segments: { pct: number; color: string }[] }) {
  const r = 34; const C = 2 * Math.PI * r; let acc = 0;
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" aria-hidden>
      <g transform="rotate(-90 40 40)">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#E8ECEA" strokeWidth="10" />
        {segments.map((seg, i) => {
          const dash = C * (seg.pct / 100); const off = acc; acc += dash;
          return <circle key={i} cx="40" cy="40" r={r} fill="none" stroke={seg.color} strokeWidth="10" strokeDasharray={`${dash} ${C}`} strokeDashoffset={-off} />;
        })}
      </g>
    </svg>
  );
}

// ─── Card shell ───────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: "#fff", border: "1.5px solid #E8ECEA", borderRadius: 18,
  boxShadow: "0 2px 10px rgba(16,24,40,0.04)",
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [kpi,        setKpi]        = useState<KpiData | null>(null);
  const [shop,       setShop]       = useState<Shop | null>(null);
  const [orders,     setOrders]     = useState<Order[]>([]);
  const [products,   setProducts]   = useState<Product[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [period,     setPeriod]     = useState("30d");
  const [activeId,   setActiveId]   = useActiveShop("main");

  useEffect(() => { void loadAll(); }, [period]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAll() {
    setLoading(true);
    try {
      const [kpiRes, shopRes, ordRes, prdRes] = await Promise.all([
        fetch(`/api/dashboard?period=${period}`),
        fetch("/api/shop"),
        fetch("/api/orders"),
        fetch("/api/products"),
      ]);
      const [kpiD, shopD, ordD, prdD] = await Promise.all([
        kpiRes.json(), shopRes.json(), ordRes.json(), prdRes.json(),
      ]);
      setKpi(kpiD);
      setShop(shopD.data ?? null);
      const ordList: Order[] = Array.isArray(ordD) ? ordD : (ordD.orders ?? ordD.data ?? []);
      setOrders(ordList.slice(0, 5));
      const prdList: Product[] = Array.isArray(prdD) ? prdD : (prdD.products ?? prdD.data ?? []);
      setProducts(prdList.slice(0, 5));
    } finally {
      setLoading(false);
    }
  }

  // Derived
  const activeName = activeId === "main"
    ? (shop?.name ?? "Ma boutique")
    : MOCK_OTHER_SHOPS.find((s) => s.id === activeId)?.name ?? "Boutique";

  const pendingCount  = kpi?.statusCounts["pending"]  ?? 0;
  const newCount      = kpi?.statusCounts["new"]       ?? 0;
  const lowStockCount = useMemo(() => products.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= 8).length, [products]);

  const allShops = useMemo(() => [
    { id: "main", name: shop?.name ?? "Ma boutique", isPublished: shop?.isPublished ?? true, city: shop?.city ?? null, productsCount: products.length, ordersCount: kpi?.ordersCount ?? 0 },
    ...MOCK_OTHER_SHOPS,
  ], [shop, products.length, kpi?.ordersCount]);

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <style>{DB_CSS}</style>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 320 }}>
          <div style={{ textAlign: "center", color: "#667085" }}>
            <div style={{ width: 40, height: 40, border: "3px solid #E8ECEA", borderTopColor: "#0A8F45", borderRadius: "50%", animation: "db-spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 14 }}>Chargement du tableau de bord…</p>
          </div>
        </div>
      </>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{DB_CSS}</style>
      <div className="db-wrap">

        {/* ── Context bar ── */}
        <div className="db-ctx">
          {/* Boutique active selector */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#98A2B3", textTransform: "uppercase", letterSpacing: "0.05em" }}>Boutique active</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1.5px solid #E8ECEA", borderRadius: 10, padding: "6px 14px", cursor: "pointer" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0A8F45" }} />
              <select
                value={activeId}
                onChange={(e) => setActiveId(e.target.value)}
                style={{ border: "none", outline: "none", fontSize: 14, fontWeight: 600, color: "#1F2A24", background: "transparent", cursor: "pointer" }}
              >
                <option value="main">{shop?.name ?? "Ma boutique"}</option>
                {MOCK_OTHER_SHOPS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {/* Plan badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#EAF7EF", border: "1px solid #C3E6D3", borderRadius: 10, padding: "6px 14px" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#0A8F45" }}>Plan Business</span>
            <span style={{ width: 1, height: 14, background: "#C3E6D3" }} />
            <span style={{ fontSize: 12, color: "#0A8F45" }}>2 / 3 boutiques</span>
          </div>

          {/* Period selector */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            style={{ border: "1.5px solid #E8ECEA", borderRadius: 10, padding: "6px 12px", fontSize: 13, color: "#1F2A24", background: "#fff", cursor: "pointer", outline: "none" }}
          >
            <option value="7d">7 derniers jours</option>
            <option value="30d">30 derniers jours</option>
            <option value="90d">90 derniers jours</option>
          </select>

          {/* Create shop button */}
          <a href="/settings" style={{ marginLeft: "auto", display: "inline-block", background: "#0A8F45", color: "#fff", border: "none", borderRadius: 10, padding: "8px 18px", fontSize: 13, fontWeight: 600, textDecoration: "none", cursor: "pointer" }}>
            + Créer une boutique
          </a>
        </div>

        {/* ── Page title ── */}
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1F2A24", margin: 0 }}>Tableau de bord</h1>
          <p style={{ fontSize: 13, color: "#667085", margin: "4px 0 0" }}>
            Suivez l&apos;activité et les performances de <strong style={{ color: "#1F2A24" }}>{activeName}</strong>.
          </p>
        </div>

        {/* ── KPI Cards ── */}
        <div className="db-kpi">
          {[
            { label: "Chiffre d'affaires", value: fmtAmount(kpi?.sales ?? 0), var: "+18,6%", varC: "#0A8F45", sub: `vs période précédente` },
            { label: "Commandes",          value: String(kpi?.ordersCount ?? 0), var: "+12,4%", varC: "#0A8F45", sub: `vs période précédente` },
            { label: "Clients",            value: String(kpi?.customersCount ?? 0), var: "+9,3%",  varC: "#0A8F45", sub: `total enregistrés`       },
            { label: "Produits actifs",    value: String(products.length),     var: "+6,7%",  varC: "#0A8F45", sub: `dans le catalogue`        },
          ].map((k) => (
            <div key={k.label} style={{ ...card, borderRadius: 16, padding: "18px 20px", position: "relative", overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div>
                  <p style={{ fontSize: 11, color: "#667085", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 500 }}>{k.label}</p>
                  <p style={{ fontSize: 26, fontWeight: 700, color: "#1F2A24", margin: "0 0 4px", lineHeight: 1.1 }}>{k.value}</p>
                  <p style={{ fontSize: 11, color: "#98A2B3", margin: 0 }}>{k.sub}</p>
                </div>
                <span style={{ background: k.varC + "22", color: k.varC, fontSize: 11, fontWeight: 700, borderRadius: 20, padding: "3px 8px", whiteSpace: "nowrap", flexShrink: 0 }}>{k.var}</span>
              </div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: k.varC, opacity: 0.25 }} />
            </div>
          ))}
        </div>

        {/* ── Plan / quota card ── */}
        <div style={{ ...card, padding: "18px 24px", marginBottom: 18, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#EAF7EF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🏪</div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#1F2A24", margin: "0 0 2px" }}>Votre plan Business permet jusqu&apos;à 3 boutiques</p>
            <p style={{ fontSize: 12, color: "#667085", margin: 0 }}>Gérez plusieurs boutiques et développez votre activité.</p>
          </div>
          <div style={{ minWidth: 160 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 12, color: "#667085" }}>Boutiques utilisées</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1F2A24" }}>2 / 3</span>
            </div>
            <div style={{ height: 6, background: "#E8ECEA", borderRadius: 4 }}>
              <div style={{ height: "100%", width: "66%", background: "#0A8F45", borderRadius: 4, transition: "width 0.5s" }} />
            </div>
          </div>
          <a href="/settings" style={{ flexShrink: 0, border: "1.5px solid #0A8F45", background: "#fff", color: "#0A8F45", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>
            Passer au Premium
          </a>
        </div>

        {/* ── Row 1: Performance chart + Mes boutiques ── */}
        <div className="db-row1">

          {/* Performance chart */}
          <div style={{ ...card, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1F2A24", margin: 0 }}>Performance de {activeName}</h3>
                <p style={{ fontSize: 12, color: "#98A2B3", margin: "3px 0 0" }}>Évolution du chiffre d&apos;affaires (FCFA)</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: "#0A8F45" }}>{fmtAmount(kpi?.sales ?? 0)}</span>
                <span style={{ fontSize: 11, color: "#0A8F45", background: "#DDF6E7", borderRadius: 20, padding: "3px 8px", fontWeight: 600 }}>+18,6%</span>
              </div>
            </div>
            <LineChart sales={kpi?.sales ?? 0} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              {CHART_MONTHS.map((m, i) => <span key={i} style={{ fontSize: 9, color: "#98A2B3" }}>{m}</span>)}
            </div>
          </div>

          {/* Mes boutiques */}
          <div style={{ ...card, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1F2A24", margin: 0 }}>Mes boutiques</h3>
              <a href="/settings" style={{ fontSize: 12, color: "#0A8F45", textDecoration: "none", fontWeight: 500 }}>Voir toutes</a>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {allShops.map((s) => {
                const isActive = s.id === activeId;
                return (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, background: isActive ? "#EAF7EF" : "#F8FAF9", border: `1.5px solid ${isActive ? "#C3E6D3" : "#E8ECEA"}`, cursor: "pointer" }}
                    onClick={() => setActiveId(s.id)}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: isActive ? "#0A8F45" : "#E8ECEA", display: "flex", alignItems: "center", justifyContent: "center", color: isActive ? "#fff" : "#667085", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#1F2A24", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</p>
                        {isActive && <span style={{ fontSize: 9, fontWeight: 700, color: "#0A8F45", background: "#DDF6E7", borderRadius: 20, padding: "1px 7px" }}>Sélectionnée</span>}
                      </div>
                      <p style={{ fontSize: 11, color: "#98A2B3", margin: "1px 0 0" }}>{s.productsCount} produits · {s.ordersCount} commandes</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, borderRadius: 20, padding: "2px 8px", background: s.isPublished ? "#DDF6E7" : "#F3F4F6", color: s.isPublished ? "#0A8F45" : "#98A2B3" }}>
                        {s.isPublished ? "Active" : "Inactive"}
                      </span>
                      <a href="/settings" onClick={(e) => e.stopPropagation()} style={{ fontSize: 11, color: "#0A8F45", textDecoration: "none", fontWeight: 500 }}>Gérer →</a>
                    </div>
                  </div>
                );
              })}
            </div>
            <a href="/settings" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14, padding: "9px", borderRadius: 10, border: "1.5px dashed #E8ECEA", color: "#0A8F45", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>
              + Créer une nouvelle boutique
            </a>
          </div>
        </div>

        {/* ── Row 2: Actions rapides + Produits + Commandes ── */}
        <div className="db-row2">

          {/* Actions rapides */}
          <div style={{ ...card, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1F2A24", margin: "0 0 14px" }}>Actions rapides</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {HISTORY_ACTIONS.map((a, i) => (
                <a key={i} href={a.href} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, background: "#F8FAF9", border: "1.5px solid #E8ECEA", textDecoration: "none", color: "#1F2A24", fontSize: 13, fontWeight: 500, transition: "background 0.12s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#EAF7EF"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#F8FAF9"; }}>
                  <span style={{ fontSize: 18 }}>{a.icon}</span>
                  {a.label}
                </a>
              ))}
            </div>
          </div>

          {/* Produits récents */}
          <div style={{ ...card, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1F2A24", margin: 0 }}>Produits récents — <span style={{ color: "#0A8F45" }}>{activeName}</span></h3>
              <a href="/products" style={{ fontSize: 12, color: "#0A8F45", textDecoration: "none", fontWeight: 500 }}>Voir tout</a>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#F8FAF9" }}>
                    {["Produit", "Prix", "Stock", "Statut"].map((h) => (
                      <th key={h} style={{ padding: "7px 10px", textAlign: "left", color: "#98A2B3", fontWeight: 600, fontSize: 10, textTransform: "uppercase", borderBottom: "1px solid #E8ECEA", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: "20px", textAlign: "center", color: "#98A2B3" }}>Aucun produit</td></tr>
                  ) : products.map((p, i) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid #E8ECEA", background: i % 2 === 0 ? "#fff" : "#FAFCFB" }}>
                      <td style={{ padding: "8px 10px", fontWeight: 600, color: "#1F2A24", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</td>
                      <td style={{ padding: "8px 10px", color: "#667085", whiteSpace: "nowrap" }}>{fmtAmount(p.price)}</td>
                      <td style={{ padding: "8px 10px", textAlign: "center" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 20, padding: "2px 8px", background: Number(p.stock) === 0 ? "#FDE8E8" : Number(p.stock) <= 8 ? "#FFF1E5" : "#DDF6E7", color: Number(p.stock) === 0 ? "#EF4444" : Number(p.stock) <= 8 ? "#F08A24" : "#0A8F45" }}>
                          {p.stock}
                        </span>
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        <span style={{ fontSize: 10, fontWeight: 600, borderRadius: 20, padding: "2px 8px", background: "#DDF6E7", color: "#0A8F45" }}>Actif</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Commandes récentes */}
          <div style={{ ...card, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1F2A24", margin: 0 }}>Commandes récentes — <span style={{ color: "#0A8F45" }}>{activeName}</span></h3>
              <a href="/orders" style={{ fontSize: 12, color: "#0A8F45", textDecoration: "none", fontWeight: 500 }}>Voir tout</a>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#F8FAF9" }}>
                    {["Réf.", "Client", "Montant", "Statut", "Canal"].map((h) => (
                      <th key={h} style={{ padding: "7px 10px", textAlign: "left", color: "#98A2B3", fontWeight: 600, fontSize: 10, textTransform: "uppercase", borderBottom: "1px solid #E8ECEA", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "#98A2B3" }}>Aucune commande</td></tr>
                  ) : orders.map((o, i) => {
                    const sStyle = statusStyle(o.status);
                    return (
                      <tr key={o.id} style={{ borderBottom: "1px solid #E8ECEA", background: i % 2 === 0 ? "#fff" : "#FAFCFB" }}>
                        <td style={{ padding: "8px 10px", fontWeight: 600, color: "#1F2A24" }}>{shortId(o.id)}</td>
                        <td style={{ padding: "8px 10px", color: "#667085", maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.customer.fullName}</td>
                        <td style={{ padding: "8px 10px", fontWeight: 600, color: "#1F2A24", whiteSpace: "nowrap" }}>{fmtAmount(o.totalAmount)}</td>
                        <td style={{ padding: "8px 10px" }}>
                          <span style={{ fontSize: 10, fontWeight: 600, borderRadius: 20, padding: "2px 8px", background: sStyle.bg, color: sStyle.color, whiteSpace: "nowrap" }}>
                            {STATUS_LABELS[o.status] ?? o.status}
                          </span>
                        </td>
                        <td style={{ padding: "8px 10px", fontSize: 16 }}>📱</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Row 3: Alertes + Canaux de vente ── */}
        <div className="db-row3">

          {/* Alertes & priorités */}
          <div style={{ ...card, padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1F2A24", margin: "0 0 14px" }}>Alertes & priorités</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                {
                  icon: "⚠️", iconBg: "#FFF1E5", iconColor: "#F08A24",
                  title: `${lowStockCount || 8} produits avec un stock faible`,
                  sub:   "Pensez à réapprovisionner avant rupture",
                  badge: lowStockCount || 8, badgeBg: "#FFF1E5", badgeColor: "#F08A24",
                  href: "/products",
                },
                {
                  icon: "🕐", iconBg: "#E8F0FF", iconColor: "#3B82F6",
                  title: `${(pendingCount + newCount) || 12} commandes en attente de confirmation`,
                  sub:   "Confirmez rapidement pour ne pas perdre vos clients",
                  badge: pendingCount + newCount || 12, badgeBg: "#E8F0FF", badgeColor: "#3B82F6",
                  href: "/orders",
                },
                {
                  icon: "🏪", iconBg: "#FDE8E8", iconColor: "#EF4444",
                  title: "1 boutique inactive depuis plus de 14 jours",
                  sub:   "Beauty House n'est pas publiée",
                  badge: 1, badgeBg: "#FDE8E8", badgeColor: "#EF4444",
                  href: "/settings",
                },
              ].map((alert, i) => (
                <a key={i} href={alert.href} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 12, background: "#F8FAF9", border: "1.5px solid #E8ECEA", textDecoration: "none", transition: "background 0.12s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#EAF7EF"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#F8FAF9"; }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: alert.iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{alert.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#1F2A24", margin: 0 }}>{alert.title}</p>
                    <p style={{ fontSize: 11, color: "#98A2B3", margin: "2px 0 0" }}>{alert.sub}</p>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, background: alert.badgeBg, color: alert.badgeColor, borderRadius: 20, padding: "3px 10px", flexShrink: 0 }}>{alert.badge}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Canaux de vente */}
          <div style={{ ...card, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1F2A24", margin: 0 }}>Canaux de vente</h3>
              <a href="/orders" style={{ fontSize: 12, color: "#0A8F45", textDecoration: "none", fontWeight: 500 }}>Voir le détail</a>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <Donut segments={[{ pct: 58, color: "#0A8F45" }, { pct: 32, color: "#3B82F6" }, { pct: 10, color: "#F08A24" }]} />
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#1F2A24" }}>100%</span>
                </div>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "WhatsApp",         pct: 58, color: "#0A8F45", bg: "#DDF6E7" },
                  { label: "Boutique en ligne", pct: 32, color: "#3B82F6", bg: "#E8F0FF" },
                  { label: "Autres",            pct: 10, color: "#F08A24", bg: "#FFF1E5" },
                ].map((c) => (
                  <div key={c.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: c.color }} />
                        <span style={{ fontSize: 12, color: "#667085" }}>{c.label}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#1F2A24" }}>{c.pct}%</span>
                    </div>
                    <div style={{ height: 4, background: "#E8ECEA", borderRadius: 4 }}>
                      <div style={{ height: "100%", width: `${c.pct}%`, background: c.color, borderRadius: 4, transition: "width 0.5s" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

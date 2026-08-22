"use client";
import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Globe, PenLine, Package, Store, Plus, ShoppingBag, Link2, Settings, Check, TriangleAlert, Clock, ArrowRight } from "lucide-react";
import { useActiveShop } from "@/hooks/useActiveShop";

// ─── Types ────────────────────────────────────────────────────────────────────
type ApiShop = {
  id: string; name: string; slug: string; isPublished: boolean; city: string | null;
  _count: { products: number; orders: number; customers: number };
};
type KpiData = {
  period: string; shopId: string; shopName: string;
  sales: number; confirmedSales: number;
  trend: { date: string; amount: number }[];
  ordersCount: number; customersCount: number;
  statusCounts: Record<string, number>;
  channelCounts: Record<string, number>;
  topProducts: { productId: string; name: string; quantity: number; amount: number }[];
  lowStockCount: number; outOfStockCount: number;
};
type Subscription = {
  plan: { name: string; displayName: string; maxShops: number; maxProducts: number; priceMonthly: number };
  usage: { shops: number; products: number };
  nextPlan: { name: string; displayName: string; priceMonthly: number } | null;
};
type Order = {
  id: string; status: string; paymentStatus: string; channel: string;
  totalAmount: number | string; createdAt: string;
  customer: { fullName: string; phone: string };
};
type Product = { id: string; name: string; unitPrice: number | string; stock: number; isActive?: boolean; };

// ─── Static ───────────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { Icon: Package,     label:"Ajouter un produit",   href:"/products" },
  { Icon: ShoppingBag, label:"Nouvelle commande",    href:"/orders"   },
  { Icon: Link2,       label:"Partager la boutique", href:"/settings" },
  { Icon: Settings,    label:"Paramètres boutique",  href:"/settings" },
];

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  whatsapp: <MessageCircle size={16} color="#25D366" />,
  online:   <Globe size={16} color="#3B82F6" />,
  manual:   <PenLine size={16} color="#667085" />,
};

// ─── CSS ──────────────────────────────────────────────────────────────────────
const DB_CSS = `
@keyframes db-spin { to { transform: rotate(360deg); } }
.db-wrap { padding: 20px 28px; max-width: 1280px; margin: 0 auto; overflow-x: hidden; }
.db-ctx  { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
.db-row1 > *, .db-row2 > *, .db-row3 > * { min-width: 0; }
.db-ctx-create { margin-left: auto; }
.db-kpi  { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px; }
.db-row1 { display: grid; grid-template-columns: 1fr 400px; gap: 20px; margin-bottom: 18px; }
.db-row2 { display: grid; grid-template-columns: 240px 1fr 1fr; gap: 16px; margin-bottom: 18px; }
.db-row3 { display: grid; grid-template-columns: 1fr 380px; gap: 16px; }
.db-quick-grid { display: flex; flex-direction: column; gap: 9px; }
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
  .db-quick-grid { display: grid; grid-template-columns: 1fr 1fr; }
  .db-quick-grid > a, .db-quick-grid > button {
    flex-direction: column; align-items: center; justify-content: center;
    text-align: center; gap: 6px; padding: 14px 8px; font-size: 11px !important;
  }
  .db-quick-grid > a > span, .db-quick-grid > button > span { font-size: 22px !important; }
}
@media (max-width: 640px) {
  .db-ctx { flex-direction: column; align-items: stretch; }
  .db-ctx-create { margin-left: 0; text-align: center; }
  .db-col-hide-sm { display: none !important; }
  .db-kpi { grid-template-columns: 1fr 1fr; gap: 8px; }
  .db-kpi > div { padding: 14px !important; }
  .db-kpi > div > p:first-child { font-size: 10px !important; }
  .db-kpi > div > p:nth-child(2) { font-size: 22px !important; }
}
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtAmount(v: number | string) {
  const n = Number(v);
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + " M FCFA";
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + " K FCFA";
  return Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}
function shortId(id: string) { return "#" + id.slice(-6).toUpperCase(); }

const STATUS_LABELS: Record<string, string> = {
  new:"Nouvelle", pending:"En attente", confirmed:"Confirmée",
  in_progress:"En cours", ready:"Prête", delivered:"Livrée", cancelled:"Annulée",
};
function statusStyle(s: string) {
  if (s === "delivered") return { bg:"#DDF6E7", color:"#0A8F45" };
  if (s === "confirmed" || s === "in_progress") return { bg:"#E8F0FF", color:"#3B82F6" };
  if (s === "cancelled") return { bg:"#FDE8E8", color:"#EF4444" };
  return { bg:"#FFF1E5", color:"#F08A24" };
}

// ─── SVG Line Chart ───────────────────────────────────────────────────────────
function LineChart({ trend }: { trend: { date: string; amount: number }[] }) {
  const w = 480; const h = 100; const pad = 8;
  const pts = trend.length > 1 ? trend.map(t => t.amount) : [0, 0];
  const max = Math.max(...pts) || 1;
  const n = pts.length;
  const coords = pts.map((v, i) => {
    const x = pad + (i / (n - 1)) * (w - pad * 2);
    const y = pad + (1 - v / max) * (h - pad * 2);
    return [x, y] as [number, number];
  });
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x},${y}`).join(" ");
  const area = `${line} L ${coords[n - 1][0]},${h} L ${coords[0][0]},${h} Z`;

  const hasRealTrend = trend.length > 1;
  const labelStep = Math.max(1, Math.floor(n / 6));
  const labelIdxs = hasRealTrend
    ? Array.from({ length: n }, (_, i) => i).filter(i => i % labelStep === 0)
    : [];
  if (hasRealTrend && labelIdxs[labelIdxs.length - 1] !== n - 1) labelIdxs.push(n - 1);

  function fmtLabel(dateStr: string) {
    const [, m, d] = dateStr.split("-");
    return `${d}/${m}`;
  }

  return (
    <svg viewBox={`0 0 ${w} ${h + 18}`} style={{ width:"100%", height:118 }} aria-hidden>
      <defs>
        <linearGradient id="db-lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0A8F45" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0A8F45" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#db-lg)" />
      <path d={line} fill="none" stroke="#0A8F45" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx={coords[n - 1][0]} cy={coords[n - 1][1]} r="4" fill="#0A8F45" />
      {labelIdxs.map(i => (
        <text key={i} x={coords[i][0]} y={h + 14} textAnchor="middle"
          style={{ fontSize: 9, fill: "#98A2B3", fontFamily: "Arial,sans-serif" }}>
          {fmtLabel(trend[i].date)}
        </text>
      ))}
    </svg>
  );
}

// ─── SVG Donut ────────────────────────────────────────────────────────────────
function Donut({ segments }: { segments: { pct: number; color: string }[] }) {
  const r = 34; const C = 2 * Math.PI * r; let acc = 0;
  const hasData = segments.some(s => s.pct > 0);
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" aria-hidden>
      <g transform="rotate(-90 40 40)">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#E8ECEA" strokeWidth="10" />
        {hasData && segments.map((seg, i) => {
          const dash = C * (seg.pct / 100); const off = acc; acc += dash;
          return <circle key={i} cx="40" cy="40" r={r} fill="none" stroke={seg.color} strokeWidth="10"
            strokeDasharray={`${dash} ${C}`} strokeDashoffset={-off} />;
        })}
      </g>
    </svg>
  );
}

const card: React.CSSProperties = {
  background:"#fff", border:"1.5px solid #E8ECEA", borderRadius:18,
  boxShadow:"0 2px 10px rgba(16,24,40,0.04)",
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [activeId, setActiveId] = useActiveShop("");
  const [allShops,    setAllShops]    = useState<ApiShop[]>([]);
  const [isTeamMember, setIsTeamMember] = useState(false);
  const [kpi,       setKpi]       = useState<KpiData | null>(null);
  const [sub,       setSub]       = useState<Subscription | null>(null);
  const [orders,    setOrders]    = useState<Order[]>([]);
  const [products,  setProducts]  = useState<Product[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [ready,     setReady]     = useState(false);
  const [period,    setPeriod]    = useState("30d");
  const [copied,    setCopied]    = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeErr, setUpgradeErr] = useState<string | null>(null);

  async function upgradePlan(planName: string, displayName: string) {
    if (!confirm(`Passer au plan ${displayName} ?\n\nVous allez être redirigé vers la page de paiement sécurisée.`)) return;
    setUpgrading(true);
    setUpgradeErr(null);
    try {
      const res = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planName, billingCycle: "monthly" }),
      });
      const json = await res.json() as { checkoutUrl?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Erreur serveur");
      if (json.checkoutUrl) { window.location.href = json.checkoutUrl; return; }
      throw new Error("URL de paiement manquante");
    } catch (err) {
      setUpgradeErr(err instanceof Error ? err.message : "Erreur serveur");
      setUpgrading(false);
    }
  }

  function copyShopLink(slug: string) {
    const url = `${window.location.origin}/shop/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(slug);
      setTimeout(() => setCopied(null), 2000);
    }).catch(() => {});
  }

  // Load shops + subscription once
  useEffect(() => {
    Promise.all([
      fetch("/api/shop?all=1").then(r => r.json()),
      fetch("/api/subscription").then(r => r.json()),
    ]).then(([shopData, subData]) => {
      const list: ApiShop[] = Array.isArray(shopData.data) ? shopData.data : [];
      setAllShops(list);
      if (shopData.isTeamMember) setIsTeamMember(true);
      if (list.length > 0) {
        const stored = typeof window !== "undefined" ? (localStorage.getItem("biz_active_shop_id") ?? "") : "";
        if (!stored || !list.find(s => s.id === stored)) {
          setActiveId(list[0].id);
        }
      } else {
        setLoading(false);
      }
      if (subData.plan) setSub(subData as Subscription);
      setReady(true);
    }).catch(() => { setLoading(false); setReady(true); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load shop data when active shop or period changes
  useEffect(() => {
    if (!activeId) return;
    loadShopData(activeId);
  }, [activeId, period]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadShopData(shopId: string) {
    setLoading(true);
    try {
      const [kpiRes, ordRes, prdRes] = await Promise.all([
        fetch(`/api/dashboard?shopId=${shopId}&period=${period}`),
        fetch(`/api/orders?shopId=${shopId}`),
        fetch(`/api/products?shopId=${shopId}`),
      ]);
      const [kpiD, ordD, prdD] = await Promise.all([kpiRes.json(), ordRes.json(), prdRes.json()]);
      if (kpiRes.ok) setKpi(kpiD as KpiData);
      setOrders((Array.isArray(ordD.items) ? ordD.items : (Array.isArray(ordD.data) ? ordD.data : [])).slice(0, 5) as Order[]);
      setProducts((Array.isArray(prdD.items) ? prdD.items : (Array.isArray(prdD.data) ? prdD.data : [])).slice(0, 5) as Product[]);
    } catch {}
    setLoading(false);
  }

  // Derived
  const activeShop = allShops.find(s => s.id === activeId) ?? null;
  const activeName = activeShop?.name ?? "Ma boutique";

  const pendingCount   = (kpi?.statusCounts["pending"] ?? 0) + (kpi?.statusCounts["new"] ?? 0);
  const lowStockCount  = kpi?.lowStockCount ?? 0;
  const outOfStock     = kpi?.outOfStockCount ?? 0;
  const unpublishedShops = allShops.filter(s => !s.isPublished);

  const channelCounts  = kpi?.channelCounts ?? { whatsapp:0, online:0, manual:0 };
  const totalOrders    = Object.values(channelCounts).reduce((s, v) => s + v, 0) || 1;
  const channelData    = useMemo(() => [
    { label:"WhatsApp",        pct: Math.round((channelCounts.whatsapp ?? 0) / totalOrders * 100), color:"#0A8F45", bg:"#DDF6E7" },
    { label:"Boutique en ligne",pct: Math.round((channelCounts.online   ?? 0) / totalOrders * 100), color:"#3B82F6", bg:"#E8F0FF" },
    { label:"Manuel",          pct: Math.round((channelCounts.manual   ?? 0) / totalOrders * 100), color:"#F08A24", bg:"#FFF1E5" },
  ], [channelCounts, totalOrders]);

  const planMaxShops = sub?.plan.maxShops ?? 1;
  const usedShops    = sub?.usage.shops ?? allShops.length;
  const quotaPct     = Math.min(100, Math.round((usedShops / planMaxShops) * 100));

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (!ready || (loading && !kpi)) {
    return (
      <>
        <style>{DB_CSS}</style>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:320 }}>
          <div style={{ textAlign:"center", color:"#667085" }}>
            <div style={{ width:40, height:40, border:"3px solid #E8ECEA", borderTopColor:"#0A8F45", borderRadius:"50%", animation:"db-spin 0.8s linear infinite", margin:"0 auto 12px" }} />
            <p style={{ fontSize:14 }}>Chargement du tableau de bord…</p>
          </div>
        </div>
      </>
    );
  }

  // ─── Empty state : aucune boutique ────────────────────────────────────────
  if (ready && allShops.length === 0) {
    return (
      <>
        <style>{DB_CSS}</style>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"calc(100vh - 8rem)", padding:"2rem" }}>
          <div style={{ maxWidth:480, width:"100%", textAlign:"center", display:"grid", gap:"1.5rem" }}>
            <div style={{ width:80, height:80, borderRadius:24, background:"linear-gradient(135deg, #EAF7EF 0%, #d1fae5 100%)", border:"2px solid #C3E6D3", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto" }}>
              <Store size={36} color="#0A8F45" />
            </div>
            {isTeamMember ? (
              <div style={{ display:"grid", gap:"0.6rem" }}>
                <h1 style={{ fontSize:22, fontWeight:800, color:"#1F2A24", margin:0, lineHeight:1.25 }}>
                  Aucune boutique assignée
                </h1>
                <p style={{ fontSize:14, color:"#667085", margin:0, lineHeight:1.6 }}>
                  Votre responsable ne vous a pas encore assigné de boutique.
                  Contactez-le pour obtenir un accès.
                </p>
              </div>
            ) : (
              <>
                <div style={{ display:"grid", gap:"0.6rem" }}>
                  <h1 style={{ fontSize:22, fontWeight:800, color:"#1F2A24", margin:0, lineHeight:1.25 }}>
                    Créez votre première boutique
                  </h1>
                  <p style={{ fontSize:14, color:"#667085", margin:0, lineHeight:1.6 }}>
                    Le tableau de bord affiche les statistiques et l&apos;activité de votre boutique.
                    Vous devez en créer une pour commencer à vendre.
                  </p>
                </div>
                <div style={{ background:"#F8FAF9", border:"1px solid #E8ECEA", borderRadius:16, padding:"1rem 1.25rem", display:"grid", gap:"0.5rem", textAlign:"left" }}>
                  {[
                    { step:"1", text:"Créez votre boutique et personnalisez-la" },
                    { step:"2", text:"Ajoutez vos produits au catalogue" },
                    { step:"3", text:"Partagez le lien à vos clients" },
                  ].map(({ step, text }) => (
                    <div key={step} style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
                      <div style={{ width:24, height:24, borderRadius:"50%", background:"#0A8F45", color:"#fff", fontSize:11, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{step}</div>
                      <span style={{ fontSize:13, color:"#3d4552" }}>{text}</span>
                    </div>
                  ))}
                </div>
                <a href="/shops"
                  style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", gap:"0.5rem", background:"linear-gradient(180deg, #228866 0%, #1d7c5f 100%)", color:"#fff", borderRadius:14, padding:"0.85rem 1.5rem", fontSize:15, fontWeight:700, textDecoration:"none", boxShadow:"0 12px 24px rgba(29,124,95,0.2)", transition:"transform 0.15s ease" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
                  <Plus size={18} />
                  Créer ma première boutique
                </a>
                {sub && (
                  <p style={{ fontSize:12, color:"#98A2B3", margin:0 }}>
                    Plan <strong style={{ color:"#0A8F45" }}>{sub.plan.displayName}</strong> : jusqu&apos;à {sub.plan.maxShops} boutique{sub.plan.maxShops > 1 ? "s" : ""}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{DB_CSS}</style>
      <div className="db-wrap">

        {/* ── Context bar ── */}
        <div className="db-ctx">
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:12, fontWeight:600, color:"#98A2B3", textTransform:"uppercase", letterSpacing:"0.05em" }}>Boutique active</span>
            <div style={{ display:"flex", alignItems:"center", gap:8, background:"#fff", border:"1.5px solid #E8ECEA", borderRadius:10, padding:"6px 14px" }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:"#0A8F45" }} />
              <select value={activeId} onChange={e => setActiveId(e.target.value)}
                style={{ border:"none", outline:"none", fontSize:14, fontWeight:600, color:"#1F2A24", background:"transparent", cursor:"pointer" }}>
                {allShops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {activeShop && (
            <a
              href={`/shop/${activeShop.slug}`}
              target="_blank"
              rel="noreferrer"
              title={activeShop.isPublished ? undefined : "Boutique non publiée : aperçu uniquement"}
              style={{
                display:"inline-flex", alignItems:"center", gap:6,
                background: activeShop.isPublished ? "#EAF7EF" : "#F2F4F7",
                border: `1px solid ${activeShop.isPublished ? "#C3E6D3" : "#E8ECEA"}`,
                color: activeShop.isPublished ? "#0A8F45" : "#98A2B3",
                borderRadius:10, padding:"6px 12px", fontSize:13, fontWeight:600,
                textDecoration:"none", whiteSpace:"nowrap",
              }}>
              <Globe size={14} />
              {activeShop.isPublished ? "Voir ma boutique" : "Aperçu"}
              {!activeShop.isPublished && <span style={{fontSize:10,marginLeft:2,opacity:0.7}}>(brouillon)</span>}
            </a>
          )}

          {sub && !isTeamMember && (
            <div style={{ display:"flex", alignItems:"center", gap:8, background:"#EAF7EF", border:"1px solid #C3E6D3", borderRadius:10, padding:"6px 14px" }}>
              <span style={{ fontSize:13, fontWeight:600, color:"#0A8F45" }}>Plan {sub.plan.displayName}</span>
              <span style={{ width:1, height:14, background:"#C3E6D3" }} />
              <span style={{ fontSize:12, color:"#0A8F45" }}>{usedShops} / {planMaxShops} boutiques</span>
            </div>
          )}

          <select value={period} onChange={e => setPeriod(e.target.value)}
            style={{ border:"1.5px solid #E8ECEA", borderRadius:10, padding:"6px 12px", fontSize:13, color:"#1F2A24", background:"#fff", cursor:"pointer", outline:"none" }}>
            <option value="7d">7 derniers jours</option>
            <option value="30d">30 derniers jours</option>
            <option value="90d">90 derniers jours</option>
          </select>

          {!isTeamMember && (
            <a href="/settings" className="db-ctx-create" style={{ display:"inline-block", background:"#0A8F45", color:"#fff", borderRadius:10, padding:"8px 18px", fontSize:13, fontWeight:600, textDecoration:"none" }}>
              + Créer une boutique
            </a>
          )}
        </div>

        {/* ── Title ── */}
        <div style={{ marginBottom:16 }}>
          <h1 style={{ fontSize:20, fontWeight:700, color:"#1F2A24", margin:0 }}>Tableau de bord</h1>
          <p style={{ fontSize:13, color:"#667085", margin:"4px 0 0" }}>
            Activité et performances de <strong style={{ color:"#1F2A24" }}>{activeName}</strong>
            {kpi && <span style={{ color:"#98A2B3" }}> · {period === "7d" ? "7 derniers jours" : period === "30d" ? "30 derniers jours" : "90 derniers jours"}</span>}
          </p>
        </div>

        {/* ── KPI Cards ── */}
        <div className="db-kpi">
          {[
            { label:"Chiffre d'affaires", value: fmtAmount(kpi?.confirmedSales ?? 0),  sub:"commandes livrées / payées" },
            { label:"Commandes",          value: String(kpi?.ordersCount ?? 0),        sub:"sur la période" },
            { label:"Clients",            value: String(kpi?.customersCount ?? 0),     sub:"total enregistrés" },
            { label:"Produits actifs",    value: String(activeShop?._count.products ?? products.length), sub:"dans le catalogue" },
          ].map(k => (
            <div key={k.label} style={{ ...card, borderRadius:16, padding:"18px 20px", position:"relative", overflow:"hidden" }}>
              <p style={{ fontSize:11, color:"#667085", margin:"0 0 6px", textTransform:"uppercase", letterSpacing:"0.04em", fontWeight:500 }}>{k.label}</p>
              <p style={{ fontSize:26, fontWeight:700, color:"#1F2A24", margin:"0 0 4px", lineHeight:1.1 }}>{k.value}</p>
              <p style={{ fontSize:11, color:"#98A2B3", margin:0 }}>{k.sub}</p>
              <div style={{ position:"absolute", bottom:0, left:0, right:0, height:3, background:"#0A8F45", opacity:0.2 }} />
            </div>
          ))}
        </div>

        {/* ── Plan / quota ── */}
        {sub && !isTeamMember && (
          <div style={{ ...card, padding:"18px 24px", marginBottom:18, display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
            <div style={{ width:40, height:40, borderRadius:"50%", background:"#EAF7EF", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Store size={20} color="#0A8F45" /></div>
            <div style={{ flex:1, minWidth:200 }}>
              <p style={{ fontSize:14, fontWeight:700, color:"#1F2A24", margin:"0 0 2px" }}>
                Plan {sub.plan.displayName} : jusqu&apos;à {planMaxShops} boutique{planMaxShops > 1 ? "s" : ""}
              </p>
              <p style={{ fontSize:12, color:"#667085", margin:0 }}>Gérez plusieurs boutiques et développez votre activité.</p>
            </div>
            <div style={{ minWidth:160 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                <span style={{ fontSize:12, color:"#667085" }}>Boutiques utilisées</span>
                <span style={{ fontSize:12, fontWeight:700, color:"#1F2A24" }}>{usedShops} / {planMaxShops}</span>
              </div>
              <div style={{ height:6, background:"#E8ECEA", borderRadius:4 }}>
                <div style={{ height:"100%", width:`${quotaPct}%`, background: quotaPct >= 100 ? "#EF4444" : "#0A8F45", borderRadius:4, transition:"width 0.5s" }} />
              </div>
            </div>
            {sub.nextPlan && (
              <div style={{ flexShrink:0, display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                <button
                  onClick={() => upgradePlan(sub.nextPlan!.name, sub.nextPlan!.displayName)}
                  disabled={upgrading}
                  style={{ border:"1.5px solid #0A8F45", background: upgrading ? "#EAF7EF" : "#fff", color:"#0A8F45", borderRadius:10, padding:"8px 16px", fontSize:13, fontWeight:600, cursor: upgrading ? "not-allowed" : "pointer", whiteSpace:"nowrap", opacity: upgrading ? 0.7 : 1 }}>
                  {upgrading ? "Mise à jour…" : `Passer au ${sub.nextPlan.displayName}`}
                </button>
                {upgradeErr && <span style={{ fontSize:11, color:"#EF4444" }}>{upgradeErr}</span>}
              </div>
            )}
          </div>
        )}

        {/* ── Row 1: Performance chart + Mes boutiques ── */}
        <div className="db-row1">

          <div style={{ ...card, padding:24 }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:10 }}>
              <div>
                <h3 style={{ fontSize:15, fontWeight:700, color:"#1F2A24", margin:0 }}>Performance de {activeName}</h3>
                <p style={{ fontSize:12, color:"#98A2B3", margin:"3px 0 0" }}>Chiffre d&apos;affaires (période en cours)</p>
              </div>
              <div style={{ textAlign:"right" }}>
                <span style={{ fontSize:22, fontWeight:800, color:"#0A8F45" }}>{fmtAmount(kpi?.confirmedSales ?? 0)}</span>
                <span style={{ display:"block", fontSize:10, color:"#98A2B3", marginTop:2 }}>Volume total : {fmtAmount(kpi?.sales ?? 0)}</span>
              </div>
            </div>
            <LineChart trend={kpi?.trend ?? []} />
          </div>

          {/* Mes boutiques */}
          <div style={{ ...card, padding:20 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
              <h3 style={{ fontSize:15, fontWeight:700, color:"#1F2A24", margin:0 }}>Mes boutiques</h3>
              <a href="/shops" style={{ fontSize:12, color:"#0A8F45", textDecoration:"none", fontWeight:500 }}>Voir toutes</a>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {allShops.length === 0 && (
                <div style={{ textAlign:"center", padding:"20px 0", color:"#98A2B3", fontSize:13 }}>Aucune boutique</div>
              )}
              {allShops.map(s => {
                const isActive = s.id === activeId;
                return (
                  <div key={s.id}
                    style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:12,
                      background: isActive ? "#EAF7EF" : "#F8FAF9", border:`1.5px solid ${isActive ? "#C3E6D3" : "#E8ECEA"}`, cursor:"pointer" }}
                    onClick={() => setActiveId(s.id)}>
                    <div style={{ width:36, height:36, borderRadius:10, background: isActive ? "#0A8F45" : "#E8ECEA",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      color: isActive ? "#fff" : "#667085", fontWeight:700, fontSize:14, flexShrink:0 }}>
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                        <p style={{ fontSize:13, fontWeight:700, color:"#1F2A24", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.name}</p>
                        {isActive && <span style={{ fontSize:9, fontWeight:700, color:"#0A8F45", background:"#DDF6E7", borderRadius:20, padding:"1px 7px" }}>Active</span>}
                      </div>
                      <p style={{ fontSize:11, color:"#98A2B3", margin:"1px 0 0" }}>
                        {s._count.products} produits · {s._count.orders} commandes
                      </p>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5 }}>
                      <span style={{ fontSize:10, fontWeight:600, borderRadius:20, padding:"2px 8px",
                        background: s.isPublished ? "#DDF6E7" : "#F3F4F6",
                        color: s.isPublished ? "#0A8F45" : "#98A2B3" }}>
                        {s.isPublished ? "Publiée" : "Brouillon"}
                      </span>
                      <div style={{ display:"flex", gap:8 }}>
                        <button onClick={e => { e.stopPropagation(); copyShopLink(s.slug); }}
                          style={{ fontSize:11, color: copied === s.slug ? "#0A8F45" : "#667085",
                            fontWeight:500, background:"none", border:"none", cursor:"pointer", padding:0 }}>
                          <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}>
                            {copied === s.slug
                              ? <><Check size={12} strokeWidth={2.5} /> Copié</>
                              : <><Link2 size={12} strokeWidth={2} /> Lien</>}
                          </span>
                        </button>
                        <a href="/settings" onClick={e => e.stopPropagation()} style={{ fontSize:11, color:"#1d7c5f", textDecoration:"none", fontWeight:500, display:"inline-flex", alignItems:"center", gap:3 }}>Gérer <ArrowRight size={11} strokeWidth={2.25} /></a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {!isTeamMember && (
              <a href="/settings" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginTop:14, padding:"9px", borderRadius:10, border:"1.5px dashed #E8ECEA", color:"#0A8F45", fontSize:13, fontWeight:500, textDecoration:"none" }}>
                + Créer une nouvelle boutique
              </a>
            )}
          </div>
        </div>

        {/* ── Row 2: Actions + Produits + Commandes ── */}
        <div className="db-row2">

          <div style={{ ...card, padding:20 }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:"#1F2A24", margin:"0 0 14px" }}>Actions rapides</h3>
            <div className="db-quick-grid">
              {QUICK_ACTIONS.map(({ Icon, ...a }, i) => {
                const sharedStyle: React.CSSProperties = { display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:10, background:"#F8FAF9", border:"1.5px solid #E8ECEA", color:"#1F2A24", fontSize:13, fontWeight:500, cursor:"pointer", width:"100%", boxSizing:"border-box" as const, textDecoration:"none" };
                const isShare = a.label === "Partager la boutique";
                return isShare ? (
                  <button key={i} onClick={() => activeShop && copyShopLink(activeShop.slug)}
                    style={sharedStyle}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#EAF7EF"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#F8FAF9"; }}>
                    {copied === activeShop?.slug
                      ? <Check size={17} strokeWidth={2.25} color="#1d7c5f" />
                      : <Icon size={17} strokeWidth={1.9} color="#565f5c" />}
                    {copied === activeShop?.slug ? "Lien copié !" : a.label}
                  </button>
                ) : (
                  <a key={i} href={a.href}
                    style={sharedStyle}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#EAF7EF"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#F8FAF9"; }}>
                    <Icon size={17} strokeWidth={1.9} color="#565f5c" />
                    {a.label}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Produits récents */}
          <div style={{ ...card, padding:20 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:"#1F2A24", margin:0 }}>
                Produits de <span style={{ color:"#0A8F45" }}>{activeName}</span>
              </h3>
              <a href="/products" style={{ fontSize:12, color:"#0A8F45", textDecoration:"none", fontWeight:500 }}>Voir tout</a>
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead>
                  <tr style={{ background:"#F8FAF9" }}>
                    {[
                      { label:"Produit" },
                      { label:"Prix" },
                      { label:"Stock", hideSm: true },
                      { label:"Statut", hideSm: true },
                    ].map(h => (
                      <th key={h.label} className={h.hideSm ? "db-col-hide-sm" : ""} style={{ padding:"7px 10px", textAlign:"left", color:"#98A2B3", fontWeight:600, fontSize:10, textTransform:"uppercase", borderBottom:"1px solid #E8ECEA", whiteSpace:"nowrap" }}>{h.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding:20, textAlign:"center", color:"#98A2B3" }}>Aucun produit</td></tr>
                  ) : products.map((p, i) => {
                    const stock = Number(p.stock);
                    return (
                      <tr key={p.id} style={{ borderBottom:"1px solid #E8ECEA", background: i % 2 === 0 ? "#fff" : "#FAFCFB" }}>
                        <td style={{ padding:"8px 10px", fontWeight:600, color:"#1F2A24", maxWidth:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</td>
                        <td style={{ padding:"8px 10px", color:"#667085", whiteSpace:"nowrap" }}>{fmtAmount(p.unitPrice)}</td>
                        <td className="db-col-hide-sm" style={{ padding:"8px 10px", textAlign:"center" }}>
                          <span style={{ fontSize:11, fontWeight:600, borderRadius:20, padding:"2px 8px",
                            background: stock === 0 ? "#FDE8E8" : stock <= 8 ? "#FFF1E5" : "#DDF6E7",
                            color:      stock === 0 ? "#EF4444" : stock <= 8 ? "#F08A24" : "#0A8F45" }}>
                            {stock}
                          </span>
                        </td>
                        <td className="db-col-hide-sm" style={{ padding:"8px 10px" }}>
                          <span style={{ fontSize:10, fontWeight:600, borderRadius:20, padding:"2px 8px",
                            background: p.isActive === false ? "#F2F4F7" : "#DDF6E7",
                            color:      p.isActive === false ? "#667085" : "#0A8F45" }}>
                            {p.isActive === false ? "Inactif" : "Actif"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Commandes récentes */}
          <div style={{ ...card, padding:20 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:"#1F2A24", margin:0 }}>
                Commandes de <span style={{ color:"#0A8F45" }}>{activeName}</span>
              </h3>
              <a href="/orders" style={{ fontSize:12, color:"#0A8F45", textDecoration:"none", fontWeight:500 }}>Voir tout</a>
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead>
                  <tr style={{ background:"#F8FAF9" }}>
                    {[
                      { label:"Réf." },
                      { label:"Client" },
                      { label:"Montant" },
                      { label:"Statut" },
                      { label:"Canal", hideSm: true },
                    ].map(h => (
                      <th key={h.label} className={h.hideSm ? "db-col-hide-sm" : ""} style={{ padding:"7px 10px", textAlign:"left", color:"#98A2B3", fontWeight:600, fontSize:10, textTransform:"uppercase", borderBottom:"1px solid #E8ECEA", whiteSpace:"nowrap" }}>{h.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding:20, textAlign:"center", color:"#98A2B3" }}>Aucune commande</td></tr>
                  ) : orders.map((o, i) => {
                    const sStyle = statusStyle(o.status);
                    return (
                      <tr key={o.id} style={{ borderBottom:"1px solid #E8ECEA", background: i % 2 === 0 ? "#fff" : "#FAFCFB" }}>
                        <td style={{ padding:"8px 10px", fontWeight:600, color:"#1F2A24" }}>{shortId(o.id)}</td>
                        <td style={{ padding:"8px 10px", color:"#667085", maxWidth:90, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{o.customer.fullName}</td>
                        <td style={{ padding:"8px 10px", fontWeight:600, color:"#1F2A24", whiteSpace:"nowrap" }}>{fmtAmount(o.totalAmount)}</td>
                        <td style={{ padding:"8px 10px" }}>
                          <span style={{ fontSize:10, fontWeight:600, borderRadius:20, padding:"2px 8px", background:sStyle.bg, color:sStyle.color, whiteSpace:"nowrap" }}>
                            {STATUS_LABELS[o.status] ?? o.status}
                          </span>
                        </td>
                        <td className="db-col-hide-sm" style={{ padding:"8px 10px" }}>{CHANNEL_ICONS[o.channel] ?? <Package size={16} color="#98A2B3" />}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Row 3: Alertes + Canaux ── */}
        <div className="db-row3">

          <div style={{ ...card, padding:20 }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:"#1F2A24", margin:"0 0 14px" }}>Alertes &amp; priorités</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {(lowStockCount + outOfStock) > 0 && (
                <a href="/products" style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 14px", borderRadius:12, background:"#F8FAF9", border:"1.5px solid #E8ECEA", textDecoration:"none" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#EAF7EF"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#F8FAF9"; }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:"#FFF1E5", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><TriangleAlert size={18} color="#c8890f" /></div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:600, color:"#1F2A24", margin:0 }}>
                      {outOfStock > 0 ? `${outOfStock} produit${outOfStock > 1 ? "s" : ""} en rupture de stock` : `${lowStockCount} produit${lowStockCount > 1 ? "s" : ""} avec stock faible`}
                    </p>
                    <p style={{ fontSize:11, color:"#98A2B3", margin:"2px 0 0" }}>Réapprovisionnez avant rupture</p>
                  </div>
                  <span style={{ fontSize:13, fontWeight:700, background:"#FFF1E5", color:"#F08A24", borderRadius:20, padding:"3px 10px", flexShrink:0 }}>{outOfStock + lowStockCount}</span>
                </a>
              )}
              {pendingCount > 0 && (
                <a href="/orders" style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 14px", borderRadius:12, background:"#F8FAF9", border:"1.5px solid #E8ECEA", textDecoration:"none" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#EAF7EF"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#F8FAF9"; }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:"#E8F0FF", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Clock size={18} color="#2f6fb5" /></div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:600, color:"#1F2A24", margin:0 }}>{pendingCount} commande{pendingCount > 1 ? "s" : ""} en attente de confirmation</p>
                    <p style={{ fontSize:11, color:"#98A2B3", margin:"2px 0 0" }}>Confirmez rapidement pour ne pas perdre vos clients</p>
                  </div>
                  <span style={{ fontSize:13, fontWeight:700, background:"#E8F0FF", color:"#3B82F6", borderRadius:20, padding:"3px 10px", flexShrink:0 }}>{pendingCount}</span>
                </a>
              )}
              {unpublishedShops.length > 0 && (
                <a href="/settings" style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 14px", borderRadius:12, background:"#F8FAF9", border:"1.5px solid #E8ECEA", textDecoration:"none" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#EAF7EF"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#F8FAF9"; }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:"#FDE8E8", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Store size={18} color="#EF4444" /></div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:600, color:"#1F2A24", margin:0 }}>{unpublishedShops.length} boutique{unpublishedShops.length > 1 ? "s" : ""} non publiée{unpublishedShops.length > 1 ? "s" : ""}</p>
                    <p style={{ fontSize:11, color:"#98A2B3", margin:"2px 0 0" }}>
                      {unpublishedShops.map(s => s.name).join(", ")} : non visible{unpublishedShops.length > 1 ? "s" : ""} par vos clients
                    </p>
                  </div>
                  <span style={{ fontSize:13, fontWeight:700, background:"#FDE8E8", color:"#EF4444", borderRadius:20, padding:"3px 10px", flexShrink:0 }}>{unpublishedShops.length}</span>
                </a>
              )}
              {(lowStockCount + outOfStock) === 0 && pendingCount === 0 && unpublishedShops.length === 0 && (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7, padding:"20px 0", color:"#9aa5a1", fontSize:13 }}>
                  <Check size={15} strokeWidth={2.25} color="#1d7c5f" />
                  Aucune alerte en cours
                </div>
              )}
            </div>
          </div>

          {/* Canaux de vente */}
          <div style={{ ...card, padding:20 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
              <h3 style={{ fontSize:15, fontWeight:700, color:"#1F2A24", margin:0 }}>Canaux de vente</h3>
              <a href="/orders" style={{ fontSize:12, color:"#0A8F45", textDecoration:"none", fontWeight:500 }}>Voir le détail</a>
            </div>
            {(kpi?.ordersCount ?? 0) === 0 ? (
              <div style={{ textAlign:"center", padding:"20px 0", color:"#98A2B3", fontSize:13 }}>Aucune commande sur la période</div>
            ) : (
              <div style={{ display:"flex", alignItems:"center", gap:20 }}>
                <div style={{ position:"relative", flexShrink:0 }}>
                  <Donut segments={channelData.map(c => ({ pct:c.pct, color:c.color }))} />
                  <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column" }}>
                    <span style={{ fontSize:13, fontWeight:800, color:"#1F2A24" }}>{kpi?.ordersCount ?? 0}</span>
                  </div>
                </div>
                <div style={{ flex:1, display:"flex", flexDirection:"column", gap:12 }}>
                  {channelData.map(c => (
                    <div key={c.label}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                          <div style={{ width:8, height:8, borderRadius:2, background:c.color }} />
                          <span style={{ fontSize:12, color:"#667085" }}>{c.label}</span>
                        </div>
                        <span style={{ fontSize:12, fontWeight:700, color:"#1F2A24" }}>{c.pct}%</span>
                      </div>
                      <div style={{ height:4, background:"#E8ECEA", borderRadius:4 }}>
                        <div style={{ height:"100%", width:`${c.pct}%`, background:c.color, borderRadius:4, transition:"width 0.5s" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
}

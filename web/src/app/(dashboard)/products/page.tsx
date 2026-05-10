"use client";
import { useEffect, useMemo, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Shop = { id: string; name: string; slug: string; isPublished: boolean; city: string | null; };
type ApiProduct = { id: string; name: string; price: number | string; stock: number; category?: string; createdAt?: string; isPublished?: boolean; };

type MockProduct = {
  id: string; name: string; sku: string; category: string;
  price: number; stock: number; status: "active"|"draft"|"low"|"out";
  sync: "ok"|"pending"|"error"; updatedAt: string;
};

// ─── Static data ──────────────────────────────────────────────────────────────
const MOCK_SHOPS = [
  { id: "s1", name: "Mon Aventure",  products: 78,  orders: 156, ca: "8 420", isActive: true,  isPublished: true,  city: "Dakar"   },
  { id: "s2", name: "Urban Style",   products: 42,  orders: 89,  ca: "4 210", isActive: false, isPublished: true,  city: "Abidjan" },
  { id: "s3", name: "Beauty House",  products: 28,  orders: 34,  ca: "1 980", isActive: false, isPublished: false, city: "Douala"  },
];

const MOCK_PRODUCTS: MockProduct[] = [
  { id:"p1", name:"Sac à dos Explorer",   sku:"SAC-001", category:"Accessoires", price:18900, stock:24, status:"active",  sync:"ok",      updatedAt:"2026-05-08" },
  { id:"p2", name:"Baskets Urban White",  sku:"BSK-012", category:"Chaussures",  price:32500, stock:6,  status:"low",     sync:"ok",      updatedAt:"2026-05-07" },
  { id:"p3", name:"Montre Classic Noir",  sku:"MON-034", category:"Accessoires", price:45000, stock:0,  status:"out",     sync:"error",   updatedAt:"2026-05-06" },
  { id:"p4", name:"Lunettes Premium",     sku:"LUN-008", category:"Accessoires", price:12800, stock:18, status:"active",  sync:"ok",      updatedAt:"2026-05-05" },
  { id:"p5", name:"Robe Élégance",        sku:"ROB-021", category:"Vêtements",   price:28000, stock:11, status:"active",  sync:"pending", updatedAt:"2026-05-04" },
  { id:"p6", name:"Crème Éclat",          sku:"CRM-005", category:"Beauté",      price:8500,  stock:3,  status:"low",     sync:"ok",      updatedAt:"2026-05-03" },
  { id:"p7", name:"Parfum Signature",     sku:"PAR-019", category:"Parfums",     price:54000, stock:9,  status:"draft",   sync:"pending", updatedAt:"2026-05-02" },
];

const DONUT_DATA = [
  { label:"Accessoires", pct:34, color:"#0A8F45" },
  { label:"Chaussures",  pct:22, color:"#3BB870" },
  { label:"Vêtements",   pct:19, color:"#7DD4A8" },
  { label:"Beauté",      pct:15, color:"#F08A24" },
  { label:"Parfums",     pct:10, color:"#98A2B3" },
];

const TIPS = [
  { icon:"📸", t:"Optimisation photos",  d:"Des photos HD augmentent les conversions de 40%." },
  { icon:"📦", t:"Gestion des stocks",   d:"Activez les alertes stock pour éviter les ruptures." },
  { icon:"🏷️", t:"Catégories claires",  d:"Des catégories bien définies améliorent la navigation." },
  { icon:"🔍", t:"SEO produit",          d:"Remplissez les méta-données pour être mieux référencé." },
];

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
.pr-wrap  { padding:24px 28px; max-width:1280px; margin:0 auto; background:#F8FAF9; min-height:100vh; }

/* context bar */
.pr-ctx   { display:flex; align-items:center; gap:14px; flex-wrap:wrap; margin-bottom:16px; }
.pr-ctx-r { margin-left:auto; display:flex; gap:10px; }

/* title */
.pr-title { margin-bottom:18px; }

/* kpi */
.pr-kpi   { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:16px; }

/* info card */
.pr-info  { display:flex; align-items:center; gap:24px; background:#fff; border:1px solid #E8ECEA;
            border-radius:16px; padding:18px 24px; margin-bottom:20px;
            box-shadow:0 2px 10px rgba(16,24,40,.04); flex-wrap:wrap; }
.pr-hier  { display:flex; align-items:center; gap:8px; font-size:13px; color:#1F2A24; }
.pr-hier-sep { color:#98A2B3; font-size:16px; }

/* main grid */
.pr-main  { display:grid; grid-template-columns:1fr 360px; gap:18px; margin-bottom:18px; }

/* table card */
.pr-tcard { background:#fff; border:1px solid #E8ECEA; border-radius:18px;
            box-shadow:0 2px 10px rgba(16,24,40,.04); overflow:hidden; }
.pr-tbar  { display:flex; align-items:center; gap:10px; padding:16px 20px; border-bottom:1px solid #E8ECEA; flex-wrap:wrap; }
.pr-tacts { display:flex; gap:8px; margin-left:auto; }
.pr-ftrow { display:flex; gap:8px; padding:12px 20px; border-bottom:1px solid #E8ECEA; flex-wrap:wrap; }
.pr-table { width:100%; border-collapse:collapse; font-size:13px; }
.pr-table th { padding:10px 12px; text-align:left; color:#667085; font-weight:500;
               border-bottom:1px solid #E8ECEA; white-space:nowrap; background:#FAFBFA; }
.pr-table td { padding:11px 12px; border-bottom:1px solid #F4F6F5; color:#1F2A24; vertical-align:middle; }
.pr-table tr:hover td { background:#FAFBFA; }
.pr-table tr:last-child td { border-bottom:none; }
.pr-prod-cell { display:flex; align-items:center; gap:10px; }
.pr-prod-av   { width:36px; height:36px; border-radius:10px; background:#EAF7EF;
                display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; }
.pr-act-btns  { display:flex; gap:4px; }
.pr-act-btn   { border:none; background:none; cursor:pointer; padding:4px 6px; border-radius:6px;
                font-size:14px; color:#667085; transition:background .15s; }
.pr-act-btn:hover { background:#F4F6F5; }

/* right col */
.pr-right { display:flex; flex-direction:column; gap:14px; }
.pr-card  { background:#fff; border:1px solid #E8ECEA; border-radius:16px;
            padding:18px; box-shadow:0 2px 10px rgba(16,24,40,.04); }

/* shop rows */
.pr-shop-row  { display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid #F4F6F5; cursor:pointer; }
.pr-shop-row:last-child { border-bottom:none; }
.pr-shop-av   { width:34px; height:34px; border-radius:10px; display:flex; align-items:center;
                justify-content:center; font-weight:700; font-size:13px; color:#fff; flex-shrink:0; }
.pr-prog      { height:4px; border-radius:4px; background:#E8ECEA; margin-top:4px; overflow:hidden; }
.pr-prog-bar  { height:100%; border-radius:4px; background:#0A8F45; }

/* donut */
.pr-donut-wrap { display:flex; align-items:center; gap:18px; }
.pr-donut-legend { flex:1; display:flex; flex-direction:column; gap:6px; }
.pr-donut-item { display:flex; align-items:center; gap:8px; font-size:12px; color:#1F2A24; }
.pr-dot        { width:9px; height:9px; border-radius:50%; flex-shrink:0; }

/* alerts */
.pr-alert-row { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid #F4F6F5; font-size:13px; }
.pr-alert-row:last-child { border-bottom:none; }

/* bottom */
.pr-bottom { display:grid; grid-template-columns:1fr 1fr; gap:16px; }

/* badges */
.badge { display:inline-flex; align-items:center; gap:4px; padding:3px 9px; border-radius:20px;
         font-size:11px; font-weight:600; white-space:nowrap; }
.badge-green  { background:#DDF6E7; color:#0A8F45; }
.badge-orange { background:#FFF1E5; color:#F08A24; }
.badge-red    { background:#FDE8E8; color:#EF4444; }
.badge-gray   { background:#F2F4F7; color:#667085; }
.badge-blue   { background:#EFF8FF; color:#175CD3; }
.badge-biz    { background:#EAF7EF; color:#08763A; }

/* inputs */
.inp { height:36px; padding:0 12px; border:1px solid #E8ECEA; border-radius:10px;
       font-size:13px; color:#1F2A24; background:#fff; outline:none; }
.inp:focus { border-color:#0A8F45; }
.sel { height:36px; padding:0 10px; border:1px solid #E8ECEA; border-radius:10px;
       font-size:13px; color:#1F2A24; background:#fff; cursor:pointer; outline:none; }

/* buttons */
.btn-primary   { height:36px; padding:0 16px; background:#0A8F45; color:#fff; border:none;
                 border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; white-space:nowrap; }
.btn-primary:hover { background:#08763A; }
.btn-secondary { height:36px; padding:0 14px; background:#fff; color:#1F2A24;
                 border:1px solid #E8ECEA; border-radius:10px; font-size:13px; cursor:pointer; white-space:nowrap; }
.btn-secondary:hover { background:#F8FAF9; }
.btn-sm        { height:30px; padding:0 12px; border-radius:8px; font-size:12px; cursor:pointer; white-space:nowrap; }

/* progress bar */
.quota-bar  { height:6px; border-radius:4px; background:#E8ECEA; overflow:hidden; margin-top:4px; }
.quota-fill { height:100%; border-radius:4px; background:#0A8F45; }

@media(max-width:1100px){
  .pr-kpi  { grid-template-columns:repeat(2,1fr); }
  .pr-main { grid-template-columns:1fr; }
  .pr-right{ flex-direction:row; flex-wrap:wrap; }
  .pr-card { min-width:280px; flex:1; }
}
@media(max-width:700px){
  .pr-kpi   { grid-template-columns:1fr 1fr; }
  .pr-bottom{ grid-template-columns:1fr; }
  .pr-ctx   { flex-direction:column; align-items:flex-start; }
  .pr-ctx-r { margin-left:0; }
  .pr-wrap  { padding:14px 12px; }
}
`;

// ─── Badge helpers ─────────────────────────────────────────────────────────────
function StatusBadge({ s }: { s: MockProduct["status"] }) {
  if (s === "active") return <span className="badge badge-green">Actif</span>;
  if (s === "low")    return <span className="badge badge-orange">Stock faible</span>;
  if (s === "out")    return <span className="badge badge-red">Rupture</span>;
  return <span className="badge badge-gray">Brouillon</span>;
}
function SyncBadge({ s }: { s: MockProduct["sync"] }) {
  if (s === "ok")      return <span className="badge badge-blue">Synchronisé</span>;
  if (s === "pending") return <span className="badge badge-gray">En attente</span>;
  return <span className="badge badge-red">Erreur sync</span>;
}

// ─── Mini Donut ───────────────────────────────────────────────────────────────
function DonutChart() {
  const r = 44; const cx = 52; const cy = 52; const circ = 2 * Math.PI * r;
  let offset = 0;
  const slices = DONUT_DATA.map(d => {
    const dash = (d.pct / 100) * circ;
    const s = { dash, gap: circ - dash, offset };
    offset += dash;
    return s;
  });
  return (
    <div className="pr-donut-wrap">
      <svg width="104" height="104" viewBox="0 0 104 104" style={{ flexShrink: 0 }}>
        {DONUT_DATA.map((d, i) => (
          <circle key={d.label} cx={cx} cy={cy} r={r} fill="none"
            stroke={d.color} strokeWidth="14"
            strokeDasharray={`${slices[i].dash} ${slices[i].gap}`}
            strokeDashoffset={-slices[i].offset}
            style={{ transform: "rotate(-90deg)", transformOrigin: "52px 52px" }} />
        ))}
        <text x="52" y="48" textAnchor="middle" fontSize="12" fill="#1F2A24" fontWeight="700">78</text>
        <text x="52" y="62" textAnchor="middle" fontSize="10" fill="#98A2B3">produits</text>
      </svg>
      <div className="pr-donut-legend">
        {DONUT_DATA.map(d => (
          <div key={d.label} className="pr-donut-item">
            <span className="pr-dot" style={{ background: d.color }} />
            <span style={{ flex: 1 }}>{d.label}</span>
            <strong>{d.pct}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PRODUCT EMOJI ────────────────────────────────────────────────────────────
const EMOJIS: Record<string, string> = {
  "Accessoires":"🎒","Chaussures":"👟","Vêtements":"👗","Beauté":"✨","Parfums":"🌸",
};

// ─── Main component ────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const [activeShopId, setActiveShopId] = useState("s1");
  const [search, setSearch]             = useState("");
  const [catFilter, setCatFilter]       = useState("all");
  const [stockFilter, setStockFilter]   = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy]             = useState("name");
  const [realShop, setRealShop]         = useState<Shop | null>(null);

  const activeShop = MOCK_SHOPS.find(s => s.id === activeShopId) ?? MOCK_SHOPS[0];

  useEffect(() => {
    fetch("/api/shop").then(r => r.json()).then(d => {
      const sh = Array.isArray(d) ? d[0] : (d.data ?? d);
      if (sh?.id) setRealShop(sh);
    }).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    let p = [...MOCK_PRODUCTS];
    if (search) p = p.filter(x => x.name.toLowerCase().includes(search.toLowerCase()) || x.sku.toLowerCase().includes(search.toLowerCase()));
    if (catFilter   !== "all") p = p.filter(x => x.category === catFilter);
    if (stockFilter !== "all") {
      if (stockFilter === "ok")  p = p.filter(x => x.stock > 5);
      if (stockFilter === "low") p = p.filter(x => x.stock > 0 && x.stock <= 5);
      if (stockFilter === "out") p = p.filter(x => x.stock === 0);
    }
    if (statusFilter !== "all") p = p.filter(x => x.status === statusFilter);
    if (sortBy === "price-asc")  p.sort((a,b) => a.price - b.price);
    if (sortBy === "price-desc") p.sort((a,b) => b.price - a.price);
    if (sortBy === "stock")      p.sort((a,b) => a.stock - b.stock);
    if (sortBy === "name")       p.sort((a,b) => a.name.localeCompare(b.name));
    return p;
  }, [search, catFilter, stockFilter, statusFilter, sortBy]);

  const shopColors = ["#0A8F45","#3B82F6","#F08A24"];

  return (
    <>
      <style>{CSS}</style>
      <div className="pr-wrap">

        {/* ── Context bar ── */}
        <div className="pr-ctx">
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:12, color:"#667085", fontWeight:500 }}>Boutique active</span>
            <select className="sel" style={{ fontWeight:700, color:"#0A8F45", borderColor:"#0A8F45", minWidth:160 }}
              value={activeShopId} onChange={e => setActiveShopId(e.target.value)}>
              {MOCK_SHOPS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            <span className="badge badge-biz" style={{ padding:"5px 12px", fontSize:12 }}>Plan Business</span>
            <div>
              <div style={{ fontSize:12, color:"#1F2A24", fontWeight:500 }}>2 / 3 boutiques utilisées</div>
              <div style={{ fontSize:11, color:"#98A2B3" }}>78 / 500 produits utilisés</div>
            </div>
          </div>

          <div className="pr-ctx-r">
            <button className="btn-secondary btn-sm">⬆ Importer un catalogue</button>
            <button className="btn-primary  btn-sm">+ Créer une boutique</button>
          </div>
        </div>

        {/* ── Title ── */}
        <div className="pr-title">
          <h1 style={{ fontSize:22, fontWeight:700, color:"#1F2A24", margin:0 }}>Produits</h1>
          <p style={{ margin:"4px 0 2px", color:"#667085", fontSize:14 }}>
            Gérez les produits de votre boutique active et pilotez un catalogue indépendant par boutique.
          </p>
          <p style={{ margin:0, color:"#98A2B3", fontSize:12 }}>
            Les produits affichés ici appartiennent uniquement à la boutique&nbsp;
            <strong style={{ color:"#0A8F45" }}>{activeShop.name}</strong>.
          </p>
        </div>

        {/* ── KPI row ── */}
        <div className="pr-kpi">
          {[
            { label:"Produits actifs",  val:"78",      sub:"+6,7%",     icon:"📦", color:"#DDF6E7", tc:"#0A8F45" },
            { label:"Stock faible",     val:"8",        sub:"produits",  icon:"⚠️", color:"#FFF1E5", tc:"#F08A24" },
            { label:"En rupture",       val:"3",        sub:"produits",  icon:"🔴", color:"#FDE8E8", tc:"#EF4444" },
            { label:"Valeur du stock",  val:"12 480 €", sub:"en stock",  icon:"💰", color:"#EAF7EF", tc:"#0A8F45" },
          ].map(k => (
            <div key={k.label} style={{ background:"#fff", border:"1px solid #E8ECEA", borderRadius:16,
              padding:"16px 18px", boxShadow:"0 2px 10px rgba(16,24,40,.04)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <span style={{ fontSize:13, color:"#667085", fontWeight:500 }}>{k.label}</span>
                <span style={{ fontSize:20, background:k.color, padding:"5px 7px", borderRadius:10 }}>{k.icon}</span>
              </div>
              <div style={{ fontSize:26, fontWeight:800, color:"#1F2A24", margin:"8px 0 4px", letterSpacing:"-0.5px" }}>{k.val}</div>
              <div style={{ fontSize:11, color:k.tc, fontWeight:500 }}>{k.sub}</div>
              <div style={{ fontSize:10, color:"#98A2B3", marginTop:6 }}>Boutique : {activeShop.name}</div>
            </div>
          ))}
        </div>

        {/* ── Info card ── */}
        <div className="pr-info">
          <div style={{ fontSize:28 }}>🏪</div>
          <div style={{ flex:1, minWidth:220 }}>
            <div style={{ fontWeight:700, color:"#1F2A24", fontSize:14 }}>
              Tous les produits affichés ici appartiennent à la boutique active&nbsp;
              <span style={{ color:"#0A8F45" }}>{activeShop.name}</span>.
            </div>
            <div style={{ color:"#667085", fontSize:12, marginTop:3 }}>
              Les produits ne sont plus liés directement au marchand mais à une boutique spécifique.
            </div>
          </div>
          <div style={{ borderLeft:"1px solid #E8ECEA", paddingLeft:20, minWidth:200 }}>
            <div className="pr-hier">
              <span style={{ background:"#EAF7EF", color:"#0A8F45", padding:"3px 8px", borderRadius:8, fontWeight:600, fontSize:12 }}>
                {realShop ? realShop.name.slice(0,2).toUpperCase() : "MA"}
              </span>
              <span className="pr-hier-sep">→</span>
              <span style={{ fontWeight:600 }}>{activeShop.name}</span>
              <span className="pr-hier-sep">→</span>
              <span style={{ color:"#667085" }}>78 produits</span>
            </div>
            <div style={{ fontSize:11, color:"#98A2B3", marginTop:6 }}>Marchand → Boutique → Produits</div>
          </div>
          <div style={{ minWidth:160 }}>
            <div style={{ fontSize:12, color:"#667085", fontWeight:500 }}>Quota boutiques</div>
            <div style={{ fontWeight:700, color:"#1F2A24", margin:"4px 0 2px" }}>2 / 3</div>
            <div className="quota-bar" style={{ width:120 }}>
              <div className="quota-fill" style={{ width:"66%" }} />
            </div>
          </div>
        </div>

        {/* ── Main 2-col ── */}
        <div className="pr-main">

          {/* Left: product table card */}
          <div className="pr-tcard">
            {/* card header */}
            <div className="pr-tbar">
              <div>
                <div style={{ fontWeight:700, color:"#1F2A24", fontSize:15 }}>
                  Gestion des produits — {activeShop.name}
                  <span className="badge badge-biz" style={{ marginLeft:10, fontSize:10 }}>Catalogue indépendant</span>
                </div>
                <div style={{ fontSize:11, color:"#98A2B3", marginTop:2 }}>
                  Tous les produits de cette liste appartiennent exclusivement à cette boutique.
                </div>
              </div>
              <div className="pr-tacts">
                <button className="btn-secondary btn-sm">⬆ Importer</button>
                <button className="btn-secondary btn-sm">⬇ Exporter</button>
                <button className="btn-secondary btn-sm">🔄 Synchroniser</button>
                <button className="btn-primary  btn-sm">+ Ajouter un produit</button>
              </div>
            </div>

            {/* filters */}
            <div className="pr-ftrow">
              <input className="inp" placeholder="🔍 Rechercher un produit ou SKU…" style={{ flex:1, minWidth:160 }}
                value={search} onChange={e => setSearch(e.target.value)} />
              <select className="sel" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                <option value="all">Catégories</option>
                {["Accessoires","Chaussures","Vêtements","Beauté","Parfums"].map(c =>
                  <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="sel" value={stockFilter} onChange={e => setStockFilter(e.target.value)}>
                <option value="all">Stock</option>
                <option value="ok">OK</option>
                <option value="low">Faible</option>
                <option value="out">Rupture</option>
              </select>
              <select className="sel" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">Statut</option>
                <option value="active">Actif</option>
                <option value="draft">Brouillon</option>
                <option value="low">Stock faible</option>
                <option value="out">Rupture</option>
              </select>
              <select className="sel" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="name">Trier : Nom</option>
                <option value="price-asc">Prix ↑</option>
                <option value="price-desc">Prix ↓</option>
                <option value="stock">Stock ↑</option>
              </select>
              <div className="inp" style={{ display:"flex", alignItems:"center", gap:6, color:"#98A2B3", fontSize:12, cursor:"default", minWidth:130 }}>
                🔒 {activeShop.name}
              </div>
            </div>

            {/* table */}
            <div style={{ overflowX:"auto" }}>
              <table className="pr-table">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>SKU</th>
                    <th>Boutique</th>
                    <th>Catégorie</th>
                    <th>Prix</th>
                    <th>Stock</th>
                    <th>Statut</th>
                    <th>Sync</th>
                    <th>Mise à jour</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div className="pr-prod-cell">
                          <div className="pr-prod-av">{EMOJIS[p.category] ?? "📦"}</div>
                          <div>
                            <div style={{ fontWeight:600, fontSize:13 }}>{p.name}</div>
                            <div style={{ fontSize:11, color:"#98A2B3" }}>{p.category}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily:"monospace", fontSize:12, color:"#667085" }}>{p.sku}</td>
                      <td>
                        <span className="badge badge-biz" style={{ fontSize:10 }}>{activeShop.name}</span>
                      </td>
                      <td style={{ fontSize:12, color:"#667085" }}>{p.category}</td>
                      <td style={{ fontWeight:600 }}>{p.price.toLocaleString("fr-FR")} FCFA</td>
                      <td>
                        <span style={{ fontWeight:700, color: p.stock === 0 ? "#EF4444" : p.stock <= 5 ? "#F08A24" : "#1F2A24" }}>
                          {p.stock}
                        </span>
                      </td>
                      <td><StatusBadge s={p.status} /></td>
                      <td><SyncBadge s={p.sync} /></td>
                      <td style={{ fontSize:11, color:"#98A2B3" }}>{p.updatedAt}</td>
                      <td>
                        <div className="pr-act-btns">
                          <button className="pr-act-btn" title="Éditer">✏️</button>
                          <button className="pr-act-btn" title="Dupliquer">📋</button>
                          <button className="pr-act-btn" title="Voir">👁️</button>
                          <button className="pr-act-btn" title="Archiver">📁</button>
                          <button className="pr-act-btn" title="Supprimer" style={{ color:"#EF4444" }}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={10} style={{ textAlign:"center", padding:32, color:"#98A2B3" }}>
                      Aucun produit trouvé.
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ padding:"12px 20px", display:"flex", justifyContent:"space-between", alignItems:"center",
              borderTop:"1px solid #E8ECEA", fontSize:12, color:"#98A2B3" }}>
              <span>{filtered.length} produit{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}</span>
              <div style={{ display:"flex", gap:6 }}>
                <button className="btn-secondary btn-sm" style={{ height:28, padding:"0 10px", fontSize:11 }}>← Précédent</button>
                <button className="btn-secondary btn-sm" style={{ height:28, padding:"0 10px", fontSize:11 }}>Suivant →</button>
              </div>
            </div>
          </div>

          {/* Right col */}
          <div className="pr-right">

            {/* Boutique active card */}
            <div className="pr-card">
              <div style={{ fontSize:13, fontWeight:700, color:"#1F2A24", marginBottom:12 }}>Boutique active</div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:"#EAF7EF",
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🏪</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:15, color:"#1F2A24" }}>{activeShop.name}</div>
                  <span className="badge badge-green" style={{ fontSize:10 }}>Active</span>
                </div>
              </div>
              {[
                { l:"Produits",  v: activeShop.products },
                { l:"Catégories", v: 12 },
                { l:"Commandes", v: activeShop.orders },
                { l:"Chiffre d'affaires", v: `${activeShop.ca} €` },
              ].map(r => (
                <div key={r.l} style={{ display:"flex", justifyContent:"space-between",
                  padding:"7px 0", borderBottom:"1px solid #F4F6F5", fontSize:13 }}>
                  <span style={{ color:"#667085" }}>{r.l}</span>
                  <strong style={{ color:"#1F2A24" }}>{r.v}</strong>
                </div>
              ))}
              <div style={{ display:"flex", gap:8, marginTop:12 }}>
                <button className="btn-secondary btn-sm" style={{ flex:1 }}>Voir la boutique</button>
                <button className="btn-primary btn-sm" style={{ flex:1 }}
                  onClick={() => {
                    const next = MOCK_SHOPS.find(s => s.id !== activeShopId);
                    if (next) setActiveShopId(next.id);
                  }}>Changer</button>
              </div>
            </div>

            {/* Mes boutiques */}
            <div className="pr-card">
              <div style={{ fontSize:13, fontWeight:700, color:"#1F2A24", marginBottom:10 }}>Mes boutiques</div>
              {MOCK_SHOPS.map((s, i) => (
                <div key={s.id} className="pr-shop-row"
                  style={{ background: s.id === activeShopId ? "#EAF7EF" : "transparent", borderRadius:10, padding:"8px 10px" }}
                  onClick={() => setActiveShopId(s.id)}>
                  <div className="pr-shop-av" style={{ background: shopColors[i] ?? "#0A8F45" }}>
                    {s.name.slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:13, color:"#1F2A24", display:"flex", alignItems:"center", gap:6 }}>
                      {s.name}
                      {s.id === activeShopId && <span style={{ fontSize:9, background:"#0A8F45", color:"#fff", borderRadius:4, padding:"1px 5px" }}>Actif</span>}
                    </div>
                    <div style={{ fontSize:11, color:"#98A2B3" }}>{s.products} produits · {s.city}</div>
                    <div className="pr-prog">
                      <div className="pr-prog-bar" style={{ width:`${Math.round(s.products/5)}%`, background: shopColors[i] }} />
                    </div>
                  </div>
                  <span className={s.isPublished ? "badge badge-green" : "badge badge-gray"} style={{ fontSize:10 }}>
                    {s.isPublished ? "Actif" : "Inactif"}
                  </span>
                </div>
              ))}
            </div>

            {/* Architecture catalogue */}
            <div className="pr-card">
              <div style={{ fontSize:13, fontWeight:700, color:"#1F2A24", marginBottom:12 }}>Architecture du catalogue</div>
              <div style={{ textAlign:"center", padding:"8px 0" }}>
                {[
                  { icon:"👤", label:"Marchand", sub:"Marie A." },
                  { icon:"🏪", label:"Boutiques", sub:"3 boutiques" },
                  { icon:"📦", label:"Produits",  sub:"148 produits" },
                ].map((r, i, arr) => (
                  <div key={r.label}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, justifyContent:"center",
                      background:"#F8FAF9", borderRadius:12, padding:"8px 16px", fontSize:13 }}>
                      <span style={{ fontSize:18 }}>{r.icon}</span>
                      <div style={{ textAlign:"left" }}>
                        <div style={{ fontWeight:600, color:"#1F2A24" }}>{r.label}</div>
                        <div style={{ fontSize:11, color:"#98A2B3" }}>{r.sub}</div>
                      </div>
                    </div>
                    {i < arr.length - 1 && (
                      <div style={{ fontSize:18, color:"#0A8F45", margin:"4px 0" }}>↓</div>
                    )}
                  </div>
                ))}
              </div>
              <p style={{ fontSize:11, color:"#98A2B3", textAlign:"center", margin:"10px 0 0" }}>
                Chaque boutique possède son propre catalogue indépendant.
              </p>
            </div>

            {/* Alertes catalogue */}
            <div className="pr-card">
              <div style={{ fontSize:13, fontWeight:700, color:"#1F2A24", marginBottom:10 }}>Alertes catalogue</div>
              {[
                { icon:"🔴", label:"3 produits en rupture",             color:"#EF4444" },
                { icon:"🟠", label:"8 produits avec stock faible",      color:"#F08A24" },
                { icon:"🔄", label:"2 produits non synchronisés",       color:"#667085" },
                { icon:"🏷️", label:"5 produits sans catégorie",        color:"#98A2B3" },
              ].map(a => (
                <div key={a.label} className="pr-alert-row">
                  <span style={{ fontSize:16 }}>{a.icon}</span>
                  <span style={{ color: a.color, fontWeight:500, fontSize:12 }}>{a.label}</span>
                </div>
              ))}
            </div>

            {/* Répartition catalogue */}
            <div className="pr-card">
              <div style={{ fontSize:13, fontWeight:700, color:"#1F2A24", marginBottom:12 }}>Répartition du catalogue</div>
              <DonutChart />
            </div>

          </div>
        </div>

        {/* ── Bottom row ── */}
        <div className="pr-bottom">
          <div className="pr-card">
            <div style={{ fontSize:13, fontWeight:700, color:"#1F2A24", marginBottom:12 }}>Conseils catalogue</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {TIPS.map(t => (
                <div key={t.t} style={{ display:"flex", gap:10, padding:"8px 10px", background:"#F8FAF9",
                  borderRadius:10, alignItems:"flex-start" }}>
                  <span style={{ fontSize:18, flexShrink:0 }}>{t.icon}</span>
                  <div>
                    <div style={{ fontWeight:600, fontSize:13, color:"#1F2A24" }}>{t.t}</div>
                    <div style={{ fontSize:11, color:"#98A2B3", marginTop:2 }}>{t.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pr-card">
            <div style={{ fontSize:13, fontWeight:700, color:"#1F2A24", marginBottom:12 }}>Support & Ressources</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[
                { icon:"💬", label:"Contacter le support",  href:"mailto:support@bizmanager.app" },
                { icon:"📚", label:"Documentation",          href:"#docs" },
                { icon:"📥", label:"Aide import catalogue",  href:"#import" },
              ].map(r => (
                <a key={r.label} href={r.href}
                  style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px",
                    background:"#F8FAF9", borderRadius:10, textDecoration:"none",
                    color:"#1F2A24", fontSize:13, fontWeight:500, transition:"background .15s" }}
                  onMouseEnter={e => (e.currentTarget.style.background="#EAF7EF")}
                  onMouseLeave={e => (e.currentTarget.style.background="#F8FAF9")}>
                  <span style={{ fontSize:18 }}>{r.icon}</span>
                  {r.label}
                  <span style={{ marginLeft:"auto", color:"#98A2B3" }}>→</span>
                </a>
              ))}
            </div>
            <div style={{ marginTop:14, padding:"10px 12px", background:"#EAF7EF", borderRadius:10 }}>
              <div style={{ fontSize:12, fontWeight:600, color:"#0A8F45" }}>Plan Business actif</div>
              <div style={{ fontSize:11, color:"#08763A", marginTop:2 }}>
                500 produits · 3 boutiques · Sync illimitée
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

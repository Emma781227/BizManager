"use client";
import { useEffect, useState } from "react";

type RealShop = { id: string; name: string; slug: string; isPublished: boolean; city: string | null; };

const MOCK_SHOPS = [
  { id:"s1", name:"Mon Aventure",  slug:"mon-aventure",  isPublished:true,  city:"Dakar",   products:78,  orders:156, clients:1242, ca:"4 850 000", color:"#0A8F45" },
  { id:"s2", name:"Urban Style",   slug:"urban-style",   isPublished:true,  city:"Abidjan", products:62,  orders:128, clients:573,  ca:"3 210 000", color:"#3B82F6" },
  { id:"s3", name:"Beauty House",  slug:"beauty-house",  isPublished:false, city:"Douala",  products:16,  orders:58,  clients:42,   ca:"760 000",   color:"#F08A24" },
];

const ACTIVITY = [
  { label:"Chiffre d'affaires total", value:"5 820 000 FCFA", trend:"+18,6%", up:true },
  { label:"Commandes total",          value:"342",             trend:"+12,4%", up:true },
  { label:"Nouveaux clients",         value:"128",             trend:"+9,7%",  up:true },
  { label:"Produits ajoutés",         value:"24",              trend:"+14,2%", up:true },
];

const TIPS = [
  { icon:"📊", t:"Analysez chaque boutique",  d:"Suivez les performances individuelles pour mieux décider.",                   link:"Voir les performances", href:"/dashboard" },
  { icon:"📦", t:"Optimisez votre catalogue", d:"Maintenez vos produits à jour et adaptez vos stocks à la demande.",          link:"Gérer les produits",    href:"/products"  },
  { icon:"🚀", t:"Développez vos ventes",     d:"Utilisez WhatsApp et votre boutique en ligne pour booster vos ventes.",      link:"Découvrir les outils",  href:"/whatsapp"  },
];

const CSS = `
.mb-wrap { padding:24px 28px; max-width:1280px; margin:0 auto; background:#F8FAF9; min-height:100vh; }
.mb-ctx  { display:flex; align-items:center; gap:14px; flex-wrap:wrap; margin-bottom:16px; }
.mb-kpi  { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:20px; }
.mb-main { display:grid; grid-template-columns:1fr 420px; gap:20px; margin-bottom:20px; }
.mb-right { display:flex; flex-direction:column; gap:16px; }
.mb-card { background:#fff; border:1px solid #E8ECEA; border-radius:18px; padding:20px; box-shadow:0 2px 10px rgba(16,24,40,.04); }
.mb-shop-row { border:1px solid #E8ECEA; border-radius:14px; padding:16px 18px; margin-bottom:12px; transition:box-shadow .15s; background:#fff; position:relative; }
.mb-shop-row:last-child { margin-bottom:0; }
.mb-shop-row:hover { box-shadow:0 4px 16px rgba(16,24,40,.06); }
.mb-shop-row.is-active { border-color:#0A8F45; background:#FAFFFE; }
.mb-shop-top { display:flex; align-items:center; gap:12px; }
.mb-shop-av  { width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:14px; color:#fff; flex-shrink:0; }
.mb-shop-kpis { display:flex; gap:0; margin:12px 0 0; padding:10px 14px; background:#F8FAF9; border-radius:10px; }
.mb-shop-kpi-item { flex:1; text-align:center; }
.mb-create { border:2px dashed #C8E6D5; border-radius:14px; padding:20px; text-align:center; cursor:pointer; transition:background .15s; margin-top:12px; }
.mb-create:hover { background:#EAF7EF; }
.mb-prog { height:10px; border-radius:8px; background:#E8ECEA; overflow:hidden; margin:8px 0; }
.mb-prog-bar { height:100%; border-radius:8px; background:#0A8F45; }
.mb-act-row { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid #F4F6F5; }
.mb-act-row:last-child { border-bottom:none; }
.mb-tips { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
.mb-modal { position:fixed; inset:0; z-index:1000; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,.45); padding:20px; }
.mb-modal-box { background:#fff; border-radius:18px; padding:28px; width:100%; max-width:460px; box-shadow:0 20px 60px rgba(0,0,0,.15); }
.mb-actions-menu { position:absolute; right:0; top:36px; z-index:50; background:#fff; border:1px solid #E8ECEA; border-radius:12px; min-width:190px; box-shadow:0 8px 24px rgba(16,24,40,.1); overflow:hidden; }
.mb-actions-item { display:block; width:100%; text-align:left; padding:10px 16px; font-size:13px; color:#1F2A24; background:none; border:none; cursor:pointer; transition:background .12s; }
.mb-actions-item:hover { background:#F8FAF9; }
.mb-actions-item.danger { color:#EF4444; }
.badge { display:inline-flex; align-items:center; gap:4px; padding:3px 9px; border-radius:20px; font-size:11px; font-weight:600; white-space:nowrap; }
.badge-green { background:#DDF6E7; color:#0A8F45; }
.badge-gray  { background:#F2F4F7; color:#667085; }
.badge-biz   { background:#EAF7EF; color:#08763A; }
.inp { height:36px; padding:0 12px; border:1px solid #E8ECEA; border-radius:10px; font-size:13px; color:#1F2A24; background:#fff; outline:none; width:100%; box-sizing:border-box; }
.inp:focus { border-color:#0A8F45; }
.sel { height:36px; padding:0 10px; border:1px solid #E8ECEA; border-radius:10px; font-size:13px; color:#1F2A24; background:#fff; cursor:pointer; outline:none; }
.btn-primary   { height:36px; padding:0 16px; background:#0A8F45; color:#fff; border:none; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; white-space:nowrap; }
.btn-primary:hover { background:#08763A; }
.btn-secondary { height:36px; padding:0 14px; background:#fff; color:#1F2A24; border:1px solid #E8ECEA; border-radius:10px; font-size:13px; cursor:pointer; white-space:nowrap; }
.btn-secondary:hover { background:#F8FAF9; }
.btn-sm { height:30px; padding:0 12px; border-radius:8px; font-size:12px; cursor:pointer; }
@media(max-width:1100px){ .mb-kpi{grid-template-columns:repeat(2,1fr);} .mb-main{grid-template-columns:1fr;} .mb-tips{grid-template-columns:1fr 1fr;} }
@media(max-width:700px){ .mb-kpi{grid-template-columns:1fr 1fr;} .mb-tips{grid-template-columns:1fr;} .mb-wrap{padding:14px 12px;} .mb-ctx{flex-direction:column;align-items:flex-start;} }
`;

function CreateShopModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 900));
    setSaving(false);
    onClose();
  }

  return (
    <div className="mb-modal" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="mb-modal-box">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <h2 style={{ fontSize:18, fontWeight:700, color:"#1F2A24", margin:0 }}>Créer une nouvelle boutique</h2>
          <button onClick={onClose} style={{ border:"none", background:"none", cursor:"pointer", fontSize:22, color:"#98A2B3", lineHeight:1 }}>×</button>
        </div>
        <p style={{ fontSize:13, color:"#667085", marginBottom:18 }}>
          Chaque boutique possède son propre catalogue, ses commandes et ses clients indépendants.
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:"#1F2A24", display:"block", marginBottom:6 }}>Nom de la boutique *</label>
            <input className="inp" placeholder="Ex : Ma Boutique Mode" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:"#1F2A24", display:"block", marginBottom:6 }}>Ville</label>
            <input className="inp" placeholder="Dakar, Abidjan, Douala…" value={city} onChange={e => setCity(e.target.value)} />
          </div>
          <div style={{ padding:"12px 14px", background:"#EAF7EF", borderRadius:10, fontSize:12, color:"#08763A", fontWeight:500 }}>
            Plan Business · 1 boutique restante sur 3 autorisées
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button className="btn-secondary" style={{ flex:1 }} onClick={onClose}>Annuler</button>
            <button className="btn-primary" style={{ flex:1 }} onClick={handleCreate} disabled={saving || !name.trim()}>
              {saving ? "Création…" : "Créer la boutique"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShopsPage() {
  const [activeId, setActiveId]       = useState("s1");
  const [period, setPeriod]           = useState("30d");
  const [createOpen, setCreateOpen]   = useState(false);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_realShop, setRealShop]      = useState<RealShop | null>(null);

  useEffect(() => {
    fetch("/api/shop").then(r => r.json()).then(d => {
      const sh = Array.isArray(d) ? d[0] : (d.data ?? d);
      if (sh?.id) setRealShop(sh);
    }).catch(() => {});

    function closeMenus() { setActionMenuId(null); }
    document.addEventListener("click", closeMenus);
    return () => document.removeEventListener("click", closeMenus);
  }, []);

  return (
    <>
      <style>{CSS}</style>
      {createOpen && <CreateShopModal onClose={() => setCreateOpen(false)} />}

      <div className="mb-wrap">

        {/* Context bar */}
        <div className="mb-ctx">
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:12, color:"#667085", fontWeight:500 }}>Boutique active</span>
            <select className="sel" style={{ fontWeight:700, color:"#0A8F45", borderColor:"#0A8F45", minWidth:160 }}
              value={activeId} onChange={e => setActiveId(e.target.value)}>
              {MOCK_SHOPS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span className="badge badge-biz" style={{ padding:"5px 12px", fontSize:12 }}>Plan Business</span>
            <span style={{ fontSize:12, color:"#667085", fontWeight:500 }}>2 / 3 boutiques utilisées</span>
          </div>
          <button className="btn-primary" style={{ marginLeft:"auto" }} onClick={() => setCreateOpen(true)}>
            + Créer une boutique
          </button>
        </div>

        {/* Title */}
        <div style={{ marginBottom:18 }}>
          <h1 style={{ fontSize:22, fontWeight:700, color:"#1F2A24", margin:"0 0 4px" }}>Mes boutiques</h1>
          <p style={{ margin:0, color:"#667085", fontSize:14 }}>Gérez toutes vos boutiques depuis un seul endroit.</p>
        </div>

        {/* KPI row */}
        <div className="mb-kpi">
          {[
            { icon:"🏪", l:"Total boutiques",  v:"2 / 3", s:"Utilisées",               i:"Limite selon votre plan Business" },
            { icon:"📦", l:"Total produits",   v:"156",    s:"Sur toutes vos boutiques", i:"+12 ce mois" },
            { icon:"🛒", l:"Total commandes",  v:"342",    s:"Sur toutes vos boutiques", i:"+28 ce mois" },
            { icon:"👥", l:"Total clients",    v:"1 857",  s:"Sur toutes vos boutiques", i:"+128 ce mois" },
          ].map(k => (
            <div key={k.l} style={{ background:"#fff", border:"1px solid #E8ECEA", borderRadius:16,
              padding:"16px 18px", boxShadow:"0 2px 10px rgba(16,24,40,.04)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                <span style={{ fontSize:13, color:"#667085", fontWeight:500 }}>{k.l}</span>
                <span style={{ fontSize:20 }}>{k.icon}</span>
              </div>
              <div style={{ fontSize:26, fontWeight:800, color:"#1F2A24", letterSpacing:"-0.5px" }}>{k.v}</div>
              <div style={{ fontSize:11, color:"#0A8F45", fontWeight:500, marginTop:3 }}>{k.s}</div>
              <div style={{ fontSize:10, color:"#98A2B3", marginTop:4 }}>{k.i}</div>
            </div>
          ))}
        </div>

        {/* Main 2-col */}
        <div className="mb-main">

          {/* Left: boutiques list */}
          <div className="mb-card">
            <div style={{ fontWeight:700, color:"#1F2A24", fontSize:15, marginBottom:16 }}>Toutes mes boutiques</div>

            {MOCK_SHOPS.map((shop, i) => (
              <div key={shop.id} className={`mb-shop-row${shop.id === activeId ? " is-active" : ""}`}>
                <div className="mb-shop-top">
                  <div className="mb-shop-av" style={{ background: shop.color }}>
                    {shop.name.slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
                      <span style={{ fontWeight:700, fontSize:14, color:"#1F2A24" }}>{shop.name}</span>
                      {shop.id === activeId && <span className="badge badge-green" style={{ fontSize:10 }}>Boutique active</span>}
                      <span className={shop.isPublished ? "badge badge-green" : "badge badge-gray"} style={{ fontSize:10 }}>
                        {shop.isPublished ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div style={{ fontSize:11, color:"#98A2B3", marginTop:2 }}>
                      {shop.slug}.bizmanager.shop · {shop.city}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
                    <button className="btn-primary btn-sm"
                      style={{ background: shop.id === activeId ? "#08763A" : "#0A8F45" }}
                      onClick={() => setActiveId(shop.id)}>
                      Gérer
                    </button>
                    <div style={{ position:"relative" }}>
                      <button className="btn-secondary btn-sm"
                        onClick={e => { e.stopPropagation(); setActionMenuId(actionMenuId === shop.id ? null : shop.id); }}>
                        ···
                      </button>
                      {actionMenuId === shop.id && (
                        <div className="mb-actions-menu" onClick={e => e.stopPropagation()}>
                          <button className="mb-actions-item">✏️&nbsp; Renommer</button>
                          <button className="mb-actions-item">🔗&nbsp; Voir la boutique publique</button>
                          <button className="mb-actions-item">📋&nbsp; Dupliquer les réglages</button>
                          <button className="mb-actions-item">{shop.isPublished ? "⏸ Suspendre" : "▶ Activer"}</button>
                          <button className="mb-actions-item">📁&nbsp; Archiver</button>
                          <button className="mb-actions-item danger">🗑️&nbsp; Supprimer</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-shop-kpis">
                  {[
                    { l:"Produits",   v: String(shop.products) },
                    { l:"Commandes",  v: String(shop.orders)   },
                    { l:"Clients",    v: String(shop.clients)  },
                    { l:"CA (FCFA)",  v: shop.ca               },
                  ].map((k, ki) => (
                    <div key={k.l} className="mb-shop-kpi-item"
                      style={{ borderLeft: ki > 0 ? "1px solid #E8ECEA" : "none" }}>
                      <div style={{ fontSize:16, fontWeight:700, color:"#1F2A24" }}>{k.v}</div>
                      <div style={{ fontSize:11, color:"#98A2B3" }}>{k.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Create new shop CTA */}
            <div className="mb-create" onClick={() => setCreateOpen(true)}>
              <div style={{ width:40, height:40, borderRadius:12, background:"#EAF7EF",
                display:"flex", alignItems:"center", justifyContent:"center",
                margin:"0 auto 10px", fontSize:22, color:"#0A8F45" }}>+</div>
              <div style={{ fontWeight:700, color:"#1F2A24", fontSize:14, marginBottom:4 }}>Créer une nouvelle boutique</div>
              <div style={{ fontSize:12, color:"#98A2B3" }}>Ajoutez une nouvelle boutique et développez votre activité.</div>
            </div>
          </div>

          {/* Right col */}
          <div className="mb-right">

            {/* Plan usage */}
            <div className="mb-card">
              <div style={{ fontWeight:700, color:"#1F2A24", fontSize:15, marginBottom:14 }}>Utilisation de votre plan</div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                <span className="badge badge-biz" style={{ padding:"5px 14px", fontSize:12 }}>Plan Business</span>
                <span style={{ fontSize:12, color:"#667085" }}>Jusqu'à 3 boutiques</span>
              </div>
              <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:2 }}>
                <span style={{ fontSize:38, fontWeight:800, color:"#1F2A24", letterSpacing:"-1px" }}>2</span>
                <span style={{ fontSize:22, color:"#98A2B3" }}>/ 3</span>
                <span style={{ fontSize:13, color:"#667085", marginLeft:8 }}>boutiques utilisées</span>
              </div>
              <div className="mb-prog"><div className="mb-prog-bar" style={{ width:"66%" }} /></div>
              <div style={{ fontSize:11, color:"#98A2B3", marginBottom:16 }}>66% du quota utilisé · 1 boutique restante</div>
              <div style={{ background:"#EAF7EF", border:"1px solid #C8E6D5", borderRadius:12, padding:"14px 16px" }}>
                <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                  <span style={{ fontSize:20 }}>👑</span>
                  <div>
                    <div style={{ fontWeight:700, color:"#1F2A24", fontSize:13, marginBottom:4 }}>Passez au plan Premium</div>
                    <div style={{ fontSize:12, color:"#667085", marginBottom:10 }}>
                      Gérez jusqu'à 10 boutiques et débloquez plus de fonctionnalités avancées.
                    </div>
                    <a href="/payments" style={{ fontSize:12, fontWeight:600, color:"#0A8F45", textDecoration:"none" }}>
                      Découvrir les offres →
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Global activity */}
            <div className="mb-card">
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                <div style={{ fontWeight:700, color:"#1F2A24", fontSize:14 }}>Activité globale (toutes boutiques)</div>
                <select className="sel" value={period} onChange={e => setPeriod(e.target.value)}
                  style={{ fontSize:11, height:28, padding:"0 8px" }}>
                  <option value="7d">7 derniers jours</option>
                  <option value="30d">30 derniers jours</option>
                  <option value="90d">90 derniers jours</option>
                </select>
              </div>
              {ACTIVITY.map(a => (
                <div key={a.label} className="mb-act-row">
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, color:"#98A2B3" }}>{a.label}</div>
                    <div style={{ fontWeight:700, color:"#1F2A24", fontSize:14 }}>{a.value}</div>
                  </div>
                  <span style={{ fontSize:11, fontWeight:600, color:"#0A8F45",
                    background:"#DDF6E7", padding:"3px 8px", borderRadius:20 }}>{a.trend}</span>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Bottom tips */}
        <div className="mb-card">
          <div style={{ fontWeight:700, color:"#1F2A24", fontSize:15, marginBottom:16 }}>Conseils pour gérer vos boutiques</div>
          <div className="mb-tips">
            {TIPS.map(t => (
              <div key={t.t} style={{ background:"#F8FAF9", borderRadius:12, padding:"16px 18px", border:"1px solid #F0F2F1" }}>
                <div style={{ fontSize:24, marginBottom:8 }}>{t.icon}</div>
                <div style={{ fontWeight:700, color:"#1F2A24", fontSize:13, marginBottom:6 }}>{t.t}</div>
                <div style={{ fontSize:12, color:"#667085", marginBottom:12, lineHeight:"1.6" }}>{t.d}</div>
                <a href={t.href} style={{ fontSize:12, fontWeight:600, color:"#0A8F45", textDecoration:"none" }}>
                  {t.link} →
                </a>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}

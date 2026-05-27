"use client";
import { useEffect, useState } from "react";
import { useActiveShop } from "@/hooks/useActiveShop";
import CreateShopModal from "./CreateShopModal";
import { Store, Star, Globe, Package, ShoppingCart, Users, Tag, Check } from "lucide-react";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────
type ApiShop = {
  id: string; name: string; slug: string; status: string;
  category: string | null; city: string | null; isPublished: boolean;
  coverUrl: string | null; logoUrl: string | null;
  createdAt: string;
  _count: { products: number; orders: number; customers: number };
};

type QuotaInfo = {
  plan: { displayName: string; maxShops: number; maxProducts: number; priceMonthly: number };
  usage: { shops: number; products: number };
  nextPlan: { displayName: string; priceMonthly: number } | null;
};

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
.bs-wrap   { padding:24px 28px; max-width:1280px; margin:0 auto; background:#F8FAF9; min-height:100vh; }
.bs-grid   { display:grid; grid-template-columns:repeat(auto-fill,minmax(290px,1fr)); gap:16px; margin-top:20px; }
.bs-card   { background:#fff; border:1px solid #E8ECEA; border-radius:18px; overflow:hidden; box-shadow:0 2px 10px rgba(16,24,40,.04); transition:box-shadow .15s,transform .15s; cursor:pointer; outline:none; }
.bs-card:hover { box-shadow:0 6px 22px rgba(16,24,40,.10); transform:translateY(-2px); }
.bs-cover  { width:100%; height:100px; background:#EAF7EF; object-fit:cover; }
.bs-cover-placeholder { width:100%; height:100px; background:linear-gradient(135deg,#EAF7EF 0%,#D0F0E0 100%); display:flex; align-items:center; justify-content:center; font-size:36px; }
.bs-card-body { padding:14px 16px 16px; }
.bs-logo   { width:44px; height:44px; border-radius:12px; background:#fff; border:2px solid #E8ECEA; overflow:hidden; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }
.bs-kpi-row { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:20px; }
.bs-kpi    { background:#fff; border:1px solid #E8ECEA; border-radius:14px; padding:14px 16px; box-shadow:0 2px 8px rgba(16,24,40,.04); }
@media(max-width:700px){
  .bs-wrap { padding:14px 12px; }
  .bs-kpi-row { grid-template-columns:1fr 1fr; }
}
`;

// ─── Component ────────────────────────────────────────────────────────────────
export default function ShopsPage() {
  const [shops, setShops]           = useState<ApiShop[]>([]);
  const [quota, setQuota]           = useState<QuotaInfo | null>(null);
  const [loading, setLoading]       = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [activeShopId, setActiveShopId] = useActiveShop("");

  useEffect(() => {
    Promise.all([
      fetch("/api/shop?all=1").then(r => r.json()),
      fetch("/api/subscription").then(r => r.json()),
    ]).then(([shopData, subData]) => {
      if (Array.isArray(shopData.data)) setShops(shopData.data);
      else if (Array.isArray(shopData)) setShops(shopData);
      if (subData.plan) setQuota(subData);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function refresh() {
    setLoading(true);
    Promise.all([
      fetch("/api/shop?all=1").then(r => r.json()),
      fetch("/api/subscription").then(r => r.json()),
    ]).then(([shopData, subData]) => {
      if (Array.isArray(shopData.data)) setShops(shopData.data);
      else if (Array.isArray(shopData)) setShops(shopData);
      if (subData.plan) setQuota(subData);
    }).catch(() => {}).finally(() => setLoading(false));
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="bs-wrap">

        {/* Header */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:20}}>
          <div>
            <h1 style={{fontSize:22,fontWeight:800,color:"#1F2A24",margin:0}}>Mes boutiques</h1>
            <p style={{margin:"4px 0 0",color:"#667085",fontSize:14}}>
              Gérez vos boutiques, leurs catalogues et leurs informations.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            disabled={quota !== null && quota.usage.shops >= quota.plan.maxShops}
            style={{height:40,padding:"0 20px",background:"#0A8F45",color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",opacity: quota !== null && quota.usage.shops >= quota.plan.maxShops ? 0.5 : 1}}>
            + Créer une boutique
          </button>
        </div>

        {/* KPI row */}
        <div className="bs-kpi-row">
          {[
            { label:"Boutiques", val:shops.length, icon:<Store size={16} color="#0A8F45" />, note: quota ? `${quota.usage.shops} / ${quota.plan.maxShops} max` : "" },
            { label:"Plan actif", val: quota?.plan.displayName ?? "—", icon:<Star size={16} color="#F08A24" />, note: quota ? `${quota.plan.priceMonthly > 0 ? quota.plan.priceMonthly.toLocaleString("fr-FR")+" FCFA/mois" : "Gratuit"}` : "" },
            { label:"Boutiques publiées", val: shops.filter(s=>s.isPublished).length, icon:<Globe size={16} color="#3B82F6" />, note:"accessibles au public" },
          ].map(k => (
            <div key={k.label} className="bs-kpi">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <span style={{fontSize:12,color:"#667085",fontWeight:500}}>{k.label}</span>
                <span>{k.icon}</span>
              </div>
              <div style={{fontSize:22,fontWeight:800,color:"#1F2A24"}}>{k.val}</div>
              <div style={{fontSize:11,color:"#98A2B3",marginTop:4}}>{k.note}</div>
            </div>
          ))}
        </div>

        {/* Loading state */}
        {loading && (
          <div style={{textAlign:"center",padding:40,color:"#98A2B3",fontSize:14}}>Chargement des boutiques…</div>
        )}

        {/* Empty state */}
        {!loading && shops.length === 0 && (
          <div style={{textAlign:"center",padding:"40px 20px",background:"#fff",borderRadius:18,border:"1px solid #E8ECEA"}}>
            <div style={{color:"#0A8F45",marginBottom:12}}><Store size={48} /></div>
            <div style={{fontSize:16,fontWeight:700,color:"#1F2A24",marginBottom:8}}>Aucune boutique pour l&apos;instant</div>
            <p style={{fontSize:14,color:"#667085",marginBottom:20}}>Créez votre première boutique pour commencer à vendre.</p>
            <button onClick={() => setShowCreate(true)}
              style={{height:44,padding:"0 28px",background:"#0A8F45",color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer"}}>
              + Créer ma première boutique
            </button>
          </div>
        )}

        {/* Shop grid */}
        {!loading && shops.length > 0 && (
          <div className="bs-grid">
            {shops.map(shop => (
              <div
                key={shop.id}
                className="bs-card"
                onClick={() => setActiveShopId(shop.id)}
                style={{
                  ...(activeShopId === shop.id ? {border:"2px solid #0A8F45"} : {}),
                }}>
                {shop.coverUrl ? (
                  <div style={{ position: "relative", height: 100, overflow: "hidden", background: "#EAF7EF" }}>
                    <Image src={shop.coverUrl} alt={shop.name} fill style={{ objectFit: "cover" }} sizes="(max-width: 700px) 100vw, 340px" />
                  </div>
                ) : (
                  <div className="bs-cover-placeholder" style={{display:"flex",alignItems:"center",justifyContent:"center",color:"#98A2B3"}}><Store size={32} /></div>
                )}
                <div className="bs-card-body">
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <div className="bs-logo">
                      {shop.logoUrl ? <Image src={shop.logoUrl} alt={`Logo ${shop.name}`} width={44} height={44} style={{ objectFit: "cover", width: "100%", height: "100%" }} /> : <Tag size={20} color="#98A2B3" />}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:14,color:"#1F2A24",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{shop.name}</div>
                      <div style={{fontSize:11,color:"#98A2B3"}}>{shop.city ?? "—"} · {shop.category ?? "—"}</div>
                    </div>
                    <span style={{fontSize:10,padding:"3px 8px",borderRadius:20,fontWeight:600,whiteSpace:"nowrap",
                      background:shop.isPublished ? "#DDF6E7" : "#F2F4F7",
                      color:shop.isPublished ? "#0A8F45" : "#667085"}}>
                      {shop.isPublished ? "Publiée" : "Brouillon"}
                    </span>
                  </div>

                  <div style={{display:"flex",gap:8,fontSize:12,color:"#667085",borderTop:"1px solid #F4F6F5",paddingTop:10,marginBottom:10}}>
                    <span style={{display:"flex",alignItems:"center",gap:4}}><Package size={12} /> {shop._count.products} produits</span>
                    <span>·</span>
                    <span style={{display:"flex",alignItems:"center",gap:4}}><ShoppingCart size={12} /> {shop._count.orders} commandes</span>
                    <span>·</span>
                    <span style={{display:"flex",alignItems:"center",gap:4}}><Users size={12} /> {shop._count.customers} clients</span>
                  </div>

                  {/* Footer row */}
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                    <span style={{fontSize:10,color:"#98A2B3",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>
                      {shop.slug}.bizmanager.shop
                    </span>
                    <div style={{display:"flex",gap:6,flexShrink:0}}>
                      <a
                        href="/settings"
                        onClick={e => { e.stopPropagation(); setActiveShopId(shop.id); }}
                        style={{fontSize:11,fontWeight:600,color:"#667085",background:"#F2F4F7",borderRadius:6,padding:"4px 10px",textDecoration:"none"}}>
                        Gérer
                      </a>
                      <a
                        href={`/shop/${shop.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        title={!shop.isPublished ? "Boutique non publiée — aperçu uniquement" : undefined}
                        style={{fontSize:11,fontWeight:600,
                          color: shop.isPublished ? "#0A8F45" : "#98A2B3",
                          background: shop.isPublished ? "#EAF7EF" : "#F2F4F7",
                          borderRadius:6,padding:"4px 10px",textDecoration:"none"}}>
                        {shop.isPublished ? "Voir la boutique ↗" : "Aperçu ↗"}
                      </a>
                    </div>
                  </div>

                  {activeShopId === shop.id && (
                    <div style={{marginTop:8,fontSize:11,fontWeight:700,color:"#0A8F45",textAlign:"center",background:"#EAF7EF",borderRadius:6,padding:"4px 0"}}>
                      <Check size={12} style={{marginRight:4}} /> Boutique active dans le dashboard
                    </div>
                  )}
                  {!shop.isPublished && (
                    <div style={{marginTop:6,fontSize:10,color:"#F08A24",textAlign:"center",background:"#FFF8EC",borderRadius:6,padding:"3px 0"}}>
                      Brouillon — non visible par vos clients
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      <CreateShopModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(shop) => {
          setShowCreate(false);
          setActiveShopId(shop.id);
          refresh();
        }}
      />
    </>
  );
}

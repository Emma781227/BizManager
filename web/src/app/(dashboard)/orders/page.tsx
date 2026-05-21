"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Globe, PenLine, ShoppingCart, Clock, CheckCircle, TrendingUp, Bell, RefreshCw, X, Check, Store, Download } from "lucide-react";
import { useActiveShop } from "@/hooks/useActiveShop";

// ─── Types ────────────────────────────────────────────────────────────────────
type ApiOrderStatus = "pending"|"new"|"confirmed"|"in_progress"|"ready"|"delivered"|"cancelled";
type ApiPaymentStatus = "unpaid"|"partial"|"paid"|"refunded";
type ApiPaymentMethod = "cash"|"mobile_money"|"bank_transfer"|"cod";
type ApiChannel = "whatsapp"|"online"|"manual";

type ApiShop = {
  id: string; name: string; slug: string; isPublished: boolean;
  _count: { orders: number; products: number; customers: number };
};

type ApiOrder = {
  id: string;
  channel: ApiChannel;
  status: ApiOrderStatus;
  paymentStatus: ApiPaymentStatus;
  paymentMethod: ApiPaymentMethod | null;
  totalAmount: string;
  createdAt: string;
  customer: { id: string; fullName: string; phone: string };
  items: { id: string; quantity: number; unitPrice: string; lineTotal: string; product: { id: string; name: string } }[];
};

type Order = {
  id: string; ref: string; client: string; phone: string;
  channel: ApiChannel; amount: number;
  paymentStatus: ApiPaymentStatus; paymentMethod: ApiPaymentMethod | null;
  status: ApiOrderStatus; date: string;
  items: { name: string; qty: number; price: number }[];
};

type ShopProduct = { id: string; name: string; unitPrice: number; stock: number };

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_LABELS: Record<ApiOrderStatus, string> = {
  pending:"En attente", new:"Nouvelle", confirmed:"Confirmée",
  in_progress:"En traitement", ready:"Prête", delivered:"Livrée", cancelled:"Annulée",
};
const STATUS_BADGE: Record<ApiOrderStatus, string> = {
  pending:"badge-gray", new:"badge-orange", confirmed:"badge-blue",
  in_progress:"badge-blue", ready:"badge-biz", delivered:"badge-green", cancelled:"badge-red",
};
const PAY_LABELS: Record<ApiPaymentStatus, string> = {
  unpaid:"Non payée", partial:"Partielle", paid:"Payée", refunded:"Remboursée",
};
const PAY_BADGE: Record<ApiPaymentStatus, string> = {
  unpaid:"badge-red", partial:"badge-orange", paid:"badge-green", refunded:"badge-gray",
};
const CHANNEL_LABELS: Record<ApiChannel, string> = { whatsapp:"WhatsApp", online:"En ligne", manual:"Manuel" };
const CHANNEL_ICONS: Record<ApiChannel, React.ReactNode> = {
  whatsapp: <MessageCircle size={16} color="#25D366" />,
  online:   <Globe size={16} color="#3B82F6" />,
  manual:   <PenLine size={16} color="#667085" />,
};
const PAY_METHOD_LABELS: Record<ApiPaymentMethod, string> = {
  cash:"Espèces", mobile_money:"Mobile Money", bank_transfer:"Virement", cod:"Contre remboursement",
};
const NEXT_STATUS: Partial<Record<ApiOrderStatus, ApiOrderStatus>> = {
  pending:"new", new:"confirmed", confirmed:"in_progress", in_progress:"ready", ready:"delivered",
};
const NEXT_STATUS_LABEL: Partial<Record<ApiOrderStatus, string>> = {
  pending:"Activer", new:"Confirmer", confirmed:"Traiter", in_progress:"Prête", ready:"Livrer",
};
const SHOP_COLORS = ["#0A8F45","#3B82F6","#F08A24","#8B5CF6","#EC4899"];

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
.or-wrap { padding:24px 28px; max-width:1280px; margin:0 auto; background:#F8FAF9; min-height:100vh; }
.or-ctx  { display:flex; align-items:center; gap:14px; flex-wrap:wrap; margin-bottom:16px; }
.or-ctx-r { margin-left:auto; display:flex; gap:8px; }
.or-kpi  { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:16px; }
.or-main { display:grid; grid-template-columns:1fr 360px; gap:18px; margin-bottom:18px; }
.or-right { display:flex; flex-direction:column; gap:14px; }
.or-card { background:#fff; border:1px solid #E8ECEA; border-radius:18px;
           padding:18px 20px; box-shadow:0 2px 10px rgba(16,24,40,.04); }
.or-tcard { background:#fff; border:1px solid #E8ECEA; border-radius:18px;
            box-shadow:0 2px 10px rgba(16,24,40,.04); overflow:hidden; }
.or-tbar  { display:flex; align-items:center; gap:10px; padding:16px 18px;
            border-bottom:1px solid #E8ECEA; flex-wrap:wrap; }
.or-tacts { display:flex; gap:8px; margin-left:auto; }
.or-ftrow { display:flex; gap:8px; padding:11px 18px; border-bottom:1px solid #E8ECEA; flex-wrap:wrap; }
.or-table { width:100%; border-collapse:collapse; font-size:13px; }
.or-table th { padding:9px 11px; text-align:left; color:#667085; font-weight:500;
               border-bottom:1px solid #E8ECEA; background:#FAFBFA; white-space:nowrap; }
.or-table td { padding:10px 11px; border-bottom:1px solid #F4F6F5; color:#1F2A24; vertical-align:middle; }
.or-table tr:hover td { background:#FAFBFA; }
.or-table tr:last-child td { border-bottom:none; }
.or-act-btns { display:flex; gap:3px; align-items:center; }
.or-act-btn  { border:none; background:none; cursor:pointer; padding:4px 6px;
               border-radius:6px; font-size:13px; color:#667085; transition:background .15s; }
.or-act-btn:hover { background:#F4F6F5; }
.or-shop-row { display:flex; align-items:center; gap:10px; padding:8px 10px; border-bottom:1px solid #F4F6F5; }
.or-shop-row:last-child { border-bottom:none; }
.or-shop-av  { width:34px; height:34px; border-radius:10px; display:flex; align-items:center;
               justify-content:center; font-weight:700; font-size:12px; color:#fff; flex-shrink:0; }
.or-alert-row { display:flex; align-items:center; gap:10px; padding:7px 0;
                border-bottom:1px solid #F4F6F5; font-size:12px; }
.or-alert-row:last-child { border-bottom:none; }
.or-donut-wrap { display:flex; align-items:center; gap:14px; }
.or-donut-legend { flex:1; display:flex; flex-direction:column; gap:5px; }
.or-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.or-bottom { display:grid; grid-template-columns:1fr 320px; gap:16px; }
.or-tips  { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.or-modal { position:fixed; inset:0; z-index:1000; display:flex; align-items:center;
            justify-content:center; background:rgba(0,0,0,.45); padding:20px; }
.or-modal-box { background:#fff; border-radius:18px; padding:26px; width:100%; max-width:520px;
                box-shadow:0 20px 60px rgba(0,0,0,.15); max-height:90vh; overflow-y:auto; }
.badge { display:inline-flex; align-items:center; gap:4px; padding:3px 9px;
         border-radius:20px; font-size:11px; font-weight:600; white-space:nowrap; }
.badge-green  { background:#DDF6E7; color:#0A8F45; }
.badge-orange { background:#FFF1E5; color:#F08A24; }
.badge-blue   { background:#E8F0FF; color:#3B82F6; }
.badge-red    { background:#FDE8E8; color:#EF4444; }
.badge-gray   { background:#F2F4F7; color:#667085; }
.badge-biz    { background:#EAF7EF; color:#08763A; }
.inp { height:36px; padding:0 11px; border:1px solid #E8ECEA; border-radius:10px;
       font-size:13px; color:#1F2A24; background:#fff; outline:none; }
.inp:focus { border-color:#0A8F45; }
.sel { height:36px; padding:0 9px; border:1px solid #E8ECEA; border-radius:10px;
       font-size:12px; color:#1F2A24; background:#fff; cursor:pointer; outline:none; }
.btn-primary   { height:34px; padding:0 14px; background:#0A8F45; color:#fff; border:none;
                 border-radius:10px; font-size:12px; font-weight:600; cursor:pointer; white-space:nowrap; }
.btn-primary:hover { background:#08763A; }
.btn-primary:disabled { opacity:.5; cursor:not-allowed; }
.btn-secondary { height:34px; padding:0 12px; background:#fff; color:#1F2A24;
                 border:1px solid #E8ECEA; border-radius:10px; font-size:12px; cursor:pointer; white-space:nowrap; }
.btn-secondary:hover { background:#F8FAF9; }
.pag { display:flex; align-items:center; justify-content:space-between;
       padding:11px 18px; border-top:1px solid #E8ECEA; flex-wrap:wrap; gap:8px; }
.pag-info { font-size:12px; color:#98A2B3; }
.pag-btns { display:flex; align-items:center; gap:4px; }
.pag-btn  { min-width:32px; height:28px; padding:0 8px; border:1px solid #E8ECEA; border-radius:8px;
            background:#fff; color:#1F2A24; font-size:12px; cursor:pointer; font-weight:500; }
.pag-btn:hover:not(:disabled) { background:#F8FAF9; border-color:#0A8F45; color:#0A8F45; }
.pag-btn:disabled { opacity:.4; cursor:default; }
.pag-btn.active { background:#0A8F45; color:#fff; border-color:#0A8F45; font-weight:700; }
@media(max-width:1100px){ .or-kpi{grid-template-columns:repeat(2,1fr);} .or-main{grid-template-columns:1fr;} }
@media(max-width:700px){ .or-kpi{grid-template-columns:1fr 1fr;} .or-wrap{padding:14px 12px;}
  .or-ctx{flex-direction:column;align-items:flex-start;} .or-ctx-r{margin-left:0;}
  .or-bottom{grid-template-columns:1fr;} .or-tips{grid-template-columns:1fr;} }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function apiToDisplay(o: ApiOrder): Order {
  return {
    id: o.id,
    ref: "#" + o.id.slice(-6).toUpperCase(),
    client: o.customer?.fullName ?? "—",
    phone: o.customer?.phone ?? "",
    channel: o.channel,
    amount: parseFloat(String(o.totalAmount ?? 0)),
    paymentStatus: o.paymentStatus ?? "unpaid",
    paymentMethod: o.paymentMethod ?? null,
    status: o.status,
    date: o.createdAt ? o.createdAt.slice(0, 10) : "",
    items: (o.items ?? []).map(i => ({
      name: i.product?.name ?? "—",
      qty: i.quantity,
      price: parseFloat(String(i.lineTotal ?? 0)),
    })),
  };
}

// ─── Badges ───────────────────────────────────────────────────────────────────
function StatusBadge({ s }: { s: ApiOrderStatus }) {
  return <span className={`badge ${STATUS_BADGE[s]}`}>{STATUS_LABELS[s]}</span>;
}
function PayBadge({ p }: { p: ApiPaymentStatus }) {
  return <span className={`badge ${PAY_BADGE[p]}`}>{PAY_LABELS[p]}</span>;
}
function ChannelBadge({ c }: { c: ApiChannel }) {
  return (
    <span style={{ fontSize:12, color:"#667085", display:"flex", alignItems:"center", gap:4 }}>
      {CHANNEL_ICONS[c]} {CHANNEL_LABELS[c]}
    </span>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────
function DonutChart({ orders }: { orders: Order[] }) {
  const total = orders.length || 1;
  const counts = { whatsapp: 0, online: 0, manual: 0 };
  orders.forEach(o => counts[o.channel]++);
  const data = [
    { label:"WhatsApp", pct: Math.round(counts.whatsapp / total * 100), color:"#0A8F45" },
    { label:"En ligne",  pct: Math.round(counts.online  / total * 100), color:"#3B82F6" },
    { label:"Manuel",   pct: Math.round(counts.manual  / total * 100), color:"#98A2B3" },
  ];
  const r = 38; const cx = 46; const cy = 46; const circ = 2 * Math.PI * r;
  let off = 0;
  const slices = data.map(d => {
    const dash = (d.pct / 100) * circ;
    const s = { dash, gap: circ - dash, offset: off };
    off += dash;
    return s;
  });
  return (
    <div className="or-donut-wrap">
      <svg width="92" height="92" viewBox="0 0 92 92" style={{ flexShrink:0 }}>
        {orders.length === 0 ? (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E8ECEA" strokeWidth="12" />
        ) : data.map((d, i) => (
          <circle key={d.label} cx={cx} cy={cy} r={r} fill="none" stroke={d.color} strokeWidth="12"
            strokeDasharray={`${slices[i].dash} ${slices[i].gap}`}
            strokeDashoffset={-slices[i].offset}
            style={{ transform:"rotate(-90deg)", transformOrigin:"46px 46px" }} />
        ))}
        <text x="46" y="43" textAnchor="middle" fontSize="12" fill="#1F2A24" fontWeight="700">{orders.length}</text>
        <text x="46" y="56" textAnchor="middle" fontSize="9" fill="#98A2B3">cmd</text>
      </svg>
      <div className="or-donut-legend">
        {data.map(d => (
          <div key={d.label} style={{ display:"flex", alignItems:"center", gap:7, fontSize:12, color:"#1F2A24" }}>
            <span className="or-dot" style={{ background:d.color }} />
            <span style={{ flex:1 }}>{d.label}</span>
            <strong>{d.pct}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── New Order Modal ──────────────────────────────────────────────────────────
function NewOrderModal({
  shopId, shopName, onClose, onCreated,
}: {
  shopId: string; shopName: string; onClose: () => void; onCreated: () => void;
}) {
  const [phone, setPhone]               = useState("");
  const [customerName, setCustomerName] = useState("");
  const [foundCustId, setFoundCustId]   = useState<string | null>(null);
  const [lookupState, setLookupState]   = useState<"idle"|"searching"|"found"|"new">("idle");

  const [shopProducts, setShopProducts]     = useState<ShopProduct[]>([]);
  const [selectedProd, setSelectedProd]     = useState("");
  const [selectedQty, setSelectedQty]       = useState(1);
  const [items, setItems]                   = useState<{productId:string;name:string;unitPrice:number;qty:number}[]>([]);

  const [payMethod, setPayMethod] = useState<ApiPaymentMethod>("cash");
  const [channel, setChannel]     = useState<"manual"|"whatsapp">("manual");
  const [saving, setSaving]       = useState(false);
  const [errorMsg, setErrorMsg]   = useState("");

  useEffect(() => {
    fetch(`/api/products?shopId=${shopId}`)
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data.data) ? data.data : [];
        setShopProducts(
          list
            .filter((p: { isActive?: boolean; stock?: number }) => p.isActive !== false && Number(p.stock ?? 0) > 0)
            .map((p: { id: string; name: string; unitPrice: unknown; stock: unknown }) => ({
              id: p.id, name: p.name,
              unitPrice: parseFloat(String(p.unitPrice ?? 0)),
              stock: Number(p.stock ?? 0),
            }))
        );
      })
      .catch(() => {});
  }, [shopId]);

  async function lookupCustomer() {
    if (phone.trim().length < 8) return;
    setLookupState("searching");
    try {
      const res  = await fetch(`/api/customers?shopId=${shopId}&q=${encodeURIComponent(phone.trim())}`);
      const data = await res.json();
      const list = Array.isArray(data.data) ? data.data : [];
      const match = list.find((c: { phone: string; id: string; fullName: string }) =>
        c.phone === phone.trim() || c.phone.replace(/\s/g,"") === phone.trim().replace(/\s/g,"")
      );
      if (match) {
        setFoundCustId(match.id);
        setCustomerName(match.fullName);
        setLookupState("found");
      } else {
        setFoundCustId(null);
        setLookupState("new");
      }
    } catch {
      setFoundCustId(null);
      setLookupState("new");
    }
  }

  function addItem() {
    const prod = shopProducts.find(p => p.id === selectedProd);
    if (!prod || selectedQty < 1) return;
    const idx = items.findIndex(i => i.productId === prod.id);
    if (idx >= 0) {
      const next = [...items];
      next[idx] = { ...next[idx], qty: next[idx].qty + selectedQty };
      setItems(next);
    } else {
      setItems([...items, { productId: prod.id, name: prod.name, unitPrice: prod.unitPrice, qty: selectedQty }]);
    }
    setSelectedProd(""); setSelectedQty(1);
  }

  const orderTotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const canSubmit  = phone.trim().length >= 8 && customerName.trim().length >= 2 && items.length > 0 && !saving;

  async function submit() {
    if (!canSubmit) return;
    setSaving(true); setErrorMsg("");
    try {
      let customerId = foundCustId;
      if (!customerId) {
        const cRes = await fetch(`/api/customers?shopId=${shopId}`, {
          method: "POST",
          headers: { "Content-Type":"application/json" },
          body: JSON.stringify({ fullName: customerName.trim(), phone: phone.trim() }),
        });
        if (!cRes.ok) {
          const cd = await cRes.json().catch(() => ({}));
          throw new Error((cd as { error?: string }).error ?? "Erreur création client");
        }
        const cd = await cRes.json();
        customerId = (cd as { data?: { id?: string } }).data?.id ?? null;
        if (!customerId) throw new Error("Client non créé");
      }
      const oRes = await fetch(`/api/orders?shopId=${shopId}`, {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
          customerId,
          items: items.map(i => ({ productId: i.productId, quantity: i.qty })),
          paymentMethod: payMethod,
          channel,
        }),
      });
      if (!oRes.ok) {
        const od = await oRes.json().catch(() => ({}));
        throw new Error((od as { error?: string }).error ?? "Erreur création commande");
      }
      onCreated();
    } catch (e) {
      setErrorMsg((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="or-modal" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="or-modal-box">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <h2 style={{ fontSize:17, fontWeight:700, color:"#1F2A24", margin:0 }}>Nouvelle commande</h2>
          <button onClick={onClose} style={{ border:"none", background:"none", cursor:"pointer", color:"#98A2B3", lineHeight:1, display:"flex", alignItems:"center" }}><X size={16} /></button>
        </div>
        <div style={{ padding:"8px 12px", background:"#EAF7EF", borderRadius:8, fontSize:12, color:"#08763A", marginBottom:16 }}>
          Boutique : <strong>{shopName}</strong>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          {/* Customer phone */}
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:"#1F2A24", display:"block", marginBottom:5 }}>Téléphone client *</label>
            <div style={{ display:"flex", gap:8 }}>
              <input className="inp" style={{ flex:1 }} placeholder="+221771234567" value={phone}
                onChange={e => { setPhone(e.target.value); setLookupState("idle"); setFoundCustId(null); }}
                onBlur={lookupCustomer} />
              <button className="btn-secondary" onClick={lookupCustomer} disabled={phone.trim().length < 8}>
                {lookupState === "searching" ? "…" : "Vérifier"}
              </button>
            </div>
            {lookupState === "found" && <div style={{ fontSize:11, color:"#0A8F45", marginTop:3, display:"flex", alignItems:"center" }}><Check size={12} style={{ marginRight:3 }} /> Client existant trouvé</div>}
            {lookupState === "new"   && <div style={{ fontSize:11, color:"#F08A24", marginTop:3 }}>Nouveau client — sera créé automatiquement</div>}
          </div>

          {/* Customer name */}
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:"#1F2A24", display:"block", marginBottom:5 }}>Nom du client *</label>
            <input className="inp" style={{ width:"100%", boxSizing:"border-box" }} placeholder="Prénom Nom"
              value={customerName} onChange={e => setCustomerName(e.target.value)} />
          </div>

          {/* Items */}
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:"#1F2A24", display:"block", marginBottom:5 }}>Produits *</label>
            <div style={{ display:"flex", gap:8, marginBottom:8 }}>
              <select className="sel" style={{ flex:1 }} value={selectedProd} onChange={e => setSelectedProd(e.target.value)}>
                <option value="">Choisir un produit…</option>
                {shopProducts.map(p => (
                  <option key={p.id} value={p.id}>{p.name} — {p.unitPrice.toLocaleString("fr-FR")} FCFA (stock : {p.stock})</option>
                ))}
              </select>
              <input type="number" className="inp" style={{ width:64 }} min={1} value={selectedQty}
                onChange={e => setSelectedQty(Math.max(1, parseInt(e.target.value) || 1))} />
              <button className="btn-primary" onClick={addItem} disabled={!selectedProd}>Ajouter</button>
            </div>
            {items.length > 0 && (
              <div style={{ border:"1px solid #E8ECEA", borderRadius:10, overflow:"hidden" }}>
                {items.map(item => (
                  <div key={item.productId} style={{ display:"flex", alignItems:"center", gap:8,
                    padding:"8px 12px", borderBottom:"1px solid #F4F6F5", fontSize:13 }}>
                    <span style={{ flex:1, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.name}</span>
                    <span style={{ color:"#667085" }}>×{item.qty}</span>
                    <span style={{ fontWeight:700, minWidth:90, textAlign:"right" }}>
                      {(item.unitPrice * item.qty).toLocaleString("fr-FR")} FCFA
                    </span>
                    <button onClick={() => setItems(items.filter(i => i.productId !== item.productId))}
                      style={{ border:"none", background:"none", color:"#EF4444", cursor:"pointer", lineHeight:1, padding:0, display:"flex", alignItems:"center" }}><X size={14} /></button>
                  </div>
                ))}
                <div style={{ padding:"8px 12px", background:"#F8FAF9", fontWeight:700, fontSize:13, textAlign:"right" }}>
                  Total : {orderTotal.toLocaleString("fr-FR")} FCFA
                </div>
              </div>
            )}
          </div>

          {/* Payment & Channel */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#1F2A24", display:"block", marginBottom:5 }}>Mode de paiement</label>
              <select className="sel" style={{ width:"100%", boxSizing:"border-box" }} value={payMethod}
                onChange={e => setPayMethod(e.target.value as ApiPaymentMethod)}>
                {(Object.entries(PAY_METHOD_LABELS) as [ApiPaymentMethod, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#1F2A24", display:"block", marginBottom:5 }}>Canal</label>
              <select className="sel" style={{ width:"100%", boxSizing:"border-box" }} value={channel}
                onChange={e => setChannel(e.target.value as "manual"|"whatsapp")}>
                <option value="manual">Manuel</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
          </div>

          {errorMsg && (
            <div style={{ padding:"8px 12px", background:"#FDE8E8", borderRadius:8, fontSize:12, color:"#EF4444" }}>{errorMsg}</div>
          )}

          <div style={{ display:"flex", gap:10 }}>
            <button className="btn-secondary" style={{ flex:1, height:38 }} onClick={onClose}>Annuler</button>
            <button className="btn-primary" style={{ flex:1, height:38 }} onClick={submit} disabled={!canSubmit}>
              {saving ? "Création…" : "Créer la commande"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CSV export ───────────────────────────────────────────────────────────────
function downloadCSV(rows: string[][], filename: string) {
  const content = rows
    .map(row => row.map(cell => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── Paginator ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 25;
function Paginator({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return (
    <div className="pag"><span className="pag-info">{total} résultat{total !== 1 ? "s" : ""}</span></div>
  );
  const start = (page - 1) * PAGE_SIZE + 1;
  const end   = Math.min(page * PAGE_SIZE, total);
  const range = Array.from(new Set([1, pages, page - 1, page, page + 1].filter(n => n >= 1 && n <= pages))).sort((a,b) => a-b);
  const nums: (number|"…")[] = [];
  for (let i = 0; i < range.length; i++) {
    if (i > 0 && range[i] - range[i-1] > 1) nums.push("…");
    nums.push(range[i]);
  }
  return (
    <div className="pag">
      <span className="pag-info">{start}–{end} sur {total}</span>
      <div className="pag-btns">
        <button className="pag-btn" disabled={page <= 1} onClick={() => onChange(page - 1)}>‹</button>
        {nums.map((n, i) => n === "…"
          ? <span key={`e${i}`} style={{ padding:"0 4px", color:"#98A2B3", fontSize:12 }}>…</span>
          : <button key={n} className={`pag-btn${n === page ? " active" : ""}`} onClick={() => onChange(n as number)}>{n}</button>
        )}
        <button className="pag-btn" disabled={page >= pages} onClick={() => onChange(page + 1)}>›</button>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const [activeShopId, setActiveShopId] = useActiveShop("");
  const [shops, setShops]               = useState<ApiShop[]>([]);
  const [orders, setOrders]             = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [search, setSearch]             = useState("");
  const [statusF, setStatusF]           = useState("all");
  const [payF, setPayF]                 = useState("all");
  const [channelF, setChannelF]         = useState("all");
  const [dateF, setDateF]               = useState("all");
  const [newOrderOpen, setNewOrderOpen]   = useState(false);
  const [newBadge, setNewBadge]           = useState(0);
  const [page, setPage]                   = useState(1);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const knownIds = useRef<Set<string>>(new Set());

  const activeShop = shops.find(s => s.id === activeShopId) ?? null;

  // Load shops once
  useEffect(() => {
    fetch("/api/shop?all=1")
      .then(r => r.json())
      .then(data => {
        const list: ApiShop[] = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
        setShops(list);
        const stored = typeof window !== "undefined" ? (localStorage.getItem("biz_active_shop_id") ?? "") : "";
        if (list.length > 0 && !list.find(s => s.id === stored)) {
          setActiveShopId(list[0].id);
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load orders when active shop changes
  useEffect(() => {
    if (!activeShopId) return;
    fetchOrders(activeShopId);
  }, [activeShopId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll every 30s for new orders
  useEffect(() => {
    if (!activeShopId) return;
    const iv = setInterval(async () => {
      try {
        const res  = await fetch(`/api/orders?shopId=${activeShopId}`);
        const data = await res.json();
        if (!Array.isArray(data.data)) return;
        const fetched = (data.data as ApiOrder[]).map(apiToDisplay);
        const brandNew = fetched.filter(o => !knownIds.current.has(o.id) && o.status === "new");
        if (brandNew.length > 0) {
          setOrders(fetched);
          fetched.forEach(o => knownIds.current.add(o.id));
          setNewBadge(c => c + brandNew.length);
        }
      } catch {}
    }, 30_000);
    return () => clearInterval(iv);
  }, [activeShopId]);

  async function fetchOrders(shopId: string) {
    if (!shopId) return;
    setOrdersLoading(true);
    try {
      const res  = await fetch(`/api/orders?shopId=${shopId}`);
      const data = await res.json();
      if (Array.isArray(data.data)) {
        const mapped = (data.data as ApiOrder[]).map(apiToDisplay);
        setOrders(mapped);
        knownIds.current = new Set(mapped.map(o => o.id));
      }
    } catch {}
    setOrdersLoading(false);
  }

  function handleExportCSV() {
    const shopName = activeShop?.name ?? "boutique";
    const date     = new Date().toISOString().slice(0, 10);
    const headers  = ["Référence", "Client", "Téléphone", "Canal", "Produits", "Montant (FCFA)", "Paiement", "Mode paiement", "Statut", "Date"];
    const rows     = filtered.map(o => [
      o.ref,
      o.client,
      o.phone,
      CHANNEL_LABELS[o.channel],
      o.items.map(i => `${i.name} ×${i.qty}`).join(" | "),
      String(o.amount),
      PAY_LABELS[o.paymentStatus],
      o.paymentMethod ? PAY_METHOD_LABELS[o.paymentMethod] : "",
      STATUS_LABELS[o.status],
      o.date,
    ]);
    downloadCSV([headers, ...rows], `commandes_${shopName}_${date}.csv`);
  }

  async function advanceStatus(orderId: string, nextStatus: ApiOrderStatus) {
    try {
      const res  = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.data) {
        setOrders(prev => prev.map(o => o.id === orderId ? apiToDisplay(data.data as ApiOrder) : o));
      }
    } catch {}
  }

  const filtered = useMemo(() => {
    const today   = new Date().toISOString().slice(0, 10);
    const d7ago   = new Date(Date.now() - 7  * 86400_000).toISOString().slice(0, 10);
    const d30ago  = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
    let list = [...orders];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.ref.toLowerCase().includes(q) || o.client.toLowerCase().includes(q) || o.phone.includes(q)
      );
    }
    if (statusF  !== "all") list = list.filter(o => o.status        === statusF);
    if (payF     !== "all") list = list.filter(o => o.paymentStatus === payF);
    if (channelF !== "all") list = list.filter(o => o.channel       === channelF);
    if (dateF === "today") list = list.filter(o => o.date === today);
    if (dateF === "7d")    list = list.filter(o => o.date >= d7ago);
    if (dateF === "30d")   list = list.filter(o => o.date >= d30ago);
    return list;
  }, [orders, search, statusF, payF, channelF, dateF]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, statusF, payF, channelF, dateF]); // eslint-disable-line react-hooks/exhaustive-deps

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // KPIs
  const pendingCount   = orders.filter(o => o.status === "new" || o.status === "pending").length;
  const deliveredCount = orders.filter(o => o.status === "delivered").length;
  const revenue        = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.amount, 0);
  const unpaidCount    = orders.filter(o => o.paymentStatus === "unpaid" && o.status !== "cancelled").length;
  const waPendingCount = orders.filter(o => o.channel === "whatsapp" && (o.status === "new" || o.status === "pending")).length;

  return (
    <>
      <style>{CSS}</style>
      {newOrderOpen && activeShopId && (
        <NewOrderModal
          shopId={activeShopId}
          shopName={activeShop?.name ?? ""}
          onClose={() => setNewOrderOpen(false)}
          onCreated={() => { setNewOrderOpen(false); fetchOrders(activeShopId); }}
        />
      )}

      {cancelOrderId && (
        <div className="or-modal" onClick={() => setCancelOrderId(null)}>
          <div className="or-modal-box" style={{ maxWidth:380, textAlign:"center" }}
               onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:44, marginBottom:12 }}>🗑️</div>
            <h2 style={{ fontSize:18, fontWeight:800, color:"#1F2A24", margin:"0 0 8px" }}>
              Annuler la commande ?
            </h2>
            <p style={{ fontSize:13, color:"#667085", margin:"0 0 20px", lineHeight:1.6 }}>
              Cette action est irréversible. La commande&nbsp;
              <strong style={{ color:"#1F2A24" }}>#{cancelOrderId.slice(-6).toUpperCase()}</strong>&nbsp;
              passera au statut <strong style={{ color:"#EF4444" }}>Annulée</strong>.
            </p>
            <div style={{ display:"flex", gap:10 }}>
              <button className="btn-secondary" style={{ flex:1, height:40 }}
                onClick={() => setCancelOrderId(null)}>
                Garder
              </button>
              <button
                style={{ flex:1, height:40, background:"#EF4444", color:"#fff", border:"none",
                         borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer" }}
                onClick={() => { advanceStatus(cancelOrderId, "cancelled"); setCancelOrderId(null); }}>
                Confirmer l&apos;annulation
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="or-wrap">

        {/* New orders banner */}
        {newBadge > 0 && (
          <div style={{ background:"#EAF7EF", border:"1px solid #0A8F45", borderRadius:10,
            padding:"10px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:10, fontSize:13 }}>
            <Bell size={18} color="#0A8F45" />
            <span style={{ fontWeight:700, color:"#0A8F45" }}>
              {newBadge} nouvelle{newBadge > 1 ? "s" : ""} commande{newBadge > 1 ? "s" : ""} reçue{newBadge > 1 ? "s" : ""} !
            </span>
            <button className="btn-primary" style={{ marginLeft:"auto", height:30, fontSize:11 }}
              onClick={() => { setNewBadge(0); fetchOrders(activeShopId); }}>
              Voir maintenant
            </button>
            <button style={{ border:"none", background:"none", color:"#98A2B3", cursor:"pointer", display:"flex", alignItems:"center" }}
              onClick={() => setNewBadge(0)}><X size={16} /></button>
          </div>
        )}

        {/* Context bar */}
        <div className="or-ctx">
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:12, color:"#667085", fontWeight:500 }}>Boutique active</span>
            <select className="sel"
              style={{ fontWeight:700, color:"#0A8F45", borderColor:"#0A8F45", minWidth:155 }}
              value={activeShopId}
              onChange={e => setActiveShopId(e.target.value)}>
              {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ fontSize:12, color:"#1F2A24" }}>
            <span style={{ fontWeight:500 }}>{shops.length} boutique{shops.length > 1 ? "s" : ""}</span>
            <span style={{ color:"#98A2B3" }}> · {orders.length} commande{orders.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="or-ctx-r">
            <button className="btn-secondary" onClick={() => fetchOrders(activeShopId)} disabled={ordersLoading}
              style={{ display:"flex", alignItems:"center", gap:5 }}>
              {ordersLoading ? "…" : <><RefreshCw size={12} /> Actualiser</>}
            </button>
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom:16 }}>
          <h1 style={{ fontSize:22, fontWeight:700, color:"#1F2A24", margin:"0 0 4px" }}>Commandes</h1>
          <p style={{ margin:0, color:"#667085", fontSize:14 }}>
            Commandes de <strong style={{ color:"#0A8F45" }}>{activeShop?.name ?? "votre boutique"}</strong> — gérez et faites avancer chaque commande.
          </p>
        </div>

        {/* KPIs */}
        <div className="or-kpi">
          {[
            { icon:<ShoppingCart size={16} color="#0A8F45" />, l:"Total commandes",       v: String(orders.length),                              tc:"#0A8F45" },
            { icon:<Clock size={16} color="#F08A24" />,        l:"Nouvelles / En attente", v: String(pendingCount),                               tc:"#F08A24" },
            { icon:<CheckCircle size={16} color="#0A8F45" />,  l:"Livrées",                v: String(deliveredCount),                             tc:"#0A8F45" },
            { icon:<TrendingUp size={16} color="#0A8F45" />,   l:"Chiffre d'affaires",     v: revenue.toLocaleString("fr-FR") + " FCFA",         tc:"#0A8F45" },
          ].map((k, idx) => (
            <div key={idx} style={{ background:"#fff", border:"1px solid #E8ECEA", borderRadius:16,
              padding:"16px 18px", boxShadow:"0 2px 10px rgba(16,24,40,.04)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                <span style={{ fontSize:13, color:"#667085", fontWeight:500 }}>{k.l}</span>
                <span style={{ display:"flex", alignItems:"center" }}>{k.icon}</span>
              </div>
              <div style={{ fontSize:22, fontWeight:800, color:"#1F2A24", letterSpacing:"-0.5px" }}>{k.v}</div>
              {activeShop && <div style={{ fontSize:10, color:"#98A2B3", marginTop:4 }}>{activeShop.name}</div>}
            </div>
          ))}
        </div>

        {/* Main 2-col */}
        <div className="or-main">

          {/* Orders table */}
          <div className="or-tcard">
            <div className="or-tbar">
              <div>
                <div style={{ fontWeight:700, color:"#1F2A24", fontSize:15 }}>
                  Commandes — {activeShop?.name ?? "…"}
                  {newBadge > 0 && (
                    <span style={{ marginLeft:8, background:"#EF4444", color:"#fff",
                      borderRadius:10, padding:"2px 7px", fontSize:11, fontWeight:700 }}>{newBadge}</span>
                  )}
                </div>
                <div style={{ fontSize:11, color:"#98A2B3", marginTop:2 }}>Tous les canaux (WhatsApp, En ligne, Manuel)</div>
              </div>
              <div className="or-tacts">
                <button className="btn-secondary" onClick={handleExportCSV}
                  disabled={filtered.length === 0}
                  style={{ display:"flex", alignItems:"center", gap:5 }}
                  title={`Exporter ${filtered.length} commande${filtered.length !== 1 ? "s" : ""} en CSV`}>
                  <Download size={13} /> Exporter
                </button>
                <button className="btn-primary" onClick={() => setNewOrderOpen(true)}>+ Nouvelle commande</button>
                <button className="btn-secondary" onClick={() => fetchOrders(activeShopId)}>{ordersLoading ? "…" : <RefreshCw size={14} />}</button>
              </div>
            </div>

            {/* Filters */}
            <div className="or-ftrow">
              <input className="inp" placeholder="🔍 Référence, client, téléphone…"
                style={{ flex:1, minWidth:130 }} value={search} onChange={e => setSearch(e.target.value)} />
              <select className="sel" value={statusF} onChange={e => setStatusF(e.target.value)}>
                <option value="all">Statut</option>
                <option value="new">Nouvelle</option>
                <option value="confirmed">Confirmée</option>
                <option value="in_progress">En traitement</option>
                <option value="ready">Prête</option>
                <option value="delivered">Livrée</option>
                <option value="cancelled">Annulée</option>
              </select>
              <select className="sel" value={payF} onChange={e => setPayF(e.target.value)}>
                <option value="all">Paiement</option>
                <option value="paid">Payée</option>
                <option value="unpaid">Non payée</option>
                <option value="partial">Partielle</option>
              </select>
              <select className="sel" value={channelF} onChange={e => setChannelF(e.target.value)}>
                <option value="all">Canal</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="online">En ligne</option>
                <option value="manual">Manuel</option>
              </select>
              <select className="sel" value={dateF} onChange={e => setDateF(e.target.value)}>
                <option value="all">Date</option>
                <option value="today">Aujourd&apos;hui</option>
                <option value="7d">7 derniers jours</option>
                <option value="30d">30 derniers jours</option>
              </select>
            </div>

            {/* Table */}
            {ordersLoading ? (
              <div style={{ textAlign:"center", padding:40, color:"#98A2B3", fontSize:14 }}>Chargement des commandes…</div>
            ) : (
              <div style={{ overflowX:"auto" }}>
                <table className="or-table">
                  <thead>
                    <tr>
                      <th>Référence</th>
                      <th>Client</th>
                      <th>Canal</th>
                      <th>Produits</th>
                      <th>Montant</th>
                      <th>Paiement</th>
                      <th>Statut</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(o => {
                      const nextStatus = NEXT_STATUS[o.status];
                      const nextLabel  = NEXT_STATUS_LABEL[o.status];
                      return (
                        <tr key={o.id}>
                          <td><span style={{ fontFamily:"monospace", fontWeight:600, fontSize:12 }}>{o.ref}</span></td>
                          <td>
                            <div style={{ fontWeight:600, fontSize:13 }}>{o.client}</div>
                            <div style={{ fontSize:11, color:"#98A2B3" }}>{o.phone}</div>
                          </td>
                          <td><ChannelBadge c={o.channel} /></td>
                          <td style={{ fontSize:11, color:"#667085", maxWidth:160 }}>
                            <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", display:"block" }}>
                              {o.items.slice(0, 2).map(i => i.name).join(", ")}
                              {o.items.length > 2 && ` +${o.items.length - 2}`}
                            </span>
                          </td>
                          <td style={{ fontWeight:700, whiteSpace:"nowrap" }}>{o.amount.toLocaleString("fr-FR")} FCFA</td>
                          <td><PayBadge p={o.paymentStatus} /></td>
                          <td><StatusBadge s={o.status} /></td>
                          <td style={{ fontSize:11, color:"#98A2B3", whiteSpace:"nowrap" }}>{o.date}</td>
                          <td>
                            <div className="or-act-btns">
                              {nextStatus && nextLabel && (
                                <button
                                  style={{ background:"#EAF7EF", color:"#0A8F45", border:"none", cursor:"pointer",
                                    fontWeight:600, fontSize:11, padding:"3px 8px", borderRadius:6, whiteSpace:"nowrap" }}
                                  title={nextLabel}
                                  onClick={() => advanceStatus(o.id, nextStatus)}>
                                  {nextLabel}
                                </button>
                              )}
                              <button className="or-act-btn" title="WhatsApp"
                                onClick={() => window.open(`https://wa.me/${o.phone.replace(/\D/g,"")}`, "_blank")}>
                                💬
                              </button>
                              {o.status !== "cancelled" && o.status !== "delivered" && (
                                <button className="or-act-btn" title="Annuler la commande" style={{ color:"#EF4444" }}
                                  onClick={() => setCancelOrderId(o.id)}>
                                  🗑️
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={9} style={{ textAlign:"center", padding:32, color:"#98A2B3" }}>
                          {orders.length === 0
                            ? "Aucune commande pour cette boutique."
                            : "Aucune commande correspond à vos filtres."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <Paginator page={page} total={filtered.length} onChange={setPage} />
          </div>

          {/* Right sidebar */}
          <div className="or-right">

            {/* Active shop card */}
            <div className="or-card">
              <div style={{ fontSize:13, fontWeight:700, color:"#1F2A24", marginBottom:12 }}>Boutique active</div>
              {activeShop ? (
                <>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                    <div style={{ width:42, height:42, borderRadius:12, background:"#EAF7EF",
                      display:"flex", alignItems:"center", justifyContent:"center" }}><Store size={20} color="#0A8F45" /></div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14, color:"#1F2A24" }}>{activeShop.name}</div>
                      <span className={activeShop.isPublished ? "badge badge-green" : "badge badge-gray"} style={{ fontSize:10 }}>
                        {activeShop.isPublished ? "Publiée" : "Brouillon"}
                      </span>
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                    {[
                      { l:"Commandes",  v: activeShop._count.orders },
                      { l:"Produits",   v: activeShop._count.products },
                      { l:"Clients",    v: activeShop._count.customers },
                      { l:"Livrées",    v: deliveredCount },
                    ].map(r => (
                      <div key={r.l} style={{ background:"#F8FAF9", borderRadius:8, padding:"7px 10px" }}>
                        <div style={{ fontSize:15, fontWeight:700, color:"#1F2A24" }}>{r.v}</div>
                        <div style={{ fontSize:10, color:"#98A2B3" }}>{r.l}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ fontSize:13, color:"#98A2B3" }}>Chargement…</div>
              )}
            </div>

            {/* Shop list */}
            <div className="or-card">
              <div style={{ fontSize:13, fontWeight:700, color:"#1F2A24", marginBottom:10 }}>Mes boutiques</div>
              {shops.length === 0 ? (
                <div style={{ fontSize:12, color:"#98A2B3" }}>Aucune boutique.</div>
              ) : shops.map((s, i) => (
                <div key={s.id} className="or-shop-row"
                  style={{ background: s.id === activeShopId ? "#EAF7EF" : "transparent",
                    borderRadius:8, cursor:"pointer" }}
                  onClick={() => setActiveShopId(s.id)}>
                  <div className="or-shop-av" style={{ background: SHOP_COLORS[i % SHOP_COLORS.length] }}>
                    {s.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:12, color:"#1F2A24", display:"flex", alignItems:"center", gap:5 }}>
                      <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.name}</span>
                      {s.id === activeShopId && (
                        <span style={{ fontSize:9, background:"#0A8F45", color:"#fff", borderRadius:4, padding:"1px 5px", flexShrink:0 }}>Actif</span>
                      )}
                    </div>
                    <div style={{ fontSize:10, color:"#98A2B3" }}>{s._count.orders} commandes · {s._count.products} produits</div>
                  </div>
                  <span className={s.isPublished ? "badge badge-green" : "badge badge-gray"} style={{ fontSize:9 }}>
                    {s.isPublished ? "Active" : "Brouillon"}
                  </span>
                </div>
              ))}
            </div>

            {/* Alerts */}
            <div className="or-card">
              <div style={{ fontSize:13, fontWeight:700, color:"#1F2A24", marginBottom:10 }}>Alertes</div>
              {pendingCount === 0 && unpaidCount === 0 && waPendingCount === 0 ? (
                <div style={{ fontSize:12, color:"#98A2B3", textAlign:"center", padding:"8px 0" }}>
                  {orders.length === 0 ? "Aucune commande" : "Aucune alerte en cours ✓"}
                </div>
              ) : (
                <>
                  {pendingCount > 0 && (
                    <div className="or-alert-row">
                      <span style={{ fontSize:15 }}>⏳</span>
                      <span style={{ color:"#F08A24", fontWeight:500 }}>{pendingCount} commande{pendingCount > 1 ? "s" : ""} en attente</span>
                    </div>
                  )}
                  {unpaidCount > 0 && (
                    <div className="or-alert-row">
                      <span style={{ fontSize:15 }}>💳</span>
                      <span style={{ color:"#3B82F6", fontWeight:500 }}>{unpaidCount} paiement{unpaidCount > 1 ? "s" : ""} non reçu{unpaidCount > 1 ? "s" : ""}</span>
                    </div>
                  )}
                  {waPendingCount > 0 && (
                    <div className="or-alert-row">
                      <span style={{ fontSize:15 }}>💬</span>
                      <span style={{ color:"#0A8F45", fontWeight:500 }}>{waPendingCount} WhatsApp à relancer</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Donut */}
            <div className="or-card">
              <div style={{ fontSize:13, fontWeight:700, color:"#1F2A24", marginBottom:12 }}>Répartition par canal</div>
              <DonutChart orders={orders} />
            </div>

          </div>
        </div>

        {/* Bottom row */}
        <div className="or-bottom">
          <div className="or-card">
            <div style={{ fontSize:13, fontWeight:700, color:"#1F2A24", marginBottom:12 }}>Conseils de gestion</div>
            <div className="or-tips">
              {[
                { icon:"⏱️", t:"Traitez les nouvelles commandes rapidement",  d:"Cliquez sur « Confirmer » dans le tableau dès qu'une commande arrive.", link:"Voir commandes",   href:"#" },
                { icon:"💳", t:"Relancez les paiements en attente",           d:"Contactez les clients avec un paiement non reçu via WhatsApp.",        link:"WhatsApp clients", href:"#" },
                { icon:"📊", t:"Analysez vos canaux de vente",               d:"Comparez WhatsApp, boutique en ligne et commandes manuelles.",          link:"Statistiques",     href:"/dashboard" },
                { icon:"🏪", t:"Comparez vos boutiques",                      d:"Identifiez quelle boutique performe le mieux.",                        link:"Mes boutiques",    href:"/shops" },
              ].map(c => (
                <div key={c.t} style={{ background:"#F8FAF9", borderRadius:10, padding:"11px 13px", border:"1px solid #F0F2F1" }}>
                  <div style={{ fontSize:18, marginBottom:5 }}>{c.icon}</div>
                  <div style={{ fontWeight:600, color:"#1F2A24", fontSize:12, marginBottom:3 }}>{c.t}</div>
                  <div style={{ fontSize:11, color:"#98A2B3", marginBottom:8 }}>{c.d}</div>
                  <a href={c.href} style={{ fontSize:11, fontWeight:600, color:"#0A8F45", textDecoration:"none" }}>{c.link} →</a>
                </div>
              ))}
            </div>
          </div>

          <div className="or-card">
            <div style={{ fontSize:13, fontWeight:700, color:"#1F2A24", marginBottom:12 }}>Support</div>
            {[
              { icon:"💬", label:"Contacter le support",      href:"mailto:support@bizmanager.app" },
              { icon:"📚", label:"Documentation",              href:"#docs" },
              { icon:"❓", label:"Aide commandes et canaux",   href:"#help" },
            ].map(r => (
              <a key={r.label} href={r.href}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:"#F8FAF9",
                  borderRadius:10, textDecoration:"none", color:"#1F2A24", fontSize:13, fontWeight:500,
                  marginBottom:8, transition:"background .15s" }}
                onMouseEnter={e => (e.currentTarget.style.background="#EAF7EF")}
                onMouseLeave={e => (e.currentTarget.style.background="#F8FAF9")}>
                <span style={{ fontSize:16 }}>{r.icon}</span>
                {r.label}
                <span style={{ marginLeft:"auto", color:"#98A2B3" }}>→</span>
              </a>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}

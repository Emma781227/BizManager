"use client";
import { useEffect, useMemo, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Order = {
  id: string; ref: string; client: string; phone: string;
  channel: "whatsapp"|"online"|"manual";
  amount: number; payment: "paid"|"pending"|"unpaid";
  status: "waiting"|"confirmed"|"preparing"|"delivered"|"cancelled";
  date: string; lastAction: string;
};

// ─── Static data ──────────────────────────────────────────────────────────────
const MOCK_SHOPS = [
  { id:"s1", name:"Mon Aventure", isPublished:true,  city:"Dakar",   products:78, orders:156, clients:1242, color:"#0A8F45" },
  { id:"s2", name:"Urban Style",  isPublished:true,  city:"Abidjan", products:62, orders:128, clients:573,  color:"#3B82F6" },
  { id:"s3", name:"Beauty House", isPublished:false, city:"Douala",  products:16, orders:58,  clients:42,   color:"#F08A24" },
];

const MOCK_ORDERS: Order[] = [
  { id:"o1", ref:"#ORD-2341", client:"Awa Diallo",      phone:"+221771234567", channel:"whatsapp", amount:32500,  payment:"paid",    status:"delivered",  date:"2026-05-09", lastAction:"Livraison confirmée" },
  { id:"o2", ref:"#ORD-2340", client:"Ibrahim Ba",      phone:"+221776543210", channel:"online",   amount:18900,  payment:"pending", status:"preparing",  date:"2026-05-09", lastAction:"En préparation"     },
  { id:"o3", ref:"#ORD-2339", client:"Fatou Sow",       phone:"+221789012345", channel:"whatsapp", amount:45000,  payment:"paid",    status:"confirmed",  date:"2026-05-08", lastAction:"Commande confirmée"  },
  { id:"o4", ref:"#ORD-2338", client:"Moussa Ndiaye",   phone:"+221770987654", channel:"manual",   amount:8500,   payment:"unpaid",  status:"waiting",    date:"2026-05-08", lastAction:"Relance envoyée"     },
  { id:"o5", ref:"#ORD-2337", client:"Aissatou Camara", phone:"+221778901234", channel:"online",   amount:12800,  payment:"paid",    status:"delivered",  date:"2026-05-07", lastAction:"Livraison confirmée" },
  { id:"o6", ref:"#ORD-2336", client:"Cheikh Fall",     phone:"+221772345678", channel:"whatsapp", amount:28000,  payment:"pending", status:"waiting",    date:"2026-05-07", lastAction:"Message client"      },
  { id:"o7", ref:"#ORD-2335", client:"Mariama Balde",   phone:"+221773456789", channel:"online",   amount:54000,  payment:"paid",    status:"cancelled",  date:"2026-05-06", lastAction:"Commande annulée"    },
];

const CHANNEL_LABELS: Record<Order["channel"], string> = { whatsapp:"WhatsApp", online:"En ligne", manual:"Manuel" };
const CHANNEL_ICONS:  Record<Order["channel"], string> = { whatsapp:"💬", online:"🌐", manual:"✍️"  };
const STATUS_LABELS:  Record<Order["status"],  string> = {
  waiting:"En attente", confirmed:"Confirmée", preparing:"En préparation", delivered:"Livrée", cancelled:"Annulée"
};
const PAY_LABELS: Record<Order["payment"], string> = { paid:"Payée", pending:"En attente", unpaid:"Non payée" };

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
.or-wrap { padding:24px 28px; max-width:1280px; margin:0 auto; background:#F8FAF9; min-height:100vh; }
.or-ctx  { display:flex; align-items:center; gap:14px; flex-wrap:wrap; margin-bottom:16px; }
.or-ctx-r { margin-left:auto; display:flex; gap:8px; }
.or-kpi  { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:16px; }
.or-info { display:flex; align-items:center; gap:24px; background:#fff; border:1px solid #E8ECEA;
           border-radius:16px; padding:16px 22px; margin-bottom:18px;
           box-shadow:0 2px 10px rgba(16,24,40,.04); flex-wrap:wrap; }
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
.or-act-btns { display:flex; gap:3px; }
.or-act-btn  { border:none; background:none; cursor:pointer; padding:4px 6px;
               border-radius:6px; font-size:13px; color:#667085; transition:background .15s; }
.or-act-btn:hover { background:#F4F6F5; }
.or-shop-row { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid #F4F6F5; }
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
.or-modal-box { background:#fff; border-radius:18px; padding:26px; width:100%; max-width:460px;
                box-shadow:0 20px 60px rgba(0,0,0,.15); }
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
.btn-secondary { height:34px; padding:0 12px; background:#fff; color:#1F2A24;
                 border:1px solid #E8ECEA; border-radius:10px; font-size:12px; cursor:pointer; white-space:nowrap; }
.btn-secondary:hover { background:#F8FAF9; }
.quota-bar  { height:6px; border-radius:4px; background:#E8ECEA; overflow:hidden; margin-top:4px; }
.quota-fill { height:100%; border-radius:4px; background:#0A8F45; }
@media(max-width:1100px){ .or-kpi{grid-template-columns:repeat(2,1fr);} .or-main{grid-template-columns:1fr;} }
@media(max-width:700px){ .or-kpi{grid-template-columns:1fr 1fr;} .or-wrap{padding:14px 12px;}
  .or-ctx{flex-direction:column;align-items:flex-start;} .or-ctx-r{margin-left:0;}
  .or-bottom{grid-template-columns:1fr;} .or-tips{grid-template-columns:1fr;} }
`;

// ─── Badges ───────────────────────────────────────────────────────────────────
function StatusBadge({ s }: { s: Order["status"] }) {
  const map: Record<Order["status"], string> = {
    waiting:"badge-orange", confirmed:"badge-blue", preparing:"badge-blue",
    delivered:"badge-green", cancelled:"badge-red",
  };
  return <span className={`badge ${map[s]}`}>{STATUS_LABELS[s]}</span>;
}
function PayBadge({ p }: { p: Order["payment"] }) {
  const map: Record<Order["payment"], string> = { paid:"badge-green", pending:"badge-orange", unpaid:"badge-red" };
  return <span className={`badge ${map[p]}`}>{PAY_LABELS[p]}</span>;
}
function ChannelBadge({ c }: { c: Order["channel"] }) {
  return (
    <span style={{ fontSize:12, color:"#667085", display:"flex", alignItems:"center", gap:4 }}>
      {CHANNEL_ICONS[c]} {CHANNEL_LABELS[c]}
    </span>
  );
}

// ─── Donut ────────────────────────────────────────────────────────────────────
const DONUT_DATA = [
  { label:"WhatsApp",   pct:52, color:"#0A8F45" },
  { label:"En ligne",   pct:34, color:"#3B82F6" },
  { label:"Manuel",     pct:14, color:"#98A2B3" },
];
function DonutChart() {
  const r = 38; const cx = 46; const cy = 46; const circ = 2 * Math.PI * r;
  let off = 0;
  const slices = DONUT_DATA.map(d => {
    const dash = (d.pct / 100) * circ; const s = { dash, gap: circ - dash, offset: off };
    off += dash; return s;
  });
  return (
    <div className="or-donut-wrap">
      <svg width="92" height="92" viewBox="0 0 92 92" style={{ flexShrink:0 }}>
        {DONUT_DATA.map((d, i) => (
          <circle key={d.label} cx={cx} cy={cy} r={r} fill="none" stroke={d.color} strokeWidth="12"
            strokeDasharray={`${slices[i].dash} ${slices[i].gap}`}
            strokeDashoffset={-slices[i].offset}
            style={{ transform:"rotate(-90deg)", transformOrigin:"46px 46px" }} />
        ))}
        <text x="46" y="43" textAnchor="middle" fontSize="12" fill="#1F2A24" fontWeight="700">156</text>
        <text x="46" y="56" textAnchor="middle" fontSize="9" fill="#98A2B3">cmd</text>
      </svg>
      <div className="or-donut-legend">
        {DONUT_DATA.map(d => (
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

// ─── New order modal ──────────────────────────────────────────────────────────
function NewOrderModal({ shopName, onClose }: { shopName: string; onClose: () => void }) {
  const [client, setClient] = useState("");
  const [amount, setAmount] = useState("");
  const [channel, setChannel] = useState<Order["channel"]>("manual");
  const [saving, setSaving] = useState(false);
  async function save() {
    if (!client.trim() || !amount.trim()) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false); onClose();
  }
  return (
    <div className="or-modal" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="or-modal-box">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <h2 style={{ fontSize:17, fontWeight:700, color:"#1F2A24", margin:0 }}>Nouvelle commande</h2>
          <button onClick={onClose} style={{ border:"none", background:"none", cursor:"pointer", fontSize:22, color:"#98A2B3", lineHeight:1 }}>×</button>
        </div>
        <div style={{ padding:"8px 12px", background:"#EAF7EF", borderRadius:8, fontSize:12, color:"#08763A", marginBottom:16 }}>
          Boutique : <strong>{shopName}</strong>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:"#1F2A24", display:"block", marginBottom:5 }}>Client *</label>
            <input className="inp" style={{ width:"100%", boxSizing:"border-box" }} placeholder="Nom du client" value={client} onChange={e => setClient(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:"#1F2A24", display:"block", marginBottom:5 }}>Montant (FCFA) *</label>
            <input className="inp" style={{ width:"100%", boxSizing:"border-box" }} type="number" placeholder="Ex : 25000" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:"#1F2A24", display:"block", marginBottom:5 }}>Canal</label>
            <select className="sel" style={{ width:"100%", boxSizing:"border-box" }} value={channel} onChange={e => setChannel(e.target.value as Order["channel"])}>
              <option value="manual">Manuel</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="online">Boutique en ligne</option>
            </select>
          </div>
          <div style={{ display:"flex", gap:10, marginTop:4 }}>
            <button className="btn-secondary" style={{ flex:1, height:38 }} onClick={onClose}>Annuler</button>
            <button className="btn-primary" style={{ flex:1, height:38 }} onClick={save} disabled={saving || !client.trim() || !amount.trim()}>
              {saving ? "Création…" : "Créer la commande"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const [activeId, setActiveId]   = useState("s1");
  const [search, setSearch]       = useState("");
  const [statusF, setStatusF]     = useState("all");
  const [payF, setPayF]           = useState("all");
  const [channelF, setChannelF]   = useState("all");
  const [dateF, setDateF]         = useState("all");
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [loading, setLoading]     = useState(false);

  const activeShop = MOCK_SHOPS.find(s => s.id === activeId) ?? MOCK_SHOPS[0];

  useEffect(() => {
    fetch("/api/orders").then(() => {}).catch(() => {});
  }, []);

  function refresh() {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  }

  const filtered = useMemo(() => {
    let list = [...MOCK_ORDERS];
    if (search)           list = list.filter(o => o.ref.toLowerCase().includes(search.toLowerCase()) || o.client.toLowerCase().includes(search.toLowerCase()));
    if (statusF  !== "all") list = list.filter(o => o.status  === statusF);
    if (payF     !== "all") list = list.filter(o => o.payment === payF);
    if (channelF !== "all") list = list.filter(o => o.channel === channelF);
    if (dateF === "today") list = list.filter(o => o.date === "2026-05-09");
    if (dateF === "7d")    list = list.filter(o => o.date >= "2026-05-03");
    return list;
  }, [search, statusF, payF, channelF, dateF]);

  const shopColors = ["#0A8F45","#3B82F6","#F08A24"];

  return (
    <>
      <style>{CSS}</style>
      {newOrderOpen && <NewOrderModal shopName={activeShop.name} onClose={() => setNewOrderOpen(false)} />}

      <div className="or-wrap">

        {/* Context bar */}
        <div className="or-ctx">
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:12, color:"#667085", fontWeight:500 }}>Boutique active</span>
            <select className="sel" style={{ fontWeight:700, color:"#0A8F45", borderColor:"#0A8F45", minWidth:155 }}
              value={activeId} onChange={e => setActiveId(e.target.value)}>
              {MOCK_SHOPS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            <span className="badge badge-biz" style={{ padding:"5px 12px", fontSize:12 }}>Plan Business</span>
            <div>
              <div style={{ fontSize:12, color:"#1F2A24", fontWeight:500 }}>2 / 3 boutiques utilisées</div>
              <div style={{ fontSize:11, color:"#98A2B3" }}>156 commandes ce mois-ci</div>
            </div>
          </div>
          <div className="or-ctx-r">
            <button className="btn-secondary">⬇ Exporter</button>
            <button className="btn-primary">+ Créer une boutique</button>
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom:16 }}>
          <h1 style={{ fontSize:22, fontWeight:700, color:"#1F2A24", margin:"0 0 4px" }}>Commandes</h1>
          <p style={{ margin:"0 0 2px", color:"#667085", fontSize:14 }}>
            Gérez les commandes de votre boutique active et suivez vos ventes par canal.
          </p>
          <p style={{ margin:0, color:"#98A2B3", fontSize:12 }}>
            Les commandes affichées ici appartiennent uniquement à la boutique&nbsp;
            <strong style={{ color:"#0A8F45" }}>{activeShop.name}</strong>.
          </p>
        </div>

        {/* KPI row */}
        <div className="or-kpi">
          {[
            { icon:"🛒", l:"Total commandes",     v:String(activeShop.orders),  t:"+12,4%", tc:"#0A8F45" },
            { icon:"⏳", l:"En attente",           v:"24",                        t:"+9,1%",  tc:"#F08A24" },
            { icon:"✅", l:"Livrées",              v:"98",                        t:"+15,3%", tc:"#0A8F45" },
            { icon:"💰", l:"Chiffre d'affaires",  v:"2 458 760 FCFA",            t:"+18,7%", tc:"#0A8F45" },
          ].map(k => (
            <div key={k.l} style={{ background:"#fff", border:"1px solid #E8ECEA", borderRadius:16,
              padding:"16px 18px", boxShadow:"0 2px 10px rgba(16,24,40,.04)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                <span style={{ fontSize:13, color:"#667085", fontWeight:500 }}>{k.l}</span>
                <span style={{ fontSize:18 }}>{k.icon}</span>
              </div>
              <div style={{ fontSize:24, fontWeight:800, color:"#1F2A24", letterSpacing:"-0.5px" }}>{k.v}</div>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:4 }}>
                <span style={{ fontSize:11, fontWeight:600, color:k.tc }}>{k.t}</span>
                <span style={{ fontSize:11, color:"#98A2B3" }}>vs mois dernier</span>
              </div>
              <div style={{ fontSize:10, color:"#98A2B3", marginTop:4 }}>Boutique : {activeShop.name}</div>
            </div>
          ))}
        </div>

        {/* Info card */}
        <div className="or-info">
          <div style={{ fontSize:26 }}>🏪</div>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ fontWeight:700, color:"#1F2A24", fontSize:13 }}>
              Toutes les commandes affichées ici appartiennent à la boutique active&nbsp;
              <span style={{ color:"#0A8F45" }}>{activeShop.name}</span>.
            </div>
            <div style={{ color:"#667085", fontSize:12, marginTop:2 }}>
              Les commandes ne sont pas directement liées au marchand, mais à une boutique spécifique.
            </div>
          </div>
          <div style={{ borderLeft:"1px solid #E8ECEA", paddingLeft:20, minWidth:200 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12 }}>
              <span style={{ background:"#EAF7EF", color:"#0A8F45", padding:"3px 8px", borderRadius:8, fontWeight:600 }}>Marie A.</span>
              <span style={{ color:"#98A2B3", fontSize:14 }}>→</span>
              <span style={{ fontWeight:600, color:"#1F2A24" }}>{activeShop.name}</span>
              <span style={{ color:"#98A2B3", fontSize:14 }}>→</span>
              <span style={{ color:"#667085" }}>{activeShop.orders} commandes</span>
            </div>
            <div style={{ fontSize:10, color:"#98A2B3", marginTop:5 }}>Marchand → Boutique → Commandes</div>
          </div>
          <div style={{ minWidth:140 }}>
            <div style={{ fontSize:12, color:"#667085", fontWeight:500 }}>Quota boutiques</div>
            <div style={{ fontWeight:700, color:"#1F2A24", margin:"3px 0 2px" }}>2 / 3</div>
            <div className="quota-bar" style={{ width:120 }}><div className="quota-fill" style={{ width:"66%" }} /></div>
          </div>
        </div>

        {/* Main 2-col */}
        <div className="or-main">

          {/* Left: orders table */}
          <div className="or-tcard">
            {/* card header */}
            <div className="or-tbar">
              <div>
                <div style={{ fontWeight:700, color:"#1F2A24", fontSize:15 }}>
                  Gestion des commandes — {activeShop.name}
                  <span className="badge badge-biz" style={{ marginLeft:10, fontSize:10 }}>Canal multi-source</span>
                </div>
                <div style={{ fontSize:11, color:"#98A2B3", marginTop:2 }}>
                  Suivez toutes les commandes de cette boutique, quel que soit le canal de vente.
                </div>
              </div>
              <div className="or-tacts">
                <button className="btn-primary" onClick={() => setNewOrderOpen(true)}>+ Nouvelle commande</button>
                <button className="btn-secondary">↩ Relancer</button>
                <button className="btn-secondary" onClick={refresh}>{loading ? "…" : "🔄"} Actualiser</button>
              </div>
            </div>

            {/* filters */}
            <div className="or-ftrow">
              <input className="inp" placeholder="🔍 Commande, client…" style={{ flex:1, minWidth:130 }}
                value={search} onChange={e => setSearch(e.target.value)} />
              <select className="sel" value={statusF} onChange={e => setStatusF(e.target.value)}>
                <option value="all">Statut</option>
                <option value="waiting">En attente</option>
                <option value="confirmed">Confirmée</option>
                <option value="preparing">En préparation</option>
                <option value="delivered">Livrée</option>
                <option value="cancelled">Annulée</option>
              </select>
              <select className="sel" value={payF} onChange={e => setPayF(e.target.value)}>
                <option value="all">Paiement</option>
                <option value="paid">Payée</option>
                <option value="pending">En attente</option>
                <option value="unpaid">Non payée</option>
              </select>
              <select className="sel" value={channelF} onChange={e => setChannelF(e.target.value)}>
                <option value="all">Canal</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="online">En ligne</option>
                <option value="manual">Manuel</option>
              </select>
              <select className="sel" value={dateF} onChange={e => setDateF(e.target.value)}>
                <option value="all">Date</option>
                <option value="today">Aujourd'hui</option>
                <option value="7d">7 derniers jours</option>
                <option value="30d">30 derniers jours</option>
              </select>
              <div className="inp" style={{ display:"flex", alignItems:"center", gap:5, color:"#98A2B3",
                fontSize:11, cursor:"default", minWidth:130, height:36, boxSizing:"border-box" }}>
                🔒 {activeShop.name}
              </div>
            </div>

            {/* table */}
            <div style={{ overflowX:"auto" }}>
              <table className="or-table">
                <thead>
                  <tr>
                    <th>Commande</th>
                    <th>Client</th>
                    <th>Boutique</th>
                    <th>Canal</th>
                    <th>Montant</th>
                    <th>Paiement</th>
                    <th>Statut</th>
                    <th>Date</th>
                    <th>Dernière action</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(o => (
                    <tr key={o.id}>
                      <td><span style={{ fontFamily:"monospace", fontWeight:600, fontSize:12 }}>{o.ref}</span></td>
                      <td>
                        <div style={{ fontWeight:600, fontSize:13 }}>{o.client}</div>
                        <div style={{ fontSize:11, color:"#98A2B3" }}>{o.phone}</div>
                      </td>
                      <td><span className="badge badge-biz" style={{ fontSize:10 }}>{activeShop.name}</span></td>
                      <td><ChannelBadge c={o.channel} /></td>
                      <td style={{ fontWeight:700 }}>{o.amount.toLocaleString("fr-FR")} FCFA</td>
                      <td><PayBadge p={o.payment} /></td>
                      <td><StatusBadge s={o.status} /></td>
                      <td style={{ fontSize:11, color:"#98A2B3" }}>{o.date}</td>
                      <td style={{ fontSize:11, color:"#667085" }}>{o.lastAction}</td>
                      <td>
                        <div className="or-act-btns">
                          <button className="or-act-btn" title="Voir">👁️</button>
                          <button className="or-act-btn" title="WhatsApp"
                            onClick={() => window.open(`https://wa.me/${o.phone.replace(/\D/g,"")}`, "_blank")}>💬</button>
                          <button className="or-act-btn" title="Modifier">✏️</button>
                          <button className="or-act-btn" title="Annuler" style={{ color:"#EF4444" }}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={10} style={{ textAlign:"center", padding:28, color:"#98A2B3" }}>
                      Aucune commande trouvée.
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* pagination */}
            <div style={{ padding:"11px 18px", display:"flex", justifyContent:"space-between",
              alignItems:"center", borderTop:"1px solid #E8ECEA", fontSize:12, color:"#98A2B3" }}>
              <span>Affichage de 1 à {filtered.length} sur {activeShop.orders} commandes</span>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <button className="btn-secondary" style={{ height:28, padding:"0 10px", fontSize:11 }}>← Précédent</button>
                {[1,2,3].map(p => (
                  <button key={p} style={{ width:28, height:28, borderRadius:8, border:"1px solid",
                    background: p===1 ? "#0A8F45" : "#fff", color: p===1 ? "#fff" : "#1F2A24",
                    borderColor: p===1 ? "#0A8F45" : "#E8ECEA", fontSize:12, cursor:"pointer" }}>{p}</button>
                ))}
                <button className="btn-secondary" style={{ height:28, padding:"0 10px", fontSize:11 }}>Suivant →</button>
                <select className="sel" style={{ height:28, fontSize:11 }}>
                  <option>10 / page</option>
                  <option>25 / page</option>
                  <option>50 / page</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right col */}
          <div className="or-right">

            {/* Boutique active */}
            <div className="or-card">
              <div style={{ fontSize:13, fontWeight:700, color:"#1F2A24", marginBottom:12 }}>Boutique active</div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                <div style={{ width:42, height:42, borderRadius:12, background:"#EAF7EF",
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🏪</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:14, color:"#1F2A24" }}>{activeShop.name}</div>
                  <span className={activeShop.isPublished ? "badge badge-green" : "badge badge-gray"} style={{ fontSize:10 }}>
                    {activeShop.isPublished ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:12 }}>
                {[
                  { l:"Commandes", v: activeShop.orders },
                  { l:"Produits",  v: activeShop.products },
                  { l:"Clients",   v: activeShop.clients },
                  { l:"Catégories", v: 12 },
                ].map(r => (
                  <div key={r.l} style={{ background:"#F8FAF9", borderRadius:8, padding:"7px 10px" }}>
                    <div style={{ fontSize:15, fontWeight:700, color:"#1F2A24" }}>{r.v}</div>
                    <div style={{ fontSize:10, color:"#98A2B3" }}>{r.l}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button className="btn-secondary" style={{ flex:1, height:32, fontSize:11 }}>Voir la boutique</button>
                <button className="btn-primary" style={{ flex:1, height:32, fontSize:11 }}
                  onClick={() => { const n = MOCK_SHOPS.find(s => s.id !== activeId); if (n) setActiveId(n.id); }}>
                  Changer
                </button>
              </div>
            </div>

            {/* Mes boutiques */}
            <div className="or-card">
              <div style={{ fontSize:13, fontWeight:700, color:"#1F2A24", marginBottom:10 }}>Mes boutiques</div>
              {MOCK_SHOPS.map((s, i) => (
                <div key={s.id} className="or-shop-row"
                  style={{ background: s.id === activeId ? "#EAF7EF" : "transparent", borderRadius:8, padding:"8px 10px", cursor:"pointer" }}
                  onClick={() => setActiveId(s.id)}>
                  <div className="or-shop-av" style={{ background: shopColors[i] }}>
                    {s.name.slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:12, color:"#1F2A24", display:"flex", alignItems:"center", gap:5 }}>
                      {s.name}
                      {s.id === activeId && <span style={{ fontSize:9, background:"#0A8F45", color:"#fff", borderRadius:4, padding:"1px 5px" }}>Actif</span>}
                    </div>
                    <div style={{ fontSize:10, color:"#98A2B3" }}>{s.orders} commandes · {s.products} produits</div>
                  </div>
                  <span className={s.isPublished ? "badge badge-green" : "badge badge-gray"} style={{ fontSize:9 }}>
                    {s.isPublished ? "Active" : "Inactif"}
                  </span>
                </div>
              ))}
            </div>

            {/* Alertes */}
            <div className="or-card">
              <div style={{ fontSize:13, fontWeight:700, color:"#1F2A24", marginBottom:10 }}>Alertes commandes</div>
              {[
                { icon:"⏳", label:"12 commandes en attente de confirmation", color:"#F08A24" },
                { icon:"💳", label:"5 paiements en attente",                  color:"#3B82F6" },
                { icon:"🚚", label:"3 livraisons en retard",                  color:"#EF4444" },
                { icon:"💬", label:"4 commandes WhatsApp à relancer",         color:"#0A8F45" },
              ].map(a => (
                <div key={a.label} className="or-alert-row">
                  <span style={{ fontSize:15 }}>{a.icon}</span>
                  <span style={{ color: a.color, fontWeight:500 }}>{a.label}</span>
                </div>
              ))}
            </div>

            {/* Répartition */}
            <div className="or-card">
              <div style={{ fontSize:13, fontWeight:700, color:"#1F2A24", marginBottom:12 }}>Répartition des commandes</div>
              <DonutChart />
            </div>

          </div>
        </div>

        {/* Bottom row */}
        <div className="or-bottom">
          <div className="or-card">
            <div style={{ fontSize:13, fontWeight:700, color:"#1F2A24", marginBottom:12 }}>Conseils de gestion</div>
            <div className="or-tips">
              {[
                { icon:"⏱️", t:"Traitez rapidement les commandes en attente", d:"Un délai rapide améliore la satisfaction client.", link:"Voir les commandes", href:"#" },
                { icon:"💳", t:"Relancez les paiements en attente",            d:"5 paiements non confirmés peuvent impacter votre trésorerie.", link:"Voir les paiements", href:"/payments" },
                { icon:"📊", t:"Surveillez les ventes par canal",              d:"WhatsApp représente 52% de vos commandes.", link:"Voir les statistiques", href:"/dashboard" },
                { icon:"🏪", t:"Analysez la performance par boutique",         d:"Comparez vos boutiques pour identifier les meilleures.", link:"Voir mes boutiques", href:"/settings" },
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
              { icon:"💬", label:"Contacter le support", href:"mailto:support@bizmanager.app" },
              { icon:"📚", label:"Documentation",         href:"#docs"  },
              { icon:"❓", label:"Aide commandes & canaux", href:"#help" },
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
            <div style={{ marginTop:8, padding:"10px 12px", background:"#EAF7EF", borderRadius:10 }}>
              <div style={{ fontSize:12, fontWeight:600, color:"#0A8F45" }}>Plan Business actif</div>
              <div style={{ fontSize:11, color:"#08763A", marginTop:2 }}>3 boutiques · Sync illimitée · Multi-canal</div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

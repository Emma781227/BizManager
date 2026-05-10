"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const WA_CSS = `
@keyframes wa-spin { to { transform: rotate(360deg); } }

.wa-page { padding: 24px 28px; max-width: 1280px; margin: 0 auto; background: #F8FAF9; min-height: 100vh; }
.wa-kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px; }
.wa-main { display: grid; grid-template-columns: 1fr 380px; gap: 20px; margin-bottom: 18px; }
.wa-bottom-left { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 18px; }
.wa-bottom-banner { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 18px; }
.wa-toolbar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 14px; }
.wa-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.wa-kpi-card { cursor: pointer; transition: box-shadow 0.15s, transform 0.12s; }
.wa-kpi-card:hover { box-shadow: 0 4px 18px rgba(10,143,69,0.12) !important; transform: translateY(-1px); }

.wa-modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 1000;
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.wa-modal {
  background: #fff; border-radius: 18px; padding: 28px; width: 100%; max-width: 480px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.18); max-height: 90vh; overflow-y: auto;
}
.wa-modal-lg { max-width: 600px; }

@media (max-width: 1100px) {
  .wa-main { grid-template-columns: 1fr; }
  .wa-kpi-row { grid-template-columns: repeat(2, 1fr); }
  .wa-bottom-banner { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .wa-page { padding: 14px 12px; }
  .wa-kpi-row { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .wa-bottom-left { grid-template-columns: 1fr; }
  .wa-bottom-banner { grid-template-columns: 1fr; }
}
@media (max-width: 480px) {
  .wa-kpi-row { grid-template-columns: repeat(2, 1fr); gap: 8px; }
}
`;

type Order = {
  id: string;
  status: string;
  paymentStatus: string;
  totalAmount: number | string;
  createdAt: string;
  customer: { fullName: string; phone: string };
  items: { quantity: number; product: { name: string } }[];
};

type Template = { label: string; preview: string; body: string };

const STATUS_LABELS: Record<string, string> = {
  new: "Nouvelle", pending: "En attente", confirmed: "Confirmée",
  in_progress: "En cours", ready: "Prête", delivered: "Livrée", cancelled: "Annulée",
};
const PAY_STATUS_LABELS: Record<string, string> = {
  unpaid: "Non payée", partial: "Partiel", paid: "Payée", refunded: "Remboursée",
};

const HISTORY = [
  { icon: "✓",  text: "Confirmation envoyée — #WA-1287",      time: "Aujourd'hui, 10:27" },
  { icon: "💰", text: "Rappel paiement envoyé — #WA-1285",     time: "Aujourd'hui, 09:14" },
  { icon: "↗",  text: "Commande ouverte dans WhatsApp — #WA-1283", time: "Hier, 17:42" },
  { icon: "📋", text: "Modèle \"Commande prête\" utilisé — #WA-1280", time: "Hier, 14:05" },
  { icon: "✅", text: "Commande #WA-1278 confirmée",           time: "Il y a 2 jours" },
];

const INITIAL_TEMPLATES: Template[] = [
  {
    label: "Confirmation de commande",
    preview: "Bonjour, votre commande a bien été enregistrée…",
    body: "Bonjour {{client}},\n\nVotre commande {{commande}} a bien été enregistrée.\nTotal : {{montant}}.\n\nMerci pour votre confiance !",
  },
  {
    label: "Rappel de paiement",
    preview: "Votre paiement de {{montant}} est en attente…",
    body: "Bonjour {{client}},\n\nVotre paiement de {{montant}} pour la commande {{commande}} est toujours en attente.\nMerci de régulariser dès que possible.",
  },
  {
    label: "Commande prête",
    preview: "Votre commande est prête à être récupérée…",
    body: "Bonjour {{client}},\n\nBonne nouvelle ! Votre commande {{commande}} ({{montant}}) est prête à être récupérée.",
  },
  {
    label: "Livraison en cours",
    preview: "Votre livraison est en route…",
    body: "Bonjour {{client}},\n\nVotre commande {{commande}} est en cours de livraison. Elle arrivera très bientôt.",
  },
  {
    label: "Merci pour votre achat",
    preview: "Merci pour votre confiance…",
    body: "Bonjour {{client}},\n\nMerci pour votre achat ! Commande {{commande}} — {{montant}}.\nNous espérons vous revoir bientôt.",
  },
];

const PAGE_SIZE = 7;

function formatAmount(v: number | string): string {
  return Intl.NumberFormat("fr-FR").format(Number(v)) + " FCFA";
}
function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}
function shortRef(id: string): string {
  return "#WA-" + id.slice(-4).toUpperCase();
}
function applyTemplate(body: string, order: Order): string {
  return body
    .replace(/\{\{client\}\}/g, order.customer.fullName)
    .replace(/\{\{commande\}\}/g, shortRef(order.id))
    .replace(/\{\{montant\}\}/g, formatAmount(order.totalAmount));
}
function statusBadge(status: string) {
  switch (status) {
    case "confirmed":   return { background: "#E8F0FF", color: "#3B82F6" };
    case "delivered":   return { background: "#DDF6E7", color: "#0A8F45" };
    case "cancelled":   return { background: "#FDE8E8", color: "#EF4444" };
    default:            return { background: "#FFF1E5", color: "#F08A24" };
  }
}
function payBadge(p: string) {
  if (p === "paid")    return { background: "#DDF6E7", color: "#0A8F45" };
  if (p === "unpaid")  return { background: "#FDE8E8", color: "#EF4444" };
  return { background: "#FFF1E5", color: "#F08A24" };
}

// ─── Modal helpers ───────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", border: "1.5px solid #E8ECEA",
  borderRadius: 10, padding: "9px 12px", fontSize: 13, color: "#1F2A24",
  outline: "none", background: "#F8FAF9",
};
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "#667085", display: "block", marginBottom: 5,
};
const btnPrimary: React.CSSProperties = {
  background: "#0A8F45", color: "#fff", border: "none", borderRadius: 10,
  padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", width: "100%",
};
const btnSecondary: React.CSSProperties = {
  background: "#F8FAF9", border: "1.5px solid #E8ECEA", color: "#1F2A24",
  borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer", width: "100%",
};

export default function WhatsAppPage() {
  // ── Data
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<Template[]>(INITIAL_TEMPLATES);

  // ── Filters
  const [orderSearch, setOrderSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [relanceFilter, setRelanceFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // ── Selection & preview
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewMsg, setPreviewMsg] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [copyOk, setCopyOk] = useState(false);
  const [copyRefId, setCopyRefId] = useState<string | null>(null);

  // ── Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // ── Relance tracking
  const [relancedIds, setRelancedIds] = useState<Set<string>>(new Set());

  // ── Modals
  const [newMsgOpen, setNewMsgOpen] = useState(false);
  const [newMsgOrderId, setNewMsgOrderId] = useState("");
  const [newMsgText, setNewMsgText] = useState("");
  const [newMsgUrl, setNewMsgUrl] = useState("");
  const [newMsgLoading, setNewMsgLoading] = useState(false);

  const [createTplOpen, setCreateTplOpen] = useState(false);
  const [tplTitle, setTplTitle] = useState("");
  const [tplType, setTplType] = useState("confirmation");
  const [tplContent, setTplContent] = useState("");

  const [configRelanceOpen, setConfigRelanceOpen] = useState(false);
  const [relDelay, setRelDelay] = useState("2h");
  const [relClientType, setRelClientType] = useState("all");
  const [relFreq, setRelFreq] = useState("1");

  const [tplAllOpen, setTplAllOpen] = useState(false);
  const [relAllOpen, setRelAllOpen] = useState(false);

  // ── Refs for scroll targets
  const tableRef = useRef<HTMLDivElement>(null);
  const relanceRef = useRef<HTMLDivElement>(null);

  // ── Init
  useEffect(() => { void loadOrders(); }, []);
  useEffect(() => { setCurrentPage(1); }, [orderSearch, statusFilter, relanceFilter, dateFilter]);

  async function loadOrders() {
    setLoading(true);
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      const d = await res.json();
      setOrders(Array.isArray(d) ? d : (d.orders ?? d.data ?? []));
    } finally {
      setLoading(false);
    }
  }

  async function generatePreview(orderId: string): Promise<string> {
    setPreviewLoading(true);
    try {
      const res = await fetch("/api/whatsapp/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      if (!res.ok) return "";
      const data = await res.json();
      const msg = data.message ?? "";
      const url = data.whatsappUrl ?? "";
      setPreviewMsg(msg);
      setWhatsappUrl(url);
      return url;
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleSelectOrder(order: Order) {
    setSelectedOrder(order);
    setPreviewMsg("");
    setWhatsappUrl("");
    await generatePreview(order.id);
  }

  async function handleOpenWA() {
    if (!selectedOrder) return;
    const url = whatsappUrl || await generatePreview(selectedOrder.id);
    if (url) window.open(url, "_blank");
  }

  function handleCopy() {
    if (!previewMsg) return;
    void navigator.clipboard.writeText(previewMsg).then(() => {
      setCopyOk(true);
      setTimeout(() => setCopyOk(false), 2000);
    });
  }

  function handleCopyRef(id: string) {
    void navigator.clipboard.writeText(shortRef(id)).then(() => {
      setCopyRefId(id);
      setTimeout(() => setCopyRefId(null), 2000);
    });
  }

  function handleUseTemplate(tpl: Template) {
    if (!selectedOrder) {
      alert("Sélectionnez d'abord une commande dans le tableau.");
      return;
    }
    const filled = applyTemplate(tpl.body, selectedOrder);
    setPreviewMsg(filled);
    const phone = selectedOrder.customer.phone.replace(/[^\d+]/g, "").replace(/^00/, "");
    if (phone) setWhatsappUrl(`https://wa.me/${phone}?text=${encodeURIComponent(filled)}`);
  }

  function handleMarkRelanced(orderId: string) {
    setRelancedIds((prev) => new Set([...prev, orderId]));
  }

  async function handleRelancer(order: Order) {
    setSelectedOrder(order);
    handleMarkRelanced(order.id);
    const url = await generatePreview(order.id);
    if (url) window.open(url, "_blank");
  }

  async function handleNewMsgGenerate() {
    if (!newMsgOrderId) return;
    setNewMsgLoading(true);
    try {
      const res = await fetch("/api/whatsapp/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: newMsgOrderId }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setNewMsgText(data.message ?? "");
      setNewMsgUrl(data.whatsappUrl ?? "");
    } finally {
      setNewMsgLoading(false);
    }
  }

  function handleSaveTemplate() {
    if (!tplTitle.trim() || !tplContent.trim()) return;
    setTemplates((prev) => [...prev, { label: tplTitle, preview: tplContent.slice(0, 50) + "…", body: tplContent }]);
    setTplTitle(""); setTplType("confirmation"); setTplContent("");
    setCreateTplOpen(false);
  }

  // ── Computed
  const relanceOrders = useMemo(() =>
    orders
      .filter((o) => o.status !== "delivered" && o.status !== "cancelled")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    let list = orders;

    // Status filter
    if (statusFilter !== "all") list = list.filter((o) => o.status === statusFilter);

    // Relance filter
    if (relanceFilter === "a_relancer")
      list = list.filter((o) => relanceOrders.some((r) => r.id === o.id) && !relancedIds.has(o.id));
    else if (relanceFilter === "deja_relance")
      list = list.filter((o) => relancedIds.has(o.id));
    else if (relanceFilter === "sans_reponse")
      list = list.filter((o) => o.status === "new");
    else if (relanceFilter === "relance_reussie")
      list = list.filter((o) => o.status === "confirmed" || o.status === "delivered");

    // Date filter
    if (dateFilter !== "all") {
      const now = Date.now();
      const ms = dateFilter === "today" ? 86400000 : dateFilter === "7d" ? 7 * 86400000 : 30 * 86400000;
      list = list.filter((o) => now - new Date(o.createdAt).getTime() <= ms);
    }

    // Search
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      list = list.filter(
        (o) =>
          o.customer.fullName.toLowerCase().includes(q) ||
          o.customer.phone.includes(q) ||
          shortRef(o.id).toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, statusFilter, relanceFilter, dateFilter, orderSearch, relancedIds, relanceOrders]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const totalCA = orders.reduce((s, o) => s + Number(o.totalAmount), 0);

  const pageNumbers = useMemo(() => {
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    const end = Math.min(totalPages, start + 4);
    const nums: number[] = [];
    for (let i = start; i <= end; i++) nums.push(i);
    return nums;
  }, [currentPage, totalPages]);

  // ── KPI click handlers
  function onKpiCommandes() {
    setStatusFilter("all"); setRelanceFilter("all"); setDateFilter("all"); setOrderSearch("");
    setTimeout(() => tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }
  function onKpiRelance() {
    setRelanceFilter("a_relancer");
    setTimeout(() => relanceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  // ── Loading
  if (loading) {
    return (
      <>
        <style>{WA_CSS}</style>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16, background: "#F8FAF9" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #E8ECEA", borderTopColor: "#0A8F45", borderRadius: "50%", animation: "wa-spin 0.8s linear infinite" }} />
          <p style={{ fontSize: 14, color: "#667085" }}>Chargement du Centre WhatsApp…</p>
        </div>
      </>
    );
  }

  // ── Render
  return (
    <>
      <style>{WA_CSS}</style>
      <div className="wa-page">

        {/* ── MODALS ─────────────────────────────────────────── */}

        {/* Modal: Nouveau message */}
        {newMsgOpen && (
          <div className="wa-modal-overlay" onClick={() => setNewMsgOpen(false)}>
            <div className="wa-modal" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1F2A24", margin: 0 }}>Nouveau message WhatsApp</h2>
                <button onClick={() => setNewMsgOpen(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#98A2B3", lineHeight: 1 }}>×</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={labelStyle}>Choisir une commande</label>
                  <select value={newMsgOrderId} onChange={(e) => setNewMsgOrderId(e.target.value)} style={inputStyle}>
                    <option value="">— Sélectionner une commande —</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {shortRef(o.id)} — {o.customer.fullName} ({formatAmount(o.totalAmount)})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleNewMsgGenerate}
                  disabled={!newMsgOrderId || newMsgLoading}
                  style={{ ...btnSecondary, width: "auto", padding: "8px 16px", opacity: (!newMsgOrderId || newMsgLoading) ? 0.5 : 1 }}
                >
                  {newMsgLoading ? "Génération…" : "Générer le message"}
                </button>
                {newMsgText && (
                  <div>
                    <label style={labelStyle}>Message à envoyer</label>
                    <textarea
                      value={newMsgText}
                      onChange={(e) => setNewMsgText(e.target.value)}
                      rows={7}
                      style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }}
                    />
                  </div>
                )}
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    disabled={!newMsgUrl}
                    onClick={() => { window.open(newMsgUrl, "_blank"); setNewMsgOpen(false); }}
                    style={{ ...btnPrimary, opacity: !newMsgUrl ? 0.5 : 1 }}
                  >
                    Ouvrir dans WhatsApp ↗
                  </button>
                  <button onClick={() => setNewMsgOpen(false)} style={{ ...btnSecondary }}>Annuler</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Créer un modèle */}
        {createTplOpen && (
          <div className="wa-modal-overlay" onClick={() => setCreateTplOpen(false)}>
            <div className="wa-modal" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1F2A24", margin: 0 }}>Créer un modèle</h2>
                <button onClick={() => setCreateTplOpen(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#98A2B3" }}>×</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={labelStyle}>Titre du modèle</label>
                  <input value={tplTitle} onChange={(e) => setTplTitle(e.target.value)} placeholder="Ex: Relance 24h" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Type de message</label>
                  <select value={tplType} onChange={(e) => setTplType(e.target.value)} style={inputStyle}>
                    <option value="confirmation">Confirmation de commande</option>
                    <option value="rappel">Rappel de paiement</option>
                    <option value="relance">Relance client</option>
                    <option value="livraison">Livraison</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Contenu du message</label>
                  <textarea
                    value={tplContent}
                    onChange={(e) => setTplContent(e.target.value)}
                    placeholder={"Bonjour {{client}},\n\nVotre commande {{commande}} d'un montant de {{montant}} est…"}
                    rows={7}
                    style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }}
                  />
                  <p style={{ fontSize: 11, color: "#98A2B3", marginTop: 5 }}>
                    Variables disponibles : <code>{"{{client}}"}</code> <code>{"{{commande}}"}</code> <code>{"{{montant}}"}</code>
                  </p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={handleSaveTemplate} disabled={!tplTitle.trim() || !tplContent.trim()} style={{ ...btnPrimary, opacity: (!tplTitle.trim() || !tplContent.trim()) ? 0.5 : 1 }}>
                    Enregistrer le modèle
                  </button>
                  <button onClick={() => setCreateTplOpen(false)} style={{ ...btnSecondary }}>Annuler</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Configurer les relances */}
        {configRelanceOpen && (
          <div className="wa-modal-overlay" onClick={() => setConfigRelanceOpen(false)}>
            <div className="wa-modal" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1F2A24", margin: 0 }}>Configurer les relances automatiques</h2>
                <button onClick={() => setConfigRelanceOpen(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#98A2B3" }}>×</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={labelStyle}>Délai avant première relance</label>
                  <select value={relDelay} onChange={(e) => setRelDelay(e.target.value)} style={inputStyle}>
                    <option value="1h">1 heure</option>
                    <option value="2h">2 heures</option>
                    <option value="6h">6 heures</option>
                    <option value="12h">12 heures</option>
                    <option value="24h">24 heures</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Type de client à relancer</label>
                  <select value={relClientType} onChange={(e) => setRelClientType(e.target.value)} style={inputStyle}>
                    <option value="all">Tous</option>
                    <option value="unpaid">Paiement en attente</option>
                    <option value="no_reply">Sans réponse depuis 24h</option>
                    <option value="unconfirmed">Commande non confirmée</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Modèle de message à utiliser</label>
                  <select style={inputStyle}>
                    {templates.map((t, i) => <option key={i} value={t.label}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Fréquence maximale</label>
                  <select value={relFreq} onChange={(e) => setRelFreq(e.target.value)} style={inputStyle}>
                    <option value="1">1 fois</option>
                    <option value="2">2 fois max</option>
                    <option value="3">3 fois max</option>
                  </select>
                </div>
                <div style={{ background: "#EAF7EF", border: "1px solid #C3E6D3", borderRadius: 10, padding: "10px 12px" }}>
                  <p style={{ fontSize: 12, color: "#0A8F45", margin: 0 }}>
                    Les relances seront déclenchées {relDelay} après la création de la commande, {relFreq} fois au maximum.
                  </p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setConfigRelanceOpen(false)} style={btnPrimary}>Enregistrer la configuration</button>
                  <button onClick={() => setConfigRelanceOpen(false)} style={btnSecondary}>Annuler</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Voir tous les modèles */}
        {tplAllOpen && (
          <div className="wa-modal-overlay" onClick={() => setTplAllOpen(false)}>
            <div className="wa-modal wa-modal-lg" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1F2A24", margin: 0 }}>Tous les modèles ({templates.length})</h2>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => { setTplAllOpen(false); setCreateTplOpen(true); }} style={{ ...btnSecondary, width: "auto", padding: "7px 14px", fontSize: 12 }}>
                    + Créer un modèle
                  </button>
                  <button onClick={() => setTplAllOpen(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#98A2B3" }}>×</button>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {templates.map((tpl, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: i < templates.length - 1 ? "1px solid #E8ECEA" : "none", alignItems: "flex-start" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#EAF7EF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>📝</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#1F2A24", margin: "0 0 3px" }}>{tpl.label}</p>
                      <p style={{ fontSize: 12, color: "#667085", margin: 0, whiteSpace: "pre-wrap" }}>{tpl.body}</p>
                    </div>
                    <button onClick={() => { handleUseTemplate(tpl); setTplAllOpen(false); }}
                      style={{ background: "#EAF7EF", color: "#0A8F45", border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                      Utiliser
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Voir toutes les relances */}
        {relAllOpen && (
          <div className="wa-modal-overlay" onClick={() => setRelAllOpen(false)}>
            <div className="wa-modal wa-modal-lg" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1F2A24", margin: 0 }}>Clients à relancer ({relanceOrders.length})</h2>
                <button onClick={() => setRelAllOpen(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#98A2B3" }}>×</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {relanceOrders.map((order) => {
                  let motif = "Commande non confirmée";
                  if (order.paymentStatus === "unpaid") motif = "Paiement en attente";
                  else if (order.status === "new") motif = "Pas de réponse";
                  const isRelanced = relancedIds.has(order.id);
                  return (
                    <div key={order.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #E8ECEA" }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#DDF6E7", color: "#0A8F45", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                        {order.customer.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#1F2A24", margin: 0 }}>{order.customer.fullName}</p>
                        <p style={{ fontSize: 11, color: "#F08A24", margin: "1px 0 0" }}>{motif} · {shortRef(order.id)}</p>
                      </div>
                      <span style={{ fontSize: 12, color: "#1F2A24", fontWeight: 600 }}>{formatAmount(order.totalAmount)}</span>
                      {isRelanced ? (
                        <span style={{ fontSize: 11, color: "#0A8F45", fontWeight: 600, background: "#DDF6E7", borderRadius: 20, padding: "3px 10px" }}>Relancé ✓</span>
                      ) : (
                        <button onClick={() => { handleRelancer(order); }} style={{ background: "#DDF6E7", color: "#0A8F45", fontSize: 11, borderRadius: 8, padding: "5px 10px", border: "none", cursor: "pointer", fontWeight: 600 }}>
                          Relancer
                        </button>
                      )}
                    </div>
                  );
                })}
                {relanceOrders.length === 0 && <p style={{ color: "#98A2B3", textAlign: "center", padding: "20px 0" }}>Aucun client à relancer</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── A — Titre ─────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1F2A24", margin: 0 }}>Centre WhatsApp</h1>
            <p style={{ fontSize: 13, color: "#667085", margin: "4px 0 0" }}>
              Gérez vos commandes WhatsApp, vos relances et vos messages clients.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setCreateTplOpen(true)}
              style={{ border: "1.5px solid #E8ECEA", background: "#fff", color: "#1F2A24", padding: "9px 16px", borderRadius: 10, fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
              Créer un modèle
            </button>
            <button onClick={() => { setNewMsgOrderId(""); setNewMsgText(""); setNewMsgUrl(""); setNewMsgOpen(true); }}
              style={{ background: "#0A8F45", color: "#fff", border: "none", padding: "9px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Nouveau message
            </button>
          </div>
        </div>

        {/* ── B — KPI row ───────────────────────────────────── */}
        <div className="wa-kpi-row">
          {[
            { label: "Commandes WhatsApp", value: String(orders.length), variation: "+18,3%", vc: "#0A8F45", sub: "vs 30 derniers jours", onClick: onKpiCommandes, tip: "Voir toutes les commandes" },
            { label: "CA via WhatsApp",    value: formatAmount(totalCA), variation: "+22,7%", vc: "#0A8F45", sub: "vs 30 derniers jours", onClick: undefined, tip: undefined },
            { label: "Clients à relancer", value: String(relanceOrders.filter((o) => !relancedIds.has(o.id)).length), variation: "7 nouveaux", vc: "#F08A24", sub: "vs 30 derniers jours", onClick: onKpiRelance, tip: "Voir les relances" },
            { label: "Temps de réponse",   value: "8 min",              variation: "-2 min",  vc: "#0A8F45", sub: "vs 30 derniers jours", onClick: undefined, tip: undefined },
          ].map((kpi) => (
            <div key={kpi.label} className="wa-kpi-card"
              title={kpi.tip}
              onClick={kpi.onClick}
              style={{ background: "#fff", border: "1.5px solid #E8ECEA", borderRadius: 16, padding: "18px 20px", position: "relative", overflow: "hidden", boxShadow: "0 2px 10px rgba(16,24,40,0.04)", userSelect: "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div>
                  <p style={{ fontSize: 11, textTransform: "uppercase", color: "#667085", margin: "0 0 6px", letterSpacing: "0.04em" }}>{kpi.label}</p>
                  <p style={{ fontSize: 28, fontWeight: 700, color: "#1F2A24", margin: "0 0 4px", lineHeight: 1.1 }}>{kpi.value}</p>
                  <p style={{ fontSize: 11, color: "#98A2B3", margin: 0 }}>{kpi.sub}</p>
                </div>
                <span style={{ background: kpi.vc + "22", color: kpi.vc, fontSize: 11, fontWeight: 700, borderRadius: 20, padding: "3px 8px", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {kpi.variation}
                </span>
              </div>
              {kpi.onClick && (
                <div style={{ position: "absolute", top: 8, right: 8, fontSize: 10, color: "#98A2B3" }}>↗</div>
              )}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: kpi.vc, opacity: 0.3 }} />
            </div>
          ))}
        </div>

        {/* ── C — Bandeau info ──────────────────────────────── */}
        <div style={{ background: "#EAF7EF", border: "1.5px solid #C3E6D3", borderRadius: 12, padding: "10px 16px", marginBottom: 16, display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#DDF6E7", display: "flex", alignItems: "center", justifyContent: "center", color: "#0A8F45", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>ℹ</span>
          <p style={{ fontSize: 13, color: "#1F2A24", margin: 0 }}>
            Les commandes WhatsApp sont enregistrées dans BizManager avant l&apos;ouverture de la conversation.
          </p>
        </div>

        {/* ── D — Main 2-col ────────────────────────────────── */}
        <div className="wa-main">

          {/* D.1 — Colonne gauche */}
          <div>
            {/* Table card */}
            <div ref={tableRef} style={{ background: "#fff", border: "1.5px solid #E8ECEA", borderRadius: 18, padding: 20, boxShadow: "0 2px 10px rgba(16,24,40,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#1F2A24" }}>Suivi des commandes WhatsApp</span>
                <span style={{ background: "#DDF6E7", color: "#0A8F45", fontSize: 11, borderRadius: 20, padding: "3px 10px", fontWeight: 600 }}>
                  {orders.length} commandes
                </span>
              </div>

              {/* Toolbar */}
              <div className="wa-toolbar">
                <input
                  type="text"
                  placeholder="Rechercher par référence, client ou téléphone…"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  style={{ flex: 1, minWidth: 160, border: "1.5px solid #E8ECEA", borderRadius: 10, padding: "8px 12px", fontSize: 13, color: "#1F2A24", outline: "none", background: "#F8FAF9" }}
                />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ width: 120, border: "1.5px solid #E8ECEA", borderRadius: 10, padding: "8px 10px", fontSize: 13, color: "#1F2A24", outline: "none", background: "#F8FAF9", cursor: "pointer" }}>
                  <option value="all">Tous statuts</option>
                  <option value="new">Nouvelle</option>
                  <option value="pending">En attente</option>
                  <option value="confirmed">Confirmée</option>
                  <option value="in_progress">En cours</option>
                  <option value="ready">Prête</option>
                  <option value="delivered">Livrée</option>
                  <option value="cancelled">Annulée</option>
                </select>
                <select value={relanceFilter} onChange={(e) => setRelanceFilter(e.target.value)}
                  style={{ width: 130, border: "1.5px solid #E8ECEA", borderRadius: 10, padding: "8px 10px", fontSize: 13, color: "#1F2A24", outline: "none", background: "#F8FAF9", cursor: "pointer" }}>
                  <option value="all">Toutes relances</option>
                  <option value="a_relancer">À relancer</option>
                  <option value="deja_relance">Déjà relancé</option>
                  <option value="sans_reponse">Sans réponse</option>
                  <option value="relance_reussie">Relance réussie</option>
                </select>
                <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
                  style={{ width: 120, border: "1.5px solid #E8ECEA", borderRadius: 10, padding: "8px 10px", fontSize: 13, color: "#1F2A24", outline: "none", background: "#F8FAF9", cursor: "pointer" }}>
                  <option value="all">Toutes dates</option>
                  <option value="today">Aujourd&apos;hui</option>
                  <option value="7d">7 derniers jours</option>
                  <option value="30d">30 derniers jours</option>
                </select>
                <span style={{ fontSize: 12, color: "#98A2B3", whiteSpace: "nowrap" }}>{filteredOrders.length} résultat(s)</span>
              </div>

              {/* Table */}
              <div className="wa-table-wrap">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 680 }}>
                  <thead>
                    <tr style={{ background: "#F8FAF9" }}>
                      {["Référence", "Client", "Montant", "Statut", "Paiement", "Date", "Actions"].map((col) => (
                        <th key={col} style={{ padding: "10px 10px", textAlign: "left", fontSize: 11, textTransform: "uppercase", color: "#667085", fontWeight: 600, borderBottom: "1.5px solid #E8ECEA", whiteSpace: "nowrap" }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOrders.length === 0 ? (
                      <tr><td colSpan={7} style={{ padding: "32px 12px", textAlign: "center", color: "#98A2B3", fontSize: 13 }}>Aucune commande trouvée</td></tr>
                    ) : (
                      paginatedOrders.map((order, idx) => {
                        const isSelected = selectedOrder?.id === order.id;
                        const isRelanced = relancedIds.has(order.id);
                        const sBadge = statusBadge(order.status);
                        const pBadge = payBadge(order.paymentStatus);
                        return (
                          <tr key={order.id} onClick={() => handleSelectOrder(order)}
                            style={{ background: isSelected ? "#EAF7EF" : idx % 2 === 0 ? "#fff" : "#FAFCFB", borderLeft: isSelected ? "3px solid #0A8F45" : "3px solid transparent", cursor: "pointer", transition: "background 0.12s" }}>
                            <td style={{ padding: "10px 10px" }}>
                              <div style={{ fontWeight: 700, color: "#1F2A24", fontSize: 13 }}>{shortRef(order.id)}</div>
                              <div style={{ fontSize: 11, color: "#98A2B3" }}>{order.customer.fullName}</div>
                              {isRelanced && <div style={{ fontSize: 10, color: "#0A8F45", fontWeight: 600 }}>Relancé ✓</div>}
                            </td>
                            <td style={{ padding: "10px 10px" }}>
                              <div style={{ fontWeight: 600, color: "#1F2A24" }}>{order.customer.fullName}</div>
                              <div style={{ fontSize: 11, color: "#98A2B3" }}>{order.customer.phone}</div>
                            </td>
                            <td style={{ padding: "10px 10px", fontWeight: 600, color: "#1F2A24", whiteSpace: "nowrap" }}>{formatAmount(order.totalAmount)}</td>
                            <td style={{ padding: "10px 10px" }}>
                              <span style={{ ...sBadge, borderRadius: 20, padding: "3px 8px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                                {STATUS_LABELS[order.status] ?? order.status}
                              </span>
                            </td>
                            <td style={{ padding: "10px 10px" }}>
                              <span style={{ ...pBadge, borderRadius: 20, padding: "3px 8px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                                {PAY_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
                              </span>
                            </td>
                            <td style={{ padding: "10px 10px", fontSize: 12, color: "#98A2B3", whiteSpace: "nowrap" }}>{formatDate(order.createdAt)}</td>
                            <td style={{ padding: "10px 10px" }}>
                              <div style={{ display: "flex", gap: 4 }}>
                                {/* WA — ouvre la conversation */}
                                <button title="Ouvrir WhatsApp" onClick={async (e) => {
                                  e.stopPropagation();
                                  setSelectedOrder(order);
                                  const url = await generatePreview(order.id);
                                  if (url) window.open(url, "_blank");
                                }} style={{ borderRadius: 7, padding: "5px 7px", border: "1.5px solid #E8ECEA", background: "#DDF6E7", color: "#0A8F45", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>WA</button>
                                {/* Copier référence */}
                                <button title="Copier la référence" onClick={(e) => { e.stopPropagation(); handleCopyRef(order.id); }}
                                  style={{ borderRadius: 7, padding: "5px 7px", border: "1.5px solid #E8ECEA", background: "#F8FAF9", color: copyRefId === order.id ? "#0A8F45" : "#667085", cursor: "pointer", fontSize: 11 }}>
                                  {copyRefId === order.id ? "✓" : "⎘"}
                                </button>
                                {/* Voir détail */}
                                <button title="Voir le détail" onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                                  style={{ borderRadius: 7, padding: "5px 7px", border: "1.5px solid #E8ECEA", background: "#F8FAF9", color: "#667085", cursor: "pointer", fontSize: 11 }}>👁</button>
                                {/* Relancer */}
                                <button title="Relancer le client" onClick={(e) => { e.stopPropagation(); handleRelancer(order); }}
                                  style={{ borderRadius: 7, padding: "5px 7px", border: "1.5px solid #E8ECEA", background: isRelanced ? "#DDF6E7" : "#F8FAF9", color: isRelanced ? "#0A8F45" : "#667085", cursor: "pointer", fontSize: 11 }}>
                                  {isRelanced ? "✓" : "↺"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div style={{ borderTop: "1.5px solid #E8ECEA", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontSize: 12, color: "#98A2B3" }}>
                  Affichage de {filteredOrders.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} à {Math.min(currentPage * PAGE_SIZE, filteredOrders.length)} sur {filteredOrders.length} commandes
                </span>
                <div style={{ display: "flex", gap: 4 }}>
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    style={{ height: 32, minWidth: 32, border: "1.5px solid #E8ECEA", borderRadius: 8, background: "#fff", color: "#667085", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.4 : 1, fontSize: 14 }}>‹</button>
                  {pageNumbers.map((n) => (
                    <button key={n} onClick={() => setCurrentPage(n)}
                      style={{ height: 32, minWidth: 32, border: "1.5px solid #E8ECEA", borderRadius: 8, background: currentPage === n ? "#DDF6E7" : "#fff", color: currentPage === n ? "#0A8F45" : "#667085", cursor: "pointer", fontSize: 13, fontWeight: currentPage === n ? 700 : 400 }}>
                      {n}
                    </button>
                  ))}
                  <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    style={{ height: 32, minWidth: 32, border: "1.5px solid #E8ECEA", borderRadius: 8, background: "#fff", color: "#667085", cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.4 : 1, fontSize: 14 }}>›</button>
                </div>
              </div>
            </div>

            {/* Bottom 2 sub-cards */}
            <div className="wa-bottom-left">

              {/* Clients à relancer */}
              <div ref={relanceRef} style={{ background: "#fff", border: "1.5px solid #E8ECEA", borderRadius: 18, padding: 20, boxShadow: "0 2px 10px rgba(16,24,40,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1F2A24" }}>Clients à relancer</span>
                  <button onClick={() => setRelAllOpen(true)} style={{ fontSize: 12, color: "#0A8F45", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}>
                    Voir tout
                  </button>
                </div>
                {relanceOrders.filter((o) => !relancedIds.has(o.id)).length === 0 ? (
                  <p style={{ fontSize: 13, color: "#98A2B3", textAlign: "center", padding: "16px 0" }}>Aucun client à relancer</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {relanceOrders.filter((o) => !relancedIds.has(o.id)).slice(0, 4).map((order) => {
                      let motif = "Commande non confirmée";
                      if (order.paymentStatus === "unpaid") motif = "Paiement en attente";
                      else if (order.status === "new") motif = "Pas de réponse";
                      return (
                        <div key={order.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#DDF6E7", color: "#0A8F45", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                            {order.customer.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "#1F2A24", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{order.customer.fullName}</p>
                            <p style={{ fontSize: 11, color: "#F08A24", margin: 0 }}>{motif}</p>
                          </div>
                          <div style={{ display: "flex", gap: 5 }}>
                            <button onClick={() => handleRelancer(order)}
                              style={{ background: "#DDF6E7", color: "#0A8F45", fontSize: 11, borderRadius: 8, padding: "4px 8px", border: "none", cursor: "pointer", fontWeight: 600 }}>
                              Relancer
                            </button>
                            <button onClick={() => handleMarkRelanced(order.id)} title="Marquer comme relancé"
                              style={{ background: "#F8FAF9", color: "#98A2B3", fontSize: 11, borderRadius: 8, padding: "4px 7px", border: "1.5px solid #E8ECEA", cursor: "pointer" }}>
                              ✓
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Historique des actions */}
              <div style={{ background: "#fff", border: "1.5px solid #E8ECEA", borderRadius: 18, padding: 20, boxShadow: "0 2px 10px rgba(16,24,40,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1F2A24" }}>Historique des actions</span>
                  <span style={{ fontSize: 12, color: "#0A8F45", cursor: "default" }}>Voir tout</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {HISTORY.map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#DDF6E7", color: "#0A8F45", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>
                        {item.icon}
                      </div>
                      <span style={{ fontSize: 12, color: "#1F2A24", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.text}</span>
                      <span style={{ fontSize: 11, color: "#98A2B3", flexShrink: 0 }}>{item.time}</span>
                    </div>
                  ))}
                </div>
                <button style={{ background: "none", border: "none", marginTop: 12, color: "#0A8F45", fontSize: 13, cursor: "pointer", padding: 0, fontWeight: 500 }}>
                  Voir tout l&apos;historique →
                </button>
              </div>
            </div>
          </div>

          {/* D.2 — Colonne droite */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Commande sélectionnée */}
            <div style={{ background: "#fff", border: "1.5px solid #E8ECEA", borderRadius: 18, padding: 20, boxShadow: "0 2px 10px rgba(16,24,40,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1F2A24" }}>Commande sélectionnée</span>
                {selectedOrder && (
                  <span style={{ ...statusBadge(selectedOrder.status), borderRadius: 20, padding: "3px 8px", fontSize: 11, fontWeight: 600 }}>
                    {STATUS_LABELS[selectedOrder.status] ?? selectedOrder.status}
                  </span>
                )}
              </div>
              {!selectedOrder ? (
                <div style={{ minHeight: 160, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10 }}>
                  <span style={{ fontSize: 36 }}>📋</span>
                  <p style={{ fontSize: 13, color: "#98A2B3", textAlign: "center", margin: 0 }}>Cliquez sur une commande dans le tableau</p>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, alignItems: "center" }}>
                    <span style={{ fontWeight: 700, color: "#0A8F45", fontSize: 14 }}>{shortRef(selectedOrder.id)}</span>
                    <span style={{ fontSize: 12, color: "#98A2B3" }}>{formatDate(selectedOrder.createdAt)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#DDF6E7", color: "#0A8F45", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                      {selectedOrder.customer.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#1F2A24", margin: 0 }}>{selectedOrder.customer.fullName}</p>
                      <p style={{ fontSize: 11, color: "#98A2B3", margin: 0 }}>{selectedOrder.customer.phone}</p>
                    </div>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    {selectedOrder.items.slice(0, 3).map((item, i) => (
                      <p key={i} style={{ fontSize: 12, color: "#667085", margin: "2px 0" }}>• {item.quantity}x {item.product.name}</p>
                    ))}
                    {selectedOrder.items.length > 3 && <p style={{ fontSize: 11, color: "#98A2B3", margin: "2px 0" }}>+{selectedOrder.items.length - 3} autre(s)…</p>}
                  </div>
                  <p style={{ fontWeight: 700, fontSize: 15, color: "#1F2A24", margin: "10px 0 0" }}>Total : {formatAmount(selectedOrder.totalAmount)}</p>

                  {previewMsg && (
                    <div style={{ background: "#F8FAF9", border: "1px solid #E8ECEA", borderRadius: 10, padding: "10px 12px", margin: "12px 0", fontSize: 12, color: "#667085", whiteSpace: "pre-wrap", maxHeight: 100, overflowY: "auto" }}>
                      {previewMsg}
                    </div>
                  )}

                  <hr style={{ border: "none", borderTop: "1px solid #E8ECEA", margin: "12px 0" }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <button disabled={previewLoading} onClick={handleOpenWA}
                      style={{ width: "100%", background: "#0A8F45", color: "#fff", border: "none", height: 40, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: previewLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: previewLoading ? 0.7 : 1 }}>
                      {previewLoading ? (
                        <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "wa-spin 0.8s linear infinite", display: "inline-block" }} />Chargement…</>
                      ) : "Ouvrir WhatsApp ↗"}
                    </button>
                    <button onClick={handleCopy}
                      style={{ width: "100%", background: "#F8FAF9", border: "1.5px solid #E8ECEA", color: copyOk ? "#0A8F45" : "#1F2A24", height: 40, borderRadius: 10, fontSize: 13, cursor: "pointer", fontWeight: copyOk ? 600 : 400 }}>
                      {copyOk ? "Copié ✓" : "Copier le message"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Messages modèles */}
            <div style={{ background: "#fff", border: "1.5px solid #E8ECEA", borderRadius: 18, padding: 20, boxShadow: "0 2px 10px rgba(16,24,40,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1F2A24" }}>Messages modèles</span>
                <button onClick={() => setTplAllOpen(true)} style={{ fontSize: 12, color: "#0A8F45", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}>Voir tout</button>
              </div>
              <div>
                {templates.slice(0, 5).map((tpl, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, paddingTop: 8, paddingBottom: 8, borderBottom: i < Math.min(templates.length, 5) - 1 ? "1px solid #E8ECEA" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#EAF7EF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>📝</div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: "#1F2A24", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tpl.label}</p>
                        <p style={{ fontSize: 11, color: "#98A2B3", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tpl.preview}</p>
                      </div>
                    </div>
                    <button onClick={() => handleUseTemplate(tpl)}
                      style={{ background: "#EAF7EF", color: "#0A8F45", border: "none", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                      Utiliser
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance du canal */}
            <div style={{ background: "#fff", border: "1.5px solid #E8ECEA", borderRadius: 18, padding: 20, boxShadow: "0 2px 10px rgba(16,24,40,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1F2A24" }}>Performance du canal</span>
                <span style={{ fontSize: 11, color: "#98A2B3" }}>30 derniers jours</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { label: "Part des commandes WhatsApp", value: "52,6%", width: "53%" },
                  { label: "Taux de conversion", value: "18,4%", width: "18%" },
                  { label: "Relances réussies", value: "61%", width: "61%" },
                ].map((m) => (
                  <div key={m.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "#667085" }}>{m.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#1F2A24" }}>{m.value}</span>
                    </div>
                    <div style={{ height: 4, background: "#E8ECEA", borderRadius: 4 }}>
                      <div style={{ height: "100%", width: m.width, background: "#0A8F45", borderRadius: 4, transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conseils */}
            <div style={{ background: "#fff", border: "1.5px solid #E8ECEA", borderRadius: 18, padding: 18, boxShadow: "0 2px 10px rgba(16,24,40,0.04)" }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1F2A24", margin: "0 0 10px" }}>Conseils</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, color: "#667085", margin: 0 }}>💡 Relancez les commandes non confirmées sous 2h</p>
                <p style={{ fontSize: 12, color: "#667085", margin: 0 }}>⚡ Utilisez les modèles pour gagner du temps</p>
                <p style={{ fontSize: 12, color: "#667085", margin: 0 }}>📋 Suivez les commandes créées avant l&apos;ouverture de WhatsApp</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── E — Bandeau bas ───────────────────────────────── */}
        <div className="wa-bottom-banner">
          <div style={{ background: "#fff", border: "1.5px solid #E8ECEA", borderRadius: 18, padding: "20px 24px", boxShadow: "0 2px 10px rgba(16,24,40,0.04)" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1F2A24", marginBottom: 4, marginTop: 0 }}>Automatisez vos relances WhatsApp</h3>
            <p style={{ fontSize: 13, color: "#667085", marginBottom: 14, marginTop: 0 }}>Configurez des relances automatiques pour les commandes non payées et les clients silencieux.</p>
            <button onClick={() => setConfigRelanceOpen(true)}
              style={{ background: "#0A8F45", color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Configurer les relances →
            </button>
          </div>
          <div style={{ background: "#fff", border: "1.5px solid #E8ECEA", borderRadius: 18, padding: "20px 24px", boxShadow: "0 2px 10px rgba(16,24,40,0.04)" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1F2A24", marginBottom: 4, marginTop: 0 }}>Besoin d&apos;aide ?</h3>
            <p style={{ fontSize: 13, color: "#667085", marginBottom: 14, marginTop: 0 }}>Notre équipe est disponible pour vous accompagner dans l&apos;utilisation du canal WhatsApp.</p>
            <a href="mailto:support@bizmanager.app"
              style={{ display: "inline-block", background: "#F8FAF9", border: "1.5px solid #E8ECEA", color: "#1F2A24", borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
              Contacter le support →
            </a>
          </div>
        </div>

      </div>
    </>
  );
}

"use client";
import { useEffect, useMemo, useState } from "react";
import { useActiveShop } from "@/hooks/useActiveShop";
import CreateShopModal from "../shops/CreateShopModal";

// ─── Types ────────────────────────────────────────────────────────────────────
type Shop = {
  id: string; name: string; slug: string; isPublished: boolean; city: string | null;
  _count?: { products: number; orders: number; customers: number };
};
type ApiProduct = {
  id: string; name: string; sku?: string | null; category?: string | null;
  categories?: string[]; unitPrice: string | number; stock: number;
  isActive?: boolean; syncStatus?: string; createdAt?: string; updatedAt?: string;
};

type MockProduct = {
  id: string; name: string; sku: string; category: string;
  price: number; stock: number; status: "active"|"draft"|"low"|"out";
  sync: "ok"|"pending"|"error"; updatedAt: string;
  imageUrl?: string | null;
};

type QuotaInfo = {
  plan: { name: string; displayName: string; maxProducts: number; priceMonthly: number };
  usage: { shops: number; products: number };
  nextPlan: { name: string; displayName: string; priceMonthly: number } | null;
};

// ─── API → display conversion ──────────────────────────────────────────────────
function apiToDisplay(p: ApiProduct): MockProduct {
  const price = parseFloat(String(p.unitPrice ?? 0));
  const stock = Number(p.stock ?? 0);
  let status: MockProduct["status"];
  if (stock === 0) status = "out";
  else if (stock <= 5) status = "low";
  else if (p.isActive === false) status = "draft";
  else status = "active";
  return {
    id:        p.id,
    name:      p.name,
    sku:       p.sku ?? generateSku(p.name),
    category:  p.category ?? (p.categories?.[0] ?? ""),
    price,
    stock,
    status,
    sync:      (p.syncStatus ?? "ok") as MockProduct["sync"],
    updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString().slice(0, 10) : "",
    imageUrl:  (p as { imageUrl?: string | null }).imageUrl ?? null,
  };
}

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

/* ── Product Modal ── */
.pm-overlay { position:fixed; inset:0; background:rgba(15,20,18,0.5); z-index:2000;
              display:flex; align-items:center; justify-content:center; padding:16px;
              backdrop-filter:blur(2px); }
.pm-modal   { background:#fff; border-radius:20px; width:100%; max-width:820px; max-height:90vh;
              overflow-y:auto; box-shadow:0 12px 40px rgba(16,24,40,0.12); }
.pm-header  { display:flex; align-items:flex-start; justify-content:space-between;
              padding:24px 28px 16px; border-bottom:1px solid #E8ECEA; position:sticky;
              top:0; background:#fff; z-index:1; }
.pm-body    { padding:24px 28px; display:flex; flex-direction:column; gap:20px; }
.pm-footer  { display:flex; justify-content:flex-end; gap:12px; padding:16px 28px 24px;
              border-top:1px solid #E8ECEA; position:sticky; bottom:0; background:#fff; z-index:1; }
.pm-label   { font-size:13px; font-weight:600; color:#1F2A24; margin-bottom:6px; display:block; }
.pm-input   { width:100%; height:40px; padding:0 12px; border:1.5px solid #E8ECEA; border-radius:10px;
              font-size:14px; color:#1F2A24; background:#fff; outline:none; box-sizing:border-box;
              transition:border-color .15s, box-shadow .15s; }
.pm-input:focus { border-color:#0A8F45; box-shadow:0 0 0 3px rgba(10,143,69,0.08); }
.pm-input:disabled { background:#F8FAF9; color:#667085; cursor:default; }
.pm-textarea { width:100%; padding:12px; border:1.5px solid #E8ECEA; border-radius:10px;
               font-size:14px; color:#1F2A24; background:#fff; outline:none; resize:vertical;
               font-family:inherit; box-sizing:border-box; transition:border-color .15s; line-height:1.5; }
.pm-textarea:focus { border-color:#0A8F45; box-shadow:0 0 0 3px rgba(10,143,69,0.08); }
.pm-select  { width:100%; height:40px; padding:0 12px; border:1.5px solid #E8ECEA; border-radius:10px;
              font-size:14px; color:#1F2A24; background:#fff; outline:none; cursor:pointer;
              box-sizing:border-box; }
.pm-select:focus { border-color:#0A8F45; }
.pm-upload-main { width:100%; height:200px; border:1.5px dashed #D0D5DD; border-radius:16px;
                  background:#F8FAF9; display:flex; flex-direction:column; align-items:center;
                  justify-content:center; gap:8px; cursor:pointer; transition:all .15s; }
.pm-upload-main:hover { border-color:#0A8F45; background:#EAF7EF; }
.pm-upload-sm   { height:120px; border:1.5px dashed #D0D5DD; border-radius:14px;
                  background:#F8FAF9; display:flex; flex-direction:column; align-items:center;
                  justify-content:center; gap:5px; cursor:pointer; transition:all .15s; }
.pm-upload-sm:hover { border-color:#0A8F45; background:#EAF7EF; }
.pm-toggle { width:40px; height:22px; background:#E8ECEA; border-radius:999px; cursor:pointer;
             position:relative; transition:background .2s; flex-shrink:0; border:none; padding:0; }
.pm-toggle.on { background:#0A8F45; }
.pm-toggle::after { content:''; position:absolute; top:3px; left:3px; width:16px; height:16px;
                    background:#fff; border-radius:50%; transition:transform .2s;
                    box-shadow:0 1px 3px rgba(0,0,0,0.15); }
.pm-toggle.on::after { transform:translateX(18px); }

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

// ─── SKU generator ───────────────────────────────────────────────────────────
function generateSku(name: string): string {
  if (!name.trim()) return "";
  const base = name.trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 22)
    .replace(/-+$/g, "");
  return base ? `${base}-001` : "";
}

// ─── Add Product Modal ────────────────────────────────────────────────────────
type AddProductModalProps = {
  open:       boolean;
  onClose:    () => void;
  shopId:     string | null;
  shopName:   string;
  categories: string[];
  onCreated:  () => void;
};

function AddProductModal({ open, onClose, shopId, shopName, categories, onCreated }: AddProductModalProps) {
  const [name, setName]               = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory]       = useState("");
  const [newCatInput, setNewCatInput] = useState("");
  const [showNewCat, setShowNewCat]   = useState(false);
  const [localCats, setLocalCats]     = useState<string[]>([]);
  const [unitPrice, setUnitPrice]     = useState("");
  const [promoPrice, setPromoPrice]   = useState("");
  const [stock, setStock]             = useState("0");
  const [status, setStatus]           = useState<"active" | "draft">("active");
  const [isPublished, setIsPublished] = useState(true);
  const [trackStock, setTrackStock]   = useState(true);
  const [mainFile, setMainFile]       = useState<File | null>(null);
  const [mainPreview, setMainPreview] = useState<string | null>(null);
  const [extraFiles, setExtraFiles]   = useState<(File | null)[]>([null, null, null]);
  const [extraPreviews, setExtraPreviews] = useState<(string | null)[]>([null, null, null]);
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [submitError, setSubmitError]     = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const sku = generateSku(name);
  const allCategories = [...categories, ...localCats];

  function reset() {
    setName(""); setDescription(""); setCategory(""); setNewCatInput("");
    setShowNewCat(false); setLocalCats([]); setUnitPrice(""); setPromoPrice("");
    setStock("0"); setStatus("active"); setIsPublished(true); setTrackStock(true);
    setMainFile(null); setMainPreview(null);
    setExtraFiles([null, null, null]); setExtraPreviews([null, null, null]);
    setIsSubmitting(false); setSubmitError(null); setSubmitSuccess(false);
  }

  function handleClose() { reset(); onClose(); }

  function handleMainFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setMainFile(f);
    setMainPreview(f ? URL.createObjectURL(f) : null);
  }

  function handleExtraFile(idx: number, e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setExtraFiles(prev => { const n = [...prev]; n[idx] = f; return n; });
    setExtraPreviews(prev => { const n = [...prev]; n[idx] = f ? URL.createObjectURL(f) : null; return n; });
  }

  function addCategory() {
    const t = newCatInput.trim();
    if (!t || allCategories.includes(t)) return;
    setLocalCats(prev => [...prev, t]);
    setCategory(t);
    setNewCatInput("");
    setShowNewCat(false);
  }

  async function handleSubmit() {
    if (!shopId) { setSubmitError("Boutique introuvable. Rechargez la page."); return; }
    if (!name.trim()) { setSubmitError("Le nom du produit est obligatoire."); return; }
    const price = parseFloat(unitPrice.replace(",", "."));
    if (isNaN(price) || price < 0) { setSubmitError("Le prix doit être un nombre valide."); return; }
    const stockNum = parseInt(stock);
    if (isNaN(stockNum) || stockNum < 0) { setSubmitError("Le stock doit être un nombre valide."); return; }

    setIsSubmitting(true);
    setSubmitError(null);

    const fd = new FormData();
    fd.append("name", name.trim());
    fd.append("description", description.trim());
    fd.append("category", category || "");
    fd.append("categories", JSON.stringify(category ? [category] : []));
    fd.append("unitPrice", String(price));
    fd.append("stock", String(stockNum));
    fd.append("isActive", status === "active" ? "true" : "false");
    if (mainFile) fd.append("imageFile", mainFile);
    extraFiles.forEach(f => { if (f) fd.append("imageVariantFiles", f); });

    try {
      const res = await fetch(`/api/products?shopId=${shopId}`, { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setSubmitError(data?.error ?? "Erreur lors de la création du produit."); return; }
      setSubmitSuccess(true);
      onCreated();
      setTimeout(() => { handleClose(); }, 1400);
    } catch {
      setSubmitError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="pm-overlay" onClick={handleClose}>
      <div className="pm-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="pm-header">
          <div>
            <h2 style={{ fontSize:20, fontWeight:800, color:"#1F2A24", margin:0 }}>Ajouter un produit</h2>
            <p style={{ fontSize:13, color:"#667085", margin:"4px 0 0" }}>
              Créez un nouveau produit pour la boutique active.
            </p>
          </div>
          <button onClick={handleClose}
            style={{ background:"none", border:"1.5px solid #E8ECEA", borderRadius:8, width:32, height:32,
                     display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer",
                     color:"#667085", fontSize:16, flexShrink:0 }}>✕</button>
        </div>

        <div className="pm-body">

          {/* Info banner */}
          <div style={{ display:"flex", alignItems:"center", gap:10, background:"#EAF7EF",
                        border:"1px solid #C2E8D0", borderRadius:12, padding:"11px 16px" }}>
            <span style={{ fontSize:16, flexShrink:0 }}>ℹ️</span>
            <span style={{ fontSize:13, color:"#1F2A24" }}>
              Ce produit sera rattaché à la boutique active&nbsp;
              <strong style={{ color:"#0A8F45" }}>{shopName}</strong>.
            </span>
          </div>

          {/* Row 1 : Média principal + Nom + Description */}
          <div style={{ display:"grid", gridTemplateColumns:"220px 1fr", gap:20, alignItems:"flex-start" }}>

            {/* Média principal */}
            <div>
              <label className="pm-label">
                Média principal <span style={{ color:"#EF4444" }}>*</span>
              </label>
              <label className="pm-upload-main" style={mainPreview ? { padding:0, overflow:"hidden" } : {}}>
                {mainPreview ? (
                  mainFile?.type.startsWith("video/")
                    ? <video src={mainPreview} style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:14 }} muted />
                    : <img src={mainPreview} alt="preview" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:14 }} />
                ) : (
                  <>
                    <div style={{ display:"flex", gap:8 }}>
                      <span style={{ fontSize:24 }}>🖼️</span>
                      <span style={{ fontSize:24 }}>🎬</span>
                    </div>
                    <span style={{ fontSize:13, fontWeight:600, color:"#0A8F45", background:"#fff",
                                   border:"1.5px solid #C2E8D0", borderRadius:8, padding:"5px 16px", marginTop:4 }}>
                      Téléverser
                    </span>
                    <span style={{ fontSize:11, color:"#98A2B3" }}>Image ou vidéo (max. 20 Mo)</span>
                    <span style={{ fontSize:10, color:"#C5CDD1" }}>PNG · JPG · WEBP · MP4 · MOV</span>
                  </>
                )}
                <input type="file" accept="image/*,video/*" style={{ display:"none" }} onChange={handleMainFile} />
              </label>
              {mainPreview && (
                <button onClick={() => { setMainFile(null); setMainPreview(null); }}
                  style={{ marginTop:6, width:"100%", background:"none", border:"1px solid #E8ECEA",
                           borderRadius:8, padding:"4px 0", fontSize:11, color:"#667085", cursor:"pointer" }}>
                  Supprimer le média
                </button>
              )}
            </div>

            {/* Nom + Description */}
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <label className="pm-label">
                  Nom du produit <span style={{ color:"#EF4444" }}>*</span>
                </label>
                <input className="pm-input" placeholder="Ex. : Montre Classic Noir"
                  value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className="pm-label">Description</label>
                <textarea className="pm-textarea"
                  placeholder="Décrivez votre produit, ses caractéristiques, ses avantages..."
                  value={description} onChange={e => setDescription(e.target.value)}
                  maxLength={1000} style={{ height:120 }} />
                <div style={{ textAlign:"right", fontSize:11, color:"#98A2B3", marginTop:3 }}>
                  {description.length} / 1000
                </div>
              </div>
            </div>
          </div>

          {/* Row 2 : Boutique + Catégorie */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, alignItems:"flex-start" }}>

            {/* Boutique (verrouillée) */}
            <div>
              <label className="pm-label">
                Boutique <span style={{ color:"#EF4444" }}>*</span>
              </label>
              <div style={{ display:"flex", alignItems:"center", gap:8, height:40, padding:"0 12px",
                            border:"1.5px solid #E8ECEA", borderRadius:10, background:"#F8FAF9" }}>
                <span style={{ fontSize:13, fontWeight:600, color:"#1F2A24", flex:1 }}>{shopName}</span>
                <span className="badge badge-green" style={{ fontSize:10 }}>Active</span>
                <span style={{ fontSize:14, color:"#98A2B3" }}>🔒</span>
              </div>
              <p style={{ margin:"5px 0 0", fontSize:11, color:"#98A2B3" }}>
                Le produit sera ajouté à la boutique active.
              </p>
            </div>

            {/* Catégorie */}
            <div>
              <label className="pm-label">
                Catégorie <span style={{ color:"#EF4444" }}>*</span>
              </label>
              <select className="pm-select" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">Sélectionnez une catégorie</option>
                {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {!showNewCat ? (
                <button onClick={() => setShowNewCat(true)}
                  style={{ marginTop:7, background:"none", border:"1px solid #E8ECEA", borderRadius:8,
                           padding:"5px 12px", fontSize:12, color:"#0A8F45", cursor:"pointer", fontWeight:600 }}>
                  + Créer une catégorie
                </button>
              ) : (
                <div style={{ display:"flex", gap:6, marginTop:7 }}>
                  <input className="pm-input" style={{ height:34, fontSize:12 }}
                    placeholder="Nom de la catégorie"
                    value={newCatInput} onChange={e => setNewCatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") addCategory(); }}
                    autoFocus />
                  <button onClick={addCategory}
                    style={{ height:34, padding:"0 12px", background:"#0A8F45", color:"#fff",
                             border:"none", borderRadius:8, fontSize:12, fontWeight:700,
                             cursor:"pointer", flexShrink:0 }}>OK</button>
                  <button onClick={() => { setShowNewCat(false); setNewCatInput(""); }}
                    style={{ height:34, padding:"0 10px", background:"none", border:"1px solid #E8ECEA",
                             borderRadius:8, fontSize:12, color:"#667085", cursor:"pointer", flexShrink:0 }}>✕</button>
                </div>
              )}
              <p style={{ margin:"5px 0 0", fontSize:11, color:"#98A2B3" }}>
                Vous pouvez créer une nouvelle catégorie sans quitter cette fenêtre.
              </p>
            </div>
          </div>

          {/* Row 3 : SKU + Prix + Prix promo */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, alignItems:"flex-start" }}>

            {/* SKU automatique */}
            <div>
              <label className="pm-label" style={{ display:"flex", alignItems:"center", gap:5 }}>
                Référence produit (SKU)
                <span title="Généré automatiquement à partir du nom" style={{ color:"#98A2B3", fontSize:13, cursor:"help" }}>ⓘ</span>
              </label>
              <div style={{ position:"relative" }}>
                <input className="pm-input" disabled
                  value={sku || "Saisissez un nom…"}
                  style={{ background:"#F8FAF9", color: sku ? "#1F2A24" : "#C5CDD1",
                           fontFamily:"monospace", fontSize:12, paddingRight:32 }} />
                <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
                               fontSize:13, color:"#C5CDD1" }}>🔒</span>
              </div>
              <p style={{ margin:"5px 0 0", fontSize:11, color:"#98A2B3" }}>
                Généré automatiquement à partir du nom du produit.
              </p>
            </div>

            {/* Prix */}
            <div>
              <label className="pm-label">
                Prix <span style={{ color:"#EF4444" }}>*</span>
              </label>
              <div style={{ position:"relative" }}>
                <input className="pm-input" type="number" min="0" step="0.01"
                  placeholder="0,00" value={unitPrice} onChange={e => setUnitPrice(e.target.value)}
                  style={{ paddingRight:54 }} />
                <span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                               fontSize:11, color:"#98A2B3", fontWeight:700, pointerEvents:"none" }}>FCFA</span>
              </div>
            </div>

            {/* Prix promo */}
            <div>
              <label className="pm-label" style={{ color:"#667085" }}>
                Prix promo <span style={{ fontWeight:400 }}>(optionnel)</span>
              </label>
              <div style={{ position:"relative" }}>
                <input className="pm-input" type="number" min="0" step="0.01"
                  placeholder="0,00" value={promoPrice} onChange={e => setPromoPrice(e.target.value)}
                  style={{ paddingRight:54 }} />
                <span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                               fontSize:11, color:"#98A2B3", fontWeight:700, pointerEvents:"none" }}>FCFA</span>
              </div>
            </div>
          </div>

          {/* Row 4 : Stock + Statut + Toggles */}
          <div style={{ display:"flex", gap:20, alignItems:"center", flexWrap:"wrap",
                        background:"#F8FAF9", borderRadius:12, padding:"14px 18px",
                        border:"1px solid #E8ECEA" }}>

            {/* Stock */}
            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
              <label className="pm-label" style={{ marginBottom:0 }}>
                Stock <span style={{ color:"#EF4444" }}>*</span>
              </label>
              <input className="pm-input" type="number" min="0" style={{ width:80, textAlign:"center" }}
                value={stock} onChange={e => setStock(e.target.value)} />
            </div>

            <div style={{ width:1, height:44, background:"#E8ECEA", flexShrink:0 }} />

            {/* Statut segmenté */}
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <label className="pm-label" style={{ marginBottom:0 }}>
                Statut <span style={{ color:"#EF4444" }}>*</span>
              </label>
              <div style={{ display:"flex", borderRadius:10, border:"1.5px solid #E8ECEA",
                            overflow:"hidden", background:"#fff" }}>
                {(["active","draft"] as const).map(s => (
                  <button key={s} onClick={() => setStatus(s)}
                    style={{ padding:"7px 18px", fontSize:12, fontWeight:600, border:"none",
                             cursor:"pointer", transition:"background .15s, color .15s",
                             background: status === s ? "#0A8F45" : "transparent",
                             color: status === s ? "#fff" : "#667085" }}>
                    {s === "active" ? "Actif" : "Brouillon"}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ width:1, height:44, background:"#E8ECEA", flexShrink:0 }} />

            {/* Toggle : Afficher en boutique */}
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <button className={`pm-toggle${isPublished ? " on" : ""}`}
                onClick={() => setIsPublished(p => !p)} />
              <span style={{ fontSize:12, color:"#1F2A24", fontWeight:500 }}>Afficher dans la boutique</span>
            </div>

            {/* Toggle : Suivi du stock */}
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <button className={`pm-toggle${trackStock ? " on" : ""}`}
                onClick={() => setTrackStock(p => !p)} />
              <span style={{ fontSize:12, color:"#1F2A24", fontWeight:500 }}>Suivi du stock</span>
              <span title="Désactiver pour les produits sans gestion de stock"
                style={{ color:"#98A2B3", fontSize:13, cursor:"help" }}>ⓘ</span>
            </div>
          </div>

          {/* Galerie produit */}
          <div>
            <div style={{ marginBottom:10 }}>
              <span style={{ fontSize:14, fontWeight:700, color:"#1F2A24" }}>Galerie produit</span>
              <span style={{ fontSize:13, color:"#667085", fontWeight:400 }}> (médias supplémentaires)</span>
              <p style={{ margin:"4px 0 0", fontSize:12, color:"#98A2B3" }}>
                Ajoutez jusqu'à 3 médias supplémentaires pour présenter votre produit sous différents angles ou formats.
              </p>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
              {([0,1,2] as const).map(i => (
                <label key={i} className="pm-upload-sm"
                  style={extraPreviews[i] ? { padding:0, overflow:"hidden" } : {}}>
                  {extraPreviews[i] ? (
                    extraFiles[i]?.type.startsWith("video/")
                      ? <video src={extraPreviews[i]!}
                               style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:12 }} muted />
                      : <img src={extraPreviews[i]!} alt={`media ${i+1}`}
                             style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:12 }} />
                  ) : (
                    <>
                      <span style={{ fontSize:11, fontWeight:600, color:"#667085" }}>Média {i+1}</span>
                      <span style={{ fontSize:22, color:"#0A8F45" }}>+</span>
                      <span style={{ fontSize:11, color:"#98A2B3" }}>Image ou vidéo</span>
                      <span style={{ fontSize:9, color:"#C5CDD1" }}>PNG · JPG · WEBP · MP4 · MOV</span>
                    </>
                  )}
                  <input type="file" accept="image/*,video/*" style={{ display:"none" }}
                    onChange={e => handleExtraFile(i, e)} />
                </label>
              ))}
            </div>
          </div>

          {/* Erreur / succès */}
          {submitError && (
            <div style={{ background:"#FDE8E8", border:"1px solid #F9BDBD", borderRadius:10,
                          padding:"10px 14px", fontSize:13, color:"#C02020", fontWeight:500 }}>
              {submitError}
            </div>
          )}
          {submitSuccess && (
            <div style={{ background:"#DDF6E7", border:"1px solid #A8E0BF", borderRadius:10,
                          padding:"10px 14px", fontSize:13, color:"#08763A", fontWeight:600 }}>
              ✓ Produit créé avec succès !
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="pm-footer">
          <button onClick={handleClose} disabled={isSubmitting}
            style={{ height:44, padding:"0 24px", background:"#fff", color:"#1F2A24",
                     border:"1.5px solid #E8ECEA", borderRadius:10, fontSize:14,
                     fontWeight:500, cursor:"pointer" }}>
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting || !shopId}
            style={{ height:44, padding:"0 28px", borderRadius:10, fontSize:14, fontWeight:700,
                     border:"none", cursor: isSubmitting ? "wait" : "pointer", minWidth:200,
                     background: isSubmitting ? "#7CC49E" : "#0A8F45", color:"#fff" }}>
            {isSubmitting ? "Enregistrement…" : "Enregistrer le produit"}
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── Edit Product Modal ───────────────────────────────────────────────────────
type EditProductModalProps = {
  open:       boolean;
  onClose:    () => void;
  shopId:     string | null;
  shopName:   string;
  categories: string[];
  product:    MockProduct | null;
  onUpdated:  () => void;
};

function EditProductModal({ open, onClose, shopId, shopName, categories, product, onUpdated }: EditProductModalProps) {
  const [name, setName]               = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory]       = useState("");
  const [newCatInput, setNewCatInput] = useState("");
  const [showNewCat, setShowNewCat]   = useState(false);
  const [localCats, setLocalCats]     = useState<string[]>([]);
  const [unitPrice, setUnitPrice]     = useState("");
  const [promoPrice, setPromoPrice]   = useState("");
  const [stock, setStock]             = useState("0");
  const [status, setStatus]           = useState<"active" | "draft">("active");
  const [isPublished, setIsPublished] = useState(true);
  const [trackStock, setTrackStock]   = useState(true);
  const [mainFile, setMainFile]       = useState<File | null>(null);
  const [mainPreview, setMainPreview] = useState<string | null>(null);
  const [extraFiles, setExtraFiles]   = useState<(File | null)[]>([null, null, null]);
  const [extraPreviews, setExtraPreviews] = useState<(string | null)[]>([null, null, null]);
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [submitError, setSubmitError]     = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const sku = generateSku(name);
  const allCategories = [...categories, ...localCats];

  useEffect(() => {
    if (product) {
      setName(product.name);
      setCategory(product.category);
      setUnitPrice(String(product.price));
      setStock(String(product.stock));
      setStatus(product.status === "draft" ? "draft" : "active");
      setDescription(""); setPromoPrice("");
      setIsPublished(true); setTrackStock(true);
      setMainFile(null); setMainPreview(product.imageUrl ?? null);
      setExtraFiles([null, null, null]); setExtraPreviews([null, null, null]);
      setSubmitError(null); setSubmitSuccess(false);
      setLocalCats([]); setNewCatInput(""); setShowNewCat(false);
    }
  }, [product]);

  function handleClose() { setSubmitError(null); setSubmitSuccess(false); onClose(); }

  function handleMainFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setMainFile(f);
    setMainPreview(f ? URL.createObjectURL(f) : null);
  }

  function handleExtraFile(idx: number, e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setExtraFiles(prev => { const n = [...prev]; n[idx] = f; return n; });
    setExtraPreviews(prev => { const n = [...prev]; n[idx] = f ? URL.createObjectURL(f) : null; return n; });
  }

  function addCategory() {
    const t = newCatInput.trim();
    if (!t || allCategories.includes(t)) return;
    setLocalCats(prev => [...prev, t]);
    setCategory(t); setNewCatInput(""); setShowNewCat(false);
  }

  async function handleSubmit() {
    if (!shopId || !product) { setSubmitError("Données manquantes. Rechargez la page."); return; }
    if (!name.trim()) { setSubmitError("Le nom du produit est obligatoire."); return; }
    const price = parseFloat(unitPrice.replace(",", "."));
    if (isNaN(price) || price < 0) { setSubmitError("Le prix doit être un nombre valide."); return; }
    const stockNum = parseInt(stock);
    if (isNaN(stockNum) || stockNum < 0) { setSubmitError("Le stock doit être un nombre valide."); return; }

    setIsSubmitting(true); setSubmitError(null);

    const fd = new FormData();
    fd.append("name", name.trim());
    fd.append("description", description.trim());
    fd.append("category", category || "");
    fd.append("categories", JSON.stringify(category ? [category] : []));
    fd.append("unitPrice", String(price));
    fd.append("stock", String(stockNum));
    fd.append("isActive", status === "active" ? "true" : "false");
    if (mainFile) fd.append("imageFile", mainFile);
    extraFiles.forEach(f => { if (f) fd.append("imageVariantFiles", f); });

    try {
      const res = await fetch(`/api/products/${product.id}?shopId=${shopId}`, { method: "PUT", body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setSubmitError(data?.error ?? "Erreur lors de la modification."); return; }
      setSubmitSuccess(true);
      onUpdated();
      setTimeout(() => { handleClose(); }, 1400);
    } catch {
      setSubmitError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="pm-overlay" onClick={handleClose}>
      <div className="pm-modal" onClick={e => e.stopPropagation()}>

        <div className="pm-header">
          <div>
            <h2 style={{ fontSize:20, fontWeight:800, color:"#1F2A24", margin:0 }}>Modifier le produit</h2>
            <p style={{ fontSize:13, color:"#667085", margin:"4px 0 0" }}>Mettez à jour les informations du produit.</p>
          </div>
          <button onClick={handleClose}
            style={{ background:"none", border:"1.5px solid #E8ECEA", borderRadius:8, width:32, height:32,
                     display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer",
                     color:"#667085", fontSize:16, flexShrink:0 }}>✕</button>
        </div>

        <div className="pm-body">

          <div style={{ display:"flex", alignItems:"center", gap:10, background:"#EAF7EF",
                        border:"1px solid #C2E8D0", borderRadius:12, padding:"11px 16px" }}>
            <span style={{ fontSize:16, flexShrink:0 }}>✏️</span>
            <span style={{ fontSize:13, color:"#1F2A24" }}>
              Modification du produit&nbsp;<strong style={{ color:"#0A8F45" }}>{product?.name}</strong>
              &nbsp;— boutique&nbsp;<strong style={{ color:"#0A8F45" }}>{shopName}</strong>.
            </span>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"220px 1fr", gap:20, alignItems:"flex-start" }}>
            <div>
              <label className="pm-label">Média principal</label>
              <label className="pm-upload-main" style={mainPreview ? { padding:0, overflow:"hidden" } : {}}>
                {mainPreview ? (
                  mainFile?.type.startsWith("video/")
                    ? <video src={mainPreview} style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:14 }} muted />
                    : <img src={mainPreview} alt="preview" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:14 }} />
                ) : (
                  <>
                    <div style={{ display:"flex", gap:8 }}>
                      <span style={{ fontSize:24 }}>🖼️</span>
                      <span style={{ fontSize:24 }}>🎬</span>
                    </div>
                    <span style={{ fontSize:13, fontWeight:600, color:"#0A8F45", background:"#fff",
                                   border:"1.5px solid #C2E8D0", borderRadius:8, padding:"5px 16px", marginTop:4 }}>
                      Remplacer
                    </span>
                    <span style={{ fontSize:11, color:"#98A2B3" }}>Image ou vidéo (max. 20 Mo)</span>
                    <span style={{ fontSize:10, color:"#C5CDD1" }}>PNG · JPG · WEBP · MP4 · MOV</span>
                  </>
                )}
                <input type="file" accept="image/*,video/*" style={{ display:"none" }} onChange={handleMainFile} />
              </label>
              {mainPreview && (
                <button onClick={() => { setMainFile(null); setMainPreview(null); }}
                  style={{ marginTop:6, width:"100%", background:"none", border:"1px solid #E8ECEA",
                           borderRadius:8, padding:"4px 0", fontSize:11, color:"#667085", cursor:"pointer" }}>
                  Supprimer le média
                </button>
              )}
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <label className="pm-label">Nom du produit <span style={{ color:"#EF4444" }}>*</span></label>
                <input className="pm-input" placeholder="Ex. : Montre Classic Noir"
                  value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className="pm-label">Description</label>
                <textarea className="pm-textarea"
                  placeholder="Décrivez votre produit…"
                  value={description} onChange={e => setDescription(e.target.value)}
                  maxLength={1000} style={{ height:120 }} />
                <div style={{ textAlign:"right", fontSize:11, color:"#98A2B3", marginTop:3 }}>
                  {description.length} / 1000
                </div>
              </div>
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, alignItems:"flex-start" }}>
            <div>
              <label className="pm-label">Boutique <span style={{ color:"#EF4444" }}>*</span></label>
              <div style={{ display:"flex", alignItems:"center", gap:8, height:40, padding:"0 12px",
                            border:"1.5px solid #E8ECEA", borderRadius:10, background:"#F8FAF9" }}>
                <span style={{ fontSize:13, fontWeight:600, color:"#1F2A24", flex:1 }}>{shopName}</span>
                <span className="badge badge-green" style={{ fontSize:10 }}>Active</span>
                <span style={{ fontSize:14, color:"#98A2B3" }}>🔒</span>
              </div>
            </div>
            <div>
              <label className="pm-label">Catégorie <span style={{ color:"#EF4444" }}>*</span></label>
              <select className="pm-select" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">Sélectionnez une catégorie</option>
                {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {!showNewCat ? (
                <button onClick={() => setShowNewCat(true)}
                  style={{ marginTop:7, background:"none", border:"1px solid #E8ECEA", borderRadius:8,
                           padding:"5px 12px", fontSize:12, color:"#0A8F45", cursor:"pointer", fontWeight:600 }}>
                  + Créer une catégorie
                </button>
              ) : (
                <div style={{ display:"flex", gap:6, marginTop:7 }}>
                  <input className="pm-input" style={{ height:34, fontSize:12 }}
                    placeholder="Nom de la catégorie"
                    value={newCatInput} onChange={e => setNewCatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") addCategory(); }}
                    autoFocus />
                  <button onClick={addCategory}
                    style={{ height:34, padding:"0 12px", background:"#0A8F45", color:"#fff",
                             border:"none", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", flexShrink:0 }}>OK</button>
                  <button onClick={() => { setShowNewCat(false); setNewCatInput(""); }}
                    style={{ height:34, padding:"0 10px", background:"none", border:"1px solid #E8ECEA",
                             borderRadius:8, fontSize:12, color:"#667085", cursor:"pointer", flexShrink:0 }}>✕</button>
                </div>
              )}
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, alignItems:"flex-start" }}>
            <div>
              <label className="pm-label" style={{ display:"flex", alignItems:"center", gap:5 }}>
                Référence (SKU)
                <span title="Généré à partir du nom" style={{ color:"#98A2B3", fontSize:13, cursor:"help" }}>ⓘ</span>
              </label>
              <div style={{ position:"relative" }}>
                <input className="pm-input" disabled value={sku || product?.sku || "—"}
                  style={{ background:"#F8FAF9", color:"#1F2A24", fontFamily:"monospace", fontSize:12, paddingRight:32 }} />
                <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", fontSize:13, color:"#C5CDD1" }}>🔒</span>
              </div>
            </div>
            <div>
              <label className="pm-label">Prix <span style={{ color:"#EF4444" }}>*</span></label>
              <div style={{ position:"relative" }}>
                <input className="pm-input" type="number" min="0" step="0.01"
                  placeholder="0,00" value={unitPrice} onChange={e => setUnitPrice(e.target.value)}
                  style={{ paddingRight:54 }} />
                <span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                               fontSize:11, color:"#98A2B3", fontWeight:700, pointerEvents:"none" }}>FCFA</span>
              </div>
            </div>
            <div>
              <label className="pm-label" style={{ color:"#667085" }}>Prix promo <span style={{ fontWeight:400 }}>(optionnel)</span></label>
              <div style={{ position:"relative" }}>
                <input className="pm-input" type="number" min="0" step="0.01"
                  placeholder="0,00" value={promoPrice} onChange={e => setPromoPrice(e.target.value)}
                  style={{ paddingRight:54 }} />
                <span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                               fontSize:11, color:"#98A2B3", fontWeight:700, pointerEvents:"none" }}>FCFA</span>
              </div>
            </div>
          </div>

          <div style={{ display:"flex", gap:20, alignItems:"center", flexWrap:"wrap",
                        background:"#F8FAF9", borderRadius:12, padding:"14px 18px", border:"1px solid #E8ECEA" }}>
            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
              <label className="pm-label" style={{ marginBottom:0 }}>Stock <span style={{ color:"#EF4444" }}>*</span></label>
              <input className="pm-input" type="number" min="0" style={{ width:80, textAlign:"center" }}
                value={stock} onChange={e => setStock(e.target.value)} />
            </div>
            <div style={{ width:1, height:44, background:"#E8ECEA", flexShrink:0 }} />
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <label className="pm-label" style={{ marginBottom:0 }}>Statut <span style={{ color:"#EF4444" }}>*</span></label>
              <div style={{ display:"flex", borderRadius:10, border:"1.5px solid #E8ECEA", overflow:"hidden", background:"#fff" }}>
                {(["active","draft"] as const).map(s => (
                  <button key={s} onClick={() => setStatus(s)}
                    style={{ padding:"7px 18px", fontSize:12, fontWeight:600, border:"none", cursor:"pointer",
                             transition:"background .15s, color .15s",
                             background: status === s ? "#0A8F45" : "transparent",
                             color: status === s ? "#fff" : "#667085" }}>
                    {s === "active" ? "Actif" : "Brouillon"}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ width:1, height:44, background:"#E8ECEA", flexShrink:0 }} />
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <button className={`pm-toggle${isPublished ? " on" : ""}`} onClick={() => setIsPublished(p => !p)} />
              <span style={{ fontSize:12, color:"#1F2A24", fontWeight:500 }}>Afficher dans la boutique</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <button className={`pm-toggle${trackStock ? " on" : ""}`} onClick={() => setTrackStock(p => !p)} />
              <span style={{ fontSize:12, color:"#1F2A24", fontWeight:500 }}>Suivi du stock</span>
              <span title="Désactiver pour les produits sans gestion de stock" style={{ color:"#98A2B3", fontSize:13, cursor:"help" }}>ⓘ</span>
            </div>
          </div>

          <div>
            <div style={{ marginBottom:10 }}>
              <span style={{ fontSize:14, fontWeight:700, color:"#1F2A24" }}>Galerie produit</span>
              <span style={{ fontSize:13, color:"#667085", fontWeight:400 }}> (médias supplémentaires)</span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
              {([0,1,2] as const).map(i => (
                <label key={i} className="pm-upload-sm" style={extraPreviews[i] ? { padding:0, overflow:"hidden" } : {}}>
                  {extraPreviews[i] ? (
                    extraFiles[i]?.type.startsWith("video/")
                      ? <video src={extraPreviews[i]!} style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:12 }} muted />
                      : <img src={extraPreviews[i]!} alt={`media ${i+1}`} style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:12 }} />
                  ) : (
                    <>
                      <span style={{ fontSize:11, fontWeight:600, color:"#667085" }}>Média {i+1}</span>
                      <span style={{ fontSize:22, color:"#0A8F45" }}>+</span>
                      <span style={{ fontSize:11, color:"#98A2B3" }}>Image ou vidéo</span>
                    </>
                  )}
                  <input type="file" accept="image/*,video/*" style={{ display:"none" }} onChange={e => handleExtraFile(i, e)} />
                </label>
              ))}
            </div>
          </div>

          {submitError && (
            <div style={{ background:"#FDE8E8", border:"1px solid #F9BDBD", borderRadius:10,
                          padding:"10px 14px", fontSize:13, color:"#C02020", fontWeight:500 }}>
              {submitError}
            </div>
          )}
          {submitSuccess && (
            <div style={{ background:"#DDF6E7", border:"1px solid #A8E0BF", borderRadius:10,
                          padding:"10px 14px", fontSize:13, color:"#08763A", fontWeight:600 }}>
              ✓ Produit modifié avec succès !
            </div>
          )}

        </div>

        <div className="pm-footer">
          <button onClick={handleClose} disabled={isSubmitting}
            style={{ height:44, padding:"0 24px", background:"#fff", color:"#1F2A24",
                     border:"1.5px solid #E8ECEA", borderRadius:10, fontSize:14, fontWeight:500, cursor:"pointer" }}>
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting || !shopId}
            style={{ height:44, padding:"0 28px", borderRadius:10, fontSize:14, fontWeight:700,
                     border:"none", cursor: isSubmitting ? "wait" : "pointer", minWidth:220,
                     background: isSubmitting ? "#7CC49E" : "#0A8F45", color:"#fff" }}>
            {isSubmitting ? "Enregistrement…" : "Enregistrer les modifications"}
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
type DeleteConfirmProps = {
  product:   MockProduct | null;
  shopId:    string | null;
  onClose:   () => void;
  onDeleted: () => void;
};

function DeleteConfirmModal({ product, shopId, onClose, onDeleted }: DeleteConfirmProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  async function handleDelete() {
    if (!product || !shopId) return;
    setIsDeleting(true); setError(null);
    try {
      const res = await fetch(`/api/products/${product.id}?shopId=${shopId}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.error ?? "Erreur lors de la suppression."); return;
      }
      onDeleted();
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setIsDeleting(false);
    }
  }

  if (!product) return null;

  return (
    <div className="pm-overlay" onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:20, padding:"32px 28px", maxWidth:400, width:"100%",
                    boxShadow:"0 12px 40px rgba(16,24,40,0.12)" }}
           onClick={e => e.stopPropagation()}>
        <div style={{ textAlign:"center", marginBottom:20 }}>
          <div style={{ fontSize:44, marginBottom:10 }}>🗑️</div>
          <h2 style={{ fontSize:20, fontWeight:800, color:"#1F2A24", margin:0 }}>Supprimer le produit ?</h2>
          <p style={{ fontSize:14, color:"#667085", marginTop:8, marginBottom:0, lineHeight:1.5 }}>
            Cette action est irréversible. Le produit&nbsp;
            <strong style={{ color:"#1F2A24" }}>{product.name}</strong>&nbsp;
            sera définitivement supprimé.
          </p>
        </div>
        {error && (
          <div style={{ background:"#FDE8E8", border:"1px solid #F9BDBD", borderRadius:10,
                        padding:"10px 14px", fontSize:13, color:"#C02020", marginBottom:16 }}>
            {error}
          </div>
        )}
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} disabled={isDeleting}
            style={{ flex:1, height:44, background:"#fff", border:"1.5px solid #E8ECEA", borderRadius:10,
                     fontSize:14, fontWeight:500, color:"#667085", cursor:"pointer" }}>
            Annuler
          </button>
          <button onClick={handleDelete} disabled={isDeleting}
            style={{ flex:1, height:44, background: isDeleting ? "#F9BDBD" : "#EF4444", border:"none",
                     borderRadius:10, fontSize:14, fontWeight:700, color:"#fff",
                     cursor: isDeleting ? "wait" : "pointer" }}>
            {isDeleting ? "Suppression…" : "Supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const [activeShopId, setActiveShopId] = useActiveShop("");
  const [search, setSearch]             = useState("");
  const [catFilter, setCatFilter]       = useState("all");
  const [stockFilter, setStockFilter]   = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy]             = useState("name");
  const [realShops, setRealShops]       = useState<Shop[]>([]);
  const [products, setProducts]         = useState<MockProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [apiCategories, setApiCategories] = useState<string[]>([]);
  const [quota, setQuota]               = useState<QuotaInfo | null>(null);
  const [showUpgrade, setShowUpgrade]   = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showCreateShop, setShowCreateShop] = useState(false);
  const [editProduct, setEditProduct]   = useState<MockProduct | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<MockProduct | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const activeShop = realShops.find(s => s.id === activeShopId) ?? realShops[0] ?? null;
  const atProductLimit = quota !== null && quota.plan.maxProducts !== -1 && quota.usage.products >= quota.plan.maxProducts;

  const shopColors = ["#0A8F45","#3B82F6","#F08A24","#8B5CF6","#EC4899","#14B8A6"];

  // Fetch real shops on mount
  useEffect(() => {
    fetch("/api/shop?all=1")
      .then(r => r.json())
      .then(d => {
        const list: Shop[] = d.data ?? [];
        setRealShops(list);
        // If no stored ID matches, use first shop
        if (list.length > 0 && !list.find(s => s.id === activeShopId)) {
          setActiveShopId(list[0].id);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch products whenever active shop changes
  useEffect(() => {
    if (!activeShopId) return;
    setProductsLoading(true);
    fetch(`/api/products?shopId=${activeShopId}`)
      .then(r => r.json())
      .then(d => {
        setProducts((d.data ?? []).map(apiToDisplay));
        setApiCategories(d.meta?.categories ?? []);
      })
      .catch(() => {})
      .finally(() => setProductsLoading(false));
  }, [activeShopId]);

  // Fetch quota when shop changes
  useEffect(() => {
    if (!activeShopId) return;
    fetch(`/api/subscription?shopId=${activeShopId}`)
      .then(r => r.json())
      .then(d => { if (d.plan) setQuota(d); })
      .catch(() => {});
  }, [activeShopId]);

  function refreshProducts() {
    if (!activeShopId) return;
    fetch(`/api/products?shopId=${activeShopId}`)
      .then(r => r.json())
      .then(d => {
        setProducts((d.data ?? []).map(apiToDisplay));
        setApiCategories(d.meta?.categories ?? []);
      })
      .catch(() => {});
  }

  const filtered = useMemo(() => {
    let p = [...products];
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
  }, [products, search, catFilter, stockFilter, statusFilter, sortBy]);

  async function handleDuplicate(p: MockProduct) {
    if (!activeShopId) return;
    setDuplicatingId(p.id);
    const fd = new FormData();
    fd.append("name", `${p.name} (copie)`);
    fd.append("category", p.category);
    fd.append("unitPrice", String(p.price));
    fd.append("stock", String(p.stock));
    fd.append("isActive", p.status !== "draft" ? "true" : "false");
    try {
      await fetch(`/api/products?shopId=${activeShopId}`, { method: "POST", body: fd });
      refreshProducts();
    } finally {
      setDuplicatingId(null);
    }
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="pr-wrap">

        {/* ── Context bar ── */}
        <div className="pr-ctx">
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:12, color:"#667085", fontWeight:500 }}>Boutique active</span>
            <select className="sel" style={{ fontWeight:700, color:"#0A8F45", borderColor:"#0A8F45", minWidth:160 }}
              value={activeShopId} onChange={e => setActiveShopId(e.target.value)}
              disabled={realShops.length === 0}>
              {realShops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            <span className="badge badge-biz" style={{ padding:"5px 12px", fontSize:12 }}>
              Plan {quota?.plan.displayName ?? "—"}
            </span>
            <div>
              <div style={{ fontSize:12, color:"#1F2A24", fontWeight:500 }}>2 / 3 boutiques utilisées</div>
              <div style={{ fontSize:11, color: atProductLimit ? "#EF4444" : "#98A2B3", fontWeight: atProductLimit ? 600 : 400 }}>
                {quota
                  ? `${quota.usage.products} / ${quota.plan.maxProducts === -1 ? "∞" : quota.plan.maxProducts} produits`
                  : "— / — produits"}
              </div>
            </div>
          </div>

          <div className="pr-ctx-r">
            <button className="btn-secondary btn-sm">⬆ Importer un catalogue</button>
            <button className="btn-primary  btn-sm" onClick={() => setShowCreateShop(true)}>+ Créer une boutique</button>
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
            <strong style={{ color:"#0A8F45" }}>{activeShop?.name ?? "—"}</strong>.
          </p>
        </div>

        {/* ── KPI row ── */}
        <div className="pr-kpi">
          {[
            { label:"Produits actifs", val:String(products.filter(p=>p.status==="active").length), sub:"produits",  icon:"📦", color:"#DDF6E7", tc:"#0A8F45" },
            { label:"Stock faible",    val:String(products.filter(p=>p.status==="low").length),    sub:"produits",  icon:"⚠️", color:"#FFF1E5", tc:"#F08A24" },
            { label:"En rupture",      val:String(products.filter(p=>p.status==="out").length),    sub:"produits",  icon:"🔴", color:"#FDE8E8", tc:"#EF4444" },
            { label:"Total catalogue", val:String(products.length),                                sub:"produits",  icon:"💰", color:"#EAF7EF", tc:"#0A8F45" },
          ].map(k => (
            <div key={k.label} style={{ background:"#fff", border:"1px solid #E8ECEA", borderRadius:16,
              padding:"16px 18px", boxShadow:"0 2px 10px rgba(16,24,40,.04)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <span style={{ fontSize:13, color:"#667085", fontWeight:500 }}>{k.label}</span>
                <span style={{ fontSize:20, background:k.color, padding:"5px 7px", borderRadius:10 }}>{k.icon}</span>
              </div>
              <div style={{ fontSize:26, fontWeight:800, color:"#1F2A24", margin:"8px 0 4px", letterSpacing:"-0.5px" }}>{k.val}</div>
              <div style={{ fontSize:11, color:k.tc, fontWeight:500 }}>{k.sub}</div>
              <div style={{ fontSize:10, color:"#98A2B3", marginTop:6 }}>Boutique : {activeShop?.name ?? "—"}</div>
            </div>
          ))}
        </div>

        {/* ── Info card ── */}
        <div className="pr-info">
          <div style={{ fontSize:28 }}>🏪</div>
          <div style={{ flex:1, minWidth:220 }}>
            <div style={{ fontWeight:700, color:"#1F2A24", fontSize:14 }}>
              Tous les produits affichés ici appartiennent à la boutique active&nbsp;
              <span style={{ color:"#0A8F45" }}>{activeShop?.name ?? "—"}</span>.
            </div>
            <div style={{ color:"#667085", fontSize:12, marginTop:3 }}>
              Les produits ne sont plus liés directement au marchand mais à une boutique spécifique.
            </div>
          </div>
          <div style={{ borderLeft:"1px solid #E8ECEA", paddingLeft:20, minWidth:200 }}>
            <div className="pr-hier">
              <span style={{ background:"#EAF7EF", color:"#0A8F45", padding:"3px 8px", borderRadius:8, fontWeight:600, fontSize:12 }}>
                {activeShop ? activeShop.name.slice(0,2).toUpperCase() : "BM"}
              </span>
              <span className="pr-hier-sep">→</span>
              <span style={{ fontWeight:600 }}>{activeShop?.name ?? "—"}</span>
              <span className="pr-hier-sep">→</span>
              <span style={{ color:"#667085" }}>{products.length} produits</span>
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
                  Gestion des produits — {activeShop?.name ?? "—"}
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
                <button
                  className="btn-primary btn-sm"
                  style={atProductLimit ? { opacity: 0.45, cursor: "not-allowed" } : undefined}
                  onClick={() => { if (atProductLimit) setShowUpgrade(true); else setShowAddProduct(true); }}
                >
                  + Ajouter un produit
                </button>
              </div>
            </div>

            {/* filters */}
            <div className="pr-ftrow">
              <input className="inp" placeholder="🔍 Rechercher un produit ou SKU…" style={{ flex:1, minWidth:160 }}
                value={search} onChange={e => setSearch(e.target.value)} />
              <select className="sel" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                <option value="all">Catégories</option>
                {apiCategories.map(c => <option key={c} value={c}>{c}</option>)}
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
                🔒 {activeShop?.name ?? "—"}
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
                          <div className="pr-prod-av" style={{ padding: p.imageUrl ? 0 : undefined, overflow:"hidden" }}>
                            {p.imageUrl
                              ? <img src={p.imageUrl} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:10 }} />
                              : (EMOJIS[p.category] ?? "📦")}
                          </div>
                          <div>
                            <div style={{ fontWeight:600, fontSize:13 }}>{p.name}</div>
                            <div style={{ fontSize:11, color:"#98A2B3" }}>{p.category}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily:"monospace", fontSize:12, color:"#667085" }}>{p.sku}</td>
                      <td>
                        <span className="badge badge-biz" style={{ fontSize:10 }}>{activeShop?.name ?? "—"}</span>
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
                          <button className="pr-act-btn" title="Éditer" onClick={() => setEditProduct(p)}>✏️</button>
                          <button className="pr-act-btn" title="Dupliquer"
                            onClick={() => handleDuplicate(p)}
                            style={duplicatingId === p.id ? { opacity:0.5 } : undefined}>
                            {duplicatingId === p.id ? "⏳" : "📋"}
                          </button>
                          <button className="pr-act-btn" title="Voir">👁️</button>
                          <button className="pr-act-btn" title="Supprimer" style={{ color:"#EF4444" }} onClick={() => setDeleteProduct(p)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {productsLoading && (
                    <tr><td colSpan={10} style={{ textAlign:"center", padding:32, color:"#98A2B3" }}>
                      Chargement…
                    </td></tr>
                  )}
                  {!productsLoading && filtered.length === 0 && (
                    <tr><td colSpan={10} style={{ textAlign:"center", padding:32, color:"#98A2B3" }}>
                      {products.length === 0 ? "Aucun produit dans cette boutique. Créez votre premier produit !" : "Aucun produit trouvé."}
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
                  <div style={{ fontWeight:700, fontSize:15, color:"#1F2A24" }}>{activeShop?.name ?? "—"}</div>
                  <span className={activeShop?.isPublished ? "badge badge-green" : "badge badge-gray"} style={{ fontSize:10 }}>
                    {activeShop?.isPublished ? "Publiée" : "Brouillon"}
                  </span>
                </div>
              </div>
              {[
                { l:"Produits",   v: products.length },
                { l:"Catégories", v: apiCategories.length },
                { l:"Commandes",  v: activeShop?._count?.orders ?? "—" },
                { l:"Clients",    v: activeShop?._count?.customers ?? "—" },
              ].map(r => (
                <div key={r.l} style={{ display:"flex", justifyContent:"space-between",
                  padding:"7px 0", borderBottom:"1px solid #F4F6F5", fontSize:13 }}>
                  <span style={{ color:"#667085" }}>{r.l}</span>
                  <strong style={{ color:"#1F2A24" }}>{r.v}</strong>
                </div>
              ))}
              <div style={{ display:"flex", gap:8, marginTop:12 }}>
                <a href={activeShop ? `/shop/${activeShop.slug}` : "#"}
                   className="btn-secondary btn-sm" style={{ flex:1, textAlign:"center", textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  Voir la boutique
                </a>
                <button className="btn-primary btn-sm" style={{ flex:1 }}
                  onClick={() => {
                    const next = realShops.find(s => s.id !== activeShopId);
                    if (next) setActiveShopId(next.id);
                  }}>Changer</button>
              </div>
            </div>

            {/* Mes boutiques */}
            <div className="pr-card">
              <div style={{ fontSize:13, fontWeight:700, color:"#1F2A24", marginBottom:10 }}>Mes boutiques</div>
              {realShops.map((s, i) => (
                <div key={s.id} className="pr-shop-row"
                  style={{ background: s.id === activeShopId ? "#EAF7EF" : "transparent", borderRadius:10, padding:"8px 10px" }}
                  onClick={() => setActiveShopId(s.id)}>
                  <div className="pr-shop-av" style={{ background: shopColors[i % shopColors.length] }}>
                    {s.name.slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:13, color:"#1F2A24", display:"flex", alignItems:"center", gap:6 }}>
                      {s.name}
                      {s.id === activeShopId && <span style={{ fontSize:9, background:"#0A8F45", color:"#fff", borderRadius:4, padding:"1px 5px" }}>Actif</span>}
                    </div>
                    <div style={{ fontSize:11, color:"#98A2B3" }}>{s._count?.products ?? 0} produits · {s.city ?? ""}</div>
                  </div>
                  <span className={s.isPublished ? "badge badge-green" : "badge badge-gray"} style={{ fontSize:10 }}>
                    {s.isPublished ? "Publiée" : "Brouillon"}
                  </span>
                </div>
              ))}
              {realShops.length === 0 && (
                <div style={{ textAlign:"center", fontSize:12, color:"#98A2B3", padding:"12px 0" }}>
                  Aucune boutique — créez-en une.
                </div>
              )}
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

      <CreateShopModal
        open={showCreateShop}
        onClose={() => setShowCreateShop(false)}
        onCreated={() => {
          setShowCreateShop(false);
          fetch("/api/shop?all=1").then(r=>r.json()).then(d=>setRealShops(d.data??[])).catch(()=>{});
        }}
      />

      <AddProductModal
        open={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        shopId={activeShopId || null}
        shopName={activeShop?.name ?? ""}
        categories={apiCategories}
        onCreated={() => { setShowAddProduct(false); refreshProducts(); }}
      />

      <EditProductModal
        open={editProduct !== null}
        onClose={() => setEditProduct(null)}
        shopId={activeShopId || null}
        shopName={activeShop?.name ?? ""}
        categories={apiCategories}
        product={editProduct}
        onUpdated={() => { setEditProduct(null); refreshProducts(); }}
      />

      <DeleteConfirmModal
        product={deleteProduct}
        shopId={activeShopId || null}
        onClose={() => setDeleteProduct(null)}
        onDeleted={() => { setDeleteProduct(null); refreshProducts(); }}
      />

      {showUpgrade && (
        <div
          style={{ position:"fixed", inset:0, background:"rgba(15,20,18,0.55)", zIndex:1000,
                   display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}
          onClick={() => setShowUpgrade(false)}
        >
          <div
            style={{ background:"#fff", borderRadius:20, padding:"32px 28px", maxWidth:420, width:"100%",
                     boxShadow:"0 20px 60px rgba(10,20,15,0.18)" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ textAlign:"center", marginBottom:20 }}>
              <div style={{ fontSize:40, marginBottom:8 }}>🔒</div>
              <h2 style={{ fontSize:20, fontWeight:800, color:"#1F2A24", margin:0 }}>Quota atteint</h2>
              <p style={{ fontSize:14, color:"#667085", marginTop:6, marginBottom:0 }}>
                Vous avez atteint la limite de produits de votre plan.
              </p>
            </div>

            {/* Usage actuel */}
            {quota && (
              <div style={{ background:"#F8FAF9", border:"1px solid #E8ECEA", borderRadius:12,
                            padding:"14px 16px", marginBottom:20 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <span style={{ fontSize:13, color:"#667085" }}>Plan actuel</span>
                  <span style={{ fontSize:13, fontWeight:700, color:"#1F2A24" }}>{quota.plan.displayName}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <span style={{ fontSize:13, color:"#667085" }}>Produits utilisés</span>
                  <span style={{ fontSize:13, fontWeight:700, color:"#EF4444" }}>
                    {quota.usage.products} / {quota.plan.maxProducts}
                  </span>
                </div>
                <div style={{ height:6, borderRadius:4, background:"#E8ECEA", overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:4, background:"#EF4444",
                                width:`${Math.min(100, (quota.usage.products / quota.plan.maxProducts) * 100)}%` }} />
                </div>
              </div>
            )}

            {/* Plan suivant */}
            {quota?.nextPlan ? (
              <div style={{ border:"2px solid #0A8F45", borderRadius:14, padding:"16px", marginBottom:20 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontSize:13, color:"#667085" }}>Passez au plan</div>
                    <div style={{ fontSize:18, fontWeight:800, color:"#1F2A24" }}>{quota.nextPlan.displayName}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:20, fontWeight:800, color:"#0A8F45" }}>
                      {quota.nextPlan.priceMonthly === 0 ? "Gratuit" : `${quota.nextPlan.priceMonthly.toLocaleString("fr-FR")} FCFA`}
                    </div>
                    {quota.nextPlan.priceMonthly > 0 && (
                      <div style={{ fontSize:11, color:"#98A2B3" }}>/mois</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background:"#EAF7EF", borderRadius:14, padding:"14px 16px", marginBottom:20,
                            fontSize:13, color:"#0A8F45", fontWeight:600, textAlign:"center" }}>
                Vous êtes déjà sur le plan le plus élevé.
              </div>
            )}

            {/* Actions */}
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {quota?.nextPlan && (
                <a
                  href="/settings"
                  style={{ display:"block", textAlign:"center", background:"#0A8F45", color:"#fff",
                           borderRadius:12, padding:"12px 0", fontSize:14, fontWeight:700,
                           textDecoration:"none" }}
                >
                  Passer au plan {quota.nextPlan.displayName} →
                </a>
              )}
              <button
                onClick={() => setShowUpgrade(false)}
                style={{ background:"none", border:"1px solid #E8ECEA", borderRadius:12, padding:"11px 0",
                         fontSize:14, color:"#667085", cursor:"pointer", fontWeight:500 }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

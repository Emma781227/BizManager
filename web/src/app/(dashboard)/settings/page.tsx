"use client";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import CreateShopModal from "../shops/CreateShopModal";
import { BarChart2, Package, Rocket, Store, ShoppingCart, Users, Tag, AlertTriangle, Link, Pencil, QrCode, Clock, Crown, Info } from "lucide-react";

type SettingsShop = {
  id: string; name: string; slug: string; isPublished: boolean;
  city: string | null; products: number; orders: number; clients: number;
  ca: string; color: string;
  whatsappNumber: string;
  category: string | null;
  regionCountry: string | null;
  description: string | null;
  address: string | null;
  openingHours: string | null;
  notificationEmail: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  paymentMethods: string[];
};

const PAYMENT_OPTIONS = [
  { id:"ORANGE_MONEY",     label:"Orange Money",      dot:"#FF8C00", bg:"#FFF4EC", border:"#FF8C00" },
  { id:"MTN_MOBILE_MONEY", label:"MTN Mobile Money",  dot:"#FFD700", bg:"#FFFBEA", border:"#FFD700" },
  { id:"CASH",             label:"Espèces",            dot:"#0A8F45", bg:"#EAF7EF", border:"#0A8F45" },
  { id:"BANK_TRANSFER",    label:"Virement bancaire",  dot:"#175CD3", bg:"#EFF8FF", border:"#175CD3" },
];

type SubscriptionQuota = {
  plan: {
    name: string;
    displayName: string;
    maxShops: number;
    maxProducts: number;
  };
  usage: {
    shops: number;
    products: number;
  };
  nextPlan: {
    name: string;
    displayName: string;
    priceMonthly: number;
  } | null;
};

const COLORS = ["#0A8F45", "#3B82F6", "#F08A24", "#8B5CF6", "#EC4899", "#14B8A6"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSettingsShop(sh: any, i: number): SettingsShop {
  return {
    id:                sh.id,
    name:              sh.name,
    slug:              sh.slug,
    isPublished:       sh.isPublished,
    city:              sh.city ?? null,
    products:          sh._count?.products  ?? 0,
    orders:            sh._count?.orders    ?? 0,
    clients:           sh._count?.customers ?? 0,
    ca:                "—",
    color:             COLORS[i % COLORS.length],
    whatsappNumber:    sh.whatsappNumber    ?? "",
    category:          sh.category          ?? null,
    regionCountry:     sh.regionCountry     ?? null,
    description:       sh.description       ?? null,
    address:           sh.address           ?? null,
    openingHours:      sh.openingHours      ?? null,
    notificationEmail: sh.notificationEmail ?? null,
    logoUrl:           sh.logoUrl           ?? null,
    coverUrl:          sh.coverUrl          ?? null,
    paymentMethods:    Array.isArray(sh.paymentMethods) ? sh.paymentMethods : [],
  };
}

const DAYS_LIST = [
  { code:"LUN", label:"Lun" },
  { code:"MAR", label:"Mar" },
  { code:"MER", label:"Mer" },
  { code:"JEU", label:"Jeu" },
  { code:"VEN", label:"Ven" },
  { code:"SAM", label:"Sam" },
  { code:"DIM", label:"Dim" },
];

const TIPS = [
  { icon:<BarChart2 size={16} color="#0A8F45" />, t:"Analysez chaque boutique",  d:"Suivez les performances individuelles pour mieux décider.",              link:"Voir les performances", href:"/dashboard" },
  { icon:<Package size={16} color="#0A8F45" />, t:"Optimisez votre catalogue", d:"Maintenez vos produits à jour et adaptez vos stocks à la demande.",     link:"Gérer les produits",    href:"/products"  },
  { icon:<Rocket size={16} color="#0A8F45" />, t:"Développez vos ventes",     d:"Utilisez WhatsApp et votre boutique en ligne pour booster vos ventes.", link:"Découvrir les outils",  href:"/whatsapp"  },
];

const CSS = `
.mb-wrap { padding:24px 28px; max-width:1280px; margin:0 auto; background:#F8FAF9; min-height:100vh; }
.mb-ctx  { display:flex; align-items:center; gap:14px; flex-wrap:wrap; margin-bottom:16px; }
.mb-kpi  { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:20px; }
.mb-main { display:grid; grid-template-columns:1fr 420px; gap:20px; margin-bottom:20px; }
.mb-right { display:flex; flex-direction:column; gap:16px; }
.mb-card { background:#fff; border:1px solid #E8ECEA; border-radius:18px; padding:20px; box-shadow:0 2px 10px rgba(16,24,40,.04); }
.mb-shop-row { border:1px solid #E8ECEA; border-radius:14px; padding:16px 18px; margin-bottom:12px; transition:box-shadow .15s; background:#fff; }
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
.badge { display:inline-flex; align-items:center; gap:4px; padding:3px 9px; border-radius:20px; font-size:11px; font-weight:600; white-space:nowrap; }
.badge-green { background:#DDF6E7; color:#0A8F45; }
.badge-gray  { background:#F2F4F7; color:#667085; }
.badge-biz   { background:#EAF7EF; color:#08763A; }
.sa-overlay { position:fixed; inset:0; background:rgba(15,20,18,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:16px; backdrop-filter:blur(2px); }
.sa-modal   { background:#fff; border-radius:20px; width:100%; max-width:440px; box-shadow:0 16px 48px rgba(16,24,40,0.14); overflow:hidden; }
.sa-header  { padding:20px 24px 16px; border-bottom:1px solid #E8ECEA; display:flex; align-items:center; gap:12px; }
.sa-section { padding:18px 24px; border-bottom:1px solid #F4F6F5; }
.sa-sec-title { font-size:11px; font-weight:700; color:#98A2B3; text-transform:uppercase; letter-spacing:.06em; margin-bottom:12px; }
.sa-toggle-card { display:flex; align-items:center; gap:14px; padding:14px 16px; border:1.5px solid #E8ECEA; border-radius:12px; cursor:pointer; transition:all .15s; user-select:none; }
.sa-toggle-card.on  { border-color:#0A8F45; background:#F6FFF9; }
.sa-toggle-card.off { border-color:#E8ECEA; background:#F8FAF9; }
.sa-sw { width:42px; height:24px; background:#E8ECEA; border-radius:999px; position:relative; transition:background .2s; flex-shrink:0; border:none; padding:0; cursor:pointer; outline:none; }
.sa-sw.on { background:#0A8F45; }
.sa-sw::after { content:''; position:absolute; top:4px; left:4px; width:16px; height:16px; background:#fff; border-radius:50%; transition:transform .2s; box-shadow:0 1px 3px rgba(0,0,0,.15); }
.sa-sw.on::after { transform:translateX(18px); }
.sa-inp { width:100%; height:40px; padding:0 12px; border:1.5px solid #E8ECEA; border-radius:10px; font-size:14px; color:#1F2A24; background:#fff; outline:none; box-sizing:border-box; transition:border-color .15s; }
.sa-inp:focus { border-color:#0A8F45; box-shadow:0 0 0 3px rgba(10,143,69,.08); }
.sa-link-btn { display:flex; align-items:center; gap:10px; width:100%; padding:12px 14px; background:#F8FAF9; border:1.5px solid #E8ECEA; border-radius:10px; font-size:13px; color:#1F2A24; font-weight:500; transition:background .12s; text-decoration:none; box-sizing:border-box; }
.sa-link-btn:hover:not(.disabled) { background:#EAF7EF; border-color:#C2E8D0; }
.sa-link-btn.disabled { opacity:.45; pointer-events:none; }
.sa-footer  { display:flex; justify-content:flex-end; padding:14px 24px; }
.sa-info-note { display:flex; align-items:flex-start; gap:8px; padding:10px 12px; background:#FFF8EC; border:1px solid #FFE5B0; border-radius:10px; font-size:12px; color:#92600A; margin-top:10px; line-height:1.5; }
.sa-err { font-size:12px; color:#D92D20; margin-top:6px; }
.inp { height:36px; padding:0 12px; border:1px solid #E8ECEA; border-radius:10px; font-size:13px; color:#1F2A24; background:#fff; outline:none; width:100%; box-sizing:border-box; }
.inp:focus { border-color:#0A8F45; }
.sel { height:36px; padding:0 10px; border:1px solid #E8ECEA; border-radius:10px; font-size:13px; color:#1F2A24; background:#fff; cursor:pointer; outline:none; }
.btn-primary   { height:36px; padding:0 16px; background:#0A8F45; color:#fff; border:none; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; white-space:nowrap; }
.btn-primary:hover:not(:disabled) { background:#08763A; }
.btn-primary:disabled { opacity:.55; cursor:default; }
.btn-secondary { height:36px; padding:0 14px; background:#fff; color:#1F2A24; border:1px solid #E8ECEA; border-radius:10px; font-size:13px; cursor:pointer; white-space:nowrap; }
.btn-secondary:hover { background:#F8FAF9; }
.btn-sm { height:30px; padding:0 12px; border-radius:8px; font-size:12px; cursor:pointer; }
.se-modal   { background:#fff; border-radius:20px; width:100%; max-width:600px; box-shadow:0 16px 48px rgba(16,24,40,0.14); overflow:hidden; max-height:90vh; display:flex; flex-direction:column; }
.se-body    { overflow-y:auto; flex:1; padding:20px 24px; }
.se-section { margin-bottom:20px; }
.se-sec-ttl { font-size:11px; font-weight:700; color:#98A2B3; text-transform:uppercase; letter-spacing:.06em; margin-bottom:12px; padding-bottom:6px; border-bottom:1px solid #F4F6F5; }
.se-field   { margin-bottom:12px; }
.se-label   { font-size:12px; font-weight:600; color:#1F2A24; display:block; margin-bottom:5px; }
.se-inp     { width:100%; height:38px; padding:0 12px; border:1.5px solid #E8ECEA; border-radius:10px; font-size:13px; color:#1F2A24; background:#fff; outline:none; box-sizing:border-box; transition:border-color .15s; }
.se-inp:focus { border-color:#0A8F45; box-shadow:0 0 0 3px rgba(10,143,69,.08); }
.se-ta      { width:100%; padding:10px 12px; border:1.5px solid #E8ECEA; border-radius:10px; font-size:13px; color:#1F2A24; background:#fff; outline:none; box-sizing:border-box; resize:vertical; font-family:inherit; transition:border-color .15s; }
.se-ta:focus { border-color:#0A8F45; box-shadow:0 0 0 3px rgba(10,143,69,.08); }
.se-cover-zone { width:100%; height:90px; border-radius:12px; overflow:hidden; border:2px dashed #C8E6D5; cursor:pointer; display:flex; align-items:center; justify-content:center; position:relative; background:#EAF7EF; }
.se-cover-zone img { width:100%; height:100%; object-fit:cover; }
.se-cover-overlay { position:absolute; inset:0; background:rgba(0,0,0,.3); display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity .15s; }
.se-cover-zone:hover .se-cover-overlay { opacity:1; }
.se-logo-zone  { width:72px; height:72px; border-radius:16px; overflow:hidden; border:2px dashed #C8E6D5; cursor:pointer; display:flex; align-items:center; justify-content:center; position:relative; background:#EAF7EF; flex-shrink:0; }
.se-logo-zone img { width:100%; height:100%; object-fit:cover; }
.se-logo-overlay { position:absolute; inset:0; background:rgba(0,0,0,.3); display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity .15s; }
.se-logo-zone:hover .se-logo-overlay { opacity:1; }
.se-err     { font-size:12px; color:#D92D20; margin-top:8px; padding:8px 12px; background:#FDE8E8; border-radius:8px; }
.se-footer  { padding:14px 24px; border-top:1px solid #E8ECEA; display:flex; gap:10px; justify-content:flex-end; background:#fff; }
@media(max-width:1100px){ .mb-kpi{grid-template-columns:repeat(2,1fr);} .mb-main{grid-template-columns:1fr;} .mb-tips{grid-template-columns:1fr 1fr;} }
@media(max-width:700px){ .mb-kpi{grid-template-columns:1fr 1fr;} .mb-tips{grid-template-columns:1fr;} .mb-wrap{padding:14px 12px;} .mb-ctx{flex-direction:column;align-items:flex-start;} }
`;

/* ─── ShopActionsModal ─────────────────────────────────────────────────────── */

function ShopActionsModal({
  shop,
  onClose,
  onToggled,
  onRenamed,
  onUpdated,
}: {
  shop: SettingsShop | null;
  onClose: () => void;
  onToggled: (id: string, isPublished: boolean) => void;
  onRenamed: (id: string, name: string) => void;
  onUpdated: (shop: SettingsShop) => void;
}) {
  const [view, setView] = useState<"main" | "edit">("main");

  /* ── Main view state ── */
  const [publishing, setPublishing] = useState(false);
  const [publishErr, setPublishErr] = useState("");
  const [renaming,   setRenaming]   = useState(false);
  const [nameInput,  setNameInput]  = useState("");
  const [renameErr,  setRenameErr]  = useState("");

  /* ── Edit view state ── */
  const [editName,        setEditName]        = useState("");
  const [editSlug,        setEditSlug]        = useState("");
  const [editCategory,    setEditCategory]    = useState("");
  const [editCity,        setEditCity]        = useState("");
  const [editRegion,      setEditRegion]      = useState("");
  const [editWhatsapp,    setEditWhatsapp]    = useState("");
  const [editNotifEmail,  setEditNotifEmail]  = useState("");
  const [editAddress,     setEditAddress]     = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editOpenDays,    setEditOpenDays]    = useState<string[]>([]);
  const [editOpenTime,    setEditOpenTime]    = useState("");
  const [editCloseTime,   setEditCloseTime]   = useState("");
  const [editPayMethods,  setEditPayMethods]  = useState<string[]>([]);
  const [logoUrl,         setLogoUrl]         = useState<string | null>(null);
  const [coverUrl,        setCoverUrl]        = useState<string | null>(null);
  const [logoFile,        setLogoFile]        = useState<File | null>(null);
  const [coverFile,       setCoverFile]       = useState<File | null>(null);
  const [editErr,         setEditErr]         = useState<string | null>(null);
  const [submitting,      setSubmitting]      = useState(false);
  const [qrOpen,          setQrOpen]          = useState(false);
  const [qrLoading,       setQrLoading]       = useState(false);
  const [qrDataUrl,       setQrDataUrl]       = useState<string | null>(null);
  const [qrError,         setQrError]         = useState<string | null>(null);

  const logoInputRef  = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (shop) {
      setNameInput(shop.name);
      setRenameErr("");
      setPublishErr("");
      /* pre-populate edit fields */
      setEditName(shop.name);
      setEditSlug(shop.slug);
      setEditCategory(shop.category ?? "");
      setEditCity(shop.city ?? "");
      setEditRegion(shop.regionCountry ?? "");
      setEditWhatsapp(shop.whatsappNumber ?? "");
      setEditNotifEmail(shop.notificationEmail ?? "");
      setEditAddress(shop.address ?? "");
      setEditDescription(shop.description ?? "");
      const rawHours = shop.openingHours ?? "";
      if (rawHours.includes("|")) {
        const [daysStr, timeRange] = rawHours.split("|");
        setEditOpenDays(daysStr.split(",").filter(Boolean));
        const m = timeRange.match(/^(\d{2}:\d{2})-(\d{2}:\d{2})$/);
        setEditOpenTime(m ? m[1] : "");
        setEditCloseTime(m ? m[2] : "");
      } else {
        setEditOpenDays([]);
        const m = rawHours.match(/^(\d{2}:\d{2})-(\d{2}:\d{2})$/);
        setEditOpenTime(m ? m[1] : "");
        setEditCloseTime(m ? m[2] : "");
      }
      setEditPayMethods(Array.isArray(shop.paymentMethods) ? shop.paymentMethods : []);
      setLogoUrl(shop.logoUrl ?? null);
      setCoverUrl(shop.coverUrl ?? null);
      setLogoFile(null);
      setCoverFile(null);
      setEditErr(null);
      setQrOpen(false);
      setQrLoading(false);
      setQrDataUrl(null);
      setQrError(null);
      setView("main");
    }
  }, [shop?.id]);

  useEffect(() => {
    if (!shop || !qrOpen) return;

    let cancelled = false;
    const activeShop = shop;
    const shopUrl = `${window.location.origin}/shop/${activeShop.slug}`;

    async function buildQr() {
      setQrLoading(true);
      setQrError(null);
      try {
        const baseQr = await QRCode.toDataURL(shopUrl, {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 280,
          color: {
            dark: "#145f38",
            light: "#FFFFFF",
          },
        });

        let finalQr = baseQr;

        if (activeShop.logoUrl) {
          try {
            const qrImage = await loadImage(baseQr);
            const logoSrc = new URL(activeShop.logoUrl, window.location.origin).toString();
            const logoImage = await loadImage(logoSrc);

            const size = 280;
            const canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Canvas non disponible");

            ctx.drawImage(qrImage, 0, 0, size, size);

            const badgeSize = 72;
            const logoSize = 52;
            const x = (size - badgeSize) / 2;
            const y = (size - badgeSize) / 2;

            // Pastille blanche au centre pour améliorer le contraste du logo.
            ctx.fillStyle = "#FFFFFF";
            roundRect(ctx, x, y, badgeSize, badgeSize, 16);
            ctx.fill();

            const lx = (size - logoSize) / 2;
            const ly = (size - logoSize) / 2;
            ctx.save();
            roundRect(ctx, lx, ly, logoSize, logoSize, 12);
            ctx.clip();
            ctx.drawImage(logoImage, lx, ly, logoSize, logoSize);
            ctx.restore();

            finalQr = canvas.toDataURL("image/png");
          } catch {
            // Si le logo ne peut pas être rendu (CORS, URL invalide...), on garde le QR simple.
          }
        }

        if (!cancelled) {
          setQrDataUrl(finalQr);
        }
      } catch (error) {
        if (!cancelled) {
          setQrError(error instanceof Error ? error.message : "Impossible de générer le QR code");
          setQrDataUrl(null);
        }
      } finally {
        if (!cancelled) setQrLoading(false);
      }
    }

    void buildQr();
    return () => {
      cancelled = true;
    };
  }, [shop, qrOpen]);

  function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Image non chargee"));
      img.src = src;
    });
  }

  if (!shop) return null;
  const currentShop = shop;

  /* ── Main view handlers ── */

  async function handleToggle() {
    if (publishing) return;
    setPublishing(true);
    setPublishErr("");
    const next = !shop!.isPublished;
    try {
      const res = await fetch(`/api/shop?shopId=${shop!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: next }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur serveur");
      onToggled(shop!.id, next);
    } catch (err) {
      setPublishErr(err instanceof Error ? err.message : "Erreur serveur");
    } finally {
      setPublishing(false);
    }
  }

  async function handleRename() {
    if (!shop) return;
    const trimmed = nameInput.trim();
    if (trimmed.length < 2) { setRenameErr("Nom trop court (minimum 2 caractères)"); return; }
    if (trimmed.length > 100) { setRenameErr("Nom trop long (maximum 100 caractères)"); return; }
    if (trimmed === shop.name) { onClose(); return; }
    setRenaming(true);
    setRenameErr("");
    try {
      const res = await fetch(`/api/shop?shopId=${shop.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur serveur");
      if (shop) onRenamed(shop.id, trimmed);
    } catch (err) {
      setRenameErr(err instanceof Error ? err.message : "Erreur serveur");
    } finally {
      setRenaming(false);
    }
  }

  /* ── Edit view handler ── */

  async function handleEditSubmit() {
    if (!shop) return;
    setEditErr(null);
    const name = editName.trim();
    const slug = editSlug.trim().toLowerCase();
    const whatsapp = editWhatsapp.trim();

    if (name.length < 2) { setEditErr("Le nom doit faire au moins 2 caractères."); return; }
    if (slug.length < 3) { setEditErr("Le slug doit faire au moins 3 caractères."); return; }
    if (!/^[a-z0-9-]+$/.test(slug)) { setEditErr("Le slug ne peut contenir que des lettres minuscules, chiffres et tirets."); return; }
    if (!whatsapp) { setEditErr("Le numéro WhatsApp est requis."); return; }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("slug", slug);
      fd.append("whatsappNumber", whatsapp);
      fd.append("city", editCity.trim());
      fd.append("regionCountry", editRegion.trim());
      fd.append("category", editCategory.trim());
      fd.append("description", editDescription.trim());
      fd.append("address", editAddress.trim());
      const hoursStr = editOpenDays.length > 0 && editOpenTime && editCloseTime
        ? `${editOpenDays.join(",")}|${editOpenTime}-${editCloseTime}`
        : editOpenTime && editCloseTime
        ? `${editOpenTime}-${editCloseTime}`
        : "";
      fd.append("openingHours", hoursStr);
      fd.append("paymentMethods", JSON.stringify(editPayMethods));
      fd.append("notificationEmail", editNotifEmail.trim());
      fd.append("isPublished", String(shop.isPublished));
      if (logoFile) fd.append("logoFile", logoFile);
      else fd.append("logoUrl", logoUrl ?? "");
      if (coverFile) fd.append("coverFile", coverFile);
      else fd.append("coverUrl", coverUrl ?? "");

      const res = await fetch(`/api/shop?shopId=${shop.id}`, { method: "PUT", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur serveur");
      onUpdated(json.data);
      setView("main");
    } catch (err) {
      setEditErr(err instanceof Error ? err.message : "Erreur serveur");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleShareQrCode() {
    if (!shop) return;

    const shopUrl = `${window.location.origin}/shop/${shop.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: shop.name,
          text: `Découvrez la boutique ${shop.name}`,
          url: shopUrl,
        });
        return;
      } catch {
        // fallback below
      }
    }

    try {
      await navigator.clipboard.writeText(shopUrl);
      setQrError("Lien de la boutique copié dans le presse-papiers. Ouvrez le QR pour le partager visuellement.");
    } catch {
      setQrError("Impossible de partager automatiquement. Ouvrez le QR code pour le télécharger.");
    }
    setQrOpen(true);
  }

  function handleDownloadQr() {
    if (!qrDataUrl || !shop) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `qr-${shop.slug}.png`;
    link.click();
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoUrl(URL.createObjectURL(file));
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverUrl(URL.createObjectURL(file));
  }

  const published = shop.isPublished;

  /* ── Edit view ── */
  if (view === "edit") {
    return (
      <div className="sa-overlay" onClick={onClose}>
        <div className="se-modal" onClick={e => e.stopPropagation()}>

          {/* Edit header */}
          <div className="sa-header">
            <button
              type="button"
              onClick={() => setView("main")}
              style={{ background:"none", border:"none", cursor:"pointer", color:"#1F2A24", fontSize:18, lineHeight:1, padding:4, marginRight:4, display:"flex", alignItems:"center" }}>
              ←
            </button>
            <div style={{ flex:1, fontWeight:700, fontSize:15, color:"#1F2A24" }}>Modifier la boutique</div>
            <button
              onClick={onClose}
              style={{ background:"none", border:"none", cursor:"pointer", color:"#98A2B3", fontSize:20, lineHeight:1, padding:4 }}>
              ✕
            </button>
          </div>

          {/* Edit body */}
          <div className="se-body">

            {/* Informations générales */}
            <div className="se-section">
              <div className="se-sec-ttl">Informations générales</div>

              <div className="se-field">
                <label className="se-label">Nom *</label>
                <input
                  className="se-inp"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Nom de la boutique"
                  maxLength={100}
                />
              </div>

              <div className="se-field">
                <label className="se-label">Slug * <span style={{ fontWeight:400, color:"#98A2B3" }}>(URL de votre boutique)</span></label>
                <input
                  className="se-inp"
                  value={editSlug}
                  onChange={e => setEditSlug(e.target.value.toLowerCase())}
                  placeholder="mon-nom-boutique"
                  maxLength={80}
                />
                <div style={{ fontSize:11, color:"#98A2B3", marginTop:4 }}>
                  {editSlug.trim() ? `/shop/${editSlug.trim().toLowerCase()}` : "/shop/votre-slug"}
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div className="se-field" style={{ marginBottom:0 }}>
                  <label className="se-label">Secteur</label>
                  <input
                    className="se-inp"
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value)}
                    placeholder="ex: Alimentation"
                  />
                </div>
                <div className="se-field" style={{ marginBottom:0 }}>
                  <label className="se-label">Ville</label>
                  <input
                    className="se-inp"
                    value={editCity}
                    onChange={e => setEditCity(e.target.value)}
                    placeholder="ex: Dakar"
                  />
                </div>
              </div>

              <div className="se-field" style={{ marginTop:10 }}>
                <label className="se-label">Pays / Région</label>
                <input
                  className="se-inp"
                  value={editRegion}
                  onChange={e => setEditRegion(e.target.value)}
                  placeholder="ex: Sénégal"
                />
              </div>
            </div>

            {/* Contact */}
            <div className="se-section">
              <div className="se-sec-ttl">Contact</div>

              <div className="se-field">
                <label className="se-label">Numéro WhatsApp *</label>
                <input
                  className="se-inp"
                  value={editWhatsapp}
                  onChange={e => setEditWhatsapp(e.target.value)}
                  placeholder="+221771234567"
                />
              </div>

              <div className="se-field">
                <label className="se-label">Email de notification</label>
                <input
                  className="se-inp"
                  type="email"
                  value={editNotifEmail}
                  onChange={e => setEditNotifEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                />
              </div>

              <div className="se-field" style={{ marginBottom:0 }}>
                <label className="se-label">Adresse</label>
                <input
                  className="se-inp"
                  value={editAddress}
                  onChange={e => setEditAddress(e.target.value)}
                  placeholder="Rue, quartier…"
                />
              </div>
            </div>

            {/* Images */}
            <div className="se-section">
              <div className="se-sec-ttl">Images</div>

              {/* Cover */}
              <div className="se-field">
                <label className="se-label">Image de couverture</label>
                <div
                  className="se-cover-zone"
                  onClick={() => coverInputRef.current?.click()}
                  role="button"
                  aria-label="Changer l'image de couverture">
                  {coverUrl
                    ? <img src={coverUrl} alt="Couverture" />
                    : <div style={{ background:"linear-gradient(135deg,#EAF7EF,#C8E6D5)", width:"100%", height:"100%" }} />
                  }
                  <div className="se-cover-overlay">
                    <span style={{ color:"#fff", fontSize:13, fontWeight:600 }}>Changer</span>
                  </div>
                </div>
                <div style={{ fontSize:11, color:"#98A2B3", marginTop:4 }}>Changer l'image de couverture</div>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display:"none" }}
                  onChange={handleCoverChange}
                />
              </div>

              {/* Logo */}
              <div className="se-field" style={{ marginBottom:0 }}>
                <label className="se-label">Logo</label>
                <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <div
                    className="se-logo-zone"
                    onClick={() => logoInputRef.current?.click()}
                    role="button"
                    aria-label="Changer le logo">
                    {logoUrl
                      ? <img src={logoUrl} alt="Logo" />
                      : <Tag size={28} color="#98A2B3" />
                    }
                    <div className="se-logo-overlay">
                      <span style={{ color:"#fff", fontSize:11, fontWeight:600 }}>Changer</span>
                    </div>
                  </div>
                  <div style={{ fontSize:12, color:"#667085" }}>Changer le logo</div>
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display:"none" }}
                  onChange={handleLogoChange}
                />
              </div>
            </div>

            {/* Description & horaires */}
            <div className="se-section" style={{ marginBottom:0 }}>
              <div className="se-sec-ttl">Description &amp; horaires</div>

              <div className="se-field">
                <label className="se-label">Description</label>
                <textarea
                  className="se-ta"
                  rows={3}
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  placeholder="Décrivez votre boutique…"
                />
              </div>

              <div className="se-field" style={{ marginBottom:0 }}>
                <label className="se-label">Jours d&apos;ouverture</label>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:10 }}>
                  {DAYS_LIST.map(d => (
                    <button key={d.code} type="button"
                      onClick={() => setEditOpenDays(prev => prev.includes(d.code) ? prev.filter(x=>x!==d.code) : [...prev, d.code])}
                      style={{
                        padding:"5px 10px", borderRadius:7, fontSize:12, fontWeight:600,
                        border:"1.5px solid",
                        borderColor: editOpenDays.includes(d.code) ? "#0A8F45" : "#E8ECEA",
                        background: editOpenDays.includes(d.code) ? "#EAF7EF" : "#fff",
                        color: editOpenDays.includes(d.code) ? "#0A8F45" : "#667085",
                        cursor:"pointer"
                      }}>
                      {d.label}
                    </button>
                  ))}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:8 }}>
                  <div>
                    <div style={{ fontSize:11, color:"#667085", marginBottom:4 }}>Ouverture</div>
                    <input
                      type="time"
                      className="se-inp"
                      value={editOpenTime}
                      onChange={e => setEditOpenTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize:11, color:"#667085", marginBottom:4 }}>Fermeture</div>
                    <input
                      type="time"
                      className="se-inp"
                      value={editCloseTime}
                      onChange={e => setEditCloseTime(e.target.value)}
                    />
                  </div>
                </div>
                {editOpenDays.length > 0 && editOpenTime && editCloseTime ? (
                  <div style={{ fontSize:12, color:"#0A8F45", background:"#EAF7EF", borderRadius:8, padding:"6px 10px", display:"inline-flex", alignItems:"center", gap:6 }}>
                    <Clock size={13} style={{marginRight:4,verticalAlign:"middle"}} />{editOpenDays.join(", ")} · <strong>{editOpenTime}</strong> – <strong>{editCloseTime}</strong>
                  </div>
                ) : (
                  <div style={{ fontSize:11, color:"#98A2B3" }}>Sélectionnez les jours et les horaires.</div>
                )}
              </div>
            </div>

            {/* Moyens de paiement */}
            <div className="se-section" style={{ marginBottom:0, marginTop:20 }}>
              <div className="se-sec-ttl">Moyens de paiement acceptés</div>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                {PAYMENT_OPTIONS.map(p => (
                  <div key={p.id}
                    onClick={() => setEditPayMethods(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                    style={{
                      display:"flex", flexDirection:"column", alignItems:"center", gap:8,
                      padding:"12px 10px",
                      border:`2px solid ${editPayMethods.includes(p.id) ? p.border : "#E8ECEA"}`,
                      borderRadius:12, cursor:"pointer",
                      background: editPayMethods.includes(p.id) ? p.bg : "#fff",
                      flex:1, minWidth:110, transition:"all .15s"
                    }}>
                    <span style={{ width:12, height:12, borderRadius:"50%", background:p.dot, display:"inline-block" }} />
                    <span style={{ fontSize:12, fontWeight:600, color:"#1F2A24", textAlign:"center" }}>{p.label}</span>
                    <div style={{
                      width:16, height:16, borderRadius:4,
                      border:`2px solid ${editPayMethods.includes(p.id) ? p.border : "#E8ECEA"}`,
                      background: editPayMethods.includes(p.id) ? p.border : "#fff",
                      display:"flex", alignItems:"center", justifyContent:"center"
                    }}>
                      {editPayMethods.includes(p.id) && <span style={{ color:"#fff", fontSize:10, fontWeight:800 }}>✓</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {editErr && <div className="se-err" style={{ marginTop:16 }}>{editErr}</div>}

          </div>

          {/* Edit footer */}
          <div className="se-footer">
            <button
              type="button"
              className="btn-secondary"
              style={{ height:38, padding:"0 16px", fontSize:13 }}
              onClick={() => setView("main")}
              disabled={submitting}>
              Annuler
            </button>
            <button
              type="button"
              className="btn-primary"
              style={{ height:38, padding:"0 20px", fontSize:13 }}
              onClick={handleEditSubmit}
              disabled={submitting}>
              {submitting ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>

        </div>
      </div>
    );
  }

  /* ── Main view ── */
  return (
    <>
      <div className="sa-overlay" onClick={onClose}>
        <div className="sa-modal" onClick={e => e.stopPropagation()}>
          <div className="sa-header">
            <div className="mb-shop-av" style={{ background: currentShop.color, width:40, height:40, fontSize:13 }}>
              {currentShop.name.slice(0,2).toUpperCase()}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:15, color:"#1F2A24", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {currentShop.name}
              </div>
              <span className={published ? "badge badge-green" : "badge badge-gray"} style={{ fontSize:10, marginTop:2 }}>
                {published ? "● Publiée" : "○ Brouillon"}
              </span>
            </div>
            <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"#98A2B3", fontSize:20, lineHeight:1, padding:4 }}>
              ✕
            </button>
          </div>

          <div className="sa-section">
            <div className="sa-sec-title">Visibilité</div>
            <div className={`sa-toggle-card ${published ? "on" : "off"}`} onClick={handleToggle} style={{ opacity: publishing ? 0.65 : 1 }}>
              <button
                type="button"
                className={`sa-sw${published ? " on" : ""}`}
                onClick={e => { e.stopPropagation(); handleToggle(); }}
                disabled={publishing}
                aria-label={published ? "Dépublier la boutique" : "Publier la boutique"}
              />
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:13, color:"#1F2A24" }}>
                  {publishing ? "Mise à jour…" : published ? "Boutique publiée" : "Boutique en brouillon"}
                </div>
                <div style={{ fontSize:11, color:"#667085", marginTop:2 }}>
                  {published ? "Visible par vos clients sur le web" : "Non visible — accessible seulement par vous"}
                </div>
              </div>
            </div>
            {publishErr && <div className="sa-err">{publishErr}</div>}
            <div className="sa-info-note">
              <span style={{ flexShrink:0, color:"#F08A24" }}><AlertTriangle size={16} /></span>
              <span>Une boutique dépubliée reste comptabilisée dans votre quota de plan.</span>
            </div>
          </div>

          <div className="sa-section">
            <div className="sa-sec-title">Renommer</div>
            <div style={{ display:"flex", gap:8 }}>
              <input
                className="sa-inp"
                value={nameInput}
                onChange={e => { setNameInput(e.target.value); setRenameErr(""); }}
                onKeyDown={e => e.key === "Enter" && handleRename()}
                placeholder="Nom de la boutique"
                maxLength={100}
              />
              <button type="button" className="btn-primary" style={{ height:40, padding:"0 16px", flexShrink:0, fontSize:13 }} onClick={handleRename} disabled={renaming || nameInput.trim() === currentShop.name || nameInput.trim().length < 2}>
                {renaming ? "…" : "Sauvegarder"}
              </button>
            </div>
            {renameErr && <div className="sa-err">{renameErr}</div>}
          </div>

          <div className="sa-section">
            <div className="sa-sec-title">Accès rapide</div>
            <a href={`/shop/${currentShop.slug}`} target="_blank" rel="noreferrer" className={`sa-link-btn${published ? "" : " disabled"}`}>
              <span style={{ color:"#667085" }}><Link size={16} /></span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600 }}>Voir la boutique publique</div>
                <div style={{ fontSize:11, color:"#98A2B3" }}>/shop/{currentShop.slug}</div>
              </div>
              <span style={{ fontSize:11, color:"#98A2B3" }}>↗</span>
            </a>
            {!published && <div style={{ fontSize:11, color:"#98A2B3", marginTop:6 }}>Publiez la boutique pour activer ce lien.</div>}
          </div>

          <div className="sa-section" style={{ borderBottom:"none" }}>
            <div className="sa-sec-title">Informations de la boutique</div>
            <button type="button" className="sa-link-btn" style={{ cursor:"pointer", border:"none", width:"100%", textAlign:"left" }} onClick={() => setView("edit")}>
              <span style={{ color:"#667085" }}><Pencil size={16} /></span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600 }}>Modifier les informations</div>
                <div style={{ fontSize:11, color:"#98A2B3" }}>Nom, logo, cover, WhatsApp, horaires…</div>
              </div>
              <span style={{ fontSize:11, color:"#98A2B3" }}>→</span>
            </button>
            <button type="button" className="sa-link-btn" style={{ cursor:"pointer", border:"none", width:"100%", textAlign:"left", marginTop:10 }} onClick={() => setQrOpen(true)}>
              <span style={{ color:"#667085" }}><QrCode size={16} /></span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600 }}>Partager le QR code</div>
                <div style={{ fontSize:11, color:"#98A2B3" }}>Afficher, télécharger ou partager le QR de la boutique</div>
              </div>
              <span style={{ fontSize:11, color:"#98A2B3" }}>→</span>
            </button>
          </div>

          <div className="sa-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Fermer</button>
          </div>
        </div>
      </div>

      {qrOpen && (
        <div className="sa-overlay" onClick={() => setQrOpen(false)}>
          <div className="sa-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="sa-header">
              <div className="mb-shop-av" style={{ background: currentShop.color, width:40, height:40, fontSize:13 }}>
                {currentShop.name.slice(0,2).toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:15, color:"#1F2A24" }}>QR code de la boutique</div>
                <div style={{ fontSize:11, color:"#98A2B3", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  /shop/{currentShop.slug}
                </div>
              </div>
              <button onClick={() => setQrOpen(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"#98A2B3", fontSize:20, lineHeight:1, padding:4 }}>
                ✕
              </button>
            </div>

            <div className="sa-section" style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:14 }}>
              {qrLoading && <div style={{ color:"#667085", fontSize:13 }}>Génération du QR code…</div>}
              {qrError && <div className="sa-err" style={{ width:"100%" }}>{qrError}</div>}
              {qrDataUrl && !qrLoading && (
                <>
                  <div style={{ width:260, height:260, borderRadius:18, padding:14, background:"#fff", border:"1px solid #E8ECEA", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <img src={qrDataUrl} alt={`QR code de ${currentShop.name}`} style={{ width:"100%", height:"100%", objectFit:"contain" }} />
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontWeight:700, color:"#1F2A24", fontSize:14 }}>{currentShop.name}</div>
                    <div style={{ fontSize:12, color:"#667085", marginTop:4 }}>
                      Partagez ce QR code pour ouvrir la boutique directement.
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="sa-footer" style={{ justifyContent:"space-between" }}>
              <button type="button" className="btn-secondary" onClick={handleShareQrCode}>Partager</button>
              <div style={{ display:"flex", gap:10 }}>
                <button type="button" className="btn-secondary" onClick={handleDownloadQr} disabled={!qrDataUrl}>Télécharger</button>
                <button type="button" className="btn-primary" onClick={() => setQrOpen(false)}>Fermer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Page principale ──────────────────────────────────────────────────────── */

export default function ShopsPage() {
  const [activeId, setActiveId]       = useState("");
  const [period, setPeriod]           = useState("30d");
  const [createOpen, setCreateOpen]   = useState(false);
  const [shops, setShops]             = useState<SettingsShop[]>([]);
  const [loading, setLoading]         = useState(true);
  const [quota, setQuota]             = useState<SubscriptionQuota | null>(null);
  const [actionsShop, setActionsShop] = useState<SettingsShop | null>(null);
  const [upgrading, setUpgrading]     = useState(false);
  const [upgradeErr, setUpgradeErr]   = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/shop?all=1").then(r => r.json()),
      fetch("/api/subscription").then(r => r.json()),
    ])
      .then(([shopsData, quotaData]) => {
        const list: SettingsShop[] = (shopsData.data ?? []).map(toSettingsShop);
        setShops(list);
        if (list.length > 0) setActiveId(list[0].id);
        if (quotaData?.plan) setQuota(quotaData as SubscriptionQuota);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function onToggled(id: string, isPublished: boolean) {
    setShops(prev => prev.map(s => s.id === id ? { ...s, isPublished } : s));
    setActionsShop(prev => prev?.id === id ? { ...prev, isPublished } : prev);
  }

  function onRenamed(id: string, name: string) {
    setShops(prev => prev.map(s => s.id === id ? { ...s, name } : s));
    setActionsShop(prev => prev?.id === id ? { ...prev, name } : prev);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function upgradePlan(planName: string, displayName: string) {
    if (!confirm(`Passer au plan ${displayName} ? Votre abonnement sera mis à jour immédiatement.`)) return;
    setUpgrading(true);
    setUpgradeErr(null);
    try {
      const res = await fetch("/api/subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur serveur");
      const subRes = await fetch("/api/subscription");
      const subData = await subRes.json();
      if (subData.plan) setQuota(subData as SubscriptionQuota);
    } catch (err) {
      setUpgradeErr(err instanceof Error ? err.message : "Erreur serveur");
    } finally {
      setUpgrading(false);
    }
  }

  function onUpdated(raw: any) {
    setShops(prev => prev.map((s, i) =>
      s.id === raw.id ? { ...toSettingsShop(raw, i), color: COLORS[i % COLORS.length] } : s
    ));
    setActionsShop(prev => {
      if (!prev || prev.id !== raw.id) return prev;
      const idx = shops.findIndex(s => s.id === raw.id);
      return { ...toSettingsShop(raw, idx >= 0 ? idx : 0), color: prev.color };
    });
  }

  const totalProducts = shops.reduce((s, sh) => s + sh.products, 0);
  const totalOrders   = shops.reduce((s, sh) => s + sh.orders,   0);
  const totalClients  = shops.reduce((s, sh) => s + sh.clients,  0);
  const publishedShops = shops.filter(s => s.isPublished).length;
  const activityCards = [
    { label:"Boutiques publiées", value:String(publishedShops), note:`sur ${shops.length} boutique${shops.length !== 1 ? "s" : ""}` },
    { label:"Produits total",     value:String(totalProducts),  note:"sur toutes vos boutiques" },
    { label:"Commandes total",    value:String(totalOrders),    note:"sur toutes vos boutiques" },
    { label:"Clients total",      value:String(totalClients),   note:"sur toutes vos boutiques" },
  ];

  return (
    <>
      <style>{CSS}</style>
      <CreateShopModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => { setCreateOpen(false); fetch("/api/shop?all=1").then(r=>r.json()).then(d=>{ const list=(d.data??[]).map(toSettingsShop); setShops(list); }); }}
      />
      <ShopActionsModal
        shop={actionsShop}
        onClose={() => setActionsShop(null)}
        onToggled={onToggled}
        onRenamed={onRenamed}
        onUpdated={onUpdated}
      />

      <div className="mb-wrap">

        {/* Context bar */}
        <div className="mb-ctx">
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:12, color:"#667085", fontWeight:500 }}>Boutique active</span>
            <select className="sel" style={{ fontWeight:700, color:"#0A8F45", borderColor:"#0A8F45", minWidth:160 }}
              value={activeId} onChange={e => setActiveId(e.target.value)}
              disabled={shops.length === 0}>
              {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span className="badge badge-biz" style={{ padding:"5px 12px", fontSize:12 }}>Plan Business</span>
            <span style={{ fontSize:12, color:"#667085", fontWeight:500 }}>
              {quota ? `${quota.plan.displayName} · ${quota.usage.shops} / ${quota.plan.maxShops === -1 ? "∞" : quota.plan.maxShops} boutiques utilisées` : `${shops.length} boutiques utilisées`}
            </span>
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
            { icon:<Store size={16} color="#0A8F45" />, l:"Total boutiques",  v: quota ? `${quota.usage.shops} / ${quota.plan.maxShops === -1 ? "∞" : quota.plan.maxShops}` : String(shops.length), s:"Utilisées", i: quota ? `Limite selon votre plan ${quota.plan.displayName}` : "" },
            { icon:<Package size={16} color="#0A8F45" />, l:"Total produits",   v:String(totalProducts), s:"Sur toutes vos boutiques", i:"" },
            { icon:<ShoppingCart size={16} color="#0A8F45" />, l:"Total commandes",  v:String(totalOrders),   s:"Sur toutes vos boutiques", i:"" },
            { icon:<Users size={16} color="#0A8F45" />, l:"Total clients",    v:String(totalClients),  s:"Sur toutes vos boutiques", i:"" },
          ].map(k => (
            <div key={k.l} style={{ background:"#fff", border:"1px solid #E8ECEA", borderRadius:16,
              padding:"16px 18px", boxShadow:"0 2px 10px rgba(16,24,40,.04)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                <span style={{ fontSize:13, color:"#667085", fontWeight:500 }}>{k.l}</span>
                <span>{k.icon}</span>
              </div>
              <div style={{ fontSize:26, fontWeight:800, color:"#1F2A24", letterSpacing:"-0.5px" }}>{k.v}</div>
              <div style={{ fontSize:11, color:"#0A8F45", fontWeight:500, marginTop:3 }}>{k.s}</div>
              {k.i && <div style={{ fontSize:10, color:"#98A2B3", marginTop:4 }}>{k.i}</div>}
            </div>
          ))}
        </div>

        {/* Main 2-col */}
        <div className="mb-main">

          {/* Left: boutiques list */}
          <div className="mb-card">
            <div style={{ fontWeight:700, color:"#1F2A24", fontSize:15, marginBottom:16 }}>Toutes mes boutiques</div>

            {loading && (
              <div style={{ textAlign:"center", padding:"32px 0", color:"#98A2B3", fontSize:14 }}>
                Chargement…
              </div>
            )}

            {!loading && shops.length === 0 && (
              <div style={{ textAlign:"center", padding:"32px 0", color:"#98A2B3", fontSize:14 }}>
                Aucune boutique — créez-en une ci-dessous.
              </div>
            )}

            {shops.map(shop => (
              <div key={shop.id} className={`mb-shop-row${shop.id === activeId ? " is-active" : ""}`}>
                <div className="mb-shop-top">
                  <div className="mb-shop-av" style={{ background: shop.color }}>
                    {shop.name.slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
                      <span style={{ fontWeight:700, fontSize:14, color:"#1F2A24" }}>{shop.name}</span>
                      {shop.id === activeId && <span className="badge badge-green" style={{ fontSize:10 }}>Active</span>}
                      <span className={shop.isPublished ? "badge badge-green" : "badge badge-gray"} style={{ fontSize:10 }}>
                        {shop.isPublished ? "Publiée" : "Brouillon"}
                      </span>
                    </div>
                    <div style={{ fontSize:11, color:"#98A2B3", marginTop:2 }}>
                      /shop/{shop.slug}{shop.city ? ` · ${shop.city}` : ""}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
                    <button type="button" className="btn-primary btn-sm"
                      style={{ background: shop.id === activeId ? "#08763A" : "#0A8F45" }}
                      onClick={() => setActiveId(shop.id)}>
                      Gérer
                    </button>
                    <button type="button" className="btn-secondary btn-sm"
                      onClick={() => setActionsShop(shop)}
                      title="Options de la boutique">
                      ···
                    </button>
                  </div>
                </div>

                <div className="mb-shop-kpis">
                  {[
                    { l:"Produits",  v: String(shop.products) },
                    { l:"Commandes", v: String(shop.orders)   },
                    { l:"Clients",   v: String(shop.clients)  },
                    { l:"CA",        v: shop.ca               },
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
                <span className="badge badge-biz" style={{ padding:"5px 14px", fontSize:12 }}>Plan {quota?.plan.displayName ?? "Business"}</span>
                <span style={{ fontSize:12, color:"#667085" }}>
                  Jusqu'à {quota ? (quota.plan.maxShops === -1 ? "∞" : quota.plan.maxShops) : 3} boutiques
                </span>
              </div>
              <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:2 }}>
                <span style={{ fontSize:38, fontWeight:800, color:"#1F2A24", letterSpacing:"-1px" }}>{quota ? quota.usage.shops : shops.length}</span>
                <span style={{ fontSize:22, color:"#98A2B3" }}>/ {quota ? (quota.plan.maxShops === -1 ? "∞" : quota.plan.maxShops) : 3}</span>
                <span style={{ fontSize:13, color:"#667085", marginLeft:8 }}>boutiques utilisées</span>
              </div>
              <div className="mb-prog">
                <div className="mb-prog-bar" style={{ width:`${quota && quota.plan.maxShops > 0 ? Math.min(100, Math.round((quota.usage.shops / quota.plan.maxShops) * 100)) : Math.round((shops.length / 3) * 100)}%` }} />
              </div>
              <div style={{ fontSize:11, color:"#98A2B3", marginBottom:16 }}>
                {quota && quota.plan.maxShops !== -1
                  ? `${Math.round((quota.usage.shops / quota.plan.maxShops) * 100)}% du quota utilisé · ${Math.max(0, quota.plan.maxShops - quota.usage.shops)} boutique${Math.max(0, quota.plan.maxShops - quota.usage.shops) !== 1 ? "s" : ""} restante${Math.max(0, quota.plan.maxShops - quota.usage.shops) !== 1 ? "s" : ""}`
                  : `${shops.length} boutique${shops.length !== 1 ? "s" : ""} active${shops.length !== 1 ? "s" : ""}`}
              </div>
              {quota?.nextPlan && (
                <div style={{ background:"#EAF7EF", border:"1px solid #C8E6D5", borderRadius:12, padding:"14px 16px" }}>
                  <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                    <span style={{ color:"#F08A24" }}><Crown size={20} /></span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, color:"#1F2A24", fontSize:13, marginBottom:4 }}>
                        Passez au plan {quota.nextPlan.displayName}
                      </div>
                      <div style={{ fontSize:12, color:"#667085", marginBottom:10 }}>
                        {quota.nextPlan.name === "business"
                          ? "Gérez jusqu'à 3 boutiques et 500 produits."
                          : "Gérez jusqu'à 10 boutiques et un catalogue illimité."}
                      </div>
                      <button
                        onClick={() => upgradePlan(quota!.nextPlan!.name, quota!.nextPlan!.displayName)}
                        disabled={upgrading}
                        style={{ fontSize:12, fontWeight:600, color:"#fff", background:"#0A8F45", border:"none", borderRadius:8, padding:"6px 14px", cursor: upgrading ? "not-allowed" : "pointer", opacity: upgrading ? 0.7 : 1 }}>
                        {upgrading ? "Mise à jour…" : `Passer au ${quota.nextPlan.displayName} →`}
                      </button>
                      {upgradeErr && <div style={{ fontSize:11, color:"#EF4444", marginTop:6 }}>{upgradeErr}</div>}
                    </div>
                  </div>
                </div>
              )}
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
              {activityCards.map(a => (
                <div key={a.label} className="mb-act-row">
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, color:"#98A2B3" }}>{a.label}</div>
                    <div style={{ fontWeight:700, color:"#1F2A24", fontSize:14 }}>{a.value}</div>
                    <div style={{ fontSize:11, color:"#667085", marginTop:2 }}>{a.note}</div>
                  </div>
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
                <div style={{ marginBottom:8 }}>{t.icon}</div>
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

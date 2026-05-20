"use client";
import React, { useEffect, useState } from "react";
import { AlertTriangle, Info, Image, Tag, Clock } from "lucide-react";

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
.sm-overlay { position:fixed; inset:0; background:rgba(15,20,18,0.55); z-index:2000; display:flex; align-items:center; justify-content:center; padding:16px; backdrop-filter:blur(2px); }
.sm-modal   { background:#fff; border-radius:20px; width:100%; max-width:900px; max-height:92vh; overflow-y:auto; box-shadow:0 16px 48px rgba(16,24,40,0.14); }
.sm-header  { display:flex; align-items:flex-start; justify-content:space-between; padding:24px 28px 18px; border-bottom:1px solid #E8ECEA; position:sticky; top:0; background:#fff; z-index:1; }
.sm-body    { padding:24px 28px; display:flex; flex-direction:column; gap:22px; }
.sm-footer  { display:flex; justify-content:flex-end; gap:12px; padding:16px 28px 24px; border-top:1px solid #E8ECEA; position:sticky; bottom:0; background:#fff; z-index:1; }
.sm-label   { font-size:13px; font-weight:600; color:#1F2A24; margin-bottom:6px; display:block; }
.sm-input   { width:100%; height:40px; padding:0 12px; border:1.5px solid #E8ECEA; border-radius:10px; font-size:14px; color:#1F2A24; background:#fff; outline:none; box-sizing:border-box; transition:border-color .15s, box-shadow .15s; }
.sm-input:focus { border-color:#0A8F45; box-shadow:0 0 0 3px rgba(10,143,69,0.08); }
.sm-textarea { width:100%; padding:12px; border:1.5px solid #E8ECEA; border-radius:10px; font-size:14px; color:#1F2A24; background:#fff; outline:none; resize:vertical; font-family:inherit; box-sizing:border-box; transition:border-color .15s; line-height:1.5; }
.sm-textarea:focus { border-color:#0A8F45; box-shadow:0 0 0 3px rgba(10,143,69,0.08); }
.sm-select  { width:100%; height:40px; padding:0 12px; border:1.5px solid #E8ECEA; border-radius:10px; font-size:14px; color:#1F2A24; background:#fff; outline:none; cursor:pointer; box-sizing:border-box; }
.sm-select:focus { border-color:#0A8F45; }
.sm-upload-cover { width:100%; height:160px; border:2px dashed #D0D5DD; border-radius:16px; background:#F8FAF9; display:flex; align-items:center; justify-content:center; gap:16px; cursor:pointer; transition:all .15s; overflow:hidden; }
.sm-upload-cover:hover { border-color:#0A8F45; background:#EAF7EF; }
.sm-upload-logo  { width:140px; height:140px; border:2px dashed #D0D5DD; border-radius:16px; background:#F8FAF9; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; cursor:pointer; transition:all .15s; overflow:hidden; flex-shrink:0; }
.sm-upload-logo:hover { border-color:#0A8F45; background:#EAF7EF; }
.sm-quota-banner { display:flex; align-items:center; gap:14px; padding:12px 16px; border-radius:12px; border:1px solid #C2E8D0; background:#EAF7EF; flex-wrap:wrap; }
.sm-quota-banner.warn { background:#FFF4EC; border-color:#FFD0A0; }
.sm-quota-bar  { flex:1; min-width:100px; height:6px; border-radius:4px; background:#D0E8D8; overflow:hidden; }
.sm-quota-fill { height:100%; border-radius:4px; background:#0A8F45; transition:width .3s; }
.sm-quota-fill.warn { background:#F08A24; }
.sm-pay-card   { display:flex; flex-direction:column; align-items:center; gap:8px; padding:14px 10px; border:2px solid #E8ECEA; border-radius:14px; cursor:pointer; transition:all .15s; background:#fff; flex:1; min-width:120px; }
.sm-pay-card:hover { border-color:#0A8F45; background:#EAF7EF; }
.sm-pay-card.selected { border-color:#0A8F45; background:#EAF7EF; }
.sm-hours-row  { display:flex; align-items:center; gap:12px; padding:12px 16px; background:#F8FAF9; border-radius:12px; border:1px solid #E8ECEA; flex-wrap:wrap; }
.sm-toggle { width:42px; height:24px; background:#E8ECEA; border-radius:999px; cursor:pointer; position:relative; transition:background .2s; flex-shrink:0; border:none; padding:0; }
.sm-toggle.on { background:#0A8F45; }
.sm-toggle::after { content:''; position:absolute; top:4px; left:4px; width:16px; height:16px; background:#fff; border-radius:50%; transition:transform .2s; box-shadow:0 1px 3px rgba(0,0,0,0.15); }
.sm-toggle.on::after { transform:translateX(18px); }
.sm-slug-ok   { color:#0A8F45; font-size:12px; font-weight:600; }
.sm-slug-err  { color:#EF4444; font-size:12px; font-weight:600; }
.sm-slug-chk  { color:#98A2B3; font-size:12px; }
@media(max-width:700px){
  .sm-body { padding:16px; }
  .sm-header { padding:16px; }
  .sm-footer { padding:12px 16px; }
}
`;

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = ["Mode","Beauté","Accessoires","Maison","Électronique","Alimentation","Santé","Enfants","Services","Autre"];

const COUNTRY_CODES = [
  { code:"+237", flag:"🇨🇲", label:"Cameroun" },
  { code:"+225", flag:"🇨🇮", label:"Côte d'Ivoire" },
  { code:"+221", flag:"🇸🇳", label:"Sénégal" },
  { code:"+224", flag:"🇬🇳", label:"Guinée" },
  { code:"+229", flag:"🇧🇯", label:"Bénin" },
  { code:"+226", flag:"🇧🇫", label:"Burkina Faso" },
  { code:"+228", flag:"🇹🇬", label:"Togo" },
  { code:"+241", flag:"🇬🇦", label:"Gabon" },
  { code:"+242", flag:"🇨🇬", label:"Congo" },
  { code:"+243", flag:"🇨🇩", label:"RD Congo" },
  { code:"+223", flag:"🇲🇱", label:"Mali" },
  { code:"+227", flag:"🇳🇪", label:"Niger" },
  { code:"+261", flag:"🇲🇬", label:"Madagascar" },
  { code:"+33",  flag:"🇫🇷", label:"France" },
];

const COUNTRIES = ["Cameroun","Côte d'Ivoire","Sénégal","Guinée","Bénin","Burkina Faso","Togo","Gabon","Congo","RD Congo","Mali","Niger","Madagascar","France","Autre"];

const PAYMENT_OPTIONS: { id:string; label:string; icon:React.ReactNode; bg:string; border:string }[] = [
  { id:"ORANGE_MONEY",     label:"Orange Money",      icon:<span style={{width:14,height:14,borderRadius:"50%",background:"#FF8C00",display:"inline-block",flexShrink:0}} />, bg:"#FFF4EC", border:"#FF8C00" },
  { id:"MTN_MOBILE_MONEY", label:"MTN Mobile Money",  icon:<span style={{width:14,height:14,borderRadius:"50%",background:"#FFD700",display:"inline-block",flexShrink:0}} />, bg:"#FFFBEA", border:"#FFD700" },
  { id:"CASH",             label:"Espèces",           icon:<span style={{width:14,height:14,borderRadius:"50%",background:"#0A8F45",display:"inline-block",flexShrink:0}} />, bg:"#EAF7EF", border:"#0A8F45" },
  { id:"BANK_TRANSFER",    label:"Virement bancaire", icon:<span style={{width:14,height:14,borderRadius:"50%",background:"#175CD3",display:"inline-block",flexShrink:0}} />, bg:"#EFF8FF", border:"#175CD3" },
];

const DAYS = [
  { code:"LUN", label:"Lun" },
  { code:"MAR", label:"Mar" },
  { code:"MER", label:"Mer" },
  { code:"JEU", label:"Jeu" },
  { code:"VEN", label:"Ven" },
  { code:"SAM", label:"Sam" },
  { code:"DIM", label:"Dim" },
];

// ─── Types ────────────────────────────────────────────────────────────────────
type QuotaInfo = {
  plan: { displayName: string; maxShops: number; priceMonthly: number };
  usage: { shops: number };
};

type CreatedShop = { id: string; name: string; slug: string };

export type CreateShopModalProps = {
  open:      boolean;
  onClose:   () => void;
  onCreated: (shop: CreatedShop) => void;
};

// ─── Helper ───────────────────────────────────────────────────────────────────
function autoSlug(name: string): string {
  return name.trim().toLowerCase().normalize("NFD")
    .replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s-]/g, "")
    .trim().replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 40).replace(/-+$/, "");
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CreateShopModal({ open, onClose, onCreated }: CreateShopModalProps) {
  const [name, setName]               = useState("");
  const [slug, setSlug]               = useState("");
  const [slugEdited, setSlugEdited]   = useState(false);
  const [slugStatus, setSlugStatus]   = useState<"idle"|"checking"|"available"|"taken">("idle");
  const [category, setCategory]       = useState("");
  const [phoneCode, setPhoneCode]     = useState("+237");
  const [phoneNum, setPhoneNum]       = useState("");
  const [city, setCity]               = useState("");
  const [country, setCountry]         = useState("Cameroun");
  const [address, setAddress]         = useState("");
  const [notifEmail, setNotifEmail]   = useState("");
  const [description, setDescription] = useState("");
  const [payMethods, setPayMethods]   = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [coverFile, setCoverFile]     = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile]       = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [openDays, setOpenDays]       = useState<string[]>(["LUN","MAR","MER","JEU","VEN"]);
  const [openTime, setOpenTime]       = useState("08:00");
  const [closeTime, setCloseTime]     = useState("20:00");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError]   = useState<string | null>(null);
  const [quota, setQuota]               = useState<QuotaInfo | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/subscription").then(r => r.json()).then(d => { if (d.plan) setQuota(d); }).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (slugEdited) return;
    setSlug(autoSlug(name));
  }, [name, slugEdited]);

  useEffect(() => {
    if (!slug || slug.length < 3) { setSlugStatus("idle"); return; }
    setSlugStatus("checking");
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/shop/check-slug?slug=${encodeURIComponent(slug)}`);
        const d = await res.json();
        setSlugStatus(d.available ? "available" : "taken");
      } catch { setSlugStatus("idle"); }
    }, 500);
    return () => clearTimeout(t);
  }, [slug]);

  function reset() {
    setName(""); setSlug(""); setSlugEdited(false); setSlugStatus("idle");
    setCategory(""); setPhoneCode("+237"); setPhoneNum("");
    setCity(""); setCountry("Cameroun"); setAddress(""); setNotifEmail(""); setDescription("");
    setPayMethods([]); setIsPublished(false);
    setCoverFile(null); setCoverPreview(null); setLogoFile(null); setLogoPreview(null);
    setOpenDays(["LUN","MAR","MER","JEU","VEN"]); setOpenTime("08:00"); setCloseTime("20:00");
    setIsSubmitting(false); setSubmitError(null);
  }

  function handleClose() { reset(); onClose(); }

  async function handleSubmit() {
    if (!name.trim()) { setSubmitError("Le nom de la boutique est obligatoire."); return; }
    if (!slug || slugStatus === "taken") { setSubmitError("Le slug est indisponible ou invalide."); return; }
    if (!category) { setSubmitError("Sélectionnez un secteur d'activité."); return; }
    if (!phoneNum.trim()) { setSubmitError("Le numéro WhatsApp est obligatoire."); return; }
    if (!city.trim()) { setSubmitError("La ville est obligatoire."); return; }

    setIsSubmitting(true); setSubmitError(null);

    const fd = new FormData();
    fd.append("name", name.trim());
    fd.append("slug", slug);
    fd.append("category", category);
    fd.append("whatsappNumber", `${phoneCode}${phoneNum.replace(/^0/, "")}`);
    fd.append("notificationEmail", notifEmail.trim());
    fd.append("city", city.trim());
    fd.append("regionCountry", country);
    fd.append("address", address.trim());
    fd.append("description", description.trim());
    const hoursStr = openDays.length > 0 && openTime && closeTime
      ? `${openDays.join(",")}|${openTime}-${closeTime}`
      : "";
    fd.append("openingHours", hoursStr);
    fd.append("paymentMethods", JSON.stringify(payMethods));
    fd.append("isPublished", String(isPublished));
    if (coverFile) fd.append("coverFile", coverFile);
    if (logoFile)  fd.append("logoFile",  logoFile);

    try {
      const res  = await fetch("/api/shop", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setSubmitError(data?.error ?? "Erreur lors de la création."); return; }
      onCreated(data.data);
      reset();
      onClose();
    } catch {
      setSubmitError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <>
      <style>{CSS}</style>
      <div className="sm-overlay" onClick={handleClose}>
        <div className="sm-modal" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="sm-header">
            <div>
              <h2 style={{fontSize:20, fontWeight:800, color:"#1F2A24", margin:0}}>Créer une boutique</h2>
              <p style={{fontSize:13, color:"#667085", margin:"4px 0 0"}}>Ajoutez une nouvelle boutique à votre espace marchand.</p>
            </div>
            <button onClick={handleClose} style={{background:"none",border:"1.5px solid #E8ECEA",borderRadius:8,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#667085",fontSize:16,flexShrink:0}}>✕</button>
          </div>

          <div className="sm-body">

            {/* Quota banner */}
            {quota && (
              <div className={`sm-quota-banner${quota.usage.shops >= quota.plan.maxShops ? " warn" : ""}`}>
                <span style={{color: quota.usage.shops >= quota.plan.maxShops ? "#F08A24" : "#0A8F45"}}>
                  {quota.usage.shops >= quota.plan.maxShops ? <AlertTriangle size={18} /> : <Info size={18} />}
                </span>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontSize:13, fontWeight:600, color:"#1F2A24"}}>
                    Plan {quota.plan.displayName} : vous utilisez {quota.usage.shops} / {quota.plan.maxShops} boutique{quota.plan.maxShops > 1 ? "s" : ""}.
                  </div>
                  {quota.usage.shops >= quota.plan.maxShops && (
                    <div style={{fontSize:12, color:"#F08A24", marginTop:2}}>Quota atteint — passez à un plan supérieur pour créer davantage de boutiques.</div>
                  )}
                </div>
                <div style={{display:"flex", alignItems:"center", gap:10, flexShrink:0}}>
                  <div className="sm-quota-bar">
                    <div className={`sm-quota-fill${quota.usage.shops >= quota.plan.maxShops ? " warn" : ""}`}
                      style={{width:`${Math.min(100,(quota.usage.shops/quota.plan.maxShops)*100)}%`}} />
                  </div>
                  <span style={{fontSize:12, fontWeight:700, color: quota.usage.shops >= quota.plan.maxShops ? "#F08A24" : "#0A8F45", whiteSpace:"nowrap"}}>
                    {quota.usage.shops} / {quota.plan.maxShops}
                  </span>
                </div>
              </div>
            )}

            {/* Cover image upload */}
            <div>
              <label className="sm-label">Bannière de la boutique</label>
              <label className="sm-upload-cover">
                {coverPreview ? (
                  <img src={coverPreview} alt="cover" style={{width:"100%",height:"100%",objectFit:"cover"}} />
                ) : (
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                    <span style={{color:"#98A2B3"}}><Image size={32} /></span>
                    <span style={{fontSize:13, fontWeight:600, color:"#0A8F45", background:"#fff", border:"1.5px solid #C2E8D0", borderRadius:8, padding:"6px 20px"}}>Téléverser une image</span>
                    <span style={{fontSize:11, color:"#98A2B3"}}>PNG, JPG, WEBP • Max. 5 Mo • Recommandé : 1920 × 600 px</span>
                  </div>
                )}
                <input type="file" accept="image/*" style={{display:"none"}} onChange={e => {
                  const f = e.target.files?.[0] ?? null;
                  setCoverFile(f); setCoverPreview(f ? URL.createObjectURL(f) : null);
                }} />
              </label>
              {coverPreview && (
                <button onClick={() => { setCoverFile(null); setCoverPreview(null); }}
                  style={{marginTop:6, background:"none", border:"1px solid #E8ECEA", borderRadius:8, padding:"4px 12px", fontSize:11, color:"#667085", cursor:"pointer"}}>
                  Supprimer la bannière
                </button>
              )}
            </div>

            {/* Main form row: left fields + right logo */}
            <div style={{display:"grid", gridTemplateColumns:"1fr 160px", gap:24, alignItems:"flex-start"}}>

              {/* Left: all text fields */}
              <div style={{display:"flex", flexDirection:"column", gap:16}}>

                {/* Nom */}
                <div>
                  <label className="sm-label">Nom de la boutique <span style={{color:"#EF4444"}}>*</span></label>
                  <input className="sm-input" placeholder="Ex. : Mon Aventure" value={name} onChange={e => setName(e.target.value)} />
                </div>

                {/* URL publique */}
                <div>
                  <label className="sm-label">URL de la boutique <span style={{color:"#EF4444"}}>*</span></label>
                  <div style={{position:"relative"}}>
                    <input className="sm-input"
                      placeholder="Ex. : mon-aventure"
                      value={slug}
                      onChange={e => { setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,"-").replace(/-+/g,"-")); setSlugEdited(true); }}
                      style={{paddingRight:110}}
                    />
                    <span style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}>
                      {slugStatus === "available" && <span className="sm-slug-ok">✓ Disponible</span>}
                      {slugStatus === "taken"     && <span className="sm-slug-err">✗ Indisponible</span>}
                      {slugStatus === "checking"  && <span className="sm-slug-chk">Vérification…</span>}
                    </span>
                  </div>
                  <div style={{fontSize:12, color:"#667085", marginTop:4}}>
                    URL publique : <strong style={{color:"#0A8F45"}}>{slug || "mon-aventure"}</strong>.bizmanager.shop
                  </div>
                </div>

                {/* Secteur */}
                <div>
                  <label className="sm-label">Secteur d&apos;activité <span style={{color:"#EF4444"}}>*</span></label>
                  <select className="sm-select" value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="">Sélectionnez un secteur</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Phone */}
                <div>
                  <label className="sm-label">Téléphone / WhatsApp <span style={{color:"#EF4444"}}>*</span></label>
                  <div style={{display:"flex", gap:8}}>
                    <select className="sm-select" style={{width:140, flexShrink:0}} value={phoneCode} onChange={e => setPhoneCode(e.target.value)}>
                      {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                    </select>
                    <input className="sm-input" placeholder="Ex. : 675 123 456" value={phoneNum} onChange={e => setPhoneNum(e.target.value)} />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="sm-label" style={{color:"#667085"}}>Email professionnel</label>
                  <input className="sm-input" type="email" placeholder="contact@monaventure.com" value={notifEmail} onChange={e => setNotifEmail(e.target.value)} />
                </div>

                {/* Ville + Pays */}
                <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
                  <div>
                    <label className="sm-label">Ville <span style={{color:"#EF4444"}}>*</span></label>
                    <input className="sm-input" placeholder="Ex. : Douala" value={city} onChange={e => setCity(e.target.value)} />
                  </div>
                  <div>
                    <label className="sm-label">Pays <span style={{color:"#EF4444"}}>*</span></label>
                    <select className="sm-select" value={country} onChange={e => setCountry(e.target.value)}>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Adresse */}
                <div>
                  <label className="sm-label" style={{color:"#667085"}}>Adresse</label>
                  <input className="sm-input" placeholder="Ex. : Bonapriso, Rue 123" value={address} onChange={e => setAddress(e.target.value)} />
                </div>
              </div>

              {/* Right: logo upload */}
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,paddingTop:26}}>
                <label className="sm-upload-logo">
                  {logoPreview ? (
                    <img src={logoPreview} alt="logo" style={{width:"100%",height:"100%",objectFit:"cover"}} />
                  ) : (
                    <>
                      <span style={{color:"#98A2B3"}}><Tag size={28} /></span>
                      <span style={{fontSize:11, fontWeight:600, color:"#0A8F45", textAlign:"center"}}>Téléverser un logo</span>
                      <span style={{fontSize:10, color:"#98A2B3", textAlign:"center", lineHeight:1.3}}>Format carré</span>
                      <span style={{fontSize:9, color:"#C5CDD1"}}>PNG · JPG · WEBP · 2 Mo</span>
                    </>
                  )}
                  <input type="file" accept="image/*" style={{display:"none"}} onChange={e => {
                    const f = e.target.files?.[0] ?? null;
                    setLogoFile(f); setLogoPreview(f ? URL.createObjectURL(f) : null);
                  }} />
                </label>
                {logoPreview && (
                  <button onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                    style={{background:"none",border:"1px solid #E8ECEA",borderRadius:7,padding:"3px 10px",fontSize:10,color:"#667085",cursor:"pointer"}}>
                    Supprimer
                  </button>
                )}
              </div>
            </div>

            {/* Opening hours */}
            <div>
              <label className="sm-label">Horaires d&apos;ouverture</label>
              <div style={{display:"flex", gap:6, flexWrap:"wrap", marginBottom:12}}>
                {DAYS.map(d => (
                  <button key={d.code} type="button"
                    onClick={() => setOpenDays(prev => prev.includes(d.code) ? prev.filter(x=>x!==d.code) : [...prev, d.code])}
                    style={{
                      padding:"6px 14px", borderRadius:8, fontSize:13, fontWeight:600,
                      border:"1.5px solid",
                      borderColor: openDays.includes(d.code) ? "#0A8F45" : "#E8ECEA",
                      background: openDays.includes(d.code) ? "#EAF7EF" : "#fff",
                      color: openDays.includes(d.code) ? "#0A8F45" : "#667085",
                      cursor:"pointer", transition:"all .15s"
                    }}>
                    {d.label}
                  </button>
                ))}
              </div>
              <div style={{display:"flex", alignItems:"flex-end", gap:10}}>
                <div>
                  <div style={{fontSize:11, color:"#667085", marginBottom:4}}>Ouverture</div>
                  <input type="time" value={openTime} onChange={e => setOpenTime(e.target.value)}
                    style={{height:38, padding:"0 10px", border:"1.5px solid #E8ECEA", borderRadius:10, fontSize:13, color:"#1F2A24", background:"#fff", cursor:"pointer"}} />
                </div>
                <span style={{fontSize:16, color:"#98A2B3", paddingBottom:8}}>–</span>
                <div>
                  <div style={{fontSize:11, color:"#667085", marginBottom:4}}>Fermeture</div>
                  <input type="time" value={closeTime} onChange={e => setCloseTime(e.target.value)}
                    style={{height:38, padding:"0 10px", border:"1.5px solid #E8ECEA", borderRadius:10, fontSize:13, color:"#1F2A24", background:"#fff", cursor:"pointer"}} />
                </div>
              </div>
              {openDays.length > 0 && openTime && closeTime && (
                <div style={{fontSize:12, color:"#0A8F45", background:"#EAF7EF", borderRadius:8, padding:"6px 10px", marginTop:10, display:"inline-flex", alignItems:"center", gap:6}}>
                  <Clock size={13} style={{marginRight:4,verticalAlign:"middle"}} />{openDays.join(", ")} · {openTime} – {closeTime}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="sm-label" style={{color:"#667085"}}>Description de la boutique</label>
              <textarea className="sm-textarea"
                placeholder="Décrivez votre boutique, vos produits, vos services, vos valeurs et ce qui vous rend unique..."
                value={description} onChange={e => setDescription(e.target.value)}
                maxLength={1000} style={{height:100}} />
              <div style={{textAlign:"right",fontSize:11,color:"#98A2B3",marginTop:3}}>{description.length} / 1000</div>
            </div>

            {/* Payment methods */}
            <div>
              <label className="sm-label">Moyens de paiement acceptés</label>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                {PAYMENT_OPTIONS.map(p => (
                  <div key={p.id}
                    className={`sm-pay-card${payMethods.includes(p.id) ? " selected" : ""}`}
                    style={payMethods.includes(p.id) ? {borderColor:p.border, background:p.bg} : undefined}
                    onClick={() => setPayMethods(prev => prev.includes(p.id) ? prev.filter(x=>x!==p.id) : [...prev, p.id])}>
                    <span style={{display:"flex",alignItems:"center",justifyContent:"center",height:28}}>{p.icon}</span>
                    <span style={{fontSize:12,fontWeight:600,color:"#1F2A24",textAlign:"center",lineHeight:1.3}}>{p.label}</span>
                    <div style={{width:18,height:18,borderRadius:5,border:`2px solid ${payMethods.includes(p.id) ? p.border : "#E8ECEA"}`,
                      background:payMethods.includes(p.id) ? p.border : "#fff",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {payMethods.includes(p.id) && <span style={{color:"#fff",fontSize:11,fontWeight:800}}>✓</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Publish toggle */}
            <div style={{display:"flex",alignItems:"flex-start",gap:12,padding:"14px 16px",background:"#F8FAF9",borderRadius:12,border:"1px solid #E8ECEA"}}>
              <button className={`sm-toggle${isPublished ? " on" : ""}`} onClick={() => setIsPublished(p=>!p)} style={{marginTop:2}} />
              <div>
                <div style={{fontSize:13,fontWeight:600,color:"#1F2A24"}}>Publier la boutique dès sa création</div>
                <div style={{fontSize:12,color:"#667085",marginTop:2}}>Votre boutique sera visible et accessible immédiatement après sa création.</div>
              </div>
            </div>

            {/* Error */}
            {submitError && (
              <div style={{background:"#FDE8E8",border:"1px solid #F9BDBD",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#C02020",fontWeight:500}}>
                {submitError}
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="sm-footer">
            <button onClick={handleClose} disabled={isSubmitting}
              style={{height:44,padding:"0 24px",background:"#fff",color:"#1F2A24",border:"1.5px solid #E8ECEA",borderRadius:10,fontSize:14,fontWeight:500,cursor:"pointer"}}>
              Annuler
            </button>
            <button onClick={handleSubmit}
              disabled={isSubmitting || (quota !== null && quota.usage.shops >= quota.plan.maxShops)}
              style={{height:44,padding:"0 28px",borderRadius:10,fontSize:14,fontWeight:700,border:"none",minWidth:200,
                cursor:isSubmitting ? "wait" : "pointer",
                background: (quota !== null && quota.usage.shops >= quota.plan.maxShops) ? "#E8ECEA"
                          : isSubmitting ? "#7CC49E" : "#0A8F45",
                color: (quota !== null && quota.usage.shops >= quota.plan.maxShops) ? "#98A2B3" : "#fff"}}>
              {isSubmitting ? "Création en cours…" : "Créer la boutique →"}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}

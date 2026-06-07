"use client";
import { useEffect, useState, useCallback } from "react";
import { Users, UserPlus, Mail, Shield, Store, Clock, CheckCircle, XCircle, AlertCircle, Pencil, Trash2, RefreshCw, X, Check, ChevronDown, Lock, Send } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type StaffRole = "owner" | "manager" | "staff";
type MembershipStatus = "invited" | "active" | "suspended" | "revoked";
type InvitationStatus = "pending" | "accepted" | "expired" | "cancelled";

type Shop = { id: string; name: string; slug: string };

type Member = {
  id: string;
  role: StaffRole;
  status: MembershipStatus;
  invitedBy: string;
  createdAt: string;
  user: { id: string; fullName: string; email: string };
  shopAccess: { id: string; shop: { id: string; name: string; slug: string } }[];
};

type Invitation = {
  id: string;
  email: string;
  role: StaffRole;
  status: InvitationStatus;
  shopIds: string[];
  expiresAt: string;
  createdAt: string;
};

type QuotaInfo = {
  plan: { name: string; displayName: string; maxTeamMembers: number };
  usage: { teamMembers: number };
} | null;

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<StaffRole, string> = {
  owner:   "Propriétaire",
  manager: "Manager",
  staff:   "Employé",
};
const ROLE_COLORS: Record<StaffRole, string> = {
  owner:   "#0A8F45",
  manager: "#3B82F6",
  staff:   "#667085",
};
const ROLE_BG: Record<StaffRole, string> = {
  owner:   "#DDF6E7",
  manager: "#EFF8FF",
  staff:   "#F2F4F7",
};
const STATUS_LABELS: Record<MembershipStatus, string> = {
  invited:   "Invité",
  active:    "Actif",
  suspended: "Suspendu",
  revoked:   "Révoqué",
};
const STATUS_BADGE: Record<MembershipStatus, string> = {
  invited:   "badge-gray",
  active:    "badge-green",
  suspended: "badge-orange",
  revoked:   "badge-red",
};

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
.tm-wrap { padding:24px 28px; max-width:1100px; margin:0 auto; background:#F8FAF9; min-height:100vh; }
.tm-header { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:20px; }
.tm-kpi   { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:20px; }
.tm-card  { background:#fff; border:1px solid #E8ECEA; border-radius:16px; padding:18px 20px;
            box-shadow:0 2px 10px rgba(16,24,40,.04); }
.tm-tcard { background:#fff; border:1px solid #E8ECEA; border-radius:18px;
            box-shadow:0 2px 10px rgba(16,24,40,.04); overflow:hidden; margin-bottom:18px; }
.tm-tbar  { display:flex; align-items:center; gap:10px; padding:16px 20px;
            border-bottom:1px solid #E8ECEA; flex-wrap:wrap; }
.tm-table { width:100%; border-collapse:collapse; font-size:13px; }
.tm-table th { padding:10px 14px; text-align:left; color:#667085; font-weight:500;
               border-bottom:1px solid #E8ECEA; background:#FAFBFA; white-space:nowrap; }
.tm-table td { padding:11px 14px; border-bottom:1px solid #F4F6F5; color:#1F2A24; vertical-align:middle; }
.tm-table tr:hover td { background:#FAFBFA; }
.tm-table tr:last-child td { border-bottom:none; }
.tm-avatar { width:36px; height:36px; border-radius:10px; background:#EAF7EF;
             display:flex; align-items:center; justify-content:center;
             font-size:13px; font-weight:700; color:#0A8F45; flex-shrink:0; }
.tm-act-btns { display:flex; gap:3px; align-items:center; }
.tm-act-btn  { border:none; background:none; cursor:pointer; padding:5px 7px;
               border-radius:7px; color:#667085; transition:background .15s;
               display:flex; align-items:center; justify-content:center; }
.tm-act-btn:hover { background:#F4F6F5; }
.tm-act-btn:disabled { opacity:.4; cursor:default; }
.tm-empty { text-align:center; padding:48px 20px; color:#98A2B3; }
.tm-empty-icon { font-size:40px; margin-bottom:12px; }
.badge { display:inline-flex; align-items:center; gap:4px; padding:3px 9px;
         border-radius:20px; font-size:11px; font-weight:600; white-space:nowrap; }
.badge-green  { background:#DDF6E7; color:#0A8F45; }
.badge-orange { background:#FFF1E5; color:#F08A24; }
.badge-red    { background:#FDE8E8; color:#EF4444; }
.badge-gray   { background:#F2F4F7; color:#667085; }
.badge-blue   { background:#EFF8FF; color:#175CD3; }
.btn-primary   { height:36px; padding:0 16px; background:#0A8F45; color:#fff; border:none;
                 border-radius:10px; font-size:13px; font-weight:600; cursor:pointer;
                 display:inline-flex; align-items:center; gap:6px; white-space:nowrap; }
.btn-primary:hover { background:#08763A; }
.btn-primary:disabled { opacity:.5; cursor:not-allowed; }
.btn-secondary { height:36px; padding:0 14px; background:#fff; color:#1F2A24;
                 border:1px solid #E8ECEA; border-radius:10px; font-size:13px; cursor:pointer;
                 display:inline-flex; align-items:center; gap:6px; white-space:nowrap; }
.btn-secondary:hover { background:#F8FAF9; }
.inp { height:40px; padding:0 12px; border:1.5px solid #E8ECEA; border-radius:10px;
       font-size:14px; color:#1F2A24; background:#fff; outline:none; width:100%; box-sizing:border-box; }
.inp:focus { border-color:#0A8F45; box-shadow:0 0 0 3px rgba(10,143,69,.08); }
.sel { height:40px; padding:0 12px; border:1.5px solid #E8ECEA; border-radius:10px;
       font-size:14px; color:#1F2A24; background:#fff; outline:none; cursor:pointer; width:100%; box-sizing:border-box; }
.sel:focus { border-color:#0A8F45; }

/* Modal */
.tm-overlay { position:fixed; inset:0; background:rgba(15,20,18,0.5); z-index:2000;
              display:flex; align-items:center; justify-content:center; padding:16px;
              backdrop-filter:blur(2px); }
.tm-modal   { background:#fff; border-radius:20px; width:100%; max-width:520px;
              max-height:92vh; overflow-y:auto; box-shadow:0 12px 40px rgba(16,24,40,.14); }
.tm-modal-hd { display:flex; align-items:flex-start; justify-content:space-between;
               padding:22px 24px 16px; border-bottom:1px solid #E8ECEA;
               position:sticky; top:0; background:#fff; z-index:1; }
.tm-modal-bd { padding:22px 24px; display:flex; flex-direction:column; gap:18px; }
.tm-modal-ft { display:flex; justify-content:flex-end; gap:10px; padding:14px 24px 20px;
               border-top:1px solid #E8ECEA; position:sticky; bottom:0; background:#fff; }
.tm-label { font-size:13px; font-weight:600; color:#1F2A24; margin-bottom:6px; display:block; }

/* Shop checkboxes */
.tm-shop-opt { display:flex; align-items:center; gap:10px; padding:9px 12px;
               border:1.5px solid #E8ECEA; border-radius:10px; cursor:pointer;
               transition:all .15s; user-select:none; }
.tm-shop-opt:hover { border-color:#0A8F45; background:#F8FAF9; }
.tm-shop-opt.selected { border-color:#0A8F45; background:#EAF7EF; }
.tm-shop-opt input { display:none; }
.tm-check { width:18px; height:18px; border:2px solid #E8ECEA; border-radius:5px;
            flex-shrink:0; display:flex; align-items:center; justify-content:center;
            background:#fff; transition:all .15s; }
.tm-shop-opt.selected .tm-check { background:#0A8F45; border-color:#0A8F45; }

/* Quota bar */
.tm-quota-bar { height:6px; border-radius:4px; background:#E8ECEA; overflow:hidden; margin-top:6px; }
.tm-quota-fill { height:100%; border-radius:4px; transition:width .3s; }

/* Invite section (empty state) */
.tm-invite-banner { display:flex; align-items:center; gap:16px; background:#EAF7EF;
                    border:1px solid #C2E8D0; border-radius:16px; padding:20px 24px;
                    margin-bottom:20px; flex-wrap:wrap; }

@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
.spin { animation:spin .7s linear infinite; display:inline-flex; }

@media(max-width:900px){
  .tm-kpi { grid-template-columns:1fr 1fr; }
  .tm-wrap { padding:14px 12px; }
}
@media(max-width:600px){
  .tm-kpi { grid-template-columns:1fr 1fr; }
  .tm-header { flex-direction:column; }
}
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Invite Modal ─────────────────────────────────────────────────────────────
function InviteModal({ open, onClose, shops, onInvited }: {
  open: boolean; onClose: () => void; shops: Shop[]; onInvited: () => void;
}) {
  const [email, setEmail]       = useState("");
  const [role, setRole]         = useState<"manager" | "staff">("manager");
  const [shopIds, setShopIds]   = useState<string[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);

  function reset() {
    setEmail(""); setRole("manager"); setShopIds([]);
    setLoading(false); setError(null); setSuccess(false);
  }
  function handleClose() { reset(); onClose(); }

  function toggleShop(id: string) {
    setShopIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }

  async function handleSubmit() {
    if (!email.trim())    { setError("Email requis."); return; }
    if (shopIds.length === 0) { setError("Sélectionnez au moins une boutique."); return; }
    setLoading(true); setError(null);
    try {
      const res  = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role, shopIds }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setError(data?.error ?? "Erreur lors de l'invitation."); return; }
      setSuccess(true);
      onInvited();
      setTimeout(() => { handleClose(); }, 1400);
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="tm-overlay" onClick={handleClose}>
      <div className="tm-modal" onClick={e => e.stopPropagation()}>

        <div className="tm-modal-hd">
          <div>
            <h2 style={{ fontSize:18, fontWeight:800, color:"#1F2A24", margin:0 }}>Inviter un collaborateur</h2>
            <p style={{ fontSize:13, color:"#667085", margin:"4px 0 0" }}>
              Un email d'invitation sécurisé sera envoyé automatiquement.
            </p>
          </div>
          <button onClick={handleClose}
            style={{ background:"none", border:"1.5px solid #E8ECEA", borderRadius:8, width:32, height:32,
                     display:"flex", alignItems:"center", justifyContent:"center",
                     cursor:"pointer", color:"#667085", flexShrink:0 }}>
            <X size={15} />
          </button>
        </div>

        <div className="tm-modal-bd">

          {/* Email */}
          <div>
            <label className="tm-label">Adresse email <span style={{ color:"#EF4444" }}>*</span></label>
            <div style={{ position:"relative" }}>
              <input className="inp" type="email" placeholder="collaborateur@exemple.com"
                value={email} onChange={e => setEmail(e.target.value)}
                style={{ paddingLeft:38 }} />
              <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:"#98A2B3" }}>
                <Mail size={15} />
              </span>
            </div>
          </div>

          {/* Rôle */}
          <div>
            <label className="tm-label">Rôle <span style={{ color:"#EF4444" }}>*</span></label>
            <div style={{ display:"flex", gap:10 }}>
              {(["manager", "staff"] as const).map(r => (
                <button key={r} onClick={() => setRole(r)}
                  style={{
                    flex:1, padding:"10px 12px", borderRadius:10,
                    border: role === r ? "2px solid #0A8F45" : "1.5px solid #E8ECEA",
                    background: role === r ? "#EAF7EF" : "#fff",
                    cursor:"pointer", textAlign:"left", transition:"all .15s",
                  }}>
                  <div style={{ fontSize:13, fontWeight:700, color: role === r ? "#0A8F45" : "#1F2A24" }}>
                    {ROLE_LABELS[r]}
                  </div>
                  <div style={{ fontSize:11, color:"#98A2B3", marginTop:2 }}>
                    {r === "manager" ? "Produits, commandes, clients, stats" : "Consultation + mise à jour stock/statuts"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Boutiques */}
          <div>
            <label className="tm-label">
              Boutiques autorisées <span style={{ color:"#EF4444" }}>*</span>
            </label>
            {shops.length === 0 ? (
              <div style={{ fontSize:13, color:"#98A2B3", padding:"10px 0" }}>
                Aucune boutique disponible.
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {shops.map(s => (
                  <label key={s.id} className={`tm-shop-opt${shopIds.includes(s.id) ? " selected" : ""}`}
                    onClick={() => toggleShop(s.id)}>
                    <div className="tm-check">
                      {shopIds.includes(s.id) && <Check size={11} color="#fff" strokeWidth={3} />}
                    </div>
                    <span style={{ flex:1, fontSize:13, fontWeight:600, color:"#1F2A24" }}>{s.name}</span>
                    <span style={{ fontSize:11, color:"#98A2B3" }}>{s.slug}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ display:"flex", gap:10, background:"#F8FAF9", borderRadius:10,
                        padding:"11px 14px", border:"1px solid #E8ECEA" }}>
            <span style={{ flexShrink:0, color:"#667085", marginTop:1 }}><Shield size={14} /></span>
            <span style={{ fontSize:12, color:"#667085", lineHeight:1.5 }}>
              Le collaborateur recevra un lien sécurisé valable <strong>7 jours</strong>.
              Il créera son propre compte sans accès à vos informations de facturation.
            </span>
          </div>

          {error && (
            <div style={{ background:"#FDE8E8", border:"1px solid #F9BDBD", borderRadius:10,
                          padding:"10px 14px", fontSize:13, color:"#C02020", fontWeight:500 }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background:"#DDF6E7", border:"1px solid #A8E0BF", borderRadius:10,
                          padding:"10px 14px", fontSize:13, color:"#08763A", fontWeight:600 }}>
              <Check size={13} style={{ marginRight:5, verticalAlign:"middle" }} />
              Invitation envoyée avec succès !
            </div>
          )}
        </div>

        <div className="tm-modal-ft">
          <button className="btn-secondary" onClick={handleClose} disabled={loading}>Annuler</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading || shops.length === 0}>
            {loading ? <><span className="spin"><RefreshCw size={13} /></span> Envoi…</> : <><Send size={13} /> Envoyer l'invitation</>}
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── Edit Member Modal ────────────────────────────────────────────────────────
function EditMemberModal({ open, onClose, member, shops, onUpdated }: {
  open: boolean; onClose: () => void;
  member: Member | null; shops: Shop[]; onUpdated: () => void;
}) {
  const [role, setRole]       = useState<"manager" | "staff">("manager");
  const [shopIds, setShopIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (member) {
      setRole(member.role === "owner" ? "manager" : member.role as "manager" | "staff");
      setShopIds(member.shopAccess.map(sa => sa.shop.id));
      setError(null); setSuccess(false);
    }
  }, [member]);

  function toggleShop(id: string) {
    setShopIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }

  async function handleSubmit() {
    if (!member) return;
    if (shopIds.length === 0) { setError("Sélectionnez au moins une boutique."); return; }
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`/api/team/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, shopIds }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setError(data?.error ?? "Erreur lors de la mise à jour."); return; }
      setSuccess(true);
      onUpdated();
      setTimeout(() => onClose(), 1200);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  if (!open || !member) return null;

  return (
    <div className="tm-overlay" onClick={onClose}>
      <div className="tm-modal" onClick={e => e.stopPropagation()}>
        <div className="tm-modal-hd">
          <div>
            <h2 style={{ fontSize:18, fontWeight:800, color:"#1F2A24", margin:0 }}>Modifier le collaborateur</h2>
            <p style={{ fontSize:13, color:"#667085", margin:"4px 0 0" }}>{member.user.fullName} — {member.user.email}</p>
          </div>
          <button onClick={onClose}
            style={{ background:"none", border:"1.5px solid #E8ECEA", borderRadius:8, width:32, height:32,
                     display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#667085", flexShrink:0 }}>
            <X size={15} />
          </button>
        </div>

        <div className="tm-modal-bd">
          <div>
            <label className="tm-label">Rôle</label>
            <div style={{ display:"flex", gap:10 }}>
              {(["manager", "staff"] as const).map(r => (
                <button key={r} onClick={() => setRole(r)}
                  style={{
                    flex:1, padding:"10px 12px", borderRadius:10,
                    border: role === r ? "2px solid #0A8F45" : "1.5px solid #E8ECEA",
                    background: role === r ? "#EAF7EF" : "#fff",
                    cursor:"pointer", textAlign:"left",
                  }}>
                  <div style={{ fontSize:13, fontWeight:700, color: role === r ? "#0A8F45" : "#1F2A24" }}>
                    {ROLE_LABELS[r]}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="tm-label">Boutiques autorisées</label>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {shops.map(s => (
                <label key={s.id} className={`tm-shop-opt${shopIds.includes(s.id) ? " selected" : ""}`}
                  onClick={() => toggleShop(s.id)}>
                  <div className="tm-check">
                    {shopIds.includes(s.id) && <Check size={11} color="#fff" strokeWidth={3} />}
                  </div>
                  <span style={{ flex:1, fontSize:13, fontWeight:600, color:"#1F2A24" }}>{s.name}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ background:"#FDE8E8", border:"1px solid #F9BDBD", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#C02020" }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background:"#DDF6E7", border:"1px solid #A8E0BF", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#08763A", fontWeight:600 }}>
              <Check size={13} style={{ marginRight:5, verticalAlign:"middle" }} /> Mis à jour avec succès !
            </div>
          )}
        </div>

        <div className="tm-modal-ft">
          <button className="btn-secondary" onClick={onClose} disabled={loading}>Annuler</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({ open, title, message, confirmLabel, confirmColor, onConfirm, onClose, loading }: {
  open: boolean; title: string; message: string; confirmLabel: string;
  confirmColor: string; onConfirm: () => void; onClose: () => void; loading: boolean;
}) {
  if (!open) return null;
  return (
    <div className="tm-overlay" onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:20, padding:"28px 24px", maxWidth:380, width:"100%",
                    boxShadow:"0 12px 40px rgba(16,24,40,.14)" }}
           onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize:18, fontWeight:800, color:"#1F2A24", margin:"0 0 10px" }}>{title}</h3>
        <p style={{ fontSize:14, color:"#667085", lineHeight:1.6, margin:"0 0 22px" }}>{message}</p>
        <div style={{ display:"flex", gap:10 }}>
          <button className="btn-secondary" style={{ flex:1 }} onClick={onClose} disabled={loading}>Annuler</button>
          <button onClick={onConfirm} disabled={loading}
            style={{ flex:1, height:36, background: loading ? "#ccc" : confirmColor, border:"none",
                     borderRadius:10, fontSize:13, fontWeight:700, color:"#fff", cursor: loading ? "wait" : "pointer" }}>
            {loading ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TeamPage() {
  const [members, setMembers]         = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [shops, setShops]             = useState<Shop[]>([]);
  const [quota, setQuota]             = useState<QuotaInfo>(null);
  const [loading, setLoading]         = useState(true);
  const [refreshKey, setRefreshKey]   = useState(0);

  const [showInvite, setShowInvite]   = useState(false);
  const [editMember, setEditMember]   = useState<Member | null>(null);

  const [confirmAction, setConfirmAction] = useState<{
    type: "suspend" | "activate" | "revoke" | "cancelInvite";
    id: string; label: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  function refresh() { setRefreshKey(k => k + 1); }

  // Load team data
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/team").then(r => r.json()),
      fetch("/api/shop?all=1").then(r => r.json()),
      fetch("/api/subscription").then(r => r.json()),
    ]).then(([teamData, shopsData, subData]) => {
      setMembers(teamData.members ?? []);
      setInvitations(teamData.invitations ?? []);
      setShops(shopsData.data ?? []);
      if (subData.plan) {
        setQuota({
          plan: {
            name:           subData.plan.name,
            displayName:    subData.plan.displayName,
            maxTeamMembers: subData.plan.maxTeamMembers ?? 0,
          },
          usage: { teamMembers: (teamData.members ?? []).filter((m: Member) => m.status === "active").length },
        });
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [refreshKey]);

  const activeMembers    = members.filter(m => m.status === "active");
  const suspendedMembers = members.filter(m => m.status === "suspended");
  const pendingCount     = invitations.filter(i => i.status === "pending").length;
  const atLimit = quota && quota.plan.maxTeamMembers > 0 &&
    (activeMembers.length + suspendedMembers.length) >= quota.plan.maxTeamMembers;

  async function handleConfirmAction() {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      const { type, id } = confirmAction;

      if (type === "cancelInvite") {
        const res = await fetch(`/api/team/invitations/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "cancel" }),
        });
        if (!res.ok) { const d = await res.json().catch(() => null); showToast(d?.error ?? "Erreur", false); return; }
        showToast("Invitation annulée.");
        refresh();
        return;
      }

      const statusMap = { suspend: "suspended", activate: "active", revoke: "revoked" };
      const res = await fetch(`/api/team/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusMap[type] }),
      });
      if (!res.ok) { const d = await res.json().catch(() => null); showToast(d?.error ?? "Erreur", false); return; }
      showToast(
        type === "suspend" ? "Accès suspendu." :
        type === "activate" ? "Accès réactivé." : "Accès révoqué définitivement."
      );
      refresh();
    } catch {
      showToast("Erreur réseau.", false);
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  }

  async function handleResend(invitationId: string) {
    try {
      const res = await fetch(`/api/team/invitations/${invitationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend" }),
      });
      if (!res.ok) { showToast("Impossible de renvoyer l'invitation.", false); return; }
      showToast("Invitation renvoyée.");
    } catch {
      showToast("Erreur réseau.", false);
    }
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="tm-wrap">

        {/* ── Header ── */}
        <div className="tm-header">
          <div>
            <h1 style={{ fontSize:22, fontWeight:700, color:"#1F2A24", margin:0 }}>Équipe</h1>
            <p style={{ margin:"4px 0 0", color:"#667085", fontSize:14 }}>
              Invitez des collaborateurs et gérez leurs accès par boutique.
            </p>
          </div>
          <button className="btn-primary"
            style={atLimit ? { opacity:.5, cursor:"not-allowed" } : undefined}
            onClick={() => { if (!atLimit) setShowInvite(true); }}
            title={atLimit ? "Quota de collaborateurs atteint — passez au plan supérieur" : undefined}>
            <UserPlus size={14} /> Inviter un collaborateur
          </button>
        </div>

        {/* ── Quota atteint banner ── */}
        {atLimit && (
          <div style={{ display:"flex", alignItems:"center", gap:12, background:"#FFF1E5",
                        border:"1px solid #FDDCB5", borderRadius:14, padding:"14px 18px",
                        marginBottom:18, fontSize:13, color:"#C05C0A", flexWrap:"wrap" }}>
            <Lock size={16} style={{ flexShrink:0 }} />
            <span style={{ flex:1 }}>
              Quota atteint — votre plan <strong>{quota?.plan.displayName}</strong> permet{" "}
              {quota?.plan.maxTeamMembers} collaborateur{(quota?.plan.maxTeamMembers ?? 0) > 1 ? "s" : ""}.
            </span>
            <a href="/settings"
              style={{ background:"#F08A24", color:"#fff", borderRadius:8, padding:"6px 14px",
                       fontSize:12, fontWeight:700, textDecoration:"none", flexShrink:0 }}>
              Passer au plan supérieur →
            </a>
          </div>
        )}

        {/* ── KPI ── */}
        <div className="tm-kpi">
          {[
            { label:"Membres actifs",    val: activeMembers.length,    icon:<CheckCircle size={16} color="#0A8F45" />,  bg:"#DDF6E7", tc:"#0A8F45" },
            { label:"Suspendus",          val: suspendedMembers.length, icon:<AlertCircle size={16} color="#F08A24" />,  bg:"#FFF1E5", tc:"#F08A24" },
            { label:"Invitations en attente", val: pendingCount,        icon:<Clock size={16} color="#3B82F6" />,        bg:"#EFF8FF", tc:"#175CD3" },
            { label:"Total membres",      val: members.length,          icon:<Users size={16} color="#667085" />,        bg:"#F2F4F7", tc:"#667085" },
          ].map(k => (
            <div key={k.label} className="tm-card">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <span style={{ fontSize:12, color:"#667085", fontWeight:500 }}>{k.label}</span>
                <span style={{ background:k.bg, padding:"5px 7px", borderRadius:9, display:"flex" }}>{k.icon}</span>
              </div>
              <div style={{ fontSize:28, fontWeight:800, color:"#1F2A24", margin:"8px 0 4px" }}>{k.val}</div>
              {quota && k.label === "Membres actifs" && (
                <>
                  <div style={{ fontSize:11, color:k.tc }}>
                    {quota.plan.maxTeamMembers === 0 ? "Plan Starter — non disponible"
                      : quota.plan.maxTeamMembers === -1 ? "Illimité"
                      : `${k.val} / ${quota.plan.maxTeamMembers} (plan ${quota.plan.displayName})`}
                  </div>
                  {quota.plan.maxTeamMembers > 0 && quota.plan.maxTeamMembers !== -1 && (
                    <div className="tm-quota-bar">
                      <div className="tm-quota-fill"
                        style={{
                          width:`${Math.min(100, (k.val / quota.plan.maxTeamMembers) * 100)}%`,
                          background: (k.val / quota.plan.maxTeamMembers) >= 1 ? "#EF4444" : "#0A8F45",
                        }} />
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* ── Empty state (no members at all) ── */}
        {!loading && members.length === 0 && invitations.length === 0 && (
          <div className="tm-invite-banner">
            <div style={{ background:"#0A8F45", borderRadius:14, width:48, height:48,
                          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Users size={22} color="#fff" />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:15, fontWeight:700, color:"#1F2A24" }}>Aucun collaborateur pour l'instant</div>
              <div style={{ fontSize:13, color:"#667085", marginTop:3 }}>
                Invitez des managers ou employés pour déléguer la gestion de vos boutiques sans partager votre mot de passe.
              </div>
            </div>
            <button className="btn-primary"
              style={atLimit ? { opacity:.5, cursor:"not-allowed" } : undefined}
              onClick={() => { if (!atLimit) setShowInvite(true); }}>
              <UserPlus size={14} /> Inviter maintenant
            </button>
          </div>
        )}

        {/* ── Membres actifs / suspendus ── */}
        {(members.length > 0 || loading) && (
          <div className="tm-tcard">
            <div className="tm-tbar">
              <span style={{ fontWeight:700, color:"#1F2A24", fontSize:14 }}>
                Collaborateurs
                {members.length > 0 && (
                  <span className="badge badge-gray" style={{ marginLeft:8, fontSize:10 }}>
                    {members.length}
                  </span>
                )}
              </span>
              <button className="btn-secondary" style={{ marginLeft:"auto", height:30, padding:"0 10px", fontSize:12 }}
                onClick={refresh}>
                <RefreshCw size={11} /> Actualiser
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign:"center", padding:40, color:"#98A2B3", fontSize:13 }}>Chargement…</div>
            ) : members.length === 0 ? (
              <div className="tm-empty">
                <div className="tm-empty-icon"><Users size={36} color="#E8ECEA" /></div>
                <div>Aucun collaborateur actif.</div>
              </div>
            ) : (
              <div style={{ overflowX:"auto" }}>
                <table className="tm-table">
                  <thead>
                    <tr>
                      <th>Collaborateur</th>
                      <th>Rôle</th>
                      <th>Boutiques autorisées</th>
                      <th>Statut</th>
                      <th>Ajouté le</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(m => (
                      <tr key={m.id}>
                        <td>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <div className="tm-avatar">{initials(m.user.fullName)}</div>
                            <div>
                              <div style={{ fontWeight:600, fontSize:13 }}>{m.user.fullName}</div>
                              <div style={{ fontSize:11, color:"#98A2B3" }}>{m.user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{
                            display:"inline-flex", alignItems:"center", gap:5,
                            padding:"3px 9px", borderRadius:20, fontSize:11, fontWeight:600,
                            background: ROLE_BG[m.role], color: ROLE_COLORS[m.role],
                          }}>
                            <Shield size={10} /> {ROLE_LABELS[m.role]}
                          </span>
                        </td>
                        <td>
                          <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                            {m.shopAccess.length === 0 ? (
                              <span style={{ fontSize:11, color:"#98A2B3" }}>Aucune boutique</span>
                            ) : m.shopAccess.map(sa => (
                              <span key={sa.id} style={{
                                fontSize:10, fontWeight:600, background:"#EAF7EF", color:"#0A8F45",
                                borderRadius:6, padding:"2px 7px",
                              }}>
                                {sa.shop.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${STATUS_BADGE[m.status]}`}>
                            {STATUS_LABELS[m.status]}
                          </span>
                        </td>
                        <td style={{ fontSize:11, color:"#98A2B3" }}>{fmtDate(m.createdAt)}</td>
                        <td>
                          <div className="tm-act-btns">
                            <button className="tm-act-btn" title="Modifier"
                              onClick={() => setEditMember(m)}>
                              <Pencil size={13} />
                            </button>
                            {m.status === "active" && (
                              <button className="tm-act-btn" title="Suspendre l'accès"
                                style={{ color:"#F08A24" }}
                                onClick={() => setConfirmAction({ type:"suspend", id:m.id, label:m.user.fullName })}>
                                <XCircle size={13} />
                              </button>
                            )}
                            {m.status === "suspended" && (
                              <button className="tm-act-btn" title="Réactiver l'accès"
                                style={{ color:"#0A8F45" }}
                                onClick={() => setConfirmAction({ type:"activate", id:m.id, label:m.user.fullName })}>
                                <CheckCircle size={13} />
                              </button>
                            )}
                            <button className="tm-act-btn" title="Révoquer définitivement"
                              style={{ color:"#EF4444" }}
                              onClick={() => setConfirmAction({ type:"revoke", id:m.id, label:m.user.fullName })}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Invitations en attente ── */}
        {invitations.length > 0 && (
          <div className="tm-tcard">
            <div className="tm-tbar">
              <span style={{ fontWeight:700, color:"#1F2A24", fontSize:14 }}>
                Invitations en attente
                <span className="badge badge-blue" style={{ marginLeft:8, fontSize:10 }}>
                  {invitations.length}
                </span>
              </span>
            </div>
            <div style={{ overflowX:"auto" }}>
              <table className="tm-table">
                <thead>
                  <tr>
                    <th>Email invité</th>
                    <th>Rôle</th>
                    <th>Boutiques</th>
                    <th>Expire le</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map(inv => (
                    <tr key={inv.id}>
                      <td>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ width:30, height:30, borderRadius:8, background:"#F2F4F7",
                                        display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <Mail size={13} color="#98A2B3" />
                          </div>
                          <span style={{ fontSize:13, fontWeight:500 }}>{inv.email}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          display:"inline-flex", alignItems:"center", gap:4,
                          padding:"3px 9px", borderRadius:20, fontSize:11, fontWeight:600,
                          background: ROLE_BG[inv.role], color: ROLE_COLORS[inv.role],
                        }}>
                          {ROLE_LABELS[inv.role]}
                        </span>
                      </td>
                      <td>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                          {inv.shopIds.length === 0 ? (
                            <span style={{ fontSize:11, color:"#98A2B3" }}>—</span>
                          ) : inv.shopIds.map(sid => {
                            const s = shops.find(sh => sh.id === sid);
                            return s ? (
                              <span key={sid} style={{
                                fontSize:10, fontWeight:600, background:"#EAF7EF", color:"#0A8F45",
                                borderRadius:6, padding:"2px 7px",
                              }}>{s.name}</span>
                            ) : null;
                          })}
                        </div>
                      </td>
                      <td style={{ fontSize:11, color: new Date(inv.expiresAt) < new Date() ? "#EF4444" : "#98A2B3" }}>
                        {fmtDate(inv.expiresAt)}
                      </td>
                      <td>
                        <div className="tm-act-btns">
                          <button className="tm-act-btn" title="Renvoyer l'invitation"
                            style={{ color:"#3B82F6" }}
                            onClick={() => handleResend(inv.id)}>
                            <Send size={12} />
                          </button>
                          <button className="tm-act-btn" title="Annuler l'invitation"
                            style={{ color:"#EF4444" }}
                            onClick={() => setConfirmAction({ type:"cancelInvite", id:inv.id, label:inv.email })}>
                            <X size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Aide sur les rôles ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginTop:4 }}>
          {(["owner","manager","staff"] as const).map(r => (
            <div key={r} className="tm-card">
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <span style={{ background:ROLE_BG[r], padding:"5px 7px", borderRadius:8,
                               display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Shield size={14} color={ROLE_COLORS[r]} />
                </span>
                <span style={{ fontSize:13, fontWeight:700, color:ROLE_COLORS[r] }}>{ROLE_LABELS[r]}</span>
              </div>
              <ul style={{ margin:0, padding:"0 0 0 14px", fontSize:12, color:"#667085", lineHeight:1.8 }}>
                {r === "owner" && <>
                  <li>Accès complet à tout</li>
                  <li>Gestion abonnement & facturation</li>
                  <li>Inviter / gérer l'équipe</li>
                  <li>Supprimer les boutiques</li>
                </>}
                {r === "manager" && <>
                  <li>Gérer produits, commandes, clients</li>
                  <li>Voir les statistiques</li>
                  <li>Modifier le stock</li>
                  <li>Pas d'accès facturation</li>
                </>}
                {r === "staff" && <>
                  <li>Voir commandes et produits</li>
                  <li>Mettre à jour les statuts</li>
                  <li>Modifier le stock</li>
                  <li>Pas de création / suppression</li>
                </>}
              </ul>
            </div>
          ))}
        </div>

      </div>

      {/* ── Modals ── */}
      <InviteModal
        open={showInvite}
        onClose={() => setShowInvite(false)}
        shops={shops}
        onInvited={() => { setShowInvite(false); refresh(); showToast("Invitation envoyée !"); }}
      />

      <EditMemberModal
        open={editMember !== null}
        onClose={() => setEditMember(null)}
        member={editMember}
        shops={shops}
        onUpdated={() => { setEditMember(null); refresh(); showToast("Collaborateur mis à jour."); }}
      />

      <ConfirmModal
        open={confirmAction !== null}
        title={
          confirmAction?.type === "suspend"     ? "Suspendre l'accès ?" :
          confirmAction?.type === "activate"    ? "Réactiver l'accès ?" :
          confirmAction?.type === "revoke"      ? "Révoquer définitivement ?" :
          "Annuler l'invitation ?"
        }
        message={
          confirmAction?.type === "suspend"
            ? `${confirmAction.label} ne pourra plus accéder aux boutiques jusqu'à réactivation.`
            : confirmAction?.type === "activate"
            ? `${confirmAction?.label} retrouvera l'accès à ses boutiques assignées.`
            : confirmAction?.type === "revoke"
            ? `Cette action est irréversible. ${confirmAction?.label} perdra tout accès définitivement.`
            : `L'invitation envoyée à ${confirmAction?.label} sera annulée.`
        }
        confirmLabel={
          confirmAction?.type === "suspend"     ? "Suspendre" :
          confirmAction?.type === "activate"    ? "Réactiver" :
          confirmAction?.type === "revoke"      ? "Révoquer" :
          "Annuler l'invitation"
        }
        confirmColor={
          confirmAction?.type === "activate" ? "#0A8F45" :
          confirmAction?.type === "suspend"  ? "#F08A24" : "#EF4444"
        }
        onConfirm={handleConfirmAction}
        onClose={() => setConfirmAction(null)}
        loading={actionLoading}
      />

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position:"fixed", bottom:24, right:24, zIndex:9999,
          display:"flex", alignItems:"center", gap:9,
          background: toast.ok ? "#0A8F45" : "#EF4444",
          color:"#fff", fontSize:13, fontWeight:600,
          padding:"11px 18px", borderRadius:12,
          boxShadow:"0 6px 24px rgba(0,0,0,.18)",
          animation:"toast-in .25s ease",
        }}>
          {toast.ok ? <Check size={14} /> : <XCircle size={14} />}
          {toast.msg}
        </div>
      )}
    </>
  );
}

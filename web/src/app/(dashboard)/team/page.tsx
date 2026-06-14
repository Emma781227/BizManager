"use client";
import { useEffect, useState, useCallback, useRef, type JSX } from "react";
import { Users, UserPlus, Mail, Shield, Store, Clock, CheckCircle, XCircle, AlertCircle, Pencil, Trash2, RefreshCw, X, Check, ChevronDown, Lock, Send, MoreHorizontal, Activity } from "lucide-react";

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

type AuditEntry = {
  id:          string;
  action:      string;
  actorUserId: string;
  actorName:   string;
  entityId:    string | null;
  metadata:    Record<string, unknown> | null;
  createdAt:   string;
};

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

@keyframes toast-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

/* Skeleton */
@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position:  400px 0; }
}
.tm-skeleton {
  background: linear-gradient(90deg, #E8ECEA 25%, #F4F6F5 50%, #E8ECEA 75%);
  background-size: 800px 100%;
  animation: shimmer 1.4s infinite linear;
  border-radius: 6px;
}
.tm-skeleton-card { background:#fff; border:1px solid #E8ECEA; border-radius:16px; padding:18px 20px;
                    box-shadow:0 2px 10px rgba(16,24,40,.04); }
.tm-skeleton-row { display:flex; align-items:center; gap:12px; padding:12px 14px; border-bottom:1px solid #F4F6F5; }
.tm-skeleton-row:last-child { border-bottom:none; }

/* Action dropdown */
.tm-dot-btn { border:none; background:none; cursor:pointer; padding:5px 7px;
              border-radius:7px; color:#667085; transition:background .15s;
              display:flex; align-items:center; justify-content:center; }
.tm-dot-btn:hover { background:#F4F6F5; }
.tm-dropdown { position:absolute; right:0; top:calc(100% + 4px); background:#fff;
               border:1px solid #E8ECEA; border-radius:12px; min-width:170px;
               box-shadow:0 8px 24px rgba(16,24,40,.10); z-index:100;
               overflow:hidden; }
.tm-dropdown-item { display:flex; align-items:center; gap:9px; width:100%; padding:9px 14px;
                    font-size:13px; font-weight:500; color:#1F2A24; background:none;
                    border:none; cursor:pointer; text-align:left; transition:background .12s; }
.tm-dropdown-item:hover { background:#F8FAF9; }
.tm-dropdown-item.danger { color:#EF4444; }
.tm-dropdown-item.warning { color:#F08A24; }
.tm-dropdown-item.success { color:#0A8F45; }
.tm-dropdown-sep { height:1px; background:#F4F6F5; margin:4px 0; }

/* Search input */
.tm-search { height:32px; padding:0 10px 0 32px; border:1.5px solid #E8ECEA; border-radius:8px;
             font-size:13px; color:#1F2A24; background:#fff; outline:none; width:180px;
             box-sizing:border-box; }
.tm-search:focus { border-color:#0A8F45; box-shadow:0 0 0 3px rgba(10,143,69,.06); }

/* Mobile member cards */
.tm-member-cards { display:none; }

/* Activity feed */
.tm-activity-list { display:flex; flex-direction:column; }
.tm-activity-item { display:flex; align-items:flex-start; gap:12px; padding:11px 20px;
                    border-bottom:1px solid #F4F6F5; }
.tm-activity-item:last-child { border-bottom:none; }
.tm-activity-icon { width:32px; height:32px; border-radius:9px; flex-shrink:0;
                    display:flex; align-items:center; justify-content:center; }
.tm-activity-body { flex:1; min-width:0; }
.tm-activity-text { font-size:13px; color:#1F2A24; line-height:1.5; }
.tm-activity-time { font-size:11px; color:#98A2B3; margin-top:2px; }
.tm-activity-more { display:flex; justify-content:center; padding:12px;
                    border-top:1px solid #F4F6F5; }

@media(max-width:900px){
  .tm-kpi { grid-template-columns:1fr 1fr; }
  .tm-wrap { padding:14px 12px; }
}
@media(max-width:640px){
  .tm-kpi { grid-template-columns:1fr 1fr; }
  .tm-header { flex-direction:column; }
  .tm-member-table-wrap { display:none; }
  .tm-member-cards { display:flex; flex-direction:column; gap:10px; padding:12px; }
  .tm-member-card { background:#fff; border:1px solid #E8ECEA; border-radius:14px; padding:14px; }
  .tm-member-card-head { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
  .tm-member-card-body { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
  .tm-member-card-footer { display:flex; align-items:center; justify-content:space-between; margin-top:10px; padding-top:10px; border-top:1px solid #F4F6F5; }
}
@media(max-width:600px){
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
function isExpiringSoon(iso: string) {
  return new Date(iso) < new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
}
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)        return "à l'instant";
  if (diff < 3_600_000)     return `il y a ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000)    return `il y a ${Math.floor(diff / 3_600_000)} h`;
  if (diff < 7 * 86_400_000) return `il y a ${Math.floor(diff / 86_400_000)} j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
function describeAction(entry: AuditEntry): JSX.Element {
  const m = entry.metadata ?? {};
  switch (entry.action) {
    case "team.invite":
      return <><strong>{entry.actorName}</strong>{" a invité "}<em>{String(m.email ?? "quelqu'un")}</em>{" comme "}<strong>{ROLE_LABELS[(m.role as StaffRole)] ?? String(m.role)}</strong></>;
    case "team.update": {
      const changes = (m.changes ?? {}) as Record<string, unknown>;
      if (changes.status) return <><strong>{entry.actorName}</strong>{" a modifié le statut d'un collaborateur → "}<strong>{String(changes.status)}</strong></>;
      if (changes.role)   return <><strong>{entry.actorName}</strong>{" a changé le rôle d'un collaborateur → "}<strong>{ROLE_LABELS[(changes.role as StaffRole)] ?? String(changes.role)}</strong></>;
      return <><strong>{entry.actorName}</strong>{" a modifié un collaborateur"}</>;
    }
    case "team.revoke":
      return <><strong>{entry.actorName}</strong>{" a révoqué un collaborateur"}</>;
    case "team.delete":
      return <><strong>{entry.actorName}</strong>{" a supprimé un collaborateur de l'équipe"}</>;
    case "team.invitation_accepted":
      return <><strong>{entry.actorName}</strong>{" a rejoint l'équipe"}</>;
    default:
      return <><strong>{entry.actorName}</strong>{" — "}{entry.action}</>;
  }
}
type ActionStyle = { bg: string; color: string; icon: JSX.Element };
function actionStyle(action: string): ActionStyle {
  switch (action) {
    case "team.invite":              return { bg:"#EFF8FF", color:"#175CD3", icon:<UserPlus size={14} /> };
    case "team.invitation_accepted": return { bg:"#DDF6E7", color:"#0A8F45", icon:<CheckCircle size={14} /> };
    case "team.update":              return { bg:"#FFF1E5", color:"#F08A24", icon:<Pencil size={14} /> };
    case "team.revoke":              return { bg:"#FDE8E8", color:"#EF4444", icon:<Trash2 size={14} /> };
    case "team.delete":              return { bg:"#FDE8E8", color:"#EF4444", icon:<XCircle size={14} /> };
    default:                         return { bg:"#F2F4F7", color:"#667085", icon:<Activity size={14} /> };
  }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function KpiSkeleton() {
  return (
    <div className="tm-kpi">
      {[0,1,2,3].map(i => (
        <div key={i} className="tm-skeleton-card">
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
            <div className="tm-skeleton" style={{ width:80, height:12 }} />
            <div className="tm-skeleton" style={{ width:28, height:28, borderRadius:8 }} />
          </div>
          <div className="tm-skeleton" style={{ width:48, height:28, marginBottom:6 }} />
          <div className="tm-skeleton" style={{ width:120, height:10 }} />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div>
      {[0,1,2,3,4].map(i => (
        <div key={i} className="tm-skeleton-row">
          <div className="tm-skeleton" style={{ width:36, height:36, borderRadius:10, flexShrink:0 }} />
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
            <div className="tm-skeleton" style={{ width:"40%", height:11 }} />
            <div className="tm-skeleton" style={{ width:"28%", height:9 }} />
          </div>
          <div className="tm-skeleton" style={{ width:60, height:20, borderRadius:20 }} />
          <div className="tm-skeleton" style={{ width:80, height:20, borderRadius:6 }} />
          <div className="tm-skeleton" style={{ width:60, height:11 }} />
          <div className="tm-skeleton" style={{ width:28, height:28, borderRadius:7 }} />
        </div>
      ))}
    </div>
  );
}

// ─── ActionMenu ───────────────────────────────────────────────────────────────
type ActionMenuItem = {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "warning" | "danger" | "success";
};

function ActionMenu({ items }: { items: ActionMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position:"relative", display:"inline-flex" }}>
      <button className="tm-dot-btn" onClick={() => setOpen(o => !o)} title="Actions">
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div className="tm-dropdown">
          {items.map((item, idx) => (
            <button
              key={idx}
              className={`tm-dropdown-item${item.variant === "danger" ? " danger" : item.variant === "warning" ? " warning" : item.variant === "success" ? " success" : ""}`}
              onClick={() => { item.onClick(); setOpen(false); }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
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
                  <div key={s.id} className={`tm-shop-opt${shopIds.includes(s.id) ? " selected" : ""}`}
                    onClick={() => toggleShop(s.id)}>
                    <div className="tm-check">
                      {shopIds.includes(s.id) && <Check size={11} color="#fff" strokeWidth={3} />}
                    </div>
                    <span style={{ flex:1, fontSize:13, fontWeight:600, color:"#1F2A24" }}>{s.name}</span>
                    <span style={{ fontSize:11, color:"#98A2B3" }}>{s.slug}</span>
                  </div>
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
                <div key={s.id} className={`tm-shop-opt${shopIds.includes(s.id) ? " selected" : ""}`}
                  onClick={() => toggleShop(s.id)}>
                  <div className="tm-check">
                    {shopIds.includes(s.id) && <Check size={11} color="#fff" strokeWidth={3} />}
                  </div>
                  <span style={{ flex:1, fontSize:13, fontWeight:600, color:"#1F2A24" }}>{s.name}</span>
                </div>
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

  // Colored icon based on confirmColor
  const isGreen  = confirmColor === "#0A8F45";
  const isOrange = confirmColor === "#F08A24";
  const iconEl = isGreen
    ? <CheckCircle size={26} color="#0A8F45" strokeWidth={2} />
    : isOrange
    ? <AlertCircle size={26} color="#F08A24" strokeWidth={2} />
    : <Trash2 size={26} color="#EF4444" strokeWidth={2} />;
  const iconBg = isGreen ? "#DDF6E7" : isOrange ? "#FFF1E5" : "#FDE8E8";

  return (
    <div className="tm-overlay" onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:20, padding:"28px 24px", maxWidth:380, width:"100%",
                    boxShadow:"0 12px 40px rgba(16,24,40,.14)" }}
           onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>
          <div style={{ width:48, height:48, borderRadius:"50%", background:iconBg,
                        display:"flex", alignItems:"center", justifyContent:"center" }}>
            {iconEl}
          </div>
        </div>
        <h3 style={{ fontSize:18, fontWeight:800, color:"#1F2A24", margin:"0 0 10px", textAlign:"center" }}>{title}</h3>
        <p style={{ fontSize:14, color:"#667085", lineHeight:1.6, margin:"0 0 22px", textAlign:"center" }}>{message}</p>
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

// ─── Activity Feed ────────────────────────────────────────────────────────────
function ActivityFeed({ entries, loading }: { entries: AuditEntry[]; loading: boolean }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? entries : entries.slice(0, 8);

  return (
    <div className="tm-tcard" style={{ marginBottom:18 }}>
      <div className="tm-tbar">
        <span style={{ fontWeight:700, color:"#1F2A24", fontSize:14, display:"flex", alignItems:"center", gap:8 }}>
          <Activity size={15} color="#667085" /> Fil d'activité
        </span>
        {!loading && entries.length > 0 && (
          <span className="badge badge-gray" style={{ fontSize:10 }}>{entries.length}</span>
        )}
      </div>

      {loading ? (
        <div style={{ padding:"8px 0" }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 20px",
                                  borderBottom:"1px solid #F4F6F5" }}>
              <div className="tm-skeleton" style={{ width:32, height:32, borderRadius:9, flexShrink:0 }} />
              <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
                <div className="tm-skeleton" style={{ width:"55%", height:11 }} />
                <div className="tm-skeleton" style={{ width:"22%", height:9 }} />
              </div>
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="tm-empty" style={{ padding:"32px 20px" }}>
          <Activity size={30} color="#E8ECEA" style={{ marginBottom:8 }} />
          <div>Aucune activité enregistrée pour l'instant.</div>
        </div>
      ) : (
        <div className="tm-activity-list">
          {visible.map(entry => {
            const s = actionStyle(entry.action);
            return (
              <div key={entry.id} className="tm-activity-item">
                <div className="tm-activity-icon" style={{ background:s.bg, color:s.color }}>
                  {s.icon}
                </div>
                <div className="tm-activity-body">
                  <div className="tm-activity-text">{describeAction(entry)}</div>
                  <div className="tm-activity-time">
                    <Clock size={9} style={{ verticalAlign:"middle", marginRight:3 }} />
                    {timeAgo(entry.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
          {entries.length > 8 && (
            <div className="tm-activity-more">
              <button className="btn-secondary" style={{ height:28, fontSize:12, padding:"0 12px" }}
                onClick={() => setShowAll(v => !v)}>
                {showAll ? "Voir moins" : `Voir les ${entries.length - 8} entrées restantes`}
              </button>
            </div>
          )}
        </div>
      )}
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
    type: "suspend" | "activate" | "revoke" | "cancelInvite" | "delete";
    id: string; label: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Search filter for members table
  const [memberSearch, setMemberSearch] = useState("");

  // Per-invitation resend loading
  const [resendingId, setResendingId] = useState<string | null>(null);

  const [activity, setActivity]             = useState<AuditEntry[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  function refresh() { setRefreshKey(k => k + 1); }

  // Load team data
  useEffect(() => {
    setLoading(true);
    setActivityLoading(true);
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

    fetch("/api/team/activity")
      .then(r => r.json())
      .then(d => setActivity(d.activity ?? []))
      .catch(() => {})
      .finally(() => setActivityLoading(false));
  }, [refreshKey]);

  const activeMembers    = members.filter(m => m.status === "active");
  const suspendedMembers = members.filter(m => m.status === "suspended");
  const pendingCount     = invitations.filter(i => i.status === "pending").length;
  const atLimit = quota && quota.plan.maxTeamMembers > 0 &&
    (activeMembers.length + suspendedMembers.length) >= quota.plan.maxTeamMembers;

  // Client-side search filter
  const filteredMembers = memberSearch.trim()
    ? members.filter(m =>
        m.user.fullName.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.user.email.toLowerCase().includes(memberSearch.toLowerCase())
      )
    : members;

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

      if (type === "delete") {
        const res = await fetch(`/api/team/${id}`, { method: "DELETE" });
        if (!res.ok) { const d = await res.json().catch(() => null); showToast(d?.error ?? "Erreur", false); return; }
        showToast("Collaborateur supprimé.");
        refresh();
        return;
      }

      const statusMap = { suspend: "suspended", activate: "active", revoke: "revoked", delete: "revoked" };
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
    setResendingId(invitationId);
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
    } finally {
      setResendingId(null);
    }
  }

  // Build ActionMenu items for a member row
  function memberMenuItems(m: Member): ActionMenuItem[] {
    const items: ActionMenuItem[] = [
      {
        label: "Modifier",
        icon: <Pencil size={13} />,
        onClick: () => setEditMember(m),
      },
    ];
    if (m.status === "active") {
      items.push({
        label: "Suspendre l'accès",
        icon: <XCircle size={13} />,
        onClick: () => setConfirmAction({ type:"suspend", id:m.id, label:m.user.fullName }),
        variant: "warning",
      });
    }
    if (m.status === "suspended") {
      items.push({
        label: "Réactiver",
        icon: <CheckCircle size={13} />,
        onClick: () => setConfirmAction({ type:"activate", id:m.id, label:m.user.fullName }),
        variant: "success",
      });
    }
    items.push({
      label: "Révoquer",
      icon: <Trash2 size={13} />,
      onClick: () => setConfirmAction({ type:"revoke", id:m.id, label:m.user.fullName }),
      variant: "danger",
    });
    items.push({
      label: "Supprimer définitivement",
      icon: <XCircle size={13} />,
      onClick: () => setConfirmAction({ type:"delete", id:m.id, label:m.user.fullName }),
      variant: "danger",
    });
    return items;
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
        {loading ? <KpiSkeleton /> : (
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
        )}

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
              {/* Search input */}
              {!loading && members.length > 0 && (
                <div style={{ position:"relative", display:"inline-flex", alignItems:"center" }}>
                  <span style={{ position:"absolute", left:9, color:"#98A2B3", display:"flex", pointerEvents:"none" }}>
                    <Users size={12} />
                  </span>
                  <input
                    className="tm-search"
                    type="text"
                    placeholder="Rechercher…"
                    value={memberSearch}
                    onChange={e => setMemberSearch(e.target.value)}
                  />
                </div>
              )}
              <button className="btn-secondary" style={{ marginLeft:"auto", height:30, padding:"0 10px", fontSize:12 }}
                onClick={refresh}>
                <RefreshCw size={11} /> Actualiser
              </button>
            </div>

            {loading ? (
              <TableSkeleton />
            ) : filteredMembers.length === 0 ? (
              <div className="tm-empty">
                <div className="tm-empty-icon"><Users size={36} color="#E8ECEA" /></div>
                <div>{memberSearch ? "Aucun résultat pour cette recherche." : "Aucun collaborateur actif."}</div>
              </div>
            ) : (
              <>
                {/* Desktop / tablet table */}
                <div className="tm-member-table-wrap" style={{ overflowX:"auto" }}>
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
                      {filteredMembers.map(m => (
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
                            <ActionMenu items={memberMenuItems(m)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="tm-member-cards">
                  {filteredMembers.map(m => (
                    <div key={m.id} className="tm-member-card">
                      <div className="tm-member-card-head">
                        <div className="tm-avatar" style={{ width:40, height:40, fontSize:14 }}>{initials(m.user.fullName)}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:700, fontSize:14, color:"#1F2A24", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.user.fullName}</div>
                          <div style={{ fontSize:11, color:"#98A2B3", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.user.email}</div>
                        </div>
                      </div>
                      <div className="tm-member-card-body">
                        <span style={{
                          display:"inline-flex", alignItems:"center", gap:4,
                          padding:"3px 9px", borderRadius:20, fontSize:11, fontWeight:600,
                          background: ROLE_BG[m.role], color: ROLE_COLORS[m.role],
                        }}>
                          <Shield size={10} /> {ROLE_LABELS[m.role]}
                        </span>
                        <span className={`badge ${STATUS_BADGE[m.status]}`}>{STATUS_LABELS[m.status]}</span>
                        {m.shopAccess.map(sa => (
                          <span key={sa.id} style={{
                            fontSize:10, fontWeight:600, background:"#EAF7EF", color:"#0A8F45",
                            borderRadius:6, padding:"2px 7px",
                          }}>
                            {sa.shop.name}
                          </span>
                        ))}
                      </div>
                      <div className="tm-member-card-footer">
                        <span style={{ fontSize:11, color:"#98A2B3" }}>Ajouté le {fmtDate(m.createdAt)}</span>
                        <ActionMenu items={memberMenuItems(m)} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
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
                      <td>
                        <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                          <span style={{ fontSize:11, color: new Date(inv.expiresAt) < new Date() ? "#EF4444" : "#98A2B3" }}>
                            {fmtDate(inv.expiresAt)}
                          </span>
                          {isExpiringSoon(inv.expiresAt) && new Date(inv.expiresAt) >= new Date() && (
                            <span style={{
                              display:"inline-flex", alignItems:"center", gap:3,
                              background:"#FFF1E5", color:"#F08A24",
                              borderRadius:20, fontSize:10, fontWeight:700,
                              padding:"2px 7px", whiteSpace:"nowrap",
                            }}>
                              <AlertCircle size={9} /> Expire bientôt
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="tm-act-btns">
                          <button
                            className="tm-act-btn"
                            title="Renvoyer l'invitation"
                            style={{ color: resendingId === inv.id ? "#98A2B3" : "#3B82F6" }}
                            onClick={() => handleResend(inv.id)}
                            disabled={resendingId === inv.id}
                          >
                            {resendingId === inv.id
                              ? <span className="spin"><RefreshCw size={12} /></span>
                              : <Send size={12} />
                            }
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

        {/* ── Fil d'activité ── */}
        <ActivityFeed entries={activity} loading={activityLoading} />

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
          confirmAction?.type === "delete"      ? "Supprimer le collaborateur ?" :
          "Annuler l'invitation ?"
        }
        message={
          confirmAction?.type === "suspend"
            ? `${confirmAction.label} ne pourra plus accéder aux boutiques jusqu'à réactivation.`
            : confirmAction?.type === "activate"
            ? `${confirmAction?.label} retrouvera l'accès à ses boutiques assignées.`
            : confirmAction?.type === "revoke"
            ? `Cette action est irréversible. ${confirmAction?.label} perdra tout accès définitivement.`
            : confirmAction?.type === "delete"
            ? `${confirmAction?.label} sera retiré de l'équipe et toutes ses données d'accès seront supprimées. Cette action est irréversible.`
            : `L'invitation envoyée à ${confirmAction?.label} sera annulée.`
        }
        confirmLabel={
          confirmAction?.type === "suspend"     ? "Suspendre" :
          confirmAction?.type === "activate"    ? "Réactiver" :
          confirmAction?.type === "revoke"      ? "Révoquer" :
          confirmAction?.type === "delete"      ? "Supprimer" :
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

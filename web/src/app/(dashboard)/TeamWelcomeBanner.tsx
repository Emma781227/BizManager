"use client";
import { useEffect, useState } from "react";
import { X, Store, Shield, CheckCircle, ArrowRight } from "lucide-react";

type Membership = {
  role:      string;
  ownerName: string;
  shops:     { id: string; name: string }[];
};

const ROLE_LABELS: Record<string, string> = {
  manager: "Manager",
  staff:   "Employé",
};
const ROLE_COLORS: Record<string, string> = {
  manager: "#175CD3",
  staff:   "#667085",
};
const ROLE_BG: Record<string, string> = {
  manager: "#EFF8FF",
  staff:   "#F2F4F7",
};

// Clé localStorage - une par utilisateur pour ne jamais re-afficher
function storageKey(userId: string) {
  return `bm_team_welcome_${userId}`;
}

export default function TeamWelcomeBanner({ userId }: { userId: string }) {
  const [membership, setMembership] = useState<Membership | null>(null);
  const [visible, setVisible]       = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(storageKey(userId))) return; // déjà vu

    fetch("/api/team/me")
      .then(r => r.json())
      .then(d => {
        if (d.membership) {
          setMembership(d.membership);
          setVisible(true);
        }
      })
      .catch(() => {});
  }, [userId]);

  function dismiss() {
    localStorage.setItem(storageKey(userId), "1");
    setVisible(false);
  }

  if (!visible || !membership) return null;

  const roleLabel = ROLE_LABELS[membership.role] ?? membership.role;
  const roleColor = ROLE_COLORS[membership.role] ?? "#667085";
  const roleBg    = ROLE_BG[membership.role]    ?? "#F2F4F7";

  return (
    <div style={{
      margin: "0 0 20px",
      background: "linear-gradient(135deg, #EAF7EF 0%, #F0F9F4 100%)",
      border: "1.5px solid #a8e8c2",
      borderRadius: 18,
      padding: "20px 22px",
      position: "relative",
      boxShadow: "0 2px 12px rgba(10,143,69,.08)",
    }}>

      {/* Bouton fermer */}
      <button
        onClick={dismiss}
        title="Fermer"
        style={{
          position: "absolute", top: 14, right: 14,
          background: "none", border: "none", cursor: "pointer",
          color: "#667085", padding: 4, borderRadius: 6,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <X size={15} />
      </button>

      {/* En-tête */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: "#0A8F45", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <CheckCircle size={22} color="#fff" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#1F2A24" }}>
            Bienvenue dans l'équipe !
          </div>
          <div style={{ fontSize: 13, color: "#667085", marginTop: 2 }}>
            Vous avez rejoint l'équipe de <strong style={{ color: "#1F2A24" }}>{membership.ownerName}</strong>.
          </div>
        </div>
      </div>

      {/* Détails */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>

        {/* Rôle */}
        <div style={{
          background: "#fff", border: "1px solid #E8ECEA", borderRadius: 12,
          padding: "10px 14px", display: "flex", alignItems: "center", gap: 10,
          minWidth: 160,
        }}>
          <div style={{
            background: roleBg, color: roleColor,
            borderRadius: 8, width: 30, height: 30, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Shield size={14} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#98A2B3", fontWeight: 500 }}>Votre rôle</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: roleColor }}>{roleLabel}</div>
          </div>
        </div>

        {/* Boutiques */}
        <div style={{
          background: "#fff", border: "1px solid #E8ECEA", borderRadius: 12,
          padding: "10px 14px", flex: 1, minWidth: 200,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <Store size={13} color="#98A2B3" />
            <span style={{ fontSize: 11, color: "#98A2B3", fontWeight: 500 }}>
              Boutiques accessibles ({membership.shops.length})
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {membership.shops.map(s => (
              <span key={s.id} style={{
                fontSize: 12, fontWeight: 600,
                background: "#EAF7EF", color: "#0A8F45",
                borderRadius: 6, padding: "3px 9px",
              }}>
                {s.name}
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* CTA */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <span style={{ fontSize: 12, color: "#667085" }}>
          Cette bannière n'apparaîtra plus après fermeture.
        </span>
        <button
          onClick={dismiss}
          style={{
            height: 34, padding: "0 16px",
            background: "#0A8F45", color: "#fff",
            border: "none", borderRadius: 10,
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 6,
          }}
        >
          Compris, continuer <ArrowRight size={14} strokeWidth={2.25} style={{ verticalAlign: "-2px" }} />
        </button>
      </div>
    </div>
  );
}

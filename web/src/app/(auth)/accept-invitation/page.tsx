"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

type InvitationData = {
  id: string;
  email: string;
  role: "manager" | "staff";
  expiresAt: string;
  shops: { id: string; name: string }[];
  ownerName: string;
};

type PageState =
  | { phase: "loading" }
  | { phase: "error"; message: string; code?: string }
  | { phase: "ready"; invitation: InvitationData; userExists: boolean; token: string }
  | { phase: "success" };

const ROLE_LABELS: Record<string, string> = {
  owner:   "Propriétaire",
  manager: "Manager",
  staff:   "Employé",
};

const ROLE_COLORS: Record<string, string> = {
  manager: "background:#dbeafe;color:#1e40af",
  staff:   "background:#f0fdf4;color:#15803d",
};

export default function AcceptInvitationPage() {
  const router = useRouter();
  const [state, setState] = useState<PageState>({ phase: "loading" });
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token")?.trim();
    if (!token) {
      setState({ phase: "error", message: "Lien d'invitation invalide. Aucun jeton trouvé." });
      return;
    }

    fetch(`/api/auth/accept-invitation?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json() as {
          error?: string;
          status?: string;
          invitation?: InvitationData;
          userExists?: boolean;
        };
        if (!res.ok) {
          setState({ phase: "error", message: data.error ?? "Invitation invalide.", code: data.status });
          return;
        }
        setState({
          phase: "ready",
          invitation: data.invitation!,
          userExists: data.userExists ?? false,
          token,
        });
      })
      .catch(() => {
        setState({ phase: "error", message: "Erreur réseau. Vérifiez votre connexion et réessayez." });
      });
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state.phase !== "ready") return;
    setError(null);

    if (!state.userExists) {
      if (!fullName.trim() || fullName.trim().length < 2) {
        setError("Entrez votre nom complet (min. 2 caractères).");
        return;
      }
      if (!password || password.length < 8) {
        setError("Le mot de passe doit contenir au moins 8 caractères.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const body: Record<string, string> = { token: state.token };
      if (!state.userExists) {
        body.fullName = fullName.trim();
        body.password = password;
      }

      const res = await fetch("/api/auth/accept-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json() as { success?: boolean; error?: string; redirectTo?: string };

      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        return;
      }

      setState({ phase: "success" });
      router.push(data.redirectTo ?? "/dashboard");
      router.refresh();
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      style={{ minHeight: "100vh", background: "linear-gradient(180deg,#f6f8f6 0%,#eff4ef 100%)" }}
      className="flex flex-col items-center justify-center px-4 py-10"
    >
      {/* Top accent bar */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 4, background: "#0f5f38" }} />

      {/* Logo */}
      <div className="mb-8 flex items-center gap-2">
        <div
          style={{ background: "#0f5f38", borderRadius: 12, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}
          className="text-white font-bold text-base"
        >
          B
        </div>
        <span style={{ color: "#135a35", fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.02em" }}>
          BizManager
        </span>
      </div>

      {/* Card */}
      <div
        style={{
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: 20,
          boxShadow: "0 16px 50px rgba(15,23,42,0.09)",
          width: "100%",
          maxWidth: 440,
          padding: "2rem 1.75rem",
        }}
      >
        {/* LOADING */}
        {state.phase === "loading" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "2rem 0" }}>
            <div
              style={{
                width: 40, height: 40, borderRadius: "50%",
                border: "3px solid #e2e8f0",
                borderTopColor: "#0f5f38",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <p style={{ color: "#64748b", fontSize: "0.875rem" }}>Vérification de l'invitation…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* ERROR */}
        {state.phase === "error" && (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div
              style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "#fef2f2",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 1rem",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <h2 style={{ fontWeight: 700, fontSize: "1.1rem", color: "#0f172a", marginBottom: 8 }}>
              {state.code === "expired" ? "Invitation expirée" :
               state.code === "accepted" ? "Invitation déjà acceptée" :
               state.code === "cancelled" ? "Invitation annulée" :
               "Invitation invalide"}
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.875rem", lineHeight: 1.6 }}>{state.message}</p>
            {(state.code === "expired" || state.code === "cancelled") && (
              <p style={{ marginTop: 12, color: "#64748b", fontSize: "0.8rem" }}>
                Demandez à votre administrateur de vous renvoyer une invitation.
              </p>
            )}
            <div style={{ marginTop: 24 }}>
              <a
                href="/login"
                style={{
                  display: "inline-block",
                  padding: "0.5rem 1.25rem",
                  borderRadius: 10,
                  background: "#0f5f38",
                  color: "white",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  textDecoration: "none",
                }}
              >
                Retour à la connexion
              </a>
            </div>
          </div>
        )}

        {/* SUCCESS */}
        {state.phase === "success" && (
          <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
            <div
              style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "#f0fdf4",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 1rem",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h2 style={{ fontWeight: 700, fontSize: "1.1rem", color: "#0f172a", marginBottom: 8 }}>
              Invitation acceptée !
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.875rem" }}>Redirection vers votre tableau de bord…</p>
          </div>
        )}

        {/* READY */}
        {state.phase === "ready" && (
          <>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: "#f0fdf4",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f5f38" strokeWidth="1.8">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h1 style={{ fontWeight: 800, fontSize: "1.25rem", color: "#0f172a", marginBottom: 6 }}>
                Rejoindre l'équipe
              </h1>
              <p style={{ color: "#64748b", fontSize: "0.875rem", lineHeight: 1.5 }}>
                <strong style={{ color: "#0f172a" }}>{state.invitation.ownerName}</strong> vous invite à rejoindre
                son espace BizManager.
              </p>
            </div>

            {/* Invitation details */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: "0.875rem 1rem",
                marginBottom: 20,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {/* Email */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8">
                  <path d="M4 6h16v12H4z" /><path d="m4 7 8 6 8-6" />
                </svg>
                <span style={{ fontSize: "0.8125rem", color: "#475569" }}>
                  Compte lié à <strong style={{ color: "#0f172a" }}>{state.invitation.email}</strong>
                </span>
              </div>

              {/* Role */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8">
                  <path d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3Z" />
                </svg>
                <span style={{ fontSize: "0.8125rem", color: "#475569" }}>Rôle assigné :</span>
                <span
                  style={{
                    fontSize: "0.75rem", fontWeight: 600, borderRadius: 6,
                    padding: "2px 8px",
                    ...(ROLE_COLORS[state.invitation.role]
                      ? Object.fromEntries(ROLE_COLORS[state.invitation.role].split(";").map(p => p.split(":")))
                      : { background: "#f1f5f9", color: "#475569" }),
                  }}
                >
                  {ROLE_LABELS[state.invitation.role] ?? state.invitation.role}
                </span>
              </div>

              {/* Shops */}
              {state.invitation.shops.length > 0 && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8" style={{ flexShrink: 0, marginTop: 1 }}>
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {state.invitation.shops.map(s => (
                      <span
                        key={s.id}
                        style={{
                          fontSize: "0.75rem", fontWeight: 500,
                          background: "#f0fdf4", color: "#15803d",
                          border: "1px solid #bbf7d0",
                          borderRadius: 6, padding: "2px 8px",
                        }}
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Form */}
            <form noValidate onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {!state.userExists && (
                <>
                  <p
                    style={{
                      background: "#eff6ff", border: "1px solid #bfdbfe",
                      borderRadius: 10, padding: "0.625rem 0.875rem",
                      fontSize: "0.8rem", color: "#1d4ed8", lineHeight: 1.5,
                    }}
                  >
                    Aucun compte n'existe pour <strong>{state.invitation.email}</strong>.
                    Créez votre mot de passe pour rejoindre l'équipe.
                  </p>

                  <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "#374151" }}>Nom complet</span>
                    <input
                      required
                      type="text"
                      minLength={2}
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Votre prénom et nom"
                      style={{
                        height: 40, borderRadius: 10, border: "1px solid #e2e8f0",
                        padding: "0 0.75rem", fontSize: "0.875rem", outline: "none",
                        transition: "border-color 0.15s",
                      }}
                      onFocus={e => (e.target.style.borderColor = "#0f5f38")}
                      onBlur={e => (e.target.style.borderColor = "#e2e8f0")}
                    />
                  </label>

                  <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "#374151" }}>Mot de passe</span>
                    <div style={{ position: "relative" }}>
                      <input
                        required
                        type={showPassword ? "text" : "password"}
                        minLength={8}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Min. 8 caractères"
                        style={{
                          height: 40, borderRadius: 10, border: "1px solid #e2e8f0",
                          padding: "0 2.5rem 0 0.75rem", fontSize: "0.875rem",
                          outline: "none", width: "100%", boxSizing: "border-box",
                          transition: "border-color 0.15s",
                        }}
                        onFocus={e => (e.target.style.borderColor = "#0f5f38")}
                        onBlur={e => (e.target.style.borderColor = "#e2e8f0")}
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? "Masquer" : "Afficher"}
                        onClick={() => setShowPassword(p => !p)}
                        style={{
                          position: "absolute", right: 10, top: "50%",
                          transform: "translateY(-50%)",
                          background: "none", border: "none",
                          cursor: "pointer", color: "#94a3b8", padding: 0,
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          {showPassword ? (
                            <>
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </>
                          ) : (
                            <>
                              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                              <circle cx="12" cy="12" r="3" />
                            </>
                          )}
                        </svg>
                      </button>
                    </div>
                  </label>
                </>
              )}

              {state.userExists && (
                <p
                  style={{
                    background: "#f0fdf4", border: "1px solid #bbf7d0",
                    borderRadius: 10, padding: "0.625rem 0.875rem",
                    fontSize: "0.8rem", color: "#15803d", lineHeight: 1.5,
                  }}
                >
                  Votre compte BizManager (<strong>{state.invitation.email}</strong>) sera ajouté à cette équipe.
                </p>
              )}

              {error && (
                <p
                  style={{
                    background: "#fef2f2", border: "1px solid #fecaca",
                    borderRadius: 10, padding: "0.625rem 0.875rem",
                    fontSize: "0.8rem", color: "#dc2626",
                  }}
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  height: 42, borderRadius: 10, background: "#0f5f38",
                  color: "white", fontWeight: 600, fontSize: "0.9rem",
                  border: "none", cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.7 : 1,
                  boxShadow: "0 8px 20px rgba(15,95,56,0.2)",
                  transition: "opacity 0.15s",
                }}
              >
                {submitting ? "Traitement…" : state.userExists ? "Rejoindre l'équipe" : "Créer mon compte et rejoindre"}
              </button>

              <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#94a3b8" }}>
                Déjà un compte ?{" "}
                <a href="/login" style={{ color: "#0f5f38", fontWeight: 600, textDecoration: "none" }}>
                  Se connecter
                </a>
              </p>
            </form>
          </>
        )}
      </div>

      {/* Footer note */}
      <p style={{ marginTop: 20, fontSize: "0.75rem", color: "#94a3b8", textAlign: "center" }}>
        En acceptant, vous rejoignez l'espace BizManager de votre équipe.
      </p>
    </main>
  );
}

"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [registerStep, setRegisterStep] = useState<"details" | "verify">("details");
  const [info, setInfo] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [emailUsedPopup, setEmailUsedPopup] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<"details" | "verify">("details");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [forgotPassword, setForgotPassword] = useState("");
  const [forgotInfo, setForgotInfo] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setIsLoading(true);

    const endpoint =
      mode === "login"
        ? "/api/auth/login"
        : registerStep === "details"
          ? "/api/auth/register/request-code"
          : "/api/auth/register";

    const payload =
      mode === "login"
        ? { email, password }
        : registerStep === "details"
          ? { fullName, email, password }
          : { fullName, email, password, code: verificationCode };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        const errorMessage = data?.error ?? "Echec de l'authentification";
        const isEmailAlreadyUsed =
          response.status === 409 ||
          errorMessage.toLowerCase().includes("email deja utilise") ||
          errorMessage.toLowerCase().includes("email déjà utilisé");

        if (mode === "register" && isEmailAlreadyUsed) {
          setEmailUsedPopup("Cet email est deja utilise. Connectez-vous ou utilisez un autre email.");
        } else {
          setError(errorMessage);
        }
        return;
      }

      if (mode === "register" && registerStep === "details") {
        setRegisterStep("verify");
        setInfo("Code envoye. Verifiez votre boite email puis entrez le code.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setError(null);
    setInfo(null);
    setEmailUsedPopup(null);
    setRegisterStep("details");
    setVerificationCode("");
    setForgotOpen(false);
    setForgotStep("details");
    setForgotInfo(null);
    setForgotError(null);
    setForgotCode("");
    setForgotPassword("");
  }

  async function onForgotSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setForgotError(null);
    setForgotInfo(null);
    setForgotLoading(true);

    const endpoint =
      forgotStep === "details"
        ? "/api/auth/forgot-password/request-code"
        : "/api/auth/forgot-password/reset";

    const payload =
      forgotStep === "details"
        ? { email: forgotEmail }
        : { email: forgotEmail, code: forgotCode, newPassword: forgotPassword };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as { error?: string; data?: { message?: string } } | null;

      if (!response.ok) {
        setForgotError(data?.error ?? "Operation impossible");
        return;
      }

      if (forgotStep === "details") {
        setForgotStep("verify");
        setForgotInfo(data?.data?.message ?? "Code envoye. Verifiez votre boite email.");
        return;
      }

      setForgotInfo("Mot de passe reinitialise. Vous pouvez vous connecter.");
      setForgotOpen(false);
      setMode("login");
      setEmail(forgotEmail);
      setPassword("");
      setForgotStep("details");
      setForgotCode("");
      setForgotPassword("");
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <main className="auth-wrap">
      {emailUsedPopup ? (
        <div className="popup-backdrop" role="dialog" aria-modal="true" aria-label="Email deja utilise">
          <div className="popup-card">
            <h3>Email deja utilise</h3>
            <p>{emailUsedPopup}</p>
            <div className="popup-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  setEmailUsedPopup(null);
                  setMode("login");
                  setError(null);
                  setInfo(null);
                  setRegisterStep("details");
                  setVerificationCode("");
                }}
              >
                Se connecter
              </button>
              <button type="button" onClick={() => setEmailUsedPopup(null)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <section className="phone-shell">
        <div className="auth-card">
          <div className="brand">
            <span className="brand-mark">BM</span>
            <h1>BizManager</h1>
            <p>{mode === "login" ? "Connexion" : "Inscription"}</p>
          </div>

          <div className="auth-switch">
            <button
              type="button"
              className={mode === "login" ? "active" : ""}
              onClick={() => switchMode("login")}
            >
              Se connecter
            </button>
            <button
              type="button"
              className={mode === "register" ? "active" : ""}
              onClick={() => switchMode("register")}
            >
              S&apos;inscrire
            </button>
          </div>

          <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          {mode === "register" ? (
            <label style={{ display: "grid", gap: 6 }}>
              Nom complet
              <input
                required
                minLength={2}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </label>
          ) : null}

          <label style={{ display: "grid", gap: 6 }}>
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            Mot de passe
            <div className="password-field-wrap">
              <input
                required
                type={showPassword ? "text" : "password"}
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className={`password-eye-btn ${showPassword ? "" : "masked"}`}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" className="password-eye-icon" aria-hidden="true">
                    <path
                      d="M1.5 12s3.8-6 10.5-6 10.5 6 10.5 6-3.8 6-10.5 6S1.5 12 1.5 12Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="password-eye-icon" aria-hidden="true">
                    <path
                      d="M1.5 12s3.8-6 10.5-6 10.5 6 10.5 6-3.8 6-10.5 6S1.5 12 1.5 12Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                )}
              </button>
            </div>
          </label>

          {mode === "login" ? (
            <button
              type="button"
              className="forgot-link"
              onClick={() => {
                setForgotOpen((prev) => !prev);
                setForgotError(null);
                setForgotInfo(null);
                setForgotEmail(email);
              }}
            >
              Mot de passe oublie ?
            </button>
          ) : null}

          {mode === "register" && registerStep === "verify" ? (
            <label style={{ display: "grid", gap: 6 }}>
              Code de verification
              <input
                required
                inputMode="numeric"
                pattern="\\d{6}"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                placeholder="Entrez les 6 chiffres"
              />
            </label>
          ) : null}

          {info ? <p className="feedback success">{info}</p> : null}

          {error ? <p className="feedback error">{error}</p> : null}

          <button disabled={isLoading} type="submit">
            {isLoading
              ? "Chargement..."
              : mode === "login"
                ? "Se connecter"
                : registerStep === "details"
                  ? "Envoyer le code"
                  : "Creer le compte"}
          </button>

          {mode === "register" && registerStep === "verify" ? (
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                setRegisterStep("details");
                setVerificationCode("");
                setInfo(null);
              }}
            >
              Modifier email ou mot de passe
            </button>
          ) : null}
          </form>

          {mode === "login" && forgotOpen ? (
            <form className="forgot-panel" onSubmit={onForgotSubmit}>
              <h3>Reinitialiser le mot de passe</h3>
              <p>
                {forgotStep === "details"
                  ? "Entrez votre email pour recevoir un code."
                  : "Entrez le code recu et votre nouveau mot de passe."}
              </p>

              <label style={{ display: "grid", gap: 6 }}>
                Email
                <input
                  required
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
              </label>

              {forgotStep === "verify" ? (
                <>
                  <label style={{ display: "grid", gap: 6 }}>
                    Code de verification
                    <input
                      required
                      inputMode="numeric"
                      pattern="\\d{6}"
                      maxLength={6}
                      value={forgotCode}
                      onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="Entrez les 6 chiffres"
                    />
                  </label>

                  <label style={{ display: "grid", gap: 6 }}>
                    Nouveau mot de passe
                    <div className="password-field-wrap">
                      <input
                        required
                        type={showForgotPassword ? "text" : "password"}
                        minLength={8}
                        value={forgotPassword}
                        onChange={(e) => setForgotPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className={`password-eye-btn ${showForgotPassword ? "" : "masked"}`}
                        aria-label={showForgotPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                        onClick={() => setShowForgotPassword((prev) => !prev)}
                      >
                        {showForgotPassword ? (
                          <svg viewBox="0 0 24 24" className="password-eye-icon" aria-hidden="true">
                            <path
                              d="M1.5 12s3.8-6 10.5-6 10.5 6 10.5 6-3.8 6-10.5 6S1.5 12 1.5 12Z"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" className="password-eye-icon" aria-hidden="true">
                            <path
                              d="M1.5 12s3.8-6 10.5-6 10.5 6 10.5 6-3.8 6-10.5 6S1.5 12 1.5 12Z"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </label>
                </>
              ) : null}

              {forgotInfo ? <p className="feedback success">{forgotInfo}</p> : null}
              {forgotError ? <p className="feedback error">{forgotError}</p> : null}

              <div className="forgot-actions">
                <button disabled={forgotLoading} type="submit">
                  {forgotLoading
                    ? "Chargement..."
                    : forgotStep === "details"
                      ? "Envoyer le code"
                      : "Changer le mot de passe"}
                </button>

                {forgotStep === "verify" ? (
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => {
                      setForgotStep("details");
                      setForgotCode("");
                      setForgotPassword("");
                      setForgotInfo(null);
                      setForgotError(null);
                    }}
                  >
                    Renvoyer un code
                  </button>
                ) : null}
              </div>
            </form>
          ) : null}
        </div>
      </section>
    </main>
  );
}

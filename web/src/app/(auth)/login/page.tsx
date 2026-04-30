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
  const [registerErrorPopup, setRegisterErrorPopup] = useState<string | null>(null);
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
  const [rememberMe, setRememberMe] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setRegisterErrorPopup(null);

    if (!email.trim()) {
      setError("Entrez votre email");
      return;
    }

    if (!password || password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caracteres");
      return;
    }

    if (mode === "register") {
      if (!fullName.trim() || fullName.trim().length < 2) {
        setError("Entrez votre nom complet");
        return;
      }

      if (registerStep === "verify") {
        if (!/^\d{6}$/.test(verificationCode)) {
          setError("Entrez un code de verification a 6 chiffres");
          return;
        }
      }
    }

    setIsLoading(true);

    const endpoint =
      mode === "login"
        ? "/api/auth/login"
        : registerStep === "details"
          ? "/api/auth/register/request-code"
          : "/api/auth/register";

    const payload =
      mode === "login"
        ? { email, password, rememberMe }
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
        } else if (
          mode === "register" &&
          (errorMessage.toLowerCase().includes("service email non configure") ||
            errorMessage.toLowerCase().includes("impossible d'envoyer le code"))
        ) {
          setRegisterErrorPopup(
            "L'envoi du code email n'est pas encore configure. Vérifie les variables SMTP dans .env.local ou sur Vercel.",
          );
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
    setRegisterErrorPopup(null);
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

    if (!forgotEmail.trim()) {
      setForgotError("Entrez votre email");
      return;
    }

    if (forgotStep === "verify") {
      if (!/^\d{6}$/.test(forgotCode)) {
        setForgotError("Entrez le code a 6 chiffres recu par email");
        return;
      }

      if (!forgotPassword || forgotPassword.length < 8) {
        setForgotError("Le nouveau mot de passe doit contenir au moins 8 caracteres");
        return;
      }
    }

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
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f6f8f6_0%,#eff4ef_100%)] text-slate-900">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-emerald-600" />
      <div className="pointer-events-none absolute -left-24 top-16 h-80 w-80 rounded-full bg-emerald-200/60 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-40 h-96 w-96 rounded-full bg-white/70 blur-3xl" />

      {emailUsedPopup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Email deja utilise">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-slate-950">Email deja utilise</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{emailUsedPopup}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
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
              <button type="button" className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700" onClick={() => setEmailUsedPopup(null)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {registerErrorPopup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Configuration email manquante">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-slate-950">Email non configure</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{registerErrorPopup}</p>
            <div className="mt-6 flex justify-end">
              <button type="button" className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700" onClick={() => setRegisterErrorPopup(null)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-8 rounded-4xl border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur xl:p-10">
            <div className="inline-flex items-center gap-3 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">BM</span>
              Plateforme de gestion pour commercants
            </div>

            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-700">BizManager</p>
              <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-5xl">
                Connectez-vous, gerez vos ventes et gardez le controle.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Utilisez un espace unique pour vous connecter, creer un compte, recuperer l&apos;acces et reprendre votre activite sans friction.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Acces rapide</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">Connexion simple</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Securite</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">Codes verifies</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Mobile first</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">Pensé telephone</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2.25rem] bg-emerald-100/50 blur-2xl" />
            <div className="relative overflow-hidden rounded-4xl border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.14)] sm:p-8">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                  <p className="text-sm font-medium text-emerald-700">Acces compte</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950">{mode === "login" ? "Connexion" : "Creer un compte"}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {mode === "login"
                      ? "Entrez vos identifiants pour continuer."
                      : registerStep === "details"
                        ? "Completez vos informations pour recevoir un code de verification."
                        : "Saisissez le code recu pour finaliser l&apos;inscription."}
                  </p>
                </div>

                <div className="hidden rounded-2xl bg-emerald-50 px-3 py-2 text-right sm:block">
                  <p className="text-xs uppercase tracking-[0.24em] text-emerald-700">Secure</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-900">BizManager</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
                <button
                  type="button"
                  className={`rounded-xl px-4 py-3 text-sm font-medium transition ${mode === "login" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                  onClick={() => switchMode("login")}
                >
                  Se connecter
                </button>
                <button
                  type="button"
                  className={`rounded-xl px-4 py-3 text-sm font-medium transition ${mode === "register" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                  onClick={() => switchMode("register")}
                >
                  S&apos;inscrire
                </button>
              </div>

              {mode === "register" && registerStep === "details" ? (
                <p className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Remplissez le formulaire puis demandez le code de verification.
                </p>
              ) : null}

              <form noValidate onSubmit={onSubmit} className="mt-6 space-y-4">
                {mode === "register" ? (
                  <label className="block space-y-2 text-sm font-medium text-slate-700">
                    <span>Nom complet</span>
                    <input
                      required
                      minLength={2}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                      placeholder="Votre nom et prenom"
                    />
                  </label>
                ) : null}

                <label className="block space-y-2 text-sm font-medium text-slate-700">
                  <span>Email</span>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    placeholder="vous@exemple.com"
                  />
                </label>

                <label className="block space-y-2 text-sm font-medium text-slate-700">
                  <span>Mot de passe</span>
                  <div className="relative">
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                      placeholder="Au moins 8 caracteres"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center justify-center px-4 text-slate-500 transition hover:text-slate-800"
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      <span className="text-xs font-semibold uppercase tracking-[0.2em]">{showPassword ? "Hide" : "Show"}</span>
                    </button>
                  </div>
                </label>

                {mode === "register" && registerStep === "verify" ? (
                  <label className="block space-y-2 text-sm font-medium text-slate-700">
                    <span>Code de verification</span>
                    <input
                      required
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      minLength={6}
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="Entrez les 6 chiffres"
                      title="Entrez exactement 6 chiffres"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>
                ) : null}

                {mode === "login" ? (
                  <div className="flex items-center justify-between gap-4 pt-1 text-sm">
                    <label className="flex items-center gap-2 text-slate-600">
                      <input
                        type="checkbox"
                        name="rememberMe"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Se souvenir de moi</span>
                    </label>

                    <button
                      type="button"
                      className="font-medium text-emerald-700 transition hover:text-emerald-800"
                      onClick={() => {
                        setForgotOpen((prev) => !prev);
                        setForgotError(null);
                        setForgotInfo(null);
                        setForgotEmail(email);
                      }}
                    >
                      Mot de passe oublie ?
                    </button>
                  </div>
                ) : null}

                {info ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{info}</p> : null}
                {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

                <button
                  disabled={isLoading}
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
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
                    className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
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
                <form noValidate className="mt-6 space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5" onSubmit={onForgotSubmit}>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">Reinitialiser le mot de passe</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {forgotStep === "details"
                        ? "Entrez votre email pour recevoir un code."
                        : "Entrez le code recu et votre nouveau mot de passe."}
                    </p>
                  </div>

                  <label className="block space-y-2 text-sm font-medium text-slate-700">
                    <span>Email</span>
                    <input
                      required
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                      placeholder="vous@exemple.com"
                    />
                  </label>

                  {forgotStep === "verify" ? (
                    <>
                      <label className="block space-y-2 text-sm font-medium text-slate-700">
                        <span>Code de verification</span>
                        <input
                          required
                          inputMode="numeric"
                          pattern="[0-9]{6}"
                          minLength={6}
                          maxLength={6}
                          value={forgotCode}
                          onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, ""))}
                          placeholder="Entrez les 6 chiffres"
                          title="Entrez exactement 6 chiffres"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                        />
                      </label>

                      <label className="block space-y-2 text-sm font-medium text-slate-700">
                        <span>Nouveau mot de passe</span>
                        <div className="relative">
                          <input
                            required
                            type={showForgotPassword ? "text" : "password"}
                            minLength={8}
                            value={forgotPassword}
                            onChange={(e) => setForgotPassword(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                            placeholder="Nouveau mot de passe"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center justify-center px-4 text-slate-500 transition hover:text-slate-800"
                            aria-label={showForgotPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                            onClick={() => setShowForgotPassword((prev) => !prev)}
                          >
                            <span className="text-xs font-semibold uppercase tracking-[0.2em]">{showForgotPassword ? "Hide" : "Show"}</span>
                          </button>
                        </div>
                      </label>
                    </>
                  ) : null}

                  {forgotInfo ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{forgotInfo}</p> : null}
                  {forgotError ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{forgotError}</p> : null}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      disabled={forgotLoading}
                      type="submit"
                      className="inline-flex flex-1 items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {forgotLoading
                        ? "Chargement..."
                        : forgotStep === "details"
                          ? "Envoyer le code"
                          : "Changer le mot de passe"}
                    </button>

                    {forgotStep === "verify" ? (
                      <button
                        type="button"
                        className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-white"
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
          </div>
        </div>
      </section>
    </main>
  );
}

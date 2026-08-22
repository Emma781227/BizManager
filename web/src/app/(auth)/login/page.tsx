"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

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
  const [gsiReady, setGsiReady] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "business" | "premium" | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "register") {
      setMode("register");
    }
    const p = params.get("plan");
    if (p === "starter" || p === "business" || p === "premium") {
      setSelectedPlan(p);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    const src = "https://accounts.google.com/gsi/client";

    function initGSI() {
      const g = (window as any).google;
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!g || !clientId || clientId === "REPLACE_WITH_GOOGLE_CLIENT_ID") {
        return;
      }
      try {
        g.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: (resp: any) => handleCredentialResponse(resp),
        });
        setGsiReady(true);
      } catch (e) {
        console.warn("GSI init failed", e);
        setGsiReady(false);
      }
    }

    if (!document.querySelector(`script[src="${src}"]`)) {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
      s.onload = initGSI;
    } else {
      initGSI();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCredentialResponse(response: any) {
    console.log("GSI credential response:", response);
    if (!response?.credential) {
      setError("Jeton Google introuvable");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: response.credential }),
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Echec connexion Google");
      }
    } catch (err) {
      console.error(err);
      setError("Erreur réseau pendant la connexion Google");
    } finally {
      setIsLoading(false);
    }
  }

  function handleGoogleButton() {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || clientId === "REPLACE_WITH_GOOGLE_CLIENT_ID") {
      setError("Connexion Google non configurée : ajoutez NEXT_PUBLIC_GOOGLE_CLIENT_ID dans .env.local puis redémarrez.");
      return;
    }
    if (!gsiReady) {
      setError("Le service Google n'est pas encore chargé, réessayez dans quelques secondes.");
      return;
    }

    const g = (window as any).google;
    if (g && g.accounts && typeof g.accounts.id?.prompt === "function") {
      try {
        g.accounts.id.prompt();
      } catch (err: any) {
        console.error("GSI prompt error:", err);
        setError(err?.message ?? "Erreur lors de l'appel Google Identity");
      }
    } else {
      setError("Le service Google n'est pas chargé");
    }
  }

  const marketingKpis = [
    { value: "318", label: "Produits actifs", icon: "cube" },
    { value: "156", label: "Commandes suivies", icon: "clipboard" },
    { value: "842", label: "Clients gérés", icon: "users" },
  ] as const;

  const dashboardMenu = [
    "Tableau de bord",
    "Produits",
    "Commandes",
    "Clients",
    "Paiements",
    "WhatsApp",
    "Rapports",
    "Paramètres",
  ] as const;

  const chartBars = [18, 26, 32, 24, 38, 30, 28, 36, 44, 41, 34, 46, 39, 52, 45, 37];

  const recentOrders = [
    { order: "#BM-1258", client: "Amina Diallo", status: "Livrée", amount: "85,00 €", date: "18 mai 2024" },
    { order: "#BM-1257", client: "Sarah M.", status: "En cours", amount: "120,00 €", date: "18 mai 2024" },
    { order: "#BM-1256", client: "Moussa K.", status: "Confirmée", amount: "63,50 €", date: "17 mai 2024" },
  ] as const;

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
          : { fullName, email, password, code: verificationCode, ...(selectedPlan ? { plan: selectedPlan } : {}) };

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

      // Après inscription avec plan payant → rediriger vers GeniusPay
      if (mode === "register" && (selectedPlan === "business" || selectedPlan === "premium")) {
        setInfo("Compte créé ! Redirection vers le paiement sécurisé…");
        const checkoutRes = await fetch("/api/billing/create-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planName: selectedPlan, billingCycle: "monthly" }),
        });
        const checkoutData = await checkoutRes.json() as { checkoutUrl?: string; error?: string };
        if (checkoutRes.ok && checkoutData.checkoutUrl) {
          window.location.href = checkoutData.checkoutUrl;
          return;
        }
        setError(checkoutData.error ?? "Erreur lors de la création du paiement. Accédez à votre tableau de bord pour réessayer.");
        setIsLoading(false);
        router.push("/dashboard");
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

      <section className="grid min-h-screen lg:grid-cols-[1.1fr_1.05fr]">
        <div className="relative hidden overflow-hidden border-b border-emerald-100 bg-linear-to-br from-[#f7fbf5] via-white to-[#edf4ee] px-3 py-4 sm:px-4 lg:block lg:border-b-0 lg:border-r lg:px-8 lg:py-4">
          <div className="pointer-events-none absolute left-0 top-0 h-full w-full">
            <div className="absolute -left-20 top-12 h-72 w-72 rounded-full bg-emerald-100/70 blur-3xl" />
            <div className="absolute right-12 top-8 h-48 w-48 rounded-full bg-white/70 blur-3xl" />
            <div className="absolute right-16 top-20 grid grid-cols-6 gap-2 opacity-30">
              {Array.from({ length: 36 }).map((_, index) => (
                <span key={index} className="h-1.5 w-1.5 rounded-full bg-emerald-200" />
              ))}
            </div>
          </div>

          <div className="relative flex min-h-full flex-col gap-4 lg:gap-5">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0f5f38] text-base font-bold text-white shadow-sm">B</div>
              <span className="text-xl font-extrabold tracking-tight text-[#135a35]">BizManager</span>
            </div>

            <div className="max-w-135 space-y-2">
              <h1 className="max-w-135 text-[clamp(1.75rem,3vw,2.25rem)] font-black leading-[0.92] tracking-tight text-[#104f2f] sm:text-[clamp(1.9rem,3vw,2.4rem)]">
                Pilotez votre boutique
                <br />
                simplement
              </h1>
              <p className="max-w-130 text-sm leading-5 text-slate-600 sm:text-[0.95rem]">
                Gérez vos produits, vos commandes, vos clients, vos paiements
                et vos ventes WhatsApp depuis un seul endroit.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 lg:flex-nowrap lg:gap-3">
              {marketingKpis.map((item) => (
                <article key={item.label} className="flex h-16 min-w-40 flex-1 items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 text-sm shadow-[0_8px_20px_rgba(15,23,42,0.07)]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-[#145f38]">
                    {item.icon === "cube" ? (
                      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                        <path d="M3.3 7.2 12 12l8.7-4.8M12 22V12" />
                      </svg>
                    ) : item.icon === "clipboard" ? (
                      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                        <rect x="5" y="4" width="14" height="16" rx="2" />
                        <path d="M9 4V2h6v2" />
                        <path d="M8 9h8M8 13h8" />
                      </svg>
                    ) : (
                      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-extrabold leading-none tracking-tight text-[#145f38]">{item.value}</p>
                    <p className="mt-0.5 text-xs font-medium text-slate-600">{item.label}</p>
                  </div>
                </article>
              ))}
            </div>

            <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.07)]">
              <div className="flex min-h-64 flex-col lg:min-h-72 lg:flex-row">
                <aside className="flex w-full flex-col border-b border-slate-100 bg-[#f9fbf8] px-3 py-2 lg:w-32 lg:border-b-0 lg:border-r lg:px-3 lg:py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#145f38] text-xs font-bold text-white">B</div>
                    <span className="text-sm font-extrabold text-[#135a35]">BizManager</span>
                  </div>
                  <nav className="mt-2 flex flex-1 flex-wrap gap-1 lg:mt-3 lg:flex-col lg:gap-1">
                    {dashboardMenu.map((item) => (
                      <div
                        key={item}
                        className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition ${
                          item === "Tableau de bord"
                            ? "bg-[#145f38] text-white shadow-sm"
                            : "text-slate-600 hover:bg-white"
                        }`}
                      >
                        <span className={`h-2.5 w-2.5 rounded-full ${item === "Tableau de bord" ? "bg-white" : "bg-emerald-200"}`} />
                        <span className="whitespace-nowrap">{item}</span>
                      </div>
                    ))}
                  </nav>
                </aside>

                <div className="flex-1 px-3 py-2 sm:px-3 sm:py-3 lg:px-4 lg:py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-sm font-bold tracking-tight text-slate-950 sm:text-base">Tableau de bord</h2>
                      <p className="mt-0.5 text-xs text-slate-500">Vue d'ensemble des ventes et commandes</p>
                    </div>
                    <div className="hidden items-center gap-2 sm:flex">
                      <span className="h-3.5 w-3.5 rounded-full bg-slate-200" />
                      <span className="h-3.5 w-3.5 rounded-full bg-emerald-200" />
                      <span className="h-3.5 w-3.5 rounded-full bg-slate-200" />
                    </div>
                  </div>

                  <div className="mt-2 grid gap-2 lg:grid-cols-[1.35fr_0.65fr]">
                    <div className="rounded-lg border border-slate-100 bg-white p-2 shadow-sm">
                      <div className="h-40 rounded-lg bg-[#fafcf9] p-2">
                        <div className="flex h-full items-end gap-1 rounded-lg border border-slate-100 bg-white px-2 pb-2 pt-3">
                          {chartBars.map((height, index) => (
                            <div key={index} className="flex flex-1 items-end justify-center">
                              <div
                                className={`w-full max-w-4.5 rounded-t-lg ${index % 3 === 0 ? "bg-[#145f38]" : "bg-emerald-200"}`}
                                style={{ height: `${height}%` }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {[
                        { label: "Chiffre d'affaires", value: "28 650 €", delta: "+18,6%" },
                        { label: "Commandes", value: "156", delta: "+12,4%" },
                      ].map((card) => (
                        <article key={card.label} className="rounded-lg border border-slate-100 bg-white p-2 shadow-sm">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-xs text-slate-500">{card.label}</p>
                              <p className="mt-1 text-base font-bold tracking-tight text-slate-950">{card.value}</p>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-[#145f38]">
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M12 5v14" />
                                <path d="M5 12l7-7 7 7" />
                              </svg>
                            </div>
                          </div>
                          <p className="mt-1 text-xs text-emerald-700">{card.delta} vs période précédente</p>
                        </article>
                      ))}
                    </div>
                  </div>

                  <article className="mt-2 rounded-lg border border-slate-100 bg-white p-2 shadow-sm">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <h3 className="text-xs font-semibold text-slate-900">Commandes récentes</h3>
                      <button type="button" className="rounded-full border border-emerald-200 px-2 py-0.5 text-xs font-semibold text-[#145f38]">Voir</button>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-slate-100">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-xs uppercase tracking-[0.1em] text-slate-500">
                          <tr>
                            <th className="px-2 py-1">Cmd</th>
                            <th className="px-2 py-1">Client</th>
                            <th className="px-2 py-1">Statut</th>
                            <th className="px-2 py-1">Montant</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentOrders.map((row) => (
                            <tr key={row.order} className="border-t border-slate-100">
                              <td className="px-2 py-1 font-medium text-slate-700 text-xs">{row.order}</td>
                              <td className="px-2 py-1 text-slate-600 text-xs truncate">{row.client}</td>
                              <td className="px-2 py-1">
                                <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-[#145f38]">{row.status}</span>
                              </td>
                              <td className="px-2 py-1 text-slate-600 text-xs">{row.amount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </article>
                </div>
              </div>
            </article>
          </div>
        </div>

        <div className="relative flex items-center justify-center px-3 py-4 sm:px-4 lg:px-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#ffffff_0%,#f6f8f4_55%,#eef4ee_100%)]" />
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-6 top-10 h-24 w-24 rounded-full bg-emerald-100/40 blur-3xl" />
            <div className="absolute bottom-10 right-6 h-28 w-28 rounded-full bg-white/80 blur-3xl" />
          </div>

          <div className="relative w-full max-w-md lg:max-w-3xl rounded-2xl border border-white/80 bg-white px-4 py-5 shadow-[0_16px_50px_rgba(15,23,42,0.08)] sm:px-5 sm:py-6 lg:px-6 lg:py-6">
            <div className="mb-4 text-center">
              <h2 className="text-xl font-black tracking-tight text-slate-950">Connexion</h2>
              <p className="mx-auto mt-2 max-w-80 text-xs leading-5 text-slate-500 sm:text-sm">
                Accédez à votre espace pour gérer votre boutique,
                vos produits, vos commandes et vos clients.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${mode === "login" ? "bg-white text-emerald-700 shadow-sm hover:bg-slate-50" : "text-slate-500 hover:bg-white/70 hover:text-slate-800"}`}
                  onClick={() => switchMode("login")}
                >
                  Connexion
                </button>
                <button
                  type="button"
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${mode === "register" ? "bg-white text-emerald-700 shadow-sm hover:bg-slate-50" : "text-slate-500 hover:bg-green-100 hover:text-slate-800"}`}
                  onClick={() => switchMode("register")}
                >
                  S'inscrire
                </button>
              </div>

              {mode === "register" && registerStep === "details" ? (
                <div className="space-y-2">
                  {selectedPlan ? (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                      <Check size={15} strokeWidth={2.5} className="shrink-0 text-emerald-600" />
                      <span className="text-xs text-emerald-800 font-medium">
                        Plan sélectionné :{" "}
                        <span className="font-bold capitalize">{selectedPlan}</span>
                        {selectedPlan === "business" && " · 4 500 FCFA/mois"}
                        {selectedPlan === "premium" && " · 10 000 FCFA/mois"}
                        {selectedPlan === "starter" && " · Gratuit"}
                      </span>
                    </div>
                  ) : null}
                  <p className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                    Remplissez le formulaire puis demandez le code de vérification.
                  </p>
                </div>
              ) : null}

              <form noValidate onSubmit={onSubmit} className="space-y-3">
                {mode === "register" ? (
                  <label className="block space-y-1 text-xs font-medium text-slate-700">
                    <span>Nom complet</span>
                    <input
                      required
                      minLength={2}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      placeholder="Nom et prenom"
                    />
                  </label>
                ) : null}

                <label className="block space-y-1 text-xs font-medium text-slate-700">
                  <span>Email</span>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M4 6h16v12H4z" />
                        <path d="m4 7 8 6 8-6" />
                      </svg>
                    </span>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ paddingLeft: "3.75rem" }}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-12 pr-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      placeholder="nom@example.com"
                    />
                  </div>
                </label>

                <label className="block space-y-1 text-xs font-medium text-slate-700">
                  <span>Mot de passe</span>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="5" y="10" width="14" height="10" rx="2" />
                        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                      </svg>
                    </span>
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ paddingLeft: "3.75rem" }}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-12 pr-10 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      placeholder="••••••••••••"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 !m-0 !min-h-0 !min-w-0 !rounded-none !border-0 !bg-transparent !p-0 !shadow-none !outline-none text-slate-500 transition hover:text-slate-800"
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                  </div>
                </label>

                {mode === "register" && registerStep === "verify" ? (
                  <label className="block space-y-1 text-xs font-medium text-slate-700">
                    <span>Code de vérification</span>
                    <input
                      required
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="Entrez le code à 6 chiffres"
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </label>
                ) : null}

                {mode === "login" ? (
                  <div className="flex items-center justify-between gap-3 pt-0 text-xs">
                    <label className="flex items-center gap-1.5 text-slate-600">
                      <input
                        type="checkbox"
                        name="rememberMe"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-3 w-3 rounded border-emerald-500 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Se souvenir</span>
                    </label>

                    <button
                      type="button"
                      className="rounded-md px-1.5 py-0.5 font-medium text-emerald-700 transition hover:bg-emerald-50 hover:text-emerald-800"
                      onClick={() => {
                        setForgotOpen((prev) => !prev);
                        setForgotError(null);
                        setForgotInfo(null);
                        setForgotEmail(email);
                      }}
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                ) : null}

                {info ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{info}</p> : null}
                {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p> : null}

                <button
                  disabled={isLoading}
                  type="submit"
                  className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#145f38] px-4 text-xs font-semibold text-white shadow-[0_12px_25px_rgba(20,95,56,0.18)] transition hover:bg-[#0f522f] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading
                    ? "Chargement..."
                    : mode === "login"
                      ? "Connexion"
                      : registerStep === "details"
                        ? "Code"
                        : "Creer"}
                </button>

                {mode === "register" && registerStep === "verify" ? (
                  <button
                    type="button"
                    className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                    onClick={() => {
                      setRegisterStep("details");
                      setVerificationCode("");
                      setInfo(null);
                    }}
                  >
                    Modifier email ou mot de passe
                  </button>
                ) : null}

                <div className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="inline-flex items-center rounded-full bg-white px-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">ou</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleButton}
                  className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 transition hover:bg-slate-50"
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white">
                    <svg className="h-4 w-4" viewBox="0 0 48 48">
                      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.5-.2-3-.4-3.5z" />
                      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 15.5 4 8.1 8.7 4.1 15.6l2.2-.9z" />
                      <path fill="#4CAF50" d="M24 44c5.1 0 9.8-2 13.3-5.2l-6.1-5.1C29.3 35.8 26.8 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.9 39.3 16.4 44 24 44z" />
                      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 2.8-3 5-5.7 6.7l.1-.1 6.1 5.1C34.7 38.2 44 32 44 24c0-1.5-.2-3-.4-3.5z" />
                    </svg>
                  </span>
                  <span>Google</span>
                </button>

                <div className="rounded-lg border border-emerald-100 bg-emerald-50/80 px-3 py-2">
                  <div className="flex items-start gap-2">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white text-[#145f38] shadow-sm">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3Z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-slate-900">Sécurisé</h3>
                      <p className="mt-0.5 text-xs leading-4 text-slate-600">
                        Vos données sont protégées avec un chiffrement de niveau bancaire.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="pt-1 text-center text-xs text-slate-600">
                  Pas de compte ?{' '}
                  <button type="button" onClick={() => switchMode("register")} className="font-semibold text-emerald-700 transition hover:text-emerald-800">
                    S'inscrire
                  </button>
                </p>
              </form>

              {mode === "login" && forgotOpen ? (
                <form noValidate className="space-y-3 rounded-lg border border-slate-200 bg-[#fafcf9] p-3 shadow-sm" onSubmit={onForgotSubmit}>
                  <div>
                    <h3 className="text-base font-semibold text-slate-950">Réinitialiser</h3>
                    <p className="mt-0.5 text-xs leading-4 text-slate-500">
                      {forgotStep === "details"
                        ? "Entrez votre email pour recevoir un code."
                        : "Entrez le code recu et votre nouveau mot de passe."}
                    </p>
                  </div>

                  <label className="block space-y-1 text-xs font-medium text-slate-700">
                    <span>Email</span>
                    <input
                      required
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      placeholder="vous@exemple.com"
                    />
                  </label>

                  {forgotStep === "verify" ? (
                    <>
                      <label className="block space-y-1 text-xs font-medium text-slate-700">
                        <span>Code</span>
                        <input
                          required
                          inputMode="numeric"
                          pattern="[0-9]{6}"
                          minLength={6}
                          maxLength={6}
                          value={forgotCode}
                          onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, ""))}
                          placeholder="6 chiffres"
                          title="Entrez exactement 6 chiffres"
                          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        />
                      </label>

                      <label className="block space-y-1 text-xs font-medium text-slate-700">
                        <span>Nouveau mot de passe</span>
                        <div className="relative">
                          <input
                            required
                            type={showForgotPassword ? "text" : "password"}
                            minLength={8}
                            value={forgotPassword}
                            onChange={(e) => setForgotPassword(e.target.value)}
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 pr-10 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            placeholder="Nouveau mot de passe"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-slate-500 transition hover:text-slate-800"
                            aria-label={showForgotPassword ? "Masquer" : "Afficher"}
                            onClick={() => setShowForgotPassword((prev) => !prev)}
                          >
                            <span className="text-xs font-semibold">{showForgotPassword ? "Hide" : "Show"}</span>
                          </button>
                        </div>
                      </label>
                    </>
                  ) : null}

                  {forgotInfo ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{forgotInfo}</p> : null}
                  {forgotError ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{forgotError}</p> : null}

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      disabled={forgotLoading}
                      type="submit"
                      className="inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-[#145f38] px-3 text-xs font-semibold text-white transition hover:bg-[#0f522f] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {forgotLoading
                        ? "..."
                        : forgotStep === "details"
                          ? "Code"
                          : "Changer"}
                    </button>

                    {forgotStep === "verify" ? (
                      <button
                        type="button"
                        className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                        onClick={() => {
                          setForgotStep("details");
                          setForgotCode("");
                          setForgotPassword("");
                          setForgotInfo(null);
                          setForgotError(null);
                        }}
                      >
                        Renvoi
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

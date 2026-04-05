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
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const payload =
      mode === "login"
        ? { email, password }
        : { fullName, email, password };

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
        setError(data?.error ?? "Echec de l'authentification");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="auth-wrap">
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
              onClick={() => setMode("login")}
            >
              Se connecter
            </button>
            <button
              type="button"
              className={mode === "register" ? "active" : ""}
              onClick={() => setMode("register")}
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
            <input
              required
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error ? <p className="feedback error">{error}</p> : null}

          <button disabled={isLoading} type="submit">
            {isLoading
              ? "Chargement..."
              : mode === "login"
                ? "Se connecter"
                : "Creer le compte"}
          </button>
          </form>
        </div>
      </section>
    </main>
  );
}

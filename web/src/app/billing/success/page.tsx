"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type TxStatus = "pending" | "paid" | "failed" | "cancelled" | "expired";

type StatusData = {
  status: TxStatus;
  plan?: { name: string; displayName: string };
  amount?: number;
  currency?: string;
  billingCycle?: string;
};

const MAX_POLLS = 20;
const POLL_INTERVAL = 3000;

const CSS = `
.bs-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f5f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; }
.bs-card { background: #fff; border-radius: 16px; padding: 40px 32px; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,.08); }
.bs-icon { font-size: 56px; margin-bottom: 16px; line-height: 1; }
.bs-title { font-size: 22px; font-weight: 700; color: #111; margin: 0 0 8px; }
.bs-sub { font-size: 15px; color: #555; margin: 0 0 24px; }
.bs-plan { background: #f0faf5; border: 1px solid #b3e6cb; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px; font-size: 14px; color: #1a7a48; font-weight: 600; }
.bs-spinner { width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top-color: #0A8F45; border-radius: 50%; animation: spin .8s linear infinite; margin: 0 auto 20px; }
@keyframes spin { to { transform: rotate(360deg); } }
.bs-btn { display: inline-block; padding: 12px 28px; border-radius: 10px; font-size: 15px; font-weight: 600; text-decoration: none; border: none; cursor: pointer; }
.bs-btn-primary { background: #0A8F45; color: #fff; }
.bs-btn-secondary { background: #f3f4f6; color: #374151; margin-top: 10px; }
.bs-err { color: #dc2626; font-size: 14px; margin-bottom: 16px; }
`;

function BillingSuccessContent() {
  const params = useSearchParams();
  const router = useRouter();
  const txId = params.get("txId");

  const [data, setData] = useState<StatusData | null>(null);
  const [polls, setPolls] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const poll = useCallback(async () => {
    if (!txId) return;
    try {
      const res = await fetch(`/api/billing/status?txId=${txId}`);
      if (!res.ok) { setError("Impossible de vérifier le statut du paiement."); return; }
      const json = await res.json() as StatusData;
      setData(json);
      return json.status;
    } catch {
      setError("Erreur réseau lors de la vérification.");
    }
  }, [txId]);

  useEffect(() => {
    if (!txId) { setError("Paramètre manquant."); return; }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function check() {
      const status = await poll();
      if (cancelled) return;
      setPolls(p => p + 1);
      if (status === "pending" && polls < MAX_POLLS) {
        timer = setTimeout(check, POLL_INTERVAL);
      }
    }

    check();
    return () => { cancelled = true; clearTimeout(timer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txId]);

  if (!txId || error) {
    return (
      <div className="bs-wrap">
        <style>{CSS}</style>
        <div className="bs-card">
          <div className="bs-icon">⚠️</div>
          <h1 className="bs-title">Erreur</h1>
          <p className="bs-sub bs-err">{error ?? "Lien invalide."}</p>
          <button className="bs-btn bs-btn-primary" onClick={() => router.push("/dashboard")}>
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  if (!data || data.status === "pending") {
    const timedOut = polls >= MAX_POLLS;
    return (
      <div className="bs-wrap">
        <style>{CSS}</style>
        <div className="bs-card">
          {timedOut ? (
            <>
              <div className="bs-icon">⏳</div>
              <h1 className="bs-title">Vérification en cours</h1>
              <p className="bs-sub">Votre paiement est en cours de traitement. Votre abonnement sera activé dans quelques minutes.</p>
              <button className="bs-btn bs-btn-primary" onClick={() => router.push("/dashboard")}>
                Retour au tableau de bord
              </button>
            </>
          ) : (
            <>
              <div className="bs-spinner" />
              <h1 className="bs-title">Vérification du paiement…</h1>
              <p className="bs-sub">Veuillez patienter, nous confirmons votre paiement.</p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (data.status === "paid") {
    return (
      <div className="bs-wrap">
        <style>{CSS}</style>
        <div className="bs-card">
          <div className="bs-icon">✅</div>
          <h1 className="bs-title">Paiement confirmé !</h1>
          <p className="bs-sub">Votre abonnement est maintenant actif.</p>
          {data.plan && (
            <div className="bs-plan">
              Plan {data.plan.displayName} activé
              {data.billingCycle === "yearly" ? " — facturation annuelle" : " — facturation mensuelle"}
            </div>
          )}
          <button className="bs-btn bs-btn-primary" onClick={() => router.push("/shops")}>
            Créer ma première boutique →
          </button>
          <br />
          <button className="bs-btn bs-btn-secondary" onClick={() => router.push("/dashboard")}>
            Accéder au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  // failed / cancelled / expired
  return (
    <div className="bs-wrap">
      <style>{CSS}</style>
      <div className="bs-card">
        <div className="bs-icon">❌</div>
        <h1 className="bs-title">
          {data.status === "cancelled" ? "Paiement annulé" : "Paiement échoué"}
        </h1>
        <p className="bs-sub">
          {data.status === "cancelled"
            ? "Vous avez annulé le paiement. Aucun montant n'a été débité."
            : "Votre paiement n'a pas pu être traité. Veuillez réessayer."}
        </p>
        <button className="bs-btn bs-btn-primary" onClick={() => router.push("/settings")}>
          Réessayer
        </button>
        <br />
        <button className="bs-btn bs-btn-secondary" onClick={() => router.push("/dashboard")}>
          Retour au tableau de bord
        </button>
      </div>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="bs-wrap">
        <style>{CSS}</style>
        <div className="bs-card">
          <div className="bs-spinner" />
          <h1 className="bs-title">Chargement…</h1>
        </div>
      </div>
    }>
      <BillingSuccessContent />
    </Suspense>
  );
}

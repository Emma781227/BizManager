"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, X } from "lucide-react";
import { formatPriceCFA } from "@/lib/format";

type Status = "pending" | "paid" | "failed" | "cancelled" | "expired";

type TxData = {
  txId:     string;
  status:   Status;
  amount:   number;
  currency: string;
  orderId:  string;
  shopSlug: string;
  shopName: string;
};

const MAX_POLLS = 20;
const POLL_MS   = 3_000;

export default function OrderPaymentStatusPage() {
  const routeParams = useParams<{ slug: string }>();
  const slug        = routeParams?.slug ?? "";
  const searchParams = useSearchParams();
  const txId         = searchParams.get("txId") ?? "";
  const resultHint   = searchParams.get("result"); // "success" | "error" from GeniusPay redirect

  const [tx, setTx]       = useState<TxData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollCount = useRef(0);

  useEffect(() => {
    if (!txId) {
      setError("Identifiant de transaction manquant.");
      return;
    }

    async function poll() {
      try {
        const res = await fetch(`/api/public/orders/payment-status?txId=${encodeURIComponent(txId)}`, { cache: "no-store" });
        const json = await res.json() as { data?: TxData; error?: string };
        if (!res.ok || !json.data) {
          setError(json.error ?? "Transaction introuvable.");
          return;
        }
        setTx(json.data);
        if (json.data.status === "pending" && pollCount.current < MAX_POLLS) {
          pollCount.current += 1;
          setTimeout(() => void poll(), POLL_MS);
        }
      } catch {
        setError("Impossible de vérifier le statut du paiement.");
      }
    }

    void poll();
  }, [txId]);

  const status = tx?.status ?? (resultHint === "error" ? "failed" : "pending");

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7faf7_0%,#edf5ef_100%)] px-4 py-10 text-slate-900 sm:px-6">
      <section className="mx-auto w-full max-w-md rounded-3xl border border-emerald-100 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
        <header className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
          <Link href={`/shop/${slug}`} aria-label="Retour à la boutique" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50">
            <ArrowLeft size={18} strokeWidth={2} />
          </Link>
          <strong className="text-lg font-semibold text-slate-950">Statut du paiement</strong>
          <span className="h-10 w-10" />
        </header>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-center text-sm text-rose-700">
            {error}
          </div>
        ) : status === "pending" ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />
            <p className="text-sm text-slate-500">Vérification du paiement en cours…</p>
          </div>
        ) : status === "paid" ? (
          <div className="space-y-5 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Check size={30} strokeWidth={2.5} /></div>
            <div>
              <p className="text-xl font-semibold text-emerald-700">Paiement confirmé !</p>
              {tx && (
                <p className="mt-1 text-sm text-slate-500">
                  {formatPriceCFA(tx.amount)} · commande #{tx.orderId.slice(-8).toUpperCase()}
                </p>
              )}
            </div>
            <p className="text-sm text-slate-600">
              Votre commande a été enregistrée et votre paiement reçu. Le marchand vous contactera pour la livraison.
            </p>
            <Link
              href={`/shop/${slug}`}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Retour à la boutique
            </Link>
          </div>
        ) : (
          <div className="space-y-5 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-700"><X size={30} strokeWidth={2.5} /></div>
            <div>
              <p className="text-xl font-semibold text-rose-700">
                {status === "cancelled" ? "Paiement annulé" : "Paiement échoué"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {status === "cancelled"
                  ? "Vous avez annulé le paiement."
                  : "Le paiement n'a pas pu être traité."}
              </p>
            </div>
            <p className="text-sm text-slate-600">
              Votre commande a été enregistrée mais reste impayée. Vous pouvez réessayer ou contacter le marchand.
            </p>
            <Link
              href={`/shop/${slug}/checkout?retry=1`}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Réessayer
            </Link>
            <Link
              href={`/shop/${slug}`}
              className="mt-2 inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Retour à la boutique
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

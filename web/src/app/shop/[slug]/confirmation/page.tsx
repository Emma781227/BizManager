"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

export default function ConfirmationPage() {
  const routeParams = useParams<{ slug: string }>();
  const slug = routeParams?.slug;
  const searchParams = useSearchParams();
  const wa = searchParams.get("wa") ?? "";
  const sent = searchParams.get("sent") === "1";
  const orderId = searchParams.get("orderId") ?? "";

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7faf7_0%,#eef5f0_100%)] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-3xl rounded-3xl border border-emerald-100 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-2xl font-semibold text-white">
          ✓
        </div>

        <h1 className="mt-5 text-center text-3xl font-semibold tracking-tight text-slate-950">Merci !</h1>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-6 text-slate-600 sm:text-base">
          Votre demande est prete.
          {sent ? " Le message WhatsApp a ete ouvert automatiquement." : " Ouvre WhatsApp pour finaliser l'envoi."}
        </p>

        {orderId ? (
          <p className="mx-auto mt-4 w-fit rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
            Reference commande: <strong>{orderId}</strong>
          </p>
        ) : null}

        <div className="mx-auto mt-8 flex w-full max-w-lg flex-col gap-3 sm:flex-row">
          {wa ? (
            <a
              className="inline-flex flex-1 items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              href={wa}
              target="_blank"
              rel="noreferrer"
            >
              Ouvrir WhatsApp
            </a>
          ) : (
            <p className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Lien WhatsApp manquant. Reviens a l&apos;etape precedente.
            </p>
          )}

          {slug ? (
            <Link
              href={`/shop/${slug}`}
              className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Retour a l&apos;accueil
            </Link>
          ) : null}
        </div>

        <nav className="mt-8 grid grid-cols-5 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 text-center text-sm text-slate-500" aria-label="Navigation client">
          {slug ? (
            <Link href={`/shop/${slug}`} className="rounded-xl px-2 py-2 transition hover:bg-white">
              Accueil
            </Link>
          ) : (
            <span className="rounded-xl px-2 py-2">Accueil</span>
          )}
          <span className="rounded-xl px-2 py-2">Explorer</span>
          <span className="rounded-xl px-2 py-2">Produits</span>
          <span className="rounded-xl px-2 py-2">Panier</span>
          <span className="rounded-xl bg-emerald-100 px-2 py-2 font-semibold text-emerald-700">Confirme</span>
        </nav>
      </section>
    </main>
  );
}

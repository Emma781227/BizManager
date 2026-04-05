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
    <main className="storefront-wrap">
      <section className="storefront-phone">
        <section className="storefront-confirmation-card">
          <div className="storefront-success-icon">✓</div>
          <h1>Merci !</h1>
          <p>
            Votre demande est prete.
            {sent ? " Le message WhatsApp a ete ouvert automatiquement." : " Ouvre WhatsApp pour finaliser l'envoi."}
          </p>

          {orderId ? (
            <p className="storefront-order-ref">
              Reference commande: <strong>{orderId}</strong>
            </p>
          ) : null}

          {wa ? (
            <a className="storefront-cta" href={wa} target="_blank" rel="noreferrer">
              Ouvrir WhatsApp
            </a>
          ) : (
            <p className="feedback error">Lien WhatsApp manquant. Reviens a l&apos;etape precedente.</p>
          )}

          {slug ? (
            <Link href={`/shop/${slug}`} className="button-link storefront-return-link">
              Retour a l&apos;accueil
            </Link>
          ) : null}
        </section>

        <nav className="storefront-bottom-nav" aria-label="Navigation client">
          {slug ? <Link href={`/shop/${slug}`}>🏠</Link> : <span>🏠</span>}
          <span>🧭</span>
          <span>🛍️</span>
          <span>🛒</span>
          <span className="active">✅</span>
        </nav>
      </section>
    </main>
  );
}

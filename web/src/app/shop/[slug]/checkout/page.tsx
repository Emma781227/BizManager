"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

type ProductPayload = {
  id: string;
  name: string;
  unitPrice: string;
  stock: number;
  imageUrl: string | null;
  shopName: string;
};

export default function PublicCheckoutPage() {
  const routeParams = useParams<{ slug: string }>();
  const slug = routeParams?.slug;
  const searchParams = useSearchParams();
  const productId = useMemo(() => searchParams.get("productId") ?? "", [searchParams]);
  const initialQuantity = useMemo(() => {
    const raw = Number(searchParams.get("quantity") ?? "1");
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1;
  }, [searchParams]);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [quantity, setQuantity] = useState(initialQuantity);
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [product, setProduct] = useState<ProductPayload | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQuantity(initialQuantity);
  }, [initialQuantity]);

  useEffect(() => {
    if (!slug) {
      setProduct(null);
      setLoadingProduct(false);
      return;
    }

    if (!productId) {
      setProduct(null);
      setLoadingProduct(false);
      return;
    }

    void (async () => {
      setLoadingProduct(true);
      try {
        const response = await fetch(`/api/public/shop/${slug}/products/${productId}`, {
          cache: "no-store",
        });
        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.error ?? "Produit introuvable");
        }

        setProduct(json.data ?? null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Erreur inconnue");
        setProduct(null);
      } finally {
        setLoadingProduct(false);
      }
    })();
  }, [slug, productId]);

  const totalEstimate = useMemo(() => {
    if (!product) {
      return 0;
    }

    return Number(product.unitPrice) * quantity;
  }, [product, quantity]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    // Open a placeholder tab from user interaction to reduce popup blocking.
    const popup = window.open("", "_blank", "noopener,noreferrer");

    try {
      const response = await fetch(`/api/public/shop/${slug}/whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          quantity,
          customerName,
          customerPhone,
          address,
          note,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        if (popup) {
          popup.close();
        }
        throw new Error(json.error ?? "Impossible de preparer la commande");
      }

      const whatsappUrl = String(json.data.whatsappUrl ?? "");
      const orderId = String(json.data.orderId ?? "");
      let sent = "0";

      if (popup && whatsappUrl) {
        popup.location.href = whatsappUrl;
        sent = "1";
      }

      const redirectUrl = `/shop/${slug}/confirmation?wa=${encodeURIComponent(whatsappUrl)}&sent=${sent}&orderId=${encodeURIComponent(orderId)}`;
      window.location.href = redirectUrl;
    } catch (submitError) {
      if (popup) {
        popup.close();
      }
      setError(submitError instanceof Error ? submitError.message : "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="storefront-wrap">
      <section className="storefront-phone">
        <header className="storefront-topbar">
          {slug ? <Link href={`/shop/${slug}`} className="storefront-back">←</Link> : <span className="storefront-back">←</span>}
          <strong>Commande</strong>
          <span className="storefront-icon">🧾</span>
        </header>

        <section className="storefront-checkout-card">
          {loadingProduct ? <p className="muted">Verification du produit...</p> : null}
          {!loadingProduct && product ? (
            <div className="storefront-checkout-summary">
              <h1>{product.name}</h1>
              <p className="price">{Number(product.unitPrice).toFixed(0)} CFA</p>
              <p className="muted">Total estime: {totalEstimate.toFixed(0)} CFA</p>
            </div>
          ) : null}

          <form className="storefront-form" onSubmit={handleSubmit}>
            <label>
              Nom complet
              <input
                required
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
              />
            </label>

            <label>
              Telephone
              <input
                required
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                placeholder="+237..."
              />
            </label>

            <label>
              Quantite
              <input
                type="number"
                min={1}
                max={Math.max(1, product?.stock ?? 1)}
                value={quantity}
                onChange={(event) => {
                  const next = Number(event.target.value) || 1;
                  const max = Math.max(1, product?.stock ?? 1);
                  setQuantity(Math.min(Math.max(next, 1), max));
                }}
              />
            </label>

            <label>
              Adresse
              <input value={address} onChange={(event) => setAddress(event.target.value)} />
            </label>

            <label>
              Remarque
              <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} />
            </label>

            <button type="submit" disabled={submitting || !slug || !productId || !product || product.stock <= 0}>
              {submitting ? "Preparation..." : "Valider la commande"}
            </button>
          </form>

          <div className="storefront-service-list compact">
            <span>⏱️ Livraison rapide possible</span>
            <span>💳 Paiement a la livraison ou Mobile Money</span>
          </div>

          {!slug ? <p className="feedback error">Boutique manquante dans le lien.</p> : null}
          {!productId ? <p className="feedback error">Produit manquant dans le lien.</p> : null}
          {!loadingProduct && !product && productId ? <p className="feedback error">Produit introuvable.</p> : null}
          {product && product.stock <= 0 ? <p className="feedback error">Produit indisponible pour le moment.</p> : null}
          {error ? <p className="feedback error">{error}</p> : null}
        </section>

        <nav className="storefront-bottom-nav" aria-label="Navigation client">
          {slug ? <Link href={`/shop/${slug}`}>🏠</Link> : <span>🏠</span>}
          <span>🧭</span>
          <span>🛍️</span>
          <span className="active">🛒</span>
          <span>👤</span>
        </nav>
      </section>
    </main>
  );
}

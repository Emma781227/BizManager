"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type ProductPayload = {
  id: string;
  name: string;
  description?: string | null;
  unitPrice: string;
  stock: number;
  imageUrl: string | null;
  shopName: string;
};

export default function PublicProductPage() {
  const routeParams = useParams<{ slug: string; productId: string }>();
  const slug = routeParams?.slug;
  const productId = routeParams?.productId;
  const [product, setProduct] = useState<ProductPayload | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || !productId) {
      return;
    }

    void (async () => {
      setLoading(true);
      setError(null);

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
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, productId]);

  if (!slug || !productId) {
    return (
      <main className="home">
        <p className="feedback error">Produit introuvable.</p>
      </main>
    );
  }

  if (loading) {
    return <main className="home"><p>Chargement...</p></main>;
  }

  if (error || !product) {
    return (
      <main className="home">
        <p className="feedback error">{error ?? "Produit introuvable"}</p>
      </main>
    );
  }

  return (
    <main className="storefront-wrap">
      <section className="storefront-phone">
        <header className="storefront-topbar">
          <Link href={`/shop/${slug}`} className="storefront-back">←</Link>
          <strong>{product.name}</strong>
          <span className="storefront-icon">🛒</span>
        </header>

        <section className="storefront-product-detail">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="storefront-detail-image" />
          ) : (
            <div className="storefront-detail-image placeholder">Image indisponible</div>
          )}

          <div className="storefront-detail-content">
            <h1>{product.name}</h1>
            <div className="storefront-price-row">
              <strong>{Number(product.unitPrice).toFixed(0)} CFA</strong>
              <span className={product.stock > 0 ? "stock ok" : "stock out"}>{product.stock > 0 ? "En stock" : "Rupture"}</span>
            </div>

            <p>
              {product.description?.trim() || "Produit de qualite, selectionne avec soin pour repondre a vos besoins au quotidien."}
            </p>

            {product.stock > 0 ? (
              <div className="quantity-picker" role="group" aria-label="Selection de la quantite">
                <button
                  type="button"
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, product.stock)}
                  value={quantity}
                  onChange={(event) => {
                    const next = Number(event.target.value) || 1;
                    setQuantity(Math.min(Math.max(next, 1), Math.max(1, product.stock)));
                  }}
                />
                <button
                  type="button"
                  onClick={() => setQuantity((current) => Math.min(product.stock, current + 1))}
                  disabled={quantity >= product.stock}
                >
                  +
                </button>
              </div>
            ) : null}

            <div className="storefront-service-list">
              <span>⏱️ Livraison rapide possible</span>
              <span>💳 Paiement a la livraison ou Mobile Money</span>
            </div>

            <Link
              href={`/shop/${slug}/checkout?productId=${product.id}&quantity=${quantity}`}
              className={`storefront-cta ${product.stock <= 0 ? "disabled" : ""}`}
              aria-disabled={product.stock <= 0}
              tabIndex={product.stock <= 0 ? -1 : 0}
            >
              Commander maintenant
            </Link>
          </div>
        </section>

        <nav className="storefront-bottom-nav" aria-label="Navigation client">
          <Link href={`/shop/${slug}`} className="active">🏠</Link>
          <span>🧭</span>
          <span>🛍️</span>
          <span>🛒</span>
          <span>👤</span>
        </nav>
      </section>
    </main>
  );
}

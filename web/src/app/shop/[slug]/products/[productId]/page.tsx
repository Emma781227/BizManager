"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type ProductPayload = {
  id: string;
  name: string;
  description?: string | null;
  sku?: string | null;
  category?: string | null;
  categories?: string[];
  unitPrice: string;
  stock: number;
  imageUrl: string | null;
  shopName: string;
  whatsappNumber?: string;
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
    return (
      <main className="home">
        <p>Chargement...</p>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="home">
        <p className="feedback error">{error ?? "Produit introuvable"}</p>
      </main>
    );
  }

  const productCategories =
    Array.isArray(product.categories) && product.categories.length > 0
      ? product.categories
      : product.category
        ? [product.category]
        : [];

  const description =
    product.description?.trim() ||
    "Produit de qualite selectionne avec soin pour repondre a vos besoins au quotidien.";

  return (
    <main className="storefront-wrap">
      <section className="storefront-phone">
        <header className="storefront-topbar">
          <Link href={`/shop/${slug}`} className="storefront-back">
            ←
          </Link>
          <strong>Detail produit</strong>
          <span className="storefront-icon">🛒</span>
        </header>

        <section className="market-detail-shell">
          <article className="market-media-card">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="storefront-detail-image" />
            ) : (
              <div className="storefront-detail-image placeholder">Image indisponible</div>
            )}
          </article>

          <article className="market-main-info">
            <p className="market-breadcrumb">
              <Link href={`/shop/${slug}`}>Accueil</Link>
              <span>/</span>
              <span>{product.shopName}</span>
              {productCategories.length > 0 ? (
                <>
                  <span>/</span>
                  <span>{productCategories[0]}</span>
                </>
              ) : null}
            </p>

            <h1>{product.name}</h1>

            <div className="market-meta-row">
              <span>Vendu par {product.shopName}</span>
              {product.sku ? <span>SKU: {product.sku}</span> : null}
            </div>

            <div className="storefront-price-row market-price-row">
              <strong>{Number(product.unitPrice).toFixed(0)} CFA</strong>
              <span className={product.stock > 0 ? "stock ok" : "stock out"}>
                {product.stock > 0 ? "En stock" : "Rupture"}
              </span>
            </div>

            {productCategories.length > 0 ? (
              <div className="market-tags">
                {productCategories.map((cat) => (
                  <span key={cat}>{cat}</span>
                ))}
              </div>
            ) : null}

            <p className="market-description">{description}</p>

            <ul className="market-benefits">
              <li>Livraison rapide possible</li>
              <li>Paiement a la livraison ou Mobile Money</li>
              <li>Commande confirmee directement par WhatsApp</li>
            </ul>
          </article>

          <aside className="market-buybox">
            <h2>Commander ce produit</h2>
            <p className="market-buy-price">{Number(product.unitPrice).toFixed(0)} CFA</p>
            <p className="market-buy-stock">Stock disponible: {product.stock}</p>

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

            <Link
              href={`/shop/${slug}/checkout?productId=${product.id}&quantity=${quantity}`}
              className={`storefront-cta ${product.stock <= 0 ? "disabled" : ""}`}
              aria-disabled={product.stock <= 0}
              tabIndex={product.stock <= 0 ? -1 : 0}
            >
              Acheter maintenant
            </Link>

            {product.whatsappNumber ? (
              <a
                href={`https://wa.me/${product.whatsappNumber.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="market-secondary-cta"
              >
                Contacter la boutique
              </a>
            ) : null}

            <div className="storefront-service-list compact">
              <span>Paiement securise</span>
              <span>Support marchand disponible</span>
            </div>
          </aside>
        </section>

        <section className="market-trust-strip" aria-label="Avantages client">
          <article>
            <h3>Livraison</h3>
            <p>Suivi rapide de votre commande avec confirmation par WhatsApp.</p>
          </article>
          <article>
            <h3>Paiement flexible</h3>
            <p>Mobile Money, paiement a la livraison ou cash selon la boutique.</p>
          </article>
          <article>
            <h3>Service client</h3>
            <p>Le commerçant vous recontacte pour finaliser la commande.</p>
          </article>
        </section>

        <nav className="storefront-bottom-nav" aria-label="Navigation client">
          <Link href={`/shop/${slug}`} className="active">
            🏠
          </Link>
          <span>🧭</span>
          <span>🛍️</span>
          <span>🛒</span>
          <span>👤</span>
        </nav>
      </section>
    </main>
  );
}

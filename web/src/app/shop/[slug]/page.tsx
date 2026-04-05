"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Shop = {
  slug: string;
  name: string;
  logoUrl: string | null;
  coverUrl: string | null;
  description: string | null;
  city: string | null;
  category: string | null;
  whatsappNumber: string;
  productsCount: number;
};

type Product = {
  id: string;
  name: string;
  description?: string | null;
  unitPrice: string;
  stock: number;
  imageUrl: string | null;
};

export default function PublicShopPage() {
  const routeParams = useParams<{ slug: string }>();
  const slug = routeParams?.slug;
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      return;
    }

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const query = new URLSearchParams();
        if (search.trim()) {
          query.set("q", search.trim());
        }
        if (inStockOnly) {
          query.set("inStock", "1");
        }

        const [shopRes, productsRes] = await Promise.all([
          fetch(`/api/public/shop/${slug}`, { cache: "no-store" }),
          fetch(`/api/public/shop/${slug}/products?${query.toString()}`, { cache: "no-store" }),
        ]);

        const shopJson = await shopRes.json();
        const productsJson = await productsRes.json();

        if (!shopRes.ok) {
          throw new Error(shopJson.error ?? "Boutique introuvable");
        }

        if (!productsRes.ok) {
          throw new Error(productsJson.error ?? "Produits indisponibles");
        }

        setShop(shopJson.data ?? null);
        setProducts(productsJson.data ?? []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, search, inStockOnly]);

  if (!slug) {
    return (
      <main className="home">
        <p className="feedback error">Boutique invalide.</p>
      </main>
    );
  }

  if (loading) {
    return <main className="home"><p>Chargement de la boutique...</p></main>;
  }

  if (error || !shop) {
    return (
      <main className="home">
        <p className="feedback error">{error ?? "Boutique introuvable"}</p>
      </main>
    );
  }

  return (
    <main className="storefront-wrap">
      <section className="storefront-phone">
        <header className="storefront-topbar">
          <span className="storefront-brandmark">BM</span>
          <strong>{shop.name}</strong>
          <span className="storefront-icon">🔔</span>
        </header>

        <section className="storefront-hero">
          {shop.coverUrl ? <img src={shop.coverUrl} alt={shop.name} className="storefront-cover" /> : null}
          <div className="storefront-hero-card">
            {shop.logoUrl ? <img src={shop.logoUrl} alt={shop.name} className="storefront-logo" /> : <span className="storefront-logo-fallback">🏪</span>}
            <h1>{shop.name}</h1>
            <p>{shop.description ?? "Decouvrez notre selection de produits."}</p>
            <div className="storefront-hero-actions">
              <a
                className="storefront-cta"
                href={`https://wa.me/${shop.whatsappNumber.replace(/[^\d]/g, "")}`}
                target="_blank"
                rel="noreferrer"
              >
                Voir les produits
              </a>
              <button type="button" className="storefront-icon-btn" aria-label="Rechercher">
                🔍
              </button>
            </div>
          </div>
        </section>

        <section className="storefront-section">
          <div className="storefront-section-head">
            <h2>Nos produits</h2>
            <label className="inline-check">
              <input type="checkbox" checked={inStockOnly} onChange={(event) => setInStockOnly(event.target.checked)} />
              En stock
            </label>
          </div>

          <div className="storefront-search-row">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Recherche produit"
              aria-label="Recherche produits"
            />
          </div>

          <div className="storefront-chips">
            <span className="active">Tous</span>
            {shop.category ? <span>{shop.category}</span> : null}
            {shop.city ? <span>{shop.city}</span> : null}
          </div>

          {products.length === 0 ? <p className="muted">Aucun produit disponible pour le moment.</p> : null}

          <div className="storefront-grid">
            {products.map((product) => (
              <article className="storefront-product-card" key={product.id}>
                {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="storefront-product-image" /> : <div className="storefront-product-image placeholder">Image</div>}
                <div className="storefront-product-body">
                  <strong>{product.name}</strong>
                  <span className="price">{Number(product.unitPrice).toFixed(0)} CFA</span>
                  <span className={product.stock > 0 ? "stock ok" : "stock out"}>
                    {product.stock > 0 ? "En stock" : "Rupture"}
                  </span>
                </div>
                <Link className="storefront-stretched-link" href={`/shop/${slug}/products/${product.id}`} aria-label={`Voir ${product.name}`}>
                  Voir
                </Link>
              </article>
            ))}
          </div>
        </section>

        <nav className="storefront-bottom-nav" aria-label="Navigation client">
          <span className="active">🏠</span>
          <span>🧭</span>
          <span>🛍️</span>
          <span>🛒</span>
          <span>👤</span>
        </nav>
      </section>
    </main>
  );
}

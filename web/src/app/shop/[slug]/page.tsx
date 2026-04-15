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
  category?: string | null;
  categories?: string[];
};

type ProductsResponse = {
  data: Product[];
  meta?: {
    categories?: string[];
  };
  error?: string;
};

export default function PublicShopPage() {
  const routeParams = useParams<{ slug: string }>();
  const slug = routeParams?.slug;
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [stockStatus, setStockStatus] = useState<"all" | "in" | "low" | "out">("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc" | "name_asc">("newest");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [draftSelectedCategories, setDraftSelectedCategories] = useState<string[]>([]);
  const [draftStockStatus, setDraftStockStatus] = useState<"all" | "in" | "low" | "out">("all");
  const [draftMinPrice, setDraftMinPrice] = useState("");
  const [draftMaxPrice, setDraftMaxPrice] = useState("");
  const [draftSortBy, setDraftSortBy] = useState<"newest" | "price_asc" | "price_desc" | "name_asc">("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resetFilters = () => {
    setSearch("");
    setInStockOnly(false);
    setSelectedCategories([]);
    setStockStatus("all");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category],
    );
  };

  const toggleDraftCategory = (category: string) => {
    setDraftSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category],
    );
  };

  const openMobileFilters = () => {
    setDraftSelectedCategories(selectedCategories);
    setDraftStockStatus(stockStatus);
    setDraftMinPrice(minPrice);
    setDraftMaxPrice(maxPrice);
    setDraftSortBy(sortBy);
    setMobileFiltersOpen(true);
  };

  const resetMobileDraft = () => {
    setDraftSelectedCategories([]);
    setDraftStockStatus("all");
    setDraftMinPrice("");
    setDraftMaxPrice("");
    setDraftSortBy("newest");
  };

  const applyMobileFilters = () => {
    setSelectedCategories(draftSelectedCategories);
    setStockStatus(draftStockStatus);
    setMinPrice(draftMinPrice);
    setMaxPrice(draftMaxPrice);
    setSortBy(draftSortBy);
    setMobileFiltersOpen(false);
  };

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
        if (stockStatus !== "all") {
          query.set("stockStatus", stockStatus);
        }
        if (minPrice.trim()) {
          query.set("minPrice", minPrice.trim());
        }
        if (maxPrice.trim()) {
          query.set("maxPrice", maxPrice.trim());
        }
        if (sortBy !== "newest") {
          query.set("sort", sortBy);
        }
        selectedCategories.forEach((category) => query.append("category", category));

        const [shopRes, productsRes] = await Promise.all([
          fetch(`/api/public/shop/${slug}`, { cache: "no-store" }),
          fetch(`/api/public/shop/${slug}/products?${query.toString()}`, { cache: "no-store" }),
        ]);

        const shopJson = await shopRes.json();
        const productsJson = (await productsRes.json()) as ProductsResponse;

        if (!shopRes.ok) {
          throw new Error(shopJson.error ?? "Boutique introuvable");
        }

        if (!productsRes.ok) {
          throw new Error(productsJson.error ?? "Produits indisponibles");
        }

        setShop(shopJson.data ?? null);
        setProducts(productsJson.data ?? []);
        setAvailableCategories(productsJson.meta?.categories ?? []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, search, inStockOnly, stockStatus, minPrice, maxPrice, sortBy, selectedCategories]);

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
              placeholder="Rechercher un produit"
              aria-label="Recherche produits"
            />
            <button type="button" className="storefront-filter-trigger" onClick={openMobileFilters}>
              Filtrer
            </button>
            <button type="button" className="storefront-reset-btn" onClick={resetFilters}>
              Reinitialiser
            </button>
          </div>

          <div className="storefront-layout">
            <aside className="storefront-filters" aria-label="Filtres produits">
              <div className="storefront-filter-card">
                <h3>Trier</h3>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)}>
                  <option value="newest">Les plus recents</option>
                  <option value="price_asc">Prix croissant</option>
                  <option value="price_desc">Prix decroissant</option>
                  <option value="name_asc">Nom A-Z</option>
                </select>
              </div>

              <div className="storefront-filter-card">
                <h3>Categorie</h3>
                <div className="storefront-filter-list">
                  {availableCategories.length === 0 ? <p className="muted">Aucune categorie</p> : null}
                  {availableCategories.map((category) => (
                    <label key={category} className="storefront-check-row">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => toggleCategory(category)}
                      />
                      <span>{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="storefront-filter-card">
                <h3>Prix</h3>
                <div className="storefront-price-filter">
                  <input
                    value={minPrice}
                    onChange={(event) => setMinPrice(event.target.value)}
                    placeholder="Min"
                    inputMode="decimal"
                  />
                  <span>-</span>
                  <input
                    value={maxPrice}
                    onChange={(event) => setMaxPrice(event.target.value)}
                    placeholder="Max"
                    inputMode="decimal"
                  />
                </div>
              </div>

              <div className="storefront-filter-card">
                <h3>Disponibilite</h3>
                <div className="storefront-filter-list">
                  <label className="storefront-check-row">
                    <input
                      type="radio"
                      name="stockStatus"
                      checked={stockStatus === "all"}
                      onChange={() => setStockStatus("all")}
                    />
                    <span>Tous</span>
                  </label>
                  <label className="storefront-check-row">
                    <input
                      type="radio"
                      name="stockStatus"
                      checked={stockStatus === "in"}
                      onChange={() => setStockStatus("in")}
                    />
                    <span>En stock</span>
                  </label>
                  <label className="storefront-check-row">
                    <input
                      type="radio"
                      name="stockStatus"
                      checked={stockStatus === "low"}
                      onChange={() => setStockStatus("low")}
                    />
                    <span>Stock bas</span>
                  </label>
                  <label className="storefront-check-row">
                    <input
                      type="radio"
                      name="stockStatus"
                      checked={stockStatus === "out"}
                      onChange={() => setStockStatus("out")}
                    />
                    <span>Rupture</span>
                  </label>
                </div>
              </div>
            </aside>

            <div>
              <div className="storefront-chips">
                <span className="active">Catalogue</span>
                {shop.category ? <span>{shop.category}</span> : null}
                {shop.city ? <span>{shop.city}</span> : null}
                <span>{products.length} produit(s)</span>
              </div>

              {products.length === 0 ? <p className="muted">Aucun produit disponible pour ces filtres.</p> : null}

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
            </div>
          </div>
        </section>

        <nav className="storefront-bottom-nav" aria-label="Navigation client">
          <span className="active">🏠</span>
          <span>🧭</span>
          <span>🛍️</span>
          <span>🛒</span>
          <span>👤</span>
        </nav>

        {mobileFiltersOpen ? (
          <div
            className="storefront-filter-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Filtres produits"
            onClick={() => setMobileFiltersOpen(false)}
          >
            <div className="storefront-filter-sheet" onClick={(event) => event.stopPropagation()}>
              <div className="storefront-filter-sheet-head">
                <strong>Filtres</strong>
                <button type="button" onClick={() => setMobileFiltersOpen(false)} aria-label="Fermer les filtres">
                  ✕
                </button>
              </div>

              <div className="storefront-filter-card">
                <h3>Trier</h3>
                <select value={draftSortBy} onChange={(event) => setDraftSortBy(event.target.value as typeof draftSortBy)}>
                  <option value="newest">Les plus recents</option>
                  <option value="price_asc">Prix croissant</option>
                  <option value="price_desc">Prix decroissant</option>
                  <option value="name_asc">Nom A-Z</option>
                </select>
              </div>

              <div className="storefront-filter-card">
                <h3>Categorie</h3>
                <div className="storefront-filter-list">
                  {availableCategories.length === 0 ? <p className="muted">Aucune categorie</p> : null}
                  {availableCategories.map((category) => (
                    <label key={`mobile-${category}`} className="storefront-check-row">
                      <input
                        type="checkbox"
                        checked={draftSelectedCategories.includes(category)}
                        onChange={() => toggleDraftCategory(category)}
                      />
                      <span>{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="storefront-filter-card">
                <h3>Prix</h3>
                <div className="storefront-price-filter">
                  <input
                    value={draftMinPrice}
                    onChange={(event) => setDraftMinPrice(event.target.value)}
                    placeholder="Min"
                    inputMode="decimal"
                  />
                  <span>-</span>
                  <input
                    value={draftMaxPrice}
                    onChange={(event) => setDraftMaxPrice(event.target.value)}
                    placeholder="Max"
                    inputMode="decimal"
                  />
                </div>
              </div>

              <div className="storefront-filter-card">
                <h3>Disponibilite</h3>
                <div className="storefront-filter-list">
                  <label className="storefront-check-row">
                    <input
                      type="radio"
                      name="mobileStockStatus"
                      checked={draftStockStatus === "all"}
                      onChange={() => setDraftStockStatus("all")}
                    />
                    <span>Tous</span>
                  </label>
                  <label className="storefront-check-row">
                    <input
                      type="radio"
                      name="mobileStockStatus"
                      checked={draftStockStatus === "in"}
                      onChange={() => setDraftStockStatus("in")}
                    />
                    <span>En stock</span>
                  </label>
                  <label className="storefront-check-row">
                    <input
                      type="radio"
                      name="mobileStockStatus"
                      checked={draftStockStatus === "low"}
                      onChange={() => setDraftStockStatus("low")}
                    />
                    <span>Stock bas</span>
                  </label>
                  <label className="storefront-check-row">
                    <input
                      type="radio"
                      name="mobileStockStatus"
                      checked={draftStockStatus === "out"}
                      onChange={() => setDraftStockStatus("out")}
                    />
                    <span>Rupture</span>
                  </label>
                </div>
              </div>

              <div className="storefront-filter-sheet-actions">
                <button type="button" className="storefront-reset-btn" onClick={resetMobileDraft}>
                  Reinitialiser
                </button>
                <button type="button" className="storefront-cta" onClick={applyMobileFilters}>
                  Appliquer
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

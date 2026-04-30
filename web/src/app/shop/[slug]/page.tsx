"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { formatPriceCFA } from "@/lib/format";

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
  imageVariants?: string[];
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
  const productsSectionRef = useRef<HTMLElement | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

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

  const scrollToProducts = () => {
    productsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!slug) {
      return;
    }

    void (async () => {
      if (!hasLoadedRef.current) {
        setLoading(true);
      } else {
        setIsFiltering(true);
      }
      setError(null);
      try {
        const query = new URLSearchParams();
        if (debouncedSearch.trim()) {
          query.set("q", debouncedSearch.trim());
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
        hasLoadedRef.current = true;
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Erreur inconnue");
      } finally {
        setLoading(false);
        setIsFiltering(false);
      }
    })();
  }, [slug, debouncedSearch, inStockOnly, stockStatus, minPrice, maxPrice, sortBy, selectedCategories]);

  if (!slug) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#f7faf7_0%,#edf5ef_100%)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Boutique invalide.
        </div>
      </main>
    );
  }

  if (loading && !hasLoadedRef.current) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#f7faf7_0%,#edf5ef_100%)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          Chargement de la boutique...
        </div>
      </main>
    );
  }

  if (error || !shop) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#f7faf7_0%,#edf5ef_100%)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error ?? "Boutique introuvable"}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7faf7_0%,#edf5ef_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-7xl rounded-3xl border border-emerald-100 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] sm:p-8">
        <header className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-xs font-bold text-white">BM</div>
          <strong className="truncate px-4 text-lg font-semibold text-slate-950">{shop.name}</strong>
          <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-emerald-50 px-3 text-sm font-semibold text-emerald-700">Live</span>
        </header>

        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-50" ref={productsSectionRef}>
          {shop.coverUrl ? <img src={shop.coverUrl} alt={shop.name} className="h-48 w-full object-cover sm:h-56" /> : null}

          <div className="relative grid gap-4 p-5 sm:p-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-3 rounded-full border border-emerald-100 bg-white px-3 py-2">
                {shop.logoUrl ? (
                  <img src={shop.logoUrl} alt={shop.name} className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">BM</span>
                )}
                <span className="text-sm font-medium text-emerald-700">Boutique en ligne</span>
              </div>

              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{shop.name}</h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">{shop.description ?? "Decouvrez notre selection de produits."}</p>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                onClick={scrollToProducts}
              >
                Voir les produits
              </button>
              <button type="button" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50" onClick={openMobileFilters}>
                Filtrer
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6" ref={productsSectionRef}>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-slate-950">Nos produits</h2>
            {isFiltering ? <span className="text-sm text-slate-500">Mise a jour des filtres...</span> : null}
            <label className="ml-auto inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <input type="checkbox" checked={inStockOnly} onChange={(event) => setInStockOnly(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
              En stock
            </label>
          </div>

          <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un produit"
              aria-label="Recherche produits"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
            <button type="button" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 lg:hidden" onClick={openMobileFilters}>
              Filtrer
            </button>
            <button type="button" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100" onClick={resetFilters}>
              Reinitialiser
            </button>
          </div>

          <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
            <aside className="hidden h-fit space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:block" aria-label="Filtres produits">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Trier</h3>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100">
                  <option value="newest">Les plus recents</option>
                  <option value="price_asc">Prix croissant</option>
                  <option value="price_desc">Prix decroissant</option>
                  <option value="name_asc">Nom A-Z</option>
                </select>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Categorie</h3>
                <div className="mt-2 grid gap-2 text-sm text-slate-700">
                  {availableCategories.length === 0 ? <p className="text-sm text-slate-500">Aucune categorie</p> : null}
                  {availableCategories.map((category) => (
                    <label key={category} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <input type="checkbox" checked={selectedCategories.includes(category)} onChange={() => toggleCategory(category)} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                      <span>{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Prix</h3>
                <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <input value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="Min" inputMode="decimal" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
                  <span className="text-slate-400">-</span>
                  <input value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Max" inputMode="decimal" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Disponibilite</h3>
                <div className="mt-2 grid gap-2 text-sm text-slate-700">
                  {[
                    ["all", "Tous"],
                    ["in", "En stock"],
                    ["low", "Stock bas"],
                    ["out", "Rupture"],
                  ].map(([value, label]) => (
                    <label key={value} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <input type="radio" name="stockStatus" checked={stockStatus === value} onChange={() => setStockStatus(value as typeof stockStatus)} className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </aside>

            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Catalogue</span>
                {shop.category ? <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">{shop.category}</span> : null}
                {shop.city ? <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">{shop.city}</span> : null}
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">{products.length} produit(s)</span>
              </div>

              {products.length === 0 ? <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">Aucun produit disponible pour ces filtres.</p> : null}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => {
                  const previewImage = product.imageUrl || product.imageVariants?.[0] || null;

                  return (
                    <article key={product.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                      {previewImage ? (
                        <img src={previewImage} alt={product.name} className="h-40 w-full object-cover" />
                      ) : (
                        <div className="flex h-40 w-full items-center justify-center bg-slate-50 text-sm text-slate-500">Image</div>
                      )}
                      <div className="grid gap-2 p-4">
                        <strong className="text-base text-slate-900">{product.name}</strong>
                        <span className="text-lg font-semibold text-emerald-700">{formatPriceCFA(product.unitPrice)}</span>
                        <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${product.stock > 0 ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-rose-200 bg-rose-50 text-rose-700"}`}>
                          {product.stock > 0 ? "En stock" : "Rupture"}
                        </span>
                        <Link
                          href={`/shop/${slug}/products/${product.id}`}
                          aria-label={`Voir ${product.name}`}
                          className="mt-2 inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          Voir
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <nav className="mt-8 grid grid-cols-5 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 text-center text-sm text-slate-500" aria-label="Navigation client">
          <span className="rounded-xl bg-emerald-100 px-2 py-2 font-semibold text-emerald-700">Accueil</span>
          <span className="rounded-xl px-2 py-2">Explorer</span>
          <span className="rounded-xl px-2 py-2">Produits</span>
          <span className="rounded-xl px-2 py-2">Panier</span>
          <span className="rounded-xl px-2 py-2">Compte</span>
        </nav>

        {mobileFiltersOpen ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-4 backdrop-blur-sm lg:hidden" role="dialog" aria-modal="true" aria-label="Filtres produits" onClick={() => setMobileFiltersOpen(false)}>
            <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5" onClick={(event) => event.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <strong className="text-lg font-semibold text-slate-950">Filtres</strong>
                <button type="button" onClick={() => setMobileFiltersOpen(false)} aria-label="Fermer les filtres" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50">
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Trier</h3>
                  <select value={draftSortBy} onChange={(event) => setDraftSortBy(event.target.value as typeof draftSortBy)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100">
                    <option value="newest">Les plus recents</option>
                    <option value="price_asc">Prix croissant</option>
                    <option value="price_desc">Prix decroissant</option>
                    <option value="name_asc">Nom A-Z</option>
                  </select>
                </div>

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Categorie</h3>
                  <div className="mt-2 grid gap-2 text-sm text-slate-700">
                    {availableCategories.length === 0 ? <p className="text-sm text-slate-500">Aucune categorie</p> : null}
                    {availableCategories.map((category) => (
                      <label key={`mobile-${category}`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                        <input type="checkbox" checked={draftSelectedCategories.includes(category)} onChange={() => toggleDraftCategory(category)} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                        <span>{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Prix</h3>
                  <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <input value={draftMinPrice} onChange={(event) => setDraftMinPrice(event.target.value)} placeholder="Min" inputMode="decimal" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
                    <span className="text-slate-400">-</span>
                    <input value={draftMaxPrice} onChange={(event) => setDraftMaxPrice(event.target.value)} placeholder="Max" inputMode="decimal" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Disponibilite</h3>
                  <div className="mt-2 grid gap-2 text-sm text-slate-700">
                    {[
                      ["all", "Tous"],
                      ["in", "En stock"],
                      ["low", "Stock bas"],
                      ["out", "Rupture"],
                    ].map(([value, label]) => (
                      <label key={value} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                        <input type="radio" name="mobileStockStatus" checked={draftStockStatus === value} onChange={() => setDraftStockStatus(value as typeof draftStockStatus)} className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button type="button" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100" onClick={resetMobileDraft}>
                  Reinitialiser
                </button>
                <button type="button" className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700" onClick={applyMobileFilters}>
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

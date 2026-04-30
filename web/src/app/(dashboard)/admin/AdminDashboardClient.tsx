"use client";

import { useEffect, useMemo, useState } from "react";

type OverviewPayload = {
  shopsCount: number;
  publishedShopsCount: number;
  usersCount: number;
  ordersCount: number;
  stockLowCount: number;
  revenue: number;
};

type ShopRow = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  isPublished: boolean;
  whatsappNumber: string;
  createdAt: string;
  owner: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
  };
  productsCount: number;
  ordersCount: number;
};

type ShopsPayload = {
  data: ShopRow[];
  total: number;
};

function toMoney(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AdminDashboardClient() {
  const [overview, setOverview] = useState<OverviewPayload | null>(null);
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingShopId, setPendingShopId] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(timeout);
  }, [query]);

  async function loadData(search = "") {
    setLoading(true);
    setError(null);

    try {
      const [overviewResponse, shopsResponse] = await Promise.all([
        fetch("/api/admin/overview", { cache: "no-store" }),
        fetch(`/api/admin/shops?q=${encodeURIComponent(search)}`, { cache: "no-store" }),
      ]);

      const overviewPayload = (await overviewResponse.json()) as
        | OverviewPayload
        | { error?: string };
      const shopsPayload = (await shopsResponse.json()) as ShopsPayload | { error?: string };

      if (!overviewResponse.ok || "error" in overviewPayload) {
        throw new Error(
          ("error" in overviewPayload && overviewPayload.error) ||
            "Impossible de charger les statistiques plateforme"
        );
      }

      if (!shopsResponse.ok || "error" in shopsPayload) {
        throw new Error(
          ("error" in shopsPayload && shopsPayload.error) ||
            "Impossible de charger les boutiques"
        );
      }

      setOverview(overviewPayload as OverviewPayload);
      setShops((shopsPayload as ShopsPayload).data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setOverview(null);
      setShops([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(debouncedQuery);
  }, [debouncedQuery]);

  async function togglePublication(shopId: string, isPublished: boolean) {
    setPendingShopId(shopId);
    setActionError(null);

    try {
      const response = await fetch("/api/admin/shops", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, isPublished: !isPublished }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Mise a jour impossible");
      }

      setShops((current) =>
        current.map((shop) =>
          shop.id === shopId ? { ...shop, isPublished: !isPublished } : shop
        )
      );

      setOverview((current) => {
        if (!current) {
          return current;
        }

        const delta = isPublished ? -1 : 1;
        return {
          ...current,
          publishedShopsCount: Math.max(0, current.publishedShopsCount + delta),
        };
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setPendingShopId(null);
    }
  }

  const publicationRate = useMemo(() => {
    if (!overview || overview.shopsCount === 0) {
      return 0;
    }

    return Math.round((overview.publishedShopsCount / overview.shopsCount) * 100);
  }, [overview]);

  const draftShopsCount = useMemo(() => {
    if (!overview) {
      return 0;
    }

    return Math.max(0, overview.shopsCount - overview.publishedShopsCount);
  }, [overview]);

  function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <main className="grid gap-2.5 p-3 sm:gap-3.5 sm:p-4 lg:gap-4 lg:p-5">
      <section className="rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_82%_6%,rgba(25,105,82,0.14)_0%,transparent_40%),radial-gradient(circle_at_8%_80%,rgba(43,88,180,0.1)_0%,transparent_35%),linear-gradient(145deg,#ffffff_0%,#f5faf8_100%)] p-4 sm:p-5">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <span className="inline-flex rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 sm:text-sm">Espace gerant</span>
            <h1 className="mt-3 text-2xl font-bold leading-tight text-slate-900 sm:text-2.5xl">Pilotage global de la plateforme</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
              Suis les performances de toutes les boutiques, controle leur publication et
              accompagne les commercants en temps reel.
            </p>
          </div>
          <div className="w-full grid gap-2 sm:w-96">
            <label htmlFor="admin-shop-search" className="text-xs font-bold text-slate-700 sm:text-sm">Rechercher une boutique</label>
            <input
              id="admin-shop-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nom, slug, ville, email..."
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 sm:text-base"
            />
          </div>
        </div>

        {overview && (
          <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
            <span className="inline-flex rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 sm:text-sm">Publication: {publicationRate}%</span>
            <span className="inline-flex rounded-full border border-yellow-300 bg-yellow-100 px-3 py-1.5 text-xs font-bold text-yellow-700 sm:text-sm">Brouillons: {draftShopsCount}</span>
            <span className="inline-flex rounded-full border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 sm:text-sm">CA: {toMoney(overview.revenue)}</span>
          </div>
        )}
      </section>

      {loading && <p className="py-4 text-center text-sm text-slate-600">Chargement des donnees plateforme...</p>}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:py-2.5 sm:text-base">{error}</p>}
      {actionError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:py-2.5 sm:text-base">{actionError}</p>}

      {overview && !loading && (
        <section className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 sm:p-5">
          <div className="grid gap-2 grid-cols-2 sm:gap-2.5 lg:grid-cols-6">
            <article className="rounded-lg border border-slate-200 bg-slate-50 p-2 sm:p-2.5">
              <h3 className="mb-1 text-xs font-semibold text-slate-600 sm:text-sm">Boutiques</h3>
              <p className="text-lg font-bold text-slate-900 sm:text-xl">{overview.shopsCount}</p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-slate-50 p-2 sm:p-2.5">
              <h3 className="mb-1 text-xs font-semibold text-slate-600 sm:text-sm">Publiees</h3>
              <p className="text-lg font-bold text-slate-900 sm:text-xl">{overview.publishedShopsCount}</p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-slate-50 p-2 sm:p-2.5">
              <h3 className="mb-1 text-xs font-semibold text-slate-600 sm:text-sm">Commercants</h3>
              <p className="text-lg font-bold text-slate-900 sm:text-xl">{overview.usersCount}</p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-slate-50 p-2 sm:p-2.5">
              <h3 className="mb-1 text-xs font-semibold text-slate-600 sm:text-sm">Commandes</h3>
              <p className="text-lg font-bold text-slate-900 sm:text-xl">{overview.ordersCount}</p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-slate-50 p-2 sm:p-2.5">
              <h3 className="mb-1 text-xs font-semibold text-slate-600 sm:text-sm">Stock bas</h3>
              <p className="text-lg font-bold text-slate-900 sm:text-xl">{overview.stockLowCount}</p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-slate-50 p-2 sm:p-2.5">
              <h3 className="mb-1 text-xs font-semibold text-slate-600 sm:text-sm">CA global</h3>
              <p className="text-lg font-bold text-slate-900 sm:text-xl">{toMoney(overview.revenue)}</p>
            </article>
          </div>
          <p className="mt-3 text-xs text-slate-600 sm:text-sm">
            Taux de publication actuel: <strong className="font-semibold text-emerald-700">{publicationRate}%</strong>
          </p>
        </section>
      )}

      {!loading && (
        <section className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 sm:p-5">
          <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Boutiques creees ({shops.length})</h2>
              <p className="mt-1 text-sm text-slate-600">Controle publication, visibilite et activite par boutique.</p>
            </div>
          </div>

          {shops.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-600">Aucune boutique trouvee.</p>
          ) : (
            <>
              <div className="mb-6 grid gap-3 sm:hidden">
                {shops.map((shop) => {
                  const shopUrl = `/shop/${shop.slug}`;

                  return (
                    <article key={shop.id} className="rounded-lg border border-slate-200 bg-white p-4 grid gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-slate-900">{shop.name}</h3>
                          <p className="text-xs text-slate-600">/{shop.slug}</p>
                        </div>
                        <span
                          className={`inline-flex flex-shrink-0 rounded-full px-2 py-1 text-xs font-bold ${shop.isPublished ? "border border-emerald-300 bg-emerald-100 text-emerald-700" : "border border-yellow-300 bg-yellow-100 text-yellow-700"}`}
                        >
                          {shop.isPublished ? "Publiee" : "Brouillon"}
                        </span>
                      </div>

                      <div className="grid gap-2 grid-cols-2 text-xs">
                        <div>
                          <span className="block font-semibold text-slate-700">Commercant</span>
                          <strong className="block text-slate-900">{shop.owner.fullName}</strong>
                          <small className="block text-slate-600">{shop.owner.email}</small>
                        </div>
                        <div>
                          <span className="block font-semibold text-slate-700">Ville</span>
                          <strong className="block text-slate-900">{shop.city ?? "-"}</strong>
                        </div>
                        <div>
                          <span className="block font-semibold text-slate-700">Produits</span>
                          <strong className="block text-slate-900">{shop.productsCount}</strong>
                        </div>
                        <div>
                          <span className="block font-semibold text-slate-700">Commandes</span>
                          <strong className="block text-slate-900">{shop.ordersCount}</strong>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 border-t border-slate-200 pt-3">
                        <small className="text-slate-600">Creee le {formatDate(shop.createdAt)}</small>
                        <div className="flex gap-2">
                          <a className="inline-flex rounded-lg border border-slate-300 bg-slate-100 px-2 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200" href={shopUrl} target="_blank" rel="noreferrer">
                            Voir
                          </a>
                          <button
                            type="button"
                            className="inline-flex rounded-lg border border-slate-300 bg-slate-100 px-2 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50"
                            onClick={() => togglePublication(shop.id, shop.isPublished)}
                            disabled={pendingShopId === shop.id}
                          >
                            {pendingShopId === shop.id
                              ? "Mise a jour..."
                              : shop.isPublished
                                ? "Depublier"
                                : "Publier"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="hidden overflow-x-auto rounded-lg border border-slate-200 sm:block">
                <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 sm:py-3 sm:px-4">Boutique</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 sm:py-3 sm:px-4">Commercant</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 sm:py-3 sm:px-4">Ville</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-slate-700 sm:py-3 sm:px-4">Produits</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-slate-700 sm:py-3 sm:px-4">Commandes</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-slate-700 sm:py-3 sm:px-4">Statut</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-slate-700 sm:py-3 sm:px-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {shops.map((shop) => {
                    const shopUrl = `/shop/${shop.slug}`;

                    return (
                      <tr key={shop.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-3 py-2 text-xs sm:py-3 sm:px-4">
                          <strong className="block text-slate-900">{shop.name}</strong>
                          <div className="block text-slate-600">/{shop.slug}</div>
                          <div className="block text-slate-500">Creee le {formatDate(shop.createdAt)}</div>
                        </td>
                        <td className="px-3 py-2 text-xs sm:py-3 sm:px-4">
                          <strong className="block text-slate-900">{shop.owner.fullName}</strong>
                          <div className="block text-slate-600">{shop.owner.email}</div>
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-900 sm:py-3 sm:px-4">{shop.city ?? "-"}</td>
                        <td className="px-3 py-2 text-center text-xs text-slate-900 sm:py-3 sm:px-4">{shop.productsCount}</td>
                        <td className="px-3 py-2 text-center text-xs text-slate-900 sm:py-3 sm:px-4">{shop.ordersCount}</td>
                        <td className="px-3 py-2 text-center text-xs sm:py-3 sm:px-4">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${shop.isPublished ? "border border-emerald-300 bg-emerald-100 text-emerald-700" : "border border-yellow-300 bg-yellow-100 text-yellow-700"}`}
                          >
                            {shop.isPublished ? "Publiee" : "Brouillon"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right sm:py-3 sm:px-4">
                          <div className="flex justify-end gap-2">
                            <a className="inline-flex rounded-lg border border-slate-300 bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200" href={shopUrl} target="_blank" rel="noreferrer">
                              Voir
                            </a>
                            <button
                              type="button"
                              className="inline-flex rounded-lg border border-slate-300 bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50"
                              onClick={() => togglePublication(shop.id, shop.isPublished)}
                              disabled={pendingShopId === shop.id}
                            >
                              {pendingShopId === shop.id
                                ? "Mise a jour..."
                                : shop.isPublished
                                  ? "Depublier"
                                  : "Publier"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </>
          )}
        </section>
      )}
    </main>
  );
}

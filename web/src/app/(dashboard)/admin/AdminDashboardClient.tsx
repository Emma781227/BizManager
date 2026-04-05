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
    <main className="page-stack merchant-grid admin-platform-page">
      <section className="card merchant-hero admin-hero">
        <div className="section-head admin-hero-head">
          <div>
            <span className="admin-eyebrow">Espace gerant</span>
            <h1>Pilotage global de la plateforme</h1>
            <p>
              Suis les performances de toutes les boutiques, controle leur publication et
              accompagne les commercants en temps reel.
            </p>
          </div>
          <div className="admin-search-box">
            <label htmlFor="admin-shop-search">Rechercher une boutique</label>
            <input
              id="admin-shop-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nom, slug, ville, email..."
            />
          </div>
        </div>

        {overview && (
          <div className="admin-highlight-row">
            <span className="admin-highlight-pill">Publication: {publicationRate}%</span>
            <span className="admin-highlight-pill">Brouillons: {draftShopsCount}</span>
            <span className="admin-highlight-pill">CA: {toMoney(overview.revenue)}</span>
          </div>
        )}
      </section>

      {loading && <p className="muted">Chargement des donnees plateforme...</p>}
      {error && <p className="feedback error">{error}</p>}
      {actionError && <p className="feedback error">{actionError}</p>}

      {overview && !loading && (
        <section className="card merchant-surface">
          <div className="kpi-grid admin-kpi-grid">
            <article className="kpi-box">
              <h3>Boutiques</h3>
              <p>{overview.shopsCount}</p>
            </article>
            <article className="kpi-box">
              <h3>Publiees</h3>
              <p>{overview.publishedShopsCount}</p>
            </article>
            <article className="kpi-box">
              <h3>Commercants</h3>
              <p>{overview.usersCount}</p>
            </article>
            <article className="kpi-box">
              <h3>Commandes</h3>
              <p>{overview.ordersCount}</p>
            </article>
            <article className="kpi-box">
              <h3>Stock bas</h3>
              <p>{overview.stockLowCount}</p>
            </article>
            <article className="kpi-box">
              <h3>CA global</h3>
              <p>{toMoney(overview.revenue)}</p>
            </article>
          </div>
          <p className="muted admin-kpi-footnote">
            Taux de publication actuel: <strong>{publicationRate}%</strong>
          </p>
        </section>
      )}

      {!loading && (
        <section className="card merchant-surface">
          <div className="top-actions admin-top-actions">
            <h2>Boutiques creees ({shops.length})</h2>
            <p className="muted">Controle publication, visibilite et activite par boutique.</p>
          </div>

          {shops.length === 0 ? (
            <p className="muted">Aucune boutique trouvee.</p>
          ) : (
            <>
              <div className="admin-shop-cards">
                {shops.map((shop) => {
                  const shopUrl = `/shop/${shop.slug}`;

                  return (
                    <article key={shop.id} className="admin-shop-card">
                      <div className="admin-shop-card-head">
                        <div>
                          <h3>{shop.name}</h3>
                          <p>/{shop.slug}</p>
                        </div>
                        <span
                          className={shop.isPublished ? "status-pill stock-ok" : "status-pill stock-low"}
                        >
                          {shop.isPublished ? "Publiee" : "Brouillon"}
                        </span>
                      </div>

                      <div className="admin-shop-meta-grid">
                        <div>
                          <span>Commercant</span>
                          <strong>{shop.owner.fullName}</strong>
                          <small>{shop.owner.email}</small>
                        </div>
                        <div>
                          <span>Ville</span>
                          <strong>{shop.city ?? "-"}</strong>
                        </div>
                        <div>
                          <span>Produits</span>
                          <strong>{shop.productsCount}</strong>
                        </div>
                        <div>
                          <span>Commandes</span>
                          <strong>{shop.ordersCount}</strong>
                        </div>
                      </div>

                      <div className="admin-shop-card-foot">
                        <small>Creee le {formatDate(shop.createdAt)}</small>
                        <div className="admin-actions">
                          <a className="ghost-link" href={shopUrl} target="_blank" rel="noreferrer">
                            Voir
                          </a>
                          <button
                            type="button"
                            className="ghost-btn"
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

              <div className="table-wrap admin-table-wrap">
                <table>
                <thead>
                  <tr>
                    <th>Boutique</th>
                    <th>Commercant</th>
                    <th>Ville</th>
                    <th>Produits</th>
                    <th>Commandes</th>
                    <th>Statut</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {shops.map((shop) => {
                    const shopUrl = `/shop/${shop.slug}`;

                    return (
                      <tr key={shop.id}>
                        <td>
                          <strong>{shop.name}</strong>
                          <div className="meta-line">/{shop.slug}</div>
                          <div className="meta-line">Creee le {formatDate(shop.createdAt)}</div>
                        </td>
                        <td>
                          <strong>{shop.owner.fullName}</strong>
                          <div className="meta-line">{shop.owner.email}</div>
                        </td>
                        <td>{shop.city ?? "-"}</td>
                        <td>{shop.productsCount}</td>
                        <td>{shop.ordersCount}</td>
                        <td>
                          <span
                            className={shop.isPublished ? "status-pill stock-ok" : "status-pill stock-low"}
                          >
                            {shop.isPublished ? "Publiee" : "Brouillon"}
                          </span>
                        </td>
                        <td>
                          <div className="admin-actions">
                            <a className="ghost-link" href={shopUrl} target="_blank" rel="noreferrer">
                              Voir
                            </a>
                            <button
                              type="button"
                              className="ghost-btn"
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

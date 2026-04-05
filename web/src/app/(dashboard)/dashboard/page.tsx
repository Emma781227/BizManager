"use client";

import { useEffect, useState } from "react";

type DashboardPayload = {
  period: string;
  sales: number;
  ordersCount: number;
  customersCount: number;
  statusCounts: {
    pending: number;
    new: number;
    confirmed: number;
    in_progress: number;
    ready: number;
    delivered: number;
    cancelled: number;
  };
  topProducts: Array<{
    productId: string;
    name: string;
    quantity: number;
    amount: number;
  }>;
};

function toMoney(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DashboardPage() {
  const [period, setPeriod] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardPayload | null>(null);

  async function loadDashboard(nextPeriod: string) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/dashboard?period=${nextPeriod}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as DashboardPayload | { error?: string };

      if (!response.ok || "error" in payload) {
        throw new Error(("error" in payload && payload.error) || "Impossible de charger le dashboard");
      }

      setData(payload as DashboardPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard(period);
  }, [period]);

  return (
    <main className="page-stack merchant-grid">
      <section className="card merchant-hero">
        <div className="section-head">
          <div>
            <h1>Tableau de Bord</h1>
            <p>Bonjour, voici le resume de ton activite.</p>
          </div>
          <label>
            Periode
            <select value={period} onChange={(event) => setPeriod(event.target.value)}>
              <option value="7d">7 jours</option>
              <option value="30d">30 jours</option>
              <option value="90d">90 jours</option>
            </select>
          </label>
        </div>
        {loading && <p className="muted">Chargement des KPI...</p>}
        {error && <p className="feedback error">{error}</p>}
      </section>

      {data && !loading && (
        <>
          <section className="card merchant-surface">
            <div className="kpi-grid">
              <article className="kpi-box">
                <h3>Produits</h3>
                <p>{data.topProducts.length}</p>
              </article>
              <article className="kpi-box">
                <h3>Clients</h3>
                <p>{data.customersCount}</p>
              </article>
              <article className="kpi-box">
                <h3>Commandes</h3>
                <p>{data.ordersCount}</p>
              </article>
              <article className="kpi-box">
                <h3>CA</h3>
                <p>{toMoney(data.sales)}</p>
              </article>
            </div>
          </section>

          <section className="card merchant-surface">
            <h2>Statuts Commande</h2>
            <div className="status-chips">
              <span>En attente: {data.statusCounts.pending}</span>
              <span>Nouvelles: {data.statusCounts.new}</span>
              <span>Confirmees: {data.statusCounts.confirmed}</span>
              <span>En cours: {data.statusCounts.in_progress}</span>
              <span>Pretes: {data.statusCounts.ready}</span>
              <span>Livrees: {data.statusCounts.delivered}</span>
              <span>Annulees: {data.statusCounts.cancelled}</span>
            </div>
          </section>

          <section className="card merchant-surface">
            <div className="top-actions">
              <h2>Dernieres Ventes</h2>
            </div>
            {data.topProducts.length === 0 ? (
              <p className="muted">Aucune vente sur la periode.</p>
            ) : (
              <div className="list-cards">
                {data.topProducts.map((product) => (
                  <article key={product.productId} className="list-item">
                    <div className="list-main">
                      <strong>{product.name}</strong>
                      <span>Quantite: {product.quantity}</span>
                    </div>
                    <strong className="price">{toMoney(product.amount)}</strong>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

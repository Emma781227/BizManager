"use client";

import Link from "next/link";
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

type ChartPoint = {
  label: string;
  value: number;
};

const statusLabels = [
  { key: "pending", label: "En attente", tone: "warn" },
  { key: "new", label: "Nouvelle", tone: "ok" },
  { key: "confirmed", label: "Confirmée", tone: "ok" },
  { key: "in_progress", label: "En cours", tone: "warn" },
  { key: "ready", label: "Prête", tone: "ok" },
  { key: "delivered", label: "Livrée", tone: "ok" },
  { key: "cancelled", label: "Annulée", tone: "danger" },
] as const;

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value)} FCFA`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 0 }).format(value);
}

function buildChartPoints(data: DashboardPayload | null): ChartPoint[] {
  if (!data) {
    return [];
  }

  return [
    { label: "Att.", value: data.statusCounts.pending },
    { label: "Nouv.", value: data.statusCounts.new },
    { label: "Conf.", value: data.statusCounts.confirmed },
    { label: "Cours", value: data.statusCounts.in_progress },
    { label: "Prête", value: data.statusCounts.ready },
    { label: "Livr.", value: data.statusCounts.delivered },
  ];
}

function buildLinePath(points: Array<{ x: number; y: number }>) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

function buildAreaPath(points: Array<{ x: number; y: number }>, baseY: number) {
  if (points.length === 0) {
    return "";
  }

  const linePath = buildLinePath(points);
  const lastPoint = points[points.length - 1];

  return `${linePath} L ${lastPoint.x} ${baseY} L ${points[0].x} ${baseY} Z`;
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

  const periodLabel =
    period === "7d" ? "7 derniers jours" : period === "90d" ? "90 derniers jours" : "30 derniers jours";

  const totalOrders = data?.ordersCount ?? 0;
  const totalCustomers = data?.customersCount ?? 0;
  const totalSales = data?.sales ?? 0;
  const deliveredCount = data?.statusCounts.delivered ?? 0;
  const activeOrders = data
    ? data.statusCounts.pending + data.statusCounts.new + data.statusCounts.confirmed + data.statusCounts.in_progress + data.statusCounts.ready
    : 0;
  const averageBasket = totalOrders > 0 ? totalSales / totalOrders : 0;
  const deliveryRate = totalOrders > 0 ? deliveredCount / totalOrders : 0;
  const cancelRate = totalOrders > 0 ? (data?.statusCounts.cancelled ?? 0) / totalOrders : 0;
  const notificationCount = (data?.statusCounts.pending ?? 0) + (data?.statusCounts.new ?? 0);
  const chartLabels = buildChartPoints(data);
  const chartMax = Math.max(...chartLabels.map((point) => point.value), 1);
  const chartWidth = 960;
  const chartHeight = 280;
  const chartPadding = 28;
  const chartBaseY = chartHeight - chartPadding;
  const chartPlotWidth = chartWidth - chartPadding * 2;
  const chartPlotHeight = chartHeight - chartPadding * 2;
  const chartPoints = chartLabels.map((point, index) => {
    const x =
      chartLabels.length <= 1
        ? chartPadding + chartPlotWidth / 2
        : chartPadding + (index * chartPlotWidth) / (chartLabels.length - 1);
    const y = chartPadding + (1 - point.value / chartMax) * chartPlotHeight;

    return { ...point, x, y };
  });
  const linePath = buildLinePath(chartPoints);
  const areaPath = buildAreaPath(chartPoints, chartBaseY);
  const statusRows = data
    ? statusLabels.map((status) => {
        const value = data.statusCounts[status.key];

        return {
          ...status,
          value,
          share: totalOrders > 0 ? value / totalOrders : 0,
          estimatedSales: averageBasket * value,
        };
      })
    : [];
  const topProductTotal = data?.topProducts.reduce((sum, product) => sum + product.quantity, 0) ?? 0;
  const bestProduct = data?.topProducts[0] ?? null;

  return (
    <main className="dashboard-page">
      <div className="page-header dashboard-header card">
        <div className="dashboard-header-copy">
          <p className="dashboard-eyebrow">Tableau de bord marchand</p>
          <div className="dashboard-title-row">
            <h1>Vue d'ensemble de votre boutique</h1>
            <span className="chip dashboard-period-chip">{periodLabel}</span>
          </div>
          <p>Un résumé clair des ventes, commandes et clients sur la période sélectionnée.</p>
          <label className="dashboard-period-select">
            <span>Période</span>
            <select value={period} onChange={(event) => setPeriod(event.target.value)}>
              <option value="7d">7 jours</option>
              <option value="30d">30 jours</option>
              <option value="90d">90 jours</option>
            </select>
          </label>
        </div>

        <div className="dashboard-header-actions">
          <label className="dashboard-search" aria-label="Rechercher dans le dashboard">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Zm0-1.5a8 8 0 1 0 4.93 14.27l4.49 4.49 1.06-1.06-4.49-4.49A8 8 0 0 0 10.5 2.5Z" />
            </svg>
            <input type="search" placeholder="Rechercher un produit, une commande..." />
          </label>

          <button type="button" className="dashboard-icon-button" aria-label="Notifications">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2.75a6.25 6.25 0 0 0-6.25 6.25v2.46c0 .95-.27 1.89-.79 2.7L3.9 16.67A1.5 1.5 0 0 0 5.17 19h13.66a1.5 1.5 0 0 0 1.27-2.33l-1.06-1.56c-.52-.81-.79-1.75-.79-2.7V9A6.25 6.25 0 0 0 12 2.75Zm0 18a2.25 2.25 0 0 1-2.16-1.65h4.32A2.25 2.25 0 0 1 12 20.75Z" />
            </svg>
            {notificationCount > 0 ? <span className="dashboard-badge">{notificationCount}</span> : null}
          </button>

          <div className="dashboard-profile">
            <span className="dashboard-avatar" aria-hidden>
              BM
            </span>
            <div>
              <strong>Compte marchand</strong>
              <p>Boutique active</p>
            </div>
          </div>

          <Link href="/products" className="dashboard-cta btn btn-primary">
            Ajouter un produit
          </Link>
        </div>
      </div>

      {loading ? (
        <section className="card dashboard-state-card">
          <p className="muted">Chargement du tableau de bord...</p>
        </section>
      ) : error ? (
        <section className="card dashboard-state-card">
          <p className="feedback error">{error}</p>
        </section>
      ) : data ? (
        <div className="dashboard-content">
          <section className="dashboard-kpis">
            <article className="card dashboard-kpi-card">
              <p>Chiffre d'affaires</p>
              <strong>{formatMoney(totalSales)}</strong>
              <span>Sur {periodLabel}</span>
            </article>
            <article className="card dashboard-kpi-card">
              <p>Commandes</p>
              <strong>{formatNumber(totalOrders)}</strong>
              <span>{formatNumber(activeOrders)} en cours de traitement</span>
            </article>
            <article className="card dashboard-kpi-card">
              <p>Clients</p>
              <strong>{formatNumber(totalCustomers)}</strong>
              <span>
                {totalOrders > 0
                  ? `${formatNumber(totalOrders / Math.max(totalCustomers, 1))} commande(s) / client`
                  : "Aucune commande pour le moment"}
              </span>
            </article>
            <article className="card dashboard-kpi-card">
              <p>Panier moyen</p>
              <strong>{formatMoney(averageBasket)}</strong>
              <span>{formatPercent(deliveryRate)} des commandes livrées</span>
            </article>
          </section>

          <section className="dashboard-overview-grid">
            <article className="card dashboard-chart-card">
              <div className="dashboard-card-head">
                <div>
                  <p className="dashboard-section-kicker">Activité</p>
                  <h2>Evolution des commandes</h2>
                </div>
                <div className="dashboard-card-meta">
                  <span className="chip">{formatNumber(activeOrders)} actives</span>
                  <span className="chip">{formatPercent(cancelRate)} annulées</span>
                </div>
              </div>

              <div className="dashboard-chart-grid">
                <div className="dashboard-chart-summary">
                  <strong>{formatMoney(totalSales)}</strong>
                  <span>CA total sur la période</span>
                  <p>{bestProduct ? `Produit phare : ${bestProduct.name}` : "Aucun produit vendu sur cette période."}</p>
                </div>

                <div className="dashboard-chart-wrap" aria-label="Graphique des commandes">
                  <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-hidden="true">
                    <defs>
                      <linearGradient id="dashboard-area-fill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="rgba(29, 124, 95, 0.26)" />
                        <stop offset="100%" stopColor="rgba(29, 124, 95, 0.04)" />
                      </linearGradient>
                    </defs>

                    {[0.2, 0.4, 0.6, 0.8].map((ratio) => (
                      <line
                        key={ratio}
                        x1={chartPadding}
                        x2={chartWidth - chartPadding}
                        y1={chartPadding + chartPlotHeight * ratio}
                        y2={chartPadding + chartPlotHeight * ratio}
                        className="dashboard-grid-line"
                      />
                    ))}

                    {chartPoints.length > 0 ? (
                      <>
                        <path d={areaPath} fill="url(#dashboard-area-fill)" />
                        <path d={linePath} className="dashboard-chart-line" />
                        {chartPoints.map((point) => (
                          <g key={point.label}>
                            <circle cx={point.x} cy={point.y} r="5" className="dashboard-chart-dot" />
                            <text x={point.x} y={chartHeight - 8} className="dashboard-chart-label">
                              {point.label}
                            </text>
                          </g>
                        ))}
                      </>
                    ) : null}
                  </svg>
                </div>
              </div>
            </article>

            <article className="card dashboard-products-card">
              <div className="dashboard-card-head">
                <div>
                  <p className="dashboard-section-kicker">Produits</p>
                  <h2>Meilleurs produits</h2>
                </div>
                <span className="chip">{data.topProducts.length} références</span>
              </div>

              {data.topProducts.length === 0 ? (
                <p className="dashboard-empty-copy">Aucune vente disponible sur cette période.</p>
              ) : (
                <div className="dashboard-product-list">
                  {data.topProducts.map((product, index) => {
                    const quantityShare = topProductTotal > 0 ? product.quantity / topProductTotal : 0;

                    return (
                      <article key={product.productId} className="dashboard-product-row">
                        <div className="dashboard-product-rank">{index + 1}</div>
                        <div className="dashboard-product-main">
                          <strong>{product.name}</strong>
                          <span>{formatNumber(product.quantity)} unité(s)</span>
                          <div className="dashboard-progress">
                            <span style={{ width: `${Math.max(quantityShare * 100, 8)}%` }} />
                          </div>
                        </div>
                        <strong className="dashboard-product-amount">{formatMoney(product.amount)}</strong>
                      </article>
                    );
                  })}
                </div>
              )}
            </article>
          </section>

          <section className="dashboard-lower-grid">
            <article className="card dashboard-orders-card">
              <div className="dashboard-card-head">
                <div>
                  <p className="dashboard-section-kicker">Commandes</p>
                  <h2>Commandes récentes</h2>
                </div>
                <span className="chip">Vue synthétique</span>
              </div>

              <div className="table-wrap dashboard-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Statut</th>
                      <th>Volume</th>
                      <th>Part</th>
                      <th>CA estimé</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusRows.map((row) => (
                      <tr key={row.key}>
                        <td>
                          <span className={`badge ${row.tone}`}>{row.label}</span>
                        </td>
                        <td>{formatNumber(row.value)}</td>
                        <td>{formatPercent(row.share)}</td>
                        <td>{formatMoney(row.estimatedSales)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <div className="dashboard-widget-column">
              <article className="card dashboard-widget-card">
                <div className="dashboard-card-head dashboard-widget-head">
                  <div>
                    <p className="dashboard-section-kicker">Clients</p>
                    <h3>Activité client</h3>
                  </div>
                </div>

                <div className="dashboard-widget-metric">
                  <strong>{formatNumber(totalCustomers)}</strong>
                  <span>Clients actifs</span>
                </div>
                <div className="dashboard-widget-metric">
                  <strong>{formatNumber(totalOrders > 0 ? totalOrders / Math.max(totalCustomers, 1) : 0)}</strong>
                  <span>Commandes par client</span>
                </div>
              </article>

              <article className="card dashboard-widget-card">
                <div className="dashboard-card-head dashboard-widget-head">
                  <div>
                    <p className="dashboard-section-kicker">Paiements</p>
                    <h3>Résumé financier</h3>
                  </div>
                </div>

                <div className="dashboard-widget-stack">
                  <div>
                    <span>CA total</span>
                    <strong>{formatMoney(totalSales)}</strong>
                  </div>
                  <div>
                    <span>Panier moyen</span>
                    <strong>{formatMoney(averageBasket)}</strong>
                  </div>
                  <div>
                    <span>Taux de livraison</span>
                    <strong>{formatPercent(deliveryRate)}</strong>
                  </div>
                </div>
              </article>

              <article className="card dashboard-widget-card dashboard-whatsapp-card">
                <div className="dashboard-card-head dashboard-widget-head">
                  <div>
                    <p className="dashboard-section-kicker">WhatsApp</p>
                    <h3>Action rapide</h3>
                  </div>
                </div>
                <p>Envoyez un suivi client ou confirmez une commande en un clic.</p>
                <Link href="/whatsapp" className="btn btn-primary dashboard-widget-action">
                  Préparer un message
                </Link>
              </article>

              <article className="card dashboard-widget-card">
                <div className="dashboard-card-head dashboard-widget-head">
                  <div>
                    <p className="dashboard-section-kicker">Stock faible</p>
                    <h3>Réassort à surveiller</h3>
                  </div>
                </div>

                {data.topProducts.length === 0 ? (
                  <p className="dashboard-empty-copy">Aucun produit à surveiller pour l’instant.</p>
                ) : (
                  <div className="dashboard-low-stock-list">
                    {data.topProducts.slice(0, 3).map((product) => (
                      <div key={product.productId} className="dashboard-low-stock-row">
                        <div>
                          <strong>{product.name}</strong>
                          <span>{formatNumber(product.quantity)} vendus sur la période</span>
                        </div>
                        <span className="badge warn">À vérifier</span>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

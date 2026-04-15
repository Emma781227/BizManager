"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatPrice, formatPriceCFA } from "@/lib/format";

type Customer = {
  id: string;
  fullName: string;
  phone: string;
};

type Product = {
  id: string;
  name: string;
  unitPrice: string | number;
};

type OrderItem = {
  id: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  product: { id: string; name: string };
};

type Order = {
  id: string;
  status:
    | "pending"
    | "new"
    | "confirmed"
    | "in_progress"
    | "ready"
    | "delivered"
    | "cancelled";
  paymentStatus: "unpaid" | "partial" | "paid" | "refunded";
  paymentMethod?: "cash" | "mobile_money" | "bank_transfer" | "cod" | null;
  totalAmount: string;
  paidAmount: string;
  createdAt: string;
  customer: { id: string; fullName: string; phone: string };
  items: OrderItem[];
};

type NewLine = {
  productId: string;
  quantity: number;
};

const orderStatuses = [
  "pending",
  "new",
  "confirmed",
  "in_progress",
  "ready",
  "delivered",
  "cancelled",
] as const;
const paymentStatuses = ["unpaid", "partial", "paid", "refunded"] as const;
const paymentMethods = ["cash", "mobile_money", "bank_transfer", "cod"] as const;

function statusLabel(status: Order["status"]) {
  if (status === "pending") return "En attente";
  if (status === "new") return "Nouvelle";
  if (status === "confirmed") return "Confirmee";
  if (status === "in_progress") return "En cours";
  if (status === "ready") return "Prete";
  if (status === "delivered") return "Livree";
  return "Annulee";
}

function paymentLabel(status: Order["paymentStatus"]) {
  if (status === "unpaid") return "Non paye";
  if (status === "partial") return "Partiel";
  if (status === "paid") return "Paye";
  return "Rembourse";
}

function paymentMethodLabel(method: NonNullable<Order["paymentMethod"]>) {
  if (method === "cash") return "Cash";
  if (method === "mobile_money") return "Mobile money";
  if (method === "bank_transfer") return "Virement";
  return "Paiement a la livraison";
}

export default function OrdersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState<NewLine[]>([{ productId: "", quantity: 1 }]);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [liveNotice, setLiveNotice] = useState<string | null>(null);
  const previousOrderCountRef = useRef<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [customersRes, productsRes, ordersRes] = await Promise.all([
        fetch("/api/customers", { cache: "no-store" }),
        fetch("/api/products", { cache: "no-store" }),
        fetch(
          `/api/orders${statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : ""}`,
          { cache: "no-store" },
        ),
      ]);

      if (!customersRes.ok || !productsRes.ok || !ordersRes.ok) {
        throw new Error("Impossible de charger les donnees.");
      }

      const customersJson = await customersRes.json();
      const productsJson = await productsRes.json();
      const ordersJson = await ordersRes.json();

      setCustomers(customersJson.data ?? []);
      setProducts(productsJson.data ?? []);
      const nextOrders: Order[] = ordersJson.data ?? [];
      setOrders(nextOrders);

      if (statusFilter === "") {
        const previousCount = previousOrderCountRef.current;
        if (previousCount !== null && nextOrders.length > previousCount) {
          const delta = nextOrders.length - previousCount;
          setLiveNotice(
            `${delta} nouvelle${delta > 1 ? "s" : ""} commande${delta > 1 ? "s" : ""} recue${delta > 1 ? "s" : "e"}.`,
          );
        }
        previousOrderCountRef.current = nextOrders.length;
      }
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : "Erreur de chargement.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (statusFilter !== "") {
      return;
    }

    const intervalId = window.setInterval(() => {
      void fetchData();
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [fetchData, statusFilter]);

  const totalPreview = useMemo(() => {
    return lines
      .reduce((sum, line) => {
        const product = products.find((item) => item.id === line.productId);
        if (!product) {
          return sum;
        }

        return sum + Number(product.unitPrice) * line.quantity;
      }, 0);
  }, [lines, products]);

  const deliveredCount = useMemo(
    () => orders.filter((order) => order.status === "delivered").length,
    [orders],
  );

  const pendingCount = useMemo(
    () => orders.filter((order) => order.status === "new" || order.status === "in_progress").length,
    [orders],
  );

  async function handleCreateOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setError(null);

    const cleanLines = lines.filter((line) => line.productId && line.quantity > 0);
    if (!customerId || cleanLines.length === 0) {
      setError("Selectionne un client et au moins une ligne produit.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, items: cleanLines }),
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json.error ?? "Creation de commande impossible.");
      }

      setCustomerId("");
      setLines([{ productId: "", quantity: 1 }]);
      setFeedback("Commande creee avec succes.");
      await fetchData();
    } catch (creationError) {
      const message =
        creationError instanceof Error
          ? creationError.message
          : "Creation de commande impossible.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function updateOrder(
    orderId: string,
    payload: {
      status?: Order["status"];
      paymentStatus?: Order["paymentStatus"];
      paymentMethod?: NonNullable<Order["paymentMethod"]>;
      paidAmount?: number;
    },
  ) {
    setFeedback(null);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json.error ?? "Mise a jour impossible.");
      }

      setFeedback("Commande mise a jour.");
      await fetchData();
    } catch (updateError) {
      const message =
        updateError instanceof Error ? updateError.message : "Mise a jour impossible.";
      setError(message);
    }
  }

  return (
    <main className="page-stack merchant-grid">
      <section className="card merchant-hero">
        <h1>Commandes</h1>
        <p>Cree et suis les commandes en un coup d&apos;oeil.</p>

        <div className="merchant-kpi">
          <article>
            <span>Commandes visibles</span>
            <strong>{orders.length}</strong>
          </article>
          <article>
            <span>Actives</span>
            <strong>{pendingCount}</strong>
          </article>
          <article>
            <span>Livrees</span>
            <strong>{deliveredCount}</strong>
          </article>
          <article>
            <span>Total courant</span>
            <strong>{formatPriceCFA(totalPreview)}</strong>
          </article>
        </div>
      </section>

      <section className="card merchant-surface">
        {liveNotice ? <p className="feedback success">{liveNotice}</p> : null}

        <form className="form-grid" onSubmit={handleCreateOrder}>
          <label>
            Client
            <select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
              <option value="">Selectionner un client</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.fullName} - {customer.phone}
                </option>
              ))}
            </select>
          </label>

          <div className="full-width line-items">
            {lines.map((line, index) => (
              <div className="line-row" key={`${index}-${line.productId || "new"}`}>
                <label>
                  Produit
                  <select
                    value={line.productId}
                    onChange={(event) => {
                      const next = [...lines];
                      next[index] = {
                        ...next[index],
                        productId: event.target.value,
                      };
                      setLines(next);
                    }}
                  >
                    <option value="">Selectionner un produit</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {formatPrice(product.unitPrice, 2)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Quantite
                  <input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(event) => {
                      const value = Number(event.target.value) || 1;
                      const next = [...lines];
                      next[index] = { ...next[index], quantity: value };
                      setLines(next);
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setLines((current) => current.filter((_, currentIndex) => currentIndex !== index));
                  }}
                  disabled={lines.length === 1}
                >
                  Retirer
                </button>
              </div>
            ))}

            <div className="line-actions">
              <button
                type="button"
                onClick={() => {
                  setLines((current) => [...current, { productId: "", quantity: 1 }]);
                }}
              >
                Ajouter une ligne
              </button>
              <span className="muted">Total estime: {formatPriceCFA(totalPreview)}</span>
            </div>
          </div>

          <div className="full-width">
            <button type="submit" disabled={submitting}>
              {submitting ? "Creation..." : "Creer la commande"}
            </button>
          </div>
        </form>

        {feedback ? <p className="feedback success">{feedback}</p> : null}
        {error ? <p className="feedback error">{error}</p> : null}
      </section>

      <section className="card merchant-surface">
        <div className="section-head">
          <h2>Suivi des commandes</h2>
          <div className="segmented" role="tablist" aria-label="Filtre de statut">
            <button
              type="button"
              className={statusFilter === "" ? "active" : ""}
              onClick={() => setStatusFilter("")}
            >
              Toutes
            </button>
            <button
              type="button"
              className={statusFilter === "new" ? "active" : ""}
              onClick={() => setStatusFilter("new")}
            >
              Nouvelles
            </button>
            <button
              type="button"
              className={statusFilter === "in_progress" ? "active" : ""}
              onClick={() => setStatusFilter("in_progress")}
            >
              En cours
            </button>
            <button
              type="button"
              className={statusFilter === "delivered" ? "active" : ""}
              onClick={() => setStatusFilter("delivered")}
            >
              Livrees
            </button>
          </div>
        </div>

        {loading ? <p className="muted">Chargement des commandes...</p> : null}

        {!loading && orders.length === 0 ? (
          <p className="muted">Aucune commande pour le moment.</p>
        ) : null}

        {!loading && orders.length > 0 ? (
          <div className="list-cards">
            {orders.map((order) => {
              const initials = order.customer.fullName
                .split(" ")
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase() ?? "")
                .join("");

              return (
                <article key={order.id} className="order-card">
                  <div className="order-card-head">
                    <div className="order-card-meta">
                      <span className="avatar">{initials || "C"}</span>
                      <div className="list-main">
                        <strong>{order.customer.fullName}</strong>
                        <span className="order-id">ID: {order.id}</span>
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <strong className="price">{formatPriceCFA(order.totalAmount)}</strong>
                  </div>

                  <div className="status-chips">
                    <span>{statusLabel(order.status)}</span>
                    <span>{paymentLabel(order.paymentStatus)}</span>
                    <span>
                      {order.paymentMethod
                        ? paymentMethodLabel(order.paymentMethod)
                        : "Mode non defini"}
                    </span>
                    <span>Articles: {order.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                  </div>

                  <div className="order-controls">
                    <select
                      value={order.status}
                      onChange={(event) => {
                        void updateOrder(order.id, {
                          status: event.target.value as Order["status"],
                        });
                      }}
                    >
                      {orderStatuses.map((status) => (
                        <option key={status} value={status}>
                          {statusLabel(status)}
                        </option>
                      ))}
                    </select>

                    <select
                      value={order.paymentStatus}
                      onChange={(event) => {
                        const paymentStatus = event.target.value as Order["paymentStatus"];
                        const nextPaidAmount =
                          paymentStatus === "paid"
                            ? Number(order.totalAmount)
                            : paymentStatus === "unpaid"
                              ? 0
                              : Number(order.paidAmount);

                        void updateOrder(order.id, {
                          paymentStatus,
                          paidAmount: nextPaidAmount,
                        });
                      }}
                    >
                      {paymentStatuses.map((status) => (
                        <option key={status} value={status}>
                          {paymentLabel(status)}
                        </option>
                      ))}
                    </select>

                    <select
                      value={order.paymentMethod ?? "cod"}
                      onChange={(event) => {
                        void updateOrder(order.id, {
                          paymentMethod: event.target.value as NonNullable<Order["paymentMethod"]>,
                        });
                      }}
                    >
                      {paymentMethods.map((method) => (
                        <option key={method} value={method}>
                          {paymentMethodLabel(method)}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      defaultValue={Number(order.paidAmount).toFixed(2)}
                      onBlur={(event) => {
                        const value = Number(event.target.value);
                        if (Number.isNaN(value)) {
                          return;
                        }
                        void updateOrder(order.id, { paidAmount: value });
                      }}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
    </main>
  );
}

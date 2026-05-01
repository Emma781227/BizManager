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

type FormData = { customerId: string; lines: NewLine[] };
type UIMessages = { feedback: string | null; error: string | null; liveNotice: string | null };
type UIState = { loading: boolean; submitting: boolean };

export default function OrdersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [form, setForm] = useState<FormData>({ customerId: "", lines: [{ productId: "", quantity: 1 }] });
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [uiState, setUIState] = useState<UIState>({ loading: true, submitting: false });
  const [messages, setMessages] = useState<UIMessages>({ feedback: null, error: null, liveNotice: null });
  const previousOrderCountRef = useRef<number | null>(null);

  const fetchData = useCallback(async () => {
    setUIState(prev => ({ ...prev, loading: true }));
    setMessages(prev => ({ ...prev, error: null }));

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
          setMessages(prev => ({
            ...prev,
            liveNotice: `${delta} nouvelle${delta > 1 ? "s" : ""} commande${delta > 1 ? "s" : ""} recue${delta > 1 ? "s" : "e"}.`,
          }));
        }
        previousOrderCountRef.current = nextOrders.length;
      }
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : "Erreur de chargement.";
      setMessages(prev => ({ ...prev, error: message }));
    } finally {
      setUIState(prev => ({ ...prev, loading: false }));
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
    return form.lines
      .reduce((sum, line) => {
        const product = products.find((item) => item.id === line.productId);
        if (!product) {
          return sum;
        }

        return sum + Number(product.unitPrice) * line.quantity;
      }, 0);
  }, [form.lines, products]);

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
    setMessages(prev => ({ ...prev, feedback: null, error: null }));

    const cleanLines = form.lines.filter((line) => line.productId && line.quantity > 0);
    if (!form.customerId || cleanLines.length === 0) {
      setMessages(prev => ({ ...prev, error: "Selectionne un client et au moins une ligne produit." }));
      return;
    }

    setUIState(prev => ({ ...prev, submitting: true }));

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: form.customerId, items: cleanLines }),
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json.error ?? "Creation de commande impossible.");
      }

      setForm({ customerId: "", lines: [{ productId: "", quantity: 1 }] });
      setMessages(prev => ({ ...prev, feedback: "Commande creee avec succes." }));
      await fetchData();
    } catch (creationError) {
      const message =
        creationError instanceof Error
          ? creationError.message
          : "Creation de commande impossible.";
      setMessages(prev => ({ ...prev, error: message }));
    } finally {
      setUIState(prev => ({ ...prev, submitting: false }));
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
    setMessages(prev => ({ ...prev, feedback: null, error: null }));

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

      setMessages(prev => ({ ...prev, feedback: "Commande mise a jour." }));
      await fetchData();
    } catch (updateError) {
      const message =
        updateError instanceof Error ? updateError.message : "Mise a jour impossible.";
      setMessages(prev => ({ ...prev, error: message }));
    }
  }

  return (
    <main className="grid gap-2.5 p-3 sm:gap-3.5 sm:p-4 lg:gap-4 lg:p-5">
      <section className="rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_8%_16%,rgba(34,136,102,0.09)_0%,transparent_46%),linear-gradient(145deg,#ffffff_0%,#f8fbf9_100%)] p-4 sm:p-5">
        <h1 className="mb-2 text-2xl font-bold leading-tight text-slate-900 sm:text-2.5xl">Commandes</h1>
        <p className="mb-4 max-w-2xl text-sm text-slate-600 sm:text-base">Cree et suis les commandes en un coup d&apos;oeil.</p>

        <div className="mt-3 grid gap-2 grid-cols-2 sm:gap-2.5 lg:grid-cols-4">
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
            <span className="block text-xs font-semibold text-slate-600 sm:text-sm">Commandes visibles</span>
            <strong className="text-base font-bold text-slate-900 sm:text-lg">{orders.length}</strong>
          </article>
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
            <span className="block text-xs font-semibold text-slate-600 sm:text-sm">Actives</span>
            <strong className="text-base font-bold text-slate-900 sm:text-lg">{pendingCount}</strong>
          </article>
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
            <span className="block text-xs font-semibold text-slate-600 sm:text-sm">Livrees</span>
            <strong className="text-base font-bold text-slate-900 sm:text-lg">{deliveredCount}</strong>
          </article>
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
            <span className="block text-xs font-semibold text-slate-600 sm:text-sm">Total courant</span>
            <strong className="text-base font-bold text-slate-900 sm:text-lg">{formatPriceCFA(totalPreview)}</strong>
          </article>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 sm:p-5">
        {messages.liveNotice ? <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 sm:py-2.5 sm:text-base">{messages.liveNotice}</p> : null}

        <form className="mt-3 grid gap-2 grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] lg:grid-cols-[repeat(auto-fit,minmax(250px,1fr))] lg:gap-3" onSubmit={handleCreateOrder}>
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-slate-700 sm:text-sm">Client</span>
            <select value={form.customerId} onChange={(event) => setForm(prev => ({ ...prev, customerId: event.target.value }))} className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 sm:px-3 sm:py-2.5 sm:text-base">
              <option value="">Selectionner un client</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.fullName} - {customer.phone}
                </option>
              ))}
            </select>
          </label>

          <div className="col-span-full grid gap-2 sm:gap-2.5">
            {form.lines.map((line, index) => (
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-[minmax(180px,2fr)_minmax(100px,1fr)_auto] items-end sm:gap-2.5" key={`${index}-${line.productId || "new"}`}>
                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-slate-700 sm:text-sm">Produit</span>
                  <select
                    value={line.productId}
                    onChange={(event) => {
                      setForm(prev => {
                        const next = [...prev.lines];
                        next[index] = {
                          ...next[index],
                          productId: event.target.value,
                        };
                        return { ...prev, lines: next };
                      });
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 sm:px-3 sm:py-2.5 sm:text-base"
                  >
                    <option value="">Selectionner un produit</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {formatPrice(product.unitPrice, 2)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-slate-700 sm:text-sm">Quantite</span>
                  <input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(event) => {
                      const value = Number(event.target.value) || 1;
                      setForm(prev => {
                        const next = [...prev.lines];
                        next[index] = { ...next[index], quantity: value };
                        return { ...prev, lines: next };
                      });
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 sm:px-3 sm:py-2.5 sm:text-base"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setForm(prev => ({ ...prev, lines: prev.lines.filter((_, currentIndex) => currentIndex !== index) }));
                  }}
                  disabled={form.lines.length === 1}
                  className="rounded-lg border border-slate-300 bg-slate-100 px-2.5 py-2 text-xs font-semibold text-slate-900 transition-colors hover:bg-slate-200 disabled:opacity-50 sm:px-3 sm:py-2.5 sm:text-sm"
                >
                  Retirer
                </button>
              </div>
            ))}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setForm(prev => ({ ...prev, lines: [...prev.lines, { productId: "", quantity: 1 }] }));
                }}
                className="rounded-lg border border-slate-300 bg-slate-100 px-2.5 py-2 text-xs font-semibold text-slate-900 transition-colors hover:bg-slate-200 sm:px-3 sm:py-2.5 sm:text-sm"
              >
                Ajouter une ligne
              </button>
              <span className="text-xs text-slate-600 sm:text-sm">Total estime: {formatPriceCFA(totalPreview)}</span>
            </div>
          </div>

          <div className="col-span-full">
            <button type="submit" disabled={uiState.submitting} className="w-full rounded-lg border border-emerald-600 bg-gradient-to-b from-emerald-600 to-emerald-700 px-3 py-2 font-bold text-white transition-colors hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-65 sm:w-auto sm:px-4 sm:py-2.5">
              {uiState.submitting ? "Creation..." : "Creer la commande"}
            </button>
          </div>
        </form>

        {messages.feedback ? <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 sm:py-2.5 sm:text-base">{messages.feedback}</p> : null}
        {messages.error ? <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 sm:py-2.5 sm:text-base">{messages.error}</p> : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Suivi des commandes</h2>
          <div className="inline-flex gap-0 border border-slate-300 rounded-lg overflow-hidden bg-slate-50" role="tablist" aria-label="Filtre de statut">
            <button
              type="button"
              className={`border-r border-slate-300 bg-slate-50 px-2 py-1.5 text-xs font-semibold transition-colors sm:px-3 sm:py-2 sm:text-sm ${statusFilter === "" ? "bg-emerald-50 text-emerald-700 border-slate-300" : "text-slate-700 hover:bg-slate-100"}`}
              onClick={() => setStatusFilter("")}
            >
              Toutes
            </button>
            <button
              type="button"
              className={`border-r border-slate-300 bg-slate-50 px-2 py-1.5 text-xs font-semibold transition-colors sm:px-3 sm:py-2 sm:text-sm ${statusFilter === "new" ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-100"}`}
              onClick={() => setStatusFilter("new")}
            >
              Nouvelles
            </button>
            <button
              type="button"
              className={`border-r border-slate-300 bg-slate-50 px-2 py-1.5 text-xs font-semibold transition-colors sm:px-3 sm:py-2 sm:text-sm ${statusFilter === "in_progress" ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-100"}`}
              onClick={() => setStatusFilter("in_progress")}
            >
              En cours
            </button>
            <button
              type="button"
              className={`bg-slate-50 px-2 py-1.5 text-xs font-semibold transition-colors sm:px-3 sm:py-2 sm:text-sm ${statusFilter === "delivered" ? "bg-emerald-50 text-emerald-700 border-slate-300" : "text-slate-700 hover:bg-slate-100"}`}
              onClick={() => setStatusFilter("delivered")}
            >
              Livrees
            </button>
          </div>
        </div>

        {uiState.loading ? <p className="py-4 text-center text-sm text-slate-600">Chargement des commandes...</p> : null}

        {!uiState.loading && orders.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-600">Aucune commande pour le moment.</p>
        ) : null}

        {!uiState.loading && orders.length > 0 ? (
          <div className="grid gap-2 grid-cols-1 sm:gap-2.5 lg:grid-cols-2">
            {orders.map((order) => {
              const initials = order.customer.fullName
                .split(" ")
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase() ?? "")
                .join("");

              return (
                <article key={order.id} className="rounded-lg border border-slate-200 BG-white p-3 grid gap-2 sm:gap-3 sm:p-3.5">
                  <div className="flex flex-wrap justify-between gap-3 items-start">
                    <div className="flex gap-2 items-start">
                      <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-gradient-to-b from-emerald-500 to-emerald-600 font-semibold text-xs text-white sm:h-10 sm:w-10 sm:text-sm">{initials || "C"}</span>
                      <div className="grid gap-px">
                        <strong className="text-xs text-slate-900 sm:text-sm">{order.customer.fullName}</strong>
                        <span className="inline-block rounded-md border border-emerald-100 bg-emerald-50 px-1.5 py-0.5 font-mono text-xs text-emerald-700 sm:px-2">ID: {order.id}</span>
                        <span className="text-xs text-slate-600 sm:text-sm">{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <strong className="font-mono text-xs text-slate-900 sm:text-sm">{formatPriceCFA(order.totalAmount)}</strong>
                  </div>

                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    <span className="inline-block rounded-full border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-700">{statusLabel(order.status)}</span>
                    <span className="inline-block rounded-full border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-700">{paymentLabel(order.paymentStatus)}</span>
                    <span className="inline-block rounded-full border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-700">
                      {order.paymentMethod
                        ? paymentMethodLabel(order.paymentMethod)
                        : "Mode non defini"}
                    </span>
                    <span className="inline-block rounded-full border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-700">Articles: {order.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                  </div>

                  <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                    <select
                      value={order.status}
                      onChange={(event) => {
                        void updateOrder(order.id, {
                          status: event.target.value as Order["status"],
                        });
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 sm:px-2.5 sm:py-2 sm:text-sm"
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
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 sm:px-2.5 sm:py-2 sm:text-sm"
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
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 sm:px-2.5 sm:py-2 sm:text-sm"
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
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 sm:px-2.5 sm:py-2 sm:text-sm"
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

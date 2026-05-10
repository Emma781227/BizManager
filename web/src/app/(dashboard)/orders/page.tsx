"use client";

import { useEffect, useMemo, useState } from "react";

type OrderStatus = "new" | "pending" | "confirmed" | "in_progress" | "ready" | "delivered" | "cancelled";
type PaymentStatus = "unpaid" | "partial" | "paid" | "refunded";
type PaymentMethod = "cash" | "mobile_money" | "bank_transfer" | "cod";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  product: { id: string; name: string };
}

interface Order {
  id: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  totalAmount: string;
  paidAmount: string;
  createdAt: string;
  updatedAt: string;
  customer: { id: string; fullName: string; phone: string };
  items: OrderItem[];
}

interface KpiData {
  ordersCount: number;
  sales: number;
  statusCounts: Record<string, number>;
}

interface Customer {
  id: string;
  fullName: string;
  phone: string;
}

interface Product {
  id: string;
  name: string;
  unitPrice: string;
  stock: number;
}

interface NewOrderItem {
  productId: string;
  quantity: number;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Nouveau",
  pending: "En attente",
  confirmed: "Confirmé",
  in_progress: "En cours",
  ready: "Prêt",
  delivered: "Livré",
  cancelled: "Annulé",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-indigo-50 text-indigo-700 border-indigo-200",
  in_progress: "bg-orange-50 text-orange-700 border-orange-200",
  ready: "bg-teal-50 text-teal-700 border-teal-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};

const PAY_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Non payé",
  partial: "Partiel",
  paid: "Payé",
  refunded: "Remboursé",
};

const PAY_STATUS_COLORS: Record<PaymentStatus, string> = {
  unpaid: "bg-rose-50 text-rose-700 border-rose-200",
  partial: "bg-amber-50 text-amber-700 border-amber-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  refunded: "bg-purple-50 text-purple-700 border-purple-200",
};

const PAY_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Espèces",
  mobile_money: "Mobile Money",
  bank_transfer: "Virement",
  cod: "À la livraison",
};

const ALL_STATUSES: OrderStatus[] = [
  "new", "pending", "confirmed", "in_progress", "ready", "delivered", "cancelled",
];

const PAGE_SIZE = 10;

function formatAmount(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0 FCFA";
  return num.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " FCFA";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function shortId(id: string): string {
  return "CMD-" + id.slice(-6).toUpperCase();
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [kpi, setKpi] = useState<KpiData>({ ordersCount: 0, sales: 0, statusCounts: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingStatus, setEditingStatus] = useState<OrderStatus>("new");
  const [editingPayStatus, setEditingPayStatus] = useState<PaymentStatus>("unpaid");
  const [editingPayMethod, setEditingPayMethod] = useState<PaymentMethod | "">("");
  const [patchLoading, setPatchLoading] = useState(false);
  const [patchError, setPatchError] = useState<string | null>(null);

  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [newCustomerId, setNewCustomerId] = useState("");
  const [newItems, setNewItems] = useState<NewOrderItem[]>([{ productId: "", quantity: 1 }]);
  const [newPayMethod, setNewPayMethod] = useState<PaymentMethod | "">("");
  const [newOrderLoading, setNewOrderLoading] = useState(false);
  const [newOrderError, setNewOrderError] = useState<string | null>(null);

  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchText]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [ordersRes, dashRes] = await Promise.all([
        fetch("/api/orders", { cache: "no-store" }),
        fetch("/api/dashboard", { cache: "no-store" }),
      ]);
      const ordersJson = (await ordersRes.json()) as { data?: Order[]; error?: string };
      const dashJson = (await dashRes.json()) as KpiData & { error?: string };
      if (!ordersRes.ok) throw new Error(ordersJson.error ?? "Erreur de chargement");
      setOrders(ordersJson.data ?? []);
      setKpi({
        ordersCount: dashJson.ordersCount ?? 0,
        sales: dashJson.sales ?? 0,
        statusCounts: dashJson.statusCounts ?? {},
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  async function refreshKpi() {
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      const json = (await res.json()) as KpiData;
      if (res.ok) {
        setKpi({
          ordersCount: json.ordersCount ?? 0,
          sales: json.sales ?? 0,
          statusCounts: json.statusCounts ?? {},
        });
      }
    } catch {
      // silent
    }
  }

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter(
        (o) =>
          o.customer.fullName.toLowerCase().includes(q) ||
          shortId(o.id).toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q),
      );
    }
    return result;
  }, [orders, statusFilter, searchText]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const pendingCount = (kpi.statusCounts.pending ?? 0) + (kpi.statusCounts.new ?? 0);
  const deliveredCount = kpi.statusCounts.delivered ?? 0;

  function openOrderDetail(order: Order) {
    setSelectedOrder(order);
    setEditingStatus(order.status);
    setEditingPayStatus(order.paymentStatus);
    setEditingPayMethod(order.paymentMethod ?? "");
    setPatchError(null);
  }

  async function saveOrderUpdate() {
    if (!selectedOrder) return;
    const update: Record<string, unknown> = {};
    if (editingStatus !== selectedOrder.status) update.status = editingStatus;
    if (editingPayStatus !== selectedOrder.paymentStatus) update.paymentStatus = editingPayStatus;
    if (editingPayMethod && editingPayMethod !== (selectedOrder.paymentMethod ?? "")) {
      update.paymentMethod = editingPayMethod;
    }
    if (Object.keys(update).length === 0) {
      setSelectedOrder(null);
      return;
    }
    setPatchLoading(true);
    setPatchError(null);
    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      const json = (await res.json()) as { data?: Order; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Erreur de mise à jour");
      const updated = json.data!;
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setSelectedOrder(null);
      showSuccess("Commande mise à jour");
      void refreshKpi();
    } catch (err) {
      setPatchError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setPatchLoading(false);
    }
  }

  async function openNewOrder() {
    setNewOrderOpen(true);
    setNewCustomerId("");
    setNewItems([{ productId: "", quantity: 1 }]);
    setNewPayMethod("");
    setNewOrderError(null);
    try {
      const [custRes, prodRes] = await Promise.all([
        fetch("/api/customers", { cache: "no-store" }),
        fetch("/api/products", { cache: "no-store" }),
      ]);
      const custJson = (await custRes.json()) as { data?: Customer[] };
      const prodJson = (await prodRes.json()) as { data?: Product[] };
      setCustomers(custJson.data ?? []);
      setProducts(prodJson.data ?? []);
    } catch {
      setNewOrderError("Impossible de charger les données");
    }
  }

  async function submitNewOrder() {
    if (!newCustomerId) { setNewOrderError("Veuillez sélectionner un client"); return; }
    const validItems = newItems.filter((i) => i.productId && i.quantity > 0);
    if (validItems.length === 0) { setNewOrderError("Veuillez ajouter au moins un produit"); return; }
    setNewOrderLoading(true);
    setNewOrderError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: newCustomerId,
          items: validItems,
          paymentMethod: newPayMethod || undefined,
        }),
      });
      const json = (await res.json()) as { data?: Order; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Erreur de création");
      setOrders((prev) => [json.data!, ...prev]);
      setNewOrderOpen(false);
      showSuccess("Commande créée avec succès");
      void refreshKpi();
    } catch (err) {
      setNewOrderError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setNewOrderLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="mt-3 text-sm text-slate-500">Chargement des commandes…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <header className="sticky top-0 z-40 h-16 border-b border-slate-200 bg-white px-4 sm:px-6">
        <div className="flex h-full items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher une commande, un client…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="relative inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-slate-100">
              <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-full px-2.5 py-1.5 transition hover:bg-slate-100"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">MA</div>
                <svg className={`h-4 w-4 text-slate-500 transition ${profileOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {profileOpen && (
                <div className="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                  <a href="#profile" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Mon profil</a>
                  <a href="/settings" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Paramètres</a>
                  <form action="/api/auth/logout" method="post">
                    <button type="submit" className="w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-slate-50">Déconnexion</button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* PAGE TITLE */}
      <section className="border-b border-slate-200 bg-white px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">Mes commandes</h1>
            <p className="mt-0.5 text-sm text-slate-500">Gérez et suivez toutes vos commandes en temps réel</p>
          </div>
          <button
            type="button"
            onClick={() => void openNewOrder()}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle commande
          </button>
        </div>
      </section>

      <div className="px-4 sm:px-6">
        {successMsg && (
          <div className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            ✓ {successMsg}
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}
      </div>

      {/* KPI CARDS */}
      <section className="px-4 py-5 sm:px-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-slate-500">Total commandes</p>
                <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950">{kpi.ordersCount}</p>
                <p className="mt-1 text-xs text-slate-400">30 derniers jours</p>
              </div>
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </span>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-slate-500">En attente</p>
                <p className="mt-1 text-3xl font-extrabold tracking-tight text-amber-600">{pendingCount}</p>
                <p className="mt-1 text-xs text-slate-400">À traiter</p>
              </div>
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-slate-500">Livrées</p>
                <p className="mt-1 text-3xl font-extrabold tracking-tight text-emerald-700">{deliveredCount}</p>
                <p className="mt-1 text-xs text-slate-400">Complétées</p>
              </div>
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-slate-500">Chiffre d&apos;affaires</p>
                <p className="mt-1 text-xl font-extrabold tracking-tight text-slate-950 leading-tight">{formatAmount(kpi.sales)}</p>
                <p className="mt-1 text-xs text-slate-400">30 derniers jours</p>
              </div>
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </div>
          </article>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="px-4 pb-8 sm:px-6">
        <div className="flex items-start gap-5">
          {/* TABLE COLUMN */}
          <div className="min-w-0 flex-1 space-y-4">
            {/* Filters */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex flex-wrap gap-1.5">
                {[
                  { key: "all", label: "Tous", count: orders.length },
                  { key: "new", label: "Nouveau", count: kpi.statusCounts.new ?? 0 },
                  { key: "pending", label: "En attente", count: kpi.statusCounts.pending ?? 0 },
                  { key: "confirmed", label: "Confirmé", count: kpi.statusCounts.confirmed ?? 0 },
                  { key: "in_progress", label: "En cours", count: kpi.statusCounts.in_progress ?? 0 },
                  { key: "ready", label: "Prêt", count: kpi.statusCounts.ready ?? 0 },
                  { key: "delivered", label: "Livré", count: kpi.statusCounts.delivered ?? 0 },
                  { key: "cancelled", label: "Annulé", count: kpi.statusCounts.cancelled ?? 0 },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setStatusFilter(tab.key)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      statusFilter === tab.key
                        ? "border-emerald-500 bg-emerald-600 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {tab.label}
                    <span className={`inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                      statusFilter === tab.key ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative min-w-48 flex-1">
                  <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Chercher par client, N° commande…"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void loadData()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Actualiser
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">N° Commande</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Client</th>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Produits</th>
                      <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Montant</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Paiement</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Mode</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedOrders.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-14 text-center">
                          <div className="mx-auto max-w-xs">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                              <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                            </div>
                            <p className="text-sm font-semibold text-slate-700">Aucune commande</p>
                            <p className="mt-1 text-xs text-slate-400">
                              {statusFilter !== "all" ? "Aucune commande avec ce statut" : "Vos commandes apparaîtront ici"}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedOrders.map((order) => (
                        <tr key={order.id} className="transition hover:bg-slate-50/60">
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs font-semibold text-slate-700">{shortId(order.id)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-slate-800">{order.customer.fullName}</p>
                            <p className="text-xs text-slate-400">{order.customer.phone}</p>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <span className="text-xs text-slate-600">{formatDate(order.createdAt)}</span>
                          </td>
                          <td className="px-4 py-3 max-w-[160px]">
                            <span className="block truncate text-xs text-slate-600">
                              {order.items.length === 0
                                ? "—"
                                : order.items.length === 1
                                  ? order.items[0].product.name
                                  : `${order.items[0].product.name} +${order.items.length - 1}`}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right">
                            <span className="text-sm font-semibold text-slate-900">{formatAmount(order.totalAmount)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STATUS_COLORS[order.status]}`}>
                              {STATUS_LABELS[order.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${PAY_STATUS_COLORS[order.paymentStatus]}`}>
                              {PAY_STATUS_LABELS[order.paymentStatus]}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-500">
                              {order.paymentMethod ? PAY_METHOD_LABELS[order.paymentMethod] : "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => openOrderDetail(order)}
                              className="inline-flex h-7 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
                            >
                              Modifier
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                  <p className="text-xs text-slate-500">
                    {filteredOrders.length} commande{filteredOrders.length !== 1 ? "s" : ""} · Page {currentPage}/{totalPages}
                  </p>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-semibold transition ${
                          currentPage === page
                            ? "border-emerald-500 bg-emerald-600 text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="hidden w-72 shrink-0 space-y-4 lg:block">
            {/* Status breakdown */}
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Statuts des commandes</h3>
              <div className="space-y-2.5">
                {ALL_STATUSES.map((status) => {
                  const count = kpi.statusCounts[status] ?? 0;
                  const total = Math.max(kpi.ordersCount, 1);
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={status}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STATUS_COLORS[status]}`}>
                          {STATUS_LABELS[status]}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">{count}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>

            {/* Recent orders */}
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Commandes récentes</h3>
              <div className="space-y-2">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700">
                      {order.customer.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-800">{order.customer.fullName}</p>
                      <p className="text-[11px] text-slate-400">{formatAmount(order.totalAmount)}</p>
                    </div>
                    <span className={`shrink-0 inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>
                ))}
                {orders.length === 0 && (
                  <p className="py-4 text-center text-xs text-slate-400">Aucune commande</p>
                )}
              </div>
            </article>

            {/* Sales channels */}
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Canaux de vente</h3>
              <div className="space-y-3">
                {[
                  { label: "WhatsApp", pct: 78, color: "bg-emerald-500" },
                  { label: "Boutique web", pct: 22, color: "bg-blue-400" },
                ].map((ch) => (
                  <div key={ch.label}>
                    <div className="mb-1 flex justify-between">
                      <span className="text-xs font-medium text-slate-600">{ch.label}</span>
                      <span className="text-xs font-semibold text-slate-800">{ch.pct}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${ch.color}`} style={{ width: `${ch.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* BOTTOM BANNER */}
      <section className="px-4 pb-8 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <article className="flex items-start gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-emerald-900">Activez les notifications WhatsApp</h4>
              <p className="mt-1 text-xs leading-5 text-emerald-700">Recevez une alerte instantanée à chaque nouvelle commande. Ne manquez plus aucune vente.</p>
              <a href="/whatsapp" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 underline underline-offset-2 hover:text-emerald-800">
                Configurer maintenant →
              </a>
            </div>
          </article>
          <article className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Besoin d&apos;aide ?</h4>
              <p className="mt-1 text-xs leading-5 text-slate-500">Consultez notre guide pour gérer efficacement vos commandes et améliorer votre service client.</p>
              <button type="button" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 underline underline-offset-2 hover:text-emerald-800">
                Voir le guide →
              </button>
            </div>
          </article>
        </div>
      </section>

      {/* ORDER DETAIL MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="relative mx-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Détail commande</h2>
                <p className="text-xs text-slate-500">{shortId(selectedOrder.id)} · {formatDate(selectedOrder.createdAt)}</p>
              </div>
              <button type="button" onClick={() => setSelectedOrder(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Client</p>
                <p className="font-semibold text-slate-800">{selectedOrder.customer.fullName}</p>
                <p className="text-xs text-slate-500">{selectedOrder.customer.phone}</p>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Produits</p>
                <div className="space-y-1.5">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{item.product.name}</p>
                        <p className="text-[11px] text-slate-400">Qté : {item.quantity} × {formatAmount(item.unitPrice)}</p>
                      </div>
                      <span className="text-xs font-bold text-slate-900">{formatAmount(item.lineTotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-between rounded-lg bg-emerald-50 px-3 py-2">
                  <span className="text-sm font-semibold text-emerald-800">Total</span>
                  <span className="text-sm font-bold text-emerald-900">{formatAmount(selectedOrder.totalAmount)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Statut commande</label>
                  <select
                    value={editingStatus}
                    onChange={(e) => setEditingStatus(e.target.value as OrderStatus)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Statut paiement</label>
                  <select
                    value={editingPayStatus}
                    onChange={(e) => setEditingPayStatus(e.target.value as PaymentStatus)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                  >
                    {(["unpaid", "partial", "paid", "refunded"] as const).map((ps) => (
                      <option key={ps} value={ps}>{PAY_STATUS_LABELS[ps]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Mode de paiement</label>
                <select
                  value={editingPayMethod}
                  onChange={(e) => setEditingPayMethod(e.target.value as PaymentMethod | "")}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                >
                  <option value="">— Sélectionner —</option>
                  {(["cash", "mobile_money", "bank_transfer", "cod"] as const).map((pm) => (
                    <option key={pm} value={pm}>{PAY_METHOD_LABELS[pm]}</option>
                  ))}
                </select>
              </div>

              {patchError && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{patchError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={patchLoading}
                  onClick={() => void saveOrderUpdate()}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-70"
                >
                  {patchLoading ? "Sauvegarde…" : "Enregistrer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW ORDER MODAL */}
      {newOrderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="relative mx-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-950">Nouvelle commande</h2>
              <button type="button" onClick={() => setNewOrderOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Client</label>
                <select
                  value={newCustomerId}
                  onChange={(e) => setNewCustomerId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                >
                  <option value="">— Sélectionner un client —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.fullName} ({c.phone})</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">Produits</label>
                  <button
                    type="button"
                    onClick={() => setNewItems((prev) => [...prev, { productId: "", quantity: 1 }])}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    + Ajouter un produit
                  </button>
                </div>
                <div className="space-y-2">
                  {newItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                      <select
                        value={item.productId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewItems((prev) => prev.map((it, i) => i === idx ? { ...it, productId: val } : it));
                        }}
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                      >
                        <option value="">— Produit —</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} · {formatAmount(p.unitPrice)}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => {
                          const val = Math.max(1, parseInt(e.target.value) || 1);
                          setNewItems((prev) => prev.map((it, i) => i === idx ? { ...it, quantity: val } : it));
                        }}
                        className="w-20 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                      />
                      {newItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setNewItems((prev) => prev.filter((_, i) => i !== idx))}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Mode de paiement <span className="font-normal text-slate-400">(optionnel)</span></label>
                <select
                  value={newPayMethod}
                  onChange={(e) => setNewPayMethod(e.target.value as PaymentMethod | "")}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                >
                  <option value="">— Sélectionner —</option>
                  {(["cash", "mobile_money", "bank_transfer", "cod"] as const).map((pm) => (
                    <option key={pm} value={pm}>{PAY_METHOD_LABELS[pm]}</option>
                  ))}
                </select>
              </div>

              {newOrderError && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{newOrderError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setNewOrderOpen(false)}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={newOrderLoading}
                  onClick={() => void submitNewOrder()}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-70"
                >
                  {newOrderLoading ? "Création…" : "Créer la commande"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

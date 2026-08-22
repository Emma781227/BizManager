import {
  ArrowUpRight,
  Bell,
  LayoutDashboard,
  Package,
  Search,
  Settings,
  ShoppingBag,
  Users,
} from "lucide-react";
import { LogoMark } from "./Logo";
import { formatPriceCFA } from "@/lib/format";

/* ────────────────────────────────────────────────────────────────
   Aperçus produit composés en HTML/CSS réel, pas de fils de fer
   dessinés au <rect>. Le contenu est représentatif du vrai produit.
   ──────────────────────────────────────────────────────────────── */

const SIDEBAR = [
  { icon: LayoutDashboard, label: "Tableau de bord", active: true },
  { icon: Package, label: "Produits" },
  { icon: ShoppingBag, label: "Commandes" },
  { icon: Users, label: "Clients" },
  { icon: Settings, label: "Réglages" },
];

const KPIS = [
  { label: "Ventes du mois", value: formatPriceCFA(1_284_500), delta: "+18,2 %" },
  { label: "Commandes", value: "147", delta: "+9 cette semaine" },
  { label: "Panier moyen", value: formatPriceCFA(8_738), delta: "+4,1 %" },
];

const CHART = [
  { month: "Avr", value: 62 },
  { month: "Mai", value: 78 },
  { month: "Juin", value: 71 },
  { month: "Juil", value: 96 },
  { month: "Août", value: 88 },
  { month: "Sep", value: 124 },
];

const ORDERS: {
  ref: string;
  customer: string;
  total: number;
  status: "Payée" | "En cours" | "Livrée";
}[] = [
  { ref: "#1042", customer: "Awa Diallo", total: 24_000, status: "Payée" },
  { ref: "#1041", customer: "Kofi Tano", total: 8_500, status: "En cours" },
  { ref: "#1040", customer: "Fatou Mbaye", total: 46_750, status: "Livrée" },
  { ref: "#1039", customer: "Serge Nguema", total: 12_300, status: "Payée" },
];

const STATUS_STYLES: Record<string, string> = {
  "Payée": "bg-brand-50 text-brand-700 ring-brand-200",
  "En cours": "bg-warning-50 text-warning-700 ring-warning-100",
  "Livrée": "bg-info-50 text-info-700 ring-info-100",
};

export function DashboardPreview() {
  const max = Math.max(...CHART.map((d) => d.value));

  return (
    <div className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-lg">
      <div className="flex min-h-[22rem] text-[0.6875rem] leading-none">
        {/* Barre latérale */}
        <aside className="hidden w-[10.5rem] shrink-0 flex-col gap-1 bg-ink-900 p-3 sm:flex">
          <div className="mb-4 flex items-center gap-2 px-1">
            <LogoMark size={24} />
            <span className="text-[0.8125rem] font-semibold text-white">BizManager</span>
          </div>
          {SIDEBAR.map(({ icon: Icon, label, active }) => (
            <div
              key={label}
              className={`flex items-center gap-2 rounded-md px-2 py-2 font-medium ${
                active ? "bg-brand-600/25 text-brand-200" : "text-ink-400"
              }`}
            >
              <Icon size={13} strokeWidth={2} />
              <span>{label}</span>
            </div>
          ))}
        </aside>

        {/* Zone principale */}
        <div className="flex min-w-0 flex-1 flex-col bg-ink-50">
          {/* Barre supérieure */}
          <div className="flex items-center justify-between gap-3 border-b border-ink-200 bg-white px-4 py-2.5">
            <div className="flex items-center gap-1.5 rounded-md bg-ink-100 px-2 py-1.5 text-ink-400">
              <Search size={12} strokeWidth={2} />
              <span>Rechercher…</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Bell size={13} strokeWidth={2} className="text-ink-400" />
              <span className="flex size-6 items-center justify-center rounded-full bg-brand-100 text-[0.625rem] font-bold text-brand-700">
                AD
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 p-3">
            {/* Indicateurs */}
            <div className="grid grid-cols-3 gap-2.5">
              {KPIS.map((kpi) => (
                <div key={kpi.label} className="rounded-lg border border-ink-200 bg-white p-2.5">
                  <p className="truncate text-[0.625rem] font-medium text-ink-500">{kpi.label}</p>
                  <p className="mt-1.5 truncate text-[0.9375rem] font-bold tracking-tight text-ink-900">
                    {kpi.value}
                  </p>
                  <p className="mt-1 flex items-center gap-0.5 text-[0.625rem] font-semibold text-brand-600">
                    <ArrowUpRight size={10} strokeWidth={2.5} />
                    {kpi.delta}
                  </p>
                </div>
              ))}
            </div>

            {/* Graphique + commandes */}
            <div className="grid gap-2.5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
              <div className="rounded-lg border border-ink-200 bg-white p-3">
                <p className="text-[0.6875rem] font-semibold text-ink-900">Ventes mensuelles</p>
                {/* Les barres vivent dans une rangée de hauteur définie : une
                    hauteur en % a besoin d'un parent mesurable pour se résoudre.
                    Les libellés sont dans une rangée séparée en dessous. */}
                <div className="mt-3">
                  <div className="flex h-[4.75rem] items-end gap-2">
                    {CHART.map((d, i) => (
                      <div
                        key={d.month}
                        className={`min-h-[2px] flex-1 rounded-t-[3px] ${
                          i === CHART.length - 1 ? "bg-brand-600" : "bg-brand-200"
                        }`}
                        style={{ height: `${Math.round((d.value / max) * 100)}%` }}
                      />
                    ))}
                  </div>
                  <div className="mt-1.5 flex gap-2">
                    {CHART.map((d) => (
                      <span key={d.month} className="flex-1 text-center text-[0.5625rem] text-ink-400">
                        {d.month}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-ink-200 bg-white">
                <p className="border-b border-ink-100 px-3 py-2 text-[0.6875rem] font-semibold text-ink-900">
                  Dernières commandes
                </p>
                <ul>
                  {ORDERS.map((order) => (
                    <li
                      key={order.ref}
                      className="flex items-center gap-2 border-b border-ink-100 px-3 py-2 last:border-0"
                    >
                      <span className="w-9 shrink-0 font-mono text-[0.625rem] text-ink-400">
                        {order.ref}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[0.6875rem] font-medium text-ink-800">
                        {order.customer}
                      </span>
                      <span className="shrink-0 text-[0.6875rem] font-semibold text-ink-900">
                        {formatPriceCFA(order.total)}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[0.5625rem] font-semibold ring-1 ring-inset ${STATUS_STYLES[order.status]}`}
                      >
                        {order.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const PRODUCTS = [
  { name: "Robe wax longue", price: 18_500, tone: "bg-brand-100" },
  { name: "Sandales cuir", price: 12_000, tone: "bg-warning-100" },
  { name: "Sac raphia", price: 9_500, tone: "bg-info-100" },
  { name: "Foulard imprimé", price: 4_500, tone: "bg-danger-100" },
];

export function StorefrontPreview() {
  return (
    <div className="mx-auto w-[13.5rem] overflow-hidden rounded-[1.5rem] border-[6px] border-ink-900 bg-white shadow-lg">
      {/* Entête boutique */}
      <div className="bg-brand-600 px-3 pb-3 pt-4 text-white">
        <p className="text-[0.5625rem] uppercase tracking-[0.1em] text-brand-100">Boutique</p>
        <p className="mt-0.5 text-[0.8125rem] font-bold leading-tight">Maison Awa</p>
      </div>

      {/* Grille produits */}
      <div className="grid grid-cols-2 gap-2 p-2.5">
        {PRODUCTS.map((product) => (
          <div key={product.name} className="overflow-hidden rounded-lg border border-ink-200">
            <div className={`flex h-11 items-center justify-center ${product.tone}`}>
              <Package size={16} strokeWidth={1.75} className="text-ink-900/35" />
            </div>
            <div className="p-1.5">
              <p className="truncate text-[0.5625rem] font-medium leading-tight text-ink-800">
                {product.name}
              </p>
              <p className="mt-0.5 text-[0.5625rem] font-bold text-brand-700">
                {formatPriceCFA(product.price)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Panier */}
      <div className="px-2.5 pb-3">
        <div className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 py-2 text-[0.625rem] font-semibold text-white">
          <ShoppingBag size={11} strokeWidth={2.25} />
          Commander sur WhatsApp
        </div>
      </div>
    </div>
  );
}

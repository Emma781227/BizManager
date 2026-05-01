"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { formatPriceCFA } from "@/lib/format";
import { detectMediaKind, type MediaKind } from "@/lib/media";

type Product = {
  id: string;
  name: string;
  category?: string | null;
  categories?: string[];
  description?: string | null;
  sku?: string | null;
  unitPrice: string | number;
  stock: number;
  imageUrl?: string | null;
  imageVariants?: string[];
  createdAt: string;
  updatedAt?: string;
};

type ApiResponse<T> = {
  data?: T;
  meta?: {
    categories?: string[];
  };
  error?: string;
};

type ProductFormState = {
  name: string;
  category: string;
  categories: string;
  description: string;
  sku: string;
  unitPrice: string;
  stock: string;
  imageUrl: string;
  imageVariants: string;
};

type MediaSlotState = {
  file: File | null;
  preview: string;
  kind: MediaKind | null;
};

const EMPTY_FORM: ProductFormState = {
  name: "",
  category: "",
  categories: "",
  description: "",
  sku: "",
  unitPrice: "",
  stock: "0",
  imageUrl: "",
  imageVariants: "",
};

const MAX_MEDIA_VARIANTS = 3;

function createEmptyMediaSlot(): MediaSlotState {
  return {
    file: null,
    preview: "",
    kind: null,
  };
}

function createEmptyMediaSlots(): MediaSlotState[] {
  return Array.from({ length: MAX_MEDIA_VARIANTS }, () => createEmptyMediaSlot());
}

function createMediaSlotFromSource(source: string): MediaSlotState {
  return {
    file: null,
    preview: source,
    kind: detectMediaKind(source),
  };
}

function cleanList(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((entry) => entry.trim().replace(/\s+/g, " "))
        .filter(Boolean),
    ),
  ).slice(0, 10);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function stockTone(stock: number) {
  if (stock <= 0) {
    return { label: "Rupture", className: "border-red-200 bg-red-50 text-red-600" };
  }

  if (stock <= 8) {
    return { label: "Stock faible", className: "border-amber-200 bg-amber-50 text-amber-600" };
  }

  return { label: "En stock", className: "border-emerald-200 bg-emerald-50 text-emerald-700" };
}

function normalizeCurrency(value: number | string) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "in_stock">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [mainMedia, setMainMedia] = useState<MediaSlotState>(createEmptyMediaSlot());
  const [variantMedia, setVariantMedia] = useState<MediaSlotState[]>(createEmptyMediaSlots());

  const totalStock = useMemo(
    () => products.reduce((sum, product) => sum + product.stock, 0),
    [products],
  );

  const totalValue = useMemo(
    () => products.reduce((sum, product) => sum + normalizeCurrency(product.unitPrice) * product.stock, 0),
    [products],
  );

  const lowStockCount = useMemo(
    () => products.filter((product) => product.stock > 0 && product.stock <= 8).length,
    [products],
  );

  const outOfStockCount = useMemo(
    () => products.filter((product) => product.stock <= 0).length,
    [products],
  );

  const visibleProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return products.slice(start, start + pageSize);
  }, [currentPage, pageSize, products]);

  const totalPages = Math.max(1, Math.ceil(products.length / pageSize));

  const categorySummary = useMemo(() => {
    const counts = new Map<string, number>();

    for (const product of products) {
      const values = cleanList([product.category ?? "", ...(product.categories ?? [])].join(","));
      for (const value of values) {
        counts.set(value, (counts.get(value) ?? 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 5);
  }, [products]);

  const topProducts = useMemo(() => {
    return [...products].sort((left, right) => right.stock - left.stock).slice(0, 5);
  }, [products]);

  async function loadProducts(nextQuery: string, nextCategory: string, nextStock: "all" | "low" | "in_stock") {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (nextQuery.trim()) {
      params.set("q", nextQuery.trim());
    }
    if (nextCategory !== "all") {
      params.set("category", nextCategory);
    }
    if (nextStock !== "all") {
      params.set("stock", nextStock);
    }

    try {
      const response = await fetch(`/api/products?${params.toString()}`, {
        cache: "no-store",
      });
      const json = (await response.json()) as ApiResponse<Product[]>;

      if (!response.ok || !json.data) {
        setProducts([]);
        setCategoryOptions([]);
        setError(json.error ?? "Impossible de charger les produits.");
        return;
      }

      setProducts(json.data);
      setCategoryOptions(json.meta?.categories ?? []);
    } catch {
      setProducts([]);
      setCategoryOptions([]);
      setError("Erreur reseau pendant le chargement des produits.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts(query, categoryFilter, stockFilter);
    setCurrentPage(1);
  }, [query, categoryFilter, stockFilter]);

  useEffect(() => {
    if (!dialogMode) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDialogMode(null);
        setActiveProductId(null);
        setForm(EMPTY_FORM);
        resetMediaState();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [dialogMode]);

  function resetMediaState() {
    setMainMedia(createEmptyMediaSlot());
    setVariantMedia(createEmptyMediaSlots());
  }

  function setMainMediaFile(file: File | null) {
    if (!file) {
      setMainMedia(createEmptyMediaSlot());
      return;
    }

    const kind = file.type.startsWith("video/") ? "video" : "image";
    const reader = new FileReader();
    reader.onload = () => {
      setMainMedia({ file, preview: String(reader.result ?? ""), kind });
    };
    reader.readAsDataURL(file);
  }

  function setVariantMediaFile(index: number, file: File | null) {
    setVariantMedia((previous) => {
      const next = previous.slice();
      if (!file) {
        next[index] = createEmptyMediaSlot();
        return next;
      }

      const kind = file.type.startsWith("video/") ? "video" : "image";
      const reader = new FileReader();
      reader.onload = () => {
        setVariantMedia((current) => {
          const updated = current.slice();
          updated[index] = { file, preview: String(reader.result ?? ""), kind };
          return updated;
        });
      };
      reader.readAsDataURL(file);

      return next;
    });
  }

  function openCreateDialog() {
    setDialogMode("create");
    setActiveProductId(null);
    setForm(EMPTY_FORM);
    resetMediaState();
    setError(null);
    setSuccess(null);
  }

  function openEditDialog(product: Product) {
    const normalizedCategories = cleanList(
      [product.category ?? "", ...(product.categories ?? [])].join(","),
    );

    setDialogMode("edit");
    setActiveProductId(product.id);
    setForm({
      name: product.name,
      category: normalizedCategories[0] ?? "",
      categories: normalizedCategories.join(", "),
      description: product.description ?? "",
      sku: product.sku ?? "",
      unitPrice: String(normalizeCurrency(product.unitPrice)),
      stock: String(product.stock),
      imageUrl: product.imageUrl ?? "",
      imageVariants: (product.imageVariants ?? []).join(", "),
    });
    setMainMedia(
      product.imageUrl
        ? createMediaSlotFromSource(product.imageUrl)
        : createEmptyMediaSlot(),
    );
    setVariantMedia(
      createEmptyMediaSlots().map((slot, index) => {
        const source = product.imageVariants?.[index];
        return source ? createMediaSlotFromSource(source) : slot;
      }),
    );
    setError(null);
    setSuccess(null);
  }

  function closeDialog() {
    setDialogMode(null);
    setActiveProductId(null);
    setForm(EMPTY_FORM);
    resetMediaState();
  }

  async function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const mergedCategories = cleanList([form.category, form.categories].join(","));

    const payload = new FormData();
    payload.set("name", form.name);
    payload.set("category", mergedCategories[0] ?? "");
    payload.set("categories", JSON.stringify(mergedCategories));
    payload.set("description", form.description);
    payload.set("sku", form.sku);
    payload.set("unitPrice", form.unitPrice);
    payload.set("stock", form.stock);

    if (mainMedia.file) {
      payload.set("imageFile", mainMedia.file);
    }

    for (const slot of variantMedia) {
      if (slot.file) {
        payload.append("imageVariantFiles", slot.file);
      }
    }

    try {
      const url = dialogMode === "edit" && activeProductId
        ? `/api/products/${activeProductId}`
        : "/api/products";

      const response = await fetch(url, {
        method: dialogMode === "edit" ? "PUT" : "POST",
        body: payload,
      });
      const json = (await response.json()) as ApiResponse<Product>;

      if (!response.ok || !json.data) {
        setError(json.error ?? (dialogMode === "edit" ? "Impossible de modifier le produit." : "Impossible de creer le produit."));
        return;
      }

      setSuccess(dialogMode === "edit" ? "Produit modifie avec succes." : "Produit cree avec succes.");
      closeDialog();
      await loadProducts(query, categoryFilter, stockFilter);
    } catch {
      setError(dialogMode === "edit" ? "Erreur reseau pendant la modification du produit." : "Erreur reseau pendant la creation du produit.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteProduct(product: Product) {
    const confirmed = window.confirm(
      `Supprimer le produit \"${product.name}\" ? Cette action est irreversible.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingProductId(product.id);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });
      const json = (await response.json()) as ApiResponse<{ success: boolean }>;

      if (!response.ok || !json.data?.success) {
        setError(json.error ?? "Impossible de supprimer le produit.");
        return;
      }

      if (activeProductId === product.id) {
        closeDialog();
      }

      setSuccess("Produit supprime avec succes.");
      await loadProducts(query, categoryFilter, stockFilter);
    } catch {
      setError("Erreur reseau pendant la suppression du produit.");
    } finally {
      setDeletingProductId(null);
    }
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery(searchValue);
    setCurrentPage(1);
  }

  const productsStart = products.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const productsEnd = Math.min(currentPage * pageSize, products.length);

  return (
    <main className="grid gap-2.5 p-3 sm:gap-3.5 sm:p-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-4 lg:p-5">
      <div className="grid gap-2.5 sm:gap-3.5">
        <section className="rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_8%_16%,rgba(34,136,102,0.09)_0%,transparent_46%),linear-gradient(145deg,#ffffff_0%,#f8fbf9_100%)] p-4 sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Espace commercant</p>
              <h1 className="mt-2 text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">Mes produits</h1>
              <p className="mt-2 text-sm text-slate-600 sm:text-base">Gerez vos produits, stocks et categories depuis un seul tableau de bord.</p>
            </div>

            <button
              type="button"
              onClick={openCreateDialog}
              className="inline-flex w-full items-center justify-between gap-0 self-start overflow-hidden rounded-lg border border-emerald-700 bg-emerald-600 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(20,83,45,0.18)] transition-colors hover:bg-emerald-700 sm:w-[266px]"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2.5">
                <span className="text-lg leading-none">+</span>
                Ajouter un produit
              </span>
              <span className="border-l border-emerald-500/40 px-3 py-2.5 text-base leading-none">⌄</span>
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              {products.length} produits
            </span>
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
              {categoryOptions.length} categories
            </span>
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
              Stock total: {totalStock}
            </span>
          </div>
        </section>

        <section className="grid gap-1.5 grid-cols-2 items-stretch sm:grid-cols-3 sm:gap-2 lg:gap-2.5">
          <article className="h-full rounded-lg border border-slate-200 bg-white px-2 py-2 shadow-sm sm:px-2.5 sm:py-2">
            <div className="flex h-full items-center min-h-[48px] gap-2 sm:min-h-[52px]">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-700 shadow-sm">📦</div>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="text-xs font-semibold text-slate-500">Total produits</p>
                <div className="flex items-baseline gap-1">
                  <strong className="block text-base font-bold text-slate-900">{products.length}</strong>
                  <span className="text-xs font-semibold text-emerald-600">↑ 6.3%</span>
                </div>
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-600">vs hier</p>
          </article>
          <article className="h-full rounded-lg border border-slate-200 bg-white px-2 py-2 shadow-sm sm:px-2.5 sm:py-2">
            <div className="flex h-full items-center min-h-[48px] gap-2 sm:min-h-[52px]">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-700 shadow-sm">✓</div>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="text-xs font-semibold text-slate-500">En stock</p>
                <div className="flex items-baseline gap-1">
                  <strong className="block text-base font-bold text-slate-900">{products.filter((product) => product.stock > 8).length}</strong>
                  <span className="text-xs font-semibold text-emerald-600">↑ 8.1%</span>
                </div>
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-600">77,4% des produits</p>
          </article>
          <article className="h-full rounded-lg border border-slate-200 bg-white px-2 py-2 shadow-sm sm:px-2.5 sm:py-2">
            <div className="flex h-full items-center min-h-[48px] gap-2 sm:min-h-[52px]">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-rose-100 bg-rose-50 text-rose-600 shadow-sm">!</div>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="text-xs font-semibold text-slate-500">Rupture de stock</p>
                <div className="flex items-baseline gap-1">
                  <strong className="block text-base font-bold text-slate-900">{outOfStockCount}</strong>
                  <span className="text-xs font-semibold text-rose-600">↑ 12.7%</span>
                </div>
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-600">22,6% des produits</p>
          </article>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">Catalogue</h2>
              <p className="text-xs text-slate-600">Retrouvez vite un produit, modifiez-le ou supprimez-le.</p>
            </div>
            <button
              type="button"
              onClick={openCreateDialog}
              className="inline-flex items-center gap-2 self-start rounded-lg border  border-emerald-600 bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700\"
            >
              <span className="text-lg  leading-none">+</span>
              Ajouter un produit
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 sm:gap-2">
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-slate-700">Categorie</span>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
              >
                <option value="all">Toutes categories</option>
                {categoryOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-slate-700">Stock</span>
              <select
                value={stockFilter}
                onChange={(event) => setStockFilter(event.target.value as "all" | "low" | "in_stock")}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
              >
                <option value="all">Tous les statuts</option>
                <option value="low">Stock faible</option>
                <option value="in_stock">En stock</option>
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-slate-700">Trier par</span>
              <select
                value={String(pageSize)}
                onChange={(event) => setPageSize(Number(event.target.value))}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
              >
                <option value="10">Plus recent</option>
                <option value="20">20 par page</option>
                <option value="50">50 par page</option>
              </select>
            </label>
          </div>

          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full border-collapse">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="px-2 py-1.5 text-left text-xs font-semibold text-slate-700 sm:px-2.5 sm:py-2">Produit</th>
                  <th className="px-2 py-1.5 text-left text-xs font-semibold text-slate-700 sm:px-2.5 sm:py-2">Categorie</th>
                  <th className="px-2 py-1.5 text-left text-xs font-semibold text-slate-700 sm:px-2.5 sm:py-2">Prix</th>
                  <th className="px-2 py-1.5 text-left text-xs font-semibold text-slate-700 sm:px-2.5 sm:py-2">Stock</th>
                  <th className="px-2 py-1.5 text-left text-xs font-semibold text-slate-700 sm:px-2.5 sm:py-2">Statut</th>
                  <th className="px-2 py-1.5 text-left text-xs font-semibold text-slate-700 sm:px-2.5 sm:py-2">Derniere mise a jour</th>
                  <th className="px-2 py-1.5 text-right text-xs font-semibold text-slate-700 sm:px-2.5 sm:py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-2 py-5 text-sm text-slate-600" colSpan={7}>
                      Chargement des produits...
                    </td>
                  </tr>
                ) : visibleProducts.length > 0 ? (
                  visibleProducts.map((product) => {
                    const tone = stockTone(product.stock);
                    const categoryLabel = [product.category, ...(product.categories ?? [])]
                      .filter((value): value is string => Boolean(value && value.trim()))
                      .map((value) => value.trim())
                      .join(", ") || "Sans categorie";

                    return (
                      <tr key={product.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50/80">
                        <td className="px-2 py-1.5 sm:px-2.5 sm:py-2">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100\">
                              {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="grid h-full w-full place-items-center text-xs font-bold text-slate-400">IMG</div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{product.name}</p>
                              <p className="text-xs text-slate-500">SKU: {product.sku || "-"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-1.5 text-sm text-slate-700 sm:px-2.5 sm:py-2">{categoryLabel}</td>
                        <td className="px-2 py-1.5 text-sm text-slate-900 sm:px-2.5 sm:py-2">{formatPriceCFA(product.unitPrice)}</td>
                        <td className="px-2 py-1.5 text-sm text-slate-900 sm:px-2.5 sm:py-2">{product.stock}</td>
                        <td className="px-2 py-1.5 sm:px-2.5 sm:py-2">
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${tone.className}`}>
                            {tone.label}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-sm text-slate-700 sm:px-2.5 sm:py-2">{formatDate(product.updatedAt ?? product.createdAt)}</td>
                        <td className="px-2 py-1.5 sm:px-2.5 sm:py-2">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditDialog(product)}
                              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-900 transition-colors hover:bg-slate-200"
                            >
                              Modifier
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteProduct(product)}
                              disabled={deletingProductId === product.id}
                              className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingProductId === product.id ? "Suppression..." : "Supprimer"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="px-2 py-5 text-sm text-slate-600" colSpan={7}>
                      Aucun produit trouve.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Affichage de {productsStart} a {productsEnd} sur {products.length} produits
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
                disabled={currentPage <= 1}
                className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Prev
              </button>
              <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                {currentPage}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </section>

        {loading ? null : error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : success ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </p>
        ) : null}
      </div>

      <aside className="grid gap-2.5 sm:gap-3.5">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-900">Categories populaires</h3>
            <button type="button" onClick={openCreateDialog} className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">
              Voir tout
            </button>
          </div>
          <div className="grid gap-2">
            {categorySummary.length > 0 ? (
              categorySummary.map((category) => (
                <div key={category.name} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{category.name}</p>
                      <p className="text-xs text-slate-500">{category.count} produits</p>
                    </div>
                    <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {category.count}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">Aucune categorie trouvee.</p>
            )}
          </div>
          <button
            type="button"
            onClick={openCreateDialog}
            className="mt-3 w-full rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            Gerer les categories
          </button>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-900">Produits les plus vus</h3>
            <button type="button" onClick={openCreateDialog} className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">
              Voir tout
            </button>
          </div>
          <div className="grid gap-2">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-500 shadow-sm">
                    {index + 1}
                  </div>
                  <div className="h-10 w-10 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                    <p className="text-xs text-slate-500">{product.stock} units</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">Aucun produit pour le moment.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h3 className="text-sm font-bold text-slate-900">Besoin d'aide ?</h3>
          <p className="mt-2 text-sm text-slate-600">Consultez vos guides ou contactez notre equipe support.</p>
          <button
            type="button"
            className="mt-3 w-full rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            Acceder a l'aide
          </button>
        </section>
      </aside>

      {dialogMode ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDialog();
            }
          }}
        >
          <section className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                  {dialogMode === "edit" ? "Modifier produit" : "Nouveau produit"}
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
                  {dialogMode === "edit" ? "Mettre a jour le produit" : "Creer un nouveau produit"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-200"
              >
                Fermer
              </button>
            </div>

            <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={handleFormSubmit}>
              <label className="grid gap-1 sm:col-span-1">
                <span className="text-sm font-semibold text-slate-700">Nom</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  required
                />
              </label>
              <label className="grid gap-1 sm:col-span-1">
                <span className="text-sm font-semibold text-slate-700">Categorie principale</span>
                <input
                  value={form.category}
                  onChange={(event) => setForm((previous) => ({ ...previous, category: event.target.value }))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  placeholder="Ex: Vetements"
                />
              </label>
              <label className="grid gap-1 sm:col-span-2">
                <span className="text-sm font-semibold text-slate-700">Categories (separees par virgule)</span>
                <input
                  value={form.categories}
                  onChange={(event) => setForm((previous) => ({ ...previous, categories: event.target.value }))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  placeholder="Vetements, Femme, Nouveaute"
                />
              </label>
              <label className="grid gap-1 sm:col-span-2">
                <span className="text-sm font-semibold text-slate-700">Description</span>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((previous) => ({ ...previous, description: event.target.value }))}
                  rows={3}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                />
              </label>
              <label className="grid gap-1 sm:col-span-1">
                <span className="text-sm font-semibold text-slate-700">SKU</span>
                <input
                  value={form.sku}
                  onChange={(event) => setForm((previous) => ({ ...previous, sku: event.target.value }))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  placeholder="ANK-001"
                />
              </label>
              <label className="grid gap-1 sm:col-span-1">
                <span className="text-sm font-semibold text-slate-700">Prix unitaire</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.unitPrice}
                  onChange={(event) => setForm((previous) => ({ ...previous, unitPrice: event.target.value }))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  required
                />
              </label>
              <label className="grid gap-1 sm:col-span-1">
                <span className="text-sm font-semibold text-slate-700">Stock</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.stock}
                  onChange={(event) => setForm((previous) => ({ ...previous, stock: event.target.value }))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  required
                />
              </label>
              <label className="grid gap-1 sm:col-span-2">
                <span className="text-sm font-semibold text-slate-700">Media principal</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(event) => setMainMediaFile(event.currentTarget.files?.[0] ?? null)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                />
                {mainMedia.preview ? (
                  <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    {mainMedia.kind === "video" ? (
                      <video src={mainMedia.preview} controls className="h-40 w-full object-cover" />
                    ) : (
                      <img src={mainMedia.preview} alt="Apercu media principal" className="h-40 w-full object-cover" />
                    )}
                    <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-3 py-2 text-xs text-slate-600">
                      <span>Média sélectionné depuis l'appareil</span>
                      <button
                        type="button"
                        onClick={() => setMainMediaFile(null)}
                        className="font-semibold text-rose-600 hover:text-rose-700"
                      >
                        Retirer
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Image ou video depuis votre appareil.</p>
                )}
              </label>

              <div className="grid gap-3 sm:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-700">Variantes média</span>
                  <span className="text-xs text-slate-500">Maximum 3 variantes image ou video</span>
                </div>

                <div className="grid gap-3">
                  {variantMedia.map((slot, index) => (
                    <div key={index} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center gap-3">
                        <label className="grid flex-1 gap-1">
                          <span className="text-xs font-semibold text-slate-700">Variante {index + 1}</span>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={(event) => setVariantMediaFile(index, event.currentTarget.files?.[0] ?? null)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setVariantMediaFile(index, null)}
                          className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100"
                        >
                          Retirer
                        </button>
                      </div>

                      {slot.preview ? (
                        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
                          {slot.kind === "video" ? (
                            <video src={slot.preview} controls className="h-28 w-full object-cover" />
                          ) : (
                            <img src={slot.preview} alt={`Variante ${index + 1}`} className="h-28 w-full object-cover" />
                          )}
                        </div>
                      ) : (
                        <div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-white px-3 py-6 text-center text-xs text-slate-500">
                          Aucun média sélectionné
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-2">
                <p className="text-sm text-slate-600">
                  Categories detectees: <span className="font-semibold text-slate-900">{cleanList([form.category, form.categories].join(",")).join(", ") || "Aucune"}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closeDialog}
                    className="rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-200"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-lg border border-emerald-600 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Sauvegarde..." : dialogMode === "edit" ? "Mettre a jour" : "Creer le produit"}
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}

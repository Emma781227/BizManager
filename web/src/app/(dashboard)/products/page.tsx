"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Product = {
  id: string;
  name: string;
  category?: string | null;
  categories?: string[];
  description?: string | null;
  sku: string | null;
  unitPrice: string | number;
  stock: number;
  imageUrl?: string | null;
  createdAt: string;
};

type ApiResponse<T> = {
  data?: T;
  meta?: {
    categories?: string[];
  };
  error?: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [description, setDescription] = useState("");
  const [sku, setSku] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showAdvancedCreate, setShowAdvancedCreate] = useState(false);
  const [autoSku, setAutoSku] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editSelectedCategories, setEditSelectedCategories] = useState<string[]>([]);
  const [editNewCategory, setEditNewCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSku, setEditSku] = useState("");
  const [editUnitPrice, setEditUnitPrice] = useState("");
  const [editStock, setEditStock] = useState("0");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "in_stock">("all");
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

  useEffect(() => {
    void loadProducts({
      query,
      category: categoryFilter,
      stock: stockFilter,
    });
  }, [query, categoryFilter, stockFilter]);

  const categories = useMemo(() => categoryOptions, [categoryOptions]);

  const suggestedCategories = useMemo(() => {
    const defaults = ["Vetements", "Chaussures", "Accessoires", "Cosmetiques", "Maison"];
    return Array.from(new Set([...defaults, ...categories])).slice(0, 8);
  }, [categories]);

  const createPricePreview = useMemo(() => {
    const value = Number(unitPrice || "0");
    if (Number.isNaN(value)) {
      return "0";
    }
    return new Intl.NumberFormat("fr-FR").format(Math.round(value));
  }, [unitPrice]);

  const createStockPreview = useMemo(() => {
    const value = Number(stock || "0");
    if (Number.isNaN(value) || value <= 0) {
      return "Rupture";
    }
    if (value <= 8) {
      return "Stock bas";
    }
    return "En stock";
  }, [stock]);

  const totalStock = useMemo(
    () => products.reduce((acc, product) => acc + product.stock, 0),
    [products],
  );

  const formattedInventoryValue = useMemo(() => {
    const amount = products.reduce((acc, product) => {
      return acc + Number(product.unitPrice) * product.stock;
    }, 0);

    return new Intl.NumberFormat("fr-FR").format(Math.round(amount));
  }, [products]);

  async function loadProducts(filters: {
    query: string;
    category: string;
    stock: "all" | "low" | "in_stock";
  }) {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (filters.query.trim()) {
      params.set("q", filters.query.trim());
    }
    if (filters.category !== "all") {
      params.set("category", filters.category);
    }
    if (filters.stock !== "all") {
      params.set("stock", filters.stock);
    }

    try {
      const response = await fetch(`/api/products?${params.toString()}`, {
        cache: "no-store",
      });
      const json = (await response.json()) as ApiResponse<Product[]>;

      if (!response.ok || !json.data) {
        setProducts([]);
        setError(json.error ?? "Impossible de charger les produits.");
        return;
      }

      setProducts(json.data);
      setCategoryOptions(json.meta?.categories ?? []);
    } catch {
      setProducts([]);
      setError("Erreur reseau pendant le chargement des produits.");
    } finally {
      setLoading(false);
    }
  }

  function toggleCategory(value: string) {
    const normalized = value.trim();
    if (!normalized) {
      return;
    }

    setSelectedCategories((previous) =>
      previous.includes(normalized)
        ? previous.filter((entry) => entry !== normalized)
        : [...previous, normalized],
    );
  }

  function addNewCategory() {
    const normalized = newCategory.trim().replace(/\s+/g, " ");
    if (!normalized) {
      return;
    }

    setSelectedCategories((previous) =>
      previous.includes(normalized) ? previous : [...previous, normalized],
    );
    setCategory((previous) => previous.trim() || normalized);
    setNewCategory("");
  }

  function toggleEditCategory(value: string) {
    const normalized = value.trim();
    if (!normalized) {
      return;
    }

    setEditSelectedCategories((previous) =>
      previous.includes(normalized)
        ? previous.filter((entry) => entry !== normalized)
        : [...previous, normalized],
    );
  }

  function addNewEditCategory() {
    const normalized = editNewCategory.trim().replace(/\s+/g, " ");
    if (!normalized) {
      return;
    }

    setEditSelectedCategories((previous) =>
      previous.includes(normalized) ? previous : [...previous, normalized],
    );
    setEditCategory((previous) => previous.trim() || normalized);
    setEditNewCategory("");
  }

  async function handleCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const normalizeSku = (value: string) =>
      value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

    const generatedSku = `${normalizeSku(name).slice(0, 8) || "PROD"}-${Date.now()
      .toString()
      .slice(-4)}`;
    const finalSku = sku.trim() || (autoSku ? generatedSku : "");
    const mergedCategories = Array.from(
      new Set([
        category.trim(),
        ...selectedCategories.map((value) => value.trim()),
      ].filter(Boolean)),
    );

    const formData = new FormData();
    formData.set("name", name);
    formData.set("category", mergedCategories[0] ?? "");
    formData.set("categories", JSON.stringify(mergedCategories));
    formData.set("description", description);
    formData.set("sku", finalSku);
    formData.set("unitPrice", unitPrice);
    formData.set("stock", stock);
    formData.set("imageUrl", imageUrl);
    if (imageFile) {
      formData.set("imageFile", imageFile);
    }

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        body: formData,
      });
      const json = (await response.json()) as ApiResponse<Product>;

      if (!response.ok || !json.data) {
        setError(json.error ?? "Impossible de creer le produit.");
        return;
      }

      setSuccess("Produit cree avec succes.");
      setName("");
      setCategory(mergedCategories[0] ?? "");
      setSelectedCategories(mergedCategories);
      setDescription("");
      setSku("");
      setUnitPrice("");
      setStock("1");
      setImageUrl("");
      setImageFile(null);
      await loadProducts({
        query,
        category: categoryFilter,
        stock: stockFilter,
      });
    } catch {
      setError("Erreur reseau pendant la creation du produit.");
    } finally {
      setSubmitting(false);
    }
  }

  function startEditing(product: Product) {
    const normalizedCategories = Array.from(
      new Set(
        [
          ...(product.categories ?? []),
          product.category ?? "",
        ]
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    );

    setEditingProductId(product.id);
    setEditName(product.name);
    setEditCategory(normalizedCategories[0] ?? "");
    setEditSelectedCategories(normalizedCategories);
    setEditNewCategory("");
    setEditDescription(product.description ?? "");
    setEditSku(product.sku ?? "");
    setEditUnitPrice(String(product.unitPrice));
    setEditStock(String(product.stock));
    setEditImageUrl(product.imageUrl ?? "");
    setEditImageFile(null);
    setError(null);
    setSuccess(null);
  }

  function cancelEditing() {
    setEditingProductId(null);
    setEditName("");
    setEditCategory("");
    setEditSelectedCategories([]);
    setEditNewCategory("");
    setEditDescription("");
    setEditSku("");
    setEditUnitPrice("");
    setEditStock("0");
    setEditImageUrl("");
    setEditImageFile(null);
  }

  async function handleUpdateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingProductId) {
      return;
    }

    setUpdating(true);
    setError(null);
    setSuccess(null);

    const mergedEditCategories = Array.from(
      new Set(
        [
          editCategory.trim(),
          ...editSelectedCategories.map((value) => value.trim()),
        ].filter(Boolean),
      ),
    );

    const formData = new FormData();
    formData.set("name", editName);
    formData.set("category", mergedEditCategories[0] ?? "");
    formData.set("categories", JSON.stringify(mergedEditCategories));
    formData.set("description", editDescription);
    formData.set("sku", editSku);
    formData.set("unitPrice", editUnitPrice);
    formData.set("stock", editStock);
    formData.set("imageUrl", editImageUrl);
    if (editImageFile) {
      formData.set("imageFile", editImageFile);
    }

    try {
      const response = await fetch(`/api/products/${editingProductId}`, {
        method: "PUT",
        body: formData,
      });
      const json = (await response.json()) as ApiResponse<Product>;

      if (!response.ok || !json.data) {
        setError(json.error ?? "Impossible de modifier le produit.");
        return;
      }

      setSuccess("Produit modifie avec succes.");
      cancelEditing();
      await loadProducts({
        query,
        category: categoryFilter,
        stock: stockFilter,
      });
    } catch {
      setError("Erreur reseau pendant la modification du produit.");
    } finally {
      setUpdating(false);
    }
  }

  async function handleDeleteProduct(product: Product) {
    const confirmed = window.confirm(
      `Supprimer le produit "${product.name}" ? Cette action est irreversible.`,
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

      if (!response.ok) {
        setError(json.error ?? "Impossible de supprimer le produit.");
        return;
      }

      if (editingProductId === product.id) {
        cancelEditing();
      }

      setSuccess("Produit supprime avec succes.");
      await loadProducts({
        query,
        category: categoryFilter,
        stock: stockFilter,
      });
    } catch {
      setError("Erreur reseau pendant la suppression du produit.");
    } finally {
      setDeletingProductId(null);
    }
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery(searchValue);
  }

  return (
    <main className="page-stack products-page merchant-grid">
      <section className="card products-hero merchant-hero">
        <div className="products-hero-head">
          <div>
            <h1>Mes Produits</h1>
            <p>Gere ton catalogue, les photos et le stock en quelques secondes.</p>
          </div>
        </div>
        <div className="products-metrics">
          <article className="products-metric-card">
            <span>Produits</span>
            <strong>{products.length}</strong>
          </article>
          <article className="products-metric-card">
            <span>Stock total</span>
            <strong>{totalStock}</strong>
          </article>
          <article className="products-metric-card">
            <span>Valeur stock</span>
            <strong>{formattedInventoryValue} CFA</strong>
          </article>
        </div>
      </section>

      <section className="card product-form-card merchant-surface">
        <h2>Nouveau produit</h2>
        <p>Creation rapide avec mode assiste pour gagner du temps.</p>

        <div className="product-create-quick-bar">
          <div className="product-create-pill">
            <span>Prix</span>
            <strong>{createPricePreview} CFA</strong>
          </div>
          <div className="product-create-pill">
            <span>Etat stock</span>
            <strong>{createStockPreview}</strong>
          </div>
          <div className="product-create-pill">
            <span>Mode</span>
            <strong>{showAdvancedCreate ? "Complet" : "Rapide"}</strong>
          </div>
        </div>

        <div className="product-create-categories">
          <span>Categories (selection multiple)</span>
          <div className="product-chip-row">
            {suggestedCategories.map((value) => (
              <button
                key={value}
                type="button"
                className={`product-chip ${selectedCategories.includes(value) ? "active" : ""}`}
                onClick={() => toggleCategory(value)}
              >
                {value}
              </button>
            ))}
          </div>
          <div className="category-create-row">
            <input
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
              placeholder="Nouvelle categorie"
            />
            <button type="button" className="btn-secondary" onClick={addNewCategory}>
              Ajouter
            </button>
          </div>
          {selectedCategories.length > 0 ? (
            <p className="muted form-hint">
              Selection: {selectedCategories.join(", ")}
            </p>
          ) : null}
        </div>

        <form className="form-grid product-form" onSubmit={handleCreateProduct}>
          <label>
            Nom
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              required
            />
          </label>
          <label>
            Categorie principale
            <input
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Ex: Vetements (optionnel)"
            />
          </label>
          <label>
            Prix unitaire
            <input
              type="number"
              min={0}
              step="0.01"
              value={unitPrice}
              onChange={(event) => setUnitPrice(event.target.value)}
              required
            />
          </label>
          <label>
            Stock
            <input
              type="number"
              min={0}
              step={1}
              value={stock}
              onChange={(event) => setStock(event.target.value)}
              required
            />
          </label>

          <label>
            Quantite rapide
            <div className="stock-quick-actions">
              {[1, 5, 10, 20].map((value) => (
                <button key={value} type="button" onClick={() => setStock(String(value))}>
                  {value}
                </button>
              ))}
            </div>
          </label>

          <div className="full-width product-create-toggle">
            <label className="inline-check">
              <input
                type="checkbox"
                checked={showAdvancedCreate}
                onChange={(event) => setShowAdvancedCreate(event.target.checked)}
              />
              Afficher les options avancees
            </label>
          </div>

          {showAdvancedCreate ? (
            <>
              <label className="full-width">
                Description
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  placeholder="Description courte du produit"
                />
              </label>

              <label>
                SKU
                <input
                  value={sku}
                  onChange={(event) => setSku(event.target.value)}
                  placeholder="Laisse vide pour generation auto"
                  disabled={autoSku}
                />
              </label>

              <div className="product-create-toggle">
                <label className="inline-check">
                  <input
                    type="checkbox"
                    checked={autoSku}
                    onChange={(event) => setAutoSku(event.target.checked)}
                  />
                  Generer SKU automatiquement
                </label>
              </div>

              <label>
                URL de l&apos;image
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </label>
              <label>
                Image depuis l&apos;appareil
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setImageFile(file);
                  }}
                />
              </label>
              {imageFile ? (
                <p className="muted form-hint">Fichier selectionne: {imageFile.name}</p>
              ) : null}
            </>
          ) : null}

          <div className="form-actions full-width">
            <button type="submit" disabled={submitting}>
              {submitting ? "Creation..." : "Creer le produit"}
            </button>
          </div>
        </form>
        {success ? <p className="feedback success">{success}</p> : null}
      </section>

      {editingProductId ? (
        <section className="card product-form-card merchant-surface">
          <h2>Modifier le produit</h2>
          <p>Mets a jour rapidement les informations et la photo.</p>
          <form className="form-grid product-form" onSubmit={handleUpdateProduct}>
            <label>
              Nom
              <input
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                minLength={2}
                required
              />
            </label>
            <label>
              Categorie principale
              <input
                value={editCategory}
                onChange={(event) => setEditCategory(event.target.value)}
                placeholder="Ex: Vetements"
              />
            </label>
            <div className="full-width product-create-categories">
              <span>Categories (selection multiple)</span>
              <div className="product-chip-row">
                {suggestedCategories.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`product-chip ${editSelectedCategories.includes(value) ? "active" : ""}`}
                    onClick={() => toggleEditCategory(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="category-create-row">
                <input
                  value={editNewCategory}
                  onChange={(event) => setEditNewCategory(event.target.value)}
                  placeholder="Nouvelle categorie"
                />
                <button type="button" className="btn-secondary" onClick={addNewEditCategory}>
                  Ajouter
                </button>
              </div>
              {editSelectedCategories.length > 0 ? (
                <p className="muted form-hint">
                  Selection: {editSelectedCategories.join(", ")}
                </p>
              ) : null}
            </div>
            <label className="full-width">
              Description
              <textarea
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                rows={3}
                placeholder="Description courte du produit"
              />
            </label>
            <label>
              SKU
              <input
                value={editSku}
                onChange={(event) => setEditSku(event.target.value)}
                placeholder="Optionnel"
              />
            </label>
            <label>
              URL de l&apos;image
              <input
                type="url"
                value={editImageUrl}
                onChange={(event) => setEditImageUrl(event.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </label>
            <label>
              Nouvelle image depuis l&apos;appareil
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setEditImageFile(file);
                }}
              />
            </label>
            {editImageFile ? (
              <p className="muted form-hint">Fichier selectionne: {editImageFile.name}</p>
            ) : null}
            <label>
              Prix unitaire
              <input
                type="number"
                min={0}
                step="0.01"
                value={editUnitPrice}
                onChange={(event) => setEditUnitPrice(event.target.value)}
                required
              />
            </label>
            <label>
              Stock
              <input
                type="number"
                min={0}
                step={1}
                value={editStock}
                onChange={(event) => setEditStock(event.target.value)}
                required
              />
            </label>
            <div className="inline-form full-width form-actions">
              <button type="submit" disabled={updating}>
                {updating ? "Mise a jour..." : "Mettre a jour"}
              </button>
              <button type="button" className="btn-secondary" onClick={cancelEditing}>
                Annuler
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="card products-catalog-card merchant-surface">
        <div className="section-head">
          <div>
            <h2>Catalogue</h2>
            <p>Retrouve vite un produit, modifie-le ou supprime-le.</p>
          </div>
          <form className="inline-form" onSubmit={handleSearchSubmit}>
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Rechercher un produit"
            />
            <button type="submit">Rechercher</button>
          </form>
        </div>

        <div className="products-filters">
          <label>
            Categorie
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="all">Toutes</option>
              {categories.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            Stock
            <select
              value={stockFilter}
              onChange={(event) =>
                setStockFilter(event.target.value as "all" | "low" | "in_stock")
              }
            >
              <option value="all">Tous</option>
              <option value="low">Stock bas</option>
              <option value="in_stock">En stock</option>
            </select>
          </label>
        </div>

        <p className="muted">Total stock: {totalStock} articles</p>

        {loading ? <p>Chargement...</p> : null}
        {!loading && products.length === 0 ? (
          <p>Aucun produit trouve.</p>
        ) : null}

        {products.length > 0 ? (
          <div className="products-grid">
            {products.map((product) => {
              const stockClass = product.stock > 8 ? "ok" : product.stock > 0 ? "warn" : "danger";
              const stockLabel =
                product.stock > 8 ? "En stock" : product.stock > 0 ? "Stock bas" : "En rupture";
              const productCategories = Array.from(
                new Set(
                  [
                    ...(product.categories ?? []),
                    product.category ?? "",
                  ]
                    .map((value) => value.trim())
                    .filter(Boolean),
                ),
              );

              return (
                <article key={product.id} className="product-card">
                  {product.imageUrl ? (
                    <div className="product-card-media">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="product-card-image"
                      />
                    </div>
                  ) : (
                    <div className="product-card-media product-card-placeholder">
                      Pas d&apos;image
                    </div>
                  )}

                  <div className="product-card-body">
                    <strong>{product.name}</strong>
                    <div className="product-categories-list">
                      {productCategories.length > 0 ? (
                        productCategories.map((value) => (
                          <span key={`${product.id}-${value}`} className="product-category-pill">
                            {value}
                          </span>
                        ))
                      ) : (
                        <span className="product-category-pill">Sans categorie</span>
                      )}
                    </div>
                    <p className="muted product-description-preview">
                      {product.description?.trim() || "Aucune description"}
                    </p>
                    <span>SKU: {product.sku ?? "-"}</span>
                    <span>Stock: {product.stock}</span>
                  </div>

                  <div className="product-card-side">
                    <strong className="price">{Number(product.unitPrice).toFixed(0)} CFA</strong>
                    <span className={`badge ${stockClass}`}>{stockLabel}</span>
                    <div className="product-card-actions">
                      <button type="button" className="btn-secondary" onClick={() => startEditing(product)}>
                        Modifier
                      </button>
                      <button
                        type="button"
                        className="btn-danger"
                        onClick={() => void handleDeleteProduct(product)}
                        disabled={deletingProductId === product.id}
                      >
                        {deletingProductId === product.id ? "Suppression..." : "Supprimer"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}

        {error ? <p className="feedback error">{error}</p> : null}
      </section>
    </main>
  );
}

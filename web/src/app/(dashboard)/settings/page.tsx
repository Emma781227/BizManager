"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Shop = {
  slug: string;
  name: string;
  notificationEmail: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  description: string | null;
  city: string | null;
  whatsappNumber: string;
  category: string | null;
  address: string | null;
  openingHours: string | null;
  isPublished: boolean;
};

const initialState = {
  slug: "",
  name: "",
  notificationEmail: "",
  logoUrl: "",
  coverUrl: "",
  description: "",
  city: "",
  whatsappNumber: "",
  category: "",
  address: "",
  openingHours: "",
  isPublished: true,
};

function parseJsonSafe<T>(raw: string): T | null {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export default function SettingsPage() {
  const [form, setForm] = useState(initialState);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void loadShop();
  }, []);

  const normalizedSlug = useMemo(() => {
    return form.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }, [form.slug]);

  const shopPreview = useMemo(() => {
    if (!normalizedSlug) {
      return null;
    }

    return `/shop/${normalizedSlug}`;
  }, [normalizedSlug]);

  async function loadShop() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/shop", { cache: "no-store" });
      const raw = await response.text();
      const json = parseJsonSafe<{ data?: Shop | null; error?: string }>(raw) ?? {};

      if (!response.ok) {
        throw new Error(json.error ?? "Impossible de charger la boutique");
      }

      const shop = json.data ?? null;

      if (!shop) {
        setForm(initialState);
      } else {
        setForm({
          slug: shop.slug,
          name: shop.name,
          notificationEmail: shop.notificationEmail ?? "",
          logoUrl: shop.logoUrl ?? "",
          coverUrl: shop.coverUrl ?? "",
          description: shop.description ?? "",
          city: shop.city ?? "",
          whatsappNumber: shop.whatsappNumber,
          category: shop.category ?? "",
          address: shop.address ?? "",
          openingHours: shop.openingHours ?? "",
          isPublished: shop.isPublished,
        });
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.set("slug", normalizedSlug);
      formData.set("name", form.name);
      formData.set("notificationEmail", form.notificationEmail);
      formData.set("logoUrl", form.logoUrl);
      formData.set("coverUrl", form.coverUrl);
      formData.set("description", form.description);
      formData.set("city", form.city);
      formData.set("whatsappNumber", form.whatsappNumber);
      formData.set("category", form.category);
      formData.set("address", form.address);
      formData.set("openingHours", form.openingHours);
      formData.set("isPublished", String(form.isPublished));
      if (logoFile) {
        formData.set("logoFile", logoFile);
      }
      if (coverFile) {
        formData.set("coverFile", coverFile);
      }

      const response = await fetch("/api/shop", {
        method: "PUT",
        body: formData,
      });
      const raw = await response.text();
      const json = parseJsonSafe<{ data?: Shop; error?: string }>(raw) ?? {};

      if (!response.ok) {
        throw new Error(
          json.error ?? `Impossible d'enregistrer la boutique (HTTP ${response.status})`,
        );
      }

      setSuccess("Profil boutique enregistre.");
      setLogoFile(null);
      setCoverFile(null);
      await loadShop();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="page-stack merchant-grid">
        <section className="card merchant-hero">
          <h1>Parametres boutique</h1>
          <p className="muted">Chargement...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page-stack merchant-grid">
      <section className="card merchant-hero">
        <h1>Parametres boutique</h1>
        <p>Complete ton profil boutique pour activer la vitrine publique client.</p>

        <div className="merchant-kpi">
          <article>
            <span>Slug public</span>
            <strong>{form.slug || "-"}</strong>
          </article>
          <article>
            <span>Publication</span>
            <strong>{form.isPublished ? "Active" : "Brouillon"}</strong>
          </article>
          <article>
            <span>Ville</span>
            <strong>{form.city || "-"}</strong>
          </article>
          <article>
            <span>WhatsApp</span>
            <strong>{form.whatsappNumber || "-"}</strong>
          </article>
        </div>
      </section>

      <section className="card merchant-surface">
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Nom de la boutique
            <input
              required
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
          </label>

          <label>
            Slug public
            <input
              required
              value={form.slug}
              onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
              placeholder="ma-boutique"
            />
          </label>

          <label>
            Numero WhatsApp
            <input
              required
              value={form.whatsappNumber}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, whatsappNumber: event.target.value }))
              }
            />
          </label>

          <label>
            Email notification stock
            <input
              type="email"
              value={form.notificationEmail}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, notificationEmail: event.target.value }))
              }
              placeholder="notifications@ma-boutique.com"
            />
          </label>

          <label>
            Ville
            <input
              value={form.city}
              onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
            />
          </label>

          <label>
            Categorie
            <input
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
            />
          </label>

          <label>
            Logo URL
            <input
              type="url"
              value={form.logoUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, logoUrl: event.target.value }))}
            />
          </label>

          <label>
            Logo depuis l&apos;appareil
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)}
            />
          </label>

          <label>
            Cover URL
            <input
              type="url"
              value={form.coverUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, coverUrl: event.target.value }))}
            />
          </label>

          <label>
            Cover depuis l&apos;appareil
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)}
            />
          </label>

          <label>
            Horaires
            <input
              value={form.openingHours}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, openingHours: event.target.value }))
              }
            />
          </label>

          <label className="full-width">
            Description
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
              rows={3}
            />
          </label>

          <label className="full-width">
            Adresse
            <textarea
              value={form.address}
              onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
              rows={2}
            />
          </label>

          <label>
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, isPublished: event.target.checked }))
              }
            />
            Boutique publiee
          </label>

          <div className="full-width">
            <button type="submit" disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>

        {shopPreview ? <p className="muted">Lien public: {shopPreview}</p> : null}
        {logoFile ? <p className="muted">Logo selectionne: {logoFile.name}</p> : null}
        {coverFile ? <p className="muted">Cover selectionnee: {coverFile.name}</p> : null}
        {success ? <p className="feedback success">{success}</p> : null}
        {error ? <p className="feedback error">{error}</p> : null}
      </section>
    </main>
  );
}

"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

const AFRICAN_DIAL_CODES = [
  { label: "CM +237", value: "+237" },
  { label: "SN +221", value: "+221" },
  { label: "CI +225", value: "+225" },
  { label: "NG +234", value: "+234" },
  { label: "GH +233", value: "+233" },
  { label: "KE +254", value: "+254" },
  { label: "MA +212", value: "+212" },
  { label: "TN +216", value: "+216" },
  { label: "DZ +213", value: "+213" },
  { label: "ET +251", value: "+251" },
  { label: "ZA +27", value: "+27" },
  { label: "UG +256", value: "+256" },
  { label: "TZ +255", value: "+255" },
  { label: "RW +250", value: "+250" },
  { label: "BF +226", value: "+226" },
  { label: "ML +223", value: "+223" },
  { label: "NE +227", value: "+227" },
  { label: "TG +228", value: "+228" },
  { label: "BJ +229", value: "+229" },
  { label: "CD +243", value: "+243" },
];

const notificationEmailPattern = "[A-Za-z0-9._-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}";

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

function splitPhoneNumber(phone: string | null | undefined) {
  const sanitized = (phone ?? "").trim();
  const sortedCodes = [...AFRICAN_DIAL_CODES].sort((a, b) => b.value.length - a.value.length);
  const matchingCode = sortedCodes.find((item) => sanitized.startsWith(item.value));

  if (matchingCode) {
    return {
      dialCode: matchingCode.value,
      localNumber: sanitized.slice(matchingCode.value.length).replace(/\D/g, ""),
    };
  }

  const genericMatch = sanitized.match(/^(\+\d{1,4})(\d+)$/);
  if (genericMatch) {
    return { dialCode: genericMatch[1], localNumber: genericMatch[2] };
  }

  return { dialCode: "+237", localNumber: sanitized.replace(/\D/g, "") };
}

function splitOpeningHours(value: string | null | undefined) {
  const sanitized = (value ?? "").trim();
  const match = sanitized.match(/^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/);

  if (!match) {
    return { openingTime: "", closingTime: "" };
  }

  return {
    openingTime: `${match[1]}:${match[2]}`,
    closingTime: `${match[3]}:${match[4]}`,
  };
}

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
  const [whatsappDialCode, setWhatsappDialCode] = useState("+237");
  const [whatsappLocalNumber, setWhatsappLocalNumber] = useState("");
  const [openingTime, setOpeningTime] = useState("");
  const [closingTime, setClosingTime] = useState("");
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
        setWhatsappDialCode("+237");
        setWhatsappLocalNumber("");
        setOpeningTime("");
        setClosingTime("");
      } else {
        const phoneParts = splitPhoneNumber(shop.whatsappNumber);
        const openingHoursParts = splitOpeningHours(shop.openingHours);

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

        setWhatsappDialCode(phoneParts.dialCode);
        setWhatsappLocalNumber(phoneParts.localNumber);
        setOpeningTime(openingHoursParts.openingTime);
        setClosingTime(openingHoursParts.closingTime);
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
      const localPhone = whatsappLocalNumber.replace(/\D/g, "").trim();
      if (localPhone.length < 6) {
        throw new Error("Le numero WhatsApp local doit contenir au moins 6 chiffres.");
      }

      if ((openingTime && !closingTime) || (!openingTime && closingTime)) {
        throw new Error("Renseigne a la fois l'heure d'ouverture et de fermeture.");
      }

      if (openingTime && closingTime && openingTime >= closingTime) {
        throw new Error("L'heure de fermeture doit etre apres l'heure d'ouverture.");
      }

      const fullWhatsApp = `${whatsappDialCode}${localPhone}`;
      const openingHours = openingTime && closingTime ? `${openingTime}-${closingTime}` : "";

      const formData = new FormData();
      formData.set("slug", normalizedSlug);
      formData.set("name", form.name);
      formData.set("notificationEmail", form.notificationEmail);
      formData.set("logoUrl", form.logoUrl);
      formData.set("coverUrl", form.coverUrl);
      formData.set("description", form.description);
      formData.set("city", form.city);
      formData.set("whatsappNumber", fullWhatsApp);
      formData.set("category", form.category);
      formData.set("address", form.address);
      formData.set("openingHours", openingHours);
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
            <strong>{whatsappLocalNumber ? `${whatsappDialCode} ${whatsappLocalNumber}` : "-"}</strong>
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
            <div className="phone-input-group">
              <select
                value={whatsappDialCode}
                onChange={(event) => setWhatsappDialCode(event.target.value)}
                aria-label="Indicatif pays"
              >
                {AFRICAN_DIAL_CODES.map((code) => (
                  <option key={code.value} value={code.value}>
                    {code.label}
                  </option>
                ))}
              </select>
              <input
                required
                inputMode="numeric"
                pattern="[0-9]{6,14}"
                title="Entrez uniquement les chiffres du numero local"
                value={whatsappLocalNumber}
                onChange={(event) =>
                  setWhatsappLocalNumber(event.target.value.replace(/\D/g, ""))
                }
                placeholder="Ex: 620778033"
              />
            </div>
          </label>

          <label>
            Email notification stock
            <input
              type="email"
              pattern={notificationEmailPattern}
              inputMode="email"
              value={form.notificationEmail}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, notificationEmail: event.target.value }))
              }
              placeholder="notifications@ma-boutique.com"
              title="Utilise un email valide (lettres, chiffres, points, tirets et @)"
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
            <div className="time-input-group">
              <input
                type="time"
                value={openingTime}
                onChange={(event) => setOpeningTime(event.target.value)}
                aria-label="Heure d'ouverture"
              />
              <span>à</span>
              <input
                type="time"
                value={closingTime}
                onChange={(event) => setClosingTime(event.target.value)}
                aria-label="Heure de fermeture"
              />
            </div>
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

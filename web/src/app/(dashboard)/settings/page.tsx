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
  address: string | null;
  city: string | null;
  postalCode: string | null;
  regionCountry: string | null;
  whatsappNumber: string;
  category: string | null;
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
  address: "",
  city: "",
  postalCode: "",
  regionCountry: "",
  whatsappNumber: "",
  category: "",
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
          address: shop.address ?? "",
          city: shop.city ?? "",
          postalCode: shop.postalCode ?? "",
          regionCountry: shop.regionCountry ?? "",
          whatsappNumber: shop.whatsappNumber,
          category: shop.category ?? "",
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
      formData.set("address", form.address);
      formData.set("city", form.city);
      formData.set("postalCode", form.postalCode);
      formData.set("regionCountry", form.regionCountry);
      formData.set("whatsappNumber", fullWhatsApp);
      formData.set("category", form.category);
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
      <main className="grid gap-2.5 p-3 sm:gap-3.5 sm:p-4 lg:gap-4 lg:p-5">
        <section className="rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_8%_16%,rgba(34,136,102,0.09)_0%,transparent_46%),linear-gradient(145deg,#ffffff_0%,#f8fbf9_100%)] p-4 sm:p-5">
          <h1 className="mb-2 text-2xl font-bold leading-tight text-slate-900 sm:text-2.5xl">Parametres boutique</h1>
          <p className="text-sm text-slate-600 sm:text-base">Chargement...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="grid gap-2.5 p-3 sm:gap-3.5 sm:p-4 lg:gap-4 lg:p-5">
      <section className="rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_8%_16%,rgba(34,136,102,0.09)_0%,transparent_46%),linear-gradient(145deg,#ffffff_0%,#f8fbf9_100%)] p-4 sm:p-5">
        <h1 className="mb-2 text-2xl font-bold leading-tight text-slate-900 sm:text-2.5xl">Parametres boutique</h1>
        <p className="mb-4 max-w-2xl text-sm text-slate-600 sm:text-base">Complete ton profil boutique pour activer la vitrine publique client.</p>

        <div className="mt-3 grid gap-2 grid-cols-2 sm:gap-2.5 lg:grid-cols-4">
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
            <span className="block text-xs font-semibold text-slate-600 sm:text-sm">Slug public</span>
            <strong className="text-base font-bold text-slate-900 sm:text-lg truncate">{form.slug || "-"}</strong>
          </article>
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
            <span className="block text-xs font-semibold text-slate-600 sm:text-sm">Publication</span>
            <strong className="text-base font-bold text-slate-900 sm:text-lg">{form.isPublished ? "Active" : "Brouillon"}</strong>
          </article>
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
            <span className="block text-xs font-semibold text-slate-600 sm:text-sm">Ville</span>
            <strong className="text-base font-bold text-slate-900 sm:text-lg truncate">{form.city || "-"}</strong>
          </article>
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
            <span className="block text-xs font-semibold text-slate-600 sm:text-sm">WhatsApp</span>
            <strong className="text-base font-bold text-slate-900 sm:text-lg truncate">{whatsappLocalNumber ? `${whatsappDialCode} ${whatsappLocalNumber}` : "-"}</strong>
          </article>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 sm:p-5">
        <form className="mt-3 grid gap-2 grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] lg:grid-cols-[repeat(auto-fit,minmax(250px,1fr))] lg:gap-3" onSubmit={handleSubmit}>
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-slate-700 sm:text-sm">Nom de la boutique</span>
            <input
              required
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 sm:px-3 sm:py-2.5 sm:text-base"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-semibold text-slate-700 sm:text-sm">Slug public</span>
            <input
              required
              value={form.slug}
              onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
              placeholder="ma-boutique"
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 sm:px-3 sm:py-2.5 sm:text-base"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-semibold text-slate-700 sm:text-sm">Numero WhatsApp</span>
            <div className="flex gap-2">
              <select
                value={whatsappDialCode}
                onChange={(event) => setWhatsappDialCode(event.target.value)}
                aria-label="Indicatif pays"
                className="flex-shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 sm:px-3 sm:py-2.5 sm:text-base"
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
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 sm:px-3 sm:py-2.5 sm:text-base"
              />
            </div>
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-semibold text-slate-700 sm:text-sm">Email notification stock</span>
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
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 sm:px-3 sm:py-2.5 sm:text-base"
            />
          </label>

          <label className="col-span-full grid gap-1">
            <span className="text-xs font-semibold text-slate-700 sm:text-sm">Adresse</span>
            <textarea
              value={form.address}
              onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
              rows={2}
              placeholder="Rue, numero, appartement, batiment..."
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 sm:px-3 sm:py-2.5 sm:text-base"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-semibold text-slate-700 sm:text-sm">Ville</span>
            <input
              value={form.city}
              onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
              placeholder="Ex: Douala"
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 sm:px-3 sm:py-2.5 sm:text-base"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-semibold text-slate-700 sm:text-sm">Code postal</span>
            <input
              value={form.postalCode}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, postalCode: event.target.value }))
              }
              placeholder="Ex: 12500"
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 sm:px-3 sm:py-2.5 sm:text-base"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-semibold text-slate-700 sm:text-sm">Pays / Region</span>
            <input
              value={form.regionCountry}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, regionCountry: event.target.value }))
              }
              placeholder="Ex: Cameroun / Littoral"
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 sm:px-3 sm:py-2.5 sm:text-base"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-semibold text-slate-700 sm:text-sm">Categorie</span>
            <input
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 sm:px-3 sm:py-2.5 sm:text-base"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-semibold text-slate-700 sm:text-sm">Logo URL</span>
            <input
              type="url"
              value={form.logoUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, logoUrl: event.target.value }))}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 sm:px-3 sm:py-2.5 sm:text-base"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-semibold text-slate-700 sm:text-sm">Logo depuis l&apos;appareil</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 file:rounded-lg file:border file:border-slate-200 file:bg-slate-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-semibold text-slate-700 sm:text-sm">Cover URL</span>
            <input
              type="url"
              value={form.coverUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, coverUrl: event.target.value }))}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 sm:px-3 sm:py-2.5 sm:text-base"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-semibold text-slate-700 sm:text-sm">Cover depuis l&apos;appareil</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 file:rounded-lg file:border file:border-slate-200 file:bg-slate-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-semibold text-slate-700 sm:text-sm">Horaires</span>
            <div className="flex gap-2 items-end">
              <input
                type="time"
                value={openingTime}
                onChange={(event) => setOpeningTime(event.target.value)}
                aria-label="Heure d'ouverture"
                className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 sm:px-3 sm:py-2.5 sm:text-base"
              />
              <span className="flex-shrink-0 text-sm text-slate-600">à</span>
              <input
                type="time"
                value={closingTime}
                onChange={(event) => setClosingTime(event.target.value)}
                aria-label="Heure de fermeture"
                className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 sm:px-3 sm:py-2.5 sm:text-base"
              />
            </div>
          </label>

          <label className="col-span-full grid gap-1">
            <span className="text-xs font-semibold text-slate-700 sm:text-sm">Description</span>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
              rows={3}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 sm:px-3 sm:py-2.5 sm:text-base"
            />
          </label>

          <label className="col-span-full flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, isPublished: event.target.checked }))
              }
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm font-semibold text-slate-700 sm:text-base">Boutique publiee</span>
          </label>

          <div className="col-span-full">
            <button type="submit" disabled={saving} className="rounded-lg border border-emerald-600 bg-gradient-to-b from-emerald-600 to-emerald-700 px-3 py-2 font-bold text-white transition-colors hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-65 sm:px-4 sm:py-2.5">
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>

        {shopPreview ? <p className="mt-3 text-xs text-slate-600 sm:text-sm">Lien public: {shopPreview}</p> : null}
        {logoFile ? <p className="mt-2 text-xs text-slate-600 sm:text-sm">Logo selectionne: {logoFile.name}</p> : null}
        {coverFile ? <p className="mt-2 text-xs text-slate-600 sm:text-sm">Cover selectionnee: {coverFile.name}</p> : null}
        {success ? <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 sm:py-2.5 sm:text-base">{success}</p> : null}
        {error ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:py-2.5 sm:text-base">{error}</p> : null}
      </section>
    </main>
  );
}

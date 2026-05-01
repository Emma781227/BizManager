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

type PhoneParts = { dialCode: string; localNumber: string };
type OpeningHoursParts = { openingTime: string; closingTime: string };
type FileState = { logoFile: File | null; coverFile: File | null };
type UIState = { loading: boolean; saving: boolean; error: string | null; success: string | null };

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
  const [phone, setPhone] = useState<PhoneParts>({ dialCode: "+237", localNumber: "" });
  const [hours, setHours] = useState<OpeningHoursParts>({ openingTime: "", closingTime: "" });
  const [files, setFiles] = useState<FileState>({ logoFile: null, coverFile: null });
  const [uiState, setUIState] = useState<UIState>({ loading: true, saving: false, error: null, success: null });
  const [searchQuery, setSearchQuery] = useState("");
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

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
      return "/shop/mon-aventure";
    }

    return `/shop/${normalizedSlug}`;
  }, [normalizedSlug]);

  const publicDomain = useMemo(() => {
    if (!normalizedSlug) {
      return "monaventure.bizmanager.shop";
    }

    return `${normalizedSlug}.bizmanager.shop`;
  }, [normalizedSlug]);

  async function loadShop() {
    setUIState(prev => ({ ...prev, loading: true, error: null }));

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
        setPhone({ dialCode: "+237", localNumber: "" });
        setHours({ openingTime: "", closingTime: "" });
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

        setPhone(phoneParts);
        setHours(openingHoursParts);
      }
    } catch (loadError) {
      setUIState(prev => ({
        ...prev,
        error: loadError instanceof Error ? loadError.message : "Erreur de chargement"
      }));
    } finally {
      setUIState(prev => ({ ...prev, loading: false }));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUIState(prev => ({ ...prev, saving: true, error: null, success: null }));

    try {
      const localPhone = phone.localNumber.replace(/\D/g, "").trim();
      if (localPhone.length < 6) {
        throw new Error("Le numero WhatsApp local doit contenir au moins 6 chiffres.");
      }

      if ((hours.openingTime && !hours.closingTime) || (!hours.openingTime && hours.closingTime)) {
        throw new Error("Renseigne a la fois l'heure d'ouverture et de fermeture.");
      }

      if (hours.openingTime && hours.closingTime && hours.openingTime >= hours.closingTime) {
        throw new Error("L'heure de fermeture doit etre apres l'heure d'ouverture.");
      }

      const fullWhatsApp = `${phone.dialCode}${localPhone}`;
      const openingHours = hours.openingTime && hours.closingTime ? `${hours.openingTime}-${hours.closingTime}` : "";

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
      if (files.logoFile) {
        formData.set("logoFile", files.logoFile);
      }
      if (files.coverFile) {
        formData.set("coverFile", files.coverFile);
      }

      const response = await fetch("/api/shop", {
        method: "PUT",
        body: formData,
      });
      const raw = await response.text();
      const json = parseJsonSafe<{ data?: Shop; error?: string }>(raw) ?? {};

      if (!response.ok) {
        throw new Error(json.error ?? `Impossible d'enregistrer la boutique (HTTP ${response.status})`);
      }

      setUIState(prev => ({ ...prev, success: "Profil boutique enregistre." }));
      setFiles({ logoFile: null, coverFile: null });
      await loadShop();
    } catch (saveError) {
      setUIState(prev => ({
        ...prev,
        error: saveError instanceof Error ? saveError.message : "Erreur inconnue"
      }));
    } finally {
      setUIState(prev => ({ ...prev, saving: false }));
    }
  }

  if (uiState.loading) {
    return (
      <main className="min-h-screen bg-white px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center">
            <p className="text-sm text-slate-600">Chargement des paramètres...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Rechercher un produit, une commande, un client…"
                className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
              <svg className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative inline-flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-slate-100">
              <svg className="h-5 w-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute right-2 top-2 inline-flex h-2.5 w-2.5 rounded-full bg-rose-600" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="inline-flex items-center gap-2.5 rounded-full px-3 py-1.5 transition hover:bg-slate-100"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">MA</div>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-semibold text-slate-900">Mon Aventure</p>
                  <p className="text-xs text-slate-500">Marchand</p>
                </div>
                <svg className={`h-4 w-4 text-slate-600 transition ${profileDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-lg">
                  <a href="#profile" className="block rounded-t-xl px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50">Mon profil</a>
                  <a href="#settings" className="block px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50">Paramètres</a>
                  <a href="#help" className="block px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50">Aide</a>
                  <form action="/api/auth/logout" method="post">
                    <button type="submit" className="w-full rounded-b-xl px-4 py-2.5 text-left text-sm text-rose-600 transition hover:bg-slate-50">Déconnexion</button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-white px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-4 text-left">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Ma boutique</h1>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">Gérez votre vitrine en ligne et les informations de votre commerce</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-600 sm:text-sm">Visites de la boutique</p>
                  <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">5 842</p>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" />
                    <circle cx="12" cy="12" r="3" strokeWidth="1.8" />
                  </svg>
                </span>
              </div>
              <p className="mt-2 text-xs font-semibold text-emerald-600">+18,7%</p>
              <p className="mt-1 text-xs text-slate-500">vs 7 derniers jours</p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-600 sm:text-sm">Taux de conversion</p>
                  <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">3,6%</p>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5h16l-6 7v6l-4 1v-7L4 5z" />
                  </svg>
                </span>
              </div>
              <p className="mt-2 text-xs font-semibold text-emerald-600">+0,6 pt</p>
              <p className="mt-1 text-xs text-slate-500">vs 7 derniers jours</p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-600 sm:text-sm">Produits publiés</p>
                  <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">318</p>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3l8 4.5-8 4.5-8-4.5L12 3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7.5V16.5L12 21l8-4.5V7.5" />
                  </svg>
                </span>
              </div>
              <p className="mt-2 text-xs font-semibold text-emerald-600">+6,3%</p>
              <p className="mt-1 text-xs text-slate-500">vs hier</p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-600 sm:text-sm">Partages WhatsApp</p>
                  <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">126</p>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3a9 9 0 00-7.78 13.53L3 21l4.63-1.19A9 9 0 1012 3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.5 8.8c.2-.5.5-.5.7-.5h.6c.2 0 .4.1.5.4l.8 2c.1.2.1.4 0 .6l-.5.8c.4.8 1.1 1.5 1.9 1.9l.8-.5c.2-.1.4-.1.6 0l2 .8c.3.1.4.3.4.5v.6c0 .2 0 .5-.5.7-.6.3-1.4.4-2.5 0-1.1-.4-2.5-1.2-3.6-2.3-1.1-1.1-1.9-2.5-2.3-3.6-.4-1.1-.3-1.9 0-2.5z" />
                  </svg>
                </span>
              </div>
              <p className="mt-2 text-xs font-semibold text-emerald-600">+21,2%</p>
              <p className="mt-1 text-xs text-slate-500">vs 7 derniers jours</p>
            </article>
          </div>

          <article className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="relative h-44 w-full overflow-hidden sm:h-52">
              {form.coverUrl ? (
                <img src={form.coverUrl} alt="Bannière boutique" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,_#bbf7d0,_#86efac_30%,_#34d399_60%,_#065f46)]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 to-transparent" />
            </div>

            <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_220px] lg:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-emerald-600 text-base font-bold text-white shadow-sm">
                    MA
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-extrabold tracking-tight text-slate-950">Mon Aventure</h2>
                      <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Publiée</span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-600">{form.category || "Beauté & Bien-être"}</p>
                  </div>
                </div>

                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z" />
                  </svg>
                  Boutique vérifiée
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-emerald-700">{publicDomain}</span>
                  <button
                    type="button"
                    onClick={() => void navigator.clipboard.writeText(publicDomain)}
                    className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-700 transition hover:bg-emerald-100"
                    aria-label="Copier le lien public"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2" />
                      <rect x="8" y="8" width="12" height="12" rx="2" ry="2" strokeWidth={1.8} />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:pt-1">
                <a href={shopPreview} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">Voir la boutique</a>
                <button type="button" className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50">Partager</button>
                <button type="button" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Modifier</button>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <form className="grid gap-6 lg:grid-cols-[1fr_380px]" onSubmit={handleSubmit}>
            <div className="space-y-6">
              <article className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
                <h2 className="mb-4 text-lg font-semibold text-slate-950 sm:text-xl">Informations générales</h2>
                <div className="space-y-4">
                  <label className="grid gap-1.5">
                    <span className="text-sm font-semibold text-slate-700">Nom de la boutique</span>
                    <input required value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                  </label>

                  <label className="grid gap-1.5">
                    <span className="text-sm font-semibold text-slate-700">Slug public (URL)</span>
                    <input required value={form.slug} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} placeholder="ma-boutique" className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                    <p className="text-xs text-slate-500 mt-1">{shopPreview}</p>
                  </label>

                  <label className="grid gap-1.5">
                    <span className="text-sm font-semibold text-slate-700">Description</span>
                    <textarea value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} rows={3} className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                  </label>
                </div>
              </article>

              <article className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
                <h2 className="mb-4 text-lg font-semibold text-slate-950 sm:text-xl">Adresse & Contact</h2>
                <div className="space-y-4">
                  <label className="grid gap-1.5">
                    <span className="text-sm font-semibold text-slate-700">Adresse complète</span>
                    <textarea value={form.address} onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))} rows={2} placeholder="Rue, numéro, appartement, bâtiment..." className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-1.5">
                      <span className="text-sm font-semibold text-slate-700">Ville</span>
                      <input value={form.city} onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))} placeholder="Ex: Douala" className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-sm font-semibold text-slate-700">Code postal</span>
                      <input value={form.postalCode} onChange={(event) => setForm((prev) => ({ ...prev, postalCode: event.target.value }))} placeholder="Ex: 12500" className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                    </label>
                  </div>

                  <label className="grid gap-1.5">
                    <span className="text-sm font-semibold text-slate-700">Pays / Région</span>
                    <input value={form.regionCountry} onChange={(event) => setForm((prev) => ({ ...prev, regionCountry: event.target.value }))} placeholder="Ex: Cameroun / Littoral" className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                  </label>

                  <label className="grid gap-1.5">
                    <span className="text-sm font-semibold text-slate-700">Numéro WhatsApp</span>
                    <div className="flex gap-2">
                      <select value={phone.dialCode} onChange={(event) => setPhone(prev => ({ ...prev, dialCode: event.target.value }))} aria-label="Indicatif pays" className="flex-shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">
                        {AFRICAN_DIAL_CODES.map((code) => (
                          <option key={code.value} value={code.value}>{code.label}</option>
                        ))}
                      </select>
                      <input required inputMode="numeric" pattern="[0-9]{6,14}" value={phone.localNumber} onChange={(event) => setPhone(prev => ({ ...prev, localNumber: event.target.value.replace(/\D/g, "") }))} placeholder="620778033" className="flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                    </div>
                  </label>

                  <label className="grid gap-1.5">
                    <span className="text-sm font-semibold text-slate-700">Email de notification</span>
                    <input type="email" pattern={notificationEmailPattern} inputMode="email" value={form.notificationEmail} onChange={(event) => setForm((prev) => ({ ...prev, notificationEmail: event.target.value }))} placeholder="notifications@ma-boutique.com" className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                  </label>
                </div>
              </article>

              <article id="horaires-edition" className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
                <h2 className="mb-4 text-lg font-semibold text-slate-950 sm:text-xl">Horaires d'ouverture</h2>
                <div className="space-y-4">
                  <div className="flex items-end gap-2">
                    <label className="grid flex-1 gap-1.5">
                      <span className="text-sm font-semibold text-slate-700">Ouverture</span>
                      <input type="time" value={hours.openingTime} onChange={(event) => setHours(prev => ({ ...prev, openingTime: event.target.value }))} aria-label="Heure d'ouverture" className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                    </label>
                    <span className="mb-2.5 text-slate-400">à</span>
                    <label className="grid flex-1 gap-1.5">
                      <span className="text-sm font-semibold text-slate-700">Fermeture</span>
                      <input type="time" value={hours.closingTime} onChange={(event) => setHours(prev => ({ ...prev, closingTime: event.target.value }))} aria-label="Heure de fermeture" className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                    </label>
                  </div>

                  <label className="grid gap-1.5">
                    <span className="text-sm font-semibold text-slate-700">Catégorie</span>
                    <input value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))} placeholder="Ex: Beauté & Bien-être" className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                  </label>
                </div>
              </article>

              <article className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
                <h2 className="mb-4 text-lg font-semibold text-slate-950 sm:text-xl">Logo de la boutique</h2>
                <div className="space-y-4">
                  <label className="grid gap-1.5">
                    <span className="text-sm font-semibold text-slate-700">URL du logo</span>
                    <input type="url" value={form.logoUrl} onChange={(event) => setForm((prev) => ({ ...prev, logoUrl: event.target.value }))} className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-sm font-semibold text-slate-700">Télécharger le logo</span>
                    <input type="file" accept="image/*" onChange={(event) => setFiles(prev => ({ ...prev, logoFile: event.target.files?.[0] ?? null }))} className="block w-full text-sm text-slate-600 file:cursor-pointer file:rounded-lg file:border file:border-slate-200 file:bg-slate-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-100" />
                    {files.logoFile && <p className="text-xs text-emerald-700">✓ {files.logoFile.name}</p>}
                  </label>
                </div>
              </article>

              <article className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
                <h2 className="mb-4 text-lg font-semibold text-slate-950 sm:text-xl">Bannière de couverture</h2>
                <div className="space-y-4">
                  <label className="grid gap-1.5">
                    <span className="text-sm font-semibold text-slate-700">URL de la bannière</span>
                    <input type="url" value={form.coverUrl} onChange={(event) => setForm((prev) => ({ ...prev, coverUrl: event.target.value }))} className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-sm font-semibold text-slate-700">Télécharger la bannière</span>
                    <input type="file" accept="image/*" onChange={(event) => setFiles(prev => ({ ...prev, coverFile: event.target.files?.[0] ?? null }))} className="block w-full text-sm text-slate-600 file:cursor-pointer file:rounded-lg file:border file:border-slate-200 file:bg-slate-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-100" />
                    {files.coverFile && <p className="text-xs text-emerald-700">✓ {files.coverFile.name}</p>}
                  </label>
                </div>
              </article>

              <article className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
                <h2 className="mb-4 text-lg font-semibold text-slate-950 sm:text-xl">Statut de publication</h2>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 transition hover:bg-slate-100">
                  <input type="checkbox" checked={form.isPublished} onChange={(event) => setForm((prev) => ({ ...prev, isPublished: event.target.checked }))} className="h-5 w-5 rounded border-slate-300 text-emerald-600 accent-emerald-600" />
                  <div>
                    <p className="font-semibold text-slate-900">Votre boutique est en ligne</p>
                    <p className="text-xs text-slate-600">Les clients peuvent accéder à votre boutique</p>
                  </div>
                </label>
              </article>

              <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-950 sm:text-xl">Performance récente</h2>
                  <select defaultValue="7d" className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" aria-label="Filtre période performance">
                    <option value="7d">7 derniers jours</option>
                  </select>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 sm:p-4">
                  <svg viewBox="0 0 560 220" className="h-auto w-full" role="img" aria-label="Graphique visites et commandes sur 7 jours">
                    <line x1="48" y1="20" x2="48" y2="180" stroke="#cbd5e1" strokeWidth="1" />
                    <line x1="48" y1="180" x2="540" y2="180" stroke="#cbd5e1" strokeWidth="1" />
                    <path d="M48 152 L126 138 L204 142 L282 118 L360 94 L438 82 L516 66" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M48 166 L126 160 L204 156 L282 150 L360 144 L438 136 L516 130" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 6" />
                    <text x="48" y="202" fontSize="11" fill="#64748b">Lun</text>
                    <text x="126" y="202" fontSize="11" fill="#64748b">Mar</text>
                    <text x="204" y="202" fontSize="11" fill="#64748b">Mer</text>
                    <text x="282" y="202" fontSize="11" fill="#64748b">Jeu</text>
                    <text x="360" y="202" fontSize="11" fill="#64748b">Ven</text>
                    <text x="438" y="202" fontSize="11" fill="#64748b">Sam</text>
                    <text x="516" y="202" fontSize="11" fill="#64748b">Dim</text>
                  </svg>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-2"><span className="h-2 w-6 rounded-full bg-emerald-500" aria-hidden />Visites</span>
                    <span className="inline-flex items-center gap-2"><span className="h-2 w-6 rounded-full border border-slate-400 bg-slate-300/50" aria-hidden />Commandes</span>
                  </div>
                </div>
              </article>

              <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 sm:text-base">Conseils pour améliorer votre boutique</h3>
                <div className="mt-4 space-y-2">
                  {[
                    { title: "Ajoutez plus de produits", text: "les boutiques avec plus de 20 produits reçoivent plus de visites" },
                    { title: "Activez les promos et réductions", text: "attirez plus de clients avec des offres spéciales" },
                    { title: "Partagez votre boutique sur WhatsApp", text: "augmentez votre visibilité en un clic" },
                    { title: "Maintenez vos informations à jour", text: "des informations complètes inspirent confiance" },
                  ].map((tip) => (
                    <button key={tip.title} type="button" className="flex w-full items-start gap-3 rounded-2xl border border-transparent px-3 py-3 text-left transition hover:border-slate-200 hover:bg-slate-50">
                      <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3l8 4.5-8 4.5-8-4.5L12 3z" />
                        </svg>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-slate-900">{tip.title}</span>
                        <span className="mt-0.5 block text-xs leading-5 text-slate-500">{tip.text}</span>
                      </span>
                      <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </button>
                  ))}
                </div>
              </article>

              <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-900 sm:text-base">Personnalisation</h3>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">Actif</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Thème de couleur</p>
                    <div className="mt-3 grid grid-cols-6 gap-2">
                      {["vert", "bleu", "violet", "orange", "rouge", "gris foncé"].map((label) => (
                        <button key={label} type="button" className="flex flex-col items-center gap-1" aria-label={`Choisir le thème ${label}`}>
                          <span className={`h-8 w-8 rounded-full ${label === "vert" ? "bg-emerald-500" : label === "bleu" ? "bg-sky-500" : label === "violet" ? "bg-violet-500" : label === "orange" ? "bg-orange-500" : label === "rouge" ? "bg-rose-500" : "bg-slate-700"} ring-2 ring-white shadow-sm`} />
                          <span className="text-[10px] font-medium text-slate-500">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Logo de la boutique</p>
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white shadow-sm">{form.name ? form.name.slice(0, 1).toUpperCase() : "M"}</div>
                        <button type="button" className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">Changer</button>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Bannière de couverture</p>
                      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
                        {form.coverUrl ? <img src={form.coverUrl} alt="Miniature de la bannière" className="h-16 w-full object-cover" /> : <div className="h-16 w-full bg-gradient-to-r from-emerald-100 via-slate-100 to-emerald-50" />}
                      </div>
                      <button type="button" className="mt-3 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">Changer</button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Statut de publication</p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Votre boutique est en ligne</p>
                        <p className="text-xs text-slate-500">Visible par vos clients sur le web</p>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input type="checkbox" checked={form.isPublished} onChange={(event) => setForm((prev) => ({ ...prev, isPublished: event.target.checked }))} className="peer sr-only" />
                        <span className="h-6 w-11 rounded-full bg-emerald-500 transition peer-not-checked:bg-slate-300" />
                        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
                      </label>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Dernière mise à jour</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">1 mai 2026 à 14:32</p>
                  </div>

                  <button type="button" className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">Modifier l’apparence</button>
                </div>
              </article>

              <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-900 sm:text-base">Partage & QR Code</h3>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Lien public</p>
                    <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <input type="text" value={publicDomain} readOnly className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none" />
                      <button type="button" onClick={() => void navigator.clipboard.writeText(publicDomain)} className="inline-flex items-center justify-center rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100">Copier le lien</button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">QR code</p>
                    <div className="mt-3 flex justify-center">
                      <div className="grid h-36 w-36 grid-cols-6 gap-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                        {Array.from({ length: 36 }).map((_, index) => (
                          <span key={index} className={`rounded-sm ${index % 4 === 0 || index % 7 === 0 ? "bg-slate-900" : "bg-slate-200"}`} />
                        ))}
                      </div>
                    </div>
                    <button type="button" className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100">Télécharger le QR code</button>
                  </div>

                  <p className="text-xs leading-5 text-slate-500">Partagez votre boutique avec vos clients sur WhatsApp, réseaux sociaux et plus encore.</p>
                </div>
              </article>

              <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 sm:text-base">Horaires d'ouverture</h3>
                <div className="mt-4 space-y-2.5">
                  {[["Lundi", "08:00 - 18:00"], ["Mardi", "08:00 - 18:00"], ["Mercredi", "08:00 - 18:00"], ["Jeudi", "08:00 - 18:00"], ["Vendredi", "08:00 - 19:00"], ["Samedi", "09:00 - 16:00"], ["Dimanche", "Fermé"]].map(([day, schedule]) => (
                    <div key={day} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-b-0 last:pb-0">
                      <span className="text-sm font-medium text-slate-700">{day}</span>
                      <span className={`text-sm font-semibold ${schedule === "Fermé" ? "text-slate-500" : "text-slate-600"}`}>{schedule}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 sm:text-base">Aperçu de la vitrine</h3>
                <div className="mt-4 flex justify-center">
                  <div className="relative w-full max-w-[290px]">
                    <div className="mx-auto w-[290px] rounded-[2.25rem] border-[10px] border-slate-950 bg-slate-950 shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
                      <div className="relative overflow-hidden rounded-[1.65rem] bg-white">
                        <div className="absolute left-1/2 top-2 z-10 h-1.5 w-24 -translate-x-1/2 rounded-full bg-slate-200" />
                        <div className="relative h-40 overflow-hidden">
                          {form.coverUrl ? <img src={form.coverUrl} alt="Aperçu couverture boutique" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-[radial-gradient(circle_at_top,_#bbf7d0,_#86efac_35%,_#34d399_65%,_#065f46)]" />}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-slate-950/10 to-transparent" />
                          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/80">Boutique publique</p>
                              <p className="mt-1 text-lg font-extrabold leading-tight text-white">{form.name || "Mon Aventure"}</p>
                            </div>
                            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">Publiée</span>
                          </div>
                        </div>
                        <div className="space-y-3 px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white shadow-sm">MA</div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-950">{form.name || "Mon Aventure"}</p>
                              <p className="text-xs text-slate-500">{form.category || "Beauté & Bien-être"}</p>
                            </div>
                          </div>
                          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Mini storefront</p>
                                <p className="mt-1 text-xs font-semibold text-slate-700">{form.description || "Découvrez nos produits et nos meilleures sélections."}</p>
                              </div>
                              <svg className="h-5 w-5 shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7h18M5 7l1 12h12l1-12M9 7V5a3 3 0 016 0v2" />
                              </svg>
                            </div>
                            <div className="mt-3 grid grid-cols-3 gap-2">
                              {["Soins", "Promo", "Nouveautés"].map((label) => (
                                <div key={label} className="rounded-xl bg-white px-2 py-2 text-center text-[10px] font-semibold text-slate-600 shadow-sm">{label}</div>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center justify-between rounded-2xl border border-slate-100 px-3 py-2.5">
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Lien public</p>
                              <p className="truncate text-xs font-semibold text-emerald-700">{shopPreview}</p>
                            </div>
                            <button type="button" onClick={() => void navigator.clipboard.writeText(shopPreview)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100" aria-label="Copier le lien de la boutique">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2" />
                                <rect x="8" y="8" width="12" height="12" rx="2" ry="2" strokeWidth={1.8} />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>

              <article className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="mb-3 text-sm font-semibold text-slate-700">Partage & QR Code</h3>
                <div className="space-y-3">
                  <div>
                    <p className="mb-1 text-xs text-slate-600">Lien public de votre boutique :</p>
                    <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2">
                      <input type="text" value={publicDomain} readOnly className="flex-1 truncate bg-slate-50 text-xs outline-none" />
                      <button type="button" onClick={() => void navigator.clipboard.writeText(publicDomain)} className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100">Copier le lien</button>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mx-auto grid h-32 w-32 grid-cols-6 gap-1 rounded-2xl border border-slate-200 bg-white p-3">
                      {Array.from({ length: 36 }).map((_, index) => (
                        <span key={index} className={`rounded-sm ${index % 4 === 0 || index % 7 === 0 ? "bg-slate-900" : "bg-slate-200"}`} />
                      ))}
                    </div>
                    <button type="button" className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100">Télécharger le QR code</button>
                  </div>
                  <p className="text-xs leading-5 text-slate-500">Partagez votre boutique avec vos clients sur WhatsApp, réseaux sociaux et plus encore.</p>
                </div>
              </article>

              {uiState.error && <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">{uiState.error}</div>}
              {uiState.success && <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">✓ {uiState.success}</div>}

              <button type="submit" disabled={uiState.saving} className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-65">
                {uiState.saving ? "Enregistrement..." : "Enregistrer les modifications"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

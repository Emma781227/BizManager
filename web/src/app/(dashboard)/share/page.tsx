"use client";

import { useEffect, useMemo, useState } from "react";

type Shop = {
  slug: string;
  name: string;
  isPublished: boolean;
};

export default function SharePage() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const response = await fetch("/api/shop", { cache: "no-store" });
      const json = await response.json().catch(() => ({}));
      if (response.ok) {
        setShop((json.data as Shop | null) ?? null);
      }
      setLoading(false);
    })();
  }, []);

  const publicUrl = useMemo(() => {
    if (!shop?.slug) {
      return "";
    }

    if (typeof window === "undefined") {
      return `/shop/${shop.slug}`;
    }

    return `${window.location.origin}/shop/${shop.slug}`;
  }, [shop?.slug]);

  async function copyLink() {
    if (!publicUrl) {
      return;
    }

    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="grid gap-2.5 p-3 sm:gap-3.5 sm:p-4 lg:gap-4 lg:p-5">
      <section className="rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_8%_16%,rgba(34,136,102,0.09)_0%,transparent_46%),linear-gradient(145deg,#ffffff_0%,#f8fbf9_100%)] p-4 sm:p-5">
        <h1 className="mb-2 line-clamp-2 text-2xl font-bold leading-tight text-slate-900 sm:text-2.5xl">Partage boutique</h1>
        <p className="text-sm text-slate-600 sm:text-base">Partage ton lien public sur WhatsApp, Instagram et Facebook.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 sm:p-5">
        {loading ? <p className="text-sm text-slate-500">Chargement...</p> : null}

        {!loading && !shop ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:py-2.5 sm:text-base">
            Aucune boutique configuree. Complete d&apos;abord l&apos;ecran Boutique.
          </p>
        ) : null}

        {!loading && shop ? (
          <div className="grid gap-2">
            <p>
              <strong className="font-bold text-slate-900">{shop.name}</strong>
            </p>
            <p className="text-sm text-slate-600">Statut: {shop.isPublished ? "Publiee" : "Brouillon"}</p>
            <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-3.5">
              <p className="mb-2 text-sm font-bold text-slate-900 sm:text-base">Lien public</p>
              <input readOnly value={publicUrl} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm sm:px-3.5 sm:py-2.5 sm:text-base" />
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button type="button" onClick={copyLink} className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-emerald-600 px-3 py-2 font-semibold text-white transition-colors hover:bg-emerald-700 sm:px-4">
                {copied ? "Copie" : "Copier le lien"}
              </button>
              <a href={`https://wa.me/?text=${encodeURIComponent(publicUrl)}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 font-semibold text-slate-900 transition-colors hover:bg-slate-200 sm:px-4">
                Partager sur WhatsApp
              </a>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

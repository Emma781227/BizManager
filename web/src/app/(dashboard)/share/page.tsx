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
    <main className="page-stack merchant-grid">
      <section className="card merchant-hero">
        <h1>Partage boutique</h1>
        <p>Partage ton lien public sur WhatsApp, Instagram et Facebook.</p>
      </section>

      <section className="card merchant-surface">
        {loading ? <p className="muted">Chargement...</p> : null}

        {!loading && !shop ? (
          <p className="feedback error">
            Aucune boutique configuree. Complete d&apos;abord l&apos;ecran Boutique.
          </p>
        ) : null}

        {!loading && shop ? (
          <div className="stack-tight">
            <p>
              <strong>{shop.name}</strong>
            </p>
            <p className="muted">Statut: {shop.isPublished ? "Publiee" : "Brouillon"}</p>
            <div className="panel">
              <p className="panel-title">Lien public</p>
              <input readOnly value={publicUrl} />
            </div>
            <div className="inline-form">
              <button type="button" onClick={copyLink}>
                {copied ? "Copie" : "Copier le lien"}
              </button>
              <a href={`https://wa.me/?text=${encodeURIComponent(publicUrl)}`} target="_blank" rel="noreferrer">
                Partager sur WhatsApp
              </a>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

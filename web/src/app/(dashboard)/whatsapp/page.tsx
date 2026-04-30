"use client";

import { FormEvent, useState } from "react";

type PreviewResponse = {
  orderId: string;
  customerName: string;
  customerPhone: string;
  message: string;
  whatsappUrl: string;
};

export default function WhatsAppPage() {
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/whatsapp/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      });
      const payload = (await response.json()) as PreviewResponse | { error?: string };

      if (!response.ok || "error" in payload) {
        throw new Error(("error" in payload && payload.error) || "Impossible de generer le message");
      }

      setPreview(payload as PreviewResponse);
    } catch (err) {
      setPreview(null);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid gap-2.5 p-3 sm:gap-3.5 sm:p-4 lg:gap-4 lg:p-5">
      <section className="rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_8%_16%,rgba(34,136,102,0.09)_0%,transparent_46%),linear-gradient(145deg,#ffffff_0%,#f8fbf9_100%)] p-4 sm:p-5">
        <h1 className="mb-2 text-2xl font-bold leading-tight text-slate-900 sm:text-2.5xl">WhatsApp</h1>
        <p className="mb-4 max-w-2xl text-sm text-slate-600 sm:text-base">Genere un message client depuis une commande existante.</p>

        <div className="mt-3 grid gap-2 grid-cols-2 sm:gap-2.5 lg:grid-cols-4">
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
            <span className="block text-xs font-semibold text-slate-600 sm:text-sm">Canal</span>
            <strong className="text-base font-bold text-slate-900 sm:text-lg">WhatsApp</strong>
          </article>
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
            <span className="block text-xs font-semibold text-slate-600 sm:text-sm">Commande cible</span>
            <strong className="text-base font-bold text-slate-900 sm:text-lg truncate">{orderId || "-"}</strong>
          </article>
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
            <span className="block text-xs font-semibold text-slate-600 sm:text-sm">Apercu</span>
            <strong className="text-base font-bold text-slate-900 sm:text-lg">{preview ? "Pret" : "En attente"}</strong>
          </article>
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
            <span className="block text-xs font-semibold text-slate-600 sm:text-sm">Etat</span>
            <strong className="text-base font-bold text-slate-900 sm:text-lg">{loading ? "Generation" : "Disponible"}</strong>
          </article>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 sm:p-5">
        <form className="mt-3 grid gap-2 grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] lg:grid-cols-[repeat(auto-fit,minmax(250px,1fr))] lg:gap-3" onSubmit={handleSubmit}>
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-slate-700 sm:text-sm">Order ID</span>
            <input
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              placeholder="Ex: cm0abc123..."
              required
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 sm:px-3 sm:py-2.5 sm:text-base"
            />
          </label>
          <div className="col-span-full">
            <button type="submit" disabled={loading} className="w-full rounded-lg border border-emerald-600 bg-gradient-to-b from-emerald-600 to-emerald-700 px-3 py-2 font-bold text-white transition-colors hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-65 sm:w-auto sm:px-4 sm:py-2.5">
              {loading ? "Generation..." : "Generer le message"}
            </button>
          </div>
        </form>

        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:py-2.5 sm:text-base">{error}</p>}
      </section>

      {preview && (
        <section className="grid gap-2.5 rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 sm:gap-3.5 sm:p-5">
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Apercu</h2>
          <p className="text-sm text-slate-700 sm:text-base">
            Client: <strong className="font-semibold">{preview.customerName}</strong> ({preview.customerPhone})
          </p>
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-slate-700 sm:text-sm">Message</span>
            <textarea rows={10} value={preview.message} readOnly className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 font-mono text-sm sm:px-3 sm:py-2.5" />
          </label>
          {preview.whatsappUrl ? (
            <a className="inline-flex items-center justify-center rounded-lg border border-emerald-600 bg-emerald-50 px-3 py-2 font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 sm:px-4 sm:py-2.5" href={preview.whatsappUrl} target="_blank" rel="noreferrer">
              Ouvrir dans WhatsApp
            </a>
          ) : (
            <p className="text-sm text-slate-500">Numero client invalide pour le lien WhatsApp.</p>
          )}
        </section>
      )}
    </main>
  );
}

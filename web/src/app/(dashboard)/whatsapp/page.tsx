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
    <main className="page-stack merchant-grid">
      <section className="card merchant-hero">
        <h1>WhatsApp</h1>
        <p>Genere un message client depuis une commande existante.</p>

        <div className="merchant-kpi">
          <article>
            <span>Canal</span>
            <strong>WhatsApp</strong>
          </article>
          <article>
            <span>Commande cible</span>
            <strong>{orderId || "-"}</strong>
          </article>
          <article>
            <span>Apercu</span>
            <strong>{preview ? "Pret" : "En attente"}</strong>
          </article>
          <article>
            <span>Etat</span>
            <strong>{loading ? "Generation" : "Disponible"}</strong>
          </article>
        </div>
      </section>

      <section className="card merchant-surface">
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Order ID
            <input
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              placeholder="Ex: cm0abc123..."
              required
            />
          </label>
          <div className="full-width">
            <button type="submit" disabled={loading}>
              {loading ? "Generation..." : "Generer le message"}
            </button>
          </div>
        </form>

        {error && <p className="feedback error">{error}</p>}
      </section>

      {preview && (
        <section className="card page-stack merchant-surface">
          <h2>Apercu</h2>
          <p>
            Client: <strong>{preview.customerName}</strong> ({preview.customerPhone})
          </p>
          <label>
            Message
            <textarea rows={10} value={preview.message} readOnly />
          </label>
          {preview.whatsappUrl ? (
            <a className="button-link" href={preview.whatsappUrl} target="_blank" rel="noreferrer">
              Ouvrir dans WhatsApp
            </a>
          ) : (
            <p className="muted">Numero client invalide pour le lien WhatsApp.</p>
          )}
        </section>
      )}
    </main>
  );
}

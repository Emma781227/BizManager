"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { formatPriceCFA } from "@/lib/format";

const PAYMENT_LABELS: Record<string, { label: string; icon: string }> = {
  ORANGE_MONEY:     { label: "Orange Money",      icon: "🟠" },
  MTN_MOBILE_MONEY: { label: "MTN Mobile Money",  icon: "🟡" },
  CASH:             { label: "Espèces",            icon: "💵" },
  BANK_TRANSFER:    { label: "Virement bancaire",  icon: "🏦" },
};

type ProductPayload = {
  id: string;
  name: string;
  unitPrice: string;
  stock: number;
  imageUrl: string | null;
  shopName: string;
};

type PaymentMode = "whatsapp" | "geniuspay";

export default function PublicCheckoutPage() {
  const routeParams = useParams<{ slug: string }>();
  const slug = routeParams?.slug;
  const searchParams = useSearchParams();
  const productId = useMemo(() => searchParams.get("productId") ?? "", [searchParams]);
  const initialQuantity = useMemo(() => {
    const raw = Number(searchParams.get("quantity") ?? "1");
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1;
  }, [searchParams]);

  const [customerName, setCustomerName]   = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [quantity, setQuantity]           = useState(initialQuantity);
  const [address, setAddress]             = useState("");
  const [note, setNote]                   = useState("");
  const [paymentMode, setPaymentMode]     = useState<PaymentMode>("whatsapp");
  const [product, setProduct]             = useState<ProductPayload | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [submitting, setSubmitting]         = useState(false);
  const [error, setError]                   = useState<string | null>(null);

  useEffect(() => {
    setQuantity(initialQuantity);
  }, [initialQuantity]);

  useEffect(() => {
    if (!slug || !productId) {
      setProduct(null);
      setLoadingProduct(false);
      return;
    }

    void (async () => {
      setLoadingProduct(true);
      try {
        const [productRes, shopRes] = await Promise.all([
          fetch(`/api/public/shop/${slug}/products/${productId}`, { cache: "no-store" }),
          fetch(`/api/public/shop/${slug}`, { cache: "no-store" }),
        ]);
        const [productJson, shopJson] = await Promise.all([productRes.json(), shopRes.json()]);

        if (!productRes.ok) throw new Error(productJson.error ?? "Produit introuvable");

        setProduct(productJson.data ?? null);
        if (Array.isArray(shopJson.data?.paymentMethods)) {
          setPaymentMethods(shopJson.data.paymentMethods);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Erreur inconnue");
        setProduct(null);
      } finally {
        setLoadingProduct(false);
      }
    })();
  }, [slug, productId]);

  const totalEstimate = useMemo(() => {
    if (!product) return 0;
    return Number(product.unitPrice) * quantity;
  }, [product, quantity]);

  async function handleWhatsapp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const popup = window.open("", "_blank", "noopener,noreferrer");

    try {
      const response = await fetch(`/api/public/shop/${slug}/whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity, customerName, customerPhone, address, note }),
      });

      const json = await response.json();
      if (!response.ok) {
        if (popup) popup.close();
        throw new Error(json.error ?? "Impossible de préparer la commande");
      }

      const whatsappUrl = String(json.data.whatsappUrl ?? "");
      const orderId     = String(json.data.orderId ?? "");
      let sent = "0";

      if (popup && whatsappUrl) {
        popup.location.href = whatsappUrl;
        sent = "1";
      }

      window.location.href = `/shop/${slug}/confirmation?wa=${encodeURIComponent(whatsappUrl)}&sent=${sent}&orderId=${encodeURIComponent(orderId)}`;
    } catch (submitError) {
      if (popup) popup.close();
      setError(submitError instanceof Error ? submitError.message : "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGeniusPay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/public/shop/${slug}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          customerName,
          customerPhone,
          customerEmail,
          customerAddress: address,
          notes: note,
          items: [{ productId, quantity }],
        }),
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Impossible d'initier le paiement");

      const checkoutUrl = String(json.data?.checkoutUrl ?? "");
      if (!checkoutUrl) throw new Error("URL de paiement manquante");

      window.location.href = checkoutUrl;
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erreur inconnue");
      setSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (paymentMode === "geniuspay") return handleGeniusPay(event);
    return handleWhatsapp(event);
  }

  const disabled = submitting || !slug || !productId || !product || product.stock <= 0;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7faf7_0%,#edf5ef_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-4xl rounded-3xl border border-emerald-100 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] sm:p-8">
        <header className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
          {slug ? (
            <Link href={`/shop/${slug}`} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50">
              ←
            </Link>
          ) : (
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-400">←</span>
          )}
          <strong className="text-lg font-semibold text-slate-950">Commande</strong>
          <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-emerald-50 px-3 text-sm font-semibold text-emerald-700">Etape 2</span>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            {loadingProduct ? <p className="text-sm text-slate-500">Vérification du produit...</p> : null}
            {!loadingProduct && product ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h1 className="text-xl font-semibold text-slate-950">{product.name}</h1>
                <p className="mt-1 text-lg font-semibold text-emerald-700">{formatPriceCFA(product.unitPrice)}</p>
                <p className="mt-1 text-sm text-slate-500">Total estimé: {formatPriceCFA(totalEstimate)}</p>
              </div>
            ) : null}

            {/* Payment mode selector */}
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
              <button
                type="button"
                onClick={() => setPaymentMode("whatsapp")}
                className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${paymentMode === "whatsapp" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
              >
                💬 WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode("geniuspay")}
                className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${paymentMode === "geniuspay" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
              >
                💳 Payer en ligne
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block space-y-2 text-sm font-medium text-slate-700">
                <span>Nom complet</span>
                <input
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              <label className="block space-y-2 text-sm font-medium text-slate-700">
                <span>Téléphone</span>
                <input
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+237..."
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              {paymentMode === "geniuspay" && (
                <label className="block space-y-2 text-sm font-medium text-slate-700">
                  <span>Email</span>
                  <input
                    required
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </label>
              )}

              <label className="block space-y-2 text-sm font-medium text-slate-700">
                <span>Quantité</span>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, product?.stock ?? 1)}
                  value={quantity}
                  onChange={(e) => {
                    const next = Number(e.target.value) || 1;
                    const max  = Math.max(1, product?.stock ?? 1);
                    setQuantity(Math.min(Math.max(next, 1), max));
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              <label className="block space-y-2 text-sm font-medium text-slate-700">
                <span>Adresse</span>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              <label className="block space-y-2 text-sm font-medium text-slate-700">
                <span>Remarque</span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              <button
                type="submit"
                disabled={disabled}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting
                  ? (paymentMode === "geniuspay" ? "Redirection vers le paiement..." : "Préparation...")
                  : (paymentMode === "geniuspay" ? `Payer ${formatPriceCFA(totalEstimate)}` : "Valider la commande")}
              </button>
            </form>
          </div>

          <aside className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Infos utiles</h2>
            <div className="grid gap-3 text-sm text-slate-600">
              <span className="rounded-xl border border-slate-200 bg-white px-3 py-2">Livraison rapide possible</span>
              {paymentMode === "whatsapp" ? (
                <span className="rounded-xl border border-slate-200 bg-white px-3 py-2">Confirmation de commande par WhatsApp</span>
              ) : (
                <span className="rounded-xl border border-slate-200 bg-white px-3 py-2">Paiement sécurisé via GeniusPay</span>
              )}
            </div>
            {paymentMethods.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Moyens de paiement acceptés</p>
                <div className="grid gap-2">
                  {paymentMethods.map(id => {
                    const pm = PAYMENT_LABELS[id];
                    if (!pm) return null;
                    return (
                      <span key={id} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
                        <span>{pm.icon}</span>
                        {pm.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {!slug ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">Boutique manquante dans le lien.</p> : null}
            {!productId ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">Produit manquant dans le lien.</p> : null}
            {!loadingProduct && !product && productId ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">Produit introuvable.</p> : null}
            {product && product.stock <= 0 ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">Produit indisponible pour le moment.</p> : null}
            {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
          </aside>
        </section>

        <nav className="mt-8 grid grid-cols-5 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 text-center text-sm text-slate-500" aria-label="Navigation client">
          {slug ? (
            <Link href={`/shop/${slug}`} className="rounded-xl px-2 py-2 transition hover:bg-white">Accueil</Link>
          ) : (
            <span className="rounded-xl px-2 py-2">Accueil</span>
          )}
          <span className="rounded-xl px-2 py-2">Explorer</span>
          <span className="rounded-xl px-2 py-2">Produits</span>
          <span className="rounded-xl bg-emerald-100 px-2 py-2 font-semibold text-emerald-700">Commande</span>
          <span className="rounded-xl px-2 py-2">Compte</span>
        </nav>
      </section>
    </main>
  );
}

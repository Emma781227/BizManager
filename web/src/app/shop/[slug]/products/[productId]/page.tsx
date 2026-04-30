"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatPriceCFA } from "@/lib/format";

type ProductPayload = {
  id: string;
  name: string;
  description?: string | null;
  sku?: string | null;
  category?: string | null;
  categories?: string[];
  unitPrice: string;
  stock: number;
  imageUrl: string | null;
  imageVariants?: string[];
  shopName: string;
  whatsappNumber?: string;
};

export default function PublicProductPage() {
  const routeParams = useParams<{ slug: string; productId: string }>();
  const slug = routeParams?.slug;
  const productId = routeParams?.productId;
  const [product, setProduct] = useState<ProductPayload | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || !productId) {
      return;
    }

    void (async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/public/shop/${slug}/products/${productId}`, {
          cache: "no-store",
        });
        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.error ?? "Produit introuvable");
        }

        setProduct(json.data ?? null);
        const mainImage =
          json.data?.imageUrl ??
          (Array.isArray(json.data?.imageVariants) ? json.data.imageVariants[0] : null) ??
          null;
        setSelectedImage(mainImage);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, productId]);

  if (!slug || !productId) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#f7faf7_0%,#edf5ef_100%)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Produit introuvable.
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#f7faf7_0%,#edf5ef_100%)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          Chargement...
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#f7faf7_0%,#edf5ef_100%)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error ?? "Produit introuvable"}
        </div>
      </main>
    );
  }

  const productCategories =
    Array.isArray(product.categories) && product.categories.length > 0
      ? product.categories
      : product.category
        ? [product.category]
        : [];

  const description =
    product.description?.trim() ||
    "Produit de qualite selectionne avec soin pour repondre a vos besoins au quotidien.";

  const imageGallery = Array.from(
    new Set([
      product.imageUrl,
      ...(product.imageVariants ?? []),
    ].filter((value): value is string => Boolean(value && value.trim()))),
  ).slice(0, 5);

  const mainImage = selectedImage || imageGallery[0] || null;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7faf7_0%,#edf5ef_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-6xl rounded-3xl border border-emerald-100 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] sm:p-8">
        <header className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
          <Link href={`/shop/${slug}`} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50">
            ←
          </Link>
          <strong className="text-lg font-semibold text-slate-950">Detail produit</strong>
          <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-emerald-50 px-3 text-sm font-semibold text-emerald-700">Panier</span>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1fr_1.05fr_0.85fr]">
          <article className="space-y-3">
            {mainImage ? (
              <img src={mainImage} alt={product.name} className="h-72 w-full rounded-2xl border border-slate-200 object-cover sm:h-80" />
            ) : (
              <div className="flex h-72 w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500 sm:h-80">
                Image indisponible
              </div>
            )}

            {imageGallery.length > 1 ? (
              <div className="grid grid-cols-5 gap-2" role="list" aria-label="Variantes d'image">
                {imageGallery.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    role="listitem"
                    className={`overflow-hidden rounded-xl border transition ${mainImage === image ? "border-emerald-500 ring-2 ring-emerald-100" : "border-slate-200 hover:border-emerald-300"}`}
                    onClick={() => setSelectedImage(image)}
                    aria-label={`Variante ${index + 1}`}
                  >
                    <img src={image} alt={`${product.name} variante ${index + 1}`} className="h-14 w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </article>

          <article className="space-y-4">
            <p className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <Link href={`/shop/${slug}`} className="font-medium text-emerald-700 hover:text-emerald-800">
                Accueil
              </Link>
              <span>/</span>
              <span>{product.shopName}</span>
              {productCategories.length > 0 ? (
                <>
                  <span>/</span>
                  <span>{productCategories[0]}</span>
                </>
              ) : null}
            </p>

            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{product.name}</h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <span>Vendu par {product.shopName}</span>
              {product.sku ? <span>SKU: {product.sku}</span> : null}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <strong className="text-2xl font-semibold text-emerald-700">{formatPriceCFA(product.unitPrice)}</strong>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${product.stock > 0 ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-rose-200 bg-rose-50 text-rose-700"}`}>
                {product.stock > 0 ? "En stock" : "Rupture"}
              </span>
            </div>

            {productCategories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {productCategories.map((cat) => (
                  <span key={cat} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                    {cat}
                  </span>
                ))}
              </div>
            ) : null}

            <p className="text-sm leading-7 text-slate-600">{description}</p>

            <ul className="grid gap-2 text-sm text-slate-600">
              <li className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">Livraison rapide possible</li>
              <li className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">Paiement a la livraison ou Mobile Money</li>
              <li className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">Commande confirmee directement par WhatsApp</li>
            </ul>
          </article>

          <aside className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-base font-semibold text-slate-950">Commander ce produit</h2>
            <p className="text-2xl font-semibold text-emerald-700">{formatPriceCFA(product.unitPrice)}</p>
            <p className="text-sm text-slate-500">Stock disponible: {product.stock}</p>

            {product.stock > 0 ? (
              <div className="flex items-center gap-2" role="group" aria-label="Selection de la quantite">
                <button
                  type="button"
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  disabled={quantity <= 1}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, product.stock)}
                  value={quantity}
                  onChange={(event) => {
                    const next = Number(event.target.value) || 1;
                    setQuantity(Math.min(Math.max(next, 1), Math.max(1, product.stock)));
                  }}
                  className="h-10 w-20 rounded-xl border border-slate-200 bg-white px-3 text-center text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((current) => Math.min(product.stock, current + 1))}
                  disabled={quantity >= product.stock}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  +
                </button>
              </div>
            ) : null}

            <Link
              href={`/shop/${slug}/checkout?productId=${product.id}&quantity=${quantity}`}
              className={`inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition ${product.stock <= 0 ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}
              aria-disabled={product.stock <= 0}
              tabIndex={product.stock <= 0 ? -1 : 0}
            >
              Acheter maintenant
            </Link>

            {product.whatsappNumber ? (
              <a
                href={`https://wa.me/${product.whatsappNumber.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Contacter la boutique
              </a>
            ) : null}

            <div className="grid gap-2 text-xs text-slate-500">
              <span className="rounded-xl border border-slate-200 bg-white px-3 py-2">Paiement securise</span>
              <span className="rounded-xl border border-slate-200 bg-white px-3 py-2">Support marchand disponible</span>
            </div>
          </aside>
        </section>

        <section className="mt-8 grid gap-3 md:grid-cols-3" aria-label="Avantages client">
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-base font-semibold text-slate-900">Livraison</h3>
            <p className="mt-1 text-sm text-slate-600">Suivi rapide de votre commande avec confirmation par WhatsApp.</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-base font-semibold text-slate-900">Paiement flexible</h3>
            <p className="mt-1 text-sm text-slate-600">Mobile Money, paiement a la livraison ou cash selon la boutique.</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-base font-semibold text-slate-900">Service client</h3>
            <p className="mt-1 text-sm text-slate-600">Le commercant vous recontacte pour finaliser la commande.</p>
          </article>
        </section>

        <nav className="mt-8 grid grid-cols-5 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 text-center text-sm text-slate-500" aria-label="Navigation client">
          <Link href={`/shop/${slug}`} className="rounded-xl bg-emerald-100 px-2 py-2 font-semibold text-emerald-700">
            Accueil
          </Link>
          <span className="rounded-xl px-2 py-2">Explorer</span>
          <span className="rounded-xl px-2 py-2">Produits</span>
          <span className="rounded-xl px-2 py-2">Panier</span>
          <span className="rounded-xl px-2 py-2">Compte</span>
        </nav>
      </section>
    </main>
  );
}

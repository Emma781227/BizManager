"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Star, Heart, ShoppingCart, MessageCircle, Search, Truck, CreditCard, Package, ChevronRight, ChevronDown, ChevronUp, Shield, RotateCcw, Check, Zap, MapPin, Grid3X3, Shirt, Sparkles, House, ShoppingBag,
} from "lucide-react";
import { formatPriceCFA } from "@/lib/format";

// ─── Types ───────────────────────────────────────────────────────────────────

type ProductPayload = {
  id: string;
  name: string;
  description?: string | null;
  sku?: string | null;
  category?: string | null;
  categories?: string[];
  unitPrice: string;
  stock: number;
  imageUrl?: string | null;
  imageVariants?: string[];
  shopName?: string;
  whatsappNumber?: string | null;
};

type ShopInfo = {
  name: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  description?: string | null;
  city?: string | null;
  whatsappNumber?: string | null;
  category?: string | null;
  productsCount?: number;
  createdAt?: string;
};

type SimilarProduct = {
  id: string;
  name: string;
  unitPrice: string;
  stock: number;
  imageUrl?: string | null;
  category?: string | null;
};

// ─── Constantes catégories ────────────────────────────────────────────────────

const NAV_CATEGORIES = [
  { id: "Mode", label: "Mode", Icon: Shirt },
  { id: "Beaute", label: "Beauté", Icon: Sparkles },
  { id: "Accessoires", label: "Accessoires", Icon: ShoppingBag },
  { id: "Maison", label: "Maison", Icon: House },
  { id: "Electronique", label: "Électronique", Icon: Grid3X3 },
  { id: "Sante", label: "Santé", Icon: Grid3X3 },
  { id: "Enfants", label: "Enfants", Icon: Grid3X3 },
  { id: "Promotions", label: "Promotions", Icon: Grid3X3 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stockBadge(stock: number): { label: string; bg: string; color: string } {
  if (stock <= 0) return { label: "Rupture de stock", bg: "#FFF1F2", color: "#DC2626" };
  if (stock <= 5) return { label: `Plus que ${stock} articles`, bg: "#FFFBEB", color: "#B45309" };
  return { label: "En stock", bg: "#DDF6E7", color: "#0A8F45" };
}

// ─── Composants auxiliaires ───────────────────────────────────────────────────

function LoadingPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F8FAF9",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          border: "4px solid #E8ECEA",
          borderTopColor: "#0A8F45",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <p style={{ color: "#667085", fontSize: "0.875rem" }}>Chargement du produit...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorPage({ message }: { message: string }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F8FAF9",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <Package style={{ width: "48px", height: "48px", color: "#667085" }} />
      <p style={{ color: "#1F2A24", fontWeight: 600, fontSize: "1rem" }}>Produit introuvable</p>
      <p style={{ color: "#667085", fontSize: "0.875rem" }}>{message}</p>
    </div>
  );
}

function TabContentDescription({ product }: { product: ProductPayload }) {
  const cats = product.categories?.length ? product.categories : product.category ? [product.category] : [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <p style={{ fontSize: "0.9rem", color: "#667085", lineHeight: 1.7, margin: 0 }}>
        {product.description || "Aucune description disponible pour ce produit."}
      </p>
      {cats.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {cats.map((cat) => (
            <span key={cat} style={{ display: "inline-flex", alignItems: "center", gap: "5px", backgroundColor: "#DDF6E7", color: "#0A8F45", borderRadius: "8px", padding: "4px 12px", fontSize: "0.8125rem", fontWeight: 600 }}>
              <Check style={{ width: "12px", height: "12px" }} />
              {cat}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function TabContentCaracteristiques({ product }: { product: ProductPayload }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
      <tbody>
        {[
          { label: "Référence (SKU)", value: product.sku ?? "—" },
          { label: "Catégorie", value: product.category ?? "—" },
          { label: "Stock disponible", value: product.stock > 0 ? `${product.stock} unités` : "Rupture" },
          { label: "Prix unitaire", value: formatPriceCFA(product.unitPrice) },
        ].map(({ label, value }) => (
          <tr key={label} style={{ borderBottom: "1px solid #F0F2F1" }}>
            <td style={{ padding: "12px 0", color: "#667085", fontWeight: 500, width: "45%" }}>{label}</td>
            <td style={{ padding: "12px 0", color: "#1F2A24", fontWeight: 600 }}>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TabContentLivraison() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {[
        { Icon: Truck, title: "Livraison rapide", text: "Livraison disponible à Yaoundé et dans les environs. Délai estimé : 24 à 48h ouvrées après confirmation de commande." },
        { Icon: RotateCcw, title: "Politique de retour", text: "Retour accepté sous 7 jours après réception du colis, sous réserve que le produit soit en parfait état et dans son emballage d'origine." },
        { Icon: Shield, title: "Garantie produit", text: "Tous nos produits sont soumis à un contrôle qualité rigoureux. En cas de défaut, nous assurons le remplacement ou le remboursement." },
      ].map(({ Icon, title, text }) => (
        <div key={title} style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "#DDF6E7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon style={{ width: "18px", height: "18px", color: "#0A8F45" }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#1F2A24", marginBottom: "4px" }}>{title}</div>
            <div style={{ fontSize: "0.8125rem", color: "#667085", lineHeight: 1.6 }}>{text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const params = useParams<{ slug: string; productId: string }>();
  const slug = params?.slug ?? "";
  const productId = params?.productId ?? "";

  // États principaux
  const [product, setProduct] = useState<ProductPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "caracteristiques" | "livraison">("description");
  const [openAccordion, setOpenAccordion] = useState<string | null>("description");
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [cartCount] = useState(2);
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [similarProducts, setSimilarProducts] = useState<SimilarProduct[]>([]);
  const [shopCategories, setShopCategories] = useState<string[]>([]);
  const [searchText, setSearchText] = useState("");
  const [thumbOffset, setThumbOffset] = useState(0);
  const [favoriteSimilar, setFavoriteSimilar] = useState<Set<string>>(new Set());

  // ─── Chargement produit ───────────────────────────────────────────────────

  useEffect(() => {
    if (!slug || !productId) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/public/shop/${slug}/products/${productId}`);
        if (!res.ok) throw new Error("Produit non trouvé");
        const json = await res.json();
        const data: ProductPayload = json?.data ?? json;
        setProduct(data);
        setSelectedImage(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors du chargement");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, productId]);

  // ─── Chargement infos boutique ────────────────────────────────────────────

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/public/shop/${slug}`);
        if (!res.ok) return;
        const json = await res.json();
        setShopInfo(json?.data ?? json);
      } catch {
        // non bloquant
      }
    };
    load();
  }, [slug]);

  // ─── Chargement produits similaires ─────────────────────────────────────

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/public/shop/${slug}/products`);
        if (!res.ok) return;
        const json = await res.json();
        const all: SimilarProduct[] = json?.data ?? [];
        setSimilarProducts(all.filter((p) => p.id !== productId).slice(0, 4));
        const cats: string[] = json?.meta?.categories ?? [];
        setShopCategories(cats.slice(0, 7));
      } catch {
        // non bloquant
      }
    };
    load();
  }, [slug, productId]);

  // ─── Galerie ─────────────────────────────────────────────────────────────

  if (loading) return <LoadingPage />;
  if (error || !product) return <ErrorPage message={error ?? "Produit introuvable"} />;

  const imageGallery = Array.from(
    new Set([product.imageUrl, ...(product.imageVariants ?? [])].filter(Boolean) as string[])
  ).slice(0, 5);

  const mainImage = selectedImage ?? imageGallery[0] ?? null;

  const visibleThumbs = imageGallery.slice(thumbOffset, thumbOffset + 4);
  const canScrollDown = thumbOffset + 4 < imageGallery.length;
  const canScrollUp = thumbOffset > 0;

  // ─── WhatsApp ────────────────────────────────────────────────────────────

  const rawWa = product.whatsappNumber ?? shopInfo?.whatsappNumber ?? null;
  const whatsappUrl = rawWa ? `https://wa.me/${rawWa.replace(/\D/g, "")}` : null;

  const whatsappOrderUrl = whatsappUrl
    ? `${whatsappUrl}?text=${encodeURIComponent(
        `Bonjour, je souhaite commander "${product.name}" (x${quantity}). Pouvez-vous me confirmer la disponibilité ?`
      )}`
    : null;

  // ─── Infos boutique calculées ─────────────────────────────────────────────

  const shopName = product.shopName ?? shopInfo?.name ?? "Boutique";
  const shopYear = shopInfo?.createdAt ? new Date(shopInfo.createdAt).getFullYear() : null;
  const badge = stockBadge(product.stock);
  const descTooLong = (product.description ?? "").length > 250;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F8FAF9", fontFamily: "inherit" }}>

      {/* ══════════════════════════════════════════
          HEADER STICKY
      ══════════════════════════════════════════ */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #E8ECEA",
          boxShadow: "0 2px 10px rgba(16,24,40,0.04)",
          height: "72px",
        }}
      >
        <div
          style={{
            maxWidth: "1320px",
            margin: "0 auto",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            gap: "16px",
          }}
        >
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", flexShrink: 0 }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                backgroundColor: "#0A8F45",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "1.1rem" }}>B</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: "1.15rem", color: "#1F2A24" }}>BizManager</span>
          </Link>

          {/* Barre de recherche */}
          <div
            style={{
              width: "520px",
              height: "44px",
              borderRadius: "12px",
              border: "1px solid #E8ECEA",
              backgroundColor: "#F8FAF9",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "0 14px",
              flexShrink: 0,
            }}
            className="search-bar-header"
          >
            <Search style={{ width: "18px", height: "18px", color: "#667085", flexShrink: 0 }} />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Rechercher un produit, une boutique, une catégorie..."
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: "0.875rem",
                color: "#1F2A24",
              }}
            />
          </div>

          {/* Actions droite */}
          <div style={{ display: "flex", alignItems: "center", gap: "28px", flexShrink: 0 }}>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#0A8F45",
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              <MessageCircle style={{ width: "18px", height: "18px" }} />
              <span className="hide-mobile">Nous contacter</span>
            </button>

            <button
              onClick={() => setIsFavorite((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: isFavorite ? "#DC2626" : "#667085",
              }}
            >
              <Heart
                style={{
                  width: "20px",
                  height: "20px",
                  fill: isFavorite ? "#DC2626" : "none",
                  color: isFavorite ? "#DC2626" : "#667085",
                }}
              />
              <span className="hide-mobile">Favoris</span>
            </button>

            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#1F2A24",
                fontSize: "0.875rem",
                fontWeight: 500,
                position: "relative",
              }}
            >
              <ShoppingCart style={{ width: "20px", height: "20px" }} />
              <span
                style={{
                  position: "absolute",
                  top: "-8px",
                  right: "-8px",
                  backgroundColor: "#0A8F45",
                  color: "#FFFFFF",
                  fontSize: "0.625rem",
                  fontWeight: 700,
                  borderRadius: "9999px",
                  width: "18px",
                  height: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {cartCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════
          BARRE CATÉGORIES
      ══════════════════════════════════════════ */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #E8ECEA",
          marginTop: "4px",
          height: "56px",
          overflowX: "auto",
        }}
      >
        <div
          style={{
            maxWidth: "1320px",
            margin: "0 auto",
            height: "100%",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "0 24px",
          }}
        >
          {/* Bouton Toutes les catégories */}
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#0A8F45",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "10px",
              width: "190px",
              height: "40px",
              fontWeight: 600,
              fontSize: "0.8125rem",
              cursor: "pointer",
              flexShrink: 0,
              justifyContent: "center",
            }}
          >
            <Grid3X3 style={{ width: "16px", height: "16px" }} />
            Toutes les catégories
          </button>

          {/* Séparateur */}
          <div style={{ width: "1px", height: "28px", backgroundColor: "#E8ECEA", flexShrink: 0 }} />

          {/* Catégories de la boutique */}
          {shopCategories.length > 0
            ? shopCategories.map((cat) => (
                <Link
                  key={cat}
                  href={`/shop/${slug}?category=${encodeURIComponent(cat)}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#1F2A24",
                    textDecoration: "none",
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    padding: "0 12px",
                    height: "40px",
                    borderRadius: "8px",
                    transition: "color 0.15s",
                  }}
                  className="cat-nav-link"
                >
                  {cat}
                </Link>
              ))
            : NAV_CATEGORIES.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop/${slug}?category=${cat.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#1F2A24",
                    textDecoration: "none",
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    padding: "0 8px",
                    height: "40px",
                    borderRadius: "8px",
                    transition: "color 0.15s",
                  }}
                  className="cat-nav-link"
                >
                  <cat.Icon style={{ width: "15px", height: "15px", color: "#667085" }} />
                  {cat.label}
                </Link>
              ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          CONTENU PRINCIPAL
      ══════════════════════════════════════════ */}
      <div
        style={{
          maxWidth: "1320px",
          margin: "0 auto",
          padding: "0 24px 48px",
        }}
      >

        {/* ── BREADCRUMB ── */}
        <nav
          style={{
            height: "28px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.8125rem",
            marginTop: "8px",
            marginBottom: "16px",
          }}
        >
          <Link href="/" style={{ color: "#0A8F45", textDecoration: "none" }}>Accueil</Link>
          <ChevronRight style={{ width: "13px", height: "13px", color: "#667085" }} />
          <Link href={`/shop/${slug}`} style={{ color: "#0A8F45", textDecoration: "none" }}>{shopName}</Link>
          {product.category && (
            <>
              <ChevronRight style={{ width: "13px", height: "13px", color: "#667085" }} />
              <Link
                href={`/shop/${slug}?category=${product.category}`}
                style={{ color: "#0A8F45", textDecoration: "none" }}
              >
                {product.category}
              </Link>
            </>
          )}
          <ChevronRight style={{ width: "13px", height: "13px", color: "#667085" }} />
          <span
            style={{
              color: "#667085",
              maxWidth: "220px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {product.name}
          </span>
        </nav>

        {/* ── BLOC PRINCIPAL 2 colonnes ── */}
        <div
          style={{
            display: "flex",
            gap: "24px",
            alignItems: "flex-start",
          }}
          className="product-main-grid"
        >

          {/* ════════════════════════════
              COLONNE GAUCHE — Galerie + Onglets
          ════════════════════════════ */}
          <div
            className="left-col"
            style={{ display: "flex", flexDirection: "column", gap: "20px", width: "670px", flexShrink: 0 }}
          >

          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "18px",
              border: "1px solid #E8ECEA",
              boxShadow: "0 2px 10px rgba(16,24,40,0.04)",
              padding: "14px",
              display: "flex",
              gap: "12px",
              position: "relative",
              width: "100%",
            }}
            className="gallery-col"
          >
            {/* Miniatures */}
            {imageGallery.length > 1 && (
              <div
                className="gallery-thumbs"
                style={{
                  width: "84px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                {canScrollUp && (
                  <button
                    className="thumb-scroll-btn"
                    onClick={() => setThumbOffset((o) => Math.max(0, o - 1))}
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      border: "1px solid #E8ECEA",
                      backgroundColor: "#FFFFFF",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ChevronUp style={{ width: "16px", height: "16px", color: "#667085" }} />
                  </button>
                )}

                {visibleThumbs.map((img, i) => {
                  const realIdx = thumbOffset + i;
                  const isActive = (selectedImage ?? imageGallery[0]) === img;
                  return (
                    <button
                      key={realIdx}
                      onClick={() => setSelectedImage(img)}
                      style={{
                        width: "84px",
                        height: "84px",
                        borderRadius: "12px",
                        border: isActive ? "2px solid #0A8F45" : "2px solid #E8ECEA",
                        overflow: "hidden",
                        cursor: "pointer",
                        padding: 0,
                        backgroundColor: "#F8FAF9",
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={img}
                        alt={`Vue ${realIdx + 1}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </button>
                  );
                })}

                {canScrollDown && (
                  <button
                    className="thumb-scroll-btn"
                    onClick={() => setThumbOffset((o) => o + 1)}
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      border: "1px solid #E8ECEA",
                      backgroundColor: "#FFFFFF",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ChevronDown style={{ width: "16px", height: "16px", color: "#667085" }} />
                  </button>
                )}
              </div>
            )}

            {/* Image principale */}
            <div
              className="gallery-main"
              style={{
                flex: 1,
                borderRadius: "16px",
                backgroundColor: "#F8FAF9",
                overflow: "hidden",
                minHeight: "420px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={product.name}
                  style={{ width: "100%", height: "100%", objectFit: "contain", maxHeight: "460px" }}
                />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", color: "#667085" }}>
                  <Package style={{ width: "64px", height: "64px" }} />
                  <span style={{ fontSize: "0.875rem" }}>Aucune image disponible</span>
                </div>
              )}

              {/* Bouton favori absolu */}
              <button
                onClick={() => setIsFavorite((v) => !v)}
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  backgroundColor: "#FFFFFF",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 2px 10px rgba(16,24,40,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Heart
                  style={{
                    width: "20px",
                    height: "20px",
                    fill: isFavorite ? "#DC2626" : "none",
                    color: isFavorite ? "#DC2626" : "#667085",
                  }}
                />
              </button>
            </div>
          </div>

          {/* ── Onglets description (dans left-col) ── */}
          <div
            style={{
              width: "100%",
              backgroundColor: "#FFFFFF",
              borderRadius: "18px",
              border: "1px solid #E8ECEA",
              boxShadow: "0 2px 10px rgba(16,24,40,0.04)",
              overflow: "hidden",
            }}
            className="tabs-col"
          >

            {/* ── DESKTOP : onglets ── */}
            <div className="tabs-desktop" style={{ padding: "20px" }}>
              <div style={{ display: "flex", borderBottom: "1px solid #E8ECEA", marginBottom: "20px", gap: "4px" }}>
                {([
                  { id: "description", label: "Description" },
                  { id: "caracteristiques", label: "Caractéristiques" },
                  { id: "livraison", label: "Livraison & retours" },
                ] as const).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: "10px 16px",
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      fontWeight: activeTab === tab.id ? 700 : 500,
                      color: activeTab === tab.id ? "#0A8F45" : "#667085",
                      borderBottom: activeTab === tab.id ? "2px solid #0A8F45" : "2px solid transparent",
                      marginBottom: "-1px",
                      transition: "color 0.15s",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === "description" && <TabContentDescription product={product} />}
              {activeTab === "caracteristiques" && <TabContentCaracteristiques product={product} />}
              {activeTab === "livraison" && <TabContentLivraison />}
            </div>

            {/* ── MOBILE : accordéon ── */}
            <div className="tabs-mobile-accordion">
              {([
                { id: "description", label: "Description" },
                { id: "caracteristiques", label: "Caractéristiques" },
                { id: "livraison", label: "Livraison & retours" },
              ] as const).map((item, i) => {
                const isOpen = openAccordion === item.id;
                return (
                  <div key={item.id} style={{ borderTop: i > 0 ? "1px solid #E8ECEA" : "none" }}>
                    <button
                      onClick={() => setOpenAccordion(isOpen ? null : item.id)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "16px 20px",
                        border: "none",
                        background: isOpen ? "#F8FAF9" : "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.15s",
                      }}
                    >
                      <span style={{ fontSize: "0.9rem", fontWeight: 600, color: isOpen ? "#0A8F45" : "#1F2A24" }}>
                        {item.label}
                      </span>
                      <ChevronDown
                        style={{
                          width: "18px",
                          height: "18px",
                          color: isOpen ? "#0A8F45" : "#667085",
                          flexShrink: 0,
                          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.2s",
                        }}
                      />
                    </button>
                    {isOpen && (
                      <div style={{ padding: "0 20px 20px" }}>
                        {item.id === "description" && <TabContentDescription product={product} />}
                        {item.id === "caracteristiques" && <TabContentCaracteristiques product={product} />}
                        {item.id === "livraison" && <TabContentLivraison />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>

          </div>{/* fin left-col */}

          {/* ════════════════════════════
              COLONNE DROITE — Fiche + Boutique
          ════════════════════════════ */}
          <div
            className="right-col"
            style={{ display: "flex", flexDirection: "column", gap: "20px", flex: 1 }}
          >

          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "18px",
              border: "1px solid #E8ECEA",
              boxShadow: "0 2px 10px rgba(16,24,40,0.04)",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            {/* Titre */}
            <h1
              style={{
                fontSize: "clamp(1.4rem, 2vw, 1.75rem)",
                fontWeight: 700,
                color: "#1F2A24",
                margin: 0,
                lineHeight: 1.25,
              }}
            >
              {product.name}
            </h1>

            {/* Note + badge authentique */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} style={{ width: "16px", height: "16px", fill: "#F7B500", color: "#F7B500" }} />
                ))}
                <span style={{ fontSize: "0.875rem", color: "#1F2A24", fontWeight: 600, marginLeft: "4px" }}>4,8</span>
                <span style={{ fontSize: "0.8125rem", color: "#667085", marginLeft: "2px" }}>(128 avis clients)</span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  backgroundColor: "#DDF6E7",
                  color: "#0A8F45",
                  borderRadius: "8px",
                  padding: "3px 10px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                }}
              >
                <Check style={{ width: "12px", height: "12px" }} />
                Produit authentique
              </div>
            </div>

            {/* Prix */}
            <div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "#0A8F45", lineHeight: 1 }}>
                {formatPriceCFA(product.unitPrice)}
              </div>
              <div style={{ fontSize: "0.8125rem", color: "#667085", marginTop: "4px" }}>
                TTC · Livraison incluse
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "#667085",
                    lineHeight: 1.65,
                    margin: 0,
                    display: "-webkit-box",
                    WebkitLineClamp: isDescExpanded ? "unset" : 2,
                    WebkitBoxOrient: "vertical" as const,
                    overflow: isDescExpanded ? "visible" : "hidden",
                  }}
                >
                  {product.description}
                </p>
                {descTooLong && (
                  <button
                    onClick={() => setIsDescExpanded((v) => !v)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#0A8F45",
                      fontWeight: 600,
                      fontSize: "0.8125rem",
                      cursor: "pointer",
                      padding: "4px 0 0",
                    }}
                  >
                    {isDescExpanded ? "Réduire" : "Lire la suite"}
                  </button>
                )}
              </div>
            )}

            {/* Stock */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span
                style={{
                  backgroundColor: badge.bg,
                  color: badge.color,
                  borderRadius: "8px",
                  padding: "4px 12px",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                }}
              >
                {badge.label}
              </span>
              {product.stock > 0 && product.stock <= 5 && (
                <span style={{ fontSize: "0.8rem", color: "#667085" }}>
                  Plus que {product.stock} articles disponibles
                </span>
              )}
            </div>

            {/* Sélecteur quantité */}
            {product.stock > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1F2A24" }}>Quantité</span>
                <div
                  style={{
                    width: "110px",
                    height: "40px",
                    borderRadius: "10px",
                    border: "1px solid #E8ECEA",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    overflow: "hidden",
                  }}
                >
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    style={{
                      width: "36px",
                      height: "100%",
                      border: "none",
                      backgroundColor: "#F8FAF9",
                      cursor: "pointer",
                      fontSize: "1.1rem",
                      color: "#1F2A24",
                      fontWeight: 500,
                    }}
                  >
                    −
                  </button>
                  <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#1F2A24" }}>{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    style={{
                      width: "36px",
                      height: "100%",
                      border: "none",
                      backgroundColor: "#F8FAF9",
                      cursor: "pointer",
                      fontSize: "1.1rem",
                      color: "#1F2A24",
                      fontWeight: 500,
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Boutons CTA */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {product.stock > 0 ? (
                <Link
                  href={`/shop/${slug}/checkout?productId=${product.id}&quantity=${quantity}`}
                  style={{
                    height: "48px",
                    backgroundColor: "#0A8F45",
                    color: "#FFFFFF",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    fontSize: "0.9375rem",
                    textDecoration: "none",
                    boxShadow: "0 4px 14px rgba(10,143,69,0.25)",
                    gap: "8px",
                  }}
                >
                  <ShoppingCart style={{ width: "18px", height: "18px" }} />
                  Ajouter au panier
                </Link>
              ) : (
                <button
                  disabled
                  style={{
                    height: "48px",
                    backgroundColor: "#E8ECEA",
                    color: "#667085",
                    borderRadius: "10px",
                    border: "none",
                    fontWeight: 600,
                    fontSize: "0.9375rem",
                    cursor: "not-allowed",
                  }}
                >
                  Produit indisponible
                </button>
              )}

              {whatsappOrderUrl ? (
                <a
                  href={whatsappOrderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    height: "48px",
                    backgroundColor: "transparent",
                    color: "#0A8F45",
                    border: "1.5px solid #0A8F45",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    fontSize: "0.9375rem",
                    textDecoration: "none",
                    gap: "8px",
                  }}
                  className="whatsapp-btn"
                >
                  <MessageCircle style={{ width: "18px", height: "18px" }} />
                  Commander via WhatsApp
                </a>
              ) : (
                <button
                  disabled
                  style={{
                    height: "48px",
                    backgroundColor: "transparent",
                    color: "#667085",
                    border: "1.5px solid #E8ECEA",
                    borderRadius: "10px",
                    fontWeight: 600,
                    fontSize: "0.9375rem",
                    cursor: "not-allowed",
                  }}
                >
                  Commander via WhatsApp
                </button>
              )}
            </div>

            {/* Grille services */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "8px",
              }}
            >
              {[
                { Icon: Truck, label: "Livraison", sub: "Yaoundé & environs" },
                { Icon: CreditCard, label: "Paiement sécurisé", sub: "À la livraison" },
                { Icon: MapPin, label: "Retrait possible", sub: "En boutique" },
              ].map(({ Icon, label, sub }) => (
                <div
                  key={label}
                  style={{
                    border: "1px solid #E8ECEA",
                    borderRadius: "12px",
                    padding: "10px 8px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    textAlign: "center",
                  }}
                >
                  <Icon style={{ width: "20px", height: "20px", color: "#0A8F45" }} />
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#1F2A24" }}>{label}</span>
                  <span style={{ fontSize: "0.6875rem", color: "#667085" }}>{sub}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Carte boutique (dans right-col) ── */}
          <div
            style={{
              width: "100%",
              backgroundColor: "#FFFFFF",
              borderRadius: "18px",
              border: "1px solid #E8ECEA",
              boxShadow: "0 2px 10px rgba(16,24,40,0.04)",
              padding: "22px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
            className="shop-card-col"
          >
            {/* En-tête boutique */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "#0A8F45",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {shopInfo?.logoUrl ? (
                  <img
                    src={shopInfo.logoUrl}
                    alt={shopName}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "1.25rem" }}>
                    {shopName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: "1rem", color: "#1F2A24" }}>{shopName}</span>
                  <span
                    style={{
                      backgroundColor: "#DDF6E7",
                      color: "#0A8F45",
                      borderRadius: "6px",
                      padding: "2px 8px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    Vérifié
                  </span>
                </div>
                {shopInfo?.category && (
                  <div style={{ fontSize: "0.8125rem", color: "#667085", marginTop: "2px" }}>{shopInfo.category}</div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "3px", marginTop: "4px" }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} style={{ width: "12px", height: "12px", fill: "#F7B500", color: "#F7B500" }} />
                  ))}
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#1F2A24", marginLeft: "3px" }}>4,8</span>
                  <span style={{ fontSize: "0.75rem", color: "#667085" }}>(96 avis)</span>
                </div>
              </div>
            </div>

            {/* Grille 3 infos */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "8px",
                borderTop: "1px solid #E8ECEA",
                paddingTop: "14px",
              }}
            >
              {[
                {
                  Icon: Package,
                  label: "Produits",
                  value: shopInfo?.productsCount != null ? String(shopInfo.productsCount) : "—",
                },
                {
                  Icon: Zap,
                  label: "En ligne depuis",
                  value: shopYear ? String(shopYear) : "—",
                },
                {
                  Icon: Zap,
                  label: "Réponse",
                  value: "Rapide",
                },
              ].map(({ Icon, label, value }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    textAlign: "center",
                  }}
                >
                  <Icon style={{ width: "18px", height: "18px", color: "#0A8F45" }} />
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1F2A24" }}>{value}</span>
                  <span style={{ fontSize: "0.6875rem", color: "#667085" }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Bouton voir la boutique */}
            <Link
              href={`/shop/${slug}`}
              style={{
                height: "44px",
                border: "1.5px solid #0A8F45",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
                fontSize: "0.9rem",
                color: "#0A8F45",
                textDecoration: "none",
                gap: "6px",
              }}
              className="shop-link-btn"
            >
              Voir la boutique
              <ChevronRight style={{ width: "16px", height: "16px" }} />
            </Link>
          </div>

          </div>{/* fin right-col */}

        </div>{/* fin product-main-grid */}

        {/* ══════════════════════════════════════════
            SECTION PRODUITS SIMILAIRES
        ══════════════════════════════════════════ */}
        {similarProducts.length > 0 && (
          <div style={{ marginTop: "22px" }}>
            {/* En-tête section */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "4px",
                    height: "24px",
                    backgroundColor: "#0A8F45",
                    borderRadius: "2px",
                    flexShrink: 0,
                  }}
                />
                <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: "#1F2A24" }}>
                  Produits similaires
                </h2>
              </div>
              <Link
                href={`/shop/${slug}`}
                style={{
                  fontSize: "0.875rem",
                  color: "#0A8F45",
                  fontWeight: 600,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                Voir plus de produits
                <ChevronRight style={{ width: "14px", height: "14px" }} />
              </Link>
            </div>

            {/* Grille 4 colonnes */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "20px",
              }}
              className="similar-grid"
            >
              {similarProducts.map((sp) => {
                const spBadge = stockBadge(sp.stock);
                const isFav = favoriteSimilar.has(sp.id);
                return (
                  <article
                    key={sp.id}
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "16px",
                      border: "1px solid #E8ECEA",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {/* Zone image */}
                    <div style={{ position: "relative", height: "120px", backgroundColor: "#F8FAF9" }}>
                      {sp.imageUrl ? (
                        <img
                          src={sp.imageUrl}
                          alt={sp.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Package style={{ width: "32px", height: "32px", color: "#E8ECEA" }} />
                        </div>
                      )}
                      {/* Bouton favori */}
                      <button
                        onClick={() =>
                          setFavoriteSimilar((prev) => {
                            const next = new Set(prev);
                            next.has(sp.id) ? next.delete(sp.id) : next.add(sp.id);
                            return next;
                          })
                        }
                        style={{
                          position: "absolute",
                          top: "8px",
                          right: "8px",
                          width: "30px",
                          height: "30px",
                          borderRadius: "50%",
                          backgroundColor: "#FFFFFF",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 1px 6px rgba(16,24,40,0.1)",
                        }}
                      >
                        <Heart
                          style={{
                            width: "14px",
                            height: "14px",
                            fill: isFav ? "#DC2626" : "none",
                            color: isFav ? "#DC2626" : "#667085",
                          }}
                        />
                      </button>
                    </div>

                    {/* Infos produit */}
                    <div style={{ padding: "12px", flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: "#1F2A24",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          display: "block",
                        }}
                      >
                        {sp.name}
                      </span>
                      {sp.category && (
                        <span style={{ fontSize: "0.75rem", color: "#667085" }}>{sp.category}</span>
                      )}
                      <span
                        style={{
                          fontSize: "1rem",
                          fontWeight: 700,
                          color: "#0A8F45",
                        }}
                      >
                        {formatPriceCFA(sp.unitPrice)}
                      </span>
                      <span
                        style={{
                          display: "inline-block",
                          backgroundColor: spBadge.bg,
                          color: spBadge.color,
                          borderRadius: "6px",
                          padding: "2px 8px",
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          alignSelf: "flex-start",
                        }}
                      >
                        {spBadge.label}
                      </span>
                      <Link
                        href={`/shop/${slug}/products/${sp.id}`}
                        style={{
                          marginTop: "auto",
                          height: "34px",
                          border: "1.5px solid #0A8F45",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.8125rem",
                          fontWeight: 600,
                          color: "#0A8F45",
                          textDecoration: "none",
                        }}
                        className="similar-product-btn"
                      >
                        Voir le produit
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          STYLES UTILITAIRES (responsive)
      ══════════════════════════════════════════ */}
      <style>{`
        .hide-mobile { display: inline; }
        .search-bar-header { display: flex !important; }
        .tabs-desktop { display: block; }
        .tabs-mobile-accordion { display: none; }
        .cat-nav-link:hover { color: #0A8F45 !important; background-color: #F0FAF5; }
        .whatsapp-btn:hover { background-color: #F0FAF5 !important; }
        .shop-link-btn:hover { background-color: #F0FAF5 !important; }
        .similar-product-btn:hover { background-color: #0A8F45 !important; color: #FFFFFF !important; }

        @media (max-width: 1100px) {
          .product-main-grid { flex-direction: column !important; }
          .left-col { width: 100% !important; }
          .right-col { width: 100% !important; }
          .tabs-desktop { display: none !important; }
          .tabs-mobile-accordion { display: block !important; }
          .tabs-col { padding: 0 !important; }
          .gallery-col { flex-direction: column !important; }
          .gallery-main { order: -1; min-height: 300px !important; height: 300px !important; width: 100% !important; }
          .gallery-thumbs {
            flex-direction: row !important;
            width: 100% !important;
            height: auto !important;
            overflow-x: auto !important;
            gap: 8px !important;
            padding-bottom: 4px !important;
            align-items: center !important;
          }
          .gallery-thumbs button[style] { width: 68px !important; height: 68px !important; flex-shrink: 0 !important; }
          .thumb-scroll-btn { display: none !important; }
          .similar-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }

        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .search-bar-header { display: none !important; }
          .gallery-main { min-height: 260px !important; height: 260px !important; }
          .similar-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }

        @media (max-width: 480px) {
          .gallery-main { min-height: 220px !important; height: 220px !important; }
          .similar-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Heart, MessageCircle, Package, ShoppingCart, Trash2, X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type FavoriteItem = {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  category?: string | null;
};

type CartItem = {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
};

type Shop = {
  name: string;
  whatsappNumber?: string | null;
};

type SortBy = "recent" | "price_asc" | "price_desc";

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes fadeUp  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes popIn   { from { opacity:0; transform:scale(.94); } to { opacity:1; transform:scale(1); } }
  @keyframes fadeOut { from { opacity:1; transform:scale(1); } to { opacity:0; transform:scale(.94); } }
  @keyframes drawerIn { from { transform:translateX(100%); } to { transform:translateX(0); } }

  /* ── Header ──────────────────────────────────────────────────────── */
  .fav-header {
    position: fixed; top: 0; left: 0; right: 0; z-index: 50;
    background: #fff; border-bottom: 1px solid #E8ECEA;
    height: 68px; box-shadow: 0 1px 8px rgba(16,24,40,0.05);
    transition: height .2s, box-shadow .2s;
  }
  .fav-header.compact { height: 52px; box-shadow: 0 2px 12px rgba(16,24,40,0.08); }
  .fav-container {
    max-width: 1320px; margin: 0 auto;
    padding: 0 24px; box-sizing: border-box;
  }
  .fav-header-inner {
    display: flex; align-items: center; justify-content: space-between;
    height: 100%; gap: 12px;
  }
  .fav-logo {
    display: flex; align-items: center; gap: 9px;
    text-decoration: none; flex-shrink: 0;
  }
  .fav-logo-icon {
    width: 34px; height: 34px; background: #0A8F45;
    border-radius: 9px; display: flex; align-items: center;
    justify-content: center; flex-shrink: 0;
  }
  .fav-hbtn {
    display: flex; align-items: center; gap: 6px;
    height: 36px; padding: 0 13px;
    border: 1.5px solid #E8ECEA; border-radius: 10px;
    background: #fff; color: #667085; font-size: 13px;
    font-weight: 600; cursor: pointer; text-decoration: none;
    transition: all .15s; white-space: nowrap; position: relative;
  }
  .fav-hbtn:hover { border-color: #0A8F45; color: #0A8F45; background: #EAF7EF; }
  .fav-hbtn-active { border-color: #EF4444 !important; color: #EF4444 !important; background: #FFF5F5 !important; }
  .fav-hbtn-green  { background: #0A8F45 !important; color: #fff !important; border-color: #0A8F45 !important; }
  .fav-hbtn-green:hover { background: #08763A !important; }
  .fav-cart-btn {
    position: relative; width: 36px; height: 36px;
    background: #0A8F45; border: none; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #fff; flex-shrink: 0;
    transition: background .15s;
  }
  .fav-cart-btn:hover { background: #08763A; }
  .fav-badge {
    position: absolute; top: -5px; right: -5px;
    min-width: 17px; height: 17px; border-radius: 9px;
    font-size: 10px; font-weight: 800; padding: 0 3px;
    display: flex; align-items: center; justify-content: center;
  }

  /* ── Hero ────────────────────────────────────────────────────────── */
  .fav-hero {
    background: linear-gradient(135deg, #EAF7EF 0%, #F8FAF9 100%);
    border-bottom: 1px solid #E8ECEA;
    padding: 26px 0 22px;
  }
  .fav-hero-inner {
    display: flex; align-items: center; justify-content: space-between;
    gap: 16px; flex-wrap: wrap;
  }
  .fav-hero-left { display: flex; align-items: center; gap: 14px; }
  .fav-hero-icon {
    width: 50px; height: 50px; background: #fff;
    border-radius: 15px; border: 1.5px solid #E8ECEA;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 10px rgba(16,24,40,0.06); flex-shrink: 0;
  }

  /* ── Toolbar ─────────────────────────────────────────────────────── */
  .fav-toolbar {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; margin-top: 22px; flex-wrap: wrap;
  }

  /* ── Grid ────────────────────────────────────────────────────────── */
  .fav-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px; margin-top: 20px;
  }
  .fav-card {
    background: #fff; border: 1px solid #E8ECEA;
    border-radius: 16px; overflow: hidden;
    transition: box-shadow .2s, transform .2s;
    display: flex; flex-direction: column;
    box-shadow: 0 2px 8px rgba(16,24,40,0.04);
    animation: popIn .22s ease;
    position: relative;
  }
  .fav-card.removing { animation: fadeOut .22s ease forwards; pointer-events: none; }
  .fav-card:hover {
    box-shadow: 0 8px 28px rgba(10,143,69,0.13);
    transform: translateY(-2px);
  }
  .fav-card-img-wrap {
    position: relative; overflow: hidden;
    aspect-ratio: 4 / 3; background: #F8FAF9;
  }
  .fav-card-img {
    width: 100%; height: 100%; object-fit: cover;
    transition: transform .4s ease; display: block;
  }
  .fav-card:hover .fav-card-img { transform: scale(1.06); }
  .fav-card-img-placeholder {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #EAF7EF, #F8FAF9);
  }
  .fav-card-remove {
    position: absolute; top: 9px; right: 9px;
    width: 30px; height: 30px; background: rgba(255,255,255,0.95);
    border: 1.5px solid #FECACA; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all .15s; z-index: 2;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  .fav-card-remove:hover { border-color: #EF4444; background: #FFF5F5; transform: scale(1.08); }
  .fav-card-body { padding: 11px 13px 13px; flex: 1; display: flex; flex-direction: column; }
  .fav-card-cat {
    font-size: 10px; font-weight: 700; color: #0A8F45;
    text-transform: uppercase; letter-spacing: .06em;
    margin-bottom: 4px;
  }
  .fav-card-name {
    font-size: 13px; font-weight: 700; color: #1F2A24;
    line-height: 1.4; margin-bottom: 8px; flex: 1;
    display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden;
    text-decoration: none;
  }
  .fav-card-name:hover { color: #0A8F45; }
  .fav-card-price {
    font-size: 15px; font-weight: 800; color: #0A8F45;
    margin-bottom: 10px;
  }
  .fav-card-actions { display: flex; gap: 7px; }
  .fav-btn-view {
    height: 36px; padding: 0 11px; border-radius: 9px;
    border: 1.5px solid #E8ECEA; background: #fff;
    color: #667085; font-size: 11px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    text-decoration: none; transition: all .15s; white-space: nowrap; flex-shrink: 0;
  }
  .fav-btn-view:hover { border-color: #0A8F45; color: #0A8F45; background: #F6FFF9; }
  .fav-btn-cart {
    flex: 1; height: 36px; border-radius: 9px;
    border: none; background: #0A8F45;
    color: #fff; font-size: 11px; font-weight: 700;
    cursor: pointer; display: flex; align-items: center;
    justify-content: center; gap: 5px; transition: background .15s;
    white-space: nowrap;
  }
  .fav-btn-cart:hover { background: #08763A; }

  /* ── Empty state ─────────────────────────────────────────────────── */
  .fav-empty {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 18px; padding: 80px 24px;
    text-align: center;
  }
  .fav-empty-icon {
    width: 84px; height: 84px; background: #FFF5F5;
    border-radius: 24px; display: flex; align-items: center;
    justify-content: center;
  }

  /* ── Toast ───────────────────────────────────────────────────────── */
  .fav-toast {
    position: fixed; bottom: 28px; left: 50%;
    transform: translateX(-50%); z-index: 9999;
    background: #1F2A24; color: #fff;
    padding: 11px 22px; border-radius: 12px;
    font-weight: 600; font-size: 14px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.22);
    white-space: nowrap; animation: fadeUp .2s ease;
  }

  /* ── Cart drawer ─────────────────────────────────────────────────── */
  .fav-drawer {
    width: 380px; max-width: 92vw; background: #fff;
    display: flex; flex-direction: column; height: 100%;
    box-shadow: -8px 0 32px rgba(0,0,0,0.12);
    animation: drawerIn .25s ease;
  }

  /* ── Bottom mobile nav ───────────────────────────────────────────── */
  .fav-bottom-nav {
    display: none;
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
    background: #fff; border-top: 1px solid #E8ECEA;
    padding: 0 0 env(safe-area-inset-bottom, 0);
    box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
  }
  .fav-bottom-nav-item {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 3px; padding: 8px 4px 6px;
    font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em;
    color: #98A2B3; text-decoration: none; border: none; background: none; cursor: pointer;
    transition: color .15s;
  }
  .fav-bottom-nav-item.active { color: #EF4444; }

  /* ── Responsive ──────────────────────────────────────────────────── */
  @media (max-width: 1100px) { .fav-grid { grid-template-columns: repeat(3, 1fr); } }
  @media (max-width: 768px)  {
    .fav-grid { grid-template-columns: repeat(2, 1fr); }
    .fav-bottom-nav { display: flex; }
    .fav-toast { bottom: 80px; }
    .fav-main { padding-bottom: 80px !important; }
  }
  @media (max-width: 480px)  {
    .fav-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
    .fav-container { padding: 0 14px; }
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(value: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FavoritesPage() {
  const params = useParams<{ slug: string }>();
  const slug   = params?.slug ?? "";

  const [favorites,   setFavorites]   = useState<FavoriteItem[]>([]);
  const [shop,        setShop]        = useState<Shop | null>(null);
  const [cart,        setCart]        = useState<CartItem[]>([]);
  const [cartCount,   setCartCount]   = useState(0);
  const [cartOpen,    setCartOpen]    = useState(false);
  const [toast,       setToast]       = useState<string | null>(null);
  const [mounted,     setMounted]     = useState(false);
  const [sortBy,      setSortBy]      = useState<SortBy>("recent");
  const [removing,    setRemoving]    = useState<Set<string>>(new Set());
  const [headerCompact, setHeaderCompact] = useState(false);

  const toastRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ─── Init depuis localStorage ─────────────────────────────────────────────

  useEffect(() => {
    setMounted(true);
    try {
      const s = localStorage.getItem(`favorites-${slug}`);
      setFavorites(s ? JSON.parse(s) : []);
    } catch { setFavorites([]); }
    try {
      const c = localStorage.getItem(`cart-${slug}`);
      if (c) {
        const items: CartItem[] = JSON.parse(c);
        setCart(items);
        setCartCount(items.reduce((sum, i) => sum + i.quantity, 0));
      }
    } catch { /* ignore */ }
  }, [slug]);

  // ─── Chargement boutique ──────────────────────────────────────────────────

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/public/shop/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setShop(d?.data ?? d); })
      .catch(() => {});
  }, [slug]);

  // ─── Scroll compact header ────────────────────────────────────────────────

  useEffect(() => {
    const onScroll = () => setHeaderCompact(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ─── Toast auto-dismiss ───────────────────────────────────────────────────

  function showToast(msg: string) {
    clearTimeout(toastRef.current);
    setToast(msg);
    toastRef.current = setTimeout(() => setToast(null), 2800);
  }

  // ─── Actions ─────────────────────────────────────────────────────────────

  function removeFromFavorites(productId: string, name: string) {
    setRemoving(prev => new Set(prev).add(productId));
    setTimeout(() => {
      const updated = favorites.filter(f => f.productId !== productId);
      setFavorites(updated);
      setRemoving(prev => { const s = new Set(prev); s.delete(productId); return s; });
      try { localStorage.setItem(`favorites-${slug}`, JSON.stringify(updated)); } catch { /* ignore */ }
      showToast(`"${name}" retiré des favoris`);
    }, 220);
  }

  function addToCart(item: FavoriteItem) {
    const key = `cart-${slug}`;
    const cartList: CartItem[] = [...cart];
    const existing = cartList.find(i => i.productId === item.productId);
    if (existing) { existing.quantity += 1; }
    else { cartList.push({ productId: item.productId, name: item.name, price: item.price, imageUrl: item.imageUrl, quantity: 1 }); }
    try { localStorage.setItem(key, JSON.stringify(cartList)); } catch { /* ignore */ }
    setCart(cartList);
    setCartCount(cartList.reduce((sum, i) => sum + i.quantity, 0));
    showToast(`"${item.name}" ajouté au panier ✓`);
  }

  function removeFromCart(productId: string) {
    const updated = cart.filter(i => i.productId !== productId);
    setCart(updated);
    setCartCount(updated.reduce((sum, i) => sum + i.quantity, 0));
    try { localStorage.setItem(`cart-${slug}`, JSON.stringify(updated)); } catch { /* ignore */ }
  }

  function updateCartQty(productId: string, qty: number) {
    if (qty <= 0) { removeFromCart(productId); return; }
    const updated = cart.map(i => i.productId === productId ? { ...i, quantity: qty } : i);
    setCart(updated);
    setCartCount(updated.reduce((sum, i) => sum + i.quantity, 0));
    try { localStorage.setItem(`cart-${slug}`, JSON.stringify(updated)); } catch { /* ignore */ }
  }

  function clearAll() {
    favorites.forEach(f => setRemoving(prev => new Set(prev).add(f.productId)));
    setTimeout(() => {
      setFavorites([]);
      setRemoving(new Set());
      try { localStorage.removeItem(`favorites-${slug}`); } catch { /* ignore */ }
      showToast("Favoris vidés");
    }, 220);
  }

  // ─── Tri ─────────────────────────────────────────────────────────────────

  const sortedFavorites = [...favorites].sort((a, b) => {
    if (sortBy === "price_asc")  return a.price - b.price;
    if (sortBy === "price_desc") return b.price - a.price;
    return 0; // "recent" = ordre localStorage
  });

  // ─── Rendu ────────────────────────────────────────────────────────────────

  const shopName       = shop?.name ?? slug;
  const whatsappNumber = shop?.whatsappNumber ?? null;
  const whatsappUrl    = whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}` : null;
  const cartTotal      = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAF9", fontFamily: "inherit" }}>
      <style>{CSS}</style>

      {toast && <div className="fav-toast">{toast}</div>}

      {/* ══ HEADER ══ */}
      <header className={`fav-header${headerCompact ? " compact" : ""}`}>
        <div className="fav-container fav-header-inner">

          <Link href={`/shop/${slug}`} className="fav-logo">
            <div className="fav-logo-icon">
              <span style={{ color: "#fff", fontWeight: 900, fontSize: 15 }}>B</span>
            </div>
            {!headerCompact && (
              <span style={{ fontWeight: 800, fontSize: 15, color: "#1F2A24" }}>{shopName}</span>
            )}
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="fav-hbtn"
                style={{ display: "none" }}
                // Hidden on small screens via inline trick — bottom nav handles it
              >
                <MessageCircle style={{ width: 14, height: 14 }} />
                Contact
              </a>
            )}
            <Link href={`/shop/${slug}/favorites`} className="fav-hbtn fav-hbtn-active">
              <Heart style={{ width: 14, height: 14, fill: "#EF4444" }} />
              Favoris
              {mounted && favorites.length > 0 && (
                <span className="fav-badge" style={{ background: "#EF4444", color: "#fff" }}>
                  {favorites.length > 9 ? "9+" : favorites.length}
                </span>
              )}
            </Link>
            <button className="fav-cart-btn" title="Panier" onClick={() => setCartOpen(true)}>
              <ShoppingCart style={{ width: 16, height: 16 }} />
              {cartCount > 0 && (
                <span className="fav-badge" style={{ background: "#1F2A24", color: "#fff" }}>
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>
            <Link href={`/shop/${slug}`} className="fav-hbtn fav-hbtn-green">
              Boutique
            </Link>
          </div>
        </div>
      </header>

      {/* ══ HERO ══ */}
      <div className="fav-hero" style={{ marginTop: 68 }}>
        <div className="fav-container fav-hero-inner">
          <div className="fav-hero-left">
            <div className="fav-hero-icon">
              <Heart style={{ width: 24, height: 24, color: "#EF4444", fill: "#EF4444" }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 21, fontWeight: 800, color: "#1F2A24" }}>
                Mes coups de cœur
              </h1>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#667085" }}>
                {mounted
                  ? favorites.length > 0
                    ? `${favorites.length} produit${favorites.length > 1 ? "s" : ""} sauvegardé${favorites.length > 1 ? "s" : ""} chez ${shopName}`
                    : `Aucun favori pour l'instant — parcourez ${shopName}`
                  : "Chargement…"}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href={`/shop/${slug}`} className="fav-hbtn" style={{ gap: 6 }}>
              <ArrowLeft style={{ width: 13, height: 13 }} />
              Continuer les achats
            </Link>
            {mounted && favorites.length > 0 && (
              <button
                onClick={clearAll}
                className="fav-hbtn"
                style={{ color: "#DC2626", borderColor: "#FECACA", background: "#FFF5F5" }}
              >
                <Trash2 style={{ width: 13, height: 13 }} />
                Tout vider
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ══ CONTENU ══ */}
      <div className="fav-main" style={{ paddingBottom: 60 }}>
        <div className="fav-container">

          {/* Spinner SSR */}
          {!mounted && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
              <div style={{ width: 38, height: 38, border: "4px solid #E8ECEA", borderTopColor: "#0A8F45", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          )}

          {/* État vide */}
          {mounted && favorites.length === 0 && (
            <div className="fav-empty">
              <div className="fav-empty-icon">
                <Heart style={{ width: 36, height: 36, color: "#EF4444" }} />
              </div>
              <div>
                <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "#1F2A24" }}>
                  Aucun favori pour l&apos;instant
                </h2>
                <p style={{ margin: 0, fontSize: 14, color: "#667085", maxWidth: 340 }}>
                  Cliquez sur le ♡ d&apos;un produit pour le retrouver ici facilement.
                </p>
              </div>
              <Link
                href={`/shop/${slug}`}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 46, padding: "0 24px", background: "#0A8F45", color: "#fff", borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: "none" }}
              >
                <Package style={{ width: 16, height: 16 }} />
                Découvrir la boutique
              </Link>
            </div>
          )}

          {/* Barre d'outils */}
          {mounted && favorites.length > 0 && (
            <div className="fav-toolbar">
              <p style={{ margin: 0, fontSize: 13, color: "#667085" }}>
                <strong style={{ color: "#1F2A24" }}>{favorites.length}</strong>{" "}
                produit{favorites.length > 1 ? "s" : ""} sauvegardé{favorites.length > 1 ? "s" : ""}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "#98A2B3" }}>Trier par :</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortBy)}
                  style={{ height: 34, border: "1.5px solid #E8ECEA", borderRadius: 8, padding: "0 10px", fontSize: 12, color: "#1F2A24", background: "#fff", outline: "none", cursor: "pointer" }}
                >
                  <option value="recent">Ajouté récemment</option>
                  <option value="price_asc">Prix croissant</option>
                  <option value="price_desc">Prix décroissant</option>
                </select>
              </div>
            </div>
          )}

          {/* Grille */}
          {mounted && favorites.length > 0 && (
            <div className="fav-grid">
              {sortedFavorites.map(item => (
                <div
                  key={item.productId}
                  className={`fav-card${removing.has(item.productId) ? " removing" : ""}`}
                >
                  {/* Image */}
                  <div className="fav-card-img-wrap">
                    <Link href={`/shop/${slug}/products/${item.productId}`} style={{ display: "block", height: "100%" }}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="fav-card-img" />
                      ) : (
                        <div className="fav-card-img-placeholder">
                          <Package style={{ width: 38, height: 38, color: "#C8CED6" }} />
                        </div>
                      )}
                    </Link>

                    {/* Bouton retirer — positionné dans l'img-wrap */}
                    <button
                      className="fav-card-remove"
                      onClick={() => removeFromFavorites(item.productId, item.name)}
                      title="Retirer des favoris"
                    >
                      <X style={{ width: 12, height: 12, color: "#EF4444" }} />
                    </button>
                  </div>

                  {/* Corps */}
                  <div className="fav-card-body">
                    {item.category && (
                      <div className="fav-card-cat">{item.category}</div>
                    )}
                    <Link
                      href={`/shop/${slug}/products/${item.productId}`}
                      className="fav-card-name"
                    >
                      {item.name}
                    </Link>
                    <div className="fav-card-price">{formatPrice(item.price)}</div>

                    <div className="fav-card-actions">
                      <Link
                        href={`/shop/${slug}/products/${item.productId}`}
                        className="fav-btn-view"
                      >
                        Voir
                      </Link>
                      <button className="fav-btn-cart" onClick={() => addToCart(item)}>
                        <ShoppingCart style={{ width: 12, height: 12 }} />
                        Panier
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA bas */}
          {mounted && favorites.length > 0 && (
            <div style={{ marginTop: 36, padding: "22px 24px", background: "#fff", border: "1px solid #E8ECEA", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#1F2A24", marginBottom: 3 }}>
                  Continuer vos achats
                </div>
                <div style={{ fontSize: 13, color: "#667085" }}>
                  Découvrez tous les produits de {shopName}
                </div>
              </div>
              <Link
                href={`/shop/${slug}`}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 44, padding: "0 22px", background: "#0A8F45", color: "#fff", borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: "none", flexShrink: 0 }}
              >
                <ArrowLeft style={{ width: 14, height: 14 }} />
                Retour à la boutique
              </Link>
            </div>
          )}

        </div>
      </div>

      {/* ══ BOTTOM NAV (mobile) ══ */}
      <nav className="fav-bottom-nav" aria-label="Navigation mobile">
        <Link href={`/shop/${slug}`} className="fav-bottom-nav-item">
          <Package style={{ width: 20, height: 20 }} />
          Boutique
        </Link>
        <Link href={`/shop/${slug}/favorites`} className="fav-bottom-nav-item active">
          <Heart style={{ width: 20, height: 20, fill: "#EF4444" }} />
          Favoris
        </Link>
        <button className="fav-bottom-nav-item" onClick={() => setCartOpen(true)} style={{ position: "relative" }}>
          <ShoppingCart style={{ width: 20, height: 20 }} />
          Panier
          {cartCount > 0 && (
            <span style={{ position: "absolute", top: 6, right: "calc(50% - 14px)", minWidth: 16, height: 16, borderRadius: 8, background: "#0A8F45", color: "#fff", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
              {cartCount > 9 ? "9+" : cartCount}
            </span>
          )}
        </button>
        {whatsappUrl ? (
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="fav-bottom-nav-item">
            <MessageCircle style={{ width: 20, height: 20 }} />
            Contact
          </a>
        ) : (
          <Link href={`/shop/${slug}`} className="fav-bottom-nav-item">
            <ArrowLeft style={{ width: 20, height: 20 }} />
            Retour
          </Link>
        )}
      </nav>

      {/* ══ CART DRAWER ══ */}
      {cartOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex" }}>
          <div
            style={{ flex: 1, background: "rgba(0,0,0,0.4)" }}
            onClick={() => setCartOpen(false)}
          />
          <div className="fav-drawer">
            {/* Header */}
            <div style={{ padding: "0 20px", height: 60, borderBottom: "1px solid #E8ECEA", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#1F2A24" }}>Votre panier</div>
                <div style={{ fontSize: 11, color: "#98A2B3", marginTop: 1 }}>
                  {cartCount} article{cartCount > 1 ? "s" : ""}
                </div>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                style={{ background: "none", border: "1.5px solid #E8ECEA", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#667085", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>

            {/* Items */}
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px" }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0", color: "#98A2B3" }}>
                  <div style={{ fontSize: 38, marginBottom: 12 }}>🛒</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1F2A24" }}>Panier vide</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Ajoutez des produits pour commander</div>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.productId} style={{ display: "flex", gap: 12, padding: "11px 0", borderBottom: "1px solid #F4F6F5" }}>
                    <div style={{ width: 54, height: 54, borderRadius: 10, background: "#F8FAF9", overflow: "hidden", flexShrink: 0 }}>
                      {item.imageUrl
                        ? <img src={item.imageUrl} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📦</div>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#1F2A24", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0A8F45", marginTop: 2 }}>
                        {(item.price * item.quantity).toLocaleString("fr-FR")} FCFA
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                        <button onClick={() => updateCartQty(item.productId, item.quantity - 1)} style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid #E8ECEA", background: "#fff", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", color: "#1F2A24" }}>−</button>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#1F2A24", minWidth: 20, textAlign: "center" }}>{item.quantity}</span>
                        <button onClick={() => updateCartQty(item.productId, item.quantity + 1)} style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid #E8ECEA", background: "#fff", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", color: "#1F2A24" }}>+</button>
                        <button onClick={() => removeFromCart(item.productId)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#EF4444", fontSize: 11, cursor: "pointer", padding: "2px 6px" }}>Retirer</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div style={{ padding: "14px 20px", borderTop: "1px solid #E8ECEA", flexShrink: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                  <span style={{ fontSize: 14, color: "#667085" }}>Total</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: "#1F2A24" }}>
                    {cartTotal.toLocaleString("fr-FR")} FCFA
                  </span>
                </div>
                <Link
                  href={`/shop/${slug}/checkout`}
                  style={{ display: "flex", width: "100%", height: 46, background: "#0A8F45", color: "#fff", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
                  onClick={() => setCartOpen(false)}
                >
                  Finaliser la commande →
                </Link>
                <button
                  onClick={() => { setCart([]); setCartCount(0); try { localStorage.removeItem(`cart-${slug}`); } catch { /* ignore */ } }}
                  style={{ width: "100%", marginTop: 8, background: "none", border: "none", color: "#98A2B3", fontSize: 12, cursor: "pointer", padding: "4px 0" }}
                >
                  Vider le panier
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

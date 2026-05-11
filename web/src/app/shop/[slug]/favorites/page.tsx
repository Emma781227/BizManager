"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Heart, ShoppingCart, MessageCircle, ArrowLeft, Package, Trash2, X } from "lucide-react";

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

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
  @keyframes spin   { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes popIn  { from { opacity:0; transform:scale(.92); } to { opacity:1; transform:scale(1); } }

  .fav-header {
    position: fixed; top: 0; left: 0; right: 0; z-index: 50;
    background: #fff; border-bottom: 1px solid #E8ECEA;
    height: 72px; box-shadow: 0 1px 8px rgba(16,24,40,0.05);
  }
  .fav-container {
    max-width: 1320px; margin: 0 auto;
    padding: 0 24px; box-sizing: border-box;
  }
  .fav-header-inner {
    display: flex; align-items: center; justify-content: space-between;
    height: 72px; gap: 16px;
  }
  .fav-logo {
    display: flex; align-items: center; gap: 9px;
    text-decoration: none; flex-shrink: 0;
  }
  .fav-logo-icon {
    width: 36px; height: 36px; background: #0A8F45;
    border-radius: 10px; display: flex; align-items: center;
    justify-content: center; flex-shrink: 0;
  }
  .fav-hbtn {
    display: flex; align-items: center; gap: 6px;
    height: 38px; padding: 0 14px;
    border: 1.5px solid #E8ECEA; border-radius: 10px;
    background: #fff; color: #667085; font-size: 13px;
    font-weight: 600; cursor: pointer; text-decoration: none;
    transition: all .15s; white-space: nowrap; position: relative;
  }
  .fav-hbtn:hover { border-color: #0A8F45; color: #0A8F45; background: #EAF7EF; }
  .fav-hbtn-active { border-color: #EF4444; color: #EF4444; background: #FFF5F5; }
  .fav-hbtn-active:hover { border-color: #DC2626; color: #DC2626; background: #FFF1F2; }
  .fav-hbtn-green { background: #0A8F45; color: #fff; border-color: #0A8F45; }
  .fav-hbtn-green:hover { background: #08763A; }
  .fav-cart-btn {
    position: relative; width: 38px; height: 38px;
    background: #0A8F45; border: none; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #fff; flex-shrink: 0;
    transition: background .15s;
  }
  .fav-cart-btn:hover { background: #08763A; }
  .fav-badge {
    position: absolute; top: -5px; right: -5px;
    width: 18px; height: 18px; border-radius: 50%;
    font-size: 10px; font-weight: 800;
    display: flex; align-items: center; justify-content: center;
  }

  /* Hero */
  .fav-hero {
    background: linear-gradient(135deg, #EAF7EF 0%, #F8FAF9 100%);
    border-bottom: 1px solid #E8ECEA;
    padding: 28px 0 24px;
  }
  .fav-hero-inner {
    display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
  }
  .fav-hero-left { display: flex; align-items: center; gap: 14px; }
  .fav-hero-icon {
    width: 52px; height: 52px; background: #fff;
    border-radius: 16px; border: 1.5px solid #E8ECEA;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 10px rgba(16,24,40,0.06);
  }

  /* Grille produits */
  .fav-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px; margin-top: 28px;
  }
  .fav-card {
    background: #fff; border: 1px solid #E8ECEA;
    border-radius: 16px; overflow: hidden;
    transition: box-shadow .15s, transform .15s;
    display: flex; flex-direction: column;
    box-shadow: 0 2px 8px rgba(16,24,40,0.04);
    animation: popIn .2s ease;
  }
  .fav-card:hover {
    box-shadow: 0 8px 24px rgba(10,143,69,0.12);
    transform: translateY(-2px);
  }
  .fav-card-img-wrap {
    position: relative; overflow: hidden;
    aspect-ratio: 1 / 1; background: #F8FAF9;
  }
  .fav-card-img {
    width: 100%; height: 100%; object-fit: cover;
    transition: transform .4s ease;
  }
  .fav-card:hover .fav-card-img { transform: scale(1.05); }
  .fav-card-img-placeholder {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #EAF7EF, #F8FAF9);
  }
  .fav-card-remove {
    position: absolute; top: 10px; right: 10px;
    width: 32px; height: 32px; background: rgba(255,255,255,0.95);
    border: 1.5px solid #E8ECEA; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all .15s;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  .fav-card-remove:hover { border-color: #EF4444; background: #FFF5F5; }
  .fav-card-body { padding: 12px 14px 14px; flex: 1; display: flex; flex-direction: column; }
  .fav-card-cat {
    font-size: 10px; font-weight: 700; color: #0A8F45;
    text-transform: uppercase; letter-spacing: .06em;
    margin-bottom: 5px;
  }
  .fav-card-name {
    font-size: 13px; font-weight: 700; color: #1F2A24;
    line-height: 1.4; margin-bottom: 8px; flex: 1;
    display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden;
  }
  .fav-card-price {
    font-size: 16px; font-weight: 800; color: #0A8F45;
    margin-bottom: 12px;
  }
  .fav-card-actions { display: flex; gap: 8px; }
  .fav-btn-cart {
    flex: 1; height: 38px; border-radius: 10px;
    border: none; background: #0A8F45;
    color: #fff; font-size: 12px; font-weight: 700;
    cursor: pointer; display: flex; align-items: center;
    justify-content: center; gap: 6px; transition: background .15s;
  }
  .fav-btn-cart:hover { background: #08763A; }

  /* Empty state */
  .fav-empty {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 16px; padding: 80px 24px;
    text-align: center;
  }
  .fav-empty-icon {
    width: 80px; height: 80px; background: #FFF5F5;
    border-radius: 24px; display: flex; align-items: center;
    justify-content: center;
  }

  /* Toast */
  .fav-toast {
    position: fixed; bottom: 28px; left: 50%;
    transform: translateX(-50%); z-index: 9999;
    background: #1F2A24; color: #fff;
    padding: 12px 24px; border-radius: 12px;
    font-weight: 600; font-size: 14px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    white-space: nowrap; animation: fadeUp .2s ease;
  }

  /* Barre de tri */
  .fav-toolbar {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; margin-top: 24px; flex-wrap: wrap;
  }

  /* Responsive */
  @media (max-width: 1100px) { .fav-grid { grid-template-columns: repeat(3, 1fr); } }
  @media (max-width: 768px)  { .fav-grid { grid-template-columns: repeat(2, 1fr); } }
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

  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [shop,      setShop]      = useState<Shop | null>(null);
  const [cart,      setCart]      = useState<CartItem[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartOpen,  setCartOpen]  = useState(false);
  const [toast,     setToast]     = useState<string | null>(null);
  const [mounted,   setMounted]   = useState(false);

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

  // ─── Toast auto-dismiss ───────────────────────────────────────────────────

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  // ─── Actions ─────────────────────────────────────────────────────────────

  function removeFromFavorites(productId: string, name: string) {
    const updated = favorites.filter(f => f.productId !== productId);
    setFavorites(updated);
    try { localStorage.setItem(`favorites-${slug}`, JSON.stringify(updated)); } catch { /* ignore */ }
    setToast(`"${name}" retiré des favoris`);
  }

  function addToCart(item: FavoriteItem) {
    // Ajouter au panier
    const key = `cart-${slug}`;
    let cartList: CartItem[] = [...cart];
    const existing = cartList.find(i => i.productId === item.productId);
    if (existing) { existing.quantity += 1; }
    else { cartList.push({ productId: item.productId, name: item.name, price: item.price, imageUrl: item.imageUrl, quantity: 1 }); }
    try { localStorage.setItem(key, JSON.stringify(cartList)); } catch { /* ignore */ }
    setCart(cartList);
    setCartCount(cartList.reduce((sum, i) => sum + i.quantity, 0));

    // Retirer des favoris
    const updated = favorites.filter(f => f.productId !== item.productId);
    setFavorites(updated);
    try { localStorage.setItem(`favorites-${slug}`, JSON.stringify(updated)); } catch { /* ignore */ }

    setToast(`"${item.name}" ajouté au panier ✓`);
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
    setFavorites([]);
    try { localStorage.removeItem(`favorites-${slug}`); } catch { /* ignore */ }
    setToast("Favoris vidés");
  }

  // ─── Rendu ────────────────────────────────────────────────────────────────

  const shopName       = shop?.name ?? slug;
  const whatsappNumber = shop?.whatsappNumber ?? null;
  const whatsappUrl    = whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}` : null;

  return (
    <div style={{ minHeight:"100vh", background:"#F8FAF9", fontFamily:"inherit" }}>
      <style>{CSS}</style>

      {toast && <div className="fav-toast">{toast}</div>}

      {/* ══ HEADER ══ */}
      <header className="fav-header">
        <div className="fav-container fav-header-inner">

          {/* Logo */}
          <Link href={`/shop/${slug}`} className="fav-logo">
            <div className="fav-logo-icon">
              <span style={{ color:"#fff", fontWeight:900, fontSize:16 }}>B</span>
            </div>
            <span style={{ fontWeight:800, fontSize:16, color:"#1F2A24" }}>BizManager</span>
          </Link>

          {/* Actions */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginLeft:"auto" }}>
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="fav-hbtn">
                <MessageCircle style={{ width:15, height:15 }} />
                Nous contacter
              </a>
            )}
            <Link href={`/shop/${slug}/favorites`} className="fav-hbtn fav-hbtn-active">
              <Heart style={{ width:15, height:15, fill:"#EF4444" }} />
              Favoris
              {favorites.length > 0 && (
                <span className="fav-badge" style={{ background:"#EF4444", color:"#fff" }}>
                  {favorites.length > 9 ? "9+" : favorites.length}
                </span>
              )}
            </Link>
            <button 
              className="fav-cart-btn" 
              title="Panier"
              onClick={() => setCartOpen(true)}
              style={{ position: "relative" }}>
              <ShoppingCart style={{ width:17, height:17 }} />
              {cartCount > 0 && (
                <span className="fav-badge" style={{ background:"#1F2A24", color:"#fff" }}>
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>
            <Link href={`/shop/${slug}`} className="fav-hbtn fav-hbtn-green">
              Voir la boutique
            </Link>
          </div>
        </div>
      </header>

      {/* ══ HERO ══ */}
      <div className="fav-hero" style={{ marginTop:72 }}>
        <div className="fav-container fav-hero-inner">
          <div className="fav-hero-left">
            <div className="fav-hero-icon">
              <Heart style={{ width:26, height:26, color:"#EF4444", fill:"#EF4444" }} />
            </div>
            <div>
              <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:"#1F2A24" }}>Mes coups de cœur</h1>
              <p style={{ margin:"4px 0 0", fontSize:13, color:"#667085" }}>
                {mounted
                  ? favorites.length > 0
                    ? `${favorites.length} produit${favorites.length > 1 ? "s" : ""} sauvegardé${favorites.length > 1 ? "s" : ""} dans ${shopName}`
                    : `Aucun favori pour l'instant — parcourez ${shopName}`
                  : "Chargement…"}
              </p>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <Link href={`/shop/${slug}`} className="fav-hbtn" style={{ gap:7 }}>
              <ArrowLeft style={{ width:14, height:14 }} />
              Continuer les achats
            </Link>
            {mounted && favorites.length > 0 && (
              <button onClick={clearAll} className="fav-hbtn"
                style={{ color:"#DC2626", borderColor:"#FECACA" }}>
                <Trash2 style={{ width:14, height:14 }} />
                Tout vider
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ══ CONTENU ══ */}
      <div style={{ paddingBottom:60 }}>
        <div className="fav-container">

          {/* Pas encore monté (SSR) */}
          {!mounted && (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"80px 0" }}>
              <div style={{ width:40, height:40, border:"4px solid #E8ECEA", borderTopColor:"#0A8F45", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
            </div>
          )}

          {/* État vide */}
          {mounted && favorites.length === 0 && (
            <div className="fav-empty">
              <div className="fav-empty-icon">
                <Heart style={{ width:38, height:38, color:"#EF4444" }} />
              </div>
              <div>
                <h2 style={{ margin:"0 0 8px", fontSize:20, fontWeight:800, color:"#1F2A24" }}>
                  Aucun favori pour l&apos;instant
                </h2>
                <p style={{ margin:0, fontSize:14, color:"#667085", maxWidth:360 }}>
                  Cliquez sur le cœur ♡ d&apos;un produit pour le retrouver ici facilement.
                </p>
              </div>
              <Link href={`/shop/${slug}`}
                style={{ display:"inline-flex", alignItems:"center", gap:8, height:46, padding:"0 24px", background:"#0A8F45", color:"#fff", borderRadius:12, fontWeight:700, fontSize:14, textDecoration:"none" }}>
                <Package style={{ width:16, height:16 }} />
                Découvrir la boutique
              </Link>
            </div>
          )}

          {/* Barre d'outils */}
          {mounted && favorites.length > 0 && (
            <div className="fav-toolbar">
              <p style={{ margin:0, fontSize:13, color:"#667085" }}>
                <strong style={{ color:"#1F2A24" }}>{favorites.length}</strong> produit{favorites.length > 1 ? "s" : ""} sauvegardé{favorites.length > 1 ? "s" : ""}
              </p>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:12, color:"#98A2B3" }}>Trier par :</span>
                <select style={{ height:34, border:"1.5px solid #E8ECEA", borderRadius:8, padding:"0 10px", fontSize:12, color:"#1F2A24", background:"#fff", outline:"none", cursor:"pointer" }}>
                  <option>Ajouté récemment</option>
                  <option>Prix croissant</option>
                  <option>Prix décroissant</option>
                </select>
              </div>
            </div>
          )}

          {/* Grille de produits */}
          {mounted && favorites.length > 0 && (
            <div className="fav-grid">
              {favorites.map(item => (
                <div key={item.productId} className="fav-card">

                  {/* Image */}
                  <Link href={`/shop/${slug}/products/${item.productId}`} style={{ display:"block" }}>
                    <div className="fav-card-img-wrap">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="fav-card-img" />
                      ) : (
                        <div className="fav-card-img-placeholder">
                          <Package style={{ width:40, height:40, color:"#C8CED6" }} />
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Bouton retirer */}
                  <button
                    className="fav-card-remove"
                    onClick={() => removeFromFavorites(item.productId, item.name)}
                    title="Retirer des favoris"
                    style={{ position:"absolute", top:10, right:10 }}
                  >
                    <X style={{ width:13, height:13, color:"#EF4444" }} />
                  </button>

                  {/* Corps */}
                  <div className="fav-card-body">
                    {item.category && (
                      <div className="fav-card-cat">{item.category}</div>
                    )}
                    <Link href={`/shop/${slug}/products/${item.productId}`}
                      style={{ textDecoration:"none" }}>
                      <div className="fav-card-name">{item.name}</div>
                    </Link>
                    <div className="fav-card-price">{formatPrice(item.price)}</div>

                    {/* Actions */}
                    <div className="fav-card-actions">
                      <button className="fav-btn-cart" onClick={() => addToCart(item)}>
                        <ShoppingCart style={{ width:13, height:13 }} />
                        Ajouter au panier
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Suggestion bas de page */}
          {mounted && favorites.length > 0 && (
            <div style={{ marginTop:40, padding:"24px", background:"#fff", border:"1px solid #E8ECEA", borderRadius:18, display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
              <div>
                <div style={{ fontWeight:700, fontSize:15, color:"#1F2A24", marginBottom:4 }}>
                  Continuer vos achats
                </div>
                <div style={{ fontSize:13, color:"#667085" }}>
                  Découvrez tous les produits de la boutique {shopName}
                </div>
              </div>
              <Link href={`/shop/${slug}`}
                style={{ display:"inline-flex", alignItems:"center", gap:8, height:44, padding:"0 22px", background:"#0A8F45", color:"#fff", borderRadius:12, fontWeight:700, fontSize:14, textDecoration:"none", flexShrink:0 }}>
                <ArrowLeft style={{ width:15, height:15 }} />
                Retour à la boutique
              </Link>
            </div>
          )}

        </div>
      </div>

      {/* ══ CART SIDEBAR ══ */}
      {cartOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex' }}>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)' }} onClick={() => setCartOpen(false)} />
          <div style={{ width: 380, maxWidth: '92vw', background: '#fff', display: 'flex', flexDirection: 'column', height: '100%', boxShadow: '-8px 0 32px rgba(0,0,0,0.12)' }}>
            {/* Header panier */}
            <div style={{ padding: '0 20px', height: 64, borderBottom: '1px solid #E8ECEA', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 17, color: '#1F2A24' }}>Votre panier</div>
                <div style={{ fontSize: 12, color: '#98A2B3', marginTop: 2 }}>{cartCount} article{cartCount > 1 ? 's' : ''}</div>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                style={{ background: 'none', border: '1.5px solid #E8ECEA', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#667085', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            {/* Items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#98A2B3' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1F2A24' }}>Votre panier est vide</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Ajoutez des produits pour commander</div>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.productId} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid #F4F6F5' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 10, background: '#F8FAF9', overflow: 'hidden', flexShrink: 0 }}>
                      {item.imageUrl
                        ? <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📦</div>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#1F2A24', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0A8F45', marginTop: 2 }}>{(item.price * item.quantity).toLocaleString('fr-FR')} FCFA</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                        <button
                          onClick={() => updateCartQty(item.productId, item.quantity - 1)}
                          style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid #E8ECEA', background: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1F2A24' }}
                        >−</button>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1F2A24', minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                        <button
                          onClick={() => updateCartQty(item.productId, item.quantity + 1)}
                          style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid #E8ECEA', background: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1F2A24' }}
                        >+</button>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#EF4444', fontSize: 11, cursor: 'pointer', padding: '2px 6px' }}
                        >Retirer</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer panier */}
            {cart.length > 0 && (
              <div style={{ padding: '16px 20px', borderTop: '1px solid #E8ECEA', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                  <span style={{ fontSize: 14, color: '#667085' }}>Total</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: '#1F2A24' }}>
                    {cart.reduce((sum, i) => sum + i.price * i.quantity, 0).toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <Link
                  href={`/shop/${slug}`}
                  style={{ display: 'flex', width: '100%', height: 48, background: '#0A8F45', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                  onClick={() => setCartOpen(false)}
                >
                  Finaliser l'achat →
                </Link>
                <button
                  onClick={() => { setCart([]); setCartCount(0); try { localStorage.removeItem(`cart-${slug}`); } catch {} }}
                  style={{ width: '100%', marginTop: 8, background: 'none', border: 'none', color: '#98A2B3', fontSize: 12, cursor: 'pointer', padding: '4px 0' }}
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

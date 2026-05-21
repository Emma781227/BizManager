'use client';

import { useEffect, useRef, useState } from 'react';
import { Heart, Home, MessageCircle, Search, ShoppingBag, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Shop {
  id: string;
  name: string;
  slug: string;
  category?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  city?: string | null;
  location?: string | null;
  description?: string | null;
  rating?: number;
  reviewCount?: number;
  openingHours?: string;
  whatsappNumber?: string;
  productsCount?: number;
}

interface Product {
  id: string;
  name: string;
  description?: string | null;
  unitPrice: string;
  stock: number;
  imageUrl: string | null;
  imageVariants?: string[];
  category?: string | null;
  categories?: string[];
  rating?: number;
  reviews?: number;
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  stock: number;
}

interface ConfirmedOrder {
  orderId: string;
  totalAmount: string;
  shopName: string;
  whatsappNumber?: string | null;
}

const CSS = `
  *, *::before, *::after { box-sizing: border-box; }

  /* ── Header ─────────────────────────────────────────────────────── */
  .sp-header {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    background: #fff; border-bottom: 1px solid #E8ECEA;
    height: 64px; transition: height .2s ease, box-shadow .2s ease;
  }
  .sp-header.compact { height: 52px; box-shadow: 0 2px 16px rgba(0,0,0,.08); }
  .sp-header-inner {
    max-width: 1400px; margin: 0 auto; padding: 0 24px;
    height: 100%; display: flex; align-items: center; gap: 14px;
  }
  .sp-logo { display: flex; align-items: center; gap: 8px; flex-shrink: 0; text-decoration: none; }
  .sp-logo-icon {
    width: 34px; height: 34px; background: #0A8F45; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
  }
  .sp-logo-name { font-weight: 800; font-size: 16px; color: #1F2A24; }
  .sp-search-bar {
    flex: 1; max-width: 540px; position: relative; display: flex; align-items: center;
  }
  .sp-search-input {
    width: 100%; height: 38px; padding: 0 14px 0 40px;
    border: 1.5px solid #E8ECEA; border-radius: 10px;
    font-size: 13px; color: #1F2A24; background: #F8FAF9; outline: none;
    transition: border-color .15s, background .15s;
  }
  .sp-search-input:focus { border-color: #0A8F45; background: #fff; }
  .sp-search-input::placeholder { color: #98A2B3; }
  .sp-search-icon-pos { position: absolute; left: 12px; color: #98A2B3; pointer-events: none; }
  .sp-header-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; flex-shrink: 0; }
  .sp-icon-btn {
    position: relative; width: 38px; height: 38px; border-radius: 10px;
    border: none; display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: background .15s, opacity .15s; text-decoration: none;
    flex-shrink: 0;
  }
  .sp-icon-btn-outline { background: #fff; border: 1.5px solid #E8ECEA; color: #667085; }
  .sp-icon-btn-outline:hover { border-color: #0A8F45; color: #0A8F45; background: #F6FFF9; }
  .sp-icon-btn-green { background: #0A8F45; color: #fff; }
  .sp-icon-btn-green:hover { background: #08763A; }
  .sp-icon-btn-red { background: #EF4444; color: #fff; }
  .sp-icon-btn-red:hover { background: #DC2626; }
  .sp-badge {
    position: absolute; top: -5px; right: -5px; min-width: 18px; height: 18px;
    background: #1F2A24; color: #fff; font-size: 10px; font-weight: 800;
    border-radius: 9px; display: flex; align-items: center; justify-content: center; padding: 0 4px;
  }
  .sp-contact-btn {
    display: flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px;
    background: #EAF7EF; color: #0A8F45; border-radius: 8px; font-weight: 600;
    font-size: 12px; text-decoration: none; border: 1.5px solid #C3EDD7;
    white-space: nowrap; transition: background .15s; flex-shrink: 0;
  }
  .sp-contact-btn:hover { background: #D7F4E7; }

  /* ── Main ────────────────────────────────────────────────────────── */
  .sp-main {
    max-width: 1400px; margin: 0 auto;
    padding: 80px 24px 80px; min-height: 100vh;
  }

  /* ── Hero ────────────────────────────────────────────────────────── */
  .sp-hero {
    width: 100%; height: 300px; border-radius: 20px;
    overflow: hidden; position: relative; background: #1a3c2f;
    background-size: cover; background-position: center;
  }
  .sp-hero-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(90deg, rgba(10,20,16,.82) 0%, rgba(10,20,16,.52) 55%, rgba(10,20,16,.15) 100%);
  }
  .sp-hero-cta {
    position: absolute; top: 22px; right: 22px;
    display: flex; align-items: center; gap: 7px;
    height: 40px; padding: 0 18px; background: #0A8F45; color: #fff;
    border: none; border-radius: 10px; font-size: 13px; font-weight: 700;
    cursor: pointer; text-decoration: none; transition: background .15s;
  }
  .sp-hero-cta:hover { background: #08763A; }
  .sp-hero-content {
    position: absolute; inset: 0; padding: 32px 36px;
    display: flex; align-items: flex-end; gap: 20px;
  }
  .sp-shop-avatar {
    width: 90px; height: 90px; border-radius: 16px; background: #fff;
    overflow: hidden; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 0 3px rgba(255,255,255,.2); margin-bottom: 4px;
  }
  .sp-hero-info { flex: 1; color: #fff; min-width: 0; }
  .sp-hero-name { font-size: 26px; font-weight: 800; color: #fff; margin: 0 0 5px; }
  .sp-hero-meta { font-size: 13px; color: rgba(255,255,255,.75); margin-bottom: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .sp-hero-badges { display: flex; gap: 8px; flex-wrap: wrap; }
  .sp-hero-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;
  }
  .sp-badge-verified { background: rgba(10,143,69,.9); color: #fff; }
  .sp-badge-city { background: rgba(255,255,255,.14); color: rgba(255,255,255,.9); backdrop-filter: blur(4px); }

  /* ── Stats strip ─────────────────────────────────────────────────── */
  .sp-stats {
    display: flex; background: #fff; border: 1px solid #E8ECEA;
    border-radius: 14px; overflow: hidden; margin: 14px 0;
  }
  .sp-stat {
    flex: 1; padding: 13px 12px; text-align: center;
    border-right: 1px solid #E8ECEA;
  }
  .sp-stat:last-child { border-right: none; }
  .sp-stat-val { font-size: 17px; font-weight: 800; color: #1F2A24; }
  .sp-stat-lbl { font-size: 11px; color: #98A2B3; font-weight: 500; margin-top: 2px; }

  /* ── Categories ──────────────────────────────────────────────────── */
  .sp-cats {
    display: flex; gap: 8px; overflow-x: auto; padding-bottom: 2px;
    scrollbar-width: none; -ms-overflow-style: none; margin-bottom: 12px;
  }
  .sp-cats::-webkit-scrollbar { display: none; }
  .sp-cat {
    height: 36px; padding: 0 18px; border-radius: 18px;
    border: 1.5px solid #E8ECEA; font-size: 13px; font-weight: 600;
    cursor: pointer; white-space: nowrap; flex-shrink: 0;
    transition: all .15s; background: #fff; color: #1F2A24;
  }
  .sp-cat.active { background: #0A8F45; color: #fff; border-color: #0A8F45; }
  .sp-cat:not(.active):hover { border-color: #0A8F45; color: #0A8F45; }

  /* ── Filter bar ──────────────────────────────────────────────────── */
  .sp-filters {
    display: flex; align-items: center; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;
  }
  .sp-select {
    height: 36px; padding: 0 12px; border: 1.5px solid #E8ECEA;
    border-radius: 8px; font-size: 12px; color: #1F2A24;
    background: #fff; cursor: pointer; outline: none;
  }
  .sp-select:focus { border-color: #0A8F45; }
  .sp-count { font-size: 12px; color: #98A2B3; margin-left: auto; flex-shrink: 0; }

  /* ── Product grid ────────────────────────────────────────────────── */
  .sp-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }

  /* ── Product card ────────────────────────────────────────────────── */
  .sp-card {
    background: #fff; border: 1px solid #E8ECEA; border-radius: 14px;
    overflow: hidden; transition: box-shadow .15s, transform .15s;
  }
  .sp-card:hover { box-shadow: 0 6px 28px rgba(16,24,40,.09); transform: translateY(-2px); }
  .sp-card-img-wrap {
    position: relative; padding-bottom: 75%; overflow: hidden; background: #F8FAF9;
  }
  .sp-card-img {
    position: absolute; inset: 0; width: 100%; height: 100%;
    object-fit: cover; transition: transform .35s;
  }
  .sp-card:hover .sp-card-img { transform: scale(1.05); }
  .sp-card-stock {
    position: absolute; bottom: 8px; left: 8px;
    padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;
  }
  .sp-card-fav {
    position: absolute; top: 8px; right: 8px; width: 30px; height: 30px;
    background: #fff; border: none; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,.14); z-index: 1;
    transition: transform .15s;
  }
  .sp-card-fav:hover { transform: scale(1.1); }
  .sp-card-body { padding: 11px 13px 13px; }
  .sp-card-name {
    font-size: 13px; font-weight: 700; color: #1F2A24;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 4px;
  }
  .sp-card-price { font-size: 15px; font-weight: 800; color: #1F2A24; margin-bottom: 10px; }
  .sp-card-actions { display: flex; gap: 7px; }
  .sp-card-btn-see {
    height: 33px; padding: 0 11px;
    border: 1.5px solid #E8ECEA; border-radius: 8px;
    background: #fff; color: #1F2A24; font-size: 11px; font-weight: 600;
    cursor: pointer; white-space: nowrap; transition: all .15s;
    text-decoration: none; display: flex; align-items: center; flex-shrink: 0;
  }
  .sp-card-btn-see:hover { border-color: #0A8F45; color: #0A8F45; }
  .sp-card-btn-add {
    flex: 1; height: 33px; background: #0A8F45; color: #fff;
    border: none; border-radius: 8px; font-size: 11px; font-weight: 600;
    cursor: pointer; transition: background .15s;
  }
  .sp-card-btn-add:hover:not(:disabled) { background: #08763A; }
  .sp-card-btn-add:disabled { opacity: .4; cursor: default; }

  /* ── Skeleton ────────────────────────────────────────────────────── */
  @keyframes shimmer {
    0% { background-position: -600px 0; }
    100% { background-position: 600px 0; }
  }
  .sp-skel {
    background: linear-gradient(90deg, #F0F2F1 25%, #E4E8E6 50%, #F0F2F1 75%);
    background-size: 1200px 100%; animation: shimmer 1.5s infinite linear;
  }
  .sp-skel-card { background: #fff; border: 1px solid #E8ECEA; border-radius: 14px; overflow: hidden; }
  .sp-skel-img { padding-bottom: 75%; }
  .sp-skel-line { border-radius: 6px; }

  /* ── Cart drawer ─────────────────────────────────────────────────── */
  .sp-cart-backdrop {
    position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 500;
    opacity: 0; animation: backdropIn .2s ease forwards;
  }
  .sp-cart-drawer {
    position: fixed; top: 0; right: 0; bottom: 0; width: 380px; max-width: 92vw;
    background: #fff; z-index: 501; display: flex; flex-direction: column;
    box-shadow: -8px 0 40px rgba(0,0,0,.14);
    transform: translateX(100%); animation: drawerIn .25s ease forwards;
  }
  @keyframes backdropIn { to { opacity: 1; } }
  @keyframes drawerIn { to { transform: translateX(0); } }

  /* ── Bottom nav (mobile only) ────────────────────────────────────── */
  .sp-bottom-nav {
    display: none; position: fixed; bottom: 0; left: 0; right: 0; z-index: 200;
    background: #fff; border-top: 1px solid #E8ECEA; height: 60px;
    align-items: stretch; box-shadow: 0 -4px 24px rgba(0,0,0,.06);
  }
  .sp-bnav-item {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 3px; background: none; border: none;
    cursor: pointer; color: #98A2B3; font-size: 10px; font-weight: 600;
    text-decoration: none; transition: color .15s; position: relative; padding: 0;
  }
  .sp-bnav-item.active,
  .sp-bnav-item:hover { color: #0A8F45; }
  .sp-bnav-badge {
    position: absolute; top: 7px; left: 50%; margin-left: 4px;
    min-width: 15px; height: 15px; background: #EF4444; color: #fff;
    font-size: 9px; font-weight: 800; border-radius: 8px;
    display: flex; align-items: center; justify-content: center; padding: 0 3px;
  }

  /* ── Reassurance ─────────────────────────────────────────────────── */
  .sp-reassurance {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 32px 0 8px;
  }
  .sp-reassurance-item {
    background: #fff; border: 1px solid #E8ECEA; border-radius: 14px;
    padding: 16px 14px; display: flex; align-items: center; gap: 12px;
  }
  .sp-reassurance-icon {
    width: 40px; height: 40px; background: #EAF7EF; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;
  }

  /* ── Load more ───────────────────────────────────────────────────── */
  .sp-load-more {
    display: block; margin: 28px auto 0; height: 44px; padding: 0 36px;
    background: #fff; color: #1F2A24; border: 1.5px solid #E8ECEA;
    border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all .15s;
  }
  .sp-load-more:hover { border-color: #0A8F45; color: #0A8F45; }

  /* ── Responsive ──────────────────────────────────────────────────── */
  @media (max-width: 1200px) {
    .sp-grid { grid-template-columns: repeat(3, 1fr); }
    .sp-reassurance { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 900px) {
    .sp-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  }
  @media (max-width: 768px) {
    .sp-main { padding: 70px 16px 80px; }
    .sp-header-inner { padding: 0 16px; }
    .sp-logo-name { display: none; }
    .sp-contact-btn { display: none; }
    .sp-hero { height: 220px; border-radius: 14px; }
    .sp-hero-content { padding: 18px 20px; }
    .sp-hero-name { font-size: 19px; }
    .sp-hero-meta { font-size: 12px; margin-bottom: 8px; }
    .sp-shop-avatar { width: 70px; height: 70px; border-radius: 12px; }
    .sp-hero-cta { top: 14px; right: 14px; height: 34px; font-size: 12px; padding: 0 14px; }
    .sp-stats { flex-wrap: wrap; }
    .sp-stat { min-width: 50%; border-right: none; border-bottom: 1px solid #E8ECEA; }
    .sp-stat:nth-child(odd) { border-right: 1px solid #E8ECEA; }
    .sp-stat:nth-last-child(-n+2) { border-bottom: none; }
    .sp-reassurance { grid-template-columns: 1fr; }
    .sp-bottom-nav { display: flex; }
  }
  @media (max-width: 480px) {
    .sp-grid { gap: 8px; }
    .sp-card-body { padding: 9px 11px 11px; }
    .sp-hero { height: 185px; }
    .sp-hero-content { padding: 14px 16px; }
    .sp-shop-avatar { width: 58px; height: 58px; border-radius: 10px; }
    .sp-hero-name { font-size: 16px; }
  }
`;

export default function ShopPage() {
  const params_hook = useParams<{ slug: string }>();
  const slug = params_hook?.slug || '';

  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [apiCategories, setApiCategories] = useState<string[]>([]);

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedPrice, setSelectedPrice] = useState('all');
  const [selectedAvailability, setSelectedAvailability] = useState('all');
  const [selectedSort, setSelectedSort] = useState('newest');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [headerCompact, setHeaderCompact] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  // ── Compact header on scroll ──────────────────────────────────────
  useEffect(() => {
    function onScroll() { setHeaderCompact(window.scrollY > 48); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Favorites ─────────────────────────────────────────────────────
  const toggleFavorite = (productId: string, product?: Product) => {
    const key = `favorites-${slug}`;
    let favs: Array<{ productId: string; name: string; price: number; imageUrl: string | null; category?: string | null }> = [];
    try { const s = localStorage.getItem(key); if (s) favs = JSON.parse(s); } catch {}
    const already = favs.some(f => f.productId === productId);
    if (already) {
      favs = favs.filter(f => f.productId !== productId);
    } else if (product) {
      favs.push({ productId: product.id, name: product.name, price: parseFloat(product.unitPrice), imageUrl: product.imageUrl, category: product.category });
    }
    try { localStorage.setItem(key, JSON.stringify(favs)); } catch {}
    setFavorites(new Set(favs.map(f => f.productId)));
  };

  // ── Cart helpers ──────────────────────────────────────────────────
  function addToCart(product: Product) {
    setCart(prev => {
      const ex = prev.find(i => i.productId === product.id);
      if (ex) return prev.map(i => i.productId === product.id ? { ...i, quantity: Math.min(i.quantity + 1, product.stock) } : i);
      return [...prev, { productId: product.id, name: product.name, price: parseFloat(product.unitPrice), imageUrl: product.imageUrl, quantity: 1, stock: product.stock }];
    });
  }
  function removeFromCart(productId: string) { setCart(prev => prev.filter(i => i.productId !== productId)); }
  function updateCartQty(productId: string, qty: number) {
    if (qty <= 0) { removeFromCart(productId); return; }
    setCart(prev => prev.map(i => i.productId === productId ? { ...i, quantity: Math.min(qty, i.stock) } : i));
  }

  // ── Formatting helpers ────────────────────────────────────────────
  const formatPrice = (unitPrice?: string) => {
    if (!unitPrice) return 'N/A';
    const p = Number(unitPrice);
    return Number.isNaN(p) ? 'N/A' : `${p.toLocaleString('fr-FR')} FCFA`;
  };
  const stockLabel = (stock: number) => stock <= 0 ? 'Rupture' : stock <= 5 ? 'Stock faible' : 'En stock';
  const stockTone = (stock: number) => stock <= 0
    ? { color: '#dc2626', bg: '#fff1f2' }
    : stock <= 5
      ? { color: '#F08A24', bg: '#FFF1E5' }
      : { color: '#0A8F45', bg: '#DDF6E7' };

  // ── Product card ──────────────────────────────────────────────────
  const renderProductCard = (product: Product) => {
    const tone = stockTone(product.stock);
    const isFav = favorites.has(product.id);
    return (
      <article key={product.id} className="sp-card">
        <div className="sp-card-img-wrap">
          <Link href={`/shop/${slug}/products/${product.id}`}>
            {product.imageUrl
              ? <img src={product.imageUrl} alt={product.name} className="sp-card-img" />
              : <div className="sp-card-img" style={{ background: '#F0F2F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>📦</div>
            }
          </Link>
          <div className="sp-card-stock" style={{ background: tone.bg, color: tone.color }}>
            {stockLabel(product.stock)}
          </div>
          <button className="sp-card-fav" onClick={() => toggleFavorite(product.id, product)}>
            <span style={{ fontSize: 14, color: isFav ? '#EF4444' : '#D0D5DD' }}>{isFav ? '♥' : '♡'}</span>
          </button>
        </div>
        <div className="sp-card-body">
          <div className="sp-card-name">{product.name}</div>
          <div className="sp-card-price">{formatPrice(product.unitPrice)}</div>
          <div className="sp-card-actions">
            <Link href={`/shop/${slug}/products/${product.id}`} className="sp-card-btn-see">Voir</Link>
            <button
              className="sp-card-btn-add"
              disabled={product.stock <= 0}
              onClick={() => { if (product.stock > 0) { addToCart(product); setCartOpen(true); } }}
            >
              {product.stock <= 0 ? 'Rupture' : 'Ajouter au panier'}
            </button>
          </div>
        </div>
      </article>
    );
  };

  // ── Data fetching ─────────────────────────────────────────────────
  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const res = await fetch(`/api/public/shop/${slug}`);
        if (!res.ok) throw new Error('Shop not found');
        const data = await res.json();
        setShop(data?.data ?? data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    try {
      const s = localStorage.getItem(`favorites-${slug}`);
      if (s) setFavorites(new Set((JSON.parse(s) as Array<{ productId: string }>).map(f => f.productId)));
    } catch {}
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    try { const s = localStorage.getItem(`cart-${slug}`); if (s) setCart(JSON.parse(s)); } catch {}
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    localStorage.setItem(`cart-${slug}`, JSON.stringify(cart));
  }, [cart, slug]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchText), 300);
    return () => clearTimeout(t);
  }, [searchText]);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      setProductsLoading(true);
      try {
        const p = new URLSearchParams();
        if (debouncedSearch) p.append('q', debouncedSearch);
        if (activeCategory !== 'all') p.append('category', activeCategory);
        if (selectedAvailability === 'in-stock') p.append('inStock', '1');
        if (selectedAvailability === 'low-stock') p.append('stockStatus', 'low');
        if (selectedAvailability === 'out-of-stock') p.append('stockStatus', 'out');
        if (selectedPrice === '0-25000') { p.append('minPrice', '0'); p.append('maxPrice', '25000'); }
        else if (selectedPrice === '25000-50000') { p.append('minPrice', '25000'); p.append('maxPrice', '50000'); }
        else if (selectedPrice === '50000+') p.append('minPrice', '50000');
        if (selectedSort !== 'newest') p.append('sort', selectedSort);
        const res = await fetch(`/api/public/shop/${slug}/products?${p.toString()}`);
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        setProducts(data?.data || []);
        if (data.meta?.categories) setApiCategories(data.meta.categories);
      } catch {
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };
    load();
  }, [slug, debouncedSearch, activeCategory, selectedAvailability, selectedPrice, selectedSort]);

  // ── Loading / error states ────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8FAF9', color: '#667085', fontSize: 15 }}>
      Chargement de la boutique…
    </div>
  );
  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8FAF9', color: '#a63b35', fontSize: 15 }}>
      {error}
    </div>
  );
  if (!shop) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8FAF9', color: '#667085', fontSize: 15 }}>
      Boutique non trouvée
    </div>
  );

  const whatsappUrl = shop.whatsappNumber
    ? `https://wa.me/${shop.whatsappNumber.replace(/[^0-9]/g, '')}`
    : null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAF9' }}>
      <style>{CSS}</style>

      {/* ── Header ───────────────────────────────────────────────────── */}
      <header className={`sp-header${headerCompact ? ' compact' : ''}`}>
        <div className="sp-header-inner">
          <a className="sp-logo" href={`/shop/${slug}`}>
            <div className="sp-logo-icon">
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 17 }}>B</span>
            </div>
            <span className="sp-logo-name">BizManager</span>
          </a>

          <div className="sp-search-bar">
            <Search size={15} className="sp-search-icon-pos" />
            <input
              ref={searchInputRef}
              type="text"
              className="sp-search-input"
              placeholder="Rechercher un produit…"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </div>

          <div className="sp-header-actions">
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="sp-contact-btn">
                <MessageCircle size={14} />
                Contacter
              </a>
            )}
            <Link href={`/shop/${slug}/favorites`} className="sp-icon-btn sp-icon-btn-red" title="Mes favoris">
              <Heart size={16} fill="#fff" />
              {favorites.size > 0 && <span className="sp-badge">{favorites.size > 9 ? '9+' : favorites.size}</span>}
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              className="sp-icon-btn sp-icon-btn-green"
              title="Panier"
            >
              <ShoppingBag size={16} />
              {cartCount > 0 && <span className="sp-badge">{cartCount > 9 ? '9+' : cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────────────── */}
      <main className="sp-main">

        {/* Hero */}
        <div
          className="sp-hero"
          style={{
            backgroundImage: shop.coverUrl
              ? `url(${shop.coverUrl})`
              : 'linear-gradient(135deg, #1a3c2f 0%, #0d2618 100%)',
            backgroundSize: 'cover', backgroundPosition: 'center',
          }}
        >
          <div className="sp-hero-overlay" />
          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="sp-hero-cta">
              💬 WhatsApp
            </a>
          )}
          <div className="sp-hero-content">
            <div className="sp-shop-avatar">
              {shop.logoUrl
                ? <img src={shop.logoUrl} alt={shop.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 28, fontWeight: 800, color: '#0A8F45' }}>{shop.name[0]}</span>
              }
            </div>
            <div className="sp-hero-info">
              <h1 className="sp-hero-name">{shop.name}</h1>
              <div className="sp-hero-meta">
                {shop.category ? `${shop.category} · ` : ''}{shop.description ? shop.description.slice(0, 100) : 'Boutique en ligne'}
              </div>
              <div className="sp-hero-badges">
                <span className="sp-hero-badge sp-badge-verified">✓ Boutique vérifiée</span>
                {shop.city && <span className="sp-hero-badge sp-badge-city">📍 {shop.city}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="sp-stats">
          <div className="sp-stat">
            <div className="sp-stat-val">{shop.productsCount || products.length || '—'}</div>
            <div className="sp-stat-lbl">Produits</div>
          </div>
          <div className="sp-stat">
            <div className="sp-stat-val" style={{ color: '#0A8F45', fontSize: 20 }}>✓</div>
            <div className="sp-stat-lbl">Livraison</div>
          </div>
          <div className="sp-stat">
            <div className="sp-stat-val" style={{ fontSize: 13 }}>Lun – Sam</div>
            <div className="sp-stat-lbl">08h – 19h</div>
          </div>
          <div className="sp-stat">
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 3 }}>
              {['MTN', 'Orange', 'Visa'].map(m => (
                <span key={m} style={{ fontSize: 10, padding: '2px 5px', background: '#F4F6F5', borderRadius: 4, fontWeight: 700, color: '#1F2A24' }}>{m}</span>
              ))}
            </div>
            <div className="sp-stat-lbl">Paiements</div>
          </div>
        </div>

        {/* Category pills */}
        <div className="sp-cats">
          {['all', ...apiCategories].map(cat => (
            <button
              key={cat}
              className={`sp-cat${activeCategory === cat ? ' active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === 'all' ? 'Tous les produits' : cat}
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="sp-filters">
          <select className="sp-select" value={selectedSort} onChange={e => setSelectedSort(e.target.value)}>
            <option value="newest">Plus récents</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
            <option value="name_asc">Nom A–Z</option>
          </select>
          <select className="sp-select" value={selectedPrice} onChange={e => setSelectedPrice(e.target.value)}>
            <option value="all">Tous les prix</option>
            <option value="0-25000">0 – 25 000 FCFA</option>
            <option value="25000-50000">25 – 50 000 FCFA</option>
            <option value="50000+">50 000+ FCFA</option>
          </select>
          <select className="sp-select" value={selectedAvailability} onChange={e => setSelectedAvailability(e.target.value)}>
            <option value="all">Disponibilité</option>
            <option value="in-stock">En stock</option>
            <option value="low-stock">Stock faible</option>
            <option value="out-of-stock">Rupture</option>
          </select>
          <span className="sp-count">{products.length} produit{products.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Product grid / skeleton / empty */}
        {productsLoading ? (
          <div className="sp-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="sp-skel-card">
                <div className="sp-skel sp-skel-img" />
                <div style={{ padding: '11px 13px 13px' }}>
                  <div className="sp-skel sp-skel-line" style={{ height: 13, marginBottom: 8 }} />
                  <div className="sp-skel sp-skel-line" style={{ height: 16, width: '55%', marginBottom: 10 }} />
                  <div className="sp-skel sp-skel-line" style={{ height: 33 }} />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '72px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>📦</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2A24', marginBottom: 6 }}>Aucun produit disponible</div>
            <div style={{ fontSize: 13, color: '#98A2B3' }}>Essayez de modifier vos filtres</div>
          </div>
        ) : (
          <div className="sp-grid">
            {products.map(product => renderProductCard(product))}
          </div>
        )}

        {products.length >= 10 && (
          <button className="sp-load-more">Afficher plus de produits</button>
        )}

        {/* Reassurance */}
        <div className="sp-reassurance">
          {[
            { icon: '🚚', title: 'Livraison rapide', sub: 'Chez vous en 24h – 48h' },
            { icon: '✅', title: 'Produits authentiques', sub: 'Qualité garantie' },
            { icon: '🔒', title: 'Paiement sécurisé', sub: '100% sûr et protégé' },
            { icon: '💬', title: 'Support client', sub: 'Réponse rapide sur WhatsApp' },
          ].map((item, i) => (
            <div key={i} className="sp-reassurance-item">
              <div className="sp-reassurance-icon">{item.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1F2A24' }}>{item.title}</div>
                <div style={{ fontSize: 11, color: '#98A2B3', marginTop: 2 }}>{item.sub}</div>
              </div>
            </div>
          ))}
        </div>

      </main>

      {/* ── Bottom nav (mobile) ───────────────────────────────────────── */}
      <nav className="sp-bottom-nav">
        <a href={`/shop/${slug}`} className="sp-bnav-item active">
          <Home size={20} />
          <span>Boutique</span>
        </a>
        <button className="sp-bnav-item" onClick={() => searchInputRef.current?.focus()}>
          <Search size={20} />
          <span>Rechercher</span>
        </button>
        <Link href={`/shop/${slug}/favorites`} className="sp-bnav-item">
          <Heart size={20} fill={favorites.size > 0 ? '#EF4444' : 'none'} color={favorites.size > 0 ? '#EF4444' : 'currentColor'} />
          <span>Favoris</span>
        </Link>
        <button className="sp-bnav-item" onClick={() => setCartOpen(true)}>
          <ShoppingBag size={20} />
          {cartCount > 0 && <span className="sp-bnav-badge">{cartCount > 9 ? '9+' : cartCount}</span>}
          <span>Panier</span>
        </button>
      </nav>

      {/* ── Cart drawer ───────────────────────────────────────────────── */}
      {cartOpen && (
        <>
          <div className="sp-cart-backdrop" onClick={() => setCartOpen(false)} />
          <div className="sp-cart-drawer">
            {/* Header */}
            <div style={{ padding: '0 20px', height: 64, borderBottom: '1px solid #E8ECEA', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 17, color: '#1F2A24' }}>Votre panier</div>
                <div style={{ fontSize: 12, color: '#98A2B3', marginTop: 2 }}>{cartCount} article{cartCount > 1 ? 's' : ''}</div>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                style={{ background: 'none', border: '1.5px solid #E8ECEA', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', color: '#667085', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#98A2B3' }}>
                  <div style={{ fontSize: 44, marginBottom: 12 }}>🛒</div>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7 }}>
                        <button
                          onClick={() => updateCartQty(item.productId, item.quantity - 1)}
                          style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid #E8ECEA', background: '#fff', cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1F2A24' }}
                        >−</button>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1F2A24', minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                        <button
                          onClick={() => updateCartQty(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid #E8ECEA', background: '#fff', cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1F2A24', opacity: item.quantity >= item.stock ? 0.4 : 1 }}
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

            {/* Footer */}
            {cart.length > 0 && (
              <div style={{ padding: '16px 20px', borderTop: '1px solid #E8ECEA', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                  <span style={{ fontSize: 14, color: '#667085' }}>Total</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: '#1F2A24' }}>{cartTotal.toLocaleString('fr-FR')} FCFA</span>
                </div>
                <button
                  onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}
                  style={{ width: '100%', height: 48, background: '#0A8F45', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
                >
                  Passer commande →
                </button>
                <button
                  onClick={() => setCart([])}
                  style={{ width: '100%', marginTop: 8, background: 'none', border: 'none', color: '#98A2B3', fontSize: 12, cursor: 'pointer', padding: '4px 0' }}
                >
                  Vider le panier
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Checkout modal ────────────────────────────────────────────── */}
      {checkoutOpen && (
        <CheckoutModal
          cart={cart}
          cartTotal={cartTotal}
          slug={slug}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={(order) => { setCart([]); setCheckoutOpen(false); setConfirmedOrder(order); }}
        />
      )}

      {/* ── Confirmation modal ────────────────────────────────────────── */}
      {confirmedOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '32px 28px', maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,.15)', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: 50, background: '#DDF6E7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 32 }}>✅</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1F2A24', margin: '0 0 8px' }}>Commande confirmée !</h2>
            <p style={{ fontSize: 14, color: '#667085', marginBottom: 6 }}>
              Référence : <strong style={{ color: '#1F2A24' }}>#{confirmedOrder.orderId.slice(0, 8).toUpperCase()}</strong>
            </p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#0A8F45', marginBottom: 20 }}>
              {parseFloat(confirmedOrder.totalAmount).toLocaleString('fr-FR')} FCFA
            </p>
            <p style={{ fontSize: 13, color: '#667085', marginBottom: 20, lineHeight: 1.6 }}>
              Votre commande a été transmise à <strong>{confirmedOrder.shopName}</strong>.<br />
              Vous serez contacté(e) pour confirmer la livraison.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {confirmedOrder.whatsappNumber && (
                <a
                  href={`https://wa.me/${confirmedOrder.whatsappNumber.replace(/[^0-9]/g, '')}?text=Bonjour%2C+j%27ai+pass%C3%A9+une+commande+%23${confirmedOrder.orderId.slice(0, 8).toUpperCase()}`}
                  target="_blank" rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, background: '#25D366', color: '#fff', borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}
                >
                  💬 Contacter la boutique sur WhatsApp
                </a>
              )}
              <button
                onClick={() => setConfirmedOrder(null)}
                style={{ height: 46, background: '#EAF7EF', color: '#0A8F45', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Continuer mes achats
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ===== CHECKOUT MODAL =====
function CheckoutModal({ cart, cartTotal, slug, onClose, onSuccess }: {
  cart: CartItem[];
  cartTotal: number;
  slug: string;
  onClose: () => void;
  onSuccess: (order: ConfirmedOrder) => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [payment, setPayment] = useState<'cash' | 'mobile_money' | 'bank_transfer' | 'cod'>('cod');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!name.trim()) { setError('Veuillez entrer votre nom.'); return; }
    if (!phone.trim() || phone.trim().length < 8) { setError('Numéro de téléphone invalide.'); return; }
    if (cart.length === 0) { setError('Votre panier est vide.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/public/shop/${slug}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name.trim(),
          customerPhone: phone.trim(),
          customerAddress: address.trim() || undefined,
          paymentMethod: payment,
          notes: notes.trim() || undefined,
          items: cart.map(i => ({ productId: i.productId, quantity: i.quantity })),
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Erreur lors de la commande.'); return; }
      onSuccess(json.data);
    } catch {
      setError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }

  const paymentOptions: { id: 'cod' | 'cash' | 'mobile_money' | 'bank_transfer'; icon: string; label: string }[] = [
    { id: 'cod', icon: '🚚', label: 'Paiement à la livraison' },
    { id: 'mobile_money', icon: '📱', label: 'Mobile Money' },
    { id: 'cash', icon: '💵', label: 'Espèces' },
    { id: 'bank_transfer', icon: '🏦', label: 'Virement' },
  ];

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 42, padding: '0 12px', border: '1.5px solid #E8ECEA',
    borderRadius: 10, fontSize: 14, color: '#1F2A24', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
      <div
        style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #E8ECEA', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#1F2A24' }}>Passer commande</div>
            <div style={{ fontSize: 12, color: '#98A2B3', marginTop: 2 }}>{cart.length} article{cart.length > 1 ? 's' : ''} · {cartTotal.toLocaleString('fr-FR')} FCFA</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: '1.5px solid #E8ECEA', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', color: '#667085', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Order summary */}
          <div style={{ background: '#F8FAF9', borderRadius: 12, padding: '12px 14px' }}>
            {cart.map(item => (
              <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '4px 0' }}>
                <span style={{ color: '#1F2A24' }}>{item.name} × {item.quantity}</span>
                <span style={{ fontWeight: 700, color: '#0A8F45' }}>{(item.price * item.quantity).toLocaleString('fr-FR')} FCFA</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #E8ECEA', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800 }}>
              <span>Total</span>
              <span style={{ color: '#0A8F45' }}>{cartTotal.toLocaleString('fr-FR')} FCFA</span>
            </div>
          </div>

          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#1F2A24', display: 'block', marginBottom: 6 }}>Nom complet <span style={{ color: '#EF4444' }}>*</span></label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Votre nom et prénom" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#1F2A24', display: 'block', marginBottom: 6 }}>Téléphone <span style={{ color: '#EF4444' }}>*</span></label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+237 6XX XXX XXX" type="tel" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#1F2A24', display: 'block', marginBottom: 6 }}>Adresse de livraison</label>
              <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Quartier, rue, repère…" style={inputStyle} />
            </div>
          </div>

          {/* Payment */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#1F2A24', display: 'block', marginBottom: 10 }}>Mode de paiement</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {paymentOptions.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPayment(opt.id)}
                  style={{ padding: '10px 12px', border: `1.5px solid ${payment === opt.id ? '#0A8F45' : '#E8ECEA'}`, borderRadius: 10, background: payment === opt.id ? '#F6FFF9' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, color: payment === opt.id ? '#0A8F45' : '#667085', transition: 'all .15s' }}
                >
                  <span style={{ fontSize: 18 }}>{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#1F2A24', display: 'block', marginBottom: 6 }}>Note (optionnel)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Instructions spéciales, couleur, taille…"
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E8ECEA', borderRadius: 10, fontSize: 13, color: '#1F2A24', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', minHeight: 72 }}
            />
          </div>

          {error && (
            <div style={{ background: '#FDE8E8', border: '1px solid #F9BDBD', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C02020' }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ width: '100%', height: 50, background: loading ? '#7CC49E' : '#0A8F45', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: loading ? 'wait' : 'pointer' }}
          >
            {loading ? 'Envoi en cours…' : `Confirmer la commande · ${cartTotal.toLocaleString('fr-FR')} FCFA`}
          </button>
        </div>
      </div>
    </div>
  );
}

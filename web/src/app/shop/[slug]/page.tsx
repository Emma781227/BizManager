'use client';

import { useEffect, useState } from 'react';
import { Heart, MessageCircle, Search, ShoppingBag } from 'lucide-react';
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
  .sp-header {
    position: fixed; top: 0; left: 0; right: 0; z-index: 50;
    background: #fff; border-bottom: 1px solid #E8ECEA;
    height: 72px; box-shadow: 0 1px 0 #E8ECEA;
  }
  .sp-wrap {
    width: 100%; padding: 0 24px; box-sizing: border-box;
  }
  .sp-search {
    height: 44px; width: 560px; border-radius: 12px;
    border: 1.5px solid #E8ECEA; background: #fff;
    padding: 0 16px 0 44px; font-size: 14px; color: #1F2A24;
    outline: none; transition: border-color .15s;
  }
  .sp-search:focus { border-color: #0A8F45; }
  .sp-search::placeholder { color: #98A2B3; }
  .sp-hero {
    width: 100%; height: 255px; border-radius: 20px;
    overflow: hidden; position: relative;
  }
  .sp-hero-overlay {
    position: absolute; inset: 0;
  }
  .sp-hero-inner {
    position: absolute; inset: 0; padding: 28px;
    display: flex; align-items: center; gap: 24px;
  }
  .sp-logo-box {
    width: 110px; height: 110px; border-radius: 18px;
    background: #fff; flex-shrink: 0; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 0 4px rgba(255,255,255,0.25);
  }
  .sp-badge-verified {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 10px; border-radius: 20px;
    background: rgba(10,143,69,0.9); color: #fff;
    font-size: 11px; font-weight: 700;
  }
  .sp-bandeau {
    background: #fff; border: 1px solid #E8ECEA;
    border-radius: 18px; height: 76px;
    display: flex; align-items: stretch; overflow: hidden;
  }
  .sp-bandeau-col {
    flex: 1; display: flex; align-items: center;
    justify-content: center; flex-direction: column;
    gap: 2px; border-right: 1px solid #E8ECEA;
  }
  .sp-bandeau-col:last-child { border-right: none; }
  .sp-cat-pill {
    height: 38px; padding: 0 16px; border-radius: 10px;
    border: 1.5px solid #E8ECEA; font-size: 13px; font-weight: 600;
    cursor: pointer; white-space: nowrap; transition: all .15s;
    background: #fff; color: #1F2A24;
  }
  .sp-cat-pill.active {
    background: #0A8F45; color: #fff; border-color: #0A8F45;
  }
  .sp-cat-pill:not(.active):hover {
    border-color: #0A8F45; color: #0A8F45;
  }
  .sp-filter-row {
    display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  }
  .sp-select {
    height: 38px; padding: 0 12px; border: 1.5px solid #E8ECEA;
    border-radius: 10px; font-size: 13px; color: #1F2A24;
    background: #fff; cursor: pointer; outline: none;
  }
  .sp-select:focus { border-color: #0A8F45; }
  .sp-product-grid {
    display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px;
  }
  .sp-card {
    background: #fff; border: 1px solid #E8ECEA;
    border-radius: 16px; overflow: hidden;
    transition: box-shadow .15s;
  }
  .sp-card:hover { box-shadow: 0 4px 20px rgba(16,24,40,0.08); }
  .sp-card-img {
    width: 100%; height: 170px; object-fit: cover; display: block;
  }
  .sp-card-body { padding: 12px 14px; }
  .sp-card-price {
    font-size: 17px; font-weight: 800; color: #1F2A24;
  }
  .sp-card-btn {
    width: 100%; height: 34px; background: #0A8F45; color: #fff;
    border: none; border-radius: 8px; font-size: 12px;
    font-weight: 600; cursor: pointer; transition: background .15s;
  }
  .sp-card-btn-secondary {
    width: 100%; height: 34px; background: #fff; color: #1F2A24;
    border: 1.5px solid #E8ECEA; border-radius: 8px; font-size: 12px;
    font-weight: 600; cursor: pointer; transition: all .15s;
    text-decoration: none; display: flex; align-items: center; justify-content: center;
    box-sizing: border-box;
  }
  .sp-card-actions {
    display: flex; gap: 8px; width: 100%;
  }
  .sp-card-actions > * {
    flex: 1 1 0;
    min-width: 0;
  }
  .sp-card-btn-secondary:hover { border-color: #0A8F45; color: #0A8F45; }
  .sp-card-btn:hover:not(:disabled) { background: #08763A; }
  .sp-card-btn:disabled { opacity: .4; cursor: default; }
  .sp-sidebar { width: 320px; flex-shrink: 0; }
  .sp-scard {
    background: #fff; border: 1px solid #E8ECEA;
    border-radius: 18px; padding: 20px;
  }
  .sp-scard + .sp-scard { margin-top: 14px; }
  .sp-scard-title {
    font-size: 13px; font-weight: 700; color: #1F2A24; margin-bottom: 14px;
  }
  .sp-reassurance {
    background: #fff; border: 1px solid #E8ECEA;
    border-radius: 18px; display: flex;
    align-items: center; margin-top: 28px;
  }
  .sp-reassurance-col {
    flex: 1; display: flex; align-items: center; gap: 14px;
    padding: 20px 24px; border-right: 1px solid #E8ECEA;
  }
  .sp-reassurance-col:last-child { border-right: none; }
  .sp-fab {
    position: fixed; bottom: 28px; right: 28px; z-index: 100;
    display: flex; align-items: center; gap: 10px;
    height: 52px; padding: 0 22px; background: #0A8F45;
    color: #fff; border: none; border-radius: 26px;
    font-size: 14px; font-weight: 700; cursor: pointer;
    box-shadow: 0 4px 20px rgba(10,143,69,0.35); text-decoration: none;
  }
  .sp-fab:hover { background: #08763A; }
  .sp-stock-badge {
    position: absolute; bottom: 8px; left: 8px;
    padding: 3px 8px; border-radius: 6px;
    font-size: 11px; font-weight: 600;
  }
  .sp-heart-btn {
    position: absolute; top: 8px; right: 8px;
    width: 30px; height: 30px; background: #fff;
    border: none; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.12); z-index: 10;
  }
  .sp-load-more {
    display: block; margin: 24px auto 0;
    height: 44px; padding: 0 32px; background: #fff;
    color: #1F2A24; border: 1.5px solid #E8ECEA;
    border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer;
  }
  .sp-load-more:hover { border-color: #0A8F45; color: #0A8F45; }
  .sp-hours-row {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 13px; padding: 6px 0; border-bottom: 1px solid #F4F6F5;
  }
  .sp-hours-row:last-child { border-bottom: none; }
  .sp-check-item {
    display: flex; align-items: flex-start; gap: 8px;
    font-size: 13px; color: #1F2A24; margin-bottom: 8px;
  }
  .sp-check-icon {
    width: 18px; height: 18px; background: #EAF7EF;
    border-radius: 50%; display: flex; align-items: center;
    justify-content: center; flex-shrink: 0; margin-top: 1px;
  }
  .sp-rating-bar-row {
    display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
  }
  .sp-rating-bar {
    flex: 1; height: 6px; background: #F4F6F5;
    border-radius: 4px; overflow: hidden;
  }
  .sp-rating-fill { height: 100%; background: #0A8F45; border-radius: 4px; }
  .sp-search-wrap {
    position: relative; display: flex; align-items: center;
  }
  .sp-search-icon {
    position: absolute; left: 14px; pointer-events: none;
    color: #98A2B3;
  }
  @media (max-width: 1100px) {
    .sp-sidebar { display: none; }
    .sp-search { width: 360px; }
  }
  @media (max-width: 900px) {
    .sp-product-grid { grid-template-columns: repeat(2, 1fr); }
    .sp-search { width: 240px; }
    .sp-hero { height: 200px; }
    .sp-logo-box { width: 80px; height: 80px; }
    .sp-reassurance { flex-direction: column; }
    .sp-reassurance-col { border-right: none; border-bottom: 1px solid #E8ECEA; width: 100%; }
    .sp-reassurance-col:last-child { border-bottom: none; }
  }
  @media (max-width: 640px) {
    .sp-wrap { padding: 0 16px; }
    .sp-product-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .sp-hero { height: 180px; }
    .sp-hero-inner { padding: 16px; gap: 14px; }
    .sp-logo-box { width: 64px; height: 64px; border-radius: 14px; }
    .sp-bandeau { height: auto; }
    .sp-fab { bottom: 16px; right: 16px; font-size: 13px; }
  }
`;

export default function ShopPage() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const params_hook = useParams<{ slug: string }>();
  const slug = params_hook?.slug || '';
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

  const [gsiReady] = useState(true);

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const toggleFavorite = (productId: string, product?: Product) => {
    const key = `favorites-${slug}`;
    let favs: Array<{ productId: string; name: string; price: number; imageUrl: string | null; category?: string | null }> = [];
    try {
      const saved = localStorage.getItem(key);
      if (saved) favs = JSON.parse(saved);
    } catch {}

    const already = favs.some(f => f.productId === productId);
    if (already) {
      favs = favs.filter(f => f.productId !== productId);
    } else if (product) {
      favs.push({
        productId: product.id,
        name: product.name,
        price: parseFloat(product.unitPrice),
        imageUrl: product.imageUrl,
        category: product.category,
      });
    }

    try {
      localStorage.setItem(key, JSON.stringify(favs));
    } catch {}

    setFavorites(new Set(favs.map(f => f.productId)));
  };

  function addToCart(product: Product) {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i => i.productId === product.id
          ? { ...i, quantity: Math.min(i.quantity + 1, product.stock) } : i);
      }
      return [...prev, {
        productId: product.id, name: product.name,
        price: parseFloat(product.unitPrice), imageUrl: product.imageUrl,
        quantity: 1, stock: product.stock,
      }];
    });
  }

  function removeFromCart(productId: string) {
    setCart(prev => prev.filter(i => i.productId !== productId));
  }

  function updateCartQty(productId: string, qty: number) {
    if (qty <= 0) { removeFromCart(productId); return; }
    setCart(prev => prev.map(i => i.productId === productId ? { ...i, quantity: Math.min(qty, i.stock) } : i));
  }

  const formatPrice = (unitPrice?: string) => {
    if (!unitPrice) return 'N/A';
    const parsed = Number(unitPrice);
    if (Number.isNaN(parsed)) return 'N/A';
    return `${parsed.toLocaleString('fr-FR')} FCFA`;
  };

  const stockLabel = (stock: number) => {
    if (stock <= 0) return 'Rupture';
    if (stock <= 5) return 'Stock faible';
    return 'En stock';
  };

  const stockTone = (stock: number) => {
    if (stock <= 0) return { color: '#dc2626', bg: '#fff1f2' };
    if (stock <= 5) return { color: '#F08A24', bg: '#FFF1E5' };
    return { color: '#0A8F45', bg: '#DDF6E7' };
  };

  const renderProductCard = (product: Product) => {
    const tone = stockTone(product.stock);
    const isFav = favorites.has(product.id);
    const rating = Number((product.rating || 4.6).toFixed(1));
    const reviews = product.reviews || Math.max(12, Math.floor(product.stock * 2));
    return (
      <article key={product.id} className="sp-card">
        <div style={{ position: 'relative', height: 170, overflow: 'hidden', background: '#F8FAF9' }}>
          <Link href={`/shop/${slug}/products/${product.id}`}>
            <img
              src={product.imageUrl || ''}
              alt={product.name}
              className="sp-card-img"
              style={{ transition: 'transform .3s' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            />
          </Link>
          <div className="sp-stock-badge" style={{ background: tone.bg, color: tone.color }}>
            {stockLabel(product.stock)}
          </div>
          <button className="sp-heart-btn" onClick={() => toggleFavorite(product.id, product)}>
            <span style={{ fontSize: 14, color: isFav ? '#EF4444' : '#D0D5DD' }}>{isFav ? '♥' : '♡'}</span>
          </button>
        </div>
        <div className="sp-card-body">
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1F2A24', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {product.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: '#F7B500' }}>★</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#F7B500' }}>{rating}</span>
            <span style={{ fontSize: 11, color: '#98A2B3' }}>({reviews})</span>
          </div>
          <div className="sp-card-price" style={{ marginBottom: 10 }}>{formatPrice(product.unitPrice)}</div>
          <div className="sp-card-actions">
            <Link
              href={`/shop/${slug}/products/${product.id}`}
              className="sp-card-btn-secondary"
            >
              Voir le produit
            </Link>
            <button
              className="sp-card-btn"
              disabled={product.stock <= 0}
              onClick={e => { e.preventDefault(); if (product.stock > 0) { addToCart(product); setCartOpen(true); } }}
            >
              {product.stock <= 0 ? 'Rupture' : 'Ajouter au panier'}
            </button>
          </div>
        </div>
      </article>
    );
  };

  useEffect(() => {
    if (!slug) return;
    const loadShop = async () => {
      try {
        const res = await fetch(`/api/public/shop/${slug}`);
        if (!res.ok) throw new Error('Shop not found');
        const data = await res.json();
        setShop(data?.data ?? data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading shop');
      } finally {
        setLoading(false);
      }
    };
    loadShop();
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    try {
      const saved = localStorage.getItem(`favorites-${slug}`);
      if (saved) {
        const favs = JSON.parse(saved);
        setFavorites(new Set(favs.map((f: any) => f.productId)));
      }
    } catch {}
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    try {
      const saved = localStorage.getItem(`cart-${slug}`);
      if (saved) setCart(JSON.parse(saved));
    } catch {}
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    localStorage.setItem(`cart-${slug}`, JSON.stringify(cart));
  }, [cart, slug]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    if (!slug) return;
    const loadProducts = async () => {
      setProductsLoading(true);
      try {
        const params_obj = new URLSearchParams();
        if (debouncedSearch) params_obj.append('q', debouncedSearch);
        if (activeCategory !== 'all') params_obj.append('category', activeCategory);
        if (selectedAvailability === 'in-stock') params_obj.append('inStock', '1');
        if (selectedAvailability === 'low-stock') params_obj.append('stockStatus', 'low');
        if (selectedAvailability === 'out-of-stock') params_obj.append('stockStatus', 'out');
        if (selectedPrice === '0-25000') {
          params_obj.append('minPrice', '0');
          params_obj.append('maxPrice', '25000');
        } else if (selectedPrice === '25000-50000') {
          params_obj.append('minPrice', '25000');
          params_obj.append('maxPrice', '50000');
        } else if (selectedPrice === '50000+') {
          params_obj.append('minPrice', '50000');
        }
        if (selectedSort !== 'newest') params_obj.append('sort', selectedSort);
        const res = await fetch(`/api/public/shop/${slug}/products?${params_obj.toString()}`);
        if (!res.ok) throw new Error('Failed to load products');
        const data = await res.json();
        setProducts(data?.data || []);
        if (data.meta?.categories) {
          setApiCategories(data.meta.categories);
        }
      } catch (err) {
        console.error('Error loading products:', err);
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };
    loadProducts();
  }, [slug, debouncedSearch, activeCategory, selectedAvailability, selectedPrice, selectedSort]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8FAF9', color: '#667085', fontSize: 15 }}>
        Chargement de la boutique…
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8FAF9', color: '#a63b35', fontSize: 15 }}>
        {error}
      </div>
    );
  }
  if (!shop) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8FAF9', color: '#667085', fontSize: 15 }}>
        Boutique non trouvée
      </div>
    );
  }

  const whatsappUrl = shop.whatsappNumber
    ? `https://wa.me/${shop.whatsappNumber.replace(/[^0-9]/g, '')}`
    : null;

  void gsiReady;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAF9' }}>
      <style>{CSS}</style>

      {/* HEADER FIXE */}
      <header className="sp-header">
        <div className="sp-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>

          {/* Logo BizManager */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, background: '#0A8F45', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>B</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: 17, color: '#1F2A24' }}>BizManager</span>
          </div>

          {/* Barre de recherche centrale */}
          <div className="sp-search-wrap">
            <Search size={16} className="sp-search-icon" />
            <input
              type="text"
              className="sp-search"
              placeholder="Rechercher un produit…"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </div>

          {/* Actions droite */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 7, height: 38, padding: '0 14px', background: '#EAF7EF', color: '#0A8F45', borderRadius: 10, fontWeight: 600, fontSize: 13, textDecoration: 'none', border: '1.5px solid #C3EDD7' }}
              >
                <MessageCircle size={15} />
                <span style={{ display: 'none' }} className="show-sm">Nous contacter</span>
                <span>Nous contacter</span>
              </a>
            )}
            <Link
              href={`/shop/${slug}/favorites`}
              style={{ position: 'relative', width: 38, height: 38, background: '#EF4444', border: 'none', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', textDecoration: 'none' }}
              title="Mes favoris"
            >
              <Heart size={17} fill="#fff" />
              {favorites.size > 0 && (
                <span style={{ position: 'absolute', top: -5, right: -5, width: 18, height: 18, background: '#1F2A24', color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {favorites.size > 9 ? '9+' : favorites.size}
                </span>
              )}
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              style={{ position: 'relative', width: 38, height: 38, background: '#0A8F45', border: 'none', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
              title="Panier"
            >
              <ShoppingBag size={17} />
              {cartCount > 0 && (
                <span style={{ position: 'absolute', top: -5, right: -5, width: 18, height: 18, background: '#1F2A24', color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* CONTENU PRINCIPAL */}
      <div style={{ paddingTop: 88, paddingBottom: 48, backgroundColor: '#F8FAF9', minHeight: '100vh' }}>
        <div className="sp-wrap">

          {/* Ligne principale : colonne gauche + sidebar */}
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

            {/* COLONNE GAUCHE */}
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* Hero */}
              <div
                className="sp-hero"
                style={{
                  backgroundImage: shop.coverUrl
                    ? `url(${shop.coverUrl})`
                    : 'linear-gradient(135deg, #1a3c2f 0%, #0d2618 100%)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div
                  className="sp-hero-overlay"
                  style={{ background: 'linear-gradient(90deg, rgba(10,20,16,0.78) 0%, rgba(10,20,16,0.45) 60%, rgba(10,20,16,0.15) 100%)' }}
                />
                <div className="sp-hero-inner">
                  <div className="sp-logo-box">
                    {shop.logoUrl
                      ? <img src={shop.logoUrl} alt={shop.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 32, fontWeight: 800, color: '#0A8F45' }}>{shop.name.substring(0, 1)}</span>
                    }
                  </div>
                  <div style={{ flex: 1, color: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0 }}>{shop.name}</h1>
                      <span className="sp-badge-verified">✓ Boutique vérifiée</span>
                    </div>
                    <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', margin: '0 0 6px', fontStyle: 'italic' }}>
                      {shop.category ? `${shop.category} · ` : ''}{shop.description ? shop.description.slice(0, 60) : "L'élégance au quotidien"}
                    </p>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: '0 0 12px' }}>
                      {shop.description && shop.description.length > 60 ? shop.description.slice(0, 120) : 'Des produits soigneusement sélectionnés pour vous.'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                      📍 {shop.city || 'Yaoundé'}, Cameroun
                    </div>
                    {whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 42, padding: '0 22px', background: '#0A8F45', color: '#fff', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}
                      >
                        💬 Contacter sur WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Bandeau 4 colonnes */}
              <div className="sp-bandeau" style={{ marginTop: 16 }}>
                <div className="sp-bandeau-col">
                  <span style={{ fontSize: 24, fontWeight: 800, color: '#1F2A24' }}>{shop.productsCount || products.length || '—'}</span>
                  <span style={{ fontSize: 12, color: '#667085', fontWeight: 500 }}>Produits</span>
                </div>
                <div className="sp-bandeau-col">
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1F2A24' }}>Livraison</span>
                  <span style={{ fontSize: 12, color: '#0A8F45', fontWeight: 600 }}>Disponible</span>
                </div>
                <div className="sp-bandeau-col">
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1F2A24' }}>Lun – Sam</span>
                  <span style={{ fontSize: 12, color: '#667085' }}>08h00 – 19h00</span>
                </div>
                <div className="sp-bandeau-col" style={{ borderRight: 'none' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1F2A24', marginBottom: 2 }}>Paiements</span>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, padding: '2px 6px', background: '#FFF4EC', borderRadius: 4, fontWeight: 700, color: '#F08A24' }}>MTN</span>
                    <span style={{ fontSize: 11, padding: '2px 6px', background: '#FFF1E0', borderRadius: 4, fontWeight: 700, color: '#FF8C00' }}>Orange</span>
                    <span style={{ fontSize: 11, padding: '2px 6px', background: '#EFF8FF', borderRadius: 4, fontWeight: 700, color: '#175CD3' }}>Visa</span>
                  </div>
                </div>
              </div>

              {/* Pills catégories */}
              <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
                {['all', ...apiCategories.slice(0, 8)].map(cat => (
                  <button
                    key={cat}
                    className={`sp-cat-pill${activeCategory === cat ? ' active' : ''}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat === 'all' ? 'Tous les produits' : cat}
                  </button>
                ))}
              </div>

              {/* Ligne filtres */}
              <div className="sp-filter-row" style={{ marginTop: 14 }}>
                <span style={{ fontSize: 12, color: '#98A2B3', fontWeight: 500, flexShrink: 0 }}>Filtrer par :</span>
                <select className="sp-select" value={selectedSort} onChange={e => setSelectedSort(e.target.value)}>
                  <option value="newest">Trier : Plus récents</option>
                  <option value="price_asc">Prix croissant</option>
                  <option value="price_desc">Prix décroissant</option>
                  <option value="name_asc">Nom A-Z</option>
                </select>
                <select className="sp-select" value={selectedPrice} onChange={e => setSelectedPrice(e.target.value)}>
                  <option value="all">Prix : Tous</option>
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
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#1F2A24', cursor: 'pointer', marginLeft: 'auto' }}>
                  <input
                    type="checkbox"
                    style={{ accentColor: '#0A8F45' }}
                    checked={selectedAvailability === 'in-stock'}
                    onChange={e => setSelectedAvailability(e.target.checked ? 'in-stock' : 'all')}
                  />
                  En stock uniquement
                </label>
                <span style={{ fontSize: 12, color: '#98A2B3', flexShrink: 0 }}>
                  {products.length} produit{products.length !== 1 ? 's' : ''} trouvé{products.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Grille produits */}
              {productsLoading ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#98A2B3', fontSize: 14 }}>
                  Chargement des produits…
                </div>
              ) : products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1F2A24', marginBottom: 6 }}>Aucun produit disponible</div>
                  <div style={{ fontSize: 13, color: '#98A2B3' }}>Essayez de modifier vos filtres</div>
                </div>
              ) : (
                <div className="sp-product-grid" style={{ marginTop: 20 }}>
                  {products.map(product => renderProductCard(product))}
                </div>
              )}

              {products.length >= 10 && (
                <button className="sp-load-more">Afficher plus de produits</button>
              )}

              {/* Bandeau réassurance */}
              <div className="sp-reassurance">
                {[
                  { icon: '🚚', title: 'Livraison rapide', sub: 'Chez vous en 24h – 48h' },
                  { icon: '✅', title: 'Produits authentiques', sub: 'Qualité garantie' },
                  { icon: '🔒', title: 'Paiement sécurisé', sub: '100% sûr et protégé' },
                  { icon: '💬', title: 'Support client', sub: 'Réponse rapide sur WhatsApp' },
                ].map((item, i) => (
                  <div key={i} className="sp-reassurance-col" style={{ borderRight: i < 3 ? '1px solid #E8ECEA' : 'none' }}>
                    <div style={{ width: 42, height: 42, background: '#EAF7EF', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1F2A24' }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: '#98A2B3', marginTop: 2 }}>{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
            {/* FIN COLONNE GAUCHE */}

            {/* SIDEBAR DROITE */}
            <div className="sp-sidebar" style={{ position: 'sticky', top: 88 }}>

              {/* A propos */}
              <div className="sp-scard">
                <div className="sp-scard-title">A propos de la boutique</div>
                <p style={{ fontSize: 12, color: '#667085', lineHeight: 1.6, marginBottom: 12 }}>
                  {shop.description || `${shop.name} est une boutique soigneusement sélectionnée pour vous proposer le meilleur.`}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {[
                    'Boutique vérifiée BizManager',
                    'Membre BizManager depuis 2022',
                    'Réponse rapide sur WhatsApp',
                  ].map(item => (
                    <div key={item} className="sp-check-item">
                      <div className="sp-check-icon">
                        <span style={{ fontSize: 10, color: '#0A8F45', fontWeight: 800 }}>✓</span>
                      </div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Horaires */}
              <div className="sp-scard">
                <div className="sp-scard-title">Horaires d'ouverture</div>
                {[
                  { day: 'Lundi – Vendredi', hours: '08h00 – 19h00', open: true },
                  { day: 'Samedi', hours: '08h00 – 19h00', open: true },
                  { day: 'Dimanche', hours: 'Fermé', open: false },
                ].map((row, i) => (
                  <div key={i} className="sp-hours-row">
                    <span style={{ color: '#1F2A24', fontWeight: 500 }}>{row.day}</span>
                    <span style={{ fontWeight: 600, color: row.open ? '#0A8F45' : '#98A2B3' }}>{row.hours}</span>
                  </div>
                ))}
              </div>

              {/* Zone livraison */}
              <div className="sp-scard">
                <div className="sp-scard-title">Zone de livraison</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0A8F45', marginBottom: 8 }}>{shop.city || 'Yaoundé'} et environs</div>
                <div style={{ fontSize: 12, color: '#667085', marginBottom: 4 }}>🚚 Frais de livraison à partir de 1 000 FCFA</div>
                <div style={{ fontSize: 12, color: '#667085' }}>⏱ Livraison sous 24h – 48h</div>
              </div>

              {/* Paiements */}
              <div className="sp-scard">
                <div className="sp-scard-title">Paiements acceptés</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { label: 'MTN', bg: '#FFFBEA', color: '#B45309' },
                    { label: 'Orange', bg: '#FFF4EC', color: '#F08A24' },
                    { label: 'Visa', bg: '#EFF8FF', color: '#175CD3' },
                    { label: 'Mastercard', bg: '#FEF3F2', color: '#D92D20' },
                  ].map(p => (
                    <span key={p.label} style={{ padding: '6px 12px', background: p.bg, color: p.color, borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                      {p.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Confiance */}
              <div className="sp-scard">
                <div className="sp-scard-title">Pourquoi nous faire confiance ?</div>
                {[
                  'Produits sélectionnés avec soin',
                  'Satisfait ou remboursé sous 3 jours',
                  'Livraison rapide et sécurisée',
                  'Service client réactif sur WhatsApp',
                ].map(item => (
                  <div key={item} className="sp-check-item">
                    <div className="sp-check-icon">
                      <span style={{ fontSize: 10, color: '#0A8F45', fontWeight: 800 }}>✓</span>
                    </div>
                    {item}
                  </div>
                ))}
              </div>

              {/* Avis */}
              <div className="sp-scard">
                <div className="sp-scard-title">Avis clients</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 36, fontWeight: 800, color: '#1F2A24', lineHeight: 1 }}>4.7</div>
                    <div style={{ fontSize: 11, color: '#98A2B3', marginTop: 2 }}>sur 5</div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', gap: 2, marginBottom: 4 }}>
                      {[1, 2, 3, 4, 5].map(i => <span key={i} style={{ fontSize: 16, color: '#F7B500' }}>★</span>)}
                    </div>
                    <div style={{ fontSize: 12, color: '#667085' }}>Basé sur 168 avis</div>
                  </div>
                </div>
                {[[5, 82], [4, 13], [3, 3], [2, 1], [1, 1]].map(([star, pct]) => (
                  <div key={star} className="sp-rating-bar-row">
                    <span style={{ fontSize: 11, color: '#667085', width: 16 }}>{star}</span>
                    <span style={{ fontSize: 11, color: '#F7B500' }}>★</span>
                    <div className="sp-rating-bar"><div className="sp-rating-fill" style={{ width: `${pct}%` }} /></div>
                    <span style={{ fontSize: 11, color: '#98A2B3', width: 28, textAlign: 'right' }}>{pct}%</span>
                  </div>
                ))}
                <button style={{ marginTop: 10, background: 'none', border: 'none', color: '#0A8F45', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                  Voir tous les avis →
                </button>
              </div>

            </div>
            {/* FIN SIDEBAR */}

          </div>
          {/* FIN ligne principale */}

        </div>
      </div>

      {/* FAB WhatsApp */}
      {whatsappUrl && (
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="sp-fab">
          💬 Commander sur WhatsApp
        </a>
      )}

      {/* CART SIDEBAR */}
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
                          disabled={item.quantity >= item.stock}
                          style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid #E8ECEA', background: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1F2A24', opacity: item.quantity >= item.stock ? 0.4 : 1 }}
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
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {checkoutOpen && (
        <CheckoutModal
          cart={cart}
          cartTotal={cartTotal}
          slug={slug}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={(order) => {
            setCart([]);
            setCheckoutOpen(false);
            setConfirmedOrder(order);
          }}
        />
      )}

      {/* CONFIRMATION MODAL */}
      {confirmedOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '32px 28px', maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', textAlign: 'center' }}>
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
                  target="_blank"
                  rel="noreferrer"
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

// ===== CHECKOUT MODAL COMPONENT =====
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

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
      <div
        style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #E8ECEA', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#1F2A24' }}>Passer commande</div>
            <div style={{ fontSize: 12, color: '#98A2B3', marginTop: 2 }}>{cart.length} article{cart.length > 1 ? 's' : ''} · {cartTotal.toLocaleString('fr-FR')} FCFA</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: '1.5px solid #E8ECEA', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#667085', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >✕</button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Résumé */}
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

          {/* Formulaire */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#1F2A24', display: 'block', marginBottom: 6 }}>
                Nom complet <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Votre nom et prénom"
                style={{ width: '100%', height: 42, padding: '0 12px', border: '1.5px solid #E8ECEA', borderRadius: 10, fontSize: 14, color: '#1F2A24', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#1F2A24', display: 'block', marginBottom: 6 }}>
                Téléphone <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+237 6XX XXX XXX"
                type="tel"
                style={{ width: '100%', height: 42, padding: '0 12px', border: '1.5px solid #E8ECEA', borderRadius: 10, fontSize: 14, color: '#1F2A24', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#1F2A24', display: 'block', marginBottom: 6 }}>
                Adresse de livraison
              </label>
              <input
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Quartier, rue, repère…"
                style={{ width: '100%', height: 42, padding: '0 12px', border: '1.5px solid #E8ECEA', borderRadius: 10, fontSize: 14, color: '#1F2A24', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Mode de paiement */}
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

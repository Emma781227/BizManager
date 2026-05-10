'use client';

import { useEffect, useState } from 'react';
import { Heart, User, MessageCircle, Search, Package, Truck, Clock, Star, Check, Filter, Lock, Zap, MapPin, CreditCard, ArrowRight, Headphones, Award, Grid3X3, Shirt, Sparkles, House, ShoppingBag, ChevronDown } from 'lucide-react';
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

export default function ShopPage() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const params_hook = useParams<{ slug: string }>();
  const slug = params_hook?.slug || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [apiCategories, setApiCategories] = useState<string[]>([]);

  // ===== SPRINT 3: ARCHITECTURE FILTRES =====
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedPrice, setSelectedPrice] = useState('all');
  const [selectedAvailability, setSelectedAvailability] = useState('all');
  const [selectedSort, setSelectedSort] = useState('newest');

  // ===== SPRINT 4: GESTION FAVORIS (localStorage) =====
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const fallbackCategories = [
    { id: 'Mode', label: 'Mode', icon: 'shirt' },
    { id: 'Beauté', label: 'Beauté', icon: 'sparkles' },
    { id: 'Accessoires', label: 'Accessoires', icon: 'bag' },
    { id: 'Maison', label: 'Maison', icon: 'home' },
  ];

  const categories = [
    { id: 'all', label: 'Tous', icon: 'grid' },
    ...(apiCategories.length > 0
      ? apiCategories.slice(0, 4).map((categoryName) => ({
          id: categoryName,
          label: categoryName,
          icon: 'grid',
        }))
      : fallbackCategories),
  ];

  // ===== FONCTIONS UTILITAIRES =====
  const toggleFavorite = (productId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(productId)) {
      newFavorites.delete(productId);
    } else {
      newFavorites.add(productId);
    }
    setFavorites(newFavorites);
    // Sauvegarder dans localStorage
    localStorage.setItem(`favorites-${slug}`, JSON.stringify(Array.from(newFavorites)));
  };

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
    if (stock <= 0) {
      return { color: '#dc2626', border: '#dc2626', bg: '#fff1f2' };
    }
    if (stock <= 5) {
      return { color: '#b45309', border: '#f59e0b', bg: '#fffbeb' };
    }
    return { color: '#0A8F45', border: '#0A8F45', bg: '#ecfdf5' };
  };

  const renderCategoryIcon = (icon: string, active: boolean) => {
    const iconClass = active ? 'w-4 h-4 text-white' : 'w-4 h-4 text-gray-500';

    if (icon === 'grid') return <Grid3X3 className={iconClass} />;
    if (icon === 'shirt') return <Shirt className={iconClass} />;
    if (icon === 'sparkles') return <Sparkles className={iconClass} />;
    if (icon === 'bag') return <ShoppingBag className={iconClass} />;
    if (icon === 'home') return <House className={iconClass} />;
    return <Package className={iconClass} />;
  };

  const renderProductCard = (product: Product) => {
    const tone = stockTone(product.stock);
    const rating = Number((product.rating || 4.6).toFixed(1));
    const reviews = product.reviews || Math.max(12, Math.floor(product.stock * 2));

    return (
      <article
        key={product.id}
        className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition duration-200"
      >
        {/* Zone image avec overlay favori */}
        <div className="relative w-full overflow-hidden bg-gray-100" style={{ height: '152px' }}>
          <Link href={`/shop/${slug}/products/${product.id}`} className="block w-full h-full">
            <img
              src={product.imageUrl || '/api/placeholder/300/170?text=Product'}
              alt={product.name}
              className="w-full h-full object-cover hover:scale-105 transition duration-300"
            />
          </Link>

          <div
            className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[11px] font-semibold pointer-events-none"
            style={{ color: tone.color, border: `1px solid ${tone.border}`, backgroundColor: tone.bg }}
          >
            {stockLabel(product.stock)}
          </div>

          {/* Bouton favori — z-10 pour rester cliquable au-dessus du Link */}
          <button
            onClick={() => toggleFavorite(product.id)}
            className="absolute top-2 right-2 z-10 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow transition"
          >
            <Heart
              className="w-4 h-4"
              style={{
                color: favorites.has(product.id) ? '#dc2626' : '#9ca3af',
                fill: favorites.has(product.id) ? '#dc2626' : 'none',
              }}
            />
          </button>
        </div>

        <div className="px-3 pt-2.5 pb-3">
          <h3 className="font-semibold text-sm text-gray-900 line-clamp-1 mb-0.5">{product.name}</h3>
          <p className="text-[11px] text-gray-400 line-clamp-1 mb-2">{product.description || 'Produit de qualité sélectionné avec soin'}</p>

          <div className="flex items-end justify-between mb-2.5">
            <p className="font-bold text-[19px] leading-none text-gray-900">{formatPrice(product.unitPrice)}</p>
            <div className="flex items-center gap-0.5 text-[11px] text-gray-500">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-amber-500 font-semibold">{rating}</span>
              <span className="text-gray-500">({reviews})</span>
            </div>
          </div>

          <Link
            href={`/shop/${slug}/products/${product.id}`}
            className="flex items-center justify-center w-full h-8 text-[12px] font-semibold rounded-lg border border-emerald-500 text-emerald-600 hover:bg-emerald-600 hover:text-white transition duration-200"
          >
            Voir le produit
          </Link>
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

  // ===== CHARGE FAVORIS DEPUIS localStorage =====
  useEffect(() => {
    if (!slug) return;
    try {
      const saved = localStorage.getItem(`favorites-${slug}`);
      if (saved) {
        setFavorites(new Set(JSON.parse(saved)));
      }
    } catch (err) {
      console.error('Error loading favorites:', err);
    }
  }, [slug]);

  // ===== DEBOUNCE RECHERCHE (300ms) =====
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  // ===== CHARGE PRODUITS DEPUIS API =====
  useEffect(() => {
    if (!slug) return;
    const loadProducts = async () => {
      setProductsLoading(true);
      try {
        // Construire les query params
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
        // Charger les catégories disponibles depuis l'API
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

  if (loading) return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  if (error) return <div className="flex items-center justify-center min-h-screen text-red-600">{error}</div>;
  if (!shop) return <div className="flex items-center justify-center min-h-screen">Boutique non trouvée</div>;

  // Nettoie le numéro et génère le lien wa.me (format international sans +)
  const whatsappUrl = shop.whatsappNumber
    ? `https://wa.me/${shop.whatsappNumber.replace(/[^0-9]/g, '')}`
    : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAF9' }}>

      {/* ===== HEADER FIXE PLEINE LARGEUR ===== */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div
          className="mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8"
          style={{ maxWidth: '1360px', height: '64px' }}
        >
          {/* Gauche : logo + nom */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-base">B</span>
            </div>
            <span className="hidden sm:inline text-xl font-bold" style={{ color: '#1a3c34' }}>BizManager</span>
          </div>

          {/* Centre : barre de recherche — cachée mobile */}
          <div
            className="hidden md:flex items-center gap-2.5 px-3 bg-white border border-gray-200 rounded-xl shadow-sm"
            style={{ width: '520px', height: '40px' }}
          >
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Rechercher un produit, une boutique, une catégorie..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
            />
          </div>

          {/* Droite : actions */}
          <div className="flex items-center gap-1">
            <button className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-gray-100 transition text-sm font-medium text-gray-700 hover:text-emerald-600">
              <MessageCircle className="w-4 h-4" />
              Nous contacter
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition">
              <Heart className="w-5 h-5 text-gray-600" />
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition">
              <User className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* ===== CONTENU PRINCIPAL (décalé sous le header fixe) ===== */}
      <div
        className="mx-auto w-full px-4 sm:px-6 lg:px-8"
        style={{ maxWidth: '1360px', paddingTop: '84px', paddingBottom: '40px' }}
      >

        {/* ===== HERO BANNER ===== */}
        <div
          className="rounded-2xl overflow-hidden mb-3"
          style={{
            backgroundColor: '#0f2f2a',
            backgroundImage: shop.coverUrl
              ? `linear-gradient(90deg, rgba(10,20,18,0.72) 0%, rgba(10,20,18,0.35) 55%, rgba(10,20,18,0.15) 100%), url(${shop.coverUrl})`
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-center sm:h-[250px] px-5 sm:px-8 py-7 sm:py-0 gap-5 sm:gap-10 text-center sm:text-left">

            {/* Logo circulaire */}
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-full bg-white w-24 h-24 sm:w-32 sm:h-32"
              style={{ boxShadow: '0 0 0 4px rgba(255,255,255,0.2)' }}
            >
              {shop.logoUrl ? (
                <img src={shop.logoUrl} alt={shop.name} className="w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover" />
              ) : (
                <span className="text-xl font-bold" style={{ color: '#1a3c34' }}>
                  {shop.name?.substring(0, 1).toUpperCase()}
                </span>
              )}
            </div>

            {/* Infos texte */}
            <div className="flex-1 min-w-0">
              {/* Nom + badge vérifié */}
              <div className="flex items-center justify-center sm:justify-start flex-wrap gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-white">{shop.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/90 text-white flex-shrink-0">
                  ✓ Vérifié
                </span>
              </div>

              {/* Étoiles + note */}
              <div className="flex items-center justify-center sm:justify-start gap-1.5 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
                <span className="text-white font-bold text-sm">{shop.rating || '4,8'}</span>
                <span className="text-gray-300 text-xs">({shop.reviewCount || '128'} avis)</span>
              </div>

              {/* Catégorie + ville */}
              <p className="text-sm text-gray-300 mb-3">
                {shop.category || 'Mode & Beauté'}
                {' • '}
                {shop.city || shop.location || 'Yaoundé, Cameroun'}
              </p>

              {/* Description — masquée sur mobile pour ne pas surcharger */}
              <p className="hidden sm:block text-sm text-gray-100 mb-4 line-clamp-2">
                {shop.description || 'Découvrez notre collection exclusive de mode et beauté premium.'}
              </p>

              {/* Bouton WhatsApp */}
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold inline-flex items-center gap-2 text-sm transition w-full sm:w-auto justify-center sm:justify-start"
                >
                  <MessageCircle className="w-4 h-4" />
                  Contacter via WhatsApp
                </a>
              ) : (
                <button disabled className="bg-emerald-600/50 text-white px-5 py-2.5 rounded-xl font-semibold inline-flex items-center gap-2 text-sm w-full sm:w-auto justify-center sm:justify-start cursor-not-allowed">
                  <MessageCircle className="w-4 h-4" />
                  Contacter via WhatsApp
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ===== BANDEAU INFOS RAPIDES ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {/* Produits */}
          <div className="flex items-center gap-3 flex-1 px-4 py-3.5 bg-white rounded-xl border-l-4 border-emerald-500">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="font-bold text-sm text-gray-900">{shop.productsCount || products.length || 0} produits</div>
              <div className="text-xs text-gray-500 mt-0.5">Qualité sélectionnée</div>
            </div>
          </div>

          {/* Livraison */}
          <div className="flex items-center gap-3 flex-1 px-4 py-3.5 bg-white rounded-xl border-l-4 border-emerald-500">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Truck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="font-bold text-sm text-gray-900">Livraison disponible</div>
              <div className="text-xs text-gray-500 mt-0.5">Yaoundé et environs</div>
            </div>
          </div>

          {/* Horaires */}
          <div className="flex items-center gap-3 flex-1 px-4 py-3.5 bg-white rounded-xl border-l-4 border-emerald-500">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="font-bold text-sm text-gray-900">Ouvert aujourd'hui</div>
              <div className="text-xs text-gray-500 mt-0.5">{shop.openingHours || '08:00 - 19:00'}</div>
            </div>
          </div>
        </div>

        {/* ===== LIGNE CATÉGORIES ===== */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          {categories.map((category) => {
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium whitespace-nowrap transition h-10 ${
                  isActive
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-600'
                }`}
              >
                {renderCategoryIcon(category.icon, isActive)}
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>

        {/* ===== LIGNE FILTRES ===== */}
        <div className="flex items-center gap-2 mb-6">

          {/* Barre de recherche */}
          <div className="flex items-center gap-2 px-3 bg-white border border-gray-200 rounded-xl h-10 w-56 flex-shrink-0 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 transition">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400 min-w-0"
            />
          </div>

          {/* Select Prix — custom avec chevron */}
          <div className="relative hidden sm:block flex-shrink-0">
            <select
              value={selectedPrice}
              onChange={(e) => setSelectedPrice(e.target.value)}
              className="appearance-none h-10 pl-3 pr-8 w-36 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 cursor-pointer outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
            >
              <option value="all">Tous les prix</option>
              <option value="0-25000">0 – 25 000 FCFA</option>
              <option value="25000-50000">25 – 50 000 FCFA</option>
              <option value="50000+">50 000+ FCFA</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          </div>

          {/* Select Tri — custom avec chevron */}
          <div className="relative hidden sm:block flex-shrink-0">
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="appearance-none h-10 pl-3 pr-8 w-36 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 cursor-pointer outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
            >
              <option value="newest">Plus récents</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
              <option value="name_asc">Nom A-Z</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          </div>

          {/* Select Disponibilité — custom avec chevron */}
          <div className="relative hidden lg:block flex-shrink-0">
            <select
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value)}
              className="appearance-none h-10 pl-3 pr-8 w-36 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 cursor-pointer outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
            >
              <option value="all">Disponibilité</option>
              <option value="in-stock">En stock</option>
              <option value="low-stock">Stock faible</option>
              <option value="out-of-stock">Rupture</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          </div>

          {/* Bouton Filtres */}
          <button className="flex items-center gap-2 px-4 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition flex-shrink-0 shadow-sm">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filtres</span>
          </button>

        </div>

        {/* ===== GRILLE PRINCIPALE ===== */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ===== COLONNE GAUCHE ===== */}
          <div className="flex-1 min-w-0">

            {/* Produits à la une */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Produits à la une</h2>

              {productsLoading && (
                <div className="text-center py-8 text-gray-500">Chargement des produits...</div>
              )}
              {!productsLoading && products.length === 0 && (
                <div className="text-center py-8 text-gray-500">Aucun produit disponible</div>
              )}
              {!productsLoading && products.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {products.slice(0, 4).map((product) => renderProductCard(product))}
                </div>
              )}
            </div>

            {/* Tous les produits */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Tous les produits</h2>

              {productsLoading && (
                <div className="text-center py-8 text-gray-500">Chargement des produits...</div>
              )}
              {!productsLoading && products.length === 0 && (
                <div className="text-center py-8 text-gray-500">Aucun produit disponible</div>
              )}
              {!productsLoading && products.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {products.map((product) => renderProductCard(product))}
                </div>
              )}
            </div>
          </div>

          {/* ===== COLONNE DROITE ===== */}
          <div className="w-full lg:w-[320px] space-y-4">

            {/* Carte "À propos de la boutique" */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 mb-4">À propos de la boutique</h2>

              {/* Logo mini + infos */}
              <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {shop.logoUrl ? (
                    <img src={shop.logoUrl} alt={shop.name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <span className="text-base font-bold" style={{ color: '#1a3c34' }}>
                      {shop.name?.substring(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <div className="font-bold text-sm text-gray-900">{shop.name}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-gray-900">{shop.rating || '4,8'}</span>
                    <span className="text-xs text-gray-500">({shop.reviewCount || '128'} avis)</span>
                  </div>
                </div>
              </div>

              {/* Badge réponse rapide */}
              <div className="flex items-center gap-1.5 mb-3 px-3 py-1.5 bg-emerald-50 rounded-lg w-fit">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-700">Réponse rapide</span>
              </div>

              {/* Bouton WhatsApp */}
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 flex items-center justify-center gap-2 mb-4 transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  Contacter via WhatsApp
                </a>
              ) : (
                <button disabled className="w-full py-2.5 bg-emerald-600/50 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mb-4 cursor-not-allowed">
                  <MessageCircle className="w-4 h-4" />
                  Contacter via WhatsApp
                </button>
              )}

              {/* Blocs infos */}
              <div className="space-y-2">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Ouvert aujourd'hui</div>
                  <div className="text-sm font-semibold text-gray-800">{shop.openingHours || '08:00 - 19:00'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Livraison</div>
                  <div className="text-sm font-semibold text-gray-800">Yaoundé et environs</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Paiement</div>
                  <div className="text-sm font-semibold text-gray-800">Paiement à la livraison</div>
                </div>
              </div>
            </div>

            {/* Carte "Achetez en toute confiance" */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-emerald-600 mb-4">Achetez en toute confiance</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <Lock className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">Paiement sécurisé</div>
                    <div className="text-xs text-gray-500">Transactions protégées</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">Produits de qualité</div>
                    <div className="text-xs text-gray-500">Sélection rigoureuse</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">Réponse rapide</div>
                    <div className="text-xs text-gray-500">Support disponible</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Carte "Informations pratiques" */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4">Informations pratiques</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Adresse</div>
                    <div className="text-sm font-semibold text-gray-800">{shop.location || 'Yaoundé, Cameroun'}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Moyens de paiement</div>
                    <div className="text-sm font-semibold text-gray-800">Paiement à la livraison</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Zones de livraison</div>
                    <div className="text-sm font-semibold text-gray-800">Yaoundé et environs</div>
                  </div>
                </div>
              </div>
              <button className="flex items-center gap-1 text-emerald-600 text-sm font-medium mt-3 hover:text-emerald-700 transition">
                Voir toutes les informations →
              </button>
            </div>

            {/* Carte "Avis des clients" */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4">Avis des clients</h3>

              {/* Note globale */}
              <div className="flex items-center gap-3 mb-4">
                <div>
                  <div className="text-3xl font-bold text-gray-900">4,8</div>
                  <div className="text-xs text-gray-500">sur 5</div>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>

              {/* Barres de notes */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 w-10">5 ⭐</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }} />
                  </div>
                  <span className="text-xs font-bold text-gray-900 w-8 text-right">85%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 w-10">4 ⭐</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '12%' }} />
                  </div>
                  <span className="text-xs font-bold text-gray-900 w-8 text-right">12%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 w-10">3 ⭐</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '3%' }} />
                  </div>
                  <span className="text-xs font-bold text-gray-900 w-8 text-right">3%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== BANDEAU RÉASSURANCE ===== */}
        <div className="mt-8 bg-white rounded-2xl p-5 border border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-11 h-11 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
              <Truck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="font-bold text-sm text-gray-900">Livraison rapide</div>
              <div className="text-xs text-gray-500">Partout à Yaoundé</div>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-1">
            <div className="w-11 h-11 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
              <Award className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="font-bold text-sm text-gray-900">Produits authentiques</div>
              <div className="text-xs text-gray-500">Qualité garantie</div>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-1">
            <div className="w-11 h-11 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
              <Headphones className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="font-bold text-sm text-gray-900">Support client</div>
              <div className="text-xs text-gray-500">Assistance 24/7</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Search, Heart, ShoppingCart, MessageCircle,
  Package, CheckCircle, X, ChevronLeft, ChevronRight,
  ShoppingBag, Minus, Plus,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Product = {
  id: string;
  name: string;
  description?: string | null;
  unitPrice: string;
  stock: number;
  imageUrl?: string | null;
  imageVariants?: string[];
  category?: string | null;
  categories?: string[];
  shopName?: string;
  whatsappNumber?: string | null;
};

type Shop = {
  name: string;
  whatsappNumber?: string | null;
};

type CartItem = {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
};

type OrderResult = {
  orderId: string;
  totalAmount: number;
  shopName: string;
  whatsappNumber?: string | null;
};

type FavoriteItem = {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  category?: string | null;
};

// ─── Constantes ───────────────────────────────────────────────────────────────

const PAYMENT_OPTIONS = [
  { value: "cod",           emoji: "🚚", label: "Paiement à la livraison" },
  { value: "mobile_money",  emoji: "📱", label: "Mobile Money" },
  { value: "bank_transfer", emoji: "🏦", label: "Virement bancaire" },
  { value: "cash",          emoji: "💵", label: "Espèces" },
] as const;

const COLORS = [
  { hex: "#F2C24E", name: "Doré" },
  { hex: "#F9A4B8", name: "Rose" },
  { hex: "#4CAF7A", name: "Vert" },
  { hex: "#1F2A24", name: "Noir" },
];

const SIZES = ["S", "M", "L", "XL"];

const SIMULATED_REVIEWS = [
  { initials: "AM", name: "Aïcha M.", stars: 5, text: "Magnifique robe, qualité irréprochable !", date: "Il y a 2 jours" },
  { initials: "FK", name: "Fatou K.", stars: 5, text: "Très belle, conforme à la description.", date: "Il y a 1 semaine" },
];

const RECO_PRODUCTS = [
  { name: "Sac Chic Élégance",        price: 18000, emoji: "👜" },
  { name: "Parfum Coco Mademoiselle", price: 32000, emoji: "🌸" },
  { name: "Chemisier Satiné",         price: 14000, emoji: "👗" },
  { name: "Escarpins Élégance",       price: 22000, emoji: "👠" },
  { name: "Escarpins Émeraude",       price: 24000, emoji: "👠" },
  { name: "Combinaison Orme",         price: 28000, emoji: "👒" },
  { name: "Collier Doré Chic",        price: 9500,  emoji: "📿" },
];

const STAR_DISTRIBUTION = [
  { star: 5, pct: 78 }, { star: 4, pct: 15 },
  { star: 3, pct: 5 },  { star: 2, pct: 1 }, { star: 1, pct: 1 },
];

// ─── CSS ─────────────────────────────────────────────────────────────────────

const CSS = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideIn { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }

  /* ── Layout ── */
  .pdp-header {
    position: fixed; top: 0; left: 0; right: 0; z-index: 50;
    background: #fff; border-bottom: 1px solid #E8ECEA;
    height: 72px; box-shadow: 0 1px 8px rgba(16,24,40,0.05);
  }
  .pdp-container {
    max-width: 1320px; margin: 0 auto; padding: 0 24px; box-sizing: border-box;
  }
  .pdp-header-inner {
    display: flex; align-items: center; justify-content: space-between;
    height: 72px; gap: 16px;
  }
  .pdp-searchbar {
    height: 44px; max-width: 560px; width: 100%;
    border-radius: 12px; border: 1.5px solid #E8ECEA;
    background: #F8FAF9; padding: 0 16px 0 44px;
    font-size: 14px; color: #1F2A24; outline: none;
    transition: border-color .15s;
  }
  .pdp-searchbar:focus { border-color: #0A8F45; }
  .pdp-searchbar::placeholder { color: #98A2B3; }
  .pdp-header-btn {
    display: flex; align-items: center; justify-content: center;
    gap: 7px; height: 38px; padding: 0 14px;
    border: 1.5px solid #E8ECEA; border-radius: 10px;
    background: #fff; color: #667085; font-size: 13px;
    font-weight: 600; cursor: pointer; text-decoration: none;
    transition: all .15s; white-space: nowrap;
  }
  .pdp-header-btn:hover { border-color: #0A8F45; color: #0A8F45; background: #EAF7EF; }
  .pdp-header-cart {
    position: relative; width: 38px; height: 38px;
    background: #0A8F45; border: none; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #fff; flex-shrink: 0;
  }
  .pdp-cart-badge {
    position: absolute; top: -5px; right: -5px;
    width: 18px; height: 18px; background: #1F2A24; color: #fff;
    font-size: 10px; font-weight: 800; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
  }
  .pdp-btn-shop {
    display: flex; align-items: center; gap: 7px;
    height: 38px; padding: 0 16px; background: #0A8F45;
    color: #fff; border-radius: 10px; font-size: 13px;
    font-weight: 700; text-decoration: none; white-space: nowrap;
    transition: background .15s;
  }
  .pdp-btn-shop:hover { background: #08763A; }

  /* ── Breadcrumb ── */
  .pdp-breadcrumb {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; color: #98A2B3; margin-bottom: 24px;
    flex-wrap: wrap;
  }
  .pdp-breadcrumb a { color: #667085; text-decoration: none; }
  .pdp-breadcrumb a:hover { color: #0A8F45; }
  .pdp-breadcrumb-sep { color: #C8CED6; }

  /* ── Grille 3 colonnes ── */
  .pdp-main-grid {
    display: flex; gap: 20px; align-items: flex-start;
  }
  .pdp-gallery-col { width: 470px; flex-shrink: 0; display: flex; flex-direction: column; gap: 12px; }
  .pdp-info-col { width: 490px; flex-shrink: 0; display: flex; flex-direction: column; }
  .pdp-sidebar-col { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 14px; }

  /* ── Galerie ── */
  .pdp-gallery-main {
    width: 100%; height: 540px; border-radius: 18px;
    overflow: hidden; border: 1px solid #E8ECEA;
    background: #fff; position: relative;
    box-shadow: 0 4px 16px rgba(16,24,40,0.06);
  }
  .pdp-gallery-img {
    width: 100%; height: 100%; object-fit: cover;
    transition: transform .4s ease;
  }
  .pdp-gallery-main:hover .pdp-gallery-img { transform: scale(1.03); }
  .pdp-gallery-placeholder {
    width: 100%; height: 100%;
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 12px; color: #C8CED6;
  }
  .pdp-stock-overlay {
    position: absolute; top: 16px; left: 16px;
    padding: 5px 14px; border-radius: 8px;
    font-size: 12px; font-weight: 700;
  }
  .pdp-heart-btn {
    position: absolute; top: 14px; right: 14px;
    width: 38px; height: 38px; background: #fff;
    border: 1.5px solid #E8ECEA; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transition: all .15s;
  }
  .pdp-heart-btn:hover { border-color: #EF4444; }
  .pdp-arrow-btn {
    position: absolute; top: 50%; transform: translateY(-50%);
    width: 36px; height: 36px; background: rgba(255,255,255,0.92);
    border: 1px solid #E8ECEA; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #1F2A24; transition: all .15s;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  .pdp-arrow-btn:hover { background: #fff; border-color: #0A8F45; color: #0A8F45; }
  .pdp-arrow-left { left: 12px; }
  .pdp-arrow-right { right: 12px; }
  .pdp-thumbs { display: flex; gap: 10px; flex-wrap: wrap; }
  .pdp-thumb {
    width: 76px; height: 76px; border-radius: 12px;
    border: 2px solid #E8ECEA; overflow: hidden;
    cursor: pointer; padding: 0; background: #fff;
    flex-shrink: 0; transition: border-color .15s;
  }
  .pdp-thumb.active { border-color: #0A8F45; box-shadow: 0 0 0 2px rgba(10,143,69,0.15); }
  .pdp-thumb:hover { border-color: #0A8F45; }
  .pdp-mini-reassurance {
    display: flex; align-items: stretch;
    background: #fff; border: 1px solid #E8ECEA;
    border-radius: 14px; overflow: hidden;
  }
  .pdp-mini-col {
    flex: 1; padding: 12px 8px; text-align: center;
    border-right: 1px solid #E8ECEA;
  }
  .pdp-mini-col:last-child { border-right: none; }

  /* ── Infos produit ── */
  .pdp-verified-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 12px; background: #EAF7EF; color: #0A8F45;
    border-radius: 20px; font-size: 11px; font-weight: 700;
    margin-bottom: 12px;
  }
  .pdp-product-title {
    margin: 0 0 14px; font-size: 26px; font-weight: 800;
    color: #1F2A24; line-height: 1.2;
  }
  .pdp-stars-row {
    display: flex; align-items: center; gap: 8px; margin-bottom: 18px;
  }
  .pdp-stars { display: flex; gap: 2px; }
  .pdp-price {
    font-size: 36px; font-weight: 800; color: #0A8F45;
    line-height: 1; margin-bottom: 20px;
  }
  .pdp-desc-box {
    background: #F8FAF9; border-radius: 12px;
    padding: 14px 16px; margin-bottom: 20px;
  }
  .pdp-desc-label {
    font-size: 10px; font-weight: 700; color: #98A2B3;
    text-transform: uppercase; letter-spacing: .07em; margin-bottom: 7px;
  }
  .pdp-color-btn {
    width: 30px; height: 30px; border-radius: 50%;
    border: 2px solid transparent; cursor: pointer;
    transition: all .15s; padding: 0; flex-shrink: 0;
  }
  .pdp-color-btn.active {
    border-color: #0A8F45;
    box-shadow: 0 0 0 3px rgba(10,143,69,0.18);
  }
  .pdp-size-btn {
    height: 36px; min-width: 44px; padding: 0 14px;
    border: 1.5px solid #E8ECEA; border-radius: 8px;
    background: #fff; color: #1F2A24; font-size: 13px;
    font-weight: 600; cursor: pointer; transition: all .15s;
  }
  .pdp-size-btn.active {
    background: #0A8F45; color: #fff; border-color: #0A8F45;
  }
  .pdp-size-btn:not(.active):hover { border-color: #0A8F45; color: #0A8F45; }
  .pdp-qty-row {
    display: flex; align-items: center;
    border: 1.5px solid #E8ECEA; border-radius: 10px;
    overflow: hidden; height: 44px;
  }
  .pdp-qty-btn {
    width: 44px; height: 100%; border: none;
    background: #F8FAF9; cursor: pointer; color: #1F2A24;
    display: flex; align-items: center; justify-content: center;
    transition: background .15s;
  }
  .pdp-qty-btn:hover:not(:disabled) { background: #EAF7EF; color: #0A8F45; }
  .pdp-qty-btn:disabled { opacity: .35; cursor: default; }
  .pdp-subtotal {
    display: flex; justify-content: space-between; align-items: center;
    background: #EAF7EF; border-radius: 10px; padding: 11px 16px;
    margin-bottom: 16px;
  }
  .pdp-cta-primary {
    width: 100%; height: 52px; background: #0A8F45;
    color: #fff; border: none; border-radius: 12px;
    font-size: 15px; font-weight: 700; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    gap: 8px; transition: background .15s;
    box-shadow: 0 4px 14px rgba(10,143,69,0.25);
  }
  .pdp-cta-primary:hover { background: #08763A; }
  .pdp-cta-outline {
    width: 100%; height: 52px; background: #fff;
    color: #0A8F45; border: 2px solid #0A8F45;
    border-radius: 12px; font-size: 15px; font-weight: 700;
    cursor: pointer; display: flex; align-items: center;
    justify-content: center; gap: 8px; transition: all .15s;
    text-decoration: none;
  }
  .pdp-cta-outline:hover { background: #EAF7EF; }
  .pdp-cta-disabled {
    width: 100%; height: 52px; background: #F0F2F1;
    color: #A0ABA8; border: none; border-radius: 12px;
    font-size: 15px; font-weight: 700; cursor: not-allowed;
  }
  .pdp-perks {
    display: flex; align-items: center; gap: 14px;
    flex-wrap: wrap; margin-top: 14px;
    font-size: 12px; color: #667085;
  }
  .pdp-perk { display: flex; align-items: center; gap: 5px; }

  /* ── Sidebar cards ── */
  .pdp-card {
    background: #fff; border: 1px solid #E8ECEA;
    border-radius: 18px; padding: 20px;
  }
  .pdp-card-title {
    font-size: 13px; font-weight: 700; color: #1F2A24; margin-bottom: 14px;
  }
  .pdp-shop-logo {
    width: 52px; height: 52px; border-radius: 50%;
    background: #0A8F45; display: flex; align-items: center;
    justify-content: center; color: #fff; font-size: 22px;
    font-weight: 800; flex-shrink: 0;
  }
  .pdp-check-item {
    display: flex; align-items: flex-start; gap: 8px;
    font-size: 13px; color: #1F2A24; margin-bottom: 9px;
  }
  .pdp-check-icon {
    width: 18px; height: 18px; background: #EAF7EF;
    border-radius: 50%; display: flex; align-items: center;
    justify-content: center; flex-shrink: 0; margin-top: 1px;
    font-size: 10px; color: #0A8F45; font-weight: 800;
  }
  .pdp-payment-chip {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 12px; background: #F8FAF9; border: 1px solid #E8ECEA;
    border-radius: 8px; font-size: 12px; font-weight: 600; color: #1F2A24;
  }
  .pdp-share-btn {
    width: 36px; height: 36px; border-radius: 50%;
    border: 1.5px solid #E8ECEA; background: #fff;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 15px; transition: all .15s;
  }
  .pdp-share-btn:hover { border-color: #0A8F45; background: #EAF7EF; }
  .pdp-review-avatar {
    width: 34px; height: 34px; border-radius: 50%;
    background: #EAF7EF; color: #0A8F45; font-size: 12px;
    font-weight: 700; display: flex; align-items: center;
    justify-content: center; flex-shrink: 0;
  }

  /* ── Tabs description/avis ── */
  .pdp-tabs-section {
    display: flex; gap: 20px; margin-top: 20px; align-items: flex-start;
  }
  .pdp-tabs-main { flex: 1; min-width: 0; }
  .pdp-tabs-aside { width: 380px; flex-shrink: 0; }
  .pdp-tabs-nav {
    display: flex; gap: 0; border-bottom: 2px solid #E8ECEA;
    margin-bottom: 22px;
  }
  .pdp-tab-btn {
    padding: 10px 18px; background: none; border: none;
    border-bottom: 2px solid transparent; margin-bottom: -2px;
    font-size: 13px; font-weight: 600; color: #667085;
    cursor: pointer; transition: all .15s; white-space: nowrap;
  }
  .pdp-tab-btn.active { color: #0A8F45; border-bottom-color: #0A8F45; }
  .pdp-tab-btn:hover:not(.active) { color: #1F2A24; }
  .pdp-feature-check {
    display: flex; align-items: flex-start; gap: 10px;
    margin-bottom: 10px; font-size: 14px; color: #1F2A24;
  }
  .pdp-feature-check-icon {
    width: 22px; height: 22px; background: #EAF7EF; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; font-size: 11px; color: #0A8F45; font-weight: 800;
    margin-top: 1px;
  }
  .pdp-spec-table { width: 100%; border-collapse: collapse; }
  .pdp-spec-table tr { border-bottom: 1px solid #F4F6F5; }
  .pdp-spec-table tr:last-child { border-bottom: none; }
  .pdp-spec-table td {
    padding: 10px 12px; font-size: 13px; color: #1F2A24;
    background: #fff;
  }
  .pdp-spec-table td:first-child {
    color: #667085; font-weight: 600; width: 40%;
    background: #F8FAF9;
  }
  .pdp-faq-item { margin-bottom: 14px; }
  .pdp-faq-q {
    font-size: 14px; font-weight: 700; color: #1F2A24; margin-bottom: 5px;
  }
  .pdp-faq-a { font-size: 13px; color: #667085; line-height: 1.6; }
  .pdp-rating-big {
    font-size: 60px; font-weight: 800; color: #1F2A24;
    line-height: 1; margin-bottom: 8px;
  }
  .pdp-bar-row {
    display: flex; align-items: center; gap: 8px; margin-bottom: 7px;
  }
  .pdp-bar-track {
    flex: 1; height: 7px; background: #F4F6F5;
    border-radius: 4px; overflow: hidden;
  }
  .pdp-bar-fill { height: 100%; background: #0A8F45; border-radius: 4px; }

  /* ── Produits recommandés ── */
  .pdp-reco-section { margin-top: 36px; }
  .pdp-reco-scroll {
    display: flex; gap: 14px; overflow-x: auto;
    padding-bottom: 8px;
  }
  .pdp-reco-scroll::-webkit-scrollbar { height: 4px; }
  .pdp-reco-scroll::-webkit-scrollbar-track { background: #F4F6F5; border-radius: 4px; }
  .pdp-reco-scroll::-webkit-scrollbar-thumb { background: #C8CED6; border-radius: 4px; }
  .pdp-reco-card {
    width: 170px; min-width: 170px; height: 255px;
    background: #fff; border: 1px solid #E8ECEA;
    border-radius: 14px; overflow: hidden; flex-shrink: 0;
    display: flex; flex-direction: column;
    transition: box-shadow .15s;
  }
  .pdp-reco-card:hover { box-shadow: 0 4px 20px rgba(16,24,40,0.08); }
  .pdp-reco-img {
    height: 148px; background: #F8FAF9;
    display: flex; align-items: center; justify-content: center;
    font-size: 48px; position: relative;
  }
  .pdp-reco-heart {
    position: absolute; top: 8px; right: 8px;
    width: 28px; height: 28px; background: #fff;
    border: none; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.12);
    font-size: 13px;
  }
  .pdp-reco-body { padding: 10px 12px; flex: 1; display: flex; flex-direction: column; }

  /* ── FAB ── */
  .pdp-fab {
    position: fixed; bottom: 28px; right: 28px; z-index: 100;
    display: flex; align-items: center; gap: 10px;
    height: 52px; padding: 0 22px; background: #25D366;
    color: #fff; border: none; border-radius: 26px;
    font-size: 14px; font-weight: 700; cursor: pointer;
    box-shadow: 0 4px 20px rgba(37,211,102,0.4);
    text-decoration: none; transition: background .15s;
  }
  .pdp-fab:hover { background: #1ebe5d; }

  /* ── Toast ── */
  .pdp-toast {
    position: fixed; bottom: 96px; left: 50%;
    transform: translateX(-50%); z-index: 9999;
    background: #0A8F45; color: #fff;
    padding: 12px 24px; border-radius: 12px;
    font-weight: 600; font-size: 14px;
    box-shadow: 0 4px 16px rgba(10,143,69,0.35);
    white-space: nowrap; animation: fadeUp .2s ease;
  }

  /* ── Modal ── */
  .pdp-modal-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(0,0,0,0.55);
    display: flex; align-items: center;
    justify-content: center; padding: 16px;
    animation: fadeUp .15s ease;
  }
  .pdp-modal {
    background: #fff; border-radius: 20px;
    width: 100%; max-width: 480px;
    max-height: 92vh; overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    animation: slideIn .18s ease;
  }
  .pdp-modal-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 24px 16px; border-bottom: 1px solid #E8ECEA;
    position: sticky; top: 0; background: #fff; z-index: 1;
  }
  .pdp-modal-close {
    background: none; border: 1px solid #E8ECEA; border-radius: 8px;
    width: 32px; height: 32px; cursor: pointer; color: #667085;
    display: flex; align-items: center; justify-content: center;
  }
  .pdp-input {
    width: 100%; height: 42px; border: 1.5px solid #E8ECEA;
    border-radius: 10px; padding: 0 12px; font-size: 14px;
    color: #1F2A24; background: #fff; outline: none;
    box-sizing: border-box; transition: border-color .15s;
  }
  .pdp-input:focus { border-color: #0A8F45; }
  .pdp-textarea {
    width: 100%; border: 1.5px solid #E8ECEA; border-radius: 10px;
    padding: 10px 12px; font-size: 13px; color: #1F2A24;
    background: #fff; outline: none; resize: vertical;
    box-sizing: border-box; font-family: inherit;
    transition: border-color .15s;
  }
  .pdp-textarea:focus { border-color: #0A8F45; }
  .pdp-pay-option {
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    padding: 10px 8px; border-radius: 10px; border: 1.5px solid #E8ECEA;
    background: #fff; cursor: pointer; font-size: 12px;
    font-weight: 500; color: #667085; transition: all .15s;
  }
  .pdp-pay-option.active {
    border-color: #0A8F45; background: #EAF7EF;
    font-weight: 700; color: #0A8F45;
  }

  /* ── Responsive ── */
  @media (max-width: 1200px) {
    .pdp-sidebar-col { display: none; }
    .pdp-info-col { flex: 1; width: auto; }
  }
  @media (max-width: 900px) {
    .pdp-main-grid { flex-direction: column; }
    .pdp-gallery-col { width: 100%; }
    .pdp-gallery-main { height: 360px; }
    .pdp-info-col { width: 100%; }

    .pdp-tabs-section { flex-direction: column; }
    .pdp-tabs-aside { width: 100%; }
    .pdp-mini-reassurance { display: none; }
  }
  @media (max-width: 600px) {
    .pdp-container { padding: 0 14px; }
    .pdp-searchbar-wrap { display: none !important; }
    .pdp-gallery-main { height: 300px; }
    .pdp-price { font-size: 28px; }
    .pdp-product-title { font-size: 21px; }
    .pdp-fab { bottom: 16px; right: 16px; font-size: 13px; }
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(value: string | number): string {
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return "—";
  return `${new Intl.NumberFormat("fr-FR").format(num)} FCFA`;
}

function stockBadge(stock: number): { label: string; bg: string; color: string } {
  if (stock <= 0) return { label: "Rupture de stock", bg: "#FFF1F2", color: "#DC2626" };
  if (stock <= 5) return { label: `Plus que ${stock} en stock`, bg: "#FFF1E5", color: "#F08A24" };
  return { label: "En stock", bg: "#DDF6E7", color: "#0A8F45" };
}

function Stars({ count, size = 14 }: { count: number; size?: number }) {
  return (
    <span style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ fontSize: size, color: "#F7B500" }}>★</span>
      ))}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const params = useParams<{ slug: string; productId: string }>();
  const slug      = params?.slug      ?? "";
  const productId = params?.productId ?? "";

  const [product,  setProduct]  = useState<Product | null>(null);
  const [shop,     setShop]     = useState<Shop | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [quantity,      setQuantity]      = useState(1);
  const [toast,         setToast]         = useState<string | null>(null);

  const [checkoutOpen,    setCheckoutOpen]    = useState(false);
  const [customerName,    setCustomerName]    = useState("");
  const [customerPhone,   setCustomerPhone]   = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod,   setPaymentMethod]   = useState<"cash"|"mobile_money"|"bank_transfer"|"cod">("cod");
  const [orderNotes,      setOrderNotes]      = useState("");
  const [submitting,      setSubmitting]      = useState(false);
  const [formError,       setFormError]       = useState<string | null>(null);

  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);

  // États supplémentaires
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize,  setSelectedSize]  = useState("M");
  const [descTab,       setDescTab]       = useState<"description"|"caracteristiques"|"avis"|"faq">("description");
  const [cartCount,     setCartCount]     = useState(0);
  const [favCount,      setFavCount]      = useState(0);
  const [favorited,     setFavorited]     = useState(false);
  const [recoProducts,  setRecoProducts]  = useState<Product[]>([]);

  // ─── Chargement produit ───────────────────────────────────────────────────

  useEffect(() => {
    if (!slug || !productId) return;
    const load = async () => {
      try {
        const res  = await fetch(`/api/public/shop/${slug}/products/${productId}`);
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json?.error ?? "Produit introuvable");
        }
        const json = await res.json();
        const data: Product = json?.data ?? json;
        setProduct(data);
        setSelectedImage(data.imageUrl ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors du chargement");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, productId]);

  // ─── Chargement boutique ──────────────────────────────────────────────────

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/public/shop/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setShop(d?.data ?? d); })
      .catch(() => {});
  }, [slug]);

  // ─── Chargement produits recommandés (même catégorie) ──────────────────────

  useEffect(() => {
    if (!product || !slug || !product.category) return;
    const loadReco = async () => {
      try {
        const category = product.category ?? "";
        const res = await fetch(`/api/public/shop/${slug}/products?category=${encodeURIComponent(category)}&limit=10`);
        if (!res.ok) return;
        const json = await res.json();
        const allProducts: Product[] = json?.data ?? [];
        const filtered = allProducts.filter(p => p.id !== product.id).slice(0, 7);
        setRecoProducts(filtered);
      } catch (err) { console.error("Erreur chargement reco:", err); }
    };
    loadReco();
  }, [product, slug]);

  // ─── Toast auto-dismiss ───────────────────────────────────────────────────

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  // ─── CartCount + FavCount + favorited depuis localStorage ───────────────

  useEffect(() => {
    if (!slug) return;
    try {
      const s = localStorage.getItem(`cart-${slug}`);
      if (s) {
        const c: CartItem[] = JSON.parse(s);
        setCartCount(c.reduce((sum, i) => sum + i.quantity, 0));
      }
    } catch { /* ignore */ }
  }, [slug, toast]);

  useEffect(() => {
    if (!slug || !product?.id) return;
    try {
      const s = localStorage.getItem(`favorites-${slug}`);
      if (s) {
        const favs: FavoriteItem[] = JSON.parse(s);
        setFavorited(favs.some(f => f.productId === product.id));
        setFavCount(favs.length);
      }
    } catch { /* ignore */ }
  }, [slug, product?.id]);

  // ─── Actions ─────────────────────────────────────────────────────────────

  function toggleFavorite() {
    if (!product) return;
    const key = `favorites-${slug}`;
    let favs: FavoriteItem[] = [];
    try { const s = localStorage.getItem(key); if (s) favs = JSON.parse(s); } catch { favs = []; }
    const already = favs.some(f => f.productId === product.id);
    if (already) {
      favs = favs.filter(f => f.productId !== product.id);
      setFavorited(false);
      setToast("Retiré des favoris");
    } else {
      favs.push({ productId: product.id, name: product.name, price: Number(product.unitPrice), imageUrl: product.imageUrl ?? null, category: product.category ?? null });
      setFavorited(true);
      setToast("Ajouté aux favoris ♡");
    }
    try { localStorage.setItem(key, JSON.stringify(favs)); } catch { /* ignore */ }
    setFavCount(favs.length);
  }

  function addToCart() {
    if (!product) return;
    const key = `cart-${slug}`;
    let cart: CartItem[] = [];
    try { const s = localStorage.getItem(key); if (s) cart = JSON.parse(s); } catch { cart = []; }
    const existing = cart.find(i => i.productId === product.id);
    if (existing) { existing.quantity += quantity; }
    else { cart.push({ productId: product.id, name: product.name, price: Number(product.unitPrice), imageUrl: product.imageUrl ?? null, quantity }); }
    try { localStorage.setItem(key, JSON.stringify(cart)); } catch { /* ignore */ }
    setToast(`${quantity} article${quantity > 1 ? "s" : ""} ajouté${quantity > 1 ? "s" : ""} au panier ✓`);
  }

  async function submitOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    setFormError(null);
    if (!customerName.trim())  { setFormError("Le nom complet est requis."); return; }
    if (!customerPhone.trim()) { setFormError("Le numéro de téléphone est requis."); return; }
    setSubmitting(true);
    try {
      const res  = await fetch(`/api/public/shop/${slug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName:    customerName.trim(),
          customerPhone:   customerPhone.trim(),
          customerAddress: customerAddress.trim() || undefined,
          paymentMethod,
          notes: orderNotes.trim() || undefined,
          items: [{ productId: product.id, quantity }],
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setFormError(json?.error ?? "Impossible de créer la commande."); return; }
      setCheckoutOpen(false);
      setOrderResult(json.data as OrderResult);
    } catch {
      setFormError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── État de chargement ───────────────────────────────────────────────────

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#F8FAF9", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
      <style>{CSS}</style>
      <div style={{ width:44, height:44, border:"4px solid #E8ECEA", borderTopColor:"#0A8F45", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <p style={{ color:"#667085", fontSize:14, margin:0 }}>Chargement du produit…</p>
    </div>
  );

  if (error || !product) return (
    <div style={{ minHeight:"100vh", background:"#F8FAF9", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12, padding:24 }}>
      <style>{CSS}</style>
      <div style={{ width:72, height:72, background:"#EAF7EF", borderRadius:20, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Package style={{ width:36, height:36, color:"#0A8F45" }} />
      </div>
      <p style={{ fontWeight:700, fontSize:16, color:"#1F2A24", margin:0 }}>Produit introuvable</p>
      <p style={{ fontSize:14, color:"#667085", margin:0 }}>{error ?? "Ce produit n'est plus disponible."}</p>
      <Link href={`/shop/${slug}`} className="pdp-header-btn" style={{ marginTop:8 }}>
        <ArrowLeft style={{ width:15, height:15 }} /> Retour à la boutique
      </Link>
    </div>
  );

  // ─── Données dérivées ─────────────────────────────────────────────────────

  const shopName       = product.shopName ?? shop?.name ?? "Boutique";
  const badge          = stockBadge(product.stock);
  const unitPrice      = Number(product.unitPrice);
  const gallery        = Array.from(new Set([product.imageUrl, ...(product.imageVariants ?? [])].filter(Boolean) as string[]));
  const mainImage      = selectedImage ?? gallery[0] ?? null;
  const whatsappNumber = product.whatsappNumber ?? shop?.whatsappNumber ?? null;
  const whatsappUrl    = whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}` : null;
  const shopInitial    = shopName.charAt(0).toUpperCase();

  const currentImageIndex = gallery.indexOf(mainImage ?? "");
  function prevImage() {
    if (gallery.length < 2) return;
    setSelectedImage(gallery[(currentImageIndex - 1 + gallery.length) % gallery.length]);
  }
  function nextImage() {
    if (gallery.length < 2) return;
    setSelectedImage(gallery[(currentImageIndex + 1) % gallery.length]);
  }

  // ─── Rendu ────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight:"100vh", background:"#F8FAF9", fontFamily:"inherit" }}>
      <style>{CSS}</style>

      {/* Toast */}
      {toast && <div className="pdp-toast">{toast}</div>}

      {/* ══ HEADER ══ */}
      <header className="pdp-header">
        <div className="pdp-container">
          <div className="pdp-header-inner">

            {/* Logo BizManager */}
            <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
              <div style={{ width:36, height:36, background:"#0A8F45", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ color:"#fff", fontWeight:800, fontSize:18 }}>B</span>
              </div>
              <span style={{ fontWeight:800, fontSize:17, color:"#1F2A24" }}>BizManager</span>
            </div>

            {/* Barre de recherche */}
            <div className="pdp-searchbar-wrap" style={{ position:"relative", display:"flex", alignItems:"center", flex:1, maxWidth:560 }}>
              <Search style={{ position:"absolute", left:14, width:16, height:16, color:"#98A2B3", pointerEvents:"none" }} />
              <input type="text" className="pdp-searchbar" placeholder="Rechercher un produit…" readOnly />
            </div>

            {/* Actions droite */}
            <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
              {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="pdp-header-btn">
                  <MessageCircle style={{ width:15, height:15 }} />
                  Nous contacter
                </a>
              )}
              <Link href={`/shop/${slug}/favorites`} className="pdp-header-btn" style={{ position:"relative" }} title="Mes favoris">
                <Heart style={{ width:15, height:15 }} />
                Favoris
                {favCount > 0 && (
                  <span className="pdp-cart-badge" style={{ background:"#EF4444" }}>{favCount > 9 ? "9+" : favCount}</span>
                )}
              </Link>
              <button className="pdp-header-cart" title="Panier" onClick={addToCart}>
                <ShoppingCart style={{ width:17, height:17 }} />
                {cartCount > 0 && (
                  <span className="pdp-cart-badge">{cartCount > 9 ? "9+" : cartCount}</span>
                )}
              </button>
              <Link href={`/shop/${slug}`} className="pdp-btn-shop">
                Voir la boutique
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ══ CONTENU PRINCIPAL ══ */}
      <div style={{ paddingTop:88, paddingBottom:60 }}>
        <div className="pdp-container" style={{ paddingTop:24 }}>

          {/* Breadcrumb */}
          <nav className="pdp-breadcrumb">
            <Link href={`/shop/${slug}`}>Accueil</Link>
            <span className="pdp-breadcrumb-sep">/</span>
            <Link href={`/shop/${slug}`}>{shopName}</Link>
            {product.category && (
              <>
                <span className="pdp-breadcrumb-sep">/</span>
                <span>{product.category}</span>
              </>
            )}
            <span className="pdp-breadcrumb-sep">/</span>
            <span style={{ color:"#1F2A24", fontWeight:500 }}>{product.name}</span>
          </nav>

          {/* Grille 3 colonnes */}
          <div className="pdp-main-grid">

            {/* ── COL 1 : GALERIE ── */}
            <div className="pdp-gallery-col">

              {/* Image principale */}
              <div className="pdp-gallery-main">
                {mainImage ? (
                  <img src={mainImage} alt={product.name} className="pdp-gallery-img" />
                ) : (
                  <div className="pdp-gallery-placeholder">
                    <Package style={{ width:64, height:64 }} />
                    <span style={{ fontSize:14 }}>Aucune image disponible</span>
                  </div>
                )}

                {/* Badge stock */}
                <div className="pdp-stock-overlay" style={{ background:badge.bg, color:badge.color }}>
                  {badge.label}
                </div>

                {/* Bouton cœur */}
                <button
                  className="pdp-heart-btn"
                  onClick={toggleFavorite}
                  title={favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
                >
                  <Heart style={{ width:17, height:17, color: favorited ? "#EF4444" : "#D0D5DD", fill: favorited ? "#EF4444" : "none" }} />
                </button>

                {/* Flèches navigation */}
                {gallery.length > 1 && (
                  <>
                    <button className="pdp-arrow-btn pdp-arrow-left" onClick={prevImage}>
                      <ChevronLeft style={{ width:18, height:18 }} />
                    </button>
                    <button className="pdp-arrow-btn pdp-arrow-right" onClick={nextImage}>
                      <ChevronRight style={{ width:18, height:18 }} />
                    </button>
                  </>
                )}
              </div>

              {/* Miniatures */}
              {gallery.length > 1 && (
                <div className="pdp-thumbs">
                  {gallery.map((img, i) => (
                    <button
                      key={i}
                      className={`pdp-thumb${img === (selectedImage ?? gallery[0]) ? " active" : ""}`}
                      onClick={() => setSelectedImage(img)}
                    >
                      <img src={img} alt={`Vue ${i + 1}`} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    </button>
                  ))}
                </div>
              )}

              {/* Mini réassurance */}
              
            </div>

            {/* ── COL 2 : INFOS PRODUIT ── */}
            <div className="pdp-info-col">

              {/* Badge vérifié */}
              <span className="pdp-verified-badge">✓ Boutique vérifiée</span>

              {/* Titre */}
              <h1 className="pdp-product-title">{product.name}</h1>

              {/* Note */}
              <div className="pdp-stars-row">
                <Stars count={5} size={15} />
                <span style={{ fontSize:13, fontWeight:700, color:"#1F2A24" }}>4.8</span>
                <span style={{ fontSize:12, color:"#98A2B3" }}>(32 avis)</span>
                <span style={{ width:1, height:14, background:"#E8ECEA", display:"inline-block", margin:"0 4px" }} />
                <span style={{ fontSize:12, color:"#667085" }}>128 vendus</span>
              </div>

              {/* Prix */}
              <div className="pdp-price">{formatPrice(product.unitPrice)}</div>

              {/* Description */}
              {product.description && (
                <div className="pdp-desc-box">
                  <div className="pdp-desc-label">Description</div>
                  <p style={{ margin:0, fontSize:14, color:"#1F2A24", lineHeight:1.7 }}>{product.description}</p>
                </div>
              )}

              <hr style={{ border:"none", borderTop:"1px solid #E8ECEA", margin:"0 0 20px" }} />

              {/* Couleurs */}
              <div style={{ marginBottom:18 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#1F2A24", marginBottom:10 }}>
                  Couleur — <span style={{ fontWeight:400, color:"#667085" }}>{COLORS[selectedColor].name}</span>
                </div>
                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                  {COLORS.map((c, i) => (
                    <button
                      key={i}
                      className={`pdp-color-btn${selectedColor === i ? " active" : ""}`}
                      style={{ background:c.hex }}
                      onClick={() => setSelectedColor(i)}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Tailles */}
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#1F2A24", marginBottom:10 }}>Taille</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {SIZES.map(s => (
                    <button
                      key={s}
                      className={`pdp-size-btn${selectedSize === s ? " active" : ""}`}
                      onClick={() => setSelectedSize(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantité */}
              {product.stock > 0 && (
                <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:16 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:"#1F2A24", minWidth:64 }}>Quantité</span>
                  <div className="pdp-qty-row">
                    <button className="pdp-qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}>
                      <Minus style={{ width:14, height:14 }} />
                    </button>
                    <span style={{ minWidth:44, textAlign:"center", fontWeight:700, fontSize:15, color:"#1F2A24" }}>
                      {quantity}
                    </span>
                    <button className="pdp-qty-btn" onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} disabled={quantity >= product.stock}>
                      <Plus style={{ width:14, height:14 }} />
                    </button>
                  </div>
                  {product.stock <= 10 && product.stock > 0 && (
                    <span style={{ fontSize:12, color:"#F08A24", fontWeight:600 }}>
                      Plus que {product.stock} pièce{product.stock > 1 ? "s" : ""} en stock
                    </span>
                  )}
                </div>
              )}

              {/* Sous-total */}
              {product.stock > 0 && quantity > 1 && (
                <div className="pdp-subtotal">
                  <span style={{ fontSize:13, color:"#667085" }}>Sous-total ({quantity} articles)</span>
                  <span style={{ fontSize:16, fontWeight:800, color:"#0A8F45" }}>{formatPrice(unitPrice * quantity)}</span>
                </div>
              )}

              {/* CTAs */}
              <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
                {product.stock > 0 ? (
                  <>
                    {whatsappUrl && (
                      <a
                        href={`${whatsappUrl}?text=${encodeURIComponent(`Bonjour, je souhaite des informations sur : ${product.name}`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="pdp-cta-outline"
                      >
                        <MessageCircle style={{ width:17, height:17 }} />
                        Discuter sur WhatsApp
                      </a>
                    )}
                    <button className="pdp-cta-primary" onClick={() => { setFormError(null); setCheckoutOpen(true); }}>
                      <ShoppingBag style={{ width:17, height:17 }} />
                      Commander sur WhatsApp
                    </button>
                  </>
                ) : (
                  <button className="pdp-cta-disabled" disabled>Produit indisponible</button>
                )}
              </div>

              {/* Avantages */}
              <div className="pdp-perks">
                <span className="pdp-perk">🚚 Livraison rapide</span>
                <span style={{ color:"#E8ECEA" }}>·</span>
                <span className="pdp-perk">🔒 Paiement sécurisé</span>
                <span style={{ color:"#E8ECEA" }}>·</span>
                <span className="pdp-perk">🔄 Retour facile</span>
              </div>
            </div>

            {/* ── COL 3 : SIDEBAR ── */}
            <div className="pdp-sidebar-col">

              {/* Carte boutique */}
              <div className="pdp-card">
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                  <div className="pdp-shop-logo">{shopInitial}</div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:15, color:"#1F2A24" }}>{shopName}</div>
                    <span style={{ fontSize:11, fontWeight:700, color:"#0A8F45", background:"#EAF7EF", padding:"2px 8px", borderRadius:20 }}>✓ Vérifié</span>
                  </div>
                </div>
                <div style={{ fontSize:13, color:"#667085", marginBottom:8 }}>📍 Yaoundé, Cameroun</div>
                <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:14 }}>
                  <Stars count={5} size={13} />
                  <span style={{ fontSize:12, fontWeight:700, color:"#1F2A24" }}>4.7 / 5</span>
                  <span style={{ fontSize:11, color:"#98A2B3" }}>(168 avis)</span>
                </div>
                <Link href={`/shop/${slug}`}
                  style={{ display:"flex", alignItems:"center", justifyContent:"center", height:36, border:"1.5px solid #0A8F45", borderRadius:10, color:"#0A8F45", fontSize:13, fontWeight:600, textDecoration:"none", marginBottom:14, transition:"all .15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#EAF7EF"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
                >
                  Voir la boutique
                </Link>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {["💬 Réponse rapide", "🏅 Membre depuis 2022", "✓ Boutique vérifiée"].map(item => (
                    <div key={item} style={{ fontSize:12, color:"#667085" }}>{item}</div>
                  ))}
                </div>
              </div>

              {/* Carte confiance */}
              <div className="pdp-card">
                <div className="pdp-card-title">Pourquoi nous faire confiance ?</div>
                {[
                  "Produits sélectionnés avec soin",
                  "Satisfait ou remboursé sous 3 jours",
                  "Livraison rapide et sécurisée",
                  "Service client réactif",
                ].map(item => (
                  <div key={item} className="pdp-check-item">
                    <div className="pdp-check-icon">✓</div>
                    {item}
                  </div>
                ))}
              </div>

              {/* Carte paiements */}
              <div className="pdp-card">
                <div className="pdp-card-title">Paiements acceptés</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {[
                    { emoji:"📱", label:"MTN Money" },
                    { emoji:"🟠", label:"Orange Money" },
                    { emoji:"💳", label:"Visa" },
                    { emoji:"💳", label:"Mastercard" },
                  ].map(p => (
                    <span key={p.label} className="pdp-payment-chip">
                      {p.emoji} {p.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Carte partage */}
              <div className="pdp-card">
                <div className="pdp-card-title">Partager</div>
                <div style={{ display:"flex", gap:8 }}>
                  {[
                    { emoji:"🔗", label:"Copier" },
                    { emoji:"💬", label:"WhatsApp" },
                    { emoji:"👤", label:"Facebook" },
                    { emoji:"✖️", label:"X" },
                  ].map(s => (
                    <button key={s.label} className="pdp-share-btn" title={s.label}>
                      {s.emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Carte avis récents */}
              <div className="pdp-card">
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                  <div className="pdp-card-title" style={{ marginBottom:0 }}>Avis récents</div>
                  <button style={{ background:"none", border:"none", color:"#0A8F45", fontSize:12, fontWeight:600, cursor:"pointer", padding:0 }}>
                    Voir tous
                  </button>
                </div>
                {SIMULATED_REVIEWS.map((rev, i) => (
                  <div key={i} style={{ paddingBottom:12, marginBottom:12, borderBottom: i < SIMULATED_REVIEWS.length - 1 ? "1px solid #F4F6F5" : "none" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                      <div className="pdp-review-avatar">{rev.initials}</div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:"#1F2A24" }}>{rev.name}</div>
                        <Stars count={rev.stars} size={11} />
                      </div>
                    </div>
                    <p style={{ margin:0, fontSize:12, color:"#667085", lineHeight:1.5 }}>{rev.text}</p>
                    <div style={{ fontSize:11, color:"#98A2B3", marginTop:4 }}>{rev.date}</div>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* ══ DESCRIPTION + AVIS ══ */}
          <div className="pdp-tabs-section">

            {/* Gauche : onglets */}
            <div className="pdp-tabs-main">
              <div className="pdp-card" style={{ padding:0, overflow:"hidden" }}>
                <div style={{ padding:"0 20px" }}>
                  <div className="pdp-tabs-nav">
                    {(["description", "caracteristiques", "avis", "faq"] as const).map(tab => {
                      const labels: Record<string, string> = {
                        description: "Description",
                        caracteristiques: "Caractéristiques",
                        avis: "Avis clients (32)",
                        faq: "Questions fréquentes",
                      };
                      return (
                        <button
                          key={tab}
                          className={`pdp-tab-btn${descTab === tab ? " active" : ""}`}
                          onClick={() => setDescTab(tab)}
                        >
                          {labels[tab]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ padding:"0 20px 20px" }}>
                  {descTab === "description" && (
                    <div>
                      <p style={{ fontSize:14, color:"#1F2A24", lineHeight:1.8, marginBottom:18 }}>
                        {product.description ?? `${product.name} est un produit de qualité supérieure, soigneusement sélectionné pour vous. Chaque détail a été pensé pour vous offrir le meilleur de l'élégance et du confort au quotidien.`}
                      </p>
                      {[
                        "Matériaux de haute qualité, durables et confortables",
                        "Design moderne, adapté aux tendances actuelles",
                        "Finitions soignées et détails raffinés",
                        "Idéal pour toutes les occasions",
                      ].map(f => (
                        <div key={f} className="pdp-feature-check">
                          <div className="pdp-feature-check-icon">✓</div>
                          {f}
                        </div>
                      ))}
                    </div>
                  )}

                  {descTab === "caracteristiques" && (
                    <table className="pdp-spec-table">
                      <tbody>
                        <tr><td>Catégorie</td><td>{product.category ?? "—"}</td></tr>
                        <tr><td>Stock disponible</td><td>{product.stock > 0 ? `${product.stock} unités` : "Rupture"}</td></tr>
                        <tr><td>Prix unitaire</td><td style={{ fontWeight:700, color:"#0A8F45" }}>{formatPrice(product.unitPrice)}</td></tr>
                        <tr><td>Référence</td><td style={{ fontFamily:"monospace", fontSize:12 }}>{product.id.slice(0, 10).toUpperCase()}</td></tr>
                        <tr><td>Boutique</td><td>{shopName}</td></tr>
                        <tr><td>Livraison</td><td>Disponible · 1 000 FCFA</td></tr>
                        <tr><td>Retours</td><td>Sous 3 jours</td></tr>
                      </tbody>
                    </table>
                  )}

                  {descTab === "avis" && (
                    <div>
                      {SIMULATED_REVIEWS.map((rev, i) => (
                        <div key={i} style={{ padding:"16px 0", borderBottom: i < SIMULATED_REVIEWS.length - 1 ? "1px solid #F4F6F5" : "none" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                            <div className="pdp-review-avatar" style={{ width:40, height:40, fontSize:14 }}>{rev.initials}</div>
                            <div>
                              <div style={{ fontWeight:700, fontSize:14, color:"#1F2A24" }}>{rev.name}</div>
                              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                <Stars count={rev.stars} size={13} />
                                <span style={{ fontSize:11, color:"#98A2B3" }}>{rev.date}</span>
                              </div>
                            </div>
                          </div>
                          <p style={{ margin:0, fontSize:14, color:"#1F2A24", lineHeight:1.7 }}>{rev.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {descTab === "faq" && (
                    <div>
                      {[
                        { q:"Les délais de livraison sont-ils garantis ?", a:"Nous nous engageons à livrer votre commande en 24h à 48h ouvrables dans Yaoundé et ses environs." },
                        { q:"Puis-je retourner un article s'il ne me convient pas ?", a:"Oui, nous acceptons les retours sous 3 jours après réception, à condition que l'article soit dans son état d'origine." },
                        { q:"Quels modes de paiement acceptez-vous ?", a:"Nous acceptons MTN Mobile Money, Orange Money, les cartes bancaires Visa/Mastercard, et le paiement à la livraison." },
                      ].map((item, i) => (
                        <div key={i} className="pdp-faq-item">
                          <div className="pdp-faq-q">❓ {item.q}</div>
                          <div className="pdp-faq-a">{item.a}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Droite : note globale */}
            <div className="pdp-tabs-aside">
              <div className="pdp-card" style={{ textAlign:"center" }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#1F2A24", marginBottom:16, textAlign:"left" }}>Note globale</div>
                <div className="pdp-rating-big">4.8</div>
                <div style={{ display:"flex", justifyContent:"center", marginBottom:6 }}>
                  <Stars count={5} size={22} />
                </div>
                <div style={{ fontSize:12, color:"#98A2B3", marginBottom:20 }}>Basé sur 32 avis</div>

                {STAR_DISTRIBUTION.map(({ star, pct }) => (
                  <div key={star} className="pdp-bar-row">
                    <span style={{ fontSize:11, color:"#667085", minWidth:16, textAlign:"right" }}>{star}</span>
                    <span style={{ fontSize:11, color:"#F7B500" }}>★</span>
                    <div className="pdp-bar-track">
                      <div className="pdp-bar-fill" style={{ width:`${pct}%` }} />
                    </div>
                    <span style={{ fontSize:11, color:"#98A2B3", minWidth:28, textAlign:"right" }}>{pct}%</span>
                  </div>
                ))}

                <button
                  style={{ marginTop:16, width:"100%", height:38, background:"#EAF7EF", border:"none", borderRadius:10, color:"#0A8F45", fontSize:13, fontWeight:600, cursor:"pointer" }}
                >
                  Voir tous les avis
                </button>
              </div>
            </div>
          </div>

          {/* ══ PRODUITS RECOMMANDÉS ══ */}
          <div className="pdp-reco-section">
            <h2 style={{ fontSize:20, fontWeight:800, color:"#1F2A24", margin:"0 0 18px" }}>Vous aimerez aussi</h2>
            <div className="pdp-reco-scroll">
              {recoProducts.length > 0 ? (
                recoProducts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/shop/${slug}/products/${p.id}`}
                    style={{ textDecoration:"none" }}
                  >
                    <div className="pdp-reco-card">
                      <div className="pdp-reco-img" style={{ backgroundImage:`url(${p.imageUrl})`, backgroundSize:"cover", backgroundPosition:"center" }}>
                        <button
                          className="pdp-reco-heart"
                          onClick={(e) => {
                            e.preventDefault();
                            const fav = { productId: p.id, name: p.name, price: p.unitPrice, imageUrl: p.imageUrl, category: p.category };
                            const stored = localStorage.getItem(`favorites-${slug}`) || "[]";
                            const favs = JSON.parse(stored);
                            const idx = favs.findIndex((f: any) => f.productId === p.id);
                            if (idx >= 0) favs.splice(idx, 1);
                            else favs.push(fav);
                            localStorage.setItem(`favorites-${slug}`, JSON.stringify(favs));
                            setFavCount(favs.length);
                          }}
                        >
                          ♡
                        </button>
                      </div>
                      <div className="pdp-reco-body">
                        <div style={{ fontSize:12, fontWeight:600, color:"#1F2A24", marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {p.name}
                        </div>
                        <div style={{ display:"flex", gap:2, marginBottom:6 }}>
                          {[1,2,3,4,5].map(s => (
                            <span key={s} style={{ fontSize:10, color:"#F7B500" }}>★</span>
                          ))}
                        </div>
                        <div style={{ fontSize:13, fontWeight:800, color:"#0A8F45", marginTop:"auto" }}>
                          {formatPrice(p.unitPrice)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div style={{ padding:"20px", color:"#98A2B3", fontSize:14 }}>
                  Aucun produit similaire trouvé
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ══ FAB WhatsApp ══ */}
      {whatsappUrl && (
        <a
          href={`${whatsappUrl}?text=${encodeURIComponent(`Bonjour, je souhaite commander : ${product.name}`)}`}
          target="_blank" rel="noopener noreferrer"
          className="pdp-fab"
        >
          💬 Commander sur WhatsApp
        </a>
      )}

      {/* ══════════════ MODAL CHECKOUT ══════════════ */}
      {checkoutOpen && (
        <div
          className="pdp-modal-overlay"
          onClick={e => { if (e.target === e.currentTarget) setCheckoutOpen(false); }}
        >
          <div className="pdp-modal">

            <div className="pdp-modal-header">
              <div>
                <div style={{ fontWeight:800, fontSize:17, color:"#1F2A24" }}>Passer commande</div>
                <div style={{ fontSize:12, color:"#98A2B3", marginTop:2 }}>{product.name}</div>
              </div>
              <button className="pdp-modal-close" onClick={() => setCheckoutOpen(false)}>
                <X style={{ width:16, height:16 }} />
              </button>
            </div>

            <form onSubmit={submitOrder} style={{ padding:"20px 24px 24px", display:"flex", flexDirection:"column", gap:16 }}>

              {/* Résumé produit */}
              <div style={{ display:"flex", gap:12, background:"#F8FAF9", borderRadius:12, padding:12, alignItems:"center" }}>
                {mainImage
                  ? <img src={mainImage} alt={product.name} style={{ width:60, height:60, borderRadius:10, objectFit:"cover", flexShrink:0 }} />
                  : <div style={{ width:60, height:60, borderRadius:10, background:"#E8ECEA", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Package style={{ width:24, height:24, color:"#C8CED6" }} />
                    </div>
                }
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:14, color:"#1F2A24", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{product.name}</div>
                  <div style={{ fontSize:12, color:"#667085", marginTop:2 }}>Quantité : {quantity}</div>
                </div>
                <div style={{ fontWeight:800, fontSize:16, color:"#0A8F45", flexShrink:0 }}>{formatPrice(unitPrice * quantity)}</div>
              </div>

              {/* Nom */}
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#1F2A24", marginBottom:6 }}>
                  Nom complet <span style={{ color:"#DC2626" }}>*</span>
                </label>
                <input
                  type="text"
                  className="pdp-input"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Ex : Jean Dupont"
                />
              </div>

              {/* Téléphone */}
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#1F2A24", marginBottom:6 }}>
                  Numéro de téléphone <span style={{ color:"#DC2626" }}>*</span>
                </label>
                <input
                  type="tel"
                  className="pdp-input"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="Ex : +237 6XX XXX XXX"
                />
              </div>

              {/* Adresse */}
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#1F2A24", marginBottom:6 }}>
                  Adresse de livraison{" "}
                  <span style={{ fontWeight:400, color:"#98A2B3" }}>optionnel</span>
                </label>
                <input
                  type="text"
                  className="pdp-input"
                  value={customerAddress}
                  onChange={e => setCustomerAddress(e.target.value)}
                  placeholder="Quartier, rue, point de repère…"
                />
              </div>

              {/* Mode de paiement */}
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#1F2A24", marginBottom:8 }}>
                  Mode de paiement
                </label>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {PAYMENT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`pdp-pay-option${paymentMethod === opt.value ? " active" : ""}`}
                      onClick={() => setPaymentMethod(opt.value)}
                    >
                      <span style={{ fontSize:20 }}>{opt.emoji}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#1F2A24", marginBottom:6 }}>
                  Note{" "}
                  <span style={{ fontWeight:400, color:"#98A2B3" }}>optionnel</span>
                </label>
                <textarea
                  className="pdp-textarea"
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                  placeholder="Instructions particulières, variante souhaitée…"
                  rows={3}
                />
              </div>

              {formError && (
                <div style={{ background:"#FFF1F2", color:"#DC2626", borderRadius:10, padding:"10px 14px", fontSize:13, fontWeight:500 }}>
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="pdp-cta-primary"
                style={{ height:50, opacity: submitting ? 0.7 : 1, cursor: submitting ? "not-allowed" : "pointer" }}
              >
                {submitting ? "Envoi en cours…" : `Confirmer la commande · ${formatPrice(unitPrice * quantity)}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════ MODAL CONFIRMATION ══════════════ */}
      {orderResult && (
        <div className="pdp-modal-overlay">
          <div className="pdp-modal" style={{ maxWidth:420, padding:"32px 28px", display:"flex", flexDirection:"column", alignItems:"center", gap:16, textAlign:"center" }}>

            <div style={{ width:72, height:72, background:"#DDF6E7", borderRadius:50, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <CheckCircle style={{ width:40, height:40, color:"#0A8F45" }} />
            </div>

            <div>
              <h2 style={{ margin:"0 0 6px", fontSize:22, fontWeight:800, color:"#1F2A24" }}>Commande confirmée !</h2>
              <p style={{ margin:0, fontSize:14, color:"#667085" }}>Votre commande a bien été enregistrée.</p>
            </div>

            <div style={{ background:"#F8FAF9", borderRadius:12, padding:"14px 20px", width:"100%", display:"flex", flexDirection:"column", gap:8 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:13, color:"#667085" }}>Référence</span>
                <span style={{ fontWeight:700, fontSize:14, color:"#1F2A24", fontFamily:"monospace" }}>
                  #{orderResult.orderId.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:13, color:"#667085" }}>Montant total</span>
                <span style={{ fontWeight:800, fontSize:16, color:"#0A8F45" }}>{formatPrice(orderResult.totalAmount)}</span>
              </div>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:10, width:"100%" }}>
              {orderResult.whatsappNumber && (
                <a
                  href={`https://wa.me/${orderResult.whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Bonjour, j'ai passé une commande #${orderResult.orderId.slice(0, 8).toUpperCase()}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ height:48, background:"#25D366", color:"#fff", borderRadius:12, fontWeight:700, fontSize:14, textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}
                >
                  <MessageCircle style={{ width:17, height:17 }} />
                  Contacter la boutique sur WhatsApp
                </a>
              )}
              <Link href={`/shop/${slug}`} onClick={() => setOrderResult(null)}
                style={{ height:48, background:"#EAF7EF", color:"#0A8F45", border:"none", borderRadius:12, fontWeight:700, fontSize:14, textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}
              >
                <ArrowLeft style={{ width:15, height:15 }} />
                Continuer mes achats
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

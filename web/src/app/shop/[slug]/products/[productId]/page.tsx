"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Search, Heart, MessageCircle,
  Package, CheckCircle, X, ChevronLeft, ChevronRight,
  ShoppingBag, Minus, Plus, Home, Share2,
  Truck, Lock, RotateCcw, Award, BadgeCheck, Star, Check, HelpCircle,
  Banknote, Landmark, Smartphone, CreditCard,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductVariant = {
  id: string;
  label: string;
  stock: number;
  priceOverride: string | null;
};

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
  hasVariants?: boolean;
  variants?: ProductVariant[];
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

const MM_IMG_URL = "https://res.cloudinary.com/dngaowjt8/image/upload/v1779488827/MM_uvauci.jpg";

const PAYMENT_OPTIONS = [
  { value: "cod",           Icon: Truck,      label: "Paiement à la livraison" },
  { value: "mobile_money",  Icon: Smartphone, label: "Mobile Money" },
  { value: "bank_transfer", Icon: Landmark,   label: "Virement bancaire" },
  { value: "cash",          Icon: Banknote,   label: "Espèces" },
] as const;

const SIMULATED_REVIEWS = [
  { initials: "AM", name: "Aïcha M.", stars: 5, text: "Magnifique produit, qualité irréprochable !", date: "Il y a 2 jours" },
  { initials: "FK", name: "Fatou K.", stars: 5, text: "Très bien, conforme à la description.", date: "Il y a 1 semaine" },
];

const STAR_DISTRIBUTION = [
  { star: 5, pct: 78 }, { star: 4, pct: 15 },
  { star: 3, pct: 5 },  { star: 2, pct: 1 }, { star: 1, pct: 1 },
];

// ─── CSS ─────────────────────────────────────────────────────────────────────

const CSS = `
  *, *::before, *::after { box-sizing: border-box; }

  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes fadeUp  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideUp { from { opacity:0; transform:translateY(100%); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn  { to { opacity:1; } }

  /* ── Header ─────────────────────────────────────────────────────── */
  .pdp-header {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    background: #fff; border-bottom: 1px solid #E8ECEA;
    height: 64px; transition: height .2s ease, box-shadow .2s ease;
  }
  .pdp-header.compact { height: 52px; box-shadow: 0 2px 16px rgba(0,0,0,.08); }
  .pdp-header-inner {
    max-width: 1400px; margin: 0 auto; padding: 0 24px;
    height: 100%; display: flex; align-items: center; gap: 14px;
  }
  .pdp-logo { display: flex; align-items: center; gap: 8px; flex-shrink: 0; text-decoration: none; }
  .pdp-logo-icon {
    width: 34px; height: 34px; background: #0A8F45; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
  }
  .pdp-logo-name { font-weight: 800; font-size: 16px; color: #1F2A24; }
  .pdp-search-bar {
    flex: 1; max-width: 540px; position: relative; display: flex; align-items: center;
  }
  .pdp-search-input {
    width: 100%; height: 38px; padding: 0 14px 0 40px;
    border: 1.5px solid #E8ECEA; border-radius: 10px;
    font-size: 13px; color: #1F2A24; background: #F8FAF9; outline: none;
    transition: border-color .15s, background .15s;
  }
  .pdp-search-input:focus { border-color: #0A8F45; background: #fff; }
  .pdp-search-input::placeholder { color: #98A2B3; }
  .pdp-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #98A2B3; pointer-events: none; }
  .pdp-header-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; flex-shrink: 0; }
  .pdp-icon-btn {
    position: relative; width: 38px; height: 38px; border-radius: 10px;
    border: none; display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: background .15s; text-decoration: none; flex-shrink: 0;
  }
  .pdp-icon-btn-outline { background: #fff; border: 1.5px solid #E8ECEA; color: #667085; }
  .pdp-icon-btn-outline:hover { border-color: #0A8F45; color: #0A8F45; background: #F6FFF9; }
  .pdp-icon-btn-green { background: #0A8F45; color: #fff; }
  .pdp-icon-btn-green:hover { background: #08763A; }
  .pdp-icon-btn-red { background: #EF4444; color: #fff; }
  .pdp-icon-btn-red:hover { background: #DC2626; }
  .pdp-badge {
    position: absolute; top: -5px; right: -5px; min-width: 18px; height: 18px;
    background: #1F2A24; color: #fff; font-size: 10px; font-weight: 800;
    border-radius: 9px; display: flex; align-items: center; justify-content: center; padding: 0 4px;
  }
  .pdp-contact-btn {
    display: flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px;
    background: #EAF7EF; color: #0A8F45; border-radius: 8px; font-weight: 600;
    font-size: 12px; text-decoration: none; border: 1.5px solid #C3EDD7;
    white-space: nowrap; transition: background .15s; flex-shrink: 0;
  }
  .pdp-contact-btn:hover { background: #D7F4E7; }
  .pdp-btn-shop {
    display: flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px;
    background: #1F2A24; color: #fff; border-radius: 8px; font-weight: 600;
    font-size: 12px; text-decoration: none; white-space: nowrap;
    transition: background .15s; flex-shrink: 0;
  }
  .pdp-btn-shop:hover { background: #111A14; }

  /* ── Layout ──────────────────────────────────────────────────────── */
  .pdp-main {
    max-width: 1400px; margin: 0 auto;
    padding: 80px 24px 120px;
  }

  /* ── Breadcrumb ──────────────────────────────────────────────────── */
  .pdp-breadcrumb {
    display: flex; align-items: center; gap: 7px;
    font-size: 12px; color: #98A2B3; margin-bottom: 22px;
    overflow: hidden; min-width: 0;
  }
  .pdp-breadcrumb-back {
    display: inline-flex; align-items: center; gap: 4px;
    color: #667085; text-decoration: none; white-space: nowrap;
    transition: color .15s; flex-shrink: 0;
  }
  .pdp-breadcrumb-back:hover { color: #0A8F45; }
  .pdp-breadcrumb a { color: #667085; text-decoration: none; white-space: nowrap; flex-shrink: 0; transition: color .15s; }
  .pdp-breadcrumb a:hover { color: #0A8F45; }
  .pdp-breadcrumb-sep { color: #D0D5DD; font-size: 10px; flex-shrink: 0; }
  .pdp-breadcrumb-current {
    color: #1F2A24; font-weight: 500;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0;
  }

  /* ── 3-col grid ──────────────────────────────────────────────────── */
  .pdp-grid { display: grid; grid-template-columns: 460px 1fr 300px; gap: 24px; align-items: start; }

  /* ── Gallery ─────────────────────────────────────────────────────── */
  .pdp-gallery-main {
    width: 100%; aspect-ratio: 1; border-radius: 16px;
    overflow: hidden; border: 1px solid #E8ECEA; background: #F8FAF9;
    position: relative; box-shadow: 0 4px 20px rgba(16,24,40,.06);
  }
  .pdp-gallery-img {
    width: 100%; height: 100%; object-fit: cover;
    transition: transform .4s ease; display: block;
  }
  .pdp-gallery-main:hover .pdp-gallery-img { transform: scale(1.03); }
  .pdp-stock-badge {
    position: absolute; top: 14px; left: 14px;
    padding: 4px 12px; border-radius: 8px; font-size: 12px; font-weight: 700;
  }
  .pdp-heart-btn {
    position: absolute; top: 12px; right: 12px; width: 38px; height: 38px;
    background: #fff; border: 1.5px solid #E8ECEA; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,.1); transition: all .15s;
  }
  .pdp-heart-btn:hover { border-color: #EF4444; transform: scale(1.08); }
  .pdp-arrow-btn {
    position: absolute; top: 50%; transform: translateY(-50%);
    width: 36px; height: 36px; background: rgba(255,255,255,.92);
    border: 1px solid #E8ECEA; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #1F2A24; transition: all .15s;
    box-shadow: 0 2px 8px rgba(0,0,0,.1);
  }
  .pdp-arrow-btn:hover { background: #fff; border-color: #0A8F45; color: #0A8F45; }
  .pdp-arrow-left  { left: 12px; }
  .pdp-arrow-right { right: 12px; }
  .pdp-dots {
    display: flex; gap: 6px; justify-content: center; margin-top: 10px;
  }
  .pdp-dot {
    width: 6px; height: 6px; border-radius: 50%; background: #E8ECEA;
    border: none; padding: 0; cursor: pointer; transition: background .15s;
  }
  .pdp-dot.active { background: #0A8F45; width: 18px; border-radius: 3px; }
  .pdp-thumbs { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
  .pdp-thumb {
    width: 68px; height: 68px; border-radius: 10px;
    border: 2px solid #E8ECEA; overflow: hidden; cursor: pointer;
    padding: 0; background: #fff; flex-shrink: 0; transition: border-color .15s;
  }
  .pdp-thumb.active { border-color: #0A8F45; box-shadow: 0 0 0 2px rgba(10,143,69,.18); }
  .pdp-thumb:hover { border-color: #0A8F45; }

  /* ── Info column ─────────────────────────────────────────────────── */
  .pdp-verified-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 12px; background: #EAF7EF; color: #0A8F45;
    border-radius: 20px; font-size: 11px; font-weight: 700; margin-bottom: 12px;
  }
  .pdp-title { margin: 0 0 12px; font-size: 24px; font-weight: 800; color: #1F2A24; line-height: 1.25; }
  .pdp-stars-row { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
  .pdp-price { font-size: 34px; font-weight: 800; color: #0A8F45; line-height: 1; }
  .pdp-price-wrap { margin-bottom: 18px; }
  .pdp-price-from { font-size: 12px; color: #98A2B3; font-weight: 500; margin-bottom: 3px; }
  @keyframes priceFlash { 0% { opacity:.5; transform:scale(.96); } 100% { opacity:1; transform:scale(1); } }
  .pdp-price { animation: priceFlash .22s ease; }
  .pdp-price-diff {
    display: inline-flex; align-items: center; margin-left: 10px;
    padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; vertical-align: middle;
  }
  .pdp-price-diff-up   { background: #FFF1E5; color: #F08A24; }
  .pdp-price-diff-down { background: #DDF6E7; color: #0A8F45; }
  .pdp-desc-box {
    background: #F8FAF9; border-radius: 12px; padding: 13px 15px; margin-bottom: 18px;
  }
  .pdp-desc-lbl {
    font-size: 10px; font-weight: 700; color: #98A2B3;
    text-transform: uppercase; letter-spacing: .07em; margin-bottom: 6px;
  }
  .pdp-desc-text {
    margin: 0; font-size: 14px; color: #1F2A24; line-height: 1.7;
    overflow: hidden;
  }
  .pdp-desc-text.clamped {
    display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical;
  }
  .pdp-desc-toggle {
    display: inline-flex; align-items: center; gap: 3px;
    margin-top: 7px; background: none; border: none; padding: 0;
    font-size: 12px; font-weight: 700; color: #0A8F45; cursor: pointer;
    transition: opacity .15s;
  }
  .pdp-desc-toggle:hover { opacity: .75; }
  .pdp-size-btn {
    min-height: 36px; height: auto; min-width: 52px; padding: 6px 14px;
    border: 1.5px solid #E8ECEA; border-radius: 8px;
    background: #fff; color: #1F2A24; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all .15s;
    display: flex; flex-direction: column; align-items: center; gap: 2px; line-height: 1.3;
  }
  .pdp-size-btn.active { background: #0A8F45; color: #fff; border-color: #0A8F45; }
  .pdp-size-btn:not(.active):hover { border-color: #0A8F45; color: #0A8F45; }
  .pdp-size-btn-price { font-size: 10px; font-weight: 700; opacity: .8; white-space: nowrap; }
  .pdp-qty-row {
    display: flex; align-items: center; border: 1.5px solid #E8ECEA;
    border-radius: 10px; overflow: hidden; height: 44px;
  }
  .pdp-qty-btn {
    width: 44px; height: 100%; border: none; background: #F8FAF9;
    cursor: pointer; color: #1F2A24; display: flex; align-items: center;
    justify-content: center; transition: background .15s;
  }
  .pdp-qty-btn:hover:not(:disabled) { background: #EAF7EF; color: #0A8F45; }
  .pdp-qty-btn:disabled { opacity: .35; cursor: default; }
  .pdp-subtotal {
    display: flex; justify-content: space-between; align-items: center;
    background: #EAF7EF; border-radius: 10px; padding: 11px 16px; margin-bottom: 16px;
  }
  /* CTAs */
  .pdp-cta-primary {
    width: 100%; height: 50px; background: #0A8F45; color: #fff;
    border: none; border-radius: 12px; font-size: 14px; font-weight: 700;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    gap: 8px; transition: background .15s; box-shadow: 0 4px 14px rgba(10,143,69,.25);
  }
  .pdp-cta-primary:hover { background: #08763A; }
  .pdp-cta-primary:disabled { opacity: .5; cursor: not-allowed; box-shadow: none; }
  .pdp-cta-outline {
    width: 100%; height: 50px; background: #fff; color: #1F2A24;
    border: 2px solid #E8ECEA; border-radius: 12px; font-size: 14px; font-weight: 700;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    gap: 8px; transition: all .15s; text-decoration: none;
  }
  .pdp-cta-outline:hover { border-color: #0A8F45; color: #0A8F45; background: #F6FFF9; }
  .pdp-cta-wa {
    width: 100%; height: 50px; background: #25D366; color: #fff;
    border: none; border-radius: 12px; font-size: 14px; font-weight: 700;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    gap: 8px; transition: background .15s; text-decoration: none;
  }
  .pdp-cta-wa:hover { background: #38be74; }
  .pdp-cta-disabled {
    width: 100%; height: 50px; background: #F0F2F1; color: #A0ABA8;
    border: none; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: not-allowed;
  }
  .pdp-perks {
    display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
    margin-top: 14px; font-size: 12px; color: #667085;
  }
  .pdp-perk { display: flex; align-items: center; gap: 5px; }

  /* ── Sidebar cards ───────────────────────────────────────────────── */
  .pdp-card {
    background: #fff; border: 1px solid #E8ECEA; border-radius: 16px; padding: 18px;
  }
  .pdp-card + .pdp-card { margin-top: 12px; }
  .pdp-card-title { font-size: 13px; font-weight: 700; color: #1F2A24; margin-bottom: 12px; }
  .pdp-shop-logo {
    width: 48px; height: 48px; border-radius: 50%; background: #0A8F45;
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-size: 20px; font-weight: 800; flex-shrink: 0;
  }
  .pdp-check-item {
    display: flex; align-items: flex-start; gap: 8px;
    font-size: 13px; color: #1F2A24; margin-bottom: 8px;
  }
  .pdp-check-icon {
    width: 18px; height: 18px; background: #EAF7EF; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; margin-top: 1px; font-size: 10px; color: #0A8F45; font-weight: 800;
  }
  .pdp-payment-chip {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 5px 10px; background: #F8FAF9; border: 1px solid #E8ECEA;
    border-radius: 8px; font-size: 12px; font-weight: 600; color: #1F2A24;
  }
  .pdp-share-icon-btn {
    width: 36px; height: 36px; border-radius: 10px; border: 1.5px solid #E8ECEA;
    background: #fff; display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all .15s; color: #667085; flex-shrink: 0;
  }
  .pdp-share-icon-btn:hover { border-color: #0A8F45; color: #0A8F45; background: #F6FFF9; }
  .pdp-share-wa {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
    padding: 10px 14px; border-radius: 10px; border: none;
    background: #25D366; color: #fff; font-size: 13px; font-weight: 700;
    cursor: pointer; text-decoration: none; transition: background .15s;
  }
  .pdp-share-wa:hover { background: #38be74; }
  .pdp-share-copy {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
    padding: 10px 14px; border-radius: 10px; border: 1.5px solid #E8ECEA;
    background: #fff; color: #1F2A24; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all .15s;
  }
  .pdp-share-copy:hover { border-color: #0A8F45; color: #0A8F45; background: #F6FFF9; }
  .pdp-share-native {
    width: 100%; display: flex; align-items: center; justify-content: center; gap: 7px;
    padding: 10px 14px; border-radius: 10px; border: 1.5px solid #0A8F45;
    background: #F6FFF9; color: #0A8F45; font-size: 13px; font-weight: 700;
    cursor: pointer; transition: all .15s; margin-top: 8px;
  }
  .pdp-share-native:hover { background: #0A8F45; color: #fff; }
  .pdp-review-avatar {
    width: 34px; height: 34px; border-radius: 50%; background: #EAF7EF;
    color: #0A8F45; font-size: 12px; font-weight: 700;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }

  /* ── Tabs ────────────────────────────────────────────────────────── */
  .pdp-tabs-section { display: flex; gap: 20px; margin-top: 24px; align-items: flex-start; }
  .pdp-tabs-main { flex: 1; min-width: 0; }
  .pdp-tabs-aside { width: 340px; flex-shrink: 0; }
  .pdp-tabs-nav {
    display: flex; border-bottom: 2px solid #E8ECEA; margin-bottom: 20px; overflow-x: auto;
    scrollbar-width: none;
  }
  .pdp-tabs-nav::-webkit-scrollbar { display: none; }
  .pdp-tab-btn {
    padding: 10px 16px; background: none; border: none;
    border-bottom: 2px solid transparent; margin-bottom: -2px;
    font-size: 13px; font-weight: 600; color: #667085;
    cursor: pointer; transition: all .15s; white-space: nowrap;
  }
  .pdp-tab-btn.active { color: #0A8F45; border-bottom-color: #0A8F45; }
  .pdp-tab-btn:hover:not(.active) { color: #1F2A24; }
  .pdp-spec-table { width: 100%; border-collapse: collapse; }
  .pdp-spec-table tr { border-bottom: 1px solid #F4F6F5; }
  .pdp-spec-table tr:last-child { border-bottom: none; }
  .pdp-spec-table td { padding: 10px 12px; font-size: 13px; color: #1F2A24; background: #fff; }
  .pdp-spec-table td:first-child { color: #667085; font-weight: 600; width: 40%; background: #F8FAF9; }
  .pdp-faq-q { display: flex; align-items: center; gap: 7px; font-size: 14px; font-weight: 700; color: #1F2A24; margin-bottom: 5px; }
  .pdp-faq-a { font-size: 13px; color: #667085; line-height: 1.6; margin-bottom: 16px; }
  .pdp-bar-row { display: flex; align-items: center; gap: 8px; margin-bottom: 7px; }
  .pdp-bar-track { flex: 1; height: 7px; background: #F4F6F5; border-radius: 4px; overflow: hidden; }
  .pdp-bar-fill { height: 100%; background: #0A8F45; border-radius: 4px; }

  /* ── "Vous aimerez aussi" ────────────────────────────────────────── */
  .pdp-reco-section { margin-top: 36px; }
  .pdp-reco-grid {
    display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px;
    overflow-x: auto; scrollbar-width: none;
  }
  .pdp-reco-grid::-webkit-scrollbar { display: none; }
  .pdp-reco-card {
    background: #fff; border: 1px solid #E8ECEA; border-radius: 14px;
    overflow: hidden; transition: box-shadow .15s, transform .15s;
    text-decoration: none; display: block; min-width: 0;
  }
  .pdp-reco-card:hover { box-shadow: 0 6px 24px rgba(16,24,40,.09); transform: translateY(-2px); }
  .pdp-reco-img-wrap { position: relative; padding-bottom: 75%; background: #F8FAF9; overflow: hidden; }
  .pdp-reco-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .3s; }
  .pdp-reco-card:hover .pdp-reco-img { transform: scale(1.05); }
  .pdp-reco-placeholder {
    position: absolute; inset: 0; display: flex; align-items: center;
    justify-content: center; font-size: 36px;
  }
  .pdp-reco-body { padding: 10px 12px 12px; }
  .pdp-reco-name {
    font-size: 12px; font-weight: 700; color: #1F2A24;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 4px;
  }
  .pdp-reco-price { font-size: 13px; font-weight: 800; color: #0A8F45; }

  /* ── Sticky bottom bar ───────────────────────────────────────────── */
  .pdp-sticky-bar {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 200;
    background: #fff; border-top: 1px solid #E8ECEA;
    padding: 10px 24px; display: flex; align-items: center; gap: 12px;
    box-shadow: 0 -6px 28px rgba(0,0,0,.1);
    animation: slideUp .2s ease;
  }
  .pdp-sticky-thumb {
    width: 50px; height: 50px; border-radius: 10px;
    object-fit: cover; flex-shrink: 0; border: 1px solid #E8ECEA;
  }
  .pdp-sticky-thumb-ph {
    width: 50px; height: 50px; border-radius: 10px; flex-shrink: 0;
    background: #F8FAF9; border: 1px solid #E8ECEA;
    display: flex; align-items: center; justify-content: center;
  }
  .pdp-sticky-info { flex: 1; min-width: 0; }
  .pdp-sticky-name {
    font-size: 13px; font-weight: 700; color: #1F2A24;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .pdp-sticky-price { font-size: 15px; font-weight: 800; color: #0A8F45; margin-top: 2px; }
  .pdp-sticky-qty { font-size: 11px; font-weight: 500; color: #98A2B3; margin-left: 5px; }
  .pdp-sticky-actions { display: flex; gap: 10px; flex-shrink: 0; }
  .pdp-sticky-add {
    height: 42px; padding: 0 20px; background: #0A8F45; color: #fff;
    border: none; border-radius: 10px; font-size: 13px; font-weight: 700;
    cursor: pointer; white-space: nowrap; transition: background .15s;
    display: flex; align-items: center; gap: 7px;
  }
  .pdp-sticky-add:hover { background: #08763A; }
  .pdp-sticky-order {
    height: 42px; padding: 0 20px; background: #fff; color: #1F2A24;
    border: 1.5px solid #E8ECEA; border-radius: 10px; font-size: 13px; font-weight: 700;
    cursor: pointer; white-space: nowrap; transition: all .15s;
  }
  .pdp-sticky-order:hover { border-color: #0A8F45; color: #0A8F45; }

  /* ── Toast ───────────────────────────────────────────────────────── */
  .pdp-toast {
    position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
    z-index: 9999; background: #1F2A24; color: #fff;
    padding: 11px 22px; border-radius: 12px; font-weight: 600; font-size: 14px;
    box-shadow: 0 4px 20px rgba(0,0,0,.22); white-space: nowrap;
    animation: fadeUp .2s ease;
  }
  @keyframes cartToastIn {
    from { opacity: 0; transform: translateY(-12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .pdp-cart-toast {
    position: fixed; top: 76px; right: 20px; z-index: 9999;
    background: #fff; border: 1px solid #E8ECEA; border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0,0,0,.15);
    padding: 12px 14px; display: flex; flex-direction: column; gap: 10px;
    width: 300px; animation: cartToastIn .28s ease;
  }
  .pdp-cart-toast-body { display: flex; align-items: center; gap: 11px; }
  .pdp-cart-toast-img {
    width: 52px; height: 52px; border-radius: 10px;
    object-fit: cover; flex-shrink: 0; border: 1px solid #E8ECEA;
  }
  .pdp-cart-toast-ph {
    width: 52px; height: 52px; border-radius: 10px; flex-shrink: 0;
    background: #F8FAF9; border: 1px solid #E8ECEA;
    display: flex; align-items: center; justify-content: center;
  }
  .pdp-cart-toast-close {
    position: absolute; top: 10px; right: 10px;
    background: none; border: none; cursor: pointer;
    color: #98A2B3; padding: 2px; line-height: 1;
    display: flex; align-items: center; transition: color .15s;
  }
  .pdp-cart-toast-close:hover { color: #1F2A24; }
  .pdp-cart-toast-cta {
    display: flex; align-items: center; justify-content: center;
    height: 36px; background: #0A8F45; color: #fff; border-radius: 9px;
    font-size: 13px; font-weight: 700; text-decoration: none;
    transition: background .15s;
  }
  .pdp-cart-toast-cta:hover { background: #08763A; }
  @media (max-width: 768px) {
    .pdp-cart-toast { top: auto; bottom: 80px; right: 12px; left: 12px; width: auto; }
  }

  /* ── Modal ───────────────────────────────────────────────────────── */
  .pdp-overlay {
    position: fixed; inset: 0; z-index: 500; background: rgba(0,0,0,.5);
    display: flex; align-items: center; justify-content: center; padding: 16px;
    opacity: 0; animation: fadeIn .15s ease forwards;
  }
  .pdp-modal {
    background: #fff; border-radius: 20px; width: 100%; max-width: 480px;
    max-height: 92vh; overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0,0,0,.2); animation: fadeUp .18s ease;
  }
  .pdp-modal-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 24px 16px; border-bottom: 1px solid #E8ECEA;
    position: sticky; top: 0; background: #fff; z-index: 1;
  }
  .pdp-modal-close {
    background: none; border: 1.5px solid #E8ECEA; border-radius: 8px;
    width: 32px; height: 32px; cursor: pointer; color: #667085;
    display: flex; align-items: center; justify-content: center;
  }
  .pdp-input {
    width: 100%; height: 42px; border: 1.5px solid #E8ECEA; border-radius: 10px;
    padding: 0 12px; font-size: 14px; color: #1F2A24; outline: none;
    transition: border-color .15s;
  }
  .pdp-input:focus { border-color: #0A8F45; }
  .pdp-textarea {
    width: 100%; border: 1.5px solid #E8ECEA; border-radius: 10px;
    padding: 10px 12px; font-size: 13px; color: #1F2A24; outline: none;
    resize: vertical; font-family: inherit; transition: border-color .15s;
  }
  .pdp-textarea:focus { border-color: #0A8F45; }
  .pdp-pay-opt {
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    padding: 10px 8px; border-radius: 10px; border: 1.5px solid #E8ECEA;
    background: #fff; cursor: pointer; font-size: 12px; font-weight: 500;
    color: #667085; transition: all .15s;
  }
  .pdp-pay-opt.active { border-color: #0A8F45; background: #EAF7EF; font-weight: 700; color: #0A8F45; }

  /* ── Lightbox ────────────────────────────────────────────────────── */
  @keyframes lbIn    { from { opacity: 0 } to { opacity: 1 } }
  @keyframes lbImgIn { from { transform: scale(.94) } to { transform: scale(1) } }
  .pdp-lightbox {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(0,0,0,.92); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    animation: lbIn .18s ease;
  }
  .pdp-lb-img {
    max-width: min(90vw, 900px); max-height: 85vh;
    object-fit: contain; border-radius: 8px;
    user-select: none; touch-action: pinch-zoom;
    animation: lbImgIn .2s ease;
  }
  .pdp-lb-close {
    position: absolute; top: 16px; right: 16px;
    width: 40px; height: 40px; border-radius: 50%;
    background: rgba(255,255,255,.12); border: 1.5px solid rgba(255,255,255,.22);
    color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: background .15s;
  }
  .pdp-lb-close:hover { background: rgba(255,255,255,.24); }
  .pdp-lb-arrow {
    position: absolute; top: 50%; transform: translateY(-50%);
    width: 44px; height: 44px; border-radius: 50%;
    background: rgba(255,255,255,.12); border: 1.5px solid rgba(255,255,255,.22);
    color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: background .15s;
  }
  .pdp-lb-arrow:hover { background: rgba(255,255,255,.26); }
  .pdp-lb-prev { left: 16px; }
  .pdp-lb-next { right: 16px; }
  .pdp-lb-dots {
    position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
    display: flex; gap: 7px;
  }
  .pdp-lb-dot {
    width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,.35);
    border: none; cursor: pointer; transition: background .15s; padding: 0;
  }
  .pdp-lb-dot.active { background: #fff; width: 20px; border-radius: 4px; }
  .pdp-gallery-img { cursor: zoom-in; }

  /* ── Bottom nav (mobile only) ────────────────────────────────────── */
  .pdp-bottom-nav {
    display: none; position: fixed; bottom: 0; left: 0; right: 0; z-index: 200;
    background: #fff; border-top: 1px solid #E8ECEA; height: 60px;
    align-items: stretch; box-shadow: 0 -4px 24px rgba(0,0,0,.06);
  }
  .pdp-bnav-item {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 3px; background: none; border: none;
    cursor: pointer; color: #98A2B3; font-size: 10px; font-weight: 600;
    text-decoration: none; transition: color .15s; padding: 0;
  }
  .pdp-bnav-item:hover { color: #0A8F45; }

  /* ── Responsive ──────────────────────────────────────────────────── */
  @media (max-width: 1200px) {
    .pdp-grid { grid-template-columns: 420px 1fr; }
    .pdp-sidebar { display: none; }
    .pdp-tabs-aside { width: 300px; }
    .pdp-reco-grid { grid-template-columns: repeat(4, 1fr); }
  }
  @media (max-width: 960px) {
    .pdp-grid { grid-template-columns: 1fr; }
    .pdp-tabs-section { flex-direction: column; }
    .pdp-tabs-aside { width: 100%; }
    .pdp-reco-grid { grid-template-columns: repeat(3, 1fr); }
  }
  @media (max-width: 768px) {
    .pdp-main { padding: 70px 16px 80px; }
    .pdp-header-inner { padding: 0 16px; }
    .pdp-logo-name { display: none; }
    .pdp-contact-btn { display: none; }
    .pdp-search-bar { max-width: 100%; }
    .pdp-reco-grid { grid-template-columns: repeat(2, 1fr); }
    .pdp-sticky-bar { padding: 10px 16px; bottom: 60px; gap: 10px; }
    .pdp-sticky-thumb, .pdp-sticky-thumb-ph { width: 42px; height: 42px; border-radius: 8px; }
    .pdp-bottom-nav { display: flex; }
    .pdp-toast { bottom: 140px; }
  }
  @media (max-width: 480px) {
    .pdp-title { font-size: 20px; }
    .pdp-price { font-size: 28px; }
    .pdp-sticky-order { display: none; }
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(value: string | number): string {
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return "0";
  return `${new Intl.NumberFormat("fr-FR").format(num)} FCFA`;
}

function stockBadge(stock: number): { label: string; bg: string; color: string } {
  if (stock <= 0) return { label: "Rupture de stock",        bg: "#FFF1F2", color: "#DC2626" };
  if (stock <= 5) return { label: `Plus que ${stock} en stock`, bg: "#FFF1E5", color: "#F08A24" };
  return { label: "En stock", bg: "#DDF6E7", color: "#0A8F45" };
}

function Stars({ count = 5, size = 14 }: { count?: number; size?: number }) {
  return (
    <span style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size} strokeWidth={0} fill={i <= count ? "#F7B500" : "#E8ECEA"} />
      ))}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const params      = useParams<{ slug: string; productId: string }>();
  const slug        = params?.slug      ?? "";
  const productId   = params?.productId ?? "";

  const [product,  setProduct]  = useState<Product | null>(null);
  const [shop,     setShop]     = useState<Shop | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [quantity,      setQuantity]      = useState(1);
  const [toast,         setToast]         = useState<string | null>(null);
  const [cartToast,     setCartToast]     = useState<{ name: string; price: number; imageUrl: string | null; qty: number } | null>(null);

  const [checkoutOpen,    setCheckoutOpen]    = useState(false);
  const [customerName,    setCustomerName]    = useState("");
  const [customerPhone,   setCustomerPhone]   = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod,   setPaymentMethod]   = useState<"cash"|"mobile_money"|"bank_transfer"|"cod">("cod");
  const [orderNotes,      setOrderNotes]      = useState("");
  const [submitting,      setSubmitting]      = useState(false);
  const [formError,       setFormError]       = useState<string | null>(null);
  const [orderResult,     setOrderResult]     = useState<OrderResult | null>(null);

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [descTab,           setDescTab]           = useState<"description"|"caracteristiques"|"avis"|"faq">("description");
  const [descExpanded,      setDescExpanded]      = useState(false);
  const [descOverflows,     setDescOverflows]     = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);
  const [cartCount,         setCartCount]         = useState(0);
  const [favCount,          setFavCount]          = useState(0);
  const [favorited,         setFavorited]         = useState(false);
  const [recoProducts,      setRecoProducts]      = useState<Product[]>([]);
  const [headerCompact,     setHeaderCompact]     = useState(false);
  const [stickyBar,         setStickyBar]         = useState(false);
  const [canNativeShare,    setCanNativeShare]     = useState(false);
  const [lightboxOpen,      setLightboxOpen]       = useState(false);
  const [lightboxIdx,       setLightboxIdx]        = useState(0);

  const ctaRef            = useRef<HTMLDivElement>(null);
  const galleryLengthRef  = useRef(0);
  const lbTouchStartX     = useRef<number | null>(null);

  // ── Data loading ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!slug || !productId) return;
    (async () => {
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
    })();
  }, [slug, productId]);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/public/shop/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setShop(d?.data ?? d); })
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (!product || !slug) return;
    (async () => {
      try {
        const q = product.category ? `category=${encodeURIComponent(product.category)}&` : "";
        const res = await fetch(`/api/public/shop/${slug}/products?${q}limit=10`);
        if (!res.ok) return;
        const json = await res.json();
        setRecoProducts((json?.data ?? []).filter((p: Product) => p.id !== product.id).slice(0, 8));
      } catch { /* ignore */ }
    })();
  }, [product, slug]);

  useEffect(() => { setCanNativeShare(!!navigator.share); }, []);

  // ── Scroll effects ──────────────────────────────────────────────────────────

  useEffect(() => {
    const onScroll = () => setHeaderCompact(window.scrollY > 48);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setStickyBar(!e.isIntersecting), { threshold: 0 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [product]);

  useEffect(() => {
    if (!descRef.current || descExpanded) return;
    setDescOverflows(descRef.current.scrollHeight > descRef.current.clientHeight + 2);
  }, [product, descExpanded]);

  // ── Side effects ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!cartToast) return;
    const t = setTimeout(() => setCartToast(null), 3500);
    return () => clearTimeout(t);
  }, [cartToast]);

  useEffect(() => {
    if (!slug) return;
    try {
      const s = localStorage.getItem(`cart-${slug}`);
      if (s) setCartCount((JSON.parse(s) as CartItem[]).reduce((sum, i) => sum + i.quantity, 0));
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

  useEffect(() => {
    document.body.style.overflow = lightboxOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightboxOpen]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const n = galleryLengthRef.current || 1;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape")      setLightboxOpen(false);
      if (e.key === "ArrowLeft")   setLightboxIdx(i => (i - 1 + n) % n);
      if (e.key === "ArrowRight")  setLightboxIdx(i => (i + 1) % n);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightboxOpen]);

  // ── Actions ─────────────────────────────────────────────────────────────────

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
      setToast("Ajouté aux favoris");
    }
    try { localStorage.setItem(key, JSON.stringify(favs)); } catch { /* ignore */ }
    setFavCount(favs.length);
  }

  function addToCart() {
    if (!product || activeStock <= 0) return;
    const key = `cart-${slug}`;
    let cart: CartItem[] = [];
    try { const s = localStorage.getItem(key); if (s) cart = JSON.parse(s); } catch { cart = []; }
    const existing = cart.find(i => i.productId === product.id);
    if (existing) { existing.quantity = Math.min(existing.quantity + quantity, activeStock); }
    else { cart.push({ productId: product.id, name: product.name, price: Number(product.unitPrice), imageUrl: product.imageUrl ?? null, quantity }); }
    try { localStorage.setItem(key, JSON.stringify(cart)); } catch { /* ignore */ }
    const newCount = cart.reduce((s, i) => s + i.quantity, 0);
    setCartCount(newCount);
    setCartToast({ name: product.name, price: Number(product.unitPrice), imageUrl: product.imageUrl ?? null, qty: quantity });
  }

  function shareProduct() {
    const url  = window.location.href;
    const text = product ? `${product.name} · ${formatPrice(unitPrice)}` : "";
    if (navigator.share) {
      navigator.share({ title: product?.name, text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => setToast("Lien copié !")).catch(() => {});
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href)
      .then(() => setToast("Lien copié dans le presse-papier !"))
      .catch(() => setToast("Impossible de copier le lien"));
  }

  async function submitOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    setFormError(null);
    if (!customerName.trim())  { setFormError("Le nom complet est requis."); return; }
    if (!customerPhone.trim()) { setFormError("Le numéro de téléphone est requis."); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/shop/${slug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName:    customerName.trim(),
          customerPhone:   customerPhone.trim(),
          customerAddress: customerAddress.trim() || undefined,
          paymentMethod,
          notes: orderNotes.trim() || undefined,
          items: [{ productId: product.id, variantId: selectedVariantId ?? undefined, quantity }],
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

  // ── Loading / error ──────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#F8FAF9", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <style>{CSS}</style>
      <div style={{ width: 44, height: 44, border: "4px solid #E8ECEA", borderTopColor: "#0A8F45", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      <p style={{ color: "#667085", fontSize: 14, margin: 0 }}>Chargement…</p>
    </div>
  );

  if (error || !product) return (
    <div style={{ minHeight: "100vh", background: "#F8FAF9", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, padding: 24 }}>
      <style>{CSS}</style>
      <div style={{ width: 72, height: 72, background: "#EAF7EF", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Package style={{ width: 36, height: 36, color: "#0A8F45" }} />
      </div>
      <p style={{ fontWeight: 700, fontSize: 16, color: "#1F2A24", margin: 0 }}>Produit introuvable</p>
      <p style={{ fontSize: 14, color: "#667085", margin: 0 }}>{error ?? "Ce produit n'est plus disponible."}</p>
      <Link href={`/shop/${slug}`} style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, height: 38, padding: "0 16px", border: "1.5px solid #E8ECEA", borderRadius: 10, color: "#667085", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
        <ArrowLeft style={{ width: 14, height: 14 }} /> Retour à la boutique
      </Link>
    </div>
  );

  // ── Derived data ─────────────────────────────────────────────────────────────

  const shopName        = product.shopName ?? shop?.name ?? "Boutique";
  const shopInitial     = shopName.charAt(0).toUpperCase();
  const variants        = product.variants ?? [];
  const hasVariants     = product.hasVariants && variants.length > 0;
  const selectedVariant = hasVariants ? (variants.find(v => v.id === selectedVariantId) ?? null) : null;
  const activeStock     = hasVariants ? (selectedVariant?.stock ?? 0) : product.stock;
  const unitPrice       = selectedVariant?.priceOverride != null
    ? Number(selectedVariant.priceOverride) : Number(product.unitPrice);
  const badge           = stockBadge(activeStock);
  const gallery         = Array.from(new Set([product.imageUrl, ...(product.imageVariants ?? [])].filter(Boolean) as string[]));
  const mainImage       = selectedImage ?? gallery[0] ?? null;
  const whatsappNumber  = product.whatsappNumber ?? shop?.whatsappNumber ?? null;
  const whatsappUrl     = whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}` : null;
  const currentIdx      = gallery.indexOf(mainImage ?? "");
  const ctaDisabled     = hasVariants && !selectedVariant;
  galleryLengthRef.current = gallery.length;

  // ── Variant price range ────────────────────────────────────────────────────
  const basePrice     = Number(product.unitPrice);
  const variantPrices = variants
    .filter(v => v.priceOverride != null)
    .map(v => Number(v.priceOverride));
  const allPrices     = [basePrice, ...variantPrices];
  const priceFrom     = Math.min(...allPrices);
  const priceTo       = Math.max(...allPrices);
  const hasPriceRange = hasVariants && priceFrom !== priceTo;
  const priceDiff     = selectedVariant?.priceOverride != null
    ? Number(selectedVariant.priceOverride) - basePrice : 0;

  function prevImage() { if (gallery.length < 2) return; setSelectedImage(gallery[(currentIdx - 1 + gallery.length) % gallery.length]); }
  function nextImage() { if (gallery.length < 2) return; setSelectedImage(gallery[(currentIdx + 1) % gallery.length]); }
  function openLightbox(idx: number) { setLightboxIdx(idx); setLightboxOpen(true); }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAF9" }}>
      <style>{CSS}</style>

      {/* ── Lightbox ─────────────────────────────────────────────── */}
      {lightboxOpen && gallery.length > 0 && (
        <div
          className="pdp-lightbox"
          role="dialog"
          aria-modal={true}
          aria-label="Agrandissement de l'image"
          onClick={e => { if (e.target === e.currentTarget) setLightboxOpen(false); }}
          onTouchStart={e => { lbTouchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={e => {
            if (lbTouchStartX.current === null || gallery.length < 2) return;
            const dx = e.changedTouches[0].clientX - lbTouchStartX.current;
            if (Math.abs(dx) > 50) {
              if (dx < 0) setLightboxIdx(i => (i + 1) % gallery.length);
              else        setLightboxIdx(i => (i - 1 + gallery.length) % gallery.length);
            }
            lbTouchStartX.current = null;
          }}
        >
          <button className="pdp-lb-close" onClick={() => setLightboxOpen(false)} title="Fermer (Échap)">
            <X style={{ width: 18, height: 18 }} />
          </button>

          <img
            key={lightboxIdx}
            src={gallery[lightboxIdx]}
            alt={`${product.name}, image ${lightboxIdx + 1}`}
            className="pdp-lb-img"
          />

          {gallery.length > 1 && (
            <>
              <button className="pdp-lb-arrow pdp-lb-prev" onClick={() => setLightboxIdx(i => (i - 1 + gallery.length) % gallery.length)} title="Précédente">
                <ChevronLeft style={{ width: 22, height: 22 }} />
              </button>
              <button className="pdp-lb-arrow pdp-lb-next" onClick={() => setLightboxIdx(i => (i + 1) % gallery.length)} title="Suivante">
                <ChevronRight style={{ width: 22, height: 22 }} />
              </button>
              <div className="pdp-lb-dots">
                {gallery.map((_, i) => (
                  <button key={i} className={`pdp-lb-dot${i === lightboxIdx ? " active" : ""}`} onClick={() => setLightboxIdx(i)} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Toast simple (favoris, copie lien…) */}
      {toast && <div className="pdp-toast">{toast}</div>}

      {/* Rich cart toast */}
      {cartToast && (
        <div className="pdp-cart-toast" style={{ position: "relative" }}>
          <button className="pdp-cart-toast-close" onClick={() => setCartToast(null)}>
            <X style={{ width: 14, height: 14 }} />
          </button>
          <div className="pdp-cart-toast-body">
            {cartToast.imageUrl
              ? <img src={cartToast.imageUrl} alt="" className="pdp-cart-toast-img" />
              : <div className="pdp-cart-toast-ph">
                  <Package style={{ width: 20, height: 20, color: "#C8CED6" }} />
                </div>
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#0A8F45", marginBottom: 3 }}>
                <Check size={15} strokeWidth={2.5} style={{ verticalAlign: "-3px", marginRight: 5 }} />Ajouté au panier
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1F2A24", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {cartToast.name}
              </div>
              <div style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>
                {formatPrice(cartToast.price * cartToast.qty)}
                {cartToast.qty > 1 && <span style={{ marginLeft: 5, color: "#98A2B3" }}>× {cartToast.qty}</span>}
              </div>
            </div>
          </div>
          <Link href={`/shop/${slug}/checkout`} className="pdp-cart-toast-cta" onClick={() => setCartToast(null)}>
            Voir le panier ({cartCount}) <ArrowRight size={14} strokeWidth={2.25} style={{ verticalAlign: "-2px" }} />
          </Link>
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────────────── */}
      <header className={`pdp-header${headerCompact ? " compact" : ""}`}>
        <div className="pdp-header-inner">
          <a href={`/shop/${slug}`} className="pdp-logo">
            <div className="pdp-logo-icon">
              <span style={{ color: "#fff", fontWeight: 800, fontSize: 17 }}>B</span>
            </div>
            <span className="pdp-logo-name">BizManager</span>
          </a>

          <div className="pdp-search-bar">
            <Search size={15} className="pdp-search-icon" />
            <input type="text" className="pdp-search-input" placeholder="Rechercher un produit…" readOnly onClick={() => window.location.href = `/shop/${slug}`} style={{ cursor: "pointer" }} />
          </div>

          <div className="pdp-header-actions">
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="pdp-contact-btn">
                <MessageCircle size={14} />
                Contacter
              </a>
            )}
            <Link href={`/shop/${slug}/favorites`} className="pdp-icon-btn pdp-icon-btn-red" title="Favoris">
              <Heart size={16} fill="#fff" />
              {favCount > 0 && <span className="pdp-badge">{favCount > 9 ? "9+" : favCount}</span>}
            </Link>
            <Link href={`/shop/${slug}`} className="pdp-icon-btn pdp-icon-btn-green" title="Panier">
              <ShoppingBag size={16} />
              {cartCount > 0 && <span className="pdp-badge">{cartCount > 9 ? "9+" : cartCount}</span>}
            </Link>
            <Link href={`/shop/${slug}`} className="pdp-btn-shop">
              <ArrowLeft size={14} />
              Boutique
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────────────── */}
      <main className="pdp-main">

        {/* Breadcrumb */}
        <nav className="pdp-breadcrumb" aria-label="Fil d'Ariane">
          <Link href={`/shop/${slug}`} className="pdp-breadcrumb-back">
            <ArrowLeft style={{ width: 12, height: 12 }} />
            Boutique
          </Link>
          {(product.category || product.categories?.[0]) && (
            <>
              <span className="pdp-breadcrumb-sep">·</span>
              <Link href={`/shop/${slug}`}>
                {product.category || product.categories![0]}
              </Link>
            </>
          )}
          <span className="pdp-breadcrumb-sep">·</span>
          <span className="pdp-breadcrumb-current">{product.name}</span>
        </nav>

        {/* 3-col grid */}
        <div className="pdp-grid">

          {/* ── Gallery ──────────────────────────────────────────────── */}
          <div>
            <div className="pdp-gallery-main">
              {mainImage ? (
                <Image
                  src={mainImage}
                  alt={product.name}
                  fill
                  className="pdp-gallery-img"
                  priority
                  sizes="(max-width: 768px) 100vw, 460px"
                  onClick={() => openLightbox(currentIdx < 0 ? 0 : currentIdx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === "Enter" && openLightbox(currentIdx < 0 ? 0 : currentIdx)}
                />
              ) : (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, color: "#C8CED6" }}>
                  <Package style={{ width: 56, height: 56 }} />
                  <span style={{ fontSize: 13 }}>Aucune image</span>
                </div>
              )}

              <div className="pdp-stock-badge" style={{ background: badge.bg, color: badge.color }}>
                {badge.label}
              </div>

              <button className="pdp-heart-btn" onClick={toggleFavorite} title={favorited ? "Retirer des favoris" : "Ajouter aux favoris"}>
                <Heart style={{ width: 17, height: 17, color: favorited ? "#EF4444" : "#D0D5DD", fill: favorited ? "#EF4444" : "none" }} />
              </button>

              {gallery.length > 1 && (
                <>
                  <button className="pdp-arrow-btn pdp-arrow-left" onClick={prevImage}>
                    <ChevronLeft style={{ width: 18, height: 18 }} />
                  </button>
                  <button className="pdp-arrow-btn pdp-arrow-right" onClick={nextImage}>
                    <ChevronRight style={{ width: 18, height: 18 }} />
                  </button>
                </>
              )}
            </div>

            {/* Dots */}
            {gallery.length > 1 && (
              <div className="pdp-dots">
                {gallery.map((_, i) => (
                  <button key={i} className={`pdp-dot${i === currentIdx ? " active" : ""}`} onClick={() => setSelectedImage(gallery[i])} />
                ))}
              </div>
            )}

            {/* Thumbnails */}
            {gallery.length > 1 && (
              <div className="pdp-thumbs">
                {gallery.map((img, i) => (
                  <button key={i} className={`pdp-thumb${img === (mainImage) ? " active" : ""}`} onClick={() => setSelectedImage(img)}>
                    <Image src={img} alt={`Vue ${i + 1}`} width={68} height={68} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Info column ───────────────────────────────────────────── */}
          <div>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
              <span className="pdp-verified-badge"><BadgeCheck size={13} strokeWidth={2.1} /> Boutique vérifiée</span>
              <button className="pdp-share-icon-btn" onClick={shareProduct} title="Partager ce produit">
                <Share2 style={{ width: 15, height: 15 }} />
              </button>
            </div>

            <h1 className="pdp-title">{product.name}</h1>

            <div className="pdp-stars-row">
              <Stars size={14} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1F2A24" }}>4.8</span>
              <span style={{ fontSize: 12, color: "#98A2B3" }}>(32 avis)</span>
              <span style={{ width: 1, height: 14, background: "#E8ECEA", display: "inline-block", margin: "0 4px" }} />
              <span style={{ fontSize: 12, color: "#667085" }}>128 vendus</span>
            </div>

            <div className="pdp-price-wrap">
              {hasVariants && !selectedVariant && hasPriceRange && (
                <div className="pdp-price-from">À partir de</div>
              )}
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                <div key={selectedVariantId ?? "base"} className="pdp-price">
                  {hasVariants && !selectedVariant && hasPriceRange
                    ? formatPrice(priceFrom)
                    : formatPrice(unitPrice)}
                </div>
                {selectedVariant && priceDiff !== 0 && (
                  <span className={`pdp-price-diff ${priceDiff > 0 ? "pdp-price-diff-up" : "pdp-price-diff-down"}`}>
                    {priceDiff > 0 ? "+" : "−"}{formatPrice(Math.abs(priceDiff))} vs base
                  </span>
                )}
              </div>
              {hasVariants && !selectedVariant && hasPriceRange && (
                <div style={{ fontSize: 12, color: "#C8CED6", marginTop: 2 }}>
                  jusqu'à {formatPrice(priceTo)}
                </div>
              )}
            </div>

            {product.description && (
              <div className="pdp-desc-box">
                <div className="pdp-desc-lbl">Description</div>
                <p
                  ref={descRef}
                  className={`pdp-desc-text${!descExpanded ? " clamped" : ""}`}
                >
                  {product.description}
                </p>
                {(descOverflows || descExpanded) && (
                  <button
                    className="pdp-desc-toggle"
                    onClick={() => setDescExpanded(v => !v)}
                  >
                    {descExpanded
                  ? <>Voir moins <ArrowUp size={12} strokeWidth={2.25} style={{ verticalAlign: "-2px" }} /></>
                  : <>Voir plus <ArrowDown size={12} strokeWidth={2.25} style={{ verticalAlign: "-2px" }} /></>}
                  </button>
                )}
              </div>
            )}

            <hr style={{ border: "none", borderTop: "1px solid #E8ECEA", margin: "0 0 18px" }} />

            {/* Variants */}
            {hasVariants && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1F2A24", marginBottom: 10 }}>
                  Variante
                  {selectedVariant && <span style={{ fontWeight: 400, color: "#667085" }}> · {selectedVariant.label}</span>}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {variants.map(v => {
                    const vPrice = v.priceOverride != null ? Number(v.priceOverride) : basePrice;
                    return (
                      <button
                        key={v.id}
                        className={`pdp-size-btn${selectedVariantId === v.id ? " active" : ""}`}
                        onClick={() => { setSelectedVariantId(v.id); setQuantity(1); }}
                        disabled={v.stock === 0}
                        style={v.stock === 0 ? { opacity: .45, cursor: "not-allowed", textDecoration: "line-through" } : {}}
                        title={v.stock === 0 ? "Rupture de stock" : `${v.label} · ${formatPrice(vPrice)}`}
                      >
                        <span>{v.label}</span>
                        {hasPriceRange && (
                          <span className="pdp-size-btn-price">
                            {vPrice.toLocaleString("fr-FR")} F
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {hasVariants && !selectedVariant && (
                  <p style={{ margin: "8px 0 0", fontSize: 12, color: "#F08A24", fontWeight: 600 }}>
                    Veuillez sélectionner une variante.
                  </p>
                )}
              </div>
            )}

            {/* Quantity */}
            {activeStock > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#1F2A24", minWidth: 64 }}>Quantité</span>
                <div className="pdp-qty-row">
                  <button className="pdp-qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}>
                    <Minus style={{ width: 14, height: 14 }} />
                  </button>
                  <span style={{ minWidth: 44, textAlign: "center", fontWeight: 700, fontSize: 15, color: "#1F2A24" }}>{quantity}</span>
                  <button className="pdp-qty-btn" onClick={() => setQuantity(q => Math.min(activeStock, q + 1))} disabled={quantity >= activeStock}>
                    <Plus style={{ width: 14, height: 14 }} />
                  </button>
                </div>
                {activeStock <= 10 && activeStock > 0 && (
                  <span style={{ fontSize: 12, color: "#F08A24", fontWeight: 600 }}>
                    Plus que {activeStock} pièce{activeStock > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            )}

            {/* Subtotal */}
            {activeStock > 0 && quantity > 1 && (
              <div className="pdp-subtotal">
                <span style={{ fontSize: 13, color: "#667085" }}>Sous-total ({quantity} articles)</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#0A8F45" }}>{formatPrice(unitPrice * quantity)}</span>
              </div>
            )}

            {/* CTA buttons - observed by sticky bar IntersectionObserver */}
            <div ref={ctaRef} style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              {activeStock > 0 ? (
                <>
                  <button
                    className="pdp-cta-primary"
                    onClick={addToCart}
                    disabled={ctaDisabled}
                  >
                    <ShoppingBag style={{ width: 17, height: 17 }} />
                    Ajouter au panier
                  </button>
                  <button
                    className="pdp-cta-outline"
                    onClick={() => { setFormError(null); setCheckoutOpen(true); }}
                    disabled={ctaDisabled}
                    style={ctaDisabled ? { opacity: .5, cursor: "not-allowed" } : {}}
                  >
                    Commander directement
                  </button>
                  {whatsappUrl && (
                    <a
                      href={`${whatsappUrl}?text=${encodeURIComponent(`Bonjour, je souhaite des informations sur : ${product.name}`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="pdp-cta-wa"
                    >
                      <MessageCircle style={{ width: 17, height: 17 }} />
                      Discuter sur WhatsApp
                    </a>
                  )}
                </>
              ) : (
                <button className="pdp-cta-disabled" disabled>Produit indisponible</button>
              )}
            </div>

            {/* Perks */}
            <div className="pdp-perks">
              <span className="pdp-perk"><Truck size={13} strokeWidth={1.9} /> Livraison rapide</span>
              <span style={{ color: "#E8ECEA" }}>·</span>
              <span className="pdp-perk"><Lock size={13} strokeWidth={1.9} /> Paiement sécurisé</span>
              <span style={{ color: "#E8ECEA" }}>·</span>
              <span className="pdp-perk"><RotateCcw size={13} strokeWidth={1.9} /> Retour facile</span>
            </div>
          </div>

          {/* ── Sidebar ───────────────────────────────────────────────── */}
          <div className="pdp-sidebar">

            {/* Shop card */}
            <div className="pdp-card">
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div className="pdp-shop-logo">{shopInitial}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#1F2A24" }}>{shopName}</div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#0a8f45", background: "#EAF7EF", padding: "2px 8px", borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 3 }}><BadgeCheck size={12} strokeWidth={2.1} /> Vérifié</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 14 }}>
                <Stars size={12} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1F2A24" }}>4.7</span>
                <span style={{ fontSize: 11, color: "#98A2B3" }}>(168 avis)</span>
              </div>
              <Link href={`/shop/${slug}`}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 36, border: "1.5px solid #0A8F45", borderRadius: 10, color: "#0A8F45", fontSize: 13, fontWeight: 600, textDecoration: "none", marginBottom: 12 }}
              >
                Voir la boutique
              </Link>
              {[
                { Icon: MessageCircle, label: "Réponse rapide" },
                { Icon: Award,         label: "Membre depuis 2022" },
                { Icon: BadgeCheck,    label: "Boutique vérifiée" },
              ].map(({ Icon, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#667085", marginBottom: 4 }}>
                  <Icon size={13} strokeWidth={1.9} style={{ flexShrink: 0, color: "#9aa5a1" }} />{label}
                </div>
              ))}
            </div>

            {/* Trust */}
            <div className="pdp-card">
              <div className="pdp-card-title">Pourquoi nous faire confiance ?</div>
              {["Produits sélectionnés avec soin", "Satisfait ou remboursé sous 3 jours", "Livraison rapide et sécurisée", "Service client réactif"].map(item => (
                <div key={item} className="pdp-check-item">
                  <div className="pdp-check-icon"><Check size={11} strokeWidth={3} /></div>
                  {item}
                </div>
              ))}
            </div>

            {/* Payments */}
            <div className="pdp-card">
              <div className="pdp-card-title">Paiements acceptés</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[
                  { Icon: Smartphone, label: "MTN" },
                  { Icon: Smartphone, label: "Orange" },
                  { Icon: CreditCard, label: "Visa" },
                  { Icon: Banknote,   label: "Espèces" },
                ].map(({ Icon, label }) => (
                  <span key={label} className="pdp-payment-chip"><Icon size={12} strokeWidth={1.9} /> {label}</span>
                ))}
              </div>
            </div>

            {/* Share */}
            <div className="pdp-card">
              <div className="pdp-card-title">Partager ce produit</div>
              <div style={{ display: "flex", gap: 8 }}>
                {whatsappUrl && (
                  <a
                    href={`${whatsappUrl}?text=${encodeURIComponent(`Découvrez ce produit : ${product.name} · ${formatPrice(unitPrice)}\n${typeof window !== "undefined" ? window.location.href : ""}`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="pdp-share-wa"
                  >
                    <MessageCircle style={{ width: 15, height: 15 }} />
                    WhatsApp
                  </a>
                )}
                <button className="pdp-share-copy" onClick={copyLink}>
                  <Share2 style={{ width: 15, height: 15 }} />
                  Copier le lien
                </button>
              </div>
              {canNativeShare && (
                <button className="pdp-share-native" onClick={shareProduct}>
                  <Share2 style={{ width: 15, height: 15 }} />
                  Partager via…
                </button>
              )}
            </div>

            {/* Reviews */}
            <div className="pdp-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div className="pdp-card-title" style={{ marginBottom: 0 }}>Avis récents</div>
                <button style={{ background: "none", border: "none", color: "#0A8F45", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}>Voir tous</button>
              </div>
              {SIMULATED_REVIEWS.map((rev, i) => (
                <div key={i} style={{ paddingBottom: 12, marginBottom: 12, borderBottom: i < SIMULATED_REVIEWS.length - 1 ? "1px solid #F4F6F5" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div className="pdp-review-avatar">{rev.initials}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1F2A24" }}>{rev.name}</div>
                      <Stars count={rev.stars} size={11} />
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "#667085", lineHeight: 1.5 }}>{rev.text}</p>
                  <div style={{ fontSize: 11, color: "#98A2B3", marginTop: 4 }}>{rev.date}</div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <div className="pdp-tabs-section">
          <div className="pdp-tabs-main">
            <div className="pdp-card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "0 20px" }}>
                <div className="pdp-tabs-nav">
                  {(["description", "caracteristiques", "avis", "faq"] as const).map(tab => {
                    const labels: Record<string, string> = {
                      description: "Description", caracteristiques: "Caractéristiques",
                      avis: "Avis (32)", faq: "FAQ",
                    };
                    return (
                      <button key={tab} className={`pdp-tab-btn${descTab === tab ? " active" : ""}`} onClick={() => setDescTab(tab)}>
                        {labels[tab]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ padding: "0 20px 20px" }}>
                {descTab === "description" && (
                  <div>
                    <p style={{ fontSize: 14, color: "#1F2A24", lineHeight: 1.8, marginBottom: 16 }}>
                      {product.description ?? `${product.name} est un produit de qualité, soigneusement sélectionné pour vous.`}
                    </p>
                    {["Matériaux de haute qualité", "Design moderne adapté aux tendances", "Finitions soignées", "Idéal pour toutes les occasions"].map(f => (
                      <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10, fontSize: 14, color: "#1F2A24" }}>
                        <div style={{ width: 20, height: 20, background: "#EAF7EF", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#0a8f45" }}><Check size={11} strokeWidth={3} /></div>
                        {f}
                      </div>
                    ))}
                  </div>
                )}

                {descTab === "caracteristiques" && (
                  <table className="pdp-spec-table">
                    <tbody>
                      <tr><td>Catégorie</td><td>{product.category ?? "Non précisée"}</td></tr>
                      <tr><td>Stock</td><td>{activeStock > 0 ? `${activeStock} unités` : "Rupture"}</td></tr>
                      <tr><td>Prix unitaire</td><td style={{ fontWeight: 700, color: "#0A8F45" }}>{formatPrice(product.unitPrice)}</td></tr>
                      <tr><td>Référence</td><td style={{ fontFamily: "monospace", fontSize: 12 }}>{product.id.slice(0, 10).toUpperCase()}</td></tr>
                      <tr><td>Boutique</td><td>{shopName}</td></tr>
                      <tr><td>Livraison</td><td>Disponible · 1 000 FCFA</td></tr>
                    </tbody>
                  </table>
                )}

                {descTab === "avis" && (
                  <div>
                    {SIMULATED_REVIEWS.map((rev, i) => (
                      <div key={i} style={{ padding: "16px 0", borderBottom: i < SIMULATED_REVIEWS.length - 1 ? "1px solid #F4F6F5" : "none" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <div className="pdp-review-avatar" style={{ width: 40, height: 40, fontSize: 14 }}>{rev.initials}</div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: "#1F2A24" }}>{rev.name}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <Stars count={rev.stars} size={12} />
                              <span style={{ fontSize: 11, color: "#98A2B3" }}>{rev.date}</span>
                            </div>
                          </div>
                        </div>
                        <p style={{ margin: 0, fontSize: 14, color: "#1F2A24", lineHeight: 1.7 }}>{rev.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {descTab === "faq" && (
                  <div>
                    {[
                      { q: "Les délais de livraison sont-ils garantis ?", a: "Nous livrons en 24h – 48h ouvrables dans Yaoundé et environs." },
                      { q: "Puis-je retourner un article ?", a: "Oui, sous 3 jours après réception, si l'article est dans son état d'origine." },
                      { q: "Quels modes de paiement acceptez-vous ?", a: "MTN Mobile Money, Orange Money, cartes bancaires, et paiement à la livraison." },
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="pdp-faq-q"><HelpCircle size={14} strokeWidth={2} style={{ flexShrink: 0 }} /> {item.q}</div>
                        <div className="pdp-faq-a">{item.a}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rating panel */}
          <div className="pdp-tabs-aside">
            <div className="pdp-card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1F2A24", marginBottom: 16, textAlign: "left" }}>Note globale</div>
              <div style={{ fontSize: 56, fontWeight: 800, color: "#1F2A24", lineHeight: 1, marginBottom: 8 }}>4.8</div>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
                <Stars size={20} />
              </div>
              <div style={{ fontSize: 12, color: "#98A2B3", marginBottom: 20 }}>Basé sur 32 avis</div>
              {STAR_DISTRIBUTION.map(({ star, pct }) => (
                <div key={star} className="pdp-bar-row">
                  <span style={{ fontSize: 11, color: "#667085", minWidth: 16, textAlign: "right" }}>{star}</span>
                  <Star size={11} strokeWidth={0} fill="#F7B500" />
                  <div className="pdp-bar-track"><div className="pdp-bar-fill" style={{ width: `${pct}%` }} /></div>
                  <span style={{ fontSize: 11, color: "#98A2B3", minWidth: 28, textAlign: "right" }}>{pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── "Vous aimerez aussi" ──────────────────────────────────────── */}
        {recoProducts.length > 0 && (
          <div className="pdp-reco-section">
            <h2 style={{ fontSize: 19, fontWeight: 800, color: "#1F2A24", margin: "0 0 16px" }}>Vous aimerez aussi</h2>
            <div className="pdp-reco-grid">
              {recoProducts.map(p => (
                <Link key={p.id} href={`/shop/${slug}/products/${p.id}`} className="pdp-reco-card">
                  <div className="pdp-reco-img-wrap">
                    {p.imageUrl
                      ? <Image src={p.imageUrl} alt={p.name} fill className="pdp-reco-img" sizes="(max-width: 768px) 45vw, 20vw" />
                      : <div className="pdp-reco-placeholder"><Package size={26} strokeWidth={1.3} color="#c7cfcc" /></div>
                    }
                  </div>
                  <div className="pdp-reco-body">
                    <div className="pdp-reco-name">{p.name}</div>
                    <div style={{ display: "flex", gap: 1, marginBottom: 5 }}>
                      {[1,2,3,4,5].map(s => <Star key={s} size={10} strokeWidth={0} fill="#F7B500" />)}
                    </div>
                    <div className="pdp-reco-price">{formatPrice(p.unitPrice)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* ── Sticky bottom bar ─────────────────────────────────────────── */}
      {stickyBar && activeStock > 0 && (
        <div className="pdp-sticky-bar">
          {/* Miniature produit */}
          {mainImage
            ? <img src={mainImage} alt="" className="pdp-sticky-thumb" />
            : <div className="pdp-sticky-thumb-ph">
                <Package style={{ width: 18, height: 18, color: "#C8CED6" }} />
              </div>
          }

          {/* Nom + prix */}
          <div className="pdp-sticky-info">
            <div className="pdp-sticky-name">{product.name}</div>
            <div className="pdp-sticky-price">
              {formatPrice(unitPrice * quantity)}
              {quantity > 1 && (
                <span className="pdp-sticky-qty">× {quantity}</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="pdp-sticky-actions">
            <button className="pdp-sticky-add" onClick={addToCart} disabled={ctaDisabled}>
              <ShoppingBag size={15} />
              Ajouter au panier
            </button>
            <button
              className="pdp-sticky-order"
              onClick={() => { setFormError(null); setCheckoutOpen(true); }}
              disabled={ctaDisabled}
            >
              Commander
            </button>
          </div>
        </div>
      )}

      {/* ── Bottom nav (mobile only) ──────────────────────────────────── */}
      <nav className="pdp-bottom-nav">
        <Link href={`/shop/${slug}`} className="pdp-bnav-item">
          <Home size={20} />
          <span>Boutique</span>
        </Link>
        <button className="pdp-bnav-item" onClick={toggleFavorite}>
          <Heart size={20} fill={favorited ? "#EF4444" : "none"} color={favorited ? "#EF4444" : "currentColor"} />
          <span>Favoris</span>
        </button>
        <button className="pdp-bnav-item" onClick={addToCart} disabled={activeStock <= 0}>
          <ShoppingBag size={20} />
          <span>Panier</span>
        </button>
        <button className="pdp-bnav-item" onClick={() => { setFormError(null); setCheckoutOpen(true); }} disabled={activeStock <= 0}>
          <MessageCircle size={20} />
          <span>Commander</span>
        </button>
      </nav>

      {/* ── Checkout modal ────────────────────────────────────────────── */}
      {checkoutOpen && (
        <div className="pdp-overlay" onClick={e => { if (e.target === e.currentTarget) setCheckoutOpen(false); }}>
          <div className="pdp-modal">
            <div className="pdp-modal-header">
              <div>
                <div style={{ fontWeight: 800, fontSize: 17, color: "#1F2A24" }}>Passer commande</div>
                <div style={{ fontSize: 12, color: "#98A2B3", marginTop: 2 }}>{product.name}</div>
              </div>
              <button className="pdp-modal-close" onClick={() => setCheckoutOpen(false)}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <form onSubmit={submitOrder} style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Product summary */}
              <div style={{ display: "flex", gap: 12, background: "#F8FAF9", borderRadius: 12, padding: 12, alignItems: "center" }}>
                {mainImage
                  ? <img src={mainImage} alt={product.name} style={{ width: 60, height: 60, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                  : <div style={{ width: 60, height: 60, borderRadius: 10, background: "#E8ECEA", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Package style={{ width: 24, height: 24, color: "#C8CED6" }} />
                    </div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#1F2A24", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.name}</div>
                  <div style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>Quantité : {quantity}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#0A8F45", flexShrink: 0 }}>{formatPrice(unitPrice * quantity)}</div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1F2A24", marginBottom: 6 }}>Nom complet <span style={{ color: "#DC2626" }}>*</span></label>
                <input type="text" className="pdp-input" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Ex : Jean Dupont" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1F2A24", marginBottom: 6 }}>Téléphone <span style={{ color: "#DC2626" }}>*</span></label>
                <input type="tel" className="pdp-input" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="+237 6XX XXX XXX" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1F2A24", marginBottom: 6 }}>Adresse <span style={{ fontWeight: 400, color: "#98A2B3" }}>optionnel</span></label>
                <input type="text" className="pdp-input" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="Quartier, rue, point de repère…" />
              </div>

              {/* Payment */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1F2A24", marginBottom: 8 }}>Mode de paiement</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {PAYMENT_OPTIONS.map(opt => (
                    <button key={opt.value} type="button" className={`pdp-pay-opt${paymentMethod === opt.value ? " active" : ""}`} onClick={() => setPaymentMethod(opt.value)}>
                      {opt.value === "mobile_money"
                        ? <img src={MM_IMG_URL} alt="Mobile Money" style={{ height: 24, width: "auto", maxWidth: 60, objectFit: "contain", flexShrink: 0 }} />
                        : <opt.Icon size={19} strokeWidth={1.9} style={{ flexShrink: 0 }} />
                      }
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1F2A24", marginBottom: 6 }}>Note <span style={{ fontWeight: 400, color: "#98A2B3" }}>optionnel</span></label>
                <textarea className="pdp-textarea" value={orderNotes} onChange={e => setOrderNotes(e.target.value)} placeholder="Instructions particulières…" rows={3} />
              </div>

              {formError && (
                <div style={{ background: "#FFF1F2", color: "#DC2626", borderRadius: 10, padding: "10px 14px", fontSize: 13 }}>{formError}</div>
              )}

              <button type="submit" disabled={submitting} className="pdp-cta-primary" style={{ height: 50, opacity: submitting ? .7 : 1 }}>
                {submitting ? "Envoi en cours…" : `Confirmer · ${formatPrice(unitPrice * quantity)}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirmation modal ────────────────────────────────────────── */}
      {orderResult && (
        <div className="pdp-overlay">
          <div className="pdp-modal" style={{ maxWidth: 400, padding: "32px 28px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
            <div style={{ width: 72, height: 72, background: "#DDF6E7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle style={{ width: 40, height: 40, color: "#0A8F45" }} />
            </div>
            <div>
              <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "#1F2A24" }}>Commande confirmée !</h2>
              <p style={{ margin: 0, fontSize: 14, color: "#667085" }}>Votre commande a bien été enregistrée.</p>
            </div>
            <div style={{ background: "#F8FAF9", borderRadius: 12, padding: "14px 20px", width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "#667085" }}>Référence</span>
                <span style={{ fontWeight: 700, fontSize: 14, color: "#1F2A24", fontFamily: "monospace" }}>#{orderResult.orderId.slice(0, 8).toUpperCase()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "#667085" }}>Total</span>
                <span style={{ fontWeight: 800, fontSize: 16, color: "#0A8F45" }}>{formatPrice(orderResult.totalAmount)}</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
              {orderResult.whatsappNumber && (
                <a
                  href={`https://wa.me/${orderResult.whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Bonjour, j'ai passé une commande #${orderResult.orderId.slice(0, 8).toUpperCase()}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ height: 46, background: "#25D366", color: "#fff", borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  <MessageCircle style={{ width: 17, height: 17 }} />
                  Contacter sur WhatsApp
                </a>
              )}
              <Link href={`/shop/${slug}`} onClick={() => setOrderResult(null)}
                style={{ height: 46, background: "#EAF7EF", color: "#0A8F45", borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <ArrowLeft style={{ width: 15, height: 15 }} />
                Continuer mes achats
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { Heart, Home, MessageCircle, Plus, Search, ShoppingBag, X } from 'lucide-react';
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
  hasVariants?: boolean;
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
    display: flex; align-items: center; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;
  }
  .sp-select {
    height: 36px; padding: 0 12px; border: 1.5px solid #E8ECEA;
    border-radius: 8px; font-size: 12px; color: #1F2A24;
    background: #fff; cursor: pointer; outline: none;
  }
  .sp-select:focus { border-color: #0A8F45; }
  .sp-count { font-size: 12px; color: #98A2B3; margin-left: auto; flex-shrink: 0; }
  .sp-filter-btn {
    display: inline-flex; align-items: center; gap: 6px;
    height: 36px; padding: 0 14px; border: 1.5px solid #E8ECEA;
    border-radius: 8px; font-size: 12px; font-weight: 600; color: #1F2A24;
    background: #fff; cursor: pointer; transition: all .15s; white-space: nowrap; flex-shrink: 0;
  }
  .sp-filter-btn:hover { border-color: #0A8F45; color: #0A8F45; }
  .sp-filter-btn.has-active { background: #EAF7EF; border-color: #0A8F45; color: #0A8F45; }
  .sp-filter-badge {
    min-width: 18px; height: 18px; background: #0A8F45; color: #fff;
    border-radius: 9px; font-size: 10px; font-weight: 800;
    display: inline-flex; align-items: center; justify-content: center; padding: 0 4px;
  }
  .sp-active-chip {
    display: inline-flex; align-items: center; gap: 5px;
    height: 28px; padding: 0 8px 0 11px;
    background: #EAF7EF; border: 1.5px solid #C3EDD7; border-radius: 14px;
    font-size: 11px; font-weight: 600; color: #0A8F45; white-space: nowrap; flex-shrink: 0;
  }
  .sp-active-chip button {
    background: none; border: none; cursor: pointer; color: #0A8F45;
    padding: 0; line-height: 1; display: flex; align-items: center;
  }

  /* ── Filter drawer ───────────────────────────────────────────────── */
  .sp-filter-backdrop {
    position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 400;
    opacity: 0; animation: backdropIn .2s ease forwards;
  }
  .sp-filter-drawer {
    position: fixed; top: 0; right: 0; bottom: 0; width: 320px; max-width: 92vw;
    background: #fff; z-index: 401; display: flex; flex-direction: column;
    box-shadow: -8px 0 40px rgba(0,0,0,.14);
    transform: translateX(100%); animation: drawerIn .25s ease forwards;
  }
  .sp-filter-section { padding: 20px; border-bottom: 1px solid #F4F6F5; }
  .sp-filter-section-title {
    font-size: 10px; font-weight: 700; color: #98A2B3;
    text-transform: uppercase; letter-spacing: .08em; margin-bottom: 12px;
  }
  .sp-filter-chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .sp-filter-chip {
    height: 34px; padding: 0 14px; border-radius: 17px;
    border: 1.5px solid #E8ECEA; font-size: 12px; font-weight: 600;
    cursor: pointer; background: #fff; color: #1F2A24;
    transition: all .15s; white-space: nowrap;
  }
  .sp-filter-chip.active { background: #0A8F45; color: #fff; border-color: #0A8F45; }
  .sp-filter-chip:not(.active):hover { border-color: #0A8F45; color: #0A8F45; }

  /* ── Product grid ────────────────────────────────────────────────── */
  .sp-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }

  /* ── Product card ────────────────────────────────────────────────── */
  .sp-card {
    background: #fff; border: 1px solid #E8ECEA; border-radius: 14px;
    overflow: hidden; transition: box-shadow .15s, transform .15s;
    animation: cardIn .38s ease-out both; position: relative;
  }
  .sp-card:hover { box-shadow: 0 6px 28px rgba(16,24,40,.09); transform: translateY(-2px); }
  .sp-card-link {
    position: absolute; inset: 0; z-index: 1; border-radius: inherit;
  }
  .sp-card-img-wrap {
    position: relative; padding-bottom: 75%; overflow: hidden; background: #F8FAF9;
  }
  .sp-card-img {
    position: absolute; inset: 0; width: 100%; height: 100%;
    object-fit: cover; transition: transform .35s;
  }
  .sp-card:hover .sp-card-img { transform: scale(1.05); }
  .sp-card-overlay {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,0); transition: background .28s; z-index: 1;
    pointer-events: none;
  }
  .sp-card:hover .sp-card-overlay { background: rgba(0,0,0,0.38); }
  .sp-card-overlay-label {
    color: #fff; font-size: 12px; font-weight: 700; letter-spacing: .02em;
    padding: 7px 15px; border-radius: 20px;
    border: 1.5px solid rgba(255,255,255,0.55);
    background: rgba(255,255,255,0.12); backdrop-filter: blur(6px);
    opacity: 0; transform: translateY(5px);
    transition: opacity .25s, transform .25s;
    pointer-events: none; white-space: nowrap;
  }
  .sp-card:hover .sp-card-overlay-label { opacity: 1; transform: translateY(0); }
  .sp-card-stock {
    position: absolute; bottom: 8px; left: 8px;
    padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;
  }
  @keyframes stockPulse {
    0%, 100% { transform: scale(1); }
    50%       { transform: scale(1.07); }
  }
  .sp-card-stock-urgent { animation: stockPulse 1.6s ease-in-out infinite; }
  .sp-card-fav {
    position: absolute; top: 8px; right: 8px; width: 30px; height: 30px;
    background: #fff; border: none; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,.14); z-index: 3;
    transition: transform .15s;
  }
  .sp-card-fav:hover { transform: scale(1.1); }
  .sp-card-quick-add {
    position: absolute; bottom: 8px; right: 8px; width: 32px; height: 32px;
    background: #0A8F45; border: none; border-radius: 50%; color: #fff;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; z-index: 3;
    box-shadow: 0 3px 10px rgba(10,143,69,0.45);
    opacity: 0; transform: scale(0.65) translateY(4px);
    transition: opacity .22s, transform .22s, background .15s;
  }
  .sp-card:hover .sp-card-quick-add { opacity: 1; transform: scale(1) translateY(0); }
  .sp-card-quick-add:hover { background: #08763A; transform: scale(1.1) translateY(0) !important; }
  .sp-card-body { padding: 11px 13px 13px; }
  .sp-card-cat {
    display: inline-block; font-size: 10px; font-weight: 700; color: #0A8F45;
    text-transform: uppercase; letter-spacing: .05em; margin-bottom: 5px;
  }
  .sp-card-name {
    font-size: 13px; font-weight: 700; color: #1F2A24; line-height: 1.4;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden; margin-bottom: 6px;
  }
  .sp-card-price { font-size: 15px; font-weight: 800; color: #0A8F45; margin-bottom: 10px; }
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
    position: relative; z-index: 2;
  }
  .sp-card-btn-add:hover:not(:disabled) { background: #08763A; }
  .sp-card-btn-add:disabled { opacity: .4; cursor: default; }

  /* ── Skeleton ────────────────────────────────────────────────────── */
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
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

  /* ── Infinite scroll indicators ─────────────────────────────────── */
  .sp-sentinel { height: 1px; margin-top: 16px; }
  .sp-loading-more {
    display: flex; align-items: center; justify-content: center;
    gap: 10px; padding: 28px 0; color: #667085; font-size: 13px; font-weight: 500;
  }
  .sp-loading-spinner {
    width: 20px; height: 20px; border: 2.5px solid #E8ECEA;
    border-top-color: #0A8F45; border-radius: 50%;
    animation: spin .7s linear infinite; flex-shrink: 0;
  }
  .sp-end-msg {
    text-align: center; padding: 24px 0 8px;
    font-size: 12px; color: #C8CED6; font-weight: 600; letter-spacing: .04em;
  }

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

  /* ── Search suggestions dropdown ────────────────────────────────── */
  .sp-suggest-drop {
    position: absolute; top: calc(100% + 6px); left: 0; right: 0;
    background: #fff; border: 1px solid #E8ECEA; border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,.12); z-index: 999; overflow: hidden;
  }
  .sp-suggest-item {
    width: 100%; display: flex; align-items: center; gap: 10px;
    padding: 9px 14px; background: none; border: none;
    border-bottom: 1px solid #F4F6F5; cursor: pointer;
    text-align: left; transition: background .12s; text-decoration: none;
    box-sizing: border-box;
  }
  .sp-suggest-item:hover { background: #F8FAF9; }
  .sp-suggest-item:last-of-type { border-bottom: none; }
  .sp-suggest-thumb {
    width: 38px; height: 38px; border-radius: 8px; object-fit: cover;
    background: #F0F2F1; flex-shrink: 0; display: flex; align-items: center;
    justify-content: center; overflow: hidden;
  }
  .sp-suggest-msg { padding: 10px 14px; font-size: 12px; color: #98A2B3; }
  .sp-suggest-footer {
    padding: 9px 14px; display: flex; align-items: center;
    justify-content: space-between; border-top: 1px solid #F4F6F5;
    background: #F8FAF9; font-size: 12px; cursor: pointer;
    width: 100%; border-left: none; border-right: none; border-bottom: none;
    transition: background .12s;
  }
  .sp-suggest-footer:hover { background: #EAF7EF; }

  /* ── Cart toast ──────────────────────────────────────────────────── */
  @keyframes toastSlideIn {
    from { opacity: 0; transform: translateY(-10px) scale(.97); }
    to   { opacity: 1; transform: translateY(0)    scale(1); }
  }
  .sp-toast {
    position: fixed; top: 76px; right: 20px; z-index: 9999;
    background: #fff; border: 1px solid #E8ECEA; border-radius: 14px;
    padding: 12px 14px; width: 300px; max-width: calc(100vw - 40px);
    box-shadow: 0 8px 32px rgba(0,0,0,.12);
    display: flex; align-items: flex-start; gap: 12px;
    animation: toastSlideIn .22s ease;
  }
  .sp-toast-icon {
    width: 36px; height: 36px; border-radius: 9px; background: #DDF6E7;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; font-size: 17px;
  }
  .sp-toast-close {
    background: none; border: none; cursor: pointer;
    color: #C8CED6; padding: 0; flex-shrink: 0; line-height: 1;
    transition: color .15s;
  }
  .sp-toast-close:hover { color: #667085; }
  .sp-toast-view {
    background: none; border: none; cursor: pointer; padding: 0;
    font-size: 12px; font-weight: 700; color: #0A8F45;
    margin-top: 6px; display: block; transition: opacity .15s;
  }
  .sp-toast-view:hover { opacity: .75; }
  @media (max-width: 768px) {
    .sp-toast {
      top: auto; bottom: 72px;
      right: 16px; left: 16px; width: auto;
    }
  }
`;

export default function ShopPage() {
  const params_hook = useParams<{ slug: string }>();
  const slug = params_hook?.slug || '';

  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [apiCategories, setApiCategories] = useState<string[]>([]);

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchText,     setSearchText]     = useState('');
  const [debouncedSearch,setDebouncedSearch]= useState('');
  const [sortBy,         setSortBy]         = useState('newest');
  const [priceRange,     setPriceRange]     = useState('all');
  const [stockFilter,    setStockFilter]    = useState('all');
  const [filterOpen,     setFilterOpen]     = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [headerCompact, setHeaderCompact] = useState(false);
  const [toast, setToast] = useState<{ name: string } | null>(null);

  // ── Products (all fetched, filtered client-side) ──────────────────
  const PAGE_SIZE = 16;
  const [allProducts,     setAllProducts]     = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [visibleCount,    setVisibleCount]    = useState(PAGE_SIZE);
  const sentinelRef   = useRef<HTMLDivElement>(null);
  const loadMoreFnRef = useRef<(() => void) | null>(null);

  const searchInputRef  = useRef<HTMLInputElement>(null);
  const suggestRef      = useRef<HTMLDivElement>(null);
  const suggestDebRef   = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [suggestResults, setSuggestResults] = useState<Product[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [showSuggest,    setShowSuggest]    = useState(false);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  // ── Compact header on scroll ──────────────────────────────────────
  useEffect(() => {
    function onScroll() { setHeaderCompact(window.scrollY > 48); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Search suggestions ────────────────────────────────────────────
  useEffect(() => {
    clearTimeout(suggestDebRef.current);
    if (searchText.length < 2) { setSuggestResults([]); setShowSuggest(false); return; }
    suggestDebRef.current = setTimeout(async () => {
      if (!slug) return;
      setSuggestLoading(true);
      try {
        const res  = await fetch(`/api/public/shop/${slug}/products?q=${encodeURIComponent(searchText)}&limit=6`);
        const data = await res.json();
        setSuggestResults(data?.data ?? []);
        setShowSuggest(true);
      } catch { /* ignore */ }
      finally { setSuggestLoading(false); }
    }, 200);
    return () => clearTimeout(suggestDebRef.current);
  }, [searchText, slug]);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) {
        setShowSuggest(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  // ── Toast auto-dismiss ────────────────────────────────────────────
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

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
  const stockLabel = (stock: number) => stock <= 0 ? 'Rupture' : stock <= 5 ? `Plus que ${stock} en stock !` : 'En stock';
  const stockTone = (stock: number) => stock <= 0
    ? { color: '#dc2626', bg: '#fff1f2' }
    : stock <= 5
      ? { color: '#F08A24', bg: '#FFF1E5' }
      : { color: '#0A8F45', bg: '#DDF6E7' };

  // ── Product card ──────────────────────────────────────────────────
  const renderProductCard = (product: Product, idx: number) => {
    const tone  = stockTone(product.stock);
    const isFav = favorites.has(product.id);
    const delay = Math.min(idx % PAGE_SIZE, 11) * 50;
    return (
      <article key={product.id} className="sp-card" style={{ animationDelay: `${delay}ms` }}>
        {/* Card-link — covers full surface, z-index: 1 */}
        <Link
          href={`/shop/${slug}/products/${product.id}`}
          className="sp-card-link"
          aria-label={`Voir ${product.name}`}
        />

        <div className="sp-card-img-wrap">
          {product.imageUrl
            ? <img src={product.imageUrl} alt="" className="sp-card-img" />
            : <div className="sp-card-img" style={{ background: '#F0F2F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>📦</div>
          }
          <div className="sp-card-overlay" aria-hidden>
            <span className="sp-card-overlay-label">Voir le produit →</span>
          </div>
          <div
            className={`sp-card-stock${product.stock > 0 && product.stock <= 5 ? ' sp-card-stock-urgent' : ''}`}
            style={{ background: tone.bg, color: tone.color }}
          >
            {stockLabel(product.stock)}
          </div>
          {/* z-index: 3 via CSS — au-dessus du card-link */}
          <button className="sp-card-fav" onClick={() => toggleFavorite(product.id, product)}>
            <span style={{ fontSize: 14, color: isFav ? '#EF4444' : '#D0D5DD' }}>{isFav ? '♥' : '♡'}</span>
          </button>
          {product.stock > 0 && (
            <button
              className="sp-card-quick-add"
              title="Ajouter au panier"
              onClick={() => { addToCart(product); setToast({ name: product.name }); }}
            >
              <Plus style={{ width: 15, height: 15 }} />
            </button>
          )}
        </div>

        <div className="sp-card-body">
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
            {(product.category || product.categories?.[0]) && (
              <div className="sp-card-cat">{product.category || product.categories![0]}</div>
            )}
            {product.hasVariants && (
              <div style={{ fontSize: 9, fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: ".06em", background: "#F4F6F5", borderRadius: 4, padding: "2px 5px", flexShrink: 0 }}>
                Variantes
              </div>
            )}
          </div>
          <div className="sp-card-name">{product.name}</div>
          <div className="sp-card-price">
            {product.hasVariants ? `Dès ${formatPrice(product.unitPrice)}` : formatPrice(product.unitPrice)}
          </div>
          {/* z-index: 2 via CSS — "Voir" supprimé */}
          <button
            className="sp-card-btn-add"
            disabled={product.stock <= 0}
            onClick={() => { if (product.stock > 0) { addToCart(product); setToast({ name: product.name }); } }}
          >
            {product.stock <= 0 ? 'Rupture' : 'Ajouter au panier'}
          </button>
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

  // ── Fetch all products (server: text search only) ─────────────────
  useEffect(() => {
    if (!slug) return;
    setProductsLoading(true);
    setAllProducts([]);
    setVisibleCount(PAGE_SIZE);
    let cancelled = false;
    (async () => {
      try {
        const p = new URLSearchParams();
        if (debouncedSearch) p.append('q', debouncedSearch);
        const res = await fetch(`/api/public/shop/${slug}/products?${p}`);
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (cancelled) return;
        setAllProducts(data?.data ?? []);
        if (data.meta?.categories) setApiCategories(data.meta.categories);
      } catch {
        if (!cancelled) setAllProducts([]);
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug, debouncedSearch]);

  // ── Reset visible count on any client filter change ───────────────
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [activeCategory, priceRange, stockFilter, sortBy, debouncedSearch]);

  // ── Sentinel increments visibleCount (no more API calls) ─────────
  const loadMore = () => setVisibleCount(c => c + PAGE_SIZE);
  loadMoreFnRef.current = loadMore;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) loadMoreFnRef.current?.();
    }, { rootMargin: '0px 0px 300px 0px', threshold: 0 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

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

  // ── Client-side filter + sort ─────────────────────────────────────
  let filteredProducts = allProducts;
  if (activeCategory !== 'all') {
    filteredProducts = filteredProducts.filter(p =>
      p.category === activeCategory || (p.categories ?? []).includes(activeCategory)
    );
  }
  if      (priceRange === '0-25000')      filteredProducts = filteredProducts.filter(p => +p.unitPrice <= 25000);
  else if (priceRange === '25000-50000')  filteredProducts = filteredProducts.filter(p => +p.unitPrice > 25000 && +p.unitPrice <= 50000);
  else if (priceRange === '50000+')       filteredProducts = filteredProducts.filter(p => +p.unitPrice > 50000);
  if      (stockFilter === 'in')  filteredProducts = filteredProducts.filter(p => p.stock > 0);
  else if (stockFilter === 'low') filteredProducts = filteredProducts.filter(p => p.stock > 0 && p.stock <= 5);
  else if (stockFilter === 'out') filteredProducts = filteredProducts.filter(p => p.stock <= 0);
  if (sortBy !== 'newest') {
    filteredProducts = [...filteredProducts].sort((a, b) =>
      sortBy === 'price_asc'  ? +a.unitPrice - +b.unitPrice :
      sortBy === 'price_desc' ? +b.unitPrice - +a.unitPrice :
      a.name.localeCompare(b.name, 'fr')
    );
  }
  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const hasMore            = displayedProducts.length < filteredProducts.length;

  const PRICE_LABEL: Record<string, string> = {
    '0-25000': '< 25 000 FCFA', '25000-50000': '25 – 50 000 FCFA', '50000+': '50 000+ FCFA',
  };
  const STOCK_LABEL: Record<string, string> = {
    'in': 'En stock', 'low': 'Stock faible', 'out': 'Rupture',
  };
  const activeFilterCount = (priceRange !== 'all' ? 1 : 0) + (stockFilter !== 'all' ? 1 : 0) + (sortBy !== 'newest' ? 1 : 0);

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

          <div ref={suggestRef} className="sp-search-bar">
            <Search size={15} className="sp-search-icon-pos" />
            <input
              ref={searchInputRef}
              type="text"
              className="sp-search-input"
              placeholder="Rechercher un produit…"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onFocus={() => suggestResults.length > 0 && setShowSuggest(true)}
            />

            {showSuggest && (
              <div className="sp-suggest-drop">
                {suggestLoading && <div className="sp-suggest-msg">Recherche…</div>}

                {!suggestLoading && suggestResults.length === 0 && (
                  <div className="sp-suggest-msg">Aucun résultat pour « {searchText} »</div>
                )}

                {!suggestLoading && suggestResults.map(p => (
                  <Link
                    key={p.id}
                    href={`/shop/${slug}/products/${p.id}`}
                    className="sp-suggest-item"
                    onClick={() => { setShowSuggest(false); setSearchText(''); }}
                  >
                    <div className="sp-suggest-thumb">
                      {p.imageUrl
                        ? <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: 18 }}>📦</span>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2A24', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.name}
                      </div>
                      {p.category && (
                        <div style={{ fontSize: 11, color: '#98A2B3', marginTop: 1 }}>{p.category}</div>
                      )}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0A8F45', flexShrink: 0 }}>
                      {formatPrice(p.unitPrice)}
                    </div>
                  </Link>
                ))}

                {!suggestLoading && suggestResults.length > 0 && (
                  <button className="sp-suggest-footer" onClick={() => setShowSuggest(false)}>
                    <span style={{ color: '#667085' }}>Voir tous les résultats</span>
                    <span style={{ fontWeight: 700, color: '#0A8F45' }}>
                      {suggestResults.length} produit{suggestResults.length > 1 ? 's' : ''} →
                    </span>
                  </button>
                )}
              </div>
            )}
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
            <div className="sp-stat-val">{shop.productsCount || allProducts.length || '—'}</div>
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
          <button
            className={`sp-filter-btn${activeFilterCount > 0 ? ' has-active' : ''}`}
            onClick={() => setFilterOpen(true)}
          >
            ⚙ Filtres
            {activeFilterCount > 0 && <span className="sp-filter-badge">{activeFilterCount}</span>}
          </button>

          <select className="sp-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="newest">Plus récents</option>
            <option value="price_asc">Prix ↑</option>
            <option value="price_desc">Prix ↓</option>
            <option value="name_asc">Nom A–Z</option>
          </select>

          {priceRange !== 'all' && (
            <span className="sp-active-chip">
              {PRICE_LABEL[priceRange]}
              <button onClick={() => setPriceRange('all')} aria-label="Retirer filtre prix"><X size={10} /></button>
            </span>
          )}
          {stockFilter !== 'all' && (
            <span className="sp-active-chip">
              {STOCK_LABEL[stockFilter]}
              <button onClick={() => setStockFilter('all')} aria-label="Retirer filtre disponibilité"><X size={10} /></button>
            </span>
          )}

          <span className="sp-count">{filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''}</span>
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
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '72px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>📦</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2A24', marginBottom: 6 }}>Aucun produit disponible</div>
            <div style={{ fontSize: 13, color: '#98A2B3' }}>
              {activeFilterCount > 0 || activeCategory !== 'all'
                ? 'Aucun produit ne correspond à ces filtres'
                : 'Cette boutique n\'a pas encore de produits'}
            </div>
            {(activeFilterCount > 0 || activeCategory !== 'all') && (
              <button
                onClick={() => { setPriceRange('all'); setStockFilter('all'); setSortBy('newest'); setActiveCategory('all'); }}
                style={{ marginTop: 14, height: 36, padding: '0 16px', background: '#0A8F45', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="sp-grid">
            {displayedProducts.map((product, idx) => renderProductCard(product, idx))}
          </div>
        )}

        {/* ── Virtual scroll sentinel ───────────────────────── */}
        {filteredProducts.length > 0 && (
          <>
            <div ref={sentinelRef} className="sp-sentinel" aria-hidden />
            {hasMore && (
              <div className="sp-loading-more">
                <div className="sp-loading-spinner" />
                Chargement des produits…
              </div>
            )}
            {!hasMore && !productsLoading && filteredProducts.length >= PAGE_SIZE && (
              <div className="sp-end-msg">— Tous les produits sont affichés —</div>
            )}
          </>
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

      {/* ── Cart toast ───────────────────────────────────────────────── */}
      {toast && (
        <div className="sp-toast" role="alert">
          <div className="sp-toast-icon">✓</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1F2A24' }}>Ajouté au panier</div>
            <div style={{ fontSize: 12, color: '#667085', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
              {toast.name}
            </div>
            <button
              className="sp-toast-view"
              onClick={() => { setToast(null); setCartOpen(true); }}
            >
              Voir le panier ({cartCount}) →
            </button>
          </div>
          <button className="sp-toast-close" onClick={() => setToast(null)} aria-label="Fermer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Filter drawer ────────────────────────────────────────────── */}
      {filterOpen && (
        <>
          <div className="sp-filter-backdrop" onClick={() => setFilterOpen(false)} />
          <div className="sp-filter-drawer" role="dialog" aria-label="Filtres">
            {/* Header */}
            <div style={{ padding: '0 20px', height: 60, borderBottom: '1px solid #E8ECEA', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ fontWeight: 800, fontSize: 16, color: '#1F2A24' }}>Filtres</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => { setPriceRange('all'); setStockFilter('all'); setSortBy('newest'); }}
                    style={{ height: 32, padding: '0 12px', background: 'none', border: '1.5px solid #E8ECEA', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#667085' }}
                  >
                    Réinitialiser
                  </button>
                )}
                <button
                  onClick={() => setFilterOpen(false)}
                  style={{ width: 34, height: 34, border: '1.5px solid #E8ECEA', borderRadius: 8, background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#667085' }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Sections */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {/* Sort */}
              <div className="sp-filter-section">
                <div className="sp-filter-section-title">Tri</div>
                <div className="sp-filter-chips">
                  {([
                    { v: 'newest',     l: 'Plus récents' },
                    { v: 'price_asc',  l: 'Prix croissant' },
                    { v: 'price_desc', l: 'Prix décroissant' },
                    { v: 'name_asc',   l: 'Nom A–Z' },
                  ] as const).map(({ v, l }) => (
                    <button key={v} className={`sp-filter-chip${sortBy === v ? ' active' : ''}`} onClick={() => setSortBy(v)}>{l}</button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="sp-filter-section">
                <div className="sp-filter-section-title">Prix</div>
                <div className="sp-filter-chips">
                  {([
                    { v: 'all',         l: 'Tous les prix' },
                    { v: '0-25000',     l: '< 25 000 FCFA' },
                    { v: '25000-50000', l: '25 – 50 000 FCFA' },
                    { v: '50000+',      l: '50 000+ FCFA' },
                  ] as const).map(({ v, l }) => (
                    <button key={v} className={`sp-filter-chip${priceRange === v ? ' active' : ''}`} onClick={() => setPriceRange(v)}>{l}</button>
                  ))}
                </div>
              </div>

              {/* Stock */}
              <div className="sp-filter-section">
                <div className="sp-filter-section-title">Disponibilité</div>
                <div className="sp-filter-chips">
                  {([
                    { v: 'all', l: 'Tous' },
                    { v: 'in',  l: '✓ En stock' },
                    { v: 'low', l: '⚠ Stock faible' },
                    { v: 'out', l: '✗ Rupture' },
                  ] as const).map(({ v, l }) => (
                    <button key={v} className={`sp-filter-chip${stockFilter === v ? ' active' : ''}`} onClick={() => setStockFilter(v)}>{l}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer CTA */}
            <div style={{ padding: 20, borderTop: '1px solid #E8ECEA', flexShrink: 0 }}>
              <button
                onClick={() => setFilterOpen(false)}
                style={{ width: '100%', height: 44, background: '#0A8F45', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              >
                Voir {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </>
      )}

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

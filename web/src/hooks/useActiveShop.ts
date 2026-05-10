"use client";
import { useEffect, useState } from "react";

const STORAGE_KEY = "biz_active_shop_id";

export function useActiveShop(fallback: string) {
  const [activeShopId, setActiveShopIdRaw] = useState(fallback);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setActiveShopIdRaw(stored);
  }, []);

  function setActiveShopId(id: string) {
    localStorage.setItem(STORAGE_KEY, id);
    setActiveShopIdRaw(id);
  }

  return [activeShopId, setActiveShopId] as const;
}

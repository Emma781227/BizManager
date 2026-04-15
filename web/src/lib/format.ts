export function formatPrice(value: number | string, fractionDigits = 0) {
  const numeric = typeof value === "number" ? value : Number(value);
  const safe = Number.isFinite(numeric) ? numeric : 0;

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(safe);
}

export function formatPriceCFA(value: number | string, fractionDigits = 0) {
  return `${formatPrice(value, fractionDigits)} CFA`;
}
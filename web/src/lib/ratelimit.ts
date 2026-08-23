/**
 * Rate limiter - compteur en fenêtre fixe, stockage en mémoire (globalThis).
 *
 * ⚠️  Limite de déploiement : sur Vercel / serverless multi-instances,
 * chaque instance Node.js a son propre compteur. La protection reste efficace
 * contre les bots simples et les attaques mono-instance, mais n'est pas
 * absolue sous forte charge distribuée.
 *
 * Upgrade recommandé pour la prod à fort trafic :
 *   → Upstash Redis + @upstash/ratelimit (même interface, drop-in replacement)
 *   https://github.com/upstash/ratelimit-js
 */

type WindowEntry = { count: number; resetAt: number };

// Persistance entre les rechargements Next.js (dev) et entre les requêtes (prod mono-instance)
declare const globalThis: { __rlStore?: Map<string, WindowEntry> };
const store: Map<string, WindowEntry> = (globalThis.__rlStore ??= new Map());

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfter: number };

/**
 * Vérifie si la clé a dépassé la limite dans la fenêtre donnée.
 * Incrémente le compteur si la requête est autorisée.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  return { allowed: true };
}

/**
 * Extrait l'IP réelle du client.
 * Compatible Vercel (x-forwarded-for), Cloudflare (cf-connecting-ip) et proxies standards.
 */
export function getClientIp(request: Request): string {
  const h = request.headers as Headers;
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    h.get("cf-connecting-ip") ??
    "unknown"
  );
}

/**
 * Log structuré des tentatives bloquées - traceable dans les logs Vercel / serveur.
 * À remplacer par un vrai service de logging (Sentry, Datadog, etc.) si nécessaire.
 */
export function logAbuse(data: {
  ip: string;
  slug: string;
  reason: string;
  ua?: string;
}): void {
  console.warn(
    JSON.stringify({
      level: "WARN",
      event: "abuse_blocked",
      timestamp: new Date().toISOString(),
      ...data,
    }),
  );
}

// Nettoyage des entrées expirées toutes les minutes (évite les fuites mémoire en dev / longue durée)
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now >= entry.resetAt) store.delete(key);
    }
  }, 60_000);
  // Ne pas bloquer la fermeture du process sur ce timer
  timer.unref?.();
}

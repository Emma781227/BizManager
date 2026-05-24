const BASE_URL    = process.env.GENIUSPAY_BASE_URL    ?? "https://pay.genius.ci/api/v1/merchant";
const API_KEY     = process.env.GENIUSPAY_API_KEY     ?? "";
const API_SECRET  = process.env.GENIUSPAY_API_SECRET  ?? "";
export const WEBHOOK_SECRET = process.env.GENIUSPAY_WEBHOOK_SECRET ?? "";

function headers() {
  return {
    "X-API-Key":    API_KEY,
    "X-API-Secret": API_SECRET,
    "Content-Type": "application/json",
  };
}

export type InitiatePaymentParams = {
  amount:      number;
  currency:    string;
  description: string;
  customer: {
    name:   string;
    email:  string;
    phone?: string;
  };
  successUrl: string;
  errorUrl:   string;
  metadata?:  Record<string, string>;
};

export type InitiatePaymentResult = {
  checkoutUrl:       string;
  providerReference: string;
  providerPaymentId: string;
};

export async function initiatePayment(
  params: InitiatePaymentParams,
): Promise<InitiatePaymentResult> {
  const res = await fetch(`${BASE_URL}/payments`, {
    method:  "POST",
    headers: headers(),
    body: JSON.stringify({
      amount:      params.amount,
      currency:    params.currency,
      description: params.description,
      customer:    params.customer,
      success_url: params.successUrl,
      error_url:   params.errorUrl,
      metadata:    params.metadata,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as Record<string, unknown>;
    const errObj = err.error as Record<string, unknown> | undefined;
    const msg = (errObj?.message ?? err.message ?? err.error ?? "Erreur GeniusPay") as string;
    throw new Error(msg);
  }

  const json = await res.json() as Record<string, unknown>;
  // La réponse peut être { data: {...} } ou directement l'objet
  const data = (json.data ?? json) as Record<string, unknown>;

  return {
    checkoutUrl:       (data.checkout_url ?? data.payment_url ?? "") as string,
    providerReference: (data.reference ?? "") as string,
    providerPaymentId: (data.id ?? "") as string,
  };
}

// Vérifie la signature du webhook : HMAC-SHA256(timestamp + "." + body, secret)
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
  timestamp: string | null,
): boolean {
  if (!WEBHOOK_SECRET || !signature || !timestamp) return false;
  const { createHmac, timingSafeEqual } = require("crypto") as typeof import("crypto");
  const toSign = `${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", WEBHOOK_SECRET).update(toSign, "utf8").digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

// Vérifie que le timestamp du webhook est dans la fenêtre de 5 minutes
export function verifyWebhookTimestamp(timestamp: string | null): boolean {
  if (!timestamp) return true;
  const ts = Number(timestamp) * 1000;
  if (isNaN(ts)) return false;
  return Math.abs(Date.now() - ts) <= 5 * 60 * 1000;
}

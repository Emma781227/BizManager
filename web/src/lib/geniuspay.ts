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
  reference:   string;
  amount:      number;
  currency:    string;
  description: string;
  customer: {
    name:   string;
    email:  string;
    phone?: string;
  };
  returnUrl:  string;
  webhookUrl: string;
};

export type InitiatePaymentResult = {
  checkoutUrl:       string;
  providerReference: string;
  providerPaymentId: string;
};

export async function initiatePayment(
  params: InitiatePaymentParams,
): Promise<InitiatePaymentResult> {
  const res = await fetch(`${BASE_URL}/payments/initiate`, {
    method:  "POST",
    headers: headers(),
    body: JSON.stringify({
      reference:   params.reference,
      amount:      params.amount,
      currency:    params.currency,
      description: params.description,
      customer:    params.customer,
      return_url:  params.returnUrl,
      webhook_url: params.webhookUrl,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as Record<string, unknown>;
    const msg = (err.message ?? err.error ?? "Erreur GeniusPay") as string;
    throw new Error(msg);
  }

  const data = await res.json() as Record<string, unknown>;

  return {
    checkoutUrl:       (data.checkout_url ?? data.checkoutUrl ?? "") as string,
    providerReference: (data.reference ?? data.transaction_reference ?? params.reference) as string,
    providerPaymentId: (data.payment_id ?? data.id ?? "") as string,
  };
}

// Vérifie que le timestamp du webhook est dans la fenêtre de 5 minutes
export function verifyWebhookTimestamp(timestampValue: unknown): boolean {
  if (!timestampValue) return true; // pas de timestamp → on accepte
  const ts = typeof timestampValue === "number"
    ? timestampValue * 1000
    : new Date(timestampValue as string).getTime();
  return Math.abs(Date.now() - ts) <= 5 * 60 * 1000;
}

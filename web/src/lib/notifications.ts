import { sendEmail } from "@/lib/mailer";

type StockZeroNotificationInput = {
  shopName: string;
  productName: string;
  productId: string;
  merchantPhone: string;
  merchantEmail?: string | null;
};

function normalizePhone(value: string) {
  return value.replace(/[^\d]/g, "");
}

async function sendEmailStockZeroAlert(input: StockZeroNotificationInput) {
  if (!input.merchantEmail) {
    return;
  }

  await sendEmail({
    to: input.merchantEmail,
    subject: `[${input.shopName}] Stock epuise: ${input.productName}`,
    text: [
      `Bonjour,`,
      "",
      `Le produit \"${input.productName}\" est maintenant en rupture de stock.`,
      `ID produit: ${input.productId}`,
      "",
      "Pensez a reapprovisionner ce produit pour continuer a recevoir des commandes.",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937">
        <h2 style="margin:0 0 16px">${input.shopName} - stock epuise</h2>
        <p style="margin:0 0 16px">Le produit <strong>${input.productName}</strong> est maintenant en rupture de stock.</p>
        <p style="margin:0 0 16px">ID produit: <strong>${input.productId}</strong></p>
        <p style="margin:0">Pensez a reapprovisionner ce produit pour continuer a recevoir des commandes.</p>
      </div>
    `,
  });
}

async function sendWhatsAppStockZeroAlert(input: StockZeroNotificationInput) {
  const accessToken = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    return;
  }

  const to = normalizePhone(input.merchantPhone);
  if (!to) {
    return;
  }

  const body = [
    `Alerte stock - ${input.shopName}`,
    `Produit: ${input.productName}`,
    `ID produit: ${input.productId}`,
    "Statut: rupture de stock",
  ].join("\n");

  const response = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`WhatsApp API error: ${response.status} ${text}`.trim());
  }
}

export async function sendStockZeroNotifications(input: StockZeroNotificationInput) {
  const results = await Promise.allSettled([
    sendEmailStockZeroAlert(input),
    sendWhatsAppStockZeroAlert(input),
  ]);

  const rejected = results.find((result) => result.status === "rejected");
  if (rejected && rejected.status === "rejected") {
    console.error("Stock zero notification error:", rejected.reason);
  }
}

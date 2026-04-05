import nodemailer from "nodemailer";

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

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "0");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !port || !user || !pass || !from) {
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
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

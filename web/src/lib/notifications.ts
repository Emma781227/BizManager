import { sendEmail } from "@/lib/mailer";

function formatCFA(amount: number) {
  return `${Math.round(amount).toLocaleString("fr-FR")} FCFA`;
}

type NewOrderItem = {
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type NewOrderNotificationInput = {
  shopName: string;
  merchantEmail: string | null | undefined;
  orderId: string;
  customerName: string;
  customerPhone: string;
  address?: string | null;
  note?: string | null;
  items: NewOrderItem[];
  totalAmount: number;
};

export async function sendNewOrderNotification(input: NewOrderNotificationInput) {
  if (!input.merchantEmail) return;

  const itemsText = input.items
    .map(i => `  - ${i.productName} × ${i.quantity} = ${formatCFA(i.lineTotal)}`)
    .join("\n");

  const itemsHtml = input.items.map(i => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f2f1">${i.productName}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f2f1;text-align:center">${i.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f2f1;text-align:right">${formatCFA(i.unitPrice)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f2f1;text-align:right;font-weight:600">${formatCFA(i.lineTotal)}</td>
    </tr>`).join("");

  const text = [
    `Bonjour ${input.shopName},`,
    "",
    `Nouvelle commande reçue ! (Réf. ${input.orderId})`,
    "",
    "CLIENT",
    `  Nom : ${input.customerName}`,
    `  Téléphone : ${input.customerPhone}`,
    ...(input.address ? [`  Adresse : ${input.address}`] : []),
    ...(input.note    ? [`  Remarque : ${input.note}`]   : []),
    "",
    "ARTICLES",
    itemsText,
    "",
    `TOTAL : ${formatCFA(input.totalAmount)}`,
    "",
    "Connectez-vous à BizManager pour traiter cette commande.",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937;max-width:520px;margin:0 auto">
      <div style="background:#0A8F45;padding:20px 24px;border-radius:12px 12px 0 0">
        <h2 style="margin:0;color:#fff;font-size:18px">Nouvelle commande — ${input.shopName}</h2>
      </div>
      <div style="background:#fff;padding:24px;border:1px solid #e8ecea;border-top:none;border-radius:0 0 12px 12px">

        <p style="margin:0 0 4px;font-size:11px;color:#667085;text-transform:uppercase;letter-spacing:.05em">Référence</p>
        <p style="margin:0 0 20px;font-size:14px;font-weight:700;color:#1f2937">${input.orderId}</p>

        <p style="margin:0 0 8px;font-size:11px;color:#667085;text-transform:uppercase;letter-spacing:.05em">Client</p>
        <div style="background:#f8faf9;border-radius:10px;padding:14px 16px;margin-bottom:20px">
          <div style="font-weight:700;color:#1f2937">${input.customerName}</div>
          <div style="color:#667085;font-size:13px;margin-top:4px">${input.customerPhone}</div>
          ${input.address ? `<div style="color:#667085;font-size:13px;margin-top:4px">${input.address}</div>` : ""}
          ${input.note    ? `<div style="color:#92600a;font-size:13px;margin-top:6px;font-style:italic">Remarque : ${input.note}</div>` : ""}
        </div>

        <p style="margin:0 0 8px;font-size:11px;color:#667085;text-transform:uppercase;letter-spacing:.05em">Articles</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">
          <thead>
            <tr style="background:#f8faf9">
              <th style="padding:8px 12px;text-align:left;font-weight:600;color:#667085">Produit</th>
              <th style="padding:8px 12px;text-align:center;font-weight:600;color:#667085">Qté</th>
              <th style="padding:8px 12px;text-align:right;font-weight:600;color:#667085">P.U.</th>
              <th style="padding:8px 12px;text-align:right;font-weight:600;color:#667085">Total</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>

        <div style="text-align:right;margin-bottom:24px">
          <span style="display:inline-block;background:#eaf7ef;border-radius:10px;padding:12px 18px">
            <span style="display:block;font-size:11px;color:#667085;margin-bottom:4px">Total</span>
            <span style="font-size:20px;font-weight:800;color:#0A8F45">${formatCFA(input.totalAmount)}</span>
          </span>
        </div>

        <div style="padding:14px 16px;background:#eff8ff;border-radius:10px;border:1px solid #bfdbfe">
          <p style="margin:0;font-size:13px;color:#1e40af">
            Connectez-vous à <strong>BizManager</strong> pour confirmer et traiter cette commande.
          </p>
        </div>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      to: input.merchantEmail,
      subject: `[${input.shopName}] Nouvelle commande — ${input.orderId.slice(-8).toUpperCase()}`,
      text,
      html,
    });
  } catch (err) {
    console.error("Erreur envoi notification commande:", err);
  }
}

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

export const LOW_STOCK_THRESHOLD = 5;

type LowStockNotificationInput = {
  shopName: string;
  merchantEmail: string | null | undefined;
  productName: string;
  productId: string;
  remainingStock: number;
};

export async function sendLowStockNotification(input: LowStockNotificationInput) {
  if (!input.merchantEmail) return;

  const units = input.remainingStock > 1 ? "unités" : "unité";

  const text = [
    `Bonjour,`,
    "",
    `Le produit "${input.productName}" approche de la rupture de stock.`,
    `Stock restant : ${input.remainingStock} ${units}`,
    `ID produit : ${input.productId}`,
    "",
    "Pensez à réapprovisionner ce produit bientôt.",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937;max-width:480px;margin:0 auto">
      <div style="background:#F08A24;padding:18px 22px;border-radius:12px 12px 0 0">
        <h2 style="margin:0;color:#fff;font-size:16px">Stock faible — ${input.shopName}</h2>
      </div>
      <div style="background:#fff;padding:22px;border:1px solid #e8ecea;border-top:none;border-radius:0 0 12px 12px">
        <p style="margin:0 0 14px;font-size:14px;color:#1f2937">
          Le produit <strong>${input.productName}</strong> approche de la rupture de stock.
        </p>
        <div style="display:inline-block;background:#FFF1E5;border:1px solid #FFD19A;border-radius:10px;padding:12px 20px;margin-bottom:16px">
          <div style="font-size:11px;color:#92600A;margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em">Stock restant</div>
          <div style="font-size:28px;font-weight:800;color:#F08A24">${input.remainingStock} ${units}</div>
        </div>
        <p style="margin:0 0 16px;font-size:12px;color:#667085">ID produit : ${input.productId}</p>
        <div style="padding:12px 14px;background:#eff8ff;border-radius:10px;border:1px solid #bfdbfe">
          <p style="margin:0;font-size:13px;color:#1e40af">
            Connectez-vous à <strong>BizManager</strong> pour réapprovisionner ce produit.
          </p>
        </div>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      to: input.merchantEmail,
      subject: `[${input.shopName}] Stock faible : ${input.productName} (${input.remainingStock} ${units})`,
      text,
      html,
    });
  } catch (err) {
    console.error("Erreur envoi alerte stock faible:", err);
  }
}

import nodemailer, { type Transporter } from "nodemailer";

type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
};

type SendEmailOptions = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

let transporterPromise: Promise<Transporter> | null = null;

function parsePort(value: string | undefined) {
  if (!value) {
    return null;
  }

  const port = Number(value);
  return Number.isInteger(port) && port > 0 ? port : null;
}

export function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const port = parsePort(process.env.SMTP_PORT);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.SMTP_FROM?.trim() || (user ? `BizManager <${user}>` : "");

  if (!host || !port || !user || !pass || !from) {
    return null;
  }

  return { host, port, user, pass, from };
}

function throwMailerConfigError(): never {
  throw new Error(
    "Service email non configure. Definissez SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS et SMTP_FROM.",
  );
}

export async function createMailerTransporter() {
  const config = getSmtpConfig();

  if (!config) {
    throwMailerConfigError();
  }

  if (!transporterPromise) {
    transporterPromise = (async () => {
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.port === 465,
        auth: {
          user: config.user,
          pass: config.pass,
        },
      });

      await transporter.verify();
      return transporter;
    })().catch((error) => {
      transporterPromise = null;
      throw error;
    });
  }

  return transporterPromise;
}

export async function sendEmail(options: SendEmailOptions) {
  const config = getSmtpConfig();

  if (!config) {
    throwMailerConfigError();
  }

  const transporter = await createMailerTransporter();

  return transporter.sendMail({
    from: config.from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}

function buildCodeEmail(code: string, title: string, intro: string) {
  return {
    text: [
      "Bonjour,",
      "",
      intro,
      "",
      `Code: ${code}`,
      "",
      "Ce code expire dans 10 minutes.",
      "Si vous n'avez pas demande cette action, ignorez cet email.",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937">
        <h2 style="margin:0 0 16px">${title}</h2>
        <p style="margin:0 0 16px">${intro}</p>
        <div style="display:inline-block;padding:12px 18px;border-radius:12px;background:#e8f5ef;color:#166b4a;font-size:24px;font-weight:700;letter-spacing:4px;">
          ${code}
        </div>
        <p style="margin:16px 0 0">Ce code expire dans 10 minutes.</p>
        <p style="margin:8px 0 0;color:#6b7280">Si vous n'avez pas demande cette action, ignorez cet email.</p>
      </div>
    `,
  };
}

export async function sendVerificationCodeEmail(email: string, code: string) {
  const message = buildCodeEmail(
    code,
    "Code de verification BizManager",
    "Voici votre code de verification BizManager :",
  );

  await sendEmail({
    to: email,
    subject: "Code de verification BizManager",
    text: message.text,
    html: message.html,
  });
}

export async function sendPasswordResetCodeEmail(email: string, code: string) {
  const message = buildCodeEmail(
    code,
    "Code de reinitialisation BizManager",
    "Voici votre code de reinitialisation BizManager :",
  );

  await sendEmail({
    to: email,
    subject: "Code de reinitialisation BizManager",
    text: message.text,
    html: message.html,
  });
}

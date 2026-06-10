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

function normalizeEnv(value: string | undefined) {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();

  // Support values entered with quotes in hosted env UIs (e.g. "587").
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function parsePort(value: string | undefined) {
  const normalized = normalizeEnv(value);

  if (!normalized) {
    return null;
  }

  const port = Number(normalized);
  return Number.isInteger(port) && port > 0 ? port : null;
}

export function getSmtpConfig(): SmtpConfig | null {
  const host = normalizeEnv(process.env.SMTP_HOST);
  const port = parsePort(process.env.SMTP_PORT);
  const user = normalizeEnv(process.env.SMTP_USER);
  const pass = normalizeEnv(process.env.SMTP_PASS);
  const from = normalizeEnv(process.env.SMTP_FROM) || (user ? `BizManager <${user}>` : "");

  if (!host || !port || !user || !pass || !from) {
    console.error("SMTP configuration is incomplete:", {
      hasHost: Boolean(host),
      hasPort: Boolean(port),
      hasUser: Boolean(user),
      hasPass: Boolean(pass),
      hasFrom: Boolean(from),
      rawPort: process.env.SMTP_PORT,
    });
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

export async function sendTeamInvitationEmail(params: {
  to:        string;
  ownerName: string;
  role:      string;
  inviteUrl: string;
  expiresAt: Date;
}): Promise<void> {
  const roleLabels: Record<string, string> = {
    manager: "Manager",
    staff:   "Employe",
  };
  const roleLabel = roleLabels[params.role] ?? params.role;
  const expiry    = params.expiresAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  await sendEmail({
    to:      params.to,
    subject: `${params.ownerName} vous invite a rejoindre BizManager`,
    text: [
      `Bonjour,`,
      ``,
      `${params.ownerName} vous invite a rejoindre son equipe BizManager en tant que ${roleLabel}.`,
      ``,
      `Acceptez l'invitation ici : ${params.inviteUrl}`,
      ``,
      `Ce lien expire le ${expiry}.`,
      `Si vous n'attendiez pas cet email, ignorez-le.`,
    ].join("\n"),
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
        <div style="text-align:center;margin-bottom:28px;">
          <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:#0A8F45;border-radius:12px;color:#fff;font-weight:800;font-size:20px;">BM</div>
        </div>
        <h1 style="font-size:22px;font-weight:800;color:#1F2A24;margin:0 0 12px;">Vous avez ete invite(e) !</h1>
        <p style="font-size:15px;color:#667085;line-height:1.6;margin:0 0 20px;">
          <strong style="color:#1F2A24">${params.ownerName}</strong> vous invite a rejoindre son equipe BizManager en tant que <strong style="color:#0A8F45">${roleLabel}</strong>.
        </p>
        <a href="${params.inviteUrl}" style="display:block;text-align:center;background:#0A8F45;color:#fff;padding:14px 0;border-radius:12px;font-size:15px;font-weight:700;text-decoration:none;margin-bottom:20px;">
          Accepter l'invitation
        </a>
        <p style="font-size:12px;color:#98A2B3;text-align:center;margin:0;">
          Ce lien expire le ${expiry}. Si vous n'attendiez pas cet email, ignorez-le.
        </p>
      </div>
    `,
  });
}

export async function sendTeamMemberJoinedEmail(params: {
  to:          string;
  memberName:  string;
  memberEmail: string;
  role:        string;
  teamPageUrl: string;
}): Promise<void> {
  const roleLabels: Record<string, string> = {
    manager: "Manager",
    staff:   "Employe",
  };
  const roleLabel = roleLabels[params.role] ?? params.role;

  await sendEmail({
    to:      params.to,
    subject: `${params.memberName} a rejoint votre equipe BizManager`,
    text: [
      `Bonjour,`,
      ``,
      `${params.memberName} (${params.memberEmail}) a accepte votre invitation et a rejoint votre equipe en tant que ${roleLabel}.`,
      ``,
      `Gerez votre equipe ici : ${params.teamPageUrl}`,
    ].join("\n"),
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
        <div style="text-align:center;margin-bottom:28px;">
          <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:#0A8F45;border-radius:12px;color:#fff;font-weight:800;font-size:20px;">BM</div>
        </div>
        <h1 style="font-size:22px;font-weight:800;color:#1F2A24;margin:0 0 12px;">Nouveau membre dans votre equipe !</h1>
        <p style="font-size:15px;color:#667085;line-height:1.6;margin:0 0 8px;">
          <strong style="color:#1F2A24">${params.memberName}</strong> a accepte votre invitation et a rejoint votre equipe en tant que <strong style="color:#0A8F45">${roleLabel}</strong>.
        </p>
        <p style="font-size:13px;color:#98A2B3;margin:0 0 24px;">${params.memberEmail}</p>
        <a href="${params.teamPageUrl}" style="display:block;text-align:center;background:#0A8F45;color:#fff;padding:14px 0;border-radius:12px;font-size:15px;font-weight:700;text-decoration:none;">
          Voir mon equipe
        </a>
      </div>
    `,
  });
}

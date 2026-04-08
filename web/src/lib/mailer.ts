import nodemailer from "nodemailer";

function getMailerConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "0");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !port || !user || !pass || !from) {
    return null;
  }

  return { host, port, user, pass, from };
}

export async function sendVerificationCodeEmail(email: string, code: string) {
  const config = getMailerConfig();

  if (!config) {
    throw new Error("Service email non configure");
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
  });

  await transporter.sendMail({
    from: config.from,
    to: email,
    subject: "Code de verification BizManager",
    text: [
      "Bonjour,",
      "",
      "Voici votre code de verification BizManager:",
      code,
      "",
      "Ce code expire dans 10 minutes.",
      "Si vous n'avez pas demande cette action, ignorez cet email.",
    ].join("\n"),
  });
}

export async function sendPasswordResetCodeEmail(email: string, code: string) {
  const config = getMailerConfig();

  if (!config) {
    throw new Error("Service email non configure");
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
  });

  await transporter.sendMail({
    from: config.from,
    to: email,
    subject: "Code de reinitialisation BizManager",
    text: [
      "Bonjour,",
      "",
      "Voici votre code de reinitialisation BizManager:",
      code,
      "",
      "Ce code expire dans 10 minutes.",
      "Si vous n'avez pas demande cette action, ignorez cet email.",
    ].join("\n"),
  });
}

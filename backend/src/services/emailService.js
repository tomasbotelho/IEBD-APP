import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { AppError } from "../utils/appError.js";

const looksConfigured = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase();

  return (
    Boolean(normalized) &&
    !normalized.includes("replace_me") &&
    !normalized.includes("your_") &&
    !normalized.includes("example") &&
    normalized !== "changeme"
  );
};

const smtpConfigured =
  looksConfigured(env.mail.host) &&
  Number(env.mail.port) > 0 &&
  looksConfigured(env.mail.user) &&
  looksConfigured(env.mail.pass) &&
  looksConfigured(env.mail.fromAddress);

let transporterPromise = null;

const getTransportConfig = async () => {
  if (transporterPromise) {
    return transporterPromise;
  }

  transporterPromise = (async () => {
    if (smtpConfigured) {
      const transporter = nodemailer.createTransport({
        host: env.mail.host,
        port: env.mail.port,
        secure: env.mail.secure,
        auth: {
          user: env.mail.user,
          pass: env.mail.pass
        }
      });

      await transporter.verify();

      return {
        transporter,
        mode: "smtp",
        fromAddress: env.mail.fromAddress
      };
    }

    if (env.nodeEnv !== "production") {
      const testAccount = await nodemailer.createTestAccount();
      const transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });

      return {
        transporter,
        mode: "ethereal",
        fromAddress: testAccount.user
      };
    }

    throw new AppError("O serviço de email não está configurado.", 500);
  })();

  return transporterPromise;
};

export const emailService = {
  async sendPasswordResetEmail({ to, firstName, resetUrl }) {
    try {
      const { transporter, mode, fromAddress } = await getTransportConfig();
      const appName = env.appName || "Sports Club";
      const safeFirstName = String(firstName || "Cliente").trim() || "Cliente";

      const info = await transporter.sendMail({
        from: `"${env.mail.fromName}" <${fromAddress}>`,
        to,
        subject: `${appName} | Reposição de palavra-passe`,
        text: [
          `Olá ${safeFirstName},`,
          "",
          "Recebemos um pedido para repor a sua palavra-passe.",
          `Abra esta ligação: ${resetUrl}`,
          "",
          `Esta ligação expira em ${env.passwordResetTokenTtlMinutes} minutos.`,
          "Se não pediu esta alteração, ignore este email."
        ].join("\n"),
        html: `
          <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#111827;">
            <h2 style="margin-bottom:16px;">Reposição de palavra-passe</h2>
            <p>Olá ${safeFirstName},</p>
            <p>Recebemos um pedido para repor a sua palavra-passe.</p>
            <p style="margin:24px 0;">
              <a
                href="${resetUrl}"
                style="display:inline-block;background:#000;color:#fff;padding:12px 18px;border-radius:12px;text-decoration:none;font-weight:700;"
              >
                Repor palavra-passe
              </a>
            </p>
            <p>Esta ligação expira em ${env.passwordResetTokenTtlMinutes} minutos.</p>
            <p>Se não pediu esta alteração, ignore este email.</p>
          </div>
        `
      });

      return {
        mode,
        previewUrl: nodemailer.getTestMessageUrl(info) || null,
        messageId: info.messageId
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError("Não foi possível enviar o email de recuperação.", 502);
    }
  }
};

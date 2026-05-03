import dotenv from "dotenv";

dotenv.config();

const port = Number(process.env.PORT || 4000);
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const frontendUrls = new Set([frontendUrl]);

try {
  const parsedFrontendUrl = new URL(frontendUrl);

  if (parsedFrontendUrl.hostname === "localhost") {
    parsedFrontendUrl.hostname = "127.0.0.1";
    frontendUrls.add(parsedFrontendUrl.toString().replace(/\/$/, ""));
  } else if (parsedFrontendUrl.hostname === "127.0.0.1") {
    parsedFrontendUrl.hostname = "localhost";
    frontendUrls.add(parsedFrontendUrl.toString().replace(/\/$/, ""));
  }
} catch {
  frontendUrls.add("http://localhost:5173");
  frontendUrls.add("http://127.0.0.1:5173");
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  appName: process.env.APP_NAME || "Sports Club",
  port,
  frontendUrl,
  frontendUrls: Array.from(frontendUrls).map((url) => url.replace(/\/$/, "")),
  jwtSecret: process.env.JWT_SECRET || "change_this_secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  jwtCookieName: process.env.JWT_COOKIE_NAME || "freshmart_token",
  passwordResetTokenTtlMinutes: Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || 60),
  useFakeDb: process.env.USE_FAKE_DB !== "false",
  mysql: {
    host: process.env.MYSQL_HOST || "localhost",
    port: Number(process.env.MYSQL_PORT || 3306),
    database: process.env.MYSQL_DATABASE || "freshmart",
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || ""
  },
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  defaultCurrency: process.env.DEFAULT_CURRENCY || "eur",
  mail: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    fromName: process.env.SMTP_FROM_NAME || process.env.APP_NAME || "Sports Club",
    fromAddress: process.env.SMTP_FROM_ADDRESS || ""
  },
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID || "",
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || "",
    environment: process.env.PAYPAL_ENV || "sandbox"
  },
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirectUri:
        process.env.GOOGLE_REDIRECT_URI ||
        `http://localhost:${port}/api/auth/oauth/google/callback`
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID || "",
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
      tenantId: process.env.MICROSOFT_TENANT_ID || "common",
      redirectUri:
        process.env.MICROSOFT_REDIRECT_URI ||
        `http://localhost:${port}/api/auth/oauth/microsoft/callback`
    }
  }
};

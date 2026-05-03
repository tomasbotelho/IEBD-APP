import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { dbStore } from "../models/dbStore.js";
import { storeModel } from "../models/store.js";
import { emailService } from "./emailService.js";
import { AppError } from "../utils/appError.js";
import { signToken } from "../utils/jwt.js";

const sanitizeUser = (user) => ({
  id: user.id,
  name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone || "",
  postalCode: user.postalCode || "",
  role: user.role
});

const createSession = (user) => ({
  user: sanitizeUser(user),
  accessToken: signToken({ sub: user.id, role: user.role })
});

const getCustomerStore = () => (env.useFakeDb ? storeModel : dbStore);

const splitName = (name = "", email = "") => {
  const source = String(name || "").trim() || String(email || "").split("@")[0] || "Cliente";
  const [firstName, ...rest] = source.split(/\s+/);

  return {
    firstName: firstName || "Cliente",
    lastName: rest.join(" ") || "OAuth"
  };
};

const sanitizeReturnTo = (returnTo) => {
  if (typeof returnTo !== "string") {
    return "/conta";
  }

  return returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/conta";
};

const looksLikePlaceholder = (value = "") => {
  const normalized = value.trim().toLowerCase();

  return (
    !normalized ||
    normalized.includes("replace_me") ||
    normalized.includes("your_") ||
    normalized.includes("example") ||
    normalized === "changeme"
  );
};

const getProviderConfig = (provider) => {
  if (provider === "google") {
    return {
      ...env.oauth.google,
      authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenEndpoint: "https://oauth2.googleapis.com/token",
      profileEndpoint: "https://openidconnect.googleapis.com/v1/userinfo",
      scope: "openid email profile"
    };
  }

  if (provider === "microsoft") {
    const tenantId = env.oauth.microsoft.tenantId || "common";

    return {
      ...env.oauth.microsoft,
      authorizationEndpoint: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`,
      tokenEndpoint: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      profileEndpoint:
        "https://graph.microsoft.com/v1.0/me?$select=id,givenName,surname,displayName,mail,userPrincipalName",
      scope: "openid profile email offline_access User.Read"
    };
  }

  throw new AppError("Fornecedor OAuth inválido.", 400);
};

const ensureOAuthConfigured = (provider) => {
  const config = getProviderConfig(provider);
  const providerLabel = provider === "google" ? "Google" : "Microsoft";
  const requiredEnvVars =
    provider === "google"
      ? "GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET"
      : "MICROSOFT_CLIENT_ID e MICROSOFT_CLIENT_SECRET";

  if (
    looksLikePlaceholder(config.clientId) ||
    looksLikePlaceholder(config.clientSecret) ||
    looksLikePlaceholder(config.redirectUri)
  ) {
    throw new AppError(
      `${providerLabel} OAuth não está configurado. Adicione ${requiredEnvVars} ao backend/.env.`,
      400
    );
  }

  if (provider === "google" && !config.clientId.trim().endsWith(".apps.googleusercontent.com")) {
    throw new AppError("O client ID do Google OAuth é inválido.", 400);
  }

  return config;
};

const createOAuthStateToken = (payload) =>
  jwt.sign(payload, env.jwtSecret, {
    expiresIn: "10m"
  });

const hashResetToken = (token) =>
  crypto.createHash("sha256").update(String(token || "")).digest("hex");

const buildResetPasswordUrl = (token) => {
  const url = new URL("/repor-palavra-passe", env.frontendUrl);
  url.searchParams.set("token", token);
  return url.toString();
};

const readOAuthStateToken = (token) => {
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch {
    throw new AppError("O estado OAuth é inválido.", 400);
  }
};

const exchangeCodeForTokens = async (provider, code) => {
  const config = ensureOAuthConfigured(provider);
  const payload = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: config.redirectUri
  });

  const response = await fetch(config.tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: payload
  });

  if (!response.ok) {
    throw new AppError(`Não foi possível validar a autenticação ${provider}.`, 502);
  }

  return response.json();
};

const fetchOAuthProfile = async (provider, accessToken) => {
  const config = ensureOAuthConfigured(provider);
  const response = await fetch(config.profileEndpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new AppError(`Não foi possível obter o perfil ${provider}.`, 502);
  }

  const profile = await response.json();

  if (provider === "google") {
    return {
      providerUserId: profile.sub,
      email: profile.email,
      firstName: profile.given_name,
      lastName: profile.family_name,
      name: profile.name
    };
  }

  return {
    providerUserId: profile.id,
    email: profile.mail || profile.userPrincipalName,
    firstName: profile.givenName,
    lastName: profile.surname,
    name: profile.displayName
  };
};

export const authService = {
  async register(input) {
    const customerStore = getCustomerStore();
    const passwordHash = await bcrypt.hash(input.password, await bcrypt.genSalt(10));
    const user = await customerStore.createCustomer({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      postalCode: input.postalCode,
      passwordHash,
      role: "customer"
    });

    return createSession(user);
  },

  async login({ email, password }) {
    const customerStore = getCustomerStore();
    const user = await customerStore.findCustomerByEmail(email);

    if (!user) {
      throw new AppError("a conta não existe", 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash || "");
    if (!valid) {
      throw new AppError("A palavra-passe está incorreta.", 401);
    }

    return createSession(user);
  },

  async requestPasswordReset({ email }) {
    const customerStore = getCustomerStore();
    const user = await customerStore.findCustomerByEmail(email);
    const genericResponse = {
      message: "Se o email existir, enviámos uma ligação para repor a palavra-passe."
    };

    if (!user) {
      return genericResponse;
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const resetUrl = buildResetPasswordUrl(rawToken);
    const expiresAt = new Date(Date.now() + env.passwordResetTokenTtlMinutes * 60 * 1000);

    await customerStore.savePasswordResetToken({
      customerId: user.id,
      tokenHash: hashResetToken(rawToken),
      expiresAt
    });

    const delivery = await emailService.sendPasswordResetEmail({
      to: user.email,
      firstName: user.firstName,
      resetUrl
    });

    if (env.nodeEnv !== "production" && delivery.previewUrl) {
      return {
        ...genericResponse,
        previewUrl: delivery.previewUrl,
        resetUrl
      };
    }

    return genericResponse;
  },

  async resetPassword({ token, password }) {
    const customerStore = getCustomerStore();
    const user = await customerStore.findCustomerByResetTokenHash(hashResetToken(token));

    if (!user || !user.resetPasswordExpiresAt) {
      throw new AppError("A ligação para repor a palavra-passe é inválida ou expirou.", 400);
    }

    if (new Date(user.resetPasswordExpiresAt).getTime() < Date.now()) {
      throw new AppError("A ligação para repor a palavra-passe expirou.", 400);
    }

    const passwordHash = await bcrypt.hash(password, await bcrypt.genSalt(10));
    await customerStore.updateCustomerPassword({
      customerId: user.id,
      passwordHash
    });

    return {
      message: "A palavra-passe foi atualizada com sucesso."
    };
  },

  getAuthorizationUrl(provider, { intent = "login", returnTo = "/conta" } = {}) {
    const config = ensureOAuthConfigured(provider);
    const state = createOAuthStateToken({
      provider,
      intent,
      returnTo: sanitizeReturnTo(returnTo)
    });
    const url = new URL(config.authorizationEndpoint);

    url.searchParams.set("client_id", config.clientId);
    url.searchParams.set("redirect_uri", config.redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", config.scope);
    url.searchParams.set("state", state);

    if (provider === "google") {
      url.searchParams.set("access_type", "offline");
      url.searchParams.set("include_granted_scopes", "true");
      url.searchParams.set("prompt", "consent");
    } else {
      url.searchParams.set("response_mode", "query");
    }

    return url.toString();
  },

  async loginWithOAuth(provider, { code, state }) {
    if (!code || !state) {
      throw new AppError("Faltam parâmetros da autenticação OAuth.", 400);
    }

    const statePayload = readOAuthStateToken(state);
    if (statePayload.provider !== provider) {
      throw new AppError("O estado OAuth não corresponde ao fornecedor.", 400);
    }

    const tokenResponse = await exchangeCodeForTokens(provider, code);
    const profile = await fetchOAuthProfile(provider, tokenResponse.access_token);

    if (!profile.email) {
      throw new AppError("A conta OAuth não devolveu um email válido.", 400);
    }

    const customerStore = getCustomerStore();
    let user = await customerStore.findCustomerByEmail(profile.email);

    if (!user) {
      const generatedPassword = crypto.randomUUID();
      const passwordHash = await bcrypt.hash(generatedPassword, await bcrypt.genSalt(10));
      const { firstName, lastName } = splitName(profile.name, profile.email);

      user = await customerStore.createCustomer({
        firstName: profile.firstName || firstName,
        lastName: profile.lastName || lastName,
        email: profile.email,
        phone: "",
        postalCode: "",
        passwordHash,
        role: "customer"
      });
    }

    return {
      ...createSession(user),
      intent: statePayload.intent,
      provider,
      returnTo: sanitizeReturnTo(statePayload.returnTo)
    };
  },

  async getSession(id) {
    const customerStore = getCustomerStore();
    const user = await customerStore.findCustomerById(id);

    if (!user) {
      throw new AppError("Utilizador não encontrado.", 404);
    }

    return createSession(user);
  },

  async getProfile(id) {
    const customerStore = getCustomerStore();
    const user = await customerStore.findCustomerById(id);

    if (!user) {
      throw new AppError("Utilizador não encontrado.", 404);
    }

    return sanitizeUser(user);
  }
};

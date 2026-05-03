import { env } from "../config/env.js";
import { authService } from "../services/authService.js";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema
} from "../utils/validators.js";

const setAuthCookie = (res, accessToken) => {
  res.cookie(env.jwtCookieName, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.nodeEnv === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

const redirectToFrontendAuth = ({ intent = "login", error, provider, returnTo = "/conta" }) => {
  const target = new URL(intent === "register" ? "/registo" : "/login", env.frontendUrl);
  if (error) {
    target.searchParams.set("oauth_error", error);
  }
  if (provider) {
    target.searchParams.set("oauth_provider", provider);
  }
  if (returnTo) {
    target.searchParams.set("returnTo", returnTo);
  }
  return target.toString();
};

export const register = async (req, res) => {
  const input = registerSchema.parse(req.body);
  const result = await authService.register(input);
  setAuthCookie(res, result.accessToken);
  res.status(201).json(result);
};

export const login = async (req, res) => {
  const input = loginSchema.parse(req.body);
  const result = await authService.login(input);
  setAuthCookie(res, result.accessToken);
  res.json(result);
};

export const forgotPassword = async (req, res) => {
  const input = forgotPasswordSchema.parse(req.body);
  const result = await authService.requestPasswordReset(input);
  res.json(result);
};

export const resetPassword = async (req, res) => {
  const input = resetPasswordSchema.parse(req.body);
  const result = await authService.resetPassword(input);
  res.json(result);
};

export const session = async (req, res) => {
  const result = await authService.getSession(req.user.id);
  res.json(result);
};

export const oauthStart = (req, res) => {
  const { provider } = req.params;
  const { intent = "login", returnTo = "/conta" } = req.query;

  try {
    const url = authService.getAuthorizationUrl(provider, { intent, returnTo });
    res.redirect(url);
  } catch (error) {
    res.redirect(
      redirectToFrontendAuth({
        intent,
        provider,
        error: error.message,
        returnTo
      })
    );
  }
};

export const oauthCallback = async (req, res) => {
  const { provider } = req.params;
  const incomingState = typeof req.query.state === "string" ? req.query.state : "";
  let fallbackIntent = "login";
  let fallbackReturnTo = typeof req.query.returnTo === "string" ? req.query.returnTo : "/conta";

  if (incomingState) {
    try {
      const statePayload = JSON.parse(
        Buffer.from(incomingState.split(".")[1] || "", "base64url").toString("utf8")
      );
      fallbackIntent = statePayload.intent || fallbackIntent;
      fallbackReturnTo = statePayload.returnTo || fallbackReturnTo;
    } catch {
      fallbackIntent = "login";
    }
  }

  if (req.query.error) {
    return res.redirect(
      redirectToFrontendAuth({
        intent: fallbackIntent,
        provider,
        error: String(req.query.error_description || req.query.error),
        returnTo: fallbackReturnTo
      })
    );
  }

  try {
    const result = await authService.loginWithOAuth(provider, {
      code: typeof req.query.code === "string" ? req.query.code : "",
      state: incomingState
    });

    setAuthCookie(res, result.accessToken);

    const target = new URL("/oauth/callback", env.frontendUrl);
    target.searchParams.set("provider", provider);
    target.searchParams.set("intent", result.intent);
    target.searchParams.set("returnTo", result.returnTo);
    return res.redirect(target.toString());
  } catch (error) {
    return res.redirect(
      redirectToFrontendAuth({
        intent: fallbackIntent,
        provider,
        error: error.message,
        returnTo: fallbackReturnTo
      })
    );
  }
};

export const logout = (_req, res) => {
  res.clearCookie(env.jwtCookieName);
  res.status(204).send();
};

export const me = async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  res.json({ user });
};

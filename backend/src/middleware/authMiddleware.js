import { env } from "../config/env.js";
import { AppError } from "../utils/appError.js";
import { verifyToken } from "../utils/jwt.js";

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "");
  }
  return req.cookies?.[env.jwtCookieName] || null;
};

export const requireAuth = (req, _res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return next(new AppError("Autenticação obrigatória.", 401));
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: Number(payload.sub), role: payload.role };
    return next();
  } catch {
    return next(new AppError("Sessão inválida.", 401));
  }
};

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError("Acesso proibido.", 403));
  }
  return next();
};

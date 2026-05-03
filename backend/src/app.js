import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { ZodError } from "zod";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { AppError } from "./utils/appError.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);
const mediaDirectory = path.resolve(currentDirectory, "../../fotos");

export const createApp = () => {
  const app = express();
  const allowedOrigins = new Set(env.frontendUrls);

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }

        callback(null, false);
      },
      credentials: true
    })
  );
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(express.json());
  app.use(cookieParser());
  app.use("/media", express.static(mediaDirectory));

  app.use("/api", routes);

  app.use((_req, _res, next) => next(new AppError("Rota não encontrada.", 404)));

  app.use((error, _req, _res, next) => {
    if (error instanceof ZodError) {
      return next(new AppError("Os dados introduzidos são inválidos.", 400, error.flatten()));
    }
    return next(error);
  });

  app.use(errorMiddleware);

  return app;
};

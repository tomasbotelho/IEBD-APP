import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { bootstrapDatabase } from "./data/bootstrapDatabase.js";

const looksConfigured = (value = "") => {
  const normalized = value.trim().toLowerCase();
  return (
    Boolean(normalized) &&
    !normalized.includes("replace_me") &&
    !normalized.includes("your_") &&
    !normalized.includes("example") &&
    normalized !== "changeme"
  );
};

const googleConfigured =
  looksConfigured(env.oauth.google.clientId) &&
  looksConfigured(env.oauth.google.clientSecret) &&
  env.oauth.google.clientId.endsWith(".apps.googleusercontent.com");

const startServer = async () => {
  await bootstrapDatabase();

  const app = createApp();

  if (!googleConfigured) {
    console.warn(
      "[oauth] Google login desativado. Defina GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET em backend/.env."
    );
  }

  const server = app.listen(env.port, () => {
    console.log(`API running on http://localhost:${env.port}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(
        `A porta ${env.port} já está em uso. Termine a instância anterior do backend e volte a iniciar.`
      );
      process.exit(1);
    }

    throw error;
  });
};

startServer().catch((error) => {
  console.error("Falha ao iniciar o backend:", error);
  process.exit(1);
});

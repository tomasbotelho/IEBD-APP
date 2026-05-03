export const errorMiddleware = (error, _req, res, _next) => {
  if (error?.code === "ER_ACCESS_DENIED_ERROR") {
    return res.status(500).json({
      message: "Não foi possível ligar à base de dados. Verifique o utilizador e a palavra-passe do MySQL."
    });
  }

  const statusCode = error.statusCode || 500;
  const payload = {
    message: error.message || "Erro interno do servidor"
  };

  if (error.details) {
    payload.details = error.details;
  }

  res.status(statusCode).json(payload);
};

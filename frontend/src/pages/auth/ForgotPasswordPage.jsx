import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { AuthFormShell } from "../../components/auth/AuthFormShell.jsx";
import { Seo } from "../../components/common/Seo.jsx";
import { useTexts } from "../../contexts/SiteTextsContext.jsx";
import { buildCanonicalUrl } from "../../lib/seo.js";
import { authService } from "../../services/authService.js";
import { forgotPasswordSchema } from "../../validators/authSchemas.js";

export const ForgotPasswordPage = () => {
  const t = useTexts();
  const [message, setMessage] = useState("");
  const [apiError, setApiError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (values) => {
    setApiError("");
    setMessage("");
    setPreviewUrl("");
    setResetUrl("");
    try {
      const response = await authService.forgotPassword(values);
      setMessage(response.message);
      setPreviewUrl(response.previewUrl || "");
      setResetUrl(response.resetUrl || "");
    } catch (error) {
      setApiError(error.response?.data?.message || t("auth", "forgot_error", "Não foi possível enviar o email de recuperação."));
    }
  };

  return (
    <>
      <Seo
        canonical={buildCanonicalUrl("/recuperar-conta")}
        description={t("auth", "forgot_seo_desc", "Recuperação de conta com envio de ligação segura para repor a palavra-passe.")}
        title={t("auth", "forgot_seo_title", "Recuperar conta | Sports Club")}
      />
      <AuthFormShell
        description={t("auth", "forgot_desc", "Introduza o email associado à conta para receber a ligação de reposição.")}
        title={t("auth", "forgot_title", "Recuperar conta")}
      >
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <label>
            <span className="mb-2 block text-sm font-semibold">{t("auth", "label_email", "Email")}</span>
            <input className="input-base" {...register("email")} />
            {errors.email ? (
              <span className="mt-1 block text-sm text-red-600">{errors.email.message}</span>
            ) : null}
          </label>
          {apiError ? <p className="text-sm text-red-600">{apiError}</p> : null}
          {message ? <p className="text-sm text-pine-600">{message}</p> : null}
          {previewUrl ? (
            <p className="text-sm text-slate-600">
              Email de teste:{" "}
              <a className="font-semibold text-pine-600" href={previewUrl} rel="noreferrer" target="_blank">
                abrir pré-visualização
              </a>
            </p>
          ) : null}
          {resetUrl ? (
            <p className="text-sm text-slate-600">
              Ligação de teste:{" "}
              <a className="font-semibold text-pine-600" href={resetUrl}>
                repor palavra-passe
              </a>
            </p>
          ) : null}
          <button className="button-primary" disabled={isSubmitting} type="submit">
            {isSubmitting ? t("auth", "forgot_btn_loading", "A enviar…") : t("auth", "forgot_btn", "Enviar instruções")}
          </button>
          <p className="text-sm text-slate-600">
            {t("auth", "forgot_back_login", "Lembrou-se da palavra-passe?")}{" "}
            <Link className="font-semibold text-pine-600" to="/login">
              {t("auth", "forgot_back_login_link", "Voltar ao login")}
            </Link>
          </p>
        </form>
      </AuthFormShell>
    </>
  );
};

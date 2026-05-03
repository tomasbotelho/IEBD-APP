import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthFormShell } from "../../components/auth/AuthFormShell.jsx";
import { Seo } from "../../components/common/Seo.jsx";
import { useTexts } from "../../contexts/SiteTextsContext.jsx";
import { buildCanonicalUrl } from "../../lib/seo.js";
import { authService } from "../../services/authService.js";
import { resetPasswordSchema } from "../../validators/authSchemas.js";

export const ResetPasswordPage = () => {
  const t = useTexts();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [message, setMessage] = useState("");
  const [apiError, setApiError] = useState(token ? "" : t("auth", "reset_invalid_token", "A ligação de recuperação é inválida."));
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(resetPasswordSchema) });

  useEffect(() => {
    if (!message) return undefined;
    const id = window.setTimeout(() => navigate("/login", { replace: true }), 1500);
    return () => window.clearTimeout(id);
  }, [message, navigate]);

  const onSubmit = async (values) => {
    if (!token) {
      setApiError(t("auth", "reset_invalid_token", "A ligação de recuperação é inválida."));
      return;
    }
    setApiError("");
    setMessage("");
    try {
      const response = await authService.resetPassword({ token, password: values.password, confirmPassword: values.confirmPassword });
      setMessage(response.message);
    } catch (error) {
      setApiError(error.response?.data?.message || t("auth", "reset_error", "Não foi possível repor a palavra-passe."));
    }
  };

  return (
    <>
      <Seo
        canonical={buildCanonicalUrl("/repor-palavra-passe")}
        description={t("auth", "reset_seo_desc", "Reposição segura de palavra-passe com token temporário.")}
        title={t("auth", "reset_seo_title", "Repor palavra-passe | Sports Club")}
      />
      <AuthFormShell
        description={t("auth", "reset_desc", "Defina uma nova palavra-passe para concluir a recuperação da conta.")}
        title={t("auth", "reset_title", "Repor palavra-passe")}
      >
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <label>
            <span className="mb-2 block text-sm font-semibold">{t("auth", "label_new_password", "Nova palavra-passe")}</span>
            <input className="input-base" type="password" {...register("password")} />
            {errors.password ? (
              <span className="mt-1 block text-sm text-red-600">{errors.password.message}</span>
            ) : null}
          </label>
          <label>
            <span className="mb-2 block text-sm font-semibold">{t("auth", "label_confirm_password", "Confirmar palavra-passe")}</span>
            <input className="input-base" type="password" {...register("confirmPassword")} />
            {errors.confirmPassword ? (
              <span className="mt-1 block text-sm text-red-600">{errors.confirmPassword.message}</span>
            ) : null}
          </label>
          {apiError ? <p className="text-sm text-red-600">{apiError}</p> : null}
          {message ? <p className="text-sm text-pine-600">{message}</p> : null}
          <button className="button-primary" disabled={isSubmitting || Boolean(message)} type="submit">
            {isSubmitting ? t("auth", "reset_btn_loading", "A atualizar…") : t("auth", "reset_btn", "Atualizar palavra-passe")}
          </button>
          <p className="text-sm text-slate-600">
            {t("auth", "reset_back_login", "Voltar ao")}{" "}
            <Link className="font-semibold text-pine-600" to="/login">
              {t("auth", "reset_back_login_link", "login")}
            </Link>
          </p>
        </form>
      </AuthFormShell>
    </>
  );
};

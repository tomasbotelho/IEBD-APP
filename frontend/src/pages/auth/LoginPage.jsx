import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AuthFormShell } from "../../components/auth/AuthFormShell.jsx";
import { OAuthButtons } from "../../components/auth/OAuthButtons.jsx";
import { Seo } from "../../components/common/Seo.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useTexts } from "../../contexts/SiteTextsContext.jsx";
import { buildCanonicalUrl } from "../../lib/seo.js";
import { loginSchema } from "../../validators/authSchemas.js";

export const LoginPage = () => {
  const t = useTexts();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [apiError, setApiError] = useState(searchParams.get("oauth_error") || "");
  const returnTo = searchParams.get("returnTo") || location.state?.from?.pathname || "/conta";
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values) => {
    setApiError("");
    try {
      await login(values);
      navigate(returnTo);
    } catch (error) {
      const response = error.response?.data;
      setApiError(response?.message || t("auth", "login_error", "Não foi possível iniciar sessão."));
    }
  };

  return (
    <>
      <Seo
        canonical={buildCanonicalUrl("/login")}
        description={t("auth", "login_seo_desc", "Aceda à sua conta para checkout, histórico e perfil.")}
        title={t("auth", "login_seo_title", "Login | Sports Club")}
      />
      <AuthFormShell title={t("auth", "login_title", "Entrar")}>
        <div className="space-y-6">
          <OAuthButtons intent="login" returnTo={returnTo} />
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <label>
              <span className="mb-2 block text-sm font-semibold">{t("auth", "label_email", "Email")}</span>
              <input className="input-base" {...register("email")} />
              {errors.email ? (
                <span className="mt-1 block text-sm text-red-600">{errors.email.message}</span>
              ) : null}
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold">{t("auth", "label_password", "Palavra-passe")}</span>
              <input className="input-base" type="password" {...register("password")} />
              {errors.password ? (
                <span className="mt-1 block text-sm text-red-600">{errors.password.message}</span>
              ) : null}
            </label>
            {apiError ? <p className="text-sm text-red-600">{apiError}</p> : null}
            <button className="button-primary w-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? t("auth", "login_btn_loading", "A autenticar…") : t("auth", "login_btn", "Entrar")}
            </button>
            <div className="flex items-center justify-between text-sm">
              <Link className="font-semibold text-pine-600" to="/recuperar-conta">
                {t("auth", "login_forgot_link", "Recuperar conta")}
              </Link>
              <Link className="font-semibold text-pine-600" to="/registo">
                {t("auth", "login_register_link", "Criar conta")}
              </Link>
            </div>
          </form>
        </div>
      </AuthFormShell>
    </>
  );
};

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthFormShell } from "../../components/auth/AuthFormShell.jsx";
import { OAuthButtons } from "../../components/auth/OAuthButtons.jsx";
import { Seo } from "../../components/common/Seo.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useTexts } from "../../contexts/SiteTextsContext.jsx";
import { buildCanonicalUrl } from "../../lib/seo.js";
import { registerSchema } from "../../validators/authSchemas.js";

export const RegisterPage = () => {
  const t = useTexts();
  const { register: signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [apiError, setApiError] = useState(searchParams.get("oauth_error") || "");
  const returnTo = searchParams.get("returnTo") || "/conta";
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values) => {
    setApiError("");
    try {
      await signUp(values);
      navigate(returnTo);
    } catch (error) {
      const response = error.response?.data;
      const fieldErrors = response?.details?.fieldErrors || {};
      const firstFieldError = Object.values(fieldErrors).flat().find(Boolean);
      setApiError(firstFieldError || response?.message || t("auth", "register_error", "Não foi possível criar a conta."));
    }
  };

  const fields = [
    ["firstName",       t("auth", "label_first_name",      "Primeiro nome")],
    ["lastName",        t("auth", "label_last_name",        "Último nome")],
    ["email",           t("auth", "label_email",            "Email")],
    ["phone",           t("auth", "label_phone",            "Telefone")],
    ["postalCode",      t("auth", "label_postcode",         "Código-postal")],
    ["password",        t("auth", "label_password",         "Palavra-passe")],
    ["confirmPassword", t("auth", "label_confirm_password", "Confirmar palavra-passe")]
  ];

  return (
    <>
      <Seo
        canonical={buildCanonicalUrl("/registo")}
        description={t("auth", "register_seo_desc", "Crie conta com email ou Google.")}
        title={t("auth", "register_seo_title", "Registo | Sports Club")}
      />
      <AuthFormShell title={t("auth", "register_title", "Criar conta")}>
        <div className="space-y-6">
          <OAuthButtons intent="register" returnTo={returnTo} />
          <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
            {fields.map(([name, label]) => (
              <label key={name}>
                <span className="mb-2 block text-sm font-semibold">{label}</span>
                <input
                  className="input-base"
                  type={name.includes("password") ? "password" : "text"}
                  {...register(name)}
                />
                {errors[name] ? (
                  <span className="mt-1 block text-sm text-red-600">{errors[name].message}</span>
                ) : null}
              </label>
            ))}
            {apiError ? <p className="md:col-span-2 text-sm text-red-600">{apiError}</p> : null}
            <button className="button-primary md:col-span-2" disabled={isSubmitting} type="submit">
              {isSubmitting ? t("auth", "register_btn_loading", "A criar…") : t("auth", "register_btn", "Criar conta")}
            </button>
            <p className="md:col-span-2 text-sm text-slate-600">
              {t("auth", "register_have_account", "Já tem conta?")}{" "}
              <Link className="font-semibold text-pine-600" to="/login">
                {t("auth", "register_login_link", "Entre aqui")}
              </Link>
            </p>
          </form>
        </div>
      </AuthFormShell>
    </>
  );
};

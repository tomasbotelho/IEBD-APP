import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthFormShell } from "../../components/auth/AuthFormShell.jsx";
import { Seo } from "../../components/common/Seo.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { buildCanonicalUrl } from "../../lib/seo.js";

export const OAuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeOAuth } = useAuth();
  const [error, setError] = useState(searchParams.get("oauth_error") || "");
  const provider = searchParams.get("provider") || searchParams.get("oauth_provider") || "OAuth";
  const returnTo = searchParams.get("returnTo") || "/conta";

  useEffect(() => {
    if (error) {
      return;
    }

    let active = true;

    completeOAuth()
      .then(() => {
        if (active) {
          navigate(returnTo, { replace: true });
        }
      })
      .catch(() => {
        if (active) {
          setError("Não foi possível concluir a autenticação externa.");
        }
      });

    return () => {
      active = false;
    };
  }, [error, navigate, returnTo, completeOAuth]);

  return (
    <>
      <Seo
        canonical={buildCanonicalUrl("/oauth/callback")}
        description="Conclusão da autenticação externa."
        title="Autenticação externa | Sports Club"
      />
      <AuthFormShell
        aside={
          <p className="text-sm text-slate-700">
            Estamos a concluir a ligação da sua conta {provider} com a Sports Club.
          </p>
        }
        description={
          error ? "Não foi possível concluir o login externo." : "A validar sessão externa."
        }
        title={error ? "Falha na autenticação" : "A concluir autenticação"}
      >
        {error ? (
          <div className="space-y-4">
            <p className="text-sm text-coral-600">{error}</p>
            <div className="flex gap-3">
              <Link className="button-secondary" to="/login">
                Voltar ao login
              </Link>
              <Link className="button-primary" to="/registo">
                Ir para registo
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600">Aguarde um instante...</p>
        )}
      </AuthFormShell>
    </>
  );
};

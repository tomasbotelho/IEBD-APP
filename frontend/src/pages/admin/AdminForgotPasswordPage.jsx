import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Mail, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { api } from "../../lib/api.js";

const COOLDOWN = 60;

export const AdminForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);

  const startCooldown = () => {
    setCooldown(COOLDOWN);
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return setError("Introduza o seu email.");
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      setSent(true);
      startCooldown();
    } catch (err) {
      setError(
        err?.response?.data?.message || "Não foi possível enviar o email. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      startCooldown();
    } catch (err) {
      setError(err?.response?.data?.message || "Erro ao reenviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-900/50">
            <ShoppingBag className="h-7 w-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Recuperar acesso</h1>
            <p className="mt-1 text-sm text-slate-400">Sports Club — Painel de administração</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700/50 bg-slate-800 p-8 shadow-2xl">
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <p className="text-sm text-slate-400">
                Introduza o email associado à sua conta de administrador. Enviaremos um link para
                repor a palavra-passe.
              </p>

              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-800/60 bg-red-900/30 px-4 py-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="admin@exemplo.com"
                    autoComplete="email"
                    required
                    className="w-full rounded-xl border border-slate-600 bg-slate-700 py-3 pl-10 pr-4 text-white placeholder-slate-500 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "A enviar…" : "Enviar link de recuperação"}
              </button>

              <div className="text-center">
                <Link to="/admin/login" className="text-sm text-indigo-400 hover:text-indigo-300">
                  ← Voltar ao login
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-900/40">
                  <CheckCircle className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">Email enviado</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Se o endereço <span className="text-slate-200">{email}</span> estiver
                    associado a uma conta de administrador, receberá um email com o link de
                    recuperação em breve.
                  </p>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-800/60 bg-red-900/30 px-4 py-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <button
                onClick={handleResend}
                disabled={cooldown > 0 || loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-600 py-3 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                {cooldown > 0
                  ? `Reenviar email (${cooldown}s)`
                  : loading
                    ? "A reenviar…"
                    : "Reenviar email de recuperação"}
              </button>

              <div className="text-center">
                <Link to="/admin/login" className="text-sm text-indigo-400 hover:text-indigo-300">
                  ← Voltar ao login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

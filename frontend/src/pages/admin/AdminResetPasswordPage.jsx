import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ShoppingBag, Eye, EyeOff, AlertCircle, CheckCircle, Lock } from "lucide-react";
import { api } from "../../lib/api.js";

const MIN_LENGTH = 8;

const getStrength = (pwd) => {
  if (!pwd) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pwd.length >= MIN_LENGTH) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const map = [
    { score: 1, label: "Fraca", color: "bg-red-500" },
    { score: 2, label: "Razoável", color: "bg-amber-500" },
    { score: 3, label: "Boa", color: "bg-yellow-400" },
    { score: 4, label: "Forte", color: "bg-emerald-500" }
  ];
  return map[score - 1] || { score: 0, label: "", color: "" };
};

export const AdminResetPasswordPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";

  const [form, setForm] = useState({ password: "", confirm: "" });
  const [show, setShow] = useState({ pwd: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const strength = getStrength(form.password);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.password || form.password.length < MIN_LENGTH) {
      return setError(`A palavra-passe deve ter pelo menos ${MIN_LENGTH} caracteres.`);
    }
    if (form.password !== form.confirm) {
      return setError("As palavras-passe não coincidem.");
    }
    if (!token) {
      return setError("Link de recuperação inválido ou expirado.");
    }

    setLoading(true);
    setError("");
    try {
      await api.post("/auth/reset-password", { token, password: form.password });
      setDone(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Não foi possível repor a palavra-passe. O link pode ter expirado."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-900/50">
            <ShoppingBag className="h-7 w-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Nova palavra-passe</h1>
            <p className="mt-1 text-sm text-slate-400">Sports Club — Painel de administração</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700/50 bg-slate-800 p-8 shadow-2xl">
          {done ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-900/40">
                <CheckCircle className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="font-semibold text-white">Palavra-passe atualizada</h2>
                <p className="mt-1 text-sm text-slate-400">
                  A sua palavra-passe foi alterada com sucesso.
                </p>
              </div>
              <button
                onClick={() => navigate("/admin/login")}
                className="mt-2 w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                Ir para o login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {!token && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-800/60 bg-amber-900/30 px-4 py-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <p className="text-sm text-amber-300">
                    Link inválido. Solicite um novo email de recuperação.
                  </p>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-800/60 bg-red-900/30 px-4 py-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {/* New password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Nova palavra-passe
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type={show.pwd ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-600 bg-slate-700 py-3 pl-10 pr-12 text-white placeholder-slate-500 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => ({ ...s, pwd: !s.pwd }))}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {show.pwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex flex-1 gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            strength.score >= i ? strength.color : "bg-slate-700"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400">{strength.label}</span>
                  </div>
                )}
              </div>

              {/* Confirm */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Confirmar palavra-passe
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type={show.confirm ? "text" : "password"}
                    name="confirm"
                    value={form.confirm}
                    onChange={handleChange}
                    placeholder="Repetir palavra-passe"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-600 bg-slate-700 py-3 pl-10 pr-12 text-white placeholder-slate-500 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {show.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "A guardar…" : "Guardar nova palavra-passe"}
              </button>

              <div className="text-center">
                <Link to="/admin/login" className="text-sm text-indigo-400 hover:text-indigo-300">
                  ← Voltar ao login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShoppingBag, Eye, EyeOff, AlertCircle, Lock, Mail } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext.jsx";

export const AdminLoginPage = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Preencha o email e a palavra-passe.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const session = await login({ email: form.email, password: form.password });
      if (session?.user?.role !== "admin") {
        setError("Esta conta não tem permissões de administrador.");
        localStorage.removeItem("appiebd_user");
        localStorage.removeItem("appiebd_access_token");
        return;
      }
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Credenciais inválidas. Tente novamente."
      );
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
            <h1 className="text-2xl font-bold text-white">Painel de Administração</h1>
            <p className="mt-1 text-sm text-slate-400">Sports Club — Acesso restrito</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800 p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-800/60 bg-red-900/30 px-4 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="admin@exemplo.com"
                  autoComplete="email"
                  required
                  className="w-full rounded-xl border border-slate-600 bg-slate-700 py-3 pl-10 pr-4 text-white placeholder-slate-500 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-slate-300">
                  Palavra-passe
                </label>
                <Link
                  to="/admin/recuperar"
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                >
                  Esqueceu-se?
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPwd ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl border border-slate-600 bg-slate-700 py-3 pl-10 pr-12 text-white placeholder-slate-500 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "A entrar…" : "Entrar no painel"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          © {new Date().getFullYear()} Sports Club. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

import { useContext, useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, ExternalLink, Menu } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext.jsx";

const FO_PAGES = [
  { label: "Início",      href: "/" },
  { label: "Catálogo",    href: "/produtos" },
  { label: "Promoções",   href: "/promoções" },
  { label: "Pesquisa",    href: "/pesquisa" },
  { label: "Carrinho",    href: "/carrinho" },
  { label: "Checkout",    href: "/checkout" },
  { label: "Conta",       href: "/conta" },
  { label: "Encomendas",  href: "/conta/pedidos" },
  { label: "Página 404",  href: "/pagina-que-nao-existe" },
];

export const AdminHeader = ({ onMenuClick, title }) => {
  const { user } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 md:px-6">
      <button
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        onClick={onMenuClick}
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1">
        {title && <h1 className="text-lg font-semibold text-slate-800">{title}</h1>}
      </div>

      <div className="flex items-center gap-3">

        {/* ── Ver Site dropdown ── */}
        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ver site
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>

          {open && (
            <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-2xl border border-slate-200 bg-white py-1.5 shadow-xl shadow-slate-200/60">
              <p className="px-3 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Páginas do site
              </p>
              {FO_PAGES.map(({ label, href }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                >
                  {label}
                  <ExternalLink className="h-3 w-3 text-slate-400" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <Bell className="h-5 w-5" />
        </button>

        {/* User */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
            {(user?.firstName?.[0] || user?.name?.[0] || "A").toUpperCase()}
          </div>
          <div className="hidden md:block">
            <div className="text-sm font-medium text-slate-800">
              {user?.firstName || user?.name || "Admin"}
            </div>
            <div className="text-xs text-slate-500">{user?.email || ""}</div>
          </div>
        </div>
      </div>
    </header>
  );
};

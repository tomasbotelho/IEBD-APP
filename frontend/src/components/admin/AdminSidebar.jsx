import { NavLink, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import {
  LayoutDashboard, Package, Tag, FileText, Image, BarChart2, LogOut,
  ShoppingBag, X, ShoppingCart, Star, Mail, Monitor, ChevronDown,
  ChevronRight, Zap, Settings, Layers
} from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext.jsx";

const SECTIONS = [
  {
    label: "Analytics",
    icon: BarChart2,
    items: [
      { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" }
    ]
  },
  {
    label: "Gestão",
    icon: Zap,
    items: [
      { to: "/admin/encomendas", icon: ShoppingCart, label: "Encomendas" },
      { to: "/admin/avaliacoes", icon: Star, label: "Avaliações" },
      { to: "/admin/contactos", icon: Mail, label: "Contactos" }
    ]
  },
  {
    label: "Catálogo",
    icon: Package,
    items: [
      { to: "/admin/produtos", icon: Package, label: "Produtos" },
      { to: "/admin/campanhas", icon: Tag, label: "Campanhas" },
      { to: "/admin/colocacao", icon: Layers, label: "Colocação" }
    ]
  },
  {
    label: "Conteúdo",
    icon: FileText,
    items: [
      { to: "/admin/textos", icon: FileText, label: "Textos do Site" },
      { to: "/admin/banners", icon: Image, label: "Banners" }
    ]
  },
  {
    label: "Ferramentas",
    icon: Settings,
    items: [
      { to: "/admin/relatorios", icon: BarChart2, label: "Relatórios" },
      { to: "/admin/preview", icon: Monitor, label: "Pré-visualização" }
    ]
  }
];

const NavSection = ({ section, onClose }) => {
  const [expanded, setExpanded] = useState(true);
  const { icon: SectionIcon, label, items } = section;

  return (
    <div className="mb-1">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors"
      >
        <span className="flex items-center gap-2">
          <SectionIcon className="h-3 w-3" />
          {label}
        </span>
        {expanded
          ? <ChevronDown className="h-3 w-3" />
          : <ChevronRight className="h-3 w-3" />
        }
      </button>

      {expanded && (
        <ul className="mt-0.5 space-y-0.5">
          {items.map(({ to, icon: Icon, label: itemLabel }) => (
            <li key={to}>
              <NavLink
                end={to === "/admin/dashboard"}
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {itemLabel}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const AdminSidebar = ({ open, onClose }) => {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-slate-900 border-r border-slate-800 transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <ShoppingBag className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-none">Sports Club</div>
              <div className="text-xs text-slate-500 leading-none mt-0.5">Admin Panel</div>
            </div>
          </div>
          <button
            className="rounded-md p-1 text-slate-500 hover:text-white lg:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User badge */}
        <div className="border-b border-slate-800 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/20 text-indigo-400 text-xs font-bold uppercase">
              {user?.firstName?.[0] || user?.email?.[0] || "A"}
            </div>
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-white">
                {user?.firstName || "Administrador"}
              </div>
              <div className="truncate text-xs text-slate-500">{user?.email || ""}</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {SECTIONS.map((section) => (
            <NavSection key={section.label} section={section} onClose={onClose} />
          ))}
        </nav>

        {/* Logout */}
        <div className="border-t border-slate-800 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-red-900/30 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Terminar sessão
          </button>
        </div>
      </aside>
    </>
  );
};

import {
  ChevronDown,
  ChevronRight,
  Menu,
  ShoppingCart,
  UserRound,
  X
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../contexts/CartContext.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { SearchBar } from "../search/SearchBar.jsx";
import { BrandLogo } from "./BrandLogo.jsx";

const desktopLinks = [
  { label: "Novidades", href: "/produtos?sort=newest" },
  { label: "Promoções", href: "/promocoes" },
  { label: "Running", href: "/categoria/corrida" },
  { label: "Fitness", href: "/categoria/fitness" },
  { label: "Futebol", href: "/categoria/futebol" },
  { label: "Outdoor", href: "/categoria/outdoor" }
];

const mobileLinks = [
  { label: "Produtos", href: "/produtos" },
  { label: "Promoções", href: "/promocoes" },
  { label: "Futebol", href: "/categoria/futebol" },
  { label: "Conta", href: "/conta" }
];

export const Header = ({ categories = [] }) => {
  const [openMenu, setOpenMenu] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState(false);
  const { count } = useCart();
  const { isAuthenticated, user } = useAuth();

  return (
    <header
      className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur"
      onMouseLeave={() => setActiveMegaMenu(false)}
    >
      <div className="container-shell relative py-4">
        <div className="flex items-center justify-between gap-3 lg:hidden">
          <button
            className="rounded-xl border border-zinc-200 p-3"
            onClick={() => setOpenMenu((value) => !value)}
            type="button"
          >
            {openMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link className="flex min-w-0 items-center gap-3" to="/">
            <BrandLogo className="h-12" />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              className="flex h-11 items-center gap-2 rounded-xl border border-zinc-200 px-3 text-sm font-semibold text-ink-900"
              to={isAuthenticated ? "/conta" : "/login"}
            >
              <UserRound className="h-4 w-4" />
              <span className="max-w-[90px] truncate">
                {isAuthenticated ? user.name.split(" ")[0] : "Conta"}
              </span>
            </Link>
            <Link
              className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-black text-white"
              to="/carrinho"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 rounded-full bg-white px-1.5 py-0.5 text-[11px] font-bold text-black">
                {count}
              </span>
            </Link>
          </div>
        </div>

        <div className="mt-4 lg:hidden">
          <SearchBar />
        </div>

        <div className="hidden grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-6 lg:grid">
          <Link className="flex items-center" to="/">
            <BrandLogo className="h-16" />
          </Link>

          <SearchBar large />

          <div className="flex items-center justify-end gap-3">
            <Link
              className="flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-ink-900"
              to={isAuthenticated ? "/conta" : "/login"}
            >
              <UserRound className="h-4 w-4" />
              <span>{isAuthenticated ? user.name.split(" ")[0] : "Entrar / Registar"}</span>
            </Link>
            <Link
              className="relative flex items-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white"
              to="/carrinho"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Carrinho</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-black">
                {count}
              </span>
            </Link>
          </div>
        </div>

        <div className="mt-4 hidden items-center gap-5 border-t border-zinc-200 pt-4 lg:flex">
          <button
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white"
            onMouseEnter={() => setActiveMegaMenu(true)}
            type="button"
          >
            Todas as categorias
            <ChevronDown className="h-4 w-4" />
          </button>
          <div className="flex min-w-0 flex-1 items-center">
            <nav className="flex min-w-0 flex-1 items-center gap-4 text-sm font-semibold text-zinc-700 xl:gap-6">
              {desktopLinks.map((link) => (
                <Link
                  key={link.href}
                  className="flex-1 text-center hover:text-black"
                  to={link.href}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {activeMegaMenu ? (
          <div
            className="absolute inset-x-0 top-full hidden border-b border-zinc-200 bg-white shadow-[0_28px_70px_rgba(0,0,0,0.08)] lg:block"
            onMouseEnter={() => setActiveMegaMenu(true)}
            onMouseLeave={() => setActiveMegaMenu(false)}
          >
            <div className="container-shell max-w-[1420px] py-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {categories.map((category) => (
                  <div
                    key={category.slug}
                    className="rounded-[1.35rem] border border-zinc-200 bg-white p-4"
                  >
                    <Link
                      className="font-display text-[2.35rem] uppercase leading-none text-ink-900"
                      to={`/categoria/${category.slug}`}
                    >
                      {category.name}
                    </Link>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">{category.description}</p>
                    <div className="mt-5 space-y-2">
                      {category.subcategories.slice(0, 4).map((subcategory) => (
                        <Link
                          key={subcategory.slug}
                          className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2.5 text-sm font-semibold text-ink-900 transition hover:bg-black hover:text-white"
                          to={`/pesquisa?q=${subcategory.slug}`}
                        >
                          <span>{subcategory.name}</span>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {openMenu ? (
          <div className="mt-4 grid gap-4 rounded-[1.75rem] border border-zinc-200 bg-white p-4 shadow-card lg:hidden">
            <div className="grid gap-3">
              {mobileLinks.map((link) => (
                <Link
                  key={link.href}
                  className="rounded-xl bg-zinc-50 px-4 py-3 text-sm font-semibold text-ink-900"
                  to={link.href}
                >
                  {link.href === "/conta" && isAuthenticated ? user.name : link.label}
                </Link>
              ))}
            </div>
            <div className="border-t border-zinc-200 pt-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                Categorias
              </div>
              <div className="mt-3 grid gap-3">
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-ink-900"
                    to={`/categoria/${category.slug}`}
                  >
                    <span>{category.name}</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
};

import { Link } from "react-router-dom";
import { BrandLogo } from "./BrandLogo.jsx";

export const Footer = () => (
  <footer className="mt-16 bg-black text-white">
    <div className="container-shell grid gap-10 py-12 md:grid-cols-[1.2fr_repeat(3,minmax(0,1fr))]">
      <div className="space-y-5">
        <div className="flex items-center">
          <BrandLogo className="h-16" />
        </div>
        <p className="max-w-lg text-[15px] leading-7 text-white/72">
          vive o desporto
        </p>
      </div>
      <div>
        <h3 className="font-display text-2xl uppercase text-white">Loja</h3>
        <div className="mt-4 space-y-3 text-sm text-white/70">
          <Link className="block hover:text-white" to="/produtos">
            Produtos
          </Link>
          <Link className="block hover:text-white" to="/promocoes">
            Promoções
          </Link>
          <Link className="block hover:text-white" to="/pesquisa?q=running">
            Pesquisa rápida
          </Link>
        </div>
      </div>
      <div>
        <h3 className="font-display text-2xl uppercase text-white">Cliente</h3>
        <div className="mt-4 space-y-3 text-sm text-white/70">
          <Link className="block hover:text-white" to="/login">
            Login
          </Link>
          <Link className="block hover:text-white" to="/registo">
            Registo
          </Link>
          <Link className="block hover:text-white" to="/conta/pedidos">
            Histórico
          </Link>
        </div>
      </div>
      <div>
        <h3 className="font-display text-2xl uppercase text-white">Serviço</h3>
        <div className="mt-4 space-y-3 text-sm text-white/70">
          <p>Entrega 24/48h</p>
          <p>Click & collect</p>
          <p>Checkout seguro</p>
        </div>
      </div>
    </div>
  </footer>
);

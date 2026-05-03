import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar.jsx";
import { AdminHeader } from "./AdminHeader.jsx";

const PAGE_TITLES = {
  "/admin/dashboard": "Dashboard",
  "/admin/produtos": "Produtos",
  "/admin/produtos/novo": "Novo Produto",
  "/admin/campanhas": "Campanhas",
  "/admin/campanhas/nova": "Nova Campanha",
  "/admin/textos": "Textos do Site",
  "/admin/banners": "Banners de Página",
  "/admin/relatorios": "Relatórios",
  "/admin/encomendas": "Encomendas",
  "/admin/avaliacoes": "Avaliações",
  "/admin/contactos": "Contactos",
  "/admin/preview": "Pré-visualização",
  "/admin/colocacao": "Gestão de Colocação"
};

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();

  const title =
    PAGE_TITLES[pathname] ||
    (pathname.includes("/admin/produtos/") ? "Editar Produto" : "") ||
    (pathname.includes("/admin/campanhas/") ? "Editar Campanha" : "") ||
    (pathname.includes("/admin/encomendas/") ? "Detalhe da Encomenda" : "") ||
    "Admin";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Pencil, Trash2, Package, AlertCircle, RefreshCw, Star } from "lucide-react";
import { adminService } from "../../../services/adminService.js";

const fmt = (n) =>
  new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(n || 0);

const ConfirmModal = ({ product, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
        <Trash2 className="h-5 w-5 text-red-600" />
      </div>
      <h3 className="mt-4 font-semibold text-slate-800">Eliminar produto</h3>
      <p className="mt-2 text-sm text-slate-500">
        Tem a certeza que deseja eliminar <strong>{product?.name}</strong>? Esta ação não pode ser
        revertida.
      </p>
      <div className="mt-5 flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
        >
          {loading ? "A eliminar…" : "Eliminar"}
        </button>
      </div>
    </div>
  </div>
);

export const ProductsListPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const LIMIT = 30;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await adminService.listProducts({ search, categoryId, page, limit: LIMIT });
      setProducts(result.products || []);
      setTotal(result.total || 0);
    } catch {
      setError("Erro ao carregar produtos.");
    } finally {
      setLoading(false);
    }
  }, [search, categoryId, page]);

  useEffect(() => {
    adminService.listCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminService.deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(err?.response?.data?.message || "Erro ao eliminar produto.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5">
      {deleteTarget && (
        <ConfirmModal
          product={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2 min-w-0">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar produtos…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <select
            value={categoryId}
            onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
          >
            <option value="">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </form>

        <Link
          to="/admin/produtos/novo"
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo produto
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Stats bar */}
      <div className="text-sm text-slate-500">
        {loading ? "A carregar…" : `${total} produto${total !== 1 ? "s" : ""} encontrado${total !== 1 ? "s" : ""}`}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400">
            <Package className="h-10 w-10 opacity-40" />
            <p>Nenhum produto encontrado.</p>
            <Link to="/admin/produtos/novo" className="text-sm text-indigo-600 hover:underline">
              Criar primeiro produto
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Produto</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Categoria</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 text-right">Preço</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 text-right">Stock</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 text-center">Destaque</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="h-10 w-10 rounded-xl object-cover border border-slate-200" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                            <Package className="h-5 w-5 text-slate-400" />
                          </div>
                        )}
                        <span className="font-medium text-slate-800 line-clamp-1">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{p.categoryName || "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">{fmt(p.price)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${p.stock === 0 ? "text-red-500" : p.stock < 5 ? "text-amber-500" : "text-slate-700"}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.highlighted ? (
                        <Star className="h-4 w-4 text-amber-500 mx-auto fill-amber-400" />
                      ) : (
                        <Star className="h-4 w-4 text-slate-300 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/produtos/${p.id}`)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? "bg-indigo-600 text-white"
                  : "border border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

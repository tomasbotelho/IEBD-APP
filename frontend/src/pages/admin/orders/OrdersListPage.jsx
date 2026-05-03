import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCart, Search, ChevronRight, RefreshCw, AlertCircle, Filter
} from "lucide-react";
import { adminService } from "../../../services/adminService.js";

const fmt = (n) =>
  new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(n || 0);

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  }).format(new Date(iso));
};

const STATUS_COLORS = {
  1: "bg-amber-100 text-amber-700",
  2: "bg-emerald-100 text-emerald-700",
  3: "bg-blue-100 text-blue-700",
  4: "bg-red-100 text-red-600",
  5: "bg-green-100 text-green-700",
  6: "bg-purple-100 text-purple-700"
};

const StatusBadge = ({ statusId, statusLabel }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[statusId] || "bg-slate-100 text-slate-600"}`}>
    {statusLabel}
  </span>
);

export const OrdersListPage = () => {
  const [orders, setOrders] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    setError("");
    try {
      const data = await adminService.listOrders({ status: statusFilter, search, page: p, limit: 40 });
      setOrders(data.orders || []);
      setStatuses(data.statuses || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setPage(p);
    } catch {
      setError("Erro ao carregar encomendas.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { load(1); }, [load]);

  const handleSearch = (e) => {
    e.preventDefault();
    load(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Encomendas</h2>
          <p className="text-sm text-slate-500">{total} encomendas no total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex flex-1 min-w-48 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por cliente, email ou Nº…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Pesquisar
          </button>
        </form>

        <div className="relative flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); }}
            className="rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Todos os estados</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-16 text-center">
          <ShoppingCart className="h-10 w-10 text-slate-300" />
          <p className="text-slate-500">Nenhuma encomenda encontrada.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Nº</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Cliente</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Data</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Total</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Pagamento</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">#{order.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{order.customer.name}</div>
                      <div className="text-xs text-slate-400">{order.customer.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{fmtDate(order.createdAt)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{fmt(order.total)}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs capitalize">
                      {order.paymentMethod || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge statusId={order.statusId} statusLabel={order.statusLabel} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/encomendas/${order.id}`}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                      >
                        Ver <ChevronRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
              <span className="text-sm text-slate-500">Página {page} de {pages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => load(page - 1)}
                  disabled={page <= 1}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  onClick={() => load(page + 1)}
                  disabled={page >= pages}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  Seguinte
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

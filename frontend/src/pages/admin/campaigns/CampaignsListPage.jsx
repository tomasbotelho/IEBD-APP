import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Tag, AlertCircle, RefreshCw } from "lucide-react";
import { adminService } from "../../../services/adminService.js";

const fmt = (n) =>
  new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(n || 0);

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const ConfirmModal = ({ campaign, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
        <Trash2 className="h-5 w-5 text-red-600" />
      </div>
      <h3 className="mt-4 font-semibold text-slate-800">Eliminar campanha</h3>
      <p className="mt-2 text-sm text-slate-500">
        Tem a certeza que deseja eliminar <strong>{campaign?.name}</strong>? Os produtos associados
        perderão o desconto desta campanha.
      </p>
      <div className="mt-5 flex gap-3">
        <button onClick={onCancel} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
          Cancelar
        </button>
        <button onClick={onConfirm} disabled={loading} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60">
          {loading ? "A eliminar…" : "Eliminar"}
        </button>
      </div>
    </div>
  </div>
);

export const CampaignsListPage = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCampaigns(await adminService.listCampaigns());
    } catch {
      setError("Erro ao carregar campanhas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await adminService.deleteCampaign(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(err?.response?.data?.message || "Erro ao eliminar campanha.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const isActive = (c) => {
    const now = Date.now();
    const start = c.startDate ? new Date(c.startDate).getTime() : 0;
    const end = c.endDate ? new Date(c.endDate).getTime() : Infinity;
    return now >= start && now <= end;
  };

  return (
    <div className="space-y-5">
      {deleteTarget && (
        <ConfirmModal campaign={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{campaigns.length} campanha{campaigns.length !== 1 ? "s" : ""}</p>
        <Link
          to="/admin/campanhas/nova"
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Nova campanha
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400">
            <Tag className="h-10 w-10 opacity-40" />
            <p>Nenhuma campanha criada ainda.</p>
            <Link to="/admin/campanhas/nova" className="text-sm text-indigo-600 hover:underline">
              Criar primeira campanha
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Nome</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Desconto</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Início</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Fim</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 text-center">Produtos</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 text-center">Estado</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                        -{c.discount}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(c.startDate)}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(c.endDate)}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{c.productCount || 0}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        isActive(c)
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {isActive(c) ? "Ativa" : "Inativa"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/campanhas/${c.id}`)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(c)}
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
    </div>
  );
};

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Package, User, MapPin, CreditCard, RefreshCw, AlertCircle,
  CheckCircle, XCircle, Clock
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
  1: "bg-amber-100 text-amber-700 border-amber-200",
  2: "bg-emerald-100 text-emerald-700 border-emerald-200",
  3: "bg-blue-100 text-blue-700 border-blue-200",
  4: "bg-red-100 text-red-600 border-red-200",
  5: "bg-green-100 text-green-700 border-green-200",
  6: "bg-purple-100 text-purple-700 border-purple-200"
};

const SectionCard = ({ icon: Icon, title, children }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-center gap-2">
      <Icon className="h-4 w-4 text-slate-400" />
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
    </div>
    {children}
  </div>
);

export const OrderDetailAdminPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newStatusId, setNewStatusId] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    setLoading(true);
    adminService.getOrder(Number(id))
      .then((data) => {
        setOrder(data);
        setNewStatusId(String(data.statusId));
      })
      .catch(() => setError("Encomenda não encontrada."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdateStatus = async () => {
    if (!newStatusId) return;
    setSaving(true);
    setSaveMsg("");
    try {
      const updated = await adminService.updateOrderStatus(
        Number(id),
        Number(newStatusId),
        cancelReason
      );
      setOrder(updated);
      setSaveMsg("Estado atualizado com sucesso.");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err) {
      setSaveMsg(err?.response?.data?.message || "Erro ao atualizar estado.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-slate-600">{error || "Encomenda não encontrada."}</p>
        <Link to="/admin/encomendas" className="text-sm text-indigo-600 hover:underline">
          Voltar às encomendas
        </Link>
      </div>
    );
  }

  const isCancelling = Number(newStatusId) === 4;
  const statusColor = STATUS_COLORS[order.statusId] || "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <Link
          to="/admin/encomendas"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Encomendas
        </Link>
        <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Encomenda #{order.id}</h2>
            <p className="text-sm text-slate-500">{fmtDate(order.createdAt)}</p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-sm font-medium ${statusColor}`}>
            {order.statusLabel}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <SectionCard icon={Package} title="Artigos">
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left">
                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-500">Produto</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-center">Qty</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right">Preço unit.</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item) => (
                    <tr key={item.lineId}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.productImage && (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="h-10 w-10 rounded-lg object-cover border border-slate-200"
                            />
                          )}
                          <span className="font-medium text-slate-700">{item.productName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{fmt(item.unitPrice)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">
                        {fmt(item.unitPrice * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50">
                    <td colSpan={3} className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                      Total
                    </td>
                    <td className="px-4 py-3 text-right text-base font-bold text-slate-900">
                      {fmt(order.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </SectionCard>

          {/* Status update */}
          <SectionCard icon={CheckCircle} title="Atualizar estado">
            <div className="space-y-3">
              <select
                value={newStatusId}
                onChange={(e) => setNewStatusId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
              >
                {(order.statuses || []).map((s) => (
                  <option key={s.id} value={String(s.id)}>{s.label}</option>
                ))}
              </select>

              {isCancelling && (
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Motivo do cancelamento (opcional)…"
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none resize-none"
                />
              )}

              {order.cancelReason && order.statusId === 4 && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  <strong>Motivo:</strong> {order.cancelReason}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={handleUpdateStatus}
                  disabled={saving || String(newStatusId) === String(order.statusId)}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? "A guardar…" : "Guardar estado"}
                </button>
                {saveMsg && (
                  <span className={`text-sm ${saveMsg.includes("sucesso") ? "text-emerald-600" : "text-red-600"}`}>
                    {saveMsg}
                  </span>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Notes */}
          {order.notes && (
            <SectionCard icon={Clock} title="Observações do cliente">
              <p className="text-sm text-slate-600">{order.notes}</p>
            </SectionCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer */}
          <SectionCard icon={User} title="Cliente">
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs text-slate-400">Nome</dt>
                <dd className="font-medium text-slate-800">{order.customer.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Email</dt>
                <dd className="text-slate-600">{order.customer.email || "—"}</dd>
              </div>
              {order.customer.phone && (
                <div>
                  <dt className="text-xs text-slate-400">Telefone</dt>
                  <dd className="text-slate-600">{order.customer.phone}</dd>
                </div>
              )}
            </dl>
          </SectionCard>

          {/* Address */}
          <SectionCard icon={MapPin} title="Endereço de entrega">
            <address className="not-italic text-sm text-slate-600 space-y-1">
              <div>{order.address.street}</div>
              {order.address.parish && <div>{order.address.parish}</div>}
              <div>{order.address.municipality}, {order.address.district}</div>
              <div>{order.address.postalCode}</div>
            </address>
          </SectionCard>

          {/* Payment */}
          <SectionCard icon={CreditCard} title="Pagamento">
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs text-slate-400">Método</dt>
                <dd className="font-medium text-slate-800 capitalize">
                  {order.paymentMethod || "—"}
                </dd>
              </div>
              {order.paymentProvider && (
                <div>
                  <dt className="text-xs text-slate-400">Fornecedor</dt>
                  <dd className="text-slate-600 capitalize">{order.paymentProvider}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-slate-400">Estado pagamento</dt>
                <dd className={`text-xs font-medium ${
                  order.paymentStatus === "paid" ? "text-emerald-600" :
                  order.paymentStatus === "failed" ? "text-red-600" : "text-amber-600"
                }`}>
                  {order.paymentStatus === "paid" ? "Pago" :
                   order.paymentStatus === "failed" ? "Falhou" :
                   order.paymentStatus || "Pendente"}
                </dd>
              </div>
            </dl>
          </SectionCard>

          {/* Timestamps */}
          <SectionCard icon={Clock} title="Datas">
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs text-slate-400">Criada</dt>
                <dd className="text-slate-600">{fmtDate(order.createdAt)}</dd>
              </div>
              {order.deliveredAt && (
                <div>
                  <dt className="text-xs text-slate-400">Entregue</dt>
                  <dd className="text-emerald-600">{fmtDate(order.deliveredAt)}</dd>
                </div>
              )}
              {order.cancelledAt && (
                <div>
                  <dt className="text-xs text-slate-400">Cancelada</dt>
                  <dd className="text-red-600">{fmtDate(order.cancelledAt)}</dd>
                </div>
              )}
            </dl>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

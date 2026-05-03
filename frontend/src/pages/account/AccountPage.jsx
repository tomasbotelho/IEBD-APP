import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Check, X } from "lucide-react";
import { Seo } from "../../components/common/Seo.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { ErrorState } from "../../components/ui/ErrorState.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useTexts } from "../../contexts/SiteTextsContext.jsx";
import { buildCanonicalUrl } from "../../lib/seo.js";
import { accountService } from "../../services/accountService.js";
import { formatDate, formatPrice } from "../../utils/format.js";

const OrdersSection = ({ title, description, emptyTitle, emptyDescription, orders, allowCancel, onCancel, detailLabel, cancelLabel }) => (
  <section className="surface-card p-6 md:p-8">
    <h2 className="text-2xl font-bold">{title}</h2>
    <p className="mt-2 text-sm text-slate-600">{description}</p>
    {!orders.length ? (
      <div className="mt-6">
        <EmptyState description={emptyDescription} title={emptyTitle} />
      </div>
    ) : (
      <div className="mt-6 space-y-4">
        {orders.map((order) => (
          <article key={order.id} className="rounded-[1.5rem] border border-zinc-200 bg-white p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm text-slate-500">#{order.id}</div>
                <div className="mt-1 text-xl font-bold">{order.status}</div>
                <div className="mt-2 text-sm text-slate-600">
                  {formatDate(order.createdAt)} | {formatPrice(order.total)}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link className="button-secondary" to={`/conta/pedidos/${order.id}`}>
                  {detailLabel}
                </Link>
                {allowCancel && order.canCancel ? (
                  <button
                    className="rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600"
                    onClick={() => onCancel(order.id)}
                    type="button"
                  >
                    {cancelLabel}
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    )}
  </section>
);

export const AccountPage = () => {
  const t = useTexts();
  const { logout } = useAuth();
  const [sort, setSort] = useState("date_desc");
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState("");

  const sortOptions = [
    { id: "date_desc", label: t("account", "sort_newest", "Mais recentes") },
    { id: "date_asc",  label: t("account", "sort_oldest", "Mais antigas") },
    { id: "cost_desc", label: t("account", "sort_highest", "Maior valor") },
    { id: "cost_asc",  label: t("account", "sort_lowest",  "Menor valor") }
  ];

  const loadDashboard = async (currentSort) => {
    setLoading(true);
    setError("");
    try {
      setDashboard(await accountService.getDashboard(currentSort));
    } catch (err) {
      setError(err.response?.data?.message || t("account", "error_load", "Não foi possível carregar a conta."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(sort); }, [sort]);

  const handleCancelOrder = async (orderId) => {
    setActionError("");
    if (!window.confirm(t("account", "cancel_confirm", "Tem a certeza de que pretende cancelar esta encomenda?"))) return;
    const reason = window.prompt("Indique o motivo do cancelamento.", t("account", "cancel_reason", "Cancelamento solicitado pelo cliente.")) || "";
    try {
      await accountService.cancelOrder(orderId, reason.trim() || t("account", "cancel_reason", "Cancelamento solicitado pelo cliente."));
      await loadDashboard(sort);
    } catch (err) {
      setActionError(err.response?.data?.message || t("account", "error_cancel", "Não foi possível cancelar a encomenda."));
    }
  };

  const startEditName = () => {
    setNameInput(dashboard?.profile?.name || "");
    setNameError("");
    setEditingName(true);
  };

  const cancelEditName = () => {
    setEditingName(false);
    setNameError("");
  };

  const saveEditName = async () => {
    const trimmed = nameInput.trim();
    if (trimmed.length < 2) { setNameError("O nome deve ter pelo menos 2 caracteres."); return; }
    setNameSaving(true);
    setNameError("");
    try {
      const updatedUser = await accountService.updateNickname(trimmed);
      setDashboard((prev) => ({ ...prev, profile: updatedUser }));
      setEditingName(false);
    } catch (err) {
      setNameError(err.response?.data?.message || "Não foi possível guardar o nome.");
    } finally {
      setNameSaving(false);
    }
  };

  const seo = (
    <Seo
      canonical={buildCanonicalUrl("/conta")}
      description={t("account", "seo_description", "Área do cliente com perfil, histórico e acesso rápido.")}
      title={t("account", "seo_title", "Conta | Sports Club")}
    />
  );

  if (loading) {
    return (
      <section className="container-shell py-10">
        {seo}
        <div className="surface-card p-8">{t("account", "loading", "A carregar conta…")}</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="container-shell py-10">
        {seo}
        <ErrorState title={error} />
      </section>
    );
  }

  const sharedSectionProps = {
    detailLabel: t("account", "order_detail_link", "Ver detalhe"),
    cancelLabel:  t("account", "order_cancel_btn",  "Cancelar")
  };

  return (
    <section className="container-shell py-10">
      {seo}
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="surface-card p-6">
          <div className="rounded-3xl bg-pine-50 p-4">
            <div className="text-sm text-slate-500">{t("account", "status_authenticated", "Cliente autenticado")}</div>
            {editingName ? (
              <div className="mt-2 space-y-2">
                <input
                  autoFocus
                  className="input-base text-base font-bold"
                  value={nameInput}
                  maxLength={50}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveEditName(); if (e.key === "Escape") cancelEditName(); }}
                />
                {nameError && <p className="text-xs text-red-600">{nameError}</p>}
                <div className="flex gap-1.5">
                  <button
                    onClick={saveEditName}
                    disabled={nameSaving}
                    className="flex items-center gap-1 rounded-lg bg-pine-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-pine-700 disabled:opacity-60"
                  >
                    <Check className="h-3 w-3" />{nameSaving ? "A guardar…" : "Guardar"}
                  </button>
                  <button
                    onClick={cancelEditName}
                    className="flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-zinc-100"
                  >
                    <X className="h-3 w-3" /> Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-2">
                <h1 className="text-2xl font-bold">{dashboard?.profile?.name}</h1>
                <button
                  onClick={startEditName}
                  className="rounded-lg p-1 text-slate-400 hover:bg-pine-100 hover:text-pine-700"
                  title="Editar nome"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            )}
            <p className="mt-1 text-sm text-slate-600">{dashboard?.profile?.email}</p>
          </div>
          <div className="mt-6 space-y-3 text-sm">
            <div>
              <span className="font-semibold">{t("account", "label_phone", "Telefone:")}</span>{" "}
              {dashboard?.profile?.phone || "--"}
            </div>
            <div>
              <span className="font-semibold">{t("account", "label_postcode", "Código-postal:")}</span>{" "}
              {dashboard?.profile?.postalCode || "--"}
            </div>
          </div>
          <label className="mt-6 block text-sm font-semibold">
            {t("account", "sort_label", "Ordenar encomendas")}
            <select className="input-base mt-2" value={sort} onChange={(e) => setSort(e.target.value)}>
              {sortOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </label>
          <button className="button-secondary mt-6 w-full" onClick={logout} type="button">
            {t("nav", "logout", "Terminar sessão")}
          </button>
        </aside>

        <div className="space-y-6">
          {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}

          <OrdersSection
            {...sharedSectionProps}
            allowCancel
            title={t("account", "active_title", "Encomendas ativas")}
            description={t("account", "active_desc", "Encomendas ainda não entregues. Pode acompanhar o estado e cancelar enquanto estão ativas.")}
            emptyTitle={t("account", "active_empty_title", "Sem encomendas ativas")}
            emptyDescription={t("account", "active_empty_desc", "Não existem encomendas ativas neste momento.")}
            onCancel={handleCancelOrder}
            orders={dashboard?.activeOrders || []}
          />

          <OrdersSection
            {...sharedSectionProps}
            title={t("account", "delivered_title", "Histórico de encomendas")}
            description={t("account", "delivered_desc", "Histórico de encomendas concluídas e já entregues.")}
            emptyTitle={t("account", "delivered_empty_title", "Sem histórico entregue")}
            emptyDescription={t("account", "delivered_empty_desc", "Ainda não existem encomendas entregues.")}
            onCancel={() => {}}
            orders={dashboard?.deliveredOrders || []}
          />

          <OrdersSection
            {...sharedSectionProps}
            title={t("account", "cancelled_title", "Devoluções / cancelamentos")}
            description={t("account", "cancelled_desc", "Pedidos cancelados e respetivo estado de reembolso.")}
            emptyTitle={t("account", "cancelled_empty_title", "Sem devoluções ou cancelamentos")}
            emptyDescription={t("account", "cancelled_empty_desc", "Ainda não existem cancelamentos registados.")}
            onCancel={() => {}}
            orders={dashboard?.cancelledOrders || []}
          />
        </div>
      </div>
    </section>
  );
};

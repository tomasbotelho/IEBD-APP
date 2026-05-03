import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Seo } from "../../components/common/Seo.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { ErrorState } from "../../components/ui/ErrorState.jsx";
import { useTexts } from "../../contexts/SiteTextsContext.jsx";
import { buildCanonicalUrl } from "../../lib/seo.js";
import { accountService } from "../../services/accountService.js";
import { formatDate, formatPrice } from "../../utils/format.js";

export const OrdersPage = () => {
  const t = useTexts();
  const [sort, setSort] = useState("date_desc");
  const [status, setStatus] = useState("all");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const sortOptions = [
    { id: "date_desc", label: t("orders", "sort_newest",  "Mais recentes") },
    { id: "date_asc",  label: t("orders", "sort_oldest",  "Mais antigas") },
    { id: "cost_desc", label: t("orders", "sort_highest", "Maior valor") },
    { id: "cost_asc",  label: t("orders", "sort_lowest",  "Menor valor") }
  ];

  const statusOptions = [
    { id: "all",       label: t("orders", "status_all",       "Todas") },
    { id: "active",    label: t("orders", "status_active",    "Ativas") },
    { id: "delivered", label: t("orders", "status_delivered", "Entregues") },
    { id: "cancelled", label: t("orders", "status_cancelled", "Canceladas") }
  ];

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    accountService.getOrders({ sort, status })
      .then((items) => { if (active) setOrders(items); })
      .catch((err) => { if (active) setError(err.response?.data?.message || t("orders", "error_load", "Não foi possível carregar as encomendas.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [sort, status]);

  if (error) {
    return (
      <div className="container-shell py-10">
        <ErrorState title={error} />
      </div>
    );
  }

  return (
    <section className="container-shell py-10">
      <Seo
        canonical={buildCanonicalUrl("/conta/pedidos")}
        description={t("orders", "seo_description", "Histórico de pedidos do cliente.")}
        title={t("orders", "seo_title", "Pedidos | Sports Club")}
      />
      <div className="surface-card p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("orders", "heading", "Encomendas")}</h1>
            <p className="mt-2 text-sm text-slate-600">
              {t("orders", "description", "Consulte o histórico completo, encomendas ativas e cancelamentos.")}
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm font-semibold">
              {t("orders", "filter_status", "Estado")}
              <select className="input-base mt-2" value={status} onChange={(e) => setStatus(e.target.value)}>
                {statusOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold">
              {t("orders", "filter_sort", "Ordenação")}
              <select className="input-base mt-2" value={sort} onChange={(e) => setSort(e.target.value)}>
                {sortOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </label>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 text-sm text-slate-600">{t("orders", "loading", "A carregar encomendas…")}</div>
        ) : !orders.length ? (
          <div className="mt-8">
            <EmptyState
              action={{ href: "/produtos", label: t("orders", "empty_action", "Começar a comprar") }}
              description={t("orders", "empty_desc", "Ainda não existem encomendas para os filtros selecionados.")}
              title={t("orders", "empty_title", "Sem encomendas")}
            />
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {orders.map((order) => (
              <article key={order.id} className="flex flex-col gap-4 rounded-[1.5rem] border border-zinc-200 bg-white p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm text-slate-500">#{order.id}</div>
                  <h2 className="text-xl font-bold">{order.status}</h2>
                  <p className="text-sm text-slate-600">{formatDate(order.createdAt)}</p>
                </div>
                <div className="text-sm">
                  <div><span className="font-semibold">{t("orders", "payment_label", "Pagamento:")}</span> {order.paymentStatus}</div>
                  <div><span className="font-semibold">{t("orders", "total_label", "Total:")}</span> {formatPrice(order.total)}</div>
                </div>
                <Link className="button-secondary" to={`/conta/pedidos/${order.id}`}>
                  {t("orders", "detail_link", "Ver detalhe")}
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

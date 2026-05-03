import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Seo } from "../../components/common/Seo.jsx";
import { ErrorState } from "../../components/ui/ErrorState.jsx";
import { useTexts } from "../../contexts/SiteTextsContext.jsx";
import { buildCanonicalUrl } from "../../lib/seo.js";
import { accountService } from "../../services/accountService.js";
import { formatDate, formatPrice } from "../../utils/format.js";

export const OrderDetailPage = () => {
  const t = useTexts();
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const loadOrder = async () => {
    setLoading(true);
    setError("");
    try {
      setOrder(await accountService.getOrder(id));
    } catch (err) {
      setError(err.response?.data?.message || t("order_detail", "error_not_found", "Encomenda não encontrada."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrder(); }, [id]);

  const handleCancel = async () => {
    setActionError("");
    if (!window.confirm(t("order_detail", "cancel_confirm", "Tem a certeza de que pretende cancelar esta encomenda?"))) return;
    const reason = window.prompt("Indique o motivo do cancelamento.", t("order_detail", "cancel_reason", "Cancelamento solicitado pelo cliente.")) || "";
    try {
      await accountService.cancelOrder(id, reason.trim() || t("order_detail", "cancel_reason", "Cancelamento solicitado pelo cliente."));
      await loadOrder();
    } catch (err) {
      setActionError(err.response?.data?.message || t("order_detail", "error_cancel", "Não foi possível cancelar a encomenda."));
    }
  };

  if (error) {
    return <div className="container-shell py-10"><ErrorState title={error} /></div>;
  }

  if (loading) {
    return <div className="container-shell py-10"><div className="surface-card p-8">{t("account", "loading", "A carregar conta…")}</div></div>;
  }

  return (
    <section className="container-shell py-10">
      <Seo
        canonical={buildCanonicalUrl(`/conta/pedidos/${id}`)}
        description={t("order_detail", "seo_description", "Detalhe de encomenda Sports Club.")}
        title={`${t("nav", "orders", "Encomendas")} #${id} | Sports Club`}
      />
      <div className="surface-card p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("nav", "orders", "Encomendas")} #{order?.id}</h1>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <div><span className="font-semibold">{t("order_detail", "label_status", "Estado:")}</span> {order?.status}</div>
              <div><span className="font-semibold">{t("order_detail", "label_payment", "Pagamento:")}</span> {order?.paymentStatus}</div>
              <div>
                <span className="font-semibold">{t("order_detail", "label_created", "Criada em:")}</span>{" "}
                {order ? formatDate(order.createdAt) : "--"}
              </div>
              <div>
                <span className="font-semibold">{t("order_detail", "label_total", "Valor total:")}</span>{" "}
                {order ? formatPrice(order.total) : "--"}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {order?.canCancel ? (
              <button className="rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600" onClick={handleCancel} type="button">
                {t("order_detail", "btn_cancel", "Cancelar encomenda")}
              </button>
            ) : null}
            <button className="button-secondary" onClick={() => navigate("/conta/pedidos")} type="button">
              {t("order_detail", "btn_back", "Voltar")}
            </button>
          </div>
        </div>

        {actionError ? <p className="mt-4 text-sm text-red-600">{actionError}</p> : null}

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-5">
            <h2 className="text-xl font-bold">{t("order_detail", "shipping_heading", "Morada de envio")}</h2>
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <div>{order?.shippingAddress?.street}</div>
              <div>{order?.shippingAddress?.postalCode} {order?.shippingAddress?.municipality}</div>
              <div>{order?.shippingAddress?.parish} | {order?.shippingAddress?.district}</div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-5">
            <h2 className="text-xl font-bold">{t("order_detail", "refund_heading", "Reembolso / cancelamento")}</h2>
            {order?.cancellation ? (
              <div className="mt-4 space-y-2 text-sm text-slate-700">
                <div>
                  <span className="font-semibold">{t("order_detail", "refund_cancelled_at", "Cancelada em:")}</span>{" "}
                  {formatDate(order.cancellation.cancelledAt)}
                </div>
                <div>
                  <span className="font-semibold">{t("order_detail", "refund_reason", "Motivo:")}</span>{" "}
                  {order.cancellation.reason}
                </div>
                <div>
                  <span className="font-semibold">{t("order_detail", "refund_status", "Estado do reembolso:")}</span>{" "}
                  {order.cancellation.refundStatus || t("order_detail", "refund_status_def", "Em processamento")}
                </div>
                <div>
                  <span className="font-semibold">{t("order_detail", "refund_amount", "Montante:")}</span>{" "}
                  {formatPrice(order.cancellation.refundAmount || 0)}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                {t("order_detail", "no_cancellation", "Ainda não existe qualquer cancelamento associado a esta encomenda.")}
              </p>
            )}
          </div>
        </section>

        <div className="mt-8 space-y-4">
          {order?.items?.map((item) => (
            <div key={item.id} className="flex flex-col gap-4 rounded-[1.5rem] bg-sand-50 px-4 py-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <img alt={item.product?.name} className="h-20 w-20 rounded-2xl object-cover" src={item.product?.image} />
                <div>
                  <div className="font-semibold">{item.product?.name}</div>
                  <div className="text-sm text-slate-500">
                    {item.quantity} {t("order_detail", "unit_qty", "unidades")}
                  </div>
                </div>
              </div>
              <div className="font-semibold">{formatPrice(item.total)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

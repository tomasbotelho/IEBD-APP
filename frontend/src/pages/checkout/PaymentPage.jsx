import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OrderSummary } from "../../components/checkout/OrderSummary.jsx";
import { PayPalPaymentBox } from "../../components/checkout/PayPalPaymentBox.jsx";
import { StripePaymentBox } from "../../components/checkout/StripePaymentBox.jsx";
import { Seo } from "../../components/common/Seo.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { useCart } from "../../contexts/CartContext.jsx";
import { useTexts } from "../../contexts/SiteTextsContext.jsx";
import { buildCanonicalUrl } from "../../lib/seo.js";
import { checkoutService } from "../../services/checkoutService.js";
import { formatPrice } from "../../utils/format.js";

export const PaymentPage = () => {
  const t = useTexts();
  const [payload, setPayload] = useState(null);
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { clearCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const raw = sessionStorage.getItem("checkout_session");
    if (!raw) return;
    try {
      setPayload(JSON.parse(raw));
    } catch {
      sessionStorage.removeItem("checkout_session");
      setApiError(t("payment", "error_session", "A sessão de pagamento expirou. Volte ao checkout e tente novamente."));
    }
  }, []);

  const concludeOrder = (orderId) => {
    clearCart();
    sessionStorage.removeItem("checkout_session");
    navigate(`/conta/pedidos/${orderId}`, { replace: true });
  };

  const handleCardSuccess = async (paymentIntentId) => {
    if (!payload) return;
    setApiError("");
    setSubmitting(true);
    try {
      const response = await checkoutService.confirmCardPayment(payload.checkoutSession.id, paymentIntentId);
      concludeOrder(response.order.id);
    } catch (error) {
      setApiError(error.response?.data?.message || error.message || t("payment", "error_confirm", "Não foi possível confirmar o pagamento."));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayPalApprove = async (orderId) => {
    if (!payload) return;
    setApiError("");
    setSubmitting(true);
    try {
      const response = await checkoutService.capturePayPalPayment(payload.checkoutSession.id, orderId);
      concludeOrder(response.order.id);
    } catch (error) {
      setApiError(error.response?.data?.message || error.message || t("payment", "error_paypal", "Não foi possível concluir o pagamento PayPal."));
    } finally {
      setSubmitting(false);
    }
  };

  if (!payload) {
    return (
      <section className="container-shell py-10">
        <EmptyState
          action={{ href: "/checkout", label: t("payment", "empty_action", "Voltar ao checkout") }}
          description={t("payment", "empty_desc", "Não existe uma sessão de checkout pronta para pagamento.")}
          title={t("payment", "empty_title", "Pagamento indisponível")}
        />
      </section>
    );
  }

  return (
    <section className="container-shell py-10">
      <Seo
        canonical={buildCanonicalUrl("/metodos-pagamento")}
        description={t("payment", "seo_description", "Finalização de pagamento com Stripe e PayPal.")}
        title={t("payment", "seo_title", "Métodos de pagamento | Sports Club")}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {payload.payment.provider === "stripe" ? (
            <StripePaymentBox
              clientSecret={payload.payment.clientSecret}
              customer={payload.customer}
              onSuccess={handleCardSuccess}
            />
          ) : (
            <PayPalPaymentBox
              amount={formatPrice(payload.orderPreview.total)}
              onApprove={handlePayPalApprove}
              orderId={payload.payment.orderId}
            />
          )}

          <section className="surface-card p-6 md:p-8">
            <h2 className="text-xl font-bold">{t("payment", "address_heading", "Morada de envio")}</h2>
            <div className="mt-4 grid gap-3 text-sm text-slate-700">
              <div>{payload.customer.firstName} {payload.customer.lastName}</div>
              <div>{payload.customer.street}</div>
              <div>{payload.customer.postalCode}</div>
            </div>
          </section>

          {apiError ? <p className="text-sm text-red-600">{apiError}</p> : null}
          {submitting ? <p className="text-sm text-slate-600">{t("payment", "processing", "A processar confirmação…")}</p> : null}
        </div>

        <OrderSummary
          deliveryFee={payload.orderPreview.deliveryFee}
          items={payload.orderPreview.items}
          subtotal={payload.orderPreview.subtotal}
          total={payload.orderPreview.total}
        />
      </div>
    </section>
  );
};

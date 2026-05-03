import { useEffect, useRef, useState } from "react";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripeKey =
  import.meta.env.VITE_STRIPE_PUBLIC_KEY ||
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
  "";
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

const elementOptions = {
  style: {
    base: {
      fontSize: "16px",
      color: "#111827",
      "::placeholder": {
        color: "#9ca3af"
      }
    },
    invalid: {
      color: "#dc2626"
    }
  }
};

const Field = ({ label, children, error }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold">{label}</span>
    <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">{children}</div>
    {error ? <span className="mt-1 block text-sm text-red-600">{error}</span> : null}
  </label>
);

const StripePaymentForm = ({ clientSecret, customer, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const resumedRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [cardBrand, setCardBrand] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    number: "",
    expiry: "",
    cvc: ""
  });
  const [apiError, setApiError] = useState("");

  const finalizeSucceededIntent = async () => {
    if (!stripe || !clientSecret || resumedRef.current) {
      return false;
    }

    resumedRef.current = true;
    setRecovering(true);
    setApiError("");

    try {
      const { paymentIntent, error } = await stripe.retrievePaymentIntent(clientSecret);

      if (error) {
        resumedRef.current = false;
        return false;
      }

      if (paymentIntent?.status === "succeeded") {
        await onSuccess(paymentIntent.id);
        return true;
      }

      resumedRef.current = false;
      return false;
    } catch {
      resumedRef.current = false;
      return false;
    } finally {
      setRecovering(false);
    }
  };

  useEffect(() => {
    if (!stripe || !clientSecret) {
      return;
    }

    finalizeSucceededIntent().catch(() => {});
  }, [clientSecret, stripe]);

  const handleElementChange = (field) => (event) => {
    setFieldErrors((current) => ({
      ...current,
      [field]: event.error?.message || ""
    }));

    if (field === "number") {
      setCardBrand(event.brand && event.brand !== "unknown" ? event.brand.toUpperCase() : "");
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setApiError("");

    if (!stripe || !elements) {
      setApiError("O formulário de cartão ainda não está pronto.");
      return;
    }

    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) {
      setApiError("Não foi possível preparar o campo do cartão.");
      return;
    }

    setSubmitting(true);

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardNumber,
        billing_details: {
          name: `${customer.firstName} ${customer.lastName}`.trim(),
          email: customer.email,
          phone: customer.phone,
          address: {
            line1: customer.street,
            postal_code: customer.postalCode
          }
        }
      }
    });

    setSubmitting(false);

    if (error) {
      const resumed = await finalizeSucceededIntent();

      if (!resumed) {
        setApiError(
          error.message === "A processing error occurred."
            ? "O pagamento foi autorizado, mas a página perdeu o estado. Atualize a página e tente novamente."
            : error.message || "Não foi possível validar o pagamento por cartão."
        );
      }
      return;
    }

    if (paymentIntent?.status !== "succeeded") {
      setApiError("O pagamento ainda não foi confirmado pela rede do cartão.");
      return;
    }

    await onSuccess(paymentIntent.id);
  };

  return (
    <form className="surface-card p-6 md:p-8" onSubmit={onSubmit}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Pagamento com cartão</h2>
          <p className="mt-2 text-sm text-slate-600">
            Aceita cartões compatíveis com o Stripe, incluindo Visa e cartões emitidos pelo
            Santander quando suportados pela rede.
          </p>
        </div>
        {cardBrand ? (
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-700">
            {cardBrand}
          </span>
        ) : null}
      </div>

      <div className="mt-6 grid gap-5">
        <Field error={fieldErrors.number} label="Número do cartão">
          <CardNumberElement onChange={handleElementChange("number")} options={elementOptions} />
        </Field>
        <div className="grid gap-5 md:grid-cols-2">
          <Field error={fieldErrors.expiry} label="Validade">
            <CardExpiryElement onChange={handleElementChange("expiry")} options={elementOptions} />
          </Field>
          <Field error={fieldErrors.cvc} label="CVC">
            <CardCvcElement onChange={handleElementChange("cvc")} options={elementOptions} />
          </Field>
        </div>
      </div>

      {apiError ? <p className="mt-4 text-sm text-red-600">{apiError}</p> : null}
      {recovering ? (
        <p className="mt-4 text-sm text-slate-600">A retomar a confirmação do pagamento...</p>
      ) : null}

      <button
        className="button-primary mt-8 w-full"
        disabled={submitting || recovering}
        type="submit"
      >
        {submitting ? "A validar pagamento..." : "Pagar com cartão"}
      </button>
    </form>
  );
};

export const StripePaymentBox = ({ clientSecret, customer, onSuccess }) => {
  if (!stripePromise || !clientSecret) {
    return (
      <div className="surface-card p-6 md:p-8">
        <h2 className="text-2xl font-bold">Pagamento com cartão</h2>
        <p className="mt-3 text-sm text-red-600">
          O Stripe não está configurado. Defina `VITE_STRIPE_PUBLIC_KEY` no frontend e
          `STRIPE_SECRET_KEY` no backend.
        </p>
      </div>
    );
  }

  return (
    <Elements options={{ clientSecret }} stripe={stripePromise}>
      <StripePaymentForm clientSecret={clientSecret} customer={customer} onSuccess={onSuccess} />
    </Elements>
  );
};

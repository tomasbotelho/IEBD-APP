import { useState } from "react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";

const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || "";

export const PayPalPaymentBox = ({ orderId, amount, onApprove }) => {
  const [apiError, setApiError] = useState("");

  if (!paypalClientId || !orderId) {
    return (
      <div className="surface-card p-6 md:p-8">
        <h2 className="text-2xl font-bold">PayPal</h2>
        <p className="mt-3 text-sm text-red-600">
          O PayPal não está configurado. Defina `VITE_PAYPAL_CLIENT_ID` no frontend e as
          credenciais PayPal no backend.
        </p>
      </div>
    );
  }

  return (
    <PayPalScriptProvider
      options={{
        "client-id": paypalClientId,
        currency: "EUR",
        intent: "capture"
      }}
    >
      <div className="surface-card p-6 md:p-8">
        <h2 className="text-2xl font-bold">PayPal</h2>
        <p className="mt-2 text-sm text-slate-600">
          Vai ser redirecionado dentro do fluxo seguro do PayPal para aprovar o pagamento de{" "}
          <strong>{amount}</strong>.
        </p>
        <div className="mt-6">
          <PayPalButtons
            createOrder={() => orderId}
            forceReRender={[orderId]}
            onApprove={async (data) => {
              setApiError("");
              await onApprove(data.orderID);
            }}
            onError={() => {
              setApiError("Não foi possível concluir o pagamento no PayPal.");
            }}
          />
        </div>
        {apiError ? <p className="mt-4 text-sm text-red-600">{apiError}</p> : null}
      </div>
    </PayPalScriptProvider>
  );
};

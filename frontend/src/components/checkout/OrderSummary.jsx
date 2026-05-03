import { formatPrice } from "../../utils/format.js";

export const OrderSummary = ({ items, subtotal, deliveryFee, total }) => {
  const resolvedDelivery =
    typeof deliveryFee === "number" ? deliveryFee : subtotal >= 60 ? 0 : 4.9;
  const resolvedTotal =
    typeof total === "number" ? total : Number((subtotal + resolvedDelivery).toFixed(2));

  return (
    <aside className="surface-card h-fit p-6">
      <h2 className="text-xl font-bold">Resumo da encomenda</h2>
      <div className="mt-5 space-y-4">
        {items.map((item) => (
          <div key={item.id || item.productId} className="flex items-center justify-between gap-4 text-sm">
            <div>
              <div className="font-semibold">{item.name || item.product?.name}</div>
              <div className="text-slate-500">
                {item.quantity} x {formatPrice(item.price || item.unitPrice)}
              </div>
            </div>
            <div className="font-semibold">
              {formatPrice(
                Number(item.lineTotal || item.total || Number(item.quantity) * Number(item.price || item.unitPrice))
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 space-y-3 border-t border-sand-100 pt-4 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Entrega</span>
          <span>{resolvedDelivery === 0 ? "Grátis" : formatPrice(resolvedDelivery)}</span>
        </div>
        <div className="flex justify-between text-base font-bold">
          <span>Total</span>
          <span>{formatPrice(resolvedTotal)}</span>
        </div>
      </div>
    </aside>
  );
};

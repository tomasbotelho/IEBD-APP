export const roundCurrency = (value) => Number(Number(value).toFixed(2));

export const calculateCartTotals = (items) => {
  const subtotal = roundCurrency(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );
  const discountTotal = roundCurrency(
    items.reduce(
      (sum, item) =>
        sum + Math.max(0, item.price - (item.discountPrice || item.price)) * item.quantity,
      0
    )
  );
  const shippingTotal = subtotal - discountTotal >= 35 ? 0 : 4.9;
  const grandTotal = roundCurrency(subtotal - discountTotal + shippingTotal);

  return { subtotal, discountTotal, shippingTotal, grandTotal };
};

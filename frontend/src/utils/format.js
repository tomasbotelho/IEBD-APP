export const formatPrice = (value) =>
  new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR"
  }).format(value);

export const formatDate = (value) =>
  new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "medium"
  }).format(new Date(value));

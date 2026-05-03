import { Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Seo } from "../components/common/Seo.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { useCart } from "../contexts/CartContext.jsx";
import { useTexts } from "../contexts/SiteTextsContext.jsx";
import { buildCanonicalUrl } from "../lib/seo.js";
import { formatPrice } from "../utils/format.js";

export const CartPage = () => {
  const t = useTexts();
  const { items, subtotal, deliveryFee, total, updateQuantity, removeItem } = useCart();
  const [cartMessage, setCartMessage] = useState("");

  const changeQuantity = (productId, quantity) => {
    const result = updateQuantity(productId, quantity);
    setCartMessage(result.ok ? "" : result.message || "");
  };

  if (!items.length) {
    return (
      <section className="container-shell py-10">
        <Seo
          canonical={buildCanonicalUrl("/carrinho")}
          description={t("cart", "seo_description", "Reveja os artigos antes do checkout.")}
          title={t("cart", "seo_title", "Carrinho | Sports Club")}
        />
        <EmptyState
          action={{ href: "/produtos", label: t("cart", "empty_action", "Ir para produtos") }}
          description={t("cart", "empty_desc", "Adicione artigos ao carrinho para avançar para checkout.")}
          title={t("cart", "empty_title", "O seu carrinho está vazio")}
        />
      </section>
    );
  }

  return (
    <section className="container-shell py-10">
      <Seo
        canonical={buildCanonicalUrl("/carrinho")}
        description={t("cart", "seo_description", "Reveja os artigos antes do checkout.")}
        title={t("cart", "seo_title", "Carrinho | Sports Club")}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {items.map((item) => (
            <article key={item.id} className="surface-card flex flex-col gap-4 p-5 sm:flex-row">
              <img
                alt={item.name}
                className="h-28 w-full rounded-2xl object-cover sm:w-28"
                src={item.image}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-lg font-bold">{item.name}</h1>
                    <p className="mt-1 text-sm text-slate-500">{formatPrice(item.price)}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {t("cart", "stock_label", "Stock disponível")}: {item.stock}
                    </p>
                  </div>
                  <button
                    className="rounded-full p-2 text-red-600 hover:bg-red-50"
                    onClick={() => removeItem(item.id)}
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center rounded-2xl border border-zinc-200">
                    <button className="px-4 py-3" onClick={() => changeQuantity(item.id, item.quantity - 1)} type="button">
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      className="w-16 border-x border-zinc-200 py-3 text-center"
                      min="1"
                      max={item.stock}
                      type="number"
                      value={item.quantity}
                      onChange={(e) => changeQuantity(item.id, e.target.value)}
                    />
                    <button className="px-4 py-3" onClick={() => changeQuantity(item.id, item.quantity + 1)} type="button">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      {t("cart", "total", "Total")}
                    </div>
                    <div className="text-lg font-bold">
                      {formatPrice(Number(item.quantity) * Number(item.price))}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
        <aside className="surface-card h-fit p-6">
          <h2 className="text-xl font-bold">{t("cart", "summary_heading", "Resumo")}</h2>
          {cartMessage ? <p className="mt-4 text-sm text-red-600">{cartMessage}</p> : null}
          <div className="mt-6 flex items-center justify-between text-sm">
            <span>{t("cart", "subtotal", "Subtotal")}</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span>{t("cart", "delivery", "Entrega")}</span>
            <span>{deliveryFee === 0 ? t("cart", "delivery_free", "Grátis") : formatPrice(deliveryFee)}</span>
          </div>
          <div className="mt-4 flex items-center justify-between text-lg font-bold">
            <span>{t("cart", "total", "Total")}</span>
            <span>{formatPrice(total)}</span>
          </div>
          <Link className="button-primary mt-6 w-full" to="/checkout">
            {t("cart", "checkout_action", "Avançar para compra")}
          </Link>
        </aside>
      </div>
    </section>
  );
};

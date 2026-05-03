import { ShoppingCart, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../../contexts/CartContext.jsx";
import { useTexts } from "../../contexts/SiteTextsContext.jsx";
import { formatPrice } from "../../utils/format.js";

export const ProductCard = ({ product }) => {
  const { addItem } = useCart();
  const t = useTexts();
  const hasDiscount = product.originalPrice > product.price;
  const inStock = Number(product.stock || 0) > 0;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white transition hover:-translate-y-1 hover:shadow-card">
      <div className="relative overflow-hidden bg-zinc-100">
        {hasDiscount ? (
          <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full bg-black px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
            <span>-{product.discountPercent}%</span>
            <span className="text-white/50">|</span>
            <span>{t("product", "label_poupa", "Poupa")} {formatPrice(product.savingsAmount)}</span>
          </div>
        ) : null}
        <Link className="block overflow-hidden" to={`/produto/${product.slug}`}>
          <img
            alt={product.name}
            className="h-72 w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
            src={product.image}
          />
        </Link>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          <span>{product.brand}</span>
          {product.rating ? (
            <span className="flex items-center gap-1 text-zinc-700">
              <Star className="h-3.5 w-3.5 fill-current text-black" />
              {product.rating}
            </span>
          ) : null}
        </div>
        <div className="mt-4">
          <Link
            className="line-clamp-2 text-xl font-semibold leading-tight text-ink-900"
            to={`/produto/${product.slug}`}
          >
            {product.name}
          </Link>
          <p className="mt-2 line-clamp-2 text-sm text-zinc-600">{product.description}</p>
        </div>
        <div className="mt-auto pt-6">
          <div className="rounded-[1.4rem] bg-zinc-50 p-4">
            <div className="flex flex-col gap-4">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  {hasDiscount ? t("product", "label_discount_price", "Preço com desconto") : t("product", "label_current_price", "Preço atual")}
                </div>
                <div className="mt-2 flex flex-wrap items-end gap-2">
                  <span className="text-4xl font-bold text-black">{formatPrice(product.price)}</span>
                  {hasDiscount ? (
                    <span className="text-sm text-zinc-400 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  ) : null}
                </div>
                {hasDiscount ? (
                  <div className="mt-2 text-sm font-semibold text-zinc-700">
                    {t("product", "label_discount_value", "Valor do desconto:")} {formatPrice(product.savingsAmount)}
                  </div>
                ) : null}
              </div>
              <button
                className="button-primary w-full gap-2 px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!inStock}
                onClick={() => addItem(product, 1)}
                type="button"
              >
                <ShoppingCart className="h-4 w-4" />
                {inStock ? t("product", "btn_add", "Adicionar") : t("product", "btn_no_stock", "Sem stock")}
              </button>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
            <span>{product.unit}</span>
            <span>{product.stock > 0 ? `${product.stock} ${t("product", "label_units", "unidades")}` : t("product", "label_no_stock", "Sem stock")}</span>
          </div>
        </div>
      </div>
    </article>
  );
};

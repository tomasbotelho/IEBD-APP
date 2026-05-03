import { Link } from "react-router-dom";
import { formatPrice } from "../../utils/format.js";

export const PromoBanner = ({ products = [] }) => {
  const highlightedProducts = products.filter((product) => product.discountPercent > 0).slice(0, 3);

  if (!highlightedProducts.length) {
    return null;
  }

  return (
    <section className="container-shell py-6">
      <div className="grid gap-4 lg:grid-cols-3">
        {highlightedProducts.map((product) => (
          <Link
            key={product.id}
            className="group relative min-h-[320px] overflow-hidden rounded-[1.75rem] bg-black text-white"
            to={`/produto/${product.slug}`}
          >
            <img
              alt={product.name}
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
              src={product.image}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
            <div className="relative flex h-full flex-col justify-between p-6">
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-black">
                  -{product.discountPercent}%
                </span>
                <span className="rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                  Poupa {formatPrice(product.savingsAmount)}
                </span>
              </div>

              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
                  {product.brand}
                </div>
                <h3 className="mt-3 font-display text-4xl uppercase leading-none text-white">
                  {product.name}
                </h3>
                <p className="mt-3 max-w-sm text-sm text-white/75">{product.description}</p>
                <div className="mt-5 flex items-end gap-2">
                  <span className="text-4xl font-bold text-white">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-base text-white/60 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

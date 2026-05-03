import { ArrowRight, ShieldCheck, TimerReset, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { formatPrice } from "../../utils/format.js";
import { SearchBar } from "../search/SearchBar.jsx";
import { HeroCarousel } from "./HeroCarousel.jsx";

const SERVICE_ICONS = [Truck, TimerReset, ShieldCheck];

export const HeroSection = ({
  hero,
  campaigns = [],
  categories = [],
  featuredProducts = [],
  carouselHighlights = [],
  siteTexts = {}
}) => {
  const spotlightCampaign = campaigns[0];
  const visualProducts = featuredProducts.slice(0, 3);
  const hasCarousel = carouselHighlights.length > 0;

  const t = (section, key, fallback = "") => siteTexts?.[section]?.[key] || fallback;

  const serviceCards = [
    {
      icon: SERVICE_ICONS[0],
      eyebrow: t("services", "delivery_eyebrow", "Entrega"),
      title: t("services", "delivery_title", "24/48h em Portugal"),
      description: t("services", "delivery_desc", "Fluxo rápido de compra para artigos com alta rotação.")
    },
    {
      icon: SERVICE_ICONS[1],
      eyebrow: t("services", "pickup_eyebrow", "Levantamento"),
      title: t("services", "pickup_title", "Click & collect"),
      description: t("services", "pickup_desc", "Espaço preparado para recolha rápida e expedição local.")
    },
    {
      icon: SERVICE_ICONS[2],
      eyebrow: t("services", "trust_eyebrow", "Confiança"),
      title: t("services", "trust_title", "Checkout seguro"),
      description: t("services", "trust_desc", "Carrinho e pagamento com leitura comercial clara.")
    }
  ];

  return (
    <section className="border-b border-zinc-200 bg-white">
      <div className="container-shell py-6 md:py-8">
        {/* Admin-configured carousel — shown when highlights are set */}
        {hasCarousel && (
          <div className="mb-4">
            <HeroCarousel highlights={carouselHighlights} />
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_420px]">
          <div className="relative overflow-hidden rounded-[2rem] bg-black p-6 text-white md:p-8">
            <div className="absolute inset-0 bg-hero-grid opacity-90" />
            <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
              <div>
                <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/75">
                  {hero.eyebrow}
                </div>
                <h1 className="mt-6 max-w-4xl text-5xl font-display uppercase leading-[0.9] tracking-tight text-white md:text-7xl">
                  {hero.title}
                </h1>
                <p className="mt-5 max-w-2xl text-sm text-zinc-300 md:text-base">
                  {hero.description}
                </p>
                <div className="mt-6 max-w-3xl">
                  <SearchBar large />
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {categories.slice(0, 5).map((category) => (
                    <Link
                      key={category.slug}
                      className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white hover:text-black"
                      to={`/categoria/${category.slug}`}
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link className="button-secondary" to={hero.primaryAction.href}>
                    {hero.primaryAction.label}
                  </Link>
                  <Link
                    className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-white"
                    to={hero.secondaryAction.href}
                  >
                    {hero.secondaryAction.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {visualProducts.length ? (
                <div className="grid min-h-[420px] gap-3 sm:grid-cols-2 lg:grid-cols-[1.15fr_0.85fr]">
                  <Link
                    className="group relative row-span-2 overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/10"
                    to={`/produto/${visualProducts[0].slug}`}
                  >
                    <img
                      alt={visualProducts[0].name}
                      className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      src={visualProducts[0].image}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                    <div className="relative flex h-full flex-col justify-end p-5">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
                        {t("hero", "label_featured", "Destaque")}
                      </div>
                      <h2 className="mt-2 font-display text-4xl uppercase leading-none text-white">
                        {visualProducts[0].name}
                      </h2>
                      <div className="mt-4 flex items-end gap-2">
                        <span className="text-4xl font-bold text-white">
                          {formatPrice(visualProducts[0].price)}
                        </span>
                        {visualProducts[0].originalPrice > visualProducts[0].price ? (
                          <span className="text-sm text-white/60 line-through">
                            {formatPrice(visualProducts[0].originalPrice)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Link>

                  {visualProducts.slice(1).map((product) => (
                    <Link
                      key={product.id}
                      className="group relative overflow-hidden rounded-[1.4rem] border border-white/10 bg-white/10"
                      to={`/produto/${product.slug}`}
                    >
                      <img
                        alt={product.name}
                        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        src={product.image}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
                      <div className="relative flex h-full min-h-[200px] flex-col justify-end p-4">
                        <div className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-black">
                          -{product.discountPercent || 0}%
                        </div>
                        <div className="mt-3 text-lg font-semibold text-white">{product.name}</div>
                        <div className="mt-2 text-2xl font-bold text-white">
                          {formatPrice(product.price)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4">
            <article className="surface-card overflow-hidden">
              <div className="grid gap-0">
                <div className="relative min-h-[260px] overflow-hidden bg-black">
                  <img
                    alt={spotlightCampaign?.title || "Campanha em foco"}
                    className="absolute inset-0 h-full w-full object-cover opacity-90"
                    src={visualProducts[0]?.image}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
                  <div className="relative flex h-full flex-col justify-between p-6 text-white">
                    <div className="flex items-start justify-between gap-3">
                      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-black">
                        {spotlightCampaign?.badge || "Oferta"}
                      </span>
                      {visualProducts[0]?.savingsAmount ? (
                        <span className="rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                          Poupa {formatPrice(visualProducts[0].savingsAmount)}
                        </span>
                      ) : null}
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/65">
                        {t("hero", "label_spotlight", "Campanha em foco")}
                      </div>
                      <h2 className="mt-2 font-display text-4xl uppercase leading-none text-white">
                        {spotlightCampaign?.title || "Nova seleção Sports Club"}
                      </h2>
                      <p className="mt-3 text-sm text-white/75">
                        {spotlightCampaign?.description ||
                          "Mais imagem, mais preço em destaque e mais leitura de desconto."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="space-y-3">
                    {campaigns.slice(0, 2).map((campaign) => (
                      <Link
                        key={campaign.slug}
                        className="flex items-center justify-between rounded-[1.25rem] border border-zinc-200 px-4 py-4 transition hover:border-black hover:bg-black hover:text-white"
                        to="/promocoes"
                      >
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                            {campaign.badge}
                          </div>
                          <div className="mt-1 text-base font-semibold text-current">
                            {campaign.title}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </article>

            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
              {serviceCards.map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.title}
                    className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5"
                  >
                    <Icon className="h-5 w-5 text-black" />
                    <div className="mt-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                      {item.eyebrow}
                    </div>
                    <h3 className="mt-2 font-display text-2xl uppercase leading-none text-ink-900">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm text-zinc-600">{item.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

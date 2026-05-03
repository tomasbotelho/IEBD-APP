import { ProductGrid } from "../components/catalog/ProductGrid.jsx";
import { Seo } from "../components/common/Seo.jsx";
import { Breadcrumbs } from "../components/ui/Breadcrumbs.jsx";
import { SectionHeading } from "../components/ui/SectionHeading.jsx";
import { useTexts } from "../contexts/SiteTextsContext.jsx";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { buildCanonicalUrl } from "../lib/seo.js";
import { catalogService } from "../services/catalogService.js";
import { formatPrice } from "../utils/format.js";

export const PromotionsPage = () => {
  const t = useTexts();
  const { data, loading } = useAsyncData(() => catalogService.getCampaigns(), []);

  return (
    <section className="container-shell py-10">
      <Seo
        canonical={buildCanonicalUrl("/promocoes")}
        description={t("promotions", "seo_description", "Campanhas e oportunidades comerciais da Sports Club.")}
        title={t("promotions", "seo_title", "Promoções | Sports Club")}
      />
      <Breadcrumbs
        items={[
          { label: t("nav", "home", "Início"), href: "/" },
          { label: t("nav", "promotions", "Promoções") }
        ]}
      />
      <div className="mt-6 space-y-8">
        {data?.map((campaign) => {
          const featuredProduct = campaign.products?.[0];

          return (
            <section key={campaign.slug} className="space-y-6">
              <article className="relative overflow-hidden rounded-[2rem] bg-black text-white">
                {featuredProduct ? (
                  <img
                    alt={campaign.title}
                    className="absolute inset-0 h-full w-full object-cover opacity-90"
                    src={featuredProduct.image}
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/55 to-black/25" />
                <div className="relative grid gap-6 p-6 md:p-8 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div>
                    <div className="inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-black">
                      {campaign.badge}
                    </div>
                    <h2 className="mt-4 font-display text-5xl uppercase leading-none text-white">
                      {campaign.title}
                    </h2>
                    <p className="mt-4 max-w-2xl text-sm text-white/80">{campaign.description}</p>
                  </div>
                  {featuredProduct ? (
                    <div className="self-end rounded-[1.5rem] border border-white/15 bg-black/45 p-5">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
                        {t("promotions", "price_featured", "Preço em destaque")}
                      </div>
                      <div className="mt-3 text-lg font-semibold text-white">{featuredProduct.name}</div>
                      <div className="mt-3 flex items-end gap-2">
                        <span className="text-4xl font-bold text-white">
                          {formatPrice(featuredProduct.price)}
                        </span>
                        <span className="text-base text-white/55 line-through">
                          {formatPrice(featuredProduct.originalPrice)}
                        </span>
                      </div>
                      <div className="mt-2 text-sm font-semibold text-white/75">
                        {t("promotions", "savings_label", "Poupa")} {formatPrice(featuredProduct.savingsAmount)}
                      </div>
                    </div>
                  ) : null}
                </div>
              </article>

              <SectionHeading
                eyebrow={campaign.badge}
                description={campaign.description}
                title={campaign.title}
              />
              <ProductGrid loading={loading} products={campaign.products} />
            </section>
          );
        })}
      </div>
    </section>
  );
};

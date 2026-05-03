import { Link } from "react-router-dom";
import { Seo } from "../components/common/Seo.jsx";
import { ProductGrid } from "../components/catalog/ProductGrid.jsx";
import { CategoryStrip } from "../components/home/CategoryStrip.jsx";
import { HeroSection } from "../components/home/HeroSection.jsx";
import { PromoBanner } from "../components/home/PromoBanner.jsx";
import { ErrorState } from "../components/ui/ErrorState.jsx";
import { SectionHeading } from "../components/ui/SectionHeading.jsx";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { buildCanonicalUrl } from "../lib/seo.js";
import { catalogService } from "../services/catalogService.js";

export const HomePage = () => {
  const { data, loading, error } = useAsyncData(() => catalogService.getHome(), []);

  if (error) {
    return (
      <div className="container-shell py-12">
        <ErrorState />
      </div>
    );
  }

  const st = data?.siteTexts ?? {};
  const t = (section, key, fallback = "") => st?.[section]?.[key] || fallback;

  return (
    <>
      <Seo
        canonical={buildCanonicalUrl("/")}
        description={t("seo", "home_description", "Sports Club: storefront de desporto com pesquisa central, categorias fortes e layout inspirado nos grandes retalhistas desportivos.")}
        title={t("seo", "home_title", "Sports Club | Loja de desporto online")}
      />
      {data ? (
        <HeroSection
          campaigns={data.campaigns}
          categories={data.categories}
          featuredProducts={data.collections?.highlights || []}
          carouselHighlights={data.carouselHighlights || []}
          hero={data.hero}
          siteTexts={st}
        />
      ) : null}
      <PromoBanner products={data?.collections?.campaignPicks || []} />
      <CategoryStrip categories={data?.categories || []} />
      <section className="container-shell py-8 md:py-10">
        <SectionHeading
          action={
            <Link className="button-secondary" to="/produtos">
              {t("homepage", "highlights_action", "Ver catálogo")}
            </Link>
          }
          eyebrow={t("homepage", "highlights_eyebrow", "Destaques")}
          description={t("homepage", "highlights_desc", "Seleção comercial para abrir a homepage com produtos de entrada rápida e forte intenção de compra.")}
          title={t("homepage", "highlights_title", "Produtos em destaque")}
        />
        <div className="mt-8">
          <ProductGrid loading={loading} products={data?.collections?.highlights || []} />
        </div>
      </section>
      <section className="bg-zinc-50">
        <div className="container-shell py-8 md:py-10">
          <SectionHeading
            eyebrow={t("homepage", "campaigns_eyebrow", "Promoções")}
            description={t("homepage", "campaigns_desc", "Artigos com melhor tração promocional, ideais para campanhas de performance e sessões sazonais.")}
            title={t("homepage", "campaigns_title", "Escolhas da campanha")}
          />
          <div className="mt-8">
            <ProductGrid loading={loading} products={data?.collections?.campaignPicks || []} />
          </div>
        </div>
      </section>
    </>
  );
};

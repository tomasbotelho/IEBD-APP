import { Link } from "react-router-dom";
import { Seo } from "../../components/common/Seo.jsx";
import { SearchBar } from "../../components/search/SearchBar.jsx";
import { useTexts } from "../../contexts/SiteTextsContext.jsx";
import { buildCanonicalUrl } from "../../lib/seo.js";

export const NotFoundPage = () => {
  const t = useTexts();

  return (
    <section className="container-shell py-12 md:py-20">
      <Seo
        canonical={buildCanonicalUrl("/404")}
        description={t("errors", "seo_404_description", "Página não encontrada com atalhos úteis para continuar a navegação.")}
        title={t("errors", "seo_404_title", "404 | Sports Club")}
      />
      <div className="rounded-[2rem] bg-hero-grid p-8 text-center shadow-card md:p-14">
        <div className="text-sm font-semibold uppercase tracking-[0.3em] text-pine-600">
          {t("errors", "not_found_label", "404")}
        </div>
        <h1 className="mt-4 text-4xl font-extrabold md:text-6xl">
          {t("errors", "not_found_title", "Página não encontrada")}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-700 md:text-base">
          {t("errors", "not_found_desc", "A página que procura não existe ou foi movida.")}
        </p>
        <div className="mx-auto mt-8 max-w-2xl">
          <SearchBar large />
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link className="button-primary" to="/">
            {t("errors", "not_found_btn_home", "Voltar à homepage")}
          </Link>
          <Link className="button-secondary" to="/produtos">
            {t("errors", "not_found_btn_products", "Ir para produtos")}
          </Link>
        </div>
      </div>
    </section>
  );
};

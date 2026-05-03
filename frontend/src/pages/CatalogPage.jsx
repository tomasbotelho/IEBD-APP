import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ProductGrid } from "../components/catalog/ProductGrid.jsx";
import { Seo } from "../components/common/Seo.jsx";
import { Breadcrumbs } from "../components/ui/Breadcrumbs.jsx";
import { ErrorState } from "../components/ui/ErrorState.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { Pagination } from "../components/ui/Pagination.jsx";
import { SectionHeading } from "../components/ui/SectionHeading.jsx";
import { useTexts } from "../contexts/SiteTextsContext.jsx";
import { fallbackFilters } from "../data/fallback.js";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { buildCanonicalUrl } from "../lib/seo.js";
import { catalogService } from "../services/catalogService.js";

export const CatalogPage = () => {
  const t = useTexts();
  const [searchParams, setSearchParams] = useSearchParams();
  const sort = searchParams.get("sort") || "relevance";
  const page = Number(searchParams.get("page") || "1");
  const { data, loading, error } = useAsyncData(() => catalogService.getProducts({ sort }), [sort]);
  const pageSize = 4;
  const totalPages = Math.max(1, Math.ceil((data?.length || 0) / pageSize));
  const currentPage = Number.isFinite(page) && page > 0 ? Math.min(page, totalPages) : 1;
  const paginatedProducts = (data || []).slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    if (page !== currentPage) {
      setSearchParams({ sort, page: String(currentPage) }, { replace: true });
    }
  }, [currentPage, page, setSearchParams, sort]);

  const breadcrumbs = [
    { label: t("nav", "home", "Início"), href: "/" },
    { label: t("nav", "products", "Produtos") }
  ];

  if (error) {
    return (
      <section className="container-shell py-10">
        <Seo
          canonical={buildCanonicalUrl("/produtos")}
          description={t("catalog", "seo_description", "Catálogo de produtos com filtros, ordenação e experiência de compra fluida.")}
          title={t("catalog", "seo_title", "Produtos | Sports Club")}
        />
        <Breadcrumbs items={breadcrumbs} />
        <div className="mt-6">
          <ErrorState />
        </div>
      </section>
    );
  }

  return (
    <section className="container-shell py-10">
      <Seo
        canonical={buildCanonicalUrl("/produtos")}
        description={t("catalog", "seo_description", "Catálogo de produtos com filtros, ordenação e experiência de compra fluida.")}
        title={t("catalog", "seo_title", "Produtos | Sports Club")}
      />
      <Breadcrumbs items={breadcrumbs} />
      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="surface-card h-fit p-6">
          <h2 className="text-xl font-bold">{t("catalog", "filters_heading", "Filtros")}</h2>
          <p className="mt-2 text-sm text-slate-600">
            {t("catalog", "filters_desc", "Estrutura pronta para evoluir com filtros por stock, fornecedor, tipo e tamanho.")}
          </p>
          <div className="mt-6 space-y-3">
            {fallbackFilters.map((filter) => (
              <button
                key={filter.id}
                className={`flex w-full rounded-2xl px-4 py-3 text-left text-sm ${
                  sort === filter.id ? "bg-pine-500 text-white" : "bg-sand-50"
                }`}
                onClick={() => setSearchParams({ sort: filter.id, page: "1" })}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
        </aside>
        <div>
          <SectionHeading
            eyebrow={t("catalog", "eyebrow", "Catálogo")}
            description={t("catalog", "description", "Grelha otimizada para navegação rápida, SEO e conversão.")}
            title={t("catalog", "title", "Todos os produtos")}
          />
          <div className="mt-8">
            {data?.length === 0 && !loading ? (
              <EmptyState
                action={{ href: "/produtos", label: t("catalog", "empty_action", "Limpar filtros") }}
                description={t("catalog", "empty_desc", "Não encontrámos produtos com os filtros atuais.")}
                title={t("catalog", "empty_title", "Sem resultados")}
              />
            ) : (
              <>
                <ProductGrid loading={loading} products={paginatedProducts} />
                <Pagination
                  onPageChange={(nextPage) => setSearchParams({ sort, page: String(nextPage) })}
                  page={currentPage}
                  totalPages={totalPages}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

import { useDeferredValue } from "react";
import { useSearchParams } from "react-router-dom";
import { ProductGrid } from "../components/catalog/ProductGrid.jsx";
import { SearchBar } from "../components/search/SearchBar.jsx";
import { Seo } from "../components/common/Seo.jsx";
import { Breadcrumbs } from "../components/ui/Breadcrumbs.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { Pagination } from "../components/ui/Pagination.jsx";
import { useTexts } from "../contexts/SiteTextsContext.jsx";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { buildCanonicalUrl } from "../lib/seo.js";
import { catalogService } from "../services/catalogService.js";

export const SearchPage = () => {
  const t = useTexts();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const page = Number(searchParams.get("page") || "1");
  const deferredQuery = useDeferredValue(query);
  const { data, loading } = useAsyncData(
    () => catalogService.getProducts({ search: deferredQuery }),
    [deferredQuery]
  );
  const pageSize = 4;
  const totalPages = Math.max(1, Math.ceil((data?.length || 0) / pageSize));
  const paginatedProducts = (data || []).slice((page - 1) * pageSize, page * pageSize);

  return (
    <section className="container-shell py-10">
      <Seo
        canonical={buildCanonicalUrl(`/pesquisa?q=${encodeURIComponent(query)}`)}
        description={`Resultados de pesquisa para ${query}`}
        title={`Pesquisa: ${query || "produtos"} | Sports Club`}
      />
      <Breadcrumbs
        items={[
          { label: t("nav", "home", "Início"), href: "/" },
          { label: t("search", "breadcrumb", "Pesquisa") }
        ]}
      />
      <div className="mt-6 space-y-6">
        <div className="surface-card p-6">
          <h1 className="text-3xl font-bold">{t("search", "heading", "Pesquisar produtos")}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {t("search", "description", "Pesquisa rápida com URL amigável e preparada para indexação.")}
          </p>
          <div className="mt-5">
            <SearchBar defaultValue={query} large />
          </div>
        </div>
        {data?.length === 0 && !loading ? (
          <EmptyState
            action={{ href: "/produtos", label: t("search", "empty_action", "Explorar catálogo") }}
            description={t("search", "empty_desc", "Experimente outro termo ou navegue pelas categorias.")}
            title={t("search", "empty_title", "Sem resultados para \"{query}\"").replace("{query}", query)}
          />
        ) : (
          <>
            <ProductGrid loading={loading} products={paginatedProducts} />
            <Pagination
              onPageChange={(nextPage) => setSearchParams({ q: query, page: String(nextPage) })}
              page={page}
              totalPages={totalPages}
            />
          </>
        )}
      </div>
    </section>
  );
};

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ProductGrid } from "../components/catalog/ProductGrid.jsx";
import { Seo } from "../components/common/Seo.jsx";
import { Breadcrumbs } from "../components/ui/Breadcrumbs.jsx";
import { ErrorState } from "../components/ui/ErrorState.jsx";
import { Pagination } from "../components/ui/Pagination.jsx";
import { SectionHeading } from "../components/ui/SectionHeading.jsx";
import { useTexts } from "../contexts/SiteTextsContext.jsx";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { buildCanonicalUrl } from "../lib/seo.js";
import { catalogService } from "../services/catalogService.js";

export const CategoryPage = () => {
  const t = useTexts();
  const { slug } = useParams();
  const [page, setPage] = useState(1);
  const { data, loading, error } = useAsyncData(() => catalogService.getCategory(slug), [slug]);
  const pageSize = 4;
  const totalPages = Math.max(1, Math.ceil((data?.products?.length || 0) / pageSize));
  const paginatedProducts = (data?.products || []).slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [slug]);

  if (error) {
    return (
      <div className="container-shell py-12">
        <ErrorState title={t("category", "not_found", "Categoria não encontrada")} />
      </div>
    );
  }

  return (
    <section className="container-shell py-10">
      <Seo
        canonical={buildCanonicalUrl(`/categoria/${slug}`)}
        description={data?.category.description || t("category", "seo_description", "Categoria de produtos Sports Club.")}
        title={`${data?.category.name || t("nav", "category", "Categoria")} | Sports Club`}
      />
      <Breadcrumbs
        items={[
          { label: t("nav", "home", "Início"), href: "/" },
          { label: t("nav", "products", "Produtos"), href: "/produtos" },
          { label: data?.category.name || t("nav", "category", "Categoria") }
        ]}
      />
      <div className="mt-6 rounded-[2rem] bg-white p-8 shadow-card">
        <SectionHeading
          eyebrow={t("category", "eyebrow", "Categoria")}
          description={data?.category.description}
          title={data?.category.name || t("nav", "category", "Categoria")}
        />
        <div className="mt-8">
          <ProductGrid loading={loading} products={paginatedProducts} />
          <Pagination onPageChange={setPage} page={page} totalPages={totalPages} />
        </div>
      </div>
    </section>
  );
};

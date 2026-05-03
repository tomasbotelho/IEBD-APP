import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTexts } from "../../contexts/SiteTextsContext.jsx";

export const CategoryStrip = ({ categories = [] }) => {
  const t = useTexts();

  return (
    <section className="container-shell py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
            {t("category_strip", "eyebrow", "Categorias principais")}
          </div>
          <h2 className="mt-3 font-display text-4xl uppercase leading-none text-ink-900 md:text-5xl">
            {t("category_strip", "heading", "Explore por modalidade")}
          </h2>
        </div>
        <Link className="button-secondary w-fit" to="/produtos">
          {t("category_strip", "btn_catalog", "Ver catálogo completo")}
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {categories.map((category, index) => (
          <Link
            key={category.slug}
            className="group overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-card"
            to={`/categoria/${category.slug}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
                0{index + 1}
              </span>
            </div>
            <h3 className="mt-10 font-display text-4xl uppercase leading-none text-ink-900">
              {category.name}
            </h3>
            <p className="mt-3 text-sm text-zinc-600">{category.description}</p>
            <div className="mt-8 flex items-center justify-between text-sm font-semibold uppercase tracking-[0.14em] text-ink-900">
              <span>{t("category_strip", "btn_explore", "Explorar categoria")}</span>
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

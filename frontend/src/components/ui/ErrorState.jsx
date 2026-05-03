import { useTexts } from "../../contexts/SiteTextsContext.jsx";

export const ErrorState = ({ title, description }) => {
  const t = useTexts();
  const displayTitle = title || t("errors", "generic_title", "Ocorreu um erro");
  const displayDesc = description || t("errors", "generic_desc", "Não foi possível carregar esta área. Tente novamente dentro de instantes.");

  return (
    <div className="surface-card border-coral-500/20 px-6 py-10 text-center">
      <h2 className="text-2xl font-bold text-ink-900">{displayTitle}</h2>
      <p className="mt-3 text-sm text-slate-600">{displayDesc}</p>
    </div>
  );
};

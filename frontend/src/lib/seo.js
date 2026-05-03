export const buildCanonicalUrl = (path) => {
  const siteUrl = import.meta.env.VITE_SITE_URL || "http://localhost:5173";
  return `${siteUrl}${path}`;
};

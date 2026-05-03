import { Helmet } from "react-helmet-async";

export const Seo = ({ title, description, canonical, image }) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
    {canonical ? <link rel="canonical" href={canonical} /> : null}
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    {image ? <meta property="og:image" content={image} /> : null}
  </Helmet>
);

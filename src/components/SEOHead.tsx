import { Helmet } from "react-helmet-async";
import { SITE_URL, SITE_NAME, isPreviewEnvironment } from "@/lib/seo";

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface SEOHeadProps {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article" | "book";
  image?: string;
  noindex?: boolean;
  structuredData?: object | object[];
  breadcrumbs?: BreadcrumbItem[];
}

export default function SEOHead({
  title,
  description,
  path,
  type = "website",
  image,
  noindex = false,
  structuredData,
  breadcrumbs,
}: SEOHeadProps) {
  const canonical = `${SITE_URL}${path}`;
  const isPreview = isPreviewEnvironment();
  const shouldNoindex = noindex || isPreview;

  const breadcrumbLD = breadcrumbs && breadcrumbs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.name,
      item: `${SITE_URL}${b.url}`,
    })),
  } : null;

  const allStructuredData = [
    breadcrumbLD,
    ...(Array.isArray(structuredData) ? structuredData : structuredData ? [structuredData] : []),
  ].filter(Boolean);

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      {shouldNoindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content={SITE_NAME} />
      {image && <meta property="og:image" content={image} />}

      {/* Twitter */}
      <meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}

      {/* Structured Data */}
      {allStructuredData.map((sd, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(sd)}
        </script>
      ))}
    </Helmet>
  );
}

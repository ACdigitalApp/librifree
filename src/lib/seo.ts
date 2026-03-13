/**
 * SEO configuration for Librifree
 * All canonical/structured-data URLs must use the production domain.
 */

export const SITE_URL = "https://librifree.it";
export const SITE_NAME = "Librifree";
export const SITE_DESCRIPTION = "Leggi gratuitamente migliaia di libri classici online. Letteratura italiana, inglese, francese, russa e americana.";

/** Returns true if the current host is NOT the production domain */
export function isPreviewEnvironment(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hostname !== "librifree.it" && window.location.hostname !== "www.librifree.it";
}

/** Build a canonical URL for a given path */
export function canonicalUrl(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${clean}`;
}

/** Build Open Graph meta for a page */
export function ogMeta({
  title,
  description,
  url,
  image,
  type = "website",
}: {
  title: string;
  description: string;
  url: string;
  image?: string;
  type?: string;
}) {
  return { title, description, url, image, type };
}

/** Slugify author name for URLs */
export function slugifyAuthor(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

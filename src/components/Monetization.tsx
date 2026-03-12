import { ExternalLink, ShoppingCart } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface AffiliateBookLinkProps {
  title: string;
  author: string;
}

/** Amazon affiliate link for buying the physical book */
export function AffiliateBookLink({ title, author }: AffiliateBookLinkProps) {
  const { t } = useLanguage();
  const searchQuery = encodeURIComponent(`${title} ${author}`);
  // Replace YOUR_AFFILIATE_TAG with your actual Amazon affiliate tag
  const amazonUrl = `https://www.amazon.it/s?k=${searchQuery}&tag=librifree-21`;

  return (
    <div className="rounded-xl border border-border bg-secondary/50 p-5 text-center">
      <ShoppingCart className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground mb-1">{t("buyPhysicalBook")}</p>
      <p className="text-xs text-muted-foreground mb-3">
        {t("buyPhysicalBookDesc")}
      </p>
      <a
        href={amazonUrl}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-5 py-2 text-xs font-medium transition-opacity hover:opacity-80"
      >
        <ExternalLink className="w-3 h-3" />
        {t("buyOnAmazon")}
      </a>
    </div>
  );
}

/** Placeholder ad banner — replace inner content with actual ad code (e.g. Google Ads) */
export function AdBanner({ slot = "default" }: { slot?: string }) {
  return (
    <div
      className="rounded-xl border border-dashed border-border bg-muted/30 flex items-center justify-center py-6 px-4"
      data-ad-slot={slot}
    >
      <p className="text-xs text-muted-foreground">
        {/* Replace this with your Google AdSense or ad network code */}
        Ad Space · {slot}
      </p>
    </div>
  );
}

interface RecommendedBooksProps {
  books: { slug: string; title: string; author: string; cover_url: string | null }[];
}

/** Recommended books section */
export function RecommendedBooks({ books }: RecommendedBooksProps) {
  const { t } = useLanguage();

  if (books.length === 0) return null;

  return (
    <div className="rounded-xl border border-border p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">{t("recommendedBooks")}</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {books.map((book) => (
          <a key={book.slug} href={`/libri/${book.slug}`} className="group">
            <div className="overflow-hidden rounded-lg bg-secondary aspect-[2/3]">
              {book.cover_url ? (
                <img
                  src={book.cover_url}
                  alt={book.title}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-2">
                  <span className="text-muted-foreground text-[10px] text-center">{book.title}</span>
                </div>
              )}
            </div>
            <p className="mt-1.5 text-xs font-medium text-foreground truncate">{book.title}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

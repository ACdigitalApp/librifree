import { useState } from "react";
import BookCoverPlaceholder from "./BookCoverPlaceholder";

interface Props {
  title: string;
  author: string;
  coverUrl: string | null;
  className?: string;
}

/** Returns true when the URL is known to be unreliable / placeholder */
function isPlaceholderCover(url: string | null): boolean {
  if (!url || url === "no-cover") return true;
  return false;
}

/**
 * Renders a book cover image with automatic fallback to BookCoverPlaceholder
 * when the URL is missing, known-bad, or fails to load at runtime.
 */
const BookCover = ({ title, author, coverUrl, className = "" }: Props) => {
  const [imgError, setImgError] = useState(false);

  if (isPlaceholderCover(coverUrl) || imgError) {
    return <BookCoverPlaceholder title={title} author={author} className={className} />;
  }

  return (
    <img
      src={coverUrl!}
      alt={`Copertina di ${title}`}
      className={`w-full h-full object-cover ${className}`}
      loading="lazy"
      onError={() => setImgError(true)}
    />
  );
};

export default BookCover;

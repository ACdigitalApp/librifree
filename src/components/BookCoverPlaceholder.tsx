interface Props {
  title: string;
  author: string;
  className?: string;
}

/** Elegant neutral placeholder for books without a proper cover */
const BookCoverPlaceholder = ({ title, author, className = "" }: Props) => (
  <div
    className={`w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[hsl(30,20%,90%)] to-[hsl(30,15%,80%)] dark:from-[hsl(30,10%,20%)] dark:to-[hsl(30,8%,15%)] ${className}`}
  >
    <span className="text-[11px] font-semibold text-center leading-tight text-[hsl(30,10%,30%)] dark:text-[hsl(30,10%,70%)] line-clamp-3">
      {title}
    </span>
    <span className="mt-1.5 text-[9px] text-center text-[hsl(30,8%,45%)] dark:text-[hsl(30,8%,55%)] line-clamp-1">
      {author}
    </span>
  </div>
);

export default BookCoverPlaceholder;

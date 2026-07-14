import Link from 'next/link';

type PaginationProps = {
  page: number;
  totalPages: number;
  basePath: string;
  query?: Record<string, string>;
};

export function Pagination({
  page,
  totalPages,
  basePath,
  query = {},
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const buildUrl = (p: number) => {
    const params = new URLSearchParams({ ...query, page: String(p) });
    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ''}`;
  };

  return (
    <nav
      className="flex items-center justify-center gap-4 pt-8"
      aria-label="Pagination"
    >
      {page > 1 ? (
        <Link
          href={buildUrl(page - 1)}
          className="rounded-lg border border-stone-300 px-4 py-2 text-sm hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
        >
          Previous
        </Link>
      ) : (
        <span className="rounded-lg border border-stone-200 px-4 py-2 text-sm text-stone-400 dark:border-stone-800">
          Previous
        </span>
      )}
      <span className="text-sm text-stone-600 dark:text-stone-400">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link
          href={buildUrl(page + 1)}
          className="rounded-lg border border-stone-300 px-4 py-2 text-sm hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
        >
          Next
        </Link>
      ) : (
        <span className="rounded-lg border border-stone-200 px-4 py-2 text-sm text-stone-400 dark:border-stone-800">
          Next
        </span>
      )}
    </nav>
  );
}

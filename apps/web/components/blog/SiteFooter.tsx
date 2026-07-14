import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-stone-200 dark:border-stone-800">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-10 text-sm text-stone-600 sm:flex-row sm:items-center sm:justify-between dark:text-stone-400">
        <p>&copy; {new Date().getFullYear()} Monalo Journal. All rights reserved.</p>
        <div className="flex gap-4">
          <Link href="/blog" className="hover:text-stone-900 dark:hover:text-stone-100">
            Blog
          </Link>
          <Link
            href="/search"
            className="hover:text-stone-900 dark:hover:text-stone-100"
          >
            Search
          </Link>
        </div>
      </div>
    </footer>
  );
}

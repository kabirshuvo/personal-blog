import type { Metadata } from 'next';
import { PostCard } from '@/components/blog/PostCard';
import { Pagination } from '@/components/blog/Pagination';
import { searchPosts } from '@/lib/server-api';

export const metadata: Metadata = {
  title: 'Search',
};

type PageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function SearchPage({ searchParams }: PageProps) {
  const { q = '', page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const query = q.trim();

  const results = query ? await searchPosts(query, page) : null;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-4xl font-semibold tracking-tight">Search</h1>

      <form className="mt-6" action="/search" method="get">
        <div className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search posts…"
            className="flex h-10 flex-1 rounded-lg border border-stone-300 bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 dark:border-stone-700"
          />
          <button
            type="submit"
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900"
          >
            Search
          </button>
        </div>
      </form>

      {query && (
        <p className="mt-6 text-stone-600 dark:text-stone-400">
          {results
            ? `${results.meta.total} result${results.meta.total === 1 ? '' : 's'} for "${query}"`
            : `Searching for "${query}"…`}
        </p>
      )}

      {results && results.data.length > 0 ? (
        <>
          <div className="mt-8 grid gap-6">
            {results.data.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          <Pagination
            page={results.meta.page}
            totalPages={results.meta.totalPages}
            basePath="/search"
            query={{ q: query }}
          />
        </>
      ) : query ? (
        <p className="mt-10 text-stone-500">No results found.</p>
      ) : (
        <p className="mt-10 text-stone-500">Enter a search term to find posts.</p>
      )}
    </main>
  );
}

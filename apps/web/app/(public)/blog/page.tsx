import type { Metadata } from 'next';
import { PostCard } from '@/components/blog/PostCard';
import { Pagination } from '@/components/blog/Pagination';
import { getPosts } from '@/lib/server-api';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'All posts from Monalo Journal',
};

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function BlogPage({ searchParams }: PageProps) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const result = await getPosts({ page, limit: 10 });

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-4xl font-semibold tracking-tight">Blog</h1>
      <p className="mt-3 text-stone-600 dark:text-stone-400">
        Essays, notes, and updates from the journal.
      </p>

      {result && result.data.length > 0 ? (
        <>
          <div className="mt-10 grid gap-6">
            {result.data.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          <Pagination
            page={result.meta.page}
            totalPages={result.meta.totalPages}
            basePath="/blog"
          />
        </>
      ) : (
        <p className="mt-10 text-stone-500">No posts yet. Check back soon.</p>
      )}
    </main>
  );
}

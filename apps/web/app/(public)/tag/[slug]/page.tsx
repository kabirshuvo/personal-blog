import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PostCard } from '@/components/blog/PostCard';
import { Pagination } from '@/components/blog/Pagination';
import { getPosts, getTag } from '@/lib/server-api';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTag(slug);
  return { title: tag ? `#${tag.name}` : 'Tag' };
}

export default async function TagPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [tag, posts] = await Promise.all([
    getTag(slug),
    getPosts({ tag: slug, page, limit: 10 }),
  ]);

  if (!tag) notFound();

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-4xl font-semibold tracking-tight">#{tag.name}</h1>
      <p className="mt-3 text-stone-600 dark:text-stone-400">
        Posts tagged with {tag.name}
      </p>

      {posts && posts.data.length > 0 ? (
        <>
          <div className="mt-10 grid gap-6">
            {posts.data.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          <Pagination
            page={posts.meta.page}
            totalPages={posts.meta.totalPages}
            basePath={`/tag/${slug}`}
          />
        </>
      ) : (
        <p className="mt-10 text-stone-500">No posts with this tag yet.</p>
      )}
    </main>
  );
}

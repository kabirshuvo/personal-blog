import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PostCard } from '@/components/blog/PostCard';
import { Pagination } from '@/components/blog/Pagination';
import { getAuthor, getPosts } from '@/lib/server-api';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthor(slug);
  return { title: author?.name ?? 'Author' };
}

export default async function AuthorPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [author, posts] = await Promise.all([
    getAuthor(slug),
    getPosts({ author: slug, page, limit: 10 }),
  ]);

  if (!author) notFound();

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-4xl font-semibold tracking-tight">{author.name}</h1>
      {author.bio && (
        <p className="mt-3 max-w-2xl text-stone-600 dark:text-stone-400">
          {author.bio}
        </p>
      )}

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
            basePath={`/author/${slug}`}
          />
        </>
      ) : (
        <p className="mt-10 text-stone-500">No posts by this author yet.</p>
      )}
    </main>
  );
}

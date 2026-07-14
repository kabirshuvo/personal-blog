import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PostCard } from '@/components/blog/PostCard';
import { Pagination } from '@/components/blog/Pagination';
import { getCategory, getPosts } from '@/lib/server-api';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  return { title: category?.name ?? 'Category' };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [category, posts] = await Promise.all([
    getCategory(slug),
    getPosts({ category: slug, page, limit: 10 }),
  ]);

  if (!category) notFound();

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-4xl font-semibold tracking-tight">{category.name}</h1>
      {category.description && (
        <p className="mt-3 text-stone-600 dark:text-stone-400">
          {category.description}
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
            basePath={`/category/${slug}`}
          />
        </>
      ) : (
        <p className="mt-10 text-stone-500">No posts in this category yet.</p>
      )}
    </main>
  );
}

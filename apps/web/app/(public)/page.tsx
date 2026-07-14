import Link from 'next/link';
import { NewsletterForm } from '@/components/blog/NewsletterForm';
import { PostCard } from '@/components/blog/PostCard';
import {
  getCategories,
  getFeaturedPosts,
  getPosts,
  getTrendingPosts,
} from '@/lib/server-api';

export const revalidate = 60;

export default async function HomePage() {
  const [featured, latest, trending, categories] = await Promise.all([
    getFeaturedPosts(),
    getPosts({ limit: 6 }),
    getTrendingPosts(),
    getCategories(),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <section className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
          Personal publishing platform
        </p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight sm:text-6xl">
          Monalo Journal
        </h1>
        <p className="mt-6 text-lg leading-8 text-stone-600 dark:text-stone-300">
          Thoughtful writing on technology, creativity, and the craft of building
          things.
        </p>
      </section>

      {featured && featured.length > 0 && (
        <section className="mt-16">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Featured</h2>
            <Link
              href="/blog"
              className="text-sm text-stone-600 hover:underline dark:text-stone-400"
            >
              View all
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {featured.slice(0, 2).map((post) => (
              <PostCard key={post.id} post={post} featured />
            ))}
          </div>
        </section>
      )}

      {latest && latest.data.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-semibold">Latest posts</h2>
          <div className="grid gap-6">
            {latest.data.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {trending && trending.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-semibold">Trending</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trending.slice(0, 3).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {categories && categories.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-semibold">Categories</h2>
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="rounded-lg border border-stone-200 px-4 py-3 text-sm hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-900"
              >
                <span className="font-medium">{cat.name}</span>
                {cat._count && (
                  <span className="ml-2 text-stone-500">({cat._count.posts})</span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-16 rounded-xl border border-stone-200 bg-stone-50 p-8 dark:border-stone-800 dark:bg-stone-900/50">
        <h2 className="text-xl font-semibold">Stay in the loop</h2>
        <p className="mt-2 text-stone-600 dark:text-stone-400">
          Get new posts delivered to your inbox. No spam, unsubscribe anytime.
        </p>
        <div className="mt-4">
          <NewsletterForm />
        </div>
      </section>
    </main>
  );
}

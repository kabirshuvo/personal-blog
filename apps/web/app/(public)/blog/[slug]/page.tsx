import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookmarkButton } from '@/components/blog/BookmarkButton';
import { CategoryBadge } from '@/components/blog/CategoryBadge';
import { CommentSection } from '@/components/blog/CommentSection';
import { PostCard } from '@/components/blog/PostCard';
import { ShareButtons } from '@/components/blog/ShareButtons';
import { TagList } from '@/components/blog/TagList';
import { getPost, getRelatedPosts } from '@/lib/server-api';
import { formatDate } from '@/lib/utils';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Post not found' };
  return {
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt ?? undefined,
    openGraph: {
      title: post.metaTitle ?? post.title,
      description: post.metaDescription ?? post.excerpt ?? undefined,
      type: 'article',
      url: `/blog/${post.slug}`,
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const related = (await getRelatedPosts(slug)) ?? [];
  const siteUrl = process.env.WEB_ORIGIN ?? 'http://localhost:3000';
  const postUrl = `${siteUrl}/blog/${post.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    author: post.author ? { '@type': 'Person', name: post.author.name } : undefined,
    url: postUrl,
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article>
        <header>
          <div className="flex flex-wrap items-center gap-2 text-sm text-stone-500">
            {post.category && <CategoryBadge category={post.category} />}
            {post.publishedAt && (
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            )}
          </div>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight">{post.title}</h1>
          {post.author && (
            <p className="mt-4 text-stone-600 dark:text-stone-400">
              By{' '}
              <Link href={`/author/${post.author.slug}`} className="underline">
                {post.author.name}
              </Link>
            </p>
          )}
          {post.excerpt && (
            <p className="mt-4 text-lg text-stone-600 dark:text-stone-400">
              {post.excerpt}
            </p>
          )}
          <div className="mt-6">
            <BookmarkButton postId={post.id} />
          </div>
        </header>

        {post.content && (
          <div
            className="prose prose-stone dark:prose-invert mt-10 max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        )}

        <footer className="mt-12 space-y-4 border-t border-stone-200 pt-8 dark:border-stone-800">
          {post.tags && post.tags.length > 0 && <TagList tags={post.tags} />}
          <ShareButtons title={post.title} url={postUrl} />
        </footer>
      </article>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-semibold">Related posts</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {related.slice(0, 4).map((item) => (
              <PostCard key={item.id} post={item} />
            ))}
          </div>
        </section>
      )}

      <CommentSection postId={post.id} />
    </main>
  );
}

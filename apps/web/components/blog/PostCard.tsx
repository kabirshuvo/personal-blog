import Link from 'next/link';
import type { Post } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { CategoryBadge } from './CategoryBadge';
import { TagList } from './TagList';

type PostCardProps = {
  post: Post;
  featured?: boolean;
};

export function PostCard({ post, featured }: PostCardProps) {
  return (
    <article
      className={`group rounded-xl border border-stone-200 p-6 transition-colors hover:border-stone-300 dark:border-stone-800 dark:hover:border-stone-700 ${
        featured ? 'bg-stone-50 dark:bg-stone-900/50' : ''
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 text-sm text-stone-500">
        {post.category && <CategoryBadge category={post.category} />}
        {post.publishedAt && (
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
        )}
      </div>
      <h2 className="mt-3 text-xl font-semibold tracking-tight">
        <Link href={`/blog/${post.slug}`} className="hover:underline">
          {post.title}
        </Link>
      </h2>
      {post.excerpt && (
        <p className="mt-2 line-clamp-3 text-stone-600 dark:text-stone-400">
          {post.excerpt}
        </p>
      )}
      {post.author && (
        <p className="mt-4 text-sm text-stone-500">
          By{' '}
          <Link
            href={`/author/${post.author.slug}`}
            className="font-medium hover:underline"
          >
            {post.author.name}
          </Link>
        </p>
      )}
      {post.tags && post.tags.length > 0 && (
        <div className="mt-3">
          <TagList tags={post.tags} />
        </div>
      )}
    </article>
  );
}

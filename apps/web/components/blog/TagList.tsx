import Link from 'next/link';
import type { Tag } from '@/lib/types';

export function TagList({ tags }: { tags: Tag[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <li key={tag.id}>
          <Link
            href={`/tag/${tag.slug}`}
            className="text-xs text-stone-500 hover:text-stone-800 hover:underline dark:hover:text-stone-200"
          >
            #{tag.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

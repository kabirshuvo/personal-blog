import Link from 'next/link';
import type { Category } from '@/lib/types';

export function CategoryBadge({ category }: { category: Category }) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="inline-flex rounded-full bg-stone-200/80 px-2.5 py-0.5 text-xs font-medium text-stone-700 hover:bg-stone-300/80 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
    >
      {category.name}
    </Link>
  );
}

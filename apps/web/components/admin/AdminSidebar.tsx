'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  FileText,
  FolderOpen,
  Image,
  LayoutDashboard,
  Search,
  Settings,
  Tags,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/posts', label: 'Posts', icon: FileText },
  { href: '/admin/media', label: 'Media', icon: Image },
  { href: '/admin/categories', label: 'Categories', icon: FolderOpen },
  { href: '/admin/tags', label: 'Tags', icon: Tags },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/seo', label: 'SEO', icon: Search },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-900/50">
      <div className="border-b border-stone-200 px-4 py-5 dark:border-stone-800">
        <Link href="/admin" className="text-sm font-semibold">
          Monalo CMS
        </Link>
        <p className="text-xs text-stone-500">Content management</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-stone-200/80 font-medium text-stone-900 dark:bg-stone-800 dark:text-stone-100'
                  : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-stone-200 p-3 dark:border-stone-800">
        <Link
          href="/"
          className="block rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
        >
          View site
        </Link>
      </div>
    </aside>
  );
}

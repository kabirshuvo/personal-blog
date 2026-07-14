import { SiteFooter } from '@/components/blog/SiteFooter';
import { SiteHeader } from '@/components/blog/SiteHeader';

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}

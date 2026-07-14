import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { QueryProvider } from '@/components/providers/query-provider';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex flex-1 flex-col overflow-auto">{children}</div>
      </div>
    </QueryProvider>
  );
}

import './admin.css';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';

export const metadata = { title: 'Admin · Hundred Day Letters', robots: { index: false, follow: false } };

export default function AdminLayout({ children }) {
  return (
    <TooltipProvider>
      {children}
      <Toaster richColors position="top-center" /> {/* top, so toasts never cover the table's action buttons */}
    </TooltipProvider>
  );
}

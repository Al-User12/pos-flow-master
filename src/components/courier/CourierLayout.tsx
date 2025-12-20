import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Package, ClipboardList, History, User, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CourierLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/courier', icon: Package, label: 'Tersedia' },
  { path: '/courier/active', icon: ClipboardList, label: 'Aktif' },
  { path: '/courier/history', icon: History, label: 'Riwayat' },
  { path: '/courier/profile', icon: User, label: 'Profil' },
];

export function CourierLayout({ children }: CourierLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-secondary/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center">
              <Truck className="w-4 h-4 text-secondary-foreground" />
            </div>
            <span className="font-bold text-secondary-foreground">Osher Kurir</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
        <div className="flex items-center justify-around h-16">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full transition-colors",
                  isActive ? "text-secondary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs mt-1">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

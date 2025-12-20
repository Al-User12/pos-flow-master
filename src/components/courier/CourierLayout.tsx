import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Package, ClipboardList, History, User, Truck, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CourierNotifications } from './CourierNotifications';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface CourierLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/courier', icon: Package, label: 'Dashboard', exact: true },
  { path: '/courier/active', icon: ClipboardList, label: 'Aktif' },
  { path: '/courier/history', icon: History, label: 'Riwayat' },
  { path: '/courier/profile', icon: User, label: 'Profil' },
];

export function CourierLayout({ children }: CourierLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    toast.success('Berhasil logout');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-secondary border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-background/20 flex items-center justify-center ring-2 ring-background/30">
              <Truck className="w-5 h-5 text-secondary-foreground" />
            </div>
            <div>
              <span className="font-bold text-secondary-foreground text-lg">Osher Kurir</span>
              <p className="text-xs text-secondary-foreground/70">Delivery Partner</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CourierNotifications />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout}
              className="text-secondary-foreground/80 hover:text-secondary-foreground hover:bg-secondary-foreground/10"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <aside className="fixed left-0 top-[61px] bottom-0 w-64 bg-card border-r border-border p-4">
          <nav className="space-y-2">
            {navItems.map(({ path, icon: Icon, label, exact }) => {
              const isActive = exact ? location.pathname === path : location.pathname.startsWith(path);
              
              return (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    isActive 
                      ? "bg-secondary text-secondary-foreground shadow-md" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="ml-64 flex-1">
          <main className="container mx-auto px-6 py-6 max-w-4xl">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Content */}
      <main className="md:hidden container mx-auto px-4 py-4">
        {children}
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border md:hidden safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16">
          {navItems.map(({ path, icon: Icon, label, exact }) => {
            const isActive = exact ? location.pathname === path : location.pathname.startsWith(path);
            
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full transition-all duration-200 relative",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {isActive && (
                  <div className="absolute -top-0.5 w-12 h-1 bg-primary rounded-full" />
                )}
                <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
                <span className={cn("text-xs mt-1 font-medium", isActive && "font-semibold")}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

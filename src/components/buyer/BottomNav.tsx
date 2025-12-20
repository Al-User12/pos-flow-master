import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, ShoppingCart, ClipboardList, User } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/buyer', icon: Home, label: 'Home' },
  { path: '/buyer/catalog', icon: ShoppingBag, label: 'Katalog' },
  { path: '/buyer/cart', icon: ShoppingCart, label: 'Keranjang', showBadge: true },
  { path: '/buyer/orders', icon: ClipboardList, label: 'Pesanan' },
  { path: '/buyer/profile', icon: User, label: 'Profil' },
];

export function BottomNav() {
  const location = useLocation();
  const { totalItems } = useCart();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ path, icon: Icon, label, showBadge }) => {
          const isActive = location.pathname === path || 
            (path !== '/buyer' && location.pathname.startsWith(path));
          
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full relative transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {showBadge && totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

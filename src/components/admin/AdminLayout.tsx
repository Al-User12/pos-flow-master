import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Truck, 
  Wallet, 
  Settings, 
  LogOut,
  BarChart3,
  FileText,
  Box,
  DollarSign,
  Menu,
  X,
  ChevronRight,
  CreditCard
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { OrderNotifications } from './OrderNotifications';

import { Camera } from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Overview', path: '/admin', description: 'Ringkasan bisnis' },
  { icon: ShoppingCart, label: 'Pesanan', path: '/admin/orders', description: 'Kelola pesanan' },
  { icon: CreditCard, label: 'Pembayaran', path: '/admin/payments', description: 'Konfirmasi pembayaran' },
  { icon: Camera, label: 'Bukti Kirim', path: '/admin/delivery-proofs', description: 'Bukti pengiriman' },
  { icon: Package, label: 'Produk', path: '/admin/products', description: 'Kelola produk' },
  { icon: Box, label: 'Inventori', path: '/admin/inventory', description: 'Stok & mutasi' },
  { icon: DollarSign, label: 'Harga & HPP', path: '/admin/pricing', description: 'Kelola harga' },
  { icon: Users, label: 'Pelanggan', path: '/admin/customers', description: 'Data pembeli' },
  { icon: Truck, label: 'Kurir', path: '/admin/couriers', description: 'Data pengirim' },
  { icon: Wallet, label: 'Komisi', path: '/admin/commissions', description: 'Referral & payout' },
  { icon: BarChart3, label: 'Laporan', path: '/admin/reports', description: 'Analytics' },
  { icon: FileText, label: 'Audit Log', path: '/admin/audit', description: 'Riwayat aktivitas' },
  { icon: Settings, label: 'Pengaturan', path: '/admin/settings', description: 'Konfigurasi sistem' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, role } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-foreground/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center justify-between px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
              <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-sidebar-foreground">RetailPOS</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden text-sidebar-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-8rem)]">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
                isActive(item.path)
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
              {isActive(item.path) && <ChevronRight className="h-4 w-4 ml-auto" />}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border bg-sidebar">
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Keluar
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg lg:text-xl font-semibold text-foreground">
              {menuItems.find(item => isActive(item.path))?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <OrderNotifications />
            <span className="text-sm text-muted-foreground capitalize hidden sm:block">
              {role?.replace('_', ' ')}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

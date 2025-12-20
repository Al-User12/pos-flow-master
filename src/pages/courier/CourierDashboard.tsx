import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Truck, 
  Package, 
  LogOut, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Phone,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCourierStats, useCourierActiveOrders } from '@/hooks/useCourierData';
import { CourierNotifications } from '@/components/courier/CourierNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

const statusConfig: Record<string, { label: string; color: string }> = {
  assigned: { label: 'Siap Diambil', color: 'bg-blue-100 text-blue-800' },
  picked_up: { label: 'Diambil', color: 'bg-purple-100 text-purple-800' },
  on_delivery: { label: 'Dalam Pengantaran', color: 'bg-orange-100 text-orange-800' },
};

export default function CourierDashboard() {
  const navigate = useNavigate();
  const { user, signOut, loading, role } = useAuth();
  const { data: stats, isLoading: statsLoading } = useCourierStats();
  const { data: activeOrders, isLoading: ordersLoading } = useCourierActiveOrders();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (!loading && role && role !== 'courier') {
      if (role === 'buyer') navigate('/buyer');
      else if (['super_admin', 'admin_gudang', 'admin_keuangan'].includes(role)) navigate('/admin');
    }
  }, [user, loading, role, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Memuat...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-secondary">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg gradient-secondary flex items-center justify-center">
              <Truck className="h-5 w-5 text-secondary-foreground" />
            </div>
            <span className="text-xl font-bold text-secondary-foreground">RetailPOS Kurir</span>
          </div>

          <div className="flex items-center gap-2">
            <CourierNotifications />
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-secondary-foreground">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Dashboard Kurir</h1>
          <p className="mt-1 text-muted-foreground">
            Kelola pengantaran pesanan Anda
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Ditugaskan</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl font-bold">{stats?.assigned || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Dalam Antar</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl font-bold">{stats?.inDelivery || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Selesai Hari Ini</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl font-bold">{stats?.deliveredToday || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Bulan Ini</CardTitle>
              <Calendar className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl font-bold">{stats?.deliveredMonth || 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pesanan Aktif</CardTitle>
              <CardDescription>Pesanan yang perlu diantar</CardDescription>
            </div>
            <Link to="/courier/active">
              <Button variant="ghost" size="sm">
                Lihat Semua
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-4 p-4 border rounded-lg">
                    <Skeleton className="w-12 h-12 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activeOrders?.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                <Package className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium text-foreground">Belum Ada Pesanan</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                  Pesanan yang ditugaskan kepada Anda akan muncul di sini
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeOrders?.slice(0, 5).map((order: any) => {
                  const address = order.order_addresses?.[0];
                  const status = statusConfig[order.status] || statusConfig.assigned;
                  
                  return (
                    <Link 
                      key={order.id} 
                      to="/courier/active"
                      className="block"
                    >
                      <div className="flex gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                          <Package className="w-6 h-6 text-secondary-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="font-mono text-sm font-medium">{order.order_number}</p>
                            <Badge className={status.color} variant="secondary">
                              {status.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">
                              {address?.recipient_name} - {(address?.domiciles as any)?.name || address?.address}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="w-3 h-3" />
                              <span>{address?.phone}</span>
                            </div>
                            <p className="font-semibold text-primary">{formatPrice(order.total)}</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
                
                {(activeOrders?.length || 0) > 5 && (
                  <Link to="/courier/active">
                    <Button variant="outline" className="w-full">
                      Lihat {(activeOrders?.length || 0) - 5} Pesanan Lainnya
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom Navigation for Mobile */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
          <div className="flex items-center justify-around h-16">
            <Link to="/courier" className="flex flex-col items-center justify-center w-full h-full text-secondary-foreground">
              <Package className="w-5 h-5" />
              <span className="text-xs mt-1">Dashboard</span>
            </Link>
            <Link to="/courier/active" className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-foreground">
              <Truck className="w-5 h-5" />
              <span className="text-xs mt-1">Aktif</span>
            </Link>
            <Link to="/courier/history" className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-foreground">
              <Clock className="w-5 h-5" />
              <span className="text-xs mt-1">Riwayat</span>
            </Link>
          </div>
        </nav>
      </main>
    </div>
  );
}

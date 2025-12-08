import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Package, LogOut, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CourierDashboard() {
  const navigate = useNavigate();
  const { user, signOut, loading, role } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (!loading && role && role !== 'courier') {
      // Redirect to appropriate dashboard
      if (role === 'buyer') navigate('/buyer');
      else if (['super_admin', 'admin_gudang', 'admin_keuangan'].includes(role)) navigate('/admin');
    }
  }, [user, loading, role, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Memuat...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-secondary">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg gradient-secondary flex items-center justify-center">
              <Truck className="h-5 w-5 text-secondary-foreground" />
            </div>
            <span className="text-xl font-bold text-secondary-foreground">RetailPOS Kurir</span>
          </div>

          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Dashboard Kurir</h1>
          <p className="mt-1 text-muted-foreground">
            Kelola pengantaran pesanan Anda
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Order Tersedia</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Siap untuk diambil</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dalam Pengantaran</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Sedang diantar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Selesai Hari Ini</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Berhasil dikirim</p>
            </CardContent>
          </Card>
        </div>

        {/* Placeholder for orders list */}
        <Card>
          <CardHeader>
            <CardTitle>Order Tersedia</CardTitle>
            <CardDescription>Order yang siap untuk diambil dan diantar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium text-foreground">Belum Ada Order</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                Order yang siap diantar akan muncul di sini
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

import { 
  DollarSign,
  ShoppingCart,
  Package,
  Box,
  TrendingUp,
  Clock,
  Truck,
  Users
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminDashboardStats, useAdminOrders } from '@/hooks/useAdmin';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
}

const statusColors: Record<string, string> = {
  new: 'bg-info text-info-foreground',
  waiting_payment: 'bg-warning text-warning-foreground',
  paid: 'bg-success text-success-foreground',
  assigned: 'bg-primary text-primary-foreground',
  picked_up: 'bg-primary text-primary-foreground',
  on_delivery: 'bg-accent text-accent-foreground',
  delivered: 'bg-success text-success-foreground',
  cancelled: 'bg-destructive text-destructive-foreground',
};

const statusLabels: Record<string, string> = {
  new: 'Baru',
  waiting_payment: 'Menunggu Bayar',
  paid: 'Dibayar',
  assigned: 'Ditugaskan',
  picked_up: 'Diambil',
  on_delivery: 'Dikirim',
  delivered: 'Selesai',
  cancelled: 'Dibatalkan',
};

export default function AdminOverview() {
  const { data: stats, isLoading: statsLoading } = useAdminDashboardStats();
  const { data: recentOrders, isLoading: ordersLoading } = useAdminOrders();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(stats?.totalSalesToday || 0)}</div>
                <p className="text-xs text-muted-foreground">Hari ini</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pesanan Baru</CardTitle>
            <ShoppingCart className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.newOrdersCount || 0}</div>
                <p className="text-xs text-muted-foreground">Menunggu konfirmasi</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produk Aktif</CardTitle>
            <Package className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.activeProductsCount || 0}</div>
                <p className="text-xs text-muted-foreground">Tersedia di katalog</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stok Rendah</CardTitle>
            <Box className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.lowStockCount || 0}</div>
                <p className="text-xs text-muted-foreground">Perlu restok</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pesanan Terbaru
          </CardTitle>
          <CardDescription>5 pesanan terakhir yang masuk</CardDescription>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : recentOrders && recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.slice(0, 5).map((order) => (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.buyer?.full_name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(Number(order.total))}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={statusColors[order.status]}>
                        {statusLabels[order.status]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: id })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada pesanan
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card 
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => window.location.href = '/admin/products'}
        >
          <CardHeader>
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-base">Tambah Produk</CardTitle>
            <CardDescription>Buat produk baru di katalog</CardDescription>
          </CardHeader>
        </Card>

        <Card 
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => window.location.href = '/admin/inventory'}
        >
          <CardHeader>
            <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-info" />
            </div>
            <CardTitle className="text-base">Update Stok</CardTitle>
            <CardDescription>Tambah atau kurangi stok</CardDescription>
          </CardHeader>
        </Card>

        <Card 
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => window.location.href = '/admin/orders'}
        >
          <CardHeader>
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center mb-2">
              <Truck className="h-5 w-5 text-warning" />
            </div>
            <CardTitle className="text-base">Kelola Pesanan</CardTitle>
            <CardDescription>Lihat dan assign kurir</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

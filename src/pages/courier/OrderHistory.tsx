import { useState } from 'react';
import { Package, CheckCircle, XCircle, RotateCcw, Calendar, TrendingUp, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CourierLayout } from '@/components/courier/CourierLayout';
import { useOrderHistory, useCourierProfile } from '@/hooks/useCourier';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof CheckCircle }> = {
  delivered: { label: 'Terkirim', color: 'text-green-700', bgColor: 'bg-green-50', icon: CheckCircle },
  failed: { label: 'Gagal', color: 'text-red-700', bgColor: 'bg-red-50', icon: XCircle },
  returned: { label: 'Dikembalikan', color: 'text-gray-700', bgColor: 'bg-gray-100', icon: RotateCcw },
  cancelled: { label: 'Dibatalkan', color: 'text-amber-700', bgColor: 'bg-amber-50', icon: XCircle },
};

export default function OrderHistory() {
  const { data: profile } = useCourierProfile();
  const { data: orders, isLoading } = useOrderHistory(profile?.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter and search orders
  const filteredOrders = orders?.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.order_addresses?.[0]?.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const deliveredCount = orders?.filter(o => o.status === 'delivered').length || 0;
  const failedCount = orders?.filter(o => o.status === 'failed' || o.status === 'returned').length || 0;
  const successRate = orders?.length ? Math.round((deliveredCount / orders.length) * 100) : 0;

  return (
    <CourierLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Riwayat Pengiriman</h1>
        <p className="text-sm text-muted-foreground">Total {orders?.length || 0} pengiriman</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3 text-center">
            <CheckCircle className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold text-primary">{deliveredCount}</p>
            <p className="text-xs text-primary/70">Sukses</p>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="p-3 text-center">
            <XCircle className="w-5 h-5 text-destructive mx-auto mb-1" />
            <p className="text-xl font-bold text-destructive">{failedCount}</p>
            <p className="text-xs text-destructive/70">Gagal</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary border-secondary/50">
          <CardContent className="p-3 text-center">
            <TrendingUp className="w-5 h-5 text-secondary-foreground mx-auto mb-1" />
            <p className="text-xl font-bold text-secondary-foreground">{successRate}%</p>
            <p className="text-xs text-muted-foreground">Tingkat Sukses</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari order..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="delivered">Terkirim</SelectItem>
            <SelectItem value="failed">Gagal</SelectItem>
            <SelectItem value="returned">Dikembalikan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : filteredOrders?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-6">
            <Package className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            {orders?.length === 0 ? 'Belum Ada Riwayat' : 'Tidak Ditemukan'}
          </h3>
          <p className="text-muted-foreground text-center text-sm max-w-xs">
            {orders?.length === 0 
              ? 'Riwayat pengiriman Anda akan muncul di sini'
              : 'Coba ubah kata kunci pencarian atau filter'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders?.map((order, index) => {
            const status = statusConfig[order.status] || statusConfig.delivered;
            const StatusIcon = status.icon;
            const address = Array.isArray(order.order_addresses)
              ? order.order_addresses[0]
              : order.order_addresses;
            const domicile = address?.domiciles;

            return (
              <Card 
                key={order.id} 
                className="overflow-hidden animate-fade-in hover:shadow-md transition-shadow"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        status.bgColor
                      )}>
                        <StatusIcon className={cn("w-5 h-5", status.color)} />
                      </div>
                      <div>
                        <p className="font-mono text-sm font-semibold">{order.order_number}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(order.delivered_at || order.created_at)}</span>
                          <span>•</span>
                          <span>{formatTime(order.delivered_at || order.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className={cn(status.bgColor, status.color, "border-0")}>
                      {status.label}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{address?.recipient_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{(domicile as any)?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{formatPrice(order.total)}</p>
                      <p className="text-xs text-muted-foreground">{order.order_items?.length} item</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </CourierLayout>
  );
}

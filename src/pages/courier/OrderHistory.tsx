import { Package, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CourierLayout } from '@/components/courier/CourierLayout';
import { useOrderHistory, useCourierProfile } from '@/hooks/useCourier';

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  delivered: { label: 'Terkirim', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  failed: { label: 'Gagal', color: 'bg-red-100 text-red-800', icon: XCircle },
  returned: { label: 'Dikembalikan', color: 'bg-gray-100 text-gray-800', icon: RotateCcw },
};

export default function OrderHistory() {
  const { data: profile } = useCourierProfile();
  const { data: orders, isLoading } = useOrderHistory(profile?.id);

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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <CourierLayout>
      <h1 className="text-xl font-bold text-foreground mb-4">Riwayat Pengiriman</h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : orders?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Belum Ada Riwayat</h3>
          <p className="text-muted-foreground text-center text-sm">
            Riwayat pengiriman Anda akan muncul di sini
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders?.map((order) => {
            const status = statusConfig[order.status] || statusConfig.delivered;
            const StatusIcon = status.icon;
            const address = Array.isArray(order.order_addresses)
              ? order.order_addresses[0]
              : order.order_addresses;
            const domicile = address?.domiciles;

            return (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-mono text-sm font-medium">{order.order_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(order.delivered_at || order.created_at)}
                      </p>
                    </div>
                    <Badge className={status.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>

                  <div className="text-sm mb-2">
                    <p className="font-medium">{address?.recipient_name}</p>
                    <p className="text-muted-foreground">{(domicile as any)?.name}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {order.order_items?.length} item
                    </span>
                    <span className="font-bold text-primary">{formatPrice(order.total)}</span>
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

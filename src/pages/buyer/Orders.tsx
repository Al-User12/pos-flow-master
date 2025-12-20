import { Link } from 'react-router-dom';
import { ClipboardList, Package, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BuyerLayout } from '@/components/buyer/BuyerLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const statusConfig: Record<string, { label: string; color: string; icon: typeof Package }> = {
  new: { label: 'Baru', color: 'bg-blue-100 text-blue-800', icon: Package },
  waiting_payment: { label: 'Menunggu Pembayaran', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  paid: { label: 'Dibayar', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  assigned: { label: 'Kurir Ditugaskan', color: 'bg-purple-100 text-purple-800', icon: Package },
  picked_up: { label: 'Diambil', color: 'bg-indigo-100 text-indigo-800', icon: Package },
  on_delivery: { label: 'Dalam Pengiriman', color: 'bg-orange-100 text-orange-800', icon: Package },
  delivered: { label: 'Terkirim', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Dibatalkan', color: 'bg-red-100 text-red-800', icon: Package },
  failed: { label: 'Gagal', color: 'bg-red-100 text-red-800', icon: Package },
  returned: { label: 'Dikembalikan', color: 'bg-gray-100 text-gray-800', icon: Package },
};

export default function Orders() {
  const { profileId } = useAuth();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['buyer-orders', profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total,
          created_at,
          order_items (id, product_name, quantity)
        `)
        .eq('buyer_id', profileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profileId,
  });

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
    <BuyerLayout>
      <h1 className="text-xl font-bold text-foreground mb-4">Pesanan Saya</h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-6 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : orders?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
            <ClipboardList className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Belum Ada Pesanan</h2>
          <p className="text-muted-foreground text-center mb-6">
            Mulai belanja untuk melihat pesanan Anda di sini
          </p>
          <Link to="/buyer/catalog">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
              Mulai Belanja
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders?.map((order) => {
            const status = statusConfig[order.status] || statusConfig.new;
            const StatusIcon = status.icon;

            return (
              <Link key={order.id} to={`/buyer/orders/${order.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-mono text-sm font-medium">{order.order_number}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                      </div>
                      <Badge className={status.color} variant="secondary">
                        {status.label}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {order.order_items?.slice(0, 2).map((item: any) => (
                        <p key={item.id} className="truncate">
                          {item.product_name} x{item.quantity}
                        </p>
                      ))}
                      {(order.order_items?.length || 0) > 2 && (
                        <p className="text-xs">+{(order.order_items?.length || 0) - 2} item lainnya</p>
                      )}
                    </div>
                    <p className="font-bold text-primary">{formatPrice(order.total)}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </BuyerLayout>
  );
}

import { Link } from 'react-router-dom';
import { 
  ClipboardList, 
  Package, 
  Clock, 
  CheckCircle, 
  Truck, 
  CreditCard, 
  XCircle, 
  RotateCcw, 
  AlertCircle, 
  ChevronRight, 
  RefreshCw,
  Upload,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BuyerLayout } from '@/components/buyer/BuyerLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof Package }> = {
  new: { label: 'Baru', color: 'text-blue-700', bgColor: 'bg-blue-50', icon: Package },
  waiting_payment: { label: 'Menunggu Pembayaran', color: 'text-amber-700', bgColor: 'bg-amber-50', icon: Clock },
  paid: { label: 'Dibayar', color: 'text-green-700', bgColor: 'bg-green-50', icon: CreditCard },
  assigned: { label: 'Kurir Ditugaskan', color: 'text-purple-700', bgColor: 'bg-purple-50', icon: Truck },
  picked_up: { label: 'Diambil Kurir', color: 'text-indigo-700', bgColor: 'bg-indigo-50', icon: Package },
  on_delivery: { label: 'Dalam Pengiriman', color: 'text-orange-700', bgColor: 'bg-orange-50', icon: Truck },
  delivered: { label: 'Terkirim', color: 'text-green-700', bgColor: 'bg-green-50', icon: CheckCircle },
  cancelled: { label: 'Dibatalkan', color: 'text-red-700', bgColor: 'bg-red-50', icon: XCircle },
  refunded: { label: 'Dana Dikembalikan', color: 'text-amber-700', bgColor: 'bg-amber-50', icon: RotateCcw },
  failed: { label: 'Gagal', color: 'text-red-700', bgColor: 'bg-red-50', icon: AlertCircle },
  returned: { label: 'Dikembalikan', color: 'text-gray-700', bgColor: 'bg-gray-50', icon: RotateCcw },
};

export default function Orders() {
  const { profileId } = useAuth();
  const queryClient = useQueryClient();

  const { data: orders, isLoading, isRefetching } = useQuery({
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
          order_items (id, product_name, quantity),
          payment_confirmations (id, is_confirmed)
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

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['buyer-orders', profileId] });
  };

  // Group orders by status
  const unpaidOrders = orders?.filter(o => 
    (o.status === 'new' || o.status === 'waiting_payment') && 
    (!o.payment_confirmations || o.payment_confirmations.length === 0)
  ) || [];
  
  const processingOrders = orders?.filter(o => 
    ['paid', 'assigned', 'picked_up', 'on_delivery'].includes(o.status) ||
    ((o.status === 'new' || o.status === 'waiting_payment') && o.payment_confirmations && o.payment_confirmations.length > 0)
  ) || [];
  
  const completedOrders = orders?.filter(o => 
    ['delivered', 'cancelled', 'refunded', 'failed', 'returned'].includes(o.status)
  ) || [];

  const OrderCard = ({ order, index, showPaymentAction = false }: { order: any; index: number; showPaymentAction?: boolean }) => {
    const status = statusConfig[order.status] || statusConfig.new;
    const StatusIcon = status.icon;
    const hasPayment = order.payment_confirmations && order.payment_confirmations.length > 0;

    return (
      <div 
        className="block animate-fade-in"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <Card className={cn(
          "hover:shadow-md transition-all hover:border-primary/30 overflow-hidden",
          showPaymentAction && "border-amber-300 bg-amber-50/30"
        )}>
          {showPaymentAction && (
            <div className="bg-amber-100 px-4 py-2 flex items-center gap-2 text-amber-800">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Segera lakukan pembayaran</span>
            </div>
          )}
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-semibold truncate">{order.order_number}</p>
                <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
              </div>
              <Badge className={cn(status.bgColor, status.color, "border-0 gap-1 shrink-0 ml-2")}>
                <StatusIcon className="w-3 h-3" />
                {status.label}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground mb-3">
              {order.order_items?.slice(0, 2).map((item: any) => (
                <p key={item.id} className="truncate">
                  {item.product_name} <span className="text-foreground">x{item.quantity}</span>
                </p>
              ))}
              {(order.order_items?.length || 0) > 2 && (
                <p className="text-xs text-primary">+{(order.order_items?.length || 0) - 2} item lainnya</p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <p className="font-bold text-primary text-lg">{formatPrice(order.total)}</p>
              {showPaymentAction ? (
                <Link to={`/buyer/orders/${order.id}`}>
                  <Button size="sm" className="gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Bukti
                  </Button>
                </Link>
              ) : (
                <Link to={`/buyer/orders/${order.id}`}>
                  <Button variant="ghost" size="sm" className="gap-1">
                    Detail
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <BuyerLayout>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Pesanan Saya</h1>
          {orders && orders.length > 0 && (
            <p className="text-sm text-muted-foreground">{orders.length} pesanan</p>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleRefresh}
          disabled={isRefetching}
        >
          <RefreshCw className={cn("w-4 h-4", isRefetching && "animate-spin")} />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-5 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : orders?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-6">
            <ClipboardList className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Belum Ada Pesanan</h2>
          <p className="text-muted-foreground text-center mb-6 max-w-xs">
            Mulai belanja untuk melihat pesanan Anda di sini
          </p>
          <Link to="/buyer/catalog">
            <Button size="lg" className="gap-2">
              Mulai Belanja
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Unpaid Orders - Prominent Warning */}
          {unpaidOrders.length > 0 && (
            <div>
              <Alert className="mb-4 border-amber-300 bg-amber-50">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <span className="font-semibold">{unpaidOrders.length} pesanan</span> menunggu pembayaran. 
                  Upload bukti transfer sekarang agar pesanan segera diproses.
                </AlertDescription>
              </Alert>
              <h2 className="text-sm font-semibold text-amber-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Menunggu Pembayaran ({unpaidOrders.length})
              </h2>
              <div className="space-y-3">
                {unpaidOrders.map((order, index) => (
                  <OrderCard key={order.id} order={order} index={index} showPaymentAction />
                ))}
              </div>
            </div>
          )}

          {/* Processing Orders */}
          {processingOrders.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Sedang Diproses ({processingOrders.length})
              </h2>
              <div className="space-y-3">
                {processingOrders.map((order, index) => (
                  <OrderCard key={order.id} order={order} index={index} />
                ))}
              </div>
            </div>
          )}

          {/* Completed Orders */}
          {completedOrders.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Riwayat ({completedOrders.length})
              </h2>
              <div className="space-y-3">
                {completedOrders.map((order, index) => {
                  const status = statusConfig[order.status] || statusConfig.new;
                  const StatusIcon = status.icon;

                  return (
                    <Link 
                      key={order.id} 
                      to={`/buyer/orders/${order.id}`}
                      className="block animate-fade-in"
                      style={{ animationDelay: `${(processingOrders.length + index) * 50}ms` }}
                    >
                      <Card className="hover:shadow-md transition-all opacity-80 hover:opacity-100">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-mono text-sm font-medium truncate">{order.order_number}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                            </div>
                            <Badge variant="secondary" className={cn(status.bgColor, status.color, "border-0 gap-1")}>
                              <StatusIcon className="w-3 h-3" />
                              {status.label}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            {order.order_items?.slice(0, 1).map((item: any) => (
                              <p key={item.id} className="truncate">
                                {item.product_name} x{item.quantity}
                                {(order.order_items?.length || 0) > 1 && (
                                  <span className="text-xs ml-1">+{(order.order_items?.length || 0) - 1} lainnya</span>
                                )}
                              </p>
                            ))}
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-foreground">{formatPrice(order.total)}</p>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </BuyerLayout>
  );
}

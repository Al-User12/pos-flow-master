import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  Clock, 
  CheckCircle, 
  MapPin, 
  Phone, 
  User, 
  CreditCard,
  Truck,
  XCircle,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { BuyerLayout } from '@/components/buyer/BuyerLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const statusConfig: Record<string, { label: string; color: string; icon: typeof Package }> = {
  new: { label: 'Baru', color: 'bg-blue-100 text-blue-800', icon: Package },
  waiting_payment: { label: 'Menunggu Pembayaran', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  paid: { label: 'Dibayar', color: 'bg-green-100 text-green-800', icon: CreditCard },
  assigned: { label: 'Kurir Ditugaskan', color: 'bg-purple-100 text-purple-800', icon: Truck },
  picked_up: { label: 'Diambil Kurir', color: 'bg-indigo-100 text-indigo-800', icon: Package },
  on_delivery: { label: 'Dalam Pengiriman', color: 'bg-orange-100 text-orange-800', icon: Truck },
  delivered: { label: 'Terkirim', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Dibatalkan', color: 'bg-red-100 text-red-800', icon: XCircle },
  refunded: { label: 'Dikembalikan Dana', color: 'bg-amber-100 text-amber-800', icon: RotateCcw },
  failed: { label: 'Gagal', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  returned: { label: 'Dikembalikan', color: 'bg-gray-100 text-gray-800', icon: RotateCcw },
};

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { profileId } = useAuth();

  const { data: order, isLoading } = useQuery({
    queryKey: ['buyer-order-detail', orderId],
    queryFn: async () => {
      if (!orderId || !profileId) return null;
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            product_name,
            quantity,
            price_at_order,
            subtotal
          ),
          order_addresses (
            id,
            recipient_name,
            phone,
            address,
            landmark,
            notes,
            domiciles (name, city, province)
          ),
          order_status_history (
            id,
            status,
            notes,
            created_at
          ),
          courier_profiles (
            id,
            full_name,
            phone,
            vehicle_type,
            vehicle_plate
          ),
          payment_confirmations (
            id,
            amount,
            bank_name,
            is_confirmed,
            created_at
          ),
          delivery_proofs (
            id,
            photo_url,
            notes,
            created_at
          )
        `)
        .eq('id', orderId)
        .eq('buyer_id', profileId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!orderId && !!profileId,
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
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatShortDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <BuyerLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </BuyerLayout>
    );
  }

  if (!order) {
    return (
      <BuyerLayout>
        <div className="flex flex-col items-center justify-center py-16">
          <Package className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Pesanan Tidak Ditemukan</h2>
          <p className="text-muted-foreground mb-4">Pesanan yang Anda cari tidak ada</p>
          <Button onClick={() => navigate('/buyer/orders')}>
            Kembali ke Daftar Pesanan
          </Button>
        </div>
      </BuyerLayout>
    );
  }

  const status = statusConfig[order.status] || statusConfig.new;
  const StatusIcon = status.icon;
  const address = order.order_addresses?.[0];
  const courier = order.courier_profiles;
  const statusHistory = order.order_status_history?.sort(
    (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const payment = order.payment_confirmations?.[0];
  const deliveryProof = order.delivery_proofs?.[0];

  return (
    <BuyerLayout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/buyer/orders')}
          className="shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">{order.order_number}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
        </div>
        <Badge className={`${status.color} shrink-0`} variant="secondary">
          <StatusIcon className="w-3 h-3 mr-1" />
          {status.label}
        </Badge>
      </div>

      <div className="space-y-4 pb-6">
        {/* Order Items */}
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4" />
              Daftar Produk
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-3">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} x {formatPrice(item.price_at_order)}
                    </p>
                  </div>
                  <p className="font-medium text-sm">{formatPrice(item.subtotal)}</p>
                </div>
              ))}
            </div>
            
            <Separator className="my-3" />
            
            {/* Price Breakdown */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ongkos Kirim</span>
                <span>{formatPrice(order.shipping_cost)}</span>
              </div>
              {order.admin_fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Biaya Admin</span>
                  <span>{formatPrice(order.admin_fee)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-primary">{formatPrice(order.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        {address && (
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Alamat Pengiriman
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{address.recipient_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{address.phone}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p>{address.address}</p>
                    {address.landmark && (
                      <p className="text-sm text-muted-foreground">Patokan: {address.landmark}</p>
                    )}
                    {address.domiciles && (
                      <p className="text-sm text-muted-foreground">
                        {address.domiciles.name}, {address.domiciles.city}, {address.domiciles.province}
                      </p>
                    )}
                  </div>
                </div>
                {address.notes && (
                  <div className="bg-muted p-2 rounded text-sm">
                    <p className="text-muted-foreground">Catatan: {address.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Courier Info */}
        {courier && (
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Informasi Kurir
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{courier.full_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a href={`tel:${courier.phone}`} className="text-primary hover:underline">
                    {courier.phone}
                  </a>
                </div>
                {courier.vehicle_type && (
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-muted-foreground" />
                    <span>{courier.vehicle_type} - {courier.vehicle_plate}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Info */}
        {payment && (
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Informasi Pembayaran
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jumlah</span>
                  <span className="font-medium">{formatPrice(payment.amount)}</span>
                </div>
                {payment.bank_name && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bank</span>
                    <span>{payment.bank_name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={payment.is_confirmed ? 'default' : 'secondary'}>
                    {payment.is_confirmed ? 'Terkonfirmasi' : 'Menunggu Konfirmasi'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tanggal</span>
                  <span className="text-sm">{formatShortDate(payment.created_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delivery Proof */}
        {deliveryProof && (
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Bukti Pengiriman
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {deliveryProof.photo_url && (
                <img 
                  src={deliveryProof.photo_url} 
                  alt="Bukti pengiriman" 
                  className="w-full rounded-lg mb-3"
                />
              )}
              {deliveryProof.notes && (
                <p className="text-sm text-muted-foreground">{deliveryProof.notes}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {formatDate(deliveryProof.created_at)}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Status History */}
        {statusHistory && statusHistory.length > 0 && (
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Riwayat Status
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="relative">
                {statusHistory.map((history: any, index: number) => {
                  const historyStatus = statusConfig[history.status] || statusConfig.new;
                  const HistoryIcon = historyStatus.icon;
                  const isLast = index === statusHistory.length - 1;
                  
                  return (
                    <div key={history.id} className="flex gap-3 pb-4 last:pb-0">
                      <div className="relative">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${historyStatus.color}`}>
                          <HistoryIcon className="w-4 h-4" />
                        </div>
                        {!isLast && (
                          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-0.5 h-full bg-border" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{historyStatus.label}</p>
                        {history.notes && (
                          <p className="text-sm text-muted-foreground">{history.notes}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatShortDate(history.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Notes */}
        {order.notes && (
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-base">Catatan Pesanan</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </BuyerLayout>
  );
}

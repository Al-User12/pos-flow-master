import { useState, useEffect } from 'react';
import { Package, MapPin, Phone, ChevronRight, Loader2, Navigation, Clock, User, Clipboard, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CourierLayout } from '@/components/courier/CourierLayout';
import { DeliveryProofUpload } from '@/components/courier/DeliveryProofUpload';
import { useCourierActiveOrders } from '@/hooks/useCourierData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string; bgColor: string; nextStatus: string; nextLabel: string; step: number }> = {
  assigned: { label: 'Ditugaskan', color: 'text-purple-700', bgColor: 'bg-purple-50', nextStatus: 'picked_up', nextLabel: 'Ambil dari Gudang', step: 1 },
  picked_up: { label: 'Diambil', color: 'text-indigo-700', bgColor: 'bg-indigo-50', nextStatus: 'on_delivery', nextLabel: 'Mulai Antar', step: 2 },
  on_delivery: { label: 'Dalam Pengiriman', color: 'text-orange-700', bgColor: 'bg-orange-50', nextStatus: 'delivered', nextLabel: 'Selesai Antar', step: 3 },
};

export default function ActiveOrders() {
  const { profileId } = useAuth();
  const { data: orders, isLoading } = useCourierActiveOrders();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [proofDialogOpen, setProofDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Subscribe to real-time updates for courier's orders
  useEffect(() => {
    if (!profileId) return;

    const channel = supabase
      .channel('courier-active-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `courier_id=eq.${profileId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['courier-active-orders'] });
          queryClient.invalidateQueries({ queryKey: ['courier-stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId, queryClient]);

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

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (newStatus === 'delivered') {
      setSelectedOrder(orders?.find(o => o.id === orderId));
      setProofDialogOpen(true);
      return;
    }

    setUpdatingId(orderId);
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'picked_up') {
        updateData.picked_up_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Status diperbarui', {
        description: `Order berhasil diperbarui ke status: ${statusConfig[newStatus]?.label}`,
      });

      queryClient.invalidateQueries({ queryKey: ['courier-active-orders'] });
      queryClient.invalidateQueries({ queryKey: ['courier-stats'] });
    } catch (error: any) {
      toast.error('Gagal update status', {
        description: error.message,
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeliverySuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['courier-active-orders'] });
    queryClient.invalidateQueries({ queryKey: ['courier-order-history'] });
    queryClient.invalidateQueries({ queryKey: ['courier-stats'] });
  };

  const openMaps = (address: any) => {
    const query = encodeURIComponent(
      `${address?.address || ''}, ${(address?.domiciles as any)?.name || ''}`
    );
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Disalin ke clipboard');
  };

  return (
    <CourierLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Order Aktif</h1>
          <p className="text-sm text-muted-foreground">
            {orders?.length || 0} pesanan perlu diantar
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : orders?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-6">
            <Package className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Tidak Ada Order Aktif</h3>
          <p className="text-muted-foreground text-center text-sm max-w-xs">
            Order baru yang ditugaskan kepada Anda akan muncul di sini
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders?.map((order, index) => {
            const status = statusConfig[order.status];
            const address = Array.isArray(order.order_addresses)
              ? order.order_addresses[0]
              : order.order_addresses;
            const domicile = address?.domiciles;
            const isExpanded = expandedOrderId === order.id;

            return (
              <Card 
                key={order.id} 
                className={cn(
                  "overflow-hidden transition-all duration-300 animate-fade-in border-l-4",
                  status?.color.includes('purple') && "border-l-purple-500",
                  status?.color.includes('indigo') && "border-l-indigo-500",
                  status?.color.includes('orange') && "border-l-orange-500",
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="font-mono text-base">{order.order_number}</CardTitle>
                        <Badge className={cn(status?.bgColor, status?.color, "border-0")}>
                          {status?.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>Ditugaskan {formatTime(order.assigned_at || order.created_at)}</span>
                      </div>
                    </div>
                    <span className="font-bold text-lg text-primary">{formatPrice(order.total)}</span>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-2">
                  {/* Progress Steps */}
                  <div className="flex items-center gap-2 mb-4">
                    {[1, 2, 3].map((step) => (
                      <div 
                        key={step}
                        className={cn(
                          "flex-1 h-1.5 rounded-full transition-colors",
                          step <= (status?.step || 1) ? "bg-primary" : "bg-muted"
                        )}
                      />
                    ))}
                  </div>

                  {/* Address Card */}
                  <div 
                    className="bg-muted/50 rounded-xl p-4 mb-4 cursor-pointer"
                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground">{address?.recipient_name}</p>
                        <p className="text-sm text-muted-foreground truncate">{address?.address}</p>
                        {(domicile as any)?.name && (
                          <p className="text-xs text-muted-foreground">{(domicile as any)?.name}</p>
                        )}
                      </div>
                      <ChevronRight className={cn(
                        "w-5 h-5 text-muted-foreground transition-transform",
                        isExpanded && "rotate-90"
                      )} />
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-border space-y-3 animate-fade-in">
                        {address?.landmark && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-amber-500 mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground">Patokan</p>
                              <p className="text-sm">{address.landmark}</p>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-green-500" />
                            <a href={`tel:${address?.phone}`} className="text-sm font-medium text-primary">
                              {address?.phone}
                            </a>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(address?.phone || '');
                            }}
                          >
                            <Clipboard className="w-4 h-4" />
                          </Button>
                        </div>

                        {address?.notes && (
                          <Alert className="bg-amber-50 border-amber-200">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                            <AlertDescription className="text-amber-800 text-sm">
                              {address.notes}
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Items */}
                        <div className="pt-2">
                          <p className="text-xs text-muted-foreground mb-2">Produk:</p>
                          <div className="space-y-1">
                            {order.order_items?.map((item: any) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span>{item.product_name}</span>
                                <span className="font-medium">x{item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {order.notes && (
                          <div className="pt-2">
                            <p className="text-xs text-muted-foreground mb-1">Catatan Order:</p>
                            <p className="text-sm italic">{order.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-2"
                      onClick={() => openMaps(address)}
                    >
                      <Navigation className="w-4 h-4" />
                      Navigasi
                    </Button>
                    <Button
                      className="flex-1 gap-2"
                      onClick={() => handleUpdateStatus(order.id, status?.nextStatus)}
                      disabled={updatingId === order.id}
                    >
                      {updatingId === order.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          {status?.nextLabel}
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedOrder && (
        <DeliveryProofUpload
          orderId={selectedOrder.id}
          orderNumber={selectedOrder.order_number}
          isOpen={proofDialogOpen}
          onClose={() => {
            setProofDialogOpen(false);
            setSelectedOrder(null);
          }}
          onSuccess={handleDeliverySuccess}
        />
      )}
    </CourierLayout>
  );
}

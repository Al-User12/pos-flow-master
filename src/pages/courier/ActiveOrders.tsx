import { useState, useEffect } from 'react';
import { Package, MapPin, Phone, ChevronRight, Loader2, Camera, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { CourierLayout } from '@/components/courier/CourierLayout';
import { useCourierActiveOrders } from '@/hooks/useCourierData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const statusConfig: Record<string, { label: string; color: string; nextStatus: string; nextLabel: string }> = {
  assigned: { label: 'Ditugaskan', color: 'bg-purple-100 text-purple-800', nextStatus: 'picked_up', nextLabel: 'Ambil dari Gudang' },
  picked_up: { label: 'Diambil', color: 'bg-indigo-100 text-indigo-800', nextStatus: 'on_delivery', nextLabel: 'Mulai Antar' },
  on_delivery: { label: 'Dalam Pengiriman', color: 'bg-orange-100 text-orange-800', nextStatus: 'delivered', nextLabel: 'Selesai Antar' },
};

export default function ActiveOrders() {
  const { profileId, user } = useAuth();
  const { data: orders, isLoading } = useCourierActiveOrders();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [podDialogOpen, setPodDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [podNotes, setPodNotes] = useState('');
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

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (newStatus === 'delivered') {
      setSelectedOrder(orders?.find(o => o.id === orderId));
      setPodDialogOpen(true);
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

  const handleDelivered = async () => {
    if (!selectedOrder) return;

    setUpdatingId(selectedOrder.id);
    try {
      // Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString(),
        } as any)
        .eq('id', selectedOrder.id);

      if (orderError) throw orderError;

      // Create delivery proof
      const { error: podError } = await supabase
        .from('delivery_proofs')
        .insert({
          order_id: selectedOrder.id,
          photo_url: 'placeholder', // Would be actual photo upload
          notes: podNotes || null,
          created_by: user?.id,
        });

      if (podError) throw podError;

      toast.success('Pengiriman Selesai!', {
        description: 'Order berhasil diantarkan',
      });

      setPodDialogOpen(false);
      setSelectedOrder(null);
      setPodNotes('');
      queryClient.invalidateQueries({ queryKey: ['courier-active-orders'] });
      queryClient.invalidateQueries({ queryKey: ['courier-order-history'] });
      queryClient.invalidateQueries({ queryKey: ['courier-stats'] });
    } catch (error: any) {
      toast.error('Gagal menyelesaikan order', {
        description: error.message,
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const openMaps = (address: any) => {
    const query = encodeURIComponent(
      `${address?.address || ''}, ${(address?.domiciles as any)?.name || ''}`
    );
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  return (
    <CourierLayout>
      <h1 className="text-xl font-bold text-foreground mb-4">Order Aktif</h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      ) : orders?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Tidak Ada Order Aktif</h3>
          <p className="text-muted-foreground text-center text-sm">
            Ambil order dari halaman tersedia
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders?.map((order) => {
            const status = statusConfig[order.status];
            const address = Array.isArray(order.order_addresses)
              ? order.order_addresses[0]
              : order.order_addresses;
            const domicile = address?.domiciles;

            return (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-mono text-sm font-medium">{order.order_number}</p>
                      <Badge className={status?.color}>{status?.label}</Badge>
                    </div>
                    <span className="font-bold text-primary">{formatPrice(order.total)}</span>
                  </div>

                  {/* Address Details */}
                  <div className="bg-muted/50 rounded-lg p-3 mb-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">{address?.recipient_name}</p>
                        <p className="text-muted-foreground">{address?.address}</p>
                        {address?.landmark && (
                          <p className="text-muted-foreground text-xs">Patokan: {address.landmark}</p>
                        )}
                        <p className="text-muted-foreground">{(domicile as any)?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <a href={`tel:${address?.phone}`} className="text-sm text-primary">
                        {address?.phone}
                      </a>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        openMaps(address);
                      }}
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Buka di Maps
                    </Button>
                  </div>

                  {/* Items */}
                  <div className="text-sm text-muted-foreground mb-3">
                    {order.order_items?.map((item: any) => (
                      <p key={item.id}>{item.product_name} x{item.quantity}</p>
                    ))}
                  </div>

                  {order.notes && (
                    <p className="text-sm text-muted-foreground mb-3 italic">
                      Catatan: {order.notes}
                    </p>
                  )}

                  <Button
                    className="w-full gap-2"
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* POD Dialog */}
      <Dialog open={podDialogOpen} onOpenChange={setPodDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Pengiriman</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Foto bukti pengiriman</p>
              <Button variant="outline" size="sm" className="mt-2">
                Ambil Foto
              </Button>
            </div>
            <Textarea
              placeholder="Catatan pengiriman (opsional)"
              value={podNotes}
              onChange={(e) => setPodNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPodDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleDelivered} disabled={updatingId !== null}>
              {updatingId ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Konfirmasi Terkirim'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CourierLayout>
  );
}
